// Studio-grade Web Audio sound effects synthesizer for WinXbet
// Supports click feedback, game win animations, crash effects, and transaction alerts
// Fully offline, zero external audio asset dependencies, with persistent toggle & volume in Account settings

export type SoundEffectType = 
  | 'click' 
  | 'chip' 
  | 'tab' 
  | 'win' 
  | 'big_win' 
  | 'lose' 
  | 'crash' 
  | 'deposit' 
  | 'withdraw' 
  | 'bonus' 
  | 'tick' 
  | 'warning_tick'
  | 'takeoff'
  | 'cashout'
  | 'reveal'
  | 'bet_placed';

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

// Immediate unlock listener for mobile Android/iOS and desktop browsers on user interaction
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  };
  window.addEventListener('touchstart', unlockAudio, { passive: true });
  window.addEventListener('click', unlockAudio, { passive: true });
  window.addEventListener('keydown', unlockAudio, { passive: true });
}

// Storage keys
const SOUND_ENABLED_KEY = 'winxbet_sound_enabled';
const SOUND_VOLUME_KEY = 'winxbet_sound_volume';

// Sound enabled state
let soundEnabled = typeof window !== 'undefined'
  ? localStorage.getItem(SOUND_ENABLED_KEY) !== 'false'
  : true;

// Master volume (0.0 to 1.0)
let soundVolume = typeof window !== 'undefined'
  ? Number(localStorage.getItem(SOUND_VOLUME_KEY) || '0.75')
  : 0.75;

export const isSoundEnabled = (): boolean => soundEnabled;

export const setSoundEnabled = (enabled: boolean): void => {
  soundEnabled = enabled;
  if (typeof window !== 'undefined') {
    localStorage.setItem(SOUND_ENABLED_KEY, enabled ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('winxbet_sound_toggle', { detail: { enabled } }));
  }
};

export const getSoundVolume = (): number => soundVolume;

export const setSoundVolume = (vol: number): void => {
  soundVolume = Math.max(0, Math.min(1, vol));
  if (typeof window !== 'undefined') {
    localStorage.setItem(SOUND_VOLUME_KEY, String(soundVolume));
    window.dispatchEvent(new CustomEvent('winxbet_sound_volume', { detail: { volume: soundVolume } }));
  }
};

/**
 * Play a specific synthesized sound effect
 */
