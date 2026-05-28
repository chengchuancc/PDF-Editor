import { useState } from 'react'

interface MergeModalProps {
  currentFileName: string
  onMerge: (files: Array<{ data: Uint8Array; name: string }>) => void
  onClose: () => void
}

export default function MergeModal({ currentFileName, onMerge, onClose }: MergeModalProps) {
  const [files, setFiles] = useState<Array<{ data: Uint8Array; name: string }>>([])

  const handleAddFiles = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf'
    input.multiple = true
    input.onchange = async (e) => {
      const selectedFiles = (e.target as HTMLInputElement).files
      if (!selectedFiles) return
      const newFiles: Array<{ data: Uint8Array; name: string }> = []
      for (const file of Array.from(selectedFiles)) {
        const buffer = await file.arrayBuffer()
        newFiles.push({ data: new Uint8Array(buffer), name: file.name })
      }
      setFiles((prev) => [...prev, ...newFiles])
    }
    input.click()
  }

  const handleRemove = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    setFiles((prev) => {
      const next = [...prev]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      return next
    })
  }

  const handleMoveDown = (index: number) => {
    setFiles((prev) => {
      if (index >= prev.length - 1) return prev
      const next = [...prev]
      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
      return next
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ minWidth: 460 }} onClick={(e) => e.stopPropagation()}>
        <h3>📎 合并 PDF</h3>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
          当前文件 <strong>{currentFileName}</strong> 将作为第一个文件，添加其他 PDF 进行合并
        </p>

        <div style={{
          background: '#1e1e1e',
          borderRadius: 8,
          padding: 8,
          maxHeight: 240,
          overflowY: 'auto',
          marginBottom: 12,
        }}>
          <div style={{
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
            color: 'var(--accent)',
            background: 'rgba(74,144,217,0.08)',
            borderRadius: 4,
            marginBottom: 4,
          }}>
            <span>1.</span>
            <span style={{ flex: 1 }}>{currentFileName}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: 10 }}>当前文件</span>
          </div>
          {files.map((f, i) => (
            <div key={i} style={{
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              borderRadius: 4,
            }}>
              <span>{i + 2}.</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
              <button
                style={{ fontSize: 11, padding: '2px 6px', color: 'var(--text-secondary)' }}
                onClick={() => handleMoveUp(i)}
                disabled={i === 0}
                title="上移"
              >↑</button>
              <button
                style={{ fontSize: 11, padding: '2px 6px', color: 'var(--text-secondary)' }}
                onClick={() => handleMoveDown(i)}
                disabled={i >= files.length - 1}
                title="下移"
              >↓</button>
              <button
                style={{ fontSize: 11, padding: '2px 6px', color: 'var(--danger)' }}
                onClick={() => handleRemove(i)}
                title="移除"
              >✕</button>
            </div>
          ))}
        </div>

        <button
          className="btn-secondary"
          onClick={handleAddFiles}
          style={{ marginBottom: 8, width: '100%' }}
        >
          + 添加 PDF 文件
        </button>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>取消</button>
          <button className="btn-primary" onClick={() => onMerge(files)} disabled={files.length === 0}>
            合并 ({files.length + 1} 个文件)
          </button>
        </div>
      </div>
    </div>
  )
}
