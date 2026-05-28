import { useState } from 'react'
import type { TextItem } from '../types'

interface EditTextModalProps {
  textItem: TextItem
  onSave: (newText: string, fontSize: number) => void
  onClose: () => void
}

export default function EditTextModal({ textItem, onSave, onClose }: EditTextModalProps) {
  const [text, setText] = useState(textItem.str)
  const [fontSize, setFontSize] = useState(Math.round(textItem.fontSize))

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>✏️ 编辑文字</h3>
        <label>文字内容</label>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSave(text, fontSize)
          }}
        />
        <label>字号</label>
        <input
          type="number"
          min={6}
          max={72}
          value={fontSize}
          onChange={(e) => setFontSize(parseInt(e.target.value) || 12)}
        />
        <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
          注意：原文字将被白色方块覆盖后重新绘制，字体可能与原文略有差异
        </p>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>取消</button>
          <button className="btn-primary" onClick={() => onSave(text, fontSize)} disabled={!text.trim()}>
            应用修改
          </button>
        </div>
      </div>
    </div>
  )
}
