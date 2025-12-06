import { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, Package, AlertCircle, Eye } from 'lucide-react';
import { inventoryMovementService, type InventoryMovementDto } from '../../services/inventoryMovementService';
import { parseApiDate } from '../../utils/formatters';
import { productService } from '../../services/productService';
import { errorToast } from '../../utils/toast';

interface Product {
  productId: number;
  productCode: string;
  productName: string;
  stockQuantity: number;
}

const InventoryViewPage = () => {
  const [movements, setMovements] = useState<InventoryMovementDto[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<number | undefined>();
  const [page, setPage] = useState(1);
  const pageSize = 15;

  useEffect(() => {
    loadData();
  }, [selectedProductId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsData, movementsData] = await Promise.all([
        productService.getProducts({}, 1, 1000),
        selectedProductId
          ? inventoryMovementService.getProductMovements(selectedProductId, 50)
          : inventoryMovementService.getMovements({ productId: undefined }),
      ]);
      setProducts(productsData.data);
      // Limit to 50 most recent
      setMovements(movementsData.slice(0, 50));
    } catch (error) {
      errorToast('Failed to load movements');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getMovementTypeColor = (type: string) => {
    // Match admin page colors and include border utilities for consistent badge style
    return type === 'Inbound'
      ? 'text-emerald-700 bg-emerald-100 border-emerald-200'
      : 'text-rose-700 bg-rose-100 border-rose-200';
  };

  const getQuantityColor = (type: string) => {
    // Match admin styles (emerald/rose + bold weight)
    return type === 'Inbound' ? 'text-emerald-600 font-extrabold' : 'text-rose-600 font-extrabold';
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="mt-4 text-sm text-slate-600">Loading movements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Eye className="h-8 w-8" />
            Inventory Movements
          </h1>
          <p className="mt-1 text-sm text-slate-600">View recent inventory changes (Read-Only)</p>
        </div>
      </div>

      {/* Read-Only Alert */}
      <div className="rounded-2xl bg-blue-50 border-2 border-blue-200 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-blue-900">View Only Access</h3>
            <p className="text-sm text-blue-700 mt-1">
              You can view the last 50 inventory movements. Only administrators can add or modify movements.
            </p>
          </div>
        </div>
      </div>

      {/* Product Filter */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border-2 border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          <Package className="h-5 w-5 text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-900">Filter by Product</h2>
        </div>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">Select Product</label>
            <select
              value={selectedProductId || ''}
              onChange={(e) => setSelectedProductId(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
            >
              <option value="">All Products (Last 50 movements)</option>
              {products.map((p) => (
                <option key={p.productId} value={p.productId}>
                  {p.productCode} - {p.productName}
                </option>
              ))}
            </select>
          </div>
          {selectedProductId && (
            <button
              onClick={() => setSelectedProductId(undefined)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 border-2 border-slate-200 rounded-xl hover:bg-slate-50"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Movements Table */}
      <div className="rounded-2xl bg-white shadow-sm border-2 border-slate-100 overflow-hidden">
        <div className="bg-slate-50 border-b-2 border-slate-200 px-6 py-4">
          <h3 className="text-sm font-semibold text-slate-700">
            Recent Movements {selectedProductId && '(Filtered)'}
            <span className="ml-2 text-slate-500">({movements.length} records)</span>
          </h3>
        </div>
        <div className="max-h-[600px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b-2 border-slate-200">
              <tr>
                <th className="text-left py-4 px-4 text-sm font-semibold text-slate-700">Date & Time</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-slate-700">Product</th>
                <th className="text-center py-4 px-4 text-sm font-semibold text-slate-700">Type</th>
                <th className="text-right py-4 px-4 text-sm font-semibold text-slate-700">Quantity</th>
                <th className="text-right py-4 px-4 text-sm font-semibold text-slate-700">Previous Balance</th>
                <th className="text-right py-4 px-4 text-sm font-semibold text-slate-700">New Balance</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-slate-700">Reference</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-slate-700">Recorded By</th>
              </tr>
            </thead>
            <tbody>
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-500">
                    <Package className="h-12 w-12 mx-auto text-slate-300 mb-2" />
                    <p>No movements found</p>
                  </td>
                </tr>
              ) : (
                movements.slice((page - 1) * pageSize, page * pageSize).map((movement) => (
                  <tr key={movement.movementId} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm text-slate-900">
                      {parseApiDate(movement.createdAt).toLocaleString('en-PH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'Asia/Manila',
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm font-semibold text-slate-900">{movement.productName}</div>
                      <div className="text-xs text-slate-600">{movement.productCode}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getMovementTypeColor(
                          movement.movementType
                        )}`}
                      >
                        {movement.movementType === 'Inbound' ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )}
                        {movement.movementType}
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-right text-sm ${getQuantityColor(movement.movementType)}`}>
                      {Math.abs(movement.quantity)}
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-slate-700">{movement.previousQuantity}</td>
                    <td className="py-3 px-4 text-right text-sm font-bold text-slate-900">{movement.newQuantity}</td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-slate-900">{movement.referenceType}</div>
                      {movement.referenceId && (
                        <div className="text-xs text-blue-600 font-mono">{movement.referenceId}</div>
                      )}
                      {movement.reason && <div className="text-xs text-slate-500 mt-1">{movement.reason}</div>}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-700">{movement.createdBy}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {movements.length > pageSize && (
          <div className="border-t-2 border-slate-200 px-6 py-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-600">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, movements.length)} of {movements.length} movements
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 text-sm font-medium text-slate-700 border-2 border-slate-200 rounded-xl hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <span className="flex items-center px-4 text-sm font-bold text-slate-900">
                Page {page} of {Math.ceil(movements.length / pageSize)}
              </span>
              <button
                type="button"
                onClick={() => setPage(page + 1)}
                disabled={page * pageSize >= movements.length}
                className="px-4 py-2 text-sm font-medium text-slate-700 border-2 border-slate-200 rounded-xl hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="rounded-2xl bg-slate-50 border-2 border-slate-200 p-4 text-center">
        <p className="text-sm text-slate-600">
          Showing the last {movements.length} movements. 
          {selectedProductId ? ' Filtered by selected product.' : ' Displaying all recent movements.'}
        </p>
      </div>
    </div>
  );
};

export default InventoryViewPage;
