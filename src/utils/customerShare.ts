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
  userId?: string;
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
 * Helper to ensure a persistent Shop Owner ID exists for cloud sync and customer ledger URLs
 */
export function getPersistentShopOwnerId(currentUserId?: string | null): string {
  if (currentUserId && currentUserId.trim().length > 0) {
    try {
      localStorage.setItem('dokan_shop_owner_id', currentUserId);
    } catch {}
    return currentUserId;
  }
  try {
    const saved = localStorage.getItem('dokan_shop_owner_id');
    if (saved && saved.trim().length > 0) return saved;
    const newId = 'owner_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    localStorage.setItem('dokan_shop_owner_id', newId);
    return newId;
  } catch {
    return 'owner_default_shop';
  }
}

/**
 * Prepares the complete public ledger payload for a given customer.
 * Uses a deterministic token and static timestamp so the QR code and Share Link
 * for a specific customer NEVER change, providing ONE PERMANENT QR code & link per customer.
 */
export function generateCustomerLedgerData(
  customer: Customer,
  allTransactions: Transaction[],
  settings: ShopSettings,
  userId?: string
): PublicLedgerData {
  const customerTxs = allTransactions.filter((tx) => tx.customerId === customer.id);
  const ledgerTxs = calculateLedgerBalances(customerTxs);

  const effectiveUserId = getPersistentShopOwnerId(userId);

  // Deterministic token & static date for a specific customer so QR Code and Share URL remain 100% constant!
  const staticToken = `c_${customer.id}_${effectiveUserId}`;
  const staticDate = customer.createdAt || '2026-01-01T00:00:00.000Z';

  return {
    userId: effectiveUserId,
    shop: {
      name: settings.shopName || 'আমাদের দোকান',
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
    generatedAt: staticDate,
    token: staticToken,
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
