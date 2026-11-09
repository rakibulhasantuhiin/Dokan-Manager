import React, { useState } from 'react';
import {
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  KeyRound,
  PlusCircle,
  Store,
} from 'lucide-react';
import { useDokan } from '../context/DokanContext';
import {
  normalizePin,
  verifyPinInCloud,
  registerPinInCloud,
} from '../firebase';

export const WelcomeAuthLanding: React.FC = () => {
  const { updateSettings, prepareFreshPinWorkspace, activateFallbackPinSession } = useDokan();

  const [mode, setMode] = useState<'login' | 'create'>('login');
  const [pinInput, setPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [shopNameInput, setShopNameInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Helper to get stored custom PIN registry from localStorage
  const getCustomPins = (): Record<string, { shopName: string }> => {
    try {
      const saved = localStorage.getItem('dokan_custom_pins');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  };

  const saveCustomPin = (pin: string, shopName: string) => {
    const pins = getCustomPins();
    pins[pin] = { shopName };
    try {
      localStorage.setItem('dokan_custom_pins', JSON.stringify(pins));
    } catch {}
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanPin = normalizePin(pinInput);
    if (!cleanPin) {
      setErrorMessage('আপনার পিন কোড দিন');
      return;
    }

    // 1. Permanent Owner PIN (7078) -> Instant 0ms login on AI Studio, Vercel, PC & Mobile
    if (cleanPin === '7078') {
      activateFallbackPinSession('7078', 'তাওয়াক্কুল কর্নার');
      return;
    }

    setIsLoading(true);
    try {
      // 2. Check local custom PIN registry first for instant offline login
      const customPins = getCustomPins();
      if (customPins[cleanPin]) {
        activateFallbackPinSession(cleanPin, customPins[cleanPin].shopName || 'আমার দোকান');
        return;
      }

      // 3. Check Cloud Firestore PIN registry (for logging in from a new device / Vercel / mobile)
      const cloudCheck = await verifyPinInCloud(cleanPin);
      if (cloudCheck.exists) {
        const resolvedShop = cloudCheck.shopName || 'আমার দোকান';
        saveCustomPin(cleanPin, resolvedShop);
        activateFallbackPinSession(cleanPin, resolvedShop);
      } else {
        setErrorMessage('পিন অথেন্টিকেশন সমস্যা হয়েছে। দয়া করে সঠিক পিন দিন অথবা নতুন পিন তৈরি করুন।');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setErrorMessage('পিন অথেন্টিকেশন সমস্যা হয়েছে। দয়া করে ইন্টারনেট কানেকশন চেক করে আবার চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const pin = normalizePin(newPinInput);
    const shop = shopNameInput.trim();

    if (!pin || pin.length < 4) {
      setErrorMessage('পিন কমপক্ষে ৪ সংখ্যার হতে হবে');
      return;
    }
    if (!shop) {
      setErrorMessage('দোকানের নাম লিখুন');
      return;
    }

    const customPins = getCustomPins();
    if (pin === '7078' || customPins[pin]) {
      setErrorMessage('এই পিন নম্বরটি ইতিমধ্যে ব্যবহৃত হয়েছে। অনুগ্রহ করে অন্য একটি পিন নম্বর দিন।');
      return;
    }

    setIsLoading(true);

    try {
      const cloudCheck = await verifyPinInCloud(pin);
      if (cloudCheck.exists) {
        setErrorMessage('এই পিন নম্বরটি ইতিমধ্যে অন্য একটি দোকানে ব্যবহৃত হচ্ছে। ভিন্ন পিন নম্বর দিন।');
        setIsLoading(false);
        return;
      }

      // Prepare a 100% clean, empty workspace for the new PIN
      prepareFreshPinWorkspace(shop);
      saveCustomPin(pin, shop);
      await registerPinInCloud(pin, shop);
      activateFallbackPinSession(pin, shop);
      updateSettings({ shopName: shop, ownerName: 'দোকান মালিক' });
    } catch {
      prepareFreshPinWorkspace(shop);
      saveCustomPin(pin, shop);
      activateFallbackPinSession(pin, shop);
      updateSettings({ shopName: shop, ownerName: 'দোকান মালিক' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f7f4] font-['SolaimanLipi',sans-serif] flex flex-col items-center justify-center p-4 text-gray-900 selection:bg-[#b83a14] selection:text-white">
      {/* Centered Minimal PIN Auth Card */}
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xl space-y-5 animate-scale-in">
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="w-14 h-14 rounded-2xl animate-gradient-terracotta shimmer-card text-white flex items-center justify-center mx-auto text-2xl font-black shadow-md">
            ৳
          </div>
          <h1 className="font-black text-2xl text-gray-900 tracking-tight">
            দোকান ম্যানেজার
          </h1>
          <p className="text-xs text-gray-500 font-medium">
            নিরাপদ পিন ভিত্তিক স্বতন্ত্র ক্লাউড ডেটাবেজ
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-2 rounded-lg transition-all duration-100 cursor-pointer ${
              mode === 'login' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            পিন দিয়ে প্রবেশ
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('create');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-2 rounded-lg transition-all duration-100 cursor-pointer ${
              mode === 'create' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            + নতুন পিন তৈরি
          </button>
        </div>

        {/* Error / Success Messages */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border-2 border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-900 font-bold leading-tight animate-in fade-in zoom-in-95 duration-200">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <div>{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 text-xs text-emerald-800 leading-relaxed">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>{successMessage}</div>
          </div>
        )}

        {/* Login with PIN */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 text-center">
                আপনার গোপন পিন কোড দিন <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <KeyRound className="w-5 h-5 text-amber-600 absolute left-3.5 top-3" />
                <input
                  type="password"
                  maxLength={12}
                  required
                  autoFocus
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#fbfaf8] border-2 border-gray-300 rounded-xl pl-11 pr-4 py-2.5 text-center text-lg font-black tracking-widest text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#b83a14] focus:border-[#b83a14] focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 animate-gradient-terracotta hover:brightness-105 active:scale-[0.99] text-white rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <span>যাচাই করা হচ্ছে...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>পিন দিয়ে প্রবেশ করুন</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Create New PIN */
          <form onSubmit={handleCreatePinSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                দোকানের নাম <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Store className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={shopNameInput}
                  onChange={(e) => setShopNameInput(e.target.value)}
                  placeholder="আপনার দোকানের নাম লিখুন"
                  className="w-full bg-[#fbfaf8] border border-gray-300 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#b83a14] focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                নতুন গোপন পিন নম্বর (মনে রাখুন) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-amber-600 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  maxLength={12}
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value)}
                  placeholder="কমপক্ষে ৪ সংখ্যার পিন দিন"
                  className="w-full bg-[#fbfaf8] border border-gray-300 rounded-xl pl-9 pr-3 py-2 text-xs font-black tracking-wider text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#b83a14] focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 animate-gradient-terracotta hover:brightness-105 active:scale-[0.99] text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <span>তৈরি হচ্ছে...</span>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>নতুন পিন ও ডেটাবেজ তৈরি করুন</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer Security Badge */}
        <div className="pt-2 text-center text-[11px] text-gray-400 flex items-center justify-center gap-1.5 font-medium border-t border-gray-100">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>প্রতিটি পিনের জন্য সম্পূর্ণ স্বতন্ত্র ডেটা</span>
        </div>
      </div>
    </div>
  );
};
