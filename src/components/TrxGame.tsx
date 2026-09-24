import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useContinuousGame } from '../context/ContinuousGameContext';
import { SecurityEngineBanner } from './SecurityEngineBanner';
import { 
  Coins, 
  Clock, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  AlertCircle, 
  Crown,
  ShieldCheck,
  Zap,
  Lock,
  ExternalLink,
  Hash
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { playChipSound, playClickSound, playBetPlacedSound, isSoundEnabled, setSoundEnabled } from '../utils/audio';

interface TrxGameProps {
  onOpenWallet: () => void;
  onOpenAuth: () => void;
  onOpenAdminHub?: () => void;
}

export const TrxGame: React.FC<TrxGameProps> = ({ onOpenWallet, onOpenAuth, onOpenAdminHub }) => {
  const { user, profile, isAdmin } = useAuth();
  const {
    trxTimeLeft,
    trxCurrentPeriod,
    trxIsLocked,
    trxHistory,
    trxRevealedResult,
    trxIsRevealing,
    trxUpcomingResult,
    placeTrxBet,
    continuousEngineUptimeSec,
    lastPurgeTime
  } = useContinuousGame();

  const [selectedBet, setSelectedBet] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState<number>(50);
  const [betMultiplier, setBetMultiplier] = useState<number>(1);
  const [feedback, setFeedback] = useState<{ message: string; success: boolean } | null>(null);
  const [soundOn, setSoundOn] = useState<boolean>(() => isSoundEnabled());

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    triggerHaptic('light');
  };

  const chips = [10, 50, 100, 500, 1000, 5000];
  const multipliers = [1, 2, 5, 10, 20];
  const totalCost = betAmount * betMultiplier;

  const handleSelectBet = (sel: string) => {
    triggerHaptic('selection');
    playChipSound();
    setSelectedBet(sel);
    setFeedback(null);
  };

  const handleConfirmBet = async () => {
    if (!user || !profile) {
      onOpenAuth();
      return;
    }
    if (!selectedBet) {
      setFeedback({ success: false, message: 'Please select a color, size, or number first.' });
      return;
    }
    if (profile.balance < totalCost) {
      setFeedback({ success: false, message: 'Insufficient balance. Please recharge wallet.' });
      return;
    }

    const res = await placeTrxBet(selectedBet, totalCost);
    if (res.success) {
      triggerHaptic('success');
      playBetPlacedSound();
      setFeedback({ success: true, message: res.message });
      setSelectedBet(null);
    } else {
      triggerHaptic('error');
      setFeedback({ success: false, message: res.message });
    }
  };

  const latest = trxHistory[0];

  return (
    <div className="space-y-4">
      <SecurityEngineBanner
        gameName="TRX Hash Win Go Continuous"
        oneHourRecordCount={trxHistory.length}
        totalPurgedCount={0}
        lastPurgeTime={lastPurgeTime}
        uptimeSec={continuousEngineUptimeSec}
      />

      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-4 shadow-2xl space-y-4 text-white">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-2 border-b border-gray-800/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/30">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-wide text-white flex items-center gap-1.5">
                <span>TRX Hash Win Go</span>
                <span className="px-1.5 py-0.2 bg-emerald-500/30 text-emerald-300 font-extrabold text-[9px] rounded-full uppercase border border-emerald-500/40">
                  TRON SHA-256
                </span>
              </h2>
              <div className="text-[10px] text-gray-400">Cryptographic blockchain block hash lottery</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleSound}
              className="p-1.5 rounded-lg bg-gray-950 border border-gray-800 text-gray-400 hover:text-white transition cursor-pointer"
              title={soundOn ? 'Mute Audio' : 'Enable Audio'}
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

        {/* Live Block Explorer & Countdown Banner */}
        <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-black border border-gray-800 rounded-2xl p-4 shadow-inner space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-black uppercase tracking-wider">
                TRON MAINNET
              </span>
              <span className="text-xs text-gray-400 font-mono">
                Block #{latest ? latest.blockNumber.toLocaleString() : '68,490,210'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-400">Period #{trxCurrentPeriod.slice(-7)}</span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                <ShieldCheck className="w-3 h-3" /> Real Block Seeds
              </span>
            </div>
          </div>

          {/* Block Hash Live Stream */}
          <div className="bg-black/80 border border-gray-800/80 rounded-xl p-3 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono">
              <span className="flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-emerald-400" /> Block Hash:
              </span>
              <span className="text-gray-500">Decisive Last Character</span>
            </div>
            <div className="text-xs sm:text-sm font-mono tracking-wider break-all text-gray-300">
              {latest ? (
                <>
                  <span>{latest.blockHash.slice(0, -6)}</span>
                  <span className="text-amber-400 font-bold">{latest.blockHash.slice(-6, -1)}</span>
                  <span className={`inline-block px-1.5 py-0.5 rounded font-black text-white ml-1 ${
                    latest.lastDigit === 0 ? 'bg-gradient-to-r from-rose-600 to-purple-600' :
                    latest.lastDigit === 5 ? 'bg-gradient-to-r from-emerald-600 to-purple-600' :
                    [1, 3, 7, 9].includes(latest.lastDigit) ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}>
                    {latest.lastDigit}
                  </span>
                </>
              ) : (
                '00000000041b8a92f0c7e110a4...'
              )}
            </div>
          </div>

          {/* Timer and Status Bar */}
          <div className="flex items-center justify-between pt-1">
            <div className="space-y-0.5">
              <div className="text-[10px] text-gray-400 uppercase font-bold">Draw Countdown</div>
              <div className={`text-3xl font-black font-mono tracking-tight ${
                trxTimeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-emerald-400'
              }`}>
                {String(Math.floor(trxTimeLeft / 60)).padStart(2, '0')}:{String(trxTimeLeft % 60).padStart(2, '0')}
              </div>
            </div>

            <div className="text-right">
              {trxIsLocked ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-600/20 text-red-400 text-xs font-bold rounded-full border border-red-500/40">
                  <Lock className="w-3.5 h-3.5" /> LOCKED (LAST 5s)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full border border-emerald-500/40">
                  <Zap className="w-3.5 h-3.5" /> BETS ACCEPTED
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Super Admin Pre-Session Outcome Peek */}
        {isAdmin && trxUpcomingResult && (
          <div className="bg-gradient-to-r from-gray-950 via-emerald-950/40 to-gray-950 border border-emerald-500/50 rounded-2xl p-3 shadow-lg flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-400" />
                <span className="text-[11px] font-black text-amber-300 uppercase tracking-wide">
                  Admin Pre-Session TRX Hash Peek
                </span>
                <span className="text-[10px] text-gray-400 font-mono">#{trxUpcomingResult.periodId}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400">Draw in {trxTimeLeft}s</span>
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
                <span className="text-[10px] text-gray-400">Winning Digit:</span>
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-white font-mono font-black text-xs ${
                  trxUpcomingResult.lastDigit === 0 ? 'bg-gradient-to-tr from-rose-600 to-purple-600' :
                  trxUpcomingResult.lastDigit === 5 ? 'bg-gradient-to-tr from-emerald-600 to-purple-600' :
                  [1, 3, 7, 9].includes(trxUpcomingResult.lastDigit) ? 'bg-emerald-600' : 'bg-rose-600'
                }`}>
                  {trxUpcomingResult.lastDigit}
                </span>
                <span className="text-[10px] font-bold text-emerald-400 font-mono">
                  [{trxUpcomingResult.size} / {trxUpcomingResult.colors.join('+')}]
                </span>
              </div>
              <div className="text-[9px] font-mono">
                {trxUpcomingResult.isOverridden ? (
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    ADMIN OVERRIDE
                  </span>
                ) : (
                  <span className="text-emerald-400">PROVABLY FAIR</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Primary Color Bet Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => handleSelectBet('Green')}
            className={`py-3.5 px-2 rounded-2xl border transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
              selectedBet === 'Green'
                ? 'bg-gradient-to-b from-emerald-500 to-emerald-700 text-white font-black border-white shadow-lg shadow-emerald-500/30 scale-105'
                : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50'
            }`}
          >
            <span className="text-sm font-black uppercase">Green</span>
            <span className="text-xs font-mono font-bold">2.00x</span>
          </button>

          <button
            onClick={() => handleSelectBet('Violet')}
            className={`py-3.5 px-2 rounded-2xl border transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
              selectedBet === 'Violet'
                ? 'bg-gradient-to-b from-purple-500 to-purple-700 text-white font-black border-white shadow-lg shadow-purple-500/30 scale-105'
                : 'bg-purple-950/40 border-purple-500/40 text-purple-300 hover:bg-purple-900/50'
            }`}
          >
            <span className="text-sm font-black uppercase">Violet</span>
            <span className="text-xs font-mono font-bold">4.50x</span>
          </button>

          <button
            onClick={() => handleSelectBet('Red')}
            className={`py-3.5 px-2 rounded-2xl border transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
              selectedBet === 'Red'
                ? 'bg-gradient-to-b from-rose-500 to-rose-700 text-white font-black border-white shadow-lg shadow-rose-500/30 scale-105'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300 hover:bg-rose-900/50'
            }`}
          >
            <span className="text-sm font-black uppercase">Red</span>
            <span className="text-xs font-mono font-bold">2.00x</span>
          </button>
        </div>

        {/* Number Selection Grid (0 to 9) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs px-1 text-gray-400">
            <span>Direct Number (9.00x Payout):</span>
            <span className="text-[10px] font-mono text-amber-400">Select exact digit</span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
              const isSelected = selectedBet === String(num);
              let btnBg = 'bg-gray-950 border-gray-800 text-white hover:border-gray-700';
              if (isSelected) {
                btnBg = 'bg-amber-500 text-gray-950 border-amber-400 font-black shadow-lg scale-105';
              }

              return (
                <button
                  key={num}
                  onClick={() => handleSelectBet(String(num))}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-0.5 transition cursor-pointer ${btnBg}`}
                >
                  <span className="text-lg font-black font-mono">{num}</span>
                  <div className="flex items-center gap-1">
                    {num === 0 ? (
                      <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-rose-500 to-purple-500" />
                    ) : num === 5 ? (
                      <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-purple-500" />
                    ) : [1, 3, 7, 9].includes(num) ? (
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    ) : (
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Big / Small Binary Selection */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleSelectBet('Big')}
            className={`py-3 px-4 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
              selectedBet === 'Big'
                ? 'bg-amber-500 text-gray-950 border-amber-400 font-black shadow-lg scale-105'
                : 'bg-gray-950 border-gray-800 text-white hover:border-gray-700'
            }`}
          >
            <div className="text-left">
              <span className="text-sm font-black block">BIG (5–9)</span>
              <span className="text-[10px] text-gray-400">High Tier Numbers</span>
            </div>
            <span className="text-sm font-mono font-bold">1.96x</span>
          </button>

          <button
            onClick={() => handleSelectBet('Small')}
            className={`py-3 px-4 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
              selectedBet === 'Small'
                ? 'bg-blue-600 text-white border-blue-400 font-black shadow-lg scale-105'
                : 'bg-gray-950 border-gray-800 text-white hover:border-gray-700'
            }`}
          >
            <div className="text-left">
              <span className="text-sm font-black block">SMALL (0–4)</span>
              <span className="text-[10px] text-gray-400">Low Tier Numbers</span>
            </div>
            <span className="text-sm font-mono font-bold">1.96x</span>
          </button>
        </div>

        {/* Stake Configuration Area */}
        <div className="bg-gray-950 border border-gray-800 rounded-2xl p-3.5 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400 font-bold">Stake Chip:</span>
            <span className="text-amber-400 font-mono font-bold">₹{betAmount}</span>
          </div>

          <div className="grid grid-cols-6 gap-1.5">
            {chips.map(c => (
              <button
                key={c}
                onClick={() => {
                  triggerHaptic('light');
                  playChipSound();
                  setBetAmount(c);
                }}
                className={`py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                  betAmount === c
                    ? 'bg-emerald-500 text-gray-950 shadow-md font-black'
                    : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                ₹{c}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-900">
            <span className="text-gray-400 font-bold">Multiplier:</span>
            <div className="flex items-center gap-1.5">
              {multipliers.map(m => (
                <button
                  key={m}
                  onClick={() => {
                    triggerHaptic('light');
                    setBetMultiplier(m);
                  }}
                  className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                    betMultiplier === m
                      ? 'bg-emerald-500 text-gray-950'
                      : 'bg-gray-900 text-gray-400 border border-gray-800'
                  }`}
                >
                  {m}X
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-800 gap-3">
            <div className="space-y-0.5">
              <div className="text-[10px] text-gray-400">Total Wager:</div>
              <div className="text-lg font-black font-mono text-emerald-400">
                ₹{totalCost.toLocaleString()}
              </div>
            </div>

            <button
              onClick={handleConfirmBet}
              disabled={trxIsLocked || !selectedBet}
              className={`flex-1 py-3 px-4 rounded-xl font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer ${
                trxIsLocked || !selectedBet
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-gray-950 shadow-emerald-500/20'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{trxIsLocked ? 'LOCKED' : selectedBet ? `CONFIRM TRX BET (${selectedBet})` : 'SELECT OUTCOME'}</span>
            </button>
          </div>

          {feedback && (
            <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
              feedback.success ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300' : 'bg-red-950/60 border border-red-500/40 text-red-300'
            }`}>
              {feedback.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{feedback.message}</span>
            </div>
          )}
        </div>

        {/* History Table */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>TRX Cryptographic Draw Record</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">Verified On-Chain</span>
          </div>

          <div className="bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden divide-y divide-gray-900 text-xs">
            <div className="grid grid-cols-4 p-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-gray-900/50">
              <span>Period</span>
              <span>Block</span>
              <span className="text-center">Hash Result</span>
              <span className="text-right">Big/Small</span>
            </div>

            {trxHistory.slice(0, 10).map((item, idx) => (
              <div key={idx} className="grid grid-cols-4 p-2.5 items-center hover:bg-gray-900/30 transition">
                <span className="font-mono text-gray-400 text-[11px]">#{item.periodId.slice(-6)}</span>
                <span className="font-mono text-gray-500 text-[10px]">#{item.blockNumber}</span>
                <div className="flex items-center justify-center gap-1">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[11px] font-bold font-mono ${
                    item.lastDigit === 0 ? 'bg-gradient-to-r from-rose-600 to-purple-600' :
                    item.lastDigit === 5 ? 'bg-gradient-to-r from-emerald-600 to-purple-600' :
                    [1, 3, 7, 9].includes(item.lastDigit) ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}>
                    {item.lastDigit}
                  </span>
                  <span className="font-mono text-gray-400 text-[10px]">...{item.blockHash.slice(-4)}</span>
                </div>
                <div className="text-right">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                    item.size === 'Big' ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300'
                  }`}>
                    {item.size}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
