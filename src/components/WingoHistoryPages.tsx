import React, { useState, useMemo } from 'react';
import { WingoPeriod, GameBet } from '../types';
import { PaginationControls } from './PaginationControls';
import { WingoVisualTrendChart } from './WingoVisualTrendChart';
import { triggerHaptic } from '../utils/haptics';
import { 
  History, 
  TrendingUp, 
  Coins, 
  ShieldCheck, 
  Filter, 
  Copy, 
  Check, 
  Flame, 
  Snowflake, 
  Clock,
  Sparkles,
  BarChart3
} from 'lucide-react';

interface WingoHistoryPagesProps {
  history: WingoPeriod[];
  userBets: GameBet[];
  user: any;
  onOpenAuth: () => void;
  retentionWindowMinutes: number;
  totalPurgedCount: number;
  onSelectBet?: (choice: string) => void;
}

export const WingoHistoryPages: React.FC<WingoHistoryPagesProps> = ({
  history,
  userBets,
  user,
  onOpenAuth,
  retentionWindowMinutes,
  totalPurgedCount,
  onSelectBet
}) => {
  // Navigation between distinct pages (not a single sheet)
  const [activePage, setActivePage] = useState<'records' | 'trends' | 'my_bets' | 'security'>('records');

  // Page 1 (Game Records) state
  const [recordFilter, setRecordFilter] = useState<'all' | 'big' | 'small' | 'green' | 'red' | 'violet'>('all');
  const [recordCurrentPage, setRecordCurrentPage] = useState<number>(1);
  const [recordPageSize, setRecordPageSize] = useState<number>(10);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Page 3 (My Bets) state
  const [betFilter, setBetFilter] = useState<'all' | 'won' | 'lost' | 'pending'>('all');
  const [betCurrentPage, setBetCurrentPage] = useState<number>(1);
  const [betPageSize] = useState<number>(8);

  const handleCopyHash = (hash: string) => {
    triggerHaptic('light');
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Filtered records for Page 1
  const filteredRecords = useMemo(() => {
    return history.filter((row) => {
      if (recordFilter === 'big') return row.size === 'Big';
      if (recordFilter === 'small') return row.size === 'Small';
      if (recordFilter === 'green') return row.colors.includes('Green');
      if (recordFilter === 'red') return row.colors.includes('Red');
      if (recordFilter === 'violet') return row.colors.includes('Violet');
      return true;
    });
  }, [history, recordFilter]);

  const totalRecordPages = Math.max(1, Math.ceil(filteredRecords.length / recordPageSize));
  const paginatedRecords = useMemo(() => {
    const start = (recordCurrentPage - 1) * recordPageSize;
    return filteredRecords.slice(start, start + recordPageSize);
  }, [filteredRecords, recordCurrentPage, recordPageSize]);

  // Page 2: 1-Hour Trend Statistics
  const stats = useMemo(() => {
    const total = history.length || 1;
    let bigCount = 0;
    let smallCount = 0;
    let greenCount = 0;
    let redCount = 0;
    let violetCount = 0;
    const numFreq: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };

    history.forEach((h) => {
      if (h.size === 'Big') bigCount++;
      else smallCount++;
      if (h.colors.includes('Green')) greenCount++;
      if (h.colors.includes('Red')) redCount++;
      if (h.colors.includes('Violet')) violetCount++;
      numFreq[h.number] = (numFreq[h.number] || 0) + 1;
    });

    const sortedNums = Object.entries(numFreq).sort((a, b) => b[1] - a[1]);
    const hotNumber = sortedNums[0] ? Number(sortedNums[0][0]) : 7;
    const coldNumber = sortedNums[sortedNums.length - 1] ? Number(sortedNums[sortedNums.length - 1][0]) : 2;

    return {
      total,
      bigCount,
      smallCount,
      bigPct: Math.round((bigCount / total) * 100),
      smallPct: Math.round((smallCount / total) * 100),
      greenCount,
      greenPct: Math.round((greenCount / total) * 100),
      redCount,
      redPct: Math.round((redCount / total) * 100),
      violetCount,
      violetPct: Math.round((violetCount / total) * 100),
      numFreq,
      hotNumber,
      coldNumber
    };
  }, [history]);

  // Filtered user bets for Page 3
  const wingoBets = useMemo(() => {
    return userBets.filter(b => b.gameType.startsWith('wingo'));
  }, [userBets]);

  const filteredUserBets = useMemo(() => {
    return wingoBets.filter((b) => {
      if (betFilter === 'won') return b.status === 'won';
      if (betFilter === 'lost') return b.status === 'lost';
      if (betFilter === 'pending') return b.status === 'pending';
      return true;
    });
  }, [wingoBets, betFilter]);

  const totalBetPages = Math.max(1, Math.ceil(filteredUserBets.length / betPageSize));
  const paginatedUserBets = useMemo(() => {
    const start = (betCurrentPage - 1) * betPageSize;
    return filteredUserBets.slice(start, start + betPageSize);
  }, [filteredUserBets, betCurrentPage, betPageSize]);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-xl space-y-0">
      {/* Page Navigation Header Bar (Different Pages, Not a Single Sheet) */}
      <div className="bg-gray-950 p-2 border-b border-gray-800 flex items-center justify-between gap-1 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 w-full">
          <button
            id="page-tab-records"
            onClick={() => {
              triggerHaptic('light');
              setActivePage('records');
            }}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 shrink-0 ${
              activePage === 'records'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-600/30'
                : 'text-gray-400 hover:text-white hover:bg-gray-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Draw Records</span>
            <span className="text-[10px] px-1 py-0.2 rounded-full bg-black/40 font-mono">
              {history.length}
            </span>
          </button>

          <button
            id="page-tab-trends"
            onClick={() => {
              triggerHaptic('light');
              setActivePage('trends');
            }}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 shrink-0 ${
              activePage === 'trends'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30'
                : 'text-gray-400 hover:text-white hover:bg-gray-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>1-Hr Trends</span>
          </button>

          <button
            id="page-tab-mybets"
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
            <span>My Bets</span>
            {wingoBets.length > 0 && (
              <span className="text-[10px] px-1 py-0.2 rounded-full bg-black/20 font-mono">
                {wingoBets.length}
              </span>
            )}
          </button>

          <button
            id="page-tab-security"
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

      {/* PAGE 1: DRAW RECORDS (PAGINATED) */}
      {activePage === 'records' && (
        <div className="p-4 space-y-3 animate-fadeIn">
          {/* Filter & Page Size Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 overflow-x-auto text-xs">
              <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3 text-amber-400" /> Filter:
              </span>
              {(['all', 'big', 'small', 'green', 'red', 'violet'] as const).map((filterKey) => (
                <button
                  key={filterKey}
                  onClick={() => {
                    triggerHaptic('light');
                    setRecordFilter(filterKey);
                    setRecordCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition border ${
                    recordFilter === filterKey
                      ? 'bg-red-600/30 border-red-500 text-red-300 font-black'
                      : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {filterKey}
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
                    setRecordPageSize(size);
                    setRecordCurrentPage(1);
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                    recordPageSize === size
                      ? 'bg-amber-500 text-gray-950'
                      : 'bg-gray-950 text-gray-400 hover:bg-gray-800'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Table of Records */}
          <div className="overflow-x-auto rounded-2xl border border-gray-800 bg-gray-950/60">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 font-semibold text-[11px] bg-gray-950">
                  <th className="py-2.5 px-3">Period</th>
                  <th className="py-2.5 text-center">Number</th>
                  <th className="py-2.5 text-center">Big / Small</th>
                  <th className="py-2.5 text-center">Color Outcome</th>
                  <th className="py-2.5 text-center">Time</th>
                  <th className="py-2.5 pr-3 text-right">Fair Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 font-mono">
                {paginatedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500 text-xs">
                      No matching records found for this filter.
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map((row) => (
                    <tr key={row.periodId} className="hover:bg-gray-800/40 transition">
                      <td className="py-2.5 px-3 text-gray-300 font-bold text-[11px]">
                        {row.periodId}
                      </td>
                      <td className="py-2.5 text-center font-black">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs shadow-md ${
                            row.number === 0
                              ? 'bg-gradient-to-r from-rose-600 to-purple-600'
                              : row.number === 5
                              ? 'bg-gradient-to-r from-emerald-600 to-purple-600'
                              : [1, 3, 7, 9].includes(row.number)
                              ? 'bg-emerald-600'
                              : 'bg-rose-600'
                          }`}
                        >
                          {row.number}
                        </span>
                      </td>
                      <td className="py-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            row.size === 'Big'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}
                        >
                          {row.size}
                        </span>
                      </td>
                      <td className="py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {row.colors.map((c, cIdx) => (
                            <span
                              key={`${row.periodId}-${c}-${cIdx}`}
                              className={`w-3 h-3 rounded-full shadow-sm ${
                                c === 'Green'
                                  ? 'bg-emerald-500'
                                  : c === 'Red'
                                  ? 'bg-rose-500'
                                  : 'bg-purple-500'
                              }`}
                              title={c}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="py-2.5 text-center text-[11px] text-gray-400">
                        {row.time}
                      </td>
                      <td className="py-2.5 pr-3 text-right">
                        <button
                          onClick={() => handleCopyHash(row.hash)}
                          className="inline-flex items-center gap-1 text-[10px] text-gray-400 hover:text-amber-300 transition"
                          title="Copy Provably Fair Hash"
                        >
                          <span>{row.hash.slice(0, 6)}</span>
                          {copiedHash === row.hash ? (
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

          {/* Pagination Controls */}
          <PaginationControls
            currentPage={recordCurrentPage}
            totalPages={totalRecordPages}
            totalItems={filteredRecords.length}
            pageSize={recordPageSize}
            onPageChange={setRecordCurrentPage}
            itemName="rounds"
          />
        </div>
      )}

      {/* PAGE 2: 1-HOUR TREND & FREQUENCY CHARTS WITH RECHARTS */}
      {activePage === 'trends' && (
        <div className="p-3 sm:p-4 space-y-4 animate-fadeIn">
          {/* Interactive Recharts Visual Trend Chart Component */}
          <WingoVisualTrendChart
            history={history}
            onSelectBet={onSelectBet}
          />

          {/* 1-Hour Sequence Bead Ribbon */}
          <div className="bg-gray-950 p-3.5 rounded-2xl border border-gray-800 space-y-2">
            <div className="text-xs font-bold text-gray-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Latest Chronological Outcome Balls (Bead Road):
              </span>
              <span className="text-[10px] text-amber-400 font-mono">Real-time Feed</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto py-2 scrollbar-none">
              {history.slice(0, 24).reverse().map((item, idx) => (
                <div key={`bead-${item.periodId}-${idx}`} className="flex flex-col items-center gap-1 shrink-0">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-md ${
                      item.number === 0
                        ? 'bg-gradient-to-tr from-rose-600 to-purple-600'
                        : item.number === 5
                        ? 'bg-gradient-to-tr from-emerald-600 to-purple-600'
                        : [1, 3, 7, 9].includes(item.number)
                        ? 'bg-emerald-600'
                        : 'bg-rose-600'
                    }`}
                  >
                    {item.number}
                  </div>
                  <span className={`text-[10px] font-bold ${item.size === 'Big' ? 'text-amber-400' : 'text-blue-400'}`}>
                    {item.size[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PAGE 3: MY BET HISTORY (PAGINATED) */}
      {activePage === 'my_bets' && (
        <div className="p-4 space-y-3 animate-fadeIn">
          {!user ? (
            <div className="text-center py-10 space-y-3">
              <Coins className="w-10 h-10 text-amber-400 mx-auto opacity-70" />
              <div className="text-sm font-bold text-white">Login to View Your Bet Ledger</div>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">
                Track personal win/loss records, stake multipliers, and payout settlement history.
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
                {(['all', 'won', 'lost', 'pending'] as const).map((bF) => (
                  <button
                    key={bF}
                    onClick={() => {
                      triggerHaptic('light');
                      setBetFilter(bF);
                      setBetCurrentPage(1);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition border ${
                      betFilter === bF
                        ? 'bg-amber-500 text-gray-950 border-amber-400 font-black'
                        : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {bF}
                  </button>
                ))}
              </div>

              {/* Paginated Bets List */}
              {paginatedUserBets.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-xs">
                  No bets placed in this category yet.
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
                          <span className="font-mono text-gray-300">Period {b.periodId}</span>
                          <span className="px-2 py-0.5 bg-gray-800 text-amber-400 rounded-md font-mono text-[10px]">
                            {b.selection}
                          </span>
                        </div>
                        <div className="text-gray-400 text-[11px] font-mono">
                          Stake: ₹{b.amount * b.multiplier} ({b.amount} x {b.multiplier})
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`font-black text-sm font-mono ${
                            b.status === 'won'
                              ? 'text-emerald-400'
                              : b.status === 'lost'
                              ? 'text-gray-500'
                              : 'text-amber-400 animate-pulse'
                          }`}
                        >
                          {b.status === 'won'
                            ? `+₹${b.winAmount?.toFixed(2)}`
                            : b.status === 'lost'
                            ? '- Lost'
                            : 'Pending...'}
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
                currentPage={betCurrentPage}
                totalPages={totalBetPages}
                totalItems={filteredUserBets.length}
                pageSize={betPageSize}
                onPageChange={setBetCurrentPage}
                itemName="bets"
              />
            </>
          )}
        </div>
      )}

      {/* PAGE 4: CONTINUOUS SECURITY & DATA RETENTION POLICY */}
      {activePage === 'security' && (
        <div className="p-4 space-y-4 animate-fadeIn text-xs">
          <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-black text-emerald-300 text-sm">
                Continuous Round Engine &amp; 1-Hour Data Isolation
              </h4>
              <p className="text-[11px] text-emerald-400/80 mt-0.5">
                Authoritative server-synchronized RNG cycles operating without player dependency.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-gray-950 rounded-2xl border border-gray-800 space-y-1.5">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>No Waiting for User Bets</span>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                WinGo rounds tick continuously with global clock intervals (every 60 seconds). Even if no user bets, draws resolve on schedule, preventing players from freezing or timing the RNG.
              </p>
            </div>

            <div className="p-3 bg-gray-950 rounded-2xl border border-gray-800 space-y-1.5">
              <div className="font-bold text-white flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-blue-400" />
                <span>Strict 1-Hour Data Retention</span>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Only the most recent 60 minutes of game draws are retained in memory. Older records are automatically purged every 10 seconds, maintaining data integrity and peak performance.
              </p>
            </div>
          </div>

          <div className="p-3 bg-gray-950 rounded-2xl border border-gray-800 font-mono text-[11px] space-y-1 text-gray-400">
            <div className="text-gray-300 font-bold font-sans">Audit Daemon Metrics:</div>
            <div className="flex justify-between">
              <span>Active 1-Hour In-Memory Periods:</span>
              <span className="text-emerald-400">{history.length} records</span>
            </div>
            <div className="flex justify-between">
              <span>Total Historical Records Purged:</span>
              <span className="text-rose-400">{totalPurgedCount} records</span>
            </div>
            <div className="flex justify-between">
              <span>Anti-Frontrunning Bet Lock Window:</span>
              <span className="text-amber-400">Last 5 seconds of round</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
