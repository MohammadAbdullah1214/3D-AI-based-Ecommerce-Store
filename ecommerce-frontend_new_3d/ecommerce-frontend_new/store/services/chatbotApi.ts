import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"

export interface ProductRecommendation {
  id: number
  product: number
  product_details: {
    id: number
    name: string
    description: string
    price: string | number
    discount_price?: string | number | null
    stock: number
    is_active: boolean
    status: string
    created_at: string
    updated_at: string
    category?: number | null
    category_details?: {
      id: number
      name: string
      description: string
      parent?: number | null
      full_path: string
      image?: string | null
    } | null
    seller: number
    seller_name: string
    weight?: string
    length?: string
    width?: string
    height?: string
    dimensions?: {
      length: number
      width: number
      height: number
    } | null
    images?: Array<{
      file_url: string
    }>
  }
  recommendation_score: number
  recommendation_type: string
  reason: string
  was_clicked: boolean
  was_added_to_cart: boolean
  was_purchased: boolean
  shown_at: string
}

export interface ChatResponse {
  session_id: string
  bot_response: string
  recommendations: ProductRecommendation[]
  intent_detected: string
  confidence_score: number
  behavioral_insights: Record<string, any>
  session_context?: {
    last_intent: string
    last_categories: string[]
    last_brands: string[]
    products_shown: number
  }
}

export interface ChatRequest {
  session_id?: string
  user_message: string
}

export interface TrackInteractionRequest {
  recommendation_id: number
  action: "click" | "add_to_cart" | "purchase"
}

export interface EndSessionRequest {
  session_id: string
}

export interface BehaviorTrackingRequest {
  session_id: string
  action: "view_product" | "add_to_cart" | "remove_from_cart" | "search" | "category_browse" | "price_filter"
  data: {
    product_id?: number
    category_id?: number
    search_query?: string
    price_range?: [number, number]
    [key: string]: any
  }
}

export interface RealTimeRecommendationsRequest {
  session_id: string
  product_id?: number
  seconds_elapsed?: number
}

export interface UserProfileResponse {
  user_type: string
  confidence_level: number
  personalization_score: number
  preferences: {
    categories: string[]
    brands: string[]
    price_range: [number, number]
    activity_level: string
  }
  recent_activity: Array<{
    action: string
    timestamp: string
    product_id?: number
  }>
}

const baseQuery = fetchBaseQuery({
  baseUrl: `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/chatbot/`,
  prepareHeaders: (headers) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token")
      if (token) {
        headers.set("authorization", `Bearer ${token}`)
      }
    }
    headers.set("content-type", "application/json")
    return headers
  },
})

export const chatbotApi = createApi({
  reducerPath: "chatbotApi",
  baseQuery,
  tagTypes: ["Chat", "Recommendations", "UserProfile", "Behavior"],
  keepUnusedDataFor: 0, // No caching to prevent keyword carryover
  endpoints: (builder) => ({
    sendMessage: builder.mutation<ChatResponse, ChatRequest>({
      query: (data) => ({
        url: "chat/chat/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Chat", "Recommendations"],
    }),
    
    trackInteraction: builder.mutation<{ success: boolean }, TrackInteractionRequest>({
      query: (data) => ({
        url: "chat/track_interaction/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Behavior"],
    }),
    
    trackBehavior: builder.mutation<{ success: boolean }, BehaviorTrackingRequest>({
      query: (data) => ({
        url: "chat/track_behavior/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Behavior", "UserProfile"],
    }),
    
    getRealTimeRecommendations: builder.query<{ recommendations: ProductRecommendation[] }, RealTimeRecommendationsRequest>({
      query: (params) => ({
        url: "chat/realtime_recommendations/",
        method: "GET",
        params,
      }),
      providesTags: ["Recommendations"],
    }),
    
    getActivityRecommendations: builder.query<{ recommendations: ProductRecommendation[] }, { session_id: string; seconds_elapsed: number }>({
      query: (params) => ({
        url: "chat/activity_recommendations/",
        method: "GET",
        params,
      }),
      providesTags: ["Recommendations"],
    }),
    
    getUserProfile: builder.query<UserProfileResponse, void>({
      query: () => ({
        url: "analytics/user_profile/",
        method: "GET",
      }),
      providesTags: ["UserProfile"],
    }),
    
    getRecommendationMetrics: builder.query<{
      total_recommendations: number
      clicked_recommendations: number
      conversion_rate: number
      top_categories: Array<{ category: string; count: number }>
      top_brands: Array<{ brand: string; count: number }>
    }, void>({
      query: () => ({
        url: "chat/recommendation_metrics/",
        method: "GET",
      }),
      providesTags: ["Behavior"],
    }),
    
    endSession: builder.mutation<{ success: boolean }, EndSessionRequest>({
      query: (data) => ({
        url: "chat/end_session/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Chat", "Behavior", "UserProfile"],
    }),
  }),
})

export const { 
  useSendMessageMutation, 
  useTrackInteractionMutation, 
  useTrackBehaviorMutation,
  useGetRealTimeRecommendationsQuery,
  useGetActivityRecommendationsQuery,
  useGetUserProfileQuery,
  useGetRecommendationMetricsQuery,
  useEndSessionMutation 
} = chatbotApi
