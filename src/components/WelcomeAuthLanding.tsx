import React, { useState } from 'react';
import {
  Store,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { useDokan } from '../context/DokanContext';

export const WelcomeAuthLanding: React.FC = () => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, updateSettings } = useDokan();

  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [shopNameInput, setShopNameInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google sign in error:', err);
      if (
        err?.code === 'auth/popup-blocked' ||
        err?.code === 'auth/cancelled-popup-request' ||
        err?.code === 'auth/popup-closed-by-user'
      ) {
        setErrorMessage(
          'পপ-আপ বন্ধ বা ব্লক হয়েছে। নিচের ইমেইল ও পাসওয়ার্ড ফর্ম দিয়ে সহজেই ১-ক্লিকে প্রবেশ করতে পারেন।'
        );
      } else if (err?.code === 'auth/unauthorized-domain') {
        setErrorMessage(
          'এই ডোমেনটি ফায়ারবেসে অনুমোদিত নয়। নিচের ইমেইল ও পাসওয়ার্ড দিয়ে সহজে লগইন করুন।'
        );
      } else {
        setErrorMessage(err?.message || 'লগইন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
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
    if (authMode === 'signup' && !shopNameInput.trim()) {
      setErrorMessage('অনুগ্রহ করে আপনার দোকানের নাম দিন');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (authMode === 'signup') {
        await signUpWithEmail(email.trim(), password, shopNameInput.trim());
        updateSettings({ shopName: shopNameInput.trim() });
      } else {
        await signInWithEmail(email.trim(), password);
      }
    } catch (err: any) {
      console.error('Email auth error:', err);
      if (
        err?.code === 'auth/user-not-found' ||
        err?.code === 'auth/wrong-password' ||
        err?.code === 'auth/invalid-credential'
      ) {
        setErrorMessage('ইমেইল বা পাসওয়ার্ড ভুল হয়েছে। সঠিক তথ্য দিন।');
      } else if (err?.code === 'auth/email-already-in-use') {
        setErrorMessage('এই ইমেইল দিয়ে ইতিমধ্যে একাউন্ট আছে। "লগইন" ট্যাবে যান।');
      } else if (err?.code === 'auth/invalid-email') {
        setErrorMessage('সঠিক ইমেইল ঠিকানা দিন (যেমন: yourname@gmail.com)');
      } else {
        setErrorMessage(err?.message || 'লগইন সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f7f4] font-['SolaimanLipi',sans-serif] flex flex-col items-center justify-center p-4 text-gray-900 selection:bg-[#b83a14] selection:text-white">
      {/* Centered Minimal Auth Card */}
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#b83a14] text-white flex items-center justify-center mx-auto text-2xl font-black shadow-md">
            ৳
          </div>
          <h1 className="font-black text-2xl sm:text-3xl text-gray-900 tracking-tight">
            দোকান ম্যানেজার
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium">
            ব্যবসা ও বাকি হিসাবের নিরাপদ ক্লাউড সফটওয়্যার
          </p>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-800 leading-relaxed animate-shake">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>{errorMessage}</div>
          </div>
        )}

        {/* Google One-Click Login */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 py-3 px-4 rounded-2xl font-bold text-sm text-gray-800 shadow-2xs transition active:scale-[0.99] disabled:opacity-60 cursor-pointer"
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
          <span>Google দিয়ে ১-ক্লিকে প্রবেশ</span>
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-1">
          <div className="border-t border-gray-200 w-full" />
          <span className="bg-white px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider shrink-0">
            অথবা ইমেইল দিয়ে প্রবেশ করুন
          </span>
        </div>

        {/* Email/Password Auth Form */}
        <form onSubmit={handleEmailAuthSubmit} className="space-y-4">
          {/* Tab Selector */}
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition ${
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
              className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition ${
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
              <label className="block text-xs font-bold text-gray-700 mb-1">
                দোকানের নাম <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Store className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={shopNameInput}
                  onChange={(e) => setShopNameInput(e.target.value)}
                  placeholder="যেমন: বিসমিল্লাহ স্টোর"
                  className="w-full bg-[#fbfaf8] border border-gray-300 rounded-xl pl-9 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#b83a14] focus:bg-white"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              ইমেইল ঠিকানা <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@gmail.com"
                className="w-full bg-[#fbfaf8] border border-gray-300 rounded-xl pl-9 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#b83a14] focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              পাসওয়ার্ড <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="কমপক্ষে ৬ ডিজিটের পাসওয়ার্ড"
                className="w-full bg-[#fbfaf8] border border-gray-300 rounded-xl pl-9 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#b83a14] focus:bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-[#b83a14] hover:bg-[#a33210] active:scale-[0.99] text-white rounded-2xl font-bold text-sm sm:text-base shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? (
              <span>প্রসেসিং হচ্ছে...</span>
            ) : (
              <>
                <span>{authMode === 'signup' ? 'একাউন্ট তৈরি করুন' : 'প্রবেশ করুন'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Security Badge */}
        <div className="pt-2 text-center text-[11px] text-gray-400 flex items-center justify-center gap-1.5 font-medium border-t border-gray-100">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>নিরাপদ ক্লাউড এনক্রিপশন যুক্ত</span>
        </div>
      </div>
    </div>
  );
};
