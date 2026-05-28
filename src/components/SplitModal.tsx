import { useState } from 'react'

interface SplitModalProps {
  totalPages: number
  onSplit: (ranges: Array<[number, number]>) => void
  onClose: () => void
}

export default function SplitModal({ totalPages, onSplit, onClose }: SplitModalProps) {
  const [mode, setMode] = useState<'ranges' | 'every'>('ranges')
  const [rangeInput, setRangeInput] = useState('')
  const [everyN, setEveryN] = useState(1)

  const parseRanges = (input: string): Array<[number, number]> | null => {
    try {
      const parts = input.split(',').map((s) => s.trim()).filter(Boolean)
      const ranges: Array<[number, number]> = []
      for (const part of parts) {
        if (part.includes('-')) {
          const [a, b] = part.split('-').map((s) => parseInt(s.trim()))
          if (isNaN(a) || isNaN(b) || a < 1 || b > totalPages || a > b) return null
          ranges.push([a - 1, b - 1])
        } else {
          const n = parseInt(part)
          if (isNaN(n) || n < 1 || n > totalPages) return null
          ranges.push([n - 1, n - 1])
        }
      }
      return ranges.length > 0 ? ranges : null
    } catch {
      return null
    }
  }

  const handleSplit = () => {
    if (mode === 'every') {
      const ranges: Array<[number, number]> = []
      for (let i = 0; i < totalPages; i += everyN) {
        ranges.push([i, Math.min(i + everyN - 1, totalPages - 1)])
      }
      onSplit(ranges)
    } else {
      const ranges = parseRanges(rangeInput)
      if (ranges) onSplit(ranges)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>✂️ 拆分 PDF</h3>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
          共 {totalPages} 页，选择拆分方式
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            className={mode === 'ranges' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setMode('ranges')}
            style={{ flex: 1, padding: '8px' }}
          >
            按页码范围
          </button>
          <button
            className={mode === 'every' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setMode('every')}
            style={{ flex: 1, padding: '8px' }}
          >
            每 N 页拆分
          </button>
        </div>

        {mode === 'ranges' ? (
          <>
            <label>页码范围（用逗号分隔，如：1-3, 4, 5-8）</label>
            <input
              type="text"
              value={rangeInput}
              onChange={(e) => setRangeInput(e.target.value)}
              placeholder={`例如：1-${Math.min(3, totalPages)}, ${Math.min(4, totalPages)}-${totalPages}`}
            />
          </>
        ) : (
          <>
            <label>每几页拆分为一个文件</label>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={everyN}
              onChange={(e) => setEveryN(Math.max(1, parseInt(e.target.value) || 1))}
            />
            <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              将生成 {Math.ceil(totalPages / everyN)} 个文件
            </p>
          </>
        )}

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>取消</button>
          <button className="btn-primary" onClick={handleSplit}>
            拆分
          </button>
        </div>
      </div>
    </div>
  )
}
