"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  useGetProductQuery,
  useGetCategoriesQuery,
  useUpdateProductMutation,
  useUploadProductFilesMutation,
  useGenerate3dModelMutation,
  useCancelGenerationMutation,
  useGetGenerationStatusQuery,
} from "@/store/services/productApi"
import { useGetProductMediaQuery } from "@/store/services/mediaApi"
import { useGetProductReviewsQuery } from "@/store/services/reviewApi"
import { MediaUpload } from "@/components/product/media-upload"
import { ThreeDGenerationPanel } from "@/components/product/3d-generation-panel"
import HeaderWrapper from "@/app/header-wrapper"
import Footer from "@/components/layout/footer"
import { ArrowLeft, Loader2, CuboidIcon, Play, Star } from "lucide-react"
import Link from "next/link"
import { getProductStock } from "@/utils/product-utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductGallery } from "@/components/product/product-gallery"
import Simple3DViewer from "@/components/product/simple-3d-viewer"
import { motion } from "framer-motion"

// Define the form schema with Zod
const formSchema = z
  .object({
    name: z.string().min(3, { message: "Product name must be at least 3 characters" }),
    description: z.string().min(10, { message: "Description must be at least 10 characters" }),
    price: z.coerce.number().positive({ message: "Price must be a positive number" }),
    discount_price: z.coerce.number().nonnegative().optional().nullable(),
    stock: z.coerce.number().int().nonnegative({ message: "Stock must be a non-negative integer" }),
    category: z.string().min(1, { message: "Please select a category" }),
    status: z.enum(["draft", "active", "inactive"]).default("draft"),
    is_active: z.boolean().default(true),
    weight: z.coerce.number().nonnegative().optional().nullable(),
    length: z.coerce.number().nonnegative().optional().nullable(),
    width: z.coerce.number().nonnegative().optional().nullable(),
    height: z.coerce.number().nonnegative().optional().nullable(),
    mediaFiles: z
      .array(
        z.object({
          file: z.instanceof(File),
          fileType: z.enum(["image", "video", "model_3d"]),
        }),
      )
      .optional()
      .default([]),
  })
  .superRefine((data, ctx) => {
    if (data.discount_price !== null && data.discount_price !== undefined && data.discount_price >= data.price) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Discount price must be less than price",
        path: ["discount_price"],
      })
    }
  })

type FormValues = z.infer<typeof formSchema>

