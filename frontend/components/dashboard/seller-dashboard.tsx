"use client"

import { useState, useEffect, useMemo } from "react"
import { useSelector } from "react-redux"
import { useSearchParams } from "next/navigation"
import type { RootState } from "@/store"
import { useGetDashboardStatsQuery } from "@/store/services/analyticsApi"
import { useGetSellerOrdersQuery, useGetRecentOrdersQuery } from "@/store/services/orderApi"
import { useGetProductsQuery, useGetLowStockProductsQuery, useDeleteProductMutation } from "@/store/services/productApi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  type PieLabelRenderProps,
} from "recharts"
import { Users, ShoppingBag, Package, DollarSign, ArrowRight, Plus } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { Product } from "@/app/types/product"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

const formatCurrency = (value: any): string => {
  if (value === undefined || value === null) return "0.00"
  if (typeof value === "number") {
    return value.toFixed(2)
  }
  if (typeof value === "string") {
    const num = Number.parseFloat(value)
    if (!isNaN(num)) {
      return num.toFixed(2)
    }
  }
  return "0.00"
}

export default function SellerDashboard() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("overview")
  const user = useSelector((state: RootState) => state.auth.user)
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortOrder, setSortOrder] = useState<string>("newest")
  const [productSortOrder, setProductSortOrder] = useState<string>("newest")

  useEffect(() => {
    const tabParam = searchParams.get("tab")
    if (tabParam && ["overview", "products", "orders", "analytics"].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  const {
    data: allProducts,
    isLoading: isLoadingProducts,
    error: productsError,
    refetch: refetchProducts,
  } = useGetProductsQuery(undefined, { skip: !user?.id })

  const products = allProducts?.filter(
    (product) => product.seller === user?.id || product.seller_username === user?.username,
  )

  const sortedProducts = [...(products || [])].sort((a, b) => {
    if (productSortOrder === "newest")
      return new Date(b.created_at ?? "").getTime() - new Date(a.created_at ?? "").getTime()
    if (productSortOrder === "price_asc") return Number(a.price) - Number(b.price)
    if (productSortOrder === "price_desc") return Number(b.price) - Number(a.price)
    if (productSortOrder === "name_asc") return a.name.localeCompare(b.name)
    if (productSortOrder === "name_desc") return b.name.localeCompare(a.name)
    return 0
  })

  const { data: stats, isLoading: isLoadingStats } = useGetDashboardStatsQuery()

  const {
    data: orders,
    isLoading: isLoadingOrders,
    error: ordersError,
    refetch,
  } = useGetSellerOrdersQuery({
    sellerId: user?.id,
    sellerUsername: user?.username,
  })

  const { data: recentOrders, isLoading: isLoadingRecentOrders } = useGetRecentOrdersQuery({
    sellerId: user?.id,
    sellerUsername: user?.username,
    limit: 5,
  })

  const { data: lowStockProducts, isLoading: isLoadingLowStock } = useGetLowStockProductsQuery(5)

  const [deleteProduct, { isLoading: isDeletingProduct }] = useDeleteProductMutation()

  // Filter and sort orders based on dropdowns
  const filteredOrders = (orders || [])
    .filter((order) => statusFilter === "all" || order.status === statusFilter)
    .sort((a, b) => {
      if (sortOrder === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sortOrder === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      if (sortOrder === "highest") return Number(b.total_price || 0) - Number(a.total_price || 0)
      if (sortOrder === "lowest") return Number(a.total_price || 0) - Number(b.total_price || 0)
      return 0
    })

  const handleRefreshProducts = () => {
    refetchProducts()
    toast({
      title: "Refreshing products",
      description: "Fetching the latest product data from the server.",
    })
  }

  const handleDeleteProduct = async (productId: number) => {
    if (window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      try {
        setIsDeleting(true)
        await deleteProduct(productId).unwrap()
        toast({
          title: "Product deleted",
          description: "The product has been successfully deleted.",
        })
        refetchProducts()
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete the product. Please check console for details.",
          variant: "destructive",
        })
      } finally {
        setIsDeleting(false)
      }
    }
  }

  // Use backend analytics data for sales performance
  const salesData = useMemo(() => {
    if (!stats?.sales_by_month || stats.sales_by_month.length === 0) return []

    return stats.sales_by_month.map((month) => ({
      name: month.name,
      sales: month.sales,
      orders: month.orders,
    }))
  }, [stats?.sales_by_month])

  // Use backend analytics data for top selling products
  const topProducts = useMemo(() => {
    if (!stats?.top_selling_products || stats.top_selling_products.length === 0) return []

    return stats.top_selling_products.map((product) => ({
      name: product.product_name,
      value: product.total_sales,
      quantity: product.total_quantity,
    }))
  }, [stats?.top_selling_products])

  const COLORS = ["#F3C998", "#F3C998AA", "#F3C99877", "#F3C99855", "#F3C99833"]

  const isLoading = isLoadingStats || isLoadingOrders || isLoadingRecentOrders || isLoadingProducts || isLoadingLowStock

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
                Seller <span style={{ color: "#F3C998" }}>Dashboard</span>
              </h2>
              <p className="text-gray-400 text-lg">Manage your products, orders, and analytics</p>
            </div>
            <Link href="/seller/products/new">
              <Button
                size="lg"
                className="text-[#1D212D] font-semibold hover:scale-105 transition-all duration-300 shadow-xl"
                style={{ backgroundColor: "#F3C998" }}
              >
                <Plus className="mr-2 h-5 w-5" />
                Add New Product
              </Button>
            </Link>
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
                value="products"
                className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-300 hover:text-white transition-all duration-300 data-[state=active]:shadow-lg"
              >
                Products
              </TabsTrigger>
              <TabsTrigger
                value="orders"
                className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-300 hover:text-white transition-all duration-300 data-[state=active]:shadow-lg"
              >
                Orders
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-300 hover:text-white transition-all duration-300 data-[state=active]:shadow-lg"
              >
                Analytics
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
                          <DollarSign className="h-8 w-8 text-[#1D212D]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-300 mb-1">Total Sales</p>
                          <h3 className="text-3xl font-bold text-white">
                            ${formatCurrency(stats?.total_sales || 0)}
                          </h3>
                        </div>
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
                          <h3 className="text-3xl font-bold text-white">{stats?.total_orders || 0}</h3>
                        </div>
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
                          <h3 className="text-3xl font-bold text-white">{stats?.total_products || 0}</h3>
                        </div>
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
                          <Users className="h-8 w-8 text-[#1D212D]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-300 mb-1">Customers</p>
                          <h3 className="text-3xl font-bold text-white">
                            {stats?.total_customers || 0}
                          </h3>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-8 md:grid-cols-2">
                <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-white text-2xl font-bold">Sales Overview</CardTitle>
                    <CardDescription className="text-gray-300 text-lg">Monthly sales performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={salesData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                          <XAxis dataKey="name" stroke="#F3C998" />
                          <YAxis stroke="#F3C998" domain={[0, 'dataMax + 10']} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#1D212D",
                              border: "1px solid #F3C998",
                              borderRadius: "8px",
                              color: "#ffffff",
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="sales"
                            stroke="#F3C998"
                            strokeWidth={3}
                            activeDot={{ r: 8, fill: "#F3C998" }}
                            connectNulls={false}
                            dot={{ fill: "#F3C998", strokeWidth: 2, r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                      {salesData.length === 0 && (
                        <div className="text-center py-8 text-gray-400 text-lg">No sales data available.</div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-white text-2xl font-bold">Top Products</CardTitle>
                    <CardDescription className="text-gray-300 text-lg">Products by sales revenue</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={topProducts}
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
                            {topProducts?.map((entry: { name: any; value: any }, index: number) => (
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
              </div>

              <div className="grid gap-8 md:grid-cols-2">
                <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-white text-2xl font-bold">Recent Orders</CardTitle>
                    <CardDescription className="text-gray-300 text-lg">Latest customer orders</CardDescription>
                  </CardHeader>
                  <CardContent>
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
                        {recentOrders && recentOrders.length > 0 ? (
                          recentOrders.map((order) => (
                            <TableRow
                              key={order.id}
                              className="border-white/10 hover:bg-white/5 transition-colors duration-300"
                            >
                              <TableCell className="font-medium text-white text-base">#{order.id}</TableCell>
                              <TableCell className="text-gray-300 text-base">
                                {order.customer_full_name ||
                                  order.user_username ||
                                  order.customer_username ||
                                  "Customer"}
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
                                  : Number(order.total_price).toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-gray-400 text-lg">
                              No recent orders found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                    <div className="mt-6 flex justify-end">
                      <Button
                        size="lg"
                        className="text-[#1D212D] font-semibold hover:scale-105 transition-all duration-300 shadow-xl"
                        style={{ backgroundColor: "#F3C998" }}
                        onClick={() => setActiveTab("orders")}
                      >
                        View All Orders
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-white text-2xl font-bold">Low Stock Alert</CardTitle>
                    <CardDescription className="text-gray-300 text-lg">Products that need restocking</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/20 hover:bg-white/5">
                          <TableHead className="text-gray-300 font-semibold text-base">Product</TableHead>
                          <TableHead className="text-gray-300 font-semibold text-base">Category</TableHead>
                          <TableHead className="text-gray-300 font-semibold text-base">Stock</TableHead>
                          <TableHead className="text-gray-300 font-semibold text-base">Price</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products && products.length > 0 ? (
                          products
                            .filter((p) => (p.stock || 0) < 10)
                            .slice(0, 5)
                            .map((product: Product) => (
                              <TableRow
                                key={product.id}
                                className="border-white/10 hover:bg-white/5 transition-colors duration-300"
                              >
                                <TableCell className="font-medium text-white text-base">{product.name}</TableCell>
                                <TableCell className="text-gray-300 text-base">
                                  {product.category_details?.name || product.category_name || "Uncategorized"}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    className={
                                      (product.stock || 0) <= 0
                                        ? "bg-red-500/20 text-red-300 border-red-500/30 px-3 py-1"
                                        : (product.stock || 0) < 5
                                          ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30 px-3 py-1"
                                          : "bg-blue-500/20 text-blue-300 border-blue-500/30 px-3 py-1"
                                    }
                                  >
                                    {product.stock || 0}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-white text-base">
                                  $
                                  {typeof product.price === "number"
                                    ? product.price.toFixed(2)
                                    : Number(product.price).toFixed(2)}
                                </TableCell>
                              </TableRow>
                            ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-gray-400 text-lg">
                              No low stock products found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                    <div className="mt-6 flex justify-end">
                      <Button
                        size="lg"
                        className="text-[#1D212D] font-semibold hover:scale-105 transition-all duration-300 shadow-xl"
                        style={{ backgroundColor: "#F3C998" }}
                        onClick={() => setActiveTab("products")}
                      >
                        Manage Products
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="products" className="space-y-8 mt-8">
              <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                <CardHeader className="flex flex-row items-center justify-between pb-6">
                  <div>
                    <CardTitle className="text-white text-2xl font-bold">Product Inventory</CardTitle>
                    <CardDescription className="text-gray-300 text-lg">Manage your product listings</CardDescription>
                  </div>
                  <div className="flex space-x-4">
                    <Button
                      size="lg"
                      className="text-[#1D212D] font-semibold hover:scale-105 transition-all duration-300 shadow-xl"
                      style={{ backgroundColor: "#F3C998" }}
                      onClick={handleRefreshProducts}
                    >
                      Refresh
                    </Button>
                    <Link href="/seller/products/new">
                      <Button
                        size="lg"
                        className="text-[#1D212D] font-semibold hover:scale-105 transition-all duration-300 shadow-lg"
                        style={{ backgroundColor: "#F3C998" }}
                      >
                        Add New Product
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {productsError && (
                    <div className="mb-6 p-6 bg-red-500/20 border border-red-500/30 rounded-lg backdrop-blur-sm">
                      <h3 className="text-red-300 font-medium text-lg">API Error:</h3>
                      <pre className="text-sm overflow-auto p-3 bg-black/20 rounded mt-3 text-red-200">
                        {JSON.stringify(productsError, null, 2)}
                      </pre>
                    </div>
                  )}

                  <div className="flex justify-end mb-6">
                    <Select value={productSortOrder} onValueChange={setProductSortOrder}>
                      <SelectTrigger className="w-56 bg-white/10 border border-white/20 text-white focus:ring-2 focus:ring-[#F3C998] focus:border-[#F3C998] placeholder:text-gray-400 transition-colors duration-200">
                        <SelectValue placeholder="Sort by..." />
                      </SelectTrigger>
                      <SelectContent className="bg-[#2A2F3A] border-white/20">
                        <SelectItem value="newest" className="text-white hover:bg-white/10">
                          Newest Arrivals
                        </SelectItem>
                        <SelectItem value="price_asc" className="text-white hover:bg-white/10">
                          Price: Low to High
                        </SelectItem>
                        <SelectItem value="price_desc" className="text-white hover:bg-white/10">
                          Price: High to Low
                        </SelectItem>
                        <SelectItem value="name_asc" className="text-white hover:bg-white/10">
                          Name: A to Z
                        </SelectItem>
                        <SelectItem value="name_desc" className="text-white hover:bg-white/10">
                          Name: Z to A
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {isLoadingProducts ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F3C998]"></div>
                    </div>
                  ) : sortedProducts && sortedProducts.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-white/20 hover:bg-white/5">
                            <TableHead className="text-gray-300 font-semibold text-base">Product ID</TableHead>
                            <TableHead className="text-gray-300 font-semibold text-base">Name</TableHead>
                            <TableHead className="text-gray-300 font-semibold text-base">Category</TableHead>
                            <TableHead className="text-gray-300 font-semibold text-base">Stock</TableHead>
                            <TableHead className="text-gray-300 font-semibold text-base">Price</TableHead>
                            <TableHead className="text-gray-300 font-semibold text-base">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sortedProducts?.map((product: Product) => (
                            <TableRow
                              key={product.id}
                              className="border-white/10 hover:bg-white/5 transition-colors duration-300"
                            >
                              <TableCell className="font-medium text-white text-base">#{product.id}</TableCell>
                              <TableCell className="text-white text-base">{product.name}</TableCell>
                              <TableCell className="text-gray-300 text-base">
                                {product.category_details?.name || product.category_name || "Uncategorized"}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={
                                    (product.stock || 0) <= 0
                                      ? "bg-red-500/20 text-red-300 border-red-500/30 px-3 py-1"
                                      : (product.stock || 0) < 5
                                        ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30 px-3 py-1"
                                        : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 px-3 py-1"
                                  }
                                >
                                  {product.stock || 0}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-white text-base">
                                $
                                {typeof product.price === "number"
                                  ? product.price.toFixed(2)
                                  : Number(product.price).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-3">
                                  <Link href={`/seller/products/${product.id}/edit`}>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 bg-transparent backdrop-blur-sm"
                                    >
                                      Edit
                                    </Button>
                                  </Link>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-red-500/30 text-red-300 hover:bg-red-500/10 hover:border-red-500/50 transition-all duration-300 bg-transparent backdrop-blur-sm"
                                    onClick={() => handleDeleteProduct(product.id)}
                                  >
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
                    <div className="text-center py-16">
                      <p className="text-gray-400 mb-8 text-xl">You haven't added any products yet.</p>
                      <Link href="/seller/products/new">
                        <Button
                          size="lg"
                          className="text-[#1D212D] font-semibold hover:scale-105 transition-all duration-300 shadow-lg"
                          style={{ backgroundColor: "#F3C998" }}
                        >
                          Add Your First Product
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders" className="space-y-8 mt-8">
              <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                <CardHeader className="flex flex-row items-center justify-between pb-6">
                  <div>
                    <CardTitle className="text-white text-2xl font-bold">Order Management</CardTitle>
                    <CardDescription className="text-gray-300 text-lg">
                      Track and manage customer orders
                    </CardDescription>
                  </div>
                  <div className="flex space-x-3">
                    <Button
                      size="lg"
                      className="text-[#1D212D] font-semibold hover:scale-105 transition-all duration-300 shadow-xl"
                      style={{ backgroundColor: "#F3C998" }}
                      onClick={() => refetch()}
                    >
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {ordersError && (
                    <div className="mb-6 p-6 bg-red-500/20 border border-red-500/30 rounded-lg backdrop-blur-sm">
                      <h3 className="text-red-300 font-medium text-lg">API Error:</h3>
                      <pre className="text-sm overflow-auto p-3 bg-black/20 rounded mt-3 text-red-200">
                        {JSON.stringify(ordersError, null, 2)}
                      </pre>
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex space-x-3">
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
                      </div>
                    </div>

                    {isLoadingOrders ? (
                      <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F3C998]" />
                      </div>
                    ) : filteredOrders && filteredOrders.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-white/20 hover:bg-white/5">
                              <TableHead className="text-gray-300 font-semibold text-base">Order ID</TableHead>
                              <TableHead className="text-gray-300 font-semibold text-base">Customer</TableHead>
                              <TableHead className="text-gray-300 font-semibold text-base">Date</TableHead>
                              <TableHead className="text-gray-300 font-semibold text-base">Status</TableHead>
                              <TableHead className="text-gray-300 font-semibold text-base">Items</TableHead>
                              <TableHead className="text-gray-300 font-semibold text-base text-right">Amount</TableHead>
                              <TableHead className="text-gray-300 font-semibold text-base">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredOrders.map((order) => (
                              <TableRow
                                key={order.id}
                                className="border-white/10 hover:bg-[#F3C998]/10 hover:text-[#F3C998] transition-colors duration-200 cursor-pointer"
                              >
                                <TableCell className="font-medium text-white text-base">#{order.id}</TableCell>
                                <TableCell className="text-gray-300 text-base">
                                  {order.customer_full_name ||
                                    order.user_username ||
                                    order.customer_username ||
                                    "Customer"}
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
                                <TableCell className="text-right text-white font-semibold text-base">
                                  $
                                  {typeof order.total_price === "number"
                                    ? order.total_price.toFixed(2)
                                    : Number(order.total_price).toFixed(2)}
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-3">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      asChild
                                      className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 bg-transparent backdrop-blur-sm"
                                    >
                                      <Link href={`/seller/orders/${order.id}`}>Details</Link>
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-[#1D212D] font-semibold hover:scale-105 transition-all duration-300 shadow-lg bg-transparent"
                                      style={{ backgroundColor: "#F3C998" }}
                                      onClick={() => {
                                        alert(`Update status for order #${order.id}`)
                                      }}
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
                        <p className="text-gray-400 mb-8 text-xl">No orders found for your products.</p>
                        <Button
                          size="lg"
                          className="text-white font-semibold hover:scale-105 transition-all duration-300 shadow-lg bg-[#1D212D] border border-white/20"
                          onClick={() => refetch()}
                        >
                          Try Again
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-8 mt-8">
              <div className="grid gap-8 md:grid-cols-2">
                <Card className="col-span-2 bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-white text-2xl font-bold">Sales Performance</CardTitle>
                    <CardDescription className="text-gray-300 text-lg">Monthly revenue and order count</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={salesData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                          <XAxis dataKey="name" stroke="#F3C998" />
                          <YAxis yAxisId="left" stroke="#F3C998" domain={[0, 'dataMax + 10']} />
                          <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" domain={[0, 'dataMax + 1']} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#1D212D",
                              border: "1px solid #F3C998",
                              borderRadius: "8px",
                              color: "#ffffff",
                            }}
                          />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="sales"
                            stroke="#F3C998"
                            strokeWidth={3}
                            activeDot={{ r: 8, fill: "#F3C998" }}
                            name="Sales ($)"
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="orders"
                            stroke="#82ca9d"
                            strokeWidth={2}
                            activeDot={{ r: 6, fill: "#82ca9d" }}
                            name="Orders"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                      {salesData.length === 0 && (
                        <div className="text-center py-8 text-gray-400 text-lg">No sales data available.</div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-white text-2xl font-bold">Top Selling Products</CardTitle>
                    <CardDescription className="text-gray-300 text-lg">Products with highest sales revenue</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {topProducts && topProducts.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow className="border-white/20 hover:bg-white/5">
                            <TableHead className="text-gray-300 font-semibold text-base">Product</TableHead>
                            <TableHead className="text-gray-300 font-semibold text-base text-center">Quantity</TableHead>
                            <TableHead className="text-gray-300 font-semibold text-base text-right">Revenue</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {topProducts.map((product, index) => (
                            <TableRow
                              key={index}
                              className="border-white/10 hover:bg-white/5 transition-colors duration-300"
                            >
                              <TableCell className="font-medium text-white text-base">
                                {product.name}
                              </TableCell>
                              <TableCell className="text-center text-white font-semibold text-base">
                                {product.quantity || 0}
                              </TableCell>
                              <TableCell className="text-right text-white font-semibold text-base">
                                ${formatCurrency(product.value)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-gray-400 text-lg">
                        No top selling products data available
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-white text-2xl font-bold">Sales by Category</CardTitle>
                    <CardDescription className="text-gray-300 text-lg">
                      Revenue distribution by product category
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={
                              stats && stats.sales_by_category && stats.sales_by_category.length > 0
                                ? stats.sales_by_category
                                : [{ name: "No Data", value: 1 }]
                            }
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#F3C998"
                            dataKey="value"
                            label={({ name, percent }: PieLabelRenderProps) =>
                              `${name}: ${((percent || 0) * 100).toFixed(1)}%`
                            }
                          >
                            {(stats && stats.sales_by_category && stats.sales_by_category.length > 0
                              ? stats.sales_by_category
                              : [{ name: "No Data", value: 1 }]
                            ).map((entry: { name: string; value: number }, index: number) => (
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
                      {(!stats || !stats.sales_by_category || stats.sales_by_category.length === 0) && (
                        <div className="text-center py-8 text-gray-400 text-lg">No category sales data available.</div>
                      )}
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
