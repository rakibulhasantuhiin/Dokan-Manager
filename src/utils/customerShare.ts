import QRCode from 'qrcode';
import { Customer, Transaction, ShopSettings } from '../types';

export interface PublicLedgerTransaction {
  id: string;
  type: 'due' | 'payment';
  amount: number;
  date: string;
  note?: string;
  memoNo?: string;
  balanceAfter: number;
}

export interface PublicLedgerData {
  shop: {
    name: string;
    phone?: string;
    address?: string;
  };
  customer: {
    id: string;
    name: string;
    phone?: string;
    address?: string;
    currentDue: number;
    totalGiven: number;
    totalReceived: number;
  };
  transactions: PublicLedgerTransaction[];
  generatedAt: string;
  token: string;
}

// UTF-8 safe base64 encode
function toBase64(str: string): string {
  if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
    return btoa(
      encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
        String.fromCharCode(parseInt(p1, 16))
      )
    );
  }
  // Node / test environment fallback
  return Buffer.from(str, 'utf-8').toString('base64');
}

// UTF-8 safe base64 decode
function fromBase64(b64: string): string {
  if (typeof window !== 'undefined' && typeof window.atob === 'function') {
    return decodeURIComponent(
      Array.prototype.map
        .call(atob(b64), (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  }
  // Node / test environment fallback
  return Buffer.from(b64, 'base64').toString('utf-8');
}

// URL-safe base64 conversion
function toUrlSafe(b64: string): string {
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromUrlSafe(safe: string): string {
  let b64 = safe.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4 !== 0) {
    b64 += '=';
  }
  return b64;
}

/**
 * Calculates running balance for each transaction chronologically
 */
export function calculateLedgerBalances(transactions: Transaction[]): PublicLedgerTransaction[] {
  // Sort oldest first to calculate running balance
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let runningBalance = 0;
  return sorted.map((tx) => {
    if (tx.type === 'due') {
      runningBalance += tx.amount;
    } else {
      runningBalance -= tx.amount;
    }

    return {
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      date: tx.date,
      note: tx.note,
      memoNo: tx.memoNo,
      balanceAfter: runningBalance,
    };
  });
}

/**
 * Prepares the complete public ledger payload for a given customer
 */
export function generateCustomerLedgerData(
  customer: Customer,
  allTransactions: Transaction[],
  settings: ShopSettings
): PublicLedgerData {
  const customerTxs = allTransactions.filter((tx) => tx.customerId === customer.id);
  const ledgerTxs = calculateLedgerBalances(customerTxs);

  return {
    shop: {
      name: settings.shopName || 'তাওয়াক্কুল কর্নার',
      phone: settings.phone || undefined,
      address: settings.address || undefined,
    },
    customer: {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      currentDue: customer.currentDue,
      totalGiven: customer.totalGiven,
      totalReceived: customer.totalReceived,
    },
    transactions: ledgerTxs,
    generatedAt: new Date().toISOString(),
    token: `c_${customer.id}_${Date.now().toString(36)}`,
  };
}

/**
 * Encodes PublicLedgerData into a URL-safe Base64 token
 */
export function encodeLedgerToken(data: PublicLedgerData): string {
  const jsonStr = JSON.stringify(data);
  const b64 = toBase64(jsonStr);
  return toUrlSafe(b64);
}

/**
 * Decodes a URL-safe Base64 token back to PublicLedgerData
 */
export function decodeLedgerToken(token: string): PublicLedgerData | null {
  try {
    const rawB64 = fromUrlSafe(token);
    const jsonStr = fromBase64(rawB64);
    const data = JSON.parse(jsonStr) as PublicLedgerData;

    if (!data || !data.customer || typeof data.customer.name !== 'string') {
      return null;
    }
    return data;
  } catch (err) {
    console.error('Failed to decode ledger token:', err);
    return null;
  }
}

/**
 * Builds the complete shareable public URL
 */
export function buildCustomerShareUrl(data: PublicLedgerData, origin?: string): string {
  const base = origin || (typeof window !== 'undefined' ? window.location.origin : 'https://dokan.app');
  const token = encodeLedgerToken(data);
  return `${base}/?ledger=${token}`;
}

/**
 * Generates high-resolution scannable QR Code as DataURL PNG
 */
export async function generateCustomerQRCode(url: string): Promise<string> {
  try {
    return await QRCode.toDataURL(url, {
      width: 360,
      margin: 2,
      color: {
        dark: '#1e293b',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (error) {
    console.error('Failed to generate QR code:', error);
    throw error;
  }
}
