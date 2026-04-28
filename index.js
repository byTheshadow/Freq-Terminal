// index.js
// Freq · Terminal 插件入口，只做注册和路由

import { initPhoneShell, registerApp } from './ui/phone-shell.js';
import { onNewMessage, getSettings, saveSettings } from './core/st-bridge.js';
import EventBus from './core/event-bus.js';

// ── 导入各 App 模块（阶段 1 先只挂占位） ──
import archiveApp from './apps/archive/index.js';

// ── 注册所有 App ──
const APPS = [archiveApp];

// ── 插件设置面板 HTML（在 ST「扩展」里显示） ──
function renderSettingsPanel() {
  const settings = getSettings();
  const panel = document.createElement('div');
  panel.id = 'freq-settings-panel';
  panel.innerHTML = `
    <div class="freq-settings">
      <h3 style="color:#A32D2D;margin:0 0 12px;font-size:14px;letter-spacing:1px;">📻 FREQ · TERMINAL 设置</h3>

      <label class="freq-setting-row">
        <span>副 API 地址</span>
        <input type="text" id="freq-sub-api-url" placeholder="https://api.openai.com/v1"
          value="${settings.subApiUrl ?? ''}" />
      </label>

      <label class="freq-setting-row">
        <span>副 API Key</span>
        <input type="password" id="freq-sub-api-key" placeholder="sk-..."
          value="${settings.subApiKey ?? ''}" />
      </label>

      <label class="freq-setting-row">
        <span>副 API 模型</span>
        <input type="text" id="freq-sub-api-model" placeholder="gpt-4o-mini"
          value="${settings.subApiModel ?? ''}" />
      </label>

      <label class="freq-setting-row freq-setting-row--toggle">
        <span>宇宙频率感知</span>
        <input type="checkbox" id="freq-cosmic-enabled"
          ${settings.cosmicEnabled ? 'checked' : ''} />
      </label>

      <button id="freq-save-settings" class="freq-btn-save">保存设置</button>
      <div id="freq-settings-status" style="font-size:11px;color:#666;margin-top:6px;"></div>
    </div>
  `;

  // 保存按钮
  panel.querySelector('#freq-save-settings').addEventListener('click', () => {
    saveSettings({
      subApiUrl:      panel.querySelector('#freq-sub-api-url').value.trim(),
      subApiKey:      panel.querySelector('#freq-sub-api-key').value.
// index.js
// Freq · Terminal 插件入口，只做注册和路由

import { initPhoneShell, registerApp } from './ui/phone-shell.js';
import { onNewMessage, getSettings, saveSettings } from './core/st-bridge.js';
import EventBus from './core/event-bus.js';

// ── 导入各 App 模块（阶段 1 先只挂占位） ──
import archiveApp from './apps/archive/index.js';

// ── 注册所有 App ──
const APPS = [archiveApp];

// ── 插件设置面板 HTML（在 ST「扩展」里显示） ──
function renderSettingsPanel() {
  const settings = getSettings();
  const panel = document.createElement('div');
  panel.id = 'freq-settings-panel';
  panel.innerHTML = `
    <div class="freq-settings">
      <h3 style="color:#A32D2D;margin:0 0 12px;font-size:14px;letter-spacing:1px;">📻 FREQ · TERMINAL 设置</h3>

      <label class="freq-setting-row">
        <span>副 API 地址</span>
        <input type="text" id="freq-sub-api-url" placeholder="https://api.openai.com/v1"
          value="${settings.subApiUrl ?? ''}" />
      </label>

      <label class="freq-setting-row">
        <span>副 API Key</span>
        <input type="password" id="freq-sub-api-key" placeholder="sk-..."
          value="${settings.subApiKey ?? ''}" />
      </label>

      <label class="freq-setting-row">
        <span>副 API 模型</span>
        <input type="text" id="freq-sub-api-model" placeholder="gpt-4o-mini"
          value="${settings.subApiModel ?? ''}" />
      </label>

      <label class="freq-setting-row">
        <span>和风天气 API Key</span>
        <input type="text" id="freq-weather-key" placeholder="可选，用于信号气象站"
          value="${settings.weatherKey ?? ''}" />
      </label>

      <label class="freq-setting-row freq-setting-row--toggle">
        <span>宇宙频率感知</span>
        <input type="checkbox" id="freq-cosmic-enabled"
          ${settings.cosmicEnabled ? 'checked' : ''} />
      </label>

      <button id="freq-save-settings" class="freq-btn-save">保存设置</button>
      <div id="freq-settings-status" style="font-size:11px;color:#666;margin-top:6px;"></div>
    </div>
  `;

  // 保存按钮事件
  panel.querySelector('#freq-save-settings').addEventListener('click', () => {
    saveSettings({
      subApiUrl:      panel.querySelector('#freq-sub-api-url').value.trim(),
      subApiKey:      panel.querySelector('#freq-sub-api-key').value.trim(),
      subApiModel:    panel.querySelector('#freq-sub-api-model').value.trim(),
      weatherKey:     panel.querySelector('#freq-weather-key').value.trim(),
      cosmicEnabled:  panel.querySelector('#freq-cosmic-enabled').checked,
    });
    const statusEl = panel.querySelector('#freq-settings-status');
    statusEl.textContent = '✓ 设置已保存';
    statusEl.style.color = '#A32D2D';
    setTimeout(() => { statusEl.textContent = ''; }, 2000);
  });

  return panel;
}

// ── 插件初始化入口（ST 加载时自动调用） ──
jQuery(async () => {
  console.log('[FreqTerminal] Initializing...');

  // 1. 在 ST 扩展面板注入设置 UI
  const settingsContainer = document.getElementById('extensions_settings');
  if (settingsContainer) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('freq-extension-block');
    wrapper.appendChild(renderSettingsPanel());
    settingsContainer.appendChild(wrapper);
  }

  // 2. 注册所有 App 模块
  for (const app of APPS) {
    registerApp(app);
    app.init?.();
  }

  // 3. 初始化手机外壳 UI（悬浮球+ 手机面板）
  initPhoneShell();

  // 4. 监听 ST 新消息
  onNewMessage((data) => {
    console.log('[FreqTerminal] New message received');});

  console.log('[FreqTerminal] Ready✓');
});
