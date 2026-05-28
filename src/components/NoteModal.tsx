interface NoteModalProps {
  onSave: (text: string) => void
  onClose: () => void
  text: string
  onTextChange: (text: string) => void
}

export default function NoteModal({ onSave, onClose, text, onTextChange }: NoteModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>📝 添加便签</h3>
        <label>便签内容</label>
        <textarea
          style={{
            width: '100%',
            minHeight: 100,
            padding: '8px 12px',
            background: '#1e1e1e',
            border: '1px solid var(--border)',
            borderRadius: 6,
            color: 'var(--text-primary)',
            resize: 'vertical',
            fontFamily: 'inherit',
            fontSize: 13,
            marginBottom: 8,
          }}
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="输入便签内容..."
          autoFocus
        />
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>取消</button>
          <button className="btn-primary" onClick={() => onSave(text)} disabled={!text.trim()}>
            添加
          </button>
        </div>
      </div>
    </div>
  )
}
