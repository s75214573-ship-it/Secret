import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, ADMIN_EMAIL } from '../context/AuthContext';
import { useContinuousGame } from '../context/ContinuousGameContext';
import { SupportTicket, SupportCategory, PaymentRequest, UserProfile, RealLiquidityStats } from '../types';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  updateDoc, 
  doc, 
  addDoc,
  getDocs,
  where
} from 'firebase/firestore';
import { triggerHaptic } from '../utils/haptics';
import { playClickSound, playWinSound, playTabSound } from '../utils/audio';
import confetti from 'canvas-confetti';
import { 
  ShieldCheck, 
  Crown, 
  Zap, 
  Wallet, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  Lock, 
  Sparkles,
  Clock,
  Check,
  X,
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  PlusCircle,
  AlertCircle,
  Search,
  Maximize2,
  Image as ImageIcon,
  RotateCcw,
  Eye,
  RefreshCw,
  Activity,
  BarChart3,
  Layers,
  Plane,
  Headphones,
  Sliders,
  DollarSign,
  SendHorizontal,
  ChevronRight,
  MessageSquare,
  HelpCircle,
  ExternalLink,
  Tag,
  Filter,
  Flame,
  Award
} from 'lucide-react';
import { getNumberColors, getNumberSize } from '../wingoLogic';

interface AdminSpecialPageProps {
  onBackToGame?: () => void;
  onOpenWallet?: (tab: 'deposit' | 'withdraw') => void;
}

