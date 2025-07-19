"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useCart } from "@/context/cart-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Minus, Plus, Star, ShoppingCart, Heart, Share2 } from "lucide-react"
import ProductReviews from "./product-reviews"
import { useCheckProductQuery, useAddItemMutation, useRemoveItemMutation } from "@/store/services/wishlistApi"
import { useSelector } from 'react-redux'
import { useRouter } from 'next/navigation'

// This would normally be fetched from your API
const mockProduct = {
  id: "1",
  name: "AI Smart Assistant",
  description:
    "The AI Smart Assistant is a cutting-edge device that combines voice recognition, natural language processing, and machine learning to provide a personalized assistant experience. With its sleek design and powerful capabilities, it seamlessly integrates into your daily life, helping you manage tasks, control smart home devices, and access information instantly.",
  price: 299.99,
  discount_price: 249.99,
  stock: 15,
  category: "1",
  category_name: "Smart Home",
  seller: "1",
  seller_username: "TechInnovators",
  image_urls: [
    "/placeholder.svg?height=600&width=600",
    "/placeholder.svg?height=600&width=600",
    "/placeholder.svg?height=600&width=600",
  ],
  image_ids: ["1", "2", "3"],
  reviews: [
    {
      id: "1",
      user: "2",
      user_username: "JaneDoe",
      rating: 5,
      comment: "Amazing product! The voice recognition is incredibly accurate.",
      created_at: "2023-05-15T10:30:00Z",
    },
    {
      id: "2",
      user: "3",
      user_username: "MikeSmith",
      rating: 4,
      comment: "Great assistant, but the setup was a bit complicated.",
      created_at: "2023-06-02T14:45:00Z",
    },
  ],
  average_rating: 4.5,
  features: [
    "Advanced voice recognition technology",
    "Natural language processing for human-like conversations",
    "Integrates with over 1000 smart home devices",
    "Personalized recommendations based on usage patterns",
    "Privacy-focused design with local processing options",
    "Regular software updates with new features",
  ],
  specifications: {
    dimensions: "120mm x 120mm x 180mm",
    weight: "400g",
    connectivity: "Wi-Fi, Bluetooth 5.0, Zigbee",
    power: "AC adapter (included)",
    microphones: "7-microphone array",
    speakers: 'Dual 2" drivers with passive radiator',
    processor: "Quad-core 2.0 GHz",
    storage: "16GB",
  },
}

