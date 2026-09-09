export interface DashboardStats {
  revenue: number;
  orders: number;
  customers: number;
  avgOrderValue: number;
  pendingOrders: number;
  lowStockProducts: number;
}

export interface AdminTableParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, string>;
}
