import React, { useEffect, useState } from 'react'
import api from '../api/client'
import toast from 'react-hot-toast'

function SettingRow({ label, desc, children }) {
  return (
    <div className="flex items-center justify-between" style={{ padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{label}</div>
        {desc && <div className="text-xs text-muted mt-1">{desc}</div>}
      </div>
      <div>{children}</div>
    </div>
  )
}

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 48, height: 26, borderRadius: 13,
        background: value ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
        border: 'none', cursor: 'pointer', position: 'relative', transition: 'all 0.3s',
        boxShadow: value ? '0 0 12px var(--primary-glow)' : 'none',
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: value ? 26 : 4,
        width: 20, height: 20, borderRadius: '50%', background: '#fff',
        transition: 'left 0.3s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      }} />
    </button>
  )
}

export default function SettingsPage() {
  const [users, setUsers] = useState([])
  const [settings, setSettings] = useState({
    use_firebase: false,
    gemini_model: 'gemini-2.0-flash',
    sim_default_speed: 1,
    auto_seed: true,
    ai_commentary: true,
    notification_threshold: 0.8,
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/api/auth/users')
        setUsers(res.data)
      } catch (e) { console.error(e) }
    }
    load()
  }, [])

  const handleSave = () => {
    // In real app: POST /api/settings
    setSaved(true)
    toast.success('Settings saved successfully!')
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">⚙️ Platform Settings</h1>
            <p className="page-subtitle">Configure EventFlow, Firebase, AI models, and simulator defaults</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleSave}>
            {saved ? '✅ Saved!' : '💾 Save Settings'}
          </button>
        </div>
      </div>

      <div className="page-body">
        <div className="grid-2 gap-6">
          {/* AI Configuration */}
          <div>
            <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>🧠 AI Configuration</h3>
              <p className="text-xs text-muted" style={{ marginBottom: 16 }}>Gemini model settings and AI behavior</p>

              <SettingRow label="Gemini Model" desc="Select the AI model for all features">
                <select
                  className="input-field"
                  style={{ width: 'auto', padding: '6px 12px', fontSize: 13 }}
                  value={settings.gemini_model}
                  onChange={e => setSettings(s => ({ ...s, gemini_model: e.target.value }))}
                >
                  <option value="gemini-2.0-flash">gemini-2.0-flash (Fast)</option>
                  <option value="gemini-1.5-pro">gemini-1.5-pro (Powerful)</option>
                  <option value="gemini-2.0-flash-thinking">gemini-2.0-flash-thinking (Advanced)</option>
                </select>
              </SettingRow>

              <SettingRow label="AI Commentary" desc="Live Gemini analysis during simulator">
                <Toggle value={settings.ai_commentary} onChange={v => setSettings(s => ({ ...s, ai_commentary: v }))} />
              </SettingRow>

              <SettingRow label="Incident Threshold" desc="AI alert density trigger (%)">
                <div className="flex items-center gap-2">
                  <input
                    type="range" min="0.5" max="0.99" step="0.05"
                    value={settings.notification_threshold}
                    onChange={e => setSettings(s => ({ ...s, notification_threshold: parseFloat(e.target.value) }))}
                    style={{ width: 100 }}
                  />
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', minWidth: 36 }}>
                    {Math.round(settings.notification_threshold * 100)}%
                  </span>
                </div>
              </SettingRow>
            </div>

            {/* Database */}
            <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>🗄️ Database & Storage</h3>
              <p className="text-xs text-muted" style={{ marginBottom: 16 }}>Switch between SQLite and Firebase Firestore</p>

              <SettingRow label="Use Firebase" desc="Enable Firebase Firestore (requires FIREBASE_* env vars)">
                <Toggle value={settings.use_firebase} onChange={v => {
                  setSettings(s => ({ ...s, use_firebase: v }))
                  if (v) toast.success('Firebase mode enabled. Ensure env vars are set.', { icon: '🔥' })
                }} />
              </SettingRow>

              {settings.use_firebase && (
                <div style={{ padding: 14, borderRadius: 10, background: 'var(--warning-dim)', border: '1px solid rgba(255,184,0,0.3)', marginTop: 12 }}>
                  <div className="text-xs" style={{ color: 'var(--warning)', fontWeight: 700, marginBottom: 6 }}>⚠️ Firebase Active</div>
                  <div className="text-xs text-muted">
                    Ensure FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL are set in backend/.env
                  </div>
                </div>
              )}

              <SettingRow label="Current DB" desc="Active database connection">
                <span className="badge badge-success">{settings.use_firebase ? '🔥 Firebase' : '🗃️ SQLite'}</span>
              </SettingRow>
            </div>

            {/* Simulator */}
            <div className="glass-card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>🎮 Simulator Defaults</h3>
              <p className="text-xs text-muted" style={{ marginBottom: 16 }}>Default settings for digital twin simulations</p>

              <SettingRow label="Default Speed" desc="Simulation ticks per second">
                <select
                  className="input-field"
                  style={{ width: 'auto', padding: '6px 12px', fontSize: 13 }}
                  value={settings.sim_default_speed}
                  onChange={e => setSettings(s => ({ ...s, sim_default_speed: parseInt(e.target.value) }))}
                >
                  {[1, 2, 3, 5, 10].map(s => <option key={s} value={s}>{s}x</option>)}
                </select>
              </SettingRow>

              <SettingRow label="Auto Seed" desc="Auto-seed demo data on server start">
                <Toggle value={settings.auto_seed} onChange={v => setSettings(s => ({ ...s, auto_seed: v }))} />
              </SettingRow>
            </div>
          </div>

          {/* Users & Info */}
          <div>
            <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>👥 User Management</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.username}</div>
                        <div className="text-xs text-muted">{u.email}</div>
                      </td>
                      <td>
                        <span className={`badge badge-${u.role === 'event_manager' ? 'primary' : 'accent'}`}>
                          {u.role === 'event_manager' ? '🏆 Manager' : '🎫 Fan'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${u.is_active ? 'success' : 'danger'}`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="text-xs text-muted">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* System Info */}
            <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>ℹ️ System Info</h3>
              {[
                { label: 'App Version', value: 'EventFlow v1.0.0' },
                { label: 'Backend', value: 'FastAPI 0.115 · Python 3.12' },
                { label: 'Frontend', value: 'React 18 · Vite 6' },
                { label: 'Database', value: settings.use_firebase ? 'Firebase Firestore' : 'SQLite 3' },
                { label: 'AI Model', value: settings.gemini_model },
                { label: 'WebSocket', value: 'Active · ws://localhost:8000' },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span className="text-sm text-muted">{row.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--accent)' }}>{row.value}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
