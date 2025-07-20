"use client"

import { useState, useEffect } from "react"
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
import { Users, ShoppingBag, Package, DollarSign, ArrowUpRight, ArrowDownRight, ArrowRight, Plus } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { Product } from "@/app/types/product"
import { useToast } from "@/components/ui/use-toast"

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

  // For sales overview and analytics charts, use stats.sales_by_month only.
  const salesData = stats?.sales_by_month || [];

  const topProducts =
    products
      ?.slice(0, 5)
      .sort((a: Product, b: Product) => (b.stock || 0) - (a.stock || 0))
      .map((product: Product) => ({
        name: product.name,
        value: product.stock || 0,
      })) || []

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
                          <h3 className="text-3xl font-bold text-white">${formatCurrency(stats?.total_sales || 0)}</h3>
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
                          <h3 className="text-3xl font-bold text-white">{orders?.length || 0}</h3>
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
                          <h3 className="text-3xl font-bold text-white">{products?.length || 0}</h3>
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
                          <h3 className="text-3xl font-bold text-white">{stats?.total_customers || orders?.length || 0}</h3>
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
                          <YAxis stroke="#F3C998" />
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
                    <CardDescription className="text-gray-300 text-lg">Products by inventory level</CardDescription>
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
                              <TableCell className="text-gray-300 text-base">{order.customer_full_name || order.user_username || order.customer_username || 'Customer'}</TableCell>
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
                                ${typeof order.total_price === 'number' ? order.total_price.toFixed(2) : Number(order.total_price).toFixed(2)}
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
                        style={{ backgroundColor: '#F3C998' }}
                        onClick={() => setActiveTab('orders')}
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
                                  {product.category_name || "Uncategorized"}
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
                        style={{ backgroundColor: '#F3C998' }}
                        onClick={() => setActiveTab('products')}
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
                      style={{ backgroundColor: '#F3C998' }}
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

                  {isLoadingProducts ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F3C998]"></div>
                    </div>
                  ) : products && products.length > 0 ? (
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
                          {products?.map((product: Product) => (
                            <TableRow
                              key={product.id}
                              className="border-white/10 hover:bg-white/5 transition-colors duration-300"
                            >
                              <TableCell className="font-medium text-white text-base">#{product.id}</TableCell>
                              <TableCell className="text-white text-base">{product.name}</TableCell>
                              <TableCell className="text-gray-300 text-base">
                              {product.category_details?.name || "Uncategorized"}
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
                      style={{ backgroundColor: '#F3C998' }}
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

                  {isLoadingOrders ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F3C998]"></div>
                    </div>
                  ) : orders && orders.length > 0 ? (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <div className="flex space-x-3">
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
                              console.log("Sort by:", e.target.value)
                            }}
                          >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="highest">Highest Amount</option>
                            <option value="lowest">Lowest Amount</option>
                          </select>
                        </div>
                      </div>

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
                            {orders.map((order) => (
                              <TableRow
                                key={order.id}
                                className="border-white/10 hover:bg-[#F3C998]/10 hover:text-[#F3C998] transition-colors duration-200 cursor-pointer"
                              >
                                <TableCell className="font-medium text-white text-base">#{order.id}</TableCell>
                                <TableCell className="text-gray-300 text-base">
                                  {order.customer_full_name || order.user_username || order.customer_username || "Customer"}
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
                                  ${typeof order.total_price === 'number' ? order.total_price.toFixed(2) : Number(order.total_price).toFixed(2)}
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
                                      className="text-[#1D212D] font-semibold hover:scale-105 transition-all duration-300 shadow-lg"
                                      style={{ backgroundColor: '#F3C998' }}
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
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <p className="text-gray-400 mb-6 text-xl">No orders found for your products.</p>
                      <p className="text-sm text-gray-500 mb-8">
                        This could be because you don't have any orders yet, or there might be an issue with the API
                        connection.
                      </p>
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => refetch()}
                        className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 backdrop-blur-sm"
                      >
                        Try Again
                      </Button>
                    </div>
                  )}
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
                        <BarChart data={salesData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                          <XAxis dataKey="name" stroke="#F3C998" />
                          <YAxis stroke="#F3C998" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#1D212D",
                              border: "1px solid #F3C998",
                              borderRadius: "8px",
                              color: "#ffffff",
                            }}
                          />
                          <Bar dataKey="sales" fill="#F3C998" name="Sales ($)" />
                        </BarChart>
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
                    <CardDescription className="text-gray-300 text-lg">Products with highest sales</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/20 hover:bg-white/5">
                          <TableHead className="text-gray-300 font-semibold text-base">Product</TableHead>
                          <TableHead className="text-gray-300 font-semibold text-base">Units Sold</TableHead>
                          <TableHead className="text-gray-300 font-semibold text-base text-right">Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stats?.top_selling_products?.map(
                          (product: {
                            product_id: number
                            product_name: string
                            total_quantity: number
                            total_sales: number
                          }) => (
                            <TableRow
                              key={product.product_id}
                              className="border-white/10 hover:bg-white/5 transition-colors duration-300"
                            >
                              <TableCell className="font-medium text-white text-base">{product.product_name}</TableCell>
                              <TableCell className="text-gray-300 text-base">{product.total_quantity}</TableCell>
                              <TableCell className="text-right text-white font-semibold text-base">
                                ${formatCurrency(product.total_sales)}
                              </TableCell>
                            </TableRow>
                          ),
                        )}
                      </TableBody>
                    </Table>
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
                            data={[
                              { name: "Electronics", value: 4000 },
                              { name: "Clothing", value: 3000 },
                              { name: "Home", value: 2000 },
                              { name: "Books", value: 1000 },
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#F3C998"
                            dataKey="value"
                            label={({ name, percent }: PieLabelRenderProps) => `${name}: ${(percent ?? 0) * 100}%`}
                          >
                            {COLORS.map((color, index) => (
                              <Cell key={`cell-${index}`} fill={color} />
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
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
