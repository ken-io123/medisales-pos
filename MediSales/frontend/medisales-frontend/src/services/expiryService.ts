import api from './api';
import type { ExpiringProduct, ExpiryStats } from '../types/Expiry';
import { successToast } from '../utils/toast';

const EXPORT_FILENAME = 'medisales-expiry-report.xlsx';

const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const expiryService = {
  getExpiringProducts: async (days?: number, includeArchived?: boolean) => {
    const params: Record<string, number | boolean> = {};
    if (typeof days === 'number') params.days = days;
    if (includeArchived) params.includeArchived = true;
    const { data } = await api.get<ExpiringProduct[]>('/Products/expiring', { 
      params: Object.keys(params).length > 0 ? params : undefined 
    });
    return data;
  },

  getExpiryStats: async () => {
    const { data } = await api.get<ExpiryStats>('/Products/expiring/stats');
    return data;
  },

  exportExpiryReport: async (days?: number) => {
    const params = typeof days === 'number' ? { days } : undefined;
    const response = await api.get<Blob>('/Reports/expiry', {
      params,
      responseType: 'blob',
    });

    downloadBlob(response.data, EXPORT_FILENAME);
    successToast('Expiry report exported successfully!');
  },

  archiveProduct: async (productId: number) => {
    await api.post(`/Products/${productId}/archive`);
    successToast('Product archived successfully!');
  },

  restoreProduct: async (productId: number) => {
    await api.post(`/Products/${productId}/restore`);
    successToast('Product restored successfully!');
  },
};
