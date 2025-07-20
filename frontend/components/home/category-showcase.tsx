import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useGetCategoriesQuery } from "@/store/services/productApi"
import { Skeleton } from "@/components/ui/skeleton"

export default function CategoryShowcase() {
  const { data: categories, isLoading } = useGetCategoriesQuery()
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-white">Shop by Category</h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Browse our curated collections of innovative products across different categories.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {isLoading && Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="overflow-hidden backdrop-blur-xl bg-white/5 border border-white/10">
              <Skeleton className="h-32 w-full mb-4 bg-white/10" />
              <CardContent className="p-6">
                <Skeleton className="h-6 w-1/2 mb-2 bg-white/10" />
                <Skeleton className="h-4 w-3/4 mb-4 bg-white/10" />
                <Skeleton className="h-4 w-1/3 mb-4 bg-white/10" />
                <Skeleton className="h-10 w-full bg-white/10" />
              </CardContent>
            </Card>
          ))}
          {!isLoading && categories && categories.map((category) => (
            <Card
              key={category.id}
              className="overflow-hidden backdrop-blur-xl bg-white/5 border border-white/10 transition-all hover:shadow-2xl hover:border-[#F3C998]/30"
            >
              <div className="h-32 bg-gradient-to-r from-[#F3C998]/20 to-[#F3C998]/10 relative flex items-center justify-center">
                <img
                  src={category.image_url || "/placeholder.svg"}
                  alt={category.name}
                  className="object-cover w-full h-full rounded-t-2xl"
                  style={{ maxHeight: '100%', maxWidth: '100%' }}
                  onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
                />
              </div>

              <CardContent className="p-6">
                <h3 className="font-bold text-xl mb-2 text-white">{category.name}</h3>
                <p className="text-sm text-gray-300 mb-4">{category.description}</p>
                <p className="text-sm mb-4 text-[#F3C998]">{category.product_count || 0} products</p>

                <Link href={`/products?category=${category.id}`}>
                  <Button
                    variant="outline"
                    className="w-full border-[#F3C998]/30 text-white hover:bg-[#F3C998]/10 hover:border-[#F3C998] backdrop-blur-sm transition-all bg-transparent"
                  >
                    Browse {category.name}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

