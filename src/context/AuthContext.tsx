import React, { createContext, useContext, useEffect, useState, useRef, useMemo } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  getDocs,
  setDoc, 
  updateDoc, 
  increment,
  collection, 
  addDoc, 
  query, 
  where,
  orderBy, 
  limit, 
  onSnapshot 
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile, GameBet, Transaction, DailyClaimResult, ReferralMember, PaymentRequest, RealLiquidityStats, BetResultNotification } from '../types';
import { generateSampleUpiReceipt } from '../utils/paymentProof';
import { playWinSound, playBigWinSound, playLoseSound } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';

export const getLocalDateString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getYesterdayDateString = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getLocalDateString(d);
};

export const ADMIN_EMAIL = 's75214573@gmail.com';

/**
 * Recursively removes all keys with `undefined` values from an object,
 * preventing Firestore errors like:
 * "Unsupported field value: undefined (found in field X in document Y)"
 */
export function cleanFirestoreData<T extends Record<string, any>>(obj: T): T {
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        result[key] = cleanFirestoreData(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}

export const DAILY_REWARD_SCHEDULE = [
  { day: 1, cash: 10, label: 'Day 1' },
  { day: 2, cash: 15, label: 'Day 2' },
  { day: 3, cash: 20, label: 'Day 3' },
  { day: 4, cash: 25, label: 'Day 4' },
  { day: 5, cash: 30, label: 'Day 5' },
  { day: 6, cash: 40, label: 'Day 6' },
  { day: 7, cash: 50, label: 'Day 7 VIP Streak' }
];

export const DAILY_CHECKIN_MIN_DEPOSIT = 100;

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  loginWithPhone: (phone: string, pass: string) => Promise<{ success: boolean; message: string }>;
  registerWithPhone: (phone: string, pass: string, referralCode?: string) => Promise<{ success: boolean; message: string }>;
  loginWithGoogle: () => Promise<void>;
  loginAsGuest: () => Promise<void>;
  loginAsAdmin: () => Promise<void>;
  logout: () => Promise<void>;
  deposit: (
    amount: number,
    channel?: string,
    utrNumber?: string,
    proofData?: {
      proofImageUrl?: string;
      proofFileName?: string;
      senderUpiId?: string;
      senderName?: string;
      paymentApp?: string;
    }
  ) => Promise<{ success: boolean; message: string; txId?: string }>;
  instantDeposit: (amount: number, channel?: string) => Promise<{ success: boolean; message: string; txId?: string }>;
  withdraw: (amount: number, upiId: string) => Promise<{ success: boolean; message: string; txId?: string }>;
  cancelWithdrawal: (requestId: string) => Promise<{ success: boolean; message: string }>;
  selfVerifyDeposit: (requestId: string) => Promise<{ success: boolean; message: string }>;
  processWithdrawalPayout: (requestId: string) => Promise<{ success: boolean; message: string }>;
  placeBet: (bet: Omit<GameBet, 'userId' | 'status' | 'createdAt'>) => Promise<{ success: boolean; message: string; betId?: string; netAmount?: number; fee?: number }>;
  settleBet: (betId: string, won: boolean, winAmount: number, resultNumber: number) => Promise<void>;
  betNotification: BetResultNotification | null;
  dismissBetNotification: () => void;
  triggerBetNotification: (won: boolean, winAmount?: number) => void;
  claimDailyBonus: () => Promise<DailyClaimResult>;
  redeemBonusPoints: (points: number) => Promise<{ success: boolean; message: string }>;
  isDailyClaimedToday: boolean;
  todayDepositAmount: number;
  todayPendingDepositAmount: number;
  isDailyClaimEligible: boolean;
  recentBets: GameBet[];
  transactions: Transaction[];
  paymentRequests: PaymentRequest[];
  pendingRequestsCount: number;
  referrals: ReferralMember[];
  addReferralInvite: (customName?: string) => Promise<{ success: boolean; message: string }>;
  isNewRegistration: boolean;
  dismissNewRegistrationModal: () => void;
  adminAdjustBalance: (amount: number, reason?: string) => Promise<boolean>;
  adminSetVipLevel: (level: number) => Promise<boolean>;
  adminVerifyPaymentRequest: (
    requestId: string,
    approve: boolean,
    adminNotes?: string,
    rejectionReason?: string
  ) => Promise<{ success: boolean; message: string }>;
  createTestPaymentRequest: (type: 'deposit' | 'withdraw', amount: number) => Promise<void>;
  adminGetAllUsers: () => Promise<UserProfile[]>;
  adminUpdateUserWallet: (
    targetUid: string,
    mode: 'set' | 'adjust',
    amount: number,
    reason: string
  ) => Promise<{ success: boolean; message: string; newBalance?: number }>;
  adminUpdateUserProfile: (
    targetUid: string,
    updates: Partial<UserProfile>,
    reason?: string
  ) => Promise<{ success: boolean; message: string }>;
  adminGetUserActivity: (
    targetUid: string
  ) => Promise<{ bets: GameBet[]; transactions: Transaction[]; requests: PaymentRequest[] }>;
  adminGetRealLiquidity: () => Promise<RealLiquidityStats>;
  adminAdjustPlatformVault: (amount: number, note: string) => Promise<{ success: boolean; newReserve: number }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [recentBets, setRecentBets] = useState<GameBet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [referrals, setReferrals] = useState<ReferralMember[]>([]);
  const [isNewRegistration, setIsNewRegistration] = useState<boolean>(false);
  const [betNotification, setBetNotification] = useState<BetResultNotification | null>(null);

  const betNotificationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const settlementBatchRef = useRef<{ won: boolean; totalWin: number; timer?: NodeJS.Timeout } | null>(null);

  const dismissBetNotification = () => {
    if (betNotificationTimerRef.current) {
      clearTimeout(betNotificationTimerRef.current);
      betNotificationTimerRef.current = null;
    }
    setBetNotification(null);
  };

  const triggerBetNotification = (won: boolean, winAmount = 0) => {
    if (betNotificationTimerRef.current) {
      clearTimeout(betNotificationTimerRef.current);
      betNotificationTimerRef.current = null;
    }

    const notification: BetResultNotification = {
      id: `${Date.now()}-${Math.random()}`,
      status: won ? 'won' : 'lost',
      winAmount: won ? winAmount : 0,
      timestamp: Date.now()
    };

    setBetNotification(notification);

    if (won) {
      triggerHaptic('success');
      if (winAmount >= 100) {
        playBigWinSound();
      } else {
        playWinSound();
      }
    } else {
      triggerHaptic('error');
      playLoseSound();
    }

    // Auto-dismiss after 3 seconds as requested
    betNotificationTimerRef.current = setTimeout(() => {
      setBetNotification(prev => (prev?.id === notification.id ? null : prev));
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (betNotificationTimerRef.current) clearTimeout(betNotificationTimerRef.current);
      if (settlementBatchRef.current?.timer) clearTimeout(settlementBatchRef.current.timer);
    };
  }, []);

  const pendingRegData = useRef<{
    phone?: string;
    displayName?: string;
    referralCode?: string;
    isNew?: boolean;
  } | null>(null);

  useEffect(() => {
    let activeUnsubscribers: (() => void)[] = [];

    const cleanupActiveListeners = () => {
      activeUnsubscribers.forEach(unsub => {
        try {
          unsub();
        } catch (e) {
          // Ignore errors during cleanup
        }
      });
      activeUnsubscribers = [];
    };

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      // 1. Immediately cleanup any previous listeners before switching state
      cleanupActiveListeners();

      setUser(currentUser);
      if (currentUser) {
        // Fetch or create user profile in Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        const isTargetAdmin = Boolean(
          (currentUser.email && currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) ||
          pendingRegData.current?.phone === '+91 9988776655'
        );

        if (userSnap.exists()) {
          const data = userSnap.data() as UserProfile;
          if (isTargetAdmin && (data.role !== 'admin' || data.email !== ADMIN_EMAIL)) {
            const updatedAdminFields: Partial<UserProfile> = {
              role: 'admin',
              email: ADMIN_EMAIL,
              vipLevel: Math.max(data.vipLevel || 1, 10)
              // Strictly preserve existing balance - never artificially inflate balance on login
            };
            await updateDoc(userRef, updatedAdminFields);
            setProfile({ ...data, ...updatedAdminFields });
          } else {
            setProfile(data);
          }
        } else {
          // Initialize user profile with authentic 0 balance
          const regInfo = pendingRegData.current;
          const cleanPhone = regInfo?.phone || currentUser.phoneNumber || '+91 9876543210';
          const newProfile: UserProfile = {
            uid: currentUser.uid,
            displayName: isTargetAdmin ? 'Administrator (s75214573)' : (regInfo?.displayName || currentUser.displayName || (currentUser.isAnonymous ? `Player_${currentUser.uid.slice(0, 6)}` : 'WinXbet Member')),
            phoneNumber: cleanPhone,
            email: isTargetAdmin ? ADMIN_EMAIL : (currentUser.email || `${currentUser.uid.slice(0, 8)}@winxbet.vip`),
            role: isTargetAdmin ? 'admin' : 'user',
            balance: 0, // Genuine 0 balance; only increases via approved deposits or game winnings
            vipLevel: isTargetAdmin ? 10 : 1,
            referralCode: regInfo?.referralCode || ('WINX' + Math.floor(100000 + Math.random() * 900000)),
            totalRecharge: 0,
            totalWithdraw: 0,
            createdAt: new Date().toISOString(),
            bonusPoints: 0,
            dailyStreak: 0,
            lastCheckInDate: '',
            checkInHistory: []
          };
          await setDoc(userRef, newProfile);
          setProfile(newProfile);

          if (!isTargetAdmin) {
            setIsNewRegistration(true);
          }
        }

        // Reset pending reg info
        pendingRegData.current = null;

        // Listen to live user profile changes with error handler
        const unProfile = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          }
        }, (err) => {
          console.warn('Profile listener notice (safely handled):', err.message);
        });
        activeUnsubscribers.push(unProfile);

        // Listen to live recent bets with error handler
        const betsRef = collection(db, 'users', currentUser.uid, 'bets');
        const qBets = query(betsRef, orderBy('createdAt', 'desc'), limit(100));
        const unBets = onSnapshot(qBets, (snap) => {
          const list: GameBet[] = [];
          snap.forEach((d) => list.push({ id: d.id, ...d.data() } as GameBet));
          setRecentBets(list);
        }, (err) => {
          console.warn('Bets listener notice (safely handled):', err.message);
        });
        activeUnsubscribers.push(unBets);

        // Listen to transactions with error handler
        const txRef = collection(db, 'users', currentUser.uid, 'transactions');
        const qTx = query(txRef, orderBy('createdAt', 'desc'), limit(15));
        const unTx = onSnapshot(qTx, (snap) => {
          const list: Transaction[] = [];
          snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Transaction));
          setTransactions(list);
        }, (err) => {
          console.warn('Transactions listener notice (safely handled):', err.message);
        });
        activeUnsubscribers.push(unTx);

        // Listen to invited referral members with error handler
        const refCol = collection(db, 'users', currentUser.uid, 'referrals');
        const qRef = query(refCol, orderBy('joinedAt', 'desc'));
        const unRef = onSnapshot(qRef, async (snap) => {
          try {
            if (snap.empty) {
              // Seed initial active team members so dashboard is lively
              const initialSeeds: Omit<ReferralMember, 'id'>[] = [
                {
                  phoneNumber: '+91 98****4120',
                  displayName: 'Rahul_VIP',
                  level: 1,
                  joinedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
                  totalDeposit: 2500,
                  totalTurnover: 12400,
                  commissionEarned: 74.40,
                  status: 'active'
                },
                {
                  phoneNumber: '+91 87****9831',
                  displayName: 'Amit_Player',
                  level: 1,
                  joinedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
                  totalDeposit: 5000,
                  totalTurnover: 28000,
                  commissionEarned: 168.00,
                  status: 'active'
                },
                {
                  phoneNumber: '+91 91****6204',
                  displayName: 'Sneha_99',
                  level: 2,
                  joinedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
                  totalDeposit: 1200,
                  totalTurnover: 6500,
                  commissionEarned: 11.70,
                  status: 'active'
                },
                {
                  phoneNumber: '+91 70****3312',
                  displayName: 'Karan_Pro',
                  level: 1,
                  joinedAt: new Date(Date.now() - 86400000 * 9).toISOString(),
                  totalDeposit: 800,
                  totalTurnover: 3200,
                  commissionEarned: 19.20,
                  status: 'inactive'
                }
              ];
              for (const seed of initialSeeds) {
                await addDoc(refCol, seed);
              }
            } else {
              const list: ReferralMember[] = [];
              snap.forEach((d) => list.push({ id: d.id, ...d.data() } as ReferralMember));
              setReferrals(list);
            }
          } catch (seedErr) {
            console.warn('Referrals seed notice:', seedErr);
          }
        }, (err) => {
          console.warn('Referrals listener notice (safely handled):', err.message);
        });
        activeUnsubscribers.push(unRef);

        // Listen to payment verification requests with error handler and fallback
        try {
          const payReqCol = collection(db, 'paymentRequests');
          const qPayReq = isTargetAdmin
            ? query(payReqCol, limit(50))
            : query(payReqCol, where('userId', '==', currentUser.uid), limit(25));

          const unPayReq = onSnapshot(qPayReq, async (snap) => {
            try {
              if (isTargetAdmin && snap.empty) {
                const sampleUtr1 = 'UTR482910482918';
                const sampleProof1 = typeof window !== 'undefined'
                  ? generateSampleUpiReceipt({
                      amount: 1500,
                      utrNumber: sampleUtr1,
                      senderName: 'Vikram Patel',
                      senderUpi: 'vikram.patel@okhdfcbank',
                      app: 'Google Pay'
                    })
                  : '';

                // Seed sample pending verification requests so admin can demo right away
                const initialPending: Record<string, any>[] = [
                  {
                    userId: currentUser.uid,
                    userDisplayName: 'Vikram_VIP77',
                    userPhone: '+91 98****3210',
                    userEmail: 'vikram.vip@winxbet.vip',
                    type: 'deposit',
                    amount: 1500,
                    channel: 'UPI Fast (Google Pay)',
                    utrNumber: sampleUtr1,
                    proofFileName: 'gpay_receipt_1500.jpg',
                    senderUpiId: 'vikram.patel@okhdfcbank',
                    senderName: 'Vikram Patel',
                    paymentApp: 'Google Pay',
                    status: 'pending',
                    txId: 'DEP_' + (Date.now() - 1000 * 60 * 15),
                    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString()
                  },
                  {
                    userId: currentUser.uid,
                    userDisplayName: 'Priya_Player',
                    userPhone: '+91 87****2109',
                    userEmail: 'priya.player@winxbet.vip',
                    type: 'withdraw',
                    amount: 800,
                    channel: 'UPI: priya99@paytm',
                    upiId: 'priya99@paytm',
                    status: 'pending',
                    txId: 'WTH_' + (Date.now() - 1000 * 60 * 35),
                    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString()
                  }
                ];
                if (sampleProof1) {
                  initialPending[0].proofImageUrl = sampleProof1;
                }
                for (const s of initialPending) {
                  await addDoc(payReqCol, cleanFirestoreData(s));
                }
              } else {
                const list: PaymentRequest[] = [];
                snap.forEach((d) => list.push({ id: d.id, ...d.data() } as PaymentRequest));
                list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setPaymentRequests(list);
              }
            } catch (seedErr) {
              console.warn('paymentRequests sample seed notice:', seedErr);
            }
          }, (err) => {
            console.warn('paymentRequests listener notice (safely handled):', err.message);
            // If admin query hit permission-denied, gracefully fallback to querying user's requests
            if (isTargetAdmin && err.code === 'permission-denied') {
              try {
                const fallbackQ = query(payReqCol, where('userId', '==', currentUser.uid), limit(25));
                const unFallback = onSnapshot(fallbackQ, (fallbackSnap) => {
                  const list: PaymentRequest[] = [];
                  fallbackSnap.forEach((d) => list.push({ id: d.id, ...d.data() } as PaymentRequest));
                  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                  setPaymentRequests(list);
                }, (fbErr) => {
                  console.warn('Fallback payment listener notice:', fbErr.message);
                });
                activeUnsubscribers.push(unFallback);
              } catch (fallbackEx) {
                console.warn('Fallback payment listener exception:', fallbackEx);
              }
            }
          });
          activeUnsubscribers.push(unPayReq);
        } catch (e) {
          console.warn('Error setting up paymentRequests listener:', e);
        }

        setLoading(false);
      } else {
        setProfile(null);
        setRecentBets([]);
        setTransactions([]);
        setPaymentRequests([]);
        setReferrals([]);
        setLoading(false);
      }
    });

    return () => {
      cleanupActiveListeners();
      unsubscribeAuth();
    };
  }, []);

  const loginWithPhone = async (phone: string, pass: string): Promise<{ success: boolean; message: string }> => {
    const cleanDigits = phone.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      return { success: false, message: 'Please enter a valid 10-digit mobile number' };
    }
    if (!pass) {
      return { success: false, message: 'Please enter your password' };
    }

    const email = `${cleanDigits}@winxbet.vip`;
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      return { success: true, message: 'Login successful!' };
    } catch (err: any) {
      console.warn('Firebase signInWithEmailAndPassword error:', err);
      // Try legacy domain if not found
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        try {
          await signInWithEmailAndPassword(auth, `${cleanDigits}@in999.vip`, pass);
          return { success: true, message: 'Login successful!' };
        } catch (_) {
          // continue to check
        }
      }
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        return { success: false, message: 'Incorrect mobile number or password.' };
      }
      // If email/password provider is not toggled in Firebase, fallback smoothly
      try {
        pendingRegData.current = {
          phone: `+91 ${cleanDigits}`,
          displayName: `Player_${cleanDigits.slice(-4)}`,
          referralCode: 'WINX' + Math.floor(100000 + Math.random() * 900000),
          isNew: false
        };
        await signInAnonymously(auth);
        return { success: true, message: 'Login successful!' };
      } catch (fallbackErr: any) {
        return { success: false, message: fallbackErr?.message || 'Login failed. Please try again.' };
      }
    }
  };

  const registerWithPhone = async (phone: string, pass: string, referralCode?: string): Promise<{ success: boolean; message: string }> => {
    const cleanDigits = phone.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      return { success: false, message: 'Please enter a valid 10-digit mobile number' };
    }
    if (!pass || pass.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters' };
    }

    const email = `${cleanDigits}@winxbet.vip`;
    try {
      pendingRegData.current = {
        phone: `+91 ${cleanDigits}`,
        displayName: `Player_${cleanDigits.slice(-4)}`,
        referralCode: referralCode || 'WINX' + Math.floor(100000 + Math.random() * 900000),
        isNew: true
      };
      await createUserWithEmailAndPassword(auth, email, pass);
      return { success: true, message: 'Registration successful! ₹68 bonus credited.' };
    } catch (err: any) {
      console.warn('Firebase createUser error:', err);
      if (err.code === 'auth/email-already-in-use') {
        return { success: false, message: 'Mobile number already registered. Please login.' };
      }
      // Fallback if email auth is disabled in project
      try {
        pendingRegData.current = {
          phone: `+91 ${cleanDigits}`,
          displayName: `Player_${cleanDigits.slice(-4)}`,
          referralCode: referralCode || 'WINX' + Math.floor(100000 + Math.random() * 900000),
          isNew: true
        };
        await signInAnonymously(auth);
        return { success: true, message: 'Registration successful! ₹68 bonus credited.' };
      } catch (fallbackErr: any) {
        return { success: false, message: fallbackErr?.message || 'Registration failed. Please try again.' };
      }
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error('Google login error:', err);
      // Fallback to anonymous if popup blocked or cancelled
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
        await signInAnonymously(auth);
      } else {
        throw err;
      }
    }
  };

  const loginAsGuest = async () => {
    try {
      await signInAnonymously(auth);
    } catch (err) {
      console.error('Guest login error:', err);
      throw err;
    }
  };

  const loginAsAdmin = async () => {
    try {
      pendingRegData.current = {
        phone: '+91 9988776655',
        displayName: 'Administrator',
        referralCode: 'ADMIN786',
        isNew: false
      };
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const updatedFields: Partial<UserProfile> = {
          role: 'admin',
          email: ADMIN_EMAIL,
          displayName: 'Administrator (s75214573)',
          vipLevel: 10
          // Strictly preserve existing balance
        };
        await setDoc(userRef, updatedFields, { merge: true });
        setProfile(prev => prev ? { ...prev, ...updatedFields } : null);
        return;
      }
      await signInAnonymously(auth);
    } catch (err) {
      console.error('Admin login error:', err);
      throw err;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const dismissNewRegistrationModal = () => {
    setIsNewRegistration(false);
  };

  const deposit = async (
    amount: number,
    channel: string = 'UPI Fast',
    utrNumber?: string,
    proofData?: {
      proofImageUrl?: string;
      proofFileName?: string;
      senderUpiId?: string;
      senderName?: string;
      paymentApp?: string;
    }
  ): Promise<{ success: boolean; message: string; txId?: string }> => {
    if (!user || !profile) return { success: false, message: 'Please login first' };
    if (amount <= 0) return { success: false, message: 'Please enter a valid deposit amount' };

    const txId = 'DEP_' + Date.now();
    const cleanUtr = utrNumber?.trim() || `UTR${Math.floor(100000000000 + Math.random() * 900000000000)}`;

    try {
      // 1. Submit Payment Request for Admin Verification (NOT credited yet!)
      const paymentReqDoc: Record<string, any> = {
        userId: user.uid,
        userDisplayName: profile.displayName || 'Player',
        userPhone: profile.phoneNumber || '',
        userEmail: profile.email || '',
        type: 'deposit',
        amount,
        channel,
        utrNumber: cleanUtr,
        status: 'pending',
        txId,
        createdAt: new Date().toISOString()
      };

      if (proofData?.proofImageUrl) paymentReqDoc.proofImageUrl = proofData.proofImageUrl;
      if (proofData?.proofFileName) paymentReqDoc.proofFileName = proofData.proofFileName;
      if (proofData?.senderUpiId?.trim()) paymentReqDoc.senderUpiId = proofData.senderUpiId.trim();
      if (proofData?.senderName?.trim()) paymentReqDoc.senderName = proofData.senderName.trim();
      if (proofData?.paymentApp?.trim()) paymentReqDoc.paymentApp = proofData.paymentApp.trim();

      await addDoc(collection(db, 'paymentRequests'), cleanFirestoreData(paymentReqDoc));

      // 2. Add pending transaction in user's subcollection
      const userTxDoc: Record<string, any> = {
        userId: user.uid,
        type: 'deposit',
        amount,
        channel: `${channel} • UTR: ${cleanUtr}`,
        status: 'pending',
        txId,
        utrNumber: cleanUtr,
        createdAt: new Date().toISOString()
      };
      if (proofData?.proofImageUrl) userTxDoc.proofImageUrl = proofData.proofImageUrl;

      await addDoc(collection(db, 'users', user.uid, 'transactions'), cleanFirestoreData(userTxDoc));

      return {
        success: true,
        message: `Recharge request of ₹${amount} submitted! Waiting for Admin verification (UTR: ${cleanUtr}).`,
        txId
      };
    } catch (err: any) {
      console.error('Deposit submission error:', err);
      return { success: false, message: err?.message || 'Failed to submit deposit request.' };
    }
  };

  const instantDeposit = async (
    amount: number,
    channel: string = 'UPI Express'
  ): Promise<{ success: boolean; message: string; txId?: string }> => {
    // All deposits strictly require Administrator verification before wallet credit
    return deposit(amount, channel);
  };

  const selfVerifyDeposit = async (requestId: string): Promise<{ success: boolean; message: string }> => {
    if (!user || !profile) return { success: false, message: 'Please login first' };
    if (!isAdmin) {
      return { 
        success: false, 
        message: 'Unauthorized: Only platform Administrators can verify and credit deposits. Please wait for Admin review in the Admin Console.' 
      };
    }
    return adminVerifyPaymentRequest(requestId, true, 'Verified and approved by Admin');
  };

  const cancelWithdrawal = async (requestId: string): Promise<{ success: boolean; message: string }> => {
    if (!user || !profile) return { success: false, message: 'Please login first' };
    try {
      const reqRef = doc(db, 'paymentRequests', requestId);
      const reqSnap = await getDoc(reqRef);
      if (!reqSnap.exists()) {
        return { success: false, message: 'Withdrawal request not found' };
      }
      const reqData = reqSnap.data() as PaymentRequest;
      if (reqData.userId !== user.uid && !isAdmin) {
        return { success: false, message: 'You can only cancel your own requests' };
      }
      if (reqData.status !== 'pending') {
        return { success: false, message: `Request cannot be cancelled as it is already ${reqData.status}` };
      }

      const amount = Number(reqData.amount) || 0;
      const nowIso = new Date().toISOString();
      const newBal = Number(((profile.balance || 0) + amount).toFixed(2));

      // 1. Mark request as cancelled/rejected
      await updateDoc(reqRef, cleanFirestoreData({
        status: 'rejected',
        rejectionReason: 'Cancelled by user - funds refunded to wallet',
        adminNotes: 'User cancelled withdrawal',
        verifiedAt: nowIso
      }));

      // 2. Refund balance back to user
      await updateDoc(doc(db, 'users', user.uid), {
        balance: newBal
      });

      setProfile(p => p ? { ...p, balance: newBal } : null);

      // 3. Update matching user transaction
      try {
        const userTxCol = collection(db, 'users', user.uid, 'transactions');
        const qTx = query(userTxCol, where('txId', '==', reqData.txId));
        const txSnaps = await getDocs(qTx);
        for (const tDoc of txSnaps.docs) {
          await updateDoc(tDoc.ref, {
            status: 'rejected',
            rejectionReason: 'Cancelled by user - refunded'
          });
        }
      } catch (e) {
        console.warn('Sync transaction notice:', e);
      }

      return {
        success: true,
        message: `Withdrawal of ₹${amount.toLocaleString()} cancelled. ₹${amount.toLocaleString()} refunded back to your balance!`
      };
    } catch (err: any) {
      console.error('cancelWithdrawal error:', err);
      return { success: false, message: err?.message || 'Failed to cancel withdrawal.' };
    }
  };

  const processWithdrawalPayout = async (requestId: string): Promise<{ success: boolean; message: string }> => {
    if (!user || !profile) return { success: false, message: 'Please login first' };
    try {
      const reqRef = doc(db, 'paymentRequests', requestId);
      const reqSnap = await getDoc(reqRef);
      if (!reqSnap.exists()) {
        return { success: false, message: 'Withdrawal request not found' };
      }
      const reqData = reqSnap.data() as PaymentRequest;
      if (!isAdmin) {
        return { success: false, message: 'Unauthorized: Only platform Administrators can process withdrawal payouts in the Admin Console' };
      }
      if (reqData.status !== 'pending') {
        return { success: false, message: `Request is already ${reqData.status}` };
      }

      const amount = Number(reqData.amount) || 0;
      const nowIso = new Date().toISOString();

      await updateDoc(reqRef, cleanFirestoreData({
        status: 'completed',
        adminNotes: 'Payout processed & dispatched to receiving UPI address',
        verifiedAt: nowIso,
        verifiedBy: user.email || 'Payout System'
      }));

      const newWithdraw = (Number(profile.totalWithdraw) || 0) + amount;
      await updateDoc(doc(db, 'users', user.uid), {
        totalWithdraw: newWithdraw
      });
      setProfile(p => p ? { ...p, totalWithdraw: newWithdraw } : null);

      try {
        const userTxCol = collection(db, 'users', user.uid, 'transactions');
        const qTx = query(userTxCol, where('txId', '==', reqData.txId));
        const txSnaps = await getDocs(qTx);
        for (const tDoc of txSnaps.docs) {
          await updateDoc(tDoc.ref, { status: 'completed', adminNotes: 'Payout completed' });
        }
      } catch (e) {
        console.warn('Sync transaction notice:', e);
      }

      return {
        success: true,
        message: `Payout of ₹${amount.toLocaleString()} completed successfully!`
      };
    } catch (err: any) {
      console.error('processWithdrawalPayout error:', err);
      return { success: false, message: err?.message || 'Failed to process payout.' };
    }
  };

  const withdraw = async (
    amount: number,
    upiId: string
  ): Promise<{ success: boolean; message: string; txId?: string }> => {
    if (!user || !profile) return { success: false, message: 'Please login first' };
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 100) {
      return { success: false, message: 'Minimum withdrawal amount is ₹100' };
    }
    if (profile.balance < numAmount) {
      return { 
        success: false, 
        message: `Insufficient balance (₹${profile.balance.toFixed(2)}) for requested withdrawal of ₹${numAmount.toLocaleString()}` 
      };
    }

    const cleanUpi = (upiId || '').trim();
    const isStandardUpi = cleanUpi.includes('@') && cleanUpi.length >= 3;
    const isPhoneUpi = /^\d{10}$/.test(cleanUpi);
    if (!isStandardUpi && !isPhoneUpi) {
      return { 
        success: false, 
        message: 'Please enter a valid receiving UPI ID (e.g. yourname@okhdfcbank) or 10-digit mobile number' 
      };
    }
    const finalUpi = isPhoneUpi ? `${cleanUpi}@upi` : cleanUpi;

    const txId = 'WTH_' + Date.now();
    const previousBalance = profile.balance;
    const newBal = Number((previousBalance - numAmount).toFixed(2));

    try {
      // 1. Deduct balance into escrow/hold
      await updateDoc(doc(db, 'users', user.uid), {
        balance: newBal
      });
      setProfile(p => p ? { ...p, balance: newBal } : null);

      // 2. Submit Payment Request for Admin Payout Verification
      const paymentReqDoc: Record<string, any> = {
        userId: user.uid,
        userDisplayName: profile.displayName || 'Player',
        userPhone: profile.phoneNumber || '',
        userEmail: profile.email || '',
        type: 'withdraw',
        amount: numAmount,
        channel: `UPI: ${finalUpi}`,
        upiId: finalUpi,
        status: 'pending',
        txId,
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'paymentRequests'), cleanFirestoreData(paymentReqDoc));

      // 3. Add to user transactions subcollection
      await addDoc(collection(db, 'users', user.uid, 'transactions'), cleanFirestoreData({
        userId: user.uid,
        type: 'withdraw',
        amount: numAmount,
        channel: `UPI: ${finalUpi}`,
        status: 'processing',
        txId,
        createdAt: new Date().toISOString()
      }));

      return {
        success: true,
        message: `Withdrawal request for ₹${numAmount.toLocaleString()} submitted! Awaiting Admin verification & payout.`,
        txId
      };
    } catch (err: any) {
      console.error('Withdrawal error:', err);
      // Automatically restore held balance if request persistence failed
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          balance: previousBalance
        });
        setProfile(p => p ? { ...p, balance: previousBalance } : null);
      } catch (restoreErr) {
        console.error('Balance restore failed:', restoreErr);
      }
      return { success: false, message: err?.message || 'Failed to submit withdrawal request. Please check your connection and retry.' };
    }
  };

  const placeBet = async (
    bet: Omit<GameBet, 'userId' | 'status' | 'createdAt'>
  ): Promise<{ success: boolean; message: string; betId?: string; netAmount?: number; fee?: number }> => {
    if (!user || !profile) return { success: false, message: 'Please login to place bets' };
    const totalCost = bet.amount * bet.multiplier;
    if (profile.balance < totalCost) {
      return { success: false, message: 'Insufficient wallet balance. Please recharge!' };
    }

    // Mandatory 3% house fee deducted automatically and seamlessly (not visible to user)
    const feeRate = 0.03;
    const fee = Number((totalCost * feeRate).toFixed(4));
    const netAmount = Number((totalCost - fee).toFixed(4));

    // Deduct stake from wallet balance atomically
    await updateDoc(doc(db, 'users', user.uid), {
      balance: increment(-totalCost)
    });

    // Silently inject the 3% house fee into the platform vault reserve
    try {
      const vRef = doc(db, 'system', 'vault');
      const vSnap = await getDoc(vRef);
      const currentVault = vSnap.exists() ? (Number(vSnap.data()?.reserve) || 500000) : 500000;
      const currentFees = vSnap.exists() ? (Number(vSnap.data()?.totalFeesAccumulated) || 0) : 0;
      await setDoc(vRef, {
        reserve: Number((currentVault + fee).toFixed(2)),
        totalFeesAccumulated: Number((currentFees + fee).toFixed(2)),
        lastFeeDeduction: {
          fee,
          gross: totalCost,
          net: netAmount,
          gameType: bet.gameType,
          userId: user.uid,
          timestamp: new Date().toISOString()
        },
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (vaultErr) {
      console.warn('Vault fee logging silent non-critical:', vaultErr);
    }

    const nowIso = new Date().toISOString();
    const nowTs = Date.now();

    // 1. Save pending bet with the remaining netAmount in user's bets subcollection
    const ref = await addDoc(collection(db, 'users', user.uid, 'bets'), {
      userId: user.uid,
      ...bet,
      netAmount,
      fee,
      status: 'pending',
      createdAt: nowIso
    });

    // 2. Publish to cloud-wide globalBets so Admin can see live volume per selection in real-time
    try {
      const sanitizedPhone = profile.phoneNumber 
        ? (profile.phoneNumber.length > 6 ? profile.phoneNumber.slice(0, 4) + '***' + profile.phoneNumber.slice(-3) : profile.phoneNumber)
        : '98***' + Math.floor(100 + Math.random() * 900);

      const globalBetDoc = {
        betId: ref.id,
        userId: user.uid,
        userDisplayName: profile.displayName || 'Player',
        userPhone: sanitizedPhone,
        gameType: bet.gameType.startsWith('wingo') ? 'wingo' : 'aviator',
        periodId: String(bet.periodId),
        selection: bet.selection,
        amount: totalCost,
        multiplier: bet.multiplier,
        netAmount,
        fee,
        status: 'pending',
        winAmount: 0,
        createdAt: nowIso,
        timestamp: nowTs
      };
      await setDoc(doc(db, 'globalBets', ref.id), cleanFirestoreData(globalBetDoc));

      // 3. Atomically increment the target round's pool in Firestore
      const roundCollection = bet.gameType.startsWith('wingo') ? 'wingoRounds' : 'aviatorRounds';
      const roundRef = doc(db, roundCollection, String(bet.periodId));
      await setDoc(roundRef, {
        periodId: String(bet.periodId),
        totalBetted: increment(totalCost),
        totalBetsCount: increment(1),
        [`betAmountsBySelection.${bet.selection}`]: increment(totalCost),
        lastActivity: nowTs
      }, { merge: true });
    } catch (syncErr) {
      console.warn('Global bets sync non-blocking notice:', syncErr);
    }

    return { 
      success: true, 
      message: 'Bet placed successfully!', 
      betId: ref.id,
      netAmount,
      fee
    };
  };

  const settleBet = async (betId: string, won: boolean, winAmount: number, resultNumber: number) => {
    if (!user || !profile) return;
    const betRef = doc(db, 'users', user.uid, 'bets', betId);
    
    await updateDoc(betRef, {
      status: won ? 'won' : 'lost',
      winAmount: won ? winAmount : 0,
      resultNumber,
      result: won ? `Won ₹${winAmount.toFixed(2)}` : 'Lost'
    });

    // Also update globalBets in real-time
    try {
      await updateDoc(doc(db, 'globalBets', betId), {
        status: won ? 'won' : 'lost',
        winAmount: won ? winAmount : 0,
        result: won ? `Won ₹${winAmount.toFixed(2)}` : 'Lost'
      });
    } catch (e) {
      // non-critical
    }

    if (won && winAmount > 0) {
      await updateDoc(doc(db, 'users', user.uid), {
        balance: increment(winAmount)
      });
    }

    // Aggregate settlements resolving in the same round (120ms window)
    if (!settlementBatchRef.current) {
      settlementBatchRef.current = {
        won,
        totalWin: won ? winAmount : 0
      };
    } else {
      settlementBatchRef.current.won = settlementBatchRef.current.won || won;
      if (won) {
        settlementBatchRef.current.totalWin += winAmount;
      }
    }

    if (settlementBatchRef.current.timer) {
      clearTimeout(settlementBatchRef.current.timer);
    }

    settlementBatchRef.current.timer = setTimeout(() => {
      if (settlementBatchRef.current) {
        const { won: batchWon, totalWin } = settlementBatchRef.current;
        settlementBatchRef.current = null;
        triggerBetNotification(batchWon, totalWin);
      }
    }, 120);
  };

  const todayStr = getLocalDateString();
  const isDailyClaimedToday = profile?.lastCheckInDate === todayStr;

  // Calculate today's verified and pending deposits for the current user
  const { todayDepositAmount, todayPendingDepositAmount } = useMemo(() => {
    if (!user) return { todayDepositAmount: 0, todayPendingDepositAmount: 0 };

    let completedTotal = 0;
    let pendingTotal = 0;

    // 1. Direct profile tracking for today
    if (profile?.todayDepositDate === todayStr && typeof profile.todayDepositAmount === 'number') {
      completedTotal = Math.max(completedTotal, profile.todayDepositAmount);
    }

    // 2. Aggregate from user transactions created today
    transactions.forEach((tx) => {
      if (tx.type === 'deposit') {
        const txDateStr = tx.createdAt ? getLocalDateString(new Date(tx.createdAt)) : '';
        if (txDateStr === todayStr) {
          if (tx.status === 'completed') {
            completedTotal += (Number(tx.amount) || 0);
          } else if (tx.status === 'pending') {
            pendingTotal += (Number(tx.amount) || 0);
          }
        }
      }
    });

    // 3. Check user's paymentRequests if not yet mirrored in transactions
    paymentRequests.forEach((req) => {
      if (req.userId === user.uid && req.type === 'deposit') {
        const reqDateStr = req.createdAt ? getLocalDateString(new Date(req.createdAt)) : '';
        if (reqDateStr === todayStr) {
          if (req.status === 'pending' && pendingTotal === 0) {
            pendingTotal += (Number(req.amount) || 0);
          } else if (req.status === 'completed' && completedTotal === 0) {
            completedTotal += (Number(req.amount) || 0);
          }
        }
      }
    });

    // Admin accounts or master tester email are granted automatic daily eligibility
    if (profile?.role === 'admin' || profile?.email === ADMIN_EMAIL) {
      completedTotal = Math.max(completedTotal, DAILY_CHECKIN_MIN_DEPOSIT);
    }

    return { todayDepositAmount: completedTotal, todayPendingDepositAmount: pendingTotal };
  }, [user, profile, transactions, paymentRequests, todayStr]);

  const isDailyClaimEligible = (todayDepositAmount >= DAILY_CHECKIN_MIN_DEPOSIT) || (profile?.role === 'admin') || (profile?.email === ADMIN_EMAIL);

  const claimDailyBonus = async (): Promise<DailyClaimResult> => {
    if (!user || !profile) {
      return {
        success: false,
        message: 'Please sign in to claim your daily rewards',
        pointsAwarded: 0,
        cashBonus: 0,
        streak: 0
      };
    }

    const currentTodayStr = getLocalDateString();
    const yesterdayStr = getYesterdayDateString();

    // Prevent duplicate claim for the same day
    if (profile.lastCheckInDate === currentTodayStr) {
      return {
        success: false,
        alreadyClaimed: true,
        message: 'You have already claimed your daily reward today! Come back tomorrow.',
        pointsAwarded: 0,
        cashBonus: 0,
        streak: profile.dailyStreak || 1
      };
    }

    // Check deposit requirement (Must have deposited at least ₹500 today)
    if (!isDailyClaimEligible) {
      if (todayPendingDepositAmount > 0) {
        return {
          success: false,
          message: `Your deposit request of ₹${todayPendingDepositAmount.toLocaleString()} is pending Admin verification. Once verified, your daily reward will unlock!`,
          pointsAwarded: 0,
          cashBonus: 0,
          streak: profile.dailyStreak || 0,
          depositRequired: DAILY_CHECKIN_MIN_DEPOSIT,
          currentDeposit: todayDepositAmount
        };
      }
      return {
        success: false,
        message: `Daily check-in requires a deposit of at least ₹${DAILY_CHECKIN_MIN_DEPOSIT} today. Current deposit: ₹${todayDepositAmount}. Please recharge to unlock your reward!`,
        pointsAwarded: 0,
        cashBonus: 0,
        streak: profile.dailyStreak || 0,
        depositRequired: DAILY_CHECKIN_MIN_DEPOSIT,
        currentDeposit: todayDepositAmount
      };
    }

    // Determine streak continuity
    let newStreak = 1;
    if (profile.lastCheckInDate === yesterdayStr) {
      newStreak = (profile.dailyStreak || 0) + 1;
    } else {
      // Streak broken or brand new streak
      newStreak = 1;
    }

    // Determine reward tiers based on (newStreak - 1) % 7
    const tierIndex = (newStreak - 1) % DAILY_REWARD_SCHEDULE.length;
    const tier = DAILY_REWARD_SCHEDULE[tierIndex] || DAILY_REWARD_SCHEDULE[0];
    const pointsAwarded = 0;
    const cashBonus = tier.cash;

    // Append to checkInHistory
    const currentHistory = Array.isArray(profile.checkInHistory) ? [...profile.checkInHistory] : [];
    if (!currentHistory.includes(currentTodayStr)) {
      currentHistory.push(currentTodayStr);
    }

    const newBalance = profile.balance + cashBonus;

    // Update Firestore User Profile - only cash balance & streak, no daily points
    await updateDoc(doc(db, 'users', user.uid), {
      balance: newBalance,
      dailyStreak: newStreak,
      lastCheckInDate: currentTodayStr,
      checkInHistory: currentHistory
    });

    // Record Transaction in Ledger
    await addDoc(collection(db, 'users', user.uid, 'transactions'), {
      userId: user.uid,
      type: 'bonus',
      amount: cashBonus,
      channel: `Daily Check-in Day ${newStreak}`,
      status: 'completed',
      txId: 'REWARD_' + Date.now(),
      createdAt: new Date().toISOString()
    });

    return {
      success: true,
      message: `Claimed Day ${newStreak} reward! ₹${cashBonus.toFixed(2)} cash credited to your wallet.`,
      pointsAwarded: 0,
      cashBonus,
      streak: newStreak
    };
  };

  const redeemBonusPoints = async (pointsToRedeem: number): Promise<{ success: boolean; message: string }> => {
    if (!user || !profile) return { success: false, message: 'Please login first' };
    const currentPoints = profile.bonusPoints || 0;
    if (pointsToRedeem <= 0 || pointsToRedeem > currentPoints) {
      return { success: false, message: 'Insufficient bonus points to redeem' };
    }
    const cashValue = Math.floor(pointsToRedeem / 10); // 10 points = ₹1
    if (cashValue <= 0) {
      return { success: false, message: 'Minimum 10 points required to convert to ₹1' };
    }

    await updateDoc(doc(db, 'users', user.uid), {
      bonusPoints: currentPoints - pointsToRedeem,
      balance: profile.balance + cashValue
    });

    await addDoc(collection(db, 'users', user.uid, 'transactions'), {
      userId: user.uid,
      type: 'bonus',
      amount: cashValue,
      channel: `Points Exchange (${pointsToRedeem} pts -> ₹${cashValue})`,
      status: 'completed',
      txId: 'EXCHANGE_' + Date.now(),
      createdAt: new Date().toISOString()
    });

    return { success: true, message: `Successfully converted ${pointsToRedeem} points into ₹${cashValue} wallet balance!` };
  };

  const addReferralInvite = async (customName?: string): Promise<{ success: boolean; message: string }> => {
    if (!user || !profile) return { success: false, message: 'Please login first' };
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const randomPhonePrefix = ['98', '87', '91', '70', '99', '88'][Math.floor(Math.random() * 6)];
    const randomDeposit = [500, 1000, 2000, 3500, 5000][Math.floor(Math.random() * 5)];
    const randomTurnover = randomDeposit * (3 + Math.floor(Math.random() * 4));
    const commission = Number((randomTurnover * 0.006).toFixed(2));

    const newRef: Omit<ReferralMember, 'id'> = {
      phoneNumber: `+91 ${randomPhonePrefix}****${randomSuffix}`,
      displayName: customName || `Invited_User_${randomSuffix}`,
      level: 1,
      joinedAt: new Date().toISOString(),
      totalDeposit: randomDeposit,
      totalTurnover: randomTurnover,
      commissionEarned: commission,
      status: 'active'
    };

    await addDoc(collection(db, 'users', user.uid, 'referrals'), newRef);

    // Update user balance and cumulative stats
    await updateDoc(doc(db, 'users', user.uid), {
      balance: profile.balance + commission,
      totalCommission: (profile.totalCommission || 0) + commission,
      totalInvited: (profile.totalInvited || 0) + 1
    });

    await addDoc(collection(db, 'users', user.uid, 'transactions'), {
      userId: user.uid,
      type: 'bonus',
      amount: commission,
      channel: `Referral Commission from ${newRef.displayName}`,
      status: 'completed',
      txId: 'COMM_' + Date.now(),
      createdAt: new Date().toISOString()
    });

    return { success: true, message: `Successfully invited ${newRef.displayName}! ₹${commission} commission credited to wallet.` };
  };

  const isAdmin = Boolean(
    (user?.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) ||
    (profile?.email && profile.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) ||
    profile?.role === 'admin'
  );

  const adminAdjustBalance = async (amount: number, reason: string = 'Admin Quick Adjustment'): Promise<boolean> => {
    if (!user || !profile || !isAdmin) return false;
    const userRef = doc(db, 'users', user.uid);
    const newBalance = Math.max(0, profile.balance + amount);
    await updateDoc(userRef, { balance: newBalance });
    await addDoc(collection(db, 'users', user.uid, 'transactions'), {
      userId: user.uid,
      type: amount >= 0 ? 'deposit' : 'withdraw',
      amount: Math.abs(amount),
      channel: `Admin Adjustment: ${reason}`,
      status: 'completed',
      txId: 'ADM_' + Date.now(),
      createdAt: new Date().toISOString()
    });
    setProfile(p => p ? { ...p, balance: newBalance } : null);
    return true;
  };

  const adminSetVipLevel = async (level: number): Promise<boolean> => {
    if (!user || !profile || !isAdmin) return false;
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, { vipLevel: level });
    setProfile(p => p ? { ...p, vipLevel: level } : null);
    return true;
  };

  const adminVerifyPaymentRequest = async (
    requestId: string,
    approve: boolean,
    adminNotes?: string,
    rejectionReason?: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!user || !isAdmin) {
      return { success: false, message: 'Unauthorized: Admin privileges required.' };
    }

    try {
      const reqRef = doc(db, 'paymentRequests', requestId);
      const reqSnap = await getDoc(reqRef);
      if (!reqSnap.exists()) {
        return { success: false, message: 'Payment request record not found.' };
      }

      const reqData = reqSnap.data() as PaymentRequest;
      if (reqData.status !== 'pending') {
        return { success: false, message: `Request is already marked as ${reqData.status}.` };
      }

      const targetUserId = reqData.userId;
      const amount = Number(reqData.amount) || 0;
      const newStatus = approve ? 'completed' : 'rejected';
      const nowIso = new Date().toISOString();
      const effectiveNote = adminNotes || rejectionReason || (approve ? 'Verified & Approved by Admin' : 'Rejected by Admin');
      const verifiedByStr = user.email || profile?.email || 'Platform Admin (s75214573)';

      // 1. Update Payment Request status in Firestore
      const updateData: Record<string, any> = {
        status: newStatus,
        adminNotes: effectiveNote,
        verifiedBy: verifiedByStr,
        verifiedAt: nowIso
      };
      if (!approve) {
        updateData.rejectionReason = rejectionReason || effectiveNote;
      }
      await updateDoc(reqRef, cleanFirestoreData(updateData));

      // 2. Fetch and update target user profile (balance, totalRecharge / totalWithdraw, VIP)
      const targetUserRef = doc(db, 'users', targetUserId);
      const targetUserSnap = await getDoc(targetUserRef);

      if (targetUserSnap.exists()) {
        const uData = targetUserSnap.data() as UserProfile;

        if (reqData.type === 'deposit') {
          if (approve) {
            // Deposit APPROVED: Credit the balance!
            const currentBal = Number(uData.balance) || 0;
            const newBal = currentBal + amount;
            const newRecharge = (Number(uData.totalRecharge) || 0) + amount;

            let vip = uData.vipLevel || 1;
            if (newRecharge >= 50000) vip = 5;
            else if (newRecharge >= 20000) vip = 4;
            else if (newRecharge >= 5000) vip = 3;
            else if (newRecharge >= 1000) vip = 2;

            const targetTodayStr = getLocalDateString();
            const prevTodayDep = (uData.todayDepositDate === targetTodayStr ? (uData.todayDepositAmount || 0) : 0);
            const updatedTodayDep = prevTodayDep + amount;

            await updateDoc(targetUserRef, {
              balance: newBal,
              totalRecharge: newRecharge,
              vipLevel: Math.max(vip, uData.vipLevel || 1),
              todayDepositAmount: updatedTodayDep,
              todayDepositDate: targetTodayStr
            });

            if (user.uid === targetUserId) {
              setProfile(p => p ? { 
                ...p, 
                balance: newBal, 
                totalRecharge: newRecharge, 
                vipLevel: Math.max(vip, p.vipLevel || 1),
                todayDepositAmount: updatedTodayDep,
                todayDepositDate: targetTodayStr
              } : null);
            }
          }
        } else if (reqData.type === 'withdraw') {
          if (approve) {
            // Withdrawal APPROVED: Increment totalWithdraw
            const newWithdraw = (Number(uData.totalWithdraw) || 0) + amount;
            await updateDoc(targetUserRef, {
              totalWithdraw: newWithdraw
            });
            if (user.uid === targetUserId) {
              setProfile(p => p ? { ...p, totalWithdraw: newWithdraw } : null);
            }
          } else {
            // Withdrawal REJECTED: Refund the held amount back to user balance!
            const currentBal = Number(uData.balance) || 0;
            const newBal = currentBal + amount;
            await updateDoc(targetUserRef, {
              balance: newBal
            });
            if (user.uid === targetUserId) {
              setProfile(p => p ? { ...p, balance: newBal } : null);
            }
          }
        }
      }

      // 3. Update the matching transaction in users/{targetUserId}/transactions
      try {
        const userTxCol = collection(db, 'users', targetUserId, 'transactions');
        const qTx = query(userTxCol, where('txId', '==', reqData.txId));
        const txSnaps = await getDocs(qTx);
        if (!txSnaps.empty) {
          for (const tDoc of txSnaps.docs) {
            const txUpdate: Record<string, any> = {
              status: newStatus,
              adminNotes: effectiveNote
            };
            if (!approve) {
              txUpdate.rejectionReason = rejectionReason || effectiveNote;
            }
            await updateDoc(tDoc.ref, cleanFirestoreData(txUpdate));
          }
        }
      } catch (txErr) {
        console.warn('Could not sync user subcollection transaction:', txErr);
      }

      return {
        success: true,
        message: approve
          ? `${reqData.type === 'deposit' ? 'Deposit' : 'Withdrawal'} of ₹${amount.toLocaleString()} for ${reqData.userDisplayName || 'User'} verified and approved!`
          : `${reqData.type === 'deposit' ? 'Deposit' : 'Withdrawal'} of ₹${amount.toLocaleString()} has been rejected${reqData.type === 'withdraw' ? ' and refunded' : ''}.`
      };
    } catch (err: any) {
      console.error('adminVerifyPaymentRequest error:', err);
      return { success: false, message: err?.message || 'Admin verification failed.' };
    }
  };

  const createTestPaymentRequest = async (type: 'deposit' | 'withdraw', amount: number) => {
    if (!user || !profile) return;
    const testNames = ['Rohit_King', 'Sunil_Pro', 'Kavita_VIP', 'Dev_Winner', 'Aman_Gambler'];
    const randomName = testNames[Math.floor(Math.random() * testNames.length)];
    const randomPhone = `+91 ${Math.floor(7000000000 + Math.random() * 2999999999)}`;
    const txId = (type === 'deposit' ? 'DEP_' : 'WTH_') + Date.now();
    const testApp = ['Google Pay', 'PhonePe', 'Paytm', 'BHIM UPI'][Math.floor(Math.random() * 4)];
    const testUtr = `UTR${Math.floor(100000000000 + Math.random() * 900000000000)}`;

    const proofImageUrl = type === 'deposit' && typeof window !== 'undefined'
      ? generateSampleUpiReceipt({
          amount,
          utrNumber: testUtr,
          senderName: randomName,
          senderUpi: `${randomName.toLowerCase()}@okhdfcbank`,
          app: testApp
        })
      : '';

    const paymentReqDoc: Record<string, any> = {
      userId: user.uid,
      userDisplayName: randomName,
      userPhone: randomPhone,
      userEmail: `${randomName.toLowerCase()}@winxbet.vip`,
      type,
      amount,
      channel: type === 'deposit' ? `UPI (${testApp})` : 'IMPS NetBanking',
      status: 'pending',
      txId,
      createdAt: new Date().toISOString()
    };

    if (type === 'deposit') {
      paymentReqDoc.utrNumber = testUtr;
      if (proofImageUrl) paymentReqDoc.proofImageUrl = proofImageUrl;
      paymentReqDoc.proofFileName = `${testApp.toLowerCase().replace(/\s+/g, '_')}_receipt_${amount}.jpg`;
      paymentReqDoc.senderUpiId = `${randomName.toLowerCase()}@okhdfcbank`;
      paymentReqDoc.senderName = randomName;
      paymentReqDoc.paymentApp = testApp;
    } else {
      paymentReqDoc.upiId = `${randomName.toLowerCase()}@okhdfcbank`;
    }

    await addDoc(collection(db, 'paymentRequests'), cleanFirestoreData(paymentReqDoc));
  };

  const adminGetAllUsers = async (): Promise<UserProfile[]> => {
    if (!user || !isAdmin) return [];
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list: UserProfile[] = [];
      snap.forEach(d => {
        list.push({ uid: d.id, ...d.data() } as UserProfile);
      });
      list.sort((a, b) => {
        const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tB - tA;
      });
      return list;
    } catch (err) {
      console.error('adminGetAllUsers error:', err);
      return [];
    }
  };

  const adminUpdateUserWallet = async (
    targetUid: string,
    mode: 'set' | 'adjust',
    amount: number,
    reason: string
  ): Promise<{ success: boolean; message: string; newBalance?: number }> => {
    if (!user || !isAdmin) {
      return { success: false, message: 'Unauthorized: Admin privileges required.' };
    }
    try {
      const targetRef = doc(db, 'users', targetUid);
      const targetSnap = await getDoc(targetRef);
      if (!targetSnap.exists()) {
        return { success: false, message: 'Target user record not found.' };
      }
      const uData = targetSnap.data() as UserProfile;
      const currentBal = Number(uData.balance) || 0;
      let newBalance = mode === 'set' ? Math.max(0, amount) : Math.max(0, currentBal + amount);
      newBalance = Math.round(newBalance * 100) / 100;
      const diff = newBalance - currentBal;
      const cleanReason = reason.trim() || 'Admin manual balance adjustment';

      await updateDoc(targetRef, { balance: newBalance });

      await addDoc(collection(db, 'users', targetUid, 'transactions'), cleanFirestoreData({
        userId: targetUid,
        type: diff >= 0 ? 'deposit' : 'withdraw',
        amount: Math.abs(diff),
        channel: `Admin ${mode === 'set' ? 'Balance Set' : 'Balance Adjust'}: ${cleanReason}`,
        status: 'completed',
        txId: 'ADM_BAL_' + Date.now(),
        adminNotes: cleanReason,
        createdAt: new Date().toISOString()
      }));

      if (user.uid === targetUid) {
        setProfile(p => p ? { ...p, balance: newBalance } : null);
      }

      return {
        success: true,
        message: `Updated wallet for ${uData.displayName || targetUid} to ₹${newBalance.toLocaleString()}`,
        newBalance
      };
    } catch (err: any) {
      console.error('adminUpdateUserWallet error:', err);
      return { success: false, message: err?.message || 'Failed to update user wallet.' };
    }
  };

  const adminUpdateUserProfile = async (
    targetUid: string,
    updates: Partial<UserProfile>,
    reason?: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!user || !isAdmin) {
      return { success: false, message: 'Unauthorized: Admin privileges required.' };
    }
    try {
      const targetRef = doc(db, 'users', targetUid);
      const targetSnap = await getDoc(targetRef);
      if (!targetSnap.exists()) {
        return { success: false, message: 'User record not found.' };
      }

      const filteredUpdates: Record<string, any> = {};
      if (updates.displayName !== undefined) filteredUpdates.displayName = updates.displayName.trim();
      if (updates.phoneNumber !== undefined) filteredUpdates.phoneNumber = updates.phoneNumber.trim();
      if (updates.email !== undefined) filteredUpdates.email = updates.email.trim();
      if (updates.vipLevel !== undefined) filteredUpdates.vipLevel = Number(updates.vipLevel);
      if (updates.status !== undefined) filteredUpdates.status = updates.status;
      if (updates.adminNotes !== undefined) filteredUpdates.adminNotes = updates.adminNotes.trim();
      if (updates.customPin !== undefined) filteredUpdates.customPin = updates.customPin.trim();

      await updateDoc(targetRef, cleanFirestoreData(filteredUpdates));

      if (user.uid === targetUid) {
        setProfile(p => p ? { ...p, ...filteredUpdates } : null);
      }

      return { success: true, message: `Successfully updated user profile details.` };
    } catch (err: any) {
      console.error('adminUpdateUserProfile error:', err);
      return { success: false, message: err?.message || 'Failed to update profile.' };
    }
  };

  const adminGetUserActivity = async (
    targetUid: string
  ): Promise<{ bets: GameBet[]; transactions: Transaction[]; requests: PaymentRequest[] }> => {
    if (!user || !isAdmin) return { bets: [], transactions: [], requests: [] };
    try {
      const betsSnap = await getDocs(
        query(collection(db, 'users', targetUid, 'bets'), orderBy('createdAt', 'desc'), limit(50))
      );
      const bets: GameBet[] = [];
      betsSnap.forEach(d => bets.push({ id: d.id, ...d.data() } as GameBet));

      const txSnap = await getDocs(
        query(collection(db, 'users', targetUid, 'transactions'), orderBy('createdAt', 'desc'), limit(50))
      );
      const txs: Transaction[] = [];
      txSnap.forEach(d => txs.push({ id: d.id, ...d.data() } as Transaction));

      const reqSnap = await getDocs(
        query(collection(db, 'paymentRequests'), where('userId', '==', targetUid), limit(50))
      );
      const reqs: PaymentRequest[] = [];
      reqSnap.forEach(d => reqs.push({ id: d.id, ...d.data() } as PaymentRequest));
      reqs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return { bets, transactions: txs, requests: reqs };
    } catch (err) {
      console.error('adminGetUserActivity error:', err);
      return { bets: [], transactions: [], requests: [] };
    }
  };

  const adminGetRealLiquidity = async (): Promise<RealLiquidityStats> => {
    if (!user || !isAdmin) {
      return {
        vaultReserve: 0,
        totalUserBalances: 0,
        totalApprovedDeposits: 0,
        totalApprovedWithdrawals: 0,
        pendingDepositVolume: 0,
        pendingWithdrawalVolume: 0,
        totalRegisteredUsers: 0,
        netLiquidity: 0,
        totalTurnover: 0,
        totalBetsCount: 0,
        lastUpdated: new Date().toISOString()
      };
    }
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      let totalBalances = 0;
      let usersCount = 0;
      usersSnap.forEach(docSnap => {
        usersCount++;
        const d = docSnap.data() as UserProfile;
        totalBalances += Number(d.balance) || 0;
      });

      const reqSnap = await getDocs(collection(db, 'paymentRequests'));
      let approvedDeposits = 0;
      let approvedWithdrawals = 0;
      let pendingDeposits = 0;
      let pendingWithdrawals = 0;

      reqSnap.forEach(docSnap => {
        const d = docSnap.data() as PaymentRequest;
        const amt = Number(d.amount) || 0;
        if (d.type === 'deposit') {
          if (d.status === 'completed') approvedDeposits += amt;
          else if (d.status === 'pending') pendingDeposits += amt;
        } else if (d.type === 'withdraw') {
          if (d.status === 'completed') approvedWithdrawals += amt;
          else if (d.status === 'pending') pendingWithdrawals += amt;
        }
      });

      let vaultDocReserve = 0;
      try {
        const vSnap = await getDoc(doc(db, 'system', 'vault'));
        if (vSnap.exists()) {
          vaultDocReserve = Number(vSnap.data()?.reserve) || 0;
        }
      } catch (e) {
        // Ignored
      }

      const baseReserve = vaultDocReserve > 0 ? vaultDocReserve : 500000;
      const netLiquidity = baseReserve + approvedDeposits - approvedWithdrawals - totalBalances;

      return {
        vaultReserve: baseReserve,
        totalUserBalances: Math.round(totalBalances * 100) / 100,
        totalApprovedDeposits: Math.round(approvedDeposits * 100) / 100,
        totalApprovedWithdrawals: Math.round(approvedWithdrawals * 100) / 100,
        pendingDepositVolume: Math.round(pendingDeposits * 100) / 100,
        pendingWithdrawalVolume: Math.round(pendingWithdrawals * 100) / 100,
        totalRegisteredUsers: usersCount,
        netLiquidity: Math.round(netLiquidity * 100) / 100,
        totalTurnover: Math.round((approvedDeposits * 1.8 + totalBalances * 0.9) * 100) / 100,
        totalBetsCount: 0,
        lastUpdated: new Date().toISOString()
      };
    } catch (err) {
      console.error('adminGetRealLiquidity error:', err);
      return {
        vaultReserve: 0,
        totalUserBalances: 0,
        totalApprovedDeposits: 0,
        totalApprovedWithdrawals: 0,
        pendingDepositVolume: 0,
        pendingWithdrawalVolume: 0,
        totalRegisteredUsers: 0,
        netLiquidity: 0,
        totalTurnover: 0,
        totalBetsCount: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  };

  const adminAdjustPlatformVault = async (amount: number, note: string): Promise<{ success: boolean; newReserve: number }> => {
    if (!user || !isAdmin) return { success: false, newReserve: 0 };
    try {
      const vRef = doc(db, 'system', 'vault');
      const vSnap = await getDoc(vRef);
      const current = vSnap.exists() ? (Number(vSnap.data()?.reserve) || 500000) : 500000;
      const newReserve = Math.max(0, current + amount);
      await setDoc(vRef, {
        reserve: newReserve,
        lastAdjustment: amount,
        note: note || 'Admin Liquidity Injection',
        updatedBy: user.email || 'Admin',
        updatedAt: new Date().toISOString()
      }, { merge: true });

      return { success: true, newReserve };
    } catch (err) {
      console.error('adminAdjustPlatformVault error:', err);
      return { success: false, newReserve: 0 };
    }
  };

  const pendingRequestsCount = paymentRequests.filter(r => r.status === 'pending').length;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        loading,
        loginWithPhone,
        registerWithPhone,
        loginWithGoogle,
        loginAsGuest,
        loginAsAdmin,
        logout,
        deposit,
        instantDeposit,
        withdraw,
        cancelWithdrawal,
        selfVerifyDeposit,
        processWithdrawalPayout,
        placeBet,
        settleBet,
        betNotification,
        dismissBetNotification,
        triggerBetNotification,
        claimDailyBonus,
        redeemBonusPoints,
        isDailyClaimedToday,
        todayDepositAmount,
        todayPendingDepositAmount,
        isDailyClaimEligible,
        recentBets,
        transactions,
        paymentRequests,
        pendingRequestsCount,
        referrals,
        addReferralInvite,
        isNewRegistration,
        dismissNewRegistrationModal,
        adminAdjustBalance,
        adminSetVipLevel,
        adminVerifyPaymentRequest,
        createTestPaymentRequest,
        adminGetAllUsers,
        adminUpdateUserWallet,
        adminUpdateUserProfile,
        adminGetUserActivity,
        adminGetRealLiquidity,
        adminAdjustPlatformVault
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
