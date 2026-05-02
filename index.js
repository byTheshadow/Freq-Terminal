//╔══════════════════════════════════════════════════════════════════╗
// ║  FREQ · TERMINALv2.0                                        ║
// ║  「失真电台」虚拟手机插件                                        ║
// ║  For SillyTavern                                               ║
// ╚══════════════════════════════════════════════════════════════════╝

// ┌──────────────────────────────────────────────────────┐
// │ BLOCK_00  常量+ 工具函数                              │
// └──────────────────────────────────────────────────────┘

const FREQ = {};

// ── 插件元信息 ──
FREQ.META = {
  name: 'FREQ · TERMINAL',
  version: '2.0.0',
  prefix: 'freq',
};

// ── 17个 App 注册表 ──
FREQ.APP_REGISTRY = [
  { id: 'archive',name: '电台归档',icon: '📼', needsAPI: false },
  { id: 'studio',       name: '后台录音室',       icon: '🎙️', needsAPI: true },
  { id: 'moments',      name: '朋友圈·电波',     icon: '📡', needsAPI: true },
  { id: 'weather',      name: '信号气象站',       icon: '🌦️', needsAPI: true },
  { id: 'scan',         name: '弦外之音·扫频',   icon: '📻', needsAPI: true },
  { id: 'cosmos',       name: '宇宙频率·感知',   icon: '🌌', needsAPI: true },
  { id: 'checkin',      name: '打卡·连线日志',   icon: '📋', needsAPI: true },
  { id: 'schedule',     name: '日程表·双线轨道', icon: '🗓️', needsAPI: true },
  { id: 'novel',        name: '频道文库',         icon: '📖', needsAPI: true },
  { id: 'map',          name: '异界探索',         icon: '🗺️', needsAPI: true },
  { id: 'delivery',     name: '跨次元配送',       icon: '🛵', needsAPI: true },
  { id: 'forum',        name: '频道留言板',       icon: '💬', needsAPI: true },
  { id: 'capsule',      name: '时光胶囊',         icon: '💊', needsAPI: true },
  { id: 'dream',        name: '梦境记录仪',       icon: '🌙', needsAPI: true },
  { id: 'emotion',      name: '情绪电波仪',       icon: '💓', needsAPI: true },
  { id: 'blackbox',     name: '黑匣子·禁区档案', icon: '🔒', needsAPI: true },
  { id: 'translator',   name: '信号翻译器',       icon: '🔤', needsAPI: true },
];

// ── App 实例容器（后续BLOCK 注册） ──
FREQ.apps = {};

// ── 默认 Prompt 模板（后续各 App 填充） ──
FREQ.DEFAULT_PROMPTS = {};

// ── 工具函数 ──

/**
 * 三层容错JSON 解析
 * @param {string} raw - AI 返回的原始文本
 * @param {string} expect - 期望类型 'object' | 'array'
 * @returns {object|array|null}
 */
function safeParseAIJson(raw, expect = 'object') {
  if (!raw || typeof raw !== 'string') return null;

  //── 第一层：标准解析（修复常见问题） ──
  try {
    let cleaned = raw.trim()
      // 去掉 markdown 代码块
      .replace(/^```(?:json)?\s*/im, '')
      .replace(/\s*```\s*$/m, '')
      .trim();

    //提取 JSON 主体
    const pattern = expect === 'array' ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/;
    const match = cleaned.match(pattern);

    if (match) {
      let jsonStr = match[0]
        // 中文引号 → 英文引号
        .replace(/[\u201c\u201d]/g, '"')
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u300c\u300d]/g, '"')
        // 全角冒号 → 半角
        .replace(/：/g, ':')
        //尾随逗号
        .replace(/,\s*([}\]])/g, '$1')
        // BOM
        .replace(/^\uFEFF/, '');

      const result = JSON.parse(jsonStr);
      return result;
    }
  } catch (e) {
    FreqLog.warn('JSON解析', '第一层解析失败，尝试降级', { error: e.message, raw: raw.substring(0, 200) });
  }

  // ── 第二层：正则提取关键字段 ──
  try {
    if (expect === 'object') {
      const extracted = {};
      // 通用字段提取
      const fields = ['title', 'content', 'text', 'name', 'message', 'body', 'desc', 'description'];
      for (const field of fields) {
        const re = new RegExp(`"${field}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`, 'i');
        const m = raw.match(re);
        if (m) extracted[field] = m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
      }
      // 数字字段
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
    }

    if (expect === 'array') {
      //尝试提取数组元素
      const items = [];
      const re = /\{[^{}]*\}/g;
      let m;
      while ((m = re.exec(raw)) !== null) {
        try {
          items.push(JSON.parse(m[0]));
        } catch (_) { /* skip */ }
      }
      if (items.length > 0) {
        FreqLog.info('JSON解析', '第二层数组提取成功', { count: items.length });
        return items;
      }
    }
  } catch (e) {
    FreqLog.warn('JSON解析', '第二层提取失败', { error: e.message });
  }

  // ── 第三层：纯文本兜底 ──
  FreqLog.warn('JSON解析', '降级为纯文本兜底', { raw: raw.substring(0, 100) });
  return { text: raw.trim(), _fallback: true };
}

/**
 * HTML 转义
 */
