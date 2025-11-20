(function() {
  const DEBUG = true;
  const log = (...args) => { if (!DEBUG) return; try { console.debug('[FuzzyTabs][options]', ...args); } catch (_) {} };
  
  // 使用 browser.* 如果可用，否则回退到 chrome.*
  const api = (typeof browser !== 'undefined') ? browser : chrome;
  
  // 获取 DOM 元素
  const darkThemeCard = document.getElementById('dark-theme');
  const lightThemeCard = document.getElementById('light-theme');
  const syncAutoRadio = document.getElementById('sync-auto');
  const syncManualRadio = document.getElementById('sync-manual');
  const statusMessage = document.getElementById('status-message');
  
  // 当前设置
  let currentSettings = {
    theme: 'dark',
    syncMode: 'auto'
  };
  
  // 显示状态消息
  function showStatus(message, type = 'success') {
    statusMessage.textContent = message;
    statusMessage.className = `status ${type}`;
    statusMessage.style.display = 'block';
    
    // 3秒后自动隐藏
    setTimeout(() => {
      statusMessage.style.display = 'none';
    }, 3000);
  }
  
  // 应用主题选择
  function applyThemeSelection(theme) {
    if (theme === 'dark') {
      darkThemeCard.classList.add('selected');
      lightThemeCard.classList.remove('selected');
    } else {
      lightThemeCard.classList.add('selected');
      darkThemeCard.classList.remove('selected');
    }
  }

  function updateThemeIcon(theme) {
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
      themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
    }
  }
  
  // 应用同步模式选择
  function applySyncModeSelection(mode) {
    if (mode === 'auto') {
      syncAutoRadio.checked = true;
    } else {
      syncManualRadio.checked = true;
    }
  }
  
  // 保存设置
  function saveSettings() {
    api.storage.sync.set(currentSettings, () => {
      if (api.runtime.lastError) {
        log('保存设置失败:', api.runtime.lastError);
        showStatus('保存设置失败', 'error');
      } else {
        log('设置已保存:', currentSettings);
        showStatus('设置已保存');
        
        // 如果主题变更，通知所有窗口
        if (currentSettings.syncMode === 'auto') {
          api.runtime.sendMessage({
            type: 'broadcast-theme',
            theme: currentSettings.theme
          }, (response) => {
            if (api.runtime.lastError) {
              log('广播主题失败:', api.runtime.lastError);
              // 不显示错误消息，因为设置已经保存成功
            } else {
              log('主题广播成功:', response);
            }
          });
        }
      }
    });
  }
  
  // 加载设置
  function loadSettings() {
    api.storage.sync.get(['theme', 'syncMode'], (result) => {
      if (api.runtime.lastError) {
        log('加载设置失败:', api.runtime.lastError);
        showStatus('加载设置失败', 'error');
        return;
      }
      
      // 合并默认设置
      currentSettings = {
        theme: (result && result.theme) ? result.theme : 'dark',
        syncMode: (result && result.syncMode) ? result.syncMode : 'auto'
      };
      
      log('加载的设置:', currentSettings);
      
      // 应用到 UI
      applyThemeSelection(currentSettings.theme);
      applySyncModeSelection(currentSettings.syncMode);
    });
  }
  
  // 主题卡片点击事件
  darkThemeCard.addEventListener('click', () => {
    if (currentSettings.theme !== 'dark') {
      currentSettings.theme = 'dark';
      applyThemeSelection('dark');
      updateThemeIcon('dark');
      saveSettings();
    }
  });
  
  lightThemeCard.addEventListener('click', () => {
    if (currentSettings.theme !== 'light') {
      currentSettings.theme = 'light';
      applyThemeSelection('light');
      updateThemeIcon('light');
      saveSettings();
    }
  });
  
  // 同步模式单选按钮事件
  syncAutoRadio.addEventListener('change', () => {
    if (syncAutoRadio.checked && currentSettings.syncMode !== 'auto') {
      currentSettings.syncMode = 'auto';
      saveSettings();
    }
  });
  
  syncManualRadio.addEventListener('change', () => {
    if (syncManualRadio.checked && currentSettings.syncMode !== 'manual') {
      currentSettings.syncMode = 'manual';
      saveSettings();
    }
  });
  
  // 监听存储变化（来自其他窗口的设置变更）
  api.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
      let needsUpdate = false;
      
      if (changes.theme) {
        currentSettings.theme = changes.theme.newValue;
        applyThemeSelection(currentSettings.theme);
        needsUpdate = true;
      }
      
      if (changes.syncMode) {
        currentSettings.syncMode = changes.syncMode.newValue;
        applySyncModeSelection(currentSettings.syncMode);
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        log('设置已从其他窗口更新:', currentSettings);
        showStatus('设置已从其他窗口同步');
      }
    }
  });
  
  // 初始化
  document.addEventListener('DOMContentLoaded', () => {
    log('配置页面加载完成');
    loadSettings();
  });
})();