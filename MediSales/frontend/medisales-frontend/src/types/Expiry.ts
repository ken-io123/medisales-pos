export interface ExpiringProduct {
  productId: number;
  productCode: string;
  productName: string;
  category?: string | null;
  supplierName?: string | null;
  stockQuantity: number;
  expiryDate: string | null;
  daysUntilExpiry: number | null;
  status: 'Critical' | 'Warning' | 'Normal' | 'Expired';
  lastUpdated?: string | null;
  description?: string | null;
  isArchived?: boolean;
}

export interface ExpiryStats {
  expiringIn7Days: number;
  expiringIn30Days: number;
  expiringIn60Days: number;
  expiredCount?: number;
}
