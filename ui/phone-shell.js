// ui/phone-shell.js
// 手机外壳渲染 + 悬浮球

import EventBus from '../core/event-bus.js';

let phoneEl = null;
let fabEl = null;
let isOpen = false;
let currentAppId = null;
const appRegistry = [];

// 注册 App（由 index.js 调用）
export function registerApp(appModule) {
  appRegistry.push(appModule);
}

// 渲染手机外壳 HTML
function createPhoneShell() {
  const el = document.createElement('div');
  el.id = 'freq-phone-shell';
  el.innerHTML = `
    <div class="freq-phone">
      <div class="freq-phone-notch">
        <span class="freq-phone-signal">📶</span>
        <span class="freq-phone-title">FREQ · TERMINAL</span>
        <span class="freq-phone-time" id="freq-clock"></span>
      </div>
      <div class="freq-phone-screen" id="freq-screen">
        <div class="freq-home" id="freq-home">
          <div class="freq-app-grid" id="freq-app-grid"></div>
        </div>
        <div class="freq-app-view" id="freq-app-view" style="display:none"></div>
      </div>
      <div class="freq-phone-bar">
        <button class="freq-home-btn" id="freq-home-btn" title="主屏幕">⬛</button>
      </div>
    </div>
    <button class="freq-close-btn" id="freq-close-btn" title="关闭">✕</button>
  `;
  return el;
}

// 渲染悬浮球
function createFAB() {
  const el = document.createElement('button');
  el.id = 'freq-fab';
  el.title = '打开频率终端';
  el.innerHTML = '📻';
  return el;
}

// 渲染 App 图标网格
function renderAppGrid() {
  const grid = document.getElementById('freq-app-grid');
  if (!grid) return;
  grid.innerHTML = '';
  for (const app of appRegistry) {
    const btn = document.createElement('button');
    btn.className = 'freq-app-icon';
    btn.dataset.appId = app.id;
    btn.innerHTML = `
      <span class="freq-app-icon-emoji">${app.icon}</span>
      <span class="freq-app-icon-name">${app.name}</span>
      ${app._badge ? `<span class="freq-badge">${app._badge}</span>` : ''}
    `;
    btn.addEventListener('click', () => openApp(app.id));
    grid.appendChild(btn);
  }
}

// 打开某个 App
function openApp(appId) {
  const app = appRegistry.find(a => a.id === appId);
  if (!app) return;

  const homeEl = document.getElementById('freq-home');
  const viewEl = document.getElementById('freq-app-view');
  if (!homeEl || !viewEl) return;

  // 卸载上一个 App
  if (currentAppId && currentAppId !== appId) {
    const prev = appRegistry.find(a => a.id === currentAppId);
    prev?.unmount?.();
  }

  homeEl.style.display = 'none';
  viewEl.style.display = 'flex';
  viewEl.innerHTML = '';
  currentAppId = appId;

  // 清除角标
  app._badge = 0;
  renderAppGrid();

  app.mount?.(viewEl);
}

// 返回主屏幕
function goHome() {
  if (currentAppId) {
    const app = appRegistry.find(a => a.id === currentAppId);
    app?.unmount?.();
    currentAppId = null;
  }
  const homeEl = document.getElementById('freq-home');
  const viewEl = document.getElementById('freq-app-view');
  if (homeEl) homeEl.style.display = 'flex';
  if (viewEl) { viewEl.style.display = 'none'; viewEl.innerHTML = ''; }
}

// 打开/关闭手机面板
function togglePhone() {
  isOpen = !isOpen;
  if (phoneEl) phoneEl.style.display = isOpen ? 'flex' : 'none';
  if (fabEl) fabEl.classList.toggle('freq-fab-active', isOpen);
  if (isOpen) renderAppGrid();
}

// 更新时钟
function updateClock() {
  const el = document.getElementById('freq-clock');
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

// 通知某个 App 有新内容（角标 +1）
export function notifyApp(appId) {
  const app = appRegistry.find(a => a.id === appId);
  if (!app) return;
  app._badge = (app._badge ?? 0) + 1;
  app.onNotify?.();
  if (!isOpen || currentAppId !== appId) renderAppGrid();
}

// 初始化整个手机 UI
export function initPhoneShell() {
  // 悬浮球
  fabEl = createFAB();
  document.body.appendChild(fabEl);
  fabEl.addEventListener('click', togglePhone);

  // 手机面板
  phoneEl = createPhoneShell();
  phoneEl.style.display = 'none';
  document.body.appendChild(phoneEl);

  // 关闭按钮
  document.getElementById('freq-close-btn')?.addEventListener('click', togglePhone);
  // 主屏幕按钮
  document.getElementById('freq-home-btn')?.addEventListener('click', goHome);

  // 时钟
  updateClock();
  setInterval(updateClock, 30000);

  // 监听通知事件
  EventBus.on('notify:app', ({ appId }) => notifyApp(appId));

  console.log('[FreqTerminal] Phone shell initialized');
}

export default { initPhoneShell, registerApp, notifyApp };
