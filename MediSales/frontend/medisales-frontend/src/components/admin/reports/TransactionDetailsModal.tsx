import { useEffect, useState } from 'react';
import { X, Calendar, User, CreditCard, Tag, ChevronDown, ChevronUp, Package } from 'lucide-react';
import { transactionService } from '../../../services/transactionService';
import type { Transaction } from '../../../types/Transaction';
import { formatDate, formatDateTime } from '../../../utils/formatters';

interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  startDate: string;
  endDate: string;
  title: string;
}

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
});

const TransactionDetailsModal = ({
  isOpen,
  onClose,
  startDate,
  endDate,
  title,
}: TransactionDetailsModalProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTransactionId, setExpandedTransactionId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && startDate && endDate) {
      fetchTransactions();
    }
  }, [isOpen, startDate, endDate]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const data = await transactionService.getTransactionsByDateRange(startDate, endDate);
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (transactionId: number) => {
    setExpandedTransactionId(expandedTransactionId === transactionId ? null : transactionId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            <p className="text-sm text-brand-muted">
              {formatDate(startDate)} - {formatDate(endDate)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center text-brand-muted">
              <Calendar className="mb-2 h-8 w-8 opacity-20" />
              <p>No transactions found for this period</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => {
                const isExpanded = expandedTransactionId === transaction.transactionId;
                return (
                <div
                  key={transaction.transactionId}
                  className="rounded-xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  {/* Clickable Header */}
                  <button
                    onClick={() => toggleExpanded(transaction.transactionId)}
                    className="w-full p-4 text-left"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="rounded-full bg-brand-background p-3">
                          <Tag className="h-5 w-5 text-brand-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-blue-600 hover:text-blue-800 underline decoration-dotted underline-offset-2">
                              {transaction.transactionCode}
                            </h3>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              transaction.isVoided 
                                ? 'bg-red-100 text-red-700' 
                                : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {transaction.isVoided ? 'Voided' : 'Completed'}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-slate-400" />
                            )}
                          </div>
                          <p className="text-sm text-brand-muted">
                            {formatDateTime(transaction.transactionDate || transaction.createdAt)}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {transaction.staffName || transaction.username}
                            </div>
                            <div className="flex items-center gap-1">
                              <CreditCard className="h-3 w-3" />
                              {transaction.paymentMethod}
                              {transaction.paymentReferenceNumber && (
                                <span className="ml-1 text-slate-400">
                                  (Ref: {transaction.paymentReferenceNumber})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-brand-primary">
                          {currencyFormatter.format(transaction.totalAmount)}
                        </p>
                        <p className="text-xs text-brand-muted">
                          {transaction.items?.length || 0} items • Click to {isExpanded ? 'collapse' : 'expand'}
                        </p>
                      </div>
                    </div>
                  </button>
                  
                  {/* Expanded Items Detail */}
                  {isExpanded && transaction.items && transaction.items.length > 0 && (
                    <div className="border-t border-slate-100 bg-slate-50 p-4">
                      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3 flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Transaction Items
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-200">
                              <th className="text-left py-2 px-3 font-semibold text-slate-600">Product</th>
                              <th className="text-center py-2 px-3 font-semibold text-slate-600">Qty</th>
                              <th className="text-right py-2 px-3 font-semibold text-slate-600">Unit Price</th>
                              <th className="text-right py-2 px-3 font-semibold text-slate-600">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {transaction.items.map((item, idx) => (
                              <tr key={idx} className="border-b border-slate-100 last:border-b-0">
                                <td className="py-2 px-3 text-slate-800">
                                  {item.productName || item.product?.productName || 'Unknown Product'}
                                </td>
                                <td className="py-2 px-3 text-center font-medium text-slate-700">
                                  {item.quantity}
                                </td>
                                <td className="py-2 px-3 text-right text-slate-600">
                                  {currencyFormatter.format(item.unitPrice)}
                                </td>
                                <td className="py-2 px-3 text-right font-semibold text-slate-800">
                                  {currencyFormatter.format(item.subtotal || item.unitPrice * item.quantity)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-slate-100">
                              <td colSpan={3} className="py-2 px-3 text-right font-bold text-slate-700">
                                Total:
                              </td>
                              <td className="py-2 px-3 text-right font-bold text-brand-primary">
                                {currencyFormatter.format(transaction.totalAmount)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {/* Collapsed Items Summary */}
                  {!isExpanded && (
                    <div className="px-4 pb-4 border-t border-slate-50 pt-3">
                      <p className="text-sm text-slate-600">
                        <span className="font-medium">Items: </span>
                        {transaction.items?.map(item => 
                          `${item.productName || item.product?.productName || 'Unknown Product'} (${item.quantity}x)`
                        ).join(', ') || transaction.itemsSummary || 'No items'}
                      </p>
                    </div>
                  )}
                </div>
              )})}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 p-4 bg-slate-50 rounded-b-2xl">
          <div className="flex justify-between items-center text-sm text-slate-600">
            <span>Total Transactions: {transactions.length}</span>
            <span className="font-semibold">
              Total: {currencyFormatter.format(transactions.reduce((sum, t) => sum + t.totalAmount, 0))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailsModal;
