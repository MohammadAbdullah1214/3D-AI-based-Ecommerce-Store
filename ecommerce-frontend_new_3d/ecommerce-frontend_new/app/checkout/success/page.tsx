"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle, ShoppingBag } from "lucide-react"

export default function CheckoutSuccessPage() {
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

      <div className="relative z-10 min-h-screen w-full p-4 md:p-8 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-12 shadow-2xl text-center max-w-lg">
          <div
            className="rounded-full p-6 w-24 h-24 flex items-center justify-center mx-auto mb-8 shadow-2xl"
            style={{ backgroundColor: "#F3C998" }}
          >
            <CheckCircle className="h-12 w-12 text-[#1D212D]" />
          </div>
          <h1 className="text-4xl font-bold mb-6 text-white">Order Confirmed!</h1>
          <p className="text-gray-300 mb-12 text-lg leading-relaxed">
            Thank you for your purchase. We've received your order and will process it right away. You'll receive a
            confirmation email shortly.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/products">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 backdrop-blur-sm bg-transparent"
              >
                <ShoppingBag className="mr-2 h-4 w-4" />
                Continue Shopping
              </Button>
            </Link>
            <Link href="/dashboard?tab=orders">
              <Button
                size="lg"
                className="w-full sm:w-auto text-[#1D212D] font-semibold hover:scale-105 transition-all duration-300 shadow-lg"
                style={{ backgroundColor: "#F3C998" }}
              >
                View Order
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
