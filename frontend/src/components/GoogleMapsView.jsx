import React, { useEffect, useRef, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'

// --- Configuration ---
const VENUE_LAT = 51.5557  
const VENUE_LNG = -0.2795

const MAP_ZONES = [
  { id: 'north_stand',   label: 'North Stand',    lat: VENUE_LAT + 0.0020, lng: VENUE_LNG + 0.0005, radius: 60 },
  { id: 'south_stand',   label: 'South Stand',    lat: VENUE_LAT - 0.0020, lng: VENUE_LNG + 0.0005, radius: 60 },
  { id: 'east_wing',     label: 'East Wing',      lat: VENUE_LAT + 0.0002, lng: VENUE_LNG + 0.0045, radius: 55 },
  { id: 'west_wing',     label: 'West Wing',      lat: VENUE_LAT + 0.0002, lng: VENUE_LNG - 0.0040, radius: 55 },
  { id: 'main_gate',     label: 'Main Gate',      lat: VENUE_LAT - 0.0035, lng: VENUE_LNG + 0.0010, radius: 40 },
  { id: 'vip_entrance',  label: 'VIP Entrance',   lat: VENUE_LAT - 0.0035, lng: VENUE_LNG + 0.0030, radius: 35 },
  { id: 'concourse_a',   label: 'Concourse A',    lat: VENUE_LAT - 0.0015, lng: VENUE_LNG - 0.0030, radius: 45 },
  { id: 'concourse_b',   label: 'Concourse B',    lat: VENUE_LAT + 0.0015, lng: VENUE_LNG + 0.0035, radius: 45 },
  { id: 'food_court_1',  label: 'Food Court 1',   lat: VENUE_LAT + 0.0010, lng: VENUE_LNG - 0.0035, radius: 40 },
  { id: 'food_court_2',  label: 'Food Court 2',   lat: VENUE_LAT - 0.0010, lng: VENUE_LNG + 0.0040, radius: 40 },
  { id: 'parking_a',     label: 'Parking Zone A', lat: VENUE_LAT - 0.0060, lng: VENUE_LNG - 0.0050, radius: 80 },
  { id: 'parking_b',     label: 'Parking Zone B', lat: VENUE_LAT - 0.0060, lng: VENUE_LNG + 0.0055, radius: 80 },
  { id: 'medical_bay',   label: 'Medical Bay',    lat: VENUE_LAT + 0.0001, lng: VENUE_LNG + 0.0002, radius: 30 },
  { id: 'emergency_exit',label: 'Emergency Exit', lat: VENUE_LAT - 0.0030, lng: VENUE_LNG - 0.0010, radius: 35 },
]

const EXIT_ROUTES = [
  {
    label: 'Route A — Ring Road North',
    color: '#00ff9d',
    path: [
      { lat: VENUE_LAT - 0.0060, lng: VENUE_LNG - 0.0050 },
      { lat: VENUE_LAT - 0.0120, lng: VENUE_LNG - 0.0120 },
      { lat: VENUE_LAT - 0.0200, lng: VENUE_LNG - 0.0200 },
    ],
  },
  {
    label: 'Route B — Stadium Way South',
    color: '#00d4ff',
    path: [
      { lat: VENUE_LAT - 0.0060, lng: VENUE_LNG + 0.0055 },
      { lat: VENUE_LAT - 0.0120, lng: VENUE_LNG + 0.0130 },
      { lat: VENUE_LAT - 0.0220, lng: VENUE_LNG + 0.0200 },
    ],
  },
]

const densityToColor = (density) => {
  if (density < 0.4) return '#00ff9d'
  if (density < 0.65) return '#ffb800'
  if (density < 0.85) return '#ff6b35'
  return '#ff4757'
}

const MAP_DARK_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0d1320' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#6b7280' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0d1320' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a2535' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#1e2d42' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#1c3152' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#6c63ff' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#111827' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#0f1f10' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#060d18' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#111827' }] },
]