function escapeHtml(str) {
  if (!str) return '';
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(str).replace(/[&<>"']/g, c => map[c]);
}

/**
 * 获取当前时间字符串
 */
function freqTimeNow() {
  const d = new Date();
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

/**
 * 获取当前日期时间字符串
 */
function freqDateTimeNow() {
  const d = new Date();
  return d.toLocaleString('zh-CN', {
    month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',});
}

/**
 * 生成唯一 ID
 */
function freqUID() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

/**
 * 延迟
 */
function freqDelay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── BLOCK_00 END ──────────────────────────────────────


// ┌──────────────────────────────────────────────────────┐
// │ BLOCK_01  EventBus (模块间通信)                       │
// └──────────────────────────────────────────────────────┘

const FreqBus = {
  _listeners: {},

  /**
   * 监听事件
   * @param {string} event
   * @param {Function} fn
   */
  on(event, fn) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(fn);
  },

  /**
   * 取消监听
   */
  off(event, fn) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(f => f !== fn);
  },

  /**
   * 触发事件
   */
  emit(event, ...args) {
    if (!this._listeners[event]) return;
    for (const fn of this._listeners[event]) {
      try {
        fn(...args);
      } catch (e) {
        FreqLog.error('EventBus', `事件 [${event}] 处理器报错`, { error: e.message });
      }
    }
  },

  /**
   * 一次性监听
   */
  once(event, fn) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      fn(...args);
    };
    this.on(event, wrapper);
  },
};

// ── BLOCK_01 END ──────────────────────────────────────


// ┌──────────────────────────────────────────────────────┐
// │ BLOCK_02  ST Bridge (与 SillyTavern 通信)             │
// └──────────────────────────────────────────────────────┘

const FreqSTBridge = {
  /**
   * 获取当前角色名
   */
  getCharName() {
    try {
      const ctx = window.SillyTavern?.getContext?.();
      if (ctx?.name2) return ctx.name2;
      // 备用方案
      const el = document.querySelector('#rm_print_characters_block .character_select.selected .ch_name');
      return el?.textContent?.trim() || '未知角色';
    } catch (e) {
      return '未知角色';
    }
  },

  /**
   * 获取用户名
   */
  getUserName() {
    try {
      const ctx = window.SillyTavern?.getContext?.();
      if (ctx?.name1) return ctx.name1;
      return document.querySelector('#send_form [name="user_name"]')?.value || '用户';
    } catch (e) {
      return '用户';
    }
  },

  /**
   * 获取最近 N 条对话
   */
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

  /**
   * 获取角色描述
   */
  getCharDescription() {
    try {
      const ctx = window.SillyTavern?.getContext?.();
      if (ctx?.characters) {
        const char = ctx.characters[ctx.characterId];
        return char?.description || char?.data?.description || '';
      }
      return '';
    } catch (e) {
      return '';
    }
  },
};

// ── BLOCK_02 END ──────────────────────────────────────


// ┌──────────────────────────────────────────────────────┐
// │ BLOCK_03  Parser (解析预设XML 标签)                   │
// └──────────────────────────────────────────────────────┘

const FreqParser = {
  /**
   * 从对话中提取指定 XML 标签内容
   * @param {string} tagName - 标签名 (如 'meow_FM')
   * @param {string} text - 原始文本
   * @returns {string[]} 匹配到的内容数组
   */
  extractTag(tagName, text) {
    if (!text) return [];
    const re = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'gi');
    const results = [];
    let m;
    while ((m = re.exec(text)) !== null) {
      results.push(m[1].trim());
    }
    return results;
  },

  /**
   * 从所有对话中提取标签
   * @param {string} tagName
   * @param {number} maxMessages -扫描最近多少条
   * @returns {Array<{index: number, content: string}>}
   */
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

// ── BLOCK_03 END ──────────────────────────────────────


// ┌──────────────────────────────────────────────────────┐
// │ BLOCK_04  SubAPI (副API 调用封装)                     │
// └──────────────────────────────────────────────────────┘

const FreqSubAPI = {
  /**
   * 获取配置
   */
  _getConfig() {
    return FreqStorage.getSettings();
  },

  /**
   * 获取可用模型列表（不消耗额度）
   * @returns {Promise<string[]>}
   */
  async fetchModels() {
    const config = this._getConfig();
    if (!config.apiUrl || !config.apiKey) {
      throw new Error('请先填写 API 地址和密钥');
    }

    const baseUrl = config.apiUrl.replace(/\/+$/, '');
    const url = `${baseUrl}/models`;

    FreqLog.info('SubAPI', '正在获取模型列表...', { url });

    const resp = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
      },
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

    FreqLog.info('SubAPI', `获取到 ${models.length} 个模型`, { models: models.slice(0, 10) });
    return models;
  },

  /**
   * 调用副 API
   * @param {string} systemPrompt
   * @param {string} userPrompt
   * @param {object} opts - 可选参数覆盖
   * @returns {Promise<string>} AI 返回的文本
   */
  async call(systemPrompt, userPrompt, opts = {}) {
    const config = this._getConfig();
    if (!config.apiUrl || !config.apiKey || !config.model) {
      throw new Error('副 API 未配置完成，请在设置中配置');
    }

    const baseUrl = config.apiUrl.replace(/\/+$/, '');
    const url = `${baseUrl}/chat/completions`;

    const body = {
      model: config.model,
      temperature: opts.temperature ?? config.temperature ?? 0.8,
      max_tokens: opts.max_tokens ?? config.maxTokens ?? 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    };

    FreqLog.info('SubAPI', '发起AI 调用', {
      model: body.model,
      temp: body.temperature,
      maxTokens: body.max_tokens,
      promptLen: systemPrompt.length + userPrompt.length,
    });

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      const errMsg = `API 调用失败: ${resp.status} ${errText.substring(0, 200)}`;
      FreqLog.error('SubAPI', errMsg);
      throw new Error(errMsg);
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content || '';

    if (!content) {
      FreqLog.warn('SubAPI', 'AI 返回了空内容');}

    return content;
  },
};

