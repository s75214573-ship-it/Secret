import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Trophy, 
  Flame, 
  Plane, 
  Sparkles, 
  TrendingUp, 
  Volume2, 
  ChevronRight, 
  Play, 
  Zap, 
  Dices, 
  Coins, 
  CheckCircle2,
  Filter
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

export interface WinningRecord {
  id: string;
  user: string;
  gameId: 'wingo' | 'aviator' | 'k3' | 'trx' | 'slots';
  gameName: string;
  amount: number;
  multiplier: string;
  timeAgo: string;
  isBigWin: boolean;
  avatarColor: string;
}

interface RecentWinningMarqueeProps {
  onSelectGame: (game: 'wingo' | 'aviator' | 'k3' | 'trx' | 'slots') => void;
}

const INITIAL_WINS: WinningRecord[] = [
  {
    id: 'w1',
    user: '98***4120',
    gameId: 'wingo',
    gameName: 'Win Go 1Min',
    amount: 14850,
    multiplier: '9.0x',
    timeAgo: 'Just now',
    isBigWin: true,
    avatarColor: 'from-amber-500 to-red-500'
  },
  {
    id: 'w2',
    user: '87***9032',
    gameId: 'aviator',
    gameName: 'Aviator Cashout',
    amount: 38400,
    multiplier: '19.2x',
    timeAgo: '4s ago',
    isBigWin: true,
    avatarColor: 'from-rose-500 to-purple-600'
  },
  {
    id: 'w3',
    user: '91***5542',
    gameId: 'wingo',
    gameName: 'Win Go 3Min',
    amount: 4900,
    multiplier: '2.0x',
    timeAgo: '9s ago',
    isBigWin: false,
    avatarColor: 'from-emerald-500 to-teal-600'
  },
  {
    id: 'w4',
    user: '70***8814',
    gameId: 'trx',
    gameName: 'Trx Hash Win',
    amount: 18900,
    multiplier: '4.5x',
    timeAgo: '15s ago',
    isBigWin: true,
    avatarColor: 'from-cyan-500 to-blue-600'
  },
  {
    id: 'w5',
    user: '99***2310',
    gameId: 'k3',
    gameName: 'K3 Lotre Dice',
    amount: 8600,
    multiplier: '3.0x',
    timeAgo: '21s ago',
    isBigWin: false,
    avatarColor: 'from-amber-400 to-orange-500'
  },
  {
    id: 'w6',
    user: '88***7421',
    gameId: 'aviator',
    gameName: 'Aviator Cashout',
    amount: 52100,
    multiplier: '42.5x',
    timeAgo: '28s ago',
    isBigWin: true,
    avatarColor: 'from-fuchsia-500 to-pink-600'
  },
  {
    id: 'w7',
    user: '96***1984',
    gameId: 'slots',
    gameName: 'Super 777 Slots',
    amount: 23400,
    multiplier: '15.0x',
    timeAgo: '35s ago',
    isBigWin: true,
    avatarColor: 'from-yellow-400 to-amber-600'
  },
  {
    id: 'w8',
    user: '73***6502',
    gameId: 'wingo',
    gameName: 'Win Go 1Min',
    amount: 3200,
    multiplier: '2.0x',
    timeAgo: '42s ago',
    isBigWin: false,
    avatarColor: 'from-green-500 to-emerald-600'
  }
];

const GAME_INFO: Record<string, { label: string; icon: React.FC<{ className?: string }>; color: string }> = {
  wingo: { label: 'Win Go', icon: Flame, color: 'text-amber-400' },
  aviator: { label: 'Aviator', icon: Plane, color: 'text-red-400' },
  k3: { label: 'K3 Dice', icon: Dices, color: 'text-orange-400' },
  trx: { label: 'TRX Win', icon: Coins, color: 'text-cyan-400' },
  slots: { label: 'Slots', icon: Trophy, color: 'text-yellow-400' }
};

const PHONE_PREFIXES = ['98', '87', '91', '70', '99', '88', '96', '73', '95', '81', '79'];
const AVATAR_GRADIENTS = [
  'from-amber-500 to-red-500',
  'from-rose-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-cyan-500 to-blue-600',
  'from-yellow-400 to-amber-600',
  'from-fuchsia-500 to-pink-600'
];

