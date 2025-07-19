"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, Eye, ShoppingCart } from "lucide-react"
import { useTrackInteractionMutation } from "@/store/services/chatbotApi"
import { useSelector } from 'react-redux'
import { useRouter } from 'next/navigation'
import { useAddToCartMutation } from '@/store/services/cartApi'
import { useToast } from '@/components/ui/use-toast'

interface ProductRecommendation {
  id: number
  product_details?: any
  product?: any
  name?: string
  price?: number
  discount_price?: number
  images?: any[]
  category_details?: any
  seller_id?: number
  seller_username?: string
  recommendation_score?: number
  reason?: string
}

interface ProductRecommendationCardProps {
  recommendation: ProductRecommendation
  onProductClick: (productId: number) => void
}

export default function ProductRecommendationCard({ recommendation, onProductClick }: ProductRecommendationCardProps) {
  const [trackInteraction] = useTrackInteractionMutation()
  const { user, isAuthenticated } = useSelector((state: any) => state.auth) || {};
  const router = useRouter()
  const [addToCart, { isLoading: isAddingToCart }] = useAddToCartMutation()
  const { toast } = useToast()

  // Debug logging to understand the data structure
  console.log("ProductRecommendationCard received:", recommendation)

  // Early return if recommendation is undefined
  if (!recommendation) {
    console.warn("ProductRecommendationCard: recommendation is undefined")
    return (
      <Card className="w-full border border-gray-200">
        <CardContent className="p-3">
          <div className="text-center text-gray-500 text-sm">
            Invalid recommendation data
          </div>
        </CardContent>
      </Card>
    )
  }

  // Try to safely access product_details with multiple fallback strategies
  let product = null
  let productName = "Unknown Product"
  let productId = 0
  let discountPrice = null
  let originalPrice = null
  let productImages = []
  let categoryDetails = null
  let sellerId = null
  let sellerUsername = null

  try {
    // First try the expected structure
    if (recommendation.product_details) {
      product = recommendation.product_details
      productName = product?.name || "Unknown Product"
      productId = product?.id || 0
      discountPrice = product?.discount_price
      originalPrice = product?.price
      productImages = product?.images || []
      categoryDetails = product?.category_details
      sellerId = product?.seller_id
      sellerUsername = product?.seller_username
    }
    // If that fails, try alternative structures
    else if (recommendation.product && typeof recommendation.product === 'object') {
      product = recommendation.product
      productName = product?.name || "Unknown Product"
      productId = product?.id || 0
      discountPrice = product?.discount_price
      originalPrice = product?.price
      productImages = product?.images || []
      categoryDetails = product?.category_details
      sellerId = product?.seller_id
      sellerUsername = product?.seller_username
    }
    // If still no product, try to access it directly
    else if (recommendation.name || recommendation.price) {
      product = recommendation
      productName = recommendation.name || "Unknown Product"
      productId = recommendation.id || 0
      discountPrice = recommendation.discount_price
      originalPrice = recommendation.price
      productImages = recommendation.images || []
      categoryDetails = recommendation.category_details
      sellerId = recommendation.seller_id
      sellerUsername = recommendation.seller_username
    }
  } catch (error) {
    console.error("Error accessing product data:", error)
  }

  // Early return if we couldn't find product data
  if (!product) {
    console.warn("ProductRecommendationCard: no product data found", recommendation)
    return (
      <Card className="w-full border border-gray-200">
        <CardContent className="p-3">
          <div className="text-center text-gray-500 text-sm">
            <div>Product details unavailable</div>
            <div className="text-xs mt-1">Debug: {JSON.stringify(recommendation).substring(0, 100)}...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Seller check - removed since backend handles this
  // const isSellerOfThisProduct = user && product && (user.id === sellerId || user.username === sellerUsername);

  const handleView = async () => {
    try {
      await trackInteraction({
        recommendation_id: recommendation.id,
        action: "click",
      })
    } catch (error) {
      console.error("Error tracking interaction:", error)
    }
    onProductClick(productId)
  }

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      router.push(`/login?next=/products/${productId}`)
      return
    }
    
    try {
      // Track the interaction
      await trackInteraction({
        recommendation_id: recommendation.id,
        action: "add_to_cart",
      })
      
      // Add to cart
      await addToCart({ product_id: productId, quantity: 1 }).unwrap()
      
      toast({
        title: "Added to cart",
        description: `${productName} has been added to your cart.`,
        variant: "default",
      })
    } catch (error) {
      console.error("Add to cart error:", error)
      
      let errorMessage = "Failed to add to cart"
      
      if (error && typeof error === "object") {
        // Handle 403 Forbidden (seller restriction)
        if ("status" in error && error.status === 403) {
          errorMessage = "You cannot add your own product to cart."
        } else if ("data" in error && error.data && typeof error.data === "object") {
          if ("detail" in error.data) {
            errorMessage = String(error.data.detail)
          } else if ("error" in error.data) {
            errorMessage = String(error.data.error)
          }
        } else if ("error" in error) {
          errorMessage = String(error.error)
        }
      } else if (typeof error === "string") {
        errorMessage = error
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const formatPrice = (price: string | number | null | undefined) => {
    if (price === null || price === undefined) return "N/A"
    const numPrice = typeof price === "string" ? Number.parseFloat(price) : price
    return isNaN(numPrice) ? "N/A" : `$${numPrice.toFixed(2)}`
  }
  
  // Debug logging for price data
  console.log("Product price data:", { discountPrice, originalPrice, productName })
  
  // Safe comparison with proper null checks
  const hasDiscount = discountPrice !== null && 
                     discountPrice !== undefined && 
                     originalPrice !== null && 
                     originalPrice !== undefined &&
                     Number.parseFloat(discountPrice.toString()) < Number.parseFloat(originalPrice.toString())

  return (
    <Card className="w-full border border-gray-200 hover:shadow-lg transition-all duration-300 hover:border-blue-300 group">
      <CardContent className="p-3">
        <div className="flex gap-3">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden group-hover:shadow-md transition-shadow">
            {productImages && productImages.length > 0 ? (
              <img
                src={productImages[0]?.file_url || "/placeholder.svg"}
                alt={productName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="text-gray-400 text-xs text-center">No Image</div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm text-gray-900 truncate group-hover:text-blue-600 transition-colors">
              {productName}
            </h4>

            {categoryDetails && (
              <p className="text-xs text-gray-500 mt-1">{categoryDetails.name}</p>
            )}

            <div className="flex items-center gap-2 mt-1">
              {hasDiscount ? (
                <>
                  <span className="text-sm font-semibold text-green-600">{formatPrice(discountPrice)}</span>
                  <span className="text-xs text-gray-500 line-through">{formatPrice(originalPrice)}</span>
                  <Badge variant="destructive" className="text-xs px-1 py-0 h-4">
                    SALE
                  </Badge>
                </>
              ) : (
                <span className="text-sm font-semibold text-gray-900">{formatPrice(originalPrice)}</span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800">
                <Star className="w-3 h-3 mr-1 fill-current" />
                {Math.round((recommendation.recommendation_score || 0) * 100)}% match
              </Badge>
            </div>

            <div className="flex gap-1 mt-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleView} 
                className="flex-1 h-7 text-xs hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                <Eye className="w-3 h-3 mr-1" />
                View
              </Button>
              <Button 
                size="sm" 
                onClick={handleAddToCart} 
                className="flex-1 h-7 text-xs bg-blue-600 hover:bg-blue-700 transition-colors"
                disabled={isAddingToCart}
              >
                <ShoppingCart className="w-3 h-3 mr-1" />
                {isAddingToCart ? 'Adding...' : 'Add to cart'}
              </Button>
            </div>

            {recommendation.reason && (
              <p className="text-xs text-gray-600 dark:text-gray-200 mt-2 italic bg-gray-50 p-2 rounded border-l-2 border-blue-300">
                💡 {recommendation.reason}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
