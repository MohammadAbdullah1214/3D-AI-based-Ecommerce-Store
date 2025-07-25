"use client"

import { CardFooter } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useGetProductsQuery, useGetCategoriesQuery } from "@/store/services/productApi"
import { useAddToCartMutation } from "@/store/services/cartApi"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Star,
  ChevronDown,
  Filter,
  SlidersHorizontal,
  ShoppingCart,
  CuboidIcon as Cube,
  Play,
  Heart,
} from "lucide-react"
import Link from "next/link"
import HeaderWrapper from "@/app/header-wrapper"
import Footer from "@/components/layout/footer"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { ProductImageCarousel } from "@/components/product/product-image-carousel"
import { getProductPrice, getProductStock } from "@/utils/product-utils"
import { useRouter } from "next/navigation"
import { useAddItemMutation } from "@/store/services/wishlistApi"
import type { Product } from "@/app/types"
import { useAuth } from "@/hooks/useAuth"
import { useRef } from "react"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select"

// Define the filter state type
interface FiltersState {
  category: string;
  minPrice: number;
  maxPrice: number;
  search: string;
  sortBy: string;
  ageRanges: string[];
  deals: string[];
  reviews: string[];
}

export default function ProductsPage() {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { currentUser, isLoadingUser } = useAuth()
  const user = currentUser
  const isAuthenticated = !!currentUser
  const router = useRouter()

  const initialCategory = searchParams?.get("category") || ""
  const initialMinPrice = searchParams?.get("min_price") ? Number(searchParams.get("min_price")) : 0
  const initialMaxPrice = searchParams?.get("max_price") ? Number(searchParams.get("max_price")) : 500
  const initialSearch = searchParams?.get("search") || ""

  const [filters, setFilters] = useState<FiltersState>({
    category: initialCategory,
    minPrice: initialMinPrice,
    maxPrice: initialMaxPrice,
    search: initialSearch,
    sortBy: "newest",
    ageRanges: [],
    deals: [],
    reviews: [],
  })
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)

  // Debounced search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: value }))
    }, 400)
  }

  // Handle checkbox filter changes
  const handleCheckboxChange = (key: keyof FiltersState, value: string) => {
    setFilters((prev) => {
      const arr = prev[key] as string[]
      return arr.includes(value)
        ? { ...prev, [key]: arr.filter((v: string) => v !== value) }
        : { ...prev, [key]: [...arr, value] }
    })
  }

  // Handle single value filter changes
  const handleSingleFilterChange = (key: keyof FiltersState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  // Reset all filters
  const handleResetFilters = () => {
    setFilters({
      category: "",
      minPrice: 0,
      maxPrice: 500,
      search: "",
      sortBy: "newest",
      ageRanges: [],
      deals: [],
      reviews: [],
    })
  }

  const [showMobileFilters, setShowMobileFilters] = useState(false)

  // Update useGetProductsQuery to use all filters
  const {
    data: products,
    isLoading: productsLoading,
    error: productsError,
  } = useGetProductsQuery({
    category: filters.category || undefined,
    min_price: filters.minPrice,
    max_price: filters.maxPrice,
    search: filters.search || undefined,
    ageRanges: filters.ageRanges,
    deals: filters.deals,
    reviews: filters.reviews,
    sortBy: filters.sortBy,
  })

  const { data: categories, isLoading: categoriesLoading } = useGetCategoriesQuery()

  const [addToCart] = useAddToCartMutation()
  const [addWishlistItem, { isLoading: isAddingWishlist }] = useAddItemMutation()

  const handleQuickAddToCart = async (product: Product) => {
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
        product_id: Number(product.id),
        quantity: 1,
      }).unwrap()
      toast({
        title: "Added to cart",
        description: "Product has been added to your cart.",
      })
    } catch (error) {
      console.error("Add to cart error:", error)
      toast({
        title: "Error",
        description: "Failed to add product to cart.",
        variant: "destructive",
      })
    }
  }

  const handleAddToWishlist = async (product: Product) => {
    if (!product || !product.id) {
      toast({
        title: "Error",
        description: "Invalid product. Please try again.",
        variant: "destructive",
      })
      return
    }
    if (!isAuthenticated) {
      router.push("/login")
      return
    }
    if (user && product && (user.id === product.seller_id || user.username === product.seller_username)) {
      toast({
        title: "Not allowed",
        description: "You cannot wishlist your own product.",
        variant: "destructive",
      })
      return
    }
    try {
      await addWishlistItem({ product_id: Number(product.id) }).unwrap()
      toast({
        title: "Added to wishlist",
        description: "Product has been added to your wishlist.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add product to wishlist.",
        variant: "destructive",
      })
    }
  }

  const ageRanges = [
    { label: "Birth to 24 Months", value: "0-24m" },
    { label: "2 to 4 Years", value: "2-4y" },
    { label: "5 to 7 Years", value: "5-7y" },
    { label: "8 to 13 Years", value: "8-13y" },
    { label: "14 Years & Up", value: "14y+" },
  ]

  const priceRanges = [
    { label: "Up to $5", value: [0, 5] },
    { label: "$5 to $10", value: [5, 10] },
    { label: "$10 to $15", value: [10, 15] },
    { label: "$15 to $25", value: [15, 25] },
    { label: "$25 & above", value: [25, 500] },
  ]

  if (productsLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#1D212D] via-[#2A2F3A] to-[#1D212D]">
        <div className="relative w-24 h-24">
          <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-t-[#F3C998] border-r-transparent border-b-[#F3C998]/50 border-l-transparent animate-spin"></div>
          <div className="absolute top-2 left-2 w-20 h-20 rounded-full border-4 border-t-transparent border-r-[#F3C998]/70 border-b-transparent border-l-[#F3C998] animate-spin"></div>
        </div>
      </div>
    )
  }

  const sortedProducts = [...(products || [])].sort((a, b) => {
    if (filters.sortBy === "newest") return new Date(b.created_at ?? '').getTime() - new Date(a.created_at ?? '').getTime();
    if (filters.sortBy === "price_asc") return Number(a.price) - Number(b.price);
    if (filters.sortBy === "price_desc") return Number(b.price) - Number(a.price);
    if (filters.sortBy === "name_asc") return a.name.localeCompare(b.name);
    if (filters.sortBy === "name_desc") return b.name.localeCompare(a.name);
    // Optionally, add 'popular' sort if you have a popularity metric
    return 0;
  });

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
            {/* Search results header */}
            <div className="mb-8 text-center">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
                {filters.search ? (
                  <>
                    <span style={{ color: "#F3C998" }}>{products?.length || 0}</span> results for "{filters.search}"
                  </>
                ) : (
                  <>
                    All <span style={{ color: "#F3C998" }}>Products</span>
                  </>
                )}
              </h1>
              <p className="text-gray-400 text-lg">Discover amazing products from our marketplace</p>
            </div>

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
                <ChevronDown className={`h-4 w-4 transition-transform ${showMobileFilters ? "rotate-180" : ""}`} />
              </Button>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Filters sidebar */}
              <aside className={`w-full lg:w-80 shrink-0 ${showMobileFilters ? "block" : "hidden lg:block"}`}>
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl">
                  {/* Customer Reviews */}
                  <div className="mb-8">
                    <h3 className="font-medium mb-4 text-white text-lg">Customer Reviews</h3>
                    <div className="space-y-3">
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <div key={rating} className="flex items-center">
                          <Checkbox
                            id={`rating-${rating}`}
                            checked={filters.reviews.includes(rating.toString())}
                            onCheckedChange={() => handleCheckboxChange("reviews", rating.toString())}
                            className="mr-3 border-white/30"
                          />
                          <Label htmlFor={`rating-${rating}`} className="flex items-center cursor-pointer">
                            {Array(5)
                              .fill(0)
                              .map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-500"}`}
                                />
                              ))}
                            <span className="ml-2 text-sm text-gray-300">& Up</span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator className="my-6 bg-white/20" />

                  {/* Price Range */}
                  <div className="mb-8">
                    <h3 className="font-medium mb-4 text-white text-lg">Price</h3>
                    <div className="flex justify-between mb-4 text-base">
                      <span className="text-gray-300">${filters.minPrice}</span>
                      <span className="text-gray-300">to</span>
                      <span className="text-gray-300">${filters.maxPrice}</span>
                    </div>
                    <Slider
                      defaultValue={[filters.minPrice, filters.maxPrice]}
                      max={500}
                      step={5}
                      onValueChange={(values) => {
                        setFilters({
                          ...filters,
                          minPrice: values[0],
                          maxPrice: values[1],
                        })
                      }}
                      className="mb-6"
                    />
                    <div className="space-y-2 text-base">
                      {priceRanges.map((range, index) => (
                        <div key={index} className="flex items-center">
                          <button
                            className="text-left hover:text-[#F3C998] w-full text-gray-300 transition-colors"
                            onClick={() =>
                              setFilters({
                                ...filters,
                                minPrice: range.value[0],
                                maxPrice: range.value[1],
                              })
                            }
                          >
                            {range.label}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator className="my-6 bg-white/20" />

                  {/* Deals & Discounts */}
                  <div className="mb-8">
                    <h3 className="font-medium mb-4 text-white text-lg">Deals & Discounts</h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Checkbox
                          id="all-discounts"
                          checked={filters.deals.length === 0}
                          onCheckedChange={() => handleCheckboxChange("deals", "")}
                          className="mr-3 border-white/30"
                        />
                        <Label
                          htmlFor="all-discounts"
                          className="text-gray-300 hover:text-white transition-colors cursor-pointer"
                        >
                          All Discounts
                        </Label>
                      </div>
                      <div className="flex items-center">
                        <Checkbox
                          id="today-deals"
                          checked={filters.deals.includes("today")}
                          onCheckedChange={() => handleCheckboxChange("deals", "today")}
                          className="mr-3 border-white/30"
                        />
                        <Label
                          htmlFor="today-deals"
                          className="text-gray-300 hover:text-white transition-colors cursor-pointer"
                        >
                          Today's Deals
                        </Label>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6 bg-white/20" />

                  {/* Categories */}
                  <div className="mb-8">
                    <h3 className="font-medium mb-4 text-white text-lg">Categories</h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Checkbox
                          id="all-categories"
                          checked={filters.category === ""}
                          onCheckedChange={() => handleSingleFilterChange("category", "")}
                          className="mr-3 border-white/30"
                        />
                        <Label
                          htmlFor="all-categories"
                          className="text-gray-300 hover:text-white transition-colors cursor-pointer"
                        >
                          All Categories
                        </Label>
                      </div>
                      {categories?.map((category) => (
                        <div key={category.id} className="flex items-center">
                          <Checkbox
                            id={`category-${category.id}`}
                            checked={filters.category === category.id.toString()}
                            onCheckedChange={() => handleSingleFilterChange("category", category.id.toString())}
                            className="mr-3 border-white/30"
                          />
                          <Label
                            htmlFor={`category-${category.id}`}
                            className="text-gray-300 hover:text-white transition-colors cursor-pointer"
                          >
                            {category.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator className="my-6 bg-white/20" />

                  {/* Age Range */}
                  <div className="mb-8">
                    <h3 className="font-medium mb-4 text-white text-lg">Age Range</h3>
                    <div className="space-y-3">
                      {ageRanges.map((range, index) => (
                        <div key={index} className="flex items-center">
                          <Checkbox
                            id={`age-${index}`}
                            checked={filters.ageRanges.includes(range.value)}
                            onCheckedChange={() => handleCheckboxChange("ageRanges", range.value)}
                            className="mr-3 border-white/30"
                          />
                          <Label
                            htmlFor={`age-${index}`}
                            className="text-gray-300 hover:text-white transition-colors cursor-pointer"
                          >
                            {range.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add search filter to sidebar */}
                  <div className="mb-8">
                    <h3 className="font-medium mb-4 text-white text-lg">Search</h3>
                    <input
                      type="text"
                      value={filters.search}
                      onChange={handleSearchChange}
                      placeholder="Search products..."
                      className="w-full px-3 py-2 rounded-lg bg-white/10 dark:bg-gray-800 text-white border border-white/20 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Add Reset Filters button below all filters */}
                  <div className="flex flex-col space-y-2 pt-4">
                    <Button
                      className="bg-primary text-primary-foreground hover:bg-primary/80"
                      onClick={handleResetFilters}
                    >
                      Reset Filters
                    </Button>
                  </div>
                </div>
              </aside>

              {/* Product grid */}
              <main className="flex-1">
                {/* Sort options */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4 mb-8 flex justify-between items-center shadow-2xl">
                  <div className="flex items-center">
                    <SlidersHorizontal className="h-5 w-5 mr-3" style={{ color: "#F3C998" }} />
                    <span className="text-base font-medium text-white">Sort by:</span>
                  </div>
                  <Select value={filters.sortBy} onValueChange={value => setFilters({ ...filters, sortBy: value })}>
                    <SelectTrigger className="w-56 bg-white/10 border border-white/20 text-white focus:ring-2 focus:ring-[#F3C998] focus:border-[#F3C998] placeholder:text-gray-400 transition-colors duration-200" style={{ colorScheme: 'dark' }}>
                      <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#2A2F3A] border-white/20">
                      <SelectItem value="newest" className="text-white hover:bg-white/10">Newest Arrivals</SelectItem>
                      <SelectItem value="price_asc" className="text-white hover:bg-white/10">Price: Low to High</SelectItem>
                      <SelectItem value="price_desc" className="text-white hover:bg-white/10">Price: High to Low</SelectItem>
                      <SelectItem value="popular" className="text-white hover:bg-white/10">Most Popular</SelectItem>
                      <SelectItem value="name_asc" className="text-white hover:bg-white/10">Name: A to Z</SelectItem>
                      <SelectItem value="name_desc" className="text-white hover:bg-white/10">Name: Z to A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Products grid */}
                {productsError ? (
                  <div className="text-center py-16">
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-12 shadow-2xl max-w-md mx-auto">
                      <h3 className="text-2xl font-medium mb-6 text-white">Error loading products</h3>
                      <p className="text-gray-300 mb-8">
                        There was a problem loading products. Please try again later.
                      </p>
                    </div>
                  </div>
                ) : products && products.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {sortedProducts.map((product) => {
                      // Prepare carouselImages outside JSX
                      const imageUrls = product.image_urls || [];
                      const imageIds = product.image_ids || [];
                      const carouselImages = imageUrls.length > 0
                        ? imageUrls
                            .map((url, idx) => ({
                              id: (imageIds && imageIds[idx]) ?? idx,
                              url: url || `/placeholder.svg?height=400&width=400&text=${encodeURIComponent(product.name)}`,
                            }))
                            .filter(img => typeof img.url === 'string' && img.url.trim() && !img.url.includes('undefined'))
                        : [{
                            id: 0,
                            url: `/placeholder.svg?height=400&width=400&text=${encodeURIComponent(product.name)}`,
                          }];

                      return (
                        <Card
                          key={product.id}
                          className="bg-white/10 backdrop-blur-xl border border-white/20 overflow-hidden hover:bg-white/15 transition-all duration-500 shadow-2xl hover:shadow-[#F3C998]/10 group"
                        >
                          <div className="aspect-square relative">
                            {/* Media type icons - top left */}
                            <div className="absolute top-3 left-3 flex flex-col gap-2 z-20">
                              {product.media?.some((m) => m.file_type === "image") && (
                                <span title="2D Images" className="inline-flex items-center px-2 py-1 rounded bg-white/80 dark:bg-[#222] text-black dark:text-white text-xs font-semibold shadow">
                                  <img src="/placeholder.svg" alt="2D" className="h-3 w-3 mr-1 inline" style={{ filter: 'invert(0.5)' }} />2D
                                </span>
                              )}
                              {product.media?.some((m) => m.file_type === "model_3d" || m.file_type === "model") && (
                                <span title="3D Model" className="inline-flex items-center px-2 py-1 rounded bg-blue-500/80 text-white text-xs font-semibold shadow">
                                  <svg className="h-3 w-3 mr-1 inline" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.73z"/></svg>3D
                                </span>
                              )}
                              {product.media?.some((m) => m.file_type === "video") && (
                                <span title="Video" className="inline-flex items-center px-2 py-1 rounded bg-green-500/80 text-white text-xs font-semibold shadow">
                                  <svg className="h-3 w-3 mr-1 inline" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>Video
                                </span>
                              )}
                            </div>
                            <Link href={`/products/${product.id}`}>
                              <ProductImageCarousel
                                images={carouselImages}
                                productName={product.name}
                                onHover={true}
                                className="w-full h-full"
                                allowFullscreen={false}
                              />
                            </Link>
                            {/* Wishlist button - always visible, bottom right */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute bottom-3 right-3 p-2 rounded-full bg-white/80 dark:bg-[#222] hover:bg-[#F3C998] hover:text-black transition-all duration-300 z-30 shadow-lg"
                              onClick={() => handleAddToWishlist(product)}
                              disabled={isAddingWishlist}
                              aria-label="Add to wishlist"
                            >
                              <Heart className="h-4 w-4 text-red-500" />
                            </Button>
                            {/* Discount badge */}
                            {product.discount_price && product.discount_price < product.price && (
                              <Badge className="absolute top-3 left-3 bg-red-500 text-white">
                                Save ${(product.price - product.discount_price).toFixed(2)}
                              </Badge>
                            )}
                          </div>
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
                                <span className="text-xl font-bold text-white">
                                  ${Number(product.price).toFixed(2)}
                                </span>
                                {product.discount_price && product.discount_price < product.price && (
                                  <span className="ml-3 text-base text-gray-500 line-through">
                                    ${Number(product.price).toFixed(2)}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-400 mt-2">
                                {getProductStock(product) > 0 ? (
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
                              onClick={() => handleQuickAddToCart(product)}
                              disabled={getProductStock(product) <= 0}
                            >
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Add to cart
                            </Button>
                          </CardFooter>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-12 shadow-2xl max-w-md mx-auto">
                      <h3 className="text-2xl font-medium mb-6 text-white">No products found</h3>
                      <p className="text-gray-300 mb-8">Try adjusting your filters or search terms.</p>
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