// ── BLOCK_04 END ──────────────────────────────────────


// ┌──────────────────────────────────────────────────────┐
// │ BLOCK_05  FreqLog (报错日志系统)                       │
// └──────────────────────────────────────────────────────┘

const FreqLog = {
  _logs: [],
  _maxLogs: 500,

  /**
   * 添加日志
   * @param {'error'|'warn'|'info'} level
   * @param {string} source - 来源模块
   * @param {string} message - 简短描述
   * @param {*} detail - 详细信息
   */
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

    // 限制数量
    if (this._logs.length > this._maxLogs) {
      this._logs = this._logs.slice(0, this._maxLogs);
    }

    // 同步到控制台
    const consoleFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    consoleFn(`[FREQ·${level.toUpperCase()}] [${source}] ${message}`, detail || '');

    // 通知 UI 更新
    FreqBus.emit('log:added', entry);
  },

  error(source, message, detail) { this._add('error', source, message, detail); },
  warn(source, message, detail) { this._add('warn', source, message, detail); },
  info(source, message, detail) { this._add('info', source, message, detail); },

  /**
   * 获取日志（可过滤）
   */
  getAll(filter = 'all') {
    if (filter === 'all') return this._logs;
    return this._logs.filter(l => l.level === filter);
  },

  /**
   * 清空日志
   */
  clear() {
    this._logs = [];
    FreqBus.emit('log:cleared');
  },

  /**
   * 导出日志为文本
   */
  export() {
    return this._logs.map(l =>
      `[${l.time}] [${l.level.toUpperCase()}] [${l.source}] ${l.message}${l.detail ? '\n  ' + l.detail : ''}`
    ).join('\n');
  },
};

// ── BLOCK_05 END ──────────────────────────────────────


// ┌──────────────────────────────────────────────────────┐
// │ BLOCK_06  Storage (持久化存储)                         │
// └──────────────────────────────────────────────────────┘

