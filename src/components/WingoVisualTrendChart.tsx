import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ReferenceLine, 
  ReferenceArea,
  Cell,
  Legend
} from 'recharts';
import { WingoPeriod } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { 
  TrendingUp, 
  BarChart3, 
  Flame, 
  Snowflake, 
  Sparkles, 
  Activity, 
  Layers, 
  CheckCircle2, 
  Info,
  Clock,
  Compass,
  ArrowRightLeft
} from 'lucide-react';

interface WingoVisualTrendChartProps {
  history: WingoPeriod[];
  onSelectBet?: (choice: string) => void;
  className?: string;
}

type ChartViewMode = 'trajectory' | 'frequency' | 'distribution';
type SampleRange = 15 | 30 | 50 | 60;

// Custom SVG lottery ball dot rendered directly on trajectory line
const CustomLotteryBallDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null || !payload) return null;

  const num = payload.number;
  const isViolet = payload.hasViolet;
  const primaryColor = payload.primaryColor;

  let fill = '#10b981'; // Green
  let stroke = '#059669';

  if (num === 0) {
    fill = '#9333ea'; // Violet/Red dual
    stroke = '#e11d48';
  } else if (num === 5) {
    fill = '#0d9488'; // Violet/Green dual
    stroke = '#9333ea';
  } else if (primaryColor === 'Red') {
    fill = '#e11d48'; // Red
    stroke = '#be123c';
  }

  return (
    <g className="transition-transform duration-200">
      <circle
        cx={cx}
        cy={cy}
        r={10}
        fill={fill}
        stroke={stroke}
        strokeWidth={1.8}
        style={{ filter: 'drop-shadow(0px 2px 3px rgba(0,0,0,0.6))' }}
      />
      <text
        x={cx}
        y={cy + 3.5}
        textAnchor="middle"
        fill="#ffffff"
        fontSize={10}
        fontWeight="900"
        fontFamily="ui-monospace, monospace"
      >
        {num}
      </text>
    </g>
  );
};

// Active dot when user hovers over node
const CustomActiveDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null || !payload) return null;

  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={16}
        fill="#f59e0b"
        opacity={0.35}
      />
      <circle
        cx={cx}
        cy={cy}
        r={11}
        fill="#f59e0b"
        stroke="#ffffff"
        strokeWidth={2}
      />
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        fill="#0f172a"
        fontSize={11}
        fontWeight="900"
        fontFamily="ui-monospace, monospace"
      >
        {payload.number}
      </text>
    </g>
  );
};

