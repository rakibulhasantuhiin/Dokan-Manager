import React from 'react';
import { Home, ShoppingCart, Package, Users, Menu } from 'lucide-react';
import { motion } from 'motion/react';

export type TabType = 'home' | 'sale' | 'product' | 'customer' | 'more';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  const tabs = [
    { id: 'home' as TabType, label: 'হোম', icon: Home },
    { id: 'sale' as TabType, label: 'বিক্রি', icon: ShoppingCart },
    { id: 'product' as TabType, label: 'পণ্য', icon: Package },
    { id: 'customer' as TabType, label: 'কাস্টমার', icon: Users },
    { id: 'more' as TabType, label: 'আরও', icon: Menu },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-lg">
      <div className="max-w-6xl mx-auto flex items-center justify-around h-14 relative">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <motion.button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              whileTap={{ scale: 0.93 }}
              transition={{ type: 'spring', stiffness: 750, damping: 38 }}
              className={`relative flex-1 flex flex-col items-center justify-center h-full py-1 transition-colors duration-100 select-none cursor-pointer ${
                isActive ? 'text-[#b83a14] bg-orange-50/50' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {/* Super-Fast Animated Top Line Accent Indicator */}
              {isActive && (
                <motion.span
                  layoutId="bottomNavIndicator"
                  className="absolute top-0 left-3 right-3 h-[3px] animate-gradient-terracotta rounded-b-sm"
                  transition={{
                    type: 'spring',
                    stiffness: 750,
                    damping: 40,
                  }}
                />
              )}

              <Icon
                className={`w-5 h-5 transition-transform duration-100 ${
                  isActive ? 'scale-110 stroke-[2.4]' : 'scale-100 stroke-[1.8]'
                }`}
              />
              <span
                className={`text-[11px] mt-0.5 tracking-tight font-['SolaimanLipi',sans-serif] ${
                  isActive ? 'font-bold' : 'font-semibold text-gray-500'
                }`}
              >
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};
