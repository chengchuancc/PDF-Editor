import './StatusBar.css'

interface StatusBarProps {
  currentPage: number
  totalPages: number
  zoom: number
  rotation: number
  fileName: string
}

export default function StatusBar({ currentPage, totalPages, zoom, rotation, fileName }: StatusBarProps) {
  return (
    <div className="statusbar">
      <div className="statusbar-left">
        {fileName && <span className="statusbar-filename">{fileName}</span>}
      </div>
      <div className="statusbar-right">
        {totalPages > 0 && (
          <>
            <span>第 {currentPage} / {totalPages} 页</span>
            <span className="statusbar-sep">|</span>
            <span>{Math.round(zoom * 100)}%</span>
            {rotation !== 0 && (
              <>
                <span className="statusbar-sep">|</span>
                <span>{rotation}°</span>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
