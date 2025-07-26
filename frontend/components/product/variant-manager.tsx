"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Plus, Edit, Trash2, Package } from "lucide-react"
import { useGetVariantTypesQuery, useGetVariantOptionsQuery } from "@/store/services/productApi"

interface ProductVariant {
  id?: number
  sku: string
  price_adjustment: number
  stock: number
  weight?: number | null
  is_active: boolean
  options: number[]
}

interface VariantManagerProps {
  productId: number
  variants: ProductVariant[]
  onVariantsChange: (variants: ProductVariant[]) => void
  isEditing?: boolean
}

export default function VariantManager({ productId, variants, onVariantsChange, isEditing = false }: VariantManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null)
  const [formData, setFormData] = useState<Partial<ProductVariant>>({
    sku: "",
    price_adjustment: 0,
    stock: 0,
    weight: null,
    is_active: true,
    options: []
  })

  const { data: variantTypes = [] } = useGetVariantTypesQuery()
  const { data: variantOptions = [] } = useGetVariantOptionsQuery()

  const resetForm = () => {
    setFormData({
      sku: "",
      price_adjustment: 0,
      stock: 0,
      weight: null,
      is_active: true,
      options: []
    })
    setEditingVariant(null)
  }

  const handleAddVariant = () => {
    if (!formData.sku || formData.options.length === 0) {
      toast({
        title: "Validation Error",
        description: "SKU and at least one option are required.",
        variant: "destructive"
      })
      return
    }

    // Check if SKU already exists
    if (variants.some(v => v.sku === formData.sku && v.id !== editingVariant?.id)) {
      toast({
        title: "Validation Error",
        description: "SKU already exists. Please use a unique SKU.",
        variant: "destructive"
      })
      return
    }

    if (editingVariant) {
      // Update existing variant
      const updatedVariants = variants.map(v => 
        v.id === editingVariant.id 
          ? { ...v, ...formData, id: v.id }
          : v
      )
      onVariantsChange(updatedVariants)
      toast({
        title: "Variant Updated",
        description: "Product variant has been updated successfully."
      })
    } else {
      // Add new variant
      const newVariant: ProductVariant = {
        ...formData as ProductVariant,
        id: Date.now() // Temporary ID for frontend
      }
      onVariantsChange([...variants, newVariant])
      toast({
        title: "Variant Added",
        description: "New product variant has been added successfully."
      })
    }

    setIsDialogOpen(false)
    resetForm()
  }

  const handleEditVariant = (variant: ProductVariant) => {
    setEditingVariant(variant)
    setFormData({
      sku: variant.sku,
      price_adjustment: variant.price_adjustment,
      stock: variant.stock,
      weight: variant.weight,
      is_active: variant.is_active,
      options: variant.options
    })
    setIsDialogOpen(true)
  }

  const handleDeleteVariant = (variantId: number) => {
    const updatedVariants = variants.filter(v => v.id !== variantId)
    onVariantsChange(updatedVariants)
    toast({
      title: "Variant Deleted",
      description: "Product variant has been deleted successfully."
    })
  }

  const getOptionDisplayName = (optionId: number) => {
    const option = variantOptions.find(opt => opt.id === optionId)
    return option ? `${option.variant_type_name}: ${option.value}` : `Option ${optionId}`
  }

  const getVariantDisplayName = (variant: ProductVariant) => {
    const optionNames = variant.options.map(getOptionDisplayName)
    return optionNames.join(", ")
  }

  return (
    <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
      <CardHeader>
        <CardTitle className="text-white text-xl flex items-center gap-2">
          <Package className="h-5 w-5" />
          Product Variants
        </CardTitle>
        <CardDescription className="text-gray-300">
          Manage different versions of your product (e.g., sizes, colors)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-300">
            {variants.length} variant{variants.length !== 1 ? 's' : ''} configured
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  resetForm()
                  setIsDialogOpen(true)
                }}
                className="bg-[#F3C998] text-[#1D212D] hover:bg-[#F3C998]/90 transition-all duration-300"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Variant
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#2A2F3A] border-white/20 text-white">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {editingVariant ? "Edit Variant" : "Add New Variant"}
                </DialogTitle>
                <DialogDescription className="text-gray-300">
                  Configure the variant details and options
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="sku" className="text-white">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku || ""}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g., TSHIRT-RED-L"
                    className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price_adjustment" className="text-white">Price Adjustment ($)</Label>
                    <Input
                      id="price_adjustment"
                      type="number"
                      step="0.01"
                      value={formData.price_adjustment || 0}
                      onChange={(e) => setFormData({ ...formData, price_adjustment: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <Label htmlFor="stock" className="text-white">Stock</Label>
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      value={formData.stock || 0}
                      onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                      className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="weight" className="text-white">Weight (kg) - Optional</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.01"
                    value={formData.weight || ""}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="Leave empty to use product weight"
                    className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                  />
                </div>

                <div>
                  <Label className="text-white">Variant Options</Label>
                  <div className="space-y-2">
                    {variantTypes.map((type) => (
                      <div key={type.id} className="space-y-1">
                        <Label className="text-sm text-gray-300">{type.name}</Label>
                        <Select
                          onValueChange={(value) => {
                            const optionId = parseInt(value)
                            const currentOptions = formData.options || []
                            const updatedOptions = currentOptions.includes(optionId)
                              ? currentOptions.filter(id => id !== optionId)
                              : [...currentOptions, optionId]
                            setFormData({ ...formData, options: updatedOptions })
                          }}
                        >
                          <SelectTrigger className="bg-white/10 border-white/20 text-white">
                            <SelectValue placeholder={`Select ${type.name}`} />
                          </SelectTrigger>
                          <SelectContent className="bg-[#2A2F3A] border-white/20">
                            {variantOptions
                              .filter(option => option.variant_type === type.id)
                              .map(option => (
                                <SelectItem
                                  key={option.id}
                                  value={option.id.toString()}
                                  className="text-white hover:bg-white/10"
                                >
                                  {option.value}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                  
                  {formData.options && formData.options.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {formData.options.map(optionId => (
                        <Badge
                          key={optionId}
                          variant="secondary"
                          className="bg-[#F3C998]/20 text-[#F3C998] border-[#F3C998]/30"
                        >
                          {getOptionDisplayName(optionId)}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false)
                    resetForm()
                  }}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddVariant}
                  className="bg-[#F3C998] text-[#1D212D] hover:bg-[#F3C998]/90"
                >
                  {editingVariant ? "Update Variant" : "Add Variant"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {variants.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="border-white/20 hover:bg-white/5">
                <TableHead className="text-gray-300 font-semibold">SKU</TableHead>
                <TableHead className="text-gray-300 font-semibold">Options</TableHead>
                <TableHead className="text-gray-300 font-semibold text-right">Price Adj.</TableHead>
                <TableHead className="text-gray-300 font-semibold text-right">Stock</TableHead>
                <TableHead className="text-gray-300 font-semibold text-center">Status</TableHead>
                <TableHead className="text-gray-300 font-semibold text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.map((variant) => (
                <TableRow key={variant.id} className="border-white/10 hover:bg-white/5">
                  <TableCell className="font-medium text-white">{variant.sku}</TableCell>
                  <TableCell className="text-white">
                    <div className="flex flex-wrap gap-1">
                      {variant.options.map(optionId => (
                        <Badge
                          key={optionId}
                          variant="outline"
                          className="text-xs border-white/20 text-white"
                        >
                          {getOptionDisplayName(optionId)}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-white">
                    ${variant.price_adjustment >= 0 ? '+' : ''}{variant.price_adjustment.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right text-white">{variant.stock}</TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={variant.is_active ? "default" : "secondary"}
                      className={variant.is_active 
                        ? "bg-green-500/20 text-green-300 border-green-500/30" 
                        : "bg-gray-500/20 text-gray-300 border-gray-500/30"
                      }
                    >
                      {variant.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditVariant(variant)}
                        className="border-white/30 text-white hover:bg-white/10 hover:border-white/50"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteVariant(variant.id!)}
                        className="border-red-500/30 text-red-300 hover:bg-red-500/10 hover:border-red-500/50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No variants configured yet</p>
            <p className="text-gray-500 text-sm">Add variants to offer different options for your product</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 