export const AdminSpecialPage: React.FC<AdminSpecialPageProps> = ({ onBackToGame }) => {
  const { 
    user, 
    profile, 
    isAdmin, 
    paymentRequests, 
    pendingRequestsCount, 
    adminVerifyPaymentRequest, 
    adminGetAllUsers,
    adminUpdateUserWallet,
    adminUpdateUserProfile,
    adminGetRealLiquidity,
    adminAdjustPlatformVault
  } = useAuth();

  const { 
    wingoTimeLeft, 
    wingoCurrentPeriod, 
    wingoUpcomingResult, 
    wingoOverrides,
    adminSetWingoOverride, 
    adminClearWingoOverride, 
    getWingoUpcomingForecast,
    liveRoundPool, 
    liveGlobalBets,
    aviatorPhase,
    aviatorMultiplier,
    aviatorCrashPoint,
    aviatorCurrentRoundId,
    aviatorHistory
  } = useContinuousGame();

  // Sub-tabs within Admin Special Hub
  const [activeTab, setActiveTab] = useState<'wingo_oracle' | 'support_queries' | 'financial_approvals' | 'users_mgmt' | 'aviator_radar' | 'vault_liquidity'>('wingo_oracle');

  // Wingo Oracle state
  const [selectedTargetPeriod, setSelectedTargetPeriod] = useState<string>(wingoCurrentPeriod);
  const [customOverrideNum, setCustomOverrideNum] = useState<number | null>(null);
  const [overrideFeedback, setOverrideFeedback] = useState<{ text: string; ok: boolean } | null>(null);
  const [forecastCount, setForecastCount] = useState<number>(6);

  // Support Queries state
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(() => {
    try {
      const saved = localStorage.getItem('winxbet_support_tickets_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [ticketFilterStatus, setTicketFilterStatus] = useState<'all' | 'pending' | 'in_progress' | 'resolved'>('all');
  const [ticketFilterCategory, setTicketFilterCategory] = useState<string>('all');
  const [ticketSearchQuery, setTicketSearchQuery] = useState<string>('');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [adminReplyText, setAdminReplyText] = useState<string>('');
  const [directCreditAmount, setDirectCreditAmount] = useState<string>('');
  const [ticketActionLoading, setTicketActionLoading] = useState<boolean>(false);
  const [ticketSuccessNotice, setTicketSuccessNotice] = useState<string | null>(null);

  // Financial Approvals state
  const [payFilter, setPayFilter] = useState<'all' | 'pending' | 'deposit' | 'withdraw'>('pending');
  const [selectedProofRequest, setSelectedProofRequest] = useState<PaymentRequest | null>(null);
  const [rejectDialogRequest, setRejectDialogRequest] = useState<PaymentRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('UTR not found in bank statement');
  const [customRejectNote, setCustomRejectNote] = useState<string>('');
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Users Management state
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserProfile | null>(null);
  const [userBalanceAdjustInput, setUserBalanceAdjustInput] = useState<string>('500');
  const [userBalanceReason, setUserBalanceReason] = useState<string>('Admin Manual VIP Credit');

  // Vault state
  const [realLiquidity, setRealLiquidity] = useState<RealLiquidityStats | null>(null);
  const [loadingLiquidity, setLoadingLiquidity] = useState<boolean>(false);
  const [vaultInjectAmount, setVaultInjectAmount] = useState<string>('100000');
  const [vaultNotice, setVaultNotice] = useState<string | null>(null);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    triggerHaptic('light');
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  // Sync target period with active round
  useEffect(() => {
    setSelectedTargetPeriod(wingoCurrentPeriod);
  }, [wingoCurrentPeriod]);

  // Real-time Firestore sync for Support Tickets
  useEffect(() => {
    if (!db) return;
    try {
      const q = query(collection(db, 'supportTickets'), orderBy('createdAt', 'desc'), limit(60));
      const unsub = onSnapshot(q, (snapshot) => {
        const list: SupportTicket[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as SupportTicket);
        });

        if (list.length > 0) {
          setSupportTickets((prev) => {
            const map = new Map<string, SupportTicket>();
            list.forEach((t) => map.set(t.ticketNumber || t.id, t));
            prev.forEach((t) => {
              if (!map.has(t.ticketNumber || t.id)) {
                map.set(t.ticketNumber || t.id, t);
              }
            });
            const merged = Array.from(map.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            try {
              localStorage.setItem('winxbet_support_tickets_v1', JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
      }, (err) => {
        console.warn('Admin support tickets snapshot error:', err);
      });

      return () => unsub();
    } catch (e) {
      console.warn('Support tickets subscription setup error:', e);
    }
  }, []);

  // Fetch users when tab opens
  useEffect(() => {
    if (activeTab === 'users_mgmt') {
      loadUsers();
    } else if (activeTab === 'vault_liquidity') {
      loadLiquidity();
    }
  }, [activeTab]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const users = await adminGetAllUsers();
      setAllUsers(users);
    } catch (e) {
      console.warn('Failed to load users:', e);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadLiquidity = async () => {
    setLoadingLiquidity(true);
    try {
      const data = await adminGetRealLiquidity();
      setRealLiquidity(data);
    } catch (e) {
      console.warn('Failed to load liquidity:', e);
    } finally {
      setLoadingLiquidity(false);
    }
  };

  // Forecast list
  const upcomingForecast = useMemo(() => {
    return getWingoUpcomingForecast(forecastCount);
  }, [getWingoUpcomingForecast, forecastCount]);

  // Active round live bet statistics & risk matrix
  const activeRoundAnalysis = useMemo(() => {
    const periodBets = liveGlobalBets.filter(b => b.periodId === wingoCurrentPeriod);
    const totalWagered = periodBets.reduce((acc, b) => acc + (b.amount * b.multiplier), 0);

    const betsBySelection: Record<string, number> = {};
    periodBets.forEach(b => {
      betsBySelection[b.selection] = (betsBySelection[b.selection] || 0) + (b.amount * b.multiplier);
    });

    // Compute payout liability for each possible number (0 to 9)
    const liabilityByNumber: { num: number; totalPayout: number; netHouseProfit: number; colors: string[]; size: string }[] = [];
    for (let n = 0; n <= 9; n++) {
      const colors = getNumberColors(n);
      const size = getNumberSize(n);
      let payout = 0;

      // Exact number picks pay 9x
      if (betsBySelection[String(n)]) {
        payout += betsBySelection[String(n)] * 9;
      }
      // Colors
      if (colors.includes('Green') && betsBySelection['Green']) {
        payout += betsBySelection['Green'] * (n === 5 ? 1.5 : 2);
      }
      if (colors.includes('Red') && betsBySelection['Red']) {
        payout += betsBySelection['Red'] * (n === 0 ? 1.5 : 2);
      }
      if (colors.includes('Violet') && betsBySelection['Violet']) {
        payout += betsBySelection['Violet'] * 4.5;
      }
      // Sizes
      if (betsBySelection[size]) {
        payout += betsBySelection[size] * 2;
      }

      liabilityByNumber.push({
        num: n,
        totalPayout: payout,
        netHouseProfit: totalWagered - payout,
        colors,
        size
      });
    }

    // Sort by most profitable for platform
    liabilityByNumber.sort((a, b) => b.netHouseProfit - a.netHouseProfit);

    return {
      betsCount: periodBets.length,
      totalWagered,
      betsBySelection,
      liabilityByNumber,
      optimalNumber: liabilityByNumber[0]?.num ?? 7
    };
  }, [liveGlobalBets, wingoCurrentPeriod]);

  // Handle Apply Override
  const handleApplyOverride = async (periodId: string, targetNum: number) => {
    triggerHaptic('heavy');
    playClickSound();
    const res = await adminSetWingoOverride(periodId, targetNum);
    setOverrideFeedback({ text: res.message, ok: res.success });
    setTimeout(() => setOverrideFeedback(null), 4000);
  };

  // Handle Clear Override
  const handleClearOverride = async (periodId: string) => {
    triggerHaptic('medium');
    playClickSound();
    const res = await adminClearWingoOverride(periodId);
    setOverrideFeedback({ text: res.message, ok: res.success });
    setTimeout(() => setOverrideFeedback(null), 4000);
  };

  // Handle Solve Ticket
  const handleSolveTicket = async (ticket: SupportTicket, resolutionNotes?: string) => {
    triggerHaptic('success');
    playWinSound();
    setTicketActionLoading(true);
    const now = Date.now();
    const updated: SupportTicket = {
      ...ticket,
      status: 'resolved',
      updatedAt: now,
      resolvedAt: now,
      resolvedBy: user?.email || ADMIN_EMAIL,
      resolutionNotes: resolutionNotes || 'Solved by Admin',
      adminReply: resolutionNotes || ticket.adminReply || 'Your query has been solved by our VIP Super Admin team.'
    };

    setSupportTickets(prev => prev.map(t => (t.id === ticket.id || t.ticketNumber === ticket.ticketNumber ? updated : t)));
    if (selectedTicket?.id === ticket.id || selectedTicket?.ticketNumber === ticket.ticketNumber) {
      setSelectedTicket(updated);
    }

    try {
      localStorage.setItem('winxbet_support_tickets_v1', JSON.stringify(
        supportTickets.map(t => (t.id === ticket.id || t.ticketNumber === ticket.ticketNumber ? updated : t))
      ));

      if (db && ticket.id && !ticket.id.startsWith('ticket-')) {
        await updateDoc(doc(db, 'supportTickets', ticket.id), {
          status: 'resolved',
          updatedAt: now,
          resolvedAt: now,
          resolvedBy: user?.email || ADMIN_EMAIL,
          resolutionNotes: updated.resolutionNotes,
          adminReply: updated.adminReply
        });
      }
      setTicketSuccessNotice(`Ticket #${ticket.ticketNumber} marked as SOLVED!`);
      setTimeout(() => setTicketSuccessNotice(null), 3000);
    } catch (e) {
      console.warn('Failed to update ticket in firestore:', e);
    } finally {
      setTicketActionLoading(false);
    }
  };

  // Handle Send Admin Reply to Ticket
  const handleSendTicketReply = async (ticket: SupportTicket, replyMessage: string, setAsResolved: boolean = true) => {
    if (!replyMessage.trim()) return;
    triggerHaptic('success');
    playWinSound();
    setTicketActionLoading(true);
    const now = Date.now();
    const newStatus = setAsResolved ? 'resolved' : 'in_progress';
    const updated: SupportTicket = {
      ...ticket,
      status: newStatus,
      updatedAt: now,
      resolvedAt: setAsResolved ? now : ticket.resolvedAt,
      resolvedBy: user?.email || ADMIN_EMAIL,
      adminReply: replyMessage.trim()
    };

    setSupportTickets(prev => prev.map(t => (t.id === ticket.id || t.ticketNumber === ticket.ticketNumber ? updated : t)));
    setSelectedTicket(updated);
    setAdminReplyText('');

    try {
      localStorage.setItem('winxbet_support_tickets_v1', JSON.stringify(
        supportTickets.map(t => (t.id === ticket.id || t.ticketNumber === ticket.ticketNumber ? updated : t))
      ));

      if (db && ticket.id && !ticket.id.startsWith('ticket-')) {
        await updateDoc(doc(db, 'supportTickets', ticket.id), {
          status: newStatus,
          updatedAt: now,
          resolvedAt: updated.resolvedAt || null,
          resolvedBy: user?.email || ADMIN_EMAIL,
          adminReply: updated.adminReply
        });
      }
      setTicketSuccessNotice(`Reply dispatched to #${ticket.ticketNumber} (${newStatus.toUpperCase()})!`);
      setTimeout(() => setTicketSuccessNotice(null), 3500);
    } catch (e) {
      console.warn('Failed to update ticket reply in firestore:', e);
    } finally {
      setTicketActionLoading(false);
    }
  };

  // Handle Direct Wallet Credit & Solve
  const handleCreditAndSolve = async (ticket: SupportTicket) => {
    const amount = Number(directCreditAmount);
    if (!amount || amount <= 0) {
      alert('Please enter a valid credit amount in ₹.');
      return;
    }
    if (!ticket.userId || ticket.userId === 'guest') {
      alert('Cannot credit a guest user without valid user UID.');
      return;
    }

    setTicketActionLoading(true);
    triggerHaptic('heavy');
    try {
      const creditRes = await adminUpdateUserWallet(
        ticket.userId,
        'adjust',
        amount,
        `Support Resolution Credit (#${ticket.ticketNumber}): ${ticket.subject}`
      );

      if (creditRes.success) {
        confetti({ particleCount: 50, spread: 60 });
        const resolutionMsg = `Resolved with ₹${amount.toLocaleString()} balance credit to your wallet! Transaction has been credited successfully.`;
        await handleSendTicketReply(ticket, resolutionMsg, true);
        setDirectCreditAmount('');
        setTicketSuccessNotice(`Credited ₹${amount} to ${ticket.userDisplayName || 'User'} and solved ticket!`);
      } else {
        alert(creditRes.message || 'Failed to credit user wallet.');
      }
    } catch (err: any) {
      alert(err.message || 'Error processing wallet credit.');
    } finally {
      setTicketActionLoading(false);
    }
  };

  // Handle Verify Payment Request (Deposit/Withdraw)
  const handleVerifyPayment = async (requestId: string, approve: boolean, notes?: string, rejReason?: string) => {
    setApprovingId(requestId);
    triggerHaptic(approve ? 'heavy' : 'warning');
    try {
      const res = await adminVerifyPaymentRequest(requestId, approve, notes, rejReason);
      if (res.success) {
        if (approve) {
          confetti({ particleCount: 50, spread: 60 });
        }
        playWinSound();
        setSelectedProofRequest(null);
        setRejectDialogRequest(null);
      } else {
        alert(res.message);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setApprovingId(null);
    }
  };

  // Filtered support tickets
  const filteredTickets = useMemo(() => {
    return supportTickets.filter(t => {
      if (ticketFilterStatus !== 'all' && t.status !== ticketFilterStatus) return false;
      if (ticketFilterCategory !== 'all' && t.category !== ticketFilterCategory) return false;
      if (ticketSearchQuery.trim()) {
        const q = ticketSearchQuery.toLowerCase();
        const matchesNumber = (t.ticketNumber || '').toLowerCase().includes(q);
        const matchesUser = (t.userDisplayName || '').toLowerCase().includes(q) || (t.userEmail || '').toLowerCase().includes(q) || (t.userPhone || '').toLowerCase().includes(q);
        const matchesSubject = (t.subject || '').toLowerCase().includes(q);
        const matchesMsg = (t.message || '').toLowerCase().includes(q);
        const matchesRef = (t.referenceId || '').toLowerCase().includes(q);
        return matchesNumber || matchesUser || matchesSubject || matchesMsg || matchesRef;
      }
      return true;
    });
  }, [supportTickets, ticketFilterStatus, ticketFilterCategory, ticketSearchQuery]);

  const pendingTicketsCount = supportTickets.filter(t => t.status === 'pending').length;

  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-red-950/80 border border-red-500/40 flex items-center justify-center text-red-400">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-white">VIP Admin Access Restricted</h2>
        <p className="text-xs text-gray-400 max-w-sm">
          This Master Control Center is exclusively accessible to authorized platform administrators ({ADMIN_EMAIL}). Please log in with admin credentials to access special features.
        </p>
        {onBackToGame && (
          <button
            onClick={onBackToGame}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold rounded-xl text-xs"
          >
            Return to Games
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-12">
      {/* Top Super Admin Header */}
      <div className="bg-gradient-to-r from-gray-950 via-gray-900 to-amber-950/50 border border-amber-500/40 rounded-3xl p-4 sm:p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-400 flex items-center justify-center text-gray-950 shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/40">
              <Crown className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-white tracking-wide">
                  WinXbet Master Control Center
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-[9px] font-black text-amber-300 uppercase">
                  Super Admin
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1.5 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span>Live Admin Node: {user?.email || ADMIN_EMAIL}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onBackToGame && (
              <button
                onClick={onBackToGame}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded-xl border border-gray-700 flex items-center gap-1.5 transition"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Back to Lottery</span>
              </button>
            )}
          </div>
        </div>

        {/* Real-time System Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-3 border-t border-gray-800/80">
          <div className="bg-gray-950/70 border border-gray-800/80 rounded-2xl p-2.5">
            <span className="text-[10px] text-gray-400 block">Active WinGo Round</span>
            <div className="text-xs font-black text-white font-mono mt-0.5 truncate">
              #{wingoCurrentPeriod}
            </div>
            <div className="text-[10px] text-amber-400 font-bold mt-0.5">
              Ends in {wingoTimeLeft}s
            </div>
          </div>

          <div className="bg-gray-950/70 border border-gray-800/80 rounded-2xl p-2.5">
            <span className="text-[10px] text-gray-400 block">Pending User Queries</span>
            <div className="text-sm font-black text-rose-400 mt-0.5 flex items-center gap-1">
              <Headphones className="w-3.5 h-3.5" />
              <span>{pendingTicketsCount}</span>
            </div>
            <span className="text-[9px] text-gray-500">Requires resolution</span>
          </div>

          <div className="bg-gray-950/70 border border-gray-800/80 rounded-2xl p-2.5">
            <span className="text-[10px] text-gray-400 block">Financial Approvals</span>
            <div className="text-sm font-black text-amber-400 mt-0.5 flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5" />
              <span>{pendingRequestsCount}</span>
            </div>
            <span className="text-[9px] text-gray-500">Deposit / Payouts</span>
          </div>

          <div className="bg-gray-950/70 border border-gray-800/80 rounded-2xl p-2.5">
            <span className="text-[10px] text-gray-400 block">Aviator Round</span>
            <div className="text-xs font-black text-white font-mono mt-0.5 truncate">
              #{aviatorCurrentRoundId.slice(-6)}
            </div>
            <div className="text-[10px] text-emerald-400 font-bold mt-0.5 uppercase">
              {aviatorPhase} ({aviatorMultiplier.toFixed(2)}x)
            </div>
          </div>
        </div>
      </div>

      {/* Feature Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'wingo_oracle', label: 'WinGo Result Radar', icon: Eye, badge: `${wingoTimeLeft}s` },
          { id: 'support_queries', label: 'Support Queries', icon: Headphones, badge: pendingTicketsCount > 0 ? `${pendingTicketsCount}` : undefined, badgeColor: 'bg-rose-500 text-white' },
          { id: 'financial_approvals', label: 'Approvals', icon: CheckCircle2, badge: pendingRequestsCount > 0 ? `${pendingRequestsCount}` : undefined },
          { id: 'users_mgmt', label: 'Users & Balances', icon: Users },
          { id: 'aviator_radar', label: 'Aviator Flight', icon: Plane },
          { id: 'vault_liquidity', label: 'Vault & Liquidity', icon: LandmarkIcon }
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                triggerHaptic('selection');
                playTabSound();
                setActiveTab(tab.id as any);
              }}
              className={`px-3 py-2 rounded-2xl font-bold text-xs flex items-center gap-1.5 whitespace-nowrap transition flex-shrink-0 ${
                isSelected
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-gray-950 shadow-md shadow-amber-500/20 font-black'
                  : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                  tab.badgeColor || (isSelected ? 'bg-gray-950 text-amber-300' : 'bg-amber-500/20 text-amber-400')
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 1. WINGO RESULT RADAR & PRE-SESSION ORACLE CONTROLLER                     */}
      {/* ========================================================================= */}
      {activeTab === 'wingo_oracle' && (
        <div className="space-y-4">
          {/* Active Round Pre-Session Peek Banner */}
          <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-purple-950/40 border-2 border-amber-500/50 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-black text-amber-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    PRE-SESSION RESULT PEEK
                  </span>
                  <span className="text-xs text-gray-400 font-mono">Period #{wingoCurrentPeriod}</span>
                </div>
                <h2 className="text-lg font-black text-white mt-1">
                  Active Round Scheduled Outcome
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  This exact result will be published when the active 60s countdown hits zero.
                </p>
              </div>

              {/* Big Result Reveal Display */}
              <div className="flex items-center gap-3 bg-gray-950 border border-amber-500/40 p-3 rounded-2xl shadow-inner self-stretch sm:self-auto justify-around">
                <div className="text-center">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">Outcome Number</span>
                  <div className={`w-14 h-14 rounded-2xl mx-auto mt-1 flex items-center justify-center text-white font-black text-2xl shadow-xl ring-2 ${
                    wingoUpcomingResult.number === 0 ? 'bg-gradient-to-tr from-rose-600 to-purple-600 ring-rose-400' :
                    wingoUpcomingResult.number === 5 ? 'bg-gradient-to-tr from-emerald-600 to-purple-600 ring-emerald-400' :
                    [1, 3, 7, 9].includes(wingoUpcomingResult.number) ? 'bg-emerald-600 ring-emerald-400' : 'bg-rose-600 ring-rose-400'
                  }`}>
                    {wingoUpcomingResult.number}
                  </div>
                </div>

                <div className="text-left space-y-1">
                  <div>
                    <span className="text-[9px] text-gray-500 block uppercase">Colors</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      {wingoUpcomingResult.colors.map(c => (
                        <span key={c} className={`px-2 py-0.5 rounded-lg text-[10px] font-black text-white ${
                          c === 'Green' ? 'bg-emerald-600' : c === 'Red' ? 'bg-rose-600' : 'bg-purple-600'
                        }`}>
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[9px] text-gray-500 block uppercase">Size</span>
                    <span className="px-2 py-0.5 rounded-lg bg-gray-800 text-[10px] font-black text-amber-400 font-mono">
                      {wingoUpcomingResult.size}
                    </span>
                  </div>

                  <div className="text-[9px] text-gray-400 font-mono">
                    Mode: {wingoUpcomingResult.isOverridden ? (
                      <span className="text-amber-400 font-bold">ADMIN LOCKED</span>
                    ) : (
                      <span className="text-emerald-400">PROVABLY FAIR</span>
                    )}
                  </div>
                </div>

                <div className="text-center pl-2 border-l border-gray-800">
                  <span className="text-[9px] text-gray-400 block uppercase">Time Left</span>
                  <div className="text-2xl font-black text-amber-400 font-mono mt-0.5 animate-pulse">
                    {wingoTimeLeft}s
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Outcome Fate Override Dial */}
            <div className="mt-5 pt-4 border-t border-gray-800/80">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <span className="text-xs font-black text-gray-200 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  Pre-program Round Outcome Override (0-9):
                </span>
                {wingoUpcomingResult.isOverridden && (
                  <button
                    onClick={() => handleClearOverride(wingoCurrentPeriod)}
                    className="px-2.5 py-1 bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-300 rounded-lg text-[11px] font-bold flex items-center gap-1 transition"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset to Provably Fair Formula
                  </button>
                )}
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                  const colors = getNumberColors(num);
                  const isCurrentTarget = wingoUpcomingResult.number === num;
                  const isOverriddenHere = wingoOverrides[wingoCurrentPeriod] === num;
                  return (
                    <button
                      key={num}
                      onClick={() => handleApplyOverride(wingoCurrentPeriod, num)}
                      className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 border transition transform active:scale-95 ${
                        isCurrentTarget
                          ? 'ring-2 ring-amber-400 shadow-lg scale-105 ' + (
                              num === 0 ? 'bg-gradient-to-tr from-rose-600 to-purple-600 border-white text-white' :
                              num === 5 ? 'bg-gradient-to-tr from-emerald-600 to-purple-600 border-white text-white' :
                              [1, 3, 7, 9].includes(num) ? 'bg-emerald-600 border-white text-white' : 'bg-rose-600 border-white text-white'
                            )
                          : 'bg-gray-950 border-gray-800 hover:border-gray-600 text-gray-300'
                      }`}
                    >
                      <span className="text-base font-black font-mono">{num}</span>
                      <span className="text-[8px] font-bold uppercase truncate max-w-full">
                        {colors.join('/')}
                      </span>
                      {isOverriddenHere && (
                        <span className="text-[7px] font-black text-amber-300 uppercase">LOCKED</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {overrideFeedback && (
                <div className={`mt-2.5 p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                  overrideFeedback.ok ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300' : 'bg-red-950/80 border border-red-500/50 text-red-300'
                }`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{overrideFeedback.text}</span>
                </div>
              )}
            </div>
          </div>

          {/* Active Round Risk & House Liability Matrix */}
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-4 sm:p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-black text-white">
                  Active Round Risk Exposure & House Liability
                </h3>
              </div>
              <span className="text-xs text-gray-400 font-mono">
                Total Bets: {activeRoundAnalysis.betsCount} | Pool: ₹{activeRoundAnalysis.totalWagered.toLocaleString()}
              </span>
            </div>

            <p className="text-xs text-gray-400 mt-1">
              Real-time calculation of house payouts for each potential outcome number (0-9) based on current player wagers.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3.5">
              {activeRoundAnalysis.liabilityByNumber.map((item) => {
                const isSelectedOutcome = wingoUpcomingResult.number === item.num;
                const isProfitable = item.netHouseProfit >= 0;
                return (
                  <div
                    key={item.num}
                    onClick={() => handleApplyOverride(wingoCurrentPeriod, item.num)}
                    className={`p-2.5 rounded-2xl border cursor-pointer transition ${
                      isSelectedOutcome
                        ? 'bg-amber-500/15 border-amber-400 shadow-md ring-1 ring-amber-400'
                        : 'bg-gray-950/80 border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs text-white ${
                        item.num === 0 ? 'bg-gradient-to-tr from-rose-600 to-purple-600' :
                        item.num === 5 ? 'bg-gradient-to-tr from-emerald-600 to-purple-600' :
                        [1, 3, 7, 9].includes(item.num) ? 'bg-emerald-600' : 'bg-rose-600'
                      }`}>
                        {item.num}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">{item.size}</span>
                    </div>

                    <div className="mt-2 space-y-0.5">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-gray-500">Payout:</span>
                        <span className="font-mono text-gray-300">₹{Math.round(item.totalPayout)}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-gray-500">House:</span>
                        <span className={`font-mono font-bold ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isProfitable ? '+' : ''}₹{Math.round(item.netHouseProfit)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Multi-Period Forecast Radar (Next 6 Sessions) */}
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-4 sm:p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-black text-white">
                  Multi-Session Future Forecast Radar (Upcoming Rounds)
                </h3>
              </div>
              <span className="text-[10px] text-gray-500 font-mono">Next 6 Consecutive Rounds</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-3.5">
              {upcomingForecast.map((item, idx) => {
                const isOverridden = wingoOverrides[item.periodId] !== undefined;
                return (
                  <div
                    key={item.periodId}
                    className={`bg-gray-950 border rounded-2xl p-3 space-y-2 transition ${
                      idx === 0 ? 'border-amber-500/50 bg-amber-500/5' : 'border-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white font-mono">
                        #{item.periodId}
                      </span>
                      <span className={`text-[10px] font-bold ${idx === 0 ? 'text-amber-400 font-black' : 'text-gray-400'}`}>
                        {idx === 0 ? `Active (${item.timeLeft}s)` : `+${idx} min`}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg ${
                        item.number === 0 ? 'bg-gradient-to-tr from-rose-600 to-purple-600' :
                        item.number === 5 ? 'bg-gradient-to-tr from-emerald-600 to-purple-600' :
                        [1, 3, 7, 9].includes(item.number) ? 'bg-emerald-600' : 'bg-rose-600'
                      }`}>
                        {item.number}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex gap-1">
                          {item.colors.map(c => (
                            <span key={c} className="text-[9px] font-black text-gray-300">
                              {c}
                            </span>
                          ))}
                          <span className="text-[9px] text-gray-500">•</span>
                          <span className="text-[9px] font-bold text-amber-400 font-mono">{item.size}</span>
                        </div>
                        <div className="text-[9px] text-gray-500 font-mono">
                          {isOverridden ? 'ADMIN OVERRIDE' : 'PROVABLY FAIR'}
                        </div>
                      </div>
                    </div>

                    {/* Pre-set outcome selector for this upcoming round */}
                    <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between gap-1">
                      <span className="text-[9px] text-gray-500">Pre-set:</span>
                      <div className="flex gap-1">
                        {[0, 1, 3, 5, 7, 8].map(n => (
                          <button
                            key={n}
                            onClick={() => handleApplyOverride(item.periodId, n)}
                            className="w-5 h-5 rounded bg-gray-900 border border-gray-800 text-[9px] font-bold text-gray-300 hover:border-amber-400 hover:text-white"
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CUSTOMER SUPPORT QUERIES & RESOLUTION CENTER                           */}
      {/* ========================================================================= */}
      {activeTab === 'support_queries' && (
        <div className="space-y-4">
          {/* Header metrics */}
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-4 sm:p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Headphones className="w-5 h-5 text-amber-400" />
                  <h2 className="text-base font-black text-white">
                    User Support Queries & Ticket Solver Desk
                  </h2>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  View, answer, resolve, and issue instant wallet credits for player inquiries in real-time.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-amber-400/10 border border-amber-400/30 text-xs font-bold text-amber-300">
                  {supportTickets.length} Total Queries
                </span>
                <span className="px-3 py-1 rounded-xl bg-rose-500/20 border border-rose-500/40 text-xs font-bold text-rose-300">
                  {pendingTicketsCount} Pending
                </span>
              </div>
            </div>

            {ticketSuccessNotice && (
              <div className="mt-3 p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl text-xs font-bold text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{ticketSuccessNotice}</span>
              </div>
            )}

            {/* Filter and Search controls */}
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-gray-800">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by ticket #, user ID, email, UTR, or subject..."
                  value={ticketSearchQuery}
                  onChange={(e) => setTicketSearchQuery(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 placeholder-gray-500"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto">
                {(['all', 'pending', 'in_progress', 'resolved'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => {
                      triggerHaptic('light');
                      setTicketFilterStatus(status);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
                      ticketFilterStatus === status
                        ? 'bg-amber-500 text-gray-950'
                        : 'bg-gray-950 border border-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    {status.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Ticket List and Detail Solver layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Queries List (5 cols on large screen) */}
            <div className="lg:col-span-5 space-y-2.5 max-h-[650px] overflow-y-auto pr-1">
              {filteredTickets.length === 0 ? (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center text-gray-500 text-xs">
                  <Headphones className="w-8 h-8 mx-auto text-gray-600 mb-2" />
                  No support queries match this filter.
                </div>
              ) : (
                filteredTickets.map((ticket) => {
                  const isSelected = selectedTicket?.ticketNumber === ticket.ticketNumber || selectedTicket?.id === ticket.id;
                  return (
                    <div
                      key={ticket.id || ticket.ticketNumber}
                      onClick={() => {
                        triggerHaptic('selection');
                        setSelectedTicket(ticket);
                      }}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-400 shadow-md ring-1 ring-amber-400'
                          : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-amber-400 font-mono">
                            #{ticket.ticketNumber}
                          </span>
                          <span className="px-2 py-0.2 rounded bg-gray-800 text-[9px] font-bold text-gray-300 uppercase">
                            {ticket.category}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          ticket.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                          ticket.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' :
                          'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        }`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-white mt-1.5 line-clamp-1">
                        {ticket.subject}
                      </h4>
                      <p className="text-[11px] text-gray-400 line-clamp-2 mt-0.5">
                        {ticket.message}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-gray-500 mt-2 pt-2 border-t border-gray-800/80">
                        <span>User: {ticket.userDisplayName || ticket.userEmail || 'Member'}</span>
                        <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Query Solver Panel (7 cols on large screen) */}
            <div className="lg:col-span-7">
              {selectedTicket ? (
                <div className="bg-gray-900 border border-gray-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
                  {/* Ticket Header */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-amber-400 font-mono">
                          Ticket #{selectedTicket.ticketNumber}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          selectedTicket.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-400' :
                          selectedTicket.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-rose-500/20 text-rose-400'
                        }`}>
                          {selectedTicket.status.replace('_', ' ')}
                        </span>
                      </div>
                      <h3 className="text-base font-black text-white mt-1">
                        {selectedTicket.subject}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mt-1 font-mono">
                        <span>User: {selectedTicket.userDisplayName || 'Player'}</span>
                        {selectedTicket.userEmail && <span>• {selectedTicket.userEmail}</span>}
                        {selectedTicket.userPhone && <span>• {selectedTicket.userPhone}</span>}
                      </div>
                    </div>

                    <button
                      onClick={() => handleSolveTicket(selectedTicket)}
                      disabled={ticketActionLoading || selectedTicket.status === 'resolved'}
                      className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition ${
                        selectedTicket.status === 'resolved'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40 opacity-70 cursor-default'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{selectedTicket.status === 'resolved' ? 'SOLVED' : 'MARK SOLVED'}</span>
                    </button>
                  </div>

                  {/* Reference ID Pill (e.g. UTR or Bet ID) */}
                  {selectedTicket.referenceId && (
                    <div className="bg-gray-950 border border-gray-800 rounded-xl p-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-xs text-gray-400">Reference / UTR ID:</span>
                        <span className="text-xs font-mono font-bold text-white select-all">
                          {selectedTicket.referenceId}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopy(selectedTicket.referenceId!, 'ref')}
                        className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-[10px] font-bold flex items-center gap-1"
                      >
                        {copiedKey === 'ref' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>Copy</span>
                      </button>
                    </div>
                  )}

                  {/* User's Original Inquiry */}
                  <div className="bg-gray-950/70 border border-gray-800/80 rounded-2xl p-4">
                    <span className="text-[10px] font-black uppercase text-gray-500 block mb-1">
                      User Query Message:
                    </span>
                    <p className="text-xs text-gray-200 whitespace-pre-wrap leading-relaxed">
                      {selectedTicket.message}
                    </p>
                    <span className="text-[10px] text-gray-500 block mt-2">
                      Submitted: {new Date(selectedTicket.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {/* Existing Admin Reply / Resolution Notes if any */}
                  {selectedTicket.adminReply && (
                    <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4">
                      <span className="text-[10px] font-black uppercase text-emerald-400 block mb-1 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        Admin Official Solution / Reply:
                      </span>
                      <p className="text-xs text-emerald-200 whitespace-pre-wrap leading-relaxed">
                        {selectedTicket.adminReply}
                      </p>
                      {selectedTicket.resolvedBy && (
                        <span className="text-[10px] text-emerald-400/80 block mt-2">
                          Handled by: {selectedTicket.resolvedBy}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Quick Macro Solution Reply Chips */}
                  <div className="space-y-1.5 pt-2 border-t border-gray-800">
                    <span className="text-[11px] font-black text-gray-400">
                      1-Click Solution Macros:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: 'Deposit Approved', reply: '✅ Your deposit payment has been verified and your wallet balance has been credited.' },
                        { label: 'Withdrawal Sent', reply: '🏧 Your withdrawal request has been cleared and sent to your UPI / bank account.' },
                        { label: 'Fair Outcome Verified', reply: '🎯 Game outcome provably fair verification checked: hash and draw sequence confirmed authentic.' },
                        { label: 'VIP Bonus Granted', reply: '🎁 An exclusive VIP loyalty bonus has been added to your profile balance.' }
                      ].map((macro, i) => (
                        <button
                          key={i}
                          onClick={() => setAdminReplyText(macro.reply)}
                          className="px-2.5 py-1 bg-gray-950 hover:bg-gray-800 border border-gray-800 rounded-lg text-[10px] font-bold text-gray-300 hover:text-amber-300 transition"
                        >
                          {macro.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reply Input Box */}
                  <div className="space-y-2">
                    <textarea
                      rows={3}
                      value={adminReplyText}
                      onChange={(e) => setAdminReplyText(e.target.value)}
                      placeholder="Type custom admin resolution message to user..."
                      className="w-full bg-gray-950 border border-gray-800 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-amber-400 placeholder-gray-500"
                    />

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSendTicketReply(selectedTicket, adminReplyText, true)}
                          disabled={ticketActionLoading || !adminReplyText.trim()}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition"
                        >
                          <SendHorizontal className="w-3.5 h-3.5" />
                          <span>Reply & Mark Solved</span>
                        </button>
                        <button
                          onClick={() => handleSendTicketReply(selectedTicket, adminReplyText, false)}
                          disabled={ticketActionLoading || !adminReplyText.trim()}
                          className="px-3 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-200 rounded-xl text-xs font-bold transition"
                        >
                          Send In-Progress Update
                        </button>
                      </div>

                      {/* Direct Wallet Credit Solver Tool */}
                      {selectedTicket.userId && selectedTicket.userId !== 'guest' && (
                        <div className="flex items-center gap-1.5 bg-gray-950 border border-gray-800 p-1 rounded-xl">
                          <span className="text-[10px] text-gray-400 pl-1.5">₹ Credit:</span>
                          <input
                            type="number"
                            placeholder="500"
                            value={directCreditAmount}
                            onChange={(e) => setDirectCreditAmount(e.target.value)}
                            className="w-16 bg-gray-900 border border-gray-700 rounded px-1.5 py-1 text-xs text-white font-mono"
                          />
                          <button
                            onClick={() => handleCreditAndSolve(selectedTicket)}
                            disabled={ticketActionLoading || !directCreditAmount}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-950 rounded text-[10px] font-black uppercase"
                          >
                            Credit & Solve
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-900 border border-gray-800 rounded-3xl p-12 text-center text-gray-500 text-xs flex flex-col items-center justify-center min-h-[350px]">
                  <MessageSquare className="w-12 h-12 text-gray-700 mb-3" />
                  <h4 className="text-sm font-bold text-gray-300">No Query Selected</h4>
                  <p className="max-w-xs mt-1 text-gray-500">
                    Select a support ticket from the list on the left to review details, reply, or solve the query with instant balance settlement.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. FINANCIAL APPROVALS & UTR PROOF VERIFICATION                           */}
      {/* ========================================================================= */}
      {activeTab === 'financial_approvals' && (
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-4 sm:p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-amber-400" />
                  Deposit & Withdrawal Approvals
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Verify user UPI payment receipts, confirm 12-digit UTRs, and approve automated payouts.
                </p>
              </div>

              <div className="flex gap-1.5">
                {(['pending', 'deposit', 'withdraw', 'all'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setPayFilter(f)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
                      payFilter === f ? 'bg-amber-500 text-gray-950 font-black' : 'bg-gray-950 border border-gray-800 text-gray-400'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {paymentRequests
              .filter(r => (payFilter === 'all' ? true : payFilter === 'pending' ? r.status === 'pending' : r.type === payFilter))
              .map((req) => (
                <div
                  key={req.id}
                  className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        req.type === 'deposit' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {req.type}
                      </span>
                      <span className="text-sm font-black text-white font-mono">
                        ₹{req.amount.toLocaleString()}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        req.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                        req.status === 'rejected' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300 animate-pulse'
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    <div className="text-xs text-gray-400">
                      User: <span className="text-gray-200">{req.userDisplayName || req.userEmail || req.userId}</span>
                      {req.utrNumber && <span className="ml-2 font-mono text-amber-300">UTR: {req.utrNumber}</span>}
                      {req.upiId && <span className="ml-2 font-mono text-gray-300">UPI: {req.upiId}</span>}
                    </div>

                    <span className="text-[10px] text-gray-500 block">
                      Submitted: {new Date(req.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
                    {req.proofImageUrl && (
                      <button
                        onClick={() => setSelectedProofRequest(req)}
                        className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded-xl border border-gray-700 flex items-center gap-1"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                        <span>View Proof</span>
                      </button>
                    )}

                    {req.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleVerifyPayment(req.id!, true)}
                          disabled={approvingId === req.id}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-md transition"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectDialogRequest(req)}
                          disabled={approvingId === req.id}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. VIP USERS & BALANCE MANAGEMENT                                         */}
      {/* ========================================================================= */}
      {activeTab === 'users_mgmt' && (
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-4 sm:p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-400" />
                  VIP Players & Balance Adjustment Engine
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Direct balance injection, VIP upgrades, and account safety toggles for registered users.
                </p>
              </div>

              <button
                onClick={loadUsers}
                disabled={loadingUsers}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded-xl border border-gray-700 flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? 'animate-spin' : ''}`} />
                <span>Refresh Users</span>
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-800">
              <input
                type="text"
                placeholder="Search user by display name, email, phone, or UID..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 placeholder-gray-500"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            {allUsers
              .filter(u => {
                if (!userSearchQuery.trim()) return true;
                const q = userSearchQuery.toLowerCase();
                return (
                  (u.displayName || '').toLowerCase().includes(q) ||
                  (u.email || '').toLowerCase().includes(q) ||
                  (u.phoneNumber || '').toLowerCase().includes(q) ||
                  (u.uid || '').toLowerCase().includes(q)
                );
              })
              .map(u => (
                <div
                  key={u.uid}
                  className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white">{u.displayName || 'Member'}</span>
                      <span className="px-2 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-black">
                        VIP {u.vipLevel || 1}
                      </span>
                      {u.role === 'admin' && (
                        <span className="px-2 py-0.2 rounded bg-red-600 text-white text-[9px] font-black uppercase">
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 font-mono mt-0.5">
                      {u.email || u.phoneNumber} | Balance: <span className="font-bold text-emerald-400">₹{u.balance?.toLocaleString() || 0}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedUserForEdit(u)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-gray-950 text-xs font-black rounded-xl"
                    >
                      Adjust Balance
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. AVIATOR FLIGHT RADAR                                                   */}
      {/* ========================================================================= */}
      {activeTab === 'aviator_radar' && (
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plane className="w-5 h-5 text-rose-500" />
              <h2 className="text-base font-black text-white">Aviator Real-Time Flight Radar</h2>
            </div>
            <span className="text-xs font-mono text-gray-400">Round #{aviatorCurrentRoundId}</span>
          </div>

          <div className="bg-gray-950 border border-gray-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-around gap-4 text-center">
            <div>
              <span className="text-[10px] text-gray-500 uppercase block">Flight Phase</span>
              <span className="text-sm font-black text-white uppercase">{aviatorPhase}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 uppercase block">Live Multiplier</span>
              <span className="text-2xl font-black text-rose-400 font-mono">{aviatorMultiplier.toFixed(2)}x</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 uppercase block">Scheduled Crash Point</span>
              <span className="text-2xl font-black text-amber-400 font-mono">{aviatorCrashPoint.toFixed(2)}x</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. VAULT & LIQUIDITY                                                      */}
      {/* ========================================================================= */}
      {activeTab === 'vault_liquidity' && (
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <LandmarkIcon className="w-5 h-5 text-amber-400" />
              Platform Vault & Real Liquidity Reserve
            </h2>
            <button
              onClick={loadLiquidity}
              className="px-3 py-1 bg-gray-800 text-xs font-bold text-gray-300 rounded-lg"
            >
              Refresh
            </button>
          </div>

          {realLiquidity && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gray-950 p-3 rounded-2xl border border-gray-800">
                <span className="text-[10px] text-gray-400 block">Platform Reserve</span>
                <span className="text-base font-black text-emerald-400 font-mono">
                  ₹{realLiquidity.vaultReserve.toLocaleString()}
                </span>
              </div>
              <div className="bg-gray-950 p-3 rounded-2xl border border-gray-800">
                <span className="text-[10px] text-gray-400 block">User Balances</span>
                <span className="text-base font-black text-amber-400 font-mono">
                  ₹{realLiquidity.totalUserBalances.toLocaleString()}
                </span>
              </div>
              <div className="bg-gray-950 p-3 rounded-2xl border border-gray-800">
                <span className="text-[10px] text-gray-400 block">Approved Deposits</span>
                <span className="text-base font-black text-white font-mono">
                  ₹{realLiquidity.totalApprovedDeposits.toLocaleString()}
                </span>
              </div>
              <div className="bg-gray-950 p-3 rounded-2xl border border-gray-800">
                <span className="text-[10px] text-gray-400 block">Net Liquidity</span>
                <span className="text-base font-black text-emerald-400 font-mono">
                  ₹{realLiquidity.netLiquidity.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* 1-Click Vault Injection */}
          <div className="bg-gray-950 border border-gray-800 rounded-2xl p-4 space-y-2">
            <span className="text-xs font-black text-white block">Inject Liquidity to Platform Vault</span>
            <div className="flex gap-2">
              {['50000', '100000', '500000'].map(amt => (
                <button
                  key={amt}
                  onClick={async () => {
                    triggerHaptic('heavy');
                    const res = await adminAdjustPlatformVault(Number(amt), `Admin Injection ₹${amt}`);
                    if (res.success) {
                      confetti({ particleCount: 50, spread: 60 });
                      loadLiquidity();
                    }
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black"
                >
                  +₹{Number(amt).toLocaleString()}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Balance Adjust Modal for Selected User */}
      {selectedUserForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-amber-500/40 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-white">Adjust User Balance</h3>
              <button
                onClick={() => setSelectedUserForEdit(null)}
                className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-gray-300">
              User: <span className="font-bold text-amber-400">{selectedUserForEdit.displayName}</span>
              <div>Current Balance: ₹{selectedUserForEdit.balance?.toLocaleString() || 0}</div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] text-gray-400 block">Adjustment Amount (₹)</label>
              <input
                type="number"
                value={userBalanceAdjustInput}
                onChange={(e) => setUserBalanceAdjustInput(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-xs text-white font-mono"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={async () => {
                  const amt = Number(userBalanceAdjustInput);
                  if (!amt) return;
                  await adminUpdateUserWallet(selectedUserForEdit.uid, 'adjust', amt, userBalanceReason);
                  setSelectedUserForEdit(null);
                  loadUsers();
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl"
              >
                Credit +₹{Number(userBalanceAdjustInput).toLocaleString()}
              </button>
              <button
                onClick={async () => {
                  const amt = Number(userBalanceAdjustInput);
                  if (!amt) return;
                  await adminUpdateUserWallet(selectedUserForEdit.uid, 'adjust', -amt, userBalanceReason);
                  setSelectedUserForEdit(null);
                  loadUsers();
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl"
              >
                Deduct -₹{Number(userBalanceAdjustInput).toLocaleString()}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proof Lightbox Modal */}
      {selectedProofRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-5 max-w-md w-full space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black text-white">Payment Proof Screenshot</span>
              <button
                onClick={() => setSelectedProofRequest(null)}
                className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden max-h-[400px] flex items-center justify-center bg-gray-950">
              <img
                src={selectedProofRequest.proofImageUrl}
                alt="Payment Proof"
                className="max-h-[380px] w-auto object-contain rounded-xl"
              />
            </div>

            <div className="text-xs text-gray-400 space-y-1">
              <div>Amount: ₹{selectedProofRequest.amount.toLocaleString()}</div>
              {selectedProofRequest.utrNumber && <div>UTR: {selectedProofRequest.utrNumber}</div>}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleVerifyPayment(selectedProofRequest.id!, true)}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs"
              >
                Approve Payment
              </button>
              <button
                onClick={() => {
                  setRejectDialogRequest(selectedProofRequest);
                  setSelectedProofRequest(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Payment Dialog */}
      {rejectDialogRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-red-500/40 rounded-3xl p-5 max-w-sm w-full space-y-3">
            <h3 className="text-sm font-black text-white">Reject Request</h3>
            <p className="text-xs text-gray-400">
              Select reason for rejecting request of ₹{rejectDialogRequest.amount.toLocaleString()}
            </p>

            <select
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-xs text-white"
            >
              <option value="UTR not found in bank statement">UTR not found in bank statement</option>
              <option value="Amount mismatch on proof">Amount mismatch on proof</option>
              <option value="Duplicate UTR submission">Duplicate UTR submission</option>
              <option value="Blurry / Unreadable screenshot">Blurry / Unreadable screenshot</option>
              <option value="Invalid UPI ID">Invalid UPI ID</option>
              <option value="Other">Custom Reason</option>
            </select>

            <div className="flex gap-2">
              <button
                onClick={() => handleVerifyPayment(rejectDialogRequest.id!, false, undefined, rejectionReason)}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs"
              >
                Confirm Rejection
              </button>
              <button
                onClick={() => setRejectDialogRequest(null)}
                className="px-4 py-2 bg-gray-800 text-gray-300 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Simple Landmark Icon for Vault
function LandmarkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="3" x2="21" y1="22" y2="22" />
      <line x1="6" x2="6" y1="18" y2="11" />
      <line x1="10" x2="10" y1="18" y2="11" />
      <line x1="14" x2="14" y1="18" y2="11" />
      <line x1="18" x2="18" y1="18" y2="11" />
      <polygon points="12 2 20 7 4 7" />
    </svg>
  );
}
