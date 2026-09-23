import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Shield, CreditCard, Clock, LogOut, ChevronRight, Award, Headphones, Download, Smartphone, Vibrate, Coins, Crown, BookOpen, Volume2, VolumeX, Sparkles, Bell } from 'lucide-react';
import { isHapticEnabled, setHapticEnabled, triggerHaptic } from '../utils/haptics';
import { 
  isSoundEnabled, 
  setSoundEnabled, 
  getSoundVolume, 
  setSoundVolume, 
  playClickSound, 
  playChipSound, 
  playWinSound, 
  playBigWinSound, 
  playDepositSound, 
  playWithdrawSound 
} from '../utils/audio';
import { DailyRewardsTracker } from './DailyRewardsTracker';
import { VipProgressTracker } from './VipProgressTracker';
import { WeeklyPerformanceChart } from './WeeklyPerformanceChart';
import { AdminConsoleModal } from './AdminConsoleModal';
import { CategoryDefinitionModal } from './CategoryDefinitionModal';
import { ErrorBoundary } from './ErrorBoundary';

interface AccountViewProps {
  onOpenWallet: (tab?: 'deposit' | 'withdraw') => void;
  onOpenAuth: () => void;
  onSelectGame?: (game: 'wingo' | 'aviator' | 'k3' | 'trx' | 'slots') => void;
  onTestInactivityWarning?: () => void;
  onOpenSupport?: () => void;
  onDownloadApp?: () => void;
  onOpenAdminHub?: () => void;
}

