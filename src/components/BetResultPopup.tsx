import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Trophy, Sparkles, X, Flame } from 'lucide-react';
import { BetResultNotification } from '../types';
import { playWinSound, playBigWinSound, playLoseSound } from '../utils/audio';

interface BetResultPopupProps {
  notification: BetResultNotification | null;
  onClose: () => void;
}

// Pre-calculated confetti particle offsets for celebratory win explosion
const CONFETTI_PARTICLES = [
  { id: 1, x: -90, y: -65, rot: 45, color: 'bg-amber-400', size: 'w-2 h-2', delay: 0 },
  { id: 2, x: 80, y: -70, rot: -30, color: 'bg-emerald-400', size: 'w-2.5 h-1.5', delay: 0.05 },
  { id: 3, x: -60, y: 55, rot: 60, color: 'bg-yellow-300', size: 'w-2 h-2', delay: 0.1 },
  { id: 4, x: 75, y: 50, rot: -45, color: 'bg-rose-400', size: 'w-1.5 h-3', delay: 0.08 },
  { id: 5, x: -110, y: 0, rot: 90, color: 'bg-emerald-300', size: 'w-2 h-2', delay: 0.12 },
  { id: 6, x: 105, y: -10, rot: -80, color: 'bg-amber-300', size: 'w-2.5 h-2', delay: 0.03 },
  { id: 7, x: -35, y: -80, rot: 15, color: 'bg-cyan-400', size: 'w-2 h-1.5', delay: 0.15 },
  { id: 8, x: 40, y: -85, rot: -25, color: 'bg-amber-400', size: 'w-2 h-2.5', delay: 0.07 },
  { id: 9, x: -80, y: -30, rot: 75, color: 'bg-emerald-400', size: 'w-1.5 h-2.5', delay: 0.11 },
  { id: 10, x: 85, y: 25, rot: -60, color: 'bg-yellow-400', size: 'w-2 h-2', delay: 0.09 },
  { id: 11, x: 0, y: -95, rot: 40, color: 'bg-rose-400', size: 'w-2.5 h-1.5', delay: 0.04 },
  { id: 12, x: 0, y: 70, rot: -35, color: 'bg-amber-300', size: 'w-2 h-2', delay: 0.14 }
];

export const BetResultPopup: React.FC<BetResultPopupProps> = ({ notification, onClose }) => {
  const [progressKey, setProgressKey] = useState<number>(0);

  // Whenever notification changes, reset progress key to trigger 3s progress bar animation and play audio
  useEffect(() => {
    if (notification) {
      setProgressKey(Date.now());
      if (notification.status === 'won') {
        if (notification.winAmount >= 500) {
          playBigWinSound();
        } else {
          playWinSound();
        }
      } else if (notification.status === 'lost') {
        playLoseSound();
      }
    }
  }, [notification?.id]);

  if (!notification) return null;

  const isWon = notification.status === 'won';

  return (
    <AnimatePresence>
      <div 
        id="bet-result-popup-container"
        className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-sm pointer-events-none"
      >
        <motion.div
          key={notification.id}
          initial={{ opacity: 0, y: -30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 22, stiffness: 350 }}
          className="pointer-events-auto relative rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl border select-none"
          style={{
            background: isWon 
              ? 'linear-gradient(135deg, rgba(16, 24, 20, 0.96) 0%, rgba(6, 12, 10, 0.98) 100%)'
              : 'linear-gradient(135deg, rgba(28, 12, 12, 0.96) 0%, rgba(15, 6, 6, 0.98) 100%)',
            borderColor: isWon ? 'rgba(52, 211, 153, 0.45)' : 'rgba(239, 68, 68, 0.35)',
            boxShadow: isWon 
              ? '0 10px 30px -5px rgba(16, 185, 129, 0.35), 0 0 20px 2px rgba(245, 158, 11, 0.2)'
              : '0 10px 25px -5px rgba(220, 38, 38, 0.3)'
          }}
        >
          {/* Top Close Button */}
          <button
            id="bet-result-popup-close-btn"
            onClick={onClose}
            aria-label="Dismiss notification"
            className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white flex items-center justify-center transition z-20"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {/* Celebratory background particles & glow if Won */}
          {isWon && (
            <>
              {/* Radial glow background */}
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

              {/* Confetti Explosion Elements */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
                {CONFETTI_PARTICLES.map((p) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                    animate={{
                      opacity: [0, 1, 1, 0],
                      scale: [0.3, 1.2, 1],
                      x: p.x,
                      y: p.y,
                      rotate: [0, p.rot * 2]
                    }}
                    transition={{
                      duration: 1.4,
                      delay: p.delay,
                      ease: 'easeOut'
                    }}
                    className={`absolute rounded-sm ${p.size} ${p.color}`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Card Body */}
          <div className="p-4 sm:p-5 text-center relative z-10">
            {isWon ? (
              /* WIN STATE: Celebratory visuals, trophy, and winning amount */
              <div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <motion.div
                    initial={{ scale: 0, rotate: -25 }}
                    animate={{ scale: [0, 1.2, 1], rotate: 0 }}
                    transition={{ type: 'spring', damping: 12, stiffness: 280 }}
                    className="relative w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-emerald-400 flex items-center justify-center shadow-lg shadow-amber-500/30"
                  >
                    <Trophy className="w-6 h-6 text-gray-950 fill-gray-950" />
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                      className="absolute -top-1 -right-1 text-yellow-200"
                    >
                      <Sparkles className="w-4 h-4 fill-yellow-200" />
                    </motion.div>
                  </motion.div>
                </div>

                {/* WIN Header */}
                <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-black tracking-widest text-sm uppercase">
                  <Flame className="w-4 h-4 fill-emerald-400 animate-pulse" />
                  <span>WIN</span>
                  <Flame className="w-4 h-4 fill-emerald-400 animate-pulse" />
                </div>

                {/* Winning Amount Display */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
                  className="text-3xl sm:text-4xl font-black text-amber-300 font-mono tracking-tight my-1 drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]"
                >
                  +₹{notification.winAmount.toFixed(2)}
                </motion.div>
                
                <div className="text-[11px] font-semibold text-emerald-300/90 flex items-center justify-center gap-1">
                  <span>Credited to wallet</span>
                </div>
              </div>
            ) : (
              /* LOST STATE: Strictly shows only "LOST" */
              <div className="py-2.5">
                <div className="text-3xl sm:text-4xl font-black tracking-widest text-red-500 font-mono drop-shadow-[0_2px_10px_rgba(239,68,68,0.4)]">
                  LOST
                </div>
              </div>
            )}
          </div>

          {/* 3-Second Countdown Progress Bar */}
          <div className="w-full bg-black/40 h-1 overflow-hidden">
            <motion.div
              key={progressKey}
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 3, ease: 'linear' }}
              className={`h-full ${isWon ? 'bg-emerald-400' : 'bg-red-500'}`}
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
