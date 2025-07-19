"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Provider } from "react-redux"
import { store } from "./index"
import { ThemeProvider } from "../components/theme-provider"
import { useGetMeQuery } from "./services/authApi"
import { useSelector } from "react-redux"

// Component to initialize authentication
function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useSelector((state: any) => state.auth)
  
  // Only fetch user data if we have a token (isAuthenticated is true)
  const { isLoading } = useGetMeQuery(undefined, {
    skip: !isAuthenticated,
  })

  // Show loading state while fetching user data
  if (isAuthenticated && isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#1D212D] via-[#2A2F3A] to-[#1D212D]">
        <div className="relative w-24 h-24">
          <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-t-[#F3C998] border-r-transparent border-b-[#F3C998]/50 border-l-transparent animate-spin"></div>
          <div className="absolute top-2 left-2 w-20 h-20 rounded-full border-4 border-t-transparent border-r-[#F3C998]/70 border-b-transparent border-l-[#F3C998] animate-spin"></div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch by only rendering children after mount
  return (
    <Provider store={store}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {mounted ? <AuthInitializer>{children}</AuthInitializer> : <div style={{ visibility: "hidden" }}>{children}</div>}
      </ThemeProvider>
    </Provider>
  )
}
