import { api } from "@/store/api"
import type { DashboardStats, ProductSalesData, SalesData } from "@/app/types"

export const analyticsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query<DashboardStats, void>({
      query: () => "analytics/dashboard/",
      providesTags: ["Analytics"],
    }),
    getSalesByDate: builder.query<SalesData[], { start_date?: string; end_date?: string }>({
      query: (params) => ({
        url: "analytics/dashboard/",
        params,
      }),
      providesTags: ["Analytics"],
      transformResponse: (response: DashboardStats) => {
        return response.sales_by_date || []
      },
    }),
    getTopProducts: builder.query<ProductSalesData[], number>({
      query: (limit = 5) => `analytics/dashboard/?limit=${limit}`,
      providesTags: ["Analytics"],
      transformResponse: (response: DashboardStats) => {
        return response.top_selling_products?.slice(0, 5) || []
      },
    }),
  }),
})

export const { useGetDashboardStatsQuery, useGetSalesByDateQuery, useGetTopProductsQuery } = analyticsApi
