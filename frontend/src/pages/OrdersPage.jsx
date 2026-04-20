import React, { useEffect, useState } from 'react'
import api from '../api/client'
import toast from 'react-hot-toast'

const STATUS_COLORS = {
  pending: { color: 'var(--warning)', label: '⏳ Pending' },
  preparing: { color: 'var(--accent)', label: '👨‍🍳 Preparing' },
  ready: { color: 'var(--success)', label: '✅ Ready!' },
  collected: { color: 'var(--text-muted)', label: '📦 Collected' },
}

function MenuItemCard({ item, selected, onQtyChange }) {
  const qty = selected?.qty || 0
  return (
    <div className="glass-card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 28 }}>{item.emoji}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.category}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 14 }}>
          £{item.price.toFixed(2)}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <button
            className="btn btn-secondary btn-sm"
            style={{ padding: '2px 8px', minWidth: 28 }}
            onClick={() => onQtyChange(item.id, qty - 1)}
            disabled={qty === 0}
          >−</button>
          <span style={{ fontFamily: 'var(--font-mono)', minWidth: 20, textAlign: 'center', fontWeight: 700 }}>
            {qty}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            style={{ padding: '2px 8px', minWidth: 28 }}
            onClick={() => onQtyChange(item.id, qty + 1)}
          >+</button>
        </div>
      </div>
    </div>
  )
}

