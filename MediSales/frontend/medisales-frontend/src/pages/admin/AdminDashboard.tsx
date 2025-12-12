import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowUpRight,
  Circle,
  DollarSign,
  Package,
  Timer,
} from 'lucide-react';
import * as signalR from '@microsoft/signalr';
import CountUp from 'react-countup';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { dashboardService } from '../../services/dashboardService';
import signalRService from '../../services/signalRService';
import type {
  DashboardStats,
  RecentTransactionRow,
  SalesChartEntry,
  TopProductRow,
} from '../../types/Dashboard';
import { PH_LOCALE, PH_TIME_ZONE, parseApiDate } from '../../utils/formatters';

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
});

const numberFormatter = new Intl.NumberFormat();

const gradientCardClasses = {
  sales: 'from-blue-500 to-blue-600 shadow-blue-500/30',
  transactions: 'from-sky-500 to-blue-600 shadow-sky-500/30',
  lowStock: 'from-amber-500 to-amber-600 shadow-amber-500/30',
  expiring: 'from-rose-500 to-rose-600 shadow-rose-500/30',
};

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [salesChart, setSalesChart] = useState<SalesChartEntry[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductRow[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedCards, setUpdatedCards] = useState<Set<string>>(new Set());
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchDashboard = async () => {
      try {
        const [statsResponse, salesResponse, productsResponse, transactionsResponse] = await Promise.all([
          dashboardService.getDashboardStats(),
          dashboardService.getSalesChart(),
          dashboardService.getTopProducts(),
          dashboardService.getRecentTransactions(),
        ]);

        if (!isMounted) {
          return;
        }

        setStats(statsResponse);
        setSalesChart(Array.isArray(salesResponse) ? salesResponse : []);
        setTopProducts(Array.isArray(productsResponse) ? productsResponse : []);
        setRecentTransactions(Array.isArray(transactionsResponse) ? transactionsResponse : []);
      } catch (dashboardError) {
        if (!isMounted) {
          return;
        }

        if (dashboardError instanceof Error) {
          setError(dashboardError.message || 'Unable to load dashboard data.');
        } else {
          setError('Unable to load dashboard data.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboard();

    // Start SignalR connection
    void signalRService.startNotificationConnection();

    // Handler for dashboard stats updates
    const handleDashboardUpdated = (data: DashboardStats) => {
      if (!isMounted) return;

      // Track which cards were updated
      const updatedSet = new Set<string>();
      if (stats && data.todaySales !== stats.todaySales) updatedSet.add('sales');
      if (stats && data.totalTransactions !== stats.totalTransactions) updatedSet.add('transactions');
      if (stats && data.lowStockItems !== stats.lowStockItems) updatedSet.add('lowStock');
      if (stats && data.expiringSoon !== stats.expiringSoon) updatedSet.add('expiring');

      setStats(data);
      setLastUpdated(new Date());
      setUpdatedCards(updatedSet);

      // Clear the updated indication after animation
      setTimeout(() => {
        if (isMounted) {
          setUpdatedCards(new Set());
        }
      }, 2000);
    };

    // Handler for transaction voided notifications
    const handleTransactionVoided = (transaction: any) => {
      if (!isMounted) return;
      console.log('Transaction voided:', transaction);
      void fetchDashboard();
    };

    // Handler for transaction completed notifications  
    const handleTransactionCompleted = (transactionCode: string, totalAmount: number) => {
      if (!isMounted) return;
      console.log('Transaction completed:', transactionCode, totalAmount);
      void fetchDashboard();
    };

    signalRService.onDashboardUpdated(handleDashboardUpdated);
    signalRService.onTransactionVoided(handleTransactionVoided);
    signalRService.onTransactionCompleted(handleTransactionCompleted);

    setIsConnected(signalRService.notificationConnectionState === signalR.HubConnectionState.Connected);

    return () => {
      isMounted = false;
      signalRService.offDashboardUpdated(handleDashboardUpdated);
      signalRService.offTransactionVoided(handleTransactionVoided);
      signalRService.offTransactionCompleted(handleTransactionCompleted);
    };
  }, []); // Only run once on mount

  const statCards = useMemo(
    () => [
      {
        id: 'sales',
        label: "Today's Sales",
        icon: DollarSign,
        value: stats?.todaySales ?? 0,
        rawValue: stats?.todaySales ?? 0,
        gradient: gradientCardClasses.sales,
        prefix: '₱',
        decimals: 2,
      },
      {
        id: 'transactions',
        label: 'Total Transactions',
        icon: Activity,
        value: stats?.totalTransactions ?? 0,
        rawValue: stats?.totalTransactions ?? 0,
        gradient: gradientCardClasses.transactions,
        decimals: 0,
      },
      {
        id: 'lowStock',
        label: 'Low Stock Items',
        icon: Package,
        value: stats?.lowStockItems ?? 0,
        rawValue: stats?.lowStockItems ?? 0,
        gradient: gradientCardClasses.lowStock,
        decimals: 0,
      },
      {
        id: 'expiring',
        label: 'Expiring Soon',
        icon: Timer,
        value: stats?.expiringSoon ?? 0,
        rawValue: stats?.expiringSoon ?? 0,
        gradient: gradientCardClasses.expiring,
        decimals: 0,
      },
    ],
    [stats],
  );

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30">
            <Activity className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">DASHBOARD OVERVIEW</h1>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">
              Real-time business performance metrics
            </p>
          </div>
        </div>
      </div>

      {/* Live Indicator */}
      {isConnected && (
        <div className="flex items-center justify-between bg-emerald-50 border-2 border-emerald-100 px-4 py-3 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </div>
            <span className="text-sm font-extrabold text-emerald-700 uppercase tracking-wide">Live Dashboard Updates Active</span>
          </div>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-lg">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
        </div>
      )}

      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ icon: Icon, gradient, id, label, value, prefix, decimals }) => {
          const isUpdated = updatedCards.has(id);
          return (
            <article
              key={id}
              className={`relative overflow-hidden rounded-2xl border-2 border-white/20 bg-gradient-to-br ${gradient} p-6 text-white shadow-lg transition-all duration-300 hover:scale-[1.02] ${
                isUpdated ? 'ring-4 ring-white ring-opacity-50 scale-105' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-white/90">{label}</p>
                    {isConnected && (
                      <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full flex items-center backdrop-blur-sm">
                        <Circle className="h-1.5 w-1.5 fill-white text-white mr-1.5 animate-pulse" />
                        LIVE
                      </span>
                    )}
                  </div>
                  <div className="text-3xl font-extrabold tracking-tight">
                    <CountUp
                      end={value}
                      duration={1.5}
                      separator=","
                      decimals={decimals}
                      prefix={prefix}
                    />
                  </div>
                </div>
                <div className="rounded-xl border-2 border-white/20 bg-white/20 p-3 backdrop-blur-sm">
                  <Icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Weekly Sales Trend</h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">Performance overview for the past 7 days</p>
            </div>
          </div>
          <div className="h-72 w-full" style={{ minHeight: '288px', minWidth: '0' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" vertical={false} />
                <XAxis 
                  dataKey="day" 
                  stroke="#64748b" 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fontSize: 12, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  stroke="#64748b" 
                  tickFormatter={(tick) => tick.toLocaleString()} 
                  width={60} 
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fontWeight: 600 }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                  formatter={(value: number) => [currencyFormatter.format(value), 'Sales']}
                  contentStyle={{ 
                    borderRadius: '1rem', 
                    borderColor: '#e2e8f0',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    borderWidth: '2px',
                    padding: '12px'
                  }}
                  labelStyle={{ fontWeight: 700, color: '#64748b', marginBottom: '4px' }}
                  itemStyle={{ fontWeight: 600, color: '#3b82f6' }}
                />
                <Bar dataKey="totalSales" fill="url(#salesGradient)" radius={[8, 8, 8, 8]} barSize={40} />
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                    <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Top Selling Products</h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">Highest performing items this week</p>
            </div>
          </div>
          <ul className="space-y-3">
            {topProducts.length > 0 ? (
              topProducts.map((product, index) => {
                // Calculate total revenue of all top products
                const totalTopProductsRevenue = topProducts.reduce((sum, p) => sum + p.revenue, 0);
                // Calculate this product's percentage of top products revenue
                const percentageOfTopProducts = totalTopProductsRevenue > 0 
                  ? ((product.revenue / totalTopProductsRevenue) * 100).toFixed(1)
                  : '0.0';

                return (
                  <li
                    key={product.productId}
                    className="flex items-center justify-between rounded-xl border-2 border-slate-100 bg-slate-50/50 px-5 py-4 transition-colors hover:bg-slate-50 hover:border-blue-200 group"
                  >
                    <div className="flex items-center gap-4">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border-2 border-slate-200 text-sm font-extrabold text-slate-400 group-hover:border-blue-200 group-hover:text-blue-500 transition-colors">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                          {product.name}
                        </p>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">
                          <span className="font-bold text-slate-700">{numberFormatter.format(product.unitsSold)}</span> units sold
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-extrabold text-slate-900">{currencyFormatter.format(product.revenue)}</p>
                      <span className="inline-block mt-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 border border-emerald-100">
                        {percentageOfTopProducts}% of top sales
                      </span>
                    </div>
                  </li>
                );
              })
            ) : (
              <li className="rounded-xl border-2 border-dashed border-slate-300 px-4 py-12 text-center">
                <div className="mx-auto h-12 w-12 text-slate-300 mb-3">
                  <Package className="h-full w-full" />
                </div>
                <p className="text-sm font-bold text-slate-500">No product performance data available yet.</p>
              </li>
            )}
          </ul>
        </article>
      </section>

      <section className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Recent Transactions</h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">Latest POS activity across the organization</p>
          </div>
          <Link
            to="/admin/transactions"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-blue-100 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-600 transition-all hover:bg-blue-100 hover:border-blue-200 uppercase tracking-wide"
          >
            View All
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="overflow-hidden rounded-xl border-2 border-slate-200">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-extrabold uppercase tracking-wide text-slate-500">
                <th className="px-6 py-4">Transaction</th>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Staff</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction) => {
                  const happenedAt = parseApiDate(transaction.createdAt);

                  return (
                    <tr key={transaction.transactionId} className="transition-colors hover:bg-slate-50/80">
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-900 font-mono text-xs bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                          {transaction.transactionCode}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-500">
                        {happenedAt.toLocaleString(PH_LOCALE, {
                          hour: 'numeric',
                          minute: '2-digit',
                          timeZone: PH_TIME_ZONE,
                        })}
                        <span className="block text-xs font-medium text-slate-400">
                          {happenedAt.toLocaleDateString(PH_LOCALE, { month: 'short', day: 'numeric', timeZone: PH_TIME_ZONE })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-700">{transaction.staffName}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600 uppercase tracking-wide">
                          {transaction.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-extrabold text-slate-900">
                        {currencyFormatter.format(transaction.totalAmount)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm font-bold text-slate-500">
                    No transactions have been recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
            <p className="text-sm font-bold text-slate-500 animate-pulse">Loading dashboard...</p>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="rounded-2xl border-2 border-rose-200 bg-rose-50 px-6 py-4 text-sm font-bold text-rose-700 shadow-sm flex items-center gap-3">
          <div className="p-2 bg-rose-100 rounded-full">
            <Activity className="h-5 w-5 text-rose-600" />
          </div>
          {error}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
