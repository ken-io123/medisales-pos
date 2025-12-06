import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BellRing,
  CheckCircle2,
  CircleAlert,
  Package,
  PackageSearch,
  TrendingDown,
  TriangleAlert,
  Zap,
  X
} from 'lucide-react';
import { alertService } from '../../services/alertService';
import signalRService from '../../services/signalRService';
import type { Alert } from '../../types/Alert';
import { successToast, errorToast } from '../../utils/toast';

type AlertState = {
  type: 'success' | 'error';
  message: string;
};

type ReorderModalProps = {
  open: boolean;
  alert: Alert | null;
  onClose: () => void;
};

const STAT_CARD_STYLES = {
  critical: 'from-rose-500 to-rose-600 shadow-rose-500/30',
  low: 'from-amber-500 to-amber-600 shadow-amber-500/30',
  total: 'from-slate-700 to-slate-800 shadow-slate-500/30',
};

const getAlertAccent = (alert: Alert) => {
  const stock = alert.currentStock ?? 0;

  if (stock === 0) {
    return {
      borderClass: 'border-l-4 border-rose-500',
      iconClass: 'text-rose-600 bg-rose-50 border-2 border-rose-100',
      badgeClass: 'bg-rose-100 text-rose-700 border border-rose-200',
      label: 'Out of Stock',
      urgency: 'critical',
    } as const;
  }

  if (stock < 10) {
    return {
      borderClass: 'border-l-4 border-rose-400',
      iconClass: 'text-rose-500 bg-rose-50 border-2 border-rose-100',
      badgeClass: 'bg-rose-50 text-rose-600 border border-rose-200',
      label: 'Critical Stock',
      urgency: 'high',
    } as const;
  }

  return {
    borderClass: 'border-l-4 border-amber-400',
    iconClass: 'text-amber-600 bg-amber-50 border-2 border-amber-100',
    badgeClass: 'bg-amber-50 text-amber-600 border border-amber-200',
    label: 'Low Stock',
    urgency: 'medium',
  } as const;
};

const formatCurrency = (value: number | undefined) => {
  if (typeof value !== 'number') {
    return '—';
  }

  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(value);
};