export const playSound = (type: SoundEffectType, volumeMultiplier: number = 1.0): void => {
  if (!soundEnabled) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const masterVol = soundVolume * volumeMultiplier;
    const now = ctx.currentTime;

    switch (type) {
      case 'click': {
        // Crisp modern tactile click
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(900, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.035);

        gain.gain.setValueAtTime(0.09 * masterVol, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.035);

        osc.start(now);
        osc.stop(now + 0.035);
        break;
      }

      case 'chip': {
        // High quality ceramic casino chip clink
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'triangle';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(1450, now);
        osc1.frequency.exponentialRampToValueAtTime(800, now + 0.05);

        osc2.frequency.setValueAtTime(2200, now);
        osc2.frequency.exponentialRampToValueAtTime(1200, now + 0.04);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        gain.gain.setValueAtTime(0.12 * masterVol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.06);
        osc2.stop(now + 0.06);
        break;
      }

      case 'tab': {
        // Gentle acoustic tab switch
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.03);

        gain.gain.setValueAtTime(0.06 * masterVol, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.03);

        osc.start(now);
        osc.stop(now + 0.03);
        break;
      }

      case 'win': {
        // Uplifting casino win chime: Arpeggio C5 (523Hz) -> E5 (659Hz) -> G5 (784Hz) -> C6 (1046Hz)
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const noteTime = now + idx * 0.08;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, noteTime);

          // Subtle bell harmonic
          const oscHarmonic = ctx.createOscillator();
          oscHarmonic.type = 'triangle';
          oscHarmonic.frequency.setValueAtTime(freq * 2, noteTime);

          osc.connect(gain);
          oscHarmonic.connect(gain);
          gain.connect(ctx.destination);

          gain.gain.setValueAtTime(0.001, noteTime);
          gain.gain.linearRampToValueAtTime(0.14 * masterVol, noteTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.28);

          osc.start(noteTime);
          oscHarmonic.start(noteTime);
          osc.stop(noteTime + 0.3);
          oscHarmonic.stop(noteTime + 0.3);
        });
        break;
      }

      case 'big_win': {
        // Grand celebratory fanfare: fast ascending arpeggio with celebratory shimmer
        const fanfareNotes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
        fanfareNotes.forEach((freq, idx) => {
          const noteTime = now + idx * 0.07;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, noteTime);

          osc.connect(gain);
          gain.connect(ctx.destination);

          const dur = idx === fanfareNotes.length - 1 ? 0.6 : 0.25;
          gain.gain.setValueAtTime(0.001, noteTime);
          gain.gain.linearRampToValueAtTime(0.18 * masterVol, noteTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, noteTime + dur);

          osc.start(noteTime);
          osc.stop(noteTime + dur);
        });
        break;
      }

      case 'lose': {
        // Gentle descending minor slide
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.18);

        gain.gain.setValueAtTime(0.09 * masterVol, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.18);

        osc.start(now);
        osc.stop(now + 0.18);
        break;
      }

      case 'crash': {
        // Aviator rocket crash: low explosion rumble with pitch fall
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.28);

        // Low-pass filter for explosion warmth
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, now);
        filter.frequency.exponentialRampToValueAtTime(80, now + 0.28);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        gain.gain.setValueAtTime(0.16 * masterVol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.start(now);
        osc.stop(now + 0.28);
        break;
      }

      case 'deposit': {
        // Metallic coins cascade / cash recharge alert (4 fast ringing coin strikes)
        const coinFreqs = [1250, 1600, 1950, 2400];
        coinFreqs.forEach((freq, idx) => {
          const coinTime = now + idx * 0.055;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, coinTime);

          osc.connect(gain);
          gain.connect(ctx.destination);

          gain.gain.setValueAtTime(0.13 * masterVol, coinTime);
          gain.gain.exponentialRampToValueAtTime(0.001, coinTime + 0.14);

          osc.start(coinTime);
          osc.stop(coinTime + 0.14);
        });
        break;
      }

      case 'withdraw': {
        // Clean dual-tone banking dispatch alert
        const chimeNotes = [783.99, 1174.66]; // G5, D6
        chimeNotes.forEach((freq, idx) => {
          const noteTime = now + idx * 0.1;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, noteTime);

          osc.connect(gain);
          gain.connect(ctx.destination);

          gain.gain.setValueAtTime(0.001, noteTime);
          gain.gain.linearRampToValueAtTime(0.12 * masterVol, noteTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.25);

          osc.start(noteTime);
          osc.stop(noteTime + 0.25);
        });
        break;
      }

      case 'bonus': {
        // Shimmering reward bell
        const notes = [659.25, 880.00, 1318.51]; // E5, A5, E6
        notes.forEach((freq, idx) => {
          const noteTime = now + idx * 0.07;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, noteTime);

          osc.connect(gain);
          gain.connect(ctx.destination);

          gain.gain.setValueAtTime(0.11 * masterVol, noteTime);
          gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.22);

          osc.start(noteTime);
          osc.stop(noteTime + 0.22);
        });
        break;
      }

      case 'tick': {
        // Subtle clock tick
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1050, now);

        gain.gain.setValueAtTime(0.05 * masterVol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

        osc.start(now);
        osc.stop(now + 0.025);
        break;
      }

      case 'warning_tick': {
        // High priority countdown alert
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1550, now);

        gain.gain.setValueAtTime(0.09 * masterVol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.start(now);
        osc.stop(now + 0.04);
        break;
      }

      case 'takeoff': {
        // Aviator rocket takeoff: ascending turbine engine surge + jet rush
        const osc = ctx.createOscillator();
        const subOsc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(130, now);
        osc.frequency.exponentialRampToValueAtTime(460, now + 0.65);

        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(80, now);
        subOsc.frequency.exponentialRampToValueAtTime(240, now + 0.65);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, now);
        filter.frequency.exponentialRampToValueAtTime(2200, now + 0.65);

        osc.connect(filter);
        subOsc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.14 * masterVol, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

        osc.start(now);
        subOsc.start(now);
        osc.stop(now + 0.7);
        subOsc.stop(now + 0.7);
        break;
      }

      case 'cashout': {
        // Aviator triumphant cashout: double bell chime + coin cascade
        const chimeNotes = [1046.50, 1318.51, 1567.98]; // C6, E6, G6
        chimeNotes.forEach((freq, idx) => {
          const noteTime = now + idx * 0.07;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, noteTime);

          osc.connect(gain);
          gain.connect(ctx.destination);

          gain.gain.setValueAtTime(0.001, noteTime);
          gain.gain.linearRampToValueAtTime(0.15 * masterVol, noteTime + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.28);

          osc.start(noteTime);
          osc.stop(noteTime + 0.28);
        });
        break;
      }

      case 'reveal': {
        // Win Go round draw reveal chime: sparkling magical arpeggio
        const revealNotes = [698.46, 880.00, 1046.50, 1318.51]; // F5, A5, C6, E6
        revealNotes.forEach((freq, idx) => {
          const noteTime = now + idx * 0.06;
          const osc = ctx.createOscillator();
          const harmonic = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          harmonic.type = 'triangle';
          osc.frequency.setValueAtTime(freq, noteTime);
          harmonic.frequency.setValueAtTime(freq * 2, noteTime);

          osc.connect(gain);
          harmonic.connect(gain);
          gain.connect(ctx.destination);

          gain.gain.setValueAtTime(0.001, noteTime);
          gain.gain.linearRampToValueAtTime(0.13 * masterVol, noteTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.32);

          osc.start(noteTime);
          harmonic.start(noteTime);
          osc.stop(noteTime + 0.32);
          harmonic.stop(noteTime + 0.32);
        });
        break;
      }

      case 'bet_placed': {
        // Crisp physical chip stack impact
        const osc = ctx.createOscillator();
        const thudOsc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1900, now);
        osc.frequency.exponentialRampToValueAtTime(700, now + 0.04);

        thudOsc.type = 'sine';
        thudOsc.frequency.setValueAtTime(140, now);
        thudOsc.frequency.exponentialRampToValueAtTime(50, now + 0.06);

        osc.connect(gain);
        thudOsc.connect(gain);
        gain.connect(ctx.destination);

        gain.gain.setValueAtTime(0.13 * masterVol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

        osc.start(now);
        thudOsc.start(now);
        osc.stop(now + 0.07);
        thudOsc.stop(now + 0.07);
        break;
      }
    }
  } catch (err) {
    // Graceful fallback if audio context fails
    console.debug('Web Audio playback caught:', err);
  }
};

// Convenience helpers
export const playClickSound = () => playSound('click');
export const playChipSound = () => playSound('chip');
export const playTabSound = () => playSound('tab');
export const playWinSound = () => playSound('win');
export const playBigWinSound = () => playSound('big_win');
export const playLoseSound = () => playSound('lose');
export const playCrashSound = () => playSound('crash');
export const playDepositSound = () => playSound('deposit');
export const playWithdrawSound = () => playSound('withdraw');
export const playBonusSound = () => playSound('bonus');
export const playTickSound = (isWarning = false) => playSound(isWarning ? 'warning_tick' : 'tick');
export const playTakeoffSound = () => playSound('takeoff');
export const playCashoutSound = () => playSound('cashout');
export const playRevealSound = () => playSound('reveal');
export const playBetPlacedSound = () => playSound('bet_placed');
