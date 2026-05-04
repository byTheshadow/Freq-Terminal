/* ═══════════════════════════════════════════════════════════
 *  FREQ · TERMINAL — 主逻辑
 *  block_00EventBus
 *  block_01  Store (IndexedDB)
 *  block_02  Parser (XML /正则 / 兜底)
 *  block_03  STBridge (ST 通信)
 *  block_04  SubAPI (副LLM)
 *  block_05  Scheduler (定时 + 静默)
 *  block_06  NotificationSystem
 *  block_07  ErrorLogger
 *  block_99  注册 + 初始化 + 手机外壳 + 悬浮球 + 拖动
 * ═══════════════════════════════════════════════════════════ */

//── 插件命名空间 ─────────────────────────────────────────────
const FT = window.FreqTerminal = window.FreqTerminal || {};
FT.VERSION = '1.0.0';
FT.NAME = 'freq-terminal';

/* ═══════════════════════════════════════════════════════════
 *  block_00 — EventBus
 * ═══════════════════════════════════════════════════════════ */
FT.EventBus = (() => {
  const _map = {};

  function on(event, fn) {
    if (!_map[event]) _map[event] = [];
    _map[event].push(fn);
  }

  function off(event, fn) {
    if (!_map[event]) return;
    _map[event] = _map[event].filter(f => f !== fn);
  }

  function emit(event, ...args) {
    if (!_map[event]) return;
    for (const fn of _map[event]) {
      try { fn(...args); }
      catch (e) { FT.ErrorLogger?.log('EventBus', `emit(${event})失败`, e); }
    }
  }

  function once(event, fn) {
    const wrapper = (...args) => { off(event, wrapper); fn(...args); };
    on(event, wrapper);
  }

  return { on, off, emit, once };
})();


/* ═══════════════════════════════════════════════════════════
 *  block_01 — Store (IndexedDB)
 * ═══════════════════════════════════════════════════════════ */
