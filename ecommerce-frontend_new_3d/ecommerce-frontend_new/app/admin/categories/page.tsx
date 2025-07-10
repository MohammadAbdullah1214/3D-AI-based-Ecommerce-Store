"use client"

import { useState } from "react"
import { useGetCategoriesQuery, useCreateCategoryMutation } from "@/store/services/productApi"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Plus, Tag, Loader2, ArrowLeft } from "lucide-react"
import HeaderWrapper from "@/app/header-wrapper"
import Footer from "@/components/layout/footer"
import { useRouter } from "next/navigation"

export default function AdminCategoriesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parent_id: "",
    image_url: ""
  })

  const { data: categories, isLoading, error, refetch } = useGetCategoriesQuery()
  const [createCategory] = useCreateCategoryMutation()

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Category name is required.",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)
    try {
      const categoryData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        parent_id: formData.parent_id ? Number(formData.parent_id) : undefined,
        image_url: formData.image_url.trim() || undefined,
      }

      await createCategory(categoryData).unwrap()
      
      toast({
        title: "Success",
        description: "Category created successfully!",
      })
      
      // Reset form
      setFormData({
        name: "",
        description: "",
        parent_id: "",
        image_url: ""
      })
      setShowCreateForm(false)
      refetch()
    } catch (error) {
      console.error("Error creating category:", error)
      toast({
        title: "Error",
        description: "Failed to create category. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

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
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 backdrop-blur-sm mb-4"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <h1 className="text-4xl font-bold text-white mb-2">Category Management</h1>
                <p className="text-gray-300">Create and manage product categories</p>
              </div>
              <Button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-gradient-to-r from-[#F3C998] to-[#E6B87D] hover:from-[#E6B87D] hover:to-[#D4A574] text-[#1D212D] font-semibold transition-all duration-300"
              >
                <Plus className="mr-2 h-4 w-4" />
                {showCreateForm ? "Cancel" : "Add Category"}
              </Button>
            </div>

            {/* Create Category Form */}
            {showCreateForm && (
              <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-white text-2xl">Create New Category</CardTitle>
                  <CardDescription className="text-gray-300">
                    Add a new product category to the system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateCategory} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="name" className="text-white font-medium">
                          Category Name *
                        </Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          placeholder="Enter category name"
                          className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 hover:bg-white/10 focus:bg-white/10 mt-2"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="parent" className="text-white font-medium">
                          Parent Category
                        </Label>
                        <Select
                          value={formData.parent_id}
                          onValueChange={(value) => handleInputChange("parent_id", value)}
                        >
                          <SelectTrigger className="bg-white/5 border-white/20 text-white hover:bg-white/10 focus:bg-white/10 mt-2">
                            <SelectValue placeholder="Select parent category (optional)" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#2A2F3A] border-white/20">
                            <SelectItem value="" className="text-white hover:bg-white/10">
                              No Parent (Root Category)
                            </SelectItem>
                            {categories?.map((category) => (
                              <SelectItem
                                key={category.id}
                                value={category.id.toString()}
                                className="text-white hover:bg-white/10"
                              >
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description" className="text-white font-medium">
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        placeholder="Enter category description (optional)"
                        className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 hover:bg-white/10 focus:bg-white/10 mt-2"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="image_url" className="text-white font-medium">
                        Image URL
                      </Label>
                      <Input
                        id="image_url"
                        value={formData.image_url}
                        onChange={(e) => handleInputChange("image_url", e.target.value)}
                        placeholder="Enter image URL (optional)"
                        className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 hover:bg-white/10 focus:bg-white/10 mt-2"
                      />
                    </div>

                    <div className="flex gap-4">
                      <Button
                        type="submit"
                        disabled={isCreating || !formData.name.trim()}
                        className="bg-gradient-to-r from-[#F3C998] to-[#E6B87D] hover:from-[#E6B87D] hover:to-[#D4A574] text-[#1D212D] font-semibold transition-all duration-300"
                      >
                        {isCreating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Category
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCreateForm(false)}
                        className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 backdrop-blur-sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Categories List */}
            <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-white text-2xl">Existing Categories</CardTitle>
                <CardDescription className="text-gray-300">
                  {categories?.length || 0} categories in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error ? (
                  <div className="text-center py-8">
                    <p className="text-red-400 mb-4">Failed to load categories</p>
                    <Button
                      onClick={() => refetch()}
                      variant="outline"
                      className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 backdrop-blur-sm"
                    >
                      Retry
                    </Button>
                  </div>
                ) : categories && categories.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <Tag className="h-5 w-5" style={{ color: "#F3C998" }} />
                          <h3 className="text-lg font-semibold text-white">{category.name}</h3>
                        </div>
                        {category.description && (
                          <p className="text-gray-300 text-sm mb-3">{category.description}</p>
                        )}
                        <div className="text-xs text-gray-400">
                          ID: {category.id}
                          {category.parent_id && ` • Parent: ${category.parent_id}`}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Tag className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-400">No categories found</p>
                    <p className="text-gray-500 text-sm mt-2">Create your first category above</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </HeaderWrapper>
    </div>
  )
} 