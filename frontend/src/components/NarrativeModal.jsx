import React from 'react'
import { useNavigate } from 'react-router-dom'
import Marker from 'markdown-to-jsx'

export default function NarrativeModal({ data, onClose }) {
  const navigate = useNavigate()
  if (!data) return null
  const { narrative, media, stats } = data

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: 0, overflow: 'hidden', maxWidth: 900, width: '95%' }}>
        
        {/* Header with Background/Hero feel */}
        <div style={{ 
          background: 'linear-gradient(135deg, var(--primary), var(--accent))', 
          padding: '40px 40px 30px', 
          color: 'white',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', opacity: 0.9 }}>
              PREMIUM EVENT STORY
            </div>
            <span className="badge badge-success" style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(255,255,255,0.2)', border: 'none' }}>✨ LLM ANALYZED</span>
          </div>
          <h2 style={{ fontSize: 32, fontWeight: 900, margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
            Your Event Story: The Memoirs of {stats?.event_name || 'the Match'}
          </h2>
          <button onClick={onClose} style={{ 
            position: 'absolute', top: 20, right: 20, 
            background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
            width: 32, height: 32, borderRadius: '50%', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
          }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '75vh', overflowY: 'auto' }}>
          
          {/* Stats Bar */}
          {stats && (
            <div style={{ 
              display: 'flex', gap: 24, padding: '20px 40px', 
              background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' 
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Score</div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{stats.home_score} - {stats.away_score}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg Queue</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--success)' }}>{stats.avg_queue_time}m</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>NPS Score</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--warning)' }}>{stats.nps_score}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Throughput</div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{stats.throughput}/m</div>
              </div>
            </div>
          )}

          <div style={{ padding: '40px' }}>
            {/* Media Gallery (Top) */}
            {media && media.length > 0 && (
              <div style={{ display: 'flex', gap: 12, overflowX: 'auto', marginBottom: 32, paddingBottom: 8 }} className="custom-scrollbar">
                {media.map((item, idx) => (
                  <div key={idx} style={{ flexShrink: 0, width: 220 }}>
                    <div style={{ 
                      width: '100%', height: 140, borderRadius: 12, background: 'var(--bg-card)', 
                      overflow: 'hidden', border: '1px solid var(--border)' 
                    }}>
                      <img src={item.url} alt={item.description} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, fontStyle: 'italic', lineHeight: 1.4 }}>
                      "{item.description}"
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Narrative Content */}
            <div className="journal-text" style={{ 
              whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: 17, 
              color: 'var(--text-secondary)', fontFamily: 'var(--font-serif)' 
            }}>
              <Marker>{narrative}</Marker>
            </div>
          </div>
        </div>
        
        <div style={{ padding: '20px 40px', background: 'var(--bg-main)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p className="text-xs text-muted" style={{ margin: 0 }}>
            This report was grounded in {media?.length || 0} stadium photos and real-time sensor metrics.
          </p>
          <button className="btn btn-primary btn-sm" onClick={() => { onClose(); navigate('/narrative') }}>
            View Visual Reel →
          </button>
        </div>
      </div>
    </div>
  )
}
