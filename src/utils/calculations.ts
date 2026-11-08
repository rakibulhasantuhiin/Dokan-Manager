import {
  Customer,
  CustomerTransaction,
  SaleRecord,
  Product,
  DashboardMetrics,
  CashEntry,
  ComputerServiceLogItem,
  ComputerServiceMetrics,
  ExpenseRecord,
} from '../types';
import { toBengaliNumber } from './bengali';



/**
 * Calculates net due and history summaries for a customer from transactions
 */
export function calculateCustomerBalance(
  transactions: CustomerTransaction[]
): { totalGiven: number; totalReceived: number; currentDue: number } {
  let totalGiven = 0;
  let totalReceived = 0;

  for (const tx of transactions) {
    if (tx.type === 'due') {
      totalGiven += tx.amount;
    } else if (tx.type === 'payment') {
      totalReceived += tx.amount;
    }
  }

  return {
    totalGiven,
    totalReceived,
    currentDue: Math.max(0, totalGiven - totalReceived),
  };
}

/**
 * Calculates profit of a sale item or entire cart
 */
export function calculateSaleProfit(items: { product: Product; quantity: number; price: number }[]): number {
  return items.reduce((acc, item) => {
    const profitPerUnit = item.price - (item.product.purchasePrice || 0);
    return acc + profitPerUnit * item.quantity;
  }, 0);
}

/**
 * Aggregates dashboard metrics for the current day and overall financials
 */
