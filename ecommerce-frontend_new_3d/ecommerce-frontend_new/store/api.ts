import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import type { RootState } from "./index"

// Update the base URL to point to your Django backend
const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/"

// Find the line where the main api is created and ensure it has a unique reducerPath
export const api = createApi({
  reducerPath: "api", // Make sure this is unique
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers, { getState, endpoint }) => {
      // Get the token from the auth state
      const token = (getState() as RootState).auth.accessToken

      // If we have a token, add it to the headers
      if (token) {
        headers.set("authorization", `Bearer ${token}`)
        console.log("Using token from Redux state for API request:", endpoint)
      } else {
        // Fallback to localStorage if not in Redux state
        const localToken = typeof window !== "undefined" ? localStorage.getItem("token") : null
        if (localToken) {
          headers.set("authorization", `Bearer ${localToken}`)
          console.log("Using token from localStorage for API request:", endpoint)
        } else {
          console.log("No authentication token available for API request:", endpoint)
        }
      }

      // Add CORS headers
      headers.set("Accept", "application/json")
      
      return headers
    },
    fetchFn: async (input, init) => {
      // Log the request for debugging
      console.log("API Request:", typeof input === 'string' ? input : input.url, init?.method || 'GET');
      
      try {
        const response = await fetch(input, init);
        
        // Log the response status
        console.log("API Response Status:", response.status);
        
        // Clone the response to inspect its body without consuming it
        const clonedResponse = response.clone();
        
        try {
          // Try to parse the response as JSON for logging
          const data = await clonedResponse.json();
          console.log("API Response Data:", data);
        } catch (e) {
          // If it's not JSON, log that information
          console.log("API Response is not JSON");
        }
        
        return response;
      } catch (error) {
        console.error("API Fetch Error:", error);
        throw error;
      }
    },
    credentials: "include", // Include credentials in all requests
  }),
  tagTypes: ["Product", "Cart", "User", "Order", "Analytics", "Admin", "Category", "Review", "Auth", "Users", "Media", "GenerationStatus"],
  endpoints: () => ({}),
})
