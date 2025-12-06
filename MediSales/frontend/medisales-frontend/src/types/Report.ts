export interface SalesReport {
  period: string;
  startDate: string;
  endDate: string;
  totalSales: number;
  transactionCount: number;
  averageTransactionAmount: number;
  totalDiscounts: number;
  totalSubtotal: number;
  totalItemsSold: number;
}

export interface ProductSales {
  productId: number;
  productName: string;
  productCode: string;
  category: string;
  totalQuantitySold: number;
  totalRevenue: number;
  transactionCount: number;
  currentStock: number;
}

export interface CategorySales {
  category: string;
  totalSales: number;
  totalQuantitySold: number;
  transactionCount: number;
  percentage: number;
}

export interface PaymentMethodSummary {
  paymentMethod: string;
  paymentMethodName: string;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
}

export interface StaffPerformance {
  userId: number;
  username: string;
  fullName: string;
  totalSales: number;
  transactionCount: number;
  averageTransactionAmount: number;
  totalItemsSold: number;
  totalDiscounts: number;
}

export interface ProductInventorySnapshot {
  productId: number;
  productName: string;
  productCode: string;
  stockQuantity: number;
  unitPrice: number;
  totalValue: number;
  expiryDate?: string | null;
  daysUntilExpiry?: number | null;
  stockStatus: 'Normal' | 'Low Stock' | 'Out of Stock';
}

export interface InventoryReport {
  totalProducts: number;
  totalInventoryValue: number;
  totalStockUnits: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  expiringProducts: number;
  products: ProductInventorySnapshot[];
}
