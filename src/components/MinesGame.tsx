import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Bomb, 
  Gem, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  RotateCcw,
  Zap,
  Flame,
  ShieldCheck
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { playChipSound, playCashoutSound, playCrashSound, playTakeoffSound, isSoundEnabled, setSoundEnabled } from '../utils/audio';

interface MinesGameProps {
  onOpenWallet: () => void;
  onOpenAuth: () => void;
}

interface TileState {
  revealed: boolean;
  isMine: boolean;
}

export const MinesGame: React.FC<MinesGameProps> = ({ onOpenWallet, onOpenAuth }) => {
  const { user, profile, placeBet, settleBet } = useAuth();

  const [minesCount, setMinesCount] = useState<number>(3);
  const [betAmount, setBetAmount] = useState<number>(50);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'cashed' | 'exploded'>('idle');
  const [grid, setGrid] = useState<TileState[]>(() => Array(25).fill({ revealed: false, isMine: false }));
  const [activeBetId, setActiveBetId] = useState<string | null>(null);
  const [gemsFound, setGemsFound] = useState<number>(0);
  const [soundOn, setSoundOn] = useState<boolean>(() => isSoundEnabled());
  const [lastWin, setLastWin] = useState<number | null>(null);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    triggerHaptic('light');
  };

  // Multiplier math formula based on total diamonds revealed
  const calculateMultiplier = (mines: number, diamonds: number): number => {
    if (diamonds <= 0) return 1.00;
    let mult = 1.0;
    const totalTiles = 25;
    const safeTiles = totalTiles - mines;
    for (let i = 0; i < diamonds; i++) {
      mult *= (totalTiles - i) / (safeTiles - i);
    }
    // Apply 97% Return-to-Player standard
    return Number((mult * 0.97).toFixed(2));
  };

  const currentMultiplier = calculateMultiplier(minesCount, gemsFound);
  const nextMultiplier = calculateMultiplier(minesCount, gemsFound + 1);
  const currentCashoutAmount = Number((betAmount * (1 - 0.03) * currentMultiplier).toFixed(2));

  const handleStartGame = async () => {
    if (!user || !profile) {
      onOpenAuth();
      return;
    }
    if (profile.balance < betAmount) {
      triggerHaptic('error');
      return;
    }

    const res = await placeBet({
      gameType: 'mines',
      periodId: `MINES-${Date.now()}`,
      selection: `${minesCount} Mines Arcade`,
      amount: betAmount,
      multiplier: 1
    });

    if (res.success && res.betId) {
      triggerHaptic('medium');
      playTakeoffSound();

      // Generate 25 tiles with random mine placements
      const newGrid: TileState[] = Array(25).fill(null).map(() => ({ revealed: false, isMine: false }));
      const indices = Array.from({ length: 25 }, (_, i) => i);
      // Fisher-Yates shuffle
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      for (let m = 0; m < minesCount; m++) {
        newGrid[indices[m]].isMine = true;
      }

      setGrid(newGrid);
      setActiveBetId(res.betId);
      setGemsFound(0);
      setGameState('playing');
      setLastWin(null);
    }
  };

  const handleTileClick = async (idx: number) => {
    if (gameState !== 'playing' || grid[idx].revealed) return;

    triggerHaptic('selection');

    const clickedTile = grid[idx];
    if (clickedTile.isMine) {
      // Hit a mine! Boom!
      triggerHaptic('error');
      playCrashSound();

      // Reveal all tiles
      const revealedAll = grid.map(t => ({ ...t, revealed: true }));
      setGrid(revealedAll);
      setGameState('exploded');

      if (activeBetId) {
        await settleBet(activeBetId, false, 0, 0);
      }
    } else {
      // Uncovered safe diamond!
      triggerHaptic('success');
      playChipSound();

      const newGrid = [...grid];
      newGrid[idx] = { ...clickedTile, revealed: true };
      setGrid(newGrid);

      const nextGems = gemsFound + 1;
      setGemsFound(nextGems);

      // Check if all safe diamonds found
      if (nextGems === 25 - minesCount) {
        handleCashOut(newGrid);
      }
    }
  };

  const handleCashOut = async (finalGrid?: TileState[]) => {
    if (gameState !== 'playing' || gemsFound === 0 || !activeBetId) return;

    triggerHaptic('success');
    playCashoutSound();

    const winAmount = currentCashoutAmount;
    await settleBet(activeBetId, true, winAmount, 0);

    // Reveal rest of grid
    const targetGrid = finalGrid || grid;
    setGrid(targetGrid.map(t => ({ ...t, revealed: true })));
    setGameState('cashed');
    setLastWin(winAmount);
  };

  const handlePickRandom = () => {
    if (gameState !== 'playing') return;
    const unrevealedIndices = grid
      .map((t, idx) => (!t.revealed ? idx : -1))
      .filter(idx => idx !== -1);
    if (unrevealedIndices.length > 0) {
      const randIdx = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
      handleTileClick(randIdx);
    }
  };

  return (
    <div className="space-y-4">
      {/* Game Card */}
      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-4 shadow-2xl space-y-4 text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-gray-800/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/30">
              <Gem className="w-4 h-4 text-cyan-200" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-wide text-white flex items-center gap-1.5">
                <span>Mines VIP Arcade</span>
                <span className="px-1.5 py-0.2 bg-cyan-500/30 text-cyan-300 font-extrabold text-[9px] rounded-full uppercase border border-cyan-500/40">
                  INSTANT CASHOUT
                </span>
              </h2>
              <div className="text-[10px] text-gray-400">Uncover diamonds • Evade hidden mines • Take profit</div>
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

        {/* Multiplier / Progress Banner */}
        <div className="bg-gradient-to-r from-gray-950 via-gray-900 to-black border border-gray-800 rounded-2xl p-3 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-[10px] text-gray-400 font-bold uppercase">Current Multiplier</div>
            <div className="text-2xl font-black font-mono text-cyan-400">
              {currentMultiplier.toFixed(2)}x
            </div>
          </div>

          {gameState === 'playing' && (
            <div className="text-center">
              <div className="text-[10px] text-gray-400 font-bold uppercase">Next Tile Value</div>
              <div className="text-base font-black font-mono text-emerald-400">
                +{nextMultiplier.toFixed(2)}x
              </div>
            </div>
          )}

          <div className="text-right space-y-0.5">
            <div className="text-[10px] text-gray-400 font-bold uppercase">Gems Found</div>
            <div className="text-lg font-black font-mono text-white flex items-center justify-end gap-1">
              <Gem className="w-4 h-4 text-cyan-400" />
              <span>{gemsFound} / {25 - minesCount}</span>
            </div>
          </div>
        </div>

        {/* 5x5 Mines Grid */}
        <div className="grid grid-cols-5 gap-2 max-w-sm mx-auto p-2 bg-black/60 rounded-3xl border border-gray-800 shadow-inner">
          {grid.map((tile, idx) => {
            let tileBg = 'bg-gray-800 hover:bg-gray-700/80 border-gray-700/60 shadow-md';
            if (tile.revealed) {
              if (tile.isMine) {
                tileBg = 'bg-red-600/30 border-red-500 shadow-lg shadow-red-600/30';
              } else {
                tileBg = 'bg-gradient-to-tr from-cyan-600 to-emerald-500 border-cyan-400 shadow-lg shadow-cyan-500/30';
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleTileClick(idx)}
                disabled={gameState !== 'playing' || tile.revealed}
                className={`aspect-square rounded-2xl border transition-all flex items-center justify-center cursor-pointer active:scale-90 ${tileBg}`}
              >
                {tile.revealed ? (
                  tile.isMine ? (
                    <Bomb className="w-6 h-6 text-red-400 animate-bounce" />
                  ) : (
                    <Gem className="w-6 h-6 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                  )
                ) : (
                  <div className="w-3 h-3 rounded-full bg-gray-600/40" />
                )}
              </button>
            );
          })}
        </div>

        {/* Feedback / Round Result Overlay */}
        {gameState === 'exploded' && (
          <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-2xl text-center space-y-1">
            <div className="text-sm font-black text-red-400 flex items-center justify-center gap-1.5 uppercase">
              <Bomb className="w-4 h-4" /> Bomb Exploded!
            </div>
            <div className="text-xs text-gray-400">Better luck next round. Try adjusting mines count.</div>
          </div>
        )}

        {gameState === 'cashed' && lastWin && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl text-center space-y-1">
            <div className="text-sm font-black text-emerald-300 flex items-center justify-center gap-1.5 uppercase">
              <CheckCircle2 className="w-4 h-4" /> Cashed Out Successfully!
            </div>
            <div className="text-lg font-black font-mono text-emerald-400">
              +₹{lastWin.toLocaleString('en-IN', { minimumFractionDigits: 2 })} ({currentMultiplier.toFixed(2)}x)
            </div>
          </div>
        )}

        {/* Game Controls Panel */}
        <div className="bg-gray-950 border border-gray-800 rounded-2xl p-3.5 space-y-3">
          {gameState === 'idle' || gameState === 'cashed' || gameState === 'exploded' ? (
            <>
              {/* Mines Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="font-bold">Number of Mines:</span>
                  <span className="text-red-400 font-mono font-black">{minesCount} Hidden Bombs</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 3, 5, 10, 24].map(count => (
                    <button
                      key={count}
                      onClick={() => {
                        triggerHaptic('light');
                        setMinesCount(count);
                      }}
                      className={`py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                        minesCount === count
                          ? 'bg-red-600 text-white font-black shadow-md'
                          : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
                      }`}
                    >
                      {count} {count === 1 ? 'Mine' : 'Mines'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stake Amount Selector */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="font-bold">Stake Bet:</span>
                  <span className="text-amber-400 font-mono font-black">₹{betAmount}</span>
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                  {[20, 50, 100, 500, 1000, 5000].map(amt => (
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
              </div>

              {/* Start Button */}
              <button
                onClick={handleStartGame}
                className="w-full py-3.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm uppercase rounded-2xl shadow-lg shadow-cyan-500/25 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Gem className="w-4 h-4" />
                <span>START MINES ROUND (₹{betAmount})</span>
              </button>
            </>
          ) : (
            /* Active Game Controls */
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePickRandom}
                  className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs uppercase rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Pick Random Tile</span>
                </button>

                <button
                  onClick={() => handleCashOut()}
                  disabled={gemsFound === 0}
                  className={`flex-1 py-3 font-black text-xs uppercase rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg cursor-pointer ${
                    gemsFound === 0
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-gray-950 shadow-emerald-500/30 active:scale-95'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <span>CASHOUT ₹{currentCashoutAmount.toLocaleString()}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
