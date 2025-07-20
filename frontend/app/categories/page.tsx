"use client"

import { useEffect } from "react"
import { useGetCategoriesQuery } from "@/store/services/productApi"
import HeaderWrapper from "../header-wrapper"
import Footer from "@/components/layout/footer"
import CategoryCard from "@/components/home/category-card"
import { Category } from "@/app/types/product"

export default function CategoriesPage() {
  const { data: categories, isLoading, error } = useGetCategoriesQuery()

  useEffect(() => {
    console.log("Categories data:", categories)
    console.log("Categories error:", error)
  }, [categories, error])

  const getCategoryTree = () => {
    if (!categories) return { rootCategories: [], childrenMap: {} }

    const childrenMap: Record<number, Category[]> = {}
    categories.forEach((cat) => {
      if (cat.parent_id) {
        if (!childrenMap[cat.parent_id]) {
          childrenMap[cat.parent_id] = []
        }
        childrenMap[cat.parent_id].push(cat)
      }
    })

    const rootCategories = categories.filter((cat) => !cat.parent_id)
    return { rootCategories, childrenMap }
  }

  const { rootCategories, childrenMap } = getCategoryTree()

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
      <div className="fixed bottom-20 right-1/3 w-20 h-20 border border-[#F3C998]/10 rounded-lg rotate-12 animate-pulse delay-1500"></div>

      {/* Floating particles */}
      <div className="fixed top-1/4 left-1/3 w-2 h-2 bg-[#F3C998]/20 rounded-full animate-bounce"></div>
      <div className="fixed top-3/4 right-1/4 w-1 h-1 bg-[#F3C998]/30 rounded-full animate-bounce delay-700"></div>
      <div className="fixed top-1/2 left-1/5 w-1.5 h-1.5 bg-[#F3C998]/25 rounded-full animate-bounce delay-300"></div>

      <HeaderWrapper>
        <main className="relative z-10 min-h-screen w-full">
          {/* Hero Banner */}
          <section className="relative py-24">
            <div className="container mx-auto px-4 relative z-10">
              <div className="max-w-4xl mx-auto text-center text-white">
                <h1 className="text-4xl md:text-6xl font-bold mb-6">
                  Shop by <span style={{ color: "#F3C998" }}>Category</span>
                </h1>
                <p className="text-xl text-gray-300">Browse our wide selection of products across popular categories</p>
              </div>
            </div>
          </section>

          {/* Categories Grid */}
          <section className="py-16">
            <div className="container mx-auto px-4">
              {error || !categories || categories.length === 0 ? (
                <div>
                  <div className="mb-8 p-6 bg-yellow-500/20 border border-yellow-500/30 rounded-xl backdrop-blur-sm">
                    <h3 className="text-yellow-300 font-medium text-lg">API Connection Issue</h3>
                    <p className="mt-2 text-yellow-200">
                      We couldn't load categories from the API. Showing fallback data instead.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {/* Fallback categories removed */}
                  </div>
                </div>
              ) : (
                <div>
                  {rootCategories.length > 0 ? (
                    <div className="space-y-16">
                      {rootCategories.map((rootCategory) => (
                        <div key={rootCategory.id} className="space-y-8">
                          <h2 className="text-3xl font-bold text-white border-b border-white/20 pb-4">
                            {rootCategory.name}
                          </h2>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden hover:bg-white/15 transition-all duration-500 shadow-2xl hover:shadow-[#F3C998]/10 group">
                              <CategoryCard
                                key={rootCategory.id}
                                name={`All ${rootCategory.name}`}
                                image={rootCategory.image_url || `/images/categories/${rootCategory.name.toLowerCase().replace(/\s+/g, "-")}.jpg`}
                                count="Browse All"
                                href={`/categories/${rootCategory.id}`}
                              />
                            </div>
                            {childrenMap[rootCategory.id]?.map((childCategory: Category) => (
                              <div
                                key={childCategory.id}
                                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden hover:bg-white/15 transition-all duration-500 shadow-2xl hover:shadow-[#F3C998]/10 group"
                              >
                                <CategoryCard
                                  name={childCategory.name}
                                  image={childCategory.image_url || `/placeholder.svg?height=300&width=300&query=${encodeURIComponent(childCategory.name)}`}
                                  count="View Products"
                                  href={`/categories/${childCategory.id}`}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                      {categories.map((category: Category) => (
                        <div
                          key={category.id}
                          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden hover:bg-white/15 transition-all duration-500 shadow-2xl hover:shadow-[#F3C998]/10 group"
                        >
                          <CategoryCard
                            name={category.name}
                            image={category.image_url || `/placeholder.svg?height=300&width=300&query=${encodeURIComponent(category.name)}`}
                            count="View Products"
                            href={`/categories/${category.id}`}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </main>
        <Footer />
      </HeaderWrapper>
    </div>
  )
}
