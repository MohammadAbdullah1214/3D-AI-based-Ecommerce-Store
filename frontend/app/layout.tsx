import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { StoreProvider } from "@/store/provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "TriCart - Modern E-Commerce Store",
  description:
    "Shop the latest trends, electronics, home goods, and more with our easy-to-use platform and secure checkout.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <StoreProvider>
          <div className="flex flex-col min-h-screen">{children}</div>
          <Toaster />
        </StoreProvider>
      </body>
    </html>
  )
}