const FreqStorage = {
  _dbName: 'FreqTerminalDB',
  _dbVersion: 1,
  _db: null,
  _settingsKey: 'freq_terminal_settings',

  /**
   * 初始化 IndexedDB
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this._dbName, this._dbVersion);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('appData')) {
          db.createObjectStore('appData', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('notifications')) {
          db.createObjectStore('notifications', { keyPath: 'id' });
        }
      };

      request.onsuccess = (e) => {
        this._db = e.target.result;
        FreqLog.info('Storage', 'IndexedDB 初始化成功');
        resolve();
      };

      request.onerror = (e) => {
        FreqLog.error('Storage', 'IndexedDB 初始化失败', { error: e.target.error?.message });
        // 降级到 localStorage
        FreqLog.warn('Storage', '降级为 localStorage');
        resolve();
      };
    });
  },

  /**
   * 保存 App 数据
   */
  async saveAppData(appId, data) {
    const record = { key: appId, data, updatedAt: Date.now() };

    if (this._db) {
      return new Promise((resolve, reject) => {
        try {
          const tx = this._db.transaction('appData', 'readwrite');
          tx.objectStore('appData').put(record);
          tx.oncomplete = () => resolve();
          tx.onerror = (e) => {
            FreqLog.error('Storage', `保存失败: ${appId}`, { error: e.target.error?.message });
            reject(e.target.error);
          };
        } catch (e) {
          // 降级
          this._localSave(appId, data);
          resolve();
        }
      });
    } else {
      this._localSave(appId, data);
    }
  },

  /**
   * 读取 App 数据
   */
  async loadAppData(appId) {
    if (this._db) {
      return new Promise((resolve) => {
        try {
          const tx = this._db.transaction('appData', 'readonly');
          const req = tx.objectStore('appData').get(appId);
          req.onsuccess = () => resolve(req.result?.data || null);
          req.onerror = () => resolve(this._localLoad(appId));
        } catch (e) {
          resolve(this._localLoad(appId));
        }
      });
    }return this._localLoad(appId);
  },

  /**
   * localStorage 降级
   */
  _localSave(key, data) {
    try {
      localStorage.setItem(`freq_app_${key}`, JSON.stringify(data));
    } catch (e) {
      FreqLog.error('Storage', 'localStorage 保存失败', { error: e.message });
    }
  },

  _localLoad(key) {
    try {
      const raw = localStorage.getItem(`freq_app_${key}`);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  /**
   * 获取设置
   */
  getSettings() {
    try {
      const raw = localStorage.getItem(this._settingsKey);
      return raw ? JSON.parse(raw) : this._defaultSettings();
    } catch (e) {
      return this._defaultSettings();
    }
  },

  /**
   * 保存设置
   */
  saveSettings(settings) {
    try {
      localStorage.setItem(this._settingsKey, JSON.stringify(settings));
      FreqBus.emit('settings:changed', settings);
    } catch (e) {
      FreqLog.error('Storage', '保存设置失败', { error: e.message });
    }
  },

  /**
   * 默认设置
   */
  _defaultSettings() {
    return {
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

// ── BLOCK_06 END ──────────────────────────────────────


// ┌──────────────────────────────────────────────────────┐
// │ BLOCK_07  UI Core (主界面框架 + 通知栏 + 导航)│
// └──────────────────────────────────────────────────────┘

const FreqUI = {
  _phoneOpen: false,
  _notifOpen: false,
  _currentApp: null,  // null = 主屏幕
  _notifications: [],

  /**
   * 初始化 UI
   */
  init() {
    this._createDOM();
    this._bindCoreEvents();
    this._startClock();
    FreqLog.info('UI', '界面初始化完成');
  },

  /**
   * 创建主DOM 结构
   */
  _createDOM() {
    // 触发按钮
    const toggleBtn = document.createElement('div');
    toggleBtn.id = 'freq-toggle-btn';
    toggleBtn.innerHTML = '📻';
    toggleBtn.title = 'FREQ · TERMINAL';
    document.body.appendChild(toggleBtn);

    // 遮罩
    const overlay = document.createElement('div');
    overlay.id = 'freq-overlay';
    document.body.appendChild(overlay);

    // 手机外壳
    const shell = document.createElement('div');
    shell.id = 'freq-phone-shell';
    shell.innerHTML = `
      <!-- 状态栏 -->
      <div class="freq-statusbar" id="freq-statusbar">
        <div class="freq-statusbar-left">
          <span class="freq-statusbar-signal">📶</span>
          <span class="freq-statusbar-time" id="freq-clock">${freqTimeNow()}</span>
        </div>
        <div class="freq-statusbar-right">
          <span class="freq-notif-dot" id="freq-notif-dot"></span>
          <span class="freq-statusbar-battery">🔋</span>
        </div>

        <!-- 通知栏（下拉式） -->
        <div class="freq-notification-panel" id="freq-notif-panel">
          <div class="freq-notif-header">
            <span>通知</span>
            <button class="freq-notif-clear-btn" id="freq-notif-clear">清除全部</button>
          </div>
          <div class="freq-notif-list" id="freq-notif-list">
            <div class="freq-notif-empty">暂无通知</div></div>
        </div>
      </div>

      <!-- 导航栏 -->
      <div class="freq-navbar">
        <button class="freq-navbar-back" id="freq-nav-back">‹</button>
        <span class="freq-navbar-title" id="freq-nav-title">FREQ · TERMINAL</span></div>

      <!-- 主内容区-->
      <div class="freq-body" id="freq-body">
        <!-- 主屏幕或App 页面 -->
      </div>

      <!-- 底部 Dock -->
      <div class="freq-dock">
        <button class="freq-dock-btn" id="freq-dock-home" title="主屏幕">🏠</button>
        <button class="freq-dock-btn" id="freq-dock-refresh" title="刷新">🔄</button>
      </div>
    `;
    document.body.appendChild(shell);

    // 渲染主屏幕
    this._renderHome();
  },

  /**
   * 渲染主屏幕（App 网格）
   */
  _renderHome() {
    const body = document.getElementById('freq-body');
    if (!body) return;

    let html = '<div class="freq-home-grid">';
    for (const app of FREQ.APP_REGISTRY) {
      html += `
        <div class="freq-app-icon" data-app-id="${app.id}">
          <span class="freq-app-badge" id="freq-badge-${app.id}"></span>
          <span class="freq-app-icon-emoji">${app.icon}</span>
          <span class="freq-app-icon-name">${escapeHtml(app.name)}</span>
        </div>
      `;
    }
    html += '</div>';
    body.innerHTML = html;

    this._currentApp = null;
    document.getElementById('freq-nav-title').textContent = 'FREQ · TERMINAL';
    document.getElementById('freq-nav-back').classList.remove('freq-visible');
  },

  /**
   * 打开 App
   */
  openApp(appId) {
    const appInfo = FREQ.APP_REGISTRY.find(a => a.id === appId);
    if (!appInfo) {
      FreqLog.error('UI', `未找到 App: ${appId}`);
      return;
    }

    const appInstance = FREQ.apps[appId];
    const body = document.getElementById('freq-body');

    // 更新导航
    document.getElementById('freq-nav-title').textContent = `${appInfo.icon} ${appInfo.name}`;
    document.getElementById('freq-nav-back').classList.add('freq-visible');
    this._currentApp = appId;

    // 清空并挂载
    body.innerHTML = '<div class="freq-app-page" id="freq-app-container"></div>';
    const container = document.getElementById('freq-app-container');

    if (appInstance && typeof appInstance.mount === 'function') {
      appInstance.mount(container);
    } else {
      // App尚未实现
      container.innerHTML = `
        <div class="freq-error-box">
          <div class="freq-error-icon">🚧</div>
          <div class="freq-error-msg">「${escapeHtml(appInfo.name)}」正在建设中...</div>
        </div>
      `;
    }

    FreqBus.emit('app:opened', appId);
  },

  /**
   * 返回主屏幕
   */
  goHome() {
    if (this._currentApp) {
      const appInstance = FREQ.apps[this._currentApp];
      if (appInstance && typeof appInstance.unmount === 'function') {
        appInstance.unmount();
      }
    }
    this._renderHome();FreqBus.emit('app:closed');
  },

  /**
   * 打开/关闭手机
   */
  togglePhone() {
    this._phoneOpen = !this._phoneOpen;
    const shell = document.getElementById('freq-phone-shell');
    const overlay = document.getElementById('freq-overlay');
    const toggleBtn = document.getElementById('freq-toggle-btn');

    if (this._phoneOpen) {
      shell.classList.add('freq-open');
      overlay.classList.add('freq-visible');
      toggleBtn.classList.add('freq-phone-open');
    } else {
      shell.classList.remove('freq-open');
      overlay.classList.remove('freq-visible');
      toggleBtn.classList.remove('freq-phone-open');
      // 关闭通知栏
      this._closeNotifPanel();
    }
  },

  /**
   * 通知栏 - 下拉/收起
   */
  _toggleNotifPanel() {
    this._notifOpen = !this._notifOpen;
    const panel = document.getElementById('freq-notif-panel');
    if (this._notifOpen) {
      panel.classList.add('freq-notif-open');
    } else {
      panel.classList.remove('freq-notif-open');
    }
  },

  _closeNotifPanel() {
    this._notifOpen = false;
    const panel = document.getElementById('freq-notif-panel');
    if (panel) panel.classList.remove('freq-notif-open');
  },

  /**
   * 添加通知
   */
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
    // 限制数量
    if (this._notifications.length > 100) {
      this._notifications = this._notifications.slice(0, 100);
    }

    this._renderNotifList();
    this._updateNotifDot();
    this._updateAppBadge(appId);

    FreqBus.emit('notification:added', notif);
  },

  /**
   * 渲染通知列表
   */
  _renderNotifList() {
    const list = document.getElementById('freq-notif-list');
    if (!list) return;

    if (this._notifications.length === 0) {
      list.innerHTML = '<div class="freq-notif-empty">暂无通知</div>';
      return;
    }

    list.innerHTML = this._notifications.map(n => `
      <div class="freq-notif-item${n.read ? '' : ' freq-unread'}" data-notif-id="${n.id}" data-app-id="${n.appId}">
        <span class="freq-notif-item-icon">${n.icon}</span>
        <div class="freq-notif-item-body">
          <div class="freq-notif-item-title">${escapeHtml(n.title)}</div>
          <div class="freq-notif-item-msg">${escapeHtml(n.message)}</div>
          <div class="freq-notif-item-time">${n.time}</div>
        </div>
      </div>
    `).join('');
  },

  /**
   * 更新通知红点
   */
  _updateNotifDot() {
    const dot = document.getElementById('freq-notif-dot');
    if (!dot) return;
    const hasUnread = this._notifications.some(n => !n.read);
    dot.classList.toggle('freq-has-notif', hasUnread);
  },

  /**
   * 更新 App 角标
   */
  _updateAppBadge(appId) {
    const badge = document.getElementById(`freq-badge-${appId}`);
    if (!badge) return;
    const count = this._notifications.filter(n => n.appId === appId && !n.read).length;
    if (count > 0) {
      badge.textContent = count > 99 ? '99+' : count;
      badge.classList.add('freq-has-badge');
    } else {
      badge.classList.remove('freq-has-badge');
    }
  },

  /**
   * 清除所有通知
   */
  clearNotifications() {
    this._notifications = [];
    this._renderNotifList();
    this._updateNotifDot();
    // 清除所有角标
    for (const app of FREQ.APP_REGISTRY) {
      const badge = document.getElementById(`freq-badge-${app.id}`);
      if (badge) badge.classList.remove('freq-has-badge');
    }
  },

  /**
   * 绑定核心事件
   */
  _bindCoreEvents() {
    // 触发按钮
    document.getElementById('freq-toggle-btn')?.addEventListener('click', () => {
      this.togglePhone();
    });

    // 遮罩点击关闭
    document.getElementById('freq-overlay')?.addEventListener('click', () => {
      this.togglePhone();
    });

    // 状态栏点击 → 下拉通知
    document.getElementById('freq-statusbar')?.addEventListener('click', (e) => {
      // 避免通知栏内部点击冒泡
      if (e.target.closest('.freq-notification-panel')) return;
      this._toggleNotifPanel();
    });

    // 通知栏 - 清除全部
    document.getElementById('freq-notif-clear')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.clearNotifications();
    });

    // 通知栏 - 点击通知项跳转
    document.getElementById('freq-notif-list')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const item = e.target.closest('.freq-notif-item');
      if (!item) return;

      const notifId = item.dataset.notifId;
      const appId = item.dataset.appId;

      // 标记已读
      const notif = this._notifications.find(n => n.id === notifId);
      if (notif) notif.read = true;
      this._renderNotifList();
      this._updateNotifDot();
      this._updateAppBadge(appId);

      // 关闭通知栏并跳转
      this._closeNotifPanel();
      this.openApp(appId);
    });

    // 返回按钮
    document.getElementById('freq-nav-back')?.addEventListener('click', () => {
      this.goHome();
    });

    // Dock - 主屏幕
    document.getElementById('freq-dock-home')?.addEventListener('click', () => {
      this.goHome();
    });

    // Dock - 刷新
    document.getElementById('freq-dock-refresh')?.addEventListener('click', () => {
      if (this._currentApp) {
        this.openApp(this._currentApp);
      }
    });

    // App 图标点击（事件委托）
    document.getElementById('freq-body')?.addEventListener('click', (e) => {
      const icon = e.target.closest('.freq-app-icon');
      if (icon && !this._currentApp) {
        const appId = icon.dataset.appId;
        if (appId) this.openApp(appId);
      }
    });
  },

  /**
   * 时钟更新
   */
  _startClock() {
    const update = () => {
      const el = document.getElementById('freq-clock');
      if (el) el.textContent = freqTimeNow();
    };
    setInterval(update, 30000);
  },
};

