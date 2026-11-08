import React, { useState } from 'react';
import { AlertTriangle, Lock, Trash2, X, ShieldAlert } from 'lucide-react';

interface DeletePinConfirmModalProps {
  isOpen: boolean;
  title: string;
  itemName?: string;
  onConfirm: () => void;
  onClose: () => void;
}

const REQUIRED_PIN = '7078';

export const DeletePinConfirmModal: React.FC<DeletePinConfirmModalProps> = ({
  isOpen,
  title,
  itemName,
  onConfirm,
  onClose,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim() !== REQUIRED_PIN) {
      setError('❌ ভুল পিন কোড! সঠিক ৪ ডিজিট পিন কোড (7078) প্রবেশ করুন।');
      return;
    }

    setError('');
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 sm:p-6 shadow-2xl border border-red-100 transition-all transform duration-200">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2 text-red-600 font-bold text-base">
            <ShieldAlert className="w-5 h-5 stroke-[2.2]" />
            <span>{title}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="mt-3.5 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-xs text-red-800 leading-relaxed font-semibold">
            {itemName && (
              <span className="block font-bold text-red-900 mb-0.5">
                "{itemName}"
              </span>
            )}
            এটি ডিলিট করলে পরবর্তীতে আর কখনো ফেরত পাওয়া যাবে না!
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-2.5 p-2 rounded-lg bg-red-100 text-red-700 text-xs font-bold border border-red-300">
            {error}
          </div>
        )}

        {/* Form requiring 7078 PIN */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-gray-500" />
              <span>ডিলিট নিশ্চিত করতে পিন কোড দিন:</span>
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              autoFocus
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                if (error) setError('');
              }}
              placeholder="৪ ডিজিট পিন লিখুন"
              className="w-full bg-[#fbfaf8] border border-gray-300 rounded-xl px-3.5 py-2.5 text-center text-lg font-mono tracking-widest font-bold focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white"
            />
            <span className="text-[11px] text-gray-400 block text-center mt-1">
              (সিকিউরিটি পিন: 7078)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-3 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs sm:text-sm transition"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-xs transition flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>ডিলিট করুন</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
