"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Mail, ArrowLeft, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")
  
  const [status, setStatus] = useState<"loading" | "success" | "error" | "expired">("loading")
  const [message, setMessage] = useState("")
  const [isResending, setIsResending] = useState(false)

  useEffect(() => {
    if (token) {
      verifyEmail(token)
    } else {
      setStatus("error")
      setMessage("No verification token provided")
    }
  }, [token])

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await fetch("/api/auth/verify-email/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: verificationToken }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus("success")
        setMessage(data.message || "Email verified successfully!")
      } else {
        if (data.error?.includes("expired")) {
          setStatus("expired")
          setMessage("Verification link has expired. Please request a new one.")
        } else {
          setStatus("error")
          setMessage(data.error || "Failed to verify email")
        }
      }
    } catch (error) {
      setStatus("error")
      setMessage("Network error. Please try again.")
    }
  }

  const resendVerification = async () => {
    setIsResending(true)
    try {
      // Get email from localStorage or prompt user
      const email = localStorage.getItem("pendingVerificationEmail")
      
      if (!email) {
        setMessage("Please enter your email address to resend verification")
        setIsResending(false)
        return
      }

      const response = await fetch("/api/auth/resend-verification/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage("Verification email sent successfully! Please check your inbox.")
      } else {
        setMessage(data.error || "Failed to resend verification email")
      }
    } catch (error) {
      setMessage("Network error. Please try again.")
    } finally {
      setIsResending(false)
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-12 w-12 text-green-500" />
      case "error":
      case "expired":
        return <XCircle className="h-12 w-12 text-red-500" />
      default:
        return <Mail className="h-12 w-12 text-blue-500 animate-pulse" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case "success":
        return "bg-green-500/20 text-green-300 border-green-500/30"
      case "error":
      case "expired":
        return "bg-red-500/20 text-red-300 border-red-500/30"
      default:
        return "bg-blue-500/20 text-blue-300 border-blue-500/30"
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#1D212D] via-[#2A2F3A] to-[#1D212D] relative flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="fixed inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #F3C998 0%, transparent 50%),
                            radial-gradient(circle at 75% 75%, #F3C998 0%, transparent 50%)`,
          }}
        ></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              {getStatusIcon()}
            </div>
            <CardTitle className="text-white text-2xl font-bold">
              Email Verification
            </CardTitle>
            <CardDescription className="text-gray-300">
              {status === "loading" && "Verifying your email address..."}
              {status === "success" && "Your email has been verified successfully!"}
              {status === "error" && "There was an error verifying your email"}
              {status === "expired" && "Your verification link has expired"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {status === "loading" && (
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F3C998] mx-auto mb-4"></div>
                <p className="text-gray-300">Please wait while we verify your email...</p>
              </div>
            )}

            {status === "success" && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-green-300 text-center">{message}</p>
                </div>
                <Button
                  onClick={() => router.push("/login")}
                  className="w-full bg-[#F3C998] hover:bg-[#F3C998]/90 text-[#1D212D] font-semibold"
                >
                  Continue to Login
                </Button>
              </div>
            )}

            {status === "error" && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-red-300 text-center">{message}</p>
                </div>
                <div className="flex space-x-3">
                  <Button
                    onClick={resendVerification}
                    disabled={isResending}
                    variant="outline"
                    className="flex-1 border-[#F3C998]/30 text-[#F3C998] hover:bg-[#F3C998]/10"
                  >
                    {isResending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Mail className="h-4 w-4 mr-2" />
                    )}
                    Resend Email
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="flex-1 border-white/30 text-white hover:bg-white/10"
                  >
                    <Link href="/register">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Register
                    </Link>
                  </Button>
                </div>
              </div>
            )}

            {status === "expired" && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-red-300 text-center">{message}</p>
                </div>
                <div className="flex space-x-3">
                  <Button
                    onClick={resendVerification}
                    disabled={isResending}
                    className="flex-1 bg-[#F3C998] hover:bg-[#F3C998]/90 text-[#1D212D] font-semibold"
                  >
                    {isResending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Mail className="h-4 w-4 mr-2" />
                    )}
                    Send New Link
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="flex-1 border-white/30 text-white hover:bg-white/10"
                  >
                    <Link href="/register">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Register
                    </Link>
                  </Button>
                </div>
              </div>
            )}

            <div className="text-center">
              <Badge className={`px-3 py-1 ${getStatusColor()}`}>
                {status === "loading" && "Verifying..."}
                {status === "success" && "Verified"}
                {status === "error" && "Error"}
                {status === "expired" && "Expired"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
} 