(function() {
  const DEBUG = false;
  const log = (...args) => { if (!DEBUG) return; try { console.debug('[FuzzyTabs][content]', ...args); } catch (_) {} };
  log('content script loaded', { url: location.href });

  let overlay = null;
  let iframe = null;
  let isVisible = false;

  // 创建浮动层
  function createOverlay() {
    if (overlay) return;

    overlay = document.createElement('div');
    overlay.className = 'fuzzytabs-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 2147483647;
      display: none;
      background: rgba(0, 0, 0, 0.1);
      backdrop-filter: blur(2px);
    `;

    iframe = document.createElement('iframe');
    iframe.style.cssText = `
      position: absolute;
      top: 60px;
      left: 50%;
      transform: translateX(-50%);
      width: 800px;
      height: 560px;
      border: none;
      border-radius: 8px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      background: #222224;
    `;

    const extensionURL = (typeof browser !== 'undefined' ? browser : chrome).runtime.getURL('app.html');
    iframe.src = extensionURL;

    overlay.appendChild(iframe);
    document.body.appendChild(overlay);

    // 点击背景关闭
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        hideOverlay();
      }
    });

    // 监听iframe内关闭事件
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'close-fuzzytabs') {
        hideOverlay();
      }
    });
  }

  // 显示浮动层
  function showOverlay() {
    if (!overlay) {
      createOverlay();
    }
    if (isVisible) return;
    
    isVisible = true;
    overlay.style.display = 'block';
    
    // 聚焦到iframe
    setTimeout(() => {
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.focus();
      }
    }, 100);
  }

  // 隐藏浮动层
  function hideOverlay() {
    if (!overlay || !isVisible) return;
    
    isVisible = false;
    overlay.style.display = 'none';
  }

  // 切换显示状态
  function toggleOverlay() {
    if (isVisible) {
      hideOverlay();
    } else {
      showOverlay();
    }
  }

  // 监听来自background的消息
  if (typeof browser !== 'undefined' ? browser.runtime : chrome.runtime) {
    const api = (typeof browser !== 'undefined') ? browser : chrome;
    api.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      if (msg && msg.type === 'toggle-fuzzytabs') {
        toggleOverlay();
        sendResponse({ ok: true });
      }
      return true;
    });
  }

  // ESC键关闭
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isVisible) {
      hideOverlay();
    }
  });

  log('content script initialized');
})();