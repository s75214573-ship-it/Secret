import React, { useState, useEffect } from 'react';
import { useAuth, ADMIN_EMAIL } from '../context/AuthContext';
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
  Smartphone,
  ExternalLink,
  RotateCcw,
  Eye,
  RefreshCw,
  Activity,
  BarChart3,
  PieChart,
  Layers,
  Plane,
  Headphones
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import confetti from 'canvas-confetti';
import { PaymentRequest, RealLiquidityStats } from '../types';
import { AdminUsersManagement } from './AdminUsersManagement';
import { AdminSupportTicketsManagement } from './AdminSupportTicketsManagement';
import { useContinuousGame } from '../context/ContinuousGameContext';

interface AdminConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminConsoleModal: React.FC<AdminConsoleModalProps> = ({ isOpen, onClose }) => {
  const { 
    profile, 
    adminAdjustBalance, 
    adminSetVipLevel, 
    paymentRequests, 
    pendingRequestsCount, 
    adminVerifyPaymentRequest,
    createTestPaymentRequest,
    adminGetRealLiquidity,
    adminAdjustPlatformVault
  } = useAuth();

  const { 
    liveRoundPool, 
    liveGlobalBets, 
    wingoCurrentPeriod, 
    wingoTimeLeft, 
    aviatorCurrentRoundId, 
    aviatorPhase, 
    aviatorMultiplier 
  } = useContinuousGame();

  const [activeTab, setActiveTab] = useState<'approvals' | 'live_bets' | 'users' | 'vault' | 'vip_rng' | 'support'>('approvals');
  const [betGameFilter, setBetGameFilter] = useState<'all' | 'wingo' | 'aviator'>('all');
  const [betSearchQuery, setBetSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'pending' | 'deposit' | 'withdraw' | 'completed' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customAmount, setCustomAmount] = useState<string>('50000');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [simulationMode, setSimulationMode] = useState<'standard' | 'lucky' | 'super_lucky'>('lucky');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Real Liquidity state (No fake data!)
  const [realLiquidity, setRealLiquidity] = useState<RealLiquidityStats | null>(null);
  const [loadingLiquidity, setLoadingLiquidity] = useState<boolean>(false);
  const [vaultInjectAmount, setVaultInjectAmount] = useState<string>('100000');

  // Proof Lightbox & Rejection Dialog state
  const [selectedProofRequest, setSelectedProofRequest] = useState<PaymentRequest | null>(null);
  const [rejectingRequest, setRejectingRequest] = useState<PaymentRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('UTR not found in bank statement');
  const [customRejectNote, setCustomRejectNote] = useState<string>('');

  const loadRealLiquidityData = async () => {
    setLoadingLiquidity(true);
    try {
      const data = await adminGetRealLiquidity();
      setRealLiquidity(data);
    } catch (err) {
      console.error('Failed to load real liquidity:', err);
    } finally {
      setLoadingLiquidity(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'vault') {
      loadRealLiquidityData();
    }
  }, [isOpen, activeTab]);

