import { api } from "../api"
import type { Product } from "@/app/types" // Import from types directory

export interface OrderItem {
  id: number
  order: number
  product: number
  product_details: Product
  quantity: number
  price: number
  subtotal: number
}

export interface Payment {
  id: number
  order: number
  amount: number
  payment_method: "credit_card" | "paypal" | "bank_transfer"
  status: "pending" | "completed" | "failed"
  transaction_id: string
  created_at: string
  updated_at: string
}

export interface Order {
  id: number
  customer: number
  customer_username: string
  created_at: string
  updated_at: string
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  total_price: string | number // <-- changed from total_amount to total_price
  items: OrderItem[]
  payment: Payment
  shipping_address: string
  tracking_number: string | null
  notes: string | null
}

export interface CheckoutRequest {
  shipping_address: string
  payment_method: "credit_card" | "paypal" | "bank_transfer"
  notes?: string
}

export interface OrderStatusUpdateRequest {
  status: "processing" | "shipped" | "delivered" | "cancelled"
  tracking_number?: string
}

export const orderApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Customer endpoints
    getOrders: builder.query<Order[], void>({
      query: () => "orders/",
      providesTags: ["Order"],
      // Add transformResponse to handle errors
      transformResponse: (response: any) => {
        console.log("Orders API response:", response)
        return Array.isArray(response) ? response : []
      },
      transformErrorResponse: (response) => {
        console.log("Orders API error response:", response)
        return response
      },
    }),
    getOrder: builder.query<Order, number>({
      query: (id) => `orders/${id}/`,
      providesTags: (result, error, id) => [{ type: "Order", id }],
    }),
    checkout: builder.mutation<Order, CheckoutRequest>({
      query: (checkoutData) => ({
        url: "orders/",
        method: "POST",
        body: checkoutData,
      }),
      invalidatesTags: ["Order", "Cart"],
    }),
    cancelOrder: builder.mutation<Order, number>({
      query: (orderId) => ({
        url: `orders/${orderId}/cancel/`,
        method: "POST",
      }),
      invalidatesTags: ["Order"],
    }),

    // Seller endpoints - using the regular orders endpoint since seller-specific endpoint doesn't exist
    getSellerOrders: builder.query<Order[], { sellerId?: number; sellerUsername?: string }>({
      query: () => "orders/",
      providesTags: ["Order"],
      // Transform the response to filter orders for the seller
      transformResponse: (response: Order[], meta, arg) => {
        console.log("Seller Orders API response:", response)

        if (!Array.isArray(response)) {
          console.error("Expected array of orders but got:", response)
          return []
        }

        // If no seller ID or username is provided, return all orders
        if (!arg.sellerId && !arg.sellerUsername) {
          return response
        }

        // Filter orders that contain products from this seller
        return response.filter((order) => {
          if (!order.items || !Array.isArray(order.items)) {
            return false
          }

          return order.items.some((item) => {
            const productDetails = item.product_details
            return (
              (arg.sellerId && productDetails && productDetails.seller === arg.sellerId) ||
              (arg.sellerUsername && productDetails && productDetails.seller_username === arg.sellerUsername)
            )
          })
        })
      },
      transformErrorResponse: (response) => {
        console.log("Seller Orders API error response:", response)
        return response
      },
    }),
    updateOrderStatus: builder.mutation<Order, { orderId: number; data: OrderStatusUpdateRequest }>({
      query: ({ orderId, data }) => ({
        url: `orders/${orderId}/update_status/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { orderId }) => [{ type: "Order", id: orderId }],
    }),
    // Use the regular orders endpoint for recent orders and filter on client side
    getRecentOrders: builder.query<Order[], { sellerId?: number; sellerUsername?: string; limit?: number }>({
      query: () => "orders/",
      providesTags: ["Order"],
      transformResponse: (response: Order[], meta, arg) => {
        console.log("Recent Orders API response:", response)

        if (!Array.isArray(response)) {
          console.error("Expected array of orders but got:", response)
          return []
        }

        let filteredOrders = response

        // Filter by seller if provided
        if (arg.sellerId || arg.sellerUsername) {
          filteredOrders = response.filter((order) => {
            if (!order.items || !Array.isArray(order.items)) {
              return false
            }

            return order.items.some((item) => {
              const productDetails = item.product_details
              return (
                (arg.sellerId && productDetails && productDetails.seller === arg.sellerId) ||
                (arg.sellerUsername && productDetails && productDetails.seller_username === arg.sellerUsername)
              )
            })
          })
        }

        // Sort by date (newest first)
        filteredOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        // Limit the number of orders if specified
        const limit = arg.limit || 5
        return filteredOrders.slice(0, limit)
      },
      transformErrorResponse: (response) => {
        console.log("Recent Orders API error response:", response)
        return response
      },
    }),

    // Admin endpoints - using the regular orders endpoint
    getAllOrders: builder.query<Order[], void>({
      query: () => "orders/",
      providesTags: ["Order"],
    }),
  }),
})

export const {
  useGetOrdersQuery,
  useGetOrderQuery,
  useCheckoutMutation,
  useCancelOrderMutation,
  // Seller specific hooks
  useGetSellerOrdersQuery,
  useUpdateOrderStatusMutation,
  useGetRecentOrdersQuery,
  // Admin specific hooks
  useGetAllOrdersQuery,
} = orderApi
