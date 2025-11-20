# FuzzyTabs 安装说明

## 功能特性
- 弹框显示在浏览器中央，地址栏下方
- 模糊搜索所有打开的标签页
- 快速切换和关闭标签页
- 支持键盘快捷键操作
- 主题切换：暗黑主题和亮白主题
- 主题设置自动同步到所有打开的 FuzzyTabs 窗口
- 支持自动同步和手动同步两种模式

## 安装步骤

### Firefox 安装方法
1. 打开 Firefox 浏览器
2. 在地址栏输入 `about:addons` 并回车
3. 点击右上角的齿轮图标，选择"调试附加组件"
4. 点击"临时载入附加组件"
5. 选择解压后的 FuzzyTabs 文件夹（不是 extension.zip）
6. 扩展安装完成

### Chrome/Chromium 安装方法（暂不兼容）
⚠️ **当前版本暂不兼容 Chrome/Chromium 浏览器**
- 我们正在努力解决兼容性问题
- 请使用 Firefox 浏览器或关注后续更新

### Microsoft Edge 安装方法（暂不兼容）
⚠️ **当前版本暂不兼容 Microsoft Edge 浏览器**
- 我们正在努力解决兼容性问题
- 请使用 Firefox 浏览器或关注后续更新

### 使用方法
- **打开搜索**：点击工具栏图标或按快捷键：
  - Mac：`Shift+Command+I`
  - Windows/Linux：`Shift+Alt+I`
- **导航**：使用上下箭头键或 `Ctrl+N/P`
- **激活标签**：按回车键
- **关闭标签**：`Ctrl+W` (macOS) 或 `Alt+W` (Windows/Linux)
- **关闭搜索**：按 `Esc` 键或点击背景
- **切换主题**：点击输入框右侧的主题按钮（🌙/☀️）
- **设置页面**：右键点击工具栏图标，选择"选项"来访问主题设置

### 浏览器兼容性
- **Firefox**：✅ 完全支持，包括临时扩展安装
- **Chrome/Chromium**：❌ 暂不兼容（正在修复中）
- **Microsoft Edge**：❌ 暂不兼容（正在修复中）
- **Safari**：❌ 不支持（需要不同的 manifest 格式）

### 兼容性说明
当前版本主要针对 Firefox 浏览器进行了优化和测试。Chrome 和 Edge 浏览器的兼容性问题正在积极解决中，主要包括：
- 内容脚本注入问题
- 消息传递机制差异
- API 兼容性问题

我们计划在未来的版本中添加对 Chrome 和 Edge 的完整支持。

## 技术变更
- 从 popup 模式改为内容脚本注入模式
- 使用 iframe 实现精确定位
- 支持在地址栏下方居中显示
- 添加了明确扩展 ID 以支持 Firefox 临时扩展的存储功能
- 改进了存储 API 错误处理，提高了跨浏览器兼容性
- 保持所有原有功能不变

## 故障排除
如果扩展加载失败，请确保：
1. 浏览器版本支持 Manifest V2
2. 所有文件都包含在 FuzzyTabs 文件夹中
3. manifest.json 语法正确
4. 在普通网页（不是 about: 页面）上测试

### 浏览器特定问题
- **Firefox**：如果使用临时扩展，确保 manifest.json 中包含明确的扩展 ID
- **Chrome/Edge**：当前版本不兼容，请勿尝试安装
- **所有浏览器**：确保扩展有必要的权限（tabs、activeTab、storage、scripting）

### 主题设置问题
如果在设置页面选择主题时遇到错误：
1. 确保扩展有存储权限
2. 尝试刷新设置页面
3. 检查浏览器控制台是否有错误信息
4. 如果使用 Firefox 临时扩展，确保 manifest.json 中包含明确的扩展 ID

### Chrome/Edge 兼容性说明
**当前版本不兼容 Chrome 和 Edge 浏览器**

如果您尝试在 Chrome 或 Edge 中安装此扩展，可能会遇到以下问题：
- 内容脚本无法正确注入
- 点击扩展图标没有反应
- 控制台出现各种错误信息

**解决方案**
1. 使用 Firefox 浏览器（推荐）
2. 等待未来的兼容性更新

**开发者注意事项**
如果您是开发者并希望帮助解决兼容性问题，主要挑战包括：
- Chrome/Edge 的内容脚本注入机制与 Firefox 不同
- 消息传递 API 存在差异
- 某些 Firefox 特定的 API 在 Chrome/Edge 中不可用

欢迎提交 Pull Request 来帮助改进跨浏览器兼容性。

## 文件结构
```
FuzzyTabs/
├── manifest.json          # 扩展配置
├── background.js          # 后台脚本
├── content.js            # 内容脚本
├── app.html             # 用户界面
├── app.js              # 应用逻辑
├── app.css             # 样式文件
├── options.html        # 设置页面
├── options.js          # 设置页面逻辑
├── microfuzz.bundle.js  # 模糊搜索引擎
├── icons/              # 图标文件
└── docs/               # 文档文件
```