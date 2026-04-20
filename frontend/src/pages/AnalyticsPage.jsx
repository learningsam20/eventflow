import React, { useEffect, useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area, RadarChart,
  PolarGrid, PolarAngleAxis, Radar,
} from 'recharts'
import api from '../api/client'
import toast from 'react-hot-toast'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: 'rgba(13,19,32,0.95)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10, padding: '10px 14px', fontSize: 13, backdropFilter: 'blur(10px)',
      }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
        {payload.map((p, index) => (
          <p key={p.dataKey || index} style={{ color: p.color, fontWeight: 600 }}>
            {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

function KPITile({ icon, label, value, delta, color }) {
  return (
    <div className="kpi-card">
      <div className="flex items-center justify-between mb-2">
        <span style={{ fontSize: 24 }}>{icon}</span>
        {delta != null && (
          <span className={`kpi-delta ${delta >= 0 ? 'positive' : 'negative'}`}>
            {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}%
          </span>
        )}
      </div>
      <div className="kpi-value" style={{
        background: `linear-gradient(135deg, var(--text-primary), ${color})`,
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
      }}>{value}</div>
      <div className="kpi-label">{label}</div>
    </div>
  )
}

export default function AnalyticsPage() {
  const [kpis, setKpis] = useState(null)
  const [trend, setTrend] = useState([])
  const [incidents, setIncidents] = useState([])
  const [history, setHistory] = useState([])
  const [zonePerf, setZonePerf] = useState([])
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [narrative, setNarrative] = useState('')
  const [narrativeLoading, setNarrativeLoading] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [evRes, kpiRes, trendRes, incRes, histRes, zoneRes] = await Promise.all([
          api.get('/api/events'),
          api.get('/api/analytics/kpis'),
          api.get('/api/analytics/density-trend'),
          api.get('/api/analytics/incidents'),
          api.get('/api/analytics/history'),
          api.get('/api/analytics/zone-performance'),
        ])
        setEvents(evRes.data)
        if (evRes.data.length > 0) setSelectedEvent(evRes.data[0])
        setKpis(kpiRes.data)
        setTrend(trendRes.data)
        setIncidents(incRes.data.slice(0, 10))
        setHistory(histRes.data)
        setZonePerf(zoneRes.data)
      } catch (e) { console.error(e) } finally { setLoading(false) }
    }
    load()
  }, [])

  const generateNarrative = async () => {
    if (!selectedEvent) return
    setNarrativeLoading(true)
    setNarrative('')
    try {
      const res = await api.post('/api/ai/narrative', { event_id: selectedEvent.id })
      setNarrative(res.data.narrative)
    } catch { toast.error('Narrative generation failed') }
    finally { setNarrativeLoading(false) }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
        <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
        <p className="text-muted">Loading analytics...</p>
      </div>
    )
  }

  const radarData = (zonePerf || []).slice(0, 6).map(z => ({
    subject: z.zone?.split(' ')[0] || 'Zone',
    density: Math.round((z.avg_density || 0) * 100),
    incidents: (z.peak_incidents || 0) * 10,
    wait: z.avg_wait || 0,
  }))

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">📊 Analytics Dashboard</h1>
            <p className="page-subtitle">Historical KPIs, incident registry, and AI-generated reports</p>
          </div>
          <div className="flex gap-2">
            <select
              className="input-field"
              style={{ width: 'auto', padding: '8px 14px', fontSize: 13 }}
              onChange={e => setSelectedEvent(events.find(ev => ev.id === parseInt(e.target.value)))}
              value={selectedEvent?.id || ''}
            >
              <option value="">All Events</option>
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name.slice(0, 35)}</option>)}
            </select>
            <button className="btn btn-primary btn-sm" onClick={generateNarrative} disabled={narrativeLoading || !selectedEvent}>
              {narrativeLoading ? <><span className="spinner" /> Generating...</> : '✨ AI Report'}
            </button>
          </div>
        </div>
      </div>

      <div className="page-body">
        {/* KPIs */}
        {kpis && (
          <div className="grid-4 mb-6">
            <KPITile icon="⏱️" label="Avg Queue Time" value={`${kpis.avg_queue_time}m`} delta={kpis.queue_time_delta} color="var(--success)" />
            <KPITile icon="🚀" label="Throughput / min" value={kpis.throughput_per_minute} delta={kpis.throughput_delta} color="var(--accent)" />
            <KPITile icon="⭐" label="NPS Score" value={kpis.nps_score} delta={kpis.nps_delta} color="var(--warning)" />
            <KPITile icon="📦" label="Orders Fulfilled" value={kpis.orders_fulfilled.toLocaleString()} color="var(--primary)" />
          </div>
        )}

        {/* Charts Row */}
        <div className="grid-2 gap-6 mb-6">
          {/* Density Trend */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📈 Crowd Density Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="densityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6c63ff" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6c63ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="queueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" tick={{ fill: 'rgba(240,244,255,0.4)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'rgba(240,244,255,0.4)', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="density" name="Density" stroke="#6c63ff" fill="url(#densityGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="queue_time" name="Queue (min)" stroke="#00d4ff" fill="url(#queueGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Zone Radar */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>🎯 Zone Performance Radar</h3>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(240,244,255,0.5)', fontSize: 11 }} />
                <Radar name="Density" dataKey="density" stroke="#6c63ff" fill="#6c63ff" fillOpacity={0.2} />
                <Radar name="Wait" dataKey="wait" stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.15} />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Throughput Bar chart */}
        <div className="glass-card mb-6" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>🚀 Throughput Over Time (fans/min)</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" tick={{ fill: 'rgba(240,244,255,0.4)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'rgba(240,244,255,0.4)', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="throughput" name="Throughput" fill="#6c63ff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid-2 gap-6 mb-6">
          {/* Incident Log */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>⚠️ Incident Registry</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Zone</th>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>Response</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map(inc => (
                  <tr key={inc.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{inc.zone}</td>
                    <td>{inc.incident_type?.replace('_', ' ')}</td>
                    <td>
                      <span className={`badge badge-${inc.severity === 'critical' ? 'danger' : inc.severity === 'high' ? 'warning' : inc.severity === 'medium' ? 'accent' : 'success'}`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: inc.response_time_minutes != null ? 'var(--success)' : 'var(--text-muted)' }}>
                      {inc.response_time_minutes != null ? `${inc.response_time_minutes}m` : '—'}
                    </td>
                    <td>
                      <span className={`badge badge-${inc.resolved ? 'success' : 'warning'}`}>
                        {inc.resolved ? '✅ Resolved' : '⏳ Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Event History */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📅 Event History</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Queue</th>
                  <th>NPS</th>
                  <th>Orders</th>
                </tr>
              </thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.event_id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 12 }}>{h.event_name.slice(0, 25)}...</div>
                      <div className="text-xs text-muted">{h.date}</div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: h.avg_queue_time < 10 ? 'var(--success)' : 'var(--warning)' }}>
                      {h.avg_queue_time}m
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: h.nps_score > 80 ? 'var(--success)' : 'var(--warning)' }}>
                      {h.nps_score}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{h.orders_fulfilled.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Narrative */}
        {narrative && (
          <div className="glass-card" style={{ padding: 28 }}>
            <div className="flex items-center gap-3 mb-16" style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 24 }}>✨</span>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>AI-Generated Event Report</h3>
              <span className="badge badge-primary">Gemini</span>
            </div>
            <div style={{
              fontSize: 15, lineHeight: 1.8, color: 'var(--text-secondary)',
              whiteSpace: 'pre-wrap', fontFamily: 'var(--font-body)',
            }}>
              {narrative}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
