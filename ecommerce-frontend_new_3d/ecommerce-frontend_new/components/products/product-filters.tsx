"use client"
import { useState, useCallback, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { useGetCategoriesQuery } from "@/store/services/productApi"
import type { ProductFilters } from "../../app/types/product"

export default function ProductFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useGetCategoriesQuery()

  // Add console log to debug categories
  console.log("Categories data:", { categories, categoriesLoading, categoriesError })

  const [filters, setFilters] = useState<ProductFilters>({
    category: searchParams?.get("category") || undefined,
    min_price: searchParams?.get("min_price") ? Number(searchParams.get("min_price")) : 0,
    max_price: searchParams?.get("max_price") ? Number(searchParams.get("max_price")) : 1000,
    search: searchParams?.get("search") || undefined,
  })

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams()

    if (filters.category) params.set("category", filters.category.toString())
    if (filters.min_price !== undefined) params.set("min_price", filters.min_price.toString())
    if (filters.max_price !== undefined) params.set("max_price", filters.max_price.toString())
    if (filters.search) params.set("search", filters.search)

    router.push(`/products?${params.toString()}`)
  }, [filters, router])

  const resetFilters = () => {
    setFilters({
      category: undefined,
      min_price: 0,
      max_price: 1000,
      search: undefined,
    })
    router.push("/products")
  }

  // Update filters when URL params change
  useEffect(() => {
    setFilters({
      category: searchParams?.get("category") || undefined,
      min_price: searchParams?.get("min_price") ? Number(searchParams.get("min_price")) : 0,
      max_price: searchParams?.get("max_price") ? Number(searchParams.get("max_price")) : 1000,
      search: searchParams?.get("search") || undefined,
    })
  }, [searchParams])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Filters</h3>
        <Separator className="mb-4" />
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Search products..."
            value={filters.search || ""}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="mt-1"
          />
        </div>

        <div>
          <Label>Category</Label>
          <RadioGroup
            value={filters.category?.toString() || ""}
            onValueChange={(value) => setFilters({ ...filters, category: value ? value : undefined })}
            className="mt-2 space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="" id="all" />
              <Label htmlFor="all" className="cursor-pointer">
                All Categories
              </Label>
            </div>

            {categoriesLoading ? (
              <div className="text-sm text-gray-500 dark:text-gray-200">Loading categories...</div>
            ) : categoriesError ? (
              <div className="text-sm text-red-500 dark:text-red-200">Error loading categories</div>
            ) : categories && categories.length > 0 ? (
              categories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={category.id.toString()} id={`category-${category.id}`} />
                  <Label htmlFor={`category-${category.id}`} className="cursor-pointer">
                    {category.name}
                  </Label>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-200">No categories available</div>
            )}
          </RadioGroup>
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <Label>Price Range</Label>
            <span className="text-sm text-gray-500 dark:text-gray-200">
              ${filters.min_price} - ${filters.max_price}
            </span>
          </div>
          <div className="px-2">
            <Slider
              defaultValue={[filters.min_price || 0, filters.max_price || 1000]}
              max={1000}
              step={10}
              onValueChange={(values) => {
                setFilters({
                  ...filters,
                  min_price: values[0],
                  max_price: values[1],
                })
              }}
              className="mt-2"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col space-y-2 pt-4">
        <Button onClick={applyFilters}>Apply Filters</Button>
        <Button variant="outline" onClick={resetFilters}>
          Reset Filters
        </Button>
      </div>
    </div>
  )
}
