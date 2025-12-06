import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { Barcode, PackageSearch, Search, Tag, Pill, Package, Filter, X } from 'lucide-react';
import { productService } from '../../services/productService';
import type { Product, ProductFilter } from '../../types/Product';
import { PH_LOCALE, PH_TIME_ZONE } from '../../utils/formatters';

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
});

const getStockBadgeClass = (stock: number) => {
  if (stock <= 5) {
    return 'bg-rose-100 text-rose-800 border border-rose-200 font-bold';
  }

  if (stock <= 15) {
    return 'bg-amber-100 text-amber-800 border border-amber-200 font-bold';
  }

  return 'bg-blue-100 text-blue-800 border border-blue-200 font-bold';
};

const StaffProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 12;

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setPage(1); // Reset page on search
    }, 350);

    return () => window.clearTimeout(handle);
  }, [searchTerm]);

  const categories = useMemo(() => {
    const unique = new Set<string>();
    products.forEach((product) => {
      if (product.category) {
        unique.add(product.category);
      }
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const fetchProducts = useCallback(async (term?: string, category?: string) => {
    setError(null);
    setLoading(true);

    try {
      const filter: ProductFilter = {};
      if (term) filter.search = term;
      if (category && category !== 'all') filter.category = category;

      const response = await productService.getProducts(filter, page, pageSize);
      setProducts(response.data);
      setTotalCount(response.totalCount);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Unable to load products right now.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    void fetchProducts(debouncedSearch, categoryFilter);
  }, [debouncedSearch, categoryFilter, fetchProducts]);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
  };

  const hasActiveFilters = Boolean(debouncedSearch || categoryFilter !== 'all');

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
            <Package className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Product Catalog</h1>
            <p className="mt-1 text-sm font-medium text-slate-600">Browse the latest stock levels and item details.</p>
          </div>
        </div>
        <span className="text-xs font-bold uppercase tracking-wide text-blue-700 bg-blue-100 px-4 py-2 rounded-full border border-blue-200">
          {totalCount} Products
        </span>
      </div>

      {/* Search Box */}
      <div className="rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-lg">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative group flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" aria-hidden="true" />
            <input
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="SEARCH BY PRODUCT NAME OR CODE..."
              className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-12 py-3 text-sm font-bold text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
            />
          </div>
          
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

      {error ? (
        <div className="border-2 border-rose-200 bg-rose-50 p-6 text-sm text-rose-600">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="animate-pulse border-2 border-slate-200 bg-white p-5">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 bg-slate-200" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 w-32 bg-slate-200" />
                  <div className="h-3 w-24 bg-slate-200" />
                  <div className="h-3 w-16 bg-slate-200" />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="h-3 bg-slate-200" />
                <div className="h-3 bg-slate-200" />
                <div className="h-3 bg-slate-200" />
                <div className="h-3 bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white p-12 text-center shadow-md">
          <PackageSearch className="h-16 w-16 text-slate-400" aria-hidden="true" />
          <p className="mt-4 text-lg font-bold text-slate-900">No products found</p>
          <p className="mt-1 text-sm font-semibold text-slate-600">Try adjusting your search keywords or confirm with the admin team.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => {
            const badgeClass = getStockBadgeClass(product.stockQuantity);
            const isLowStock = product.stockQuantity <= 15;
            return (
              <div
                key={product.productId}
                className={`group flex flex-col rounded-xl border-2 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                  isLowStock 
                    ? 'border-amber-200 hover:border-amber-300 bg-amber-50/30' 
                    : 'border-slate-100 hover:border-blue-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-md group-hover:scale-105 transition-transform ${
                    isLowStock
                      ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-500/20'
                      : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/20'
                  }`}>
                    <Pill className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      <Barcode className="h-3 w-3" aria-hidden="true" />
                      {product.productCode}
                    </div>
                    <h2 className="mt-1 text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">{product.productName}</h2>
                    <p className={`text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded inline-block mt-1 ${
                      isLowStock ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                    }`}>{product.category || 'Uncategorized'}</p>
                  </div>
                  <span className={`shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase ${badgeClass}`}>
                    {product.stockQuantity} in stock
                  </span>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-700 pt-3 border-t border-slate-100">
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Unit Price</dt>
                    <dd className="mt-0.5 text-base font-extrabold text-slate-900">{currencyFormatter.format(product.unitPrice)}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Category</dt>
                    <dd className="mt-0.5 flex items-center gap-1.5 font-bold text-sm">
                      <Tag className="h-3.5 w-3.5 text-blue-500" aria-hidden="true" />
                      <span>{product.category || 'Not set'}</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Supplier</dt>
                    <dd className="mt-0.5 font-semibold text-sm">{product.supplierName || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Updated</dt>
                    <dd className="mt-0.5 font-semibold text-sm">
                      {new Date(product.updatedAt).toLocaleDateString(PH_LOCALE, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        timeZone: PH_TIME_ZONE,
                      })}
                    </dd>
                  </div>
                </dl>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalCount > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-lg">
          <p className="text-sm font-semibold text-slate-700 mb-4 sm:mb-0">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} products
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="rounded-xl border-2 border-slate-300 bg-white px-6 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:border-blue-500 hover:bg-blue-500 hover:text-white hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-slate-300 disabled:hover:bg-white disabled:hover:text-slate-700"
            >
              Previous
            </button>
            <span className="flex items-center px-4 text-sm font-bold text-slate-900">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="rounded-xl border-2 border-slate-300 bg-white px-6 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:border-blue-500 hover:bg-blue-500 hover:text-white hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-slate-300 disabled:hover:bg-white disabled:hover:text-slate-700"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffProducts;
