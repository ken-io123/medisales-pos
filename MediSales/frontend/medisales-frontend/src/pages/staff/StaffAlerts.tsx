import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, PackageSearch, Send, TriangleAlert } from 'lucide-react';
import { alertService } from '../../services/alertService';
import { messageService } from '../../services/messageService';
import signalRService from '../../services/signalRService';
import { useAuth } from '../../hooks/useAuth';
import type { Alert } from '../../types/Alert';

const getAlertAccent = (stock: number) => {
  if (stock === 0) {
    return {
      chip: 'bg-rose-100 text-rose-700 border border-rose-200 font-bold',
      meter: 'bg-rose-500',
      border: 'border-l-4 border-rose-500',
      icon: 'text-rose-600 bg-rose-50 border-2 border-rose-100',
      label: 'Out of Stock',
    } as const;
  }

  if (stock < 5) {
    return {
      chip: 'bg-rose-50 text-rose-600 border border-rose-200 font-bold',
      meter: 'bg-rose-400',
      border: 'border-l-4 border-rose-400',
      icon: 'text-rose-500 bg-rose-50 border-2 border-rose-100',
      label: 'Critical',
    } as const;
  }

  if (stock < 10) {
    return {
      chip: 'bg-orange-50 text-orange-600 border border-orange-200 font-bold',
      meter: 'bg-orange-400',
      border: 'border-l-4 border-orange-400',
      icon: 'text-orange-500 bg-orange-50 border-2 border-orange-100',
      label: 'Very Low',
    } as const;
  }

  return {
    chip: 'bg-amber-50 text-amber-600 border border-amber-200 font-bold',
    meter: 'bg-amber-400',
    border: 'border-l-4 border-amber-400',
    icon: 'text-amber-600 bg-amber-50 border-2 border-amber-100',
    label: 'Low Stock',
  } as const;
};

