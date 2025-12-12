import { type ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  CalendarClock,
  CalendarDays,
  Download,
  Eye,
  Filter,
  Printer,
  Search,
  X,
  CreditCard,
  Banknote,
  Smartphone,
  ShieldCheck,
  History
} from 'lucide-react';
import TransactionDetailsModal from '../../components/admin/TransactionDetailsModal';
import VoidTransactionModal from '../../components/admin/VoidTransactionModal';
import { transactionService } from '../../services/transactionService';
import type { Receipt, ReceiptItem, Transaction } from '../../types/Transaction';
import { toast } from 'react-hot-toast';
import { PH_LOCALE, PH_TIME_ZONE, parseApiDate } from '../../utils/formatters';

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
});

const formatDate = (value: string) =>
  parseApiDate(value).toLocaleDateString(PH_LOCALE, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: PH_TIME_ZONE,
  });

const formatTime = (value: string) =>
  parseApiDate(value).toLocaleTimeString(PH_LOCALE, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: PH_TIME_ZONE,
  });

type FilterState = {
  search: string;
  startDate: string;
  endDate: string;
  status: 'all' | 'active' | 'voided';
  staffId?: number;
  paymentMethod?: string;
  minAmount?: number;
  maxAmount?: number;
  showFilters: boolean;
};

type PaginationState = {
  page: number;
  pageSize: number;
};

const DEFAULT_PAGE_SIZE = 10;

