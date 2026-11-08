import React, { useState } from 'react';
import {
  X,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Edit2,
  Trash2,
  Plus,
  Filter,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useDokan } from '../context/DokanContext';
import { formatTaka, formatBengaliDateTime, toBengaliNumber } from '../utils/bengali';
import { CashEntry } from '../types';
import { DeletePinConfirmModal } from './DeletePinConfirmModal';

interface CashBalanceAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CashBalanceAuditModal: React.FC<CashBalanceAuditModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { cashEntries, addCashEntry, updateCashEntry, deleteCashEntry } = useDokan();

  const [activeTab, setActiveTab] = useState<'all' | 'in' | 'out'>('all');
  const [entryToDelete, setEntryToDelete] = useState<CashEntry | null>(null);
  const [editingEntry, setEditingEntry] = useState<CashEntry | null>(null);

  // Edit form state
  const [editDesc, setEditDesc] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editType, setEditType] = useState<'in' | 'out'>('in');

  // New cash entry form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDesc, setNewDesc] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState('জমা');
  const [newType, setNewType] = useState<'in' | 'out'>('in');

  if (!isOpen) return null;

  // Total plus (inflow) and minus (outflow)
  let totalIn = 0;
  let totalOut = 0;

  for (const entry of cashEntries) {
    if (entry.type === 'in') {
      totalIn += entry.amount;
    } else {
      totalOut += entry.amount;
    }
  }

  const currentBalance = totalIn - totalOut;

  const filteredEntries = cashEntries.filter((c) => {
    if (activeTab === 'in') return c.type === 'in';
    if (activeTab === 'out') return c.type === 'out';
    return true;
  });

  const handleStartEdit = (entry: CashEntry) => {
    setEditingEntry(entry);
    setEditDesc(entry.description);
    setEditAmount(entry.amount.toString());
    setEditCategory(entry.category);
    setEditType(entry.type);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry || !editAmount || !editDesc.trim()) return;

    updateCashEntry(editingEntry.id, {
      description: editDesc.trim(),
      amount: parseFloat(editAmount) || 0,
      category: editCategory.trim() || 'সাধারণ',
      type: editType,
    });

    setEditingEntry(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAmount || !newDesc.trim()) return;

    addCashEntry({
      type: newType,
      amount: parseFloat(newAmount) || 0,
      category: newCategory.trim() || (newType === 'in' ? 'জমা' : 'খরচ'),
      description: newDesc.trim(),
      date: new Date().toISOString(),
    });

    setNewDesc('');
    setNewAmount('');
    setShowAddForm(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs font-['SolaimanLipi',sans-serif]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="bg-white rounded-2xl w-full max-w-xl p-4 sm:p-5 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden relative"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                  দোকানের মোট ক্যাশ ব্যালেন্স ও আয়ের হিসাব
                </h3>
                <p className="text-xs text-gray-500">
                  ক্যাশ জমা-খরচ, লাভ ও বিয়োগের বিস্তারিত বিবরণ
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content Container */}
          <div className="flex-1 overflow-y-auto pt-3 space-y-4 pr-1">
            {/* 3 Summary Cards */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {/* Card 1: Net Balance */}
              <div className="bg-gradient-to-br from-emerald-700 to-emerald-800 text-white p-3 sm:p-3.5 rounded-xl shadow-xs">
                <div className="text-[11px] font-medium text-emerald-100">
                  বর্তমান মোট ক্যাশ
                </div>
                <div className="text-lg sm:text-2xl font-extrabold mt-0.5">
                  {formatTaka(currentBalance)}
                </div>
              </div>

              {/* Card 2: Total Plus (In) */}
              <div className="bg-emerald-50 border border-emerald-200 p-3 sm:p-3.5 rounded-xl">
                <div className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                  <span>মোট জমা (+ প্লাস)</span>
                </div>
                <div className="text-base sm:text-xl font-extrabold text-emerald-700 mt-0.5">
                  +{formatTaka(totalIn)}
                </div>
              </div>

              {/* Card 3: Total Minus (Out) */}
              <div className="bg-red-50 border border-red-200 p-3 sm:p-3.5 rounded-xl">
                <div className="text-[11px] font-bold text-red-800 flex items-center gap-1">
                  <ArrowDownRight className="w-3.5 h-3.5 text-red-600" />
                  <span>মোট খরচ (- মাইনাস)</span>
                </div>
                <div className="text-base sm:text-xl font-extrabold text-red-700 mt-0.5">
                  -{formatTaka(totalOut)}
                </div>
              </div>
            </div>

            {/* Quick Add Button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    activeTab === 'all'
                      ? 'bg-white text-gray-900 shadow-2xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  সব এন্ট্রি ({toBengaliNumber(cashEntries.length)})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('in')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    activeTab === 'in'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  + প্লাস / জমা
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('out')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    activeTab === 'out'
                      ? 'bg-red-600 text-white shadow-2xs'
                      : 'text-red-700 hover:bg-red-50'
                  }`}
                >
                  - মাইনাস / খরচ
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-1 bg-[#b83a14] hover:bg-[#a33210] text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>নতুন এন্ট্রি</span>
              </button>
            </div>

            {/* Add New Cash Entry Inline Form */}
            {showAddForm && (
              <form
                onSubmit={handleAddSubmit}
                className="bg-orange-50/80 p-3.5 rounded-xl border border-orange-200 space-y-2.5 text-xs animate-scale-in"
              >
                <div className="font-bold text-gray-900 text-sm">নতুন ক্যাশ এন্ট্রি যোগ করুন</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewType('in')}
                    className={`py-1.5 rounded-lg font-bold border transition ${
                      newType === 'in'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    + টাকা ঢুকলো (+ প্লাস)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType('out')}
                    className={`py-1.5 rounded-lg font-bold border transition ${
                      newType === 'out'
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    - টাকা গেল (- মাইনাস)
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="বিবরণ (যেমন: বিস্কুট বিক্রি, যাতায়াত)"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="bg-white border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-[#b83a14]"
                  />
                  <input
                    type="number"
                    required
                    placeholder="টাকার পরিমাণ (৳)"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="bg-white border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-[#b83a14]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg font-bold"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#b83a14] text-white rounded-lg font-bold"
                  >
                    সংরক্ষণ করুন
                  </button>
                </div>
              </form>
            )}

            {/* Inline Edit Form */}
            {editingEntry && (
              <form
                onSubmit={handleSaveEdit}
                className="bg-amber-50 p-3.5 rounded-xl border border-amber-300 space-y-2 text-xs"
              >
                <div className="font-bold text-amber-900 text-sm">এন্ট্রি সম্পাদনা করুন</div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditType('in')}
                    className={`py-1.5 rounded-lg font-bold border transition ${
                      editType === 'in'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    + টাকা ঢুকলো (+ প্লাস)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditType('out')}
                    className={`py-1.5 rounded-lg font-bold border transition ${
                      editType === 'out'
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    - টাকা গেল (- মাইনাস)
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    placeholder="বিবরণ"
                    className="bg-white border border-gray-300 rounded-lg p-2"
                  />
                  <input
                    type="number"
                    required
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    placeholder="টাকার পরিমাণ"
                    className="bg-white border border-gray-300 rounded-lg p-2"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditingEntry(null)}
                    className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg font-bold"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#b83a14] text-white rounded-lg font-bold"
                  >
                    আপডেট করুন
                  </button>
                </div>
              </form>
            )}

            {/* List of Cash Entries with Edit & Delete options */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-gray-700">ক্যাশ লেনদেনের ইতিহাস:</div>

              {filteredEntries.length > 0 ? (
                <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white overflow-hidden shadow-2xs">
                  {filteredEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3 flex items-center justify-between gap-3 hover:bg-gray-50/80 transition text-xs sm:text-sm"
                    >
                      <div className="min-w-0 flex items-start gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 font-bold ${
                            entry.type === 'in'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {entry.type === 'in' ? '+' : '-'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-gray-900 truncate">
                            {entry.description}
                          </div>
                          <div className="text-[11px] text-gray-500 mt-0.5 flex flex-wrap items-center gap-1.5">
                            <span className="font-semibold text-gray-600 bg-gray-100 px-1.5 py-0.2 rounded">
                              {entry.category}
                            </span>
                            <span>•</span>
                            <span>{formatBengaliDateTime(entry.date)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right side: Amount and Action Buttons (Edit & Delete) */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`font-black text-sm sm:text-base ${
                            entry.type === 'in' ? 'text-emerald-700' : 'text-red-600'
                          }`}
                        >
                          {entry.type === 'in' ? '+' : '-'}{formatTaka(entry.amount)}
                        </span>

                        <div className="flex items-center gap-1 border-l border-gray-200 pl-2">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(entry)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition"
                            title="এডিট করুন"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEntryToDelete(entry)}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                            title="ডিলিট করুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  কোনো ক্যাশ এন্ট্রি পাওয়া যায়নি।
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Delete Confirmation PIN Modal */}
        <DeletePinConfirmModal
          isOpen={!!entryToDelete}
          title="ক্যাশ এন্ট্রি মুছে ফেলা"
          itemName={entryToDelete ? `${entryToDelete.description} (${formatTaka(entryToDelete.amount)})` : undefined}
          onConfirm={() => {
            if (entryToDelete) {
              deleteCashEntry(entryToDelete.id);
              setEntryToDelete(null);
            }
          }}
          onClose={() => setEntryToDelete(null)}
        />
      </div>
    </AnimatePresence>
  );
};