export default function ProductDetail({ id }: { id: string }) {
  const [product, setProduct] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const { addToCart } = useCart()
  const { toast } = useToast()
  const { data: isWishlisted, refetch } = useCheckProductQuery(
    { product_id: product?.id ?? 0 },
    { skip: !product?.id }
  )
  const [addItem, { isLoading: isAdding }] = useAddItemMutation()
  const [removeItem, { isLoading: isRemoving }] = useRemoveItemMutation()
  const [wishlistError, setWishlistError] = useState<string | null>(null)
  const { isAuthenticated, user } = useSelector((state: any) => state.auth)
  const router = useRouter()
  const isSeller = user && product && user.id === product.seller_id

  useEffect(() => {
    // Fetch product data from API
    const fetchProduct = async () => {
      try {
        // In a real app, you would fetch from your API
        // const response = await fetch(`/api/products/${id}`);
        // const data = await response.json();

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))
        setProduct(mockProduct)
      } catch (error) {
        console.error("Error fetching product:", error)
        toast({
          title: "Error loading product",
          description: "Please try again later.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProduct()
  }, [id, toast])

  const handleQuantityChange = (value: number) => {
    if (value < 1) return
    if (product && value > product.stock) return
    setQuantity(value)
  }

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      router.push(`/login?next=/products/${product.id}`)
      return
    }
    if (isSeller) return
    if (!product) return

    addToCart({
      id: Date.now().toString(), // This would be a real cart item ID from the API
      product: product.id,
      product_details: product,
      quantity,
      subtotal: (product.discount_price || product.price) * quantity,
    })

    toast({
      title: "Added to cart",
      description: `${quantity} x ${product.name} has been added to your cart.`,
      variant: "default",
    })
  }

  const handleWishlistClick = async () => {
    if (!isAuthenticated) {
      router.push(`/login?next=/products/${product.id}`)
      return
    }
    if (isSeller) return
    setWishlistError(null)
    try {
      if (isWishlisted?.in_wishlist) {
        await removeItem({ product_id: product.id })
      } else {
        await addItem({ product_id: product.id })
      }
      refetch()
    } catch (err) {
      setWishlistError("Wishlist action failed")
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-1/2">
            <div className="aspect-square bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
          </div>
          <div className="w-full lg:w-1/2 space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded w-full mt-8"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-medium mb-4">Product not found</h3>
        <p className="text-gray-500 dark:text-gray-400">
          The product you're looking for doesn't exist or has been removed.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Product Images */}
      <div className="w-full lg:w-1/2">
        <div className="relative aspect-square overflow-hidden rounded-lg backdrop-blur-sm bg-white/10 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800">
          <Image
            src={product.image_urls?.[selectedImage] || "/placeholder.svg"}
            alt={product.name}
            fill
            className="object-cover"
            priority
          />
        </div>

        {product.image_urls?.length > 1 && (
          <div className="flex gap-4 mt-4">
            {product.image_urls.map((url: string, index: number) => (
              <button
                key={product.image_ids?.[index] ?? index}
                className={`relative aspect-square w-20 overflow-hidden rounded-md border ${
                  selectedImage === index ? "border-primary" : "border-gray-200 dark:border-gray-800"
                }`}
                onClick={() => setSelectedImage(index)}
              >
                <Image
                  src={url || "/placeholder.svg"}
                  alt={`${product.name} - Image ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="w-full lg:w-1/2">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          {product.name}
          {/* Wishlist Button */}
          <button
            className={`p-1 rounded-full bg-white/80 hover:bg-pink-100 border border-gray-200 ${isWishlisted?.in_wishlist ? 'text-pink-500' : 'text-gray-400'}`}
            onClick={handleWishlistClick}
            disabled={isAdding || isRemoving}
            aria-label={isWishlisted?.in_wishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart fill={isWishlisted?.in_wishlist ? '#ec4899' : 'none'} className="w-6 h-6" />
          </button>
        </h1>
        {wishlistError && <div className="text-red-600 text-xs mt-1">{wishlistError}</div>}

        <div className="flex items-center gap-2 mb-4">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-5 w-5 ${
                  i < Math.floor(product.average_rating)
                    ? "text-yellow-400 fill-yellow-400"
                    : i < product.average_rating
                      ? "text-yellow-400 fill-yellow-400 opacity-50"
                      : "text-gray-300 dark:text-gray-600"
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">({product.reviews.length} reviews)</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">• Category: {product.category_name}</span>
        </div>

        <div className="mb-6">
          {product.discount_price ? (
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">${product.discount_price.toFixed(2)}</span>
              <span className="text-xl text-gray-500 dark:text-gray-400 line-through">${product.price.toFixed(2)}</span>
              <span className="text-sm bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 px-2 py-1 rounded">
                {Math.round((1 - product.discount_price / product.price) * 100)}% OFF
              </span>
            </div>
          ) : (
            <span className="text-3xl font-bold">${product.price.toFixed(2)}</span>
          )}
        </div>

        <div className="mb-6">
          <p className="text-gray-700 dark:text-gray-300">{product.description}</p>
        </div>

        <div className="mb-6">
          <div className="flex items-center mb-2">
            <span className={`h-3 w-3 rounded-full ${product.stock > 0 ? "bg-green-500" : "bg-red-500"} mr-2`}></span>
            <span>{product.stock > 0 ? `In Stock (${product.stock} available)` : "Out of Stock"}</span>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Sold by: {product.seller_username}</div>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <div className="flex items-center border border-gray-200 dark:border-gray-800 rounded-md">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1}
              className="h-10 w-10 rounded-r-none"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <div className="h-10 w-12 flex items-center justify-center border-x border-gray-200 dark:border-gray-800">
              {quantity}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={product.stock <= quantity}
              className="h-10 w-10 rounded-l-none"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <Button className="flex-1" onClick={handleAddToCart} disabled={product.stock <= 0}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>

          <Button variant="outline" size="icon" aria-label="Share">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>

        <Tabs defaultValue="features" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="specifications">Specifications</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent
            value="features"
            className="p-4 backdrop-blur-sm bg-white/10 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 rounded-md mt-2"
          >
            <ul className="list-disc pl-5 space-y-2">
              {product.features.map((feature: string, index: number) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </TabsContent>

          <TabsContent
            value="specifications"
            className="p-4 backdrop-blur-sm bg-white/10 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 rounded-md mt-2"
          >
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(product.specifications).map(([key, value]: [string, any]) => (
                <div key={key}>
                  <span className="font-medium capitalize">{key}:</span> {value}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent
            value="reviews"
            className="p-4 backdrop-blur-sm bg-white/10 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 rounded-md mt-2"
          >
            <ProductReviews reviews={product.reviews} productId={product.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
