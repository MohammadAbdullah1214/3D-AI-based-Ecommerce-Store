"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CuboidIcon as Cube, Sparkles, Settings, Play, Square, Download, Eye } from "lucide-react"

interface ThreeDGenerationPanelProps {
  images: { id: string; url: string }[]
  onImageSelect: (angle: string, imageId: string) => void
  selectedImages: { [key: string]: string }
  onGenerate: () => void
  status: string
  progress: number
  message: string
  onCancel: () => Promise<void>
  clothingType: string
  onClothingTypeChange: (type: string) => void
  detailLevel: string
  onDetailLevelChange: (level: string) => void
  preventFormSubmission?: boolean
}

export default function ThreeDGenerationPanel({
  images = [],
  onImageSelect,
  selectedImages = {},
  onGenerate,
  status,
  progress,
  message,
  onCancel,
  clothingType,
  onClothingTypeChange,
  detailLevel,
  onDetailLevelChange,
  preventFormSubmission = false,
}: ThreeDGenerationPanelProps) {
  const [activeTab, setActiveTab] = useState("selection")

  const angles = [
    { key: "front", label: "Front View", description: "Main front-facing image" },
    { key: "back", label: "Back View", description: "Rear view of the item" },
    { key: "side", label: "Side View", description: "Profile view from the side" },
    { key: "top", label: "Top View", description: "View from above" },
    { key: "bottom", label: "Bottom View", description: "View from below" },
    { key: "diagonal", label: "Diagonal View", description: "45-degree angle view" },
  ]

  const clothingTypes = [
    { value: "tshirt", label: "T-Shirt" },
    { value: "shirt", label: "Shirt" },
    { value: "pants", label: "Pants/Trousers" },
    { value: "dress", label: "Dress" },
    { value: "jacket", label: "Jacket/Coat" },
    { value: "hoodie", label: "Hoodie" },
    { value: "skirt", label: "Skirt" },
    { value: "shoes", label: "Shoes" },
  ]

  const detailLevels = [
    { value: "low", label: "Low Detail", description: "Fast generation, basic quality" },
    { value: "medium", label: "Medium Detail", description: "Balanced speed and quality" },
    { value: "high", label: "High Detail", description: "Slow generation, best quality" },
  ]

  const getStatusColor = () => {
    switch (status) {
      case "generating":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30"
      case "completed":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
      case "failed":
        return "bg-red-500/20 text-red-300 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30"
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case "generating":
        return <Play className="h-4 w-4" />
      case "completed":
        return <Download className="h-4 w-4" />
      case "failed":
        return <Square className="h-4 w-4" />
      default:
        return <Cube className="h-4 w-4" />
    }
  }

  const selectedCount = Object.keys(selectedImages).length
  const canGenerate = selectedCount >= 2 && clothingType && detailLevel

  return (
    <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-[#F3C998]/20">
              <Cube className="h-6 w-6 text-[#F3C998]" />
            </div>
            <div>
              <CardTitle className="text-white text-xl font-bold">3D Model Generation</CardTitle>
              <CardDescription className="text-gray-300">Create a 3D model from your product images</CardDescription>
            </div>
          </div>
          <Badge className={`px-3 py-1 ${getStatusColor()}`}>
            {getStatusIcon()}
            <span className="ml-2 capitalize">{status || "Ready"}</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10">
            <TabsTrigger
              value="selection"
              className="data-[state=active]:bg-[#F3C998]/20 data-[state=active]:text-[#F3C998] text-gray-300"
            >
              <Eye className="h-4 w-4 mr-2" />
              Image Selection
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="data-[state=active]:bg-[#F3C998]/20 data-[state=active]:text-[#F3C998] text-gray-300"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
            <TabsTrigger
              value="generation"
              className="data-[state=active]:bg-[#F3C998]/20 data-[state=active]:text-[#F3C998] text-gray-300"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="selection" className="space-y-4 mt-6">
            <div className="text-sm text-gray-300 mb-4">
              Select images for different angles. At least 2 angles are required for 3D generation.
            </div>

            <div className="grid gap-4">
              {angles.map((angle) => (
                <div
                  key={angle.key}
                  className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-[#F3C998]/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-white font-medium">{angle.label}</h4>
                      <p className="text-sm text-gray-400">{angle.description}</p>
                    </div>
                    <Badge
                      variant={selectedImages[angle.key] ? "default" : "outline"}
                      className={
                        selectedImages[angle.key]
                          ? "bg-[#F3C998]/20 text-[#F3C998] border-[#F3C998]/30"
                          : "border-white/20 text-gray-400"
                      }
                    >
                      {selectedImages[angle.key] ? "Selected" : "Not Selected"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {images.map((image) => (
                      <button
                        key={image.id}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          onImageSelect(angle.key, image.id)
                        }}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                          selectedImages[angle.key] === image.id
                            ? "border-[#F3C998] ring-2 ring-[#F3C998]/30"
                            : "border-white/20 hover:border-[#F3C998]/50"
                        }`}
                      >
                        <img
                          src={image.url || "/placeholder.svg"}
                          alt={`Product image ${image.id}`}
                          className="w-full h-full object-cover"
                        />
                        {selectedImages[angle.key] === image.id && (
                          <div className="absolute inset-0 bg-[#F3C998]/20 flex items-center justify-center">
                            <div className="w-6 h-6 rounded-full bg-[#F3C998] flex items-center justify-center">
                              <span className="text-[#1D212D] text-xs font-bold">✓</span>
                            </div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 rounded-lg bg-[#F3C998]/10 border border-[#F3C998]/20">
              <div className="text-sm text-[#F3C998] font-medium">
                Progress: {selectedCount} of {angles.length} angles selected
              </div>
              <div className="mt-2">
                <Progress value={(selectedCount / angles.length) * 100} className="h-2" />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 mt-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-white mb-2 block">Clothing Type</label>
                <Select value={clothingType} onValueChange={onClothingTypeChange}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white focus:ring-2 focus:ring-[#F3C998] focus:border-[#F3C998]">
                    <SelectValue placeholder="Select clothing type" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2A2F3A] border-white/20">
                    {clothingTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value} className="text-white hover:bg-white/10">
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-white mb-2 block">Detail Level</label>
                <Select value={detailLevel} onValueChange={onDetailLevelChange}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white focus:ring-2 focus:ring-[#F3C998] focus:border-[#F3C998]">
                    <SelectValue placeholder="Select detail level" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2A2F3A] border-white/20">
                    {detailLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value} className="text-white hover:bg-white/10">
                        <div>
                          <div className="font-medium">{level.label}</div>
                          <div className="text-xs text-gray-400">{level.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <h4 className="text-blue-300 font-medium mb-2">Generation Tips</h4>
              <ul className="text-sm text-blue-200 space-y-1">
                <li>• Use high-quality, well-lit images for best results</li>
                <li>• Ensure consistent lighting across all angles</li>
                <li>• Higher detail levels take longer but produce better quality</li>
                <li>• Front and back views are most important for clothing items</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="generation" className="space-y-4 mt-6">
            <div className="space-y-4">
              {status === "generating" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">Generating 3D Model...</span>
                    <span className="text-[#F3C998] font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                  <p className="text-sm text-gray-300">{message}</p>
                </div>
              )}

              {status === "completed" && (
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <Download className="h-5 w-5 text-emerald-300" />
                    <span className="text-emerald-300 font-medium">3D Model Generated Successfully!</span>
                  </div>
                  <p className="text-sm text-emerald-200">{message}</p>
                </div>
              )}

              {status === "failed" && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <Square className="h-5 w-5 text-red-300" />
                    <span className="text-red-300 font-medium">Generation Failed</span>
                  </div>
                  <p className="text-sm text-red-200">{message}</p>
                </div>
              )}

              <div className="flex space-x-3">
                {status !== "generating" ? (
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      onGenerate()
                    }}
                    disabled={!canGenerate}
                    className="flex-1 bg-[#F3C998] hover:bg-[#F3C998]/90 text-[#1D212D] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate 3D Model
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      onCancel()
                    }}
                    variant="outline"
                    className="flex-1 border-red-500/30 text-red-300 hover:bg-red-500/10 bg-transparent"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Cancel Generation
                  </Button>
                )}
              </div>

              {!canGenerate && (
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-sm text-yellow-200">
                    Please select at least 2 images, choose a clothing type, and set the detail level to generate a 3D
                    model.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
