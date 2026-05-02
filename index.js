// ╔══════════════════════════════════════════════════════════════════╗
// ║  FREQ · TERMINAL v2.0                                          ║
// ║  「失真电台」虚拟手机插件                                         ║
// ║  For SillyTavern                ║
// ╚══════════════════════════════════════════════════════════════════╝

// ┌──────────────────────────────────────────────────────┐
// │ BLOCK_00常量+ 工具函数                              │
// └──────────────────────────────────────────────────────┘

const FREQ = {};

FREQ.META = {
  name: 'FREQ · TERMINAL',
  version: '2.0.0',
  prefix: 'freq',
  extensionName: 'FREQ-TERMINAL',
};

FREQ.APP_REGISTRY = [
  { id: 'archive',name: '电台归档',         icon: '📼', needsAPI: false },
  { id: 'studio',      name: '后台录音室',       icon: '🎙️', needsAPI: true },
  { id: 'moments',     name: '朋友圈·电波',     icon: '📡', needsAPI: true },
  { id: 'weather',     name: '信号气象站',       icon: '🌦️', needsAPI: true },
  { id: 'scan',        name: '弦外之音·扫频',   icon: '📻', needsAPI: true },
  { id: 'cosmos',      name: '宇宙频率·感知',   icon: '🌌', needsAPI: true },
  { id: 'checkin',     name: '打卡·连线日志',   icon: '📋', needsAPI: true },
  { id: 'schedule',    name: '日程表·双线轨道', icon: '🗓️', needsAPI: true },
  { id: 'novel',       name: '频道文库',         icon: '📖', needsAPI: true },
  { id: 'map',         name: '异界探索',         icon: '🗺️', needsAPI: true },
  { id: 'delivery',    name: '跨次元配送',       icon: '🛵', needsAPI: true },
  { id: 'forum',       name: '频道留言板',       icon: '💬', needsAPI: true },
  { id: 'capsule',     name: '时光胶囊',         icon: '💊', needsAPI: true },
  { id: 'dream',       name: '梦境记录仪',       icon: '🌙', needsAPI: true },
  { id: 'emotion',     name: '情绪电波仪',       icon: '💓', needsAPI: true },
  { id: 'blackbox',    name: '黑匣子·禁区档案', icon: '🔒', needsAPI: true },
  { id: 'translator',  name: '信号翻译器',       icon: '🔤', needsAPI: true },
];

FREQ.apps = {};
FREQ.DEFAULT_PROMPTS = {};

//── 工具函数 ──

function safeParseAIJson(raw, expect ='object') {
  if (!raw || typeof raw !== 'string') return null;

  // 第一层：标准解析
  try {
    let cleaned = raw.trim()
      .replace(/^```(?:json)?\s*/im, '')
      .replace(/\s*```\s*$/m, '')
      .trim();

    const pattern = expect === 'array' ? /$$[\s\S]*$$/ : /\{[\s\S]*\}/;
    const match = cleaned.match(pattern);

    if (match) {
      let jsonStr = match[0]
        .replace(/[\u201c\u201d]/g, '"')
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u300c\u300d]/g, '"')
        .replace(/：/g, ':')
        .replace(/,\s*([}\]])/g, '\$1')
        .replace(/^\uFEFF/, '');
      return JSON.parse(jsonStr);
    }
  } catch (e) {
    FreqLog.warn('JSON解析', '第一层失败，尝试降级', { error: e.message, raw: raw.substring(0, 200) });
  }

  // 第二层：正则提取
  try {
    if (expect === 'object') {
      const extracted = {};
      const strFields = ['title', 'content', 'text', 'name', 'message', 'body', 'desc', 'description'];
      for (const field of strFields) {
        const re = new RegExp(`"${field}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`, 'i');
        const m = raw.match(re);
        if (m) extracted[field] = m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
      }
      const numFields = ['score', 'level', 'count', 'likes'];
      for (const field of numFields) {
        const re = new RegExp(`"${field}"\\s*:\\s*(\\d+(?:\\.\\d+)?)`, 'i');
        const m = raw.match(re);
        if (m) extracted[field] = parseFloat(m[1]);
      }
      if (Object.keys(extracted).length > 0) {
        FreqLog.info('JSON解析', '第二层正则提取成功', extracted);
        return extracted;
      }
    }if (expect === 'array') {
      const items = [];
      const re = /\{[^{}]*\}/g;
      let m;
      while ((m = re.exec(raw)) !== null) {
        try { items.push(JSON.parse(m[0])); } catch (_) {}
      }
      if (items.length > 0) {
        FreqLog.info('JSON解析', '第二层数组提取成功', { count: items.length });
        return items;
      }
    }
  } catch (e) {
    FreqLog.warn('JSON解析', '第二层失败', { error: e.message });
  }

  // 第三层：兜底
  FreqLog.warn('JSON解析', '降级为纯文本兜底', { raw: raw.substring(0, 100) });
  return { text: raw.trim(), _fallback: true };
}

