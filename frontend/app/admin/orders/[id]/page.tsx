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
        <div className="container mx-auto py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
        <Footer />
      </HeaderWrapper>
    )
  }

  if (error || !order) {
    return (
      <HeaderWrapper>
        <div className="container mx-auto py-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-500">Error Loading Order</CardTitle>
              <CardDescription>
                We couldn't find the order you're looking for. It may have been deleted or you may not have permission
                to view it.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => router.back()}>
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
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Order #{order.id}</CardTitle>
                    <CardDescription>
                      Placed on {new Date(order.created_at).toLocaleDateString()} by {order.customer_username}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      order.status === "delivered"
                        ? "success"
                        : order.status === "cancelled"
                          ? "destructive"
                          : order.status === "pending"
                            ? "outline"
                            : "secondary"
                    }
                    className="text-sm py-1 px-3"
                  >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Order Items */}
                <div>
                  <h3 className="text-sm font-medium mb-4">Order Items</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Seller</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.product_details?.name || `Product #${item.product}`}
                          </TableCell>
                          <TableCell>{item.product_details?.seller_username || "Unknown"}</TableCell>
                          <TableCell>${formatCurrency(item.price)}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell className="text-right">${formatCurrency(item.subtotal)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Payment Information */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Payment Information</h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Payment Method</p>
                        <p className="text-sm font-medium">{order.payment?.payment_method || "Credit Card"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Payment Status</p>
                        <p className="text-sm font-medium">{order.payment?.status || "Completed"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Transaction ID</p>
                        <p className="text-sm font-medium">{order.payment?.transaction_id || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Payment Date</p>
                        <p className="text-sm font-medium">
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
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Customer Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-sm">{order.customer_username}</span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-sm">customer@example.com</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-sm">+1 (555) 123-4567</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href={`/admin/customers/${order.customer}`}>View Customer Profile</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Shipping Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm">{order.shipping_address}</p>

                    {order.tracking_number && (
                      <div className="flex items-center">
                        <Truck className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm">Tracking: {order.tracking_number}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Management</CardTitle>
                <CardDescription>Update order status and tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="status">Update Status</Label>
                    <Select onValueChange={(value) => setNewStatus(value)} defaultValue={order.status}>
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="tracking">Tracking Number</Label>
                    <Input
                      id="tracking"
                      placeholder="Enter tracking number"
                      value={trackingNumber || order.tracking_number || ""}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="admin-notes">Admin Notes</Label>
                    <Textarea
                      id="admin-notes"
                      placeholder="Add internal notes about this order"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                    />
                  </div>

                  <Button
                    className="w-full"
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

            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${formatCurrency(order.total_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>Included</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>${formatCurrency(order.total_amount)}</span>
                  </div>
                </div>

                <div className="mt-6">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/admin/orders">View All Orders</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </HeaderWrapper>
  )
}
