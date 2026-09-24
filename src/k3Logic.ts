import { K3Period, K3UpcomingResult } from './types';
import { getWingoPeriodId } from './wingoLogic';

export const K3_SUM_MULTIPLIERS: Record<number, number> = {
  3: 200.0,
  4: 60.0,
  5: 30.0,
  6: 18.0,
  7: 12.0,
  8: 8.0,
  9: 6.5,
  10: 6.0,
  11: 6.0,
  12: 6.5,
  13: 8.0,
  14: 12.0,
  15: 18.0,
  16: 30.0,
  17: 60.0,
  18: 200.0,
};

export function getK3PeriodId(timestampMs: number = Date.now()): string {
  const base = getWingoPeriodId(timestampMs);
  return `K3-${base}`;
}

export function getDeterministicK3Dice(periodId: string): [number, number, number] {
  let hash = 0;
  const str = `K3_PROVABLY_FAIR_SALT_${periodId}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);
  const d1 = (absHash % 6) + 1;
  const d2 = ((Math.floor(absHash / 7)) % 6) + 1;
  const d3 = ((Math.floor(absHash / 49)) % 6) + 1;
  return [d1, d2, d3];
}

export function getK3PeriodData(periodId: string, overrideDice?: [number, number, number], timestampMs: number = Date.now()): K3Period {
  const dice = overrideDice || getDeterministicK3Dice(periodId);
  const total = dice[0] + dice[1] + dice[2];
  const size: 'Big' | 'Small' = total >= 11 ? 'Big' : 'Small';
  const parity: 'Odd' | 'Even' = total % 2 !== 0 ? 'Odd' : 'Even';
  const isTriple = dice[0] === dice[1] && dice[1] === dice[2];
  const isDouble = !isTriple && (dice[0] === dice[1] || dice[1] === dice[2] || dice[0] === dice[2]);

  const d = new Date(timestampMs);
  const time = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;

  return {
    periodId,
    dice,
    total,
    size,
    parity,
    isTriple,
    isDouble,
    time,
    timestamp: timestampMs,
  };
}

export function generateHistoricalK3Periods(count: number = 30): K3Period[] {
  const list: K3Period[] = [];
  const now = Date.now();
  for (let i = 1; i <= count; i++) {
    const pastTime = now - i * 60000;
    const pId = getK3PeriodId(pastTime);
    list.push(getK3PeriodData(pId, undefined, pastTime));
  }
  return list;
}

export function calculateK3BetResult(
  selection: string, // 'Big' | 'Small' | 'Odd' | 'Even' | 'Sum_X' | 'Triple_Any' | 'Triple_X' | 'Double_X'
  period: K3Period
): { won: boolean; multiplier: number } {
  const { total, size, parity, isTriple, dice } = period;

  if (selection === 'Big') {
    return { won: size === 'Big' && !isTriple, multiplier: 1.96 };
  }
  if (selection === 'Small') {
    return { won: size === 'Small' && !isTriple, multiplier: 1.96 };
  }
  if (selection === 'Odd') {
    return { won: parity === 'Odd' && !isTriple, multiplier: 1.96 };
  }
  if (selection === 'Even') {
    return { won: parity === 'Even' && !isTriple, multiplier: 1.96 };
  }
  if (selection.startsWith('Sum_')) {
    const targetSum = parseInt(selection.replace('Sum_', ''), 10);
    const won = total === targetSum;
    const mult = K3_SUM_MULTIPLIERS[targetSum] || 6.0;
    return { won, multiplier: mult };
  }
  if (selection === 'Triple_Any') {
    return { won: isTriple, multiplier: 30.0 };
  }
  if (selection.startsWith('Triple_')) {
    const val = parseInt(selection.replace('Triple_', ''), 10);
    const won = isTriple && dice[0] === val;
    return { won, multiplier: 216.0 };
  }
  if (selection.startsWith('Double_')) {
    const val = parseInt(selection.replace('Double_', ''), 10);
    const count = dice.filter(d => d === val).length;
    return { won: count >= 2, multiplier: 13.8 };
  }

  return { won: false, multiplier: 0 };
}
