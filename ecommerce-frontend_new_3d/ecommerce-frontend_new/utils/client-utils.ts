"use client"

import { useEffect, useState } from "react"

// Use this hook to safely render components that need browser APIs
export function useHasMounted() {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  return hasMounted
}

// Use this to safely access window/document
export const isBrowser = typeof window !== "undefined"
