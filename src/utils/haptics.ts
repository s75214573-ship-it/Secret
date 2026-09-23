// Haptic feedback utility using Web Vibration API with safe fallback and acoustic micro-clicks for iOS Safari

export type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

const HAPTIC_PATTERNS: Record<HapticType, number | number[]> = {
  light: 12,
  selection: 18,
  medium: 30,
  heavy: 55,
  success: [40, 50, 80, 50, 120],
  warning: [50, 60, 50],
  error: [70, 50, 70, 50, 90],
};

// Acoustic tactile fallback using AudioContext for iOS Safari where navigator.vibrate is restricted
let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

const playTactileClick = (type: HapticType) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'light' || type === 'selection') {
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.03);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.03);
      osc.start(now);
      osc.stop(now + 0.03);
    } else if (type === 'heavy' || type === 'medium') {
      osc.frequency.setValueAtTime(500, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.06);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === 'success') {
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.05); // A5
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'error') {
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(160, now + 0.06);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.14);
      osc.start(now);
      osc.stop(now + 0.14);
    }
  } catch {
    // Ignore audio context errors
  }
};

let hapticsEnabled = typeof window !== 'undefined'
  ? (localStorage.getItem('winxbet_haptics_enabled') ?? localStorage.getItem('in999_haptics_enabled')) !== 'false'
  : true;

export const setHapticsEnabled = (enabled: boolean) => {
  hapticsEnabled = enabled;
  if (typeof window !== 'undefined') {
    localStorage.setItem('winxbet_haptics_enabled', enabled ? 'true' : 'false');
  }
};

export const setHapticEnabled = setHapticsEnabled;

export const isHapticsEnabled = () => hapticsEnabled;
export const isHapticEnabled = isHapticsEnabled;

export const triggerHaptic = (type: HapticType = 'light'): void => {
  if (!hapticsEnabled) return;

  let vibrated = false;
  try {
    if (typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function') {
      const pattern = HAPTIC_PATTERNS[type];
      vibrated = navigator.vibrate(pattern);
    }
  } catch {
    // Graceful fallback
  }

  // If vibrate was not triggered (e.g. on iOS Safari or desktop), trigger subtle acoustic click feedback
  if (!vibrated) {
    playTactileClick(type);
  }
};

