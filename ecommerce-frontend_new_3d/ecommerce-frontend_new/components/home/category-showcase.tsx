import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// This would normally be fetched from your API
const categories = [
  {
    id: "1",
    name: "Smart Home",
    description: "Intelligent devices for your connected home",
    count: 24,
    color: "from-[#F3C998]/20 to-[#F3C998]/10",
  },
  {
    id: "2",
    name: "Wearables",
    description: "Cutting-edge technology you can wear",
    count: 18,
    color: "from-[#F3C998]/20 to-[#F3C998]/10",
  },
  {
    id: "3",
    name: "Audio",
    description: "Immersive sound experiences",
    count: 12,
    color: "from-[#F3C998]/20 to-[#F3C998]/10",
  },
]

export default function CategoryShowcase() {
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
          {categories.map((category) => (
            <Card
              key={category.id}
              className="overflow-hidden backdrop-blur-xl bg-white/5 border border-white/10 transition-all hover:shadow-2xl hover:border-[#F3C998]/30"
            >
              <div className={`h-32 bg-gradient-to-r ${category.color}`}></div>

              <CardContent className="p-6">
                <h3 className="font-bold text-xl mb-2 text-white">{category.name}</h3>
                <p className="text-sm text-gray-300 mb-4">{category.description}</p>
                <p className="text-sm mb-4 text-[#F3C998]">{category.count} products</p>

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

