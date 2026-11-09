import React from 'react';
import {
  X,
  Trash2,
  Edit2,
  Receipt,
  ShoppingCart,
  Coins,
  TrendingUp,
  Clock,
  User,
  Package,
} from 'lucide-react';
import { useDokan } from '../context/DokanContext';
import { formatTaka, toBengaliNumber, formatBengaliDateTime, formatBengaliDate } from '../utils/bengali';
import { SaleRecord, CustomerTransaction } from '../types';
import { DeletePinConfirmModal } from './DeletePinConfirmModal';

interface DailyMetricsDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'sales' | 'due' | 'received' | 'profit';
}

export const DailyMetricsDetailModal: React.FC<DailyMetricsDetailModalProps> = ({
  isOpen,
  onClose,
  type,
}) => {
  const { sales, transactions, customers, deleteSale, deleteTransaction, updateTransaction } = useDokan();
  const [itemToDelete, setItemToDelete] = React.useState<{ id: string; type: 'sale' | 'tx' } | null>(null);
  const [itemToEdit, setItemToEdit] = React.useState<{ id: string; amount: string; note: string; type: 'tx' } | null>(null);

  if (!isOpen) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = (dateStr: string) => {
    const d = new Date(dateStr);
    return d >= today && d < tomorrow;
  };

  const getTitle = () => {
    switch (type) {
      case 'sales': return 'আজকের বিক্রির বিস্তারিত';
      case 'due': return 'আজকের বাকির বিস্তারিত';
      case 'received': return 'আজকের আদায়ের বিস্তারিত';
      case 'profit': return 'আজকের লাভের বিস্তারিত';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'sales': return <ShoppingCart className="w-5 h-5 text-[#b83a14]" />;
      case 'due': return <Coins className="w-5 h-5 text-red-600" />;
      case 'received': return <Receipt className="w-5 h-5 text-emerald-600" />;
      case 'profit': return <TrendingUp className="w-5 h-5 text-blue-700" />;
    }
  };

  const filteredSales = sales.filter(s => isToday(s.date));
  const filteredTxs = transactions.filter(t => isToday(t.date));
  const dueGivenTxs = filteredTxs.filter(t => t.type === 'due');
  const receivedTxs = filteredTxs.filter(t => t.type === 'payment');

  const handleDeleteConfirm = () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === 'sale') {
      deleteSale(itemToDelete.id);
    } else {
      deleteTransaction(itemToDelete.id);
    }
    setItemToDelete(null);
  };

  const handleUpdateTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemToEdit) return;
    updateTransaction(itemToEdit.id, {
      amount: parseFloat(itemToEdit.amount) || 0,
      note: itemToEdit.note,
    });
    setItemToEdit(null);
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 overflow-hidden animate-in fade-in duration-300">
      <div className="bg-white rounded-t-[2rem] sm:rounded-2xl w-full h-[85dvh] sm:h-auto sm:max-w-2xl sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10">
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="p-1.5 sm:p-2 rounded-xl bg-white shadow-sm border border-gray-100 shrink-0">
              {getIcon()}
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-gray-900 text-sm sm:text-lg tracking-tight truncate">
                {getTitle()}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium truncate">
                {formatBengaliDate(new Date())} (আজ রাত ১২টা পর্যন্ত)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 transition text-gray-400 hover:text-gray-600 active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {type === 'sales' || type === 'profit' ? (
            filteredSales.length > 0 ? (
              filteredSales.map((sale) => (
                <div key={sale.id} className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm space-y-2.5 hover:border-orange-200 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-orange-50 text-[#b83a14]">
                        <Receipt className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-gray-900 text-sm truncate">
                          {sale.customerName}
                        </div>
                        <div className="text-[10px] text-gray-400 font-medium">
                          মেমো: #{sale.memoNo} • {formatBengaliDateTime(sale.date)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-[#b83a14] text-base">
                        {formatTaka(type === 'profit' ? sale.profit : sale.grandTotal)}
                      </div>
                      <div className="text-[10px] text-gray-500 font-bold">
                        {type === 'profit' ? 'লাভ' : 'বিক্রি'}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 border-t border-gray-50 pt-2.5">
                    {sale.items.map((item, i) => (
                      <span key={i} className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-medium">
                        {item.product.name} ({toBengaliNumber(item.quantity)})
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-1 border-t border-gray-50">
                    <button
                      onClick={() => setItemToDelete({ id: sale.id, type: 'sale' })}
                      className="flex items-center gap-1 text-[11px] text-red-500 font-bold hover:bg-red-50 px-2 py-1 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>মুছে ফেলুন</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-gray-400">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">আজ কোনো বিক্রি হয়নি</p>
              </div>
            )
          ) : (
            (type === 'due' ? dueGivenTxs : receivedTxs).length > 0 ? (
              (type === 'due' ? dueGivenTxs : receivedTxs).map((tx) => {
                const customer = customers.find(c => c.id === tx.customerId);
                return (
                  <div key={tx.id} className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm space-y-2.5 hover:border-emerald-200 transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${type === 'due' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {type === 'due' ? <Coins className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-gray-900 text-sm truncate">
                            {customer?.name || 'অজানা কাস্টমার'}
                          </div>
                          <div className="text-[10px] text-gray-400 font-medium">
                            {formatBengaliDateTime(tx.date)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-extrabold text-base ${type === 'due' ? 'text-red-600' : 'text-emerald-600'}`}>
                          {formatTaka(tx.amount)}
                        </div>
                        <div className="text-[10px] text-gray-500 font-bold">
                          {type === 'due' ? 'বাকি' : 'আদায়'}
                        </div>
                      </div>
                    </div>

                    {tx.note && (
                      <div className="text-[11px] text-gray-600 bg-gray-50 p-1.5 rounded-lg border border-gray-100 italic">
                        {tx.note}
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-1 border-t border-gray-50">
                      <button
                        onClick={() => setItemToEdit({ id: tx.id, amount: String(tx.amount), note: tx.note || '', type: 'tx' })}
                        className="flex items-center gap-1 text-[11px] text-blue-600 font-bold hover:bg-blue-50 px-2 py-1 rounded-lg transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>এডিট</span>
                      </button>
                      <button
                        onClick={() => setItemToDelete({ id: tx.id, type: 'tx' })}
                        className="flex items-center gap-1 text-[11px] text-red-500 font-bold hover:bg-red-50 px-2 py-1 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>মুছে ফেলুন</span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-gray-400">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">আজ কোনো {type === 'due' ? 'বাকি' : 'আদায়'} নেই</p>
              </div>
            )
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] font-bold text-gray-500">
          <div>
            মোট {toBengaliNumber(type === 'sales' || type === 'profit' ? filteredSales.length : (type === 'due' ? dueGivenTxs : receivedTxs).length)} টি এন্ট্রি
          </div>
          <div className="text-gray-900">
            সর্বমোট: {formatTaka(
              type === 'sales' ? filteredSales.reduce((acc, s) => acc + s.grandTotal, 0) :
              type === 'profit' ? filteredSales.reduce((acc, s) => acc + s.profit, 0) :
              type === 'due' ? dueGivenTxs.reduce((acc, t) => acc + t.amount, 0) :
              receivedTxs.reduce((acc, t) => acc + t.amount, 0)
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      <DeletePinConfirmModal
        isOpen={!!itemToDelete}
        title={itemToDelete?.type === 'sale' ? 'বিক্রি মুছে ফেলা' : 'লেনদেন মুছে ফেলা'}
        itemName="এই রেকর্ডটি মুছে ফেললে হিসাব পরিবর্তিত হবে।"
        onConfirm={handleDeleteConfirm}
        onClose={() => setItemToDelete(null)}
      />

      {/* Edit Tx Modal */}
      {itemToEdit && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            <h4 className="font-bold text-gray-900 border-b pb-2">এন্ট্রি এডিট করুন</h4>
            <form onSubmit={handleUpdateTx} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">পরিমাণ (৳)</label>
                <input
                  type="number"
                  value={itemToEdit.amount}
                  onChange={(e) => setItemToEdit({ ...itemToEdit, amount: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#b83a14]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">নোট</label>
                <input
                  type="text"
                  value={itemToEdit.note}
                  onChange={(e) => setItemToEdit({ ...itemToEdit, note: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b83a14]"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-[#b83a14] text-white py-2 rounded-xl font-bold text-xs"
                >
                  সংরক্ষণ
                </button>
                <button
                  type="button"
                  onClick={() => setItemToEdit(null)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl font-bold text-xs"
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
