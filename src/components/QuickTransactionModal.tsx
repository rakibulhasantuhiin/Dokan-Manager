import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { Customer } from '../types';
import { useDokan } from '../context/DokanContext';
import { formatTaka } from '../utils/bengali';

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

  const [selectedCustomerId, setSelectedCustomerId] = useState(
    initialCustomer?.id || (customers[0]?.id || '')
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="bg-white rounded-2xl w-full max-w-md p-5 shadow-2xl"
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
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
          <div className="mt-3 text-xs bg-red-50 text-red-600 p-2.5 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-sm">
          {/* Customer Selection */}
          {!initialCustomer && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                <span>কাস্টমার:</span>
                <button
                  type="button"
                  onClick={() => setIsNewCustomer(!isNewCustomer)}
                  className="text-[#b83a14] hover:underline"
                >
                  {isNewCustomer ? 'তালিকায় থাকা কাস্টমার বাছুন' : '+ নতুন কাস্টমার'}
                </button>
              </div>

              {isNewCustomer ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    placeholder="কাস্টমারের নাম *"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    className="w-full bg-[#fbfaf8] border border-gray-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#b83a14]"
                  />
                  <input
                    type="tel"
                    placeholder="মোবাইল নম্বর (ঐচ্ছিক)"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="w-full bg-[#fbfaf8] border border-gray-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#b83a14]"
                  />
                </div>
              ) : (
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-[#fbfaf8] border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#b83a14]"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.currentDue > 0 ? `(বর্তমান বাকি ${formatTaka(c.currentDue)})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {initialCustomer && (
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div className="text-xs text-gray-500">কাস্টমার:</div>
              <div className="font-bold text-gray-900 text-sm mt-0.5">
                {initialCustomer.name}
              </div>
              <div className="text-xs text-gray-600 mt-0.5">
                বর্তমান বাকি: <strong className="text-[#b83a14]">{formatTaka(initialCustomer.currentDue)}</strong>
              </div>
            </div>
          )}

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
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
              className="w-full bg-[#fbfaf8] border border-gray-300 rounded-xl px-3.5 py-3 text-lg font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#b83a14] focus:bg-white"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              বিবরণ / নোট (ঐচ্ছিক)
            </label>
            <input
              type="text"
              placeholder={isDue ? 'যেমন: চাল ও তেলের বাকি' : 'যেমন: নগদ পরিশোধ'}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-[#fbfaf8] border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#b83a14] focus:bg-white"
            />
          </div>

          <div className="pt-2 space-y-2">
            <button
              type="submit"
              className={`w-full py-3 text-white rounded-xl font-bold text-base shadow-xs transition active:scale-[0.99] flex items-center justify-center gap-1.5 ${
                isDue
                  ? 'bg-[#b83a14] hover:bg-[#a33210]'
                  : 'bg-[#15803d] hover:bg-[#166534]'
              }`}
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              <span>{isDue ? 'বাকি লিখে রাখুন' : 'টাকা জমা লিখুন'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-xl font-bold text-sm transition"
            >
              বাতিল
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
