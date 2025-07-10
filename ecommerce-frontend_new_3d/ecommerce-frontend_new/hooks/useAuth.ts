"use client"

import { useState } from "react"
import { useDispatch } from "react-redux"
import {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetMeQuery,
  type RegisterRequest,
} from "../store/services/authApi"
import { loginSuccess, logout as logoutAction } from "../store/slices/authSlice"

export function useAuth() {
  const dispatch = useDispatch()
  const [error, setError] = useState<string | null>(null)

  const [loginMutation] = useLoginMutation()
  const [registerMutation] = useRegisterMutation()
  const [logoutMutation] = useLogoutMutation()

  const { data: currentUser, isLoading: isLoadingUser } = useGetMeQuery(undefined, {
    skip: typeof window !== "undefined" && !localStorage.getItem("accessToken"),
  })

  const login = async (username: string, password: string) => {
    try {
      setError(null)
      const result = await loginMutation({ username, password }).unwrap()

      // Save tokens to localStorage
      localStorage.setItem("accessToken", result.access)
      localStorage.setItem("refreshToken", result.refresh)

      // Update Redux state
      dispatch(
        loginSuccess({
          user: result.user,
          access: result.access,
          refresh: result.refresh,
        }),
      )

      return result
    } catch (err: any) {
      setError(err.data?.detail || "Login failed. Please check your credentials.")
      throw err
    }
  }

  const register = async (userData: RegisterRequest) => {
    try {
      setError(null)
      const result = await registerMutation(userData).unwrap()

      // Save tokens to localStorage
      localStorage.setItem("accessToken", result.access)
      localStorage.setItem("refreshToken", result.refresh)

      // Update Redux state
      dispatch(
        loginSuccess({
          user: result.user,
          access: result.access,
          refresh: result.refresh,
        }),
      )

      return result
    } catch (err: any) {
      setError(err.data?.detail || "Registration failed. Please try again.")
      throw err
    }
  }

  const logout = async () => {
    try {
      // Call logout endpoint
      await logoutMutation().unwrap()
    } catch (err) {
      console.error("Logout API call failed:", err)
    } finally {
      // Clear tokens from localStorage
      localStorage.removeItem("accessToken")
      localStorage.removeItem("refreshToken")

      // Clear Redux state
      dispatch(logoutAction())
    }
  }

  return {
    login,
    register,
    logout,
    currentUser,
    isLoadingUser,
    error,
  }
}
