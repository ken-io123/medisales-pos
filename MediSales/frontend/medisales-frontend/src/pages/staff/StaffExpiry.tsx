import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CalendarClock, CheckCircle2, Clock, PackageOpen, Send } from 'lucide-react';
import { expiryService } from '../../services/expiryService';
import { messageService } from '../../services/messageService';
import signalRService from '../../services/signalRService';
import { useAuth } from '../../hooks/useAuth';
import type { ExpiringProduct } from '../../types/Expiry';
import { PH_LOCALE, PH_TIME_ZONE } from '../../utils/formatters';

const formatDate = (value?: string | null) => {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleDateString(PH_LOCALE, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
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
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return Number.isFinite(days) ? days : Number.POSITIVE_INFINITY;
};

const getCardAccent = (daysLeft: number) => {
  if (daysLeft <= 0) {
    return {
      header: 'bg-gradient-to-r from-rose-500 to-red-600',
      border: 'border-rose-500',
      badge: 'bg-rose-100 text-rose-700 border border-rose-200',
      icon: 'text-rose-600 bg-rose-50',
      label: 'EXPIRED',
      textColor: 'text-rose-600',
      shadow: 'shadow-rose-500/10',
    } as const;
  }

  if (daysLeft <= 7) {
    return {
      header: 'bg-gradient-to-r from-orange-500 to-red-500',
      border: 'border-orange-500',
      badge: 'bg-orange-100 text-orange-700 border border-orange-200',
      icon: 'text-orange-600 bg-orange-50',
      label: 'CRITICAL',
      textColor: 'text-orange-600',
      shadow: 'shadow-orange-500/10',
    } as const;
  }

  if (daysLeft <= 30) {
    return {
      header: 'bg-gradient-to-r from-amber-400 to-orange-500',
      border: 'border-amber-400',
      badge: 'bg-amber-100 text-amber-700 border border-amber-200',
      icon: 'text-amber-600 bg-amber-50',
      label: 'WARNING',
      textColor: 'text-amber-600',
      shadow: 'shadow-amber-500/10',
    } as const;
  }

  return {
    header: 'bg-gradient-to-r from-blue-400 to-indigo-500',
    border: 'border-blue-400',
    badge: 'bg-blue-100 text-blue-700 border border-blue-200',
    icon: 'text-blue-600 bg-blue-50',
    label: 'UPCOMING',
    textColor: 'text-blue-600',
    shadow: 'shadow-blue-500/10',
  } as const;
};

const StaffExpiry = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<ExpiringProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifyingId, setNotifyingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchExpiringProducts = useCallback(async (showRefreshing = false) => {
    setError(null);
    if (!showRefreshing) {
      setLoading(true);
    }

    try {
      const data = await expiryService.getExpiringProducts();
      setProducts(data);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Unable to load expiring products right now.';
      setError(message);
    } finally {
      if (!showRefreshing) {
        setLoading(false);
      }
    }
  }, []);

  // SignalR real-time updates
  useEffect(() => {
    const handleExpirationAlert = () => {
      void fetchExpiringProducts(true);
    };

    signalRService.onExpirationAlert(handleExpirationAlert);

    return () => {
      signalRService.offExpirationAlert(handleExpirationAlert);
    };
  }, [fetchExpiringProducts]);

  useEffect(() => {
    void fetchExpiringProducts();
  }, [fetchExpiringProducts]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = window.setInterval(() => {
      void fetchExpiringProducts(true);
    }, 5 * 60 * 1000);

    return () => window.clearInterval(interval);
  }, [fetchExpiringProducts]);

  useEffect(() => {
    if (!feedback) {
      return undefined;
    }

    const timer = window.setTimeout(() => setFeedback(null), 3500);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const handleNotifyAdmin = async (product: ExpiringProduct) => {
    if (!user) {
      setFeedback({ type: 'error', message: 'You need to be logged in to notify the admin team.' });
      return;
    }

    setNotifyingId(product.productId);

    try {
      const daysLeft = computeDaysLeft(product);
      const message = `Expiration alert for ${product.productName} (${product.productCode}). Expires: ${formatDate(product.expiryDate)}. Days left: ${daysLeft}. Stock: ${product.stockQuantity}. Please review and take action.`;
      
      await messageService.sendMessageToAdmin(message, user.userId);
      
      setFeedback({ type: 'success', message: 'Admin has been notified about the expiring product.' });
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Failed to notify the admin.';
      setFeedback({ type: 'error', message });
    } finally {
      setNotifyingId(null);
    }
  };

  const sortedProducts = useMemo(
    () => products.slice().sort((a, b) => computeDaysLeft(a) - computeDaysLeft(b)),
    [products],
  );

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/30">
              <CalendarClock className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Expiry Watchlist</h1>
              <p className="text-sm font-medium text-slate-500">
                Monitor and report expiring inventory
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-sm ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200' : 'bg-rose-50 text-rose-800 ring-1 ring-rose-200'}`}>
          {feedback.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <AlertCircle className="h-5 w-5 text-rose-500" />}
          {feedback.message}
        </div>
      )}

      {error ? (
        <div className="flex items-center gap-3 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800 ring-1 ring-rose-200">
          <AlertCircle className="h-5 w-5 text-rose-500" aria-hidden="true" />
          {error}
        </div>
      ) : null}

      {/* Product Cards */}
      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="animate-pulse rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-slate-100" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 w-24 rounded-full bg-slate-100" />
                  <div className="h-4 w-40 rounded-lg bg-slate-100" />
                  <div className="h-3 w-32 rounded-lg bg-slate-50" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : sortedProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
            <PackageOpen className="h-8 w-8 text-slate-400" aria-hidden="true" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-900">No Expiring Products</h3>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Inventory looks clear for now. Check back later or consult the admin team.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {sortedProducts.map((product) => {
            const daysLeft = computeDaysLeft(product);
            const accent = getCardAccent(daysLeft);
            return (
              <div key={product.productId} className={`group relative overflow-hidden rounded-xl bg-white p-5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border-2 ${accent.border} ${accent.shadow}`}>
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-sm ${accent.icon}`}>
                    <Clock className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${accent.badge}`}>
                        {accent.label}
                      </span>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                        {product.productCode}
                      </span>
                    </div>
                    <h3 className="mt-2 truncate text-lg font-bold text-slate-900">{product.productName}</h3>
                    
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <div className="rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-200/50">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Stock</p>
                        <p className="text-sm font-bold text-slate-900">{product.stockQuantity}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-200/50">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Expires</p>
                        <p className="text-sm font-bold text-slate-900">{formatDate(product.expiryDate)}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-200/50">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Days Left</p>
                        <p className={`text-sm font-bold tabular-nums ${accent.textColor}`}>
                          {Number.isFinite(daysLeft) ? Math.max(daysLeft, 0) : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {product.category && (
                      <p className="mt-3 text-xs font-medium text-slate-500">
                        Category: {product.category}
                      </p>
                    )}

                    <div className="mt-4 flex justify-end border-t border-slate-100 pt-4">
                      <button
                        type="button"
                        onClick={() => void handleNotifyAdmin(product)}
                        disabled={notifyingId === product.productId}
                        className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                      >
                        <Send className={`h-3.5 w-3.5 ${notifyingId === product.productId ? 'animate-pulse' : ''}`} />
                        {notifyingId === product.productId ? 'Sending...' : 'Notify Admin'}
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

export default StaffExpiry;
