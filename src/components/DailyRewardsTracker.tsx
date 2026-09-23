import React, { useState, useEffect, useMemo } from 'react';
import { 
  Flame, 
  Sparkles, 
  Gift, 
  CheckCircle2, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Award, 
  Coins, 
  ArrowRight,
  TrendingUp,
  Clock,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth, DAILY_REWARD_SCHEDULE, DAILY_CHECKIN_MIN_DEPOSIT, getLocalDateString } from '../context/AuthContext';
import { triggerHaptic } from '../utils/haptics';

interface DailyRewardsTrackerProps {
  onOpenWallet?: (tab?: 'deposit' | 'withdraw') => void;
}

export const DailyRewardsTracker: React.FC<DailyRewardsTrackerProps> = ({ onOpenWallet }) => {
  const { 
    profile, 
    claimDailyBonus, 
    redeemBonusPoints, 
    isDailyClaimedToday,
    todayDepositAmount,
    todayPendingDepositAmount,
    isDailyClaimEligible
  } = useAuth();

  const [loadingClaim, setLoadingClaim] = useState(false);
  const [claimSuccessData, setClaimSuccessData] = useState<{
    cash: number;
    streak: number;
    points?: number;
  } | null>(null);

  // Time remaining until next local midnight reset
  const [timeLeftToMidnight, setTimeLeftToMidnight] = useState<string>('');
  
  // Calendar month state
  const [viewDate, setViewDate] = useState<Date>(() => new Date());

  // Points redemption modal state
  const [isRedeemOpen, setIsRedeemOpen] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(100);
  const [redeemStatus, setRedeemStatus] = useState<string | null>(null);

  const streak = profile?.dailyStreak || 0;
  const bonusPoints = profile?.bonusPoints || 0;
  const checkInHistory = useMemo(() => profile?.checkInHistory || [], [profile?.checkInHistory]);
  const todayStr = getLocalDateString();

  // Next projected reward day in cycle (1 to 7)
  const currentCycleDay = useMemo(() => {
    if (isDailyClaimedToday) {
      return ((streak - 1) % 7) + 1;
    }
    return (streak % 7) + 1;
  }, [isDailyClaimedToday, streak]);

  const projectedReward = DAILY_REWARD_SCHEDULE[currentCycleDay - 1] || DAILY_REWARD_SCHEDULE[0];

  // Countdown timer to midnight
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diffMs = midnight.getTime() - now.getTime();

      if (diffMs <= 0) {
        setTimeLeftToMidnight('00:00:00');
        return;
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      setTimeLeftToMidnight(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Claim handler
  const handleClaim = async () => {
    if (isDailyClaimedToday || loadingClaim) return;
    setLoadingClaim(true);
    triggerHaptic('heavy');

    try {
      const res = await claimDailyBonus();
      if (res.success) {
        triggerHaptic('success');
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 }
        });
        setClaimSuccessData({
          cash: res.cashBonus || 0,
          streak: res.streak || 1
        });
      } else {
        alert(res.message);
      }
    } catch (err: any) {
      console.error('Error claiming daily bonus:', err);
      alert('Failed to claim daily reward. Please try again.');
    } finally {
      setLoadingClaim(false);
    }
  };

  // Redeem points handler
  const handleRedeemPoints = async () => {
    if (pointsToRedeem <= 0 || pointsToRedeem > bonusPoints) return;
    setRedeemStatus(null);
    triggerHaptic('medium');
    const res = await redeemBonusPoints(pointsToRedeem);
    setRedeemStatus(res.message);
    if (res.success) {
      triggerHaptic('success');
      confetti({ particleCount: 50, spread: 50 });
      setTimeout(() => {
        setIsRedeemOpen(false);
        setRedeemStatus(null);
      }, 1600);
    }
  };

  // Calendar calculations for viewDate
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];

    // Empty cells for alignment
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ dayNumber: 0, dateStr: '', isCurrentMonth: false });
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const monthStr = String(month + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const dateStr = `${year}-${monthStr}-${dayStr}`;
      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isCheckedIn: checkInHistory.includes(dateStr)
      });
    }

    return days;
  }, [viewDate, checkInHistory, todayStr]);

  const monthYearLabel = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const totalMonthlyCheckedIn = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = String(viewDate.getMonth() + 1).padStart(2, '0');
    const prefix = `${year}-${month}`;
    return checkInHistory.filter(d => d.startsWith(prefix)).length;
  }, [viewDate, checkInHistory]);

  const daysInCurrentViewMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();

  return (
    <div id="daily-rewards-container" className="space-y-4">
      {/* Daily Rewards Main Showcase Card */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-950 to-black border-2 border-amber-500/40 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-red-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-red-500 rounded-2xl text-black shadow-lg shadow-amber-500/20">
              <Flame className="w-5 h-5 fill-black text-black" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-black text-white text-base tracking-tight">Daily Streak Rewards</h3>
                <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black rounded-md uppercase">
                  VIP Club
                </span>
              </div>
              <p className="text-[11px] text-gray-400">Check in daily for real cash rewards directly into your wallet</p>
            </div>
          </div>

          {/* Points Balance Pill */}
          <div 
            onClick={() => {
              triggerHaptic('light');
              setIsRedeemOpen(true);
            }}
            className="flex flex-col items-end cursor-pointer group"
            title="Click to exchange points for cash"
          >
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 rounded-xl group-hover:border-amber-400 transition shadow-inner">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-black text-amber-300 font-mono">
                {bonusPoints.toLocaleString()} Pts
              </span>
            </div>
            <span className="text-[10px] text-amber-400/80 mt-0.5 flex items-center gap-0.5 group-hover:underline">
              <span>Exchange</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </span>
          </div>
        </div>

        {/* Current Streak & Status Banner */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {/* Active Streak */}
          <div className="bg-gray-950/80 border border-amber-500/25 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/30 shrink-0">
              <Flame className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Current Streak</div>
              <div className="text-xl font-black text-amber-400 tracking-tight leading-none mt-0.5">
                {streak} {streak === 1 ? 'Day' : 'Days'}
              </div>
            </div>
          </div>

          {/* Next Reward Preview */}
          <div className="bg-gray-950/80 border border-gray-800 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                {isDailyClaimedToday ? 'Tomorrow' : 'Available Now'}
              </div>
              <div className="text-sm font-black text-emerald-400 tracking-tight leading-none mt-1 font-mono">
                ₹{projectedReward.cash} Cash Reward
              </div>
            </div>
          </div>
        </div>

        {/* 7-Day Cycle Roadmap */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-gray-400 font-bold mb-2">
            <span>7-Day Streak Roadmap</span>
            <span className="text-amber-400 text-[11px]">
              Day {currentCycleDay} of 7
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {DAILY_REWARD_SCHEDULE.map((item) => {
              const isPastCompleted = isDailyClaimedToday
                ? item.day <= currentCycleDay
                : item.day < currentCycleDay;

              const isCurrent = isDailyClaimedToday
                ? item.day === currentCycleDay
                : item.day === currentCycleDay;

              return (
                <div
                  key={item.day}
                  className={`relative rounded-xl p-1.5 flex flex-col items-center justify-between text-center transition-all ${
                    isPastCompleted
                      ? 'bg-emerald-950/50 border border-emerald-500/40 text-emerald-300'
                      : isCurrent
                      ? 'bg-gradient-to-b from-amber-500/20 to-red-500/20 border-2 border-amber-400 text-amber-300 shadow-md shadow-amber-500/20 scale-[1.03]'
                      : 'bg-gray-950/60 border border-gray-800 text-gray-500'
                  }`}
                >
                  <span className="text-[9px] font-bold">D{item.day}</span>
                  
                  <div className="my-1">
                    {isPastCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                    ) : item.day === 7 ? (
                      <Gift className="w-4 h-4 text-amber-400 mx-auto animate-bounce" />
                    ) : (
                      <Coins className={`w-3.5 h-3.5 mx-auto ${isCurrent ? 'text-amber-400' : 'text-gray-600'}`} />
                    )}
                  </div>

                  <span className="text-[9px] font-extrabold font-mono text-amber-400">
                    ₹{item.cash}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Claim Action Button */}
        {isDailyClaimedToday ? (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="font-extrabold text-emerald-300">Checked In Today!</div>
                <div className="text-[11px] text-emerald-400/80">
                  Next check-in unlocks at midnight
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 px-3 py-1 bg-black/40 border border-emerald-500/30 rounded-xl text-xs font-mono font-bold text-amber-400">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{timeLeftToMidnight || '00:00:00'}</span>
            </div>
          </div>
        ) : isDailyClaimEligible ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1 text-[11px] text-emerald-400 font-bold">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Daily Deposit Met (₹{todayDepositAmount.toLocaleString()} today)
              </span>
              <span className="text-gray-400">Ready to Claim</span>
            </div>
            <button
              id="claim-daily-reward-btn"
              type="button"
              disabled={loadingClaim}
              onClick={handleClaim}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:to-red-400 active:scale-[0.99] text-gray-950 font-black text-sm rounded-2xl shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {loadingClaim ? (
                <div className="w-5 h-5 border-2 border-gray-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Gift className="w-5 h-5 text-gray-950" />
                  <span>Claim Day {currentCycleDay} Reward (₹{projectedReward.cash} Cash)</span>
                  <Sparkles className="w-4 h-4 text-gray-950" />
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-3 bg-gray-950/70 border border-amber-500/30 rounded-2xl p-3.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-black text-amber-300">
                <Gift className="w-4 h-4 text-amber-400" />
                <span>Daily Deposit Requirement</span>
              </div>
              <span className="font-mono text-[11px] font-extrabold text-white">
                ₹{todayDepositAmount.toLocaleString()} / ₹{DAILY_CHECKIN_MIN_DEPOSIT.toLocaleString()}
              </span>
            </div>

            {/* Deposit Progress Bar */}
            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-red-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.round((todayDepositAmount / DAILY_CHECKIN_MIN_DEPOSIT) * 100))}%`
                }}
              />
            </div>

            {todayPendingDepositAmount > 0 ? (
              <div className="p-2.5 bg-amber-950/40 border border-amber-500/40 rounded-xl text-xs text-amber-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                <div>
                  <span className="font-bold">Deposit Pending Verification:</span> ₹{todayPendingDepositAmount.toLocaleString()} recharge is currently under Admin review. Reward unlocks immediately upon approval.
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-gray-400 leading-tight">
                Deposit at least ₹{DAILY_CHECKIN_MIN_DEPOSIT} today to unlock your Day {currentCycleDay} reward (₹{projectedReward.cash} Cash)!
              </p>
            )}

            <div className="flex gap-2">
              <button
                id="recharge-to-claim-btn"
                type="button"
                onClick={() => {
                  triggerHaptic('medium');
                  if (onOpenWallet) {
                    onOpenWallet('deposit');
                  } else {
                    handleClaim();
                  }
                }}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-400 hover:to-red-400 active:scale-[0.99] text-gray-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Coins className="w-4 h-4 text-gray-950" />
                <span>Recharge ₹{Math.max(100, DAILY_CHECKIN_MIN_DEPOSIT - todayDepositAmount)} to Claim</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-950" />
              </button>

              <button
                type="button"
                disabled={loadingClaim}
                onClick={handleClaim}
                className="py-3 px-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs rounded-xl transition cursor-pointer"
                title="Attempt claim or check eligibility"
              >
                Check
              </button>
            </div>
          </div>
        )}

        {/* Claim Success Celebration Banner */}
        {claimSuccessData && (
          <div className="mt-3 p-3.5 bg-gradient-to-r from-emerald-950 via-gray-950 to-amber-950 border border-emerald-500/50 rounded-2xl flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-black text-emerald-300">
                  ₹{claimSuccessData.cash.toFixed(2)} Cash Credited to Wallet!
                </div>
                <div className="text-[10px] text-gray-400">
                  Streak extended to {claimSuccessData.streak} days!
                </div>
              </div>
            </div>
            <button
              onClick={() => setClaimSuccessData(null)}
              className="text-xs text-gray-400 hover:text-white px-2 py-1 bg-gray-800 rounded-lg"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Calendar Streak Tracker Card */}
      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-5 shadow-xl space-y-4">
        {/* Calendar Header with month navigator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-amber-400" />
            <h4 className="font-bold text-white text-sm">Attendance Calendar</h4>
          </div>

          <div className="flex items-center gap-1 bg-gray-950 border border-gray-800 rounded-xl px-2 py-1">
            <button
              id="prev-month-btn"
              onClick={() => {
                triggerHaptic('light');
                setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
              }}
              className="p-1 hover:text-white text-gray-400 rounded transition"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-bold text-gray-200 px-1 font-mono min-w-[100px] text-center">
              {monthYearLabel}
            </span>

            <button
              id="next-month-btn"
              onClick={() => {
                triggerHaptic('light');
                setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
              }}
              className="p-1 hover:text-white text-gray-400 rounded transition"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 uppercase">
          <div>Su</div>
          <div>Mo</div>
          <div>Tu</div>
          <div>We</div>
          <div>Th</div>
          <div>Fr</div>
          <div>Sa</div>
        </div>

        {/* Calendar Dates Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((item, idx) => {
            if (!item.isCurrentMonth) {
              return <div key={`empty-${idx}`} className="h-9 rounded-xl opacity-0" />;
            }

            const isChecked = item.isCheckedIn;
            const isToday = item.isToday;

            return (
              <div
                key={item.dateStr}
                className={`h-9 rounded-xl flex flex-col items-center justify-center text-xs font-bold transition relative ${
                  isChecked
                    ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-sm shadow-emerald-600/30'
                    : isToday
                    ? 'bg-amber-500/20 border-2 border-amber-400 text-amber-300 animate-pulse'
                    : 'bg-gray-950/70 border border-gray-800/80 text-gray-400'
                }`}
              >
                <span>{item.dayNumber}</span>
                {isChecked && (
                  <div className="absolute -bottom-0.5 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
                {isToday && !isChecked && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-ping" />
                )}
              </div>
            );
          })}
        </div>

        {/* Calendar Footer Summary */}
        <div className="pt-3 border-t border-gray-800 flex items-center justify-between text-[11px] text-gray-400">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span>Checked In</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
              <span>Today</span>
            </div>
          </div>

          <div className="font-semibold text-gray-300">
            Attendance: <span className="text-amber-400 font-bold">{totalMonthlyCheckedIn}</span>/{daysInCurrentViewMonth} days
          </div>
        </div>
      </div>

      {/* Points Redemption Modal */}
      {isRedeemOpen && (
        <div 
          id="points-exchange-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
        >
          <div 
            id="points-exchange-modal-card"
            className="w-full max-w-sm bg-gray-900 border border-amber-500/40 rounded-3xl p-5 text-white shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-sm">Bonus Points Exchange</h3>
              </div>
              <button
                onClick={() => setIsRedeemOpen(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-gray-950 border border-gray-800 rounded-2xl flex items-center justify-between">
              <div>
                <div className="text-[10px] text-gray-400 uppercase font-bold">Your Available Points</div>
                <div className="text-xl font-black text-amber-400 font-mono mt-0.5">
                  {bonusPoints.toLocaleString()} Pts
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-gray-400 uppercase font-bold">Exchange Rate</div>
                <div className="text-xs font-bold text-emerald-400 mt-0.5">
                  10 Pts = ₹1.00
                </div>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-300 font-bold">Select Points to Convert:</label>
              <div className="grid grid-cols-4 gap-2">
                {[100, 250, 500, Math.floor(bonusPoints / 10) * 10].map((amt, idx) => {
                  const isValid = amt > 0 && amt <= bonusPoints;
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={!isValid}
                      onClick={() => setPointsToRedeem(amt)}
                      className={`py-2 px-1 text-xs font-black rounded-xl border transition ${
                        pointsToRedeem === amt
                          ? 'bg-amber-500 text-black border-amber-400 shadow-md'
                          : isValid
                          ? 'bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700'
                          : 'bg-gray-950 text-gray-600 border-gray-800 cursor-not-allowed'
                      }`}
                    >
                      {idx === 3 ? 'Max' : `${amt}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Conversion Result Preview */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs">
              <span className="text-gray-300">You will receive:</span>
              <span className="font-mono font-black text-amber-300 text-sm">
                ₹{(Math.floor(pointsToRedeem / 10)).toFixed(2)} Cash
              </span>
            </div>

            {redeemStatus && (
              <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 text-center font-medium">
                {redeemStatus}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsRedeemOpen(false)}
                className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                id="confirm-redeem-points-btn"
                type="button"
                disabled={pointsToRedeem <= 0 || pointsToRedeem > bonusPoints}
                onClick={handleRedeemPoints}
                className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-gray-950 font-black text-xs rounded-xl shadow-md transition"
              >
                Confirm Exchange
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
