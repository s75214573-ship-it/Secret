import React from 'react';
import { Gift, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface RegistrationBonusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartPlaying: () => void;
}

export const RegistrationBonusModal: React.FC<RegistrationBonusModalProps> = ({
  isOpen,
  onClose,
  onStartPlaying
}) => {
  if (!isOpen) return null;

  return (
    <div id="bonus-celebration-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div 
        id="bonus-celebration-card" 
        className="w-full max-w-sm bg-gradient-to-b from-gray-900 via-gray-950 to-black border-2 border-amber-500/60 rounded-3xl p-6 shadow-2xl text-white text-center relative overflow-hidden"
      >
        {/* Shimmer light effects */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-red-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Gift Icon Badge */}
        <div className="relative mx-auto w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-red-600 flex items-center justify-center shadow-xl shadow-amber-500/30 mb-4 animate-bounce">
          <Gift className="w-10 h-10 text-white" />
          <div className="absolute -top-1 -right-1 p-1 bg-amber-400 rounded-full text-black">
            <Sparkles className="w-4 h-4 fill-black" />
          </div>
        </div>

        <div className="inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/40 rounded-full text-xs font-black text-amber-300 mb-2 uppercase tracking-wide">
          🎁 Registration Reward
        </div>

        <h2 className="text-2xl font-black tracking-tight text-white mb-1">
          Welcome to WinXbet!
        </h2>
        
        <p className="text-xs text-gray-300 max-w-xs mx-auto mb-4">
          Your exclusive new member signup bonus has been credited successfully.
        </p>

        {/* Bonus Amount Display */}
        <div className="bg-gradient-to-r from-red-950 via-gray-900 to-amber-950 border border-amber-500/40 rounded-2xl p-4 mb-4 shadow-inner">
          <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
            Wallet Balance Credited
          </div>
          <div className="text-4xl font-black text-amber-400 font-mono tracking-tight my-1">
            ₹68.00
          </div>
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-400 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Ready to use for Win Go &amp; Aviator</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          id="claim-bonus-start-btn"
          type="button"
          onClick={() => {
            triggerHaptic('heavy');
            onClose();
            onStartPlaying();
          }}
          className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-gray-950 font-black text-sm rounded-xl shadow-lg shadow-amber-500/20 transition active:scale-[0.99] flex items-center justify-center gap-2"
        >
          <span>Start Playing Now</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
