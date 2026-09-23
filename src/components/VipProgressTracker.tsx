import React, { useState } from 'react';
import { 
  Crown, 
  Award, 
  Sparkles, 
  ChevronRight, 
  ShieldCheck, 
  TrendingUp, 
  Gift, 
  Lock, 
  CheckCircle2,
  Zap,
  ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { triggerHaptic } from '../utils/haptics';

export interface VipTierConfig {
  level: number;
  name: string;
  badgeColor: string;
  gradient: string;
  borderColor: string;
  textColor: string;
  minPoints: number;
  cashbackRate: string;
  dailyBonusBoost: string;
  withdrawalLimit: string;
  perks: string[];
}

export const VIP_TIERS: VipTierConfig[] = [
  {
    level: 1,
    name: 'Bronze Novice',
    badgeColor: 'bg-amber-800/40 text-amber-300 border-amber-700/50',
    gradient: 'from-amber-900/60 via-amber-950/80 to-black',
    borderColor: 'border-amber-700/40',
    textColor: 'text-amber-300',
    minPoints: 0,
    cashbackRate: '0.2%',
    dailyBonusBoost: '1.0x',
    withdrawalLimit: '₹50,000/day',
    perks: ['Standard Daily Check-in', 'Community Chat Access', '24/7 Standard Support']
  },
  {
    level: 2,
    name: 'Silver Elite',
    badgeColor: 'bg-slate-500/30 text-slate-200 border-slate-400/40',
    gradient: 'from-slate-800/60 via-gray-900/80 to-black',
    borderColor: 'border-slate-500/40',
    textColor: 'text-slate-200',
    minPoints: 500,
    cashbackRate: '0.4%',
    dailyBonusBoost: '1.2x',
    withdrawalLimit: '₹1,00,000/day',
    perks: ['+20% Daily Bonus Boost', 'Priority UPI Withdrawals', 'Weekly Loss Rebate 2%']
  },
  {
    level: 3,
    name: 'Gold Master',
    badgeColor: 'bg-amber-500/30 text-amber-300 border-amber-400/50',
    gradient: 'from-amber-600/30 via-amber-950/60 to-black',
    borderColor: 'border-amber-400/40',
    textColor: 'text-amber-400',
    minPoints: 1500,
    cashbackRate: '0.7%',
    dailyBonusBoost: '1.5x',
    withdrawalLimit: '₹2,50,000/day',
    perks: ['+50% Daily Bonus Boost', 'Dedicated Support Hotline', 'Gold Level Monthly Mystery Box']
  },
  {
    level: 4,
    name: 'Platinum Pro',
    badgeColor: 'bg-cyan-500/30 text-cyan-200 border-cyan-400/50',
    gradient: 'from-cyan-950/70 via-gray-900/80 to-black',
    borderColor: 'border-cyan-500/40',
    textColor: 'text-cyan-300',
    minPoints: 4000,
    cashbackRate: '1.0%',
    dailyBonusBoost: '2.0x',
    withdrawalLimit: '₹5,00,000/day',
    perks: ['2x Daily Streak Multiplier', 'Instant Zero-Fee Payouts', 'Birthday Luxury Gift Voucher']
  },
  {
    level: 5,
    name: 'Diamond Champion',
    badgeColor: 'bg-blue-500/30 text-blue-200 border-blue-400/50',
    gradient: 'from-blue-950/70 via-indigo-950/60 to-black',
    borderColor: 'border-blue-400/50',
    textColor: 'text-blue-300',
    minPoints: 10000,
    cashbackRate: '1.5%',
    dailyBonusBoost: '2.5x',
    withdrawalLimit: '₹10,00,000/day',
    perks: ['Personal VIP Account Manager', 'Custom High-Roller Limits', 'Exclusive VIP Tournament Invites']
  },
  {
    level: 6,
    name: 'Crown Legend',
    badgeColor: 'bg-purple-500/30 text-purple-200 border-purple-400/50',
    gradient: 'from-purple-950/70 via-fuchsia-950/50 to-black',
    borderColor: 'border-purple-400/50',
    textColor: 'text-purple-300',
    minPoints: 25000,
    cashbackRate: '2.0%',
    dailyBonusBoost: '3.0x',
    withdrawalLimit: '₹25,00,000/day',
    perks: ['3x Daily Streak Rewards', 'Express VIP Concierge', 'Annual VIP Luxury Vacation Package']
  },
  {
    level: 7,
    name: 'Sovereign Grandmaster',
    badgeColor: 'bg-rose-500/30 text-rose-200 border-rose-400/50',
    gradient: 'from-rose-950/70 via-red-950/60 to-black',
    borderColor: 'border-rose-400/50',
    textColor: 'text-rose-300',
    minPoints: 60000,
    cashbackRate: '3.0%',
    dailyBonusBoost: '5.0x',
    withdrawalLimit: 'Unlimited',
    perks: ['Max Tier Sovereign Crown', 'Zero-Fee Unlimited Payouts', 'Direct Line to WinXbet Executives']
  }
];

export const VipProgressTracker: React.FC = () => {
  const { profile } = useAuth();
  const [selectedTierPreview, setSelectedTierPreview] = useState<number | null>(null);

  // Compute total accumulated VIP points
  // Points = bonus points + (total recharges * 2) + base starting experience
  const rawPoints = (profile?.bonusPoints || 0) + ((profile?.totalRecharge || 0) * 2);
  const currentPoints = Math.max(rawPoints, 120); // Minimum starter points

  // Determine current tier based on points or profile.vipLevel
  let currentTierIndex = 0;
  for (let i = VIP_TIERS.length - 1; i >= 0; i--) {
    if (currentPoints >= VIP_TIERS[i].minPoints) {
      currentTierIndex = i;
      break;
    }
  }

  // If user profile has explicitly saved a higher vipLevel, honor it
  if (profile?.vipLevel && profile.vipLevel - 1 > currentTierIndex) {
    currentTierIndex = Math.min(profile.vipLevel - 1, VIP_TIERS.length - 1);
  }

  const currentTier = VIP_TIERS[currentTierIndex];
  const isMaxTier = currentTierIndex === VIP_TIERS.length - 1;
  const nextTier = isMaxTier ? currentTier : VIP_TIERS[currentTierIndex + 1];

  // Calculate points range and progress percentage
  const currentTierBasePoints = currentTier.minPoints;
  const nextTierTargetPoints = nextTier.minPoints;
  const pointsInCurrentTier = currentPoints - currentTierBasePoints;
  const pointsNeededForNext = Math.max(0, nextTierTargetPoints - currentPoints);
  const tierSpan = Math.max(1, nextTierTargetPoints - currentTierBasePoints);
  
  const progressPercent = isMaxTier 
    ? 100 
    : Math.min(100, Math.max(4, Math.round((pointsInCurrentTier / tierSpan) * 100)));

  const displayedTier = selectedTierPreview !== null ? VIP_TIERS[selectedTierPreview] : currentTier;

  return (
    <div id="vip-level-progress-tracker" className="bg-gradient-to-br from-gray-900 via-gray-950 to-black border border-amber-500/30 rounded-3xl p-5 shadow-2xl space-y-4 relative overflow-hidden">
      {/* Decorative ambient background accents */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-36 h-36 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main VIP Header & Current Rank */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-600 to-yellow-500 flex items-center justify-center text-gray-950 shadow-lg shadow-amber-500/20 font-black">
            <Crown className="w-6 h-6 fill-gray-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-white text-base tracking-tight">VIP Prestige Club</h3>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border uppercase tracking-wider ${currentTier.badgeColor}`}>
                VIP {currentTier.level}
              </span>
            </div>
            <p className="text-xs text-amber-400/90 font-semibold mt-0.5 flex items-center gap-1">
              <span>{currentTier.name}</span>
              <span className="text-gray-600">•</span>
              <span className="text-gray-400 font-mono">{currentPoints.toLocaleString()} Points</span>
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Next Tier</div>
          <div className="text-xs font-black text-white mt-0.5 flex items-center justify-end gap-1">
            {isMaxTier ? (
              <span className="text-amber-400">Max Rank Reached</span>
            ) : (
              <>
                <span className={nextTier.textColor}>VIP {nextTier.level}</span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar & Remaining Points */}
      <div className="bg-gray-950/80 border border-gray-800/90 rounded-2xl p-4 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-bold text-gray-300">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            <span>Progress to {isMaxTier ? 'Next Prestige' : `VIP ${nextTier.level} (${nextTier.name})`}</span>
          </div>
          <span className="font-black text-amber-400 font-mono">{progressPercent}%</span>
        </div>

        {/* Outer track */}
        <div className="w-full h-3 bg-gray-900 rounded-full overflow-hidden p-0.5 border border-gray-800 relative">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-300 transition-all duration-700 relative shadow-sm"
            style={{ width: `${progressPercent}%` }}
          >
            {/* Glossy shine highlight */}
            <div className="absolute inset-0 bg-white/20 rounded-full" />
          </div>
        </div>

        {/* Numerical Milestone details */}
        <div className="flex items-center justify-between text-[11px] text-gray-400 pt-0.5">
          <span className="font-mono">{currentPoints.toLocaleString()} Pts</span>
          {isMaxTier ? (
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Apex Sovereign Achieved
            </span>
          ) : (
            <div className="flex items-center gap-1">
              <span>Need</span>
              <span className="text-amber-400 font-black font-mono">
                {pointsNeededForNext.toLocaleString()} more pts
              </span>
              <span>to level up</span>
            </div>
          )}
          <span className="font-mono text-gray-500">{nextTierTargetPoints.toLocaleString()} Pts</span>
        </div>
      </div>

      {/* Quick Tier Level Selector Chips */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-gray-400 px-1 font-bold">
          <span>Tier Progression Roadmap</span>
          <span className="text-gray-500 text-[10px]">Tap tier to inspect benefits</span>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {VIP_TIERS.map((tier, idx) => {
            const isCurrent = idx === currentTierIndex;
            const isUnlocked = idx <= currentTierIndex;
            const isSelected = selectedTierPreview === idx || (selectedTierPreview === null && isCurrent);

            return (
              <button
                key={tier.level}
                type="button"
                id={`vip-tier-pill-${tier.level}`}
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedTierPreview(idx);
                }}
                className={`py-2 px-1 rounded-xl text-center flex flex-col items-center justify-center transition border ${
                  isSelected
                    ? 'bg-amber-500 text-gray-950 border-amber-400 font-black shadow-lg shadow-amber-500/20 scale-[1.03]'
                    : isUnlocked
                    ? 'bg-gray-900 border-amber-500/30 text-amber-300 hover:bg-gray-800'
                    : 'bg-gray-950/70 border-gray-800/80 text-gray-500 hover:bg-gray-900'
                }`}
              >
                <div className="flex items-center justify-center mb-0.5">
                  {isCurrent ? (
                    <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />
                  ) : isUnlocked ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Lock className="w-2.5 h-2.5 text-gray-600" />
                  )}
                </div>
                <span className="text-[10px] font-mono leading-none">V{tier.level}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Tier Perks Card */}
      <div className={`rounded-2xl p-4 border transition-all ${displayedTier.borderColor} bg-gradient-to-b ${displayedTier.gradient}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Award className={`w-4 h-4 ${displayedTier.textColor}`} />
            <h4 className="font-extrabold text-white text-xs">
              VIP {displayedTier.level} Perks ({displayedTier.name})
            </h4>
          </div>
          <span className="text-[10px] text-gray-300 font-mono">
            {displayedTier.minPoints === 0 ? 'Free Starter' : `${displayedTier.minPoints.toLocaleString()} Points`}
          </span>
        </div>

        {/* Tier Key Stats Row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-black/50 border border-white/5 rounded-xl p-2 text-center">
            <div className="text-[9px] text-gray-400 uppercase font-bold">Daily Boost</div>
            <div className="text-xs font-black text-amber-300 mt-0.5">{displayedTier.dailyBonusBoost}</div>
          </div>
          <div className="bg-black/50 border border-white/5 rounded-xl p-2 text-center">
            <div className="text-[9px] text-gray-400 uppercase font-bold">Bet Cashback</div>
            <div className="text-xs font-black text-emerald-300 mt-0.5">{displayedTier.cashbackRate}</div>
          </div>
          <div className="bg-black/50 border border-white/5 rounded-xl p-2 text-center">
            <div className="text-[9px] text-gray-400 uppercase font-bold">Daily Payout</div>
            <div className="text-xs font-black text-cyan-300 mt-0.5 truncate">{displayedTier.withdrawalLimit}</div>
          </div>
        </div>

        {/* Privileges Checklist */}
        <div className="space-y-1.5">
          {displayedTier.perks.map((perk, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-gray-300">
              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{perk}</span>
            </div>
          ))}
        </div>

        {/* How to earn points hint */}
        <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] text-gray-400">
          <span>Earn 2 Points per ₹1 deposited &amp; wagered</span>
          <span className="text-amber-400 font-bold flex items-center gap-0.5">
            Auto-Level Up <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
};
