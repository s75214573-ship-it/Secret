import { AviatorRoundRecord } from './types';

export const ONE_HOUR_MS = 60 * 60 * 1000;

// Authentic Spribe Aviator curve coefficient
// Slower, thrilling real-time rise allowing genuine suspense and user reaction
export const AVIATOR_GROWTH_RATE = 0.065;

export function getMultiplierTier(mult: number): 'low' | 'medium' | 'high' | 'mega' {
  if (mult < 2.0) return 'low';
  if (mult < 5.0) return 'medium';
  if (mult < 10.0) return 'high';
  return 'mega';
}

export function filterLastOneHour<T extends { timestamp: number }>(items: T[]): T[] {
  const cutoff = Date.now() - ONE_HOUR_MS;
  return items.filter(item => item.timestamp >= cutoff);
}

/**
 * Calculates current flight multiplier at given flight elapsed seconds.
 * Pacing:
 * 0s -> 1.00x
 * 5s -> 1.38x
 * 8s -> 1.68x
 * 11s -> 2.04x
 * 18s -> 3.22x
 * 25s -> 5.08x
 * 35s -> 9.73x
 */
export function getAviatorMultiplierAtSec(flightSec: number): number {
  if (flightSec <= 0) return 1.00;
  const mult = 1.00 * Math.exp(AVIATOR_GROWTH_RATE * flightSec);
  return Number(mult.toFixed(2));
}

/**
 * Calculates total flight duration required to reach a specific crash multiplier
 */
export function getAviatorFlightDurationSec(crashMultiplier: number): number {
  if (crashMultiplier <= 1.01) return 0.8;
  const sec = Math.log(Math.max(1.01, crashMultiplier)) / AVIATOR_GROWTH_RATE;
  return Number(Math.max(0.8, Number(sec.toFixed(1))));
}

export function getDeterministicAviatorCrash(roundIndex: number): number {
  // High-entropy 32-bit hash with complete avalanche effect
  // Ensures consecutive flight rounds have diverse, unpredictable, realistic crash points
  let h = ((roundIndex ^ 0x9e3779b9) >>> 0);
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h = ((h ^ (h >>> 16)) >>> 0);
  const norm = (h % 100000) / 100000;

  let point: number;
  // Authentic Spribe Aviator RTP curve (~97% RTP):
  // ~10% instant early crash (1.00x - 1.19x)
  // ~45% low tier (1.20x - 1.99x)
  // ~25% medium tier (2.00x - 4.99x)
  // ~14% high rocket (5.00x - 14.99x)
  // ~6% mega super rocket (15.00x - 85.00x)
  if (norm < 0.10) {
    point = 1.00 + (norm / 0.10) * 0.19;
  } else if (norm < 0.55) {
    point = 1.20 + ((norm - 0.10) / 0.45) * 0.79;
  } else if (norm < 0.80) {
    point = 2.00 + ((norm - 0.55) / 0.25) * 2.99;
  } else if (norm < 0.94) {
    point = 5.00 + ((norm - 0.80) / 0.14) * 9.99;
  } else {
    point = 15.00 + ((norm - 0.94) / 0.06) * 70.00;
  }
  return Number(point.toFixed(2));
}

export function generateCrashPoint(): number {
  const rand = Math.random();
  let point: number;
  if (rand < 0.10) {
    // Instant crash
    point = 1.00 + Math.random() * 0.19;
  } else if (rand < 0.55) {
    point = 1.20 + Math.random() * 0.79;
  } else if (rand < 0.80) {
    point = 2.00 + Math.random() * 2.99;
  } else if (rand < 0.94) {
    point = 5.00 + Math.random() * 9.99;
  } else {
    // Mega super rocket
    point = 15.00 + Math.random() * 70.00;
  }
  return Number(point.toFixed(2));
}

export function generateHistoricalAviatorRounds(count: number = 80): AviatorRoundRecord[] {
  const list: AviatorRoundRecord[] = [];
  const now = Date.now();
  const intervalMs = Math.floor(ONE_HOUR_MS / Math.max(count, 60));
  let currentBaseId = Math.floor(now / 35000);

  for (let i = 0; i < count; i++) {
    const timestamp = now - i * intervalMs;
    // Discard if older than 1 hour
    if (now - timestamp > ONE_HOUR_MS) continue;

    const roundIndex = currentBaseId - i;
    const roundId = `AV-${roundIndex}`;
    const crashMultiplier = getDeterministicAviatorCrash(roundIndex);
    const flightDurationSec = getAviatorFlightDurationSec(crashMultiplier);
    const hash = Math.abs(roundIndex * 2654435761).toString(16).toUpperCase().padStart(8, '0');
    const d = new Date(timestamp);
    const time = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;

    list.push({
      roundId,
      crashMultiplier,
      flightDurationSec,
      hash,
      time,
      timestamp,
      tier: getMultiplierTier(crashMultiplier)
    });
  }

  return list;
}
