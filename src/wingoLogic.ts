// Logic rules for WinGo Color Prediction
// Numbers 0-9:
// 0: Red + Violet (Small)
// 5: Green + Violet (Big)
// 1, 3, 7, 9: Green (1,3: Small; 7,9: Big)
// 2, 4, 6, 8: Red (2,4: Small; 6,8: Big)
// Small: 0, 1, 2, 3, 4
// Big: 5, 6, 7, 8, 9

import { WingoPeriod } from './types';

export function getNumberColors(num: number): ('Green' | 'Violet' | 'Red')[] {
  if (num === 0) return ['Red', 'Violet'];
  if (num === 5) return ['Green', 'Violet'];
  if ([1, 3, 7, 9].includes(num)) return ['Green'];
  return ['Red'];
}

export function getNumberSize(num: number): 'Big' | 'Small' {
  return num >= 5 ? 'Big' : 'Small';
}

export function getDeterministicRoundResult(periodId: string): {
  number: number;
  colors: ('Green' | 'Violet' | 'Red')[];
  size: 'Big' | 'Small';
  hash: string;
} {
  let hashVal = 0;
  const str = `WINX_PROVABLY_FAIR_SALT_${periodId}`;
  for (let i = 0; i < str.length; i++) {
    hashVal = ((hashVal << 5) - hashVal) + str.charCodeAt(i);
    hashVal |= 0;
  }
  const absHash = Math.abs(hashVal);
  const num = absHash % 10;
  const colors = getNumberColors(num);
  const size = getNumberSize(num);
  const hashHex = absHash.toString(16).toUpperCase().padStart(8, '0');
  return {
    number: num,
    colors,
    size,
    hash: hashHex
  };
}

/**
 * Derives the WinGo period number according to:
 * [current year][current month][current date] and four digits more for minutes of the day starting from 12:00 AM.
 * Example at 12:00 AM midnight (00:00): 202609210001
 * Example at 07:19 AM (07:19): 202609210440
 */
export function getWingoPeriodId(timestampMs: number = Date.now()): string {
  const d = new Date(timestampMs);
  const year = d.getFullYear().toString();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  
  // Minutes elapsed from 12:00 AM (00:00)
  const minuteOfDay = d.getHours() * 60 + d.getMinutes();
  
  // 1-based sequential period starting from 12:00 AM (00:00 is period 1 -> "0001")
  const periodIndex = minuteOfDay + 1;
  const fourDigits = String(periodIndex).padStart(4, '0');
  
  return `${year}${month}${date}${fourDigits}`;
}

/**
 * Returns the immediately preceding period ID (1 less than current).
 * If seq > 1: decrements the 4-digit sequence by 1.
 * If seq === 1: rolls back to previous calendar day at 1440.
 */
export function getPreviousPeriodId(periodId: string): string {
  if (!periodId || periodId.length !== 12) {
    return getWingoPeriodId(Date.now() - 60000);
  }
  const ymd = periodId.slice(0, 8);
  const seq = parseInt(periodId.slice(8), 10);
  if (seq > 1) {
    return `${ymd}${String(seq - 1).padStart(4, '0')}`;
  }
  // Roll back to previous day at 1440
  const year = parseInt(periodId.slice(0, 4), 10);
  const month = parseInt(periodId.slice(4, 6), 10) - 1;
  const day = parseInt(periodId.slice(6, 8), 10);
  const prevDate = new Date(year, month, day - 1);
  const prevYmd = `${prevDate.getFullYear()}${String(prevDate.getMonth() + 1).padStart(2, '0')}${String(prevDate.getDate()).padStart(2, '0')}`;
  return `${prevYmd}1440`;
}

/**
 * Returns the immediately succeeding period ID (1 more than current).
 * If seq < 1440: increments the 4-digit sequence by 1.
 * If seq >= 1440: rolls forward to next calendar day at 0001.
 */
export function getNextPeriodId(periodId: string): string {
  if (!periodId || periodId.length !== 12) {
    return getWingoPeriodId(Date.now() + 60000);
  }
  const ymd = periodId.slice(0, 8);
  const seq = parseInt(periodId.slice(8), 10);
  if (seq < 1440) {
    return `${ymd}${String(seq + 1).padStart(4, '0')}`;
  }
  // Roll forward to next day at 0001
  const year = parseInt(periodId.slice(0, 4), 10);
  const month = parseInt(periodId.slice(4, 6), 10) - 1;
  const day = parseInt(periodId.slice(6, 8), 10);
  const nextDate = new Date(year, month, day + 1);
  const nextYmd = `${nextDate.getFullYear()}${String(nextDate.getMonth() + 1).padStart(2, '0')}${String(nextDate.getDate()).padStart(2, '0')}`;
  return `${nextYmd}0001`;
}

/**
 * Generates an unbroken, strictly continuous chain of historical periods
 * starting immediately from the period right before the active round (activePeriodId - 1).
 * Every entry in the history is exactly 1 less than the one above it.
 */
export function generateHistoricalPeriods(
  count: number = 60,
  currentActivePeriodId?: string
): WingoPeriod[] {
  const list: WingoPeriod[] = [];
  const activeId = currentActivePeriodId || getWingoPeriodId();
  // History starts from the completed round immediately before the active round
  let currentId = getPreviousPeriodId(activeId);
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const { number: num, colors, size, hash } = getDeterministicRoundResult(currentId);
    
    // Compute time from period ID sequence
    const seq = parseInt(currentId.slice(8), 10);
    const minuteOfDay = Math.max(0, seq - 1);
    const hour = Math.floor(minuteOfDay / 60);
    const minute = minuteOfDay % 60;
    const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
    
    list.push({
      periodId: currentId,
      number: num,
      colors,
      size,
      hash,
      time,
      timestamp: now - (i + 1) * 60000
    });

    currentId = getPreviousPeriodId(currentId);
  }
  return list;
}

export function calculateBetResult(
  selection: string,
  amount: number,
  periodNumber: number
): { won: boolean; winAmount: number } {
  const colors = getNumberColors(periodNumber);
  const size = getNumberSize(periodNumber);
  
  // Selection can be 'Green', 'Violet', 'Red', 'Big', 'Small', or '0'..'9'
  if (selection === 'Green') {
    if (colors.includes('Green')) {
      // If 5 (Green+Violet), multiplier is usually 1.5x, pure Green is 2x (or 1.96x minus fee)
      const multiplier = periodNumber === 5 ? 1.5 : 2;
      return { won: true, winAmount: amount * multiplier };
    }
    return { won: false, winAmount: 0 };
  }
  
  if (selection === 'Red') {
    if (colors.includes('Red')) {
      const multiplier = periodNumber === 0 ? 1.5 : 2;
      return { won: true, winAmount: amount * multiplier };
    }
    return { won: false, winAmount: 0 };
  }
  
  if (selection === 'Violet') {
    if (colors.includes('Violet')) {
      return { won: true, winAmount: amount * 4.5 };
    }
    return { won: false, winAmount: 0 };
  }
  
  if (selection === 'Big') {
    if (size === 'Big') {
      return { won: true, winAmount: amount * 2 };
    }
    return { won: false, winAmount: 0 };
  }
  
  if (selection === 'Small') {
    if (size === 'Small') {
      return { won: true, winAmount: amount * 2 };
    }
    return { won: false, winAmount: 0 };
  }
  
  // Number pick (0-9) pays 9x
  if (String(periodNumber) === selection) {
    return { won: true, winAmount: amount * 9 };
  }
  
  return { won: false, winAmount: 0 };
}