// ── BLOCK_07 END ──────────────────────────────────────


// ┌──────────────────────────────────────────────────────┐
// │ BLOCK_BG  后台触发系统                │
// └──────────────────────────────────────────────────────┘

const FreqBGTrigger = {
  _timer: null,
  _cooldownUntil: 0,  // 静默期结束时间戳

  /**
   * 启动后台触发
   */
  start() {
    this.stop();
    const settings = FreqStorage.getSettings();
    if (!settings.triggerEnabled) {
      FreqLog.info('BGTrigger', '后台触发未启用');
      return;
    }

    let interval = settings.triggerInterval;
    if (interval === 0) {
      interval = (settings.triggerCustomMinutes || 45) * 60 * 1000;
    }

    FreqLog.info('BGTrigger', `后台触发已启动，间隔 ${interval / 60000} 分钟`);

    this._timer = setInterval(() => {
      this._tick();
    }, interval);
  },

  /**
   * 停止后台触发
   */
  stop() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
      FreqLog.info('BGTrigger', '后台触发已停止');
    }
  },

  /**
   * 每次触发
   */
  async _tick() {
    // 检查静默期
    if (Date.now() < this._cooldownUntil) {
      const remaining = Math.round((this._cooldownUntil - Date.now()) / 60000);
      FreqLog.info('BGTrigger', `静默期中，剩余 ${remaining} 分钟`);
      FreqBus.emit('trigger:cooldown', remaining);
      return;
    }

    const settings = FreqStorage.getSettings();
    const eligibleApps = settings.triggerApps || [];

    if (eligibleApps.length === 0) {
      FreqLog.warn('BGTrigger', '没有 App 参与后台触发');
      return;
    }

    // 检查 API 是否配置
    if (!settings.apiUrl || !settings.apiKey || !settings.model) {
      FreqLog.warn('BGTrigger', '副API 未配置，跳过触发');
      return;
    }

    // 随机选一个 App
    const appId = eligibleApps[Math.floor(Math.random() * eligibleApps.length)];
    const appInstance = FREQ.apps[appId];

    if (!appInstance || typeof appInstance.onBackgroundTrigger !== 'function') {
      FreqLog.warn('BGTrigger', `App [${appId}] 不支持后台触发`);
      return;
    }

    FreqLog.info('BGTrigger', `触发 App: ${appId}`);

    try {
      await appInstance.onBackgroundTrigger();

      // 进入静默期
      const cooldownHours = settings.triggerCooldown || 3;
      this._cooldownUntil = Date.now() + cooldownHours * 3600000;
      FreqLog.info('BGTrigger', `进入静默期 ${cooldownHours} 小时`);
      FreqBus.emit('trigger:fired', appId);FreqBus.emit('trigger:cooldown-start', cooldownHours);

    } catch (e) {
      FreqLog.error('BGTrigger', `触发 App [${appId}] 失败`, { error: e.message });
    }
  },

  /**
   * 获取状态
   */
  getStatus() {
    if (!this._timer) return '未启用';
    if (Date.now() < this._cooldownUntil) {
      const remaining = Math.round((this._cooldownUntil - Date.now()) / 60000);
      return `静默中（${remaining} 分钟后恢复）`;
    }
    return '等待触发中';
  },
};

