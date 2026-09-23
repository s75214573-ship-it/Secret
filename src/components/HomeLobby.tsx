import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Flame, 
  Sparkles, 
  Gamepad2, 
  Trophy, 
  Volume2, 
  ChevronRight, 
  Plane, 
  PlaneTakeoff,
  Layers, 
  ShieldCheck, 
  Wallet,
  Play,
  Dices,
  Coins,
  Crown,
  Zap,
  TrendingUp,
  CircleDot,
  Users,
  Award,
  BookOpen,
  Info,
  Clock,
  HelpCircle
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { RecentWinningMarquee } from './RecentWinningMarquee';
import { CategoryDefinitionModal } from './CategoryDefinitionModal';
import { GAME_CATEGORIES } from '../data/categories';
import { GameCategoryId } from '../types';

interface HomeLobbyProps {
  onSelectGame: (game: 'wingo' | 'aviator' | 'k3' | 'trx' | 'slots') => void;
  onOpenWallet: (tab?: 'deposit' | 'withdraw') => void;
  onOpenAuth: () => void;
}

export const HomeLobby: React.FC<HomeLobbyProps> = ({ onSelectGame, onOpenWallet, onOpenAuth }) => {
  const { user, profile } = useAuth();
  const [activeCategory, setActiveCategory] = useState<GameCategoryId>('lottery');
  const [categoryModalOpen, setCategoryModalOpen] = useState<boolean>(false);
  const [modalCategoryId, setModalCategoryId] = useState<GameCategoryId>('lottery');

  const activeCategoryDef = GAME_CATEGORIES.find((c) => c.id === activeCategory) || GAME_CATEGORIES[0];

  const handleOpenCategoryGuide = (catId?: GameCategoryId) => {
    triggerHaptic('light');
    setModalCategoryId(catId || activeCategory);
    setCategoryModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Top Welcome & Balance Widget */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 rounded-3xl p-4 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-400/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-between relative z-10">
          <div>
            <div className="text-[11px] text-white/80 font-medium flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-amber-300" />
              <span>WinXbet Member Wallet</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black tracking-tight mt-0.5 font-mono">
              ₹{profile ? profile.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '68.00'}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              id="lobby-deposit-btn"
              onClick={() => {
                triggerHaptic('light');
                onOpenWallet('deposit');
              }}
              className="px-3.5 py-1.5 bg-white text-gray-950 font-black rounded-xl text-xs hover:bg-gray-100 shadow-md transition active:scale-95"
            >
              Deposit
            </button>
            <button
              id="lobby-withdraw-btn"
              onClick={() => {
                triggerHaptic('light');
                onOpenWallet('withdraw');
              }}
              className="px-3.5 py-1.5 bg-black/40 text-white border border-white/30 font-bold rounded-xl text-xs hover:bg-black/60 transition active:scale-95"
            >
              Withdraw
            </button>
          </div>
        </div>

        {/* Bonus badge */}
        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-black/25 rounded-full text-[11px] font-semibold backdrop-blur-sm border border-white/10">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Daily 100% First Deposit Rebate &amp; VIP High Roller Perks</span>
        </div>
      </div>

      {/* Live Recent Winning Scrolling Ribbon & Compact Feed */}
      <RecentWinningMarquee onSelectGame={onSelectGame} />

      {/* Game Categories Bar */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-xs font-black text-gray-300">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Game Categories</span>
          </div>

          <button
            id="open-categories-definition-btn"
            onClick={() => handleOpenCategoryGuide()}
            className="flex items-center gap-1 px-2.5 py-1 bg-gray-900/80 hover:bg-gray-800 text-amber-400 hover:text-amber-300 border border-amber-500/30 rounded-xl text-[11px] font-bold transition active:scale-95"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Categories Definition Guide</span>
            <ChevronRight className="w-3 h-3 text-amber-400" />
          </button>
        </div>

        {/* Categories selector buttons */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {[
            { id: 'lottery', label: 'Lottery', icon: Flame, hot: true, desc: 'Color & Dice' },
            { id: 'original', label: 'Originals', icon: PlaneTakeoff, hot: true, desc: 'Crash & Arcade' },
            { id: 'slots', label: 'Slots', icon: Gamepad2, desc: 'Jackpot Reels' },
            { id: 'casino', label: 'Casino', icon: Crown, desc: 'Live Tables' },
            { id: 'sports', label: 'Sports', icon: Trophy, desc: 'Cricket & Odds' },
            { id: 'pvc', label: 'Card PVC', icon: Award, desc: 'Rummy & P2P' }
          ].map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                id={`cat-${cat.id}`}
                onClick={() => {
                  triggerHaptic('light');
                  setActiveCategory(cat.id as GameCategoryId);
                }}
                className={`p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 border transition relative ${
                  isActive
                    ? 'bg-gradient-to-b from-gray-800 to-gray-900 border-amber-500 text-amber-400 shadow-lg shadow-amber-500/15'
                    : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {cat.hot && (
                  <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 bg-red-600 text-white font-black text-[9px] rounded-full uppercase shadow-sm">
                    HOT
                  </span>
                )}
                <Icon className="w-5 h-5" />
                <span className="text-xs font-bold truncate max-w-full">{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Category Definition Card */}
        <div 
          id="category-definition-banner"
          className="bg-gray-950/80 border border-gray-800 hover:border-amber-500/40 rounded-2xl p-3.5 space-y-2.5 transition relative overflow-hidden"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[9px] font-black uppercase tracking-wider">
                  Category Definition
                </span>
                <span className="text-gray-400 text-[11px] font-medium">• {activeCategoryDef.title}</span>
              </div>
              <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
                <span>{activeCategoryDef.name} Category</span>
                <span className="text-emerald-400 text-xs font-bold font-mono">({activeCategoryDef.payoutRange})</span>
              </h4>
            </div>

            <button
              onClick={() => handleOpenCategoryGuide(activeCategory)}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-gray-950 rounded-xl text-[11px] font-black flex items-center gap-1 shadow-md transition active:scale-95 shrink-0"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Full Definition &amp; Rules</span>
            </button>
          </div>

          <p className="text-xs text-gray-300 leading-relaxed line-clamp-2">
            {activeCategoryDef.description}
          </p>

          {/* Key Specs Bar */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] font-medium border-t border-gray-800/80 text-gray-400">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Volatility: <strong className="text-white">{activeCategoryDef.volatility}</strong></span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-400" />
              <span>Cycle: <strong className="text-white">{activeCategoryDef.drawInterval}</strong></span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3 h-3" />
              <span className="truncate max-w-[170px] sm:max-w-none">{activeCategoryDef.provablyFairMethod}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Primary Flagship Game 1: Win Go Color Prediction (For Lottery & Originals) */}
      {(activeCategory === 'lottery') && (
        <div
          id="play-wingo-banner"
          onClick={() => {
            triggerHaptic('medium');
            onSelectGame('wingo');
          }}
          className="group relative cursor-pointer bg-gradient-to-r from-red-950 via-gray-900 to-amber-950 border border-red-500/40 hover:border-red-500 rounded-3xl p-4 shadow-xl transition active:scale-[0.99] overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-44 h-44 bg-red-600/15 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between relative z-10">
            <div className="space-y-1.5 max-w-[65%]">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-red-600 text-white font-black text-[10px] rounded-md uppercase tracking-wider shadow-sm">
                  LOTTERY FLAGSHIP
                </span>
                <span className="text-amber-400 text-xs font-bold flex items-center gap-1 font-mono">
                  <Zap className="w-3 h-3" /> 1M / 3M / 5M
                </span>
                <span className="text-[10px] text-emerald-400 font-medium hidden sm:inline">
                  • 14,280 active
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-black text-white group-hover:text-amber-400 transition flex items-center gap-2">
                <span>Win Go Color Prediction</span>
                <ChevronRight className="w-4 h-4 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>

              <p className="text-xs text-gray-400 line-clamp-2">
                Predict Green (2x), Violet (4.5x), Red (2x) or Numbers (9x). Instant 60-second transparent draw!
              </p>

              {/* Color visual dots */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                <span className="w-3.5 h-3.5 rounded-full bg-purple-500 shadow-sm shadow-purple-500/50" />
                <span className="w-3.5 h-3.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
                <span className="text-[10px] font-mono text-gray-400 ml-1">Up to 9X Return</span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-red-500/40 group-hover:scale-105 transition">
                <Flame className="w-6 h-6" />
              </div>
              <button className="px-3.5 py-1.5 bg-gradient-to-r from-red-600 to-amber-500 group-hover:from-red-500 group-hover:to-amber-400 text-white font-black text-xs rounded-xl shadow-lg flex items-center gap-1">
                <Play className="w-3 h-3 fill-current" />
                Play Win Go
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Primary Flagship Game 2: Aviator Crash Game (For Originals) */}
      {(activeCategory === 'original') && (
        <div
          id="play-aviator-banner"
          onClick={() => {
            triggerHaptic('medium');
            onSelectGame('aviator');
          }}
          className="group relative cursor-pointer bg-gradient-to-r from-gray-900 via-gray-900 to-red-950 border border-gray-800 hover:border-amber-500/60 rounded-3xl p-4 shadow-xl transition active:scale-[0.99] overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between relative z-10">
            <div className="space-y-1.5 max-w-[65%]">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-amber-500 text-gray-950 font-black text-[10px] rounded-md uppercase tracking-wider">
                  ORIGINALS #1
                </span>
                <span className="text-red-400 text-xs font-bold font-mono">
                  Up to 100x Altitude
                </span>
                <span className="text-[10px] text-emerald-400 font-medium hidden sm:inline">
                  • 3,920 in flight
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-black text-white group-hover:text-red-400 transition flex items-center gap-2">
                <span>Aviator Crashout</span>
                <ChevronRight className="w-4 h-4 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>

              <p className="text-xs text-gray-400 line-clamp-2">
                Watch the jet rocket climb into the stratosphere. Hit Cash Out before it flies away!
              </p>

              <div className="flex items-center gap-1.5 pt-1 text-[10px] font-mono text-gray-400">
                <span className="px-1.5 py-0.5 bg-gray-800 rounded text-amber-400 font-bold">Auto Cashout</span>
                <span className="px-1.5 py-0.5 bg-gray-800 rounded text-emerald-400 font-bold">Provably Fair</span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-gray-800 to-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/30 group-hover:scale-105 transition">
                <PlaneTakeoff className="w-6 h-6 text-red-400 group-hover:animate-pulse" />
              </div>
              <button className="px-3.5 py-1.5 bg-gray-800 group-hover:bg-red-600 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center gap-1">
                <Play className="w-3 h-3 fill-current" />
                Launch Flight
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Category Games Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black text-gray-400 uppercase tracking-wider">
            {activeCategoryDef.name} Games
          </span>
          <span className="text-[11px] text-amber-400/90 font-medium">
            Certified Fair
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Lottery Category Games */}
          {activeCategory === 'lottery' && (
            <>
              {/* K3 Lotre Dice */}
              <div
                onClick={() => {
                  triggerHaptic('selection');
                  onSelectGame('wingo');
                }}
                className="cursor-pointer bg-gray-900 border border-gray-800 hover:border-amber-500/50 rounded-2xl p-3.5 space-y-2 transition shadow-md group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition">
                    <Dices className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-300 rounded font-mono font-bold border border-amber-500/30">
                    Dice 216x
                  </span>
                </div>
                <div>
                  <div className="text-xs font-black text-white group-hover:text-amber-400 transition">K3 Lotre 3-Dice</div>
                  <p className="text-[11px] text-gray-400 mt-0.5">Guess dice sums, triples, doubles &amp; even/odds.</p>
                </div>
                <div className="text-[11px] font-bold text-amber-400 flex items-center justify-between pt-1 border-t border-gray-800/80">
                  <span>Play Dice</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* TRX Hash Win */}
              <div
                onClick={() => {
                  triggerHaptic('selection');
                  onSelectGame('wingo');
                }}
                className="cursor-pointer bg-gray-900 border border-gray-800 hover:border-emerald-500/50 rounded-2xl p-3.5 space-y-2 transition shadow-md group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition">
                    <Coins className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-300 rounded font-mono font-bold border border-emerald-500/30">
                    TRX 1Min
                  </span>
                </div>
                <div>
                  <div className="text-xs font-black text-white group-hover:text-emerald-400 transition">TRX Hash Win</div>
                  <p className="text-[11px] text-gray-400 mt-0.5">TRON block hash cryptographic verification fair play.</p>
                </div>
                <div className="text-[11px] font-bold text-emerald-400 flex items-center justify-between pt-1 border-t border-gray-800/80">
                  <span>Crypto Draw</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </>
          )}

          {/* Originals Category Games */}
          {activeCategory === 'original' && (
            <>
              {/* Space Rocket X */}
              <div
                onClick={() => {
                  triggerHaptic('selection');
                  onSelectGame('aviator');
                }}
                className="cursor-pointer bg-gray-900 border border-gray-800 hover:border-amber-500/50 rounded-2xl p-3.5 space-y-2 transition shadow-md group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition">
                    <Zap className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-300 rounded font-mono font-bold border border-amber-500/30">
                    250x Orbit
                  </span>
                </div>
                <div>
                  <div className="text-xs font-black text-white group-hover:text-amber-400 transition">Space Rocket X</div>
                  <p className="text-[11px] text-gray-400 mt-0.5">High altitude launch with dual cashout triggers.</p>
                </div>
                <div className="text-[11px] font-bold text-amber-400 flex items-center justify-between pt-1 border-t border-gray-800/80">
                  <span>Launch Rocket</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Aviator Provably Fair Quick Play */}
              <div
                onClick={() => {
                  triggerHaptic('selection');
                  onSelectGame('aviator');
                }}
                className="cursor-pointer bg-gray-900 border border-gray-800 hover:border-red-500/50 rounded-2xl p-3.5 space-y-2 transition shadow-md group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400 group-hover:scale-110 transition">
                    <PlaneTakeoff className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 bg-red-500/10 text-red-300 rounded font-mono font-bold border border-red-500/30">
                    Auto-Cash
                  </span>
                </div>
                <div>
                  <div className="text-xs font-black text-white group-hover:text-red-400 transition">Aviator Radar</div>
                  <p className="text-[11px] text-gray-400 mt-0.5">Provably Fair HMAC-SHA512 flight telemetry.</p>
                </div>
                <div className="text-[11px] font-bold text-red-400 flex items-center justify-between pt-1 border-t border-gray-800/80">
                  <span>Flight Deck</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </>
          )}

          {/* Slots Category Games */}
          {activeCategory === 'slots' && (
            <>
              {/* Super 777 Deluxe */}
              <div
                onClick={() => {
                  triggerHaptic('selection');
                  onSelectGame('wingo');
                }}
                className="cursor-pointer bg-gray-900 border border-gray-800 hover:border-purple-500/50 rounded-2xl p-3.5 space-y-2 transition shadow-md group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition">
                    <Gamepad2 className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/10 text-purple-300 rounded font-mono font-bold border border-purple-500/30">
                    1,000x Mega
                  </span>
                </div>
                <div>
                  <div className="text-xs font-black text-white group-hover:text-purple-400 transition">Super 777 Deluxe</div>
                  <p className="text-[11px] text-gray-400 mt-0.5">Wild multipliers, free spin rounds &amp; major jackpots.</p>
                </div>
                <div className="text-[11px] font-bold text-purple-400 flex items-center justify-between pt-1 border-t border-gray-800/80">
                  <span>Spin Reels</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Fortune Dragon Reels */}
              <div
                onClick={() => {
                  triggerHaptic('selection');
                  onSelectGame('wingo');
                }}
                className="cursor-pointer bg-gray-900 border border-gray-800 hover:border-amber-500/50 rounded-2xl p-3.5 space-y-2 transition shadow-md group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-300 rounded font-mono font-bold border border-amber-500/30">
                    500x Gold
                  </span>
                </div>
                <div>
                  <div className="text-xs font-black text-white group-hover:text-amber-400 transition">Fortune Dragon Reels</div>
                  <p className="text-[11px] text-gray-400 mt-0.5">Cascading reels with progressive multiplier cascades.</p>
                </div>
                <div className="text-[11px] font-bold text-amber-400 flex items-center justify-between pt-1 border-t border-gray-800/80">
                  <span>Spin Dragon</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </>
          )}

          {/* Casino Category Games */}
          {activeCategory === 'casino' && (
            <>
              {/* VIP Speed Baccarat */}
              <div
                onClick={() => {
                  triggerHaptic('selection');
                  onSelectGame('wingo');
                }}
                className="cursor-pointer bg-gray-900 border border-gray-800 hover:border-rose-500/50 rounded-2xl p-3.5 space-y-2 transition shadow-md group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-110 transition">
                    <Crown className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 bg-rose-500/10 text-rose-300 rounded font-mono font-bold border border-rose-500/30">
                    Live HD
                  </span>
                </div>
                <div>
                  <div className="text-xs font-black text-white group-hover:text-rose-400 transition">VIP Speed Baccarat</div>
                  <p className="text-[11px] text-gray-400 mt-0.5">15-second deal cycles with Player, Banker &amp; Tie bets.</p>
                </div>
                <div className="text-[11px] font-bold text-rose-400 flex items-center justify-between pt-1 border-t border-gray-800/80">
                  <span>Join Table</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Live European Roulette */}
              <div
                onClick={() => {
                  triggerHaptic('selection');
                  onSelectGame('wingo');
                }}
                className="cursor-pointer bg-gray-900 border border-gray-800 hover:border-rose-500/50 rounded-2xl p-3.5 space-y-2 transition shadow-md group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-110 transition">
                    <CircleDot className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 bg-rose-500/10 text-rose-300 rounded font-mono font-bold border border-rose-500/30">
                    36x Wheel
                  </span>
                </div>
                <div>
                  <div className="text-xs font-black text-white group-hover:text-rose-400 transition">European Roulette</div>
                  <p className="text-[11px] text-gray-400 mt-0.5">Single-zero wheel with inside numbers &amp; red/black.</p>
                </div>
                <div className="text-[11px] font-bold text-rose-400 flex items-center justify-between pt-1 border-t border-gray-800/80">
                  <span>Place Bets</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </>
          )}

          {/* Sports Category Games */}
          {activeCategory === 'sports' && (
            <>
              {/* Cricket Premier League Live */}
              <div
                onClick={() => {
                  triggerHaptic('selection');
                  onSelectGame('wingo');
                }}
                className="cursor-pointer bg-gray-900 border border-gray-800 hover:border-blue-500/50 rounded-2xl p-3.5 space-y-2 transition shadow-md group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-300 rounded font-mono font-bold border border-blue-500/30">
                    Live Odds
                  </span>
                </div>
                <div>
                  <div className="text-xs font-black text-white group-hover:text-blue-400 transition">Cricket Premier League</div>
                  <p className="text-[11px] text-gray-400 mt-0.5">Live in-play ball-by-ball markets and match predictions.</p>
                </div>
                <div className="text-[11px] font-bold text-blue-400 flex items-center justify-between pt-1 border-t border-gray-800/80">
                  <span>Match Centre</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* International Football Exchange */}
              <div
                onClick={() => {
                  triggerHaptic('selection');
                  onSelectGame('wingo');
                }}
                className="cursor-pointer bg-gray-900 border border-gray-800 hover:border-blue-500/50 rounded-2xl p-3.5 space-y-2 transition shadow-md group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-300 rounded font-mono font-bold border border-blue-500/30">
                    Global 24/7
                  </span>
                </div>
                <div>
                  <div className="text-xs font-black text-white group-hover:text-blue-400 transition">Global Football Exchange</div>
                  <p className="text-[11px] text-gray-400 mt-0.5">Match winners, over/under goals and handicap spreads.</p>
                </div>
                <div className="text-[11px] font-bold text-blue-400 flex items-center justify-between pt-1 border-t border-gray-800/80">
                  <span>Enter Exchange</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </>
          )}

          {/* PVC / Card Room Games */}
          {activeCategory === 'pvc' && (
            <>
              {/* Points Rummy */}
              <div
                onClick={() => {
                  triggerHaptic('selection');
                  onSelectGame('wingo');
                }}
                className="cursor-pointer bg-gray-900 border border-gray-800 hover:border-emerald-500/50 rounded-2xl p-3.5 space-y-2 transition shadow-md group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition">
                    <Award className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-300 rounded font-mono font-bold border border-emerald-500/30">
                    13-Card
                  </span>
                </div>
                <div>
                  <div className="text-xs font-black text-white group-hover:text-emerald-400 transition">13-Card Points Rummy</div>
                  <p className="text-[11px] text-gray-400 mt-0.5">Fast-paced skill card table with pure sequence sets.</p>
                </div>
                <div className="text-[11px] font-bold text-emerald-400 flex items-center justify-between pt-1 border-t border-gray-800/80">
                  <span>Join Table</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Teen Patti Pro */}
              <div
                onClick={() => {
                  triggerHaptic('selection');
                  onSelectGame('wingo');
                }}
                className="cursor-pointer bg-gray-900 border border-gray-800 hover:border-emerald-500/50 rounded-2xl p-3.5 space-y-2 transition shadow-md group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition">
                    <Crown className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-300 rounded font-mono font-bold border border-emerald-500/30">
                    3-Card Pot
                  </span>
                </div>
                <div>
                  <div className="text-xs font-black text-white group-hover:text-emerald-400 transition">Teen Patti Pro</div>
                  <p className="text-[11px] text-gray-400 mt-0.5">Classic Indian 3-card showdown with blind &amp; seen wagers.</p>
                </div>
                <div className="text-[11px] font-bold text-emerald-400 flex items-center justify-between pt-1 border-t border-gray-800/80">
                  <span>Enter Room</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Certified Fairness & Security Guarantee */}
      <div className="p-3.5 bg-gray-900/50 border border-gray-800/80 rounded-2xl text-center space-y-1.5">
        <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-bold">
          <ShieldCheck className="w-4 h-4" />
          <span>Provably Fair Cryptographic Verification &amp; 24/7 Instant UPI Settlement</span>
        </div>
        <p className="text-[10px] text-gray-500">
          WinXbet operates certified RNG logic. Fast automated withdrawals. 18+ responsible play only.
        </p>
      </div>

      {/* Category Definition Guide Modal */}
      <CategoryDefinitionModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        initialCategoryId={modalCategoryId}
        onSelectGame={onSelectGame}
      />

    </div>
  );
};
