import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc,
  deleteField,
  query, 
  orderBy, 
  limit, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  WingoPeriod, 
  AviatorRoundRecord, 
  GlobalBet, 
  LiveRoundBetPool, 
  WingoUpcomingResult,
  K3Period,
  K3UpcomingResult,
  TrxPeriod,
  TrxUpcomingResult,
  AviatorUpcomingResult,
  DragonTigerPeriod,
  DragonTigerUpcomingResult 
} from '../types';
import { 
  generateHistoricalPeriods, 
  getWingoPeriodId,
  getPreviousPeriodId,
  getNextPeriodId,
  getNumberColors, 
  getNumberSize, 
  calculateBetResult,
  getDeterministicRoundResult
} from '../wingoLogic';
import { 
  generateHistoricalAviatorRounds, 
  getDeterministicAviatorCrash, 
  getMultiplierTier, 
  filterLastOneHour,
  getAviatorMultiplierAtSec,
  getAviatorFlightDurationSec
} from '../aviatorLogic';
import {
  getK3PeriodId,
  getK3PeriodData,
  getDeterministicK3Dice,
  generateHistoricalK3Periods,
  calculateK3BetResult
} from '../k3Logic';
import {
  getTrxPeriodId,
  getDeterministicTrxData,
  generateHistoricalTrxPeriods,
  calculateTrxBetResult
} from '../trxLogic';
import {
  getDeterministicDragonTiger,
  generateHistoricalDragonTiger
} from '../dragonTigerLogic';
import { useAuth } from './AuthContext';
import { triggerHaptic } from '../utils/haptics';

export interface SimulatedCoPilot {
  user: string;
  amount: number;
  target: number;
  cashoutMultiplier: number | null;
  hasCashedOut: boolean;
  color: string;
}

const CO_PILOT_POOL = [
  { user: '98***412', amount: 200, target: 1.85, color: 'from-amber-500 to-red-500' },
  { user: '87***903', amount: 500, target: 2.40, color: 'from-blue-500 to-indigo-600' },
  { user: '91***554', amount: 100, target: 1.45, color: 'from-emerald-500 to-teal-600' },
  { user: '70***881', amount: 1000, target: 3.20, color: 'from-purple-500 to-rose-600' },
  { user: '99***231', amount: 350, target: 5.10, color: 'from-pink-500 to-yellow-500' },
  { user: '94***672', amount: 150, target: 1.60, color: 'from-cyan-500 to-blue-600' },
  { user: '88***019', amount: 750, target: 2.95, color: 'from-orange-500 to-amber-600' },
  { user: '77***442', amount: 300, target: 4.15, color: 'from-violet-500 to-purple-600' },
];

export interface AviatorUserBetState {
  betId: string;
  roundId: string;
  amount: number;
  grossAmount?: number;
  netAmount?: number;
  autoCashout: boolean;
  autoCashoutMultiplier: number;
  cashedOut: boolean;
  cashedMultiplier?: number;
  winAmount?: number;
}

export interface PendingWingoBet {
  betId: string;
  periodId: string;
  selection: string;
  amount: number;
  multiplier: number;
  netAmount?: number;
  fee?: number;
}

export interface PendingGameBet {
  betId: string;
  gameType: 'k3' | 'trx' | 'dragontiger';
  periodId: string;
  selection: string;
  amount: number;
  multiplier: number;
  netAmount?: number;
  fee?: number;
}

interface ContinuousGameContextType {
  // WinGo Continuous State
  wingoTimeLeft: number;
  wingoCurrentPeriod: string;
  wingoIsLocked: boolean;
  wingoHistory: WingoPeriod[];
  wingoRevealedResult: WingoPeriod | null;
  wingoIsRevealing: boolean;
  wingoPendingBets: PendingWingoBet[];
  registerWingoBet: (bet: PendingWingoBet) => void;
  wingoUpcomingResult: WingoUpcomingResult;
  wingoOverrides: Record<string, number>;
  adminSetWingoOverride: (periodId: string, targetNumber: number) => Promise<{ success: boolean; message: string }>;
  adminClearWingoOverride: (periodId: string) => Promise<{ success: boolean; message: string }>;
  getWingoUpcomingForecast: (count?: number) => WingoUpcomingResult[];

  // Aviator Continuous State (Authentic slower Spribe pacing)
  aviatorPhase: 'countdown' | 'flying' | 'crashed';
  aviatorCountdownLeft: number;
  aviatorCurrentRoundId: string;
  aviatorMultiplier: number;
  aviatorCrashPoint: number;
  aviatorHistory: AviatorRoundRecord[];
  aviatorRecentMultipliers: number[];
  aviatorCoPilots: SimulatedCoPilot[];
  aviatorUserBet: AviatorUserBetState | null;
  aviatorQueuedNextBet: { amount: number; autoCashout: boolean; autoCashoutMultiplier: number } | null;
  placeAviatorBet: (amount: number, autoCashout?: boolean, autoCashoutMultiplier?: number) => Promise<{ success: boolean; message: string }>;
  cashoutAviatorBet: () => Promise<{ success: boolean; winAmount: number; multiplier: number } | null>;
  cancelQueuedAviatorBet: () => void;
  aviatorOverrides: Record<string, number>;
  adminSetAviatorOverride: (roundId: string, crashPoint: number) => Promise<{ success: boolean; message: string }>;
  adminClearAviatorOverride: (roundId: string) => Promise<{ success: boolean; message: string }>;
  getAviatorUpcomingForecast: (count?: number) => AviatorUpcomingResult[];
  aviatorUpcomingResult: AviatorUpcomingResult;

  // K3 3-Dice Continuous State
  k3TimeLeft: number;
  k3CurrentPeriod: string;
  k3IsLocked: boolean;
  k3History: K3Period[];
  k3RevealedResult: K3Period | null;
  k3IsRevealing: boolean;
  k3UpcomingResult: K3UpcomingResult;
  k3Overrides: Record<string, [number, number, number]>;
  adminSetK3Override: (periodId: string, dice: [number, number, number]) => Promise<{ success: boolean; message: string }>;
  adminClearK3Override: (periodId: string) => Promise<{ success: boolean; message: string }>;
  getK3UpcomingForecast: (count?: number) => K3UpcomingResult[];
  placeK3Bet: (selection: string, amount: number) => Promise<{ success: boolean; message: string }>;

  // TRX Hash Win Go Continuous State
  trxTimeLeft: number;
  trxCurrentPeriod: string;
  trxIsLocked: boolean;
  trxHistory: TrxPeriod[];
  trxRevealedResult: TrxPeriod | null;
  trxIsRevealing: boolean;
  trxUpcomingResult: TrxUpcomingResult;
  trxOverrides: Record<string, number>;
  adminSetTrxOverride: (periodId: string, digit: number) => Promise<{ success: boolean; message: string }>;
  adminClearTrxOverride: (periodId: string) => Promise<{ success: boolean; message: string }>;
  getTrxUpcomingForecast: (count?: number) => TrxUpcomingResult[];
  placeTrxBet: (selection: string, amount: number) => Promise<{ success: boolean; message: string }>;

