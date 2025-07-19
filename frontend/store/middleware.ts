import { isRejectedWithValue } from "@reduxjs/toolkit"
import type { Middleware } from "@reduxjs/toolkit"

/**
 * Log a warning and show a toast when RTK Query API call fails
 */
export const rtkQueryErrorLogger: Middleware = () => (next) => (action) => {
  // RTK Query uses `createAsyncThunk` from redux-toolkit under the hood, so we're able to utilize these matchers
  if (isRejectedWithValue(action)) {
    // Basic error logging that won't throw additional errors
    console.log("API Error:", action.type)

    // Only log detailed information if it exists
    if (action.payload) {
      console.log("Error details:", action.payload)
    }

    if (action.error) {
      console.log("Error name:", action.error.name || "Unknown")
      console.log("Error message:", action.error.message || "No message available")
    }

    // Log the endpoint that was called if available
    if (action.meta?.arg?.endpointName) {
      console.log("Failed endpoint:", action.meta.arg.endpointName)
    }

    // Log the original URL if available
    if (action.meta?.baseQueryMeta?.request?.url) {
      console.log("Request URL:", action.meta.baseQueryMeta.request.url)
    }
  }

  return next(action)
}
