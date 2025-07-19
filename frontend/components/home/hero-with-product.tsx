"use client"

import { useGetProductsQuery } from "@/store/services/productApi"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Sparkles, Star } from "lucide-react"
import Simple3DViewer from "@/components/product/simple-3d-viewer"
import { getBackendMediaUrl } from "@/utils/product-utils"

export default function HeroWithProduct() {
  // Fetch products - no authentication required, no specific filters
  const {
    data: products,
    isLoading: productsLoading,
    error,
  } = useGetProductsQuery({
    page_size: 10,
  })

  // Find a product with a 3D model
  const featuredProduct =
    products?.find((product) => {
      return product.media && product.media.some((m) => m.file_type === "model")
    }) || products?.[0]
  const modelMedia = featuredProduct?.media?.find((m) => m.file_type === "model")

  const isLoading = productsLoading

  // Debug logging
  console.log("Hero Debug:", {
    productsCount: products?.length,
    featuredProduct,
    isLoading,
    error,
    hasImageUrls: featuredProduct?.image_urls?.length,
  })

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Full screen background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1D212D] via-[#2A2F3A] to-[#1D212D]"></div>

      {/* Enhanced decorative blobs */}
      <div className="absolute top-20 right-[10%] w-96 h-96 bg-[#F3C998]/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 left-[5%] w-[500px] h-[500px] bg-[#F3C998]/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#F3C998]/5 rounded-full blur-3xl animate-pulse delay-500"></div>

      <div className="container mx-auto px-4 py-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col items-center justify-center text-center lg:text-center lg:pr-0 w-full h-full min-h-[500px]">
            <Badge className="mb-8 py-3 px-6 text-lg bg-[#F3C998]/20 text-[#F3C998] border border-[#F3C998]/30 backdrop-blur-md">
              <Sparkles className="h-5 w-5 mr-2" /> Premium Collection 2025
            </Badge>
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-8 leading-tight">
              Discover{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F3C998] via-[#E6B87D] to-[#F3C998] animate-pulse">
                Amazing
              </span>{" "}
              Products
            </h1>
            <p className="text-2xl md:text-3xl text-gray-300 mb-12 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              {featuredProduct
                ? `Experience our ${featuredProduct.name} in stunning detail`
                : "Shop the latest trends with our easy-to-use platform and secure checkout."}
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start mb-12">
              <Link href="/products">
                <Button
                  size="lg"
                  className="bg-[#F3C998] text-[#1D212D] hover:bg-[#E6B87D] w-full sm:w-auto text-xl h-16 px-10 rounded-2xl shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105"
                >
                  Shop Now
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
              </Link>
              {featuredProduct && (
                <Link href={`/products/${featuredProduct.id}`}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-3 border-[#F3C998]/50 text-white hover:bg-[#F3C998]/10 w-full sm:w-auto text-xl h-16 px-10 rounded-2xl backdrop-blur-sm transform hover:scale-105 transition-all hover:border-[#F3C998] bg-transparent"
                  >
                    View Product
                  </Button>
                </Link>
              )}
            </div>

            {/* Product rating if available */}
            {featuredProduct?.average_rating && (
              <div className="mt-8 flex items-center justify-center lg:justify-start">
                <div className="flex items-center backdrop-blur-md bg-white/10 border border-[#F3C998]/30 px-4 py-2 rounded-full">
                  <div className="flex items-center mr-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor(Number(featuredProduct.average_rating))
                            ? "text-[#F3C998] fill-[#F3C998]"
                            : "text-white/50"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-white font-medium">
                    {Number(featuredProduct.average_rating).toFixed(1)} ({featuredProduct.review_count || 0} reviews)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Glass Container for Product Display */}
          <div className="relative flex justify-center lg:justify-start items-center min-h-[600px] h-full w-full">
            {/* Outer glow effect */}
            <div className="absolute -inset-8 bg-gradient-to-r from-[#F3C998]/30 via-[#F3C998]/20 to-[#F3C998]/30 rounded-3xl blur-3xl opacity-70 animate-pulse"></div>

            {/* Main glass container */}
            <div className="relative w-full h-[60vw] max-h-[700px] min-h-[400px] rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center">
              {/* Glass effect layers */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-[#F3C998]/40 rounded-3xl"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-[#F3C998]/10 to-transparent rounded-3xl"></div>

              {/* Inner content container */}
              <div className="relative h-full w-full flex items-center justify-center p-4">
                <div className="w-full h-full min-h-[300px] min-w-[300px] rounded-2xl overflow-hidden bg-white/5 backdrop-blur-sm border border-[#F3C998]/30 flex items-center justify-center">
                  {!isLoading && modelMedia ? (
                    <Simple3DViewer
                      modelUrl={getBackendMediaUrl(modelMedia.url)}
                      productName={featuredProduct?.name || "Product"}
                      isDefault={false}
                      width={undefined}
                      height={undefined}
                      style={{ width: '100%', height: '100%' }}
                    />
                  ) : (
                    // Fallback to default 3D model
                    <Simple3DViewer
                      modelUrl={getBackendMediaUrl("/assets/3d/shirt.glb")}
                      productName={featuredProduct?.name || "Default Model"}
                      isDefault={true}
                      width={undefined}
                      height={undefined}
                      style={{ width: '100%', height: '100%' }}
                    />
                  )}
                </div>
              </div>

              {/* Enhanced floating accent elements */}
              <div className="absolute top-6 right-6 w-4 h-4 bg-[#F3C998]/40 rounded-full backdrop-blur-sm animate-pulse"></div>
              <div className="absolute bottom-6 left-6 w-3 h-3 bg-[#F3C998]/30 rounded-full backdrop-blur-sm animate-pulse delay-500"></div>
              <div className="absolute top-1/2 -right-3 w-2 h-2 bg-[#F3C998]/50 rounded-full backdrop-blur-sm animate-pulse delay-1000"></div>
              <div className="absolute top-1/3 -left-2 w-1 h-1 bg-[#F3C998]/60 rounded-full backdrop-blur-sm animate-pulse delay-1500"></div>
            </div>

            {/* Additional decorative elements */}
            <div className="absolute -top-8 -left-8 w-16 h-16 bg-gradient-to-br from-[#F3C998]/40 to-[#F3C998]/20 rounded-full blur-sm animate-pulse"></div>
            <div className="absolute -bottom-10 -right-10 w-20 h-20 bg-gradient-to-br from-[#F3C998]/30 to-[#F3C998]/10 rounded-full blur-sm animate-pulse delay-1000"></div>
          </div>
        </div>
      </div>

      {/* Enhanced wave divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full">
          <path
            fill="rgba(29, 33, 45, 0.8)"
            fillOpacity="1"
            d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,149.3C960,160,1056,160,1152,138.7C1248,117,1344,75,1392,53.3L1440,32L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          ></path>
        </svg>
      </div>
    </section>
  )
}
