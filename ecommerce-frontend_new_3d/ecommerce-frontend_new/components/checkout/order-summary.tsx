import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface OrderSummaryProps {
  cart: any
}

export default function OrderSummary({ cart }: OrderSummaryProps) {
  const subtotal = cart.items.reduce((sum: number, item: any) => {
    const price = item.product_details.discount_price || item.product_details.price
    return sum + price * item.quantity
  }, 0)

  const shipping = subtotal > 100 ? 0 : 10
  const tax = subtotal * 0.08 // 8% tax
  const total = subtotal + shipping + tax

  return (
    <Card className="backdrop-blur-sm bg-white/10 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800">
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Order Items */}
        <div className="space-y-3">
          {cart.items.map((item: any) => (
            <div key={item.id} className="flex justify-between">
              <div className="flex-1">
                <div className="font-medium">{item.product_details.name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Qty: {item.quantity}</div>
              </div>
              <div className="text-right">
                ${((item.product_details.discount_price || item.product_details.price) * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Order Totals */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            {shipping === 0 ? (
              <span className="text-green-600 dark:text-green-400">Free</span>
            ) : (
              <span>${shipping.toFixed(2)}</span>
            )}
          </div>
          <div className="flex justify-between">
            <span>Tax (8%)</span>
            <span>${tax.toFixed(2)}</span>
          </div>
        </div>

        <Separator />

        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </CardContent>
    </Card>
  )
}