// Custom Rich Dark Glass Tooltip for Recharts
const CustomTrendTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    if (!data) return null;

    const isBig = data.size === 'Big';
    const isEven = data.number % 2 === 0;

    return (
      <div className="bg-gray-950/95 border border-amber-500/40 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs space-y-2 min-w-[200px] z-50">
        <div className="flex items-center justify-between border-b border-gray-800 pb-1.5">
          <span className="font-mono text-gray-400 font-bold text-[10px]">
            Period {data.periodId}
          </span>
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            {data.time}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-base text-white shadow-lg ${
              data.number === 0
                ? 'bg-gradient-to-tr from-rose-600 via-purple-600 to-purple-700'
                : data.number === 5
                ? 'bg-gradient-to-tr from-emerald-600 via-teal-600 to-purple-700'
                : [1, 3, 7, 9].includes(data.number)
                ? 'bg-emerald-600'
                : 'bg-rose-600'
            }`}
          >
            {data.number}
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                isBig ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
              }`}>
                {data.size} ({data.number >= 5 ? '5-9' : '0-4'})
              </span>
              <span className="px-1.5 py-0.5 bg-gray-800 text-gray-300 rounded text-[10px] font-mono">
                {isEven ? 'Even' : 'Odd'}
              </span>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-gray-300 pt-0.5">
              <span>Color:</span>
              <div className="flex items-center gap-1">
                {data.colors.map((c: string) => (
                  <span
                    key={c}
                    className={`font-bold ${
                      c === 'Green' ? 'text-emerald-400' : c === 'Red' ? 'text-rose-400' : 'text-purple-400'
                    }`}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {data.hash && (
          <div className="text-[9px] font-mono text-gray-500 truncate pt-1 border-t border-gray-800/80">
            Hash: {data.hash.slice(0, 10)}...
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const WingoVisualTrendChart: React.FC<WingoVisualTrendChartProps> = ({
  history,
  onSelectBet,
  className = ''
}) => {
  const [chartMode, setChartMode] = useState<ChartViewMode>('trajectory');
  const [sampleRange, setSampleRange] = useState<SampleRange>(30);

  // Chronological dataset: oldest round on the left, most recent on the right
  const chartData = useMemo(() => {
    const rawSlice = history.slice(0, sampleRange);
    return [...rawSlice].reverse().map((p) => {
      const shortId = p.periodId.length > 5 ? p.periodId.slice(-4) : p.periodId;
      return {
        periodId: p.periodId,
        shortPeriod: shortId,
        number: p.number,
        size: p.size,
        colors: p.colors,
        primaryColor: p.colors[0],
        hasViolet: p.colors.includes('Violet'),
        time: p.time,
        hash: p.hash,
        isEven: p.number % 2 === 0,
      };
    });
  }, [history, sampleRange]);

  // Pattern metrics calculation based on selected window
  const analytics = useMemo(() => {
    const sample = history.slice(0, sampleRange);
    const total = sample.length || 1;

    let bigCount = 0;
    let smallCount = 0;
    let redCount = 0;
    let greenCount = 0;
    let violetCount = 0;
    let evenCount = 0;
    let oddCount = 0;
    let sumNum = 0;

    const freqMap: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };

    sample.forEach((p) => {
      sumNum += p.number;
      freqMap[p.number] = (freqMap[p.number] || 0) + 1;

      if (p.size === 'Big') bigCount++;
      else smallCount++;

      if (p.colors.includes('Red')) redCount++;
      if (p.colors.includes('Green')) greenCount++;
      if (p.colors.includes('Violet')) violetCount++;

      if (p.number % 2 === 0) evenCount++;
      else oddCount++;
    });

    // Compute active streaks from newest round
    let currentStreakType = '';
    let currentStreakCount = 0;
    if (sample.length > 0) {
      const latest = sample[0];
      currentStreakType = latest.size;
      for (let i = 0; i < sample.length; i++) {
        if (sample[i].size === currentStreakType) {
          currentStreakCount++;
        } else {
          break;
        }
      }
    }

    // Latest color streak
    let colorStreakType = '';
    let colorStreakCount = 0;
    if (sample.length > 0) {
      const latestColor = sample[0].colors[0];
      colorStreakType = latestColor;
      for (let i = 0; i < sample.length; i++) {
        if (sample[i].colors.includes(latestColor)) {
          colorStreakCount++;
        } else {
          break;
        }
      }
    }

    // Hot and cold numbers
    const sortedNums = Object.entries(freqMap).sort((a, b) => b[1] - a[1]);
    const hotNumber = sortedNums[0] ? Number(sortedNums[0][0]) : 7;
    const coldNumber = sortedNums[sortedNums.length - 1] ? Number(sortedNums[sortedNums.length - 1][0]) : 2;

    const avgNumber = (sumNum / total).toFixed(1);

    // Frequency data for bar chart
    const frequencyData = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
      const count = freqMap[n] || 0;
      const pct = Math.round((count / total) * 100);
      let color = '#10b981';
      if (n === 0) color = '#9333ea';
      else if (n === 5) color = '#0d9488';
      else if ([2, 4, 6, 8].includes(n)) color = '#e11d48';

      return {
        number: n,
        name: `No. ${n}`,
        count,
        pct,
        fillColor: color,
        isHot: n === hotNumber,
        isCold: n === coldNumber
      };
    });

    // Distribution breakdown data
    const distributionData = [
      { name: 'Red', count: redCount, pct: Math.round((redCount / total) * 100), fill: '#e11d48' },
      { name: 'Green', count: greenCount, pct: Math.round((greenCount / total) * 100), fill: '#10b981' },
      { name: 'Violet', count: violetCount, pct: Math.round((violetCount / total) * 100), fill: '#9333ea' },
      { name: 'Big', count: bigCount, pct: Math.round((bigCount / total) * 100), fill: '#f59e0b' },
      { name: 'Small', count: smallCount, pct: Math.round((smallCount / total) * 100), fill: '#3b82f6' },
      { name: 'Even', count: evenCount, pct: Math.round((evenCount / total) * 100), fill: '#8b5cf6' },
      { name: 'Odd', count: oddCount, pct: Math.round((oddCount / total) * 100), fill: '#ec4899' },
    ];

    return {
      total,
      bigCount,
      smallCount,
      bigPct: Math.round((bigCount / total) * 100),
      smallPct: Math.round((smallCount / total) * 100),
      redCount,
      greenCount,
      violetCount,
      evenCount,
      oddCount,
      avgNumber,
      hotNumber,
      coldNumber,
      currentStreakType,
      currentStreakCount,
      colorStreakType,
      colorStreakCount,
      frequencyData,
      distributionData
    };
  }, [history, sampleRange]);

  return (
    <div className={`bg-gray-900/90 border border-amber-500/30 rounded-2xl p-3.5 sm:p-5 space-y-4 shadow-xl ${className}`}>
      {/* Top Header: Title, Controls, and Sample Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800/90 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-black text-white flex items-center gap-1.5">
              <span>Wingo Visual Trend Analyzer</span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Live Patterns
              </span>
            </div>
            <div className="text-[10px] text-gray-400">
              Interactive recharts visualization of winning trajectories and color distributions
            </div>
          </div>
        </div>

        {/* View Mode & Range Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Chart Mode Toggle */}
          <div className="flex bg-gray-950 p-0.5 rounded-xl border border-gray-800 text-[11px]">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setChartMode('trajectory');
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                chartMode === 'trajectory'
                  ? 'bg-amber-500 text-gray-950 shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Trajectory of winning numbers across rounds"
            >
              <Activity className="w-3 h-3" />
              <span>Trajectory</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setChartMode('frequency');
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                chartMode === 'frequency'
                  ? 'bg-amber-500 text-gray-950 shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="0–9 frequency breakdown"
            >
              <BarChart3 className="w-3 h-3" />
              <span>0–9 Freq</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setChartMode('distribution');
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                chartMode === 'distribution'
                  ? 'bg-amber-500 text-gray-950 shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Color and size distribution"
            >
              <Layers className="w-3 h-3" />
              <span>Distribution</span>
            </button>
          </div>

          {/* Sample Size Filter */}
          <div className="flex items-center bg-gray-950 px-1.5 py-0.5 rounded-xl border border-gray-800 text-[11px]">
            <span className="text-[10px] text-gray-500 font-bold mr-1 hidden sm:inline">Rounds:</span>
            {([15, 30, 50, 60] as SampleRange[]).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setSampleRange(range);
                }}
                className={`px-1.5 py-0.5 rounded-md font-mono font-bold transition text-[10px] ${
                  sampleRange === range
                    ? 'bg-gray-800 text-amber-400 font-black'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pattern Analytics Ribbon: Streaks, Big/Small ratio, Hot/Cold numbers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        {/* Active Streak Card */}
        <div className="bg-gray-950 p-2.5 sm:p-3 rounded-xl border border-gray-800/80 flex flex-col justify-between space-y-1">
          <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-500" /> Active Streaks
          </span>
          <div className="flex items-center gap-2">
            <span className={`font-mono font-black text-sm px-2 py-0.5 rounded-md ${
              analytics.currentStreakType === 'Big'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            }`}>
              {analytics.currentStreakCount}x {analytics.currentStreakType}
            </span>
            <span className={`font-mono text-xs font-bold ${
              analytics.colorStreakType === 'Red'
                ? 'text-rose-400'
                : analytics.colorStreakType === 'Green'
                ? 'text-emerald-400'
                : 'text-purple-400'
            }`}>
              {analytics.colorStreakCount}x {analytics.colorStreakType}
            </span>
          </div>
          <span className="text-[9px] text-gray-500">Live momentum counter</span>
        </div>

        {/* Big / Small Ratio Card */}
        <div className="bg-gray-950 p-2.5 sm:p-3 rounded-xl border border-gray-800/80 flex flex-col justify-between space-y-1">
          <span className="text-[10px] text-gray-400 font-medium flex items-center justify-between">
            <span>Big / Small Ratio</span>
            <span className="font-mono text-gray-500">{sampleRange}R</span>
          </span>
          <div className="font-mono font-black text-xs sm:text-sm flex items-center justify-between">
            <span className="text-amber-400">{analytics.bigPct}% Big</span>
            <span className="text-blue-400">{analytics.smallPct}% Small</span>
          </div>
          <div className="w-full bg-blue-950/60 h-1.5 rounded-full overflow-hidden flex border border-gray-800">
            <div className="bg-amber-500 h-full transition-all duration-500" style={{ width: `${analytics.bigPct}%` }} />
            <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${analytics.smallPct}%` }} />
          </div>
        </div>

        {/* Color Dominance Card */}
        <div className="bg-gray-950 p-2.5 sm:p-3 rounded-xl border border-gray-800/80 flex flex-col justify-between space-y-1">
          <span className="text-[10px] text-gray-400 font-medium">Color Dominance</span>
          <div className="font-mono font-bold text-xs flex items-center justify-between">
            <span className="text-rose-400">🔴 {analytics.redCount}</span>
            <span className="text-emerald-400">🟢 {analytics.greenCount}</span>
            <span className="text-purple-400">🟣 {analytics.violetCount}</span>
          </div>
          <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden flex border border-gray-800">
            <div className="bg-rose-500 h-full" style={{ width: `${Math.round((analytics.redCount / analytics.total) * 100)}%` }} />
            <div className="bg-emerald-500 h-full" style={{ width: `${Math.round((analytics.greenCount / analytics.total) * 100)}%` }} />
            <div className="bg-purple-500 h-full" style={{ width: `${Math.round((analytics.violetCount / analytics.total) * 100)}%` }} />
          </div>
        </div>

        {/* Hot / Cold / Mean Card */}
        <div className="bg-gray-950 p-2.5 sm:p-3 rounded-xl border border-gray-800/80 flex flex-col justify-between space-y-1">
          <span className="text-[10px] text-gray-400 font-medium flex items-center justify-between">
            <span>Hot &amp; Cold Digits</span>
            <span className="text-gray-400 text-[10px]">Avg: {analytics.avgNumber}</span>
          </span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              <Flame className="w-3 h-3 text-amber-500" />
              <span className="font-mono font-black text-amber-300 text-xs">{analytics.hotNumber} Hot</span>
            </div>
            <div className="flex items-center gap-1 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              <Snowflake className="w-3 h-3 text-cyan-400" />
              <span className="font-mono font-black text-cyan-300 text-xs">{analytics.coldNumber} Cold</span>
            </div>
          </div>
          <span className="text-[9px] text-gray-500">Based on past {sampleRange} draws</span>
        </div>
      </div>

      {/* Main Recharts Display Area */}
      <div className="bg-gray-950 p-3 sm:p-4 rounded-2xl border border-gray-800 relative">
        {/* MODE 1: TRAJECTORY AREA / LINE CHART */}
        {chartMode === 'trajectory' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between text-xs text-gray-400 px-1 gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-200 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-amber-400" />
                  Chronological Number Wave (Past → Present):
                </span>
                <span className="text-[10px] text-gray-500 font-mono">
                  Y-Axis: 0 to 9 Digits
                </span>
              </div>

              {/* Zone legend */}
              <div className="flex items-center gap-2.5 text-[11px] font-mono">
                <span className="flex items-center gap-1 text-amber-400">
                  <span className="w-2.5 h-2 rounded bg-amber-500/30 border border-amber-400" />
                  Big Zone (5-9)
                </span>
                <span className="flex items-center gap-1 text-blue-400">
                  <span className="w-2.5 h-2 rounded bg-blue-500/30 border border-blue-400" />
                  Small Zone (0-4)
                </span>
              </div>
            </div>

            {/* SVG Trajectory Chart Container */}
            <div className="w-full h-[270px] sm:h-[310px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 18, right: 12, left: -22, bottom: 6 }}
                >
                  <defs>
                    <linearGradient id="wingoTrajectoryGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />

                  {/* Visual Background Reference Areas for Big / Small */}
                  <ReferenceArea y1={4.5} y2={9} fill="#f59e0b" fillOpacity={0.04} />
                  <ReferenceArea y1={0} y2={4.5} fill="#3b82f6" fillOpacity={0.04} />

                  {/* Center Dividing Threshold */}
                  <ReferenceLine
                    y={4.5}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    opacity={0.7}
                  />

                  <XAxis
                    dataKey="shortPeriod"
                    stroke="#4b5563"
                    tick={{ fill: '#9ca3af', fontSize: 10, fontFamily: 'monospace' }}
                    tickLine={false}
                    interval={sampleRange > 30 ? 3 : sampleRange > 15 ? 1 : 0}
                  />

                  <YAxis
                    domain={[0, 9]}
                    ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]}
                    stroke="#4b5563"
                    tick={{ fill: '#d1d5db', fontSize: 10, fontFamily: 'monospace' }}
                    tickLine={false}
                    allowDecimals={false}
                  />

                  <Tooltip
                    content={<CustomTrendTooltip />}
                    cursor={{ stroke: '#f59e0b', strokeWidth: 1, strokeDasharray: '3 3' }}
                  />

                  <Area
                    type="monotone"
                    dataKey="number"
                    stroke="#f59e0b"
                    strokeWidth={2.2}
                    fill="url(#wingoTrajectoryGradient)"
                    dot={<CustomLotteryBallDot />}
                    activeDot={<CustomActiveDot />}
                    isAnimationActive={true}
                    animationDuration={600}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* MODE 2: 0–9 FREQUENCY BAR CHART */}
        {chartMode === 'frequency' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-400 px-1">
              <span className="font-bold text-gray-200 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                Digit Frequency in Past {sampleRange} Rounds:
              </span>
              <span className="text-[10px] text-gray-500 font-mono">
                Counts &amp; Percentages
              </span>
            </div>

            <div className="w-full h-[270px] sm:h-[310px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics.frequencyData}
                  margin={{ top: 15, right: 10, left: -22, bottom: 6 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#4b5563"
                    tick={{ fill: '#d1d5db', fontSize: 11, fontWeight: 'bold', fontFamily: 'monospace' }}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#4b5563"
                    tick={{ fill: '#9ca3af', fontSize: 10, fontFamily: 'monospace' }}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0]?.payload;
                        if (!d) return null;
                        return (
                          <div className="bg-gray-950/95 border border-amber-500/40 p-3 rounded-xl shadow-xl text-xs space-y-1 backdrop-blur-md">
                            <div className="font-bold text-white flex items-center gap-2">
                              <span>Number {d.number}</span>
                              {d.isHot && (
                                <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-[9px] font-black">
                                  HOT
                                </span>
                              )}
                              {d.isCold && (
                                <span className="px-1.5 py-0.2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded text-[9px] font-black">
                                  COLD
                                </span>
                              )}
                            </div>
                            <div className="text-gray-300">
                              Drawn: <span className="font-bold text-amber-400 font-mono">{d.count} times</span> ({d.pct}% of rounds)
                            </div>
                            <div className="text-[10px] text-gray-500">
                              Color: {[1,3,7,9].includes(d.number) ? 'Green' : [2,4,6,8].includes(d.number) ? 'Red' : d.number === 0 ? 'Red+Violet' : 'Green+Violet'}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {analytics.frequencyData.map((entry) => (
                      <Cell key={`freq-cell-${entry.number}`} fill={entry.fillColor} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* MODE 3: DISTRIBUTION BAR CHART */}
        {chartMode === 'distribution' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-400 px-1">
              <span className="font-bold text-gray-200 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                Category Distribution &amp; Flow (Past {sampleRange} Rounds):
              </span>
              <span className="text-[10px] text-gray-500 font-mono">
                Comparative Win Rates
              </span>
            </div>

            <div className="w-full h-[270px] sm:h-[310px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics.distributionData}
                  margin={{ top: 15, right: 10, left: -22, bottom: 6 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#4b5563"
                    tick={{ fill: '#d1d5db', fontSize: 11, fontWeight: 'bold' }}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#4b5563"
                    tick={{ fill: '#9ca3af', fontSize: 10, fontFamily: 'monospace' }}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0]?.payload;
                        if (!d) return null;
                        return (
                          <div className="bg-gray-950/95 border border-amber-500/40 p-3 rounded-xl shadow-xl text-xs space-y-1 backdrop-blur-md">
                            <div className="font-bold text-white">{d.name} Outcome</div>
                            <div className="text-gray-300">
                              Frequency: <span className="font-bold text-amber-400 font-mono">{d.count} rounds</span> ({d.pct}%)
                            </div>
                            <div className="text-[10px] text-gray-500">
                              Based on last {sampleRange} consecutive draws
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {analytics.distributionData.map((entry) => (
                      <Cell key={`dist-cell-${entry.name}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Quick Legend Footer */}
        <div className="pt-3 border-t border-gray-800/80 flex flex-wrap items-center justify-between text-[11px] text-gray-400 gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1 text-gray-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Green: 1, 3, 7, 9 (2x)
            </span>
            <span className="flex items-center gap-1 text-gray-300">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              Red: 2, 4, 6, 8 (2x)
            </span>
            <span className="flex items-center gap-1 text-gray-300">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              Violet: 0 (Red+V), 5 (Grn+V) (4.5x)
            </span>
          </div>

          {onSelectBet && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-500">Quick Bet:</span>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  onSelectBet('Green');
                }}
                className="px-2 py-0.5 rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold cursor-pointer"
              >
                Green
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  onSelectBet('Red');
                }}
                className="px-2 py-0.5 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-400 border border-rose-500/30 text-[10px] font-bold cursor-pointer"
              >
                Red
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  onSelectBet('Big');
                }}
                className="px-2 py-0.5 rounded bg-amber-950/80 hover:bg-amber-900 text-amber-400 border border-amber-500/30 text-[10px] font-bold cursor-pointer"
              >
                Big
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  onSelectBet('Small');
                }}
                className="px-2 py-0.5 rounded bg-blue-950/80 hover:bg-blue-900 text-blue-400 border border-blue-500/30 text-[10px] font-bold cursor-pointer"
              >
                Small
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
