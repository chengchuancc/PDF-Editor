import { useState } from 'react'

interface EncryptModalProps {
  onEncrypt: (password: string) => void
  onClose: () => void
}

export default function EncryptModal({ onEncrypt, onClose }: EncryptModalProps) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    if (!password) {
      setError('请输入密码')
      return
    }
    if (password !== confirm) {
      setError('两次输入的密码不一致')
      return
    }
    if (password.length < 4) {
      setError('密码至少 4 位')
      return
    }
    onEncrypt(password)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>🔒 PDF 加密</h3>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
          加密后的 PDF 需要密码才能打开
        </p>
        <label>设置密码</label>
        <input
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError('') }}
          placeholder="输入密码"
          autoFocus
        />
        <label>确认密码</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => { setConfirm(e.target.value); setError('') }}
          placeholder="再次输入密码"
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
        />
        {error && (
          <p style={{ color: 'var(--danger)', fontSize: 12, marginBottom: 8 }}>{error}</p>
        )}
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>取消</button>
          <button className="btn-primary" onClick={handleSubmit}>加密并保存</button>
        </div>
      </div>
    </div>
  )
}
