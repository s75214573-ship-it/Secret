export interface UserProfile {
  uid: string;
  displayName: string;
  phoneNumber: string;
  email: string;
  balance: number;
  vipLevel: number;
  referralCode: string;
  referredBy?: string;
  totalRecharge: number;
  totalWithdraw: number;
  role?: 'admin' | 'user';
  createdAt: string;
  bonusPoints?: number;
  dailyStreak?: number;
  lastCheckInDate?: string;
  checkInHistory?: string[];
  todayDepositAmount?: number;
  todayDepositDate?: string;
  totalCommission?: number;
  totalInvited?: number;
  status?: 'active' | 'frozen' | 'restricted';
  adminNotes?: string;
  customPin?: string;
}

export interface RealLiquidityStats {
  vaultReserve: number;
  totalUserBalances: number;
  totalApprovedDeposits: number;
  totalApprovedWithdrawals: number;
  pendingDepositVolume: number;
  pendingWithdrawalVolume: number;
  totalRegisteredUsers: number;
  netLiquidity: number;
  totalTurnover: number;
  totalBetsCount: number;
  lastUpdated: string;
}

export interface ReferralMember {
  id: string;
  userId?: string;
  phoneNumber: string;
  displayName: string;
  level: 1 | 2 | 3;
  joinedAt: string;
  totalDeposit: number;
  totalTurnover: number;
  commissionEarned: number;
  status: 'active' | 'inactive';
}

export interface DailyClaimResult {
  success: boolean;
  message: string;
  pointsAwarded: number;
  cashBonus: number;
  streak: number;
  alreadyClaimed?: boolean;
  depositRequired?: number;
  currentDeposit?: number;
}

export interface GameBet {
  id?: string;
  userId: string;
  gameType: 'wingo-1m' | 'wingo-3m' | 'wingo-5m' | 'k3' | 'trx' | 'aviator';
  periodId: string;
  selection: string; // 'Green' | 'Violet' | 'Red' | 'Big' | 'Small' | '0'..'9'
  amount: number;
  multiplier: number;
  netAmount?: number; // Net amount betted after mandatory 3% fee deduction
  fee?: number; // Mandatory 3% fee deducted automatically
  result?: string;
  resultColor?: ('Green' | 'Violet' | 'Red')[];
  resultNumber?: number;
  resultSize?: 'Big' | 'Small';
  winAmount?: number;
  status: 'pending' | 'won' | 'lost';
  createdAt: string;
}

export interface BetResultNotification {
  id: string;
  status: 'won' | 'lost';
  winAmount: number;
  timestamp: number;
}

export interface Transaction {
  id?: string;
  userId: string;
  type: 'deposit' | 'withdraw' | 'bonus' | 'commission';
  amount: number;
  channel: string;
  status: 'completed' | 'processing' | 'failed' | 'pending' | 'rejected';
  txId: string;
  utrNumber?: string;
  proofImageUrl?: string;
  adminNotes?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface PaymentRequest {
  id?: string;
  userId: string;
  userDisplayName?: string;
  userPhone?: string;
  userEmail?: string;
  type: 'deposit' | 'withdraw';
  amount: number;
  channel: string;
  utrNumber?: string;
  upiId?: string;
  proofImageUrl?: string;
  proofFileName?: string;
  senderUpiId?: string;
  senderName?: string;
  paymentApp?: string;
  status: 'pending' | 'completed' | 'rejected';
  txId: string;
  adminNotes?: string;
  rejectionReason?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
}

export interface WingoPeriod {
  periodId: string;
  number: number;
  colors: ('Green' | 'Violet' | 'Red')[];
  size: 'Big' | 'Small';
  hash: string;
  time: string;
  timestamp: number; // Milliseconds timestamp for strict 1-hour retention policy
}

export interface AviatorRoundRecord {
  roundId: string;
  crashMultiplier: number;
  flightDurationSec: number;
  hash: string;
  time: string;
  timestamp: number; // Milliseconds timestamp for strict 1-hour retention policy
  tier: 'low' | 'medium' | 'high' | 'mega'; // <2x, 2-5x, 5-10x, 10x+
}

export interface AviatorActiveBet {
  betId: string;
  amount: number;
  autoCashout: boolean;
  autoCashoutMultiplier: number;
  status: 'active' | 'cashed_out' | 'lost';
  cashedMultiplier?: number;
  winAmount?: number;
}

export interface GlobalBet {
  id?: string;
  betId: string;
  userId: string;
  userDisplayName?: string;
  userPhone?: string;
  gameType: 'wingo' | 'aviator';
  periodId: string;
  selection: string;
  amount: number;
  multiplier: number;
  netAmount?: number;
  fee?: number;
  status: 'pending' | 'won' | 'lost';
  winAmount?: number;
  result?: string;
  createdAt: string;
  timestamp: number;
}

export interface LiveRoundBetPool {
  periodId: string;
  gameType: 'wingo' | 'aviator';
  totalBetted: number;
  betsCount: number;
  selectionTotals: Record<string, number>;
  selectionCounts: Record<string, number>;
  bets: GlobalBet[];
}

export type GameCategoryId = 'lottery' | 'original' | 'slots' | 'casino' | 'sports' | 'pvc';

export interface GameCategoryItem {
  name: string;
  multiplier: string;
  badge?: string;
  desc: string;
  iconName: string;
  gameRoute: 'wingo' | 'aviator' | 'k3' | 'trx' | 'slots';
}

export interface GameCategoryDefinition {
  id: GameCategoryId;
  name: string;
  title: string;
  tagline: string;
  description: string;
  howItWorks: string;
  payoutRange: string;
  volatility: 'Low' | 'Medium' | 'High' | 'Very High' | 'Low – Medium';
  drawInterval: string;
  provablyFairMethod: string;
  keyRules: string[];
  payoutStructure: { betType: string; multiplier: string; description: string }[];
  featuredGames: GameCategoryItem[];
}

export type SupportCategory = 'deposit' | 'withdraw' | 'game' | 'account' | 'vip' | 'general';

export interface SupportMessage {
  id: string;
  sender: 'user' | 'support' | 'admin';
  text: string;
  timestamp: number;
  ticketId?: string;
  isAutomated?: boolean;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId?: string;
  userDisplayName?: string;
  userPhone?: string;
  userEmail?: string;
  category: SupportCategory;
  subject: string;
  message: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: number;
  updatedAt: number;
  adminReply?: string;
  referenceId?: string; // e.g. UTR, Bet ID, Period ID
}

