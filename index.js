// ╔══════════════════════════════════════════════════════════════╗
// ║           FREQ · TERMINAL  v2.0  —  index.js               ║
// ║  SillyTavern 扩展插件 · 虚拟手机面板                         ║
// ╚══════════════════════════════════════════════════════════════╝

(function () {
  'use strict';

// ┌──────────────────────────────────────────────────────────────┐
// │ BLOCK_00  常量 + 工具函数                                     │
// │ 依赖：无                                                      │
// └──────────────────────────────────────────────────────────────┘

  const PLUGIN_ID = 'freq-terminal';

  // ── 默认配置 ──────────────────────────────────────────────────
  const DEFAULT_SETTINGS = {
    // 插件开关
    enabled: true,

    // 悬浮窗开关
    floatBtnEnabled: true,

    // 副 API 配置
    subApiUrl:   '',
    subApiKey:   '',
    subApiModel: '',

    // 和风天气 API Key
    weatherKey: '',

    // 副 API 后台触发配置
    bgTriggerEnabled:  false,
    bgTriggerInterval: 60,        // 分钟：30 / 60 / 自定义
    bgTriggerCustomMin: 60,       // 自定义分钟数
    bgSilenceDuration: 180,       // 静默期分钟数（固定 3 小时）

    // 各 App 自定义 Prompt（空字符串 = 使用内置默认值）
    prompts: {
      app01: '',   // 电台归档
      app02: '',   // 后台录音室
      app03: '',   // 朋友圈·电波
      app04: '',   // 信号气象站
      app05: '',   // 弦外之音·扫频
      app06: '',   // 宇宙频率·感知
      app07: '',   // 打卡·连线日志
      app08: '',   // 日程表·双线轨道
      app09: '',   // 小说软件·频道文库
      app10: '',   // 地图·异界探索
      app11: '',   // 外卖·跨次元配送
      app12: '',   // 论坛·频道留言板
      app13: '',   // 时光胶囊·留声机
      app14: '',   // 梦境记录仪
      app15: '',   // 情绪电波仪
      app16: '',   // 黑匣子·禁区档案
      app17: '',   // 信号翻译器
      bgMessage: '', // 副 API 后台主动消息
    },
  };

  // ── 工具函数 ──────────────────────────────────────────────────

  /**
   * 从 AI 返回的原始文本中提取 XML 标签内容
   * @param {string} raw   AI 返回的原始字符串
   * @param {string[]} tags 需要提取的标签名数组
   * @returns {Object}     { tagName: value | null }
   */
  function parseXMLTags(raw, tags) {
    const result = {};
    for (const tag of tags) {
      try {
        const m = raw.match(new RegExp(`<${tag}>[\\s\\S]*?<\\/${tag}>`, 'i'));
        if (m) {
          // 去掉首尾标签，保留内部内容
          result[tag] = m[0]
            .replace(new RegExp(`^<${tag}>`, 'i'), '')
            .replace(new RegExp(`<\\/${tag}>$`, 'i'), '')
            .trim();
        } else {
          result[tag] = null;
        }
      } catch (e) {
        result[tag] = null;
      }
    }
    return result;
  }

  /**
   * 转义 HTML 特殊字符，防止 XSS
   * @param {string} str
   * @returns {string}
   */
  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * 返回格式化的当前时间字符串
   * @param {boolean} withSeconds 是否包含秒
   * @returns {string}  例：2026-05-03 14:23:07
   */
  function timeNow(withSeconds = true) {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const base = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    return withSeconds ? `${base}:${pad(d.getSeconds())}` : base;
  }

  /**
   * 安全截断文本，超长加省略号
   * @param {string} str
   * @param {number} max 最大字符数
   * @returns {string}
   */
  function truncate(str, max = 80) {
    if (str == null) return '';
    const s = String(str);
    return s.length > max ? s.slice(0, max) + '…' : s;
  }

  /**
   * Promise 版 setTimeout
   * @param {number} ms
   * @returns {Promise<void>}
   */
  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 生成简单唯一 ID
   * @returns {string}
   */
  function uid() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

// ── BLOCK_00 END ──────────────────────────────────────────────


// ┌──────────────────────────────────────────────────────────────┐
// │ BLOCK_01  EventBus — 模块间通信                               │
// │ 依赖：无                                                      │
// └──────────────────────────────────────────────────────────────┘

  const EventBus = (() => {
    const _listeners = {};   // { eventName: Set<fn> }

    return {
      /**
       * 订阅事件
       * @param {string} event
       * @param {Function} fn
       */
      on(event, fn) {
        if (!_listeners[event]) _listeners[event] = new Set();
        _listeners[event].add(fn);
      },

      /**
       * 取消订阅
       * @param {string} event
       * @param {Function} fn
       */
      off(event, fn) {
        if (_listeners[event]) _listeners[event].delete(fn);
      },

      /**
       * 发布事件
       * @param {string} event
       * @param {*} data
       */
      emit(event, data) {
        if (!_listeners[event]) return;
        for (const fn of _listeners[event]) {
          try {
            fn(data);
          } catch (e) {
            console.error(`[FREQ EventBus] 事件处理器异常 (${event}):`, e);
          }
        }
      },

      /** 调试用：列出所有已注册事件 */
      _debug() {
        return Object.fromEntries(
          Object.entries(_listeners).map(([k, v]) => [k, v.size])
        );
      },
    };
  })();

// ── BLOCK_01 END ──────────────────────────────────────────────


// ┌──────────────────────────────────────────────────────────────┐
// │ BLOCK_02  ST Bridge — 读取 SillyTavern 数据                  │
// │ 依赖：BLOCK_00                                               │
// └──────────────────────────────────────────────────────────────┘

  const STBridge = (() => {

    /**
     * 获取 ST 上下文，失败时返回空对象
     */
    function getContext() {
      try {
        return window.SillyTavern?.getContext?.() ?? {};
      } catch (e) {
        console.error('[FREQ STBridge] getContext 失败:', e);
        return {};
      }
    }

    /**
     * 获取最近 n 条聊天消息
     * @param {number} n  条数，默认 20
     * @returns {Array}   消息数组，每条有 .mes / .name / .is_user / .extra 字段
     */
    function getChatMessages(n = 20) {
      try {
        const ctx = getContext();
        const chat = ctx.chat ?? [];
        return chat.slice(-n);
      } catch (e) {
        console.error('[FREQ STBridge] getChatMessages 失败:', e);
        return [];
      }
    }

    /**
     * 读取插件设置，不存在时用 DEFAULT_SETTINGS 初始化
     * @returns {Object}
     */
    function getSettings() {
      try {
        if (!window.extension_settings) window.extension_settings = {};
        if (!window.extension_settings[PLUGIN_ID]) {
          // 深拷贝默认值，避免引用污染
          window.extension_settings[PLUGIN_ID] = JSON.parse(
            JSON.stringify(DEFAULT_SETTINGS)
          );
        }
        // 补全新增字段（升级兼容）
        const s = window.extension_settings[PLUGIN_ID];
        _deepMergeDefaults(s, DEFAULT_SETTINGS);
        return s;
      } catch (e) {
        console.error('[FREQ STBridge] getSettings 失败:', e);
        return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
      }
    }

    /**
     * 保存插件设置到 ST
     */
    function saveSettings() {
      try {
        window.saveSettingsDebounced?.();
      } catch (e) {
        console.error('[FREQ STBridge] saveSettings 失败:', e);
      }
    }

    /**
     * 获取当前角色名
     * @returns {string}
     */
    function getCharacterName() {
      try {
        return getContext().name2 ?? '未知角色';
      } catch (e) {
        return '未知角色';
      }
    }

    /**
     * 获取用户名
     * @returns {string}
     */
    function getUserName() {
      try {
        return getContext().name1 ?? '用户';
      } catch (e) {
        return '用户';
      }
    }

    /**
     * 获取所有角色卡
     * @returns {Array}
     */
    function getAllCharacters() {
      try {
        return getContext().characters ?? [];
      } catch (e) {
        console.error('[FREQ STBridge] getAllCharacters 失败:', e);
        return [];
      }
    }

    /**
     * 深度补全默认值（升级兼容，只补不覆盖）
     * @param {Object} target  现有设置
     * @param {Object} source  默认设置
     */
    function _deepMergeDefaults(target, source) {
      for (const key of Object.keys(source)) {
        if (!(key in target)) {
          target[key] = JSON.parse(JSON.stringify(source[key]));
        } else if (
          typeof source[key] === 'object' &&
          source[key] !== null &&
          !Array.isArray(source[key]) &&
          typeof target[key] === 'object' &&
          target[key] !== null
        ) {
          _deepMergeDefaults(target[key], source[key]);
        }
      }
    }

    return {
      getContext,
      getChatMessages,
      getSettings,
      saveSettings,
      getCharacterName,
      getUserName,
      getAllCharacters,
    };
  })();

// ── BLOCK_02 END ──────────────────────────────────────────────


// ┌──────────────────────────────────────────────────────────────┐
// │ BLOCK_03  Parser — 解析预设 XML 标签                          │
// │ 依赖：BLOCK_00, BLOCK_02                                     │
// └──────────────────────────────────────────────────────────────┘

  const Parser = (() => {

    /**
     * 从消息数组中提取所有 <meow_FM> 标签数据
     * @param {Array} messages  STBridge.getChatMessages() 返回的数组
     * @returns {Array}  [ { serial, time, scene, plot, seeds, event, _msgIndex } ]
     */
    function parseAllMeowFM(messages) {
      const results = [];
      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        if (!msg?.mes) continue;
        try {
          // 一条消息里可能有多个 <meow_FM> 块
          const blocks = msg.mes.match(/<meow_FM>[\s\S]*?<\/meow_FM>/gi) ?? [];
          for (const block of blocks) {
            const data = parseXMLTags(block, [
              'serial', 'time', 'scene', 'plot', 'seeds', 'event',
            ]);
            // 至少有 serial 才算有效
            if (data.serial) {
              results.push({ ...data, _msgIndex: i });
            }
          }
        } catch (e) {
          console.error(`[FREQ Parser] parseAllMeowFM 第 ${i} 条消息解析失败:`, e);
        }
      }
      return results;
    }

    /**
     * 从消息数组中提取最新的 <radio_show> 状态
     * @param {Array} messages
     * @returns {Object|null}  { BGM, STATUS, CHAR_WEAR } 或 null
     */
    function parseRadioShow(messages) {
      // 从最新消息往前找
      for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        if (!msg?.mes) continue;
        try {
          const m = msg.mes.match(/<radio_show>[\s\S]*?<\/radio_show>/i);
          if (!m) continue;
          const data = parseXMLTags(m[0], ['BGM', 'STATUS', 'CHAR_WEAR']);
          if (data.BGM || data.STATUS || data.CHAR_WEAR) return data;
        } catch (e) {
          console.error(`[FREQ Parser] parseRadioShow 第 ${i} 条消息解析失败:`, e);
        }
      }
      return null;
    }

    /**
     * 从单条消息中提取 thinking 内容
     * 优先级：msg.extra.reasoning > <thinking> 标签
     * @param {Object} msg  单条消息对象
     * @returns {string|null}
     */
    function parseThinking(msg) {
      if (!msg) return null;
      try {
        // Claude API 原生 thinking 字段
        if (msg.extra?.reasoning) return String(msg.extra.reasoning).trim();
        // <thinking> 标签
        if (msg.mes) {
          const m = msg.mes.match(/<thinking>([\s\S]*?)<\/thinking>/i);
          if (m) return m[1].trim();
        }
      } catch (e) {
        console.error('[FREQ Parser] parseThinking 失败:', e);
      }
      return null;
    }

    return {
      parseAllMeowFM,
      parseRadioShow,
      parseThinking,
    };
  })();

