"use client"

import { useSelector } from "react-redux"
import { useRouter } from "next/navigation"
import { useGetWishlistQuery, useRemoveItemMutation, useClearWishlistMutation } from "@/store/services/wishlistApi"
import { ProductCardListing } from "@/components/product/product-card-listing"
import HeaderWrapper from "@/app/header-wrapper"
import Footer from "@/components/layout/footer"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { ArrowLeft } from "lucide-react"

export default function WishlistPage() {
  const { isAuthenticated, user } = useSelector((state: any) => state.auth)
  const router = useRouter()
  const { currentUser } = useAuth();
  if (currentUser && currentUser.role === "seller") {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-[#1D212D] via-[#2A2F3A] to-[#1D212D] relative">
        <div className="fixed inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, #F3C998 0%, transparent 50%), 
                             radial-gradient(circle at 75% 75%, #F3C998 0%, transparent 50%)`,
            }}
          ></div>
        </div>
        <HeaderWrapper>
          <div className="relative z-10 min-h-screen w-full p-4 md:p-8 flex items-center justify-center">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-12 shadow-2xl text-center max-w-md">
              <div className="text-red-400 text-6xl mb-6">⚠️</div>
              <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
              <p className="text-gray-300 mb-8">Sellers cannot access the wishlist page.</p>
              <a href="/products">
                <Button
                  size="lg"
                  className="text-[#1D212D] font-semibold hover:scale-105 transition-all duration-300 shadow-lg"
                  style={{ backgroundColor: "#F3C998" }}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Products
                </Button>
              </a>
            </div>
          </div>
          <Footer />
        </HeaderWrapper>
      </div>
    );
  }

    const {
    data: wishlistData,
    isLoading: isWishlistLoading,
    error: wishlistError,
    refetch: refetchWishlist,
  } = useGetWishlistQuery()
  const [removeWishlistItem, { isLoading: isRemoving }] = useRemoveItemMutation()
  const [clearWishlist, { isLoading: isClearing }] = useClearWishlistMutation()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?next=/wishlist")
    }
  }, [isAuthenticated, router])

  const handleRemoveWishlist = async (product_id: number | undefined, product: any, item: any) => {
    const validProductId = product_id || item?.product?.id
    if (!validProductId || isNaN(Number(validProductId))) return

    if (user && product && user.id === product.seller_id) {
      alert("You cannot remove your own product from wishlist.")
      return
    }

    try {
      await removeWishlistItem({ product_id: validProductId })
      refetchWishlist()
    } catch (err) {
      // Optionally handle error
    }
  }

  if (isWishlistLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#1D212D] via-[#2A2F3A] to-[#1D212D]">
        <div className="relative w-24 h-24">
          <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-t-[#F3C998] border-r-transparent border-b-[#F3C998]/50 border-l-transparent animate-spin"></div>
          <div className="absolute top-2 left-2 w-20 h-20 rounded-full border-4 border-t-transparent border-r-[#F3C998]/70 border-b-transparent border-l-[#F3C998] animate-spin"></div>
        </div>
      </div>
    )
  }

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
      <div className="fixed bottom-20 right-1/3 w-20 h-20 border border-[#F3C998]/10 rounded-lg rotate-12 animate-pulse delay-1500"></div>

      {/* Floating particles */}
      <div className="fixed top-1/4 left-1/3 w-2 h-2 bg-[#F3C998]/20 rounded-full animate-bounce"></div>
      <div className="fixed top-3/4 right-1/4 w-1 h-1 bg-[#F3C998]/30 rounded-full animate-bounce delay-700"></div>
      <div className="fixed top-1/2 left-1/5 w-1.5 h-1.5 bg-[#F3C998]/25 rounded-full animate-bounce delay-300"></div>

      <HeaderWrapper>
        <div className="relative z-10 min-h-screen w-full p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
                My <span style={{ color: "#F3C998" }}>Wishlist</span>
              </h1>
              <p className="text-gray-400 text-lg">Your saved products and favorites</p>
            </div>

            {wishlistData && wishlistData.items && wishlistData.items.length > 0 && (
              <div className="mb-8 flex justify-center">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={async () => {
                    await clearWishlist()
                    refetchWishlist()
                  }}
                  disabled={isClearing || isWishlistLoading}
                  className="border-red-500/30 text-red-300 hover:bg-red-500/10 hover:border-red-500/50 transition-all duration-300 bg-transparent backdrop-blur-sm"
                >
                  {isClearing ? "Clearing..." : "Clear Wishlist"}
                </Button>
              </div>
            )}

            {wishlistError ? (
              <div className="text-center py-16">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-12 shadow-2xl max-w-md mx-auto">
                  <div className="text-red-400 text-6xl mb-6">⚠️</div>
                  <h3 className="text-2xl font-bold text-white mb-4">Failed to load wishlist</h3>
                  <p className="text-gray-300 mb-8">There was an error loading your wishlist. Please try again.</p>
                  <Button
                    onClick={() => refetchWishlist()}
                    size="lg"
                    className="text-[#1D212D] font-semibold hover:scale-105 transition-all duration-300 shadow-lg"
                    style={{ backgroundColor: "#F3C998" }}
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            ) : wishlistData && wishlistData.items && wishlistData.items.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {wishlistData.items.map((item: any) => (
                  <div key={item.id} className="relative group">
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-500 shadow-2xl hover:shadow-[#F3C998]/10 hover:shadow-2xl">
                      <ProductCardListing product={item.product_details || item.product} />
                      {!(user && (item.product_details || item.product) && user.id === (item.product_details || item.product).seller_id) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/80 hover:bg-red-100 border border-red-200 text-red-500 hover:text-red-600 transition-all duration-300"
                          onClick={() => handleRemoveWishlist(item.product_id, item.product_details || item.product, item)}
                          disabled={isRemoving}
                          aria-label="Remove from wishlist"
                        >
                          ✕
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-12 shadow-2xl max-w-md mx-auto">
                  <div className="text-6xl mb-6" style={{ color: "#F3C998" }}>
                    💝
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Your wishlist is empty</h3>
                  <p className="text-gray-300 mb-8">Start adding products you love to your wishlist!</p>
                  <Button
                    onClick={() => router.push("/products")}
                    size="lg"
                    className="text-[#1D212D] font-semibold hover:scale-105 transition-all duration-300 shadow-lg"
                    style={{ backgroundColor: "#F3C998" }}
                  >
                    Browse Products
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        <Footer />
      </HeaderWrapper>
    </div>
  )
}
