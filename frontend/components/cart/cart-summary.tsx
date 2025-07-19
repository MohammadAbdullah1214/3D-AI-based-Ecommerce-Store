"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ShoppingBag, CreditCard } from "lucide-react"
import { useClearCartMutation } from "@/store/services/cartApi"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

interface CartSummaryProps {
  subtotal: number
  itemCount: number
}

export default function CartSummary({ subtotal, itemCount }: CartSummaryProps) {
  const [clearCart, { isLoading }] = useClearCartMutation()
  const { toast } = useToast()
  const router = useRouter()

  // Calculate shipping and tax
  const shipping = subtotal > 50 ? 0 : 5.99
  const tax = subtotal * 0.08 // 8% tax
  const total = subtotal + shipping + tax

  const handleClearCart = async () => {
    try {
      await clearCart().unwrap()
      toast({
        title: "Cart cleared",
        description: "All items have been removed from your cart.",
      })
    } catch (error) {
      toast({
        title: "Error clearing cart",
        description: "There was a problem clearing your cart. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCheckout = () => {
    router.push("/checkout")
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Order Summary</h2>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span>Subtotal ({itemCount} items)</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax</span>
          <span>${tax.toFixed(2)}</span>
        </div>
      </div>

      <Separator className="my-4" />

      <div className="flex justify-between font-bold text-lg mb-6">
        <span>Total</span>
        <span>${total.toFixed(2)}</span>
      </div>

      <div className="space-y-3">
        <Button className="w-full" size="lg" onClick={handleCheckout} disabled={itemCount === 0 || isLoading}>
          <CreditCard className="mr-2 h-4 w-4" />
          Proceed to Checkout
        </Button>

        <Button
          variant="outline"
          className="w-full"
          size="lg"
          onClick={handleClearCart}
          disabled={itemCount === 0 || isLoading}
        >
          <ShoppingBag className="mr-2 h-4 w-4" />
          Clear Cart
        </Button>
      </div>

      <p className="text-xs text-gray-500 mt-4">Free shipping on orders over $50. All prices are in USD.</p>
    </div>
  )
}
