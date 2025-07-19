export interface CartItem {
    item_id: number
    product_id: number
    quantity: number
    price: number
    name: string
    image?: string
  }
  
  export interface ShippingInfo {
    address: string;
    city: string;
    postal_code: string;
    country: string;
    grand_total?: number;
  }
  
  export interface Cart {
    id?: number
    user?: number
    items: CartItem[]
    total: number
    created_at?: string
    updated_at?: string
    shipping_info?: ShippingInfo;
  }
  
  export interface AddToCartRequest {
    product_id: number
    quantity: number
  }
  
  export interface UpdateCartItemRequest {
    quantity: number
  }
  