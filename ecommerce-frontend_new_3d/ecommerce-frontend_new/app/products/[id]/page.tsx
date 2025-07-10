"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useGetProductQuery } from "@/store/services/productApi"
import { useGetAllMediaQuery } from "@/store/services/mediaApi"
import { useAddToCartMutation } from "@/store/services/cartApi"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Star,
  Minus,
  Plus,
  ShoppingCart,
  Truck,
  Clock,
  Shield,
  Info,
  CheckCircle,
  CuboidIcon as Cube,
  Play,
  Heart,
  Loader2,
  Share2,
  RotateCcw,
  ArrowLeft,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import HeaderWrapper from "@/app/header-wrapper"
import Footer from "@/components/layout/footer"
import Simple3DViewer from "@/components/product/simple-3d-viewer"
import { ProductImageCarousel } from "@/components/product/product-image-carousel"
import { getProductPrice, getProductStock, getBackendMediaUrl, getMediaUrl } from "@/utils/product-utils"
import { useSelector } from 'react-redux'
import { useRouter } from 'next/navigation'
import { useAddItemMutation, useCheckProductQuery, useRemoveItemMutation } from '@/store/services/wishlistApi'
import Link from "next/link"

export default function ProductDetailPage() {
  const params = useParams()
  const productId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "0"

  const { toast } = useToast()

  const { data: product, isLoading, error } = useGetProductQuery(Number(productId))
  const { data: allMedia = [], isLoading: mediaLoading } = useGetAllMediaQuery()
  const [addToCart, { isLoading: isAddingToCart }] = useAddToCartMutation()
  const [quantity, setQuantity] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState(0)

  // Get product media - prefer product.media if available, otherwise fallback to allMedia
  const productMedia = product?.media && product.media.length > 0
    ? product.media
    : allMedia.filter((media) => media.product === Number(productId));

  // Filter media by type
  const images = productMedia.filter(m => m.file_type === 'image');
  const videos = productMedia.filter(m => m.file_type === 'video');
  const models = productMedia.filter(m => m.file_type === 'model' || m.file_type === 'model_3d');

  // Prepare carousel images
  const carouselImages = images.length > 0
    ? images.map((img, idx) => ({
        id: img.id || idx,
        url: getMediaUrl(img) || img.file || img.url || `/placeholder.svg?height=400&width=400&text=${encodeURIComponent(product?.name || 'Product')}`,
      })).filter(img => typeof img.url === 'string' && img.url.trim() && !img.url.includes('undefined'))
    : [{
        id: 0,
        url: `/placeholder.svg?height=400&width=400&text=${encodeURIComponent(product?.name || 'Product')}`,
      }];

  const incrementQuantity = () => setQuantity((prev) => prev + 1)
  const decrementQuantity = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1))

  const { isAuthenticated, user } = useSelector((state: any) => state.auth)
  const router = useRouter()
  const [addItem, { isLoading: isAddingWishlist }] = useAddItemMutation()
  const [removeItem, { isLoading: isRemovingWishlist }] = useRemoveItemMutation()
  const { data: isWishlisted, refetch: refetchWishlist } = useCheckProductQuery(
    { product_id: product?.id ?? 0 },
    { skip: !product?.id }
  )
  const [wishlistError, setWishlistError] = useState<string | null>(null)

  // Robust seller check
  const isSellerOfThisProduct = user && user.role === "seller" && product && (user.id === product.seller_id || user.username === product.seller_username);
  const isOutOfStock = product ? getProductStock(product) <= 0 : true

  const handleAddToCart = async () => {
    console.log('Add to Cart Clicked:', { isAuthenticated, user });
    if (!isAuthenticated) {
      router.push(`/login?next=/products/${productId}`)
      return
    }
    if (!product) return

    try {
      console.log("Adding product to cart:", {
        product_id: Number(product.id),
        quantity: quantity,
      })

      const result = await addToCart({
        product_id: Number(product.id ?? 0),
        quantity: quantity,
      }).unwrap()

      console.log("Add to cart success:", result)

      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart.`,
        variant: "default",
      })
    } catch (error) {
      console.error("Add to cart error:", error)

      let errorMessage = "Failed to add product to cart. Please try again."

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

  const handleAddToWishlist = async () => {
    setWishlistError(null)
    if (!isAuthenticated) {
      router.push(`/login?next=/products/${productId}`)
      return
    }
    if (!product) return
    try {
      if (isWishlisted?.in_wishlist) {
        await removeItem({ product_id: product.id })
      } else {
        await addItem({ product_id: product.id })
      }
      refetchWishlist()
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
      
      setWishlistError(errorMessage)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name,
          text: `Check out this amazing product: ${product?.name}`,
          url: window.location.href,
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link copied",
        description: "Product link has been copied to clipboard.",
      })
    }
  }

  // Add guards for possibly undefined product before all usages
  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#1D212D] via-[#2A2F3A] to-[#1D212D]">
        <div className="relative w-24 h-24">
          <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-t-[#F3C998] border-r-transparent border-b-[#F3C998]/50 border-l-transparent animate-spin"></div>
          <div className="absolute top-2 left-2 w-20 h-20 rounded-full border-4 border-t-transparent border-r-[#F3C998]/70 border-b-transparent border-l-[#F3C998] animate-spin"></div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-[#1D212D] via-[#2A2F3A] to-[#1D212D] relative">
        <div className="fixed inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, #F3C998 0%, transparent 50%), 
                             radial-gradient(circle at 75% 75%, #F3C998 0%, transparent 50%)`,
            }}
          ></div>
        </div>

        <HeaderWrapper>
          <div className="relative z-10 min-h-screen w-full p-4 md:p-8 flex items-center justify-center">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-12 shadow-2xl text-center max-w-md">
              <h2 className="text-2xl font-bold mb-6 text-white">Product Not Found</h2>
              <p className="text-gray-300 mb-8">The product you are looking for does not exist or has been removed.</p>
              <Link href="/products">
                <Button
                  size="lg"
                  className="text-[#1D212D] font-semibold hover:scale-105 transition-all duration-300 shadow-lg"
                  style={{ backgroundColor: "#F3C998" }}
                >
                  Browse Products
                </Button>
              </Link>
            </div>
          </div>
          <Footer />
        </HeaderWrapper>
      </div>
    )
  }

  // Get product data
  const productPrice = getProductPrice(product) ?? 0;
  const productStock = getProductStock(product) ?? 0;
  const categoryName = product.category_details?.name || product.category?.name || product.category_name || "Unknown";
  const sellerName = product.seller_name || product.seller_username || "Unknown";

  // Mock variants for demonstration
  const variants = [
    { name: "Regular", price: productPrice },
    { name: "Premium", price: productPrice * 1.1 },
    { name: "Deluxe", price: productPrice * 1.2 },
  ]

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#1D212D] via-[#2A2F3A] to-[#1D212D] relative">
      {/* Full screen background pattern */}
      <div className="fixed inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #F3C998 0%, transparent 50%), 
                           radial-gradient(circle at 75% 75%, #F3C998 0%, transparent 50%)`,
          }}
        ></div>
      </div>

      {/* Animated geometric shapes */}
      <div className="fixed top-20 left-10 w-32 h-32 border border-[#F3C998]/10 rounded-full animate-pulse"></div>
      <div className="fixed top-40 right-20 w-24 h-24 border border-[#F3C998]/15 rounded-lg rotate-45 animate-pulse delay-1000"></div>
      <div className="fixed bottom-32 left-1/4 w-16 h-16 bg-[#F3C998]/5 rounded-full animate-pulse delay-500"></div>

      <HeaderWrapper>
        <div className="relative z-10 min-h-screen w-full p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Back Button */}
            <div className="mb-6">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 backdrop-blur-sm"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Products
              </Button>
            </div>

            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
                <span style={{ color: "#F3C998" }}>{product.name}</span>
              </h1>
              <p className="text-gray-400 text-lg">Premium {categoryName}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Left column - Product media */}
              <div className="space-y-6">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden shadow-2xl hover:shadow-[#F3C998]/10 transition-all duration-500">
                  <div className="aspect-square relative">
                    <ProductImageCarousel
                      images={carouselImages}
                      productName={product.name}
                      onHover={true}
                      className="w-full h-full"
                    />

                    {/* Media type badges */}
                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                      {models.length > 0 && (
                        <Badge className="bg-blue-500/80 text-white flex items-center gap-1 backdrop-blur-sm border-0 shadow-lg">
                          <Cube className="h-4 w-4" />
                          <span>3D Model</span>
                        </Badge>
                      )}
                      {videos.length > 0 && (
                        <Badge className="bg-green-500/80 text-white flex items-center gap-1 backdrop-blur-sm border-0 shadow-lg">
                          <Play className="h-4 w-4" />
                          <span>Video</span>
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3D Model Gallery */}
                {models.length > 0 && (
                  <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl hover:shadow-[#F3C998]/10 transition-all duration-500">
                    <h3 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
                      <Cube className="h-5 w-5" style={{ color: "#F3C998" }} />
                      3D Model View
                    </h3>
                    {models.map((model, idx) => (
                      <Simple3DViewer
                        key={model.id || idx}
                        modelUrl={getBackendMediaUrl(model.file || model.url)}
                        productName={product.name}
                        isDefault={true}
                        width={500}
                        height={400}
                        showControls={true}
                        showARButton={true}
                        className="mb-4"
                      />
                    ))}
                  </div>
                )}

                {/* Video Gallery */}
                {videos.length > 0 && (
                  <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl hover:shadow-[#F3C998]/10 transition-all duration-500">
                    <h3 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
                      <Play className="h-5 w-5" style={{ color: "#F3C998" }} />
                      Product Videos
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      {videos.map((video, index) => (
                        <div key={index} className="relative aspect-video overflow-hidden rounded-lg border border-white/20">
                          <video
                            src={video.file || video.url}
                            controls
                            className="w-full h-full object-cover"
                            poster="/placeholder.svg?height=200&width=300"
                          >
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right column - Product info and purchase options */}
              <div className="space-y-8">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white leading-tight">{product.name}</h1>

                  {/* Rating */}
                  <div className="flex items-center mb-6">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-5 w-5 ${
                            star <= Math.round(Number(product.average_rating) || 0)
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-500"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="ml-3 text-gray-300 text-sm">
                      {Number(product.average_rating || 0).toFixed(1)} ({product.reviews?.length || 0} reviews)
                    </span>
                  </div>

                  {/* Price */}
                  <div className="mb-8">
                    <div className="flex items-baseline gap-4">
                      <span className="text-4xl font-bold" style={{ color: "#F3C998" }}>
                        ${productPrice.toFixed(2)}
                      </span>
                      {product.discount_price && product.discount_price < product.price && (
                        <span className="text-2xl text-gray-500 line-through">
                          ${Number(product.price).toFixed(2)}
                        </span>
                      )}
                    </div>
                    {product.discount_price && product.discount_price < product.price && (
                      <div className="mt-2">
                        <Badge className="bg-red-500/80 text-white border-0 shadow-lg backdrop-blur-sm">
                          Save ${(Number(product.price) - Number(product.discount_price)).toFixed(2)} (
                          {Math.round(((Number(product.price) - Number(product.discount_price)) / Number(product.price)) * 100)}% off)
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Stock Status */}
                  <div className="mb-8">
                    {isOutOfStock ? (
                      <Badge variant="destructive" className="text-base px-4 py-2 border-0 shadow-lg">
                        Out of Stock
                      </Badge>
                    ) : (
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-base px-4 py-2 backdrop-blur-sm shadow-lg">
                        In Stock ({productStock} available)
                      </Badge>
                    )}
                  </div>

                  {/* Quantity Selector */}
                  {!isOutOfStock && (
                    <div className="mb-8">
                      <label className="block text-white font-medium mb-3 text-lg">Quantity</label>
                      <div className="flex items-center gap-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={quantity <= 1}
                          className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 backdrop-blur-sm bg-white/5 h-10 w-10 rounded-xl"
                        >
                          -
                        </Button>
                        <span className="text-xl font-medium text-white px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 min-w-[60px] text-center">
                          {quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQuantity(Math.min(productStock, quantity + 1))}
                          disabled={quantity >= productStock}
                          className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 backdrop-blur-sm bg-white/5 h-10 w-10 rounded-xl"
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <Button
                      size="lg"
                      className="flex-1 text-[#1D212D] font-semibold hover:scale-105 transition-all duration-300 shadow-lg text-lg py-6 rounded-xl border-0"
                      style={{ backgroundColor: "#F3C998" }}
                      onClick={handleAddToCart}
                      disabled={isOutOfStock || isAddingToCart}
                    >
                      {isAddingToCart ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="mr-2 h-5 w-5" />
                          Add to Cart
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 backdrop-blur-sm py-6 bg-white/5 rounded-xl"
                      onClick={handleAddToWishlist}
                      disabled={isAddingWishlist}
                    >
                      {isAddingWishlist ? <Loader2 className="h-5 w-5 animate-spin" /> : <Heart className="h-5 w-5" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 backdrop-blur-sm py-6 bg-white/5 rounded-xl"
                      onClick={handleShare}
                    >
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Features */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300">
                      <Truck className="h-6 w-6" style={{ color: "#F3C998" }} />
                      <div>
                        <div className="font-medium text-white">Free Shipping</div>
                        <div className="text-sm text-gray-400">On orders over $50</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300">
                      <Shield className="h-6 w-6" style={{ color: "#F3C998" }} />
                      <div>
                        <div className="font-medium text-white">Secure Payment</div>
                        <div className="text-sm text-gray-400">100% protected</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300">
                      <RotateCcw className="h-6 w-6" style={{ color: "#F3C998" }} />
                      <div>
                        <div className="font-medium text-white">Easy Returns</div>
                        <div className="text-sm text-gray-400">30-day policy</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Details Tabs */}
            <div className="mt-16">
              <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl overflow-hidden">
                <Tabs defaultValue="description" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 bg-white/10 backdrop-blur-xl border-b border-white/20 p-1 rounded-none">
                    <TabsTrigger
                      value="description"
                      className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-300 hover:text-white transition-all duration-300 data-[state=active]:shadow-lg rounded-lg"
                    >
                      Description
                    </TabsTrigger>
                    <TabsTrigger
                      value="specifications"
                      className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-300 hover:text-white transition-all duration-300 data-[state=active]:shadow-lg rounded-lg"
                    >
                      Specifications
                    </TabsTrigger>
                    <TabsTrigger
                      value="reviews"
                      className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-300 hover:text-white transition-all duration-300 data-[state=active]:shadow-lg rounded-lg"
                    >
                      Reviews ({product.reviews?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger
                      value="variants"
                      className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-300 hover:text-white transition-all duration-300 data-[state=active]:shadow-lg rounded-lg"
                    >
                      Variants
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="description" className="p-8">
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-300 text-lg leading-relaxed">
                        {product.description || "No description available for this product."}
                      </p>
                    </div>
                  </TabsContent>
                  <TabsContent value="specifications" className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-4 text-white text-lg">Product Details</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between py-3 border-b border-white/10">
                            <span className="text-gray-400">SKU</span>
                            <span className="text-white font-medium">{product.id}</span>
                          </div>
                          <div className="flex justify-between py-3 border-b border-white/10">
                            <span className="text-gray-400">Category</span>
                            <span className="text-white font-medium">{categoryName}</span>
                          </div>
                          <div className="flex justify-between py-3 border-b border-white/10">
                            <span className="text-gray-400">Stock</span>
                            <span className="text-white font-medium">{productStock} units</span>
                          </div>
                          <div className="flex justify-between py-3 border-b border-white/10">
                            <span className="text-gray-400">Seller</span>
                            <span className="text-white font-medium">{sellerName}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-4 text-white text-lg">Additional Info</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between py-3 border-b border-white/10">
                            <span className="text-gray-400">Weight</span>
                            <span className="text-white font-medium">N/A</span>
                          </div>
                          <div className="flex justify-between py-3 border-b border-white/10">
                            <span className="text-gray-400">Dimensions</span>
                            <span className="text-white font-medium">N/A</span>
                          </div>
                          <div className="flex justify-between py-3 border-b border-white/10">
                            <span className="text-gray-400">Material</span>
                            <span className="text-white font-medium">N/A</span>
                          </div>
                          <div className="flex justify-between py-3 border-b border-white/10">
                            <span className="text-gray-400">Warranty</span>
                            <span className="text-white font-medium">1 Year</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="reviews" className="p-8">
                    <div className="space-y-6">
                      {Array.isArray(product.reviews) && product.reviews.length > 0 ? (
                        product.reviews.map((review) => (
                          <div key={review.id} className="border-b border-white/10 pb-6 mb-6">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-4 w-4 ${
                                      star <= (review.rating || 0)
                                        ? "text-yellow-400 fill-yellow-400"
                                        : "text-gray-500"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="font-medium text-white">{review.user_id || "User"}</span>
                              <span className="text-xs text-gray-500">{new Date(review.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="text-gray-300 text-base">{review.comment}</div>
                            <div className="text-xs text-gray-500 mt-2">Rating: {review.rating}/5</div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-400 text-lg">No reviews yet. Be the first to review this product!</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="variants" className="p-8">
                    <div className="space-y-6">
                      {Array.isArray(product.variants) && product.variants.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {product.variants.map((variant) => (
                            <div key={variant.id} className="border border-white/20 rounded-lg p-4 bg-white/5">
                              <div className="font-medium text-white mb-2">{variant.name || `Variant #${variant.id}`}</div>
                              <div className="text-sm text-gray-300 mb-2">
                                Price: ${variant.price_adjustment ? (Number(product.price) + Number(variant.price_adjustment)).toFixed(2) : Number(product.price).toFixed(2)}
                              </div>
                              <div className="text-sm text-gray-300 mb-2">Stock: {variant.stock_quantity ?? 0}</div>
                              {Array.isArray(variant.options) && variant.options.length > 0 && (
                                <div className="text-xs text-gray-400">
                                  Options: {variant.options.map(opt => opt.option_value || opt.value).join(", ")}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-400 text-lg">No variants available for this product.</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </Card>
            </div>
          </div>
        </div>
        <Footer />
      </HeaderWrapper>
    </div>
  )
}
