export interface User {
  id: number
  username: string
  email: string
  first_name?: string
  last_name?: string
  role: UserRole
  is_active: boolean
  date_joined: string
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

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  user: User
  access: string
  refresh: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  role?: "customer" | "seller"
}

export interface RefreshTokenRequest {
  refresh: string
}

export interface RefreshTokenResponse {
  access: string
}
