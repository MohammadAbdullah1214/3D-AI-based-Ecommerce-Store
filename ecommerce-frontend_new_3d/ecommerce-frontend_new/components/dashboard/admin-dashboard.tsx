"use client"

import { useState, useEffect } from "react"
import { useGetAllUsersQuery, useGetUserStatsQuery } from "@/store/services/adminApi"
import { useGetAllOrdersQuery } from "@/store/services/orderApi"
import { useGetProductsQuery } from "@/store/services/productApi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell, type PieLabelRenderProps } from "recharts"
import { Users, ShoppingBag, Package, DollarSign, ArrowUpRight, ArrowDownRight, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import CategoryManagementSection from "./CategoryManagementSection"

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const { currentUser } = useAuth()
  const { data: userStats, isLoading: isLoadingUserStats } = useGetUserStatsQuery()
  const { data: users, isLoading: isLoadingUsers } = useGetAllUsersQuery()
  const {
    data: orders,
    isLoading: isLoadingOrders,
    error: ordersError,
    refetch: refetchOrders,
  } = useGetAllOrdersQuery()
  const { data: products, isLoading: isLoadingProducts } = useGetProductsQuery(undefined, { skip: !currentUser?.id })

  useEffect(() => {
    console.log("Admin orders data:", orders)
    console.log("Admin orders error:", ordersError)
    const token = localStorage.getItem("token")
    console.log("Auth token available:", token ? "Yes" : "No")
    if (ordersError) {
      console.error("Admin orders error details:", ordersError)
    }
  }, [orders, ordersError])

  const userTypeData = [
    { name: "Customers", value: userStats?.customers_count || 0 },
    { name: "Sellers", value: userStats?.sellers_count || 0 },
    { name: "Admins", value: userStats?.admins_count || 0 },
  ]

  const COLORS = ["#F3C998", "#F3C998AA", "#F3C99877"]

  const recentUsers = users?.slice(0, 5) || []
  const recentOrders = orders?.slice(0, 5) || []

  const isLoading = isLoadingUserStats || isLoadingUsers || isLoadingOrders || isLoadingProducts

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
                Admin <span style={{ color: "#F3C998" }}>Dashboard</span>
              </h2>
              <p className="text-gray-400 text-lg">Manage users, orders, and platform analytics</p>
            </div>
          </div>

          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-white/10 backdrop-blur-xl border border-white/20 p-1 shadow-2xl">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-300 hover:text-white transition-all duration-300 data-[state=active]:shadow-lg"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="users"
                className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-300 hover:text-white transition-all duration-300 data-[state=active]:shadow-lg"
              >
                Users
              </TabsTrigger>
              <TabsTrigger
                value="orders"
                className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-300 hover:text-white transition-all duration-300 data-[state=active]:shadow-lg"
              >
                Orders
              </TabsTrigger>
              <TabsTrigger
                value="products"
                className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-300 hover:text-white transition-all duration-300 data-[state=active]:shadow-lg"
              >
                Products
              </TabsTrigger>
              <TabsTrigger
                value="categories"
                className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-300 hover:text-white transition-all duration-300 data-[state=active]:shadow-lg"
              >
                Categories
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8 mt-8">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/15 transition-all duration-500 group shadow-2xl hover:shadow-[#F3C998]/10 hover:shadow-2xl">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between space-x-4">
                      <div className="flex items-center space-x-4">
                        <div
                          className="p-4 rounded-2xl group-hover:scale-110 transition-transform duration-500 shadow-lg"
                          style={{ backgroundColor: "#F3C998" }}
                        >
                          <Users className="h-8 w-8 text-[#1D212D]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-300 mb-1">Total Users</p>
                          <h3 className="text-3xl font-bold text-white">{userStats?.total_users || 0}</h3>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 text-emerald-400">
                        <ArrowUpRight className="h-5 w-5" />
                        <span className="text-sm font-medium">12%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/15 transition-all duration-500 group shadow-2xl hover:shadow-[#F3C998]/10 hover:shadow-2xl">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between space-x-4">
                      <div className="flex items-center space-x-4">
                        <div
                          className="p-4 rounded-2xl group-hover:scale-110 transition-transform duration-500 shadow-lg"
                          style={{ backgroundColor: "#F3C998" }}
                        >
                          <ShoppingBag className="h-8 w-8 text-[#1D212D]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-300 mb-1">Total Orders</p>
                          <h3 className="text-3xl font-bold text-white">{orders?.length || 0}</h3>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 text-emerald-400">
                        <ArrowUpRight className="h-5 w-5" />
                        <span className="text-sm font-medium">8%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/15 transition-all duration-500 group shadow-2xl hover:shadow-[#F3C998]/10 hover:shadow-2xl">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between space-x-4">
                      <div className="flex items-center space-x-4">
                        <div
                          className="p-4 rounded-2xl group-hover:scale-110 transition-transform duration-500 shadow-lg"
                          style={{ backgroundColor: "#F3C998" }}
                        >
                          <Package className="h-8 w-8 text-[#1D212D]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-300 mb-1">Total Products</p>
                          <h3 className="text-3xl font-bold text-white">{products?.length || 0}</h3>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 text-emerald-400">
                        <ArrowUpRight className="h-5 w-5" />
                        <span className="text-sm font-medium">15%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/15 transition-all duration-500 group shadow-2xl hover:shadow-[#F3C998]/10 hover:shadow-2xl">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between space-x-4">
                      <div className="flex items-center space-x-4">
                        <div
                          className="p-4 rounded-2xl group-hover:scale-110 transition-transform duration-500 shadow-lg"
                          style={{ backgroundColor: "#F3C998" }}
                        >
                          <DollarSign className="h-8 w-8 text-[#1D212D]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-300 mb-1">Revenue</p>
                          <h3 className="text-3xl font-bold text-white">$12,345</h3>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 text-red-400">
                        <ArrowDownRight className="h-5 w-5" />
                        <span className="text-sm font-medium">3%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-8 md:grid-cols-2">
                <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-white text-2xl font-bold">User Distribution</CardTitle>
                    <CardDescription className="text-gray-300 text-lg">
                      Breakdown of user types on the platform
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={userTypeData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#F3C998"
                            dataKey="value"
                            label={({ name, percent }: PieLabelRenderProps) =>
                              `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`
                            }
                          >
                            {userTypeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#1D212D",
                              border: "1px solid #F3C998",
                              borderRadius: "8px",
                              color: "#ffffff",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-white text-2xl font-bold">New Users</CardTitle>
                    <CardDescription className="text-gray-300 text-lg">Recent user registrations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      {recentUsers.map((user) => (
                        <div key={user.id} className="flex items-center">
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center mr-6 shadow-lg"
                            style={{ backgroundColor: "#F3C998" }}
                          >
                            <span className="font-medium text-[#1D212D] text-lg">
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="space-y-1 flex-1">
                            <p className="text-base font-medium leading-none text-white">{user.username}</p>
                            <p className="text-base text-gray-400">{user.email}</p>
                          </div>
                          <div className="ml-auto">
                            <Badge
                              className={
                                user.role === "admin"
                                  ? "bg-red-500/20 text-red-300 border-red-500/30 px-3 py-1"
                                  : user.role === "seller"
                                    ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30 px-3 py-1"
                                    : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 px-3 py-1"
                              }
                            >
                              {user.role}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-8">
                <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-white text-2xl font-bold">Recent Orders</CardTitle>
                    <CardDescription className="text-gray-300 text-lg">
                      Latest orders across the platform
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {recentOrders && recentOrders.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-white/20 hover:bg-white/5">
                              <TableHead className="text-gray-300 font-semibold text-base">Order ID</TableHead>
                              <TableHead className="text-gray-300 font-semibold text-base">Customer</TableHead>
                              <TableHead className="text-gray-300 font-semibold text-base">Date</TableHead>
                              <TableHead className="text-gray-300 font-semibold text-base">Status</TableHead>
                              <TableHead className="text-gray-300 font-semibold text-base text-right">Amount</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {recentOrders.map((order) => (
                              <TableRow
                                key={order.id}
                                className="border-white/10 hover:bg-white/5 transition-colors duration-300"
                              >
                                <TableCell className="font-medium text-white text-base">#{order.id}</TableCell>
                                <TableCell className="text-gray-300 text-base">{order.customer_username}</TableCell>
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
                                <TableCell className="text-right text-white font-semibold text-base">
                                  $
                                  {typeof order.total_price === "number"
                                    ? order.total_price.toFixed(2)
                                    : order.total_price
                                      ? Number(order.total_price).toFixed(2)
                                      : "0.00"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-gray-400 text-lg">No recent orders found</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="users" className="space-y-8 mt-8">
              <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                <CardHeader className="pb-6">
                  <CardTitle className="text-white text-2xl font-bold">User Management</CardTitle>
                  <CardDescription className="text-gray-300 text-lg">Manage all users on the platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/20 hover:bg-white/5">
                          <TableHead className="text-gray-300 font-semibold text-base">Username</TableHead>
                          <TableHead className="text-gray-300 font-semibold text-base">Email</TableHead>
                          <TableHead className="text-gray-300 font-semibold text-base">Role</TableHead>
                          <TableHead className="text-gray-300 font-semibold text-base">Status</TableHead>
                          <TableHead className="text-gray-300 font-semibold text-base">Joined</TableHead>
                          <TableHead className="text-gray-300 font-semibold text-base">Last Login</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users?.map((user) => (
                          <TableRow
                            key={user.id}
                            className="border-white/10 hover:bg-white/5 transition-colors duration-300"
                          >
                            <TableCell className="font-medium text-white text-base">{user.username}</TableCell>
                            <TableCell className="text-gray-300 text-base">{user.email}</TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  user.role === "admin"
                                    ? "bg-red-500/20 text-red-300 border-red-500/30 px-3 py-1"
                                    : user.role === "seller"
                                      ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30 px-3 py-1"
                                      : "bg-blue-500/20 text-blue-300 border-blue-500/30 px-3 py-1"
                                }
                              >
                                {user.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  user.is_active
                                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 px-3 py-1"
                                    : "bg-red-500/20 text-red-300 border-red-500/30 px-3 py-1"
                                }
                              >
                                {user.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-300 text-base">
                              {user.joining_date
                                ? new Date(user.joining_date).toLocaleDateString()
                                : new Date(user.date_joined).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-gray-300 text-base">
                              {user.last_login ? new Date(user.last_login).toLocaleDateString() : "Never"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders" className="space-y-8 mt-8">
              <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                <CardHeader>
                  <div className="flex justify-between items-center pb-6">
                    <div>
                      <CardTitle className="text-white text-2xl font-bold">Order Management</CardTitle>
                      <CardDescription className="text-gray-300 text-lg">
                        Manage all orders on the platform
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => refetchOrders()}
                      className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 backdrop-blur-sm"
                    >
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {ordersError && (
                    <div className="mb-6 p-6 bg-red-500/20 border border-red-500/30 rounded-lg backdrop-blur-sm">
                      <div className="flex items-center mb-3">
                        <AlertTriangle className="h-6 w-6 text-red-300 mr-3" />
                        <h3 className="text-red-300 font-medium text-lg">API Error</h3>
                      </div>
                      <p className="text-sm text-red-200 mb-3">
                        There was an error fetching orders. The admin orders endpoint may not be configured correctly.
                      </p>
                      <p className="text-sm text-gray-300">
                        <strong>Note:</strong> We're now using the regular orders endpoint instead of the admin-specific
                        endpoint.
                      </p>
                    </div>
                  )}

                  <div className="space-y-6">
                    <div className="flex flex-wrap gap-4 items-center justify-between">
                      <div className="flex flex-wrap gap-3">
                        <select
                          className="bg-white/10 border border-white/20 rounded-lg p-3 text-white backdrop-blur-xl text-base"
                          onChange={(e) => {
                            console.log("Filter by status:", e.target.value)
                          }}
                        >
                          <option value="all">All Statuses</option>
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <select
                          className="bg-white/10 border border-white/20 rounded-lg p-3 text-white backdrop-blur-xl text-base"
                          onChange={(e) => {
                            console.log("Filter by seller:", e.target.value)
                          }}
                        >
                          <option value="all">All Sellers</option>
                          <option value="1">Seller 1</option>
                          <option value="2">Seller 2</option>
                        </select>
                        <input
                          type="date"
                          className="bg-white/10 border border-white/20 rounded-lg p-3 text-white backdrop-blur-xl text-base"
                          onChange={(e) => {
                            console.log("Filter by date:", e.target.value)
                          }}
                        />
                      </div>
                    </div>

                    {isLoadingOrders ? (
                      <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F3C998]"></div>
                      </div>
                    ) : orders && orders.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-white/20 hover:bg-white/5">
                              <TableHead className="text-gray-300 font-semibold text-base">Order ID</TableHead>
                              <TableHead className="text-gray-300 font-semibold text-base">Customer</TableHead>
                              <TableHead className="text-gray-300 font-semibold text-base">Seller</TableHead>
                              <TableHead className="text-gray-300 font-semibold text-base">Date</TableHead>
                              <TableHead className="text-gray-300 font-semibold text-base">Status</TableHead>
                              <TableHead className="text-gray-300 font-semibold text-base text-right">Amount</TableHead>
                              <TableHead className="text-gray-300 font-semibold text-base">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {orders.map((order) => (
                              <TableRow
                                key={order.id}
                                className="border-white/10 hover:bg-white/5 transition-colors duration-300"
                              >
                                <TableCell className="font-medium text-white text-base">#{order.id}</TableCell>
                                <TableCell className="text-gray-300 text-base">
                                  {order.customer_username || "Customer"}
                                </TableCell>
                                <TableCell className="text-gray-300 text-base">
                                  {(order.items && order.items[0]?.product_details?.seller_username) || "Unknown"}
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
                                <TableCell className="text-right text-white font-semibold text-base">
                                  $
                                  {typeof order.total_price === "number"
                                    ? order.total_price.toFixed(2)
                                    : typeof order.total_price === "string"
                                      ? Number.parseFloat(order.total_price).toFixed(2)
                                      : "0.00"}
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-3">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      asChild
                                      className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 bg-transparent backdrop-blur-sm"
                                    >
                                      <Link href={`/admin/orders/${order.id}`}>Details</Link>
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        alert(`Update status for order #${order.id}`)
                                      }}
                                      className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 backdrop-blur-sm"
                                    >
                                      Update
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <p className="text-gray-400 mb-6 text-xl">No orders found.</p>
                        <p className="text-sm text-gray-500 mb-8">
                          This could be because there are no orders in the system yet, or there might be an issue with
                          the API connection.
                        </p>
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => refetchOrders()}
                          className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 backdrop-blur-sm"
                        >
                          Try Again
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="products" className="space-y-8 mt-8">
              <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                <CardHeader className="pb-6">
                  <CardTitle className="text-white text-2xl font-bold">Product Management</CardTitle>
                  <CardDescription className="text-gray-300 text-lg">
                    Manage all products on the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/20 hover:bg-white/5">
                          <TableHead className="text-gray-300 font-semibold text-base">Product ID</TableHead>
                          <TableHead className="text-gray-300 font-semibold text-base">Name</TableHead>
                          <TableHead className="text-gray-300 font-semibold text-base">Seller</TableHead>
                          <TableHead className="text-gray-300 font-semibold text-base">Category</TableHead>
                          <TableHead className="text-gray-300 font-semibold text-base">Stock</TableHead>
                          <TableHead className="text-gray-300 font-semibold text-base text-right">Price</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products?.map((product) => (
                          <TableRow
                            key={product.id}
                            className="border-white/10 hover:bg-white/5 transition-colors duration-300"
                          >
                            <TableCell className="font-medium text-white text-base">#{product.id}</TableCell>
                            <TableCell className="text-white text-base">{product.name}</TableCell>
                            <TableCell className="text-gray-300 text-base">
                              {product.seller_username || "Unknown"}
                            </TableCell>
                            <TableCell className="text-gray-300 text-base">
                              {product.category_name || "Uncategorized"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  (product.stock || 0) > 20
                                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 px-3 py-1"
                                    : (product.stock || 0) > 5
                                      ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30 px-3 py-1"
                                      : "bg-red-500/20 text-red-300 border-red-500/30 px-3 py-1"
                                }
                              >
                                {(product.stock || 0) > 0 ? `${product.stock} in stock` : "Out of stock"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-white font-semibold text-base">
                              $
                              {typeof product.price === "number"
                                ? product.price.toFixed(2)
                                : Number(product.price).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="categories" className="space-y-8 mt-8">
              <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                <CardHeader className="pb-6">
                  <CardTitle className="text-white text-2xl font-bold">Category Management</CardTitle>
                  <CardDescription className="text-gray-300 text-lg">Create, edit, or delete categories</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Category management UI goes here */}
                  {/* Example: List categories, add/edit/delete forms/buttons */}
                  <CategoryManagementSection />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
