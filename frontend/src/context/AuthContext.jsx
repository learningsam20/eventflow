import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem('ef_token')
    const savedUser = localStorage.getItem('ef_user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
      api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`
    }
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    const form = new URLSearchParams()
    form.append('username', username)
    form.append('password', password)
    const res = await api.post('/api/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    const { access_token, user: userData } = res.data
    setToken(access_token)
    setUser(userData)
    localStorage.setItem('ef_token', access_token)
    localStorage.setItem('ef_user', JSON.stringify(userData))
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
    return userData
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('ef_token')
    localStorage.removeItem('ef_user')
    delete api.defaults.headers.common['Authorization']
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, isManager: user?.role === 'event_manager' }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
