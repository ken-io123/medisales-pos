import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Archive,
  CalendarClock,
  CheckCircle2,
  Eye,
  RefreshCw,
  TriangleAlert,
  X,
} from 'lucide-react';
import { expiryService } from '../../services/expiryService';
import { alertService } from '../../services/alertService';
import signalRService from '../../services/signalRService';
import type { ExpiringProduct, ExpiryStats } from '../../types/Expiry';
import { PH_LOCALE, PH_TIME_ZONE } from '../../utils/formatters';

type AlertState = {
  type: 'success' | 'error';
  message: string;
};

type FilterOption = {
  label: string;
  value: 'all' | '7' | '30' | '60';
  days?: number;
};

const FILTER_OPTIONS: FilterOption[] = [
  { label: 'All Items', value: 'all' },
  { label: '7 Days', value: '7', days: 7 },
  { label: '30 Days', value: '30', days: 30 },
  { label: '60 Days', value: '60', days: 60 },
];

const STAT_CARD_STYLES = {
  red: 'from-rose-500 to-rose-600 shadow-rose-500/30',
  orange: 'from-amber-500 to-amber-600 shadow-amber-500/30',
  yellow: 'from-yellow-400 to-yellow-500 shadow-yellow-400/30',
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleDateString(PH_LOCALE, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: PH_TIME_ZONE,
  });
};

