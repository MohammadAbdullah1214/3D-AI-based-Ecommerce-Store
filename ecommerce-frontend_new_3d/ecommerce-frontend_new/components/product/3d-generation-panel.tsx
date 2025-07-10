"use client"

import { useState, useMemo, useEffect } from "react"
import Image from "next/image"
import { useGetProductMediaQuery } from "@/store/services/mediaApi"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  HelpCircle,
  ImageIcon,
  CheckCircle,
  XCircle,
  RotateCw,
  Ban,
  Loader2,
  Info,
  Lightbulb,
} from "lucide-react"
import { getMediaUrl } from "@/utils/product-utils"
import type { Product, GenerationStatus, ProductMedia } from "@/app/types/product"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DialogDescription } from "@radix-ui/react-dialog"

const ANGLE_DEFINITIONS = {
  front: {
    label: "Front View",
    description: "A clear picture of the product from the front.",
    icon: <ImageIcon className="h-8 w-8 text-gray-400" />,
  },
  back: {
    label: "Back View",
    description: "A picture showing the back of the product.",
    icon: <ImageIcon className="h-8 w-8 text-gray-400" />,
  },
  left: {
    label: "Left View",
    description: "A picture showing the left side of the product.",
    icon: <ImageIcon className="h-8 w-8 text-gray-400" />,
  },
  right: {
    label: "Right View",
    description: "A picture showing the right side of the product.",
    icon: <ImageIcon className="h-8 w-8 text-gray-400" />,
  },
  top: {
    label: "Top View",
    description: "A picture showing the top of the product.",
    icon: <ImageIcon className="h-8 w-8 text-gray-400" />,
  },
  bottom: {
    label: "Bottom View",
    description: "A picture showing the bottom of the product.",
    icon: <ImageIcon className="h-8 w-8 text-gray-400" />,
  },
}

const CLOTHING_TYPES = ["tshirt", "pants", "shirts", "shoes"]

interface ThreeDGenerationPanelProps {
  productId: number
  productMedia: ProductMedia[]
  generationStatus?: GenerationStatus | null
  has3dModel: boolean
  onGenerationStart: (
    detailLevel: string,
    angleMapping: Record<string, number>,
    clothingType: string,
  ) => void
  onCancel: () => void
  isGenerating: boolean
  isCancelling: boolean
}

