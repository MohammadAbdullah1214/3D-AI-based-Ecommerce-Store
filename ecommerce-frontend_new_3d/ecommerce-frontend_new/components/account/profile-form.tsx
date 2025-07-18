"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  User,
  Mail,
  MapPin,
  Shield,
  Lock,
  Check,
  X,
  Save,
} from "lucide-react"

interface ProfileFormProps {
  user: any
}

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

export default function ProfileForm({ user }: ProfileFormProps) {
  const [formData, setFormData] = useState({
    username: user?.username || "",
    email: user?.email || "",
    address: user?.address || "",
    firstName: user?.first_name || "",
    lastName: user?.last_name || "",
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    label: "Very Weak",
    color: "#ef4444",
    requirements: [],
  })

  const { toast } = useToast()

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

  useEffect(() => {
    if (formData.newPassword) {
      setPasswordStrength(calculatePasswordStrength(formData.newPassword))
    }
  }, [formData.newPassword])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError(null)
    setSuccess(null)
  }

  const validateForm = () => {
    if (isChangingPassword) {
      if (!formData.currentPassword) {
        setError("Current password is required to change password")
        return false
      }

      if (formData.newPassword !== formData.confirmNewPassword) {
        setError("New passwords do not match")
        return false
      }

      const strength = calculatePasswordStrength(formData.newPassword)
      if (strength.score < 60) {
        setError("New password is too weak. Please meet at least 3 requirements for a stronger password.")
        return false
      }
    }

    if (!formData.email.includes("@")) {
      setError("Please enter a valid email address")
      return false
    }

    if (formData.username.length < 3) {
      setError("Username must be at least 3 characters long")
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Prepare update data
      const updateData: any = {
        username: formData.username,
        email: formData.email,
        address: formData.address,
        first_name: formData.firstName,
        last_name: formData.lastName,
      }

      // Add password change data if changing password
      if (isChangingPassword) {
        updateData.current_password = formData.currentPassword
        updateData.new_password = formData.newPassword
      }

      // In a real app, you would update the user profile via API
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(updateData),
      })

      // Simulate API call for demo
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setSuccess("Profile updated successfully!")

      // Clear password fields after successful update
      if (isChangingPassword) {
        setFormData((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmNewPassword: "",
        }))
        setIsChangingPassword(false)
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
        variant: "default",
      })
    } catch (error) {
      setError("Failed to update profile. Please try again.")
      toast({
        title: "Error updating profile",
        description: "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen p-6 flex items-center justify-center" style={{ backgroundColor: "#1D212D" }}>
      <Card
        className="w-full max-w-2xl backdrop-blur-xl bg-white/5 border-white/10 shadow-2xl"
        style={{ boxShadow: `0 25px 50px -12px rgba(243, 201, 152, 0.1)` }}
      >
        <CardHeader className="space-y-2 pb-8">
          <div
            className="w-12 h-12 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4 mx-auto shadow-lg border border-white/20"
            style={{ backgroundColor: "#F3C998" }}
          >
            <User className="w-6 h-6" style={{ color: "#1D212D" }} />
          </div>
          <CardTitle className="text-3xl font-bold text-center text-white drop-shadow-lg">Profile Settings</CardTitle>
          <CardDescription className="text-center text-white/80 text-base">
            Manage your account information and security settings
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 px-8 pb-8">
            {error && (
              <Alert className="bg-red-500/20 border-red-400/30 backdrop-blur-sm animate-in slide-in-from-top-2 duration-300">
                <AlertCircle className="h-5 w-5 text-red-300" />
                <AlertTitle className="font-semibold text-red-100">Error</AlertTitle>
                <AlertDescription className="text-red-200">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-500/20 border-green-400/30 backdrop-blur-sm animate-in slide-in-from-top-2 duration-300">
                <CheckCircle className="h-5 w-5 text-green-300" />
                <AlertTitle className="font-semibold text-green-100">Success</AlertTitle>
                <AlertDescription className="text-green-200">{success}</AlertDescription>
              </Alert>
            )}

            {/* Basic Information Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-white/20">
                <User className="w-5 h-5" style={{ color: "#F3C998" }} />
                <h3 className="text-lg font-semibold text-white">Basic Information</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-semibold text-white/90">
                    Username *
                  </Label>
                  <Input
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    className="h-12 bg-white/5 backdrop-blur-sm border-white/20 focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all duration-200 text-base text-white placeholder:text-white/60"
                  />
                  {formData.username && formData.username.length < 3 && (
                    <p className="text-xs text-red-300 flex items-center gap-1">
                      <X className="w-3 h-3" />
                      Username must be at least 3 characters long
                    </p>
                  )}
                  {formData.username && formData.username.length >= 3 && (
                    <p className="text-xs text-green-300 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Username looks good
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-white/90 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="h-12 bg-white/5 backdrop-blur-sm border-white/20 focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all duration-200 text-base text-white placeholder:text-white/60"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-semibold text-white/90">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="h-12 bg-white/5 backdrop-blur-sm border-white/20 focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all duration-200 text-base text-white placeholder:text-white/60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-semibold text-white/90">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="h-12 bg-white/5 backdrop-blur-sm border-white/20 focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all duration-200 text-base text-white placeholder:text-white/60"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-semibold text-white/90 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Address
                  </Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Your shipping address"
                    className="min-h-[100px] bg-white/5 backdrop-blur-sm border-white/20 focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all duration-200 text-base text-white placeholder:text-white/60 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Password Change Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-white/20">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5" style={{ color: "#F3C998" }} />
                  <h3 className="text-lg font-semibold text-white">Security Settings</h3>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsChangingPassword(!isChangingPassword)}
                  className="text-white/80 hover:text-white hover:bg-white/10"
                >
                  {isChangingPassword ? "Cancel" : "Change Password"}
                </Button>
              </div>

              {isChangingPassword && (
                <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="text-sm font-semibold text-white/90">
                      Current Password *
                    </Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        name="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        value={formData.currentPassword}
                        onChange={handleChange}
                        required={isChangingPassword}
                        placeholder="Enter your current password"
                        className="h-12 bg-white/5 backdrop-blur-sm border-white/20 focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all duration-200 text-base pr-12 text-white placeholder:text-white/60"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-white/10 transition-colors duration-200"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4 text-white/70" />
                        ) : (
                          <Eye className="h-4 w-4 text-white/70" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="newPassword"
                      className="text-sm font-semibold text-white/90 flex items-center gap-2"
                    >
                      New Password *
                      <Lock className="w-4 h-4" style={{ color: "#F3C998" }} />
                    </Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={formData.newPassword}
                        onChange={handleChange}
                        required={isChangingPassword}
                        placeholder="Create a new secure password"
                        className="h-12 bg-white/5 backdrop-blur-sm border-white/20 focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all duration-200 text-base pr-12 text-white placeholder:text-white/60"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-white/10 transition-colors duration-200"
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4 text-white/70" />
                        ) : (
                          <Eye className="h-4 w-4 text-white/70" />
                        )}
                      </Button>
                    </div>

                    {/* Password Strength Indicator */}
                    {formData.newPassword && (
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
                          <p className="text-xs font-medium text-white/80 mb-2">Password Requirements:</p>
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
                    <Label htmlFor="confirmNewPassword" className="text-sm font-semibold text-white/90">
                      Confirm New Password *
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmNewPassword"
                        name="confirmNewPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmNewPassword}
                        onChange={handleChange}
                        required={isChangingPassword}
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
                    {formData.confirmNewPassword && formData.newPassword !== formData.confirmNewPassword && (
                      <p className="text-xs text-red-300 flex items-center gap-1">
                        <X className="w-3 h-3" />
                        Passwords do not match
                      </p>
                    )}
                    {formData.confirmNewPassword &&
                      formData.newPassword === formData.confirmNewPassword &&
                      formData.newPassword && (
                        <p className="text-xs text-green-300 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Passwords match
                        </p>
                      )}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6">
              <Button
                type="submit"
                disabled={isSubmitting || (isChangingPassword && passwordStrength.score < 60)}
                className="w-full h-12 backdrop-blur-sm text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                style={{ backgroundColor: "#F3C998", color: "#1D212D" }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Saving changes...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-5 w-5" />
                    Save Changes
                  </>
                )}
              </Button>

              {isChangingPassword && passwordStrength.score < 60 && formData.newPassword && (
                <p className="text-xs text-center text-yellow-300 flex items-center justify-center gap-1 mt-2">
                  <AlertCircle className="w-3 h-3" />
                  Please create a stronger password to continue
                </p>
              )}
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}
