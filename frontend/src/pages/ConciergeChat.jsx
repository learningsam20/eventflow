import React, { useState, useRef, useEffect } from 'react'
import api from '../api/client'
import Markdown from 'markdown-to-jsx'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { MessageSquare, Send, Plus, History, Info, MapPin } from 'lucide-react'

const QUICK_PROMPTS = [
  "How do I get to Gate 7 from Section 23?",
  "What's the fastest route to Food Court 2?",
  "Where is the nearest medical bay?",
  "How long is the queue at the main entrance?",
]

function ChatMessage({ msg }) {
  const isUser = msg.role === 'user'
  const time = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', marginBottom: 4 }} className={msg.role}>
      <div style={{ display: 'flex', gap: 12, maxWidth: '85%', flexDirection: isUser ? 'row-reverse' : 'row' }}>
        {!isUser && (
          <div style={{
            width: 36, height: 36, borderRadius: '50%', background: 'var(--primary-dim)',
            border: '1px solid rgba(108,99,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, flexShrink: 0
          }}>🤖</div>
        )}
        <div>
          <div className={`chat-bubble ${msg.role}`}>
            <Markdown>{msg.content}</Markdown>
          </div>
          {msg.sources?.length > 0 && (
            <div className="chat-sources">
              {msg.sources.map((s, i) => (
                <span key={i} className="chat-source-tag">📚 {s}</span>
              ))}
            </div>
          )}
          <div className="message-meta">
             <span>{time}</span>
             {!isUser && <span>• Gemini AI</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ConciergeChat() {
  const { user } = useAuth()
  const [activeEvent, setActiveEvent] = useState(null)
  const [messages, setMessages] = useState([])
  const [history, setHistory] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionLoading, setSessionLoading] = useState(true)
  const bottomRef = useRef(null)

  async function fetchActiveEvent() {
    try {
      const res = await api.get('/api/events')
      if (res.data && Array.isArray(res.data)) {
        const live = res.data.find(e => e.status === 'live') || res.data[0]
        setActiveEvent(live)
      }
    } catch (err) {
      console.error('Failed to fetch events', err)
    }
  }

  async function fetchHistory() {
    try {
      const res = await api.get('/api/ai/chat-history')
      const chatHistory = Array.isArray(res.data) ? res.data : []
      setHistory(chatHistory)
      
      if (chatHistory.length > 0) {
        setMessages(chatHistory)
      } else {
        const firstName = user?.full_name ? user.full_name.split(' ')[0] : 'there'
        setMessages([{
          role: 'assistant',
          content: `👋 Hi ${firstName}! I'm your EventFlow AI Concierge. I can help you navigate the venue, check wait times, or report incidents. How can I help?`,
          timestamp: new Date().toISOString()
        }])
      }
    } catch (err) {
      console.error('Failed to load chat history', err)
    } finally {
      setSessionLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
    fetchActiveEvent()
  }, [])

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, loading])

  async function sendMessage(text = null) {
    const msg = (text || input || '').trim()
    if (!msg) return

    const userMsg = { 
      role: 'user', 
      content: msg, 
      timestamp: new Date().toISOString() 
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      let sensorContext = null
      if (activeEvent?.id) {
        try {
          const sensorRes = await api.get(`/api/events/${activeEvent.id}/heatmap`)
          sensorContext = { zones: sensorRes.data }
        } catch (sErr) {
          console.warn('Could not fetch sensor context', sErr)
        }
      }

      const localHistory = Array.isArray(messages) ? messages.slice(-10).map(m => ({ role: m.role, content: m.content })) : []
      const res = await api.post('/api/ai/chat', {
        message: msg,
        history: localHistory,
        event_id: activeEvent?.id,
        sensor_context: sensorContext
      })
      
      if (res.data) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: res.data.response || "I couldn't generate a response. Please try again.",
          sources: res.data.sources || [],
          timestamp: new Date().toISOString()
        }])
      }
    } catch (err) {
      toast.error('AI Link Failed')
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ I\'m experiencing a brief connection issue. Please try again!',
        timestamp: new Date().toISOString()
      }])
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="concierge-page">
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title flex items-center gap-3">
             <MessageSquare size={28} color="var(--primary)" /> AI Concierge
          </h1>
          <p className="page-subtitle">Real-time venue intelligence & fan assistance</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm" onClick={() => setMessages([])}>
            <Plus size={16} /> New Chat
          </button>
        </div>
      </div>

      <div className="chat-layout">
        <aside className="chat-history-sidebar">
          <div className="chat-history-header flex items-center gap-2">
            <History size={16} /> Previous Sessions
          </div>
          <div className="chat-session-list">
            {sessionLoading ? (
               <div style={{ padding: 20, textAlign: 'center' }} className="spinner" />
            ) : history.length > 0 ? (
              <div className="chat-session-item active">
                <div className="session-title">Current Support Session</div>
                <div className="session-time">{new Date().toLocaleDateString()}</div>
              </div>
            ) : (
              <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                No past sessions found.
              </div>
            )}
          </div>
          <div style={{ padding: 20, marginTop: 'auto', borderTop: '1px solid var(--border)' }}>
             <div className="glass-card" style={{ padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                   <Info size={14} color="var(--primary)" />
                   <span style={{ fontSize: 11, fontWeight: 700 }}>AI TIP</span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  You can ask about gate wait times or report stadium maintenance directly here.
                </p>
             </div>
          </div>
        </aside>

        <main className="chat-main">
          <div className="chat-messages">
             {messages.map((m, i) => <ChatMessage key={i} msg={m} />)}
             {loading && (
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ 
                    width: 36, height: 36, borderRadius: '50%', background: 'var(--primary-dim)', 
                    border: '1px solid rgba(108,99,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' 
                  }}>🤖</div>
                  <div className="typing-indicator" style={{ background: 'var(--bg-input)' }}>
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                  </div>
                </div>
             )}
             <div ref={bottomRef} />
          </div>

          <div style={{ padding: '0 24px' }}>
             <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12 }}>
                {QUICK_PROMPTS.map(p => (
                   <button key={p} className="btn btn-ghost btn-sm" style={{ whiteSpace: 'nowrap', fontSize: 11, borderRadius: 20 }} onClick={() => sendMessage(p)}>
                      {p}
                   </button>
                ))}
             </div>
          </div>

          <div className="chat-input-area" style={{ background: 'transparent', borderTop: '1px solid var(--border)', padding: 24 }}>
            <textarea
              className="chat-input"
              placeholder="How can I help you today?"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
            />
            <button
              className="btn btn-primary"
              style={{ width: 48, height: 48, borderRadius: 12, padding: 0 }}
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
            >
              {loading ? <span className="spinner" /> : <Send size={20} />}
            </button>
          </div>
        </main>
      </div>

      <style>{`
        .concierge-page {
          max-width: 1400px;
          margin: 0 auto;
        }
      `}</style>
    </div>
  )
}
