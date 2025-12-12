import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { DollarSign, ShoppingCart, TrendingUp, Filter, ChevronRight } from 'lucide-react';
import { reportsService } from '../../services/reportsService';
import type { ReportPeriod, SalesDataPoint } from '../../types/Reports';
import TransactionDetailsModal from '../../components/admin/reports/TransactionDetailsModal';

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
});

const SalesReports = () => {
  const [dateRange, setDateRange] = useState<ReportPeriod>('daily');
  const [salesData, setSalesData] = useState<SalesDataPoint[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<{
    startDate: string;
    endDate: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  // Reset to first page when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [salesData]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      // Fetch trend data which includes the chart points and totals
      const trendData = await reportsService.getSalesTrend(dateRange);
      
      setSalesData(trendData.data);
      setTotalRevenue(trendData.totalSales);
      // Calculate total transactions from data points if not provided in summary
      const txCount = trendData.data.reduce((sum, item) => sum + item.transactions, 0);
      setTotalTransactions(txCount);
      
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(salesData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = salesData.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleRowClick = (item: SalesDataPoint) => {
    setSelectedPeriod({
      startDate: item.startDate,
      endDate: item.endDate,
      title: `Transactions for ${item.label}`,
    });
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="mt-4 text-sm font-bold text-slate-500 uppercase tracking-wide">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">SALES REPORTS</h1>
          <p className="mt-2 text-sm font-bold text-slate-500 uppercase tracking-wide">Comprehensive sales analytics and insights</p>
        </div>
        
        {/* Date Range Filter */}
        <div className="flex items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white p-2 shadow-sm">
          <div className="px-2">
            <Filter className="h-5 w-5 text-slate-400" />
          </div>
          {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setDateRange(period)}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition-all capitalize ${
                dateRange === period 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border-2 border-emerald-500/20 bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white shadow-lg shadow-emerald-500/30 hover:scale-[1.02] transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide opacity-90">Total Revenue</p>
              <p className="mt-2 text-3xl font-extrabold tracking-tight">{currencyFormatter.format(totalRevenue)}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-blue-500/20 bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg shadow-blue-500/30 hover:scale-[1.02] transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide opacity-90">Total Transactions</p>
              <p className="mt-2 text-3xl font-extrabold tracking-tight">{totalTransactions}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <ShoppingCart className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-violet-500/20 bg-gradient-to-br from-violet-500 to-violet-600 p-6 text-white shadow-lg shadow-violet-500/30 hover:scale-[1.02] transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide opacity-90">Average Transaction</p>
              <p className="mt-2 text-3xl font-extrabold tracking-tight">
                {totalTransactions > 0 ? currencyFormatter.format(totalRevenue / totalTransactions) : currencyFormatter.format(0)}
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Trend Chart */}
      <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 uppercase tracking-wide">Revenue Trend</h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">Sales performance over time</p>
          </div>
        </div>
        <div className="mt-6 h-80 w-full" style={{ minHeight: '320px', minWidth: '0' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" vertical={false} />
              <XAxis 
                dataKey="label" 
                stroke="#64748b" 
                tick={{ fontSize: 12, fontWeight: 600 }}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis 
                stroke="#64748b" 
                tickFormatter={(value) => currencyFormatter.format(value)} 
                tick={{ fontSize: 12, fontWeight: 600 }}
                tickLine={false}
                axisLine={false}
                dx={-10}
              />
              <Tooltip 
                formatter={(value: number) => [currencyFormatter.format(value), 'Revenue']}
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  borderRadius: '12px', 
                  border: '2px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  fontWeight: 'bold'
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Line 
                type="monotone" 
                dataKey="sales" 
                stroke="#1d4ed8" 
                strokeWidth={4} 
                dot={{ r: 6, strokeWidth: 3, fill: '#fff', stroke: '#1d4ed8' }} 
                activeDot={{ r: 8, strokeWidth: 0, fill: '#1d4ed8' }}
                name="Revenue" 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Data Table */}
      <div className="rounded-2xl border-2 border-slate-200 bg-white shadow-lg overflow-hidden flex flex-col">
        <div className="p-6 border-b-2 border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-extrabold text-slate-900 uppercase tracking-wide">Detailed Breakdown</h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">Click on a row to view transactions</p>
        </div>
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left">
            <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-slate-600">Period</th>
                <th className="px-6 py-4 text-right text-xs font-extrabold uppercase tracking-wider text-slate-600">Revenue</th>
                <th className="px-6 py-4 text-right text-xs font-extrabold uppercase tracking-wider text-slate-600">Transactions</th>
                <th className="px-6 py-4 text-right text-xs font-extrabold uppercase tracking-wider text-slate-600">Avg. Transaction</th>
                <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-slate-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentData.map((item, index) => (
                <tr 
                  key={index} 
                  onClick={() => handleRowClick(item)}
                  className="group cursor-pointer hover:bg-blue-50/50 transition-colors duration-150"
                >
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">{item.label}</td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-emerald-600">
                    {currencyFormatter.format(item.sales)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-slate-700">
                    {item.transactions}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-slate-700">
                    {item.transactions > 0 
                      ? currencyFormatter.format(item.sales / item.transactions) 
                      : currencyFormatter.format(0)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="p-2 rounded-full hover:bg-blue-100 text-slate-300 group-hover:text-blue-600 transition-all inline-block">
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  </td>
                </tr>
              ))}
              {currentData.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="p-4 bg-slate-100 rounded-full">
                        <Filter className="h-8 w-8 text-slate-400" />
                      </div>
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">No data available for this period</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t-2 border-slate-200 bg-slate-50 px-6 py-4">
            <div className="text-sm font-medium text-slate-600">
              Showing <span className="font-bold text-slate-900">{startIndex + 1}</span> to{' '}
              <span className="font-bold text-slate-900">
                {Math.min(startIndex + itemsPerPage, salesData.length)}
              </span>{' '}
              of <span className="font-bold text-slate-900">{salesData.length}</span> results
            </div>
            <nav className="isolate inline-flex rounded-md shadow-sm gap-2" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Logic to show window of pages around current page
                  let pageNum = i + 1;
                  if (totalPages > 5) {
                    if (currentPage > 3) {
                      pageNum = currentPage - 2 + i;
                    }
                    if (pageNum > totalPages) {
                      pageNum = totalPages - (4 - i);
                    }
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`rounded-lg px-4 py-2 text-sm font-medium ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Drill-down Modal */}
      {selectedPeriod && (
        <TransactionDetailsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          startDate={selectedPeriod.startDate}
          endDate={selectedPeriod.endDate}
          title={selectedPeriod.title}
        />
      )}
    </div>
  );
};

export default SalesReports;
