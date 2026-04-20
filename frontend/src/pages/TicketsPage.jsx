import React, { useEffect, useState } from 'react'
import api from '../api/client'
import toast from 'react-hot-toast'
import NarrativeModal from '../components/NarrativeModal'

function TicketCard({ ticket, onClick }) {
  const isPast = ticket.status === 'ended' || ticket.status === 'past'

  return (
    <div 
      className={`ticket-card ${isPast ? 'past' : ''}`} 
      onClick={() => onClick(ticket)}
      style={{ cursor: 'pointer' }}
    >
      <div className="ticket-main">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="badge badge-accent" style={{ fontSize: 10, letterSpacing: '0.1em' }}>
              {ticket.sport_type?.toUpperCase() || 'EVENT'}
            </span>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>{ticket.event_name}</h3>
            <p className="text-xs text-muted">📍 {ticket.venue}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>{ticket.event_date}</div>
            <div className="text-xs text-muted">Starts 19:45</div>
          </div>
        </div>

        <div className="ticket-details-grid">
          <div>
            <div className="ticket-label">Seat</div>
            <div className="ticket-value">{ticket.seat_info}</div>
          </div>
          <div>
            <div className="ticket-label">Ticket Code</div>
            <div className="ticket-value" style={{ fontFamily: 'var(--font-mono)' }}>{ticket.ticket_code}</div>
          </div>
          <div>
            <div className="ticket-label">Gate</div>
            <div className="ticket-value">North Gate 3</div>
          </div>
        </div>

        {ticket.ai_summary && (
          <div className="ticket-ai-summary">
            <div className="flex items-center gap-2 mb-2">
              <span style={{ fontSize: 14 }}>🤖</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>AI Event Insight</span>
            </div>
            <p>{ticket.ai_summary}</p>
            
            {isPast && (
              <div style={{ display: 'flex', gap: 16, marginTop: 12, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg Queue</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--success)' }}>8.4m</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>NPS</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--warning)' }}>82</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Orders</div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>4.8k</div>
                </div>
              </div>
            )}

            <div style={{ marginTop: 12, fontSize: 10, fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ✨ Click ticket for full story report
            </div>
          </div>
        )}
      </div>

      <div className="ticket-stub">
        <div className="ticket-stub-inner">
          <div className="qr-box">
             {/* Simulated QR Code */}
             <div style={{ width: 80, height: 80, background: '#fff', padding: 4, borderRadius: 4 }}>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${ticket.ticket_code}`} 
                  alt="QR Code" 
                  style={{ width: '100%', height: '100%' }}
                />
             </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <div className="ticket-label" style={{ color: 'rgba(255,255,255,0.5)' }}>Price</div>
            <div className="ticket-value" style={{ fontSize: 16 }}>£{ticket.price_paid?.toFixed(2)}</div>
            <div className="text-xs" style={{ opacity: 0.6, marginTop: 4 }}>{ticket.payment_method}</div>
          </div>
          <div className="ticket-status-stamp">
             {isPast ? 'PAST' : ticket.status?.toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('upcoming')
  const [selectedNarrative, setSelectedNarrative] = useState(null)
  const [narrativeLoading, setNarrativeLoading] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/api/tickets/my')
        setTickets(res.data)
      } catch (e) {
        toast.error('Failed to load tickets')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  const handleTicketClick = async (ticket) => {
    setNarrativeLoading(true)
    try {
      const res = await api.get(`/api/analytics/event/${ticket.event_id}/narrative`)
      setSelectedNarrative(res.data)
    } catch (e) {
      toast.error('Could not load detailed report')
    } finally {
      setNarrativeLoading(false)
    }
  }

  const filtered = tickets.filter(t => {
    if (activeTab === 'upcoming') return t.status === 'upcoming' || t.status === 'live'
    return t.status === 'past' || t.status === 'ended'
  })

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">🎫 My Tickets</h1>
            <p className="page-subtitle">Manage your event access and personalized summaries</p>
          </div>
          <div className="flex gap-2">
             <button 
               className={`btn ${activeTab === 'upcoming' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
               onClick={() => setActiveTab('upcoming')}
             >
               Upcoming
             </button>
             <button 
               className={`btn ${activeTab === 'past' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
               onClick={() => setActiveTab('past')}
             >
               Past Events
             </button>
          </div>
        </div>
      </div>

      <div className="page-body">
        {loading ? (
          <div className="flex justify-center p-20">
            <div className="spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>🎟️</div>
            <h3>No {activeTab} tickets found</h3>
            <p className="text-muted">Once you purchase a ticket, it will appear here.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {filtered.map(ticket => (
              <TicketCard key={ticket.id} ticket={ticket} onClick={handleTicketClick} />
            ))}
          </div>
        )}
      </div>

      {selectedNarrative && (
        <NarrativeModal data={selectedNarrative} onClose={() => setSelectedNarrative(null)} />
      )}

      {narrativeLoading && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="spinner" style={{ width: 40, height: 40 }} />
        </div>
      )}

      <style>{`
        .ticket-card {
          display: flex;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 20px;
          overflow: hidden;
          position: relative;
          transition: transform 0.3s ease;
        }
        .ticket-card:hover {
          transform: translateY(-4px);
          border-color: var(--accent);
        }
        .ticket-card.past {
          opacity: 0.8;
          filter: grayscale(0.5);
        }
        .ticket-main {
          flex: 1;
          padding: 24px;
          border-right: 2px dashed var(--border);
          position: relative;
        }
        /* Top and bottom notches */
        .ticket-main::before, .ticket-main::after {
          content: '';
          position: absolute;
          right: -10px;
          width: 20px;
          height: 20px;
          background: var(--bg-main);
          border-radius: 50%;
          border: 1px solid var(--border);
          z-index: 2;
        }
        .ticket-main::before { top: -11px; }
        .ticket-main::after { bottom: -11px; }

        .ticket-stub {
          width: 200px;
          background: linear-gradient(135deg, rgba(108, 99, 255, 0.1), rgba(0, 212, 255, 0.1));
          padding: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        .ticket-stub-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .ticket-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-muted);
          margin-bottom: 4px;
        }
        .ticket-value {
          font-size: 14px;
          font-weight: 700;
        }
        .ticket-details-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid var(--border);
        }
        .ticket-ai-summary {
          margin-top: 24px;
          padding: 16px;
          background: var(--bg-secondary);
          border-radius: 12px;
          border-left: 4px solid var(--primary);
        }
        .ticket-ai-summary p {
          font-size: 13px;
          line-height: 1.6;
          color: var(--text-secondary);
          margin: 0;
        }
        .ticket-status-stamp {
          margin-top: 20px;
          border: 2px solid var(--accent);
          color: var(--accent);
          padding: 4px 12px;
          border-radius: 4px;
          font-weight: 900;
          font-size: 14px;
          transform: rotate(-12deg);
          letter-spacing: 2px;
        }
      `}</style>
    </div>
  )
}
