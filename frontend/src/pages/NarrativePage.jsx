import React, { useEffect, useState } from 'react'
import api from '../api/client'
import MediaCapture from '../components/MediaCapture'
import toast from 'react-hot-toast'

export default function NarrativePage() {
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [narrative, setNarrative] = useState('')
  const [media, setMedia] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get('/api/events')
        const liveOrUpcoming = res.data.filter(e => e.status !== 'ended')
        setEvents(res.data)
        if (liveOrUpcoming.length > 0) {
          setSelectedEvent(liveOrUpcoming[0])
        } else if (res.data.length > 0) {
          setSelectedEvent(res.data[0])
        }
      } catch (e) {
        toast.error('Failed to load events')
      }
    }
    fetchEvents()
  }, [])

  const fetchNarrative = async () => {
    if (!selectedEvent) return
    setLoading(true)
    try {
      // Fetch media first to provide context
      const mediaRes = await api.get(`/api/media/${selectedEvent.id}`)
      setMedia(mediaRes.data)

      const narrativeRes = await api.get(`/api/analytics/event/${selectedEvent.id}/narrative`)
      setNarrative(narrativeRes.data.narrative)
    } catch (e) {
      toast.error('Failed to generate live narration')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedEvent) fetchNarrative()
  }, [selectedEvent])

  if (!selectedEvent) return (
    <div className="flex justify-center p-20">
      <div className="spinner" />
    </div>
  )

  return (
    <div className="narrative-container">
      <div className="page-header">
        <h1 className="page-title">🖋️ AI Live Narrative</h1>
        <p className="page-subtitle">Personalized multimodal event coverage powered by Gemini</p>
        
        <div className="event-selector">
          {events.map(e => (
            <button 
              key={e.id}
              className={`event-tag ${selectedEvent.id === e.id ? 'active' : ''}`}
              onClick={() => setSelectedEvent(e)}
            >
              {e.name.split('-')[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="page-body">
        {loading ? (
          <div className="live-skeleton">
            <div className="skeleton-title" />
            <div className="skeleton-text" />
            <div className="skeleton-text" />
            <div className="skeleton-image" />
          </div>
        ) : (
          <div className="narrative-content">
            <div className="main-narrative glass-card">
              <div className="live-indicator">
                <span className="pulse-dot" /> LIVE COVERAGE
              </div>
              <div dangerouslySetInnerHTML={{ __html: (narrative || '').replace(/\n/g, '<br/>') }} />
              
              <div style={{ marginTop: 24, padding: 16, background: 'rgba(108,99,255,0.05)', borderRadius: 12, fontSize: 13, color: 'var(--text-muted)' }}>
                ✨ This narrative is dynamically generated using live sensor feeds and visual reports from the ground.
              </div>
            </div>

            <div className="visual-feed">
              <h3 style={{ marginBottom: 20 }}>📸 Visual Highlights</h3>
              {media.length === 0 ? (
                <div className="empty-media">
                  No visual moments captured yet. Use the camera to start narrating!
                </div>
              ) : (
                <div className="media-grid">
                  {media.map(m => (
                    <div key={m.id} className="media-card glass-card">
                      <img src={m.image_path} alt={m.caption} />
                      <div className="media-info">
                        <div className="badge badge-accent">{m.zone || 'Venue'}</div>
                        <p className="text-xs" style={{ margin: '8px 0', fontWeight: 600 }}>{m.ai_description}</p>
                        <span className="text-xs text-muted">{new Date(m.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <MediaCapture eventId={selectedEvent.id} onUploadSuccess={fetchNarrative} />

      <style>{`
        .narrative-container {
          max-width: 1000px;
          margin: 0 auto;
        }
        .event-selector {
          display: flex;
          gap: 12px;
          margin-top: 16px;
          overflow-x: auto;
          padding-bottom: 8px;
        }
        .event-tag {
          padding: 6px 16px;
          border-radius: 20px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          color: var(--text-muted);
          cursor: pointer;
          white-space: nowrap;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.2s;
        }
        .event-tag.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }
        .narrative-content {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .main-narrative {
          padding: 40px;
          font-family: 'Inter', sans-serif;
          line-height: 1.8;
          font-size: 16px;
          color: var(--text-secondary);
        }
        .live-indicator {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 4px 10px;
          background: rgba(255, 71, 87, 0.1);
          color: #ff4757;
          border-radius: 4px;
          font-weight: 800;
          font-size: 11px;
          letter-spacing: 0.1em;
          margin-bottom: 24px;
        }
        .pulse-dot {
          width: 8px;
          height: 8px;
          background: #ff4757;
          border-radius: 50%;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
          100% { opacity: 1; transform: scale(1); }
        }
        .media-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }
        .media-card {
          padding: 0;
          overflow: hidden;
        }
        .media-card img {
          width: 100%;
          height: 200px;
          object-fit: cover;
          border-bottom: 1px solid var(--border);
        }
        .media-info {
          padding: 16px;
        }
        .empty-media {
          padding: 40px;
          text-align: center;
          border: 1px dashed var(--border);
          border-radius: 12px;
          color: var(--text-muted);
          font-style: italic;
        }
        @keyframes skeleton-blink {
          0% { opacity: 0.1; }
          50% { opacity: 0.3; }
          100% { opacity: 0.1; }
        }
        .skeleton-title { height: 32px; width: 60%; background: var(--text-muted); border-radius: 4px; animation: skeleton-blink 1.5s infinite; margin-bottom: 24px; }
        .skeleton-text { height: 16px; width: 100%; background: var(--text-muted); border-radius: 4px; animation: skeleton-blink 1.5s infinite; margin-bottom: 12px; }
      `}</style>
    </div>
  )
}
