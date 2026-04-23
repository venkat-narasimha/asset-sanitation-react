import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSession, login as apiLogin, logout as apiLogout } from '../api/auth.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const redirectToLogin = useCallback(() => {
    navigate('/login')
  }, [navigate])

  useEffect(() => {
    checkSession()
  }, [])

  async function checkSession() {
    try {
      const userInfo = await getSession()
      if (userInfo) setUser(userInfo)
      else redirectToLogin()
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  async function doLogin(username, password) {
    const userInfo = await apiLogin(username, password)
    setUser(userInfo)
  }

  function doLogout() {
    // auth.js logout handles token cleanup + redirect
    apiLogout()
  }

  return (
    <AuthContext.Provider value={{ user, loading, login: doLogin, logout: doLogout, redirectToLogin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
