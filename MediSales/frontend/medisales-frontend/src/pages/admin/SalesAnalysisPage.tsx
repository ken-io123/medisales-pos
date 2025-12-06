import { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, Calendar, Minus, BarChart3 } from 'lucide-react';
import { salesAnalysisService, type SalesComparisonDto, type HistoricalSalesDto } from '../../services/salesAnalysisService';
import { PH_LOCALE, PH_TIME_ZONE } from '../../utils/formatters';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
});

const SalesAnalysisPage = () => {
  const [date1, setDate1] = useState<string>('');
  const [date2, setDate2] = useState<string>('');
  const [comparison, setComparison] = useState<SalesComparisonDto | null>(null);
  const [historicalData1, setHistoricalData1] = useState<HistoricalSalesDto | null>(null);
  const [historicalData2, setHistoricalData2] = useState<HistoricalSalesDto | null>(null);
  const [weeklyComparison, setWeeklyComparison] = useState<SalesComparisonDto | null>(null);
  const [monthlyComparison, setMonthlyComparison] = useState<SalesComparisonDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load weekly and monthly comparisons on mount
  useEffect(() => {
    loadDefaultComparisons();
  }, []);

  const loadDefaultComparisons = async () => {
    try {
      const [weekly, monthly] = await Promise.all([
        salesAnalysisService.getWeeklyComparison(),
        salesAnalysisService.getMonthlyComparison(),
      ]);
      setWeeklyComparison(weekly);
      setMonthlyComparison(monthly);
    } catch (err) {
      console.error('Error loading default comparisons:', err);
    }
  };

  const handleCompare = async () => {
    if (!date1 || !date2) {
      setError('Please select both dates');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [comparisonResult, historical1, historical2] = await Promise.all([
        salesAnalysisService.compareSales(date1, date2),
        salesAnalysisService.getHistoricalSales(date1),
        salesAnalysisService.getHistoricalSales(date2),
      ]);

      setComparison(comparisonResult);
      setHistoricalData1(historical1);
      setHistoricalData2(historical2);
    } catch (err) {
      setError('Error loading comparison data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const ComparisonCard = ({ 
    title, 
    data 
  }: { 
    title: string; 
    data: SalesComparisonDto | null 
  }) => {
    if (!data) return null;

    const Icon = data.percentageChange === 0 ? Minus : data.isIncrease ? ArrowUp : ArrowDown;
    const colorClass = data.percentageChange === 0 
      ? 'text-slate-600 bg-slate-100 border-slate-200' 
      : data.isIncrease 
        ? 'text-emerald-600 bg-emerald-50 border-emerald-200' 
        : 'text-rose-600 bg-rose-50 border-rose-200';

    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-slate-200 transition-all hover:-translate-y-1 hover:shadow-xl">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">{title}</h3>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">
                          {new Date(data.date1).toLocaleDateString(PH_LOCALE, { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric',
                            timeZone: PH_TIME_ZONE,
                          })}
              </p>
              <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {currencyFormatter.format(data.sales1)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">
                          {new Date(data.date2).toLocaleDateString(PH_LOCALE, { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric',
                            timeZone: PH_TIME_ZONE,
                          })}
              </p>
              <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {currencyFormatter.format(data.sales2)}
              </p>
            </div>
          </div>

          <div className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 ${colorClass}`}>
            <Icon className="h-8 w-8" strokeWidth={3} />
            <span className="text-3xl font-extrabold tracking-tight">
              {Math.abs(data.percentageChange).toFixed(2)}%
            </span>
          </div>

          <div className="text-center bg-slate-50 rounded-xl p-3 border border-slate-100">
            <p className="text-sm font-bold text-slate-700">{data.trendDescription}</p>
            <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wide">
              Difference: {currencyFormatter.format(Math.abs(data.amountDifference))}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const chartData = comparison && historicalData1 && historicalData2 ? [
    {
      date: new Date(historicalData1.date).toLocaleDateString(PH_LOCALE, { month: 'short', day: 'numeric', timeZone: PH_TIME_ZONE }),
      sales: historicalData1.totalSales,
      transactions: historicalData1.transactionCount,
    },
    {
      date: new Date(historicalData2.date).toLocaleDateString(PH_LOCALE, { month: 'short', day: 'numeric', timeZone: PH_TIME_ZONE }),
      sales: historicalData2.totalSales,
      transactions: historicalData2.transactionCount,
    },
  ] : [];

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30">
            <BarChart3 className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">SALES ANALYSIS</h1>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">
              Historical sales comparison & performance metrics
            </p>
          </div>
        </div>
      </div>

      {/* Date Picker Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-slate-200">
        <h2 className="text-lg font-extrabold text-slate-900 mb-6 flex items-center gap-2 uppercase tracking-tight">
          <Calendar className="h-5 w-5 text-blue-600" />
          Compare Specific Dates
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
              First Date
            </label>
            <input
              type="date"
              value={date1}
              onChange={(e) => setDate1(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
              Second Date
            </label>
            <input
              type="date"
              value={date2}
              onChange={(e) => setDate2(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={handleCompare}
              disabled={loading || !date1 || !date2}
              className="w-full bg-gradient-to-br from-blue-600 to-blue-700 hover:shadow-lg hover:shadow-blue-500/30 disabled:from-slate-300 disabled:to-slate-400 text-white font-bold uppercase tracking-wide py-3.5 px-6 rounded-xl transition-all active:scale-[0.98]"
            >
              {loading ? 'Analyzing...' : 'Compare Sales'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-rose-50 border-2 border-rose-200 text-rose-700 rounded-xl text-sm font-bold flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500" />
            {error}
          </div>
        )}
      </div>

      {/* Custom Comparison Result */}
      {comparison && (
        <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <ComparisonCard title="Custom Date Comparison" data={comparison} />
        </div>
      )}

      {/* Charts Section */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-slate-200">
          <h2 className="text-lg font-extrabold text-slate-900 mb-6 uppercase tracking-tight">Sales Comparison Chart</h2>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                  tickFormatter={(value) => `₱${value / 1000}k`}
                />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  formatter={(value: number) => [currencyFormatter.format(value), 'Sales']}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: '2px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontWeight: 'bold'
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar 
                  dataKey="sales" 
                  fill="url(#colorSales)" 
                  name="Total Sales" 
                  radius={[8, 8, 0, 0]} 
                  barSize={60}
                >
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Daily Breakdown Table */}
      {historicalData1 && historicalData2 && (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-slate-200">
          <div className="p-6 border-b-2 border-slate-100">
            <h2 className="text-lg font-extrabold text-slate-900 uppercase tracking-tight">Daily Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b-2 border-slate-200">
                  <th className="text-left py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-500">Date</th>
                  <th className="text-right py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-500">Total Sales</th>
                  <th className="text-right py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-500">Transactions</th>
                  <th className="text-right py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-500">Avg Transaction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6 text-sm font-bold text-slate-900">
                    {new Date(historicalData1.date).toLocaleDateString(PH_LOCALE, { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      timeZone: PH_TIME_ZONE,
                    })}
                  </td>
                  <td className="py-4 px-6 text-sm text-right font-bold text-blue-600">
                    {currencyFormatter.format(historicalData1.totalSales)}
                  </td>
                  <td className="py-4 px-6 text-sm text-right font-semibold text-slate-700">
                    {historicalData1.transactionCount}
                  </td>
                  <td className="py-4 px-6 text-sm text-right font-semibold text-slate-700">
                    {currencyFormatter.format(historicalData1.averageTransaction)}
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6 text-sm font-bold text-slate-900">
                    {new Date(historicalData2.date).toLocaleDateString(PH_LOCALE, { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      timeZone: PH_TIME_ZONE,
                    })}
                  </td>
                  <td className="py-4 px-6 text-sm text-right font-bold text-blue-600">
                    {currencyFormatter.format(historicalData2.totalSales)}
                  </td>
                  <td className="py-4 px-6 text-sm text-right font-semibold text-slate-700">
                    {historicalData2.transactionCount}
                  </td>
                  <td className="py-4 px-6 text-sm text-right font-semibold text-slate-700">
                    {currencyFormatter.format(historicalData2.averageTransaction)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Weekly and Monthly Comparisons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ComparisonCard title="WEEKLY COMPARISON (Current vs Previous)" data={weeklyComparison} />
        <ComparisonCard title="MONTHLY COMPARISON (Current vs Previous)" data={monthlyComparison} />
      </div>
    </div>
  );
};

export default SalesAnalysisPage;
