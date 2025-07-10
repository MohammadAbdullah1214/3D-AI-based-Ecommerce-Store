"use client"

import { useGetAllMediaQuery } from "@/store/services/mediaApi"

export function MediaDebug() {
  const { data: allMedia, isLoading, error } = useGetAllMediaQuery()

  console.log("MediaDebug - API Response:", {
    data: allMedia,
    isLoading,
    error,
  })

  if (isLoading) return <div>Loading media...</div>
  if (error) return <div>Error loading media: {JSON.stringify(error)}</div>

  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold mb-2">Media Debug</h3>
      <p>Total media items: {allMedia?.length || 0}</p>
      {allMedia?.map((media) => (
        <div key={media.id} className="mb-2 p-2 bg-gray-100 rounded">
          <p>ID: {media.id}</p>
          <p>Product: {media.product}</p>
          <p>File: {media.file}</p>
          <p>Type: {media.file_type}</p>
          <img src={media.file || "/placeholder.svg"} alt="Product" className="w-20 h-20 object-cover mt-1" />
        </div>
      ))}
    </div>
  )
}
