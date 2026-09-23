import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Headphones, MessageSquare, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { playClickSound } from '../utils/audio';

interface FloatingSupportButtonProps {
  onClick: () => void;
  unreadCount?: number;
  className?: string;
}

export const FloatingSupportButton: React.FC<FloatingSupportButtonProps> = ({
  onClick,
  unreadCount = 0,
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const handleClick = () => {
    triggerHaptic('medium');
    playClickSound();
    onClick();
  };

  return (
    <div
      className={`fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] right-4 sm:bottom-8 sm:right-8 z-40 flex items-center gap-2 select-none ${className}`}
    >
      {/* Tooltip / Label chip on hover or active on desktop */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.9 }}
            transition={{ duration: 0.18 }}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-950/95 border border-amber-500/40 text-amber-300 text-xs font-bold shadow-xl backdrop-blur-md pointer-events-none"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>24/7 Live Support</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Floating Action Button */}
      <motion.button
        type="button"
        id="floating-customer-support-fab"
        aria-label="Open 24/7 Customer Support Chat"
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className="group relative flex items-center justify-center w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-600 text-gray-950 shadow-2xl shadow-amber-500/30 border-2 border-amber-300 ring-4 ring-amber-500/20 cursor-pointer transition-shadow hover:shadow-amber-500/50"
      >
        {/* Animated Pulse Ring */}
        <span className="absolute -inset-1 rounded-full bg-amber-400/25 animate-ping opacity-75 pointer-events-none" />

        {/* Support Headset Icon */}
        <Headphones className="w-6 h-6 sm:w-7 sm:h-7 transition-transform group-hover:rotate-12 duration-200" />

        {/* Emerald Online Status Dot */}
        <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-gray-950 rounded-full shadow-sm" />

        {/* Unread badge if any */}
        {unreadCount > 0 ? (
          <span className="absolute -top-1.5 -left-1.5 px-1.5 py-0.2 bg-red-600 text-white font-black text-[10px] rounded-full border border-white shadow-md animate-bounce">
            {unreadCount}
          </span>
        ) : (
          <span className="absolute -bottom-1.5 px-2 py-0.2 rounded-full bg-gray-950/95 border border-amber-400 text-amber-300 text-[8px] font-black uppercase tracking-wider shadow-sm">
            HELP
          </span>
        )}
      </motion.button>
    </div>
  );
};
