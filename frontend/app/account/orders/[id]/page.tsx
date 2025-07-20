"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useGetOrderQuery, useCancelOrderMutation } from "@/store/services/orderApi"
import { useAddProductReviewMutation } from "@/store/services/reviewApi"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Package, Truck, AlertTriangle, Loader2, Star, MessageSquare } from "lucide-react"
import Link from "next/link"
import HeaderWrapper from "@/app/header-wrapper"
import Footer from "@/components/layout/footer"

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [isCancelling, setIsCancelling] = useState(false)
  const [reviewingProduct, setReviewingProduct] = useState<number | null>(null)
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: "" })

  const orderId = typeof params?.id === "string" ? Number.parseInt(params.id) : 0
  const { data: order, isLoading, error } = useGetOrderQuery(orderId)
  const [cancelOrder] = useCancelOrderMutation()
  const [addReview] = useAddProductReviewMutation()

  const handleCancelOrder = async () => {
    if (!order) return

    if (window.confirm("Are you sure you want to cancel this order?")) {
      setIsCancelling(true)
      try {
        await cancelOrder(order.id).unwrap()
        toast({
          title: "Order Cancelled",
          description: "Your order has been cancelled successfully.",
        })
      } catch (error) {
        console.error("Error cancelling order:", error)
        toast({
          title: "Error",
          description: "There was a problem cancelling your order. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsCancelling(false)
      }
    }
  }

  const handleReviewSubmit = async (productId: number) => {
    if (reviewForm.rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a rating before submitting.",
        variant: "destructive",
      })
      return
    }

    if (!reviewForm.comment.trim()) {
      toast({
        title: "Comment required",
        description: "Please write a comment before submitting.",
        variant: "destructive",
      })
      return
    }

    try {
      await addReview({
        product_id: productId,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      }).unwrap()

      toast({
        title: "Review submitted",
        description: "Thank you for your feedback!",
      })

      setReviewForm({ rating: 0, comment: "" })
      setReviewingProduct(null)
    } catch (error) {
      console.error("Error submitting review:", error)
      toast({
        title: "Error",
        description: "There was a problem submitting your review. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleRatingChange = (rating: number) => {
    setReviewForm((prev) => ({ ...prev, rating }))
  }

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReviewForm((prev) => ({ ...prev, comment: e.target.value }))
  }

  const getOrderSteps = (status: string) => {
    const steps = [
      { name: "Pending", completed: true },
      { name: "Processing", completed: ["processing", "shipped", "delivered"].includes(status) },
      { name: "Shipped", completed: ["shipped", "delivered"].includes(status) },
      { name: "Delivered", completed: status === "delivered" },
    ]
    return steps
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

  const orderSteps = getOrderSteps(order.status)

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
            <div className="mb-6">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 backdrop-blur-sm"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-white text-2xl">Order #{order.id}</CardTitle>
                        <CardDescription className="text-gray-300 text-lg">
                          Placed on {new Date(order.created_at).toLocaleDateString()}
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
                    {/* Order Progress */}
                    {order.status !== "cancelled" && (
                      <div className="mb-8">
                        <h3 className="text-lg font-medium mb-6 text-white">Order Progress</h3>
                        <div className="relative">
                          <div
                            className="overflow-hidden h-3 mb-6 text-xs flex rounded-full"
                            style={{ backgroundColor: "#2A2F3A" }}
                          >
                            <div
                              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500"
                              style={{
                                backgroundColor: "#F3C998",
                                width: `${
                                  order.status === "pending"
                                    ? "25%"
                                    : order.status === "processing"
                                      ? "50%"
                                      : order.status === "shipped"
                                        ? "75%"
                                        : order.status === "delivered"
                                          ? "100%"
                                          : "0%"
                                }`,
                              }}
                            ></div>
                          </div>
                          <div className="flex justify-between">
                            {orderSteps.map((step, index) => (
                              <div key={index} className="text-center">
                                <div
                                  className={`h-8 w-8 rounded-full mx-auto mb-2 flex items-center justify-center font-semibold transition-all duration-300 ${
                                    step.completed ? "text-[#1D212D] shadow-lg" : "bg-gray-600 text-gray-300"
                                  }`}
                                  style={step.completed ? { backgroundColor: "#F3C998" } : {}}
                                >
                                  {index + 1}
                                </div>
                                <div className="text-sm text-white font-medium">{step.name}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Order Items */}
                    <div>
                      <h3 className="text-lg font-medium mb-6 text-white">Order Items</h3>
                      <div className="bg-white/5 rounded-xl overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-white/20 hover:bg-white/5">
                              <TableHead className="text-gray-300 font-semibold text-base">Product</TableHead>
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
                                  <div className="flex flex-col">
                                    <span>{item.product_details?.name || `Product #${item.product}`}</span>
                                    {order.status === "delivered" && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-2 w-fit border-[#F3C998]/30 text-[#F3C998] hover:bg-[#F3C998]/10 hover:border-[#F3C998]/50 transition-all duration-300 backdrop-blur-sm"
                                        onClick={() => setReviewingProduct(item.product)}
                                      >
                                        <MessageSquare className="mr-2 h-4 w-4" />
                                        Write Review
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-gray-300 text-base">
                                  $
                                  {typeof item.price === "number"
                                    ? item.price.toFixed(2)
                                    : item.price
                                      ? Number(item.price).toFixed(2)
                                      : "0.00"}
                                </TableCell>
                                <TableCell className="text-gray-300 text-base">{item.quantity}</TableCell>
                                <TableCell className="text-right text-white font-semibold text-base">
                                  $
                                  {typeof item.subtotal === "number"
                                    ? item.subtotal.toFixed(2)
                                    : item.subtotal
                                      ? Number(item.subtotal).toFixed(2)
                                      : "0.00"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
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
              </div>

              <div>
                <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                  <CardHeader>
                    <CardTitle className="text-white text-2xl">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between text-base">
                        <span className="text-gray-300">Subtotal</span>
                        <span className="text-white font-semibold">
                          $
                          {typeof order.total_amount === "number"
                            ? order.total_amount.toFixed(2)
                            : order.total_amount
                              ? Number(order.total_amount).toFixed(2)
                              : "0.00"}
                        </span>
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
                        <span style={{ color: "#F3C998" }}>
                          $
                          {typeof order.total_amount === "number"
                            ? order.total_amount.toFixed(2)
                            : order.total_amount
                              ? Number(order.total_amount).toFixed(2)
                              : "0.00"}
                        </span>
                      </div>
                    </div>
                    <div className="mt-8 space-y-4">
                      <div className="flex items-center text-base">
                        <Package className="h-5 w-5 mr-3 text-gray-400" />
                        <span className="text-gray-300">
                          Payment Method: {order.payment?.payment_method || "Credit Card"}
                        </span>
                      </div>
                      {order.status === "pending" && (
                        <Button
                          variant="outline"
                          className="w-full border-red-500/30 text-red-300 hover:bg-red-500/10 hover:border-red-500/50 transition-all duration-300 backdrop-blur-sm bg-transparent"
                          onClick={handleCancelOrder}
                          disabled={isCancelling}
                        >
                          {isCancelling ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Cancelling...
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="mr-2 h-4 w-4" />
                              Cancel Order
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        className="w-full border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 backdrop-blur-sm bg-transparent"
                        asChild
                      >
                        <Link href="/account/orders">View All Orders</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Review Modal */}
        {reviewingProduct && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl max-w-md w-full">
              <CardHeader>
                <CardTitle className="text-white text-xl">Write a Review</CardTitle>
                <CardDescription className="text-gray-300">
                  Share your experience with this product
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Your Rating</label>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleRatingChange(i + 1)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`h-6 w-6 ${
                            i < reviewForm.rating
                              ? "text-[#F3C998] fill-[#F3C998]"
                              : "text-gray-400 hover:text-[#F3C998]"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Your Review</label>
                  <Textarea
                    placeholder="Share your thoughts about this product..."
                    value={reviewForm.comment}
                    onChange={handleCommentChange}
                    rows={4}
                    className="bg-white/5 border-white/20 text-white placeholder-gray-400"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setReviewingProduct(null)
                    setReviewForm({ rating: 0, comment: "" })
                  }}
                  className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 backdrop-blur-sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleReviewSubmit(reviewingProduct)}
                  className="bg-[#F3C998] text-[#1D212D] hover:bg-[#F3C998]/90 transition-all duration-300"
                >
                  Submit Review
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        <Footer />
      </HeaderWrapper>
    </div>
  )
}
