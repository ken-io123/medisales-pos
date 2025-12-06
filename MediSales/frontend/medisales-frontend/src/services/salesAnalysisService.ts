import api from './api';

export interface HistoricalSalesDto {
  date: string;
  totalSales: number;
  transactionCount: number;
  averageTransaction: number;
}

export interface SalesComparisonDto {
  date1: string;
  sales1: number;
  date2: string;
  sales2: number;
  percentageChange: number;
  amountDifference: number;
  isIncrease: boolean;
  trendDescription: string;
}

export const salesAnalysisService = {
  // Get historical sales for a specific date
  getHistoricalSales: async (date: string): Promise<HistoricalSalesDto> => {
    const { data } = await api.get<HistoricalSalesDto>(`/reports/historical/${date}`);
    return data;
  },

  // Compare sales between two dates
  compareSales: async (date1: string, date2: string): Promise<SalesComparisonDto> => {
    const { data } = await api.get<SalesComparisonDto>('/reports/compare', {
      params: { date1, date2 },
    });
    return data;
  },

  // Compare current week vs previous week
  getWeeklyComparison: async (weekStart?: string): Promise<SalesComparisonDto> => {
    const { data } = await api.get<SalesComparisonDto>('/reports/weekly-comparison', {
      params: weekStart ? { weekStart } : undefined,
    });
    return data;
  },

  // Compare current month vs previous month
  getMonthlyComparison: async (month?: number, year?: number): Promise<SalesComparisonDto> => {
    const { data } = await api.get<SalesComparisonDto>('/reports/monthly-comparison', {
      params: { month, year },
    });
    return data;
  },
};