const StaffAlerts = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifyingId, setNotifyingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchAlerts = useCallback(async (showRefreshing = false) => {
    setError(null);
    if (!showRefreshing) {
      setLoading(true);
    }

    try {
      // Get only stock-related alerts
      const data = await alertService.getStockAlertsOnly();
      setAlerts(data);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Unable to load stock alerts right now.';
      setError(message);
    } finally {
      if (!showRefreshing) {
        setLoading(false);
      }
    }
  }, []);

  // SignalR real-time updates
  useEffect(() => {
    const handleLowStockAlert = () => {
      void fetchAlerts(true);
    };

    const handleStockUpdated = () => {
      void fetchAlerts(true);
    };

    signalRService.onLowStockAlert(handleLowStockAlert);
    signalRService.onStockUpdated(handleStockUpdated);

    return () => {
      signalRService.offLowStockAlert(handleLowStockAlert);
      signalRService.offStockUpdated(handleStockUpdated);
    };
  }, [fetchAlerts]);

  useEffect(() => {
    void fetchAlerts();
  }, [fetchAlerts]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = window.setInterval(() => {
      void fetchAlerts(true);
    }, 5 * 60 * 1000);

    return () => window.clearInterval(interval);
  }, [fetchAlerts]);

  useEffect(() => {
    if (!feedback) {
      return undefined;
    }

    const timer = window.setTimeout(() => setFeedback(null), 3500);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const handleNotifyAdmin = async (alert: Alert) => {
    if (!user) {
      setFeedback({ type: 'error', message: 'You need to be logged in to notify the admin team.' });
      return;
    }

    setNotifyingId(alert.alertId);

    try {
      const productName = alert.product?.productName ?? 'Unknown product';
      const productCode = alert.product?.productCode ?? 'N/A';
      const stock = alert.currentStock ?? 0;
      const message = `Low stock alert for ${productName} (${productCode}). Current stock: ${stock}. Please review and restock.`;
      
      // Pass the actual logged-in staff user's ID
      await messageService.sendMessageToAdmin(message, user.userId);
      
      setFeedback({ type: 'success', message: 'Admin has been notified. They will review the alert shortly.' });
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Failed to notify the admin.';
      setFeedback({ type: 'error', message });
    } finally {
      setNotifyingId(null);
    }
  };

  const lowStockAlerts = useMemo(
    () => alerts.filter((alert) => (alert.currentStock ?? 0) < 20).sort((a, b) => (a.currentStock ?? 0) - (b.currentStock ?? 0)),
    [alerts],
  );

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/25">
              <TriangleAlert className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Stock Alerts</h1>
          </div>
          <p className="text-sm text-slate-500">
            Monitor low inventory and notify admin for restocking when needed.
          </p>
        </div>
      </div>

      {/* Feedback Messages */}
      {feedback ? (
        <div
          className={`flex items-center gap-3 border-l-4 px-4 py-3 text-sm font-bold shadow-sm ${
            feedback.type === 'success'
              ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
              : 'border-rose-500 bg-rose-50 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600" aria-hidden="true" />
          )}
          <span>{feedback.message}</span>
        </div>
      ) : null}

      {error ? (
        <div className="flex items-center gap-3 border-l-4 border-rose-500 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">
          <AlertCircle className="h-5 w-5 text-rose-600" aria-hidden="true" />
          {error}
        </div>
      ) : null}

      {/* Alert Cards */}
      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={`skeleton-${index}`} className="animate-pulse border-2 border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 bg-slate-100" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 w-24 bg-slate-100" />
                  <div className="h-4 w-40 bg-slate-100" />
                  <div className="h-3 w-32 bg-slate-50" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : lowStockAlerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center bg-white shadow-sm border-2 border-slate-200">
            <PackageSearch className="h-8 w-8 text-slate-400" aria-hidden="true" />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-900">No Stock Alerts</h3>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Inventory levels look healthy. Alerts will appear here when stock runs low.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {lowStockAlerts.map((alert) => {
            const stock = alert.currentStock ?? 0;
            const productName = alert.product?.productName ?? 'Unknown product';
            const productCode = alert.product?.productCode ?? 'N/A';
            const accent = getAlertAccent(stock);
            const stockPercentage = Math.min((stock / (alert.reorderLevel ?? 20)) * 100, 100);

            return (
              <div
                key={alert.alertId}
                className={`group border-2 border-slate-200 bg-white p-6 shadow-lg transition-all duration-200 hover:border-slate-300 ${accent.border}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center shadow-sm ${accent.icon}`}>
                    <TriangleAlert className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded px-2.5 py-1 text-xs uppercase tracking-wide ${accent.chip}`}>
                        {accent.label}
                      </span>
                      <span className="bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600 border border-slate-200">
                        {productCode}
                      </span>
                    </div>
                    <h3 className="mt-2 truncate text-lg font-bold text-slate-900">{productName}</h3>
                    <p className="mt-0.5 text-sm text-slate-600">{alert.message}</p>
                    
                    <div className="mt-4 flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Stock Level</span>
                          <span className={`text-lg font-bold tabular-nums ${stock === 0 ? 'text-rose-600' : stock < 10 ? 'text-orange-600' : 'text-amber-600'}`}>
                            {stock}
                          </span>
                        </div>
                        <div className="mt-1.5 h-2 overflow-hidden bg-slate-100 border border-slate-200">
                          <div
                            className={`h-full transition-all ${accent.meter}`}
                            style={{ width: `${stockPercentage}%` }}
                          />
                        </div>
                        <p className="mt-1 text-xs font-medium text-slate-500">Reorder at {alert.reorderLevel ?? 'N/A'}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t-2 border-slate-50 pt-4">
                      <span className="text-xs font-bold text-slate-500">
                        Supplier: {alert.product?.supplierName ?? 'Not set'}
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleNotifyAdmin(alert)}
                        disabled={notifyingId === alert.alertId}
                        className="flex items-center gap-1.5 border-2 border-blue-500 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-600 shadow-sm transition-all hover:bg-blue-100 disabled:opacity-50"
                      >
                        <Send className={`h-3.5 w-3.5 ${notifyingId === alert.alertId ? 'animate-pulse' : ''}`} aria-hidden="true" />
                        {notifyingId === alert.alertId ? 'Sending...' : 'Notify Admin'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StaffAlerts;
