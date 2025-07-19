import { api } from "@/store/api"
import type { Product, Category, GenerationStatus, ProductReview, ProductMedia } from "@/app/types/product"

export { ProductMedia }

export const productApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<Product[], any>({
      query: (filters) => {
        if (filters) {
          const params = new URLSearchParams()
          
          // Category filter
          if (filters.category) params.append("category", filters.category.toString())
          
          // Price range filters
          if (filters.min_price !== undefined) params.append("min_price", filters.min_price.toString())
          if (filters.max_price !== undefined) params.append("max_price", filters.max_price.toString())
          
          // Search filter
          if (filters.search) params.append("search", filters.search)
          
          // Pagination
          if (filters.page) params.append("page", filters.page.toString())
          if (filters.page_size) params.append("page_size", filters.page_size.toString())
          
          // Sort/Ordering - map frontend sortBy to backend ordering
          if (filters.sortBy) {
            let ordering = ""
            switch (filters.sortBy) {
              case "price_asc":
                ordering = "price"
                break
              case "price_desc":
                ordering = "-price"
                break
              case "newest":
                ordering = "-created_at"
                break
              case "popular":
                ordering = "-average_rating"
                break
              case "name_asc":
                ordering = "name"
                break
              case "name_desc":
                ordering = "-name"
                break
              default:
                ordering = "-created_at" // default to newest
            }
            params.append("ordering", ordering)
          } else if (filters.ordering) {
            params.append("ordering", filters.ordering)
          }
          
          // Featured products
          if (filters.is_featured) params.append("is_featured", "true")
          
          // Additional filters
          if (filters.brands && filters.brands.length > 0) {
            filters.brands.forEach((brand: string) => params.append("brands", brand))
          }
          if (filters.ageRanges && filters.ageRanges.length > 0) {
            filters.ageRanges.forEach((age: string) => params.append("age_ranges", age))
          }
          if (filters.deals && filters.deals.length > 0) {
            filters.deals.forEach((deal: string) => params.append("deals", deal))
          }
          if (filters.reviews && filters.reviews.length > 0) {
            filters.reviews.forEach((review: string) => params.append("reviews", review))
          }
          
          return `products/?${params.toString()}`
        }
        return "products/"
      },
      transformResponse: (response: any) => {
        if (response && response.results) {
          return response.results
        }
        return response || []
      },
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: "Product" as const, id })), { type: "Product", id: "LIST" }]
          : [{ type: "Product", id: "LIST" }],
    }),
    getProduct: builder.query<Product, number>({
      query: (id) => `products/${id}/`,
      providesTags: (result, error, id) => [{ type: "Product", id }],
    }),
    addReview: builder.mutation<ProductReview, { productId: number; review: Partial<ProductReview> }>({
      query: ({ productId, review }) => ({
        url: `products/${productId}/reviews/`,
        method: "POST",
        body: review,
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: "Review", id: productId },
        { type: "Product", id: productId },
      ],
    }),
    getCategories: builder.query<Category[], void>({
      query: () => "products/categories/",
      providesTags: ["Category"],
    }),
    getProductsByCategory: builder.query<Product[], number>({
      query: (categoryId) => `products/categories/${categoryId}/products/`,
      transformResponse: (response: any) => {
        if (response && response.results) {
          return response.results
        }
        return response || []
      },
      providesTags: ["Product"],
    }),
    getSubcategories: builder.query<Category[], number>({
      query: (categoryId) => `products/categories/${categoryId}/subcategories/`,
      providesTags: ["Category"],
    }),
    createProduct: builder.mutation<Product, FormData>({
      query: (productData) => ({
        url: "products/",
        method: "POST",
        body: productData,
      }),
      invalidatesTags: [{ type: "Product", id: "LIST" }],
    }),
    updateProduct: builder.mutation<Product, Partial<Product> & { id: number }>({
      query: ({ id, ...patch }) => ({
        url: `products/${id}/`,
        method: "PATCH",
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Product", id }, "Product"],
    }),
    deleteProduct: builder.mutation<void, number>({
      query: (id) => ({
        url: `products/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Product", id },
        { type: "Product", id: "LIST" },
      ],
    }),
    uploadProductFiles: builder.mutation<any, { productId: number; data: FormData }>({
      query: ({ productId, data }) => ({
        url: `products/${productId}/upload-files/`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Media"],
    }),
    generate3dModel: builder.mutation<
      any,
      {
        productId: number
        detailLevel: "low" | "medium" | "high"
        angleMapping: Record<string, number>
        clothingType: string
      }
    >({
      query: ({ productId, detailLevel, angleMapping, clothingType }) => ({
        url: `products/${productId}/generate-3d-model/`,
        method: "POST",
        body: {
          detail_level: detailLevel,
          angle_mapping: angleMapping,
          clothing_type: clothingType,
        },
      }),
      invalidatesTags: (result, error, { productId }) => [{ type: "GenerationStatus", id: productId }],
    }),
    getGenerationStatus: builder.query<GenerationStatus, number>({
      query: (productId) => `products/${productId}/generation-status/`,
      providesTags: (result, error, productId) => [{ type: "GenerationStatus", id: productId }],
    }),
    cancelGeneration: builder.mutation<any, { productId: number }>({
      query: ({ productId }) => ({
        url: `products/${productId}/cancel-generation/`,
        method: "POST",
      }),
      invalidatesTags: (result, error, { productId }) => [{ type: "GenerationStatus", id: productId }],
    }),
    getLowStockProducts: builder.query<Product[], number>({
      query: (limit = 5) => `products/?ordering=stock&page_size=${limit}`,
       transformResponse: (response: any) => {
        if (response && response.results) {
          return response.results
        }
        return response || []
      },
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: "Product" as const, id })), { type: "Product", id: "LIST" }]
          : [{ type: "Product", id: "LIST" }],
    }),
    // Add category creation endpoint for admin
    createCategory: builder.mutation<Category, FormData>({
      query: (categoryData) => ({
        url: "products/categories/",
        method: "POST",
        body: categoryData,
      }),
      invalidatesTags: ["Category"],
    }),
    // Add category update endpoint for admin
    updateCategory: builder.mutation<Category, { id: number; formData: FormData }>({
      query: ({ id, formData }) => ({
        url: `products/categories/${id}/`,
        method: "PATCH",
        body: formData,
      }),
      invalidatesTags: ["Category"],
    }),
    // Add category delete endpoint for admin
    deleteCategory: builder.mutation<void, number>({
      query: (id) => ({
        url: `products/categories/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["Category"],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetProductsQuery,
  useGetProductQuery,
  useAddReviewMutation,
  useGetCategoriesQuery,
  useGetProductsByCategoryQuery,
  useGetSubcategoriesQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useUploadProductFilesMutation,
  useGenerate3dModelMutation,
  useGetGenerationStatusQuery,
  useCancelGenerationMutation,
  useGetLowStockProductsQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = productApi
