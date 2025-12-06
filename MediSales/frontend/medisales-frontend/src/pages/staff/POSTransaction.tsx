import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Minus,
  Package,
  Pill,
  Plus,
  Printer,
  Scan,
  Search,
  ShoppingCart,
  Trash,
  Filter
} from 'lucide-react';
import BarcodeScanner from '../../components/common/BarcodeScanner';
import { posService, type POSTransactionPayload } from '../../services/posService';
import { parseApiDate } from '../../utils/formatters';
import { useAuth } from '../../hooks/useAuth';
import type { Product } from '../../types/Product';
import type { Transaction } from '../../types/Transaction';
import signalRService from '../../services/signalRService';

const discountOptions = [
  { value: 'none' as const, label: 'None', rate: 0 },
  { value: 'senior' as const, label: 'Senior 20%', rate: 0.2 },
  { value: 'pwd' as const, label: 'PWD 20%', rate: 0.2 },
];

// Removed unused variable paymentOptions

const lowStockThreshold = 5;

const getProductStatusClasses = (stock: number) => {
  return stock <= lowStockThreshold
    ? 'bg-rose-100 text-rose-800 border border-rose-300 font-bold'
    : 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold';
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(value);

const formatQuantity = (value: number) => `${value} in stock`;

type CartItem = {
  product: Product;
  quantity: number;
};

type FeedbackState = {
  type: 'success' | 'error' | 'info';
  message: string;
};

const POSTransaction = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [quickInput, setQuickInput] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searching, setSearching] = useState(false);
  const [discount, setDiscount] = useState<'none' | 'senior' | 'pwd'>('none');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'GCash'>('Cash');
  const [paymentReferenceNumber, setPaymentReferenceNumber] = useState('');
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Helper function to parse quick multiply pattern (*5, *10, etc.)
  const parseQuickMultiply = (input: string): number | null => {
    // Match pattern: *5, *10, etc.
    const match = input.match(/^\*(\d+)$/);
    if (match) {
      const multiplier = parseInt(match[1]);
      return multiplier > 0 && multiplier <= 100 ? multiplier : null;
    }
    return null;
  };

  const fetchProducts = useCallback(
    async (term?: string) => {
      if (term && term.trim().length > 0) {
        setSearching(true);
      } else {
        setLoadingProducts(true);
      }

      try {
        const data = term && term.trim().length > 0
          ? await posService.searchProducts(term.trim())
          : await posService.getProducts();
        setProducts(data);
      } catch (error) {
        console.error('Failed to load POS products', error);
        setFeedback({ type: 'error', message: 'Unable to load products. Please try again.' });
      } finally {
        setLoadingProducts(false);
        setSearching(false);
      }
    },
    [], // Remove setFeedback from dependencies to prevent infinite loop
  );

  useEffect(() => {
    void fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only fetch once on mount

  // Listen for real-time product updates from admin
  useEffect(() => {
    // Product created - add to list
    signalRService.onProductCreated((product) => {
      console.log('🆕 Product created:', product);
      setProducts(prev => [...prev, {
        productId: product.productId,
        productCode: product.productCode,
        productName: product.productName,
        category: product.category,
        stockQuantity: product.stockQuantity,
        unitPrice: product.unitPrice,
        description: '',
        supplierName: '',
        expiryDate: null,
        manufacturingDate: null,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }]);
      setFeedback({ type: 'info', message: `New product added: ${product.productName}` });
    });

    // Product updated - update in list
    signalRService.onProductUpdated((product) => {
      console.log('✏️ Product updated:', product);
      setProducts(prev => prev.map(p => 
        p.productId === product.productId 
          ? { ...p, 
              productName: product.productName, 
              productCode: product.productCode,
              category: product.category,
              stockQuantity: product.stockQuantity,
              unitPrice: product.unitPrice,
              updatedAt: new Date().toISOString()
            }
          : p
      ));
      setFeedback({ type: 'info', message: `Product updated: ${product.productName}` });
    });

    // Product archived - remove from list
    signalRService.onProductArchived((product) => {
      console.log('🗑️ Product archived:', product);
      setProducts(prev => prev.filter(p => p.productId !== product.productId));
      // Remove from cart if exists
      setCart(prev => prev.filter(item => item.product.productId !== product.productId));
      setFeedback({ type: 'info', message: `Product archived: ${product.productName}` });
    });

    // Stock updated
    signalRService.onStockUpdated((productId, productName, newStock) => {
      console.log('📦 Stock updated:', productName, newStock);
      setProducts(prev => prev.map(p => 
        p.productId === productId 
          ? { ...p, stockQuantity: newStock, updatedAt: new Date().toISOString() }
          : p
      ));
    });

    // Cleanup listeners on unmount
    return () => {
      // Note: SignalR listeners are automatically cleaned up when connection closes
    };
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      // Only search if not a quick multiply pattern
      if (!parseQuickMultiply(quickInput)) {
        void fetchProducts(quickInput);
      } else {
        // If it's a multiply pattern, still load all products
        void fetchProducts('');
      }
    }, 400);

    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quickInput]); // Only depend on quickInput, not fetchProducts

  const categories = useMemo(() => {
    const unique = new Set<string>();
    products.forEach((product) => {
      if (product.category) {
        unique.add(product.category);
      }
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (categoryFilter === 'all') return products;
    return products.filter(p => p.category === categoryFilter);
  }, [products, categoryFilter]);

  // Sort products: In-stock items first (alphabetically), then low stock at bottom
  const sortedProducts = useMemo(() => {
    const LOW_STOCK_THRESHOLD = 15;
    
    const inStock = filteredProducts.filter(p => p.stockQuantity > LOW_STOCK_THRESHOLD);
    const lowStock = filteredProducts.filter(p => p.stockQuantity <= LOW_STOCK_THRESHOLD);
    
    // Sort in-stock alphabetically, low stock by quantity (lowest first)
    inStock.sort((a, b) => a.productName.localeCompare(b.productName));
    lowStock.sort((a, b) => a.stockQuantity - b.stockQuantity);
    
    return [...inStock, ...lowStock];
  }, [filteredProducts]);

  const handleAddToCart = useCallback(
    (product: Product, options?: { silent?: boolean; quantity?: number }) => {
      if (!options?.silent) {
        setFeedback(null);
      }

      const quantityToAdd = options?.quantity || 1;

      // Validate quantity range
      if (quantityToAdd < 1 || quantityToAdd > 100) {
        setFeedback({ 
          type: 'error', 
          message: `Invalid quantity. Please use a value between 1 and 100.` 
        });
        return false;
      }

      let added = false;
      setCart((previous) => {
        const existing = previous.find((item) => item.product.productId === product.productId);
        if (existing) {
          const newQuantity = existing.quantity + quantityToAdd;
          
          if (newQuantity > product.stockQuantity) {
            setFeedback({ 
              type: 'error', 
              message: `Only ${product.stockQuantity} units available for ${product.productName}.` 
            });
            return previous;
          }
          
          added = true;
          return previous.map((item) =>
            item.product.productId === product.productId
              ? { ...item, quantity: newQuantity }
              : item,
          );
        }

        if (quantityToAdd > product.stockQuantity) {
          setFeedback({ 
            type: 'error', 
            message: `Only ${product.stockQuantity} units available for ${product.productName}.` 
          });
          return previous;
        }

        if (product.stockQuantity <= 0) {
          setFeedback({ type: 'error', message: `${product.productName} is out of stock.` });
          return previous;
        }

        added = true;
        return [...previous, { product, quantity: quantityToAdd }];
      });

      // Show success message with quantity
      if (added && !options?.silent) {
        setFeedback({
          type: 'success',
          message: `Added ${quantityToAdd}x ${product.productName} to cart.`,
        });
      }

      return added;
    },
    [setCart, setFeedback],
  );

  const addProductByCode = useCallback(
    async (code: string) => {
      const trimmed = code.trim();
      if (!trimmed) {
        setFeedback({ type: 'error', message: 'Enter a barcode before searching.' });
        return;
      }

      setFeedback({ type: 'info', message: 'Looking up barcode...' });

      try {
        const product = await posService.findProductByCode(trimmed);

        if (!product) {
          setFeedback({ type: 'error', message: `No product found for barcode ${trimmed}.` });
          return;
        }

        const added = handleAddToCart(product, { silent: true });

        if (added) {
          setFeedback({
            type: 'success',
            message: `${product.productName} added to cart via scanner.`,
          });
        }
      } catch (error) {
        console.error('Failed to lookup product by barcode', error);
        setFeedback({ type: 'error', message: 'Unable to look up barcode. Please try again.' });
      }
    },
    [handleAddToCart, setFeedback],
  );

  const handleScannerDetected = useCallback(
    (code: string) => {
      setScannerOpen(false);
      void addProductByCode(code);
    },
    [addProductByCode, setScannerOpen],
  );

  const handleScannerError = useCallback(
    (_type: 'permission' | 'not-found' | 'general', message: string) => {
      setFeedback({ type: 'error', message });
    },
    [setFeedback],
  );

  // Handle product click with quick multiply support
  const handleProductClick = useCallback(
    (product: Product) => {
      const multiplier = parseQuickMultiply(quickInput);
      const quantity = multiplier || 1;
      
      // Add to cart with the specified quantity
      const added = handleAddToCart(product, { quantity });
      
      // Clear quick input if successfully added
      if (added) {
        setQuickInput('');
      }
    },
    [quickInput, parseQuickMultiply, handleAddToCart],
  );

  const handleRemoveFromCart = (productId: number) => {
    setCart((previous) => previous.filter((item) => item.product.productId !== productId));
  };

  const handleUpdateQuantity = useCallback((productId: number, value: string) => {
    // Check if it's a quick multiply pattern
    const multiplier = parseQuickMultiply(value);
    const newQuantity = multiplier || parseInt(value, 10);

    if (isNaN(newQuantity) || newQuantity < 1) {
      setFeedback({ type: 'error', message: 'Quantity must be at least 1.' });
      return;
    }

    if (newQuantity > 100) {
      setFeedback({ type: 'error', message: 'Quantity cannot exceed 100.' });
      return;
    }

    setCart((previous) => {
      return previous.map((item) => {
        if (item.product.productId === productId) {
          // Check against available stock
          if (newQuantity > item.product.stockQuantity) {
            setFeedback({ 
              type: 'error', 
              message: `Only ${item.product.stockQuantity} units available for ${item.product.productName}.` 
            });
            return item; // Don't update
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
    });
  }, [setCart, setFeedback, parseQuickMultiply]);

  const handleIncrementQuantity = useCallback((productId: number) => {
    setCart((previous) => {
      return previous.map((item) => {
        if (item.product.productId === productId) {
          const newQuantity = item.quantity + 1;
          if (newQuantity > item.product.stockQuantity) {
            setFeedback({ 
              type: 'error', 
              message: `Only ${item.product.stockQuantity} units available for ${item.product.productName}.` 
            });
            return item;
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
    });
  }, [setCart, setFeedback]);

  const handleDecrementQuantity = useCallback((productId: number) => {
    setCart((previous) => {
      return previous.map((item) => {
        if (item.product.productId === productId) {
          const newQuantity = Math.max(1, item.quantity - 1);
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
    });
  }, [setCart]);

  const handleClearCart = () => {
    setCart([]);
    setFeedback(null);
    setLastTransaction(null);
    setDiscount('none');
    setPaymentMethod('Cash');
  };

  const cartTotals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.product.unitPrice * item.quantity, 0);
    const discountRate = discountOptions.find((option) => option.value === discount)?.rate ?? 0;
    const discountAmount = subtotal * discountRate;
    const total = subtotal - discountAmount;
    return { subtotal, discountAmount, total };
  }, [cart, discount]);

  const validateStockBeforeCheckout = () => {
    const insufficientItem = cart.find((item) => {
      const latestProduct = products.find((product) => product.productId === item.product.productId);
      const availableStock = latestProduct?.stockQuantity ?? item.product.stockQuantity;
      return item.quantity > availableStock;
    });

    if (insufficientItem) {
      setFeedback({ type: 'error', message: `${insufficientItem.product.productName} exceeds available stock.` });
      return false;
    }

    return true;
  };

  const handleCompleteTransaction = async () => {
    if (cart.length === 0) {
      setFeedback({ type: 'error', message: 'Add items to the cart before completing the transaction.' });
      return;
    }

    if (!validateStockBeforeCheckout()) {
      return;
    }

    if (!user || !user.userId) {
      setFeedback({ type: 'error', message: 'Authentication error: User ID not found. Please re-login.' });
      return;
    }

    const payload: POSTransactionPayload = {
      userId: user.userId,
      items: cart.map((item) => ({
        productId: item.product.productId,
        quantity: item.quantity,
        unitPrice: item.product.unitPrice,
      })),
      discountType: discount === 'senior' ? 'SeniorCitizen' : discount === 'pwd' ? 'PWD' : 'None',
      paymentMethod,
      paymentReferenceNumber: paymentMethod === 'GCash' ? paymentReferenceNumber : undefined,
      amountPaid: cartTotals.total,
    };

    setProcessing(true);
    try {
      const transaction = await posService.createTransaction(payload);
      setFeedback({ type: 'success', message: 'Transaction completed successfully.' });
      setLastTransaction(transaction);
      setCart([]);
      setDiscount('none');
      setPaymentMethod('Cash');
      setPaymentReferenceNumber('');
      setQuickInput('');
      await fetchProducts('');
    } catch (error) {
      console.error('Failed to complete transaction', error);
      setFeedback({ type: 'error', message: 'Failed to complete the transaction. Please try again.' });
    } finally {
      setProcessing(false);
    }
  };

  const handlePrintReceipt = () => {
    if (!lastTransaction) return;
    // Build receipt HTML similar to admin
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const storeName = 'MediSales POS System';
    const storeAddress = 'Pharmacy Address';
    const transactionCode = lastTransaction.transactionCode || '';
    const cashier = user?.fullName || 'System Administrator';
    const dateTime = parseApiDate(lastTransaction.createdAt || Date.now()).toLocaleString('en-PH', { timeZone: 'Asia/Manila' });
    const paymentMethod: string = lastTransaction.paymentMethod || '';
    const items = lastTransaction.items || [];
    const subtotal = lastTransaction.totalAmount || 0;
    const total = lastTransaction.totalAmount || subtotal;
    const amountPaid = total;
    const changeAmount = 0;

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${transactionCode}</title>
        <style>
          body { font-family: monospace; max-width: 300px; margin: 20px auto; }
          .header { text-align: center; margin-bottom: 20px; }
          .row { display: flex; justify-content: space-between; margin: 5px 0; }
          .items { border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 10px 0; }
          .total { font-weight: bold; font-size: 1.2em; margin-top: 10px; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>${storeName}</h2>
          <p>${storeAddress}</p>
          <p>${transactionCode}</p>
          <p>${dateTime}</p>
          <p>Cashier: ${cashier}</p>
        </div>
        <div class="items">
          ${items.map((item: any) => `
            <div class="row">
              <span>${item.productName || item.product?.productName || ''} (x${item.quantity})</span>
            </div>
            <div class="row">
              <span></span><span>₱${(item.unitPrice * item.quantity).toFixed(2)}</span>
            </div>
          `).join('')}
        </div>
        <div class="row"><span>Subtotal:</span><span>₱${subtotal.toFixed(2)}</span></div>
        <div class="row total"><span>Total:</span><span>₱${total.toFixed(2)}</span></div>
        <div class="row"><span>Payment (${paymentMethod}):</span><span>₱${amountPaid.toFixed(2)}</span></div>
        <div class="row"><span>Change:</span><span>₱${changeAmount.toFixed(2)}</span></div>
        <br/>
        <button onclick="window.print()" style="width: 100%; padding: 10px; cursor: pointer;">Print Receipt</button>
      </body>
      </html>
    `;
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
  };

  const handleScanBarcode = () => {
    setFeedback(null);
    setScannerOpen(true);
  };

  const isLoadingState = loadingProducts || searching;

  return (
    <>
      <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">POS TERMINAL</h1>
          <p className="mt-1 text-sm font-bold text-slate-500 uppercase tracking-wide">Process sales and manage checkout</p>
        </div>
        <button
          type="button"
          onClick={handleScanBarcode}
          className="flex items-center gap-2 rounded-xl border-2 border-blue-500 bg-gradient-to-br from-blue-500 to-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0"
        >
          <Scan className="h-5 w-5" aria-hidden="true" />
          SCAN BARCODE
        </button>
      </header>

      {feedback ? (
        <div
          className={`flex items-center justify-between gap-4 rounded-xl border-2 px-5 py-4 text-sm font-bold shadow-md ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : feedback.type === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-800'
                : 'border-sky-200 bg-sky-50 text-sky-800'
          }`}
        >
          <div className="flex items-center gap-3">
            {feedback.type === 'success' ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              </div>
            ) : feedback.type === 'error' ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </div>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                <Info className="h-5 w-5" aria-hidden="true" />
              </div>
            )}
            <span>{feedback.message}</span>
          </div>
          {feedback.type === 'success' && lastTransaction ? (
            <button
              type="button"
              onClick={handlePrintReceipt}
              className="flex items-center gap-2 rounded-lg border-2 border-blue-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-blue-700 shadow-sm hover:bg-blue-50 hover:border-blue-300 transition-all"
            >
              <Printer className="h-4 w-4" aria-hidden="true" />
              Print receipt
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]" style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}>
        <section className="flex flex-col h-full overflow-hidden">
          <div className="rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-lg mb-4 shrink-0">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative group flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" aria-hidden="true" />
                <input
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  placeholder="SEARCH MEDICINE OR TYPE *5 FOR QUICK MULTIPLY"
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
            </div>
          </div>

          <div className="rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-lg flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 uppercase tracking-tight">Available Products</h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Click to add to cart</p>
                </div>
              </div>
              <span className="text-xs font-bold uppercase tracking-wide text-blue-700 bg-blue-100 px-3 py-1.5 rounded-full border border-blue-200">
                {sortedProducts.length} Items
              </span>
            </div>
            
            {isLoadingState ? (
              <div className="flex-1 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 text-sm font-bold text-slate-400">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500 mb-4"></div>
                LOADING PRODUCTS...
              </div>
            ) : sortedProducts.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 text-sm font-bold text-slate-400">
                <Search className="h-8 w-8 mb-2 opacity-50" />
                NO PRODUCTS FOUND
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {sortedProducts.map((product) => {
                  const stockBadge = getProductStatusClasses(product.stockQuantity);
                  const isLowStock = product.stockQuantity <= lowStockThreshold;
                  return (
                    <button
                      key={product.productId}
                      type="button"
                      onClick={() => handleProductClick(product)}
                      className={`group flex flex-col rounded-xl border-2 bg-white p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 ${
                        isLowStock 
                          ? 'border-amber-200 hover:border-amber-300 bg-amber-50/30' 
                          : 'border-slate-100 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg shadow-md group-hover:scale-105 transition-transform ${
                          isLowStock
                            ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-500/20'
                            : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/20'
                        }`}>
                          <Pill className="h-5 w-5 text-white" aria-hidden="true" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded inline-block ${
                            isLowStock ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                          }`}>{product.category}</p>
                          <h3 className="truncate text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors mt-1">{product.productName}</h3>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                        <p className="text-base font-extrabold text-slate-900">{formatCurrency(product.unitPrice)}</p>
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${stockBadge}`}>
                          {formatQuantity(product.stockQuantity)}
                        </span>
                      </div>
                    </button>
                  );
                })}
                </div>
              </div>
            )}
          </div>
        </section>

        <aside className="flex flex-col h-full overflow-hidden">
          <div className="rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-lg flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex items-center justify-between mb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
                    <ShoppingCart className="h-5 w-5 text-white" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 uppercase tracking-tight">Cart</h2>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{cart.length} Items Added</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar min-h-0">
                {cart.length === 0 ? (
                  <div className="flex h-32 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-400">
                    <ShoppingCart className="h-8 w-8 mb-2 opacity-20" />
                    Cart is empty
                  </div>
                ) : (
                  cart.map((item) => {
                    const isAtMaxStock = item.quantity >= item.product.stockQuantity;
                    const itemSubtotal = item.product.unitPrice * item.quantity;
                    
                    return (
                    <div
                      key={item.product.productId}
                      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3 transition-all hover:bg-white hover:shadow-md hover:border-blue-100"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-slate-900 truncate">{item.product.productName}</h3>
                          <p className="text-xs font-semibold text-slate-500">
                            {formatCurrency(item.product.unitPrice)} / unit
                          </p>
                          {item.product.stockQuantity <= lowStockThreshold && (
                            <p className="text-[10px] font-bold text-rose-600 flex items-center gap-1 mt-1 uppercase tracking-wide">
                              <AlertTriangle className="h-3 w-3" />
                              Low stock: {item.product.stockQuantity} left
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(item.product.productId)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          aria-label={`Remove ${item.product.productName}`}
                        >
                          <Trash className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-1 bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
                          <button
                            type="button"
                            onClick={() => handleDecrementQuantity(item.product.productId)}
                            disabled={item.quantity <= 1}
                            className="rounded-md p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                          >
                            <Minus className="h-3 w-3" aria-hidden="true" />
                          </button>
                          
                          <input
                            type="text"
                            min="1"
                            max={item.product.stockQuantity}
                            value={item.quantity}
                            onChange={(e) => {
                              handleUpdateQuantity(item.product.productId, e.target.value);
                            }}
                            onFocus={(e) => e.target.select()}
                            className="w-12 text-center text-sm font-bold text-slate-900 focus:outline-none bg-transparent"
                          />
                          
                          <button
                            type="button"
                            onClick={() => handleIncrementQuantity(item.product.productId)}
                            disabled={isAtMaxStock}
                            className="rounded-md p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                          >
                            <Plus className="h-3 w-3" aria-hidden="true" />
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Subtotal</p>
                          <p className="text-sm font-extrabold text-slate-900">
                            {formatCurrency(itemSubtotal)}
                          </p>
                        </div>
                      </div>
                    </div>
                    );
                  })
                )}
              </div>

              <div className="mt-4 space-y-3 pt-4 border-t-2 border-slate-100">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Discount</span>
                  <select
                    value={discount}
                    onChange={(event) => setDiscount(event.target.value as typeof discount)}
                    className="mt-1.5 w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-900 shadow-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                  >
                    {discountOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Payment Method</span>
                  <select
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value as typeof paymentMethod)}
                    className="mt-1.5 w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-900 shadow-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                  >
                    <option value="Cash">Cash</option>
                    <option value="GCash">GCash</option>
                  </select>
                </label>

                {paymentMethod === 'GCash' && (
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">GCash Reference Number</span>
                    <input
                      type="text"
                      value={paymentReferenceNumber}
                      onChange={(e) => setPaymentReferenceNumber(e.target.value)}
                      placeholder="Enter GCash reference number"
                      className="mt-1.5 w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-900 shadow-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                      maxLength={50}
                    />
                  </label>
                )}
              </div>
          </div>

          <div className="rounded-2xl border-2 border-blue-500 bg-gradient-to-br from-blue-600 to-blue-700 p-5 text-white shadow-xl shadow-blue-500/20 mt-4 shrink-0">
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold uppercase tracking-wide text-blue-100">Subtotal</span>
                  <span className="font-bold">{formatCurrency(cartTotals.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold uppercase tracking-wide text-blue-100">Discount</span>
                  <span className="font-bold text-emerald-300">- {formatCurrency(cartTotals.discountAmount)}</span>
                </div>
                <div className="h-px bg-white/20 my-2"></div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold uppercase tracking-wide text-white">Total Due</span>
                  <span className="text-3xl font-extrabold tracking-tight">{formatCurrency(cartTotals.total)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => void handleCompleteTransaction()}
                  className="w-full rounded-xl bg-white py-3.5 text-sm font-extrabold uppercase tracking-wide text-blue-600 shadow-lg transition-all hover:bg-blue-50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed"
                  disabled={cart.length === 0 || processing}
                >
                  {processing ? 'Processing...' : 'Complete Transaction'}
                </button>
                <button
                  type="button"
                  onClick={handleClearCart}
                  className="w-full rounded-xl border-2 border-white/30 bg-transparent py-3 text-xs font-bold uppercase tracking-wide text-white transition-all hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={cart.length === 0 && !feedback}
                >
                  Clear Cart
                </button>
              </div>
            </div>
        </aside>
      </div>
      </div>

      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={handleScannerDetected}
        onError={handleScannerError}
      />
    </>
  );
};

export default POSTransaction;
