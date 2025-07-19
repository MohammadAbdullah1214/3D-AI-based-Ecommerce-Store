"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"

export default function Newsletter() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast({
        title: "Email is required",
        description: "Please enter your email address.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Subscription successful!",
        description: "Thank you for subscribing to our newsletter.",
        variant: "default",
      })

      setEmail("")
    } catch (error) {
      toast({
        title: "Subscription failed",
        description: "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="py-16 container mx-auto px-4">
      <div className="max-w-3xl mx-auto text-center backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8">
        <h2 className="text-3xl font-bold mb-4 text-white">Stay Updated</h2>
        <p className="text-gray-300 mb-8">
          Subscribe to our newsletter to receive updates on new products, special offers, and AI technology insights.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
          <Input
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-[#F3C998] backdrop-blur-sm"
          />
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-[#F3C998] text-[#1D212D] hover:bg-[#E6B87D] transform hover:scale-105 transition-all"
          >
            {isLoading ? "Subscribing..." : "Subscribe"}
          </Button>
        </form>
      </div>
    </section>
  )
}
