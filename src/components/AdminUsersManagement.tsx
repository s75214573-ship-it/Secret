import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserProfile, GameBet, Transaction, PaymentRequest } from '../types';
import { 
  Users, 
  Search, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShieldCheck, 
  AlertTriangle, 
  Check, 
  X, 
  RefreshCw, 
  Edit3, 
  Key, 
  Crown, 
  FileText, 
  Eye, 
  Clock, 
  Lock, 
  Unlock, 
  Smartphone,
  Mail,
  Copy,
  PlusCircle,
  MinusCircle,
  ExternalLink
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import confetti from 'canvas-confetti';

export const AdminUsersManagement: React.FC = () => {
  const { 
    adminGetAllUsers, 
    adminUpdateUserWallet, 
    adminUpdateUserProfile, 
    adminGetUserActivity 
  } = useAuth();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'frozen' | 'restricted'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Selected User for Deep Activity & Modification
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [activityTab, setActivityTab] = useState<'bets' | 'transactions' | 'payments' | 'settings'>('bets');
  const [userBets, setUserBets] = useState<GameBet[]>([]);
  const [userTxs, setUserTxs] = useState<Transaction[]>([]);
  const [userReqs, setUserReqs] = useState<PaymentRequest[]>([]);
  const [loadingActivity, setLoadingActivity] = useState<boolean>(false);

  // Wallet adjustment form state
  const [walletMode, setWalletMode] = useState<'adjust' | 'set'>('adjust');
  const [walletAmount, setWalletAmount] = useState<string>('500');
  const [walletReason, setWalletReason] = useState<string>('Support manual top-up requested by user');
  const [adjustingWallet, setAdjustingWallet] = useState<boolean>(false);
  const [walletNotice, setWalletNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // User Profile Edit state (changes user wants)
  const [editDisplayName, setEditDisplayName] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editVip, setEditVip] = useState<number>(1);
  const [editStatus, setEditStatus] = useState<'active' | 'frozen' | 'restricted'>('active');
  const [editPin, setEditPin] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [profileNotice, setProfileNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Load all users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await adminGetAllUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // When a user is selected, fetch their real activity
  useEffect(() => {
    if (!selectedUser) return;
    setEditDisplayName(selectedUser.displayName || '');
    setEditPhone(selectedUser.phoneNumber || '');
    setEditEmail(selectedUser.email || '');
    setEditVip(selectedUser.vipLevel || 1);
    setEditStatus(selectedUser.status || 'active');
    setEditPin(selectedUser.customPin || '');
    setEditNotes(selectedUser.adminNotes || '');
    setWalletNotice(null);
    setProfileNotice(null);

    const loadActivity = async () => {
      setLoadingActivity(true);
      try {
        const { bets, transactions, requests } = await adminGetUserActivity(selectedUser.uid);
        setUserBets(bets);
        setUserTxs(transactions);
        setUserReqs(requests);
      } catch (err) {
        console.error('Failed to load user activity:', err);
      } finally {
        setLoadingActivity(false);
      }
    };

    loadActivity();
  }, [selectedUser?.uid]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    triggerHaptic('light');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApplyWalletChange = async () => {
    if (!selectedUser) return;
    const num = Number(walletAmount);
    if (isNaN(num)) {
      setWalletNotice({ text: 'Please enter a valid amount', type: 'error' });
      return;
    }

    setAdjustingWallet(true);
    setWalletNotice(null);
    try {
      const res = await adminUpdateUserWallet(
        selectedUser.uid,
        walletMode,
        num,
        walletReason || 'Admin wallet adjustment'
      );
      if (res.success) {
        triggerHaptic('success');
        confetti({ particleCount: 50, spread: 60 });
        setWalletNotice({ text: res.message, type: 'success' });
        // Update user in state
        const updatedBal = res.newBalance ?? (walletMode === 'set' ? num : selectedUser.balance + num);
        setSelectedUser(prev => prev ? { ...prev, balance: updatedBal } : null);
        setUsers(prev => prev.map(u => u.uid === selectedUser.uid ? { ...u, balance: updatedBal } : u));
        // Refresh transactions list
        const { transactions } = await adminGetUserActivity(selectedUser.uid);
        setUserTxs(transactions);
      } else {
        triggerHaptic('error');
        setWalletNotice({ text: res.message, type: 'error' });
      }
    } catch (err: any) {
      setWalletNotice({ text: err?.message || 'Error updating wallet', type: 'error' });
    } finally {
      setAdjustingWallet(false);
    }
  };

  const handleSaveProfileChanges = async () => {
    if (!selectedUser) return;
    setSavingProfile(true);
    setProfileNotice(null);

    try {
      const updates: Partial<UserProfile> = {
        displayName: editDisplayName,
        phoneNumber: editPhone,
        email: editEmail,
        vipLevel: Number(editVip),
        status: editStatus,
        customPin: editPin,
        adminNotes: editNotes
      };

      const res = await adminUpdateUserProfile(selectedUser.uid, updates, 'Admin saved requested user changes');
      if (res.success) {
        triggerHaptic('success');
        setProfileNotice({ text: 'User details updated successfully!', type: 'success' });
        setSelectedUser(prev => prev ? { ...prev, ...updates } : null);
        setUsers(prev => prev.map(u => u.uid === selectedUser.uid ? { ...u, ...updates } : u));
      } else {
        triggerHaptic('error');
        setProfileNotice({ text: res.message, type: 'error' });
      }
    } catch (err: any) {
      setProfileNotice({ text: err?.message || 'Failed to update user profile', type: 'error' });
    } finally {
      setSavingProfile(false);
    }
  };

  // Filtered users list
  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery = !q || 
      (u.displayName && u.displayName.toLowerCase().includes(q)) ||
      (u.phoneNumber && u.phoneNumber.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.uid && u.uid.toLowerCase().includes(q)) ||
      (u.referralCode && u.referralCode.toLowerCase().includes(q));

    const matchRole = roleFilter === 'all' || 
      (roleFilter === 'admin' && (u.role === 'admin' || u.email?.toLowerCase() === 's75214573@gmail.com')) ||
      (roleFilter === 'user' && u.role !== 'admin' && u.email?.toLowerCase() !== 's75214573@gmail.com');

    const matchStatus = statusFilter === 'all' || (u.status || 'active') === statusFilter;

    return matchQuery && matchRole && matchStatus;
  });

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between bg-gray-900/60 p-3 rounded-2xl border border-gray-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="admin-search-users-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by phone, name, email or UID..."
            className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e: any) => setRoleFilter(e.target.value)}
            className="bg-gray-950 border border-gray-800 rounded-xl px-2.5 py-2 text-xs text-gray-300 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Roles</option>
            <option value="user">Players</option>
            <option value="admin">Admins</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="bg-gray-950 border border-gray-800 rounded-xl px-2.5 py-2 text-xs text-gray-300 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="restricted">Restricted</option>
            <option value="frozen">Frozen</option>
          </select>

          {/* Refresh button */}
          <button
            onClick={() => {
              triggerHaptic('light');
              fetchUsers();
            }}
            disabled={loading}
            className="p-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl text-gray-400 hover:text-amber-400 transition"
            title="Refresh Users"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Users Count Header */}
      <div className="flex items-center justify-between text-xs px-1 text-gray-400">
        <span>
          Showing <strong className="text-amber-400 font-mono">{filteredUsers.length}</strong> registered users
        </span>
        <span className="text-[11px] text-gray-500">
          Click any user to view live bets, ledger &amp; adjust wallet
        </span>
      </div>

      {/* User Cards Grid */}
      {loading ? (
        <div className="py-16 text-center text-gray-400 space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400" />
          <p className="text-xs">Querying registered user profiles from Firestore...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="py-12 text-center bg-gray-900/40 border border-gray-800 rounded-2xl p-6">
          <Users className="w-8 h-8 mx-auto text-gray-600 mb-2" />
          <div className="text-sm font-bold text-gray-300">No users found</div>
          <p className="text-xs text-gray-500 mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[52vh] overflow-y-auto pr-1">
          {filteredUsers.map((u) => {
            const isUserAdmin = u.role === 'admin' || u.email?.toLowerCase() === 's75214573@gmail.com';
            const status = u.status || 'active';
            const isSelected = selectedUser?.uid === u.uid;

            return (
              <div
                key={u.uid}
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedUser(u);
                }}
                className={`p-3.5 rounded-2xl border transition cursor-pointer text-xs space-y-2.5 ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500/60 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/30'
                    : 'bg-gray-900/70 hover:bg-gray-900 border-gray-800 hover:border-gray-700'
                }`}
              >
                {/* Header: Name, Role & Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 flex items-center justify-center text-amber-400 font-bold shrink-0">
                      {(u.displayName || u.phoneNumber || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-white flex items-center gap-1.5 truncate">
                        <span className="truncate">{u.displayName || 'Player'}</span>
                        {isUserAdmin && (
                          <span className="px-1.5 py-0.2 text-[9px] bg-red-600/30 border border-red-500/40 text-red-300 rounded font-black">
                            ADMIN
                          </span>
                        )}
                        <span className="px-1.5 py-0.2 text-[9px] bg-amber-500/20 text-amber-400 rounded font-bold">
                          VIP {u.vipLevel || 1}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono flex items-center gap-2 mt-0.5">
                        <span>{u.phoneNumber || 'No Phone'}</span>
                        <span>•</span>
                        <span className="truncate">{u.email || 'No Email'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="shrink-0 flex items-center gap-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        status === 'active'
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                          : status === 'frozen'
                          ? 'bg-red-500/15 border-red-500/30 text-red-400'
                          : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                      }`}
                    >
                      {status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Financial overview */}
                <div className="grid grid-cols-3 gap-1.5 bg-gray-950/80 p-2 rounded-xl border border-gray-800/80 text-center">
                  <div>
                    <div className="text-[10px] text-gray-500">Wallet</div>
                    <div className="font-mono font-black text-amber-400 text-xs mt-0.5">
                      ₹{(u.balance || 0).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500">Total Recharge</div>
                    <div className="font-mono font-bold text-emerald-400 text-xs mt-0.5">
                      ₹{(u.totalRecharge || 0).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500">Total Withdrawn</div>
                    <div className="font-mono font-bold text-blue-400 text-xs mt-0.5">
                      ₹{(u.totalWithdraw || 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Footer action button */}
                <div className="flex items-center justify-between text-[10px] text-gray-500 pt-0.5">
                  <span className="font-mono truncate">
                    UID: {u.uid ? `${u.uid.slice(0, 8)}...` : 'N/A'}
                  </span>
                  <div className="flex items-center gap-1 text-amber-400 font-bold hover:underline">
                    <Eye className="w-3 h-3" />
                    <span>Open Inspector &amp; Wallet</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected User Detail & Activity Modal / Drawer */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-gray-950 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-600/30 via-red-600/20 to-gray-900 border-b border-amber-500/30 p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-gray-950 flex items-center justify-center font-black text-lg shadow-md">
                  {(selectedUser.displayName || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-white text-base">
                      {selectedUser.displayName || 'Player Profile'}
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                      VIP {selectedUser.vipLevel || 1}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                        (selectedUser.status || 'active') === 'active'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-red-500/20 text-red-400 border-red-500/40'
                      }`}
                    >
                      {(selectedUser.status || 'active').toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 font-mono flex items-center gap-2 mt-0.5">
                    <span>{selectedUser.phoneNumber || 'No phone'}</span>
                    <span>•</span>
                    <span>UID: {selectedUser.uid}</span>
                    <button
                      onClick={() => copyToClipboard(selectedUser.uid, 'modal-uid')}
                      className="text-amber-400 hover:text-amber-300"
                      title="Copy UID"
                    >
                      {copiedId === 'modal-uid' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedUser(null)}
                className="w-8 h-8 rounded-full bg-gray-900 hover:bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* User Wallet Quick Overview Bar */}
            <div className="bg-gray-900/90 p-3.5 border-b border-gray-800 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-gray-950 p-2.5 rounded-xl border border-gray-800">
                <span className="text-[10px] text-gray-400">Current Wallet Balance</span>
                <div className="text-base font-black text-amber-400 font-mono mt-0.5">
                  ₹{(selectedUser.balance || 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-gray-950 p-2.5 rounded-xl border border-gray-800">
                <span className="text-[10px] text-gray-400">Total Recharge</span>
                <div className="text-base font-black text-emerald-400 font-mono mt-0.5">
                  ₹{(selectedUser.totalRecharge || 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-gray-950 p-2.5 rounded-xl border border-gray-800">
                <span className="text-[10px] text-gray-400">Total Withdrawn</span>
                <div className="text-base font-black text-blue-400 font-mono mt-0.5">
                  ₹{(selectedUser.totalWithdraw || 0).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Tab Navigation in Inspector */}
            <div className="flex border-b border-gray-800 bg-gray-900 text-xs font-bold shrink-0">
              <button
                onClick={() => setActivityTab('bets')}
                className={`flex-1 py-2.5 text-center flex items-center justify-center gap-1.5 border-b-2 transition ${
                  activityTab === 'bets'
                    ? 'border-amber-500 text-amber-400 bg-gray-950'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Bets Activity ({userBets.length})</span>
              </button>

              <button
                onClick={() => setActivityTab('transactions')}
                className={`flex-1 py-2.5 text-center flex items-center justify-center gap-1.5 border-b-2 transition ${
                  activityTab === 'transactions'
                    ? 'border-amber-500 text-amber-400 bg-gray-950'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Ledger / Txs ({userTxs.length})</span>
              </button>

              <button
                onClick={() => setActivityTab('payments')}
                className={`flex-1 py-2.5 text-center flex items-center justify-center gap-1.5 border-b-2 transition ${
                  activityTab === 'payments'
                    ? 'border-amber-500 text-amber-400 bg-gray-950'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Payment Proofs ({userReqs.length})</span>
              </button>

              <button
                onClick={() => setActivityTab('settings')}
                className={`flex-1 py-2.5 text-center flex items-center justify-center gap-1.5 border-b-2 transition ${
                  activityTab === 'settings'
                    ? 'border-amber-500 text-amber-400 bg-gray-950'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Adjust Wallet &amp; User Info</span>
              </button>
            </div>

            {/* Tab Content Body */}
            <div className="p-4 overflow-y-auto space-y-4 text-xs flex-1">
              {/* TAB 1: BETS ACTIVITY */}
              {activityTab === 'bets' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-gray-400 text-xs">
                    <span>Recent Game Bets Placed by this User</span>
                    <span className="font-mono text-[11px] text-amber-400">{userBets.length} records</span>
                  </div>

                  {loadingActivity ? (
                    <div className="py-12 text-center text-gray-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto text-amber-400 mb-2" />
                      Loading bets...
                    </div>
                  ) : userBets.length === 0 ? (
                    <div className="py-10 text-center bg-gray-900/50 rounded-2xl border border-gray-800 text-gray-500">
                      No game bets recorded for this user yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {userBets.map((b) => (
                        <div
                          key={b.id || `${b.periodId}-${b.selection}`}
                          className="bg-gray-900/70 border border-gray-800 rounded-xl p-3 flex items-center justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                                {b.gameType}
                              </span>
                              <span className="text-[10px] text-gray-400 font-mono">
                                #{b.periodId?.slice(-6)}
                              </span>
                              <span className="px-1.5 py-0.2 bg-gray-800 text-amber-300 rounded font-black text-[10px]">
                                Choice: {b.selection}
                              </span>
                            </div>
                            <div className="text-[10px] text-gray-500 font-mono mt-1 flex items-center gap-2">
                              <span>{new Date(b.createdAt).toLocaleString()}</span>
                              {b.resultNumber !== undefined && (
                                <span>• Result: Number {b.resultNumber}</span>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="font-mono font-bold text-gray-200">
                              Bet: ₹{b.amount * (b.multiplier || 1)}
                            </div>
                            {b.fee !== undefined && (
                              <div className="text-[10px] text-amber-400 font-mono font-semibold">
                                Fee (3%): ₹{b.fee.toFixed(2)}
                              </div>
                            )}
                            {b.netAmount !== undefined && (
                              <div className="text-[9px] text-gray-400 font-mono">
                                Net Wager: ₹{b.netAmount.toFixed(2)}
                              </div>
                            )}
                            <div
                              className={`text-[11px] font-black mt-0.5 ${
                                b.status === 'won'
                                  ? 'text-emerald-400'
                                  : b.status === 'lost'
                                  ? 'text-red-400'
                                  : 'text-amber-400'
                              }`}
                            >
                              {b.status === 'won'
                                ? `+₹${b.winAmount || 0} WON`
                                : b.status === 'lost'
                                ? '- LOST'
                                : 'PENDING'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: TRANSACTIONS / LEDGER */}
              {activityTab === 'transactions' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-gray-400 text-xs">
                    <span>Wallet Transactions &amp; Audit Log</span>
                    <span className="font-mono text-[11px] text-amber-400">{userTxs.length} entries</span>
                  </div>

                  {loadingActivity ? (
                    <div className="py-12 text-center text-gray-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto text-amber-400 mb-2" />
                      Loading ledger...
                    </div>
                  ) : userTxs.length === 0 ? (
                    <div className="py-10 text-center bg-gray-900/50 rounded-2xl border border-gray-800 text-gray-500">
                      No wallet transactions recorded.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {userTxs.map((t) => {
                        const isCredit = t.type === 'deposit' || t.type === 'bonus' || t.type === 'commission';
                        return (
                          <div
                            key={t.id || t.txId || t.createdAt}
                            className="bg-gray-900/70 border border-gray-800 rounded-xl p-3 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                  isCredit
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                }`}
                              >
                                {isCredit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                              </div>
                              <div>
                                <div className="font-bold text-white text-xs">{t.channel || t.type}</div>
                                <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                                  {new Date(t.createdAt).toLocaleString()} • {t.txId?.slice(0, 14)}...
                                </div>
                                {t.adminNotes && (
                                  <div className="text-[10px] text-amber-400/90 italic mt-0.5">
                                    Note: {t.adminNotes}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="text-right">
                              <div
                                className={`font-mono font-black text-sm ${
                                  isCredit ? 'text-emerald-400' : 'text-red-400'
                                }`}
                              >
                                {isCredit ? '+' : '-'}₹{t.amount?.toLocaleString()}
                              </div>
                              <span className="text-[10px] uppercase font-bold text-gray-400">
                                {t.status}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: PAYMENT PROOFS & REQUESTS */}
              {activityTab === 'payments' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-gray-400 text-xs">
                    <span>Recharge Proofs &amp; Withdrawal Requests</span>
                    <span className="font-mono text-[11px] text-amber-400">{userReqs.length} tickets</span>
                  </div>

                  {loadingActivity ? (
                    <div className="py-12 text-center text-gray-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto text-amber-400 mb-2" />
                      Loading tickets...
                    </div>
                  ) : userReqs.length === 0 ? (
                    <div className="py-10 text-center bg-gray-900/50 rounded-2xl border border-gray-800 text-gray-500">
                      No deposit proofs or withdrawal requests submitted by this user.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {userReqs.map((req) => (
                        <div
                          key={req.id || req.txId}
                          className="bg-gray-900/80 border border-gray-800 rounded-2xl p-3.5 space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 text-[10px] font-black uppercase rounded ${
                                  req.type === 'deposit'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                }`}
                              >
                                {req.type}
                              </span>
                              <span className="text-white font-bold font-mono">
                                ₹{req.amount.toLocaleString()}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase border ${
                                req.status === 'completed'
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                  : req.status === 'rejected'
                                  ? 'bg-red-500/20 text-red-400 border-red-500/40'
                                  : 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse'
                              }`}
                            >
                              {req.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-400 bg-gray-950/80 p-2.5 rounded-xl border border-gray-800/80">
                            <div>
                              <span className="text-gray-500">Channel:</span> {req.channel}
                            </div>
                            {req.utrNumber && (
                              <div>
                                <span className="text-gray-500">UTR:</span>{' '}
                                <strong className="text-amber-400 font-mono">{req.utrNumber}</strong>
                              </div>
                            )}
                            {req.upiId && (
                              <div>
                                <span className="text-gray-500">UPI:</span> {req.upiId}
                              </div>
                            )}
                            {req.senderName && (
                              <div>
                                <span className="text-gray-500">Sender:</span> {req.senderName}
                              </div>
                            )}
                            <div className="col-span-2 text-[10px] text-gray-500">
                              Created: {new Date(req.createdAt).toLocaleString()}
                            </div>
                          </div>

                          {/* Proof Image Preview */}
                          {req.proofImageUrl && (
                            <div className="mt-2">
                              <span className="text-[10px] text-gray-500 block mb-1">Attached Receipt Proof:</span>
                              <img
                                src={req.proofImageUrl}
                                alt="Payment Proof"
                                className="w-full max-h-48 object-contain rounded-xl border border-gray-800 bg-black"
                              />
                            </div>
                          )}

                          {req.adminNotes && (
                            <div className="text-[11px] text-gray-400 bg-gray-950 p-2 rounded-lg border border-gray-800">
                              <span className="text-amber-400 font-bold">Admin Note:</span> {req.adminNotes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: ADJUST WALLET & USER SETTINGS */}
              {activityTab === 'settings' && (
                <div className="space-y-5">
                  {/* WALLET AMOUNT ADJUSTMENT BOX */}
                  <div className="bg-gradient-to-br from-amber-500/10 via-gray-900 to-gray-950 border border-amber-500/40 rounded-2xl p-4 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-amber-400" />
                        <span className="font-black text-white text-xs">Direct User Wallet Modification</span>
                      </div>
                      <span className="text-[11px] text-amber-400 font-mono font-bold">
                        Current: ₹{(selectedUser.balance || 0).toLocaleString()}
                      </span>
                    </div>

                    {walletNotice && (
                      <div
                        className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                          walletNotice.type === 'success'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-red-500/20 text-red-300 border border-red-500/40'
                        }`}
                      >
                        {walletNotice.type === 'success' ? (
                          <Check className="w-4 h-4 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                        )}
                        <span>{walletNotice.text}</span>
                      </div>
                    )}

                    {/* Mode selector */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setWalletMode('adjust')}
                        className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                          walletMode === 'adjust'
                            ? 'bg-amber-500 text-gray-950 shadow-md'
                            : 'bg-gray-950 text-gray-400 border border-gray-800 hover:text-white'
                        }`}
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        Add / Deduct Amount (+ / -)
                      </button>

                      <button
                        type="button"
                        onClick={() => setWalletMode('set')}
                        className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                          walletMode === 'set'
                            ? 'bg-amber-500 text-gray-950 shadow-md'
                            : 'bg-gray-950 text-gray-400 border border-gray-800 hover:text-white'
                        }`}
                      >
                        <Key className="w-3.5 h-3.5" />
                        Set Exact Balance
                      </button>
                    </div>

                    {/* Quick Preset Buttons for Adjust Mode */}
                    {walletMode === 'adjust' && (
                      <div className="grid grid-cols-4 gap-1.5">
                        {[100, 500, 1000, 5000].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setWalletAmount(String(amt))}
                            className="py-1.5 bg-gray-950 hover:bg-gray-800 border border-gray-800 rounded-lg text-[11px] font-bold text-amber-300 transition"
                          >
                            +₹{amt}
                          </button>
                        ))}
                        {[-100, -500, -1000, -5000].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setWalletAmount(String(amt))}
                            className="py-1.5 bg-gray-950 hover:bg-gray-800 border border-red-500/20 text-red-300 rounded-lg text-[11px] font-bold transition"
                          >
                            {amt}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Input Amount & Reason */}
                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] text-gray-400 block mb-1">
                          {walletMode === 'set' ? 'New Exact Balance (₹):' : 'Amount to Credit/Debit (e.g. 500 or -200):'}
                        </label>
                        <input
                          type="number"
                          value={walletAmount}
                          onChange={(e) => setWalletAmount(e.target.value)}
                          placeholder="Amount in ₹"
                          className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-gray-400 block mb-1">
                          Audit Reason / User Request Note:
                        </label>
                        <input
                          type="text"
                          value={walletReason}
                          onChange={(e) => setWalletReason(e.target.value)}
                          placeholder="e.g. Manual recharge compensation, support request, promo"
                          className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={adjustingWallet || !walletAmount}
                      onClick={handleApplyWalletChange}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-black rounded-xl text-xs shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {adjustingWallet ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      <span>
                        {walletMode === 'set'
                          ? `Confirm Set Wallet to ₹${Number(walletAmount || 0).toLocaleString()}`
                          : `Confirm Adjust Wallet by ₹${Number(walletAmount || 0).toLocaleString()}`}
                      </span>
                    </button>
                  </div>

                  {/* USER REQUESTED PROFILE CHANGES (NAME, PHONE, VIP, STATUS, PIN) */}
                  <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4 space-y-3.5">
                    <div className="flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-amber-400" />
                      <span className="font-black text-white text-xs">User Profile Details &amp; Requests</span>
                    </div>

                    {profileNotice && (
                      <div
                        className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                          profileNotice.type === 'success'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-red-500/20 text-red-300 border border-red-500/40'
                        }`}
                      >
                        {profileNotice.type === 'success' ? (
                          <Check className="w-4 h-4 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                        )}
                        <span>{profileNotice.text}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-gray-400 block mb-1">Display Name (User requested):</label>
                        <input
                          type="text"
                          value={editDisplayName}
                          onChange={(e) => setEditDisplayName(e.target.value)}
                          className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-gray-400 block mb-1">Phone Number:</label>
                        <input
                          type="text"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-gray-400 block mb-1">VIP Tier Level (1 - 10):</label>
                        <select
                          value={editVip}
                          onChange={(e) => setEditVip(Number(e.target.value))}
                          className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => (
                            <option key={v} value={v}>VIP Level {v}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-gray-400 block mb-1">Account State / Restrictions:</label>
                        <select
                          value={editStatus}
                          onChange={(e: any) => setEditStatus(e.target.value)}
                          className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                        >
                          <option value="active">Active (Normal Play &amp; Withdraw)</option>
                          <option value="restricted">Restricted (Play only, Withdraw blocked)</option>
                          <option value="frozen">Frozen (Temporarily suspended)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-gray-400 block mb-1">Custom PIN / Password Reset:</label>
                        <input
                          type="text"
                          value={editPin}
                          onChange={(e) => setEditPin(e.target.value)}
                          placeholder="e.g. 1234 or new PIN"
                          className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-gray-400 block mb-1">Admin Remarks / User Request Notes:</label>
                        <input
                          type="text"
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          placeholder="e.g. KYC verified, requested VIP upgrade"
                          className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={savingProfile}
                      onClick={handleSaveProfileChanges}
                      className="w-full py-2.5 px-4 bg-gray-800 hover:bg-gray-700 text-amber-300 font-bold border border-amber-500/30 rounded-xl text-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {savingProfile ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      <span>Save User Profile Changes</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