// ── BLOCK_BG END ──────────────────────────────────────


// ┌──────────────────────────────────────────────────────┐
// │ BLOCK_ST  Settings (配置面板交互逻辑)                   │
// └──────────────────────────────────────────────────────┘

const FreqSettingsUI = {
  /**
   * 初始化配置面板交互
   */
  init() {
    // 等待 DOM 加载
    this._waitForSettingsDOM().then(() => {
      this._loadSettingsToUI();
      this._bindSettingsEvents();
      this._renderTriggerApps();
      this._renderPromptAppSelect();
      FreqLog.info('Settings', '配置面板初始化完成');
    });

    // 监听日志更新
    FreqBus.on('log:added', (entry) => this._appendLogItem(entry));
    FreqBus.on('log:cleared', () => this._clearLogUI());
  },

  /**
   * 等待配置面板 DOM 就绪
   */
  _waitForSettingsDOM() {
    return new Promise((resolve) => {
      const check = () => {
        if (document.getElementById('freq-api-url')) {
          resolve();
        } else {
          setTimeout(check, 500);
        }
      };
      check();
    });
  },

  /**
   * 将保存的设置加载到 UI
   */
  _loadSettingsToUI() {
    const s = FreqStorage.getSettings();

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) {
        if (el.type === 'checkbox') el.checked = val;
        else el.value = val ?? '';
      }
    };

    setVal('freq-api-url', s.apiUrl);
    setVal('freq-api-key', s.apiKey);
    setVal('freq-api-temp', s.temperature);
    setVal('freq-api-max-tokens', s.maxTokens);
    setVal('freq-trigger-enabled', s.triggerEnabled);
    setVal('freq-trigger-interval', s.triggerInterval);
    setVal('freq-trigger-custom', s.triggerCustomMinutes);
    setVal('freq-trigger-cooldown', s.triggerCooldown);

    // 温度显示值
    const tempVal = document.getElementById('freq-api-temp-val');
    if (tempVal) tempVal.textContent = s.temperature ??0.8;

    // 自定义间隔行
    this._toggleCustomInterval(s.triggerInterval);

    // 模型下拉（如果有保存的模型）
    if (s.model) {
      const select = document.getElementById('freq-api-model');
      if (select) {
        select.innerHTML = `<option value="${escapeHtml(s.model)}" selected>${escapeHtml(s.model)}</option>`;
        select.disabled = false;
      }
    }

    // 触发状态
    this._updateTriggerStatus();
  },

  /**
   * 绑定配置面板事件
   */
  _bindSettingsEvents() {
    // ── 区域折叠/展开 ──
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

    // ── API Key 显示/隐藏 ──
    document.getElementById('freq-api-toggle-key')?.addEventListener('click', () => {
      const input = document.getElementById('freq-api-key');
      if (input) input.type = input.type === 'password' ? 'text' : 'password';
    });

    // ── 获取模型列表 ──
    document.getElementById('freq-api-fetch-models')?.addEventListener('click', async () => {
      await this._fetchModels();
    });

    // ── 温度滑块 ──
    document.getElementById('freq-api-temp')?.addEventListener('input', (e) => {
      const val = document.getElementById('freq-api-temp-val');
      if (val) val.textContent = e.target.value;
      this._saveCurrentSettings();
    });

    // ── 所有输入变化自动保存 ──
    const autoSaveIds = [
      'freq-api-url', 'freq-api-key', 'freq-api-model',
      'freq-api-max-tokens', 'freq-trigger-enabled',
      'freq-trigger-interval', 'freq-trigger-custom', 'freq-trigger-cooldown',
    ];
    autoSaveIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', () => this._saveCurrentSettings());
        if (el.tagName === 'INPUT' && el.type !== 'checkbox') {
          el.addEventListener('blur', () => this._saveCurrentSettings());
        }
      }
    });

    // ── 触发间隔切换 ──
    document.getElementById('freq-trigger-interval')?.addEventListener('change', (e) => {
      this._toggleCustomInterval(parseInt(e.target.value));this._saveCurrentSettings();
    });

    // ── 后台触发开关 ──
    document.getElementById('freq-trigger-enabled')?.addEventListener('change', (e) => {
      this._saveCurrentSettings();
      if (e.target.checked) {
        FreqBGTrigger.start();
      } else {
        FreqBGTrigger.stop();
      }
      this._updateTriggerStatus();
    });

    // ── Prompt编辑 ──
    document.getElementById('freq-prompt-app-select')?.addEventListener('change', (e) => {
      this._loadPromptForApp(e.target.value);
    });

    document.getElementById('freq-prompt-save')?.addEventListener('click', () => {
      this._savePromptForApp();
    });

    document.getElementById('freq-prompt-reset')?.addEventListener('click', () => {
      this._resetPromptForApp();
    });

    // ── 日志过滤 ──
    document.getElementById('freq-log-filter')?.addEventListener('change', (e) => {
      this._renderLogList(e.target.value);
    });

    // ── 日志清空 ──
    document.getElementById('freq-log-clear')?.addEventListener('click', () => {
      FreqLog.clear();
    });

    // ── 日志导出 ──
    document.getElementById('freq-log-export')?.addEventListener('click', () => {
      const text = FreqLog.export();
      navigator.clipboard.writeText(text).then(() => {
        const status = document.getElementById('freq-api-status');
        if (status) {
          status.textContent = '日志已复制到剪贴板';
          status.className = 'freq-settings-hint freq-success';
        }
      }).catch(() => {
        // 降级：下载文件
        const blob = new Blob([text], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `freq-log-${Date.now()}.txt`;
        a.click();
      });
    });

    // ── 日志列表点击展开详情 ──
    document.getElementById('freq-log-list')?.addEventListener('click', (e) => {
      const item = e.target.closest('.freq-log-item');
      if (item) item.classList.toggle('freq-expanded');
    });
  },

  /**
   * 获取模型列表
   */
  async _fetchModels() {
    const status = document.getElementById('freq-api-status');
    const select = document.getElementById('freq-api-model');
    const btn = document.getElementById('freq-api-fetch-models');

    // 先保存当前输入
    this._saveCurrentSettings();

    status.textContent = '正在连接...';
    status.className = 'freq-settings-hint freq-loading';
    btn.disabled = true;

    try {
      const models = await FreqSubAPI.fetchModels();

      select.innerHTML = '<option value="">-- 请选择模型 --</option>';
      models.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m;
        select.appendChild(opt);
      });
      select.disabled = false;

      // 恢复之前选择的模型
      const saved = FreqStorage.getSettings().model;
      if (saved && models.includes(saved)) {
        select.value = saved;
      }

      status.textContent = `✓ 获取到 ${models.length} 个模型`;
      status.className = 'freq-settings-hint freq-success';

    } catch (e) {
      status.textContent = `✗ ${e.message}`;
      status.className = 'freq-settings-hint freq-error';
      FreqLog.error('Settings', '获取模型列表失败', { error: e.message });
    } finally {
      btn.disabled = false;
    }
  },

  /**
   * 保存当前设置
   */
  _saveCurrentSettings() {
    const getVal = (id) => {
      const el = document.getElementById(id);
      if (!el) return undefined;
      if (el.type === 'checkbox') return el.checked;
      return el.value;
    };

    const settings = FreqStorage.getSettings();

    settings.apiUrl = getVal('freq-api-url') || '';
    settings.apiKey = getVal('freq-api-key') || '';
    settings.model = getVal('freq-api-model') || '';
    settings.temperature = parseFloat(getVal('freq-api-temp')) || 0.8;
    settings.maxTokens = parseInt(getVal('freq-api-max-tokens')) || 1024;
    settings.triggerEnabled = getVal('freq-trigger-enabled') || false;
    settings.triggerInterval = parseInt(getVal('freq-trigger-interval')) || 3600000;
    settings.triggerCustomMinutes = parseInt(getVal('freq-trigger-custom')) || 45;
    settings.triggerCooldown = parseInt(getVal('freq-trigger-cooldown')) || 3;

    // 触发 App 列表
    const checkboxes = document.querySelectorAll('#freq-trigger-apps input[type="checkbox"]');
    settings.triggerApps = [];
    checkboxes.forEach(cb => {
      if (cb.checked) settings.triggerApps.push(cb.value);
    });

    FreqStorage.saveSettings(settings);
  },

  /**
   * 切换自定义间隔行
   */
  _toggleCustomInterval(val) {
    const row = document.getElementById('freq-trigger-custom-row');
    if (row) {
      row.classList.toggle('freq-settings-row-hidden', val !==0);
    }
  },

  /**
   * 渲染触发 App 复选框
   */
  _renderTriggerApps() {
    const grid = document.getElementById('freq-trigger-apps');
    if (!grid) return;

    const settings = FreqStorage.getSettings();
    const triggerApps = settings.triggerApps || [];

    grid.innerHTML = FREQ.APP_REGISTRY
      .filter(app => app.needsAPI)
      .map(app => `
        <label class="freq-settings-checkbox-item">
          <input type="checkbox" value="${app.id}"
                 ${triggerApps.includes(app.id) ? 'checked' : ''} />
          ${app.icon} ${escapeHtml(app.name)}
        </label>
      `).join('');

    // 绑定变化事件
    grid.addEventListener('change', () => this._saveCurrentSettings());
  },

  /**
   * 渲染 Prompt App 选择下拉
   */
  _renderPromptAppSelect() {
    const select = document.getElementById('freq-prompt-app-select');
    if (!select) return;

    FREQ.APP_REGISTRY.filter(a => a.needsAPI).forEach(app => {
      const opt = document.createElement('option');
      opt.value = app.id;
      opt.textContent = `${app.icon} ${app.name}`;
      select.appendChild(opt);
    });
  },

  /**
   * 加载指定 App 的 Prompt
   */
  _loadPromptForApp(appId) {
    const wrap = document.getElementById('freq-prompt-editor-wrap');
    if (!appId) {
      if (wrap) wrap.style.display = 'none';
      return;
    }
    if (wrap) wrap.style.display = '';

    const settings = FreqStorage.getSettings();
    const custom = settings.customPrompts?.[appId] || {};
    const defaults = FREQ.DEFAULT_PROMPTS[appId] || {};

    const sysEl = document.getElementById('freq-prompt-system');
    const userEl = document.getElementById('freq-prompt-user');

    if (sysEl) sysEl.value = custom.system || defaults.system || '';
    if (userEl) userEl.value = custom.user || defaults.user || '';
  },

  /**
   * 保存 Prompt
   */
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
    FreqLog.info('Settings', `已保存 App [${appId}] 的自定义 Prompt`);

    // 视觉反馈
    const btn = document.getElementById('freq-prompt-save');
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = '✓ 已保存';
      setTimeout(() => btn.textContent = orig, 1500);
    }
  },

  /**
   * 恢复默认 Prompt
   */
  _resetPromptForApp() {
    const appId = document.getElementById('freq-prompt-app-select')?.value;
    if (!appId) return;

    const settings = FreqStorage.getSettings();
    if (settings.customPrompts?.[appId]) {
      delete settings.customPrompts[appId];
      FreqStorage.saveSettings(settings);
    }

    this._loadPromptForApp(appId);
    FreqLog.info('Settings', `已恢复 App [${appId}] 的默认 Prompt`);
  },

  /**
   * 更新触发状态显示
   */
  _updateTriggerStatus() {
    const el = document.getElementById('freq-trigger-status');
    if (el) el.textContent = FreqBGTrigger.getStatus();
  },

  // ── 日志 UI ──

  /**
   * 追加一条日志到UI
   */
  _appendLogItem(entry) {
    const list = document.getElementById('freq-log-list');
    if (!list) return;

    // 移除空提示
    const empty = list.querySelector('.freq-log-empty');
    if (empty) empty.remove();

    const badgeClass = `freq-log-badge-${entry.level}`;
    const badgeText = entry.level === 'error' ? '❌ ERROR': entry.level === 'warn' ? '⚠️ WARN'
                    : 'ℹ️ INFO';

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

    // 插入到最前面
    list.insertBefore(div, list.firstChild);

    // 限制显示数量
    while (list.children.length > 200) {
      list.removeChild(list.lastChild);
    }
  },

  /**
   * 按级别渲染日志
   */
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

  /**
   * 清空日志UI
   */
  _clearLogUI() {
    const list = document.getElementById('freq-log-list');
    if (list) list.innerHTML = '<div class="freq-log-empty">暂无日志</div>';
  },
};

// ── BLOCK_ST END ──────────────────────────────────────


// ┌──────────────────────────────────────────────────────┐
// │ BLOCK_99Init (插件初始化)                            │
// └──────────────────────────────────────────────────────┘

(async function FreqInit() {
  try {
    console.log('[FREQ · TERMINAL] 正在初始化...');

    // 1. 初始化存储
    await FreqStorage.init();

    // 2. 初始化 UI
    FreqUI.init();

    // 3. 初始化配置面板
    FreqSettingsUI.init();

    // 4. 初始化所有已注册的 App
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

    // 5. 启动后台触发（如果已启用）
    const settings = FreqStorage.getSettings();
    if (settings.triggerEnabled) {
      FreqBGTrigger.start();
    }

    FreqLog.info('Init', 'FREQ · TERMINAL 初始化完成 ✓');console.log('[FREQ · TERMINAL] 初始化完成 ✓');

  } catch (e) {
    console.error('[FREQ · TERMINAL] 初始化失败', e);
    FreqLog.error('Init', '插件初始化失败', { error: e.message, stack: e.stack });
  }
})();

// ── BLOCK_99 END ──────────────────────────────────────