// Debounce hook for search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState<FilterState>({ 
    search: '', 
    startDate: '', 
    endDate: '', 
    status: 'active',
    showFilters: false
  });
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, pageSize: DEFAULT_PAGE_SIZE });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [transactionToVoid, setTransactionToVoid] = useState<Transaction | null>(null);

  // Debounce search term to prevent excessive API calls
  const debouncedSearch = useDebounce(filter.search, 500);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);

    try {
      const includeVoided = filter.status === 'all' || filter.status === 'voided';
      const { data, total } = await transactionService.getTransactions({
        page: pagination.page,
        pageSize: pagination.pageSize,
        search: debouncedSearch || undefined,
        startDate: filter.startDate || undefined,
        endDate: filter.endDate || undefined,
        staffId: filter.staffId,
        paymentMethod: filter.paymentMethod,
        minAmount: filter.minAmount,
        maxAmount: filter.maxAmount,
        status: filter.status,
        includeVoided,
      });

      // Filter by status on client side if needed (though API should handle it)
      let filteredData = data;
      if (filter.status === 'active') {
        filteredData = data.filter(t => !t.isVoided);
      } else if (filter.status === 'voided') {
        filteredData = data.filter(t => t.isVoided);
      }

      setTransactions(filteredData);
      setTotalCount(total);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [
    debouncedSearch, 
    filter.startDate, 
    filter.endDate, 
    filter.status, 
    filter.staffId, 
    filter.paymentMethod, 
    filter.minAmount, 
    filter.maxAmount, 
    pagination.page, 
    pagination.pageSize
  ]);

  useEffect(() => {
    void fetchTransactions();
  }, [fetchTransactions]);

  const pageCount = useMemo(
    () => Math.max(Math.ceil(totalCount / pagination.pageSize), 1),
    [totalCount, pagination.pageSize],
  );

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFilter((previous) => ({ ...previous, search: value }));
    setPagination((previous) => ({ ...previous, page: 1 }));
  };

  const handleDateChange = (key: keyof Pick<FilterState, 'startDate' | 'endDate'>, value: string) => {
    setFilter((previous) => ({ ...previous, [key]: value }));
    setPagination((previous) => ({ ...previous, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilter({ search: '', startDate: '', endDate: '', status: 'active', showFilters: false });
    setPagination({ page: 1, pageSize: DEFAULT_PAGE_SIZE });
    toast.success('Filters cleared');
  };

  const handleQuickFilter = async (period: 'today' | 'yesterday' | 'week' | 'month') => {
    const today = new Date();
    const startDate = new Date(today);
    
    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'yesterday':
        startDate.setDate(today.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(today.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate.setMonth(today.getMonth() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;
    }

    const endDate = period === 'yesterday' ? new Date(startDate) : new Date(today);
    if (period === 'yesterday') {
      endDate.setHours(23, 59, 59, 999);
    }

    setFilter(prev => ({
      ...prev,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    }));
    setPagination({ page: 1, pageSize: DEFAULT_PAGE_SIZE });
    toast.success(`Applied ${period} filter`);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await transactionService.exportTransactions({
        search: filter.search || undefined,
        startDate: filter.startDate || undefined,
        endDate: filter.endDate || undefined,
      });
      toast.success('Export started');
    } catch (error) {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handlePrintReceipt = async (transactionId: number) => {
    try {
      const receipt: Receipt = await transactionService.getReceipt(transactionId);
      
      // Open a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;
      
      // Build receipt HTML
      const receiptHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Receipt - ${receipt.transactionCode}</title>
          <style>
            body { font-family: 'Courier New', monospace; max-width: 300px; margin: 20px auto; background: #fff; color: #000; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .row { display: flex; justify-content: space-between; margin: 5px 0; }
            .items { border-bottom: 1px dashed #000; padding: 10px 0; margin-bottom: 10px; }
            .total { font-weight: bold; font-size: 1.2em; margin-top: 10px; border-top: 1px dashed #000; padding-top: 10px; }
            .footer { text-align: center; margin-top: 20px; font-size: 0.8em; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h2 style="margin: 0;">MediSales POS</h2>
            <p style="margin: 5px 0;">Official Receipt</p>
            <br/>
            <p style="margin: 5px 0;">Ref: ${receipt.transactionCode}</p>
            <p style="margin: 5px 0;">${parseApiDate(receipt.dateTime).toLocaleString(PH_LOCALE, { timeZone: PH_TIME_ZONE })}</p>
            <p style="margin: 5px 0;">Cashier: ${receipt.cashier}</p>
          </div>
          <div class="items">
            ${receipt.items.map((item: ReceiptItem) => `
              <div style="margin-bottom: 5px;">
                <div>${item.productName}</div>
                <div class="row">
                  <span>${item.quantity} x ₱${(item.subtotal / item.quantity).toFixed(2)}</span>
                  <span>₱${item.subtotal.toFixed(2)}</span>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="row"><span>Subtotal:</span><span>₱${receipt.subtotal.toFixed(2)}</span></div>
          <div class="row total"><span>TOTAL:</span><span>₱${receipt.total.toFixed(2)}</span></div>
          <div class="row"><span>Payment (${receipt.paymentMethod}):</span><span>₱${receipt.amountPaid.toFixed(2)}</span></div>
          <div class="row"><span>Change:</span><span>₱${receipt.changeAmount.toFixed(2)}</span></div>
          
          <div class="footer">
            <p>Thank you for your purchase!</p>
            <p>This serves as your official receipt.</p>
          </div>
          <br/>
          <button onclick="window.print()" style="width: 100%; padding: 10px; cursor: pointer; background: #000; color: #fff; border: none; font-weight: bold;">PRINT RECEIPT</button>
        </body>
        </html>
      `;
      
      printWindow.document.write(receiptHTML);
      printWindow.document.close();
    } catch (error) {
      console.error('Failed to load receipt', error);
      toast.error('Failed to load receipt');
    }
  };

  const handleOpenDetails = async (transactionId: number) => {
    try {
      const transaction = await transactionService.getTransactionById(transactionId);
      setSelectedTransaction(transaction);
      setModalOpen(true);
    } catch (error) {
      console.error('Failed to load transaction details', error);
      toast.error('Could not load details');
    }
  };

  const handleVoidTransaction = async (transactionId: number, voidReason: string) => {
    try {
      await transactionService.voidTransaction(transactionId, voidReason);
      toast.success('Transaction voided successfully');
      setTransactionToVoid(null);
      await fetchTransactions();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to void transaction';
      toast.error(message);
      throw error;
    }
  };

  const handleOpenVoidModal = (transaction: Transaction) => {
    setTransactionToVoid(transaction);
  };

  const isTransactionTooOld = (createdAt: string) => {
    const transactionDate = parseApiDate(createdAt);
    const now = new Date();
    const hoursSince = (now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60);
    return hoursSince > 24;
  };

  const paymentMethodConfig: Record<string, { class: string, icon: any }> = {
    Cash: { class: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: Banknote },
    CreditCard: { class: 'bg-blue-100 text-blue-800 border-blue-200', icon: CreditCard },
    DebitCard: { class: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: CreditCard },
    GCash: { class: 'bg-sky-100 text-sky-800 border-sky-200', icon: Smartphone },
    Insurance: { class: 'bg-violet-100 text-violet-800 border-violet-200', icon: ShieldCheck },
  };

  const currentItemsLabel = useMemo(() => {
    const start = (pagination.page - 1) * pagination.pageSize + 1;
    const end = Math.min(pagination.page * pagination.pageSize, totalCount);
    return totalCount ? `${start}-${end} of ${totalCount}` : '0 results';
  }, [pagination.page, pagination.pageSize, totalCount]);

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30">
            <History className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">TRANSACTION HISTORY</h1>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">
              Search, filter, and manage sales records
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-2 rounded-xl border-2 border-blue-600 bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-105 transition-all disabled:opacity-75 disabled:hover:scale-100 uppercase tracking-wide"
            disabled={exporting}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            {exporting ? 'EXPORTING...' : 'EXPORT EXCEL'}
          </button>
        </div>
      </div>

      {/* Filters Card */}
      <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-lg">
        {/* Quick Filter Buttons */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void handleQuickFilter('today')}
            className="flex items-center gap-2 rounded-xl border-2 border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-700 shadow-sm hover:bg-emerald-100 hover:border-emerald-300 hover:shadow-md transition-all uppercase tracking-wide"
          >
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            Today
          </button>
          <button
            type="button"
            onClick={() => void handleQuickFilter('yesterday')}
            className="flex items-center gap-2 rounded-xl border-2 border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-700 shadow-sm hover:bg-blue-100 hover:border-blue-300 hover:shadow-md transition-all uppercase tracking-wide"
          >
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            Yesterday
          </button>
          <button
            type="button"
            onClick={() => void handleQuickFilter('week')}
            className="flex items-center gap-2 rounded-xl border-2 border-purple-200 bg-purple-50 px-4 py-2.5 text-xs font-bold text-purple-700 shadow-sm hover:bg-purple-100 hover:border-purple-300 hover:shadow-md transition-all uppercase tracking-wide"
          >
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            Last 7 Days
          </button>
          <button
            type="button"
            onClick={() => void handleQuickFilter('month')}
            className="flex items-center gap-2 rounded-xl border-2 border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-700 shadow-sm hover:bg-amber-100 hover:border-amber-300 hover:shadow-md transition-all uppercase tracking-wide"
          >
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            Last 30 Days
          </button>
          <button
            type="button"
            onClick={() => setFilter(prev => ({ ...prev, showFilters: !prev.showFilters }))}
            className={`flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-xs font-bold shadow-sm transition-all uppercase tracking-wide ${
              filter.showFilters 
                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <Filter className="h-3.5 w-3.5" aria-hidden="true" />
            {filter.showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        {/* Advanced Filters Panel */}
        {filter.showFilters && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 border-2 border-slate-100 rounded-2xl bg-slate-50/50 animate-in fade-in slide-in-from-top-2">
            <label className="block">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                <Calendar className="h-3.5 w-3.5" aria-hidden="true" /> Start Date
              </span>
              <input
                type="date"
                value={filter.startDate}
                onChange={(event) => handleDateChange('startDate', event.target.value)}
                className="w-full border-2 border-slate-200 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
              />
            </label>
            <label className="block">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" /> End Date
              </span>
              <input
                type="date"
                value={filter.endDate}
                onChange={(event) => handleDateChange('endDate', event.target.value)}
                className="w-full border-2 border-slate-200 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
              />
            </label>
            <label className="block">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                Payment Method
              </span>
              <select
                value={filter.paymentMethod || ''}
                onChange={(e) => {
                  setFilter(prev => ({ ...prev, paymentMethod: e.target.value || undefined }));
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full border-2 border-slate-200 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
              >
                <option value="">All Methods</option>
                <option value="Cash">Cash</option>
                <option value="CreditCard">Credit Card</option>
                <option value="DebitCard">Debit Card</option>
                <option value="GCash">GCash</option>
                <option value="Insurance">Insurance</option>
              </select>
            </label>
            <label className="block">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                Min Amount
              </span>
              <input
                type="number"
                value={filter.minAmount || ''}
                onChange={(e) => {
                  setFilter(prev => ({ ...prev, minAmount: e.target.value ? Number(e.target.value) : undefined }));
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                placeholder="₱0.00"
                className="w-full border-2 border-slate-200 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
              />
            </label>
            <label className="block">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                Max Amount
              </span>
              <input
                type="number"
                value={filter.maxAmount || ''}
                onChange={(e) => {
                  setFilter(prev => ({ ...prev, maxAmount: e.target.value ? Number(e.target.value) : undefined }));
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                placeholder="₱0.00"
                className="w-full border-2 border-slate-200 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
              />
            </label>
          </div>
        )}

        {/* Main Search and Status Filter */}
        <div className="space-y-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" aria-hidden="true" />
            <input
              value={filter.search}
              onChange={handleSearchChange}
              placeholder="Search by transaction code..."
              className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-12 py-4 text-sm font-bold text-slate-900 shadow-sm transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 placeholder:font-medium placeholder:text-slate-400"
            />
            {loading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                Status Filter
              </label>
              <select
                value={filter.status}
                onChange={(e) => {
                  setFilter(prev => ({ ...prev, status: e.target.value as 'all' | 'active' | 'voided' }));
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 shadow-sm transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10"
              >
                <option value="active">Active Transactions</option>
                <option value="voided">Voided Transactions</option>
                <option value="all">All Transactions</option>
              </select>
            </div>

            {(filter.startDate || filter.endDate || filter.search || filter.status !== 'active' || filter.paymentMethod || filter.minAmount || filter.maxAmount) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="flex items-center gap-2 rounded-xl border-2 border-rose-200 bg-rose-50 px-6 py-3 text-xs font-bold text-rose-700 shadow-sm hover:bg-rose-100 hover:border-rose-300 hover:shadow-md transition-all mt-auto uppercase tracking-wide"
              >
                <X className="h-4 w-4" />
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-lg">
        <div className="max-h-[600px] overflow-x-auto overflow-y-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="sticky top-0 z-10 bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-slate-200">
              <tr className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                <th className="px-6 py-4">Transaction ID</th>
                <th className="px-6 py-4">Date &amp; Time</th>
                <th className="px-6 py-4">Staff</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4 text-right">Count</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Discount</th>
                <th className="px-6 py-4 text-right">Total</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && transactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Loading transactions...</p>
                    </div>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Search className="h-12 w-12 text-slate-300" />
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">No transactions found</p>
                      <p className="text-xs text-slate-400">Try adjusting your filters or search terms</p>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => {
                  const tooOld = isTransactionTooOld(transaction.createdAt);
                  const canVoid = !transaction.isVoided && !tooOld;
                  const PaymentIcon = paymentMethodConfig[transaction.paymentMethod]?.icon || Banknote;
                  const paymentClass = paymentMethodConfig[transaction.paymentMethod]?.class || 'bg-slate-100 text-slate-700 border-slate-200';
                  
                  return (
                  <tr 
                    key={transaction.transactionId} 
                    className={`group transition-all duration-200 hover:bg-slate-50 ${
                      transaction.isVoided ? 'bg-rose-50/50' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className={`inline-block rounded-lg px-3 py-1.5 font-mono text-xs font-bold shadow-sm border ${
                          transaction.isVoided 
                            ? 'bg-rose-100 text-rose-800 border-rose-200 line-through decoration-2' 
                            : 'bg-slate-100 text-slate-700 border-slate-200 group-hover:bg-white group-hover:border-blue-200 group-hover:text-blue-700'
                        }`}>
                          {transaction.transactionCode}
                        </span>
                        {transaction.isVoided && (
                          <div className="mt-1">
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                              VOIDED
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{formatDate(transaction.createdAt)}</div>
                      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">{formatTime(transaction.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-700">{transaction.staffName || 'Unassigned'}</td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-600 max-w-[200px]">
                      <div className="truncate" title={transaction.itemsSummary}>
                        {transaction.itemsSummary || 'No items'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-slate-900">{transaction.totalItems}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${paymentClass}`}
                      >
                        <PaymentIcon className="h-3 w-3" />
                        {transaction.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {(transaction.discountAmount && transaction.discountAmount > 0) || (transaction.totalDiscount && transaction.totalDiscount > 0) ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                            {currencyFormatter.format(transaction.discountAmount || transaction.totalDiscount || 0)}
                          </span>
                          {transaction.discountType && transaction.discountType !== 'None' && (
                            <div className="text-[10px] font-bold uppercase tracking-wide text-amber-600 mt-1">
                              {transaction.discountType}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-slate-300 uppercase">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className={`text-right text-sm font-extrabold ${
                          transaction.isVoided ? 'text-rose-600 line-through decoration-2' : 'text-slate-900'
                        }`}>
                          {currencyFormatter.format(transaction.totalAmount)}
                        </div>
                        {transaction.isVoided && transaction.voidReason && (
                          <div className="text-xs text-rose-700 text-right font-medium italic">
                            "{transaction.voidReason}"
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => void handleOpenDetails(transaction.transactionId)}
                          className="p-2 rounded-lg border-2 border-blue-100 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:border-blue-300 transition-all"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {!transaction.isVoided && (
                          <button
                            type="button"
                            onClick={() => void handlePrintReceipt(transaction.transactionId)}
                            className="p-2 rounded-lg border-2 border-emerald-100 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:border-emerald-300 transition-all"
                            title="Print Receipt"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                        )}
                        {!transaction.isVoided && (
                          <button
                            type="button"
                            onClick={() => handleOpenVoidModal(transaction)}
                            disabled={!canVoid}
                            className={`p-2 rounded-lg border-2 transition-all ${
                              canVoid
                                ? 'border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:border-rose-300'
                                : 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                            }`}
                            title={tooOld ? 'Transaction is too old to void (>24 hours)' : 'Void this transaction'}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t-2 border-slate-200 bg-slate-50 px-6 py-4">
          <span className="text-sm font-medium text-slate-600">{currentItemsLabel}</span>
          <nav className="isolate inline-flex rounded-md shadow-sm gap-2" aria-label="Pagination">
            <button
              type="button"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
              disabled={pagination.page === 1 || loading}
            >
              Previous
            </button>
            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: pageCount || 1 }, (_, i) => i + 1)
                .filter(p => p === 1 || p === (pageCount || 1) || Math.abs(p - pagination.page) <= 1)
                .map((pageNum, index, array) => {
                  const isGap = index > 0 && pageNum - array[index - 1] > 1;
                  return (
                    <div key={pageNum} className="flex items-center">
                      {isGap && <span className="px-2 text-sm font-medium text-slate-500">...</span>}
                      <button
                        onClick={() => setPagination((prev) => ({ ...prev, page: pageNum }))}
                        className={`rounded-lg px-4 py-2 text-sm font-medium ${
                          pagination.page === pageNum
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
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: Math.min(prev.page + 1, pageCount || 1) }))
              }
              disabled={pagination.page === pageCount || loading || pageCount === 0}
            >
              Next
            </button>
          </nav>
        </div>
      </div>

      <TransactionDetailsModal
        open={modalOpen}
        transaction={selectedTransaction}
        onClose={() => {
          setModalOpen(false);
          setSelectedTransaction(null);
        }}
        onPrint={handlePrintReceipt}
      />

      {transactionToVoid && (
        <VoidTransactionModal
          transaction={transactionToVoid}
          onClose={() => {
            setTransactionToVoid(null);
          }}
          onVoid={handleVoidTransaction}
        />
      )}
    </div>
  );
}
