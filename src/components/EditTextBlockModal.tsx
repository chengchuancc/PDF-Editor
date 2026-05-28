import { useState } from 'react'
import type { TextItem } from '../types'

interface EditTextBlockModalProps {
  textItem: TextItem
  onSave: (newText: string, fontSize: number, color: string) => void
  onClose: () => void
}

export default function EditTextBlockModal({ textItem, onSave, onClose }: EditTextBlockModalProps) {
  const [text, setText] = useState(textItem.str)
  const [fontSize, setFontSize] = useState(Math.round(textItem.fontSize))
  const [color, setColor] = useState('#000000')

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ minWidth: 420 }}>
        <h3>✏️ 编辑文字</h3>

        <div style={{
          background: '#1a1a1a',
          borderRadius: 6,
          padding: '10px 14px',
          marginBottom: 16,
          fontSize: 12,
          color: 'var(--text-secondary)',
        }}>
          原文: <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>"{textItem.str}"</span>
        </div>

        <label>新文字内容</label>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              onSave(text, fontSize, color)
            }
          }}
          placeholder="输入替换文字..."
        />

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label>字号</label>
            <input
              type="number"
              min={6}
              max={120}
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value) || 12)}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>颜色</label>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{ width: 36, height: 36, border: 'none', borderRadius: 4, cursor: 'pointer', background: 'transparent' }}
              />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{color}</span>
            </div>
          </div>
        </div>

        <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>
          原文字将被覆盖为白色，新文字绘制在其上
        </p>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>取消</button>
          <button
            className="btn-primary"
            onClick={() => onSave(text, fontSize, color)}
            disabled={!text.trim()}
          >
            替换文字
          </button>
        </div>
      </div>
    </div>
  )
}
