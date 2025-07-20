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
  Calendar,
  Clock,
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
      if (formData.newPassword.length < 8) {
        setError("New password must be at least 8 characters long")
        return false
      }
      // Check if all password requirements are met
      const metRequirements = passwordStrength.requirements.filter((req) => req.met).length
      if (metRequirements < passwordRequirements.length) {
        setError("New password does not meet all security requirements")
        return false
      }
    }

    if (!formData.email.includes("@") || !formData.email.includes(".")) {
      setError("Please enter a valid email address")
      return false
    }

    if (formData.username.length < 3) {
      setError("Username must be at least 3 characters long")
      return false
    }

    return true
  }

  const isFormValid = () => {
    const basicInfoValid = formData.username.length >= 3 && formData.email.includes("@") && formData.email.includes(".")

    if (!isChangingPassword) {
      return basicInfoValid
    }

    const passwordValid =
      formData.currentPassword &&
      formData.newPassword.length >= 8 &&
      formData.newPassword === formData.confirmNewPassword &&
      passwordStrength.requirements.every(req => req.met)

    return basicInfoValid && passwordValid
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
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/"
      const token = localStorage.getItem("token")

      // Prepare update data
      const updateData: any = {
        username: formData.username,
        email: formData.email,
        address: formData.address,
        first_name: formData.firstName,
        last_name: formData.lastName,
      }

      console.log("Sending profile update data:", updateData)

      // Update basic profile information
      const response = await fetch(`${baseUrl}users/me/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.log("Profile update error:", errorData)
        
        // Handle different types of error responses
        let errorMessage = "Failed to update profile"
        if (errorData.detail) {
          errorMessage = errorData.detail
        } else if (typeof errorData === 'object') {
          // Handle field-specific errors
          const fieldErrors = Object.entries(errorData)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors[0] : errors}`)
            .join(', ')
          errorMessage = fieldErrors || errorMessage
        }
        
        throw new Error(errorMessage)
      }

      // Handle password change separately
      if (isChangingPassword) {
        const passwordResponse = await fetch(`${baseUrl}users/change_password/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            current_password: formData.currentPassword,
            new_password: formData.newPassword,
          }),
        })

        if (!passwordResponse.ok) {
          const passwordErrorData = await passwordResponse.json()
          throw new Error(passwordErrorData.detail || passwordErrorData.current_password?.[0] || "Failed to change password")
        }
      }

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
    } catch (error: any) {
      setError(error.message || "Failed to update profile. Please try again.")
      toast({
        title: "Error updating profile",
        description: error.message || "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-8">
      {/* User Information Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white/5 backdrop-blur-xl border border-white/20 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white text-xl">
              <User className="h-5 w-5" style={{ color: "#F3C998" }} />
              Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user?.username?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
              <div>
                <p className="text-white font-semibold">{user?.username}</p>
                <p className="text-white/60 text-sm">{user?.role}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white/80">
                <Mail className="w-4 h-4" />
                <span className="text-sm">{user?.email}</span>
              </div>
              
              {user?.address && (
                <div className="flex items-start gap-2 text-white/80">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{user.address}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-white/80">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Joined: {formatDate(user?.created_at || user?.date_joined || new Date().toISOString())}</span>
              </div>
              
              {user?.last_login && (
                <div className="flex items-center gap-2 text-white/80">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Last login: {formatDate(user.last_login)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 backdrop-blur-xl border border-white/20 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white text-xl">
              <Shield className="h-5 w-5" style={{ color: "#F3C998" }} />
              Account Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white/80">Account Status</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                user?.is_active 
                  ? "bg-green-500/20 text-green-300 border border-green-500/30" 
                  : "bg-red-500/20 text-red-300 border border-red-500/30"
              }`}>
                {user?.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-white/80">Role</span>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || "Customer"}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-white/80">Staff Status</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                user?.is_staff 
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" 
                  : "bg-gray-500/20 text-gray-300 border border-gray-500/30"
              }`}>
                {user?.is_staff ? "Staff" : "Regular User"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Edit Form */}
      <Card className="bg-white/5 backdrop-blur-xl border border-white/20 shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white text-xl">
            <User className="h-5 w-5" style={{ color: "#F3C998" }} />
            Edit Profile Information
          </CardTitle>
          <CardDescription className="text-white/80">
            Update your account information and security settings
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
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
                  onClick={() => {
                    setIsChangingPassword(!isChangingPassword)
                    if (isChangingPassword) {
                      // Clear password fields when canceling
                      setFormData((prev) => ({
                        ...prev,
                        currentPassword: "",
                        newPassword: "",
                        confirmNewPassword: "",
                      }))
                    }
                  }}
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
                        placeholder="Create a new secure password (min 8 characters)"
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
                          <p className="text-xs text-white/60 mt-2 italic">
                            Note: All requirements must be met to change password.
                          </p>
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
                disabled={isSubmitting || !isFormValid()}
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

              {!isFormValid() && (isChangingPassword ? formData.newPassword : true) && (
                <div className="text-xs text-center space-y-1 mt-2">
                  {isChangingPassword &&
                    formData.newPassword !== formData.confirmNewPassword &&
                    formData.confirmNewPassword && (
                      <p className="text-red-300 flex items-center justify-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        New passwords must match to continue
                      </p>
                    )}
                  {isChangingPassword && formData.newPassword && formData.newPassword.length < 8 && (
                    <p className="text-red-300 flex items-center justify-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      New password must be at least 8 characters long
                    </p>
                  )}
                  {isChangingPassword && formData.newPassword && !passwordStrength.requirements.every(req => req.met) && (
                    <p className="text-red-300 flex items-center justify-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      New password must meet all security requirements
                    </p>
                  )}
                  {formData.username && formData.username.length < 3 && (
                    <p className="text-red-300 flex items-center justify-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Username must be at least 3 characters long
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}
