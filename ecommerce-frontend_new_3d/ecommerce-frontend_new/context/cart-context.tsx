"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface CartContextType {
  cart: any
  isLoading: boolean
  addToCart: (item: any) => Promise<void>
  updateCartItemQuantity: (itemId: string, quantity: number) => Promise<void>
  removeFromCart: (itemId: string) => Promise<void>
  clearCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize cart on mount or login
  useEffect(() => {
    const fetchCart = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const response = await fetch(
            (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/") + "cart/my_cart/",
            {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
              },
              credentials: "include",
            }
          );
          if (!response.ok) throw new Error("Failed to fetch cart");
          const data = await response.json();
          setCart(data);
        } else {
          setCart({ id: null, customer: null, items: [], total_amount: 0, item_count: 0 });
        }
      } catch (error) {
        setCart({ id: null, customer: null, items: [], total_amount: 0, item_count: 0 });
        console.error("Error fetching cart:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCart();
  }, []);

  // Remove all localStorage cart logic

  useEffect(() => {
    // Listen for logout event to clear cart
    const handleLogout = () => {
      setCart(null);
      localStorage.removeItem("cart");
    };
    window.addEventListener("logout", handleLogout);
    return () => window.removeEventListener("logout", handleLogout);
  }, []);

  // On login, fetch cart from backend for authenticated user
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // Fetch cart from backend here (pseudo-code)
      // fetch('/api/cart/my_cart/', { headers: { Authorization: `Bearer ${token}` } })
      //   .then(res => res.json())
      //   .then(data => setCart(data));
    }
  }, []);

  const addToCart = async (item: any) => {
    try {
      // In a real app, you would call your API
      // const response = await fetch('/api/cart/add_item/', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${localStorage.getItem('token')}`
      //   },
      //   body: JSON.stringify({
      //     product: item.product,
      //     quantity: item.quantity
      //   })
      // });
      // const updatedCart = await response.json();

      // For demo, update cart locally
      const existingItemIndex = cart.items.findIndex((cartItem: any) => cartItem.product === item.product)

      let updatedItems

      if (existingItemIndex >= 0) {
        // Update existing item
        updatedItems = [...cart.items]
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + item.quantity,
          subtotal:
            (updatedItems[existingItemIndex].quantity + item.quantity) *
            (item.product_details.discount_price || item.product_details.price),
        }
      } else {
        // Add new item
        updatedItems = [...cart.items, item]
      }

      // Calculate new total
      const total = updatedItems.reduce((sum: number, item: any) => sum + item.subtotal, 0)

      setCart({
        ...cart,
        items: updatedItems,
        total_amount: total,
        item_count: updatedItems.length,
      })
    } catch (error) {
      console.error("Error adding to cart:", error)
      throw error
    }
  }

  const updateCartItemQuantity = async (itemId: string, quantity: number) => {
    try {
      // In a real app, you would call your API
      // const response = await fetch('/api/cart/update_item', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${localStorage.getItem('token')}`
      //   },
      //   body: JSON.stringify({
      //     item_id: itemId,
      //     quantity
      //   })
      // });
      // const updatedCart = await response.json();

      // For demo, update cart locally
      const updatedItems = cart.items.map((item: any) => {
        if (item.id === itemId) {
          return {
            ...item,
            quantity,
            subtotal: quantity * (item.product_details.discount_price || item.product_details.price),
          }
        }
        return item
      })

      // Calculate new total
      const total = updatedItems.reduce((sum: number, item: any) => sum + item.subtotal, 0)

      setCart({
        ...cart,
        items: updatedItems,
        total_amount: total,
      })
    } catch (error) {
      console.error("Error updating cart item:", error)
      throw error
    }
  }

  const removeFromCart = async (itemId: string) => {
    try {
      // In a real app, you would call your API
      // const response = await fetch('/api/cart/remove_item/', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${localStorage.getItem('token')}`
      //   },
      //   body: JSON.stringify({
      //     item_id: itemId
      //   })
      // });
      // const updatedCart = await response.json();

      // For demo, update cart locally
      const updatedItems = cart.items.filter((item: any) => item.id !== itemId)

      // Calculate new total
      const total = updatedItems.reduce((sum: number, item: any) => sum + item.subtotal, 0)

      setCart({
        ...cart,
        items: updatedItems,
        total_amount: total,
        item_count: updatedItems.length,
      })
    } catch (error) {
      console.error("Error removing cart item:", error)
      throw error
    }
  }

  const clearCart = async () => {
    try {
      // In a real app, you would call your API
      // const response = await fetch('/api/cart/clear/', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${localStorage.getItem('token')}`
      //   }
      // });
      // const updatedCart = await response.json();

      // For demo, update cart locally
      setCart({
        ...cart,
        items: [],
        total_amount: 0,
        item_count: 0,
      })
    } catch (error) {
      console.error("Error clearing cart:", error)
      throw error
    }
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        addToCart,
        updateCartItemQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
