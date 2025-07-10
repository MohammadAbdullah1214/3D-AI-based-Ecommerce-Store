export interface User {
  id: number
  username: string
  email: string
  first_name?: string
  last_name?: string
  role: UserRole
  is_active: boolean
  date_joined: string
  last_login?: string
  joining_date?: string
  profile?: UserProfile
}

export type UserRole = "customer" | "seller" | "admin"

export interface UserProfile {
  id: number
  user: number
  avatar?: string
  bio?: string
  phone_number?: string
  address?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
}

export interface UserFilters {
  role?: UserRole
  search?: string
  page?: number
  page_size?: number
}

export interface UserListResponse {
  count: number
  next: string | null
  previous: string | null
  results: User[]
}
