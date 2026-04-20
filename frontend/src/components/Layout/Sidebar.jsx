import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const NAV_ITEMS = [
  { to: '/dashboard', icon: '⚡', label: 'Dashboard' },
  { to: '/heatmap', icon: '🗺️', label: 'Live Heatmap' },
  { to: '/simulator', icon: '🎮', label: 'Simulator' },
  { to: '/concierge', icon: '🤖', label: 'AI Concierge' },
  { to: '/orders', icon: '🛒', label: 'Orders' },
  { to: '/tickets', icon: '🎫', label: 'My Tickets' },
  { to: '/narrative', icon: '🖋️', label: 'Event Narrative' },
]

const MANAGER_NAV = [
  { to: '/analytics', icon: '📊', label: 'Analytics' },
  { to: '/settings', icon: '⚙️', label: 'Settings' },
]

export default function Sidebar() {
  const { user, logout, isManager } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user?.username?.[0]?.toUpperCase() || 'U'

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <img src="/favicon.png" alt="EventFlow Logo" style={{ width: 32, height: 32, borderRadius: 8, marginBottom: 8 }} />
        <div className="logo-text">EventFlow</div>
        <div className="logo-sub">AI Event Intelligence</div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav" role="navigation" aria-label="Main Navigation">
        <div className="nav-section-label">Main</div>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            aria-label={item.label}
          >
            <span className="nav-icon" aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}

        {isManager && (
          <>
            <div className="nav-section-label" style={{ marginTop: 12 }}>Manager</div>
            {MANAGER_NAV.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                aria-label={item.label}
              >
                <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="sidebar-footer">
        <div className="user-tile">
          <div
            className="user-avatar"
            style={{ background: user?.avatar_color || '#6c63ff', color: '#fff' }}
          >
            {initials}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.full_name || user?.username}</div>
            <div className="user-role">
              {isManager ? '🏆 Event Manager' : '🎫 Fan'}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="btn btn-ghost btn-sm"
          style={{ width: '100%', marginTop: 8, justifyContent: 'center' }}
        >
          🚪 Logout
        </button>
      </div>
    </aside>
  )
}
