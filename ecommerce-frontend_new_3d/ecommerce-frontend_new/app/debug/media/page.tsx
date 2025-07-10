"use client"

import { MediaDebug } from "@/components/debug/media-debug"
import { MediaUpload } from "@/components/product/media-upload"

export default function MediaDebugPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Media Upload Debug</h1>
      <div className="max-w-4xl">
        <MediaUpload
          productId={1} // Test with product ID 1
          onUpload={(files) => {
            console.log("Debug: MediaUpload onUpload called with files:", files)
          }}
          onClear={() => {
            console.log("Debug: MediaUpload cleared")
          }}
        />
      </div>
    </div>
  )
}
