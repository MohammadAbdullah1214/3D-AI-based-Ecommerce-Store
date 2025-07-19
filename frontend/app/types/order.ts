export interface Order {
    id: number
    user: number
    items: OrderItem[]
    total_price: string | number
    status: OrderStatus
    shipping_address: ShippingAddress
    payment_method: PaymentMethod
    created_at: string
    updated_at: string
  }
  
  export interface OrderItem {
    id: number
    order: number
    product: number
    product_name: string
    product_price: number
    quantity: number
    subtotal: number
  }
  
  export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  
  export interface ShippingAddress {
    id?: number
    full_name: string
    address_line1: string
    address_line2?: string
    city: string
    state: string
    postal_code: string
    country: string
    phone_number: string
  }
  
  export type PaymentMethod = "credit_card" | "paypal" | "stripe" | "bank_transfer"
  
  export interface OrderStatusUpdateRequest {
    status: OrderStatus
  }
  