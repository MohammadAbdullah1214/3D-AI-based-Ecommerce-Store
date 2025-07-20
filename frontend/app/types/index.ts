export * from "./product"
export * from "./cart"
export * from "./order"
export type { User, UserRole, UserProfile, UserFilters, UserListResponse } from "./user"
export * from "./auth"

export interface DashboardStats {
  total_sales: number;
  total_orders: number;
  total_products: number;
  total_customers: number;
  total_users?: number;
  total_revenue?: number;
  users_change?: number;
  orders_change?: number;
  products_change?: number;
  revenue_change?: number;
  customers_count?: number;
  sellers_count?: number;
  admins_count?: number;
  sales_by_month: { name: string; sales: number; orders: number }[];
  top_selling_products?: Array<{
    product_id: number;
    product_name: string;
    total_quantity: number;
    total_sales: number;
  }>;
  // Add any other fields returned by the backend as needed
}
