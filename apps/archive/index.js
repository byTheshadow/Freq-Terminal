// apps/archive/index.js
// App 01 · 电台归档 — 解析 meow_FM，格式化展示连线记录

import { getMeowFMRecords } from '../../core/st-bridge.js';
import EventBus from '../../core/event-bus.js';

let containerEl = null;

function renderRecords(container) {
  const records = getMeowFMRecords();

  if (records.length === 0) {
    container.innerHTML = `
      <div class="freq-app-header">📡 电台归档</div>
      <div class="freq-app-body">
        <div class="freq-empty">
          <span class="freq-empty-icon">📻</span>
          <span>暂无连线记录</span>
          <span style="font-size:10px;color:#333;">等待 meow_FM 信号接入...</span>
        </div>
      </div>
    `;
    return;
  }

  const listHTML = records.map((r, i) => `
    <div class="freq-archive-card" data-index="${i}">
      <div class="freq-archive-card-header">
        <span class="freq-archive-serial">${r.serial || `#${i + 1}`}</span>
        <span class="freq-archive-time">${r.time || '未知时间'}</span>
      </div>
      <div class="freq-archive-scene">${r.scene || ''}</div>
      <div class="freq-archive-plot" style="display:none;">${r.plot || ''}</div>
      <div class="freq-archive-seeds" style="display:none;">${r.seeds || ''}</div></div>
  `).join('');

  container.innerHTML = `
    <div class="freq-app-header">
      <span>📡 电台归档</span>
      <span style="float:right;font-size:10px;color:#555;font-weight:normal;">${records.length} 条记录</span>
    </div>
    <div class="freq-app-body">
      <div class="freq-archive-search">
        <input type="text" id="freq-archive-search-input" placeholder="搜索关键词..." />
      </div>
      <div class="freq-archive-list" id="freq-archive-list">${listHTML}</div>
    </div>
  `;

  // 点击展开/收起详情
  container.querySelectorAll('.freq-archive-card').forEach(card => {
    card.addEventListener('click', () => {
      const plot = card.querySelector('.freq-archive-plot');
      const seeds = card.querySelector('.freq-archive-seeds');
      const isOpen = plot.style.display !== 'none';
      plot.style.display = isOpen ? 'none' : 'block';
      seeds.style.display = isOpen ? 'none' : 'block';
      card.classList.toggle('freq-archive-card--open', !isOpen);
    });
  });

  // 搜索
  const searchInput = container.querySelector('#freq-archive-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const keyword = e.target.value.toLowerCase();
      container.querySelectorAll('.freq-archive-card').forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(keyword) ? '' : 'none';
      });
    });
  }
}

export default {
  id: 'archive',
  name: '电台归档',
  icon: '📡',
  _badge: 0,

  init() {
    // 监听 meow_FM 更新事件，有新数据时角标+1
    EventBus.on('meow_fm:updated', () => {
      EventBus.emit('notify:app', { appId: 'archive' });
      // 如果当前正在看这个 App，自动刷新
      if (containerEl) renderRecords(containerEl);
    });
  },

  mount(container) {
    containerEl = container;
    renderRecords(container);
  },

  unmount() {
    containerEl = null;
  },

  onNotify() { /* 角标由 phone-shell 统一管理 */ }
};
