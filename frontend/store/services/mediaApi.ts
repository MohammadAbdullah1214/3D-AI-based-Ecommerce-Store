import { api } from "@/store/api"
import type { ProductMedia } from "@/app/types/product"
import { RootState } from "../index"

export const mediaApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProductMedia: builder.query<ProductMedia[], number>({
      query: () => "products/my-images/",
      providesTags: (result, error, productId) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Media" as const, id })),
              { type: "Media", id: "LIST" },
            ]
          : [{ type: "Media", id: "LIST" }],
      transformResponse: (response: ProductMedia[], meta, arg: number) => {
        const productId = arg;
        if (!response) {
          return [];
        }
        return response.filter((media) => media.product === productId);
      },
    }),
    getAllMedia: builder.query<ProductMedia[], void>({
      query: () => "products/my-images/",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Media" as const, id })),
              { type: "Media", id: "LIST" },
            ]
          : [{ type: "Media", id: "LIST" }],
      transformResponse: (response: ProductMedia[]) => {
        return response;
      },
    }),
    deleteProductMedia: builder.mutation<void, { productId: number; mediaId: number }>({
      query: ({ productId, mediaId }) => ({
        url: `products/${productId}/media/${mediaId}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { mediaId }) => [{ type: "Media", id: mediaId }, { type: "Media", id: "LIST" }],
    }),
  }),
})

export const { useGetProductMediaQuery, useGetAllMediaQuery, useDeleteProductMediaMutation } = mediaApi
