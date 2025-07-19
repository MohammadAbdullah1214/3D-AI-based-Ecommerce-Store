import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { Cart, CartItem } from "../services/cartApi"

interface CartState {
  items: CartItem[]
  totalAmount: number
  itemCount: number
  isLoading: boolean
}

const initialState: CartState = {
  items: [],
  totalAmount: 0,
  itemCount: 0,
  isLoading: false,
}

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setCart: (state, action: PayloadAction<Cart>) => {
      state.items = action.payload.items
      state.totalAmount = action.payload.total_amount
      state.itemCount = action.payload.item_count
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    clearCart: (state) => {
      state.items = []
      state.totalAmount = 0
      state.itemCount = 0
    },
  },
})

export const { setCart, setLoading, clearCart } = cartSlice.actions
export default cartSlice.reducer
