import { createContext, useContext, useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }){
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
        try {
          const res = await apiFetch('/auth/me');
          setUser(res.user);
        } catch (e) {
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    }
    init();
  }, []);

  const login = async (email, password) => {
    const res = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    if (res && res.token) {
      localStorage.setItem('token', res.token);
      setUser(res.user);
    }
    return res;
  }

  const register = async (email, password) => {
    const res = await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) });
    if (res && res.token) {
      localStorage.setItem('token', res.token);
      setUser(res.user);
    }
    return res;
  }

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
