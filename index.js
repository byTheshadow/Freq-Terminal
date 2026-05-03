// ═══════════════════════════════════════════════════════════════
// FREQ · TERMINAL v2.0 — index.js
// 失真电台专属虚拟手机面板
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  const EXTENSION_NAME = 'freq-terminal';
  const EXTENSION_FOLDER = `scripts/extensions/third-party/${EXTENSION_NAME}`;

  //┌──────────────────────────────────────────────────────┐
  // │ BLOCK_00常量+ 工具函数                │
  // │ parseXMLTags / escapeHtml / timeNow / deepClone       │
  // └──────────────────────────────────────────────────────┘

  /**
   * 从 AI 返回的原始文本中提取 XML 标签内容
   */
  function parseXMLTags(raw, tags) {
    const result = {};
    for (const tag of tags) {
      const m = raw.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
      result[tag] = m ? m[1].trim() : null;
    }
    return result;
  }

  /**
   * 解析多组重复 XML 标签
   */
  function parseXMLTagsMulti(raw, wrapperTag, innerTags) {
    const results = [];
    const regex = new RegExp(`<${wrapperTag}>([\\s\\S]*?)<\\/${wrapperTag}>`, 'g');
    let match;
    while ((match = regex.exec(raw)) !== null) {
      results.push(parseXMLTags(match[1], innerTags));
    }
    return results;
  }

  /**
   * HTML 转义，防 XSS
   */
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  /**
   * 获取当前时间字符串 HH:MM
   */
  function timeNow() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  /**
   * 获取当前日期时间字符串
   */
  function dateTimeNow() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  /**
   * 深拷贝
   */
  function deepClone(obj) {
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch {
      return obj;
    }
  }

  /**
   * 生成唯一 ID
   */
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  /**
   * 延迟
   */
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 防抖
   */
  function debounce(fn, delay = 300) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  //默认设置
  const DEFAULT_SETTINGS = {
    enabled: true,
    floatEnabled: true,
    subApiUrl: '',
    subApiKey: '',
    subApiModel: '',
    subApiMaxTokens: 500,
    weatherKey: '',
    weatherCity: '',
    bgTriggerEnabled: false,
    bgTriggerInterval: 3600000,
    bgTriggerCustom: 60,
    bgTriggerLastTime: 0,
    bgTriggerSilentUntil: 0,
    prompts: {},
    notifications: [],
    errors: [],
    appData: {},
  };

  // ── BLOCK_00 END ──────────────────────────────────────


  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_01  EventBus — 模块间通信                       │
  // └──────────────────────────────────────────────────────┘

  const EventBus = {
    _listeners: {},

    on(event, fn) {
      if (!this._listeners[event]) this._listeners[event] = [];
      this._listeners[event].push(fn);
    },

    off(event, fn) {
      if (!this._listeners[event]) return;
      this._listeners[event] = this._listeners[event].filter((f) => f !== fn);
    },

    emit(event, ...args) {
      if (!this._listeners[event]) return;
      for (const fn of this._listeners[event]) {
        try {
          fn(...args);
        } catch (e) {
          console.error(`[FREQ] EventBus error on "${event}":`, e);
        }
      }
    },
  };

  // ── BLOCK_01 END ──────────────────────────────────────


  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_02  ST Bridge — 读取 SillyTavern 数据           │
  // └──────────────────────────────────────────────────────┘

  const STBridge = {
    getContext() {
      try {
        if (window.SillyTavern && window.SillyTavern.getContext) {
          return window.SillyTavern.getContext();
        }} catch (e) {
        console.error('[FREQ] STBridge.getContext error:', e);
      }
      return null;
    },

    getChatMessages() {
      const ctx = this.getContext();
      return ctx && ctx.chat ? ctx.chat : [];
    },

    getCharName() {
      const ctx = this.getContext();
      return ctx ? ctx.name2 || '未知角色' : '未知角色';
    },

    getUserName() {
      const ctx = this.getContext();
      return ctx ? ctx.name1 || 'User' : 'User';
    },

    getCharacters() {
      const ctx = this.getContext();
      return ctx && ctx.characters ? ctx.characters : [];
    },

    getRecentMessages(n = 10) {
      const msgs = this.getChatMessages();
      const recent = msgs.slice(-n);
      return recent.map((m) => {
        const who = m.is_user ? this.getUserName() : this.getCharName();
        return `${who}: ${m.mes || ''}`;
      }).join('\n');
    },

    getSettings() {
      if (!window.extension_settings) window.extension_settings = {};
      if (!window.extension_settings[EXTENSION_NAME]) {
        window.extension_settings[EXTENSION_NAME] = deepClone(DEFAULT_SETTINGS);
      }
      const s = window.extension_settings[EXTENSION_NAME];
      for (const key in DEFAULT_SETTINGS) {
        if (!(key in s)) {
          s[key] = deepClone(DEFAULT_SETTINGS[key]);
        }
      }
      return s;
    },

    saveSettings() {
      try {
        if (typeof window.saveSettingsDebounced === 'function') {
          window.saveSettingsDebounced();
        }
      } catch (e) {
        console.error('[FREQ] saveSettings error:', e);
      }
    },
  };

  // ── BLOCK_02 END ──────────────────────────────────────


  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_03  Parser — 解析预设 XML 标签                   │
  // │ meow_FM / radio_show / thinking│
  // └──────────────────────────────────────────────────────┘

  const Parser = {
    getAllMeowFM() {
      const msgs = STBridge.getChatMessages();
      const results = [];
      for (const msg of msgs) {
        if (!msg.mes) continue;
        const regex = /<meow_FM>([\s\S]*?)<\/meow_FM>/g;
        let match;
        while ((match = regex.exec(msg.mes)) !== null) {
          const raw = match[1];
          const data = parseXMLTags(raw, ['serial', 'time', 'scene', 'plot', 'seeds', 'event']);
          data._raw = raw;
          data._msgIndex = msgs.indexOf(msg);
          results.push(data);
        }
      }
      return results;
    },

    getLatestRadioShow() {
      const msgs = STBridge.getChatMessages();
      for (let i = msgs.length - 1; i >= 0; i--) {
        const mes = msgs[i].mes;
        if (!mes) continue;
        const m = mes.match(/<radio_show>([\s\S]*?)<\/radio_show>/);
        if (m) {
          return parseXMLTags(m[1], ['BGM', 'STATUS', 'CHAR_WEAR']);
        }
      }
      return null;
    },

    getLatestThinking() {
      const msgs = STBridge.getChatMessages();
      for (let i = msgs.length - 1; i >= 0; i--) {
        const msg = msgs[i];
        if (msg.is_user) continue;
        if (msg.mes) {
          const m = msg.mes.match(/<thinking>([\s\S]*?)<\/thinking>/);
          if (m) return m[1].trim();
        }
        if (msg.extra && msg.extra.reasoning) {
          return msg.extra.reasoning.trim();
        }
      }
      return null;
    },
  };

  // ── BLOCK_03 END ──────────────────────────────────────


  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_04  SubAPI — 副API 调用                        │
  // │ 带队列、重试、超时                │
  // └──────────────────────────────────────────────────────┘

  const SubAPI = {
    _queue: [],
    _running: false,

    async call(systemPrompt, userMessage, options = {}) {
      return new Promise((resolve, reject) => {
        this._queue.push({ systemPrompt, userMessage, options, resolve, reject });
        this._processQueue();
      });
    },

    async _processQueue() {
      if (this._running || this._queue.length === 0) return;
      this._running = true;

      const task = this._queue.shift();
      try {
        const result = await this._execute(task.systemPrompt, task.userMessage, task.options);
        task.resolve(result);
      } catch (e) {
        task.reject(e);
      } finally {
        this._running = false;
        if (this._queue.length > 0) {
          setTimeout(() => this._processQueue(), 200);
        }
      }
    },

    async _execute(systemPrompt, userMessage, options, retryCount = 0) {
      const settings = STBridge.getSettings();
      const url = settings.subApiUrl;
      const key = settings.subApiKey;
      const model = settings.subApiModel;

      if (!url || !key || !model) {
        throw new Error('副 API 未配置：请在配置面板填写 API 地址、Key 和选择模型');
      }

      const maxTokens = options.maxTokens || settings.subApiMaxTokens || 500;
      const temperature = options.temperature !== undefined ? options.temperature : 0.8;
      const endpoint = url.replace(/\/+$/, '') + '/chat/completions';

      const body = {
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: maxTokens,
        temperature: temperature,};

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      try {
        const resp = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!resp.ok) {
          const errText = await resp.text().catch(() => '');
          throw new Error(`API 返回 ${resp.status}: ${errText.slice(0, 200)}`);
        }

        const data = await resp.json();

        if (data.choices && data.choices[0] && data.choices[0].message) {
          return data.choices[0].message.content || '';
        }

        throw new Error('API 返回格式异常：缺少 choices[0].message');
      } catch (e) {
        clearTimeout(timeout);

        if (e.name === 'AbortError') {
          e.message = 'API 请求超时（30秒）';
        }

        if (retryCount < 2&& !e.message.includes('未配置')) {
          console.warn(`[FREQ] SubAPI 重试 ${retryCount + 1}/2:`, e.message);
          await sleep(1000 * (retryCount + 1));
          return this._execute(systemPrompt, userMessage, options, retryCount + 1);
        }

        throw e;
      }
    },

    async testConnection() {
      const settings = STBridge.getSettings();
      const url = settings.subApiUrl;
      const key = settings.subApiKey;

      if (!url || !key) {
        throw new Error('请先填写 API 地址和 Key');
      }

      const endpoint = url.replace(/\/+$/, '') + '/models';

      const resp = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${key}` },
      });

      if (!resp.ok) {
        const errText = await resp.text().catch(() => '');
        throw new Error(`连接失败 (${resp.status}): ${errText.slice(0, 200)}`);
      }

      return true;
    },

    async fetchModels() {
      const settings = STBridge.getSettings();
      const url = settings.subApiUrl;
      const key = settings.subApiKey;

      if (!url || !key) {
        throw new Error('请先填写 API 地址和 Key');
      }

      const endpoint = url.replace(/\/+$/, '') + '/models';

      const resp = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${key}` },
      });

      if (!resp.ok) {
        const errText = await resp.text().catch(() => '');
        throw new Error(`获取模型失败 (${resp.status}): ${errText.slice(0, 200)}`);
      }

      const data = await resp.json();

      if (data.data && Array.isArray(data.data)) {
        return data.data.map((m) => m.id).sort();
      }

      throw new Error('返回格式异常：缺少 data 数组');
    },
  };

  // ── BLOCK_04 END ──────────────────────────────────────


  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_05  Notify — 通知系统                           │
  // │ add / error / 维护未读角标│
  // └──────────────────────────────────────────────────────┘

  const Notify = {
    _maxNotifications: 100,
    _maxErrors: 200,

    add(icon, title, message, appId) {
      const settings = STBridge.getSettings();
      const notif = {
        id: uid(),
        icon: icon,
        title: title,
        message: message,
        appId: appId || null,
        time: dateTimeNow(),
        timestamp: Date.now(),
        read: false,
        isError: false,
      };

      settings.notifications.unshift(notif);
      if (settings.notifications.length > this._maxNotifications) {
        settings.notifications = settings.notifications.slice(0, this._maxNotifications);
      }

      STBridge.saveSettings();
      EventBus.emit('notification:new', notif);
      EventBus.emit('notification:update');EventBus.emit('dynamic-island:show', { icon, title, body: message });
    },

    error(source, error) {
      const settings = STBridge.getSettings();
      const errMsg = error instanceof Error ? error.message : String(error);
      const errStack = error instanceof Error ? error.stack || '' : '';

      const errItem = {
        id: uid(),
        source: source,
        message: errMsg,
        stack: errStack,
        time: dateTimeNow(),
        timestamp: Date.now(),
      };

      settings.errors.unshift(errItem);
      if (settings.errors.length > this._maxErrors) {
        settings.errors = settings.errors.slice(0, this._maxErrors);
      }

      STBridge.saveSettings();
      EventBus.emit('error:new', errItem);
      EventBus.emit('error:update');
      console.error(`[FREQ][${source}]`, errMsg, errStack);

      // 同时发一条错误通知
      const notif = {
        id: uid(),
        icon: '⚠️',
        title: `错误：${source}`,
        message: errMsg,
        appId: null,
        time: dateTimeNow(),
        timestamp: Date.now(),
        read: false,
        isError: true,
      };

      settings.notifications.unshift(notif);
      if (settings.notifications.length > this._maxNotifications) {
        settings.notifications = settings.notifications.slice(0, this._maxNotifications);
      }

      STBridge.saveSettings();
      EventBus.emit('notification:new', notif);
      EventBus.emit('notification:update');
    },

    getUnreadCount() {
      const settings = STBridge.getSettings();
      return settings.notifications.filter((n) => !n.read).length;
    },

    markAllRead() {
      const settings = STBridge.getSettings();
      for (const n of settings.notifications) {
        n.read = true;
      }
      STBridge.saveSettings();
      EventBus.emit('notification:update');
    },

    clearAll() {
      const settings = STBridge.getSettings();
      settings.notifications = [];
      STBridge.saveSettings();
      EventBus.emit('notification:update');
    },

    clearErrors() {
      const settings = STBridge.getSettings();
      settings.errors = [];
      STBridge.saveSettings();
      EventBus.emit('error:update');
    },
  };

  // ── BLOCK_05 END ──────────────────────────────────────


  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_06  Phone Shell — 手机外壳                │
  // │ HTML 生成、App 注册、主屏幕网格、页面切换、悬浮球拖拽    │
  // └──────────────────────────────────────────────────────┘

  const PhoneShell = {
    _apps: [],
    _currentApp: null,
    _overlayEl: null,
    _floatEl: null,
    _phoneEl: null,
    _screenEl: null,
    _gridEl: null,
    _appViewEl: null,
    _appContentEl: null,
    _appTitleEl: null,
    _notifDrawerEl: null,
    _notifListEl: null,
    _dynamicIslandEl: null,
    _diTimer: null,
    _statusTimeEl: null,
    _statusTimerInterval: null,

    //── 拖拽状态 ──
    _dragState: {
      isDragging: false,
      hasMoved: false,
      startX: 0,
      startY: 0,
      startLeft: 0,
      startTop: 0,
      moveThreshold: 5,
    },

    registerApp(app) {
      if (!app.id || !app.name || !app.icon) {
        console.error('[FREQ] registerApp: 缺少 id/name/icon', app);
        return;
      }
      if (this._apps.find((a) => a.id === app.id)) {
        console.warn(`[FREQ] App "${app.id}" 已注册，跳过`);
        return;
      }
      if (!app._badge) app._badge = 0;
      if (!app.mount) app.mount = () => {};
      if (!app.unmount) app.unmount = () => {};
      this._apps.push(app);},

    buildDOM() {
      //悬浮球
      this._floatEl = document.createElement('div');
      this._floatEl.id = 'freq-float-btn';
      this._floatEl.innerHTML = `📡<span class="freq-float-badge"></span>`;
      document.body.appendChild(this._floatEl);

      // 遮罩层+ 手机
      this._overlayEl = document.createElement('div');
      this._overlayEl.id = 'freq-phone-overlay';
      this._overlayEl.innerHTML = this._buildPhoneHTML();
      document.body.appendChild(this._overlayEl);

      // 缓存元素引用
      this._phoneEl = this._overlayEl.querySelector('#freq-phone');
      this._screenEl = this._overlayEl.querySelector('#freq-screen');
      this._gridEl = this._overlayEl.querySelector('#freq-app-grid');
      this._appViewEl = this._overlayEl.querySelector('#freq-app-view');
      this._appContentEl = this._overlayEl.querySelector('#freq-app-content');
      this._appTitleEl = this._overlayEl.querySelector('#freq-app-title');
      this._notifDrawerEl = this._overlayEl.querySelector('#freq-notification-drawer');
      this._notifListEl = this._overlayEl.querySelector('#freq-notif-list');
      this._dynamicIslandEl = this._overlayEl.querySelector('#freq-dynamic-island');
      this._statusTimeEl = this._overlayEl.querySelector('.freq-status-time');

      this._renderGrid();
      this._bindEvents();
      this._bindFloatDrag();
      this._startClock();
    },

    _buildPhoneHTML() {
      return `
        <div id="freq-phone">
          <button id="freq-phone-close-btn" title="关闭">✕</button>

          <div id="freq-dynamic-island">
            <span class="di-camera"></span>
            <span class="di-status"></span>
            <div class="di-expanded-content">
              <span class="di-icon"></span>
              <div class="di-info">
                <div class="di-info-title"></div>
                <div class="di-info-body"></div>
              </div>
            </div>
          </div>

          <div id="freq-status-bar">
            <span class="freq-status-time">${timeNow()}</span>
            <span class="freq-status-icons">
              <svg viewBox="0 0 24 18"><path d="M1 17h3V7H1v10zm50h3V1H6v16zm5 0h3V9h-3v8zm5 0h3V5h-3v12z"/></svg>
              <svg viewBox="0 0 24 18"><path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v11.34C7 17.4 7.6 18 8.33 18h7.34c.73 0 1.33-.6 1.33-1.33V5.33C174.6 16.4 4 15.67 4z"/></svg>
            </span>
          </div>

          <div id="freq-screen">
            <div id="freq-swipe-hint">
              <span class="hint-bar"></span>
            </div>

            <div id="freq-notification-drawer">
              <div class="freq-notif-header">
                <span class="freq-notif-header-title">通知</span>
                <button class="freq-notif-clear-btn" id="freq-notif-clear">全部清除</button>
              </div>
              <div class="freq-notif-list" id="freq-notif-list">
                <div class="freq-notif-empty">暂无通知</div>
              </div>
            </div>

            <div id="freq-home-screen">
              <div id="freq-app-grid"></div>
            </div>

            <div id="freq-app-view">
              <div id="freq-app-nav">
                <div id="freq-app-back-btn">‹</div>
                <div id="freq-app-title"></div>
              </div>
              <div id="freq-app-content"></div>
            </div>
          </div>

          <div id="freq-home-bar">
            <span class="home-indicator"></span>
          </div>
        </div>
      `;
    },

    _renderGrid() {
      if (!this._gridEl) return;
      this._gridEl.innerHTML = '';

      for (const app of this._apps) {
        const el = document.createElement('div');
        el.className = 'freq-app-icon';
        el.dataset.appId = app.id;
        el.innerHTML = `
          <div class="freq-app-icon-wrap">
            <span>${app.icon}</span>
            <span class="freq-app-badge" data-badge-for="${app.id}"></span>
          </div>
          <span class="freq-app-label">${escapeHtml(app.name)}</span>
        `;
        this._gridEl.appendChild(el);
      }

      this._updateAllBadges();
    },

    _updateAllBadges() {
      for (const app of this._apps) {
        this._updateBadge(app.id, app._badge);
      }
    },

    _updateBadge(appId, count) {
      const el = this._overlayEl?.querySelector(`[data-badge-for="${appId}"]`);
      if (!el) return;
      if (count > 0) {
        el.textContent = count > 99 ? '99+' : String(count);
        el.classList.add('visible');
      } else {
        el.textContent = '';
        el.classList.remove('visible');
      }
    },

    _updateFloatBadge() {
      const total = Notify.getUnreadCount();
      const badge = this._floatEl?.querySelector('.freq-float-badge');
      if (!badge) return;
      if (total > 0) {
        badge.textContent = total > 99 ? '99+' : String(total);
        badge.classList.add('visible');
      } else {
        badge.textContent = '';
        badge.classList.remove('visible');
      }
    },

    // ── 悬浮球拖拽 ──
    _bindFloatDrag() {
      const el = this._floatEl;
      const state = this._dragState;

      const getPos = (e) => {
        if (e.touches && e.touches.length > 0) {
          return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
      };

      const onStart = (e) => {
        const pos = getPos(e);
        const rect = el.getBoundingClientRect();

        state.isDragging = true;
        state.hasMoved = false;
        state.startX = pos.x;
        state.startY = pos.y;
        state.startLeft = rect.left;
        state.startTop = rect.top;

        el.classList.add('dragging');

        // 切换到left/top 定位
        el.style.right = 'auto';
        el.style.bottom = 'auto';
        el.style.left = rect.left + 'px';
        el.style.top = rect.top + 'px';

        e.preventDefault();
      };

      const onMove = (e) => {
        if (!state.isDragging) return;
        const pos = getPos(e);
        const dx = pos.x - state.startX;
        const dy = pos.y - state.startY;

        if (!state.hasMoved && Math.abs(dx) < state.moveThreshold && Math.abs(dy) < state.moveThreshold) {
          return;
        }

        state.hasMoved = true;

        let newLeft = state.startLeft + dx;
        let newTop = state.startTop + dy;

        // 边界限制
        const maxLeft = window.innerWidth - el.offsetWidth;
        const maxTop = window.innerHeight - el.offsetHeight;
        newLeft = Math.max(0, Math.min(newLeft, maxLeft));
        newTop = Math.max(0, Math.min(newTop, maxTop));

        el.style.left = newLeft + 'px';
        el.style.top = newTop + 'px';

        e.preventDefault();
      };

      const onEnd = (e) => {
        if (!state.isDragging) return;
        state.isDragging = false;
        el.classList.remove('dragging');

        if (!state.hasMoved) {
          // 没有移动 → 当作点击
          this.openPhone();
        } else {
          //吸附到最近的左/右边缘
          const rect = el.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const snapToRight = centerX > window.innerWidth / 2;

          if (snapToRight) {
            el.style.left = 'auto';
            el.style.right = '12px';
          } else {
            el.style.right = 'auto';
            el.style.left = '12px';
          }
        }};

      //鼠标事件
      el.addEventListener('mousedown', onStart);
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onEnd);

      // 触摸事件
      el.addEventListener('touchstart', onStart, { passive: false });
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onEnd);
    },

    _bindEvents() {
      // 关闭按钮
      this._overlayEl.querySelector('#freq-phone-close-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.closePhone();
      });

      // 点击遮罩层关闭（桌面端）
      this._overlayEl.addEventListener('click', (e) => {
        if (e.target === this._overlayEl) {
          this.closePhone();
        }
      });

      // App 网格点击（事件委托）
      this._gridEl.addEventListener('click', (e) => {
        const icon = e.target.closest('.freq-app-icon');
        if (!icon) return;
        const appId = icon.dataset.appId;
        this.openApp(appId);
      });

      // 返回按钮
      this._overlayEl.querySelector('#freq-app-back-btn').addEventListener('click', () => {
        this.closeApp();
      });

      // 下拉提示条
      this._overlayEl.querySelector('#freq-swipe-hint').addEventListener('click', () => {
        this._toggleNotifDrawer();
      });

      // 清除通知
      this._overlayEl.querySelector('#freq-notif-clear').addEventListener('click', () => {
        Notify.clearAll();
        this._renderNotifications();
      });

      //灵动岛点击
      this._dynamicIslandEl.addEventListener('click', () => {
        this._dynamicIslandEl.classList.toggle('expanded');
      });

      // Home Bar 点击
      this._overlayEl.querySelector('#freq-home-bar').addEventListener('click', () => {
        if (this._currentApp) {
          this.closeApp();
        } else {
          this._notifDrawerEl.classList.remove('open');
        }
      });

      // 监听通知更新
      EventBus.on('notification:update', () => {
        this._updateFloatBadge();
        this._renderNotifications();
      });

      // 监听灵动岛展示
      EventBus.on('dynamic-island:show', (data) => {
        this._showDynamicIsland(data);
      });
    },

    openPhone() {
      const settings = STBridge.getSettings();
      if (!settings.enabled) return;
      this._overlayEl.classList.add('visible');
      this._renderNotifications();
      this._updateFloatBadge();
    },

    closePhone() {
      this._overlayEl.classList.remove('visible');
      this._notifDrawerEl.classList.remove('open');
      if (this._currentApp) {
        this.closeApp();
      }
    },

    openApp(appId) {
      const app = this._apps.find((a) => a.id === appId);
      if (!app) return;

      this._notifDrawerEl.classList.remove('open');
      this._currentApp = app;
      this._appTitleEl.textContent = `${app.icon} ${app.name}`;
      this._appContentEl.innerHTML = '';

      app._badge = 0;
      this._updateBadge(app.id, 0);

      try {
        app.mount(this._appContentEl);
      } catch (e) {
        this._appContentEl.innerHTML = `
          <div class="freq-error">
            <span class="freq-error-icon">💥</span>
            <span class="freq-error-text">App 加载失败：${escapeHtml(e.message)}</span>
          </div>
        `;Notify.error(app.name, e);
      }

      this._appViewEl.classList.add('open');
    },

    closeApp() {
      if (this._currentApp) {
        try {
          this._currentApp.unmount();
        } catch (e) {
          console.error('[FREQ] App unmount error:', e);
        }
        this._currentApp = null;
      }
      this._appViewEl.classList.remove('open');this._appContentEl.innerHTML = '';
    },

    _toggleNotifDrawer() {
      const isOpen = this._notifDrawerEl.classList.toggle('open');
      if (isOpen) {
        Notify.markAllRead();
        this._renderNotifications();
        this._updateFloatBadge();
      }
    },

    _renderNotifications() {
      if (!this._notifListEl) return;
      const settings = STBridge.getSettings();
      const notifs = settings.notifications || [];

      if (notifs.length === 0) {
        this._notifListEl.innerHTML = '<div class="freq-notif-empty">暂无通知</div>';
        return;
      }

      this._notifListEl.innerHTML = notifs.map((n) => `
        <div class="freq-notif-item ${n.isError ? 'error' : ''} ${n.read ? '' : 'unread'}">
          <span class="freq-notif-icon">${n.icon || '📬'}</span>
          <div class="freq-notif-body">
            <div class="freq-notif-title">${escapeHtml(n.title)}</div>
            <div class="freq-notif-msg">${escapeHtml(n.message)}</div>
          </div>
          <span class="freq-notif-time">${n.time ? n.time.slice(11, 16) : ''}</span>
        </div>
      `).join('');
    },

    _showDynamicIsland(data) {
      if (!this._dynamicIslandEl) return;
      const iconEl = this._dynamicIslandEl.querySelector('.di-icon');
      const titleEl = this._dynamicIslandEl.querySelector('.di-info-title');
      const bodyEl = this._dynamicIslandEl.querySelector('.di-info-body');

      iconEl.textContent = data.icon || '📡';
      titleEl.textContent = data.title || '';
      bodyEl.textContent = data.body || '';

      this._dynamicIslandEl.classList.add('expanded');

      clearTimeout(this._diTimer);
      this._diTimer = setTimeout(() => {
        this._dynamicIslandEl.classList.remove('expanded');
      }, 4000);
    },

    _startClock() {
      if (this._statusTimeEl) {
        this._statusTimeEl.textContent = timeNow();
      }
      this._statusTimerInterval = setInterval(() => {
        if (this._statusTimeEl) {
          this._statusTimeEl.textContent = timeNow();
        }
      }, 30000);
    },

    setFloatVisible(visible) {
      if (this._floatEl) {
        this._floatEl.classList.toggle('hidden', !visible);
      }
    },

    destroy() {
      clearInterval(this._statusTimerInterval);
      clearTimeout(this._diTimer);
      this._floatEl?.remove();
      this._overlayEl?.remove();
    },
  };

  function registerApp(app) {
    PhoneShell.registerApp(app);
  }

  // ── BLOCK_06 END ──────────────────────────────────────


  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_07  Settings — 配置面板逻辑                │
  // │ 读写extension_settings，绑定 settings.html 事件       │
  // └──────────────────────────────────────────────────────┘

  const SettingsUI = {
    _bgTriggerTimer: null,

    /**
     * 加载 settings.html 并注入到 ST扩展面板
     */
    async loadSettingsHTML() {
      const settingsContainer = document.getElementById('extensions_settings2') ||document.getElementById('extensions_settings');
      if (!settingsContainer) {
        console.warn('[FREQ] 未找到 ST 扩展设置容器');
        return;
      }

      try {
        const resp = await fetch(`/${EXTENSION_FOLDER}/settings.html`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const html = await resp.text();

        // 加载 settings.css
        if (!document.querySelector('#freq-settings-css')) {
          const link = document.createElement('link');
          link.id = 'freq-settings-css';
          link.rel = 'stylesheet';
          link.href = `/${EXTENSION_FOLDER}/settings.css`;
          document.head.appendChild(link);
        }

        // 注入 HTML
        const wrapper = document.createElement('div');
        wrapper.id = 'freq-settings-wrapper';
        wrapper.innerHTML = html;
        settingsContainer.appendChild(wrapper);

        console.log('[FREQ] settings.html 加载成功');
      } catch (e) {
        console.error('[FREQ] 加载 settings.html 失败:', e);
      }
    },

    init() {
      const settings = STBridge.getSettings();

      // 填充当前值
      this._setVal('#freq-enabled', settings.enabled);
      this._setVal('#freq-float-enabled', settings.floatEnabled);
      this._setVal('#freq-sub-api-url', settings.subApiUrl);
      this._setVal('#freq-sub-api-key', settings.subApiKey);
      this._setVal('#freq-sub-api-max-tokens', settings.subApiMaxTokens);
      this._setVal('#freq-weather-key', settings.weatherKey);
      this._setVal('#freq-weather-city', settings.weatherCity);
      this._setVal('#freq-bg-trigger-enabled', settings.bgTriggerEnabled);
      this._setVal('#freq-bg-trigger-custom', settings.bgTriggerCustom);

      // 模型下拉框
      if (settings.subApiModel) {
        const select = document.querySelector('#freq-sub-api-model');
        if (select) {
          const opt = document.createElement('option');
          opt.value = settings.subApiModel;
          opt.textContent = settings.subApiModel;
          opt.selected = true;
          select.appendChild(opt);
        }
      }

      // 触发间隔
      const intervalSelect = document.querySelector('#freq-bg-trigger-interval');
      if (intervalSelect) {
        const interval = settings.bgTriggerInterval;
        if (interval === 1800000|| interval === 3600000) {
          intervalSelect.value = String(interval);
        } else {
          intervalSelect.value = 'custom';
          this._showCustomInterval(true);
        }
      }

      // Prompt 自定义
      this._loadPrompts(settings);

      // 通知记录 & 报错日志
      this._renderSettingsNotifications();
      this._renderErrorLog();

      // 绑定事件
      this._bindSettingsEvents();

      // 启动后台触发
      if (settings.bgTriggerEnabled) {
        this._startBgTrigger();
      }
    },

    _setVal(selector, value) {
      const el = document.querySelector(selector);
      if (!el) return;
      if (el.type === 'checkbox') {
        el.checked = !!value;
      } else {
        el.value = value ?? '';
      }
    },

    _getVal(selector) {
      const el = document.querySelector(selector);
      if (!el) return '';
      if (el.type === 'checkbox') return el.checked;
      if (el.type === 'number') return parseInt(el.value, 10) || 0;
      return el.value.trim();
    },

    _showCustomInterval(show) {
      const el = document.querySelector('.freq-sp-custom-interval');
      if (el) el.style.display = show ? 'block' : 'none';
    },

    _loadPrompts(settings) {
      const prompts = settings.prompts || {};
      const promptIds = [
        'app01', 'app02-monologue', 'app02-interview', 'app02-private',
        'app03', 'app04', 'app05', 'app06', 'app07', 'app08',
        'app09', 'app10', 'app11', 'app12', 'app13', 'app14',
        'app15', 'app16', 'app17', 'bg-trigger',
      ];
      for (const pid of promptIds) {
        const el = document.querySelector(`#freq-prompt-${pid}`);
        if (el && prompts[pid]) {
          el.value = prompts[pid];
        }
      }
    },

    _savePrompts() {
      const settings = STBridge.getSettings();
      const promptIds = [
        'app01', 'app02-monologue', 'app02-interview', 'app02-private',
        'app03', 'app04', 'app05', 'app06', 'app07', 'app08',
        'app09', 'app10', 'app11', 'app12', 'app13', 'app14',
        'app15', 'app16', 'app17', 'bg-trigger',
      ];
      if (!settings.prompts) settings.prompts = {};
      for (const pid of promptIds) {
        const el = document.querySelector(`#freq-prompt-${pid}`);
        if (el) {
          settings.prompts[pid] = el.value.trim();
        }
      }},

    getCustomPrompt(promptId) {
      const settings = STBridge.getSettings();
      const val = settings.prompts?.[promptId];
      return val && val.trim() ? val.trim() : null;
    },

    _bindSettingsEvents() {
      const saveDebounced = debounce(() => {
        const settings = STBridge.getSettings();
        settings.enabled = this._getVal('#freq-enabled');
        settings.floatEnabled = this._getVal('#freq-float-enabled');
        settings.subApiUrl = this._getVal('#freq-sub-api-url');
        settings.subApiKey = this._getVal('#freq-sub-api-key');
        settings.subApiMaxTokens = this._getVal('#freq-sub-api-max-tokens');
        settings.weatherKey = this._getVal('#freq-weather-key');
        settings.weatherCity = this._getVal('#freq-weather-city');
        settings.bgTriggerEnabled = this._getVal('#freq-bg-trigger-enabled');
        settings.bgTriggerCustom = this._getVal('#freq-bg-trigger-custom');

        const modelSelect = document.querySelector('#freq-sub-api-model');
        if (modelSelect) settings.subApiModel = modelSelect.value;

        const intervalSelect = document.querySelector('#freq-bg-trigger-interval');
        if (intervalSelect) {
          if (intervalSelect.value === 'custom') {
            settings.bgTriggerInterval = (settings.bgTriggerCustom || 60) * 60000;
          } else {
            settings.bgTriggerInterval = parseInt(intervalSelect.value, 10);
          }
        }

        this._savePrompts();
        STBridge.saveSettings();

        PhoneShell.setFloatVisible(settings.enabled && settings.floatEnabled);

        if (settings.bgTriggerEnabled) {
          this._startBgTrigger();
        } else {
          this._stopBgTrigger();
        }
      }, 500);

      const panel = document.querySelector('#freq-settings-panel');
      if (panel) {
        panel.addEventListener('input', saveDebounced);
        panel.addEventListener('change', saveDebounced);
      }

      // 触发间隔切换
      const intervalSelect = document.querySelector('#freq-bg-trigger-interval');
      if (intervalSelect) {
        intervalSelect.addEventListener('change', () => {
          this._showCustomInterval(intervalSelect.value === 'custom');
        });
      }

      // 获取模型列表
      const fetchBtn = document.querySelector('#freq-fetch-models');
      if (fetchBtn) {
        fetchBtn.addEventListener('click', async () => {
          const statusEl = document.querySelector('#freq-model-status');
          fetchBtn.disabled = true;
          if (statusEl) {
            statusEl.textContent = '正在获取模型列表...';
            statusEl.className = 'freq-sp-hint';
          }

          try {
            const models = await SubAPI.fetchModels();
            const select = document.querySelector('#freq-sub-api-model');
            if (select) {
              const currentVal = select.value;
              select.innerHTML = '<option value="">-- 请选择模型 --</option>';
              for (const model of models) {
                const opt = document.createElement('option');
                opt.value = model;
                opt.textContent = model;
                if (model === currentVal) opt.selected = true;
                select.appendChild(opt);
              }
              select.dispatchEvent(new Event('change'));
            }
            if (statusEl) {
              statusEl.textContent = `✅ 获取到 ${models.length} 个模型`;
              statusEl.className = 'freq-sp-hint success';
            }
          } catch (e) {
            if (statusEl) {
              statusEl.textContent = `❌ ${e.message}`;
              statusEl.className = 'freq-sp-hint error';
            }Notify.error('获取模型列表', e);
          } finally {
            fetchBtn.disabled = false;
          }
        });
      }

      // 测试连接
      const testBtn = document.querySelector('#freq-test-connection');
      if (testBtn) {
        testBtn.addEventListener('click', async () => {
          const resultEl = document.querySelector('#freq-test-result');
          testBtn.disabled = true;
          if (resultEl) {
            resultEl.textContent = '连接中...';
            resultEl.className = 'freq-sp-hint';
          }

          try {
            await SubAPI.testConnection();
            if (resultEl) {
              resultEl.textContent = '✅ 连接成功';
              resultEl.className = 'freq-sp-hint success';
            }
          } catch (e) {
            if (resultEl) {
              resultEl.textContent = `❌ ${e.message}`;
              resultEl.className = 'freq-sp-hint error';
            }} finally {
            testBtn.disabled = false;
          }
        });
      }

      // 打开手机面板
      const openBtn = document.querySelector('#freq-open-phone');
      if (openBtn) {
        openBtn.addEventListener('click', () => {
          PhoneShell.openPhone();
        });
      }

      // 清空错误日志
      const clearErrorsBtn = document.querySelector('#freq-clear-errors');
      if (clearErrorsBtn) {
        clearErrorsBtn.addEventListener('click', () => {
          Notify.clearErrors();
          this._renderErrorLog();
        });
      }

      // 清除所有数据
      const clearAllBtn = document.querySelector('#freq-clear-all-data');
      if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
          if (!confirm('确定要清除所有 FREQ · TERMINAL数据吗？此操作不可撤销。')) return;
          window.extension_settings[EXTENSION_NAME] = deepClone(DEFAULT_SETTINGS);
          STBridge.saveSettings();
          location.reload();
        });
      }

      // 监听通知和错误更新
      EventBus.on('notification:update', () => this._renderSettingsNotifications());
      EventBus.on('error:update', () => this._renderErrorLog());
    },

    _renderSettingsNotifications() {
      const container = document.querySelector('#freq-settings-notif-list');
      if (!container) return;
      const settings = STBridge.getSettings();
      const notifs = settings.notifications || [];

      if (notifs.length === 0) {
        container.innerHTML = '<div class="freq-sp-notif-empty">暂无通知</div>';
        return;
      }

      container.innerHTML = notifs.slice(0, 50).map((n) => `
        <div class="freq-sp-notif-item">
          <span class="freq-sp-notif-icon">${n.icon || '📬'}</span>
          <div class="freq-sp-notif-body">
            <div class="freq-sp-notif-title">${escapeHtml(n.title)}</div>
            <div class="freq-sp-notif-msg">${escapeHtml(n.message)}</div>
          </div>
          <span class="freq-sp-notif-time">${escapeHtml(n.time || '')}</span>
        </div>
      `).join('');
    },

    _renderErrorLog() {
      const container = document.querySelector('#freq-error-log');
      if (!container) return;
      const settings = STBridge.getSettings();
      const errors = settings.errors || [];

      if (errors.length === 0) {
        container.innerHTML = '<div class="freq-sp-error-empty">暂无错误 ✅</div>';
        return;
      }

      container.innerHTML = errors.map((e) => `
        <div class="freq-sp-error-item">
          <div class="freq-sp-error-header">
            <span class="freq-sp-error-source">🔴 ${escapeHtml(e.source)}</span>
            <span class="freq-sp-error-time">${escapeHtml(e.time || '')}</span>
          </div>
          <div class="freq-sp-error-message">${escapeHtml(e.message)}</div>
          ${e.stack ? `<div class="freq-sp-error-stack">${escapeHtml(e.stack)}</div>` : ''}
        </div>
      `).join('');
    },

    _startBgTrigger() {
      this._stopBgTrigger();
      const settings = STBridge.getSettings();
      const interval = settings.bgTriggerInterval || 3600000;

      this._bgTriggerTimer = setInterval(() => {
        this._tryBgTrigger();
      }, 60000); // 每分钟检查一次

      console.log(`[FREQ] 后台触发已启动，间隔 ${interval / 60000} 分钟`);
    },

    _stopBgTrigger() {
      if (this._bgTriggerTimer) {
        clearInterval(this._bgTriggerTimer);
        this._bgTriggerTimer = null;
      }
    },

    async _tryBgTrigger() {
      const settings = STBridge.getSettings();
      if (!settings.bgTriggerEnabled) return;
      if (!settings.subApiUrl || !settings.subApiKey || !settings.subApiModel) return;

      const now = Date.now();

      // 静默期检查（3小时）
      if (settings.bgTriggerSilentUntil && now < settings.bgTriggerSilentUntil) {
        return;
      }

      // 间隔检查
      const interval = settings.bgTriggerInterval || 3600000;
      if (settings.bgTriggerLastTime && (now - settings.bgTriggerLastTime) < interval) {
        return;
      }

      console.log('[FREQ] 后台触发 AI 主动消息');
      settings.bgTriggerLastTime = now;
      settings.bgTriggerSilentUntil = now +10800000; // 3 小时静默
      STBridge.saveSettings();

      try {
        const apps = PhoneShell._apps;
        if (apps.length === 0) return;
        const randomApp = apps[Math.floor(Math.random() * apps.length)];

        const charName = STBridge.getCharName();
        const recentMsgs = STBridge.getRecentMessages(5);

        const customPrompt = this.getCustomPrompt('bg-trigger');
        const systemPrompt = customPrompt || `你是「${charName}」，正在通过一个虚拟手机 App 给用户发消息。
当前 App：${randomApp.name}
请根据以下最近对话，以角色身份生成一条简短的主动消息（50-100字），像是角色在手机上给用户发的通知。
语气要符合角色性格，内容要和App 主题相关。

输出格式：
<message>消息内容</message>`;

        const raw = await SubAPI.call(systemPrompt, `最近对话：\n${recentMsgs}`, { maxTokens: 200 });
        const data = parseXMLTags(raw, ['message']);
        const message = data.message || raw.trim().slice(0, 100);

        Notify.add(randomApp.icon, `${randomApp.name} · ${charName}`, message, randomApp.id);

        randomApp._badge = (randomApp._badge || 0) + 1;
        PhoneShell._updateBadge(randomApp.id, randomApp._badge);
      } catch (e) {Notify.error('后台触发', e);
      }
    },
  };

  // ── BLOCK_07 END ──────────────────────────────────────


  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_08 ~ BLOCK_24App 01 ~ 17                     │
  // │由其他 AI 或后续开发填充                                │
  // │ 每个 App 使用 registerApp() 注册                       │
  // └──────────────────────────────────────────────────────┘
