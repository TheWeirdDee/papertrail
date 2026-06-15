'use client';

import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: number;
  color?: string;
}

export default function BrandLogo({ className = '', size = 32 }: BrandLogoProps) {
  const h = Math.round(size * 1.2);
  return (
    <svg
      viewBox="0 0 100 120"
      width={size}
      height={h}
      className={className}
      aria-label="PaperTrail"
      role="img"
    >
      {/* P vertical stroke */}
      <rect x="18" y="5" width="16" height="110" rx="3" fill="white" />
      {/* P bowl */}
      <path
        d="M 34 21 Q 82 21 82 49 Q 82 77 34 77 L 34 61 Q 62 61 62 49 Q 62 37 34 37 Z"
        fill="white"
      />
      {/* Horizontal crossbar — teal cap */}
      <rect x="5" y="5" width="90" height="16" rx="3" fill="#22d3ee" />
export default function BrandLogo({ className = '', size = 32, color = 'white' }: BrandLogoProps) {
  const h = size;
  const w = Math.round(size * (100 / 120));

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 120"
      width={w}
      height={h}
      fill={color}
      className={className}
      aria-label="PaperTrail"
    >
      {/* Horizontal crossbar */}
      <rect x="5" y="5" width="90" height="16" rx="3" />
      {/* Vertical stroke */}
      <rect x="18" y="5" width="16" height="110" rx="3" />
      {/* P bowl */}
      <path d="M 34 21 Q 82 21 82 49 Q 82 77 34 77 L 34 61 Q 62 61 62 49 Q 62 37 34 37 Z" />
    </svg>
  );
}
