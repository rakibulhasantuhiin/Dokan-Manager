import React, { useState } from 'react';
import { AlertTriangle, Lock, Trash2, X, ShieldAlert } from 'lucide-react';
import { useDokan } from '../context/DokanContext';

interface DeletePinConfirmModalProps {
  isOpen: boolean;
  title: string;
  itemName?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const DeletePinConfirmModal: React.FC<DeletePinConfirmModalProps> = ({
  isOpen,
  title,
  itemName,
  onConfirm,
  onClose,
}) => {
  const { currentUser } = useDokan();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const inputPin = pin.trim();
    const userPin = currentUser?.uid?.replace('pin_vault_', '') || '';
    
    // Master PIN '7078' always works, or the specific user PIN
    if (inputPin === '7078' || (userPin && inputPin === userPin)) {
      setError('');
      onConfirm();
      onClose();
      setPin('');
    } else {
      setError('❌ ভুল পিন কোড! সঠিক নিরাপত্তা পিন (৭০৭৮) প্রবেশ করুন।');
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 sm:p-8 shadow-2xl border border-red-100 animate-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5 text-red-600 font-black text-base sm:text-lg">
            <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
            <span>{title}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="mt-5 p-4 rounded-2xl bg-red-50 border-2 border-red-100 flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-red-900 leading-snug font-bold">
            {itemName && (
              <span className="block font-black text-red-700 mb-1">
                "{itemName}"
              </span>
            )}
            এটি ডিলিট করলে পরবর্তীতে আর কখনো ফেরত পাওয়া যাবে না! আপনি কি নিশ্চিত?
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-100 text-red-700 text-xs font-black border-2 border-red-200 animate-pulse">
            {error}
          </div>
        )}

        {/* Form requiring security PIN */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-[11px] font-black text-gray-500 mb-2 flex items-center gap-1.5 uppercase tracking-widest">
              <Lock className="w-4 h-4 text-gray-400" />
              <span>নিরাপত্তা পিন কোড দিন:</span>
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={12}
              autoFocus
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                if (error) setError('');
              }}
              placeholder="••••"
              className="w-full bg-[#fbfaf8] border-2 border-gray-300 rounded-2xl px-4 py-3.5 text-center text-2xl font-black tracking-[0.5em] text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-600 focus:bg-white transition-all shadow-inner"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-3.5 px-4 rounded-2xl border-2 border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold text-sm transition active:scale-95 shadow-sm"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="py-3.5 px-4 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>মুছে ফেলুন</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
