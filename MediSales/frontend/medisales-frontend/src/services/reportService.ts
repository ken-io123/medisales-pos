import api from './api';
import type {
  CategorySales,
  InventoryReport,
  PaymentMethodSummary,
  ProductSales,
  SalesReport,
  StaffPerformance,
} from '../types/Report';

export const reportService = {
  getDailySales: async (date?: string) => {
    const { data } = await api.get<SalesReport>('/reports/daily', { params: { date } });
    return data;
  },

  getWeeklySales: async (weekStart?: string) => {
    const { data } = await api.get<SalesReport>('/reports/weekly', { params: { weekStart } });
    return data;
  },

  getMonthlySales: async (month: number, year: number) => {
    const { data } = await api.get<SalesReport>('/reports/monthly', { params: { month, year } });
    return data;
  },

  getTopSellingProducts: async (count = 10) => {
    const { data } = await api.get<ProductSales[]>('/reports/top-products', { params: { count } });
    return data;
  },

  getSalesByCategory: async () => {
    const { data } = await api.get<CategorySales[]>('/reports/by-category');
    return data;
  },

  getSalesByPaymentMethod: async () => {
    const { data } = await api.get<PaymentMethodSummary[]>('/reports/by-payment-method');
    return data;
  },

  getStaffPerformance: async () => {
    const { data } = await api.get<StaffPerformance[]>('/reports/staff-performance');
    return data;
  },

  getInventoryReport: async () => {
    const { data } = await api.get<InventoryReport>('/reports/inventory');
    return data;
  },
};
