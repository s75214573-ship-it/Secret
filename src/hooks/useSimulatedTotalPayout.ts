import { useState, useEffect, useRef } from 'react';

const STORAGE_KEY = 'winxbet_simulated_payout_state';
const DEFAULT_BASE_PAYOUT = 4829100; // Starting baseline ₹48,29,100
const RATE_PER_SECOND = 100; // Exact requested rate: 100 per second

interface StoredPayoutState {
  basePayout: number;
  startTimestamp: number;
}

function getInitialState(): StoredPayoutState {
  if (typeof window === 'undefined') {
    return { basePayout: DEFAULT_BASE_PAYOUT, startTimestamp: Date.now() };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.basePayout === 'number' && typeof parsed.startTimestamp === 'number') {
        // Guard against absurdly old timestamps that would make it explode into trillions
        const elapsedSeconds = (Date.now() - parsed.startTimestamp) / 1000;
        if (elapsedSeconds >= 0 && elapsedSeconds < 86400 * 30) {
          return parsed;
        }
      }
    }
  } catch (e) {
    // ignore parse error
  }

  // Initialize fresh anchor
  const freshState: StoredPayoutState = {
    basePayout: DEFAULT_BASE_PAYOUT,
    startTimestamp: Date.now()
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(freshState));
  } catch (e) {
    // ignore storage error
  }

  return freshState;
}

export function useSimulatedTotalPayout() {
  const stateRef = useRef<StoredPayoutState>(getInitialState());

  const calculateCurrentPayout = () => {
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - stateRef.current.startTimestamp) / 1000));
    return stateRef.current.basePayout + elapsedSeconds * RATE_PER_SECOND;
  };

  const [totalPayout, setTotalPayout] = useState<number>(calculateCurrentPayout);
  const [justTicked, setJustTicked] = useState(false);

  useEffect(() => {
    // Initial sync
    setTotalPayout(calculateCurrentPayout());

    // Tick exactly every 1000ms (1 second) to add 100
    const interval = setInterval(() => {
      const nextPayout = calculateCurrentPayout();
      setTotalPayout(nextPayout);
      setJustTicked(true);

      const timeout = setTimeout(() => {
        setJustTicked(false);
      }, 400);

      return () => clearTimeout(timeout);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formattedPayout = totalPayout.toLocaleString('en-IN');

  return {
    totalPayout,
    formattedPayout,
    ratePerSecond: RATE_PER_SECOND,
    justTicked
  };
}