const ReorderModal = ({ open, alert, onClose }: ReorderModalProps) => {
  const [instructions, setInstructions] = useState('');
  const [sending, setSending] = useState(false);

  if (!open || !alert || !alert.product) {
    return null;
  }

  const { product } = alert;

  const handleSendRequest = async () => {
    setSending(true);
    try {
      // Send reorder request to purchasing system or staff
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated API call
      successToast('Reorder request sent successfully!');
      setInstructions('');
      onClose();
    } catch (error) {
      errorToast('Failed to send reorder request. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-8 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border-2 border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b-2 border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Reorder Product</h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">
              Notify purchasing to replenish stock
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close reorder modal"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">Product</p>
            <p className="text-lg font-bold text-slate-900">{product.productName}</p>
            <p className="text-xs font-mono font-bold text-slate-400">Code: {product.productCode}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
              <p className="text-xs font-bold uppercase tracking-wide text-rose-600/80">Current Stock</p>
              <p className="mt-1 text-2xl font-extrabold text-rose-600">{alert.currentStock ?? 'N/A'}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Reorder Level</p>
              <p className="mt-1 text-2xl font-extrabold text-slate-900">{alert.reorderLevel ?? 'Not set'}</p>
            </div>
          </div>

          <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
            <p className="text-sm font-bold text-blue-900 mb-1">Suggested Action</p>
            <p className="text-sm text-blue-700">
              Create a purchase request and notify your supplier to replenish this product. Add notes for the purchasing
              team below.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
              Instructions
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none h-24"
              placeholder="Add notes for purchasing (optional)"
            />
          </div>
        </div>

        <div className="flex gap-3 p-6 pt-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSendRequest}
            disabled={sending}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? 'Sending...' : 'Send Request'}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};

const SkeletonCard = () => (
  <div className="animate-pulse rounded-2xl border-2 border-slate-100 bg-white p-6 shadow-sm">
    <div className="flex items-start gap-5">
      <div className="h-14 w-14 rounded-xl bg-slate-100" />
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-6 w-24 rounded-full bg-slate-100" />
          <div className="h-5 w-16 rounded-full bg-slate-50" />
        </div>
        <div className="h-5 w-48 rounded-lg bg-slate-100" />
        <div className="h-4 w-64 rounded-lg bg-slate-50" />
      </div>
      <div className="text-right space-y-2">
        <div className="h-4 w-20 rounded-full bg-slate-50" />
        <div className="h-10 w-16 rounded-lg bg-slate-100" />
      </div>
    </div>
  </div>
);

const StockAlerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ critical: 0, low: 0 });
  const [alertMessage, setAlertMessage] = useState<AlertState | null>(null);
  const [reorderModalOpen, setReorderModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  const computeStats = useCallback((items: Alert[]) => {
    const critical = items.filter((item) => (item.currentStock ?? 0) < 10).length;
    const low = items.filter((item) => {
      const stock = item.currentStock ?? 0;
      return stock >= 10 && stock < 20;
    }).length;
    setStats({ critical, low });
  }, []);

  const fetchAlerts = useCallback(async (showRefreshing = false) => {
    if (!showRefreshing) {
      setLoading(true);
    }
    setError(null);

    try {
      // Get only stock-related alerts (not expiration)
      const [alertsResponse] = await Promise.all([
        alertService.getStockAlertsOnly(),
        alertService.checkStockLevels(),
      ]);

      // Filter only LowStock and OutOfStock alerts
      const stockOnlyAlerts = alertsResponse.filter(
        (a) => a.alertType === 'LowStock' || a.alertType === 'OutOfStock'
      );
      const sorted = stockOnlyAlerts.sort((a, b) => (a.currentStock ?? 0) - (b.currentStock ?? 0));
      setAlerts(sorted);
      computeStats(sorted);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Failed to load stock alerts.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [computeStats]);

  // SignalR real-time updates
  useEffect(() => {
    const handleLowStockAlert = () => {
      // Refresh alerts when a new low stock alert is received
      void fetchAlerts(true);
    };

    const handleStockUpdated = () => {
      // Refresh alerts when stock is updated (could resolve alerts)
      void fetchAlerts(true);
    };

    // Register SignalR handlers
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

  useEffect(() => {
    const interval = window.setInterval(() => {
      void fetchAlerts(true);
    }, 5 * 60 * 1000);

    return () => window.clearInterval(interval);
  }, [fetchAlerts]);

  useEffect(() => {
    if (!alertMessage) {
      return undefined;
    }

    const timer = window.setTimeout(() => setAlertMessage(null), 3500);
    return () => window.clearTimeout(timer);
  }, [alertMessage]);

  const handleViewDetails = (alert: Alert) => {
    setSelectedAlert(alert);
    setReorderModalOpen(true);
  };

  const handleResolveAlert = async (alertId: number) => {
    setResolvingId(alertId);

    try {
      const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
      const userId = currentUser.userId || 1;
      
      await alertService.resolveAlert(alertId, userId);
      setAlertMessage({ type: 'success', message: '✅ Alert resolved successfully! Great job managing inventory.' });
      await fetchAlerts(true);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Failed to resolve alert.';
      setAlertMessage({ type: 'error', message: `❌ ${message}` });
    } finally {
      setResolvingId(null);
    }
  };

  const criticalCount = stats.critical;
  const lowCount = stats.low;
  const totalAlerts = alerts.length;

  const sortedAlerts = useMemo(
    () => alerts.slice().sort((a, b) => (a.currentStock ?? 0) - (b.currentStock ?? 0)),
    [alerts],
  );

  return (
    <div className="space-y-8 p-6">
      {/* Header Section */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-lg shadow-rose-500/30">
            <BellRing className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">STOCK ALERTS</h1>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">
              Monitor inventory levels and take action
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className={`relative overflow-hidden rounded-2xl border-2 border-white/20 bg-gradient-to-br ${STAT_CARD_STYLES.critical} p-6 text-white shadow-lg hover:scale-[1.02] transition-transform duration-200`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <CircleAlert className="h-5 w-5 text-white" aria-hidden="true" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wide text-white/90">Critical Stock</p>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold tabular-nums tracking-tight">{criticalCount}</span>
                <span className="text-sm font-bold text-white/80 uppercase tracking-wide">items</span>
              </div>
              <p className="mt-2 text-xs font-medium text-white/80 bg-black/10 inline-block px-2 py-1 rounded-lg">Below 10 units in stock</p>
            </div>
          </div>
        </div>

        <div className={`relative overflow-hidden rounded-2xl border-2 border-white/20 bg-gradient-to-br ${STAT_CARD_STYLES.low} p-6 text-white shadow-lg hover:scale-[1.02] transition-transform duration-200`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <TrendingDown className="h-5 w-5 text-white" aria-hidden="true" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wide text-white/90">Low Stock</p>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold tabular-nums tracking-tight">{lowCount}</span>
                <span className="text-sm font-bold text-white/80 uppercase tracking-wide">items</span>
              </div>
              <p className="mt-2 text-xs font-medium text-white/80 bg-black/10 inline-block px-2 py-1 rounded-lg">Between 10-20 units</p>
            </div>
          </div>
        </div>

        <div className={`relative overflow-hidden rounded-2xl border-2 border-white/20 bg-gradient-to-br ${STAT_CARD_STYLES.total} p-6 text-white shadow-lg sm:col-span-2 lg:col-span-1 hover:scale-[1.02] transition-transform duration-200`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Package className="h-5 w-5 text-white" aria-hidden="true" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wide text-white/90">Total Alerts</p>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold tabular-nums tracking-tight">{totalAlerts}</span>
                <span className="text-sm font-bold text-white/80 uppercase tracking-wide">active</span>
              </div>
              <p className="mt-2 text-xs font-medium text-white/80 bg-black/10 inline-block px-2 py-1 rounded-lg">Requiring attention</p>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Messages */}
      {alertMessage ? (
        <div
          className={`flex items-center gap-3 border-l-4 px-6 py-4 rounded-r-xl shadow-sm animate-in slide-in-from-top-2 ${
            alertMessage.type === 'success'
              ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
              : 'border-rose-500 bg-rose-50 text-rose-800'
          }`}
        >
          {alertMessage.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600" aria-hidden="true" />
          )}
          <span className="font-bold text-sm">{alertMessage.message}</span>
        </div>
      ) : null}

      {error ? (
        <div className="flex items-center gap-3 border-l-4 border-rose-500 bg-rose-50 px-6 py-4 rounded-r-xl text-sm font-bold text-rose-800 shadow-sm">
          <AlertCircle className="h-5 w-5 text-rose-600" aria-hidden="true" />
          {error}
        </div>
      ) : null}

      {/* Alert Cards */}
      <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 uppercase tracking-wide">Active Alerts</h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">Items requiring immediate attention</p>
          </div>
          {!loading && sortedAlerts.length > 0 && (
            <span className="flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full uppercase tracking-wide animate-pulse">
              <Zap className="h-3 w-3" aria-hidden="true" />
              LIVE UPDATES
            </span>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }, (_, index) => <SkeletonCard key={`skeleton-alert-${index}`} />)}
          </div>
        ) : sortedAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm border-2 border-slate-100 mb-4">
              <PackageSearch className="h-8 w-8 text-slate-400" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">All Clear!</h3>
            <p className="mt-2 max-w-sm text-sm font-medium text-slate-500">
              No stock alerts at the moment. Your inventory levels are looking healthy.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedAlerts.map((alert) => {
              const accent = getAlertAccent(alert);
              const stock = alert.currentStock ?? 0;
              const product = alert.product;
              const stockPercentage = Math.min((stock / (alert.reorderLevel ?? 20)) * 100, 100);

              return (
                <div
                  key={alert.alertId}
                  className={`group rounded-xl border-2 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md ${accent.borderClass.replace('border-l-4', 'border-l-[6px]')} border-slate-100 hover:border-slate-200`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl shadow-sm ${accent.iconClass}`}>
                        <TriangleAlert className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-lg px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${accent.badgeClass}`}>
                            {accent.label}
                          </span>
                          <span className="text-xs font-bold font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                            {product?.productCode ?? '—'}
                          </span>
                        </div>
                        <h3 className="text-lg font-extrabold text-slate-900">{product?.productName ?? 'Unknown Product'}</h3>
                        <p className="text-sm font-medium text-slate-600">{alert.message}</p>
                      </div>
                    </div>

                    <div className="text-right min-w-[140px]">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Current Stock</p>
                      <p className={`text-3xl font-extrabold tabular-nums ${stock === 0 ? 'text-rose-600' : stock < 10 ? 'text-rose-500' : 'text-amber-600'}`}>
                        {stock}
                      </p>
                      <div className="mt-2 w-full">
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${stock === 0 ? 'bg-rose-500' : stock < 10 ? 'bg-rose-400' : 'bg-amber-400'}`}
                            style={{ width: `${stockPercentage}%` }}
                          />
                        </div>
                        <p className="mt-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">Reorder at {alert.reorderLevel ?? 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-3 border-t-2 border-slate-50 pt-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                      <span className="uppercase tracking-wide text-slate-400">Supplier:</span>
                      <span className="text-slate-700">{product?.supplierName ?? 'Not set'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                      <span className="uppercase tracking-wide text-slate-400">Price:</span>
                      <span className="text-slate-700">{formatCurrency(product?.unitPrice)}</span>
                    </div>
                    <div className="flex-1" />
                    <button
                      type="button"
                      onClick={() => handleResolveAlert(alert.alertId)}
                      disabled={resolvingId === alert.alertId}
                      className="rounded-xl bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 border border-emerald-200 transition-all hover:bg-emerald-100 hover:border-emerald-300 disabled:opacity-50 uppercase tracking-wide"
                    >
                      {resolvingId === alert.alertId ? 'Resolving...' : 'Mark Resolved'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleViewDetails(alert)}
                      className="flex items-center gap-1.5 rounded-xl border-2 border-blue-600 bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-700 hover:shadow-lg hover:scale-105 uppercase tracking-wide"
                    >
                      View Details
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ReorderModal
        open={reorderModalOpen}
        alert={selectedAlert}
        onClose={() => {
          setReorderModalOpen(false);
          setSelectedAlert(null);
        }}
      />
    </div>
  );
};

export default StockAlerts;