  // Dragon Tiger Continuous State
  dtTimeLeft: number;
  dtCurrentRoundId: string;
  dtHistory: DragonTigerPeriod[];
  dtRevealedResult: DragonTigerPeriod | null;
  dtUpcomingResult: DragonTigerUpcomingResult;
  dtOverrides: Record<string, 'dragon' | 'tiger' | 'tie'>;
  adminSetDtOverride: (roundId: string, winner: 'dragon' | 'tiger' | 'tie') => Promise<{ success: boolean; message: string }>;
  adminClearDtOverride: (roundId: string) => Promise<{ success: boolean; message: string }>;
  getDtUpcomingForecast: (count?: number) => DragonTigerUpcomingResult[];
  placeDtBet: (selection: 'dragon' | 'tiger' | 'tie', amount: number) => Promise<{ success: boolean; message: string }>;

  // Real-time Cloud Admin Bet Pool Visibility
  liveRoundPool: LiveRoundBetPool | null;
  liveGlobalBets: GlobalBet[];

  // 1-Hour Retention & Continuous Security Stats
  retentionWindowMinutes: number;
  lastPurgeTime: string;
  totalPurgedWingoCount: number;
  totalPurgedAviatorCount: number;
  continuousEngineUptimeSec: number;
}

const ContinuousGameContext = createContext<ContinuousGameContextType | undefined>(undefined);

