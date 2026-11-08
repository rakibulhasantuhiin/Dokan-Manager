import React, { useState, useMemo, useRef } from 'react';
import {
  ArrowLeft,
  Camera,
  Search,
  Plus,
  Minus,
  Trash2,
  Receipt,
  ShoppingBasket,
  BookOpen,
  Monitor,
  ShoppingCart,
  X,
  Zap,
} from 'lucide-react';
import { useDokan } from '../context/DokanContext';
import { Product, CartItem, SaleRecord, MainCategory } from '../types';
import { formatTaka, toBengaliNumber } from '../utils/bengali';
import { calculateSaleProfit } from '../utils/calculations';

interface SaleViewProps {
  onBack: () => void;
  onOpenScanner: () => void;
  onSaleComplete: (sale: SaleRecord) => void;
}

export const SaleView: React.FC<SaleViewProps> = ({
  onBack,
  onOpenScanner,
  onSaleComplete,
}) => {
  const { products, customers, completeSale, addCustomer } = useDokan();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'সব' | MainCategory>('সব');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [isAddingNewCustomer, setIsAddingNewCustomer] = useState(false);
  const [discount, setDiscount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [paymentType, setPaymentType] = useState<'cash' | 'due' | 'partial'>('cash');
  const [notification, setNotification] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  const notifyTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Filter products by selected category and search query
  const catalogProducts = useMemo(() => {
    return products.filter((p) => {
      const prodMain = p.mainCategory || 'মুদি';
      if (selectedCategory !== 'সব' && prodMain !== selectedCategory) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q))
      );
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart calculations
  const totalCartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  }, [cart]);

  const grandTotal = Math.max(0, subtotal - discount);

  // Set paid amount default based on payment type
  const actualPaidAmount = useMemo(() => {
    if (paymentType === 'cash') return grandTotal;
    if (paymentType === 'due') return 0;
    const val = parseFloat(paidAmount);
    return isNaN(val) ? 0 : Math.min(grandTotal, Math.max(0, val));
  }, [paymentType, grandTotal, paidAmount]);

  const dueAmount = Math.max(0, grandTotal - actualPaidAmount);

  // Add product to cart instantaneously without layout jump
  const handleAddToCart = (product: Product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total: (item.quantity + 1) * item.price,
              }
            : item
        );
      }
      return [
        ...prevCart,
        {
          product,
          quantity: 1,
          price: product.sellingPrice,
          total: product.sellingPrice,
        },
      ];
    });

    if (notifyTimerRef.current) {
      clearTimeout(notifyTimerRef.current);
    }
    setNotification(`✅ "${product.name}" কার্টে যোগ হয়েছে`);
    notifyTimerRef.current = setTimeout(() => setNotification(null), 1500);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0
              ? { ...item, quantity: newQty, total: newQty * item.price }
              : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeItem = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  // Finish checkout
  const handleCheckout = () => {
    if (cart.length === 0) return;
    setCheckoutError(null);

    let custId = selectedCustomerId;
    let custName = 'নগদ ক্রেতা';

    if (isAddingNewCustomer && newCustomerName.trim()) {
      const newCust = addCustomer(newCustomerName.trim(), newCustomerPhone.trim());
      custId = newCust.id;
      custName = newCust.name;
    } else if (selectedCustomerId) {
      const found = customers.find((c) => c.id === selectedCustomerId);
      if (found) {
        custName = found.name;
      }
    } else if (dueAmount > 0) {
      setCheckoutError('বাকি বিক্রির জন্য কাস্টমার নির্বাচন বা নতুন কাস্টমারের নাম লিখুন!');
      return;
    }

    const profit = calculateSaleProfit(cart);

    const sale = completeSale({
      customerId: custId || undefined,
      customerName: custName,
      items: cart,
      subtotal,
      discount,
      grandTotal,
      paidAmount: actualPaidAmount,
      dueAmount,
      profit,
    });

    setCart([]);
    setIsMobileCartOpen(false);
    onSaleComplete(sale);
  };

  // Quick 1-Tap Cash Sale directly from bottom bar
  const handleInstantCashCheckout = () => {
    if (cart.length === 0) return;
    const profit = calculateSaleProfit(cart);
    const sale = completeSale({
      customerId: selectedCustomerId || undefined,
      customerName: selectedCustomerId
        ? customers.find((c) => c.id === selectedCustomerId)?.name || 'নগদ ক্রেতা'
        : 'নগদ ক্রেতা',
      items: cart,
      subtotal,
      discount,
      grandTotal,
      paidAmount: grandTotal,
      dueAmount: 0,
      profit,
    });
    setCart([]);
    setIsMobileCartOpen(false);
    onSaleComplete(sale);
  };

  return (
    <div className="h-[calc(100dvh-7rem)] lg:h-auto flex flex-col pt-1.5 sm:pt-3 pb-1 lg:pb-20 overflow-hidden lg:overflow-visible">
      {/* Top Compact Header Row (Never shifts height when notification appears) */}
      <div className="flex items-center justify-between gap-2 mb-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onBack}
            className="p-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 transition active:scale-95 shrink-0"
            aria-label="ফিরে যান"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
          </button>
          <h2 className="text-base sm:text-xl font-bold text-gray-800 tracking-tight truncate">
            নতুন বিক্রি (POS)
          </h2>
          {notification && (
            <span className="hidden xs:inline-block bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-lg text-[11px] font-bold truncate max-w-[180px] sm:max-w-xs">
              {notification}
            </span>
          )}
        </div>

        {/* Mobile View Cart Toggle Button */}
        <div className="lg:hidden shrink-0">
          <button
            onClick={() => {
              setCheckoutError(null);
              setIsMobileCartOpen(true);
            }}
            className="relative flex items-center gap-1.5 bg-[#b83a14] text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs active:scale-95 transition"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>কার্ট ({toBengaliNumber(totalCartCount)})</span>
            {cart.length > 0 && (
              <span className="text-[11px] bg-white/25 px-1.5 py-0.2 rounded font-extrabold">
                {formatTaka(grandTotal)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Responsive Layout: Desktop 2-Column Split POS / Mobile Single-Screen Fit */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 overflow-hidden lg:overflow-visible">
        {/* LEFT COLUMN: Product Catalog & Category Filters */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col min-h-0 space-y-2">
          {/* Search bar + Camera Scan */}
          <div className="relative flex items-center gap-1.5 shrink-0">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="পণ্যের নাম, বারকোড বা ক্যাটাগরি খুঁজুন..."
                className="w-full bg-white border border-gray-300 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#b83a14] focus:border-transparent shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs bg-gray-100 rounded-full w-5 h-5 flex items-center justify-center"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              onClick={onOpenScanner}
              className="p-2 bg-white border border-gray-300 rounded-xl text-gray-600 hover:text-[#b83a14] hover:bg-gray-50 transition active:scale-95 shrink-0 shadow-2xs"
              title="বারকোড স্ক্যানার"
            >
              <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* 4 Section Category Filters: সব পণ্য, ১. মুদি, ২. স্টেশনারি, ৩. সার্ভিস */}
          <div className="grid grid-cols-4 gap-1.5 shrink-0">
            <button
              onClick={() => setSelectedCategory('সব')}
              className={`py-1.5 px-1 text-center rounded-xl text-[11px] sm:text-xs font-bold transition flex items-center justify-center gap-1 border ${
                selectedCategory === 'সব'
                  ? 'bg-[#b83a14] text-white border-[#b83a14] shadow-2xs'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <span>সব পণ্য</span>
            </button>

            <button
              onClick={() => setSelectedCategory('মুদি')}
              className={`py-1.5 px-1 text-center rounded-xl text-[11px] sm:text-xs font-bold transition flex items-center justify-center gap-1 border ${
                selectedCategory === 'মুদি'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-amber-50/50'
              }`}
            >
              <ShoppingBasket className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span className="truncate">১. মুদি</span>
            </button>

            <button
              onClick={() => setSelectedCategory('স্টেশনারি')}
              className={`py-1.5 px-1 text-center rounded-xl text-[11px] sm:text-xs font-bold transition flex items-center justify-center gap-1 border ${
                selectedCategory === 'স্টেশনারি'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-blue-50/50'
              }`}
            >
              <BookOpen className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span className="truncate">২. স্টেশনারি</span>
            </button>

            <button
              onClick={() => setSelectedCategory('কম্পিউটার সার্ভিস')}
              className={`py-1.5 px-1 text-center rounded-xl text-[11px] sm:text-xs font-bold transition flex items-center justify-center gap-1 border ${
                selectedCategory === 'কম্পিউটার সার্ভিস'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-purple-50/50'
              }`}
            >
              <Monitor className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span className="truncate">৩. সার্ভিস</span>
            </button>
          </div>

          {/* Product Grid - Fits Remaining Screen Space Cleanly */}
          <div className="flex-1 min-h-0 bg-white rounded-xl border border-gray-200 p-2 shadow-2xs overflow-y-auto lg:max-h-[68vh]">
            {catalogProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {catalogProducts.map((p) => {
                  const inCart = cart.find((item) => item.product.id === p.id);
                  const isLow = p.currentStock <= p.lowStockAlert && p.currentStock > 0;
                  const isOut = p.currentStock <= 0;

                  return (
                    <button
                      key={p.id}
                      onClick={() => handleAddToCart(p)}
                      className={`relative p-2 rounded-xl border text-left transition flex flex-col justify-between group active:scale-[0.97] select-none ${
                        inCart
                          ? 'border-[#b83a14] bg-orange-50/80 ring-1 ring-[#b83a14]/30'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      {inCart && (
                        <span className="absolute top-1.5 right-1.5 bg-[#b83a14] text-white text-[11px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center shadow-2xs">
                          {toBengaliNumber(inCart.quantity)}
                        </span>
                      )}

                      <div className="pr-5">
                        <span className="text-[10px] font-bold text-gray-400 block truncate">
                          {p.mainCategory || 'মুদি'}
                        </span>
                        <h4 className="font-bold text-gray-900 text-xs sm:text-sm line-clamp-1 leading-snug mt-0.5">
                          {p.name}
                        </h4>
                      </div>

                      <div className="mt-1.5 pt-1 border-t border-gray-100 flex items-center justify-between text-xs">
                        <span className="font-extrabold text-[#b83a14]">
                          {formatTaka(p.sellingPrice)}
                          <span className="text-[10px] font-normal text-gray-500">/{p.unit}</span>
                        </span>
                        <span
                          className={`text-[10px] font-semibold ${
                            isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-gray-400'
                          }`}
                        >
                          {toBengaliNumber(p.currentStock)} {p.unit}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500 text-xs sm:text-sm">
                কোনো পণ্য খুঁজে পাওয়া যায়নি।
              </div>
            )}
          </div>

          {/* MOBILE INLINE BOTTOM CHECKOUT BAR (Inside Flex Container - Never Cut Off or Delayed!) */}
          {cart.length > 0 && (
            <div className="lg:hidden shrink-0 bg-gradient-to-r from-gray-900 to-gray-800 text-white p-2.5 rounded-xl shadow-lg flex items-center justify-between gap-2 border border-gray-700">
              <div
                onClick={() => {
                  setCheckoutError(null);
                  setIsMobileCartOpen(true);
                }}
                className="min-w-0 cursor-pointer"
              >
                <div className="text-[10px] text-orange-300 font-bold flex items-center gap-1">
                  <span>🛒 কার্ট ({toBengaliNumber(totalCartCount)} টি পণ্য)</span>
                </div>
                <div className="text-base font-black text-white leading-tight">
                  {formatTaka(grandTotal)}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleInstantCashCheckout}
                  className="py-2 px-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-lg transition flex items-center gap-1 shadow-xs"
                  title="সরাসরি নগদ বিক্রি সম্পন্ন করুন"
                >
                  <Zap className="w-3.5 h-3.5 fill-white" />
                  <span>নগদ বিক্রি</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCheckoutError(null);
                    setIsMobileCartOpen(true);
                  }}
                  className="py-2 px-3 bg-[#b83a14] hover:bg-[#a33210] active:scale-95 text-white font-bold text-xs rounded-lg transition flex items-center gap-1 shadow-xs"
                >
                  <Receipt className="w-3.5 h-3.5 stroke-[2.2]" />
                  <span>হিসাব ও বিক্রি</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Sticky Cart & Checkout Panel (Desktop) */}
        <div className="hidden lg:block lg:col-span-5 xl:col-span-4">
          <CartCheckoutCard
            cart={cart}
            subtotal={subtotal}
            discount={discount}
            grandTotal={grandTotal}
            dueAmount={dueAmount}
            actualPaidAmount={actualPaidAmount}
            paymentType={paymentType}
            paidAmount={paidAmount}
            customers={customers}
            selectedCustomerId={selectedCustomerId}
            isAddingNewCustomer={isAddingNewCustomer}
            newCustomerName={newCustomerName}
            newCustomerPhone={newCustomerPhone}
            checkoutError={checkoutError}
            setDiscount={setDiscount}
            setPaymentType={setPaymentType}
            setPaidAmount={setPaidAmount}
            setSelectedCustomerId={setSelectedCustomerId}
            setIsAddingNewCustomer={setIsAddingNewCustomer}
            setNewCustomerName={setNewCustomerName}
            setNewCustomerPhone={setNewCustomerPhone}
            updateQuantity={updateQuantity}
            removeItem={removeItem}
            clearCart={() => setCart([])}
            onCheckout={handleCheckout}
          />
        </div>
      </div>

      {/* MOBILE SINGLE-SCREEN CART & CHECKOUT MODAL (z-[70] sits ABOVE Header & BottomNav, zero page scrolling!) */}
      {isMobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl max-h-[94dvh] flex flex-col overflow-hidden shadow-2xl">
            {/* Compact Single Header */}
            <div className="px-3.5 py-2.5 border-b border-gray-200 flex items-center justify-between bg-gray-50 shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-[#b83a14]" />
                <span className="font-bold text-gray-900 text-sm">
                  কার্ট ও চেকআউট ({toBengaliNumber(totalCartCount)} টি পণ্য)
                </span>
              </div>
              <div className="flex items-center gap-2">
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-xs text-red-600 hover:underline font-bold px-2 py-0.5 rounded bg-red-50"
                  >
                    সব মুছুন
                  </button>
                )}
                <button
                  onClick={() => setIsMobileCartOpen(false)}
                  className="p-1 text-gray-500 hover:text-gray-800 rounded-lg bg-gray-200/60"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Compact Single-Screen Body */}
            <div className="p-3 overflow-y-auto flex-1">
              <CartCheckoutCard
                cart={cart}
                subtotal={subtotal}
                discount={discount}
                grandTotal={grandTotal}
                dueAmount={dueAmount}
                actualPaidAmount={actualPaidAmount}
                paymentType={paymentType}
                paidAmount={paidAmount}
                customers={customers}
                selectedCustomerId={selectedCustomerId}
                isAddingNewCustomer={isAddingNewCustomer}
                newCustomerName={newCustomerName}
                newCustomerPhone={newCustomerPhone}
                checkoutError={checkoutError}
                setDiscount={setDiscount}
                setPaymentType={setPaymentType}
                setPaidAmount={setPaidAmount}
                setSelectedCustomerId={setSelectedCustomerId}
                setIsAddingNewCustomer={setIsAddingNewCustomer}
                setNewCustomerName={setNewCustomerName}
                setNewCustomerPhone={setNewCustomerPhone}
                updateQuantity={updateQuantity}
                removeItem={removeItem}
                clearCart={() => setCart([])}
                onCheckout={handleCheckout}
                hideTopHeader
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Subcomponent: Reusable Compact Cart and Checkout Box (Fits on 1 Mobile Screen)
interface CartCheckoutCardProps {
  cart: CartItem[];
  subtotal: number;
  discount: number;
  grandTotal: number;
  dueAmount: number;
  actualPaidAmount: number;
  paymentType: 'cash' | 'due' | 'partial';
  paidAmount: string;
  customers: any[];
  selectedCustomerId: string;
  isAddingNewCustomer: boolean;
  newCustomerName: string;
  newCustomerPhone: string;
  checkoutError?: string | null;
  hideTopHeader?: boolean;
  setDiscount: (val: number) => void;
  setPaymentType: (val: 'cash' | 'due' | 'partial') => void;
  setPaidAmount: (val: string) => void;
  setSelectedCustomerId: (val: string) => void;
  setIsAddingNewCustomer: (val: boolean) => void;
  setNewCustomerName: (val: string) => void;
  setNewCustomerPhone: (val: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  onCheckout: () => void;
}

const CartCheckoutCard: React.FC<CartCheckoutCardProps> = ({
  cart,
  subtotal,
  discount,
  grandTotal,
  dueAmount,
  paymentType,
  paidAmount,
  customers,
  selectedCustomerId,
  isAddingNewCustomer,
  newCustomerName,
  newCustomerPhone,
  checkoutError,
  hideTopHeader,
  setDiscount,
  setPaymentType,
  setPaidAmount,
  setSelectedCustomerId,
  setIsAddingNewCustomer,
  setNewCustomerName,
  setNewCustomerPhone,
  updateQuantity,
  removeItem,
  clearCart,
  onCheckout,
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
      {/* Desktop Header */}
      {!hideTopHeader && (
        <div className="px-3 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <span className="font-bold text-gray-800 text-xs sm:text-sm">
            অর্ডার কার্ট ({toBengaliNumber(cart.length)})
          </span>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-red-600 hover:underline font-semibold"
            >
              সব মুছুন
            </button>
          )}
        </div>
      )}