export default function EditProductPage() {
  const params = useParams()
  const productId = typeof params?.id === "string" ? Number.parseInt(params.id) : 0
  const router = useRouter()

  // State
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPollingStatus, setIsPollingStatus] = useState(false)

  // API Hooks
  const {
    data: product,
    isLoading: isLoadingProduct,
    error: productError,
    refetch: refetchProduct,
  } = useGetProductQuery(productId, {
    skip: !productId,
    refetchOnMountOrArgChange: true,
  })

  const { data: categories, isLoading: categoriesLoading } = useGetCategoriesQuery()
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation()
  const [uploadProductFiles, { isLoading: isUploading }] = useUploadProductFilesMutation()
  const { data: productMedia = [], isLoading: isLoadingMedia } = useGetProductMediaQuery(productId, {
    skip: !productId,
  })

  // Reviews
  const { data: reviews = [] } = useGetProductReviewsQuery(productId, {
    skip: !productId,
  })

  // 3D Model Hooks
  const { data: generationStatus } = useGetGenerationStatusQuery(productId, {
    pollingInterval: isPollingStatus ? 10000 : 0, // Poll only when a job is active
    skip: !productId,
  })
  const [generate3dModel, { isLoading: isGenerating }] = useGenerate3dModelMutation()
  const [cancelGeneration, { isLoading: isCancelling }] = useCancelGenerationMutation()

  // Form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      discount_price: null,
      stock: 0,
      category: "",
      status: "draft",
      is_active: true,
      weight: null,
      length: null,
      width: null,
      height: null,
      mediaFiles: [],
    },
  })

  // Effect to reset form when product data loads
  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        description: product.description || "",
        price: typeof product.price === "number" ? product.price : Number(product.price),
        discount_price: product.discount_price ? Number(product.discount_price) : null,
        stock: getProductStock(product),
        category: String(product.category_id ?? product.category?.id ?? ""),
        status: product.status || "draft",
        is_active: typeof product.is_active === "boolean" ? product.is_active : true,
        weight: product.weight ?? null,
        length: product.length ?? null,
        width: product.width ?? null,
        height: product.height ?? null,
        mediaFiles: [],
      })
    }
  }, [product, form])

  // Effect to control polling based on generation status
  useEffect(() => {
    if (generationStatus) {
      const isActive = generationStatus.status === "pending" || generationStatus.status === "processing"
      const isFinished =
        generationStatus.status === "completed" ||
        generationStatus.status === "failed" ||
        generationStatus.status === "cancelled"

      if (isFinished) {
        // Stop polling when the job is done
        setIsPollingStatus(false)
        // Refetch product data only on success to get the updated `has_3d_model` flag
        if (generationStatus.status === "completed") {
          refetchProduct()
        }
      } else if (isActive !== isPollingStatus) {
        // Start polling if the job is active
        setIsPollingStatus(isActive)
      }
    }
  }, [generationStatus, isPollingStatus, refetchProduct])

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true)
    try {
      // Step 1: Update product's text/numeric data
      const { mediaFiles, category, ...productDataRest } = values
      console.log("Form submission - mediaFiles:", mediaFiles)
      console.log("Form submission - productData:", productDataRest)

      await updateProduct({
        id: productId,
        ...productDataRest,
        category_id: Number(category), // Use category_id for backend
      }).unwrap()

      toast({ title: "Product details saved." })

      // Step 2: Upload new media files if any
      if (mediaFiles && mediaFiles.length > 0) {
        console.log("Uploading media files:", mediaFiles)
        toast({ title: "Uploading new media...", description: `Uploading ${mediaFiles.length} file(s).` })

        const formData = new FormData()

        // Group files by type and append them with the correct field names
        const images = mediaFiles.filter((item) => item.fileType === "image")
        const videos = mediaFiles.filter((item) => item.fileType === "video")
        const models = mediaFiles.filter((item) => item.fileType === "model_3d")

        console.log("Grouped files - images:", images.length, "videos:", videos.length, "models:", models.length)

        // Append all files to the 'images' field, as required by backend
        images.forEach((item) => {
          formData.append("images", item.file)
        })
        videos.forEach((item) => {
          formData.append("images", item.file)
        })
        models.forEach((item) => {
          formData.append("images", item.file)
        })

        await uploadProductFiles({ productId, data: formData }).unwrap()
        toast({ title: "New media uploaded successfully." })

        // Clear the media files from the form after successful upload
        form.setValue("mediaFiles", [])
        // Clear the MediaUpload component's state
        if ((window as any).clearMediaUploadFiles) {
          ;(window as any).clearMediaUploadFiles()
        }
      } else {
        console.log("No media files to upload")
      }

      toast({
        title: "Product Updated",
        description: "Your product has been successfully updated.",
      })
      router.push("/dashboard?tab=products")
    } catch (error) {
      console.error("Error updating product:", error)
      toast({
        title: "Update Failed",
        description: "There was an error updating your product. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle 3D model generation start
  const handleGenerationStart = useCallback(
    async (detailLevel: string, angleMapping: Record<string, number>, clothingType: string) => {
      try {
        await generate3dModel({
          productId,
          detailLevel: detailLevel as "low" | "medium" | "high",
          angleMapping,
          clothingType,
        }).unwrap()
        toast({
          title: "3D Model Generation Started",
          description: "Your model is being created. You can monitor the progress here.",
        })
      } catch (error: any) {
        console.error("Error starting generation:", error)
        const errorMessage =
          error.data?.detail || "Could not start the 3D model generation process. Please check the console."
        toast({
          title: "Generation Failed to Start",
          description: errorMessage,
          variant: "destructive",
        })
      }
    },
    [productId, generate3dModel],
  )

  // Handle 3D model generation cancellation
  const handleCancelGeneration = useCallback(async () => {
    try {
      await cancelGeneration({ productId }).unwrap()
      toast({
        title: "Generation Cancelled",
        description: "The 3D model generation process has been cancelled.",
      })
    } catch (error) {
      toast({
        title: "Cancellation Failed",
        description: "Could not cancel the generation process.",
        variant: "destructive",
      })
    }
  }, [productId, cancelGeneration])

  // Separate media by type for preview
  const previewImages = (productMedia || []).filter((item) => item.file_type === "image")
  const previewModels = (productMedia || []).filter(
    (item) => item.file_type === "model" || item.file_type === "model_3d",
  )
  const previewVideos = (productMedia || []).filter((item) => item.file_type === "video")

  if (isLoadingProduct || categoriesLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#1D212D] via-[#2A2F3A] to-[#1D212D]">
        <div className="relative w-24 h-24">
          <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-t-[#F3C998] border-r-transparent border-b-[#F3C998]/50 border-l-transparent animate-spin"></div>
          <div className="absolute top-2 left-2 w-20 h-20 rounded-full border-4 border-t-transparent border-r-[#F3C998]/70 border-b-transparent border-l-[#F3C998] animate-spin"></div>
        </div>
      </div>
    )
  }

  if (productError || !product) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-[#1D212D] via-[#2A2F3A] to-[#1D212D] relative">
        <div className="fixed inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, #F3C998 0%, transparent 50%), 
                             radial-gradient(circle at 75% 75%, #F3C998 0%, transparent 50%)`,
            }}
          ></div>
        </div>

        <HeaderWrapper>
          <div className="relative z-10 min-h-screen w-full p-4 md:p-8 flex items-center justify-center">
            <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl max-w-3xl">
              <CardHeader>
                <CardTitle className="text-red-400">Error Loading Product</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 mb-4">The product could not be loaded. Please try again later.</p>
                <Button
                  asChild
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 backdrop-blur-sm bg-transparent"
                >
                  <Link href="/dashboard?tab=products">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Products
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </HeaderWrapper>
      </div>
    )
  }

  const overallLoading = isSubmitting || isUpdating || isUploading || isLoadingMedia

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
          <div className="max-w-7xl mx-auto space-y-8">

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="max-w-5xl mx-auto">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="flex justify-between items-center mb-6"
                  >
                    <Button
                      asChild
                      variant="outline"
                      className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 backdrop-blur-sm bg-transparent"
                    >
                      <Link href="/dashboard?tab=products">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Products
                      </Link>
                    </Button>
                    <h1 className="text-2xl font-bold text-white">Edit Product</h1>
                    <Button
                      type="submit"
                      disabled={overallLoading}
                      className="bg-gradient-to-r from-[#F3C998] to-[#E6B87D] hover:from-[#E6B87D] hover:to-[#D4A574] text-[#1D212D] font-semibold transition-all duration-300"
                    >
                      {overallLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Save Changes
                    </Button>
                  </motion.div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      className="lg:col-span-2 space-y-6"
                    >
                      <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                        <CardHeader>
                          <CardTitle className="text-white text-xl">Product Details</CardTitle>
                          <CardDescription className="text-gray-300">
                            Update the name, description, and other core details.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-white">Product Name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g., 'Wooden Chair'"
                                    {...field}
                                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 hover:bg-white/10 focus:bg-white/10"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-white">Description</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Describe your product in detail..."
                                    rows={6}
                                    {...field}
                                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 hover:bg-white/10 focus:bg-white/10"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>

                      <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                        <CardHeader>
                          <CardTitle className="text-white text-xl">Media Management</CardTitle>
                          <CardDescription className="text-gray-300">
                            Upload images, videos, or 3D models for your product.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Tabs defaultValue="media" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 bg-white/5">
                              <TabsTrigger
                                value="media"
                                className="text-white data-[state=active]:bg-[#F3C998] data-[state=active]:text-[#1D212D]"
                              >
                                Media
                              </TabsTrigger>
                              <TabsTrigger
                                value="3d-model"
                                className="text-white data-[state=active]:bg-[#F3C998] data-[state=active]:text-[#1D212D]"
                              >
                                3D Model
                              </TabsTrigger>
                            </TabsList>
                            <TabsContent value="media">
                              <MediaUpload
                                productId={productId}
                                onFilesChange={(files) => {
                                  const getFileType = (mimeType: string): "image" | "video" | "model_3d" => {
                                    if (mimeType.startsWith("image/")) return "image"
                                    if (mimeType.startsWith("video/")) return "video"
                                    return "model_3d" // Fallback for .glb, .gltf
                                  }
                                  const formattedFiles = files.map((file) => ({
                                    file: file,
                                    fileType: getFileType(file.type),
                                  }))
                                  form.setValue("mediaFiles", formattedFiles)
                                }}
                                existingMedia={productMedia}
                                isUploading={isUploading}
                              />
                            </TabsContent>
                            <TabsContent value="3d-model">
                              <ThreeDGenerationPanel
                                productId={productId}
                                productMedia={productMedia}
                                has3dModel={product?.has_3d_model || false}
                                generationStatus={generationStatus}
                                isGenerating={isGenerating}
                                isCancelling={isCancelling}
                                onGenerationStart={handleGenerationStart}
                                onCancel={handleCancelGeneration}
                              />
                            </TabsContent>
                          </Tabs>
                        </CardContent>
                      </Card>

                      {/* Customer Reviews */}
                      <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                        <CardHeader>
                          <CardTitle className="text-white text-xl">Customer Reviews</CardTitle>
                          <CardDescription className="text-gray-300">
                            See what customers are saying about your product
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {reviews.length > 0 ? (
                            <div className="space-y-4">
                              {reviews.map((review) => (
                                <div key={review.id} className="border-b border-white/10 pb-4 last:border-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="flex items-center">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                          key={star}
                                          className={`h-4 w-4 ${
                                            star <= (review.rating || 0)
                                              ? "text-yellow-400 fill-yellow-400"
                                              : "text-gray-500"
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    <span className="font-medium text-white">{review.user_username || "User"}</span>
                                    <span className="text-xs text-gray-500">
                                      {new Date(review.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div className="text-gray-300 text-sm">{review.comment}</div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <p className="text-gray-400 text-lg">No reviews yet for this product.</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>

                    {/* Right Column */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                      className="space-y-6"
                    >
                      <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                        <CardHeader>
                          <CardTitle className="text-white text-xl">Pricing & Inventory</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-white">Price ($)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="e.g., 99.99"
                                    {...field}
                                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 hover:bg-white/10 focus:bg-white/10"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="discount_price"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-white">Discount Price ($) (Optional)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="e.g., 79.99"
                                    {...field}
                                    value={field.value ?? ""}
                                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 hover:bg-white/10 focus:bg-white/10"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="stock"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-white">Stock Quantity</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="e.g., 100"
                                    {...field}
                                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 hover:bg-white/10 focus:bg-white/10"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>

                      <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                        <CardHeader>
                          <CardTitle className="text-white text-xl">Category</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-white">Product Category</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="bg-white/5 border-white/20 text-white hover:bg-white/10 focus:bg-white/10">
                                      <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="bg-[#2A2F3A] border-white/20">
                                    {categories?.map((cat) => (
                                      <SelectItem
                                        key={cat.id}
                                        value={String(cat.id)}
                                        className="text-white hover:bg-white/10"
                                      >
                                        {cat.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>

                      {/* Additional Info */}
                      <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                        <CardHeader>
                          <CardTitle className="text-white text-xl">Additional Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-white">Status</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="bg-white/5 border-white/20 text-white hover:bg-white/10 focus:bg-white/10">
                                      <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="bg-[#2A2F3A] border-white/20">
                                    <SelectItem value="draft" className="text-white hover:bg-white/10">
                                      Draft
                                    </SelectItem>
                                    <SelectItem value="active" className="text-white hover:bg-white/10">
                                      Active
                                    </SelectItem>
                                    <SelectItem value="inactive" className="text-white hover:bg-white/10">
                                      Inactive
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="is_active"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/20 p-3 shadow-sm bg-white/5">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-white">Is Active</FormLabel>
                                </div>
                                <FormControl>
                                  <input
                                    type="checkbox"
                                    checked={field.value}
                                    onChange={(e) => field.onChange(e.target.checked)}
                                    className="form-checkbox h-5 w-5 text-[#F3C998] bg-white/5 border-white/20 rounded focus:ring-[#F3C998]"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="weight"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-white">Weight (kg)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      placeholder="e.g., 1.5"
                                      {...field}
                                      value={field.value ?? ""}
                                      className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 hover:bg-white/10 focus:bg-white/10"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="length"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-white">Length (cm)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      placeholder="e.g., 30"
                                      {...field}
                                      value={field.value ?? ""}
                                      className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 hover:bg-white/10 focus:bg-white/10"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="width"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-white">Width (cm)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      placeholder="e.g., 20"
                                      {...field}
                                      value={field.value ?? ""}
                                      className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 hover:bg-white/10 focus:bg-white/10"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="height"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-white">Height (cm)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      placeholder="e.g., 10"
                                      {...field}
                                      value={field.value ?? ""}
                                      className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 hover:bg-white/10 focus:bg-white/10"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="flex justify-end mt-8"
                  >
                    <Button
                      type="submit"
                      disabled={overallLoading}
                      size="lg"
                      className="bg-gradient-to-r from-[#F3C998] to-[#E6B87D] hover:from-[#E6B87D] hover:to-[#D4A574] text-[#1D212D] font-semibold transition-all duration-300"
                    >
                      {overallLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Save All Changes
                    </Button>
                  </motion.div>
                </div>
              </form>
            </Form>
          </div>
        </div>
        <Footer />
      </HeaderWrapper>
    </div>
  )
}
