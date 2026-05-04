console.log('[FT] 脚本开始加载');

function ftDelayInit() {
  console.log('[FT] 延迟初始化开始');

  // 只插入一个悬浮球，什么都不做
  const fab = document.createElement('div');
  fab.id = 'ft-fab';
  fab.textContent = '📻';
  fab.style.cssText = 'position:fixed;bottom:80px;right:24px;width:56px;height:56px;border-radius:50%;background:#1C1C1E;display:flex;align-items:center;justify-content:center;font-size:26px;cursor:pointer;z-index:9998;box-shadow:0 4px 20px rgba(0,0,0,0.35);';

  fab.addEventListener('click', () => {
    alert('Freq Terminal 悬浮球点击成功！');
  });

  document.body.appendChild(fab);
  console.log('[FT] 悬浮球已插入');
}

// 延迟 5 秒再执行，确保不跟 ST 启动抢资源
setTimeout(ftDelayInit, 5000);

console.log('[FT] 脚本加载完成，等待 5 秒后初始化');
