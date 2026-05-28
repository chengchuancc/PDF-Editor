import './AboutModal.css'

interface AboutModalProps {
  onClose: () => void
}

export default function AboutModal({ onClose }: AboutModalProps) {
  const openWebsite = () => {
    const url = 'https://www.chengchuan.cc'
    if (window.electronAPI) {
      window.open(url, '_blank')
    } else {
      window.open(url, '_blank')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="about-modal" onClick={(e) => e.stopPropagation()}>
        <div className="about-header">
          <div className="about-logo">📄</div>
          <h2>PDF Editor</h2>
          <span className="about-version">v1.0.0</span>
        </div>

        <div className="about-desc">
          <p>功能完善的 PDF 查看与编辑器</p>
          <p className="about-features">
            查看 · 注释 · 编辑 · 签名 · 加密 · 合并 · 拆分 · 导出
          </p>
        </div>

        <div className="about-divider" />

        <div className="about-author">
          <div className="about-author-label">开发者</div>
          <button className="about-author-link" onClick={openWebsite}>
            程川
          </button>
        </div>

        <div className="about-copyright">
          © {new Date().getFullYear()} 程川. All rights reserved.
        </div>

        <div className="about-tech">
          <span>Electron</span>
          <span>React</span>
          <span>TypeScript</span>
          <span>PDF.js</span>
          <span>pdf-lib</span>
        </div>

        <button className="about-close-btn" onClick={onClose}>
          关闭
        </button>
      </div>
    </div>
  )
}
