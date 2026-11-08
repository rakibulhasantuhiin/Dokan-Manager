import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCustomerBalance, calculateSaleProfit, calculateDashboardMetrics } from './calculations';
import { Customer, CustomerTransaction, SaleRecord, Product } from '../types';

test('calculateCustomerBalance sums due and payments accurately', () => {
  const transactions: CustomerTransaction[] = [
    { id: '1', customerId: 'c1', type: 'due', amount: 6384, date: new Date().toISOString() },
    { id: '2', customerId: 'c1', type: 'payment', amount: 1000, date: new Date().toISOString() },
  ];

  const result = calculateCustomerBalance(transactions);
  assert.equal(result.totalGiven, 6384);
  assert.equal(result.totalReceived, 1000);
  assert.equal(result.currentDue, 5384);
});

test('calculateSaleProfit computes difference between selling and buying price', () => {
  const dummyProduct: Product = {
    id: 'p1',
    name: 'মিনিকেট চাল',
    category: 'চাল',
    measurementType: 'weight',
    unit: 'কেজি',
    purchasePrice: 60,
    sellingPrice: 70,
    currentStock: 100,
    lowStockAlert: 10,
    createdAt: new Date().toISOString(),
  };

  const profit = calculateSaleProfit([
    { product: dummyProduct, quantity: 5, price: 70 },
  ]);

  // (70 - 60) * 5 = 50
  assert.equal(profit, 50);
});

test('calculateDashboardMetrics aggregates accurately with computer service segregation and stock value', () => {
  const customer: Customer = {
    id: 'c1',
    name: 'আলামিন ফকির',
    totalGiven: 6384,
    totalReceived: 0,
    currentDue: 6384,
    createdAt: new Date().toISOString(),
  };

  const groceryProduct: Product = {
    id: 'p1',
    name: 'চাল',
    category: 'মুদি',
    mainCategory: 'মুদি',
    measurementType: 'weight',
    unit: 'কেজি',
    purchasePrice: 60,
    sellingPrice: 70,
    currentStock: 10,
    lowStockAlert: 5,
    createdAt: new Date().toISOString(),
  };

  const serviceProduct: Product = {
    id: 'p2',
    name: 'ফটোকপি',
    category: 'ফটোকপি',
    mainCategory: 'কম্পিউটার সার্ভিস',
    measurementType: 'service',
    unit: 'পাতা',
    purchasePrice: 2,
    sellingPrice: 5,
    currentStock: 999,
    lowStockAlert: 10,
    createdAt: new Date().toISOString(),
  };

  const now = new Date().toISOString();
  const txs: CustomerTransaction[] = [
    { id: 'tx1', customerId: 'c1', type: 'due', amount: 6384, date: now },
  ];

  const sale: SaleRecord = {
    id: 's1',
    memoNo: 'MEMO-123456',
    date: now,
    customerName: 'নগদ ক্রেতা',
    items: [
      { product: serviceProduct, quantity: 10, price: 5, total: 50 },
    ],
    subtotal: 50,
    discount: 0,
    grandTotal: 50,
    paidAmount: 50,
    dueAmount: 0,
    profit: 30,
  };

  const metrics = calculateDashboardMetrics(
    [customer],
    txs,
    [sale],
    [groceryProduct, serviceProduct],
    [],
    now
  );

  assert.equal(metrics.totalDue, 6384);
  assert.equal(metrics.customersWithDueCount, 1);
  assert.equal(metrics.todayDueGiven, 6384);
  assert.equal(metrics.highestDueCustomers.length, 1);
  assert.equal(metrics.highestDueCustomers[0].name, 'আলামিন ফকির');

  // Stock value should only count physical product (10 * 60 = 600)
  assert.equal(metrics.totalStockPurchaseValue, 600);
  assert.equal(metrics.totalStockSellingValue, 700);

  // Computer service cash should be separated
  assert.equal(metrics.computerService.balance, 50);
  assert.equal(metrics.computerService.totalRevenue, 50);
  assert.equal(metrics.computerService.totalProfit, 30);
  assert.equal(metrics.computerService.todaySales, 50);
  assert.equal(metrics.computerService.salesList.length, 1);
});
