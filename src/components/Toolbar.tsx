import type { Tool } from '../types'
import './Toolbar.css'

interface ToolbarProps {
  activeTool: Tool
  onToolChange: (tool: Tool) => void
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onFitWidth: () => void
  onFitPage: () => void
  onOpen: () => void
  onSave: () => void
  onPrint: () => void
  onRotateLeft: () => void
  onRotateRight: () => void
  onRotateAllLeft: () => void
  onRotateAllRight: () => void
  onExportImage: () => void
  onEncrypt: () => void
  onSignature: () => void
  onMerge: () => void
  onSplit: () => void
  onAbout: () => void
  onToggleSidebar: () => void
  sidebarOpen: boolean
  hasPDF: boolean
  currentPage: number
  totalPages: number
  onPrevPage: () => void
  onNextPage: () => void
  onGoToPage: (page: number) => void
}

function ToolbarButton({
  active,
  onClick,
  title,
  disabled,
  children,
}: {
  active?: boolean
  onClick: () => void
  title: string
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      className={`toolbar-btn ${active ? 'active' : ''}`}
      onClick={onClick}
      title={title}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

function ToolbarSection({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="toolbar-section">
      <span className="toolbar-section-label">{label}</span>
      <div className="toolbar-section-buttons">
        {children}
      </div>
    </div>
  )
}

function SectionDivider() {
  return <div className="toolbar-section-divider" />
}

export default function Toolbar({
  activeTool,
  onToolChange,
  zoom,
  onZoomIn,
  onZoomOut,
  onFitWidth,
  onFitPage,
  onOpen,
  onSave,
  onPrint,
  onRotateLeft,
  onRotateRight,
  onRotateAllLeft,
  onRotateAllRight,
  onExportImage,
  onEncrypt,
  onSignature,
  onMerge,
  onSplit,
  onAbout,
  onToggleSidebar,
  sidebarOpen,
  hasPDF,
  currentPage,
  totalPages,
  onPrevPage,
  onNextPage,
  onGoToPage,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <ToolbarButton onClick={onToggleSidebar} title={sidebarOpen ? '隐藏侧边栏' : '显示侧边栏'}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="2" width="14" height="12" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <line x1="5" y1="2" x2="5" y2="14" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </ToolbarButton>
      </div>

      <SectionDivider />

      <ToolbarSection label="文件">
        <ToolbarButton onClick={onOpen} title="打开文件 (Ctrl+O)">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h3.879a1.5 1.5 0 0 1 1.06.44l1.122 1.12A1.5 1.5 0 0 0 9.62 4H13.5A1.5 1.5 0 0 1 15 5.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5v-9z" fill="none" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={onSave} title="保存 (Ctrl+S)" disabled={!hasPDF}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 2.5A1.5 1.5 0 0 1 3.5 1h7.793a1.5 1.5 0 0 1 1.06.44l1.208 1.207A1.5 1.5 0 0 1 14 3.708V13.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 13.5v-11z" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <rect x="4.5" y="8" width="7" height="5" rx="0.5" fill="none" stroke="currentColor" strokeWidth="1" />
            <rect x="5" y="2" width="4" height="3" rx="0.5" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={onPrint} title="打印" disabled={!hasPDF}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="4" y="1" width="8" height="4" rx="0.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <rect x="1.5" y="5" width="13" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <rect x="4" y="9" width="8" height="5" rx="0.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </ToolbarButton>
      </ToolbarSection>

      <SectionDivider />

      <ToolbarSection label="导航">
        <ToolbarButton onClick={onPrevPage} title="上一页" disabled={!hasPDF || currentPage <= 1}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M9 2L4 7l5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </ToolbarButton>
        <div className="page-input-group">
          <input
            type="number"
            className="page-input"
            value={currentPage}
            min={1}
            max={totalPages}
            disabled={!hasPDF}
            onChange={(e) => onGoToPage(parseInt(e.target.value) || 1)}
          />
          <span className="page-total">/ {totalPages || '—'}</span>
        </div>
        <ToolbarButton onClick={onNextPage} title="下一页" disabled={!hasPDF || currentPage >= totalPages}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M5 2l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </ToolbarButton>
      </ToolbarSection>

      <SectionDivider />

      <ToolbarSection label="视图">
        <ToolbarButton onClick={onZoomOut} title="缩小 (Ctrl-)" disabled={!hasPDF}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <line x1="11" y1="11" x2="14" y2="14" stroke="currentColor" strokeWidth="1.2" />
            <line x1="4.5" y1="7" x2="9.5" y2="7" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </ToolbarButton>
        <span className="zoom-label">{Math.round(zoom * 100)}%</span>
        <ToolbarButton onClick={onZoomIn} title="放大 (Ctrl+)" disabled={!hasPDF}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <line x1="11" y1="11" x2="14" y2="14" stroke="currentColor" strokeWidth="1.2" />
            <line x1="4.5" y1="7" x2="9.5" y2="7" stroke="currentColor" strokeWidth="1.2" />
            <line x1="7" y1="4.5" x2="7" y2="9.5" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={onFitWidth} title="适合宽度" disabled={!hasPDF}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="3" width="14" height="10" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <line x1="4" y1="8" x2="12" y2="8" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={onFitPage} title="适合页面" disabled={!hasPDF}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="3" y="1" width="10" height="14" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </ToolbarButton>
      </ToolbarSection>

      <SectionDivider />

      <ToolbarSection label="批注">
        <ToolbarButton onClick={() => onToolChange('highlight')} active={activeTool === 'highlight'} title="高亮" disabled={!hasPDF}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M10.5 1.5l4 4-8 8H3v-3.5l7.5-8.5z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            <line x1="8" y1="4" x2="12" y2="8" stroke="currentColor" strokeWidth="1" />
            <rect x="1" y="13" width="14" height="2" rx="0.5" fill="#ffd700" opacity="0.6" />
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => onToolChange('underline')} active={activeTool === 'underline'} title="下划线" disabled={!hasPDF}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 2v6a4 4 0 0 0 8 0V2" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <line x1="3" y1="14" x2="13" y2="14" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => onToolChange('draw')} active={activeTool === 'draw'} title="画笔" disabled={!hasPDF}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M11.5 1.5l3 3-9 9H2.5v-3l9-9z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => onToolChange('eraser')} active={activeTool === 'eraser'} title="橡皮擦" disabled={!hasPDF}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M13 5L6 12H2l-1-1 5-7h2l5 1z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            <line x1="5" y1="8" x2="9" y2="4" stroke="currentColor" strokeWidth="1" />
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => onToolChange('rectangle')} active={activeTool === 'rectangle'} title="矩形" disabled={!hasPDF}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="2" y="3" width="12" height="10" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => onToolChange('circle')} active={activeTool === 'circle'} title="圆形" disabled={!hasPDF}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => onToolChange('arrow')} active={activeTool === 'arrow'} title="箭头" disabled={!hasPDF}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <line x1="2" y1="14" x2="14" y2="2" stroke="currentColor" strokeWidth="1.2" />
            <polyline points="8,2 14,2 14,8" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => onToolChange('note')} active={activeTool === 'note'} title="便签" disabled={!hasPDF}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 2h12v9l-3 3H2V2z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M11 11v3l3-3h-3z" fill="currentColor" opacity="0.3" />
          </svg>
        </ToolbarButton>
      </ToolbarSection>

      <SectionDivider />

      <ToolbarSection label="编辑">
        <ToolbarButton onClick={() => onToolChange('select')} active={activeTool === 'select'} title="选择/移动对象" disabled={!hasPDF}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M3 1l2 12 3-4 5 1L3 1z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => onToolChange('text')} active={activeTool === 'text'} title="添加文字" disabled={!hasPDF}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 3h12M8 3v11M5 14h6" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => onToolChange('image')} active={activeTool === 'image'} title="插入图片" disabled={!hasPDF}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="2" width="14" height="12" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="5" cy="6" r="1.5" fill="currentColor" />
            <path d="M1 11l4-4 3 3 2-2 5 5H1z" fill="currentColor" opacity="0.3" />
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={onSignature} title="电子签名" disabled={!hasPDF}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M1 13c1-2 3-6 5-6s2 4 4 4 3-3 5-3" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => onToolChange('whiteout')} active={activeTool === 'whiteout'} title="涂白覆盖" disabled={!hasPDF}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="2" y="3" width="12" height="10" rx="1" fill="#fff" stroke="currentColor" strokeWidth="1.2" />
            <line x1="5" y1="7" x2="11" y2="7" stroke="#ccc" strokeWidth="1" />
            <line x1="5" y1="9" x2="11" y2="9" stroke="#ccc" strokeWidth="1" />
          </svg>
        </ToolbarButton>
      </ToolbarSection>

      <SectionDivider />

      <ToolbarSection label="页面">
        <ToolbarButton onClick={onRotateLeft} title="旋转当前页（逆时针）" disabled={!hasPDF}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M3 8a5 5 0 1 1 1 3" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <polyline points="1,8 3,11 5,8" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            <text x="11" y="7" fontSize="6" fill="currentColor">1</text>
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={onRotateRight} title="旋转当前页（顺时针）" disabled={!hasPDF}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M13 8a5 5 0 1 0-1 3" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <polyline points="15,8 13,11 11,8" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            <text x="3" y="7" fontSize="6" fill="currentColor">1</text>
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={onRotateAllLeft} title="旋转所有页（逆时针）" disabled={!hasPDF}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M3 8a5 5 0 1 1 1 3" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <polyline points="1,8 3,11 5,8" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            <text x="9" y="7" fontSize="5" fill="currentColor">全</text>
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={onRotateAllRight} title="旋转所有页（顺时针）" disabled={!hasPDF}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M13 8a5 5 0 1 0-1 3" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <polyline points="15,8 13,11 11,8" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            <text x="3" y="7" fontSize="5" fill="currentColor">全</text>
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={onMerge} title="合并 PDF" disabled={!hasPDF}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="2" width="8" height="10" rx="1" fill="none" stroke="currentColor" strokeWidth="1.1" />
            <rect x="7" y="4" width="8" height="10" rx="1" fill="none" stroke="currentColor" strokeWidth="1.1" />
            <path d="M5 7l3 3-3 3" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={onSplit} title="拆分 PDF" disabled={!hasPDF}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="2" width="14" height="12" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <line x1="8" y1="2" x2="8" y2="14" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2,1" />
            <path d="M4 8L1 5M4 8L1 11M12 8l3-3M12 8l3 3" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          </svg>
        </ToolbarButton>
      </ToolbarSection>

      <SectionDivider />

      <ToolbarSection label="导出">
        <ToolbarButton onClick={onExportImage} title="导出为图片" disabled={!hasPDF}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="2" width="14" height="12" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="5" cy="6" r="1.5" fill="currentColor" />
            <path d="M1 11l4-4 3 3 2-2 5 5H1z" fill="currentColor" opacity="0.3" />
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={onEncrypt} title="加密" disabled={!hasPDF}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="3" y="7" width="10" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <path d="M5 7V5a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="8" cy="11" r="1" fill="currentColor" />
          </svg>
        </ToolbarButton>
      </ToolbarSection>

      <SectionDivider />

      <ToolbarSection label="帮助">
        <ToolbarButton onClick={onAbout} title="关于 PDF Editor">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <text x="8" y="12" textAnchor="middle" fontSize="10" fill="currentColor" fontWeight="bold">i</text>
          </svg>
        </ToolbarButton>
      </ToolbarSection>
    </div>
  )
}
