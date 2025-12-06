import api from './api';
import type { Product } from '../types/Product';
import type { Transaction } from '../types/Transaction';
import { successToast } from '../utils/toast';

export type POSCartItemPayload = {
  productId: number;
  quantity: number;
  unitPrice: number;
};

export type POSTransactionPayload = {
  items: POSCartItemPayload[];
  discountType: 'None' | 'SeniorCitizen' | 'PWD';
  paymentMethod: 'Cash' | 'GCash';
  paymentReferenceNumber?: string;
  amountPaid: number;
  userId?: number;
};

export const posService = {
  getProducts: async () => {
    // Request a large page size to get all products for POS client-side filtering
    const { data } = await api.get<any>('/Products', {
      params: { pageSize: 1000 }
    });
    // Handle PaginatedResponse structure
    if (data && Array.isArray(data.data)) {
      return data.data as Product[];
    }
    // Fallback if API changes
    return Array.isArray(data) ? data : [];
  },

  searchProducts: async (term: string) => {
    const { data } = await api.get<any>('/Products', {
      params: { search: term, pageSize: 100 },
    });
    // Handle PaginatedResponse structure
    if (data && Array.isArray(data.data)) {
      return data.data as Product[];
    }
    return Array.isArray(data) ? data : [];
  },

  findProductByCode: async (code: string) => {
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      return null;
    }
    try {
      const { data } = await api.get<Product>(`/Products/code/${trimmedCode}`);
      return data;
    } catch {
      return null;
    }
  },

  createTransaction: async (payload: POSTransactionPayload) => {
    // Transform to match backend DTO with PascalCase property names
    // Map 'Card' to 'CreditCard' to match backend enum
    const paymentMethodMap: Record<string, string> = {
      'Cash': 'Cash',
      'GCash': 'GCash',
    };

    // Ensure DiscountType matches backend enum exactly
    const discountType = payload.discountType || 'None';
    
    // Validate discount type
    const validDiscountTypes = ['None', 'SeniorCitizen', 'PWD'];
    if (!validDiscountTypes.includes(discountType)) {
      console.error('Invalid discount type:', discountType);
      throw new Error(`Invalid discount type: ${discountType}`);
    }

    if (!payload.userId) {
      console.error('User ID is missing in transaction payload');
      throw new Error('User ID is required to complete the transaction.');
    }

    const transactionPayload = {
      UserId: payload.userId,
      Items: payload.items.map(item => ({
        ProductId: item.productId,
        Quantity: item.quantity,
        UnitPrice: item.unitPrice,
      })),
      DiscountType: discountType,
      PaymentMethod: paymentMethodMap[payload.paymentMethod] || 'Cash',
      PaymentReferenceNumber: payload.paymentReferenceNumber || null,
      AmountPaid: payload.amountPaid,
    };

    console.log('Sending transaction payload:', JSON.stringify(transactionPayload, null, 2));
    
    const { data } = await api.post<Transaction>('/Sales', transactionPayload);
    successToast('Transaction created successfully!');
    return data;
  },
};
