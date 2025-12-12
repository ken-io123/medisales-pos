import api from './api';
import type { Product, ProductFilter } from '../types/Product';
import { successToast } from '../utils/toast';

export type ProductPayload = {
  productName: string;
  productCode: string;
  category: string;
  unitPrice: number;
  stockQuantity: number;
  description?: string | null;
  supplierName?: string | null;
  manufacturingDate?: string | null;
  expiryDate?: string | null;
};

export type PaginatedResponse<T> = {
  data: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export const productService = {
  getProducts: async (filter?: ProductFilter, page = 1, pageSize = 10) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    
    if (filter?.search) params.append('searchTerm', filter.search);
    if (filter?.category) params.append('category', filter.category);
    if (filter?.supplier) params.append('supplier', filter.supplier);
    if (filter?.minStock) params.append('minStock', filter.minStock.toString());
    if (filter?.maxStock) params.append('maxStock', filter.maxStock.toString());
    
    const { data } = await api.get<PaginatedResponse<Product>>('/Products', { params });
    return data;
  },

  getProduct: async (productId: number) => {
    const { data } = await api.get<Product>(`/Products/${productId}`);
    return data;
  },

  addProduct: async (payload: ProductPayload) => {
    const { data } = await api.post<Product>('/Products', payload);
    successToast('Product added successfully!');
    return data;
  },

  updateProduct: async (productId: number, payload: Partial<ProductPayload>) => {
    const { data } = await api.put<Product>(`/Products/${productId}`, payload);
    successToast('Product updated successfully!');
    return data;
  },

  archiveProduct: async (productId: number) => {
    await api.post(`/Products/${productId}/archive`);
    successToast('Product archived successfully!');
  },

  restoreProduct: async (productId: number) => {
    await api.post(`/Products/${productId}/restore`);
    successToast('Product restored successfully!');
  },

  getArchivedProducts: async (filter?: ProductFilter) => {
    const params = new URLSearchParams();
    
    if (filter?.search) params.append('searchTerm', filter.search);
    if (filter?.category) params.append('category', filter.category);
    if (filter?.supplier) params.append('supplier', filter.supplier);
    
    const { data } = await api.get<Product[]>('/Products/archived', { params });
    return data;
  },
};
