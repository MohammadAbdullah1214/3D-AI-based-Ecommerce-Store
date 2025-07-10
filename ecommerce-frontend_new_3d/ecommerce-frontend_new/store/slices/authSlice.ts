import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { User } from "../../app/types/auth"
import { clearCart } from "./cartSlice"

export interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

// Initialize state from localStorage if available
const getInitialState = (): AuthState => {
  if (typeof window === "undefined") {
    return {
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    }
  }

  const token = localStorage.getItem("token")
  const refreshToken = localStorage.getItem("refreshToken")

  return {
    user: null, // We'll fetch user data separately
    accessToken: token,
    refreshToken: refreshToken,
    isAuthenticated: !!token,
    isLoading: false,
    error: null,
  }
}

export const authSlice = createSlice({
  name: "auth",
  initialState: getInitialState(),
  reducers: {
    loginStart: (state) => {
      state.isLoading = true
      state.error = null
    },
    loginSuccess: (state, action: PayloadAction<{ user: User; access: string; refresh: string }>) => {
      state.isLoading = false
      state.isAuthenticated = true
      state.user = action.payload.user
      state.accessToken = action.payload.access
      state.refreshToken = action.payload.refresh
      state.error = null
      // Store tokens in localStorage and sessionStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', action.payload.access)
        localStorage.setItem('refreshToken', action.payload.refresh)
        sessionStorage.setItem('token', action.payload.access)
        sessionStorage.setItem('refreshToken', action.payload.refresh)
        console.log('Auth: loginSuccess - tokens set in storage', action.payload.user)
      }
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false
      state.error = action.payload
    },
    logout: (state) => {
      state.user = null
      state.accessToken = null
      state.refreshToken = null
      state.isAuthenticated = false
      // Remove tokens from localStorage and sessionStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        sessionStorage.removeItem('token')
        sessionStorage.removeItem('refreshToken')
        console.log('Auth: logout - tokens removed from storage')
      }
      // Clear cart and wishlist state on logout
      // This requires dispatch, so do this in a thunk or in the logout handler in your component
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload
      state.isAuthenticated = !!action.payload
    },
    refreshToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload
    },
  },
})

// Export the actions directly from the slice
export const { loginStart, loginSuccess, loginFailure, logout, updateUser, refreshToken } = authSlice.actions

// Export the reducer as default
export default authSlice.reducer
