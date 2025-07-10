"use client"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps as NextThemesProviderProps } from "next-themes/dist/types"

export function ThemeProvider({ children, ...props }: NextThemesProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}