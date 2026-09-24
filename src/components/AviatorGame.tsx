import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useContinuousGame } from '../context/ContinuousGameContext';
import { SecurityEngineBanner } from './SecurityEngineBanner';
import { AviatorHistoryPages } from './AviatorHistoryPages';
import { 
  Plane, 
  PlaneTakeoff, 
  AlertTriangle, 
  Volume2, 
  VolumeX, 
  Sliders, 
  Clock, 
  CheckCircle2,
  Users,
  Flame,
  ShieldCheck,
  Zap,
  Timer
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { 
  isSoundEnabled, 
  setSoundEnabled, 
  playChipSound, 
  playClickSound, 
  playTickSound, 
  playTakeoffSound, 
  playCrashSound, 
  playCashoutSound, 
  playBetPlacedSound 
} from '../utils/audio';

interface AviatorGameProps {
  onOpenWallet: () => void;
  onOpenAuth: () => void;
}

export const AviatorGame: React.FC<AviatorGameProps> = ({ onOpenWallet, onOpenAuth }) => {
  const { user, profile, recentBets } = useAuth();
  const {
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
    retentionWindowMinutes,
    totalPurgedAviatorCount,
    continuousEngineUptimeSec,
    lastPurgeTime,
    adminSetAviatorOverride,
    adminClearAviatorOverride,
    adminEmergencyCrashNow
  } = useContinuousGame();

  const [adminNotice, setAdminNotice] = useState<string | null>(null);

  const [betAmount, setBetAmount] = useState<number>(50);
  const [autoCashoutEnabled, setAutoCashoutEnabled] = useState<boolean>(false);
  const [autoCashoutValue, setAutoCashoutValue] = useState<string>('2.00');
  const [soundEnabled, setSoundEnabledLocal] = useState<boolean>(() => isSoundEnabled());
  const [betFeedback, setBetFeedback] = useState<string | null>(null);

  const prevPhaseRef = useRef(aviatorPhase);
  const lastCountdownTickRef = useRef<number>(-1);
  const cashedBetIdRef = useRef<string | null>(null);

  // Synchronize local sound toggle with global storage & events
  useEffect(() => {
    const handleSoundToggle = (e: any) => {
      if (e?.detail?.enabled !== undefined) {
        setSoundEnabledLocal(e.detail.enabled);
      }
    };
    window.addEventListener('winxbet_sound_toggle', handleSoundToggle);
    return () => window.removeEventListener('winxbet_sound_toggle', handleSoundToggle);
  }, []);

  // Audio phase transitions: Takeoff roar and Crash impact
  useEffect(() => {
    const prevPhase = prevPhaseRef.current;
    if (aviatorPhase !== prevPhase) {
      if (aviatorPhase === 'flying' && prevPhase === 'countdown') {
        playTakeoffSound();
      } else if (aviatorPhase === 'crashed' && prevPhase === 'flying') {
        playCrashSound();
      }
      prevPhaseRef.current = aviatorPhase;
    }
  }, [aviatorPhase]);

  // Audio countdown warning ticks for 3, 2, 1
  useEffect(() => {
    if (aviatorPhase === 'countdown' && aviatorCountdownLeft <= 3 && aviatorCountdownLeft >= 1) {
      if (lastCountdownTickRef.current !== aviatorCountdownLeft) {
        lastCountdownTickRef.current = aviatorCountdownLeft;
        playTickSound(true);
      }
    } else {
      lastCountdownTickRef.current = -1;
    }
  }, [aviatorPhase, aviatorCountdownLeft]);

  // Automatic cashout audio chime (when engine auto-cashes out the bet)
  useEffect(() => {
    if (aviatorUserBet?.cashedOut && aviatorUserBet.betId !== cashedBetIdRef.current) {
      cashedBetIdRef.current = aviatorUserBet.betId;
      playCashoutSound();
    }
  }, [aviatorUserBet?.cashedOut, aviatorUserBet?.betId]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabledLocal(next);
    setSoundEnabled(next);
    triggerHaptic('selection');
    if (next) {
      playChipSound();
    }
  };

  const handlePlaceBet = async () => {
    triggerHaptic('heavy');
    if (!user) {
      playClickSound();
      onOpenAuth();
      return;
    }

    const autoMult = parseFloat(autoCashoutValue) || 2.0;
    const res = await placeAviatorBet(betAmount, autoCashoutEnabled, autoMult);
    if (!res.success) {
      triggerHaptic('error');
      playClickSound();
      setBetFeedback(res.message);
    } else {
      triggerHaptic('success');
      playBetPlacedSound();
      setBetFeedback(
        aviatorPhase === 'countdown'
          ? `Bet ₹${betAmount} placed for immediate takeoff!`
          : `Bet ₹${betAmount} queued for next continuous flight!`
      );
      setTimeout(() => setBetFeedback(null), 3000);
    }
  };

  const handleManualCashout = async () => {
    triggerHaptic('success');
    playCashoutSound();
    await cashoutAviatorBet();
  };

  // Trajectory coordinates calculation (percentage bounds 12% - 84%)
  const maxScale = Math.max(2.5, (aviatorCrashPoint || 2.5) - 1.0);
  const progressRatio = Math.min(1, Math.max(0, (aviatorMultiplier - 1.0) / maxScale));
  const planeX = aviatorPhase === 'countdown' ? 12 : 12 + progressRatio * 72;
  const planeY = aviatorPhase === 'countdown' ? 82 : 82 - Math.pow(progressRatio, 0.85) * 60;

  return (
    <div className="space-y-4">
      {/* 1-Hour Retention & Continuous Round Engine Security Banner */}
      <SecurityEngineBanner
        gameName="Aviator Continuous Flight"
        oneHourRecordCount={aviatorHistory.length}
        totalPurgedCount={totalPurgedAviatorCount}
        lastPurgeTime={lastPurgeTime}
        uptimeSec={continuousEngineUptimeSec}
      />

      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-4 shadow-2xl space-y-4 text-white">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-1 border-b border-gray-800/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white shadow-md shadow-red-500/30">
              <PlaneTakeoff className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-wide text-white flex items-center gap-1.5">
                <span>Aviator Continuous</span>
                <span className="px-1.5 py-0.2 bg-red-600/30 text-red-400 font-extrabold text-[9px] rounded-full uppercase border border-red-500/40">
                  24/7 ENGINE
                </span>
              </h2>
              <div className="text-[10px] text-gray-400">Continuous flight loop • No waiting for user bet</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="aviator-sound-toggle-btn"
              onClick={toggleSound}
              className="p-1.5 rounded-lg bg-gray-950 border border-gray-800 text-gray-400 hover:text-white transition cursor-pointer"
              title={soundEnabled ? 'Mute Game Audio' : 'Unmute Game Audio'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <div className="text-right">
              <span className="text-[10px] text-gray-400 block">Balance</span>
              <span className="text-xs font-black text-amber-400 font-mono">
                ₹{profile ? profile.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Multipliers Ribbon (From Continuous 1-Hour Stream) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" /> Live Stream:
          </span>
          {aviatorRecentMultipliers.length === 0 ? (
            <span className="text-[10px] text-gray-600">Initializing flight series...</span>
          ) : (
            aviatorRecentMultipliers.map((m, idx) => {
              let badgeColor = 'bg-blue-500/15 text-blue-300 border-blue-500/30';
              if (m >= 10) {
                badgeColor = 'bg-amber-500/25 text-amber-300 border-amber-500/50 font-black shadow-sm shadow-amber-500/20';
              } else if (m >= 2) {
                badgeColor = 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-bold';
              }
              return (
                <span
                  key={idx}
                  className={`px-2 py-0.5 rounded-lg font-mono text-[11px] border shrink-0 ${badgeColor}`}
                >
                  {m.toFixed(2)}x
                </span>
              );
            })
          )}
        </div>

        {/* Admin Instant Crash Commander */}
        {profile?.role === 'admin' && (
          <div className="bg-gray-950 border border-rose-500/30 rounded-2xl p-3 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span className="text-xs font-black text-white flex items-center gap-1.5">
                  Admin Flight Control:
                  <span className="font-mono text-amber-400">#{aviatorCurrentRoundId}</span>
                </span>
                <span className="text-xs font-mono text-gray-400">
                  Crash Point: <strong className="text-amber-400 font-bold">{aviatorCrashPoint.toFixed(2)}x</strong>
                </span>
              </div>

              {aviatorPhase === 'flying' && (
                <button
                  onClick={async () => {
                    triggerHaptic('heavy');
                    playCrashSound();
                    await adminEmergencyCrashNow();
                    setAdminNotice('CRASHED! Plane terminated immediately.');
                    setTimeout(() => setAdminNotice(null), 3000);
                  }}
                  className="px-3 py-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-[11px] rounded-xl uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-red-900/30 active:scale-95 transition-all"
                >
                  <Flame className="w-3.5 h-3.5" />
                  Crash Now ({aviatorMultiplier.toFixed(2)}x)
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[10px] text-gray-400 shrink-0 font-bold">Lock Crash:</span>
              {[1.10, 1.35, 1.50, 2.00, 3.50, 5.00, 10.00].map(m => (
                <button
                  key={m}
                  onClick={async () => {
                    triggerHaptic('medium');
                    playClickSound();
                    await adminSetAviatorOverride(aviatorCurrentRoundId, m);
                    setAdminNotice(`Flight #${aviatorCurrentRoundId} crash locked to ${m}x!`);
                    setTimeout(() => setAdminNotice(null), 3000);
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono transition-colors ${
                    aviatorCrashPoint === m
                      ? 'bg-amber-400 text-gray-950 font-black'
                      : 'bg-gray-900 border border-gray-800 text-gray-300 hover:border-amber-400'
                  }`}
                >
                  {m}x
                </button>
              ))}
              <button
                onClick={async () => {
                  triggerHaptic('light');
                  await adminClearAviatorOverride(aviatorCurrentRoundId);
                  setAdminNotice(`Flight #${aviatorCurrentRoundId} reset to dynamic RNG.`);
                  setTimeout(() => setAdminNotice(null), 3000);
                }}
                className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-gray-900 border border-gray-800 text-gray-400 hover:text-white"
              >
                Reset RNG
              </button>
            </div>

            {adminNotice && (
              <div className="text-[11px] font-bold text-amber-300 bg-amber-400/10 border border-amber-400/30 rounded-xl px-2.5 py-1 animate-fadeIn">
                {adminNotice}
              </div>
            )}
          </div>
        )}

        {/* Flight Radar Canvas Area */}
        <div className="relative h-64 bg-gradient-to-b from-gray-950 via-gray-900 to-black rounded-2xl border border-gray-800/90 overflow-hidden flex flex-col items-center justify-center select-none shadow-inner">
          {/* Animated Radar Background Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:28px_28px] opacity-25" />

          {/* Diagonal Horizon Axis Marker */}
          <div className="absolute left-3 bottom-3 text-[9px] text-gray-600 font-mono">0.00s</div>
          <div className="absolute right-3 bottom-3 text-[9px] text-gray-600 font-mono">Continuous Stream</div>
          <div className="absolute left-3 top-3 text-[9px] text-gray-600 font-mono">MAX 100x</div>

          {/* Flight Trajectory Curve SVG */}
          {aviatorPhase === 'flying' && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <linearGradient id="flightGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#dc2626" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0.35" />
                </linearGradient>
              </defs>
              <path
                d={`M 0 256 Q ${planeX * 2.8} 256 ${planeX * 3.8} ${planeY * 2.56} L ${planeX * 3.8} 256 Z`}
                fill="url(#flightGradient)"
              />
              <path
                d={`M 0 256 Q ${planeX * 2.8} 256 ${planeX * 3.8} ${planeY * 2.56}`}
                fill="none"
                stroke="#ef4444"
                strokeWidth="3.5"
                strokeLinecap="round"
                className="filter drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]"
              />
            </svg>
          )}

          {/* Countdown Mode (Inter-Round Pre-Flight) */}
          {aviatorPhase === 'countdown' && (
            <div className="text-center z-10 space-y-2 p-4 animate-fadeIn">
              <div className="w-14 h-14 rounded-full bg-red-600/20 border border-red-500/40 mx-auto flex items-center justify-center animate-pulse shadow-lg shadow-red-500/20">
                <PlaneTakeoff className="w-7 h-7 text-red-400" />
              </div>
              <div className="text-xs uppercase font-extrabold tracking-widest text-amber-400 flex items-center justify-center gap-1.5">
                <Timer className="w-3.5 h-3.5" />
                <span>NEXT TAKEOFF IN {aviatorCountdownLeft} SECONDS</span>
              </div>
              <div className="text-3xl font-black text-white font-mono">
                Round #{aviatorCurrentRoundId.slice(-6)}
              </div>
              <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                Game engine does not wait for bets. Cycles continue 24/7 without interruption.
              </p>
            </div>
          )}

          {/* Flying Mode */}
          {aviatorPhase === 'flying' && (
            <>
              <div
                className="absolute z-20 transition-all duration-75 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{ left: `${planeX}%`, top: `${planeY}%` }}
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center shadow-lg shadow-red-500/50 -rotate-12">
                    <Plane className="w-6 h-6 text-white transform rotate-45" />
                  </div>
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-2 bg-gradient-to-l from-amber-400 to-transparent rounded-full animate-pulse" />
                </div>
              </div>

              <div className="text-center z-10 space-y-1">
                <div className="text-5xl font-black text-white tracking-tight font-mono drop-shadow-[0_4px_12px_rgba(239,68,68,0.5)]">
                  {aviatorMultiplier.toFixed(2)}x
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[11px] font-bold text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>CONTINUOUS ASCENT IN PROGRESS</span>
                </div>
              </div>
            </>
          )}

          {/* Crashed Mode */}
          {aviatorPhase === 'crashed' && (
            <div className="text-center z-10 space-y-2 p-4 animate-fadeIn">
              <div className="text-xs uppercase font-extrabold tracking-widest text-red-500 flex items-center justify-center gap-1">
                <AlertTriangle className="w-4 h-4" /> FLEW AWAY
              </div>
              <div className="text-5xl font-black text-gray-300 font-mono tracking-tight">
                @{aviatorCrashPoint.toFixed(2)}x
              </div>
              {aviatorUserBet && aviatorUserBet.cashedOut ? (
                <div className="inline-block px-4 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 font-black text-sm">
                  🎉 Cashed Out: +₹{(aviatorUserBet.winAmount || (aviatorUserBet.cashedMultiplier || 1) * aviatorUserBet.amount).toFixed(2)}
                </div>
              ) : (
                <div className="text-xs text-gray-500 font-medium">
                  Next autonomous flight launches immediately in 3 seconds!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bet & Cashout Controls Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Left: Stake Wager & Quick Chips */}
          <div className="bg-gray-950 border border-gray-800 rounded-2xl p-3 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="font-bold flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-amber-400" /> Stake Wager (₹)
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    playChipSound();
                    setBetAmount(prev => Math.max(10, Math.floor(prev / 2)));
                  }}
                  className="px-2 py-0.5 bg-gray-900 hover:bg-gray-800 rounded text-[10px] text-gray-300 font-mono cursor-pointer"
                >
                  1/2
                </button>
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    playChipSound();
                    setBetAmount(prev => prev * 2);
                  }}
                  className="px-2 py-0.5 bg-gray-900 hover:bg-gray-800 rounded text-[10px] text-gray-300 font-mono cursor-pointer"
                >
                  2X
                </button>
              </div>
            </div>

            {/* Preset Buttons */}
            <div className="grid grid-cols-4 gap-1.5">
              {[20, 50, 100, 500].map((amt) => (
                <button
                  key={amt}
                  onClick={() => {
                    triggerHaptic('light');
                    playChipSound();
                    setBetAmount(amt);
                  }}
                  className={`py-1.5 rounded-xl text-xs font-bold font-mono transition border cursor-pointer ${
                    betAmount === amt
                      ? 'bg-red-600 text-white border-red-500 font-black shadow-md shadow-red-600/20'
                      : 'bg-gray-900 hover:bg-gray-800 border-gray-800 text-gray-300'
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            {/* Auto Cashout Options */}
            <div className="pt-1 border-t border-gray-800/80 flex items-center justify-between text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer text-gray-300 font-medium text-[11px]">
                <input
                  type="checkbox"
                  checked={autoCashoutEnabled}
                  onChange={(e) => {
                    triggerHaptic('selection');
                    playClickSound();
                    setAutoCashoutEnabled(e.target.checked);
                  }}
                  className="rounded accent-red-600 w-3.5 h-3.5 cursor-pointer"
                />
                <span>Auto Cashout</span>
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.1"
                  min="1.1"
                  max="100"
                  value={autoCashoutValue}
                  onChange={(e) => setAutoCashoutValue(e.target.value)}
                  disabled={!autoCashoutEnabled}
                  className={`w-16 px-2 py-1 bg-gray-900 border rounded-lg text-xs font-mono text-center focus:outline-none ${
                    autoCashoutEnabled ? 'border-amber-500/50 text-amber-400' : 'border-gray-800 text-gray-600'
                  }`}
                />
                <span className="text-[10px] text-gray-400">x</span>
              </div>
            </div>
          </div>

          {/* Right: Dynamic Action Button */}
          <div className="relative min-h-[95px]">
            <AnimatePresence mode="wait">
              {aviatorPhase === 'flying' && aviatorUserBet && !aviatorUserBet.cashedOut ? (
                <motion.button
                  key="aviator-cashout"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  id="aviator-cashout-btn"
                  onClick={handleManualCashout}
                  className="w-full h-full min-h-[95px] rounded-2xl font-black text-lg shadow-xl transition flex flex-col items-center justify-center gap-1 active:scale-[0.98] bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-gray-950 hover:from-amber-300 hover:to-yellow-400 animate-pulse border-2 border-yellow-300 shadow-amber-500/30"
                >
                  <span className="text-xs uppercase tracking-widest font-black text-gray-900">
                    CASH OUT NOW
                  </span>
                  <span className="text-2xl font-black font-mono">
                    ₹{(aviatorUserBet.amount * aviatorMultiplier).toFixed(2)}
                  </span>
                  <span className="text-[10px] font-bold text-gray-800 font-mono">
                    @{aviatorMultiplier.toFixed(2)}x
                  </span>
                </motion.button>
              ) : aviatorUserBet && aviatorUserBet.cashedOut ? (
                <motion.div
                  key="aviator-won"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  className="w-full h-full min-h-[95px] rounded-2xl bg-emerald-950/60 border border-emerald-500/50 flex flex-col items-center justify-center gap-1 p-3 text-emerald-300"
                >
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  <span className="text-xs uppercase font-bold tracking-wider">Round Won!</span>
                  <span className="text-lg font-black font-mono">
                    +₹{(aviatorUserBet.winAmount || (aviatorUserBet.cashedMultiplier || 1) * aviatorUserBet.amount).toFixed(2)}
                  </span>
                  <span className="text-[10px] text-emerald-400/70">
                    @{aviatorUserBet.cashedMultiplier?.toFixed(2)}x
                  </span>
                </motion.div>
              ) : aviatorPhase === 'countdown' && aviatorUserBet ? (
                <motion.div
                  key="aviator-placed"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  className="w-full h-full min-h-[95px] rounded-2xl bg-gray-950 border border-amber-500/40 flex flex-col items-center justify-center gap-1 p-3 text-amber-300 shadow-lg"
                >
                  <Clock className="w-6 h-6 text-amber-400 animate-spin" />
                  <span className="text-xs font-black uppercase">
                    Bet Placed: ₹{aviatorUserBet.grossAmount || aviatorUserBet.amount}
                  </span>
                  <span className="text-[11px] text-gray-400">Taking off in {aviatorCountdownLeft}s...</span>
                </motion.div>
              ) : aviatorQueuedNextBet ? (
                <motion.div
                  key="aviator-queued"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  className="w-full h-full min-h-[95px] rounded-2xl bg-gray-950 border border-blue-500/40 flex flex-col items-center justify-center gap-1.5 p-3 text-blue-300"
                >
                  <Clock className="w-5 h-5 text-blue-400 animate-spin" />
                  <span className="text-xs font-black uppercase">Next Round Queued: ₹{aviatorQueuedNextBet.amount}</span>
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      playClickSound();
                      cancelQueuedAviatorBet();
                    }}
                    className="px-3 py-1 bg-red-600/30 hover:bg-red-600 text-red-300 hover:text-white rounded-lg text-[10px] font-bold border border-red-500/40 transition cursor-pointer"
                  >
                    Cancel Queue
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  key="aviator-ready"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  id="aviator-bet-btn"
                  onClick={handlePlaceBet}
                  className="w-full h-full min-h-[95px] bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-lg rounded-2xl shadow-xl transition flex flex-col items-center justify-center gap-1 active:scale-[0.98] border border-emerald-400/40 shadow-emerald-500/20 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <PlaneTakeoff className="w-6 h-6" />
                    <span>
                      {aviatorPhase === 'countdown' ? 'BET & READY' : 'QUEUE FOR NEXT FLIGHT'}
                    </span>
                  </div>
                  <span className="text-sm font-mono text-emerald-200">
                    ₹{betAmount} Wager
                  </span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {betFeedback && (
          <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold text-center animate-fadeIn">
            {betFeedback}
          </div>
        )}

        {/* Live Active Co-Pilots (Continuous Competitor Feed) */}
        <div className="bg-gray-950/70 border border-gray-800/80 rounded-2xl p-3 space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400 px-1">
            <div className="flex items-center gap-1.5 font-bold text-gray-300 text-[11px]">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>Flight Co-Pilots (Active Live Players)</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              1,412 in flight
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
            {aviatorCoPilots.slice(0, 4).map((bot, i) => {
              const hasCashed = aviatorPhase === 'flying' && aviatorMultiplier >= bot.target;
              return (
                <div
                  key={i}
                  className="p-1.5 bg-gray-900/60 rounded-xl border border-gray-800/60 flex items-center justify-between"
                >
                  <div className="flex items-center gap-1.5">
                    <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${bot.color} text-white font-black text-[9px] flex items-center justify-center`}>
                      {bot.user.slice(0, 2)}
                    </div>
                    <span className="font-mono text-[11px] text-gray-300">{bot.user}</span>
                    <span className="text-[10px] text-gray-500">₹{bot.amount}</span>
                  </div>
                  {hasCashed ? (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold text-[10px]">
                      @{bot.target.toFixed(2)}x
                    </span>
                  ) : aviatorPhase === 'flying' ? (
                    <span className="text-[10px] text-gray-500 font-mono animate-pulse">In Flight</span>
                  ) : (
                    <span className="text-[10px] text-gray-600 font-mono">Standby</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Multi-Page Optimized Game History (Different Pages, Not a Single Sheet) */}
      <AviatorHistoryPages
        history={aviatorHistory}
        userBets={recentBets}
        user={user}
        onOpenAuth={onOpenAuth}
        retentionWindowMinutes={retentionWindowMinutes}
        totalPurgedCount={totalPurgedAviatorCount}
      />
    </div>
  );
};
