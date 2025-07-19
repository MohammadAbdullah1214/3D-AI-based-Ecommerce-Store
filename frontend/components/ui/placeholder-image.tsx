"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

interface PlaceholderImageProps {
  width: number
  height: number
  alt: string
  className?: string
}

export function PlaceholderImage({ width, height, alt, className }: PlaceholderImageProps) {
  const [src, setSrc] = useState(`/placeholder.svg?width=${width}&height=${height}`)

  useEffect(() => {
    // Update the src when width or height changes
    setSrc(`/placeholder.svg?width=${width}&height=${height}`)
  }, [width, height])

  return <Image src={src || "/placeholder.svg"} width={width} height={height} alt={alt} className={className} />
}
