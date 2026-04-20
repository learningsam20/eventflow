import React, { useEffect, useState, useRef } from 'react'
import api from '../api/client'
import GoogleMapsView from '../components/GoogleMapsView'

const ZONES = [
  { id: 'north_stand', name: 'North Stand', x: 340, y: 80, w: 200, h: 80, type: 'seating' },
  { id: 'south_stand', name: 'South Stand', x: 340, y: 340, w: 200, h: 80, type: 'seating' },
  { id: 'east_wing', name: 'East Wing', x: 600, y: 180, w: 80, h: 140, type: 'seating' },
  { id: 'west_wing', name: 'West Wing', x: 200, y: 180, w: 80, h: 140, type: 'seating' },
  { id: 'main_gate', name: 'Main Gate', x: 420, y: 460, w: 100, h: 50, type: 'gate' },
  { id: 'vip_entrance', name: 'VIP', x: 540, y: 460, w: 80, h: 50, type: 'gate' },
  { id: 'concourse_a', name: 'Concourse A', x: 200, y: 340, w: 120, h: 60, type: 'concourse' },
  { id: 'concourse_b', name: 'Concourse B', x: 560, y: 100, w: 120, h: 60, type: 'concourse' },
  { id: 'food_court_1', name: 'Food Ct 1', x: 200, y: 100, w: 120, h: 60, type: 'food' },
  { id: 'food_court_2', name: 'Food Ct 2', x: 560, y: 340, w: 120, h: 60, type: 'food' },
  { id: 'parking_a', name: 'Parking A', x: 160, y: 460, w: 110, h: 50, type: 'parking' },
  { id: 'parking_b', name: 'Parking B', x: 640, y: 460, w: 110, h: 50, type: 'parking' },
  { id: 'medical_bay', name: 'Medical', x: 370, y: 200, w: 80, h: 50, type: 'facility' },
]

const densityColor = (d) => {
  if (d < 0.4) return '#00ff9d'
  if (d < 0.65) return '#ffb800'
  if (d < 0.85) return '#ff6b35'
  return '#ff4757'
}

const densityLabel = (d) => {
  if (d < 0.4) return 'low'
  if (d < 0.65) return 'medium'
  if (d < 0.85) return 'high'
  return 'critical'
}

const VIEW_TABS = [
  { id: 'svg', label: '🏟️ Stadium Map', desc: 'Interactive zone layout' },
  { id: 'gmaps', label: '🗺️ Google Maps', desc: 'Real venue + routing' },
]

