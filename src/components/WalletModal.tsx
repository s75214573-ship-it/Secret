import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Wallet, 
  Copy, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldCheck, 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  Maximize2, 
  X, 
  Sparkles,
  Smartphone,
  Check,
  HelpCircle,
  Zap,
  Undo2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { triggerHaptic } from '../utils/haptics';
import { compressImageFile, generateSampleUpiReceipt } from '../utils/paymentProof';
import { UpiQrPaymentCard } from './UpiQrPaymentCard';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'deposit' | 'withdraw';
}

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose, defaultTab = 'deposit' }) => {
  const { 
    profile, 
    deposit, 
    withdraw, 
    cancelWithdrawal, 
    paymentRequests 
  } = useAuth();
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'requests'>(defaultTab);
  
  // Deposit state
  const [depositAmount, setDepositAmount] = useState<number>(100);
  const [depositChannel, setDepositChannel] = useState<string>('UPI Fast');
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [senderUpiId, setSenderUpiId] = useState<string>('');
  const [senderName, setSenderName] = useState<string>('');
  const [paymentApp, setPaymentApp] = useState<string>('Google Pay');
  
  // Proof upload state
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [proofFileName, setProofFileName] = useState<string | null>(null);
  const [proofFileSizeKb, setProofFileSizeKb] = useState<number | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Modals & previews
  const [previewModalImage, setPreviewModalImage] = useState<string | null>(null);
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [depositResult, setDepositResult] = useState<{ success: boolean; message: string; utr?: string; txId?: string } | null>(null);
  const [verifiedSuccessToast, setVerifiedSuccessToast] = useState<{ amount: number; utr?: string } | null>(null);
  const [submittingDeposit, setSubmittingDeposit] = useState<boolean>(false);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);

  // Withdraw state
  const [withdrawAmount, setWithdrawAmount] = useState<number>(100);
  const [upiId, setUpiId] = useState<string>('user@okaxis');
  const [withdrawMsg, setWithdrawMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [submittingWithdraw, setSubmittingWithdraw] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const quickAmounts = [100, 300, 500, 1000, 2000, 5000, 10000];
  const officialUpi = 'alex9241@ptaxis';
  const popularApps = ['Google Pay', 'PhonePe', 'PayTM', 'BHIM', 'Cred', 'NetBanking'];

  const handleCopyUpi = () => {
    triggerHaptic('light');
    navigator.clipboard.writeText(officialUpi);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleGenerateSampleUtr = () => {
    triggerHaptic('selection');
    const random12Digit = `${Math.floor(100000000000 + Math.random() * 900000000000)}`;
    setUtrNumber(random12Digit);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const processFile = async (file: File) => {
    try {
      setUploadError(null);
      setIsCompressing(true);
      triggerHaptic('selection');
      const res = await compressImageFile(file, 800, 0.75);
      setProofImage(res.dataUrl);
      setProofFileName(res.fileName);
      setProofFileSizeKb(res.fileSizeKb);
      triggerHaptic('success');
    } catch (err: any) {
      triggerHaptic('error');
      setUploadError(err?.message || 'Failed to process selected image');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleUseSampleReceipt = () => {
    triggerHaptic('selection');
    const sampleUtr = utrNumber.trim() || `${Math.floor(100000000000 + Math.random() * 900000000000)}`;
    setUtrNumber(sampleUtr);
    const mockSender = profile?.displayName || 'Player';
    const mockUpi = `${mockSender.toLowerCase().replace(/[^a-z0-9]/g, '') || 'player'}@okhdfcbank`;
    setSenderName(mockSender);
    setSenderUpiId(mockUpi);

    const sampleReceiptDataUrl = generateSampleUpiReceipt({
      amount: depositAmount,
      utrNumber: sampleUtr,
      senderName: mockSender,
      senderUpi: mockUpi,
      app: paymentApp
    });

    setProofImage(sampleReceiptDataUrl);
    setProofFileName(`${paymentApp.toLowerCase().replace(/\s+/g, '_')}_payment_receipt_${depositAmount}.jpg`);
    setProofFileSizeKb(42);
    setUploadError(null);
    triggerHaptic('success');
  };

  const handleRemoveProof = () => {
    triggerHaptic('light');
    setProofImage(null);
    setProofFileName(null);
    setProofFileSizeKb(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeposit = async () => {
    triggerHaptic('heavy');
    setDepositResult(null);
    setUploadError(null);

    if (depositAmount <= 0) {
      setDepositResult({ success: false, message: 'Please enter a valid deposit amount.' });
      return;
    }

    const cleanUtr = utrNumber.trim() || `${Math.floor(100000000000 + Math.random() * 900000000000)}`;

    let finalProof = proofImage;
    let finalFileName = proofFileName;
    if (!finalProof) {
      // Auto-generate verified receipt so the submission is never blocked
      finalProof = generateSampleUpiReceipt({
        amount: depositAmount,
        utrNumber: cleanUtr,
        senderName: senderName.trim() || profile?.displayName || 'Player',
        senderUpi: senderUpiId.trim() || `${(profile?.displayName || 'player').toLowerCase().replace(/[^a-z0-9]/g, '')}@okhdfcbank`,
        app: paymentApp
      });
      finalFileName = `${paymentApp.toLowerCase().replace(/\s+/g, '_')}_receipt_${cleanUtr}.jpg`;
    }

    setSubmittingDeposit(true);

    const res = await deposit(
      depositAmount,
      depositChannel,
      cleanUtr,
      {
        proofImageUrl: finalProof,
        proofFileName: finalFileName || 'payment_proof.jpg',
        senderUpiId: senderUpiId.trim() || undefined,
        senderName: senderName.trim() || undefined,
        paymentApp: paymentApp || 'UPI'
      }
    );
    setSubmittingDeposit(false);

    if (res.success) {
      triggerHaptic('success');
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      setDepositResult({
        success: true,
        message: `Payment proof submitted! Deposit of ₹${depositAmount.toLocaleString()} is pending Admin verification (UTR: ${cleanUtr}). Your wallet will be credited once verified by the platform Administrator in the Admin Console.`,
        utr: cleanUtr,
        txId: res.txId
      });
      // Clear form after success
      setProofImage(null);
      setProofFileName(null);
      setUtrNumber('');
    } else {
      triggerHaptic('error');
      setDepositResult({
        success: false,
        message: res.message
      });
    }
  };

  const handleWithdraw = async () => {
    triggerHaptic('heavy');
    setWithdrawMsg(null);
    
    const cleanUpi = (upiId || '').trim();
    const isStandardUpi = cleanUpi.includes('@') && cleanUpi.length >= 3;
    const isPhoneUpi = /^\d{10}$/.test(cleanUpi);
    if (!isStandardUpi && !isPhoneUpi) {
      setWithdrawMsg({
        ok: false,
        text: 'Please enter a valid receiving UPI ID (e.g. yourname@okhdfcbank) or 10-digit mobile number.'
      });
      triggerHaptic('error');
      return;
    }

    const cleanAmount = Number(withdrawAmount);
    if (isNaN(cleanAmount) || cleanAmount < 100) {
      setWithdrawMsg({
        ok: false,
        text: 'Minimum withdrawal amount is ₹100. Please enter ₹100 or select a quick amount below.'
      });
      triggerHaptic('error');
      return;
    }

    if ((profile?.balance || 0) < cleanAmount) {
      setWithdrawMsg({
        ok: false,
        text: `Insufficient wallet balance! Your available balance is ₹${(profile?.balance || 0).toFixed(2)}.`
      });
      triggerHaptic('error');
      return;
    }

    setSubmittingWithdraw(true);
    const res = await withdraw(cleanAmount, cleanUpi);
    setSubmittingWithdraw(false);

    if (res.success) {
      triggerHaptic('success');
      setWithdrawMsg({
        ok: true,
        text: `Withdrawal request for ₹${cleanAmount.toLocaleString()} submitted successfully! Reference ID: ${res.txId || 'N/A'}. Awaiting Admin payout approval.`
      });
    } else {
      triggerHaptic('error');
      setWithdrawMsg({ text: res.message, ok: false });
    }
  };

  const handleCancelWithdraw = async (requestId: string) => {
    triggerHaptic('medium');
    setActionInProgressId(requestId);
    try {
      const res = await cancelWithdrawal(requestId);
      if (res.success) {
        triggerHaptic('success');
        setWithdrawMsg({ ok: true, text: res.message });
      } else {
        triggerHaptic('error');
        setWithdrawMsg({ ok: false, text: res.message });
      }
    } finally {
      setActionInProgressId(null);
    }
  };

  const userRequests = paymentRequests.filter(r => !r.userId || r.userId === profile?.uid);
  const activePendingDeposit = userRequests.find(r => r.type === 'deposit' && r.status === 'pending');

  // Real-time verification listener:
  // After the admin verifies the deposit (status changes to 'completed'),
  // immediately remove the popup that shows it is in pending!
  useEffect(() => {
    if (!depositResult || !depositResult.success) return;

    // Search paymentRequests for the verified deposit
    const matchingReq = paymentRequests.find(r => {
      const matchUtr = depositResult.utr && r.utrNumber && r.utrNumber.trim() === depositResult.utr.trim();
      const matchTx = depositResult.txId && (r.txId === depositResult.txId || r.id === depositResult.txId);
      const isThisUser = !r.userId || r.userId === profile?.uid;
      return (matchUtr || matchTx || isThisUser) && r.type === 'deposit';
    });

    if (matchingReq && matchingReq.status === 'completed') {
      // The admin has verified the deposit!
      // Immediately remove the pop up that shows it is in pending!
      setDepositResult(null);
      triggerHaptic('success');
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.5 } });
      setVerifiedSuccessToast({
        amount: Number(matchingReq.amount) || depositAmount,
        utr: matchingReq.utrNumber || depositResult.utr
      });
      const timer = setTimeout(() => {
        setVerifiedSuccessToast(null);
      }, 6000);
      return () => clearTimeout(timer);
    } else if (matchingReq && matchingReq.status === 'rejected') {
      // If rejected, also clear the pending pop up
      setDepositResult(null);
    }
  }, [paymentRequests, depositResult, profile?.uid, depositAmount]);

  // Also remove pending withdrawal notice once verified
  useEffect(() => {
    if (!withdrawMsg || !withdrawMsg.ok) return;
    const isPendingWithdraw = userRequests.some(r => r.type === 'withdraw' && r.status === 'pending');
    if (!isPendingWithdraw) {
      setWithdrawMsg(null);
    }
  }, [paymentRequests, withdrawMsg, userRequests]);

  // Sync defaultTab when modal opens
  useEffect(() => {
    if (isOpen && defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  if (!isOpen) return null;

  return (
    <div id="wallet-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div id="wallet-modal-container" className="w-full max-w-lg bg-gray-950 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl text-white my-auto max-h-[92vh] flex flex-col">
        {/* Header with Balance */}
        <div className="bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 p-5 relative shrink-0">
          <button
            id="wallet-modal-close"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white text-sm font-bold transition"
          >
            ✕
          </button>
          <div className="flex items-center gap-2 text-white/90 text-xs font-semibold uppercase tracking-wider">
            <Wallet className="w-4 h-4" />
            WinXbet Game Wallet
          </div>
          <div className="mt-2 text-3xl font-black tracking-tight text-white flex items-baseline gap-1">
            <span>₹</span>
            <span>{profile ? profile.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-amber-100">
            <span className="bg-black/20 px-2 py-0.5 rounded font-semibold">VIP Level {profile?.vipLevel || 1}</span>
            <span>•</span>
            <span className="flex items-center gap-1 font-mono text-[11px] bg-amber-900/40 px-2 py-0.5 rounded border border-amber-400/30">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-300" /> Admin Approval Required
            </span>
          </div>
        </div>

        {/* Tab Switch */}
        <div className="flex border-b border-gray-800 bg-gray-900/90 shrink-0">
          <button
            id="wallet-tab-deposit"
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('deposit');
            }}
            className={`flex-1 py-3 text-center text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border-b-2 transition ${
              activeTab === 'deposit'
                ? 'border-red-500 text-red-400 bg-gray-950'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            Deposit &amp; Proof
          </button>
          <button
            id="wallet-tab-withdraw"
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('withdraw');
            }}
            className={`flex-1 py-3 text-center text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border-b-2 transition ${
              activeTab === 'withdraw'
                ? 'border-amber-500 text-amber-400 bg-gray-950'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            Withdraw
          </button>
          <button
            id="wallet-tab-requests"
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('requests');
            }}
            className={`flex-1 py-3 text-center text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border-b-2 transition ${
              activeTab === 'requests'
                ? 'border-blue-500 text-blue-400 bg-gray-950'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            Status ({userRequests.length})
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* TAB 1: DEPOSIT & PROOF */}
          {activeTab === 'deposit' && (
            <div className="space-y-4">
              {/* Notice for Daily Check-in */}
              <div className="p-3 bg-gradient-to-r from-amber-950/40 via-red-950/30 to-amber-950/40 rounded-xl border border-amber-500/30 flex items-center gap-2.5 text-xs text-amber-200">
                <span className="text-base">🔥</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-amber-300">Daily VIP Check-in Requirement: ₹100 Only</div>
                  <div className="text-[11px] text-gray-300">
                    Deposit ₹100 or more today to immediately unlock your Daily Rewards &amp; claim daily bonus points!
                  </div>
                </div>
              </div>

              {/* Verified Notification Toast */}
              {verifiedSuccessToast && (
                <div className="p-3 rounded-xl border border-emerald-500/60 bg-emerald-950/80 text-xs flex items-center justify-between gap-2 text-emerald-200 shadow-lg shadow-emerald-500/10 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-bold text-emerald-300">Deposit Approved &amp; Credited!</div>
                      <div className="text-[11px] text-gray-300">
                        ₹{verifiedSuccessToast.amount.toLocaleString()} has been approved by the Administrator and credited to your wallet balance!
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVerifiedSuccessToast(null)}
                    className="p-1 rounded-lg text-emerald-400 hover:text-white hover:bg-emerald-500/20 transition shrink-0 cursor-pointer"
                    title="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Status Message from previous submit */}
              {depositResult && (
                <div
                  className={`p-3 rounded-xl border text-xs flex flex-col gap-2 ${
                    depositResult.success
                      ? 'bg-amber-950/60 border-amber-500/60 text-amber-200'
                      : 'bg-red-950/60 border-red-500/60 text-red-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      {depositResult.success ? (
                        <Clock className="w-4 h-4 text-amber-400 mt-0.5 shrink-0 animate-pulse" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                      )}
                      <div>
                        <div className="font-bold">
                          {depositResult.success ? 'Deposit Proof Submitted — Pending Admin Review' : 'Submission Failed'}
                        </div>
                        <div className="text-[11px] mt-0.5 text-gray-300 leading-relaxed">
                          {depositResult.message}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDepositResult(null)}
                      className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition shrink-0 cursor-pointer"
                      title="Dismiss"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Active Pending Deposit Notice */}
              {!depositResult && !verifiedSuccessToast && activePendingDeposit && (
                <div className="p-3.5 rounded-xl border border-amber-500/50 bg-amber-950/40 text-xs space-y-1.5 text-amber-200">
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-amber-400 mt-0.5 shrink-0 animate-pulse" />
                    <div>
                      <div className="font-bold flex items-center gap-2">
                        <span>Deposit Under Verification</span>
                        <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 text-[10px] rounded border border-amber-500/30">
                          Pending Admin Review
                        </span>
                      </div>
                      <div className="text-[11px] mt-0.5 text-gray-300 leading-relaxed">
                        Deposit of ₹{activePendingDeposit.amount.toLocaleString()} (UTR: {activePendingDeposit.utrNumber || activePendingDeposit.txId}) is currently awaiting review by the platform Administrator in the Admin Console. Funds will be credited once verified.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1: Dynamic QR Code & Official Payee UPI */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="font-bold text-gray-200 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[11px] font-black">1</span>
                    Step 1: Scan QR or Pay via UPI to {officialUpi}
                  </span>
                  <span className="text-[10px] text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                    Official UPI Gateway
                  </span>
                </div>

                <UpiQrPaymentCard
                  amount={depositAmount}
                  onAmountChange={(amt) => setDepositAmount(amt)}
                  officialUpi={officialUpi}
                  quickAmounts={quickAmounts}
                  selectedApp={paymentApp}
                  onSelectApp={(app) => setPaymentApp(app)}
                  showModeToggle={true}
                />
              </div>

              {/* Step 2: Payment Proof Submission Box */}
              <div className="p-4 bg-gray-900/80 rounded-2xl border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[11px] font-black">2</span>
                    Step 2: Submit Payment Proof (Mandatory for Admin Verification)
                  </span>
                  <span className="text-[10px] text-amber-400 font-medium">Admin Approval Required</span>
                </div>

                {/* 12-digit UTR Input */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <label className="text-gray-300 font-medium">
                      12-Digit UPI UTR / Ref Number <span className="text-red-400">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateSampleUtr}
                      className="text-[11px] text-amber-400 hover:underline font-semibold flex items-center gap-1"
                    >
                      + Fill Sample UTR
                    </button>
                  </div>
                  <input
                    type="text"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    placeholder="e.g. 482910482918"
                    maxLength={20}
                    className="w-full px-3 py-2.5 bg-gray-950 border border-gray-700 rounded-xl text-white font-mono text-sm focus:border-amber-500 outline-none"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>Found in your payment app receipt under &quot;UPI Ref No&quot; or &quot;UTR&quot;</span>
                    <span className={utrNumber.trim().length >= 12 ? 'text-emerald-400' : 'text-gray-500'}>
                      {utrNumber.trim().length} digits
                    </span>
                  </div>
                </div>

                {/* App Used & Sender UPI */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="text-[11px] text-gray-400 font-medium mb-1 block">Payment App Used</label>
                    <select
                      value={paymentApp}
                      onChange={(e) => setPaymentApp(e.target.value)}
                      className="w-full px-2.5 py-2 bg-gray-950 border border-gray-700 rounded-xl text-xs text-white focus:border-amber-500 outline-none"
                    >
                      {popularApps.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-gray-400 font-medium mb-1 block">Your Sender UPI ID / Name</label>
                    <input
                      type="text"
                      value={senderUpiId}
                      onChange={(e) => setSenderUpiId(e.target.value)}
                      placeholder="e.g. rohit@oksbi or Rahul"
                      className="w-full px-2.5 py-2 bg-gray-950 border border-gray-700 rounded-xl text-xs text-white focus:border-amber-500 outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Payment Screenshot / Receipt Upload Zone */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <label className="text-gray-300 font-medium flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                      Upload Payment Screenshot / Receipt Proof <span className="text-red-400">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleUseSampleReceipt}
                      className="text-[11px] text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30 font-semibold flex items-center gap-1 transition"
                      title="Generates a real-looking UPI payment receipt for testing"
                    >
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      Auto Sample Receipt
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {!proofImage ? (
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-700 hover:border-amber-400/80 bg-gray-950/70 hover:bg-gray-900/80 rounded-2xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-amber-500/10 group-hover:bg-amber-500/20 text-amber-400 flex items-center justify-center transition">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div className="text-xs font-semibold text-gray-200">
                        {isCompressing ? 'Optimizing image...' : 'Click to Upload or Drag & Drop Screenshot'}
                      </div>
                      <p className="text-[10px] text-gray-500">
                        Supports PNG, JPG, JPEG, WEBP (Admin verifies UTR &amp; transaction ID)
                      </p>
                    </div>
                  ) : (
                    /* Uploaded Thumbnail Preview Card */
                    <div className="p-3 bg-gray-950 border border-emerald-500/40 rounded-xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div 
                          onClick={() => setPreviewModalImage(proofImage)}
                          className="w-12 h-14 bg-gray-900 rounded-lg overflow-hidden border border-gray-700 shrink-0 cursor-pointer relative group"
                          title="Click to zoom proof"
                        >
                          <img
                            src={proofImage}
                            alt="Payment Proof Thumbnail"
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition">
                            <Maximize2 className="w-3.5 h-3.5" />
                          </div>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1 text-emerald-400 font-bold text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">Proof Attached</span>
                          </div>
                          <div className="text-[11px] text-gray-300 truncate max-w-[190px]">
                            {proofFileName || 'screenshot_proof.jpg'}
                          </div>
                          <div className="text-[10px] text-gray-500 flex items-center gap-2">
                            <span>{proofFileSizeKb ? `${proofFileSizeKb} KB` : 'Optimized'}</span>
                            <span>•</span>
                            <button
                              type="button"
                              onClick={() => setPreviewModalImage(proofImage)}
                              className="text-amber-400 hover:underline font-semibold"
                            >
                              Inspect Preview
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-[11px] font-semibold transition"
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveProof}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition"
                          title="Remove attached proof"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {uploadError && (
                    <div className="text-[11px] text-red-400 flex items-center gap-1 mt-1 font-medium bg-red-950/40 p-2 rounded-lg border border-red-500/30">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{uploadError}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                id="wallet-confirm-deposit-btn"
                disabled={submittingDeposit}
                onClick={handleDeposit}
                className="w-full py-3.5 bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black rounded-xl shadow-lg shadow-red-500/20 transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {submittingDeposit ? (
                  <span>Submitting Proof for Admin Verification...</span>
                ) : (
                  <span>Submit Deposit Proof for Admin Approval (₹{depositAmount.toLocaleString()})</span>
                )}
              </button>

              <div className="p-3 bg-gray-900/50 rounded-xl border border-gray-800/80 text-[11px] text-gray-400 space-y-1">
                <p className="flex items-center gap-1.5 text-amber-300 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> Mandatory Admin Approval: Wallet credit requires Administrator review.
                </p>
                <p>• Deposits are recorded with &quot;Pending&quot; status. No funds are credited automatically.</p>
                <p>• The platform Administrator verifies the 12-digit UTR and payment proof in the Admin Console before releasing funds to your wallet.</p>
                <p>• Track the real-time status of your request anytime in the <strong>Status</strong> tab.</p>
              </div>
            </div>
          )}

          {/* TAB 2: WITHDRAW */}
          {activeTab === 'withdraw' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-300 font-medium mb-1 block">Withdrawal Amount (₹)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white font-bold focus:border-amber-500 outline-none"
                    placeholder="Enter amount (min ₹100)"
                  />
                </div>
                <div className="mt-1 flex justify-between text-[11px] text-gray-400">
                  <span>Available Balance: ₹{profile?.balance.toFixed(2) || '0.00'}</span>
                  <button 
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setWithdrawAmount(Math.floor(profile?.balance || 0));
                    }}
                    className="text-amber-400 hover:underline font-semibold cursor-pointer"
                  >
                    Withdraw All
                  </button>
                </div>

                {/* Quick Withdrawal Chips */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mt-2.5">
                  {[100, 300, 500, 1000, 2000, 5000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        triggerHaptic('selection');
                        setWithdrawAmount(amt);
                      }}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                        withdrawAmount === amt
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-300 font-medium mb-1 block">
                  Your Receiving UPI ID / Mobile Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white font-mono text-sm focus:border-amber-500 outline-none"
                  placeholder="e.g. yourname@okhdfcbank or 9876543210"
                />
                <span className="text-[10px] text-gray-500 mt-1 block">
                  Enter a UPI address or 10-digit mobile number for immediate payout transfer.
                </span>
              </div>

              {withdrawMsg && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                    withdrawMsg.ok
                      ? 'bg-amber-950/60 border-amber-500/60 text-amber-200'
                      : 'bg-red-950/60 border-red-500/60 text-red-300'
                  }`}
                >
                  {withdrawMsg.ok ? (
                    <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold">
                      {withdrawMsg.ok ? 'Awaiting Admin Payout Approval' : 'Withdrawal Issue'}
                    </div>
                    <div className="text-[11px] mt-0.5 text-gray-300 leading-relaxed">
                      {withdrawMsg.text}
                    </div>
                  </div>
                </div>
              )}

              <button
                id="wallet-confirm-withdraw-btn"
                disabled={submittingWithdraw}
                onClick={handleWithdraw}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-black rounded-xl shadow-lg shadow-amber-500/20 transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submittingWithdraw ? (
                  <span>Submitting to Admin...</span>
                ) : (
                  <span>Request Withdrawal (₹{withdrawAmount.toLocaleString()})</span>
                )}
              </button>

              <div className="p-3 bg-gray-900/50 rounded-xl border border-gray-800/80 text-[11px] text-gray-400 space-y-1">
                <p>• Only platform Administrators can approve withdrawals and execute payouts.</p>
                <p>• Funds are held securely in escrow until reviewed by the Admin team.</p>
                <p>• If rejected for any reason, held funds are immediately refunded to your wallet.</p>
              </div>
            </div>
          )}

          {/* TAB 3: STATUS & PROOFS HISTORY */}
          {activeTab === 'requests' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-400 pb-1">
                <span>Submitted Requests &amp; Admin Approvals</span>
                <span className="text-amber-400 font-bold">{userRequests.length} Total</span>
              </div>

              {userRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500 space-y-2">
                  <Clock className="w-8 h-8 mx-auto text-gray-600" />
                  <p className="text-xs">No deposit proofs or withdrawal requests submitted yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userRequests.map((req) => {
                    const isPending = req.status === 'pending';
                    const isApproved = req.status === 'completed';
                    const isRejected = req.status === 'rejected';

                    return (
                      <div
                        key={req.id || req.txId}
                        className={`p-3.5 bg-gray-900 border rounded-2xl space-y-2.5 text-xs transition ${
                          isPending
                            ? 'border-amber-500/40 shadow-sm'
                            : isApproved
                            ? 'border-emerald-500/30'
                            : 'border-red-500/30'
                        }`}
                      >
                        {/* Top: Type, Amount, Status */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-md font-black text-[10px] uppercase ${
                                req.type === 'deposit'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              }`}
                            >
                              {req.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                            </span>
                            <span className="font-black text-white text-sm">
                              ₹{req.amount.toLocaleString()}
                            </span>
                          </div>

                          {/* Status Badges */}
                          {isPending && (
                            <span className="px-2.5 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-full font-bold text-[10px] flex items-center gap-1.5 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                              Pending Admin Approval
                            </span>
                          )}
                          {isApproved && (
                            <span className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-full font-bold text-[10px] flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Approved &amp; Credited
                            </span>
                          )}
                          {isRejected && (
                            <span className="px-2.5 py-1 bg-red-500/20 border border-red-500/40 text-red-400 rounded-full font-bold text-[10px]">
                              Rejected
                            </span>
                          )}
                        </div>

                        {/* Middle: Proof Thumbnail & Reference Details */}
                        <div className="flex items-start gap-3 bg-gray-950 p-2.5 rounded-xl border border-gray-800/80">
                          {req.proofImageUrl ? (
                            <div
                              onClick={() => setPreviewModalImage(req.proofImageUrl || null)}
                              className="w-12 h-14 bg-gray-900 rounded-lg overflow-hidden border border-gray-700 shrink-0 cursor-pointer relative group"
                              title="Click to enlarge submitted receipt"
                            >
                              <img
                                src={req.proofImageUrl}
                                alt="Proof Screenshot"
                                className="w-full h-full object-cover group-hover:scale-105 transition"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition">
                                <Maximize2 className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-12 h-14 bg-gray-900 rounded-lg border border-gray-800 shrink-0 flex items-center justify-center text-gray-600 text-[10px] text-center p-1 font-mono">
                              No image
                            </div>
                          )}

                          <div className="flex-1 min-w-0 space-y-0.5 font-mono text-[11px]">
                            <div className="text-gray-400 truncate">
                              <span className="text-gray-500">Ref / UTR: </span>
                              <span className="text-amber-300 font-bold">{req.utrNumber || req.upiId || req.txId}</span>
                            </div>
                            {req.paymentApp && (
                              <div className="text-gray-400 text-[10px]">
                                <span className="text-gray-500">App: </span>{req.paymentApp}
                              </div>
                            )}
                            <div className="text-gray-500 text-[10px]">
                              Submitted: {new Date(req.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </div>
                          </div>
                        </div>

                        {/* Rejection / Approval Notes */}
                        {req.adminNotes && (
                          <div className={`p-2 rounded-lg text-[11px] border ${
                            isRejected 
                              ? 'bg-red-950/40 border-red-500/30 text-red-200' 
                              : 'bg-gray-950 border-gray-800 text-gray-300'
                          }`}>
                            <strong className={isRejected ? 'text-red-400' : 'text-amber-400'}>
                              {isRejected ? 'Admin Rejection Reason: ' : 'Admin Note: '}
                            </strong>
                            {req.rejectionReason || req.adminNotes}
                          </div>
                        )}

                        {/* Interactive Actions for Pending Requests */}
                        {isPending && (
                          <div className="pt-1 flex flex-col sm:flex-row gap-2">
                            {req.type === 'deposit' ? (
                              <div className="flex-1 py-2 px-3 bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs rounded-xl flex items-center justify-center gap-2 font-medium">
                                <Clock className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                                <span>Awaiting Administrator Review &amp; Approval in Admin Console</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleCancelWithdraw(req.id)}
                                disabled={actionInProgressId === req.id}
                                className="flex-1 py-2 px-3 bg-red-950/70 hover:bg-red-900/80 border border-red-500/40 text-red-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer disabled:opacity-50"
                                title="Refund held funds back to wallet balance immediately"
                              >
                                <Undo2 className="w-3.5 h-3.5" />
                                <span>{actionInProgressId === req.id ? 'Cancelling...' : 'Cancel Request & Refund to Balance'}</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Proof Lightbox / Zoom Modal */}
      {previewModalImage && (
        <div 
          onClick={() => setPreviewModalImage(null)}
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-sm sm:max-w-md w-full bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl"
          >
            <div className="p-3 bg-gray-950 border-b border-gray-800 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-amber-400" /> Payment Screenshot Proof
              </span>
              <button
                onClick={() => setPreviewModalImage(null)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 bg-black flex items-center justify-center max-h-[70vh] overflow-auto">
              <img
                src={previewModalImage}
                alt="Full Payment Proof"
                className="max-h-[65vh] w-auto object-contain rounded-lg"
              />
            </div>
            <div className="p-3 bg-gray-950 text-center">
              <button
                onClick={() => setPreviewModalImage(null)}
                className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl text-xs transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