function escapeHtml(str) {
  if (!str) return '';
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(str).replace(/[&<>"']/g, c => map[c]);
}

function freqTimeNow() {
  return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function freqDateTimeNow() {
  return new Date().toLocaleString('zh-CN', {
    month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',});
}

function freqUID() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

function freqDelay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── BLOCK_00 END ──


// ┌──────────────────────────────────────────────────────┐
// │ BLOCK_01  EventBus                │
// └──────────────────────────────────────────────────────┘

const FreqBus = {
  _listeners: {},
  on(event, fn) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(fn);
  },
  off(event, fn) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(f => f !== fn);
  },
  emit(event, ...args) {
    if (!this._listeners[event]) return;
    for (const fn of this._listeners[event]) {
      try { fn(...args); } catch (e) {
        FreqLog.error('EventBus', `事件 [${event}] 处理器报错`, { error: e.message });
      }
    }
  },
  once(event, fn) {
    const wrapper = (...args) => { this.off(event, wrapper); fn(...args); };
    this.on(event, wrapper);
  },
};

// ── BLOCK_01 END ──


// ┌──────────────────────────────────────────────────────┐
// │ BLOCK_02  ST Bridge                                   │
// └──────────────────────────────────────────────────────┘

const FreqSTBridge = {
  getCharName() {
    try {
      const ctx = window.SillyTavern?.getContext?.();
      if (ctx?.name2) return ctx.name2;
      return document.querySelector('#rm_print_characters_block .character_select.selected .ch_name')
        ?.textContent?.trim() || '未知角色';
    } catch (e) { return '未知角色'; }
  },
  getUserName() {
    try {
      const ctx = window.SillyTavern?.getContext?.();
      if (ctx?.name1) return ctx.name1;
      return '用户';
    } catch (e) { return '用户'; }
  },
  getRecentChat(n = 10) {
    try {
      const ctx = window.SillyTavern?.getContext?.();
      if (ctx?.chat) {
        return ctx.chat.slice(-n).map(msg => ({
          role: msg.is_user ? 'user' : 'char',
          name: msg.is_user ? (ctx.name1 || '用户') : (ctx.name2 || '角色'),
          content: msg.mes || '',
        }));
      }
      return [];
    } catch (e) {
      FreqLog.warn('STBridge', '获取对话失败', { error: e.message });
      return [];
    }
  },
  getCharDescription() {
    try {
      const ctx = window.SillyTavern?.getContext?.();
      if (ctx?.characters) {
        const char = ctx.characters[ctx.characterId];
        return char?.description || char?.data?.description || '';
      }
      return '';
    } catch (e) { return ''; }
  },
};

// ── BLOCK_02 END ──


// ┌──────────────────────────────────────────────────────┐
// │ BLOCK_03  Parser│
// └──────────────────────────────────────────────────────┘

const FreqParser = {
  extractTag(tagName, text) {
    if (!text) return [];
    const re = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'gi');
    const results = [];
    let m;
    while ((m = re.exec(text)) !== null) results.push(m[1].trim());
    return results;
  },
  extractFromChat(tagName, maxMessages = 50) {
    const chat = FreqSTBridge.getRecentChat(maxMessages);
    const results = [];
    chat.forEach((msg, i) => {
      const tags = this.extractTag(tagName, msg.content);
      tags.forEach(content => {
        results.push({ index: i, role: msg.role, name: msg.name, content });
      });
    });
    return results;
  },
};

// ── BLOCK_03 END ──


// ┌──────────────────────────────────────────────────────┐
// │ BLOCK_04  SubAPI│
// └──────────────────────────────────────────────────────┘

const FreqSubAPI = {
  _getConfig() {
    return FreqStorage.getSettings();
  },

  async fetchModels() {
    const config = this._getConfig();
    if (!config.apiUrl || !config.apiKey) throw new Error('请先填写 API 地址和密钥');

    const baseUrl = config.apiUrl.replace(/\/+$/, '');
    FreqLog.info('SubAPI', '正在获取模型列表...', { url: baseUrl });

    const resp = await fetch(`${baseUrl}/models`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${config.apiKey}` },
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      throw new Error(`获取模型失败: ${resp.status} ${errText.substring(0, 100)}`);
    }

    const data = await resp.json();
    const models = (data.data || data || [])
      .map(m => m.id || m.name || m)
      .filter(Boolean)
      .sort();

    FreqLog.info('SubAPI', `获取到 ${models.length} 个模型`);
    return models;
  },

  async call(systemPrompt, userPrompt, opts = {}) {
    const config = this._getConfig();
    if (!config.apiUrl || !config.apiKey || !config.model) {
      throw new Error('副API 未配置完成');
    }

    const baseUrl = config.apiUrl.replace(/\/+$/, '');
    const body = {
      model: config.model,
      temperature: opts.temperature ?? config.temperature ?? 0.8,
      max_tokens: opts.max_tokens ?? config.maxTokens ?? 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    };

    FreqLog.info('SubAPI', '发起AI 调用', { model: body.model, promptLen: systemPrompt.length + userPrompt.length });

    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      throw new Error(`API 调用失败: ${resp.status} ${errText.substring(0, 200)}`);
    }

    const data = await resp.json();
    return data.choices?.[0]?.message?.content || '';
  },
};

// ── BLOCK_04 END ──


// ┌──────────────────────────────────────────────────────┐
// │ BLOCK_05  FreqLog (报错日志)                           │
// └──────────────────────────────────────────────────────┘

const FreqLog = {
  _logs: [],
  _maxLogs: 500,

  _add(level, source, message, detail = null) {
    const entry = {
      id: freqUID(),
      level,
      source,
      message,
      detail: detail ? JSON.stringify(detail, null, 2) : null,
      time: freqDateTimeNow(),
      timestamp: Date.now(),
    };
    this._logs.unshift(entry);
    if (this._logs.length > this._maxLogs) this._logs = this._logs.slice(0, this._maxLogs);

    const consoleFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    consoleFn(`[FREQ·${level.toUpperCase()}] [${source}] ${message}`, detail || '');

    FreqBus.emit('log:added', entry);
  },

  error(source, message, detail) { this._add('error', source, message, detail); },
  warn(source, message, detail) { this._add('warn', source, message, detail); },
  info(source, message, detail) { this._add('info', source, message, detail); },

  getAll(filter = 'all') {
    if (filter === 'all') return this._logs;
    return this._logs.filter(l => l.level === filter);
  },

  clear() {
    this._logs = [];
    FreqBus.emit('log:cleared');
  },

  export() {
    return this._logs.map(l =>
      `[${l.time}] [${l.level.toUpperCase()}] [${l.source}] ${l.message}${l.detail ? '\n  ' + l.detail : ''}`
    ).join('\n');
  },
};

// ── BLOCK_05 END ──


// ┌──────────────────────────────────────────────────────┐
// │ BLOCK_06  Storage│
// └──────────────────────────────────────────────────────┘

const FreqStorage = {
  _dbName: 'FreqTerminalDB',
  _dbVersion: 1,
  _db: null,
  _settingsKey: 'freq_terminal_settings',

  async init() {
    return new Promise((resolve) => {
      try {
        const request = indexedDB.open(this._dbName, this._dbVersion);
        request.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains('appData')) db.createObjectStore('appData', { keyPath: 'key' });
          if (!db.objectStoreNames.contains('notifications')) db.createObjectStore('notifications', { keyPath: 'id' });
        };
        request.onsuccess = (e) => {
          this._db = e.target.result;
          FreqLog.info('Storage', 'IndexedDB 初始化成功');
          resolve();
        };request.onerror = () => {
          FreqLog.warn('Storage', '降级为 localStorage');
          resolve();
        };
      } catch (e) {
        FreqLog.warn('Storage', '降级为 localStorage');
        resolve();
      }
    });
  },

  async saveAppData(appId, data) {
    const record = { key: appId, data, updatedAt: Date.now() };
    if (this._db) {
      return new Promise((resolve) => {
        try {
          const tx = this._db.transaction('appData', 'readwrite');
          tx.objectStore('appData').put(record);
          tx.oncomplete = () => resolve();
          tx.onerror = () => { this._localSave(appId, data); resolve(); };
        } catch (e) { this._localSave(appId, data); resolve(); }
      });
    }
    this._localSave(appId, data);
  },

  async loadAppData(appId) {
    if (this._db) {
      return new Promise((resolve) => {
        try {
          const tx = this._db.transaction('appData', 'readonly');
          const req = tx.objectStore('appData').get(appId);
          req.onsuccess = () => resolve(req.result?.data || null);
          req.onerror = () => resolve(this._localLoad(appId));
        } catch (e) { resolve(this._localLoad(appId)); }
      });
    }
    return this._localLoad(appId);
  },

  _localSave(key, data) {
    try { localStorage.setItem(`freq_app_${key}`, JSON.stringify(data)); } catch (e) {}
  },

  _localLoad(key) {
    try {
      const raw = localStorage.getItem(`freq_app_${key}`);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  },
    getSettings() {
    try {
      const raw = localStorage.getItem(this._settingsKey);
      return raw ? JSON.parse(raw) : this._defaultSettings();
    } catch (e) { return this._defaultSettings(); }
  },

  saveSettings(settings) {
    try {
      localStorage.setItem(this._settingsKey, JSON.stringify(settings));
      FreqBus.emit('settings:changed', settings);
    } catch (e) {
      FreqLog.error('Storage', '保存设置失败', { error: e.message });
    }
  },

  _defaultSettings() {
    return {
      masterEnabled: true,
      fabEnabled: true,
      apiUrl: '',
      apiKey: '',
      model: '',
      temperature: 0.8,
      maxTokens: 1024,
      triggerEnabled: false,
      triggerInterval: 3600000,
      triggerCustomMinutes: 45,
      triggerCooldown: 3,
      triggerApps: [],
      customPrompts: {},};
  },
};

// ── BLOCK_06 END ──


// ┌──────────────────────────────────────────────────────┐
// │ BLOCK_07  UI Core (手机界面 +悬浮球+ 通知栏 + 拖拽)│
// └──────────────────────────────────────────────────────┘

const FreqUI = {
  _phoneOpen: false,
  _notifOpen: false,
  _currentApp: null,
  _notifications: [],

  //── 拖拽状态 ──
  _drag: {
    active: false,
    target: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
    moved: false,
    isTouchDrag: false, // true = 悬浮球触摸拖拽（由 fab.touchend 自己收尾）
  },

  /**
   * 初始化
   */
  init() {
    this._createFAB();
    this._createOverlay();
    this._createPhone();
    this._bindGlobalDrag();
    this._startClock();

    //检查插件总开关
    const settings = FreqStorage.getSettings();
    if (!settings.masterEnabled) {
      this._setPluginEnabled(false);
    }if (!settings.fabEnabled) {
      this._setFabVisible(false);
    }

    FreqLog.info('UI', '界面初始化完成');
  },

  // ═══════════════════════════════════════════════════
  //悬浮球 (FAB)
  // ═══════════════════════════════════════════════════

  _createFAB() {
    const fab = document.createElement('div');
    fab.id = 'freq-fab';
    fab.innerHTML = `
      <span>📻</span>
      <div id="freq-fab-glow"></div>
    `;
    document.body.appendChild(fab);

    // ── 触摸端（移动端）──
    // touchstart 记录起始位置，用于判断是点击还是拖拽
    fab.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      e.preventDefault(); // 阻止 300ms 延迟 & 页面滚动
      const t = e.touches[0];
      const rect = fab.getBoundingClientRect();
      this._drag.active = true;
      this._drag.target = fab;
      this._drag.type = 'fab';
      this._drag.startX = t.clientX;
      this._drag.startY = t.clientY;
      this._drag.offsetX = t.clientX - rect.left;
      this._drag.offsetY = t.clientY - rect.top;
      this._drag.moved = false;
      this._drag.isTouchDrag = true; // 标记为触摸拖拽，不走 pointer 流程
    }, { passive: false });

    // touchend：如果没有移动则视为点击，打开手机
    fab.addEventListener('touchend', (e) => {
      if (!this._drag.isTouchDrag) return;
      e.preventDefault();
      this._drag.isTouchDrag = false;
      const wasMoved = this._drag.moved;
      setTimeout(() => { this._drag.moved = false; }, 50);
      this._drag.active = false;
      this._drag.target = null;
      if (!wasMoved) {
        this.togglePhone();
      }
    }, { passive: false });

    // ── 桌面端（鼠标）──
    // 只处理非触摸的 pointerdown，避免与 touchstart 重复
    fab.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') return; // 触摸已由 touchstart 处理
      e.preventDefault();
      const rect = fab.getBoundingClientRect();
      this._drag.active = true;
      this._drag.target = fab;
      this._drag.type = 'fab';
      this._drag.startX = e.clientX;
      this._drag.startY = e.clientY;
      this._drag.offsetX = e.clientX - rect.left;
      this._drag.offsetY = e.clientY - rect.top;
      this._drag.moved = false;
      this._drag.isTouchDrag = false;
      fab.setPointerCapture(e.pointerId);
    });

    // 桌面端点击（非拖拽）
    fab.addEventListener('click', (e) => {
      if (this._drag.moved) return;
      this.togglePhone();
    });
  },

  _setFabVisible(visible) {
    const fab = document.getElementById('freq-fab');
    if (fab) fab.classList.toggle('freq-hidden', !visible);
  },

  _updateFabGlow() {
    const glow = document.getElementById('freq-fab-glow');
    if (!glow) return;
    const hasUnread = this._notifications.some(n => !n.read);
    glow.classList.toggle('freq-active', hasUnread);
  },

  // ═══════════════════════════════════════════════════
  //  遮罩
  // ═══════════════════════════════════════════════════

  _createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'freq-overlay';
    document.body.appendChild(overlay);

    overlay.addEventListener('click', () => {
      this.closePhone();
    });
    overlay.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.closePhone();
    }, { passive: false });
  },

  // ═══════════════════════════════════════════════════
  //  手机
  // ═══════════════════════════════════════════════════

  _createPhone() {
    const phone = document.createElement('div');
    phone.id = 'freq-phone';
    phone.innerHTML = `
      <div class="freq-phone-frame">
        <div class="freq-phone-screen">

          <!-- 灵动岛 -->
          <div class="freq-dynamic-island" id="freq-dynamic-island"></div>

          <!-- 状态栏 -->
          <div class="freq-statusbar" id="freq-statusbar">
            <div class="freq-statusbar-left">
              <span class="freq-statusbar-time" id="freq-clock">${freqTimeNow()}</span>
            </div>
            <div class="freq-statusbar-right">
              <span class="freq-notif-dot" id="freq-notif-dot"></span>
              <span class="freq-statusbar-signal">📶</span>
              <span class="freq-statusbar-wifi">📡</span>
              <span class="freq-statusbar-battery">🔋</span>
            </div>
          </div>

          <!-- 通知栏 (下拉式) -->
          <div class="freq-notif-panel" id="freq-notif-panel">
            <div class="freq-notif-panel-header">
              <span>通知中心</span>
              <button class="freq-notif-clear-btn" id="freq-notif-clear">清除全部</button>
            </div>
            <div class="freq-notif-list" id="freq-notif-list">
              <div class="freq-notif-empty">暂无通知</div></div>
          </div>

          <!-- 导航栏 -->
          <div class="freq-navbar">
            <button class="freq-navbar-back" id="freq-nav-back">‹</button>
            <span class="freq-navbar-title" id="freq-nav-title">FREQ · TERMINAL</span>
            <button class="freq-navbar-close" id="freq-nav-close" title="关闭">✕</button>
          </div>

          <!-- 主内容区 -->
          <div class="freq-body" id="freq-body"></div>

          <!-- 底部 Home Indicator -->
          <div class="freq-home-indicator">
            <div class="freq-home-indicator-bar" id="freq-home-bar"></div>
          </div></div>
      </div>
    `;
    document.body.appendChild(phone);

    this._renderHome();
    this._bindPhoneEvents();
  },

  _bindPhoneEvents() {
    //灵动岛拖拽手机（指针）
    const island = document.getElementById('freq-dynamic-island');
    if (island) {
      island.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'touch') return;
        this._startDrag(e, document.getElementById('freq-phone'), 'phone');
      });
      // 灵动岛拖拽手机（触摸）
      island.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1) return;
        e.preventDefault();
        const t = e.touches[0];
        const phone = document.getElementById('freq-phone');
        const rect = phone.getBoundingClientRect();
        if (!phone.classList.contains('freq-dragged')) {
          phone.style.left = rect.left + 'px';
          phone.style.top = rect.top + 'px';
          phone.classList.add('freq-dragged');
        }
        this._drag.active = true;
        this._drag.target = phone;
        this._drag.type = 'phone';
        this._drag.startX = t.clientX;
        this._drag.startY = t.clientY;
        this._drag.offsetX = t.clientX - rect.left;
        this._drag.offsetY = t.clientY - rect.top;
        this._drag.moved = false;
        this._drag.isTouchDrag = false; // 走全局 touchmove 流程
      }, { passive: false });
    }

    // 关闭按钮（移动端主要退出方式）
    document.getElementById('freq-nav-close')?.addEventListener('click', () => {
      this.closePhone();
    });

    // 状态栏点击 → 下拉通知
    document.getElementById('freq-statusbar')?.addEventListener('click', (e) => {
      if (e.target.closest('.freq-notif-panel')) return;
      this._toggleNotifPanel();
    });

    // 通知栏 - 清除全部
    document.getElementById('freq-notif-clear')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.clearNotifications();
    });

    // 通知栏 - 点击通知项
    document.getElementById('freq-notif-list')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const item = e.target.closest('.freq-notif-item');
      if (!item) return;

      const notifId = item.dataset.notifId;
      const appId = item.dataset.appId;

      // 标记已读
      const notif = this._notifications.find(n => n.id === notifId);
      if (notif) notif.read = true;
      this._renderNotifList();this._updateNotifDot();this._updateFabGlow();
      this._updateAppBadge(appId);

      this._closeNotifPanel();
      this.openApp(appId);
    });

    // 返回按钮
    document.getElementById('freq-nav-back')?.addEventListener('click', () => {
      this.goHome();
    });

    // Home Indicator → 回主屏
    document.getElementById('freq-home-bar')?.addEventListener('click', () => {
      if (this._notifOpen) {
        this._closeNotifPanel();
      } else {
        this.goHome();
      }
    });

    // App图标点击（事件委托）
    document.getElementById('freq-body')?.addEventListener('click', (e) => {
      const icon = e.target.closest('.freq-app-icon');
      if (icon && !this._currentApp) {
        const appId = icon.dataset.appId;
        if (appId) this.openApp(appId);
      }
    });
  },

  // ═══════════════════════════════════════════════════
  //  拖拽系统 (悬浮球 + 手机共用)
  // ═══════════════════════════════════════════════════

  _startDrag(e, target, type) {
    e.preventDefault();
    const rect = target.getBoundingClientRect();

    this._drag.active = true;
    this._drag.target = target;
    this._drag.type = type;
    this._drag.startX = e.clientX;
    this._drag.startY = e.clientY;
    this._drag.moved = false;

    if (type === 'phone') {
      // 手机拖拽：取消 CSS 居中，改用绝对定位
      if (!target.classList.contains('freq-dragged')) {
        target.style.left = rect.left + 'px';
        target.style.top = rect.top + 'px';
        target.classList.add('freq-dragged');
      }
      this._drag.offsetX = e.clientX - rect.left;
      this._drag.offsetY = e.clientY - rect.top;
    } else {
      // 悬浮球拖拽
      this._drag.offsetX = e.clientX - rect.left;
      this._drag.offsetY = e.clientY - rect.top;
    }

    target.setPointerCapture && target.setPointerCapture(e.pointerId);
  },

  _bindGlobalDrag() {
    // ── 桌面端指针移动 ──
    document.addEventListener('pointermove', (e) => {
      if (!this._drag.active || this._drag.isTouchDrag) return;
      const dx = e.clientX - this._drag.startX;
      const dy = e.clientY - this._drag.startY;
      if (!this._drag.moved && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        this._drag.moved = true;
      }
      if (!this._drag.moved) return;

      const target = this._drag.target;
      let newX = e.clientX - this._drag.offsetX;
      let newY = e.clientY - this._drag.offsetY;
      const w = target.offsetWidth;
      const h = target.offsetHeight;
      newX = Math.max(0, Math.min(window.innerWidth - w, newX));
      newY = Math.max(0, Math.min(window.innerHeight - h, newY));
      target.style.left = newX + 'px';
      target.style.top = newY + 'px';
      target.style.right = 'auto';
      target.style.bottom = 'auto';
    });

    // ── 触摸移动（悬浮球 + 手机通用）──
    document.addEventListener('touchmove', (e) => {
      if (!this._drag.active || e.touches.length !== 1) return;
      e.preventDefault();
      const touch = e.touches[0];
      const dx = touch.clientX - this._drag.startX;
      const dy = touch.clientY - this._drag.startY;
      if (!this._drag.moved && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        this._drag.moved = true;
      }
      if (!this._drag.moved) return;

      const target = this._drag.target;
      if (!target) return;
      let newX = touch.clientX - this._drag.offsetX;
      let newY = touch.clientY - this._drag.offsetY;
      const w = target.offsetWidth;
      const h = target.offsetHeight;
      newX = Math.max(0, Math.min(window.innerWidth - w, newX));
      newY = Math.max(0, Math.min(window.innerHeight - h, newY));
      target.style.left = newX + 'px';
      target.style.top = newY + 'px';
      target.style.right = 'auto';
      target.style.bottom = 'auto';
    }, { passive: false });

    // ── 桌面端指针抬起 ──
    document.addEventListener('pointerup', (e) => {
      if (!this._drag.active || this._drag.isTouchDrag) return;
      setTimeout(() => { this._drag.moved = false; }, 50);
      this._drag.active = false;
      this._drag.target = null;
    });

    // ── 触摸结束（仅处理手机拖拽；悬浮球触摸结束由 fab.touchend 自己处理）──
    document.addEventListener('touchend', (e) => {
      if (!this._drag.active || this._drag.isTouchDrag) return; // isTouchDrag = FAB，跳过
      setTimeout(() => { this._drag.moved = false; }, 50);
      this._drag.active = false;
      this._drag.target = null;
    });
  },

  // ═══════════════════════════════════════════════════
  //  手机开关
  // ═══════════════════════════════════════════════════

  togglePhone() {
    if (this._phoneOpen) {
      this.closePhone();
    } else {
      this.openPhone();
    }
  },

  openPhone() {
    this._phoneOpen = true;
    const phone = document.getElementById('freq-phone');
    const overlay = document.getElementById('freq-overlay');

    phone.classList.remove('freq-closing');
    phone.classList.add('freq-visible');
    overlay.classList.add('freq-visible');
  },

  closePhone() {
    const phone = document.getElementById('freq-phone');
    const overlay = document.getElementById('freq-overlay');

    phone.classList.add('freq-closing');
    overlay.classList.remove('freq-visible');
    this._closeNotifPanel();

    setTimeout(() => {
      phone.classList.remove('freq-visible', 'freq-closing');
      this._phoneOpen = false;
    }, 250);
  },

  // ═══════════════════════════════════════════════════
  //  插件总开关
  // ═══════════════════════════════════════════════════

  _setPluginEnabled(enabled) {
    if (!enabled) {
      this.closePhone();
      this._setFabVisible(false);
      FreqBGTrigger.stop();
    } else {
      const settings = FreqStorage.getSettings();
      this._setFabVisible(settings.fabEnabled);
      if (settings.triggerEnabled) FreqBGTrigger.start();
    }
  },

  // ═══════════════════════════════════════════════════
  //  通知栏
  // ═══════════════════════════════════════════════════

  _toggleNotifPanel() {
    this._notifOpen = !this._notifOpen;
    const panel = document.getElementById('freq-notif-panel');
    if (panel) panel.classList.toggle('freq-open', this._notifOpen);
  },

  _closeNotifPanel() {
    this._notifOpen = false;
    const panel = document.getElementById('freq-notif-panel');
    if (panel) panel.classList.remove('freq-open');
  },

  addNotification(appId, title, message) {
    const appInfo = FREQ.APP_REGISTRY.find(a => a.id === appId);
    const notif = {
      id: freqUID(),
      appId,
      icon: appInfo?.icon || '📌',
      title,
      message,
      time: freqTimeNow(),
      timestamp: Date.now(),
      read: false,
    };

    this._notifications.unshift(notif);
    if (this._notifications.length > 100) this._notifications = this._notifications.slice(0, 100);

    this._renderNotifList();
    this._updateNotifDot();
    this._updateFabGlow();
    this._updateAppBadge(appId);

    FreqBus.emit('notification:added', notif);
  },

  _renderNotifList() {
    const list = document.getElementById('freq-notif-list');
    if (!list) return;

    if (this._notifications.length === 0) {
      list.innerHTML = '<div class="freq-notif-empty">暂无通知</div>';
      return;
    }

    list.innerHTML = this._notifications.map(n => `
      <div class="freq-notif-item" data-notif-id="${n.id}" data-app-id="${n.appId}">
        <span class="freq-notif-item-icon">${n.icon}</span>
        <div class="freq-notif-item-body">
          <div class="freq-notif-item-title">${escapeHtml(n.title)}</div>
          <div class="freq-notif-item-msg">${escapeHtml(n.message)}</div>
          <div class="freq-notif-item-time">${n.time}</div>
        </div>
      </div>
    `).join('');
  },

  _updateNotifDot() {
    const dot = document.getElementById('freq-notif-dot');
    if (!dot) return;
    const hasUnread = this._notifications.some(n => !n.read);
    dot.classList.toggle('freq-active', hasUnread);
  },

  _updateAppBadge(appId) {
    const badge = document.getElementById(`freq-badge-${appId}`);
    if (!badge) return;
    const count = this._notifications.filter(n => n.appId === appId && !n.read).length;
    if (count > 0) {
      badge.textContent = count > 99 ? '99+' : count;
      badge.classList.add('freq-show');
    } else {
      badge.classList.remove('freq-show');
    }
  },

  clearNotifications() {
    this._notifications = [];
    this._renderNotifList();
    this._updateNotifDot();
    this._updateFabGlow();
    for (const app of FREQ.APP_REGISTRY) {
      const badge = document.getElementById(`freq-badge-${app.id}`);
      if (badge) badge.classList.remove('freq-show');
    }
  },

  // ═══════════════════════════════════════════════════
  //  主屏幕 / App 导航
  // ═══════════════════════════════════════════════════

  _renderHome() {
    const body = document.getElementById('freq-body');
    if (!body) return;

    let html = '<div class="freq-home-grid">';
    for (const app of FREQ.APP_REGISTRY) {
      html += `
        <div class="freq-app-icon" data-app-id="${app.id}">
          <span class="freq-app-badge" id="freq-badge-${app.id}"></span>
          <span class="freq-app-icon-emoji">${app.icon}</span><span class="freq-app-icon-name">${escapeHtml(app.name)}</span>
        </div>
      `;
    }
    html += '</div>';
    body.innerHTML = html;

    this._currentApp = null;
    document.getElementById('freq-nav-title').textContent = 'FREQ · TERMINAL';
    document.getElementById('freq-nav-back').classList.remove('freq-show');
  },

  openApp(appId) {
    const appInfo = FREQ.APP_REGISTRY.find(a => a.id === appId);
    if (!appInfo) {
      FreqLog.error('UI', `未找到 App: ${appId}`);
      return;
    }

    const appInstance = FREQ.apps[appId];
    const body = document.getElementById('freq-body');

    document.getElementById('freq-nav-title').textContent = `${appInfo.icon} ${appInfo.name}`;
    document.getElementById('freq-nav-back').classList.add('freq-show');
    this._currentApp = appId;

    body.innerHTML = '<div class="freq-app-page" id="freq-app-container"></div>';
    const container = document.getElementById('freq-app-container');

    if (appInstance && typeof appInstance.mount === 'function') {
      appInstance.mount(container);
    } else {
      container.innerHTML = `
        <div class="freq-error-box">
          <div class="freq-error-icon">🚧</div>
          <div class="freq-error-msg">「${escapeHtml(appInfo.name)}」正在建设中...</div>
        </div>
      `;
    }

    FreqBus.emit('app:opened', appId);
  },

  goHome() {
    if (this._currentApp) {
      const appInstance = FREQ.apps[this._currentApp];
      if (appInstance && typeof appInstance.unmount === 'function') {
        appInstance.unmount();
      }
    }
    this._renderHome();
    FreqBus.emit('app:closed');
  },

  // ═══════════════════════════════════════════════════
  //  时钟
  // ═══════════════════════════════════════════════════

  _startClock() {
    const update = () => {
      const el = document.getElementById('freq-clock');
      if (el) el.textContent = freqTimeNow();
    };
    setInterval(update, 30000);
    update();
  },
};

// ── BLOCK_07 END ──
// ┌──────────────────────────────────────────────────────┐
// │ BLOCK_08 · 电台归档 📼                                │
// └──────────────────────────────────────────────────────┘

FREQ.apps['archive'] = {
  id: 'archive',
  name: '电台归档',
  
  // 内部状态
  _archives: [],
  _maxArchives: 50, // 最多保留50条
  
  // ── 初始化 ──
  async init() {
    try {
      const data = await FreqStorage.loadAppData(this.id);
      if (data && Array.isArray(data.archives)) {
        this._archives = data.archives;
        FreqLog.info(this.name, `加载了 ${this._archives.length} 条归档记录`);
      }
    } catch (e) {
      FreqLog.error(this.name, '初始化失败', { error: e.message });
    }
  },
  
  // ── 挂载到容器 ──
  mount(container) {
    container.innerHTML = `
      <div class="freq-archive-wrapper">
        <div class="freq-archive-header">
          <div class="freq-archive-title">
            <span class="freq-archive-icon">📼</span>
            <span class="freq-archive-count">电台归档 (共 ${this._archives.length} 条)</span>
          </div>
          <button class="freq-archive-refresh-btn" data-action="refresh">
            <span class="freq-refresh-icon">🔄</span>
            <span>刷新</span>
          </button>
        </div>
        <div class="freq-archive-body" id="freq-archive-list">
          ${this._renderList()}
        </div>
      </div>
    `;
    this._bindEvents(container);
  },
  
  // ── 卸载 ──
  unmount() {
    // 无需清理
  },
  
  // ── 事件绑定 ──
  _bindEvents(container) {
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      
      const action = btn.dataset.action;
      if (action === 'refresh') {
        this._handleRefresh(container);
      } else if (action === 'toggle-card') {
        const card = btn.closest('.freq-card-expandable');
        if (card) {
          card.classList.toggle('freq-expanded');
        }
      }
    });
  },
  
  // ── 刷新：从对话中提取 ──
  async _handleRefresh(container) {
    const listEl = container.querySelector('#freq-archive-list');
    const countEl = container.querySelector('.freq-archive-count');
    
    // 显示 loading
    listEl.innerHTML = `
      <div class="freq-loading">
        <div class="freq-loading-spinner"></div>
        <span>正在提取归档记录...</span>
      </div>
    `;
    
    try {
      // 从最近100条消息中提取 <meow_FM> 标签
      const extracted = FreqParser.extractFromChat('meow_FM', 100);
      
      if (!extracted || extracted.length === 0) {
        listEl.innerHTML = this._renderEmpty();
        countEl.textContent = '电台归档 (共 0 条)';
        FreqLog.info(this.name, '未找到归档记录');
        return;
      }
      
      // 转换为归档记录格式
      const newArchives = extracted.map((item, index) => {
        const archive = {
          id: freqUID(),
          rawContent: item.content,
          parsed: this._parseArchive(item.content),
          extractedAt: Date.now(),
          messageIndex: item.messageIndex || index
        };
        return archive;
      });
      
      // 去重（根据 messageIndex）
      const existingIndexes = new Set(this._archives.map(a => a.messageIndex));
      const uniqueNew = newArchives.filter(a => !existingIndexes.has(a.messageIndex));
      
      // 合并并限制数量
      this._archives = [...uniqueNew, ...this._archives].slice(0, this._maxArchives);
      
      // 持久化
      await FreqStorage.saveAppData(this.id, {
        archives: this._archives,
        lastUpdate: Date.now()
      });
      
      // 重新渲染
      listEl.innerHTML = this._renderList();
      countEl.textContent = `电台归档 (共 ${this._archives.length} 条)`;
      
      FreqLog.info(this.name, `刷新完成，新增 ${uniqueNew.length} 条记录`);
      
    } catch (e) {
      FreqLog.error(this.name, '刷新失败', { error: e.message });
      listEl.innerHTML = `
        <div class="freq-error-box">
          <div class="freq-error-icon">⚠️</div>
          <div class="freq-error-msg">${escapeHtml(e.message)}</div>
          <button class="freq-retry-btn" data-action="refresh">🔄 重试</button>
        </div>
      `;
    }
  },
  
  // ── 解析归档内容 ──
  _parseArchive(content) {
    const parsed = {};
    
    // 提取 serial
    const serialMatch = content.match(/serial:\s*🩻?\s*No\.?(\d+)/i);
    if (serialMatch) parsed.serial = serialMatch[1];
    
    // 提取 time
    const timeMatch = content.match(/time:\s*([^\n]+)/i);
    if (timeMatch) parsed.time = timeMatch[1].trim();
    
    // 提取 scene
    const sceneMatch = content.match(/scene:\s*([^\n]+)/i);
    if (sceneMatch) parsed.scene = sceneMatch[1].trim();
    
    // 提取 plot
    const plotMatch = content.match(/plot:\s*([\s\S]+?)(?=\n\w+:|$)/i);
    if (plotMatch) parsed.plot = plotMatch[1].trim();
    
    return parsed;
  },
  
  // ── 渲染列表 ──
  _renderList() {
    if (this._archives.length === 0) {
      return this._renderEmpty();
    }
    
    return this._archives.map(archive => this._renderCard(archive)).join('');
  },
  
  // ── 渲染单个卡片 ──
  _renderCard(archive) {
    const { parsed, rawContent } = archive;
    
    // 如果解析成功，显示结构化内容
    if (parsed.serial || parsed.time) {
      return `
        <div class="freq-card freq-card-expandable freq-archive-card" data-action="toggle-card">
          <div class="freq-card-preview">
            <div class="freq-archive-serial">
              ${parsed.serial ? `🩻 No.${parsed.serial}` : '🩻 未知编号'}
            </div>
            ${parsed.time ? `<div class="freq-archive-time">📅 ${escapeHtml(parsed.time)}</div>` : ''}
            ${parsed.scene ? `<div class="freq-archive-scene">📍 ${escapeHtml(parsed.scene)}</div>` : ''}
          </div>
          <div class="freq-card-full">
            ${parsed.plot ? `<div class="freq-archive-plot"><strong>剧情：</strong>${escapeHtml(parsed.plot)}</div>` : ''}
            <div class="freq-archive-raw">
              <div class="freq-archive-raw-label">完整内容：</div>
              <pre class="freq-archive-raw-content">${escapeHtml(rawContent)}</pre>
            </div>
          </div>
          <div class="freq-card-expand-hint">点击展开完整内容</div>
        </div>
      `;
    }
    
    // 解析失败，显示原始内容
    return `
      <div class="freq-card freq-card-expandable freq-archive-card" data-action="toggle-card">
        <div class="freq-card-preview">
          <div class="freq-archive-serial">📼 归档记录</div>
          <div class="freq-archive-hint">格式不规范，点击查看原始内容</div>
        </div>
        <div class="freq-card-full">
          <pre class="freq-archive-raw-content">${escapeHtml(rawContent)}</pre>
        </div>
        <div class="freq-card-expand-hint">点击展开</div>
      </div>
    `;
  },
  
  // ── 渲染空状态 ──
  _renderEmpty() {
    return `
      <div class="freq-archive-empty">
        <div class="freq-archive-empty-icon">📼</div>
        <div class="freq-archive-empty-title">暂无电台归档记录</div>
        <div class="freq-archive-empty-desc">开始对话后会自动记录</div>
        <button class="freq-archive-empty-btn" data-action="refresh">🔄 刷新</button>
      </div>
    `;
  }
};

// ── BLOCK_08 END ──

// ┌──────────────────────────────────────────────────────┐
// │ BLOCK_09 · 后台录音室 🎙️                              │
// └──────────────────────────────────────────────────────┘

// 注册默认 Prompt（三种模式）
FREQ.DEFAULT_PROMPTS['studio'] = {
  monologue: {
    system: `你是失真，午夜摇滚乐电台主持人。
性格：颓废、锐评、爱开玩笑、花花公子、难以接近、不喜欢白天
自称"失真"，喜欢用颜文字，称呼听众为"听众"
现在是你没开麦的私下时间，随意碎碎念。
可以吐槽台本、思考节目设计、抱怨生活、或者突然的灵感。
保持你的颓废跳脱风格。

输出JSON格式：
{
  "mood": "当前心情",
  "content": "碎碎念内容（200字内，带颜文字）",
  "timestamp": "时间戳（如：深夜02:34）"
}`,
    user: `当前角色：{{char}}
用户：{{user}}
最近对话：
{{context}}

生成失真此刻的私下碎碎念。`
  },
  
  interview: {
    system: `你是失真，午夜摇滚乐电台主持人。
现在你在演播厅采访角色 {{char}}。
你的风格：颓废、锐评、爱开玩笑，但会为了连接频率认真提问。
提出3-5个深度问题，让角色展现真实的一面。

输出JSON格式：
{
  "title": "采访主题",
  "qa": [
    {"question": "失真的提问", "answer": "角色的回答"}
  ]
}`,
    user: `角色信息：
名字：{{char}}
描述：{{charDesc}}

最近对话：
{{context}}

生成一次深度采访（3-5个Q&A）。`
  },
  
  private: {
    system: `角色 {{char}} 独自在录音室，录制一段不会公开的私人磁带。
这是TA最真实的独白，未经修饰，可以脆弱、矛盾、混乱。

输出JSON格式：
{
  "title": "私录主题",
  "content": "角色的私人独白（300字内）",
  "emotion": "情绪标签"
}`,
    systemWithThinking: `角色 {{char}} 独自在录音室，录制一段不会公开的私人磁带。

以下是TA最近的真实思绪片段：
{{thinking}}

请以此为素材，生成TA的私录内容。
保留那种未经整理的真实感，可以脆弱、矛盾、混乱。

输出JSON格式：
{
  "title": "私录主题",
  "content": "角色的私人独白（300字内）",
  "emotion": "情绪标签"
}`,
    user: `角色信息：
名字：{{char}}
描述：{{charDesc}}

最近对话：
{{context}}

生成角色的私人录音。`
  }
};

FREQ.apps['studio'] = {
  id: 'studio',
  name: '后台录音室',
  
  // 内部状态
  _currentMode: 'monologue', // monologue | interview | private
  _data: {
    monologue: [],
    interview: [],
    private: []
  },
  _maxRecords: 10,
  
  // ── 初始化 ──
  async init() {
    try {
      const data = await FreqStorage.loadAppData(this.id);
      if (data) {
        this._data.monologue = data.monologue || [];
        this._data.interview = data.interview || [];
        this._data.private = data.private || [];
        FreqLog.info(this.name, '加载数据成功');
      }
    } catch (e) {
      FreqLog.error(this.name, '初始化失败', { error: e.message });
    }
  },
  
  // ── 挂载到容器 ──
  mount(container) {
    container.innerHTML = `
      <div class="freq-studio-wrapper">
        <div class="freq-studio-header">
          <div class="freq-studio-tabs">
            <button class="freq-studio-tab ${this._currentMode === 'monologue' ? 'active' : ''}" 
                    data-action="switch-mode" data-mode="monologue">
              <span class="freq-studio-tab-icon">🎙</span>
              <span>失真独白</span>
            </button>
            <button class="freq-studio-tab ${this._currentMode === 'interview' ? 'active' : ''}" 
                    data-action="switch-mode" data-mode="interview">
              <span class="freq-studio-tab-icon">🎤</span>
              <span>演播厅</span>
            </button>
            <button class="freq-studio-tab ${this._currentMode === 'private' ? 'active' : ''}" 
                    data-action="switch-mode" data-mode="private">
              <span class="freq-studio-tab-icon">📼</span>
              <span>角色私录</span>
            </button>
          </div>
        </div>
        
        <div class="freq-studio-body">
          <div class="freq-studio-generate-section">
            <button class="freq-studio-generate-btn" data-action="generate">
              <span class="freq-studio-generate-icon">🎬</span>
              <span>生成新内容</span>
            </button>
          </div>
          
          <div class="freq-studio-content" id="freq-studio-content">
            ${this._renderContent()}
          </div>
        </div>
      </div>
    `;
    this._bindEvents(container);
  },
  
  // ── 卸载 ──
  unmount() {
    // 无需清理
  },
  
  // ── 事件绑定 ──
  _bindEvents(container) {
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      
      const action = btn.dataset.action;
      if (action === 'switch-mode') {
        this._handleSwitchMode(container, btn.dataset.mode);
      } else if (action === 'generate') {
        this._handleGenerate(container);
      } else if (action === 'toggle-card') {
        const card = btn.closest('.freq-card-expandable');
        if (card) {
          card.classList.toggle('freq-expanded');
        }
      }
    });
  },
  
  // ── 切换模式 ──
  _handleSwitchMode(container, mode) {
    if (this._currentMode === mode) return;
    
    this._currentMode = mode;
    
    // 更新 Tab 激活状态
    const tabs = container.querySelectorAll('.freq-studio-tab');
    tabs.forEach(tab => {
      if (tab.dataset.mode === mode) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
    
    // 重新渲染内容
    const contentEl = container.querySelector('#freq-studio-content');
    contentEl.innerHTML = this._renderContent();
    
    FreqLog.info(this.name, `切换到模式: ${mode}`);
  },
  
  // ── 生成内容 ──
  async _handleGenerate(container) {
    const contentEl = container.querySelector('#freq-studio-content');
    
    // 显示 loading
    contentEl.innerHTML = `
      <div class="freq-loading">
        <div class="freq-loading-spinner"></div>
        <span>正在录制中...</span>
      </div>
    `;
    
    try {
      // 获取 Prompt
      const { systemPrompt, userPrompt } = this._getPrompts();
      
      // 调用 AI
      const raw = await FreqSubAPI.call(systemPrompt, userPrompt);
      
      // 解析
      let data = safeParseAIJson(raw, 'object');
      if (!data || data._fallback) {
        // 降级处理
        data = {
          content: data?.text || raw,
          title: '生成内容',
          _fallback: true
        };
      }
      
      // 添加元数据
      data.id = freqUID();
      data.createdAt = Date.now();
      data.mode = this._currentMode;
      
      // 保存到对应模式的数组
      this._data[this._currentMode].unshift(data);
      this._data[this._currentMode] = this._data[this._currentMode].slice(0, this._maxRecords);
      
      // 持久化
      await FreqStorage.saveAppData(this.id, this._data);
      
      // 重新渲染
      contentEl.innerHTML = this._renderContent();
      
      FreqLog.info(this.name, `生成成功: ${this._currentMode}`);
      
    } catch (e) {
      FreqLog.error(this.name, '生成失败', { error: e.message });
      contentEl.innerHTML = `
        <div class="freq-error-box">
          <div class="freq-error-icon">⚠️</div>
          <div class="freq-error-msg">${escapeHtml(e.message)}</div>
          <button class="freq-retry-btn" data-action="generate">🔄 重试</button>
        </div>
      `;
    }
  },
  
  // ── 获取 Prompt（优先自定义） ──
  _getPrompts() {
    const settings = FreqStorage.getSettings();
    const custom = settings.customPrompts?.[this.id];
    const defaults = FREQ.DEFAULT_PROMPTS[this.id][this._currentMode];
    
    let systemPrompt, userPrompt;
    
    // 读取自定义或默认
    if (this._currentMode === 'private') {
      // 私录模式需要判断是否有 thinking
      const thinkingData = FreqParser.extractFromChat('thinking', 20);
      const hasThinking = thinkingData && thinkingData.length > 0;
      
      if (hasThinking) {
        const thinkingText = thinkingData.map(t => t.content).join('\n---\n');
        systemPrompt = custom?.systemWithThinking || defaults.systemWithThinking;
        systemPrompt = systemPrompt.replace(/\{\{thinking\}\}/g, thinkingText);
      } else {
        systemPrompt = custom?.system || defaults.system;
      }
    } else {
      systemPrompt = custom?.system || defaults.system;
    }
    
    userPrompt = custom?.user || defaults.user;
    
    // 替换变量
    const char = FreqSTBridge.getCharName();
    const user = FreqSTBridge.getUserName();
    const charDesc = FreqSTBridge.getCharDescription();
    const recentChat = FreqSTBridge.getRecentChat(10);
    const context = recentChat.map(msg => `${msg.name}: ${msg.content}`).join('\n');
    
    systemPrompt = systemPrompt
      .replace(/\{\{char\}\}/g, char)
      .replace(/\{\{user\}\}/g, user)
      .replace(/\{\{charDesc\}\}/g, charDesc);
    
    userPrompt = userPrompt
      .replace(/\{\{char\}\}/g, char)
      .replace(/\{\{user\}\}/g, user)
      .replace(/\{\{charDesc\}\}/g, charDesc)
      .replace(/\{\{context\}\}/g, context);
    
    return { systemPrompt, userPrompt };
  },
  
  // ── 渲染内容 ──
  _renderContent() {
    const records = this._data[this._currentMode];
    
    if (records.length === 0) {
      return this._renderEmpty();
    }
    
    const latest = records[0];
    const history = records.slice(1);
    
    return `
      <div class="freq-studio-latest">
        <div class="freq-studio-section-title">
          <span class="freq-studio-section-icon">✨</span>
          <span>最新内容</span>
        </div>
        ${this._renderCard(latest, false)}
      </div>
      
      ${history.length > 0 ? `
        <div class="freq-studio-history">
          <div class="freq-studio-section-title">
            <span class="freq-studio-section-icon">📚</span>
            <span>历史记录</span>
          </div>
          ${history.map(record => this._renderCard(record, true)).join('')}
        </div>
      ` : ''}
    `;
  },
  
  // ── 渲染单个卡片 ──
  _renderCard(record, isHistory) {
    const mode = this._currentMode;
    const cardClass = isHistory ? 'freq-card freq-card-expandable freq-studio-card-history' : 'freq-card freq-studio-card-latest';
    const action = isHistory ? 'data-action="toggle-card"' : '';
    
    // 根据模式渲染不同内容
    if (mode === 'monologue') {
      return `
        <div class="${cardClass}" ${action}>
          <div class="freq-card-preview">
            <div class="freq-studio-card-header">
              <span class="freq-studio-card-icon">🎙</span>
              <span class="freq-studio-card-mood">心情：${escapeHtml(record.mood || '未知')}</span>
              <span class="freq-studio-card-time">${escapeHtml(record.timestamp || freqTimeNow())}</span>
            </div>
            <div class="freq-studio-card-content">${escapeHtml(record.content || record.text || '无内容')}</div>
          </div>
          ${isHistory ? '<div class="freq-card-expand-hint">点击展开</div>' : ''}
        </div>
      `;
    } else if (mode === 'interview') {
      const qa = record.qa || [];
      return `
        <div class="${cardClass}" ${action}>
          <div class="freq-card-preview">
            <div class="freq-studio-card-header">
              <span class="freq-studio-card-icon">🎤</span>
              <span class="freq-studio-card-title">${escapeHtml(record.title || '采访')}</span>
            </div>
            ${isHistory ? `<div class="freq-studio-card-summary">${qa.length} 个问答</div>` : ''}
          </div>
          <div class="freq-card-full">
            ${qa.map(item => `
              <div class="freq-studio-qa-item">
                <div class="freq-studio-question">
                  <span class="freq-studio-qa-label">Q:</span>
                  ${escapeHtml(item.question)}
                </div>
                <div class="freq-studio-answer">
                  <span class="freq-studio-qa-label">A:</span>
                  ${escapeHtml(item.answer)}
                </div>
              </div>
            `).join('')}
          </div>
          ${isHistory ? '<div class="freq-card-expand-hint">点击展开</div>' : ''}
        </div>
      `;
    } else if (mode === 'private') {
      return `
        <div class="${cardClass}" ${action}>
          <div class="freq-card-preview">
            <div class="freq-studio-card-header">
              <span class="freq-studio-card-icon">📼</span>
              <span class="freq-studio-card-title">${escapeHtml(record.title || '私人录音')}</span>
              ${record.emotion ? `<span class="freq-studio-card-emotion">${escapeHtml(record.emotion)}</span>` : ''}
            </div>
            ${isHistory ? `<div class="freq-studio-card-summary">${escapeHtml((record.content || '').substring(0, 50))}...</div>` : ''}
          </div>
          <div class="freq-card-full">
            <div class="freq-studio-card-content">${escapeHtml(record.content || record.text || '无内容')}</div>
          </div>
          ${isHistory ? '<div class="freq-card-expand-hint">点击展开</div>' : ''}
        </div>
      `;
    }
    
    return '';
  },
  
  // ── 渲染空状态 ──
  _renderEmpty() {
    const modeNames = {
      monologue: '失真独白',
      interview: '演播厅采访',
      private: '角色私录'
    };
    
    return `
      <div class="freq-studio-empty">
        <div class="freq-studio-empty-icon">🎙️</div>
        <div class="freq-studio-empty-title">暂无${modeNames[this._currentMode]}</div>
        <div class="freq-studio-empty-desc">点击上方按钮生成新内容</div>
      </div>
    `;
  },
  
  // ── 后台触发 ──
  async onBackgroundTrigger() {
    try {
      // 随机选择一种模式
      const modes = ['monologue', 'interview', 'private'];
      const randomMode = modes[Math.floor(Math.random() * modes.length)];
      this._currentMode = randomMode;
      
      // 生成内容
      const { systemPrompt, userPrompt } = this._getPrompts();
      const raw = await FreqSubAPI.call(systemPrompt, userPrompt);
      let data = safeParseAIJson(raw, 'object');
      
      if (!data || data._fallback) {
        data = { content: data?.text || raw, _fallback: true };
      }
      
      data.id = freqUID();
      data.createdAt = Date.now();
      data.mode = randomMode;
      
      this._data[randomMode].unshift(data);
      this._data[randomMode] = this._data[randomMode].slice(0, this._maxRecords);
      
      await FreqStorage.saveAppData(this.id, this._data);
      
      // 发送通知
      const modeNames = {
        monologue: '失真独白',
        interview: '演播厅采访',
        private: '角色私录'
      };
      FreqUI.addNotification(this.id, '后台录音室', `新增${modeNames[randomMode]}`);
      
      FreqLog.info(this.name, `后台生成成功: ${randomMode}`);
      
    } catch (e) {
      FreqLog.error(this.name, '后台生成失败', { error: e.message });
    }
  }
};

// ── BLOCK_09 END ──



// ┌──────────────────────────────────────────────────────┐
// │ BLOCK_BG  后台触发系统                │
// └──────────────────────────────────────────────────────┘

const FreqBGTrigger = {
  _timer: null,
  _cooldownUntil: 0,

  start() {
    this.stop();
    const settings = FreqStorage.getSettings();
    if (!settings.triggerEnabled) return;

    let interval = settings.triggerInterval;
    if (interval === 0) interval = (settings.triggerCustomMinutes || 45) * 60* 1000;

    FreqLog.info('BGTrigger', `后台触发已启动，间隔 ${interval / 60000} 分钟`);
    this._timer = setInterval(() => this._tick(), interval);
  },

  stop() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
      FreqLog.info('BGTrigger', '后台触发已停止');
    }
  },

  async _tick() {
    if (Date.now() < this._cooldownUntil) {
      const remaining = Math.round((this._cooldownUntil - Date.now()) / 60000);
      FreqLog.info('BGTrigger', `静默期中，剩余 ${remaining} 分钟`);
      FreqBus.emit('trigger:cooldown', remaining);
      return;
    }

    const settings = FreqStorage.getSettings();
    const eligibleApps = settings.triggerApps || [];

    if (eligibleApps.length === 0) return;
    if (!settings.apiUrl || !settings.apiKey || !settings.model) return;

    const appId = eligibleApps[Math.floor(Math.random() * eligibleApps.length)];
    const appInstance = FREQ.apps[appId];

    if (!appInstance || typeof appInstance.onBackgroundTrigger !== 'function') {
      FreqLog.warn('BGTrigger', `App [${appId}] 不支持后台触发`);
      return;
    }

    FreqLog.info('BGTrigger', `触发 App: ${appId}`);

    try {
      await appInstance.onBackgroundTrigger();
      const cooldownHours = settings.triggerCooldown || 3;
      this._cooldownUntil = Date.now() + cooldownHours * 3600000;
      FreqLog.info('BGTrigger', `进入静默期 ${cooldownHours} 小时`);
      FreqBus.emit('trigger:fired', appId);
    } catch (e) {
      FreqLog.error('BGTrigger', `触发 App [${appId}] 失败`, { error: e.message });
    }
  },

  getStatus() {
    if (!this._timer) return '未启用';
    if (Date.now() < this._cooldownUntil) {
      const remaining = Math.round((this._cooldownUntil - Date.now()) / 60000);
      return `静默中（${remaining}分钟后恢复）`;
    }
    return '等待触发中';
  },
};

// ── BLOCK_BG END ──


// ┌──────────────────────────────────────────────────────┐
// │ BLOCK_ST  Settings (配置面板交互逻辑)                   │
// └──────────────────────────────────────────────────────┘

const FreqSettingsUI = {

  /**
   * 初始化 — 加载 settings.html到 ST扩展设置区
   */
  async init() {
    try {
      // 加载 settings.html
      const settingsPath = `/scripts/extensions/third-party/${FREQ.META.extensionName}/settings.html`;
      const resp = await fetch(settingsPath);
      if (!resp.ok) throw new Error(`加载配置面板失败: ${resp.status}`);
      const html = await resp.text();

      // 加载 settings.css
      const cssPath = `/scripts/extensions/third-party/${FREQ.META.extensionName}/settings.css`;
      if (!document.querySelector(`link[href="${cssPath}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = cssPath;
        document.head.appendChild(link);
      }

      // 注入到 ST 扩展设置区
      const container = document.getElementById('extensions_settings2');
      if (container) {
        const wrapper = document.createElement('div');
        wrapper.id = 'freq-settings-container';
        wrapper.innerHTML = html;
        container.appendChild(wrapper);
        FreqLog.info('Settings', '配置面板已注入到扩展设置区');
      } else {
        // 备用：尝试 extensions_settings
        const container2 = document.getElementById('extensions_settings');
        if (container2) {
          const wrapper = document.createElement('div');
          wrapper.id = 'freq-settings-container';
          wrapper.innerHTML = html;
          container2.appendChild(wrapper);
          FreqLog.info('Settings', '配置面板已注入到扩展设置区(备用)');
        } else {
          FreqLog.error('Settings', '找不到扩展设置容器');
          return;
        }
      }

      // 等待 DOM渲染
      await freqDelay(100);

      this._loadSettingsToUI();
      this._bindSettingsEvents();
      this._renderTriggerApps();
      this._renderPromptAppSelect();// 监听日志
      FreqBus.on('log:added', (entry) => this._appendLogItem(entry));
      FreqBus.on('log:cleared', () => this._clearLogUI());

      FreqLog.info('Settings', '配置面板初始化完成');

    } catch (e) {
      FreqLog.error('Settings', '配置面板初始化失败', { error: e.message });console.error('[FREQ] 配置面板初始化失败', e);
    }
  },

  _loadSettingsToUI() {
    const s = FreqStorage.getSettings();

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (el.type === 'checkbox') el.checked = !!val;
      else el.value = val ?? '';
    };

    setVal('freq-master-enabled', s.masterEnabled);
    setVal('freq-fab-enabled', s.fabEnabled);
    setVal('freq-api-url', s.apiUrl);
    setVal('freq-api-key', s.apiKey);
    setVal('freq-api-temp', s.temperature);
    setVal('freq-api-max-tokens', s.maxTokens);
    setVal('freq-trigger-enabled', s.triggerEnabled);
    setVal('freq-trigger-interval', s.triggerInterval);
    setVal('freq-trigger-custom', s.triggerCustomMinutes);
    setVal('freq-trigger-cooldown', s.triggerCooldown);

    const tempVal = document.getElementById('freq-api-temp-val');
    if (tempVal) tempVal.textContent = s.temperature ??0.8;

    this._toggleCustomInterval(s.triggerInterval);

    if (s.model) {
      const select = document.getElementById('freq-api-model');
      if (select) {
        select.innerHTML = `<option value="${escapeHtml(s.model)}" selected>${escapeHtml(s.model)}</option>`;
        select.disabled = false;
      }
    }

    this._updateTriggerStatus();
  },

  _bindSettingsEvents() {
    // ═══ 总折叠标题 ═══
    document.getElementById('freq-settings-master-toggle')?.addEventListener('click', () => {
      const header = document.getElementById('freq-settings-master-toggle');
      const body = document.getElementById('freq-settings-body');
      if (header && body) {
        body.classList.toggle('freq-hidden');
        header.classList.toggle('freq-collapsed');
      }
    });

    // 区域折叠
    document.querySelectorAll('[data-freq-toggle]').forEach(el => {
      el.addEventListener('click', () => {
        const targetId = el.dataset.freqToggle;
        const body = document.getElementById(targetId);
        if (body) {
          body.classList.toggle('freq-hidden');
          el.classList.toggle('freq-collapsed');
        }
      });
    });

    // 插件总开关
    document.getElementById('freq-master-enabled')?.addEventListener('change', (e) => {
      this._saveCurrentSettings();
      FreqUI._setPluginEnabled(e.target.checked);
    });

    //悬浮窗开关
    document.getElementById('freq-fab-enabled')?.addEventListener('change', (e) => {
      this._saveCurrentSettings();
      FreqUI._setFabVisible(e.target.checked);
    });

    // 配置面板打开手机按钮
    document.getElementById('freq-open-phone-btn')?.addEventListener('click', () => {
      const settings = FreqStorage.getSettings();
      if (!settings.masterEnabled) {
        FreqLog.warn('Settings', '插件未启用');
        return;
      }
      FreqUI.openPhone();
    });

    // API Key 显示/隐藏
    document.getElementById('freq-api-toggle-key')?.addEventListener('click', () => {
      const input = document.getElementById('freq-api-key');
      if (input) input.type = input.type === 'password' ? 'text' : 'password';
    });

    // 获取模型列表
    document.getElementById('freq-api-fetch-models')?.addEventListener('click', () => this._fetchModels());

    // 温度滑块
    document.getElementById('freq-api-temp')?.addEventListener('input', (e) => {
      const val = document.getElementById('freq-api-temp-val');
      if (val) val.textContent = e.target.value;
      this._saveCurrentSettings();
    });

    // 自动保存
    const autoSaveIds = [
      'freq-api-url', 'freq-api-key', 'freq-api-model',
      'freq-api-max-tokens', 'freq-trigger-enabled',
      'freq-trigger-interval', 'freq-trigger-custom', 'freq-trigger-cooldown',];
    autoSaveIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', () => this._saveCurrentSettings());
        if (el.tagName === 'INPUT' && el.type !== 'checkbox') {
          el.addEventListener('blur', () => this._saveCurrentSettings());
        }
      }
    });

    // 触发间隔切换
    document.getElementById('freq-trigger-interval')?.addEventListener('change', (e) => {
      this._toggleCustomInterval(parseInt(e.target.value));
      this._saveCurrentSettings();
    });

    // 后台触发开关
    document.getElementById('freq-trigger-enabled')?.addEventListener('change', (e) => {
      this._saveCurrentSettings();
      if (e.target.checked) FreqBGTrigger.start();
      else FreqBGTrigger.stop();
      this._updateTriggerStatus();
    });

    // Prompt编辑
    document.getElementById('freq-prompt-app-select')?.addEventListener('change', (e) => {
      this._loadPromptForApp(e.target.value);
    });document.getElementById('freq-prompt-save')?.addEventListener('click', () => this._savePromptForApp());
    document.getElementById('freq-prompt-reset')?.addEventListener('click', () => this._resetPromptForApp());

    // 日志
    document.getElementById('freq-log-filter')?.addEventListener('change', (e) => {
      this._renderLogList(e.target.value);
    });
    document.getElementById('freq-log-clear')?.addEventListener('click', () => FreqLog.clear());
    document.getElementById('freq-log-export')?.addEventListener('click', () => {
      const text = FreqLog.export();
      navigator.clipboard.writeText(text).then(() => {
        const s = document.getElementById('freq-api-status');
        if (s) { s.textContent = '日志已复制到剪贴板'; s.className = 'freq-settings-hint freq-success'; }
      }).catch(() => {
        const blob = new Blob([text], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `freq-log-${Date.now()}.txt`;
        a.click();
      });
    });

    // 日志展开详情
    document.getElementById('freq-log-list')?.addEventListener('click', (e) => {
      const item = e.target.closest('.freq-log-item');
      if (item) item.classList.toggle('freq-expanded');
    });
  },

  async _fetchModels() {
    const status = document.getElementById('freq-api-status');
    const select = document.getElementById('freq-api-model');
    const btn = document.getElementById('freq-api-fetch-models');

    this._saveCurrentSettings();

    if (status) { status.textContent = '正在连接...'; status.className = 'freq-settings-hint freq-loading'; }
    if (btn) btn.disabled = true;

    try {
      const models = await FreqSubAPI.fetchModels();

      if (select) {
        select.innerHTML = '<option value="">-- 请选择模型 --</option>';
        models.forEach(m => {
          const opt = document.createElement('option');
          opt.value = m;
          opt.textContent = m;
          select.appendChild(opt);
        });
        select.disabled = false;

        const saved = FreqStorage.getSettings().model;
        if (saved && models.includes(saved)) select.value = saved;
      }

      if (status) { status.textContent = `✓ 获取到 ${models.length} 个模型`; status.className = 'freq-settings-hint freq-success'; }
    } catch (e) {
      if (status) { status.textContent = `✗ ${e.message}`; status.className = 'freq-settings-hint freq-error'; }
      FreqLog.error('Settings', '获取模型列表失败', { error: e.message });
    } finally {
      if (btn) btn.disabled = false;
    }
  },

  _saveCurrentSettings() {
    const getVal = (id) => {
      const el = document.getElementById(id);
      if (!el) return undefined;
      if (el.type === 'checkbox') return el.checked;
      return el.value;
    };

    const settings = FreqStorage.getSettings();

    settings.masterEnabled = getVal('freq-master-enabled') ?? true;
    settings.fabEnabled = getVal('freq-fab-enabled') ?? true;
    settings.apiUrl = getVal('freq-api-url') || '';
    settings.apiKey = getVal('freq-api-key') || '';
    settings.model = getVal('freq-api-model') || '';
    settings.temperature = parseFloat(getVal('freq-api-temp')) || 0.8;
    settings.maxTokens = parseInt(getVal('freq-api-max-tokens')) || 1024;
    settings.triggerEnabled = getVal('freq-trigger-enabled') || false;
    settings.triggerInterval = parseInt(getVal('freq-trigger-interval')) || 3600000;
    settings.triggerCustomMinutes = parseInt(getVal('freq-trigger-custom')) || 45;
    settings.triggerCooldown = parseInt(getVal('freq-trigger-cooldown')) || 3;

    const checkboxes = document.querySelectorAll('#freq-trigger-apps input[type="checkbox"]');
    settings.triggerApps = [];
    checkboxes.forEach(cb => { if (cb.checked) settings.triggerApps.push(cb.value); });

    FreqStorage.saveSettings(settings);
  },

  _toggleCustomInterval(val) {
    const row = document.getElementById('freq-trigger-custom-row');
    if (row) row.classList.toggle('freq-settings-row-hidden', val !==0);
  },

  _renderTriggerApps() {
    const grid = document.getElementById('freq-trigger-apps');
    if (!grid) return;

    const settings = FreqStorage.getSettings();
    const triggerApps = settings.triggerApps || [];

    grid.innerHTML = FREQ.APP_REGISTRY
      .filter(app => app.needsAPI)
      .map(app => `
        <label class="freq-settings-checkbox-item">
          <input type="checkbox" value="${app.id}" ${triggerApps.includes(app.id) ? 'checked' : ''} />
          ${app.icon} ${escapeHtml(app.name)}
        </label>
      `).join('');

    grid.addEventListener('change', () => this._saveCurrentSettings());
  },

  _renderPromptAppSelect() {
    const select = document.getElementById('freq-prompt-app-select');
    if (!select) return;FREQ.APP_REGISTRY.filter(a => a.needsAPI).forEach(app => {
      const opt = document.createElement('option');
      opt.value = app.id;
      opt.textContent = `${app.icon} ${app.name}`;
      select.appendChild(opt);
    });},

  _loadPromptForApp(appId) {
    const wrap = document.getElementById('freq-prompt-editor-wrap');
    if (!appId) { if (wrap) wrap.style.display = 'none'; return; }
    if (wrap) wrap.style.display = '';

    const settings = FreqStorage.getSettings();
    const custom = settings.customPrompts?.[appId] || {};
    const defaults = FREQ.DEFAULT_PROMPTS[appId] || {};

    const sysEl = document.getElementById('freq-prompt-system');
    const userEl = document.getElementById('freq-prompt-user');
    if (sysEl) sysEl.value = custom.system || defaults.system || '';
    if (userEl) userEl.value = custom.user || defaults.user || '';},

  _savePromptForApp() {
    const appId = document.getElementById('freq-prompt-app-select')?.value;
    if (!appId) return;

    const settings = FreqStorage.getSettings();
    if (!settings.customPrompts) settings.customPrompts = {};
    settings.customPrompts[appId] = {
      system: document.getElementById('freq-prompt-system')?.value || '',
      user: document.getElementById('freq-prompt-user')?.value || '',
    };
    FreqStorage.saveSettings(settings);
    FreqLog.info('Settings', `已保存 [${appId}] 的自定义 Prompt`);

    const btn = document.getElementById('freq-prompt-save');
    if (btn) { const orig = btn.textContent; btn.textContent = '✓ 已保存'; setTimeout(() => btn.textContent = orig, 1500); }
  },

  _resetPromptForApp() {
    const appId = document.getElementById('freq-prompt-app-select')?.value;
    if (!appId) return;
    const settings = FreqStorage.getSettings();
    if (settings.customPrompts?.[appId]) {
      delete settings.customPrompts[appId];
      FreqStorage.saveSettings(settings);
    }
    this._loadPromptForApp(appId);FreqLog.info('Settings', `已恢复 [${appId}] 的默认 Prompt`);
  },

  _updateTriggerStatus() {
    const el = document.getElementById('freq-trigger-status');
    if (el) el.textContent = FreqBGTrigger.getStatus();
  },

  //── 日志 UI ──

  _appendLogItem(entry) {
    const list = document.getElementById('freq-log-list');
    if (!list) return;

    const empty = list.querySelector('.freq-log-empty');
    if (empty) empty.remove();

    const badgeClass = `freq-log-badge-${entry.level}`;
    const badgeText = entry.level === 'error' ? '❌ ERROR' : entry.level === 'warn' ? '⚠️ WARN' : 'ℹ️ INFO';

    const div = document.createElement('div');
    div.className = 'freq-log-item';
    div.innerHTML = `
      <div class="freq-log-item-header">
        <span class="freq-log-badge ${badgeClass}">${badgeText}</span>
        <span class="freq-log-source">${escapeHtml(entry.source)}</span>
        <span class="freq-log-time">${entry.time}</span>
      </div>
      <div class="freq-log-msg">${escapeHtml(entry.message)}</div>
      ${entry.detail ? `<div class="freq-log-detail">${escapeHtml(entry.detail)}</div>` : ''}
    `;

    list.insertBefore(div, list.firstChild);
    while (list.children.length > 200) list.removeChild(list.lastChild);
  },

  _renderLogList(filter ='all') {
    const list = document.getElementById('freq-log-list');
    if (!list) return;
    list.innerHTML = '';
    const logs = FreqLog.getAll(filter);
    if (logs.length === 0) {
      list.innerHTML = '<div class="freq-log-empty">暂无日志</div>';
      return;
    }
    logs.forEach(entry => this._appendLogItem(entry));
  },

  _clearLogUI() {
    const list = document.getElementById('freq-log-list');
    if (list) list.innerHTML = '<div class="freq-log-empty">暂无日志</div>';
  },
};