export default function GoogleMapsView({ heatmapData = [], showRoutes = true }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const circlesRef = useRef([])
  const polylinesRef = useRef([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [mapReady, setMapReady] = useState(false)
  const [authError, setAuthError] = useState(false)

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  useEffect(() => {
    // Detect Google Maps authentication failures (e.g. project setup/billing errors)
    window.gm_authFailure = () => {
      setAuthError(true)
    }

    if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
      setError('no_key')
      setLoading(false)
      return
    }

    const initMap = async () => {
      try {
        const loader = new Loader({
          apiKey: apiKey,
          version: 'weekly',
          libraries: ['places', 'marker'],
        })

        const { Map, InfoWindow, Circle, Polyline, Marker } = await loader.importLibrary('maps')

        if (!mapRef.current) return

        const map = new Map(mapRef.current, {
          center: { lat: VENUE_LAT, lng: VENUE_LNG },
          zoom: 16,
          styles: MAP_DARK_STYLE,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        })

        mapInstanceRef.current = map

        // Access SymbolPath from the global google namespace after libraries load
        const SymbolPath = window.google.maps.SymbolPath

        // Venue center marker
        new Marker({
          position: { lat: VENUE_LAT, lng: VENUE_LNG },
          map,
          title: 'EventFlow Arena',
          icon: {
            path: SymbolPath.CIRCLE,
            scale: 12,
            fillColor: '#6c63ff',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2,
          },
          label: {
            text: '⚡',
            fontSize: '16px',
            color: '#fff',
          },
        })

        // Draw zone circles
        MAP_ZONES.forEach((zone) => {
          const densityEntry = heatmapData.find(h => h.zone === zone.label)
          const density = densityEntry?.density ?? (Math.random() * 0.6 + 0.2)
          const color = densityToColor(density)

          const circle = new Circle({
            map,
            center: { lat: zone.lat, lng: zone.lng },
            radius: zone.radius,
            fillColor: color,
            fillOpacity: 0.35,
            strokeColor: color,
            strokeWeight: 1.5,
            strokeOpacity: 0.8,
          })

          const infoWindow = new InfoWindow({
            content: `
              <div style="background:#0d1320;color:#f0f4ff;padding:12px;border-radius:8px;font-family:Outfit,sans-serif;min-width:160px;border:1px solid rgba(255,255,255,0.1)">
                <div style="font-weight:700;font-size:14px;margin-bottom:6px">${zone.label}</div>
                <div style="color:${color};font-size:20px;font-weight:800;font-family:monospace">${Math.round(density * 100)}%</div>
                <div style="color:#6b7280;font-size:11px;margin-top:4px">
                  Queue: ${densityEntry?.queue_length ?? Math.round(density * 200)} persons<br/>
                  Wait: ${densityEntry?.wait_time_minutes?.toFixed(1) ?? (density * 15).toFixed(1)} min
                </div>
              </div>
            `,
          })

          circle.addListener('click', () => {
            infoWindow.setPosition({ lat: zone.lat, lng: zone.lng })
            infoWindow.open(map)
          })

          circlesRef.current.push(circle)
        })

        // Draw exit routes
        if (showRoutes) {
          EXIT_ROUTES.forEach((route) => {
            const polyline = new Polyline({
              path: route.path,
              geodesic: true,
              strokeColor: route.color,
              strokeOpacity: 0.85,
              strokeWeight: 3,
              icons: [{
                icon: { path: SymbolPath.FORWARD_CLOSED_ARROW, scale: 3, fillColor: route.color, fillOpacity: 1 },
                offset: '100%',
                repeat: '80px',
              }],
            })
            polyline.setMap(map)
            polylinesRef.current.push(polyline)

            // Route label marker
            const midPoint = route.path[1]
            new Marker({
              position: midPoint,
              map,
              title: route.label,
              icon: {
                path: SymbolPath.CIRCLE,
                scale: 7,
                fillColor: route.color,
                fillOpacity: 1,
                strokeColor: '#080c14',
                strokeWeight: 2,
              },
            })
          })
        }

        setMapReady(true)
        setLoading(false)
      } catch (err) {
        console.error('[GoogleMapsView] Init failed:', err)
        setError('load_failed')
        setLoading(false)
      }
    }

    initMap()

    return () => {
      circlesRef.current.forEach(c => c.setMap(null))
      polylinesRef.current.forEach(p => p.setMap(null))
      circlesRef.current = []
      polylinesRef.current = []
    }
  }, [apiKey])

  // Update circle colors when heatmap data changes
  useEffect(() => {
    if (!mapReady || !window.google) return
    circlesRef.current.forEach((circle, i) => {
      const zone = MAP_ZONES[i]
      if (!zone) return
      const entry = heatmapData.find(h => h.zone === zone.label)
      if (entry) {
        const color = densityToColor(entry.density)
        circle.setOptions({ fillColor: color, strokeColor: color })
      }
    })
  }, [heatmapData, mapReady])

  if (error === 'no_key') {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: 420, border: '1px dashed rgba(108,99,255,0.4)', borderRadius: 16,
        color: 'var(--text-muted)', gap: 16, padding: 32, background: 'var(--bg-card)',
      }}>
        <span style={{ fontSize: 48 }}>🗺️</span>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 8 }}>
            Google Maps — API Key Required
          </div>
          <p style={{ fontSize: 13, maxWidth: 360, lineHeight: 1.7 }}>
            Add your key to <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', background: 'rgba(0,212,255,0.1)', padding: '2px 6px', borderRadius: 4 }}>frontend/.env</code> to enable the live venue map with parking routes.
          </p>
          <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 10, background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)', textAlign: 'left' }}>
            <code style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--primary)' }}>
              VITE_GOOGLE_MAPS_API_KEY=AIza...
            </code>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12 }}>
            Free tier: $200/month credit · ~28K map loads/month · No charge for demo use
          </p>
          <a
            href="https://console.cloud.google.com/apis/library/maps-javascript.googleapis.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-sm"
            style={{ marginTop: 16, display: 'inline-flex' }}
          >
            🔑 Get Free API Key →
          </a>
        </div>
      </div>
    )
  }

  if (error || authError) {
    // Rich SVG fallback — shows real zone density without Google Maps API
    const SVG_ZONES = [
      { id: 'north_stand', label: 'North Stand', x: 310, y: 70, w: 220, h: 80, type: 'stand' },
      { id: 'south_stand', label: 'South Stand', x: 310, y: 360, w: 220, h: 80, type: 'stand' },
      { id: 'east_wing',   label: 'East Wing',   x: 590, y: 170, w: 90, h: 140, type: 'stand' },
      { id: 'west_wing',   label: 'West Wing',   x: 160, y: 170, w: 90, h: 140, type: 'stand' },
      { id: 'main_gate',   label: 'Main Gate',   x: 380, y: 455, w: 110, h: 48, type: 'gate' },
      { id: 'vip_entrance',label: 'VIP',         x: 510, y: 455, w: 80,  h: 48, type: 'gate' },
      { id: 'concourse_a', label: 'Concourse A', x: 160, y: 345, w: 130, h: 55, type: 'concourse' },
      { id: 'concourse_b', label: 'Concourse B', x: 555, y: 110, w: 130, h: 55, type: 'concourse' },
      { id: 'food_court_1',label: 'Food Ct 1',   x: 160, y: 110, w: 130, h: 55, type: 'food' },
      { id: 'food_court_2',label: 'Food Ct 2',   x: 555, y: 345, w: 130, h: 55, type: 'food' },
      { id: 'parking_a',   label: 'Parking A',   x: 100, y: 455, w: 120, h: 50, type: 'parking' },
      { id: 'parking_b',   label: 'Parking B',   x: 625, y: 455, w: 120, h: 50, type: 'parking' },
      { id: 'medical_bay', label: 'Medical',      x: 350, y: 200, w: 80,  h: 48, type: 'facility' },
    ]

    const getD = (label) => {
      const d = heatmapData.find(h => h.zone === label)
      return d?.density ?? (0.2 + Math.sin(label.length * 0.9) * 0.3 + 0.2)
    }

    return (
      <div>
        {/* Error strip */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
          background: 'rgba(255,183,0,0.08)', border: '1px solid rgba(255,183,0,0.2)',
          borderRadius: 10, marginBottom: 12, fontSize: 12, color: 'var(--text-muted)',
        }}>
          <span>⚠️</span>
          <span style={{ flexGrow: 1 }}>
            <strong style={{ color: '#ffb800' }}>
              {authError ? 'Google Maps API key rejected' : 'Google Maps failed to load'}
            </strong>
            {' — '} showing SVG density overlay.
            {authError && ' Verify \"Maps JavaScript API\" is enabled in '}
            {authError && <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>Google Cloud Console</a>}
            {authError && ' and the key isn\'t domain-restricted for localhost.'}
          </span>
        </div>

        {/* SVG Aerial Fallback */}
        <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
          {/* Legends */}
          <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 5, background: 'rgba(8,12,20,0.92)', borderRadius: 8, padding: '8px 12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Zone Density</div>
            {[['Clear', '#00ff9d'], ['Busy', '#ffb800'], ['High', '#ff6b35'], ['Critical', '#ff4757']].map(([l, c]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{l}</span>
              </div>
            ))}
          </div>
          {showRoutes && (
            <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 5, background: 'rgba(8,12,20,0.92)', borderRadius: 8, padding: '8px 12px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Exit Routes</div>
              {[['Route A – Ring Rd N', '#00ff9d'], ['Route B – Stadium Way S', '#00d4ff']].map(([l, c]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                  <div style={{ width: 18, height: 2, background: c, borderRadius: 1 }} />
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{l}</span>
                </div>
              ))}
            </div>
          )}
          <svg viewBox="0 0 850 530" style={{ width: '100%', height: 'auto', display: 'block', background: '#0d1320' }}>
            {/* Grid lines — street feel */}
            {[0,85,170,255,340,425,510,595,680,765,850].map(x => (
              <line key={`gx${x}`} x1={x} y1={0} x2={x} y2={530} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            ))}
            {[0,53,106,159,212,265,318,371,424,477,530].map(y => (
              <line key={`gy${y}`} x1={0} y1={y} x2={850} y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            ))}

            {/* Stadium outline */}
            <ellipse cx="420" cy="245" rx="240" ry="175" fill="rgba(108,99,255,0.04)" stroke="rgba(108,99,255,0.15)" strokeWidth="1.5" />
            {/* Pitch */}
            <rect x="300" y="165" width="240" height="160" rx="10" fill="rgba(0,255,157,0.06)" stroke="rgba(0,255,157,0.2)" strokeWidth="1" />
            <line x1="420" y1="165" x2="420" y2="325" stroke="rgba(0,255,157,0.15)" strokeWidth="1" />
            <circle cx="420" cy="245" r="30" fill="none" stroke="rgba(0,255,157,0.15)" strokeWidth="1" />
            <text x="420" y="250" textAnchor="middle" fill="rgba(0,255,157,0.4)" fontSize="11" fontFamily="Outfit">⚽ PITCH</text>

            {/* Zone blocks */}
            {SVG_ZONES.map(zone => {
              const d = getD(zone.label)
              const color = densityToColor(d)
              return (
                <g key={zone.id}>
                  <rect x={zone.x} y={zone.y} width={zone.w} height={zone.h} rx="6"
                    fill={`${color}1a`} stroke={color} strokeWidth="1"
                    style={{ filter: d > 0.85 ? `drop-shadow(0 0 6px ${color})` : 'none' }}
                  />
                  <text x={zone.x + zone.w/2} y={zone.y + zone.h/2 - 7}
                    textAnchor="middle" fill={color} fontSize="9" fontFamily="Outfit" fontWeight="700">
                    {zone.label}
                  </text>
                  <text x={zone.x + zone.w/2} y={zone.y + zone.h/2 + 10}
                    textAnchor="middle" fill={color} fontSize="14" fontFamily="monospace" fontWeight="800">
                    {Math.round(d * 100)}%
                  </text>
                </g>
              )
            })}

            {/* Exit routes */}
            {showRoutes && (
              <>
                <polyline points="160,480 90,530 20,530" fill="none" stroke="#00ff9d" strokeWidth="2.5" strokeDasharray="6 3" markerEnd="url(#arrowGreen)" />
                <polyline points="685,480 760,530 840,530" fill="none" stroke="#00d4ff" strokeWidth="2.5" strokeDasharray="6 3" markerEnd="url(#arrowBlue)" />
                <defs>
                  <marker id="arrowGreen" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L6,3 z" fill="#00ff9d" />
                  </marker>
                  <marker id="arrowBlue" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L6,3 z" fill="#00d4ff" />
                  </marker>
                </defs>
              </>
            )}

            {/* Venue pin */}
            <circle cx="420" cy="245" r="10" fill="#6c63ff" stroke="rgba(255,255,255,0.6)" strokeWidth="2" />
            <text x="420" y="249" textAnchor="middle" fontSize="10" fill="#fff">⚡</text>

            {/* Coordinate watermark */}
            <text x="10" y="522" fill="rgba(255,255,255,0.12)" fontSize="9" fontFamily="monospace">51.5557°N, -0.2795°E · EventFlow Arena · Wembley</text>
          </svg>
        </div>
      </div>
    )
  }


  return (
    <div style={{ position: 'relative' }}>
      {/* Legend overlay */}
      <div style={{
        position: 'absolute', top: 12, left: 12, zIndex: 10,
        background: 'rgba(8,12,20,0.9)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10, padding: '10px 14px', backdropFilter: 'blur(8px)',
      }}>
        <div className="text-xs font-bold" style={{ color: 'var(--primary)', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Zone Density
        </div>
        {[
          { label: 'Clear (0–40%)', color: '#00ff9d' },
          { label: 'Busy (40–65%)', color: '#ffb800' },
          { label: 'High (65–85%)', color: '#ff6b35' },
          { label: 'Critical (85%+)', color: '#ff4757' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-2" style={{ marginBottom: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: l.color }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Exit routes legend */}
      {showRoutes && (
        <div style={{
          position: 'absolute', top: 12, right: 12, zIndex: 10,
          background: 'rgba(8,12,20,0.9)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10, padding: '10px 14px', backdropFilter: 'blur(8px)',
        }}>
          <div className="text-xs font-bold" style={{ color: 'var(--accent)', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Exit Routes
          </div>
          {EXIT_ROUTES.map(r => (
            <div key={r.label} className="flex items-center gap-2" style={{ marginBottom: 4 }}>
              <div style={{ width: 20, height: 2, background: r.color, borderRadius: 1 }} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.label}</span>
            </div>
          ))}
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Click zones for details</span>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg-card)', borderRadius: 16, zIndex: 20,
          flexDirection: 'column', gap: 12,
        }}>
          <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
          <span className="text-sm text-muted">Loading Google Maps...</span>
        </div>
      )}

      <div
        ref={mapRef}
        style={{ width: '100%', height: 480, borderRadius: 16, border: '1px solid var(--border)' }}
      />
    </div>
  )
}
