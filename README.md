# PDF Editor

> 功能完善的跨平台 PDF 查看与编辑器，支持注释、编辑、签名、加密、合并、拆分、导出等功能。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows-lightgrey)]()
[![Electron](https://img.shields.io/badge/Electron-31.2.0-47848F?logo=electron)]()
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)]()

## 📥 下载

| 平台 | 下载链接 | 大小 | 说明 |
|------|---------|------|------|
| macOS (Apple Silicon) | [PDF.Editor-1.0.0-arm64.dmg](https://github.com/chengchuancc/PDF-Editor/releases/download/v1.0.0/PDF.Editor-1.0.0-arm64.dmg) | 114 MB | M1 / M2 / M3 / M4 芯片 |
| macOS (Intel) | [PDF.Editor-1.0.0.dmg](https://github.com/chengchuancc/PDF-Editor/releases/download/v1.0.0/PDF.Editor-1.0.0.dmg) | 122 MB | Intel 芯片 |

> 💡 如果下载链接失效，请前往 [Releases 页面](https://github.com/chengchuancc/PDF-Editor/releases) 查看最新版本。
>
> 🪟 Windows 版本暂未提供，如有需要可以自行从源码构建：`npm run electron:build:win`

## ✨ 功能特性

### 📄 PDF 查看与导航
- **高清渲染**：支持 Retina/HiDPI 屏幕，PDF 显示清晰锐利
- **缩放控制**：支持 25% - 500% 缩放，提供"适合宽度"和"适合页面"快捷选项
- **页面导航**：上/下一页、页码跳转、缩略图预览
- **书签支持**：自动读取 PDF 内置书签，快速跳转

### ✏️ 注释与标注
- **高亮标记**：选中文本区域高亮（黄色半透明）
- **下划线**：为文本添加下划线标注
- **画笔工具**：自由绘制红色笔迹
- **橡皮擦**：擦除画笔内容
- **形状工具**：矩形、圆形、箭头
- **便签**：添加文字便签注释
- **文字注释**：在任意位置添加文本框
- **拖拽移动**：选择工具下可拖拽移动所有注释
- **双击编辑**：双击文字注释可内联编辑内容
- **双击删除**：双击任意注释可删除

### 📝 PDF 编辑
- **文字编辑**：点击 PDF 中的文字块，弹出编辑对话框修改内容、字号、颜色
- **插入图片**：选择图片文件插入到 PDF 页面，支持拖拽缩放
- **插入空白页**：在任意位置插入空白页
- **从文件插入**：从其他 PDF 文件中插入页面
- **从剪贴板插入**：粘贴剪贴板中的图片或文字
- **涂白工具**：用白色矩形覆盖 PDF 原文内容

### 📑 页面管理
- **单页旋转**：旋转当前页（顺时针/逆时针 90°）
- **批量旋转**：旋转所有页面
- **删除页面**：删除单页或多页（支持 Cmd/Ctrl 多选）
- **合并 PDF**：将多个 PDF 文件合并为一个
- **拆分 PDF**：按页码范围或每 N 页拆分为多个文件

### 🔐 安全与导出
- **PDF 加密**：设置密码保护 PDF，限制打印/复制/修改权限
- **导出为图片**：将当前页导出为高清 PNG 图片
- **打印**：支持直接打印 PDF
- **电子签名**：手写签名板，签名可放置到 PDF 页面任意位置

### 🎨 用户界面
- **深色主题**：专业的深色工具栏 + 浅色文档工作区
- **分组工具栏**：8 个清晰标注的功能区（文件、导航、视图、批注、编辑、页面、导出、帮助）
- **侧边栏**：缩略图、书签、页面管理三个标签页
- **右键菜单**：侧边栏缩略图/页面列表支持右键快捷操作
- **状态栏**：显示当前页码、总页数、缩放比例、文件名
- **跨平台**：支持 macOS 和 Windows，界面风格统一

## 🚀 快速开始

### 环境要求
- Node.js 18+ 
- npm 9+

### 安装依赖
```bash
cd pdf-editor
npm install
```

### 开发模式
```bash
npm run dev
```
启动后会自动打开 Electron 窗口，支持热更新。

### 构建生产版本

#### macOS
```bash
npm run electron:build:mac
```
输出：`release/PDF-Editor-1.0.0.dmg`

#### Windows
```bash
npm run electron:build:win
```
输出：`release/PDF-Editor-Setup-1.0.0.exe`

#### 同时构建两个平台
```bash
npm run electron:build:all
```

## 📖 使用指南

### 打开 PDF
- 点击工具栏"文件"区的 📂 图标
- 或使用快捷键 `Cmd/Ctrl + O`
- 或在欢迎页面点击"打开文件"按钮

### 编辑文字
1. 点击工具栏"编辑"区的 ✏️ "编辑文字"按钮
2. PDF 中的文字块会出现蓝色高亮框（hover 时）
3. 点击文字块 → 弹出编辑对话框
4. 修改文字内容、字号、颜色
5. 点击"替换文字"

### 插入图片
1. 点击工具栏"编辑"区的 🖼️ "插入图片"按钮
2. 选择图片文件
3. 点击 PDF 页面放置图片
4. 使用选择工具拖拽右下角手柄调整大小

### 旋转页面
- **单页旋转**：工具栏"页面"区的 ↺↻ 按钮（带数字 1）
- **批量旋转**：工具栏"页面"区的 ↺↻ 按钮（带"全"字）
- **右键菜单**：在侧边栏缩略图上右键，选择旋转选项

### 合并 PDF
1. 点击工具栏"页面"区的合并按钮
2. 当前 PDF 作为第一个文件
3. 点击"添加 PDF 文件"选择其他 PDF
4. 可调整顺序和移除
5. 点击"合并"

### 拆分 PDF
1. 点击工具栏"页面"区的拆分按钮
2. 选择拆分模式：
   - **按页码范围**：如 `1-3, 4, 5-8`
   - **每 N 页**：每 N 页生成一个文件
3. 点击"拆分"

### 注释操作
- **添加**：选择注释工具后在页面上绘制
- **移动**：切换到选择工具，拖拽注释
- **编辑文字**：双击文字注释
- **删除**：双击任意注释

## 🏗️ 技术架构

### 技术栈
| 技术 | 用途 | 版本 |
|------|------|------|
| Electron | 跨平台桌面应用框架 | 31.2.0 |
| React | UI 框架 | 19.2.6 |
| TypeScript | 类型安全 | 6.0.2 |
| Vite | 构建工具 | 8.0.12 |
| PDF.js (pdfjs-dist) | PDF 渲染引擎 | 4.4.168 |
| pdf-lib | PDF 操作库 | 1.17.1 |
| Fabric.js | Canvas 画布库 | 6.5.4 |

### 项目结构
```
pdf-editor/
├── electron/                 # Electron 主进程
│   ├── main.js              # 主进程入口，窗口管理、菜单、IPC
│   └── preload.js           # 预加载脚本，暴露安全 API 给渲染进程
├── src/                      # React 渲染进程
│   ├── App.tsx              # 应用根组件，状态管理、事件处理
│   ├── main.tsx             # React 入口
│   ├── index.css            # 全局样式
│   ├── types/               # TypeScript 类型定义
│   │   └── index.ts         # Tool、Annotation、PDFPage 等类型
│   ├── utils/               # 工具函数
│   │   └── pdfOperations.ts # PDF 操作封装（合并、拆分、旋转、加密等）
│   └── components/          # React 组件
│       ├── Toolbar.tsx      # 工具栏（8 个分组区域）
│       ├── Sidebar.tsx      # 侧边栏（缩略图、书签、页面管理）
│       ├── PDFViewer.tsx    # PDF 渲染器（核心组件）
│       ├── StatusBar.tsx    # 状态栏
│       ├── ContextMenu.tsx  # 右键菜单
│       ├── AboutModal.tsx   # 关于对话框
│       ├── SignatureModal.tsx # 签名对话框
│       ├── NoteModal.tsx    # 便签对话框
│       ├── EncryptModal.tsx # 加密对话框
│       ├── MergeModal.tsx   # 合并对话框
│       ├── SplitModal.tsx   # 拆分对话框
│       └── EditTextBlockModal.tsx # 文字编辑对话框
├── public/                   # 静态资源
│   ├── icon.png             # 应用图标（1024x1024）
│   └── pdf.worker.mjs       # PDF.js Worker 文件
├── icon.svg                  # 图标源文件（SVG）
├── package.json              # 项目配置
├── vite.config.ts            # Vite 配置
└── tsconfig.json             # TypeScript 配置
```

### 核心实现细节

#### PDF 渲染（PDFViewer.tsx）
- **Retina 支持**：使用 `window.devicePixelRatio` 计算实际像素，canvas 物理尺寸 = 逻辑尺寸 × DPR，渲染前调用 `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)` 缩放上下文
- **坐标系转换**：PDF.js 使用左下角原点（Y 轴向上），pdf-lib 和屏幕坐标使用左上角原点（Y 轴向下），通过 `viewport.convertToViewportPoint()` 转换
- **文字提取**：使用 `page.getTextContent()` 提取文字坐标，合并同行相邻文字为逻辑块
- **注释渲染**：独立的 overlay div 覆盖在 canvas 上，所有注释使用绝对定位

#### PDF 操作（pdfOperations.ts）
- **旋转实现**：调用 `page.setRotation(degrees(angle))` 设置 `/Rotate` 标记，同时交换 MediaBox 宽高（90°/270° 时），确保 PDF.js 正确渲染
- **文字编辑**：使用 whiteout（白色矩形）覆盖原文 + 叠加新的文字注释，保存时通过 pdf-lib 渲染到 PDF
- **图片插入**：将图片转为 Data URL 存储为注释，保存时通过 pdf-lib 嵌入 PDF

#### 状态管理（App.tsx）
- **PDF 数据**：`pdfBytes` (Uint8Array) 存储原始 PDF 二进制数据
- **注释数据**：`Map<number, Annotation[]>` 按页码存储注释
- **页面元数据**：`PDFPage[]` 存储每页的宽高和旋转角度
- **工具状态**：`activeTool` 控制当前激活的工具类型

#### Electron IPC（main.js + preload.js）
- **文件操作**：`dialog:openFile`、`dialog:saveFile`、`fs:writeFile`、`fs:readFile`
- **菜单事件**：`menu-save`、`menu-save-as`、`menu-print`、`menu-about`
- **安全隔离**：使用 `contextIsolation: true` 和 `preload` 脚本，渲染进程无法直接访问 Node.js API

## 🤖 AI 编辑指南

### 给其他 AI 助手的说明

如果你是一个 AI 助手，需要修改这个项目，请注意以下几点：

#### 1. 添加新工具
在 `src/types/index.ts` 的 `Tool` 类型中添加新工具名称，然后在 `PDFViewer.tsx` 的 `handleMouseDown` 中处理该工具的点击事件。

#### 2. 添加新注释类型
在 `src/types/index.ts` 的 `Annotation` 类型中添加新类型，然后在 `PDFViewer.tsx` 的 `AnnotationRenderer` 组件中添加渲染逻辑。

#### 3. 添加新 PDF 操作
在 `src/utils/pdfOperations.ts` 中封装 pdf-lib 操作，然后在 `App.tsx` 中添加回调函数并传递给 UI 组件。

#### 4. 修改 UI 布局
- 工具栏：`src/components/Toolbar.tsx`，使用 `ToolbarSection` 组件分组
- 侧边栏：`src/components/Sidebar.tsx`，三个标签页独立实现
- 对话框：创建新的 `*Modal.tsx` 组件，在 `App.tsx` 中管理显示状态

#### 5. 调试技巧
- 开发模式下按 `Cmd/Ctrl + Shift + I` 打开开发者工具
- 查看控制台日志定位问题
- 使用 React DevTools 检查组件状态
- 在 `electron/main.js` 中添加 `mainWindow.webContents.openDevTools()` 自动打开 DevTools

#### 6. 常见问题
- **PDF 渲染模糊**：检查 `PDFViewer.tsx` 中的 Retina 渲染逻辑，确保使用了 `devicePixelRatio`
- **旋转后内容错位**：检查 `rotatePages` 函数是否正确交换了 MediaBox 宽高
- **注释位置偏移**：检查坐标系转换，确保使用了 `viewport.convertToViewportPoint()`
- **保存后注释丢失**：检查 `handleSave` 是否正确将注释渲染到 PDF（通过 pdf-lib）

#### 7. 构建和发布
```bash
# 本地测试
npm run dev

# 构建生产版本
npm run electron:build:mac  # macOS
npm run electron:build:win  # Windows

# 创建 GitHub Release
gh release create v1.0.0 \
  release/PDF-Editor-1.0.0.dmg \
  release/PDF-Editor-Setup-1.0.0.exe \
  --title "v1.0.0" \
  --notes "初始发布版本"
```

## 📝 更新日志

### v1.0.0 (2026-05-28)
- ✨ 初始发布版本
- 📄 PDF 查看与导航（高清渲染、缩放、翻页、缩略图、书签）
- ✏️ 注释与标注（高亮、下划线、画笔、橡皮擦、形状、便签、文字）
- 📝 PDF 编辑（文字编辑、插入图片、插入空白页、涂白工具）
- 📑 页面管理（旋转、删除、合并、拆分）
- 🔐 安全与导出（加密、导出图片、打印、电子签名）
- 🎨 用户界面（深色主题、分组工具栏、侧边栏、右键菜单）

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 👨‍💻 作者

**程川 (chengchuan)**

## 🙏 致谢

- [PDF.js](https://mozilla.github.io/pdf.js/) - Mozilla 开源的 PDF 渲染引擎
- [pdf-lib](https://pdf-lib.js.org/) - 强大的 PDF 操作库
- [Electron](https://www.electronjs.org/) - 跨平台桌面应用框架
- [React](https://react.dev/) - UI 框架

---

**注意**：本项目仅供学习和研究使用。在处理敏感 PDF 文件时，请确保遵守相关法律法规。
