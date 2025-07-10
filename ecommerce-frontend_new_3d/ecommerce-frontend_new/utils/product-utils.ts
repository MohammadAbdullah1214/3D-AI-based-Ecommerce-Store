import type { Product, ProductImage, ProductMedia } from "@/app/types/product"

/**
 * Gets a valid image URL from a product media object or returns a fallback
 * @param url The image URL
 * @param fallbackText Product name for the fallback image
 * @returns A valid image URL
 */
export function getValidImageUrl(url?: string, fallbackText?: string): string {
  if (url && url.startsWith("http")) {
    return url
  }

  if (url && (url.startsWith("/") || url.startsWith("data:"))) {
    return url
  }

  // Fallback to a placeholder
  const placeholderText = fallbackText ? encodeURIComponent(fallbackText) : "product"
  return `/placeholder.svg?height=400&width=400&text=${placeholderText}`
}

/**
 * Gets the first media of a specific type from a product
 * @param product The product object
 * @param type The media type to filter by (image, model_3d, video)
 * @returns The first media object of the specified type, or null if none found
 */
export function getFirstMediaOfType(product: Product, type = "image"): ProductImage | ProductMedia | null {
  // Check media array first
  if (product?.media && Array.isArray(product.media) && product.media.length > 0) {
    const media = product.media.find((m) => m.file_type === type)
    if (media) return media
  }

  // Then check images array
  if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
    const image = product.images.find((img) => img.file_type === type || (!img.file_type && type === "image"))
    if (image) return image
  }

  return null
}

/**
 * Checks if a product has media of a specific type
 * @param product The product object
 * @param type The media type to check for
 * @returns True if the product has media of the specified type
 */
export function hasMediaType(product: Product, type: string): boolean {
  // Check media array first
  if (product?.media && Array.isArray(product.media)) {
    if (product.media.some((m) => m.file_type === type)) return true
  }

  // Then check images array
  if (product?.images && Array.isArray(product.images)) {
    if (product.images.some((img) => img.file_type === type || (!img.file_type && type === "image"))) return true
  }

  return false
}

/**
 * Type guard to check if media is ProductMedia
 */
function isProductMedia(media: ProductImage | ProductMedia): media is ProductMedia {
  return "url" in media
}

/**
 * Type guard to check if media is ProductImage
 */
function isProductImage(media: ProductImage | ProductMedia): media is ProductImage {
  return "image" in media || "image_url" in media
}

/**
 * Get image URL from ProductMedia or ProductImage with extensive fallback handling
 */
export function getMediaUrl(media: ProductMedia | ProductImage | null | undefined): string {
  if (!media) {
    console.log("getMediaUrl: No media provided")
    return "/placeholder.svg?height=400&width=400"
  }

  console.log("getMediaUrl: Processing media:", media)

  let possibleUrls: (string | undefined)[] = []

  // Handle ProductMedia type
  if (isProductMedia(media)) {
    possibleUrls = [media.url, media.file_url, media.image_url, media.file]
  }
  // Handle ProductImage type
  else if (isProductImage(media)) {
    possibleUrls = [media.image_url, media.file_url, media.image, media.file]
  }
  // Fallback for any other structure
  else {
    possibleUrls = [
      (media as any).url,
      (media as any).file_url,
      (media as any).image_url,
      (media as any).image,
      (media as any).file,
    ]
  }

  // Filter out undefined values
  const validUrls = possibleUrls.filter((url): url is string => Boolean(url))

  console.log("getMediaUrl: Possible URLs:", validUrls)

  for (const url of validUrls) {
    if (url && typeof url === "string") {
      // Check if it's a valid HTTP URL
      if (url.startsWith("http://") || url.startsWith("https://")) {
        console.log("getMediaUrl: Using HTTP URL:", url)
        return url
      }
      // Check if it's a valid relative path
      if (url.startsWith("/")) {
        console.log("getMediaUrl: Using relative URL:", url)
        // Apply backend URL logic for /media/ paths
        if (url.startsWith('/media/')) {
          const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
          return `${BACKEND_URL}${url}`;
        }
        return url
      }
      // Check if it's a data URL
      if (url.startsWith("data:")) {
        console.log("getMediaUrl: Using data URL")
        return url
      }
    }
  }

  // Fallback
  console.log("getMediaUrl: Using fallback placeholder")
  return "/placeholder.svg?height=400&width=400"
}

/**
 * Convert ProductImage to ProductMedia format
 */
export function convertImageToMedia(image: ProductImage): ProductMedia {
  const converted: ProductMedia = {
    id: image.id,
    product_id: image.product_id,
    product: image.product,
    file_type: (image.file_type as "image" | "video" | "model_3d") || "image",
    url: image.image_url || image.file_url || image.image || image.file || "",
    file_url: image.file_url || image.image_url || image.file || image.image || "",
    image_url: image.image_url || image.file_url || image.image || image.file || "",
    file: image.file || image.image || "",
    is_primary: image.is_primary,
    sort_order: image.sort_order,
    created_at: image.created_at,
    updated_at: image.updated_at,
  }

  console.log("convertImageToMedia: Converted image:", image, "to media:", converted)
  return converted
}

/**
 * Get product price (with discount if available)
 */
export function getProductPrice(product: Product): number {
  if (product.discount_price && Number(product.discount_price) > 0) {
    return typeof product.discount_price === "number"
      ? product.discount_price
      : Number.parseFloat(String(product.discount_price))
  }

  if (product.discount_percent && product.discount_percent > 0) {
    const price = typeof product.price === "number" ? product.price : Number.parseFloat(String(product.price))
    return price - (price * product.discount_percent) / 100
  }

  return typeof product.price === "number" ? product.price : Number.parseFloat(String(product.price))
}

/**
 * Get product stock quantity
 */
export function getProductStock(product: Product): number {
  return product.stock_quantity || product.stock || 0
}

/**
 * Debug function to log product media structure
 */
export function debugProductMedia(product: Product): void {
  console.log("=== PRODUCT MEDIA DEBUG ===")
  console.log("Product ID:", product.id)
  console.log("Product Name:", product.name)

  if (product.images) {
    console.log("Images array:", product.images.length, "items")
    product.images.forEach((img, i) => {
      console.log(`Image ${i}:`, {
        id: img.id,
        file_type: img.file_type,
        file: img.file,
        file_url: img.file_url,
        image: img.image,
        image_url: img.image_url,
        url: getMediaUrl(img),
      })
    })
  } else {
    console.log("No images array")
  }

  if (product.media) {
    console.log("Media array:", product.media.length, "items")
    product.media.forEach((m, i) => {
      console.log(`Media ${i}:`, {
        id: m.id,
        file_type: m.file_type,
        url: m.url,
        file: m.file,
        file_url: m.file_url,
        image_url: m.image_url,
        resolved_url: getMediaUrl(m),
      })
    })
  } else {
    console.log("No media array")
  }
  console.log("=== END DEBUG ===")
}

export function getBackendMediaUrl(url?: string): string {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
  
  if (url.startsWith('/media/')) {
    return `${BACKEND_URL}${url}`;
  }
  
  const MEDIA_URL = process.env.NEXT_PUBLIC_MEDIA_URL || '/'
  if (url.startsWith('/')) {
    return MEDIA_URL.replace(/\/$/, '') + url
  }
  return MEDIA_URL.replace(/\/$/, '') + '/' + url.replace(/^\//, '')
}
