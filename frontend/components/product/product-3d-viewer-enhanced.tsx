"use client"

import dynamic from "next/dynamic"
import { useState } from "react"

// Dynamically import the 3D viewer to avoid SSR issues
const Simple3DViewer = dynamic(() => import("./simple-3d-viewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2 mx-auto"></div>
        <div className="text-sm text-gray-600">Loading 3D Viewer...</div>
      </div>
    </div>
  ),
})

interface Product3DViewerEnhancedProps {
  modelUrl?: string
  productName?: string
  isDefault?: boolean
  width?: number
  height?: number
  className?: string
  showControls?: boolean
  showARButton?: boolean
}

export default function Product3DViewerEnhanced({
  modelUrl = "/assets/3d/shirt.glb",
  productName = "Featured Shirt",
  isDefault = false,
  width = 500,
  height = 500,
  className = "w-full h-full",
  showControls = true,
  showARButton = false,
}: Product3DViewerEnhancedProps) {
  const [error, setError] = useState(false)

  // Determine which model to use
  const finalModelUrl = modelUrl || "/assets/3d/duck.glb"
  const isUsingDefault = !modelUrl || modelUrl.includes("duck.glb")

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center p-8">
          <div className="text-4xl mb-4">⚠️</div>
          <div className="text-lg font-semibold text-gray-700 mb-2">3D Viewer Unavailable</div>
          <div className="text-sm text-gray-500 mb-4">Using fallback display</div>
          <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg mx-auto flex items-center justify-center">
            <div className="text-white text-lg font-bold">SHIRT</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden">
        <Simple3DViewer
          modelUrl={finalModelUrl}
          isDefault={isUsingDefault}
          productName={productName}
          width={width}
          height={height}
          showControls={showControls}
          showARButton={showARButton}
        />
      </div>
    </div>
  )
}
