import api from './api';
import type {
  CategorySales,
  PaymentMethodSales,
  ReportPeriod,
  ReportType,
  SalesMetrics,
  SalesChartData,
} from '../types/Reports';
import { successToast } from '../utils/toast';

const createDownloadFromBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const reportsService = {
  getDailySales: async () => {
    const { data } = await api.get<SalesMetrics>('/Reports/sales/daily');
    return data;
  },

  getStaffDailySales: async () => {
    const { data } = await api.get<SalesMetrics>('/Reports/staff/daily');
    return data;
  },

  getWeeklySales: async () => {
    const { data } = await api.get<SalesMetrics>('/Reports/sales/weekly');
    return data;
  },

  getMonthlySales: async () => {
    const { data } = await api.get<SalesMetrics>('/Reports/sales/monthly');
    return data;
  },

  getYearlySales: async () => {
    const { data } = await api.get<SalesMetrics>('/Reports/sales/yearly');
    return data;
  },

  getSalesTrend: async (period: ReportPeriod) => {
    const { data } = await api.get<SalesChartData>('/Reports/sales/trend', {
      params: { period },
    });
    return data;
  },

  getSalesByCategory: async (period?: ReportPeriod) => {
    const { data } = await api.get<CategorySales[]>('/Reports/sales/by-category', {
      params: period ? { period } : undefined,
    });

    return data;
  },

  getSalesByPaymentMethod: async (period?: ReportPeriod) => {
    const { data } = await api.get<PaymentMethodSales[]>('/Reports/sales/by-payment-method', {
      params: period ? { period } : undefined,
    });

    return data;
  },

  exportReport: async (reportType: ReportType, period?: ReportPeriod) => {
    const { data } = await api.get<Blob>(`/Reports/export/${reportType}`, {
      params: period ? { period } : undefined,
      responseType: 'blob',
    });

    createDownloadFromBlob(
      new Blob([data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
      `${reportType}-${Date.now()}.xlsx`,
    );
    successToast('Report exported successfully!');
  },
};
