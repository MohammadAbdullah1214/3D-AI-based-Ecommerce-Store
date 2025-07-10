"use client"

import { useMemo } from "react"
import { useGetAllMediaQuery } from "@/store/services/mediaApi"

export function useProductMedia(productId: number) {
  const { data: allMedia = [], isLoading, error } = useGetAllMediaQuery()

  const productMedia = useMemo(() => {
    return allMedia.filter((media) => media.product === productId)
  }, [allMedia, productId])

  const mediaByType = useMemo(() => {
    const images = productMedia.filter((media) => media.file_type === "image")
    const models = productMedia.filter((media) => media.file_type === "model")
    const videos = productMedia.filter((media) => media.file_type === "video")

    return { images, models, videos, all: productMedia }
  }, [productMedia])

  return {
    media: mediaByType,
    isLoading,
    error,
    hasMedia: productMedia.length > 0,
    has3DModel: mediaByType.models.length > 0,
    hasImages: mediaByType.images.length > 0,
    hasVideos: mediaByType.videos.length > 0,
  }
}
