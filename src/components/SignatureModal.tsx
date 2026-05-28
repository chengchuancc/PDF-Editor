import { useRef, useState, useCallback, useEffect } from 'react'

interface SignatureModalProps {
  onCapture: (dataUrl: string) => void
  onClose: () => void
}

export default function SignatureModal({ onCapture, onClose }: SignatureModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = 400
    canvas.height = 200
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [])

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    setIsDrawing(true)
    setHasDrawn(true)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }

  const handleMouseUp = () => {
    setIsDrawing(false)
  }

  const handleClear = () => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setHasDrawn(false)
  }

  const handleConfirm = () => {
    const canvas = canvasRef.current!
    const dataUrl = canvas.toDataURL('image/png')
    onCapture(dataUrl)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>✍️ 电子签名</h3>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
          在下方区域签名，确认后将可放置到 PDF 页面上
        </p>
        <canvas
          ref={canvasRef}
          style={{
            border: '1px solid var(--border)',
            borderRadius: 8,
            cursor: 'crosshair',
            display: 'block',
            width: 400,
            height: 200,
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        <div className="modal-actions">
          <button className="btn-secondary" onClick={handleClear}>清除</button>
          <button className="btn-secondary" onClick={onClose}>取消</button>
          <button className="btn-primary" onClick={handleConfirm} disabled={!hasDrawn}>
            确认签名
          </button>
        </div>
      </div>
    </div>
  )
}
