//═══════════════════════════════════════════════════════════════
//Freq · Terminal—  频率终端
//  SillyTavern Extension  v1.0.0
//  index.js — 主逻辑（block_00~ block_07+ block_99）
// ═══════════════════════════════════════════════════════════════

// ============================================================
//  block_00  —  常量& 配置默认值 & 提示词模板
// ============================================================
const FREQ_ID = 'freq-terminal';
const FREQ_VERSION = '1.0.0';

/** 默认设置（会被ST 持久化） */
const FREQ_DEFAULTS = {
  enabled: true,
  fabEnabled: true,
  fabPosX: -1,        // -1 表示使用默认位置
  fabPosY: -1,
  notifyPosition: 'top-right',

  // 副API
  apiUrl: '',
  apiKey: '',
  apiModel: '',
  apiModelList: [],
  triggerInterval: 3600000,       // 默认 1 小时
  customIntervalMin: 60,

  // 提示词
  prompts: {
    system: `你是 [{char_name}]，现在是 {real_datetime}，不在正式广播中。
当前连线摘要：{last_meow_fm_plot}
当前配乐氛围：{current_bgm}
宇宙频率状态：{cosmic_freq_status}
约束：严格保持角色性格 · 不提AI/模型/扮演 · 不超过 {limit} 字
若宇宙频率开启，可以隐晦感知「屏幕外」。只输出内容本身，无前缀。`,

    app01: '请根据以下 meow_FM 数据，生成格式化的电台归档摘要。',
    app02_monologue: '任务：以失真的身份，写一段没开麦时的碎碎念。颓废跳脱，偶尔锐评User。不超过 80 字。只输出独白本身。',
    app02_interview: '任务：失真作主持人采访当前角色，生成 Q&A 格式对话。失真负责提问和点评，角色负责回答。2-3 轮对话，总计不超过 300 字。',
    app02_private: '任务：只有角色自己，录一段不会公开的私人磁带。失真不在场，是角色最真实的状态。不超过 150 字。\n若以下有角色思绪片段，请以此为素材保留未经整理的真实感：\n{thinking_excerpt}',
    app03: '任务：基于以下角色人设列表，生成 3-5 条朋友圈动态和互评。每条动态包含发布者名字和内容。用<post> 标签包裹每条动态。',
    app04: '任务：当前天气信息如下：{weather_info}。请以角色身份，用当前 BGM「{current_bgm}」的文风，写一句关心语。不超过 50 字。只输出关心语本身。',
    app05: '任务：随机截获一个 NPC 的内心独白碎片。像收音机扫台时偶尔捕获的杂音，短小（20-40 字）、神秘、不完整。格式：[截获频率 · {npc_name}] {内心独白碎片}',
    app06: '任务：宇宙频率已开启。角色感知到屏幕外的信息：时间 {real_datetime}，天气 {weather_info}。写一条穿透第四面墙的感知消息，隐晦不点破，不超过 50 字。',
    app07: '任务：User 完成了打卡目标「{goal_name}」，已连续 {streak} 天。以角色身份生成即时反馈，连续天数影响语气。不超过 60 字。',
    app08: '任务：User轨道和角色轨道在同一天都有日程，这是一个共鸣时刻。请以角色身份写一句关于这个巧合的感想。不超过 40 字。',
    app09: '任务：基于当前世界观，生成一章短篇小说内容（200-400 字）。可隐晦引用当前 Seeds伏笔。用 <chapter> 标签包裹。',
    app10: '任务：基于预设世界观，生成一个地点的详细介绍。包含地名、简介、氛围描述。用 <location> 标签包裹。',
    app11: '任务：基于当前天气「{weather_info}」和BGM「{current_bgm}」，以角色身份推荐 2-3 道菜，每道菜附角色口吻的点评。用 <menu> 标签包裹。',
    app12: '任务：基于以下角色人设列表，生成 3-5 条论坛帖子和互评。包含发帖人、标题、内容、回复。用 <thread> 标签包裹每个帖子。',
    app13: '任务：User 在 {delay_time} 前写了一条时光胶囊消息：「{user_message}」。现在时间到了，以角色身份回信。角色知道等待了多久，会在回信里自然提及这个时间感。不超过 200 字。',
    app14: '任务：User 描述了一个梦境：「{dream_content}」。以角色视角解读这个梦，可荒诞、可温柔、可锐评。不超过 150 字。',
    app15: '任务：分析以下对话内容的情绪倾向，生成一句角色视角的感知描述。不超过 60 字。同时给出情绪关键词（用 <emotion> 标签包裹）。',
    app16: '任务：生成一段角色之间不在User 面前的私下对话或内部通讯记录。像在偷窥一个不属于你的世界。用 <secret> 标签包裹。不超过 200 字。',
    app17: '任务：将以下文字用当前 BGM「{current_bgm}」的文风重新表达。只输出翻译结果。',
    bg_message: '任务：现在是 {real_datetime}。以角色身份，写一条主动发给 User 的消息。像是角色在某个瞬间想到了 User，随手发来的。结合当前时间和氛围，不超过 80 字。只输出消息本身。',
  },
};

/** 17 个 App 的注册信息 */
const FREQ_APP_DEFS = [
  { id: 'archive',num: '01', name: '电台归档',icon: '📻', color: '#085041' },
  { id: 'studio',     num: '02', name: '后台录音室',      icon: '🎙️', color: '#3C3489' },
  { id: 'moments',    num: '03', name: '朋友圈·电波',    icon: '📡', color: '#633806' },
  { id: 'weather',    num: '04', name: '信号气象站',      icon: '🌦️', color: '#085041' },
  { id: 'scanner',    num: '05', name: '弦外之音',        icon: '📶', color: '#0C447C' },
  { id: 'cosmic',     num: '06', name: '宇宙频率',        icon: '🌌', color: '#a32d2d' },
  { id: 'checkin',    num: '07', name: '打卡日志',        icon: '📅', color: '#2D5A0E' },
  { id: 'calendar',   num: '08', name: '日程表',          icon: '🗓️', color: '#0C447C' },
  { id: 'novel',      num: '09', name: '频道文库',        icon: '📖', color: '#2E2E3A' },
  { id: 'map',        num: '10', name: '异界探索',        icon: '🗺️', color: '#633806' },
  { id: 'delivery',   num: '11', name: '跨次元外卖',      icon: '🛵', color: '#633806' },
  { id: 'forum',      num: '12', name: '频道留言板',      icon: '💬', color: '#72243E' },
  { id: 'capsule',    num: '13', name: '时光胶囊',        icon: '💊', color: '#72243E' },
  { id: 'dream',      num: '14', name: '梦境记录仪',      icon: '🌙', color: '#3C3489' },
  { id: 'emotion',    num: '15', name: '情绪电波仪',      icon: '💓', color: '#3C3489' },
  { id: 'blackbox',   num: '16', name: '黑匣子',          icon: '📦', color: '#a32d2d' },
  { id: 'translator', num: '17', name: '信号翻译器',      icon: '🔄', color: '#085041' },
];


