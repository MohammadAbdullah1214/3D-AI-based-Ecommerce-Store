"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ProfileForm from "@/components/account/profile-form"
import OrderHistory from "@/components/account/order-history"
import { Card } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

export default function AccountPage() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const mockUser = {
          id: "1",
          username: "johndoe",
          email: "john.doe@example.com",
          role: "customer",
          address: "123 Main St, Anytown, USA",
        }
        setUser(mockUser)
      } catch (error) {
        toast({
          title: "Error loading profile",
          description: "Please try again later.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [toast])

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

  if (!user) {
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

        <div className="relative z-10 min-h-screen w-full p-4 md:p-8 flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-12 shadow-2xl text-center">
            <h1 className="text-3xl font-bold mb-6 text-white">Please log in to view your account</h1>
          </div>
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

      <div className="relative z-10 min-h-screen w-full p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
              My <span style={{ color: "#F3C998" }}>Account</span>
            </h1>
            <p className="text-gray-400 text-lg">Manage your profile and order history</p>
          </div>

          <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-xl border border-white/20 p-1 shadow-2xl">
                <TabsTrigger
                  value="profile"
                  className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-300 hover:text-white transition-all duration-300 data-[state=active]:shadow-lg"
                >
                  Profile
                </TabsTrigger>
                <TabsTrigger
                  value="orders"
                  className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-300 hover:text-white transition-all duration-300 data-[state=active]:shadow-lg"
                >
                  Order History
                </TabsTrigger>
              </TabsList>
              <TabsContent value="profile" className="p-8">
                <ProfileForm user={user} />
              </TabsContent>
              <TabsContent value="orders" className="p-8">
                <OrderHistory />
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  )
}
