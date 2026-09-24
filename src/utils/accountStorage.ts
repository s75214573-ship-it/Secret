import { UserProfile } from '../types';

export interface StoredAccount {
  accountKey: string;
  uid: string;
  email: string;
  phoneNumber: string;
  displayName: string;
  password?: string;
  balance: number;
  vipLevel: number;
  referralCode: string;
  referredBy?: string;
  totalRecharge: number;
  totalWithdraw: number;
  role: 'admin' | 'user';
  bonusPoints: number;
  dailyStreak: number;
  lastCheckInDate?: string;
  checkInHistory?: string[];
  registrationBonusClaimed: boolean;
  registrationBonusAmount: number;
  createdAt: string;
  updatedAt: string;
}

const REGISTRY_STORAGE_KEY = 'winxbet_registered_accounts_v2';
const ACTIVE_SESSION_KEY = 'winxbet_active_session_v2';
const LEGACY_FALLBACK_KEY = 'winxbet_fallback_session';

export const REGISTRATION_BONUS_AMOUNT = 68;

export function normalizeAccountKey(identifier: string): string {
  if (!identifier) return '';
  const clean = identifier.trim().toLowerCase();
  
  if (clean.includes('@')) {
    return `email:${clean}`;
  }
  
  const digits = clean.replace(/\D/g, '');
  if (digits.length >= 10) {
    return `phone:${digits.slice(-10)}`;
  }
  
  return `id:${clean}`;
}

export function getAllRegisteredAccounts(): Record<string, StoredAccount> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(REGISTRY_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch (err) {
    console.warn('Failed to parse registered accounts vault:', err);
    return {};
  }
}

export function getRegisteredAccount(identifier: string): StoredAccount | null {
  if (!identifier) return null;
  const accounts = getAllRegisteredAccounts();
  const key = normalizeAccountKey(identifier);
  
  if (accounts[key]) {
    return accounts[key];
  }
  
  // Also scan values by email, phone, or uid
  const cleanId = identifier.trim().toLowerCase();
  const digits = identifier.replace(/\D/g, '');
  const last10 = digits.length >= 10 ? digits.slice(-10) : '';

  for (const acc of Object.values(accounts)) {
    if (acc.email && acc.email.toLowerCase() === cleanId) return acc;
    if (acc.uid && acc.uid === identifier) return acc;
    if (last10 && acc.phoneNumber && acc.phoneNumber.replace(/\D/g, '').includes(last10)) return acc;
  }
  
  return null;
}

export function saveRegisteredAccount(account: StoredAccount): void {
  if (typeof window === 'undefined' || !account) return;
  try {
    const accounts = getAllRegisteredAccounts();
    const key = account.accountKey || normalizeAccountKey(account.email || account.phoneNumber || account.uid);
    
    account.accountKey = key;
    account.updatedAt = new Date().toISOString();
    
    // Ensure registration bonus is reflected
    if (account.role !== 'admin' && (account.balance === undefined || account.balance === null)) {
      account.balance = REGISTRATION_BONUS_AMOUNT;
      account.registrationBonusClaimed = true;
      account.registrationBonusAmount = REGISTRATION_BONUS_AMOUNT;
    }

    accounts[key] = { ...account };
    
    // Also index under secondary key if available (e.g. both email and phone)
    if (account.email && !key.startsWith('email:')) {
      accounts[normalizeAccountKey(account.email)] = { ...account };
    }
    if (account.phoneNumber && !key.startsWith('phone:')) {
      accounts[normalizeAccountKey(account.phoneNumber)] = { ...account };
    }
    if (account.uid && !key.startsWith('id:')) {
      accounts[`id:${account.uid}`] = { ...account };
    }

    localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.warn('Failed to save account to vault:', err);
  }
}

export function updateStoredAccountBalance(identifier: string, newBalance: number): void {
  if (typeof window === 'undefined' || !identifier) return;
  try {
    const account = getRegisteredAccount(identifier);
    if (account) {
      account.balance = Math.max(0, Number(newBalance.toFixed(2)));
      saveRegisteredAccount(account);
    }
  } catch (err) {
    console.warn('Failed to update stored account balance:', err);
  }
}

export function updateStoredAccount(identifier: string, updates: Partial<StoredAccount>): void {
  if (typeof window === 'undefined' || !identifier) return;
  try {
    const account = getRegisteredAccount(identifier);
    if (account) {
      const merged = { ...account, ...updates, updatedAt: new Date().toISOString() };
      saveRegisteredAccount(merged);
    }
  } catch (err) {
    console.warn('Failed to update stored account:', err);
  }
}

export function verifyStoredCredentials(identifier: string, pass: string): { valid: boolean; account?: StoredAccount; message?: string } {
  const account = getRegisteredAccount(identifier);
  if (!account) {
    return { valid: false, message: 'Account not found. Please register first.' };
  }
  
  // If account has password stored, verify it
  if (account.password && account.password !== pass) {
    return { valid: false, message: 'Incorrect password. Please check your credentials.' };
  }
  
  return { valid: true, account };
}

export function setActiveSession(sessionData: { user: any; profile: UserProfile } | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (!sessionData) {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
      localStorage.removeItem(LEGACY_FALLBACK_KEY);
      sessionStorage.removeItem(ACTIVE_SESSION_KEY);
    } else {
      const serialized = JSON.stringify(sessionData);
      localStorage.setItem(ACTIVE_SESSION_KEY, serialized);
      localStorage.setItem(LEGACY_FALLBACK_KEY, serialized);
      sessionStorage.setItem(ACTIVE_SESSION_KEY, serialized);
    }
  } catch (err) {
    console.warn('Failed to set active session:', err);
  }
}

export function getActiveSession(): { user: any; profile: UserProfile } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY) || localStorage.getItem(LEGACY_FALLBACK_KEY) || sessionStorage.getItem(ACTIVE_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.profile) {
      return parsed;
    }
    return null;
  } catch (err) {
    console.warn('Failed to get active session:', err);
    return null;
  }
}

export function clearActiveSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
    localStorage.removeItem(LEGACY_FALLBACK_KEY);
    sessionStorage.removeItem(ACTIVE_SESSION_KEY);
    // CRITICAL: Notice that we NEVER remove REGISTRY_STORAGE_KEY!
    // User registered accounts and their balances remain intact across logouts!
  } catch (err) {
    console.warn('Failed to clear active session:', err);
  }
}
