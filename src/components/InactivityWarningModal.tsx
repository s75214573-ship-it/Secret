import React, { useEffect } from 'react';
import { ShieldAlert, Clock, LogOut, CheckCircle, Lock, AlertTriangle } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface InactivityWarningModalProps {
  isOpen: boolean;
  secondsRemaining: number;
  totalWarningSeconds?: number;
  onStayLoggedIn: () => void;
  onLogoutNow: () => void;
}

export const InactivityWarningModal: React.FC<InactivityWarningModalProps> = ({
  isOpen,
  secondsRemaining,
  totalWarningSeconds = 60,
  onStayLoggedIn,
  onLogoutNow,
}) => {
  // Trigger gentle haptic alert when modal becomes visible and listen for keyboard activity
  useEffect(() => {
    if (!isOpen) return;

    triggerHaptic('warning');

    const handleKeyDown = (e: KeyboardEvent) => {
      // Any deliberate key stroke confirms the user is active
      triggerHaptic('success');
      onStayLoggedIn();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onStayLoggedIn]);

  if (!isOpen) return null;

  // Calculate percentage of warning time remaining
  const progressPercent = Math.min(
    100,
    Math.max(0, (secondsRemaining / totalWarningSeconds) * 100)
  );

  const isCritical = secondsRemaining <= 15;

  return (
    <div
      id="inactivity-warning-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div
        id="inactivity-warning-modal"
        className="w-full max-w-sm bg-gray-950 border border-amber-500/50 rounded-3xl shadow-2xl text-white overflow-hidden relative p-5 sm:p-6 space-y-4"
      >
        {/* Glow ambient background */}
        <div className="absolute -top-12 -left-12 w-36 h-36 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-red-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Security Badge Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">
              Security Protection
            </span>
          </div>

          <div className="flex items-center gap-1 text-[10px] text-gray-400 bg-gray-900/80 px-2 py-0.5 rounded-full border border-gray-800">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>15m Policy</span>
          </div>
        </div>

        {/* Warning Icon & Title */}
        <div className="text-center space-y-1 pt-1">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 via-red-500/10 to-transparent border border-amber-500/40 mb-1 relative">
            <Clock className={`w-8 h-8 ${isCritical ? 'text-red-400 animate-pulse' : 'text-amber-400'}`} />
            {isCritical && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-600 animate-ping" />
            )}
          </div>
          <h3 className="text-lg font-black text-white">
            Are You Still There?
          </h3>
          <p className="text-xs text-gray-300 leading-relaxed max-w-xs mx-auto">
            You have been inactive for over <strong className="text-white">14 minutes</strong>. To protect your wallet funds and account security, you will be automatically logged out soon.
          </p>
        </div>

        {/* Big Countdown Display */}
        <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-4 text-center space-y-2">
          <div className="flex items-baseline justify-center gap-1.5">
            <span
              id="inactivity-countdown-number"
              className={`text-4xl sm:text-5xl font-black font-mono tracking-tight transition-colors ${
                isCritical ? 'text-red-500 animate-pulse' : 'text-amber-400'
              }`}
            >
              {secondsRemaining}
            </span>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Seconds Remaining
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-950 rounded-full h-2.5 overflow-hidden border border-gray-800/80 p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                isCritical
                  ? 'bg-gradient-to-r from-red-600 to-rose-500'
                  : 'bg-gradient-to-r from-amber-500 to-red-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-gray-400 pt-0.5">
            <span>Inactivity limit: 15 mins</span>
            <span className={isCritical ? 'text-red-400 font-bold' : 'text-amber-400'}>
              Auto-logout when 0s
            </span>
          </div>
        </div>

        {/* Interactive Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            id="stay-logged-in-btn"
            onClick={() => {
              triggerHaptic('success');
              onStayLoggedIn();
            }}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-gray-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition cursor-pointer"
          >
            <CheckCircle className="w-4 h-4" />
            <span>I&apos;m Still Here (Stay Logged In)</span>
          </button>

          <button
            id="logout-now-btn"
            onClick={() => {
              triggerHaptic('medium');
              onLogoutNow();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-gray-900 hover:bg-gray-850 border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-red-400 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out Now</span>
          </button>
        </div>

        {/* Tip */}
        <p className="text-[10px] text-center text-gray-500 flex items-center justify-center gap-1">
          <AlertTriangle className="w-3 h-3 text-amber-500/70" />
          <span>Moving your mouse, tapping, or clicking also confirms activity</span>
        </p>
      </div>
    </div>
  );
};
