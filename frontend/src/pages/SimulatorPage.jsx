import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../api/client'
import MediaCapture from '../components/MediaCapture'

const SCENARIOS = [
  { key: 'entry_surge', icon: '🌊', name: 'Entry Surge', desc: 'Pre-match gates open — 40K fans flooding in' },
  { key: 'halftime_rush', icon: '⚡', name: 'Halftime Rush', desc: 'Concession storm — food courts overwhelmed' },
  { key: 'emergency_evacuation', icon: '🚨', name: 'Emergency Evacuation', desc: 'Controlled evacuation via emergency routes' },
  { key: 'weather_impact', icon: '🌧️', name: 'Weather Impact', desc: 'Heavy rain — fans flooding concourses' },
  { key: 'post_match_exit', icon: '🏁', name: 'Post-Match Exit', desc: '70K fans heading to parking' },
]

const ZONE_TYPE_ICONS = {
  seating: '🪑', gate: '🚪', concourse: '🚶', food: '🍔',
  parking: '🚗', facility: '🏥', exit: '🚨',
}

const DENSITY_COLORS = {
  low: '#00ff9d',
  medium: '#ffb800',
  high: '#ff6b35',
  critical: '#ff4757',
}

function ZoneCard({ zone }) {
  const color = DENSITY_COLORS[zone.status] || '#00ff9d'
  return (
    <div className={`sim-zone ${zone.status}`}>
      <div>
        <div className="sim-zone-icon">{ZONE_TYPE_ICONS[zone.type] || '📍'}</div>
        <div className="sim-zone-name">{zone.name}</div>
      </div>
      <div>
        <div className="sim-zone-density" style={{ color }}>
          {Math.round(zone.density * 100)}%
        </div>
        <div className="sim-zone-queue">
          Queue: {zone.queue_length} · {zone.wait_time}m wait
        </div>
        <div style={{ height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2, marginTop: 6 }}>
          <div style={{
            height: '100%', width: `${zone.density * 100}%`,
            background: color, borderRadius: 2,
            transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
            boxShadow: `0 0 8px ${color}`,
          }} />
        </div>
      </div>
    </div>
  )
}

function IncidentItem({ incident }) {
  const sevClass = `sev-${incident.severity}`
  return (
    <div className="incident-item">
      <div className={`incident-severity ${sevClass}`} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{incident.zone}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{incident.message}</div>
      </div>
      <span className={`badge badge-${incident.severity === 'critical' ? 'danger' : incident.severity === 'high' ? 'warning' : 'muted'}`} style={{ fontSize: 10, flexShrink: 0 }}>
        {incident.severity}
      </span>
    </div>
  )
}