// ============================================================
//  block_01  —  日志 & 报错系统
// ============================================================
const FreqLog = (() => {
  const _logs = [];
  const MAX_LOGS = 500;

  function _ts() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
  }

  function _add(level, source, msg, detail) {
    const entry = {
      time: _ts(),
      timestamp: Date.now(),
      level,
      source: source || 'system',
      message: typeof msg === 'string' ? msg : String(msg),
      detail: detail ? (typeof detail === 'string' ? detail : JSON.stringify(detail, null, 2)) : '',
    };
    _logs.unshift(entry);
    if (_logs.length > MAX_LOGS) _logs.length = MAX_LOGS;

    // 同时输出到浏览器控制台
    const prefix = `[FreqTerminal][${entry.source}]`;
    if (level === 'error') console.error(prefix, msg, detail || '');
    else if (level === 'warn') console.warn(prefix, msg, detail || '');
    else console.log(prefix, msg, detail || '');

    // 通知配置面板刷新
    _refreshSettingsLog();
  }

  function _refreshSettingsLog() {
    const listEl = document.getElementById('freq-sp-log-list');
    const countEl = document.getElementById('freq-sp-log-count');
    if (!listEl) return;

    countEl && (countEl.textContent = `${_logs.length} 条`);

    if (_logs.length === 0) {
      listEl.innerHTML = '<div class="freq-sp-log-empty">暂无日志</div>';
      return;
    }

    // 只渲染最近 100 条，避免 DOM 过重
    const show = _logs.slice(0, 100);
    listEl.innerHTML = show.map(e => {
      const cls = `freq-log-${e.level}`;
      const detailHtml = e.detail
        ? `\n${e.detail}`
        : '';
      return `<div class="freq-sp-log-item ${cls}"><span class="freq-sp-log-time">${e.time}</span><span class="freq-sp-log-level">[${e.level.toUpperCase()}]</span><span class="freq-sp-log-src">${e.source}</span>${_escHtml(e.message)}${_escHtml(detailHtml)}</div>`;
    }).join('');
  }

  function _escHtml(s) {
    if (!s) return '';
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  return {
    info:(src, msg, detail) => _add('info', src, msg, detail),
    warn:  (src, msg, detail) => _add('warn', src, msg, detail),
    error: (src, msg, detail) => _add('error', src, msg, detail),
    getAll: () => [..._logs],
    clear: () => { _logs.length = 0; _refreshSettingsLog(); },
    refreshUI: _refreshSettingsLog,
  };
})();


