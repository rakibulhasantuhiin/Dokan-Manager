import React, { useState } from 'react';
import {
  ArrowLeft,
  Edit2,
  Plus,
  MessageCircle,
  Share2,
  Trash2,
  CheckCircle,
  Phone,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { Customer } from '../types';
import { useDokan } from '../context/DokanContext';
import { formatTaka, formatBengaliDate, toBengaliNumber } from '../utils/bengali';
import { DeletePinConfirmModal } from './DeletePinConfirmModal';

interface CustomerDetailViewProps {
  customer: Customer;
  onBack: () => void;
  onOpenDueModal: (customer: Customer) => void;
  onOpenPaymentModal: (customer: Customer) => void;
}

export const CustomerDetailView: React.FC<CustomerDetailViewProps> = ({
  customer,
  onBack,
  onOpenDueModal,
  onOpenPaymentModal,
}) => {
  const {
    settings,
    customers,
    transactions,
    deleteTransaction,
    deleteCustomer,
    updateCustomer,
  } = useDokan();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(customer.name);
  const [editPhone, setEditPhone] = useState(customer.phone || '');
  const [editAddress, setEditAddress] = useState(customer.address || '');
  const [shareNotice, setShareNotice] = useState<string | null>(null);
  const [isDeleteCustOpen, setIsDeleteCustOpen] = useState(false);
  const [txToDelete, setTxToDelete] = useState<{ id: string; amount: number } | null>(null);

  // Find latest customer instance from state
  const currentCust = customers.find((c) => c.id === customer.id) || customer;

  // Filter transactions for this customer
  const customerTxs = transactions.filter((t) => t.customerId === currentCust.id);

  // Save customer edits
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    updateCustomer(currentCust.id, {
      name: editName.trim(),
      phone: editPhone.trim() || undefined,
      address: editAddress.trim() || undefined,
    });
    setIsEditing(false);
  };

  // WhatsApp reminder message
  const handleSendReminder = () => {
    const text = `সম্মানিত ${currentCust.name}, ${settings.shopName || 'আমাদের দোকানে'} আপনার বর্তমান বাকি ${formatTaka(currentCust.currentDue)}। অনুগ্রহ করে তা পরিশোধ করুন। ধন্যবাদ।`;
    
    // Check if phone number is present
    if (currentCust.phone) {
      const cleanPhone = currentCust.phone.replace(/[^0-9]/g, '');
      const internationalPhone = cleanPhone.startsWith('0')
        ? '88' + cleanPhone
        : cleanPhone;
      window.open(`https://wa.me/${internationalPhone}?text=${encodeURIComponent(text)}`, '_blank');
    } else {
      // Copy to clipboard
      navigator.clipboard.writeText(text);
      setShareNotice('মেসেজটি কপি করা হয়েছে! WhatsApp বা SMS এ পাঠিয়ে দিন।');
      setTimeout(() => setShareNotice(null), 3500);
    }
  };

  // Share statement
  const handleShareStatement = () => {
    const lines = [
      `দোকান: ${settings.shopName || 'তাওয়াক্কুল কর্নার'}`,
      `কাস্টমার: ${currentCust.name}`,
      `তারিখ: ${formatBengaliDate(new Date())}`,
      `-----------------------`,
      `মোট বাকি দিয়েছি: ${formatTaka(currentCust.totalGiven)}`,
      `মোট টাকা পেয়েছি: ${formatTaka(currentCust.totalReceived)}`,
      `বর্তমান মোট বাকি: ${formatTaka(currentCust.currentDue)}`,
    ];
    const text = lines.join('\n');

    if (navigator.share) {
      navigator.share({
        title: `${currentCust.name} এর বাকির হিসাব`,
        text,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      setShareNotice('হিসাবের বিবরণ কপি হয়েছে!');
      setTimeout(() => setShareNotice(null), 3000);
    }
  };

  return (
    <div className="space-y-4 pb-24 pt-3">
      {/* Top Header matching image_4c9a67c2.png */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 transition active:scale-95"
            aria-label="ফিরে যান"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h2 className="text-xl font-bold text-gray-800 tracking-tight">
            {currentCust.name}
          </h2>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="p-2 text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition active:scale-95"
          title="কাস্টমার সম্পাদনা"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      </div>

      {shareNotice && (
        <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-semibold">
          {shareNotice}
        </div>
      )}

      {/* Edit Customer Inline Form */}
      {isEditing && (
        <form onSubmit={handleSaveEdit} className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-3">
          <h4 className="font-bold text-sm text-gray-800">কাস্টমার তথ্য পরিবর্তন</h4>
          <input
            type="text"
            required
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="কাস্টমারের নাম"
            className="w-full bg-[#fbfaf8] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#b83a14]"
          />
          <input
            type="tel"
            value={editPhone}
            onChange={(e) => setEditPhone(e.target.value)}
            placeholder="মোবাইল নম্বর"
            className="w-full bg-[#fbfaf8] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#b83a14]"
          />
          <input
            type="text"
            value={editAddress}
            onChange={(e) => setEditAddress(e.target.value)}
            placeholder="ঠিকানা (গ্রাম / এলাকা)"
            className="w-full bg-[#fbfaf8] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#b83a14]"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2 bg-[#b83a14] text-white rounded-lg font-bold text-xs"
            >
              সংরক্ষণ
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="py-2 px-4 bg-gray-100 text-gray-700 rounded-lg font-bold text-xs"
            >
              বাতিল
            </button>
          </div>
        </form>
      )}

      {/* Terracotta Balance Banner matching image_4c9a67c2.png */}
      <div className="relative overflow-hidden rounded-xl bg-[#b83a14] text-white p-5 shadow-sm">
        {/* Subtle decorative watermark circle */}
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute right-6 bottom-2 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />

        <div className="relative z-10">
          <div className="text-xs sm:text-sm text-white/90 font-medium">
            এখন বাকি
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold tracking-tight my-1 text-white">
            {formatTaka(currentCust.currentDue)}
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm text-white/90 pt-2 border-t border-white/20 mt-2">
            <span>মোট বাকি দিয়েছি: {formatTaka(currentCust.totalGiven)}</span>
            <span>মোট পেয়েছি: {formatTaka(currentCust.totalReceived)}</span>
          </div>
        </div>
      </div>

      {/* Primary Action Buttons (+ বাকি দিলাম, + টাকা পেলাম) */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={() => onOpenDueModal(currentCust)}
          className="flex items-center justify-center gap-1.5 bg-[#b83a14] hover:bg-[#a33210] active:scale-[0.99] text-white py-3 px-3 rounded-xl font-bold text-sm sm:text-base shadow-xs transition"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>বাকি দিলাম</span>
        </button>
        <button
          onClick={() => onOpenPaymentModal(currentCust)}
          className="flex items-center justify-center gap-1.5 bg-[#15803d] hover:bg-[#166534] active:scale-[0.99] text-white py-3 px-3 rounded-xl font-bold text-sm sm:text-base shadow-xs transition"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>টাকা পেলাম</span>
        </button>
      </div>

      {/* Secondary Action Buttons Row (মনে করান, হিসাব শেয়ার) */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={handleSendReminder}
          className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border border-gray-300 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm text-gray-700 shadow-2xs transition active:scale-[0.99]"
        >
          <MessageCircle className="w-4 h-4 text-emerald-600" />
          <span>মনে করান</span>
        </button>
        <button
          onClick={handleShareStatement}
          className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border border-gray-300 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm text-gray-700 shadow-2xs transition active:scale-[0.99]"
        >
          <Share2 className="w-4 h-4 text-blue-600" />
          <span>হিসাব শেয়ার</span>
        </button>
      </div>

      {/* Transactions Section ("লেনদেন") */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-3.5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-800 text-sm sm:text-base">
            লেনদেন
          </h3>
          <span className="text-xs text-gray-500 font-medium">
            মোট লেনদেন: {toBengaliNumber(customerTxs.length)}
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {customerTxs.length > 0 ? (
            customerTxs.map((tx) => (
              <div
                key={tx.id}
                className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-gray-50/60 transition"
              >
                <div>
                  <div className="text-xs text-gray-500 font-medium">
                    {formatBengaliDate(tx.date)}
                  </div>
                  <div className="font-semibold text-gray-800 text-sm mt-0.5">
                    {tx.type === 'due' ? 'বাকি' : 'জমা / টাকা পেয়েছি'}
                    {tx.note && <span className="text-xs text-gray-500 font-normal ml-1.5">({tx.note})</span>}
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`font-bold text-base ${
                      tx.type === 'due' ? 'text-[#b83a14]' : 'text-emerald-600'
                    }`}
                  >
                    {tx.type === 'due' ? '+' : '-'}{formatTaka(tx.amount)}
                  </div>
                  <button
                    onClick={() => setTxToDelete({ id: tx.id, amount: tx.amount })}
                    className="text-xs text-gray-400 hover:text-red-600 transition font-medium mt-0.5"
                  >
                    বাতিল করুন
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-400 text-sm">
              এখনও কোনো লেনদেন লিপিবদ্ধ করা হয়নি।
            </div>
          )}
        </div>
      </div>

      {/* Remove Customer Button matching image_4c9a67c2.png */}
      <div className="pt-2">
        <button
          onClick={() => setIsDeleteCustOpen(true)}
          className="flex items-center justify-center gap-1.5 bg-[#fee2e2]/60 hover:bg-[#fecaca] text-[#b83a14] text-xs font-semibold py-2 px-3 rounded-lg transition border border-red-200"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>তালিকা থেকে সরান</span>
        </button>
      </div>

      {/* Delete Customer Confirmation PIN Modal */}
      <DeletePinConfirmModal
        isOpen={isDeleteCustOpen}
        title="কাস্টমার মুছে ফেলা"
        itemName={currentCust.name}
        onConfirm={() => {
          deleteCustomer(currentCust.id);
          setIsDeleteCustOpen(false);
          onBack();
        }}
        onClose={() => setIsDeleteCustOpen(false)}
      />

      {/* Delete Transaction Confirmation PIN Modal */}
      <DeletePinConfirmModal
        isOpen={!!txToDelete}
        title="লেনদেন বাতিল করা"
        itemName={txToDelete ? `${formatTaka(txToDelete.amount)} টাকার লেনদেন` : undefined}
        onConfirm={() => {
          if (txToDelete) {
            deleteTransaction(txToDelete.id);
            setTxToDelete(null);
          }
        }}
        onClose={() => setTxToDelete(null)}
      />
    </div>
  );
};