      {cart.length === 0 ? (
        <div className="p-6 text-center text-gray-400 text-xs sm:text-sm">
          কার্ট খালি। পণ্যে চাপ দিয়ে যোগ করুন।
        </div>
      ) : (
        <>
          {/* Compact Item List (Scrolls internally only if >3 items, keeping checkout buttons on screen) */}
          <div className="divide-y divide-gray-100 max-h-36 sm:max-h-48 overflow-y-auto">
            {cart.map((item) => (
              <div key={item.product.id} className="px-2.5 py-2 flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-800 text-xs truncate">
                    {item.product.name}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    {formatTaka(item.price)}/{item.product.unit}
                  </div>
                </div>

                {/* Quantity +/- Controls */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 border border-gray-200 shrink-0">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.product.id, -1)}
                    className="w-6 h-6 rounded bg-white text-gray-700 hover:bg-gray-200 flex items-center justify-center transition active:scale-90 text-xs"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center font-bold text-xs text-gray-800">
                    {toBengaliNumber(item.quantity)}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.product.id, 1)}
                    className="w-6 h-6 rounded bg-white text-gray-700 hover:bg-gray-200 flex items-center justify-center transition active:scale-90 text-xs"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <div className="text-right w-14 shrink-0 font-bold text-[#b83a14] text-xs">
                  {formatTaka(item.total)}
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(item.product.id)}
                  className="text-gray-400 hover:text-red-500 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Ultra-Compact Pricing Strip */}
          <div className="px-3 py-2 bg-orange-50/50 border-t border-gray-200 space-y-1.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-600">
                মোট: <strong className="text-gray-800">{formatTaka(subtotal)}</strong>
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-600 text-[11px]">ছাড় (৳):</span>
                <input
                  type="number"
                  min="0"
                  value={discount || ''}
                  onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                  placeholder="০"
                  className="w-16 bg-white border border-gray-300 rounded-lg px-2 py-0.5 text-right font-bold text-xs focus:ring-1 focus:ring-[#b83a14]"
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-sm font-extrabold text-gray-900 pt-1 border-t border-orange-200/70">
              <span>সর্বমোট বিল:</span>
              <span className="text-base text-[#b83a14]">{formatTaka(grandTotal)}</span>
            </div>
          </div>

          {/* Customer Selection & Payment Controls */}
          <div className="p-2.5 border-t border-gray-200 space-y-2.5">
            {checkoutError && (
              <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-[11px] font-bold text-red-600">
                {checkoutError}
              </div>
            )}

            {/* Customer Picker */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-gray-700 mb-1">
                <span>কাস্টমার নির্বাচন:</span>
                <button
                  type="button"
                  onClick={() => setIsAddingNewCustomer(!isAddingNewCustomer)}
                  className="text-[#b83a14] hover:underline font-bold"
                >
                  {isAddingNewCustomer ? 'তালিকায় দেখুন' : '+ নতুন কাস্টমার'}
                </button>
              </div>

              {isAddingNewCustomer ? (
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="text"
                    placeholder="কাস্টমারের নাম *"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-[#b83a14]"
                  />
                  <input
                    type="tel"
                    placeholder="মোবাইল (ঐচ্ছিক)"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-[#b83a14]"
                  />
                </div>
              ) : (
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:ring-1 focus:ring-[#b83a14]"
                >
                  <option value="">নগদ ক্রেতা (নামহীন)</option>
                  {[...customers]
                    .sort((a, b) => b.currentDue - a.currentDue || b.totalGiven - a.totalGiven || a.name.localeCompare(b.name))
                    .map((c, idx) => (
                      <option key={c.id} value={c.id}>
                        {toBengaliNumber(idx + 1)}. {c.name} {c.currentDue > 0 ? `(বাকি ${formatTaka(c.currentDue)})` : '(বাকি নেই)'}
                      </option>
                    ))}
                </select>
              )}
            </div>

            {/* Payment Method */}
            <div>
              <div className="text-[11px] font-bold text-gray-700 mb-1">পরিশোধের ধরন:</div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentType('cash');
                    setPaidAmount('');
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition text-center ${
                    paymentType === 'cash'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  নগদ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentType('due');
                    setPaidAmount('0');
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition text-center ${
                    paymentType === 'due'
                      ? 'bg-[#b83a14] text-white border-[#b83a14] shadow-2xs'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  বাকি
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentType('partial');
                    setPaidAmount('');
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition text-center ${
                    paymentType === 'partial'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  আংশিক
                </button>
              </div>
            </div>

            {/* Partial amount input */}
            {paymentType === 'partial' && (
              <div className="p-2 bg-amber-50/80 rounded-lg border border-amber-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-gray-700">জমা (৳):</span>
                  <input
                    type="number"
                    min="0"
                    max={grandTotal}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    placeholder="০"
                    className="w-20 bg-white border border-gray-300 rounded-lg px-2 py-1 text-xs font-bold"
                  />
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-500">বাকি থাকবে: </span>
                  <span className="font-extrabold text-[#b83a14] text-xs">{formatTaka(dueAmount)}</span>
                </div>
              </div>
            )}

            {/* Submit Button - Always in View! */}
            <button
              type="button"
              onClick={onCheckout}
              className="w-full py-2.5 bg-[#b83a14] hover:bg-[#a33210] active:scale-[0.99] text-white rounded-xl font-bold text-sm shadow-sm transition flex items-center justify-center gap-1.5"
            >
              <Receipt className="w-4 h-4 stroke-[2.2]" />
              <span>বিক্রি সম্পন্ন করুন ({formatTaka(grandTotal)})</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
