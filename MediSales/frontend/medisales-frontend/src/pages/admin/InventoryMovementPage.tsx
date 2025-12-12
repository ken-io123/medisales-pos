import { useState, useEffect } from 'react';
import { Download, Plus, ArrowUp, ArrowDown, Filter, X, History } from 'lucide-react';
import { inventoryMovementService, type InventoryMovementDto, type MovementFilters } from '../../services/inventoryMovementService';
import { parseApiDate } from '../../utils/formatters';
import { productService } from '../../services/productService';
import { errorToast, successToast } from '../../utils/toast';
import { useAuth } from '../../hooks/useAuth';

interface Product {
  productId: number;
  productCode: string;
  productName: string;
  stockQuantity: number;
}

const InventoryMovementPage = () => {
  const { user } = useAuth();
  const [movements, setMovements] = useState<InventoryMovementDto[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filters, setFilters] = useState<MovementFilters>({});
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Add/Adjust form state
  const [selectedProductId, setSelectedProductId] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(0);
  const [referenceType, setReferenceType] = useState<'PurchaseOrder' | 'Return' | 'Adjustment'>('PurchaseOrder');
  const [referenceId, setReferenceId] = useState('');
  const [reason, setReason] = useState('');
  const [isAdjustment, setIsAdjustment] = useState(false);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [movementsData, productsData] = await Promise.all([
        inventoryMovementService.getMovements(filters),
        productService.getProducts({}, 1, 1000),
      ]);
      setMovements(movementsData);
      setProducts(productsData.data);
    } catch (error) {
      errorToast('Failed to load data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddInbound = async () => {
    if (!selectedProductId || quantity <= 0) {
      errorToast('Please select a product and enter a valid quantity');
      return;
    }

    try {
      await inventoryMovementService.recordInbound({
        productId: selectedProductId,
        quantity: Math.abs(quantity),
        referenceType,
        referenceId: referenceId || undefined,
        reason: reason || undefined,
        userId: user?.userId,
      });
      successToast('Inbound movement recorded successfully');
      setShowAddModal(false);
      resetForm();
      loadData();
    } catch (error: any) {
      errorToast(error.response?.data?.message || 'Failed to record inbound movement');
    }
  };

  const handleAddAdjustment = async () => {
    if (!selectedProductId || quantity === 0) {
      errorToast('Please select a product and enter a valid quantity');
      return;
    }

    if (!reason.trim()) {
      errorToast('Reason is required for adjustments');
      return;
    }

    try {
      await inventoryMovementService.recordAdjustment({
        productId: selectedProductId,
        quantity,
        reason,
        referenceId: referenceId || undefined,
        userId: user?.userId,
      });
      successToast('Adjustment recorded successfully');
      setShowAddModal(false);
      resetForm();
      loadData();
    } catch (error: any) {
      errorToast(error.response?.data?.message || 'Failed to record adjustment');
    }
  };

  const resetForm = () => {
    setSelectedProductId(0);
    setQuantity(0);
    setReferenceType('PurchaseOrder');
    setReferenceId('');
    setReason('');
    setIsAdjustment(false);
  };

  const handleExport = () => {
    inventoryMovementService.exportMovements(
      movements,
      `inventory-movements-${new Date().toISOString().split('T')[0]}.xlsx`
    );
    successToast('Movements exported to Excel');
  };

  const getMovementTypeColor = (type: string) => {
    return type === 'Inbound' 
      ? 'text-emerald-700 bg-emerald-100 border-emerald-200' 
      : 'text-rose-700 bg-rose-100 border-rose-200';
  };

  const getQuantityColor = (type: string) => {
    return type === 'Inbound' ? 'text-emerald-600 font-extrabold' : 'text-rose-600 font-extrabold';
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="mt-4 text-sm font-bold text-slate-500 uppercase tracking-wide">Loading movements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">INVENTORY MOVEMENTS</h1>
          <p className="mt-2 text-sm font-bold text-slate-500 uppercase tracking-wide">
            Track all inbound and outbound stock changes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            disabled={movements.length === 0}
            className="flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 shadow-sm hover:border-blue-500 hover:text-blue-600 transition-all disabled:opacity-50 disabled:hover:border-slate-200 disabled:hover:text-slate-600 uppercase tracking-wide"
          >
            <Download className="h-4 w-4" />
            Export Excel
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-xl border-2 border-blue-600 bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-105 transition-all uppercase tracking-wide"
          >
            <Plus className="h-5 w-5" />
            Add Movement
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-lg">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
            <Filter className="h-5 w-5 text-blue-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Product</label>
            <select
              value={filters.productId || ''}
              onChange={(e) => setFilters({ ...filters, productId: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
            >
              <option value="">All Products</option>
              {products.map((p) => (
                <option key={p.productId} value={p.productId}>
                  {p.productCode} - {p.productName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Start Date</label>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value || undefined })}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">End Date</label>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value || undefined })}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Type</label>
            <select
              value={filters.movementType || ''}
              onChange={(e) => setFilters({ ...filters, movementType: e.target.value as any })}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
            >
              <option value="">All Types</option>
              <option value="Inbound">Inbound</option>
              <option value="Outbound">Outbound</option>
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
          <button
            onClick={() => setFilters({})}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 uppercase tracking-wide transition-colors"
          >
            <X className="h-4 w-4" />
            Clear Filters
          </button>
        </div>
      </div>

      {/* Movements Table */}
      <div className="rounded-2xl border-2 border-slate-200 bg-white shadow-lg overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto">
          <table className="w-full text-left">
            <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="py-4 px-6 text-xs font-extrabold uppercase tracking-wider text-slate-600">Date & Time</th>
                <th className="py-4 px-6 text-xs font-extrabold uppercase tracking-wider text-slate-600">Product</th>
                <th className="py-4 px-6 text-center text-xs font-extrabold uppercase tracking-wider text-slate-600">Type</th>
                <th className="py-4 px-6 text-right text-xs font-extrabold uppercase tracking-wider text-slate-600">Quantity</th>
                <th className="py-4 px-6 text-right text-xs font-extrabold uppercase tracking-wider text-slate-600">Prev Bal</th>
                <th className="py-4 px-6 text-right text-xs font-extrabold uppercase tracking-wider text-slate-600">New Bal</th>
                <th className="py-4 px-6 text-xs font-extrabold uppercase tracking-wider text-slate-600">Reference</th>
                <th className="py-4 px-6 text-xs font-extrabold uppercase tracking-wider text-slate-600">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <History className="h-12 w-12 text-slate-300" />
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">No movements found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                movements.slice((page - 1) * pageSize, page * pageSize).map((movement) => (
                  <tr key={movement.movementId} className="hover:bg-slate-50 transition-colors duration-150">
                    <td className="py-4 px-6 text-sm font-bold text-slate-900">
                      {parseApiDate(movement.createdAt).toLocaleString('en-PH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'Asia/Manila',
                      })}
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm font-bold text-slate-900">{movement.productName}</div>
                      <div className="text-xs font-mono text-slate-500 mt-0.5">{movement.productCode}</div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getMovementTypeColor(movement.movementType)}`}>
                        {movement.movementType === 'Inbound' ? (
                          <ArrowUp className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5" />
                        )}
                        {movement.movementType}
                      </span>
                    </td>
                    <td className={`py-4 px-6 text-right text-sm ${getQuantityColor(movement.movementType)}`}>
                      {Math.abs(movement.quantity)}
                    </td>
                    <td className="py-4 px-6 text-right text-sm font-medium text-slate-600">
                      {movement.previousQuantity}
                    </td>
                    <td className="py-4 px-6 text-right text-sm font-bold text-slate-900">
                      {movement.newQuantity}
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm font-bold text-slate-800">{movement.referenceType}</div>
                      {movement.referenceId && (
                        <div className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded inline-block mt-1 border border-blue-100">
                          {movement.referenceId}
                        </div>
                      )}
                      {movement.reason && (
                        <div className="text-xs text-slate-500 italic mt-1">"{movement.reason}"</div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm font-medium text-slate-600">
                      {movement.createdBy}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {movements.length > pageSize && (
          <div className="border-t-2 border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-600">
              Showing <span className="font-bold text-slate-900">{(page - 1) * pageSize + 1}</span> to{' '}
              <span className="font-bold text-slate-900">{Math.min(page * pageSize, movements.length)}</span> of{' '}
              <span className="font-bold text-slate-900">{movements.length}</span> results
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
                {Array.from({ length: Math.ceil(movements.length / pageSize) }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === Math.ceil(movements.length / pageSize) || Math.abs(p - page) <= 1)
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
                disabled={page * pageSize >= movements.length}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Add Movement Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border-2 border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b-2 border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {isAdjustment ? 'Record Adjustment' : 'Add Inbound Movement'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Toggle Between Inbound and Adjustment */}
              <div className="flex gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  onClick={() => setIsAdjustment(false)}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${
                    !isAdjustment
                      ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Inbound
                </button>
                <button
                  onClick={() => setIsAdjustment(true)}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${
                    isAdjustment
                      ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Adjustment
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Product *</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(Number(e.target.value))}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                >
                  <option value={0}>Select a product...</option>
                  {products.map((p) => (
                    <option key={p.productId} value={p.productId}>
                      {p.productCode} - {p.productName} (Stock: {p.stockQuantity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                  Quantity * {isAdjustment && <span className="text-slate-400 normal-case font-normal">(+ for add, - for remove)</span>}
                </label>
                <input
                  type="number"
                  value={quantity || ''}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  placeholder={isAdjustment ? 'e.g., +10 or -5' : 'e.g., 100'}
                />
              </div>

              {!isAdjustment && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Reference Type</label>
                  <select
                    value={referenceType}
                    onChange={(e) => setReferenceType(e.target.value as any)}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  >
                    <option value="PurchaseOrder">Purchase Order</option>
                    <option value="Return">Return</option>
                    <option value="Adjustment">Adjustment</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                  Reference ID {!isAdjustment && <span className="text-slate-400 normal-case font-normal">(e.g., PO-001)</span>}
                </label>
                <input
                  type="text"
                  value={referenceId}
                  onChange={(e) => setReferenceId(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                  Reason {isAdjustment && '*'}
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none"
                  placeholder={isAdjustment ? 'Required for adjustments' : 'Optional'}
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={isAdjustment ? handleAddAdjustment : handleAddInbound}
                  className="flex-1 px-4 py-3 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-[1.02] transition-all"
                >
                  Record Movement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryMovementPage;
