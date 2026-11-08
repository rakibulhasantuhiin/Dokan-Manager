import React, { useState, useMemo } from 'react';
import { X, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { Customer } from '../types';
import { useDokan } from '../context/DokanContext';
import { formatTaka, toBengaliNumber } from '../utils/bengali';

interface QuickTransactionModalProps {
  type: 'due' | 'payment';
  initialCustomer?: Customer | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const QuickTransactionModal: React.FC<QuickTransactionModalProps> = ({
  type,
  initialCustomer,
  onClose,
  onSuccess,
}) => {
  const { customers, addCustomer, addTransaction } = useDokan();

  const sortedCustomers = useMemo(
    () => [...customers].sort((a, b) => b.currentDue - a.currentDue || b.totalGiven - a.totalGiven || a.name.localeCompare(b.name)),
    [customers]
  );

  const [selectedCustomerId, setSelectedCustomerId] = useState(
    initialCustomer?.id || (sortedCustomers[0]?.id || '')
  );
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const isDue = type === 'due';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setError('সঠিক টাকার পরিমাণ লিখুন');
      return;
    }

    let targetCustId = selectedCustomerId;

    if (isNewCustomer) {
      if (!newCustName.trim()) {
        setError('কাস্টমারের নাম লিখুন');
        return;
      }
      const newCust = addCustomer(newCustName.trim(), newCustPhone.trim() || undefined);
      targetCustId = newCust.id;
    }

    if (!targetCustId) {
      setError('কাস্টমার নির্বাচন করুন');
      return;
    }

    addTransaction(targetCustId, type, val, note.trim() || undefined);
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-3 bg-black/65 backdrop-blur-xs">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-4 sm:p-5 shadow-2xl max-h-[92dvh] overflow-y-auto">
        <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isDue ? 'bg-[#b83a14]' : 'bg-[#15803d]'
              }`}
            />
            <h3 className="font-bold text-gray-900 text-base">
              {isDue ? '+ বাকি দিলাম' : '+ টাকা পেলাম'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-2.5 text-xs bg-red-50 text-red-600 p-2 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-3 space-y-2.5 text-xs sm:text-sm">
          {/* Customer Selection */}
          {!initialCustomer && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                <span>কাস্টমার:</span>
                <button
                  type="button"
                  onClick={() => setIsNewCustomer(!isNewCustomer)}
                  className="text-[#b83a14] hover:underline font-bold"
                >
                  {isNewCustomer ? 'তালিকায় থাকা কাস্টমার বাছুন' : '+ নতুন কাস্টমার'}
                </button>
              </div>

              {isNewCustomer ? (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="কাস্টমারের নাম *"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    className="w-full bg-[#fbfaf8] border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#b83a14]"
                  />
                  <input
                    type="tel"
                    placeholder="মোবাইল নম্বর"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="w-full bg-[#fbfaf8] border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#b83a14]"
                  />
                </div>
              ) : (
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-[#fbfaf8] border border-gray-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#b83a14]"
                >
                  {sortedCustomers.map((c, idx) => (
                    <option key={c.id} value={c.id}>
                      {toBengaliNumber(idx + 1)}. {c.name} {c.currentDue > 0 ? `(বর্তমান বাকি ${formatTaka(c.currentDue)})` : '(বাকি নেই)'}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {initialCustomer && (
            <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-gray-500">কাস্টমার:</div>
                <div className="font-bold text-gray-900 text-xs sm:text-sm">
                  {initialCustomer.name}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-gray-500">বর্তমান বাকি:</div>
                <strong className="text-[#b83a14] text-sm">{formatTaka(initialCustomer.currentDue)}</strong>
              </div>
            </div>
          )}

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              টাকার পরিমাণ (৳) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min="1"
              step="any"
              autoFocus
              placeholder="০"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-[#fbfaf8] border border-gray-300 rounded-xl px-3.5 py-2.5 text-base sm:text-lg font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#b83a14] focus:bg-white"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              বিবরণ / নোট (ঐচ্ছিক)
            </label>
            <input
              type="text"
              placeholder={isDue ? 'যেমন: চাল ও তেলের বাকি' : 'যেমন: নগদ পরিশোধ'}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-[#fbfaf8] border border-gray-300 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#b83a14] focus:bg-white"
            />
          </div>

          <div className="pt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-xl font-bold text-xs sm:text-sm transition"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className={`w-full py-2.5 text-white rounded-xl font-bold text-xs sm:text-sm shadow-xs transition active:scale-[0.99] flex items-center justify-center gap-1 ${
                isDue
                  ? 'bg-[#b83a14] hover:bg-[#a33210]'
                  : 'bg-[#15803d] hover:bg-[#166534]'
              }`}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{isDue ? 'বাকি লিখে রাখুন' : 'টাকা জমা লিখুন'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
