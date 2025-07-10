"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Expand, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from "lucide-react"
import type { ProductMedia, ProductImage } from "@/app/types/product"
import { getMediaUrl, getBackendMediaUrl } from "@/utils/product-utils"
import Simple3DViewer from "@/components/product/simple-3d-viewer"

interface ProductGalleryProps {
  media: { id: number|string, url: string, file_type: string, [key: string]: any }[]
  productName: string
}

export function ProductGallery({
  media = [],
  productName,
}: ProductGalleryProps) {
  // Only allow images and videos in the gallery
  const filteredMedia = (media || []).filter(m => m && (m.file_type === 'image' || m.file_type === 'video'));

  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const imageRef = useRef<HTMLDivElement>(null)

  const handleThumbnailClick = (index: number) => {
    setSelectedMediaIndex(index)
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
    // Reset zoom and pan when opening fullscreen
    if (!isFullscreen) {
      setZoom(1)
      setPan({ x: 0, y: 0 })
    }
  }

  const nextMedia = () => {
    setSelectedMediaIndex((prev) => (prev + 1) % filteredMedia.length)
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const prevMedia = () => {
    setSelectedMediaIndex((prev) => (prev - 1 + filteredMedia.length) % filteredMedia.length)
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  // Zoom functions
  const zoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev * 1.5, 5))
  }, [])

  const zoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev / 1.5, 0.5))
  }, [])

  const resetZoom = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [])

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom((prev) => Math.max(0.5, Math.min(5, prev * delta)))
  }, [])

  // Mouse drag for panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }, [zoom, pan.x, pan.y])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }, [isDragging, zoom, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFullscreen) return

      switch (e.key) {
        case "Escape":
          setIsFullscreen(false)
          break
        case "ArrowLeft":
          e.preventDefault()
          prevMedia()
          break
        case "ArrowRight":
          e.preventDefault()
          nextMedia()
          break
        case "+":
        case "=":
          e.preventDefault()
          zoomIn()
          break
        case "-":
          e.preventDefault()
          zoomOut()
          break
        case "0":
          e.preventDefault()
          resetZoom()
          break
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isFullscreen, zoomIn, zoomOut, resetZoom])

  // Reset zoom and pan when changing images
  useEffect(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [selectedMediaIndex])

  if (filteredMedia.length === 0) {
    return (
      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
        <Image
          src={`/placeholder.svg?height=400&width=400&text=${encodeURIComponent(productName)}`}
          alt="No media available"
          width={400}
          height={400}
          className="opacity-50"
        />
      </div>
    )
  }

  // Helper to render media by type
  const renderMedia = (item: {url: string, file_type: string}) => {
    if (item.file_type === 'image') {
      const safeUrl = item.url && item.url.trim() ? getBackendMediaUrl(item.url) : `/placeholder.svg?height=400&width=400&text=${encodeURIComponent(productName)}`;
      return (
        <Image
          src={safeUrl}
          alt={productName}
          fill
          className="object-cover transition-transform hover:scale-105"
          priority
        />
      )
    } else if (item.file_type === 'video') {
      const safeUrl = item.url && item.url.trim() ? getBackendMediaUrl(item.url) : '';
      if (!safeUrl) {
        return (
          <Image
            src={`/placeholder.svg?height=400&width=400&text=${encodeURIComponent(productName)}`}
            alt={productName}
            fill
            className="object-cover transition-transform hover:scale-105"
            priority
          />
        );
      }
      return (
        <video
          src={safeUrl}
          controls
          className="w-full h-full object-cover rounded-lg"
        />
      )
    } else {
      return <div>Unsupported media</div>
    }
  }

  return (
    <div className="space-y-4">
      {/* Main media display */}
      <div
        className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer"
        onClick={toggleFullscreen}
      >
        {renderMedia(filteredMedia[selectedMediaIndex])}
        {/* Always show navigation arrows */}
        <button
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-1 shadow-lg z-10"
          onClick={(e) => { e.stopPropagation(); prevMedia(); }}
          aria-label="Previous image"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-1 shadow-lg z-10"
          onClick={(e) => { e.stopPropagation(); nextMedia(); }}
          aria-label="Next image"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      {/* Thumbnails */}
      <div className="flex gap-2 justify-center mt-2">
        {filteredMedia.map((item, idx) => (
          <button
            key={item.id || idx}
            className={`w-12 h-12 rounded border-2 ${selectedMediaIndex === idx ? 'border-[#F3C998]' : 'border-transparent'} overflow-hidden focus:outline-none`}
            onClick={() => handleThumbnailClick(idx)}
            tabIndex={0}
            aria-label={`Show image ${idx + 1}`}
          >
            {item.file_type === 'image' ? (
              <Image
                src={getBackendMediaUrl(item.url)}
                alt={productName}
                width={48}
                height={48}
                className="object-cover w-full h-full"
              />
            ) : (
              <video src={getBackendMediaUrl(item.url)} className="object-cover w-full h-full" />
            )}
          </button>
        ))}
      </div>
      {/* Enhanced Fullscreen dialog with zoom functionality */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-7xl w-[95vw] h-[95vh] p-0">
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            {/* Close button */}
            <Button
              variant="outline"
              size="icon"
              className="absolute top-4 right-4 z-20 bg-white/20 text-white hover:bg-white/30"
              onClick={() => setIsFullscreen(false)}
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Zoom controls */}
            <div className="absolute top-4 left-4 z-20 flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="bg-white/20 text-white hover:bg-white/30"
                onClick={zoomIn}
                disabled={zoom >= 5}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="bg-white/20 text-white hover:bg-white/30"
                onClick={zoomOut}
                disabled={zoom <= 0.5}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="bg-white/20 text-white hover:bg-white/30"
                onClick={resetZoom}
                disabled={zoom === 1 && pan.x === 0 && pan.y === 0}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            {/* Zoom level indicator */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-black/50 text-white px-3 py-1 rounded text-sm">
              {Math.round(zoom * 100)}%
            </div>

            {/* Navigation arrows in fullscreen */}
            {filteredMedia.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 text-white hover:bg-white/30"
                  onClick={prevMedia}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 text-white hover:bg-white/30"
                  onClick={nextMedia}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}

            {/* Enhanced fullscreen image with zoom and pan */}
            <div 
              ref={imageRef}
              className="relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div
                className="w-full h-full flex items-center justify-center transition-transform duration-200"
                style={{
                  transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                }}
              >
                {renderMedia(filteredMedia[selectedMediaIndex])}
              </div>
            </div>

            {/* Media counter in fullscreen */}
            {filteredMedia.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-2 rounded z-20">
                {selectedMediaIndex + 1} / {filteredMedia.length}
              </div>
            )}

            {/* Thumbnail strip in fullscreen */}
            {filteredMedia.length > 1 && (
              <div className="absolute bottom-4 left-4 right-4 flex justify-center z-20">
                <div className="flex gap-2 overflow-x-auto max-w-md bg-black/30 backdrop-blur-sm p-2 rounded-lg">
                  {filteredMedia.map((item, index) => (
                    <button
                      key={item.id}
                      className={`flex-shrink-0 w-12 h-12 rounded-md overflow-hidden border-2 transition-all ${
                        selectedMediaIndex === index ? "border-white" : "border-transparent hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedMediaIndex(index)}
                    >
                      <div className="relative w-full h-full">
                        {item.file_type === 'image' ? (
                          <Image
                            src={item.url && item.url.trim() ? getBackendMediaUrl(item.url) : `/placeholder.svg?height=400&width=400&text=${encodeURIComponent(productName)}`}
                            alt={productName}
                            fill
                            className="object-cover"
                          />
                        ) : item.file_type === 'video' ? (
                          <video src={getBackendMediaUrl(item.url)} className="object-cover w-full h-full" />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full bg-gray-200 text-gray-500">?</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Keyboard shortcuts hint */}
            <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-2 rounded text-xs z-20">
              <div>Use mouse wheel to zoom</div>
              <div>Drag to pan when zoomed</div>
              <div>Press ESC to close</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
