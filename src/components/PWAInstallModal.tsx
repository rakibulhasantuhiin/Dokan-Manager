import React from 'react';
import { Download, X, Smartphone, Share2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, install, isInstalled, isIOS } = usePWAInstall();

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (isInstallable) {
      const res = await install();
      if (res) {
        onClose();
      }
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-black/60 backdrop-blur-xs font-['SolaimanLipi',sans-serif]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 16 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl border border-gray-100 text-gray-900 relative"
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 rounded-lg transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header icon & branding */}
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-3">
              <img
                src="/pwa-192x192.png"
                alt="দোকান ম্যানেজার"
                className="w-16 h-16 rounded-2xl shadow-md border-2 border-white object-cover"
              />
              <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full text-xs shadow-xs">
                ✓
              </span>
            </div>

            <h3 className="font-bold text-gray-900 text-lg leading-tight">
              দোকান ম্যানেজার অ্যাপ ইনস্টল করুন
            </h3>
            <p className="text-xs text-gray-600 mt-1">
              ফোনের বা পিসির হোম স্ক্রিনে যোগ করে আসল অ্যাপের মতো দ্রুত ব্যবহার করুন।
            </p>
          </div>

          {/* Action Area */}
          <div className="mt-4 space-y-3">
            {isInstalled ? (
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>অ্যাপটি ইতিমধ্যে ইনস্টল করা আছে!</span>
                </div>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  হোম স্ক্রিন থেকে সরাসরি খুলতে পারবেন।
                </p>
              </div>
            ) : isInstallable ? (
              <button
                type="button"
                onClick={handleInstallClick}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#b83a14] hover:bg-[#a33210] text-white text-sm font-bold rounded-xl shadow-md transition active:scale-[0.98] cursor-pointer"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>এক-ক্লিকে ইনস্টল করুন (Add to Home)</span>
              </button>
            ) : (
              <div className="space-y-2.5">
                {isIOS ? (
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs space-y-1 text-gray-800">
                    <div className="font-bold text-amber-900 flex items-center gap-1">
                      <Share2 className="w-3.5 h-3.5 text-amber-700" />
                      <span>iPhone / iPad এ যোগ করার নিয়ম:</span>
                    </div>
                    <p>১. নিচে সাফারি (Safari)-র <strong>শেয়ার (Share)</strong> বাটনে চাপ দিন।</p>
                    <p>২. অপশনগুলো নামিয়ে <strong>'Add to Home Screen'</strong> চাপুন।</p>
                  </div>
                ) : (
                  <div className="bg-orange-50 border border-orange-200 p-3 rounded-xl text-xs space-y-1.5 text-gray-800">
                    <div className="font-bold text-[#b83a14] flex items-center gap-1">
                      <Smartphone className="w-4 h-4" />
                      <span>ব্রাউজার থেকে ইনস্টল করার নিয়ম:</span>
                    </div>
                    <p>১. ব্রাউজারের উপরে ডান পাশে থাকা <strong>থ্রি-ডট (⋮)</strong> বাটনে ক্লিক করুন।</p>
                    <p>২. তালিকা থেকে <strong>'Install App'</strong> বা <strong>'Add to Home screen'</strong> বেছে নিন।</p>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
            >
              এখন নয়
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
