import { DragonTigerPeriod } from './types';

export const CARD_SUITS = ['♠', '♥', '♦', '♣'] as const;
export const CARD_RANKS = [
  { rank: 1, label: 'A' },
  { rank: 2, label: '2' },
  { rank: 3, label: '3' },
  { rank: 4, label: '4' },
  { rank: 5, label: '5' },
  { rank: 6, label: '6' },
  { rank: 7, label: '7' },
  { rank: 8, label: '8' },
  { rank: 9, label: '9' },
  { rank: 10, label: '10' },
  { rank: 11, label: 'J' },
  { rank: 12, label: 'Q' },
  { rank: 13, label: 'K' },
];

export function getDeterministicDragonTiger(roundId: string): {
  dragonCard: DragonTigerPeriod['dragonCard'];
  tigerCard: DragonTigerPeriod['tigerCard'];
  winner: 'dragon' | 'tiger' | 'tie';
} {
  let hash = 0;
  const str = `DT_PROVABLY_FAIR_${roundId}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const abs = Math.abs(hash);

  const dRankIdx = abs % 13;
  const dSuitIdx = Math.floor(abs / 13) % 4;
  const dRank = CARD_RANKS[dRankIdx];
  const dSuit = CARD_SUITS[dSuitIdx];
  const dColor = dSuit === '♥' || dSuit === '♦' ? 'red' : 'black';

  const tRankIdx = (Math.floor(abs / 52) + 3) % 13;
  const tSuitIdx = (Math.floor(abs / 208) + 1) % 4;
  const tRank = CARD_RANKS[tRankIdx];
  const tSuit = CARD_SUITS[tSuitIdx];
  const tColor = tSuit === '♥' || tSuit === '♦' ? 'red' : 'black';

  let winner: 'dragon' | 'tiger' | 'tie' = 'tie';
  if (dRank.rank > tRank.rank) winner = 'dragon';
  else if (tRank.rank > dRank.rank) winner = 'tiger';

  return {
    dragonCard: { rank: dRank.rank, label: dRank.label, suit: dSuit, color: dColor },
    tigerCard: { rank: tRank.rank, label: tRank.label, suit: tSuit, color: tColor },
    winner,
  };
}

export function generateHistoricalDragonTiger(count: number = 30): DragonTigerPeriod[] {
  const list: DragonTigerPeriod[] = [];
  const now = Date.now();
  const currentBase = Math.floor(now / 18000);
  for (let i = 1; i <= count; i++) {
    const roundIdx = currentBase - i;
    const roundId = `DT-${roundIdx}`;
    const pastTime = now - i * 18000;
    const { dragonCard, tigerCard, winner } = getDeterministicDragonTiger(roundId);
    const d = new Date(pastTime);
    const time = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
    list.push({
      roundId,
      dragonCard,
      tigerCard,
      winner,
      time,
      timestamp: pastTime,
    });
  }
  return list;
}
