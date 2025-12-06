import React, { useState } from 'react';
import { X, AlertTriangle, Package } from 'lucide-react';
import type { Transaction } from '../../types/Transaction';
import { parseApiDate } from '../../utils/formatters';

interface VoidTransactionModalProps {
  transaction: Transaction;
  onClose: () => void;
  onVoid: (transactionId: number, voidReason: string) => Promise<void>;
}

const VoidTransactionModal: React.FC<VoidTransactionModalProps> = ({
  transaction,
  onClose,
  onVoid,
}) => {
  const [voidReason, setVoidReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!voidReason.trim()) {
      setError('Void reason is required');
      return;
    }

    if (voidReason.length > 500) {
      setError('Void reason cannot exceed 500 characters');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await onVoid(transaction.transactionId, voidReason.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to void transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate hours since transaction
  const transactionDate = parseApiDate(transaction.createdAt);
  const now = new Date();
  const hoursSince = !isNaN(transactionDate.getTime()) 
    ? Math.floor((now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60))
    : 0;
  const isTooOld = hoursSince > 24;

  const formatDateTime = (value: string) => {
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Void Transaction</h2>
              <p className="text-sm text-gray-500">Transaction {transaction.transactionCode}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Warning Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex gap-3">
              <Package className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-900 mb-1">Important Notice</h3>
                <p className="text-sm text-amber-800">
                  Voiding this transaction will automatically restore all items to inventory. This action cannot be undone.
                </p>
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-gray-900 mb-3">Transaction Details</h3>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Transaction Code:</span>
                <p className="font-medium text-gray-900">{transaction.transactionCode}</p>
              </div>
              
              <div>
                <span className="text-gray-600">Date & Time:</span>
                <p className="font-medium text-gray-900">
                  {formatDateTime(transaction.createdAt)}
                </p>
              </div>

              <div>
                <span className="text-gray-600">Total Amount:</span>
                <p className="font-medium text-gray-900">₱{transaction.totalAmount.toFixed(2)}</p>
              </div>

              <div>
                <span className="text-gray-600">Payment Method:</span>
                <p className="font-medium text-gray-900">{transaction.paymentMethod}</p>
              </div>

              <div>
                <span className="text-gray-600">Total Items:</span>
                <p className="font-medium text-gray-900">{transaction.totalItems || 0} items</p>
              </div>

              <div>
                <span className="text-gray-600">Time Elapsed:</span>
                <p className={`font-medium ${isTooOld ? 'text-red-600' : 'text-gray-900'}`}>
                  {hoursSince} hour{hoursSince !== 1 ? 's' : ''} ago
                </p>
              </div>
            </div>
          </div>

          {/* Items List */}
          {transaction.items && transaction.items.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">Items to be Restored</h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="text-gray-600 border-b border-gray-200">
                    <tr>
                      <th className="text-left pb-2">Product</th>
                      <th className="text-center pb-2">Quantity</th>
                      <th className="text-right pb-2">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-900">
                    {transaction.items.map((item, index) => (
                      <tr key={index} className="border-b border-gray-100 last:border-0">
                        <td className="py-2">{item.product?.productName || item.productName || 'Unknown Product'}</td>
                        <td className="text-center py-2">{item.quantity}</td>
                        <td className="text-right py-2">₱{item.subtotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Age Warning */}
          {isTooOld && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">Transaction Too Old</h3>
                  <p className="text-sm text-red-800">
                    This transaction is over 24 hours old and cannot be voided through the system.
                    Please contact system administrator for manual adjustments.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Void Reason */}
          <div className="space-y-2">
            <label htmlFor="voidReason" className="block text-sm font-medium text-gray-700">
              Void Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              id="voidReason"
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              disabled={isSubmitting || isTooOld}
              rows={4}
              maxLength={500}
              placeholder="Enter reason for voiding this transaction (required)..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{voidReason.length}/500 characters</span>
              {error && <span className="text-red-600">{error}</span>}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isTooOld || !voidReason.trim()}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSubmitting ? 'Voiding...' : 'Void Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VoidTransactionModal;