const computeDaysLeft = (product: ExpiringProduct) => {
  if (typeof product.daysUntilExpiry === 'number') {
    return product.daysUntilExpiry;
  }

  if (!product.expiryDate) {
    return Number.POSITIVE_INFINITY;
  }

  const now = new Date();
  const expiry = new Date(product.expiryDate);
  const diff = expiry.getTime() - now.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

const getStatusInfo = (product: ExpiringProduct) => {
  const daysLeft = computeDaysLeft(product);

  if (daysLeft <= 0) {
    return {
      status: 'Expired',
      badgeClass: 'bg-rose-100 text-rose-700 border border-rose-200 font-bold',
    } as const;
  }

  if (daysLeft <= 7) {
    return {
      status: 'Critical',
      badgeClass: 'bg-rose-50 text-rose-600 border border-rose-200 font-bold',
    } as const;
  }

  if (daysLeft <= 30) {
    return {
      status: 'Warning',
      badgeClass: 'bg-orange-50 text-orange-600 border border-orange-200 font-bold',
    } as const;
  }

  if (daysLeft <= 60) {
    return {
      status: 'Monitor',
      badgeClass: 'bg-amber-50 text-amber-600 border border-amber-200 font-bold',
    } as const;
  }

  return {
    status: 'Stable',
    badgeClass: 'bg-emerald-50 text-emerald-600 border border-emerald-200 font-bold',
  } as const;
};

const getDaysLeftBadgeClass = (daysLeft: number) => {
  if (daysLeft <= 0) {
    return 'bg-rose-100 text-rose-700 border border-rose-200 font-bold';
  }
  if (daysLeft <= 7) {
    return 'bg-rose-50 text-rose-600 border border-rose-200 font-bold';
  }
  if (daysLeft <= 30) {
    return 'bg-orange-50 text-orange-600 border border-orange-200 font-bold';
  }
  if (daysLeft <= 60) {
    return 'bg-amber-50 text-amber-600 border border-amber-200 font-bold';
  }
  return 'bg-slate-50 text-slate-600 border border-slate-200 font-bold';
};

type ProductDetailsModalProps = {
  open: boolean;
  product: ExpiringProduct | null;
  onClose: () => void;
};

const ProductDetailsModal = ({ open, product, onClose }: ProductDetailsModalProps) => {
  if (!open || !product) {
    return null;
  }

  const daysLeft = computeDaysLeft(product);
  const statusInfo = getStatusInfo(product);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-8 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border-2 border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b-2 border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Product Details</h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">Detailed information about this inventory item</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close product details"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6">
          <dl className="grid gap-6 sm:grid-cols-2">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">Product Code</dt>
              <dd className="text-lg font-bold text-slate-900 font-mono">{product.productCode}</dd>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">Product Name</dt>
              <dd className="text-lg font-bold text-slate-900">{product.productName}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">Category</dt>
              <dd className="text-sm font-bold text-slate-900">{product.category || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">Supplier</dt>
              <dd className="text-sm font-bold text-slate-900">{product.supplierName || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">Stock</dt>
              <dd className="text-sm font-bold text-slate-900">{product.stockQuantity}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">Expiry Date</dt>
              <dd className="text-sm font-bold text-slate-900">{formatDate(product.expiryDate)}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">Days Left</dt>
              <dd className="inline-flex items-center gap-2">
                <span className={`rounded-lg px-3 py-1 text-xs font-extrabold uppercase tracking-wide ${getDaysLeftBadgeClass(daysLeft)}`}>
                  {Number.isFinite(daysLeft) ? `${Math.max(daysLeft, 0)} ${daysLeft === 1 ? 'day' : 'days'}` : 'N/A'}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">Status</dt>
              <dd className="inline-flex items-center gap-2">
                <span className={`rounded-lg px-3 py-1 text-xs font-extrabold uppercase tracking-wide ${statusInfo.badgeClass}`}>
                  {statusInfo.status}
                </span>
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Description</dt>
              <dd className="rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
                {product.description || 'No additional details provided.'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};

const ExpirationMonitoring = () => {
  const [stats, setStats] = useState<ExpiryStats | null>(null);
  const [products, setProducts] = useState<ExpiringProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterOption>(FILTER_OPTIONS[0]);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ExpiringProduct | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [archivingId, setArchivingId] = useState<number | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const statsResponse = await expiryService.getExpiryStats();
        setStats(statsResponse);
      } catch (caughtError) {
        console.warn('Unable to load expiry stats', caughtError);
      }
    };

    void loadStats();
  }, []);

  const fetchProducts = useCallback(async (days?: number, showRefreshing = false) => {
    if (!showRefreshing) {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await expiryService.getExpiringProducts(days, showArchived);
      setProducts(data);
      
      // Also trigger alert checks for expiration
      await alertService.checkStockLevels();
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Failed to load expiring products.';
      setError(message);
    } finally {
      if (!showRefreshing) {
        setLoading(false);
      }
    }
  }, [showArchived]);

  // SignalR real-time updates
  useEffect(() => {
    const handleExpirationAlert = () => {
      void fetchProducts(filter.days, true);
      // Refresh stats too
      expiryService.getExpiryStats().then(setStats).catch(console.warn);
    };

    const handleProductUpdated = () => {
      void fetchProducts(filter.days, true);
      expiryService.getExpiryStats().then(setStats).catch(console.warn);
    };

    signalRService.onExpirationAlert(handleExpirationAlert);
    signalRService.onProductUpdated(handleProductUpdated);

    return () => {
      signalRService.offExpirationAlert(handleExpirationAlert);
      signalRService.offProductUpdated(handleProductUpdated);
    };
  }, [fetchProducts, filter.days]);

  useEffect(() => {
    void fetchProducts(filter.days);
  }, [fetchProducts, filter]);

  useEffect(() => {
    if (!alert) {
      return undefined;
    }

    const timer = window.setTimeout(() => setAlert(null), 3500);
    return () => window.clearTimeout(timer);
  }, [alert]);

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const daysA = computeDaysLeft(a);
      const daysB = computeDaysLeft(b);
      return daysA - daysB;
    });
  }, [products]);

  const handleFilterChange = (value: FilterOption['value']) => {
    const option = FILTER_OPTIONS.find((item) => item.value === value) ?? FILTER_OPTIONS[0];
    setFilter(option);
  };

  const handleRefresh = () => {
    void fetchProducts(filter.days, true);
    expiryService.getExpiryStats().then(setStats).catch(console.warn);
  };

  const handleViewProduct = (product: ExpiringProduct) => {
    setSelectedProduct(product);
    setViewModalOpen(true);
  };

  const handleArchiveProduct = async (product: ExpiringProduct) => {
    const isArchived = product.isArchived;
    const action = isArchived ? 'restore' : 'archive';
    const confirmed = window.confirm(
      isArchived 
        ? `Restore ${product.productName}? This will add it back to active inventory lists.`
        : `Archive ${product.productName}? This will remove it from active inventory lists.`,
    );

    if (!confirmed) {
      return;
    }

    setArchivingId(product.productId);

    try {
      if (isArchived) {
        await expiryService.restoreProduct(product.productId);
        setAlert({ type: 'success', message: `${product.productName} restored successfully.` });
      } else {
        await expiryService.archiveProduct(product.productId);
        setAlert({ type: 'success', message: `${product.productName} archived successfully.` });
      }
      await fetchProducts(filter.days);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : `Failed to ${action} product.`;
      setAlert({ type: 'error', message });
    } finally {
      setArchivingId(null);
    }
  };

  const getStatValue = (value?: number) => value ?? 0;

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg shadow-orange-500/30">
          <CalendarClock className="h-6 w-6 text-white" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">EXPIRATION MONITORING</h1>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">
            Track products approaching expiry
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className={`relative overflow-hidden rounded-2xl border-2 border-white/20 bg-gradient-to-br ${STAT_CARD_STYLES.red} p-6 text-white shadow-lg hover:scale-[1.02] transition-transform duration-200`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <TriangleAlert className="h-5 w-5 text-white" aria-hidden="true" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wide text-white/90">7 Days</p>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold tabular-nums tracking-tight">{getStatValue(stats?.expiringIn7Days)}</span>
                <span className="text-sm font-bold text-white/80 uppercase tracking-wide">items</span>
              </div>
              <p className="mt-2 text-xs font-medium text-white/80 bg-black/10 inline-block px-2 py-1 rounded-lg">Expiring soon</p>
            </div>
          </div>
        </div>

        <div className={`relative overflow-hidden rounded-2xl border-2 border-white/20 bg-gradient-to-br ${STAT_CARD_STYLES.orange} p-6 text-white shadow-lg hover:scale-[1.02] transition-transform duration-200`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <CalendarClock className="h-5 w-5 text-white" aria-hidden="true" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wide text-white/90">30 Days</p>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold tabular-nums tracking-tight">{getStatValue(stats?.expiringIn30Days)}</span>
                <span className="text-sm font-bold text-white/80 uppercase tracking-wide">items</span>
              </div>
              <p className="mt-2 text-xs font-medium text-white/80 bg-black/10 inline-block px-2 py-1 rounded-lg">Needs attention</p>
            </div>
          </div>
        </div>

        <div className={`relative overflow-hidden rounded-2xl border-2 border-white/20 bg-gradient-to-br ${STAT_CARD_STYLES.yellow} p-6 text-white shadow-lg sm:col-span-2 lg:col-span-1 hover:scale-[1.02] transition-transform duration-200`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <CheckCircle2 className="h-5 w-5 text-white" aria-hidden="true" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wide text-white/90">60 Days</p>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold tabular-nums tracking-tight">{getStatValue(stats?.expiringIn60Days)}</span>
                <span className="text-sm font-bold text-white/80 uppercase tracking-wide">items</span>
              </div>
              <p className="mt-2 text-xs font-medium text-white/80 bg-black/10 inline-block px-2 py-1 rounded-lg">Monitor list</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Table Container */}
      <div className="space-y-6 rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-lg">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5 block">Filter By</label>
            <select
              value={filter.value}
              onChange={(event) => handleFilterChange(event.target.value as FilterOption['value'])}
              className="block w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-900 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10"
            >
              {FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="pt-6">
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition hover:bg-slate-100 hover:border-slate-300">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-xs font-bold uppercase tracking-wide text-slate-600">Show Archived</span>
            </label>
          </div>
        </div>

        {alert ? (
          <div
            className={`flex items-center gap-3 border-l-4 px-6 py-4 rounded-r-xl shadow-sm animate-in slide-in-from-top-2 ${
              alert.type === 'success'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                : 'border-rose-500 bg-rose-50 text-rose-800'
            }`}
          >
            {alert.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-600" aria-hidden="true" />
            )}
            <span className="font-bold text-sm">{alert.message}</span>
          </div>
        ) : null}

        {error ? (
          <div className="flex items-center gap-3 border-l-4 border-rose-500 bg-rose-50 px-6 py-4 rounded-r-xl text-sm font-bold text-rose-800 shadow-sm">
            <AlertCircle className="h-5 w-5 text-rose-600" aria-hidden="true" />
            <span className="flex-1">{error}</span>
            <button
              type="button"
              onClick={handleRefresh}
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-rose-600 border border-rose-200 transition hover:bg-rose-50 uppercase tracking-wide"
            >
              Retry
            </button>
          </div>
        ) : null}

        <div className="overflow-hidden rounded-xl border-2 border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wide text-slate-500">Code</th>
                <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wide text-slate-500">Product Name</th>
                <th className="px-6 py-4 text-right text-xs font-extrabold uppercase tracking-wide text-slate-500">Stock</th>
                <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wide text-slate-500">Expiry Date</th>
                <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wide text-slate-500">Days Left</th>
                <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-6 py-4 text-right text-xs font-extrabold uppercase tracking-wide text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-500">
                    <div className="flex items-center justify-center gap-3">
                      <RefreshCw className="h-5 w-5 animate-spin text-blue-600" aria-hidden="true" />
                      <span className="font-bold">Loading expiring products...</span>
                    </div>
                  </td>
                </tr>
              ) : null}

              {!loading && sortedProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-3 border-2 border-slate-100">
                        <CalendarClock className="h-6 w-6 text-slate-300" />
                      </div>
                      <p className="font-bold text-slate-900">No products found</p>
                      <p className="text-xs font-medium text-slate-500 mt-1">Try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              ) : null}

              {!loading
                ? sortedProducts.map((product) => {
                    const daysLeft = computeDaysLeft(product);
                    const statusInfo = getStatusInfo(product);

                    return (
                      <tr key={product.productId} className="transition-colors hover:bg-slate-50/80">
                        <td className="px-6 py-4 text-xs font-bold text-slate-500 font-mono">
                          {product.productCode}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">{product.productName}</td>
                        <td className="px-6 py-4 text-right text-sm font-bold tabular-nums text-slate-900">{product.stockQuantity}</td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-600">{formatDate(product.expiryDate)}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex rounded-lg px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${getDaysLeftBadgeClass(daysLeft)}`}>
                            {Number.isFinite(daysLeft) ? `${Math.max(daysLeft, 0)} days` : 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex rounded-lg px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${statusInfo.badgeClass}`}>
                            {statusInfo.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleViewProduct(product)}
                              className="flex items-center gap-1.5 rounded-lg border-2 border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition-all hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 uppercase tracking-wide"
                            >
                              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => handleArchiveProduct(product)}
                              disabled={archivingId === product.productId}
                              className={`flex items-center gap-1.5 rounded-lg border-2 px-3 py-1.5 text-xs font-bold transition-all disabled:opacity-50 uppercase tracking-wide ${
                                product.isArchived
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300'
                                  : 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:border-rose-300'
                              }`}
                            >
                              <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                              {archivingId === product.productId 
                                ? (product.isArchived ? 'Restoring...' : 'Archiving...') 
                                : (product.isArchived ? 'Restore' : 'Archive')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                : null}
            </tbody>
          </table>
        </div>
      </div>

      <ProductDetailsModal
        open={viewModalOpen}
        product={selectedProduct}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedProduct(null);
        }}
      />
    </div>
  );
};

export default ExpirationMonitoring;
