"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { useGetProductsByCategoryQuery, useGetCategoriesQuery } from "@/store/services/productApi"
import { useAddToCartMutation } from "@/store/services/cartApi"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { ShoppingCart, Star, Filter, ChevronDown, ArrowLeft, CuboidIcon as Cube, Play } from "lucide-react"
import HeaderWrapper from "@/app/header-wrapper"
import Footer from "@/components/layout/footer"
import { formatCurrency } from "@/utils/format-utils"
import { hasMediaType } from "@/utils/product-utils"
import { useAuth } from "@/hooks/useAuth"
import type { Product, Category } from "@/app/types"

export default function CategoryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const categoryId = typeof params?.id === "string" ? Number.parseInt(params.id) : Number(params.id)

  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [sortBy, setSortBy] = useState("relevance")

  const { data: categories } = useGetCategoriesQuery()
  const category = categories?.find((c) => c.id === categoryId)

  const { data: products, isLoading, error } = useGetProductsByCategoryQuery(categoryId)

  const [addToCart, { isLoading: isAddingToCart }] = useAddToCartMutation()

  const { currentUser, isLoadingUser } = useAuth()
  const user = currentUser
  const isAuthenticated = !!currentUser

  const handleAddToCart = async (product: Product) => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    if (user && product && (user.id === product.seller_id || user.username === product.seller_username)) {
      toast({
        title: "Not allowed",
        description: "You cannot add your own product to cart.",
        variant: "destructive",
      })
      return
    }

    try {
      await addToCart({
        product_id: product.id,
        quantity: 1,
      }).unwrap()
      toast({
        title: "Added to cart",
        description: "Product has been added to your cart.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add product to cart.",
        variant: "destructive",
      })
    }
  }

  const getParentCategories = () => {
    if (!categories || !category) return []
    const result: Category[] = []
    let currentParentId = category.parent_id
    while (currentParentId) {
      const parentCategory = categories.find((c: Category) => c.id === currentParentId)
      if (parentCategory) {
        result.unshift(parentCategory)
        currentParentId = parentCategory.parent_id
      } else {
        break
      }
    }
    return result
  }

  const parentCategories = getParentCategories()
  const subcategories = categories?.filter((c: Category) => c.parent_id === categoryId) || []

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
            {/* Breadcrumb navigation */}
            <div className="flex items-center mb-8 text-base">
              <Link href="/categories" className="text-gray-400 hover:text-white transition-colors">
                Categories
              </Link>
              {parentCategories.map((parent, index) => (
                <div key={parent.id} className="flex items-center">
                  <span className="mx-3 text-gray-500">/</span>
                  <Link href={`/categories/${parent.id}`} className="text-gray-400 hover:text-white transition-colors">
                    {parent.name}
                  </Link>
                </div>
              ))}
              {category && (
                <>
                  <span className="mx-3 text-gray-500">/</span>
                  <span className="font-medium text-white">{category.name}</span>
                </>
              )}
            </div>

            {/* Category header */}
            <div className="mb-12 text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                {category?.name || "Category"} <span style={{ color: "#F3C998" }}>Collection</span>
              </h1>
              <p className="text-gray-400 text-lg">
                Browse our selection of {category?.name.toLowerCase() || "products"} and find exactly what you're
                looking for.
              </p>
            </div>

            {/* Subcategories */}
            {subcategories.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-semibold mb-6 text-white">Subcategories</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {subcategories.map((subcat) => (
                    <Link key={subcat.id} href={`/categories/${subcat.id}`}>
                      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-all duration-500 text-center shadow-2xl hover:shadow-[#F3C998]/10 group">
                        <span className="text-white font-medium group-hover:text-[#F3C998] transition-colors">
                          {subcat.name}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Filters sidebar */}
              <aside className={`w-full lg:w-80 shrink-0 ${showMobileFilters ? "block" : "hidden lg:block"}`}>
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl">
                  <h3 className="font-medium mb-6 text-white text-xl">Filters</h3>

                  {/* Mobile filter button */}
                  <div className="lg:hidden mb-6">
                    <Button
                      variant="outline"
                      className="w-full flex items-center justify-between border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 backdrop-blur-sm bg-transparent"
                      onClick={() => setShowMobileFilters(!showMobileFilters)}
                    >
                      <span className="flex items-center">
                        <Filter className="h-4 w-4 mr-2" />
                        Filters
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${showMobileFilters ? "rotate-180" : ""}`}
                      />
                    </Button>
                  </div>

                  {/* Price Range */}
                  <div className="mb-8">
                    <h4 className="font-medium mb-4 text-white">Price Range</h4>
                    <div className="space-y-3">
                      {["Under $25", "$25 to $50", "$50 to $100", "$100 to $200", "$200 & Above"].map(
                        (range, index) => (
                          <div key={index} className="flex items-center">
                            <input type="checkbox" id={`price-${index}`} className="mr-3 rounded" />
                            <label
                              htmlFor={`price-${index}`}
                              className="text-gray-300 hover:text-white transition-colors cursor-pointer"
                            >
                              {range}
                            </label>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  <Separator className="my-6 bg-white/20" />

                  {/* Customer Reviews */}
                  <div className="mb-8">
                    <h4 className="font-medium mb-4 text-white">Customer Reviews</h4>
                    <div className="space-y-3">
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <div key={rating} className="flex items-center">
                          <input type="checkbox" id={`rating-${rating}`} className="mr-3 rounded" />
                          <label htmlFor={`rating-${rating}`} className="flex items-center cursor-pointer">
                            {Array(5)
                              .fill(0)
                              .map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-500"}`}
                                />
                              ))}
                            <span className="ml-2 text-sm text-gray-300">& Up</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator className="my-6 bg-white/20" />

                  {/* Availability */}
                  <div className="mb-8">
                    <h4 className="font-medium mb-4 text-white">Availability</h4>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input type="checkbox" id="in-stock" className="mr-3 rounded" />
                        <label
                          htmlFor="in-stock"
                          className="text-gray-300 hover:text-white transition-colors cursor-pointer"
                        >
                          In Stock
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" id="out-of-stock" className="mr-3 rounded" />
                        <label
                          htmlFor="out-of-stock"
                          className="text-gray-300 hover:text-white transition-colors cursor-pointer"
                        >
                          Out of Stock
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </aside>

              {/* Product grid */}
              <main className="flex-1">
                {/* Sort options */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4 mb-8 flex justify-between items-center shadow-2xl">
                  <div className="flex items-center">
                    <Filter className="h-5 w-5 mr-3" style={{ color: "#F3C998" }} />
                    <span className="text-base font-medium text-white">Sort by:</span>
                  </div>
                  <select
                    className="text-base border-0 bg-transparent focus:ring-0 text-white bg-white/10 rounded-lg px-3 py-1"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="relevance">Relevance</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Avg. Customer Review</option>
                    <option value="newest">Newest Arrivals</option>
                  </select>
                </div>

                {/* Products grid */}
                {error ? (
                  <div className="text-center py-16">
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-12 shadow-2xl max-w-md mx-auto">
                      <h3 className="text-2xl font-medium mb-6 text-white">Error loading products</h3>
                      <p className="text-gray-300 mb-8">There was a problem loading products for this category.</p>
                      <Button
                        onClick={() => router.back()}
                        size="lg"
                        className="text-[#1D212D] font-semibold hover:scale-105 transition-all duration-300 shadow-lg"
                        style={{ backgroundColor: "#F3C998" }}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Go Back
                      </Button>
                    </div>
                  </div>
                ) : products && products.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {products.map((product) => (
                      <Card
                        key={product.id}
                        className="bg-white/10 backdrop-blur-xl border border-white/20 overflow-hidden hover:bg-white/15 transition-all duration-500 shadow-2xl hover:shadow-[#F3C998]/10 group"
                      >
                        <Link href={`/products/${product.id}`} className="block">
                          <div className="aspect-square relative">
                            <Image
                              src={
                                product.images && product.images.length > 0
                                  ? product.images[0].image_url || "/placeholder-300px-height.png"
                                  : "/placeholder-300px-height.png"
                              }
                              alt={product.name}
                              fill
                              className="object-cover transition-transform group-hover:scale-105"
                            />
                            {product.discount_price && product.discount_price < product.price && (
                              <Badge className="absolute top-3 left-3 bg-red-500 text-white">
                                Save ${(product.price - product.discount_price).toFixed(2)}
                              </Badge>
                            )}

                            {/* Media type badges */}
                            <div className="absolute top-3 right-3 flex flex-col gap-2">
                              {hasMediaType(product, "model_3d") && (
                                <Badge className="bg-blue-500/80 text-white flex items-center gap-1 backdrop-blur-sm">
                                  <Cube className="h-3 w-3" />
                                  <span className="text-xs">3D</span>
                                </Badge>
                              )}
                              {hasMediaType(product, "video") && (
                                <Badge className="bg-green-500/80 text-white flex items-center gap-1 backdrop-blur-sm">
                                  <Play className="h-3 w-3" />
                                  <span className="text-xs">Video</span>
                                </Badge>
                              )}
                            </div>
                          </div>
                        </Link>
                        <CardContent className="p-6">
                          <Link href={`/products/${product.id}`} className="block">
                            <h3 className="font-medium text-base line-clamp-2 mb-2 text-white hover:text-[#F3C998] transition-colors">
                              {product.name}
                            </h3>
                          </Link>
                          <div className="flex items-center mb-3">
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${
                                    star <= Math.round(Number(product.average_rating) || 0)
                                      ? "text-yellow-400 fill-yellow-400"
                                      : "text-gray-500"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="ml-2 text-sm text-gray-400">({product.reviews?.length || 0})</span>
                          </div>
                          <div className="mt-3">
                            <div className="flex items-baseline">
                              <span className="text-xl font-bold text-white">${formatCurrency(product.price)}</span>
                              {product.discount_price && (
                                <span className="ml-3 text-base text-gray-500 line-through">
                                  ${formatCurrency(product.discount_price)}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-400 mt-2">
                              {(product.stock ?? 0 > 0) ? (
                                <span className="text-green-400">In stock</span>
                              ) : (
                                <span className="text-red-400">Out of stock</span>
                              )}
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="p-6 pt-0">
                          <Button
                            size="lg"
                            className="w-full text-[#1D212D] font-semibold hover:scale-105 transition-all duration-300 shadow-lg"
                            style={{ backgroundColor: "#F3C998" }}
                            onClick={() => handleAddToCart(product)}
                            disabled={!product.stock || product.stock <= 0}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Add to cart
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-12 shadow-2xl max-w-md mx-auto">
                      <h3 className="text-2xl font-medium mb-6 text-white">No products found</h3>
                      <p className="text-gray-300 mb-8">There are no products available in this category yet.</p>
                      <Link href="/categories">
                        <Button
                          size="lg"
                          className="text-[#1D212D] font-semibold hover:scale-105 transition-all duration-300 shadow-lg"
                          style={{ backgroundColor: "#F3C998" }}
                        >
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Browse Categories
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </main>
            </div>
          </div>
        </div>
        <Footer />
      </HeaderWrapper>
    </div>
  )
}
