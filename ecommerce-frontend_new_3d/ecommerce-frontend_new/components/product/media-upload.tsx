"use client"

import {
  FileVideo,
  ImageIcon,
  Loader2,
  Cuboid,
  Plus,
  Trash2,
  Upload,
} from "lucide-react"
import Image from "next/image"
import { useCallback, useRef, useState } from "react"

import type { ProductMedia } from "@/app/types/product"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getMediaUrl } from "@/utils/product-utils"
import { toast } from "@/components/ui/use-toast"

interface MediaUploadProps {
  productId?: number
  onFilesChange: (files: File[]) => void
  onClear?: () => void
  existingMedia?: ProductMedia[]
  isUploading?: boolean
}

export const MediaUpload: React.FC<MediaUploadProps> = ({
  productId,
  onFilesChange,
  existingMedia = [],
  isUploading = false,
}) => {
  const [newFiles, setNewFiles] = useState<File[]>([])
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const modelInputRef = useRef<HTMLInputElement>(null)

  const handleFilesSelected = (selectedFiles: FileList | null) => {
    if (selectedFiles) {
      const filesArray = Array.from(selectedFiles)
      setNewFiles((prev) => {
        const updatedFiles = [...prev, ...filesArray]
        onFilesChange(updatedFiles)
        return updatedFiles
      })
    }
  }

  const handleRemoveNewFile = (fileToRemove: File) => {
    setNewFiles((prev) => {
      const updatedFiles = prev.filter((f) => f !== fileToRemove)
      onFilesChange(updatedFiles)
      return updatedFiles
    })
  }

  const handleRemoveExistingMedia = (mediaId: number) => {
    // This is not implemented on the backend yet.
    // We will show a toast message.
    toast({
      title: "Feature Not Available",
      description: "This feature is not yet implemented.",
    })
    console.log(`Request to delete existing media ID: ${mediaId}`)
  }

  const renderFilePreview = (file: File) => {
    const url = URL.createObjectURL(file)
    if (file.type.startsWith("image/")) {
        return (
          <Image
          src={url}
          alt={file.name}
          width={200}
          height={200}
          className="rounded-lg object-cover aspect-square"
          onLoad={() => URL.revokeObjectURL(url)}
        />
      )
    }
    if (file.type.startsWith("video/")) {
        return (
        <div className="w-full h-full bg-secondary rounded-lg flex items-center justify-center">
          <FileVideo className="w-10 h-10 text-muted-foreground" />
          </div>
        )
    }
    // Fallback for 3D models or other file types
    return (
      <div className="w-full h-full bg-secondary rounded-lg flex items-center justify-center">
        <Cuboid className="w-10 h-10 text-muted-foreground" />
      </div>
    )
  }

  const images = newFiles.filter((f) => f.type.startsWith("image/"))
  const videos = newFiles.filter((f) => f.type.startsWith("video/"))
  const models = newFiles.filter(
    (f) =>
      f.type.includes("gltf") ||
      f.type.includes("glb") ||
      f.name.endsWith(".glb") ||
      f.name.endsWith(".gltf"),
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Media Manager</CardTitle>
        <CardDescription>
          Add or remove images, videos, and 3D models for your product.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="existing">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="existing">
              Existing ({existingMedia.length})
            </TabsTrigger>
            <TabsTrigger value="images">Images ({images.length})</TabsTrigger>
            <TabsTrigger value="videos">Videos ({videos.length})</TabsTrigger>
            <TabsTrigger value="models">3D Models ({models.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="existing" className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {existingMedia.map((media) => (
                <div key={media.id} className="relative group">
                  {media.file_type.startsWith("image") ? (
                    <Image
                      src={getMediaUrl(media)}
                      alt={`Product media ${media.id}`}
                      width={200}
                      height={200}
                      className="rounded-lg object-cover aspect-square"
                    />
                  ) : media.file_type.startsWith("video") ? (
                    <div className="w-full h-full bg-secondary rounded-lg flex items-center justify-center">
                      <FileVideo className="w-10 h-10 text-muted-foreground" />
          </div>
        ) : (
                    <div className="w-full h-full bg-secondary rounded-lg flex items-center justify-center">
                      <Cuboid className="w-10 h-10 text-muted-foreground" />
      </div>
                  )}
                  <div className="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-7 w-7"
                      onClick={() => handleRemoveExistingMedia(media.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center p-1 truncate">
                    {media.file_type}
                  </div>
                </div>
              ))}
              {existingMedia.length === 0 && (
                <p className="text-sm text-muted-foreground col-span-full">
                  No existing media found.
                </p>
              )}
            </div>
          </TabsContent>

          {["images", "videos", "models"].map((tab) => {
            let files, Icon, inputRef, accept
            if (tab === "images") {
              files = images
              Icon = ImageIcon
              inputRef = imageInputRef
              accept = "image/*"
            } else if (tab === "videos") {
              files = videos
              Icon = FileVideo
              inputRef = videoInputRef
              accept = "video/*"
            } else {
              files = models
              Icon = Cuboid
              inputRef = modelInputRef
              accept = ".glb,.gltf"
            }

            return (
              <TabsContent key={tab} value={tab} className="mt-4">
                <input
                  type="file"
                  ref={inputRef}
                  multiple
                  accept={accept}
                  className="hidden"
                  onChange={(e) => handleFilesSelected(e.target.files)}
                />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {files.map((file, index) => (
                    <div key={index} className="relative group">
                      {renderFilePreview(file)}
                      <div className="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="destructive"
                          className="h-7 w-7"
                          onClick={() => handleRemoveNewFile(file)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
          </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center p-1 truncate">
                        {file.name}
      </div>
    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors"
                  >
                    <Icon className="w-10 h-10 mb-2" />
                    <span>Add {tab}</span>
                  </button>
                </div>
              </TabsContent>
            )
          })}
        </Tabs>
      </CardContent>
      {newFiles.length > 0 && (
        <CardFooter className="flex justify-end gap-2">
          {isUploading && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Uploading...</span>
            </div>
          )}
          <Button
            variant="outline"
            onClick={() => {
              setNewFiles([])
              onFilesChange([])
            }}
            disabled={isUploading}
          >
            Clear new files
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
