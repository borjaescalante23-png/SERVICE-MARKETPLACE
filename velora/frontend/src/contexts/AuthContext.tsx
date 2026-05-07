import React, { createContext, useContext, useState, useEffect } from 'react'
import { User } from '../types'
import { authApi } from '../services/api'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: { firstName: string; lastName: string; email: string; password: string }) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('velora_token')
    const savedUser = localStorage.getItem('velora_user')
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch {
        localStorage.removeItem('velora_user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password })
    const { accessToken, refreshToken, user } = res.data
    localStorage.setItem('velora_token', accessToken)
    localStorage.setItem('velora_refresh_token', refreshToken)
    localStorage.setItem('velora_user', JSON.stringify(user))
    setUser(user)
  }

  const register = async (data: { firstName: string; lastName: string; email: string; password: string }) => {
    const res = await authApi.register(data)
    const { accessToken, refreshToken, user } = res.data
    localStorage.setItem('velora_token', accessToken)
    localStorage.setItem('velora_refresh_token', refreshToken)
    localStorage.setItem('velora_user', JSON.stringify(user))
    setUser(user)
  }

  const logout = () => {
    localStorage.removeItem('velora_token')
    localStorage.removeItem('velora_refresh_token')
    localStorage.removeItem('velora_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
