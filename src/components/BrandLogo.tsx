'use client';

import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: number;
}

export default function BrandLogo({ className = '', size = 32 }: BrandLogoProps) {
  return (
    <div className={`flex items-center -space-x-1.5 ${className}`}>
      {/* Stylized P - Geometric vertical stroke + arc bowl */}
      <div style={{ width: size, height: size }} className="relative flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-white" style={{ strokeWidth: 16, strokeLinecap: 'round' }}>
          {/* Vertical stroke of P */}
          <path d="M 25 10 L 25 90" />
          {/* P bowl arc — sweeps right from top to mid */}
          <path d="M 25 10 A 30 23 0 0 1 25 55" />
        </svg>
      </div>

      {/* Stylized T — Cellular / Network Dots */}
      <div style={{ width: size * 1.2, height: size }} className="relative z-10 flex items-center justify-center">
        <svg viewBox="0 0 120 100" className="w-full h-full" style={{ opacity: 0.8 }}>
          {/* Top-left node */}
          <circle cx="10" cy="20" r="10" fill="#22d3ee" />

          {/* Horizontal crossbar */}
          <rect x="10" y="14" width="100" height="12" rx="6" fill="#22d3ee" />

          {/* Top-right node */}
          <circle cx="110" cy="20" r="10" fill="#22d3ee" />

          {/* Vertical downstroke */}
          <rect x="54" y="20" width="12" height="55" rx="6" fill="#22d3ee" />

          {/* Bottom node */}
          <circle cx="60" cy="80" r="10" fill="#22d3ee" />
        </svg>
      </div>
    </div>
  );
}
