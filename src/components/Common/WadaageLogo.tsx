import React from 'react';

export interface WadaageLogoProps {
  variant?: 'badge' | 'icon' | 'wordmark' | 'full' | 'header';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'custom';
  className?: string;
  theme?: 'dark' | 'light' | 'transparent';
  colorMode?: 'white' | 'dark' | 'auto';
  showTagline?: boolean;
  appType?: 'rider' | 'driver' | 'admin';
  useImage?: boolean;
}

export const WadaageLogo: React.FC<WadaageLogoProps> = ({
  variant = 'badge',
  size = 'md',
  className = '',
  theme = 'transparent',
  colorMode = 'white',
  showTagline = false,
  appType = 'rider',
  useImage = true,
}) => {
  // Size mapping
  const dimensionClasses: Record<string, { badge: string; wordmark: string; icon: string }> = {
    xs: { badge: 'w-8 h-8', wordmark: 'h-6', icon: 'w-7 h-7' },
    sm: { badge: 'w-11 h-11', wordmark: 'h-8', icon: 'w-9 h-9' },
    md: { badge: 'w-20 h-20', wordmark: 'h-10', icon: 'w-12 h-12' },
    lg: { badge: 'w-32 h-32', wordmark: 'h-14', icon: 'w-16 h-16' },
    xl: { badge: 'w-44 h-44', wordmark: 'h-20', icon: 'w-24 h-24' },
    '2xl': { badge: 'w-60 h-60', wordmark: 'h-28', icon: 'w-36 h-36' },
    custom: { badge: 'w-full h-full', wordmark: 'w-full h-full', icon: 'w-full h-full' },
  };

  const strokeColor = colorMode === 'dark' ? '#0F172A' : '#FFFFFF';
  const currentDim = dimensionClasses[size] || dimensionClasses.md;

  const isDriver = appType === 'driver';
  const logoImgSrc = isDriver ? '/darwelllogo.png' : '/riderlogo.png';
  const fallbackImgSrc = isDriver ? '/darwelllogo.jpg' : '/riderlogo.jpg';

  // 1. Full Circular Badge (Uses high-resolution distinctive Rider / Driver logo image)
  const renderBadgeSVG = () => {
    if (useImage) {
      return (
        <div className={`flex flex-col items-center justify-center ${className}`}>
          <div className={`relative ${currentDim.badge} rounded-full overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.6)] ring-2 ring-emerald-400/40 p-0.5 bg-gradient-to-tr from-[#00E575] via-[#00B4D8] to-[#0066FF]`}>
            <img
              src={logoImgSrc}
              alt={isDriver ? 'Wadaage Darawell' : 'Wadaage Share'}
              className="w-full h-full object-cover rounded-full select-none"
              onError={(e) => {
                (e.target as HTMLImageElement).src = fallbackImgSrc;
              }}
            />
          </div>
          {showTagline && (
            <span className="mt-2 text-xs font-bold tracking-wide text-emerald-400 font-mono uppercase">
              {isDriver ? 'Darawell Fleet' : 'Share the ride. Save more.'}
            </span>
          )}
        </div>
      );
    }
    return (
    <div className="flex flex-col items-center justify-center">
      <div className={`relative ${currentDim.badge} flex items-center justify-center`}>
        <svg
          viewBox="0 0 320 320"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)] overflow-visible"
        >
          <defs>
            {/* Deep Navy/Black Background */}
            <radialGradient id="badgeBgGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0a1e38" />
              <stop offset="65%" stopColor="#040e1c" />
              <stop offset="100%" stopColor="#020710" />
            </radialGradient>

            {/* Split Halo Ring: Lime Green to Electric Cyan/Blue */}
            <linearGradient id="orbitGreenBlue" x1="15%" y1="15%" x2="85%" y2="85%">
              <stop offset="0%" stopColor="#A3E635" />
              <stop offset="35%" stopColor="#00E676" />
              <stop offset="70%" stopColor="#00B4D8" />
              <stop offset="100%" stopColor="#0077B6" />
            </linearGradient>

            <linearGradient id="neonBlueRing" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00E676" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#00B4D8" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#0066FF" stopOpacity="0.95" />
            </linearGradient>

            {/* Lime Pin Gradient */}
            <linearGradient id="limePinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#A3E635" />
              <stop offset="60%" stopColor="#00E676" />
              <stop offset="100%" stopColor="#00C853" />
            </linearGradient>

            {/* Ambient Glow Filters */}
            <filter id="neonPinGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#00E676" floodOpacity="0.75" />
            </filter>

            <filter id="blueRingGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#00B4D8" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* BASE DARK CIRCULAR CANVAS */}
          <circle cx="160" cy="160" r="150" fill="url(#badgeBgGrad)" />

          {/* 1. OUTER DUAL GLOWING HALO RINGS (Green + Blue Orbit) */}
          <g filter="url(#blueRingGlow)">
            {/* Outer Multi-Color Neon Ring */}
            <circle
              cx="160"
              cy="160"
              r="142"
              stroke="url(#orbitGreenBlue)"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Inner Concentric Thin Neon Blue Ring */}
            <circle
              cx="160"
              cy="160"
              r="130"
              stroke="url(#neonBlueRing)"
              strokeWidth="2.5"
              strokeDasharray="14 4 180 8"
              fill="none"
            />
          </g>

          {/* 2. TOP ROOF LIME GREEN MAP PIN */}
          <g filter="url(#neonPinGlow)">
            <path
              d="M 160 38 C 148 38 138 48 138 60 C 138 74 160 94 160 94 C 160 94 182 74 182 60 C 182 48 172 38 160 38 Z"
              fill="url(#limePinGrad)"
            />
            <circle cx="160" cy="58" r="7.5" fill="#040e1c" />
          </g>

          {/* 3. WHITE CAR OUTLINE & 3 PASSENGER COMMUTERS */}
          <g id="car-and-passengers">
            {/* Car Outer Frame */}
            <path
              d="M 108 116 C 114 94 126 82 142 80 L 178 80 C 194 82 206 94 212 116 C 218 119 226 123 226 131 C 226 138 220 142 216 143 L 216 156 C 216 160 212 163 207 163 L 200 163 C 196 163 193 160 193 156 L 193 154 C 172 156 148 156 127 154 L 127 156 C 127 160 124 163 120 163 L 113 163 C 108 163 104 160 104 156 L 104 143 C 100 142 94 138 94 131 C 94 123 102 119 108 116 Z"
              stroke="#FFFFFF"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="#06162d"
            />

            {/* Windshield */}
            <path
              d="M 120 118 C 124 96 133 89 145 88 L 175 88 C 187 89 196 96 200 118 Z"
              stroke="#FFFFFF"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="#0a1f3c"
            />

            {/* 3 Passenger Silhouettes (Center Driver + 2 Companions) */}
            <circle cx="132" cy="107" r="7" fill="#FFFFFF" />
            <path d="M 121 123 C 121 116 126 113 132 113 C 138 113 143 116 143 123 Z" fill="#FFFFFF" />

            <circle cx="160" cy="103" r="9" fill="#FFFFFF" />
            <path d="M 146 124 C 146 115 152 111 160 111 C 168 111 174 115 174 124 Z" fill="#FFFFFF" />

            <circle cx="188" cy="107" r="7" fill="#FFFFFF" />
            <path d="M 177 123 C 177 116 182 113 188 113 C 194 113 199 116 199 123 Z" fill="#FFFFFF" />

            {/* Headlights (Glowing Sleek Angles) */}
            <path d="M 104 136 C 110 137 116 141 118 145" stroke="#00E676" strokeWidth="4" strokeLinecap="round" />
            <path d="M 216 136 C 210 137 204 141 202 145" stroke="#00E676" strokeWidth="4" strokeLinecap="round" />

            {/* Front Bumper & Grille Accent */}
            <path d="M 142 145 L 178 145" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
          </g>

          {/* 4. UNDER-CAR HORIZON ARCH (Leading into Wordmark) */}
          <path
            d="M 64 178 C 115 162, 205 162, 256 178"
            stroke="#FFFFFF"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* 5. 'wadaage' CLEAN DOUBLE-TRACK TYPOGRAPHY (Prominently Centered) */}
          <g transform="translate(14, 150) scale(0.65)">
            {/* Lower Left Green Map Pin (on 'W') */}
            <g filter="url(#neonPinGlow)">
              <path
                d="M 52 10 C 40 10 30 20 30 32 C 30 46 52 66 52 66 C 52 66 74 46 74 32 C 74 20 64 10 52 10 Z"
                fill="url(#limePinGrad)"
              />
              <circle cx="52" cy="30" r="7.5" fill="#040e1c" />
            </g>

            {/* Double Track Letters in Crisp White */}
            <g stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none">
              {/* LETTER 'W' */}
              <path d="M 16 38 L 38 106 L 63 50 L 88 106 L 110 38" />
              <path d="M 27 40 L 43 90 L 63 60 L 83 90 L 99 40" strokeWidth="2.5" />

              {/* LETTER 'a' (1st) */}
              <circle cx="138" cy="78" r="22" />
              <path d="M 160 56 L 160 100 C 160 102 163 103 165 103" />
              <circle cx="138" cy="78" r="14" strokeWidth="2.5" />

              {/* LETTER 'd' */}
              <circle cx="198" cy="78" r="22" />
              <path d="M 220 26 L 220 100 C 220 102 223 103 225 103" />
              <circle cx="198" cy="78" r="14" strokeWidth="2.5" />

              {/* LETTER 'a' (2nd) */}
              <circle cx="258" cy="78" r="22" />
              <path d="M 280 56 L 280 100 C 280 102 283 103 285 103" />
              <circle cx="258" cy="78" r="14" strokeWidth="2.5" />

              {/* LETTER 'a' (3rd) */}
              <circle cx="318" cy="78" r="22" />
              <path d="M 340 56 L 340 100 C 340 102 343 103 345 103" />
              <circle cx="318" cy="78" r="14" strokeWidth="2.5" />

              {/* LETTER 'g' */}
              <circle cx="376" cy="78" r="21" />
              <path d="M 397 57 L 397 101 C 397 118 375 122 360 116" />
              <circle cx="376" cy="78" r="13" strokeWidth="2.5" />

              {/* LETTER 'e' */}
              <path d="M 456 82 C 456 62 441 54 424 54 C 404 54 391 67 391 80 C 391 96 404 104 424 104 C 439 104 450 97 454 90" />
            </g>

            {/* Two Green Speed Bars in 'e' */}
            <line x1="409" y1="75" x2="458" y2="75" stroke="#00E676" strokeWidth="5.5" strokeLinecap="round" />
            <line x1="409" y1="84" x2="458" y2="84" stroke="#00E676" strokeWidth="5.5" strokeLinecap="round" />
          </g>

          {/* 6. BOTTOM SUBTLE NEON ACCENT ARC */}
          <path
            d="M 100 262 C 135 272, 185 272, 220 262"
            stroke="url(#orbitGreenBlue)"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>
    </div>
  );
};

  // 2. Icon-Only Variant (Round Badge for Mobile Header, App Icons, Favicon)
  if (variant === 'icon') {
    if (useImage) {
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${currentDim.icon} ${className}`}>
          <div className="w-full h-full rounded-full overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.5)] ring-1.5 ring-[#00E575]/50 p-0.5 bg-gradient-to-tr from-[#00E575] via-[#00B4D8] to-[#0066FF]">
            <img
              src={logoImgSrc}
              alt={isDriver ? 'Darawell' : 'Wadaage'}
              className="w-full h-full object-cover rounded-full select-none"
              onError={(e) => {
                (e.target as HTMLImageElement).src = fallbackImgSrc;
              }}
            />
          </div>
        </div>
      );
    }
    return (
      <div className={`relative inline-flex items-center justify-center shrink-0 ${currentDim.icon} ${className}`}>
        <svg
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_2px_10px_rgba(0,230,118,0.4)]"
        >
          <defs>
            <radialGradient id="iconBadgeBg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0a1e38" />
              <stop offset="100%" stopColor="#030b17" />
            </radialGradient>
            <linearGradient id="iconOrbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#A3E635" />
              <stop offset="40%" stopColor="#00E676" />
              <stop offset="80%" stopColor="#00B4D8" />
              <stop offset="100%" stopColor="#0077B6" />
            </linearGradient>
          </defs>

          {/* Deep Round Canvas */}
          <circle cx="100" cy="100" r="96" fill="url(#iconBadgeBg)" />
          {/* Glowing Green to Blue Outer Orbit */}
          <circle cx="100" cy="100" r="88" stroke="url(#iconOrbitGrad)" strokeWidth="4.5" fill="none" />

          {/* Top Pin on Car */}
          <path
            d="M 100 22 C 92 22 86 28 86 36 C 86 45 100 58 100 58 C 100 58 114 45 114 36 C 114 28 108 22 100 22 Z"
            fill="#00E676"
          />
          <circle cx="100" cy="35" r="4.5" fill="#030b17" />

          {/* Car & 3 Commuters */}
          <path
            d="M 68 74 C 72 59 80 52 90 51 L 110 51 C 120 52 128 59 132 74 C 136 76 141 79 141 84 C 141 88 137 91 135 92 L 135 100 L 122 100 L 122 98 C 108 99 92 99 78 98 L 78 100 L 65 100 L 65 92 C 63 91 59 88 59 84 C 59 79 64 76 68 74 Z"
            stroke="#FFFFFF"
            strokeWidth="3"
            fill="#08182f"
          />
          {/* 3 Avatars inside car */}
          <circle cx="82" cy="68" r="4.5" fill="#FFFFFF" />
          <circle cx="100" cy="65" r="5.5" fill="#FFFFFF" />
          <circle cx="118" cy="68" r="4.5" fill="#FFFFFF" />

          {/* Wadaage 'W' with Pin & Letters */}
          <g transform="translate(18, 105) scale(0.36)">
            {/* Pin on 'W' */}
            <path
              d="M 52 10 C 40 10 30 20 30 32 C 30 46 52 66 52 66 C 52 66 74 46 74 32 C 74 20 64 10 52 10 Z"
              fill="#00E676"
            />
            <circle cx="52" cy="30" r="7.5" fill="#030b17" />

            <g stroke="#FFFFFF" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
              <path d="M 16 38 L 38 106 L 63 50 L 88 106 L 110 38" />
              <circle cx="138" cy="78" r="22" />
              <path d="M 160 56 L 160 100" />
              <circle cx="198" cy="78" r="22" />
              <path d="M 220 26 L 220 100" />
              <circle cx="258" cy="78" r="22" />
              <path d="M 280 56 L 280 100" />
              <circle cx="318" cy="78" r="22" />
              <path d="M 340 56 L 340 100" />
              <circle cx="376" cy="78" r="21" />
              <path d="M 397 57 L 397 101 C 397 118 375 122 360 116" />
              <path d="M 456 82 C 456 62 441 54 424 54 C 404 54 391 67 391 80 C 391 96 404 104 424 104" />
            </g>
            <line x1="409" y1="75" x2="458" y2="75" stroke="#00E676" strokeWidth="6" strokeLinecap="round" />
            <line x1="409" y1="84" x2="458" y2="84" stroke="#00E676" strokeWidth="6" strokeLinecap="round" />
          </g>
        </svg>
      </div>
    );
  }

  // 3. Full Display Mode (Clean Badge only)
  if (variant === 'full' || variant === 'badge') {
    return (
      <div className={`inline-flex flex-col items-center justify-center ${className}`}>
        {renderBadgeSVG()}
      </div>
    );
  }

  // 4. Wordmark / Header Bar Mode (Horizontal Clean Layout for Phone Headers)
  return (
    <div
      className={`inline-flex items-center space-x-2 select-none ${
        theme === 'dark'
          ? 'bg-[#08162b] px-3 py-1.5 rounded-2xl border border-slate-800 shadow-lg'
          : theme === 'light'
          ? 'bg-white px-3 py-1.5 rounded-2xl border border-slate-200 shadow-sm'
          : ''
      } ${className}`}
    >
      <div className={`relative ${currentDim.wordmark} w-auto flex items-center`}>
        <svg
          viewBox="0 0 450 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-auto max-w-full drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)] overflow-visible"
        >
          <defs>
            <filter id="wPinGlowHeader" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#00E676" floodOpacity="0.6" />
            </filter>
            <linearGradient id="neonGreenPinHeader" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#A3E635" />
              <stop offset="60%" stopColor="#00E676" />
              <stop offset="100%" stopColor="#00C853" />
            </linearGradient>
            <linearGradient id="wArchGradHeader" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.1" />
              <stop offset="20%" stopColor={strokeColor} stopOpacity="0.95" />
              <stop offset="50%" stopColor={strokeColor} stopOpacity="1" />
              <stop offset="80%" stopColor={strokeColor} stopOpacity="0.95" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Top Arch */}
          <path
            d="M 95 24 C 175 4, 285 4, 385 24"
            stroke="url(#wArchGradHeader)"
            strokeWidth="3.2"
            strokeLinecap="round"
            fill="none"
          />

          {/* Lime Green Pin on 'W' */}
          <g filter="url(#wPinGlowHeader)">
            <path
              d="M 48 5 C 37 5 28 14 28 25 C 28 37 48 56 48 56 C 48 56 68 37 68 25 C 68 14 59 5 48 5 Z"
              fill="url(#neonGreenPinHeader)"
            />
            <circle cx="48" cy="24" r="6.8" fill="#06172E" />
          </g>

          {/* Double Track Letters */}
          <g
            stroke={strokeColor}
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          >
            {/* 'W' */}
            <path d="M 12 34 L 33 96 L 56 46 L 79 96 L 100 34" />
            <path d="M 22 34 L 37 83 L 56 56 L 75 83 L 90 34" />

            {/* 'a' (1) */}
            <circle cx="127" cy="72" r="21" />
            <path d="M 148 51 L 148 93 C 148 95 151 96 153 96" />
            <circle cx="127" cy="72" r="13" />

            {/* 'd' */}
            <circle cx="184" cy="72" r="21" />
            <path d="M 205 22 L 205 93 C 205 95 208 96 210 96" />
            <circle cx="184" cy="72" r="13" />

            {/* 'a' (2) */}
            <circle cx="241" cy="72" r="21" />
            <path d="M 262 51 L 262 93 C 262 95 265 96 267 96" />
            <circle cx="241" cy="72" r="13" />

            {/* 'a' (3) */}
            <circle cx="298" cy="72" r="21" />
            <path d="M 319 51 L 319 93 C 319 95 322 96 324 96" />
            <circle cx="298" cy="72" r="13" />

            {/* 'g' */}
            <circle cx="354" cy="72" r="20" />
            <path d="M 374 52 L 374 94 C 374 110 354 114 340 108" />
            <circle cx="354" cy="72" r="12" />

            {/* 'e' */}
            <path d="M 432 76 C 432 58 418 51 402 51 C 384 51 372 63 372 75 C 372 89 384 96 402 96 C 416 96 426 90 430 84" />
            <path d="M 422 76 C 422 66 414 60 402 60 C 392 60 382 68 382 75 C 382 83 392 88 402 88 C 412 88 418 84 420 80" />
          </g>

          {/* Lime Speed Bars inside 'e' */}
          <line x1="388" y1="69" x2="436" y2="69" stroke="#00E676" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="388" y1="77" x2="436" y2="77" stroke="#00E676" strokeWidth="4.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
};
