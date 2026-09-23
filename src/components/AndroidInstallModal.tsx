import React from 'react';
import { 
  Smartphone, 
  Download, 
  CheckCircle2, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  X, 
  ArrowRight,
  Share2,
  ExternalLink
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface AndroidInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInstallable: boolean;
  isInstalled: boolean;
  onInstall: () => void;
}

export const AndroidInstallModal: React.FC<AndroidInstallModalProps> = ({
  isOpen,
  onClose,
  isInstallable,
  isInstalled,
  onInstall,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-md bg-gradient-to-b from-gray-900 to-gray-950 border border-amber-500/30 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 flex items-center justify-center font-black text-white text-lg tracking-tighter shadow-md shadow-red-500/30">
              WX
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-white text-base">WinXbet VIP Android</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold border border-emerald-500/30">
                  OPTIMIZED
                </span>
              </div>
              <p className="text-xs text-gray-400">Official Android App &amp; WebApp</p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="p-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Alert */}
        {isInstalled ? (
          <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-emerald-300">Already Installed!</div>
              <div className="text-[11px] text-gray-300">
                WinXbet is running in standalone mode on your Android device.
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/60 to-gray-900 border border-amber-500/40 space-y-1">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Full Screen &amp; Ultra Low-Latency</span>
            </div>
            <p className="text-[11px] text-gray-300 leading-relaxed">
              Install the WinXbet official app for instant 1-tap access from your home screen, zero browser address bar, and enhanced Android haptic feedback.
            </p>
          </div>
        )}

        {/* Android Features */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Android Features:
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-gray-900 border border-gray-800 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-gray-200 text-[11px] font-semibold">Instant 1-Tap Launch</span>
            </div>
            <div className="p-2.5 rounded-xl bg-gray-900 border border-gray-800 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-gray-200 text-[11px] font-semibold">Edge-to-Edge Display</span>
            </div>
            <div className="p-2.5 rounded-xl bg-gray-900 border border-gray-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="text-gray-200 text-[11px] font-semibold">Biometric / Auto-Lock</span>
            </div>
            <div className="p-2.5 rounded-xl bg-gray-900 border border-gray-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="text-gray-200 text-[11px] font-semibold">Zero Storage Bloat</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {!isInstalled && (
          <div className="space-y-2 pt-1">
            <button
              onClick={() => {
                triggerHaptic('heavy');
                onInstall();
              }}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black text-sm rounded-2xl shadow-xl shadow-red-600/30 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isInstallable ? 'Install Official App Now' : 'Add to Android Home Screen'}</span>
            </button>

            {/* Manual Chrome / Android Instructions */}
            <div className="p-3 bg-gray-950 rounded-xl border border-gray-800/80 space-y-1.5 text-[11px] text-gray-400">
              <div className="font-bold text-gray-300 flex items-center gap-1.5">
                <span>Manual Install (Chrome on Android):</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-gray-400">
                <li>Tap the three dots menu (<strong className="text-white">⋮</strong>) in the top-right corner of Chrome.</li>
                <li>Select <strong className="text-amber-300">"Install app"</strong> or <strong className="text-amber-300">"Add to Home screen"</strong>.</li>
                <li>Tap <strong className="text-white">Install</strong> to confirm.</li>
              </ol>
            </div>
          </div>
        )}

        <div className="text-center pt-1">
          <button
            onClick={onClose}
            className="text-xs text-gray-500 hover:text-gray-300 font-medium py-1"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
