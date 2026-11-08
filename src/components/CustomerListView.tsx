import React, { useState, useMemo } from 'react';
import { Plus, Search, User, Phone, MapPin, ChevronRight } from 'lucide-react';
import { useDokan } from '../context/DokanContext';
import { Customer } from '../types';
import { formatTaka, toBengaliNumber } from '../utils/bengali';

interface CustomerListViewProps {
  onSelectCustomer: (customer: Customer) => void;
}

export const CustomerListView: React.FC<CustomerListViewProps> = ({ onSelectCustomer }) => {
  const { customers, addCustomer } = useDokan();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'due' | 'all' | 'nodue'>('due');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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
    return customers.filter((c) => {
      if (filterTab === 'due' && c.currentDue <= 0) return false;
      if (filterTab === 'nodue' && c.currentDue > 0) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q))
      );
    });
  }, [customers, filterTab, searchQuery]);

  const totalDueSum = useMemo(() => {
    return customers.reduce((sum, c) => sum + c.currentDue, 0);
  }, [customers]);

  return (
    <div className="space-y-4 pb-24 pt-3">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800 tracking-tight">
            কাস্টমার খাতা
          </h2>
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
          className="flex items-center gap-1.5 bg-[#b83a14] hover:bg-[#a33210] active:scale-95 text-white text-sm font-bold px-3.5 py-2 rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>নতুন কাস্টমার</span>
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="কাস্টমারের নাম বা মোবাইল নম্বর..."
          className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#b83a14] focus:border-transparent shadow-xs"
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

      {/* Filter Tabs */}
      <div className="flex gap-2 text-xs font-semibold">
        <button
          onClick={() => setFilterTab('due')}
          className={`px-3.5 py-1.5 rounded-lg border transition ${
            filterTab === 'due'
              ? 'bg-[#b83a14] text-white border-[#b83a14]'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          সকল বাকিদার ({toBengaliNumber(customers.filter((c) => c.currentDue > 0).length)})
        </button>
        <button
          onClick={() => setFilterTab('all')}
          className={`px-3.5 py-1.5 rounded-lg border transition ${
            filterTab === 'all'
              ? 'bg-[#b83a14] text-white border-[#b83a14]'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          সব ({toBengaliNumber(customers.length)})
        </button>
        <button
          onClick={() => setFilterTab('nodue')}
          className={`px-3.5 py-1.5 rounded-lg border transition ${
            filterTab === 'nodue'
              ? 'bg-[#b83a14] text-white border-[#b83a14]'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          বাকি নেই
        </button>
      </div>

      {/* Customer List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs divide-y divide-gray-100 overflow-hidden">
        {filteredCustomers.length > 0 ? (
          filteredCustomers.map((cust) => (
            <button
              key={cust.id}
              onClick={() => onSelectCustomer(cust)}
              className="w-full p-3.5 sm:p-4 flex items-center justify-between text-left hover:bg-gray-50/80 transition active:bg-gray-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 text-[#b83a14] flex items-center justify-center font-bold text-base shrink-0">
                  {cust.name.slice(0, 1)}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm sm:text-base">
                    {cust.name}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                    {cust.phone && <span>{toBengaliNumber(cust.phone)}</span>}
                    {cust.address && <span>• {cust.address}</span>}
                  </div>
                </div>
              </div>

                <div className="flex items-center gap-2">
                <div className="text-right">
                  <div
                    className={`font-bold text-sm sm:text-base ${
                      cust.currentDue > 0 ? 'text-[#b83a14]' : 'text-emerald-600'
                    }`}
                  >
                    {cust.currentDue > 0 ? formatTaka(cust.currentDue) : 'বাকি নেই'}
                  </div>
                  <div className="text-[11px] text-gray-400">
                    {cust.currentDue > 0 ? 'বাকি আছে' : 'পরিশোধিত'}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </button>
          ))
        ) : (
          <div className="p-8 text-center text-gray-500 text-sm">
            কোনো কাস্টমার পাওয়া যায়নি।
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 shadow-2xl animate-scale-in">
            <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
              + নতুন কাস্টমার যোগ করুন
            </h3>

            {error && (
              <div className="mb-3 text-xs bg-red-50 text-red-600 p-2 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  কাস্টমারের নাম <span className="text-[#b83a14]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="যেমন: আলামিন ফকির"
                  className="w-full bg-[#fbfaf8] border border-gray-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#b83a14] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  মোবাইল নম্বর
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="যেমন: 01700000000"
                  className="w-full bg-[#fbfaf8] border border-gray-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#b83a14] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  ঠিকানা (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="যেমন: গ্রাম বা বাজার লেন"
                  className="w-full bg-[#fbfaf8] border border-gray-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#b83a14] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  পূর্বের শুরুর বাকি থাকলে লিখুন (৳)
                </label>
                <input
                  type="number"
                  min="0"
                  value={initialDue}
                  onChange={(e) => setInitialDue(e.target.value)}
                  placeholder="০"
                  className="w-full bg-[#fbfaf8] border border-gray-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#b83a14] focus:bg-white"
                />
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-[#b83a14] hover:bg-[#a33210] active:scale-[0.99] text-white rounded-xl font-bold text-base shadow-xs transition"
                >
                  কাস্টমার সংরক্ষণ করুন
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-full py-2.5 bg-white hover:bg-gray-50 active:scale-[0.99] text-gray-700 border border-gray-300 rounded-xl font-bold text-sm transition"
                >
                  বাতিল
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
