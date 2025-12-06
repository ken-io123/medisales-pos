import type { Product } from './Product';
import type { User } from './User';

export type AlertType =
  | 'LowStock'
  | 'OutOfStock'
  | 'ExpiringIn7Days'
  | 'ExpiringIn30Days'
  | 'ExpiringIn60Days'
  | 'Expired'
  | 'CriticalStock';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface Alert {
  alertId: number;
  productId: number;
  alertType: AlertType;
  message: string;
  severity: AlertSeverity;
  isResolved: boolean;
  createdAt: string;
  resolvedAt?: string | null;
  resolvedById?: number | null;
  resolvedByUsername?: string | null;
  product?: Product;
  resolvedBy?: User;
  currentStock?: number;
  reorderLevel?: number;
  daysUntilExpiry?: number | null;
  expiryDate?: string | null;
}

export interface AlertFilter {
  type?: AlertType;
  severity?: AlertSeverity;
  isResolved?: boolean;
}
