# 发布指南

## 准备工作已完成 ✅

以下文件已准备好：
- ✅ `README.md` - 完整的项目文档
- ✅ `LICENSE` - MIT 许可证
- ✅ `.gitignore` - Git 忽略规则
- ✅ `icon.svg` - 应用图标源文件
- ✅ `public/icon.png` - 应用图标（1024x1024）
- ✅ `package.json` - 打包配置
- ✅ 所有代码修复（旋转 bug、关于页面、编辑功能等）

## 步骤 1：生成图标

```bash
cd /Users/chengchuan/Desktop/pdf-editor
npm install sharp
node scripts/generate-icon.js
```

## 步骤 2：构建安装包

### macOS DMG
```bash
npm run electron:build:mac
```
输出：`release/PDF-Editor-1.0.0-arm64.dmg` 和 `release/PDF-Editor-1.0.0-x64.dmg`

### Windows EXE
```bash
npm run electron:build:win
```
输出：`release/PDF Editor Setup 1.0.0.exe`

### 同时构建两个平台
```bash
npm run electron:build:all
```

## 步骤 3：初始化 Git 仓库

```bash
cd /Users/chengchuan/Desktop/pdf-editor

# 初始化 git
git init
git add .
git commit -m "Initial release v1.0.0

- PDF 查看与导航（高清渲染、缩放、翻页、缩略图、书签）
- 注释与标注（高亮、下划线、画笔、橡皮擦、形状、便签、文字）
- PDF 编辑（文字编辑、插入图片、插入空白页、涂白工具）
- 页面管理（旋转、删除、合并、拆分）
- 安全与导出（加密、导出图片、打印、电子签名）
- 用户界面（深色主题、分组工具栏、侧边栏、右键菜单）
- 跨平台支持（macOS + Windows）"
```

## 步骤 4：创建 GitHub 仓库

1. 访问 https://github.com/new
2. 仓库名：`pdf-editor`
3. 描述：`功能完善的跨平台 PDF 查看与编辑器`
4. 设为 Public（公开）
5. 不要勾选 README、.gitignore、LICENSE（我们已有这些文件）
6. 点击 Create repository

## 步骤 5：推送到 GitHub

```bash
# 替换 YOUR_USERNAME 为你的 GitHub 用户名
git remote add origin https://github.com/YOUR_USERNAME/pdf-editor.git
git branch -M main
git push -u origin main
```

## 步骤 6：创建 Release 并上传安装包

### 方法 A：使用 GitHub CLI（推荐）

```bash
# 安装 GitHub CLI（如果未安装）
brew install gh

# 登录
gh auth login

# 创建 Release 并上传文件
gh release create v1.0.0 \
  --title "v1.0.0 - 初始发布" \
  --notes "## 🎉 PDF Editor v1.0.0

首次公开发布！

### ✨ 主要功能
- 📄 PDF 查看与导航（高清渲染、缩放、翻页、缩略图、书签）
- ✏️ 注释与标注（高亮、下划线、画笔、橡皮擦、形状、便签、文字）
- 📝 PDF 编辑（文字编辑、插入图片、插入空白页、涂白工具）
- 📑 页面管理（旋转、删除、合并、拆分）
- 🔐 安全与导出（加密、导出图片、打印、电子签名）
- 🎨 用户界面（深色主题、分组工具栏、侧边栏、右键菜单）

### 📥 下载
- **macOS**: PDF-Editor-1.0.0.dmg（支持 Intel 和 Apple Silicon）
- **Windows**: PDF-Editor-Setup-1.0.0.exe

详细功能说明请查看 [README](README.md)" \
  release/*.dmg \
  "release/PDF Editor Setup 1.0.0.exe"
```

### 方法 B：手动上传

1. 访问你的 GitHub 仓库页面
2. 点击右侧 "Releases" → "Create a new release"
3. Tag version: `v1.0.0`
4. Release title: `v1.0.0 - 初始发布`
5. 描述：粘贴上面的 Release Notes
6. 点击 "Attach binaries by dropping them here"
7. 拖入以下文件：
   - `release/PDF-Editor-1.0.0-arm64.dmg`
   - `release/PDF-Editor-1.0.0-x64.dmg`（可选）
   - `release/PDF Editor Setup 1.0.0.exe`
8. 点击 "Publish release"

## 步骤 7：更新 README 中的下载链接

发布完成后，编辑 README.md，将下载链接更新为实际的 Release URL：

```markdown
| 平台 | 下载链接 | 说明 |
|------|---------|------|
| macOS (Apple Silicon) | [PDF-Editor-1.0.0-arm64.dmg](https://github.com/YOUR_USERNAME/pdf-editor/releases/download/v1.0.0/PDF-Editor-1.0.0-arm64.dmg) | M1/M2/M3 芯片 |
| macOS (Intel) | [PDF-Editor-1.0.0.dmg](https://github.com/YOUR_USERNAME/pdf-editor/releases/download/v1.0.0/PDF-Editor-1.0.0.dmg) | Intel 芯片 |
| Windows (64位) | [PDF-Editor-Setup-1.0.0.exe](https://github.com/YOUR_USERNAME/pdf-editor/releases/download/v1.0.0/PDF-Editor-Setup-1.0.0.exe) | Windows 10/11 |
```

然后提交更新：
```bash
git add README.md
git commit -m "Update download links in README"
git push
```

## 完成！🎉

你的 PDF Editor 现在已经：
- ✅ 构建为 macOS 和 Windows 安装包
- ✅ 推送到 GitHub 仓库
- ✅ 创建了 Release 并上传了安装包
- ✅ README 包含完整的下载链接

用户现在可以：
1. 访问你的 GitHub 仓库
2. 在 Releases 页面下载安装包
3. 查看完整的文档和使用指南
4. Star 和 Fork 你的项目

## 后续更新

当你需要发布新版本时：

```bash
# 1. 更新版本号
npm version patch  # 或 minor、major

# 2. 构建
npm run electron:build:all

# 3. 创建 Release
gh release create v1.0.1 \
  --title "v1.0.1 - 修复和改进" \
  --notes "更新内容..." \
  release/*.dmg "release/PDF Editor Setup 1.0.1.exe"

# 4. 推送代码
git push
```

## 注意事项

1. **代码签名**：如果要分发给更多用户，建议购买代码签名证书
   - macOS: Apple Developer Program ($99/年)
   - Windows: EV Code Signing Certificate

2. **自动更新**：可以集成 `electron-updater` 实现应用内自动更新

3. **CI/CD**：可以配置 GitHub Actions 自动构建和发布

4. **Analytics**：可以集成匿名使用统计（需用户同意）
