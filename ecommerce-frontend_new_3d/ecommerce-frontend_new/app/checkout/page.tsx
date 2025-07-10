"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useGetCartQuery, useClearCartMutation } from "@/store/services/cartApi"
import { useCheckoutMutation } from "@/store/services/orderApi"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { ShoppingBag, CreditCard, Loader2 } from "lucide-react"
import Link from "next/link"
import HeaderWrapper from "@/app/header-wrapper"
import Footer from "@/components/layout/footer"

const checkoutFormSchema = z.object({
  shipping_address: z.string().min(10, {
    message: "Shipping address must be at least 10 characters.",
  }),
  billing_address: z.string().min(10, {
    message: "Billing address must be at least 10 characters.",
  }),
  payment_method: z.enum(["credit_card", "paypal", "bank_transfer"], {
    required_error: "Please select a payment method.",
  }),
  notes: z.string().optional(),
})

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>

export default function CheckoutPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: cart, isLoading: isLoadingCart, error: cartError } = useGetCartQuery()
  const [clearCart] = useClearCartMutation()
  const [checkout] = useCheckoutMutation()

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      shipping_address: "",
      billing_address: "",
      payment_method: "credit_card",
      notes: "",
    },
  })

  const onSubmit = async (values: CheckoutFormValues) => {
    if (!cart || cart.items.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Your cart is empty. Please add items before checkout.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Add total_price to the payload
      const payload = {
        ...values,
        total_price: cart?.shipping_info?.grand_total || cart?.total_amount || 0
      }
      const result = await checkout(payload).unwrap()
      await clearCart()
      toast({
        title: "Order Placed Successfully",
        description: "Your order has been placed and is being processed.",
      })
      router.push("/checkout/success")
    } catch (error) {
      console.error("Checkout error:", error)
      toast({
        title: "Checkout Failed",
        description: "There was a problem processing your order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoadingCart) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#1D212D] via-[#2A2F3A] to-[#1D212D]">
        <div className="relative w-24 h-24">
          <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-t-[#F3C998] border-r-transparent border-b-[#F3C998]/50 border-l-transparent animate-spin"></div>
          <div className="absolute top-2 left-2 w-20 h-20 rounded-full border-4 border-t-transparent border-r-[#F3C998]/70 border-b-transparent border-l-[#F3C998] animate-spin"></div>
        </div>
      </div>
    )
  }

  if (cartError) {
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
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-12 shadow-2xl text-center max-w-md">
              <h2 className="text-2xl font-bold mb-6 text-white">Error Loading Cart</h2>
              <p className="text-gray-300 mb-8">There was a problem loading your cart. Please try again later.</p>
              <Link href="/cart">
                <Button
                  size="lg"
                  className="text-[#1D212D] font-semibold hover:scale-105 transition-all duration-300 shadow-lg"
                  style={{ backgroundColor: "#F3C998" }}
                >
                  Return to Cart
                </Button>
              </Link>
            </div>
          </div>
          <Footer />
        </HeaderWrapper>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
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
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-12 shadow-2xl text-center max-w-md">
              <ShoppingBag className="h-24 w-24 mx-auto mb-6" style={{ color: "#F3C998" }} />
              <h2 className="text-2xl font-bold mb-6 text-white">Your Cart is Empty</h2>
              <p className="text-gray-300 mb-8">Add some items to your cart before proceeding to checkout.</p>
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
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
                <span style={{ color: "#F3C998" }}>Checkout</span>
              </h1>
              <p className="text-gray-400 text-lg">Complete your order securely</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Checkout Form */}
              <div>
                <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                  <CardHeader>
                    <CardTitle className="text-white text-2xl">Shipping & Payment</CardTitle>
                    <CardDescription className="text-gray-300 text-lg">
                      Complete your order by providing your shipping and payment details.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <FormField
                          control={form.control}
                          name="shipping_address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white text-base">Shipping Address*</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Enter your full shipping address"
                                  {...field}
                                  className="min-h-[120px] bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-[#F3C998] focus:ring-[#F3C998]"
                                />
                              </FormControl>
                              <FormDescription className="text-gray-400">
                                Please provide your complete address including street, city, and country.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="billing_address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white text-base">Billing Address*</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Enter your full billing address"
                                  {...field}
                                  className="min-h-[120px] bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-[#F3C998] focus:ring-[#F3C998]"
                                />
                              </FormControl>
                              <FormDescription className="text-gray-400">
                                Please provide your complete billing address including street, city, and country.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="payment_method"
                          render={({ field }) => (
                            <FormItem className="space-y-4">
                              <FormLabel className="text-white text-base">Payment Method*</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  className="flex flex-col space-y-3"
                                >
                                  <FormItem className="flex items-center space-x-4 space-y-0 bg-white/5 p-4 rounded-xl border border-white/10">
                                    <FormControl>
                                      <RadioGroupItem value="credit_card" className="border-white/30 text-[#F3C998]" />
                                    </FormControl>
                                    <FormLabel className="font-normal text-white text-base cursor-pointer">
                                      Credit Card
                                    </FormLabel>
                                  </FormItem>
                                  <FormItem className="flex items-center space-x-4 space-y-0 bg-white/5 p-4 rounded-xl border border-white/10">
                                    <FormControl>
                                      <RadioGroupItem value="paypal" className="border-white/30 text-[#F3C998]" />
                                    </FormControl>
                                    <FormLabel className="font-normal text-white text-base cursor-pointer">
                                      PayPal
                                    </FormLabel>
                                  </FormItem>
                                  <FormItem className="flex items-center space-x-4 space-y-0 bg-white/5 p-4 rounded-xl border border-white/10">
                                    <FormControl>
                                      <RadioGroupItem
                                        value="bank_transfer"
                                        className="border-white/30 text-[#F3C998]"
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal text-white text-base cursor-pointer">
                                      Bank Transfer
                                    </FormLabel>
                                  </FormItem>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white text-base">Order Notes (Optional)</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Add any special instructions or notes for your order"
                                  {...field}
                                  className="min-h-[100px] bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-[#F3C998] focus:ring-[#F3C998]"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="pt-6">
                          <Button
                            type="submit"
                            className="w-full text-[#1D212D] font-semibold hover:scale-105 transition-all duration-300 shadow-lg text-lg py-6"
                            style={{ backgroundColor: "#F3C998" }}
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <CreditCard className="mr-2 h-5 w-5" />
                                Place Order
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>

              {/* Order Summary */}
              <div>
                <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                  <CardHeader>
                    <CardTitle className="text-white text-2xl">Order Summary</CardTitle>
                    <CardDescription className="text-gray-300 text-lg">
                      Review your order before completing checkout.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Cart Items */}
                      <div className="space-y-4">
                        {cart.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between items-center py-4 border-b border-white/10"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="font-medium text-white text-base">
                                {item.product_details?.name || "Product"}
                              </div>
                              <div className="text-sm text-gray-400">x{item.quantity}</div>
                            </div>
                            <div className="text-white font-semibold">
                              ${((item.product_details?.price || 0) * item.quantity).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>

                      <Separator className="bg-white/20" />

                      {/* Order Totals */}
                      <div className="space-y-3">
                        <div className="flex justify-between text-base">
                          <span className="text-gray-300">Subtotal</span>
                          <span className="text-white">${cart.shipping_info?.grand_total?.toFixed(2) ?? "0.00"}</span>
                        </div>
                        <div className="flex justify-between text-base">
                          <span className="text-gray-300">Shipping</span>
                          <span className="text-white">Free</span>
                        </div>
                        <div className="flex justify-between text-base">
                          <span className="text-gray-300">Tax</span>
                          <span className="text-white">Included</span>
                        </div>
                        <Separator className="bg-white/20" />
                        <div className="flex justify-between font-bold text-xl">
                          <span className="text-white">Grand Total</span>
                          <span style={{ color: "#F3C998" }}>
                            ${cart.shipping_info?.grand_total?.toFixed(2) ?? "0.00"}
                          </span>
                        </div>
                      </div>

                      <div className="text-sm text-gray-400 mt-6">
                        <p>All prices are in USD.</p>
                        <p className="mt-2">Your payment information is secure and encrypted.</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Link href="/cart">
                      <Button
                        variant="outline"
                        size="lg"
                        className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 backdrop-blur-sm bg-transparent"
                      >
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        Back to Cart
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </HeaderWrapper>
    </div>
  )
}
