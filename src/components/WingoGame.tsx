import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useContinuousGame } from '../context/ContinuousGameContext';
import { SecurityEngineBanner } from './SecurityEngineBanner';
import { WingoHistoryPages } from './WingoHistoryPages';
import { 
  Volume2, 
  VolumeX, 
  HelpCircle, 
  Clock, 
  Sparkles, 
  Smartphone, 
  Vibrate, 
  Zap, 
  Flame, 
  Timer, 
  TrendingUp, 
  CheckCircle2, 
  ShieldCheck, 
  Coins, 
  Award, 
  ArrowUpRight, 
  CircleDot,
  X,
  ChevronDown,
  BarChart3,
  Crown
} from 'lucide-react';
import { WingoVisualTrendChart } from './WingoVisualTrendChart';
import { triggerHaptic, isHapticsEnabled, setHapticsEnabled } from '../utils/haptics';
import { 
  isSoundEnabled, 
  setSoundEnabled, 
  playChipSound, 
  playTabSound, 
  playClickSound, 
  playTickSound, 
  playRevealSound, 
  playBetPlacedSound 
} from '../utils/audio';

interface WingoGameProps {
  onOpenWallet: () => void;
  onOpenAuth: () => void;
  onOpenAdminHub?: () => void;
}

export const WingoGame: React.FC<WingoGameProps> = ({ onOpenWallet, onOpenAuth, onOpenAdminHub }) => {
  const { user, profile, placeBet, recentBets, isAdmin } = useAuth();
  const { 
    wingoTimeLeft, 
    wingoCurrentPeriod, 
    wingoIsLocked, 
    wingoHistory, 
    wingoRevealedResult, 
    wingoIsRevealing, 
    registerWingoBet,
    wingoUpcomingResult,
    retentionWindowMinutes,
    totalPurgedWingoCount,
    continuousEngineUptimeSec,
    lastPurgeTime
  } = useContinuousGame();

  const [gameTimeMode, setGameTimeMode] = useState<'1m' | '3m' | '5m'>('1m');
  
  // Betting Sheet
  const [selectedBet, setSelectedBet] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState<number>(10);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [hapticActive, setHapticActive] = useState<boolean>(() => isHapticsEnabled());
  const [soundActive, setSoundActive] = useState<boolean>(() => isSoundEnabled());
  const [betMessage, setBetMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [showQuickTrends, setShowQuickTrends] = useState<boolean>(false);

  // Sync with global sound toggle events from settings
  useEffect(() => {
    const handleSoundToggle = (e: any) => {
      if (e?.detail?.enabled !== undefined) {
        setSoundActive(e.detail.enabled);
      }
    };
    window.addEventListener('winxbet_sound_toggle', handleSoundToggle);
    return () => window.removeEventListener('winxbet_sound_toggle', handleSoundToggle);
  }, []);

  // Ticking sound during final 5 seconds before lock
  useEffect(() => {
    if (wingoTimeLeft <= 5 && wingoTimeLeft >= 1) {
      playTickSound(true);
    }
  }, [wingoTimeLeft]);

  // Round result reveal chime when lottery outcome is finalized
  useEffect(() => {
    if (wingoIsRevealing && wingoRevealedResult) {
      playRevealSound();
    }
  }, [wingoIsRevealing, wingoRevealedResult?.periodId]);

  const toggleHaptics = () => {
    const next = !hapticActive;
    setHapticActive(next);
    setHapticsEnabled(next);
    if (next) triggerHaptic('selection');
  };

  const toggleSound = () => {
    const next = !soundActive;
    setSoundActive(next);
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
    if (!selectedBet) return;
    if (wingoIsLocked) {
      triggerHaptic('warning');
      playClickSound();
      setBetMessage({ text: 'Round is concluding. Bets locked for last 5 seconds to prevent frontrunning!', ok: false });
      return;
    }

    const res = await placeBet({
      gameType: `wingo-${gameTimeMode}`,
      periodId: wingoCurrentPeriod,
      selection: selectedBet,
      amount: betAmount,
      multiplier: multiplier
    });

    if (res.success && res.betId) {
      triggerHaptic('success');
      playBetPlacedSound();
      registerWingoBet({
        betId: res.betId,
        periodId: wingoCurrentPeriod,
        selection: selectedBet,
        amount: betAmount,
        multiplier: multiplier,
        netAmount: res.netAmount,
        fee: res.fee
      });
      const placedChoice = selectedBet;
      const totalStake = betAmount * multiplier;

      // Close the bet wager immediately with smooth transition effects
      setSelectedBet(null);

      setBetMessage({ 
        text: `Bet placed on [${placedChoice}] for ₹${totalStake}. Good luck!`, 
        ok: true 
      });

      setTimeout(() => {
        setBetMessage(prev => (prev?.ok ? null : prev));
      }, 4500);
    } else {
      triggerHaptic('error');
      playClickSound();
      setBetMessage({ text: res.message, ok: false });
    }
  };

  const minutes = Math.floor(wingoTimeLeft / 60);
  const seconds = wingoTimeLeft % 60;
  const lastDraw = wingoHistory[0];

  return (
    <div className="space-y-4">
      {/* 1-Hour Retention & Continuous Round Engine Security Banner */}
      <SecurityEngineBanner
        gameName="WinGo 1-Min Lottery"
        oneHourRecordCount={wingoHistory.length}
        totalPurgedCount={totalPurgedWingoCount}
        lastPurgeTime={lastPurgeTime}
        uptimeSec={continuousEngineUptimeSec}
      />

      {/* Game Mode Selector (Win Go 1Min, 3Min, 5Min) & Audio/Tactile Toggles */}
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-900 border border-gray-800 rounded-2xl p-1.5 flex gap-1.5 shadow-lg">
          {[
            { id: '1m', label: '1 Min', icon: Zap, color: 'text-amber-400' },
            { id: '3m', label: '3 Min', icon: Timer, color: 'text-blue-400' },
            { id: '5m', label: '5 Min', icon: Flame, color: 'text-rose-400' }
          ].map((mode) => {
            const Icon = mode.icon;
            const isSelected = gameTimeMode === mode.id;
            return (
              <button
                key={mode.id}
                id={`wingo-tab-${mode.id}`}
                onClick={() => {
                  triggerHaptic('light');
                  playTabSound();
                  setGameTimeMode(mode.id as any);
                }}
                className={`flex-1 py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                  isSelected
                    ? 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white shadow-md shadow-red-500/25 border border-amber-400/40'
                    : 'bg-gray-950/80 text-gray-400 hover:text-white border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-300' : mode.color}`} />
                <span className="font-extrabold uppercase">{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sound FX toggle button */}
        <button
          id="wingo-sound-toggle"
          onClick={toggleSound}
          title={soundActive ? 'Game Audio Active' : 'Game Audio Muted'}
          className={`p-2.5 rounded-2xl border transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
            soundActive
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-sm'
              : 'bg-gray-900 border-gray-800 text-gray-500 hover:text-gray-300'
          }`}
        >
          {soundActive ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
          <span className="text-[8px] font-black uppercase">Sound</span>
        </button>

        {/* Haptic tactile feedback toggle button */}
        <button
          id="wingo-haptic-toggle"
          onClick={toggleHaptics}
          title={hapticActive ? 'Tactile Haptic Feedback Active' : 'Tactile Haptics Muted'}
          className={`p-2.5 rounded-2xl border transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
            hapticActive
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-sm'
              : 'bg-gray-900 border-gray-800 text-gray-500 hover:text-gray-300'
          }`}
        >
          <Vibrate className="w-4 h-4" />
          <span className="text-[8px] font-black uppercase">Haptic</span>
        </button>
      </div>

      {/* VIP Super Admin Pre-Session Result Peek */}
      {isAdmin && wingoUpcomingResult && (
        <div className="bg-gradient-to-r from-gray-950 via-purple-950/40 to-gray-950 border border-amber-500/50 rounded-2xl p-3 shadow-lg flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="text-[11px] font-black text-amber-300 uppercase tracking-wide">
                Admin Pre-Session Result Peek
              </span>
              <span className="text-[10px] text-gray-400 font-mono">#{wingoUpcomingResult.periodId}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400">Draw in {wingoTimeLeft}s</span>
              {onOpenAdminHub && (
                <button
                  onClick={onOpenAdminHub}
                  className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 rounded-lg text-[9px] font-bold text-amber-300 transition"
                >
                  Admin Hub →
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between bg-gray-950/90 border border-gray-800 rounded-xl px-3 py-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400">Outcome:</span>
              <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-white font-mono font-black text-xs ${
                wingoUpcomingResult.number === 0 ? 'bg-gradient-to-tr from-rose-600 to-purple-600' :
                wingoUpcomingResult.number === 5 ? 'bg-gradient-to-tr from-emerald-600 to-purple-600' :
                [1, 3, 7, 9].includes(wingoUpcomingResult.number) ? 'bg-emerald-600' : 'bg-rose-600'
              }`}>
                {wingoUpcomingResult.number}
              </span>
              <span className="text-[10px] font-bold text-amber-400 font-mono">
                [{wingoUpcomingResult.size} / {wingoUpcomingResult.colors.join('+')}]
              </span>
            </div>

            <div className="flex items-center gap-1 text-[9px] font-mono">
              {wingoUpcomingResult.isOverridden ? (
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  ADMIN OVERRIDE
                </span>
              ) : (
                <span className="text-emerald-400">
                  PROVABLY FAIR
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Period & Countdown Clock Banner */}
      <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 border border-amber-500/30 rounded-3xl p-4 shadow-xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between relative z-10">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-semibold">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Period #{wingoCurrentPeriod}</span>
            </div>
            
            {/* Last Draw Result pill */}
            {lastDraw && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-[10px] text-gray-400">Last Draw:</span>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white font-mono font-bold text-[10px] shadow-sm ${
                  lastDraw.number === 0 ? 'bg-gradient-to-tr from-rose-600 to-purple-600' :
                  lastDraw.number === 5 ? 'bg-gradient-to-tr from-emerald-600 to-purple-600' :
                  [1, 3, 7, 9].includes(lastDraw.number) ? 'bg-emerald-600' : 'bg-rose-600'
                }`}>
                  {lastDraw.number}
                </span>
                <span className="text-[10px] font-bold text-amber-400 font-mono">
                  {lastDraw.size}
                </span>
              </div>
            )}
          </div>

          <div className="text-right">
            <div className="text-[11px] text-gray-400 font-medium">Draw Countdown</div>
            <div className="flex items-center gap-1 mt-1 justify-end">
              <div className="bg-gray-950 border border-gray-800 px-2 py-1 rounded-xl text-lg font-black text-white font-mono shadow-inner">
                {String(minutes).padStart(2, '0')}
              </div>
              <span className="text-amber-400 font-black animate-pulse">:</span>
              <div className={`px-2 py-1 rounded-xl text-lg font-black font-mono transition shadow-inner ${
                wingoIsLocked 
                  ? 'bg-red-600 text-white animate-bounce ring-2 ring-red-400' 
                  : 'bg-gray-950 border border-gray-800 text-white'
              }`}>
                {String(seconds).padStart(2, '0')}
              </div>
            </div>
          </div>
        </div>

        {/* Locked banner or Reveal Animation */}
        {wingoIsRevealing && wingoRevealedResult ? (
          <div className="mt-3 py-2 px-3 bg-gradient-to-r from-amber-600/30 via-yellow-500/20 to-amber-600/30 border border-amber-400/50 rounded-2xl flex items-center justify-center gap-2 animate-pulse">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-black text-amber-300 font-mono">
              DRAW RESULT: NUMBER {wingoRevealedResult.number} ({wingoRevealedResult.size})!
            </span>
          </div>
        ) : wingoIsLocked ? (
          <div className="mt-3 py-1.5 px-3 bg-red-950/90 border border-red-500/40 rounded-xl text-center text-xs font-black text-red-300 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
            <span>Bets Locked! Finalizing Continuous Fair RNG Draw...</span>
          </div>
        ) : null}
      </div>

      {/* Quick Visual Trend Chart & Pattern Analyzer */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            setShowQuickTrends(!showQuickTrends);
          }}
          className="w-full flex items-center justify-between p-3 rounded-2xl bg-gray-900 border border-amber-500/30 hover:border-amber-500/60 transition shadow-lg text-left cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-white flex items-center gap-2">
                <span>Visual Trend Chart &amp; Patterns</span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Recharts
                </span>
              </div>
              <div className="text-[10px] text-gray-400">
                Winning number trajectory, color flow &amp; hot/cold digits
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold">
            <span className="text-[11px] hidden sm:inline">{showQuickTrends ? 'Hide Chart' : 'Show Chart'}</span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showQuickTrends ? 'rotate-180' : ''}`} />
          </div>
        </button>

        <AnimatePresence>
          {showQuickTrends && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <WingoVisualTrendChart
                history={wingoHistory}
                onSelectBet={(choice) => setSelectedBet(choice)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bet Action Section */}
      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-4 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-gray-800/80">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-300">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>1. Predict Color (2x - 4.5x)</span>
          </div>
          <span className="text-xs text-amber-400 font-mono font-bold">
            Balance: ₹{profile ? profile.balance.toFixed(2) : '0.00'}
          </span>
        </div>

        {/* Primary Color Buttons: Green, Violet, Red */}
        <div className="grid grid-cols-3 gap-2.5">
          <button
            id="bet-color-green"
            onClick={() => {
              triggerHaptic('selection');
              playChipSound();
              setSelectedBet('Green');
            }}
            className={`py-3 rounded-2xl font-black text-xs sm:text-sm tracking-wide transition shadow-lg relative flex flex-col items-center justify-center gap-1 cursor-pointer ${
              selectedBet === 'Green'
                ? 'bg-emerald-500 text-white ring-4 ring-emerald-400/50 scale-[1.02] shadow-emerald-500/30'
                : 'bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white border border-emerald-500/40'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>Green 2x</span>
          </button>
          
          <button
            id="bet-color-violet"
            onClick={() => {
              triggerHaptic('selection');
              playChipSound();
              setSelectedBet('Violet');
            }}
            className={`py-3 rounded-2xl font-black text-xs sm:text-sm tracking-wide transition shadow-lg relative flex flex-col items-center justify-center gap-1 cursor-pointer ${
              selectedBet === 'Violet'
                ? 'bg-purple-600 text-white ring-4 ring-purple-400/50 scale-[1.02] shadow-purple-500/30'
                : 'bg-gradient-to-b from-purple-700 to-purple-800 hover:from-purple-600 hover:to-purple-700 text-white border border-purple-500/40'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-200" />
            <span>Violet 4.5x</span>
          </button>

          <button
            id="bet-color-red"
            onClick={() => {
              triggerHaptic('selection');
              playChipSound();
              setSelectedBet('Red');
            }}
            className={`py-3 rounded-2xl font-black text-xs sm:text-sm tracking-wide transition shadow-lg relative flex flex-col items-center justify-center gap-1 cursor-pointer ${
              selectedBet === 'Red'
                ? 'bg-rose-600 text-white ring-4 ring-rose-400/50 scale-[1.02] shadow-rose-500/30'
                : 'bg-gradient-to-b from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white border border-rose-500/40'
            }`}
          >
            <Flame className="w-4 h-4 text-rose-200" />
            <span>Red 2x</span>
          </button>
        </div>

        {/* Direct Number Buttons (0 - 9) - 9x Payout */}
        <div>
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span className="font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-400" /> 2. Direct Number Guess (9x Return)
            </span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
              const isSelected = selectedBet === String(num);
              let ballStyle = 'bg-gray-800 text-white border-gray-700 hover:bg-gray-700';
              if (num === 0) {
                ballStyle = 'bg-gradient-to-tr from-rose-600 via-purple-600 to-purple-700 text-white border-purple-400/50';
              } else if (num === 5) {
                ballStyle = 'bg-gradient-to-tr from-emerald-600 via-teal-600 to-purple-700 text-white border-emerald-400/50';
              } else if ([1, 3, 7, 9].includes(num)) {
                ballStyle = 'bg-gradient-to-b from-emerald-600 to-emerald-700 text-white border-emerald-500/40';
              } else {
                ballStyle = 'bg-gradient-to-b from-rose-600 to-rose-700 text-white border-rose-500/40';
              }

              return (
                <button
                  key={num}
                  id={`bet-number-${num}`}
                  onClick={() => {
                    triggerHaptic('selection');
                    playChipSound();
                    setSelectedBet(String(num));
                  }}
                  className={`h-11 rounded-xl font-mono font-black text-base flex flex-col items-center justify-center border transition shadow-md cursor-pointer ${ballStyle} ${
                    isSelected ? 'ring-4 ring-amber-400 scale-105 shadow-amber-400/30' : 'hover:scale-[1.02]'
                  }`}
                >
                  <span>{num}</span>
                  <span className="text-[8px] opacity-75 leading-none">9x</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Big / Small Choice */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            id="bet-size-big"
            onClick={() => {
              triggerHaptic('selection');
              playChipSound();
              setSelectedBet('Big');
            }}
            className={`py-2.5 rounded-2xl font-black text-xs sm:text-sm tracking-wider uppercase transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer ${
              selectedBet === 'Big'
                ? 'bg-amber-500 text-gray-950 ring-4 ring-amber-300 font-black'
                : 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Big (5 - 9) 2x</span>
          </button>
          <button
            id="bet-size-small"
            onClick={() => {
              triggerHaptic('selection');
              playChipSound();
              setSelectedBet('Small');
            }}
            className={`py-2.5 rounded-2xl font-black text-xs sm:text-sm tracking-wider uppercase transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer ${
              selectedBet === 'Small'
                ? 'bg-blue-500 text-white ring-4 ring-blue-300 font-black'
                : 'bg-blue-500/15 text-blue-300 border border-blue-500/30 hover:bg-blue-500/25'
            }`}
          >
            <CircleDot className="w-4 h-4" />
            <span>Small (0 - 4) 2x</span>
          </button>
        </div>

        {/* Amount & Multiplier Betting Drawer with Smooth Exit/Enter Transitions */}
        <AnimatePresence mode="wait">
          {selectedBet && (
            <motion.div
              key="wingo-wager-drawer"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.97, transition: { duration: 0.22, ease: 'easeOut' } }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="bg-gray-950 border border-gray-800 rounded-2xl p-3.5 space-y-3 shadow-2xl overflow-hidden relative"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 font-semibold flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-amber-400" /> Selected Wager:
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-black text-amber-400 text-sm px-3 py-0.5 bg-amber-400/15 rounded-full border border-amber-400/30 font-mono">
                    {selectedBet}
                  </span>
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      playClickSound();
                      setSelectedBet(null);
                    }}
                    className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition cursor-pointer"
                    title="Close Wager"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Base Unit Casino Chips */}
              <div>
                <div className="text-[11px] text-gray-400 mb-1.5 font-medium">Base Token (₹)</div>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 10, 100, 1000].map((unit) => (
                    <button
                      key={unit}
                      onClick={() => {
                        triggerHaptic('light');
                        playChipSound();
                        setBetAmount(unit);
                      }}
                      className={`py-2 rounded-xl text-xs font-black font-mono transition border shadow-sm cursor-pointer ${
                        betAmount === unit
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-950 border-yellow-300 shadow-amber-500/30'
                          : 'bg-gray-900 border-gray-800 text-gray-300 hover:bg-gray-800'
                      }`}
                    >
                      ₹{unit}
                    </button>
                  ))}
                </div>
              </div>

              {/* Multiplier Pills */}
              <div>
                <div className="text-[11px] text-gray-400 mb-1.5 font-medium">Multiplier</div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 5, 10, 20, 50].map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        triggerHaptic('light');
                        playClickSound();
                        setMultiplier(m);
                      }}
                      className={`py-1.5 rounded-lg text-xs font-bold font-mono transition border cursor-pointer ${
                        multiplier === m
                          ? 'bg-red-600 text-white border-red-500 font-black shadow-md'
                          : 'bg-gray-900 border-gray-800 text-gray-300 hover:bg-gray-800'
                      }`}
                    >
                      X{m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Total Stake & Confirm */}
              <div className="pt-2 flex items-center justify-between border-t border-gray-800/80">
                <div className="text-xs text-gray-400">
                  Total Stake: <span className="text-emerald-400 font-black text-base font-mono">₹{betAmount * multiplier}</span>
                </div>
                <button
                  id="place-bet-confirm-btn"
                  onClick={handlePlaceBet}
                  disabled={wingoIsLocked}
                  className="px-6 py-2.5 bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black rounded-xl text-xs tracking-wide shadow-lg disabled:opacity-50 transition active:scale-95 cursor-pointer"
                >
                  Confirm Bet
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {betMessage && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-lg ${
                betMessage.ok
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                  : 'bg-red-950/80 border-red-500/50 text-red-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {betMessage.ok ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <span>{betMessage.text}</span>
              </div>
              <button
                onClick={() => setBetMessage(null)}
                className="text-gray-400 hover:text-white ml-2 p-0.5"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Multi-Page Optimized Game History (Different Pages, Not a Single Sheet) */}
      <WingoHistoryPages
        history={wingoHistory}
        userBets={recentBets}
        user={user}
        onOpenAuth={onOpenAuth}
        retentionWindowMinutes={retentionWindowMinutes}
        totalPurgedCount={totalPurgedWingoCount}
        onSelectBet={(choice) => setSelectedBet(choice)}
      />
    </div>
  );
};