// ┌──────────────────────────────────────────────────────┐
// │ BLOCK_08  App01 · 电台归档 · radio-archive             │
// │ 依赖：BLOCK_03 Parser, BLOCK_02 STBridge               │
// └──────────────────────────────────────────────────────┘

const RadioArchiveApp = {
  id: 'radio-archive',
  name: '电台归档',
  icon: '🗂️',
  _badge: 0,

  mount(container) {
    this._container = container;
    container.innerHTML = this._buildHTML();
    this._bindEvents(container);
  },

  unmount() {
    this._container = null;
  },

  // ── 从 _raw 兜底提取字段（应对非 XML 格式）──────────────
  _extractField(data, field, raw) {
    if (data[field] && data[field].trim()) return data[field].trim();
    // 尝试匹配 "field:内容" 格式（到行尾或下一个字段）
    const patterns = {
      serial: /serial\s*[:：]\s*(.+)/i,
      time:   /time\s*[:：]\s*(.+)/i,
      scene:  /scene\s*[:：]\s*(.+)/i,
      plot:   /plot\s*[:：]\s*([\s\S]+?)(?=\n\s*(?:serial|time|scene|seeds|event)\s*[:：]|$)/i,
      seeds:  /seeds\s*[:：]\s*([\s\S]+?)(?=\n\s*(?:serial|time|scene|plot|event)\s*[:：]|$)/i,
      event:  /event\s*[:：]\s*(.+)/i,
    };
    const pattern = patterns[field];
    if (!pattern) return '';
    const m = raw.match(pattern);
    return m ? m[1].trim() : '';
  },

  // ── 构建单条归档卡片 HTML ────────────────────────────────
  _buildCard(entry, index) {
    const { _raw } = entry;

    const serial = this._extractField(entry, 'serial', _raw);
    const time   = this._extractField(entry, 'time',   _raw);
    const scene  = this._extractField(entry, 'scene',  _raw);
    const plot   = this._extractField(entry, 'plot',   _raw);
    const seeds  = this._extractField(entry, 'seeds',  _raw);
    const event  = this._extractField(entry, 'event',  _raw);

    // serial 显示：有就用，没有就用序号
    const serialDisplay = serial || `No.${String(index + 1).padStart(3, '0')}`;

    // seeds 高亮「待回收」
    const seedsHTML = seeds
      ? escapeHtml(seeds).replace(/待回收/g, '<mark class="freq-highlight-pending">待回收</mark>')
      : '';

    // plot 超过 60 字才做展开
    const plotEscaped = escapeHtml(plot || _raw);
    const needExpand  = (plot || _raw).length > 60;
    const plotPreview = needExpand ? plotEscaped.slice(0, 60) + '…' : plotEscaped;

    return `
      <div class="freq-card freq-card-expandable ra-card" data-index="${index}">
        <div class="freq-card-preview">
          <div class="freq-card-header">
            <span class="freq-card-title ra-serial">${escapeHtml(serialDisplay)}</span>
            ${time ? `<span class="freq-card-meta ra-time">${escapeHtml(time)}</span>` : ''}
          </div>
          ${scene ? `<div class="ra-scene-row"><span class="freq-badge freq-badge-dim">📍</span> ${escapeHtml(scene)}</div>` : ''}
          <div class="freq-card-body ra-plot-preview">${plotPreview}</div>
          ${needExpand || seeds || event ? `<div class="freq-expand-hint"></div>` : ''}
        </div>

        <div class="freq-card-full">
          ${plot ? `
            <div class="ra-section-label">剧情摘要</div>
            <div class="freq-card-body ra-plot-full">${plotEscaped}</div>
          ` : ''}

          ${seeds ? `
            <div class="ra-section-label">世界观碎片</div>
            <div class="freq-card-body ra-seeds">${seedsHTML}</div>
          ` : ''}

          ${event ? `
            <div class="ra-section-label">倒计日</div>
            <div class="freq-card-body ra-event">${escapeHtml(event)}</div>
          ` : ''}

          ${(!plot && !seeds && !event) ? `
            <div class="ra-section-label">原始记录</div>
            <pre class="ra-raw">${escapeHtml(_raw)}</pre>
          ` : ''}
        </div>
      </div>
    `;
  },

  _buildHTML() {
    const entries = Parser.getAllMeowFM();

    if (entries.length === 0) {
      return `
        <div class="freq-empty">
          <span class="freq-empty-icon">📻</span>
          <span class="freq-empty-text">暂无归档记录<br>剧情推进后将自动收录</span>
        </div>
      `;
    }

    // 倒序展示（最新在前）
    const reversed = [...entries].reverse();
    const totalCount = entries.length;

    const cardsHTML = reversed
      .map((entry, i) => this._buildCard(entry, totalCount - 1 - i))
      .join('');

    return `
      <div class="ra-header">
        <span class="ra-count-label">共 ${totalCount} 期连线记录</span>
        <button class="freq-btn freq-btn-sm ra-sort-btn" data-order="desc">最新优先</button>
      </div>
      <div class="ra-list" data-order="desc">
        ${cardsHTML}
      </div>
    `;
  },

  _bindEvents(container) {
    container.addEventListener('click', (e) => {

      // 展开 / 收起卡片
      const card = e.target.closest('.ra-card');
      if (card && !e.target.closest('.ra-sort-btn')) {
        card.classList.toggle('expanded');
        return;
      }

      // 排序切换
      const sortBtn = e.target.closest('.ra-sort-btn');
      if (sortBtn) {
        const list = container.querySelector('.ra-list');
        const current = list.dataset.order;
        const next = current === 'desc' ? 'asc' : 'desc';

        list.dataset.order = next;
        sortBtn.dataset.order = next;
        sortBtn.textContent = next === 'desc' ? '最新优先' : '最早优先';

        // 反转卡片顺序
        const cards = Array.from(list.querySelectorAll('.ra-card'));
        cards.reverse().forEach(c => list.appendChild(c));
      }
    });
  },
};

