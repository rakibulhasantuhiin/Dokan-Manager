import React, { useState } from 'react';
import {
  Lock,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  KeyRound,
} from 'lucide-react';
import { useDokan } from '../context/DokanContext';

export const WelcomeAuthLanding: React.FC = () => {
  const { signInWithEmail, signUpWithEmail, updateSettings } = useDokan();

  const [pinInput, setPinInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const AUTHORIZED_PIN = '7078';
  const MASTER_EMAIL = 'tawakkulcorners@gmail.com';
  const MASTER_PASSWORD = '@2828TanjuTuhin';

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanPin = pinInput.trim();
    if (cleanPin !== AUTHORIZED_PIN) {
      setErrorMessage('ভুল অথরাইজড পিন আইডি! সঠিক পিন দিন (পিন: 7078)');
      return;
    }

    setIsLoading(true);

    try {
      // Attempt sign in with authorized credentials
      await signInWithEmail(MASTER_EMAIL, MASTER_PASSWORD);
    } catch (err: any) {
      console.warn('Auto sign-in with pin credentials, attempting auto-signup...', err);
      try {
        await signUpWithEmail(MASTER_EMAIL, MASTER_PASSWORD, 'তাওয়াক্কুল কর্নার');
        updateSettings({ shopName: 'তাওয়াক্কুল কর্নার', ownerName: 'রাকিবুল হাসান তোহিন' });
      } catch (signupErr: any) {
        console.error('Auto signup error:', signupErr);
        // If already registered or rate limited, try direct sign in once more
        try {
          await signInWithEmail(MASTER_EMAIL, MASTER_PASSWORD);
        } catch (finalErr: any) {
          setErrorMessage('পিন অথেন্টিকেশনে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f7f4] font-['SolaimanLipi',sans-serif] flex flex-col items-center justify-center p-4 text-gray-900 selection:bg-[#b83a14] selection:text-white">
      {/* Centered Minimal PIN Auth Card */}
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-[#b83a14] text-white flex items-center justify-center mx-auto text-3xl font-black shadow-md">
            ৳
          </div>
          <h1 className="font-black text-2xl sm:text-3xl text-gray-900 tracking-tight">
            দোকান ম্যানেজার
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium">
            নিরাপদ অথরাইজড পিন ভিত্তিক ক্লাউড সফটওয়্যার
          </p>
        </div>

        {/* Error Message Alert */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-800 leading-relaxed animate-shake">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>{errorMessage}</div>
          </div>
        )}

        {/* PIN Authentication Form */}
        <form onSubmit={handlePinSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 text-center">
              অথরাইজড পিন আইডি দিন <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <KeyRound className="w-5 h-5 text-amber-600 absolute left-3.5 top-3.5" />
              <input
                type="password"
                maxLength={6}
                required
                autoFocus
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="••••"
                className="w-full bg-[#fbfaf8] border-2 border-gray-300 rounded-2xl pl-11 pr-4 py-3 text-center text-xl font-black tracking-widest text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#b83a14] focus:border-[#b83a14] focus:bg-white"
              />
            </div>
            <div className="text-[11px] text-gray-400 text-center mt-1">
              অথরাইজড পিন কোড দিয়ে সফটওয়্যারে প্রবেশ করুন
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-[#b83a14] hover:bg-[#a33210] active:scale-[0.99] text-white rounded-2xl font-extrabold text-sm sm:text-base shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? (
              <span>প্রবেশ করা হচ্ছে...</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>পিন দিয়ে প্রবেশ করুন</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Security Badge */}
        <div className="pt-2 text-center text-[11px] text-gray-400 flex items-center justify-center gap-1.5 font-medium border-t border-gray-100">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>শুধুমাত্র অনুমোদিত পিনের জন্য সংরক্ষিত</span>
        </div>
      </div>
    </div>
  );
};
