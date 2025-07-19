"use client"

import { useState, useEffect, useCallback } from "react"
import type { CartItem } from "../app/types/cart"

interface CartState {
  items: CartItem[]
  total: number
}

interface CartActions {
  addToCart: (item: CartItem) => void
  removeFromCart: (itemId: number) => void
  updateQuantity: (itemId: number, quantity: number) => void
  clearCart: () => void
}

const useCart = (): [CartState, CartActions] => {
  const [items, setItems] = useState<CartItem[]>([])
  const [total, setTotal] = useState<number>(0)

  useEffect(() => {
    // Load cart items from local storage on component mount
    const storedCart = localStorage.getItem("cart")
    if (storedCart) {
      const parsedCart = JSON.parse(storedCart)
      setItems(parsedCart.items || [])
      setTotal(parsedCart.total || 0)
    }
  }, [])

  useEffect(() => {
    // Update local storage whenever the cart changes
    localStorage.setItem("cart", JSON.stringify({ items, total }))
  }, [items, total])

  const calculateTotal = useCallback(() => {
    const newTotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0)
    setTotal(newTotal)
  }, [items])

  useEffect(() => {
    calculateTotal()
  }, [items, calculateTotal])

  const addToCart = (item: CartItem) => {
    const existingItemIndex = items.findIndex((cartItem) => cartItem.product_id === item.product_id)

    if (existingItemIndex !== -1) {
      const newItems = [...items]
      newItems[existingItemIndex].quantity += item.quantity
      setItems(newItems)
    } else {
      setItems([...items, item])
    }
  }

  const removeFromCart = (itemId: number) => {
    const newItems = items.filter((item) => item.item_id !== itemId)
    setItems(newItems)
  }

  const updateQuantity = (itemId: number, quantity: number) => {
    const newItems = items.map((item) =>
      item.item_id === itemId ? { ...item, quantity: quantity > 0 ? quantity : 1 } : item,
    )
    setItems(newItems)
  }

  const clearCart = () => {
    setItems([])
    setTotal(0)
  }

  return [
    { items, total },
    { addToCart, removeFromCart, updateQuantity, clearCart },
  ]
}

export const useCartHook = useCart //Kept for backwards compatibility
export { useCart }
