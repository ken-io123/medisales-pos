import api from './api';
import type {
  Receipt,
  Transaction,
  TransactionFilters,
  TransactionListResponse,
  TransactionQueryParams,
  TransactionSummary,
} from '../types/Transaction';

export const transactionService = {
  getTransactions: async (params?: TransactionQueryParams) => {
    const { data } = await api.get<TransactionListResponse>('/Sales', { params });
    return data;
  },

  filterTransactions: async (filters?: TransactionFilters) => {
    const { data } = await api.get('/transactions/filter', { params: filters });
    return data;
  },

  getTodayTransactions: async () => {
    const { data } = await api.get<Transaction[]>('/transactions/today');
    return data;
  },

  getYesterdayTransactions: async () => {
    const { data } = await api.get<Transaction[]>('/transactions/yesterday');
    return data;
  },

  getTransactionsByDateRange: async (start: string, end: string) => {
    const { data } = await api.get<Transaction[]>('/transactions/date-range', {
      params: { start, end }
    });
    return data;
  },

  getTransactionById: async (transactionId: number) => {
    const { data } = await api.get<Transaction>(`/Sales/${transactionId}`);
    return data;
  },

  getTransactionSummary: async (filters?: TransactionFilters) => {
    const { data } = await api.get<TransactionSummary>('/Sales/summary', { params: filters });
    return data;
  },

  exportTransactions: async (params?: TransactionQueryParams) => {
    const { data } = await api.get<Blob>('/Sales/export', {
      params,
      responseType: 'blob',
    });

    const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `transaction-history-${Date.now()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  exportTransactionsCSV: async (params?: TransactionQueryParams) => {
    // Call our new CSV endpoint directly
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    const response = await fetch(`http://localhost:5012/api/transactions/export/csv?${queryParams.toString()}`);
    if (!response.ok) throw new Error('Export failed');
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `transactions-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  getReceipt: async (transactionId: number): Promise<Receipt> => {
    const { data } = await api.get<Receipt>(`/transactions/${transactionId}/receipt`);
    return data;
  },

  voidTransaction: async (transactionId: number, voidReason: string): Promise<Transaction> => {
    const { data } = await api.post<Transaction>(`/transactions/${transactionId}/void`, { voidReason });
    return data;
  },

  getVoidedTransactions: async (params?: TransactionQueryParams) => {
    const { data } = await api.get<TransactionListResponse>('/Sales', { 
      params: { ...params, includeVoided: true } 
    });
    return data;
  },
};
