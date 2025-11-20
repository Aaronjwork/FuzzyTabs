(function(){
  // Use browser.* if available, fallback to chrome.* for compatibility
  const api = (typeof browser !== 'undefined') ? browser : chrome;
  const DEBUG = true;
  const log = (...args) => { if (!DEBUG) return; try { console.debug('[FuzzyTabs][background]', ...args); } catch (_) {} };
  log('background loaded');

  // Small helpers to deduplicate repeated tab activation code
  function activateTabAndRespond(tabId, sendResponse) {
    try {
      api.tabs.update(tabId, { active: true }, () => {
        const err = api.runtime && api.runtime.lastError;
        if (err) {
          log('tabs.update error', err);
          sendResponse({ ok: false, error: String((err && err.message) || err) });
        } else {
          sendResponse({ ok: true });
        }
      });
    } catch (e) {
      sendResponse({ ok: false, error: String(e) });
    }
  }

  function focusWindowThenActivate(windowId, tabId, sendResponse) {
    try {
      if (typeof windowId === 'number' && api.windows && api.windows.update) {
        api.windows.update(windowId, { focused: true }, () => {
          // ignore possible lastError on focusing
          activateTabAndRespond(tabId, sendResponse);
        });
      } else {
        // No windows API or no windowId, just activate the tab
        activateTabAndRespond(tabId, sendResponse);
      }
    } catch (e) {
      log('error focusing window', e);
      // Try to activate anyway
      activateTabAndRespond(tabId, sendResponse);
    }
  }
  
  // Handle messages from content scripts
  if (api && api.runtime && api.runtime.onMessage) {
    api.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      try {
        if (!msg || !msg.type) return; // not ours
        
        // Handle browser action click
        if (msg.type === 'browser-action-clicked') {
          log('Browser action clicked, sending message to active tab');
          // Send message to active tab's content script
          api.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (api.runtime.lastError) {
              log('Error querying tabs:', api.runtime.lastError);
              sendResponse({ ok: false, error: String(api.runtime.lastError) });
              return;
            }
            
            if (tabs && tabs.length > 0) {
              log('Sending toggle message to tab:', tabs[0].id, tabs[0].url);
              api.tabs.sendMessage(tabs[0].id, { type: 'toggle-fuzzytabs' }, (response) => {
                if (api.runtime.lastError) {
                  log('Error sending message to content script:', api.runtime.lastError);
                  sendResponse({ ok: false, error: String(api.runtime.lastError) });
                } else {
                  log('Message sent successfully, response:', response);
                  sendResponse({ ok: true });
                }
              });
            } else {
              log('No active tab found');
              sendResponse({ ok: false, error: 'No active tab found' });
            }
          });
          return true;
        }
        if (msg.type === 'get-all-tabs') {
          log('get-all-tabs request');
          api.tabs.query({}, (tabs) => {
            try {
              const data = (tabs || []).map(
                  t => ({ id: t.id, title: t.title, url: t.url, favIconUrl: t.favIconUrl, active: t.active, windowId: t.windowId, lastAccessed: t.lastAccessed })
              );
              sendResponse({ ok: true, tabs: data });
            } catch (e) {
              log('error mapping tabs', e);
              sendResponse({ ok: false, error: String(e) });
            }
          });
          return true; // keep the message channel open for async sendResponse
        } else if (msg.type === 'activate-tab') {
          const tabId = msg && msg.tabId;
          if (typeof tabId === 'number') {
            log('activate-tab request', { tabId });
            try {
              api.tabs.get(tabId, (tabInfo) => {
                const getErr = api.runtime && api.runtime.lastError;
                if (getErr) {
                  log('tabs.get error', getErr);
                  // Fallback: try to activate anyway
                  activateTabAndRespond(tabId, sendResponse);
                  return;
                }
                const targetWindowId = tabInfo && tabInfo.windowId;
                // First, focus the window (also unminimize if supported)
                focusWindowThenActivate(targetWindowId, tabId, sendResponse);
              });
              return true; // async
            } catch (e) {
              log('tabs.update threw', e);
              sendResponse({ ok: false, error: String(e) });
            }
          } else {
            sendResponse({ ok: false, error: 'Invalid tabId' });
          }
        } else if (msg.type === 'close-tab') {
          const tabId = msg && msg.tabId;
          if (typeof tabId === 'number') {
            log('close-tab request', { tabId });
            try {
              api.tabs.remove(tabId, () => {
                const err = api.runtime && api.runtime.lastError;
                if (err) {
                  log('tabs.remove error', err);
                  sendResponse({ ok: false, error: String(err && err.message || err) });
                } else {
                  sendResponse({ ok: true });
                }
              });
              return true; // async
            } catch (e) {
              log('tabs.remove threw', e);
              sendResponse({ ok: false, error: String(e) });
            }
          } else {
            sendResponse({ ok: false, error: 'Invalid tabId' });
          }
        } else if (msg.type === 'get-theme') {
          api.storage.sync.get(['theme', 'syncMode'], (result) => {
            if (api.runtime.lastError) {
              log('获取主题设置失败:', api.runtime.lastError);
              sendResponse({
                theme: 'dark',
                syncMode: 'auto'
              });
            } else {
              sendResponse({
                theme: (result && result.theme) ? result.theme : 'dark',
                syncMode: (result && result.syncMode) ? result.syncMode : 'auto'
              });
            }
          });
          return true; // 保持消息通道开放
        } else if (msg.type === 'set-theme') {
          const timestamp = Date.now();
          api.storage.sync.set({
            theme: msg.theme,
            themeTimestamp: timestamp
          }, () => {
            log('主题已设置:', { theme: msg.theme, timestamp });
            
            // 获取同步模式
            api.storage.sync.get(['syncMode'], (result) => {
              if (api.runtime.lastError) {
                log('获取同步模式失败:', api.runtime.lastError);
                return;
              }
              
              const syncMode = (result && result.syncMode) ? result.syncMode : 'auto';
              
              // 如果是自动同步模式，立即广播到所有窗口
              if (syncMode === 'auto') {
                broadcastThemeToAllWindows(msg.theme);
              }
            });
          });
          sendResponse({ ok: true });
          return true;
        } else if (msg.type === 'set-sync-mode') {
          api.storage.sync.set({ syncMode: msg.syncMode }, () => {
            log('同步模式已设置:', msg.syncMode);
            sendResponse({ ok: true });
          });
          return true;
        } else if (msg.type === 'broadcast-theme') {
          broadcastThemeToAllWindows(msg.theme);
          sendResponse({ ok: true });
          return true;
        } else if (msg.type === 'theme-broadcast') {
          // 转发到所有标签页
          api.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
              if (tab.id) {
                api.tabs.sendMessage(tab.id, {
                  type: 'theme-changed',
                  theme: msg.theme,
                  timestamp: msg.timestamp
                }, () => {
                  // 忽略错误
                });
              }
            });
          });
        }
      } catch (e) {
        log('onMessage handler error', e);
      }
    });
  }

  // 广播主题变更到所有窗口的函数（移到外层以确保作用域正确）
  function broadcastThemeToAllWindows(theme) {
    log('广播主题到所有窗口:', theme);
    
    // 方法1: 通过 runtime.sendMessage 广播
    api.runtime.sendMessage({
      type: 'theme-broadcast',
      theme: theme,
      timestamp: Date.now()
    }, () => {
      // 忽略错误，因为可能没有监听器
    });
    
    // 方法2: 直接向所有标签页发送消息
    api.tabs.query({}, (tabs) => {
      let successCount = 0;
      let failCount = 0;
      
      tabs.forEach(tab => {
        if (tab.id) {
          api.tabs.sendMessage(tab.id, {
            type: 'theme-changed',
            theme: theme,
            timestamp: Date.now()
          }, (response) => {
            if (api.runtime.lastError) {
              failCount++;
            } else {
              successCount++;
            }
            
            // 记录广播结果
            if (successCount + failCount === tabs.length) {
              log('主题广播完成:', { successCount, failCount, total: tabs.length });
            }
          });
        }
      });
    });
  }

  // Handle theme management
  if (api && api.storage) {
    // 初始化默认主题和同步模式
    api.storage.sync.get(['theme', 'syncMode', 'themeTimestamp'], (result) => {
      if (api.runtime.lastError) {
        log('获取初始化设置失败:', api.runtime.lastError);
        return;
      }
      
      // 添加错误处理，确保result不是undefined
      const needsInit = !result || !result.theme || !result.syncMode || !result.themeTimestamp;
      
      if (needsInit) {
        const defaults = {
          theme: (result && result.theme) ? result.theme : 'dark',
          syncMode: (result && result.syncMode) ? result.syncMode : 'auto',
          themeTimestamp: (result && result.themeTimestamp) ? result.themeTimestamp : Date.now()
        };
        
        log('初始化默认设置:', defaults);
        api.storage.sync.set(defaults);
      }
    });

    // 监听存储变化，实现跨窗口同步
    api.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync') {
        let needsBroadcast = false;
        let currentTheme = null;
        let currentSyncMode = 'auto';
        
        // 获取当前设置
        api.storage.sync.get(['theme', 'syncMode'], (result) => {
          if (api.runtime.lastError) {
            log('获取当前设置失败:', api.runtime.lastError);
            return;
          }
          
          currentTheme = (result && result.theme) ? result.theme : 'dark';
          currentSyncMode = (result && result.syncMode) ? result.syncMode : 'auto';
          
          // 检查是否有主题变更
          if (changes.theme && changes.theme.newValue !== changes.theme.oldValue) {
            needsBroadcast = true;
            log('主题存储变更:', { old: changes.theme.oldValue, new: changes.theme.newValue, syncMode: currentSyncMode });
          }
          
          // 如果是自动同步模式且有主题变更，立即广播到所有窗口
          if (needsBroadcast && currentSyncMode === 'auto') {
            broadcastThemeToAllWindows(changes.theme.newValue);
          }
        });
      }
    });
  }

  // Handle browser action click
  if (api && api.browserAction && api.browserAction.onClicked) {
    log('Setting up browser action click listener');
    api.browserAction.onClicked.addListener((tab) => {
      log('Browser action clicked directly, tab:', tab.id, tab.url);
      // Send message to content script to toggle overlay
      api.tabs.sendMessage(tab.id, { type: 'toggle-fuzzytabs' }, (response) => {
        if (api.runtime.lastError) {
          log('Error sending message to content script:', api.runtime.lastError);
        } else {
          log('Toggle message sent successfully, response:', response);
        }
      });
    });
  } else {
    log('Browser action API not available');
  }
})();