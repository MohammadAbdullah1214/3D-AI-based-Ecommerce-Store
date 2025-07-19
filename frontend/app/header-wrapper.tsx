"use client"

import type React from "react"
import Header from "@/components/layout/header"
import AuthProvider from "./auth-provider"

export default function HeaderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen">
        <Header />
        {children}
      </div>
    </AuthProvider>
  )
}
