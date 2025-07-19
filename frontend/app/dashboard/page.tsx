"use client"

import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"
import AdminDashboard from "@/components/dashboard/admin-dashboard"
import SellerDashboard from "@/components/dashboard/seller-dashboard"
import CustomerDashboard from "@/components/dashboard/customer-dashboard"
import HeaderWrapper from "../header-wrapper"
import Footer from "@/components/layout/footer"
import { useGetMeQuery } from "@/store/services/authApi"
import { useGetDashboardStatsQuery } from "@/store/services/analyticsApi"
import { useGetOrdersQuery } from "@/store/services/orderApi"
import { useGetProductsQuery } from "@/store/services/productApi"

export default function DashboardPage() {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch user data if not already available
  const { data: userData, isLoading: isLoadingUser } = useGetMeQuery(undefined, {
    skip: !isAuthenticated || !!user,
  })

  // Pre-fetch data based on user role to avoid waterfall requests
  const { isLoading: isLoadingOrders } = useGetOrdersQuery(undefined, {
    skip: !isAuthenticated,
  })

  const { isLoading: isLoadingProducts } = useGetProductsQuery(undefined, {
    skip: !isAuthenticated || user?.role !== "seller",
  })

  const { isLoading: isLoadingStats } = useGetDashboardStatsQuery(undefined, {
    skip: !isAuthenticated || user?.role !== "seller",
  })

  useEffect(() => {
    // Update loading state based on all data fetching states
    setIsLoading(isLoadingUser || isLoadingOrders || isLoadingProducts || isLoadingStats)
  }, [isLoadingUser, isLoadingOrders, isLoadingProducts, isLoadingStats])

  // Determine which dashboard to render based on user role
  const renderDashboard = () => {
    if (!isAuthenticated) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-12 text-center max-w-md mx-4 shadow-2xl">
            <h1 className="text-3xl font-bold mb-6 text-white">Access Denied</h1>
            <p className="mb-8 text-gray-300 text-lg">Please log in to access your dashboard.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/login"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg text-[#1D212D]"
                style={{ backgroundColor: "#F3C998" }}
              >
                Sign In
              </a>
              <a
                href="/register"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold transition-all duration-300 border border-white/30 text-white hover:bg-white/10 backdrop-blur-sm bg-transparent"
              >
                Create Account
              </a>
            </div>
          </div>
        </div>
      )
    }

    if (isLoading) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center">
          <div className="relative w-24 h-24">
            <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-t-[#F3C998] border-r-transparent border-b-[#F3C998]/50 border-l-transparent animate-spin"></div>
            <div className="absolute top-2 left-2 w-20 h-20 rounded-full border-4 border-t-transparent border-r-[#F3C998]/70 border-b-transparent border-l-[#F3C998] animate-spin"></div>
          </div>
        </div>
      )
    }

    const role = userData?.role || user?.role
    switch (role) {
      case "admin":
        return <AdminDashboard />
      case "seller":
        return <SellerDashboard />
      case "customer":
      default:
        return <CustomerDashboard />
    }
  }

  return (
    <HeaderWrapper>
      <div className="min-h-screen w-full bg-gradient-to-br from-[#1D212D] via-[#2A2F3A] to-[#1D212D] relative">
        {/* Full screen background pattern */}
        <div className="fixed inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, #F3C998 0%, transparent 50%), 
                             radial-gradient(circle at 75% 75%, #F3C998 0%, transparent 50%)`,
            }}
          ></div>
        </div>

        {/* Animated geometric shapes */}
        <div className="fixed top-20 left-10 w-32 h-32 border border-[#F3C998]/10 rounded-full animate-pulse"></div>
        <div className="fixed top-40 right-20 w-24 h-24 border border-[#F3C998]/15 rounded-lg rotate-45 animate-pulse delay-1000"></div>
        <div className="fixed bottom-32 left-1/4 w-16 h-16 bg-[#F3C998]/5 rounded-full animate-pulse delay-500"></div>
        <div className="fixed bottom-20 right-1/3 w-20 h-20 border border-[#F3C998]/10 rounded-lg rotate-12 animate-pulse delay-1500"></div>

        {/* Floating particles */}
        <div className="fixed top-1/4 left-1/3 w-2 h-2 bg-[#F3C998]/20 rounded-full animate-bounce"></div>
        <div className="fixed top-3/4 right-1/4 w-1 h-1 bg-[#F3C998]/30 rounded-full animate-bounce delay-700"></div>
        <div className="fixed top-1/2 left-1/5 w-1.5 h-1.5 bg-[#F3C998]/25 rounded-full animate-bounce delay-300"></div>

        <div className="relative z-10 min-h-screen w-full">
          <div className="container mx-auto px-4 py-8">{renderDashboard()}</div>
        </div>
      </div>
      <Footer />
    </HeaderWrapper>
  )
}
