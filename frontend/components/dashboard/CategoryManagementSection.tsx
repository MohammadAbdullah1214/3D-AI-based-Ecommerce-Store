"use client"

import { useState } from "react"
import { useGetCategoriesQuery, useCreateCategoryMutation, useUpdateCategoryMutation, useDeleteCategoryMutation } from "@/store/services/productApi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Plus, Edit, Trash2, FolderOpen, FolderClosed } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { Category } from "@/app/types/product"

interface CategoryFormData {
  name: string
  description: string
  parent_id?: number
  image_file?: File
}

export default function CategoryManagementSection() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    description: "",
    parent_id: undefined,
    image_file: undefined
  })

  const { data: categories, isLoading, refetch } = useGetCategoriesQuery()
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation()
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation()
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation()

  const handleCreateCategory = async () => {
    try {
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name)
      formDataToSend.append('description', formData.description)
      if (formData.parent_id) {
        formDataToSend.append('parent_id', formData.parent_id.toString())
      }
      if (formData.image_file) {
        formDataToSend.append('image', formData.image_file)
      }
      
      await createCategory(formDataToSend).unwrap()
      toast({
        title: "Success",
        description: "Category created successfully!",
      })
      setIsCreateDialogOpen(false)
      setFormData({ name: "", description: "", parent_id: undefined, image_file: undefined })
      refetch()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create category. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || "",
      parent_id: category.parent_id,
      image_file: undefined
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateCategory = async () => {
    if (!editingCategory) return

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name)
      formDataToSend.append('description', formData.description)
      if (formData.parent_id) {
        formDataToSend.append('parent_id', formData.parent_id.toString())
      }
      if (formData.image_file) {
        formDataToSend.append('image', formData.image_file)
      }
      
      await updateCategory({ id: editingCategory.id, formData: formDataToSend }).unwrap()
      toast({
        title: "Success",
        description: "Category updated successfully!",
      })
      setIsEditDialogOpen(false)
      setEditingCategory(null)
      setFormData({ name: "", description: "", parent_id: undefined, image_file: undefined })
      refetch()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update category. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCategory = async (categoryId: number) => {
    try {
      await deleteCategory(categoryId).unwrap()
      toast({
        title: "Success",
        description: "Category deleted successfully!",
      })
      refetch()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete category. Please try again.",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({ name: "", description: "", parent_id: undefined, image_file: undefined })
    setEditingCategory(null)
  }

  const getParentCategoryName = (parentId?: number) => {
    if (!parentId) return "None"
    const parent = categories?.find(cat => cat.id === parentId)
    return parent?.name || "Unknown"
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F3C998]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white">Categories</h3>
          <p className="text-gray-300 text-lg">Manage product categories</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => resetForm()}
              className="bg-[#F3C998] text-[#1D212D] hover:bg-[#F3C998]/90 transition-all duration-300"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white/10 backdrop-blur-xl border border-white/20">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Category</DialogTitle>
              <DialogDescription className="text-gray-300">
                Add a new product category to organize your products.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Category Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter category name"
                  className="bg-white/10 border border-white/20 text-white placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter category description"
                  className="bg-white/10 border border-white/20 text-white placeholder:text-gray-400"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Parent Category</label>
                <select
                  value={formData.parent_id || ""}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full bg-white/10 border border-white/20 rounded-md p-3 text-white"
                >
                  <option value="">No Parent</option>
                  {categories?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Category Image (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, image_file: e.target.files?.[0] || undefined })}
                  className="w-full bg-white/10 border border-white/20 rounded-md p-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[#F3C998] file:text-[#1D212D] hover:file:bg-[#F3C998]/90 file:cursor-pointer cursor-pointer"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                className="border-white/30 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateCategory}
                disabled={isCreating || !formData.name.trim()}
                className="bg-[#F3C998] text-[#1D212D] hover:bg-[#F3C998]/90"
              >
                {isCreating ? "Creating..." : "Create Category"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories Table */}
      <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
        <CardContent className="p-6">
          {categories && categories.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/20 hover:bg-white/5">
                    <TableHead className="text-gray-300 font-semibold">Name</TableHead>
                    <TableHead className="text-gray-300 font-semibold">Description</TableHead>
                    <TableHead className="text-gray-300 font-semibold">Parent Category</TableHead>
                    <TableHead className="text-gray-300 font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id} className="border-white/10 hover:bg-white/5">
                      <TableCell className="font-medium text-white">
                        <div className="flex items-center space-x-2">
                          {category.subcategories && category.subcategories.length > 0 ? (
                            <FolderOpen className="h-4 w-4 text-[#F3C998]" />
                          ) : (
                            <FolderClosed className="h-4 w-4 text-gray-400" />
                          )}
                          <span>{category.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300 max-w-xs truncate">
                        {category.description || "No description"}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {getParentCategoryName(category.parent_id)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditCategory(category)}
                            className="border-white/30 text-white hover:bg-white/10"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-red-500/30 text-red-300 hover:bg-red-500/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-white/10 backdrop-blur-xl border border-white/20">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-white">Delete Category</AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-300">
                                  Are you sure you want to delete "{category.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="border-white/30 text-white hover:bg-white/10">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteCategory(category.id)}
                                  className="bg-red-500 text-white hover:bg-red-600"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FolderClosed className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No categories found</h3>
              <p className="text-gray-400 mb-6">Get started by creating your first category.</p>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-[#F3C998] text-[#1D212D] hover:bg-[#F3C998]/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Category
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white/10 backdrop-blur-xl border border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Category</DialogTitle>
            <DialogDescription className="text-gray-300">
              Update the category information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Category Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter category name"
                className="bg-white/10 border border-white/20 text-white placeholder:text-gray-400"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter category description"
                className="bg-white/10 border border-white/20 text-white placeholder:text-gray-400"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Parent Category</label>
              <select
                value={formData.parent_id || ""}
                onChange={(e) => setFormData({ ...formData, parent_id: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full bg-white/10 border border-white/20 rounded-md p-3 text-white"
              >
                <option value="">No Parent</option>
                {categories?.filter(cat => cat.id !== editingCategory?.id).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Category Image (Optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({ ...formData, image_file: e.target.files?.[0] || undefined })}
                className="w-full bg-white/10 border border-white/20 rounded-md p-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[#F3C998] file:text-[#1D212D] hover:file:bg-[#F3C998]/90 file:cursor-pointer cursor-pointer"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="border-white/30 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
                          <Button
                onClick={handleUpdateCategory}
                disabled={isUpdating || !formData.name.trim()}
                className="bg-[#F3C998] text-[#1D212D] hover:bg-[#F3C998]/90"
              >
                {isUpdating ? "Updating..." : "Update Category"}
              </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 