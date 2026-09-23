import React, { useState, useEffect } from 'react';
import { SupportTicket, SupportCategory } from '../types';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  updateDoc, 
  doc, 
  addDoc 
} from 'firebase/firestore';
import { triggerHaptic } from '../utils/haptics';
import { playClickSound, playWinSound } from '../utils/audio';
import { 
  Headphones, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  SendHorizontal, 
  Copy, 
  Check, 
  ExternalLink, 
  User, 
  Phone, 
  Tag, 
  Filter, 
  Sparkles,
  RefreshCw,
  PlusCircle
} from 'lucide-react';

const STORAGE_TICKETS_KEY = 'winxbet_support_tickets_v1';

export const AdminSupportTicketsManagement: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_TICKETS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });

  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in_progress' | 'resolved'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [replying, setReplying] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Real-time Firestore sync
  useEffect(() => {
    if (!db) return;
    try {
      const q = query(collection(db, 'supportTickets'), orderBy('createdAt', 'desc'), limit(50));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const firestoreTickets: SupportTicket[] = [];
        snapshot.forEach((docSnap) => {
          firestoreTickets.push({
            id: docSnap.id,
            ...(docSnap.data() as any)
          });
        });

        if (firestoreTickets.length > 0) {
          setTickets((prev) => {
            // merge unique by id or ticketNumber
            const map = new Map<string, SupportTicket>();
            firestoreTickets.forEach((t) => map.set(t.ticketNumber || t.id, t));
            prev.forEach((t) => {
              if (!map.has(t.ticketNumber || t.id)) {
                map.set(t.ticketNumber || t.id, t);
              }
            });
            const merged = Array.from(map.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            try {
              localStorage.setItem(STORAGE_TICKETS_KEY, JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
      }, (err) => {
        console.warn('Admin tickets snapshot notice:', err);
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn('Firestore tickets subscription error:', err);
    }
  }, []);

  const handleCopy = (text: string, id: string) => {
    triggerHaptic('light');
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleUpdateStatus = async (ticket: SupportTicket, newStatus: 'in_progress' | 'resolved' | 'closed') => {
    triggerHaptic('medium');
    const updated = {
      ...ticket,
      status: newStatus,
      updatedAt: Date.now()
    };

    setTickets((prev) =>
      prev.map((t) => (t.id === ticket.id || t.ticketNumber === ticket.ticketNumber ? updated : t))
    );

    try {
      localStorage.setItem(
        STORAGE_TICKETS_KEY,
        JSON.stringify(
          tickets.map((t) => (t.id === ticket.id || t.ticketNumber === ticket.ticketNumber ? updated : t))
        )
      );

      if (db && ticket.id && !ticket.id.startsWith('ticket-')) {
        await updateDoc(doc(db, 'supportTickets', ticket.id), {
          status: newStatus,
          updatedAt: Date.now()
        });
      }
    } catch (err) {
      console.warn('Failed to update ticket status in firestore:', err);
    }
  };

  const handleSendAdminReply = async (ticket: SupportTicket) => {
    if (!replyText.trim()) return;
    setReplying(true);
    triggerHaptic('success');
    playWinSound();

    const updated: SupportTicket = {
      ...ticket,
      adminReply: replyText.trim(),
      status: 'resolved',
      updatedAt: Date.now()
    };

    setTickets((prev) =>
      prev.map((t) => (t.id === ticket.id || t.ticketNumber === ticket.ticketNumber ? updated : t))
    );

    try {
      localStorage.setItem(
        STORAGE_TICKETS_KEY,
        JSON.stringify(
          tickets.map((t) => (t.id === ticket.id || t.ticketNumber === ticket.ticketNumber ? updated : t))
        )
      );

      if (db && ticket.id && !ticket.id.startsWith('ticket-')) {
        await updateDoc(doc(db, 'supportTickets', ticket.id), {
          adminReply: replyText.trim(),
          status: 'resolved',
          updatedAt: Date.now()
        });
      }
    } catch (err) {
      console.warn('Failed to save admin reply:', err);
    }

    setReplyText('');
    setReplying(false);
    setSelectedTicket(null);
  };

  const handleCreateSampleTicket = async () => {
    triggerHaptic('selection');
    playClickSound();

    const sampleCategories: SupportCategory[] = ['deposit', 'withdraw', 'game', 'vip'];
    const sampleCategory = sampleCategories[Math.floor(Math.random() * sampleCategories.length)];
    const ticketNumber = `WX-${Math.floor(100000 + Math.random() * 900000)}`;

    let subject = 'Deposit via PhonePe not reflected';
    let message = 'Transferred ₹1,000 via UPI. UTR is 428194018291. Please credit my wallet.';
    let refId = '428194018291';

    if (sampleCategory === 'withdraw') {
      subject = 'Withdrawal status query for ₹2,500';
      message = 'Submitted bank payout 20 minutes ago. Account ending in ...4921.';
      refId = 'TX-WD-9942';
    } else if (sampleCategory === 'game') {
      subject = 'WinGo Period multiplier inquiry';
      message = 'Won on Green number 7, need confirmation on total multiplier credit.';
      refId = '20260920042';
    } else if (sampleCategory === 'vip') {
      subject = 'VIP 2 Upgrade verification';
      message = 'Completed ₹10,000 turnover. Requesting manual VIP tier review.';
      refId = 'VIP-REQ';
    }

    const newTicket: SupportTicket = {
      id: `ticket-${Date.now()}`,
      ticketNumber,
      userId: 'usr_sample_test',
      userDisplayName: 'Rohan Sharma',
      userPhone: '+91 98765 43210',
      userEmail: 'rohan.player@gmail.com',
      category: sampleCategory,
      subject,
      message,
      status: 'pending',
      priority: sampleCategory === 'deposit' ? 'high' : 'medium',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      referenceId: refId
    };

    setTickets((prev) => [newTicket, ...prev]);

    try {
      if (db) {
        await addDoc(collection(db, 'supportTickets'), {
          ...newTicket,
          serverTimestamp: Date.now()
        });
      }
    } catch {}
  };

  // Filter and search
  const filteredTickets = tickets.filter((t) => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = t.ticketNumber?.toLowerCase().includes(q);
      const matchName = t.userDisplayName?.toLowerCase().includes(q);
      const matchPhone = t.userPhone?.toLowerCase().includes(q);
      const matchSubject = t.subject?.toLowerCase().includes(q);
      const matchRef = t.referenceId?.toLowerCase().includes(q);
      return matchNum || matchName || matchPhone || matchSubject || matchRef;
    }
    return true;
  });

  const pendingCount = tickets.filter((t) => t.status === 'pending').length;

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-gray-950 p-3.5 rounded-2xl border border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Headphones className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Customer Care &amp; Support Requests</span>
              {pendingCount > 0 && (
                <span className="px-2 py-0.2 rounded-full bg-red-500 text-white font-black text-[10px] animate-pulse">
                  {pendingCount} PENDING
                </span>
              )}
            </h3>
            <p className="text-[11px] text-gray-400">
              Review and answer tickets submitted by users from the floating support widget
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCreateSampleTicket}
          className="px-3 py-1.5 rounded-xl bg-gray-850 hover:bg-gray-800 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
        >
          <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
          <span>Generate Sample Ticket</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ticket #, name, UTR, phone..."
            className="w-full pl-9 pr-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto">
          {(['all', 'pending', 'in_progress', 'resolved'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setFilterStatus(st);
              }}
              className={`flex-1 py-2 px-2 text-center rounded-xl font-bold text-[11px] transition capitalize cursor-pointer whitespace-nowrap ${
                filterStatus === st
                  ? 'bg-amber-500 text-gray-950 shadow-md'
                  : 'bg-gray-950 border border-gray-800 text-gray-400 hover:text-gray-200'
              }`}
            >
              {st === 'all' ? 'All Status' : st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full py-2 px-3 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Categories</option>
            <option value="deposit">💳 Deposits &amp; Recharges</option>
            <option value="withdraw">🏧 Withdrawals &amp; Payouts</option>
            <option value="game">🎯 Game &amp; Bet Issues</option>
            <option value="vip">👑 VIP Rewards &amp; Rebates</option>
            <option value="account">🔒 Account &amp; Security</option>
            <option value="general">❓ General Inquiries</option>
          </select>
        </div>
      </div>

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <div className="p-8 text-center bg-gray-950 border border-gray-800 rounded-2xl space-y-2">
          <Headphones className="w-8 h-8 text-gray-600 mx-auto" />
          <div className="text-xs font-bold text-gray-400">No support tickets found</div>
          <p className="text-[11px] text-gray-500">
            {searchQuery || filterStatus !== 'all' || filterCategory !== 'all'
              ? 'Try adjusting your search or category filters.'
              : 'Click "Generate Sample Ticket" above or submit a help request from the floating widget!'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((t) => {
            const isSelected = selectedTicket?.id === t.id || selectedTicket?.ticketNumber === t.ticketNumber;
            return (
              <div
                key={t.id || t.ticketNumber}
                className="p-4 bg-gray-950 border border-gray-800 hover:border-gray-700 rounded-2xl space-y-3 transition shadow-lg"
              >
                {/* Header info */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-amber-400 text-xs px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30">
                      #{t.ticketNumber}
                    </span>
                    <span className="text-xs font-bold text-white">{t.subject}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        t.status === 'resolved'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : t.status === 'in_progress'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                      }`}
                    >
                      {t.status.replace('_', ' ')}
                    </span>

                    <span className="px-2 py-0.5 rounded-full bg-gray-900 border border-gray-800 text-[10px] font-medium text-gray-400 uppercase">
                      {t.category}
                    </span>
                  </div>
                </div>

                {/* User & metadata line */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono bg-gray-900/70 p-2.5 rounded-xl border border-gray-850">
                  <div>
                    <span className="text-gray-500 block text-[10px]">User</span>
                    <span className="text-white font-bold truncate block">{t.userDisplayName || 'Guest'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px]">Contact</span>
                    <span className="text-gray-300 truncate block">{t.userPhone || t.userEmail || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px]">Reference / UTR</span>
                    <div className="flex items-center gap-1 text-amber-300 font-bold">
                      <span className="truncate">{t.referenceId || 'None'}</span>
                      {t.referenceId && (
                        <button
                          type="button"
                          onClick={() => handleCopy(t.referenceId!, t.ticketNumber)}
                          className="hover:text-white"
                        >
                          {copiedId === t.ticketNumber ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px]">Submitted</span>
                    <span className="text-gray-400">{new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {/* Message Body */}
                <div className="p-3 bg-gray-900/40 rounded-xl text-xs text-gray-300 whitespace-pre-wrap leading-relaxed border border-gray-850">
                  {t.message}
                </div>

                {/* Existing Admin Reply */}
                {t.adminReply && (
                  <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30 text-xs text-amber-200">
                    <span className="font-bold text-amber-400 block text-[10px] mb-0.5">Admin Dispatch Response:</span>
                    {t.adminReply}
                  </div>
                )}

                {/* Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1.5">
                    {t.status !== 'resolved' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(t, 'resolved')}
                        className="px-3 py-1.5 bg-emerald-600/25 hover:bg-emerald-600/35 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Resolve Ticket</span>
                      </button>
                    )}

                    {t.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(t, 'in_progress')}
                        className="px-3 py-1.5 bg-blue-600/25 hover:bg-blue-600/35 border border-blue-500/40 text-blue-300 text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
                      >
                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                        <span>Set In Progress</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setSelectedTicket(isSelected ? null : t);
                      setReplyText(t.adminReply || '');
                    }}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-gray-950 text-xs font-black rounded-xl transition flex items-center gap-1 cursor-pointer shadow-md"
                  >
                    <SendHorizontal className="w-3.5 h-3.5" />
                    <span>{isSelected ? 'Close Reply' : 'Send Admin Reply'}</span>
                  </button>
                </div>

                {/* Reply Form Expander */}
                {isSelected && (
                  <div className="p-3 bg-gray-900 border border-amber-500/30 rounded-xl space-y-2 mt-2">
                    <label className="block text-[11px] font-bold text-amber-300">
                      Reply directly to Player ({t.userDisplayName || 'Guest'}):
                    </label>
                    <textarea
                      rows={2}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="e.g. UTR verified. ₹1,000 has been credited to your balance."
                      className="w-full p-2 bg-gray-950 border border-gray-700 focus:border-amber-500 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedTicket(null)}
                        className="px-3 py-1 bg-gray-800 text-gray-300 text-xs rounded-lg font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={!replyText.trim() || replying}
                        onClick={() => handleSendAdminReply(t)}
                        className="px-3.5 py-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-gray-950 text-xs rounded-lg font-black transition"
                      >
                        {replying ? 'Sending...' : 'Publish Reply & Resolve'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
