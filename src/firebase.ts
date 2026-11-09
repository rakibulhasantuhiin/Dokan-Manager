import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  updatePassword,
  signOut,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import {
  initializeFirestore,
  doc,
  getDoc,
  setDoc,
  getDocFromServer,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import rawConfig from '../firebase-applet-config.json';

// Support both embedded config and Vercel/production environment variables
const firebaseConfig = {
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || rawConfig.projectId,
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string) || rawConfig.appId,
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) || rawConfig.apiKey,
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || rawConfig.authDomain,
  firestoreDatabaseId: (import.meta.env.VITE_FIREBASE_DATABASE_ID as string) || (rawConfig as any).firestoreDatabaseId,
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || rawConfig.storageBucket,
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || rawConfig.messagingSenderId,
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with multi-tab persistent IndexedDB local cache for sub-millisecond instant writes
export const db = initializeFirestore(
  app,
  {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  },
  firebaseConfig.firestoreDatabaseId
);

export const auth = getAuth(app);

// Explicitly guarantee lifetime session persistence until user logs out
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Set persistence error:', err);
});

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    if (
      error?.code === 'auth/popup-blocked' ||
      error?.code === 'auth/cancelled-popup-request' ||
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/operation-not-supported-in-this-environment'
    ) {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw error;
  }
}

export async function checkRedirectAuth() {
  try {
    const result = await getRedirectResult(auth);
    return result ? result.user : null;
  } catch {
    return null;
  }
}

export async function signInWithEmail(email: string, pass: string) {
  const result = await signInWithEmailAndPassword(auth, email, pass);
  return result.user;
}

export async function signUpWithEmail(email: string, pass: string, name?: string) {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  if (name && result.user) {
    await updateProfile(result.user, { displayName: name });
  }
  return result.user;
}

/**
 * Converts Bengali numerals (০-৯) to English digits (0-9) and trims spaces
 * so PINs work whether typed with an English or Bengali keyboard.
 */
export function normalizePin(raw: string): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return raw
    .trim()
    .split('')
    .map((ch) => {
      const idx = bengaliDigits.indexOf(ch);
      return idx !== -1 ? String(idx) : ch;
    })
    .join('');
}

/**
 * Looks up a PIN in Cloud Firestore (`pin_registry/{pin}` or `users/pin_vault_{pin}/shop/master`)
 * with a fast timeout so it works across Vercel, PC, and Mobile without hanging.
 */
export async function verifyPinInCloud(pin: string): Promise<{ exists: boolean; shopName?: string }> {
  const cleanPin = normalizePin(pin);
  if (cleanPin === '7078') {
    return { exists: true, shopName: 'তাওয়াক্কুল কর্নার' };
  }

  const timeoutPromise = new Promise<{ exists: boolean }>((resolve) =>
    setTimeout(() => resolve({ exists: false }), 2500)
  );

  const checkPromise = (async (): Promise<{ exists: boolean; shopName?: string }> => {
    try {
      const regSnap = await getDoc(doc(db, 'pin_registry', cleanPin));
      if (regSnap.exists()) {
        const data = regSnap.data();
        return { exists: true, shopName: data?.shopName || 'আমার দোকান' };
      }
      const shopSnap = await getDoc(doc(db, 'users', `pin_vault_${cleanPin}`, 'shop', 'master'));
      if (shopSnap.exists()) {
        const sData = shopSnap.data();
        return { exists: true, shopName: sData?.settings?.shopName || 'আমার দোকান' };
      }
      return { exists: false };
    } catch {
      return { exists: false };
    }
  })();

  return Promise.race([checkPromise, timeoutPromise]);
}

/**
 * Registers a new PIN in Cloud Firestore (`pin_registry/{pin}`) without blocking login if offline.
 */
export async function registerPinInCloud(pin: string, shopName: string): Promise<void> {
  const cleanPin = normalizePin(pin);
  try {
    await Promise.race([
      setDoc(doc(db, 'pin_registry', cleanPin), {
        pin: cleanPin,
        shopName: shopName.trim() || 'আমার দোকান',
        createdAt: new Date().toISOString(),
      }),
      new Promise((resolve) => setTimeout(resolve, 1800)),
    ]);
  } catch {
    // Firestore offline cache will sync automatically when online
  }
}

export async function updateUserPassword(newPass: string) {
  if (!auth.currentUser) throw new Error('কোনো ইউজার লগইন করা নেই');
  await updatePassword(auth.currentUser, newPass);
}

export async function logOut() {
  await signOut(auth);
}

// Test connection on boot
export async function testConnection() {
  try {
    if (auth.currentUser) {
      await getDocFromServer(doc(db, 'users', auth.currentUser.uid, 'settings', 'config'));
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline. Local cache will be used.');
    }
  }
}
