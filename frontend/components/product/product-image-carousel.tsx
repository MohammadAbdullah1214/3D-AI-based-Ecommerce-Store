"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ProductImageCarouselProps {
  images: { id: number|string, url: string }[]
  productName: string
  onHover?: boolean
  interval?: number
  showControls?: boolean
  className?: string
}

export function ProductImageCarousel({
  images,
  productName,
  onHover = false,
  interval = 1500,
  showControls = true,
  className = "",
}: ProductImageCarouselProps) {
  // Filter out invalid images BEFORE any state/logic
  const initialValidImages = (images || []).filter(
    (img) => img && typeof img.url === 'string' && img.url.trim()
  );

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [imageError, setImageError] = useState<Record<number, boolean>>({})
  const [imageLoaded, setImageLoaded] = useState<Record<number, boolean>>({})
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const imageContainerRef = useRef<HTMLDivElement>(null)

  // Filter out images that failed to load
  const validImages = initialValidImages.filter((_, index) => !imageError[index]);

  const nextImage = useCallback(() => {
    if (validImages.length > 1) {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % validImages.length
        return next
      })
    }
  }, [validImages.length])

  const prevImage = useCallback(() => {
    if (validImages.length > 1) {
      setCurrentIndex((prev) => {
        const next = (prev - 1 + validImages.length) % validImages.length
        return next
      })
    }
  }, [validImages.length])

  // Clear any existing interval
  const clearCarouselInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Start carousel interval
  const startCarouselInterval = useCallback(() => {
    if (validImages.length > 1) {
      clearCarouselInterval()
      intervalRef.current = setInterval(() => {
        nextImage()
      }, interval)
    }
  }, [validImages.length, interval, nextImage, clearCarouselInterval])

  // Handle hover state changes - FIXED: Don't reset to 0 immediately
  useEffect(() => {
    if (onHover && isHovered && validImages.length > 1) {
      startCarouselInterval()
    } else {
      if (!isHovered && onHover && validImages.length > 1) {
        // Use a longer delay to prevent flickering
        const resetTimer = setTimeout(() => {
          setCurrentIndex(0)
        }, 300)
        return () => clearTimeout(resetTimer)
      }
    }

    return () => clearCarouselInterval()
  }, [isHovered, onHover, validImages.length, startCarouselInterval, clearCarouselInterval])

  // Reset index if it's out of bounds
  useEffect(() => {
    if (currentIndex >= validImages.length && validImages.length > 0) {
      setCurrentIndex(0)
    }
  }, [currentIndex, validImages.length])

  // Cleanup on unmount
  useEffect(() => {
    return () => clearCarouselInterval()
  }, [clearCarouselInterval])

  // Reset zoom/pan on image change or fullscreen toggle
  useEffect(() => {
    setZoom(1)
    setOffset({ x: 0, y: 0 })
  }, [currentIndex, fullscreen])

  // Fullscreen styles
  const fullscreenStyles = fullscreen
    ? {
        position: "fixed" as const,
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 9999,
        background: "rgba(0,0,0,0.95)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }
    : {}

  // FIXED: Better error handling
  const handleImageError = (index: number) => {
    setImageError((prev) => ({ ...prev, [index]: true }))
    // If current image fails, try to move to next available image
    if (index === currentIndex && validImages.length > 1) {
      setTimeout(() => nextImage(), 100)
    }
  }

  // FIXED: Proper image load tracking
  const handleImageLoad = (index: number) => {
    setImageLoaded((prev) => ({ ...prev, [index]: true }))
  }

  // Zoom handlers
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    setZoom((z) => Math.max(1, Math.min(5, z - e.deltaY * 0.002)))
  }
  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom === 1) return
    setDragging(true)
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
  }
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || zoom === 1) return
    setOffset({ x: e.clientX - (dragStart?.x || 0), y: e.clientY - (dragStart?.y || 0) })
  }
  const handleMouseUp = () => setDragging(false)
  // Touch handlers for mobile
  // ... (optional, can add pinch/drag support)

  // If no valid images, show placeholder
  if (!validImages.length) {
    return (
      <div className={`relative aspect-square bg-gray-100 flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-500 dark:text-gray-200">
          <div className="text-sm">No Image Available</div>
          <div className="text-xs mt-1">{productName}</div>
        </div>
      </div>
    )
  }

  const currentImage = validImages[currentIndex]

  // Always fallback to placeholder if url is missing
  const getImageUrl = (img: { id: number|string, url: string } | undefined | null): string => {
    if (img && typeof img.url === 'string' && img.url.trim()) {
      return img.url.trim()
    }
    return `/placeholder.svg?height=400&width=400&text=${encodeURIComponent(productName)}`
  }

  const imageUrl = getImageUrl(currentImage)

  return (
    <div
      className={`relative aspect-square overflow-hidden bg-gray-100 group ${className}`}
      style={fullscreen ? fullscreenStyles : {}}
      ref={imageContainerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* FIXED: Better loading state - don't block image if not explicitly loading */}
      {!imageLoaded[currentIndex] && currentIndex < validImages.length && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
        </div>
      )}

      {/* Main image */}
      <div className="relative w-full h-full">
        <Image
          src={imageUrl}
          alt={`${productName} - Image ${currentIndex + 1}`}
          fill
          className={`object-cover transition-all duration-500 ease-in-out ${fullscreen ? "cursor-move" : ""}`}
          style={{
            transform: `scale(${zoom}) translate(${offset.x / zoom}px, ${offset.y / zoom}px)`,
            transition: dragging ? "none" : "transform 0.3s cubic-bezier(.4,2,.6,1)",
            zIndex: 2,
          }}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onError={() => handleImageError(currentIndex)}
          onLoad={() => handleImageLoad(currentIndex)}
          priority={currentIndex === 0}
          unoptimized={imageUrl.startsWith('http')}
          draggable={false}
        />
      </div>
      {/* Fullscreen toggle button */}
      <Button
        size="icon"
        variant="ghost"
        className="absolute top-2 right-2 z-30 bg-white/80 hover:bg-white"
        onClick={() => setFullscreen((f) => !f)}
      >
        {fullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
      </Button>

      {/* Hover overlay for smooth transition effect */}
      {onHover && validImages.length > 1 && (
        <div
          className={`absolute inset-0 transition-all duration-300 ${isHovered ? "bg-black/5" : "bg-transparent"}`}
        />
      )}

      {/* Navigation Controls */}
      {showControls && validImages.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 opacity-0 group-hover:opacity-100 transition-all duration-200 z-20"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              prevImage()
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 opacity-0 group-hover:opacity-100 transition-all duration-200 z-20"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              nextImage()
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      )}

      {/* Dots Indicator */}
      {validImages.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1 z-20">
          {validImages.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex ? "bg-white scale-110 shadow-lg" : "bg-white/50 hover:bg-white/70 scale-100"
              }`}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setCurrentIndex(index)
              }}
            />
          ))}
        </div>
      )}

      {/* Image counter */}
      {validImages.length > 1 && (
        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full z-20">
          {currentIndex + 1}/{validImages.length}
        </div>
      )}
    </div>
  )
}