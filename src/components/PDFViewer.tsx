import {
  forwardRef,
  useRef,
  useEffect,
  useCallback,
  useState,
} from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import type { Tool, Annotation, PDFPage, TextItem, OnUpdateAnnotation } from '../types'
import './PDFViewer.css'

interface PDFViewerProps {
  pdfDoc: PDFDocumentProxy
  currentPage: number
  onPageChange: (page: number) => void
  zoom: number
  rotation: number
  activeTool: Tool
  annotations: Map<number, Annotation[]>
  onAddAnnotation: (page: number, annotation: Annotation) => void
  onRemoveAnnotation: (page: number, id: string) => void
  onUpdateAnnotation: OnUpdateAnnotation
  signatureData: string | null
  onSignaturePlaced: () => void
  onNoteClick: (page: number, x: number, y: number) => void
  onInsertImage: (page: number, x: number, y: number) => void
  onEditTextBlock: (item: TextItem) => void
  pageMetadatas: PDFPage[]
}

interface DragState {
  annotationId: string
  startX: number
  startY: number
  offsetX: number
  offsetY: number
  origX: number
  origY: number
}

interface InlineEditState {
  annotationId: string
  x: number
  y: number
  value: string
}

const PDFViewer = forwardRef<HTMLDivElement, PDFViewerProps>(function PDFViewer(
  {
    pdfDoc,
    currentPage,
    onPageChange,
    zoom,
    rotation,
    activeTool,
    annotations,
    onAddAnnotation,
    onRemoveAnnotation,
    onUpdateAnnotation,
    signatureData,
    onSignaturePlaced,
    onNoteClick,
    onInsertImage,
    onEditTextBlock,
    pageMetadatas,
  },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null)
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null)
  const [drawPoints, setDrawPoints] = useState<Array<{ x: number; y: number }>>([])
  const [textInput, setTextInput] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false,
  })
  const [textValue, setTextValue] = useState('')
  const [textItems, setTextItems] = useState<TextItem[]>([])
  const [editingTextBlock, setEditingTextBlock] = useState<{
    item: TextItem
    x: number
    y: number
    value: string
  } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Drag state for select mode
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [dragPreview, setDragPreview] = useState<{ x: number; y: number } | null>(null)

  // Inline edit state for double-click text editing
  const [inlineEdit, setInlineEdit] = useState<InlineEditState | null>(null)

  // Image resize drag
  const [imageResize, setImageResize] = useState<{
    annotationId: string
    startX: number
    startY: number
    origW: number
    origH: number
  } | null>(null)

  const renderPage = useCallback(async () => {
    if (!canvasRef.current || !pdfDoc) return
    try {
      const page = await pdfDoc.getPage(currentPage)
      const viewport = page.getViewport({ scale: zoom, rotation })
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')!

      // Retina / HiDPI rendering
      const dpr = window.devicePixelRatio || 1
      canvas.width = viewport.width * dpr
      canvas.height = viewport.height * dpr
      canvas.style.width = viewport.width + 'px'
      canvas.style.height = viewport.height + 'px'

      // Scale context to match DPR, so we draw in CSS-pixel coordinates
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      await page.render({
        canvasContext: ctx,
        viewport,
        canvas,
      }).promise
    } catch (err) {
      console.error('Render error:', err)
    }
  }, [pdfDoc, currentPage, zoom, rotation])

  const extractTextItems = useCallback(async () => {
    if (!pdfDoc) return
    try {
      const page = await pdfDoc.getPage(currentPage)
      const viewport = page.getViewport({ scale: 1, rotation })
      const textContent = await page.getTextContent()
      const items: TextItem[] = []
      for (const item of textContent.items) {
        if ('str' in item && item.str.trim()) {
          const tx = item.transform
          const fontSize = Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1])
          const itemHeight = item.height || fontSize
          const screenPos = viewport.convertToViewportPoint(tx[4], tx[5])
          items.push({
            str: item.str,
            x: screenPos[0],
            y: screenPos[1] - itemHeight,
            width: item.width,
            height: itemHeight,
            fontSize,
            fontName: item.fontName || '',
            pageIndex: currentPage - 1,
          })
        }
      }
      // Merge adjacent text items on same line into logical blocks
      const merged: TextItem[] = []
      for (const item of items) {
        const last = merged[merged.length - 1]
        if (
          last &&
          Math.abs(last.y - item.y) < 2 &&
          Math.abs(last.fontSize - item.fontSize) < 1 &&
          (item.x - (last.x + last.width)) < last.fontSize * 0.5
        ) {
          last.str += item.str
          last.width = item.x + item.width - last.x
          last.height = Math.max(last.height, item.height)
        } else {
          merged.push({ ...item })
        }
      }
      setTextItems(merged)
    } catch {
      setTextItems([])
    }
  }, [pdfDoc, currentPage, rotation])

  useEffect(() => {
    renderPage()
  }, [renderPage])

  useEffect(() => {
    extractTextItems()
  }, [extractTextItems])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
      }
    }
    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [])

  const getRelativePos = (e: React.MouseEvent) => {
    const overlay = overlayRef.current
    if (!overlay) return { x: 0, y: 0 }
    const rect = overlay.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  // Find annotation at position (in screen coordinates)
  const findAnnotationAt = useCallback(
    (screenX: number, screenY: number): Annotation | null => {
      const pageAnnotations = annotations.get(currentPage) || []
      // Iterate in reverse so topmost annotation is found first
      for (let i = pageAnnotations.length - 1; i >= 0; i--) {
        const ann = pageAnnotations[i]
        const d = ann.data
        if (ann.type === 'highlight' || ann.type === 'shape' || ann.type === 'whiteout') {
          const left = (d.x as number) * zoom
          const top = (d.y as number) * zoom
          const right = left + (d.width as number) * zoom
          const bottom = top + (d.height as number) * zoom
          if (screenX >= left && screenX <= right && screenY >= top && screenY <= bottom) {
            return ann
          }
        } else if (ann.type === 'text') {
          // Approximate text bounding box
          const left = (d.x as number) * zoom - 4
          const top = (d.y as number) * zoom - 4
          const fontSize = ((d.fontSize as number) || 14) * zoom
          const textLen = ((d.text as string) || '').length * fontSize * 0.6
          const right = left + textLen + 8
          const bottom = top + fontSize + 8
          if (screenX >= left && screenX <= right && screenY >= top && screenY <= bottom) {
            return ann
          }
        } else if (ann.type === 'note') {
          const left = (d.x as number) * zoom - 5
          const top = (d.y as number) * zoom - 5
          const right = left + 30
          const bottom = top + 30
          if (screenX >= left && screenX <= right && screenY >= top && screenY <= bottom) {
            return ann
          }
        } else if (ann.type === 'image') {
          const left = (d.x as number) * zoom
          const top = (d.y as number) * zoom
          const right = left + (d.width as number) * zoom
          const bottom = top + (d.height as number) * zoom
          if (screenX >= left && screenX <= right && screenY >= top && screenY <= bottom) {
            return ann
          }
        }
      }
      return null
    },
    [annotations, currentPage, zoom]
  )

  // Check if position is near the resize handle of an image annotation
  const findImageResizeHandle = useCallback(
    (screenX: number, screenY: number): Annotation | null => {
      const pageAnnotations = annotations.get(currentPage) || []
      const handleSize = 12
      for (let i = pageAnnotations.length - 1; i >= 0; i--) {
        const ann = pageAnnotations[i]
        if (ann.type !== 'image') continue
        const d = ann.data
        const right = ((d.x as number) + (d.width as number)) * zoom
        const bottom = ((d.y as number) + (d.height as number)) * zoom
        if (
          Math.abs(screenX - right) < handleSize &&
          Math.abs(screenY - bottom) < handleSize
        ) {
          return ann
        }
      }
      return null
    },
    [annotations, currentPage, zoom]
  )

  const handleMouseMove = (e: React.MouseEvent) => {
    // Handle image resize drag
    if (imageResize) {
      const pos = getRelativePos(e)
      const dx = (pos.x - imageResize.startX) / zoom
      const dy = (pos.y - imageResize.startY) / zoom
      const newW = Math.max(30, imageResize.origW + dx)
      const newH = Math.max(30, imageResize.origH + dy)
      onUpdateAnnotation(currentPage, imageResize.annotationId, {
        data: {
          ...((annotations.get(currentPage) || []).find(a => a.id === imageResize.annotationId)?.data || {}),
          width: newW,
          height: newH,
        },
      })
      return
    }

    // Handle annotation drag in select mode
    if (dragState) {
      const pos = getRelativePos(e)
      const newX = dragState.origX + (pos.x - dragState.startX) / zoom
      const newY = dragState.origY + (pos.y - dragState.startY) / zoom
      setDragPreview({ x: newX, y: newY })
      return
    }

    if (isDrawing) {
      const pos = getRelativePos(e)
      if (activeTool === 'draw' || activeTool === 'eraser') {
        setDrawPoints((prev) => [...prev, pos])
      } else {
        setDrawCurrent(pos)
      }
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getRelativePos(e)

    // Select mode: drag annotations
    if (activeTool === 'select') {
      // Check for image resize handle first
      const resizeAnn = findImageResizeHandle(pos.x, pos.y)
      if (resizeAnn) {
        const d = resizeAnn.data
        setImageResize({
          annotationId: resizeAnn.id,
          startX: pos.x,
          startY: pos.y,
          origW: d.width as number,
          origH: d.height as number,
        })
        return
      }

      const ann = findAnnotationAt(pos.x, pos.y)
      if (ann) {
        const d = ann.data
        const origX = (d.x as number) || 0
        const origY = (d.y as number) || 0
        setDragState({
          annotationId: ann.id,
          startX: pos.x,
          startY: pos.y,
          offsetX: 0,
          offsetY: 0,
          origX,
          origY,
        })
      }
      return
    }

    // Image tool: insert image on click
    if (activeTool === 'image') {
      onInsertImage(currentPage, pos.x / zoom, pos.y / zoom)
      return
    }

    // editText: detect clicked text block and trigger edit
    if (activeTool === 'editText') {
      // Check if clicked on an existing text block
      for (let i = textItems.length - 1; i >= 0; i--) {
        const item = textItems[i]
        const left = item.x * zoom - 4
        const top = item.y * zoom - 4
        const right = (item.x + item.width) * zoom + 4
        const bottom = (item.y + item.height) * zoom + 4
        if (pos.x >= left && pos.x <= right && pos.y >= top && pos.y <= bottom) {
          onEditTextBlock(item)
          return
        }
      }
      // If no text block hit, add a new text annotation
      setTextInput({ x: pos.x, y: pos.y, visible: true })
      setTextValue('')
      return
    }

    // text: add text annotation on click
    if (activeTool === 'text') {
      setTextInput({ x: pos.x, y: pos.y, visible: true })
      setTextValue('')
      return
    }

    if (activeTool === 'draw' || activeTool === 'eraser') {
      setIsDrawing(true)
      setDrawPoints([pos])
    } else if (activeTool === 'note') {
      onNoteClick(currentPage, pos.x / zoom, pos.y / zoom)
    } else if (activeTool === 'signature' && signatureData) {
      const annotation: Annotation = {
        id: `sig_${Date.now()}`,
        page: currentPage,
        type: 'text',
        data: {
          x: pos.x / zoom,
          y: pos.y / zoom,
          imageUrl: signatureData,
          width: 150,
          height: 60,
        },
      }
      onAddAnnotation(currentPage, annotation)
      onSignaturePlaced()
    } else if (
      activeTool === 'highlight' ||
      activeTool === 'underline' ||
      activeTool === 'rectangle' ||
      activeTool === 'circle' ||
      activeTool === 'arrow' ||
      activeTool === 'whiteout'
    ) {
      setIsDrawing(true)
      setDrawStart(pos)
      setDrawCurrent(pos)
    }
  }

  const handleMouseUp = () => {
    // Finish image resize
    if (imageResize) {
      setImageResize(null)
      return
    }

    // Finish annotation drag
    if (dragState) {
      if (dragPreview) {
        onUpdateAnnotation(currentPage, dragState.annotationId, {
          data: {
            ...((annotations.get(currentPage) || []).find(a => a.id === dragState.annotationId)?.data || {}),
            x: dragPreview.x,
            y: dragPreview.y,
          },
        })
      }
      setDragState(null)
      setDragPreview(null)
      return
    }

    if (!isDrawing) return
    setIsDrawing(false)

    if ((activeTool === 'draw' || activeTool === 'eraser') && drawPoints.length > 1) {
      const annotation: Annotation = {
        id: `draw_${Date.now()}`,
        page: currentPage,
        type: 'draw',
        data: {
          points: drawPoints.map((p) => ({ x: p.x / zoom, y: p.y / zoom })),
          color: activeTool === 'eraser' ? '#ffffff' : '#e74c3c',
          width: activeTool === 'eraser' ? 10 : 2,
          eraser: activeTool === 'eraser',
        },
      }
      onAddAnnotation(currentPage, annotation)
      setDrawPoints([])
    } else if (drawStart && drawCurrent) {
      const x1 = drawStart.x / zoom
      const y1 = drawStart.y / zoom
      const x2 = drawCurrent.x / zoom
      const y2 = drawCurrent.y / zoom
      const w = Math.abs(x2 - x1)
      const h = Math.abs(y2 - y1)

      if (w < 5 && h < 5) {
        setDrawStart(null)
        setDrawCurrent(null)
        return
      }

      let annotation: Annotation | null = null

      if (activeTool === 'highlight') {
        annotation = {
          id: `hl_${Date.now()}`,
          page: currentPage,
          type: 'highlight',
          data: {
            x: Math.min(x1, x2),
            y: Math.min(y1, y2),
            width: w,
            height: h,
            color: 'rgba(255, 215, 0, 0.35)',
          },
        }
      } else if (activeTool === 'underline') {
        annotation = {
          id: `ul_${Date.now()}`,
          page: currentPage,
          type: 'underline',
          data: {
            x: Math.min(x1, x2),
            y: Math.max(y1, y2),
            width: w,
            color: '#4a90d9',
          },
        }
      } else if (activeTool === 'rectangle') {
        annotation = {
          id: `rect_${Date.now()}`,
          page: currentPage,
          type: 'shape',
          data: {
            shape: 'rectangle',
            x: Math.min(x1, x2),
            y: Math.min(y1, y2),
            width: w,
            height: h,
            color: '#4a90d9',
          },
        }
      } else if (activeTool === 'circle') {
        annotation = {
          id: `circle_${Date.now()}`,
          page: currentPage,
          type: 'shape',
          data: {
            shape: 'circle',
            cx: (x1 + x2) / 2,
            cy: (y1 + y2) / 2,
            rx: w / 2,
            ry: h / 2,
            color: '#4a90d9',
          },
        }
      } else if (activeTool === 'arrow') {
        annotation = {
          id: `arrow_${Date.now()}`,
          page: currentPage,
          type: 'shape',
          data: {
            shape: 'arrow',
            x1,
            y1,
            x2,
            y2,
            color: '#4a90d9',
          },
        }
      } else if (activeTool === 'whiteout') {
        annotation = {
          id: `wo_${Date.now()}`,
          page: currentPage,
          type: 'whiteout',
          data: {
            x: Math.min(x1, x2),
            y: Math.min(y1, y2),
            width: w,
            height: h,
          },
        }
      }

      if (annotation) {
        onAddAnnotation(currentPage, annotation)
      }
    }

    setDrawStart(null)
    setDrawCurrent(null)
  }

  const handleTextSubmit = () => {
    if (textValue.trim()) {
      const annotation: Annotation = {
        id: `text_${Date.now()}`,
        page: currentPage,
        type: 'text',
        data: {
          x: textInput.x / zoom,
          y: textInput.y / zoom,
          text: textValue,
          fontSize: 14,
          color: '#000000',
        },
      }
      onAddAnnotation(currentPage, annotation)
    }
    setTextInput({ x: 0, y: 0, visible: false })
    setTextValue('')
  }

  // Double-click to edit text annotation inline
  const handleAnnotationDoubleClick = useCallback(
    (ann: Annotation) => {
      if (ann.type === 'text' && ann.data.text && !ann.data.imageUrl) {
        const d = ann.data
        setInlineEdit({
          annotationId: ann.id,
          x: (d.x as number) * zoom,
          y: (d.y as number) * zoom,
          value: d.text as string,
        })
      }
    },
    [zoom]
  )

  const handleInlineEditSubmit = useCallback(() => {
    if (inlineEdit && inlineEdit.value.trim()) {
      const ann = (annotations.get(currentPage) || []).find(a => a.id === inlineEdit.annotationId)
      if (ann) {
        onUpdateAnnotation(currentPage, inlineEdit.annotationId, {
          data: { ...ann.data, text: inlineEdit.value },
        })
      }
    }
    setInlineEdit(null)
  }, [inlineEdit, annotations, currentPage, onUpdateAnnotation])

  const pageAnnotations = annotations.get(currentPage) || []
  const meta = pageMetadatas[currentPage - 1]
  const displayWidth = meta ? meta.width * zoom : 612 * zoom
  const displayHeight = meta ? meta.height * zoom : 792 * zoom

  const getCursor = () => {
    if (dragState) return 'grabbing'
    if (imageResize) return 'nwse-resize'
    switch (activeTool) {
      case 'draw':
      case 'highlight':
      case 'underline':
      case 'rectangle':
      case 'circle':
      case 'arrow':
      case 'whiteout':
        return 'crosshair'
      case 'eraser':
        return 'cell'
      case 'note':
      case 'signature':
        return 'copy'
      case 'text':
      case 'editText':
        return 'text'
      case 'image':
        return 'copy'
      case 'select':
        return 'default'
      default:
        return 'default'
    }
  }

  return (
    <div className="pdf-viewer" ref={containerRef}>
      <div className="pdf-viewer-scroll" ref={ref as React.RefObject<HTMLDivElement>}>
        <div
          className="pdf-page-container"
          style={{
            width: displayWidth,
            height: displayHeight,
            position: 'relative',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <canvas
            ref={canvasRef}
            className="pdf-canvas"
            style={{ cursor: getCursor() }}
          />

          <div
            ref={overlayRef}
            className="annotation-overlay"
            style={{
              width: displayWidth,
              height: displayHeight,
              cursor: getCursor(),
            }}
          >
            {/* Text block hitboxes when editText tool is active */}
            {activeTool === 'editText' && textItems.map((item, idx) => (
              <div
                key={`tb-${idx}`}
                className="text-block-hitbox"
                style={{
                  left: item.x * zoom,
                  top: item.y * zoom,
                  width: Math.max(item.width * zoom, 20),
                  height: item.height * zoom * 1.2,
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  onEditTextBlock(item)
                }}
              />
            ))}

            {pageAnnotations.map((ann) => (
              <AnnotationRenderer
                key={ann.id}
                annotation={ann}
                zoom={zoom}
                activeTool={activeTool}
                dragPreview={
                  dragState && dragState.annotationId === ann.id && dragPreview
                    ? dragPreview
                    : null
                }
                onRemove={() => onRemoveAnnotation(currentPage, ann.id)}
                onDoubleClick={() => handleAnnotationDoubleClick(ann)}
                onSelectDrag={(screenX, screenY) => {
                  if (activeTool === 'select') {
                    const d = ann.data
                    setDragState({
                      annotationId: ann.id,
                      startX: screenX,
                      startY: screenY,
                      offsetX: 0,
                      offsetY: 0,
                      origX: (d.x as number) || 0,
                      origY: (d.y as number) || 0,
                    })
                  }
                }}
              />
            ))}

            {isDrawing && activeTool === 'draw' && drawPoints.length > 1 && (
              <svg
                className="drawing-preview"
                width={displayWidth}
                height={displayHeight}
              >
                <polyline
                  points={drawPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke="#e74c3c"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}

            {isDrawing && activeTool === 'eraser' && drawPoints.length > 1 && (
              <svg
                className="drawing-preview"
                width={displayWidth}
                height={displayHeight}
              >
                <polyline
                  points={drawPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}

            {isDrawing && drawStart && drawCurrent && activeTool !== 'draw' && activeTool !== 'eraser' && (
              <svg
                className="drawing-preview"
                width={displayWidth}
                height={displayHeight}
              >
                {activeTool === 'highlight' && (
                  <rect
                    x={Math.min(drawStart.x, drawCurrent.x)}
                    y={Math.min(drawStart.y, drawCurrent.y)}
                    width={Math.abs(drawCurrent.x - drawStart.x)}
                    height={Math.abs(drawCurrent.y - drawStart.y)}
                    fill="rgba(255, 215, 0, 0.35)"
                    stroke="rgba(255, 215, 0, 0.6)"
                    strokeWidth="1"
                  />
                )}
                {activeTool === 'underline' && (
                  <line
                    x1={drawStart.x}
                    y1={Math.max(drawStart.y, drawCurrent.y)}
                    x2={drawCurrent.x}
                    y2={Math.max(drawStart.y, drawCurrent.y)}
                    stroke="#4a90d9"
                    strokeWidth="2"
                  />
                )}
                {activeTool === 'rectangle' && (
                  <rect
                    x={Math.min(drawStart.x, drawCurrent.x)}
                    y={Math.min(drawStart.y, drawCurrent.y)}
                    width={Math.abs(drawCurrent.x - drawStart.x)}
                    height={Math.abs(drawCurrent.y - drawStart.y)}
                    fill="none"
                    stroke="#4a90d9"
                    strokeWidth="2"
                  />
                )}
                {activeTool === 'circle' && (
                  <ellipse
                    cx={(drawStart.x + drawCurrent.x) / 2}
                    cy={(drawStart.y + drawCurrent.y) / 2}
                    rx={Math.abs(drawCurrent.x - drawStart.x) / 2}
                    ry={Math.abs(drawCurrent.y - drawStart.y) / 2}
                    fill="none"
                    stroke="#4a90d9"
                    strokeWidth="2"
                  />
                )}
                {activeTool === 'arrow' && (
                  <>
                    <line
                      x1={drawStart.x}
                      y1={drawStart.y}
                      x2={drawCurrent.x}
                      y2={drawCurrent.y}
                      stroke="#4a90d9"
                      strokeWidth="2"
                    />
                    <polygon
                      points={getArrowHead(drawStart.x, drawStart.y, drawCurrent.x, drawCurrent.y)}
                      fill="#4a90d9"
                    />
                  </>
                )}
                {activeTool === 'whiteout' && (
                  <rect
                    x={Math.min(drawStart.x, drawCurrent.x)}
                    y={Math.min(drawStart.y, drawCurrent.y)}
                    width={Math.abs(drawCurrent.x - drawStart.x)}
                    height={Math.abs(drawCurrent.y - drawStart.y)}
                    fill="rgba(255, 255, 255, 0.7)"
                    stroke="#ccc"
                    strokeWidth="1"
                    strokeDasharray="4,2"
                  />
                )}
              </svg>
            )}

            {textInput.visible && (
              <input
                type="text"
                className="text-annotation-input"
                style={{
                  left: textInput.x,
                  top: textInput.y,
                  fontSize: 14 * zoom,
                }}
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                onBlur={handleTextSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTextSubmit()
                  if (e.key === 'Escape') {
                    setTextInput({ x: 0, y: 0, visible: false })
                    setTextValue('')
                  }
                }}
                autoFocus
              />
            )}

            {inlineEdit && (
              <input
                type="text"
                className="inline-edit-input"
                style={{
                  left: inlineEdit.x,
                  top: inlineEdit.y,
                  fontSize: 14 * zoom,
                }}
                value={inlineEdit.value}
                onChange={(e) =>
                  setInlineEdit((prev) => prev ? { ...prev, value: e.target.value } : null)
                }
                onBlur={handleInlineEditSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleInlineEditSubmit()
                  if (e.key === 'Escape') setInlineEdit(null)
                }}
                autoFocus
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

function getArrowHead(x1: number, y1: number, x2: number, y2: number): string {
  const angle = Math.atan2(y2 - y1, x2 - x1)
  const size = 12
  const p1x = x2 - size * Math.cos(angle - Math.PI / 6)
  const p1y = y2 - size * Math.sin(angle - Math.PI / 6)
  const p2x = x2 - size * Math.cos(angle + Math.PI / 6)
  const p2y = y2 - size * Math.sin(angle + Math.PI / 6)
  return `${x2},${y2} ${p1x},${p1y} ${p2x},${p2y}`
}

function AnnotationRenderer({
  annotation,
  zoom,
  activeTool,
  dragPreview,
  onRemove,
  onDoubleClick,
  onSelectDrag,
}: {
  annotation: Annotation
  zoom: number
  activeTool: Tool
  dragPreview: { x: number; y: number } | null
  onRemove: () => void
  onDoubleClick: () => void
  onSelectDrag: (screenX: number, screenY: number) => void
}) {
  const data = annotation.data

  // Compute position overrides for drag preview
  const posX = dragPreview ? dragPreview.x * zoom : (data.x as number) * zoom
  const posY = dragPreview ? dragPreview.y * zoom : (data.y as number) * zoom
  const isDragging = !!dragPreview

  if (annotation.type === 'highlight') {
    return (
      <div
        className={`annotation annotation-highlight ${isDragging ? 'annotation-dragging' : ''}`}
        style={{
          left: posX,
          top: posY,
          width: (data.width as number) * zoom,
          height: (data.height as number) * zoom,
          backgroundColor: data.color as string,
        }}
        onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(); }}
        onMouseDown={(e) => {
          if (activeTool === 'select') {
            e.stopPropagation()
            onSelectDrag(e.clientX, e.clientY)
          }
        }}
        title="Select 模式下拖拽移动，双击删除"
      />
    )
  }

  if (annotation.type === 'underline') {
    return (
      <div
        className={`annotation annotation-underline ${isDragging ? 'annotation-dragging' : ''}`}
        style={{
          left: posX,
          top: posY - 2,
          width: (data.width as number) * zoom,
          height: 2,
          backgroundColor: data.color as string,
        }}
        onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(); }}
        onMouseDown={(e) => {
          if (activeTool === 'select') {
            e.stopPropagation()
            onSelectDrag(e.clientX, e.clientY)
          }
        }}
        title="Select 模式下拖拽移动，双击删除"
      />
    )
  }

  if (annotation.type === 'draw') {
    const points = data.points as Array<{ x: number; y: number }>
    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x * zoom} ${p.y * zoom}`).join(' ')
    return (
      <svg
        className="annotation annotation-draw"
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        <path
          d={pathData}
          fill="none"
          stroke={data.color as string}
          strokeWidth={(data.width as number) * zoom}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
          onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(); }}
        />
      </svg>
    )
  }

  if (annotation.type === 'shape') {
    const shape = data.shape as string
    if (shape === 'rectangle') {
      return (
        <div
          className={`annotation annotation-shape ${isDragging ? 'annotation-dragging' : ''}`}
          style={{
            left: posX,
            top: posY,
            width: (data.width as number) * zoom,
            height: (data.height as number) * zoom,
            border: `2px solid ${data.color as string}`,
          }}
          onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(); }}
          onMouseDown={(e) => {
            if (activeTool === 'select') {
              e.stopPropagation()
              onSelectDrag(e.clientX, e.clientY)
            }
          }}
          title="Select 模式下拖拽移动，双击删除"
        />
      )
    }
    if (shape === 'circle') {
      const cx = dragPreview
        ? (dragPreview.x + (data.rx as number)) * zoom
        : ((data.cx as number)) * zoom
      const cy = dragPreview
        ? (dragPreview.y + (data.ry as number)) * zoom
        : ((data.cy as number)) * zoom
      return (
        <div
          className={`annotation annotation-shape ${isDragging ? 'annotation-dragging' : ''}`}
          style={{
            left: cx - (data.rx as number) * zoom,
            top: cy - (data.ry as number) * zoom,
            width: (data.rx as number) * 2 * zoom,
            height: (data.ry as number) * 2 * zoom,
            border: `2px solid ${data.color as string}`,
            borderRadius: '50%',
          }}
          onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(); }}
          onMouseDown={(e) => {
            if (activeTool === 'select') {
              e.stopPropagation()
              onSelectDrag(e.clientX, e.clientY)
            }
          }}
          title="Select 模式下拖拽移动，双击删除"
        />
      )
    }
    if (shape === 'arrow') {
      const x1 = (data.x1 as number) * zoom
      const y1 = (data.y1 as number) * zoom
      const x2 = (data.x2 as number) * zoom
      const y2 = (data.y2 as number) * zoom
      return (
        <svg
          className="annotation annotation-arrow"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        >
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={data.color as string} strokeWidth="2" />
          <polygon points={getArrowHead(x1, y1, x2, y2)} fill={data.color as string} />
        </svg>
      )
    }
  }

  if (annotation.type === 'note') {
    return (
      <div
        className={`annotation annotation-note ${isDragging ? 'annotation-dragging' : ''}`}
        style={{
          left: posX,
          top: posY,
        }}
        onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(); }}
        onMouseDown={(e) => {
          if (activeTool === 'select') {
            e.stopPropagation()
            onSelectDrag(e.clientX, e.clientY)
          }
        }}
        title={`${data.text}\nSelect 模式下拖拽移动，双击删除`}
      >
        📝
      </div>
    )
  }

  if (annotation.type === 'text') {
    if (data.imageUrl) {
      return (
        <div
          className={`annotation annotation-signature ${isDragging ? 'annotation-dragging' : ''}`}
          style={{
            left: posX,
            top: posY,
            width: (data.width as number) * zoom,
            height: (data.height as number) * zoom,
          }}
          onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(); }}
          onMouseDown={(e) => {
            if (activeTool === 'select') {
              e.stopPropagation()
              onSelectDrag(e.clientX, e.clientY)
            }
          }}
          title="Select 模式下拖拽移动，双击删除"
        >
          <img
            src={data.imageUrl as string}
            alt="signature"
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      )
    }
    return (
      <div
        className={`annotation annotation-text ${isDragging ? 'annotation-dragging' : ''}`}
        style={{
          left: posX,
          top: posY,
          fontSize: (data.fontSize as number) * zoom,
          color: data.color as string,
        }}
        onDoubleClick={(e) => {
          e.stopPropagation()
          onDoubleClick()
        }}
        onMouseDown={(e) => {
          if (activeTool === 'select') {
            e.stopPropagation()
            onSelectDrag(e.clientX, e.clientY)
          }
        }}
        title="Select 模式下拖拽移动，双击编辑文字"
      >
        {data.text as string}
      </div>
    )
  }

  if (annotation.type === 'image') {
    return (
      <div
        className={`annotation annotation-image ${isDragging ? 'annotation-dragging' : ''}`}
        style={{
          left: posX,
          top: posY,
          width: (data.width as number) * zoom,
          height: (data.height as number) * zoom,
        }}
        onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(); }}
        onMouseDown={(e) => {
          if (activeTool === 'select') {
            e.stopPropagation()
            onSelectDrag(e.clientX, e.clientY)
          }
        }}
        title="Select 模式下拖拽移动，拖拽右下角调整大小，双击删除"
      >
        <img
          src={data.src as string}
          alt="inserted"
          style={{ width: '100%', height: '100%', display: 'block' }}
          draggable={false}
        />
        {activeTool === 'select' && (
          <div
            className="image-resize-handle"
            onMouseDown={(e) => {
              e.stopPropagation()
              // The parent PDFViewer will detect this via findImageResizeHandle
            }}
          />
        )}
      </div>
    )
  }

  if (annotation.type === 'whiteout') {
    return (
      <div
        className={`annotation ${isDragging ? 'annotation-dragging' : ''}`}
        style={{
          left: posX,
          top: posY,
          width: (data.width as number) * zoom,
          height: (data.height as number) * zoom,
          backgroundColor: '#ffffff',
          pointerEvents: activeTool === 'select' ? 'auto' : 'none',
        }}
        onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(); }}
        onMouseDown={(e) => {
          if (activeTool === 'select') {
            e.stopPropagation()
            onSelectDrag(e.clientX, e.clientY)
          }
        }}
        title="Select 模式下拖拽移动"
      />
    )
  }

  return null
}

export default PDFViewer
