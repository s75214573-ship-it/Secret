import React, { useState, useMemo } from 'react';
import { useAuth, DAILY_CHECKIN_MIN_DEPOSIT } from '../context/AuthContext';
import { 
  Users, 
  Gift, 
  Copy, 
  Check, 
  Award, 
  TrendingUp, 
  Sparkles, 
  Share2, 
  Coins, 
  Search, 
  ArrowUpRight, 
  CheckCircle2, 
  DollarSign, 
  ExternalLink,
  MessageCircle,
  Clock,
  ShieldCheck,
  Radio
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { triggerHaptic } from '../utils/haptics';

interface PromotionViewProps {
  onOpenWallet?: (tab?: 'deposit' | 'withdraw') => void;
}

export const PromotionView: React.FC<PromotionViewProps> = ({ onOpenWallet }) => {
  const { 
    profile, 
    referrals, 
    claimDailyBonus, 
    isDailyClaimedToday,
    todayDepositAmount,
    todayPendingDepositAmount,
    isDailyClaimEligible
  } = useAuth();
  
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [bonusClaimed, setBonusClaimed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'level1' | 'level2' | 'top'>('all');
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const referralCode = profile?.referralCode || 'WINX786';
  const siteOrigin = typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')
    ? window.location.origin
    : 'https://winxbet-indol-ten.vercel.app';
  const inviteUrl = `${siteOrigin}/#/register?invitationCode=${referralCode}`;
  const isClaimed = isDailyClaimedToday || bonusClaimed;

  // Aggregate stats from real referral list
  const totalInvited = referrals.length;
  const directInvitedCount = referrals.filter(r => r.level === 1).length;
  const subTeamCount = referrals.filter(r => r.level > 1).length;
  
  const totalCommission = useMemo(() => {
    return referrals.reduce((acc, curr) => acc + (curr.commissionEarned || 0), 0);
  }, [referrals]);

  const totalTeamTurnover = useMemo(() => {
    return referrals.reduce((acc, curr) => acc + (curr.totalTurnover || 0), 0);
  }, [referrals]);

  // Filtered referrals list
  const filteredReferrals = useMemo(() => {
    let list = [...referrals];
    
    if (activeTab === 'level1') {
      list = list.filter(r => r.level === 1);
    } else if (activeTab === 'level2') {
      list = list.filter(r => r.level >= 2);
    } else if (activeTab === 'top') {
      list.sort((a, b) => b.commissionEarned - a.commissionEarned);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(r => 
        r.displayName.toLowerCase().includes(q) || 
        r.phoneNumber.toLowerCase().includes(q)
      );
    }

    return list;
  }, [referrals, activeTab, searchQuery]);

  const handleCopyLink = () => {
    triggerHaptic('success');
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setStatusNotice('Referral link copied to clipboard!');
    setTimeout(() => {
      setCopiedLink(false);
      setStatusNotice(null);
    }, 2500);
  };

  const handleCopyCode = () => {
    triggerHaptic('light');
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setStatusNotice(`Referral code "${referralCode}" copied!`);
    setTimeout(() => {
      setCopiedCode(false);
      setStatusNotice(null);
    }, 2000);
  };

  const handleShareNative = async () => {
    triggerHaptic('medium');
    const shareText = `Join me on WinXbet! Register with my exclusive invitation code ${referralCode} to claim ₹68 instant cash bonus and start winning daily: ${inviteUrl}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'WinXbet VIP Partner Invitation',
          text: shareText,
          url: inviteUrl
        });
      } catch {
        // User cancelled or dismissed share dialog
      }
    } else {
      handleCopyLink();
    }
  };

  const handleShareWhatsApp = () => {
    triggerHaptic('light');
    const shareText = encodeURIComponent(
      `🔥 Register on WinXbet now with my VIP code ${referralCode} and receive ₹68 free welcome bonus!\n\nJoin here: ${inviteUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${shareText}`, '_blank');
  };

  const handleShareTelegram = () => {
    triggerHaptic('light');
    const text = encodeURIComponent(`Register with my referral code ${referralCode} to get ₹68 instant bonus!`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${text}`, '_blank');
  };

  const handleDailyCheckIn = async () => {
    if (isClaimed) return;
    if (!isDailyClaimEligible) {
      triggerHaptic('error');
      if (todayPendingDepositAmount > 0) {
        setStatusNotice(`Recharge of ₹${todayPendingDepositAmount.toLocaleString()} is pending Admin verification. Check back soon!`);
      } else {
        setStatusNotice(`Daily check-in requires ₹${DAILY_CHECKIN_MIN_DEPOSIT} deposit today (Current: ₹${todayDepositAmount}). Opening recharge wallet...`);
        if (onOpenWallet) {
          setTimeout(() => onOpenWallet('deposit'), 800);
        }
      }
      setTimeout(() => setStatusNotice(null), 4000);
      return;
    }
    triggerHaptic('success');
    const res = await claimDailyBonus();
    if (res.success) {
      confetti({ particleCount: 70, spread: 60 });
      setBonusClaimed(true);
      setStatusNotice(`Claimed ₹10 daily bonus! Credited to wallet.`);
      setTimeout(() => setStatusNotice(null), 4000);
    } else {
      setStatusNotice(res.message);
      setTimeout(() => setStatusNotice(null), 4000);
    }
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Toast Notice */}
      {statusNotice && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border border-emerald-400/50 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{statusNotice}</span>
        </div>
      )}

      {/* Promotion Hero Banner */}
      <div className="bg-gradient-to-br from-amber-600 via-red-600 to-rose-700 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-black/30 rounded-full text-xs font-semibold backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Lifetime Multi-Tier Agent Network</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Referral Partner Program</h2>
          <p className="text-xs text-white/85 max-w-md leading-relaxed">
            Invite players with your unique referral link to earn continuous commissions on every game round they play, deposited straight to your wallet.
          </p>

          <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-bold">
            <div className="px-2.5 py-1 bg-black/40 rounded-lg border border-white/15">
              Direct Level 1: <span className="text-amber-300 font-extrabold">0.60%</span>
            </div>
            <div className="px-2.5 py-1 bg-black/40 rounded-lg border border-white/15">
              Sub-team Level 2: <span className="text-amber-300 font-extrabold">0.18%</span>
            </div>
            <div className="px-2.5 py-1 bg-black/40 rounded-lg border border-white/15">
              Network Level 3: <span className="text-amber-300 font-extrabold">0.05%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Key Referral Statistics Dashboard Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Total Invited */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-3.5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[11px] font-bold">Total Invited</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white tracking-tight">{totalInvited}</div>
          <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
            <span className="text-amber-400 font-bold">{directInvitedCount} Direct</span>
            <span>•</span>
            <span className="text-gray-500">{subTeamCount} Sub-team</span>
          </div>
        </div>

        {/* Total Commission Earnings */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-emerald-500/30 rounded-2xl p-3.5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[11px] font-bold">Total Earnings</span>
            <Coins className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 tracking-tight font-mono">
            ₹{totalCommission.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-emerald-300/80 mt-1 flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3 h-3" />
            <span>Credited to Wallet</span>
          </div>
        </div>

        {/* Total Team Turnover */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-3.5 shadow-lg">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[11px] font-bold">Team Turnover</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-black text-white tracking-tight font-mono">
            ₹{totalTeamTurnover.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[10px] text-gray-400 mt-1">
            Total betting volume
          </div>
        </div>

        {/* Daily Bonus Reward */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-3.5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[11px] font-bold">Daily Check-in</span>
            <Gift className="w-4 h-4 text-amber-400" />
          </div>
          <button
            id="daily-checkin-quick-btn"
            onClick={handleDailyCheckIn}
            disabled={isClaimed}
            className={`w-full py-1.5 px-2 rounded-xl text-xs font-black transition text-center ${
              isClaimed
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : isDailyClaimEligible
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-gray-950 hover:from-emerald-400 hover:to-teal-400 shadow-md'
                : todayPendingDepositAmount > 0
                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                : 'bg-gradient-to-r from-amber-500 to-red-500 text-gray-950 hover:from-amber-400 hover:to-red-400 shadow-md'
            }`}
          >
            {isClaimed 
              ? 'Claimed ✓' 
              : isDailyClaimEligible 
              ? 'Claim ₹10 Free' 
              : todayPendingDepositAmount > 0 
              ? 'Pending Review' 
              : `Recharge ₹${Math.max(100, DAILY_CHECKIN_MIN_DEPOSIT - todayDepositAmount)}`}
          </button>
        </div>
      </div>

      {/* Unique Referral Link & Code Box */}
      <div id="unique-referral-link-section" className="bg-gradient-to-br from-gray-900 via-gray-950 to-black border border-amber-500/30 rounded-3xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center font-bold">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-white text-sm">Your Unique Referral Link</h3>
              <p className="text-[11px] text-gray-400">Share with friends to automatically bind them as your downline</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-bold shadow-sm">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Real-time Live Sync</span>
          </div>
        </div>

        {/* Code and Link container */}
        <div className="p-4 bg-gray-950 border border-gray-800 rounded-2xl space-y-3">
          {/* Referral Code Row */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Referral Code</span>
              <div className="font-mono font-black text-amber-400 text-lg tracking-widest mt-0.5">
                {referralCode}
              </div>
            </div>
            <button
              id="copy-referral-code-btn"
              onClick={handleCopyCode}
              className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>

          {/* Full Unique Link & Primary Copy Button */}
          <div className="pt-3 border-t border-gray-800/80 space-y-2">
            <span className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Unique Invitation URL</span>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex-1 px-3 py-2 bg-gray-900/90 border border-gray-800 rounded-xl text-xs text-gray-300 font-mono truncate select-all">
                {inviteUrl}
              </div>
              <button
                id="copy-unique-referral-link-btn"
                onClick={handleCopyLink}
                className="px-5 py-2.5 bg-gradient-to-r from-red-600 via-red-500 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition active:scale-95 shrink-0"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Unique Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Social Sharing Row */}
          <div className="pt-2 flex items-center gap-2 text-xs">
            <span className="text-gray-400 text-[11px] font-semibold">Quick Share:</span>
            <button
              id="share-whatsapp-btn"
              onClick={handleShareWhatsApp}
              className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold flex items-center gap-1.5 transition text-[11px]"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
            <button
              id="share-telegram-btn"
              onClick={handleShareTelegram}
              className="px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/30 rounded-xl font-bold flex items-center gap-1.5 transition text-[11px]"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Telegram</span>
            </button>
            <button
              id="share-native-btn"
              onClick={handleShareNative}
              className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-700 rounded-xl font-bold flex items-center gap-1.5 transition text-[11px] ml-auto"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Share...</span>
            </button>
          </div>
        </div>
      </div>

      {/* Individual Commission Earnings & Invited Users Table/Section */}
      <div id="invited-users-commission-dashboard" className="bg-gray-900 border border-gray-800 rounded-3xl p-5 shadow-xl space-y-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-black text-white text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Invited Team &amp; Individual Commission Earnings</span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Track each invited user's deposit, turnover, and individual commission generated for you
            </p>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by user or phone..."
              className="pl-8 pr-3 py-1.5 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 w-full sm:w-56"
            />
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-950 border border-gray-800/80 rounded-xl text-xs">
          <button
            id="tab-all-referrals"
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('all');
            }}
            className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition text-center ${
              activeTab === 'all'
                ? 'bg-amber-500 text-gray-950 shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            All Invited ({referrals.length})
          </button>
          <button
            id="tab-level1-referrals"
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('level1');
            }}
            className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition text-center ${
              activeTab === 'level1'
                ? 'bg-amber-500 text-gray-950 shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Direct Tier 1 ({directInvitedCount})
          </button>
          <button
            id="tab-level2-referrals"
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('level2');
            }}
            className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition text-center ${
              activeTab === 'level2'
                ? 'bg-amber-500 text-gray-950 shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Sub-team Tier 2 ({subTeamCount})
          </button>
          <button
            id="tab-top-referrals"
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('top');
            }}
            className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition text-center ${
              activeTab === 'top'
                ? 'bg-amber-500 text-gray-950 shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Top Earners
          </button>
        </div>

        {/* Invited Users List */}
        {filteredReferrals.length === 0 ? (
          <div className="py-10 px-4 text-center bg-gray-950/60 rounded-2xl border border-gray-800/80 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">No Referred Members Yet</p>
              <p className="text-xs text-gray-400 max-w-md mx-auto mt-1 leading-relaxed">
                When friends register using your unique link or code, they will appear here automatically with their turnover and real-time 0.60% commission credited to your wallet.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedLink ? 'Copied Link!' : 'Copy Referral Link'}</span>
              </button>
              <button
                onClick={handleShareWhatsApp}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp Share</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredReferrals.map((member) => {
              const joinedFormatted = new Date(member.joinedAt).toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });

              return (
                <div
                  key={member.id}
                  className="bg-gray-950/90 border border-gray-800/90 hover:border-gray-700 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                >
                  {/* Member identity & tier */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-red-500/20 border border-amber-500/30 flex items-center justify-center font-black text-amber-400 text-xs shrink-0">
                      {member.displayName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{member.displayName}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                          member.level === 1
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                        }`}>
                          Tier {member.level} {member.level === 1 ? 'Direct' : 'Sub-team'}
                        </span>
                        <span className={`w-2 h-2 rounded-full ${
                          member.status === 'active' ? 'bg-emerald-400' : 'bg-gray-600'
                        }`} />
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-gray-400 font-mono mt-0.5">
                        <span>{member.phoneNumber}</span>
                        <span className="text-gray-600">•</span>
                        <span className="text-gray-500 flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          {joinedFormatted}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Financial turnover & commission badge */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-800/80">
                    <div className="text-left sm:text-right">
                      <div className="text-[10px] text-gray-400 uppercase font-semibold">Total Turnover</div>
                      <div className="text-xs font-mono font-bold text-gray-200">
                        ₹{member.totalTurnover.toLocaleString('en-IN')}
                      </div>
                    </div>

                    <div className="text-right pl-3 border-l border-gray-800/80">
                      <div className="text-[10px] text-gray-400 uppercase font-semibold">Your Commission</div>
                      <div className="text-sm font-black font-mono text-emerald-400 flex items-center justify-end gap-0.5">
                        <span>+₹{member.commissionEarned.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Commission Rules & Automatic Settlement Info */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 shadow-xl space-y-3">
        <h4 className="font-bold text-white text-xs flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Commission Settlement Policies</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-gray-400">
          <div className="bg-gray-950 p-3 rounded-xl border border-gray-800/80">
            <span className="font-bold text-amber-400 block mb-1">⚡ Real-time Settlement</span>
            Rebates calculate dynamically as your invited players wager.
          </div>
          <div className="bg-gray-950 p-3 rounded-xl border border-gray-800/80">
            <span className="font-bold text-cyan-400 block mb-1">0 Turnover Requirement</span>
            Referral commissions are treated as real cash and can be withdrawn immediately.
          </div>
          <div className="bg-gray-950 p-3 rounded-xl border border-gray-800/80">
            <span className="font-bold text-emerald-400 block mb-1">Lifetime Royalty</span>
            Bindings are permanent; you earn lifetime revenue share on every deposit &amp; game.
          </div>
        </div>
      </div>
    </div>
  );
};
