import { useId } from 'react';
import { Link } from 'react-router-dom';

interface WavitLogoProps {
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  to?: string;
  asDiv?: boolean;
}

const SIZE_MAP = {
  sm: { icon: 28, fontSize: '15px', gap: '8px',  letterSpacing: '-0.03em', fontWeight: 700 },
  md: { icon: 36, fontSize: '19px', gap: '10px', letterSpacing: '-0.03em', fontWeight: 700 },
  lg: { icon: 46, fontSize: '24px', gap: '13px', letterSpacing: '-0.03em', fontWeight: 700 },
};

/* ── Premium W Icon ─────────────────────────────────────────────────────── */
function WIcon({ size, uid }: { size: number; uid: string }) {
  /*
   * The W is drawn as a single continuous stroke path using 4 cubic bezier
   * segments.  The five key points are:
   *   Left peak  (6, 11) → Left valley (19, 45) → Centre peak (28, 15) →
   *   Right valley (37, 45) → Right peak (50, 11)
   *
   * All C() control points are chosen so the curve is G1-continuous at every
   * key point (tangent directions match), giving a fully smooth, aerodynamic
   * silhouette.
   *
   * ViewBox: 0 0 56 56
   */
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', flexShrink: 0 }}
      aria-label="Wavit"
    >
      <defs>
        {/* Badge background gradient */}
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#0d1428" />
          <stop offset="100%" stopColor="#160b38" />
        </linearGradient>

        {/* W stroke gradient — cyan → indigo → purple */}
        <linearGradient id={`${uid}-w`} x1="6" y1="28" x2="50" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#22d3ee" />  {/* cyan     */}
          <stop offset="48%"  stopColor="#6366f1" />  {/* indigo   */}
          <stop offset="100%" stopColor="#a78bfa" />  {/* violet   */}
        </linearGradient>

        {/* Badge border gradient */}
        <linearGradient id={`${uid}-border`} x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="rgba(99,147,255,0.35)" />
          <stop offset="100%" stopColor="rgba(167,139,250,0.2)" />
        </linearGradient>

        {/* Soft glow for the W path */}
        <filter id={`${uid}-glow`} x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Outer badge shadow / ambient glow */}
        <filter id={`${uid}-outer`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Badge background ── */}
      <rect
        x="0.5" y="0.5" width="55" height="55" rx="13.5"
        fill={`url(#${uid}-bg)`}
        filter={`url(#${uid}-outer)`}
      />

      {/* Badge border */}
      <rect
        x="0.5" y="0.5" width="55" height="55" rx="13.5"
        stroke={`url(#${uid}-border)`}
        strokeWidth="1"
        fill="none"
      />

      {/* Subtle inner top shine */}
      <rect
        x="8" y="1.5" width="40" height="1"
        rx="0.5"
        fill="rgba(255,255,255,0.1)"
      />

      {/* ── W mark ── */}
      {/* Shadow/depth layer (slightly offset, blurred) */}
      <path
        d="M 6 11 C 8 11, 14 43, 19 45 C 24 47, 24.5 20, 28 15 C 31.5 10, 32 47, 37 45 C 42 43, 48 11, 50 11"
        stroke="rgba(34,211,238,0.18)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        style={{ filter: `blur(3px)` }}
      />

      {/* Primary W stroke */}
      <path
        d="M 6 11 C 8 11, 14 43, 19 45 C 24 47, 24.5 20, 28 15 C 31.5 10, 32 47, 37 45 C 42 43, 48 11, 50 11"
        stroke={`url(#${uid}-w)`}
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter={`url(#${uid}-glow)`}
      />

      {/* Accent dot at centre peak — suggests a live pulse / node */}
      <circle cx="28" cy="15" r="2.4" fill="#e0e7ff" opacity="0.85" />
      <circle cx="28" cy="15" r="3.8" fill="rgba(99,147,255,0.25)" />
    </svg>
  );
}

