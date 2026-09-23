import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Activity, 
  Gamepad2, 
  Calendar, 
  RefreshCw,
  Sparkles,
  Info
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

type ChartMode = 'bar' | 'net' | 'turnover';
type GameFilter = 'all' | 'wingo' | 'aviator' | 'k3' | 'trx';

interface DayData {
  dateKey: string;
  dayLabel: string;
  fullDate: string;
  wins: number;
  losses: number;
  net: number;
  turnover: number;
  betsCount: number;
  winCount: number;
  lossCount: number;
}

// Format currency with Indian Rupee prefix
const formatCurrency = (val: number) => {
  const abs = Math.abs(val);
  if (abs >= 100000) return `₹${(val / 1000).toFixed(1)}k`;
  if (abs >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
  return `₹${val}`;
};

// Custom Rich Tooltip for Recharts (kept outside to maintain stable identity)
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data: DayData = payload[0]?.payload;
    if (!data) return null;

    const isPositive = data.net >= 0;

    return (
      <div className="bg-gray-950/95 border border-gray-800 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs space-y-1.5 min-w-[170px] pointer-events-none z-50">
        <div className="flex items-center justify-between border-b border-gray-800/80 pb-1.5 font-bold">
          <span className="text-white">{data.dayLabel}</span>
          <span className="text-[10px] text-gray-400 font-mono">{data.fullDate}</span>
        </div>

        <div className="space-y-1 pt-0.5">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              Total Won:
            </span>
            <span className="font-bold text-emerald-400 font-mono">
              +₹{data.wins.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
              Total Lost:
            </span>
            <span className="font-bold text-rose-400 font-mono">
              -₹{data.losses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-gray-800/60">
            <span className="text-gray-300 font-medium">Net P&amp;L:</span>
            <span className={`font-black font-mono ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isPositive ? '+' : ''}₹{data.net.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex items-center justify-between text-[10px] text-gray-400 pt-0.5">
            <span>Bets: {data.betsCount}</span>
            <span>Turnover: ₹{data.turnover.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const WeeklyPerformanceChart: React.FC = () => {
  const { recentBets, user, profile } = useAuth();
  
  const [chartMode, setChartMode] = useState<ChartMode>('bar');
  const [gameFilter, setGameFilter] = useState<GameFilter>('all');
  const [showDemoData, setShowDemoData] = useState<boolean>(false);

  // Generate the last 7 days keys (from 6 days ago up to today)
  const last7Days = useMemo(() => {
    const days: { dateKey: string; dayLabel: string; fullDate: string }[] = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      const dayLabel = i === 0 ? 'Today' : `${dayName} ${dayNum}`;
      const fullDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      days.push({ dateKey, dayLabel, fullDate });
    }
    return days;
  }, []);

  // Filter bets based on selected game category
  const filteredBets = useMemo(() => {
    if (!recentBets) return [];
    return recentBets.filter(bet => {
      if (gameFilter === 'all') return true;
      if (gameFilter === 'wingo') return bet.gameType.startsWith('wingo');
      if (gameFilter === 'aviator') return bet.gameType === 'aviator';
      if (gameFilter === 'k3') return bet.gameType === 'k3';
      if (gameFilter === 'trx') return bet.gameType === 'trx';
      return true;
    });
  }, [recentBets, gameFilter]);

  // Aggregate user's real bets per day
  const realChartData = useMemo(() => {
    const map: Record<string, DayData> = {};
    
    // Initialize all 7 days with zeros
    last7Days.forEach(({ dateKey, dayLabel, fullDate }) => {
      map[dateKey] = {
        dateKey,
        dayLabel,
        fullDate,
        wins: 0,
        losses: 0,
        net: 0,
        turnover: 0,
        betsCount: 0,
        winCount: 0,
        lossCount: 0
      };
    });

    // Populate with real bets
    filteredBets.forEach(bet => {
      if (!bet.createdAt) return;
      const betDate = new Date(bet.createdAt);
      const year = betDate.getFullYear();
      const month = String(betDate.getMonth() + 1).padStart(2, '0');
      const day = String(betDate.getDate()).padStart(2, '0');
      const key = `${year}-${month}-${day}`;

      if (map[key]) {
        const betCost = (bet.amount || 0) * (bet.multiplier || 1);
        map[key].betsCount += 1;
        map[key].turnover += betCost;

        if (bet.status === 'won') {
          const payout = bet.winAmount || 0;
          map[key].wins += payout;
          map[key].winCount += 1;
        } else if (bet.status === 'lost') {
          map[key].losses += betCost;
          map[key].lossCount += 1;
        }
      }
    });

    // Calculate net for each day (rounded to 2 decimals)
    return Object.values(map).map(day => ({
      ...day,
      wins: Number(day.wins.toFixed(2)),
      losses: Number(day.losses.toFixed(2)),
      net: Number((day.wins - day.losses).toFixed(2)),
      turnover: Number(day.turnover.toFixed(2))
    }));
  }, [last7Days, filteredBets]);

  // Realistic sample performance data (useful for demonstration or new users)
  const demoChartData = useMemo(() => {
    const seedWeights = [
      { wins: 450, losses: 200, count: 8 },
      { wins: 120, losses: 380, count: 6 },
      { wins: 890, losses: 420, count: 12 },
      { wins: 610, losses: 550, count: 10 },
      { wins: 1240, losses: 600, count: 15 },
      { wins: 380, losses: 720, count: 9 },
      { wins: 950, losses: 310, count: 14 },
    ];

    return last7Days.map(({ dateKey, dayLabel, fullDate }, idx) => {
      const seed = seedWeights[idx % seedWeights.length];
      const wins = seed.wins;
      const losses = seed.losses;
      return {
        dateKey,
        dayLabel,
        fullDate,
        wins,
        losses,
        net: Number((wins - losses).toFixed(2)),
        turnover: wins + losses,
        betsCount: seed.count,
        winCount: Math.round(seed.count * 0.55),
        lossCount: Math.round(seed.count * 0.45),
      };
    });
  }, [last7Days]);

  const hasRealData = useMemo(() => {
    return realChartData.some(d => d.betsCount > 0);
  }, [realChartData]);

  // Current active dataset
  const activeData = (showDemoData || !hasRealData) ? demoChartData : realChartData;

  // Aggregate totals across all 7 days
  const totals = useMemo(() => {
    let totalWins = 0;
    let totalLosses = 0;
    let totalTurnover = 0;
    let totalBets = 0;
    let totalWinCount = 0;

    activeData.forEach(d => {
      totalWins += d.wins;
      totalLosses += d.losses;
      totalTurnover += d.turnover;
      totalBets += d.betsCount;
      totalWinCount += d.winCount;
    });

    const net = Number((totalWins - totalLosses).toFixed(2));
    const winRate = totalBets > 0 ? Number(((totalWinCount / totalBets) * 100).toFixed(1)) : 0;

    return {
      totalWins: Number(totalWins.toFixed(2)),
      totalLosses: Number(totalLosses.toFixed(2)),
      net,
      totalTurnover: Number(totalTurnover.toFixed(2)),
      totalBets,
      winRate
    };
  }, [activeData]);

  return (
    <div 
      id="weekly-performance-card"
      className="bg-gray-900 border border-gray-800 rounded-2xl p-4 shadow-xl space-y-4 relative overflow-hidden"
    >
      {/* Decorative ambient subtle glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Title and Mode Switchers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500/20 to-emerald-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
              <span>Weekly Performance</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-mono font-bold border border-amber-500/30">
                7 Days
              </span>
            </h3>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Total net wins versus losses across all casino &amp; lottery games
          </p>
        </div>

        {/* Demo / Live Data Toggle */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {!hasRealData && (
            <span className="text-[10px] text-amber-400/90 flex items-center gap-1 font-medium bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
              <Sparkles className="w-3 h-3" />
              Demo Preview
            </span>
          )}
          {hasRealData && (
            <button
              onClick={() => {
                triggerHaptic('light');
                setShowDemoData(!showDemoData);
              }}
              className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition cursor-pointer ${
                showDemoData 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                  : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'
              }`}
            >
              {showDemoData ? 'Viewing Demo' : 'Live Data'}
            </button>
          )}
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Total Won */}
        <div className="bg-gray-950/80 border border-gray-800/90 rounded-xl p-2.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              Total Won
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
          <div className="text-base font-black text-emerald-400 font-mono tracking-tight">
            ₹{totals.totalWins.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-gray-500">Gross payouts</div>
        </div>

        {/* Total Lost */}
        <div className="bg-gray-950/80 border border-gray-800/90 rounded-xl p-2.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium">
            <span className="flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-rose-400" />
              Total Lost
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          </div>
          <div className="text-base font-black text-rose-400 font-mono tracking-tight">
            ₹{totals.totalLosses.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-gray-500">Unsettled / lost stakes</div>
        </div>

        {/* Net P&L */}
        <div className="bg-gray-950/80 border border-gray-800/90 rounded-xl p-2.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium">
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-amber-400" />
              Net P&amp;L
            </span>
            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
              totals.net >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
            }`}>
              {totals.net >= 0 ? 'PROFIT' : 'LOSS'}
            </span>
          </div>
          <div className={`text-base font-black font-mono tracking-tight ${
            totals.net >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {totals.net >= 0 ? '+' : ''}₹{totals.net.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-gray-500">Wins minus losses</div>
        </div>

        {/* Win Rate / Turnover */}
        <div className="bg-gray-950/80 border border-gray-800/90 rounded-xl p-2.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium">
            <span className="flex items-center gap-1">
              <Gamepad2 className="w-3 h-3 text-indigo-400" />
              Turnover
            </span>
            <span className="text-[9px] font-bold text-amber-400 font-mono">
              {totals.winRate}% win
            </span>
          </div>
          <div className="text-base font-black text-amber-400 font-mono tracking-tight">
            ₹{totals.totalTurnover.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-gray-500">{totals.totalBets} total bets placed</div>
        </div>
      </div>

      {/* Chart View Tabs & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-800/80">
        {/* Visualization Type Switcher */}
        <div className="flex items-center bg-gray-950 p-1 rounded-xl border border-gray-800 text-[11px]">
          <button
            id="chart-mode-bar-btn"
            onClick={() => {
              triggerHaptic('light');
              setChartMode('bar');
            }}
            className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
              chartMode === 'bar'
                ? 'bg-amber-500 text-gray-950 shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Wins vs Losses
          </button>
          <button
            id="chart-mode-net-btn"
            onClick={() => {
              triggerHaptic('light');
              setChartMode('net');
            }}
            className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
              chartMode === 'net'
                ? 'bg-amber-500 text-gray-950 shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Net Trajectory
          </button>
          <button
            id="chart-mode-turnover-btn"
            onClick={() => {
              triggerHaptic('light');
              setChartMode('turnover');
            }}
            className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
              chartMode === 'turnover'
                ? 'bg-amber-500 text-gray-950 shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Turnover
          </button>
        </div>

        {/* Game Filter Selector */}
        <div className="flex items-center gap-1 text-[11px] overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'wingo', 'aviator', 'k3', 'trx'] as GameFilter[]).map((g) => (
            <button
              key={g}
              onClick={() => {
                triggerHaptic('light');
                setGameFilter(g);
              }}
              className={`px-2.5 py-1 rounded-lg font-semibold capitalize transition cursor-pointer ${
                gameFilter === g
                  ? 'bg-gray-800 text-amber-400 border border-amber-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 bg-gray-950/60 border border-gray-800/60'
              }`}
            >
              {g === 'all' ? 'All Games' : g === 'wingo' ? 'Win Go' : g.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Main Recharts Container */}
      <div className="w-full h-64 sm:h-72 min-h-[260px] bg-gray-950/60 border border-gray-800/80 rounded-xl p-2 sm:p-3 relative">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
          {chartMode === 'bar' ? (
            /* Bar Chart: Grouped Wins (Emerald) vs Losses (Rose) */
            <BarChart data={activeData} margin={{ top: 12, right: 10, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis 
                dataKey="dayLabel" 
                stroke="#6b7280" 
                fontSize={11} 
                tickLine={false}
                axisLine={{ stroke: '#374151' }}
              />
              <YAxis 
                stroke="#6b7280" 
                fontSize={10} 
                tickFormatter={formatCurrency}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                height={28}
                formatter={(val) => (
                  <span className="text-[11px] text-gray-300 font-medium capitalize">
                    {val === 'wins' ? 'Total Wins (₹)' : 'Total Losses (₹)'}
                  </span>
                )}
              />
              <Bar 
                dataKey="wins" 
                name="wins" 
                fill="#10b981" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={22}
              />
              <Bar 
                dataKey="losses" 
                name="losses" 
                fill="#f43f5e" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={22}
              />
            </BarChart>
          ) : chartMode === 'net' ? (
            /* Area / Line Chart: Net P&L Trajectory */
            <AreaChart data={activeData} margin={{ top: 12, right: 10, left: -15, bottom: 5 }}>
              <defs>
                <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis 
                dataKey="dayLabel" 
                stroke="#6b7280" 
                fontSize={11} 
                tickLine={false}
                axisLine={{ stroke: '#374151' }}
              />
              <YAxis 
                stroke="#6b7280" 
                fontSize={10} 
                tickFormatter={formatCurrency}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="#4b5563" strokeDasharray="3 3" />
              <Area 
                type="monotone" 
                dataKey="net" 
                name="net" 
                stroke="#10b981" 
                strokeWidth={2.5}
                fillOpacity={1} 
                fill="url(#netGradient)" 
              />
            </AreaChart>
          ) : (
            /* Bar Chart: Daily Turnover Activity */
            <BarChart data={activeData} margin={{ top: 12, right: 10, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis 
                dataKey="dayLabel" 
                stroke="#6b7280" 
                fontSize={11} 
                tickLine={false}
                axisLine={{ stroke: '#374151' }}
              />
              <YAxis 
                stroke="#6b7280" 
                fontSize={10} 
                tickFormatter={formatCurrency}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                height={28}
                formatter={() => (
                  <span className="text-[11px] text-gray-300 font-medium">
                    Daily Turnover Volume (₹)
                  </span>
                )}
              />
              <Bar 
                dataKey="turnover" 
                name="turnover" 
                fill="#f59e0b" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={28}
              >
                {activeData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.net >= 0 ? '#10b981' : '#f59e0b'} 
                  />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Footer Info & Legend Tips */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-gray-500 gap-1.5 pt-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" />
            <span className="text-gray-400">Wins (Payouts)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block" />
            <span className="text-gray-400">Losses (Stakes)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block" />
            <span className="text-gray-400">Net Profit</span>
          </span>
        </div>

        <div className="flex items-center gap-1 text-gray-400">
          <Info className="w-3.5 h-3.5 text-gray-500" />
          <span>Calculated automatically from settled game rounds</span>
        </div>
      </div>
    </div>
  );
};
