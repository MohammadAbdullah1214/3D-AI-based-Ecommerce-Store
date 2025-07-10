"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

interface FullscreenPortalProps {
  children: React.ReactNode
  isOpen: boolean
}

export default function FullscreenPortal({ children, isOpen }: FullscreenPortalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !isOpen) {
    return null
  }

  return createPortal(
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 z-[100]">{children}</div>,
    document.body,
  )
}
