export type MainCategory = 'মুদি' | 'স্টেশনারি' | 'কম্পিউটার সার্ভিস';
export type MeasurementType = 'weight' | 'count' | 'liquid' | 'service';
export type UnitType = 'কেজি' | 'গ্রাম' | 'পিস' | 'লিটার' | 'প্যাকেট' | 'বস্তা' | 'ডজন' | 'রিম' | 'ঘণ্টা' | 'কাজ' | 'পাতা';

export interface Product {
  id: string;
  name: string;
  category: string;
  mainCategory?: MainCategory;
  measurementType: MeasurementType;
  unit: UnitType;
  purchasePrice: number;
  sellingPrice: number;
  currentStock: number;
  lowStockAlert: number;
  barcode?: string;
  createdAt: string;
}

export type TransactionType = 'due' | 'payment';

export interface CustomerTransaction {
  id: string;
  customerId: string;
  type: TransactionType;
  amount: number;
  date: string;
  note?: string;
  memoNo?: string;
}

export type Transaction = CustomerTransaction;

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  totalGiven: number; // মোট বাকি দিয়েছি
  totalReceived: number; // মোট টাকা পেয়েছি
  currentDue: number; // মোট বাকি = totalGiven - totalReceived
  createdAt: string;
  lastTransactionDate?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  price: number;
  total: number;
}

export interface SaleRecord {
  id: string;
  memoNo: string;
  date: string;
  customerId?: string;
  customerName: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  profit: number;
}

export interface ExpenseRecord {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  note?: string;
}

export interface SupplierRecord {
  id: string;
  name: string;
  phone?: string;
  company?: string;
  totalDebt: number; // কার কাছে কত দেনা
  totalPaid: number;
}

export interface PurchaseRecord {
  id: string;
  supplierId?: string;
  supplierName: string;
  itemsSummary: string;
  amount: number;
  paidAmount: number;
  date: string;
}

export interface CashEntry {
  id: string;
  type: 'in' | 'out';
  amount: number;
  category: string;
  description: string;
  date: string;
}

export interface ShopSettings {
  shopName: string;
  ownerName: string;
  phone: string;
  address: string;
  hideOnboarding: boolean;
  onboarding: {
    addProduct: boolean;
    firstSale: boolean;
    addCustomer: boolean;
  };
}

export interface ComputerServiceLogItem {
  id: string;
  memoNo: string;
  date: string;
  customerName: string;
  serviceName: string;
  quantity: number;
  unit: string;
  price: number;
  total: number;
  profit: number;
}

export interface ComputerServiceMetrics {
  balance: number;
  totalRevenue: number;
  totalProfit: number;
  todaySales: number;
  todayProfit: number;
  todaySalesCount: number;
  salesList: ComputerServiceLogItem[];
}

export interface DashboardMetrics {
  shopCashBalance: number;
  totalDue: number;
  customersWithDueCount: number;
  totalStockPurchaseValue: number;
  totalStockSellingValue: number;
  todaySalesAmount: number;
  todaySalesCount: number;
  todayProfit: number;
  todayDueGiven: number;
  todayMoneyReceived: number;
  highestDueCustomers: Customer[];
  computerService: ComputerServiceMetrics;
}
