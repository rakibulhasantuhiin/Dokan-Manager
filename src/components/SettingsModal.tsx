import React, { useState, useRef } from 'react';
import {
  X,
  Store,
  Download,
  Upload,
  RefreshCw,
  Smartphone,
  Check,
  Share2,
  HardDrive,
  Info,
  Cloud,
  CheckCircle2,
  LogOut,
  User as UserIcon,
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
    signInWithGoogle,
    logOut,
  } = useDokan();

  const { isInstallable, install, isInstalled, isIOS } = usePWAInstall();

  const [shopName, setShopName] = useState(settings.shopName);
  const [ownerName, setOwnerName] = useState(settings.ownerName);
  const [phone, setPhone] = useState(settings.phone);
  const [address, setAddress] = useState(settings.address);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

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

  const handleGoogleLogin = async () => {
    try {
      setIsSigningIn(true);
      setAuthError(null);
      await signInWithGoogle();
      setSaveNotice('গুগল ক্লাউড ডাটাবেজ সফলভাবে কানেক্ট হয়েছে!');
      setTimeout(() => setSaveNotice(null), 3000);
    } catch (err: any) {
      console.error(err);
      setAuthError(err?.message || 'লগইন করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleLogout = async () => {
    if (confirm('আপনি কি গুগল অ্যাকাউন্ট থেকে লগআউট করতে চান?')) {
      await logOut();
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="bg-white rounded-2xl w-full max-w-lg p-5 shadow-2xl max-h-[92vh] overflow-y-auto font-['SolaimanLipi',sans-serif]"
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-[#b83a14]" />
            <h3 className="font-bold text-gray-900 text-base">দোকান সেটিংস ও ব্যাকআপ</h3>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {saveNotice && (
          <div className="mt-3 p-2.5 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-200">
            {saveNotice}
          </div>
        )}

        {authError && (
          <div className="mt-3 p-2.5 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-200">
            {authError}
          </div>
        )}

        {/* 1. Google Cloud Database (Firebase) Permanent Backup Card */}
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50/60 border border-orange-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#b83a14] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-gray-900 text-sm">
                  আজীবন ক্লাউড ব্যাকআপ (Google Firebase)
                </div>
                <p className="text-xs text-gray-600 mt-0.5">
                  ফোন হারালেও বা নষ্ট হলেও এক ক্লিকে যেকোনো ডিভাইস থেকে আগের সব হিসাব ফিরিয়ে আনুন।
                </p>
                <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md inline-block">
                  🛡️ জিরো-কোটা ইঞ্জিন সক্রিয় (দৈনিক ফ্রি কোটার ১%-এরও কম খরচ হয়)
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-orange-200/80">
            {currentUser ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-3 rounded-xl border border-orange-100">
                <div className="flex items-center gap-2 min-w-0">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt="avatar"
                      className="w-8 h-8 rounded-full border border-gray-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                      {currentUser.displayName?.slice(0, 1) || 'G'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 text-xs font-bold text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>সংযুক্ত আছে</span>
                    </div>
                    <div className="text-xs text-gray-700 truncate font-medium">
                      {currentUser.email}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="self-end sm:self-auto flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-red-50 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>লগআউট</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={isSigningIn}
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl text-gray-800 text-xs sm:text-sm font-bold shadow-xs transition active:scale-[0.99]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isSigningIn ? 'লগইন হচ্ছে...' : 'Google দিয়ে লগইন ও ক্লাউড সিঙ্ক চালু করুন'}</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. PWA Install Section */}
        <div className="mt-4 p-4 rounded-xl bg-orange-50/70 border border-orange-200/80">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 font-bold text-gray-900 text-sm">
                <Smartphone className="w-4 h-4 text-[#b83a14]" />
                <span>অ্যাপ ইনস্টল করুন (PWA)</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                মোবাইল বা পিসিতে সরাসরি অ্যাপ হিসেবে ইনস্টল করুন। ইন্টারনেট ছাড়াও চলবে।
              </p>
            </div>

            {isInstalled ? (
              <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full shrink-0">
                ইনস্টল করা আছে
              </span>
            ) : isInstallable ? (
              <button
                onClick={install}
                className="flex items-center gap-1.5 bg-[#b83a14] hover:bg-[#a33210] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-2xs transition shrink-0 active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ইনস্টল</span>
              </button>
            ) : isIOS ? (
              <button
                onClick={() => setShowIOSGuide(true)}
                className="flex items-center gap-1 bg-[#b83a14] text-white text-xs font-bold px-2.5 py-1.5 rounded-lg shadow-2xs shrink-0"
              >
                iOS নির্দেশিকা
              </button>
            ) : (
              <span className="text-[11px] text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded-lg shrink-0">
                ব্রাউজার মেনু থেকে Install করুন
              </span>
            )}
          </div>

          {/* iOS Instructions Modal/Accordion */}
          {showIOSGuide && (
            <div className="mt-3 pt-3 border-t border-orange-200 text-xs text-gray-700 space-y-1.5 bg-white p-3 rounded-lg">
              <div className="font-bold text-gray-900">আইফোন / আইপ্যাডে ইনস্টল করার নিয়ম:</div>
              <p>১. সাফারি (Safari) ব্রাউজারের নিচের <strong>শেয়ার (Share) </strong> বাটনে চাপ দিন।</p>
              <p>২. নিচে স্ক্রল করে <strong>'Add to Home Screen' (হোম স্ক্রিনে যোগ করুন)</strong> নির্বাচন করুন।</p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-2 text-xs text-[#b83a14] font-bold hover:underline"
              >
                বন্ধ করুন
              </button>
            </div>
          )}
        </div>

        {/* 3. Shop Details Form */}
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
            className="w-full py-2.5 bg-[#b83a14] hover:bg-[#a33210] text-white rounded-xl font-bold text-sm shadow-xs transition"
          >
            দোকানের তথ্য সংরক্ষণ করুন
          </button>
        </form>

        {/* 4. Backup & Restore Section */}
        <div className="mt-6 pt-4 border-t border-gray-200 space-y-3">
          <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <HardDrive className="w-4 h-4 text-gray-600" />
            <span>অফলাইন ফাইল ব্যাকআপ ও রিস্টোর</span>
          </h4>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleExportBackup}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-800 rounded-xl font-bold text-xs transition"
            >
              <Download className="w-4 h-4" />
              <span>ফাইল ডাউনলোড</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-800 rounded-xl font-bold text-xs transition"
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

          {/* Reset sample data */}
          <div className="pt-2">
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
              className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>নমুনা ডেটা রিসেট করুন</span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