export default function SimulatorPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [selectedScenario, setSelectedScenario] = useState('entry_surge')
  const [speed, setSpeed] = useState(1)
  const [running, setRunning] = useState(false)
  const [frame, setFrame] = useState(null)
  const [incidents, setIncidents] = useState([])
  const [aiCommentary, setAiCommentary] = useState([])
  const [opsGoal, setOpsGoal] = useState('')
  const [opsPlan, setOpsPlan] = useState('')
  const [opsLoading, setOpsLoading] = useState(false)
  const wsRef = useRef(null)
  const incidentRef = useRef(null)
  const { isManager } = useAuth()

  const connectWS = useCallback(() => {
    if (wsRef.current) wsRef.current.close()
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.host}/api/simulator/ws`)
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (data.running === false) return
      setFrame(data)
      if (data.incidents?.length > 0) {
        setIncidents(prev => [...data.incidents, ...prev].slice(0, 30))
        if (incidentRef.current) incidentRef.current.scrollTop = 0
        
        data.incidents.forEach(inc => {
          if (inc.severity === 'critical') {
            toast.error(`🚨 CRITICAL: ${inc.zone} - ${inc.message}`, { duration: 5000 })
          } else if (inc.severity === 'high') {
            toast.warn(`⚠️ HIGH DENSITY: ${inc.zone}`, { duration: 4000 })
          }
        })
      }
    }
    ws.onerror = () => {}
    wsRef.current = ws
  }, [])

  useEffect(() => {
    connectWS()
    return () => wsRef.current?.close()
  }, [connectWS])

  const handleStart = async () => {
    try {
      await api.post('/api/simulator/start', { scenario: selectedScenario, speed })
      setRunning(true)
      setIncidents([])
      setAiCommentary([`🎬 Starting "${SCENARIOS.find(s => s.key === selectedScenario)?.name}" scenario at ${speed}x speed...`])
      toast.success('Simulator started!')
    } catch { toast.error('Failed to start simulator') }
  }

  const handleStop = async () => {
    try {
      await api.post('/api/simulator/stop')
      setRunning(false)
      toast.success('Simulator stopped')
    } catch { toast.error('Failed to stop simulator') }
  }

  const handleOpsCommand = async () => {
    if (!opsGoal.trim()) return
    setOpsLoading(true)
    setOpsPlan('')
    try {
      const res = await api.post('/api/ai/ops', {
        goal: opsGoal,
        sensor_state: frame,
      })
      setOpsPlan(res.data.plan)
    } catch { toast.error('AI analysis failed') } finally {
      setOpsLoading(false)
    }
  }

  const kpis = frame?.kpis || {}

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">🎮 Digital Twin Simulator</h1>
            <p className="page-subtitle">Synthetic crowd modeling with real-time AI analysis</p>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-sm text-muted">Speed:</span>
            {[1, 3, 5].map(s => (
              <button
                key={s}
                className={`btn btn-sm ${speed === s ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSpeed(s)}
                disabled={running}
              >
                {s}x
              </button>
            ))}
            {running
              ? <button className="btn btn-danger" onClick={handleStop}>⏹ Stop</button>
              : <button className="btn btn-primary" onClick={handleStart}>▶ Run Scenario</button>
            }
          </div>
        </div>
      </div>

      <div className="page-body">
        {/* Scenario Selector */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Select Scenario
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            {SCENARIOS.map(s => (
              <div
                key={s.key}
                className={`scenario-card${selectedScenario === s.key ? ' selected' : ''}`}
                onClick={() => !running && setSelectedScenario(s.key)}
                style={{ opacity: running && selectedScenario !== s.key ? 0.5 : 1 }}
              >
                <div className="scenario-icon">{s.icon}</div>
                <div className="scenario-name">{s.name}</div>
                <div className="scenario-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* KPI Strip */}
        {frame && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Avg Density', value: `${Math.round((kpis.avg_density || 0) * 100)}%`, color: 'var(--accent)' },
              { label: 'Hotspot Zones', value: kpis.hotspot_count || 0, color: 'var(--warning)' },
              { label: 'Critical Zones', value: kpis.critical_zones || 0, color: 'var(--danger)' },
              { label: 'Total Queue', value: (kpis.total_queue || 0).toLocaleString(), color: 'var(--primary)' },
            ].map(k => (
              <div key={k.label} style={{
                padding: '14px 18px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k.label}</span>
                <span style={{ fontSize: 22, fontWeight: 800, color: k.color, fontFamily: 'var(--font-mono)' }}>{k.value}</span>
              </div>
            ))}
          </div>
        )}

        <div className="grid-2 gap-6">
          {/* Zone Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Stadium Zones</h3>
              <div className="flex gap-2">
                {['low', 'medium', 'high', 'critical'].map(s => (
                  <div key={s} className="flex items-center gap-1">
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: DENSITY_COLORS[s] }} />
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
            {frame ? (
              <div className="sim-zone-grid">
                {frame.zones?.map(z => <ZoneCard key={z.id} zone={z} />)}
              </div>
            ) : (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: 300, border: '2px dashed var(--border)', borderRadius: 16,
                color: 'var(--text-muted)', flexDirection: 'column', gap: 12,
              }}>
                <span style={{ fontSize: 48 }}>🏟️</span>
                <span>Select a scenario and press Run to start the simulation</span>
              </div>
            )}

            {/* Ticker */}
            {incidents.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>⚠️ Live Incident Feed</h3>
                <div className="incident-ticker" ref={incidentRef}>
                  {incidents.map((inc, i) => (
                    <IncidentItem key={i} incident={inc} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Ops Panel */}
          <div>
            {/* Tick info */}
            {frame && (
              <div style={{
                padding: '12px 16px', borderRadius: 12, background: 'var(--bg-card)',
                border: '1px solid var(--border)', marginBottom: 16,
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: running ? 'var(--success)' : 'var(--text-muted)', boxShadow: running ? '0 0 8px var(--success)' : 'none', animation: running ? 'pulse-green 2s infinite' : 'none' }} />
                <span className="text-sm"><strong>Tick #{frame.tick}</strong> · {frame.scenario}</span>
                <span className="text-xs text-muted" style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)' }}>
                  {new Date(frame.timestamp).toLocaleTimeString()}
                </span>
              </div>
            )}

            {/* Ops Command Box (Manager only) */}
            {isManager && (
              <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>🧠 AI Ops Commander</h3>
                <p className="text-xs text-muted" style={{ marginBottom: 12 }}>
                  Describe an operational goal and Gemini will generate a ranked action plan.
                </p>
                <textarea
                  className="input-field"
                  style={{ minHeight: 80, resize: 'none' }}
                  placeholder="e.g., Reduce congestion at North Gate within 10 minutes"
                  value={opsGoal}
                  onChange={e => setOpsGoal(e.target.value)}
                />
                <button
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: 10, width: '100%' }}
                  onClick={handleOpsCommand}
                  disabled={opsLoading || !opsGoal.trim()}
                >
                  {opsLoading ? <><span className="spinner" /> Analyzing...</> : '⚡ Generate Action Plan'}
                </button>
                {opsPlan && (
                  <div style={{
                    marginTop: 16, padding: 14, background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)', borderRadius: 10,
                    fontSize: 13, lineHeight: 1.7, color: 'var(--text-secondary)',
                    maxHeight: 400, overflowY: 'auto', whiteSpace: 'pre-wrap',
                  }}>
                    {opsPlan}
                  </div>
                )}
              </div>
            )}

            {/* Commentary */}
            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>📢 Simulation Log</h3>
              {incidents.length === 0 && !running ? (
                <p className="text-sm text-muted">Run a scenario to see live analysis and incident alerts here.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                  {aiCommentary.map((msg, i) => (
                    <div key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                      {msg}
                    </div>
                  ))}
                  {frame?.all_incidents?.map((inc, i) => (
                    <div key={`inc-${i}`} style={{ fontSize: 12, color: inc.severity === 'critical' ? 'var(--danger)' : 'var(--warning)', padding: '4px 0' }}>
                      ⚠️ [{inc.zone}] {inc.message}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Legend */}
            <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="text-xs text-muted" style={{ marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Zone Types</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {Object.entries(ZONE_TYPE_ICONS).map(([t, icon]) => (
                  <div key={t} className="flex items-center gap-1 text-xs text-muted">
                    <span>{icon}</span> {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {frame && (
        <MediaCapture eventId={frame.event_id} onUploadSuccess={() => navigate('/narrative')} />
      )}
    </div>
  )
}
