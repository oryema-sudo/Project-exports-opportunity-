import React from 'react';

interface AstroKahawaIconProps {
  className?: string;
  size?: number;
  variant?: 'dark' | 'light' | 'emerald' | 'mono';
  showBackground?: boolean;
}

/**
 * ASTROKAHAWA Official Master Icon (Text-Free)
 * Combines:
 * 1. Coffee Bean (organic split silhouette)
 * 2. Origin / Geolocation (coordinate pin / geo-anchor node)
 * 3. Technology / ASTRO identity (orbital data trajectory arc)
 */
export const AstroKahawaIcon: React.FC<AstroKahawaIconProps> = ({
  className = '',
  size = 32,
  variant = 'emerald',
  showBackground = false,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-label="ASTROKAHAWA Icon"
      role="img"
    >
      <defs>
        {/* Emerald Glow Gradient */}
        <linearGradient id="ak-emerald-grad" x1="15" y1="15" x2="85" y2="85" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="50%" stopColor="#059669" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>

        {/* Coffee Earth Gradient */}
        <linearGradient id="ak-bean-grad" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#064E3B" />
        </linearGradient>

        {/* Gold Orbit Highlight */}
        <linearGradient id="ak-orbit-grad" x1="10" y1="90" x2="90" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>

        <filter id="ak-soft-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Optional Background Rounded Container */}
      {showBackground && (
        <rect
          x="2"
          y="2"
          width="96"
          height="96"
          rx="22"
          fill="#0C1310"
          stroke="#1F2E26"
          strokeWidth="2"
        />
      )}

      {/* Group scaled for safe margins */}
      <g transform="translate(4, 4) scale(0.92)" filter="url(#ak-soft-shadow)">
        {/* 1. Technology / ASTRO Orbital Trajectory Arc */}
        <path
          d="M 16 76 C 8 50, 24 18, 56 12 C 78 8, 92 24, 88 44 C 85 58, 72 74, 52 82 C 38 88, 22 84, 16 76"
          fill="none"
          stroke="url(#ak-orbit-grad)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="140 10"
          className="opacity-90"
        />

        {/* 2. Coffee Bean Silhouette (Left Lobe with Geolocation Taper) */}
        <path
          d="M 48 20 C 32 20, 22 34, 23 50 C 24 64, 34 76, 48 80 C 47 70, 43 58, 38 48 C 34 40, 36 30, 48 20 Z"
          fill="url(#ak-bean-grad)"
        />

        {/* 3. Coffee Bean Silhouette (Right Lobe with Upward Trajectory) */}
        <path
          d="M 52 20 C 64 20, 77 32, 77 48 C 77 64, 66 78, 52 80 C 53 70, 57 58, 62 48 C 66 40, 64 30, 52 20 Z"
          fill="url(#ak-emerald-grad)"
        />

        {/* 4. The S-Curve Bean Crease (Origin Meridian Line) */}
        <path
          d="M 50 19 Q 36 48 50 50 Q 64 52 50 81"
          fill="none"
          stroke={showBackground ? "#0C1310" : "#0A0F0D"}
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* 5. Origin Geolocation Core Point (GPS Node) */}
        <circle cx="50" cy="50" r="4.5" fill="#F59E0B" stroke="#0C1310" strokeWidth="2" />

        {/* 6. Orbital Satellite / Export Evidence Node */}
        <circle cx="84" cy="28" r="4" fill="#34D399" />
        <circle cx="84" cy="28" r="6.5" stroke="#10B981" strokeWidth="1.5" strokeDasharray="3 2" className="animate-spin origin-[84px_28px]" />
      </g>
    </svg>
  );
};

interface AstroKahawaLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark';
  showTagline?: boolean;
  taglinePosition?: 'bottom' | 'side';
  iconSize?: number;
}

/**
 * ASTROKAHAWA Master Full Logo
 * [ICON] ASTROKAHAWA
 * Tagline: "From origin to export, with evidence."
 */
export const AstroKahawaLogo: React.FC<AstroKahawaLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'dark',
  showTagline = true,
  taglinePosition = 'bottom',
  iconSize,
}) => {
  // Size calculations
  const iconPixel = iconSize || (size === 'sm' ? 28 : size === 'md' ? 36 : size === 'lg' ? 44 : 56);
  const textClass = size === 'sm' ? 'text-base' : size === 'md' ? 'text-lg sm:text-xl' : size === 'lg' ? 'text-2xl' : 'text-3xl';
  const taglineClass = size === 'sm' ? 'text-[10px]' : size === 'md' ? 'text-[11px]' : 'text-xs';

  const isDark = variant === 'dark';

  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 group select-none ${className}`}>
      {/* Brand Icon */}
      <AstroKahawaIcon size={iconPixel} showBackground={false} />

      {/* Typography */}
      <div className="flex flex-col leading-tight min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-black tracking-tight ${textClass} ${isDark ? 'text-stone-100' : 'text-stone-900'} font-sans uppercase`}>
            ASTRO<span className="text-emerald-500 font-extrabold">KAHAWA</span>
          </span>
          <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-700/40 uppercase tracking-widest hidden xs:inline-block">
            OS
          </span>
        </div>

        {showTagline && (
          <span className={`font-medium tracking-normal ${taglineClass} ${isDark ? 'text-stone-400' : 'text-stone-600'} truncate`}>
            From origin to export, with evidence.
          </span>
        )}
      </div>
    </div>
  );
};
