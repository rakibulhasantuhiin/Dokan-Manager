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
import { PWAInstallModal } from './components/PWAInstallModal';
import { ReceiptModal } from './components/ReceiptModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { PublicCustomerLedgerView } from './components/PublicCustomerLedgerView';
import { WelcomeAuthLanding } from './components/WelcomeAuthLanding';
import { Customer, SaleRecord } from './types';

import { DailyBusinessReportModal } from './components/DailyBusinessReportModal';
import { DailyMetricsDetailModal } from './components/DailyMetricsDetailModal';
import { ProductFormModal } from './components/ProductFormModal';

function MainContent() {
  const { activeGlobalModal, setActiveGlobalModal, productModalData, setProductModalData } = useDokan();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Modals
  const [quickTxType, setQuickTxType] = useState<'due' | 'payment' | null>(null);
  const [quickTxCustomer, setQuickTxCustomer] = useState<Customer | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPWAInstallModalOpen, setIsPWAInstallModalOpen] = useState(false);
  const [completedSaleReceipt, setCompletedSaleReceipt] = useState<SaleRecord | null>(null);
  const [scannerCallback, setScannerCallback] = useState<((code: string) => void) | null>(null);
  
  const [metricsDetail, setMetricsDetail] = useState<{ isOpen: boolean; type: 'sales' | 'due' | 'received' | 'profit' }>({
    isOpen: false,
    type: 'sales',
  });

  // Global scroll lock for modals
  React.useEffect(() => {
    const isModalOpen = !!quickTxType || isSettingsOpen || isPWAInstallModalOpen || !!completedSaleReceipt || !!scannerCallback || !!activeGlobalModal || metricsDetail.isOpen;
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100dvh';
    } else {
      document.body.style.overflow = '';
      document.body.style.height = '';
    }
  }, [quickTxType, isSettingsOpen, isPWAInstallModalOpen, completedSaleReceipt, scannerCallback, activeGlobalModal]);

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
        onOpenInstallModal={() => setIsPWAInstallModalOpen(true)}
        activeTab={selectedCustomer ? 'customer' : activeTab}
        onChangeTab={(tab) => {
          setSelectedCustomer(null);
          setActiveTab(tab);
          window.scrollTo(0, 0);
        }}
      />

      {/* Main Content Area - Instant Zero-Lag Tab Switching & Viewport-Fit Layout */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-2.5 sm:px-5 overflow-x-hidden">
        <div key={viewKey} className="w-full h-full animate-tab-fast">
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
                  onOpenMetricsDetail={(type) => setMetricsDetail({ isOpen: true, type })}
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
        </div>
      </main>

      {/* Bottom Navigation Bar */}
      <BottomNav
        activeTab={selectedCustomer ? 'customer' : activeTab}
        onChangeTab={(tab) => {
          setSelectedCustomer(null);
          setActiveTab(tab);
          window.scrollTo(0, 0);
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

      {/* PWA Install Modal */}
      <PWAInstallModal
        isOpen={isPWAInstallModalOpen}
        onClose={() => setIsPWAInstallModalOpen(false)}
      />

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

      {/* Global Business Report Modal */}
      <DailyBusinessReportModal
        isOpen={activeGlobalModal === 'daily_report'}
        onClose={() => setActiveGlobalModal(null)}
      />

      <DailyMetricsDetailModal
        isOpen={metricsDetail.isOpen}
        type={metricsDetail.type}
        onClose={() => setMetricsDetail({ ...metricsDetail, isOpen: false })}
      />

      {/* Global Product Form Modal (Fixed viewport fit) */}
      <ProductFormModal
        isOpen={activeGlobalModal === 'product_form'}
        productId={productModalData?.id || null}
        onClose={() => {
          setActiveGlobalModal(null);
          setProductModalData(null);
        }}
        onOpenScanner={(cb) => setScannerCallback(() => cb)}
      />
    </div>
  );
}

function RootRouter() {
  const { currentUser, isAuthLoading } = useDokan();

  // While checking auth state on boot, show clean branded splash loader
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#f8f7f4] flex flex-col items-center justify-center p-4 font-['SolaimanLipi',sans-serif]">
        <div className="w-12 h-12 rounded-2xl bg-[#b83a14] text-white flex items-center justify-center font-bold text-2xl shadow-md animate-pulse">
          ৳
        </div>
        <div className="mt-3 text-sm font-bold text-gray-700">দোকান ম্যানেজার লোড হচ্ছে...</div>
      </div>
    );
  }

  // If not logged in: show clean minimal Login / Sign up screen
  if (!currentUser) {
    return <WelcomeAuthLanding />;
  }

  return <MainContent />;
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
