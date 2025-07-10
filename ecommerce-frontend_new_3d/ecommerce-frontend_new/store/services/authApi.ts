import { api } from "../api"
import type { LoginRequest, LoginResponse, RegisterRequest, User } from "../../app/types/auth"

export interface RegisterRequestWithNames extends RegisterRequest {
  first_name?: string
  last_name?: string
}

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: "auth/login/",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Auth", "User"],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          // Update the auth state with user data and tokens
          dispatch({ 
            type: 'auth/loginSuccess', 
            payload: { 
              user: data.user, 
              access: data.access, 
              refresh: data.refresh 
            } 
          });
          // Robustly clear and refetch cart/wishlist for the logged-in user
          dispatch({ type: 'cartApi/util/resetApiState' });
          dispatch({ type: 'cartSlice/clearCart' });
          dispatch({ type: 'cartApi/executeQuery', meta: { arg: undefined, endpointName: 'getCart' } });
          dispatch({ type: 'wishlistApi/util/resetApiState' });
          dispatch({ type: 'wishlistApi/executeQuery', meta: { arg: undefined, endpointName: 'getWishlist' } });
        } catch (error) {
          console.error('Login failed:', error);
        }
      },
    }),
    register: builder.mutation<User, RegisterRequestWithNames>({
      query: (userData) => ({
        url: "users/",
        method: "POST",
        body: userData,
      }),
      invalidatesTags: ["Auth", "User"],
    }),
    getMe: builder.query<User, void>({
      query: () => "users/me/",
      providesTags: ["User"],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data: user } = await queryFulfilled;
          // Update the auth state with user data
          dispatch({ type: 'auth/updateUser', payload: user });
        } catch (error) {
          console.error('Failed to load user data:', error);
        }
      },
    }),
    refreshToken: builder.mutation<{ access: string }, { refresh: string }>({
      query: (refreshData) => ({
        url: "auth/token/refresh/",
        method: "POST",
        body: refreshData,
      }),
    }),
    logout: builder.mutation<{ success: boolean }, void>({
      query: () => ({
        url: "auth/logout/",
        method: "POST",
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          // Clear auth state
          dispatch({ type: 'auth/logout' });
          // Robustly clear cart and wishlist state
          dispatch({ type: 'cartApi/util/resetApiState' });
          dispatch({ type: 'cartSlice/clearCart' });
          dispatch({ type: 'wishlistApi/util/resetApiState' });
        } catch {}
      },
    }),
  }),
})

export const { useLoginMutation, useRegisterMutation, useGetMeQuery, useRefreshTokenMutation, useLogoutMutation } = authApi