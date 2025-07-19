"use client"

import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useGetCartQuery } from "@/store/services/cartApi"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export default function CartIcon() {
  const { data: cart } = useGetCartQuery()

  const itemCount = cart?.item_count || 0

  return (
    <Link href="/cart">
      <Button variant="ghost" size="icon" className="relative">
        <ShoppingCart className="h-6 w-6" />
        {itemCount > 0 && (
          <Badge className="absolute -top-2 -right-2 px-2 py-1 text-xs min-w-[1.5rem] flex items-center justify-center text-gray-600 dark:text-gray-200 bg-gray-300 dark:bg-gray-700">
            {itemCount}
          </Badge>
        )}
      </Button>
    </Link>
  )
}