export function calculateDashboardMetrics(
  customers: Customer[],
  transactions: CustomerTransaction[],
  sales: SaleRecord[],
  products: Product[] = [],
  cashEntries: CashEntry[] = [],
  targetDateStr?: string
): DashboardMetrics {
  const targetDate = targetDateStr ? new Date(targetDateStr) : new Date();
  const targetDay = targetDate.getDate();
  const targetMonth = targetDate.getMonth();
  const targetYear = targetDate.getFullYear();

  // Strict midnight boundary (রাত ১২টা বাজার আগে আজকের দিনে, ১২টার পরে নতুন দিন)
  const isSameDay = (isoDate: string) => {
    const d = new Date(isoDate);
    return (
      d.getDate() === targetDay &&
      d.getMonth() === targetMonth &&
      d.getFullYear() === targetYear
    );
  };

  // 1. Total Due across all customers
  let totalDue = 0;
  let customersWithDueCount = 0;
  for (const c of customers) {
    if (c.currentDue > 0) {
      totalDue += c.currentDue;
      customersWithDueCount++;
    }
  }

  // 2. Stock Values (only physical goods, excluding service items)
  let totalStockPurchaseValue = 0;
  let totalStockSellingValue = 0;
  for (const p of products) {
    if (p.measurementType !== 'service' && (p.mainCategory || 'মুদি') !== 'কম্পিউটার সার্ভিস') {
      const stock = Math.max(0, p.currentStock || 0);
      totalStockPurchaseValue += stock * (p.purchasePrice || 0);
      totalStockSellingValue += stock * (p.sellingPrice || 0);
    }
  }

  // 3. Computer Service Specific Accounting
  // User Requirement:
  // "কম্পিউটার সার্ভিসের মোট আয় বা লাভ আলাদাভাবে হিসাব করবে।
  // কম্পিউটার সার্ভিসের ক্যাশ একসাথে ব্যালেন্সের সাথে অ্যাড করবে না, এটার ক্যাশ আলাদা হিসাব করবে।"
  let computerBalance = 0;
  let computerTotalRevenue = 0;
  let computerTotalProfit = 0;
  let computerTodaySales = 0;
  let computerTodayProfit = 0;
  let computerTodaySalesCount = 0;
  const computerSalesList: ComputerServiceLogItem[] = [];

  // Track Computer Service Cash Outflows / Inflows from cashEntries if any
  for (const entry of cashEntries) {
    const desc = (entry.description || '').toLowerCase();
    const cat = (entry.category || '').toLowerCase();
    const isComp = desc.includes('কম্পিউটার') || cat.includes('কম্পিউটার') || desc.includes('ফটোকপি') || cat.includes('প্রিন্ট');
    if (isComp) {
      if (entry.type === 'in') computerBalance += entry.amount;
      else if (entry.type === 'out') computerBalance -= entry.amount;
    }
  }

  // Process Sales
  let todaySalesAmount = 0;
  let todaySalesCount = 0;
  let todayProfit = 0;
  let generalCashInFromSales = 0;

  for (const s of sales) {
    const isToday = isSameDay(s.date);

    if (isToday) {
      todaySalesAmount += s.grandTotal;
      todaySalesCount++;
      todayProfit += s.profit;
    }

    // Inspect individual items to segregate Computer Service
    let saleComputerPortionPaid = 0;
    for (const item of s.items) {
      const isComputerItem =
        item.product.mainCategory === 'কম্পিউটার সার্ভিস' ||
        item.product.measurementType === 'service' ||
        (item.product.category || '').includes('কম্পিউটার') ||
        (item.product.category || '').includes('ফটোকপি') ||
        (item.product.category || '').includes('প্রিন্ট');

      if (isComputerItem) {
        const itemTotal = item.total;
        const itemProfit = (item.price - (item.product.purchasePrice || 0)) * item.quantity;

        computerTotalRevenue += itemTotal;
        computerTotalProfit += itemProfit;

        // Pro-rata cash paid for this computer service item
        const paidRatio = s.grandTotal > 0 ? s.paidAmount / s.grandTotal : 1;
        const paidForItem = itemTotal * paidRatio;
        saleComputerPortionPaid += paidForItem;

        if (isToday) {
          computerTodaySales += itemTotal;
          computerTodayProfit += itemProfit;
        }

        computerSalesList.push({
          id: `${s.id}_${item.product.id}`,
          memoNo: s.memoNo,
          date: s.date,
          customerName: s.customerName,
          serviceName: item.product.name,
          quantity: item.quantity,
          unit: item.product.unit,
          price: item.price,
          total: itemTotal,
          profit: itemProfit,
        });
      }
    }

    computerBalance += saleComputerPortionPaid;
    // General shop cash gets the remaining paid amount (excluding computer service)
    generalCashInFromSales += Math.max(0, s.paidAmount - saleComputerPortionPaid);

    if (isToday && saleComputerPortionPaid > 0) {
      computerTodaySalesCount++;
    }
  }

  // 4. General Shop Cash Balance Calculation
  // General Shop Inflow: General cash sales + customer debt repayments
  // General Shop Outflow: General shop expenses + supplier purchases
  let generalCashIn = generalCashInFromSales;
  let generalCashOut = 0;

  for (const entry of cashEntries) {
    const desc = (entry.description || '').toLowerCase();
    const cat = (entry.category || '').toLowerCase();
    const isComp = desc.includes('কম্পিউটার') || cat.includes('কম্পিউটার') || desc.includes('ফটোকপি') || cat.includes('প্রিন্ট');

    if (!isComp) {
      if (entry.type === 'in') {
        // If it's already counted in generalCashInFromSales, don't duplicate
        if (!cat.includes('নগদ বিক্রি')) {
          generalCashIn += entry.amount;
        }
      } else if (entry.type === 'out') {
        generalCashOut += entry.amount;
      }
    }
  }

  const shopCashBalance = Math.max(0, generalCashIn - generalCashOut);

  // 5. Today's Transactions (Given due & Received cash)
  let todayDueGiven = 0;
  let todayMoneyReceived = 0;

  for (const tx of transactions) {
    if (isSameDay(tx.date)) {
      if (tx.type === 'due') {
        todayDueGiven += tx.amount;
      } else if (tx.type === 'payment') {
        todayMoneyReceived += tx.amount;
      }
    }
  }

  // Include cash sales received today
  for (const s of sales) {
    if (isSameDay(s.date) && s.paidAmount > 0) {
      todayMoneyReceived += s.paidAmount;
    }
  }

  // Customers sorted by highest due
  const highestDueCustomers = [...customers]
    .filter((c) => c.currentDue > 0)
    .sort((a, b) => b.currentDue - a.currentDue);

  // Sort computer sales list descending by date
  computerSalesList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const computerService: ComputerServiceMetrics = {
    balance: computerBalance,
    totalRevenue: computerTotalRevenue,
    totalProfit: computerTotalProfit,
    todaySales: computerTodaySales,
    todayProfit: computerTodayProfit,
    todaySalesCount: computerTodaySalesCount,
    salesList: computerSalesList,
  };

  return {
    shopCashBalance,
    totalDue,
    customersWithDueCount,
    totalStockPurchaseValue,
    totalStockSellingValue,
    todaySalesAmount,
    todaySalesCount,
    todayProfit,
    todayDueGiven,
    todayMoneyReceived,
    highestDueCustomers,
    computerService,
  };
}

