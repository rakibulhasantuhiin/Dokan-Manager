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
  QrCode,
} from 'lucide-react';
import { Customer } from '../types';
import { useDokan } from '../context/DokanContext';
import { formatTaka, formatBengaliDate, toBengaliNumber } from '../utils/bengali';
import { DeletePinConfirmModal } from './DeletePinConfirmModal';
import { CustomerLedgerShareModal } from './CustomerLedgerShareModal';

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
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

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
    <div className="h-[calc(100dvh-7rem)] lg:h-auto flex flex-col space-y-2 pb-1 lg:pb-20 pt-1.5 sm:pt-3 overflow-hidden lg:overflow-visible">
      {/* Top Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 transition active:scale-95 shrink-0"
            aria-label="ফিরে যান"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
          </button>
          <div className="min-w-0">
            <h2 className="text-base sm:text-xl font-bold text-gray-800 tracking-tight truncate">
              {currentCust.name}
            </h2>
            {currentCust.phone && (
              <div className="text-[11px] text-gray-500">{toBengaliNumber(currentCust.phone)}</div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setIsQrModalOpen(true)}
            className="flex items-center gap-1 bg-orange-50 hover:bg-orange-100 border border-orange-200 py-1.5 px-2.5 rounded-lg font-bold text-xs text-[#b83a14] transition active:scale-95"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR কোড</span>
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-1.5 text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition active:scale-95"
            title="কাস্টমার সম্পাদনা"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsDeleteCustOpen(true)}
            className="p-1.5 text-red-600 hover:bg-red-50 bg-white border border-red-200 rounded-lg transition active:scale-95"
            title="তালিকা থেকে সরান"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {shareNotice && (
        <div className="p-2 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-semibold shrink-0">
          {shareNotice}
        </div>
      )}

      {/* Edit Customer Inline Form */}
      {isEditing && (
        <form onSubmit={handleSaveEdit} className="bg-white p-3 rounded-xl border border-gray-200 shadow-xs space-y-2 shrink-0">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="কাস্টমারের নাম"
              className="w-full bg-[#fbfaf8] border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#b83a14]"
            />
            <input
              type="tel"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              placeholder="মোবাইল নম্বর"
              className="w-full bg-[#fbfaf8] border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#b83a14]"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
              placeholder="ঠিকানা (গ্রাম / এলাকা)"
              className="flex-1 bg-[#fbfaf8] border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#b83a14]"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-[#b83a14] text-white rounded-lg font-bold text-xs"
            >
              সংরক্ষণ
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-2.5 py-1.5 bg-gray-100 text-gray-700 rounded-lg font-bold text-xs"
            >
              বাতিল
            </button>
          </div>
        </form>
      )}

      {/* Compact Terracotta Balance Banner */}
      <div className="relative overflow-hidden rounded-xl bg-[#b83a14] text-white p-3 sm:p-4 shadow-xs shrink-0">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="text-[11px] sm:text-xs text-white/90 font-medium">
              বর্তমান মোট বাকি
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {formatTaka(currentCust.currentDue)}
            </div>
          </div>

          <div className="text-right text-[11px] sm:text-xs text-white/90 space-y-0.5">
            <div>মোট বাকি দিয়েছি: <strong>{formatTaka(currentCust.totalGiven)}</strong></div>
            <div>মোট পেয়েছি: <strong>{formatTaka(currentCust.totalReceived)}</strong></div>
          </div>
        </div>
      </div>

      {/* Action Buttons Row (+ বাকি দিলাম, + টাকা পেলাম, মনে করান, শেয়ার) */}
      <div className="grid grid-cols-4 gap-1.5 shrink-0">
        <button
          onClick={() => onOpenDueModal(currentCust)}
          className="col-span-1 flex items-center justify-center gap-1 bg-[#b83a14] hover:bg-[#a33210] active:scale-95 text-white py-2 px-1.5 rounded-xl font-bold text-xs shadow-2xs transition"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
          <span className="truncate">বাকি দিলাম</span>
        </button>
        <button
          onClick={() => onOpenPaymentModal(currentCust)}
          className="col-span-1 flex items-center justify-center gap-1 bg-[#15803d] hover:bg-[#166534] active:scale-95 text-white py-2 px-1.5 rounded-xl font-bold text-xs shadow-2xs transition"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
          <span className="truncate">টাকা পেলাম</span>
        </button>
        <button
          onClick={handleSendReminder}
          className="col-span-1 flex items-center justify-center gap-1 bg-white hover:bg-gray-50 border border-gray-300 py-2 px-1.5 rounded-xl font-bold text-xs text-gray-700 shadow-2xs transition active:scale-95"
        >
          <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">মনে করান</span>
        </button>
        <button
          onClick={handleShareStatement}
          className="col-span-1 flex items-center justify-center gap-1 bg-white hover:bg-gray-50 border border-gray-300 py-2 px-1.5 rounded-xl font-bold text-xs text-gray-700 shadow-2xs transition active:scale-95"
        >
          <Share2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="truncate">শেয়ার</span>
        </button>
      </div>

      {/* Transactions Section ("লেনদেন") - Fills Remaining Viewport */}
      <div className="flex-1 min-h-0 bg-white rounded-xl border border-gray-200 shadow-2xs flex flex-col overflow-hidden">
        <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/60">
          <h3 className="font-bold text-gray-800 text-xs sm:text-sm">
            লেনদেনের ইতিহাস
          </h3>
          <span className="text-[11px] text-gray-500 font-medium">
            মোট লেনদেন: {toBengaliNumber(customerTxs.length)} টি
          </span>
        </div>

        <div className="flex-1 min-h-0 divide-y divide-gray-100 overflow-y-auto">
          {customerTxs.length > 0 ? (
            customerTxs.map((tx) => (
              <div
                key={tx.id}
                className="p-2.5 sm:p-3.5 flex items-center justify-between hover:bg-gray-50/60 transition"
              >
                <div className="min-w-0">
                  <div className="text-[11px] text-gray-500 font-medium">
                    {formatBengaliDate(tx.date)}
                  </div>
                  <div className="font-bold text-gray-800 text-xs sm:text-sm mt-0.5 truncate">
                    {tx.type === 'due' ? 'বাকি' : 'জমা / টাকা পেয়েছি'}
                    {tx.note && <span className="text-xs text-gray-500 font-normal ml-1.5">({tx.note})</span>}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div
                    className={`font-bold text-sm sm:text-base ${
                      tx.type === 'due' ? 'text-[#b83a14]' : 'text-emerald-600'
                    }`}
                  >
                    {tx.type === 'due' ? '+' : '-'}{formatTaka(tx.amount)}
                  </div>
                  <button
                    onClick={() => setTxToDelete({ id: tx.id, amount: tx.amount })}
                    className="text-[11px] text-gray-400 hover:text-red-600 transition font-medium"
                  >
                    বাতিল করুন
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-400 text-xs sm:text-sm">
              এখনও কোনো লেনদেন লিপিবদ্ধ করা হয়নি।
            </div>
          )}
        </div>
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

      {/* Customer Public Ledger QR Code & Share Link Modal */}
      <CustomerLedgerShareModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        customer={currentCust}
        transactions={transactions}
        settings={settings}
      />
    </div>
  );
};