export const AccountView: React.FC<AccountViewProps> = ({ 
  onOpenWallet, 
  onOpenAuth, 
  onSelectGame, 
  onTestInactivityWarning,
  onOpenSupport,
  onDownloadApp,
  onOpenAdminHub
}) => {
  const { user, profile, isAdmin, logout, transactions, pendingRequestsCount, triggerBetNotification } = useAuth();
  const [hapticsOn, setHapticsOn] = useState<boolean>(isHapticEnabled());
  const [soundOn, setSoundOn] = useState<boolean>(isSoundEnabled());
  const [soundVolumeLevel, setSoundVolumeLevel] = useState<number>(() => Math.round(getSoundVolume() * 100));
  const [showAdminConsole, setShowAdminConsole] = useState<boolean>(false);
  const [showCategoriesGuide, setShowCategoriesGuide] = useState<boolean>(false);

  const handleToggleHaptics = () => {
    const next = !hapticsOn;
    setHapticsOn(next);
    setHapticEnabled(next);
    if (next) {
      triggerHaptic('success');
    }
  };

  const handleTestHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'error') => {
    triggerHaptic(type);
  };

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    triggerHaptic('selection');
    if (next) {
      playWinSound();
    }
  };

  const handleVolumeChange = (newVal: number) => {
    setSoundVolumeLevel(newVal);
    setSoundVolume(newVal / 100);
    playClickSound();
  };

  return (
    <div className="space-y-4">
      {/* Profile Header Card */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-black border border-amber-500/20 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-amber-500/20">
            {profile?.displayName ? profile.displayName[0].toUpperCase() : 'U'}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-black text-white truncate">
                {profile?.displayName || 'Guest Player'}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-black text-amber-300">
                VIP {profile?.vipLevel || 1}
              </span>
              {isAdmin && (
                <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/30 to-red-500/30 border border-amber-500/60 text-[10px] font-black text-amber-300 flex items-center gap-1 shadow-sm">
                  <Crown className="w-3 h-3 text-amber-400" /> SUPER ADMIN
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400 font-mono">
              <span className="truncate max-w-[170px]">{profile?.email || (profile?.uid ? profile.uid.slice(0, 10) : '000000')}</span>
              <span className="text-gray-600">•</span>
              <span className="text-amber-400 font-semibold">{profile?.referralCode || 'WINX786'}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/15 border border-amber-500/30 rounded-md text-[11px] font-bold text-amber-300">
                <Coins className="w-3 h-3 text-amber-400" />
                <span>{(profile?.bonusPoints || 0).toLocaleString()} Bonus Pts</span>
              </div>
              <div className="px-2 py-0.5 bg-orange-500/15 border border-orange-500/30 rounded-md text-[11px] font-bold text-orange-300">
                🔥 {profile?.dailyStreak || 0}d Streak
              </div>
            </div>
          </div>

          {!user && (
            <button
              onClick={() => {
                triggerHaptic('light');
                onOpenAuth();
              }}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold rounded-xl text-xs transition"
            >
              Login
            </button>
          )}
        </div>

        {/* Balance Showcase */}
        <div className="mt-5 p-4 bg-gray-950/80 border border-gray-800 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400">Total Wallet Balance</div>
            <div className="text-2xl font-black text-amber-400 tracking-tight mt-0.5">
              ₹{profile ? profile.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              id="account-deposit-btn"
              onClick={() => {
                triggerHaptic('light');
                onOpenWallet('deposit');
              }}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold rounded-xl text-xs shadow-md"
            >
              Deposit
            </button>
            <button
              id="account-withdraw-btn"
              onClick={() => {
                triggerHaptic('light');
                onOpenWallet('withdraw');
              }}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-bold rounded-xl text-xs shadow-md"
            >
              Withdraw
            </button>
          </div>
        </div>
      </div>

      {/* Super Admin Master Control Hub Banner */}
      {isAdmin && (
        <div
          onClick={() => {
            triggerHaptic('heavy');
            if (onOpenAdminHub) {
              onOpenAdminHub();
            } else {
              setShowAdminConsole(true);
            }
          }}
          className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 p-[1.5px] rounded-2xl cursor-pointer shadow-xl hover:scale-[1.01] transition"
        >
          <div className="bg-gray-950 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-inner">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-white tracking-wide">
                    Master Admin & Support Center
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-gray-950 font-black text-[9px] uppercase">
                    SPECIAL
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Wingo Outcome Oracle, User Support Queries & Risk Controls
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
              <span>Enter Hub</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}

      {/* VIP Level Progress Tracker */}
      <VipProgressTracker />

      {/* Weekly Performance & Net P&L Chart (Recharts) */}
      <ErrorBoundary fallbackTitle="Weekly Performance Chart" fallbackMessage="Unable to display the chart at this moment.">
        <WeeklyPerformanceChart />
      </ErrorBoundary>

      {/* Daily Rewards & Streak Calendar Tracker */}
      <DailyRewardsTracker onOpenWallet={onOpenWallet} />

      {/* Game Audio & Sound Effects Setting Card */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border transition ${
              soundOn 
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
                : 'bg-gray-800 text-gray-500 border-gray-700'
            }`}>
              {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-white">Game Audio &amp; Sound FX</h4>
                <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                  soundOn ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-400'
                }`}>
                  {soundOn ? 'ENABLED' : 'MUTED'}
                </span>
              </div>
              <p className="text-[11px] text-gray-400">Audio feedback for button clicks, win animations &amp; transaction alerts</p>
            </div>
          </div>
          <button
            id="toggle-sound-btn"
            onClick={handleToggleSound}
            className={`w-12 h-6 rounded-full transition p-0.5 flex items-center cursor-pointer ${
              soundOn ? 'bg-amber-500 justify-end' : 'bg-gray-700 justify-start'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-white shadow-md transform transition" />
          </button>
        </div>

        {soundOn && (
          <div className="space-y-3 pt-2 border-t border-gray-800">
            {/* Volume slider */}
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="text-gray-400 text-[11px] font-medium shrink-0 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                FX Volume:
              </span>
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={soundVolumeLevel}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="w-full accent-amber-500 h-1.5 bg-gray-800 rounded-lg cursor-pointer"
                />
                <span className="text-[11px] font-mono font-bold text-amber-400 w-8 text-right">
                  {soundVolumeLevel}%
                </span>
              </div>
            </div>

            {/* Test Audio Feedback Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pt-1">
              <span className="text-gray-400 shrink-0 font-medium">Test Sound:</span>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  playClickSound();
                }}
                className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium border border-gray-700 transition"
              >
                Tap Click
              </button>
              <button
                onClick={() => {
                  triggerHaptic('selection');
                  playChipSound();
                }}
                className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium border border-gray-700 transition"
              >
                Casino Chip
              </button>
              <button
                onClick={() => {
                  triggerHaptic('success');
                  playWinSound();
                }}
                className="px-2.5 py-1 bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 rounded-lg font-medium border border-emerald-700/50 transition"
              >
                Win Chime
              </button>
              <button
                onClick={() => {
                  triggerHaptic('success');
                  playBigWinSound();
                }}
                className="px-2.5 py-1 bg-amber-950/70 hover:bg-amber-900 text-amber-300 rounded-lg font-medium border border-amber-700/50 transition"
              >
                Big Win Fanfare
              </button>
              <button
                onClick={() => {
                  triggerHaptic('success');
                  playDepositSound();
                }}
                className="px-2.5 py-1 bg-indigo-950/70 hover:bg-indigo-900 text-indigo-300 rounded-lg font-medium border border-indigo-700/50 transition"
              >
                Coins / Deposit
              </button>
              <button
                onClick={() => {
                  triggerHaptic('selection');
                  playWithdrawSound();
                }}
                className="px-2.5 py-1 bg-rose-950/70 hover:bg-rose-900 text-rose-300 rounded-lg font-medium border border-rose-700/50 transition"
              >
                Withdraw Alert
              </button>
              <button
                id="test-win-popup-btn"
                onClick={() => triggerBetNotification(true, 194.00)}
                className="px-2.5 py-1 bg-gradient-to-r from-emerald-600/30 to-amber-500/30 hover:from-emerald-600/40 hover:to-amber-500/40 text-amber-300 rounded-lg font-bold border border-amber-500/40 transition flex items-center gap-1"
                title="Preview 3s Win Notification"
              >
                <span>🎉 Preview Win Pop-up</span>
              </button>
              <button
                id="test-lost-popup-btn"
                onClick={() => triggerBetNotification(false)}
                className="px-2.5 py-1 bg-red-950/70 hover:bg-red-900 text-red-300 rounded-lg font-bold border border-red-700/50 transition"
                title="Preview 3s Lost Notification"
              >
                <span>Preview Lost Pop-up</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tactile & Haptics Setting Card */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-600/20 text-red-400 rounded-xl border border-red-500/30">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Mobile Haptic Feedback</h4>
              <p className="text-[11px] text-gray-400">Vibration &amp; tactile response on button taps and bet results</p>
            </div>
          </div>
          <button
            id="toggle-haptics-btn"
            onClick={handleToggleHaptics}
            className={`w-12 h-6 rounded-full transition p-0.5 flex items-center ${
              hapticsOn ? 'bg-emerald-500 justify-end' : 'bg-gray-700 justify-start'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-white shadow-md transform transition" />
          </button>
        </div>

        {hapticsOn && (
          <div className="pt-2 border-t border-gray-800 flex items-center gap-1.5 overflow-x-auto text-[11px]">
            <span className="text-gray-400 shrink-0 font-medium">Test Haptic:</span>
            <button
              onClick={() => handleTestHaptic('light')}
              className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium border border-gray-700"
            >
              Light Tap
            </button>
            <button
              onClick={() => handleTestHaptic('medium')}
              className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium border border-gray-700"
            >
              Medium
            </button>
            <button
              onClick={() => handleTestHaptic('heavy')}
              className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium border border-gray-700"
            >
              Heavy
            </button>
            <button
              onClick={() => handleTestHaptic('success')}
              className="px-2.5 py-1 bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 rounded-lg font-medium border border-emerald-700/50"
            >
              Win Pulse
            </button>
          </div>
        )}
      </div>

      {/* Transaction History Section */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 shadow-xl space-y-3">
        <h3 className="font-bold text-white text-sm flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          Recent Wallet Transactions
        </h3>

        {transactions.length === 0 ? (
          <div className="text-center py-6 text-xs text-gray-500">
            No transactions yet. Recharge or withdraw to see activity.
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.slice(0, 5).map((t) => (
              <div
                key={t.id || t.txId}
                className="p-3 bg-gray-950 border border-gray-800 rounded-xl flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-white uppercase flex items-center gap-1.5">
                    <span>{t.type}</span>
                    <span className="text-[10px] text-gray-400 font-normal">({t.channel})</span>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    {new Date(t.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`font-black ${
                      t.type === 'deposit' || t.type === 'bonus' ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {t.type === 'deposit' || t.type === 'bonus' ? `+₹${t.amount}` : `-₹${t.amount}`}
                  </div>
                  <div className="text-[10px] font-medium capitalize">
                    {t.status === 'completed' && <span className="text-emerald-400">Completed</span>}
                    {(t.status === 'pending' || t.status === 'processing') && (
                      <span className="text-amber-400 font-semibold animate-pulse">Pending Verification</span>
                    )}
                    {t.status === 'rejected' && <span className="text-red-400 font-semibold">Rejected</span>}
                    {!['completed', 'pending', 'processing', 'rejected'].includes(t.status) && (
                      <span className="text-gray-400">{t.status}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin Quick Console Access */}
      {isAdmin && (
        <div 
          onClick={() => {
            triggerHaptic('medium');
            setShowAdminConsole(true);
          }}
          className="p-4 bg-gradient-to-r from-amber-600/25 via-red-600/20 to-gray-950 border border-amber-500/50 hover:border-amber-400 rounded-2xl flex items-center justify-between cursor-pointer transition shadow-xl shadow-amber-500/10"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-gray-950 font-black shadow-md relative">
              <Crown className="w-5 h-5" />
              {pendingRequestsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 border border-black animate-ping" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-amber-400">Admin Verification Console</span>
                {pendingRequestsCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-gray-950 text-[10px] font-black animate-pulse">
                    {pendingRequestsCount} PENDING
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-[9px] font-bold text-emerald-400">ACTIVE</span>
                )}
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">
                User activity, wallet adjustments, real liquidity &amp; approvals
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-amber-400" />
        </div>
      )}

      {/* Quick Menu Options */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl divide-y divide-gray-800/80">
        <div 
          id="account-categories-guide-btn"
          onClick={() => {
            triggerHaptic('light');
            setShowCategoriesGuide(true);
          }}
          className="p-3.5 flex items-center justify-between text-xs hover:bg-gray-800/40 cursor-pointer"
        >
          <div className="flex items-center gap-3 text-amber-400 font-semibold">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Game Categories Definition &amp; Payout Guide</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-amber-400 font-bold">
            <span>View</span>
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </div>
        </div>

        <div 
          onClick={() => {
            triggerHaptic('light');
            alert('VIP Privileges: Level 1 gives 0.6% daily betting rebate and 1.2x recharge bonus!');
          }}
          className="p-3.5 flex items-center justify-between text-xs hover:bg-gray-800/40 cursor-pointer"
        >
          <div className="flex items-center gap-3 text-gray-300 font-semibold">
            <Award className="w-4 h-4 text-amber-400" />
            <span>VIP Club Privileges</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </div>


        <div 
          id="account-customer-support-row"
          onClick={() => {
            triggerHaptic('medium');
            if (onOpenSupport) {
              onOpenSupport();
            } else {
              alert('WinXbet 24/7 Live Support connected.');
            }
          }}
          className="p-3.5 flex items-center justify-between text-xs hover:bg-gray-800/40 cursor-pointer"
        >
          <div className="flex items-center gap-3 text-gray-300 font-semibold">
            <Headphones className="w-4 h-4 text-amber-400" />
            <span>24/7 Live Customer Service &amp; Help Desk</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Chat</span>
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </div>
        </div>

        {/* Security Auto-Logout Inactivity Protection */}
        <div 
          id="account-security-inactivity-row"
          className="p-3.5 flex items-center justify-between text-xs bg-gray-900/40 hover:bg-gray-800/40"
        >
          <div className="flex items-center gap-3 text-gray-300 font-semibold">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-white">Session Security &amp; Auto-Logout</span>
                <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-bold">15 MINS</span>
              </div>
              <p className="text-[10px] text-gray-400 font-normal">
                Auto-terminates session with 60s warning if idle
              </p>
            </div>
          </div>
          {onTestInactivityWarning && (
            <button
              id="test-inactivity-warning-btn"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic('medium');
                onTestInactivityWarning();
              }}
              className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-[10px] font-black text-amber-300 transition shrink-0 active:scale-95"
              title="Preview the 15-minute inactivity warning countdown"
            >
              Test Warning
            </button>
          )}
        </div>

        <div 
          onClick={() => {
            triggerHaptic('medium');
            if (onDownloadApp) {
              onDownloadApp();
            } else {
              alert('Official WinXbet Android APK download initialized!');
            }
          }}
          className="p-3.5 flex items-center justify-between text-xs hover:bg-gray-800/40 cursor-pointer"
        >
          <div className="flex items-center gap-3 text-gray-300 font-semibold">
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Download WinXbet Official Android App (APK)</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </div>

        <a 
          href="/winxbet-app.zip"
          download="winxbet-app.zip"
          onClick={() => triggerHaptic('success')}
          className="p-3.5 flex items-center justify-between text-xs hover:bg-gray-800/40 cursor-pointer transition block"
        >
          <div className="flex items-center gap-3 text-gray-300 font-semibold">
            <Download className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-white flex items-center gap-2">
                <span>Download App Source Code (.zip)</span>
                <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded text-[9px] font-bold">ZIP</span>
              </div>
              <p className="text-[10px] text-gray-400 font-normal">Complete frontend codebase package</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </a>

        {user && (
          <button
            id="account-logout-btn"
            onClick={() => {
              triggerHaptic('medium');
              logout();
            }}
            className="w-full p-3.5 flex items-center justify-between text-xs hover:bg-rose-950/30 text-rose-400 font-semibold transition"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-4 h-4" />
              <span>Log Out Account</span>
            </div>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <AdminConsoleModal
        isOpen={showAdminConsole}
        onClose={() => setShowAdminConsole(false)}
      />

      <CategoryDefinitionModal
        isOpen={showCategoriesGuide}
        onClose={() => setShowCategoriesGuide(false)}
        initialCategoryId="lottery"
        onSelectGame={onSelectGame}
      />
    </div>
  );
};
