"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { formatDistanceToNow } from "date-fns"

// Mock order data
const mockOrders = [
  {
    id: "1001",
    created_at: "2023-08-15T10:30:00Z",
    status: "delivered",
    total_amount: 549.98,
    items: [
      { id: "1", product_name: "AI Smart Assistant", quantity: 1, price: 299.99 },
      { id: "2", product_name: "Neural Headphones", quantity: 1, price: 199.99 },
    ],
  },
  {
    id: "1002",
    created_at: "2023-09-02T14:45:00Z",
    status: "shipped",
    total_amount: 499.99,
    items: [{ id: "3", product_name: "Holographic Display", quantity: 1, price: 499.99 }],
  },
]

export default function OrderHistory() {
  const [orders, setOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Fetch order history from API
    const fetchOrders = async () => {
      try {
        // In a real app, you would fetch from your API
        // const response = await fetch('/api/orders', {
        //   headers: {
        //     'Authorization': `Bearer ${localStorage.getItem('token')}`
        //   }
        // });
        // const data = await response.json();

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))
        setOrders(mockOrders)
      } catch (error) {
        toast({
          title: "Error loading orders",
          description: "Please try again later.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [toast])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
      case "processing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
      case "shipped":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100"
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="animate-pulse p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
            <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2 mb-4"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
          </div>
        ))}
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400 mb-4">You haven't placed any orders yet.</p>
        <Link href="/products">
          <Button>Start Shopping</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {orders.map((order) => (
        <div key={order.id} className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <div className="bg-gray-50 dark:bg-gray-900 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Order #{order.id}</span>
                <Badge className={getStatusColor(order.status)}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Placed {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium">${order.total_amount.toFixed(2)}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {order.items.length} {order.items.length === 1 ? "item" : "items"}
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="space-y-2 mb-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <div>
                    <span className="font-medium">
                      {item.product_name}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 ml-2">x{item.quantity}</span>
                  </div>
                  <div>${(item.price * item.quantity).toFixed(2)}</div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm">
                View Details
              </Button>
              {order.status === "delivered" && <Button size="sm">Write Review</Button>}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
