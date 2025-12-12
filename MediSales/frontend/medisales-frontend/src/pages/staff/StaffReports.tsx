import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDownToLine, ArrowUpRight, BarChart3 } from 'lucide-react';
import { reportsService } from '../../services/reportsService';
import { transactionService } from '../../services/transactionService';
import { parseApiDate } from '../../utils/formatters';
import type { SalesMetrics } from '../../types/Reports';
import type { Transaction } from '../../types/Transaction';

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('en-PH');

const timeFormatter = new Intl.DateTimeFormat('en-PH', {
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Asia/Manila', // Philippines timezone (UTC+8)
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-PH', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Asia/Manila', // Philippines timezone (UTC+8)
});

const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
};

const StaffReports = () => {
  const [{ start, end }, setRange] = useState(() => getTodayRange());
  const [metrics, setMetrics] = useState<SalesMetrics | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRange(getTodayRange());
    }, 60 * 1000);

    return () => window.clearInterval(timer);
  }, []);

  const loadMetrics = useCallback(async () => {
    setLoadingMetrics(true);
    try {
      const data = await reportsService.getStaffDailySales();
      setMetrics(data);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Unable to load sales metrics right now.';
      setError(message);
    } finally {
      setLoadingMetrics(false);
    }
  }, []);

  const loadTransactions = useCallback(async () => {
    setLoadingTransactions(true);
    try {
      const response = await transactionService.getTransactions({
        startDate: start,
        endDate: end,
        pageSize,
        page,
      });
      setTransactions(response.data);
      setTotalCount(response.total);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Unable to load today\'s transactions.';
      setError(message);
    } finally {
      setLoadingTransactions(false);
    }
  }, [end, start, page, pageSize]);

  useEffect(() => {
    void loadMetrics();
    void loadTransactions();
  }, [loadMetrics, loadTransactions]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await transactionService.exportTransactions({
        startDate: start,
        endDate: end,
      });
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Unable to export daily report.';
      setError(message);
    } finally {
      setExporting(false);
    }
  };

  const statCards = useMemo(
    () => [
      {
        label: 'Total Sales',
        value: metrics ? currencyFormatter.format(metrics.totalSales ?? 0) : '--',
        accent: 'from-emerald-500/20 to-emerald-500/5 text-emerald-700',
      },
      {
        label: 'Transactions',
        value: metrics ? numberFormatter.format(metrics.transactionCount ?? 0) : '--',
        accent: 'from-sky-500/20 to-sky-500/5 text-sky-700',
      },
      {
        label: 'Average Ticket',
        value: metrics ? currencyFormatter.format(metrics.averageTransactionAmount ?? 0) : '--',
        accent: 'from-violet-500/20 to-violet-500/5 text-violet-700',
      },
    ],
    [metrics],
  );

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Daily Sales Snapshot</h1>
          <p className="mt-2 text-sm font-medium text-slate-600">Quick access to today's performance so you can monitor sales while serving customers.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void handleExport()}
            className="flex items-center gap-2 rounded-xl border-2 border-blue-600 bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
            disabled={exporting}
          >
            <ArrowDownToLine className="h-4 w-4" aria-hidden="true" />
            {exporting ? 'Exporting...' : 'Export Excel'}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border-2 border-rose-200 bg-rose-50 p-6 text-sm font-bold text-rose-800 shadow-md">
          {error}
        </div>
      ) : null}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`rounded-xl border-2 border-slate-200 bg-gradient-to-br ${card.accent} p-6 shadow-lg hover:shadow-xl transition-shadow`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-600">{card.label}</span>
              <ArrowUpRight className="h-5 w-5 text-slate-400" aria-hidden="true" />
            </div>
            <p className="mt-4 text-3xl font-extrabold text-slate-900">{loadingMetrics ? 'Loading…' : card.value}</p>
          </div>
        ))}
      </div>

      {/* Transactions Table */}
      <div className="rounded-2xl border-2 border-slate-200 bg-white shadow-lg">
        <div className="border-b-2 border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Today's Transactions</h2>
              <p className="text-sm font-medium text-slate-600">Latest records update automatically throughout the day.</p>
            </div>
            <BarChart3 className="h-6 w-6 text-blue-600" aria-hidden="true" />
          </div>
        </div>

        <div className="max-h-[500px] overflow-y-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="sticky top-0 bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
              <tr className="text-xs font-bold uppercase tracking-wide text-slate-700">
                <th className="px-5 py-4">Code</th>
                <th className="px-5 py-4">Customer</th>
                <th className="px-5 py-4">Payment</th>
                <th className="px-5 py-4 text-right">Items</th>
                <th className="px-5 py-4 text-right">Total</th>
                <th className="px-5 py-4">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingTransactions ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm font-bold text-slate-500">
                    Loading today's transactions...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm font-bold text-slate-500">
                    No transactions recorded yet today.
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction.transactionId} className="transition hover:bg-slate-50">
                    <td className="px-5 py-4 text-sm font-bold text-slate-900">{transaction.transactionCode}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-700">{transaction.customerName || 'Walk-in Customer'}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-700">{transaction.paymentMethod}</td>
                    <td className="px-5 py-4 text-right text-sm font-bold text-slate-900">{transaction.totalItems}</td>
                    <td className="px-5 py-4 text-right text-sm font-bold text-slate-900">
                      {currencyFormatter.format(transaction.totalAmount)}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                      <div className="space-y-1">
                        <span className="block">{transaction.transactionDate ? timeFormatter.format(parseApiDate(transaction.transactionDate)) : '--'}</span>
                        <span className="block text-xs font-semibold text-slate-500">
                          {transaction.transactionDate ? dateTimeFormatter.format(parseApiDate(transaction.transactionDate)) : '--'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loadingTransactions && transactions.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t-2 border-slate-200 bg-slate-50 px-6 py-4">
            <p className="text-sm font-medium text-slate-600">
              Showing <span className="font-bold text-slate-900">{(page - 1) * pageSize + 1}</span> to <span className="font-bold text-slate-900">{Math.min(page * pageSize, totalCount)}</span> of <span className="font-bold text-slate-900">{totalCount}</span> results
            </p>
            <nav className="isolate inline-flex rounded-md shadow-sm gap-2" aria-label="Pagination">
              <button
                type="button"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: Math.max(Math.ceil(totalCount / pageSize), 1) }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === Math.max(Math.ceil(totalCount / pageSize), 1) || Math.abs(p - page) <= 1)
                  .map((pageNum, index, array) => {
                    const isGap = index > 0 && pageNum - array[index - 1] > 1;
                    return (
                      <div key={pageNum} className="flex items-center">
                        {isGap && <span className="px-2 text-sm font-medium text-slate-500">...</span>}
                        <button
                          onClick={() => setPage(pageNum)}
                          className={`rounded-lg px-4 py-2 text-sm font-medium ${
                            page === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      </div>
                    );
                  })}
              </div>
              <button
                type="button"
                onClick={() => setPage(page + 1)}
                disabled={page * pageSize >= totalCount}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffReports;
