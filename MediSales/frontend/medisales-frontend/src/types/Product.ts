export interface Product {
  productId: number;
  productCode: string;
  productName: string;
  description?: string | null;
  category: string;
  supplierName?: string | null;
  stockQuantity: number;
  unitPrice: number;
  manufacturingDate?: string | null;
  expiryDate?: string | null;
  createdAt: string;
  updatedAt: string;
  isArchived?: boolean;
  archivedAt?: string | null;
  archivedBy?: number | null;
}

export interface ProductInventorySummary {
  productId: number;
  productName: string;
  stockQuantity: number;
  unitPrice: number;
  totalValue: number;
  status: 'Normal' | 'LowStock' | 'OutOfStock' | 'ExpiringSoon';
}

export interface ProductFilter {
  search?: string;
  category?: string;
  supplier?: string;
  minStock?: number;
  maxStock?: number;
}
