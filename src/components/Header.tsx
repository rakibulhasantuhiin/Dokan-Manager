import React from 'react';
import { Settings, Download, WifiOff, Cloud, CloudCheck, Home, ShoppingCart, Package, Users, Menu } from 'lucide-react';
import { useDokan } from '../context/DokanContext';
import { usePWAInstall, useOnlineStatus } from '../hooks/usePWAInstall';
import { TabType } from './BottomNav';

interface HeaderProps {
  onOpenSettings: () => void;
  activeTab?: TabType;
  onChangeTab?: (tab: TabType) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings, activeTab, onChangeTab }) => {
  const { settings, currentUser, isCloudSyncing } = useDokan();
  const { isInstallable, install, isInstalled, isIOS } = usePWAInstall();
  const isOnline = useOnlineStatus();

  const navItems = [
    { id: 'home' as TabType, label: 'হোম', icon: Home },
    { id: 'sale' as TabType, label: 'বিক্রি', icon: ShoppingCart },
    { id: 'product' as TabType, label: 'পণ্য', icon: Package },
    { id: 'customer' as TabType, label: 'কাস্টমার', icon: Users },
    { id: 'more' as TabType, label: 'আরও', icon: Menu },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#b83a14] text-white shadow-md">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-3">
        {/* Brand / Logo */}
        <div
          onClick={() => onChangeTab && onChangeTab('home')}
          className="flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none shrink-0"
        >
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center p-1 border border-white/20">
            <svg viewBox="0 0 40 48" className="w-5 h-6">
              <rect x="4" y="2" width="32" height="42" rx="4" fill="#ffffff" />
              <rect x="0" y="2" width="8" height="42" rx="2" fill="#cbd5e1" />
              <path d="M12 2v14l5-4 5 4V2z" fill="#b83a14" />
              <circle cx="20" cy="28" r="7" fill="#b83a14" />
              <text x="20" y="31.5" fontSize="8" fontWeight="bold" fill="#ffffff" textAnchor="middle">৳</text>
            </svg>
          </div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white font-['SolaimanLipi',sans-serif]">
            দোকান ম্যানেজার
          </h1>
        </div>

        {/* Desktop Top Nav Menu for PC */}
        {onChangeTab && activeTab && (
          <nav className="hidden md:flex items-center gap-1 bg-black/10 rounded-xl p-1 border border-white/10">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onChangeTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    isActive
                      ? 'bg-white text-[#b83a14] shadow-xs'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Right side: Cloud Sync status, PWA Install & Settings */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Cloud Sync Status Indicator */}
          {currentUser ? (
            <div
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs px-2.5 py-1 rounded-full font-medium border border-white/20"
              title={`গুগল ক্লাউড সিঙ্ক চালু: ${currentUser.email}`}
            >
              <span className={`w-2 h-2 rounded-full ${isCloudSyncing ? 'bg-amber-300 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
              <span className="hidden sm:inline font-semibold">
                {isCloudSyncing ? 'সিঙ্ক হচ্ছে...' : 'ক্লাউড সিঙ্ক'}
              </span>
            </div>
          ) : (
            <button
              onClick={onOpenSettings}
              className="hidden sm:flex items-center gap-1 bg-white/15 hover:bg-white/25 text-white/95 text-[11px] px-2 py-1 rounded-full font-semibold border border-white/20 transition active:scale-95"
              title="আজীবন ক্লাউড ব্যাকআপ চালু করতে চাপ দিন"
            >
              <Cloud className="w-3 h-3 text-amber-300" />
              <span>ক্লাউড ব্যাকআপ</span>
            </button>
          )}

          {!isOnline && (
            <div className="flex items-center gap-1 bg-amber-500/90 text-white text-xs px-2 py-1 rounded-full font-medium" title="অফলাইন মোড চালু">
              <WifiOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">অফলাইন</span>
            </div>
          )}

          {/* PWA Install Button in Header */}
          {!isInstalled && (
            <button
              onClick={isInstallable ? install : onOpenSettings}
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs px-2.5 py-1.5 rounded-full font-bold transition border border-white/25 active:scale-95 shadow-2xs"
              title="অ্যাপ ইনস্টল করুন"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden xs:inline">অ্যাপ ইনস্টল</span>
            </button>
          )}

          <div className="text-right select-none hidden sm:block">
            <span className="text-xs sm:text-sm font-semibold tracking-wide text-white/95 uppercase max-w-[120px] sm:max-w-[180px] truncate block">
              {settings.shopName || 'TAWAKKUL CORNER'}
            </span>
          </div>

          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg hover:bg-white/15 text-white/90 hover:text-white transition active:scale-95 relative"
            aria-label="সেটিংস খুলুন"
            title="দোকানের সেটিংস ও ক্লাউড অ্যাকাউন্ট"
          >
            <Settings className="w-5 h-5" />
            {currentUser && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#b83a14]" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
