import React, { useState } from 'react';
import { GameCategoryId, GameCategoryDefinition } from '../types';
import { GAME_CATEGORIES } from '../data/categories';
import { 
  BookOpen, 
  X, 
  Flame, 
  PlaneTakeoff, 
  Gamepad2, 
  Crown, 
  Trophy, 
  Award,
  ShieldCheck, 
  Zap, 
  Clock, 
  Percent, 
  ArrowRight, 
  ChevronRight,
  Sparkles,
  Info,
  CheckCircle2
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface CategoryDefinitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategoryId?: GameCategoryId;
  onSelectGame?: (game: 'wingo' | 'aviator' | 'k3' | 'trx' | 'slots') => void;
}

const CATEGORY_ICONS: Record<GameCategoryId, React.ComponentType<{ className?: string }>> = {
  lottery: Flame,
  original: PlaneTakeoff,
  slots: Gamepad2,
  casino: Crown,
  sports: Trophy,
  pvc: Award
};

const CATEGORY_COLORS: Record<GameCategoryId, { border: string; text: string; bg: string; badge: string }> = {
  lottery: {
    border: 'border-red-500',
    text: 'text-red-400',
    bg: 'from-red-950/40 via-gray-900 to-amber-950/30',
    badge: 'bg-red-500/20 text-red-300 border-red-500/30'
  },
  original: {
    border: 'border-amber-500',
    text: 'text-amber-400',
    bg: 'from-amber-950/40 via-gray-900 to-red-950/30',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
  },
  slots: {
    border: 'border-purple-500',
    text: 'text-purple-400',
    bg: 'from-purple-950/40 via-gray-900 to-pink-950/30',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
  },
  casino: {
    border: 'border-rose-500',
    text: 'text-rose-400',
    bg: 'from-rose-950/40 via-gray-900 to-amber-950/30',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
  },
  sports: {
    border: 'border-blue-500',
    text: 'text-blue-400',
    bg: 'from-blue-950/40 via-gray-900 to-cyan-950/30',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
  },
  pvc: {
    border: 'border-emerald-500',
    text: 'text-emerald-400',
    bg: 'from-emerald-950/40 via-gray-900 to-teal-950/30',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
  }
};

