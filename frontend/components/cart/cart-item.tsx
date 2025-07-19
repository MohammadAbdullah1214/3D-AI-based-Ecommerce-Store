"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Trash2, Minus, Plus, Tag, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUpdateCartItemMutation, useRemoveFromCartMutation } from "@/store/services/cartApi"
import type { CartItem } from "@/store/services/cartApi"
import { useToast } from "@/components/ui/use-toast"
import { useSelector } from 'react-redux'

interface CartItemProps {
  item: CartItem
}

export default function CartItemComponent({ item }: CartItemProps) {
  const [quantity, setQuantity] = useState(item.quantity)
  const [updateCartItem, { isLoading: isUpdating }] = useUpdateCartItemMutation()
  const [removeFromCart, { isLoading: isRemoving }] = useRemoveFromCartMutation()
  const { toast } = useToast()
  const { user } = useSelector((state: any) => state.auth) || {};
  // Robust seller check for cart
  const isSellerOfThisProduct = user && user.role === "seller" && item.product_details && (user.id === item.product_details.seller_id || user.username === item.product_details.seller_username);

  const productName = item.product_details?.name || "Product";
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
  // Image logic
  let imageUrl = `/placeholder.svg?height=400&width=400&text=${encodeURIComponent(productName)}`;
  if (item.product_details?.images && item.product_details.images.length > 0) {
    const img = item.product_details.images.find((img: any) => img.file_type === 'image');
    if (img && img.file) imageUrl = img.file.startsWith('/media/') ? `${BACKEND_URL}${img.file}` : img.file;
  } else if (item.product_details?.image_urls && item.product_details.image_urls.length > 0) {
    const url = item.product_details.image_urls[0];
    imageUrl = url.startsWith('/media/') ? `${BACKEND_URL}${url}` : url;
  } else if (item.product_details?.media && item.product_details.media.length > 0) {
    const img = item.product_details.media.find((media: any) => media.file_type === 'image');
    if (img && (img.file || img.url)) {
      const mediaUrl = img.file || img.url;
      if (mediaUrl) imageUrl = mediaUrl.startsWith('/media/') ? `${BACKEND_URL}${mediaUrl}` : mediaUrl;
    }
  }

  // Get category and seller info
  const categoryName = item.product_details?.category_details?.name || 
                      item.product_details?.category?.name || 
                      item.product_details?.category_name || 
                      "Unknown Category";
  const sellerName = item.product_details?.seller_name || 
                    item.product_details?.seller_username || 
                    "Unknown Seller";

  const handleQuantityChange = async (newQuantity: number) => {
    if (isSellerOfThisProduct) return;
    if (newQuantity < 1) return

    setQuantity(newQuantity)

    try {
      await updateCartItem({
        item_id: item.id,
        quantity: newQuantity,
      }).unwrap()
    } catch (error) {
      // Revert to original quantity on error
      setQuantity(item.quantity)
      toast({
        title: "Error updating quantity",
        description: "There was a problem updating your cart. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleRemove = async () => {
    if (isSellerOfThisProduct) return;
    try {
      await removeFromCart(item.id).unwrap()
      toast({
        title: "Item removed",
        description: "The item has been removed from your cart.",
      })
    } catch (error) {
      toast({
        title: "Error removing item",
        description: "There was a problem removing this item. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className={`flex items-center space-x-6 p-6 rounded-xl shadow-lg ${isSellerOfThisProduct ? 'bg-gray-700 opacity-60 cursor-not-allowed' : 'bg-[#F3C998] dark:bg-[#F3C998]'} transition-colors duration-300`}>
      <img
        src={imageUrl}
        alt={productName}
        className="w-32 h-32 object-cover rounded-lg bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700"
        style={{ filter: isSellerOfThisProduct ? 'grayscale(1)' : 'none' }}
      />
      <div className="flex-1">
        <h3 className={`text-2xl font-bold mb-2 ${isSellerOfThisProduct ? 'text-gray-400' : 'text-[#1D212D]'}`}>{productName}</h3>
        
        {/* Category and Seller Info */}
        <div className="flex items-center gap-4 mb-3 text-sm">
          <div className={`flex items-center gap-1 ${isSellerOfThisProduct ? 'text-gray-500' : 'text-gray-700'}`}> <Tag className="h-4 w-4" /> <span>{categoryName}</span> </div>
          <div className={`flex items-center gap-1 ${isSellerOfThisProduct ? 'text-gray-500' : 'text-gray-700'}`}> <User className="h-4 w-4" /> <span>{sellerName}</span> </div>
        </div>
        
        <p className={`text-sm mt-1 ${isSellerOfThisProduct ? 'text-gray-500' : 'text-gray-800'}`}>$
          {typeof item.product_details?.price === "number"
            ? item.product_details.price.toFixed(2)
            : Number(item.product_details?.price).toFixed(2)}
        </p>
        {/* Show warning if product data is missing */}
        {(!item.product_details?.name || categoryName === 'Unknown Category' || sellerName === 'Unknown Seller') && (
          <div className="mt-2 text-xs text-yellow-800">Some product details are missing.</div>
        )}
      </div>
      <div className="flex items-center border rounded-md mr-4 border-gray-400 bg-white/40">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleQuantityChange(quantity - 1)}
          disabled={quantity <= 1 || isUpdating || isSellerOfThisProduct}
          className={isSellerOfThisProduct ? 'opacity-50 cursor-not-allowed' : ''}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className={`w-10 text-center ${isSellerOfThisProduct ? 'text-gray-400' : 'text-gray-800'}`}>{quantity}</span>
        <Button variant="ghost" size="icon" onClick={() => handleQuantityChange(quantity + 1)} disabled={isUpdating || isSellerOfThisProduct} className={isSellerOfThisProduct ? 'opacity-50 cursor-not-allowed' : ''}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className={`w-24 text-right font-medium ${isSellerOfThisProduct ? 'text-gray-400' : 'text-[#1D212D]'}`}>$
        {(
          (typeof item.product_details?.price === "number"
            ? item.product_details.price
            : Number(item.product_details?.price)) * quantity
        ).toFixed(2)}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className={`ml-4 text-red-500 hover:text-red-700 ${isSellerOfThisProduct ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={handleRemove}
        disabled={isRemoving || isSellerOfThisProduct}
      >
        <Trash2 className="h-5 w-5" />
      </Button>
    </div>
  )
}
