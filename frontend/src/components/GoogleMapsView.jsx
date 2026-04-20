import React, { useEffect, useRef, useState } from 'react'
import { setOptions, importLibrary } from '@googlemaps/js-api-loader'

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
        if (!window.google || !window.google.maps) {
          setOptions({
            apiKey: apiKey,
            version: 'weekly',
            libraries: ['places', 'marker'],
          })
        }

        const { Map, InfoWindow, Circle, Polyline } = await importLibrary('maps')
        const { Marker } = await importLibrary('marker')

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
          <p className="text-sm" style={{ maxWidth: 360, lineHeight: 1.7 }}>
            Add your key to <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', background: 'rgba(0,212,255,0.1)', padding: '2px 6px', borderRadius: 4 }}>frontend/.env</code> to enable the live venue map with parking routes.
          </p>
          <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 10, background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)', textAlign: 'left' }}>
            <code style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--primary)' }}>
              VITE_GOOGLE_MAPS_API_KEY=AIza...
            </code>
          </div>
          <p className="text-xs text-muted" style={{ marginTop: 12 }}>
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
    return (
      <div className="flex flex-col items-center justify-center h-[480px] bg-[#111] rounded-2xl border border-dashed border-gray-800 text-center p-8">
        <div className="text-4xl mb-4">⚠️</div>
        <h3 className="text-xl font-bold text-gray-200 mb-2">
          {authError ? 'Map Authorization Error' : 'Connection Failed'}
        </h3>
        <p className="text-sm text-gray-400 max-w-md mx-auto">
          {authError 
            ? 'The Google Maps Key is being rejected. This usually means the "Maps JavaScript API" is not enabled in your Google Cloud Console, or billing is not active.' 
            : 'Unable to initialize Google Maps. Falling back to SVG view.'}
        </p>
        <div className="mt-6 flex flex-col items-center gap-4">
           <a 
             href="https://console.cloud.google.com/google/maps-apis/api-list" 
             target="_blank" 
             className="btn btn-primary btn-sm"
           >
             Open Google Cloud Console
           </a>
           <span className="text-[10px] text-gray-600 font-mono">
             Error: {authError ? 'ApiProjectMapError' : error || 'Unknown'}
           </span>
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
