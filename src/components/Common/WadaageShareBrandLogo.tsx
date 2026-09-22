import React from 'react';

interface WadaageShareBrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const WadaageShareBrandLogo: React.FC<WadaageShareBrandLogoProps> = ({
  className = '',
  size = 'md',
}) => {
  const heightClass = size === 'sm' ? 'h-9' : size === 'lg' ? 'h-14' : 'h-11';

  return (
    <div className={`inline-flex items-center space-x-2.5 select-none ${className}`}>
      {/* Colorful Wadaage Share Emblem SVG */}
      <div className={`${heightClass} aspect-square flex items-center justify-center shrink-0`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-contain"
        >
          {/* Outer 'W' Shape with 3 Color Bands: Green Left, Yellow Center-Bottom, Blue Right */}
          {/* Left Green Leg of 'W' */}
          <path
            d="M 16 30 C 16 48, 22 76, 36 84 C 38 85, 41 83, 42 80 L 48 54 C 49 50, 47 46, 44 44 C 38 39, 32 32, 28 24 C 26 20, 21 20, 18 24 C 16 26, 16 28, 16 30 Z"
            fill="#008751"
          />

          {/* Yellow Bottom Arch Connector */}
          <path
            d="M 33 82 C 42 88, 58 88, 67 82 C 69 80, 68 76, 65 74 L 56 68 C 53 66, 47 66, 44 68 L 35 74 C 32 76, 31 80, 33 82 Z"
            fill="#F59E0B"
          />

          {/* Right Blue Leg of 'W' */}
          <path
            d="M 84 30 C 84 48, 78 76, 64 84 C 62 85, 59 83, 58 80 L 52 54 C 51 50, 53 46, 56 44 C 62 39, 68 32, 72 24 C 74 20, 79 20, 82 24 C 84 26, 84 28, 84 30 Z"
            fill="#0066F5"
          />

          {/* Center Location Pin with Red Dome and White Indicator */}
          <g id="center-pin">
            {/* Red Pin Body */}
            <path
              d="M 50 12 C 41 12, 34 19, 34 28 C 34 39, 48 52, 50 54 C 52 52, 66 39, 66 28 C 66 19, 59 12, 50 12 Z"
              fill="#EF4444"
            />
            {/* White/Light Window Inside Pin with Two Passenger Silhouettes */}
            <circle cx="50" cy="27" r="11" fill="#FFFFFF" />

            {/* Left Passenger Head (Red) */}
            <circle cx="46" cy="24" r="3.2" fill="#EF4444" />
            <path
              d="M 40 33 C 40 29, 43 28, 46 28 C 49 28, 51 29, 51 33 Z"
              fill="#EF4444"
            />

            {/* Right Passenger Head (Cyan / Bright Blue) */}
            <circle cx="54" cy="24" r="3.2" fill="#06B6D4" />
            <path
              d="M 50 33 C 50 29, 52 28, 54 28 C 57 28, 60 29, 60 33 Z"
              fill="#06B6D4"
            />
          </g>

          {/* Steering Wheel / Car Front Arc Highlight */}
          <path
            d="M 38 48 C 45 42, 55 42, 62 48"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>

      {/* Brand Typography (Navy Wadaage + Electric Blue Share + Tagline) */}
      <div className="flex flex-col justify-center leading-none">
        {/* Top Line: Wadaage Share */}
        <div className="flex items-center space-x-1.5">
          <span className="font-extrabold text-[#0a2540] tracking-tight text-lg leading-tight font-sans">
            Wadaage
          </span>
          <div className="flex items-center space-x-1">
            <span className="font-black text-[#0066f5] tracking-tight text-lg leading-tight font-sans">
              Share
            </span>
            <span className="w-2.5 h-0.5 bg-[#0066f5] rounded-full inline-block mb-0.5" />
          </div>
        </div>

        {/* Bottom Line: Somali Tagline */}
        <span className="text-[10px] font-bold text-[#0066f5] tracking-tight mt-0.5 font-sans">
          Safar wadaag, nolol wadaag.
        </span>
      </div>
    </div>
  );
};
