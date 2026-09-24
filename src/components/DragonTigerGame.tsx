import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useContinuousGame } from '../context/ContinuousGameContext';
import { SecurityEngineBanner } from './SecurityEngineBanner';
import { 
  Swords, 
  Clock, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  AlertCircle, 
  Crown, 
  Flame, 
  ShieldCheck,
  Lock,
  Zap
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { playChipSound, playClickSound, playBetPlacedSound, isSoundEnabled, setSoundEnabled } from '../utils/audio';

interface DragonTigerGameProps {
  onOpenWallet: () => void;
  onOpenAuth: () => void;
  onOpenAdminHub?: () => void;
}

const PlayingCard: React.FC<{ card: { suit: string; rank: number; label?: string; color?: string } | null; title: string; color: string }> = ({ card, title, color }) => {
  const isRedSuit = card && (card.suit === '♥' || card.suit === '♦' || card.color === 'red');
  const displayRank = card ? (card.label || String(card.rank)) : '';

  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className={`text-xs font-black uppercase tracking-wider ${color}`}>{title}</span>
      <div className="w-20 h-28 rounded-2xl bg-gradient-to-b from-white to-gray-200 border-2 border-amber-400 shadow-xl flex flex-col justify-between p-2 select-none relative overflow-hidden">
        {card ? (
          <>
            <div className={`text-left text-sm font-black font-mono leading-none ${isRedSuit ? 'text-red-600' : 'text-gray-900'}`}>
              <div>{displayRank}</div>
              <div className="text-base">{card.suit}</div>
            </div>

            <div className={`text-3xl self-center font-bold ${isRedSuit ? 'text-red-600' : 'text-gray-900'}`}>
              {card.suit}
            </div>

            <div className={`text-right text-sm font-black font-mono leading-none transform rotate-180 ${isRedSuit ? 'text-red-600' : 'text-gray-900'}`}>
              <div>{displayRank}</div>
              <div className="text-base">{card.suit}</div>
            </div>
          </>
        ) : (
          <div className="w-full h-full rounded-xl bg-gradient-to-br from-red-900 via-amber-900 to-black flex items-center justify-center border border-amber-500/30">
            <Swords className="w-6 h-6 text-amber-400/50" />
          </div>
        )}
      </div>
    </div>
  );
};

