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
import { ArrowLeft, Truck, Loader2, CheckCircle, User, Mail, Phone } from "lucide-react"
import Link from "next/link"
import HeaderWrapper from "@/app/header-wrapper"
import Footer from "@/components/layout/footer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { formatCurrency } from "@/utils/format-utils"

export default function AdminOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [isUpdating, setIsUpdating] = useState(false)
  const [trackingNumber, setTrackingNumber] = useState("")
  const [newStatus, setNewStatus] = useState("")
  const [adminNotes, setAdminNotes] = useState("")

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
          // In a real app, we would also send admin notes
          // admin_notes: adminNotes
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
      <HeaderWrapper>
        <div
          className="min-h-screen relative overflow-hidden flex justify-center items-center"
          style={{ backgroundColor: "#1D212D" }}
        >
          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              className="absolute top-20 left-20 w-4 h-4 rounded-full opacity-30"
              style={{ backgroundColor: "#F3C998" }}
            ></div>
            <div
              className="absolute top-32 right-32 w-2 h-2 rounded-full opacity-40"
              style={{ backgroundColor: "#F3C998" }}
            ></div>
            <div
              className="absolute bottom-40 left-40 w-3 h-3 rounded-full opacity-25"
              style={{ backgroundColor: "#F3C998" }}
            ></div>
          </div>
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
        <Footer />
      </HeaderWrapper>
    )
  }

  if (error || !order) {
    return (
      <HeaderWrapper>
        <div
          className="min-h-screen relative overflow-hidden flex justify-center items-center px-4"
          style={{ backgroundColor: "#1D212D" }}
        >
          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              className="absolute top-20 left-20 w-4 h-4 rounded-full opacity-30"
              style={{ backgroundColor: "#F3C998" }}
            ></div>
            <div
              className="absolute top-32 right-32 w-2 h-2 rounded-full opacity-40"
              style={{ backgroundColor: "#F3C998" }}
            ></div>
            <div
              className="absolute bottom-40 left-40 w-3 h-3 rounded-full opacity-25"
              style={{ backgroundColor: "#F3C998" }}
            ></div>
          </div>
          <Card
            className="backdrop-blur-xl bg-white/5 border-white/10 shadow-2xl max-w-md w-full"
            style={{ boxShadow: `0 25px 50px -12px rgba(243, 201, 152, 0.1)` }}
          >
            <CardHeader>
              <CardTitle className="text-red-400 text-white">Error Loading Order</CardTitle>
              <CardDescription className="text-white/80">
                We couldn't find the order you're looking for. It may have been deleted or you may not have permission
                to view it.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button
                onClick={() => router.back()}
                className="w-full text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 border border-white/20"
                style={{ backgroundColor: "#F3C998", color: "#1D212D" }}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </CardFooter>
          </Card>
        </div>
        <Footer />
      </HeaderWrapper>
    )
  }

  return (
    <HeaderWrapper>
      <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: "#1D212D" }}>
        {/* Elegant brand-colored background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Decorative circles and stars */}
          <div
            className="absolute top-20 left-20 w-4 h-4 rounded-full opacity-30"
            style={{ backgroundColor: "#F3C998" }}
          ></div>
          <div
            className="absolute top-32 right-32 w-2 h-2 rounded-full opacity-40"
            style={{ backgroundColor: "#F3C998" }}
          ></div>
          <div
            className="absolute bottom-40 left-40 w-3 h-3 rounded-full opacity-25"
            style={{ backgroundColor: "#F3C998" }}
          ></div>
          <div
            className="absolute top-1/2 right-20 w-6 h-6 rounded-full opacity-20"
            style={{ backgroundColor: "#F3C998" }}
          ></div>
          {/* Star shapes */}
          <div className="absolute top-24 right-24">
            <div
              className="w-3 h-3 opacity-30"
              style={{
                backgroundColor: "#F3C998",
                clipPath:
                  "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
              }}
            ></div>
          </div>
          <div className="absolute bottom-32 right-16">
            <div
              className="w-4 h-4 opacity-25"
              style={{
                backgroundColor: "#F3C998",
                clipPath:
                  "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
              }}
            ></div>
          </div>
          {/* Abstract geometric shapes */}
          <div
            className="absolute bottom-20 left-32 w-12 h-12 opacity-10 transform rotate-45"
            style={{ backgroundColor: "#F3C998" }}
          ></div>
          <div
            className="absolute top-40 left-16 w-8 h-8 opacity-15 rounded-full"
            style={{ backgroundColor: "#F3C998" }}
          ></div>
          <div
            className="absolute top-32 right-20 w-10 h-10 opacity-10 rounded-full"
            style={{ backgroundColor: "#F3C998" }}
          ></div>
          <div
            className="absolute bottom-20 right-16 w-6 h-6 opacity-15 transform rotate-45"
            style={{ backgroundColor: "#F3C998" }}
          ></div>
        </div>

        <div className="container mx-auto py-8 relative z-10">
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="bg-white/5 backdrop-blur-sm border-white/20 text-white hover:bg-white/10 transition-all duration-200"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card
                className="backdrop-blur-xl bg-white/5 border-white/10 shadow-2xl"
                style={{ boxShadow: `0 25px 50px -12px rgba(243, 201, 152, 0.1)` }}
              >
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-white text-2xl font-bold">Order #{order.id}</CardTitle>
                      <CardDescription className="text-white/80">
                        Placed on {new Date(order.created_at).toLocaleDateString()} by {order.customer_full_name}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={
                        order.status === "delivered"
                          ? "default"
                          : order.status === "cancelled"
                            ? "destructive"
                            : order.status === "pending"
                              ? "outline"
                              : "secondary"
                      }
                      className={`text-sm py-1 px-3 ${
                        order.status === "delivered"
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
                          : order.status === "cancelled"
                            ? "bg-red-500/20 text-red-300 border-red-400/30"
                            : "bg-white/10 text-white/90 border-white/20"
                      }`}
                    >
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Order Items */}
                  <div>
                    <h3 className="text-sm font-medium mb-4 text-white/90">Order Items</h3>
                    <div className="backdrop-blur-sm bg-white/5 rounded-lg border border-white/10 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-white/10 hover:bg-white/5">
                            <TableHead className="text-white/80">Product</TableHead>
                            <TableHead className="text-white/80">Seller</TableHead>
                            <TableHead className="text-white/80">Price</TableHead>
                            <TableHead className="text-white/80">Quantity</TableHead>
                            <TableHead className="text-right text-white/80">Subtotal</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {order.items.map((item) => (
                            <TableRow key={item.id} className="border-white/10 hover:bg-white/5">
                              <TableCell className="font-medium text-white">
                                {item.product_details ? item.product_details.name : "Product no longer available"}
                              </TableCell>
                              <TableCell className="text-white/80">
                                {item.product_details
                                  ? item.product_details.seller_name || item.product_details.seller_username
                                  : "Seller unknown"}
                              </TableCell>
                              <TableCell className="text-white/80">
                                {item.product_details ? formatCurrency(Number(item.price) || 0) : "N/A"}
                              </TableCell>
                              <TableCell className="text-white/80">
                                {item.product_details ? item.quantity : "N/A"}
                              </TableCell>
                              <TableCell className="text-right text-white">
                                {item.product_details ? formatCurrency(Number(item.price) * Number(item.quantity) || 0) : "N/A"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Payment Information */}
                  <div>
                    <h3 className="text-sm font-medium mb-2 text-white/90">Payment Information</h3>
                    <div className="bg-white/5 backdrop-blur-sm p-4 rounded-md border border-white/10">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-white/60">Payment Method</p>
                          <p className="text-sm font-medium text-white">
                            {order.payment?.payment_method || "Credit Card"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-white/60">Payment Status</p>
                          <p className="text-sm font-medium text-white">{order.payment?.status || "Completed"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-white/60">Transaction ID</p>
                          <p className="text-sm font-medium text-white">{order.payment?.transaction_id || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-white/60">Payment Date</p>
                          <p className="text-sm font-medium text-white">
                            {order.payment?.created_at
                              ? new Date(order.payment.created_at).toLocaleDateString()
                              : new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Information */}
                <Card
                  className="backdrop-blur-xl bg-white/5 border-white/10 shadow-2xl"
                  style={{ boxShadow: `0 25px 50px -12px rgba(243, 201, 152, 0.1)` }}
                >
                  <CardHeader>
                    <CardTitle className="text-base text-white">Customer Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-white/60" />
                        <span className="text-sm text-white">{order.customer_full_name}</span>
                      </div>
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-white/60" />
                        <span className="text-sm text-white">customer@example.com</span>
                      </div>
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-white/60" />
                        <span className="text-sm text-white">+1 (555) 123-4567</span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full bg-white/5 backdrop-blur-sm border-white/20 text-white hover:bg-white/10 transition-all duration-200"
                        asChild
                      >
                        <Link href={`/admin/customers/${order.customer}`}>View Customer Profile</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Shipping Information */}
                <Card
                  className="backdrop-blur-xl bg-white/5 border-white/10 shadow-2xl"
                  style={{ boxShadow: `0 25px 50px -12px rgba(243, 201, 152, 0.1)` }}
                >
                  <CardHeader>
                    <CardTitle className="text-base text-white">Shipping Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-white">{order.shipping_address}</p>
                      {order.tracking_number && (
                        <div className="flex items-center">
                          <Truck className="h-4 w-4 mr-2 text-white/60" />
                          <span className="text-sm text-white">Tracking: {order.tracking_number}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-6">
              <Card
                className="backdrop-blur-xl bg-white/5 border-white/10 shadow-2xl"
                style={{ boxShadow: `0 25px 50px -12px rgba(243, 201, 152, 0.1)` }}
              >
                <CardHeader>
                  <CardTitle className="text-white">Order Management</CardTitle>
                  <CardDescription className="text-white/80">Update order status and tracking</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="status" className="text-sm font-semibold text-white/90">
                        Update Status
                      </Label>
                      <Select onValueChange={(value) => setNewStatus(value)} defaultValue={order.status}>
                        <SelectTrigger
                          id="status"
                          className="bg-white/5 backdrop-blur-sm border-white/20 focus:border-[#F3C998] focus:ring-2 focus:ring-white/20 transition-all duration-200 text-white"
                        >
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1D212D] border-white/20 backdrop-blur-xl">
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
                      <Label htmlFor="tracking" className="text-sm font-semibold text-white/90">
                        Tracking Number
                      </Label>
                      <Input
                        id="tracking"
                        placeholder="Enter tracking number"
                        value={trackingNumber || order.tracking_number || ""}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        className="bg-white/5 backdrop-blur-sm border-white/20 focus:border-[#F3C998] focus:ring-2 focus:ring-white/20 transition-all duration-200 text-white placeholder:text-white/60"
                      />
                    </div>
                    <div>
                      <Label htmlFor="admin-notes" className="text-sm font-semibold text-white/90">
                        Admin Notes
                      </Label>
                      <Textarea
                        id="admin-notes"
                        placeholder="Add internal notes about this order"
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        className="bg-white/5 backdrop-blur-sm border-white/20 focus:border-[#F3C998] focus:ring-2 focus:ring-white/20 transition-all duration-200 text-white placeholder:text-white/60"
                      />
                    </div>
                    <Button
                      className="w-full h-12 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 border border-white/20"
                      style={{ backgroundColor: "#F3C998", color: "#1D212D" }}
                      onClick={handleUpdateStatus}
                      disabled={isUpdating || (!newStatus && !trackingNumber && !adminNotes)}
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
                </CardContent>
              </Card>

              <Card
                className="backdrop-blur-xl bg-white/5 border-white/10 shadow-2xl"
                style={{ boxShadow: `0 25px 50px -12px rgba(243, 201, 152, 0.1)` }}
              >
                <CardHeader>
                  <CardTitle className="text-white">Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-white/80">Subtotal</span>
                      <span className="text-white">${formatCurrency(Number(order.total_price) || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/80">Shipping</span>
                      <span className="text-white">Free</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/80">Tax</span>
                      <span className="text-white">Included</span>
                    </div>
                    <Separator className="my-2 bg-white/20" />
                    <div className="flex justify-between font-bold">
                      <span className="text-white">Total</span>
                      <span className="text-white">${formatCurrency(Number(order.total_price) || 0)}</span>
                    </div>
                  </div>
                  <div className="mt-6">
                    <Button
                      variant="outline"
                      className="w-full bg-white/5 backdrop-blur-sm border-white/20 text-white hover:bg-white/10 transition-all duration-200"
                      asChild
                    >
                      <Link href="/admin/orders">View All Orders</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </HeaderWrapper>
  )
}
