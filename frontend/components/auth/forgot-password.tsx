"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertCircle,
  Loader2,
  CheckCircle,
  Eye,
  EyeOff,
  Mail,
  Shield,
  Lock,
  Check,
  X,
  ArrowLeft,
} from "lucide-react"
import {
  useForgotPasswordMutation,
  useVerifyOTPMutation,
  useResetPasswordMutation,
} from "@/store/services/authApi"

interface PasswordRequirement {
  label: string
  test: (password: string) => boolean
  met: boolean
}

interface PasswordStrength {
  score: number
  label: string
  color: string
  requirements: PasswordRequirement[]
}

type Step = "email" | "otp" | "password" | "success"

export default function ForgotPassword() {
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    label: "Very Weak",
    color: "#ef4444",
    requirements: [],
  })

  const { toast } = useToast()

  const [forgotPassword, { isLoading: isSendingOTP }] = useForgotPasswordMutation()
  const [verifyOTP, { isLoading: isVerifyingOTP }] = useVerifyOTPMutation()
  const [resetPassword, { isLoading: isResettingPassword }] = useResetPasswordMutation()

  const passwordRequirements: PasswordRequirement[] = [
    {
      label: "At least 8 characters long",
      test: (password: string) => password.length >= 8,
      met: false,
    },
    {
      label: "Contains uppercase letter (A-Z)",
      test: (password: string) => /[A-Z]/.test(password),
      met: false,
    },
    {
      label: "Contains lowercase letter (a-z)",
      test: (password: string) => /[a-z]/.test(password),
      met: false,
    },
    {
      label: "Contains number (0-9)",
      test: (password: string) => /\d/.test(password),
      met: false,
    },
    {
      label: "Contains special character (!@#$%^&*)",
      test: (password: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
      met: false,
    },
  ]

  const calculatePasswordStrength = (password: string): PasswordStrength => {
    const requirements = passwordRequirements.map((req) => ({
      ...req,
      met: req.test(password),
    }))
    const metRequirements = requirements.filter((req) => req.met).length
    const score = (metRequirements / requirements.length) * 100

    let label = "Very Weak"
    let color = "#ef4444"

    if (score >= 80) {
      label = "Very Strong"
      color = "#22c55e"
    } else if (score >= 60) {
      label = "Strong"
      color = "#84cc16"
    } else if (score >= 40) {
      label = "Medium"
      color = "#f59e0b"
    } else if (score >= 20) {
      label = "Weak"
      color = "#f97316"
    }

    return {
      score,
      label,
      color,
      requirements,
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email address")
      return
    }

    try {
      await forgotPassword({ email }).unwrap()
      setStep("otp")
      toast({
        title: "OTP Sent",
        description: "Please check your email for the OTP code.",
        variant: "default",
      })
    } catch (err: any) {
      setError(err.data?.error || err.data?.email?.[0] || "Failed to send OTP")
      toast({
        title: "Error",
        description: err.data?.error || "Failed to send OTP",
        variant: "destructive",
      })
    }
  }

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP")
      return
    }

    try {
      await verifyOTP({ email, otp }).unwrap()
      setStep("password")
      toast({
        title: "OTP Verified",
        description: "Please enter your new password.",
        variant: "default",
      })
    } catch (err: any) {
      setError(err.data?.error || "Invalid OTP")
      toast({
        title: "Error",
        description: err.data?.error || "Invalid OTP",
        variant: "destructive",
      })
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    const metRequirements = passwordStrength.requirements.filter((req) => req.met).length
    if (metRequirements < passwordRequirements.length) {
      setError("Password does not meet all security requirements")
      return
    }

    try {
      await resetPassword({ email, otp, new_password: newPassword }).unwrap()
      setStep("success")
      toast({
        title: "Password Reset",
        description: "Your password has been reset successfully.",
        variant: "default",
      })
    } catch (err: any) {
      setError(err.data?.error || "Failed to reset password")
      toast({
        title: "Error",
        description: err.data?.error || "Failed to reset password",
        variant: "destructive",
      })
    }
  }

  const handlePasswordChange = (password: string) => {
    setNewPassword(password)
    setPasswordStrength(calculatePasswordStrength(password))
  }

  const resetForm = () => {
    setStep("email")
    setEmail("")
    setOtp("")
    setNewPassword("")
    setConfirmPassword("")
    setError(null)
  }

  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#1D212D" }}>
        <Card className="w-full max-w-md backdrop-blur-xl bg-white/5 border-white/10 shadow-2xl">
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
              Password Reset Complete!
            </CardTitle>
            <CardDescription className="text-center text-white/80 text-base leading-relaxed">
              Your password has been successfully reset. You can now log in with your new password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => window.location.href = "/login"}
              className="w-full h-12 backdrop-blur-sm text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 border border-white/20"
              style={{ backgroundColor: "#F3C998", color: "#1D212D" }}
            >
              Go to Login
            </Button>
            <Button
              onClick={resetForm}
              variant="ghost"
              className="w-full h-12 text-white/80 hover:text-white hover:bg-white/10"
            >
              Reset Another Password
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#1D212D" }}>
      <Card className="w-full max-w-md backdrop-blur-xl bg-white/5 border-white/10 shadow-2xl">
        <CardHeader className="space-y-2 pb-8">
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => step === "email" ? window.history.back() : setStep(step === "otp" ? "email" : "otp")}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div
              className="w-12 h-12 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg border border-white/20"
              style={{ backgroundColor: "#F3C998" }}
            >
              <Shield className="w-6 h-6" style={{ color: "#1D212D" }} />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-center text-white drop-shadow-lg">
            {step === "email" && "Forgot Password"}
            {step === "otp" && "Enter OTP"}
            {step === "password" && "Reset Password"}
          </CardTitle>
          <CardDescription className="text-center text-white/80 text-base">
            {step === "email" && "Enter your email to receive a password reset OTP"}
            {step === "otp" && "Enter the 6-digit OTP sent to your email"}
            {step === "password" && "Create a new secure password"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert className="bg-red-500/20 border-red-400/30 backdrop-blur-sm animate-in slide-in-from-top-2 duration-300">
              <AlertCircle className="h-5 w-5 text-red-300" />
              <AlertTitle className="font-semibold text-red-100">Error</AlertTitle>
              <AlertDescription className="text-red-200">{error}</AlertDescription>
            </Alert>
          )}

          {step === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-white/90 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email address"
                  className="h-12 bg-white/5 backdrop-blur-sm border-white/20 focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all duration-200 text-base text-white placeholder:text-white/60"
                />
              </div>

              <Button
                type="submit"
                disabled={isSendingOTP || !email.includes("@")}
                className="w-full h-12 backdrop-blur-sm text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                style={{ backgroundColor: "#F3C998", color: "#1D212D" }}
              >
                {isSendingOTP ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-5 w-5" />
                    Send OTP
                  </>
                )}
              </Button>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleOTPSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-sm font-semibold text-white/90">
                  OTP Code *
                </Label>
                <Input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                  placeholder="Enter 6-digit OTP"
                  className="h-12 bg-white/5 backdrop-blur-sm border-white/20 focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all duration-200 text-base text-center text-white placeholder:text-white/60 text-2xl tracking-widest"
                />
                <p className="text-xs text-white/60 text-center">
                  We've sent a 6-digit code to {email}
                </p>
              </div>

              <Button
                type="submit"
                disabled={isVerifyingOTP || otp.length !== 6}
                className="w-full h-12 backdrop-blur-sm text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                style={{ backgroundColor: "#F3C998", color: "#1D212D" }}
              >
                {isVerifyingOTP ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Verifying OTP...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-5 w-5" />
                    Verify OTP
                  </>
                )}
              </Button>
            </form>
          )}

          {step === "password" && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-semibold text-white/90 flex items-center gap-2">
                  New Password *
                  <Lock className="w-4 h-4" style={{ color: "#F3C998" }} />
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    required
                    placeholder="Create a new secure password"
                    className="h-12 bg-white/5 backdrop-blur-sm border-white/20 focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all duration-200 text-base pr-12 text-white placeholder:text-white/60"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-white/10 transition-colors duration-200"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-white/70" />
                    ) : (
                      <Eye className="h-4 w-4 text-white/70" />
                    )}
                  </Button>
                </div>

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-white/80">Password Strength:</span>
                      <span className="text-xs font-semibold" style={{ color: passwordStrength.color }}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <Progress
                      value={passwordStrength.score}
                      className="h-2 bg-white/10"
                      style={
                        {
                          "--progress-foreground": passwordStrength.color,
                        } as React.CSSProperties
                      }
                    />
                    <div className="space-y-2 p-3 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
                      <p className="text-xs font-medium text-white/80 mb-2">Password Requirements (Required):</p>
                      {passwordStrength.requirements.map((req, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                          {req.met ? (
                            <Check className="w-3 h-3 text-green-400 flex-shrink-0" />
                          ) : (
                            <X className="w-3 h-3 text-red-400 flex-shrink-0" />
                          )}
                          <span className={req.met ? "text-green-300" : "text-white/60"}>{req.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold text-white/90">
                  Confirm Password *
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Confirm your new password"
                    className="h-12 bg-white/5 backdrop-blur-sm border-white/20 focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all duration-200 text-base pr-12 text-white placeholder:text-white/60"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-white/10 transition-colors duration-200"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-white/70" />
                    ) : (
                      <Eye className="h-4 w-4 text-white/70" />
                    )}
                  </Button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-300 flex items-center gap-1">
                    <X className="w-3 h-3" />
                    Passwords do not match
                  </p>
                )}
                {confirmPassword && newPassword === confirmPassword && newPassword && (
                  <p className="text-xs text-green-300 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Passwords match
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={
                  isResettingPassword ||
                  newPassword.length < 8 ||
                  newPassword !== confirmPassword ||
                  !passwordStrength.requirements.every(req => req.met)
                }
                className="w-full h-12 backdrop-blur-sm text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                style={{ backgroundColor: "#F3C998", color: "#1D212D" }}
              >
                {isResettingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-5 w-5" />
                    Reset Password
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 