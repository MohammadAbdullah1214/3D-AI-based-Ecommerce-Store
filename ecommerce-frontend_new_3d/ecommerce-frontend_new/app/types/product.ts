export interface Product {
  id: number
  name: string
  description?: string
  price: number
  discount_price?: number | null
  discount_percent?: number
  category?: Category
  category_id?: number
  category_name?: string
  seller_id?: number
  seller?: number
  seller_username?: string
  seller_name?: string // Added for UI compatibility
  stock?: number // Keep both for backward compatibility
  stock_quantity?: number
  images?: ProductImage[]
  image_urls?: string[] // Deprecated, use images
  image_ids?: number[] // Deprecated, use images
  media?: ProductMedia[]
  created_at?: string
  updated_at?: string
  is_featured?: boolean
  is_published?: boolean
  has_3d_model?: boolean
  model_url?: string
  average_rating?: number | string
  rating_count?: number
  review_count?: number
  tags?: string[]
  variants?: ProductVariant[]
  specifications?: ProductSpecification[]
  reviews?: ProductReview[]
  related_products?: Product[]
  "3d_generation_status"?: GenerationStatus
  // Added for UI compatibility
  status?: "draft" | "active" | "inactive"
  is_active?: boolean
  weight?: number | null
  length?: number | null
  width?: number | null
  height?: number | null
  category_details?: Category // For UI compatibility
}

export interface ProductImage {
  id: number
  product_id?: number
  product?: number
  image_url?: string
  file_url?: string
  image?: string
  file?: string // Add for backward compatibility
  file_type?: string // Add for backward compatibility
  url?: string // For UI compatibility
  is_primary?: boolean
  sort_order?: number
  created_at?: string
  updated_at?: string
}

export interface ProductMedia {
  id: number
  product_id?: number
  product?: number
  file_type: "image" | "video" | "model_3d" | "model"
  url?: string
  file?: string
  file_url?: string
  image_url?: string
  thumbnail_url?: string
  is_primary?: boolean
  sort_order?: number
  metadata?: Record<string, any>
  created_at?: string
  updated_at?: string
  angle?: string
}

export interface Category {
  id: number
  name: string
  description?: string
  parent_id?: number
  image_url?: string
  is_active?: boolean
  created_at?: string
  updated_at?: string
  subcategories?: Category[]
}

export interface ProductVariant {
  id: number
  product_id: number
  name: string
  price: number
  stock_quantity: number
  options: ProductVariantOption[]
  images?: ProductImage[]
  price_adjustment?: number // For UI compatibility
  created_at?: string
  updated_at?: string
}

export interface ProductVariantOption {
  option_name: string
  option_value: string
  value?: string // For UI compatibility
}

export interface ProductSpecification {
  name: string
  value: string
}

export interface ProductReview {
  id: number
  product: number
  user: number
  user_id?: number
  rating: number
  comment: string
  created_at: string
  updated_at?: string
  helpful_count?: number
  images?: string[]
}

export interface ProductFilterOptions {
  categories?: number[]
  minPrice?: number
  maxPrice?: number
  rating?: number
  sortBy?: "price_asc" | "price_desc" | "newest" | "popular"
  search?: string
  page?: number
  limit?: number
  has3dModel?: boolean
  tags?: string[]
}

export interface ProductListResponse {
  products: Product[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface User {
  id: number
  name: string
  email: string
  email_verified_at: string
  created_at: string
  updated_at: string
}

export interface ProductFormData {
  name: string
  description: string
  price: number
  discount_price?: number
  stock: number
  category: string
  mediaFiles?: Array<{
    file: File
    fileType: "image" | "model_3d" | "video"
  }>
}

export interface GenerationStatus {
  has_generation: boolean
  status: "pending" | "processing" | "completed" | "failed" | "cancelled"
  progress: number
  message: string
  request_id: string
  created_at: string
  completed_at: string | null
  has_3d_model: boolean
}

export interface WishlistItem {
  id: number;
  product: Product;
  product_id: number;
  variant_id?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface WishlistResponse {
  items: WishlistItem[];
  total: number;
}
