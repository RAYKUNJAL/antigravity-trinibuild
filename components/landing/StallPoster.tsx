/**
 * Immediate first-paint stall illustration. No network image.
 * Also the prefers-reduced-motion, no-WebGL and low-power fallback.
 * Labeled illustrative.
 */
import React from 'react';

type Props = {
  className?: string;
  tiltX?: number;
  tiltY?: number;
};

export const StallPoster: React.FC<Props> = ({ className = '', tiltX = 0, tiltY = 0 }) => {
  const rotate = `rotateX(${(-tiltY * 6).toFixed(2)}deg) rotateY(${(tiltX * 8).toFixed(2)}deg)`;
  return (
    <div
      className={`relative h-full w-full overflow-hidden ${className}`}
      style={{ background: 'linear-gradient(180deg, #0c2c38 0%, #1b5a6b 38%, #e08a4a 58%, #f3c78a 74%, #f6e6c8 100%)' }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 800 900"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        style={{ transform: rotate, transformOrigin: '50% 55%', transition: 'transform 80ms linear' }}
      >
        <defs>
          <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0d6e72" />
            <stop offset="1" stopColor="#0a4c54" />
          </linearGradient>
          <linearGradient id="sand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f0dfb8" />
            <stop offset="1" stopColor="#e0c894" />
          </linearGradient>
          <linearGradient id="sun" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffe08a" />
            <stop offset="1" stopColor="#e08a4a" />
          </linearGradient>
          <linearGradient id="roof" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#5a2e16" />
            <stop offset="1" stopColor="#3d2414" />
          </linearGradient>
        </defs>
        {/* sun */}
        <circle cx="620" cy="250" r="78" fill="url(#sun)" opacity="0.95" />
        {/* distant hills */}
        <ellipse cx="120" cy="430" rx="160" ry="70" fill="#1a4d3e" />
        <ellipse cx="680" cy="425" rx="180" ry="85" fill="#163f34" />
        <ellipse cx="400" cy="445" rx="120" ry="50" fill="#1f5a46" />
        {/* sea */}
        <path d="M-20 470 Q200 450 400 475 T820 465 L820 560 L-20 560 Z" fill="url(#sea)" />
        <path d="M-20 500 Q250 485 500 505 T820 495" fill="none" stroke="#7ec8c4" strokeWidth="3" opacity="0.35" />
        {/* sand */}
        <path d="M-20 540 Q200 500 420 530 T820 520 L820 940 L-20 940 Z" fill="url(#sand)" />
        {/* palms */}
        <g transform="translate(90 500)">
          <rect x="-6" y="0" width="12" height="150" rx="5" fill="#6b3f1f" />
          <g fill="#1f6b3a">
            <ellipse cx="0" cy="-10" rx="18" ry="55" transform="rotate(-20)" />
            <ellipse cx="0" cy="-10" rx="16" ry="50" transform="rotate(25)" />
            <ellipse cx="0" cy="-10" rx="14" ry="48" transform="rotate(-70)" />
            <ellipse cx="0" cy="-10" rx="14" ry="48" transform="rotate(80)" />
            <ellipse cx="0" cy="-10" rx="12" ry="42" transform="rotate(150)" />
          </g>
        </g>
        <g transform="translate(710 530)">
          <rect x="-5" y="0" width="10" height="120" rx="4" fill="#6b3f1f" />
          <g fill="#226e3e">
            <ellipse cx="0" cy="-8" rx="14" ry="46" transform="rotate(-30)" />
            <ellipse cx="0" cy="-8" rx="14" ry="44" transform="rotate(20)" />
            <ellipse cx="0" cy="-8" rx="12" ry="40" transform="rotate(90)" />
            <ellipse cx="0" cy="-8" rx="12" ry="40" transform="rotate(-100)" />
          </g>
        </g>
        {/* stall */}
        <g transform="translate(400 430)">
          {/* posts */}
          <rect x="-150" y="40" width="18" height="230" rx="4" fill="#6b3f1f" />
          <rect x="132" y="40" width="18" height="230" rx="4" fill="#6b3f1f" />
          <rect x="-150" y="40" width="18" height="200" rx="4" fill="#5a3318" opacity="0.5" transform="translate(-40 10)" />
          <rect x="132" y="40" width="18" height="200" rx="4" fill="#5a3318" opacity="0.5" transform="translate(40 10)" />
          {/* roof */}
          <polygon points="-220,60 0,-50 220,60 200,80 0,-20 -200,80" fill="url(#roof)" />
          <polygon points="-200,80 0,-20 200,80 180,95 0,5 -180,95" fill="#4a2a16" />
          {/* awning */}
          <g transform="translate(0 90)">
            <rect x="-180" y="0" width="60" height="36" fill="#f5c14a" />
            <rect x="-120" y="0" width="60" height="36" fill="#fff4dc" />
            <rect x="-60" y="0" width="60" height="36" fill="#0d9488" />
            <rect x="0" y="0" width="60" height="36" fill="#f5c14a" />
            <rect x="60" y="0" width="60" height="36" fill="#fff4dc" />
            <rect x="120" y="0" width="60" height="36" fill="#ce1126" />
            <path d="M-180 36 Q-150 52 -120 36 T-60 36 T0 36 T60 36 T120 36 T180 36" fill="none" stroke="#3d2414" strokeWidth="0" />
            <path d="M-180 36 C-165 54 -135 54 -120 36" fill="#f5c14a" />
            <path d="M-120 36 C-105 54 -75 54 -60 36" fill="#fff4dc" />
            <path d="M-60 36 C-45 54 -15 54 0 36" fill="#0d9488" />
            <path d="M0 36 C15 54 45 54 60 36" fill="#f5c14a" />
            <path d="M60 36 C75 54 105 54 120 36" fill="#fff4dc" />
            <path d="M120 36 C135 54 165 54 180 36" fill="#ce1126" />
          </g>
          {/* OPEN sign */}
          <g transform="translate(0 145)">
            <rect x="-54" y="-18" width="108" height="36" rx="6" fill="#0d9488" />
            <text x="0" y="8" textAnchor="middle" fill="#fff8f0" fontFamily="system-ui,sans-serif" fontWeight="700" fontSize="22">
              OPEN
            </text>
          </g>
          {/* counter */}
          <rect x="-190" y="230" width="380" height="28" rx="4" fill="#6b3f1f" />
          <rect x="-190" y="258" width="380" height="80" fill="#3d2414" />
          {/* products */}
          <g transform="translate(-130 200)">
            <rect width="54" height="32" rx="3" fill="#8a5a2b" />
            <rect x="8" y="-18" width="38" height="22" rx="3" fill="#f5c14a" />
          </g>
          <g transform="translate(-60 200)">
            <rect width="54" height="32" rx="3" fill="#8a5a2b" />
            <rect x="8" y="-18" width="38" height="22" rx="3" fill="#ce1126" />
          </g>
          <g transform="translate(10 200)">
            <rect width="54" height="32" rx="3" fill="#8a5a2b" />
            <rect x="8" y="-18" width="38" height="22" rx="3" fill="#f97316" />
          </g>
          <g transform="translate(80 198)">
            <rect x="0" y="-22" width="14" height="36" rx="6" fill="#ce1126" />
            <rect x="20" y="-22" width="14" height="36" rx="6" fill="#f5c14a" />
            <rect x="40" y="-22" width="14" height="36" rx="6" fill="#1f6b3a" />
            <rect x="2" y="-28" width="10" height="8" rx="2" fill="#1a1a1a" />
            <rect x="22" y="-28" width="10" height="8" rx="2" fill="#1a1a1a" />
            <rect x="42" y="-28" width="10" height="8" rx="2" fill="#1a1a1a" />
          </g>
        </g>
        {/* phone */}
        <g transform="translate(600 520)">
          <rect x="0" y="0" width="120" height="230" rx="18" fill="#1a1a1a" />
          <rect x="8" y="16" width="104" height="200" rx="8" fill="#fff8f0" />
          <rect x="8" y="16" width="104" height="28" fill="#0b1f24" />
          <text x="20" y="36" fill="#f5c14a" fontFamily="system-ui,sans-serif" fontWeight="700" fontSize="13">
            Juvay
          </text>
          <rect x="18" y="54" width="84" height="36" rx="4" fill="#ce1126" />
          <text x="28" y="76" fill="#fff8f0" fontFamily="system-ui,sans-serif" fontWeight="700" fontSize="9">
            Your store
          </text>
          <rect x="18" y="100" width="84" height="28" rx="4" fill="#fff" stroke="#e5ddd0" />
          <rect x="18" y="136" width="84" height="28" rx="4" fill="#fff" stroke="#e5ddd0" />
          <rect x="18" y="172" width="84" height="28" rx="4" fill="#fff" stroke="#e5ddd0" />
        </g>
        {/* cash + chat */}
        <g transform="translate(110 620)">
          <ellipse cx="36" cy="36" rx="36" ry="36" fill="#19a15f" />
          <path d="M22 30 h28 M22 42 h20" stroke="#effff3" strokeWidth="4" strokeLinecap="round" />
          <path d="M18 62 l-8 16 l18 -10" fill="#19a15f" />
        </g>
        <g transform="translate(200 700)">
          <rect x="0" y="0" width="90" height="48" rx="4" fill="#1f6b45" transform="rotate(-16)" />
          <rect x="10" y="8" width="90" height="48" rx="4" fill="#247a4e" transform="rotate(-8)" />
          <text x="36" y="40" fill="#e8f8e0" fontFamily="system-ui,sans-serif" fontWeight="700" fontSize="14" transform="rotate(-8)">
            CASH
          </text>
        </g>
      </svg>
    </div>
  );
};

export default StallPoster;
