"use client"

import type React from "react"

import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useGetMeQuery, useRefreshTokenMutation } from "@/store/services/authApi"
import { authSlice } from "@/store/slices/authSlice"
import type { RootState } from "@/store"

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch()
  const { isAuthenticated, refreshToken } = useSelector((state: RootState) => state.auth)
  const { data: userData, error } = useGetMeQuery(undefined, { skip: !isAuthenticated })
  const [refreshTokenMutation] = useRefreshTokenMutation()

  // Update user data when fetched
  useEffect(() => {
    if (userData) {
      dispatch(authSlice.actions.updateUser(userData))
    }
  }, [userData, dispatch])

  // Handle authentication errors
  useEffect(() => {
    if (error && "status" in error && error.status === 401 && refreshToken) {
      // Try to refresh the token
      refreshTokenMutation({ refresh: refreshToken })
        .unwrap()
        .then((result) => {
          dispatch(authSlice.actions.refreshToken(result.access))
          localStorage.setItem("token", result.access)
        })
        .catch(() => {
          // If refresh fails, log out
          dispatch(authSlice.actions.logout())
          localStorage.removeItem("token")
          localStorage.removeItem("refreshToken")
        })
    }
  }, [error, refreshToken, refreshTokenMutation, dispatch])

  return <>{children}</>
}
