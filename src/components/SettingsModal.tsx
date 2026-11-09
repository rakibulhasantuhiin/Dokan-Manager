import React, { useState, useRef } from 'react';
import {
  X,
  Store,
  Download,
  Upload,
  RefreshCw,
  Smartphone,
  Share2,
  HardDrive,
  CheckCircle2,
  LogOut,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useDokan } from '../context/DokanContext';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const {
    settings,
    updateSettings,
    exportDataJSON,
    importDataJSON,
    resetAllData,
    currentUser,
    logOut,
  } = useDokan();

  const { install, isInstalled, isIOS } = usePWAInstall();

  const [shopName, setShopName] = useState(settings.shopName);
  const [ownerName, setOwnerName] = useState(settings.ownerName);
  const [phone, setPhone] = useState(settings.phone);
  const [address, setAddress] = useState(settings.address);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      shopName: shopName.trim() || 'TAWAKKUL CORNER',
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      address: address.trim(),
    });
    setSaveNotice('দোকানের তথ্য সফলভাবে সংরক্ষিত হয়েছে!');
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const handleLogout = async () => {
    if (confirm('আপনি কি পিন লক করে লগআউট করতে চান?')) {
      await logOut();
      onClose();
    }
  };

  const handleExportBackup = () => {
    const jsonStr = exportDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dokan-manager-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importDataJSON(content);
      if (success) {
        alert('ডেটা সফলভাবে রিস্টোর হয়েছে!');
        onClose();
      } else {
        alert('ফাইলটি সঠিক ব্যাকআপ ফাইল নয়। অনুগ্রহ করে সঠিক JSON ফাইল নির্বাচন করুন।');
      }
    };
    reader.readAsText(file);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }}
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ type: 'spring', damping: 32, stiffness: 550 }}
        className="bg-white rounded-2xl w-full max-w-lg p-5 shadow-2xl max-h-[92vh] overflow-y-auto font-['SolaimanLipi',sans-serif]"
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-[#b83a14]" />
            <h3 className="font-bold text-gray-900 text-base">দোকান সেটিংস ও ব্যাকআপ</h3>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {saveNotice && (
          <div className="mt-3 p-2.5 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-200">
            {saveNotice}
          </div>
        )}

        {/* 1. PWA Install Section */}
        <div className="mt-4 p-4 rounded-xl animate-soft-amber border border-orange-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <img
                src="/pwa-192x192.png"
                alt="দোকান ম্যানেজার"
                className="w-11 h-11 rounded-xl shadow-xs border border-orange-200/80 shrink-0 bg-white p-0.5 object-cover"
              />
              <div>
                <div className="flex items-center gap-1.5 font-bold text-gray-900 text-sm">
                  <Smartphone className="w-4 h-4 text-[#b83a14]" />
                  <span>মোবাইল ও পিসিতে অ্যাপ ইনস্টল করুন</span>
                </div>
                <p className="text-xs text-gray-600 mt-0.5">
                  হোম স্ক্রিনে আইকন যুক্ত করে আসল অ্যাপের মতো ব্যবহার করুন। ইন্টারনেট ছাড়াই চলবে!
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-orange-200/80 flex items-center justify-between gap-2">
            {isInstalled ? (
              <div className="w-full bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg flex items-center gap-2 text-xs text-emerald-800 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>দোকান ম্যানেজার অ্যাপটি আপনার ডিভাইসে ইনস্টল করা আছে!</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => install()}
                className="w-full flex items-center justify-center gap-2 animate-gradient-terracotta text-white text-xs sm:text-sm font-extrabold px-4 py-3 rounded-xl shadow-md transition active:scale-95 cursor-pointer"
              >
                <Download className="w-5 h-5" />
                <span>সরাসরি অ্যাপ ইনস্টল করুন (Install Now)</span>
              </button>
            )}
          </div>


        </div>

        {/* 2. Shop Details Form */}
        <form onSubmit={handleSaveProfile} className="mt-4 space-y-3 text-sm">
          <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider">
            দোকানের পরিচিতি
          </h4>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              দোকানের নাম
            </label>
            <input
              type="text"
              required
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="TAWAKKUL CORNER"
              className="w-full bg-[#fbfaf8] border border-gray-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#b83a14]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              প্রোপাইটর / মালিকের নাম
            </label>
            <input
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="মালিকের নাম"
              className="w-full bg-[#fbfaf8] border border-gray-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#b83a14]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              দোকানের মোবাইল নম্বর
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01700-000000"
              className="w-full bg-[#fbfaf8] border border-gray-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#b83a14]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              দোকানের ঠিকানা
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="বাজার রোড, ঢাকা"
              className="w-full bg-[#fbfaf8] border border-gray-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#b83a14]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 animate-gradient-terracotta text-white rounded-xl font-bold text-sm shadow-xs transition active:scale-[0.99] cursor-pointer"
          >
            দোকানের তথ্য সংরক্ষণ করুন
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-200">
            {currentUser && (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-3.5 bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-700 border border-gray-300 hover:border-red-200 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <LogOut className="w-4 h-4" />
                <span>পিন লক / প্রস্থান করুন</span>
              </button>
            )}
          </div>
      </motion.div>
    </motion.div>
  );
};
