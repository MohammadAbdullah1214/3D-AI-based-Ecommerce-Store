"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import type { Product } from "@/app/types/product"
import { formatPrice } from "@/utils/format-utils"
import { Badge } from "@/components/ui/badge"
import { CuboidIcon as Cube3d, ImageIcon, VideoIcon, Heart } from "lucide-react"
import { ProductImageCarousel } from "@/components/product/product-image-carousel"
import { useCheckProductQuery, useAddItemMutation, useRemoveItemMutation } from "@/store/services/wishlistApi"
import { useSelector } from 'react-redux'
import { useRouter } from 'next/navigation'
import { getBackendMediaUrl } from '@/utils/product-utils'

interface ProductGridProps {
  products: Product[]
  loading?: boolean
}

export function ProductGrid({ products, loading = false }: ProductGridProps) {
  const [mounted, setMounted] = useState(false)
  const { isAuthenticated, user } = useSelector((state: any) => state.auth)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 aspect-square rounded-lg mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  if (!products || products.length === 0) {
    return <div className="text-center py-10">No products found</div>
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => {
        // Robust image logic: prefer product.images (file_type==='image'), then image_urls, then placeholder
        let imagesArr: { id: number|string, url: string }[] = [];
        if (product.images && product.images.length > 0) {
          imagesArr = product.images
            .filter(img => img.file_type === 'image' && (img.file || img.file_url || img.image_url))
            .map((img, idx) => ({
              id: img.id ?? idx,
              url: img.file || img.file_url || img.image_url || `/placeholder.svg?height=400&width=400&text=${encodeURIComponent(product.name)}`,
            }));
        }
        if (imagesArr.length === 0 && product.image_urls && product.image_urls.length > 0) {
          imagesArr = product.image_urls.map((url, idx) => ({
            id: product.image_ids?.[idx] ?? idx,
            url: url || `/placeholder.svg?height=400&width=400&text=${encodeURIComponent(product.name)}`,
          }));
        }
        if (imagesArr.length === 0) {
          imagesArr = [{ id: 0, url: `/placeholder.svg?height=400&width=400&text=${encodeURIComponent(product.name)}` }];
        }

        // Wishlist integration
        const { data: isWishlisted, refetch } = useCheckProductQuery(
          { product_id: Number(product.id) },
          { skip: !product.id }
        )
        const [addItem, { isLoading: isAdding }] = useAddItemMutation()
        const [removeItem, { isLoading: isRemoving }] = useRemoveItemMutation()
        const [error, setError] = useState<string | null>(null)

        const isSeller = user && product && (user.id === product.seller_id || user.username === product.seller_username)

        const handleWishlistClick = async (e: React.MouseEvent) => {
          e.preventDefault()
          setError(null)
          if (!isAuthenticated) {
            router.push(`/login?next=/products/${product.id}`)
            return
          }
          if (isSeller) {
            alert('You cannot wishlist your own product.');
            return;
          }
          try {
            if (isWishlisted?.in_wishlist) {
              await removeItem({ product_id: Number(product.id) })
            } else {
              await addItem({ product_id: Number(product.id) })
            }
            refetch()
          } catch (err) {
            setError("Wishlist action failed")
          }
        }

        return (
          <Link href={`/products/${product.id}`} key={product.id} className="group">
            <div className="border border-gray-200 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-gray-300">
              <div className="relative">
                <ProductImageCarousel
                  images={imagesArr}
                  productName={product.name}
                  onHover={true}
                  interval={1200}
                  showControls={false}
                  className="transition-transform duration-300"
                />

                {/* Discount Badge */}
                {product.discount_percent && product.discount_percent > 0 && (
                  <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600 transition-colors z-30">
                    {product.discount_percent}% OFF
                  </Badge>
                )}

                {/* Media Type Badges */}
                <div className="absolute top-2 right-2 flex flex-col gap-1 z-30">
                  {product.has_3d_model && (
                    <Badge className="bg-blue-500 hover:bg-blue-600 flex items-center gap-1 text-xs transition-colors">
                      <Cube3d className="h-3 w-3" />
                      3D
                    </Badge>
                  )}
                  {product.image_urls && product.image_urls.length > 1 && (
                    <Badge className="bg-green-500 hover:bg-green-600 flex items-center gap-1 text-xs transition-colors">
                      <ImageIcon className="h-3 w-3" />
                      {product.image_urls.length}
                    </Badge>
                  )}
                </div>

                {/* Wishlist Button */}
                <button
                  className={`absolute top-2 right-2 z-40 p-1 rounded-full bg-white/80 hover:bg-pink-100 border border-gray-200 ${isWishlisted?.in_wishlist ? 'text-pink-500' : 'text-gray-400'}`}
                  onClick={handleWishlistClick}
                  disabled={isAdding || isRemoving}
                  aria-label={isWishlisted?.in_wishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <Heart fill={isWishlisted?.in_wishlist ? '#ec4899' : 'none'} className="w-5 h-5" />
                </button>

                {/* Error message */}
                {error && <div className="absolute top-10 right-2 bg-red-100 text-red-600 text-xs px-2 py-1 rounded shadow">{error}</div>}
              </div>

              <div className="p-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-200 mb-2 truncate group-hover:text-blue-600 transition-colors duration-200">
                  {product.name}
                </h3>
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <p className="font-bold text-gray-900 dark:text-gray-200">{formatPrice(product.price)}</p>
                    {product.discount_price && (
                      <p className="text-sm text-gray-500 dark:text-gray-200 line-through">{formatPrice(product.discount_price)}</p>
                    )}
                  </div>
                  {product.average_rating && (
                    <div className="flex items-center">
                      <span className="text-yellow-500">★</span>
                      <span className="text-sm ml-1">
                        {typeof product.average_rating === "number"
                          ? product.average_rating.toFixed(1)
                          : Number(product.average_rating || 0).toFixed(1)}
                      </span>
                      {product.review_count && (
                        <span className="text-xs text-gray-500 ml-1">({product.review_count})</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Stock indicator */}
                {product.stock !== undefined && (
                  <div className="mt-2">
                    {product.stock > 0 ? (
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">In Stock ({product.stock})</span>
                    ) : (
                      <span className="text-xs text-red-600 dark:text-red-400 font-medium">Out of Stock</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
