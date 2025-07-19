"use client"

import Link from "next/link"
import type { Product } from "@/app/types/product"
import { formatPrice } from "@/utils/format-utils"
import { Badge } from "@/components/ui/badge"
import { CuboidIcon as Cube3d, Heart } from "lucide-react"
import { ProductImageCarousel } from "@/components/product/product-image-carousel"
import { useCheckProductQuery, useAddItemMutation, useRemoveItemMutation } from "@/store/services/wishlistApi"
import { useState } from "react"
import { useSelector } from 'react-redux'
import { useRouter } from 'next/navigation'
import { getBackendMediaUrl } from '@/utils/product-utils'
import { useAddToCartMutation } from '@/store/services/cartApi'

interface ProductCardListingProps {
  product: Product
  disableWishlistAction?: boolean
}

export function ProductCardListing({ product, disableWishlistAction = false }: ProductCardListingProps) {
  // Robust to partial product objects (e.g., from wishlist)
  const prod = (product as any).product_details || product;
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  // Robust image selection: prefer images with file_type === 'image', then image_urls, then placeholder
  let mainImage = prod.images?.find((img: any) => img.file_type === 'image')?.file_url
    || prod.image_urls?.[0]
    || `/placeholder.svg?height=400&width=400&text=${encodeURIComponent(prod.name)}`;
  
  // Prepend backend URL if the image path starts with /media/
  if (mainImage && mainImage.startsWith('/media/')) {
    mainImage = `${BACKEND_URL}${mainImage}`;
  }
  
  const carouselImages = [
    { id: 0, url: mainImage }
  ];

  // Wishlist integration
  const { data: isWishlisted, refetch } = useCheckProductQuery(
    { product_id: prod.id },
    { skip: !prod.id }
  )
  const [addItem, { isLoading: isAdding }] = useAddItemMutation()
  const [removeItem, { isLoading: isRemoving }] = useRemoveItemMutation()
  const [error, setError] = useState<string | null>(null)

  const { isAuthenticated, user } = useSelector((state: any) => state.auth)
  const router = useRouter()
  const isSeller = user && prod && user.id === prod.seller_id

  const [addToCart, { isLoading: isAddingToCart }] = useAddToCartMutation()

  const handleWishlistClick = async (e: React.MouseEvent) => {
    if (disableWishlistAction) return;
    e.preventDefault()
    setError(null)
    if (!isAuthenticated) {
      router.push(`/login?next=/products/${prod.id}`)
      return
    }
    try {
      if (isWishlisted?.in_wishlist) {
        await removeItem({ product_id: prod.id })
      } else {
        await addItem({ product_id: prod.id })
      }
      refetch()
    } catch (err) {
      console.error("Wishlist action error:", err)
      
      let errorMessage = "Wishlist action failed"
      
      if (err && typeof err === "object") {
        // Handle 403 Forbidden (seller restriction)
        if ("status" in err && err.status === 403) {
          errorMessage = "You cannot wishlist your own product."
        } else if ("data" in err && err.data && typeof err.data === "object") {
          if ("detail" in err.data) {
            errorMessage = String(err.data.detail)
          } else if ("error" in err.data) {
            errorMessage = String(err.data.error)
          }
        } else if ("error" in err) {
          errorMessage = String(err.error)
        }
      } else if (typeof err === "string") {
        errorMessage = err
      }
      
      setError(errorMessage)
    }
  }

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    setError(null)
    console.log('Add to Cart Clicked:', { isAuthenticated, user });
    if (!isAuthenticated) {
      router.push(`/login?next=/products/${prod.id}`)
      return
    }
    try {
      await addToCart({ product_id: prod.id, quantity: 1 }).unwrap()
    } catch (err) {
      console.error("Add to cart error:", err)
      
      let errorMessage = "Failed to add to cart"
      
      if (err && typeof err === "object") {
        // Handle 403 Forbidden (seller restriction)
        if ("status" in err && err.status === 403) {
          errorMessage = "You cannot add your own product to cart."
        } else if ("data" in err && err.data && typeof err.data === "object") {
          if ("detail" in err.data) {
            errorMessage = String(err.data.detail)
          } else if ("error" in err.data) {
            errorMessage = String(err.data.error)
          }
        } else if ("error" in err) {
          errorMessage = String(err.error)
        }
      } else if (typeof err === "string") {
        errorMessage = err
      }
      
      setError(errorMessage)
    }
  }

  return (
    <Link href={`/products/${prod.id}`} className="group">
      <div className="border border-gray-200 rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md">
        <div className="relative">
          <ProductImageCarousel
            images={carouselImages}
            productName={prod.name}
            onHover={true}
            interval={1500}
            showControls={false}
          />

          {prod.discount_price && prod.discount_price < prod.price && (
            <Badge className="absolute top-2 left-2 bg-red-500">
              Save ${Number(prod.price) - Number(prod.discount_price)}
            </Badge>
          )}

          {prod.has_3d_model && (
            <Badge className="absolute top-2 right-2 bg-blue-500 flex items-center gap-1">
              <Cube3d className="h-3 w-3" />
              3D
            </Badge>
          )}

          {/* Wishlist Button */}
          <button
            className={`absolute top-2 right-2 z-40 p-1 rounded-full bg-white/80 border border-gray-200 ${isWishlisted?.in_wishlist ? 'text-pink-500' : 'text-gray-400'} ${disableWishlistAction ? 'cursor-not-allowed opacity-80' : 'hover:bg-pink-100'}`}
            onClick={handleWishlistClick}
            disabled={disableWishlistAction || isAdding || isRemoving}
            aria-label={isWishlisted?.in_wishlist ? 'In wishlist' : 'Add to wishlist'}
            title={isWishlisted?.in_wishlist ? 'In wishlist' : 'Add to wishlist'}
          >
            <Heart fill={isWishlisted?.in_wishlist ? '#ec4899' : 'none'} className="w-5 h-5" />
          </button>

          {/* Error message */}
          {error && <div className="absolute top-10 right-2 bg-red-100 text-red-600 text-xs px-2 py-1 rounded shadow">{error}</div>}
        </div>

        <div className="p-4">
          <h3 className="font-medium text-gray-900 mb-1 truncate">{prod.name}</h3>
          <div className="flex items-center mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <span key={star} className={`h-4 w-4 ${star <= Math.round(Number(prod.average_rating) || 0) ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
            ))}
            <span className="ml-2 text-sm text-gray-400">({prod.review_count || 0})</span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline">
              <span className="text-xl font-bold text-gray-900">
                ${prod.discount_price && prod.discount_price < prod.price ? Number(prod.discount_price).toFixed(2) : Number(prod.price).toFixed(2)}
              </span>
              {prod.discount_price && prod.discount_price < prod.price && (
                <span className="ml-3 text-base text-gray-500 line-through">
                  ${Number(prod.price).toFixed(2)}
                </span>
              )}
            </div>
            <div className="text-sm text-gray-400 mt-2">
              {prod.stock > 0 ? (
                <span className="text-green-400">In stock</span>
              ) : (
                <span className="text-red-400">Out of stock</span>
              )}
            </div>
          </div>
          <button
            className="mt-3 w-full py-2 px-4 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500"
            onClick={handleAddToCart}
            disabled={isAddingToCart}
            aria-label="Add to cart"
            title="Add to cart"
          >
            {isAddingToCart ? 'Adding...' : 'Add to Cart'}
          </button>
          {error && <div className="text-red-600 text-xs mt-1">{error}</div>}
        </div>
      </div>
    </Link>
  )
}
