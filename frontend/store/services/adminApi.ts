import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import type { RootState } from "../index"
import type { User } from "@/app/types/user"

export interface UserStats {
  total_users: number
  customers_count: number
  sellers_count: number
  admins_count: number
  new_users_this_month: number
}

export const adminApi = createApi({
  reducerPath: "adminApi", // Make sure this is unique
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL + "/api/",
    prepareHeaders: (headers, { getState }) => {
      // Get the token from the auth state
      const token = (getState() as RootState).auth.accessToken

      // If we have a token, add it to the headers
      if (token) {
        headers.set("authorization", `Bearer ${token}`)
      }

      return headers
    },
  }),
  tagTypes: ["Users", "Customers", "Sellers"],
  endpoints: (builder) => ({
    getAllUsers: builder.query<User[], void>({
      query: () => "users/",
      providesTags: ["Users"],
    }),
    getUserById: builder.query<User, number>({
      query: (id) => `users/${id}/`,
      providesTags: (result, error, id) => [{ type: "Users", id }],
    }),
    updateUser: builder.mutation<User, { id: number; data: Partial<User> }>({
      query: ({ id, data }) => ({
        url: `users/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Users", id }],
    }),
    deleteUser: builder.mutation<void, number>({
      query: (id) => ({
        url: `users/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["Users"],
    }),
    getUserStats: builder.query<UserStats, void>({
      query: () => "admin/user-stats/",
      providesTags: ["Users"],
    }),
    getCustomers: builder.query<User[], void>({
      query: () => "admin/customers/",
      providesTags: ["Customers"],
    }),
    getSellers: builder.query<User[], void>({
      query: () => "admin/sellers/",
      providesTags: ["Sellers"],
    }),
  }),
})

export const {
  useGetAllUsersQuery,
  useGetUserByIdQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetUserStatsQuery,
  useGetCustomersQuery,
  useGetSellersQuery,
} = adminApi
