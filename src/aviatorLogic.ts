import { AviatorRoundRecord } from './types';

export const ONE_HOUR_MS = 60 * 60 * 1000;

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

export function getDeterministicAviatorCrash(roundIndex: number): number {
  let hashVal = 0;
  const str = `AVIATOR_PROVABLY_FAIR_SALT_${roundIndex}`;
  for (let i = 0; i < str.length; i++) {
    hashVal = ((hashVal << 5) - hashVal) + str.charCodeAt(i);
    hashVal |= 0;
  }
  const norm = (Math.abs(hashVal) % 10000) / 10000;
  let point: number;
  if (norm < 0.12) {
    point = 1.00 + (norm / 0.12) * 0.18;
  } else if (norm < 0.58) {
    point = 1.20 + ((norm - 0.12) / 0.46) * 1.80;
  } else if (norm < 0.85) {
    point = 3.00 + ((norm - 0.58) / 0.27) * 4.00;
  } else if (norm < 0.96) {
    point = 7.00 + ((norm - 0.85) / 0.11) * 12.00;
  } else {
    point = 20.00 + ((norm - 0.96) / 0.04) * 45.00;
  }
  return Number(point.toFixed(2));
}

export function generateCrashPoint(): number {
  const rand = Math.random();
  let point: number;
  if (rand < 0.12) {
    // Instant crash
    point = 1.00 + Math.random() * 0.18;
  } else if (rand < 0.58) {
    point = 1.20 + Math.random() * 1.80;
  } else if (rand < 0.85) {
    point = 3.00 + Math.random() * 4.00;
  } else if (rand < 0.96) {
    point = 7.00 + Math.random() * 12.00;
  } else {
    // Mega super rocket
    point = 20.00 + Math.random() * 45.00;
  }
  return Number(point.toFixed(2));
}

export function generateHistoricalAviatorRounds(count: number = 80): AviatorRoundRecord[] {
  const list: AviatorRoundRecord[] = [];
  const now = Date.now();
  const intervalMs = Math.floor(ONE_HOUR_MS / Math.max(count, 60));
  let currentBaseId = Math.floor(now / 15000);

  for (let i = 0; i < count; i++) {
    const timestamp = now - i * intervalMs;
    // Discard if older than 1 hour
    if (now - timestamp > ONE_HOUR_MS) continue;

    const roundIndex = currentBaseId - i;
    const roundId = `AV-${roundIndex}`;
    const crashMultiplier = getDeterministicAviatorCrash(roundIndex);
    // Estimate flight duration based on multiplier curve
    const flightDurationSec = Number((Math.pow(crashMultiplier - 1.0, 1 / 1.65) / 0.75).toFixed(1));
    const hash = Math.abs(roundIndex * 2654435761).toString(16).toUpperCase().padStart(8, '0');
    const d = new Date(timestamp);
    const time = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;

    list.push({
      roundId,
      crashMultiplier,
      flightDurationSec: Math.max(0.5, flightDurationSec),
      hash,
      time,
      timestamp,
      tier: getMultiplierTier(crashMultiplier)
    });
  }

  return list;
}
