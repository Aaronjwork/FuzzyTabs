(function() {
  const DEBUG = true;
  const log = (...args) => { if (!DEBUG) return; try { console.debug('[FuzzyTabs][content]', ...args); } catch (_) {} };
  
  // 添加浏览器检测
  const isEdge = /Edg\//.test(navigator.userAgent);
  const isChrome = /Chrome\//.test(navigator.userAgent) && !isEdge;
  const isFirefox = /Firefox\//.test(navigator.userAgent);
  
  log('content script loaded', {
    url: location.href,
    userAgent: navigator.userAgent,
    isEdge,
    isChrome,
    isFirefox,
    api: typeof browser !== 'undefined' ? 'browser' : 'chrome'
  });

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

    // 监听iframe内事件（合并关闭事件、主题请求和设置请求）
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'close-fuzzytabs') {
        hideOverlay();
      } else if (event.data && event.data.type === 'request-theme') {
        // 获取当前主题并发送给iframe
        const api = (typeof browser !== 'undefined') ? browser : chrome;
        api.runtime.sendMessage({ type: 'get-theme' }, (response) => {
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({
              type: 'theme-response',
              theme: response.theme,
              syncMode: response.syncMode
            }, '*');
          }
        });
      } else if (event.data && event.data.type === 'open-settings') {
        // 在新标签页打开设置页面
        const api = (typeof browser !== 'undefined') ? browser : chrome;
        if (api.runtime && api.runtime.openOptionsPage) {
          api.runtime.openOptionsPage();
        } else {
          // 备用方法
          window.open(event.data.url, '_blank');
        }
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
    
    // 聚焦到iframe和搜索框
    setTimeout(() => {
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.focus();
        // 尝试聚焦到搜索输入框
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
          const searchInput = iframeDoc.getElementById('fuzzy-tabs-input');
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
            log('Search input focused successfully');
          } else {
            log('Search input not found');
          }
        } catch (e) {
          log('Error focusing search input:', e);
        }
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
  try {
    const api = (typeof browser !== 'undefined' ? browser : chrome);
    if (api && api.runtime) {
      log('Setting up message listener', { api: 'browser' in window ? 'browser' : 'chrome' });
      api.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        log('Received message', msg);
        if (msg && msg.type === 'toggle-fuzzytabs') {
          log('Toggling overlay');
          toggleOverlay();
          sendResponse({ ok: true });
        } else if (msg && msg.type === 'theme-changed') {
          // 转发主题变更消息到iframe
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({
              type: 'theme-changed',
              theme: msg.theme,
              timestamp: msg.timestamp
            }, '*');
          }
          sendResponse({ ok: true });
        }
        return true;
      });
    } else {
      log('Error: api.runtime not available', { api });
    }
  } catch (e) {
    log('Error setting up message listener', e);
  }

  // ESC键关闭
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isVisible) {
      hideOverlay();
    }
  });
})();