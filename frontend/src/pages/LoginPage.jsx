import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(username, password)
      toast.success(`Welcome back, ${user.full_name || user.username}! 🎉`)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = (u, p) => {
    setUsername(u)
    setPassword(p)
  }

  return (
    <div className="login-page">
      {/* Animated background */}
      <div className="login-bg" />
      <div className="login-orb login-orb-1" />
      <div className="login-orb login-orb-2" />

      {/* Particle grid decorative */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04,
        backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <img src="/favicon.png" alt="EventFlow Logo" style={{ width: 80, height: 80, borderRadius: 20, marginBottom: 16, boxShadow: '0 0 40px rgba(108,99,255,0.3)' }} />
          <h1>EventFlow</h1>
          <p>AI-Native Event Intelligence Platform</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Username</label>
            <input
              id="login-username"
              aria-label="Username"
              className="input-field"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="event_manager or event_user"
              autoComplete="username"
              required
            />
          </div>
          <div className="input-group">
            <label className="input-label">Password</label>
            <input
              id="login-password"
              aria-label="Password"
              className="input-field"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(255,71,87,0.1)',
              border: '1px solid rgba(255,71,87,0.3)',
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: 13,
              color: 'var(--danger)',
              marginBottom: 16,
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginBottom: 20 }}
            disabled={loading}
          >
            {loading ? <><span className="spinner" /> Signing in...</> : '🚀 Enter EventFlow'}
          </button>
        </form>

        {/* Quick access */}
        <div>
          <div className="divider" />
          <p className="text-sm text-muted" style={{ textAlign: 'center', marginBottom: 12 }}>
            Quick Demo Access
          </p>
          <div className="flex gap-2">
            <button
              className="btn btn-secondary btn-sm"
              style={{ flex: 1, fontSize: 12 }}
              onClick={() => quickLogin('event_manager', 'test@123')}
            >
              🏆 Manager
            </button>
            <button
              className="btn btn-secondary btn-sm"
              style={{ flex: 1, fontSize: 12 }}
              onClick={() => quickLogin('event_user', 'test@123')}
            >
              🎫 Fan
            </button>
          </div>
          <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 12 }}>
            Password: test@123 for both accounts
          </p>
        </div>

        {/* Bottom branding */}
        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Powered by{' '}
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>Gemini AI</span>
            {' '}·{' '}
            <span style={{ color: 'var(--primary)' }}>Digital Twin</span>
            {' '}·{' '}
            Real-time Sensor Fusion
          </p>
        </div>
      </div>
    </div>
  )
}
