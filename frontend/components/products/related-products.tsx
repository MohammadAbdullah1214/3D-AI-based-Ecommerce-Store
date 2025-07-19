import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// This would normally be fetched from your API
const mockRelatedProducts = [
  {
    id: "2",
    name: "Neural Headphones",
    description: "Adaptive noise cancellation with neural processing",
    price: 199.99,
    image: "/placeholder.svg?height=300&width=300",
  },
  {
    id: "4",
    name: "Holographic Display",
    description: "3D holographic projector for immersive experiences",
    price: 499.99,
    image: "/placeholder.svg?height=300&width=300",
  },
  {
    id: "8",
    name: "AI Security Camera",
    description: "Intelligent security with person recognition",
    price: 199.99,
    image: "/placeholder.svg?height=300&width=300",
  },
]

export default function RelatedProducts({ currentProductId }: { currentProductId: string }) {
  // Filter out the current product
  const relatedProducts = mockRelatedProducts.filter((product) => product.id !== currentProductId)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {relatedProducts.map((product) => (
        <Card
          key={product.id}
          className="overflow-hidden backdrop-blur-sm bg-white/10 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 transition-all hover:shadow-lg"
        >
          <div className="aspect-square relative">
            <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
          </div>

          <CardContent className="p-4">
            <h3 className="font-bold text-lg mb-2">{product.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{product.description}</p>
            <p className="font-bold text-xl">${product.price.toFixed(2)}</p>
          </CardContent>

          <CardFooter className="p-4 pt-0">
            <Link href={`/products/${product.id}`} className="w-full">
              <Button className="w-full">View Product</Button>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
