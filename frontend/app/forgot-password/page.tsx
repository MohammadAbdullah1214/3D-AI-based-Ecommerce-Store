"use client"

import ForgotPassword from "@/components/auth/forgot-password"
import HeaderWrapper from "@/app/header-wrapper"
import Footer from "@/components/layout/footer"

export default function ForgotPasswordPage() {
  return (
    <HeaderWrapper>
      <ForgotPassword />
      <Footer />
    </HeaderWrapper>
  )
} 