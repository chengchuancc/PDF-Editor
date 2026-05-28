import { useState, useEffect, useRef, useCallback } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import type { Bookmark, PDFPage } from '../types'
import ContextMenu from './ContextMenu'
import type { ContextMenuItem } from './ContextMenu'
import './Sidebar.css'

interface SidebarProps {
  pdfDoc: PDFDocumentProxy
  currentPage: number
  onGoToPage: (page: number) => void
  activeTab: 'thumbnails' | 'bookmarks' | 'pages'
  onTabChange: (tab: 'thumbnails' | 'bookmarks' | 'pages') => void
  rotation: number
  bookmarks: Bookmark[]
  pageMetadatas: PDFPage[]
  onDeletePages: (pageIndices: number[]) => void
  onRotatePages: (pageIndices: number[], angle: number) => void
  onInsertBlankPage: (afterPageIndex: number) => void
  onInsertFromPDF: (afterPageIndex: number) => void
  onInsertFromClipboard: (afterPageIndex: number) => void
  totalPages: number
}

export default function Sidebar({
  pdfDoc,
  currentPage,
  onGoToPage,
  activeTab,
  onTabChange,
  rotation,
  bookmarks,
  pageMetadatas,
  onDeletePages,
  onRotatePages,
  onInsertBlankPage,
  onInsertFromPDF,
  onInsertFromClipboard,
  totalPages,
}: SidebarProps) {
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set())
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; page: number } | null>(null)

  const toggleSelect = (page: number, e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey) {
      setSelectedPages((prev) => {
        const next = new Set(prev)
        if (next.has(page)) next.delete(page)
        else next.add(page)
        return next
      })
    } else {
      setSelectedPages(new Set([page]))
    }
  }

  const handleDeleteSelected = () => {
    if (selectedPages.size === 0) return
    const indices = Array.from(selectedPages).map((p) => p - 1).sort((a, b) => b - a)
    onDeletePages(indices)
    setSelectedPages(new Set())
  }

  const handleRotateSelected = (angle: number) => {
    if (selectedPages.size === 0) return
    const indices = Array.from(selectedPages).map((p) => p - 1)
    onRotatePages(indices, angle)
  }

  const handleContextMenu = (e: React.MouseEvent, page: number) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, page })
  }

  const getContextMenuItems = (page: number): ContextMenuItem[] => [
    { label: '插入空白页（之后）', icon: '📄', onClick: () => onInsertBlankPage(page - 1) },
    { label: '从文件插入页面…', icon: '📎', onClick: () => onInsertFromPDF(page - 1) },
    { label: '从剪贴板插入页面', icon: '📋', onClick: () => onInsertFromClipboard(page - 1) },
    { label: '', icon: '', onClick: () => {}, separator: true },
    { label: '顺时针旋转 90°', icon: '↻', onClick: () => onRotatePages([page - 1], 90) },
    { label: '逆时针旋转 90°', icon: '↺', onClick: () => onRotatePages([page - 1], -90) },
    { label: '', icon: '', onClick: () => {}, separator: true },
    {
      label: '删除此页',
      icon: '🗑',
      onClick: () => onDeletePages([page - 1]),
      disabled: totalPages <= 1,
    },
  ]

  return (
    <div className="sidebar">
      <div className="sidebar-tabs">
        <button
          className={`sidebar-tab ${activeTab === 'thumbnails' ? 'active' : ''}`}
          onClick={() => onTabChange('thumbnails')}
          title="缩略图"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <rect x="1" y="1" width="5" height="5" rx="0.5" fill="none" stroke="currentColor" strokeWidth="1" />
            <rect x="8" y="1" width="5" height="5" rx="0.5" fill="none" stroke="currentColor" strokeWidth="1" />
            <rect x="1" y="8" width="5" height="5" rx="0.5" fill="none" stroke="currentColor" strokeWidth="1" />
            <rect x="8" y="8" width="5" height="5" rx="0.5" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
        </button>
        <button
          className={`sidebar-tab ${activeTab === 'bookmarks' ? 'active' : ''}`}
          onClick={() => onTabChange('bookmarks')}
          title="书签"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M3 1h8v12l-4-2.5L3 13V1z" fill="none" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
        <button
          className={`sidebar-tab ${activeTab === 'pages' ? 'active' : ''}`}
          onClick={() => onTabChange('pages')}
          title="页面管理"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <rect x="2" y="1" width="10" height="12" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <line x1="4" y1="4" x2="10" y2="4" stroke="currentColor" strokeWidth="1" />
            <line x1="4" y1="7" x2="10" y2="7" stroke="currentColor" strokeWidth="1" />
            <line x1="4" y1="10" x2="8" y2="10" stroke="currentColor" strokeWidth="1" />
          </svg>
        </button>
      </div>

      <div className="sidebar-content">
        {activeTab === 'thumbnails' && (
          <Thumbnails
            pdfDoc={pdfDoc}
            currentPage={currentPage}
            onGoToPage={onGoToPage}
            rotation={rotation}
            totalPages={totalPages}
            onContextMenu={handleContextMenu}
          />
        )}
        {activeTab === 'bookmarks' && (
          <BookmarkList bookmarks={bookmarks} onGoToPage={onGoToPage} />
        )}
        {activeTab === 'pages' && (
          <PageManager
            pdfDoc={pdfDoc}
            currentPage={currentPage}
            onGoToPage={onGoToPage}
            rotation={rotation}
            pageMetadatas={pageMetadatas}
            selectedPages={selectedPages}
            toggleSelect={toggleSelect}
            onDeleteSelected={handleDeleteSelected}
            onRotateSelected={handleRotateSelected}
            onContextMenu={handleContextMenu}
            totalPages={totalPages}
          />
        )}
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={getContextMenuItems(contextMenu.page)}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}

