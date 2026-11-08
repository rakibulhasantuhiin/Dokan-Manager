import test from 'node:test';
import assert from 'node:assert';
import {
  PublicLedgerData,
  encodeLedgerToken,
  decodeLedgerToken,
  buildCustomerShareUrl,
  calculateLedgerBalances,
} from './customerShare';
import { Customer, Transaction, ShopSettings } from '../types';
  const mockCustomer: Customer = {
    id: 'cust_1',
    name: 'আলামিন ফকির',
    phone: '01812345678',
    address: 'মিরপুর, ঢাকা',
    currentDue: 6384,
    totalGiven: 10000,
    totalReceived: 3616,
    createdAt: '2026-11-01T10:00:00.000Z',
  };

  const mockSettings: ShopSettings = {
    shopName: 'তাওয়াক্কুল কর্নার',
    ownerName: 'রাকিবুল',
    phone: '01700000000',
    address: 'বাজার রোড, ঢাকা',
    hideOnboarding: true,
    onboarding: { addProduct: true, firstSale: true, addCustomer: true },
  };

  const mockTransactions: Transaction[] = [
    {
      id: 'tx_1',
      customerId: 'cust_1',
      type: 'due',
      amount: 10000,
      date: '2026-11-01T10:00:00.000Z',
      note: 'চাল ও তেলের বাকি',
      memoNo: 'MEMO-1001',
    },
    {
      id: 'tx_2',
      customerId: 'cust_1',
      type: 'payment',
      amount: 3616,
      date: '2026-11-05T12:00:00.000Z',
      note: 'বকেয়া পরিশোধ',
      memoNo: 'MEMO-1002',
    },
  ];

  test('calculateLedgerBalances computes running balance after each transaction', () => {
    const calculated = calculateLedgerBalances(mockTransactions);
    assert.strictEqual(calculated.length, 2);
    assert.strictEqual(calculated[0].balanceAfter, 10000);
    assert.strictEqual(calculated[1].balanceAfter, 6384);
  });

  test('encodeLedgerToken and decodeLedgerToken roundtrip properly', () => {
    const ledgerData: PublicLedgerData = {
      shop: {
        name: mockSettings.shopName,
        phone: mockSettings.phone,
        address: mockSettings.address,
      },
      customer: {
        id: mockCustomer.id,
        name: mockCustomer.name,
        phone: mockCustomer.phone,
        address: mockCustomer.address,
        currentDue: mockCustomer.currentDue,
        totalGiven: mockCustomer.totalGiven,
        totalReceived: mockCustomer.totalReceived,
      },
      transactions: [
        {
          id: 'tx_1',
          type: 'due',
          amount: 10000,
          date: '2026-11-01T10:00:00.000Z',
          note: 'চাল ও তেলের বাকি',
          memoNo: 'MEMO-1001',
          balanceAfter: 10000,
        },
      ],
      generatedAt: new Date().toISOString(),
      token: 'token_123',
    };

    const token = encodeLedgerToken(ledgerData);
    assert.strictEqual(typeof token, 'string');
    assert.ok(token.length > 10);

    const decoded = decodeLedgerToken(token);
    assert.ok(decoded !== null);
    assert.strictEqual(decoded?.customer.name, 'আলামিন ফকির');
    assert.strictEqual(decoded?.customer.currentDue, 6384);
    assert.strictEqual(decoded?.shop.name, 'তাওয়াক্কুল কর্নার');
    assert.strictEqual(decoded?.transactions.length, 1);
  });

  test('buildCustomerShareUrl constructs a valid URL with ledger query parameter', () => {
    const ledgerData: PublicLedgerData = {
      shop: { name: 'আমার দোকান' },
      customer: {
        id: 'c1',
        name: 'করিম',
        currentDue: 500,
        totalGiven: 500,
        totalReceived: 0,
      },
      transactions: [],
      generatedAt: '2026-11-08T00:00:00.000Z',
      token: 'tok_1',
    };

    const origin = 'https://dokan.vercel.app';
    const url = buildCustomerShareUrl(ledgerData, origin);
    assert.ok(url.startsWith('https://dokan.vercel.app/?ledger='));
  });