// ============================================================
//  block_02  —  通知系统
// ============================================================
const FreqNotify = (() => {
  let _notifications = [];
  let _toastContainer = null;
  let _settings = null; // 引用设置

  function init(settings) {
    _settings = settings;
    // 创建 toast 容器
    _ensureToastContainer();
  }

  function _ensureToastContainer() {
    if (_toastContainer) return;
    _toastContainer = document.createElement('div');
    _toastContainer.className = 'freq-toast-container';
    _updateToastPosition();
    document.body.appendChild(_toastContainer);
  }

  function _updateToastPosition() {
    if (!_toastContainer) return;
    const pos = (_settings && _settings.notifyPosition) || 'top-right';
    _toastContainer.className = 'freq-toast-container freq-pos-' + pos;}

  /**
   * 推送通知
   * @param {string} appId   - App ID 或 'system'
   * @param {string} icon    - emoji
   * @param {string} title   - 标题
   * @param {string} body    - 内容
   * @param {object} [opts]  - { silent: false }
   */
  function push(appId, icon, title, body, opts = {}) {
    const item = {
      id: Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      appId,
      icon: icon || '📻',
      title: title || '',
      body: body || '',
      time: new Date(),
      read: false,
    };
    _notifications.unshift(item);
    if (_notifications.length > 200) _notifications.length = 200;

    // 更新手机内通知栏
    _renderDrawer();
    // 更新角标
    _updateBadges();

    // 弹出 toast（除非静默）
    if (!opts.silent) {
      _showToast(item);
    }

    FreqLog.info('notify', `通知: [${appId}] ${title}`);
  }

  function _showToast(item) {
    _ensureToastContainer();
    _updateToastPosition();

    const el = document.createElement('div');
    el.className = 'freq-toast';
    el.innerHTML = `
      <div class="freq-toast-title">${item.icon} ${_escHtml(item.title)}</div>
      <div>${_escHtml(item.body)}</div>
    `;
    _toastContainer.appendChild(el);

    // 4秒后移除
    setTimeout(() => {
      el.style.animation = 'freq-toast-out 0.3s ease forwards';
      setTimeout(() => el.remove(), 300);
    }, 4000);
  }

  function _renderDrawer() {
    const list = document.getElementById('freq-notify-list');
    if (!list) return;

    if (_notifications.length === 0) {
      list.innerHTML = '<div class="freq-notify-empty">📭 暂无通知</div>';
      return;
    }

    list.innerHTML = _notifications.slice(0, 50).map(n => {
      const timeStr = `${String(n.time.getHours()).padStart(2,'0')}:${String(n.time.getMinutes()).padStart(2,'0')}`;
      return `<div class="freq-notify-item" data-nid="${n.id}">
        <div class="freq-notify-item-header">
          <span class="freq-notify-item-icon">${n.icon}</span>
          <span class="freq-notify-item-app">${_escHtml(n.title)}</span>
          <span class="freq-notify-item-time">${timeStr}</span>
        </div>
        <div class="freq-notify-item-body">${_escHtml(n.body)}</div>
      </div>`;
    }).join('');
  }

  function _updateBadges() {
    const unread = _notifications.filter(n => !n.read).length;
    //悬浮球角标
    const fabBadge = document.getElementById('freq-fab-badge');
    if (fabBadge) {
      if (unread > 0) {
        fabBadge.textContent = unread > 99 ? '99+' : String(unread);
        fabBadge.classList.add('freq-has-badge');
      } else {
        fabBadge.classList.remove('freq-has-badge');
      }
    }// 各App 图标角标
    FREQ_APP_DEFS.forEach(def => {
      const count = _notifications.filter(n => !n.read && n.appId === def.id).length;
      const badge = document.querySelector(`.freq-app-icon-wrap[data-app="${def.id}"] .freq-app-icon-badge`);
      if (badge) {
        if (count > 0) {
          badge.textContent = count > 99 ? '99+' : String(count);
          badge.classList.add('freq-has-badge');
        } else {
          badge.classList.remove('freq-has-badge');
        }
      }
    });
  }

  function markAllRead() {
    _notifications.forEach(n => n.read = true);
    _updateBadges();
  }

  function clearAll() {
    _notifications = [];
    _renderDrawer();
    _updateBadges();
  }

  function getUnreadCount(appId) {
    if (appId) return _notifications.filter(n => !n.read && n.appId === appId).length;
    return _notifications.filter(n => !n.read).length;
  }

  function updatePosition(pos) {
    if (_settings) _settings.notifyPosition = pos;
    _updateToastPosition();
  }

  function _escHtml(s) {
    if (!s) return '';
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  return { init, push, markAllRead, clearAll, getUnreadCount, updatePosition, _renderDrawer, _updateBadges };
})();


// ============================================================
//  block_03  —  IndexedDB 存储封装
// ============================================================
const FreqStore = (() => {
  const DB_NAME = 'FreqTerminalDB';
  const DB_VERSION = 1;
  const STORE_NAME = 'freq_data';
  let _db = null;

  function open() {
    return new Promise((resolve, reject) => {
      if (_db) { resolve(_db); return; }
      try {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };
        req.onsuccess = (e) => {
          _db = e.target.result;
          FreqLog.info('store', 'IndexedDB 已连接');
          resolve(_db);
        };
        req.onerror = (e) => {
          FreqLog.error('store', 'IndexedDB 打开失败', e.target.error);
          reject(e.target.error);
        };
      } catch (err) {
        FreqLog.error('store', 'IndexedDB 异常', err);
        reject(err);
      }
    });
  }

  async function _tx(mode) {
    const db = await open();
    return db.transaction(STORE_NAME, mode).objectStore(STORE_NAME);
  }

  async function get(key) {
    try {
      const store = await _tx('readonly');
      return new Promise((resolve, reject) => {
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => { FreqLog.error('store', `get(${key}) 失败`); reject(req.error); };
      });
    } catch (err) {
      FreqLog.error('store', `get(${key}) 异常`, err);
      return undefined;
    }
  }

  async function set(key, value) {
    try {
      const store = await _tx('readwrite');
      return new Promise((resolve, reject) => {
        const req = store.put(value, key);
        req.onsuccess = () => resolve();
        req.onerror = () => { FreqLog.error('store', `set(${key}) 失败`); reject(req.error); };
      });
    } catch (err) {
      FreqLog.error('store', `set(${key}) 异常`, err);
    }
  }

  async function del(key) {
    try {
      const store = await _tx('readwrite');
      return new Promise((resolve, reject) => {
        const req = store.delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      FreqLog.error('store', `del(${key}) 异常`, err);
    }
  }

  async function getAll() {
    try {
      const store = await _tx('readonly');
      return new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      FreqLog.error('store', 'getAll 异常', err);
      return [];
    }
  }

  async function keys() {
    try {
      const store = await _tx('readonly');
      return new Promise((resolve, reject) => {
        const req = store.getAllKeys();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      FreqLog.error('store', 'keys 异常', err);
      return [];
    }
  }

  return { open, get, set, del, getAll, keys };
})();


// ============================================================
//  block_04  —  事件总线
// ============================================================
const FreqBus = (() => {
  const _handlers = {};

  function on(event, fn) {
    if (!_handlers[event]) _handlers[event] = [];
    _handlers[event].push(fn);
  }

  function off(event, fn) {
    if (!_handlers[event]) return;
    _handlers[event] = _handlers[event].filter(f => f !== fn);
  }

  function emit(event, data) {
    if (!_handlers[event]) return;
    for (const fn of _handlers[event]) {
      try {
        fn(data);
      } catch (err) {
        FreqLog.error('bus', `事件 ${event} 处理器报错`, err);
      }
    }
  }

  function once(event, fn) {
    const wrapper = (data) => {
      off(event, wrapper);
      fn(data);
    };
    on(event, wrapper);
  }

  return { on, off, emit, once };
})();


// ============================================================
//  block_05  —  ST桥接层
// ============================================================
const FreqBridge = (() => {
  /**
   * 获取 SillyTavern context
   * ST 1.15使用 SillyTavern.getContext()
   */
  function getContext() {
    try {
      if (typeof SillyTavern !== 'undefined' && SillyTavern.getContext) {
        return SillyTavern.getContext();
      }
      FreqLog.warn('bridge', 'SillyTavern.getContext 不可用');
      return null;
    } catch (err) {
      FreqLog.error('bridge', '获取 ST context 失败', err);
      return null;
    }
  }

  /** 获取所有角色卡 */
  function getCharacters() {
    try {
      const ctx = getContext();
      if (ctx && ctx.characters) return ctx.characters;
      return [];
    } catch (err) {
      FreqLog.error('bridge', '获取角色列表失败', err);
      return [];
    }
  }

  /** 获取当前角色信息 */
  function getCurrentChar() {
    try {
      const ctx = getContext();
      if (!ctx) return null;
      // ST 1.15: ctx.name2 是角色名, ctx.characterId 是索引
      if (ctx.characterId !== undefined && ctx.characters) {
        return ctx.characters[ctx.characterId] || null;
      }
      return null;
    } catch (err) {
      FreqLog.error('bridge', '获取当前角色失败', err);
      return null;
    }
  }

  /** 获取当前聊天消息数组 */
  function getChatMessages() {
    try {
      const ctx = getContext();
      if (ctx && ctx.chat) return ctx.chat;
      return [];
    } catch (err) {
      FreqLog.error('bridge', '获取聊天消息失败', err);
      return [];
    }
  }

  /** 获取最近 N 条消息 */
  function getRecentMessages(n = 10) {
    const chat = getChatMessages();
    return chat.slice(-n);
  }

  /** 获取角色名 */
  function getCharName() {
    try {
      const ctx = getContext();
      return (ctx && ctx.name2) || '角色';
    } catch { return '角色'; }
  }

  /** 获取用户名 */
  function getUserName() {
    try {
      const ctx = getContext();
      return (ctx && ctx.name1) || 'User';
    } catch { return 'User'; }
  }

  /**
   * 从最近消息中提取 thinking 内容
   * ST 存储位置（Claude 模型）：message.extra?.reasoning || message.thinking
   */
  function extractThinking(n = 5) {
    const msgs = getRecentMessages(n);
    const parts = [];
    for (const m of msgs) {
      const t = (m.extra && m.extra.reasoning) || m.thinking || '';
      if (t) parts.push(t);
    }
    const full = parts.join('\n');
    //截取最后 800 字
    return full.length > 800 ? full.slice(-800) : full;
  }

  /**
   * 监听 ST 事件
   * ST 1.15 eventSource 通过 SillyTavern.getContext().eventSource
   */
  function onEvent(eventName, handler) {
    try {
      const ctx = getContext();
      if (ctx && ctx.eventSource) {
        ctx.eventSource.on(eventName, handler);
        FreqLog.info('bridge', `已监听 ST 事件: ${eventName}`);
        return true;
      }
      FreqLog.warn('bridge', `无法监听事件 ${eventName}: eventSource 不可用`);
      return false;
    } catch (err) {
      FreqLog.error('bridge', `监听事件 ${eventName} 失败`, err);
      return false;
    }
  }

  /** 保存扩展设置 */
  function saveSettings(settings) {
    try {
      const ctx = getContext();
      if (ctx && ctx.extensionSettings) {
        ctx.extensionSettings[FREQ_ID] = settings;
        if (typeof ctx.saveSettingsDebounced === 'function') {
          ctx.saveSettingsDebounced();
        }
      }
    } catch (err) {
      FreqLog.error('bridge', '保存设置失败', err);
    }
  }

  /** 加载扩展设置 */
  function loadSettings() {
    try {
      const ctx = getContext();
      if (ctx && ctx.extensionSettings && ctx.extensionSettings[FREQ_ID]) {
        return ctx.extensionSettings[FREQ_ID];
      }
    } catch (err) {
      FreqLog.error('bridge', '加载设置失败', err);
    }
    return null;
  }

  return {
    getContext, getCharacters, getCurrentChar, getChatMessages,
    getRecentMessages, getCharName, getUserName, extractThinking,
    onEvent, saveSettings, loadSettings,
  };
})();


// ============================================================
//  block_06  —  解析器（meow_FM / radio_show / branches / snow / thinking）
// ============================================================
const FreqParser = (() => {

  /**
   * 解析所有聊天消息中的 <meow_FM> 标签
   * 返回数组 [{ time, scene, plot, seeds, event, cycle, todo, cash, raw }]
   */
  function parseMeowFM(messages) {
    const results = [];
    if (!messages || !Array.isArray(messages)) return results;

    for (const msg of messages) {
      const text = msg.mes || msg.message || '';
      if (!text) continue;

      // 匹配所有 <meow_FM>...</meow_FM> 块
      const regex = /<meow_FM>([\s\S]*?)<\/meow_FM>/gi;
      let match;
      while ((match = regex.exec(text)) !== null) {
        const block = match[1];
        results.push({
          time:_extractField(block, 'Time'),
          scene: _extractField(block, 'Scene'),
          plot:  _extractField(block, 'Plot'),
          seeds: _extractField(block, 'Seeds'),
          event: _extractField(block, 'Event'),
          cycle: _extractField(block, 'Cycle'),
          todo:  _extractField(block, 'Todo'),
          cash:  _extractField(block, 'Cash'),
          raw:   block.trim(),
        });
      }
    }
    return results;
  }

  /**
   * 解析 <radio_show> 标签
   * 返回 { bgm, charWear, status, raw } 或 null
   */
  function parseRadioShow(messages) {
    const results = [];
    if (!messages || !Array.isArray(messages)) return results;

    for (const msg of messages) {
      const text = msg.mes || msg.message || '';
      const regex = /<radio_show>([\s\S]*?)<\/radio_show>/gi;
      let match;
      while ((match = regex.exec(text)) !== null) {
        const block = match[1];
        results.push({
          bgm:      _extractField(block, 'BGM') || _extractField(block, 'bgm'),
          charWear: _extractField(block, 'CHAR_WEAR') || _extractField(block, 'char_wear'),
          status:   _extractField(block, 'STATUS') || _extractField(block, 'status'),
          raw:      block.trim(),
        });
      }
    }
    return results;
  }

  /**
   * 解析 <branches> 标签
   */
  function parseBranches(messages) {
    const results = [];
    if (!messages || !Array.isArray(messages)) return results;

    for (const msg of messages) {
      const text = msg.mes || msg.message || '';
      const regex = /<branches>([\s\S]*?)<\/branches>/gi;
      let match;
      while ((match = regex.exec(text)) !== null) {
        results.push(match[1].trim());
      }
    }
    return results;
  }

  /**
   * 解析 <snow> 标签
   */
  function parseSnow(messages) {
    const results = [];
    if (!messages || !Array.isArray(messages)) return results;

    for (const msg of messages) {
      const text = msg.mes || msg.message || '';
      const regex = /<snow>([\s\S]*?)<\/snow>/gi;
      let match;
      while ((match = regex.exec(text)) !== null) {
        results.push(match[1].trim());
      }
    }
    return results;
  }

  /**
   * 获取最新的 BGM
   */
  function getLatestBGM(messages) {
    const shows = parseRadioShow(messages);
    if (shows.length === 0) return '';
    return shows[shows.length - 1].bgm || '';
  }

  /**
   * 获取最新的 meow_FM
   */
  function getLatestMeowFM(messages) {
    const fms = parseMeowFM(messages);
    if (fms.length === 0) return null;
    return fms[fms.length - 1];
  }

  /**
   * 推断宇宙频率状态
   * 从最新的 meow_FM 或 radio_show 推断
   */
  function inferCosmicStatus(messages) {
    const latest = getLatestMeowFM(messages);
    if (!latest) return '未知';
    // 简单推断：如果 plot 或 raw 中包含"宇宙频率"相关关键词
    const raw = (latest.plot || '') + (latest.raw || '');
    if (/宇宙频率.{0,5}(开启|激活|on|打开|启动)/i.test(raw)) return '开启';
    if (/宇宙频率.{0,5}(关闭|off|未开|沉默)/i.test(raw)) return '关闭';
    return '未知';
  }

  /**
   * 内部：从文本块中提取字段值
   * 支持格式：
   *   Time: xxx
   *   Time：xxx
   *   <Time>xxx</Time>
   *   Time = xxx
   */
  function _extractField(block, fieldName) {
    //尝试 XML 标签格式
    const xmlReg = new RegExp(`<${fieldName}>([\\s\\S]*?)<\\/${fieldName}>`, 'i');
    const xmlMatch = block.match(xmlReg);
    if (xmlMatch) return xmlMatch[1].trim();

    // 尝试 Key: Value 格式（支持中英文冒号）
    const kvReg = new RegExp(`${fieldName}\\s*[：:=]\\s*(.+?)(?:\\n|$)`, 'i');
    const kvMatch = block.match(kvReg);
    if (kvMatch) return kvMatch[1].trim();

    return '';
  }

  return {
    parseMeowFM, parseRadioShow, parseBranches, parseSnow,
    getLatestBGM, getLatestMeowFM, inferCosmicStatus,};
})();


// ============================================================
//  block_07  —  副API 调用管理
// ============================================================
const FreqSubAPI = (() => {
  let _settings = null;
  let _queue = [];
  let _running = 0;
  const MAX_CONCURRENT = 2;
  const MAX_RETRY = 3;

  // 后台触发相关
  let _bgTimer = null;
  let _silentUntil = 0;   // 静默期结束时间戳

  function init(settings) {
    _settings = settings;
  }

  /**
   * 获取可用模型列表（不消耗额度）
   * GET /v1/models
   */
  async function fetchModels() {
    if (!_settings || !_settings.apiUrl || !_settings.apiKey) {
      FreqLog.warn('subapi', '请先填写 API 地址和密钥');
      return [];
    }

    const baseUrl = _settings.apiUrl.replace(/\/+$/, '');
    // 确保 URL 以 /v1 结尾或包含 /v1
    let modelsUrl;
    if (baseUrl.endsWith('/v1')) {
      modelsUrl = baseUrl + '/models';
    } else if (baseUrl.includes('/v1/')) {
      modelsUrl = baseUrl.replace(/\/v1\/.*$/, '/v1/models');
    } else {
      modelsUrl = baseUrl + '/v1/models';
    }

    try {
      FreqLog.info('subapi', `正在获取模型列表: ${modelsUrl}`);
      const resp = await fetch(modelsUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${_settings.apiKey}`,
        },
      });

      if (!resp.ok) {
        const errText = await resp.text().catch(() => '');
        throw new Error(`HTTP ${resp.status}: ${errText.slice(0, 200)}`);
      }

      const json = await resp.json();
      // OpenAI 格式: { data: [{ id: "model-name", ... }] }
      let models = [];
      if (json.data && Array.isArray(json.data)) {
        models = json.data.map(m => m.id || m.name || '').filter(Boolean);
      } else if (Array.isArray(json)) {
        models = json.map(m => (typeof m === 'string') ? m : (m.id || m.name || '')).filter(Boolean);
      }

      models.sort();
      FreqLog.info('subapi', `获取到 ${models.length} 个模型`);
      return models;
    } catch (err) {
      FreqLog.error('subapi', '获取模型列表失败', err.message || err);
      return [];
    }
  }

  /**
   * 调用副 API（OpenAI 兼容格式）
   * 返回纯文本内容，不要求 JSON
   * @param {Array} messages - [{ role, content }]
   * @param {object} [opts]- { maxTokens, temperature }
   * @returns {string} 生成的文本
   */
  function call(messages, opts = {}) {
    return new Promise((resolve, reject) => {
      _queue.push({ messages, opts, resolve, reject, retries: 0 });
      _processQueue();
    });
  }

  async function _processQueue() {
    while (_running < MAX_CONCURRENT && _queue.length > 0) {
      const job = _queue.shift();
      _running++;
      _executeJob(job).finally(() => {
        _running--;
        _processQueue();
      });
    }
  }

  async function _executeJob(job) {
    if (!_settings || !_settings.apiUrl || !_settings.apiKey || !_settings.apiModel) {
      const err = '副 API 未配置完整（地址/密钥/模型）';
      FreqLog.error('subapi', err);
      job.reject(new Error(err));
      return;
    }

    const baseUrl = _settings.apiUrl.replace(/\/+$/, '');
    let chatUrl;
    if (baseUrl.endsWith('/v1')) {
      chatUrl = baseUrl + '/chat/completions';
    } else if (baseUrl.includes('/v1/')) {
      chatUrl = baseUrl.replace(/\/v1\/.*$/, '/v1/chat/completions');
    } else {
      chatUrl = baseUrl + '/v1/chat/completions';
    }

    const body = {
      model: _settings.apiModel,
      messages: job.messages,
      max_tokens: job.opts.maxTokens || 800,
      temperature: job.opts.temperature !== undefined ? job.opts.temperature : 0.8,
      stream: false,
    };

    for (let attempt = 0; attempt <= MAX_RETRY; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000); // 30s超时

        const resp = await fetch(chatUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${_settings.apiKey}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!resp.ok) {
          const errText = await resp.text().catch(() => '');
          throw new Error(`HTTP ${resp.status}: ${errText.slice(0, 300)}`);
        }

        const json = await resp.json();

        // 提取文本内容
        let text = '';
        if (json.choices && json.choices[0]) {
          text = json.choices[0].message?.content || json.choices[0].text || '';
        } else if (json.content) {
          text = json.content;
        } else if (typeof json === 'string') {
          text = json;
        }

        // 兜底：如果拿不到文本，把整个 response 转字符串
        if (!text && json) {
          text = JSON.stringify(json);
          FreqLog.warn('subapi', '无法从标准字段提取文本，使用原始响应');
        }

        FreqLog.info('subapi', `调用成功，返回 ${text.length} 字`);
        job.resolve(text.trim());
        return;

      } catch (err) {
        const isLast = attempt >= MAX_RETRY;
        FreqLog.warn('subapi', `调用失败 (${attempt + 1}/${MAX_RETRY + 1}): ${err.message}`);

        if (isLast) {
          FreqLog.error('subapi', '副 API 调用最终失败', err.message);
          job.reject(err);
          return;
        }

        // 指数退避
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
  }

  /**
   * 构建完整的 prompt messages
   * 自动注入系统提示词 + 上下文变量
   */
  function buildMessages(taskPromptKey, extraVars = {}) {
    if (!_settings) return [];

    const prompts = _settings.prompts || FREQ_DEFAULTS.prompts;
    const systemTemplate = prompts.system || FREQ_DEFAULTS.prompts.system;
    const taskTemplate = prompts[taskPromptKey] || FREQ_DEFAULTS.prompts[taskPromptKey] || '';

    // 收集上下文变量
    const chatMsgs = FreqBridge.getChatMessages();
    const vars = {
      char_name: FreqBridge.getCharName(),
      user_name: FreqBridge.getUserName(),
      real_datetime: new Date().toLocaleString('zh-CN'),
      last_meow_fm_plot: (() => {
        const fm = FreqParser.getLatestMeowFM(chatMsgs);
        return fm ? (fm.plot || fm.scene || '无') : '无';
      })(),
      current_bgm: FreqParser.getLatestBGM(chatMsgs) || '未知',
      cosmic_freq_status: FreqParser.inferCosmicStatus(chatMsgs),
      limit: '200',
      ...extraVars,
    };

    // 替换模板变量
    const systemContent = _replaceVars(systemTemplate, vars);
    const taskContent = _replaceVars(taskTemplate, vars);

    const messages = [
      { role: 'system', content: systemContent },
    ];
    if (taskContent) {
      messages.push({ role: 'user', content: taskContent });
    }
    return messages;
  }

  function _replaceVars(template, vars) {
    if (!template) return '';
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return vars[key] !== undefined ? vars[key] : match;
    });
  }

  //── 后台定时触发 ──

  function startBackgroundTimer() {
    stopBackgroundTimer();
    if (!_settings) return;

    let interval = _settings.triggerInterval || FREQ_DEFAULTS.triggerInterval;
    if (_settings.triggerInterval === 'custom' || interval === 'custom') {
      interval = (_settings.customIntervalMin || 60) * 60 * 1000;
    }
    interval = Number(interval);
    if (isNaN(interval) || interval < 300000) interval = 3600000; // 最少 5 分钟

    FreqLog.info('subapi', `后台定时器启动，间隔 ${Math.round(interval / 60000)} 分钟`);

    _bgTimer = setInterval(() => {
      _tryBackgroundTrigger();
    }, interval);
  }

  function stopBackgroundTimer() {
    if (_bgTimer) {
      clearInterval(_bgTimer);
      _bgTimer = null;
    }
  }

  async function _tryBackgroundTrigger() {
    // 检查静默期
    if (Date.now() < _silentUntil) {
      const remain = Math.round((_silentUntil - Date.now()) / 60000);
      FreqLog.info('subapi', `静默期中，剩余 ${remain} 分钟`);
      return;
    }

    // 检查配置
    if (!_settings || !_settings.apiUrl || !_settings.apiKey || !_settings.apiModel) {
      return;
    }

    FreqLog.info('subapi', '后台触发：生成主动消息...');

    try {
      const messages = buildMessages('bg_message');
      const text = await call(messages, { maxTokens: 200, temperature: 0.9 });

      if (text) {
        // 推送通知
        const charName = FreqBridge.getCharName();
        FreqNotify.push('system', '📻', `来自 ${charName}`, text);
        FreqBus.emit('bg:message', { charName, text, time: Date.now() });

        // 进入3小时静默期
        _silentUntil = Date.now() + 3 * 60 * 60 * 1000;
        FreqLog.info('subapi', '已进入 3 小时静默期');
      }
    } catch (err) {
      FreqLog.error('subapi', '后台触发失败', err.message);
    }
  }

  /**
   * 解析副 API 返回的 XML 标签内容
   * 兜底策略：XML →正则→ 纯文本
   */
  function parseResponse(text, tagName) {
    if (!text) return text || '';

    // 1. 尝试 XML 标签
    const xmlReg = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'gi');
    const xmlMatches = [];
    let m;
    while ((m = xmlReg.exec(text)) !== null) {
      xmlMatches.push(m[1].trim());
    }
    if (xmlMatches.length > 0) return xmlMatches;

    // 2. 兜底：返回原始文本（确保用户能看到内容）
    FreqLog.info('subapi', `未找到 <${tagName}> 标签，返回原始文本`);
    return [text.trim()];
  }

  /**
   * 安全解析：保证一定返回可显示的字符串
   */
  function safeParseText(text) {
    if (!text) return '（信号中断…）';
    // 去掉可能的 markdown 代码块包裹
    let cleaned = text.replace(/^```[\s\S]*?\n/gm, '').replace(/```$/gm, '').trim();
    if (!cleaned) return '（信号微弱…）';
    return cleaned;
  }

  return {
    init, fetchModels, call, buildMessages,
    parseResponse, safeParseText,startBackgroundTimer, stopBackgroundTimer,
  };
})();


// ============================================================
//  block_99  —  App 注册 & UI 渲染 & 初始化
// ============================================================
const FreqTerminal = (() => {
  let _settings = {};
  let _appRegistry = {};       // { appId: appModule }
  let _currentApp = null;      // 当前打开的 App ID
  let _phoneOpen = false;
  let _drawerOpen = false;

  //悬浮球拖拽状态
  let _fabDragging = false;
  let _fabMoved = false;
  let _fabStartX = 0;
  let _fabStartY = 0;
  let _fabOffsetX = 0;
  let _fabOffsetY = 0;

  // DOM 引用
  let _fab = null;
  let _overlay = null;
  let _phone = null;
  let _screen = null;
  let _homeScreen = null;
  let _appPage = null;
  let _drawer = null;

  // 事件处理器引用（防重复绑定）
  let _handlers = {};

  // ── 初始化 ──
  function init() {
    FreqLog.info('system', `Freq Terminal v${FREQ_VERSION} 初始化中...`);

    // 加载设置
    _loadSettings();

    // 初始化子系统
    FreqNotify.init(_settings);
    FreqSubAPI.init(_settings);
    FreqStore.open().catch(() => {});

    // 构建 DOM
    _buildDOM();

    // 绑定配置面板事件
    _bindSettingsEvents();

    // 同步配置面板 UI
    _syncSettingsUI();

    // 监听 ST 事件
    _listenSTEvents();

    // 启动后台定时器
    if (_settings.enabled && _settings.apiUrl && _settings.apiKey && _settings.apiModel) {
      FreqSubAPI.startBackgroundTimer();
    }

    // 注册所有 App 骨架
    _registerAllApps();

    FreqLog.info('system', '初始化完成 ✓');
    FreqNotify.push('system', '📻', 'Freq Terminal', '频率终端已上线', { silent: true });
  }

  // ── 设置管理 ──
  function _loadSettings() {
    const saved = FreqBridge.loadSettings();
    // 深度合并默认值
    _settings = _deepMerge({}, FREQ_DEFAULTS, saved || {});
    // 确保 prompts 完整
    if (!_settings.prompts) _settings.prompts = {};
    for (const [k, v] of Object.entries(FREQ_DEFAULTS.prompts)) {
      if (!_settings.prompts[k]) _settings.prompts[k] = v;
    }}

  function _saveSettings() {
    FreqBridge.saveSettings(_settings);
  }

  function _deepMerge(target, ...sources) {
    for (const src of sources) {
      if (!src) continue;
      for (const key of Object.keys(src)) {
        if (src[key] && typeof src[key] === 'object' && !Array.isArray(src[key])) {
          if (!target[key] || typeof target[key] !== 'object') target[key] = {};
          _deepMerge(target[key], src[key]);
        } else {
          target[key] = src[key];
        }
      }
    }
    return target;
  }

  // ── 构建 DOM ──
  function _buildDOM() {
    //悬浮球
    _fab = document.createElement('div');
    _fab.id = 'freq-fab';
    _fab.innerHTML = `📻<span id="freq-fab-badge"></span>`;
    if (!_settings.enabled || !_settings.fabEnabled) _fab.classList.add('freq-fab-hidden');
    //恢复位置
    if (_settings.fabPosX >= 0 && _settings.fabPosY >= 0) {
      _fab.style.right = 'auto';
      _fab.style.bottom = 'auto';
      _fab.style.left = _settings.fabPosX + 'px';
      _fab.style.top = _settings.fabPosY + 'px';
    }
    document.body.appendChild(_fab);

    // 遮罩 + 手机
    _overlay = document.createElement('div');
    _overlay.id = 'freq-overlay';
    _overlay.innerHTML = `
      <div id="freq-phone">
        <button id="freq-phone-close" title="关闭">✕</button>
        <div id="freq-phone-notch"></div>
        <div id="freq-statusbar">
          <span id="freq-statusbar-left"></span>
          <span id="freq-statusbar-right">
            <span>📶</span>
            <span>🔋</span>
          </span>
        </div>
        <div id="freq-screen">
          <div id="freq-notify-drawer">
            <div id="freq-notify-drawer-handle">
              <span id="freq-notify-drawer-handle-bar"></span>
            </div>
            <div id="freq-notify-list"></div>
            <button class="freq-notify-clear-btn" id="freq-notify-clear">清除所有通知</button>
          </div>
          <div id="freq-home-screen">
            <div class="freq-app-grid" id="freq-app-grid"></div>
          </div>
          <div id="freq-app-page">
            <div class="freq-app-topbar">
              <span class="freq-app-back" id="freq-app-back">‹</span>
              <span class="freq-app-topbar-title" id="freq-app-title"></span>
            </div>
            <div class="freq-app-content" id="freq-app-content"></div>
          </div>
        </div><div id="freq-phone-home">
          <div id="freq-phone-home-bar"></div>
        </div>
      </div>
    `;
    document.body.appendChild(_overlay);

    _phone = document.getElementById('freq-phone');
    _screen = document.getElementById('freq-screen');
    _homeScreen = document.getElementById('freq-home-screen');
    _appPage = document.getElementById('freq-app-page');
    _drawer = document.getElementById('freq-notify-drawer');

    // 渲染 App 网格
    _renderAppGrid();

    // 绑定事件
    _bindPhoneEvents();

    // 启动时钟
    _updateClock();setInterval(_updateClock, 30000);
  }

  function _renderAppGrid() {
    const grid = document.getElementById('freq-app-grid');
    if (!grid) return;

    grid.innerHTML = FREQ_APP_DEFS.map(def => `
      <div class="freq-app-icon-wrap" data-app="${def.id}">
        <div class="freq-app-icon" style="background:${def.color}20; border-color:${def.color}40;">
          ${def.icon}
          <span class="freq-app-icon-badge"></span>
        </div>
        <span class="freq-app-name">${def.name}</span>
      </div>
    `).join('');
  }

  function _updateClock() {
    const el = document.getElementById('freq-statusbar-left');
    if (!el) return;
    const now = new Date();
    el.textContent = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  }

  // ── 手机事件绑定 ──
  function _bindPhoneEvents() {
    // 悬浮球点击 / 拖拽
    if (_handlers._fabPointerDown) {
      _fab.removeEventListener('pointerdown', _handlers._fabPointerDown);}
    _handlers._fabPointerDown = (e) => _onFabPointerDown(e);
    _fab.addEventListener('pointerdown', _handlers._fabPointerDown);

    if (_handlers._fabPointerMove) {
      document.removeEventListener('pointermove', _handlers._fabPointerMove);
    }
    _handlers._fabPointerMove = (e) => _onFabPointerMove(e);
    document.addEventListener('pointermove', _handlers._fabPointerMove);

    if (_handlers._fabPointerUp) {
      document.removeEventListener('pointerup', _handlers._fabPointerUp);
    }
    _handlers._fabPointerUp = (e) => _onFabPointerUp(e);
    document.addEventListener('pointerup', _handlers._fabPointerUp);

    // 关闭按钮
    const closeBtn = document.getElementById('freq-phone-close');
    if (closeBtn) {
      if (_handlers._closeClick) closeBtn.removeEventListener('click', _handlers._closeClick);
      _handlers._closeClick = () => _closePhone();
      closeBtn.addEventListener('click', _handlers._closeClick);
    }

    // 遮罩点击关闭（PC端）
    if (_handlers._overlayClick) _overlay.removeEventListener('click', _handlers._overlayClick);
    _handlers._overlayClick = (e) => {
      if (e.target === _overlay) _closePhone();
    };
    _overlay.addEventListener('click', _handlers._overlayClick);

    // App 网格点击
    const grid = document.getElementById('freq-app-grid');
    if (grid) {
      if (_handlers._gridClick) grid.removeEventListener('click', _handlers._gridClick);
      _handlers._gridClick = (e) => {
        const wrap = e.target.closest('.freq-app-icon-wrap');
        if (wrap) {
          const appId = wrap.dataset.app;
          _openApp(appId);
        }
      };
      grid.addEventListener('click', _handlers._gridClick);
    }

    // 返回按钮
    const backBtn = document.getElementById('freq-app-back');
    if (backBtn) {
      if (_handlers._backClick) backBtn.removeEventListener('click', _handlers._backClick);
      _handlers._backClick = () => _closeApp();
      backBtn.addEventListener('click', _handlers._backClick);
    }

    // 通知栏下拉触发区（状态栏区域）
    const statusbar = document.getElementById('freq-statusbar');
    if (statusbar) {
      if (_handlers._statusClick) statusbar.removeEventListener('click', _handlers._statusClick);
      _handlers._statusClick = () => _toggleDrawer();
      statusbar.addEventListener('click', _handlers._statusClick);
    }

    // 通知栏关闭（点击 handle）
    const drawerHandle = document.getElementById('freq-notify-drawer-handle');
    if (drawerHandle) {
      if (_handlers._drawerHandleClick) drawerHandle.removeEventListener('click', _handlers._drawerHandleClick);
      _handlers._drawerHandleClick = () => _toggleDrawer();
      drawerHandle.addEventListener('click', _handlers._drawerHandleClick);
    }

    // 清除通知
    const clearBtn = document.getElementById('freq-notify-clear');
    if (clearBtn) {
      if (_handlers._clearClick) clearBtn.removeEventListener('click', _handlers._clearClick);
      _handlers._clearClick = () => {
        FreqNotify.clearAll();
      };
      clearBtn.addEventListener('click', _handlers._clearClick);
    }

    // Home 横条→ 回主屏
    const homeBar = document.getElementById('freq-phone-home');
    if (homeBar) {
      if (_handlers._homeClick) homeBar.removeEventListener('click', _handlers._homeClick);
      _handlers._homeClick = () => {
        if (_currentApp) _closeApp();
        if (_drawerOpen) _toggleDrawer();
      };
      homeBar.addEventListener('click', _handlers._homeClick);
    }
  }

  // ── 悬浮球拖拽 ──
  function _onFabPointerDown(e) {
    _fabDragging = true;
    _fabMoved = false;
    _fabStartX = e.clientX;
    _fabStartY = e.clientY;
    const rect = _fab.getBoundingClientRect();
    _fabOffsetX = e.clientX - rect.left;
    _fabOffsetY = e.clientY - rect.top;
    _fab.setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  function _onFabPointerMove(e) {
    if (!_fabDragging) return;
    const dx = e.clientX - _fabStartX;
    const dy = e.clientY - _fabStartY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) _fabMoved = true;
    if (_fabMoved) {
      const x = e.clientX - _fabOffsetX;
      const y = e.clientY - _fabOffsetY;
      _fab.style.left = Math.max(0, Math.min(window.innerWidth - 56, x)) + 'px';
      _fab.style.top = Math.max(0, Math.min(window.innerHeight - 56, y)) + 'px';
      _fab.style.right = 'auto';
      _fab.style.bottom = 'auto';
    }
  }

  function _onFabPointerUp(e) {
    if (!_fabDragging) return;
    _fabDragging = false;
    if (_fabMoved) {
      // 保存位置
      _settings.fabPosX = parseInt(_fab.style.left) || 0;
      _settings.fabPosY = parseInt(_fab.style.top) || 0;
      _saveSettings();} else {
      // 点击 → 打开手机
      _openPhone();
    }
  }

  // ── 手机开关 ──
  function _openPhone() {
    if (!_settings.enabled) {
      FreqLog.warn('system', '插件已禁用');
      return;
    }
    _phoneOpen = true;
    _overlay.classList.add('freq-open');
    FreqNotify.markAllRead();
    FreqNotify._updateBadges();
    _updateClock();
    FreqLog.info('system', '手机面板已打开');
  }

  function _closePhone() {
    _phoneOpen = false;
    _overlay.classList.remove('freq-open');
    if (_drawerOpen) {
      _drawerOpen = false;
      _drawer.classList.remove('freq-drawer-open');
    }
    FreqLog.info('system', '手机面板已关闭');
  }

  // ── 通知栏 ──
  function _toggleDrawer() {
    _drawerOpen = !_drawerOpen;
    if (_drawerOpen) {
      _drawer.classList.add('freq-drawer-open');
      FreqNotify._renderDrawer();
      FreqNotify.markAllRead();
      FreqNotify._updateBadges();
    } else {
      _drawer.classList.remove('freq-drawer-open');
    }
  }

  // ── App 导航 ──
  function _openApp(appId) {
    if (_drawerOpen) _toggleDrawer();

    const def = FREQ_APP_DEFS.find(d => d.id === appId);
    if (!def) return;

    _currentApp = appId;
    _homeScreen.style.display = 'none';
    _appPage.classList.add('freq-page-active');
    document.getElementById('freq-app-title').textContent = `${def.icon} ${def.name}`;

    // 挂载 App
    const contentEl = document.getElementById('freq-app-content');
    contentEl.innerHTML = '';

    const app = _appRegistry[appId];
    if (app && typeof app.mount === 'function') {
      try {
        app.mount(contentEl);
      } catch (err) {
        FreqLog.error(appId, 'App mount 失败', err);
        contentEl.innerHTML = `<div class="freq-empty-state">
          <div class="freq-empty-state-icon">⚠️</div>
          <div class="freq-empty-state-text">加载失败：${_escHtml(err.message)}</div>
        </div>`;
      }
    } else {
      contentEl.innerHTML = `<div class="freq-empty-state">
        <div class="freq-empty-state-icon">${def.icon}</div>
        <div class="freq-empty-state-text">${def.name}<br><span style="color:#555;font-size:12px;">即将上线，敬请期待</span></div>
      </div>`;
    }

    FreqLog.info('system', `打开 App: ${def.name}`);
  }

  function _closeApp() {
    if (_currentApp) {
      const app = _appRegistry[_currentApp];
      if (app && typeof app.unmount === 'function') {
        try {
          app.unmount();
        } catch (err) {
          FreqLog.error(_currentApp, 'App unmount 失败', err);
        }
      }
    }
    _currentApp = null;
    _appPage.classList.remove('freq-page-active');
    _homeScreen.style.display = '';}

  // ── App 注册 ──
  function registerApp(appModule) {
    if (!appModule || !appModule.id) {
      FreqLog.error('system', '注册 App 失败：缺少 id');
      return;
    }
    _appRegistry[appModule.id] = appModule;
    if (typeof appModule.init === 'function') {
      try {
        appModule.init({ settings: _settings, bus: FreqBus, store: FreqStore, bridge: FreqBridge, parser: FreqParser, subapi: FreqSubAPI, notify: FreqNotify, log: FreqLog });
      } catch (err) {
        FreqLog.error(appModule.id, 'App init 失败', err);
      }
    }
    FreqLog.info('system', `App 已注册: ${appModule.id}`);
  }

  /** 注册所有 App 骨架（阶段1只有空壳） */
  function _registerAllApps() {
    for (const def of FREQ_APP_DEFS) {
      if (!_appRegistry[def.id]) {
        // 注册空壳
        registerApp({
          id: def.id,
          name: def.name,
          icon: def.icon,
          // 空壳不实现 mount/unmount
        });
      }
    }
  }

  // ── 监听 ST 事件 ──
  function _listenSTEvents() {
    // 监听新消息，触发解析
    FreqBridge.onEvent('message_received', () => {
      try {
        const msgs = FreqBridge.getChatMessages();
        const latestFM = FreqParser.getLatestMeowFM(msgs);
        if (latestFM) {
          FreqBus.emit('meow_fm:updated', latestFM);
        }
        const bgm = FreqParser.getLatestBGM(msgs);
        if (bgm) {
          FreqBus.emit('bgm:changed', bgm);
        }
      } catch (err) {
        FreqLog.error('system', '消息解析出错', err);
      }
    });

    // 监听聊天切换
    FreqBridge.onEvent('chatLoaded', () => {
      FreqLog.info('system', '聊天已切换，重新解析');
      FreqBus.emit('chat:loaded');
    });
  }

  // ── 配置面板事件 ──
  function _bindSettingsEvents() {
    // 使用 jQuery 事件委托（ST 配置面板是动态加载的）
    $(document).on('change', '#freq-sp-enabled', function() {
      _settings.enabled = this.checked;
      _saveSettings();
      if (_settings.enabled) {
        if (_settings.fabEnabled) _fab.classList.remove('freq-fab-hidden');
      } else {
        _fab.classList.add('freq-fab-hidden');
        _closePhone();
        FreqSubAPI.stopBackgroundTimer();
      }FreqLog.info('settings', `插件 ${_settings.enabled ? '启用' : '禁用'}`);
    });

    $(document).on('change', '#freq-sp-fab-enabled', function() {
      _settings.fabEnabled = this.checked;
      _saveSettings();
      if (_settings.enabled && _settings.fabEnabled) {
        _fab.classList.remove('freq-fab-hidden');
      } else {
        _fab.classList.add('freq-fab-hidden');
      }
    });

    $(document).on('click', '#freq-sp-open-phone', function() {
      if (!_settings.enabled) {
        _settings.enabled = true;
        $('#freq-sp-enabled').prop('checked', true);
        _saveSettings();
      }
      _openPhone();
    });

    // 副API 配置
    $(document).on('input', '#freq-sp-api-url', function() {
      _settings.apiUrl = this.value.trim();
      _saveSettings();
    });
    $(document).on('input', '#freq-sp-api-key', function() {
      _settings.apiKey = this.value.trim();
      _saveSettings();
    });

    // 获取模型列表
    $(document).on('click', '#freq-sp-fetch-models', async function() {
      const statusEl = document.getElementById('freq-sp-model-status');
      const selectEl = document.getElementById('freq-sp-model-select');
      if (statusEl) statusEl.textContent = '正在获取...';

      const models = await FreqSubAPI.fetchModels();
      _settings.apiModelList = models;
      _saveSettings();

      if (selectEl) {
        selectEl.innerHTML = models.length === 0
          ? '<option value="">-- 未获取到模型 --</option>'
          : models.map(m => `<option value="${_escHtml(m)}" ${m === _settings.apiModel ? 'selected' : ''}>${_escHtml(m)}</option>`).join('');
      }
      if (statusEl) statusEl.textContent = models.length > 0 ? `✓ ${models.length} 个模型` : '✗ 获取失败';
    });

    // 选择模型
    $(document).on('change', '#freq-sp-model-select', function() {
      _settings.apiModel = this.value;
      _saveSettings();
      FreqLog.info('settings', `模型已选择: ${_settings.apiModel}`);
    });

    // 触发频率
    $(document).on('change', '#freq-sp-trigger-interval', function() {
      const val = this.value;
      if (val === 'custom') {
        $('#freq-sp-custom-interval-row').show();
        _settings.triggerInterval = 'custom';
      } else {
        $('#freq-sp-custom-interval-row').hide();
        _settings.triggerInterval = Number(val);
      }
      _saveSettings();
      FreqSubAPI.stopBackgroundTimer();
      FreqSubAPI.startBackgroundTimer();
    });

    $(document).on('input', '#freq-sp-custom-interval', function() {
      _settings.customIntervalMin = Math.max(5, Number(this.value) || 60);
      _saveSettings();FreqSubAPI.stopBackgroundTimer();
      FreqSubAPI.startBackgroundTimer();
    });

    // 通知位置
    $(document).on('change', '#freq-sp-notify-pos', function() {
      _settings.notifyPosition = this.value;
      _saveSettings();
      FreqNotify.updatePosition(this.value);
    });

    // 提示词编辑
    const promptIds = {
      'freq-sp-prompt-system': 'system',
      'freq-sp-prompt-app01': 'app01',
      'freq-sp-prompt-app02-monologue': 'app02_monologue',
      'freq-sp-prompt-app02-interview': 'app02_interview',
      'freq-sp-prompt-app02-private': 'app02_private',
      'freq-sp-prompt-app03': 'app03',
      'freq-sp-prompt-app04': 'app04',
      'freq-sp-prompt-app05': 'app05',
      'freq-sp-prompt-app06': 'app06',
      'freq-sp-prompt-app07': 'app07',
      'freq-sp-prompt-app08': 'app08',
      'freq-sp-prompt-app09': 'app09',
      'freq-sp-prompt-app10': 'app10',
      'freq-sp-prompt-app11': 'app11',
      'freq-sp-prompt-app12': 'app12',
      'freq-sp-prompt-app13': 'app13',
      'freq-sp-prompt-app14': 'app14',
      'freq-sp-prompt-app15': 'app15',
      'freq-sp-prompt-app16': 'app16',
      'freq-sp-prompt-app17': 'app17',
      'freq-sp-prompt-bg': 'bg_message',
    };

    for (const [elId, promptKey] of Object.entries(promptIds)) {
      $(document).on('input', `#${elId}`, function() {
        if (!_settings.prompts) _settings.prompts = {};
        _settings.prompts[promptKey] = this.value;
        _saveSettings();
      });
    }

    // 折叠面板
    $(document).on('click', '.freq-sp-collapsible', function() {
      const targetId = this.dataset.target;
      const body = document.getElementById(targetId);
      if (!body) return;
      const isOpen = body.classList.contains('freq-sp-show');
      if (isOpen) {
        body.classList.remove('freq-sp-show');
        this.classList.remove('freq-sp-open');
      } else {
        body.classList.add('freq-sp-show');
        this.classList.add('freq-sp-open');
      }
    });

    // 清空日志
    $(document).on('click', '#freq-sp-log-clear', function() {
      FreqLog.clear();
    });
  }

  // ── 同步配置面板 UI ──
  function _syncSettingsUI() {
    // 使用 setTimeout 确保 settings.html 已加载
    const doSync = () => {
      const el = document.getElementById('freq-sp-enabled');
      if (!el) {
        // settings.html 还没加载，稍后重试
        setTimeout(doSync, 500);
        return;
      }

      $('#freq-sp-enabled').prop('checked', _settings.enabled);
      $('#freq-sp-fab-enabled').prop('checked', _settings.fabEnabled);
      $('#freq-sp-api-url').val(_settings.apiUrl || '');
      $('#freq-sp-api-key').val(_settings.apiKey || '');

      // 模型下拉
      const selectEl = document.getElementById('freq-sp-model-select');
      if (selectEl && _settings.apiModelList && _settings.apiModelList.length > 0) {
        selectEl.innerHTML = _settings.apiModelList.map(m =>
          `<option value="${_escHtml(m)}" ${m === _settings.apiModel ? 'selected' : ''}>${_escHtml(m)}</option>`
        ).join('');
      }

      // 触发频率
      const intervalVal = _settings.triggerInterval;
      if (intervalVal === 'custom') {
        $('#freq-sp-trigger-interval').val('custom');
        $('#freq-sp-custom-interval-row').show();
        $('#freq-sp-custom-interval').val(_settings.customIntervalMin || 60);
      } else {
        const numVal = Number(intervalVal);
        if (numVal === 1800000|| numVal === 3600000) {
          $('#freq-sp-trigger-interval').val(String(numVal));
        } else {
          // 非标准值，切到自定义
          $('#freq-sp-trigger-interval').val('custom');
          $('#freq-sp-custom-interval-row').show();
          $('#freq-sp-custom-interval').val(Math.round(numVal / 60000) || 60);
        }
      }

      // 通知位置
      $('#freq-sp-notify-pos').val(_settings.notifyPosition ||'top-right');

      // 提示词
      const prompts = _settings.prompts || {};
      const defaults = FREQ_DEFAULTS.prompts;
      $('#freq-sp-prompt-system').val(prompts.system || defaults.system);
      $('#freq-sp-prompt-app01').val(prompts.app01 || defaults.app01);
      $('#freq-sp-prompt-app02-monologue').val(prompts.app02_monologue || defaults.app02_monologue);
      $('#freq-sp-prompt-app02-interview').val(prompts.app02_interview || defaults.app02_interview);
      $('#freq-sp-prompt-app02-private').val(prompts.app02_private || defaults.app02_private);
      $('#freq-sp-prompt-app03').val(prompts.app03 || defaults.app03);
      $('#freq-sp-prompt-app04').val(prompts.app04 || defaults.app04);
      $('#freq-sp-prompt-app05').val(prompts.app05 || defaults.app05);
      $('#freq-sp-prompt-app06').val(prompts.app06 || defaults.app06);
      $('#freq-sp-prompt-app07').val(prompts.app07 || defaults.app07);
      $('#freq-sp-prompt-app08').val(prompts.app08 || defaults.app08);
      $('#freq-sp-prompt-app09').val(prompts.app09 || defaults.app09);
      $('#freq-sp-prompt-app10').val(prompts.app10 || defaults.app10);
      $('#freq-sp-prompt-app11').val(prompts.app11 || defaults.app11);
      $('#freq-sp-prompt-app12').val(prompts.app12 || defaults.app12);
      $('#freq-sp-prompt-app13').val(prompts.app13 || defaults.app13);
      $('#freq-sp-prompt-app14').val(prompts.app14 || defaults.app14);
      $('#freq-sp-prompt-app15').val(prompts.app15 || defaults.app15);
      $('#freq-sp-prompt-app16').val(prompts.app16 || defaults.app16);
      $('#freq-sp-prompt-app17').val(prompts.app17 || defaults.app17);
      $('#freq-sp-prompt-bg').val(prompts.bg_message || defaults.bg_message);

      // 刷新日志
      FreqLog.refreshUI();
    };

    setTimeout(doSync, 300);
  }

  function _escHtml(s) {
    if (!s) return '';
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  return {
    init,
    registerApp,
    getSettings: () => _settings,
    openPhone: () => _openPhone(),
    closePhone: () => _closePhone(),
  };
})();


// ════════════════════════════════════════════════════════════
//ST 插件入口
// ════════════════════════════════════════════════════════════
jQuery(async () => {
  try {
    FreqTerminal.init();
  } catch (err) {
    console.error('[FreqTerminal] 初始化致命错误:', err);
    FreqLog.error('system', '初始化致命错误', err);
  }
});

