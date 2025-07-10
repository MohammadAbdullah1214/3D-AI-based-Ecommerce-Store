import { api } from "../api"
import type { Product } from "@/app/types/product"
import type { ShippingInfo } from "@/app/types/cart"

export interface CartItem {
  id: number
  cart: number
  product: number
  product_details: Product
  quantity: number
  subtotal: number
  added_at: string
}

export interface Cart {
  id: number
  customer: number
  items: CartItem[]
  total_amount: number
  item_count: number
  created_at: string
  updated_at: string
  shipping_info?: ShippingInfo;
}

// Update the interface to use product_id instead of product
export interface AddToCartRequest {
  product_id: number
  quantity: number
}

export interface UpdateCartItemRequest {
  item_id: number
  quantity: number
}

export interface RemoveCartItemRequest {
  item_id: number
}

export const cartApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCart: builder.query<Cart, void>({
      query: () => "cart/my_cart/",
      providesTags: ["Cart"],
    }),

    addToCart: builder.mutation<Cart, AddToCartRequest>({
      query: (data) => {
        console.log("Adding to cart with data:", data)
        return {
          url: "cart/add_item/",
          method: "POST",
          body: data,
        }
      },
      invalidatesTags: ["Cart"],
      // Improved error handling
      transformErrorResponse: (response, meta, arg) => {
        console.log("Add to cart error response:", response)
        console.log("Add to cart error meta:", meta)
        console.log("Add to cart error arg:", arg)
        return response
      },
    }),

    updateCartItem: builder.mutation<Cart, UpdateCartItemRequest>({
      query: (data) => ({
        url: "cart/update_item/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Cart"],
    }),

    removeFromCart: builder.mutation<Cart, number>({
      query: (itemId) => ({
        url: "cart/remove_item/",
        method: "POST",
        body: { item_id: itemId },
      }),
      invalidatesTags: ["Cart"],
    }),

    clearCart: builder.mutation<Cart, void>({
      query: () => ({
        url: "cart/clear/",
        method: "POST",
      }),
      invalidatesTags: ["Cart"],
    }),
  }),
})

export const {
  useGetCartQuery,
  useAddToCartMutation,
  useUpdateCartItemMutation,
  useRemoveFromCartMutation,
  useClearCartMutation,
} = cartApi
