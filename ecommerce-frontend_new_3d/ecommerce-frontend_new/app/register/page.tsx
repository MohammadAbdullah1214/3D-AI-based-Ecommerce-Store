"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useRegisterMutation } from "@/store/services/authApi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2, CheckCircle, Eye, EyeOff, User, ShoppingBag } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import HeaderWrapper from "@/app/header-wrapper"
import Footer from "@/components/layout/footer"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    role: "customer" as "customer" | "seller",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const [register, { isLoading }] = useRegisterMutation()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({ ...prev, role: value as "customer" | "seller" }))
  }

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return false
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long")
      return false
    }
    if (!formData.email.includes("@")) {
      setError("Please enter a valid email address")
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateForm()) {
      return
    }

    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        first_name: formData.firstName,
        last_name: formData.lastName,
      }).unwrap()

      // Show success message
      setSuccess(true)
      // Redirect to login page after a short delay
      setTimeout(() => {
        router.push("/login?registered=true")
      }, 2000)
    } catch (err: any) {
      console.error("API Error:", err)
      if (err.data?.username) {
        setError(`Username error: ${err.data.username}`)
      } else if (err.data?.email) {
        setError(`Email error: ${err.data.email}`)
      } else if (err.data?.password) {
        setError(`Password error: ${err.data.password}`)
      } else if (err.data?.detail) {
        setError(err.data.detail)
      } else if (err.data?.non_field_errors) {
        setError(err.data.non_field_errors)
      } else {
        setError("Registration failed. Please try again.")
      }
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword)
  }

  if (success) {
    return (
      <HeaderWrapper>
        <div
          className="min-h-screen relative overflow-hidden flex items-center justify-center px-4"
          style={{ backgroundColor: "#1D212D" }}
        >
          {/* Success celebration elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              className="absolute top-1/4 left-1/4 w-3 h-3 rounded-full animate-bounce"
              style={{ backgroundColor: "#F3C998" }}
            ></div>
            <div
              className="absolute top-1/3 right-1/3 w-2 h-2 rounded-full animate-bounce delay-500"
              style={{ backgroundColor: "#F3C998" }}
            ></div>
            <div
              className="absolute top-2/3 left-1/3 w-2.5 h-2.5 rounded-full animate-bounce delay-1000"
              style={{ backgroundColor: "#F3C998" }}
            ></div>
            <div
              className="absolute top-1/2 right-1/4 w-2 h-2 rounded-full animate-bounce delay-1500"
              style={{ backgroundColor: "#F3C998" }}
            ></div>
          </div>

          <Card
            className="backdrop-blur-xl bg-white/5 border-white/10 shadow-2xl w-full max-w-md relative z-10"
            style={{ boxShadow: `0 25px 50px -12px rgba(243, 201, 152, 0.1)` }}
          >
            <CardHeader className="space-y-4 pb-8">
              <div className="flex justify-center mb-4">
                <div
                  className="w-16 h-16 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg animate-in zoom-in-50 duration-500 border border-white/20"
                  style={{ backgroundColor: "#F3C998" }}
                >
                  <CheckCircle className="h-8 w-8" style={{ color: "#1D212D" }} />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold text-center text-white drop-shadow-lg">
                Welcome Aboard!
              </CardTitle>
              <CardDescription className="text-center text-white/80 text-base leading-relaxed">
                Your account has been created successfully. You'll be redirected to sign in shortly.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center pt-4 pb-8">
              <Link href="/login">
                <Button
                  className="backdrop-blur-sm text-white font-semibold px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 border border-white/20"
                  style={{ backgroundColor: "#F3C998", color: "#1D212D" }}
                >
                  Continue to Sign In
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
        <Footer />
      </HeaderWrapper>
    )
  }

  return (
    <HeaderWrapper>
      <div
        className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-8"
        style={{ backgroundColor: "#1D212D" }}
      >
        {/* Brand-colored background elements */}
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
          {/* Shopping elements */}
          <div className="absolute bottom-32 left-20">
            <div className="relative">
              {/* Shopping bag */}
              <div className="w-12 h-14 border-2 rounded-b-lg opacity-20" style={{ borderColor: "#F3C998" }}></div>
              <div
                className="absolute -top-2 left-2 w-8 h-4 border-2 border-b-0 rounded-t-lg opacity-20"
                style={{ borderColor: "#F3C998" }}
              ></div>
              {/* Handles */}
              <div
                className="absolute top-0 left-1 w-2 h-3 border-2 border-b-0 rounded-t-full opacity-25"
                style={{ borderColor: "#F3C998" }}
              ></div>
              <div
                className="absolute top-0 right-1 w-2 h-3 border-2 border-b-0 rounded-t-full opacity-25"
                style={{ borderColor: "#F3C998" }}
              ></div>
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
          {/* Store/marketplace illustration */}
          <div className="absolute bottom-32 right-24">
            <div className="relative">
              {/* Store front */}
              <div className="w-16 h-12 border-2 rounded-lg opacity-20" style={{ borderColor: "#F3C998" }}></div>
              {/* Awning */}
              <div
                className="absolute -top-2 -left-1 w-18 h-4 rounded-t-lg opacity-15"
                style={{ backgroundColor: "#F3C998" }}
              ></div>
              {/* Windows */}
              <div
                className="absolute top-2 left-2 w-3 h-3 rounded opacity-25"
                style={{ backgroundColor: "#F3C998" }}
              ></div>
              <div
                className="absolute top-2 right-2 w-3 h-3 rounded opacity-25"
                style={{ backgroundColor: "#F3C998" }}
              ></div>
              {/* Door */}
              <div
                className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-6 rounded-t opacity-20"
                style={{ backgroundColor: "#F3C998" }}
              ></div>
            </div>
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

        <div className="w-full max-w-lg relative z-10">
          <Card
            className="backdrop-blur-xl bg-white/5 border-white/10 shadow-2xl"
            style={{ boxShadow: `0 25px 50px -12px rgba(243, 201, 152, 0.1)` }}
          >
            <CardHeader className="space-y-2 pb-8">
              <div
                className="w-12 h-12 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4 mx-auto shadow-lg border border-white/20"
                style={{ backgroundColor: "#F3C998" }}
              >
                <div className="w-6 h-6 rounded-md" style={{ backgroundColor: "#1D212D" }}></div>
              </div>
              <CardTitle className="text-3xl font-bold text-center text-white drop-shadow-lg">
                Join Our Marketplace
              </CardTitle>
              <CardDescription className="text-center text-white/80 text-base">
                Create your account to start buying or selling
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6 px-8">
                {error && (
                  <Alert className="bg-red-500/20 border-red-400/30 backdrop-blur-sm animate-in slide-in-from-top-2 duration-300">
                    <AlertCircle className="h-5 w-5 text-red-300" />
                    <AlertTitle className="font-semibold text-red-100">Registration Error</AlertTitle>
                    <AlertDescription className="text-red-200">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3">
                  <Label htmlFor="username" className="text-sm font-semibold text-white/90">
                    Username *
                  </Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    placeholder="Choose a unique username"
                    className="h-12 bg-white/5 backdrop-blur-sm border-white/20 focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all duration-200 text-base text-white placeholder:text-white/60"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="email" className="text-sm font-semibold text-white/90">
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="Enter your email address"
                    className="h-12 bg-white/5 backdrop-blur-sm border-white/20 focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all duration-200 text-base text-white placeholder:text-white/60"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label htmlFor="firstName" className="text-sm font-semibold text-white/90">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="First name"
                      className="h-12 bg-white/5 backdrop-blur-sm border-white/20 focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all duration-200 text-base text-white placeholder:text-white/60"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="lastName" className="text-sm font-semibold text-white/90">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Last name"
                      className="h-12 bg-white/5 backdrop-blur-sm border-white/20 focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all duration-200 text-base text-white placeholder:text-white/60"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="password" className="text-sm font-semibold text-white/90">
                    Password *
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      required
                      placeholder="Create a secure password"
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
                  <p className="text-xs text-white/70 font-medium">Password must be at least 8 characters long</p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold text-white/90">
                    Confirm Password *
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      placeholder="Confirm your password"
                      className="h-12 bg-white/5 backdrop-blur-sm border-white/20 focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all duration-200 text-base pr-12 text-white placeholder:text-white/60"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={toggleConfirmPasswordVisibility}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-white/10 transition-colors duration-200"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-white/70" />
                      ) : (
                        <Eye className="h-4 w-4 text-white/70" />
                      )}
                      <span className="sr-only">{showConfirmPassword ? "Hide password" : "Show password"}</span>
                    </Button>
                  </div>
                </div>

                <Separator className="my-6 bg-white/20" />

                <div className="space-y-4">
                  <Label className="text-sm font-semibold text-white/90">Account Type *</Label>
                  <RadioGroup value={formData.role} onValueChange={handleRoleChange} className="grid grid-cols-1 gap-3">
                    <div className="relative">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="customer"
                          id="customer"
                          className="border-2 border-white/30 text-white data-[state=checked]:border-white data-[state=checked]:bg-white/20"
                        />
                        <Label
                          htmlFor="customer"
                          className="flex items-center space-x-3 p-4 rounded-xl border-2 border-white/20 cursor-pointer transition-all duration-200 hover:border-white/40 hover:bg-white/10 flex-1 backdrop-blur-sm"
                        >
                          <div className="w-10 h-10 bg-blue-500 backdrop-blur-sm rounded-lg flex items-center justify-center border border-blue-400/30">
                            <User className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-white">Customer</div>
                            <div className="text-sm text-white/70">I want to shop and browse products</div>
                          </div>
                        </Label>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="seller"
                          id="seller"
                          className="border-2 border-white/30 text-white data-[state=checked]:border-white data-[state=checked]:bg-white/20"
                        />
                        <Label
                          htmlFor="seller"
                          className="flex items-center space-x-3 p-4 rounded-xl border-2 border-white/20 cursor-pointer transition-all duration-200 hover:border-white/40 hover:bg-white/10 flex-1 backdrop-blur-sm"
                        >
                          <div className="w-10 h-10 bg-emerald-500 backdrop-blur-sm rounded-lg flex items-center justify-center border border-emerald-400/30">
                            <ShoppingBag className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-white">Seller</div>
                            <div className="text-sm text-white/70">I want to sell products and manage inventory</div>
                          </div>
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-6 px-8 pb-8">
                <Button
                  type="submit"
                  className="w-full h-12 backdrop-blur-sm text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 border border-white/20"
                  style={{ backgroundColor: "#F3C998", color: "#1D212D" }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating your account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/20" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-transparent px-3 text-white/70 font-medium">Already have an account?</span>
                  </div>
                </div>

                <div className="text-center">
                  <span className="text-white/80">Ready to sign in? </span>
                  <Link
                    href="/login"
                    className="font-semibold hover:text-white/80 transition-colors duration-200 hover:underline"
                    style={{ color: "#F3C998" }}
                  >
                    Sign in here
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
