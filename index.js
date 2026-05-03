//╔══════════════════════════════════════════════════════════════╗
// ║  FREQ · TERMINAL v2.0 — 失真电台专属虚拟手机面板              ║
// ║  SillyTavern Extension║
// ╚══════════════════════════════════════════════════════════════╝

(function () {
  "use strict";

  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_00  常量+ 工具函数                              │
  // │ Prompt模板、parseXMLTags、escapeHtml、timeNow 等│
  // └──────────────────────────────────────────────────────┘

  const PLUGIN_ID = "freq-terminal";

  // ── 默认设置 ──
  const DEFAULT_SETTINGS = {
    enabled: true,
    showFloatingButton: true,

    // 副API
    subApi: {
      url: "",
      key: "",
      model: "",
      availableModels: [],
    },

    // 和风天气
    weatherApiKey: "",

    // 副 API 后台触发
    bgTrigger: {
      enabled: false,
      intervalMinutes: 60, // 30/ 60 / 自定义
      silentHours: 3,},

    // 各App 自定义 Prompt（key = appId，value = 用户自定义 prompt文本）
    // 为空字符串时使用内置默认 prompt
    appPrompts: {
      "radio-archive": "",
      "backstage-studio": "",
      "moments": "",
      "weather-station": "",
      "scan-freq": "",
      "cosmic-freq": "",
      "check-in": "",
      "schedule": "",
      "novel-channel": "",
      "world-map": "",
      "delivery": "",
      "forum": "",
      "time-capsule": "",
      "dream-recorder": "",
      "emotion-wave": "",
      "black-box": "",
      "signal-translator": "",
    },
  };

  // ── 内置默认 Prompt 模板 ──
  // 各 App 在自己的 BLOCK 里注册，这里只放公共模板
  const PROMPTS = {
    // 后台触发时的系统 prompt
    bgTriggerSystem: `你是一个虚拟手机里的 AI 助手。根据当前剧情上下文，以角色的口吻生成一条简短的主动消息（30-60字），像是角色在手机上给用户发的一条消息。不要加任何前缀或解释。
输出格式：
<app>最相关的App名称</app>
<sender>发送者名字</sender>
<message>消息内容</message>`,};

  /**
   * 从 AI 返回的原始文本中提取 XML 标签内容
   * @param {string} raw - AI 返回的原始文本
   * @param {string[]} tags - 要提取的标签名数组
   * @returns {Object} - { tagName: content | null }
   */
  function parseXMLTags(raw, tags) {
    const result = {};
    if (!raw || typeof raw !== "string") {
      for (const tag of tags) result[tag] = null;
      return result;
    }
    for (const tag of tags) {
      const m = raw.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
      result[tag] = m ? m[1].trim() : null;
    }
    return result;
  }

  /**
   * 转义 HTML 特殊字符，防止 XSS
   */
  function escapeHtml(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(String(str)));
    return div.innerHTML;
  }

  /**
   * 返回格式化的当前时间字符串 YYYY-MM-DD HH:mm:ss
   */
  function timeNow() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  /**
   * 安全截断文本
   */
  function truncate(str, max = 50) {
    if (!str) return "";
    const s = String(str);
    return s.length > max ? s.slice(0, max) + "…" : s;
  }

  /**
   * Promise 版 setTimeout
   */
  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 生成简单唯一 ID
   */
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  // ── BLOCK_00 END ──────────────────────────────────────

  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_01  EventBus — 模块间通信                       │
  // │ on / off / emit                                      │
  // └──────────────────────────────────────────────────────┘

  const EventBus = (() => {
    const _listeners = {};

    return {
      /**
       * 订阅事件
       * @param {string} event - 事件名
       * @param {Function} fn - 回调函数
       */
      on(event, fn) {
        if (!_listeners[event]) _listeners[event] = [];
        _listeners[event].push(fn);
      },

      /**
       * 取消订阅
       */
      off(event, fn) {
        if (!_listeners[event]) return;
        _listeners[event] = _listeners[event].filter((f) => f !== fn);
      },

      /**
       * 触发事件
       * @param {string} event - 事件名
       * @param {*} data - 传递的数据
       */
      emit(event, data) {
        if (!_listeners[event]) return;
        for (const fn of _listeners[event]) {
          try {
            fn(data);
          } catch (e) {
            console.error(`[FREQ] EventBus 回调异常 [${event}]:`, e);
          }
        }
      },
    };
  })();

  // ── BLOCK_01 END ──────────────────────────────────────

  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_02  ST Bridge — 读取 SillyTavern 数据           │
  // │ getContext / getChatMessages / getSettings 等         │
  // └──────────────────────────────────────────────────────┘

  const STBridge = (() => {
    /**
     * 获取 ST 上下文
     */
    function getContext() {
      try {
        return window.SillyTavern.getContext();
      } catch (e) {
        console.error("[FREQ] 无法获取 ST 上下文:", e);
        return null;
      }
    }

    /**
     * 获取最近n 条聊天消息
     * @param {number} n - 条数，默认 20
     * @returns {Array} 消息数组
     */
    function getChatMessages(n = 20) {
      const ctx = getContext();
      if (!ctx || !ctx.chat) return [];
      const chat = ctx.chat;
      return chat.slice(Math.max(0, chat.length - n));
    }

    /**
     * 读取插件设置，不存在则用默认值初始化
     * @returns {Object} 设置对象（引用）
     */
    function getSettings() {
      const ctx = getContext();
      if (!ctx) {
        console.warn("[FREQ] ST上下文不可用，返回默认设置副本");
        return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
      }

      if (!ctx.extensionSettings[PLUGIN_ID]) {
        ctx.extensionSettings[PLUGIN_ID] = JSON.parse(
          JSON.stringify(DEFAULT_SETTINGS)
        );
      }

      // 补全缺失的字段（版本升级时可能新增字段）
      const s = ctx.extensionSettings[PLUGIN_ID];
      _deepMergeDefaults(s, DEFAULT_SETTINGS);

      return s;
    }

    /**
     * 保存设置到 ST
     */
    function saveSettings() {
      try {
        const ctx = getContext();
        if (ctx && typeof ctx.saveSettingsDebounced === "function") {
          ctx.saveSettingsDebounced();
        }
      } catch (e) {
        console.error("[FREQ] 保存设置失败:", e);
      }
    }

    /**
     * 获取当前角色名
     */
    function getCharacterName() {
      const ctx = getContext();
      return ctx?.name2 || "未知角色";
    }

    /**
     * 获取用户名
     */
    function getUserName() {
      const ctx = getContext();
      return ctx?.name1 || "用户";
    }

    /**
     * 获取所有角色卡
     */
    function getAllCharacters() {
      const ctx = getContext();
      return ctx?.characters || [];
    }

    /**
     * 深度合并默认值（只补全缺失的 key，不覆盖已有值）
     */
    function _deepMergeDefaults(target, defaults) {
      for (const key of Object.keys(defaults)) {
        if (!(key in target)) {
          target[key] = JSON.parse(JSON.stringify(defaults[key]));
        } else if (
          typeof defaults[key] === "object" &&
          defaults[key] !== null &&
          !Array.isArray(defaults[key]) &&
          typeof target[key] === "object" &&
          target[key] !== null &&
          !Array.isArray(target[key])
        ) {
          _deepMergeDefaults(target[key], defaults[key]);
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

  // ── BLOCK_02 END ──────────────────────────────────────

  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_03  Parser — 解析预设 XML 标签                   │
  // │ meow_FM / radio_show / thinking                │
  // └──────────────────────────────────────────────────────┘

  const Parser = (() => {
    /**
     * 从消息数组中提取所有 <meow_FM> 标签数据
     * @param {Array} messages - 聊天消息数组
     * @returns {Array} 解析后的连线数据数组
     */
    function parseAllMeowFM(messages) {
      const results = [];
      if (!messages || !Array.isArray(messages)) return results;

      for (const msg of messages) {
        if (!msg || !msg.mes) continue;
        try {
          // 可能一条消息里有多个 <meow_FM>
          const regex = /<meow_FM>([\s\S]*?)<\/meow_FM>/g;
          let match;
          while ((match = regex.exec(msg.mes)) !== null) {
            const raw = match[1];
            const data = parseXMLTags(raw, [
              "serial",
              "time",
              "scene",
              "plot",
              "seeds",
              "event",
            ]);
            data._raw = raw;
            data._msgIndex = messages.indexOf(msg);
            results.push(data);
          }
        } catch (e) {
          console.error("[FREQ] 解析 meow_FM 失败:", e);
        }
      }
      return results;
    }

    /**
     * 提取最新的 <radio_show> 状态
     * @param {Array} messages - 聊天消息数组
     * @returns {Object|null} { BGM, STATUS, CHAR_WEAR } 或 null
     */
    function parseRadioShow(messages) {
      if (!messages || !Array.isArray(messages)) return null;

      // 从后往前找，取最新的
      for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        if (!msg || !msg.mes) continue;
        try {
          const m = msg.mes.match(/<radio_show>([\s\S]*?)<\/radio_show>/);
          if (m) {
            const raw = m[1];
            const data = parseXMLTags(raw, ["BGM", "STATUS", "CHAR_WEAR"]);
            if (data.BGM || data.STATUS || data.CHAR_WEAR) {
              return data;
            }
          }
        } catch (e) {
          console.error("[FREQ] 解析 radio_show 失败:", e);
        }
      }
      return null;
    }

    /**
     * 提取角色思考内容
     * 优先 <thinking> 标签，其次 msg.extra.reasoning
     * @param {Object} msg - 单条消息对象
     * @returns {string|null}
     */
    function parseThinking(msg) {
      if (!msg) return null;
      try {
        // 优先 <thinking> 标签
        if (msg.mes) {
          const m = msg.mes.match(/<thinking>([\s\S]*?)<\/thinking>/);
          if (m) return m[1].trim();
        }
        // 其次 Claude API 原生thinking
        if (msg.extra && msg.extra.reasoning) {
          return String(msg.extra.reasoning).trim();
        }
      } catch (e) {
        console.error("[FREQ] 解析 thinking 失败:", e);
      }
      return null;
    }

    return {
      parseAllMeowFM,
      parseRadioShow,
      parseThinking,
    };
  })();

  // ── BLOCK_03 END ──────────────────────────────────────

  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_04  SubAPI — 副 API 调用                        │
  // │带队列、重试、超时、后台定时触发                         │
  // └──────────────────────────────────────────────────────┘

  const SubAPI = (() => {
    // ── 队列控制 ──
    let _busy = false;
    const _queue = [];

    // ── 后台触发 ──
    let _bgTimer = null;
    let _silentUntil = 0; // 静默期结束时间戳

    /**
     * 核心调用方法
     * @param {string} systemPrompt - 系统提示词
     * @param {string} userMessage - 用户消息
     * @param {Object} options - { maxTokens: 300, temperature: 0.8 }
     * @returns {Promise<string>} AI 返回的原始文本
     */
    async function call(systemPrompt, userMessage, options = {}) {
      const settings = STBridge.getSettings();
      const { url, key, model } = settings.subApi;

      if (!url || !key || !model) {
        throw new Error("副 API 未配置完整（地址/密钥/模型）");
      }

      // 排队
      if (_busy) {
        return new Promise((resolve, reject) => {
          _queue.push({ systemPrompt, userMessage, options, resolve, reject });
        });
      }

      _busy = true;
      try {
        const result = await _doCall(
          url,
          key,
          model,
          systemPrompt,
          userMessage,
          options
        );
        return result;
      } finally {
        _busy = false;
        // 处理队列中的下一个
        if (_queue.length > 0) {
          const next = _queue.shift();
          call(next.systemPrompt, next.userMessage, next.options)
            .then(next.resolve)
            .catch(next.reject);
        }
      }
    }

    /**
     * 实际 HTTP 调用（带重试和超时）
     */
    async function _doCall(
      url,
      key,
      model,
      systemPrompt,
      userMessage,
      options,
      retryCount = 0
    ) {
      const maxRetries = 2;
      const timeout = 30000;
      const maxTokens = options.maxTokens || 300;
      const temperature = options.temperature ?? 0.8;

      // 规范化 URL
      const baseUrl = url.replace(/\/+$/, "");
      const endpoint = `${baseUrl}/v1/chat/completions`;

      const body = {
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: maxTokens,
        temperature: temperature,
      };

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);

      try {
        const resp = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timer);

        if (!resp.ok) {
          const errText = await resp.text().catch(() => "无法读取响应");
          throw new Error(`HTTP ${resp.status}: ${errText}`);
        }

        const json = await resp.json();

        //兼容不同 API 的返回格式
        const content =
          json.choices?.[0]?.message?.content ||
          json.choices?.[0]?.text ||
          json.output?.text ||
          "";

        if (!content) {
          throw new Error("API 返回内容为空");
        }

        return content.trim();
      } catch (e) {
        clearTimeout(timer);

        if (e.name === "AbortError") {
          e.message = `请求超时（${timeout / 1000}秒）`;
        }

        // 重试
        if (retryCount < maxRetries) {
          console.warn(
            `[FREQ] SubAPI 调用失败，第 ${retryCount + 1} 次重试:`,
            e.message
          );
          await delay(1000 * (retryCount + 1));
          return _doCall(
            url,
            key,
            model,
            systemPrompt,
            userMessage,
            options,
            retryCount + 1
          );
        }

        throw e;
      }
    }

    /**
     * 获取可用模型列表（不消耗额度）
     * @returns {Promise<string[]>} 模型ID 数组
     */
    async function fetchModels() {
      const settings = STBridge.getSettings();
      const { url, key } = settings.subApi;

      if (!url || !key) {
        throw new Error("请先填写副 API 地址和密钥");
      }

      const baseUrl = url.replace(/\/+$/, "");
      const endpoint = `${baseUrl}/v1/models`;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);

      try {
        const resp = await fetch(endpoint, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${key}`,
          },
          signal: controller.signal,
        });

        clearTimeout(timer);

        if (!resp.ok) {
          const errText = await resp.text().catch(() => "无法读取响应");
          throw new Error(`HTTP ${resp.status}: ${errText}`);
        }

        const json = await resp.json();

        // 兼容不同 API 的返回格式
        let models = [];
        if (Array.isArray(json.data)) {
          models = json.data.map((m) => m.id || m.name).filter(Boolean);
        } else if (Array.isArray(json)) {
          models = json.map((m) => m.id || m.name || m).filter(Boolean);
        }

        // 排序
        models.sort((a, b) => a.localeCompare(b));

        // 存入设置
        settings.subApi.availableModels = models;
        STBridge.saveSettings();

        return models;
      } catch (e) {
        clearTimeout(timer);
        if (e.name === "AbortError") {
          throw new Error("获取模型列表超时（15秒）");
        }
        throw e;
      }
    }

    /**
     * 测试连接
     * @returns {Promise<{success: boolean, message: string, models: string[]}>}
     */
    async function testConnection() {
      try {
        const models = await fetchModels();
        return {
          success: true,
          message: `连接成功，发现 ${models.length} 个可用模型`,
          models,
        };
      } catch (e) {
        return {
          success: false,
          message: `连接失败: ${e.message}`,
          models: [],
        };
      }
    }

    /**
     * 启动后台定时触发
     */
    function startBackgroundTimer() {
      stopBackgroundTimer();

      const settings = STBridge.getSettings();
      if (!settings.bgTrigger.enabled) return;

      const intervalMs = settings.bgTrigger.intervalMinutes * 60 * 1000;

      console.log(
        `[FREQ] 后台触发已启动，间隔 ${settings.bgTrigger.intervalMinutes} 分钟`
      );

      _bgTimer = setInterval(async () => {
        // 检查静默期
        if (Date.now() < _silentUntil) {
          console.log("[FREQ] 静默期中，跳过后台触发");
          return;
        }

        // 检查是否有角色在聊天
        const charName = STBridge.getCharacterName();
        if (charName === "未知角色") return;

        try {
          // 获取最近的聊天上下文
          const recentMsgs = STBridge.getChatMessages(5);
          const contextSummary = recentMsgs
            .map((m) => truncate(m.mes, 100))
            .join("\n");

          const settings = STBridge.getSettings();
          const systemPrompt =
            settings.appPrompts["bg-trigger"] || PROMPTS.bgTriggerSystem;

          const raw = await call(
            systemPrompt,
            `当前角色：${charName}\n最近对话摘要：\n${contextSummary}`,
            { maxTokens: 200, temperature: 0.9 }
          );

          const data = parseXMLTags(raw, ["app", "sender", "message"]);

          const notification = {
            app: data.app || "系统",
            sender: data.sender || charName,
            message: data.message || raw.trim(),
          };

          // 触发事件
          EventBus.emit("bg-message", notification);

          // 添加通知Notify.add(
            "bg-trigger",
            `${notification.sender}`,
            notification.message
          );

          // 进入静默期
          const silentMs = settings.bgTrigger.silentHours * 60 * 60 * 1000;
          _silentUntil = Date.now() + silentMs;

          console.log(
            `[FREQ] 后台消息已触发，静默至 ${new Date(_silentUntil).toLocaleTimeString()}`
          );
        } catch (e) {
          console.error("[FREQ] 后台触发失败:", e);
          Notify.error("后台触发", e);
        }
      }, intervalMs);
    }

    /**
     * 停止后台定时触发
     */
    function stopBackgroundTimer() {
      if (_bgTimer) {
        clearInterval(_bgTimer);
        _bgTimer = null;console.log("[FREQ] 后台触发已停止");
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

  // ── BLOCK_04 END ──────────────────────────────────────

  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_05  Notify — 通知系统 + 错误日志                 │
  // │ add / error / getAll / getErrors                │
  // └──────────────────────────────────────────────────────┘

  const Notify = (() => {
    const _notifications = []; // 所有通知
    const _errors = []; // 错误日志
    const _unreadCounts = {}; // { appId: count }
    const MAX_NOTIFICATIONS = 200;
    const MAX_ERRORS = 100;

    /**
     * 添加一条通知
     * @param {string} appId - 来源 App ID
     * @param {string} title - 通知标题
     * @param {string} body - 通知内容
     */
    function add(appId, title, body) {
      const notification = {
        id: uid(),
        appId: appId || "system",
        title: title || "通知",
        body: body || "",
        time: timeNow(),
        read: false,
      };

      _notifications.unshift(notification);

      // 限制数量
      if (_notifications.length > MAX_NOTIFICATIONS) {
        _notifications.length = MAX_NOTIFICATIONS;
      }

      // 更新未读计数
      if (!_unreadCounts[notification.appId]) {
        _unreadCounts[notification.appId] = 0;
      }
      _unreadCounts[notification.appId]++;

      // 触发事件
      EventBus.emit("notify-added", notification);EventBus.emit("notify-badge-update", getUnreadCount());

      console.log(
        `[FREQ] 通知: [${notification.appId}] ${notification.title}`
      );
    }

    /**
     * 添加错误日志
     * @param {string} source - 错误来源模块名
     * @param {Error|string} error - 错误对象或消息
     */
    function error(source, err) {
      const errObj =
        err instanceof Error
          ? err
          : new Error(typeof err === "string" ? err : JSON.stringify(err));

      const logEntry = {
        id: uid(),
        source: source || "未知模块",
        message: errObj.message || "未知错误",
        stack: errObj.stack || "",
        time: timeNow(),};

      _errors.unshift(logEntry);

      // 限制数量
      if (_errors.length > MAX_ERRORS) {
        _errors.length = MAX_ERRORS;
      }

      // 同时输出到控制台
      console.error(`[FREQ][${logEntry.source}] ${logEntry.message}`, errObj);

      // 触发事件
      EventBus.emit("error-logged", logEntry);
    }

    /**
     * 获取所有通知（按时间倒序）
     */
    function getAll() {
      return [..._notifications];
    }

    /**
     * 获取所有错误日志
     */
    function getErrors() {
      return [..._errors];
    }

    /**
     * 清空错误日志
     */
    function clearErrors() {
      _errors.length = 0;EventBus.emit("errors-cleared");
    }

    /**
     * 获取未读总数
     */
    function getUnreadCount() {
      let total = 0;
      for (const key of Object.keys(_unreadCounts)) {
        total += _unreadCounts[key];
      }
      return total;
    }

    /**
     * 获取某个 App 的未读数
     */
    function getAppUnreadCount(appId) {
      return _unreadCounts[appId] || 0;
    }

    /**
     * 标记某 App 通知已读
     */
    function markRead(appId) {
      for (const n of _notifications) {
        if (n.appId === appId && !n.read) {
          n.read = true;
        }
      }
      _unreadCounts[appId] = 0;
      EventBus.emit("notify-badge-update", getUnreadCount());
    }

    /**
     * 标记所有通知已读
     */
    function markAllRead() {
      for (const n of _notifications) {
        n.read = true;
      }
      for (const key of Object.keys(_unreadCounts)) {
        _unreadCounts[key] = 0;
      }
      EventBus.emit("notify-badge-update", 0);
    }

    return {
      add,
      error,
      getAll,
      getErrors,
      clearErrors,
      getUnreadCount,
      getAppUnreadCount,
      markRead,
      markAllRead,
    };
  })();

  // ── BLOCK_05 END ──────────────────────────────────────

  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_06  Phone Shell — 手机外壳（占位）               │
  // │ 第二批实现                                            │
  // └──────────────────────────────────────────────────────┘

  // （第二批开发）

  // ── BLOCK_06 END ──────────────────────────────────────

  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_07  Settings — 配置面板逻辑（占位）               │
  // │ 第三批实现                                            │
  // └──────────────────────────────────────────────────────┘

  // （第三批开发）

  // ── BLOCK_07 END ──────────────────────────────────────

  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_08 ~ BLOCK_24App01 ~17（占位）              │
  // │ 第四批起逐个实现                                       │
  // └──────────────────────────────────────────────────────┘

  // （第四批起逐个开发）

  //┌──────────────────────────────────────────────────────┐
  // │ BLOCK_99  Init — 初始化入口                │
  // │ jQuery 入口、挂载 DOM、绑定 ST 事件                │
  // └──────────────────────────────────────────────────────┘

  /**
   * App 注册表
   *各App 模块调用 registerApp(appObj) 注册自己
   */
  const _registeredApps = [];

  function registerApp(appObj) {
    if (!appObj || !appObj.id || !appObj.name) {
      console.error("[FREQ] registerApp: 无效的 App 对象", appObj);
      return;
    }
    // 防止重复注册
    if (_registeredApps.find((a) => a.id === appObj.id)) {
      console.warn(`[FREQ] App "${appObj.id}" 已注册，跳过`);
      return;
    }
    _registeredApps.push(appObj);
    console.log(`[FREQ] App已注册: ${appObj.icon} ${appObj.name}`);
  }

  /**
   * 初始化函数
   */
  async function init() {
    try {
      console.log("[FREQ] ═══ FREQ · TERMINAL v2.0 启动 ═══");

      // 1. 加载设置
      const settings = STBridge.getSettings();
      console.log("[FREQ] 设置已加载", {
        enabled: settings.enabled,
        showFloatingButton: settings.showFloatingButton,
        subApiConfigured: !!(settings.subApi.url && settings.subApi.key),
        bgTriggerEnabled: settings.bgTrigger.enabled,
      });

      // 2. 检查插件是否启用
      if (!settings.enabled) {
        console.log("[FREQ] 插件已禁用，跳过初始化");
        return;
      }

      // 3. 加载配置面板 HTML
      try {
        const settingsHtml = await $.get(
          `scripts/extensions/third-party/${PLUGIN_ID}/settings.html`
        );
        $("#extensions_settings2").append(settingsHtml);
        console.log("[FREQ] 配置面板 HTML 已加载");
      } catch (e) {
        console.error("[FREQ] 加载 settings.html 失败:", e);Notify.error("初始化", new Error("配置面板加载失败: " + e.message));
      }

      // 4. 加载配置面板样式
      try {
        const linkEl = document.createElement("link");
        linkEl.rel = "stylesheet";
        linkEl.href = `scripts/extensions/third-party/${PLUGIN_ID}/settings.css`;
        document.head.appendChild(linkEl);
        console.log("[FREQ] 配置面板样式已加载");
      } catch (e) {
        console.error("[FREQ] 加载 settings.css 失败:", e);
      }

      // 5. 初始化配置面板逻辑（BLOCK_07 实现后启用）
      // Settings.init();

      // 6.挂载手机外壳（BLOCK_06 实现后启用）
      // PhoneShell.mount();

      // 7. 注册所有 App 到手机主屏幕（BLOCK_06 实现后启用）
      // for (const app of _registeredApps) {
      //   PhoneShell.addApp(app);
      // }

      // 8. 启动后台触发
      if (
        settings.bgTrigger.enabled &&
        settings.subApi.url &&
        settings.subApi.key
      ) {
        SubAPI.startBackgroundTimer();}

      // 9. 监听 ST 事件
      _bindSTEvents();

      console.log(
        `[FREQ] 初始化完成，已注册 ${_registeredApps.length} 个 App`
      );
      Notify.add("system", "FREQ · TERMINAL", "系统启动完成 📡");
    } catch (e) {
      console.error("[FREQ] 初始化失败:", e);
      Notify.error("初始化", e);
    }
  }

  /**
   * 绑定 ST 事件监听
   */
  function _bindSTEvents() {
    const ctx = STBridge.getContext();
    if (!ctx) return;

    // 监听新消息
    if (ctx.eventSource) {
      // ST 的事件系统
      const EVENT_MESSAGE_RECEIVED = "message_received";
      const EVENT_CHAT_CHANGED = "chatLoaded";

      try {
        ctx.eventSource.on(EVENT_MESSAGE_RECEIVED, () => {
          EventBus.emit("st-message-received");
        });

        ctx.eventSource.on(EVENT_CHAT_CHANGED, () => {
          EventBus.emit("st-chat-changed");
        });

        console.log("[FREQ] ST 事件监听已绑定");
      } catch (e) {
        console.warn("[FREQ] 绑定 ST 事件失败:", e);
      }
    }
  }

  // ── jQuery 入口 ──
  jQuery(async () => {
    await init();
  });

  // ── 暴露到全局（调试用，生产环境可移除）──
  window.FREQ_TERMINAL = {
    EventBus,
    STBridge,
    Parser,
    SubAPI,
    Notify,
    registerApp,
    _registeredApps,
  };

  // ── BLOCK_99 END ──────────────────────────────────────
})();