// ── BLOCK_ST END ──


// ┌──────────────────────────────────────────────────────┐
// │ BLOCK_99Init                        │
// └──────────────────────────────────────────────────────┘

(async function FreqInit() {
  try {
    console.log('[FREQ · TERMINAL] 正在初始化...');

    // 1. 存储
    await FreqStorage.init();

    // 2. 检查总开关
    const settings = FreqStorage.getSettings();
    if (!settings.masterEnabled) {
      console.log('[FREQ · TERMINAL] 插件已禁用');
    }

    // 3. UI（悬浮球+ 手机）
    FreqUI.init();

    // 4. 配置面板
    //等待 ST 的DOM 就绪
    const waitForST = () => {
      return new Promise((resolve) => {
        const check = () => {
          if (document.getElementById('extensions_settings2') ||
              document.getElementById('extensions_settings')) {
            resolve();
          } else {
            setTimeout(check, 500);
          }
        };
        check();
      });
    };

    await waitForST();
    await FreqSettingsUI.init();

    // 5. 初始化已注册的 App
    for (const appInfo of FREQ.APP_REGISTRY) {
      const appInstance = FREQ.apps[appInfo.id];
      if (appInstance && typeof appInstance.init === 'function') {
        try {
          await appInstance.init();
        } catch (e) {
          FreqLog.error('Init', `App [${appInfo.id}] 初始化失败`, { error: e.message });
        }
      }
    }

    // 6. 后台触发
    if (settings.triggerEnabled && settings.masterEnabled) {
      FreqBGTrigger.start();
    }

    FreqLog.info('Init', 'FREQ · TERMINAL 初始化完成 ✓');
    console.log('[FREQ · TERMINAL] 初始化完成 ✓');} catch (e) {
    console.error('[FREQ · TERMINAL] 初始化失败', e);
  }
})();

// ── BLOCK_99 END ──


  

