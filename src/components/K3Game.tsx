import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useContinuousGame } from '../context/ContinuousGameContext';
import { SecurityEngineBanner } from './SecurityEngineBanner';
import { K3_SUM_MULTIPLIERS } from '../k3Logic';
import { 
  Dices, 
  Clock, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  AlertCircle, 
  Crown,
  ChevronRight,
  ShieldCheck,
  Flame,
  Sparkles,
  Lock
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { playChipSound, playClickSound, playBetPlacedSound, isSoundEnabled, setSoundEnabled } from '../utils/audio';

interface K3GameProps {
  onOpenWallet: () => void;
  onOpenAuth: () => void;
  onOpenAdminHub?: () => void;
}

// 3D-styled SVG die face renderer
const DieFace: React.FC<{ value: number; size?: 'sm' | 'md' | 'lg'; rolling?: boolean }> = ({ value, size = 'md', rolling = false }) => {
  const dim = size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-14 h-14' : 'w-10 h-10';
  const dotDim = size === 'sm' ? 'w-1 h-1' : size === 'lg' ? 'w-2.5 h-2.5' : 'w-1.5 h-1.5';

  const dotPositions: Record<number, string[]> = {
    1: ['col-start-2 row-start-2'],
    2: ['col-start-1 row-start-1', 'col-start-3 row-start-3'],
    3: ['col-start-1 row-start-1', 'col-start-2 row-start-2', 'col-start-3 row-start-3'],
    4: ['col-start-1 row-start-1', 'col-start-3 row-start-1', 'col-start-1 row-start-3', 'col-start-3 row-start-3'],
    5: ['col-start-1 row-start-1', 'col-start-3 row-start-1', 'col-start-2 row-start-2', 'col-start-1 row-start-3', 'col-start-3 row-start-3'],
    6: ['col-start-1 row-start-1', 'col-start-3 row-start-1', 'col-start-1 row-start-2', 'col-start-3 row-start-2', 'col-start-1 row-start-3', 'col-start-3 row-start-3']
  };

  const safeVal = Math.min(6, Math.max(1, value || 1));
  const activeDots = dotPositions[safeVal] || dotPositions[1];

  return (
    <div className={`${dim} rounded-xl bg-gradient-to-br from-red-500 via-red-600 to-red-700 p-1.5 shadow-lg shadow-red-900/50 border border-red-400/40 grid grid-cols-3 grid-rows-3 items-center justify-items-center ${rolling ? 'animate-bounce' : ''}`}>
      {activeDots.map((pos, idx) => (
        <div key={idx} className={`${pos} ${dotDim} rounded-full bg-white shadow-sm`} />
      ))}
    </div>
  );
};

export const K3Game: React.FC<K3GameProps> = ({ onOpenWallet, onOpenAuth, onOpenAdminHub }) => {
  const { user, profile, isAdmin } = useAuth();
  const {
    k3TimeLeft,
    k3CurrentPeriod,
    k3IsLocked,
    k3History,
    k3RevealedResult,
    k3IsRevealing,
    k3UpcomingResult,
    placeK3Bet,
    continuousEngineUptimeSec,
    lastPurgeTime
  } = useContinuousGame();

  const [activeTab, setActiveTab] = useState<'sum' | 'bigsmall' | 'pairs' | 'triples'>('sum');
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
      setFeedback({ success: false, message: 'Please select a betting outcome first.' });
      return;
    }
    if (profile.balance < totalCost) {
      setFeedback({ success: false, message: 'Insufficient balance. Please recharge wallet.' });
      return;
    }

    const res = await placeK3Bet(selectedBet, totalCost);
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

  const latestPeriod = k3History[0];

  return (
    <div className="space-y-4">
      {/* Retention and security banner */}
      <SecurityEngineBanner
        gameName="K3 Lotre 3-Dice Continuous"
        oneHourRecordCount={k3History.length}
        totalPurgedCount={0}
        lastPurgeTime={lastPurgeTime}
        uptimeSec={continuousEngineUptimeSec}
      />

      {/* Main Game Card */}
      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-4 shadow-2xl space-y-4 text-white">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-2 border-b border-gray-800/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center text-white shadow-md shadow-amber-500/30">
              <Dices className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-wide text-white flex items-center gap-1.5">
                <span>K3 Lotre 3-Dice</span>
                <span className="px-1.5 py-0.2 bg-amber-500/30 text-amber-300 font-extrabold text-[9px] rounded-full uppercase border border-amber-500/40">
                  216x MAX
                </span>
              </h2>
              <div className="text-[10px] text-gray-400">Deterministic 60s dice sum &amp; triple lottery</div>
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

        {/* Dice Arena & Timer Banner */}
        <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-black border border-gray-800 rounded-2xl p-4 shadow-inner relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-gray-400">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Period #{k3CurrentPeriod.slice(-7)}</span>
            </div>
            <div className="text-xs text-gray-500">Last Roll Result:</div>
            {latestPeriod ? (
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                <div className="flex items-center gap-1.5">
                  <DieFace value={latestPeriod.dice[0]} size="sm" />
                  <DieFace value={latestPeriod.dice[1]} size="sm" />
                  <DieFace value={latestPeriod.dice[2]} size="sm" />
                </div>
                <span className="text-sm font-black font-mono text-amber-400">
                  = {latestPeriod.total}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  latestPeriod.size === 'Big' ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300'
                }`}>
                  {latestPeriod.size}
                </span>
                {latestPeriod.isTriple && (
                  <span className="px-1.5 py-0.5 rounded bg-red-600/30 text-red-300 text-[9px] font-black border border-red-500/40">
                    TRIPLE!
                  </span>
                )}
              </div>
            ) : (
              <div className="text-xs text-gray-500">Syncing recent draws...</div>
            )}
          </div>

          {/* Rolling / Reveal Display */}
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center gap-3">
              <DieFace 
                value={k3IsRevealing && k3RevealedResult ? k3RevealedResult.dice[0] : (latestPeriod?.dice[0] || 3)} 
                size="lg" 
                rolling={k3IsRevealing || k3IsLocked} 
              />
              <DieFace 
                value={k3IsRevealing && k3RevealedResult ? k3RevealedResult.dice[1] : (latestPeriod?.dice[1] || 4)} 
                size="lg" 
                rolling={k3IsRevealing || k3IsLocked} 
              />
              <DieFace 
                value={k3IsRevealing && k3RevealedResult ? k3RevealedResult.dice[2] : (latestPeriod?.dice[2] || 5)} 
                size="lg" 
                rolling={k3IsRevealing || k3IsLocked} 
              />
            </div>
            {k3IsLocked && (
              <span className="mt-1 text-[10px] font-mono text-amber-400 animate-pulse flex items-center gap-1">
                <Lock className="w-3 h-3" /> ROLLING DICE...
              </span>
            )}
          </div>

          {/* Countdown Clock */}
          <div className="text-center sm:text-right shrink-0">
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Draw Closes In</div>
            <div className={`text-4xl font-black font-mono tracking-tight ${
              k3TimeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-amber-400'
            }`}>
              {String(Math.floor(k3TimeLeft / 60)).padStart(2, '0')}:{String(k3TimeLeft % 60).padStart(2, '0')}
            </div>
            {k3IsLocked ? (
              <span className="inline-block mt-1 px-2 py-0.5 bg-red-600/20 text-red-400 text-[10px] font-bold rounded-full border border-red-500/30">
                LOCKED (5s)
              </span>
            ) : (
              <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/30">
                OPEN FOR BETS
              </span>
            )}
          </div>
        </div>

        {/* Super Admin Pre-Session Outcome Peek */}
        {isAdmin && k3UpcomingResult && (
          <div className="bg-gradient-to-r from-gray-950 via-amber-950/40 to-gray-950 border border-amber-500/50 rounded-2xl p-3 shadow-lg flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-400" />
                <span className="text-[11px] font-black text-amber-300 uppercase tracking-wide">
                  Admin Pre-Session Dice Peek
                </span>
                <span className="text-[10px] text-gray-400 font-mono">#{k3UpcomingResult.periodId}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400">Roll in {k3TimeLeft}s</span>
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
                <span className="text-[10px] text-gray-400">Drawn Dice:</span>
                <div className="flex items-center gap-1">
                  <DieFace value={k3UpcomingResult.dice[0]} size="sm" />
                  <DieFace value={k3UpcomingResult.dice[1]} size="sm" />
                  <DieFace value={k3UpcomingResult.dice[2]} size="sm" />
                </div>
                <span className="text-[11px] font-black text-amber-400 font-mono">
                  Sum: {k3UpcomingResult.total} ({k3UpcomingResult.size}, {k3UpcomingResult.parity})
                </span>
              </div>
              <div className="text-[9px] font-mono">
                {k3UpcomingResult.isOverridden ? (
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

        {/* Tab Navigation for Bet Types */}
        <div className="grid grid-cols-4 gap-1.5 bg-gray-950 p-1.5 rounded-2xl border border-gray-800">
          {[
            { id: 'sum', label: 'Total Sum', sub: '3-18 (200x)' },
            { id: 'bigsmall', label: 'Big / Small', sub: '1.96x' },
            { id: 'pairs', label: '2 Matching', sub: '13.8x' },
            { id: 'triples', label: '3 Matching', sub: '216x' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                triggerHaptic('light');
                playClickSound();
                setActiveTab(tab.id as any);
              }}
              className={`py-2 px-1 rounded-xl text-center transition flex flex-col items-center justify-center cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-gray-950 font-black shadow-md shadow-amber-500/20'
                  : 'text-gray-400 hover:text-white bg-gray-900/50'
              }`}
            >
              <span className="text-xs font-bold leading-tight">{tab.label}</span>
              <span className={`text-[9px] font-mono ${activeTab === tab.id ? 'text-gray-950/80 font-bold' : 'text-gray-500'}`}>
                {tab.sub}
              </span>
            </button>
          ))}
        </div>

        {/* Bet Selection Grid */}
        <div className="space-y-3">
          {/* Tab 1: Total Sum (3 to 18) */}
          {activeTab === 'sum' && (
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {Object.entries(K3_SUM_MULTIPLIERS).map(([sumStr, mult]) => {
                const sumNum = parseInt(sumStr, 10);
                const isSelected = selectedBet === `Sum_${sumNum}`;
                return (
                  <button
                    key={sumNum}
                    onClick={() => handleSelectBet(`Sum_${sumNum}`)}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-gray-950 border-amber-400 font-black shadow-lg shadow-amber-500/20 scale-105'
                        : 'bg-gray-950 border-gray-800 text-white hover:border-gray-700'
                    }`}
                  >
                    <span className="text-base font-black font-mono">{sumNum}</span>
                    <span className={`text-[10px] font-mono ${isSelected ? 'text-gray-950 font-extrabold' : 'text-amber-400'}`}>
                      {mult}x
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Tab 2: Big / Small / Odd / Even */}
          {activeTab === 'bigsmall' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'Big', label: 'Big (11–18)', mult: '1.96x', desc: 'Sum 11 to 18 (Excl. Triples)', color: 'from-amber-600 to-amber-700' },
                { id: 'Small', label: 'Small (3–10)', mult: '1.96x', desc: 'Sum 3 to 10 (Excl. Triples)', color: 'from-blue-600 to-blue-700' },
                { id: 'Odd', label: 'Odd', mult: '1.96x', desc: 'Odd Sum (3, 5, 7, 9, 11...)', color: 'from-purple-600 to-purple-700' },
                { id: 'Even', label: 'Even', mult: '1.96x', desc: 'Even Sum (4, 6, 8, 10...)', color: 'from-emerald-600 to-emerald-700' }
              ].map(opt => {
                const isSelected = selectedBet === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectBet(opt.id)}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-tr ' + opt.color + ' border-white text-white font-black shadow-lg scale-105'
                        : 'bg-gray-950 border-gray-800 text-gray-200 hover:border-gray-700'
                    }`}
                  >
                    <span className="text-sm font-black">{opt.label}</span>
                    <span className="text-xs text-amber-400 font-mono font-bold">{opt.mult}</span>
                    <span className="text-[10px] text-gray-400 text-center leading-tight">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Tab 3: 2 Matching (Pairs) */}
          {activeTab === 'pairs' && (
            <div className="space-y-2">
              <div className="text-[11px] text-gray-400">At least 2 dice match the chosen pair (Payout: 13.8x)</div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[1, 2, 3, 4, 5, 6].map(num => {
                  const betId = `Double_${num}`;
                  const isSelected = selectedBet === betId;
                  return (
                    <button
                      key={num}
                      onClick={() => handleSelectBet(betId)}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500 text-gray-950 border-amber-400 font-black shadow-lg scale-105'
                          : 'bg-gray-950 border-gray-800 text-white hover:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <DieFace value={num} size="sm" />
                        <DieFace value={num} size="sm" />
                      </div>
                      <span className="text-xs font-mono font-bold">Pair {num}{num}</span>
                      <span className={`text-[10px] font-mono ${isSelected ? 'text-gray-950 font-bold' : 'text-amber-400'}`}>13.8x</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 4: 3 Matching (Triples) */}
          {activeTab === 'triples' && (
            <div className="space-y-2">
              <div className="text-[11px] text-gray-400">Any triple awards 30x. Matching specific triples awards massive 216x!</div>
              <button
                onClick={() => handleSelectBet('Triple_Any')}
                className={`w-full p-3 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                  selectedBet === 'Triple_Any'
                    ? 'bg-amber-500 text-gray-950 border-amber-400 font-black shadow-lg scale-[1.02]'
                    : 'bg-gray-950 border-gray-800 text-white hover:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-black">ANY TRIPLE (111, 222, 333, 444, 555, 666)</span>
                </div>
                <span className="text-sm font-mono font-black text-amber-400">30.0x</span>
              </button>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[1, 2, 3, 4, 5, 6].map(num => {
                  const betId = `Triple_${num}`;
                  const isSelected = selectedBet === betId;
                  return (
                    <button
                      key={num}
                      onClick={() => handleSelectBet(betId)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                        isSelected
                          ? 'bg-red-600 text-white border-red-400 font-black shadow-lg scale-105'
                          : 'bg-gray-950 border-gray-800 text-white hover:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-0.5">
                        <DieFace value={num} size="sm" />
                        <DieFace value={num} size="sm" />
                        <DieFace value={num} size="sm" />
                      </div>
                      <span className="text-xs font-mono font-black">{num}{num}{num}</span>
                      <span className="text-[10px] font-mono text-amber-400 font-extrabold">216x</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Stake Configuration Area */}
        <div className="bg-gray-950 border border-gray-800 rounded-2xl p-3.5 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400 font-bold">Select Stake Chip:</span>
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
                      ? 'bg-amber-500 text-gray-950'
                      : 'bg-gray-900 text-gray-400 border border-gray-800'
                  }`}
                >
                  {m}X
                </button>
              ))}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-800 gap-3">
            <div className="space-y-0.5">
              <div className="text-[10px] text-gray-400">Total Wager:</div>
              <div className="text-lg font-black font-mono text-amber-400">
                ₹{totalCost.toLocaleString()}
              </div>
            </div>

            <button
              onClick={handleConfirmBet}
              disabled={k3IsLocked || !selectedBet}
              className={`flex-1 py-3 px-4 rounded-xl font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer ${
                k3IsLocked || !selectedBet
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 shadow-amber-500/20'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{k3IsLocked ? 'LOCKED' : selectedBet ? `CONFIRM BET (${selectedBet.replace('_', ' ')})` : 'CHOOSE OUTCOME'}</span>
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

        {/* Recent History Table */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Recent K3 Draw Results</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Provably Fair
            </span>
          </div>

          <div className="bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden divide-y divide-gray-900 text-xs">
            <div className="grid grid-cols-5 p-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-gray-900/50">
              <span>Period</span>
              <span className="col-span-2 text-center">Dice Roll</span>
              <span className="text-center">Total</span>
              <span className="text-right">Big/Small</span>
            </div>

            {k3History.slice(0, 10).map((item, idx) => (
              <div key={idx} className="grid grid-cols-5 p-2.5 items-center hover:bg-gray-900/30 transition">
                <span className="font-mono text-gray-400 text-[11px]">#{item.periodId.slice(-6)}</span>
                <div className="col-span-2 flex items-center justify-center gap-1">
                  <DieFace value={item.dice[0]} size="sm" />
                  <DieFace value={item.dice[1]} size="sm" />
                  <DieFace value={item.dice[2]} size="sm" />
                </div>
                <span className="text-center font-black font-mono text-amber-400 text-sm">
                  {item.total}
                </span>
                <div className="text-right flex items-center justify-end gap-1">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                    item.size === 'Big' ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300'
                  }`}>
                    {item.size}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                    item.parity === 'Odd' ? 'bg-purple-500/20 text-purple-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {item.parity}
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
