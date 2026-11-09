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
  Lock,
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
    signInWithEmail,
    signUpWithEmail,
    updatePassword,
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

  // Email/password login fallback state
  const [showEmailAuth, setShowEmailAuth] = useState(false);
  const [emailMode, setEmailMode] = useState<'login' | 'signup'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');

  const [showInstallHelp, setShowInstallHelp] = useState(false);

  // Password update state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passNotice, setPassNotice] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);

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
      if (err?.code === 'auth/popup-blocked') {
        setShowEmailAuth(true);
        setAuthError('ব্রাউজারে পপ-আপ ব্লক করা আছে। আপনি কোনো পপ-আপ ছাড়াই নিচের ইমেইল/পাসওয়ার্ড দিয়ে সরাসরি লগইন করতে পারেন:');
      } else {
        setAuthError(err?.message || 'লগইন করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      setAuthError('ইমেইল ও পাসওয়ার্ড দিন');
      return;
    }
    try {
      setIsSigningIn(true);
      setAuthError(null);
      if (emailMode === 'signup') {
        await signUpWithEmail(authEmail.trim(), authPassword, authName.trim());
      } else {
        await signInWithEmail(authEmail.trim(), authPassword);
      }
      setSaveNotice('ক্লাউড সিঙ্ক সফলভাবে চালু হয়েছে!');
      setShowEmailAuth(false);
      setTimeout(() => setSaveNotice(null), 3000);
    } catch (err: any) {
      console.error(err);
      setAuthError(err?.message || 'ইমেইল বা পাসওয়ার্ড সঠিক নয়।');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleLogout = async () => {
    if (confirm('আপনি কি অ্যাকাউন্ট থেকে লগআউট করতে চান?')) {
      await logOut();
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassNotice(null);
    setPassError(null);

    if (!newPassword || newPassword.length < 6) {
      setPassError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না।');
      return;
    }

    try {
      setIsUpdatingPass(true);
      await updatePassword(newPassword);
      setPassNotice('পাসওয়ার্ড সফলভাবে সেট ও আপডেট হয়েছে! এখন থেকে এই পাসওয়ার্ড দিয়ে লগইন করতে পারবেন।');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPassNotice(null), 4000);
    } catch (err: any) {
      console.error(err);
      if (err?.code === 'auth/requires-recent-login') {
        setPassError('নিরাপত্তার জন্য পুনরায় লগইন করে তারপর পাসওয়ার্ড পরিবর্তন করুন।');
      } else {
        setPassError(err?.message || 'পাসওয়ার্ড আপডেট করতে সমস্যা হয়েছে।');
      }
    } finally {
      setIsUpdatingPass(false);
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
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs overflow-y-auto"
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
              <div className="space-y-2.5">
                <button
                  type="button"
                  disabled={isSigningIn}
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl text-gray-800 text-xs sm:text-sm font-bold shadow-xs transition active:scale-[0.99] cursor-pointer"
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

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowEmailAuth(!showEmailAuth)}
                    className="text-[11px] text-[#b83a14] hover:underline font-semibold"
                  >
                    {showEmailAuth ? 'পপ-আপ ছাড়া ইমেইল ফর্ম লুকান' : 'পপ-আপ সমস্যা? ইমেইল ও পাসওয়ার্ড দিয়ে লগইন করুন'}
                  </button>
                </div>

                {showEmailAuth && (
                  <form onSubmit={handleEmailAuthSubmit} className="bg-white p-3 rounded-xl border border-orange-200 space-y-2 mt-2">
                    <div className="flex bg-gray-100 p-0.5 rounded-lg text-xs font-bold mb-2">
                      <button
                        type="button"
                        onClick={() => setEmailMode('login')}
                        className={`flex-1 py-1 rounded-md transition ${emailMode === 'login' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500'}`}
                      >
                        লগইন
                      </button>
                      <button
                        type="button"
                        onClick={() => setEmailMode('signup')}
                        className={`flex-1 py-1 rounded-md transition ${emailMode === 'signup' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500'}`}
                      >
                        নতুন একাউন্ট
                      </button>
                    </div>

                    {emailMode === 'signup' && (
                      <input
                        type="text"
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        placeholder="আপনার নাম"
                        className="w-full bg-[#fbfaf8] border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#b83a14]"
                      />
                    )}

                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="ইমেইল ঠিকানা (যেমন: user@gmail.com)"
                      className="w-full bg-[#fbfaf8] border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#b83a14]"
                    />

                    <input
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)"
                      className="w-full bg-[#fbfaf8] border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#b83a14]"
                    />

                    <button
                      type="submit"
                      disabled={isSigningIn}
                      className="w-full py-2 bg-[#b83a14] hover:bg-[#a33210] text-white text-xs font-bold rounded-lg transition"
                    >
                      {isSigningIn ? 'প্রসেসিং হচ্ছে...' : (emailMode === 'signup' ? 'একাউন্ট তৈরি ও সিঙ্ক চালু' : 'লগইন ও সিঙ্ক চালু')}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 2. PWA Install Section */}
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50/70 border border-orange-200">
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

          <div className="mt-3 pt-3 border-t border-orange-200/80 flex flex-wrap items-center justify-between gap-2">
            {isInstalled ? (
              <div className="w-full bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg flex items-center gap-2 text-xs text-emerald-800 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>দোকান ম্যানেজার অ্যাপটি আপনার ডিভাইসে ইন্সটল করা আছে!</span>
              </div>
            ) : (
              <>
                {isInstallable ? (
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await install();
                      if (!res) setShowInstallHelp(true);
                    }}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#b83a14] hover:bg-[#a33210] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>এক-ক্লিকে অ্যাপ ইনস্টল করুন (Add to Home)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowInstallHelp(!showInstallHelp)}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-[#b83a14] hover:bg-[#a33210] text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>{showInstallHelp ? 'ইনস্টল নির্দেশিকা লুকান' : 'ব্রাউজার থেকে ইনস্টল করার নিয়ম'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowInstallHelp(!showInstallHelp)}
                  className="text-xs text-[#b83a14] font-bold hover:underline flex items-center gap-1 ml-auto"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>{showInstallHelp ? 'সংক্ষিপ্ত করুন' : 'বিস্তারিত নির্দেশিকা'}</span>
                </button>
              </>
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

        {/* 3.5 Set Login Password Section */}
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50/50 border border-orange-200">
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#b83a14] text-white flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">লগইন পাসওয়ার্ড সেট বা পরিবর্তন করুন</h4>
              <p className="text-[11px] text-gray-600">
                আপনার ইমেইল ({currentUser?.email || 'tawakkulcorners@gmail.com'}) এর জন্য নতুন পাসওয়ার্ড সেট করুন।
              </p>
            </div>
          </div>

          {passNotice && (
            <div className="mb-2.5 p-2 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-200">
              {passNotice}
            </div>
          )}

          {passError && (
            <div className="mb-2.5 p-2 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-200">
              {passError}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-2.5">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="নতুন পাসওয়ার্ড দিন"
                className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#b83a14]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">কনফার্ম নতুন পাসওয়ার্ড</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="আবার পাসওয়ার্ডটি লিখুন"
                className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#b83a14]"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingPass}
              className="w-full py-2.5 bg-[#b83a14] hover:bg-[#a33210] disabled:opacity-60 text-white rounded-xl font-bold text-xs shadow-xs transition cursor-pointer"
            >
              {isUpdatingPass ? 'সংরক্ষণ হচ্ছে...' : 'পাসওয়ার্ড সংরক্ষণ করুন'}
            </button>
          </form>
        </div>

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
