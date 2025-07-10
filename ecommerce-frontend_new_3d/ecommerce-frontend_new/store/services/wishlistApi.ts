import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '@/store';

export const wishlistApi = createApi({
  reducerPath: 'wishlistApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL + '/wishlist/' : 'http://localhost:8000/api/wishlist/',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      } else if (typeof window !== 'undefined') {
        const localToken = localStorage.getItem('token');
        if (localToken) {
          headers.set('authorization', `Bearer ${localToken}`);
        }
      }
      headers.set('Accept', 'application/json');
      return headers;
    },
    credentials: 'include',
  }),
  tagTypes: ['Wishlist'],
  endpoints: (builder) => ({
    getWishlist: builder.query<any, void>({
      query: () => 'my_wishlist/',
      providesTags: ['Wishlist'],
    }),
    addItem: builder.mutation<any, { product_id: number; variant_id?: number; notes?: string }>({
      query: (body) => ({
        url: 'add_item/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Wishlist'],
    }),
    removeItem: builder.mutation<any, { product_id: number; variant_id?: number }>({
      query: (body) => ({
        url: 'remove_item/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Wishlist'],
    }),
    checkProduct: builder.query<any, { product_id: number; variant_id?: number }>({
      query: ({ product_id, variant_id }) => {
        let url = `check_product/?product_id=${product_id}`;
        if (variant_id) url += `&variant_id=${variant_id}`;
        return url;
      },
      providesTags: (result, error, arg) => [{ type: 'Wishlist', id: arg.product_id }],
    }),
    clearWishlist: builder.mutation<any, void>({
      query: () => ({
        url: 'clear/',
        method: 'POST',
      }),
      invalidatesTags: ['Wishlist'],
    }),
  }),
});

export const {
  useGetWishlistQuery,
  useAddItemMutation,
  useRemoveItemMutation,
  useCheckProductQuery,
  useClearWishlistMutation,
} = wishlistApi; 