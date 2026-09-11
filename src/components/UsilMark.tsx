import React from 'react';

type UsilMarkProps = {
  className?: string;
  /** color = navy + action-blue tip (default). inverse = white on navy. mono = single currentColor */
  variant?: 'color' | 'inverse' | 'mono';
};

/**
 * Geometric و mark from the Usil brand construction grid.
 * 120-unit system · stroke 14 · ring r=24 · turn r=14 · tail ends at x=22.
 */
export function UsilMark({ className = 'w-9 h-9', variant = 'color' }: UsilMarkProps) {
  const navy = variant === 'inverse' ? '#FFFFFF' : variant === 'mono' ? 'currentColor' : '#0A1A33';
  const tip = variant === 'color' ? '#155EEF' : navy;

  return (
    <svg
      className={className}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Ring — complete circle */}
      <circle cx="68" cy="42" r="24" stroke={navy} strokeWidth="14" />
      {/* Path: vertical stem, quarter-turn, horizontal tail (navy) */}
      <path
        d="M68 66 V84 A14 14 0 0 1 54 98 H38"
        stroke={navy}
        strokeWidth="14"
        strokeLinecap="butt"
        strokeLinejoin="miter"
      />
      {/* Blue tip — arrival / action */}
      <path d="M38 98 H22" stroke={tip} strokeWidth="14" strokeLinecap="butt" />
    </svg>
  );
}
