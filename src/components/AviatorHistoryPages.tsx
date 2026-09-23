import React, { useState, useMemo } from 'react';
import { AviatorRoundRecord, GameBet } from '../types';
import { PaginationControls } from './PaginationControls';
import { triggerHaptic } from '../utils/haptics';
import { 
  PlaneTakeoff, 
  BarChart3, 
  Coins, 
  ShieldCheck, 
  Filter, 
  Copy, 
  Check, 
  Flame, 
  TrendingUp, 
  Clock, 
  Zap,
  Rocket
} from 'lucide-react';

interface AviatorHistoryPagesProps {
  history: AviatorRoundRecord[];
  userBets: GameBet[];
  user: any;
  onOpenAuth: () => void;
  retentionWindowMinutes: number;
  totalPurgedCount: number;
}

export const AviatorHistoryPages: React.FC<AviatorHistoryPagesProps> = ({
  history,
  userBets,
  user,
  onOpenAuth,
  retentionWindowMinutes,
  totalPurgedCount
}) => {
  const [activePage, setActivePage] = useState<'records' | 'analytics' | 'my_bets' | 'security'>('records');

  // Page 1 state
  const [filterTier, setFilterTier] = useState<'all' | 'low' | 'medium' | 'high' | 'mega'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Page 3 state
  const [betFilter, setBetFilter] = useState<'all' | 'cashed' | 'crashed'>('all');
  const [betPage, setBetPage] = useState<number>(1);
  const betPageSize = 8;

  const handleCopyHash = (hash: string) => {
    triggerHaptic('light');
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Filtered crash records
  const filteredRecords = useMemo(() => {
    return history.filter((rec) => {
      if (filterTier === 'all') return true;
      return rec.tier === filterTier;
    });
  }, [history, filterTier]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  // Page 2: 1-Hour Analytics
  const analytics = useMemo(() => {
    const total = history.length || 1;
    let sumMultiplier = 0;
    let highestMultiplier = 0;
    let under2x = 0;
    let between2And5x = 0;
    let between5And10x = 0;
    let mega10xPlus = 0;
    let instantCrashUnder12 = 0;

    history.forEach((h) => {
      sumMultiplier += h.crashMultiplier;
      if (h.crashMultiplier > highestMultiplier) highestMultiplier = h.crashMultiplier;
      if (h.crashMultiplier < 1.20) instantCrashUnder12++;
      if (h.crashMultiplier < 2.0) under2x++;
      else if (h.crashMultiplier < 5.0) between2And5x++;
      else if (h.crashMultiplier < 10.0) between5And10x++;
      else mega10xPlus++;
    });

    const avg = Number((sumMultiplier / total).toFixed(2));

    return {
      total,
      avg,
      highestMultiplier: Number(highestMultiplier.toFixed(2)),
      under2x,
      under2xPct: Math.round((under2x / total) * 100),
      between2And5x,
      between2And5xPct: Math.round((between2And5x / total) * 100),
      between5And10x,
      between5And10xPct: Math.round((between5And10x / total) * 100),
      mega10xPlus,
      mega10xPlusPct: Math.round((mega10xPlus / total) * 100),
      instantCrashUnder12,
      instantCrashPct: Math.round((instantCrashUnder12 / total) * 100)
    };
  }, [history]);

  // Filtered Aviator user bets
  const aviatorBets = useMemo(() => {
    return userBets.filter((b) => b.gameType === 'aviator');
  }, [userBets]);

  const filteredUserBets = useMemo(() => {
    return aviatorBets.filter((b) => {
      if (betFilter === 'cashed') return b.status === 'won';
      if (betFilter === 'crashed') return b.status === 'lost';
      return true;
    });
  }, [aviatorBets, betFilter]);

  const totalBetPages = Math.max(1, Math.ceil(filteredUserBets.length / betPageSize));
  const paginatedUserBets = useMemo(() => {
    const start = (betPage - 1) * betPageSize;
    return filteredUserBets.slice(start, start + betPageSize);
  }, [filteredUserBets, betPage, betPageSize]);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-xl space-y-0">
      {/* Page Navigation Header Bar (Different Pages, Not a Single Sheet) */}
      <div className="bg-gray-950 p-2 border-b border-gray-800 flex items-center justify-between gap-1 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 w-full">
          <button
            id="aviator-page-records"
            onClick={() => {
              triggerHaptic('light');
              setActivePage('records');
            }}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 shrink-0 ${
              activePage === 'records'
                ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md shadow-red-600/30'
                : 'text-gray-400 hover:text-white hover:bg-gray-900'
            }`}
          >
            <PlaneTakeoff className="w-3.5 h-3.5" />
            <span>Flight Records</span>
            <span className="text-[10px] px-1 py-0.2 rounded-full bg-black/40 font-mono">
              {history.length}
            </span>
          </button>

          <button
            id="aviator-page-analytics"
            onClick={() => {
              triggerHaptic('light');
              setActivePage('analytics');
            }}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 shrink-0 ${
              activePage === 'analytics'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-600/30'
                : 'text-gray-400 hover:text-white hover:bg-gray-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>1-Hr Multipliers</span>
          </button>

          <button
            id="aviator-page-mybets"
            onClick={() => {
              triggerHaptic('light');
              setActivePage('my_bets');
            }}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 shrink-0 ${
              activePage === 'my_bets'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-950 shadow-md shadow-amber-500/30 font-black'
                : 'text-gray-400 hover:text-white hover:bg-gray-900'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>My Flight Bets</span>
            {aviatorBets.length > 0 && (
              <span className="text-[10px] px-1 py-0.2 rounded-full bg-black/20 font-mono">
                {aviatorBets.length}
              </span>
            )}
          </button>

          <button
            id="aviator-page-security"
            onClick={() => {
              triggerHaptic('light');
              setActivePage('security');
            }}
            className={`py-2 px-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 shrink-0 ${
              activePage === 'security'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-gray-400 hover:text-white hover:bg-gray-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Engine Policy</span>
          </button>
        </div>
      </div>

      {/* PAGE 1: FLIGHT RECORDS (PAGINATED) */}
      {activePage === 'records' && (
        <div className="p-4 space-y-3 animate-fadeIn">
          {/* Filter and Page Size Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 overflow-x-auto text-xs">
              <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3 text-amber-400" /> Tier:
              </span>
              {[
                { key: 'all', label: 'All' },
                { key: 'low', label: '< 2.0x' },
                { key: 'medium', label: '2x - 5x' },
                { key: 'high', label: '5x - 10x' },
                { key: 'mega', label: '10x+ Rocket' }
              ].map((tierItem) => (
                <button
                  key={tierItem.key}
                  onClick={() => {
                    triggerHaptic('light');
                    setFilterTier(tierItem.key as any);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                    filterTier === tierItem.key
                      ? 'bg-red-600/30 border-red-500 text-red-300 font-black'
                      : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {tierItem.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="text-[11px]">Rows:</span>
              {[10, 20].map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    triggerHaptic('light');
                    setPageSize(size);
                    setCurrentPage(1);
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                    pageSize === size
                      ? 'bg-amber-500 text-gray-950'
                      : 'bg-gray-950 text-gray-400 hover:bg-gray-800'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Table of Crash Records */}
          <div className="overflow-x-auto rounded-2xl border border-gray-800 bg-gray-950/60">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 font-semibold text-[11px] bg-gray-950">
                  <th className="py-2.5 px-3">Round ID</th>
                  <th className="py-2.5 text-center">Crash Multiplier</th>
                  <th className="py-2.5 text-center">Flight Duration</th>
                  <th className="py-2.5 text-center">Outcome Tier</th>
                  <th className="py-2.5 text-center">Time</th>
                  <th className="py-2.5 pr-3 text-right">Fair Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 font-mono">
                {paginatedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500 text-xs">
                      No matching flights found for this tier filter.
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map((flight) => (
                    <tr key={flight.roundId} className="hover:bg-gray-800/40 transition">
                      <td className="py-2.5 px-3 text-gray-300 font-bold text-[11px]">
                        {flight.roundId}
                      </td>
                      <td className="py-2.5 text-center font-black">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs shadow-md ${
                            flight.crashMultiplier >= 10.0
                              ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-950 font-black animate-pulse'
                              : flight.crashMultiplier >= 5.0
                              ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                              : flight.crashMultiplier >= 2.0
                              ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                              : 'bg-gray-800 text-gray-400'
                          }`}
                        >
                          {flight.crashMultiplier.toFixed(2)}x
                        </span>
                      </td>
                      <td className="py-2.5 text-center text-gray-300 text-[11px]">
                        {flight.flightDurationSec}s
                      </td>
                      <td className="py-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                            flight.tier === 'mega'
                              ? 'bg-amber-500/20 text-amber-300'
                              : flight.tier === 'high'
                              ? 'bg-purple-500/20 text-purple-300'
                              : flight.tier === 'medium'
                              ? 'bg-blue-500/20 text-blue-300'
                              : 'bg-gray-800 text-gray-400'
                          }`}
                        >
                          {flight.tier}
                        </span>
                      </td>
                      <td className="py-2.5 text-center text-[11px] text-gray-400">
                        {flight.time}
                      </td>
                      <td className="py-2.5 pr-3 text-right">
                        <button
                          onClick={() => handleCopyHash(flight.hash)}
                          className="inline-flex items-center gap-1 text-[10px] text-gray-400 hover:text-amber-300 transition"
                          title="Copy Provably Fair Flight Hash"
                        >
                          <span>{flight.hash.slice(0, 6)}</span>
                          {copiedHash === flight.hash ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-gray-500" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredRecords.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            itemName="flights"
          />
        </div>
      )}

      {/* PAGE 2: 1-HOUR MULTIPLIER ANALYTICS */}
      {activePage === 'analytics' && (
        <div className="p-4 space-y-4 animate-fadeIn">
          {/* Key Metric Blocks */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-gray-950 p-3 rounded-2xl border border-gray-800 space-y-1">
              <span className="text-[10px] text-gray-400 block font-medium">1-Hour Flights</span>
              <span className="text-xl font-black text-white font-mono">{analytics.total} Flights</span>
              <span className="text-[10px] text-emerald-400 block">Rolling 60m Window</span>
            </div>

            <div className="bg-gray-950 p-3 rounded-2xl border border-gray-800 space-y-1">
              <span className="text-[10px] text-gray-400 block font-medium">Highest Flight Multiplier</span>
              <span className="text-xl font-black text-amber-400 font-mono flex items-center gap-1">
                <Rocket className="w-4 h-4 text-amber-400" />
                <span>{analytics.highestMultiplier}x</span>
              </span>
              <span className="text-[10px] text-amber-500/80 block">Mega Rocket Record</span>
            </div>

            <div className="bg-gray-950 p-3 rounded-2xl border border-gray-800 space-y-1">
              <span className="text-[10px] text-gray-400 block font-medium">Average Multiplier</span>
              <span className="text-xl font-black text-blue-400 font-mono">{analytics.avg}x</span>
              <span className="text-[10px] text-gray-500 block">Past 60 minutes mean</span>
            </div>

            <div className="bg-gray-950 p-3 rounded-2xl border border-gray-800 space-y-1">
              <span className="text-[10px] text-gray-400 block font-medium">Instant Crash (&lt;1.20x)</span>
              <span className="text-xl font-black text-rose-400 font-mono">
                {analytics.instantCrashPct}%
              </span>
              <span className="text-[10px] text-gray-500 block">{analytics.instantCrashUnder12} flights</span>
            </div>
          </div>

          {/* Tier Distribution Bars */}
          <div className="bg-gray-950 p-3.5 rounded-2xl border border-gray-800 space-y-3">
            <div className="text-xs font-bold text-gray-300 flex items-center justify-between">
              <span>Flight Multiplier Distribution in Past 60 Minutes:</span>
              <span className="text-[10px] text-gray-500">Auto-calculated</span>
            </div>

            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-xs text-gray-300 mb-1 font-mono">
                  <span>Under 2.00x (Low Risk / Fast Cashout)</span>
                  <span className="font-bold text-blue-400">{analytics.under2xPct}% ({analytics.under2x})</span>
                </div>
                <div className="w-full bg-gray-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${analytics.under2xPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-gray-300 mb-1 font-mono">
                  <span>2.00x – 5.00x (Medium Multiplier)</span>
                  <span className="font-bold text-indigo-400">{analytics.between2And5xPct}% ({analytics.between2And5x})</span>
                </div>
                <div className="w-full bg-gray-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${analytics.between2And5xPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-gray-300 mb-1 font-mono">
                  <span>5.00x – 10.00x (High Altitude)</span>
                  <span className="font-bold text-purple-400">{analytics.between5And10xPct}% ({analytics.between5And10x})</span>
                </div>
                <div className="w-full bg-gray-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full transition-all duration-500" style={{ width: `${analytics.between5And10xPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-gray-300 mb-1 font-mono">
                  <span>10.00x+ (Mega Super Rocket)</span>
                  <span className="font-bold text-amber-400">{analytics.mega10xPlusPct}% ({analytics.mega10xPlus})</span>
                </div>
                <div className="w-full bg-gray-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-500" style={{ width: `${analytics.mega10xPlusPct}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAGE 3: MY FLIGHT BETS (PAGINATED) */}
      {activePage === 'my_bets' && (
        <div className="p-4 space-y-3 animate-fadeIn">
          {!user ? (
            <div className="text-center py-10 space-y-3">
              <Coins className="w-10 h-10 text-amber-400 mx-auto opacity-70" />
              <div className="text-sm font-bold text-white">Login to View Your Flight Bet History</div>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">
                Track personal stakes, auto-cashout hits, and net winnings for Aviator.
              </p>
              <button
                onClick={onOpenAuth}
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-950 font-black rounded-xl text-xs shadow-lg"
              >
                Login Now
              </button>
            </div>
          ) : (
            <>
              {/* Filter Tabs */}
              <div className="flex items-center gap-1 text-xs">
                {(['all', 'cashed', 'crashed'] as const).map((bF) => (
                  <button
                    key={bF}
                    onClick={() => {
                      triggerHaptic('light');
                      setBetFilter(bF);
                      setBetPage(1);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition border ${
                      betFilter === bF
                        ? 'bg-amber-500 text-gray-950 border-amber-400 font-black'
                        : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {bF === 'cashed' ? 'Cashed Out' : bF === 'crashed' ? 'Flew Away' : 'All Bets'}
                  </button>
                ))}
              </div>

              {/* Paginated Bets List */}
              {paginatedUserBets.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-xs">
                  No flight bets found in this category. Place a bet on the next flight!
                </div>
              ) : (
                <div className="space-y-2">
                  {paginatedUserBets.map((b, bIdx) => (
                    <div
                      key={b.id || `bet-${b.periodId}-${bIdx}`}
                      className="p-3 bg-gray-950 border border-gray-800 rounded-2xl flex items-center justify-between text-xs hover:border-gray-700 transition"
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-white flex items-center gap-2">
                          <span className="font-mono text-gray-300">Round {b.periodId}</span>
                          <span
                            className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                              b.status === 'won'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {b.status === 'won' ? 'CASHED OUT' : 'FLEW AWAY'}
                          </span>
                        </div>
                        <div className="text-gray-400 text-[11px] font-mono">
                          Wager: ₹{b.amount}
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`font-black text-sm font-mono ${
                            b.status === 'won' ? 'text-emerald-400' : 'text-gray-500'
                          }`}
                        >
                          {b.status === 'won'
                            ? `+₹${b.winAmount?.toFixed(2)}`
                            : '- Lost'}
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          {b.createdAt ? new Date(b.createdAt).toLocaleTimeString() : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              <PaginationControls
                currentPage={betPage}
                totalPages={totalBetPages}
                totalItems={filteredUserBets.length}
                pageSize={betPageSize}
                onPageChange={setBetPage}
                itemName="flight bets"
              />
            </>
          )}
        </div>
      )}

      {/* PAGE 4: CONTINUOUS FLIGHT ENGINE & AUDIT */}
      {activePage === 'security' && (
        <div className="p-4 space-y-4 animate-fadeIn text-xs">
          <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-black text-emerald-300 text-sm">
                Continuous Flight Engine &amp; 1-Hour Data Isolation
              </h4>
              <p className="text-[11px] text-emerald-400/80 mt-0.5">
                Spribe-standard autonomous crash engine with guaranteed zero waiting for player bets.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-gray-950 rounded-2xl border border-gray-800 space-y-1.5">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Non-Stop Continuous Flights</span>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                The jet takes off every 15–30 seconds regardless of player actions. If a player places no bet, the flight proceeds autonomously with co-pilots, preventing client stall exploits.
              </p>
            </div>

            <div className="p-3 bg-gray-950 rounded-2xl border border-gray-800 space-y-1.5">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-blue-400" />
                <span>Strict 60-Minute Purge</span>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Flight multiplier records are held strictly for 1 hour. All records exceeding 60 minutes are purged automatically by the background security daemon.
              </p>
            </div>
          </div>

          <div className="p-3 bg-gray-950 rounded-2xl border border-gray-800 font-mono text-[11px] space-y-1 text-gray-400">
            <div className="text-gray-300 font-bold font-sans">Audit Daemon Metrics:</div>
            <div className="flex justify-between">
              <span>Active 1-Hour Flight Records:</span>
              <span className="text-emerald-400">{history.length} flights</span>
            </div>
            <div className="flex justify-between">
              <span>Total Historical Flights Purged:</span>
              <span className="text-rose-400">{totalPurgedCount} flights</span>
            </div>
            <div className="flex justify-between">
              <span>Betting Window:</span>
              <span className="text-amber-400">5.0s countdown before takeoff</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
