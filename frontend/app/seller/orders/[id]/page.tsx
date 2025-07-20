"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useGetOrderQuery, useUpdateOrderStatusMutation } from "@/store/services/orderApi"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Package, Truck, Loader2, CheckCircle } from "lucide-react"
import Link from "next/link"
import HeaderWrapper from "@/app/header-wrapper"
import Footer from "@/components/layout/footer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/utils/format-utils"
import { motion } from "framer-motion"

export default function SellerOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [isUpdating, setIsUpdating] = useState(false)
  const [trackingNumber, setTrackingNumber] = useState("")
  const [newStatus, setNewStatus] = useState("")

  const orderId = typeof params?.id === "string" ? Number.parseInt(params.id) : 0
  const { data: order, isLoading, error, refetch } = useGetOrderQuery(orderId)
  const [updateOrderStatus] = useUpdateOrderStatusMutation()

  const handleUpdateStatus = async () => {
    if (!order || !newStatus) return

    setIsUpdating(true)
    try {
      await updateOrderStatus({
        orderId: order.id,
        data: {
          status: newStatus as any,
          tracking_number: trackingNumber || undefined,
        },
      }).unwrap()
      toast({
        title: "Order Updated",
        description: "The order status has been updated successfully.",
      })
      refetch()
    } catch (error) {
      console.error("Error updating order:", error)
      toast({
        title: "Error",
        description: "There was a problem updating the order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
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

  if (error || !order) {
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
            <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl max-w-md">
              <CardHeader>
                <CardTitle className="text-red-400">Error Loading Order</CardTitle>
                <CardDescription className="text-gray-300">
                  We couldn't find the order you're looking for. It may have been deleted or you may not have permission
                  to view it.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button
                  onClick={() => router.back()}
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 backdrop-blur-sm"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go Back
                </Button>
              </CardFooter>
            </Card>
          </div>
          <Footer />
        </HeaderWrapper>
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

      <HeaderWrapper>
        <div className="relative z-10 min-h-screen w-full p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-6"
            >
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 backdrop-blur-sm"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Orders
              </Button>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="lg:col-span-2"
              >
                <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-white text-2xl">Order #{order.id}</CardTitle>
                        <CardDescription className="text-gray-300 text-lg">
                          Placed on {new Date(order.created_at).toLocaleDateString()} by {order.customer_username}
                        </CardDescription>
                      </div>
                      <Badge
                        className={
                          order.status === "delivered"
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 px-4 py-2 text-base"
                            : order.status === "cancelled"
                              ? "bg-red-500/20 text-red-300 border-red-500/30 px-4 py-2 text-base"
                              : order.status === "pending"
                                ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30 px-4 py-2 text-base"
                                : "bg-blue-500/20 text-blue-300 border-blue-500/30 px-4 py-2 text-base"
                        }
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {/* Order Items */}
                    <div>
                      <h3 className="text-lg font-medium mb-6 text-white">Order Items</h3>
                      <div className="bg-white/5 rounded-xl overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-white/20 hover:bg-white/5">
                              <TableHead className="text-gray-300 font-semibold text-base">Product</TableHead>
                              <TableHead className="text-gray-300 font-semibold text-base">Seller</TableHead>
                              <TableHead className="text-gray-300 font-semibold text-base">Price</TableHead>
                              <TableHead className="text-gray-300 font-semibold text-base">Quantity</TableHead>
                              <TableHead className="text-gray-300 font-semibold text-base text-right">
                                Subtotal
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {order.items.map((item) => (
                              <TableRow
                                key={item.id}
                                className="border-white/10 hover:bg-white/5 transition-colors duration-300"
                              >
                                <TableCell className="font-medium text-white text-base">
                                  <div className="flex items-center space-x-3">
                                    {item.product_details?.images?.[0]?.image ? (
                                      <img
                                        src={item.product_details.images[0].image}
                                        alt={item.product_details?.name || 'Product'}
                                        className="w-12 h-12 object-cover rounded-lg"
                                      />
                                    ) : (
                                      <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center">
                                        <Package className="h-6 w-6 text-gray-400" />
                                      </div>
                                    )}
                                    <div>
                                      <div className="font-medium">{item.product_details?.name || `Product #${item.product}`}</div>
                                      <div className="text-sm text-gray-400">
                                        {item.product_details?.category_details?.name || 'Uncategorized'}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-gray-300 text-base">
                                  {item.seller_name || item.seller_username || item.product_details?.seller_name || item.product_details?.seller_username || 'Unknown Seller'}
                                </TableCell>
                                <TableCell className="text-gray-300 text-base">${typeof item.price === 'number' ? item.price.toFixed(2) : Number(item.price).toFixed(2)}</TableCell>
                                <TableCell className="text-gray-300 text-base">{item.quantity}</TableCell>
                                <TableCell className="text-right text-white font-semibold text-base">
                                  ${typeof item.subtotal === 'number' ? item.subtotal.toFixed(2) : Number(item.subtotal).toFixed(2)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    {/* Customer Information */}
                    <div>
                      <h3 className="text-lg font-medium mb-4 text-white">Customer Information</h3>
                      <div className="bg-white/5 p-6 rounded-xl">
                        <p className="text-white font-medium text-base">Customer: {order.customer_full_name || order.user_username || order.customer_username}</p>
                        <p className="text-gray-300 mt-2 text-base">Customer ID: {order.user || order.customer}</p>
                        <p className="text-gray-300 mt-1 text-base">Email: {order.user_email || 'Not provided'}</p>
                      </div>
                    </div>

                    {/* Shipping Information */}
                    <div>
                      <h3 className="text-lg font-medium mb-4 text-white">Shipping Information</h3>
                      <div className="bg-white/5 p-6 rounded-xl">
                        <p className="text-gray-300 text-base">{order.shipping_address}</p>
                        {order.tracking_number && (
                          <div className="mt-4 flex items-center text-base">
                            <Truck className="h-5 w-5 mr-2" style={{ color: "#F3C998" }} />
                            <span className="text-white">Tracking: {order.tracking_number}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Notes */}
                    {order.notes && (
                      <div>
                        <h3 className="text-lg font-medium mb-4 text-white">Order Notes</h3>
                        <div className="bg-white/5 p-6 rounded-xl">
                          <p className="text-gray-300 text-base">{order.notes}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                  <CardHeader>
                    <CardTitle className="text-white text-2xl">Order Management</CardTitle>
                    <CardDescription className="text-gray-300 text-lg">
                      Update order status and tracking
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="status" className="text-white font-medium text-base">
                          Update Status
                        </Label>
                        <Select onValueChange={(value) => setNewStatus(value)} defaultValue={order.status}>
                          <SelectTrigger
                            id="status"
                            className="bg-white/5 border-white/20 text-white hover:bg-white/10 focus:bg-white/10 mt-2"
                          >
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#2A2F3A] border-white/20">
                            <SelectItem value="pending" className="text-white hover:bg-white/10">
                              Pending
                            </SelectItem>
                            <SelectItem value="processing" className="text-white hover:bg-white/10">
                              Processing
                            </SelectItem>
                            <SelectItem value="shipped" className="text-white hover:bg-white/10">
                              Shipped
                            </SelectItem>
                            <SelectItem value="delivered" className="text-white hover:bg-white/10">
                              Delivered
                            </SelectItem>
                            <SelectItem value="cancelled" className="text-white hover:bg-white/10">
                              Cancelled
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="tracking" className="text-white font-medium text-base">
                          Tracking Number
                        </Label>
                        <Input
                          id="tracking"
                          placeholder="Enter tracking number"
                          value={trackingNumber || order.tracking_number || ""}
                          onChange={(e) => setTrackingNumber(e.target.value)}
                          className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 hover:bg-white/10 focus:bg-white/10 mt-2"
                        />
                      </div>
                      <Button
                        className="w-full bg-gradient-to-r from-[#F3C998] to-[#E6B87D] hover:from-[#E6B87D] hover:to-[#D4A574] text-[#1D212D] font-semibold transition-all duration-300"
                        onClick={handleUpdateStatus}
                        disabled={isUpdating || (!newStatus && !trackingNumber)}
                      >
                        {isUpdating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Update Order
                          </>
                        )}
                      </Button>
                    </div>
                    <Separator className="my-6 bg-white/20" />
                    <div className="space-y-4">
                      <div className="flex justify-between text-base">
                        <span className="text-gray-300">Subtotal</span>
                        <span className="text-white font-semibold">${typeof order.total_price === 'number' ? order.total_price.toFixed(2) : Number(order.total_price).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-base">
                        <span className="text-gray-300">Shipping</span>
                        <span className="text-white">Free</span>
                      </div>
                      <div className="flex justify-between text-base">
                        <span className="text-gray-300">Tax</span>
                        <span className="text-white">Included</span>
                      </div>
                      <Separator className="my-4 bg-white/20" />
                      <div className="flex justify-between font-bold text-xl">
                        <span className="text-white">Total</span>
                        <span style={{ color: "#F3C998" }}>${typeof order.total_price === 'number' ? order.total_price.toFixed(2) : Number(order.total_price).toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="mt-8 space-y-4">
                      <div className="flex items-center text-base">
                        <Package className="h-5 w-5 mr-3 text-gray-400" />
                        <span className="text-gray-300">
                          Payment Method: {order.payment?.payment_method || "Credit Card"}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 backdrop-blur-sm bg-transparent"
                        asChild
                      >
                        <Link href="/dashboard?tab=orders">View All Orders</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
        <Footer />
      </HeaderWrapper>
    </div>
  )
}
