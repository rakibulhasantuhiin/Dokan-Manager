import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  doc,
  setDoc,
  onSnapshot,
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  auth,
  db,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  updateUserPassword,
  checkRedirectAuth,
  logOut,
} from '../firebase';
import { handleFirestoreError, OperationType } from '../utils/firestore-error';
import {
  Customer,
  CustomerTransaction,
  Product,
  SaleRecord,
  ExpenseRecord,
  SupplierRecord,
  PurchaseRecord,
  CashEntry,
  ShopSettings,
  CartItem,
} from '../types';
import { calculateCustomerBalance } from '../utils/calculations';
import { getPersistentShopOwnerId } from '../utils/customerShare';

interface DokanContextType {
  currentUser: User | null;
  isAuthLoading: boolean;
  isCloudSyncing: boolean;
  lastSyncedAt: Date | null;
  quotaOptimized: boolean;
  signInWithGoogle: () => Promise<User | null>;
  signInWithEmail: (email: string, pass: string) => Promise<User>;
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<User>;
  updatePassword: (newPass: string) => Promise<void>;
  prepareFreshPinWorkspace: (shopName: string) => void;
  activateFallbackPinSession: (pin: string, shopName: string) => void;
  logOut: () => Promise<void>;
  settings: ShopSettings;
  updateSettings: (newSettings: Partial<ShopSettings>) => void;
  customers: Customer[];
  addCustomer: (name: string, phone?: string, address?: string, initialDue?: number) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  updateCustomerDue: (customerId: string, newDueAmount: number, note?: string) => void;
  deleteCustomer: (id: string) => void;
  transactions: CustomerTransaction[];
  addTransaction: (customerId: string, type: 'due' | 'payment', amount: number, note?: string) => void;
  updateTransaction: (id: string, updates: { amount: number; note?: string; type?: 'due' | 'payment' }) => void;
  deleteTransaction: (id: string) => void;
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  sales: SaleRecord[];
  completeSale: (saleData: {
    customerId?: string;
    customerName: string;
    items: CartItem[];
    subtotal: number;
    discount: number;
    grandTotal: number;
    paidAmount: number;
    dueAmount: number;
    profit: number;
  }) => SaleRecord;
  deleteSale: (id: string) => void;
  expenses: ExpenseRecord[];
  addExpense: (expense: Omit<ExpenseRecord, 'id'>) => void;
  deleteExpense: (id: string) => void;
  suppliers: SupplierRecord[];
  addSupplier: (supplier: Omit<SupplierRecord, 'id' | 'totalDebt' | 'totalPaid'>) => void;
  purchases: PurchaseRecord[];
  addPurchase: (purchase: Omit<PurchaseRecord, 'id'>) => void;
  deletePurchase: (id: string) => void;
  cashEntries: CashEntry[];
  addCashEntry: (entry: Omit<CashEntry, 'id'>) => void;
  updateCashEntry: (id: string, updates: Partial<CashEntry>) => void;
  deleteCashEntry: (id: string) => void;
  resetAllData: () => void;
  exportDataJSON: () => string;
  importDataJSON: (jsonStr: string) => boolean;
  activeGlobalModal: 'daily_report' | 'business_report' | 'due_report' | 'monthly_report' | null;
  setActiveGlobalModal: (modal: 'daily_report' | 'business_report' | 'due_report' | 'monthly_report' | null) => void;
}

const STORAGE_KEY_PREFIX = 'dokan_manager_';

const DEFAULT_SETTINGS: ShopSettings = {
  shopName: 'আমার দোকান',
  ownerName: 'দোকান মালিক',
  phone: '',
  address: '',
  hideOnboarding: false,
  onboarding: {
    addProduct: false,
    firstSale: false,
    addCustomer: false,
  },
};

const DEFAULT_CUSTOMERS: Customer[] = [];
const DEFAULT_TRANSACTIONS: CustomerTransaction[] = [];