export const RecentWinningMarquee: React.FC<RecentWinningMarqueeProps> = ({ onSelectGame }) => {
  const [wins, setWins] = useState<WinningRecord[]>(INITIAL_WINS);
  const [activeFilter, setActiveFilter] = useState<'all' | 'big' | 'wingo' | 'aviator'>('all');
  const [isPaused, setIsPaused] = useState(false);
  const [latestBigWin, setLatestBigWin] = useState<WinningRecord | null>(null);

  // Live win simulator: periodically appends realistic user wins to keep marquee dynamic
  useEffect(() => {
    const interval = setInterval(() => {
      const randomPrefix = PHONE_PREFIXES[Math.floor(Math.random() * PHONE_PREFIXES.length)];
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const userPhone = `${randomPrefix}***${randomSuffix}`;
      
      const gameKeys: ('wingo' | 'aviator' | 'k3' | 'trx' | 'slots')[] = [
        'wingo', 'aviator', 'wingo', 'aviator', 'k3', 'trx', 'slots'
      ];
      const selectedGame = gameKeys[Math.floor(Math.random() * gameKeys.length)];

      let amount = 0;
      let multiplier = '2.0x';
      let gameName = 'Win Go 1Min';

      if (selectedGame === 'aviator') {
        const multVal = Number((1.5 + Math.random() * 25).toFixed(1));
        const baseBet = [100, 200, 500, 1000, 2000][Math.floor(Math.random() * 5)];
        amount = Math.round(baseBet * multVal);
        multiplier = `${multVal}x`;
        gameName = `Aviator ${multVal}x Cashout`;
      } else if (selectedGame === 'wingo') {
        const isNum = Math.random() > 0.65;
        if (isNum) {
          const baseBet = [100, 300, 500, 1000, 2000][Math.floor(Math.random() * 5)];
          amount = baseBet * 9;
          multiplier = '9.0x';
          gameName = 'Win Go 1Min (Number)';
        } else {
          const baseBet = [200, 500, 1000, 2500, 5000][Math.floor(Math.random() * 5)];
          amount = Math.round(baseBet * 1.96);
          multiplier = '1.96x';
          gameName = 'Win Go 1Min (Color)';
        }
      } else if (selectedGame === 'trx') {
        const baseBet = [200, 500, 1500, 3000][Math.floor(Math.random() * 4)];
        amount = Math.round(baseBet * 4.5);
        multiplier = '4.5x';
        gameName = 'TRX Hash 1Min';
      } else if (selectedGame === 'k3') {
        const baseBet = [100, 300, 800, 2000][Math.floor(Math.random() * 4)];
        amount = Math.round(baseBet * 3.8);
        multiplier = '3.8x';
        gameName = 'K3 Dice Lotre';
      } else {
        const baseBet = [100, 250, 500, 1200][Math.floor(Math.random() * 4)];
        amount = Math.round(baseBet * 15);
        multiplier = '15.0x';
        gameName = 'Mega Slots 777';
      }

      const isBigWin = amount >= 10000;
      const newWin: WinningRecord = {
        id: `win-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        user: userPhone,
        gameId: selectedGame,
        gameName,
        amount,
        multiplier,
        timeAgo: 'Just now',
        isBigWin,
        avatarColor: AVATAR_GRADIENTS[Math.floor(Math.random() * AVATAR_GRADIENTS.length)]
      };

      setWins(prev => [newWin, ...prev.slice(0, 15)]);

      if (isBigWin) {
        setLatestBigWin(newWin);
        setTimeout(() => setLatestBigWin(null), 3500);
      }
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  // Filtered list for the detail showcase
  const filteredWins = useMemo(() => {
    if (activeFilter === 'big') return wins.filter(w => w.isBigWin);
    if (activeFilter === 'wingo') return wins.filter(w => w.gameId === 'wingo');
    if (activeFilter === 'aviator') return wins.filter(w => w.gameId === 'aviator');
    return wins;
  }, [wins, activeFilter]);

  // Duplicate items in marquee array to produce a perfectly seamless loop
  const marqueeItems = useMemo(() => [...wins, ...wins], [wins]);

  return (
    <div id="recent-winning-component" className="space-y-3">
      {/* Top Header with live active metrics */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping absolute" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 relative" />
          </div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Recent Winning</span>
            </h3>
            <span className="px-1.5 py-0.2 bg-red-600/30 border border-red-500/40 text-red-300 font-extrabold text-[9px] rounded-full uppercase">
              LIVE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-gray-400">Paid Out Today:</span>
          <span className="text-emerald-400 font-black font-mono">₹48,29,150+</span>
        </div>
      </div>

      {/* High-Impact Continuous Scrolling Marquee Ribbon */}
      <div 
        className="relative bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 border border-amber-500/30 rounded-2xl p-2.5 shadow-xl overflow-hidden group"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Soft edge fade shadows */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-gray-950 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-950 to-transparent z-10 pointer-events-none" />

        {/* Marquee Track */}
        <div className="overflow-hidden w-full">
          <div 
            className="animate-marquee-seamless flex gap-3 items-center select-none"
            style={{ animationPlayState: isPaused ? 'paused' : 'running' }}
          >
            {marqueeItems.map((item, idx) => {
              const GameIcon = GAME_INFO[item.gameId]?.icon || Flame;
              const gameColor = GAME_INFO[item.gameId]?.color || 'text-amber-400';

              return (
                <div
                  key={`${item.id}-${idx}`}
                  id={`marquee-win-item-${idx}`}
                  onClick={() => {
                    triggerHaptic('light');
                    onSelectGame(item.gameId);
                  }}
                  className="shrink-0 cursor-pointer bg-gray-950/90 hover:bg-gray-800/90 border border-gray-800 hover:border-amber-500/50 rounded-xl px-3 py-2 flex items-center gap-2.5 transition active:scale-95 shadow-md group/card"
                >
                  {/* User Initial Avatar */}
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.avatarColor} flex items-center justify-center font-black text-white text-[11px] shadow-sm shrink-0`}>
                    {item.user.slice(0, 2)}
                  </div>

                  {/* Player & Game Info */}
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-mono font-bold text-gray-200">{item.user}</span>
                      <span className="text-[9px] px-1 py-0.2 bg-amber-500/20 text-amber-300 font-extrabold rounded font-mono">
                        {item.multiplier}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                      <GameIcon className={`w-3 h-3 ${gameColor}`} />
                      <span className="truncate max-w-[95px]">{GAME_INFO[item.gameId]?.label || item.gameName}</span>
                    </div>
                  </div>

                  {/* Winning INR Badge */}
                  <div className="pl-2 border-l border-gray-800 text-right">
                    <span className="text-[9px] text-gray-500 uppercase block font-semibold leading-none">Won</span>
                    <span className="text-xs font-black font-mono text-emerald-400 tracking-tight">
                      ₹{item.amount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Quick Play Arrow on hover/touch */}
                  <div className="opacity-0 group-hover/card:opacity-100 transition text-amber-400 shrink-0">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Marquee Interactive Helper / Hint */}
        <div className="mt-1.5 pt-1 border-t border-gray-800/60 flex items-center justify-between text-[10px] text-gray-400 px-1">
          <div className="flex items-center gap-1">
            <Volume2 className="w-3 h-3 text-amber-400" />
            <span>Tap any winning card to jump into that game</span>
          </div>
          <span className="text-gray-500 font-mono">Auto-updating live</span>
        </div>
      </div>

      {/* Floating Big Win Toast notification if huge win triggers */}
      {latestBigWin && (
        <div className="animate-bounce bg-gradient-to-r from-amber-600 via-yellow-500 to-orange-600 text-gray-950 p-2.5 rounded-2xl shadow-2xl border border-yellow-300 flex items-center justify-between text-xs font-black">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-black/20 rounded-lg">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-white block text-[10px] font-bold">🎉 MEGA WIN ANNOUNCEMENT</span>
              <span>Member {latestBigWin.user} just won ₹{latestBigWin.amount.toLocaleString('en-IN')} ({latestBigWin.multiplier})!</span>
            </div>
          </div>
          <button
            onClick={() => onSelectGame(latestBigWin.gameId)}
            className="px-2.5 py-1 bg-black text-amber-300 rounded-lg text-[11px] font-bold shadow hover:bg-gray-900 shrink-0"
          >
            Play Game
          </button>
        </div>
      )}

      {/* Compact Streamlined Winner Strip */}
      <div className="bg-gray-950/70 border border-gray-800/60 rounded-xl py-1.5 px-2.5 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1 text-emerald-400 font-bold shrink-0">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase tracking-wider text-gray-400">Latest Win:</span>
          </div>
          {filteredWins[0] && (
            <div 
              onClick={() => {
                triggerHaptic('light');
                onSelectGame(filteredWins[0].gameId);
              }}
              className="flex items-center gap-1.5 cursor-pointer truncate text-gray-300 hover:text-white"
            >
              <span className="font-mono font-semibold">{filteredWins[0].user}</span>
              <span className="text-gray-500 text-[10px]">({filteredWins[0].gameName})</span>
              <span className="text-emerald-400 font-black font-mono">+₹{filteredWins[0].amount.toLocaleString('en-IN')}</span>
            </div>
          )}
        </div>

        <button
          onClick={() => {
            triggerHaptic('light');
            if (filteredWins[0]) onSelectGame(filteredWins[0].gameId);
          }}
          className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-0.5 shrink-0 ml-2"
        >
          <span>Play</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
