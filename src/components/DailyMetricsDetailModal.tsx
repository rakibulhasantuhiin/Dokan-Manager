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
  Save,
  Package,
  Printer,
  Calendar,
} from 'lucide-react';
import { useDokan } from '../context/DokanContext';
import { formatTaka, toBengaliNumber, formatBengaliDateTime, formatBengaliDate } from '../utils/bengali';
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
  const { sales, transactions, customers, deleteSale, deleteTransaction, updateTransaction, settings } = useDokan();
  const [itemToDelete, setItemToDelete] = React.useState<{ id: string; type: 'sale' | 'tx' } | null>(null);
  const [itemToEdit, setItemToEdit] = React.useState<{ id: string; amount: string; note: string; type: 'tx' } | null>(null);

  if (!isOpen) return null;

  const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const getTitle = () => {
    switch (type) {
      case 'sales': return 'বিক্রির বিস্তারিত রিপোর্ট';
      case 'due': return 'বাকির বিস্তারিত রিপোর্ট';
      case 'received': return 'নগদ আদায়ের বিস্তারিত';
      case 'profit': return 'লাভের বিস্তারিত রিপোর্ট';
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

  const filteredSales = sales.filter(s => s.date.startsWith(selectedDate));
  const filteredTxs = transactions.filter(t => t.date.startsWith(selectedDate));
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4 overflow-hidden animate-in fade-in duration-300 print:bg-white print:relative print:p-0 print:overflow-visible">
      <div className="bg-white rounded-t-[2rem] sm:rounded-3xl w-full h-[90dvh] sm:h-auto sm:max-w-2xl sm:max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 print:shadow-none print:max-h-none print:h-auto print:overflow-visible print:rounded-none">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 sticky top-0 z-10 shrink-0 print:hidden">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-white shadow-sm border border-gray-100 shrink-0">
              {getIcon()}
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-gray-900 text-sm sm:text-lg tracking-tight truncate">
                {getTitle()}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium truncate">
                {formatBengaliDate(selectedDate)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 active:scale-90 transition shadow-sm"
              title="রিপোর্ট প্রিন্ট করুন"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-200 transition text-gray-400 hover:text-gray-600 active:scale-90"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Date Selector & Print Header Wrapper */}
        <div className="px-4 py-3 bg-white border-b border-gray-100 flex items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
            <Calendar className="w-4 h-4 text-[#b83a14]" />
            <span>তারিখ পরিবর্তন:</span>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#b83a14]"
          />
        </div>

        {/* Print Only Header */}
        <div className="hidden print:block p-8 text-center border-b-2 border-black space-y-2 w-full">
           <h1 className="text-3xl font-black">{settings.shopName}</h1>
           <p className="text-sm font-bold">বিস্তারিত রিপোর্ট: {getTitle()}</p>
           <p className="text-xs">তারিখ: {formatBengaliDate(selectedDate)}</p>
        </div>

        {/* Content */}
        <div id="printable-report" className="flex-1 overflow-y-auto p-4 space-y-4 pb-20 print:p-8 print:overflow-visible print:pb-0">
          {type === 'sales' || type === 'profit' ? (
            filteredSales.length > 0 ? (
              filteredSales.map((sale) => (
                <div key={sale.id} className="bg-white border-2 border-gray-100 rounded-2xl p-4 shadow-xs space-y-3 hover:border-orange-200 transition print:border-black print:rounded-none print:shadow-none print:break-inside-avoid">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-orange-50 text-[#b83a14] print:hidden">
                        <Receipt className="w-5 h-5" />
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
                      <div className="font-extrabold text-[#b83a14] text-base sm:text-lg">
                        {formatTaka(type === 'profit' ? sale.profit : sale.grandTotal)}
                      </div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                        {type === 'profit' ? 'লাভ' : 'বিক্রি'}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-50 print:border-black/20">
                    {sale.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg text-[10px] font-bold print:bg-transparent print:border print:border-gray-300">
                        <Package className="w-3 h-3 text-gray-400 print:hidden" />
                        <span>{item.product.name} ({toBengaliNumber(item.quantity)})</span>
                      </div>
                    ))}
                  </div>

                  {sale.dueAmount > 0 && (
                    <div className="flex items-center gap-1.5 text-red-600 text-[10px] font-bold bg-red-50 px-2.5 py-1 rounded-lg print:bg-transparent print:border print:border-red-200">
                      <Clock className="w-3 h-3 print:hidden" />
                      <span>বাকি: {formatTaka(sale.dueAmount)}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-50 print:hidden">
                    <button
                      onClick={() => setItemToDelete({ id: sale.id, type: 'sale' })}
                      className="flex items-center gap-1.5 text-[11px] text-red-500 font-extrabold hover:bg-red-50 px-3 py-1.5 rounded-xl transition"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>মুছে ফেলুন</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center text-gray-400 print:text-black">
                <Clock className="w-16 h-16 mx-auto mb-4 opacity-10 print:hidden" />
                <p className="text-sm font-bold">এই তারিখে কোনো বিক্রি রেকর্ড পাওয়া যায়নি</p>
              </div>
            )
          ) : (
            (type === 'due' ? dueGivenTxs : receivedTxs).length > 0 ? (
              (type === 'due' ? dueGivenTxs : receivedTxs).map((tx) => {
                const customer = customers.find(c => c.id === tx.customerId);
                return (
                  <div key={tx.id} className="bg-white border-2 border-gray-100 rounded-2xl p-4 shadow-xs space-y-3 hover:border-emerald-200 transition print:border-black print:rounded-none print:break-inside-avoid">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${type === 'due' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'} print:hidden`}>
                          {type === 'due' ? <Coins className="w-5 h-5" /> : <Save className="w-5 h-5" />}
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
                        <div className={`font-extrabold text-base sm:text-lg ${type === 'due' ? 'text-red-600' : 'text-emerald-600'}`}>
                          {formatTaka(tx.amount)}
                        </div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                          {type === 'due' ? 'বাকি' : 'আদায়'}
                        </div>
                      </div>
                    </div>

                    {tx.note && (
                      <div className="text-[11px] text-gray-600 bg-gray-50 p-2 rounded-xl border border-gray-100 font-medium italic print:bg-white print:border-gray-300">
                        {tx.note}
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-50 print:hidden">
                      <button
                        onClick={() => setItemToEdit({ id: tx.id, amount: String(tx.amount), note: tx.note || '', type: 'tx' })}
                        className="flex items-center gap-1.5 text-[11px] text-blue-600 font-extrabold hover:bg-blue-50 px-3 py-1.5 rounded-xl transition"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span>এডিট</span>
                      </button>
                      <button
                        onClick={() => setItemToDelete({ id: tx.id, type: 'tx' })}
                        className="flex items-center gap-1.5 text-[11px] text-red-500 font-extrabold hover:bg-red-50 px-3 py-1.5 rounded-xl transition"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>মুছে ফেলুন</span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-20 text-center text-gray-400 print:text-black">
                <Clock className="w-16 h-16 mx-auto mb-4 opacity-10 print:hidden" />
                <p className="text-sm font-bold">এই তারিখে কোনো {type === 'due' ? 'বাকি' : 'আদায়'} রেকর্ড নেই</p>
              </div>
            )
          )}
        </div>

        {/* Footer Sum */}
        <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs font-black text-gray-700 shrink-0 print:bg-white print:border-black print:text-black">
          <div className="flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-[#b83a14] print:hidden" />
             <span>মোট {toBengaliNumber(type === 'sales' || type === 'profit' ? filteredSales.length : (type === 'due' ? dueGivenTxs : receivedTxs).length)} টি এন্ট্রি</span>
          </div>
          <div className="text-sm sm:text-base text-[#b83a14] print:text-black">
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
        itemName="এই রেকর্ডটি মুছে ফেললে আপনার ব্যবসার মোট হিসাবে পরিবর্তন হবে।"
        onConfirm={handleDeleteConfirm}
        onClose={() => setItemToDelete(null)}
      />

      {/* Edit Tx Modal */}
      {itemToEdit && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h4 className="font-black text-gray-900 text-lg">এন্ট্রি সংশোধন করুন</h4>
              <button onClick={() => setItemToEdit(null)} className="p-1 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateTx} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">টাকার পরিমাণ (৳)</label>
                <input
                  type="number"
                  step="any"
                  autoFocus
                  value={itemToEdit.amount}
                  onChange={(e) => setItemToEdit({ ...itemToEdit, amount: e.target.value })}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl px-4 py-3 text-lg font-black text-[#b83a14] focus:outline-none focus:ring-2 focus:ring-[#b83a14] focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">নোট / বিবরণ</label>
                <input
                  type="text"
                  value={itemToEdit.note}
                  onChange={(e) => setItemToEdit({ ...itemToEdit, note: e.target.value })}
                  placeholder="বিবরণ লিখুন"
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#b83a14] focus:bg-white transition-all"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setItemToEdit(null)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3.5 rounded-2xl font-bold text-sm active:scale-95 transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 animate-gradient-terracotta text-white py-3.5 rounded-2xl font-black text-sm shadow-md active:scale-95 transition"
                >
                  সংরক্ষণ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
