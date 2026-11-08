import React, { useState } from 'react';
import {
  Store,
  ShieldCheck,
  Cloud,
  ShoppingCart,
  BookOpen,
  Monitor,
  CheckCircle2,
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  Sparkles,
  Smartphone,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useDokan } from '../context/DokanContext';

interface WelcomeAuthLandingProps {
  onContinueAsGuest: () => void;
}

export const WelcomeAuthLanding: React.FC<WelcomeAuthLandingProps> = ({ onContinueAsGuest }) => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, updateSettings } = useDokan();

  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPopupHelp, setShowPopupHelp] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setShowPopupHelp(false);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google sign in error:', err);
      if (
        err?.code === 'auth/popup-blocked' ||
        err?.code === 'auth/cancelled-popup-request' ||
        err?.code === 'auth/popup-closed-by-user'
      ) {
        setShowPopupHelp(true);
        setErrorMessage(
          'ব্রাউজারে পপ-আপ ব্লক করা আছে অথবা পপ-আপ বন্ধ করা হয়েছে। নিচের ইমেইল ও পাসওয়ার্ড ট্যাব দিয়ে কোনো পপ-আপ ছাড়াই ১-ক্লিকে সরাসরি লগইন/সাইন-আপ করতে পারেন।'
        );
      } else if (err?.code === 'auth/unauthorized-domain') {
        setErrorMessage(
          'এই ডোমেনটি ফায়ারবেসে অনুমোদিত নয়। নিচের ইমেইল ও পাসওয়ার্ড দিয়ে সহজে লগইন করুন।'
        );
      } else {
        setErrorMessage(err?.message || 'লগইন করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('অনুগ্রহ করে ইমেইল এবং পাসওয়ার্ড দিন');
      return;
    }
    if (authMode === 'signup' && !name.trim()) {
      setErrorMessage('অনুগ্রহ করে আপনার দোকানের নাম দিন');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setShowPopupHelp(false);

    try {
      if (authMode === 'signup') {
        await signUpWithEmail(email.trim(), password, name.trim());
        updateSettings({ shopName: name.trim() });
      } else {
        await signInWithEmail(email.trim(), password);
      }
    } catch (err: any) {

      console.error('Email auth error:', err);
      if (err?.code === 'auth/user-not-found' || err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
        setErrorMessage('ইমেইল বা পাসওয়ার্ড ভুল হয়েছে। সঠিক তথ্য দিন।');
      } else if (err?.code === 'auth/email-already-in-use') {
        setErrorMessage('এই ইমেইল দিয়ে ইতিমধ্যে একাউন্ট আছে। "লগইন" ট্যাবে গিয়ে লগইন করুন।');
      } else if (err?.code === 'auth/invalid-email') {
        setErrorMessage('সঠিক ইমেইল ঠিকানা দিন (যেমন: yourname@gmail.com)');
      } else {
        setErrorMessage(err?.message || 'লগইন সম্পন্ন করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f4f0] text-gray-900 font-['SolaimanLipi',sans-serif] flex flex-col justify-between selection:bg-[#b83a14] selection:text-white">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#b83a14] text-white flex items-center justify-center font-bold text-xl shadow-xs">
              ৳
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-gray-900 text-lg sm:text-xl tracking-tight leading-tight">
                  দোকান ম্যানেজার
                </h1>
                <span className="hidden sm:inline-block text-[10px] font-bold bg-orange-100 text-[#b83a14] px-2 py-0.5 rounded-full border border-orange-200">
                  ডিজিটাল খাতা ও পিওএস
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium">
                ব্যবসা ও বাকি হিসাবের নিরাপদ ক্লাউড সফটওয়্যার
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onContinueAsGuest}
              className="text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl transition active:scale-95"
            >
              ডেমো মোড
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Product Value & Features */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 shadow-2xs">
              <Cloud className="w-3.5 h-3.5 text-emerald-600" />
              <span>গুগল ক্লাউড সিঙ্ক • আজীবন ফ্রি ও নিরাপদ ব্যাকআপ</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight leading-[1.25]">
              আপনার দোকানের সকল বিক্রি, বাকি খাতা ও স্টক — সম্পূর্ণ নিয়ন্ত্রণে
            </h2>

            <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-xl">
              খাতার হিসাব হারানোর বা ভুল হওয়ার দিন শেষ! মোবাইল বা কম্পিউটার থেকে খুব সহজেই কাস্টমারদের বাকি, পিওএস বিক্রি, ডিজিটাল মেমো এবং কম্পিউটার সার্ভিসের হিসাব রাখুন এক জায়গায়।
            </p>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            {/* Feature 1 */}
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200 shadow-2xs flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-orange-100 text-[#b83a14] shrink-0">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">সুপারফাস্ট বিক্রি (POS)</h4>
                <p className="text-xs text-gray-500 mt-0.5 leading-normal">
                  ক্যাশ বা বাকিতে তাত্ক্ষণিক বিক্রি, বারকোড স্ক্যান এবং ডিজিটাল রশিদ প্রিন্ট।
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200 shadow-2xs flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700 shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">বাকি খাতা ও QR পোর্টাল</h4>
                <p className="text-xs text-gray-500 mt-0.5 leading-normal">
                  প্রতিটি কাস্টমারকে দিন আলাদা লিঙ্ক ও QR কোড, যেখানে তিনি লাইভ বাকি দেখতে পাবেন।
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200 shadow-2xs flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-purple-100 text-purple-700 shrink-0">
                <Monitor className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">কম্পিউটার সার্ভিস আলাদা ক্যাশ</h4>
                <p className="text-xs text-gray-500 mt-0.5 leading-normal">
                  ফটোকপি ও অনলাইন সেবার ক্যাশ ও লাভ দোকানের সাধারণ ক্যাশ থেকে সম্পূর্ণ পৃথক।
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200 shadow-2xs flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">আজীবন ক্লাউড ব্যাকআপ</h4>
                <p className="text-xs text-gray-500 mt-0.5 leading-normal">
                  ফোন নষ্ট বা চুরি হলেও আপনার জিমেইলে সব ডাটা চিরতরে সুরক্ষিত ও নিরাপদ থাকবে।
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Authentication Card */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200 shadow-xl space-y-5">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#b83a14] border border-orange-200 flex items-center justify-center mx-auto text-2xl font-bold">
                🏪
              </div>
              <h3 className="font-extrabold text-xl sm:text-2xl text-gray-900 tracking-tight pt-1">
                দোকান ম্যানেজারে প্রবেশ করুন
              </h3>
              <p className="text-xs text-gray-500">
                লগইন করে আপনার দোকানের ক্লাউড সিঙ্ক ও ব্যাকআপ সক্রিয় করুন
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-800">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{errorMessage}</div>
              </div>
            )}

            {/* Google One-Click Login */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 py-3 px-4 rounded-xl font-bold text-sm text-gray-800 shadow-2xs transition active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
              <span>Google দিয়ে ১-ক্লিকে লগইন</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-gray-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider shrink-0">
                অথবা ইমেইল দিয়ে প্রবেশ করুন
              </span>
            </div>

            {/* Email/Password Auth Form (100% Popup-Proof) */}
            <form onSubmit={handleEmailAuthSubmit} className="space-y-3.5">
              {/* Tab Selector */}
              <div className="flex bg-gray-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                    authMode === 'login'
                      ? 'bg-white text-gray-900 shadow-2xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  লগইন
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                    authMode === 'signup'
                      ? 'bg-white text-gray-900 shadow-2xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  নতুন একাউন্ট খুলুন
                </button>
              </div>

              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    দোকানের নাম <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Store className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="যেমন: ভাই ভাই ট্রেডার্স / বিসমিল্লাহ স্টোর"
                      className="w-full bg-[#fbfaf8] border border-gray-300 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#b83a14] focus:bg-white"
                    />
                  </div>
                </div>
              )}


              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  ইমেইল ঠিকানা
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="w-full bg-[#fbfaf8] border border-gray-300 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#b83a14] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  পাসওয়ার্ড
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="কমপক্ষে ৬ ডিজিটের পাসওয়ার্ড"
                    className="w-full bg-[#fbfaf8] border border-gray-300 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#b83a14] focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#b83a14] hover:bg-[#a33210] active:scale-[0.99] text-white rounded-xl font-bold text-sm sm:text-base shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <span>প্রসেসিং হচ্ছে...</span>
                ) : (
                  <>
                    <span>{authMode === 'signup' ? 'একাউন্ট তৈরি করুন' : 'লগইন করুন'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Offline / Demo Explore Button */}
            <div className="pt-2 text-center border-t border-gray-100">
              <button
                type="button"
                onClick={onContinueAsGuest}
                className="text-xs text-gray-600 hover:text-[#b83a14] font-semibold transition inline-flex items-center gap-1"
              >
                <span>লগইন না করে ডেমো মোডে অ্যাপটি দেখুন</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="border-t border-gray-200 bg-white py-4 text-center text-xs text-gray-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} দোকান ম্যানেজার (Dokan Manager) — সমস্ত অধিকার সংরক্ষিত।</p>
          <div className="flex items-center gap-3 text-[11px] text-gray-400">
            <span>🔒 ক্লাউড সিকিউরিটি সক্রিয়</span>
            <span>•</span>
            <span>📱 PWA অ্যাপ সাপোর্টেড</span>
            <span>•</span>
            <span>⚡ জিরো-কোটা অপ্টিমাইজড</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
