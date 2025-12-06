import api from './api';
import type { Alert, AlertFilter } from '../types/Alert';
import { successToast } from '../utils/toast';

export interface AlertSummary {
  totalActiveAlerts: number;
  stockAlerts: {
    lowStock: number;
    outOfStock: number;
  };
  expirationAlerts: {
    expiringIn7Days: number;
    expiringIn30Days: number;
    expiringIn60Days: number;
    expired: number;
  };
  criticalCount: number;
  warningCount: number;
  infoCount: number;
}

export const alertService = {
  /**
   * Gets all active stock alerts (both stock and expiration)
   */
  getStockAlerts: async () => {
    const { data } = await api.get<Alert[]>('/alerts');
    return data;
  },

  /**
   * Gets only stock-related alerts (LowStock, OutOfStock)
   */
  getStockAlertsOnly: async () => {
    const { data } = await api.get<Alert[]>('/alerts/stock');
    return data;
  },

  /**
   * Gets only expiration-related alerts
   */
  getExpirationAlerts: async () => {
    const { data } = await api.get<Alert[]>('/alerts/expiration');
    return data;
  },

  /**
   * Run stock level checks and generate new alerts
   */
  checkStockLevels: async () => {
    const { data } = await api.get('/alerts/check');
    successToast('Stock levels checked successfully.');
    return data;
  },

  /**
   * Gets alerts with optional filtering
   */
  getAlerts: async (filter?: AlertFilter) => {
    const { data } = await api.get<Alert[]>('/alerts', { params: filter });
    return data;
  },

  /**
   * Resolves an alert
   */
  resolveAlert: async (alertId: number, userId: number = 1) => {
    await api.put(`/alerts/${alertId}/resolve`, { resolvedBy: userId });
    successToast('Alert resolved successfully.');
  },

  /**
   * Auto-resolves stale alerts
   */
  autoResolveAlerts: async () => {
    const { data } = await api.post<{ message: string; resolvedCount: number }>('/alerts/auto-resolve');
    if (data.resolvedCount > 0) {
      successToast(`${data.resolvedCount} alerts auto-resolved.`);
    }
    return data;
  },

  /**
   * Gets alert summary statistics
   */
  getAlertSummary: async () => {
    const { data } = await api.get<AlertSummary>('/alerts/summary');
    return data;
  },
};
