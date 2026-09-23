import React from 'react';
import { motion } from 'motion/react';

interface TabTransitionSkeletonProps {
  tab: 'home' | 'wingo' | 'aviator' | 'promotion' | 'wallet' | 'account' | 'admin';
}

export const TabTransitionSkeleton: React.FC<TabTransitionSkeletonProps> = ({ tab }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="w-full space-y-4 select-none pointer-events-none"
      id={`skeleton-loading-${tab}`}
      aria-busy="true"
      aria-label="Loading tab content"
    >
      {/* 1. HOME TAB SKELETON */}
      {tab === 'home' && (
        <>
          {/* Hero Banner Carousel Placeholder */}
          <div className="w-full h-40 rounded-2xl bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border border-gray-800/80 relative overflow-hidden animate-pulse">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.6s_infinite]" />
            <div className="p-4 h-full flex flex-col justify-end space-y-2">
              <div className="w-24 h-4 bg-amber-500/20 rounded-md" />
              <div className="w-48 h-6 bg-gray-800 rounded-lg" />
              <div className="w-32 h-3 bg-gray-800/80 rounded-md" />
            </div>
          </div>

          {/* Marquee Ticker Placeholder */}
          <div className="h-10 rounded-xl bg-gray-900/90 border border-gray-800 flex items-center px-3 gap-3 animate-pulse">
            <div className="w-5 h-5 rounded-full bg-amber-500/20 shrink-0" />
            <div className="h-3.5 bg-gray-800 rounded-md flex-1" />
            <div className="w-12 h-3.5 bg-red-600/20 rounded-md shrink-0" />
          </div>

          {/* Category Chips Bar */}
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-9 rounded-xl bg-gray-900 border border-gray-800/80 flex items-center justify-center gap-1.5 animate-pulse"
              >
                <div className="w-3.5 h-3.5 rounded bg-gray-800" />
                <div className="w-10 h-3 bg-gray-800 rounded" />
              </div>
            ))}
          </div>

          {/* Game Cards Grid */}
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-44 rounded-2xl bg-gray-900/80 border border-gray-800 p-3 flex flex-col justify-between relative overflow-hidden animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-4 rounded-full bg-red-600/20" />
                  <div className="w-4 h-4 rounded-full bg-gray-800" />
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gray-800/60 mx-auto" />
                <div className="space-y-1.5">
                  <div className="w-20 h-4 bg-gray-800 rounded" />
                  <div className="w-14 h-3 bg-amber-500/10 rounded" />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 2. WINGO / LOTTERY SKELETON */}
      {tab === 'wingo' && (
        <>
          {/* Game Mode Timer Switcher */}
          <div className="grid grid-cols-4 gap-1.5 p-1 bg-gray-900 border border-gray-800 rounded-xl animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 rounded-lg bg-gray-800/80" />
            ))}
          </div>

          {/* Period Header & Countdown Showcase */}
          <div className="rounded-2xl bg-gradient-to-br from-red-950/40 via-gray-900 to-gray-950 border border-red-900/30 p-4 space-y-3 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="w-16 h-3 bg-gray-800 rounded" />
                <div className="w-28 h-5 bg-gray-800 rounded-md" />
              </div>
              <div className="text-right space-y-1">
                <div className="w-20 h-3 bg-gray-800 rounded ml-auto" />
                <div className="w-24 h-7 bg-amber-500/20 border border-amber-500/30 rounded-xl" />
              </div>
            </div>

            {/* Colors Selection Pill */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="h-11 rounded-xl bg-emerald-950/60 border border-emerald-800/40" />
              <div className="h-11 rounded-xl bg-purple-950/60 border border-purple-800/40" />
              <div className="h-11 rounded-xl bg-red-950/60 border border-red-800/40" />
            </div>

            {/* Numbers Grid (0 to 9) */}
            <div className="grid grid-cols-5 gap-2 pt-1">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <div
                  key={n}
                  className="h-10 rounded-xl bg-gray-800/70 border border-gray-700/50 flex items-center justify-center"
                />
              ))}
            </div>

            {/* Big / Small Choice */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="h-10 rounded-xl bg-amber-950/40 border border-amber-800/40" />
              <div className="h-10 rounded-xl bg-blue-950/40 border border-blue-800/40" />
            </div>
          </div>

          {/* Multipliers Bar */}
          <div className="flex gap-2 overflow-x-auto pb-1 animate-pulse">
            {[1, 5, 10, 20, 50, 100].map((m) => (
              <div key={m} className="w-12 h-7 rounded-lg bg-gray-900 border border-gray-800 shrink-0" />
            ))}
          </div>

          {/* History Records Table Skeleton */}
          <div className="rounded-2xl bg-gray-900 border border-gray-800 p-4 space-y-2.5 animate-pulse">
            <div className="flex items-center justify-between pb-2 border-b border-gray-800">
              <div className="w-24 h-4 bg-gray-800 rounded" />
              <div className="w-16 h-4 bg-gray-800 rounded" />
            </div>
            {[1, 2, 3, 4].map((r) => (
              <div key={r} className="flex items-center justify-between py-1.5 border-b border-gray-800/50">
                <div className="w-20 h-3 bg-gray-800/80 rounded" />
                <div className="w-6 h-6 rounded-full bg-gray-800" />
                <div className="w-12 h-3 bg-gray-800/80 rounded" />
              </div>
            ))}
          </div>
        </>
      )}

      {/* 3. AVIATOR SKELETON */}
      {tab === 'aviator' && (
        <>
          {/* Aviator Multiplier Radar Canvas Placeholder */}
          <div className="w-full h-56 rounded-2xl bg-gray-950 border border-red-900/40 relative overflow-hidden flex flex-col items-center justify-center p-4 animate-pulse">
            <div className="w-24 h-24 rounded-full border-2 border-dashed border-red-500/30 flex items-center justify-center">
              <div className="w-16 h-6 bg-red-600/30 rounded-md" />
            </div>
            <div className="w-32 h-8 bg-gray-800 rounded-lg mt-3" />
            <div className="w-20 h-3 bg-gray-700/60 rounded mt-1" />
          </div>

          {/* Dual Bet Control Panels */}
          <div className="grid grid-cols-2 gap-3 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-2xl bg-gray-900 border border-gray-800 p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-3 bg-gray-800 rounded" />
                  <div className="w-10 h-3 bg-gray-800 rounded" />
                </div>
                <div className="h-9 rounded-xl bg-gray-950 border border-gray-800" />
                <div className="h-10 rounded-xl bg-emerald-600/30 border border-emerald-500/30" />
              </div>
            ))}
          </div>
        </>
      )}

      {/* 4. PROMOTION SKELETON */}
      {tab === 'promotion' && (
        <>
          {/* Diamond VIP Referral Banner Placeholder */}
          <div className="rounded-2xl bg-gradient-to-r from-red-950 via-gray-900 to-amber-950/40 border border-amber-500/30 p-4 space-y-3 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 rotate-45 shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="w-32 h-5 bg-amber-400/20 rounded-md" />
                <div className="w-48 h-3.5 bg-gray-800 rounded" />
              </div>
            </div>
            <div className="h-10 rounded-xl bg-gray-950 border border-gray-800 flex items-center px-3 justify-between">
              <div className="w-36 h-3 bg-gray-800 rounded" />
              <div className="w-16 h-6 rounded-lg bg-amber-500/30" />
            </div>
          </div>

          {/* Commission Stats 3-Col Grid */}
          <div className="grid grid-cols-3 gap-2 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl bg-gray-900 border border-gray-800 p-3 text-center space-y-1">
                <div className="w-12 h-3 bg-gray-800 rounded mx-auto" />
                <div className="w-16 h-5 bg-amber-500/20 rounded mx-auto" />
              </div>
            ))}
          </div>

          {/* Agent Tier Table */}
          <div className="rounded-2xl bg-gray-900 border border-gray-800 p-4 space-y-3 animate-pulse">
            <div className="w-32 h-4 bg-gray-800 rounded" />
            {[1, 2, 3].map((r) => (
              <div key={r} className="h-12 rounded-xl bg-gray-950 border border-gray-800/80" />
            ))}
          </div>
        </>
      )}

      {/* 5. WALLET SKELETON */}
      {tab === 'wallet' && (
        <>
          {/* Balance Showcase Box */}
          <div className="rounded-2xl bg-gray-900 border border-gray-800 p-4 space-y-4 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="w-24 h-3 bg-gray-800 rounded" />
                <div className="w-36 h-8 bg-amber-400/20 rounded-lg" />
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20" />
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="h-10 rounded-xl bg-red-600/30 border border-red-500/30" />
              <div className="h-10 rounded-xl bg-amber-500/30 border border-amber-500/30" />
            </div>
          </div>

          {/* Payment Channel Chips */}
          <div className="rounded-2xl bg-gray-900 border border-gray-800 p-4 space-y-3 animate-pulse">
            <div className="w-28 h-4 bg-gray-800 rounded" />
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-gray-950 border border-gray-800" />
              ))}
            </div>
          </div>

          {/* Transactions Ledger Rows */}
          <div className="rounded-2xl bg-gray-900 border border-gray-800 p-4 space-y-2.5 animate-pulse">
            <div className="w-36 h-4 bg-gray-800 rounded mb-2" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-xl bg-gray-950 border border-gray-800/80" />
            ))}
          </div>
        </>
      )}

      {/* 6. ACCOUNT / ADMIN SKELETON */}
      {(tab === 'account' || tab === 'admin') && (
        <>
          {/* Member Card Header */}
          <div className="rounded-2xl bg-gray-900 border border-gray-800 p-4 space-y-3 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="w-32 h-5 bg-gray-800 rounded" />
                <div className="w-24 h-3.5 bg-gray-800/80 rounded" />
              </div>
              <div className="w-14 h-6 bg-amber-500/20 rounded-full" />
            </div>
            <div className="h-16 rounded-xl bg-gray-950 border border-gray-800/80" />
          </div>

          {/* Weekly Performance Recharts Box Placeholder */}
          <div className="rounded-2xl bg-gray-900 border border-gray-800 p-4 space-y-3 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="w-36 h-4 bg-gray-800 rounded" />
              <div className="w-16 h-4 bg-amber-500/20 rounded-md" />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-gray-950 border border-gray-800/80" />
              ))}
            </div>
            <div className="w-full h-44 rounded-xl bg-gray-950 border border-gray-800/80" />
          </div>

          {/* Menu Rows */}
          <div className="rounded-2xl bg-gray-900 border border-gray-800 p-2 space-y-1 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-11 rounded-xl bg-gray-950/60 border border-gray-800/50" />
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
};
