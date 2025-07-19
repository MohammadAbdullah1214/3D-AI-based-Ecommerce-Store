"use client"
import { memo } from "react"
import ProductGrid from "@/components/products/product-grid"

// Memoize the component to prevent unnecessary re-renders
const FeaturedProducts = memo(function FeaturedProducts() {
  return (
    <section className="py-12 backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8 text-white">Featured Products</h2>
        <ProductGrid filters={{ is_featured: true, page_size: 6 }} />
      </div>
    </section>
  )
})

export default FeaturedProducts
