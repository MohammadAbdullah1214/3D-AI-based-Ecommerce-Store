"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useLoginMutation } from "@/store/services/authApi"
import { useDispatch } from "react-redux"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react"
import { authSlice } from "@/store/slices/authSlice"
import HeaderWrapper from "@/app/header-wrapper"
import Footer from "@/components/layout/footer"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [emailVerificationRequired, setEmailVerificationRequired] = useState(false)
  const [pendingEmail, setPendingEmail] = useState<string>("")
  const [isResendingVerification, setIsResendingVerification] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useDispatch()
  const [login, { isLoading }] = useLoginMutation()

  // Check if user just registered
  useEffect(() => {
    if (searchParams?.get("registered") === "true") {
      setRegistrationSuccess(true)
      // Clear the success message after 5 seconds
      const timer = setTimeout(() => {
        setRegistrationSuccess(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      const result = await login({ username, password }).unwrap()
      // Store token in localStorage for persistence
      localStorage.setItem("token", result.access)
      localStorage.setItem("refreshToken", result.refresh)
      // Update Redux state
      dispatch(
        authSlice.actions.loginSuccess({
          user: result.user,
          access: result.access,
          refresh: result.refresh,
        }),
      )
      // Redirect to home page or dashboard
      const next = searchParams?.get("next") || "/dashboard"
      router.push(next)
    } catch (err: any) {
      console.error("API Error:", err)
      if (err.status === 401) {
        if (err.data?.email_verification_required) {
          setEmailVerificationRequired(true)
          setPendingEmail(err.data.email)
          setError("Please verify your email address before logging in.")
        } else {
          setError("Invalid username or password")
        }
      } else if (err.data?.detail) {
        setError(err.data.detail)
      } else {
        setError("Login failed. Please try again.")
      }
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const resendVerificationEmail = async () => {
    setIsResendingVerification(true)
    try {
      const response = await fetch("/api/auth/resend-verification/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail }),
      })

      const data = await response.json()

      if (response.ok) {
        setError("Verification email sent successfully! Please check your inbox.")
        setEmailVerificationRequired(false)
      } else {
        setError(data.error || "Failed to resend verification email")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setIsResendingVerification(false)
    }
  }

  return (
    <HeaderWrapper>
      <div
        className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-8"
        style={{ backgroundColor: "#1D212D" }}
      >
        {/* Elegant brand-colored background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Decorative circles and stars */}
          <div
            className="absolute top-20 left-20 w-4 h-4 rounded-full opacity-30"
            style={{ backgroundColor: "#F3C998" }}
          ></div>
          <div
            className="absolute top-32 right-32 w-2 h-2 rounded-full opacity-40"
            style={{ backgroundColor: "#F3C998" }}
          ></div>
          <div
            className="absolute bottom-40 left-40 w-3 h-3 rounded-full opacity-25"
            style={{ backgroundColor: "#F3C998" }}
          ></div>
          <div
            className="absolute top-1/2 right-20 w-6 h-6 rounded-full opacity-20"
            style={{ backgroundColor: "#F3C998" }}
          ></div>

          {/* Star shapes */}
          <div className="absolute top-24 right-24">
            <div
              className="w-3 h-3 opacity-30"
              style={{
                backgroundColor: "#F3C998",
                clipPath:
                  "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
              }}
            ></div>
          </div>
          <div className="absolute bottom-32 right-16">
            <div
              className="w-4 h-4 opacity-25"
              style={{
                backgroundColor: "#F3C998",
                clipPath:
                  "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
              }}
            ></div>
          </div>
        </div>

        {/* Left side illustrated elements */}
        <div className="absolute left-0 top-0 bottom-0 w-1/2 hidden lg:block overflow-hidden">
          {/* Shopping cart illustration */}
          <div className="absolute bottom-32 left-20">
            <div className="relative">
              {/* Cart body */}
              <div className="w-16 h-12 border-2 rounded-lg opacity-20" style={{ borderColor: "#F3C998" }}></div>
              {/* Cart handle */}
              <div
                className="absolute -left-2 top-2 w-6 h-8 border-2 border-l-0 rounded-r-lg opacity-20"
                style={{ borderColor: "#F3C998" }}
              ></div>
              {/* Cart wheels */}
              <div
                className="absolute -bottom-2 left-2 w-3 h-3 rounded-full opacity-30"
                style={{ backgroundColor: "#F3C998" }}
              ></div>
              <div
                className="absolute -bottom-2 right-2 w-3 h-3 rounded-full opacity-30"
                style={{ backgroundColor: "#F3C998" }}
              ></div>
              {/* Cart items */}
              <div className="absolute top-2 left-2 w-2 h-6 opacity-25" style={{ backgroundColor: "#F3C998" }}></div>
              <div className="absolute top-2 left-5 w-2 h-4 opacity-25" style={{ backgroundColor: "#F3C998" }}></div>
              <div className="absolute top-2 right-3 w-2 h-5 opacity-25" style={{ backgroundColor: "#F3C998" }}></div>
            </div>
          </div>

          {/* Abstract geometric shapes */}
          <div
            className="absolute bottom-20 left-32 w-12 h-12 opacity-10 transform rotate-45"
            style={{ backgroundColor: "#F3C998" }}
          ></div>
          <div
            className="absolute top-40 left-16 w-8 h-8 opacity-15 rounded-full"
            style={{ backgroundColor: "#F3C998" }}
          ></div>
        </div>

        {/* Right side illustrated elements */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden lg:block overflow-hidden">
          {/* TRI logo inspired elements */}
          <div className="absolute bottom-40 right-24">
            <div className="text-4xl font-bold opacity-10" style={{ color: "#F3C998" }}>
              TRI
            </div>
          </div>

          {/* Package/box illustration */}
          <div className="absolute bottom-32 right-32">
            <div className="w-12 h-10 border-2 rounded opacity-20" style={{ borderColor: "#F3C998" }}></div>
            <div className="absolute top-1 left-1 w-2 h-8 opacity-15" style={{ backgroundColor: "#F3C998" }}></div>
            <div className="absolute top-1 left-4 w-2 h-8 opacity-15" style={{ backgroundColor: "#F3C998" }}></div>
            <div className="absolute top-1 right-2 w-2 h-8 opacity-15" style={{ backgroundColor: "#F3C998" }}></div>
          </div>

          {/* Abstract shapes */}
          <div
            className="absolute top-32 right-20 w-10 h-10 opacity-10 rounded-full"
            style={{ backgroundColor: "#F3C998" }}
          ></div>
          <div
            className="absolute bottom-20 right-16 w-6 h-6 opacity-15 transform rotate-45"
            style={{ backgroundColor: "#F3C998" }}
          ></div>
        </div>

        <div className="w-full max-w-md relative z-10">
          <Card
            className="backdrop-blur-xl bg-white/5 border-white/10 shadow-2xl"
            style={{ boxShadow: `0 25px 50px -12px rgba(243, 201, 152, 0.1)` }}
          >
            <CardHeader className="space-y-4 pb-8">
              <div
                className="w-12 h-12 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4 mx-auto shadow-lg border border-white/20"
                style={{ backgroundColor: "#F3C998" }}
              >
                <div className="w-6 h-6 rounded-md" style={{ backgroundColor: "#1D212D" }}></div>
              </div>
              <CardTitle className="text-3xl font-bold text-center text-white drop-shadow-lg">Welcome Back</CardTitle>
              <CardDescription className="text-center text-white/80 text-base">
                Sign in to your account to continue shopping
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6 px-8">
                {registrationSuccess && (
                  <Alert className="bg-emerald-500/20 border-emerald-400/30 backdrop-blur-sm animate-in slide-in-from-top-2 duration-300">
                    <CheckCircle className="h-5 w-5 text-emerald-300" />
                    <AlertTitle className="text-emerald-100 font-semibold">Registration Successful!</AlertTitle>
                    <AlertDescription className="text-emerald-200">
                      Your account has been created successfully. You can now sign in.
                    </AlertDescription>
                  </Alert>
                )}

                {error && (
                  <Alert className="bg-red-500/20 border-red-400/30 backdrop-blur-sm animate-in slide-in-from-top-2 duration-300">
                    <AlertCircle className="h-5 w-5 text-red-300" />
                    <AlertTitle className="font-semibold text-red-100">Authentication Error</AlertTitle>
                    <AlertDescription className="text-red-200">
                      {error}
                      {emailVerificationRequired && (
                        <div className="mt-3 space-y-2">
                          <p className="text-sm">Please verify your email address to continue.</p>
                          <Button
                            onClick={resendVerificationEmail}
                            disabled={isResendingVerification}
                            size="sm"
                            className="bg-[#F3C998] hover:bg-[#F3C998]/90 text-[#1D212D] font-semibold"
                          >
                            {isResendingVerification ? "Sending..." : "Resend Verification Email"}
                          </Button>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3">
                  <Label htmlFor="username" className="text-sm font-semibold text-white/90">
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="Enter your username"
                    className="h-12 bg-white/5 backdrop-blur-sm border-white/20 focus:border-[#F3C998] focus:ring-2 focus:ring-white/20 transition-all duration-200 text-base text-white placeholder:text-white/60"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-semibold text-white/90">
                      Password
                    </Label>
                    <Link
                      href="/forgot-password"
                      className="text-sm font-medium hover:text-white transition-colors duration-200"
                      style={{ color: "#F3C998" }}
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Enter your password"
                      className="h-12 bg-white/5 backdrop-blur-sm border-white/20 focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all duration-200 text-base pr-12 text-white placeholder:text-white/60"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={togglePasswordVisibility}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-white/10 transition-colors duration-200"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-white/70" />
                      ) : (
                        <Eye className="h-4 w-4 text-white/70" />
                      )}
                      <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                    </Button>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-6 px-8 pb-8">
                <Button
                  type="submit"
                  className="w-full h-12 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 border border-white/20"
                  style={{ backgroundColor: "#F3C998", color: "#1D212D" }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/20" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-transparent px-3 text-white/70 font-medium">New to our platform?</span>
                  </div>
                </div>

                <div className="text-center">
                  <span className="text-white/80">{"Don't have an account? "}</span>
                  <Link
                    href="/register"
                    className="font-semibold hover:text-white/80 transition-colors duration-200 hover:underline"
                    style={{ color: "#F3C998" }}
                  >
                    Create one now
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
      <Footer />
    </HeaderWrapper>
  )
}
