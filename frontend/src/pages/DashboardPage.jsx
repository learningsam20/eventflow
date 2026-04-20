import React, { useEffect, useState } from 'react'
import Marker from 'markdown-to-jsx'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import MediaCapture from '../components/MediaCapture'
import NarrativeModal from '../components/NarrativeModal'


function KPICard({ icon, label, value, delta, deltaLabel, color = 'var(--primary)' }) {
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
      <div className="kpi-value" style={{ background: `linear-gradient(135deg, var(--text-primary), ${color})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        {value}
      </div>
      <div className="kpi-label">{label}</div>
      {deltaLabel && <div className="text-xs text-muted mt-2">{deltaLabel}</div>}
    </div>
  )
}

function EventCard({ event }) {
  const navigate = useNavigate()
  const statusColor = event.status === 'live' ? 'success' : event.status === 'upcoming' ? 'accent' : 'muted'
  return (
    <div
      className="glass-card"
      style={{ padding: 20, cursor: 'pointer' }}
      onClick={() => navigate('/heatmap')}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`badge badge-${statusColor}`}>
          {event.status === 'live' && <span className="status-dot status-live" />}
          {event.status.toUpperCase()}
        </span>
        <span className="text-xs text-muted">{event.sport_type}</span>
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{event.name}</div>
      {event.home_team && (
        <div className="flex items-center justify-between" style={{ padding: '12px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', margin: '8px 0' }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{event.home_team}</span>
          <span style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
            {event.home_score} - {event.away_score}
          </span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{event.away_team}</span>
        </div>
      )}
      <div className="text-xs text-muted">{event.venue}</div>
      {event.current_attendance > 0 && (
        <div style={{ marginTop: 8 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
            <span className="text-xs text-muted">Attendance</span>
            <span className="text-xs" style={{ color: 'var(--accent)' }}>
              {event.current_attendance.toLocaleString()} / {event.capacity.toLocaleString()}
            </span>
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
            <div style={{
              height: '100%',
              width: `${Math.min(100, (event.current_attendance / event.capacity) * 100)}%`,
              background: 'linear-gradient(90deg, var(--primary), var(--accent))',
              borderRadius: 2,
              transition: 'width 1s ease',
            }} />
          </div>
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const { user, isManager } = useAuth()
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [tickets, setTickets] = useState([])
  const [kpis, setKpis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [narrativeData, setNarrativeData] = useState(null)
  const [showReport, setShowReport] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      try {
        const [evRes, tickRes] = await Promise.all([
          api.get('/api/events'),
          api.get('/api/tickets/my')
        ])
        const fetchedEvents = Array.isArray(evRes.data) ? evRes.data.slice(0, 3) : []
        const fetchedTickets = Array.isArray(tickRes.data) ? tickRes.data : []
        
        if (!Array.isArray(evRes.data) || !Array.isArray(tickRes.data)) {
          console.error('[Dashboard] Expected arrays from API, got:', {
            events: typeof evRes.data,
            tickets: typeof tickRes.data
          })
        }

        setEvents(fetchedEvents)
        setTickets(fetchedTickets)
        
        if (isManager) {
          const kpiRes = await api.get('/api/analytics/kpis')
          setKpis(kpiRes.data)
        }

        // Fetch AI Narrative for the next active event
        const activeT = fetchedTickets.find(t => t.status === 'upcoming' || t.status === 'live')
        if (activeT) {
          const narRes = await api.get(`/api/analytics/event/${activeT.event_id}/narrative`)
          setNarrativeData(narRes.data)
        } else if (fetchedEvents.length > 0) {
          const narRes = await api.get(`/api/analytics/event/${fetchedEvents[0].id}/narrative`)
          setNarrativeData(narRes.data)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [isManager])

  const upcomingTicket = Array.isArray(tickets) 
    ? tickets.find(t => t.status === 'upcoming' || t.status === 'live')
    : null

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">
              {greeting()}, {user?.full_name?.split(' ')[0] || user?.username}! 👋
            </h1>
            <p className="page-subtitle">
              {isManager ? 'Your venue intelligence hub — real-time insights and AI ops.' : 'Your personal event companion — navigate, order, and enjoy!'}
            </p>
          </div>
          <div className="flex gap-2">
            {isManager && (
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/simulator')}>
                🎮 Launch Simulator
              </button>
            )}
            <button className="btn btn-accent btn-sm" onClick={() => navigate('/concierge')}>
              🤖 AI Assistant
            </button>
          </div>
        </div>
      </div>

      <div className="page-body">
        {/* KPI Row (Manager only) */}
        {isManager && kpis && (
          <div className="grid-4 mb-6">
            <KPICard icon="⏱️" label="Avg Queue Time" value={`${kpis.avg_queue_time}m`} delta={kpis.queue_time_delta} color="var(--success)" />
            <KPICard icon="🚀" label="Throughput/min" value={kpis.throughput_per_minute} delta={kpis.throughput_delta} color="var(--accent)" />
            <KPICard icon="⭐" label="NPS Score" value={kpis.nps_score} delta={kpis.nps_delta} color="var(--warning)" />
            <KPICard icon="📦" label="Orders Fulfilled" value={kpis.orders_fulfilled.toLocaleString()} color="var(--primary)" />
          </div>
        )}

        {/* Fan Session Stats */}
        {!isManager && (
          <div className="grid-3 mb-6">
            <div className="glass-card" style={{ padding: 20, textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate('/tickets')}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🎫</div>
              <div style={{ fontWeight: 700 }}>
                {upcomingTicket ? upcomingTicket.seat_info : 'No Active Tickets'}
              </div>
              <div className="text-sm text-muted">{upcomingTicket ? 'Next Match Access' : 'Purchase tickets today'}</div>
            </div>
            <div className="glass-card" style={{ padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🏟️</div>
              <div style={{ fontWeight: 700 }}>{upcomingTicket ? upcomingTicket.event_name : 'No Upcoming Match'}</div>
              <div className="text-sm text-muted">Venue: {upcomingTicket ? upcomingTicket.venue : 'N/A'}</div>
            </div>
            <div className="glass-card" style={{ padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>⚡</div>
              <div style={{ fontWeight: 700 }}>{upcomingTicket ? 'VIP Gate Access' : 'Standard Entry'}</div>
              <div className="text-sm" style={{ color: 'var(--success)' }}>
                {upcomingTicket ? 'Express entry via Gate 3' : 'Main regular entrance'}
              </div>
            </div>
          </div>
        )}

        <div className="grid-2 gap-6">
          {/* Events */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Events</h2>
              <span className="badge badge-muted">{events.length} total</span>
            </div>
            {loading ? (
              <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                <div className="spinner" style={{ width: 30, height: 30, borderWidth: 3 }} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {events.map(ev => <EventCard key={ev.id} event={ev} />)}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Quick Actions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { icon: '🗺️', title: 'Live Venue Heatmap', desc: 'See real-time crowd density', route: '/heatmap', color: 'var(--accent)' },
                { icon: '🎮', title: 'Digital Twin Simulator', desc: 'Run crowd scenario simulations', route: '/simulator', color: 'var(--primary)' },
                { icon: '🤖', title: 'AI Concierge Chat', desc: 'Ask anything about the event', route: '/concierge', color: '#00ff9d' },
                { icon: '🛒', title: 'Order Food & Drinks', desc: 'Skip the queue with smart orders', route: '/orders', color: 'var(--warning)' },
                ...(isManager ? [
                  { icon: '📊', title: 'Analytics Dashboard', desc: 'Historical KPIs and reports', route: '/analytics', color: '#ff6b9d' },
                ] : []),
              ].map(item => (
                <div
                  key={item.route}
                  className="glass-card"
                  style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }}
                  onClick={() => navigate(item.route)}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: `${item.color}15`,
                    border: `1px solid ${item.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, flexShrink: 0,
                  }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{item.title}</div>
                    <div className="text-xs text-muted">{item.desc}</div>
                  </div>
                  <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 18 }}>›</span>
                </div>
              ))}
            </div>

            {/* AI Insight Section */}
            <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: 'var(--primary-dim)', border: '1px solid rgba(108,99,255,0.2)' }}>
              <div className="flex items-center justify-between mb-4">
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  🧠 AI Event Story
                </div>
                {narrativeData && (
                  <button 
                  onClick={() => setShowReport(true)}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 11, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>
                    Read Full Story
                  </button>
                )}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {narrativeData?.narrative 
                  ? `${narrativeData.narrative.substring(0, 160)}...`
                  : 'AI is currently analyzing the atmosphere and multimodal feeds. Check back in a moment for a live update!'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showReport && (
        <NarrativeModal data={narrativeData} onClose={() => setShowReport(false)} />
      )}

      {upcomingTicket && (
        <MediaCapture eventId={upcomingTicket.event_id} onUploadSuccess={() => navigate('/narrative')} />
      )}
    </div>
  )
}