function Thumbnails({
  pdfDoc,
  currentPage,
  onGoToPage,
  rotation,
  totalPages,
  onContextMenu,
}: {
  pdfDoc: PDFDocumentProxy
  currentPage: number
  onGoToPage: (page: number) => void
  rotation: number
  totalPages: number
  onContextMenu: (e: React.MouseEvent, page: number) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map())
  const renderedRef = useRef<Set<number>>(new Set())

  const renderThumbnail = useCallback(async (pageNum: number) => {
    if (renderedRef.current.has(pageNum)) return
    const canvas = canvasRefs.current.get(pageNum)
    if (!canvas) return

    try {
      const page = await pdfDoc.getPage(pageNum)
      const scale = 0.3
      const viewport = page.getViewport({ scale, rotation })
      canvas.width = viewport.width
      canvas.height = viewport.height
      const ctx = canvas.getContext('2d')!
      await page.render({ canvasContext: ctx, viewport, canvas }).promise
      renderedRef.current.add(pageNum)
    } catch { /* ignore */ }
  }, [pdfDoc, rotation])

  useEffect(() => {
    renderedRef.current.clear()
    for (let i = 1; i <= totalPages; i++) {
      renderThumbnail(i)
    }
  }, [totalPages, renderThumbnail])

  useEffect(() => {
    const current = containerRef.current
    if (!current) return
    const activeThumb = current.querySelector(`[data-page="${currentPage}"]`)
    if (activeThumb) {
      activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [currentPage])

  return (
    <div className="thumbnail-list" ref={containerRef}>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
        <div
          key={pageNum}
          data-page={pageNum}
          className={`thumbnail-item ${currentPage === pageNum ? 'active' : ''}`}
          onClick={() => onGoToPage(pageNum)}
          onContextMenu={(e) => onContextMenu(e, pageNum)}
        >
          <div className="thumbnail-canvas-wrapper">
            <canvas
              ref={(el) => {
                if (el) canvasRefs.current.set(pageNum, el)
              }}
            />
          </div>
          <span className="thumbnail-label">{pageNum}</span>
        </div>
      ))}
    </div>
  )
}

function BookmarkList({
  bookmarks,
  onGoToPage,
}: {
  bookmarks: Bookmark[]
  onGoToPage: (page: number) => void
}) {
  if (bookmarks.length === 0) {
    return (
      <div className="empty-state">
        <p>暂无书签</p>
      </div>
    )
  }

  return (
    <div className="bookmark-list">
      {bookmarks.map((bm, i) => (
        <div
          key={i}
          className="bookmark-item"
          onClick={() => onGoToPage(bm.pageNumber)}
        >
          <span className="bookmark-icon">🔖</span>
          <span className="bookmark-title">{bm.title}</span>
          <span className="bookmark-page">p.{bm.pageNumber}</span>
        </div>
      ))}
    </div>
  )
}

function PageManager({
  pdfDoc,
  currentPage,
  onGoToPage,
  rotation,
  pageMetadatas,
  selectedPages,
  toggleSelect,
  onDeleteSelected,
  onRotateSelected,
  onContextMenu,
  totalPages,
}: {
  pdfDoc: PDFDocumentProxy
  currentPage: number
  onGoToPage: (page: number) => void
  rotation: number
  pageMetadatas: PDFPage[]
  selectedPages: Set<number>
  toggleSelect: (page: number, e: React.MouseEvent) => void
  onDeleteSelected: () => void
  onRotateSelected: (angle: number) => void
  onContextMenu: (e: React.MouseEvent, page: number) => void
  totalPages: number
}) {
  return (
    <div className="page-manager">
      <div className="page-manager-toolbar">
        <button
          onClick={() => onRotateSelected(90)}
          disabled={selectedPages.size === 0}
          title="顺时针旋转选中页"
        >
          ↻ 旋转
        </button>
        <button
          onClick={() => onRotateSelected(-90)}
          disabled={selectedPages.size === 0}
          title="逆时针旋转选中页"
        >
          ↺ 旋转
        </button>
        <button
          onClick={onDeleteSelected}
          disabled={selectedPages.size === 0 || selectedPages.size >= totalPages}
          title="删除选中页"
          className="btn-delete"
        >
          🗑 删除
        </button>
      </div>
      <div className="page-manager-hint">
        按住 Cmd/Ctrl 点击可多选 · 右键查看更多操作
      </div>
      <div className="page-manager-list">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
          const meta = pageMetadatas[pageNum - 1]
          return (
            <div
              key={pageNum}
              className={`page-manager-item ${selectedPages.has(pageNum) ? 'selected' : ''} ${currentPage === pageNum ? 'current' : ''}`}
              onClick={(e) => {
                toggleSelect(pageNum, e)
                onGoToPage(pageNum)
              }}
              onContextMenu={(e) => onContextMenu(e, pageNum)}
            >
              <span className="page-num">{pageNum}</span>
              <span className="page-size">
                {meta ? `${Math.round(meta.width)}×${Math.round(meta.height)}` : ''}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
