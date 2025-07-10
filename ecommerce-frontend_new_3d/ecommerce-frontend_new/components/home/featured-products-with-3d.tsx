"use client"

import { useGetProductsQuery } from "@/store/services/productApi"
import { useGetAllMediaQuery } from "@/store/services/mediaApi"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import Simple3DViewer from "@/components/product/simple-3d-viewer"
import Link from "next/link"
import { ChevronRight, Star } from "lucide-react"
import { calculateDiscountPrice } from "@/utils/format-utils"
import { getBackendMediaUrl } from "@/utils/product-utils"
import { ProductGallery } from "@/components/product/product-gallery"

export default function FeaturedProductsWith3D() {
  const { data: products, isLoading: productsLoading, error } = useGetProductsQuery({ trending: true, page_size: 8 })
  const { data: allMedia, isLoading: mediaLoading } = useGetAllMediaQuery()

  const isLoading = productsLoading || mediaLoading

  if (isLoading) {
    return (
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12">
            <div>
              <Badge className="mb-4 bg-[#F3C998]/20 text-[#F3C998] border border-[#F3C998]/30 py-1.5 px-4 text-sm backdrop-blur-sm">
                Featured Collection
              </Badge>
              <h2 className="text-4xl font-bold text-white">Trending Products</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg shadow-md p-6">
                <Skeleton className="aspect-square rounded-lg mb-4 bg-white/10" />
                <Skeleton className="h-4 w-3/4 mb-2 bg-white/10" />
                <Skeleton className="h-4 w-1/2 mb-4 bg-white/10" />
                <Skeleton className="h-10 w-full bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-24">
        <div className="container mx-auto px-4 text-center">
          <p className="text-red-400">Error loading featured products</p>
        </div>
      </section>
    )
  }

  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12">
          <div>
            <Badge className="mb-4 bg-[#F3C998]/20 text-[#F3C998] border border-[#F3C998]/30 py-1.5 px-4 text-sm backdrop-blur-sm">
              Featured Collection
            </Badge>
            <h2 className="text-4xl font-bold text-white">Trending Products</h2>
          </div>
          <Link
            href="/products"
            className="mt-4 md:mt-0 text-[#F3C998] hover:underline flex items-center text-lg font-medium hover:text-[#E6B87D] transition-colors"
          >
            View All Products <ChevronRight className="h-5 w-5 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products?.map((product) => {
            // Get media for this specific product
            const productMedia = allMedia?.filter((media) => media.product === product.id) || []
            const images = productMedia.filter((m) => m.file_type === "image")
            const videos = productMedia.filter((m) => m.file_type === "video")
            const models = productMedia.filter((m) => m.file_type === "model" || m.file_type === "model_3d")
            const galleryMedia = [
              ...images,
              ...videos,
              ...(product.images || []).filter((img) => img.file_type === "image" || img.file_type === "video"),
            ]

            // Fallback to product images if no media from API
            const fallbackImage = product.image_urls?.[0]

            // Calculate display price
            const displayPrice = product.discount_price
              ? typeof product.discount_price === "number"
                ? product.discount_price
                : Number.parseFloat(String(product.discount_price))
              : product.discount_percent
                ? calculateDiscountPrice(
                    typeof product.price === "number" ? product.price : Number.parseFloat(String(product.price)),
                    product.discount_percent,
                  )
                : typeof product.price === "number"
                  ? product.price
                  : Number.parseFloat(String(product.price))

            const originalPrice =
              typeof product.price === "number" ? product.price : Number.parseFloat(String(product.price))
            const hasDiscount = product.discount_price || product.discount_percent

            return (
              <Link key={product.id} href={`/products/${product.id}`}>
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg shadow-md p-6 hover:shadow-2xl transition-all group hover:border-[#F3C998]/30">
                  <div className="aspect-square rounded-lg mb-4 overflow-hidden bg-white/5 relative">
                    <ProductGallery media={galleryMedia} productName={product.name} />
                  </div>
                  {models.length > 0 && (
                    <div className="mb-4">
                      <Simple3DViewer
                        modelUrl={getBackendMediaUrl(models[0].file || models[0].url)}
                        productName={product.name}
                        isDefault={true}
                        width={320}
                        height={320}
                        showControls={false}
                        showARButton={false}
                      />
                    </div>
                  )}
                  <h3 className="font-semibold mb-2 line-clamp-2 text-white">{product.name}</h3>

                  <div className="flex items-center mb-2">
                    {product.average_rating && (
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-[#F3C998] fill-[#F3C998]" />
                        <span className="text-sm text-gray-300 ml-1">
                          {typeof product.average_rating === "number"
                            ? product.average_rating.toFixed(1)
                            : product.average_rating}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      {hasDiscount ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold text-[#F3C998]">${displayPrice.toFixed(2)}</span>
                          <span className="text-sm text-gray-400 line-through">${originalPrice.toFixed(2)}</span>
                        </div>
                      ) : (
                        <span className="text-lg font-bold text-white">${originalPrice.toFixed(2)}</span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {models.length > 0 && (
                        <Badge variant="outline" className="text-xs border-[#F3C998]/30 text-[#F3C998]">
                          3D
                        </Badge>
                      )}
                      {videos.length > 0 && (
                        <Badge variant="outline" className="text-xs border-[#F3C998]/30 text-[#F3C998]">
                          Video
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Button className="w-full bg-[#F3C998] text-[#1D212D] hover:bg-[#E6B87D] group-hover:scale-105 transition-all">
                    View Product
                  </Button>
                </div>
              </Link>
            )
          })}
        </div>

        {(!products || products.length === 0) && (
          <div className="text-center py-12">
            <p className="text-gray-400">No featured products available</p>
          </div>
        )}
      </div>
    </section>
  )
}
