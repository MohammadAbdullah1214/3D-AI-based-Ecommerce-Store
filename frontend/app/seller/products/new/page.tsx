"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useGetCategoriesQuery, useCreateProductMutation } from "@/store/services/productApi"
import HeaderWrapper from "@/app/header-wrapper"
import Footer from "@/components/layout/footer"
import {
  ArrowLeft,
  Loader2,
  Upload,
  ImageIcon,
  Video,
  CuboidIcon,
  Info,
  CheckCircle,
  AlertCircle,
  Camera,
  FileImage,
  FileVideo,
  File,
  Play,
} from "lucide-react"
import Link from "next/link"
import { ProductGallery } from "@/components/product/product-gallery"
import Simple3DViewer from "@/components/product/simple-3d-viewer"
import { motion } from "framer-motion"

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

export default function NewProductPage() {
  const router = useRouter()
  const [selectedFiles, setSelectedFiles] = useState<{
    images: File[]
    videos: File[]
    models: File[]
  }>({
    images: [],
    videos: [],
    models: [],
  })

  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const modelInputRef = useRef<HTMLInputElement>(null)

  const { data: categories, isLoading: categoriesLoading } = useGetCategoriesQuery()
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation()

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
    },
  })

  const handleFileSelect = (type: "images" | "videos" | "models", files: FileList | null) => {
    console.log(`handleFileSelect called for type: ${type}`, files)
    if (!files) {
      console.log("No files selected")
      return
    }

    const fileArray = Array.from(files)
    console.log(
      `Selected ${fileArray.length} files for ${type}:`,
      fileArray.map((f) => f.name),
    )

    setSelectedFiles((prev) => {
      const updated = {
        ...prev,
        [type]: [...prev[type], ...fileArray],
      }
      console.log("Updated selectedFiles:", updated)
      return updated
    })
  }

  const removeFile = (type: "images" | "videos" | "models", index: number) => {
    console.log(`Removing file at index ${index} from ${type}`)
    setSelectedFiles((prev) => {
      const updated = {
        ...prev,
        [type]: prev[type].filter((_, i) => i !== index),
      }
      console.log("Updated selectedFiles after removal:", updated)
      return updated
    })
  }

  const onSubmit = async (values: FormValues) => {
    try {
      if (selectedFiles.images.length === 0 && selectedFiles.videos.length === 0 && selectedFiles.models.length === 0) {
        toast({
          title: "No Media Selected",
          description: "Please select at least one image, video, or 3D model for your product.",
          variant: "destructive",
        })
        return
      }

      console.log("Form submission started with values:", values)
      console.log("Selected files:", selectedFiles)

      const formData = new FormData()
      formData.append("name", values.name)
      formData.append("description", values.description)
      formData.append("price", String(values.price))
      formData.append("stock", String(values.stock))
      formData.append("category", values.category)
      if (values.discount_price) {
        formData.append("discount_price", String(values.discount_price))
      }
      // Add status and is_active to FormData
      formData.append("status", values.status)
      formData.append("is_active", String(values.is_active))

      // Append all files to the 'images' field, as required by backend
      selectedFiles.images.forEach((file) => {
        formData.append("images", file)
      })
      selectedFiles.videos.forEach((file) => {
        formData.append("images", file)
      })
      selectedFiles.models.forEach((file) => {
        formData.append("images", file)
      })

      console.log("FormData entries:")
      Array.from(formData.entries()).forEach(([key, value]) => {
        console.log(key, value)
      })

      const newProduct = await createProduct(formData).unwrap()
      toast({
        title: "Product Created!",
        description: `"${newProduct.name}" has been created successfully with ${selectedFiles.images.length + selectedFiles.videos.length + selectedFiles.models.length} media files.`,
      })
      router.push("/dashboard?tab=products")
    } catch (error) {
      console.error("Error creating product:", error)
      toast({
        title: "Creation Failed",
        description: "There was an error creating your product. Please check your input and try again.",
        variant: "destructive",
      })
    }
  }

  if (categoriesLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#1D212D] via-[#2A2F3A] to-[#1D212D]">
        <div className="relative w-24 h-24">
          <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-t-[#F3C998] border-r-transparent border-b-[#F3C998]/50 border-l-transparent animate-spin"></div>
          <div className="absolute top-2 left-2 w-20 h-20 rounded-full border-4 border-t-transparent border-r-[#F3C998]/70 border-b-transparent border-l-[#F3C998] animate-spin"></div>
        </div>
      </div>
    )
  }

  const overallLoading = isCreating

  // Separate selected files by type for preview
  // const previewImages = selectedFiles.images.map((file, idx) => ({
  //   id: `image-${idx}`,
  //   url: URL.createObjectURL(file),
  //   file_type: "image",
  // }))
  // const previewVideos = selectedFiles.videos.map((file, idx) => ({
  //   id: `video-${idx}`,
  //   url: URL.createObjectURL(file),
  //   file_type: "video",
  // }))
  // const previewModels = selectedFiles.models.map((file, idx) => ({
  //   id: `model-${idx}`,
  //   url: URL.createObjectURL(file),
  //   file_type: "model",
  // }))

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
                <div className="max-w-6xl mx-auto">
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
                    <h1 className="text-2xl font-bold text-white">Create New Product</h1>
                    <Button
                      type="submit"
                      disabled={overallLoading}
                      className="bg-gradient-to-r from-[#F3C998] to-[#E6B87D] hover:from-[#E6B87D] hover:to-[#D4A574] text-[#1D212D] font-semibold transition-all duration-300"
                    >
                      {overallLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Create Product
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
                            Start with the name, description, and other core details.
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

                      {/* Enhanced Media Management */}
                      <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-white text-xl">
                            <Upload className="h-5 w-5" />
                            Media Upload
                          </CardTitle>
                          <CardDescription className="text-gray-300">
                            Upload images, videos, and 3D models for your product. You can also generate 3D models from
                            images later.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Tabs defaultValue="images" className="w-full">
                            <TabsList className="grid w-full grid-cols-3 bg-white/5">
                              <TabsTrigger
                                value="images"
                                className="flex items-center gap-2 text-white data-[state=active]:bg-[#F3C998] data-[state=active]:text-[#1D212D]"
                              >
                                <ImageIcon className="h-4 w-4" />
                                Images ({selectedFiles.images.length})
                              </TabsTrigger>
                              <TabsTrigger
                                value="videos"
                                className="flex items-center gap-2 text-white data-[state=active]:bg-[#F3C998] data-[state=active]:text-[#1D212D]"
                              >
                                <Video className="h-4 w-4" />
                                Videos ({selectedFiles.videos.length})
                              </TabsTrigger>
                              <TabsTrigger
                                value="models"
                                className="flex items-center gap-2 text-white data-[state=active]:bg-[#F3C998] data-[state=active]:text-[#1D212D]"
                              >
                                <CuboidIcon className="h-4 w-4" />
                                3D Models ({selectedFiles.models.length})
                              </TabsTrigger>
                            </TabsList>
                            <TabsContent value="images" className="space-y-4">
                              <div className="border-2 border-dashed border-white/30 rounded-lg p-6 text-center bg-white/5">
                                <FileImage className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                <p className="text-sm text-gray-300 mb-4">
                                  Upload product images (JPG, PNG, WebP). First image will be the main product image.
                                </p>
                                <input
                                  type="file"
                                  multiple
                                  accept="image/*"
                                  onChange={(e) => handleFileSelect("images", e.target.files)}
                                  className="hidden"
                                  id="image-upload"
                                  ref={imageInputRef}
                                />
                                <Button
                                  variant="outline"
                                  className="cursor-pointer border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 backdrop-blur-sm bg-transparent"
                                  type="button"
                                  onClick={() => imageInputRef.current?.click()}
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  Select Images
                                </Button>
                              </div>
                              {selectedFiles.images.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                  {selectedFiles.images.map((file, index) => (
                                    <div key={index} className="relative group">
                                      <img
                                        src={URL.createObjectURL(file) || "/placeholder.svg"}
                                        alt={`Preview ${index + 1}`}
                                        className="w-full h-32 object-cover rounded-lg border border-white/20"
                                      />
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="destructive"
                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/80 hover:bg-red-500"
                                        onClick={() => removeFile("images", index)}
                                      >
                                        ×
                                      </Button>
                                      {index === 0 && (
                                        <Badge className="absolute top-2 left-2 bg-[#F3C998] text-[#1D212D]">
                                          Main
                                        </Badge>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </TabsContent>
                            <TabsContent value="videos" className="space-y-4">
                              <div className="border-2 border-dashed border-white/30 rounded-lg p-6 text-center bg-white/5">
                                <FileVideo className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                <p className="text-sm text-gray-300 mb-4">
                                  Upload product videos (MP4, WebM, MOV). Keep files under 50MB for best performance.
                                </p>
                                <input
                                  type="file"
                                  multiple
                                  accept="video/*"
                                  onChange={(e) => handleFileSelect("videos", e.target.files)}
                                  className="hidden"
                                  id="video-upload"
                                  ref={videoInputRef}
                                />
                                <Button
                                  variant="outline"
                                  className="cursor-pointer border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 backdrop-blur-sm bg-transparent"
                                  type="button"
                                  onClick={() => videoInputRef.current?.click()}
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  Select Videos
                                </Button>
                              </div>
                              {selectedFiles.videos.length > 0 && (
                                <div className="space-y-4">
                                  {selectedFiles.videos.map((file, index) => (
                                    <div
                                      key={index}
                                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/20"
                                    >
                                      <div className="flex items-center gap-3">
                                        <FileVideo className="h-8 w-8 text-blue-400" />
                                        <div>
                                          <p className="font-medium text-white">{file.name}</p>
                                          <p className="text-sm text-gray-300">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                          </p>
                                        </div>
                                      </div>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => removeFile("videos", index)}
                                        className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300"
                                      >
                                        Remove
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </TabsContent>
                            <TabsContent value="models" className="space-y-4">
                              <div className="border-2 border-dashed border-white/30 rounded-lg p-6 text-center bg-white/5">
                                <File className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                <p className="text-sm text-gray-300 mb-4">
                                  Upload 3D models (GLB, GLTF, OBJ). Or generate one from images using AI.
                                </p>
                                <div className="flex gap-2 justify-center">
                                  <input
                                    type="file"
                                    multiple
                                    accept=".glb,.gltf,.obj,.fbx,.3ds"
                                    onChange={(e) => handleFileSelect("models", e.target.files)}
                                    className="hidden"
                                    id="model-upload"
                                    ref={modelInputRef}
                                  />
                                  <Button
                                    variant="outline"
                                    className="cursor-pointer border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 backdrop-blur-sm bg-transparent"
                                    type="button"
                                    onClick={() => modelInputRef.current?.click()}
                                  >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload 3D Model
                                  </Button>
                                </div>
                              </div>
                              {selectedFiles.models.length > 0 && (
                                <div className="space-y-4">
                                  {selectedFiles.models.map((file, index) => (
                                    <div
                                      key={index}
                                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/20"
                                    >
                                      <div className="flex items-center gap-3">
                                        <File className="h-8 w-8 text-purple-400" />
                                        <div>
                                          <p className="font-medium text-white">{file.name}</p>
                                          <p className="text-sm text-gray-300">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                          </p>
                                        </div>
                                      </div>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => removeFile("models", index)}
                                        className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300"
                                      >
                                        Remove
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </TabsContent>
                          </Tabs>
                        </CardContent>
                      </Card>

                      {/* 3D Model Generation Instructions */}
                      <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-white text-xl">
                            <CuboidIcon className="h-5 w-5" />
                            Generate 3D Models from Images
                          </CardTitle>
                          <CardDescription className="text-gray-300">
                            Create stunning 3D models from your product images using AI technology.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <Alert className="bg-blue-500/10 border-blue-500/30">
                            <Info className="h-4 w-4 text-blue-400" />
                            <AlertTitle className="text-blue-300">How to Generate 3D Models</AlertTitle>
                            <AlertDescription className="text-blue-200">
                              After creating your product, you can generate 3D models from 2D images. Here's what you
                              need:
                            </AlertDescription>
                          </Alert>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <h4 className="font-semibold flex items-center gap-2 text-white">
                                <CheckCircle className="h-4 w-4 text-green-400" />
                                Required Images
                              </h4>
                              <ul className="space-y-2 text-sm text-gray-300">
                                <li>
                                  • <strong className="text-white">6 angle photos</strong> of your product
                                </li>
                                <li>
                                  • <strong className="text-white">Front view</strong> - straight on
                                </li>
                                <li>
                                  • <strong className="text-white">Back view</strong> - opposite side
                                </li>
                                <li>
                                  • <strong className="text-white">Left side</strong> - 90° from front
                                </li>
                                <li>
                                  • <strong className="text-white">Right side</strong> - 90° from front
                                </li>
                                <li>
                                  • <strong className="text-white">Top view</strong> - looking down
                                </li>
                                <li>
                                  • <strong className="text-white">Bottom view</strong> - looking up
                                </li>
                              </ul>
                            </div>
                            <div className="space-y-3">
                              <h4 className="font-semibold flex items-center gap-2 text-white">
                                <AlertCircle className="h-4 w-4 text-orange-400" />
                                Best Practices
                              </h4>
                              <ul className="space-y-2 text-sm text-gray-300">
                                <li>
                                  • Use <strong className="text-white">high-quality images</strong> (min 1024x1024px)
                                </li>
                                <li>
                                  • Ensure <strong className="text-white">good lighting</strong> and no shadows
                                </li>
                                <li>
                                  • Use <strong className="text-white">plain background</strong> (white/gray)
                                </li>
                                <li>
                                  • Keep <strong className="text-white">consistent camera distance</strong>
                                </li>
                                <li>
                                  • Avoid <strong className="text-white">reflections and glare</strong>
                                </li>
                                <li>
                                  • Product should be <strong className="text-white">centered</strong> in each image
                                </li>
                              </ul>
                            </div>
                          </div>
                          <Separator className="bg-white/20" />
                          <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
                            <h4 className="font-semibold text-blue-300 mb-2">
                              <Camera className="h-4 w-4 inline mr-2" />
                              Photography Tips
                            </h4>
                            <div className="text-sm text-blue-200 space-y-1">
                              <p>• Use a tripod for consistent positioning</p>
                              <p>• Set your camera to manual mode for consistent exposure</p>
                              <p>• Use natural light or soft artificial lighting</p>
                              <p>• Take photos from the same distance for all angles</p>
                              <p>• Ensure the product takes up 70-80% of the frame</p>
                            </div>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-300 mb-2">
                              After creating your product, go to the edit page to generate 3D models
                            </p>
                            <Badge variant="outline" className="text-xs border-[#F3C998]/30 text-[#F3C998]">
                              AI-powered 3D generation takes 5-15 minutes
                            </Badge>
                          </div>
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

                      {/* Media Summary */}
                      <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                        <CardHeader>
                          <CardTitle className="text-white text-xl">Media Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-white">
                              <ImageIcon className="h-4 w-4" />
                              Images
                            </span>
                            <Badge
                              variant={selectedFiles.images.length > 0 ? "default" : "secondary"}
                              className={
                                selectedFiles.images.length > 0
                                  ? "bg-[#F3C998]/20 text-[#F3C998] border-[#F3C998]/30"
                                  : ""
                              }
                            >
                              {selectedFiles.images.length}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-white">
                              <Video className="h-4 w-4" />
                              Videos
                            </span>
                            <Badge
                              variant={selectedFiles.videos.length > 0 ? "default" : "secondary"}
                              className={
                                selectedFiles.videos.length > 0
                                  ? "bg-[#F3C998]/20 text-[#F3C998] border-[#F3C998]/30"
                                  : ""
                              }
                            >
                              {selectedFiles.videos.length}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-white">
                              <CuboidIcon className="h-4 w-4" />
                              3D Models
                            </span>
                            <Badge
                              variant={selectedFiles.models.length > 0 ? "default" : "secondary"}
                              className={
                                selectedFiles.models.length > 0
                                  ? "bg-[#F3C998]/20 text-[#F3C998] border-[#F3C998]/30"
                                  : ""
                              }
                            >
                              {selectedFiles.models.length}
                            </Badge>
                          </div>
                          <Separator className="bg-white/20" />
                          <div className="text-sm text-gray-300">
                            Total files:{" "}
                            {selectedFiles.images.length + selectedFiles.videos.length + selectedFiles.models.length}
                          </div>
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
                      Create Product & Continue
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
