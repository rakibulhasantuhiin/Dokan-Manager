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

  const [isCompHistoryOpen, setIsCompHistoryOpen] = useState(true);
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
    <div className="pb-24 pt-2 sm:pt-4 space-y-3.5 sm:space-y-4">
      {/* 1. Onboarding Checklist ("শুরুর কাজ") - Compact & collapsible */}
      {!settings.hideOnboarding && (
        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-xs border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 font-bold text-gray-800 text-xs sm:text-sm">
              <span>🚀</span>
              <span>শুরুর কাজ</span>
            </div>
            <button
              onClick={toggleOnboarding}
              className="text-[11px] px-2 py-0.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 transition active:scale-95"
            >
              লুকান
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
            {/* Task 1: Add product */}
            <button
              onClick={onGoToProduct}
              className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition text-left"
            >
              {settings.onboarding.addProduct ? (
                <div className="w-4 h-4 rounded bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              ) : (
                <Square className="w-4 h-4 text-gray-400 shrink-0 stroke-[1.8]" />
              )}
              <span className={`text-xs ${settings.onboarding.addProduct ? 'line-through text-gray-400' : 'text-gray-700 font-medium'}`}>
                পণ্য যোগ করুন
              </span>
            </button>

            {/* Task 2: First sale */}
            <button
              onClick={onGoToSale}
              className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition text-left"
            >
              {settings.onboarding.firstSale ? (
                <div className="w-4 h-4 rounded bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              ) : (
                <Square className="w-4 h-4 text-gray-400 shrink-0 stroke-[1.8]" />
              )}
              <span className={`text-xs ${settings.onboarding.firstSale ? 'line-through text-gray-400' : 'text-gray-700 font-medium'}`}>
                প্রথম বিক্রি লিখুন
              </span>
            </button>

            {/* Task 3: Add customer */}
            <button
              onClick={onGoToCustomer}
              className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition text-left"
            >
              {settings.onboarding.addCustomer ? (
                <div className="w-4 h-4 rounded bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              ) : (
                <Square className="w-4 h-4 text-gray-400 shrink-0 stroke-[1.8]" />
              )}
              <span className="text-xs text-gray-700 font-medium">
                কাস্টমার যোগ করুন
              </span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Top Trio Financial Cards (মোট ব্যালেন্স, মোট বাকি, স্টকের মূল্য) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
        {/* Card 1: মোট ক্যাশ ব্যালেন্স (General Shop Balance) */}
        <div
          onClick={() => setIsBalanceAuditOpen(true)}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-800 text-white p-4 shadow-xs cursor-pointer hover:brightness-105 active:scale-[0.99] transition group"
        >
          <div className="flex items-center justify-between text-xs text-emerald-100 font-semibold mb-1">
            <span className="flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-emerald-200" />
              <span>দোকানের মোট ব্যালেন্স</span>
            </span>
            <span className="text-[10px] bg-white/20 group-hover:bg-white/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 transition">
              <span>🔍 বিবরণ ও এডিট</span>
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white my-1">
            {formatTaka(metrics.shopCashBalance)}
          </div>
          <div className="text-[11px] text-emerald-100/90 font-medium flex items-center justify-between">
            <span>(কম্পিউটার সার্ভিসের ক্যাশ আলাদা হিসাব)</span>
            <span className="text-[10px] underline font-semibold text-emerald-200">হিসাব দেখতে ক্লিক করুন</span>
          </div>
        </div>

        {/* Card 2: মোট বাকি (Total Customer Due) */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#b83a14] to-[#962e0e] text-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-orange-100 font-semibold mb-1">
            <span className="flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-orange-200" />
              <span>মোট বাকি</span>
            </span>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
              পাওনা
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white my-1">
            {formatTaka(metrics.totalDue)}
          </div>
          <div className="text-[11px] text-orange-100/90 font-medium">
            {toBengaliNumber(metrics.customersWithDueCount)} জন কাস্টমারের কাছে বাকি
          </div>
        </div>

        {/* Card 3: স্টকের মোট মূল্য (Total Stock Value) */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 to-blue-800 text-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-blue-100 font-semibold mb-1">
            <span className="flex items-center gap-1.5">
              <Package className="w-4 h-4 text-blue-200" />
              <span>স্টকের মোট মূল্য</span>
            </span>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
              পণ্য সম্পদ
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white my-1">
            {formatTaka(metrics.totalStockPurchaseValue)}
          </div>
          <div className="text-[11px] text-blue-100/90 font-medium">
            বিক্রি মূল্য: {formatTaka(metrics.totalStockSellingValue)}
          </div>
        </div>
      </div>

      {/* 3. Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={onGoToSale}
          className="w-full flex items-center justify-center gap-2 bg-[#b83a14] hover:bg-[#a33210] active:scale-[0.99] text-white py-3 px-4 rounded-xl font-bold text-sm sm:text-base shadow-xs transition"
        >
          <ShoppingCart className="w-5 h-5 stroke-[2.2]" />
          <span>নতুন বিক্রি</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onOpenQuickDue}
            className="flex items-center justify-center gap-1.5 bg-[#b83a14] hover:bg-[#a33210] active:scale-[0.99] text-white py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ বাকি দিলাম</span>
          </button>
          <button
            onClick={onOpenQuickPayment}
            className="flex items-center justify-center gap-1.5 bg-[#15803d] hover:bg-[#166534] active:scale-[0.99] text-white py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ টাকা পেলাম</span>
          </button>
        </div>
      </div>

      {/* 4. আজকের সার্বিক হিসাব (রাত ১২টা পর্যন্ত দৈনন্দিন হিসাব) */}
      <div className="bg-white rounded-2xl border border-gray-200 p-3.5 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-gray-100">
          <div className="flex items-center gap-1.5 font-bold text-gray-800 text-sm sm:text-base">
            <Clock className="w-4 h-4 text-[#b83a14]" />
            <span>আজকের হিসাব (রাত ১২টা পর্যন্ত)</span>
          </div>
          <span className="text-[11px] text-gray-500 font-semibold bg-gray-100 px-2.5 py-0.5 rounded-full">
            দৈনিক হিসাব
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Today's Sales */}
          <div className="p-3 rounded-xl bg-orange-50/70 border border-orange-100">
            <div className="text-xs text-gray-600 font-semibold">আজকের বিক্রি</div>
            <div className="text-lg sm:text-2xl font-bold text-[#b83a14] mt-1">
              {formatTaka(metrics.todaySalesAmount)}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              ({toBengaliNumber(metrics.todaySalesCount)} টি বিক্রি)
            </div>
          </div>

          {/* Today's Due Given */}
          <div className="p-3 rounded-xl bg-red-50/70 border border-red-100">
            <div className="text-xs text-gray-600 font-semibold">আজ বাকি দিয়েছি</div>
            <div className="text-lg sm:text-2xl font-bold text-red-600 mt-1">
              {formatTaka(metrics.todayDueGiven)}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">নতুন বকেয়া</div>
          </div>

          {/* Today's Cash Collection */}
          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
            <div className="text-xs text-gray-600 font-semibold">আজ নগদ আদায়</div>
            <div className="text-lg sm:text-2xl font-bold text-emerald-600 mt-1">
              {formatTaka(metrics.todayMoneyReceived)}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">নগদ বিক্রি + বাকি আদায়</div>
          </div>

          {/* Today's Profit */}
          <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100">
            <div className="text-xs text-gray-600 font-semibold">আজকের মোট লাভ</div>
            <div className="text-lg sm:text-2xl font-bold text-blue-700 mt-1">
              {formatTaka(metrics.todayProfit)}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">বিক্রির লাভ</div>
          </div>
        </div>
      </div>

      {/* 5. কম্পিউটার সার্ভিস আলাদা হিসাব ও ক্যাশ বক্স (User Requirement) */}
      <div className="bg-white rounded-2xl border-2 border-purple-200 p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
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
            className="flex items-center gap-1 text-xs text-purple-700 font-bold bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg transition"
          >
            <span>{isCompHistoryOpen ? 'সংক্ষিপ্ত করুন' : 'বিস্তারিত দেখুন'}</span>
            {isCompHistoryOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* 4 Computer Service Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Comp Balance */}
          <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
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
          <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200">
            <div className="text-xs text-purple-900 font-bold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
              <span>মোট সার্ভিস লাভ</span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 mt-1">
              {formatTaka(metrics.computerService.totalProfit)}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">সর্বমোট অর্জিত লাভ</div>
          </div>

          {/* Today's Service Sales */}
          <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200">
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
          <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200">
            <div className="text-xs text-purple-900 font-bold flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-purple-600" />
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
              className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100/70 border border-amber-200 transition text-center flex flex-col items-center justify-center"
            >
              <ShoppingBasket className="w-5 h-5 text-amber-700 mb-1" />
              <span className="text-xs font-bold text-amber-900">১. মুদি</span>
              <span className="text-[11px] text-amber-700">{toBengaliNumber(groceryCount)} টি পণ্য</span>
            </button>

            <button
              onClick={onGoToProduct}
              className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100/70 border border-blue-200 transition text-center flex flex-col items-center justify-center"
            >
              <BookOpen className="w-5 h-5 text-blue-700 mb-1" />
              <span className="text-xs font-bold text-blue-900">২. স্টেশনারি</span>
              <span className="text-[11px] text-blue-700">{toBengaliNumber(stationeryCount)} টি পণ্য</span>
            </button>

            <button
              onClick={onGoToProduct}
              className="p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100/70 border border-purple-200 transition text-center flex flex-col items-center justify-center"
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
              সবচেয়ে বেশি বাকি
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
              metrics.highestDueCustomers.slice(0, 5).map((cust) => (
                <button
                  key={cust.id}
                  onClick={() => onSelectCustomer(cust)}
                  className="w-full flex items-center justify-between p-2.5 sm:p-3 hover:bg-gray-50 transition text-left active:bg-gray-100"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0">
                      {cust.name.slice(0, 1)}
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