function OrderCard({ order }) {
  const { color, label } = STATUS_COLORS[order.status] || STATUS_COLORS.pending
  const readyTime = order.pickup_time ? new Date(order.pickup_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null
  return (
    <div className="glass-card" style={{ padding: 20 }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>
            #{order.qr_code}
          </div>
          <div className="text-xs text-muted">{order.pickup_zone}</div>
        </div>
        <div>
          <span style={{ color, fontWeight: 700, fontSize: 13 }}>{label}</span>
          {readyTime && <div className="text-xs text-muted">Ready: {readyTime}</div>}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
        {order.items?.map((item, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span>{item.emoji} {item.name} × {item.qty}</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>£{(item.price * item.qty).toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between" style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
        <span className="text-sm font-bold">Total</span>
        <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>
          £{order.total_amount.toFixed(2)}
        </span>
      </div>
      {order.status === 'ready' && (
        <div style={{
          marginTop: 12, padding: 12, borderRadius: 10,
          background: 'var(--success-dim)', border: '1px solid rgba(0,255,157,0.3)',
          textAlign: 'center',
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 800, color: 'var(--success)', letterSpacing: '0.1em' }}>
            {order.qr_code}
          </div>
          <div className="text-xs" style={{ color: 'var(--success)', marginTop: 4 }}>
            Show this code at Counter 3A — Express Lane
          </div>
        </div>
      )}
    </div>
  )
}

export default function OrdersPage() {
  const [menu, setMenu] = useState([])
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [cart, setCart] = useState({})
  const [orders, setOrders] = useState([])
  const [placing, setPlacing] = useState(false)
  const [pickupZone, setPickupZone] = useState('Concourse A')
  const [tab, setTab] = useState('menu')

  useEffect(() => {
    const load = async () => {
      try {
        const [menuRes, evRes, ordRes] = await Promise.all([
          api.get('/api/orders/menu'),
          api.get('/api/events'),
          api.get('/api/orders/my'),
        ])
        setMenu(menuRes.data)
        setEvents(evRes.data)
        if (evRes.data.length > 0) setSelectedEvent(evRes.data[0])
        setOrders(ordRes.data)
      } catch (e) { console.error(e) }
    }
    load()
  }, [])

  const updateCart = (itemId, qty) => {
    setCart(prev => {
      if (qty <= 0) {
        const next = { ...prev }
        delete next[itemId]
        return next
      }
      return { ...prev, [itemId]: { qty } }
    })
  }

  const cartTotal = menu
    .filter(item => cart[item.id])
    .reduce((sum, item) => sum + item.price * cart[item.id].qty, 0)

  const cartCount = Object.values(cart).reduce((s, v) => s + v.qty, 0)

  const placeOrder = async () => {
    if (!selectedEvent || Object.keys(cart).length === 0) return
    setPlacing(true)
    try {
      const items = Object.entries(cart).map(([id, { qty }]) => ({ id: parseInt(id), qty }))
      const res = await api.post('/api/orders', {
        event_id: selectedEvent.id,
        items,
        pickup_zone: pickupZone,
      })
      setOrders(prev => [res.data, ...prev])
      setCart({})
      setTab('orders')
      toast.success(`Order placed! QR: ${res.data.qr_code} 🎉`)
    } catch { toast.error('Failed to place order') } finally { setPlacing(false) }
  }

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">🛒 Smart Ordering</h1>
            <p className="page-subtitle">Skip the queue — order online, collect with QR code</p>
          </div>
          <div className="flex gap-2">
            <button className={`btn ${tab === 'menu' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setTab('menu')}>Menu</button>
            <button className={`btn ${tab === 'orders' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setTab('orders')}>
              My Orders {orders.length > 0 && `(${orders.length})`}
            </button>
          </div>
        </div>
      </div>

      <div className="page-body">
        {tab === 'menu' ? (
          <div className="grid-2 gap-6">
            {/* Menu */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>Stadium Menu</h3>
                <select
                  className="input-field"
                  style={{ width: 'auto', padding: '6px 12px', fontSize: 12 }}
                  value={selectedEvent?.id || ''}
                  onChange={e => setSelectedEvent(events.find(ev => ev.id === parseInt(e.target.value)))}
                >
                  {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name.slice(0, 30)}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {menu.map(item => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    selected={cart[item.id]}
                    onQtyChange={updateCart}
                  />
                ))}
              </div>
            </div>

            {/* Cart */}
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Your Order</h3>
              <div className="glass-card" style={{ padding: 24 }}>
                {cartCount === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
                    <p>Your cart is empty. Add items from the menu!</p>
                  </div>
                ) : (
                  <>
                    {menu.filter(item => cart[item.id]).map(item => (
                      <div key={item.id} className="flex items-center justify-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontSize: 14 }}>{item.emoji} {item.name} × {cart[item.id].qty}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
                          £{(item.price * cart[item.id].qty).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between" style={{ padding: '14px 0 0', fontWeight: 800, fontSize: 18 }}>
                      <span>Total</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>£{cartTotal.toFixed(2)}</span>
                    </div>

                    <div className="input-group mt-4">
                      <label className="input-label">Pickup Zone</label>
                      <select
                        className="input-field"
                        value={pickupZone}
                        onChange={e => setPickupZone(e.target.value)}
                      >
                        {['Concourse A', 'Concourse B', 'Food Court 1', 'Food Court 2'].map(z => (
                          <option key={z} value={z}>{z}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ padding: 14, borderRadius: 10, background: 'var(--success-dim)', border: '1px solid rgba(0,255,157,0.2)', marginBottom: 16 }}>
                      <div className="text-xs" style={{ color: 'var(--success)', fontWeight: 600 }}>⚡ Smart Timing</div>
                      <div className="text-xs text-muted mt-1">
                        AI estimates your order will be ready in approx. <strong style={{ color: 'var(--success)' }}>12 minutes</strong> — pickup via QR express lane.
                      </div>
                    </div>

                    <button
                      className="btn btn-primary btn-lg"
                      style={{ width: '100%' }}
                      onClick={placeOrder}
                      disabled={placing}
                    >
                      {placing ? <><span className="spinner" /> Placing order...</> : `🚀 Place Order · £${cartTotal.toFixed(2)}`}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>My Orders</h3>
            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>📭</div>
                <p>No orders yet. Go to Menu to place your first order!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                {orders.map(order => <OrderCard key={order.id} order={order} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