/* ── Logo lockup (icon + wordmark) ─────────────────────────────────────── */
export default function WavitLogo({
  size = 'md',
  onClick,
  to = '/',
  asDiv = false,
}: WavitLogoProps) {
  const rawId = useId();
  // useId can return ":r0:" etc — strip special chars for SVG id safety
  const uid = `wv${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;
  const s = SIZE_MAP[size];

  const css = `
    .wv-logo-${uid} {
      display: inline-flex;
      align-items: center;
      gap: ${s.gap};
      text-decoration: none;
      cursor: pointer;
      border-radius: 8px;
      padding: 2px;
      -webkit-tap-highlight-color: transparent;
      outline: none;
      user-select: none;
    }

    /* Icon: scale + spring bounce + glow */
    .wv-logo-${uid} .wv-icon {
      transition:
        transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
        filter 0.3s ease;
    }
    .wv-logo-${uid}:hover .wv-icon {
      transform: scale(1.1) rotate(-3deg);
      filter:
        drop-shadow(0 0 6px rgba(34,211,238,0.55))
        drop-shadow(0 0 14px rgba(99,102,241,0.45))
        drop-shadow(0 0 24px rgba(167,139,250,0.3));
    }

    /* Wordmark: Space Grotesk — geometric, futuristic, premium */
    .wv-logo-${uid} .wv-word {
      font-family: 'Space Grotesk', system-ui, sans-serif;
      font-size: ${s.fontSize};
      font-weight: ${s.fontWeight};
      letter-spacing: ${s.letterSpacing};
      background: linear-gradient(
        105deg,
        #e2eeff  0%,
        #a5c4ff 20%,
        #818cf8 48%,
        #c4b5fd 72%,
        #e2eeff 100%
      );
      background-size: 260% 100%;
      background-position: 0% 50%;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1;
      display: block;
      text-transform: lowercase;
      transition:
        background-position 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94),
        filter 0.3s ease,
        transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .wv-logo-${uid}:hover .wv-word {
      background-position: 100% 50%;
      filter:
        drop-shadow(0 0 6px rgba(34,211,238,0.35))
        drop-shadow(0 0 12px rgba(167,139,250,0.35));
      transform: translateY(-1px);
    }

    /* Ambient shimmer on wordmark in sync with icon breathing */
    @keyframes wv-shimmer-${uid} {
      0%, 100% { background-position: 0% 50%;   filter: drop-shadow(0 0 2px rgba(165,196,255,0.15)); }
      50%       { background-position: 60% 50%;  filter: drop-shadow(0 0 6px rgba(167,139,250,0.28)); }
    }
    .wv-logo-${uid} .wv-word {
      animation: wv-shimmer-${uid} 3.5s ease-in-out infinite;
    }
    .wv-logo-${uid}:hover .wv-word {
      animation: none;
    }

    /* Ambient breathing glow on the icon (non-hover) */
    @keyframes wv-breathe-${uid} {
      0%, 100% { filter: drop-shadow(0 0 2px rgba(34,211,238,0.2)) drop-shadow(0 0 4px rgba(99,102,241,0.15)); }
      50%       { filter: drop-shadow(0 0 5px rgba(34,211,238,0.4)) drop-shadow(0 0 10px rgba(167,139,250,0.3)); }
    }
    .wv-logo-${uid} .wv-icon {
      animation: wv-breathe-${uid} 3.5s ease-in-out infinite;
    }
    .wv-logo-${uid}:hover .wv-icon {
      animation: none;
    }
  `;

  const inner = (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <span className="wv-icon">
        <WIcon size={s.icon} uid={uid} />
      </span>
      <span className="wv-word">wavit</span>
    </>
  );

  if (asDiv) {
    return (
      <div className={`wv-logo-${uid}`} onClick={onClick} role="button" tabIndex={0}>
        {inner}
      </div>
    );
  }

  return (
    <Link to={to} className={`wv-logo-${uid}`} onClick={onClick}>
      {inner}
    </Link>
  );
}
