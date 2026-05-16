import { Link } from 'react-router-dom';

interface WavitLogoProps {
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  to?: string;
  asDiv?: boolean;
}

const SIZE_MAP = {
  sm: { icon: 30, fontSize: '18px', gap: '8px' },
  md: { icon: 36, fontSize: '22px', gap: '10px' },
  lg: { icon: 44, fontSize: '28px', gap: '12px' },
};

function WavitIcon({ size }: { size: number }) {
  const id = `wv-${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="rgba(30,42,90,0.95)" />
          <stop offset="100%" stopColor="rgba(45,18,85,0.95)" />
        </linearGradient>
        <linearGradient id={`${id}-wave`} x1="6" y1="22" x2="38" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="50%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
        <linearGradient id={`${id}-dot`} x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
        <filter id={`${id}-glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Rounded square badge */}
      <rect x="1" y="1" width="42" height="42" rx="11" fill={`url(#${id}-bg)`} />
      <rect x="1" y="1" width="42" height="42" rx="11" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />

      {/* Wave W path */}
      <path
        d="M7 27 L12 17 L17 24 L22 14 L27 24 L32 17 L37 27"
        stroke={`url(#${id}-wave)`}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter={`url(#${id}-glow)`}
      />

      {/* Accent dot at peak */}
      <circle cx="22" cy="14" r="2.5" fill={`url(#${id}-dot)`} filter={`url(#${id}-glow)`} />
    </svg>
  );
}

export default function WavitLogo({ size = 'md', onClick, to = '/', asDiv = false }: WavitLogoProps) {
  const s = SIZE_MAP[size];

  const inner = (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .wv-logo-wrap {
          display: inline-flex;
          align-items: center;
          gap: ${s.gap};
          text-decoration: none;
          cursor: pointer;
          border-radius: 10px;
          padding: 2px;
          transition: all 0.25s ease;
        }
        .wv-logo-wrap:hover .wv-logo-icon {
          transform: scale(1.08) rotate(-2deg);
          filter: drop-shadow(0 0 10px rgba(96,165,250,0.55)) drop-shadow(0 0 20px rgba(167,139,250,0.4));
        }
        .wv-logo-wrap:hover .wv-logo-word {
          background-position: 100% 50%;
          filter: drop-shadow(0 0 12px rgba(167,139,250,0.5));
          letter-spacing: 0.01em;
        }
        .wv-logo-icon {
          transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), filter 0.3s ease;
          display: block;
        }
        .wv-logo-word {
          font-family: 'Pacifico', cursive;
          font-size: ${s.fontSize};
          background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #60a5fa 100%);
          background-size: 200% 200%;
          background-position: 0% 50%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1;
          transition: background-position 0.4s ease, filter 0.3s ease, letter-spacing 0.2s ease;
          display: block;
        }
      `}} />
      <span className="wv-logo-icon">
        <WavitIcon size={s.icon} />
      </span>
      <span className="wv-logo-word">wavit</span>
    </>
  );

  if (asDiv) {
    return (
      <div className="wv-logo-wrap" onClick={onClick}>
        {inner}
      </div>
    );
  }

  return (
    <Link to={to} className="wv-logo-wrap" onClick={onClick}>
      {inner}
    </Link>
  );
}
