"use client"

import { useSelector } from "react-redux"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react"
import type { RootState } from "@/store"

export function AuthDebug() {
  const auth = useSelector((state: RootState) => state.auth)
  const localToken = typeof window !== "undefined" ? localStorage.getItem("token") : null
  const localRefreshToken = typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null

  const testAuth = () => {
    console.log("=== AUTH DEBUG INFO ===")
    console.log("Redux Auth State:", auth)
    console.log("localStorage token:", localToken ? "EXISTS" : "MISSING")
    console.log("localStorage refreshToken:", localRefreshToken ? "EXISTS" : "MISSING")
    console.log("Token preview:", auth.accessToken ? `${auth.accessToken.substring(0, 20)}...` : "None")
    console.log("=======================")
  }

  const testApiCall = async () => {
    if (!auth.accessToken && !localToken) {
      alert("No token available for testing")
      return
    }

    const token = auth.accessToken || localToken
    console.log("Testing API call with token:", token?.substring(0, 20) + "...")

    try {
      const response = await fetch("http://127.0.0.1:8000/api/users/me/", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      console.log("API Test Response Status:", response.status)
      console.log("API Test Response Headers:", Object.fromEntries(response.headers.entries()))

      if (response.ok) {
        const data = await response.json()
        console.log("API Test Success:", data)
        alert("✅ API call successful! Token is working.")
      } else {
        const errorText = await response.text()
        console.log("API Test Error:", errorText)
        alert(`❌ API call failed: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error("API Test Exception:", error)
      alert(`❌ API call exception: ${error}`)
    }
  }

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-800">
          <AlertCircle className="h-5 w-5" />
          Authentication Debug
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p><strong>Redux State:</strong></p>
            <p>isAuthenticated: <Badge variant={auth.isAuthenticated ? "default" : "destructive"}>{String(auth.isAuthenticated)}</Badge></p>
            <p>hasAccessToken: <Badge variant={auth.accessToken ? "default" : "destructive"}>{String(!!auth.accessToken)}</Badge></p>
            <p>hasRefreshToken: <Badge variant={auth.refreshToken ? "default" : "destructive"}>{String(!!auth.refreshToken)}</Badge></p>
          </div>
          <div>
            <p><strong>localStorage:</strong></p>
            <p>hasToken: <Badge variant={localToken ? "default" : "destructive"}>{String(!!localToken)}</Badge></p>
            <p>hasRefreshToken: <Badge variant={localRefreshToken ? "default" : "destructive"}>{String(!!localRefreshToken)}</Badge></p>
          </div>
        </div>

        {auth.accessToken && (
          <div className="text-xs bg-white p-2 rounded border">
            <p><strong>Token Preview:</strong></p>
            <p className="font-mono break-all">{auth.accessToken.substring(0, 50)}...</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button size="sm" onClick={testAuth} variant="outline">
            <RefreshCw className="h-4 w-4 mr-1" />
            Log to Console
          </Button>
          <Button 
            size="sm" 
            onClick={testApiCall}
            variant="outline"
          >
            Test API Call
          </Button>
          <Button 
            size="sm" 
            onClick={() => window.location.href = "/login"}
            variant="outline"
          >
            Go to Login
          </Button>
        </div>

        {!auth.isAuthenticated && (
          <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-100 p-2 rounded">
            <AlertCircle className="h-4 w-4" />
            <span>User is not authenticated. This is why you're getting 401 errors.</span>
          </div>
        )}

        {auth.isAuthenticated && !auth.accessToken && (
          <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-100 p-2 rounded">
            <AlertCircle className="h-4 w-4" />
            <span>User is authenticated but no access token found in Redux state.</span>
          </div>
        )}

        {auth.isAuthenticated && auth.accessToken && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-100 p-2 rounded">
            <CheckCircle className="h-4 w-4" />
            <span>Authentication appears to be working correctly.</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 