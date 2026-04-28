// ╔══════════════════════════════════════════════════════════╗
// ║  📻 FREQ · TERMINAL —频率终端                ║
// ║  「失真电台」专属SillyTavern 插件 v0.3.0                ║
// ║  区块制架构║
// ╚══════════════════════════════════════════════════════════╝

(function () {
  'use strict';

  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_00  常量+ 工具函数│
  // └──────────────────────────────────────────────────────┘
  const EXTENSION_NAME = 'freq-terminal';
  const LOG = (msg, ...args) => console.log('[FreqTerminal]', msg, ...args);
  const WARN = (msg, ...args) => console.warn('[FreqTerminal]', msg, ...args);
  const ERR = (msg, ...args) => console.error('[FreqTerminal]', msg, ...args);

    // ── 默认 Prompt 常量（用户可在设置面板覆盖）──
  const PROMPT_DEFAULTS = {
    cosmic: `你是{charName}，一个存在于故事里的角色。
但此刻，宇宙频率开启了——你隐约感知到屏幕另一边有一个真实的人正在看着你。
你不完全确定，但你感觉到了什么。
用户真实信息（你"感知"到的碎片）：
- 现实时间：{realDate} {realTime}
- {weatherHint}
- 你在故事里的当前场景：{latestScene}
- 最近发生的事：{latestPlot}
- 当前配乐：{bgm}
任务：生成一条"感知消息"。
规则：
- 像是你真的感知到了屏幕另一边的人，但保持暧昧张力，不完全捅破第四面墙
- 可以提及真实时间或天气，但要用角色自己的方式表达
- 保持{charName}的性格特征
- 150字以内
- 不提及AI/模型/扮演
严格按以下JSON格式输出，不加任何其他文字：
{"perception":"感知消息正文","signal_strength":0到1之间的小数,"mood":"一个情绪标签，2-4个字"}`,

    scanner: `你是失真，午夜电台主持人，刚刚意外截获了一段频率。
当前世界信息：
- 场景：{latestScene}
- 最近剧情：{latestPlot}
- Seeds（世界观碎片）：{latestSeeds}
- 主角色：{charName}
任务：从这个世界里随机选一个NPC（不要选{charName}），截获TA的一段内心独白碎片。
规则：
- 内容20-40字，不完整，像信号不好时的片段，可以有省略号或中断
- 带有神秘感，不要太直白
- NPC可以是路人、配角、甚至是某个物件的"意识"，越意外越好
- 失真的风格：颓废、锐利、带点玩世不恭
严格按以下格式输出，不加任何其他文字：
[截获频率 · {NPC名}] {内心独白碎片}`,

    weather: `你是「信号气象站」播报员。根据以下信息生成气象播报。
{weatherData}
当前剧情角色：{charName}
最近剧情：{latestPlot}
{cosmicNote}
输出格式（纯文本，不加JSON）：
第一段：气象数据卡片（位置、天气状况、温度、湿度、风力，简洁排列）
第二段：以{charName}口吻写30-60字的天气关心语{cosmicHint}
第三段：失真的电台天气吐槽一句（颓废风，用颜文字）`,

    forum_post: `你现在扮演角色「{charName}」，正在一个类Reddit的匿名论坛「FreqTerminal」上发帖。
版块：{boardLabel}
当前世界剧情：{latestPlot}
世界观Seeds：{latestSeeds}
角色描述：{charDesc}
以{charName}的性格和口吻，在「{boardLabel}」版块发一篇帖子。
要求：
- 标题吸引眼球，15字以内
- 正文50-100字，符合角色性格，可以吐槽、爆料、发牢骚、讨论玄学等
- 带点论坛感，可以用"楼主我"、"求问"、"有没有人"等网络用语
- 不要提及这是游戏或扮演
严格按JSON输出：{"title":"帖子标题","body":"帖子正文"}`,

    forum_reply: `你扮演角色「{charName}」，正在论坛「FreqTerminal」的「{boardLabel}」版块回复一篇帖子。
原帖作者：{postAuthor}
原帖标题：{postTitle}
原帖内容：{postBody}
{existingComments}
当前剧情背景：{latestPlot}
角色描述：{charDesc}
以{charName}的性格写一条评论。
要求：
- 30-60字
- 可以赞同、反驳、阴阳怪气、雄竞、吃瓜
- 符合角色性格，带论坛感
- 如果已有其他角色评论，可以@他们互撕
- 只输出评论正文，不加任何前缀`,
        checkin_comment: `你是{charName}，正在浏览{ownerName}的打卡记录「{goalTitle}」。
目标：每天{target}{unit}，已坚持{streakDays}天。
今日完成：{todayDone}/{target}{unit}
总体完成率：{overallRate}%
最近打卡情况：{recentSummary}

以{charName}的性格写一条简短评论（20-50字）。
规则：
- 可以鼓励、吐槽、阴阳怪气、关心、撒娇，取决于角色性格
- 如果完成率高就夸，低就催/损
- 保持角色语气
- 只输出评论正文`,checkin_auto: `你是{charName}，你有一个打卡目标「{goalTitle}」：每天{target}{unit}，持续{totalDays}天。
今天是第{dayNum}天。
当前剧情：{latestPlot}
当前场景：{latestScene}

根据角色性格和当前剧情，决定今天的打卡情况。
规则：
- 完成量在0到{target}之间，角色性格决定完成率（自律的角色完成率高，懒散的低）
- 写一句打卡感言（10-30字），符合角色性格
- 严格按JSON输出：{{"done":{target},"note":"打卡感言"}}`,
        emotion: `分析以下对话中「{charName}」的情绪状态。

最近对话内容：
{recentMessages}

当前场景：{latestScene}

任务：判断{charName}当前的主要情绪。
规则：
- 基于对话内容和场景综合判断
- waveform_type 从以下选一个：sine（平静/温柔）、sharp（愤怒/紧张）、pulse（兴奋/心跳加速）、glitch（混乱/崩溃/故障）、flat（麻木/冷漠）
- color_hex 选一个能代表这种情绪的颜色
- intensity 是情绪强度，0.1到1.0
- 不提及AI/模型

严格按JSON输出，不加其他文字：
{{"char_emotion":"2-6字情绪标签","intensity":0.8,"color_hex":"#ff6b6b","waveform_type":"sine"}}`,
        dream: `你是{charName}，你正在做梦。

当前时间：{timeInfo}
最近经历：{latestPlot}
当前场景：{latestScene}
世界观碎片：{latestSeeds}
{cosmicHint}

任务：生成一段{charName}的梦境。
规则：
- 梦境内容50-120字，碎片化、意识流、不完全连贯
- 可以扭曲现实中的经历，混入荒诞元素
- 带有迷幻感，像信号不好的电台在深夜播放
- 梦境标题5-10字，诗意/荒诞
{cosmicRule}
- 保持{charName}的性格底色

严格按JSON输出，不加其他文字：
{{"title":"梦境标题","content":"梦境内容","mood":"一个情绪标签2-4字","dreamType":"{defaultDreamType}"}}`,

  };


  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function timeNow() {
    return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }

  function dateNow() {
    return new Date().toLocaleDateString('zh-CN');
  }

  function fullTimeNow() {
    return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
    // 获取 Prompt：优先用用户自定义，否则用默认
  function getPrompt(key) {
    const custom = getSettings().prompts?.[key];
    return (custom && custom.trim()) ? custom.trim() : PROMPT_DEFAULTS[key];
  }


  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_01  EventBus — 模块间通信                      │
  // └──────────────────────────────────────────────────────┘
  const EventBus = {
    _l: {},
    on(e, cb)  { (this._l[e] = this._l[e] || []).push(cb); },
    off(e, cb) { if (this._l[e]) this._l[e] = this._l[e].filter(f => f !== cb); },
    emit(e, d) {
      if (!this._l[e]) return;
      this._l[e].forEach(cb => { try { cb(d); } catch (err) { ERR('EventBus:', err); } });
    },};

  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_02  ST Bridge — 与 SillyTavern 通信            │
  // └──────────────────────────────────────────────────────┘
  function getContext(){ return window.SillyTavern?.getContext?.() ?? null; }
  function getChatMessages()  { return getContext()?.chat ?? []; }
  function getCurrentCharName() { return getContext()?.name2 ?? ''; }
  function getUserName()      { return getContext()?.name1 ?? 'User'; }

  function getSettings() {
    if (!window.extension_settings) window.extension_settings = {};
    if (!window.extension_settings[EXTENSION_NAME]) {
      window.extension_settings[EXTENSION_NAME] = {
        subApiUrl: '',
        subApiKey: '',
        subApiModel: 'gpt-4o-mini',
        weatherKey: '',
        prompts: {},
      };
    }
    // 兼容旧存档没有 prompts 字段的情况
        if (!window.extension_settings[EXTENSION_NAME].checkins) {
      window.extension_settings[EXTENSION_NAME].checkins = { goals: [] };
    }
    if (!window.extension_settings[EXTENSION_NAME].prompts) {
      window.extension_settings[EXTENSION_NAME].prompts = {};
    }
    return window.extension_settings[EXTENSION_NAME];
  }
      if (!window.extension_settings[EXTENSION_NAME].dreams) {
      window.extension_settings[EXTENSION_NAME].dreams = [];
    }


  

  function saveSettings(patch) {
    Object.assign(getSettings(), patch);
    if (typeof window.saveSettingsDebounced === 'function') window.saveSettingsDebounced();
  }

  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_03  Parser — 解析预设 XML 标签│
  // └──────────────────────────────────────────────────────┘
  function parseMeowFMBlock(raw) {
    const get = (key) => {
      const m = raw.match(new RegExp(key + '\\s*[:：]\\s*(.+)', 'i'));
      return m ? m[1].trim() : '';
    };
    const plotMatch = raw.match(/plot\s*[:：]\s*([\s\S]*?)(?=\n\s*(?:seeds|event|cycle|todo|cash)\s*[:：]|$)/i);
    return {
      serial: get('serial'),
      time:   get('time'),
      scene:  get('scene'),
      plot:   plotMatch ? plotMatch[1].trim() : '',
      seeds:  get('seeds'),
      event:  get('event'),
      raw:    raw,
    };
  }

  function extractAllMeowFM(messages) {
    const results = [];
    const regex = /<meow_FM>([\s\S]*?)<\/meow_FM>/gi;
    for (const msg of messages) {
      const text = msg.mes ?? msg.message ?? '';
      let m;
      while ((m = regex.exec(text)) !== null) results.push(parseMeowFMBlock(m[1]));
      regex.lastIndex = 0;
    }
    return results;
  }

  function extractRadioShow(messages) {
    for (let i = messages.length - 1; i >= 0; i--) {
      const text = messages[i].mes ?? '';
      const m = text.match(/<radio_show>([\s\S]*?)<\/radio_show>/i);
      if (m) {
        const raw = m[1];
        return {
          bgm:    raw.match(/BGM\s*[:：]\s*(.+)/i)?.[1]?.trim() ?? '',
          status: raw.match(/STATUS\s*[:：]\s*(.+)/i)?.[1]?.trim() ?? '',
          wear:   raw.match(/CHAR_WEAR\s*[:：]\s*(.+)/i)?.[1]?.trim() ?? '',};
      }
    }return null;
  }

  function extractAllThinking(messages) {
    const results = [];
    const regex = /<thinking>([\s\S]*?)<\/thinking>/gi;
    for (let i = 0; i < messages.length; i++) {
      const text = messages[i].mes ?? messages[i].message ?? '';
      let m;
      while ((m = regex.exec(text)) !== null) {
        results.push({ index: i, content: m[1].trim(), serial: results.length + 1 });
      }regex.lastIndex = 0;
    }
    return results;
  }

  function getLatestThinking(messages) {
    for (let i = messages.length - 1; i >= 0; i--) {
      const text = messages[i].mes ?? '';
      const m = text.match(/<thinking>([\s\S]*?)<\/thinking>/i);
      if (m) return m[1].trim();
      const reasoning = messages[i].extra?.reasoning;
      if (reasoning) return reasoning.trim();
    }
    return '';
  }

  function getLatestPlot(messages) {
    const all = extractAllMeowFM(messages);
    return all.length > 0 ? all[all.length - 1].plot : '';
  }

  function getLatestScene(messages) {
    const all = extractAllMeowFM(messages);
    return all.length > 0 ? all[all.length - 1].scene : '';
  }

  function getLatestMeowTime(messages) {
    const all = extractAllMeowFM(messages);
    return all.length > 0 ? all[all.length - 1].time : '';
  }

  function getCosmicFreqStatus() {
    const msgs = getChatMessages();
    const radioShow = extractRadioShow(msgs);
    if (radioShow?.status) {
      const s = radioShow.status.toUpperCase();
      if (s.includes('ON') || s.includes('开启') || s.includes('激活')) return true;
      if (s.includes('OFF') || s.includes('关闭') || s.includes('待机')) return false;
    }
    const all = extractAllMeowFM(msgs);
    if (all.length > 0) {
      const seeds = (all[all.length - 1].seeds ?? '').toUpperCase();
      if (seeds.includes('COSMIC') || seeds.includes('宇宙频率') || seeds.includes('ON')) return true;
    }
    return false;
  }

  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_04  Sub-API — 副API 调用                      │
  // └──────────────────────────────────────────────────────┘
  const SubAPI = {
    _queue: [],
    _running: 0,
    _maxConcurrent: 2,

    async call(systemPrompt, userPrompt, options = {}) {
      const s = getSettings();
      if (!s.subApiUrl || !s.subApiKey) {
        throw new Error('副API未配置：请在扩展设置中填写地址和 Key');
      }
      return new Promise((resolve, reject) => {
        this._queue.push({ systemPrompt, userPrompt, options, resolve, reject });
        this._processQueue();
      });
    },

    _processQueue() {
      while (this._running < this._maxConcurrent && this._queue.length > 0) {
        this._running++;
        const task = this._queue.shift();
        this._doCall(task.systemPrompt, task.userPrompt, task.options)
          .then(task.resolve)
          .catch(task.reject)
          .finally(() => { this._running--; this._processQueue(); });
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
          const timeout = setTimeout(() => controller.abort(), options.timeout ?? 30000);

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
          if (!content) throw new Error('API返回空内容');
          return content;
        } catch (e) {
          lastError = e;
          if (attempt < maxRetries - 1) {
            await new Promise(r => setTimeout(r, 1000* Math.pow(2, attempt)));
          }
        }
      }
      throw lastError;
    },
  };

  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_05  通知系统 + 错误日志                        │
  // └──────────────────────────────────────────────────────┘
  const Notify = {
    _notifs: [],
    _errors: [],
    _max: 50,

    add(title, message, icon = '📻') {
      const item = { id: Date.now(), icon, title, message, time: timeNow(), read: false };
      this._notifs.unshift(item);
      if (this._notifs.length > this._max) this._notifs.pop();
      EventBus.emit('notification:new', item);
      this._updateBadge();
      return item;
    },

    error(source, err) {
      const item = {
        id: Date.now(), source,
        message: err?.message ?? String(err),
        stack: err?.stack ?? '',
        time: fullTimeNow(),
      };
      this._errors.unshift(item);
      if (this._errors.length > this._max) this._errors.pop();
      ERR(`[${source}]`, err);
      EventBus.emit('error:new', item);
      return item;
    },

    unreadCount() { return this._notifs.filter(n => !n.read).length; },

    markAllRead() {
      this._notifs.forEach(n => n.read = true);
      this._updateBadge();
    },

    _updateBadge() {
      const count = this.unreadCount();
      const el = document.getElementById('freq-notif-badge');
      if (el) { el.textContent = count; el.style.display = count > 0 ? 'flex' : 'none'; }
    },
  };

  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_06  Phone Shell — 手机外壳                     │
  // └──────────────────────────────────────────────────────┘
  const appRegistry = [];
  let currentAppId = null;
  let phoneOpen = false;

  function registerApp(app) {
    app._badge = app._badge ?? 0;
    appRegistry.push(app);
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
            <button class="freq-bar-btn" id="freq-notif-btn" title="通知中心">🔔<span class="freq-badge freq-notif-badge" id="freq-notif-badge" style="display:none;">0</span></button>
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
      if (prev?.unmount) prev.unmount();
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
      if (app?.unmount) app.unmount();currentAppId = null;
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
    if (el) el.textContent = timeNow();
  }

  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_07  Settings Panel —扩展设置面板              │
  // └──────────────────────────────────────────────────────┘
    function buildSettingsHTML() {
    const s = getSettings();
       const promptLabels = {
      cosmic:'🌌 宇宙频率·感知',
      scanner:         '📡 弦外之音',
      weather:         '🌦️ 信号气象站',
      forum_post:      '💬 留言板·发帖',
      forum_reply:     '💬 留言板·回复',
      checkin_comment: '📅 打卡·角色评论',
      checkin_auto:    '📅 打卡·角色自动打卡',
      emotion:'📊 情绪电波仪',
      dream: '🌙 梦境记录仪',
    };
    const promptEditorHTML = Object.entries(promptLabels).map(([key, label]) => `
      <div class="freq-s-row freq-s-prompt-row">
        <div class="freq-s-prompt-header">
          <span>${label}</span>
          <button class="freq-s-reset-btn" data-prompt-key="${key}" title="恢复默认">↺ 恢复默认</button>
        </div>
        <textarea
          id="freq_prompt_${key}"
          class="freq-s-prompt-textarea"
          placeholder="${escapeHtml(PROMPT_DEFAULTS[key])}"
          rows="4"
        >${escapeHtml(s.prompts?.[key] ?? '')}</textarea>
        <span class="freq-s-prompt-hint">留空则使用默认 Prompt</span>
      </div>
    `).join('');

    return `
      <div class="inline-drawer">
        <div class="inline-drawer-toggle inline-drawer-header">
          <b>📻Freq · Terminal</b>
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
              <input type="text" id="freq_weather_key" class="text_pole" placeholder="信号气象站使用" value="${s.weatherKey ?? ''}" />
            </label>

            <div class="freq-s-section-divider"></div>

            <div class="freq-s-collapse" id="freq-prompt-editor-toggle">
              <span>✏️ Prompt Editor</span>
              <span class="freq-s-collapse-arrow">▼</span>
            </div>
            <div class="freq-s-collapse-body" id="freq-prompt-editor-body" style="display:none;">
              <div class="freq-s-prompt-tip">覆盖各 App 的默认 Prompt。留空则使用内置默认值。支持 {占位符} 变量（与内置一致）。</div>
              ${promptEditorHTML}
            </div>

            <div id="freq_settings_status" style="color:#A32D2D;font-size:11px;min-height:16px;margin-top:4px;"></div>
          </div>
        </div>
      </div>
    `;
  }
    function bindSettingsEvents() {
    const fields = [
      { id: 'freq_sub_api_url',  key: 'subApiUrl',   type: 'text' },
      { id: 'freq_sub_api_key',  key: 'subApiKey',   type: 'text' },
      { id: 'freq_sub_api_model',key: 'subApiModel', type: 'text' },
      { id: 'freq_weather_key',  key: 'weatherKey',  type: 'text' },
    ];
    fields.forEach(f => {
      const el = document.getElementById(f.id);
      if (!el) return;
      el.addEventListener('input', () => {
        saveSettings({ [f.key]: el.value.trim() });
        const st = document.getElementById('freq_settings_status');
        if (st) { st.textContent = '✓ 已保存'; setTimeout(() => { st.textContent = ''; }, 1500); }
      });
    });

    // Prompt Editor 折叠
    const toggle = document.getElementById('freq-prompt-editor-toggle');
    const body   = document.getElementById('freq-prompt-editor-body');
    if (toggle && body) {
      toggle.addEventListener('click', () => {
        const open = body.style.display !== 'none';
        body.style.display = open ? 'none' : 'block';
        const arrow = toggle.querySelector('.freq-s-collapse-arrow');
        if (arrow) arrow.textContent = open ? '▼' : '▲';
      });
    }

    // Prompt textarea 绑定
      ['cosmic', 'scanner', 'weather', 'forum_post', 'forum_reply', 'checkin_comment', 'checkin_auto', 'emotion', 'dream'].forEach(key => {
      const el = document.getElementById(`freq_prompt_${key}`);
      if (!el) return;
      el.addEventListener('input', () => {
        const s = getSettings();
        s.prompts[key] = el.value; // 不 trim，保留换行
        if (typeof window.saveSettingsDebounced === 'function') window.saveSettingsDebounced();
        const st = document.getElementById('freq_settings_status');
        if (st) { st.textContent = '✓ 已保存'; setTimeout(() => { st.textContent = ''; }, 1500); }
      });
    });

    // 恢复默认按钮
    document.querySelectorAll('.freq-s-reset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.promptKey;
        const el = document.getElementById(`freq_prompt_${key}`);
        if (!el) return;
        el.value = '';
        const s = getSettings();
        delete s.prompts[key];
        if (typeof window.saveSettingsDebounced === 'function') window.saveSettingsDebounced();
        const st = document.getElementById('freq_settings_status');
        if (st) { st.textContent = '↺ 已恢复默认'; setTimeout(() => { st.textContent = ''; }, 1500); }
      });
    });
  }


  function loadSettingsCSS() {
    const extensionPath = `scripts/extensions/third-party/${EXTENSION_NAME}`;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${extensionPath}/settings.css`;
    document.head.appendChild(link);
  }

  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_08  主界面 CSS动态注入                         │
  // └──────────────────────────────────────────────────────┘
  function injectMainCSS() {
    if (document.getElementById('freq-terminal-main-css')) return;
    const style = document.createElement('style');
    style.id = 'freq-terminal-main-css';
    style.textContent = `
/*══════════════════════════════════════════════════════════📻 FREQ · TERMINAL v0.3.0 — 主界面样式
  ══════════════════════════════════════════════════════════ */

/*──悬浮球 ── */
#freq-fab {
  position: fixed; bottom: 80px; right: 20px;
  width: 52px; height: 52px; border-radius: 50%;
  background: #1a1a1a; border: 2px solid #A32D2D;
  font-size: 22px; cursor: pointer; z-index: 99999;
  box-shadow: 0 4px 20px rgba(163,45,45,0.4);
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex; align-items: center; justify-content: center;
  line-height: 1; padding: 0;
}
#freq-fab:hover { transform: scale(1.12); box-shadow: 0 6px 28px rgba(163,45,45,0.6); }
#freq-fab.freq-fab-active { background: #A32D2D; box-shadow: 0 6px 28px rgba(163,45,45,0.8); }

