import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { DokanProvider } from './context/DokanContext';
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
import { Customer, SaleRecord } from './types';

function MainContent() {
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

export default function App() {
  return (
    <DokanProvider>
      <MainContent />
    </DokanProvider>
  );
}
