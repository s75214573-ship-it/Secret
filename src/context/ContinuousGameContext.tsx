import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../firebase';
import { WingoPeriod, AviatorRoundRecord, GlobalBet, LiveRoundBetPool } from '../types';
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
  filterLastOneHour 
} from '../aviatorLogic';
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

  // Aviator Continuous State
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

  // Helper to derive universal period ID from standard clock:
  // [current year (4 digits)][current month (2 digits)][current date (2 digits)][4 digits for minutes of the day starting from 12:00 AM]
  const getPeriodFromTime = (timestampMs: number) => {
    return getWingoPeriodId(timestampMs);
  };

  // ==========================================
  // 1. WINGO CLOUD & CLOCK SYNCHRONIZED ENGINE
  // ==========================================
  const [wingoTimeLeft, setWingoTimeLeft] = useState<number>(() => {
    const sec = Math.floor(Date.now() / 1000) % 60;
    return 60 - sec;
  });

  const [wingoCurrentPeriod, setWingoCurrentPeriod] = useState<string>(() => getWingoPeriodId(Date.now()));
  const wingoCurrentPeriodRef = useRef<string>(wingoCurrentPeriod);
  wingoCurrentPeriodRef.current = wingoCurrentPeriod;
  
  // Pre-seed deterministic historical periods strictly starting from 1 before the active round
  const [wingoHistory, setWingoHistory] = useState<WingoPeriod[]>(() => {
    const active = getWingoPeriodId(Date.now());
    return generateHistoricalPeriods(60, active);
  });
  
  const [wingoRevealedResult, setWingoRevealedResult] = useState<WingoPeriod | null>(null);
  const [wingoIsRevealing, setWingoIsRevealing] = useState<boolean>(false);
  const [wingoPendingBets, setWingoPendingBets] = useState<PendingWingoBet[]>([]);
  const wingoPendingBetsRef = useRef<PendingWingoBet[]>([]);
  wingoPendingBetsRef.current = wingoPendingBets;

  const wingoIsLocked = wingoTimeLeft <= 5;

  const registerWingoBet = useCallback((bet: PendingWingoBet) => {
    setWingoPendingBets(prev => [...prev, bet]);
  }, []);

  // Connect to Firestore collection 'wingoRounds' to guarantee ALL users see the EXACT same results
  useEffect(() => {
    const qWingo = query(
      collection(db, 'wingoRounds'),
      orderBy('timestamp', 'desc'),
      limit(60)
    );

    const unsubscribeWingo = onSnapshot(qWingo, (snap) => {
      if (!snap.empty) {
        const cloudMap = new Map<string, WingoPeriod>();
        snap.forEach((docSnap) => {
          const d = docSnap.data();
          let pid = String(d.periodId || docSnap.id);
          // Standardize periodId to 12 digits matching authoritative timeline
          if (d.timestamp) {
            const expectedId = getWingoPeriodId(Number(d.timestamp));
            if (pid !== expectedId && /^\d{12}$/.test(expectedId)) {
              pid = expectedId;
            }
          }
          if (/^\d{12}$/.test(pid)) {
            cloudMap.set(pid, {
              periodId: pid,
              number: Number(d.number) || 0,
              colors: d.colors || getNumberColors(Number(d.number) || 0),
              size: d.size || getNumberSize(Number(d.number) || 0),
              hash: d.hash || 'PROVABLY_FAIR',
              time: d.time || new Date(d.timestamp || Date.now()).toLocaleTimeString(),
              timestamp: Number(d.timestamp) || Date.now()
            });
          }
        });

        // Reconcile into an unbroken, strictly consecutive history
        setWingoHistory(prev => {
          const active = wingoCurrentPeriodRef.current || getWingoPeriodId(Date.now());
          const latestCompletedId = getPreviousPeriodId(active);
          const resultChain: WingoPeriod[] = [];
          let curId = latestCompletedId;

          for (let i = 0; i < 60; i++) {
            const fromCloud = cloudMap.get(curId);
            const fromPrev = prev.find(p => p.periodId === curId);

            if (fromCloud) {
              resultChain.push(fromCloud);
            } else if (fromPrev) {
              resultChain.push(fromPrev);
            } else {
              const det = getDeterministicRoundResult(curId);
              const seq = parseInt(curId.slice(8), 10);
              const minuteOfDay = Math.max(0, seq - 1);
              const hour = Math.floor(minuteOfDay / 60);
              const minute = minuteOfDay % 60;
              resultChain.push({
                periodId: curId,
                number: det.number,
                colors: det.colors,
                size: det.size,
                hash: det.hash,
                time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`,
                timestamp: Date.now() - (i + 1) * 60000
              });
            }
            curId = getPreviousPeriodId(curId);
          }

          return resultChain;
        });
      }
    }, (err) => {
      console.warn('Wingo rounds cloud listener notice:', err);
    });

    return () => unsubscribeWingo();
  }, []);

  // Continuous Clock Synchronizer for WinGo
  const lastProcessedMinuteRef = useRef<number>(Math.floor(Date.now() / 60000));

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const currentMinute = Math.floor(now / 60000);
      const sec = Math.floor(now / 1000) % 60;
      const remaining = 60 - sec;

      setWingoTimeLeft(remaining);

      // Detect round rollover
      if (currentMinute > lastProcessedMinuteRef.current) {
        lastProcessedMinuteRef.current = currentMinute;

        // Current active period that just concluded
        const resolvedPeriodId = wingoCurrentPeriodRef.current || getWingoPeriodId(now - 60000);
        // Next active round is strictly 1 more than resolvedPeriodId
        const nextPeriodId = getNextPeriodId(resolvedPeriodId);
        
        setWingoCurrentPeriod(nextPeriodId);
        wingoCurrentPeriodRef.current = nextPeriodId;

        // Compute provably fair deterministic result for this period
        const deterministic = getDeterministicRoundResult(resolvedPeriodId);
        const d = new Date(now);
        const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;

        const newPeriod: WingoPeriod = {
          periodId: resolvedPeriodId,
          number: deterministic.number,
          colors: deterministic.colors,
          size: deterministic.size,
          hash: deterministic.hash,
          time: timeStr,
          timestamp: now
        };

        // Write to shared Firestore collection so all users across the world receive it identically
        const roundRef = doc(db, 'wingoRounds', resolvedPeriodId);
        setDoc(roundRef, {
          ...newPeriod,
          status: 'completed',
          updatedAt: now
        }, { merge: true }).catch((err) => {
          console.warn('Silent wingo round cloud sync notice:', err);
        });

        // Trigger reveal animation and display
        setWingoRevealedResult(newPeriod);
        setWingoIsRevealing(true);
        setTimeout(() => setWingoIsRevealing(false), 3000);

        // Settle matching pending bets for this period
        const currentPending = wingoPendingBetsRef.current;
        const matching = currentPending.filter(b => b.periodId === resolvedPeriodId);
        matching.forEach(bet => {
          const netWager = bet.netAmount ?? Number((bet.amount * bet.multiplier * (1 - 0.03)).toFixed(4));
          const result = calculateBetResult(bet.selection, netWager, deterministic.number);
          settleBet(bet.betId, result.won, result.winAmount, deterministic.number);
        });

        setWingoPendingBets(prev => prev.filter(b => b.periodId !== resolvedPeriodId));

        // Prepend new resolved period to history, guaranteeing strictly consecutive sequence:
        // History[0] is resolvedPeriodId (which is nextPeriodId - 1)
        // History[1] is resolvedPeriodId - 1, etc.
        setWingoHistory(prev => {
          const updated = [newPeriod, ...prev.filter(p => p.periodId !== resolvedPeriodId)];
          const continuousHistory: WingoPeriod[] = [newPeriod];
          let prevId = newPeriod.periodId;

          for (let i = 1; i < 60; i++) {
            const expectedId = getPreviousPeriodId(prevId);
            const found = updated.find(p => p.periodId === expectedId);
            if (found) {
              continuousHistory.push(found);
            } else {
              const det = getDeterministicRoundResult(expectedId);
              const seq = parseInt(expectedId.slice(8), 10);
              const minuteOfDay = Math.max(0, seq - 1);
              const hour = Math.floor(minuteOfDay / 60);
              const minute = minuteOfDay % 60;
              continuousHistory.push({
                periodId: expectedId,
                number: det.number,
                colors: det.colors,
                size: det.size,
                hash: det.hash,
                time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`,
                timestamp: now - i * 60000
              });
            }
            prevId = expectedId;
          }
          return continuousHistory;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [settleBet]);

  // ==========================================
  // 2. AVIATOR CLOUD & EPOCH SYNCHRONIZED ENGINE
  // ==========================================
  // Universal 20-second flight round cycle
  // Every client on Earth calculates the exact same roundId, flight time, multiplier, and crash point
  const AVIATOR_CYCLE_MS = 20000;
  const COUNTDOWN_DURATION_MS = 4000;

  const [aviatorPhase, setAviatorPhase] = useState<'countdown' | 'flying' | 'crashed'>('countdown');
  const [aviatorCountdownLeft, setAviatorCountdownLeft] = useState<number>(4.0);
  const [aviatorCurrentRoundId, setAviatorCurrentRoundId] = useState<string>(() => `AV-${Math.floor(Date.now() / AVIATOR_CYCLE_MS)}`);
  const [aviatorMultiplier, setAviatorMultiplier] = useState<number>(1.00);
  const [aviatorCrashPoint, setAviatorCrashPoint] = useState<number>(() => {
    const currentRoundIdx = Math.floor(Date.now() / AVIATOR_CYCLE_MS);
    return getDeterministicAviatorCrash(currentRoundIdx);
  });

  const [aviatorHistory, setAviatorHistory] = useState<AviatorRoundRecord[]>(() => {
    return generateHistoricalAviatorRounds(90);
  });
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

  // Cloud listener for Aviator historical rounds from Firestore
  useEffect(() => {
    const qAviator = query(
      collection(db, 'aviatorRounds'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribeAviator = onSnapshot(qAviator, (snap) => {
      if (!snap.empty) {
        const cloudRecords: AviatorRoundRecord[] = [];
        const mults: number[] = [];
        snap.forEach((docSnap) => {
          const d = docSnap.data();
          const crashM = Number(d.crashPoint || d.crashMultiplier) || 1.5;
          mults.push(crashM);
          cloudRecords.push({
            roundId: String(d.roundId || docSnap.id),
            crashMultiplier: crashM,
            flightDurationSec: Number(d.flightDurationSec) || 4.0,
            hash: d.hash || 'AV_HASH',
            time: d.time || new Date(d.timestamp || Date.now()).toLocaleTimeString(),
            timestamp: Number(d.timestamp) || Date.now(),
            tier: getMultiplierTier(crashM)
          });
        });

        if (mults.length > 0) {
          setAviatorRecentMultipliers(mults.slice(0, 12));
        }

        setAviatorHistory(prev => {
          const cloudIds = new Set(cloudRecords.map(r => r.roundId));
          const localRemaining = prev.filter(r => !cloudIds.has(r.roundId));
          const merged = [...cloudRecords, ...localRemaining];
          merged.sort((a, b) => b.timestamp - a.timestamp);
          return filterLastOneHour(merged).slice(0, 80);
        });
      }
    }, (err) => {
      console.warn('Aviator cloud rounds listener notice:', err);
    });

    return () => unsubscribeAviator();
  }, []);

  // Universal Epoch Flight Synchronizer for Aviator
  const lastRecordedCrashRoundRef = useRef<string>('');

  useEffect(() => {
    const syncInterval = setInterval(() => {
      const now = Date.now();
      const roundIndex = Math.floor(now / AVIATOR_CYCLE_MS);
      const roundId = `AV-${roundIndex}`;
      const offsetMs = now % AVIATOR_CYCLE_MS;
      const crashPoint = getDeterministicAviatorCrash(roundIndex);
      const flightDurationSec = Number((Math.pow(crashPoint - 1.0, 1 / 1.65) / 0.75).toFixed(1));
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
        const currentMult = Number((1.00 + Math.pow(flightElapsedSec * 0.75, 1.65)).toFixed(2));
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

          // Write to shared Firestore collection
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
      // Queue bet for the next takeoff
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

    const currentM = aviatorMultiplier;
    const bettedAmount = aviatorUserBet.netAmount ?? aviatorUserBet.amount;
    const win = Number((bettedAmount * currentM).toFixed(2));

    await settleBet(aviatorUserBet.betId, true, win, 0);

    setAviatorUserBet({
      ...aviatorUserBet,
      cashedOut: true,
      cashedMultiplier: currentM,
      winAmount: win
    });

    triggerHaptic('success');
    return { success: true, winAmount: win, multiplier: currentM };
  };

  const cancelQueuedAviatorBet = () => {
    setAviatorQueuedNextBet(null);
    triggerHaptic('light');
  };

  // ==========================================
  // 3. ADMIN LIVE BETS & VOLUME MONITORING
  // ==========================================
  useEffect(() => {
    // Listen to real-time global bets across all users
    const qGlobalBets = query(
      collection(db, 'globalBets'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribeGlobal = onSnapshot(qGlobalBets, (snap) => {
      const betsList: GlobalBet[] = [];
      snap.forEach((d) => {
        betsList.push({ id: d.id, ...d.data() } as GlobalBet);
      });
      setLiveGlobalBets(betsList);
    }, (err) => {
      console.warn('Live global bets listener notice:', err);
    });

    return () => unsubscribeGlobal();
  }, []);

  // Compute live round bet pool breakdown for the active WinGo period
  const liveRoundPool: LiveRoundBetPool | null = React.useMemo(() => {
    const roundBets = liveGlobalBets.filter(b => b.periodId === wingoCurrentPeriod);
    const selectionTotals: Record<string, number> = {};
    const selectionCounts: Record<string, number> = {};
    let totalBetted = 0;

    roundBets.forEach(b => {
      const amt = Number(b.amount) || 0;
      totalBetted += amt;
      selectionTotals[b.selection] = (selectionTotals[b.selection] || 0) + amt;
      selectionCounts[b.selection] = (selectionCounts[b.selection] || 0) + 1;
    });

    return {
      periodId: wingoCurrentPeriod,
      gameType: 'wingo',
      totalBetted,
      betsCount: roundBets.length,
      selectionTotals,
      selectionCounts,
      bets: roundBets
    };
  }, [liveGlobalBets, wingoCurrentPeriod]);

  // ==========================================
  // 4. BACKGROUND 1-HOUR DATA PURGE DAEMON (Runs every 10s)
  // ==========================================
  useEffect(() => {
    const purgeDaemon = setInterval(() => {
      setEngineUptime(u => u + 10);
      setLastPurgeTime(new Date().toLocaleTimeString());

      setWingoHistory(prev => {
        const retained = filterLastOneHour(prev);
        const purged = prev.length - retained.length;
        if (purged > 0) setTotalPurgedWingo(c => c + purged);
        return retained;
      });

      setAviatorHistory(prev => {
        const retained = filterLastOneHour(prev);
        const purged = prev.length - retained.length;
        if (purged > 0) setTotalPurgedAviator(c => c + purged);
        return retained;
      });
    }, 10000);

    return () => clearInterval(purgeDaemon);
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