export function ThreeDGenerationPanel({
  productId,
  productMedia,
  generationStatus,
  onGenerationStart,
  onCancel,
  isGenerating,
  isCancelling,
}: ThreeDGenerationPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [detailLevel, setDetailLevel] = useState("medium")
  const [clothingType, setClothingType] = useState("")
  const [angleMapping, setAngleMapping] = useState<Record<string, number | null>>({
    front: null,
    back: null,
    left: null,
    right: null,
    top: null,
    bottom: null,
  })
  const [selectedAngle, setSelectedAngle] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const productImages = useMemo(
    () => (productMedia || []).filter((media) => media.file_type === "image"),
    [productMedia],
  )
  
  const assignedImagesCount = useMemo(
    () => Object.values(angleMapping).filter((id) => id !== null).length,
    [angleMapping],
  )

  const isSetupComplete = assignedImagesCount >= 2 && assignedImagesCount <= 6 && clothingType !== ""

  const handleSelectImage = (angle: string, imageId: number) => {
    setAngleMapping((prev) => ({ ...prev, [angle]: imageId }))
    setIsDialogOpen(false)
  }

  const handleGenerateClick = () => {
    if (isSetupComplete) {
      const assignedAngles = Object.entries(angleMapping)
        .filter(([, imageId]) => imageId !== null)
        .reduce(
          (acc, [angle, imageId]) => {
            acc[angle] = imageId as number
            return acc
          },
          {} as Record<string, number>,
        )
      onGenerationStart(detailLevel, assignedAngles, clothingType)
    }
  }
  
  const getSelectedImageSrc = (angle: string): string | null => {
    const imageId = angleMapping[angle]
    if (!imageId) return null
    const image = productImages.find((img) => img.id === imageId)
    return image ? getMediaUrl(image) || null : null
  }

  const renderStatus = () => {
    if (!generationStatus?.has_generation) {
      return (
        <Alert variant="default" className="bg-blue-50 border-blue-200">
          <Lightbulb className="h-4 w-4 text-blue-600" />
          <AlertTitle>Ready to Generate</AlertTitle>
          <AlertDescription>
            You haven't generated a 3D model for this product yet. Follow the steps below to create one.
          </AlertDescription>
        </Alert>
      )
    }

    const { status, progress, message } = generationStatus
    switch (status) {
      case "pending":
      case "processing":
        return (
          <Card className="p-4 bg-gray-50">
            <div className="flex items-center mb-2">
              <RotateCw className="h-4 w-4 mr-2 animate-spin text-blue-600" />
              <p className="font-semibold text-blue-800">
                Generation in Progress... ({status})
              </p>
            </div>
            <Progress value={progress} className="w-full mb-2" />
            <p className="text-sm text-gray-600">
              {progress}% complete. {message}
            </p>
            <Button
              className="w-full mt-4"
              variant="destructive"
              onClick={onCancel}
              disabled={isCancelling}
            >
              {isCancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ban className="mr-2 h-4 w-4" />}
              Cancel Generation
            </Button>
          </Card>
        )
      case "completed":
        return (
          <Alert variant="default" className="bg-green-50 border-green-300">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle>Generation Complete!</AlertTitle>
            <AlertDescription>
              Your 3D model is ready. It will now appear on the product page.
            </AlertDescription>
          </Alert>
        )
      case "failed":
        return (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Generation Failed</AlertTitle>
            <AlertDescription>
              {message || "Something went wrong. Please try again or contact support."}
            </AlertDescription>
          </Alert>
        )
      case "cancelled":
        return (
          <Alert>
            <Ban className="h-4 w-4" />
            <AlertTitle>Generation Cancelled</AlertTitle>
            <AlertDescription>The 3D model generation process was cancelled.</AlertDescription>
          </Alert>
        )
      default:
        return null
    }
  }

  const isGeneratingOrCompleted =
    generationStatus?.has_generation &&
    (generationStatus.status === "processing" ||
      generationStatus.status === "pending" ||
      generationStatus.status === "completed")

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>AI-Powered 3D Model Generation</CardTitle>
        <CardDescription>
          Create a 3D model of your product automatically from existing images.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="instructions">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-blue-500" />
                <span className="font-semibold">How does this work? (Click to expand)</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-2 pt-2 text-sm text-gray-700">
              <p>
                <b>Step 1: Assign Images:</b> For each angle below, click the card and select the product image that
                best matches that view. You must assign between 2 and 6 images.
              </p>
              <p>
                <b>Step 2: Choose Clothing Type:</b> Select the type of clothing you are generating a model for.
              </p>
              <p>
                <b>Step 3: Choose Detail Level:</b> Select how detailed you want the final 3D model to be. "High"
                looks best but takes longer to generate.
              </p>
              <p>
                <b>Step 4: Generate:</b> Once all images and a clothing type are selected, click the "Generate Model"
                button. The AI will process the images and create the model. This can take several minutes.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {renderStatus()}

        {!isGeneratingOrCompleted && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-1">1. Assign Images for Each Angle</h3>
              <p className="text-sm text-gray-600 mb-4">
                You must assign between 2 and 6 images to generate a model. Currently assigned:{" "}
                <span className="font-bold">{assignedImagesCount}</span>.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(ANGLE_DEFINITIONS).map(([angle, { label, icon, description }]) => {
                  const src = getSelectedImageSrc(angle)
                  return (
                    <Dialog key={angle}>
                      <DialogTrigger asChild>
                        <Card className="flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:shadow-md hover:border-blue-500 transition-all border-2 border-dashed relative group">
                          {src ? (
                            <>
                              <Image
                                src={src}
                                alt={`Selected for ${label}`}
                                fill
                                className="object-cover rounded-md"
                              />
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                                <p className="text-white font-semibold">Change</p>
                              </div>
                            </>
                          ) : (
                            <>
                              {icon}
                              <p className="font-semibold mt-2">{label}</p>
                              <p className="text-xs text-gray-500">{description}</p>
                            </>
                          )}
                          {src && (
                            <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full p-1">
                              <CheckCircle className="h-4 w-4" />
                            </div>
                          )}
                        </Card>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <DialogHeader>
                          <DialogTitle>Select Image for: {label}</DialogTitle>
                          <DialogDescription>
                            Choose one of your uploaded product images to represent the {label}.
                          </DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="h-[60vh]">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
                            {productImages.map((image) => (
                              <DialogClose asChild key={image.id}>
                                <button
                                  onClick={() => handleSelectImage(angle, image.id)}
                                  className={`relative rounded-lg overflow-hidden border-4 ${
                                    angleMapping[angle] === image.id
                                      ? "border-blue-500"
                                      : "border-transparent hover:border-blue-300"
                                  }`}
                                >
                                  <Image
                                    src={getMediaUrl(image)}
                                    alt={`Product Image ${image.id}`}
                                    width={200}
                                    height={200}
                                    className="object-cover w-full h-full"
                                  />
                                </button>
                              </DialogClose>
                            ))}
                          </div>
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                  )
                })}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">2. Choose Clothing Type</h3>
              <Select value={clothingType} onValueChange={setClothingType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a clothing type..." />
                </SelectTrigger>
                <SelectContent>
                  {CLOTHING_TYPES.map((type) => (
                    <SelectItem key={type} value={type} className="capitalize">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">3. Choose Detail Level</h3>
              <Select value={detailLevel} onValueChange={setDetailLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Faster, less detail</SelectItem>
                  <SelectItem value="medium">Medium - Good balance</SelectItem>
                  <SelectItem value="high">High - Best quality, slower</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-2">
                Higher detail levels result in a more accurate model but take longer to process.
              </p>
            </div>
          </div>
        )}
      </CardContent>
      {!isGeneratingOrCompleted && (
        <CardFooter className="flex flex-col items-stretch">
          {!isSetupComplete && (
            <Alert variant="destructive" className="mb-4">
              <Info className="h-4 w-4" />
              <AlertTitle>Setup Required</AlertTitle>
              <AlertDescription>
                Please assign between 2 and 6 images and choose a clothing type before generating a model.
              </AlertDescription>
            </Alert>
          )}
          <Button
            size="lg"
            onClick={handleGenerateClick}
            disabled={isGenerating || !isSetupComplete}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate 3D Model"
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}