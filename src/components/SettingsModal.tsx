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
  const [showInstallHelp, setShowInstallHelp] = useState(false);

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
                onClick={async () => {
                  const res = await install();
                  if (!res) {
                    setShowInstallHelp(true);
                  }
                }}
                className="w-full flex items-center justify-center gap-2 animate-gradient-terracotta text-white text-xs sm:text-sm font-extrabold px-4 py-3 rounded-xl shadow-md transition active:scale-95 cursor-pointer"
              >
                <Download className="w-5 h-5" />
                <span>সরাসরি অ্যাপ ইনস্টল করুন (Install Now)</span>
              </button>
            )}
          </div>

          {/* Interactive PWA Installation Instructions */}
          {showInstallHelp && !isInstalled && (
            <div className="mt-3 pt-3 border-t border-orange-200 text-xs text-gray-800 space-y-2.5 bg-white p-3.5 rounded-xl border border-orange-100 shadow-2xs">
              <div className="font-bold text-gray-900 text-sm flex items-center gap-1.5 text-[#b83a14]">
                <span>📱 ব্রাউজার থেকে অ্যাপ ইনস্টল করার সহজ উপায়</span>
              </div>

              {isIOS ? (
                <div className="space-y-1.5 bg-amber-50/80 p-2.5 rounded-lg border border-amber-200 text-xs">
                  <div className="font-bold text-amber-900">আইফোন / আইপ্যাডে (iOS Safari):</div>
                  <p>১. সাফারি (Safari) ব্রাউজারের নিচের <strong>শেয়ার (Share <Share2 className="w-3 h-3 inline" />)</strong> আইকনে চাপ দিন।</p>
                  <p>২. অপশনগুলো নিচে নামিয়ে <strong>'Add to Home Screen' (হোম স্ক্রিনে যোগ করুন)</strong> চাপুন।</p>
                  <p>৩. উপরে ডান কোণায় <strong>'Add'</strong> এ চাপ দিলে ফোনের হোম স্ক্রিনে সুন্দর লোগো সহ অ্যাপ চলে আসবে!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="bg-orange-50/80 p-2.5 rounded-lg border border-orange-200 text-xs">
                    <div className="font-bold text-gray-900 mb-1">Android / Chrome / Edge ব্রাউজার নির্দেশিকা:</div>
                    <ol className="list-decimal list-inside space-y-1 text-gray-700">
                      <li>ব্রাউজারের উপরে ডান কোণায় <strong>থ্রি-ডট (⋮)</strong> মেনু বাটনে ক্লিক করুন।</li>
                      <li>তালিকা থেকে <strong>'Install App' (অ্যাপ ইনস্টল করুন)</strong> অথবা <strong>'Add to Home Screen' (হোম স্ক্রিনে যোগ করুন)</strong> নির্বাচন করুন।</li>
                      <li><strong>'Install'</strong> বা <strong>'Add'</strong> বাটনে চাপ দিলেই কয়েক সেকেন্ডে আপনার ফোনের হোম স্ক্রিনে আসল অ্যাপের মতো আইকন যুক্ত হয়ে যাবে!</li>
                    </ol>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] text-gray-600">
                    💡 <strong>কম্পিউটার (Windows / Mac) ব্যবহারকারীদের জন্য:</strong> ক্রোম বা এজ ব্রাউজারের উপরে এড্রেস বারের (URL Bar) ডান পাশে থাকা <strong>ইনস্টল (⊕)</strong> বাটনে ক্লিক করে ল্যাপটপ/পিসিতেও ইনস্টল করতে পারবেন।
                  </div>
                </div>
              )}
            </div>
          )}
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

        {/* 3. Backup & Restore Section */}
        <div className="mt-6 pt-4 border-t border-gray-200 space-y-3">
          <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <HardDrive className="w-4 h-4 text-gray-600" />
            <span>অফলাইন ফাইল ব্যাকআপ ও রিস্টোর</span>
          </h4>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleExportBackup}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-800 rounded-xl font-bold text-xs transition active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>ফাইল ডাউনলোড</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-800 rounded-xl font-bold text-xs transition active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>ফাইল রিস্টোর</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportFile}
              accept=".json"
              className="hidden"
            />
          </div>

          {/* Reset sample data & PIN Lock */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => {
                if (
                  confirm(
                    'আপনি কি নিশ্চিত যে নমুনা ডেটা দিয়ে অ্যাপ রিসেট করতে চান? আপনার বর্তমান পরিবর্তন মুছে যাবে।'
                  )
                ) {
                  resetAllData();
                  onClose();
                }
              }}
              className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>নমুনা ডেটা রিসেট করুন</span>
            </button>

            {currentUser && (
              <button
                type="button"
                onClick={handleLogout}
                className="py-2 px-4 bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-700 border border-gray-300 hover:border-red-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>পিন লক / প্রস্থান</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
