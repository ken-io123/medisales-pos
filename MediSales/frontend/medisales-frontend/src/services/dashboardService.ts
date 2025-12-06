import api from './api';
import type {
  DashboardStats,
  RecentTransactionRow,
  SalesChartEntry,
  TopProductRow,
} from '../types/Dashboard';

export const dashboardService = {
  getDashboardStats: async () => {
    const { data } = await api.get<DashboardStats>('/dashboard/stats');
    return data;
  },

  getSalesChart: async () => {
    const { data } = await api.get<SalesChartEntry[]>('/dashboard/sales-chart');
    return data;
  },

  getTopProducts: async () => {
    const { data } = await api.get<TopProductRow[]>('/dashboard/top-products');
    return data;
  },

  getRecentTransactions: async () => {
    const { data } = await api.get<RecentTransactionRow[]>('/dashboard/recent-transactions');
    return data;
  },
};
