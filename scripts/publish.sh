#!/bin/bash

# PDF Editor 发布脚本
# 用法: ./scripts/publish.sh

set -e

echo "🚀 PDF Editor 发布流程开始"
echo ""

# 检查 GitHub CLI
if ! command -v gh &> /dev/null; then
    echo "❌ 未找到 GitHub CLI (gh)"
    echo "请先安装: brew install gh"
    exit 1
fi

# 检查是否已登录
if ! gh auth status &> /dev/null; then
    echo "❌ 未登录 GitHub"
    echo "请先运行: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI 已就绪"
echo ""

# 步骤 1: 生成图标
echo "📦 步骤 1/6: 生成应用图标..."
npm install sharp --save-dev > /dev/null 2>&1
node scripts/generate-icon.js
echo "✅ 图标已生成"
echo ""

# 步骤 2: 构建应用
echo "🔨 步骤 2/6: 构建 macOS 和 Windows 安装包..."
echo "   这可能需要几分钟时间，请耐心等待..."
npm run electron:build:all
echo "✅ 安装包已构建"
echo ""

# 步骤 3: 初始化 Git（如果尚未初始化）
if [ ! -d ".git" ]; then
    echo "📝 步骤 3/6: 初始化 Git 仓库..."
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
    echo "✅ Git 仓库已初始化"
else
    echo "ℹ️  步骤 3/6: Git 仓库已存在，跳过初始化"
fi
echo ""

# 步骤 4: 创建 GitHub 仓库
echo "🌐 步骤 4/6: 创建 GitHub 仓库..."
REPO_NAME="pdf-editor"
if gh repo view "$REPO_NAME" &> /dev/null; then
    echo "ℹ️  仓库 $REPO_NAME 已存在"
else
    gh repo create "$REPO_NAME" \
        --public \
        --description "功能完善的跨平台 PDF 查看与编辑器" \
        --source=. \
        --push
    echo "✅ GitHub 仓库已创建"
fi
echo ""

# 步骤 5: 推送代码
echo "📤 步骤 5/6: 推送代码到 GitHub..."
git push -u origin main || git push -u origin master
echo "✅ 代码已推送"
echo ""

# 步骤 6: 创建 Release
echo "🎁 步骤 6/6: 创建 Release 并上传安装包..."
VERSION="v1.0.0"

# 查找安装包
DMG_FILE=$(find release -name "*.dmg" | head -n 1)
EXE_FILE=$(find release -name "*.exe" | head -n 1)

if [ -z "$DMG_FILE" ] || [ -z "$EXE_FILE" ]; then
    echo "❌ 未找到安装包文件"
    echo "请检查 release/ 目录"
    exit 1
fi

gh release create "$VERSION" \
    --title "$VERSION - 初始发布" \
    --notes "## 🎉 PDF Editor $VERSION

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
    "$DMG_FILE" \
    "$EXE_FILE"

echo "✅ Release 已创建"
echo ""

# 完成
echo "🎊 发布完成！"
echo ""
echo "📍 仓库地址: $(gh repo view --json url -q .url)"
echo "📦 Release 页面: $(gh repo view --json url -q .url)/releases"
echo ""
echo "下一步："
echo "1. 访问 Release 页面确认安装包已上传"
echo "2. 更新 README.md 中的下载链接（如果需要）"
echo "3. 分享你的项目！"
