/**
 * Juvay wordmark. The file at /juvay-logo.png is a leftover TriniBuild mark;
 * this SVG is the on-page brand. currentColor so it follows the nav theme.
 */
import React from 'react';

type Props = {
  className?: string;
  /** 'auto' follows currentColor; 'onDark' is white with a gold J-accent. */
  variant?: 'auto' | 'onDark' | 'onLight';
};

export const JuvayLogo: React.FC<Props> = ({ className = 'h-8 w-auto', variant = 'auto' }) => {
  const fill = variant === 'onDark' ? '#FFF8F0' : variant === 'onLight' ? '#0B1F24' : 'currentColor';
  const accent = variant === 'onLight' ? '#CE1126' : '#F5C14A';
  return (
    <svg
      className={className}
      viewBox="0 0 200 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Juvay"
    >
      <title>Juvay</title>
      {/* Mango-gold island arc under the word */}
      <path
        d="M8 40c18 8 50 9 92 4 36-4 68-4 92 2"
        stroke={accent}
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
      <text
        x="4"
        y="34"
        fill={fill}
        fontFamily="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
        fontWeight="800"
        fontSize="36"
        letterSpacing="-1.2"
      >
        Juvay
      </text>
      {/* Accent bar on the J stem — reads as a brand tick, not a second logo */}
      <rect x="8.5" y="8" width="5.5" height="5.5" rx="1.2" fill={accent} />
    </svg>
  );
};

export default JuvayLogo;