  const handleInjectVault = async (amount: number) => {
    try {
      setLoading(true);
      triggerHaptic('medium');
      const res = await adminAdjustPlatformVault(amount, `Admin Liquidity Injection +₹${amount.toLocaleString()}`);
      if (res.success) {
        confetti({ particleCount: 60, spread: 70 });
        setActionSuccess(`Injected ₹${amount.toLocaleString()} into Platform Vault!`);
        setTimeout(() => setActionSuccess(null), 3000);
        await loadRealLiquidityData();
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleCopyText = (text: string, key: string) => {
    triggerHaptic('light');
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleVerify = async (
    requestId: string,
    approve: boolean,
    note?: string,
    reason?: string
  ) => {
    try {
      setVerifyingId(requestId);
      triggerHaptic(approve ? 'success' : 'medium');
      const res = await adminVerifyPaymentRequest(requestId, approve, note, reason);
      if (res.success) {
        if (approve) {
          confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
        }
        setActionSuccess(res.message);
        // If current lightbox was for this request, close it
        if (selectedProofRequest?.id === requestId) {
          setSelectedProofRequest(null);
        }
        if (rejectingRequest?.id === requestId) {
          setRejectingRequest(null);
        }
        setTimeout(() => setActionSuccess(null), 4500);
      } else {
        triggerHaptic('error');
        setActionSuccess(`Verification Error: ${res.message}`);
        setTimeout(() => setActionSuccess(null), 4500);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setVerifyingId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingRequest?.id) return;
    const finalReason = rejectionReason === 'Custom' ? customRejectNote.trim() || 'Payment rejected by Admin' : rejectionReason;
    await handleVerify(rejectingRequest.id, false, undefined, finalReason);
    setRejectingRequest(null);
    setCustomRejectNote('');
  };

  const handleCreateSample = async (type: 'deposit' | 'withdraw', amount: number) => {
    try {
      triggerHaptic('selection');
      await createTestPaymentRequest(type, amount);
      setActionSuccess(`Sample ${type === 'deposit' ? 'deposit with verified receipt proof' : 'withdrawal'} of ₹${amount.toLocaleString()} generated!`);
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleQuickCredit = async (amount: number) => {
    try {
      setLoading(true);
      triggerHaptic('success');
      await adminAdjustBalance(amount, `Admin Quick Credit +₹${amount.toLocaleString()}`);
      setActionSuccess(`Credited ₹${amount.toLocaleString()} to admin wallet!`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSetVip = async (level: number) => {
    try {
      setLoading(true);
      triggerHaptic('medium');
      await adminSetVipLevel(level);
      setActionSuccess(`VIP Tier set to Level ${level}!`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Metrics
  const pendingDeposits = paymentRequests.filter(r => r.status === 'pending' && r.type === 'deposit');
  const pendingWithdrawals = paymentRequests.filter(r => r.status === 'pending' && r.type === 'withdraw');
  const pendingTotalAmount = paymentRequests
    .filter(r => r.status === 'pending')
    .reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
  const completedCount = paymentRequests.filter(r => r.status === 'completed').length;
  const rejectedCount = paymentRequests.filter(r => r.status === 'rejected').length;

  // Filter & Search payment requests
  const filteredRequests = paymentRequests.filter(req => {
    // Filter status / type
    if (filterType === 'pending' && req.status !== 'pending') return false;
    if (filterType === 'deposit' && req.type !== 'deposit') return false;
    if (filterType === 'withdraw' && req.type !== 'withdraw') return false;
    if (filterType === 'completed' && req.status !== 'completed') return false;
    if (filterType === 'rejected' && req.status !== 'rejected') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = req.userDisplayName?.toLowerCase().includes(q);
      const matchPhone = req.userPhone?.toLowerCase().includes(q);
      const matchEmail = req.userEmail?.toLowerCase().includes(q);
      const matchUtr = req.utrNumber?.toLowerCase().includes(q);
      const matchUpi = req.upiId?.toLowerCase().includes(q);
      const matchTx = req.txId?.toLowerCase().includes(q);
      const matchSender = req.senderName?.toLowerCase().includes(q) || req.senderUpiId?.toLowerCase().includes(q);
      return Boolean(matchName || matchPhone || matchEmail || matchUtr || matchUpi || matchTx || matchSender);
    }

    return true;
  });

  const standardRejectionReasons = [
    'UTR not found in bank statement',
    'Payment screenshot is blurred / unreadable',
    'Payment amount does not match requested amount',
    'Duplicate UTR reference already approved',
    'Beneficiary UPI ID is invalid / bank failure',
    'Custom'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-gray-950 border border-amber-500/40 rounded-3xl shadow-2xl shadow-amber-500/10 text-white overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-amber-600/30 via-red-600/20 to-gray-900 border-b border-amber-500/30 p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-gray-950 font-black shadow-lg shadow-amber-500/30 shrink-0">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wide text-white">Platform Admin Console</h2>
                <span className="text-[10px] px-2 py-0.5 bg-amber-400/20 text-amber-300 font-mono rounded-full border border-amber-400/30">
                  AUTHORITATIVE
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Deposit Proofs &amp; Withdrawal Verification Desk • Instant Balance Crediting
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-gray-900 hover:bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-800 bg-gray-900/90 text-xs sm:text-sm font-bold shrink-0">
          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('approvals');
            }}
            className={`flex-1 py-3 px-2 text-center flex items-center justify-center gap-1.5 border-b-2 transition ${
              activeTab === 'approvals'
                ? 'border-amber-500 text-amber-400 bg-gray-950'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span className="truncate">Approvals</span>
            {pendingRequestsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-red-500 text-white animate-pulse">
                {pendingRequestsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('live_bets');
            }}
            className={`flex-1 py-3 px-2 text-center flex items-center justify-center gap-1.5 border-b-2 transition ${
              activeTab === 'live_bets'
                ? 'border-amber-500 text-amber-400 bg-gray-950'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="truncate">Betting Volume</span>
            {liveGlobalBets.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                {liveGlobalBets.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('users');
            }}
            className={`flex-1 py-3 px-2 text-center flex items-center justify-center gap-1.5 border-b-2 transition ${
              activeTab === 'users'
                ? 'border-amber-500 text-amber-400 bg-gray-950'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Users className="w-4 h-4 text-amber-400" />
            <span className="truncate">Users &amp; Activity</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('vault');
            }}
            className={`flex-1 py-3 px-2 text-center flex items-center justify-center gap-1.5 border-b-2 transition ${
              activeTab === 'vault'
                ? 'border-amber-500 text-amber-400 bg-gray-950'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span className="truncate">Vault &amp; Liquidity</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('vip_rng');
            }}
            className={`flex-1 py-3 px-2 text-center flex items-center justify-center gap-1.5 border-b-2 transition ${
              activeTab === 'vip_rng'
                ? 'border-amber-500 text-amber-400 bg-gray-950'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>VIP &amp; RNG</span>
          </button>

          <button
            id="admin-tab-support"
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('support');
            }}
            className={`flex-1 py-3 px-2 text-center flex items-center justify-center gap-1.5 border-b-2 transition ${
              activeTab === 'support'
                ? 'border-amber-500 text-amber-400 bg-gray-950'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Headphones className="w-4 h-4 text-blue-400" />
            <span className="truncate">Support Desk</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {actionSuccess && (
            <div className="p-3 bg-emerald-950/90 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-medium">{actionSuccess}</span>
            </div>
          )}

          {/* TAB 1: APPROVALS & PROOFS DESK */}
          {activeTab === 'approvals' && (
            <div className="space-y-4">
              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-3 bg-gray-900/90 border border-amber-500/40 rounded-2xl">
                  <div className="text-gray-400 text-[11px] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" /> Pending Review
                  </div>
                  <div className="text-xl font-black text-amber-300 mt-1">
                    {pendingRequestsCount}
                  </div>
                  <div className="text-[10px] text-amber-400/80 font-mono mt-0.5">
                    ₹{pendingTotalAmount.toLocaleString()} total
                  </div>
                </div>

                <div className="p-3 bg-gray-900/90 border border-emerald-500/30 rounded-2xl">
                  <div className="text-gray-400 text-[11px] flex items-center gap-1">
                    <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" /> Pending Deposits
                  </div>
                  <div className="text-xl font-black text-emerald-400 mt-1">
                    {pendingDeposits.length}
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                    ₹{pendingDeposits.reduce((s, r) => s + (Number(r.amount) || 0), 0).toLocaleString()}
                  </div>
                </div>

                <div className="p-3 bg-gray-900/90 border border-blue-500/30 rounded-2xl">
                  <div className="text-gray-400 text-[11px] flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5 text-blue-400" /> Pending Payouts
                  </div>
                  <div className="text-xl font-black text-blue-400 mt-1">
                    {pendingWithdrawals.length}
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                    ₹{pendingWithdrawals.reduce((s, r) => s + (Number(r.amount) || 0), 0).toLocaleString()}
                  </div>
                </div>

                <div className="p-3 bg-gray-900/90 border border-gray-800 rounded-2xl">
                  <div className="text-gray-400 text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Processed
                  </div>
                  <div className="text-xl font-black text-white mt-1">
                    {completedCount + rejectedCount}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {completedCount} approved • {rejectedCount} rejected
                  </div>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="space-y-2 bg-gray-900/60 p-3 rounded-2xl border border-gray-800">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 sm:pb-0">
                    {[
                      { id: 'pending', label: `Pending (${pendingRequestsCount})` },
                      { id: 'all', label: `All (${paymentRequests.length})` },
                      { id: 'deposit', label: 'Deposits' },
                      { id: 'withdraw', label: 'Withdrawals' },
                      { id: 'completed', label: 'Approved' },
                      { id: 'rejected', label: 'Rejected' }
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => {
                          triggerHaptic('light');
                          setFilterType(f.id as any);
                        }}
                        className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap text-xs ${
                          filterType === f.id
                            ? 'bg-amber-500 text-gray-950 shadow-md'
                            : 'bg-gray-950 text-gray-400 hover:text-gray-200 border border-gray-800'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {/* Test Generator Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleCreateSample('deposit', 1500)}
                      className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 rounded-xl font-bold border border-emerald-500/30 text-[11px] flex items-center gap-1 transition"
                      title="Generates a test deposit with realistic payment proof receipt"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> + Test Deposit
                    </button>
                    <button
                      onClick={() => handleCreateSample('withdraw', 800)}
                      className="px-2.5 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 rounded-xl font-bold border border-blue-500/30 text-[11px] flex items-center gap-1 transition"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> + Test Payout
                    </button>
                  </div>
                </div>

                {/* Search Box */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Player Name, Phone, 12-digit UTR, UPI ID, or Tx ID..."
                    className="w-full pl-9 pr-8 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs p-1"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Requests Feed */}
              {filteredRequests.length === 0 ? (
                <div className="p-8 bg-gray-900/40 border border-gray-800 rounded-2xl text-center space-y-2 text-gray-500">
                  <Clock className="w-8 h-8 mx-auto text-gray-600" />
                  <p className="text-xs font-semibold">No payment verification requests match your filter.</p>
                  <p className="text-[11px] text-gray-600">
                    Use &quot;+ Test Deposit&quot; or submit a deposit with screenshot proof from the user Wallet modal!
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {filteredRequests.map((req) => {
                    const isPending = req.status === 'pending';
                    const isApproved = req.status === 'completed';
                    const isRejected = req.status === 'rejected';
                    const isBusy = verifyingId === req.id;

                    return (
                      <div
                        key={req.id || req.txId}
                        className={`p-4 rounded-2xl border transition ${
                          isPending
                            ? 'bg-gray-900 border-amber-500/50 shadow-lg shadow-amber-500/5'
                            : 'bg-gray-950 border-gray-800/80 opacity-90'
                        }`}
                      >
                        {/* Top Banner: Type, Amount, Status Badge */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-1 rounded-lg font-black text-xs uppercase flex items-center gap-1 ${
                                req.type === 'deposit'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                              }`}
                            >
                              {req.type === 'deposit' ? (
                                <>
                                  <ArrowDownLeft className="w-3.5 h-3.5" /> Deposit / Recharge
                                </>
                              ) : (
                                <>
                                  <ArrowUpRight className="w-3.5 h-3.5" /> Withdrawal Payout
                                </>
                              )}
                            </span>

                            <span className="text-xl font-black text-white tracking-tight">
                              ₹{req.amount.toLocaleString()}
                            </span>
                          </div>

                          {/* Status Pill */}
                          {isPending && (
                            <span className="px-2.5 py-1 bg-amber-500/20 border border-amber-500/50 text-amber-300 rounded-full font-bold text-xs flex items-center gap-1.5 animate-pulse">
                              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                              Awaiting Admin Approval
                            </span>
                          )}
                          {isApproved && (
                            <span className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-full font-bold text-xs flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Approved &amp; Credited
                            </span>
                          )}
                          {isRejected && (
                            <span className="px-2.5 py-1 bg-red-500/20 border border-red-500/40 text-red-400 rounded-full font-bold text-xs flex items-center gap-1">
                              <X className="w-3.5 h-3.5" />
                              Rejected
                            </span>
                          )}
                        </div>

                        {/* Player Details & Payment Proof Preview Section */}
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
                          {/* Col 1: Player & Transaction Data (7 cols) */}
                          <div className="md:col-span-7 bg-gray-950 p-3 rounded-xl border border-gray-800 space-y-2">
                            <div>
                              <span className="text-gray-500 text-[10px] block">Player Account</span>
                              <div className="font-bold text-gray-200 flex items-center gap-1.5">
                                <span>{req.userDisplayName || 'Player'}</span>
                                <span className="text-gray-500 font-normal">({req.userPhone || 'No Phone'})</span>
                              </div>
                              <div className="text-[10px] text-gray-400 font-mono">
                                UID: {req.userId}
                              </div>
                            </div>

                            <div className="pt-1 border-t border-gray-900">
                              <span className="text-gray-500 text-[10px] block">
                                {req.type === 'deposit' ? '12-Digit UPI UTR Reference' : 'Payout Destination UPI VPA'}
                              </span>
                              <div className="flex items-center justify-between font-mono font-bold text-amber-300 text-sm bg-black/40 px-2 py-1 rounded border border-gray-800 mt-0.5">
                                <span className="select-all">
                                  {req.type === 'deposit' ? req.utrNumber || 'N/A' : req.upiId || req.channel}
                                </span>
                                <button
                                  onClick={() =>
                                    handleCopyText(
                                      req.type === 'deposit' ? req.utrNumber || '' : req.upiId || '',
                                      req.id || req.txId
                                    )
                                  }
                                  className="text-gray-400 hover:text-white p-1"
                                  title="Copy"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              {copiedKey === (req.id || req.txId) && (
                                <span className="text-[10px] text-emerald-400 font-medium">Copied to clipboard!</span>
                              )}
                            </div>

                            <div className="text-[10px] text-gray-400 space-y-0.5 font-mono pt-1">
                              <div>Channel: <span className="text-gray-300">{req.channel}</span></div>
                              {req.paymentApp && <div>Payment App: <span className="text-gray-300">{req.paymentApp}</span></div>}
                              {req.senderName && <div>Sender Name: <span className="text-gray-300">{req.senderName}</span></div>}
                              {req.senderUpiId && <div>Sender UPI: <span className="text-gray-300">{req.senderUpiId}</span></div>}
                              <div>Tx ID: <span className="text-gray-300">{req.txId}</span></div>
                            </div>
                          </div>

                          {/* Col 2: Payment Proof Screenshot Card (5 cols) */}
                          <div className="md:col-span-5 bg-gray-950 p-3 rounded-xl border border-gray-800 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between text-[10px] text-gray-400 font-semibold uppercase mb-1.5">
                                <span className="flex items-center gap-1">
                                  <ImageIcon className="w-3 h-3 text-amber-400" />
                                  Payment Proof
                                </span>
                                {req.proofImageUrl ? (
                                  <span className="text-emerald-400 font-bold">ATTACHED</span>
                                ) : (
                                  <span className="text-gray-500 font-normal">NONE</span>
                                )}
                              </div>

                              {req.proofImageUrl ? (
                                <div 
                                  onClick={() => setSelectedProofRequest(req)}
                                  className="relative group rounded-xl overflow-hidden border border-gray-750 bg-black cursor-pointer aspect-video flex items-center justify-center"
                                  title="Click to inspect full high-resolution proof"
                                >
                                  <img
                                    src={req.proofImageUrl}
                                    alt="Payment Proof Receipt"
                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                                  />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition gap-1">
                                    <Maximize2 className="w-5 h-5 text-amber-400" />
                                    <span className="text-[11px] font-bold">Inspect Proof</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="rounded-xl border border-dashed border-gray-800 bg-black/40 p-4 text-center text-gray-500 text-[11px] flex flex-col items-center justify-center gap-1">
                                  <Smartphone className="w-5 h-5 text-gray-600" />
                                  <span>No screenshot uploaded</span>
                                  <span className="text-[10px] text-gray-600">Verify via Bank Statement UTR</span>
                                </div>
                              )}
                            </div>

                            {req.proofImageUrl && (
                              <button
                                onClick={() => setSelectedProofRequest(req)}
                                className="mt-2 w-full py-1.5 px-2 bg-gray-900 hover:bg-gray-850 text-amber-300 rounded-lg text-[11px] font-bold border border-amber-500/30 flex items-center justify-center gap-1 transition"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                View Full Screenshot
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Submission Time & Verification Footnote */}
                        <div className="mt-2.5 flex flex-wrap items-center justify-between text-[11px] text-gray-500 px-1 font-mono">
                          <span>
                            Submitted: {new Date(req.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                          {req.verifiedAt && (
                            <span className="text-gray-400">
                              Verified: {new Date(req.verifiedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                              {req.verifiedBy && ` by ${req.verifiedBy}`}
                            </span>
                          )}
                        </div>

                        {/* Admin Notes / Rejection Reason display */}
                        {req.adminNotes && (
                          <div className={`mt-2 p-2.5 rounded-xl text-xs border ${
                            isRejected 
                              ? 'bg-red-950/40 border-red-500/30 text-red-200' 
                              : 'bg-gray-950 border-gray-800 text-gray-300'
                          }`}>
                            <strong className={isRejected ? 'text-red-400' : 'text-amber-400'}>
                              {isRejected ? 'Rejection Reason: ' : 'Admin Note: '}
                            </strong>
                            <span>{req.rejectionReason || req.adminNotes}</span>
                          </div>
                        )}

                        {/* Admin Verification Action Buttons (Only when Pending) */}
                        {isPending && (
                          <div className="mt-3 pt-3 border-t border-gray-800 flex items-center gap-2">
                            <button
                              id={`admin-approve-btn-${req.id}`}
                              disabled={isBusy}
                              onClick={() => handleVerify(req.id!, true)}
                              className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-gray-950 font-black rounded-xl text-xs shadow-md shadow-emerald-500/20 transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                              <Check className="w-4 h-4 stroke-[3]" />
                              {isBusy ? (
                                'Processing...'
                              ) : req.type === 'deposit' ? (
                                `Approve & Credit ₹${req.amount.toLocaleString()} to Wallet`
                              ) : (
                                `Approve & Release Payout ₹${req.amount.toLocaleString()}`
                              )}
                            </button>

                            <button
                              id={`admin-reject-btn-${req.id}`}
                              disabled={isBusy}
                              onClick={() => setRejectingRequest(req)}
                              className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 font-bold rounded-xl text-xs transition active:scale-[0.98] disabled:opacity-50 flex items-center gap-1"
                            >
                              <X className="w-4 h-4" /> Reject Request
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: LIVE BETTING VOLUME & ANALYTICS ("How much are betted in what") */}
          {activeTab === 'live_bets' && (
            <div className="space-y-4">
              {/* Round Synchronization Header */}
              <div className="bg-gradient-to-r from-emerald-950/60 via-gray-900 to-gray-950 border border-emerald-500/30 rounded-2xl p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                        Cloud Engine • Real-Time Betting Volume
                      </span>
                    </div>
                    <div className="text-base sm:text-lg font-black text-white mt-1 flex items-center gap-2">
                      <span>WinGo Period: #{wingoCurrentPeriod}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold">
                        ⏳ {wingoTimeLeft}s
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      Aviator Round: <span className="font-mono text-gray-300 font-bold">{aviatorCurrentRoundId}</span> • 
                      Phase: <span className="font-mono text-amber-300 font-bold uppercase">{aviatorPhase}</span>
                      {aviatorPhase === 'flying' && <span className="text-emerald-400 font-bold"> ({aviatorMultiplier.toFixed(2)}x)</span>}
                    </div>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="flex-1 sm:flex-initial p-2.5 bg-black/40 border border-gray-800 rounded-xl text-center">
                      <div className="text-[10px] text-gray-400">Active Round Pool</div>
                      <div className="text-sm sm:text-base font-black text-amber-400 font-mono">
                        ₹{(liveRoundPool?.totalBetted || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex-1 sm:flex-initial p-2.5 bg-black/40 border border-gray-800 rounded-xl text-center">
                      <div className="text-[10px] text-gray-400">Active Bets</div>
                      <div className="text-sm sm:text-base font-black text-emerald-400 font-mono">
                        {liveRoundPool?.betsCount || 0}
                      </div>
                    </div>
                    <div className="flex-1 sm:flex-initial p-2.5 bg-black/40 border border-gray-800 rounded-xl text-center">
                      <div className="text-[10px] text-gray-400">House Fee (3%)</div>
                      <div className="text-sm sm:text-base font-black text-blue-400 font-mono">
                        ₹{(((liveRoundPool?.totalBetted || 0) * 0.03)).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION: "HOW MUCH ARE BETTED IN WHAT" */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-black uppercase tracking-wide text-gray-200">
                      Betting Volume by Selection (Round #{wingoCurrentPeriod})
                    </h3>
                  </div>
                  <span className="text-[11px] text-gray-400 font-mono">
                    Updated live from Firestore
                  </span>
                </div>

                {/* 1. Colors & Sizes Split */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Colors Volume */}
                  <div className="p-3.5 bg-gray-900/80 border border-gray-800 rounded-2xl space-y-2.5">
                    <div className="text-xs font-bold text-gray-300 flex items-center justify-between">
                      <span>Colors Pool Breakdown</span>
                      <span className="text-[10px] text-gray-500 font-mono">Odds: Green (2x), Red (2x), Violet (4.5x)</span>
                    </div>

                    <div className="space-y-2">
                      {/* Green */}
                      <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                          <div>
                            <span className="font-bold text-xs text-emerald-300">Green (1, 3, 7, 9)</span>
                            <div className="text-[10px] text-gray-400">
                              {liveRoundPool?.selectionCounts['Green'] || 0} player bets
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black font-mono text-emerald-400">
                            ₹{(liveRoundPool?.selectionTotals['Green'] || 0).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            {liveRoundPool?.totalBetted 
                              ? `${(((liveRoundPool.selectionTotals['Green'] || 0) / liveRoundPool.totalBetted) * 100).toFixed(1)}%` 
                              : '0%'}
                          </div>
                        </div>
                      </div>

                      {/* Red */}
                      <div className="p-2.5 bg-red-950/40 border border-red-500/30 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
                          <div>
                            <span className="font-bold text-xs text-red-300">Red (2, 4, 6, 8)</span>
                            <div className="text-[10px] text-gray-400">
                              {liveRoundPool?.selectionCounts['Red'] || 0} player bets
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black font-mono text-red-400">
                            ₹{(liveRoundPool?.selectionTotals['Red'] || 0).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            {liveRoundPool?.totalBetted 
                              ? `${(((liveRoundPool.selectionTotals['Red'] || 0) / liveRoundPool.totalBetted) * 100).toFixed(1)}%` 
                              : '0%'}
                          </div>
                        </div>
                      </div>

                      {/* Violet */}
                      <div className="p-2.5 bg-purple-950/40 border border-purple-500/30 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-purple-500 shrink-0" />
                          <div>
                            <span className="font-bold text-xs text-purple-300">Violet (0, 5)</span>
                            <div className="text-[10px] text-gray-400">
                              {liveRoundPool?.selectionCounts['Violet'] || 0} player bets
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black font-mono text-purple-400">
                            ₹{(liveRoundPool?.selectionTotals['Violet'] || 0).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            {liveRoundPool?.totalBetted 
                              ? `${(((liveRoundPool.selectionTotals['Violet'] || 0) / liveRoundPool.totalBetted) * 100).toFixed(1)}%` 
                              : '0%'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sizes Volume */}
                  <div className="p-3.5 bg-gray-900/80 border border-gray-800 rounded-2xl space-y-2.5">
                    <div className="text-xs font-bold text-gray-300 flex items-center justify-between">
                      <span>Sizes Pool Breakdown</span>
                      <span className="text-[10px] text-gray-500 font-mono">Odds: 2x Multiplier</span>
                    </div>

                    <div className="space-y-2">
                      {/* Big */}
                      <div className="p-2.5 bg-amber-950/30 border border-amber-500/30 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">🐘</span>
                          <div>
                            <span className="font-bold text-xs text-amber-300">Big (5, 6, 7, 8, 9)</span>
                            <div className="text-[10px] text-gray-400">
                              {liveRoundPool?.selectionCounts['Big'] || 0} player bets
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black font-mono text-amber-400">
                            ₹{(liveRoundPool?.selectionTotals['Big'] || 0).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            {liveRoundPool?.totalBetted 
                              ? `${(((liveRoundPool.selectionTotals['Big'] || 0) / liveRoundPool.totalBetted) * 100).toFixed(1)}%` 
                              : '0%'}
                          </div>
                        </div>
                      </div>

                      {/* Small */}
                      <div className="p-2.5 bg-blue-950/30 border border-blue-500/30 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">🐁</span>
                          <div>
                            <span className="font-bold text-xs text-blue-300">Small (0, 1, 2, 3, 4)</span>
                            <div className="text-[10px] text-gray-400">
                              {liveRoundPool?.selectionCounts['Small'] || 0} player bets
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black font-mono text-blue-400">
                            ₹{(liveRoundPool?.selectionTotals['Small'] || 0).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            {liveRoundPool?.totalBetted 
                              ? `${(((liveRoundPool.selectionTotals['Small'] || 0) / liveRoundPool.totalBetted) * 100).toFixed(1)}%` 
                              : '0%'}
                          </div>
                        </div>
                      </div>

                      {/* Aviator Flight Volume */}
                      <div className="p-2.5 bg-rose-950/30 border border-rose-500/30 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Plane className="w-3.5 h-3.5 text-rose-400" />
                          <div>
                            <span className="font-bold text-xs text-rose-300">Aviator Flights</span>
                            <div className="text-[10px] text-gray-400">
                              {liveGlobalBets.filter(b => b.gameType === 'aviator' && b.status === 'pending').length} active flight wagers
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black font-mono text-rose-400">
                            ₹{liveGlobalBets
                              .filter(b => b.gameType === 'aviator' && b.status === 'pending')
                              .reduce((sum, b) => sum + (Number(b.amount) || 0), 0)
                              .toLocaleString()}
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            Round {aviatorCurrentRoundId}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Numbers Matrix (0 to 9) */}
                <div className="p-3.5 bg-gray-900/80 border border-gray-800 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-300">Direct Number Wagers (0 - 9)</span>
                    <span className="text-[10px] text-amber-400 font-mono font-bold">Odds: 9x Payout</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                      const numKey = `Number ${num}`;
                      const altKey = String(num);
                      const amount = (liveRoundPool?.selectionTotals[numKey] || 0) + (liveRoundPool?.selectionTotals[altKey] || 0);
                      const count = (liveRoundPool?.selectionCounts[numKey] || 0) + (liveRoundPool?.selectionCounts[altKey] || 0);

                      let bgBadge = 'bg-red-500';
                      if (num === 0) bgBadge = 'bg-gradient-to-r from-red-500 to-purple-500';
                      else if (num === 5) bgBadge = 'bg-gradient-to-r from-emerald-500 to-purple-500';
                      else if ([1, 3, 7, 9].includes(num)) bgBadge = 'bg-emerald-500';

                      return (
                        <div
                          key={num}
                          className="p-2 bg-black/40 border border-gray-800 rounded-xl flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-6 h-6 rounded-lg ${bgBadge} text-white font-black text-xs flex items-center justify-center shadow`}>
                              {num}
                            </span>
                            <div className="text-[10px] text-gray-400 font-mono">
                              {count} bets
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-xs font-black font-mono ${amount > 0 ? 'text-amber-300' : 'text-gray-500'}`}>
                              ₹{amount.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* SECTION: REAL-TIME GLOBAL BETS LEDGER */}
              <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-gray-200">
                      Live Bets Stream ({liveGlobalBets.length} tracked)
                    </span>
                  </div>

                  {/* Filter tabs */}
                  <div className="flex items-center gap-1">
                    {(['all', 'wingo', 'aviator'] as const).map((g) => (
                      <button
                        key={g}
                        onClick={() => {
                          triggerHaptic('selection');
                          setBetGameFilter(g);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase transition ${
                          betGameFilter === g
                            ? 'bg-amber-500 text-gray-950 font-bold'
                            : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search field */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={betSearchQuery}
                    onChange={(e) => setBetSearchQuery(e.target.value)}
                    placeholder="Search by User phone, Period ID, or Selection..."
                    className="w-full pl-8 pr-3 py-1.5 bg-black/40 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Bets List */}
                <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                  {liveGlobalBets
                    .filter((b) => {
                      if (betGameFilter !== 'all' && b.gameType !== betGameFilter) return false;
                      if (!betSearchQuery) return true;
                      const q = betSearchQuery.toLowerCase();
                      return (
                        (b.userPhone && b.userPhone.toLowerCase().includes(q)) ||
                        (b.userDisplayName && b.userDisplayName.toLowerCase().includes(q)) ||
                        (b.selection && b.selection.toLowerCase().includes(q)) ||
                        (b.periodId && b.periodId.toLowerCase().includes(q))
                      );
                    })
                    .map((bet) => {
                      const isPending = bet.status === 'pending';
                      const isWon = bet.status === 'won';

                      return (
                        <div
                          key={bet.betId || bet.id}
                          className="p-2.5 bg-black/40 border border-gray-800/80 rounded-xl flex items-center justify-between text-xs hover:border-gray-700 transition"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              bet.gameType === 'wingo'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}>
                              {bet.gameType}
                            </span>
                            <div>
                              <div className="font-bold text-gray-200 flex items-center gap-1.5">
                                <span>{bet.userDisplayName || 'Player'}</span>
                                <span className="text-gray-500 font-mono text-[10px]">({bet.userPhone || 'User'})</span>
                              </div>
                              <div className="text-[10px] text-gray-400 font-mono">
                                Round: #{bet.periodId} • Selection: <strong className="text-amber-400">{bet.selection}</strong>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="font-black font-mono text-white">
                              ₹{(Number(bet.amount) || 0).toLocaleString()}
                            </div>
                            <div className="text-[10px] flex items-center justify-end gap-1 font-mono">
                              <span className="text-gray-500">Fee: ₹{(Number(bet.fee) || 0).toFixed(2)}</span>
                              <span>•</span>
                              <span className={`font-bold ${
                                isPending
                                  ? 'text-amber-400 animate-pulse'
                                  : isWon
                                  ? 'text-emerald-400'
                                  : 'text-red-400'
                              }`}>
                                {isPending ? 'Active' : isWon ? `+₹${(bet.winAmount || 0).toFixed(2)}` : 'Lost'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                  {liveGlobalBets.length === 0 && (
                    <div className="p-6 text-center text-gray-500 text-xs">
                      No bets placed yet. When players place bets, they will appear here in real-time.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {activeTab === 'users' && (
            <AdminUsersManagement />
          )}

          {/* TAB: VAULT & REAL LIQUIDITY (100% REAL DATA, NO FAKE NUMBERS) */}
          {activeTab === 'vault' && (
            <div className="space-y-4">
              {/* Live Real-Time Banner */}
              <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                  <div>
                    <div className="text-xs font-black text-emerald-300">
                      Real-Time Platform Solvency &amp; Liquidity Ledger
                    </div>
                    <div className="text-[10px] text-gray-400">
                      Calculated directly from live Firestore users &amp; payment transactions • No simulated values
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    triggerHaptic('light');
                    loadRealLiquidityData();
                  }}
                  disabled={loadingLiquidity}
                  className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingLiquidity ? 'animate-spin text-amber-400' : ''}`} />
                  <span>Refresh Real Data</span>
                </button>
              </div>

              {/* 6 Real Liquidity Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                {/* 1. Vault Reserve */}
                <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-3 text-center">
                  <div className="text-gray-400 flex items-center justify-center gap-1 text-[11px]">
                    <Wallet className="w-3.5 h-3.5 text-amber-400" /> Platform Vault
                  </div>
                  <div className="text-base sm:text-lg font-black text-amber-400 mt-1 font-mono">
                    ₹{(realLiquidity?.vaultReserve ?? 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-gray-400 font-medium mt-0.5">Persistent in Firestore</div>
                </div>

                {/* 2. Total User Balances (Platform Liability) */}
                <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-3 text-center">
                  <div className="text-gray-400 flex items-center justify-center gap-1 text-[11px]">
                    <Users className="w-3.5 h-3.5 text-red-400" /> User Balances (Liabilities)
                  </div>
                  <div className="text-base sm:text-lg font-black text-red-400 mt-1 font-mono">
                    ₹{(realLiquidity?.totalUserBalances ?? 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-gray-400 font-medium mt-0.5">Across all player wallets</div>
                </div>

                {/* 3. Net Liquidity Surplus */}
                <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-3 text-center">
                  <div className="text-gray-400 flex items-center justify-center gap-1 text-[11px]">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Net Solvency Surplus
                  </div>
                  <div className={`text-base sm:text-lg font-black mt-1 font-mono ${
                    (realLiquidity?.netLiquidity ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    ₹{(realLiquidity?.netLiquidity ?? 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-medium mt-0.5">
                    {(realLiquidity?.netLiquidity ?? 0) >= 0 ? '100% Solvent' : 'Deficit Alert'}
                  </div>
                </div>

                {/* 4. Total Approved Deposits */}
                <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-3 text-center">
                  <div className="text-gray-400 flex items-center justify-center gap-1 text-[11px]">
                    <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" /> Approved Deposits
                  </div>
                  <div className="text-base sm:text-lg font-black text-emerald-400 mt-1 font-mono">
                    ₹{(realLiquidity?.totalApprovedDeposits ?? 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-gray-400 font-medium mt-0.5">Lifetime deposit inflow</div>
                </div>

                {/* 5. Total Approved Withdrawals */}
                <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-3 text-center">
                  <div className="text-gray-400 flex items-center justify-center gap-1 text-[11px]">
                    <ArrowUpRight className="w-3.5 h-3.5 text-blue-400" /> Paid Withdrawals
                  </div>
                  <div className="text-base sm:text-lg font-black text-blue-400 mt-1 font-mono">
                    ₹{(realLiquidity?.totalApprovedWithdrawals ?? 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-gray-400 font-medium mt-0.5">Lifetime payouts released</div>
                </div>

                {/* 6. Registered Players */}
                <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-3 text-center">
                  <div className="text-gray-400 flex items-center justify-center gap-1 text-[11px]">
                    <Users className="w-3.5 h-3.5 text-purple-400" /> Registered Users
                  </div>
                  <div className="text-base sm:text-lg font-black text-purple-400 mt-1 font-mono">
                    {(realLiquidity?.totalRegisteredUsers ?? 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-purple-400 font-medium mt-0.5">Live database profiles</div>
                </div>
              </div>

              {/* Pending Liquidity Pipeline */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-3.5 grid grid-cols-2 gap-3 text-xs">
                <div className="bg-gray-950 p-3 rounded-xl border border-gray-800">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Pending Inflow (Deposits):</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded font-bold">
                      {pendingDeposits.length} pending
                    </span>
                  </div>
                  <div className="text-base font-black text-amber-400 font-mono mt-1">
                    ₹{(realLiquidity?.pendingDepositVolume ?? 0).toLocaleString()}
                  </div>
                </div>

                <div className="bg-gray-950 p-3 rounded-xl border border-gray-800">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Pending Outflow (Withdrawals):</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-red-500/20 text-red-300 rounded font-bold">
                      {pendingWithdrawals.length} pending
                    </span>
                  </div>
                  <div className="text-base font-black text-red-400 font-mono mt-1">
                    ₹{(realLiquidity?.pendingWithdrawalVolume ?? 0).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* PLATFORM VAULT LIQUIDITY INJECTION (Stores directly into Firestore system/vault) */}
              <div className="bg-gradient-to-br from-amber-500/10 via-gray-900 to-gray-950 border border-amber-500/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-black text-white">Platform Vault Reserve Capitalization</span>
                  </div>
                  <span className="text-[11px] text-amber-400 font-mono font-bold">
                    Vault Reserve: ₹{(realLiquidity?.vaultReserve ?? 0).toLocaleString()}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400">
                  Directly inject liquidity into the platform cold vault. This backs all player withdrawals and ensures instant solvency.
                </p>

                <div className="grid grid-cols-4 gap-2">
                  {[50000, 100000, 500000, 1000000].map((amt) => (
                    <button
                      key={amt}
                      disabled={loading}
                      onClick={() => handleInjectVault(amt)}
                      className="py-2 px-2 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 rounded-xl text-xs font-bold text-amber-300 transition"
                    >
                      +₹{amt >= 100000 ? `${amt / 100000} Lakh` : `${amt / 1000}k`}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="number"
                    value={vaultInjectAmount}
                    onChange={(e) => setVaultInjectAmount(e.target.value)}
                    placeholder="Custom Vault Amount"
                    className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <button
                    disabled={loading || !vaultInjectAmount}
                    onClick={() => handleInjectVault(Number(vaultInjectAmount) || 0)}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 rounded-xl text-xs font-black transition"
                  >
                    Inject into Vault
                  </button>
                </div>
              </div>

              {/* Admin Personal Testing Grants */}
              <div className="bg-gray-900/50 border border-gray-800/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-gray-200">Admin Personal Wallet Grants</span>
                  </div>
                  <span className="text-[11px] text-gray-400 font-mono">
                    Admin Balance: ₹{(profile?.balance || 0).toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <button
                    disabled={loading}
                    onClick={() => handleQuickCredit(10000)}
                    className="py-2 px-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-xs font-bold text-amber-300 transition"
                  >
                    +₹10,000
                  </button>
                  <button
                    disabled={loading}
                    onClick={() => handleQuickCredit(50000)}
                    className="py-2 px-2.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded-xl text-xs font-bold text-amber-300 transition"
                  >
                    +₹50,000
                  </button>
                  <button
                    disabled={loading}
                    onClick={() => handleQuickCredit(100000)}
                    className="py-2 px-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 rounded-xl text-xs font-black shadow-md transition"
                  >
                    +₹1,00,000
                  </button>
                  <button
                    disabled={loading}
                    onClick={() => handleQuickCredit(500000)}
                    className="py-2 px-2.5 bg-gradient-to-r from-red-600 to-amber-600 text-white rounded-xl text-xs font-black shadow-md transition"
                  >
                    +₹5,00,000
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="Custom Admin Amount"
                    className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <button
                    disabled={loading || !customAmount}
                    onClick={() => handleQuickCredit(Number(customAmount) || 0)}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold"
                  >
                    Credit Wallet
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: VIP & RNG */}
          {activeTab === 'vip_rng' && (
            <div className="space-y-4">
              <div className="bg-gray-900/50 border border-gray-800/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-gray-200">VIP Rank Override</span>
                  </div>
                  <span className="text-[11px] text-amber-400 font-bold">
                    Active Tier: VIP {profile?.vipLevel || 1}
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 3, 5, 8, 10].map((lvl) => (
                    <button
                      key={lvl}
                      disabled={loading}
                      onClick={() => handleSetVip(lvl)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition border ${
                        (profile?.vipLevel || 1) === lvl
                          ? 'bg-amber-500 text-gray-950 border-amber-400 font-black shadow-lg shadow-amber-500/20'
                          : 'bg-gray-950 hover:bg-gray-800 text-gray-300 border-gray-800'
                      }`}
                    >
                      VIP {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-gray-900/50 border border-gray-800/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-gray-200">WinGo RNG Test Calibration</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">
                    AUTHORITATIVE CALIBRATION
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      setSimulationMode('standard');
                      setActionSuccess('Simulation mode: Standard Fair Distribution active.');
                      setTimeout(() => setActionSuccess(null), 2500);
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs transition ${
                      simulationMode === 'standard'
                        ? 'bg-purple-950/40 border-purple-500 text-purple-200'
                        : 'bg-gray-950 border-gray-800 text-gray-400'
                    }`}
                  >
                    <div className="font-bold">Standard RNG</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">50/50 Equal Ratio</div>
                  </button>

                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      setSimulationMode('lucky');
                      setActionSuccess('Simulation mode: Lucky High Payout enabled!');
                      setTimeout(() => setActionSuccess(null), 2500);
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs transition ${
                      simulationMode === 'lucky'
                        ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200'
                        : 'bg-gray-950 border-gray-800 text-gray-400'
                    }`}
                  >
                    <div className="font-bold">Lucky Streak</div>
                    <div className="text-[10px] text-emerald-400/80 mt-0.5">70% Win Ratio</div>
                  </button>

                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      setSimulationMode('super_lucky');
                      setActionSuccess('Simulation mode: Jackpot Mode enabled!');
                      setTimeout(() => setActionSuccess(null), 2500);
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs transition ${
                      simulationMode === 'super_lucky'
                        ? 'bg-amber-950/40 border-amber-500 text-amber-200'
                        : 'bg-gray-950 border-gray-800 text-gray-400'
                    }`}
                  >
                    <div className="font-bold">Jackpot VIP</div>
                    <div className="text-[10px] text-amber-400/80 mt-0.5">High Multipliers</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: CUSTOMER CARE & SUPPORT DESK TICKETS */}
          {activeTab === 'support' && (
            <AdminSupportTicketsManagement />
          )}

          {/* Security details & Active Admin Identity */}
          <div className="p-3.5 bg-gray-950 border border-gray-800 rounded-2xl text-xs space-y-1.5 font-mono">
            <div className="flex items-center justify-between text-gray-400">
              <span className="flex items-center gap-1.5 text-gray-300">
                <Lock className="w-3.5 h-3.5 text-amber-400" /> Firestore Security Privileges
              </span>
              <span className="text-emerald-400 text-[10px] font-bold">VERIFIED ADMIN ACTIVE</span>
            </div>
            <div className="text-[11px] text-gray-400 space-y-0.5">
              <div><strong className="text-gray-300">Admin Email:</strong> {ADMIN_EMAIL}</div>
              <div><strong className="text-gray-300">Admin UID:</strong> {profile?.uid || 'Active Session'}</div>
              <div><strong className="text-gray-300">Approval Policy:</strong> Only Admin can approve or reject deposits/withdrawals</div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-900 border-t border-gray-800 p-4 flex items-center justify-between shrink-0">
          <div className="text-xs text-gray-400">
            Signed in as <span className="text-amber-400 font-bold">{ADMIN_EMAIL}</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-black rounded-xl text-xs shadow-md transition"
          >
            Done
          </button>
        </div>
      </div>

      {/* FULL-SCREEN PROOF LIGHTBOX MODAL */}
      {selectedProofRequest && (
        <div 
          onClick={() => setSelectedProofRequest(null)}
          className="fixed inset-0 z-60 bg-black/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-lg w-full bg-gray-900 border border-amber-500/40 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
          >
            {/* Lightbox Header */}
            <div className="p-3.5 bg-gray-950 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white">
                  Payment Proof Screenshot • ₹{selectedProofRequest.amount.toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setSelectedProofRequest(null)}
                className="w-7 h-7 rounded-full bg-gray-850 hover:bg-gray-750 flex items-center justify-center text-gray-400 hover:text-white text-sm transition"
              >
                ✕
              </button>
            </div>

            {/* Proof Image Viewport */}
            <div className="p-3 bg-black flex items-center justify-center overflow-auto flex-1 max-h-[60vh]">
              {selectedProofRequest.proofImageUrl ? (
                <img
                  src={selectedProofRequest.proofImageUrl}
                  alt="Full Payment Proof"
                  className="max-h-[56vh] w-auto object-contain rounded-xl shadow-2xl border border-gray-800"
                />
              ) : (
                <div className="text-gray-500 text-xs py-10">No image attached</div>
              )}
            </div>

            {/* Lightbox Metadata Bar */}
            <div className="p-3.5 bg-gray-950 border-t border-gray-800 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-gray-900 p-2.5 rounded-xl border border-gray-800">
                <div>
                  <span className="text-gray-500 block text-[10px]">Player</span>
                  <span className="text-white font-bold">{selectedProofRequest.userDisplayName}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">UTR / Reference</span>
                  <span className="text-amber-300 font-bold">{selectedProofRequest.utrNumber || selectedProofRequest.upiId || 'N/A'}</span>
                </div>
              </div>

              {/* Quick Action from Lightbox */}
              {selectedProofRequest.status === 'pending' && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleVerify(selectedProofRequest.id!, true)}
                    className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 text-gray-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    Approve &amp; Credit ₹{selectedProofRequest.amount.toLocaleString()}
                  </button>

                  <button
                    onClick={() => {
                      setRejectingRequest(selectedProofRequest);
                      setSelectedProofRequest(null);
                    }}
                    className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 font-bold rounded-xl text-xs flex items-center gap-1"
                  >
                    <X className="w-4 h-4" /> Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REJECTION REASON DIALOG MODAL */}
      {rejectingRequest && (
        <div 
          onClick={() => setRejectingRequest(null)}
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-gray-900 border border-red-500/40 rounded-2xl overflow-hidden shadow-2xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                <AlertCircle className="w-5 h-5" />
                <span>Reject Payment Request</span>
              </div>
              <button
                onClick={() => setRejectingRequest(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-gray-300 space-y-1">
              <div>
                Rejecting <strong className="text-white">{rejectingRequest.type.toUpperCase()}</strong> of{' '}
                <strong className="text-amber-400">₹{rejectingRequest.amount.toLocaleString()}</strong> for{' '}
                <strong className="text-white">{rejectingRequest.userDisplayName || 'Player'}</strong>.
              </div>
              {rejectingRequest.type === 'withdraw' && (
                <div className="p-2 bg-blue-950/40 border border-blue-500/30 rounded-lg text-[11px] text-blue-300">
                  ℹ️ Held funds will be automatically refunded back into the player&apos;s wallet upon rejection.
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-300 block">Select Rejection Reason:</label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {standardRejectionReasons.map((reason) => (
                  <label
                    key={reason}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition ${
                      rejectionReason === reason
                        ? 'border-red-500 bg-red-500/10 text-red-200'
                        : 'border-gray-800 bg-gray-950 text-gray-400 hover:bg-gray-850'
                    }`}
                  >
                    <input
                      type="radio"
                      name="rejectionReason"
                      value={reason}
                      checked={rejectionReason === reason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="text-red-500 focus:ring-0"
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>

              {rejectionReason === 'Custom' && (
                <div className="pt-2">
                  <textarea
                    rows={2}
                    value={customRejectNote}
                    onChange={(e) => setCustomRejectNote(e.target.value)}
                    placeholder="Enter custom rejection reason..."
                    className="w-full p-2.5 bg-gray-950 border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-gray-800">
              <button
                onClick={() => setRejectingRequest(null)}
                className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl text-xs transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl text-xs shadow-lg shadow-red-600/30 transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <X className="w-4 h-4 stroke-[3]" />
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
