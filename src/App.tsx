import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { DokanProvider, useDokan } from './context/DokanContext';
import { Header } from './components/Header';
import { BottomNav, TabType } from './components/BottomNav';
import { HomeView } from './components/HomeView';
import { SaleView } from './components/SaleView';
import { ProductView } from './components/ProductView';
import { CustomerListView } from './components/CustomerListView';
import { CustomerDetailView } from './components/CustomerDetailView';
import { MoreView } from './components/MoreView';
import { QuickTransactionModal } from './components/QuickTransactionModal';
import { SettingsModal } from './components/SettingsModal';
import { ReceiptModal } from './components/ReceiptModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { PublicCustomerLedgerView } from './components/PublicCustomerLedgerView';
import { WelcomeAuthLanding } from './components/WelcomeAuthLanding';
import { Customer, SaleRecord } from './types';

interface MainContentProps {
  onShowLogin?: () => void;
}

function MainContent({ onShowLogin }: MainContentProps) {
  const { currentUser } = useDokan();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Modals
  const [quickTxType, setQuickTxType] = useState<'due' | 'payment' | null>(null);
  const [quickTxCustomer, setQuickTxCustomer] = useState<Customer | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [completedSaleReceipt, setCompletedSaleReceipt] = useState<SaleRecord | null>(null);
  const [scannerCallback, setScannerCallback] = useState<((code: string) => void) | null>(null);

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
  };

  const handleBackFromCustomerDetail = () => {
    setSelectedCustomer(null);
  };

  // Determine active view key for smooth motion animations
  const viewKey = selectedCustomer ? `customer-${selectedCustomer.id}` : activeTab;

  return (
    <div className="min-h-screen bg-[#f5f4f0] flex flex-col font-['SolaimanLipi','Hind_Siliguri',sans-serif]">
      {/* Top Header */}
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        activeTab={selectedCustomer ? 'customer' : activeTab}
        onChangeTab={(tab) => {
          setSelectedCustomer(null);
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Guest Demo Mode Login Warning Banner */}
      {!currentUser && (
        <div className="bg-[#b83a14] text-white text-xs font-bold py-2 px-3 sm:px-5 flex items-center justify-between shadow-xs sticky top-[57px] z-20">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] uppercase shrink-0">ডেমো মোড</span>
            <span className="truncate">আজীবন সেভ রাখতে লগইন করুন</span>
          </div>
          <button
            onClick={onShowLogin || (() => setIsSettingsOpen(true))}
            className="bg-white text-[#b83a14] px-3 py-1 rounded-lg text-xs font-black shadow-2xs hover:bg-orange-50 active:scale-95 transition shrink-0 ml-2 cursor-pointer"
          >
            লগইন / সাইন-আপ
          </button>
        </div>
      )}

      {/* Main Content Area with Super Smooth Animated Tab Switching */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-5 overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={viewKey}
            initial={{ opacity: 0, y: 10, filter: 'blur(2px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(2px)' }}
            transition={{
              duration: 0.22,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {selectedCustomer ? (
              <CustomerDetailView
                customer={selectedCustomer}
                onBack={handleBackFromCustomerDetail}
                onOpenDueModal={(cust) => {
                  setQuickTxCustomer(cust);
                  setQuickTxType('due');
                }}
                onOpenPaymentModal={(cust) => {
                  setQuickTxCustomer(cust);
                  setQuickTxType('payment');
                }}
              />
            ) : (
              <>
                {activeTab === 'home' && (
                  <HomeView
                    onGoToSale={() => setActiveTab('sale')}
                    onGoToProduct={() => setActiveTab('product')}
                    onGoToCustomer={() => setActiveTab('customer')}
                    onSelectCustomer={handleSelectCustomer}
                    onOpenQuickDue={() => {
                      setQuickTxCustomer(null);
                      setQuickTxType('due');
                    }}
                    onOpenQuickPayment={() => {
                      setQuickTxCustomer(null);
                      setQuickTxType('payment');
                    }}
                  />
                )}

                {activeTab === 'sale' && (
                  <SaleView
                    onBack={() => setActiveTab('home')}
                    onOpenScanner={() => {
                      setScannerCallback(() => (code: string) => {});
                    }}
                    onSaleComplete={(sale) => {
                      setCompletedSaleReceipt(sale);
                    }}
                  />
                )}

                {activeTab === 'product' && (
                  <ProductView
                    onOpenScanner={(cb) => setScannerCallback(() => cb)}
                  />
                )}

                {activeTab === 'customer' && (
                  <CustomerListView onSelectCustomer={handleSelectCustomer} />
                )}

                {activeTab === 'more' && <MoreView />}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation Bar */}
      <BottomNav
        activeTab={selectedCustomer ? 'customer' : activeTab}
        onChangeTab={(tab) => {
          setSelectedCustomer(null);
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Quick Transaction Modal (+ বাকি দিলাম / + টাকা পেলাম) */}
      <AnimatePresence>
        {quickTxType && (
          <QuickTransactionModal
            type={quickTxType}
            initialCustomer={quickTxCustomer}
            onClose={() => {
              setQuickTxType(null);
              setQuickTxCustomer(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsModal onClose={() => setIsSettingsOpen(false)} />
        )}
      </AnimatePresence>

      {/* Printable Receipt Modal */}
      <AnimatePresence>
        {completedSaleReceipt && (
          <ReceiptModal
            sale={completedSaleReceipt}
            onClose={() => setCompletedSaleReceipt(null)}
          />
        )}
      </AnimatePresence>

      {/* Barcode Scanner Modal */}
      <AnimatePresence>
        {scannerCallback && (
          <BarcodeScannerModal
            onScan={(code) => {
              if (scannerCallback) scannerCallback(code);
              setScannerCallback(null);
            }}
            onClose={() => setScannerCallback(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function RootRouter() {
  const { currentUser, isAuthLoading } = useDokan();
  const [isGuestMode, setIsGuestMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('dokan_guest_mode') === 'true';
  });

  const handleSetGuestMode = (guest: boolean) => {
    setIsGuestMode(guest);
    if (guest) {
      localStorage.setItem('dokan_guest_mode', 'true');
    } else {
      localStorage.removeItem('dokan_guest_mode');
    }
  };

  // If user logs in successfully, clear guest mode flag
  if (currentUser && isGuestMode) {
    localStorage.removeItem('dokan_guest_mode');
  }

  // While checking auth state on boot, show clean branded splash loader
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#f5f4f0] flex flex-col items-center justify-center p-4 font-['SolaimanLipi',sans-serif]">
        <div className="w-12 h-12 rounded-2xl bg-[#b83a14] text-white flex items-center justify-center font-bold text-2xl shadow-md animate-pulse">
          ৳
        </div>
        <div className="mt-3 text-sm font-bold text-gray-700">দোকান ম্যানেজার লোড হচ্ছে...</div>
      </div>
    );
  }

  // Not logged in and not in guest mode: show Welcome & Cloud Login Landing page
  if (!currentUser && !isGuestMode) {
    return <WelcomeAuthLanding onContinueAsGuest={() => handleSetGuestMode(true)} />;
  }

  return <MainContent onShowLogin={() => handleSetGuestMode(false)} />;
}

export default function App() {
  // Check for public customer ledger portal query param (?ledger=...)
  const [ledgerToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get('ledger');
  });

  if (ledgerToken) {
    return <PublicCustomerLedgerView token={ledgerToken} />;
  }

  return (
    <DokanProvider>
      <RootRouter />
    </DokanProvider>
  );
}
