// ╔══════════════════════════════════════════════════════════╗
// ║  📻 FREQ · TERMINAL —频率终端                ║
// ║  「失真电台」专属SillyTavern 插件 v0.3.0                ║
// ║  区块制架构                ║
// ╚══════════════════════════════════════════════════════════╝

(function () {
  'use strict';

  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_00  常量 + 工具函数│
  // └──────────────────────────────────────────────────────┘
  const EXTENSION_NAME = 'freq-terminal';
  const LOG = (msg, ...args) => console.log('[FreqTerminal]', msg, ...args);
  const WARN = (msg, ...args) => console.warn('[FreqTerminal]', msg, ...args);
  const ERR = (msg, ...args) => console.error('[FreqTerminal]', msg, ...args);

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
        weatherKey: '',};
    }
    return window.extension_settings[EXTENSION_NAME];
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
    // 优先从最新 radio_show 的 STATUS 字段判断
    const radioShow = extractRadioShow(msgs);
    if (radioShow?.status) {
      const s = radioShow.status.toUpperCase();
      if (s.includes('ON') || s.includes('开启') || s.includes('激活')) return true;
      if (s.includes('OFF') || s.includes('关闭') || s.includes('待机')) return false;
    }
    // 降级：从最新 meow_FM 的 seeds 字段推断
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
          if (!content) throw new Error('API 返回空内容');
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
    app._badge = app._badge ??0;
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
            <button class="freq-bar-btn" id="freq-notif-btn" title="通知中心">🔔<span class="freq-badge freq-notif-badge" id="freq-notif-badge" style="display:none;">0</span>
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
      if (app?.unmount) app.unmount();
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
    if (el) el.textContent = timeNow();
  }

  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_07  Settings Panel —扩展设置面板              │
  // └──────────────────────────────────────────────────────┘
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
              <input type="text" id="freq_weather_key" class="text_pole" placeholder="信号气象站使用" value="${s.weatherKey ?? ''}" />
            </label>
            <div id="freq_settings_status" style="color:#A32D2D;font-size:11px;min-height:16px;margin-top:4px;"></div>
          </div>
        </div></div>
    `;
  }

  function bindSettingsEvents() {
    const fields = [
      { id: 'freq_sub_api_url',key: 'subApiUrl',   type: 'text' },
      { id: 'freq_sub_api_key',   key: 'subApiKey',   type: 'text' },
      { id: 'freq_sub_api_model', key: 'subApiModel', type: 'text' },
      { id: 'freq_weather_key',   key: 'weatherKey',  type: 'text' },
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
  }

  function loadSettingsCSS() {
    const extensionPath = `scripts/extensions/third-party/${EXTENSION_NAME}`;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${extensionPath}/settings.css`;
    document.head.appendChild(link);
  }
  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_10  App · 电台归档                │
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
  // │ BLOCK_11  App · 后台录音室                           │
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
          container.querySelector('#freq-studio-thinking').style.display  = m === 'thinking'  ? 'block' : 'none';
          container.querySelector('#freq-studio-interview').style.display = m === 'interview' ? 'block' : 'none';
          container.querySelector('#freq-studio-monologue').style.display = m === 'monologue' ? 'block' : 'none';});
      });

      this._renderThinkingList(container);
      container.querySelector('#freq-interview-go')?.addEventListener('click', () => this._doInterview(container));
      container.querySelector('#freq-monologue-go')?.addEventListener('click', () => this._doMonologue(container));this._renderHistory(container);
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
        resultEl.innerHTML = `<div class="freq-studio-output">${this._fmtDialogue(result)}</div>`;
        this._addHistory('interview', userQuestion ? `台本：${userQuestion}` : '自由采访', result);
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
约束：严格保持角色性格 | 不提及 AI/模型/扮演 | 150-300 字 | 只输出独白内容`;

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
      if (this._history.length > 20) this._history.pop();
      if (this._container) this._renderHistory(this._container);
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
      this._container = container;Notify.markAllRead();
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
      const charName = getCurrentCharName() || '???';

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

      // 如果已有缓存的帖子就直接渲染
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
        //尝试提取 JSON
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
    _cache: null,      // { html, coords, weatherText }
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
          <button class="freq-studio-action-btn" id="freq-weather-go" style="width:100%;margin-bottom:12px;">
            📡 扫描当前位置气象
          </button>
          <div id="freq-weather-result" class="freq-weather-result"></div>
        </div>`;

      // 宇宙频率角标
      const cosmicBadge = container.querySelector('#freq-weather-cosmic-badge');
      if (cosmicBadge && getCosmicFreqStatus()) {
        cosmicBadge.textContent = '🌌 宇宙频率 ON';
        cosmicBadge.style.color = '#7b5ea7';
      }

      container.querySelector('#freq-weather-go')
        ?.addEventListener('click', () => this._locate(container));

      // 有缓存直接渲染
      if (this._cache?.html) {
        container.querySelector('#freq-weather-result').innerHTML = this._cache.html;
        container.querySelector('#freq-weather-status').textContent = '↑ 上次扫描结果';
      }
    },

    unmount() { this._container = null; },

    // 第一步：浏览器定位
    _locate(container) {
      if (this._locating) return;
      const statusEl = container.querySelector('#freq-weather-status');
      const btn = container.querySelector('#freq-weather-go');
      const resultEl = container.querySelector('#freq-weather-result');

      if (!navigator.geolocation) {
        // 浏览器不支持定位，降级到副API模拟
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
          if (statusEl) statusEl.textContent = `📍 坐标锁定 ${lat.toFixed(2)}, ${lon.toFixed(2)}`;
          this._fetchWeather(container, lat, lon);
        },
        (err) => {
          this._locating = false;
          btn.disabled = false;
          btn.textContent = '📡 扫描当前位置气象';
          WARN('Geolocation failed:', err.message);
          // 定位失败，降级到副API模拟
          if (statusEl) statusEl.textContent = '📍 定位受限，切换至频率模拟模式';
          this._generate(container, null, null, '未知位置');
        },
        { timeout: 8000, maximumAge: 300000 }
      );
    },

    // 第二步：用坐标查和风天气
    async _fetchWeather(container, lat, lon) {
      const btn = container.querySelector('#freq-weather-go');
      const statusEl = container.querySelector('#freq-weather-status');
      const resultEl = container.querySelector('#freq-weather-result');
      const s = getSettings();

      if (!s.weatherKey) {
        // 无 Key，直接用副API模拟
        if (statusEl) statusEl.textContent = '📍 坐标已锁定，切换至频率模拟模式（未配置天气Key）';
        this._generate(container, lat, lon, `${lat.toFixed(2)},${lon.toFixed(2)}`);
        return;
      }

      if (resultEl) resultEl.innerHTML = '<div class="freq-studio-loading">🌐 正在接收气象数据...</div>';

      let weatherText = '';
      let cityName = `${lat.toFixed(2)},${lon.toFixed(2)}`;

      try {
        // 和风天气：经纬度格式 "lon,lat"（注意顺序）
        const coord = `${lon.toFixed(2)},${lat.toFixed(2)}`;

        // 查城市名（可选，用于显示）
        const geoResp = await fetch(
          `https://geoapi.qweather.com/v2/city/lookup?location=${coord}&key=${s.weatherKey}`
        );
        const geoData = await geoResp.json();
        if (geoData.code === '200' && geoData.location?.length) {
          const loc = geoData.location[0];
          cityName = `${loc.name}（${loc.adm1}）`;
        }

        // 查实时天气
        const wResp = await fetch(
          `https://devapi.qweather.com/v7/weather/now?location=${coord}&key=${s.weatherKey}`
        );
        const wData = await wResp.json();
        if (wData.code !== '200') throw new Error(`天气API: ${wData.code}`);

        const w = wData.now;
        weatherText = `城市：${cityName}\n天气：${w.text}\n温度：${w.temp}°C（体感 ${w.feelsLike}°C）\n湿度：${w.humidity}%\n风：${w.windDir} ${w.windScale}级`;

        if (statusEl) statusEl.textContent = `📍 ${cityName}`;
      } catch (e) {
        Notify.error('气象站·天气API', e);
        weatherText = '';
        if (statusEl) statusEl.textContent = '⚠️ 天气API异常，切换至频率模拟';
      }

      this._generate(container, lat, lon, cityName, weatherText);
      if (btn) { btn.disabled = false; btn.textContent = '📡 扫描当前位置气象'; }
    },

    // 第三步：副API生成播报文案
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

      const systemPrompt = `你是「信号气象站」播报员。根据以下信息生成气象播报。

${weatherText
  ? `真实天气数据：\n${weatherText}`
  : `位置：${cityName || '未知'}\n（无真实天气数据，请根据当前剧情时间和场景合理编造天气）`}

当前剧情角色：${charName}
最近剧情：${latestPlot || '暂无'}${cosmicNote}

输出格式（纯文本，不加JSON）：
第一段：气象数据卡片（位置、天气状况、温度、湿度、风力，简洁排列）
第二段：以${charName}口吻写 30-60 字的天气关心语${isCosmicOn ? '（宇宙频率ON：带穿透感，像TA感知到了屏幕另一边的你）' : ''}
第三段：失真的电台天气吐槽一句（颓废风，用颜文字）`;

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
        Notify.add('信号气象站', `${cityName || '当前位置'} 气象信号已接收${isCosmicOn ? ' 🌌' : ''}`, '🌦️');
      } catch (e) {
        resultEl.innerHTML = `<div class="freq-studio-error">📡 气象信号丢失：${escapeHtml(e.message)}</div>`;
        Notify.error('气象站', e);
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = '📡 扫描当前位置气象'; }
      }
    },
  };

  // │ BLOCK_90  占位 App工厂                              │
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
          </div>`;
      },
      unmount() {},};
  }

  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_99  初始化入口                                 │
  // └──────────────────────────────────────────────────────┘
  function init() {
    LOG('Initializing v0.3.0...');

    // 1. 加载设置面板独立样式
    loadSettingsCSS();

    // 2. 注入设置面板
    const injectSettings = () => {
      const target = document.getElementById('extensions_settings2') || document.getElementById('extensions_settings');
      if (target && !document.getElementById('freq-terminal-settings')) {
        const wrapper = document.createElement('div');
        wrapper.id = 'freq-terminal-settings';
        wrapper.innerHTML = buildSettingsHTML();
        target.appendChild(wrapper);
        bindSettingsEvents();LOG('Settings panel injected');
        return true;
      }
      return false;
    };
    if (!injectSettings()) {
      const ri = setInterval(() => { if (injectSettings()) clearInterval(ri); }, 1000);setTimeout(() => clearInterval(ri), 15000);
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

    // 4. 注册 App（顺序 = 手机主屏图标顺序）
    registerApp(archiveApp);        // 📡 电台归档
    registerApp(studioApp);         // 🎙️ 后台录音室
    registerApp(momentsApp);        // 📱 朋友圈·电波
    registerApp(weatherApp);        // 🌦️ 信号气象站
    registerApp(notifCenterApp);    // 🔔 通知中心

    registerApp(placeholderApp('scanner','弦外之音','📡', '随机截获NPC 内心独白'));
    registerApp(placeholderApp('cosmic',     '宇宙频率',       '🌌', '穿透第四面墙的感知'));
    registerApp(placeholderApp('checkin',    '打卡日志',       '📅', '角色陪跑打卡'));
    registerApp(placeholderApp('calendar',   '双线轨道',       '🗓️', 'User + Char 日程'));
    registerApp(placeholderApp('novel',      '频道文库',       '📖', '世界观短篇连载'));
    registerApp(placeholderApp('map',        '异界探索',       '🗺️', 'SVG 世界地图'));
    registerApp(placeholderApp('delivery',   '跨次元配送',     '🍜', '角色替你点外卖'));
    registerApp(placeholderApp('forum',      '频道留言板',     '💬', '多角色发帖互撕'));
    registerApp(placeholderApp('capsule',    '时光胶囊',       '💊', '延迟消息回信'));
    registerApp(placeholderApp('dream',      '梦境记录仪',     '🌙', '角色视角解梦'));
    registerApp(placeholderApp('emotion',    '情绪电波仪',     '📊', '情绪波形可视化'));
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

  // 启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => jQuery(init));
  } else {
    jQuery(init);
  }

})();
/*══════════════════════════════════════════════════════════📻FREQ · TERMINAL v0.3.0 — 主界面样式
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

/* ── App 通用 ── */
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
   BLOCK_10 电台归档
   ══════════════════════════════════════════════════════════ */
.freq-archive-search { padding: 0 0 10px; }
.freq-archive-search input {
  width: 100%; background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px;
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
  // │ BLOCK_90  占位 App工厂                              │
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
          </div>`;
      },
      unmount() {},};
  }

  // ┌──────────────────────────────────────────────────────┐
  // │ BLOCK_99  初始化入口                                 │
  // └──────────────────────────────────────────────────────┘
  function init() {
    LOG('Initializing v0.3.0...');

    // 1. 加载设置面板独立样式
    loadSettingsCSS();

    // 2. 注入设置面板
    const injectSettings = () => {
      const target = document.getElementById('extensions_settings2') || document.getElementById('extensions_settings');
      if (target && !document.getElementById('freq-terminal-settings')) {
        const wrapper = document.createElement('div');
        wrapper.id = 'freq-terminal-settings';
        wrapper.innerHTML = buildSettingsHTML();
        target.appendChild(wrapper);
        bindSettingsEvents();LOG('Settings panel injected');
        return true;
      }
      return false;
    };
    if (!injectSettings()) {
      const ri = setInterval(() => { if (injectSettings()) clearInterval(ri); }, 1000);setTimeout(() => clearInterval(ri), 15000);
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

    // 4. 注册 App（顺序 = 手机主屏图标顺序）
    registerApp(archiveApp);        // 📡 电台归档
    registerApp(studioApp);         // 🎙️ 后台录音室
    registerApp(momentsApp);        // 📱 朋友圈·电波
    registerApp(weatherApp);        // 🌦️ 信号气象站
    registerApp(notifCenterApp);    // 🔔 通知中心

    registerApp(placeholderApp('scanner','弦外之音','📡', '随机截获NPC 内心独白'));
    registerApp(placeholderApp('cosmic',     '宇宙频率',       '🌌', '穿透第四面墙的感知'));
    registerApp(placeholderApp('checkin',    '打卡日志',       '📅', '角色陪跑打卡'));
    registerApp(placeholderApp('calendar',   '双线轨道',       '🗓️', 'User + Char 日程'));
    registerApp(placeholderApp('novel',      '频道文库',       '📖', '世界观短篇连载'));
    registerApp(placeholderApp('map',        '异界探索',       '🗺️', 'SVG 世界地图'));
    registerApp(placeholderApp('delivery',   '跨次元配送',     '🍜', '角色替你点外卖'));
    registerApp(placeholderApp('forum',      '频道留言板',     '💬', '多角色发帖互撕'));
    registerApp(placeholderApp('capsule',    '时光胶囊',       '💊', '延迟消息回信'));
    registerApp(placeholderApp('dream',      '梦境记录仪',     '🌙', '角色视角解梦'));
    registerApp(placeholderApp('emotion',    '情绪电波仪',     '📊', '情绪波形可视化'));
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

  // 启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => jQuery(init));
  } else {
    jQuery(init);
  }

})();


