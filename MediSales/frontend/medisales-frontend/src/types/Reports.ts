export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface SalesMetrics {
  totalSales: number;
  transactionCount: number;
  averageTransactionAmount: number;
  totalDiscounts?: number;
  totalSubtotal?: number;
  totalItemsSold?: number;
}

export interface SalesDataPoint {
  date: string;
  label: string;
  startDate: string;
  endDate: string;
  sales: number;
  transactions: number;
}

export interface SalesChartData {
  data: SalesDataPoint[];
  totalSales: number;
  averageDailySales: number;
}

export interface CategorySales {
  category: string;
  totalAmount: number;
  percentage: number;
}

export interface PaymentMethodSales {
  method: string;
  totalAmount: number;
  percentage: number;
}

export type ReportType = 'sales-summary' | 'product-report' | 'staff-performance' | 'inventory-report';
