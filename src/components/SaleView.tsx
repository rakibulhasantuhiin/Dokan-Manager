import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Camera,
  Search,
  Plus,
  Minus,
  Trash2,
  Check,
  UserCheck,
  ShoppingBag,
  Receipt,
  ShoppingBasket,
  BookOpen,
  Monitor,
  ShoppingCart,
  X,
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
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

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

  // Add product to cart
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

    setNotification(`✅ "${product.name}" যোগ হয়েছে`);
    setTimeout(() => setNotification(null), 1800);
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
      alert('বাকি বিক্রির জন্য কাস্টমার নির্বাচন করা আবশ্যক!');
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

    onSaleComplete(sale);
  };

  return (
    <div className="pb-24 pt-2 sm:pt-4">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="p-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 transition active:scale-95"
            aria-label="ফিরে যান"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight">
            নতুন বিক্রি (POS)
          </h2>
        </div>

        {/* Mobile View Cart Toggle Button */}
        <div className="lg:hidden">
          <button
            onClick={() => setIsMobileCartOpen(true)}
            className="relative flex items-center gap-1.5 bg-[#b83a14] text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs active:scale-95 transition"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>কার্ট ({toBengaliNumber(totalCartCount)})</span>
            {cart.length > 0 && (
              <span className="text-[11px] bg-white/25 px-1 rounded-sm">
                {formatTaka(grandTotal)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div className="mb-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 animate-fade-in shadow-2xs">
          <span>{notification}</span>
        </div>
      )}

      {/* Main Responsive Layout: Desktop 2-Column Split POS / Mobile Single-Screen Streamlined */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: Product Catalog & Category Filters (7 cols on Desktop) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-3">
          {/* Search bar + Camera Scan */}
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="পণ্যের নাম, বারকোড বা ক্যাটাগরি খুঁজুন..."
                className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#b83a14] focus:border-transparent shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs bg-gray-100 rounded-full w-5 h-5 flex items-center justify-center"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              onClick={onOpenScanner}
              className="p-2.5 bg-white border border-gray-300 rounded-xl text-gray-600 hover:text-[#b83a14] hover:bg-gray-50 transition active:scale-95 shrink-0 shadow-xs"
              title="বারকোড স্ক্যানার"
            >
              <Camera className="w-5 h-5" />
            </button>
          </div>

          {/* 3 Prominent Section Category Filters: মুদি, স্টেশনারি, কম্পিউটার সার্ভিস */}
          <div className="grid grid-cols-4 gap-1.5">
            <button
              onClick={() => setSelectedCategory('সব')}
              className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 border ${
                selectedCategory === 'সব'
                  ? 'bg-[#b83a14] text-white border-[#b83a14] shadow-xs'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <span>সব পণ্য</span>
            </button>

            <button
              onClick={() => setSelectedCategory('মুদি')}
              className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 border ${
                selectedCategory === 'মুদি'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-amber-50/50'
              }`}
            >
              <ShoppingBasket className="w-3.5 h-3.5" />
              <span>১. মুদি</span>
            </button>

            <button
              onClick={() => setSelectedCategory('স্টেশনারি')}
              className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 border ${
                selectedCategory === 'স্টেশনারি'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-blue-50/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>২. স্টেশনারি</span>
            </button>

            <button
              onClick={() => setSelectedCategory('কম্পিউটার সার্ভিস')}
              className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 border ${
                selectedCategory === 'কম্পিউটার সার্ভিস'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-purple-50/50'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="truncate">৩. সার্ভিস</span>
            </button>
          </div>

          {/* Product Grid / List for Quick Tapping */}
          <div className="bg-white rounded-xl border border-gray-200 p-2.5 shadow-xs max-h-[58vh] lg:max-h-[72vh] overflow-y-auto">
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
                      className={`relative p-2.5 rounded-xl border text-left transition flex flex-col justify-between group active:scale-[0.98] ${
                        inCart
                          ? 'border-[#b83a14] bg-orange-50/70 shadow-xs'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/80 bg-white'
                      }`}
                    >
                      {inCart && (
                        <span className="absolute top-1.5 right-1.5 bg-[#b83a14] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                          {toBengaliNumber(inCart.quantity)}
                        </span>
                      )}

                      <div>
                        <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wide truncate">
                          {p.mainCategory || 'মুদি'}
                        </span>
                        <h4 className="font-semibold text-gray-900 text-xs sm:text-sm line-clamp-2 leading-tight mt-0.5">
                          {p.name}
                        </h4>
                      </div>

                      <div className="mt-2 pt-1 border-t border-gray-100 flex items-center justify-between text-xs">
                        <span className="font-extrabold text-[#b83a14]">
                          {formatTaka(p.sellingPrice)}
                          <span className="text-[10px] font-normal text-gray-500">/{p.unit}</span>
                        </span>
                        <span className={`text-[10px] font-semibold ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-gray-400'}`}>
                          {toBengaliNumber(p.currentStock)} {p.unit}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 text-sm">
                কোনো পণ্য খুঁজে পাওয়া যায়নি।
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Sticky Cart & Checkout Panel (5 cols on Desktop) */}
        <div className="hidden lg:block lg:col-span-5 xl:col-span-4 space-y-3">
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

      {/* MOBILE FLOATING BOTTOM BAR when items in cart */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-16 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-xl z-30">
          <div className="max-w-md mx-auto flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] text-gray-500 font-medium">
                কার্ট ({toBengaliNumber(totalCartCount)} টি পণ্য)
              </div>
              <div className="text-lg font-extrabold text-[#b83a14]">
                {formatTaka(grandTotal)}
              </div>
            </div>

            <button
              onClick={() => setIsMobileCartOpen(true)}
              className="flex-1 max-w-[200px] py-2.5 px-4 bg-[#b83a14] hover:bg-[#a33210] active:scale-95 text-white font-bold text-sm rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
            >
              <Receipt className="w-4 h-4 stroke-[2.2]" />
              <span>হিসাব ও বিক্রি</span>
            </button>
          </div>
        </div>
      )}

      {/* MOBILE CART & CHECKOUT MODAL DRAWER */}
      {isMobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-t-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-3.5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#b83a14]" />
                <span className="font-bold text-gray-800 text-base">
                  কার্ট ও চেকআউট ({toBengaliNumber(totalCartCount)})
                </span>
              </div>
              <button
                onClick={() => setIsMobileCartOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
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
                onCheckout={() => {
                  handleCheckout();
                  setIsMobileCartOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Subcomponent: Reusable Cart and Checkout Box
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
  actualPaidAmount,
  paymentType,
  paidAmount,
  customers,
  selectedCustomerId,
  isAddingNewCustomer,
  newCustomerName,
  newCustomerPhone,
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
    <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
      {/* Cart Items List */}
      <div className="p-3 bg-gray-50/90 border-b border-gray-200 flex items-center justify-between">
        <span className="font-bold text-gray-800 text-sm">
          অর্ডার কার্ট ({toBengaliNumber(cart.length)})
        </span>
        {cart.length > 0 && (
          <button
            onClick={clearCart}
            className="text-xs text-red-600 hover:underline font-medium"
          >
            সব মুছুন
          </button>
        )}
      </div>

      {cart.length === 0 ? (
        <div className="p-8 text-center text-gray-400 text-sm">
          কার্ট খালি। বামে পণ্যে চাপ দিয়ে যোগ করুন।
        </div>
      ) : (
        <>
          <div className="divide-y divide-gray-100 max-h-56 overflow-y-auto">
            {cart.map((item) => (
              <div key={item.product.id} className="p-2.5 flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-800 text-xs sm:text-sm truncate">
                    {item.product.name}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {formatTaka(item.price)}/{item.product.unit}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 border border-gray-200">
                  <button
                    onClick={() => updateQuantity(item.product.id, -1)}
                    className="w-6 h-6 rounded bg-white text-gray-700 hover:bg-gray-200 flex items-center justify-center transition active:scale-90 text-xs"
                    aria-label="কমান"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center font-bold text-xs text-gray-800">
                    {toBengaliNumber(item.quantity)}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.product.id, 1)}
                    className="w-6 h-6 rounded bg-white text-gray-700 hover:bg-gray-200 flex items-center justify-center transition active:scale-90 text-xs"
                    aria-label="বাড়ান"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <div className="text-right w-16 shrink-0 font-bold text-[#b83a14] text-xs sm:text-sm">
                  {formatTaka(item.total)}
                </div>

                <button
                  onClick={() => removeItem(item.product.id)}
                  className="text-gray-400 hover:text-red-500 p-1"
                  aria-label="মুছুন"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Pricing Summary */}
          <div className="p-3 bg-gray-50 border-t border-gray-200 space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between text-gray-600">
              <span>মোট মূল্য:</span>
              <span className="font-semibold text-gray-800">{formatTaka(subtotal)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600">ছাড় / ডিসকাউন্ট (৳):</span>
              <input
                type="number"
                min="0"
                value={discount || ''}
                onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                placeholder="০"
                className="w-20 bg-white border border-gray-300 rounded-lg px-2 py-0.5 text-right font-semibold text-xs focus:ring-1 focus:ring-[#b83a14]"
              />
            </div>

            <div className="flex justify-between text-sm sm:text-base font-bold text-gray-900 pt-1.5 border-t border-gray-200">
              <span>সর্বমোট বিল:</span>
              <span className="text-[#b83a14]">{formatTaka(grandTotal)}</span>
            </div>
          </div>

          {/* Customer Selection & Payment */}
          <div className="p-3 border-t border-gray-200 space-y-3">
            {/* Customer Picker */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-gray-600 mb-1">
                <span>কাস্টমার:</span>
                <button
                  onClick={() => setIsAddingNewCustomer(!isAddingNewCustomer)}
                  className="text-[#b83a14] hover:underline"
                >
                  {isAddingNewCustomer ? 'তালিকায় দেখুন' : '+ নতুন কাস্টমার'}
                </button>
              </div>

              {isAddingNewCustomer ? (
                <div className="space-y-1.5">
                  <input
                    type="text"
                    placeholder="কাস্টমারের নাম *"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-[#b83a14]"
                  />
                  <input
                    type="tel"
                    placeholder="মোবাইল নম্বর (ঐচ্ছিক)"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-[#b83a14]"
                  />
                </div>
              ) : (
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-[#b83a14]"
                >
                  <option value="">নগদ ক্রেতা (নামহীন)</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.currentDue > 0 ? `(বাকি ${formatTaka(c.currentDue)})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Payment Method */}
            <div>
              <div className="text-[11px] font-semibold text-gray-600 mb-1">পরিশোধের ধরন:</div>
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
              <div className="p-2.5 bg-amber-50/80 rounded-lg border border-amber-200 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-semibold text-gray-700 block">জমা পেলাম (৳):</span>
                  <input
                    type="number"
                    min="0"
                    max={grandTotal}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    placeholder="০"
                    className="w-24 bg-white border border-gray-300 rounded-lg px-2 py-1 text-xs font-bold"
                  />
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-500 block">বাকি থাকবে:</span>
                  <span className="font-extrabold text-[#b83a14] text-sm">{formatTaka(dueAmount)}</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={onCheckout}
              className="w-full py-3 bg-[#b83a14] hover:bg-[#a33210] active:scale-[0.99] text-white rounded-xl font-bold text-sm sm:text-base shadow-xs transition flex items-center justify-center gap-1.5"
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
