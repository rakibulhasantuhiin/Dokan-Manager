import React, { useState, useMemo } from 'react';
import { Plus, Search, User, Phone, MapPin, ChevronRight, QrCode } from 'lucide-react';
import { useDokan } from '../context/DokanContext';
import { Customer } from '../types';
import { formatTaka, toBengaliNumber } from '../utils/bengali';
import { CustomerLedgerShareModal } from './CustomerLedgerShareModal';

interface CustomerListViewProps {
  onSelectCustomer: (customer: Customer) => void;
}

export const CustomerListView: React.FC<CustomerListViewProps> = ({ onSelectCustomer }) => {
  const { customers, addCustomer, transactions, settings } = useDokan();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'due' | 'all' | 'nodue'>('due');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [shareCustomer, setShareCustomer] = useState<Customer | null>(null);

  // New Customer Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [initialDue, setInitialDue] = useState('');
  const [error, setError] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('কাস্টমারের নাম লিখুন');
      return;
    }

    const dueVal = parseFloat(initialDue) || 0;
    const newCust = addCustomer(name.trim(), phone.trim() || undefined, address.trim() || undefined, dueVal);

    setName('');
    setPhone('');
    setAddress('');
    setInitialDue('');
    setError('');
    setIsAddModalOpen(false);

    onSelectCustomer(newCust);
  };

  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        if (filterTab === 'due' && c.currentDue <= 0) return false;
        if (filterTab === 'nodue' && c.currentDue > 0) return false;

        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          (c.phone && c.phone.includes(q)) ||
          (c.address && c.address.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => b.currentDue - a.currentDue || b.totalGiven - a.totalGiven || a.name.localeCompare(b.name));
  }, [customers, filterTab, searchQuery]);

  const totalDueSum = useMemo(() => {
    return customers.reduce((sum, c) => sum + c.currentDue, 0);
  }, [customers]);

  return (
    <div className="h-[calc(100dvh-7rem)] lg:h-auto flex flex-col space-y-2.5 pb-1 lg:pb-20 pt-1.5 sm:pt-3 overflow-hidden lg:overflow-visible">
      {/* Top Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-xl font-bold text-gray-800 tracking-tight">
              কাস্টমার খাতা
            </h2>
            <span className="text-[10px] sm:text-xs font-semibold bg-orange-100 text-[#b83a14] px-2 py-0.5 rounded-md">
              বেশি বাকি অনুযায়ী সিরিয়াল
            </span>
          </div>
          <div className="text-xs text-gray-500">
            মোট বাকি: <strong className="text-[#b83a14]">{formatTaka(totalDueSum)}</strong>
          </div>
        </div>

        <button
          onClick={() => {
            setName('');
            setPhone('');
            setAddress('');
            setInitialDue('');
            setError('');
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-1 bg-[#b83a14] hover:bg-[#a33210] active:scale-95 text-white text-xs sm:text-sm font-bold px-3 py-1.5 rounded-xl shadow-xs transition"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>নতুন কাস্টমার</span>
        </button>
      </div>

      {/* Search Input Bar + Filter Tabs */}
      <div className="flex flex-col sm:flex-row gap-2 shrink-0">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="কাস্টমারের নাম বা মোবাইল নম্বর..."
            className="w-full bg-white border border-gray-300 rounded-xl pl-8 pr-8 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#b83a14] focus:border-transparent shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs bg-gray-100 rounded-full w-4 h-4 flex items-center justify-center"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1.5 text-xs font-semibold shrink-0">
          <button
            onClick={() => setFilterTab('due')}
            className={`px-3 py-1.5 rounded-xl border transition ${
              filterTab === 'due'
                ? 'bg-[#b83a14] text-white border-[#b83a14]'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            বাকিদার ({toBengaliNumber(customers.filter((c) => c.currentDue > 0).length)})
          </button>
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-xl border transition ${
              filterTab === 'all'
                ? 'bg-[#b83a14] text-white border-[#b83a14]'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            সব ({toBengaliNumber(customers.length)})
          </button>
          <button
            onClick={() => setFilterTab('nodue')}
            className={`px-3 py-1.5 rounded-xl border transition ${
              filterTab === 'nodue'
                ? 'bg-[#b83a14] text-white border-[#b83a14]'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            বাকি নেই
          </button>
        </div>
      </div>

      {/* Customer List - Scrollable within Single Mobile Screen */}
      <div className="flex-1 min-h-0 bg-white rounded-xl border border-gray-200 shadow-2xs divide-y divide-gray-100 overflow-y-auto">
        {filteredCustomers.length > 0 ? (
          filteredCustomers.map((cust, index) => (
            <div
              key={cust.id}
              onClick={() => onSelectCustomer(cust)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onSelectCustomer(cust);
                }
              }}
              className="w-full p-2.5 sm:p-3.5 flex items-center justify-between text-left hover:bg-gray-50/80 transition cursor-pointer active:bg-gray-100"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-extrabold text-xs sm:text-sm shrink-0 border ${
                    index === 0 && cust.currentDue > 0
                      ? 'bg-[#b83a14] text-white border-[#b83a14] shadow-2xs'
                      : cust.currentDue > 0
                      ? 'bg-orange-100 text-[#b83a14] border-orange-200'
                      : 'bg-gray-100 text-gray-600 border-gray-200'
                  }`}
                  title={`সিরিয়াল নং ${toBengaliNumber(index + 1)}`}
                >
                  {toBengaliNumber(index + 1)}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-gray-900 text-xs sm:text-sm truncate">
                    {cust.name}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-500 truncate">
                    {cust.phone && <span>{toBengaliNumber(cust.phone)}</span>}
                    {cust.address && <span>• {cust.address}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShareCustomer(cust);
                  }}
                  title="বাকি খাতার QR কোড ও লিঙ্ক"
                  className="p-1.5 text-gray-500 hover:text-[#b83a14] hover:bg-orange-100/70 rounded-lg transition"
                >
                  <QrCode className="w-4 h-4" />
                </button>
                <div className="text-right">
                  <div
                    className={`font-bold text-xs sm:text-sm ${
                      cust.currentDue > 0 ? 'text-[#b83a14]' : 'text-emerald-600'
                    }`}
                  >
                    {cust.currentDue > 0 ? formatTaka(cust.currentDue) : 'বাকি নেই'}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {cust.currentDue > 0 ? 'বাকি আছে' : 'পরিশোধিত'}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-center text-gray-500 text-xs sm:text-sm">
            কোনো কাস্টমার পাওয়া যায়নি।
          </div>
        )}
      </div>

      {/* Add Customer Modal (z-[70] sits above BottomNav, compact single-screen fit) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-3 bg-black/65 backdrop-blur-xs">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-4 sm:p-5 shadow-2xl max-h-[92dvh] overflow-y-auto">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">
              + নতুন কাস্টমার যোগ করুন
            </h3>

            {error && (
              <div className="mb-2.5 text-xs bg-red-50 text-red-600 p-2 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-2.5 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  কাস্টমারের নাম <span className="text-[#b83a14]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="যেমন: আলামিন ফকির"
                  className="w-full bg-[#fbfaf8] border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#b83a14] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    মোবাইল নম্বর
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01700000000"
                    className="w-full bg-[#fbfaf8] border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#b83a14] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    শুরুর বাকি (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={initialDue}
                    onChange={(e) => setInitialDue(e.target.value)}
                    placeholder="০"
                    className="w-full bg-[#fbfaf8] border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#b83a14] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  ঠিকানা (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="যেমন: গ্রাম বা বাজার লেন"
                  className="w-full bg-[#fbfaf8] border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#b83a14] focus:bg-white"
                />
              </div>

              <div className="pt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-full py-2.5 bg-white hover:bg-gray-50 active:scale-[0.99] text-gray-700 border border-gray-300 rounded-xl font-bold text-xs sm:text-sm transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#b83a14] hover:bg-[#a33210] active:scale-[0.99] text-white rounded-xl font-bold text-xs sm:text-sm shadow-xs transition"
                >
                  কাস্টমার সংরক্ষণ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Customer Ledger Share & QR Modal */}
      {shareCustomer && (
        <CustomerLedgerShareModal
          isOpen={!!shareCustomer}
          onClose={() => setShareCustomer(null)}
          customer={shareCustomer}
          transactions={transactions}
          settings={settings}
        />
      )}
    </div>
  );
};
