import { configureStore } from "@reduxjs/toolkit"
import { setupListeners } from "@reduxjs/toolkit/query"
import { api } from "./api"
import { adminApi } from "./services/adminApi"
import { rtkQueryErrorLogger } from "./middleware"
import authReducer from "./slices/authSlice"
import cartReducer from "./slices/cartSlice"
import uiReducer from "./slices/uiSlice"
import { chatbotApi } from './services/chatbotApi';
import { wishlistApi } from "./services/wishlistApi";


export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    [adminApi.reducerPath]: adminApi.reducer,
    [chatbotApi.reducerPath]: chatbotApi.reducer,
    [wishlistApi.reducerPath]: wishlistApi.reducer,
    auth: authReducer,
    cart: cartReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE", "persist/REGISTER"],
      },
    }).concat(api.middleware, adminApi.middleware, rtkQueryErrorLogger, chatbotApi.middleware, wishlistApi.middleware),
  devTools: process.env.NODE_ENV !== "production",
})

setupListeners(store.dispatch)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
