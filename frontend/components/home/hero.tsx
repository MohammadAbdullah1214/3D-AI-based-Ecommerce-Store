"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export default function Hero() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Full screen background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1D212D] via-[#2A2F3A] to-[#1D212D]"></div>

      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 right-[10%] w-96 h-96 bg-[#F3C998]/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-[5%] w-[500px] h-[500px] bg-[#F3C998]/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#F3C998]/5 rounded-full blur-3xl animate-pulse delay-500"></div>

        {/* Floating particles */}
        {Array.from({ length: 50 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-[#F3C998]/40 rounded-full"
            initial={{
              x: Math.random() * 100 + "%",
              y: Math.random() * 100 + "%",
              scale: Math.random() * 0.5 + 0.5,
            }}
            animate={{
              x: [Math.random() * 100 + "%", Math.random() * 100 + "%", Math.random() * 100 + "%"],
              y: [Math.random() * 100 + "%", Math.random() * 100 + "%", Math.random() * 100 + "%"],
            }}
            transition={{
              duration: 20 + Math.random() * 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 h-full min-h-screen flex items-center relative z-20">
        <div className="max-w-2xl">
          <motion.h1
            className="text-4xl md:text-6xl font-bold text-white mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            The Future of Shopping is Here
          </motion.h1>

          <motion.p
            className="text-xl text-gray-300 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Discover cutting-edge products with our AI-powered shopping experience.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Link href="/products">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-[#F3C998] text-[#1D212D] hover:bg-[#E6B87D] transform hover:scale-105 transition-all"
              >
                Shop Now
              </Button>
            </Link>
            <Link href="/about">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto bg-white/5 backdrop-blur-sm border-[#F3C998]/30 text-white hover:bg-[#F3C998]/10 hover:border-[#F3C998] transition-all"
              >
                Learn More
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Enhanced glass card floating on the right */}
      <motion.div
        className="hidden lg:block absolute right-20 top-1/2 transform -translate-y-1/2 z-20 w-80 h-80 rounded-2xl backdrop-blur-xl bg-white/5 border border-[#F3C998]/30 p-6 shadow-2xl"
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1, delay: 0.6 }}
      >
        <div className="h-full flex flex-col justify-between">
          <div>
            <h3 className="text-white text-xl font-bold mb-2">Featured Product</h3>
            <p className="text-gray-300 text-sm">
              AI-Powered Smart Assistant with voice recognition and personalized recommendations.
            </p>
          </div>

          <div className="mt-4">
            <div className="text-[#F3C998] font-bold text-2xl mb-2">$299.99</div>
            <Link href="/products/1">
              <Button className="w-full bg-[#F3C998] text-[#1D212D] hover:bg-[#E6B87D] transform hover:scale-105 transition-all">
                View Details
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
