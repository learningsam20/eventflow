import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import SimulatorPage from './pages/SimulatorPage'
import ConciergeChatPage from './pages/ConciergeChat'
import HeatmapPage from './pages/HeatmapPage'
import AnalyticsPage from './pages/AnalyticsPage'
import TicketsPage from './pages/TicketsPage'
import OrdersPage from './pages/OrdersPage'
import NarrativePage from './pages/NarrativePage'
import SettingsPage from './pages/SettingsPage'

function ProtectedRoute({ children, managerOnly = false }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh', 
      background: 'var(--bg-main)',
      color: 'var(--text-main)' 
    }}>
      <img src="/favicon.png" alt="EventFlow" style={{ width: 64, height: 64, borderRadius: 16, marginBottom: 24, animation: 'pulse 2s infinite' }} />
      <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '0.1em' }}>EVENTFLOW</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Initializing Intelligence...</div>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (managerOnly && user.role !== 'event_manager') return <Navigate to="/dashboard" replace />
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/heatmap" element={<HeatmapPage />} />
        <Route path="/simulator" element={<SimulatorPage />} />
        <Route path="/concierge" element={<ConciergeChatPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/tickets" element={<TicketsPage />} />
        <Route path="/narrative" element={<NarrativePage />} />
        <Route path="/analytics" element={<ProtectedRoute managerOnly><AnalyticsPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute managerOnly><SettingsPage /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <AppRoutes />
        </ErrorBoundary>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(13,19,32,0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#f0f4ff',
              backdropFilter: 'blur(16px)',
              fontFamily: 'Outfit, sans-serif',
              fontSize: '14px',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}
