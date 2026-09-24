import React from 'react';

interface WinXbetLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'badge';
  showVipBadge?: boolean;
  showSubtitle?: boolean;
  subtitleText?: string;
  adminBadge?: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  useImage?: boolean;
}

export const WinXbetLogo: React.FC<WinXbetLogoProps> = ({
  size = 'md',
  variant = 'full',
  showVipBadge = false,
  showSubtitle = false,
  subtitleText = 'Fair Lottery & Prediction',
  adminBadge,
  className = '',
  onClick,
  useImage = false
}) => {
  // Dimension presets
  const sizeStyles = {
    xs: {
      height: 'h-6',
      imgHeight: 'h-6',
      iconBox: 'w-7 h-7',
      text: 'text-sm',
      subtext: 'text-[9px]',
      crown: 'w-2.5 h-2.5',
      vipBadge: 'text-[9px] px-1 py-0.2'
    },
    sm: {
      height: 'h-7',
      imgHeight: 'h-7',
      iconBox: 'w-8 h-8',
      text: 'text-base',
      subtext: 'text-[10px]',
      crown: 'w-3 h-3',
      vipBadge: 'text-[10px] px-1.5 py-0.5'
    },
    md: {
      height: 'h-9',
      imgHeight: 'h-9',
      iconBox: 'w-10 h-10',
      text: 'text-lg',
      subtext: 'text-[11px]',
      crown: 'w-3.5 h-3.5',
      vipBadge: 'text-xs px-2 py-0.5'
    },
    lg: {
      height: 'h-12',
      imgHeight: 'h-12',
      iconBox: 'w-14 h-14',
      text: 'text-2xl',
      subtext: 'text-xs',
      crown: 'w-4 h-4',
      vipBadge: 'text-xs px-2.5 py-0.5'
    },
    xl: {
      height: 'h-16',
      imgHeight: 'h-16',
      iconBox: 'w-20 h-20',
      text: 'text-3xl',
      subtext: 'text-sm',
      crown: 'w-6 h-6',
      vipBadge: 'text-sm px-3 py-1'
    }
  }[size];

  // If icon-only variant requested (for app icon badges, avatars, quick buttons)
  if (variant === 'icon') {
    return (
      <div 
        onClick={onClick}
        className={`relative inline-flex items-center justify-center rounded-2xl bg-black border border-amber-500/30 shadow-lg shadow-amber-500/10 overflow-hidden shrink-0 ${sizeStyles.iconBox} ${className}`}
      >
        <img 
          src="/images/winxbet_logo.png" 
          alt="WinXbet Icon" 
          className="w-full h-full object-cover transform scale-110"
          onError={(e) => {
            // Fallback to SVG mark if image fails
            (e.currentTarget as HTMLElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  // If badge variant requested (square/rounded pill with full logo)
  if (variant === 'badge') {
    return (
      <div 
        onClick={onClick}
        className={`inline-flex items-center gap-2 p-1.5 px-3 rounded-2xl bg-black/90 border border-amber-500/30 shadow-xl shadow-amber-500/10 ${className}`}
      >
        <div className="w-8 h-8 rounded-xl overflow-hidden bg-black shrink-0 border border-amber-500/40">
          <img src="/images/winxbet_logo.png" alt="WinXbet" className="w-full h-full object-cover scale-125" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-black text-white text-base tracking-tight">win<span className="text-amber-400">X</span><span className="text-amber-400">bet</span></span>
            {showVipBadge && (
              <span className="text-amber-400 text-[10px] font-black px-1.5 py-0.2 bg-amber-400/10 rounded border border-amber-400/30">
                VIP
              </span>
            )}
          </div>
          {showSubtitle && (
            <span className="text-[10px] text-gray-400 font-medium">{subtitleText}</span>
          )}
        </div>
      </div>
    );
  }

  // Full Horizontal Brand Logo (Vector SVG + High-Res Image hybrid for crisp rendering at all sizes)
  return (
    <div 
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 select-none ${onClick ? 'cursor-pointer active:scale-95 transition-transform' : ''} ${className}`}
    >
      {/* Brand Emblem Icon with the Crowned X and Dynamic Orbit Rings */}
      <div className={`relative rounded-xl overflow-hidden bg-black border border-amber-500/30 shadow-md shadow-amber-500/10 shrink-0 flex items-center justify-center p-0.5 ${sizeStyles.iconBox}`}>
        <img 
          src="/images/winxbet_logo.png" 
          alt="WinXbet" 
          className="w-full h-full object-cover transform scale-125 hover:scale-135 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-transparent to-white/10 pointer-events-none" />
      </div>

      {/* Horizontal Wordmark Typography */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5 leading-none">
          {/* Stylized Logo Text directly matching the uploaded asset */}
          <div className="flex items-center font-black italic tracking-tight">
            {/* 'win' in glossy white with metallic drop */}
            <span className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-100 to-gray-300 lowercase" style={{ fontSize: size === 'xl' ? '2.25rem' : size === 'lg' ? '1.75rem' : size === 'md' ? '1.35rem' : '1.1rem' }}>
              win
            </span>
            
            {/* Crowned 'X' with glowing golden yellow accent */}
            <span className="relative inline-flex items-center justify-center px-0.5">
              {/* Golden Crown floating atop the X */}
              <svg 
                className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-3.5 h-3 text-amber-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]" 
                viewBox="0 0 24 24" 
                fill="currentColor"
              >
                <path d="M2 19h20v2H2v-2zm1.5-4.5l3.5-3.5 5 6 5-6 3.5 3.5 2-8.5-6.5 4-4-6-4 6-6.5-4 2 8.5z" />
              </svg>
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 uppercase font-black drop-shadow-[0_2px_8px_rgba(245,158,11,0.4)]" style={{ fontSize: size === 'xl' ? '2.5rem' : size === 'lg' ? '1.95rem' : size === 'md' ? '1.5rem' : '1.25rem' }}>
                X
              </span>
            </span>

            {/* 'bet' in vivid amber gold */}
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 lowercase font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" style={{ fontSize: size === 'xl' ? '2.25rem' : size === 'lg' ? '1.75rem' : size === 'md' ? '1.35rem' : '1.1rem' }}>
              bet
            </span>
          </div>

          {/* VIP Badge */}
          {showVipBadge && (
            <span className={`font-black tracking-wider uppercase rounded-md bg-gradient-to-r from-amber-500/20 via-amber-400/20 to-amber-500/20 text-amber-300 border border-amber-400/40 shadow-sm shadow-amber-400/10 ${sizeStyles.vipBadge}`}>
              VIP
            </span>
          )}

          {/* Admin Badge */}
          {adminBadge}
        </div>

        {/* Subtitle */}
        {showSubtitle && (
          <div className={`text-gray-400 font-medium tracking-wide mt-0.5 ${sizeStyles.subtext}`}>
            {subtitleText}
          </div>
        )}
      </div>
    </div>
  );
};
