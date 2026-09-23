import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  QrCode as QrCodeIcon, 
  Smartphone, 
  ShieldCheck, 
  Sparkles, 
  RefreshCw,
  Zap,
  Layers
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface UpiQrPaymentCardProps {
  amount: number;
  onAmountChange: (amt: number) => void;
  officialUpi?: string;
  quickAmounts?: number[];
  selectedApp?: string;
  onSelectApp?: (app: string) => void;
  showModeToggle?: boolean;
}

export const UpiQrPaymentCard: React.FC<UpiQrPaymentCardProps> = ({
  amount,
  onAmountChange,
  officialUpi = 'alex9241@ptaxis',
  quickAmounts = [100, 300, 500, 1000, 2000, 5000, 10000],
  selectedApp = 'Google Pay',
  onSelectApp,
  showModeToggle = true,
}) => {
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [qrMode, setQrMode] = useState<'dynamic' | 'static'>('dynamic');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrLoading, setQrLoading] = useState<boolean>(true);

  // Safe valid amount
  const validAmount = Math.max(1, Number(amount) || 100);

  // Generate standard UPI URI
  // Dynamic: includes amount and note
  // Static: standard payment request matching open amount
  const upiUri = qrMode === 'dynamic'
    ? `upi://pay?pa=${officialUpi}&pn=WinXbet&am=${validAmount}&cu=INR&tn=VIP%20Deposit`
    : `upi://pay?pa=${officialUpi}&pn=WinXbet&cu=INR`;

  useEffect(() => {
    let isMounted = true;
    setQrLoading(true);

    QRCode.toDataURL(upiUri, {
      width: 480,
      margin: 1.5,
      color: {
        dark: '#050b14',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    })
      .then((url: string) => {
        if (isMounted) {
          setQrDataUrl(url);
          setQrLoading(false);
        }
      })
      .catch((err: unknown) => {
        console.error('Failed to generate QR Code:', err);
        if (isMounted) {
          setQrLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [upiUri, qrMode]);

  const handleCopyUpi = () => {
    triggerHaptic('light');
    navigator.clipboard.writeText(officialUpi);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2200);
  };

  const handleDownloadQr = () => {
    triggerHaptic('selection');
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `UPI_QR_${officialUpi.replace(/[^a-zA-Z0-9]/g, '_')}_₹${validAmount}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Launch App directly via URI
  const handleOpenApp = (appName: string) => {
    triggerHaptic('selection');
    if (onSelectApp) onSelectApp(appName);

    let appUri = upiUri;
    const lower = appName.toLowerCase();
    if (lower.includes('google') || lower.includes('gpay')) {
      appUri = `tez://upi/pay?pa=${officialUpi}&pn=WinXbet&am=${validAmount}&cu=INR&tn=VIP%20Deposit`;
    } else if (lower.includes('phonepe')) {
      appUri = `phonepe://pay?pa=${officialUpi}&pn=WinXbet&am=${validAmount}&cu=INR&tn=VIP%20Deposit`;
    } else if (lower.includes('paytm')) {
      appUri = `paytmmp://pay?pa=${officialUpi}&pn=WinXbet&am=${validAmount}&cu=INR&tn=VIP%20Deposit`;
    }

    try {
      window.location.href = appUri;
    } catch {
      // Fallback to standard generic UPI intent
      window.location.href = upiUri;
    }
  };

  return (
    <div id="upi-qr-payment-card" className="bg-gradient-to-b from-gray-900 via-gray-900/95 to-gray-950 border border-amber-500/30 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
      {/* Header with verified badge */}
      <div className="flex items-center justify-between border-b border-gray-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <QrCodeIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-black text-white flex items-center gap-1.5">
              <span>Scan &amp; Pay with UPI</span>
              <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="w-2.5 h-2.5" /> Verified
              </span>
            </div>
            <div className="text-[10px] text-gray-400">
              Instant credit to wallet • 0% transaction fee
            </div>
          </div>
        </div>

        {showModeToggle && (
          <div className="flex bg-gray-950 p-0.5 rounded-lg border border-gray-800 text-[10px]">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setQrMode('dynamic');
              }}
              className={`px-2 py-1 rounded-md font-bold transition cursor-pointer flex items-center gap-1 ${
                qrMode === 'dynamic'
                  ? 'bg-amber-500 text-gray-950 shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Pre-fills your exact selected deposit amount in payment app"
            >
              <Zap className="w-2.5 h-2.5" />
              <span>Amount QR</span>
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setQrMode('static');
              }}
              className={`px-2 py-1 rounded-md font-bold transition cursor-pointer flex items-center gap-1 ${
                qrMode === 'static'
                  ? 'bg-amber-500 text-gray-950 shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Standard open amount QR"
            >
              <Layers className="w-2.5 h-2.5" />
              <span>Open QR</span>
            </button>
          </div>
        )}
      </div>

      {/* Quick Amount Selector Chips */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs text-gray-300 font-semibold flex items-center gap-1">
            <span>Select Deposit Amount</span>
            <span className="text-amber-400 font-bold">₹{validAmount.toLocaleString()}</span>
          </label>
          <span className="text-[10px] text-gray-400">Min: ₹100</span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 mb-2">
          {quickAmounts.map((amt) => {
            const isSelected = amount === amt;
            return (
              <button
                key={amt}
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  onAmountChange(amt);
                }}
                className={`py-1.5 px-1 rounded-xl border text-xs font-black transition cursor-pointer ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500 text-gray-950 shadow-md shadow-amber-500/20'
                    : 'border-gray-800 bg-gray-950 text-gray-300 hover:bg-gray-800/80 hover:text-white'
                }`}
              >
                ₹{amt >= 1000 ? `${amt / 1000}k` : amt}
              </button>
            );
          })}
        </div>

        {/* Custom amount input */}
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₹</span>
          <input
            id="deposit-custom-amount-input"
            type="number"
            min={100}
            step={50}
            value={amount}
            onChange={(e) => onAmountChange(Number(e.target.value))}
            className="w-full pl-8 pr-3 py-2 bg-gray-950 border border-gray-700/80 rounded-xl text-white font-bold text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition"
            placeholder="Enter custom deposit amount (min ₹100)"
          />
        </div>
      </div>

      {/* QR Code & Payee Display Area */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-gray-950/70 p-3.5 sm:p-4 rounded-2xl border border-gray-800/90">
        {/* QR Code Canvas */}
        <div className="md:col-span-5 flex flex-col items-center justify-center">
          <div className="relative p-2.5 bg-white rounded-2xl shadow-2xl border-4 border-amber-500/30 flex items-center justify-center max-w-[210px] sm:max-w-[220px] w-full aspect-square">
            {qrLoading ? (
              <div className="flex flex-col items-center justify-center gap-2 text-gray-900 py-10">
                <RefreshCw className="w-7 h-7 animate-spin text-amber-600" />
                <span className="text-[11px] font-bold">Generating QR...</span>
              </div>
            ) : qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="UPI Deposit QR Code"
                className="w-full h-full object-contain rounded-lg select-none"
              />
            ) : (
              <div className="text-xs text-red-500 p-4 text-center font-bold">
                Failed to load QR. Please use UPI ID below.
              </div>
            )}

            {/* Sub-label under QR on card */}
            <div className="absolute -bottom-2 bg-gray-900 border border-amber-500/40 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full shadow-md">
              ₹{validAmount.toLocaleString()} Auto-Fill
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3 w-full justify-center">
            <button
              type="button"
              onClick={handleDownloadQr}
              className="px-2.5 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-850 text-gray-300 hover:text-white border border-gray-800 text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95"
              title="Save QR image to gallery to scan in Google Pay or PhonePe"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Save QR</span>
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                window.location.href = upiUri;
              }}
              className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95"
              title="Open UPI payment intent directly"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open UPI</span>
            </button>
          </div>
        </div>

        {/* Right Info Column: UPI ID + One-Tap App Buttons */}
        <div className="md:col-span-7 space-y-3">
          {/* Official Payee UPI Box */}
          <div className="bg-gray-900/90 p-3 rounded-xl border border-amber-500/40 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                Official Payee UPI ID
              </span>
              <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> Available 24/7
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 bg-black/60 px-3 py-2 rounded-lg border border-gray-800">
              <div className="min-w-0">
                <div className="font-mono text-sm sm:text-base font-black text-amber-300 truncate select-all tracking-wide">
                  {officialUpi}
                </div>
                <div className="text-[10px] text-gray-400">
                  Beneficiary: <span className="text-gray-200 font-medium">WinXbet Gaming VIP</span>
                </div>
              </div>

              <button
                id="copy-upi-id-btn"
                type="button"
                onClick={handleCopyUpi}
                className={`px-3 py-2 rounded-lg text-xs font-black flex items-center gap-1.5 transition shrink-0 cursor-pointer active:scale-95 ${
                  copiedUpi
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-500 hover:bg-amber-400 text-gray-950 shadow-md shadow-amber-500/20'
                }`}
                title="Copy UPI ID to clipboard"
              >
                {copiedUpi ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy UPI</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 1-Tap App Fast Pay Buttons */}
          <div>
            <div className="text-[11px] font-bold text-gray-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                <span>Pay ₹{validAmount.toLocaleString()} Directly via App:</span>
              </span>
              <span className="text-[10px] text-gray-500">Tap to launch</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleOpenApp('Google Pay')}
                className="py-2 px-2.5 bg-gray-900 hover:bg-gray-850 active:scale-98 rounded-xl border border-gray-800 hover:border-emerald-500/50 text-xs font-bold text-gray-200 flex items-center justify-between gap-1.5 transition cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  <span>Google Pay</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">₹{validAmount}</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenApp('PhonePe')}
                className="py-2 px-2.5 bg-gray-900 hover:bg-gray-850 active:scale-98 rounded-xl border border-gray-800 hover:border-purple-500/50 text-xs font-bold text-gray-200 flex items-center justify-between gap-1.5 transition cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  <span>PhonePe</span>
                </span>
                <span className="text-[10px] text-purple-300 font-mono font-bold">₹{validAmount}</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenApp('PayTM')}
                className="py-2 px-2.5 bg-gray-900 hover:bg-gray-850 active:scale-98 rounded-xl border border-gray-800 hover:border-sky-500/50 text-xs font-bold text-gray-200 flex items-center justify-between gap-1.5 transition cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  <span>PayTM</span>
                </span>
                <span className="text-[10px] text-sky-300 font-mono font-bold">₹{validAmount}</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenApp('Any UPI App')}
                className="py-2 px-2.5 bg-amber-500/10 hover:bg-amber-500/20 active:scale-98 rounded-xl border border-amber-500/30 text-xs font-bold text-amber-300 flex items-center justify-between gap-1.5 transition cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>Any UPI App</span>
                </span>
                <span className="text-[10px] text-amber-400 font-mono font-bold">₹{validAmount}</span>
              </button>
            </div>
          </div>

          {/* Instructions note */}
          <div className="text-[10px] text-gray-400 bg-gray-950 p-2 rounded-lg border border-gray-800/80 leading-relaxed">
            <span className="text-amber-300 font-bold">💡 How it works:</span> Scan this QR or copy UPI ID <span className="text-amber-200 font-mono font-bold">{officialUpi}</span> in your payment app. Once paid, enter the 12-digit UTR below for instant confirmation!
          </div>
        </div>
      </div>
    </div>
  );
};
