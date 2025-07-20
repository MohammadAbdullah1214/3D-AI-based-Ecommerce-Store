import { api } from "../api"
import type { ProductReview } from "@/app/types"

export interface ReviewRequest {
  product_id: number
  rating: number
  comment: string
  images?: string[]
}

export interface ReviewResponse {
  id: number
  product: number
  user: number
  user_username: string
  rating: number
  comment: string
  created_at: string
  updated_at?: string
  helpful_count?: number
  images?: string[]
}

export const reviewApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get reviews for a product
    getProductReviews: builder.query<ReviewResponse[], number>({
      query: (productId) => `products/${productId}/reviews/`,
      providesTags: (result, error, productId) => [
        { type: "Review", id: productId },
        ...(result?.map(({ id }) => ({ type: "Review" as const, id })) || []),
      ],
    }),

    // Add a review for a product
    addProductReview: builder.mutation<ReviewResponse, ReviewRequest>({
      query: (reviewData) => ({
        url: `products/${reviewData.product_id}/reviews/`,
        method: "POST",
        body: {
          rating: reviewData.rating,
          comment: reviewData.comment,
          images: reviewData.images,
        },
      }),
      invalidatesTags: (result, error, { product_id }) => [
        { type: "Review", id: product_id },
        { type: "Product", id: product_id },
      ],
    }),

    // Update a review
    updateProductReview: builder.mutation<ReviewResponse, { reviewId: number; data: Partial<ReviewRequest> }>({
      query: ({ reviewId, data }) => ({
        url: `reviews/${reviewId}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { reviewId }) => [
        { type: "Review", id: reviewId },
        { type: "Product", id: "LIST" },
      ],
    }),

    // Delete a review
    deleteProductReview: builder.mutation<void, number>({
      query: (reviewId) => ({
        url: `reviews/${reviewId}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, reviewId) => [
        { type: "Review", id: reviewId },
        { type: "Product", id: "LIST" },
      ],
    }),

    // Get user's reviews
    getUserReviews: builder.query<ReviewResponse[], void>({
      query: () => "reviews/my-reviews/",
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: "Review" as const, id })), { type: "Review", id: "USER" }]
          : [{ type: "Review", id: "USER" }],
    }),

    // Get recent reviews for homepage
    getRecentReviews: builder.query<ReviewResponse[], { limit?: number }>({
      query: ({ limit = 6 }) => `reviews/recent/?limit=${limit}`,
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: "Review" as const, id })), { type: "Review", id: "RECENT" }]
          : [{ type: "Review", id: "RECENT" }],
    }),

    // Mark review as helpful
    markReviewHelpful: builder.mutation<ReviewResponse, number>({
      query: (reviewId) => ({
        url: `reviews/${reviewId}/helpful/`,
        method: "POST",
      }),
      invalidatesTags: (result, error, reviewId) => [{ type: "Review", id: reviewId }],
    }),
  }),
})

export const {
  useGetProductReviewsQuery,
  useAddProductReviewMutation,
  useUpdateProductReviewMutation,
  useDeleteProductReviewMutation,
  useGetUserReviewsQuery,
  useGetRecentReviewsQuery,
  useMarkReviewHelpfulMutation,
} = reviewApi 