export const CategoryDefinitionModal: React.FC<CategoryDefinitionModalProps> = ({
  isOpen,
  onClose,
  initialCategoryId = 'lottery',
  onSelectGame
}) => {
  const [selectedCatId, setSelectedCatId] = useState<GameCategoryId>(initialCategoryId);

  if (!isOpen) return null;

  const currentCategory: GameCategoryDefinition = 
    GAME_CATEGORIES.find((c) => c.id === selectedCatId) || GAME_CATEGORIES[0];

  const CurrentIcon = CATEGORY_ICONS[currentCategory.id] || Flame;
  const theme = CATEGORY_COLORS[currentCategory.id] || CATEGORY_COLORS.lottery;

  return (
    <div 
      id="category-definition-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto"
    >
      <div 
        id="category-definition-container"
        className="w-full max-w-2xl bg-gray-950 border border-gray-800 rounded-3xl shadow-2xl text-white overflow-hidden my-4 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-gray-900 via-gray-900 to-gray-950 border-b border-gray-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wide text-white">
                  Game Categories Definition
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                  Official Guide
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Transparent rules, calculation mechanics, volatility and payout definitions
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-8 h-8 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Horizontal Tab Bar */}
        <div className="flex items-center gap-1.5 p-2.5 bg-gray-950 border-b border-gray-800/80 overflow-x-auto shrink-0 scrollbar-none">
          {GAME_CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.id] || Flame;
            const isSelected = cat.id === selectedCatId;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  triggerHaptic('selection');
                  setSelectedCatId(cat.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap border ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-500 to-red-600 text-white border-amber-400 shadow-md shadow-amber-500/20'
                    : 'bg-gray-900/60 hover:bg-gray-900 text-gray-400 hover:text-gray-200 border-gray-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* Hero Banner for Selected Category */}
          <div className={`p-4 rounded-2xl bg-gradient-to-br ${theme.bg} border ${theme.border} space-y-3 relative overflow-hidden`}>
            <div className="flex items-start justify-between gap-3 relative z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-md font-black text-[10px] uppercase border ${theme.badge}`}>
                    Category #{GAME_CATEGORIES.findIndex(c => c.id === currentCategory.id) + 1}
                  </span>
                  <span className="text-[11px] font-mono text-gray-400">
                    ID: {currentCategory.id}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <CurrentIcon className={`w-5 h-5 ${theme.text}`} />
                  <span>{currentCategory.title}</span>
                </h3>
                <p className="text-xs text-amber-200 font-medium">
                  {currentCategory.tagline}
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] text-gray-400 block">Payout Ceiling</span>
                <span className="text-base sm:text-lg font-black font-mono text-emerald-400">
                  {currentCategory.payoutRange}
                </span>
              </div>
            </div>

            {/* Core Category Definition */}
            <div className="bg-gray-950/70 p-3 rounded-xl border border-gray-800/80 text-xs text-gray-300 leading-relaxed">
              <strong className="text-white block mb-1 text-xs">Definition:</strong>
              {currentCategory.description}
            </div>

            {/* Key Specs Grid */}
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <div className="p-2.5 bg-gray-950/60 rounded-xl border border-gray-800/70">
                <span className="text-gray-400 text-[10px] flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" /> Volatility
                </span>
                <span className="font-bold text-white mt-0.5 block">{currentCategory.volatility}</span>
              </div>

              <div className="p-2.5 bg-gray-950/60 rounded-xl border border-gray-800/70">
                <span className="text-gray-400 text-[10px] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-blue-400" /> Draw Timing
                </span>
                <span className="font-bold text-white mt-0.5 block truncate">{currentCategory.drawInterval}</span>
              </div>

              <div className="p-2.5 bg-gray-950/60 rounded-xl border border-gray-800/70">
                <span className="text-gray-400 text-[10px] flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> Fairness Algorithm
                </span>
                <span className="font-bold text-emerald-400 mt-0.5 block truncate">{currentCategory.provablyFairMethod}</span>
              </div>
            </div>
          </div>

          {/* How It Works Section */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span>How This Category Operates</span>
            </h4>
            <div className="p-3 bg-gray-900/60 border border-gray-800 rounded-2xl text-xs text-gray-300 leading-relaxed">
              {currentCategory.howItWorks}
            </div>
          </div>

          {/* Payout Structure Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-emerald-400" />
              <span>Category Multiplier &amp; Payout Table</span>
            </h4>

            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="grid grid-cols-12 bg-gray-950 p-2.5 text-[11px] font-bold text-gray-400 border-b border-gray-800">
                <div className="col-span-5">Bet Selection / Event</div>
                <div className="col-span-3 text-right">Multiplier</div>
                <div className="col-span-4 text-right">Description</div>
              </div>
              <div className="divide-y divide-gray-800/60 text-xs">
                {currentCategory.payoutStructure.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 p-2.5 items-center hover:bg-gray-850/50 transition">
                    <div className="col-span-5 font-semibold text-gray-200">
                      {item.betType}
                    </div>
                    <div className="col-span-3 text-right font-mono font-black text-amber-400">
                      {item.multiplier}
                    </div>
                    <div className="col-span-4 text-right text-[11px] text-gray-400 truncate">
                      {item.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Key Rules */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Official Rules &amp; Settlement Conditions</span>
            </h4>
            <div className="p-3.5 bg-gray-900/50 border border-gray-800 rounded-2xl space-y-1.5">
              {currentCategory.keyRules.map((rule, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-gray-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Featured Category Games */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Included Games In This Category</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {currentCategory.featuredGames.map((game, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    if (onSelectGame) {
                      triggerHaptic('medium');
                      onClose();
                      onSelectGame(game.gameRoute);
                    }
                  }}
                  className="p-3 bg-gray-900 hover:bg-gray-850 border border-gray-800 hover:border-amber-500/40 rounded-2xl cursor-pointer transition flex items-center justify-between group"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-white group-hover:text-amber-400 transition">
                        {game.name}
                      </span>
                      {game.badge && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                          {game.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 line-clamp-1">{game.desc}</p>
                    <span className="text-[10px] font-mono text-emerald-400 font-semibold block">
                      Payout: {game.multiplier}
                    </span>
                  </div>

                  <button className="w-7 h-7 rounded-xl bg-gray-800 group-hover:bg-amber-500 group-hover:text-gray-950 flex items-center justify-center text-gray-400 transition shrink-0 ml-2">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-900 border-t border-gray-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-gray-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Standardized Fair-Play Category Architecture</span>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-black rounded-xl text-xs shadow-md transition"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
