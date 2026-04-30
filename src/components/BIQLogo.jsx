import React from 'react';

/**
 * BIQLogo — inline SVG logo for BusinessIQ
 * Props:
 *   size   — number (default 40) controls width & height
 *   className — extra tailwind / css classes
 */
export default function BIQLogo({ size = 40, className = '' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      aria-label="BusinessIQ logo"
    >
      <defs>
        <linearGradient id="biq-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#0f172a" />
          <stop offset="50%"  stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#312e81" />
        </linearGradient>

        <linearGradient id="biq-text" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#93c5fd" />
          <stop offset="40%"  stopColor="#ffffff" />
          <stop offset="100%" stopColor="#a5b4fc" />
        </linearGradient>

        <linearGradient id="biq-ring" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#3b82f6" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.2" />
        </linearGradient>

        <filter id="biq-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="biq-shadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="3" stdDeviation="4"
            floodColor="#0f172a" floodOpacity="0.5" />
        </filter>
      </defs>

      {/* Background */}
      <rect width="120" height="120" rx="28" ry="28"
        fill="url(#biq-bg)" filter="url(#biq-shadow)" />

      {/* Corner glows */}
      <circle cx="0"   cy="0"   r="40" fill="#3b82f6" opacity="0.08" />
      <circle cx="120" cy="120" r="40" fill="#6366f1" opacity="0.10" />

      {/* Dot accents */}
      <circle cx="22" cy="22" r="1.2" fill="#60a5fa" opacity="0.25" />
      <circle cx="40" cy="22" r="1.2" fill="#60a5fa" opacity="0.15" />
      <circle cx="22" cy="40" r="1.2" fill="#60a5fa" opacity="0.15" />
      <circle cx="98" cy="98" r="1.2" fill="#818cf8" opacity="0.25" />
      <circle cx="80" cy="98" r="1.2" fill="#818cf8" opacity="0.15" />
      <circle cx="98" cy="80" r="1.2" fill="#818cf8" opacity="0.15" />

      {/* Inner border ring */}
      <rect x="8" y="8" width="104" height="104" rx="22" ry="22"
        fill="none" stroke="url(#biq-ring)" strokeWidth="1.2" />

      {/* Top accent line */}
      <line x1="30" y1="8" x2="90" y2="8"
        stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" opacity="0.4" />

      {/* BIQ letters */}
      <text
        x="60" y="76"
        textAnchor="middle"
        fontFamily="'Segoe UI', 'Inter', 'Arial Black', sans-serif"
        fontSize="46"
        fontWeight="900"
        letterSpacing="-1"
        fill="url(#biq-text)"
        filter="url(#biq-glow)"
      >
        BIQ
      </text>

      {/* Underline bar */}
      <rect x="28" y="84" width="64" height="3.5" rx="2"
        fill="url(#biq-text)" opacity="0.55" />

      {/* Tagline */}
      <text
        x="60" y="100"
        textAnchor="middle"
        fontFamily="'Segoe UI', 'Inter', Arial, sans-serif"
        fontSize="8.5"
        fontWeight="500"
        letterSpacing="3"
        fill="#93c5fd"
        opacity="0.75"
      >
        BUSINESS IQ
      </text>
    </svg>
  );
}
