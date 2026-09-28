import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { ApiError, api } from './api.ts'
import type { Session } from './types.ts'

const STORAGE_KEY = 'petrole.session'

interface AuthContextValue {
  session: Session | null
  login: (session: Session) => void
  logout: () => void
  updateProfil: (profil: Session['profil']) => void
  request: <T>(path: string, options?: RequestInit) => Promise<T>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readSession(): Session | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Session
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(readSession)

  const value = useMemo<AuthContextValue>(() => {
    const login = (next: Session) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      setSession(next)
    }
    const logout = () => {
      localStorage.removeItem(STORAGE_KEY)
      setSession(null)
    }
    const updateProfil = (profil: Session['profil']) => {
      setSession((current) => {
        if (!current) return current
        const next = { ...current, profil }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        return next
      })
    }
    const request = async <T,>(path: string, options: RequestInit = {}) => {
      try {
        return await api<T>(path, options, session?.accessToken)
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) logout()
        throw error
      }
    }
    return { session, login, logout, updateProfil, request }
  }, [session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth doit être utilisé dans AuthProvider')
  return value
}
