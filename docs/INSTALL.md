# FuzzyTabs 安装说明

## 功能特性
- 弹框显示在浏览器中央，地址栏下方
- 模糊搜索所有打开的标签页
- 快速切换和关闭标签页
- 支持键盘快捷键操作

## 安装步骤

### Firefox 安装方法
1. 打开 Firefox 浏览器
2. 在地址栏输入 `about:addons` 并回车
3. 点击右上角的齿轮图标，选择"调试附加组件"
4. 点击"临时载入附加组件"
5. 选择 `extension.zip` 文件
6. 扩展安装完成

### 使用方法
- **打开搜索**：点击工具栏图标或按 `Ctrl+Shift+Space`
- **导航**：使用上下箭头键或 `Ctrl+N/P`
- **激活标签**：按回车键
- **关闭标签**：`Ctrl+W` (macOS) 或 `Alt+W` (Windows/Linux)
- **关闭搜索**：按 `Esc` 键或点击背景

## 技术变更
- 从 popup 模式改为内容脚本注入模式
- 使用 iframe 实现精确定位
- 支持在地址栏下方居中显示
- 保持所有原有功能不变

## 故障排除
如果扩展加载失败，请确保：
1. Firefox 版本支持 Manifest V2
2. 所有文件都包含在 extension.zip 中
3. manifest.json 语法正确
4. 在普通网页（不是 about: 页面）上测试

## 文件结构
```
FuzzyTabs/
├── manifest.json          # 扩展配置
├── background.js          # 后台脚本
├── content.js            # 内容脚本（新增）
├── app.html             # 用户界面
├── app.js              # 应用逻辑
├── app.css             # 样式文件
├── microfuzz.bundle.js  # 模糊搜索引擎
├── icons/              # 图标文件
└── extension.zip       # 打包的扩展文件