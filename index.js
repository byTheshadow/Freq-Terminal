// ╔══════════════════════════════════════════════════════════╗
// ║  📻 FREQ · TERMINAL —频率终端                          ║
// ║  「失真电台」专属SillyTavern 插件 v0.1.0                ║
// ║  阶段 1：核心框架 + 手机外壳 + 电台归档+ 设置面板       ║
// ╚══════════════════════════════════════════════════════════╝

(function () {
  'use strict';

  const EXTENSION_NAME = 'freq-terminal';
  const LOG_PREFIX = '[FreqTerminal]';

  // ════════════════════════════════════════════════════════
  //  §1EventBus — 模块间通信
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
  //  §2  ST Bridge — 与 SillyTavern 通信
  // ════════════════════════════════════════════════════════
  function getContext() {
    return window.SillyTavern?.getContext?.() ?? null;
  }

  function getChatMessages() {
    const ctx = getContext();
    return ctx?.chat ?? [];
  }

  function getCurrentCharName() {
    const ctx = getContext();
    return ctx?.name2 ?? '';
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
  //  §3  Parser — 解析预设 XML 标签
  // ════════════════════════════════════════════════════════
  function parseMeowFMBlock(raw) {
    const get = (key) => {
      const m = raw.match(new RegExp(key + '\\s*[:：]\\s*(.+)', 'i'));
      return m ? m[1].trim() : '';
    };
    // plot 可能多行，特殊处理
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
      }regex.lastIndex = 0; // reset for next message
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

  // ════════════════════════════════════════════════════════
  //  §4  App Registry — App 注册管理
  // ════════════════════════════════════════════════════════
  const appRegistry = [];
  let currentAppId = null;
  let phoneOpen = false;

  function registerApp(app) {
    app._badge = 0;
    appRegistry.push(app);
  }

  // ════════════════════════════════════════════════════════
  //  §5  Phone Shell — 手机外壳 UI
  // ════════════════════════════════════════════════════════
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
            <button class="freq-home-btn" id="freq-home-btn" title="主屏幕">◼</button>
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

    // unmount previous
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

    // clear badge
    app._badge = 0;
    renderAppGrid();

    if (app.mount) app.mount(viewEl);
  }

  function goHome() {
    if (currentAppId) {
      const app = appRegistry.find(a => a.id === currentAppId);
      if (app && app.unmount) app.unmount();
      currentAppId = null;}
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
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    el.textContent = h + ':' + m;
  }

  // ════════════════════════════════════════════════════════
  //  §6  Settings Panel — 扩展设置面板
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
      { id: 'freq_sub_api_url',  key: 'subApiUrl',      type: 'text' },
      { id: 'freq_sub_api_key',  key: 'subApiKey',      type: 'text' },
      { id: 'freq_sub_api_model', key: 'subApiModel',   type: 'text' },
      { id: 'freq_weather_key',  key: 'weatherKey',     type: 'text' },
      { id: 'freq_cosmic_enabled', key: 'cosmicEnabled', type: 'checkbox' },
    ];

    fields.forEach(f => {
      const el = document.getElementById(f.id);
      if (!el) return;
      const eventName = f.type === 'checkbox' ? 'change' : 'input';
      el.addEventListener(eventName, () => {
        const value = f.type === 'checkbox' ? el.checked : el.value.trim();
        saveSettings({ [f.key]: value });
        const status = document.getElementById('freq_settings_status');
        if (status) {
          status.textContent = '✓ 已保存';
          setTimeout(() => { status.textContent = ''; }, 1500);
        }
      });
    });
  }

  // ════════════════════════════════════════════════════════
  //  §7  App01 · 电台归档
  // ════════════════════════════════════════════════════════
  const archiveApp = {
    id: 'archive',
    name: '电台归档',
    icon: '📡',
    _badge: 0,
    _container: null,

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
          </div>
        `;
        return;
      }

      const listHTML = records.map((r, i) => `
        <div class="freq-archive-card" data-idx="${i}">
          <div class="freq-archive-card-header">
            <span class="freq-archive-serial">${r.serial || '#' + (i + 1)}</span>
            <span class="freq-archive-time">${r.time || '未知时间'}</span>
          </div>
          <div class="freq-archive-scene">${this._escapeHtml(r.scene || '')}</div>
          <div class="freq-archive-detail" style="display:none;">
            <div class="freq-archive-plot">${this._escapeHtml(r.plot || '')}</div>
            ${r.seeds ? `<div class="freq-archive-seeds">${this._escapeHtml(r.seeds)}</div>` : ''}
            ${r.event ? `<div class="freq-archive-event">📅 ${this._escapeHtml(r.event)}</div>` : ''}
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
        </div>
      `;

      //点击展开/收起
      container.querySelectorAll('.freq-archive-card').forEach(card => {
        card.addEventListener('click', () => {
          const detail = card.querySelector('.freq-archive-detail');
          if (!detail) return;
          const open = detail.style.display !== 'none';
          detail.style.display = open ? 'none' : 'block';card.classList.toggle('freq-archive-card--open', !open);
        });
      });

      // 搜索
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

    unmount() {
      this._container = null;
    },

    _escapeHtml(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    },
  };

  // ════════════════════════════════════════════════════════
  //  §8  占位 App（后续阶段实现）
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
          </div>
        `;
      },
      unmount() {},
    };
  }

  // ════════════════════════════════════════════════════════
  //  §9  初始化入口
  // ════════════════════════════════════════════════════════
  function init() {
    console.log(LOG_PREFIX, 'Initializing...');

    // 1. 注入设置面板到 ST扩展区
    const settingsContainer = document.getElementById('extensions_settings2');
    if (settingsContainer) {
      const wrapper = document.createElement('div');
      wrapper.id = 'freq-terminal-settings';
      wrapper.innerHTML = buildSettingsHTML();
      settingsContainer.appendChild(wrapper);
      bindSettingsEvents();
      console.log(LOG_PREFIX, 'Settings panel injected');
    } else {
      console.warn(LOG_PREFIX, 'extensions_settings2 not found, retrying...');
      // 有些ST 版本加载顺序不同，延迟重试
      setTimeout(() => {
        const retry = document.getElementById('extensions_settings2');
        if (retry) {
          const wrapper = document.createElement('div');
          wrapper.id = 'freq-terminal-settings';
          wrapper.innerHTML = buildSettingsHTML();
          retry.appendChild(wrapper);
          bindSettingsEvents();
          console.log(LOG_PREFIX, 'Settings panel injected (retry)');
        } else {
          console.error(LOG_PREFIX, 'extensions_settings2 still not found');
        }
      }, 3000);
    }

    // 2. 注入手机外壳 +悬浮球到 body
    const phoneWrapper = document.createElement('div');
    phoneWrapper.id = 'freq-terminal-root';
    phoneWrapper.innerHTML = buildPhoneHTML();
    document.body.appendChild(phoneWrapper);

    // 3. 绑定悬浮球和按钮事件
    document.getElementById('freq-fab')?.addEventListener('click', togglePhone);
    document.getElementById('freq-close-btn')?.addEventListener('click', togglePhone);
    document.getElementById('freq-home-btn')?.addEventListener('click', goHome);

    // 4. 启动时钟
    updateClock();
    setInterval(updateClock, 30000);

    // 5. 注册所有 App
    registerApp(archiveApp);
    registerApp(placeholderApp('studio','后台录音室',     '🎙️', '失真独白/ 演播厅采访 / 角色私录'));
    registerApp(placeholderApp('moments',    '朋友圈·电波',   '📱', '多角色动态，BGM文风'));
    registerApp(placeholderApp('weather',    '信号气象站',     '🌦️', '真实天气 + 角色关心语'));
    registerApp(placeholderApp('scanner',    '弦外之音',       '📡', '随机截获NPC内心独白'));
    registerApp(placeholderApp('cosmic',     '宇宙频率','🌌', '穿透第四面墙的感知'));
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

    // 6. 初始化所有 App
    appRegistry.forEach(app => { if (app.init) app.init(); });

    // 7. 监听 ST 新消息事件
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
            }
          });
          console.log(LOG_PREFIX, 'Message listener registered');
        }
      }
    } catch (e) {
      console.warn(LOG_PREFIX, 'Could not register message listener:', e);
    }

    console.log(LOG_PREFIX, 'Ready✓');
  }

  // ════════════════════════════════════════════════════════
  //  §10  启动
  // ════════════════════════════════════════════════════════
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => jQuery(init));
  } else {
    jQuery(init);
  }

})();
