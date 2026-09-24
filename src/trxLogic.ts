import { TrxPeriod, TrxUpcomingResult } from './types';
import { getWingoPeriodId, getNumberColors, getNumberSize } from './wingoLogic';

export function getTrxPeriodId(timestampMs: number = Date.now()): string {
  const base = getWingoPeriodId(timestampMs);
  return `TRX-${base}`;
}

export function getDeterministicTrxData(periodId: string, overrideDigit?: number, timestampMs: number = Date.now()): TrxPeriod {
  let hash = 0;
  const str = `TRX_BLOCK_FAIR_SALT_${periodId}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);
  
  // Realistic TRON block number & hash
  const baseBlockNumber = 68400000 + (Math.floor(timestampMs / 60000) % 1000000);
  const hexEnding = absHash.toString(16).padStart(8, '0');
  const fullBlockHash = `00000000041b${hexEnding}f9c3e210a4${periodId.slice(-4)}`;

  const lastDigit = overrideDigit !== undefined ? overrideDigit : (absHash % 10);
  const colors = getNumberColors(lastDigit);
  const size = getNumberSize(lastDigit);

  const d = new Date(timestampMs);
  const time = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;

  return {
    periodId,
    blockNumber: baseBlockNumber,
    blockHash: fullBlockHash,
    lastDigit,
    colors,
    size,
    time,
    timestamp: timestampMs,
  };
}

export function generateHistoricalTrxPeriods(count: number = 30): TrxPeriod[] {
  const list: TrxPeriod[] = [];
  const now = Date.now();
  for (let i = 1; i <= count; i++) {
    const pastTime = now - i * 60000;
    const pId = getTrxPeriodId(pastTime);
    list.push(getDeterministicTrxData(pId, undefined, pastTime));
  }
  return list;
}

export function calculateTrxBetResult(
  selection: string, // 'Green' | 'Violet' | 'Red' | 'Big' | 'Small' | '0'..'9'
  period: TrxPeriod
): { won: boolean; multiplier: number } {
  const { lastDigit, colors, size } = period;

  if (selection === 'Green') {
    if (colors.includes('Green')) {
      return { won: true, multiplier: lastDigit === 5 ? 1.5 : 2.0 };
    }
    return { won: false, multiplier: 0 };
  }

  if (selection === 'Red') {
    if (colors.includes('Red')) {
      return { won: true, multiplier: lastDigit === 0 ? 1.5 : 2.0 };
    }
    return { won: false, multiplier: 0 };
  }

  if (selection === 'Violet') {
    if (colors.includes('Violet')) {
      return { won: true, multiplier: 4.5 };
    }
    return { won: false, multiplier: 0 };
  }

  if (selection === 'Big') {
    return { won: size === 'Big', multiplier: 1.96 };
  }

  if (selection === 'Small') {
    return { won: size === 'Small', multiplier: 1.96 };
  }

  // Exact number 0-9
  if (selection === String(lastDigit)) {
    return { won: true, multiplier: 9.0 };
  }

  return { won: false, multiplier: 0 };
}
