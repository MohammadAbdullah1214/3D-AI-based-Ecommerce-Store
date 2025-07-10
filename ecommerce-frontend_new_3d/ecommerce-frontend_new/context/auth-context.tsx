"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import {
  type User,
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getCurrentUser,
  isAuthenticated,
} from "../services/authApi"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string, role?: string, address?: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      setIsLoading(true)

      if (isAuthenticated()) {
        try {
          const userData = await getCurrentUser()
          setUser(userData)
        } catch (error) {
          console.error("Failed to load user:", error)
          setUser(null)
        }
      } else {
        setUser(null)
      }

      setIsLoading(false)
    }

    loadUser()
  }, [])

  const login = async (username: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await apiLogin({ username, password })
      setUser(response.user)
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (username: string, email: string, password: string, role = "customer", address = "") => {
    setIsLoading(true)
    try {
      await apiRegister({
        username,
        email,
        password,
        role: role as "buyer" | "customer" | "seller",
        address,
      })
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    apiLogout()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