export interface MonthlyReportItem {
  yearMonth: string;
  monthNameBengali: string;
  totalSales: number;
  salesCount: number;
  totalProfit: number;
  serviceIncome: number;
  serviceProfit: number;
  totalExpenses: number;
  dueGiven: number;
  dueCollected: number;
  netProfit: number;
}

export function calculateMonthlyReport(
  sales: SaleRecord[],
  expenses: ExpenseRecord[] = [],
  transactions: CustomerTransaction[] = []
): MonthlyReportItem[] {
  const monthMap = new Map<string, MonthlyReportItem>();

  const BENGALI_MONTHS = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];

  const getMonthKey = (dateStr: string) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  };

  const getBengaliMonthName = (key: string) => {
    const parts = key.split('-');
    if (parts.length !== 2) return key;
    const yearNum = parseInt(parts[0], 10);
    const monthIdx = parseInt(parts[1], 10) - 1;
    const monthName = BENGALI_MONTHS[monthIdx] || '';
    const yearBengali = toBengaliNumber(yearNum);
    return `${monthName} ${yearBengali}`;
  };

  const getOrCreate = (key: string): MonthlyReportItem => {
    let existing = monthMap.get(key);
    if (!existing) {
      existing = {
        yearMonth: key,
        monthNameBengali: getBengaliMonthName(key),
        totalSales: 0,
        salesCount: 0,
        totalProfit: 0,
        serviceIncome: 0,
        serviceProfit: 0,
        totalExpenses: 0,
        dueGiven: 0,
        dueCollected: 0,
        netProfit: 0,
      };
      monthMap.set(key, existing);
    }
    return existing;
  };

  // 1. Sales
  for (const s of sales) {
    const key = getMonthKey(s.date);
    if (!key) continue;
    const item = getOrCreate(key);
    item.totalSales += s.grandTotal || 0;
    item.salesCount += 1;
    item.totalProfit += s.profit || 0;

    for (const cartItem of s.items || []) {
      const isComp =
        cartItem.product?.mainCategory === 'কম্পিউটার সার্ভিস' ||
        cartItem.product?.measurementType === 'service' ||
        (cartItem.product?.category || '').includes('কম্পিউটার') ||
        (cartItem.product?.category || '').includes('ফটোকপি') ||
        (cartItem.product?.category || '').includes('প্রিন্ট');

      if (isComp) {
        const lineTotal = cartItem.total || (cartItem.price * cartItem.quantity);
        const lineProfit = (cartItem.price - (cartItem.product?.purchasePrice || 0)) * cartItem.quantity;
        item.serviceIncome += lineTotal;
        item.serviceProfit += lineProfit;
      }
    }
  }

  // 2. Expenses
  for (const e of expenses) {
    const key = getMonthKey(e.date);
    if (!key) continue;
    const item = getOrCreate(key);
    item.totalExpenses += e.amount || 0;
  }

  // 3. Transactions
  for (const t of transactions) {
    const key = getMonthKey(t.date);
    if (!key) continue;
    const item = getOrCreate(key);
    if (t.type === 'due') {
      item.dueGiven += t.amount || 0;
    } else if (t.type === 'payment') {
      item.dueCollected += t.amount || 0;
    }
  }

  // Convert to array and calculate net profit
  const results = Array.from(monthMap.values()).map((item) => ({
    ...item,
    netProfit: item.totalProfit - item.totalExpenses,
  }));

  // Sort descending by month key (e.g. 2026-11, 2026-10...)
  results.sort((a, b) => b.yearMonth.localeCompare(a.yearMonth));
  return results;
}

