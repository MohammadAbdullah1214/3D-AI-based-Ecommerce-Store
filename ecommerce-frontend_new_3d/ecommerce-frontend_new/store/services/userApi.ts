import { api } from "../api"
import type { User } from "../slices/authSlice"

// Users API endpoints
export const userApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<User[], void>({
      query: () => "/users/",
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: "Users" as const, id })), { type: "Users", id: "LIST" }]
          : [{ type: "Users", id: "LIST" }],
    }),
    getUser: builder.query<User, number>({
      query: (id) => `/users/${id}/`,
      providesTags: (result, error, id) => [{ type: "Users", id }],
    }),
    updateUser: builder.mutation<User, { id: number; data: Partial<User> }>({
      query: ({ id, data }) => ({
        url: `/users/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Users", id }, { type: "User" }],
    }),
    deleteUser: builder.mutation<void, number>({
      query: (id) => ({
        url: `/users/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["Users"],
    }),
  }),
})

export const { useGetUsersQuery, useGetUserQuery, useUpdateUserMutation, useDeleteUserMutation } = userApi