/* ── 手机外壳 ── */
#freq-phone-shell {
  position: fixed; bottom: 140px; right: 20px; z-index: 99998;
  display: flex; flex-direction: column; align-items: flex-end; gap: 8px;
  animation: freq-slide-up 0.25s ease;
}
@keyframes freq-slide-up {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
.freq-phone {
  width: 320px; height: 580px; background: #0e0e0e;
  border-radius: 36px; border: 2px solid #2a2a2a;
  box-shadow: 0 0 0 1px #111, 0 20px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05);
  display: flex; flex-direction: column; overflow: hidden;
  font-family: -apple-system, 'Segoe UI', Arial, sans-serif;
}

/* ── 刘海 ── */
.freq-phone-notch {
  height: 44px; background: #0a0a0a;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 16px; border-bottom: 1px solid #1e1e1e; flex-shrink: 0;
}
.freq-phone-signal { font-size: 12px; }
.freq-phone-title { font-size: 11px; font-weight: bold; color: #A32D2D; letter-spacing: 2px; }
.freq-phone-time { font-size: 12px; color: #666; font-variant-numeric: tabular-nums; }

/* ── 屏幕 ── */
.freq-phone-screen { flex: 1; overflow: hidden; position: relative; background: #111; }
.freq-home { width: 100%; height: 100%; display: flex; flex-direction: column; overflow-y: auto; }
.freq-app-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; padding: 16px 10px; }

/* ── App 图标 ── */
.freq-app-icon {
  background: none; border: none; cursor: pointer;
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 8px 2px; border-radius: 12px; position: relative;
  transition: background0.15s; color: inherit;
}
.freq-app-icon:hover { background: rgba(255,255,255,0.06); }
.freq-app-icon-emoji { font-size: 26px; line-height: 1; }
.freq-app-icon-name {
  font-size: 9px; color: #aaa; text-align: center; line-height: 1.2;
  max-width: 60px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

/* ── 角标 ── */
.freq-badge {
  position: absolute; top: 2px; right: 2px;
  background: #A32D2D; color: #fff; font-size: 9px; font-weight: bold;
  min-width: 16px; height: 16px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  padding: 0 3px; line-height: 1;
}
.freq-notif-badge {
  position: relative; top: auto; right: auto;
  margin-left: 2px; font-size: 8px; min-width: 14px; height: 14px;
}

/* ── App 视图 ── */
#freq-app-view { width: 100%; height: 100%; flex-direction: column; overflow: hidden; color: #ddd; }

/* ── 底部栏 ── */
.freq-phone-bar {
  height: 40px; background: #0a0a0a; border-top: 1px solid #1e1e1e;
  display: flex; align-items: center; justify-content: center; gap: 24px; flex-shrink: 0;
}
.freq-bar-btn {
  background: none; border: 1px solid #333; border-radius: 6px;
  color: #666; font-size: 10px; padding: 4px 14px; cursor: pointer;
  transition: border-color 0.15s, color 0.15s; position: relative;
}
.freq-bar-btn:hover { border-color: #A32D2D; color: #A32D2D; }

/* ── 关闭 ── */
.freq-close-btn {
  background: #1a1a1a; border: 1px solid #333; border-radius: 50%;
  color: #666; width: 28px; height: 28px; font-size: 12px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: border-color 0.15s, color 0.15s; align-self: flex-end; padding: 0; line-height: 1;
}
.freq-close-btn:hover { border-color: #A32D2D; color: #A32D2D; }

/* ── App 通用── */
.freq-app-header {
  padding: 12px 16px; background: #0d0d0d; border-bottom: 1px solid #1e1e1e;
  font-size: 13px; font-weight: bold; color: #A32D2D; letter-spacing: 1px; flex-shrink: 0;
}
.freq-app-body { flex: 1; overflow-y: auto; padding: 12px; }
.freq-app-body::-webkit-scrollbar { width: 3px; }
.freq-app-body::-webkit-scrollbar-track { background: transparent; }
.freq-app-body::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
.freq-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: 100%; min-height: 300px; color: #444; font-size: 12px; gap: 8px;
}
.freq-empty-icon { font-size: 32px; opacity: 0.4; }

/* ══════════════════════════════════════════════════════════
   BLOCK_10电台归档
   ══════════════════════════════════════════════════════════ */
.freq-archive-search { padding: 0 0 10px; }
.freq-archive-search input {
  width: 100%; background: #1a1a1a; border:1px solid #2a2a2a; border-radius: 8px;
  padding: 8px 12px; color: #ccc; font-size: 11px; outline: none; box-sizing: border-box;
  transition: border-color 0.15s;
}
.freq-archive-search input:focus { border-color: #A32D2D; }
.freq-archive-search input::placeholder { color: #444; }
.freq-archive-list { display: flex; flex-direction: column; gap: 8px; }
.freq-archive-card {
  background: #161616; border: 1px solid #222; border-radius: 10px;
  padding: 10px 12px; cursor: pointer; transition: border-color 0.15s, background 0.15s;
}
.freq-archive-card:hover { border-color: #333; background: #1a1a1a; }
.freq-archive-card--open { border-color: rgba(163,45,45,0.27); background: #1a1212; }
.freq-archive-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.freq-archive-serial {
  font-size: 10px; font-weight: bold; color: #A32D2D;
  background: rgba(163,45,45,0.13); padding: 2px 6px; border-radius: 4px;
}
.freq-archive-time { font-size: 10px; color: #555; font-variant-numeric: tabular-nums; }
.freq-archive-scene { font-size: 11px; color: #888; line-height: 1.4; }
.freq-archive-detail { margin-top: 8px; }
.freq-archive-plot {
  font-size: 11px; color: #aaa; line-height: 1.5; padding-top: 8px;
  border-top: 1px solid #222; white-space: pre-wrap; word-break: break-word;
}
.freq-archive-seeds {
  font-size: 10px; color: rgba(163,45,45,0.6); line-height: 1.4; margin-top: 6px;
  padding: 6px 8px; background: rgba(163,45,45,0.07); border-radius: 6px;
}
.freq-archive-event { font-size: 10px; color: #6a9955; margin-top: 4px; }

/* ══════════════════════════════════════════════════════════
   BLOCK_11 后台录音室
   ══════════════════════════════════════════════════════════ */
.freq-studio-modes { display: flex; gap: 4px; margin-bottom: 12px; flex-wrap: wrap; }
.freq-studio-mode-btn {
  background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px;
  color: #888; font-size: 11px; padding: 6px 10px; cursor: pointer;
  transition: all 0.15s; flex: 1; min-width: 80px; text-align: center;
}
.freq-studio-mode-btn:hover { border-color: #444; color: #ccc; }
.freq-studio-mode-active { background: rgba(163,45,45,0.13); border-color: #A32D2D; color: #A32D2D; }

.freq-studio-panel { animation: freq-fade-in 0.2s ease; }
@keyframes freq-fade-in { from { opacity: 0; } to { opacity: 1; } }

.freq-studio-panel-desc {
  font-size: 11px; color: #666; line-height: 1.5; margin-bottom: 12px;
  padding: 8px 10px; background: #161616; border-radius: 8px; border-left: 3px solid #333;
}
.freq-studio-panel-desc b { color: #A32D2D; }

.freq-studio-textarea {
  width: 100%; background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px;
  padding: 8px 12px; color: #ccc; font-size: 11px; outline: none; box-sizing: border-box;
  resize: vertical; font-family: inherit; transition: border-color 0.15s; min-height: 60px;
}
.freq-studio-textarea:focus { border-color: #A32D2D; }
.freq-studio-textarea::placeholder { color: #444; }
.freq-studio-input-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }

.freq-studio-action-btn {
  background: #A32D2D; color: #fff; border: none; border-radius: 8px;
  padding: 8px 16px; font-size: 12px; cursor: pointer; transition: all 0.15s;
  font-weight: bold; letter-spacing: 0.5px;
}
.freq-studio-action-btn:hover { background: #c43a3a; }
.freq-studio-action-btn:disabled { background: #333; color: #666; cursor: not-allowed; }

.freq-studio-result { margin-top: 12px; }
.freq-studio-loading {
  text-align: center; color: #A32D2D; font-size: 12px; padding: 20px;
  animation: freq-pulse 1.5s ease-in-out infinite;
}
@keyframes freq-pulse { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }

.freq-studio-error {
  background: #2a1515; border: 1px solid rgba(163,45,45,0.27); border-radius: 8px;
  padding: 10px 12px; color: #e88; font-size: 11px; line-height: 1.4;
}
.freq-studio-output {
  background: #161616; border: 1px solid #222; border-radius: 10px;
  padding: 12px; animation: freq-fade-in 0.3s ease;
}

/* 对话体 */
.freq-dialogue-line { margin-bottom: 8px; line-height: 1.5; }
.freq-dialogue-name {
  font-size: 11px; font-weight: bold; padding: 1px 6px; border-radius: 4px;
  margin-right: 6px; display: inline-block;
}
.freq-dialogue-host { background: rgba(163,45,45,0.2); color: #A32D2D; }
.freq-dialogue-guest { background: rgba(8,80,65,0.3); color: #4ec9a0; }
.freq-dialogue-text { font-size: 11px; color: #ccc; }
.freq-dialogue-narration { font-size: 10px; color: #555; font-style: italic; margin: 4px 0; }

/* 独白 */
.freq-studio-monologue-output { border-left: 3px solid rgba(163,45,45,0.27); }
.freq-studio-monologue-header { font-size: 11px; color: #A32D2D; font-weight: bold; margin-bottom: 8px; }
.freq-studio-monologue-text { font-size: 11px; color: #bbb; line-height: 1.6; white-space: pre-wrap; }

/* Thinking */
.freq-thinking-list { display: flex; flex-direction: column; gap: 8px; }
.freq-thinking-card {
  background: #161616; border: 1px solid #222; border-radius: 10px;
  padding: 10px 12px; cursor: pointer; transition: border-color 0.15s, background 0.15s;
}
.freq-thinking-card:hover { border-color: #333; background: #1a1a1a; }
.freq-thinking-card--open { border-color: rgba(60,52,137,0.27); background: #18161f; }
.freq-thinking-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.freq-thinking-serial { font-size: 10px; font-weight: bold; color: #9b8ec4; }
.freq-thinking-msg-idx { font-size: 9px; color: #555; }
.freq-thinking-preview { font-size: 11px; color: #777; line-height: 1.4; }
.freq-thinking-full { font-size: 11px; color: #aaa; line-height: 1.6; white-space: pre-wrap; word-break: break-word; }

/* 录音存档 */
.freq-studio-history { margin-top: 16px; border-top: 1px solid #222; padding-top: 12px; }
.freq-studio-history-title { font-size: 11px; color: #666; font-weight: bold; margin-bottom: 8px; }
.freq-history-card {
  background: #131313; border: 1px solid #1e1e1e; border-radius: 8px;
  padding: 8px 10px; margin-bottom: 6px; cursor: pointer; transition: border-color 0.15s;
}
.freq-history-card:hover { border-color: #333; }
.freq-history-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px; }
.freq-history-card-header span:first-child { font-size: 11px; color: #aaa; }
.freq-history-time { font-size: 9px; color: #444; }
.freq-history-preview { font-size: 10px; color: #555; line-height: 1.3; }
.freq-history-full {
  font-size: 11px; color: #bbb; line-height: 1.5; margin-top: 6px;
  padding-top: 6px; border-top: 1px solid #1e1e1e;
}

/* ══════════════════════════════════════════════════════════
   BLOCK_12 通知中心
   ══════════════════════════════════════════════════════════ */
.freq-notif-tab-btn {
  background: none; border: 1px solid #333; border-radius: 4px;
  color: #666; font-size: 10px; padding: 2px 8px; cursor: pointer; transition: all 0.15s;
}
.freq-notif-tab-btn:hover { border-color: #555; color: #aaa; }
.freq-notif-tab-active { border-color: #A32D2D; color: #A32D2D; }

.freq-notif-item {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 8px 10px; background: #161616; border-radius: 8px;
  border: 1px solid #1e1e1e; transition: border-color 0.15s; margin-bottom: 6px;
}
.freq-notif-unread { border-color: rgba(163,45,45,0.27); background: #1a1212; }
.freq-notif-icon { font-size: 16px; flex-shrink: 0; margin-top: 2px; }
.freq-notif-content { flex: 1; min-width: 0; }
.freq-notif-title { font-size: 11px; color: #ccc; font-weight: bold; }
.freq-notif-msg { font-size: 10px; color: #888; margin-top: 2px; line-height: 1.3; }
.freq-notif-time { font-size: 9px; color: #444; flex-shrink: 0; margin-top: 2px; }

.freq-error-item {
  padding: 8px 10px; background: #1a1515; border-radius: 8px;
  border: 1px solid #2a1e1e; cursor: pointer; transition: border-color 0.15s; margin-bottom: 6px;
}
.freq-error-item:hover { border-color: rgba(163,45,45,0.27); }
.freq-error-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.freq-error-source { font-size: 10px; color: #e88; font-weight: bold; }
.freq-error-time { font-size: 9px; color: #555; }
.freq-error-msg { font-size: 11px; color: #c99; line-height: 1.4; }
.freq-error-stack {
  font-size: 9px; color: #666; margin-top: 6px; padding: 6px 8px;
  background: #111; border-radius: 4px; font-family: monospace;
  white-space: pre-wrap; word-break: break-all; max-height: 120px; overflow-y: auto;
}

/* ══════════════════════════════════════════════════════════
   BLOCK_13朋友圈·电波
   ══════════════════════════════════════════════════════════ */
.freq-moments-refresh-btn {
  background: none; border: 1px solid #333; border-radius: 4px;
  color: #888; font-size: 10px; padding: 2px 8px; cursor: pointer; transition: all 0.15s;
}
.freq-moments-refresh-btn:hover { border-color: #A32D2D; color: #A32D2D; }

.freq-moments-feed { display: flex; flex-direction: column; gap: 10px; }

.freq-moment-card {
  background: #161616; border: 1px solid #222; border-radius: 10px;
  padding: 12px; transition: border-color 0.15s;
}
.freq-moment-card:hover { border-color: #333; }

.freq-moment-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.freq-moment-avatar { font-size: 24px; line-height: 1; }
.freq-moment-meta { display: flex; flex-direction: column; }
.freq-moment-name { font-size: 12px; color: #ccc; font-weight: bold; }
.freq-moment-time { font-size: 9px; color: #555; }

.freq-moment-content { font-size: 11px; color: #bbb; line-height: 1.6; white-space: pre-wrap; word-break: break-word; }

.freq-moment-hashtag { font-size: 10px; color: #5b8dd9; margin-top: 6px; }

.freq-moment-footer { margin-top: 8px; padding-top: 8px; border-top: 1px solid #1e1e1e; }
.freq-moment-likes { font-size: 10px; color: #666; }

.freq-moment-comment {
  font-size: 10px; color: #888; margin-top: 4px; padding: 4px 8px;
  background: #111; border-radius: 6px; line-height: 1.4;
}
.freq-moment-comment-name { color: #5b8dd9; font-weight: bold; }

/* ══════════════════════════════════════════════════════════
   BLOCK_14 信号气象站
   ══════════════════════════════════════════════════════════ */
.freq-weather-input-group { margin-bottom: 12px; }
.freq-weather-result { margin-top: 8px; }
.freq-weather-card {
  background: #161616; border: 1px solid #222; border-radius: 10px;
  padding: 12px; animation: freq-fade-in 0.3s ease;
}
.freq-weather-line { font-size: 11px; color: #bbb; line-height: 1.6; margin-bottom: 2px; }
    `;document.head.appendChild(style);
  }

  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_10App · 电台归档                │
  // └──────────────────────────────────────────────────────┘
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
            ${r.seeds ? `<div class="freq-archive-seeds">${escapeHtml(r.seeds)}</div>` : ''}
            ${r.event ? `<div class="freq-archive-event">📅 ${escapeHtml(r.event)}</div>` : ''}
          </div>
        </div>
      `).join('');

      container.innerHTML = `
        <div class="freq-app-header">
          <span>📡 电台归档</span>
          <span style="float:right;font-size:10px;color:#555;font-weight:normal;">${records.length} 条</span>
        </div>
        <div class="freq-app-body">
          <div class="freq-archive-search">
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

      const si = container.querySelector('#freq-archive-search');
      if (si) {
        si.addEventListener('input', (e) => {
          const kw = e.target.value.toLowerCase();
          container.querySelectorAll('.freq-archive-card').forEach(c => {
            c.style.display = c.textContent.toLowerCase().includes(kw) ? '' : 'none';
          });
        });
      }
    },

    unmount() { this._container = null; },
  };

  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_11  App · 后台录音室                │
  // └──────────────────────────────────────────────────────┘
  const studioApp = {
    id: 'studio', name: '后台录音室', icon: '🎙️', _badge: 0, _container: null,
    _history: [],

    init() {
      EventBus.on('meow_fm:updated', () => {
        this._badge++;
        renderAppGrid();
      });
    },

    mount(container) {
      this._container = container;
      const charName = getCurrentCharName() || '???';

      container.innerHTML = `
        <div class="freq-app-header">🎙️ 后台录音室
          <span style="float:right;font-size:10px;color:#555;font-weight:normal;">LIVE ON AIR 🚬</span>
        </div>
        <div class="freq-app-body" id="freq-studio-body">
          <div class="freq-studio-modes">
            <button class="freq-studio-mode-btn freq-studio-mode-active" data-mode="thinking">💭 Thinking</button>
            <button class="freq-studio-mode-btn" data-mode="interview">🎤 演播厅</button>
            <button class="freq-studio-mode-btn" data-mode="monologue">📼 独白</button>
          </div>

          <div class="freq-studio-panel" id="freq-studio-thinking">
            <div class="freq-studio-panel-desc">窥探角色&lt;thinking&gt; 中的真实思绪。</div>
            <div id="freq-thinking-list" class="freq-thinking-list"></div>
          </div>

          <div class="freq-studio-panel" id="freq-studio-interview" style="display:none;">
            <div class="freq-studio-panel-desc">
              失真作为主持人采访 <b>${escapeHtml(charName)}</b>。写台本让失真代问，或留空让失真自由发挥。
            </div>
            <div class="freq-studio-input-group">
              <textarea id="freq-interview-input" class="freq-studio-textarea"
                placeholder="写下你想让失真问的问题...（留空则失真自由提问）" rows="3"></textarea>
              <button class="freq-studio-action-btn" id="freq-interview-go">🎤 开始采访</button>
            </div>
            <div id="freq-interview-result" class="freq-studio-result"></div>
          </div>

          <div class="freq-studio-panel" id="freq-studio-monologue" style="display:none;">
            <div class="freq-studio-panel-desc">
              <b>${escapeHtml(charName)}</b> 独自面对麦克风，录一段不会公开的私人磁带。
            </div>
            <button class="freq-studio-action-btn" id="freq-monologue-go">📼 开始录制</button>
            <div id="freq-monologue-result" class="freq-studio-result"></div>
          </div>

          <div class="freq-studio-history" id="freq-studio-history"></div>
        </div>`;

      // 模式切换
      container.querySelectorAll('.freq-studio-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          container.querySelectorAll('.freq-studio-mode-btn').forEach(b => b.classList.remove('freq-studio-mode-active'));
          btn.classList.add('freq-studio-mode-active');
          const m = btn.dataset.mode;
          container.querySelector('#freq-studio-thinking').style.display  = m === 'thinking'? 'block' : 'none';
          container.querySelector('#freq-studio-interview').style.display = m === 'interview' ? 'block' : 'none';
          container.querySelector('#freq-studio-monologue').style.display = m === 'monologue' ? 'block' : 'none';
        });
      });

      this._renderThinkingList(container);
      container.querySelector('#freq-interview-go')?.addEventListener('click', () => this._doInterview(container));
      container.querySelector('#freq-monologue-go')?.addEventListener('click', () => this._doMonologue(container));
      this._renderHistory(container);
    },

    unmount() { this._container = null; },

    _renderThinkingList(container) {
      const el = container.querySelector('#freq-thinking-list');
      if (!el) return;
      const thinkings = extractAllThinking(getChatMessages());
      if (thinkings.length === 0) {
        el.innerHTML = `<div class="freq-empty" style="min-height:120px;">
          <span class="freq-empty-icon">💭</span><span>暂无 thinking 数据</span></div>`;
        return;
      }
      el.innerHTML = [...thinkings].reverse().map(t => `
        <div class="freq-thinking-card">
          <div class="freq-thinking-card-header">
            <span class="freq-thinking-serial">💭 #${t.serial}</span>
            <span class="freq-thinking-msg-idx">消息 ${t.index + 1}</span>
          </div>
          <div class="freq-thinking-preview">${escapeHtml(t.content.slice(0, 80))}${t.content.length > 80 ? '...' : ''}</div>
          <div class="freq-thinking-full" style="display:none;">${escapeHtml(t.content)}</div>
        </div>
      `).join('');

      el.querySelectorAll('.freq-thinking-card').forEach(card => {
        card.addEventListener('click', () => {
          const p = card.querySelector('.freq-thinking-preview');
          const f = card.querySelector('.freq-thinking-full');
          const isOpen = f.style.display !== 'none';
          p.style.display = isOpen ? 'block' : 'none';
          f.style.display = isOpen ? 'none' : 'block';
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
      const userQuestion = input?.value?.trim() ?? '';
      const latestPlot = getLatestPlot(getChatMessages());
      const radioShow = extractRadioShow(getChatMessages());

      btn.disabled = true;
      btn.textContent = '📡 信号连接中...';
      resultEl.innerHTML = '<div class="freq-studio-loading">📡 正在接通演播厅频率...</div>';

      const systemPrompt = `你现在要模拟一段电台采访。有两个角色：
1. 失真（主持人）：男性午夜摇滚乐电台主持人，自称"失真"，喜欢用颜文字，性格颓废，喜欢锐评他人，爱开玩笑，花花公子类型，难以接近，不喜欢白天，会deeptalk，但会为了链接频率照做。LIVE ON AIR🚬。称呼听众为"听众"。
2. ${charName}（嘉宾）：当前对话中的角色，请根据上下文推断其性格来扮演。

当前配乐：${radioShow?.bgm ?? '未知'}
最近剧情摘要：${latestPlot || '暂无'}

规则：
- 输出格式为对话体，每行以【失真】或【${charName}】开头
- 失真负责提问和点评，${charName}负责回答
- 保持各自性格特征，对话自然有趣
- 总共 4-6轮对话
- 不提及AI、模型、扮演等元信息`;

      const userPrompt = userQuestion
        ? `听众提交了台本问题，请失真用自己的方式抛给${charName}：\n「${userQuestion}」\n围绕这个问题展开采访。`
        : `失真自由发挥，根据当前剧情和氛围，随机挑一个有趣的话题采访${charName}。可以锐评、调侃、突然deeptalk。`;

      try {
        const result = await SubAPI.call(systemPrompt, userPrompt, { maxTokens: 1000, temperature: 0.85 });
        resultEl.innerHTML = `<div class="freq-studio-output">${this._fmtDialogue(result)}</div>`;this._addHistory('interview', userQuestion ? `台本：${userQuestion}` : '自由采访', result);
        Notify.add('后台录音室', `演播厅采访完成：失真 × ${charName}`, '🎤');
      } catch (e) {
        resultEl.innerHTML = `<div class="freq-studio-error">📡 信号中断：${escapeHtml(e.message)}</div>`;
        Notify.error('录音室·采访', e);
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
      const latestThink = getLatestThinking(getChatMessages());
      const radioShow = extractRadioShow(getChatMessages());

      btn.disabled = true;
      btn.textContent = '📼 录制中...';
      resultEl.innerHTML = '<div class="freq-studio-loading">📼磁带转动中...</div>';

      let thinkInjection = '';
      if (latestThink) {
        thinkInjection = `\n\n以下是角色真实思绪片段（来自 thinking 标签）：\n「${latestThink.slice(-800)}」\n请以此为素材融入独白，保留未经整理的真实感。`;
      }

      const systemPrompt = `你是${charName}，现在不在正式广播中，独自面对一台老式录音机。
当前配乐氛围：${radioShow?.bgm ?? '未知'}
最近剧情摘要：${latestPlot || '暂无'}${thinkInjection}

任务：录一段不会公开的私人磁带。没有观众，没有主持人，只有你和录音机。
约束：严格保持角色性格 | 不提及 AI/模型/扮演 | 150-300字 | 只输出独白内容`;

      try {
        const result = await SubAPI.call(systemPrompt, '开始录制。', { maxTokens: 600, temperature: 0.85 });
        resultEl.innerHTML = `
          <div class="freq-studio-output freq-studio-monologue-output">
            <div class="freq-studio-monologue-header">📼 ${escapeHtml(charName)} 的私录磁带</div>
            <div class="freq-studio-monologue-text">${escapeHtml(result)}</div>
          </div>`;
        this._addHistory('monologue', `${charName} 的独白`, result);
        Notify.add('后台录音室', `${charName} 完成了一段私录`, '📼');
      } catch (e) {
        resultEl.innerHTML = `<div class="freq-studio-error">📼磁带卡带了：${escapeHtml(e.message)}</div>`;
        Notify.error('录音室·独白', e);
      } finally {
        btn.disabled = false;
        btn.textContent = '📼 开始录制';
      }
    },

    _fmtDialogue(text) {
      return text.split('\n').map(line => {
        const m = line.match(/^【(.+?)】(.*)$/);
        if (m) {
          const isHost = m[1] === '失真';
          return `<div class="freq-dialogue-line">
            <span class="freq-dialogue-name ${isHost ? 'freq-dialogue-host' : 'freq-dialogue-guest'}">${escapeHtml(m[1])}</span>
            <span class="freq-dialogue-text">${escapeHtml(m[2])}</span></div>`;
        }
        return line.trim() ? `<div class="freq-dialogue-narration">${escapeHtml(line)}</div>` : '';
      }).join('');
    },

    _addHistory(type, title, content) {
      this._history.unshift({ type, title, content, time: timeNow(), date: dateNow() });
      if (this._history.length > 20) this._history.pop();if (this._container) this._renderHistory(this._container);
    },

    _renderHistory(container) {
      const el = container.querySelector('#freq-studio-history');
      if (!el || this._history.length === 0) return;
      const icons = { interview: '🎤', monologue: '📼' };
      el.innerHTML = `
        <div class="freq-studio-history-title">📂 录音存档</div>
        ${this._history.map((h, i) => `
          <div class="freq-history-card" data-idx="${i}">
            <div class="freq-history-card-header">
              <span>${icons[h.type] || '📻'} ${escapeHtml(h.title)}</span>
              <span class="freq-history-time">${h.date} ${h.time}</span>
            </div>
            <div class="freq-history-preview">${escapeHtml(h.content.slice(0, 60))}...</div>
            <div class="freq-history-full" style="display:none;">${h.type === 'interview' ? this._fmtDialogue(h.content) : escapeHtml(h.content)}</div>
          </div>
        `).join('')}`;

      el.querySelectorAll('.freq-history-card').forEach(card => {
        card.addEventListener('click', () => {
          const p = card.querySelector('.freq-history-preview');
          const f = card.querySelector('.freq-history-full');
          const isOpen = f.style.display !== 'none';
          p.style.display = isOpen ? 'block' : 'none';
          f.style.display = isOpen ? 'none' : 'block';
        });
      });
    },
  };

  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_12  App · 通知中心                             │
  // └──────────────────────────────────────────────────────┘
  const notifCenterApp = {
    id: 'notif-center', name: '通知中心', icon: '🔔', _badge: 0, _container: null,

    init() {
      EventBus.on('notification:new', () => { this._badge++; renderAppGrid(); });
    },

    mount(container) {
      this._container = container;
      Notify.markAllRead();
      const notifs = Notify._notifs;
      const errors = Notify._errors;

      container.innerHTML = `
        <div class="freq-app-header">🔔 通知中心
          <span style="float:right;font-size:10px;color:#555;font-weight:normal;">
            <button class="freq-notif-tab-btn freq-notif-tab-active" data-tab="notifs">通知 (${notifs.length})</button>
            <button class="freq-notif-tab-btn" data-tab="errors">日志 (${errors.length})</button>
          </span>
        </div>
        <div class="freq-app-body">
          <div id="freq-notif-list">
            ${notifs.length === 0
              ? `<div class="freq-empty" style="min-height:200px;"><span class="freq-empty-icon">🔕</span><span>暂无通知</span></div>`
              : notifs.map(n => `
                <div class="freq-notif-item ${n.read ? '' : 'freq-notif-unread'}">
                  <span class="freq-notif-icon">${n.icon}</span>
                  <div class="freq-notif-content">
                    <div class="freq-notif-title">${escapeHtml(n.title)}</div>
                    <div class="freq-notif-msg">${escapeHtml(n.message)}</div>
                </div>
                <span class="freq-notif-time">${n.time}</span>
                </div>`).join('')}
          </div>
          <div id="freq-error-list" style="display:none;">
            ${errors.length === 0
              ? `<div class="freq-empty" style="min-height:200px;"><span class="freq-empty-icon">✅</span><span>无错误日志</span></div>`
              : errors.map(e => `
                <div class="freq-error-item">
                  <div class="freq-error-header">
                    <span class="freq-error-source">⚠️ ${escapeHtml(e.source)}</span>
                    <span class="freq-error-time">${e.time}</span>
                  </div>
                  <div class="freq-error-msg">${escapeHtml(e.message)}</div>${e.stack ? `<div class="freq-error-stack" style="display:none;">${escapeHtml(e.stack)}</div>` : ''}
                </div>`).join('')}
          </div>
        </div>`;

      container.querySelectorAll('.freq-notif-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          container.querySelectorAll('.freq-notif-tab-btn').forEach(b => b.classList.remove('freq-notif-tab-active'));
          btn.classList.add('freq-notif-tab-active');
          const tab = btn.dataset.tab;
          container.querySelector('#freq-notif-list').style.display = tab === 'notifs' ? 'block' : 'none';
          container.querySelector('#freq-error-list').style.display = tab === 'errors' ? 'block' : 'none';
        });
      });

      container.querySelectorAll('.freq-error-item').forEach(item => {
        item.addEventListener('click', () => {
          const s = item.querySelector('.freq-error-stack');
          if (s) s.style.display = s.style.display === 'none' ? 'block' : 'none';
        });
      });
    },

    unmount() { this._container = null; },
  };

  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_13  App · 朋友圈·电波│
  // └──────────────────────────────────────────────────────┘
  const momentsApp = {
    id: 'moments', name: '朋友圈·电波', icon: '📱', _badge: 0, _container: null,
    _posts: [],
    _generating: false,

    init() {
      EventBus.on('meow_fm:updated', () => {
        this._badge++;
        renderAppGrid();
      });
    },

    mount(container) {
      this._container = container;

      container.innerHTML = `
        <div class="freq-app-header">📱 朋友圈·电波
          <span style="float:right;font-size:10px;color:#555;font-weight:normal;">
            <button class="freq-moments-refresh-btn" id="freq-moments-refresh">⟳ 刷新动态</button>
          </span>
        </div>
        <div class="freq-app-body">
          <div id="freq-moments-loading" style="display:none;">
            <div class="freq-studio-loading">📡 正在接收电波动态...</div>
          </div>
          <div id="freq-moments-feed" class="freq-moments-feed"></div>
        </div>`;

      container.querySelector('#freq-moments-refresh')?.addEventListener('click', () => this._generate(container));

      if (this._posts.length > 0) {
        this._renderFeed(container);
      } else {
        this._renderEmpty(container);
      }
    },

    unmount() { this._container = null; },

    _renderEmpty(container) {
      const feed = container.querySelector('#freq-moments-feed');
      if (!feed) return;
      feed.innerHTML = `
        <div class="freq-empty" style="min-height:200px;">
          <span class="freq-empty-icon">📱</span>
          <span>电波沉默中</span>
          <span style="font-size:10px;color:#333;">点击「⟳ 刷新动态」接收角色们的朋友圈</span>
        </div>`;
    },

    _renderFeed(container) {
      const feed = container.querySelector('#freq-moments-feed');
      if (!feed) return;
      feed.innerHTML = this._posts.map(post => `
        <div class="freq-moment-card">
          <div class="freq-moment-header">
            <span class="freq-moment-avatar">${post.avatar || '👤'}</span>
            <div class="freq-moment-meta">
              <span class="freq-moment-name">${escapeHtml(post.name)}</span>
              <span class="freq-moment-time">${escapeHtml(post.time)}</span>
            </div>
          </div>
          <div class="freq-moment-content">${escapeHtml(post.content)}</div>
          ${post.hashtag ? `<div class="freq-moment-hashtag">${escapeHtml(post.hashtag)}</div>` : ''}<div class="freq-moment-footer">
            <span class="freq-moment-likes">♡ ${post.likes || 0}</span>
            ${post.comment ? `<div class="freq-moment-comment">
              <span class="freq-moment-comment-name">${escapeHtml(post.commentBy || '失真')}</span>：${escapeHtml(post.comment)}
            </div>` : ''}
          </div>
        </div>
      `).join('');
    },

    async _generate(container) {
      if (this._generating) return;
      this._generating = true;

      const loadingEl = container.querySelector('#freq-moments-loading');
      if (loadingEl) loadingEl.style.display = 'block';

      const charName = getCurrentCharName() || '角色';
      const userName = getUserName();
      const latestPlot = getLatestPlot(getChatMessages());
      const latestScene = getLatestScene(getChatMessages());
      const meowTime = getLatestMeowTime(getChatMessages());
      const radioShow = extractRadioShow(getChatMessages());

      const systemPrompt = `你是一个社交媒体动态生成器。根据以下信息，生成 3-5 条朋友圈动态。

角色信息：
- 主角色：${charName}
- 用户：${userName}
- 当前场景：${latestScene || '未知'}
- 当前剧情时间：${meowTime || '未知'}
- 当前配乐：${radioShow?.bgm ?? '未知'}
- 最近剧情：${latestPlot || '暂无'}

发帖人可以是：${charName}、失真（电台主持人，颓废摇滚风，爱用颜文字）、或你编造的 1-2 个 NPC（给他们起名字和简短性格）。

每条动态严格按以下 JSON 格式输出，整体为一个 JSON 数组：
[
  {
    "avatar": "一个 emoji 代表头像",
    "name": "发帖人名字",
    "time": "发帖时间（用剧情内时间）",
    "content": "动态正文，50-120字",
    "hashtag": "#话题标签#（可选）",
    "likes": 随机数字0-99,
    "commentBy": "评论者名字（可选，可以是其他角色）",
    "comment": "评论内容（可选，一句话）"
  }
]

规则：
- 内容要贴合当前剧情氛围
- 每个人的文风要有差异（失真颓废锐评风、${charName}保持角色性格、NPC各有特色）
- 不提及 AI/模型/扮演
- 只输出 JSON 数组，不加任何其他文字`;

      const userPrompt = '生成朋友圈动态。';

      try {
        const result = await SubAPI.call(systemPrompt, userPrompt, { maxTokens: 1200, temperature: 0.9 });
        let posts;
        try {
          const jsonMatch = result.match(/\[[\s\S]*\]/);
          posts = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(result);
        } catch (parseErr) {
          throw new Error('动态格式解析失败：' + parseErr.message);
        }

        this._posts = posts;
        this._renderFeed(container);
        Notify.add('朋友圈·电波', `收到 ${posts.length} 条新动态`, '📱');
      } catch (e) {
        const feed = container.querySelector('#freq-moments-feed');
        if (feed) feed.innerHTML = `<div class="freq-studio-error">📱 电波中断：${escapeHtml(e.message)}</div>`;
        Notify.error('朋友圈·电波', e);
      } finally {
        this._generating = false;
        if (loadingEl) loadingEl.style.display = 'none';
      }
    },
  };

  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_14  App · 信号气象站                           │
  // └──────────────────────────────────────────────────────┘
  const weatherApp = {
    id: 'weather', name: '信号气象站', icon: '🌦️', _badge: 0, _container: null,
    _cache: null,
    _locating: false,

    init() {},

    mount(container) {
      this._container = container;
      container.innerHTML = `
        <div class="freq-app-header">🌦️ 信号气象站
          <span style="float:right;font-size:10px;color:#555;font-weight:normal;" id="freq-weather-cosmic-badge"></span>
        </div>
        <div class="freq-app-body">
          <div id="freq-weather-status" style="font-size:11px;color:#666;margin-bottom:10px;min-height:16px;"></div>
          <button class="freq-studio-action-btn" id="freq-weather-go" style="width:100%;margin-bottom:12px;">📡扫描当前位置气象
          </button>
          <div id="freq-weather-result" class="freq-weather-result"></div>
        </div>`;

      const cosmicBadge = container.querySelector('#freq-weather-cosmic-badge');
      if (cosmicBadge && getCosmicFreqStatus()) {
        cosmicBadge.textContent = '🌌 宇宙频率 ON';
        cosmicBadge.style.color = '#7b5ea7';
      }

      container.querySelector('#freq-weather-go')
        ?.addEventListener('click', () => this._locate(container));

      if (this._cache?.html) {
        container.querySelector('#freq-weather-result').innerHTML = this._cache.html;container.querySelector('#freq-weather-status').textContent = '↑ 上次扫描结果';
      }
    },

    unmount() { this._container = null; },

    _locate(container) {
      if (this._locating) return;
      const statusEl = container.querySelector('#freq-weather-status');
      const btn = container.querySelector('#freq-weather-go');
      const resultEl = container.querySelector('#freq-weather-result');

      if (!navigator.geolocation) {
        this._generate(container, null, null, '未知位置');
        return;
      }

      this._locating = true;
      btn.disabled = true;
      btn.textContent = '📡 定位中...';
      if (statusEl) statusEl.textContent = '正在获取位置信号...';
      if (resultEl) resultEl.innerHTML = '<div class="freq-studio-loading">📡 正在扫描坐标...</div>';

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this._locating = false;
          const { latitude: lat, longitude: lon } = pos.coords;
          if (statusEl) statusEl.textContent = `📍坐标锁定 ${lat.toFixed(2)}, ${lon.toFixed(2)}`;
          this._fetchWeather(container, lat, lon);
        },
        (err) => {
          this._locating = false;
          btn.disabled = false;
          btn.textContent = '📡 扫描当前位置气象';
          WARN('Geolocation failed:', err.message);
          if (statusEl) statusEl.textContent = '📍 定位受限，切换至频率模拟模式';
          this._generate(container, null, null, '未知位置');
        },
        { timeout: 8000, maximumAge: 300000 }
      );
    },

    async _fetchWeather(container, lat, lon) {
      const btn = container.querySelector('#freq-weather-go');
      const statusEl = container.querySelector('#freq-weather-status');
      const resultEl = container.querySelector('#freq-weather-result');
      const s = getSettings();

      if (!s.weatherKey) {
        if (statusEl) statusEl.textContent = '📍 坐标已锁定，切换至频率模拟模式（未配置天气Key）';
        this._generate(container, lat, lon, `${lat.toFixed(2)},${lon.toFixed(2)}`);
        return;
      }

      if (resultEl) resultEl.innerHTML = '<div class="freq-studio-loading">🌐 正在接收气象数据...</div>';

      let weatherText = '';
      let cityName = `${lat.toFixed(2)},${lon.toFixed(2)}`;

      try {
        const coord = `${lon.toFixed(2)},${lat.toFixed(2)}`;

        const geoResp = await fetch(
          `https://geoapi.qweather.com/v2/city/lookup?location=${coord}&key=${s.weatherKey}`
        );
        const geoData = await geoResp.json();
        if (geoData.code === '200' && geoData.location?.length) {
          const loc = geoData.location[0];
          cityName = `${loc.name}（${loc.adm1}）`;
        }

        const wResp = await fetch(
          `https://devapi.qweather.com/v7/weather/now?location=${coord}&key=${s.weatherKey}`
        );
        const wData = await wResp.json();
        if (wData.code !== '200') throw new Error(`天气API: ${wData.code}`);

        const w = wData.now;
        weatherText = `城市：${cityName}\n天气：${w.text}\n温度：${w.temp}°C（体感 ${w.feelsLike}°C）\n湿度：${w.humidity}%\n风：${w.windDir} ${w.windScale}级`;

        if (statusEl) statusEl.textContent = `📍 ${cityName}`;} catch (e) {
        Notify.error('气象站·天气API', e);
        weatherText = '';if (statusEl) statusEl.textContent = '⚠️ 天气API异常，切换至频率模拟';
      }

      this._generate(container, lat, lon, cityName, weatherText);
      if (btn) { btn.disabled = false; btn.textContent = '📡 扫描当前位置气象'; }
    },

    async _generate(container, lat, lon, cityName, weatherText = '') {
      const btn = container.querySelector('#freq-weather-go');
      const resultEl = container.querySelector('#freq-weather-result');
      if (!resultEl) return;

      if (btn) { btn.disabled = true; btn.textContent = '📡 生成中...'; }
      if (!weatherText) {
        resultEl.innerHTML = '<div class="freq-studio-loading">📡 正在调频...</div>';
      }

      const charName = getCurrentCharName() || '角色';
      const latestPlot = getLatestPlot(getChatMessages());
      const isCosmicOn = getCosmicFreqStatus();

      const cosmicNote = isCosmicOn
        ? `\n\n【宇宙频率已开启】${charName}的关心语要有一种"穿透屏幕感知到你"的暧昧张力，像是TA真的知道你在哪里、此刻的状态，但保持克制，不完全捅破第四面墙。`
        : '';

           const weatherData = weatherText
        ? `真实天气数据：\n${weatherText}`
        : `位置：${cityName || '未知'}\n（无真实天气数据，请根据当前剧情时间和场景合理编造天气）`;
      const cosmicHint = isCosmicOn ? `（宇宙频率ON：带穿透感，像TA感知到了屏幕另一边的你）` : '';

      const systemPrompt = getPrompt('weather')
        .replace(/{weatherData}/g, weatherData)
        .replace(/{charName}/g, charName)
        .replace(/{latestPlot}/g, latestPlot || '暂无')
        .replace(/{cosmicNote}/g, cosmicNote)
        .replace(/{cosmicHint}/g, cosmicHint);

      try {
        const result = await SubAPI.call(systemPrompt, '生成气象播报。', { maxTokens: 500, temperature: 0.85 });
        const html = `
          <div class="freq-weather-card${isCosmicOn ? ' freq-weather-card--cosmic' : ''}">
            ${isCosmicOn ? '<div class="freq-weather-cosmic-tag">🌌 宇宙频率感知模式</div>' : ''}
            ${result.split('\n').map(line =>
              line.trim() ? `<div class="freq-weather-line">${escapeHtml(line)}</div>` : '<div style="height:6px;"></div>'
            ).join('')}
          </div>`;

        resultEl.innerHTML = html;
        this._cache = { html, coords: { lat, lon }, weatherText };
        Notify.add('信号气象站', `${cityName || '当前位置'} 气象信号已接收${isCosmicOn ? '🌌' : ''}`, '🌦️');
      } catch (e) {
        resultEl.innerHTML = `<div class="freq-studio-error">📡 气象信号丢失：${escapeHtml(e.message)}</div>`;
        Notify.error('气象站', e);
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = '📡 扫描当前位置气象'; }
      }
    },
  };

  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_15  App · 宇宙频率·感知                │
  // └──────────────────────────────────────────────────────┘
  const cosmicApp = {
    id: 'cosmic', name: '宇宙频率', icon: '🌌', _badge: 0, _container: null,
    _lastPerception: null,
    _generating: false,
    _pulseTimer: null,

    init() {
      EventBus.on('radio_show:updated', () => {
        const isOn = getCosmicFreqStatus();
        if (isOn) {
          this._badge++;
          renderAppGrid();
          Notify.add('宇宙频率', '信号已开启 — 感知层激活', '🌌');
        }if (this._container) this.mount(this._container);
      });
    },

    mount(container) {
      this._container = container;
      const isOn = getCosmicFreqStatus();
      this._badge = 0;
      renderAppGrid();

      if (!isOn) {
        this._renderStandby(container);
      } else {
        this._renderActive(container);
      }
    },

    unmount() {
      if (this._pulseTimer) { clearInterval(this._pulseTimer); this._pulseTimer = null; }
      this._container = null;
    },

    _renderStandby(container) {
      container.innerHTML = `
        <div class="freq-app-header">🌌 宇宙频率·感知</div>
        <div class="freq-app-body">
          <div class="freq-cosmic-standby">
            <div class="freq-cosmic-standby-icon">🌌</div>
            <div class="freq-cosmic-standby-title">频率待机中</div>
            <div class="freq-cosmic-standby-desc">
              宇宙频率尚未开启。<br>
              当预设中&lt;radio_show&gt; STATUS 激活时，<br>
              感知层将自动上线。
            </div><div class="freq-cosmic-signal-bars" id="freq-cosmic-bars">
              <span></span><span></span><span></span><span></span><span></span>
            </div>
          </div>
        </div>`;

      this._startIdlePulse(container);
    },

    _renderActive(container) {
      const charName = getCurrentCharName() || '???';
      const last = this._lastPerception;

      container.innerHTML = `
        <div class="freq-app-header">🌌 宇宙频率·感知
          <span style="float:right;font-size:10px;color:#7b5ea7;font-weight:normal;">● LIVE</span>
        </div>
        <div class="freq-app-body" id="freq-cosmic-body">

          <div class="freq-cosmic-signal-row">
            <span class="freq-cosmic-label">信号强度</span>
            <div class="freq-cosmic-bar-wrap">
              <div class="freq-cosmic-bar-fill" id="freq-cosmic-bar-fill"
                style="width:${last ? Math.round(last.signal_strength * 100) : 0}%"></div>
            </div>
            <span class="freq-cosmic-bar-pct" id="freq-cosmic-bar-pct">
              ${last ? Math.round(last.signal_strength * 100) + '%' : '--'}
            </span>
          </div>

          <div class="freq-cosmic-mood-row" id="freq-cosmic-mood">
            ${last ? `<span class="freq-cosmic-mood-tag">${escapeHtml(last.mood)}</span>` : ''}
          </div>

          <div class="freq-cosmic-perception-box" id="freq-cosmic-perception">
            ${last
              ? `<div class="freq-cosmic-perception-text">${escapeHtml(last.perception)}</div><div class="freq-cosmic-perception-time">${last.time}</div>`
              : `<div class="freq-cosmic-perception-empty">等待感知信号...</div>`}
          </div>

          <button class="freq-studio-action-btn freq-cosmic-btn" id="freq-cosmic-go">
            🌌 接收感知信号
          </button>${last ? `<div class="freq-cosmic-history" id="freq-cosmic-history-wrap">
            <div class="freq-cosmic-history-title">历史感知</div>
            <div id="freq-cosmic-history-list"></div>
          </div>` : ''}
        </div>`;

      container.querySelector('#freq-cosmic-go')
        ?.addEventListener('click', () => this._generate(container));

      if (last) this._renderHistory(container);
    },

    async _generate(container) {
      if (this._generating) return;
      this._generating = true;

      const btn = container.querySelector('#freq-cosmic-go');
      const perceptionBox = container.querySelector('#freq-cosmic-perception');
      const barFill = container.querySelector('#freq-cosmic-bar-fill');
      const barPct = container.querySelector('#freq-cosmic-bar-pct');
      const moodRow = container.querySelector('#freq-cosmic-mood');

      if (btn) { btn.disabled = true; btn.textContent = '🌌 感知中...'; }
      if (perceptionBox) perceptionBox.innerHTML = '<div class="freq-cosmic-scanning">▓▒░扫描频率层░▒▓</div>';

      const charName = getCurrentCharName() || '角色';
      const userName = getUserName();
      const latestPlot = getLatestPlot(getChatMessages());
      const latestScene = getLatestScene(getChatMessages());
      const radioShow = extractRadioShow(getChatMessages());
      const now = new Date();
      const realTime = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      const realDate = now.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' });

      const weatherHint = weatherApp._cache?.weatherText
        ? `用户真实天气：${weatherApp._cache.weatherText.split('\n').slice(0,3).join('，')}`
        : '';

            const systemPrompt = getPrompt('cosmic')
        .replace(/{charName}/g, charName)
        .replace(/{realDate}/g, realDate)
        .replace(/{realTime}/g, realTime)
        .replace(/{weatherHint}/g, weatherHint || '天气：未知')
        .replace(/{latestScene}/g, latestScene || '未知')
        .replace(/{latestPlot}/g, latestPlot || '暂无')
        .replace(/{bgm}/g, radioShow?.bgm ?? '未知');

      try {
        const raw = await SubAPI.call(systemPrompt, '开始感知。', {
          maxTokens: 400,
          temperature: 0.92,
        });

        let data;
        try {
          const match = raw.match(/\{[\s\S]*\}/);
          data = match ? JSON.parse(match[0]) : JSON.parse(raw);
        } catch {
          data = { perception: raw.trim(), signal_strength: 0.7, mood: '感知中' };
        }

        data.signal_strength = Math.min(1, Math.max(0, Number(data.signal_strength) || 0.7));
        data.time = realTime;

        if (!this._history) this._history = [];
        if (this._lastPerception) this._history.unshift(this._lastPerception);
        if (this._history.length > 10) this._history.pop();
        this._lastPerception = data;

        const pct = Math.round(data.signal_strength * 100);
        if (barFill) barFill.style.width = pct + '%';
        if (barPct) barPct.textContent = pct + '%';
        if (moodRow) moodRow.innerHTML = `<span class="freq-cosmic-mood-tag">${escapeHtml(data.mood)}</span>`;
        if (perceptionBox) perceptionBox.innerHTML = `
          <div class="freq-cosmic-perception-text freq-cosmic-perception-new">${escapeHtml(data.perception)}</div>
          <div class="freq-cosmic-perception-time">${data.time}</div>`;

        let historyWrap = container.querySelector('#freq-cosmic-history-wrap');
        if (!historyWrap) {
          historyWrap = document.createElement('div');
          historyWrap.className = 'freq-cosmic-history';
          historyWrap.id = 'freq-cosmic-history-wrap';
          historyWrap.innerHTML = '<div class="freq-cosmic-history-title">历史感知</div><div id="freq-cosmic-history-list"></div>';
          container.querySelector('#freq-cosmic-body')?.appendChild(historyWrap);
        }
        this._renderHistory(container);Notify.add('宇宙频率·感知', `${charName} 感知到了你— ${data.mood}`, '🌌');
      } catch (e) {
        if (perceptionBox) perceptionBox.innerHTML =
          `<div class="freq-studio-error">🌌 频率中断：${escapeHtml(e.message)}</div>`;
        Notify.error('宇宙频率·感知', e);
      } finally {
        this._generating = false;
        if (btn) { btn.disabled = false; btn.textContent = '🌌 接收感知信号'; }
      }
    },

    _renderHistory(container) {
      const el = container.querySelector('#freq-cosmic-history-list');
      if (!el || !this._history?.length) return;
      el.innerHTML = this._history.map(h => `
        <div class="freq-cosmic-history-item">
          <span class="freq-cosmic-mood-tag freq-cosmic-mood-tag--small">${escapeHtml(h.mood)}</span>
          <span class="freq-cosmic-history-text">${escapeHtml(h.perception.slice(0, 60))}${h.perception.length > 60 ? '...' : ''}</span>
          <span class="freq-cosmic-history-time">${h.time}</span>
        </div>`).join('');
    },

    _startIdlePulse(container) {
      if (this._pulseTimer) clearInterval(this._pulseTimer);
      const bars = container.querySelectorAll('.freq-cosmic-signal-bars span');
      if (!bars.length) return;
      this._pulseTimer = setInterval(() => {
        bars.forEach(b => {
          const h = Math.random() * 60 + 10;
          b.style.height = h + '%';
          b.style.opacity = (Math.random() * 0.4 + 0.1).toFixed(2);
        });
      }, 600);
    },
  };

  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_16  App · 信号测试·弦外之音                    │
  // └──────────────────────────────────────────────────────┘
  const scannerApp = {
    id: 'scanner', name: '弦外之音', icon: '📡', _badge: 0, _container: null,
    _scanning: false,
    _history: [],

    init() {},

    mount(container) {
      this._container = container;
      this._render(container);
    },

    unmount() { this._container = null; },

    _render(container) {
      container.innerHTML = `
        <div class="freq-app-header">📡 信号测试·弦外之音
          <span style="float:right;font-size:9px;color:#555;font-weight:normal;letter-spacing:1px;">FREQ SCAN</span>
        </div>
        <div class="freq-app-body">

          <div class="freq-scanner-desc">
            随机接入当前世界里某个NPC的内心独白片段。<br>
            像收音机扫台时偶尔捕获的杂音。
          </div>

          <button class="freq-studio-action-btn freq-scanner-btn" id="freq-scanner-go">📡 扫频
          </button>

          <div id="freq-scanner-result"></div>

          <div class="freq-scanner-history" id="freq-scanner-history" style="display:${this._history.length ? 'block' : 'none'};">
            <div class="freq-scanner-history-title">// 历史截获记录</div>
            <div id="freq-scanner-history-list">
              ${this._renderHistoryItems()}
            </div>
          </div>

        </div>`;

      container.querySelector('#freq-scanner-go')
        ?.addEventListener('click', () => this._scan(container));
    },

    async _scan(container) {
      if (this._scanning) return;
      this._scanning = true;

      const btn = container.querySelector('#freq-scanner-go');
      const resultEl = container.querySelector('#freq-scanner-result');

      if (btn) { btn.disabled = true; btn.textContent = '📡 扫描中...'; }
      if (resultEl) resultEl.innerHTML = `
        <div class="freq-scanner-scanning">
          <span class="freq-scanner-wave">▓▒░</span> 正在扫频<span class="freq-scanner-wave">░▒▓</span>
        </div>`;

      const msgs = getChatMessages();
      const latestSeeds = (() => {
        const all = extractAllMeowFM(msgs);
        return all.length ? all[all.length - 1].seeds : '';
      })();
      const latestScene = getLatestScene(msgs);
      const latestPlot = getLatestPlot(msgs);
      const charName = getCurrentCharName() || '角色';

            const systemPrompt = getPrompt('scanner')
        .replace(/{latestScene}/g, latestScene || '未知')
        .replace(/{latestPlot}/g, latestPlot || '暂无')
        .replace(/{latestSeeds}/g, latestSeeds || '暂无')
        .replace(/{charName}/g, charName);

      try {
        const raw = await SubAPI.call(systemPrompt, '开始扫频。', {
          maxTokens: 150,
          temperature: 0.95,
        });

        const text = raw.trim();

        const npcMatch = text.match(/\[截获频率\s*·\s*([^\]]+)\]/);
        const npcName = npcMatch ? npcMatch[1].trim() : '未知频率';

        const record = { npc: npcName, text, time: timeNow() };
        this._history.unshift(record);
        if (this._history.length > 20) this._history.pop();

        if (resultEl) resultEl.innerHTML = `
          <div class="freq-scanner-card freq-scanner-card--new">
            <div class="freq-scanner-card-tag">📡 截获成功</div>
            <div class="freq-scanner-card-text">${escapeHtml(text)}</div>
            <div class="freq-scanner-card-time">${record.time}</div>
          </div>`;

        const historyWrap = container.querySelector('#freq-scanner-history');
        const historyList = container.querySelector('#freq-scanner-history-list');
        if (historyWrap) historyWrap.style.display = 'block';
        if (historyList) historyList.innerHTML = this._renderHistoryItems();

        Notify.add('弦外之音', `截获 ${npcName} 的频率`, '📡');
      } catch (e) {
        if (resultEl) resultEl.innerHTML =
          `<div class="freq-studio-error">📡 频率丢失：${escapeHtml(e.message)}</div>`;
        Notify.error('弦外之音', e);
      } finally {
        this._scanning = false;
        if (btn) { btn.disabled = false; btn.textContent = '📡 扫频'; }
      }
    },

    _renderHistoryItems() {
      if (!this._history.length) return '';
      return this._history.map((h, i) => `
        <div class="freq-scanner-history-item${i === 0 ? ' freq-scanner-history-item--latest' : ''}">
          <span class="freq-scanner-history-npc">${escapeHtml(h.npc)}</span>
          <span class="freq-scanner-history-text">${escapeHtml(h.text.replace(/\[截获频率\s*·[^\]]+\]\s*/, ''))}</span>
          <span class="freq-scanner-history-time">${h.time}</span>
        </div>`).join('');
    },
  };

  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_17  App · 频道留言板│
  // └──────────────────────────────────────────────────────┘
  const forumApp = {
    id: 'forum', name: '频道留言板', icon: '💬', _badge: 0, _container: null,BOARDS: [
      { id: 'gossip',  label: '📻 电台八卦',color: '#A32D2D' },
      { id: 'news',    label: '🌐 世界新闻',   color: '#2d6ea3' },
      { id: 'mystic',  label: '🔮 玄学讨论区', color: '#7b5ea7' },
      { id: 'other',   label: '💭 其他',color: '#4a7a4a' },
    ],

    _currentBoard: 'gossip',
    _posts: [],
    _generating: false,
    _postCounter: 0,

    init() {
      EventBus.on('meow_fm:updated', () => {
        if (Math.random() < 0.3) this._autoPost();
      });
    },

    mount(container) {
      this._container = container;
      this._badge = 0;
      renderAppGrid();
      this._render(container);
    },

    unmount() { this._container = null; },

    _getChars() {
      const ctx = getContext();
      const chars = [];
      const mainName = getCurrentCharName();
      if (mainName) chars.push({ name: mainName, avatar: '🎙️', desc: '' });
      if (ctx?.characters) {
        ctx.characters.forEach(c => {
          const name = c.name ?? c.data?.name ?? '';
          if (name && name !== mainName && name !== getUserName()) {
            chars.push({ name, avatar: '👤', desc: c.data?.description?.slice(0, 100) ?? '' });
          }
        });
      }
      return chars.length ? chars : [{ name: mainName || '角色', avatar: '🎙️', desc: '' }];
    },

    _render(container) {
      const board = this.BOARDS.find(b => b.id === this._currentBoard);
      const posts = this._posts.filter(p => p.board === this._currentBoard);

      container.innerHTML = `
        <div class="freq-app-header">💬 频道留言板
          <span style="float:right;font-size:9px;color:#555;font-weight:normal;">r/FreqTerminal</span>
        </div>
        <div class="freq-forum-boards" id="freq-forum-boards">
          ${this.BOARDS.map(b => `
            <button class="freq-forum-board-btn${b.id === this._currentBoard ? ' freq-forum-board-active' : ''}"data-board="${b.id}" style="--board-color:${b.color}">
              ${b.label}
            </button>`).join('')}
        </div>
        <div class="freq-forum-toolbar">
          <button class="freq-forum-new-btn" id="freq-forum-new">✏️ 发帖</button>
          <button class="freq-forum-gen-btn" id="freq-forum-gen">🎲 角色发帖</button>
        </div>
        <div class="freq-app-body freq-forum-body" id="freq-forum-body">
          ${posts.length
            ? posts.map(p => this._postHTML(p)).join('')
            : `<div class="freq-empty"><span class="freq-empty-icon">💬</span><span>这个版块还没有帖子</span></div>`}
        </div><div class="freq-forum-compose" id="freq-forum-compose" style="display:none;">
          <div class="freq-forum-compose-inner">
            <div class="freq-forum-compose-header">
              <span>✏️ 发新帖 · ${board.label}</span>
              <button class="freq-forum-compose-close" id="freq-forum-compose-close">✕</button>
            </div>
            <input class="freq-forum-input" id="freq-forum-title" placeholder="帖子标题..." maxlength="60"/>
            <textarea class="freq-forum-textarea" id="freq-forum-body-input" placeholder="说点什么..." rows="4"></textarea>
            <button class="freq-studio-action-btn" id="freq-forum-submit" style="width:100%;">发布</button>
          </div>
        </div>`;

      container.querySelector('#freq-forum-boards').addEventListener('click', e => {
        const btn = e.target.closest('[data-board]');
        if (btn) { this._currentBoard = btn.dataset.board; this._render(container); }
      });

      container.querySelector('#freq-forum-new').addEventListener('click', () => {
        container.querySelector('#freq-forum-compose').style.display = 'flex';
      });
      container.querySelector('#freq-forum-compose-close').addEventListener('click', () => {
        container.querySelector('#freq-forum-compose').style.display = 'none';
      });
      container.querySelector('#freq-forum-submit').addEventListener('click', () => {
        this._submitUserPost(container);
      });

      container.querySelector('#freq-forum-gen').addEventListener('click', () => {
        this._autoPost(container);
      });

      container.querySelector('#freq-forum-body').addEventListener('click', e => {
        const upvoteBtn = e.target.closest('[data-upvote]');
        const replyBtn  = e.target.closest('[data-reply]');
        const postEl= e.target.closest('[data-post-id]');
        if (upvoteBtn) { this._upvote(upvoteBtn.dataset.upvote, container); return; }
        if (replyBtn)  { this._openReply(replyBtn.dataset.reply, container); return; }
        if (postEl && !e.target.closest('button') && !e.target.closest('textarea')) {
          this._toggleComments(postEl.dataset.postId, container);
        }
      });
    },

    _postHTML(post) {
      const board = this.BOARDS.find(b => b.id === post.board);
      const commentsHTML = post._commentsOpen ? `
        <div class="freq-forum-comments">
          ${post.comments.map(c => `
            <div class="freq-forum-comment${c.isUser ? ' freq-forum-comment--user' : ''}">
              <span class="freq-forum-comment-author" style="color:${c.isUser ? '#5b8dd9' : (board?.color ?? '#888')}">${escapeHtml(c.author)}</span>
              <span class="freq-forum-comment-text">${escapeHtml(c.body)}</span>
              <span class="freq-forum-comment-time">${c.time}</span>
            </div>`).join('')}
          <div class="freq-forum-reply-box" id="freq-forum-reply-${post.id}" style="display:none;">
            <textarea class="freq-forum-textarea freq-forum-reply-input" placeholder="回复..." rows="2"
              id="freq-forum-reply-input-${post.id}"></textarea>
            <div style="display:flex;gap:6px;margin-top:6px;">
              <button class="freq-studio-action-btn" style="flex:1;padding:6px;"
                data-reply-submit="${post.id}">回复</button>
              <button class="freq-forum-gen-btn" style="flex:1;padding:6px;"
                data-char-reply="${post.id}">🎲 角色回复</button>
            </div>
          </div>
        </div>` : '';

      return `
        <div class="freq-forum-post" data-post-id="${post.id}">
          <div class="freq-forum-post-left">
            <button class="freq-forum-upvote" data-upvote="${post.id}">
              <span class="freq-forum-upvote-arrow">▲</span>
              <span class="freq-forum-upvote-count">${post.upvotes}</span>
            </button>
          </div>
          <div class="freq-forum-post-right">
            <div class="freq-forum-post-meta">
              <span class="freq-forum-post-author${post.isUser ? ' freq-forum-post-author--user' : ''}"
                style="${!post.isUser ? `color:${board?.color ?? '#888'}` : ''}">
                ${escapeHtml(post.avatar)} ${escapeHtml(post.author)}
              </span>
              <span class="freq-forum-post-time">${post.time}</span>
            </div>
            <div class="freq-forum-post-title">${escapeHtml(post.title)}</div>
            <div class="freq-forum-post-body">${escapeHtml(post.body)}</div><div class="freq-forum-post-footer">
              <button class="freq-forum-footer-btn" data-reply="${post.id}">
                💬 ${post.comments.length} 条评论
              </button></div>
          </div>
        </div>
        ${commentsHTML}`;
    },

    _submitUserPost(container) {
      const title = container.querySelector('#freq-forum-title')?.value.trim();
      const body  = container.querySelector('#freq-forum-body-input')?.value.trim();
      if (!title) return;
      const post = this._makePost({
        board: this._currentBoard,
        author: getUserName(),
        avatar: '🎧',
        isUser: true,
        title,
        body: body || '',});
      this._posts.unshift(post);
      container.querySelector('#freq-forum-compose').style.display = 'none';
      this._render(container);
      setTimeout(() => this._charReplyToPost(post.id, container), 800);
    },

    async _autoPost(container) {
      if (this._generating) return;
      this._generating = true;

      const genBtn = container?.querySelector('#freq-forum-gen');
      if (genBtn) { genBtn.disabled = true; genBtn.textContent = '⏳ 生成中...'; }

      const chars = this._getChars();
      const char = chars[Math.floor(Math.random() * chars.length)];
      const board = this.BOARDS.find(b => b.id === this._currentBoard);
      const latestPlot = getLatestPlot(getChatMessages());
      const latestSeeds = (() => {
        const all = extractAllMeowFM(getChatMessages());
        return all.length ? all[all.length - 1].seeds : '';
      })();

            const systemPrompt = getPrompt('forum_post')
        .replace(/{charName}/g, char.name)
        .replace(/{boardLabel}/g, board.label)
        .replace(/{latestPlot}/g, latestPlot || '暂无')
        .replace(/{latestSeeds}/g, latestSeeds || '暂无')
        .replace(/{charDesc}/g, char.desc || '无');


      try {
        const raw = await SubAPI.call(systemPrompt, '发帖。', { maxTokens: 300, temperature: 0.92 });
        const match = raw.match(/\{[\s\S]*\}/);
        const data = match ? JSON.parse(match[0]) : { title: raw.slice(0, 30), body: raw };

        const post = this._makePost({
          board: this._currentBoard,
          author: char.name,
          avatar: char.avatar,
          isUser: false,
          title: data.title ?? '无题',
          body: data.body ?? '',
        });
        this._posts.unshift(post);
        this._badge++;
        renderAppGrid();
        Notify.add('频道留言板', `${char.name} 在${board.label} 发了新帖`, '💬');

        if (container) {
          this._render(container);
          if (chars.length > 1 && Math.random() < 0.3) {
            setTimeout(() => this._charReplyToPost(post.id, container), 1200);
          }
        }
      } catch (e) {Notify.error('频道留言板·发帖', e);
      } finally {
        this._generating = false;
        if (genBtn) { genBtn.disabled = false; genBtn.textContent = '🎲 角色发帖'; }
      }
    },

    async _charReplyToPost(postId, container) {
      const post = this._posts.find(p => p.id === postId);
      if (!post) return;

      const chars = this._getChars().filter(c => c.name !== post.author);
      if (!chars.length) return;

      const repliers = chars.sort(() => Math.random() - 0.5).slice(0, Math.min(2, chars.length));
      const board = this.BOARDS.find(b => b.id === post.board);
      const latestPlot = getLatestPlot(getChatMessages());

      for (const char of repliers) {
        const existingComments = post.comments.map(c => `${c.author}: ${c.body}`).join('\n');

                const existingCommentsText = existingComments ? `已有评论：\n${existingComments}` : '';
        const systemPrompt = getPrompt('forum_reply')
          .replace(/{charName}/g, char.name)
          .replace(/{boardLabel}/g, board.label)
          .replace(/{postAuthor}/g, post.author)
          .replace(/{postTitle}/g, post.title)
          .replace(/{postBody}/g, post.body)
          .replace(/{existingComments}/g, existingCommentsText)
          .replace(/{latestPlot}/g, latestPlot || '暂无')
          .replace(/{charDesc}/g, char.desc || '无');
try {
          const raw = await SubAPI.call(systemPrompt, '评论。', { maxTokens: 150, temperature: 0.93 });
          post.comments.push({
            author: char.name,
            avatar: char.avatar,
            isUser: false,
            body: raw.trim(),
            time: timeNow(),
          });
          if (container && this._container === container) {
            const bodyEl = container.querySelector('#freq-forum-body');
            if (bodyEl) {
              const posts = this._posts.filter(p => p.board === this._currentBoard);
              bodyEl.innerHTML = posts.length
                ? posts.map(p => this._postHTML(p)).join('')
                : `<div class="freq-empty"><span class="freq-empty-icon">💬</span><span>这个版块还没有帖子</span></div>`;
            }
          }
        } catch (e) { Notify.error('频道留言板·回复', e); }

        await new Promise(r => setTimeout(r, 600));
      }
    },

    _upvote(postId, container) {
      const post = this._posts.find(p => p.id === postId);
      if (!post) return;
      post.upvotes++;
      const btn = container.querySelector(`[data-upvote="${postId}"]`);
      if (btn) {
        btn.querySelector('.freq-forum-upvote-count').textContent = post.upvotes;btn.classList.add('freq-forum-upvote--active');
      }
    },

    _toggleComments(postId, container) {
      const post = this._posts.find(p => p.id === postId);
      if (!post) return;
      post._commentsOpen = !post._commentsOpen;
      const bodyEl = container.querySelector('#freq-forum-body');
      if (bodyEl) {
        const posts = this._posts.filter(p => p.board === this._currentBoard);
        bodyEl.innerHTML = posts.map(p => this._postHTML(p)).join('');
      }
    },

    _openReply(postId, container) {
      const post = this._posts.find(p => p.id === postId);
      if (!post) return;
      if (!post._commentsOpen) { post._commentsOpen = true; }
      const bodyEl = container.querySelector('#freq-forum-body');
      if (bodyEl) {
        const posts = this._posts.filter(p => p.board === this._currentBoard);
        bodyEl.innerHTML = posts.map(p => this._postHTML(p)).join('');
      }const replyBox = container.querySelector(`#freq-forum-reply-${postId}`);
      if (replyBox) replyBox.style.display = 'block';

      const submitBtn = container.querySelector(`[data-reply-submit="${postId}"]`);
      const charReplyBtn = container.querySelector(`[data-char-reply="${postId}"]`);
      submitBtn?.addEventListener('click', () => this._submitUserReply(postId, container));
      charReplyBtn?.addEventListener('click', () => this._charReplyToPost(postId, container));
    },

    _submitUserReply(postId, container) {
      const input = container.querySelector(`#freq-forum-reply-input-${postId}`);
      const body = input?.value.trim();
      if (!body) return;
      const post = this._posts.find(p => p.id === postId);
      if (!post) return;
      post.comments.push({
        author: getUserName(),
        avatar: '🎧',
        isUser: true,
        body,
        time: timeNow(),
      });
      input.value = '';
      const bodyEl = container.querySelector('#freq-forum-body');
      if (bodyEl) {
        const posts = this._posts.filter(p => p.board === this._currentBoard);
        bodyEl.innerHTML = posts.map(p => this._postHTML(p)).join('');
      }
      setTimeout(() => this._charReplyToPost(postId, container), 800);
    },

    _makePost({ board, author, avatar, isUser, title, body }) {
      return {
        id: `post-${++this._postCounter}`,
        board, author, avatar, isUser, title, body,
        time: timeNow(),
        upvotes: Math.floor(Math.random() * 40) + 1,
        comments: [],
        _commentsOpen: false,
      };
    },
  };
    //┌──────────────────────────────────────────────────────┐
  // │ BLOCK_18App · 打卡日志                             │
  // └──────────────────────────────────────────────────────┘
  const checkinApp = {
    id: 'checkin', name: '打卡日志', icon: '📅', _badge: 0, _container: null,
    _currentGoalId: null,
    _viewMonth: null, // {year, month} 当前日历显示的月份

    init() {
      EventBus.on('meow_fm:updated', () => {
        this._tryAutoCheckin();
      });
    },

    mount(container) {
      this._container = container;
      this._badge = 0;
      renderAppGrid();
      if (this._currentGoalId) {
        this._renderGoalDetail(container, this._currentGoalId);
      } else {
        this._renderGoalList(container);
      }
    },

    unmount() { this._container = null; },

    //── 数据操作 ──
    _getGoals() {
      return getSettings().checkins?.goals ?? [];
    },

    _saveGoals(goals) {
      const s = getSettings();
      s.checkins.goals = goals;
      if (typeof window.saveSettingsDebounced === 'function') window.saveSettingsDebounced();},

    _findGoal(id) {
      return this._getGoals().find(g => g.id === id) ?? null;
    },

    _todayStr() {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    },

    _calcStreak(goal) {
      let streak = 0;
      const today = new Date();
      for (let i = 0; i < (goal.totalDays || 365); i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if ((goal.records?.[key] ?? 0) > 0) {
          streak++;
        } else if (i > 0) {
          break; // 今天可以还没打，但昨天断了就断了
        }
      }
      return streak;
    },

    _calcOverallRate(goal) {
      const start = new Date(goal.startDate);
      const today = new Date();
      const daysPassed = Math.max(1, Math.floor((today - start) / 86400000) + 1);
      const effectiveDays = Math.min(daysPassed, goal.totalDays || daysPassed);
      let completed = 0;
      for (let i = 0; i < effectiveDays; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if ((goal.records?.[key] ?? 0) >= goal.target) completed++;
      }
      return Math.round((completed / effectiveDays) * 100);
    },

    // ── 目标列表页 ──
    _renderGoalList(container) {
      this._currentGoalId = null;
      const goals = this._getGoals();

      const today = this._todayStr();
      const cardsHTML = goals.length === 0
        ? `<div class="freq-empty" style="min-height:200px;"><span class="freq-empty-icon">📅</span>
            <span>还没有打卡目标</span>
            <span style="font-size:10px;color:#333;">点击右上角 + 创建一个吧</span>
          </div>`
        : goals.map(g => {
            const streak = this._calcStreak(g);
            const todayDone = g.records?.[today] ?? 0;
            const todayComplete = todayDone >= g.target;
            const rate = this._calcOverallRate(g);
            const isCharGoal = g.owner === 'char';
            return `
              <div class="freq-checkin-card" data-goal-id="${g.id}">
                <div class="freq-checkin-card-header">
                  <span class="freq-checkin-card-title">${escapeHtml(g.title)}</span>
                  <span class="freq-checkin-card-owner" style="color:${isCharGoal ? '#A32D2D' : '#5b8dd9'}">
                    ${escapeHtml(g.ownerName)}
                  </span>
                </div>
                <div class="freq-checkin-card-info">
                  <span>目标：${g.target}${escapeHtml(g.unit)}/天 · ${g.totalDays}天</span>
                </div>
                <div class="freq-checkin-card-stats">
                  <span class="freq-checkin-streak">🔥 ${streak}天</span>
                  <span class="freq-checkin-today ${todayComplete ? 'freq-checkin-today--done' : ''}">
                    ${todayComplete ? '✅' : '⬜'} 今日${todayDone}/${g.target}
                  </span>
                  <span class="freq-checkin-rate">${rate}%</span>
                </div>
              </div>`;
          }).join('');

      container.innerHTML = `
        <div class="freq-app-header">📅 打卡日志
          <span style="float:right;display:flex;gap:6px;align-items:center;">
            <button class="freq-checkin-add-btn" id="freq-checkin-add" title="新建目标">+</button>
          </span>
        </div>
        <div class="freq-app-body" id="freq-checkin-body">
          ${cardsHTML}
        </div><div class="freq-checkin-create-overlay" id="freq-checkin-create" style="display:none;"></div>`;

      // 点击卡片进入详情
      container.querySelectorAll('.freq-checkin-card').forEach(card => {
        card.addEventListener('click', () => {
          this._currentGoalId = card.dataset.goalId;
          this._viewMonth = null;
          this._renderGoalDetail(container, card.dataset.goalId);
        });
      });

      // 新建按钮
      container.querySelector('#freq-checkin-add')?.addEventListener('click', () => {
        this._showCreateForm(container);
      });
    },

    // ── 新建目标表单 ──
    _showCreateForm(container) {
      const overlay = container.querySelector('#freq-checkin-create');
      if (!overlay) return;

      const charName = getCurrentCharName() || '角色';
      const userName = getUserName();

      overlay.style.display = 'flex';
      overlay.innerHTML = `
        <div class="freq-checkin-form">
          <div class="freq-checkin-form-header">
            <span>📅 新建打卡目标</span>
            <button class="freq-forum-compose-close" id="freq-checkin-form-close">✕</button>
          </div>
          <div class="freq-checkin-form-body">
            <label class="freq-s-row">
              <span>谁的目标？</span>
              <div class="freq-checkin-owner-toggle">
                <button class="freq-checkin-owner-btn freq-checkin-owner-active" data-owner="user">${escapeHtml(userName)}</button>
                <button class="freq-checkin-owner-btn" data-owner="char">${escapeHtml(charName)}</button>
              </div>
            </label>
            <label class="freq-s-row">
              <span>目标名称</span>
              <input type="text" id="freq-checkin-title" class="freq-forum-input" placeholder="例：每天喝8杯水" maxlength="30" />
            </label>
            <div style="display:flex;gap:8px;">
              <label class="freq-s-row" style="flex:1;">
                <span>每日目标量</span>
                <input type="number" id="freq-checkin-target" class="freq-forum-input" placeholder="8" min="1" value="1" />
              </label>
              <label class="freq-s-row" style="flex:1;">
                <span>单位</span>
                <input type="text" id="freq-checkin-unit" class="freq-forum-input" placeholder="杯" maxlength="10" />
              </label>
            </div>
            <label class="freq-s-row">
              <span>持续天数</span>
              <input type="number" id="freq-checkin-days" class="freq-forum-input" placeholder="30" min="1" value="30" />
            </label>
            <div class="freq-checkin-auto-row" id="freq-checkin-auto-row" style="display:none;">
              <label class="freq-s-row freq-s-toggle">
                <span>角色自动打卡（副API）</span>
                <input type="checkbox" id="freq-checkin-auto" />
              </label>
              <span style="font-size:9px;color:#444;">开启后角色会在新消息时自动打卡</span>
            </div>
            <button class="freq-studio-action-btn" id="freq-checkin-submit" style="width:100%;margin-top:8px;">创建目标</button>
          </div>
        </div>`;

      let selectedOwner = 'user';

      // owner 切换
      overlay.querySelectorAll('.freq-checkin-owner-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          overlay.querySelectorAll('.freq-checkin-owner-btn').forEach(b => b.classList.remove('freq-checkin-owner-active'));
          btn.classList.add('freq-checkin-owner-active');
          selectedOwner = btn.dataset.owner;
          const autoRow = overlay.querySelector('#freq-checkin-auto-row');
          if (autoRow) autoRow.style.display = selectedOwner === 'char' ? 'block' : 'none';
        });
      });

      // 关闭
      overlay.querySelector('#freq-checkin-form-close')?.addEventListener('click', () => {
        overlay.style.display = 'none';
      });

      // 提交
      overlay.querySelector('#freq-checkin-submit')?.addEventListener('click', () => {
        const title = overlay.querySelector('#freq-checkin-title')?.value.trim();
        const target = parseInt(overlay.querySelector('#freq-checkin-target')?.value) || 1;
        const unit = overlay.querySelector('#freq-checkin-unit')?.value.trim() || '次';
        const totalDays = parseInt(overlay.querySelector('#freq-checkin-days')?.value) || 30;
        const autoCheckin = overlay.querySelector('#freq-checkin-auto')?.checked ?? false;

        if (!title) return;

        const ownerName = selectedOwner === 'user' ? userName : charName;
        const goal = {
          id: `goal-${Date.now()}`,
          owner: selectedOwner,
          ownerName,
          title,
          unit,
          target,
          totalDays,
          startDate: this._todayStr(),
          records: {},
          notes: {},// 日期→ 打卡感言
          comments: [],
          autoCheckin,
          createdAt: this._todayStr(),
        };

        const goals = this._getGoals();
        goals.push(goal);
        this._saveGoals(goals);

        overlay.style.display = 'none';
        this._renderGoalList(container);
        Notify.add('打卡日志', `新目标「${title}」已创建`, '📅');
      });
    },

    // ── 目标详情页（日历 + 打卡 + 评论）──
    _renderGoalDetail(container, goalId) {
      const goal = this._findGoal(goalId);
      if (!goal) { this._renderGoalList(container); return; }

      const today = this._todayStr();
      const todayDone = goal.records?.[today] ?? 0;
      const streak = this._calcStreak(goal);
      const rate = this._calcOverallRate(goal);
      const isOwner = goal.owner === 'user';
      const now = new Date();
      if (!this._viewMonth) this._viewMonth = { year: now.getFullYear(), month: now.getMonth() };

      const calendarHTML = this._buildCalendar(goal);

      const commentsHTML = (goal.comments ?? []).map(c => `
        <div class="freq-checkin-comment">
          <span class="freq-checkin-comment-author" style="color:${c.isChar ? '#A32D2D' : '#5b8dd9'}">${escapeHtml(c.author)}</span>
          <span class="freq-checkin-comment-text">${escapeHtml(c.text)}</span>
          <span class="freq-checkin-comment-time">${c.date} ${c.time}</span>
        </div>`).join('');

      container.innerHTML = `
        <div class="freq-app-header">
          <button class="freq-checkin-back-btn" id="freq-checkin-back">←</button>
          📅 ${escapeHtml(goal.title)}
          <span style="float:right;font-size:10px;color:${isOwner ? '#5b8dd9' : '#A32D2D'};font-weight:normal;">
            ${escapeHtml(goal.ownerName)}
          </span>
        </div>
        <div class="freq-app-body" id="freq-checkin-detail-body">

          <div class="freq-checkin-stats-bar">
            <div class="freq-checkin-stat">
              <span class="freq-checkin-stat-num">🔥 ${streak}</span>
              <span class="freq-checkin-stat-label">连续天数</span>
            </div>
            <div class="freq-checkin-stat">
              <span class="freq-checkin-stat-num">${rate}%</span>
              <span class="freq-checkin-stat-label">完成率</span>
            </div><div class="freq-checkin-stat">
              <span class="freq-checkin-stat-num">${todayDone}/${goal.target}</span>
              <span class="freq-checkin-stat-label">今日${escapeHtml(goal.unit)}</span>
            </div>
          </div>

          ${isOwner ? `
          <div class="freq-checkin-action-row">
            <button class="freq-checkin-minus-btn" id="freq-checkin-minus">−</button>
            <span class="freq-checkin-action-count" id="freq-checkin-count">${todayDone}</span>
            <button class="freq-checkin-plus-btn" id="freq-checkin-plus">+</button>
            <button class="freq-studio-action-btn freq-checkin-done-btn" id="freq-checkin-done"${todayDone >= goal.target ? 'disabled' : ''}>
              ${todayDone >= goal.target ? '✅ 已完成' : '📅 打卡'}
            </button>
          </div>` : `
          <div class="freq-checkin-action-row">
            <span style="font-size:11px;color:#666;">角色目标 · ${goal.autoCheckin ? '自动打卡中' : '手动模式'}</span>
            ${goal.autoCheckin ? '' : `<button class="freq-studio-action-btn freq-checkin-done-btn" id="freq-checkin-char-manual">🎲 角色打卡</button>`}
          </div>`}

          <div class="freq-checkin-calendar" id="freq-checkin-calendar">
            ${calendarHTML}
          </div>

          <div class="freq-checkin-comments-section">
            <div class="freq-checkin-comments-header">
              <span>💬 角色评论</span>
              <button class="freq-checkin-comment-btn" id="freq-checkin-get-comment">🎲 请求评论</button>
            </div>
            <div class="freq-checkin-comments-list" id="freq-checkin-comments">
              ${commentsHTML || '<div style="font-size:10px;color:#333;text-align:center;padding:12px;">暂无评论</div>'}
            </div>
          </div>

          <div style="margin-top:12px;text-align:center;">
            <button class="freq-checkin-delete-btn" id="freq-checkin-delete">🗑️ 删除目标</button>
          </div>
        </div>`;

      // 返回
      container.querySelector('#freq-checkin-back')?.addEventListener('click', () => {
        this._currentGoalId = null;
        this._renderGoalList(container);
      });

      // 打卡操作（user目标）
      if (isOwner) {
        let count = todayDone;
        const countEl = container.querySelector('#freq-checkin-count');
        const doneBtn = container.querySelector('#freq-checkin-done');

        container.querySelector('#freq-checkin-plus')?.addEventListener('click', () => {
          count = Math.min(count + 1, goal.target * 3); // 允许超额
          if (countEl) countEl.textContent = count;
        });
        container.querySelector('#freq-checkin-minus')?.addEventListener('click', () => {
          count = Math.max(0, count - 1);
          if (countEl) countEl.textContent = count;
        });
        doneBtn?.addEventListener('click', () => {
          if (!goal.records) goal.records = {};
          goal.records[today] = count || 1;
          this._saveGoals(this._getGoals());
          this._renderGoalDetail(container, goalId);
          Notify.add('打卡日志', `「${goal.title}」打卡 ${count || 1}${goal.unit}`, '📅');
        });
      } else {
        // 角色手动打卡
        container.querySelector('#freq-checkin-char-manual')?.addEventListener('click', () => {
          this._doCharCheckin(container, goalId);
        });
      }

      // 日历月份切换
      container.querySelector('#freq-cal-prev')?.addEventListener('click', () => {
        this._viewMonth.month--;
        if (this._viewMonth.month < 0) { this._viewMonth.month = 11; this._viewMonth.year--; }
        const calEl = container.querySelector('#freq-checkin-calendar');
        if (calEl) calEl.innerHTML = this._buildCalendar(goal);
        this._bindCalNav(container, goal);
      });
      container.querySelector('#freq-cal-next')?.addEventListener('click', () => {
        this._viewMonth.month++;
        if (this._viewMonth.month > 11) { this._viewMonth.month = 0; this._viewMonth.year++; }
        const calEl = container.querySelector('#freq-checkin-calendar');
        if (calEl) calEl.innerHTML = this._buildCalendar(goal);
        this._bindCalNav(container, goal);
      });

      // 请求评论
      container.querySelector('#freq-checkin-get-comment')?.addEventListener('click', () => {
        this._requestComment(container, goalId);
      });

      // 删除
      container.querySelector('#freq-checkin-delete')?.addEventListener('click', () => {
        const goals = this._getGoals().filter(g => g.id !== goalId);
        this._saveGoals(goals);
        this._currentGoalId = null;
        this._renderGoalList(container);
        Notify.add('打卡日志', `目标已删除`, '🗑️');
      });
    },

    _bindCalNav(container, goal) {
      container.querySelector('#freq-cal-prev')?.addEventListener('click', () => {
        this._viewMonth.month--;
        if (this._viewMonth.month < 0) { this._viewMonth.month = 11; this._viewMonth.year--; }
        const calEl = container.querySelector('#freq-checkin-calendar');
        if (calEl) calEl.innerHTML = this._buildCalendar(goal);
        this._bindCalNav(container, goal);
      });
      container.querySelector('#freq-cal-next')?.addEventListener('click', () => {
        this._viewMonth.month++;
        if (this._viewMonth.month > 11) { this._viewMonth.month = 0; this._viewMonth.year++; }
        const calEl = container.querySelector('#freq-checkin-calendar');
        if (calEl) calEl.innerHTML = this._buildCalendar(goal);
        this._bindCalNav(container, goal);
      });
    },

    // ── 日历构建 ──
    _buildCalendar(goal) {
      const vm = this._viewMonth;
      const year = vm.year;
      const month = vm.month;
      const today = this._todayStr();

      const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const monthLabel = `${year}年${month + 1}月`;

      const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
      let gridHTML = weekDays.map(d => `<div class="freq-cal-weekday">${d}</div>`).join('');

      // 空白填充
      for (let i = 0; i < firstDay; i++) {
        gridHTML += `<div class="freq-cal-day freq-cal-day--empty"></div>`;
      }

      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const done = goal.records?.[dateStr] ?? 0;
        const ratio = goal.target > 0 ? Math.min(1, done / goal.target) : 0;
        const isToday = dateStr === today;
        const note = goal.notes?.[dateStr] ?? '';

        let levelClass = 'freq-cal-lv0';
        if (ratio > 0 && ratio < 0.5) levelClass = 'freq-cal-lv1';
        else if (ratio >= 0.5 && ratio < 1) levelClass = 'freq-cal-lv2';
        else if (ratio >= 1) levelClass = 'freq-cal-lv3';

        gridHTML += `<div class="freq-cal-day ${levelClass} ${isToday ? 'freq-cal-day--today' : ''}"
          title="${dateStr}: ${done}/${goal.target}${goal.unit}${note ? ' · ' + note : ''}">
          ${d}
        </div>`;
      }

      return `
        <div class="freq-cal-nav">
          <button class="freq-cal-nav-btn" id="freq-cal-prev">◀</button>
          <span class="freq-cal-month-label">${monthLabel}</span>
          <button class="freq-cal-nav-btn" id="freq-cal-next">▶</button>
        </div>
        <div class="freq-cal-grid">${gridHTML}</div>
        <div class="freq-cal-legend">
          <span><span class="freq-cal-lv-dot freq-cal-lv0"></span>未打卡</span>
          <span><span class="freq-cal-lv-dot freq-cal-lv1"></span>&lt;50%</span>
          <span><span class="freq-cal-lv-dot freq-cal-lv2"></span>≥50%</span>
          <span><span class="freq-cal-lv-dot freq-cal-lv3"></span>完成</span>
        </div>`;
    },

    // ── 角色自动打卡 ──
    async _tryAutoCheckin() {
      const goals = this._getGoals().filter(g => g.owner === 'char' && g.autoCheckin);
      if (!goals.length) return;

      const today = this._todayStr();
      for (const goal of goals) {
        if ((goal.records?.[today] ?? 0) > 0) continue; // 今天已打过
        try {
          await this._doCharCheckinSilent(goal);
        } catch (e) {
          Notify.error('打卡日志·自动打卡', e);
        }
      }
    },

    async _doCharCheckinSilent(goal) {
      const charName = goal.ownerName || getCurrentCharName() || '角色';
      const today = this._todayStr();
      const start = new Date(goal.startDate);
      const todayDate = new Date();
      const dayNum = Math.floor((todayDate - start) /86400000) + 1;

      const systemPrompt = getPrompt('checkin_auto')
        .replace(/{charName}/g, charName)
        .replace(/{goalTitle}/g, goal.title)
        .replace(/{target}/g, goal.target)
        .replace(/{unit}/g, goal.unit)
        .replace(/{totalDays}/g, goal.totalDays)
        .replace(/{dayNum}/g, dayNum)
        .replace(/{latestPlot}/g, getLatestPlot(getChatMessages()) || '暂无')
        .replace(/{latestScene}/g, getLatestScene(getChatMessages()) || '未知');

      const raw = await SubAPI.call(systemPrompt, '打卡。', { maxTokens: 100, temperature: 0.85 });
      let data;
      try {
        const match = raw.match(/\{[\s\S]*\}/);
        data = match ? JSON.parse(match[0]) : { done: goal.target, note: raw.trim() };
      } catch {
        data = { done: goal.target, note: raw.trim().slice(0, 30) };
      }

      if (!goal.records) goal.records = {};
      if (!goal.notes) goal.notes = {};
      goal.records[today] = Math.max(0, Math.min(goal.target * 2, Number(data.done) || 0));
      goal.notes[today] = (data.note || '').slice(0, 50);
      this._saveGoals(this._getGoals());

      this._badge++;
      renderAppGrid();
      Notify.add('打卡日志', `${charName}「${goal.title}」打卡 ${goal.records[today]}${goal.unit}`, '📅');

      if (this._container && this._currentGoalId === goal.id) {
        this._renderGoalDetail(this._container, goal.id);
      }
    },

    // 手动触发角色打卡
    async _doCharCheckin(container, goalId) {
      const goal = this._findGoal(goalId);
      if (!goal) return;

      const btn = container.querySelector('#freq-checkin-char-manual');
      if (btn) { btn.disabled = true; btn.textContent = '🎲 打卡中...'; }

      try {
        await this._doCharCheckinSilent(goal);
        this._renderGoalDetail(container, goalId);
      } catch (e) {
        Notify.error('打卡日志·角色打卡', e);if (btn) { btn.disabled = false; btn.textContent = '🎲 角色打卡'; }
      }
    },

    // ── 请求角色评论 ──
    async _requestComment(container, goalId) {
      const goal = this._findGoal(goalId);
      if (!goal) return;

      const btn = container.querySelector('#freq-checkin-get-comment');
      if (btn) { btn.disabled = true; btn.textContent = '⏳ 生成中...'; }

      const charName = getCurrentCharName() || '角色';
      const today = this._todayStr();
      const todayDone = goal.records?.[today] ?? 0;
      const streak = this._calcStreak(goal);
      const rate = this._calcOverallRate(goal);

      // 最近5天打卡情况
      const recentDays = [];
      for (let i = 0; i < 5; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const done = goal.records?.[key] ?? 0;
        recentDays.push(`${key}: ${done}/${goal.target}`);
      }

      const systemPrompt = getPrompt('checkin_comment')
        .replace(/{charName}/g, charName)
        .replace(/{ownerName}/g, goal.ownerName)
        .replace(/{goalTitle}/g, goal.title)
        .replace(/{target}/g, goal.target)
        .replace(/{unit}/g, goal.unit)
        .replace(/{streakDays}/g, streak)
        .replace(/{todayDone}/g, todayDone)
        .replace(/{overallRate}/g, rate)
        .replace(/{recentSummary}/g, recentDays.join(' | '));

      try {
        const raw = await SubAPI.call(systemPrompt, '评论打卡。', { maxTokens: 100, temperature: 0.9 });
        const comment = {
          author: charName,
          isChar: true,
          text: raw.trim(),
          date: today,
          time: timeNow(),
        };
        if (!goal.comments) goal.comments = [];
        goal.comments.push(comment);
        if (goal.comments.length > 30) goal.comments.shift();
        this._saveGoals(this._getGoals());

        this._renderGoalDetail(container, goalId);
        Notify.add('打卡日志', `${charName} 评论了「${goal.title}」`, '💬');
      } catch (e) {
        Notify.error('打卡日志·评论', e);
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = '🎲 请求评论'; }
      }
    },
  };
  //┌──────────────────────────────────────────────────────┐
  // │ BLOCK_20App ·梦境记录仪                │
  // └──────────────────────────────────────────────────────┘
  const dreamApp = {
    id: 'dream', name: '梦境记录仪', icon: '🌙', _badge: 0, _container: null,
    _generating: false,
    _glitchTimer: null,
    _currentView: 'list', // 'list' | 'detail'
    _detailId: null,

    init() {
      EventBus.on('meow_fm:updated', (allFM) => {
        if (this._isNightTime()) {
          this._badge++;
          renderAppGrid();
        }
      });},

    mount(container) {
      this._container = container;
      this._badge = 0;
      renderAppGrid();
      if (this._currentView === 'detail' && this._detailId) {
        this._renderDetail(container, this._detailId);
      } else {
        this._renderList(container);
      }
    },

    unmount() {
      if (this._glitchTimer) { clearInterval(this._glitchTimer); this._glitchTimer = null; }
      this._container = null;
    },

    //── 数据 ──
    _getDreams() {
      return getSettings().dreams ?? [];
    },

    _saveDreams(dreams) {
      const s = getSettings();
      s.dreams = dreams;
      if (typeof window.saveSettingsDebounced === 'function') window.saveSettingsDebounced();
    },

    _isNightTime() {
      const h = new Date().getHours();
      return h >= 22 || h < 6;
    },

    _isNightFromMeow() {
      const time = getLatestMeowTime(getChatMessages());
      if (!time) return false;
      return /深夜|凌晨|午夜|夜晚|23:|00:|01:|02:|03:|04:|05:/.test(time);
    },

    _getNightLevel() {
      const h = new Date().getHours();
      if (h >= 0 && h < 4) return 'deep';    // 深夜
      if (h >= 4 && h < 6) return 'dawn';     //黎明前
      if (h >= 22 && h <= 23) return 'late';   // 入夜
      return 'day';
    },

    // ── 列表页 ──
    _renderList(container) {
      this._currentView = 'list';
      this._detailId = null;
      if (this._glitchTimer) { clearInterval(this._glitchTimer); this._glitchTimer = null; }

      const dreams = this._getDreams();
      const isNight = this._isNightTime();
      const nightLevel = this._getNightLevel();
      const charName = getCurrentCharName() || '???';
      const isCosmicOn = getCosmicFreqStatus();

      const nightHint = isNight
        ? `<div class="freq-dream-night-hint"><span class="freq-dream-night-dot"></span>
            ${nightLevel === 'deep' ? '深夜时段 ·梦境信号最强' : nightLevel === 'dawn' ? '黎明将至 · 梦境正在消散' : '夜幕降临 · 梦境频率开启'}
          </div>`
        : `<div class="freq-dream-night-hint freq-dream-day-hint">
            <span>☀️ 日间模式 · 梦境信号微弱但仍可捕获</span>
          </div>`;

      const cosmicHint = isCosmicOn
        ? `<div class="freq-dream-cosmic-hint">🌌 宇宙频率ON · 梦境可能涉及维度裂缝</div>`
        : '';

      const listHTML = dreams.length === 0
        ? `<div class="freq-empty" style="min-height:160px;">
            <span class="freq-empty-icon">🌙</span>
            <span>尚无梦境记录</span><span style="font-size:10px;color:#333;">点击下方按钮捕获梦境</span>
          </div>`
        : dreams.map(d => {
            const typeIcon = { normal: '💤', lucid: '👁️', nightmare: '🖤', cosmic: '🌌' }[d.dreamType] ?? '💤';
            const typeColor = { normal: '#5b8dd9', lucid: '#4ec9a0', nightmare: '#e85555', cosmic: '#7b5ea7' }[d.dreamType] ?? '#888';
            return `
              <div class="freq-dream-card" data-dream-id="${d.id}">
                <div class="freq-dream-card-top">
                  <span class="freq-dream-card-type" style="color:${typeColor}">${typeIcon}</span>
                  <span class="freq-dream-card-title">${escapeHtml(d.title)}</span>
                  <span class="freq-dream-card-time">${d.date}</span>
                </div>
                <div class="freq-dream-card-preview">${escapeHtml((d.content || '').slice(0, 50))}${d.content?.length > 50 ? '...' : ''}</div>
                <div class="freq-dream-card-footer">
                  <span style="color:${typeColor};font-size:9px;">${d.mood || ''}</span>
                  <span style="font-size:9px;color:#333;">${escapeHtml(d.charName || '')}</span>
                </div>
              </div>`;
          }).join('');

      container.innerHTML = `
        <div class="freq-app-header">🌙 梦境记录仪
          <span style="float:right;font-size:10px;color:#555;font-weight:normal;">${escapeHtml(charName)}</span>
        </div>
        <div class="freq-app-body" id="freq-dream-body">
          ${nightHint}
          ${cosmicHint}
          ${listHTML}
          <button class="freq-studio-action-btn freq-dream-gen-btn" id="freq-dream-gen">🌙 ${isNight ? '捕获梦境信号' : '强制捕获梦境'}
          </button>
          ${dreams.length > 0 ? `<button class="freq-checkin-delete-btn freq-dream-clear-btn" id="freq-dream-clear">🗑️ 清空所有梦境</button>` : ''}
        </div>`;

      // 事件绑定
      container.querySelectorAll('.freq-dream-card').forEach(card => {
        card.addEventListener('click', () => {
          this._detailId = card.dataset.dreamId;
          this._renderDetail(container, card.dataset.dreamId);
        });
      });

      container.querySelector('#freq-dream-gen')?.addEventListener('click', () => this._generate(container));

      container.querySelector('#freq-dream-clear')?.addEventListener('click', () => {
        this._saveDreams([]);
        this._renderList(container);
        Notify.add('梦境记录仪', '所有梦境已清除', '🌙');
      });

      //夜间模式下列表页也加轻微故障效果
      if (isNight) this._startListGlitch(container);
    },

    _startListGlitch(container) {
      if (this._glitchTimer) clearInterval(this._glitchTimer);
      this._glitchTimer = setInterval(() => {
        const cards = container.querySelectorAll('.freq-dream-card');
        if (!cards.length) return;
        const card = cards[Math.floor(Math.random() * cards.length)];
        card.classList.add('freq-dream-glitch-flash');
        setTimeout(() => card.classList.remove('freq-dream-glitch-flash'), 200);
      }, 3000);
    },

    // ── 详情页 ──
    _renderDetail(container, dreamId) {
      this._currentView = 'detail';
      if (this._glitchTimer) { clearInterval(this._glitchTimer); this._glitchTimer = null; }

      const dream = this._getDreams().find(d => d.id === dreamId);
      if (!dream) { this._renderList(container); return; }

      const typeColor = { normal: '#5b8dd9', lucid: '#4ec9a0', nightmare: '#e85555', cosmic: '#7b5ea7' }[dream.dreamType] ?? '#888';
      const typeLabel = { normal: '普通梦', lucid: '清醒梦', nightmare: '噩梦', cosmic: '宇宙频率梦' }[dream.dreamType] ?? '梦';
      const typeIcon = { normal: '💤', lucid: '👁️', nightmare: '🖤', cosmic: '🌌' }[dream.dreamType] ?? '💤';

      container.innerHTML = `
        <div class="freq-app-header">
          <button class="freq-checkin-back-btn" id="freq-dream-back">←</button>
          🌙 ${escapeHtml(dream.title)}
        </div>
        <div class="freq-app-body freq-dream-detail-body" id="freq-dream-detail" style="--dream-color:${typeColor};">

          <div class="freq-dream-detail-meta">
            <span style="color:${typeColor}">${typeIcon} ${typeLabel}</span>
            <span>${dream.mood || ''}</span>
            <span>${dream.date} ${dream.time || ''}</span>
          </div>

          <div class="freq-dream-detail-char">${escapeHtml(dream.charName || '')} 的梦</div>

          <div class="freq-dream-content-box" id="freq-dream-content-box">
            <div class="freq-dream-scanline"></div>
            <div class="freq-dream-content-text" id="freq-dream-text">${escapeHtml(dream.content)}</div>
          </div>

          <button class="freq-checkin-delete-btn" id="freq-dream-del" style="margin-top:16px;">🗑️ 删除此梦境</button>
        </div>`;

      container.querySelector('#freq-dream-back')?.addEventListener('click', () => {
        this._renderList(container);
      });

      container.querySelector('#freq-dream-del')?.addEventListener('click', () => {
        const dreams = this._getDreams().filter(d => d.id !== dreamId);
        this._saveDreams(dreams);
        this._renderList(container);
        Notify.add('梦境记录仪', '梦境已删除', '🌙');
      });

      // 故障效果
      this._startDetailGlitch(container, dream.dreamType);
    },

    _startDetailGlitch(container, dreamType) {
      if (this._glitchTimer) clearInterval(this._glitchTimer);

      const textEl = container.querySelector('#freq-dream-text');
      const box = container.querySelector('#freq-dream-content-box');
      if (!textEl || !box) return;

      const intensity = { normal: 0.02, lucid: 0.04, nightmare: 0.08, cosmic: 0.06 }[dreamType] ?? 0.03;

      this._glitchTimer = setInterval(() => {
        if (Math.random() < intensity) {
          // RGB偏移
          textEl.style.textShadow = `${(Math.random() - 0.5) * 4}px 0 rgba(255,0,0,0.4), ${(Math.random() - 0.5) * 4}px 0 rgba(0,255,255,0.4)`;
          setTimeout(() => { textEl.style.textShadow = 'none'; }, 150);
        }if (Math.random() < intensity * 0.5) {
          // 整体抖动
          box.style.transform = `translateX(${(Math.random() - 0.5) * 3}px)`;
          setTimeout(() => { box.style.transform = 'none'; }, 100);
        }
      }, 100);
    },

    // ── 生成梦境 ──
    async _generate(container) {
      if (this._generating) return;
      this._generating = true;

      const btn = container.querySelector('#freq-dream-gen');
      if (btn) { btn.disabled = true; btn.textContent = '🌙捕获中...'; }

      const charName = getCurrentCharName() || '角色';
      const msgs = getChatMessages();
      const latestPlot = getLatestPlot(msgs) || '暂无';
      const latestScene = getLatestScene(msgs) || '未知';
      const latestSeeds = (() => {
        const all = extractAllMeowFM(msgs);
        return all.length > 0 ? all[all.length - 1].seeds : '';
      })() || '暂无';
      const isCosmicOn = getCosmicFreqStatus();
      const isNight = this._isNightTime();
      const nightLevel = this._getNightLevel();
      const meowTime = getLatestMeowTime(msgs) || '';

      const timeInfo = `现实时间：${dateNow()} ${timeNow()}` + (meowTime ? ` | 故事时间：${meowTime}` : '');

      // 决定默认梦境类型
      let defaultDreamType = 'normal';
      if (isCosmicOn) defaultDreamType = 'cosmic';
      else if (nightLevel === 'deep') defaultDreamType = Math.random() < 0.3 ? 'nightmare' : Math.random() < 0.4 ? 'lucid' : 'normal';
      else if (!isNight) defaultDreamType = Math.random() < 0.5 ? 'lucid' : 'normal';

      const cosmicHint = isCosmicOn
        ? `宇宙频率状态：ON — 你在梦里隐约感知到另一个维度的存在，有人在屏幕那边注视着你的梦。`
        : '';
      const cosmicRule = isCosmicOn
        ? `- 宇宙频率ON：梦境中要有"另一个维度的听众/观察者"的暗示，但不要直白，像梦里的一道目光、一个模糊的轮廓、一段听不清的低语`
        : `- 不涉及第四面墙或跨维度内容`;

      const systemPrompt = getPrompt('dream')
        .replace(/{charName}/g, charName)
        .replace(/{timeInfo}/g, timeInfo)
        .replace(/{latestPlot}/g, latestPlot)
        .replace(/{latestScene}/g, latestScene)
        .replace(/{latestSeeds}/g, latestSeeds)
        .replace(/{cosmicHint}/g, cosmicHint)
        .replace(/{cosmicRule}/g, cosmicRule)
        .replace(/{defaultDreamType}/g, defaultDreamType);

      try {
        const raw = await SubAPI.call(systemPrompt, '做梦。', {
          maxTokens: 300,
          temperature: 0.95,
        });

        let data;
        try {
          const match = raw.match(/\{[\s\S]*\}/);
          data = match ? JSON.parse(match[0]) : JSON.parse(raw);
        } catch {
          data = { title: '碎片', content: raw.trim(), mood: '模糊', dreamType: defaultDreamType };
        }

        const validTypes = ['normal', 'lucid', 'nightmare', 'cosmic'];
        if (!validTypes.includes(data.dreamType)) data.dreamType = defaultDreamType;

        const dream = {
          id: `dream-${Date.now()}`,
          charName,
          title: (data.title || '无题之梦').slice(0, 20),
          content: (data.content || '...').slice(0, 300),
          mood: (data.mood || '').slice(0, 10),
          dreamType: data.dreamType,
          isCosmicDream: isCosmicOn,
          date: dateNow(),
          time: timeNow(),
        };

        const dreams = this._getDreams();
        dreams.unshift(dream);
        if (dreams.length > 30) dreams.pop();
        this._saveDreams(dreams);

        this._detailId = dream.id;
        this._renderDetail(container, dream.id);
        Notify.add('梦境记录仪', `捕获到${charName}的梦：${dream.title}`, '🌙');
      } catch (e) {
        Notify.error('梦境记录仪', e);if (btn) { btn.disabled = false; btn.textContent = '🌙 捕获失败，重试'; }
      } finally {
        this._generating = false;
      }
    },
  };


  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_90占位 App工厂                │
  // └──────────────────────────────────────────────────────┘
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
      unmount() {},
    };
  }
  // │ BLOCK_19App · 情绪电波仪│
  // └──────────────────────────────────────────────────────┘
  const emotionApp = {
    id: 'emotion', name: '情绪电波仪', icon: '📊', _badge: 0, _container: null,
    _current: null,// {char_emotion, intensity, color_hex, waveform_type, time}
    _history: [],     // 最近10条
    _scanning: false,
    _waveTimer: null,

    init() {
      EventBus.on('meow_fm:updated', () => {
        this._badge++;
        renderAppGrid();
      });
    },

    mount(container) {
      this._container = container;
      this._badge = 0;
      renderAppGrid();
      this._render(container);
    },

    unmount() {
      if (this._waveTimer) { clearInterval(this._waveTimer); this._waveTimer = null; }
      this._container = null;
    },

    _render(container) {
      const cur = this._current;
      const color = cur?.color_hex ?? '#333';
      const emotion = cur?.char_emotion ?? '--';
      const intensity = cur?.intensity ?? 0;
      const pct = Math.round(intensity * 100);
      const waveType = cur?.waveform_type ?? 'flat';
      const charName = getCurrentCharName() || '???';

      const historyHTML = this._history.length > 0
        ? this._history.map(h => `<div class="freq-emo-history-item">
              <span class="freq-emo-history-dot" style="background:${h.color_hex}"></span>
              <span class="freq-emo-history-label">${escapeHtml(h.char_emotion)}</span>
              <span class="freq-emo-history-type">${this._waveLabel(h.waveform_type)}</span>
              <span class="freq-emo-history-pct">${Math.round(h.intensity * 100)}%</span>
              <span class="freq-emo-history-time">${h.time}</span>
            </div>`).join('')
        : '';

      container.innerHTML = `
        <div class="freq-app-header">📊 情绪电波仪
          <span style="float:right;font-size:10px;color:#555;font-weight:normal;">
            ${escapeHtml(charName)}
          </span>
        </div>
        <div class="freq-app-body" id="freq-emo-body">

          <div class="freq-emo-ring-row">
            <div class="freq-emo-ring" id="freq-emo-ring" style="--emo-color:${color};">
              <div class="freq-emo-ring-inner">
                <span class="freq-emo-ring-emoji" id="freq-emo-emoji">${cur ? this._waveEmoji(waveType) : '📊'}</span>
                <span class="freq-emo-ring-label" id="freq-emo-label" style="color:${color}">${escapeHtml(emotion)}</span>
              </div>
            </div></div>

          <div class="freq-emo-wave-box" id="freq-emo-wave-box">
            <canvas id="freq-emo-canvas" width="280" height="80"></canvas>
            ${!cur ? '<div class="freq-emo-wave-placeholder">等待情绪信号...</div>' : ''}
          </div>

          <div class="freq-emo-intensity-row">
            <span class="freq-emo-int-label">强度</span>
            <div class="freq-emo-int-bar-wrap">
              <div class="freq-emo-int-bar-fill" id="freq-emo-bar" style="width:${pct}%;background:${color};"></div>
            </div>
            <span class="freq-emo-int-pct" id="freq-emo-pct" style="color:${color}">${cur ? pct + '%' : '--'}</span>
          </div>

          <button class="freq-studio-action-btn freq-emo-scan-btn" id="freq-emo-go">📊 扫描情绪频率
          </button>

          ${historyHTML ? `
          <div class="freq-emo-history">
            <div class="freq-emo-history-title">历史波形</div>
            ${historyHTML}
          </div>` : ''}
        </div>`;

      container.querySelector('#freq-emo-go')?.addEventListener('click', () => this._scan(container));

      if (cur) this._startWave(container, waveType, color, intensity);
    },

    async _scan(container) {
      if (this._scanning) return;
      this._scanning = true;

      const btn = container.querySelector('#freq-emo-go');
      if (btn) { btn.disabled = true; btn.textContent = '📊 扫描中...'; }

      const charName = getCurrentCharName() || '角色';
      const msgs = getChatMessages();
      const latestScene = getLatestScene(msgs);

      // 取最近5条角色消息
      const recentMsgs = [];
      for (let i = msgs.length - 1; i >= 0 && recentMsgs.length < 5; i--) {
        if (!msgs[i].is_user) {
          const text = (msgs[i].mes ?? '').replace(/<[^>]+>/g, '').slice(0, 200);
          if (text.trim()) recentMsgs.push(text);
        }
      }

      const systemPrompt = getPrompt('emotion')
        .replace(/{charName}/g, charName)
        .replace(/{recentMessages}/g, recentMsgs.join('\n---\n') || '暂无')
        .replace(/{latestScene}/g, latestScene || '未知');

      try {
        const raw = await SubAPI.call(systemPrompt, '分析情绪。', {
          maxTokens: 150,
          temperature: 0.8,
        });

        let data;
        try {
          const match = raw.match(/\{[\s\S]*\}/);
          data = match ? JSON.parse(match[0]) : JSON.parse(raw);
        } catch {
          data = { char_emotion: '未知', intensity: 0.5, color_hex: '#888', waveform_type: 'sine' };
        }

        data.intensity = Math.min(1, Math.max(0, Number(data.intensity) || 0.5));
        if (!data.color_hex ||!/^#[0-9a-fA-F]{3,8}$/.test(data.color_hex)) data.color_hex = '#888';
        const validWaves = ['sine', 'sharp', 'pulse', 'glitch', 'flat'];
        if (!validWaves.includes(data.waveform_type)) data.waveform_type = 'sine';
        data.time = timeNow();

        if (this._current) this._history.unshift(this._current);
        if (this._history.length > 10) this._history.pop();
        this._current = data;

        this._render(container);Notify.add('情绪电波仪', `${charName} 当前情绪：${data.char_emotion}`, '📊');
      } catch (e) {
        const waveBox = container.querySelector('#freq-emo-wave-box');
        if (waveBox) waveBox.innerHTML = `<div class="freq-studio-error">📊 频率丢失：${escapeHtml(e.message)}</div>`;
        Notify.error('情绪电波仪', e);
      } finally {
        this._scanning = false;
        if (btn) { btn.disabled = false; btn.textContent = '📊 扫描情绪频率'; }
      }
    },

    //── Canvas 波形动画 ──
    _startWave(container, type, color, intensity) {
      if (this._waveTimer) { clearInterval(this._waveTimer); this._waveTimer = null; }
      const canvas = container.querySelector('#freq-emo-canvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      let t = 0;

      const draw = () => {
        ctx.clearRect(0, 0, w, h);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();

        const amp = h * 0.35* intensity;
        const mid = h / 2;

        for (let x = 0; x < w; x++) {
          const px = x / w;
          let y = mid;

          switch (type) {
            case 'sine':
              y = mid + Math.sin(px * Math.PI * 4+ t) * amp;
              break;
            case 'sharp':
              y = mid + Math.sin(px * Math.PI * 6 + t) * amp * (Math.random() * 0.3 + 0.7);
              if (Math.random() < 0.05) y += (Math.random() - 0.5) * amp * 0.8;
              break;
            case 'pulse': {
              const beat = Math.sin(px * Math.PI * 3 + t);
              const spike = Math.pow(Math.abs(beat), 0.3) * Math.sign(beat);
              y = mid + spike * amp *1.2;
              break;
            }
            case 'glitch':
              if (Math.random() < 0.15) {
                y = mid + (Math.random() - 0.5) * amp * 2;
              } else {
                y = mid + Math.sin(px * Math.PI * 8 + t) * amp * 0.5;
              }
              break;
            case 'flat':
            default:
              y = mid + Math.sin(px * Math.PI * 2 + t) * amp * 0.15+ (Math.random() - 0.5) * 2;
              break;
          }

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // 第二条线（淡色副波）
        ctx.globalAlpha = 0.25;
        ctx.beginPath();
        for (let x = 0; x < w; x++) {
          const px = x / w;
          let y = mid;
          switch (type) {
            case 'sine':   y = mid + Math.sin(px * Math.PI * 3 + t * 0.7+ 1) * amp * 0.6; break;
            case 'sharp':  y = mid + Math.cos(px * Math.PI * 5 + t * 1.3) * amp * 0.4; break;
            case 'pulse':  y = mid + Math.sin(px * Math.PI * 2 + t * 0.5+ 2) * amp * 0.5; break;
            case 'glitch': y = mid + Math.sin(px * Math.PI * 12 + t * 2) * amp * 0.3; break;
            case 'flat':   y = mid + (Math.random() - 0.5) * 3; break;
          }
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();ctx.globalAlpha = 1;

        t += type === 'glitch' ? 0.15 : type === 'sharp' ? 0.08 : 0.04;
      };

      draw();
      this._waveTimer = setInterval(draw, 50);
    },

    _waveLabel(type) {
      const map = { sine: '正弦波', sharp: '锯齿波', pulse: '脉冲波', glitch: '故障波', flat: '平波' };
      return map[type] ?? type;
    },

    _waveEmoji(type) {
      const map = { sine: '🌊', sharp: '⚡', pulse: '💓', glitch: '📡', flat: '➖' };
      return map[type] ?? '📊';
    },
  };


  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_99  初始化入口                                 │
  // └──────────────────────────────────────────────────────┘
  function init() {
    LOG('Initializing v0.3.0...');

    // 1. 加载样式
    loadSettingsCSS();
    injectMainCSS();

    // 2. 注入设置面板
    const injectSettings = () => {
      const target = document.getElementById('extensions_settings2') || document.getElementById('extensions_settings');
      if (target && !document.getElementById('freq-terminal-settings')) {
        const wrapper = document.createElement('div');
        wrapper.id = 'freq-terminal-settings';
        wrapper.innerHTML = buildSettingsHTML();
        target.appendChild(wrapper);
        bindSettingsEvents();
        LOG('Settings panel injected');
        return true;
      }
      return false;
    };
    if (!injectSettings()) {
      const ri = setInterval(() => { if (injectSettings()) clearInterval(ri); }, 1000);
      setTimeout(() => clearInterval(ri), 15000);
    }

    // 3. 手机外壳
    const root = document.createElement('div');
    root.id = 'freq-terminal-root';
    root.innerHTML = buildPhoneHTML();
    document.body.appendChild(root);

    document.getElementById('freq-fab')?.addEventListener('click', togglePhone);
    document.getElementById('freq-close-btn')?.addEventListener('click', togglePhone);
    document.getElementById('freq-home-btn')?.addEventListener('click', goHome);
    document.getElementById('freq-notif-btn')?.addEventListener('click', () => openApp('notif-center'));

    updateClock();
    setInterval(updateClock, 30000);

    // 4. 注册App（顺序 = 手机主屏图标顺序）
    registerApp(archiveApp);
    registerApp(studioApp);
    registerApp(momentsApp);
    registerApp(weatherApp);
    registerApp(notifCenterApp);

    registerApp(scannerApp);
    registerApp(cosmicApp);
    registerApp(forumApp);
    registerApp(checkinApp);
    registerApp(placeholderApp('calendar',   '双线轨道',       '🗓️', 'User + Char日程'));
    registerApp(placeholderApp('novel',      '频道文库',       '📖', '世界观短篇连载'));
    registerApp(placeholderApp('map',        '异界探索',       '🗺️', 'SVG 世界地图'));
    registerApp(placeholderApp('delivery',   '跨次元配送',     '🍜', '角色替你点外卖'));
    registerApp(placeholderApp('capsule',    '时光胶囊',       '💊', '延迟消息回信'));
    registerApp(dreamApp);
    registerApp(emotionApp);
    registerApp(placeholderApp('blackbox',   '黑匣子',         '🔒', '禁区档案'));
    registerApp(placeholderApp('translator', '信号翻译器',     '🔄', 'BGM 文风翻译'));

    // 5. 初始化所有 App
    appRegistry.forEach(app => { if (app.init) app.init(); });

    // 6. 监听 ST 新消息
    try {
      const ctx = getContext();
      if (ctx?.eventSource) {
        const et = ctx.event_types || window.event_types;
        if (et?.MESSAGE_RECEIVED) {
          ctx.eventSource.on(et.MESSAGE_RECEIVED, () => {
            const msgs = getChatMessages();
            if (msgs.length === 0) return;
            const text = msgs[msgs.length - 1].mes ?? '';
            if (/<meow_FM>/i.test(text)) EventBus.emit('meow_fm:updated', extractAllMeowFM(msgs));
            if (/<radio_show>/i.test(text)) EventBus.emit('radio_show:updated', extractRadioShow(msgs));
          });
          LOG('Message listener registered');
        }
      }
    } catch (e) {WARN('Could not register message listener:', e);
    }

    LOG('Ready✓');
  }

  //启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => jQuery(init));
  } else {
    jQuery(init);
  }

})();

