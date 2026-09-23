import { useState, useEffect, useRef, useCallback } from 'react';

export const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
export const WARNING_THRESHOLD_MS = 14 * 60 * 1000;  // 14 minutes (60s warning window)

interface UseInactivityTimerOptions {
  isEnabled: boolean;
  onLogout: () => void | Promise<void>;
  timeoutMs?: number;
  warningThresholdMs?: number;
}

export function useInactivityTimer({
  isEnabled,
  onLogout,
  timeoutMs = INACTIVITY_TIMEOUT_MS,
  warningThresholdMs = WARNING_THRESHOLD_MS,
}: UseInactivityTimerOptions) {
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(60);

  const lastActivityRef = useRef<number>(Date.now());
  const isWarningOpenRef = useRef<boolean>(false);
  const isLoggingOutRef = useRef<boolean>(false);

  // Keep ref in sync
  useEffect(() => {
    isWarningOpenRef.current = isWarningOpen;
  }, [isWarningOpen]);

  // Reset the activity timestamp and dismiss warning
  const resetInactivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (isWarningOpenRef.current) {
      setIsWarningOpen(false);
      isWarningOpenRef.current = false;
    }
  }, []);

  // For testing: simulate warning window immediately (e.g. 30s or 60s)
  const simulateWarning = useCallback((seconds: number = 30) => {
    const artificialElapsed = timeoutMs - seconds * 1000;
    lastActivityRef.current = Date.now() - artificialElapsed;
    setSecondsRemaining(seconds);
    setIsWarningOpen(true);
    isWarningOpenRef.current = true;
  }, [timeoutMs]);

  // Handle immediate auto-logout
  const performAutoLogout = useCallback(async () => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;
    setIsWarningOpen(false);
    isWarningOpenRef.current = false;
    try {
      sessionStorage.setItem('inactivity_logged_out', 'true');
      sessionStorage.setItem('inactivity_logout_time', new Date().toLocaleTimeString());
      await onLogout();
    } catch (err) {
      console.error('Error during auto-logout:', err);
    } finally {
      isLoggingOutRef.current = false;
    }
  }, [onLogout]);

  useEffect(() => {
    if (!isEnabled) {
      setIsWarningOpen(false);
      isWarningOpenRef.current = false;
      return;
    }

    // Reset last activity on initial enable
    lastActivityRef.current = Date.now();
    isLoggingOutRef.current = false;

    // Throttled activity tracker for standard navigation
    let lastRecorded = 0;
    const handleUserActivity = () => {
      const now = Date.now();
      // Throttle event handling to once every 1000ms to avoid unnecessary load
      if (now - lastRecorded > 1000) {
        lastRecorded = now;
        // If warning is not active, keep updating activity timestamp
        if (!isWarningOpenRef.current) {
          lastActivityRef.current = now;
        }
      }
    };

    const activityEvents: (keyof WindowEventMap)[] = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
      'click',
      'wheel'
    ];

    activityEvents.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    // Check on visibility change (e.g. user returns to tab after 15 mins)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const elapsed = Date.now() - lastActivityRef.current;
        if (elapsed >= timeoutMs) {
          performAutoLogout();
        } else if (elapsed >= warningThresholdMs) {
          const remaining = Math.max(0, Math.ceil((timeoutMs - elapsed) / 1000));
          setSecondsRemaining(remaining);
          setIsWarningOpen(true);
          isWarningOpenRef.current = true;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Ticking interval running every second to inspect inactivity status
    const intervalId = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastActivityRef.current;

      if (elapsed >= timeoutMs) {
        performAutoLogout();
      } else if (elapsed >= warningThresholdMs) {
        const remaining = Math.max(0, Math.ceil((timeoutMs - elapsed) / 1000));
        setSecondsRemaining(remaining);
        if (!isWarningOpenRef.current) {
          setIsWarningOpen(true);
          isWarningOpenRef.current = true;
        }
      } else if (isWarningOpenRef.current) {
        // Activity was reset below warning threshold
        setIsWarningOpen(false);
        isWarningOpenRef.current = false;
      }
    }, 1000);

    return () => {
      clearInterval(intervalId);
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isEnabled, timeoutMs, warningThresholdMs, performAutoLogout]);

  return {
    isWarningOpen,
    secondsRemaining,
    resetInactivity,
    simulateWarning,
    performAutoLogout
  };
}
