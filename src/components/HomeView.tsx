import React, { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Check,
  Square,
  ShoppingBasket,
  BookOpen,
  Monitor,
  Wallet,
  Coins,
  Package,
  TrendingUp,
  Clock,
  ChevronDown,
  ChevronUp,
  Receipt,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import { useDokan } from '../context/DokanContext';
import { calculateDashboardMetrics } from '../utils/calculations';
import { formatTaka, toBengaliNumber, formatBengaliDateTime } from '../utils/bengali';
import { Customer } from '../types';
import { CashBalanceAuditModal } from './CashBalanceAuditModal';

interface HomeViewProps {
  onGoToSale: () => void;
  onGoToProduct: () => void;
  onGoToCustomer: () => void;
  onSelectCustomer: (customer: Customer) => void;
  onOpenQuickDue: () => void;
  onOpenQuickPayment: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onGoToSale,
  onGoToProduct,
  onGoToCustomer,
  onSelectCustomer,
  onOpenQuickDue,
  onOpenQuickPayment,
}) => {
  const { settings, updateSettings, customers, transactions, sales, products, cashEntries } = useDokan();

  const [isCompHistoryOpen, setIsCompHistoryOpen] = useState(false);
  const [isBalanceAuditOpen, setIsBalanceAuditOpen] = useState(false);

  // Aggregated financials (with strict midnight-to-midnight boundary)
  const metrics = calculateDashboardMetrics(customers, transactions, sales, products, cashEntries);

  const toggleOnboarding = () => {
    updateSettings({ hideOnboarding: !settings.hideOnboarding });
  };

  // Counts of products in 3 sections
  const groceryCount = products.filter((p) => (p.mainCategory || 'মুদি') === 'মুদি').length;
  const stationeryCount = products.filter((p) => p.mainCategory === 'স্টেশনারি').length;
  const computerCount = products.filter((p) => p.mainCategory === 'কম্পিউটার সার্ভিস').length;

  return (
    <div className="pb-20 pt-1.5 sm:pt-3 space-y-2.5 sm:space-y-3.5">
      {/* 1. Onboarding Checklist ("শুরুর কাজ") - Compact 3-col horizontal bar */}
      {!settings.hideOnboarding && (
        <div className="bg-white rounded-xl p-2.5 shadow-2xs border border-gray-200">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1 font-bold text-gray-800 text-xs">
              <span>🚀</span>
              <span>শুরুর কাজ</span>
            </div>
            <button
              onClick={toggleOnboarding}
              className="text-[10px] px-2 py-0.5 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
            >
              লুকান
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={onGoToProduct}
              className="flex items-center gap-1.5 p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition text-left"
            >
              {settings.onboarding.addProduct ? (
                <div className="w-3.5 h-3.5 rounded bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              ) : (
                <Square className="w-3.5 h-3.5 text-gray-400 shrink-0 stroke-[1.8]" />
              )}
              <span className={`text-[11px] truncate ${settings.onboarding.addProduct ? 'line-through text-gray-400' : 'text-gray-700 font-semibold'}`}>
                পণ্য যোগ
              </span>
            </button>

            <button
              onClick={onGoToSale}
              className="flex items-center gap-1.5 p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition text-left"
            >
              {settings.onboarding.firstSale ? (
                <div className="w-3.5 h-3.5 rounded bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              ) : (
                <Square className="w-3.5 h-3.5 text-gray-400 shrink-0 stroke-[1.8]" />
              )}
              <span className={`text-[11px] truncate ${settings.onboarding.firstSale ? 'line-through text-gray-400' : 'text-gray-700 font-semibold'}`}>
                প্রথম বিক্রি
              </span>
            </button>

            <button
              onClick={onGoToCustomer}
              className="flex items-center gap-1.5 p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition text-left"
            >
              {settings.onboarding.addCustomer ? (
                <div className="w-3.5 h-3.5 rounded bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              ) : (
                <Square className="w-3.5 h-3.5 text-gray-400 shrink-0 stroke-[1.8]" />
              )}
              <span className="text-[11px] text-gray-700 font-semibold truncate">
                কাস্টমার যোগ
              </span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Top Trio Financial Cards (মোট ব্যালেন্স full width on mobile, মোট বাকি + স্টকের মূল্য 2-col side-by-side) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        {/* Card 1: মোট ক্যাশ ব্যালেন্স (General Shop Balance) */}
        <div
          onClick={() => setIsBalanceAuditOpen(true)}
          className="col-span-2 sm:col-span-1 relative overflow-hidden rounded-xl animate-gradient-emerald shimmer-card text-white p-3 sm:p-4 shadow-xs cursor-pointer hover:brightness-105 active:scale-[0.98] transition-all duration-100 group"
        >
          <div className="flex items-center justify-between text-xs text-emerald-100 font-semibold">
            <span className="flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-emerald-200" />
              <span>দোকানের মোট ব্যালেন্স</span>
            </span>
            <span className="text-[10px] bg-white/20 group-hover:bg-white/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 transition">
              <span>🔍 বিবরণ ও এডিট</span>
            </span>
          </div>
          <div className="text-xl sm:text-3xl font-extrabold tracking-tight text-white my-0.5">
            {formatTaka(metrics.shopCashBalance)}
          </div>
          <div className="text-[10px] text-emerald-100/90 font-medium flex items-center justify-between">
            <span>(কম্পিউটার ক্যাশ আলাদা)</span>
            <span className="underline font-semibold text-emerald-200">হিসাব দেখুন →</span>
          </div>
        </div>

        {/* Card 2: মোট বাকি (Total Customer Due) */}
        <div
          onClick={onGoToCustomer}
          className="relative overflow-hidden rounded-xl animate-gradient-terracotta shimmer-card text-white p-2.5 sm:p-4 shadow-xs cursor-pointer hover:brightness-105 active:scale-[0.98] transition-all duration-100"
        >
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-orange-100 font-semibold">
            <span className="flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-orange-200" />
              <span>মোট বাকি</span>
            </span>
            <span className="text-[9px] bg-white/20 px-1.5 py-0.2 rounded-full font-bold">
              পাওনা
            </span>
          </div>
          <div className="text-lg sm:text-3xl font-extrabold tracking-tight text-white my-0.5 truncate">
            {formatTaka(metrics.totalDue)}
          </div>
          <div className="text-[10px] text-orange-100/90 font-medium truncate">
            {toBengaliNumber(metrics.customersWithDueCount)} জন বাকিদার
          </div>
        </div>

        {/* Card 3: স্টকের মোট মূল্য (Total Stock Value) */}
        <div
          onClick={onGoToProduct}
          className="relative overflow-hidden rounded-xl animate-gradient-blue shimmer-card text-white p-2.5 sm:p-4 shadow-xs cursor-pointer hover:brightness-105 active:scale-[0.98] transition-all duration-100"
        >
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-blue-100 font-semibold">
            <span className="flex items-center gap-1">
              <Package className="w-3.5 h-3.5 text-blue-200" />
              <span>স্টকের মূল্য</span>
            </span>
            <span className="text-[9px] bg-white/20 px-1.5 py-0.2 rounded-full font-bold">
              স্টক
            </span>
          </div>
          <div className="text-lg sm:text-3xl font-extrabold tracking-tight text-white my-0.5 truncate">
            {formatTaka(metrics.totalStockPurchaseValue)}
          </div>
          <div className="text-[10px] text-blue-100/90 font-medium truncate">
            বিক্রি: {formatTaka(metrics.totalStockSellingValue)}
          </div>
        </div>
      </div>

      {/* 3. Action Buttons - Single Compact Row (3 columns) */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        <button
          onClick={onGoToSale}
          className="flex items-center justify-center gap-1 animate-gradient-terracotta hover:brightness-105 active:scale-95 text-white py-2.5 px-2 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-all duration-100 cursor-pointer"
        >
          <ShoppingCart className="w-4 h-4 stroke-[2.3] shrink-0" />
          <span className="truncate">নতুন বিক্রি</span>
        </button>

        <button
          onClick={onOpenQuickDue}
          className="flex items-center justify-center gap-1 animate-gradient-terracotta hover:brightness-105 active:scale-95 text-white py-2.5 px-2 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-all duration-100 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
          <span className="truncate">বাকি দিলাম</span>
        </button>

        <button
          onClick={onOpenQuickPayment}
          className="flex items-center justify-center gap-1 animate-gradient-emerald hover:brightness-105 active:scale-95 text-white py-2.5 px-2 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-all duration-100 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
          <span className="truncate">টাকা পেলাম</span>
        </button>
      </div>

      {/* 4. আজকের সার্বিক হিসাব (রাত ১২টা পর্যন্ত দৈনন্দিন হিসাব) */}
      <div className="bg-white rounded-xl border border-gray-200 p-2.5 sm:p-3.5 shadow-2xs">
        <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-gray-100">
          <div className="flex items-center gap-1.5 font-bold text-gray-800 text-xs sm:text-sm">
            <Clock className="w-3.5 h-3.5 text-[#b83a14]" />
            <span>আজকের হিসাব (রাত ১২টা পর্যন্ত)</span>
          </div>
          <span className="text-[10px] text-gray-500 font-semibold bg-gray-100 px-2 py-0.5 rounded-full">
            দৈনিক হিসাব
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Today's Sales */}
          <div className="p-2 sm:p-2.5 rounded-xl animate-soft-amber border border-orange-200/70">
            <div className="text-[11px] text-gray-600 font-semibold flex items-center justify-between">
              <span>আজকের বিক্রি</span>
              <span className="text-[10px] text-gray-400">({toBengaliNumber(metrics.todaySalesCount)}টি)</span>
            </div>
            <div className="text-base sm:text-xl font-bold text-[#b83a14] mt-0.5">
              {formatTaka(metrics.todaySalesAmount)}
            </div>
          </div>

          {/* Today's Due Given */}
          <div className="p-2 sm:p-2.5 rounded-xl animate-soft-red border border-red-200/70">
            <div className="text-[11px] text-gray-600 font-semibold">আজ বাকি দিয়েছি</div>
            <div className="text-base sm:text-xl font-bold text-red-600 mt-0.5">
              {formatTaka(metrics.todayDueGiven)}
            </div>
          </div>

          {/* Today's Cash Collection */}
          <div className="p-2 sm:p-2.5 rounded-xl animate-soft-emerald border border-emerald-200/70">
            <div className="text-[11px] text-gray-600 font-semibold">আজ নগদ আদায়</div>
            <div className="text-base sm:text-xl font-bold text-emerald-600 mt-0.5">
              {formatTaka(metrics.todayMoneyReceived)}
            </div>
          </div>

          {/* Today's Profit */}
          <div className="p-2 sm:p-2.5 rounded-xl animate-soft-blue border border-blue-200/70">
            <div className="text-[11px] text-gray-600 font-semibold">আজকের মোট লাভ</div>
            <div className="text-base sm:text-xl font-bold text-blue-700 mt-0.5">
              {formatTaka(metrics.todayProfit)}
            </div>
          </div>
        </div>
      </div>

      {/* 5. কম্পিউটার সার্ভিস আলাদা হিসাব ও ক্যাশ বক্স (User Requirement) */}
      <div className="bg-white rounded-2xl border-2 border-purple-200 p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl animate-gradient-purple text-white flex items-center justify-center font-bold shadow-2xs">
              <Monitor className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-tight">
                কম্পিউটার সার্ভিস হিসাব (আলাদা ক্যাশ ও আয়)
              </h3>
              <p className="text-[11px] text-purple-700 font-medium">
                দোকানের সাধারণ ক্যাশের সাথে মিশ্রিত নয়, সম্পূর্ণ আলাদা হিসাব
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCompHistoryOpen(!isCompHistoryOpen)}
            className="flex items-center gap-1 text-xs text-purple-700 font-bold bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg transition active:scale-95"
          >
            <span>{isCompHistoryOpen ? 'সংক্ষিপ্ত করুন' : 'বিস্তারিত দেখুন'}</span>
            {isCompHistoryOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* 4 Computer Service Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Comp Balance */}
          <div className="p-3 rounded-xl animate-soft-purple border border-purple-200">
            <div className="text-xs text-purple-900 font-bold flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5 text-purple-600" />
              <span>কম্পিউটার ব্যালেন্স</span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-purple-700 mt-1">
              {formatTaka(metrics.computerService.balance)}
            </div>
            <div className="text-[10px] text-purple-600 mt-0.5">আলাদা জমা ক্যাশ</div>
          </div>

          {/* Comp Total Profit */}
          <div className="p-3 rounded-xl animate-soft-emerald border border-emerald-200/80">
            <div className="text-xs text-purple-900 font-bold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>মোট সার্ভিস লাভ</span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 mt-1">
              {formatTaka(metrics.computerService.totalProfit)}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">সর্বমোট অর্জিত লাভ</div>
          </div>

          {/* Today's Service Sales */}
          <div className="p-3 rounded-xl animate-soft-purple border border-purple-200">
            <div className="text-xs text-purple-900 font-bold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-purple-600" />
              <span>আজকের সার্ভিস বিক্রি</span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-purple-700 mt-1">
              {formatTaka(metrics.computerService.todaySales)}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">আজ রাত ১২টা পর্যন্ত</div>
          </div>

          {/* Today's Service Profit */}
          <div className="p-3 rounded-xl animate-soft-emerald border border-emerald-200/80">
            <div className="text-xs text-purple-900 font-bold flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-emerald-600" />
              <span>আজকের সার্ভিস লাভ</span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 mt-1">
              {formatTaka(metrics.computerService.todayProfit)}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">আজকের অর্জিত লাভ</div>
          </div>
        </div>

        {/* Detailed Timeline of Computer Service Sales */}
        {isCompHistoryOpen && (
          <div className="pt-2 border-t border-purple-100">
            <div className="text-xs font-bold text-gray-800 mb-2 flex items-center justify-between">
              <span>কখন কত বিক্রি হয়েছে (কম্পিউটার সার্ভিসের বিস্তারিত ইতিহাস):</span>
              <span className="text-[11px] text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full font-semibold">
                {toBengaliNumber(metrics.computerService.salesList.length)} টি কাজ
              </span>
            </div>

            {metrics.computerService.salesList.length > 0 ? (
              <div className="divide-y divide-gray-100 max-h-56 overflow-y-auto rounded-xl border border-gray-100">
                {metrics.computerService.salesList.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 sm:p-3 flex items-center justify-between gap-2 hover:bg-purple-50/40 transition text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-gray-900 flex items-center gap-1.5 truncate">
                        <span>{log.serviceName}</span>
                        <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded font-semibold">
                          #{log.memoNo}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5 flex flex-wrap items-center gap-2">
                        <span className="text-purple-700 font-semibold">{formatBengaliDateTime(log.date)}</span>
                        <span>•</span>
                        <span>ক্রেতা: <strong>{log.customerName}</strong></span>
                        <span>•</span>
                        <span>পরিমাণ: {toBengaliNumber(log.quantity)} {log.unit} (দর {formatTaka(log.price)})</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-extrabold text-purple-900 text-sm">
                        {formatTaka(log.total)}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                        লাভ: +{formatTaka(log.profit)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-purple-50/50 rounded-xl text-center text-xs text-gray-500">
                এখনও কোনো কম্পিউটার সার্ভিসের বিক্রি লিপিবদ্ধ হয়নি। পিওএস (POS) থেকে ফটোকপি, প্রিন্টিং বা সার্ভিস বিক্রি করলে এখানে আলাদাভাবে স্বয়ংক্রিয়ভাবে হিসাব যুক্ত হবে।
              </div>
            )}
          </div>
        )}
      </div>

      {/* 6. Responsive Two-Column Details (3 Categories + Top Due Customers) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* LEFT: 3 Product Sections Quick Cards */}
        <div className="lg:col-span-5 bg-[#ffffff] rounded-xl border border-gray-200 p-3.5 shadow-2xs">
          <div className="text-xs font-bold text-gray-700 mb-2.5 flex items-center justify-between">
            <span>৩টি পণ্য ও সেবা সেকশন:</span>
            <button onClick={onGoToProduct} className="text-[#b83a14] hover:underline font-semibold text-[11px]">
              সব পণ্য দেখুন →
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={onGoToProduct}
              className="p-2.5 rounded-xl animate-soft-amber border border-amber-200 hover:brightness-98 active:scale-95 transition-all duration-100 text-center flex flex-col items-center justify-center cursor-pointer"
            >
              <ShoppingBasket className="w-5 h-5 text-amber-700 mb-1" />
              <span className="text-xs font-bold text-amber-900">১. মুদি</span>
              <span className="text-[11px] text-amber-700">{toBengaliNumber(groceryCount)} টি পণ্য</span>
            </button>

            <button
              onClick={onGoToProduct}
              className="p-2.5 rounded-xl animate-soft-blue border border-blue-200 hover:brightness-98 active:scale-95 transition-all duration-100 text-center flex flex-col items-center justify-center cursor-pointer"
            >
              <BookOpen className="w-5 h-5 text-blue-700 mb-1" />
              <span className="text-xs font-bold text-blue-900">২. স্টেশনারি</span>
              <span className="text-[11px] text-blue-700">{toBengaliNumber(stationeryCount)} টি পণ্য</span>
            </button>

            <button
              onClick={onGoToProduct}
              className="p-2.5 rounded-xl animate-soft-purple border border-purple-200 hover:brightness-98 active:scale-95 transition-all duration-100 text-center flex flex-col items-center justify-center cursor-pointer"
            >
              <Monitor className="w-5 h-5 text-purple-700 mb-1" />
              <span className="text-xs font-bold text-purple-900 leading-tight">৩. সার্ভিস</span>
              <span className="text-[11px] text-purple-700">{toBengaliNumber(computerCount)} টি সেবা</span>
            </button>
          </div>
        </div>

        {/* RIGHT: সবচেয়ে বেশি বাকি তালিকা */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-3 sm:p-3.5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-800 text-xs sm:text-sm">
              বাকি লিস্ট (বেশি থেকে কম সিরিয়াল)
            </h3>
            <button
              onClick={onGoToCustomer}
              className="text-xs font-semibold text-[#b83a14] hover:underline"
            >
              সব কাস্টমার ({toBengaliNumber(customers.length)})
            </button>
          </div>

          <div className="divide-y divide-gray-100 max-h-52 overflow-y-auto">
            {metrics.highestDueCustomers.length > 0 ? (
              metrics.highestDueCustomers.map((cust, index) => (
                <button
                  key={cust.id}
                  onClick={() => onSelectCustomer(cust)}
                  className="w-full flex items-center justify-between p-2.5 sm:p-3 hover:bg-gray-50 transition text-left active:bg-gray-100"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-extrabold text-xs shrink-0 border ${
                        index === 0
                          ? 'bg-[#b83a14] text-white border-[#b83a14]'
                          : 'bg-amber-100 text-amber-800 border-amber-200'
                      }`}
                    >
                      {toBengaliNumber(index + 1)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-800 text-xs sm:text-sm truncate">
                        {cust.name}
                      </div>
                      {cust.phone && (
                        <div className="text-[11px] text-gray-400">
                          {toBengaliNumber(cust.phone)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-bold text-[#b83a14] text-sm sm:text-base">
                      {formatTaka(cust.currentDue)}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-6 text-center text-gray-400 text-xs">
                বর্তমানে কারও কাছে বাকি নেই।
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cash Balance Detail & Audit Modal */}
      <CashBalanceAuditModal
        isOpen={isBalanceAuditOpen}
        onClose={() => setIsBalanceAuditOpen(false)}
      />
    </div>
  );
};