export const ContinuousGameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, placeBet, settleBet } = useAuth();

  // Engine Uptime
  const [engineUptime, setEngineUptime] = useState<number>(0);
  const [totalPurgedWingo, setTotalPurgedWingo] = useState<number>(0);
  const [totalPurgedAviator, setTotalPurgedAviator] = useState<number>(0);
  const [lastPurgeTime, setLastPurgeTime] = useState<string>(() => new Date().toLocaleTimeString());

  // Global synchronized live bets stream
  const [liveGlobalBets, setLiveGlobalBets] = useState<GlobalBet[]>([]);

  // ==========================================
  // 1. WINGO STATE & CONTINUOUS TIMELINE
  // ==========================================
  const [wingoTimeLeft, setWingoTimeLeft] = useState<number>(() => 60 - (Math.floor(Date.now() / 1000) % 60));
  const [wingoCurrentPeriod, setWingoCurrentPeriod] = useState<string>(() => getWingoPeriodId(Date.now()));
  const [wingoHistory, setWingoHistory] = useState<WingoPeriod[]>(() => generateHistoricalPeriods(60));
  const [wingoRevealedResult, setWingoRevealedResult] = useState<WingoPeriod | null>(null);
  const [wingoIsRevealing, setWingoIsRevealing] = useState<boolean>(false);
  const [wingoPendingBets, setWingoPendingBets] = useState<PendingWingoBet[]>([]);

  const wingoCurrentPeriodRef = useRef<string>(wingoCurrentPeriod);
  wingoCurrentPeriodRef.current = wingoCurrentPeriod;
  const wingoPendingBetsRef = useRef<PendingWingoBet[]>(wingoPendingBets);
  wingoPendingBetsRef.current = wingoPendingBets;

  // Wingo Overrides
  const [wingoOverrides, setWingoOverrides] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem('winxbet_wingo_overrides');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const wingoOverridesRef = useRef<Record<string, number>>(wingoOverrides);
  wingoOverridesRef.current = wingoOverrides;

  useEffect(() => {
    try {
      const docRef = doc(db, 'system', 'wingoOverrides');
      const unsub = onSnapshot(docRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data() as Record<string, number>;
          setWingoOverrides((prev) => ({ ...prev, ...data }));
        }
      });
      return () => unsub();
    } catch {}
  }, []);

  const adminSetWingoOverride = useCallback(async (periodId: string, targetNumber: number) => {
    if (targetNumber < 0 || targetNumber > 9) return { success: false, message: 'Invalid target number (0-9).' };
    setWingoOverrides(prev => {
      const next = { ...prev, [periodId]: targetNumber };
      try { localStorage.setItem('winxbet_wingo_overrides', JSON.stringify(next)); } catch {}
      return next;
    });
    try {
      await setDoc(doc(db, 'system', 'wingoOverrides'), { [periodId]: targetNumber }, { merge: true });
    } catch {}
    return { success: true, message: `WinGo Round #${periodId} result locked to Number ${targetNumber}!` };
  }, []);

  const adminClearWingoOverride = useCallback(async (periodId: string) => {
    setWingoOverrides(prev => {
      const next = { ...prev };
      delete next[periodId];
      try { localStorage.setItem('winxbet_wingo_overrides', JSON.stringify(next)); } catch {}
      return next;
    });
    try {
      await updateDoc(doc(db, 'system', 'wingoOverrides'), { [periodId]: deleteField() });
    } catch {}
    return { success: true, message: `WinGo Round #${periodId} reset to provably fair deterministic lottery.` };
  }, []);

  const wingoUpcomingResult = useMemo((): WingoUpcomingResult => {
    const hasOverride = wingoOverrides[wingoCurrentPeriod] !== undefined;
    const det = getDeterministicRoundResult(wingoCurrentPeriod);
    const num = hasOverride ? wingoOverrides[wingoCurrentPeriod] : det.number;
    return {
      periodId: wingoCurrentPeriod,
      number: num,
      colors: getNumberColors(num),
      size: getNumberSize(num),
      hash: det.hash,
      isOverridden: hasOverride,
      timeLeft: wingoTimeLeft
    };
  }, [wingoCurrentPeriod, wingoOverrides, wingoTimeLeft]);

  const getWingoUpcomingForecast = useCallback((count: number = 6): WingoUpcomingResult[] => {
    const list: WingoUpcomingResult[] = [];
    let curPeriod = wingoCurrentPeriod;
    for (let i = 0; i < count; i++) {
      const hasOverride = wingoOverrides[curPeriod] !== undefined;
      const det = getDeterministicRoundResult(curPeriod);
      const num = hasOverride ? wingoOverrides[curPeriod] : det.number;
      list.push({
        periodId: curPeriod,
        number: num,
        colors: getNumberColors(num),
        size: getNumberSize(num),
        hash: det.hash,
        isOverridden: hasOverride,
        timeLeft: i === 0 ? wingoTimeLeft : i * 60 + wingoTimeLeft
      });
      curPeriod = getNextPeriodId(curPeriod);
    }
    return list;
  }, [wingoCurrentPeriod, wingoOverrides, wingoTimeLeft]);

  const wingoIsLocked = wingoTimeLeft <= 5;
  const registerWingoBet = useCallback((bet: PendingWingoBet) => {
    setWingoPendingBets(prev => [...prev, bet]);
  }, []);

  // ==========================================
  // 2. K3 3-DICE CONTINUOUS TIMELINE
  // ==========================================
  const [k3TimeLeft, setK3TimeLeft] = useState<number>(() => 60 - (Math.floor(Date.now() / 1000) % 60));
  const [k3CurrentPeriod, setK3CurrentPeriod] = useState<string>(() => getK3PeriodId(Date.now()));
  const [k3History, setK3History] = useState<K3Period[]>(() => generateHistoricalK3Periods(40));
  const [k3RevealedResult, setK3RevealedResult] = useState<K3Period | null>(null);
  const [k3IsRevealing, setK3IsRevealing] = useState<boolean>(false);
  const [k3PendingBets, setK3PendingBets] = useState<PendingGameBet[]>([]);

  const k3CurrentPeriodRef = useRef<string>(k3CurrentPeriod);
  k3CurrentPeriodRef.current = k3CurrentPeriod;
  const k3PendingBetsRef = useRef<PendingGameBet[]>(k3PendingBets);
  k3PendingBetsRef.current = k3PendingBets;

  const [k3Overrides, setK3Overrides] = useState<Record<string, [number, number, number]>>(() => {
    try {
      const stored = localStorage.getItem('winxbet_k3_overrides');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const k3OverridesRef = useRef<Record<string, [number, number, number]>>(k3Overrides);
  k3OverridesRef.current = k3Overrides;

  useEffect(() => {
    try {
      const unsub = onSnapshot(doc(db, 'system', 'k3Overrides'), (snap) => {
        if (snap.exists()) {
          setK3Overrides(prev => ({ ...prev, ...(snap.data() as any) }));
        }
      });
      return () => unsub();
    } catch {}
  }, []);

  const adminSetK3Override = useCallback(async (periodId: string, dice: [number, number, number]) => {
    setK3Overrides(prev => {
      const next = { ...prev, [periodId]: dice };
      try { localStorage.setItem('winxbet_k3_overrides', JSON.stringify(next)); } catch {}
      return next;
    });
    try {
      await setDoc(doc(db, 'system', 'k3Overrides'), { [periodId]: dice }, { merge: true });
    } catch {}
    return { success: true, message: `K3 Round #${periodId} locked to Dice [${dice.join(', ')}] (Sum: ${dice[0] + dice[1] + dice[2]})!` };
  }, []);

  const adminClearK3Override = useCallback(async (periodId: string) => {
    setK3Overrides(prev => {
      const next = { ...prev };
      delete next[periodId];
      try { localStorage.setItem('winxbet_k3_overrides', JSON.stringify(next)); } catch {}
      return next;
    });
    try {
      await updateDoc(doc(db, 'system', 'k3Overrides'), { [periodId]: deleteField() });
    } catch {}
    return { success: true, message: `K3 Round #${periodId} reset to provably fair deterministic roll.` };
  }, []);

  const k3UpcomingResult = useMemo((): K3UpcomingResult => {
    const hasOverride = k3Overrides[k3CurrentPeriod] !== undefined;
    const periodData = getK3PeriodData(k3CurrentPeriod, k3Overrides[k3CurrentPeriod]);
    return {
      periodId: k3CurrentPeriod,
      dice: periodData.dice,
      total: periodData.total,
      size: periodData.size,
      parity: periodData.parity,
      isTriple: periodData.isTriple,
      isDouble: periodData.isDouble,
      isOverridden: hasOverride,
      timeLeft: k3TimeLeft
    };
  }, [k3CurrentPeriod, k3Overrides, k3TimeLeft]);

  const getK3UpcomingForecast = useCallback((count: number = 6): K3UpcomingResult[] => {
    const list: K3UpcomingResult[] = [];
    const now = Date.now();
    for (let i = 0; i < count; i++) {
      const targetTime = now + i * 60000;
      const pId = getK3PeriodId(targetTime);
      const hasOverride = k3Overrides[pId] !== undefined;
      const pData = getK3PeriodData(pId, k3Overrides[pId], targetTime);
      list.push({
        periodId: pId,
        dice: pData.dice,
        total: pData.total,
        size: pData.size,
        parity: pData.parity,
        isTriple: pData.isTriple,
        isDouble: pData.isDouble,
        isOverridden: hasOverride,
        timeLeft: i === 0 ? k3TimeLeft : i * 60 + k3TimeLeft
      });
    }
    return list;
  }, [k3Overrides, k3TimeLeft]);

  const k3IsLocked = k3TimeLeft <= 5;

  const placeK3Bet = async (selection: string, amount: number) => {
    if (k3IsLocked) return { success: false, message: 'Betting is locked for current round' };
    const res = await placeBet({
      gameType: 'k3',
      periodId: k3CurrentPeriod,
      selection,
      amount,
      multiplier: 1
    });
    if (res.success && res.betId) {
      setK3PendingBets(prev => [...prev, {
        betId: res.betId!,
        gameType: 'k3',
        periodId: k3CurrentPeriod,
        selection,
        amount,
        multiplier: 1,
        netAmount: res.netAmount,
        fee: res.fee
      }]);
      triggerHaptic('medium');
      return { success: true, message: `Bet of ₹${amount} placed on ${selection}!` };
    }
    return { success: false, message: res.message };
  };

  // ==========================================
  // 3. TRX HASH WIN GO CONTINUOUS TIMELINE
  // ==========================================
  const [trxTimeLeft, setTrxTimeLeft] = useState<number>(() => 60 - (Math.floor(Date.now() / 1000) % 60));
  const [trxCurrentPeriod, setTrxCurrentPeriod] = useState<string>(() => getTrxPeriodId(Date.now()));
  const [trxHistory, setTrxHistory] = useState<TrxPeriod[]>(() => generateHistoricalTrxPeriods(40));
  const [trxRevealedResult, setTrxRevealedResult] = useState<TrxPeriod | null>(null);
  const [trxIsRevealing, setTrxIsRevealing] = useState<boolean>(false);
  const [trxPendingBets, setTrxPendingBets] = useState<PendingGameBet[]>([]);

  const trxCurrentPeriodRef = useRef<string>(trxCurrentPeriod);
  trxCurrentPeriodRef.current = trxCurrentPeriod;
  const trxPendingBetsRef = useRef<PendingGameBet[]>(trxPendingBets);
  trxPendingBetsRef.current = trxPendingBets;

  const [trxOverrides, setTrxOverrides] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem('winxbet_trx_overrides');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const trxOverridesRef = useRef<Record<string, number>>(trxOverrides);
  trxOverridesRef.current = trxOverrides;

  useEffect(() => {
    try {
      const unsub = onSnapshot(doc(db, 'system', 'trxOverrides'), (snap) => {
        if (snap.exists()) {
          setTrxOverrides(prev => ({ ...prev, ...(snap.data() as any) }));
        }
      });
      return () => unsub();
    } catch {}
  }, []);

  const adminSetTrxOverride = useCallback(async (periodId: string, digit: number) => {
    if (digit < 0 || digit > 9) return { success: false, message: 'Invalid target digit (0-9).' };
    setTrxOverrides(prev => {
      const next = { ...prev, [periodId]: digit };
      try { localStorage.setItem('winxbet_trx_overrides', JSON.stringify(next)); } catch {}
      return next;
    });
    try {
      await setDoc(doc(db, 'system', 'trxOverrides'), { [periodId]: digit }, { merge: true });
    } catch {}
    return { success: true, message: `TRX Round #${periodId} block result locked to Digit ${digit}!` };
  }, []);

  const adminClearTrxOverride = useCallback(async (periodId: string) => {
    setTrxOverrides(prev => {
      const next = { ...prev };
      delete next[periodId];
      try { localStorage.setItem('winxbet_trx_overrides', JSON.stringify(next)); } catch {}
      return next;
    });
    try {
      await updateDoc(doc(db, 'system', 'trxOverrides'), { [periodId]: deleteField() });
    } catch {}
    return { success: true, message: `TRX Round #${periodId} reset to provably fair block hash.` };
  }, []);

  const trxUpcomingResult = useMemo((): TrxUpcomingResult => {
    const hasOverride = trxOverrides[trxCurrentPeriod] !== undefined;
    const periodData = getDeterministicTrxData(trxCurrentPeriod, trxOverrides[trxCurrentPeriod]);
    return {
      periodId: trxCurrentPeriod,
      blockNumber: periodData.blockNumber,
      blockHash: periodData.blockHash,
      lastDigit: periodData.lastDigit,
      colors: periodData.colors,
      size: periodData.size,
      isOverridden: hasOverride,
      timeLeft: trxTimeLeft
    };
  }, [trxCurrentPeriod, trxOverrides, trxTimeLeft]);

  const getTrxUpcomingForecast = useCallback((count: number = 6): TrxUpcomingResult[] => {
    const list: TrxUpcomingResult[] = [];
    const now = Date.now();
    for (let i = 0; i < count; i++) {
      const targetTime = now + i * 60000;
      const pId = getTrxPeriodId(targetTime);
      const hasOverride = trxOverrides[pId] !== undefined;
      const pData = getDeterministicTrxData(pId, trxOverrides[pId], targetTime);
      list.push({
        periodId: pId,
        blockNumber: pData.blockNumber,
        blockHash: pData.blockHash,
        lastDigit: pData.lastDigit,
        colors: pData.colors,
        size: pData.size,
        isOverridden: hasOverride,
        timeLeft: i === 0 ? trxTimeLeft : i * 60 + trxTimeLeft
      });
    }
    return list;
  }, [trxOverrides, trxTimeLeft]);

  const trxIsLocked = trxTimeLeft <= 5;

  const placeTrxBet = async (selection: string, amount: number) => {
    if (trxIsLocked) return { success: false, message: 'Betting is locked for current round' };
    const res = await placeBet({
      gameType: 'trx',
      periodId: trxCurrentPeriod,
      selection,
      amount,
      multiplier: 1
    });
    if (res.success && res.betId) {
      setTrxPendingBets(prev => [...prev, {
        betId: res.betId!,
        gameType: 'trx',
        periodId: trxCurrentPeriod,
        selection,
        amount,
        multiplier: 1,
        netAmount: res.netAmount,
        fee: res.fee
      }]);
      triggerHaptic('medium');
      return { success: true, message: `Bet of ₹${amount} placed on ${selection}!` };
    }
    return { success: false, message: res.message };
  };

  // ==========================================
  // 4. DRAGON TIGER CONTINUOUS TIMELINE (18s CYCLE)
  // ==========================================
  const DT_CYCLE_MS = 18000;
  const [dtTimeLeft, setDtTimeLeft] = useState<number>(() => {
    const rem = DT_CYCLE_MS - (Date.now() % DT_CYCLE_MS);
    return Math.floor(rem / 1000);
  });
  const [dtCurrentRoundId, setDtCurrentRoundId] = useState<string>(() => `DT-${Math.floor(Date.now() / DT_CYCLE_MS)}`);
  const [dtHistory, setDtHistory] = useState<DragonTigerPeriod[]>(() => generateHistoricalDragonTiger(30));
  const [dtRevealedResult, setDtRevealedResult] = useState<DragonTigerPeriod | null>(null);
  const [dtPendingBets, setDtPendingBets] = useState<PendingGameBet[]>([]);

  const dtCurrentRoundIdRef = useRef<string>(dtCurrentRoundId);
  dtCurrentRoundIdRef.current = dtCurrentRoundId;
  const dtPendingBetsRef = useRef<PendingGameBet[]>(dtPendingBets);
  dtPendingBetsRef.current = dtPendingBets;

  const [dtOverrides, setDtOverrides] = useState<Record<string, 'dragon' | 'tiger' | 'tie'>>(() => {
    try {
      const stored = localStorage.getItem('winxbet_dt_overrides');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const dtOverridesRef = useRef<Record<string, 'dragon' | 'tiger' | 'tie'>>(dtOverrides);
  dtOverridesRef.current = dtOverrides;

  useEffect(() => {
    try {
      const unsub = onSnapshot(doc(db, 'system', 'dtOverrides'), (snap) => {
        if (snap.exists()) {
          setDtOverrides(prev => ({ ...prev, ...(snap.data() as any) }));
        }
      });
      return () => unsub();
    } catch {}
  }, []);

  const adminSetDtOverride = useCallback(async (roundId: string, winner: 'dragon' | 'tiger' | 'tie') => {
    setDtOverrides(prev => {
      const next = { ...prev, [roundId]: winner };
      try { localStorage.setItem('winxbet_dt_overrides', JSON.stringify(next)); } catch {}
      return next;
    });
    try {
      await setDoc(doc(db, 'system', 'dtOverrides'), { [roundId]: winner }, { merge: true });
    } catch {}
    return { success: true, message: `Dragon Tiger Round #${roundId} locked to Winner: ${winner.toUpperCase()}!` };
  }, []);

  const adminClearDtOverride = useCallback(async (roundId: string) => {
    setDtOverrides(prev => {
      const next = { ...prev };
      delete next[roundId];
      try { localStorage.setItem('winxbet_dt_overrides', JSON.stringify(next)); } catch {}
      return next;
    });
    try {
      await updateDoc(doc(db, 'system', 'dtOverrides'), { [roundId]: deleteField() });
    } catch {}
    return { success: true, message: `Dragon Tiger Round #${roundId} reset to provably fair deck deal.` };
  }, []);

  const dtUpcomingResult = useMemo((): DragonTigerUpcomingResult => {
    const hasOverride = dtOverrides[dtCurrentRoundId] !== undefined;
    const det = getDeterministicDragonTiger(dtCurrentRoundId);
    let finalWinner = hasOverride ? dtOverrides[dtCurrentRoundId] : det.winner;
    return {
      roundId: dtCurrentRoundId,
      dragonCard: det.dragonCard,
      tigerCard: det.tigerCard,
      winner: finalWinner,
      isOverridden: hasOverride,
      timeLeft: dtTimeLeft
    };
  }, [dtCurrentRoundId, dtOverrides, dtTimeLeft]);

  const getDtUpcomingForecast = useCallback((count: number = 6): DragonTigerUpcomingResult[] => {
    const list: DragonTigerUpcomingResult[] = [];
    const now = Date.now();
    const baseIdx = Math.floor(now / DT_CYCLE_MS);
    for (let i = 0; i < count; i++) {
      const rId = `DT-${baseIdx + i}`;
      const hasOverride = dtOverrides[rId] !== undefined;
      const det = getDeterministicDragonTiger(rId);
      list.push({
        roundId: rId,
        dragonCard: det.dragonCard,
        tigerCard: det.tigerCard,
        winner: hasOverride ? dtOverrides[rId] : det.winner,
        isOverridden: hasOverride,
        timeLeft: i === 0 ? dtTimeLeft : i * 18 + dtTimeLeft
      });
    }
    return list;
  }, [dtOverrides, dtTimeLeft]);

  const placeDtBet = async (selection: 'dragon' | 'tiger' | 'tie', amount: number) => {
    if (dtTimeLeft <= 4) return { success: false, message: 'Cards are being dealt. Wait for next round.' };
    const res = await placeBet({
      gameType: 'dragontiger',
      periodId: dtCurrentRoundId,
      selection,
      amount,
      multiplier: 1
    });
    if (res.success && res.betId) {
      setDtPendingBets(prev => [...prev, {
        betId: res.betId!,
        gameType: 'dragontiger',
        periodId: dtCurrentRoundId,
        selection,
        amount,
        multiplier: 1,
        netAmount: res.netAmount,
        fee: res.fee
      }]);
      triggerHaptic('medium');
      return { success: true, message: `Bet of ₹${amount} placed on ${selection.toUpperCase()}!` };
    }
    return { success: false, message: res.message };
  };

  // ==========================================
  // 5. MASTER 1-SECOND INTERVAL FOR LOTTERIES (WinGo, K3, TRX, DragonTiger)
  // ==========================================
  const lastProcessedMinuteRef = useRef<number>(Math.floor(Date.now() / 60000));
  const lastProcessedDtRoundRef = useRef<number>(Math.floor(Date.now() / DT_CYCLE_MS));

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const currentMinute = Math.floor(now / 60000);
      const sec = Math.floor(now / 1000) % 60;
      const remaining = 60 - sec;

      setWingoTimeLeft(remaining);
      setK3TimeLeft(remaining);
      setTrxTimeLeft(remaining);

      // DragonTiger timer (18s cycle)
      const dtRem = Math.max(0, Math.floor((DT_CYCLE_MS - (now % DT_CYCLE_MS)) / 1000));
      setDtTimeLeft(dtRem);

      // Handle DragonTiger round rollover
      const currentDtRound = Math.floor(now / DT_CYCLE_MS);
      if (currentDtRound > lastProcessedDtRoundRef.current) {
        lastProcessedDtRoundRef.current = currentDtRound;
        const resolvedDtRoundId = `DT-${currentDtRound - 1}`;
        const nextDtRoundId = `DT-${currentDtRound}`;
        setDtCurrentRoundId(nextDtRoundId);

        const hasOverride = dtOverridesRef.current[resolvedDtRoundId] !== undefined;
        const det = getDeterministicDragonTiger(resolvedDtRoundId);
        const finalWinner = hasOverride ? dtOverridesRef.current[resolvedDtRoundId] : det.winner;
        const d = new Date(now);
        const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;

        const completedDtRound: DragonTigerPeriod = {
          roundId: resolvedDtRoundId,
          dragonCard: det.dragonCard,
          tigerCard: det.tigerCard,
          winner: finalWinner,
          time: timeStr,
          timestamp: now
        };

        setDtRevealedResult(completedDtRound);
        setDtHistory(prev => [completedDtRound, ...prev.slice(0, 39)]);

        // Settle pending DT bets
        const pending = dtPendingBetsRef.current.filter(b => b.periodId === resolvedDtRoundId);
        pending.forEach(b => {
          const won = b.selection === finalWinner;
          const mult = finalWinner === 'tie' ? 9.0 : 2.0;
          const netWager = b.netAmount ?? Number((b.amount * (1 - 0.03)).toFixed(4));
          const winAmount = won ? Number((netWager * mult).toFixed(2)) : 0;
          settleBet(b.betId, won, winAmount, 0);
        });
        setDtPendingBets(prev => prev.filter(b => b.periodId !== resolvedDtRoundId));
      }

      // Handle 1-minute round rollover for WinGo, K3, and TRX
      if (currentMinute > lastProcessedMinuteRef.current) {
        lastProcessedMinuteRef.current = currentMinute;

        // ---- A. WINGO ROLLOVER ----
        const resolvedWingoId = wingoCurrentPeriodRef.current || getWingoPeriodId(now - 60000);
        const nextWingoId = getNextPeriodId(resolvedWingoId);
        setWingoCurrentPeriod(nextWingoId);
        wingoCurrentPeriodRef.current = nextWingoId;

        const overrideNum = wingoOverridesRef.current[resolvedWingoId];
        const deterministic = getDeterministicRoundResult(resolvedWingoId);
        const finalNumber = overrideNum !== undefined ? overrideNum : deterministic.number;
        const finalColors = getNumberColors(finalNumber);
        const finalSize = getNumberSize(finalNumber);
        const d = new Date(now);
        const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;

        const newWingoPeriod: WingoPeriod = {
          periodId: resolvedWingoId,
          number: finalNumber,
          colors: finalColors,
          size: finalSize,
          hash: deterministic.hash,
          time: timeStr,
          timestamp: now
        };

        setDoc(doc(db, 'wingoRounds', resolvedWingoId), {
          ...newWingoPeriod,
          status: 'completed',
          updatedAt: now
        }, { merge: true }).catch(() => {});

        setWingoRevealedResult(newWingoPeriod);
        setWingoIsRevealing(true);
        setTimeout(() => setWingoIsRevealing(false), 3000);

        const currentWingoPending = wingoPendingBetsRef.current;
        const matchingWingo = currentWingoPending.filter(b => b.periodId === resolvedWingoId);
        matchingWingo.forEach(bet => {
          const netWager = bet.netAmount ?? Number((bet.amount * bet.multiplier * (1 - 0.03)).toFixed(4));
          const result = calculateBetResult(bet.selection, netWager, finalNumber);
          settleBet(bet.betId, result.won, result.winAmount, finalNumber);
        });
        setWingoPendingBets(prev => prev.filter(b => b.periodId !== resolvedWingoId));
        setWingoHistory(prev => [newWingoPeriod, ...prev.filter(p => p.periodId !== resolvedWingoId).slice(0, 59)]);

        // ---- B. K3 ROLLOVER ----
        const resolvedK3Id = k3CurrentPeriodRef.current || getK3PeriodId(now - 60000);
        const nextK3Id = getK3PeriodId(now);
        setK3CurrentPeriod(nextK3Id);
        k3CurrentPeriodRef.current = nextK3Id;

        const overrideK3Dice = k3OverridesRef.current[resolvedK3Id];
        const newK3Period = getK3PeriodData(resolvedK3Id, overrideK3Dice, now);

        setDoc(doc(db, 'k3Rounds', resolvedK3Id), {
          ...newK3Period,
          status: 'completed',
          updatedAt: now
        }, { merge: true }).catch(() => {});

        setK3RevealedResult(newK3Period);
        setK3IsRevealing(true);
        setTimeout(() => setK3IsRevealing(false), 3000);

        const currentK3Pending = k3PendingBetsRef.current;
        const matchingK3 = currentK3Pending.filter(b => b.periodId === resolvedK3Id);
        matchingK3.forEach(bet => {
          const netWager = bet.netAmount ?? Number((bet.amount * (1 - 0.03)).toFixed(4));
          const res = calculateK3BetResult(bet.selection, newK3Period);
          const winAmount = res.won ? Number((netWager * res.multiplier).toFixed(2)) : 0;
          settleBet(bet.betId, res.won, winAmount, newK3Period.total);
        });
        setK3PendingBets(prev => prev.filter(b => b.periodId !== resolvedK3Id));
        setK3History(prev => [newK3Period, ...prev.filter(p => p.periodId !== resolvedK3Id).slice(0, 39)]);

        // ---- C. TRX ROLLOVER ----
        const resolvedTrxId = trxCurrentPeriodRef.current || getTrxPeriodId(now - 60000);
        const nextTrxId = getTrxPeriodId(now);
        setTrxCurrentPeriod(nextTrxId);
        trxCurrentPeriodRef.current = nextTrxId;

        const overrideTrxDigit = trxOverridesRef.current[resolvedTrxId];
        const newTrxPeriod = getDeterministicTrxData(resolvedTrxId, overrideTrxDigit, now);

        setDoc(doc(db, 'trxRounds', resolvedTrxId), {
          ...newTrxPeriod,
          status: 'completed',
          updatedAt: now
        }, { merge: true }).catch(() => {});

        setTrxRevealedResult(newTrxPeriod);
        setTrxIsRevealing(true);
        setTimeout(() => setTrxIsRevealing(false), 3000);

        const currentTrxPending = trxPendingBetsRef.current;
        const matchingTrx = currentTrxPending.filter(b => b.periodId === resolvedTrxId);
        matchingTrx.forEach(bet => {
          const netWager = bet.netAmount ?? Number((bet.amount * (1 - 0.03)).toFixed(4));
          const res = calculateTrxBetResult(bet.selection, newTrxPeriod);
          const winAmount = res.won ? Number((netWager * res.multiplier).toFixed(2)) : 0;
          settleBet(bet.betId, res.won, winAmount, newTrxPeriod.lastDigit);
        });
        setTrxPendingBets(prev => prev.filter(b => b.periodId !== resolvedTrxId));
        setTrxHistory(prev => [newTrxPeriod, ...prev.filter(p => p.periodId !== resolvedTrxId).slice(0, 39)]);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [settleBet]);

  // ==========================================
  // 6. AVIATOR CLOUD & AUTHENTIC SPRIBE ENGINE (Slower, Thrilling, Realistic)
  // ==========================================
  // Cycle length: 38s (6s betting countdown + smooth flight + 4s crash celebration)
  const AVIATOR_CYCLE_MS = 38000;
  const COUNTDOWN_DURATION_MS = 6000;

  const [aviatorPhase, setAviatorPhase] = useState<'countdown' | 'flying' | 'crashed'>('countdown');
  const [aviatorCountdownLeft, setAviatorCountdownLeft] = useState<number>(6.0);
  const [aviatorCurrentRoundId, setAviatorCurrentRoundId] = useState<string>(() => `AV-${Math.floor(Date.now() / AVIATOR_CYCLE_MS)}`);
  const [aviatorMultiplier, setAviatorMultiplier] = useState<number>(1.00);
  const [aviatorCrashPoint, setAviatorCrashPoint] = useState<number>(() => {
    const currentRoundIdx = Math.floor(Date.now() / AVIATOR_CYCLE_MS);
    return getDeterministicAviatorCrash(currentRoundIdx);
  });

  const [aviatorHistory, setAviatorHistory] = useState<AviatorRoundRecord[]>(() => generateHistoricalAviatorRounds(60));
  const [aviatorRecentMultipliers, setAviatorRecentMultipliers] = useState<number[]>([
    1.85, 2.40, 1.12, 5.40, 1.45, 12.80, 1.05, 3.20, 2.10, 8.75
  ]);
  const [aviatorCoPilots, setAviatorCoPilots] = useState<SimulatedCoPilot[]>([]);
  const [aviatorUserBet, setAviatorUserBet] = useState<AviatorUserBetState | null>(null);
  const [aviatorQueuedNextBet, setAviatorQueuedNextBet] = useState<{
    amount: number;
    autoCashout: boolean;
    autoCashoutMultiplier: number;
  } | null>(null);

  const aviatorUserBetRef = useRef<AviatorUserBetState | null>(null);
  aviatorUserBetRef.current = aviatorUserBet;
  const aviatorQueuedNextBetRef = useRef<any>(null);
  aviatorQueuedNextBetRef.current = aviatorQueuedNextBet;

  // Aviator Admin Overrides
  const [aviatorOverrides, setAviatorOverrides] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem('winxbet_aviator_overrides');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const aviatorOverridesRef = useRef<Record<string, number>>(aviatorOverrides);
  aviatorOverridesRef.current = aviatorOverrides;

  useEffect(() => {
    try {
      const unsub = onSnapshot(doc(db, 'system', 'aviatorOverrides'), (snap) => {
        if (snap.exists()) {
          setAviatorOverrides(prev => ({ ...prev, ...(snap.data() as any) }));
        }
      });
      return () => unsub();
    } catch {}
  }, []);

  const adminSetAviatorOverride = useCallback(async (roundId: string, crashPoint: number) => {
    if (crashPoint < 1.00) return { success: false, message: 'Crash multiplier must be at least 1.00x' };
    const cleanCrash = Number(crashPoint.toFixed(2));
    setAviatorOverrides(prev => {
      const next = { ...prev, [roundId]: cleanCrash };
      try { localStorage.setItem('winxbet_aviator_overrides', JSON.stringify(next)); } catch {}
      return next;
    });
    try {
      await setDoc(doc(db, 'system', 'aviatorOverrides'), { [roundId]: cleanCrash }, { merge: true });
    } catch {}
    return { success: true, message: `Aviator Flight #${roundId} crash point locked to ${cleanCrash}x!` };
  }, []);

  const adminClearAviatorOverride = useCallback(async (roundId: string) => {
    setAviatorOverrides(prev => {
      const next = { ...prev };
      delete next[roundId];
      try { localStorage.setItem('winxbet_aviator_overrides', JSON.stringify(next)); } catch {}
      return next;
    });
    try {
      await updateDoc(doc(db, 'system', 'aviatorOverrides'), { [roundId]: deleteField() });
    } catch {}
    return { success: true, message: `Aviator Flight #${roundId} reset to provably fair deterministic trajectory.` };
  }, []);

  const aviatorUpcomingResult = useMemo((): AviatorUpcomingResult => {
    const hasOverride = aviatorOverrides[aviatorCurrentRoundId] !== undefined;
    const currentRoundIdx = Math.floor(Date.now() / AVIATOR_CYCLE_MS);
    const detCrash = getDeterministicAviatorCrash(currentRoundIdx);
    const crash = hasOverride ? aviatorOverrides[aviatorCurrentRoundId] : detCrash;
    return {
      roundId: aviatorCurrentRoundId,
      crashMultiplier: crash,
      flightDurationSec: getAviatorFlightDurationSec(crash),
      isOverridden: hasOverride,
      phase: aviatorPhase,
      countdownLeft: aviatorCountdownLeft
    };
  }, [aviatorCurrentRoundId, aviatorOverrides, aviatorPhase, aviatorCountdownLeft]);

  const getAviatorUpcomingForecast = useCallback((count: number = 6): AviatorUpcomingResult[] => {
    const list: AviatorUpcomingResult[] = [];
    const now = Date.now();
    const currentBaseIdx = Math.floor(now / AVIATOR_CYCLE_MS);
    for (let i = 0; i < count; i++) {
      const idx = currentBaseIdx + i;
      const rId = `AV-${idx}`;
      const hasOverride = aviatorOverrides[rId] !== undefined;
      const det = getDeterministicAviatorCrash(idx);
      const crash = hasOverride ? aviatorOverrides[rId] : det;
      list.push({
        roundId: rId,
        crashMultiplier: crash,
        flightDurationSec: getAviatorFlightDurationSec(crash),
        isOverridden: hasOverride,
        phase: i === 0 ? aviatorPhase : 'countdown',
        countdownLeft: i === 0 ? aviatorCountdownLeft : (i * (AVIATOR_CYCLE_MS / 1000))
      });
    }
    return list;
  }, [aviatorOverrides, aviatorPhase, aviatorCountdownLeft]);

  // Universal Epoch Flight Synchronizer for Aviator
  const lastRecordedCrashRoundRef = useRef<string>('');

  useEffect(() => {
    const syncInterval = setInterval(() => {
      const now = Date.now();
      const roundIndex = Math.floor(now / AVIATOR_CYCLE_MS);
      const roundId = `AV-${roundIndex}`;
      const offsetMs = now % AVIATOR_CYCLE_MS;

      const overrideCrash = aviatorOverridesRef.current[roundId];
      const deterministicCrash = getDeterministicAviatorCrash(roundIndex);
      const crashPoint = overrideCrash !== undefined ? overrideCrash : deterministicCrash;
      const flightDurationSec = getAviatorFlightDurationSec(crashPoint);
      const flightDurationMs = Math.max(1000, flightDurationSec * 1000);

      setAviatorCurrentRoundId(roundId);
      setAviatorCrashPoint(crashPoint);

      // Phase 1: Countdown (0ms -> COUNTDOWN_DURATION_MS)
      if (offsetMs < COUNTDOWN_DURATION_MS) {
        setAviatorPhase('countdown');
        const remaining = Math.max(0, (COUNTDOWN_DURATION_MS - offsetMs) / 1000);
        setAviatorCountdownLeft(Number(remaining.toFixed(1)));
        setAviatorMultiplier(1.00);

        // Seed co-pilots for this round
        if (aviatorCoPilots.length === 0) {
          const shuffled = [...CO_PILOT_POOL].sort(() => 0.5 - Math.random()).slice(0, 5);
          setAviatorCoPilots(
            shuffled.map(bot => ({
              user: bot.user,
              amount: bot.amount,
              target: bot.target,
              cashoutMultiplier: null,
              hasCashedOut: false,
              color: bot.color
            }))
          );
        }

        // Activate queued next bet if any
        if (aviatorQueuedNextBetRef.current && user) {
          const qBet = aviatorQueuedNextBetRef.current;
          setAviatorQueuedNextBet(null);
          placeBet({
            gameType: 'aviator',
            periodId: roundId,
            selection: 'Crash Multiplier',
            amount: qBet.amount,
            multiplier: 1
          }).then(res => {
            if (res.success && res.betId) {
              const effectiveNetAmount = res.netAmount ?? Number((qBet.amount * (1 - 0.03)).toFixed(4));
              setAviatorUserBet({
                betId: res.betId,
                roundId,
                amount: effectiveNetAmount,
                grossAmount: qBet.amount,
                netAmount: effectiveNetAmount,
                autoCashout: qBet.autoCashout,
                autoCashoutMultiplier: qBet.autoCashoutMultiplier,
                cashedOut: false
              });
            }
          });
        }
      } 
      // Phase 2: Flying (COUNTDOWN_DURATION_MS -> COUNTDOWN_DURATION_MS + flightDurationMs)
      else if (offsetMs < COUNTDOWN_DURATION_MS + flightDurationMs) {
        setAviatorPhase('flying');
        const flightElapsedSec = (offsetMs - COUNTDOWN_DURATION_MS) / 1000;
        // Realistic Spribe exponential climb
        const currentMult = getAviatorMultiplierAtSec(flightElapsedSec);
        const safeMult = Math.min(crashPoint, Math.max(1.00, currentMult));
        setAviatorMultiplier(safeMult);

        // Update co-pilot simulated cashouts
        setAviatorCoPilots(prev =>
          prev.map(copilot => {
            if (!copilot.hasCashedOut && safeMult >= copilot.target) {
              return { ...copilot, hasCashedOut: true, cashoutMultiplier: copilot.target };
            }
            return copilot;
          })
        );

        // Auto-cashout check for user
        const currentBet = aviatorUserBetRef.current;
        if (currentBet && !currentBet.cashedOut && currentBet.autoCashout) {
          if (safeMult >= currentBet.autoCashoutMultiplier) {
            const bettedAmount = currentBet.netAmount ?? currentBet.amount;
            const win = Number((bettedAmount * currentBet.autoCashoutMultiplier).toFixed(2));
            settleBet(currentBet.betId, true, win, 0);
            setAviatorUserBet({
              ...currentBet,
              cashedOut: true,
              cashedMultiplier: currentBet.autoCashoutMultiplier,
              winAmount: win
            });
            triggerHaptic('success');
          }
        }
      } 
      // Phase 3: Crashed (until end of cycle)
      else {
        setAviatorPhase('crashed');
        setAviatorMultiplier(crashPoint);

        // Settle uncashed user bet as lost
        const activeBet = aviatorUserBetRef.current;
        if (activeBet && !activeBet.cashedOut) {
          settleBet(activeBet.betId, false, 0, 0);
          setAviatorUserBet({
            ...activeBet,
            cashedOut: true,
            cashedMultiplier: 0,
            winAmount: 0
          });
        }

        // Publish crash record to Firestore once per round
        if (lastRecordedCrashRoundRef.current !== roundId) {
          lastRecordedCrashRoundRef.current = roundId;
          const d = new Date(now);
          const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
          
          const crashRecord: AviatorRoundRecord = {
            roundId,
            crashMultiplier: crashPoint,
            flightDurationSec,
            hash: Math.abs(roundIndex * 2654435761).toString(16).toUpperCase().padStart(8, '0'),
            time: timeStr,
            timestamp: now,
            tier: getMultiplierTier(crashPoint)
          };

          setAviatorRecentMultipliers(prev => [crashPoint, ...prev.slice(0, 11)]);
          setAviatorHistory(prev => filterLastOneHour([crashRecord, ...prev.filter(r => r.roundId !== roundId)]));

          setDoc(doc(db, 'aviatorRounds', roundId), {
            ...crashRecord,
            status: 'crashed',
            updatedAt: now
          }, { merge: true }).catch(() => {});
        }
      }
    }, 60);

    return () => clearInterval(syncInterval);
  }, [user, placeBet, settleBet]);

  // Place Aviator Bet
  const placeAviatorBet = async (
    amount: number,
    autoCashout: boolean = false,
    autoCashoutMultiplier: number = 2.00
  ): Promise<{ success: boolean; message: string }> => {
    if (!user || !profile) {
      return { success: false, message: 'Please login to place bets' };
    }
    if (profile.balance < amount) {
      return { success: false, message: 'Insufficient wallet balance' };
    }

    if (aviatorPhase === 'countdown') {
      const res = await placeBet({
        gameType: 'aviator',
        periodId: aviatorCurrentRoundId,
        selection: 'Crash Multiplier',
        amount,
        multiplier: 1
      });

      if (res.success && res.betId) {
        const effectiveNetAmount = res.netAmount ?? Number((amount * (1 - 0.03)).toFixed(4));
        setAviatorUserBet({
          betId: res.betId,
          roundId: aviatorCurrentRoundId,
          amount: effectiveNetAmount,
          grossAmount: amount,
          netAmount: effectiveNetAmount,
          autoCashout,
          autoCashoutMultiplier,
          cashedOut: false
        });
        triggerHaptic('medium');
        return { success: true, message: `Flight bet of ₹${amount} placed for round ${aviatorCurrentRoundId}!` };
      }
      return { success: false, message: res.message };
    } else {
      setAviatorQueuedNextBet({
        amount,
        autoCashout,
        autoCashoutMultiplier
      });
      triggerHaptic('light');
      return {
        success: true,
        message: `Flight in progress. Bet of ₹${amount} registered for the NEXT immediate takeoff!`
      };
    }
  };

  // Cashout Aviator Bet
  const cashoutAviatorBet = async (): Promise<{ success: boolean; winAmount: number; multiplier: number } | null> => {
    if (aviatorPhase !== 'flying' || !aviatorUserBet || aviatorUserBet.cashedOut) {
      return null;
    }

    const currentMultiplier = aviatorMultiplier;
    const bettedAmount = aviatorUserBet.netAmount ?? aviatorUserBet.amount;
    const calculatedWin = Number((bettedAmount * currentMultiplier).toFixed(2));

    await settleBet(aviatorUserBet.betId, true, calculatedWin, 0);

    setAviatorUserBet({
      ...aviatorUserBet,
      cashedOut: true,
      cashedMultiplier: currentMultiplier,
      winAmount: calculatedWin
    });

    triggerHaptic('success');
    return {
      success: true,
      winAmount: calculatedWin,
      multiplier: currentMultiplier
    };
  };

  const cancelQueuedAviatorBet = () => {
    setAviatorQueuedNextBet(null);
    triggerHaptic('light');
  };

  // Live round pool
  const liveRoundPool = useMemo<LiveRoundBetPool | null>(() => {
    const activePeriod = wingoCurrentPeriod;
    const roundBets = liveGlobalBets.filter(b => b.periodId === activePeriod);
    const totalVolume = roundBets.reduce((acc, b) => acc + (b.amount || 0), 0);
    const volumeBySelection: Record<string, number> = {};
    const countBySelection: Record<string, number> = {};

    roundBets.forEach(b => {
      volumeBySelection[b.selection] = (volumeBySelection[b.selection] || 0) + (b.amount || 0);
      countBySelection[b.selection] = (countBySelection[b.selection] || 0) + 1;
    });

    return {
      periodId: activePeriod,
      gameType: 'wingo',
      totalBetted: totalVolume,
      betsCount: roundBets.length,
      selectionTotals: volumeBySelection,
      selectionCounts: countBySelection,
      bets: roundBets
    };
  }, [wingoCurrentPeriod, liveGlobalBets]);

  // Maintenance & Retention daemon
  useEffect(() => {
    const uptimeTimer = setInterval(() => {
      setEngineUptime(s => s + 1);
    }, 1000);
    return () => clearInterval(uptimeTimer);
  }, []);

  return (
    <ContinuousGameContext.Provider
      value={{
        wingoTimeLeft,
        wingoCurrentPeriod,
        wingoIsLocked,
        wingoHistory,
        wingoRevealedResult,
        wingoIsRevealing,
        wingoPendingBets,
        registerWingoBet,
        wingoUpcomingResult,
        wingoOverrides,
        adminSetWingoOverride,
        adminClearWingoOverride,
        getWingoUpcomingForecast,

        aviatorPhase,
        aviatorCountdownLeft,
        aviatorCurrentRoundId,
        aviatorMultiplier,
        aviatorCrashPoint,
        aviatorHistory,
        aviatorRecentMultipliers,
        aviatorCoPilots,
        aviatorUserBet,
        aviatorQueuedNextBet,
        placeAviatorBet,
        cashoutAviatorBet,
        cancelQueuedAviatorBet,
        aviatorOverrides,
        adminSetAviatorOverride,
        adminClearAviatorOverride,
        getAviatorUpcomingForecast,
        aviatorUpcomingResult,

        k3TimeLeft,
        k3CurrentPeriod,
        k3IsLocked,
        k3History,
        k3RevealedResult,
        k3IsRevealing,
        k3UpcomingResult,
        k3Overrides,
        adminSetK3Override,
        adminClearK3Override,
        getK3UpcomingForecast,
        placeK3Bet,

        trxTimeLeft,
        trxCurrentPeriod,
        trxIsLocked,
        trxHistory,
        trxRevealedResult,
        trxIsRevealing,
        trxUpcomingResult,
        trxOverrides,
        adminSetTrxOverride,
        adminClearTrxOverride,
        getTrxUpcomingForecast,
        placeTrxBet,

        dtTimeLeft,
        dtCurrentRoundId,
        dtHistory,
        dtRevealedResult,
        dtUpcomingResult,
        dtOverrides,
        adminSetDtOverride,
        adminClearDtOverride,
        getDtUpcomingForecast,
        placeDtBet,

        liveRoundPool,
        liveGlobalBets,

        retentionWindowMinutes: 60,
        lastPurgeTime,
        totalPurgedWingoCount: totalPurgedWingo,
        totalPurgedAviatorCount: totalPurgedAviator,
        continuousEngineUptimeSec: engineUptime
      }}
    >
      {children}
    </ContinuousGameContext.Provider>
  );
};

export const useContinuousGame = () => {
  const context = useContext(ContinuousGameContext);
  if (!context) {
    throw new Error('useContinuousGame must be used within ContinuousGameProvider');
  }
  return context;
};
