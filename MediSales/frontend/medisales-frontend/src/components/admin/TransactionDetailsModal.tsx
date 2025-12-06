import { Printer, X } from 'lucide-react';
import type { Transaction } from '../../types/Transaction';
import { parseApiDate } from '../../utils/formatters';

export type TransactionDetailsModalProps = {
  open: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onPrint?: (transactionId: number) => void;
};

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
});

const formatDateTime = (value: string) => {
  if (!value) return 'N/A';
  try {
    return parseApiDate(value).toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'Asia/Manila',
    });
  } catch {
    return 'Invalid Date';
  }
};

const TransactionDetailsModal = ({ open, transaction, onClose, onPrint }: TransactionDetailsModalProps) => {
  if (!open || !transaction) {
    return null;
  }

  const handlePrint = () => {
    if (onPrint) {
      onPrint(transaction.transactionId);
    } else {
      window.print();
    }
  };

  const discount = transaction.totalDiscount || transaction.discountAmount || 0;
  const subtotal = (transaction.subtotal || transaction.totalAmount) + discount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-8 backdrop-blur">
      <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-brand-muted">Transaction Details</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">{transaction.transactionCode}</h2>
            <p className="text-sm text-brand-muted">{formatDateTime(transaction.createdAt || transaction.transactionDate)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-brand-background p-2 text-brand-muted transition hover:text-brand-primary"
            aria-label="Close transaction details modal"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6">
          <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <p className="flex justify-between text-slate-700">
              <span className="font-semibold text-slate-900">Total Items</span>
              <span>{transaction.totalItems}</span>
            </p>
            <p className="flex justify-between text-slate-700">
              <span className="font-semibold text-slate-900">Payment Method</span>
              <span>{transaction.paymentMethod}</span>
            </p>
            <p className="flex justify-between text-slate-700">
              <span className="font-semibold text-slate-900">Processed By</span>
              <span>{transaction.staff?.fullName ?? transaction.staffName ?? transaction.username ?? 'Unassigned'}</span>
            </p>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <p className="flex justify-between text-slate-700">
              <span className="font-semibold text-slate-900">Subtotal</span>
              <span>{currencyFormatter.format(subtotal)}</span>
            </p>
            <p className="flex justify-between text-slate-700">
              <span className="font-semibold text-slate-900">Discounts</span>
              <span>-{currencyFormatter.format(discount)}</span>
            </p>
            <p className="flex justify-between text-slate-700">
              <span className="font-semibold text-slate-900">Total Amount</span>
              <span className="text-base font-semibold text-brand-primary">
                {currencyFormatter.format(transaction.totalAmount)}
              </span>
            </p>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-muted">Items Purchased</h3>
          <div className="mt-3 rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-brand-background/60 text-xs uppercase tracking-wide text-brand-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Product</th>
                  <th className="px-4 py-3 text-right font-semibold">Qty</th>
                  <th className="px-4 py-3 text-right font-semibold">Unit Price</th>
                  <th className="px-4 py-3 text-right font-semibold">Discount</th>
                  <th className="px-4 py-3 text-right font-semibold">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transaction.items?.map((item) => (
                  <tr key={item.transactionItemId}>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {item.product?.productName ?? item.productName ?? `#${item.productId}`}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-slate-700">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-sm text-slate-700">
                      {currencyFormatter.format(item.unitPrice)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-slate-700">
                      {item.discount > 0 ? `-${currencyFormatter.format(item.discount)}` : currencyFormatter.format(0)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                      {currencyFormatter.format(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </div>

        <div className="flex justify-end px-6 pb-6">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 transition hover:brightness-105"
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailsModal;
