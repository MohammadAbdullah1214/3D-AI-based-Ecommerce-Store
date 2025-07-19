"use client"

import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"
import { useGetOrdersQuery } from "@/store/services/orderApi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ShoppingBag, Package, Clock, ArrowRight, User, MapPin, CreditCard } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useSearchParams } from "next/navigation"
import clsx from "clsx"

export default function CustomerDashboard() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const [activeTab, setActiveTab] = useState(tabParam || "overview")

  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  const user = useSelector((state: RootState) => state.auth.user)
  const { data: orders, isLoading: isLoadingOrders } = useGetOrdersQuery()

  const recentOrders = orders?.slice(0, 5) || []

  if (isLoadingOrders) {
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

      <div className="relative z-10 min-h-screen w-full p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-2">
                Welcome back, <span style={{ color: "#F3C998" }}>{user?.username || "Customer"}</span>
              </h2>
              <p className="text-gray-400 text-lg">Manage your orders and account settings</p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-white/10 backdrop-blur-xl border border-white/20 p-1 shadow-2xl">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-300 hover:text-white transition-all duration-300 data-[state=active]:shadow-lg"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="orders"
                className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-300 hover:text-white transition-all duration-300 data-[state=active]:shadow-lg"
              >
                My Orders
              </TabsTrigger>
              <TabsTrigger
                value="profile"
                className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-300 hover:text-white transition-all duration-300 data-[state=active]:shadow-lg"
              >
                Profile
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8 mt-8">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/15 transition-all duration-500 group shadow-2xl hover:shadow-[#F3C998]/10 hover:shadow-2xl">
                  <CardContent className="p-8">
                    <div className="flex items-center space-x-6">
                      <div
                        className="p-4 rounded-2xl group-hover:scale-110 transition-transform duration-500 shadow-lg"
                        style={{ backgroundColor: "#F3C998" }}
                      >
                        <ShoppingBag className="h-8 w-8 text-[#1D212D]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-300 mb-1">Total Orders</p>
                        <h3 className="text-4xl font-bold text-white">{orders?.length || 0}</h3>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/15 transition-all duration-500 group shadow-2xl hover:shadow-[#F3C998]/10 hover:shadow-2xl">
                  <CardContent className="p-8">
                    <div className="flex items-center space-x-6">
                      <div
                        className="p-4 rounded-2xl group-hover:scale-110 transition-transform duration-500 shadow-lg"
                        style={{ backgroundColor: "#F3C998" }}
                      >
                        <Package className="h-8 w-8 text-[#1D212D]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-300 mb-1">Delivered Orders</p>
                        <h3 className="text-4xl font-bold text-white">
                          {orders?.filter((order) => order.status === "delivered").length || 0}
                        </h3>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/15 transition-all duration-500 group shadow-2xl hover:shadow-[#F3C998]/10 hover:shadow-2xl">
                  <CardContent className="p-8">
                    <div className="flex items-center space-x-6">
                      <div
                        className="p-4 rounded-2xl group-hover:scale-110 transition-transform duration-500 shadow-lg"
                        style={{ backgroundColor: "#F3C998" }}
                      >
                        <Clock className="h-8 w-8 text-[#1D212D]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-300 mb-1">Pending Orders</p>
                        <h3 className="text-4xl font-bold text-white">
                          {orders?.filter((order) => order.status === "pending" || order.status === "processing")
                            .length || 0}
                        </h3>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-8">
                <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-white text-2xl font-bold">Recent Orders</CardTitle>
                    <CardDescription className="text-gray-300 text-lg">Your most recent purchases</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-white/20 hover:bg-white/5">
                            <TableHead className="text-gray-300 font-semibold text-base">Order ID</TableHead>
                            <TableHead className="text-gray-300 font-semibold text-base">Date</TableHead>
                            <TableHead className="text-gray-300 font-semibold text-base">Status</TableHead>
                            <TableHead className="text-gray-300 font-semibold text-base">Items</TableHead>
                            <TableHead className="text-gray-300 font-semibold text-base text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recentOrders.length > 0 ? (
                            recentOrders.map((order) => (
                              <TableRow
                                key={order.id}
                                className="border-white/10 hover:bg-white/5 transition-colors duration-300"
                              >
                                <TableCell className="font-medium text-white text-base">#{order.id}</TableCell>
                                <TableCell className="text-gray-300 text-base">
                                  {new Date(order.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    className={
                                      order.status === "delivered"
                                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 px-3 py-1"
                                        : order.status === "cancelled"
                                          ? "bg-red-500/20 text-red-300 border-red-500/30 px-3 py-1"
                                          : order.status === "pending"
                                            ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30 px-3 py-1"
                                            : "bg-blue-500/20 text-blue-300 border-blue-500/30 px-3 py-1"
                                    }
                                  >
                                    {order.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-gray-300 text-base">{order.items.length}</TableCell>
                                <TableCell className="text-right font-semibold text-white text-base">
                                  $
                                  {order.total_price
                                    ? typeof order.total_price === "number"
                                      ? order.total_price.toFixed(2)
                                      : Number(order.total_price).toFixed(2)
                                    : "0.00"}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-12 text-gray-400 text-lg">
                                You haven't placed any orders yet.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    {recentOrders.length > 0 && (
                      <div className="mt-8 flex justify-end">
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => setActiveTab("orders")}
                          className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 backdrop-blur-sm"
                        >
                          View All Orders
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="orders" className="space-y-8 mt-8">
              <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                <CardHeader className="pb-6">
                  <CardTitle className="text-white text-2xl font-bold">Order History</CardTitle>
                  <CardDescription className="text-gray-300 text-lg">View all your past orders</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingOrders ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F3C998]"></div>
                    </div>
                  ) : orders && orders.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table className="min-w-full">
                        <TableHeader>
                          <TableRow className="border-white/20 hover:bg-white/5">
                            <TableHead className="font-semibold text-gray-300 text-base">Order ID / Products</TableHead>
                            <TableHead className="font-semibold text-gray-300 text-base">Date</TableHead>
                            <TableHead className="font-semibold text-gray-300 text-base">Status</TableHead>
                            <TableHead className="font-semibold text-gray-300 text-base">Items</TableHead>
                            <TableHead className="font-semibold text-gray-300 text-base text-right">Amount</TableHead>
                            <TableHead className="font-semibold text-gray-300 text-base">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orders.map((order, idx) => {
                            const productNames = (order.items || [])
                              .map((item) => item.product_details?.name || "")
                              .filter(Boolean)
                            const productDisplay =
                              productNames.length > 1
                                ? `${productNames[0]} +${productNames.length - 1} more`
                                : productNames[0] || "-"
                            const total = order.total_price
                              ? typeof order.total_price === "number"
                                ? order.total_price
                                : Number(order.total_price)
                              : 0
                            return (
                              <TableRow
                                key={order.id}
                                className={clsx(
                                  "transition-colors duration-300 border-white/10",
                                  idx % 2 === 0 ? "bg-white/5" : "bg-transparent",
                                  "hover:bg-white/10",
                                )}
                              >
                                <TableCell className="font-medium text-white text-base">
                                  #{order.id}
                                  <div className="text-sm text-gray-400 mt-1">{productDisplay}</div>
                                </TableCell>
                                <TableCell className="text-gray-300 text-base">
                                  {new Date(order.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    className={
                                      order.status === "delivered"
                                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 px-3 py-1"
                                        : order.status === "cancelled"
                                          ? "bg-red-500/20 text-red-300 border-red-500/30 px-3 py-1"
                                          : order.status === "pending"
                                            ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30 px-3 py-1"
                                            : "bg-blue-500/20 text-blue-300 border-blue-500/30 px-3 py-1"
                                    }
                                  >
                                    {order.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-gray-300 text-base">{order.items?.length || 0}</TableCell>
                                <TableCell className="text-right font-semibold text-white text-base">
                                  ${total.toFixed(2)}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                    className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 bg-transparent backdrop-blur-sm"
                                  >
                                    <Link href={`/account/orders/${order.id}`}>Details</Link>
                                  </Button>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <p className="text-gray-400 mb-8 text-xl">You haven't placed any orders yet.</p>
                      <Link href="/products">
                        <Button
                          size="lg"
                          className="text-[#1D212D] font-semibold hover:scale-105 transition-all duration-300 shadow-lg"
                          style={{ backgroundColor: "#F3C998" }}
                        >
                          Browse Products
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile" className="space-y-8 mt-8">
              <div className="grid gap-8 md:grid-cols-2">
                <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-white text-2xl font-bold">Personal Information</CardTitle>
                    <CardDescription className="text-gray-300 text-lg">Your account details</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      <div className="flex items-center">
                        <User className="h-6 w-6 text-[#F3C998] mr-4" />
                        <div>
                          <p className="text-sm font-medium text-gray-400 mb-1">Username</p>
                          <p className="text-white font-semibold text-lg">{user?.username}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <CreditCard className="h-6 w-6 text-[#F3C998] mr-4" />
                        <div>
                          <p className="text-sm font-medium text-gray-400 mb-1">Email</p>
                          <p className="text-white font-semibold text-lg">{user?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-6 w-6 text-[#F3C998] mr-4" />
                        <div>
                          <p className="text-sm font-medium text-gray-400 mb-1">Address</p>
                          <p className="text-white font-semibold text-lg">
                            {user?.profile?.address || "No address provided"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-10">
                      <Link href="/account/profile/edit">
                        <Button
                          size="lg"
                          className="w-full text-[#1D212D] font-semibold hover:scale-105 transition-all duration-300 shadow-lg"
                          style={{ backgroundColor: "#F3C998" }}
                        >
                          Edit Profile
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-white text-2xl font-bold">Account Settings</CardTitle>
                    <CardDescription className="text-gray-300 text-lg">Manage your account preferences</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      <div>
                        <p className="text-sm font-medium text-gray-400 mb-2">Account Type</p>
                        <p className="flex items-center">
                          <Badge className="bg-[#F3C998]/20 text-[#F3C998] border-[#F3C998]/30 px-3 py-1 text-base">
                            {user?.role}
                          </Badge>
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-400 mb-2">Member Since</p>
                        <p className="text-white font-semibold text-lg">
                          {user?.date_joined ? new Date(user.date_joined).toLocaleDateString() : "Unknown"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-10 space-y-4">
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-full border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 bg-transparent backdrop-blur-sm"
                      >
                        Change Password
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-full border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 bg-transparent backdrop-blur-sm"
                      >
                        Notification Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
