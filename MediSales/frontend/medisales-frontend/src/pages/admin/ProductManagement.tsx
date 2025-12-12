import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Archive,
  ArchiveRestore,
  Eye,
  PencilLine,
  Plus,
  Search,
  X,
  Package,
  Filter,
  Truck
} from 'lucide-react';
import AddProductModal from '../../components/admin/AddProductModal';
import EditProductModal from '../../components/admin/EditProductModal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { productService } from '../../services/productService';
import type { Product, ProductFilter } from '../../types/Product';
import type { ProductPayload } from '../../services/productService';
import Spinner, { CenteredSpinner } from '../../components/common/Spinner';
import { errorToast, successToast } from '../../utils/toast';
import api from '../../services/api';
import { PH_LOCALE, PH_TIME_ZONE } from '../../utils/formatters';

type ProductDetailsModalProps = {
  open: boolean;
  product: Product | null;
  onClose: () => void;
};

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
});

const formatDate = (value?: string | null) => {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleDateString(PH_LOCALE, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: PH_TIME_ZONE,
  });
};

const ProductDetailsModal = ({ open, product, onClose }: ProductDetailsModalProps) => {
  const [arrivalDate, setArrivalDate] = useState<string | null>(null);
  const [loadingArrival, setLoadingArrival] = useState(false);

  useEffect(() => {
    const fetchArrivalDate = async () => {
      if (!open || !product) return;
      setLoadingArrival(true);
      try {
        const response = await api.get(`/Products/${product.productId}/arrival-date`);
        setArrivalDate(response.data.arrivalDate);
      } catch (error) {
        console.error('Failed to fetch arrival date:', error);
        setArrivalDate(null);
      } finally {
        setLoadingArrival(false);
      }
    };
    fetchArrivalDate();
  }, [open, product]);

  if (!open || !product) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-8 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-2xl border-2 border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b-2 border-slate-100 bg-slate-50/50 p-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Product Details</h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">Quick read-only snapshot</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border-2 border-slate-200 bg-white p-2 text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all"
            aria-label="Close product details"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-6">
          <dl className="grid gap-6 sm:grid-cols-2">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">Product Code</dt>
              <dd className="text-sm font-bold text-slate-900 font-mono">{product.productCode}</dd>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">Product Name</dt>
              <dd className="text-sm font-bold text-slate-900">{product.productName}</dd>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">Category</dt>
              <dd className="text-sm font-bold text-slate-900">{product.category || '—'}</dd>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">Supplier</dt>
              <dd className="text-sm font-bold text-slate-900">{product.supplierName || '—'}</dd>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">Unit Price</dt>
              <dd className="text-lg font-extrabold text-slate-900">{currencyFormatter.format(product.unitPrice)}</dd>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">Current Stock</dt>
              <dd className="mt-1 inline-flex items-center gap-2">
                <span
                  className={`border px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                    product.stockQuantity < 20
                      ? 'border-rose-200 bg-rose-100 text-rose-700'
                      : 'border-emerald-200 bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {product.stockQuantity} units
                </span>
              </dd>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">Expiry Date</dt>
              <dd className="text-sm font-bold text-slate-900">{formatDate(product.expiryDate)}</dd>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1 flex items-center gap-1">
                <Truck className="h-3 w-3" />
                First Arrival Date
              </dt>
              <dd className="text-sm font-bold text-slate-900">
                {loadingArrival ? (
                  <span className="text-slate-400 italic">Loading...</span>
                ) : arrivalDate ? (
                  formatDate(arrivalDate)
                ) : (
                  <span className="text-slate-400">No arrival record</span>
                )}
              </dd>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">Last Updated</dt>
              <dd className="text-sm font-bold text-slate-900">{formatDate(product.updatedAt)}</dd>
            </div>
            <div className="sm:col-span-2 bg-slate-50 rounded-xl p-4 border border-slate-100">
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Description</dt>
              <dd className="text-sm text-slate-600 leading-relaxed">
                {product.description || 'No description provided.'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};

const ProductManagement = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setCurrentPage(1); // Reset to page 1 on search
    }, 300);

    return () => window.clearTimeout(handle);
  }, [searchTerm]);

  const activeFilter = useMemo<ProductFilter>(() => {
    const filter: ProductFilter = {};

    if (debouncedSearch) {
      filter.search = debouncedSearch;
    }

    if (categoryFilter !== 'all') {
      filter.category = categoryFilter;
    }

    return filter;
  }, [debouncedSearch, categoryFilter]);

  const fetchProducts = useCallback(async (filter?: ProductFilter, includeArchived = false) => {
    setLoading(true);
    setError(null);

    try {
      if (includeArchived) {
        const data = await productService.getArchivedProducts(filter);
        setProducts(data);
        setTotalPages(1);
        setTotalCount(data.length);
      } else {
        const response = await productService.getProducts(filter, currentPage, pageSize);
        setProducts(response.data);
        setTotalPages(response.totalPages);
        setTotalCount(response.totalCount);
      }
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Failed to load products.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]);

  useEffect(() => {
    void fetchProducts(activeFilter, showArchived);
  }, [activeFilter, showArchived, fetchProducts]);

  const categories = useMemo(() => {
    const unique = new Set<string>();
    products.forEach((product) => {
      if (product.category) {
        unique.add(product.category);
      }
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const handleAddProduct = async (payload: ProductPayload) => {
    await productService.addProduct(payload);
    await fetchProducts(activeFilter);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setEditModalOpen(true);
  };

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setViewModalOpen(true);
  };

  const handleUpdateProduct = async (productId: number, payload: ProductPayload) => {
    await productService.updateProduct(productId, payload);
    await fetchProducts(activeFilter, showArchived);
  };

  const handleArchiveProduct = async (productId: number) => {
    const product = products.find((item) => item.productId === productId);
    const productLabel = product?.productName ?? 'this product';

    const confirmed = window.confirm(`Are you sure you want to archive ${productLabel}? This item will be hidden from active lists. You can restore it later.`);

    if (!confirmed) {
      return;
    }

    setDeletingProductId(productId);

    try {
      await productService.archiveProduct(productId);
      await fetchProducts(activeFilter, showArchived);
      successToast('Product archived successfully!');
    } catch {
      errorToast('Failed to archive product');
    } finally {
      setDeletingProductId(null);
    }
  };

  const handleRestoreProduct = async (productId: number) => {
    const product = products.find((item) => item.productId === productId);
    const productLabel = product?.productName ?? 'this product';

    const confirmed = window.confirm(`Are you sure you want to restore ${productLabel}?`);

    if (!confirmed) {
      return;
    }

    setDeletingProductId(productId);

    try {
      await productService.restoreProduct(productId);
      await fetchProducts(activeFilter, showArchived);
      successToast('Product restored successfully!');
    } catch {
      errorToast('Failed to restore product');
    } finally {
      setDeletingProductId(null);
    }
  };

  const handleToggleSelectProduct = (productId: number) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAllProducts = () => {
    if (selectedProductIds.length === products.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(products.map((p) => p.productId));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProductIds.length === 0) return;

    setBulkDeleting(true);
    try {
      const response = await fetch('http://localhost:5012/api/products/bulk-archive', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(selectedProductIds),
      });

      if (!response.ok) {
        throw new Error('Bulk archive failed');
      }

      const result = await response.json();
      successToast(`Successfully archived ${result.archivedCount} of ${result.totalRequested} products`);
      setSelectedProductIds([]);
      setBulkDeleteModalOpen(false);
      await fetchProducts(activeFilter, showArchived);
    } catch {
      errorToast('Failed to archive products');
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleRetry = () => {
    void fetchProducts(activeFilter);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
  };

  const hasActiveFilters = Boolean(debouncedSearch || categoryFilter !== 'all');

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30">
            <Package className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">PRODUCT MANAGEMENT</h1>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">
              Search, filter, and maintain the product catalog
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {selectedProductIds.length > 0 && (
            <button
              type="button"
              onClick={() => setBulkDeleteModalOpen(true)}
              className="flex items-center gap-2 rounded-xl border-2 border-orange-200 bg-orange-50 px-5 py-3 text-sm font-bold text-orange-700 shadow-sm hover:bg-orange-100 hover:border-orange-300 transition-all uppercase tracking-wide"
            >
              <Archive className="h-4 w-4" />
              Archive {selectedProductIds.length} Selected
            </button>
          )}
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-2 rounded-xl border-2 border-blue-600 bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-105 transition-all uppercase tracking-wide"
          >
            <Plus className="h-5 w-5" />
            Add Product
          </button>
        </div>
      </div>

      {/* Filters Card */}
      <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-lg">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative min-w-[280px] flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by product name or code..."
              className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-12 py-3.5 text-sm font-bold text-slate-900 shadow-sm transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 placeholder:font-medium placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3">
              <Filter className="h-4 w-4 text-slate-500" />
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none min-w-[140px]"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-3 rounded-xl border-2 border-slate-200 bg-white px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="h-5 w-5 rounded border-2 border-slate-300 text-blue-600 focus:ring-blue-500/20"
              />
              <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">Show Archived</span>
            </label>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-2 rounded-xl border-2 border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700 shadow-sm hover:bg-rose-100 hover:border-rose-300 transition-all uppercase tracking-wide"
              >
                <X className="h-4 w-4" />
                Clear
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-6 flex items-center justify-between rounded-xl border-2 border-rose-200 bg-rose-50 p-4 text-rose-800">
            <div className="flex items-center gap-3 font-bold">
              <X className="h-5 w-5" aria-hidden="true" />
              {error}
            </div>
            <button
              type="button"
              onClick={handleRetry}
              className="rounded-lg bg-white px-4 py-2 text-xs font-bold text-rose-700 shadow-sm hover:bg-rose-50 border border-rose-200"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-lg">
        <div className="max-h-[600px] overflow-x-auto overflow-y-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 border-b-2 border-slate-200">
              <tr className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedProductIds.length === products.length && products.length > 0}
                    onChange={handleSelectAllProducts}
                    className="h-5 w-5 rounded border-2 border-slate-300 text-blue-600 focus:ring-blue-500/20"
                  />
                </th>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-right">Price</th>
                <th className="px-6 py-4 text-right">Stock</th>
                <th className="px-6 py-4">Supplier</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={8} className="px-6 py-12">
                    <CenteredSpinner />
                  </td>
                </tr>
              )}

              {!loading && products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Package className="h-12 w-12 text-slate-300" />
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                        {hasActiveFilters ? 'No products match your filters' : 'No products found'}
                      </p>
                      {!hasActiveFilters && (
                        <button
                          onClick={() => setAddModalOpen(true)}
                          className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          Add your first product
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : null}

              {!loading
                ? products.map((product) => {
                    const stockStatusClass =
                      product.stockQuantity < 20
                        ? 'bg-rose-100 text-rose-800 border-rose-200'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-200';
                    
                    const isArchived = product.isArchived === true;
                    const rowClass = isArchived 
                      ? 'bg-slate-50/80 opacity-75 hover:bg-slate-100' 
                      : 'hover:bg-slate-50 transition-colors duration-150 group';

                    return (
                      <tr key={product.productId} className={rowClass}>
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedProductIds.includes(product.productId)}
                            onChange={() => handleToggleSelectProduct(product.productId)}
                            className="h-5 w-5 rounded border-2 border-slate-300 text-blue-600 focus:ring-blue-500/20"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs font-bold text-slate-700 border border-slate-200">
                              {product.productCode}
                            </span>
                            {isArchived && (
                              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                                Archived
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{product.productName}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 border border-blue-100">
                            {product.category || 'Uncategorized'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900">
                          {currencyFormatter.format(product.unitPrice)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`inline-flex items-center justify-end rounded-full border px-2.5 py-0.5 text-xs font-bold shadow-sm ${stockStatusClass}`}>
                            {product.stockQuantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-600">{product.supplierName || '—'}</td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleViewProduct(product)}
                              className="p-2 rounded-lg border-2 border-blue-100 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:border-blue-300 transition-all"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {!isArchived && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleEditProduct(product)}
                                  className="p-2 rounded-lg border-2 border-amber-100 bg-amber-50 text-amber-600 hover:bg-amber-100 hover:border-amber-300 transition-all"
                                  title="Edit Product"
                                >
                                  <PencilLine className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleArchiveProduct(product.productId)}
                                  className="p-2 rounded-lg border-2 border-orange-100 bg-orange-50 text-orange-600 hover:bg-orange-100 hover:border-orange-300 transition-all"
                                  disabled={deletingProductId === product.productId}
                                  title="Archive Product"
                                >
                                  {deletingProductId === product.productId ? (
                                    <Spinner size="sm" />
                                  ) : (
                                    <Archive className="h-4 w-4" />
                                  )}
                                </button>
                              </>
                            )}
                            {isArchived && (
                              <button
                                type="button"
                                onClick={() => handleRestoreProduct(product.productId)}
                                className="p-2 rounded-lg border-2 border-emerald-100 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:border-emerald-300 transition-all"
                                disabled={deletingProductId === product.productId}
                                title="Restore Product"
                              >
                                {deletingProductId === product.productId ? (
                                  <Spinner size="sm" />
                                ) : (
                                  <ArchiveRestore className="h-4 w-4" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                : null}
            </tbody>
          </table>
        </div>
          
        {/* Pagination Controls */}
        {!loading && !showArchived && products.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t-2 border-slate-200 bg-slate-50 px-6 py-4">
            <div className="text-sm font-medium text-slate-600">
              Showing <span className="font-bold text-slate-900">{(currentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="font-bold text-slate-900">{Math.min(currentPage * pageSize, totalCount)}</span> of{' '}
              <span className="font-bold text-slate-900">{totalCount}</span> results
            </div>
            
            <nav className="isolate inline-flex rounded-md shadow-sm gap-2" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              
              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((page, index, array) => {
                    const isGap = index > 0 && page - array[index - 1] > 1;
                    return (
                      <div key={page} className="flex items-center">
                        {isGap && <span className="px-2 text-sm font-medium text-slate-500">...</span>}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`rounded-lg px-4 py-2 text-sm font-medium ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {page}
                        </button>
                      </div>
                    );
                  })}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </div>

      <AddProductModal
        open={addModalOpen}
        categories={categories}
        onClose={() => setAddModalOpen(false)}
        onSave={handleAddProduct}
      />

      <EditProductModal
        open={editModalOpen}
        categories={categories}
        product={selectedProduct}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedProduct(null);
        }}
        onSave={handleUpdateProduct}
      />

      <ProductDetailsModal
        open={viewModalOpen}
        product={selectedProduct}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedProduct(null);
        }}
      />

      <ConfirmModal
        isOpen={bulkDeleteModalOpen}
        onClose={() => setBulkDeleteModalOpen(false)}
        onConfirm={handleBulkDelete}
        title="Bulk Archive Products"
        message={`Are you sure you want to archive ${selectedProductIds.length} selected product(s)? These items will be hidden from active lists. You can restore them later.`}
        confirmText="Archive All"
        cancelText="Cancel"
        isLoading={bulkDeleting}
        variant="warning"
      />
    </div>
  );
};

export default ProductManagement;
