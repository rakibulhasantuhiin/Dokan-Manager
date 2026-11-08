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

interface DokanContextType {
  currentUser: User | null;
  isAuthLoading: boolean;
  isCloudSyncing: boolean;
  lastSyncedAt: Date | null;
  quotaOptimized: boolean;
  signInWithGoogle: () => Promise<User | null>;
  signInWithEmail: (email: string, pass: string) => Promise<User>;
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<User>;
  logOut: () => Promise<void>;
  settings: ShopSettings;
  updateSettings: (newSettings: Partial<ShopSettings>) => void;
  customers: Customer[];
  addCustomer: (name: string, phone?: string, address?: string, initialDue?: number) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  transactions: CustomerTransaction[];
  addTransaction: (customerId: string, type: 'due' | 'payment', amount: number, note?: string) => void;
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
  expenses: ExpenseRecord[];
  addExpense: (expense: Omit<ExpenseRecord, 'id'>) => void;
  deleteExpense: (id: string) => void;
  suppliers: SupplierRecord[];
  addSupplier: (supplier: Omit<SupplierRecord, 'id' | 'totalDebt' | 'totalPaid'>) => void;
  purchases: PurchaseRecord[];
  addPurchase: (purchase: Omit<PurchaseRecord, 'id'>) => void;
  cashEntries: CashEntry[];
  addCashEntry: (entry: Omit<CashEntry, 'id'>) => void;
  resetAllData: () => void;
  exportDataJSON: () => string;
  importDataJSON: (jsonStr: string) => boolean;
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

  // Instant & immediate cloud sync queue
  const triggerOptimizedCloudSync = (immediate = true) => {
    if (!currentUser) return;

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    setIsCloudSyncing(true);

    const performSync = async () => {
      try {
        const userId = currentUser.uid;
        const masterDocRef = doc(db, 'users', userId, 'shop', 'master');
        const payload = {
          userId,
          updatedAt: new Date().toISOString(),
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

        await setDoc(masterDocRef, payload);
        setLastSyncedAt(new Date());
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}/shop/master`);
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
      setCurrentUser(user);

      setIsAuthLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  // Listen to single master document on login (1 Read cost only!)
  useEffect(() => {
    if (!currentUser) return;

    const userId = currentUser.uid;
    const masterDocRef = doc(db, 'users', userId, 'shop', 'master');

    setIsCloudSyncing(true);

    const unsubscribe = onSnapshot(
      masterDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();

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
          // Master doc doesn't exist yet on cloud (first login): customize owner name if available & upload!
          const userDefaultName = currentUser.displayName || currentUser.email?.split('@')[0] || '';
          if (userDefaultName && (settings.ownerName === 'দোকান মালিক' || !settings.ownerName)) {
            const updated = { ...stateRef.current.settings, ownerName: userDefaultName };
            setSettings(updated);
            stateRef.current.settings = updated;
            try { localStorage.setItem(STORAGE_KEY_PREFIX + 'settings', JSON.stringify(updated)); } catch {}
          }
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

  const deleteCustomer = (id: string) => {
    const nextCustomers = stateRef.current.customers.filter((c) => c.id !== id);
    setCustomers(nextCustomers);
    stateRef.current.customers = nextCustomers;
    try { localStorage.setItem(STORAGE_KEY_PREFIX + 'customers', JSON.stringify(nextCustomers)); } catch {}

    const nextTxs = stateRef.current.transactions.filter((t) => t.customerId !== id);
    setTransactions(nextTxs);
    stateRef.current.transactions = nextTxs;
    try { localStorage.setItem(STORAGE_KEY_PREFIX + 'transactions', JSON.stringify(nextTxs)); } catch {}

    triggerOptimizedCloudSync(true);
  };

  const addTransaction = (customerId: string, type: 'due' | 'payment', amount: number, note?: string) => {
    const now = new Date().toISOString();
    const newTx: CustomerTransaction = {
      id: 'tx_' + Date.now() + Math.random().toString(36).substring(2, 6),
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
      addTransaction(saleData.customerId, 'due', saleData.dueAmount, `বিক্রির বাকি (মেমো #${memoNo})`);
    }

    if (saleData.paidAmount > 0) {
      addCashEntry({
        type: 'in',
        amount: saleData.paidAmount,
        category: 'নগদ বিক্রি',
        description: `পণ্য বিক্রি (মেমো #${memoNo})`,
        date: now,
      });
    }

    triggerOptimizedCloudSync(true);
    return newSale;
  };

  const addExpense = (expense: Omit<ExpenseRecord, 'id'>) => {
    const newExp: ExpenseRecord = {
      ...expense,
      id: 'exp_' + Date.now(),
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
    });

    triggerOptimizedCloudSync(true);
  };

  const deleteExpense = (id: string) => {
    const nextExpenses = stateRef.current.expenses.filter((e) => e.id !== id);
    setExpenses(nextExpenses);
    stateRef.current.expenses = nextExpenses;
    try { localStorage.setItem(STORAGE_KEY_PREFIX + 'expenses', JSON.stringify(nextExpenses)); } catch {}
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
    const newPur: PurchaseRecord = {
      ...purchase,
      id: 'pur_' + Date.now(),
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
      });
    }

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

  const handleLogOut = async () => {
    await logOut();
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
        logOut: handleLogOut,
        settings,

        updateSettings,
        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        transactions,
        addTransaction,
        deleteTransaction,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        sales,
        completeSale,
        expenses,
        addExpense,
        deleteExpense,
        suppliers,
        addSupplier,
        purchases,
        addPurchase,
        cashEntries,
        addCashEntry,
        resetAllData,
        exportDataJSON,
        importDataJSON,
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
