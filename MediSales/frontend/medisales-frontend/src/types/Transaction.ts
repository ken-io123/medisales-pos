import type { User } from './User';
import type { Product } from './Product';

export type PaymentMethod =
  | 'Cash'
  | 'CreditCard'
  | 'DebitCard'
  | 'GCash'
  | 'Insurance';

export interface TransactionItem {
  transactionItemId: number;
  productId: number;
  productName?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
  product?: Product;
}

export interface Transaction {
  transactionId: number;
  transactionCode: string;
  customerName?: string | null;
  paymentMethod: PaymentMethod;
  paymentReferenceNumber?: string | null;
  totalAmount: number;
  totalDiscount: number;
  discountAmount?: number;
  discountType?: string;
  totalItems: number;
  staffId: number;
  staffName?: string;
  username?: string;
  staff?: User;
  createdAt: string;
  transactionDate: string;
  updatedAt: string;
  items?: TransactionItem[];
  itemsSummary?: string;
  isVoided?: boolean;
  voidedAt?: string | null;
  voidedBy?: number | null;
  voidedByName?: string | null;
  voidReason?: string | null;
  amountPaid?: number;
  changeAmount?: number;
  subtotal?: number;
  dateTime?: string;
}

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  staffId?: number;
  paymentMethod?: string;
  discountType?: string;
  minAmount?: number;
  maxAmount?: number;
  searchTerm?: string;
  status?: 'all' | 'active' | 'voided';
  includeVoided?: boolean;
  page?: number;
  pageSize?: number;
}

export interface TransactionSummary {
  totalSales: number;
  totalTransactions: number;
  totalItemsSold: number;
  averageTransactionValue: number;
}

export interface TransactionQueryParams extends TransactionFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  includeVoided?: boolean;
}

export interface TransactionListResponse {
  data: Transaction[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ReceiptItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Receipt {
  storeName: string;
  storeAddress?: string;
  transactionCode: string;
  cashier: string;
  dateTime: string;
  paymentMethod: string;
  items: ReceiptItem[];
  subtotal: number;
  discountType?: string;
  discountAmount: number;
  discountPercentage?: number;
  total: number;
  amountPaid: number;
  changeAmount: number;
}
