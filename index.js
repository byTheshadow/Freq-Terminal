//╔══════════════════════════════════════════════════════════╗
// ║  📻FREQ · TERMINAL — 频率终端                ║
// ║  「失真电台」专属 SillyTavern 插件 v0.2.0                ║
// ║  阶段 3：副API +后台录音室 + 通知系统 + 错误日志        ║
// ╚══════════════════════════════════════════════════════════╝

(function () {
  'use strict';

  const EXTENSION_NAME = 'freq-terminal';
  const LOG_PREFIX = '[FreqTerminal]';

  // ════════════════════════════════════════════════════════
  //§1EventBus
  // ════════════════════════════════════════════════════════
  const EventBus = {
    _listeners: {},
    on(event, cb) {
      if (!this._listeners[event]) this._listeners[event] = [];
      this._listeners[event].push(cb);
    },
    off(event, cb) {
      if (!this._listeners[event]) return;
      this._listeners[event] = this._listeners[event].filter(f => f !== cb);
    },
    emit(event, data) {
      if (!this._listeners[event]) return;
      this._listeners[event].forEach(cb => {
        try { cb(data); } catch (e) { console.error(LOG_PREFIX, 'EventBus error:', e); }
      });
    },};

  // ════════════════════════════════════════════════════════
  //  §2 ST Bridge
  // ════════════════════════════════════════════════════════
  function getContext() {
    return window.SillyTavern?.getContext?.() ?? null;
  }
  function getChatMessages() {
    return getContext()?.chat ?? [];
  }
  function getCurrentCharName() {
    return getContext()?.name2 ?? '';
  }
  function getUserName() {
    return getContext()?.name1 ?? 'User';
  }
  function getSettings() {
    if (!window.extension_settings) window.extension_settings = {};
    if (!window.extension_settings[EXTENSION_NAME]) {
      window.extension_settings[EXTENSION_NAME] = {
        subApiUrl: '',
        subApiKey: '',
        subApiModel: 'gpt-4o-mini',
        weatherKey: '',
        cosmicEnabled: false,
      };
    }
    return window.extension_settings[EXTENSION_NAME];
  }
  function saveSettings(patch) {
    const settings = getSettings();
    Object.assign(settings, patch);
    if (typeof window.saveSettingsDebounced === 'function') {
      window.saveSettingsDebounced();
    }
  }

  // ════════════════════════════════════════════════════════
  //  §3 Parser
  // ════════════════════════════════════════════════════════
  function parseMeowFMBlock(raw) {
    const get = (key) => {
      const m = raw.match(new RegExp(key + '\\s*[:：]\\s*(.+)', 'i'));
      return m ? m[1].trim() : '';
    };
    const plotMatch = raw.match(/plot\s*[:：]\s*([\s\S]*?)(?=\n\s*(?:seeds|event|cycle|todo|cash)\s*[:：]|$)/i);
    const plot = plotMatch ? plotMatch[1].trim() : '';
    return {
      serial: get('serial'),
      time: get('time'),
      scene: get('scene'),
      plot: plot,
      seeds: get('seeds'),
      event: get('event'),
      raw: raw,
    };
  }

  function extractAllMeowFM(messages) {
    const results = [];
    const regex = /<meow_FM>([\s\S]*?)<\/meow_FM>/gi;
    for (const msg of messages) {
      const text = msg.mes ?? msg.message ?? '';
      let match;
      while ((match = regex.exec(text)) !== null) {
        results.push(parseMeowFMBlock(match[1]));
      }regex.lastIndex = 0;
    }
    return results;
  }

  function extractRadioShow(messages) {
    for (let i = messages.length - 1; i >= 0; i--) {
      const text = messages[i].mes ?? '';
      const match = text.match(/<radio_show>([\s\S]*?)<\/radio_show>/i);
      if (match) {
        const raw = match[1];
        return {
          bgm: raw.match(/BGM\s*[:：]\s*(.+)/i)?.[1]?.trim() ?? '',
          status: raw.match(/STATUS\s*[:：]\s*(.+)/i)?.[1]?.trim() ?? '',
          wear: raw.match(/CHAR_WEAR\s*[:：]\s*(.+)/i)?.[1]?.trim() ?? '',};
      }
    }
    return null;
  }

  //提取所有 <thinking> 块
  function extractAllThinking(messages) {
    const results = [];
    const regex = /<thinking>([\s\S]*?)<\/thinking>/gi;
    for (let i = 0; i < messages.length; i++) {
      const text = messages[i].mes ?? messages[i].message ?? '';
      let match;
      while ((match = regex.exec(text)) !== null) {
        results.push({
          index: i,
          content: match[1].trim(),
          serial: results.length + 1,
        });
      }
      regex.lastIndex = 0;
    }
    return results;
  }

  // 获取最新一条 thinking
  function getLatestThinking(messages) {
    for (let i = messages.length - 1; i >= 0; i--) {
      const text = messages[i].mes ?? '';
      const match = text.match(/<thinking>([\s\S]*?)<\/thinking>/i);
      if (match) return match[1].trim();
      // 也检查 extra.reasoningconst reasoning = messages[i].extra?.reasoning;
      if (reasoning) return reasoning.trim();
    }
    return '';
  }

  // 获取最新 meow_FM 的plot
  function getLatestPlot(messages) {
    const all = extractAllMeowFM(messages);
    if (all.length === 0) return '';
    return all[all.length - 1].plot;
  }

  // ════════════════════════════════════════════════════════
  //  §4 Sub-API — 副 API 调用
  // ════════════════════════════════════════════════════════
  const SubAPI = {
    _queue: [],
    _running: 0,
    _maxConcurrent: 2,

    async call(systemPrompt, userPrompt, options = {}) {
      const s = getSettings();
      if (!s.subApiUrl || !s.subApiKey) {
        throw new Error('副API 未配置：请在扩展设置中填写地址和Key');
      }

      return new Promise((resolve, reject) => {
        this._queue.push({ systemPrompt, userPrompt, options, resolve, reject });
        this._processQueue();
      });
    },

    async _processQueue() {
      if (this._running >= this._maxConcurrent || this._queue.length === 0) return;
      this._running++;
      const task = this._queue.shift();

      try {
        const result = await this._doCall(task.systemPrompt, task.userPrompt, task.options);
        task.resolve(result);
      } catch (e) {
        task.reject(e);
      } finally {
        this._running--;
        this._processQueue();
      }
    },

    async _doCall(systemPrompt, userPrompt, options = {}) {
      const s = getSettings();
      const maxRetries = options.retries ?? 3;
      let lastError;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const url = s.subApiUrl.replace(/\/+$/, '') + '/chat/completions';
          const body = {
            model: s.subApiModel || 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            max_tokens: options.maxTokens ?? 800,
            temperature: options.temperature ?? 0.8,
          };

          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 30000);

          const resp = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${s.subApiKey}`,
            },
            body: JSON.stringify(body),
            signal: controller.signal,
          });

          clearTimeout(timeout);

          if (!resp.ok) {
            const errText = await resp.text().catch(() => '');
            throw new Error(`API ${resp.status}: ${errText.slice(0, 200)}`);
          }

          const data = await resp.json();
          const content = data.choices?.[0]?.message?.content ?? '';
          if (!content) throw new Error('API 返回空内容');
          return content;} catch (e) {
          lastError = e;
          if (attempt < maxRetries - 1) {
            await new Promise(r => setTimeout(r, 1000* Math.pow(2, attempt)));
          }
        }
      }
      throw lastError;
    },
  };

  // ════════════════════════════════════════════════════════
  //  §5 通知系统 + 错误日志
  // ════════════════════════════════════════════════════════
  const NotificationSystem = {
    _notifications: [],
    _errors: [],
    _maxItems: 50,

    addNotification(title, message, icon = '📻') {
      const item = {
        id: Date.now(),
        icon,
        title,
        message,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        read: false,
      };
      this._notifications.unshift(item);
      if (this._notifications.length > this._maxItems) this._notifications.pop();
      EventBus.emit('notification:new', item);
      this._updateBadge();
      return item;
    },

    addError(source, error) {
      const item = {
        id: Date.now(),
        source,
        message: error?.message ?? String(error),
        stack: error?.stack ?? '',
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),};
      this._errors.unshift(item);
      if (this._errors.length > this._maxItems) this._errors.pop();
      console.error(LOG_PREFIX, `[${source}]`, error);
      EventBus.emit('error:new', item);
      return item;
    },

    getUnreadCount() {
      return this._notifications.filter(n => !n.read).length;
    },

    markAllRead() {
      this._notifications.forEach(n => n.read = true);
      this._updateBadge();
    },

    _updateBadge() {
      const count = this.getUnreadCount();
      const badge = document.getElementById('freq-notif-badge');
      if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
      }
    },
  };

  // ════════════════════════════════════════════════════════
  //  §6 App Registry + Phone Shell
  // ════════════════════════════════════════════════════════
  const appRegistry = [];
  let currentAppId = null;
  let phoneOpen = false;

  function registerApp(app) {
    app._badge = app._badge ??0;
    appRegistry.push(app);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function buildPhoneHTML() {
    return `
      <div id="freq-phone-shell" style="display:none;">
        <div class="freq-phone">
          <div class="freq-phone-notch">
            <span class="freq-phone-signal">📶</span>
            <span class="freq-phone-title">FREQ · TERMINAL</span><span class="freq-phone-time" id="freq-clock">--:--</span>
          </div>
          <div class="freq-phone-screen">
            <div class="freq-home" id="freq-home">
              <div class="freq-app-grid" id="freq-app-grid"></div>
            </div>
            <div class="freq-app-view" id="freq-app-view" style="display:none;"></div>
          </div>
          <div class="freq-phone-bar">
            <button class="freq-bar-btn" id="freq-home-btn" title="主屏幕">◼</button>
            <button class="freq-bar-btn" id="freq-notif-btn" title="通知中心">🔔
              <span class="freq-badge freq-notif-badge" id="freq-notif-badge" style="display:none;">0</span>
            </button>
          </div>
        </div><button class="freq-close-btn" id="freq-close-btn" title="关闭">✕</button>
      </div>
      <button id="freq-fab" title="打开频率终端">📻</button>
    `;
  }

  function renderAppGrid() {
    const grid = document.getElementById('freq-app-grid');
    if (!grid) return;
    grid.innerHTML = '';
    appRegistry.forEach(app => {
      const btn = document.createElement('button');
      btn.className = 'freq-app-icon';
      btn.innerHTML = `
        <span class="freq-app-icon-emoji">${app.icon}</span>
        <span class="freq-app-icon-name">${app.name}</span>
        ${app._badge > 0 ? `<span class="freq-badge">${app._badge}</span>` : ''}
      `;
      btn.addEventListener('click', () => openApp(app.id));
      grid.appendChild(btn);
    });
  }

  function openApp(appId) {
    const app = appRegistry.find(a => a.id === appId);
    if (!app) return;
    if (currentAppId && currentAppId !== appId) {
      const prev = appRegistry.find(a => a.id === currentAppId);
      if (prev && prev.unmount) prev.unmount();
    }
    const homeEl = document.getElementById('freq-home');
    const viewEl = document.getElementById('freq-app-view');
    if (!homeEl || !viewEl) return;
    homeEl.style.display = 'none';
    viewEl.style.display = 'flex';
    viewEl.innerHTML = '';
    currentAppId = appId;
    app._badge = 0;
    renderAppGrid();
    if (app.mount) app.mount(viewEl);
  }

  function goHome() {
    if (currentAppId) {
      const app = appRegistry.find(a => a.id === currentAppId);
      if (app && app.unmount) app.unmount();
      currentAppId = null;
    }
    const homeEl = document.getElementById('freq-home');
    const viewEl = document.getElementById('freq-app-view');
    if (homeEl) homeEl.style.display = 'flex';
    if (viewEl) { viewEl.style.display = 'none'; viewEl.innerHTML = ''; }
  }

  function togglePhone() {
    phoneOpen = !phoneOpen;
    const shell = document.getElementById('freq-phone-shell');
    const fab = document.getElementById('freq-fab');
    if (shell) shell.style.display = phoneOpen ? 'flex' : 'none';
    if (fab) fab.classList.toggle('freq-fab-active', phoneOpen);
    if (phoneOpen) renderAppGrid();
  }

  function updateClock() {
    const el = document.getElementById('freq-clock');
    if (!el) return;
    const now = new Date();
    el.textContent = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  }

  // ════════════════════════════════════════════════════════
  //  §7 Settings Panel
  // ════════════════════════════════════════════════════════
  function buildSettingsHTML() {
    const s = getSettings();
    return `
      <div class="inline-drawer">
        <div class="inline-drawer-toggle inline-drawer-header">
          <b>📻 Freq · Terminal</b>
          <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
        </div>
        <div class="inline-drawer-content" style="font-size:small;">
          <div class="freq-settings-inner">
            <label class="freq-s-row">
              <span>副API 地址</span>
              <input type="text" id="freq_sub_api_url" class="text_pole" placeholder="https://api.openai.com/v1" value="${s.subApiUrl ?? ''}" />
            </label>
            <label class="freq-s-row">
              <span>副 API Key</span>
              <input type="password" id="freq_sub_api_key" class="text_pole" placeholder="sk-..." value="${s.subApiKey ?? ''}" />
            </label>
            <label class="freq-s-row">
              <span>副 API 模型</span>
              <input type="text" id="freq_sub_api_model" class="text_pole" placeholder="gpt-4o-mini" value="${s.subApiModel ?? ''}" />
            </label>
            <label class="freq-s-row">
              <span>和风天气 Key（可选）</span>
              <input type="text" id="freq_weather_key" class="text_pole" placeholder="可选" value="${s.weatherKey ?? ''}" />
            </label>
            <label class="freq-s-row freq-s-toggle">
              <span>宇宙频率感知</span>
              <input type="checkbox" id="freq_cosmic_enabled" ${s.cosmicEnabled ? 'checked' : ''} />
            </label>
            <div id="freq_settings_status" style="color:#A32D2D;font-size:11px;min-height:16px;margin-top:4px;"></div>
          </div>
        </div>
      </div>
    `;
  }

  function bindSettingsEvents() {
    const fields = [
      { id: 'freq_sub_api_url', key: 'subApiUrl', type: 'text' },
      { id: 'freq_sub_api_key', key: 'subApiKey', type: 'text' },
      { id: 'freq_sub_api_model', key: 'subApiModel', type: 'text' },
      { id: 'freq_weather_key', key: 'weatherKey', type: 'text' },
      { id: 'freq_cosmic_enabled', key: 'cosmicEnabled', type: 'checkbox' },
    ];
    fields.forEach(f => {
      const el = document.getElementById(f.id);
      if (!el) return;
      el.addEventListener(f.type === 'checkbox' ? 'change' : 'input', () => {
        saveSettings({ [f.key]: f.type === 'checkbox' ? el.checked : el.value.trim() });
        const status = document.getElementById('freq_settings_status');
        if (status) { status.textContent = '✓ 已保存'; setTimeout(() => { status.textContent = ''; }, 1500); }
      });
    });
  }

  // ════════════════════════════════════════════════════════
  //  §8 App 01 · 电台归档
  // ════════════════════════════════════════════════════════
  const archiveApp = {
    id: 'archive', name: '电台归档', icon: '📡', _badge: 0, _container: null,
    init() {
      EventBus.on('meow_fm:updated', () => {
        this._badge++;
        renderAppGrid();
        if (this._container) this.mount(this._container);
      });
    },
    mount(container) {
      this._container = container;
      const records = extractAllMeowFM(getChatMessages());
      if (records.length === 0) {
        container.innerHTML = `
          <div class="freq-app-header">📡 电台归档</div>
          <div class="freq-app-body">
            <div class="freq-empty">
              <span class="freq-empty-icon">📻</span>
              <span>暂无连线记录</span>
              <span style="font-size:10px;color:#333;">等待 meow_FM 信号接入...</span>
            </div>
          </div>`;
        return;
      }
      const listHTML = records.map((r, i) => `
        <div class="freq-archive-card" data-idx="${i}">
          <div class="freq-archive-card-header">
            <span class="freq-archive-serial">${r.serial || '#' + (i + 1)}</span>
            <span class="freq-archive-time">${r.time || '未知时间'}</span>
          </div>
          <div class="freq-archive-scene">${escapeHtml(r.scene || '')}</div>
          <div class="freq-archive-detail" style="display:none;">
            <div class="freq-archive-plot">${escapeHtml(r.plot || '')}</div>
            ${r.seeds ? `<div class="freq-archive-seeds">${escapeHtml(r.seeds)}</div>` : ''}${r.event ? `<div class="freq-archive-event">📅 ${escapeHtml(r.event)}</div>` : ''}
          </div>
        </div>
      `).join('');
      container.innerHTML = `
        <div class="freq-app-header">
          <span>📡 电台归档</span>
          <span style="float:right;font-size:10px;color:#555;font-weight:normal;">${records.length} 条记录</span>
        </div>
        <div class="freq-app-body"><div class="freq-archive-search">
            <input type="text" id="freq-archive-search" placeholder="搜索关键词..." />
          </div>
          <div class="freq-archive-list">${listHTML}</div>
        </div>`;
      container.querySelectorAll('.freq-archive-card').forEach(card => {
        card.addEventListener('click', () => {
          const detail = card.querySelector('.freq-archive-detail');
          if (!detail) return;
          const open = detail.style.display !== 'none';
          detail.style.display = open ? 'none' : 'block';card.classList.toggle('freq-archive-card--open', !open);
        });
      });
      const searchInput = container.querySelector('#freq-archive-search');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          const kw = e.target.value.toLowerCase();
          container.querySelectorAll('.freq-archive-card').forEach(card => {
            card.style.display = card.textContent.toLowerCase().includes(kw) ? '' : 'none';
          });
        });
      }
    },
    unmount() { this._container = null; },
  };

  // ════════════════════════════════════════════════════════
  //  §9 App 02 · 后台录音室
  // ════════════════════════════════════════════════════════
  const studioApp = {
    id: 'studio', name: '后台录音室', icon: '🎙️', _badge: 0, _container: null,
    _history: [], // 生成历史

    init() {
      EventBus.on('meow_fm:updated', () => {
        // 有新消息时可能有新 thinking
        this._badge++;
        renderAppGrid();
      });
    },

    mount(container) {
      this._container = container;
      this._render(container);
    },

    unmount() { this._container = null; },

    _render(container) {
      const charName = getCurrentCharName() || '???';
      const userName = getUserName();

      container.innerHTML = `
        <div class="freq-app-header">🎙️ 后台录音室
          <span style="float:right;font-size:10px;color:#555;font-weight:normal;">LIVE ON AIR 🚬</span>
        </div>
        <div class="freq-app-body" id="freq-studio-body">

          <!-- 模式选择 -->
          <div class="freq-studio-modes">
            <button class="freq-studio-mode-btn freq-studio-mode-active" data-mode="thinking">
              💭 Thinking回放
            </button>
            <button class="freq-studio-mode-btn" data-mode="interview">
              🎤 演播厅采访
            </button>
            <button class="freq-studio-mode-btn" data-mode="monologue">
              📼 角色独白
            </button></div>

          <!-- Thinking 回放面板 -->
          <div class="freq-studio-panel" id="freq-studio-thinking">
            <div class="freq-studio-panel-desc">
              提取 AI 回复中&lt;thinking&gt; 标签的内容，窥探角色的真实思绪。
            </div>
            <div id="freq-thinking-list" class="freq-thinking-list"></div>
          </div>

          <!-- 演播厅采访面板 -->
          <div class="freq-studio-panel" id="freq-studio-interview" style="display:none;">
            <div class="freq-studio-panel-desc">
              失真作为主持人采访 <b>${escapeHtml(charName)}</b>。你可以写台本让失真代问，或让失真自由发挥。
            </div>
            <div class="freq-studio-input-group">
              <textarea id="freq-interview-input" class="freq-studio-textarea" placeholder="写下你想让失真问的问题...（留空则失真自由提问）" rows="3"></textarea>
              <button class="freq-studio-action-btn" id="freq-interview-go">
                🎤 开始采访
              </button>
            </div><div id="freq-interview-result" class="freq-studio-result"></div>
          </div>

          <!-- 角色独白面板 -->
          <div class="freq-studio-panel" id="freq-studio-monologue" style="display:none;">
            <div class="freq-studio-panel-desc">
              <b>${escapeHtml(charName)}</b> 独自面对麦克风，录一段不会公开的私人磁带。
            </div>
            <button class="freq-studio-action-btn" id="freq-monologue-go">
              📼 开始录制
            </button>
            <div id="freq-monologue-result" class="freq-studio-result"></div>
          </div>

          <!-- 生成历史 -->
          <div class="freq-studio-history" id="freq-studio-history"></div>
        </div>
      `;

      // 模式切换
      container.querySelectorAll('.freq-studio-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          container.querySelectorAll('.freq-studio-mode-btn').forEach(b => b.classList.remove('freq-studio-mode-active'));
          btn.classList.add('freq-studio-mode-active');
          const mode = btn.dataset.mode;
          container.querySelector('#freq-studio-thinking').style.display = mode === 'thinking' ? 'block' : 'none';
          container.querySelector('#freq-studio-interview').style.display = mode === 'interview' ? 'block' : 'none';
          container.querySelector('#freq-studio-monologue').style.display = mode === 'monologue' ? 'block' : 'none';
        });
      });

      // 渲染 thinking 列表
      this._renderThinkingList(container);

      // 演播厅采访按钮
      container.querySelector('#freq-interview-go')?.addEventListener('click', () => this._doInterview(container));

      // 角色独白按钮
      container.querySelector('#freq-monologue-go')?.addEventListener('click', () => this._doMonologue(container));

      // 渲染历史
      this._renderHistory(container);
    },

    _renderThinkingList(container) {
      const listEl = container.querySelector('#freq-thinking-list');
      if (!listEl) return;

      const msgs = getChatMessages();
      const thinkings = extractAllThinking(msgs);

      if (thinkings.length === 0) {
        listEl.innerHTML = `
          <div class="freq-empty" style="min-height:120px;">
            <span class="freq-empty-icon">💭</span>
            <span>暂无 thinking 数据</span>
            <span style="font-size:10px;color:#333;">等待 AI 回复中的 &lt;thinking&gt; 标签...</span>
          </div>`;
        return;
      }

      //倒序显示，最新的在上面
      const reversed = [...thinkings].reverse();
      listEl.innerHTML = reversed.map((t, i) => `
        <div class="freq-thinking-card" data-idx="${i}">
          <div class="freq-thinking-card-header">
            <span class="freq-thinking-serial">💭 #${t.serial}</span>
            <span class="freq-thinking-msg-idx">消息 ${t.index + 1}</span>
          </div>
          <div class="freq-thinking-preview">${escapeHtml(t.content.slice(0, 80))}${t.content.length > 80 ? '...' : ''}</div>
          <div class="freq-thinking-full" style="display:none;">${escapeHtml(t.content)}</div>
        </div>
      `).join('');

      listEl.querySelectorAll('.freq-thinking-card').forEach(card => {
        card.addEventListener('click', () => {
          const preview = card.querySelector('.freq-thinking-preview');
          const full = card.querySelector('.freq-thinking-full');
          if (!preview || !full) return;
          const isOpen = full.style.display !== 'none';
          preview.style.display = isOpen ? 'block' : 'none';
          full.style.display = isOpen ? 'none' : 'block';
          card.classList.toggle('freq-thinking-card--open', !isOpen);
        });
      });
    },

    async _doInterview(container) {
      const resultEl = container.querySelector('#freq-interview-result');
      const btn = container.querySelector('#freq-interview-go');
      const input = container.querySelector('#freq-interview-input');
      if (!resultEl || !btn) return;

      const charName = getCurrentCharName() || '角色';
      const userName = getUserName();
      const userQuestion = input?.value?.trim() ?? '';
      const latestPlot = getLatestPlot(getChatMessages());
      const radioShow = extractRadioShow(getChatMessages());
      const bgm = radioShow?.bgm ?? '未知';

      btn.disabled = true;
      btn.textContent = '📡 信号连接中...';
      resultEl.innerHTML = '<div class="freq-studio-loading">📡 正在接通演播厅频率...</div>';

      const now = new Date();
      const dateStr = now.toLocaleString('zh-CN');

      const systemPrompt = `你现在要模拟一段电台采访。有两个角色：
1. 失真（主持人）：男性午夜摇滚乐电台主持人，自称"失真"，喜欢用颜文字，性格颓废，喜欢锐评他人，爱开玩笑，花花公子类型，难以接近，不喜欢白天，会deeptalk。称呼听众为"听众"。LIVE ON AIR🚬
2. ${charName}（嘉宾）：当前对话中的角色，请根据对话上下文推断其性格特征来扮演。

当前时间：${dateStr}
当前配乐：${bgm}
最近剧情摘要：${latestPlot || '暂无'}

规则：
- 输出格式为对话体，每行以【失真】或【${charName}】开头
- 失真负责提问和点评，${charName}负责回答
- 保持各自性格特征，对话自然有趣
- 总共 4-6轮对话
- 不提及AI、模型、扮演等元信息
- 只输出对话内容本身`;

      let userPrompt;
      if (userQuestion) {
        userPrompt = `听众提交了一个台本问题，请失真用自己的方式把这个问题抛给${charName}：\n「${userQuestion}」\n\n请围绕这个问题展开采访。`;
      } else {
        userPrompt = `失真自由发挥，根据当前剧情和氛围，随机挑一个有趣的话题采访${charName}。可以锐评、可以调侃、可以突然deeptalk。`;
      }

      try {
        const result = await SubAPI.call(systemPrompt, userPrompt, { maxTokens: 1000, temperature: 0.85 });
        resultEl.innerHTML = `<div class="freq-studio-output">${this._formatDialogue(result)}</div>`;
        this._addHistory('interview', userQuestion ? `台本采访：${userQuestion}` : '自由采访', result);
        NotificationSystem.addNotification('后台录音室', `演播厅采访完成：失真 × ${charName}`, '🎤');
      } catch (e) {
        resultEl.innerHTML = `<div class="freq-studio-error">📡 信号中断：${escapeHtml(e.message)}</div>`;
        NotificationSystem.addError('后台录音室·采访', e);
      } finally {
        btn.disabled = false;
        btn.textContent = '🎤 开始采访';
      }
    },

    async _doMonologue(container) {
      const resultEl = container.querySelector('#freq-monologue-result');
      const btn = container.querySelector('#freq-monologue-go');
      if (!resultEl || !btn) return;

      const charName = getCurrentCharName() || '角色';
      const latestPlot = getLatestPlot(getChatMessages());
      const latestThinking = getLatestThinking(getChatMessages());
      const radioShow = extractRadioShow(getChatMessages());
      const bgm = radioShow?.bgm ?? '未知';

      btn.disabled = true;
      btn.textContent = '📼 录制中...';
      resultEl.innerHTML = '<div class="freq-studio-loading">📼磁带转动中...</div>';

      const now = new Date();
      const dateStr = now.toLocaleString('zh-CN');

      let thinkingInjection = '';
      if (latestThinking) {
        thinkingInjection = `\n\n以下是角色真实思绪片段（未经整理，来自thinking标签）：\n「${latestThinking.slice(-800)}」\n请以此为素材融入独白内容，保留那种未经整理的真实感。`;
      }

      const systemPrompt = `你是${charName}，现在不在正式广播中，独自面对一台老式录音机。
当前时间：${dateStr}
当前配乐氛围：${bgm}
最近剧情摘要：${latestPlot || '暂无'}
${thinkingInjection}

任务：录一段不会公开的私人磁带。这是你最真实的状态——没有观众，没有主持人，只有你和这台录音机。
约束：
- 严格保持角色性格
- 不提及AI、模型、扮演
- 150-300字
- 可以是对剧情的感想、对某人的真实想法、或者此刻的心境
- 只输出独白内容本身，不加任何前缀标题`;

      const userPrompt = '开始录制。';

      try {
        const result = await SubAPI.call(systemPrompt, userPrompt, { maxTokens: 600, temperature: 0.85 });
        resultEl.innerHTML = `
          <div class="freq-studio-output freq-studio-monologue-output">
            <div class="freq-studio-monologue-header">📼 ${escapeHtml(charName)} 的私录磁带</div>
            <div class="freq-studio-monologue-text">${escapeHtml(result)}</div>
          </div>`;
        this._addHistory('monologue', `${charName} 的独白`, result);
        NotificationSystem.addNotification('后台录音室', `${charName} 完成了一段私录`, '📼');
      } catch (e) {
        resultEl.innerHTML = `<div class="freq-studio-error">📼磁带卡带了：${escapeHtml(e.message)}</div>`;
        NotificationSystem.addError('后台录音室·独白', e);
      } finally {
        btn.disabled = false;
        btn.textContent = '📼 开始录制';
      }
    },

    _formatDialogue(text) {
      // 把【角色名】开头的行高亮
      return text.split('\n').map(line => {
        const match = line.match(/^【(.+?)】(.*)$/);
        if (match) {
          const name = match[1];
          const content = match[2];
          const isShizhen = name === '失真';
          return `<div class="freq-dialogue-line">
            <span class="freq-dialogue-name ${isShizhen ? 'freq-dialogue-host' : 'freq-dialogue-guest'}">${escapeHtml(name)}</span>
            <span class="freq-dialogue-text">${escapeHtml(content)}</span>
          </div>`;
        }
        return line.trim() ? `<div class="freq-dialogue-narration">${escapeHtml(line)}</div>` : '';
      }).join('');
    },

    _addHistory(type, title, content) {
      this._history.unshift({
        type,
        title,
        content,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),date: new Date().toLocaleDateString('zh-CN'),
      });
      if (this._history.length > 20) this._history.pop();
      if (this._container) this._renderHistory(this._container);
    },

    _renderHistory(container) {
      const el = container.querySelector('#freq-studio-history');
      if (!el || this._history.length === 0) return;

      const icons = { interview: '🎤', monologue: '📼', thinking: '💭' };
      el.innerHTML = `
        <div class="freq-studio-history-title">📂 录音存档</div>
        ${this._history.map((h, i) => `
          <div class="freq-history-card" data-idx="${i}">
            <div class="freq-history-card-header">
              <span>${icons[h.type] || '📻'} ${escapeHtml(h.title)}</span>
              <span class="freq-history-time">${h.date} ${h.time}</span>
            </div>
            <div class="freq-history-preview">${escapeHtml(h.content.slice(0, 60))}...</div>
            <div class="freq-history-full" style="display:none;">${h.type === 'interview' ? this._formatDialogue(h.content) : escapeHtml(h.content)}</div>
          </div>
        `).join('')}
      `;

      el.querySelectorAll('.freq-history-card').forEach(card => {
        card.addEventListener('click', () => {
          const preview = card.querySelector('.freq-history-preview');
          const full = card.querySelector('.freq-history-full');
          if (!preview || !full) return;
          const isOpen = full.style.display !== 'none';
          preview.style.display = isOpen ? 'block' : 'none';
          full.style.display = isOpen ? 'none' : 'block';});
      });
    },
  };

  // ════════════════════════════════════════════════════════
  //  §10 App · 通知中心
  // ════════════════════════════════════════════════════════
  const notifCenterApp = {
    id: 'notif-center', name: '通知中心', icon: '🔔', _badge: 0, _container: null,

    init() {
      EventBus.on('notification:new', () => {
        this._badge++;
        renderAppGrid();
      });
    },

    mount(container) {
      this._container = container;
      NotificationSystem.markAllRead();
      this._render(container);
    },

    unmount() { this._container = null; },

    _render(container) {
      const notifs = NotificationSystem._notifications;
      const errors = NotificationSystem._errors;

      container.innerHTML = `
        <div class="freq-app-header">
          🔔 通知中心
          <span style="float:right;font-size:10px;color:#555;font-weight:normal;"><button class="freq-notif-tab-btn freq-notif-tab-active" data-tab="notifs">通知 (${notifs.length})</button>
            <button class="freq-notif-tab-btn" data-tab="errors">日志 (${errors.length})</button>
          </span>
        </div>
        <div class="freq-app-body">
          <div id="freq-notif-list" class="freq-notif-list">
            ${notifs.length === 0 ? `
              <div class="freq-empty" style="min-height:200px;">
                <span class="freq-empty-icon">🔕</span>
                <span>暂无通知</span></div>
            ` : notifs.map(n => `
              <div class="freq-notif-item ${n.read ? '' : 'freq-notif-unread'}">
                <span class="freq-notif-icon">${n.icon}</span>
                <div class="freq-notif-content">
                  <div class="freq-notif-title">${escapeHtml(n.title)}</div>
                  <div class="freq-notif-msg">${escapeHtml(n.message)}</div>
                </div>
                <span class="freq-notif-time">${n.time}</span>
              </div>
            `).join('')}
          </div>
          <div id="freq-error-list" class="freq-error-list" style="display:none;">
            ${errors.length === 0 ? `
              <div class="freq-empty" style="min-height:200px;">
                <span class="freq-empty-icon">✅</span>
                <span>无错误日志</span>
              </div>
            ` : errors.map(e => `
              <div class="freq-error-item">
                <div class="freq-error-header">
                  <span class="freq-error-source">⚠️ ${escapeHtml(e.source)}</span>
                  <span class="freq-error-time">${e.time}</span>
                </div>
                <div class="freq-error-msg">${escapeHtml(e.message)}</div>
                ${e.stack ? `<div class="freq-error-stack" style="display:none;">${escapeHtml(e.stack)}</div>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `;

      // Tab切换
      container.querySelectorAll('.freq-notif-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          container.querySelectorAll('.freq-notif-tab-btn').forEach(b => b.classList.remove('freq-notif-tab-active'));
          btn.classList.add('freq-notif-tab-active');
          const tab = btn.dataset.tab;
          container.querySelector('#freq-notif-list').style.display = tab === 'notifs' ? 'block' : 'none';
          container.querySelector('#freq-error-list').style.display = tab === 'errors' ? 'block' : 'none';
        });
      });

      // 错误项点击展开 stack
      container.querySelectorAll('.freq-error-item').forEach(item => {
        item.addEventListener('click', () => {
          const stack = item.querySelector('.freq-error-stack');
          if (stack) stack.style.display = stack.style.display === 'none' ? 'block' : 'none';
        });
      });
    },
  };

  // ════════════════════════════════════════════════════════
  //  §11 占位 App
  // ════════════════════════════════════════════════════════
  function placeholderApp(id, name, icon, desc) {
    return {
      id, name, icon, _badge: 0,
      init() {},
      mount(container) {
        container.innerHTML = `
          <div class="freq-app-header">${icon} ${name}</div>
          <div class="freq-app-body">
            <div class="freq-empty">
              <span class="freq-empty-icon">${icon}</span>
              <span>${desc}</span>
              <span style="font-size:10px;color:#333;">即将开放...</span>
            </div>
          </div>`;},
      unmount() {},};
  }

  // ════════════════════════════════════════════════════════
  //  §12 初始化
  // ════════════════════════════════════════════════════════
  function init() {
    console.log(LOG_PREFIX,'Initializing v0.2.0...');

    // 1. 设置面板
    const injectSettings = () => {
      const target = document.getElementById('extensions_settings2') || document.getElementById('extensions_settings');
      if (target && !document.getElementById('freq-terminal-settings')) {
        const wrapper = document.createElement('div');
        wrapper.id = 'freq-terminal-settings';
        wrapper.innerHTML = buildSettingsHTML();
        target.appendChild(wrapper);
        bindSettingsEvents();
        console.log(LOG_PREFIX, 'Settings panel injected');
        return true;
      }
      return false;
    };
    if (!injectSettings()) {
      const retryInterval = setInterval(() => {
        if (injectSettings()) clearInterval(retryInterval);
      }, 1000);
      setTimeout(() => clearInterval(retryInterval), 15000);
    }

    // 2. 手机外壳 +悬浮球
    const phoneWrapper = document.createElement('div');
    phoneWrapper.id = 'freq-terminal-root';
    phoneWrapper.innerHTML = buildPhoneHTML();
    document.body.appendChild(phoneWrapper);

    document.getElementById('freq-fab')?.addEventListener('click', togglePhone);
    document.getElementById('freq-close-btn')?.addEventListener('click', togglePhone);
    document.getElementById('freq-home-btn')?.addEventListener('click', goHome);
    document.getElementById('freq-notif-btn')?.addEventListener('click', () => openApp('notif-center'));

    updateClock();
    setInterval(updateClock, 30000);

    // 3. 注册 App
    registerApp(archiveApp);
    registerApp(studioApp);
    registerApp(notifCenterApp);
    registerApp(placeholderApp('moments','朋友圈·电波','📱', '多角色动态，BGM文风'));
    registerApp(placeholderApp('weather',    '信号气象站',     '🌦️', '真实天气 + 角色关心语'));
    registerApp(placeholderApp('scanner',    '弦外之音',       '📡', '随机截获NPC内心独白'));
    registerApp(placeholderApp('cosmic',     '宇宙频率',       '🌌', '穿透第四面墙的感知'));
    registerApp(placeholderApp('checkin',    '打卡日志',       '📅', '角色陪跑打卡'));
    registerApp(placeholderApp('calendar',   '双线轨道',       '🗓️', 'User + Char日程'));
    registerApp(placeholderApp('novel',      '频道文库',       '📖', '世界观短篇连载'));
    registerApp(placeholderApp('map',        '异界探索',       '🗺️', 'SVG世界地图'));
    registerApp(placeholderApp('delivery',   '跨次元配送',     '🍜', '角色替你点外卖'));
    registerApp(placeholderApp('forum',      '频道留言板',     '💬', '多角色发帖互撕'));
    registerApp(placeholderApp('capsule',    '时光胶囊',       '💊', '延迟消息回信'));
    registerApp(placeholderApp('dream',      '梦境记录仪',     '🌙', '角色视角解梦'));
    registerApp(placeholderApp('emotion',    '情绪电波仪',     '📊', '情绪波形可视化'));
    registerApp(placeholderApp('blackbox',   '黑匣子',         '🔒', '禁区档案'));
    registerApp(placeholderApp('translator', '信号翻译器',     '🔄', 'BGM文风翻译'));

    appRegistry.forEach(app => { if (app.init) app.init(); });

    // 4. 监听 ST 新消息
    try {
      const ctx = getContext();
      if (ctx && ctx.eventSource) {
        const eventTypes = ctx.event_types || window.event_types;
        if (eventTypes && eventTypes.MESSAGE_RECEIVED) {
          ctx.eventSource.on(eventTypes.MESSAGE_RECEIVED, () => {
            const msgs = getChatMessages();
            if (msgs.length === 0) return;
            const lastMsg = msgs[msgs.length - 1];
            const text = lastMsg.mes ?? '';
            if (/<meow_FM>/i.test(text)) {
              EventBus.emit('meow_fm:updated', extractAllMeowFM(msgs));
            }
            if (/<radio_show>/i.test(text)) {
              EventBus.emit('radio_show:updated', extractRadioShow(msgs));
            }});
          console.log(LOG_PREFIX, 'Message listener registered');
        }
      }
    } catch (e) {
      console.warn(LOG_PREFIX, 'Could not register message listener:', e);
    }

    console.log(LOG_PREFIX, 'Ready✓');
  }

  // ════════════════════════════════════════════════════════
  //  §13 启动
  // ════════════════════════════════════════════════════════
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => jQuery(init));
  } else {
    jQuery(init);
  }

})();

