"use client"

import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"
import { useRouter } from "next/navigation"
import ProfileForm from "@/components/account/profile-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, User, Settings } from "lucide-react"
import Link from "next/link"
import HeaderWrapper from "@/app/header-wrapper"
import Footer from "@/components/layout/footer"
import { useGetMeQuery } from "@/store/services/authApi"
import { useGetWishlistQuery, useRemoveItemMutation } from "@/store/services/wishlistApi"
import { ProductCardListing } from "@/components/product/product-card-listing"

export default function ProfilePage() {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  const { data: userData, isLoading: isLoadingUser } = useGetMeQuery(undefined, {
    skip: !isAuthenticated || !!user,
  })

  const {
    data: wishlistData,
    isLoading: isWishlistLoading,
    error: wishlistError,
    refetch: refetchWishlist,
  } = useGetWishlistQuery()
  const [removeWishlistItem, { isLoading: isRemoving }] = useRemoveItemMutation()

  const handleRemoveWishlist = async (product_id: number, product: any) => {
    if (user && product && user.id === product.seller_id) {
      alert("You cannot remove your own product from wishlist.")
      return
    }

    try {
      await removeWishlistItem({ product_id })
      refetchWishlist()
    } catch (err) {
      // Optionally handle error
    }
  }

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }
    setIsLoading(isLoadingUser)
  }, [isAuthenticated, isLoadingUser, router])

  if (!isAuthenticated) {
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#1D212D] via-[#2A2F3A] to-[#1D212D]">
        <div className="relative w-24 h-24">
          <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-t-[#F3C998] border-r-transparent border-b-[#F3C998]/50 border-l-transparent animate-spin"></div>
          <div className="absolute top-2 left-2 w-20 h-20 rounded-full border-4 border-t-transparent border-r-[#F3C998]/70 border-b-transparent border-l-[#F3C998] animate-spin"></div>
        </div>
      </div>
    )
  }

  const currentUser = userData || user

  return (
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

      <HeaderWrapper>
        <div className="relative z-10 min-h-screen w-full p-4 md:p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-8">
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 text-white hover:bg-white/10 transition-all duration-300"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>

            {/* Page Header */}
            <div className="mb-12">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 rounded-2xl shadow-lg" style={{ backgroundColor: "#F3C998" }}>
                  <User className="h-8 w-8 text-[#1D212D]" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-white">Profile Settings</h1>
                  <p className="text-gray-400 text-lg mt-2">Manage your account information and preferences</p>
                </div>
              </div>
            </div>

            {/* Wishlist Section */}
            <div className="mb-12">
              <h2 className="text-3xl font-semibold mb-8 text-white">My Wishlist</h2>
              {isWishlistLoading ? (
                <div className="text-center py-12">
                  <div
                    className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto"
                    style={{ borderColor: "#F3C998" }}
                  ></div>
                </div>
              ) : wishlistError ? (
                <div className="text-center py-12">
                  <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
                    <p className="text-red-400 text-lg">Failed to load wishlist.</p>
                  </div>
                </div>
              ) : wishlistData && wishlistData.items && wishlistData.items.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {wishlistData.items.map((item: any) => (
                    <div key={item.id} className="relative group">
                      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 hover:bg-white/15 transition-all duration-500 shadow-2xl hover:shadow-[#F3C998]/10">
                        <ProductCardListing product={item.product} />
                        {!(user && item.product && user.id === item.product.seller_id) && (
                          <button
                            className="absolute top-2 right-2 z-50 p-2 rounded-full bg-white/80 hover:bg-red-100 border border-red-200 text-red-500 transition-all duration-300"
                            onClick={() => handleRemoveWishlist(item.product_id, item.product)}
                            disabled={isRemoving}
                            aria-label="Remove from wishlist"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
                    <p className="text-gray-400 text-lg">Your wishlist is empty.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Card */}
            <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-white text-2xl">
                  <Settings className="h-6 w-6" style={{ color: "#F3C998" }} />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <ProfileForm user={currentUser} />
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link href="/account/orders">
                <Card className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 hover:bg-white/15 transition-all duration-500 cursor-pointer shadow-2xl hover:shadow-[#F3C998]/10 group">
                  <div className="flex items-center gap-4">
                    <div
                      className="p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300"
                      style={{ backgroundColor: "#F3C998" }}
                    >
                      <svg className="h-6 w-6 text-[#1D212D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-xl">Order History</h3>
                      <p className="text-gray-400 mt-1">View your past orders</p>
                    </div>
                  </div>
                </Card>
              </Link>
              <Link href="/dashboard">
                <Card className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 hover:bg-white/15 transition-all duration-500 cursor-pointer shadow-2xl hover:shadow-[#F3C998]/10 group">
                  <div className="flex items-center gap-4">
                    <div
                      className="p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300"
                      style={{ backgroundColor: "#F3C998" }}
                    >
                      <svg className="h-6 w-6 text-[#1D212D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-xl">Dashboard</h3>
                      <p className="text-gray-400 mt-1">Go to your dashboard</p>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </HeaderWrapper>
    </div>
  )
}
