import React, { useState } from 'react';
import { ShieldCheck, Clock, Zap, Database, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface SecurityEngineBannerProps {
  gameName: string;
  oneHourRecordCount: number;
  totalPurgedCount: number;
  lastPurgeTime: string;
  uptimeSec: number;
}

export const SecurityEngineBanner: React.FC<SecurityEngineBannerProps> = ({
  gameName,
  oneHourRecordCount,
  totalPurgedCount,
  lastPurgeTime,
  uptimeSec
}) => {
  const [expanded, setExpanded] = useState<boolean>(false);

  const formatUptime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 border border-emerald-500/30 rounded-2xl p-3 shadow-lg">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-white tracking-wide">
                CONTINUOUS ENGINE ACTIVE
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live 24/7
              </span>
            </div>
            <p className="text-[11px] text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400 shrink-0" />
              <span>
                Independent Continuous Draws • <strong className="text-gray-200">1-Hour Data Retention</strong>
              </span>
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            triggerHaptic('light');
            setExpanded(!expanded);
          }}
          className="px-2.5 py-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-800 text-[11px] font-bold flex items-center gap-1 transition shrink-0"
        >
          <span>Policy Info</span>
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-800/80 space-y-2.5 text-xs text-gray-300 animate-fadeIn">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
            <div className="p-2 bg-gray-950 rounded-xl border border-gray-800">
              <span className="text-[10px] text-gray-400 block font-sans">Active Records</span>
              <span className="text-xs font-black text-emerald-400">{oneHourRecordCount} Rounds</span>
            </div>
            <div className="p-2 bg-gray-950 rounded-xl border border-gray-800">
              <span className="text-[10px] text-gray-400 block font-sans">Data Window</span>
              <span className="text-xs font-black text-amber-400">Strict 60 Min</span>
            </div>
            <div className="p-2 bg-gray-950 rounded-xl border border-gray-800">
              <span className="text-[10px] text-gray-400 block font-sans">Purged Records</span>
              <span className="text-xs font-black text-rose-400">{totalPurgedCount} Expired</span>
            </div>
            <div className="p-2 bg-gray-950 rounded-xl border border-gray-800">
              <span className="text-[10px] text-gray-400 block font-sans">Engine Uptime</span>
              <span className="text-xs font-black text-cyan-400">{formatUptime(uptimeSec)}</span>
            </div>
          </div>

          <div className="p-2.5 bg-gray-950/70 border border-gray-800/80 rounded-xl space-y-1.5 text-[11px] text-gray-400 leading-relaxed">
            <div className="flex items-start gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">Continuous No-Wait Execution:</strong> All rounds in {gameName} operate continuously on real-time synchronized intervals. Games never pause, freeze, or wait for players to bet, completely eliminating client delay attacks.
              </span>
            </div>
            <div className="flex items-start gap-1.5">
              <Database className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">1-Hour Data Retention Policy:</strong> To protect player privacy, prevent stale data exploitation, and maintain peak network throughput, all game rounds older than 60 minutes are purged automatically every 10 seconds.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