export const DragonTigerGame: React.FC<DragonTigerGameProps> = ({ onOpenWallet, onOpenAuth, onOpenAdminHub }) => {
  const { user, profile, isAdmin } = useAuth();
  const {
    dtTimeLeft,
    dtCurrentRoundId,
    dtHistory,
    dtRevealedResult,
    dtUpcomingResult,
    placeDtBet,
    continuousEngineUptimeSec,
    lastPurgeTime
  } = useContinuousGame();

  const [selectedBet, setSelectedBet] = useState<'dragon' | 'tiger' | 'tie' | null>(null);
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
  const totalCost = betAmount * betMultiplier;
  const isLocked = dtTimeLeft <= 4;

  const handleSelectBet = (sel: 'dragon' | 'tiger' | 'tie') => {
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
      setFeedback({ success: false, message: 'Please select Dragon, Tiger, or Tie.' });
      return;
    }
    if (profile.balance < totalCost) {
      setFeedback({ success: false, message: 'Insufficient balance. Please recharge wallet.' });
      return;
    }

    const res = await placeDtBet(selectedBet, totalCost);
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

  const latest = dtHistory[0];

  return (
    <div className="space-y-4">
      <SecurityEngineBanner
        gameName="Dragon Tiger Live Continuous"
        oneHourRecordCount={dtHistory.length}
        totalPurgedCount={0}
        lastPurgeTime={lastPurgeTime}
        uptimeSec={continuousEngineUptimeSec}
      />

      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-4 shadow-2xl space-y-4 text-white">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-2 border-b border-gray-800/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-600 flex items-center justify-center text-white shadow-md shadow-rose-500/30">
              <Swords className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-wide text-white flex items-center gap-1.5">
                <span>Dragon Tiger VIP</span>
                <span className="px-1.5 py-0.2 bg-rose-600/30 text-rose-300 font-extrabold text-[9px] rounded-full uppercase border border-rose-500/40">
                  18s FAST ROUND
                </span>
              </h2>
              <div className="text-[10px] text-gray-400">High-card live table game • Highest single card wins</div>
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

        {/* Live Table Felt Canvas */}
        <div className="bg-gradient-to-b from-emerald-950 via-green-950 to-black border-2 border-emerald-700/50 rounded-3xl p-5 shadow-2xl relative overflow-hidden space-y-4">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/40">
                Round #{dtCurrentRoundId}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold text-gray-300">Dealing in:</span>
              <span className={`text-lg font-black font-mono ${isLocked ? 'text-red-500 animate-pulse' : 'text-amber-400'}`}>
                {dtTimeLeft}s
              </span>
            </div>
          </div>

          {/* Cards Duel Area */}
          <div className="flex items-center justify-center gap-6 sm:gap-12 py-2">
            <PlayingCard
              title="Dragon"
              color="text-red-500"
              card={latest?.dragonCard || null}
            />

            <div className="flex flex-col items-center justify-center gap-1">
              <div className="w-10 h-10 rounded-full bg-black/60 border border-amber-500/40 flex items-center justify-center shadow-lg">
                <span className="text-sm font-black font-mono text-amber-400">VS</span>
              </div>
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                {isLocked ? 'DEALING...' : 'PLACE BET'}
              </span>
            </div>

            <PlayingCard
              title="Tiger"
              color="text-amber-400"
              card={latest?.tigerCard || null}
            />
          </div>

          {/* Last Winner Banner */}
          {latest && (
            <div className="text-center pt-1 border-t border-emerald-800/40">
              <span className="text-[11px] text-gray-300">
                Last Winner: <strong className="text-amber-400 uppercase font-black">{latest.winner}</strong> ({latest.dragonCard.rank} vs {latest.tigerCard.rank})
              </span>
            </div>
          )}
        </div>

        {/* Super Admin Pre-Session Outcome Peek */}
        {isAdmin && dtUpcomingResult && (
          <div className="bg-gradient-to-r from-gray-950 via-rose-950/40 to-gray-950 border border-rose-500/50 rounded-2xl p-3 shadow-lg flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-400" />
                <span className="text-[11px] font-black text-amber-300 uppercase tracking-wide">
                  Admin Pre-Session Duel Peek
                </span>
                <span className="text-[10px] text-gray-400 font-mono">#{dtUpcomingResult.roundId}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400">Deal in {dtTimeLeft}s</span>
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
                <span className="text-[10px] text-gray-400">Upcoming Winner:</span>
                <span className="px-2 py-0.5 rounded bg-amber-500 text-gray-950 font-black text-xs uppercase font-mono">
                  {dtUpcomingResult.winner}
                </span>
                <span className="text-[10px] font-bold text-gray-400 font-mono">
                  (D: {dtUpcomingResult.dragonCard.rank}{dtUpcomingResult.dragonCard.suit} vs T: {dtUpcomingResult.tigerCard.rank}{dtUpcomingResult.tigerCard.suit})
                </span>
              </div>
              <div className="text-[9px] font-mono">
                {dtUpcomingResult.isOverridden ? (
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

        {/* 3 Main Betting Zones */}
        <div className="grid grid-cols-3 gap-2.5">
          <button
            onClick={() => handleSelectBet('dragon')}
            disabled={isLocked}
            className={`py-4 px-2 rounded-2xl border transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
              selectedBet === 'dragon'
                ? 'bg-gradient-to-b from-red-600 to-rose-700 text-white font-black border-white shadow-xl scale-105'
                : 'bg-red-950/40 border-red-500/40 text-red-300 hover:bg-red-900/50'
            }`}
          >
            <span className="text-base font-black uppercase">DRAGON</span>
            <span className="text-xs font-mono font-bold text-amber-400">2.00x Payout</span>
          </button>

          <button
            onClick={() => handleSelectBet('tie')}
            disabled={isLocked}
            className={`py-4 px-2 rounded-2xl border transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
              selectedBet === 'tie'
                ? 'bg-gradient-to-b from-emerald-600 to-teal-700 text-white font-black border-white shadow-xl scale-105'
                : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50'
            }`}
          >
            <span className="text-base font-black uppercase">TIE</span>
            <span className="text-xs font-mono font-bold text-amber-400">9.00x Payout</span>
          </button>

          <button
            onClick={() => handleSelectBet('tiger')}
            disabled={isLocked}
            className={`py-4 px-2 rounded-2xl border transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
              selectedBet === 'tiger'
                ? 'bg-gradient-to-b from-amber-600 to-yellow-700 text-white font-black border-white shadow-xl scale-105'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-300 hover:bg-amber-900/50'
            }`}
          >
            <span className="text-base font-black uppercase">TIGER</span>
            <span className="text-xs font-mono font-bold text-amber-400">2.00x Payout</span>
          </button>
        </div>

        {/* Stake Controls */}
        <div className="bg-gray-950 border border-gray-800 rounded-2xl p-3.5 space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-bold">Select Stake Chip:</span>
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
                    ? 'bg-amber-500 text-gray-950 shadow-md font-black'
                    : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                ₹{c}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-800 gap-3">
            <div className="space-y-0.5">
              <div className="text-[10px] text-gray-400">Total Wager:</div>
              <div className="text-lg font-black font-mono text-amber-400">
                ₹{totalCost.toLocaleString()}
              </div>
            </div>

            <button
              onClick={handleConfirmBet}
              disabled={isLocked || !selectedBet}
              className={`flex-1 py-3 px-4 rounded-xl font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer ${
                isLocked || !selectedBet
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 shadow-amber-500/20'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isLocked ? 'CARDS DEALING...' : selectedBet ? `CONFIRM BET (${selectedBet.toUpperCase()})` : 'CHOOSE WINNER'}</span>
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

        {/* Road Map / History Beads */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Road Map Trend (Recent 20)</span>
            </span>
            <div className="flex items-center gap-2 text-[10px] font-bold">
              <span className="text-red-400">● Dragon</span>
              <span className="text-amber-400">● Tiger</span>
              <span className="text-emerald-400">● Tie</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto p-2 bg-gray-950 rounded-2xl border border-gray-800 scrollbar-none">
            {dtHistory.slice(0, 20).map((h, i) => (
              <div
                key={i}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 shadow-md ${
                  h.winner === 'dragon' ? 'bg-red-600 text-white' :
                  h.winner === 'tiger' ? 'bg-amber-500 text-gray-950' : 'bg-emerald-600 text-white'
                }`}
                title={`Round #${h.roundId}: ${h.winner.toUpperCase()} (${h.dragonCard.rank} vs ${h.tigerCard.rank})`}
              >
                {h.winner === 'dragon' ? 'D' : h.winner === 'tiger' ? 'T' : 'Tie'}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
