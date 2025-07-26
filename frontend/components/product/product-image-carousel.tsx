"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import { createPortal } from "react-dom"
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ProductImageCarouselProps {
  images: { id: number | string; url: string }[]
  productName: string
  onHover?: boolean
  interval?: number
  showControls?: boolean
  className?: string
  allowFullscreen?: boolean
}

export function ProductImageCarousel({
  images,
  productName,
  onHover = false,
  interval = 1500,
  showControls = true,
  className = "",
  allowFullscreen = true,
}: ProductImageCarouselProps) {
  // Filter out invalid images BEFORE any state/logic
  const initialValidImages = (images || []).filter((img) => img && typeof img.url === "string" && img.url.trim())

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
  const validImages = initialValidImages.filter((_, index) => !imageError[index])

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

  // Handle hover state changes
  useEffect(() => {
    if (onHover && isHovered && validImages.length > 1) {
      startCarouselInterval()
    } else {
      if (!isHovered && onHover && validImages.length > 1) {
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

  // When exiting fullscreen, reset zoom and pan
  useEffect(() => {
    if (!fullscreen) {
      setZoom(1)
      setOffset({ x: 0, y: 0 })
      setDragging(false)
    }
  }, [fullscreen])

  // Enhanced fullscreen exit function
  const exitFullscreen = useCallback(() => {
    setFullscreen(false)
    document.body.classList.remove("fullscreen-active")
    document.body.style.overflow = ""
    setZoom(1)
    setOffset({ x: 0, y: 0 })
    setDragging(false)
    setDragStart(null)
  }, [])

  // Handle escape key for fullscreen
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && fullscreen) {
        event.preventDefault()
        event.stopPropagation()
        exitFullscreen()
      }
    }

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && fullscreen) {
        exitFullscreen()
      }
    }

    document.addEventListener("keydown", handleEscape, { capture: true })
    document.addEventListener("fullscreenchange", handleFullscreenChange)

    if (fullscreen) {
      document.body.classList.add("fullscreen-active")
      // Prevent body scroll
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.removeEventListener("keydown", handleEscape, { capture: true })
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      if (fullscreen) {
        document.body.classList.remove("fullscreen-active")
        document.body.style.overflow = ""
      }
    }
  }, [fullscreen, exitFullscreen])

  const handleImageError = (index: number) => {
    setImageError((prev) => ({ ...prev, [index]: true }))
    if (index === currentIndex && validImages.length > 1) {
      setTimeout(() => nextImage(), 100)
    }
  }

  const handleImageLoad = (index: number) => {
    setImageLoaded((prev) => ({ ...prev, [index]: true }))
  }

  // Zoom handlers
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!fullscreen) return
      e.preventDefault()
      e.stopPropagation()
      setZoom((z) => Math.max(1, Math.min(5, z - e.deltaY * 0.002)))
    },
    [fullscreen],
  )

  // Pan handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!fullscreen || zoom === 1) return
      e.preventDefault()
      e.stopPropagation()
      setDragging(true)
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
    },
    [fullscreen, zoom, offset],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!fullscreen || !dragging || zoom === 1 || !dragStart) return
      e.preventDefault()
      setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
    },
    [fullscreen, dragging, zoom, dragStart],
  )

  const handleMouseUp = useCallback(() => {
    setDragging(false)
    setDragStart(null)
  }, [])

  // Enhanced fullscreen navigation handlers
  const handleFullscreenPrev = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      prevImage()
    },
    [prevImage],
  )

  const handleFullscreenNext = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      nextImage()
    },
    [nextImage],
  )

  const handleFullscreenClose = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      exitFullscreen()
    },
    [exitFullscreen],
  )

  // Only allow toggling fullscreen if allowFullscreen is true
  const handleToggleFullscreen = () => {
    if (allowFullscreen) {
      const newFullscreenState = !fullscreen
      setFullscreen(newFullscreenState)

      if (newFullscreenState) {
        document.body.classList.add("fullscreen-active")
        document.body.style.overflow = "hidden"
      } else {
        document.body.classList.remove("fullscreen-active")
        document.body.style.overflow = ""
      }
    }
  }

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
  const getImageUrl = (img: { id: number | string; url: string } | undefined | null): string => {
    if (img && typeof img.url === "string" && img.url.trim()) {
      return img.url.trim()
    }
    return `/placeholder.svg?height=400&width=400&text=${encodeURIComponent(productName)}`
  }

  const imageUrl = getImageUrl(currentImage)

  // Enhanced Fullscreen modal component with better mobile support
  const FullscreenModal = () => {
    if (!fullscreen) return null

    return createPortal(
      <div
        className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center touch-none"
        style={{ zIndex: 999999 }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={(e) => {
          if (zoom > 1) {
            const touch = e.touches[0]
            setDragging(true)
            setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y })
          }
        }}
        onTouchMove={(e) => {
          if (dragging && zoom > 1 && dragStart) {
            e.preventDefault()
            const touch = e.touches[0]
            setOffset({ x: touch.clientX - dragStart.x, y: touch.clientY - dragStart.y })
          }
        }}
        onTouchEnd={handleMouseUp}
      >
        {/* Main image container */}
        <div className="relative w-full h-full flex items-center justify-center px-4 sm:px-8 md:px-16">
          <Image
            src={getImageUrl(currentImage) || "/placeholder.svg"}
            alt={`${productName} - Image ${currentIndex + 1}`}
            fill
            className="object-contain select-none pointer-events-none"
            style={{
              transform: `scale(${zoom}) translate(${offset.x / zoom}px, ${offset.y / zoom}px)`,
              transition: dragging ? "none" : "transform 0.3s cubic-bezier(.4,2,.6,1)",
            }}
            sizes="100vw"
            onError={() => handleImageError(currentIndex)}
            onLoad={() => handleImageLoad(currentIndex)}
            priority
            unoptimized={getImageUrl(currentImage).startsWith("http")}
            draggable={false}
          />

          {/* Close button - Enhanced for mobile */}
          <button
            className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-white/95 backdrop-blur-sm hover:bg-white shadow-lg border-0 text-black hover:text-black rounded-lg p-2 sm:p-3 touch-manipulation z-[1000001] flex items-center justify-center min-w-[44px] min-h-[44px]"
            onClick={handleFullscreenClose}
            title="Close fullscreen (ESC)"
            aria-label="Close fullscreen"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          {/* Navigation in fullscreen - Enhanced for mobile */}
          {validImages.length > 1 && (
            <>
              <button
                className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 bg-white/95 text-black hover:bg-white shadow-lg border-0 hover:text-black rounded-lg p-2 sm:p-3 touch-manipulation z-[1000001] flex items-center justify-center min-w-[44px] min-h-[44px]"
                onClick={handleFullscreenPrev}
                title="Previous image"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6 sm:h-7 sm:w-7" />
              </button>
              <button
                className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 bg-white/95 text-black hover:bg-white shadow-lg border-0 hover:text-black rounded-lg p-2 sm:p-3 touch-manipulation z-[1000001] flex items-center justify-center min-w-[44px] min-h-[44px]"
                onClick={handleFullscreenNext}
                title="Next image"
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6 sm:h-7 sm:w-7" />
              </button>
            </>
          )}

          {/* Image counter in fullscreen */}
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6 bg-black/80 text-white text-sm sm:text-base px-3 py-2 rounded-lg select-none z-[1000001]">
            {currentIndex + 1} / {validImages.length}
          </div>

          {/* Zoom indicator */}
          {zoom > 1 && (
            <div className="absolute bottom-20 sm:bottom-4 left-4 sm:left-6 bg-black/80 text-white text-sm px-3 py-2 rounded-lg select-none z-[1000001]">
              Zoom: {Math.round(zoom * 100)}%
            </div>
          )}

          {/* Instructions - Hidden on small screens */}
          <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 bg-black/80 text-white text-xs px-3 py-2 rounded-lg select-none z-[1000001] hidden sm:block">
            <div>ESC to exit • Scroll to zoom • Drag to pan</div>
          </div>

          {/* Mobile instructions */}
          <div className="absolute bottom-4 right-4 bg-black/80 text-white text-xs px-3 py-2 rounded-lg select-none z-[1000001] sm:hidden">
            <div>Pinch to zoom • Drag to pan</div>
          </div>

          {/* Dots indicator in fullscreen - Mobile optimized */}
          {validImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 sm:space-x-3 z-[1000001]">
              {validImages.map((_, index) => (
                <button
                  key={index}
                  className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full transition-all duration-300 touch-manipulation min-w-[24px] min-h-[24px] flex items-center justify-center ${
                    index === currentIndex ? "bg-white scale-110 shadow-lg" : "bg-white/50 hover:bg-white/70 scale-100"
                  }`}
                  onClick={() => setCurrentIndex(index)}
                  aria-label={`Go to image ${index + 1}`}
                >
                  <span
                    className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${
                      index === currentIndex ? "bg-white" : "bg-white/50"
                    }`}
                  />
                </button>
              ))}
            </div>
          )}

          {/* Zoom reset button for mobile */}
          {zoom > 1 && (
            <button
              className="absolute bottom-20 right-4 sm:hidden bg-black/80 text-white text-xs px-3 py-2 rounded-lg select-none z-[1000001] touch-manipulation"
              onClick={() => {
                setZoom(1)
                setOffset({ x: 0, y: 0 })
              }}
            >
              Reset Zoom
            </button>
          )}
        </div>

        {/* Backdrop click handler - separate invisible div */}
        <div className="absolute inset-0 -z-10" onClick={exitFullscreen} onTouchEnd={exitFullscreen} />
      </div>,
      document.body,
    )
  }

  // Add pinch-to-zoom support for mobile
  useEffect(() => {
    if (!fullscreen) return

    let initialDistance = 0
    let initialZoom = 1

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault()
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        initialDistance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY)
        initialZoom = zoom
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault()
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        const currentDistance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY)
        const scale = currentDistance / initialDistance
        setZoom(Math.max(1, Math.min(5, initialZoom * scale)))
      }
    }

    document.addEventListener("touchstart", handleTouchStart, { passive: false })
    document.addEventListener("touchmove", handleTouchMove, { passive: false })

    return () => {
      document.removeEventListener("touchstart", handleTouchStart)
      document.removeEventListener("touchmove", handleTouchMove)
    }
  }, [fullscreen, zoom])

  return (
    <>
      <FullscreenModal />
      <div
        className={`relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Loading state */}
        {!imageLoaded[currentIndex] && currentIndex < validImages.length && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
          </div>
        )}

        {/* Main image */}
        <div className="relative w-full h-full">
          <Image
            src={imageUrl || "/placeholder.svg"}
            alt={`${productName} - Image ${currentIndex + 1}`}
            fill
            className="object-cover transition-all duration-500 ease-in-out"
            style={{ zIndex: 2 }}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={() => handleImageError(currentIndex)}
            onLoad={() => handleImageLoad(currentIndex)}
            priority={currentIndex === 0}
            unoptimized={imageUrl.startsWith("http")}
            draggable={false}
          />
        </div>

        {/* Fullscreen toggle button */}
        {allowFullscreen && (
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-2 right-2 z-30 bg-white/80 dark:bg-[#222] text-black dark:text-white hover:bg-white dark:hover:bg-[#333]"
            onClick={handleToggleFullscreen}
            title={fullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {fullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </Button>
        )}

        {/* Hover overlay for smooth transition effect */}
        {onHover && validImages.length > 1 && (
          <div
            className={`absolute inset-0 transition-all duration-300 ${
              isHovered ? "bg-black/5" : "bg-transparent"
            } pointer-events-none`}
          />
        )}

        {/* Navigation Controls */}
        {showControls && validImages.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-[#222] text-black dark:text-white hover:bg-[#F3C998] hover:text-black focus:bg-[#F3C998] focus:text-black shadow-lg transition-all duration-200 z-20"
              onClick={prevImage}
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-[#222] text-black dark:text-white hover:bg-[#F3C998] hover:text-black focus:bg-[#F3C998] focus:text-black shadow-lg transition-all duration-200 z-20"
              onClick={nextImage}
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
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
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        )}

        {/* Image counter */}
        {validImages.length > 1 && (
          <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full z-20">
            {currentIndex + 1}/{validImages.length}
          </div>
        )}
      </div>
    </>
  )
}