// ── BLOCK_03 END ──────────────────────────────────────────────


// ┌──────────────────────────────────────────────────────────────┐
// │ BLOCK_04  SubAPI — 副 API 调用 + 后台触发机制                 │
// │ 依赖：BLOCK_00, BLOCK_01, BLOCK_02, BLOCK_05(Notify)        │
// └──────────────────────────────────────────────────────────────┘

  const SubAPI = (() => {
    const TIMEOUT_MS   = 30000;   // 单次请求超时 30 秒
    const MAX_RETRIES  = 2;       // 最大重试次数
    const SILENCE_MS   = 3 * 60 * 60 * 1000;  // 静默期 3 小时

    let _queue         = Promise.resolve();   // 串行队列
    let _bgTimer       = null;                // 后台定时器句柄
    let _silenceUntil  = 0;                   // 静默期结束时间戳（ms）
    let _isSilent      = false;               // 是否在静默期

    /**
     * 核心调用方法
     * @param {string} systemPrompt
     * @param {string} userMessage
     * @param {Object} options  { maxTokens=500, temperature=0.9 }
     * @returns {Promise<string>}  AI 返回的原始文本
     */
    function call(systemPrompt, userMessage, options = {}) {
      // 串行队列：上一个请求完成后再发下一个
      _queue = _queue.then(() => _callWithRetry(systemPrompt, userMessage, options));
      return _queue;
    }

    /**
     * 带重试的调用
     */
    async function _callWithRetry(systemPrompt, userMessage, options, attempt = 0) {
      const settings = STBridge.getSettings();
      const { subApiUrl, subApiKey, subApiModel } = settings;

      if (!subApiUrl || !subApiKey || !subApiModel) {
        throw new Error('副 API 未配置，请在设置面板填写地址、密钥和模型');
      }

      const { maxTokens = 500, temperature = 0.9 } = options;

      const body = JSON.stringify({
        model: subApiModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userMessage  },
        ],
        max_tokens:  maxTokens,
        temperature: temperature,
        stream:      false,
      });

      const controller = new AbortController();
      const timeoutId  = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const resp = await fetch(`${subApiUrl.replace(/\/$/, '')}/v1/chat/completions`, {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${subApiKey}`,
          },
          body,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!resp.ok) {
          const errText = await resp.text().catch(() => resp.statusText);
          throw new Error(`HTTP ${resp.status}: ${errText}`);
        }

        const json = await resp.json();
        const content = json?.choices?.[0]?.message?.content;
        if (!content) throw new Error('API 返回内容为空');
        return content;

      } catch (e) {
        clearTimeout(timeoutId);

        if (attempt < MAX_RETRIES) {
          console.warn(`[FREQ SubAPI] 第 ${attempt + 1} 次失败，${attempt + 1}s 后重试:`, e.message);
          await delay((attempt + 1) * 1000);
          return _callWithRetry(systemPrompt, userMessage, options, attempt + 1);
        }
        throw e;
      }
    }

    /**
     * 获取可用模型列表（不消耗额度）
     * @returns {Promise<string[]>}  模型 ID 数组
     */
    async function fetchModels() {
      const settings = STBridge.getSettings();
      const { subApiUrl, subApiKey } = settings;

      if (!subApiUrl || !subApiKey) {
        throw new Error('请先填写副 API 地址和密钥');
      }

      const controller = new AbortController();
      const timeoutId  = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const resp = await fetch(`${subApiUrl.replace(/\/$/, '')}/v1/models`, {
          method:  'GET',
          headers: { 'Authorization': `Bearer ${subApiKey}` },
          signal:  controller.signal,
        });
        clearTimeout(timeoutId);

        if (!resp.ok) {
          const errText = await resp.text().catch(() => resp.statusText);
          throw new Error(`HTTP ${resp.status}: ${errText}`);
        }

        const json = await resp.json();
        // 兼容 OpenAI 格式 { data: [ { id } ] } 和直接数组
        const list = Array.isArray(json) ? json : (json.data ?? []);
        return list.map((m) => m.id ?? m).filter(Boolean);

      } catch (e) {
        clearTimeout(timeoutId);
        throw e;
      }
    }

    /**
     * 测试连接（发一条最小请求）
     * @returns {Promise<string>}  成功返回模型回复，失败 throw
     */
    async function testConnection() {
      return call('你是一个测试助手。', '请回复"连接成功"。', { maxTokens: 20 });
    }

    // ── 后台触发机制 ──────────────────────────────────────────

    /**
     * 启动后台定时触发
     * 根据配置的 bgTriggerInterval 决定间隔
     */
    function startBackgroundTimer() {
      stopBackgroundTimer();
      const settings = STBridge.getSettings();
      if (!settings.bgTriggerEnabled) return;

      const intervalMin = settings.bgTriggerInterval === 'custom'
        ? (settings.bgTriggerCustomMin ?? 60)
        : Number(settings.bgTriggerInterval ?? 60);

      const intervalMs = intervalMin * 60 * 1000;

      _bgTimer = setInterval(() => _triggerBackground(), intervalMs);
      console.log(`[FREQ SubAPI] 后台触发已启动，间隔 ${intervalMin} 分钟`);
    }

    /**
     * 停止后台定时触发
     */
    function stopBackgroundTimer() {
      if (_bgTimer) {
        clearInterval(_bgTimer);
        _bgTimer = null;
      }
    }

    /**
     * 后台触发：生成一条 AI 主动消息
     * 静默期内跳过
     */
    async function _triggerBackground() {
      if (_isSilent && Date.now() < _silenceUntil) {
        console.log('[FREQ SubAPI] 静默期内，跳过后台触发');
        return;
      }
      // 重置静默状态
      _isSilent = false;

      const settings = STBridge.getSettings();
      const charName  = STBridge.getCharacterName();
      const userName  = STBridge.getUserName();
      const messages  = STBridge.getChatMessages(10);
      const radioShow = Parser.parseRadioShow(messages);

      // 构建 Prompt
      const customPrompt = settings.prompts?.bgMessage;
      const systemPrompt = customPrompt || `你是 ${charName}。现在你主动给 ${userName} 发了一条消息。
根据当前剧情氛围，生成一条简短的主动消息（30-80字）。
${radioShow?.BGM ? `当前 BGM：${radioShow.BGM}` : ''}
${radioShow?.STATUS ? `当前状态：${radioShow.STATUS}` : ''}
输出格式：
<title>消息标题（10字以内）</title>
<body>消息正文</body>`;

      try {
        const raw  = await call(systemPrompt, '发送主动消息。', { maxTokens: 150 });
        const data = parseXMLTags(raw, ['title', 'body']);
        const title = data.title || `来自 ${charName} 的消息`;
        const body  = data.body  || raw.trim();

        // 通知 EventBus，Notify 模块和对应 App 都会监听
        EventBus.emit('bg-message', { title, body, charName, time: timeNow() });

        // 进入静默期
        _isSilent     = true;
        _silenceUntil = Date.now() + SILENCE_MS;
        console.log(`[FREQ SubAPI] 后台消息已发送，进入 3 小时静默期`);

      } catch (e) {
        console.error('[FREQ SubAPI] 后台触发失败:', e);
        // 触发失败不进入静默期，下次继续尝试
      }
    }

    return {
      call,
      fetchModels,
      testConnection,
      startBackgroundTimer,
      stopBackgroundTimer,
    };
  })();

// ── BLOCK_04 END ──────────────────────────────────────────────


// ┌──────────────────────────────────────────────────────────────┐
// │ BLOCK_05  Notify — 通知系统 + 错误日志                        │
// │ 依赖：BLOCK_00, BLOCK_01                                     │
// └──────────────────────────────────────────────────────────────┘

  const Notify = (() => {
    const _notifications = [];   // 所有通知
    const _errors        = [];   // 所有错误日志
    const MAX_NOTIFY     = 200;  // 最多保留通知条数
    const MAX_ERRORS     = 500;  // 最多保留错误条数

    /**
     * 添加一条通知
     * @param {string} appId   来源 App ID（如 'app03'）
     * @param {string} title   通知标题
     * @param {string} body    通知正文
     * @param {string} [type]  'info'(默认) | 'warn' | 'error' | 'system'
     */
    function add(appId, title, body, type = 'info') {
      const item = {
        id:    uid(),
        appId: appId ?? 'system',
        title: String(title ?? ''),
        body:  String(body  ?? ''),
        type,
        time:  timeNow(),
        read:  false,
      };
      _notifications.unshift(item);
      // 超出上限时裁剪尾部
      if (_notifications.length > MAX_NOTIFY) _notifications.length = MAX_NOTIFY;

      EventBus.emit('notify:new', item);
      return item;
    }

    /**
     * 添加错误通知（同时写入错误日志 + console.error）
     * @param {string} source  来源描述，如 'App03 朋友圈'
     * @param {Error|string} error
     */
    function error(source, error) {
      const errMsg   = error instanceof Error ? error.message : String(error);
      const errStack = error instanceof Error ? (error.stack ?? '') : '';

      // 写入错误日志
      const logItem = {
        id:      uid(),
        source:  String(source ?? '未知模块'),
        message: errMsg,
        stack:   errStack,
        time:    timeNow(),
      };
      _errors.unshift(logItem);
      if (_errors.length > MAX_ERRORS) _errors.length = MAX_ERRORS;

      // 同时在通知栏显示一条错误通知
      add('system', `⚠ ${source}`, errMsg, 'error');

      // 控制台输出完整堆栈
      console.error(`[FREQ ERROR] [${source}] ${errMsg}`, errStack || '');

      EventBus.emit('notify:error', logItem);
    }

    /**
     * 获取所有通知（已按时间倒序）
     * @returns {Array}
     */
    function getAll() {
      return _notifications;
    }

    /**
     * 获取所有错误日志（已按时间倒序）
     * @returns {Array}
     */
    function getErrors() {
      return _errors;
    }

    /**
     * 清空错误日志
     */
    function clearErrors() {
      _errors.length = 0;
      EventBus.emit('notify:errorsCleared', null);
    }

    /**
     * 获取未读通知总数
     * @returns {number}
     */
    function getUnreadCount() {
      return _notifications.filter((n) => !n.read).length;
    }

    /**
     * 标记某 App 的所有通知为已读
     * @param {string} appId  传 'all' 则全部标记
     */
    function markRead(appId) {
      for (const n of _notifications) {
        if (appId === 'all' || n.appId === appId) n.read = true;
      }
      EventBus.emit('notify:read', { appId });
    }

        /**
     * 获取某 App 的未读数
     * @param {string} appId
     * @returns {number}
     */
    function getUnreadByApp(appId) {
      return _notifications.filter((n) => !n.read && n.appId === appId).length;
    }

    /**
     * 获取某 App 的所有通知
     * @param {string} appId
     * @returns {Array}
     */
    function getByApp(appId) {
      return _notifications.filter((n) => n.appId === appId);
    }

    /**
     * 清空所有通知
     */
    function clearAll() {
      _notifications.length = 0;
      EventBus.emit('notify:cleared', null);
    }

    // 监听副API 后台消息，自动写入通知
    EventBus.on('bg-message', (data) => {
      add(
        'bg-message',
        data.title ?? '来自角色的消息',
        data.body  ?? '',
        'info'
      );
    });

    return {
      add,
      error,
      getAll,
      getErrors,
      clearErrors,
      getUnreadCount,
      markRead,
      getUnreadByApp,
      getByApp,
      clearAll,
    };
  })();

//── BLOCK_05 END ──────────────────────────────────────────────


// ┌──────────────────────────────────────────────────────────────┐
// │ BLOCK_06  Phone Shell —手机外壳 + App 注册 + 主屏幕         │
// │ 依赖：BLOCK_00, BLOCK_01, BLOCK_02, BLOCK_05│
// │⚠ 占位区块— 第二批开发                │
// └──────────────────────────────────────────────────────────────┘const PhoneShell = (() => {
    const _registeredApps = [];// 注册的 App 列表
    let _container= null;       // 手机主DOM 容器
    let _floatBtn   = null;       // 悬浮窗按钮
    let _currentApp = null;       // 当前打开的 App ID
    let _isOpen     = false;      // 手机是否打开

    /**
     * 注册一个 App
     * @param {Object} app  { id, name, icon, mount(container), unmount(), _badge }
     */
    function registerApp(app) {
      if (!app?.id) {
        console.warn('[FREQ PhoneShell] 注册 App 缺少 id，已跳过');
        return;
      }
      // 防重复注册
      if (_registeredApps.find((a) => a.id === app.id)) {
        console.warn(`[FREQ PhoneShell] App "${app.id}" 已存在，跳过重复注册`);
        return;
      }
      _registeredApps.push(app);}

    /** 获取所有已注册 App */
    function getApps() { return _registeredApps; }

    /** 获取当前打开的 App ID */
    function getCurrentApp() { return _currentApp; }

    /** 手机是否打开 */
    function isOpen() { return _isOpen; }

    /** 设置引用（第二批 mount 时调用） */
    function _setContainer(el)  { _container = el; }
    function _setFloatBtn(el)   { _floatBtn = el; }
    function _setOpen(val)      { _isOpen = val; }
    function _setCurrentApp(id) { _currentApp = id; }

    return {
      registerApp,
      getApps,
      getCurrentApp,
      isOpen,
      _registeredApps,
      _setContainer,
      _setFloatBtn,
      _setOpen,
      _setCurrentApp,// mount / unmount / openApp / closeApp / goHome
      // → 第二批实现
    };
  })();

// ── BLOCK_06 END (占位) ───────────────────────────────────────


// ┌──────────────────────────────────────────────────────────────┐
// │ BLOCK_07  Settings — 配置面板逻辑                             │
// │ 依赖：BLOCK_00~06│
// │ ⚠ 占位区块 — 第三批开发                                      │
// └──────────────────────────────────────────────────────────────┘

  // → 第三批实现

// ── BLOCK_07 END (占位) ───────────────────────────────────────


// ┌──────────────────────────────────────────────────────────────┐
// │ BLOCK_08 ~ BLOCK_24  App01 ~ App17│
// │ ⚠ 占位区块 — 第四批起逐个开发                                │
// └──────────────────────────────────────────────────────────────┘

  // → 第四批起逐个实现

// ── BLOCK_08~24 END (占位) ────────────────────────────────────


// ┌──────────────────────────────────────────────────────────────┐
// │ BLOCK_99  Init — jQuery 入口，挂载 DOM，绑定 ST 事件          │
// │ 依赖：所有区块                                                │
// └──────────────────────────────────────────────────────────────┘

  /**
   * 主初始化函数
   * ST 加载插件时会执行 IIFE，但 DOM 和 ST API 可能还没就绪
   * 所以用jQuery(async () => { ... }) 等待 DOM ready
   */
  jQuery(async () => {
    try {
      console.log('[FREQ TERMINAL] ▶ 插件初始化开始');

      // 1. 读取 / 初始化设置
      const settings = STBridge.getSettings();
      console.log('[FREQ TERMINAL]   设置已加载:', {
        enabled:settings.enabled,
        floatBtn:       settings.floatBtnEnabled,
        subApiUrl:      settings.subApiUrl ? '(已配置)' : '(未配置)',
        subApiModel:    settings.subApiModel || '(未选择)',
        bgTrigger:      settings.bgTriggerEnabled,});

      // 2. 如果插件被关闭，不执行任何挂载
      if (!settings.enabled) {
        console.log('[FREQ TERMINAL]   插件已关闭，跳过初始化');
        // 即使插件关闭，也加载配置面板（让用户可以重新开启）
        _loadSettingsPanel();
        return;
      }

      // 3. 加载配置面板（settings.html → ST扩展面板）
      _loadSettingsPanel();

      // 4. 挂载手机 DOM（第二批实现后这里会调用 PhoneShell.mount()）
      _mountPhoneShell();

      // 5. 启动后台触发定时器（如果配置了）
      if (settings.bgTriggerEnabled) {
        SubAPI.startBackgroundTimer();
      }

      // 6. 监听 ST 事件
      _bindSTEvents();

      console.log('[FREQ TERMINAL]✔ 插件初始化完成');

    } catch (e) {
      console.error('[FREQ TERMINAL] ✖ 插件初始化失败:', e);
      Notify.error('插件初始化', e);
    }
  });

  /**
   * 加载配置面板 HTML
   * ST 规范：用 fetch 加载 settings.html，追加到 #extensions_settings
   */
  async function _loadSettingsPanel() {
    try {
      const extensionPath = `scripts/extensions/third-party/${PLUGIN_ID}`;
      const resp = await fetch(`${extensionPath}/settings.html`);

      if (!resp.ok) {
        console.warn('[FREQ TERMINAL] settings.html 加载失败，状态:', resp.status);
        return;
      }

      const html = await resp.text();

      // 追加到 ST 的扩展设置区域
      const $settingsContainer = $('#extensions_settings');
      if ($settingsContainer.length === 0) {
        console.warn('[FREQ TERMINAL] 未找到 #extensions_settings 容器');
        return;
      }

      $settingsContainer.append(html);

      // 加载配置面板样式
      const $link = $('<link>', {
        rel:'stylesheet',
        type: 'text/css',
        href: `${extensionPath}/settings.css`,
      });
      $('head').append($link);

      // BLOCK_07 实现后这里会调用 Settings.init()
      console.log('[FREQ TERMINAL]   配置面板已加载');

    } catch (e) {
      console.error('[FREQ TERMINAL] 配置面板加载异常:', e);
    }
  }

  /**
   * 挂载手机外壳 DOM
   * 第二批实现（BLOCK_06完成后填充）
   */
  function _mountPhoneShell() {
    //── 占位：第二批实现 ──
    console.log('[FREQ TERMINAL]   手机外壳：等待第二批实现');}

  /**
   * 绑定 ST 聊天事件
   * 当新消息到达时，解析 XML 标签并通知各App
   */
  function _bindSTEvents() {
    try {
      const ctx = STBridge.getContext();

      // ST 事件：新消息接收完成
      if (ctx.eventSource) {
        // MESSAGE_RECEIVED — 角色消息生成完毕
        const EVENT_MSG_RECEIVED = ctx.event_types?.MESSAGE_RECEIVED
          ?? ctx.event_types?.MESSAGE_SWIPED
          ?? 'message_received';

        ctx.eventSource.on(EVENT_MSG_RECEIVED, () => {
          try {
            _onNewMessage();
          } catch (e) {Notify.error('消息处理', e);
          }
        });

        // CHAT_CHANGED — 切换对话/角色
        const EVENT_CHAT_CHANGED = ctx.event_types?.CHAT_CHANGED ?? 'chat_id_changed';
        ctx.eventSource.on(EVENT_CHAT_CHANGED, () => {
          try {
            _onChatChanged();
          } catch (e) {
            Notify.error('对话切换', e);
          }
        });

        console.log('[FREQ TERMINAL]   ST 事件已绑定');
      } else {
        console.warn('[FREQ TERMINAL]   未找到 eventSource，ST 事件绑定跳过');
      }
    } catch (e) {
      console.error('[FREQ TERMINAL]   ST 事件绑定失败:', e);
    }
  }

  /**
   * 新消息到达时的处理
   */
  function _onNewMessage() {
    const messages = STBridge.getChatMessages(5);
    if (messages.length === 0) return;

    const latestMsg = messages[messages.length - 1];

    // 解析最新消息中的 XML 标签
    const radioShow = Parser.parseRadioShow(messages);
    const thinking= Parser.parseThinking(latestMsg);

    // 通知各模块
    EventBus.emit('st:newMessage', {
      message:latestMsg,
      messages:  messages,
      radioShow: radioShow,
      thinking:  thinking,
    });
  }

  /**
   * 对话切换时的处理
   */
  function _onChatChanged() {
    EventBus.emit('st:chatChanged', {
      charName: STBridge.getCharacterName(),
      userName: STBridge.getUserName(),
    });
  }

// ── BLOCK_99 END──────────────────────────────────────────────

})();

