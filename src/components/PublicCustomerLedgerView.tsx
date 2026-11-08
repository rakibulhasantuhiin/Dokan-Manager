import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import {
  Store,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Printer,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  Receipt,
  RotateCw,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { decodeLedgerToken, PublicLedgerData, calculateLedgerBalances } from '../utils/customerShare';
import { Customer, Transaction, ShopSettings } from '../types';
import { formatTaka, toBengaliNumber, formatBengaliDateTime, formatBengaliDate } from '../utils/bengali';

interface PublicCustomerLedgerViewProps {
  token: string;
}

export const PublicCustomerLedgerView: React.FC<PublicCustomerLedgerViewProps> = ({ token }) => {
  const initialLedgerData: PublicLedgerData | null = useMemo(() => {
    return decodeLedgerToken(token);
  }, [token]);

  const [liveLedgerData, setLiveLedgerData] = useState<PublicLedgerData | null>(initialLedgerData);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setLiveLedgerData(initialLedgerData);
  }, [initialLedgerData]);

  const updateLedgerFromMasterDoc = useCallback(
    (data: any, userId: string, targetCustomerId: string) => {
      const remoteSettings: ShopSettings = data.settings || {};
      const remoteCustomers: Customer[] = data.customers || [];
      const remoteTransactions: Transaction[] = data.transactions || [];

      const matchingCustomer = remoteCustomers.find((c) => c.id === targetCustomerId);
      if (matchingCustomer) {
        const customerTxs = remoteTransactions.filter((tx) => tx.customerId === targetCustomerId);
        const ledgerTxs = calculateLedgerBalances(customerTxs);

        setLiveLedgerData({
          userId,
          shop: {
            name: remoteSettings.shopName || initialLedgerData?.shop.name || 'আমাদের দোকান',
            phone: remoteSettings.phone || initialLedgerData?.shop.phone,
            address: remoteSettings.address || initialLedgerData?.shop.address,
          },
          customer: {
            id: matchingCustomer.id,
            name: matchingCustomer.name,
            phone: matchingCustomer.phone,
            address: matchingCustomer.address,
            currentDue: matchingCustomer.currentDue,
            totalGiven: matchingCustomer.totalGiven,
            totalReceived: matchingCustomer.totalReceived,
          },
          transactions: ledgerTxs,
          generatedAt: data.updatedAt || new Date().toISOString(),
          token: initialLedgerData?.token || `c_${targetCustomerId}`,
        });
        setIsLiveConnected(true);
      }
    },
    [initialLedgerData]
  );

  // Instant getDoc fetch + Real-time Firestore Live Subscription
  useEffect(() => {
    if (!initialLedgerData || !initialLedgerData.userId) return;

    const userId = initialLedgerData.userId;
    const targetCustomerId = initialLedgerData.customer.id;
    const masterDocRef = doc(db, 'users', userId, 'shop', 'master');

    // 1. Immediate fetch on mount/refresh
    getDoc(masterDocRef)
      .then((docSnap) => {
        if (docSnap.exists()) {
          updateLedgerFromMasterDoc(docSnap.data(), userId, targetCustomerId);
        }
      })
      .catch((err) => {
        console.warn('Direct master fetch error:', err);
      });

    // 2. Realtime listener for push updates
    const unsubscribe = onSnapshot(
      masterDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          updateLedgerFromMasterDoc(docSnap.data(), userId, targetCustomerId);
        }
      },
      (err) => {
        console.warn('Live public customer ledger snapshot error:', err);
      }
    );

    return () => unsubscribe();
  }, [initialLedgerData, updateLedgerFromMasterDoc]);

  // Manual trigger to re-fetch live data on demand
  const handleManualRefresh = async () => {
    if (!initialLedgerData || !initialLedgerData.userId) return;
    setIsRefreshing(true);
    try {
      const userId = initialLedgerData.userId;
      const targetCustomerId = initialLedgerData.customer.id;
      const masterDocRef = doc(db, 'users', userId, 'shop', 'master');
      const docSnap = await getDoc(masterDocRef);
      if (docSnap.exists()) {
        updateLedgerFromMasterDoc(docSnap.data(), userId, targetCustomerId);
      }
    } catch (err) {
      console.warn('Manual refresh fetch error:', err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  const activeData = liveLedgerData || initialLedgerData;

  if (!activeData) {
    return (
      <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center p-4 font-['SolaimanLipi',sans-serif]">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center shadow-lg border border-gray-200 space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">লিঙ্কটি সঠিক নয়</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            বাকি খাতার এই লিঙ্কটি অসম্পূর্ণ বা মেয়াদোত্তীর্ণ হতে পারে। অনুগ্রহ করে দোকানদারের কাছ থেকে নতুন লিঙ্ক বা QR কোড সংগ্রহ করুন।
          </p>
          <a
            href="/"
            className="inline-block px-5 py-2.5 bg-[#b83a14] text-white font-bold text-sm rounded-xl hover:bg-[#a33210] transition"
          >
            প্রধান পেজে যান
          </a>
        </div>
      </div>
    );
  }

  const { shop, customer, transactions, generatedAt } = activeData;
  const isZeroDue = customer.currentDue <= 0;

  // Chronologically reversed for customer view (newest on top)
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="min-h-screen bg-[#f8f7f4] text-gray-900 font-['SolaimanLipi',sans-serif] pb-16">
      {/* Top Brand Header */}
      <header className="bg-[#b83a14] text-white shadow-md sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white font-bold text-xl">
              🏪
            </div>
            <div>
              <h1 className="font-extrabold text-lg sm:text-xl tracking-tight leading-tight">
                {shop.name || 'দোকান ম্যানেজার'}
              </h1>
              <div className="flex items-center gap-2 text-[11px] text-white/90">
                <span className="inline-flex items-center gap-1 bg-white/20 px-1.5 py-0.5 rounded font-medium">
                  <ShieldCheck className="w-3 h-3 text-emerald-200" />
                  যাচাইকৃত ডিজিটাল খাতা
                </span>
                {shop.address && <span>• {shop.address}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleManualRefresh}
              title="লেটেস্ট হিসাব লোড করুন"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 active:scale-95 transition text-white text-xs font-bold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>রিফ্রেশ</span>
            </button>
            <button
              onClick={() => window.print()}
              title="রশিদ প্রিন্ট করুন"
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 transition text-white"
            >
              <Printer className="w-4 h-4" />
            </button>
            <a
              href="/"
              title="অ্যাডমিন অ্যাপে প্রবেশ করুন"
              className="text-xs bg-white text-[#b83a14] font-bold px-2.5 py-1.5 rounded-lg shadow-2xs hover:bg-orange-50 transition active:scale-95 hidden sm:inline-block"
            >
              দোকান অ্যাপ
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-2xl mx-auto px-4 pt-4 sm:pt-6 space-y-4">
        {/* Customer Welcome & Identification */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              সম্মানিত গ্রাহক
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 mt-0.5">
              {customer.name}
            </h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-600">
              {customer.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  {customer.phone}
                </span>
              )}
              {customer.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  {customer.address}
                </span>
              )}
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-[11px] text-gray-400 font-medium">সর্বশেষ আপডেট:</div>
            <div className="text-xs font-bold text-gray-700">
              {formatBengaliDate(new Date(generatedAt))}
            </div>
            <button
              onClick={handleManualRefresh}
              className="inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 px-2 py-0.5 rounded-full font-bold mt-1 shadow-2xs transition active:scale-95"
            >
              <RefreshCw className={`w-3 h-3 text-emerald-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>লাইভ সিঙ্কড (রিফ্রেশ করুন)</span>
            </button>
          </div>
        </div>

        {/* Hero Outstanding Due Card */}
        <div
          className={`relative overflow-hidden rounded-2xl text-white p-5 sm:p-6 shadow-md transition-all ${
            isZeroDue
              ? 'bg-gradient-to-br from-emerald-600 to-emerald-700'
              : 'bg-gradient-to-br from-[#b83a14] to-[#992f0f]'
          }`}
        >
          {/* Subtle watermark circles */}
          <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute right-10 bottom-2 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center justify-between text-xs sm:text-sm text-white/90 font-semibold mb-1">
              <span>{isZeroDue ? 'বকেয়া স্ট্যাটাস' : 'বর্তমান সর্বমোট বকেয়া'}</span>
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-[11px] font-bold">
                {isZeroDue ? 'পরিশোধিত' : 'পরিশোধযোগ্য'}
              </span>
            </div>

            <div className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white my-2">
              {formatTaka(customer.currentDue)}
            </div>

            <div className="text-xs sm:text-sm text-white/90 font-medium pt-2 border-t border-white/20">
              {isZeroDue ? (
                <span>🎉 আপনার কোনো বকেয়া নেই। দোকানে কেনাকাটার জন্য আন্তরিক ধন্যবাদ!</span>
              ) : (
                <span>
                  সম্মানিত গ্রাহক, দোকানে আপনার এই পরিমাণ টাকা বকেয়া রয়েছে। সুবিধাজনক সময়ে তা পরিশোধের জন্য অনুরোধ করা হলো।
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Financial Summary Trio */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs text-center">
            <div className="text-[11px] text-gray-500 font-medium">মোট বাকি নিয়েছিলেন</div>
            <div className="text-base sm:text-lg font-black text-[#b83a14] mt-0.5">
              {formatTaka(customer.totalGiven)}
            </div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs text-center">
            <div className="text-[11px] text-gray-500 font-medium">মোট টাকা পরিশোধ</div>
            <div className="text-base sm:text-lg font-black text-emerald-700 mt-0.5">
              {formatTaka(customer.totalReceived)}
            </div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs text-center">
            <div className="text-[11px] text-gray-500 font-medium">বর্তমান অবশিষ্ট বাকি</div>
            <div className="text-base sm:text-lg font-black text-gray-900 mt-0.5">
              {formatTaka(customer.currentDue)}
            </div>
          </div>
        </div>

        {/* Quick Action Contact Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {shop.phone && (
            <a
              href={`tel:${shop.phone}`}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white py-3 px-4 rounded-xl font-bold text-sm shadow-xs transition"
            >
              <Phone className="w-4 h-4" />
              <span>দোকানদারকে সরাসরি কল করুন</span>
            </a>
          )}
          {shop.phone && (
            <a
              href={`https://wa.me/${shop.phone.replace(/[^0-9]/g, '').startsWith('0') ? '88' + shop.phone.replace(/[^0-9]/g, '') : shop.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                `আসসালামু আলাইকুম ${shop.name || ''}, আমি ${customer.name} বলছি। আমার বাকি হিসাবের বিষয়ে কথা বলতে চাচ্ছি।`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white py-3 px-4 rounded-xl font-bold text-sm shadow-xs transition"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp-এ মেসেজ পাঠান</span>
            </a>
          )}
        </div>

        {/* Detailed Transactions Statement Timeline ("লেনদেনের তারিখভিত্তিক ইতিহাস") */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#b83a14]" />
              <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                লেনদেনের তারিখভিত্তিক বিস্তারিত বিবরণ
              </h3>
            </div>
            <span className="text-xs text-gray-500 font-medium">
              মোট {toBengaliNumber(transactions.length)} টি এন্ট্রি
            </span>
          </div>

          {sortedTransactions.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              এখনও কোনো লেনদেনের বিবরণ যোগ হয়নি।
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {sortedTransactions.map((tx) => {
                const isDue = tx.type === 'due';
                return (
                  <div key={tx.id} className="p-3.5 sm:p-4 hover:bg-gray-50/70 transition flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isDue
                            ? 'bg-orange-100 text-[#b83a14]'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {isDue ? (
                          <ArrowDownLeft className="w-5 h-5 stroke-[2.4]" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5 stroke-[2.4]" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                            isDue ? 'bg-orange-100 text-[#b83a14]' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isDue ? 'বাকি নিয়েছেন' : 'টাকা দিয়েছেন (পরিশোধ)'}
                          </span>
                          {tx.memoNo && (
                            <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                              #{tx.memoNo}
                            </span>
                          )}
                        </div>

                        {tx.note && (
                          <div className="text-sm font-semibold text-gray-900 mt-1">
                            {tx.note}
                          </div>
                        )}

                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>{formatBengaliDateTime(tx.date)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`text-base sm:text-lg font-black ${
                          isDue ? 'text-[#b83a14]' : 'text-emerald-700'
                        }`}
                      >
                        {isDue ? '+' : '-'} {formatTaka(tx.amount)}
                      </div>
                      <div className="text-[11px] text-gray-500 font-medium mt-0.5">
                        অবশিষ্ট বাকি: {formatTaka(tx.balanceAfter)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Printable Footer / Trust Badge */}
        <div className="text-center pt-4 pb-8 text-xs text-gray-500 space-y-1.5">
          <p className="flex items-center justify-center gap-1 font-semibold text-gray-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            এই হিসাবটি {shop.name || 'দোকান'} এর ডিজিটাল খাতা থেকে সংগৃহীত।
          </p>
          <p className="text-[11px] text-gray-400">
            হিসাবে কোনো অসঙ্গতি বা প্রশ্ন থাকলে সরাসরি দোকানদারের সাথে যোগাযোগ করুন।
          </p>
        </div>
      </main>
    </div>
  );
};