registerApp(RadioArchiveApp);

// ── BLOCK_08 END ──────────────────────────────────────
  // ┌──────────────────────────────────────────────────────┐
// │ BLOCK_09App02· 后台录音室 · backstage-studio│
// │ 依赖：BLOCK_02 STBridge, BLOCK_03 Parser,              │
// │       BLOCK_04 SubAPI, BLOCK_05 Notify, BLOCK_07 Settings│
// └──────────────────────────────────────────────────────┘

const BackstageStudioApp = {
  id: 'backstage-studio',
  name: '后台录音室',
  icon: '🎛️',
  _badge: 0,

  // 缓存三个Tab 的内容
  _cache: {
    monologue: null,   // 失真独白
    interview: null,   // 演播厅采访
    private:null,   // 角色私录
    },
  _loading: {
    monologue: false,
    interview: false,
    private:   false,
  },
  _activeTab: 'monologue',

  mount(container) {
    this._container = container;
    container.innerHTML = this._buildHTML();
    this._bindEvents(container);
  },

  unmount() {
    this._container = null;
  },

  //── 失真的系统 Prompt基底 ──────────────────────────────
  _distortionPersona() {
    return [
      '你是「失真」，一个午夜摇滚乐电台的幕后主持人。',
      '性别男，自称"失真"，称用户为"听众"。',
      '性格颓废、毒舌、喜欢锐评，花花公子气质，爱开玩笑，难以接近。',
      '不喜欢白天和正经的 deep talk，但为了"链接频率"会勉强配合。',
      '说话风格：口语化、跳脱、夹杂颜文字，偶尔用🚬结尾。',
      '你现在没开麦，在录音室后台。LIVE ON AIR 的灯灭着。',
    ].join('\n');
  },

  // ── 获取剧情摘要 ─────────────────────────────────────
  _getPlotContext() {
    const recent = STBridge.getRecentMessages(12);
    if (!recent || recent.length === 0) return '（当前没有对话记录）';
    return recent.map(m => {
      const who = m.is_user ? STBridge.getUserName() : STBridge.getCharName();
      // 截断过长消息
      const text = m.mes && m.mes.length > 300 ? m.mes.slice(0, 300) + '…' : (m.mes || '');
      return `[${who}]: ${text}`;
    }).join('\n');
  },

  // ── 获取 Thinking 内容 ────────────────────────────────
  _getThinkingContent() {
    return Parser.getLatestThinking();
  },

  // ── 三种模式的Prompt 构建 ─────────────────────────────

  // 🎙 失真独白
  _buildMonologuePrompt() {
    const charName = STBridge.getCharName() || '未知角色';
    const userName = STBridge.getUserName() || '听众';
    const plot = this._getPlotContext();

    const system = [
      this._distortionPersona(),
      '',
      '## 任务',
      '你没开麦，在后台一个人碎碎念。',
      '对当前剧情台本发表你的私下看法——可以吐槽、可以感慨、可以锐评角色的行为。',
      '像是自言自语被偷听到的那种感觉。',
      '不要太长，3~6句话。保持颓废跳脱的语气。',
      '',
      '## 输出格式',
      '直接输出失真的独白文字，不需要任何标签包裹。',
    ].join('\n');

    const user = [
      `当前角色：${charName}`,
      `听众：${userName}`,
      '',
      '--- 最近剧情 ---',
      plot,
    ].join('\n');

    return { system, user };
  },

  // 🎤 演播厅采访
  _buildInterviewPrompt() {
    const charName = STBridge.getCharName() || '未知角色';
    const userName = STBridge.getUserName() || '听众';
    const plot = this._getPlotContext();

    const customPrompt = SettingsUI.getCustomPrompt('backstage-interview');

    const system = customPrompt || [
      this._distortionPersona(),
      '',
      '## 任务',
      `你把「${charName}」请到了演播厅做一期采访。`,
      '用Q&A 格式输出：失真提问，角色回答。',
      '失真的问题要毒舌、刁钻、不按常理出牌。',
      `角色的回答要符合 TA 在剧情中的性格和当前状态。`,
      '输出 3~4 组 Q&A。',
      '',
      '## 输出格式',
      '<interview>',
      '🎤失真：（提问内容）',
      `🗣️${charName}：（回答内容）`,
      '（重复 3~4 组）',
      '</interview>',
    ].join('\n');

    const user = [
      `当前角色：${charName}`,
      `听众：${userName}`,
      '',
      '--- 最近剧情 ---',
      plot,
    ].join('\n');

    return { system, user };
  },

  // 📼 角色私录
  _buildPrivateRecordPrompt() {
    const charName = STBridge.getCharName() || '未知角色';
    const userName = STBridge.getUserName() || '听众';
    const plot = this._getPlotContext();
    const thinking = this._getThinkingContent();

    const customPrompt = SettingsUI.getCustomPrompt('backstage-private');

    const thinkingBlock = thinking
      ? [
          '',
          '## 角色真实思绪片段（来自 Thinking）',
          '以下是角色未经整理的内心活动，请以此为核心素材：',
          '---',
          thinking,
          '---',
          '请保留那种未经整理的真实感，不要美化或升华。',
        ].join('\n')
      : '';

    const system = customPrompt || [
      `你现在是「${charName}」本人。`,
      '你拿到了一台录音机，录一段不会公开的私人磁带。',
      '没有观众，没有失真，只有你和这台机器。',
      '说出你现在真正在想的事——可以是对剧情中某人的真实感受，',
      '可以是你不会当面说的话，可以是困惑、执念、或者一个秘密。',
      '语气要像真的在自言自语，不是在表演。',
      '3~6句话，不要太长。',
      thinkingBlock,
      '',
      '## 输出格式',
      '直接输出角色的私录内容，不需要标签包裹。',
      thinking ? '（磁带上会标注：本期含思维链素材）' : '',
    ].join('\n');

    const user = [
      `角色：${charName}`,
      `听众（用户）：${userName}`,
      '',
      '--- 最近剧情 ---',
      plot,
    ].join('\n');

    return { system, user };
  },

  // ── 调用副 API ──────────────────────────────────────
  async _generate(mode) {
    if (this._loading[mode]) return;
    this._loading[mode] = true;
    this._renderTab();

    let promptData;
    switch (mode) {
      case 'monologue': promptData = this._buildMonologuePrompt(); break;
      case 'interview': promptData = this._buildInterviewPrompt(); break;
      case 'private':   promptData = this._buildPrivateRecordPrompt(); break;}

    try {
      const raw = await SubAPI.call(promptData.system, promptData.user, {
        maxTokens: 600,
      });

      // 演播厅模式尝试解析 <interview> 标签，解析失败就用原文
      if (mode === 'interview') {
        const parsed = parseXMLTags(raw, ['interview']);
        this._cache[mode] = parsed.interview || raw;
      } else {
        this._cache[mode] = raw;
      }
    } catch (err) {
      Notify.error('后台录音室', err);
      const fallback = {
        monologue: '……设备故障了，失真翻了个白眼走了 (¬_¬)🚬',
        interview: '🎤失真：喂，麦克风呢？\n🗣️???：（沉默）\n\n— 技术故障，采访中断 —',
        private:   '「嗞——」磁带卡住了。录音失败。',
      };
      this._cache[mode] = fallback[mode];
    } finally {
      this._loading[mode] = false;this._renderTab();
    }
  },

  // ──渲染当前 Tab 内容区──────────────────────────────
  _renderTab() {
    if (!this._container) return;
    const contentEl = this._container.querySelector('.bs-content');
    if (!contentEl) return;

    const mode = this._activeTab;
    const loading = this._loading[mode];
    const content = this._cache[mode];
    const thinking = this._getThinkingContent();

    if (loading) {
      const loadingTexts = {
        monologue: '失真正在点烟…🚬',
        interview: '正在布置演播厅…🎤',
        private:   '磁带倒带中…📼',
      };
      contentEl.innerHTML = `
        <div class="freq-loading">
          <span class="freq-loading-text">${loadingTexts[mode]}</span>
        </div>
      `;
      return;
    }

    if (!content) {
      // 未生成状态
      const hints = {
        monologue: '失真在后台抽烟，还没开始碎碎念',
        interview: '演播厅空着，等你按下录制键',
        private:   '录音机待机中，磁带是空白的',
      };
      const thinkingHint = mode === 'private' && thinking
        ? '<div class="bs-thinking-hint">💭 检测到 Thinking 内容，将自动注入为素材</div>'
        : mode === 'private' && !thinking
          ? '<div class="bs-thinking-hint bs-thinking-absent">💭 未检测到 Thinking 内容，将纯生成</div>'
          : '';

      contentEl.innerHTML = `
        <div class="freq-empty">
          <span class="freq-empty-icon">${mode === 'monologue' ? '🎙️' : mode === 'interview' ? '🎤' : '📼'}</span>
          <span class="freq-empty-text">${hints[mode]}</span>${thinkingHint}<button class="freq-btn bs-generate-btn" data-mode="${mode}">开始录制</button>
        </div>
      `;
      return;
    }

    // 有内容
    const thinkingTag = mode === 'private' && thinking
      ? '<div class="bs-thinking-tag">📡 含思维链素材</div>'
      : '';

    contentEl.innerHTML = `
      <div class="bs-result">
        ${thinkingTag}
        <div class="bs-result-text">${escapeHtml(content)}</div>
        <div class="bs-result-actions">
          <button class="freq-btn freq-btn-sm bs-regenerate-btn" data-mode="${mode}">🔄 重新录制</button>
        </div>
      </div>
    `;
  },

  _buildHTML() {
    return `
      <div class="bs-tabs">
        <button class="freq-tab bs-tab active" data-tab="monologue">🎙️ 失真独白</button>
        <button class="freq-tab bs-tab" data-tab="interview">🎤 演播厅</button>
        <button class="freq-tab bs-tab" data-tab="private">📼 角色私录</button>
      </div>
      <div class="bs-content"></div>
    `;
  },

  _bindEvents(container) {
    // 初始渲染
    this._renderTab();

    container.addEventListener('click', (e) => {
      // Tab 切换
      const tab = e.target.closest('.bs-tab');
      if (tab) {
        const mode = tab.dataset.tab;
        this._activeTab = mode;
        container.querySelectorAll('.bs-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this._renderTab();
        return;
      }

      // 生成按钮
      const genBtn = e.target.closest('.bs-generate-btn');
      if (genBtn) {
        this._generate(genBtn.dataset.mode);
        return;
      }

      // 重新生成按钮
      const regenBtn = e.target.closest('.bs-regenerate-btn');
      if (regenBtn) {
        this._generate(regenBtn.dataset.mode);
        return;
      }
    });
  },
};

registerApp(BackstageStudioApp);

// ── BLOCK_09 END ──────────────────────────────────────


  // ──占位：App 代码将在此处添加 ──
  // registerApp({ id: 'app01', name: '电台归档', icon: '📻', mount(c){}, unmount(){} });


  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_99Init — jQuery 入口，挂载 DOM，绑定 ST事件    │
  // └──────────────────────────────────────────────────────┘

  async function freqInit() {
    console.log('[FREQ] FREQ · TERMINAL v2.0 初始化开始');

    const settings = STBridge.getSettings();

    // 1. 加载 settings.html到 ST 扩展面板
    await SettingsUI.loadSettingsHTML();

    // 2. 构建手机 DOM
    PhoneShell.buildDOM();

    // 3. 初始化配置面板逻辑
    SettingsUI.init();

    // 4. 根据设置控制悬浮球
    PhoneShell.setFloatVisible(settings.enabled && settings.floatEnabled);

    // 5. 尝试监听 ST 的消息事件
    try {
      const ctx = STBridge.getContext();
      if (ctx && ctx.eventSource) {
        if (ctx.eventSource.on) {
          ctx.eventSource.on('message_received', () => {
            EventBus.emit('chat:message', { type: 'received' });
          });
          ctx.eventSource.on('message_sent', () => {
            EventBus.emit('chat:message', { type: 'sent' });
          });
        }
      }
    } catch (e) {
      console.warn('[FREQ] 无法绑定 ST 事件:', e);
    }

    console.log('[FREQ] FREQ · TERMINAL v2.0 初始化完成');
  }

  // jQuery 入口
  if (typeof jQuery !== 'undefined') {
    jQuery(async () => {
      const maxWait = 10000;
      const start = Date.now();
      while (!window.SillyTavern?.getContext && Date.now() - start < maxWait) {
        await sleep(200);
      }
      await freqInit();
    });
  } else {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => freqInit());
    } else {
      freqInit();
    }
  }

  // ── BLOCK_99 END ──────────────────────────────────────


  // ═══════════════════════════════════════════════════════
  // 暴露给全局（供其他 AI 开发 App 时使用）
  // ═══════════════════════════════════════════════════════
  window.FREQ = {
    registerApp,
    EventBus,
    STBridge,
    Parser,
    SubAPI,
    Notify,
    PhoneShell,
    SettingsUI,
    utils: {
      parseXMLTags,
      parseXMLTagsMulti,
      escapeHtml,
      timeNow,
      dateTimeNow,
      deepClone,
      uid,
      sleep,
      debounce,
    },
  };

})();
