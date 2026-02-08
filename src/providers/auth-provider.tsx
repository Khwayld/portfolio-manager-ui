import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import { api, ApiError } from "@/api/client"
import type { AuthUser } from "@/types"

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function clearAuth() {
  localStorage.removeItem("access_token")
  localStorage.removeItem("refresh_token")
  localStorage.removeItem("user_email")
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function restoreSession() {
      const token = localStorage.getItem("access_token")
      if (!token) {
        setLoading(false)
        return
      }

      const email = localStorage.getItem("user_email") || ""

      try {
        // Try fetching profile with current token
        const profile = await api.get<{ id: string; display_name: string | null; base_currency: string }>(
          "/api/auth/profile"
        )
        if (!cancelled) setUser({ id: profile.id, email })
      } catch (err) {
        // Only try refresh if it was a 401 (token expired)
        if (err instanceof ApiError && err.status === 401) {
          const refreshToken = localStorage.getItem("refresh_token")
          if (refreshToken) {
            try {
              const data = await api.post<{ access_token: string; refresh_token: string }>(
                "/api/auth/refresh",
                { refreshToken }
              )
              localStorage.setItem("access_token", data.access_token)
              localStorage.setItem("refresh_token", data.refresh_token)
              const profile = await api.get<{ id: string }>(
                "/api/auth/profile"
              )
              if (!cancelled) setUser({ id: profile.id, email })
            } catch {
              // Refresh also failed — clear everything
              clearAuth()
            }
          } else {
            clearAuth()
          }
        } else {
          // Non-auth error (e.g., profile table missing, network error)
          // Still consider user logged in — we have a valid token
          // Use the stored user ID from the token if possible
          if (!cancelled) setUser({ id: "unknown", email })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    restoreSession()
    return () => { cancelled = true }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const data = await api.post<{
      access_token: string
      refresh_token: string
      user: { id: string; email: string }
    }>("/api/auth/login", { email, password })
    localStorage.setItem("access_token", data.access_token)
    localStorage.setItem("refresh_token", data.refresh_token)
    localStorage.setItem("user_email", data.user.email)
    setUser(data.user)
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    const data = await api.post<{
      access_token: string
      refresh_token: string
      user: { id: string; email: string }
    }>("/api/auth/register", { email, password })
    localStorage.setItem("access_token", data.access_token)
    localStorage.setItem("refresh_token", data.refresh_token)
    localStorage.setItem("user_email", data.user.email)
    setUser(data.user)
  }, [])

  const signOut = useCallback(async () => {
    try {
      await api.post("/api/auth/logout")
    } catch {
      // best effort
    }
    clearAuth()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
