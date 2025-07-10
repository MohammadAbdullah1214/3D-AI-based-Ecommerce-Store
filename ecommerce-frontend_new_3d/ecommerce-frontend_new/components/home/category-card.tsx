import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"

interface CategoryCardProps {
  name: string
  image: string
  count: string
  href: string
}

export default function CategoryCard({ name, image, count, href }: CategoryCardProps) {
  return (
    <Link href={href}>
      <Card className="overflow-hidden backdrop-blur-xl bg-white/5 border border-white/10 hover:shadow-2xl transition-all duration-300 group h-full hover:border-[#F3C998]/30">
        <div className="aspect-square relative">
          <Image
            src={image || "/placeholder.svg"}
            alt={name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1D212D]/90 to-transparent flex items-end">
            <CardContent className="p-4 text-white">
              <h3 className="font-bold text-lg">{name}</h3>
              <p className="text-sm text-[#F3C998]">{count}</p>
            </CardContent>
          </div>
        </div>
      </Card>
    </Link>
  )
}
