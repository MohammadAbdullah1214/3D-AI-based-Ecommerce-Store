"use client"

import { useState, useEffect } from "react"
import { useGetAllUsersQuery, useGetUserStatsQuery, useDeleteUserMutation } from "@/store/services/adminApi"
import { useGetAllOrdersQuery, useDeleteOrderMutation } from "@/store/services/orderApi"
import { useGetProductsQuery } from "@/store/services/productApi"
import { useGetCategoriesQuery, useCreateCategoryMutation, useUpdateCategoryMutation, useDeleteCategoryMutation } from "@/store/services/productApi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell, type PieLabelRenderProps } from "recharts"
import {
  Users,
  ShoppingBag,
  Package,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Tag,
  Grid3X3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { useGetDashboardStatsQuery } from "@/store/services/analyticsApi"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryDescription, setNewCategoryDescription] = useState("")
  const [editingCategory, setEditingCategory] = useState<any>(null)
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
  const { data: dashboardStats, isLoading: isLoadingDashboardStats } = useGetDashboardStatsQuery()

  const [deleteUser] = useDeleteUserMutation()
  const [deleteOrder] = useDeleteOrderMutation()

  // Use real-time stats from backend
  const totalUsers = dashboardStats?.total_users || 0
  const totalOrders = dashboardStats?.total_orders || 0
  const totalProducts = dashboardStats?.total_products || 0
  const totalRevenue = dashboardStats?.total_revenue ?? dashboardStats?.total_sales ?? 0;
  const usersChange = dashboardStats?.users_change || 0
  const ordersChange = dashboardStats?.orders_change || 0
  const productsChange = dashboardStats?.products_change || 0
  const revenueChange = dashboardStats?.revenue_change || 0
  const customersCount = dashboardStats?.customers_count || 0
  const sellersCount = dashboardStats?.sellers_count || 0
  const adminsCount = dashboardStats?.admins_count || 0

  const userTypeData = [
    { name: "Customers", value: customersCount },
    { name: "Sellers", value: sellersCount },
    { name: "Admins", value: adminsCount },
  ]

  const COLORS = ["#F3C998", "#F3C998AA", "#F3C99877"]

  const recentUsers = users?.slice(0, 5) || []
  const recentOrders = orders?.slice(0, 5) || []

  const isLoading =
    isLoadingUserStats || isLoadingUsers || isLoadingOrders || isLoadingProducts || isLoadingDashboardStats

  // Use live categories from backend
  const { data: categories = [], isLoading: isLoadingCategories, refetch: refetchCategories } = useGetCategoriesQuery()
  const [createCategory] = useCreateCategoryMutation()
  const [updateCategory] = useUpdateCategoryMutation()
  const [deleteCategory] = useDeleteCategoryMutation()

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("newest");
  const [productSortOrder, setProductSortOrder] = useState<string>("newest");

  // Filter and sort orders based on dropdowns
  const filteredOrders = (orders || [])
    .filter(order => statusFilter === "all" || order.status === statusFilter)
    .sort((a, b) => {
      if (sortOrder === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortOrder === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortOrder === "highest") return Number(b.total_price || 0) - Number(a.total_price || 0);
      if (sortOrder === "lowest") return Number(a.total_price || 0) - Number(b.total_price || 0);
      return 0;
    });

  const sortedProducts = [...(products || [])].sort((a, b) => {
    if (productSortOrder === "newest") return new Date(b.created_at ?? '').getTime() - new Date(a.created_at ?? '').getTime();
    if (productSortOrder === "price_asc") return Number(a.price) - Number(b.price);
    if (productSortOrder === "price_desc") return Number(b.price) - Number(a.price);
    if (productSortOrder === "name_asc") return a.name.localeCompare(b.name);
    if (productSortOrder === "name_desc") return b.name.localeCompare(a.name);
    return 0;
  });

  useEffect(() => {
    console.log("Admin orders data:", orders)
    console.log("Admin orders error:", ordersError)
    const token = localStorage.getItem("token")
    console.log("Auth token available:", token ? "Yes" : "No")
    if (ordersError) {
      console.error("Admin orders error details:", ordersError)
    }
  }, [orders, ordersError])

  // Category management functions
  // Update add/edit/delete handlers to use backend mutations
  const handleAddCategory = async () => {
    if (newCategoryName.trim()) {
      await createCategory(
        (() => {
          const formData = new FormData()
          formData.append('name', newCategoryName)
          formData.append('description', newCategoryDescription)
          return formData
        })()
      ).unwrap()
      setNewCategoryName("")
      setNewCategoryDescription("")
      refetchCategories()
    }
  }
  const handleEditCategory = (category: any) => {
    setEditingCategory(category)
    setNewCategoryName(category.name)
    setNewCategoryDescription(category.description)
  }
  const handleUpdateCategory = async () => {
    if (editingCategory && newCategoryName.trim()) {
      await updateCategory({
        id: editingCategory.id,
        formData: (() => {
          const formData = new FormData()
          formData.append('name', newCategoryName)
          formData.append('description', newCategoryDescription)
          return formData
        })()
      }).unwrap()
      setEditingCategory(null)
      setNewCategoryName("")
      setNewCategoryDescription("")
      refetchCategories()
    }
  }
  const handleDeleteCategory = async (categoryId: number) => {
    if (window.confirm("Are you sure you want to delete this category? This action cannot be undone.")) {
      await deleteCategory(categoryId).unwrap()
      refetchCategories()
    }
  }

  const handleCancelEdit = () => {
    setEditingCategory(null)
    setNewCategoryName("")
    setNewCategoryDescription("")
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
                          <h3 className="text-3xl font-bold text-white">{totalUsers}</h3>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 text-emerald-400">
                        <ArrowUpRight className="h-5 w-5" />
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
                          <h3 className="text-3xl font-bold text-white">{totalOrders}</h3>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 text-emerald-400">
                        <ArrowUpRight className="h-5 w-5" />
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
                          <h3 className="text-3xl font-bold text-white">{totalProducts}</h3>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 text-emerald-400">
                        <ArrowUpRight className="h-5 w-5" />
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
                          <h3 className="text-3xl font-bold text-white">${totalRevenue.toFixed(2)}</h3>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 text-red-400">
                        <ArrowDownRight className="h-5 w-5" />
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
                              <TableHead className="text-gray-300 font-semibold text-base">Seller</TableHead>
                              <TableHead className="text-gray-300 font-semibold text-base">Date</TableHead>
                              <TableHead className="text-gray-300 font-semibold text-base">Status</TableHead>
                              <TableHead className="text-gray-300 font-semibold text-base text-right">Amount</TableHead>
                              <TableHead className="text-gray-300 font-semibold text-base">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {recentOrders.map((order) => (
                              <TableRow
                                key={order.id}
                                className="border-white/10 hover:bg-white/5 transition-colors duration-300"
                              >
                                <TableCell className="font-medium text-white text-base">#{order.id}</TableCell>
                                <TableCell className="text-gray-300 text-base">
                                  {order.customer_full_name || order.customer_username || "Unknown"}
                                </TableCell>
                                <TableCell className="text-gray-300 text-base">
                                  {order.seller_names || "Unknown"}
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
                                            : order.status === "processing"
                                              ? "bg-blue-400/20 text-blue-300 border-blue-400/30 px-3 py-1"
                                              : order.status === "shipped"
                                                ? "bg-indigo-400/20 text-indigo-300 border-indigo-400/30 px-3 py-1"
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
                                    {currentUser?.role === "admin" && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-red-500/30 text-red-300 hover:bg-red-500/10 hover:border-red-500/50 transition-all duration-300 bg-transparent backdrop-blur-sm"
                                        onClick={() => {
                                          if (
                                            window.confirm(
                                              "Are you sure you want to delete this order? This action cannot be undone.",
                                            )
                                          ) {
                                            deleteOrder(order.id).unwrap().then(refetchOrders)
                                          }
                                        }}
                                      >
                                        Delete
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <p className="text-gray-400 mb-6 text-xl">No recent orders found</p>
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
                            {currentUser?.role === "admin" && (
                              <TableCell>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteUser(user.id)}
                                  className="border-red-500/30 text-red-300 hover:bg-red-500/20 hover:border-red-500/50 transition-all duration-300 backdrop-blur-sm"
                                >
                                  Delete
                                </Button>
                              </TableCell>
                            )}
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
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="w-48 bg-white/10 border-white/20 text-white focus:ring-2 focus:ring-[#F3C998] focus:border-[#F3C998] placeholder:text-gray-400 transition-colors duration-200">
                            <SelectValue placeholder="All Statuses" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#2A2F3A] border-white/20">
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={sortOrder} onValueChange={setSortOrder}>
                          <SelectTrigger className="w-48 bg-white/10 border-white/20 text-white focus:ring-2 focus:ring-[#F3C998] focus:border-[#F3C998] placeholder:text-gray-400 transition-colors duration-200">
                            <SelectValue placeholder="Newest First" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#2A2F3A] border-white/20">
                            <SelectItem value="newest">Newest First</SelectItem>
                            <SelectItem value="oldest">Oldest First</SelectItem>
                            <SelectItem value="highest">Highest Amount</SelectItem>
                            <SelectItem value="lowest">Lowest Amount</SelectItem>
                          </SelectContent>
                        </Select>
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
                    ) : filteredOrders.length > 0 ? (
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
                            {filteredOrders.map((order) => (
                              <TableRow
                                key={order.id}
                                className="border-white/10 hover:bg-white/5 transition-colors duration-300"
                              >
                                <TableCell className="font-medium text-white text-base">#{order.id}</TableCell>
                                <TableCell className="text-gray-300 text-base">
                                  {order.customer_full_name || order.customer_username || "Customer"}
                                </TableCell>
                                <TableCell className="text-gray-300 text-base">
                                  {order.seller_names || "Unknown"}
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
                                            : order.status === "processing"
                                              ? "bg-blue-400/20 text-blue-300 border-blue-400/30 px-3 py-1"
                                              : order.status === "shipped"
                                                ? "bg-indigo-400/20 text-indigo-300 border-indigo-400/30 px-3 py-1"
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
                                    {currentUser?.role === "admin" && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-red-500/30 text-red-300 hover:bg-red-500/10 hover:border-red-500/50 transition-all duration-300 bg-transparent backdrop-blur-sm"
                                        onClick={() => {
                                          if (
                                            window.confirm(
                                              "Are you sure you want to delete this order? This action cannot be undone.",
                                            )
                                          ) {
                                            deleteOrder(order.id).unwrap().then(refetchOrders)
                                          }
                                        }}
                                      >
                                        Delete
                                      </Button>
                                    )}
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
                  <div className="flex justify-end mb-6">
                    <Select value={productSortOrder} onValueChange={setProductSortOrder}>
                      <SelectTrigger className="w-56 bg-white/10 border border-white/20 text-white focus:ring-2 focus:ring-[#F3C998] focus:border-[#F3C998] placeholder:text-gray-400 transition-colors duration-200">
                        <SelectValue placeholder="Sort by..." />
                      </SelectTrigger>
                      <SelectContent className="bg-[#2A2F3A] border-white/20">
                        <SelectItem value="newest" className="text-white hover:bg-white/10">Newest Arrivals</SelectItem>
                        <SelectItem value="price_asc" className="text-white hover:bg-white/10">Price: Low to High</SelectItem>
                        <SelectItem value="price_desc" className="text-white hover:bg-white/10">Price: High to Low</SelectItem>
                        <SelectItem value="name_asc" className="text-white hover:bg-white/10">Name: A to Z</SelectItem>
                        <SelectItem value="name_desc" className="text-white hover:bg-white/10">Name: Z to A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                        {sortedProducts?.map((product) => (
                          <TableRow
                            key={product.id}
                            className="border-white/10 hover:bg-white/5 transition-colors duration-300"
                          >
                            <TableCell className="font-medium text-white text-base">#{product.id}</TableCell>
                            <TableCell className="text-white text-base">{product.name}</TableCell>
                            <TableCell className="text-gray-300 text-base">
                              {product.seller_name || product.seller_username || "Unknown"}
                            </TableCell>
                            <TableCell className="text-gray-300 text-base">
                              {product.category_details?.name || "Unknown"}
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
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-white text-2xl font-bold flex items-center gap-3">
                        <div className="p-3 rounded-2xl shadow-lg" style={{ backgroundColor: "#F3C998" }}>
                          <Grid3X3 className="h-6 w-6 text-[#1D212D]" />
                        </div>
                        Category Management
                      </CardTitle>
                      <CardDescription className="text-gray-300 text-lg mt-2">
                        Create, edit, and manage product categories
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        className="px-4 py-2 text-sm border-white/20"
                        style={{ backgroundColor: "rgba(243, 201, 152, 0.2)", color: "#F3C998" }}
                      >
                        <Tag className="h-4 w-4 mr-2" />
                        {categories.length} Categories
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Add/Edit Category Form */}
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
                    <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
                      <Plus className="h-5 w-5" style={{ color: "#F3C998" }} />
                      {editingCategory ? "Edit Category" : "Add New Category"}
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="categoryName" className="text-white/90 font-medium">
                          Category Name
                        </Label>
                        <Input
                          id="categoryName"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="Enter category name"
                          className="bg-white/5 backdrop-blur-sm border-white/20 focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all text-white placeholder:text-white/60"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="categoryDescription" className="text-white/90 font-medium">
                          Description
                        </Label>
                        <Input
                          id="categoryDescription"
                          value={newCategoryDescription}
                          onChange={(e) => setNewCategoryDescription(e.target.value)}
                          placeholder="Enter category description"
                          className="bg-white/5 backdrop-blur-sm border-white/20 focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all text-white placeholder:text-white/60"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <Button
                        onClick={editingCategory ? handleUpdateCategory : handleAddCategory}
                        disabled={!newCategoryName.trim()}
                        className="shadow-lg transition-all duration-200 border border-white/20"
                        style={{ backgroundColor: "#F3C998", color: "#1D212D" }}
                      >
                        {editingCategory ? (
                          <>
                            <Edit className="h-4 w-4 mr-2" />
                            Update Category
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Category
                          </>
                        )}
                      </Button>
                      {editingCategory && (
                        <Button
                          onClick={handleCancelEdit}
                          variant="outline"
                          className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 backdrop-blur-sm bg-transparent"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Categories List */}
                  <div className="space-y-4">
                    <h3 className="text-white text-lg font-semibold flex items-center gap-2">
                      <Grid3X3 className="h-5 w-5" style={{ color: "#F3C998" }} />
                      Existing Categories
                    </h3>

                    {isLoadingCategories ? (
                      <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F3C998]"></div>
                      </div>
                    ) : categories.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-white/20 hover:bg-white/5">
                              <TableHead className="text-gray-300 font-semibold text-base">ID</TableHead>
                              <TableHead className="text-gray-300 font-semibold text-base">Name</TableHead>
                              <TableHead className="text-gray-300 font-semibold text-base">Description</TableHead>
                              <TableHead className="text-gray-300 font-semibold text-base">Products</TableHead>
                              <TableHead className="text-gray-300 font-semibold text-base">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {categories.map((category) => (
                              <TableRow
                                key={category.id}
                                className="border-white/10 hover:bg-white/5 transition-colors duration-300"
                              >
                                <TableCell className="font-medium text-white text-base">#{category.id}</TableCell>
                                <TableCell className="text-white text-base font-medium">{category.name}</TableCell>
                                <TableCell className="text-gray-300 text-base max-w-xs truncate">
                                  {category.description || "No description"}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    className="px-3 py-1 border-white/20"
                                    style={{ backgroundColor: "rgba(243, 201, 152, 0.2)", color: "#F3C998" }}
                                  >
                                    {(products?.filter(p => (typeof p.category === 'number' ? p.category === category.id : p.category?.id === category.id || p.category_id === category.id)).length) || 0} products
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEditCategory(category)}
                                      className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 backdrop-blur-sm"
                                    >
                                      <Edit className="h-4 w-4 mr-1" />
                                      Edit
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDeleteCategory(category.id)}
                                      className="border-red-500/30 text-red-300 hover:bg-red-500/10 hover:border-red-500/50 transition-all duration-300 bg-transparent backdrop-blur-sm"
                                    >
                                      <Trash2 className="h-4 w-4 mr-1" />
                                      Delete
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-16 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg">
                        <div
                          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
                          style={{ backgroundColor: "rgba(243, 201, 152, 0.2)" }}
                        >
                          <Grid3X3 className="h-8 w-8" style={{ color: "#F3C998" }} />
                        </div>
                        <p className="text-gray-400 mb-4 text-xl">No categories found</p>
                        <p className="text-sm text-gray-500 mb-6">
                          Create your first category to organize products on the platform.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Category Statistics */}
                  <div className="grid gap-6 md:grid-cols-3">
                    <Card className="bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-300 mb-1">Total Categories</p>
                            <h3 className="text-2xl font-bold text-white">{categories.length}</h3>
                          </div>
                          <div
                            className="p-3 rounded-xl shadow-lg"
                            style={{ backgroundColor: "rgba(243, 201, 152, 0.2)" }}
                          >
                            <Grid3X3 className="h-6 w-6" style={{ color: "#F3C998" }} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-300 mb-1">Total Products</p>
                            <h3 className="text-2xl font-bold text-white">
                              {products?.length || 0}
                            </h3>
                          </div>
                          <div
                            className="p-3 rounded-xl shadow-lg"
                            style={{ backgroundColor: "rgba(243, 201, 152, 0.2)" }}
                          >
                            <Package className="h-6 w-6" style={{ color: "#F3C998" }} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