FT.Store = (() => {
  const DB_NAME = 'FreqTerminalDB';
  const DB_VER = 1;
  let _db = null;

  //所有 store 名称
  const STORES = [
    'settings',       // 配置
    'notifications',  // 通知
    'errors',         // 报错日志
    'app_data',       // 各App 数据
    'prompts',        // 自定义提示词
    'scheduler',      // 定时器状态
  ];

  function open() {
    return new Promise((resolve, reject) => {
      if (_db) { resolve(_db); return; }
      const req = indexedDB.open(DB_NAME, DB_VER);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        for (const name of STORES) {
          if (!db.objectStoreNames.contains(name)) {
            db.createObjectStore(name);
          }
        }
      };
      req.onsuccess = (e) => { _db = e.target.result; resolve(_db); };
      req.onerror = (e) => {
        FT.ErrorLogger?.log('Store', 'IndexedDB 打开失败', e.target.error);
        reject(e.target.error);
      };
    });
  }

  async function _tx(storeName, mode = 'readonly') {
    const db = await open();
    const tx = db.transaction(storeName, mode);
    return tx.objectStore(storeName);
  }

  async function get(storeName, key) {
    try {
      const store = await _tx(storeName);
      return new Promise((resolve, reject) => {
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      FT.ErrorLogger?.log('Store', `get(${storeName}, ${key}) 失败`, e);
      return undefined;
    }
  }

  async function set(storeName, key, value) {
    try {
      const store = await _tx(storeName, 'readwrite');
      return new Promise((resolve, reject) => {
        const req = store.put(value, key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      FT.ErrorLogger?.log('Store', `set(${storeName}, ${key}) 失败`, e);
    }
  }

  async function del(storeName, key) {
    try {
      const store = await _tx(storeName, 'readwrite');
      return new Promise((resolve, reject) => {
        const req = store.delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      FT.ErrorLogger?.log('Store', `del(${storeName}, ${key}) 失败`, e);
    }
  }

  async function getAll(storeName) {
    try {
      const store = await _tx(storeName);
      return new Promise((resolve, reject) => {
        const req = store.getAll();
        const reqKeys = store.getAllKeys();
        req.onsuccess = () => {
          reqKeys.onsuccess = () => {
            const result = {};
            reqKeys.result.forEach((k, i) => { result[k] = req.result[i]; });
            resolve(result);
          };
          reqKeys.onerror = () => reject(reqKeys.error);
        };
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      FT.ErrorLogger?.log('Store', `getAll(${storeName}) 失败`, e);
      return {};
    }
  }

  async function clear(storeName) {
    try {
      const store = await _tx(storeName, 'readwrite');
      return new Promise((resolve, reject) => {
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      FT.ErrorLogger?.log('Store', `clear(${storeName}) 失败`, e);
    }
  }

  return { open, get, set, del, getAll, clear };
})();


/* ═══════════════════════════════════════════════════════════
 *  block_02 — Parser (XML / 正则 / 兜底)
 *  解析 meow_FM / radio_show / branches / snow / thinking
 *绝不使用 JSON.parse，全部 XML + 正则 + 兜底
 * ═══════════════════════════════════════════════════════════ */
FT.Parser = (() => {

  /**
   * 提取 XML 标签内容（支持嵌套）
   * 返回数组，每项是标签内的文本
   */
  function extractTag(text, tagName) {
    const results = [];
    if (!text || !tagName) return results;
    // 正则：非贪婪匹配标签内容
    const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      results.push(match[1].trim());
    }
    return results;
  }

  /**
   * 提取 XML 标签属性
   */
  function extractAttr(tagStr, attrName) {
    if (!tagStr || !attrName) return '';
    const regex = new RegExp(`${attrName}\\s*=\\s*["']([^"']*)["']`, 'i');
    const m = tagStr.match(regex);
    return m ? m[1] : '';
  }

  /**
   * 提取完整的开始标签（含属性）
   */
  function extractOpenTag(text, tagName) {
    const results = [];
    const regex = new RegExp(`<${tagName}([^>]*)>`, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      results.push(match[0]);
    }
    return results;
  }

  /**
   * 解析 meow_FM 块
   *<meow_FM type="..." mood="..." signal="...">内容</meow_FM>
   */
  function parseMeowFM(text) {
    const results = [];
    if (!text) return results;
    try {
      const tags = extractOpenTag(text, 'meow_FM');
      const contents = extractTag(text, 'meow_FM');
      for (let i = 0; i < contents.length; i++) {
        const openTag = tags[i] || '';
        results.push({
          type: extractAttr(openTag, 'type') || 'unknown',
          mood: extractAttr(openTag, 'mood') || '',
          signal: extractAttr(openTag, 'signal') || '',
          content: contents[i] || '',
        });
      }
    } catch (e) {
      FT.ErrorLogger?.log('Parser', 'parseMeowFM 解析失败', e);
    }
    return results;
  }

  /**
   * 解析 radio_show 块
   * <radio_show segment="..." host="...">内容</radio_show>
   */
  function parseRadioShow(text) {
    const results = [];
    if (!text) return results;
    try {
      const tags = extractOpenTag(text, 'radio_show');
      const contents = extractTag(text, 'radio_show');
      for (let i = 0; i < contents.length; i++) {
        const openTag = tags[i] || '';
        results.push({
          segment: extractAttr(openTag, 'segment') || '',
          host: extractAttr(openTag, 'host') || '',
          content: contents[i] || '',
        });
      }
    } catch (e) {
      FT.ErrorLogger?.log('Parser', 'parseRadioShow 解析失败', e);
    }
    return results;
  }

  /**
   * 解析 branches 块
   * <branches>
   *   <branch id="..." label="...">描述</branch>
   * </branches>
   */
  function parseBranches(text) {
    const results = [];
    if (!text) return results;
    try {
      const branchesContent = extractTag(text, 'branches');
      for (const block of branchesContent) {
        const tags = extractOpenTag(block, 'branch');
        const contents = extractTag(block, 'branch');
        for (let i = 0; i < contents.length; i++) {
          const openTag = tags[i] || '';
          results.push({
            id: extractAttr(openTag, 'id') || `b${i}`,
            label: extractAttr(openTag, 'label') || '',
            desc: contents[i] || '',
          });
        }
      }
    } catch (e) {
      FT.ErrorLogger?.log('Parser', 'parseBranches 解析失败', e);
    }
    return results;
  }

  /**
   * 解析 snow（内心独白）
   * <snow>内容</snow>
   */
  function parseSnow(text) {
    if (!text) return [];
    try {
      return extractTag(text, 'snow');
    } catch (e) {
      FT.ErrorLogger?.log('Parser', 'parseSnow 解析失败', e);
      return [];
    }
  }

  /**
   * 解析 thinking
   * <thinking>内容</thinking>
   */
  function parseThinking(text) {
    if (!text) return [];
    try {
      return extractTag(text, 'thinking');
    } catch (e) {
      FT.ErrorLogger?.log('Parser', 'parseThinking 解析失败', e);
      return [];
    }
  }

  /**
   * 一次性解析所有已知标签
   */
  function parseAll(text) {
    return {
      meowFM: parseMeowFM(text),
      radioShow: parseRadioShow(text),
      branches: parseBranches(text),
      snow: parseSnow(text),
      thinking: parseThinking(text),
    };
  }

  return {
    extractTag, extractAttr, extractOpenTag,
    parseMeowFM, parseRadioShow, parseBranches,
    parseSnow, parseThinking, parseAll,
  };
})();


/* ═══════════════════════════════════════════════════════════
 *  block_03 — STBridge (与 SillyTavern 通信)
 *  监听 eventSource，获取角色/对话数据
 *  只读旁听，不污染主对话
 * ═══════════════════════════════════════════════════════════ */
FT.STBridge = (() => {
  let _bound = false;
  let _lastMsgId = null;

  /**
   * 绑定 ST 事件源
   */
  function bind() {
    if (_bound) return;
    _bound = true;

    try {
      // ST 1.15的eventSource
      const es = window.eventSource;
      if (!es) {
        FT.ErrorLogger?.log('STBridge', 'eventSource 未找到，延迟重试');
        setTimeout(bind, 3000);
        _bound = false;
        return;
      }

      // 监听新消息
      es.on('message_received', (msgId) => {
        _onNewMessage(msgId);
      });

      // 监听角色切换
      es.on('chatLoaded', () => {
        FT.EventBus.emit('st:chatLoaded');
      });

      // 监听生成完成
      es.on('generation_ended', (msgId) => {
        _onNewMessage(msgId);
      });

      console.log('[FT] STBridge 已绑定eventSource');
    } catch (e) {
      FT.ErrorLogger?.log('STBridge', '绑定 eventSource 失败', e);
    }
  }

  function _onNewMessage(msgId) {
    try {
      if (msgId === _lastMsgId) return;
      _lastMsgId = msgId;

      const chat = getChat();
      if (!chat || chat.length === 0) return;

      const lastMsg = chat[chat.length - 1];
      if (!lastMsg || lastMsg.is_user) return;

      const text = lastMsg.mes || '';
      if (!text) return;

      // 解析所有标签
      const parsed = FT.Parser.parseAll(text);
      FT.EventBus.emit('st:newMessage', { msgId, text, parsed, character: lastMsg.name });
    } catch (e) {
      FT.ErrorLogger?.log('STBridge', '处理新消息失败', e);
    }
  }

  /**
   * 获取当前聊天记录
   */
  function getChat() {
    try {
      if (typeof SillyTavern !== 'undefined' && SillyTavern.getContext) {
        return SillyTavern.getContext().chat || [];
      }
      //兜底：全局变量
      return window.chat || [];
    } catch (e) {
      FT.ErrorLogger?.log('STBridge', 'getChat 失败', e);
      return [];
    }
  }

  /**
   * 获取当前角色信息
   */
  function getCharacter() {
    try {
      if (typeof SillyTavern !== 'undefined' && SillyTavern.getContext) {
        const ctx = SillyTavern.getContext();
        return {
          name: ctx.name2 || '',
          avatar: ctx.characterAvatar || '',
          description: ctx.characterDescription || '',
        };
      }
      return { name: '', avatar: '', description: '' };
    } catch (e) {
      FT.ErrorLogger?.log('STBridge', 'getCharacter 失败', e);
      return { name: '', avatar: '', description: '' };
    }
  }

  /**
   * 获取最后 N 条消息文本（用于副API上下文）
   */
  function getRecentMessages(count = 10) {
    try {
      const chat = getChat();
      const recent = chat.slice(-count);
      return recent.map(m => ({
        role: m.is_user ? 'user' : 'assistant',
        content: m.mes || '',
        name: m.name || '',
      }));
    } catch (e) {
      FT.ErrorLogger?.log('STBridge', 'getRecentMessages 失败', e);
      return [];
    }
  }

  return { bind, getChat, getCharacter, getRecentMessages };
})();


/* ═══════════════════════════════════════════════════════════
 *  block_04 — SubAPI (副 LLM 调用)
 *  OpenAI 兼容格式，支持模型列表拉取
 *  XML 解析返回，不用 JSON 让 AI 返回
 * ═══════════════════════════════════════════════════════════ */
FT.SubAPI = (() => {
  let _queue = [];
  let _processing = false;

  /**
   * 获取副 API 配置
   */
  async function _getConfig() {
    const settings = await FT.Store.get('settings', 'subapi') || {};
    return {
      url: settings.url || '',
      key: settings.key || '',
      model: settings.model || '',};
  }

  /**
   * 拉取可用模型列表（不消耗额度）
   */
  async function fetchModels(url, key) {
    try {
      // 确保 URL 格式正确
      let baseUrl = url.replace(/\/+$/, '');
      if (!baseUrl.endsWith('/v1')) {
        // 如果不以 /v1 结尾，检查是否需要添加
        if (!baseUrl.includes('/v1')) {
          baseUrl += '/v1';
        }
      }

      const resp = await fetch(`${baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
      }

      const data = await resp.json();
      // OpenAI 格式：{ data: [{ id: "model-name", ... }] }
      const models = (data.data || data || []).map(m => ({
        id: m.id || m.name || '',
        name: m.id || m.name || '',
      })).filter(m => m.id);

      return { ok: true, models };
    } catch (e) {
      FT.ErrorLogger?.log('SubAPI', '拉取模型列表失败', e);
      return { ok: false, error: e.message, models: [] };
    }
  }

  /**
   * 发送请求到副 API
   * @param {string} systemPrompt - 系统提示词
   * @param {string} userContent - 用户内容
   * @param {object} opts - 额外选项
   * @returns {Promise<string>} 返回文本
   */
  async function send(systemPrompt, userContent, opts = {}) {
    const config = await _getConfig();
    if (!config.url || !config.key || !config.model) {
      FT.ErrorLogger?.log('SubAPI', '副 API 未配置完整');
      return '';
    }

    try {
      let baseUrl = config.url.replace(/\/+$/, '');
      if (!baseUrl.endsWith('/v1')) {
        if (!baseUrl.includes('/v1')) {
          baseUrl += '/v1';
        }
      }

      const messages = [
        { role: 'system', content: systemPrompt },
      ];

      // 如果需要上下文
      if (opts.includeContext) {
        const recent = FT.STBridge.getRecentMessages(opts.contextCount || 5);
        messages.push(...recent);
      }

      messages.push({ role: 'user', content: userContent });

      const resp = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model,
          messages,
          max_tokens: opts.maxTokens || 1024,
          temperature: opts.temperature ?? 0.8,
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text().catch(() => '');
        throw new Error(`HTTP ${resp.status}: ${errText}`);
      }

      const data = await resp.json();
      const text = data.choices?.[0]?.message?.content || '';
      return text;
    } catch (e) {
      FT.ErrorLogger?.log('SubAPI', '副 API 调用失败', e);
      return '';
    }
  }

  /**
   * 队列化发送（防止并发过多）
   */
  function enqueue(systemPrompt, userContent, opts = {}) {
    return new Promise((resolve, reject) => {
      _queue.push({ systemPrompt, userContent, opts, resolve, reject });
      _processQueue();
    });
  }

  async function _processQueue() {
    if (_processing || _queue.length === 0) return;
    _processing = true;

    while (_queue.length > 0) {
      const item = _queue.shift();
      try {
        const result = await send(item.systemPrompt, item.userContent, item.opts);
        item.resolve(result);
      } catch (e) {
        item.reject(e);
      }// 间隔 500ms 防止速率限制
      if (_queue.length > 0) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    _processing = false;
  }

  return { fetchModels, send, enqueue };
})();


/* ═══════════════════════════════════════════════════════════
 *  block_05 — Scheduler (定时任务 + 静默期)
 *  营造 AI 主动发消息的感觉
 * ═══════════════════════════════════════════════════════════ */
FT.Scheduler = (() => {
  let _timer = null;
  let _cooldownUntil = 0;   // 静默期结束时间戳
  let _interval = 0;        // 触发间隔 ms
  let _cooldownDuration = 3* 60 * 60 * 1000; // 默认 3 小时

  /**
   * 初始化调度器
   */
  async function init() {
    try {
      const saved = await FT.Store.get('scheduler', 'state') || {};
      _cooldownUntil = saved.cooldownUntil || 0;

      const settings = await FT.Store.get('settings', 'scheduler') || {};
      _interval = settings.interval || 0;
      _cooldownDuration = (settings.cooldownHours ?? 3) * 60 * 60 * 1000;

      if (_interval > 0) {
        start();
      }
    } catch (e) {
      FT.ErrorLogger?.log('Scheduler', '初始化失败', e);
    }
  }

  /**
   * 启动定时器
   */
  function start() {
    stop();
    if (_interval <= 0) return;

    _timer = setInterval(() => {
      _tick();
    }, _interval);

    console.log(`[FT] Scheduler 启动，间隔 ${_interval / 60000} 分钟`);
  }

  /**
   * 停止定时器
   */
  function stop() {
    if (_timer) {
      clearInterval(_timer);
      _timer = null;
    }
  }

  /**
   * 定时触发
   */
  async function _tick() {
    const now = Date.now();

    // 检查静默期
    if (now < _cooldownUntil) {
      console.log(`[FT] Scheduler 静默中，剩余 ${Math.round((_cooldownUntil - now) / 60000)} 分钟`);
      return;
    }

    // 检查副 API 是否配置
    const config = await FT.Store.get('settings', 'subapi') || {};
    if (!config.url || !config.key || !config.model) {
      return;
    }

    // 触发事件，让各App 决定是否响应
    FT.EventBus.emit('scheduler:tick', { timestamp: now });

    // 进入静默期
    _cooldownUntil = now + _cooldownDuration;
    await FT.Store.set('scheduler', 'state', { cooldownUntil: _cooldownUntil });

    console.log(`[FT] Scheduler 已触发，进入静默期 ${_cooldownDuration / 3600000} 小时`);
  }

  /**
   * 更新配置
   */
  async function updateConfig(interval, cooldownHours) {
    _interval = interval;
    _cooldownDuration = (cooldownHours ?? 3) * 60 * 60 * 1000;

    await FT.Store.set('settings', 'scheduler', {
      interval: _interval,
      cooldownHours: cooldownHours ?? 3,
    });

    if (_interval > 0) {
      start();
    } else {
      stop();
    }
  }

  /**
   * 手动重置静默期
   */
  async function resetCooldown() {
    _cooldownUntil = 0;
    await FT.Store.set('scheduler', 'state', { cooldownUntil: 0 });
  }

  function isInCooldown() {
    return Date.now() < _cooldownUntil;
  }

  function getCooldownRemaining() {
    const remaining = _cooldownUntil - Date.now();
    return remaining > 0 ? remaining : 0;
  }

  return { init, start, stop, updateConfig, resetCooldown, isInCooldown, getCooldownRemaining };
})();


/* ═══════════════════════════════════════════════════════════
 *  block_06 — NotificationSystem
 *  通知栏 + 灵动岛提示 + 角标
 * ═══════════════════════════════════════════════════════════ */
FT.NotificationSystem = (() => {
  let _notifications = [];
  let _maxNotifications = 50;
  let _islandTimer = null;

  async function init() {
    try {
      const saved = await FT.Store.get('notifications', 'list');
      if (Array.isArray(saved)) {
        _notifications = saved;
      }_renderBadge();
    } catch (e) {
      FT.ErrorLogger?.log('Notification', '初始化失败', e);
    }
  }

  /**
   * 推送通知
   * @param {string} appName - 来源 App 名称
   * @param {string} icon - emoji 图标
   * @param {string} text - 通知内容
   */
  async function push(appName, icon, text) {
    const notif = {
      id: Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      app: appName,
      icon: icon,
      text: text,
      time: Date.now(),
      read: false,
    };

    _notifications.unshift(notif);

    // 限制数量
    if (_notifications.length > _maxNotifications) {
      _notifications = _notifications.slice(0, _maxNotifications);
    }

    await _save();
    _renderBadge();
    _renderList();
    _showIsland(icon, text);

    FT.EventBus.emit('notification:new', notif);
  }

  /**
   * 灵动岛短暂展示
   */
  function _showIsland(icon, text) {
    const island = document.getElementById('ft-dynamic-island');
    const content = document.getElementById('ft-island-content');
    if (!island || !content) return;

    // 清除之前的定时器
    if (_islandTimer) clearTimeout(_islandTimer);

    content.textContent = `${icon} ${text}`;
    island.classList.add('ft-island-expand');

    _islandTimer = setTimeout(() => {
      island.classList.remove('ft-island-expand');}, 3000);
  }

  /**
   * 渲染角标数字
   */
  function _renderBadge() {
    const unread = _notifications.filter(n => !n.read).length;

    //悬浮球角标
    const fabBadge = document.getElementById('ft-fab-badge');
    if (fabBadge) {
      fabBadge.textContent = unread > 99 ? '99+' : unread;
      fabBadge.classList.toggle('ft-visible', unread > 0);
    }

    // Dock 通知按钮角标
    const dockBadge = document.querySelector('#ft-dock-notif .ft-dock-badge');
    if (dockBadge) {
      dockBadge.textContent = unread > 99 ? '99+' : unread;
      dockBadge.classList.toggle('ft-visible', unread > 0);
    }
  }

  /**
   * 渲染通知列表
   */
  function _renderList() {
    const list = document.getElementById('ft-notif-list');
    if (!list) return;

    if (_notifications.length === 0) {
      list.innerHTML = '<div class="ft-notif-empty">📭 暂无通知</div>';
      return;
    }

    list.innerHTML = _notifications.map(n => {
      const timeStr = _formatTime(n.time);
      return `
        <div class="ft-notif-item ft-slide-up" data-id="${n.id}">
          <span class="ft-notif-icon">${_escHtml(n.icon)}</span>
          <div class="ft-notif-body">
            <div class="ft-notif-app">${_escHtml(n.app)}</div>
            <div class="ft-notif-text">${_escHtml(n.text)}</div>
            <div class="ft-notif-time">${timeStr}</div>
          </div></div>
      `;
    }).join('');
  }

  function _formatTime(ts) {
    const d = new Date(ts);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  function _escHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  async function _save() {
    await FT.Store.set('notifications', 'list', _notifications);
  }

  /**
   * 标记全部已读
   */
  async function markAllRead() {
    _notifications.forEach(n => n.read = true);
    await _save();
    _renderBadge();
  }

  /**
   * 清空所有通知
   */
  async function clearAll() {
    _notifications = [];
    await _save();
    _renderBadge();
    _renderList();
  }

  function getUnreadCount() {
    return _notifications.filter(n => !n.read).length;
  }

  return { init, push, markAllRead, clearAll, getUnreadCount, _renderList, _renderBadge };
})();


/* ═══════════════════════════════════════════════════════════
 *  block_07 — ErrorLogger
 *  报错日志，存IndexedDB，配置面板展示
 * ═══════════════════════════════════════════════════════════ */
FT.ErrorLogger = (() => {
  let _errors = [];
  const MAX_ERRORS = 200;

  async function init() {
    try {
      const saved = await FT.Store.get('errors', 'list');
      if (Array.isArray(saved)) {
        _errors = saved;
      }
    } catch (e) {
      console.error('[FT] ErrorLogger init失败', e);
    }
  }

  /**
   * 记录错误
   * @param {string} source - 来源模块
   * @param {string} message - 错误描述
   * @param {Error|any} error - 错误对象
   */
  function log(source, message, error) {
    const entry = {
      id: Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      time: Date.now(),
      source: source || 'Unknown',
      message: message || '',
      stack: error?.stack || error?.message || String(error || ''),
    };

    _errors.unshift(entry);

    // 限制数量
    if (_errors.length > MAX_ERRORS) {
      _errors = _errors.slice(0, MAX_ERRORS);
    }

    // 异步保存，不阻塞
    FT.Store.set('errors', 'list', _errors).catch(() => {});

    // 控制台也输出
    console.error(`[FT][${source}] ${message}`, error || '');

    // 更新配置面板
    _renderSettingsErrors();

    // 更新 Dock 角标
    _renderDockBadge();
  }

  /**
   * 渲染配置面板中的错误列表
   */
  function _renderSettingsErrors() {
    const list = document.getElementById('ft-set-error-list');
    const count = document.getElementById('ft-set-error-count');
    if (count) count.textContent = _errors.length;
    if (!list) return;

    if (_errors.length === 0) {
      list.innerHTML = '<div class="ft-set-error-empty">暂无错误日志 ✨</div>';
      return;
    }

    list.innerHTML = _errors.map(e => {
      const d = new Date(e.time);
      const timeStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
      return `
        <div class="ft-set-error-item" data-id="${e.id}">
          <div class="ft-set-error-time">${timeStr}</div>
          <div>
            <span class="ft-set-error-source">[${_escHtml(e.source)}]</span>
            <span class="ft-set-error-msg">${_escHtml(e.message)}</span>
          </div>
          ${e.stack ? `
            <div class="ft-set-error-expand-hint">▶ 展开堆栈</div>
            <div class="ft-set-error-stack">${_escHtml(e.stack)}</div>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  function _renderDockBadge() {
    const badge = document.querySelector('#ft-dock-errors .ft-dock-badge');
    if (badge) {
      const count = _errors.length;
      badge.textContent = count > 99 ? '99+' : count;
      badge.classList.toggle('ft-visible', count > 0);
    }
  }

  function _escHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  async function clear() {
    _errors = [];
    await FT.Store.set('errors', 'list', []);
    _renderSettingsErrors();
    _renderDockBadge();
  }

  function getAll() {
    return [..._errors];
  }

  function getCount() {
    return _errors.length;
  }

  return { init, log, clear, getAll, getCount, _renderSettingsErrors, _renderDockBadge };
})();


/* ═══════════════════════════════════════════════════════════
 *  block_99 — 注册 + 初始化 + 手机外壳 + 悬浮球 + 拖动
 *             + 配置面板绑定
 * ═══════════════════════════════════════════════════════════ */
FT.Shell = (() => {
  let _isOpen = false;
  let _currentApp = null;  // 当前打开的 App 页面 id
  let _notifPanelOpen = false;

  //── 17个 App 定义（占位，后续阶段填充功能） ──────────────
  const APP_DEFS = [
    { id: 'app_radio',icon: '📻', label: '电台归档', color: '#A32D2D', colorSoft: '#FCEBEB' },
    { id: 'app_diary',     icon: '📓', label: '日记本',color: '#633806', colorSoft: '#FAEEDA' },
    { id: 'app_mood',      icon: '🌡', label: '情绪温度', color: '#085041', colorSoft: '#E1F5EE' },
    { id: 'app_chat',      icon: '💬', label: '私聊频道', color: '#0C447C', colorSoft: '#E6F1FB' },
    { id: 'app_gallery',   icon: '🖼', label: '相册',     color: '#3C3489', colorSoft: '#EEEDFE' },
    { id: 'app_music',     icon: '🎵', label: '歌单',     color: '#72243E', colorSoft: '#FBEAF0' },
    { id: 'app_map',       icon: '🗺', label: '足迹地图', color: '#2D5A0E', colorSoft: '#EAF3DE' },
    { id: 'app_contacts',  icon: '👥', label: '通讯录',   color: '#2E2E3A', colorSoft: '#EBEBF0' },
    { id: 'app_news',      icon: '📰', label: '新闻',     color: '#0C447C', colorSoft: '#E6F1FB' },
    { id: 'app_weather',   icon: '🌤', label: '天气',     color: '#085041', colorSoft: '#E1F5EE' },
    { id: 'app_notes',     icon: '📝', label: '便签',     color: '#633806', colorSoft: '#FAEEDA' },
    { id: 'app_calendar',  icon: '📅', label: '日历',     color: '#A32D2D', colorSoft: '#FCEBEB' },
    { id: 'app_dreams',    icon: '🌙', label: '梦境记录', color: '#3C3489', colorSoft: '#EEEDFE' },
    { id: 'app_recipes',   icon: '🍳', label: '食谱',     color: '#72243E', colorSoft: '#FBEAF0' },
    { id: 'app_fitness',   icon: '🏃', label: '运动',     color: '#2D5A0E', colorSoft: '#EAF3DE' },
    { id: 'app_secrets',   icon: '🔒', label: '加密笔记', color: '#2E2E3A', colorSoft: '#EBEBF0' },
    { id: 'app_radio_live',icon: '📡', label: '实时电波', color: '#A32D2D', colorSoft: '#FCEBEB' },
  ];

  /**
   * 构建手机外壳 DOM
   */
  function buildShell() {
    //悬浮球
    const fab = document.createElement('div');
    fab.id = 'ft-fab';
    fab.innerHTML = `📻<span id="ft-fab-badge"></span>`;
    document.body.appendChild(fab);

    // 手机外壳
    const wrap = document.createElement('div');
    wrap.id = 'ft-phone-wrap';
    wrap.innerHTML = `
      <div id="ft-phone-shell">
        <div id="ft-screen">
          <!--拖动把手 -->
          <div id="ft-drag-handle"></div>

          <!-- 灵动岛 -->
          <div id="ft-dynamic-island">
            <span id="ft-island-content"></span>
          </div>

          <!-- 状态栏 -->
          <div id="ft-status-bar">
            <span id="ft-status-time"></span>
            <span id="ft-status-icons">
              <span>📶</span>
              <span>🔋</span>
            </span>
          </div>

          <!-- 关闭按钮 -->
          <div id="ft-close-btn">✕</div>

          <!-- 通知面板（下拉） -->
          <div id="ft-notification-panel">
            <div id="ft-pull-indicator"></div>
            <div id="ft-notif-header">
              <span id="ft-notif-title">通知</span>
              <span id="ft-notif-clear">清除全部</span>
            </div>
            <div id="ft-notif-list"></div>
          </div>

          <!-- 主内容区 -->
          <div id="ft-content-area">
            <!-- 主屏 -->
            <div id="ft-home-screen">
              <div id="ft-home-title">FREQ · TERMINAL</div>
              <div id="ft-app-grid"></div>
            </div>

            <!-- App 页面容器（各App 页面动态插入这里） -->
            <div id="ft-app-pages"></div>
          </div>

          <!-- 底部 Dock -->
          <div id="ft-dock">
            <div class="ft-dock-btn" id="ft-dock-notif" data-action="notifications">
              <span class="ft-dock-icon">🔔</span>
              <span class="ft-dock-label">通知</span>
              <span class="ft-dock-badge"></span>
            </div>
            <div class="ft-dock-btn" id="ft-dock-home" data-action="home">
              <span class="ft-dock-icon">🏠</span>
              <span class="ft-dock-label">主屏</span>
            </div>
            <div class="ft-dock-btn" id="ft-dock-errors" data-action="errors">
              <span class="ft-dock-icon">🐛</span>
              <span class="ft-dock-label">日志</span>
              <span class="ft-dock-badge"></span>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(wrap);

    // 渲染 App 图标网格
    _renderAppGrid();

    // 构建报错日志 App页面（手机内简版）
    _buildErrorPage();

    // 更新时钟
    _updateClock();setInterval(_updateClock, 30000);
  }

  /**
   * 渲染主屏 App 图标
   */
  function _renderAppGrid() {
    const grid = document.getElementById('ft-app-grid');
    if (!grid) return;

    grid.innerHTML = APP_DEFS.map(app => `
      <div class="ft-app-icon" data-app="${app.id}">
        <div class="ft-app-icon-img" style="background:${app.colorSoft};">
          ${app.icon}
          <span class="ft-app-icon-badge"></span>
        </div>
        <span class="ft-app-icon-label">${app.label}</span>
      </div>
    `).join('');
  }

  /**
   * 构建手机内报错日志页面
   */
  function _buildErrorPage() {
    const pages = document.getElementById('ft-app-pages');
    if (!pages) return;

    const page = document.createElement('div');
    page.className = 'ft-app-page';
    page.id = 'ft-page-errors';
    page.innerHTML = `
      <div class="ft-app-nav">
        <span class="ft-app-nav-back" data-action="back">‹ 返回</span>
        <span class="ft-app-nav-title">报错日志</span>
        <span class="ft-app-nav-action" data-action="clear-errors">清空</span>
      </div>
      <div class="ft-app-scroll" id="ft-phone-error-list">
        <div class="ft-empty">
          <div class="ft-empty-icon">✨</div>
          <div>暂无错误日志</div>
        </div>
      </div>
    `;
    pages.appendChild(page);
  }

  /**
   *渲染手机内报错日志
   */
  function _renderPhoneErrors() {
    const list = document.getElementById('ft-phone-error-list');
    if (!list) return;

    const errors = FT.ErrorLogger.getAll();
    if (errors.length === 0) {
      list.innerHTML = `
        <div class="ft-empty">
          <div class="ft-empty-icon">✨</div>
          <div>暂无错误日志</div>
        </div>
      `;
      return;
    }

    list.innerHTML = errors.map(e => {
      const d = new Date(e.time);
      const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
      return `
        <div class="ft-card" data-error-id="${e.id}">
          <div class="ft-card-header">
            <span class="ft-card-badge ft-error-badge">${_escHtml(e.source)}</span>
            <span class="ft-card-title" style="font-size:13px;">${_escHtml(e.message)}</span>
            <span class="ft-card-chevron">▼</span>
          </div>
          <div class="ft-card-body">
            <div style="font-size:11px;color:var(--ft-light);margin-bottom:4px;">${timeStr}</div>
            <pre style="font-size:11px;font-family:'Courier New',monospace;white-space:pre-wrap;word-break:break-all;margin:0;color:var(--ft-mid);">${_escHtml(e.stack)}</pre>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * 更新状态栏时钟
   */
  function _updateClock() {
    const el = document.getElementById('ft-status-time');
    if (!el) return;
    const now = new Date();
    el.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

  function _escHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  // ── 事件绑定 ────────────────────────────────────────────
  let _fabClickHandler = null;
  let _shellClickHandler = null;
  let _settingsClickHandler = null;
  let _settingsChangeHandler = null;

  function bindEvents() {
    const fab = document.getElementById('ft-fab');
    const wrap = document.getElementById('ft-phone-wrap');

    // ── 悬浮球点击 ──
    if (fab) {
      if (_fabClickHandler) fab.removeEventListener('click', _fabClickHandler);
      _fabClickHandler = (e) => {
        e.stopPropagation();
        togglePhone();
      };
      fab.addEventListener('click', _fabClickHandler);
    }

    // ── 手机内点击事件委托 ──
    if (wrap) {
      if (_shellClickHandler) wrap.removeEventListener('click', _shellClickHandler);
      _shellClickHandler = (e) => {
        const target = e.target;

        // 关闭按钮
        if (target.id === 'ft-close-btn' || target.closest('#ft-close-btn')) {
          closePhone();
          return;
        }

        // Dock 按钮
        const dockBtn = target.closest('.ft-dock-btn');
        if (dockBtn) {
          const action = dockBtn.dataset.action;
          if (action === 'notifications') _toggleNotifPanel();
          else if (action === 'home') _goHome();
          else if (action === 'errors') _openPage('ft-page-errors');
          return;
        }

        // App 图标
        const appIcon = target.closest('.ft-app-icon');
        if (appIcon) {
          const appId = appIcon.dataset.app;
          _openApp(appId);
          return;
        }

        // 返回按钮
        const backBtn = target.closest('.ft-app-nav-back');
        if (backBtn) {
          _goHome();
          return;
        }

        // 清空报错
        const clearErrors = target.closest('[data-action="clear-errors"]');
        if (clearErrors) {
          FT.ErrorLogger.clear();
          _renderPhoneErrors();
          return;
        }

        // 清除通知
        if (target.id === 'ft-notif-clear' || target.closest('#ft-notif-clear')) {
          FT.NotificationSystem.clearAll();
          return;
        }

        // 卡片展开/收起
        const cardHeader = target.closest('.ft-card-header');
        if (cardHeader) {
          const card = cardHeader.closest('.ft-card');
          if (card) card.classList.toggle('ft-expanded');return;
        }
      };
      wrap.addEventListener('click', _shellClickHandler);
    }

    // ── 拖动 ──
    _bindDrag();
  }

  // ── 拖动逻辑 ────────────────────────────────────────────
  function _bindDrag() {
    const handle = document.getElementById('ft-drag-handle');
    const wrap = document.getElementById('ft-phone-wrap');
    if (!handle || !wrap) return;

    let isDragging = false;
    let startX, startY, origLeft, origTop;

    function onStart(e) {
      isDragging = true;
      wrap.classList.add('ft-dragging');

      const touch = e.touches ? e.touches[0] : e;
      startX = touch.clientX;
      startY = touch.clientY;

      const rect = wrap.getBoundingClientRect();
      origLeft = rect.left;
      origTop = rect.top;

      // 切换到 top/left 定位
      wrap.style.bottom = 'auto';
      wrap.style.right = 'auto';
      wrap.style.left = origLeft + 'px';
      wrap.style.top = origTop + 'px';
    }

    function onMove(e) {
      if (!isDragging) return;
      e.preventDefault();

      const touch = e.touches ? e.touches[0] : e;
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;

      let newLeft = origLeft + dx;
      let newTop = origTop + dy;

      // 边界限制
      const maxLeft = window.innerWidth - 60;
      const maxTop = window.innerHeight - 60;
      newLeft = Math.max(-wrap.offsetWidth + 60, Math.min(maxLeft, newLeft));
      newTop = Math.max(0, Math.min(maxTop, newTop));

      wrap.style.left = newLeft + 'px';
      wrap.style.top = newTop + 'px';
    }

    function onEnd() {
      isDragging = false;
      wrap.classList.remove('ft-dragging');
    }

    // Mouse
    handle.addEventListener('mousedown', onStart);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);

    // Touch
    handle.addEventListener('touchstart', onStart, { passive: false });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  }

  // ── 手机开关 ────────────────────────────────────────────
  function togglePhone() {
    if (_isOpen) closePhone();
    else openPhone();
  }

  function openPhone() {
    const wrap = document.getElementById('ft-phone-wrap');
    if (!wrap) return;
    _isOpen = true;
    wrap.classList.add('ft-open');
    wrap.style.display = 'block';
    FT.NotificationSystem.markAllRead();
    FT.NotificationSystem._renderList();
    FT.EventBus.emit('phone:opened');
  }

  function closePhone() {
    const wrap = document.getElementById('ft-phone-wrap');
    if (!wrap) return;
    _isOpen = false;
    wrap.classList.remove('ft-open');
    wrap.style.display = 'none';
    _closeNotifPanel();
    FT.EventBus.emit('phone:closed');
  }

  function _toggleNotifPanel() {
    const panel = document.getElementById('ft-notification-panel');
    if (!panel) return;
    _notifPanelOpen = !_notifPanelOpen;
    panel.classList.toggle('ft-panel-open', _notifPanelOpen);
    if (_notifPanelOpen) {
      FT.NotificationSystem.markAllRead();
      FT.NotificationSystem._renderList();
    }
  }

  function _closeNotifPanel() {
    const panel = document.getElementById('ft-notification-panel');
    if (!panel) return;
    _notifPanelOpen = false;
    panel.classList.remove('ft-panel-open');
  }

  function _goHome() {
    _closeNotifPanel();
    //隐藏所有 App 页面
    document.querySelectorAll('.ft-app-page').forEach(p => p.classList.remove('ft-active'));
    _currentApp = null;
    // 显示主屏
    const home = document.getElementById('ft-home-screen');
    if (home) home.style.display = '';}

  function _openPage(pageId) {
    _closeNotifPanel();
    // 隐藏主屏
    const home = document.getElementById('ft-home-screen');
    if (home) home.style.display = 'none';
    // 隐藏其他页面
    document.querySelectorAll('.ft-app-page').forEach(p => p.classList.remove('ft-active'));
    // 显示目标页面
    const page = document.getElementById(pageId);
    if (page) {
      page.classList.add('ft-active');
      _currentApp = pageId;
    }

    // 如果是报错页面，渲染内容
    if (pageId === 'ft-page-errors') {
      _renderPhoneErrors();
    }
  }

  function _openApp(appId) {
    // 查找对应的 App 页面
    const pageId = `ft-page-${appId}`;
    const page = document.getElementById(pageId);

    if (page) {
      _openPage(pageId);
    } else {
      // 未实现的 App，显示占位
      _showPlaceholder(appId);
    }

    FT.EventBus.emit('app:opened', { appId });
  }

  function _showPlaceholder(appId) {
    const def = APP_DEFS.find(a => a.id === appId);
    if (!def) return;

    // 动态创建占位页面
    let page = document.getElementById(`ft-page-${appId}`);
    if (!page) {
      const pages = document.getElementById('ft-app-pages');
      if (!pages) return;
      page = document.createElement('div');
      page.className = 'ft-app-page';
      page.id = `ft-page-${appId}`;
      page.innerHTML = `
        <div class="ft-app-nav">
          <span class="ft-app-nav-back" data-action="back">‹ 返回</span>
          <span class="ft-app-nav-title">${def.label}</span>
          <span class="ft-app-nav-action"></span>
        </div>
        <div class="ft-app-scroll">
          <div class="ft-empty">
            <div class="ft-empty-icon">${def.icon}</div>
            <div>${def.label}</div>
            <div style="margin-top:8px;font-size:12px;">信号调谐中…即将上线</div>
          </div>
        </div>
      `;
      pages.appendChild(page);
    }

    _openPage(`ft-page-${appId}`);
  }

  // ── 悬浮球显示/隐藏 ──────────────────────────────────────
  function showFab() {
    const fab = document.getElementById('ft-fab');
    if (fab) fab.style.display = 'flex';
  }

  function hideFab() {
    const fab = document.getElementById('ft-fab');
    if (fab) fab.style.display = 'none';
  }

  return {
    buildShell, bindEvents, togglePhone, openPhone, closePhone,
    showFab, hideFab, APP_DEFS,
  };
})();


/* ═══════════════════════════════════════════════════════════
 *  block_99— 配置面板绑定
 * ═══════════════════════════════════════════════════════════ */
FT.Settings = (() => {
  //展开/收起状态存在对象里，不存DOM
  const _expandedPrompts = {};
  const _expandedErrors = {};

  let _clickHandler = null;
  let _changeHandler = null;

  /**
   * 初始化配置面板
   */
  async function init() {
    // 等待 settings.html 被ST 加载到 DOM
    await _waitForElement('#ft-settings-wrap', 10000);

    // 渲染提示词列表
    _renderPromptsList();

    // 加载保存的设置
    await _loadSettings();

    // 绑定事件
    _bindEvents();

    // 渲染报错日志
    FT.ErrorLogger._renderSettingsErrors();
  }

  function _waitForElement(selector, timeout = 5000) {
    return new Promise((resolve) => {
      const el = document.querySelector(selector);
      if (el) { resolve(el); return; }

      const observer = new MutationObserver(() => {
        const el = document.querySelector(selector);
        if (el) { observer.disconnect(); resolve(el); }
      });
      observer.observe(document.body, { childList: true, subtree: true });

      setTimeout(() => { observer.disconnect(); resolve(null); }, timeout);
    });
  }

  /**
   * 渲染提示词编辑列表
   */
  function _renderPromptsList() {
    const container = document.getElementById('ft-set-prompts-list');
    if (!container) return;

    container.innerHTML = FT.Shell.APP_DEFS.map(app => {
      const isExpanded = _expandedPrompts[app.id] || false;
      return `
        <div class="ft-set-prompt-item ${isExpanded ? 'ft-expanded' : ''}" data-prompt-app="${app.id}">
          <div class="ft-set-prompt-header">
            <span class="ft-set-prompt-icon">${app.icon}</span>
            <span class="ft-set-prompt-name">${app.label}</span>
            <span class="ft-set-prompt-chevron">▼</span>
          </div>
          <div class="ft-set-prompt-body">
            <div class="ft-set-prompt-body-inner">
              <textarea class="ft-set-prompt-textarea" data-prompt-id="${app.id}"placeholder="留空使用默认提示词…"></textarea>
              <div class="ft-set-prompt-reset" data-reset-prompt="${app.id}">↻恢复默认</div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * 加载已保存的设置
   */
  async function _loadSettings() {
    try {
      // 基础设置
      const basic = await FT.Store.get('settings', 'basic') || {};
      _setChecked('ft-set-enabled', basic.enabled !== false);
      _setChecked('ft-set-fab', basic.fabVisible !== false);

      // 副API
      const subapi = await FT.Store.get('settings', 'subapi') || {};
      _setValue('ft-set-api-url', subapi.url || '');
      _setValue('ft-set-api-key', subapi.key || '');
      if (subapi.model && subapi.models) {
        _populateModels(subapi.models, subapi.model);
      }

      // 调度器
      const scheduler = await FT.Store.get('settings', 'scheduler') || {};
      const freq = scheduler.interval || 0;
      const freqSelect = document.getElementById('ft-set-trigger-freq');
      if (freqSelect) {
        // 检查是否匹配预设值
        const presets = ['0', '1800000', '3600000'];
        if (presets.includes(String(freq))) {
          freqSelect.value = String(freq);
        } else if (freq > 0) {
          freqSelect.value = 'custom';
          _showCustomFreq(true);
          _setValue('ft-set-custom-freq-val', Math.round(freq / 60000));
        }
      }_setValue('ft-set-cooldown', scheduler.cooldownHours ?? 3);

      // 提示词
      const prompts = await FT.Store.getAll('prompts');
      for (const [appId, prompt] of Object.entries(prompts)) {
        const textarea = document.querySelector(`textarea[data-prompt-id="${appId}"]`);
        if (textarea) textarea.value = prompt || '';
      }

      // 应用基础设置
      _applyBasicSettings(basic);
    } catch (e) {
      FT.ErrorLogger?.log('Settings', '加载设置失败', e);
    }
  }

  function _applyBasicSettings(basic) {
    if (basic.enabled === false) {
      FT.Shell.hideFab();
      FT.Shell.closePhone();} else if (basic.fabVisible === false) {
      FT.Shell.hideFab();
    } else {
      FT.Shell.showFab();
    }
  }

  function _setChecked(id, val) {
    const el = document.getElementById(id);
    if (el) el.checked = val;
  }

  function _setValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
  }

  function _showCustomFreq(show) {
    const el = document.querySelector('.ft-set-custom-freq');
    if (el) el.style.display = show ? 'block' : 'none';
  }

  function _populateModels(models, selectedModel) {
    const select = document.getElementById('ft-set-model');
    if (!select) return;

    select.innerHTML = models.map(m =>
      `<option value="${m.id}" ${m.id === selectedModel ? 'selected' : ''}>${m.name}</option>`
    ).join('');
    select.disabled = false;
  }

  /**
   * 绑定配置面板事件
   */
  function _bindEvents() {
    const wrap = document.getElementById('ft-settings-wrap');
    if (!wrap) return;

    // ── 点击事件委托 ──
    if (_clickHandler) wrap.removeEventListener('click', _clickHandler);
    _clickHandler = async (e) => {
      const target = e.target;

      // 打开手机面板
      if (target.id === 'ft-set-open-phone' || target.closest('#ft-set-open-phone')) {
        FT.Shell.showFab();
        FT.Shell.openPhone();
        return;
      }

      // 连接获取模型
      if (target.id === 'ft-set-fetch-models' || target.closest('#ft-set-fetch-models')) {
        await _fetchModels();
        return;
      }

      // 密钥显示/隐藏
      if (target.id === 'ft-set-key-toggle' || target.closest('#ft-set-key-toggle')) {
        const input = document.getElementById('ft-set-api-key');
        if (input) input.type = input.type === 'password' ? 'text' : 'password';
        return;
      }

      // 清空报错
      if (target.id === 'ft-set-clear-errors' || target.closest('#ft-set-clear-errors')) {
        await FT.ErrorLogger.clear();
        return;
      }

      // 提示词展开/收起
      const promptHeader = target.closest('.ft-set-prompt-header');
      if (promptHeader) {
        const item = promptHeader.closest('.ft-set-prompt-item');
        if (item) {
          const appId = item.dataset.promptApp;
          _expandedPrompts[appId] = !_expandedPrompts[appId];
          item.classList.toggle('ft-expanded', _expandedPrompts[appId]);
        }
        return;
      }

      //恢复默认提示词
      const resetPrompt = target.closest('[data-reset-prompt]');
      if (resetPrompt) {
        const appId = resetPrompt.dataset.resetPrompt;
        const textarea = document.querySelector(`textarea[data-prompt-id="${appId}"]`);
        if (textarea) {
          textarea.value = '';
          await FT.Store.del('prompts', appId);
        }
        return;
      }

      // 报错日志展开/收起
      const errorItem = target.closest('.ft-set-error-item');
      if (errorItem && (target.closest('.ft-set-error-expand-hint') || target.closest('.ft-set-error-stack'))) {
        const id = errorItem.dataset.id;
        _expandedErrors[id] = !_expandedErrors[id];
        errorItem.classList.toggle('ft-expanded', _expandedErrors[id]);
        const hint = errorItem.querySelector('.ft-set-error-expand-hint');
        if (hint) hint.textContent = _expandedErrors[id] ? '▼ 收起堆栈' : '▶ 展开堆栈';
        return;
      }
    };
    wrap.addEventListener('click', _clickHandler);

    // ── change 事件 ──
    if (_changeHandler) wrap.removeEventListener('change', _changeHandler);
    _changeHandler = async (e) => {
      const target = e.target;

      // 启用插件
      if (target.id === 'ft-set-enabled') {
        await _saveBasic();
        return;
      }

      // 悬浮球
      if (target.id === 'ft-set-fab') {
        await _saveBasic();
        return;
      }

      // 触发频率
      if (target.id === 'ft-set-trigger-freq') {
        _showCustomFreq(target.value === 'custom');
        await _saveScheduler();
        return;
      }

      // 自定义频率
      if (target.id === 'ft-set-custom-freq-val') {
        await _saveScheduler();
        return;
      }

      // 静默期
      if (target.id === 'ft-set-cooldown') {
        await _saveScheduler();
        return;
      }

      // 模型选择
      if (target.id === 'ft-set-model') {
        await _saveSubAPI();
        return;
      }

      // 提示词
      if (target.dataset?.promptId) {
        await FT.Store.set('prompts', target.dataset.promptId, target.value);
        return;
      }
    };
    wrap.addEventListener('change', _changeHandler);

    // ── 提示词输入防抖保存 ──
    let _promptSaveTimer = null;
    wrap.addEventListener('input', (e) => {
      if (e.target.dataset?.promptId) {
        clearTimeout(_promptSaveTimer);
        _promptSaveTimer = setTimeout(async () => {
          await FT.Store.set('prompts', e.target.dataset.promptId, e.target.value);
        }, 800);
      }
    });

    // ── API 地址和密钥失焦保存 ──
    const apiUrl = document.getElementById('ft-set-api-url');
    const apiKey = document.getElementById('ft-set-api-key');
    if (apiUrl) apiUrl.addEventListener('blur', () => _saveSubAPI());
    if (apiKey) apiKey.addEventListener('blur', () => _saveSubAPI());
  }

  async function _saveBasic() {
    const enabled = document.getElementById('ft-set-enabled')?.checked !== false;
    const fabVisible = document.getElementById('ft-set-fab')?.checked !== false;
    const basic = { enabled, fabVisible };
    await FT.Store.set('settings', 'basic', basic);_applyBasicSettings(basic);
  }

  async function _saveSubAPI() {
    const url = document.getElementById('ft-set-api-url')?.value || '';
    const key = document.getElementById('ft-set-api-key')?.value || '';
    const model = document.getElementById('ft-set-model')?.value || '';

    // 保存当前模型列表
    const select = document.getElementById('ft-set-model');
    const models = [];
    if (select) {
      for (const opt of select.options) {
        if (opt.value) models.push({ id: opt.value, name: opt.textContent });
      }
    }

    await FT.Store.set('settings', 'subapi', { url, key, model, models });
  }

  async function _saveScheduler() {
    const freqSelect = document.getElementById('ft-set-trigger-freq');
    let interval = 0;

    if (freqSelect) {
      if (freqSelect.value === 'custom') {
        const customVal = parseInt(document.getElementById('ft-set-custom-freq-val')?.value || '0');
        interval = Math.max(5, customVal) * 60000;
      } else {
        interval = parseInt(freqSelect.value) || 0;
      }
    }

    const cooldownHours = parseFloat(document.getElementById('ft-set-cooldown')?.value || '3');

    await FT.Scheduler.updateConfig(interval, cooldownHours);
  }

  async function _fetchModels() {
    const btn = document.getElementById('ft-set-fetch-models');
    const status = document.getElementById('ft-set-model-status');
    const url = document.getElementById('ft-set-api-url')?.value || '';
    const key = document.getElementById('ft-set-api-key')?.value || '';

    if (!url || !key) {
      if (status) {
        status.textContent = '⚠ 请先填写 API 地址和密钥';
        status.style.color = '#A32D2D';
      }
      return;
    }

    if (btn) btn.textContent = '连接中…';
    if (status) { status.textContent = ''; status.style.color = ''; }

    const result = await FT.SubAPI.fetchModels(url, key);

    if (result.ok && result.models.length > 0) {
      _populateModels(result.models, '');
      if (status) {
        status.textContent = `✅ 获取到 ${result.models.length} 个模型`;
        status.style.color = '#2D5A0E';
      }
      // 自动保存
      await _saveSubAPI();
    } else {
      if (status) {
        status.textContent = `❌ 连接失败: ${result.error || '未获取到模型'}`;
        status.style.color = '#A32D2D';
      }
    }

    if (btn) btn.textContent = '连接';
  }

  return { init };
})();


/* ═══════════════════════════════════════════════════════════
 *  block_99 — 最终初始化入口
 * ═══════════════════════════════════════════════════════════ */
(async function FreqTerminalInit() {
  try {
    console.log(`[FT] Freq · Terminal v${FT.VERSION}初始化开始`);

    // 1. 打开数据库
    await FT.Store.open();

    // 2. 初始化报错日志（最先初始化，后续模块可以用它记录错误）
    await FT.ErrorLogger.init();

    // 3. 初始化通知系统
    await FT.NotificationSystem.init();

    // 4. 构建手机外壳 DOM
    FT.Shell.buildShell();

    // 5.绑定手机事件
    FT.Shell.bindEvents();

    // 6. 检查是否启用
    const basic = await FT.Store.get('settings', 'basic') || {};
    if (basic.enabled === false) {
      FT.Shell.hideFab();
      console.log('[FT] 插件已禁用');
    } else if (basic.fabVisible === false) {
      FT.Shell.hideFab();
    }

    // 7. 绑定 ST 事件源
    FT.STBridge.bind();

    // 8. 初始化调度器
    await FT.Scheduler.init();

    // 9. 初始化配置面板
    FT.Settings.init();

    console.log(`[FT] Freq · Terminal v${FT.VERSION} 初始化完成✅`);
  } catch (e) {
    console.error('[FT] 初始化失败', e);
    FT.ErrorLogger?.log('Init', '插件初始化失败', e);
  }
})();
