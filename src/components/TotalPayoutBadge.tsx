import React from 'react';
import { useSimulatedTotalPayout } from '../hooks/useSimulatedTotalPayout';
import { TrendingUp, Zap, ShieldCheck } from 'lucide-react';

interface TotalPayoutBadgeProps {
  variant?: 'compact' | 'badge' | 'card';
  className?: string;
}

export const TotalPayoutBadge: React.FC<TotalPayoutBadgeProps> = ({
  variant = 'compact',
  className = ''
}) => {
  const { totalPayout, formattedPayout, ratePerSecond, justTicked } = useSimulatedTotalPayout();

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-1.5 text-[11px] select-none ${className}`}>
        <span className="text-gray-400 font-medium">Total Payout:</span>
        <div className="flex items-center gap-1">
          <span 
            className={`text-emerald-400 font-black font-mono tracking-tight transition-all duration-300 ${
              justTicked ? 'text-emerald-300 scale-105 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]' : ''
            }`}
          >
            ₹{formattedPayout}
          </span>
          <span className="px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-mono font-bold border border-emerald-500/30 flex items-center gap-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
            +₹{ratePerSecond}/s
          </span>
        </div>
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 shadow-md backdrop-blur-sm select-none ${className}`}>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[11px] text-gray-300 font-medium">Total Disbursed:</span>
        </div>
        <span 
          className={`text-xs font-black font-mono text-emerald-400 transition-all duration-300 ${
            justTicked ? 'text-emerald-300 scale-105' : ''
          }`}
        >
          ₹{formattedPayout}
        </span>
        <span className="text-[9px] font-mono font-extrabold text-emerald-400/90 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
          +₹{ratePerSecond}/s
        </span>
      </div>
    );
  }

  // Full Card variant (for high visibility in lobby or stats overview)
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/70 via-gray-900 to-gray-950 border border-emerald-500/30 p-3.5 shadow-xl select-none ${className}`}>
      <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-gray-200">
                Total Payout Disbursed
              </span>
              <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 text-[9px] font-extrabold rounded-full border border-emerald-500/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE
              </span>
            </div>
            <p className="text-[10px] text-gray-400">Automated instant withdrawals released to player bank accounts & UPI</p>
          </div>
        </div>

        <div className="text-right">
          <div 
            className={`text-base sm:text-lg font-black font-mono text-emerald-400 tracking-tight transition-transform duration-300 ${
              justTicked ? 'scale-105 text-emerald-300' : ''
            }`}
          >
            ₹{formattedPayout}
          </div>
          <div className="text-[10px] font-mono text-emerald-400/80 font-semibold flex items-center justify-end gap-1">
            <Zap className="w-3 h-3 text-amber-400 animate-pulse" />
            <span>Increasing +₹{ratePerSecond}/s</span>
          </div>
        </div>
      </div>
    </div>
  );
};
