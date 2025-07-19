import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

// Define the type for the UI state
export interface UiState {
  sidebarOpen: boolean
  searchOpen: boolean // Added searchOpen property
  theme: "light" | "dark" | "system"
  notifications: Notification[]
}

// Define the type for a notification
export interface Notification {
  id: string
  type: "info" | "success" | "warning" | "error"
  message: string
  title?: string
  duration?: number
}

// Define the initial state
const initialState: UiState = {
  sidebarOpen: false,
  searchOpen: false, // Added initial value for searchOpen
  theme: "system",
  notifications: [],
}

// Create the UI slice
const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload
    },
    toggleSearch: (state) => {
      // Added toggleSearch action
      state.searchOpen = !state.searchOpen
    },
    setSearchOpen: (state, action: PayloadAction<boolean>) => {
      // Added setSearchOpen action
      state.searchOpen = action.payload
    },
    setTheme: (state, action: PayloadAction<"light" | "dark" | "system">) => {
      state.theme = action.payload

      // Also update localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("theme", action.payload)
      }
    },
    addNotification: (state, action: PayloadAction<Omit<Notification, "id">>) => {
      const id = Date.now().toString()
      state.notifications.push({ ...action.payload, id })
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter((notification) => notification.id !== action.payload)
    },
    clearNotifications: (state) => {
      state.notifications = []
    },
  },
})

// Export the actions
export const {
  toggleSidebar,
  setSidebarOpen,
  toggleSearch, // Export toggleSearch action
  setSearchOpen, // Export setSearchOpen action
  setTheme,
  addNotification,
  removeNotification,
  clearNotifications,
} = uiSlice.actions

// Export the reducer
export default uiSlice.reducer
