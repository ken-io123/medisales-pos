import type { PaymentMethod } from './Transaction';

export interface DashboardStats {
  todaySales: number;
  totalTransactions: number;
  lowStockItems: number;
  expiringSoon: number;
}

export interface SalesChartEntry {
  day: string;
  totalSales: number;
}

export interface TopProductRow {
  productId: number;
  name: string;
  unitsSold: number;
  revenue: number;
}

export interface RecentTransactionRow {
  transactionId: number;
  transactionCode: string;
  staffName: string;
  paymentMethod: PaymentMethod;
  totalAmount: number;
  createdAt: string;
}