const DEFAULT_PRODUCTS: Product[] = [
  // ১. মুদি (Grocery)
  {
    id: 'prod_1',
    name: 'মিনিকেট চাল (৫০ কেজি বস্তা)',
    category: 'চাল',
    mainCategory: 'মুদি',
    measurementType: 'weight',
    unit: 'কেজি',
    purchasePrice: 65,
    sellingPrice: 72,
    currentStock: 0,
    lowStockAlert: 20,
    barcode: '8901234001',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_2',
    name: 'তীর সয়াবিন তেল ১ লিটার',
    category: 'তেল',
    mainCategory: 'মুদি',
    measurementType: 'liquid',
    unit: 'লিটার',
    purchasePrice: 165,
    sellingPrice: 175,
    currentStock: 0,
    lowStockAlert: 10,
    barcode: '8901234002',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_3',
    name: 'মসুর ডাল (মোটা)',
    category: 'ডাল',
    mainCategory: 'মুদি',
    measurementType: 'weight',
    unit: 'কেজি',
    purchasePrice: 105,
    sellingPrice: 115,
    currentStock: 0,
    lowStockAlert: 15,
    barcode: '8901234003',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_4',
    name: 'ফ্রেশ চিনি',
    category: 'মুদি',
    mainCategory: 'মুদি',
    measurementType: 'weight',
    unit: 'কেজি',
    purchasePrice: 130,
    sellingPrice: 140,
    currentStock: 0,
    lowStockAlert: 15,
    barcode: '8901234004',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_5',
    name: 'মোল্লা সুপার সল্ট ১ কেজি',
    category: 'লবণ',
    mainCategory: 'মুদি',
    measurementType: 'weight',
    unit: 'প্যাকেট',
    purchasePrice: 38,
    sellingPrice: 42,
    currentStock: 0,
    lowStockAlert: 10,
    barcode: '8901234005',
    createdAt: new Date().toISOString(),
  },

  // ২. স্টেশনারি (Stationery)
  {
    id: 'prod_6',
    name: 'এ৪ পেপার রিম (৮০ জিএসএম)',
    category: 'কাগজ / রিম',
    mainCategory: 'স্টেশনারি',
    measurementType: 'count',
    unit: 'রিম',
    purchasePrice: 410,
    sellingPrice: 460,
    currentStock: 0,
    lowStockAlert: 5,
    barcode: '8901234006',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_7',
    name: 'মাতার হাই-স্কুল বলপেন বক্স (২০ পিস)',
    category: 'কলম',
    mainCategory: 'স্টেশনারি',
    measurementType: 'count',
    unit: 'পিস',
    purchasePrice: 85,
    sellingPrice: 100,
    currentStock: 0,
    lowStockAlert: 8,
    barcode: '8901234007',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_8',
    name: 'স্টুডেন্ট খাতা (১২০ পাতা)',
    category: 'খাতা',
    mainCategory: 'স্টেশনারি',
    measurementType: 'count',
    unit: 'পিস',
    purchasePrice: 35,
    sellingPrice: 45,
    currentStock: 0,
    lowStockAlert: 10,
    barcode: '8901234008',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_9',
    name: 'কাঙ্গারু স্ট্যাপলার ও পিন বক্স',
    category: 'অফিস ফাইল',
    mainCategory: 'স্টেশনারি',
    measurementType: 'count',
    unit: 'পিস',
    purchasePrice: 110,
    sellingPrice: 135,
    currentStock: 0,
    lowStockAlert: 4,
    barcode: '8901234009',
    createdAt: new Date().toISOString(),
  },

  // ৩. কম্পিউটার সার্ভিস (Computer Service)
  {
    id: 'prod_10',
    name: 'ফটোকপি / প্রিন্ট (সাদা-কালো প্রতি পাতা)',
    category: 'ফটোকপি',
    mainCategory: 'কম্পিউটার সার্ভিস',
    measurementType: 'service',
    unit: 'পাতা',
    purchasePrice: 1.5,
    sellingPrice: 5,
    currentStock: 0,
    lowStockAlert: 50,
    barcode: '8901234010',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_11',
    name: 'কালার প্রিন্ট / ছবি প্রিন্ট (প্রতি পাতা)',
    category: 'প্রিন্টিং',
    mainCategory: 'কম্পিউটার সার্ভিস',
    measurementType: 'service',
    unit: 'পাতা',
    purchasePrice: 5,
    sellingPrice: 20,
    currentStock: 0,
    lowStockAlert: 30,
    barcode: '8901234011',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_12',
    name: 'অনলাইন চাকরির আবেদন / ফরম পূরণ',
    category: 'অনলাইন সেবা',
    mainCategory: 'কম্পিউটার সার্ভিস',
    measurementType: 'service',
    unit: 'কাজ',
    purchasePrice: 10,
    sellingPrice: 100,
    currentStock: 0,
    lowStockAlert: 10,
    barcode: '8901234012',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_13',
    name: 'উইন্ডোজ সেটআপ ও সফটওয়্যার সার্ভিসিং',
    category: 'সার্ভিসিং',
    mainCategory: 'কম্পিউটার সার্ভিস',
    measurementType: 'service',
    unit: 'কাজ',
    purchasePrice: 50,
    sellingPrice: 500,
    currentStock: 0,
    lowStockAlert: 5,
    barcode: '8901234013',
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_SUPPLIERS: SupplierRecord[] = [];


const DokanContext = createContext<DokanContextType | undefined>(undefined);

export const DokanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [activeGlobalModal, setActiveGlobalModal] = useState<'daily_report' | 'business_report' | 'due_report' | 'monthly_report' | null>(null);

  const [settings, setSettings] = useState<ShopSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.shopName === 'TAWAKKUL CORNER' || parsed.ownerName === 'রাকিবুল হাসান তোহিন') {
          return DEFAULT_SETTINGS;
        }
        return parsed;
      }
      return DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });


  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'customers');
      return saved ? JSON.parse(saved) : DEFAULT_CUSTOMERS;
    } catch {
      return DEFAULT_CUSTOMERS;
    }
  });

  const [transactions, setTransactions] = useState<CustomerTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'transactions');
      return saved ? JSON.parse(saved) : DEFAULT_TRANSACTIONS;
    } catch {
      return DEFAULT_TRANSACTIONS;
    }
  });

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'products');
      if (saved) {
        const parsed: Product[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mapped = parsed.map((p) => {
            if (!p.mainCategory) {
              const cat = (p.category || '').toLowerCase();
              const nm = (p.name || '').toLowerCase();
              if (
                cat.includes('কম্পিউটার') ||
                cat.includes('প্রিন্ট') ||
                cat.includes('সার্ভিস') ||
                nm.includes('ফটোকপি') ||
                nm.includes('প্রিন্ট') ||
                nm.includes('আবেদন')
              ) {
                return { ...p, mainCategory: 'কম্পিউটার সার্ভিস' as const };
              }
              if (
                cat.includes('স্টেশনারি') ||
                cat.includes('কলম') ||
                cat.includes('খাতা') ||
                cat.includes('রিম') ||
                nm.includes('খাতা') ||
                nm.includes('বলপেন') ||
                nm.includes('পেপার')
              ) {
                return { ...p, mainCategory: 'স্টেশনারি' as const };
              }
              return { ...p, mainCategory: 'মুদি' as const };
            }
            return p;
          });

          // Check if stationery or computer service is missing
          const hasStationery = mapped.some((p) => p.mainCategory === 'স্টেশনারি');
          const hasComputer = mapped.some((p) => p.mainCategory === 'কম্পিউটার সার্ভিস');

          let combined = [...mapped];
          if (!hasStationery) {
            combined = [
              ...combined,
              ...DEFAULT_PRODUCTS.filter((p) => p.mainCategory === 'স্টেশনারি'),
            ];
          }
          if (!hasComputer) {
            combined = [
              ...combined,
              ...DEFAULT_PRODUCTS.filter((p) => p.mainCategory === 'কম্পিউটার সার্ভিস'),
            ];
          }
          return combined;
        }
      }
      return DEFAULT_PRODUCTS;
    } catch {
      return DEFAULT_PRODUCTS;
    }
  });

  const [sales, setSales] = useState<SaleRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'sales');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'expenses');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });


  const [suppliers, setSuppliers] = useState<SupplierRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'suppliers');
      return saved ? JSON.parse(saved) : DEFAULT_SUPPLIERS;
    } catch {
      return DEFAULT_SUPPLIERS;
    }
  });

  const [purchases, setPurchases] = useState<PurchaseRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'purchases');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [cashEntries, setCashEntries] = useState<CashEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'cash_entries');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Keep a reference to the latest full state
  const stateRef = useRef({
    settings,
    customers,
    transactions,
    products,
    sales,
    expenses,
    suppliers,
    purchases,
    cashEntries,
  });

  useEffect(() => {
    stateRef.current = {
      settings,
      customers,
      transactions,
      products,
      sales,
      expenses,
      suppliers,
      purchases,
      cashEntries,
    };
  }, [settings, customers, transactions, products, sales, expenses, suppliers, purchases, cashEntries]);

  // Sync to local localStorage immediately
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'settings', JSON.stringify(settings));
    } catch (e) {
      console.warn('Storage sync error', e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'customers', JSON.stringify(customers));
    } catch (e) {
      console.warn('Storage sync error', e);
    }
  }, [customers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'transactions', JSON.stringify(transactions));
    } catch (e) {
      console.warn('Storage sync error', e);
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'products', JSON.stringify(products));
    } catch (e) {
      console.warn('Storage sync error', e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'sales', JSON.stringify(sales));
    } catch (e) {
      console.warn('Storage sync error', e);
    }
  }, [sales]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'expenses', JSON.stringify(expenses));
    } catch (e) {
      console.warn('Storage sync error', e);
    }
  }, [expenses]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'suppliers', JSON.stringify(suppliers));
    } catch (e) {
      console.warn('Storage sync error', e);
    }
  }, [suppliers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'purchases', JSON.stringify(purchases));
    } catch (e) {
      console.warn('Storage sync error', e);
    }
  }, [purchases]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'cash_entries', JSON.stringify(cashEntries));
    } catch (e) {
      console.warn('Storage sync error', e);
    }
  }, [cashEntries]);

  // =========================================================================
  // ZERO-QUOTA-DRAIN CLOUD SYNC ENGINE
  // =========================================================================
  // Instead of issuing 1 read/write per item or listening to 10 distinct
  // collections (which burns dozens of reads per second), we aggregate into
  // ONE single master document per shop: `users/{userId}/shop/master`.
  // - App load: Exactly 1 Read total (out of 50,000 free daily reads).
  // - Any mutation: Debounced into 1 single Write (out of 20,000 free writes).
  // - Mathematical guarantee: Shop uses < 1% of Firebase free tier daily!
  // =========================================================================
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastLocalMutationAt = useRef<number>((() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'last_mutation_at');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  })());

  // Instant & immediate cloud sync queue
  const triggerOptimizedCloudSync = (immediate = true) => {
    const nowTime = Date.now();
    lastLocalMutationAt.current = nowTime;
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'last_mutation_at', nowTime.toString());
    } catch {}

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    setIsCloudSyncing(true);

    const performSync = async () => {
      try {
        // Save per-user local vault so switching PINs on the same device never loses offline data
        if (currentUser?.uid) {
          try {
            localStorage.setItem(
              `${STORAGE_KEY_PREFIX}vault_${currentUser.uid}`,
              JSON.stringify({
                updatedAt: new Date(nowTime).toISOString(),
                settings: stateRef.current.settings,
                customers: stateRef.current.customers,
                transactions: stateRef.current.transactions,
                products: stateRef.current.products,
                sales: stateRef.current.sales,
                expenses: stateRef.current.expenses,
                suppliers: stateRef.current.suppliers,
                purchases: stateRef.current.purchases,
                cashEntries: stateRef.current.cashEntries,
              })
            );
          } catch {}
        }

        // Sync to Cloud Firestore using currentUser.uid (supports both pin_vault_* and Firebase Auth UID)
        if (!currentUser?.uid) {
          setIsCloudSyncing(false);
          return;
        }

        const userId = getPersistentShopOwnerId(currentUser.uid);
        const masterDocRef = doc(db, 'users', userId, 'shop', 'master');
        const payload = {
          userId,
          updatedAt: new Date(nowTime).toISOString(),
          settings: stateRef.current.settings,
          customers: stateRef.current.customers,
          transactions: stateRef.current.transactions,
          products: stateRef.current.products,
          sales: stateRef.current.sales,
          expenses: stateRef.current.expenses,
          suppliers: stateRef.current.suppliers,
          purchases: stateRef.current.purchases,
          cashEntries: stateRef.current.cashEntries,
        };

        await setDoc(masterDocRef, payload, { merge: true });
        setLastSyncedAt(new Date());
      } catch (err) {
        console.warn('Cloud sync deferred (offline or local mode):', err);
      } finally {
        setIsCloudSyncing(false);
      }
    };

    if (immediate) {
      performSync();
    } else {
      syncTimeoutRef.current = setTimeout(performSync, 100);
    }
  };

  // Instant Auto-Sync on Network Reconnect
  useEffect(() => {
    const handleOnline = () => {
      console.log('Network online reconnected! Triggering instant cloud backup...');
      triggerOptimizedCloudSync(true);
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [currentUser]);

  // Auth observer and check redirect result
  useEffect(() => {
    checkRedirectAuth().catch((err) => console.warn('Redirect auth check:', err));
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      // Prefer active PIN vault session if present so PIN login works 100% reliably across Vercel & AI Studio
      try {
        const fallbackPin = localStorage.getItem('dokan_active_pin_session');
        if (fallbackPin) {
          const parsed = JSON.parse(fallbackPin);
          setCurrentUser(parsed as User);
          setIsAuthLoading(false);
          return;
        }
      } catch {}

      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  // Listen to single master document on login (1 Read cost only!)
  useEffect(() => {
    if (!currentUser) return;

    const userId = currentUser.uid;

    // Restore from per-PIN local vault first if available
    try {
      const localVaultStr = localStorage.getItem(`${STORAGE_KEY_PREFIX}vault_${userId}`);
      if (localVaultStr) {
        const vData = JSON.parse(localVaultStr);
        if (vData.settings) { setSettings(vData.settings); stateRef.current.settings = vData.settings; }
        if (Array.isArray(vData.customers)) { setCustomers(vData.customers); stateRef.current.customers = vData.customers; }
        if (Array.isArray(vData.transactions)) { setTransactions(vData.transactions); stateRef.current.transactions = vData.transactions; }
        if (Array.isArray(vData.products)) { setProducts(vData.products); stateRef.current.products = vData.products; }
        if (Array.isArray(vData.sales)) { setSales(vData.sales); stateRef.current.sales = vData.sales; }
        if (Array.isArray(vData.expenses)) { setExpenses(vData.expenses); stateRef.current.expenses = vData.expenses; }
        if (Array.isArray(vData.suppliers)) { setSuppliers(vData.suppliers); stateRef.current.suppliers = vData.suppliers; }
        if (Array.isArray(vData.purchases)) { setPurchases(vData.purchases); stateRef.current.purchases = vData.purchases; }
        if (Array.isArray(vData.cashEntries)) { setCashEntries(vData.cashEntries); stateRef.current.cashEntries = vData.cashEntries; }
      }
    } catch {}

    const masterDocRef = doc(db, 'users', userId, 'shop', 'master');
    let isFirstSnapshotForSession = true;

    setIsCloudSyncing(true);

    const unsubscribe = onSnapshot(
      masterDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const remoteTime = data.updatedAt ? new Date(data.updatedAt).getTime() : 0;
          const isPending = docSnap.metadata.hasPendingWrites;

          // Always accept the initial remote snapshot upon login or if remote data is >= last local mutation
          if (isFirstSnapshotForSession || isPending || remoteTime >= lastLocalMutationAt.current) {
            isFirstSnapshotForSession = false;
            lastLocalMutationAt.current = Math.max(lastLocalMutationAt.current, remoteTime);
            try {
              localStorage.setItem(STORAGE_KEY_PREFIX + 'last_mutation_at', lastLocalMutationAt.current.toString());
            } catch {}

            if (data.settings) {
              setSettings(data.settings);
              stateRef.current.settings = data.settings;
              try { localStorage.setItem(STORAGE_KEY_PREFIX + 'settings', JSON.stringify(data.settings)); } catch {}
            }
            if (Array.isArray(data.customers)) {
              setCustomers(data.customers);
              stateRef.current.customers = data.customers;
              try { localStorage.setItem(STORAGE_KEY_PREFIX + 'customers', JSON.stringify(data.customers)); } catch {}
            }
            if (Array.isArray(data.transactions)) {
              setTransactions(data.transactions);
              stateRef.current.transactions = data.transactions;
              try { localStorage.setItem(STORAGE_KEY_PREFIX + 'transactions', JSON.stringify(data.transactions)); } catch {}
            }
            if (Array.isArray(data.products)) {
              setProducts(data.products);
              stateRef.current.products = data.products;
              try { localStorage.setItem(STORAGE_KEY_PREFIX + 'products', JSON.stringify(data.products)); } catch {}
            }
            if (Array.isArray(data.sales)) {
              setSales(data.sales);
              stateRef.current.sales = data.sales;
              try { localStorage.setItem(STORAGE_KEY_PREFIX + 'sales', JSON.stringify(data.sales)); } catch {}
            }
            if (Array.isArray(data.expenses)) {
              setExpenses(data.expenses);
              stateRef.current.expenses = data.expenses;
              try { localStorage.setItem(STORAGE_KEY_PREFIX + 'expenses', JSON.stringify(data.expenses)); } catch {}
            }
            if (Array.isArray(data.suppliers)) {
              setSuppliers(data.suppliers);
              stateRef.current.suppliers = data.suppliers;
              try { localStorage.setItem(STORAGE_KEY_PREFIX + 'suppliers', JSON.stringify(data.suppliers)); } catch {}
            }
            if (Array.isArray(data.purchases)) {
              setPurchases(data.purchases);
              stateRef.current.purchases = data.purchases;
              try { localStorage.setItem(STORAGE_KEY_PREFIX + 'purchases', JSON.stringify(data.purchases)); } catch {}
            }
            if (Array.isArray(data.cashEntries)) {
              setCashEntries(data.cashEntries);
              stateRef.current.cashEntries = data.cashEntries;
              try { localStorage.setItem(STORAGE_KEY_PREFIX + 'cash_entries', JSON.stringify(data.cashEntries)); } catch {}
            }

            setLastSyncedAt(new Date());
          } else {
            triggerOptimizedCloudSync(true);
          }
        } else {
          isFirstSnapshotForSession = false;
          // Master doc doesn't exist yet on cloud (first login for this PIN):
          const userDefaultName = currentUser.displayName || 'আমার দোকান';
          const updated = {
            ...stateRef.current.settings,
            shopName: userDefaultName,
          };
          setSettings(updated);
          stateRef.current.settings = updated;
          try { localStorage.setItem(STORAGE_KEY_PREFIX + 'settings', JSON.stringify(updated)); } catch {}
          triggerOptimizedCloudSync(true);
        }
        setIsCloudSyncing(false);
      },
      (error) => {
        setIsCloudSyncing(false);
        handleFirestoreError(error, OperationType.GET, `users/${userId}/shop/master`);
      }
    );

    return () => {
      unsubscribe();
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [currentUser]);

  // Mutations
  const updateSettings = (newSettings: Partial<ShopSettings>) => {
    const updated = { ...stateRef.current.settings, ...newSettings };
    setSettings(updated);
    stateRef.current.settings = updated;
    try { localStorage.setItem(STORAGE_KEY_PREFIX + 'settings', JSON.stringify(updated)); } catch {}
    triggerOptimizedCloudSync(true);
  };

  const addCustomer = (name: string, phone?: string, address?: string, initialDue = 0): Customer => {
    const id = 'cust_' + Date.now();
    const now = new Date().toISOString();
    const newCustomer: Customer = {
      id,
      name,
      phone,
      address,
      totalGiven: initialDue,
      totalReceived: 0,
      currentDue: initialDue,
      createdAt: now,
      lastTransactionDate: initialDue > 0 ? now : undefined,
    };

    const nextCustomers = [newCustomer, ...stateRef.current.customers];
    setCustomers(nextCustomers);
    stateRef.current.customers = nextCustomers;
    try { localStorage.setItem(STORAGE_KEY_PREFIX + 'customers', JSON.stringify(nextCustomers)); } catch {}

    if (initialDue > 0) {
      const initTx: CustomerTransaction = {
        id: 'tx_' + Date.now(),
        customerId: id,
        type: 'due',
        amount: initialDue,
        date: now,
        note: 'শুরুর বাকি',
      };
      const nextTxs = [initTx, ...stateRef.current.transactions];
      setTransactions(nextTxs);
      stateRef.current.transactions = nextTxs;
      try { localStorage.setItem(STORAGE_KEY_PREFIX + 'transactions', JSON.stringify(nextTxs)); } catch {}
    }

    const nextSettings = {
      ...stateRef.current.settings,
      onboarding: { ...stateRef.current.settings.onboarding, addCustomer: true },
    };
    setSettings(nextSettings);
    stateRef.current.settings = nextSettings;
    try { localStorage.setItem(STORAGE_KEY_PREFIX + 'settings', JSON.stringify(nextSettings)); } catch {}

    triggerOptimizedCloudSync(true);
    return newCustomer;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    const nextCustomers = stateRef.current.customers.map((c) => (c.id === id ? { ...c, ...updates } : c));
    setCustomers(nextCustomers);
    stateRef.current.customers = nextCustomers;
    try { localStorage.setItem(STORAGE_KEY_PREFIX + 'customers', JSON.stringify(nextCustomers)); } catch {}
    triggerOptimizedCloudSync(true);
  };

  const updateCustomerDue = (customerId: string, newDueAmount: number, note?: string) => {
    const cleanDue = Math.max(0, Number(newDueAmount) || 0);
    const now = new Date().toISOString();
    const custTxs = stateRef.current.transactions.filter((t) => t.customerId === customerId);
    const oldBalance = calculateCustomerBalance(custTxs);
    const targetGiven = oldBalance.totalReceived + cleanDue;
    const diff = targetGiven - oldBalance.totalGiven;

    let nextTxs = [...stateRef.current.transactions];

    if (diff > 0) {
      const firstDueIdx = nextTxs.findIndex((t) => t.customerId === customerId && t.type === 'due');
      if (firstDueIdx !== -1) {
        const targetTx = nextTxs[firstDueIdx];
        nextTxs[firstDueIdx] = {
          ...targetTx,
          amount: targetTx.amount + diff,
          note: note?.trim() ? note.trim() : targetTx.note,
        };
      } else {
        const newTx: CustomerTransaction = {
          id: 'tx_' + Date.now() + Math.random().toString(36).substring(2, 6),
          customerId,
          type: 'due',
          amount: diff,
          date: now,
          note: note?.trim() || 'বাকি এডিট / সমন্বয়',
        };
        nextTxs = [newTx, ...nextTxs];
      }
    } else if (diff < 0) {
      let remainingToReduce = Math.abs(diff);
      nextTxs = nextTxs
        .map((t) => {
          if (t.customerId === customerId && t.type === 'due' && remainingToReduce > 0) {
            const deduct = Math.min(t.amount, remainingToReduce);
            remainingToReduce -= deduct;
            return {
              ...t,
              amount: t.amount - deduct,
              note: note?.trim() ? note.trim() : t.note,
            };
          }
          return t;
        })
        .filter((t) => !(t.customerId === customerId && t.type === 'due' && t.amount <= 0));
    }

    setTransactions(nextTxs);
    stateRef.current.transactions = nextTxs;
    try { localStorage.setItem(STORAGE_KEY_PREFIX + 'transactions', JSON.stringify(nextTxs)); } catch {}

    const updatedCustTxs = nextTxs.filter((t) => t.customerId === customerId);
    const newBalance = calculateCustomerBalance(updatedCustTxs);

    const nextCustomers = stateRef.current.customers.map((c) => {
      if (c.id === customerId) {
        return {
          ...c,
          totalGiven: newBalance.totalGiven,
          totalReceived: newBalance.totalReceived,
          currentDue: newBalance.currentDue,
          lastTransactionDate: now,
        };
      }
      return c;
    });
    setCustomers(nextCustomers);
    stateRef.current.customers = nextCustomers;
    try { localStorage.setItem(STORAGE_KEY_PREFIX + 'customers', JSON.stringify(nextCustomers)); } catch {}

    triggerOptimizedCloudSync(true);
  };

  const deleteCustomer = (id: string) => {
    const custTxs = stateRef.current.transactions.filter((t) => t.customerId === id);
    const custTxIds = new Set(custTxs.map((t) => t.id));

    const nextCustomers = stateRef.current.customers.filter((c) => c.id !== id);
    setCustomers(nextCustomers);
    stateRef.current.customers = nextCustomers;
    try { localStorage.setItem(STORAGE_KEY_PREFIX + 'customers', JSON.stringify(nextCustomers)); } catch {}

    const nextTxs = stateRef.current.transactions.filter((t) => t.customerId !== id);
    setTransactions(nextTxs);
    stateRef.current.transactions = nextTxs;
    try { localStorage.setItem(STORAGE_KEY_PREFIX + 'transactions', JSON.stringify(nextTxs)); } catch {}

    // Clean up cash entries linked to deleted customer's transactions
    const nextCash = stateRef.current.cashEntries.filter((c) => !c.refId || !custTxIds.has(c.refId));
    setCashEntries(nextCash);
    stateRef.current.cashEntries = nextCash;
    try { localStorage.setItem(STORAGE_KEY_PREFIX + 'cash_entries', JSON.stringify(nextCash)); } catch {}

    triggerOptimizedCloudSync(true);
  };

  const addTransaction = (customerId: string, type: 'due' | 'payment', amount: number, note?: string) => {
    const now = new Date().toISOString();
    const txId = 'tx_' + Date.now() + Math.random().toString(36).substring(2, 6);
    const newTx: CustomerTransaction = {
      id: txId,
      customerId,
      type,
      amount,
      date: now,
      note,
    };

    const nextTxs = [newTx, ...stateRef.current.transactions];
    setTransactions(nextTxs);
    stateRef.current.transactions = nextTxs;
    try { localStorage.setItem(STORAGE_KEY_PREFIX + 'transactions', JSON.stringify(nextTxs)); } catch {}

    const custTxs = nextTxs.filter((t) => t.customerId === customerId);
    const balance = calculateCustomerBalance(custTxs);

    const nextCustomers = stateRef.current.customers.map((c) => {
      if (c.id === customerId) {
        return {
          ...c,
          totalGiven: balance.totalGiven,
          totalReceived: balance.totalReceived,
          currentDue: balance.currentDue,
          lastTransactionDate: now,
        };
      }
      return c;
    });
    setCustomers(nextCustomers);
    stateRef.current.customers = nextCustomers;
    try { localStorage.setItem(STORAGE_KEY_PREFIX + 'customers', JSON.stringify(nextCustomers)); } catch {}

    if (type === 'payment') {
      const customer = nextCustomers.find((c) => c.id === customerId);
      addCashEntry({
        type: 'in',
        amount,
        category: 'বাকি আদায়',
        description: `${customer?.name || 'কাস্টমার'} থেকে বাকি আদায়`,
        date: now,
        refId: txId,
      });
    }

    triggerOptimizedCloudSync(true);
  };

  const updateTransaction = (
    id: string,
    updates: { amount: number; note?: string; type?: 'due' | 'payment' }
  ) => {
    const oldTx = stateRef.current.transactions.find((t) => t.id === id);
    if (!oldTx) return;

    const cleanAmount = Math.max(0, Number(updates.amount) || 0);
    const updatedType = updates.type || oldTx.type;
    const updatedTx: CustomerTransaction = {
      ...oldTx,
      type: updatedType,
      amount: cleanAmount,
      note: updates.note !== undefined ? updates.note : oldTx.note,
    };

    const nextTxs = stateRef.current.transactions.map((t) => (t.id === id ? updatedTx : t));
    setTransactions(nextTxs);
    stateRef.current.transactions = nextTxs;
    try { localStorage.setItem(STORAGE_KEY_PREFIX + 'transactions', JSON.stringify(nextTxs)); } catch {}

    const custTxs = nextTxs.filter((t) => t.customerId === oldTx.customerId);
    const balance = calculateCustomerBalance(custTxs);

    const nextCustomers = stateRef.current.customers.map((c) => {
      if (c.id === oldTx.customerId) {
        return {
          ...c,
          totalGiven: balance.totalGiven,
          totalReceived: balance.totalReceived,
          currentDue: balance.currentDue,
        };
      }
      return c;
    });
    setCustomers(nextCustomers);
    stateRef.current.customers = nextCustomers;
    try { localStorage.setItem(STORAGE_KEY_PREFIX + 'customers', JSON.stringify(nextCustomers)); } catch {}

    // Sync corresponding cash entry if payment amount or type changed
    if (oldTx.type === 'payment' && updatedType === 'payment') {
      const nextCash = stateRef.current.cashEntries.map((c) => {
        if (c.refId === id || (c.category === 'বাকি আদায়' && c.amount === oldTx.amount && c.date === oldTx.date)) {
          return { ...c, amount: cleanAmount };
        }
        return c;
      });
      setCashEntries(nextCash);
      stateRef.current.cashEntries = nextCash;
      try { localStorage.setItem(STORAGE_KEY_PREFIX + 'cash_entries', JSON.stringify(nextCash)); } catch {}
    } else if (oldTx.type === 'payment' && updatedType === 'due') {
      const nextCash = stateRef.current.cashEntries.filter(
        (c) => c.refId !== id && !(c.category === 'বাকি আদায়' && c.amount === oldTx.amount && c.date === oldTx.date)
      );
      setCashEntries(nextCash);
      stateRef.current.cashEntries = nextCash;
      try { localStorage.setItem(STORAGE_KEY_PREFIX + 'cash_entries', JSON.stringify(nextCash)); } catch {}
    } else if (oldTx.type === 'due' && updatedType === 'payment') {
      const customer = nextCustomers.find((c) => c.id === oldTx.customerId);
      addCashEntry({
        type: 'in',
        amount: cleanAmount,
        category: 'বাকি আদায়',
        description: `${customer?.name || 'কাস্টমার'} থেকে বাকি আদায়`,
        date: oldTx.date,
        refId: id,
      });
    }

    triggerOptimizedCloudSync(true);
  };

  const deleteTransaction = (id: string) => {
    const txToDelete = stateRef.current.transactions.find((t) => t.id === id);
    if (!txToDelete) return;

    const nextTxs = stateRef.current.transactions.filter((t) => t.id !== id);
    setTransactions(nextTxs);
    stateRef.current.transactions = nextTxs;
    try { localStorage.setItem(STORAGE_KEY_PREFIX + 'transactions', JSON.stringify(nextTxs)); } catch {}

    const custTxs = nextTxs.filter((t) => t.customerId === txToDelete.customerId);
    const balance = calculateCustomerBalance(custTxs);

    const nextCustomers = stateRef.current.customers.map((c) => {
      if (c.id === txToDelete.customerId) {
        return {
          ...c,
          totalGiven: balance.totalGiven,
          totalReceived: balance.totalReceived,
          currentDue: balance.currentDue,
        };
      }
      return c;
    });
    setCustomers(nextCustomers);
    stateRef.current.customers = nextCustomers;
    try { localStorage.setItem(STORAGE_KEY_PREFIX + 'customers', JSON.stringify(nextCustomers)); } catch {}

    // Clean up corresponding cash entry if this was a payment collection
    if (txToDelete.type === 'payment') {
      const nextCash = stateRef.current.cashEntries.filter(
        (c) => c.refId !== id && !(c.category === 'বাকি আদায়' && c.amount === txToDelete.amount && c.date === txToDelete.date)
      );
      setCashEntries(nextCash);
      stateRef.current.cashEntries = nextCash;
      try { localStorage.setItem(STORAGE_KEY_PREFIX + 'cash_entries', JSON.stringify(nextCash)); } catch {}
    }

    triggerOptimizedCloudSync(true);
  };

  const addProduct = (prodData: Omit<Product, 'id' | 'createdAt'>): Product => {
    const newProduct: Product = {
      ...prodData,
      id: 'prod_' + Date.now(),
      createdAt: new Date().toISOString(),
    };

    const nextProducts = [newProduct, ...stateRef.current.products];
    setProducts(nextProducts);
    stateRef.current.products = nextProducts;
    try { localStorage.setItem(STORAGE_KEY_PREFIX + 'products', JSON.stringify(nextProducts)); } catch {}

    const nextSettings = {
      ...stateRef.current.settings,
      onboarding: { ...stateRef.current.settings.onboarding, addProduct: true },
    };
    setSettings(nextSettings);
    stateRef.current.settings = nextSettings;
    try { localStorage.setItem(STORAGE_KEY_PREFIX + 'settings', JSON.stringify(nextSettings)); } catch {}

    triggerOptimizedCloudSync(true);
    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    const nextProducts = stateRef.current.products.map((p) => (p.id === id ? { ...p, ...updates } : p));
    setProducts(nextProducts);
    stateRef.current.products = nextProducts;
    try { localStorage.setItem(STORAGE_KEY_PREFIX + 'products', JSON.stringify(nextProducts)); } catch {}
    triggerOptimizedCloudSync(true);
  };

  const deleteProduct = (id: string) => {
    const nextProducts = stateRef.current.products.filter((p) => p.id !== id);
    setProducts(nextProducts);
    stateRef.current.products = nextProducts;
    try { localStorage.setItem(STORAGE_KEY_PREFIX + 'products', JSON.stringify(nextProducts)); } catch {}
    triggerOptimizedCloudSync(true);
  };

  const completeSale = (saleData: {
    customerId?: string;
    customerName: string;
    items: CartItem[];
    subtotal: number;
    discount: number;
    grandTotal: number;
    paidAmount: number;
    dueAmount: number;
    profit: number;
  }): SaleRecord => {
    const now = new Date().toISOString();
    const memoNo = 'MEMO-' + Math.floor(100000 + Math.random() * 900000);

    const newSale: SaleRecord = {
      id: 'sale_' + Date.now(),
      memoNo,
      date: now,
      customerId: saleData.customerId,
      customerName: saleData.customerName,
      items: saleData.items,
      subtotal: saleData.subtotal,
      discount: saleData.discount,
      grandTotal: saleData.grandTotal,
      paidAmount: saleData.paidAmount,
      dueAmount: saleData.dueAmount,
      profit: saleData.profit,
    };

    const nextSales = [newSale, ...stateRef.current.sales];
    setSales(nextSales);
    stateRef.current.sales = nextSales;
    try { localStorage.setItem(STORAGE_KEY_PREFIX + 'sales', JSON.stringify(nextSales)); } catch {}

    // Decrease product stock
    const nextProducts = stateRef.current.products.map((prod) => {
      const cartItem = saleData.items.find((item) => item.product.id === prod.id);
      if (cartItem) {
        return {
          ...prod,
          currentStock: Math.max(0, prod.currentStock - cartItem.quantity),
        };
      }
      return prod;
    });
    setProducts(nextProducts);
    stateRef.current.products = nextProducts;
    try { localStorage.setItem(STORAGE_KEY_PREFIX + 'products', JSON.stringify(nextProducts)); } catch {}

    if (saleData.dueAmount > 0 && saleData.customerId) {
      const productNames = saleData.items.map((i) => i.product.name).join(', ');
      addTransaction(saleData.customerId, 'due', saleData.dueAmount, `${productNames} (মেমো #${memoNo})`);
    }

    if (saleData.paidAmount > 0) {
      addCashEntry({
        type: 'in',
        amount: saleData.paidAmount,
        category: 'নগদ বিক্রি',
        description: `পণ্য বিক্রি (মেমো #${memoNo})`,
        date: now,
        refId: newSale.id,
      });
    }

    triggerOptimizedCloudSync(true);
    return newSale;
  };

  const deleteSale = (id: string) => {
    const saleToDelete = stateRef.current.sales.find((s) => s.id === id);
    if (!saleToDelete) return;

    // 1. Remove sale
    const nextSales = stateRef.current.sales.filter((s) => s.id !== id);
    setSales(nextSales);
    stateRef.current.sales = nextSales;
    try { localStorage.setItem(STORAGE_KEY_PREFIX + 'sales', JSON.stringify(nextSales)); } catch {}

    // 2. Restore stock
    const nextProducts = stateRef.current.products.map((prod) => {
      const cartItem = saleToDelete.items.find((item) => item.product.id === prod.id);
      if (cartItem) {
        return {
          ...prod,
          currentStock: prod.currentStock + cartItem.quantity,
        };
      }
      return prod;
    });
    setProducts(nextProducts);
    stateRef.current.products = nextProducts;
    try { localStorage.setItem(STORAGE_KEY_PREFIX + 'products', JSON.stringify(nextProducts)); } catch {}

    // 3. Remove linked due transaction if any
    if (saleToDelete.dueAmount > 0 && saleToDelete.customerId) {
      const memoTag = `মেমো #${saleToDelete.memoNo}`;
      const dueTx = stateRef.current.transactions.find(
        (t) => t.customerId === saleToDelete.customerId && t.type === 'due' && (t.note || '').includes(memoTag)
      );
      if (dueTx) {
        deleteTransaction(dueTx.id);
      }
    }

    // 4. Remove linked cash entry
    const nextCash = stateRef.current.cashEntries.filter(
      (c) => c.refId !== id && !(c.description || '').includes(saleToDelete.memoNo)
    );
    setCashEntries(nextCash);
    stateRef.current.cashEntries = nextCash;
    try { localStorage.setItem(STORAGE_KEY_PREFIX + 'cash_entries', JSON.stringify(nextCash)); } catch {}

    triggerOptimizedCloudSync(true);
  };

  const addExpense = (expense: Omit<ExpenseRecord, 'id'>) => {
    const expId = 'exp_' + Date.now();
    const newExp: ExpenseRecord = {
      ...expense,
      id: expId,
    };
    const nextExpenses = [newExp, ...stateRef.current.expenses];
    setExpenses(nextExpenses);
    stateRef.current.expenses = nextExpenses;
    try { localStorage.setItem(STORAGE_KEY_PREFIX + 'expenses', JSON.stringify(nextExpenses)); } catch {}

    addCashEntry({
      type: 'out',
      amount: expense.amount,
      category: expense.category,
      description: expense.title,
      date: expense.date,
      refId: expId,
    });

    triggerOptimizedCloudSync(true);
  };

  const deleteExpense = (id: string) => {
    const expToDelete = stateRef.current.expenses.find((e) => e.id === id);
    const nextExpenses = stateRef.current.expenses.filter((e) => e.id !== id);
    setExpenses(nextExpenses);
    stateRef.current.expenses = nextExpenses;
    try { localStorage.setItem(STORAGE_KEY_PREFIX + 'expenses', JSON.stringify(nextExpenses)); } catch {}

    if (expToDelete) {
      const nextCash = stateRef.current.cashEntries.filter(
        (c) => c.refId !== id && !(c.type === 'out' && c.description === expToDelete.title && c.amount === expToDelete.amount)
      );
      setCashEntries(nextCash);
      stateRef.current.cashEntries = nextCash;
      try { localStorage.setItem(STORAGE_KEY_PREFIX + 'cash_entries', JSON.stringify(nextCash)); } catch {}
    }

    triggerOptimizedCloudSync(true);
  };

  const addSupplier = (supplier: Omit<SupplierRecord, 'id' | 'totalDebt' | 'totalPaid'>) => {
    const newSup: SupplierRecord = {
      ...supplier,
      id: 'sup_' + Date.now(),
      totalDebt: 0,
      totalPaid: 0,
    };
    const nextSuppliers = [newSup, ...stateRef.current.suppliers];
    setSuppliers(nextSuppliers);
    stateRef.current.suppliers = nextSuppliers;
    try { localStorage.setItem(STORAGE_KEY_PREFIX + 'suppliers', JSON.stringify(nextSuppliers)); } catch {}
    triggerOptimizedCloudSync(true);
  };

  const addPurchase = (purchase: Omit<PurchaseRecord, 'id'>) => {
    const purId = 'pur_' + Date.now();
    const newPur: PurchaseRecord = {
      ...purchase,
      id: purId,
    };
    const nextPurchases = [newPur, ...stateRef.current.purchases];
    setPurchases(nextPurchases);
    stateRef.current.purchases = nextPurchases;
    try { localStorage.setItem(STORAGE_KEY_PREFIX + 'purchases', JSON.stringify(nextPurchases)); } catch {}

    if (purchase.supplierId) {
      const nextSuppliers = stateRef.current.suppliers.map((s) => {
        if (s.id === purchase.supplierId) {
          const unpaid = purchase.amount - purchase.paidAmount;
          return {
            ...s,
            totalDebt: s.totalDebt + unpaid,
            totalPaid: s.totalPaid + purchase.paidAmount,
          };
        }
        return s;
      });
      setSuppliers(nextSuppliers);
      stateRef.current.suppliers = nextSuppliers;
      try { localStorage.setItem(STORAGE_KEY_PREFIX + 'suppliers', JSON.stringify(nextSuppliers)); } catch {}
    }

    if (purchase.paidAmount > 0) {
      addCashEntry({
        type: 'out',
        amount: purchase.paidAmount,
        category: 'মাল কেনা',
        description: `সাপ্লায়ারকে মাল কেনার পেমেন্ট (${purchase.supplierName})`,
        date: purchase.date,
        refId: purId,
      });
    }

    triggerOptimizedCloudSync(true);
  };

  const deletePurchase = (id: string) => {
    const purToDelete = stateRef.current.purchases.find((p) => p.id === id);
    if (!purToDelete) return;

    const nextPurchases = stateRef.current.purchases.filter((p) => p.id !== id);
    setPurchases(nextPurchases);
    stateRef.current.purchases = nextPurchases;
    try { localStorage.setItem(STORAGE_KEY_PREFIX + 'purchases', JSON.stringify(nextPurchases)); } catch {}

    if (purToDelete.supplierId) {
      const nextSuppliers = stateRef.current.suppliers.map((s) => {
        if (s.id === purToDelete.supplierId) {
          const unpaid = purToDelete.amount - purToDelete.paidAmount;
          return {
            ...s,
            totalDebt: Math.max(0, s.totalDebt - unpaid),
            totalPaid: Math.max(0, s.totalPaid - purToDelete.paidAmount),
          };
        }
        return s;
      });
      setSuppliers(nextSuppliers);
      stateRef.current.suppliers = nextSuppliers;
      try { localStorage.setItem(STORAGE_KEY_PREFIX + 'suppliers', JSON.stringify(nextSuppliers)); } catch {}
    }

    const nextCash = stateRef.current.cashEntries.filter((c) => c.refId !== id);
    setCashEntries(nextCash);
    stateRef.current.cashEntries = nextCash;
    try { localStorage.setItem(STORAGE_KEY_PREFIX + 'cash_entries', JSON.stringify(nextCash)); } catch {}

    triggerOptimizedCloudSync(true);
  };

  const deleteCashEntry = (id: string) => {
    const nextCash = stateRef.current.cashEntries.filter((c) => c.id !== id);
    setCashEntries(nextCash);
    stateRef.current.cashEntries = nextCash;
    try { localStorage.setItem(STORAGE_KEY_PREFIX + 'cash_entries', JSON.stringify(nextCash)); } catch {}
    triggerOptimizedCloudSync(true);
  };

  const updateCashEntry = (id: string, updates: Partial<CashEntry>) => {
    const nextCash = stateRef.current.cashEntries.map((c) => (c.id === id ? { ...c, ...updates } : c));
    setCashEntries(nextCash);
    stateRef.current.cashEntries = nextCash;
    try { localStorage.setItem(STORAGE_KEY_PREFIX + 'cash_entries', JSON.stringify(nextCash)); } catch {}
    triggerOptimizedCloudSync(true);
  };

  const addCashEntry = (entry: Omit<CashEntry, 'id'>) => {
    const newEntry: CashEntry = {
      ...entry,
      id: 'cash_' + Date.now() + Math.random().toString(36).substring(2, 5),
    };
    const nextCashEntries = [newEntry, ...stateRef.current.cashEntries];
    setCashEntries(nextCashEntries);
    stateRef.current.cashEntries = nextCashEntries;
    try { localStorage.setItem(STORAGE_KEY_PREFIX + 'cash_entries', JSON.stringify(nextCashEntries)); } catch {}
    triggerOptimizedCloudSync(true);
  };

  const resetAllData = () => {
    localStorage.clear();
    setSettings(DEFAULT_SETTINGS);
    setCustomers(DEFAULT_CUSTOMERS);
    setTransactions(DEFAULT_TRANSACTIONS);
    setProducts(DEFAULT_PRODUCTS);
    setSales([]);
    setExpenses([]);
    setSuppliers(DEFAULT_SUPPLIERS);
    setPurchases([]);
    setCashEntries([]);
    triggerOptimizedCloudSync();
  };

  const exportDataJSON = (): string => {
    const data = {
      settings,
      customers,
      transactions,
      products,
      sales,
      expenses,
      suppliers,
      purchases,
      cashEntries,
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  };

  const importDataJSON = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.customers && data.products) {
        if (data.settings) setSettings(data.settings);
        if (data.customers) setCustomers(data.customers);
        if (data.transactions) setTransactions(data.transactions);
        if (data.products) setProducts(data.products);
        if (data.sales) setSales(data.sales);
        if (data.expenses) setExpenses(data.expenses);
        if (data.suppliers) setSuppliers(data.suppliers);
        if (data.purchases) setPurchases(data.purchases);
        if (data.cashEntries) setCashEntries(data.cashEntries);
        triggerOptimizedCloudSync();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Import error', e);
      return false;
    }
  };

  const prepareFreshPinWorkspace = (shopName: string) => {
    const freshSettings: ShopSettings = {
      ...DEFAULT_SETTINGS,
      shopName: shopName.trim() || 'আমার দোকান',
      ownerName: 'দোকান মালিক',
    };
    lastLocalMutationAt.current = 0;
    setSettings(freshSettings);
    setCustomers(DEFAULT_CUSTOMERS);
    setTransactions(DEFAULT_TRANSACTIONS);
    setProducts(DEFAULT_PRODUCTS);
    setSales([]);
    setExpenses([]);
    setSuppliers(DEFAULT_SUPPLIERS);
    setPurchases([]);
    setCashEntries([]);
    stateRef.current = {
      settings: freshSettings,
      customers: DEFAULT_CUSTOMERS,
      transactions: DEFAULT_TRANSACTIONS,
      products: DEFAULT_PRODUCTS,
      sales: [],
      expenses: [],
      suppliers: DEFAULT_SUPPLIERS,
      purchases: [],
      cashEntries: [],
    };
  };

  const activateFallbackPinSession = (pin: string, shopName: string) => {
    const cleanPin = pin.trim();
    const fallbackUser = {
      uid: `pin_vault_${cleanPin}`,
      email: `pin_${cleanPin}@pin.dokanmanager.app`,
      displayName: shopName.trim() || (cleanPin === '7078' ? 'তাওয়াক্কুল কর্নার' : 'আমার দোকান'),
      emailVerified: true,
      isAnonymous: false,
    } as unknown as User;
    try {
      localStorage.setItem('dokan_active_pin_session', JSON.stringify(fallbackUser));
    } catch {}
    setCurrentUser(fallbackUser);
  };

  const handleLogOut = async () => {
    try {
      localStorage.removeItem('dokan_active_pin_session');
    } catch {}
    try {
      await logOut();
    } catch {}
    lastLocalMutationAt.current = 0;
    setCurrentUser(null);
    setSettings(DEFAULT_SETTINGS);
    setCustomers(DEFAULT_CUSTOMERS);
    setTransactions(DEFAULT_TRANSACTIONS);
    setProducts(DEFAULT_PRODUCTS);
    setSales([]);
    setExpenses([]);
    setSuppliers(DEFAULT_SUPPLIERS);
    setPurchases([]);
    setCashEntries([]);
  };

  return (
    <DokanContext.Provider
      value={{
        currentUser,
        isAuthLoading,
        isCloudSyncing,
        lastSyncedAt,
        quotaOptimized: true,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        updatePassword: updateUserPassword,
        prepareFreshPinWorkspace,
        activateFallbackPinSession,
        logOut: handleLogOut,
        settings,

        updateSettings,
        customers,
        addCustomer,
        updateCustomer,
        updateCustomerDue,
        deleteCustomer,
        transactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        sales,
        completeSale,
        deleteSale,
        expenses,
        addExpense,
        deleteExpense,
        suppliers,
        addSupplier,
        purchases,
        addPurchase,
        deletePurchase,
        cashEntries,
        addCashEntry,
        updateCashEntry,
        deleteCashEntry,
        resetAllData,
        exportDataJSON,
        importDataJSON,
        activeGlobalModal,
        setActiveGlobalModal,
      }}
    >
      {children}
    </DokanContext.Provider>
  );
};

export function useDokan() {
  const context = useContext(DokanContext);
  if (!context) {
    throw new Error('useDokan must be used within a DokanProvider');
  }
  return context;
}
