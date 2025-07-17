"use client"

import { useGetCartQuery } from "@/store/services/cartApi"
import { Button } from "@/components/ui/button"
import { ShoppingCart, ArrowLeft } from "lucide-react"
import Link from "next/link"
import CartItemComponent from "@/components/cart/cart-item"
import CartSummary from "@/components/cart/cart-summary"
import HeaderWrapper from "@/app/header-wrapper"
import Footer from "@/components/layout/footer"
import { useSelector } from "react-redux"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"; 

export default function CartPage() {
  const { isAuthenticated } = useSelector((state: any) => state.auth)
  const router = useRouter()
  const { data: cart, isLoading, error } = useGetCartQuery()
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
              <p className="text-gray-300 mb-8">Sellers cannot access the cart page.</p>
              <Link href="/products">
                <Button
                  size="lg"
                  className="text-[#1D212D] font-semibold hover:scale-105 transition-all duration-300 shadow-lg"
                  style={{ backgroundColor: "#F3C998" }}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Products
                </Button>
              </Link>
            </div>
          </div>
          <Footer />
        </HeaderWrapper>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (typeof window !== "undefined") {
      router.push("/login?next=/cart")
    }
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

  if (error) {
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
              <h2 className="text-2xl font-bold text-white mb-4">Error loading cart</h2>
              <p className="text-gray-300 mb-8">There was a problem loading your cart. Please try again later.</p>
              <Link href="/products">
                <Button
                  size="lg"
                  className="text-[#1D212D] font-semibold hover:scale-105 transition-all duration-300 shadow-lg"
                  style={{ backgroundColor: "#F3C998" }}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
          <Footer />
        </HeaderWrapper>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
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

        {/* Animated geometric shapes */}
        <div className="fixed top-20 left-10 w-32 h-32 border border-[#F3C998]/10 rounded-full animate-pulse"></div>
        <div className="fixed top-40 right-20 w-24 h-24 border border-[#F3C998]/15 rounded-lg rotate-45 animate-pulse delay-1000"></div>
        <div className="fixed bottom-32 left-1/4 w-16 h-16 bg-[#F3C998]/5 rounded-full animate-pulse delay-500"></div>

        <HeaderWrapper>
          <div className="relative z-10 min-h-screen w-full p-4 md:p-8 flex items-center justify-center">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-12 shadow-2xl text-center max-w-md">
              <ShoppingCart className="h-24 w-24 mx-auto mb-6" style={{ color: "#F3C998" }} />
              <h2 className="text-3xl font-bold text-white mb-4">Your cart is empty</h2>
              <p className="text-gray-300 mb-8">Looks like you haven't added any products to your cart yet.</p>
              <Link href="/products">
                <Button
                  size="lg"
                  className="text-[#1D212D] font-semibold hover:scale-105 transition-all duration-300 shadow-lg"
                  style={{ backgroundColor: "#F3C998" }}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
          <Footer />
        </HeaderWrapper>
      </div>
    )
  }

  const subtotal = cart.items.reduce(
    (total, item) =>
      total +
      (typeof item.product_details?.price === "number"
        ? item.product_details.price
        : Number(item.product_details?.price)) *
        item.quantity,
    0,
  )

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
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
                Shopping <span style={{ color: "#F3C998" }}>Cart</span>
              </h1>
              <p className="text-gray-400 text-lg">Review your items and proceed to checkout</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl">
                  <div className="p-8 border-b border-white/20">
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-semibold text-white">Cart Items ({cart.item_count})</h2>
                      <Link href="/products">
                        <Button variant="ghost" className="text-white hover:bg-white/10 transition-all duration-300">
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Continue Shopping
                        </Button>
                      </Link>
                    </div>
                  </div>
                  <div className="p-8">
                    <div className="space-y-6">
                      {cart.items.map((item) => (
                        <div key={item.id} className="bg-white/5 rounded-xl p-6">
                          <CartItemComponent item={item} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl">
                  <CartSummary subtotal={subtotal} itemCount={cart.item_count} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </HeaderWrapper>
    </div>
  )
}