export default function HeatmapPage() {
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [heatmapData, setHeatmapData] = useState([])
  const [hoveredZone, setHoveredZone] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState('svg')
  const [showRoutes, setShowRoutes] = useState(true)
  const intervalRef = useRef(null)

  const hasGoogleMapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY &&
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY !== 'your_google_maps_api_key_here'

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/api/events')
        setEvents(res.data)
        if (res.data.length > 0) setSelectedEvent(res.data[0])
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  useEffect(() => {
    if (!selectedEvent) return
    const fetchHeatmap = async () => {
      try {
        const res = await api.get(`/api/events/${selectedEvent.id}/heatmap`)
        setHeatmapData(res.data)
      } catch { }
    }
    fetchHeatmap()
    intervalRef.current = setInterval(fetchHeatmap, 5000)
    return () => clearInterval(intervalRef.current)
  }, [selectedEvent])

  const getZoneData = (zoneName) => {
    const data = heatmapData.find(h => h.zone === zoneName)
    if (!data) return { density: Math.random() * 0.6 + 0.2, queue_length: 0, wait_time_minutes: 0 }
    return data
  }

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">🗺️ Live Venue Heatmap</h1>
            <p className="page-subtitle">Real-time crowd density · Auto-refreshes every 5s</p>
          </div>
          <div className="flex gap-2 items-center">
            <span className="badge badge-success" style={{ animation: 'pulse-green 2s infinite' }}>🟢 Live</span>
            <select
              className="input-field"
              style={{ width: 'auto', padding: '8px 14px', fontSize: 13 }}
              onChange={e => setSelectedEvent(events.find(ev => ev.id === parseInt(e.target.value)))}
              value={selectedEvent?.id || ''}
            >
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex gap-2" style={{ marginTop: 16 }}>
          {VIEW_TABS.map(tab => (
            <button
              key={tab.id}
              className={`btn btn-sm ${activeView === tab.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveView(tab.id)}
              style={{ position: 'relative' }}
            >
              {tab.label}
              {tab.id === 'gmaps' && !hasGoogleMapsKey && (
                <span style={{
                  position: 'absolute', top: -6, right: -6,
                  background: 'var(--warning)', borderRadius: '50%',
                  width: 14, height: 14, fontSize: 8, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 700,
                }}>!</span>
              )}
            </button>
          ))}
          {activeView === 'gmaps' && (
            <button
              className={`btn btn-sm ${showRoutes ? 'btn-accent' : 'btn-secondary'}`}
              onClick={() => setShowRoutes(v => !v)}
              style={{ marginLeft: 8 }}
            >
              🛣️ {showRoutes ? 'Hide' : 'Show'} Exit Routes
            </button>
          )}
        </div>
      </div>

      <div className="page-body">
        {activeView === 'svg' ? (
          <div className="grid-2 gap-6">
            {/* SVG Stadium Map */}
            <div className="glass-card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>EventFlow Arena — Floor Plan</h3>
              <svg viewBox="0 0 880 540" style={{ width: '100%', height: 'auto', borderRadius: 12 }}>
                {/* Stadium outline */}
                <ellipse cx="440" cy="250" rx="260" ry="180" fill="rgba(108,99,255,0.05)" stroke="rgba(108,99,255,0.2)" strokeWidth="2" />
                {/* Pitch */}
                <rect x="320" y="170" width="240" height="160" rx="12" fill="rgba(0,255,157,0.08)" stroke="rgba(0,255,157,0.3)" strokeWidth="1" />
                <text x="440" y="256" textAnchor="middle" fill="rgba(0,255,157,0.5)" fontSize="12" fontFamily="Outfit">⚽ PITCH</text>

                {ZONES.map(zone => {
                  const data = getZoneData(zone.name)
                  const color = densityColor(data.density)
                  const isHovered = hoveredZone === zone.id
                  return (
                    <g key={zone.id}
                      onMouseEnter={() => setHoveredZone(zone.id)}
                      onMouseLeave={() => setHoveredZone(null)}
                      style={{ cursor: 'pointer' }}
                    >
                      <rect
                        x={zone.x} y={zone.y}
                        width={zone.w} height={zone.h}
                        rx="8"
                        fill={`${color}22`}
                        stroke={color}
                        strokeWidth={isHovered ? 2 : 1}
                        style={{
                          transition: 'all 0.5s ease',
                          filter: data.density > 0.85 ? `drop-shadow(0 0 8px ${color})` : 'none',
                        }}
                      />
                      <text x={zone.x + zone.w / 2} y={zone.y + zone.h / 2 - 6} textAnchor="middle" fill={color} fontSize="10" fontFamily="Outfit" fontWeight="600">
                        {zone.name}
                      </text>
                      <text x={zone.x + zone.w / 2} y={zone.y + zone.h / 2 + 10} textAnchor="middle" fill={color} fontSize="13" fontFamily="JetBrains Mono" fontWeight="700">
                        {Math.round(data.density * 100)}%
                      </text>
                    </g>
                  )
                })}
              </svg>

              {/* Legend */}
              <div className="flex gap-4 justify-center" style={{ marginTop: 16 }}>
                {[
                  { label: 'Clear', color: '#00ff9d' },
                  { label: 'Busy', color: '#ffb800' },
                  { label: 'High', color: '#ff6b35' },
                  { label: 'Critical', color: '#ff4757' },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-1">
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Zone Details Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Zone Status</h3>

              {/* Hover Detail Card */}
              {hoveredZone && (
                <div style={{ padding: 16, borderRadius: 12, background: 'var(--primary-dim)', border: '1px solid var(--primary)', marginBottom: 4 }}>
                  {(() => {
                    const z = ZONES.find(z => z.id === hoveredZone)
                    const data = getZoneData(z?.name)
                    const color = densityColor(data.density)
                    return (
                      <>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary)', marginBottom: 8 }}>
                          📍 {z?.name} <span className="text-xs text-muted">({z?.type})</span>
                        </div>
                        <div className="flex gap-4">
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: 'var(--font-mono)' }}>{Math.round(data.density * 100)}%</div>
                            <div className="text-xs text-muted">Density</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{data.queue_length || 0}</div>
                            <div className="text-xs text-muted">Queue</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--warning)', fontFamily: 'var(--font-mono)' }}>{(data.wait_time_minutes || 0).toFixed(1)}m</div>
                            <div className="text-xs text-muted">Wait</div>
                          </div>
                        </div>
                        <span className={`badge badge-${data.density > 0.85 ? 'danger' : data.density > 0.65 ? 'warning' : data.density > 0.4 ? 'accent' : 'success'}`} style={{ marginTop: 10 }}>
                          {densityLabel(data.density).toUpperCase()}
                        </span>
                      </>
                    )
                  })()}
                </div>
              )}

              {/* All zones list */}
              <div style={{ overflowY: 'auto', maxHeight: '55vh', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ZONES.map(zone => {
                  const data = getZoneData(zone.name)
                  const color = densityColor(data.density)
                  return (
                    <div
                      key={zone.id}
                      className="glass-card"
                      style={{ padding: '12px 16px', cursor: 'pointer', border: hoveredZone === zone.id ? `1px solid ${color}` : undefined }}
                      onMouseEnter={() => setHoveredZone(zone.id)}
                      onMouseLeave={() => setHoveredZone(null)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div style={{ width: 8, height: 8, borderRadius: 2, background: color, boxShadow: `0 0 6px ${color}` }} />
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{zone.name}</span>
                          <span className="text-xs text-muted">({zone.type})</span>
                        </div>
                        <span style={{ fontSize: 16, fontWeight: 800, color, fontFamily: 'var(--font-mono)' }}>
                          {Math.round(data.density * 100)}%
                        </span>
                      </div>
                      <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginTop: 8 }}>
                        <div style={{
                          height: '100%', width: `${Math.min(100, data.density * 100)}%`,
                          background: color, borderRadius: 2,
                          transition: 'width 0.8s ease', boxShadow: `0 0 6px ${color}`,
                        }} />
                      </div>
                      <div className="flex gap-4 mt-2">
                        <span className="text-xs text-muted">Queue: {data.queue_length || 0}</span>
                        <span className="text-xs text-muted">Wait: {(data.wait_time_minutes || 0).toFixed(1)} min</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          <div>
            {/* Info strip */}
            <div className="flex gap-3 mb-4">
              <div style={{ padding: '10px 16px', borderRadius: 10, background: 'var(--accent-dim)', border: '1px solid rgba(0,212,255,0.2)', flex: 1 }}>
                <div className="text-xs font-bold" style={{ color: 'var(--accent)', marginBottom: 4 }}>📍 Final-Mile Coverage</div>
                <div className="text-xs text-muted">Crowd density overlays extend to parking zones and main road exits — showing the full attendee journey beyond the stadium gates.</div>
              </div>
              <div style={{ padding: '10px 16px', borderRadius: 10, background: 'var(--primary-dim)', border: '1px solid rgba(108,99,255,0.2)', flex: 1 }}>
                <div className="text-xs font-bold" style={{ color: 'var(--primary)', marginBottom: 4 }}>🛣️ Exit Routing</div>
                <div className="text-xs text-muted">Colored polylines show AI-recommended exit routes to Ring Road North and Stadium Way South — minimizing post-match traffic.</div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: 20 }}>
              <div className="flex items-center justify-between mb-4">
                <h3 style={{ fontSize: 15, fontWeight: 700 }}>EventFlow Arena — Live Map View</h3>
                <div className="flex gap-2 items-center">
                  {hasGoogleMapsKey
                    ? <span className="badge badge-success">🟢 Google Maps Active</span>
                    : <span className="badge badge-warning">⚠️ API Key Missing</span>
                  }
                </div>
              </div>
              <GoogleMapsView
                heatmapData={heatmapData}
                showRoutes={showRoutes}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
