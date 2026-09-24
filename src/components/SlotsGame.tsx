import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  Crown, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  CheckCircle2, 
  ShieldCheck,
  Flame,
  Zap
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { playChipSound, playCashoutSound, playCrashSound, playTakeoffSound, isSoundEnabled, setSoundEnabled } from '../utils/audio';

interface SlotsGameProps {
  onOpenWallet: () => void;
  onOpenAuth: () => void;
}

const SYMBOLS = [
  { char: '7️⃣', name: 'Lucky 7', mult3: 50 },
  { char: '💎', name: 'Diamond', mult3: 25 },
  { char: '👑', name: 'Crown', mult3: 20 },
  { char: '⭐', name: 'Star', mult3: 15 },
  { char: '🔔', name: 'Bell', mult3: 10 },
  { char: '🍒', name: 'Cherry', mult3: 8 },
  { char: '🍋', name: 'Lemon', mult3: 5 },
  { char: '🍇', name: 'Grapes', mult3: 4 }
];

export const SlotsGame: React.FC<SlotsGameProps> = ({ onOpenWallet, onOpenAuth }) => {
  const { user, profile, placeBet, settleBet } = useAuth();

  const [reels, setReels] = useState<[string, string, string]>(['7️⃣', '7️⃣', '7️⃣']);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [betAmount, setBetAmount] = useState<number>(50);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [winMessage, setWinMessage] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState<boolean>(() => isSoundEnabled());

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    triggerHaptic('light');
  };

  const handleSpin = async () => {
    if (!user || !profile) {
      onOpenAuth();
      return;
    }
    if (profile.balance < betAmount) {
      triggerHaptic('error');
      return;
    }
    if (isSpinning) return;

    setIsSpinning(true);
    setLastWin(null);
    setWinMessage(null);
    triggerHaptic('medium');
    playTakeoffSound();

    const res = await placeBet({
      gameType: 'slots',
      periodId: `SLOT-${Date.now()}`,
      selection: '777 Vegas Spin',
      amount: betAmount,
      multiplier: 1
    });

    if (!res.success || !res.betId) {
      setIsSpinning(false);
      return;
    }

    // Determine spin outcome
    // 35% win rate typical for Vegas 3-reel slots
    const randRoll = Math.random();
    let r1 = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].char;
    let r2 = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].char;
    let r3 = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].char;

    let winMultiplier = 0;
    let won = false;

    if (randRoll < 0.03) {
      // Mega Jackpot 777
      r1 = '7️⃣'; r2 = '7️⃣'; r3 = '7️⃣';
      winMultiplier = 50;
      won = true;
    } else if (randRoll < 0.08) {
      // Diamonds
      r1 = '💎'; r2 = '💎'; r3 = '💎';
      winMultiplier = 25;
      won = true;
    } else if (randRoll < 0.15) {
      // Crown
      r1 = '👑'; r2 = '👑'; r3 = '👑';
      winMultiplier = 20;
      won = true;
    } else if (randRoll < 0.23) {
      // Star / Bell
      r1 = '⭐'; r2 = '⭐'; r3 = '⭐';
      winMultiplier = 15;
      won = true;
    } else if (randRoll < 0.35) {
      // Cherries
      r1 = '🍒'; r2 = '🍒'; r3 = '🍒';
      winMultiplier = 8;
      won = true;
    } else if (randRoll < 0.45) {
      // 2 Cherries
      r1 = '🍒'; r2 = '🍒'; r3 = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].char;
      winMultiplier = 2;
      won = true;
    }

    // Spin animation with rapid cycling
    let ticks = 0;
    const interval = setInterval(() => {
      ticks++;
      setReels([
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].char,
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].char,
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].char
      ]);

      if (ticks >= 15) {
        clearInterval(interval);
        setReels([r1, r2, r3]);
        setIsSpinning(false);

        const winTotal = Number((betAmount * (1 - 0.03) * winMultiplier).toFixed(2));
        if (won && winTotal > 0) {
          triggerHaptic('success');
          playCashoutSound();
          settleBet(res.betId!, true, winTotal, 0);
          setLastWin(winTotal);
          setWinMessage(`Hit ${winMultiplier}x multiplier!`);
        } else {
          playCrashSound();
          settleBet(res.betId!, false, 0, 0);
        }
      }
    }, 70);
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-4 shadow-2xl space-y-4 text-white">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-2 border-b border-gray-800/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-600 flex items-center justify-center text-white shadow-md shadow-amber-500/30">
              <Sparkles className="w-4 h-4 text-gray-950" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-wide text-white flex items-center gap-1.5">
                <span>777 Vegas VIP Slots</span>
                <span className="px-1.5 py-0.2 bg-amber-500/30 text-amber-300 font-extrabold text-[9px] rounded-full uppercase border border-amber-500/40">
                  50x JACKPOT
                </span>
              </h2>
              <div className="text-[10px] text-gray-400">Classic Vegas 3-reel high-roller slot machine</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleSound}
              className="p-1.5 rounded-lg bg-gray-950 border border-gray-800 text-gray-400 hover:text-white transition cursor-pointer"
            >
              {soundOn ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <div className="text-right">
              <span className="text-[10px] text-gray-400 block">Balance</span>
              <span className="text-xs font-black text-amber-400 font-mono">
                ₹{profile ? profile.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
              </span>
            </div>
          </div>
        </div>

        {/* 3D Reel Machine Viewport */}
        <div className="bg-gradient-to-b from-gray-950 via-gray-900 to-black border-2 border-amber-500/40 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
          {/* Machine Header Marquee */}
          <div className="text-center pb-3">
            <span className="px-3 py-1 bg-amber-500/20 text-amber-300 font-black text-xs rounded-full border border-amber-500/30 tracking-widest uppercase">
              ⭐ MEGA JACKPOT WIN ⭐
            </span>
          </div>

          {/* Reel Display Box */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-black/90 rounded-2xl border border-gray-800 shadow-inner">
            {reels.map((symbol, i) => (
              <div
                key={i}
                className={`aspect-square rounded-2xl bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border border-gray-700/60 flex items-center justify-center text-4xl sm:text-5xl shadow-lg transition-transform ${
                  isSpinning ? 'animate-pulse scale-95' : 'scale-100'
                }`}
              >
                <span>{symbol}</span>
              </div>
            ))}
          </div>

          {/* Win Announcement */}
          {lastWin && (
            <div className="mt-4 p-3 bg-gradient-to-r from-amber-600/30 via-yellow-500/30 to-amber-600/30 border border-amber-500/50 rounded-2xl text-center space-y-0.5 animate-bounce">
              <div className="text-xs font-extrabold text-amber-300 uppercase tracking-widest">
                🎉 BIG WIN! {winMessage}
              </div>
              <div className="text-xl font-black font-mono text-amber-400">
                +₹{lastWin.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
          )}
        </div>

        {/* Stake Controls */}
        <div className="bg-gray-950 border border-gray-800 rounded-2xl p-3.5 space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-bold">Spin Bet Amount:</span>
            <span className="text-amber-400 font-mono font-bold">₹{betAmount}</span>
          </div>

          <div className="grid grid-cols-6 gap-1.5">
            {[10, 50, 100, 200, 500, 1000].map(amt => (
              <button
                key={amt}
                onClick={() => {
                  triggerHaptic('light');
                  playChipSound();
                  setBetAmount(amt);
                }}
                className={`py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                  betAmount === amt
                    ? 'bg-amber-500 text-gray-950 font-black shadow-md'
                    : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                ₹{amt}
              </button>
            ))}
          </div>

          <button
            onClick={handleSpin}
            disabled={isSpinning}
            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-xl transition active:scale-95 cursor-pointer ${
              isSpinning
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-gray-950 shadow-amber-500/25'
            }`}
          >
            <Sparkles className="w-5 h-5 text-gray-950" />
            <span>{isSpinning ? 'SPINNING REELS...' : `SPIN NOW (₹${betAmount})`}</span>
          </button>
        </div>

        {/* Paytable */}
        <div className="bg-gray-950 border border-gray-800 rounded-2xl p-3 space-y-2 text-xs">
          <div className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Paytable Payouts</div>
          <div className="grid grid-cols-4 gap-2 text-center">
            {SYMBOLS.slice(0, 4).map(s => (
              <div key={s.name} className="p-2 rounded-xl bg-gray-900/60 border border-gray-800">
                <span className="text-xl block">{s.char}</span>
                <span className="text-[10px] text-gray-400 font-bold block">{s.name}</span>
                <span className="text-xs font-black font-mono text-amber-400">{s.mult3}x</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
