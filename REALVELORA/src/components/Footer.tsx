import { Link } from 'react-router-dom';
import { Instagram } from 'lucide-react';
import { isNative } from '../lib/platform';
import WavitLogo from './WavitLogo';

export default function Footer() {
  if (isNative()) return null;

  return (
    <footer
      style={{
        background: '#04070a',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        position: 'relative',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Top glow accent line */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '1px',
        background: 'linear-gradient(to right, transparent, rgba(59,130,246,0.35), rgba(139,92,246,0.25), transparent)',
      }} />

      <div
        className="max-w-7xl mx-auto px-6 py-12"
        style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}
      >
        {/* Top row */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px',
        }}>
          {/* Logo lockup — bottom-left */}
          <div style={{ flex: '1 1 auto' }}>
            <WavitLogo size="md" to="/" />
            <p style={{
              marginTop: '10px',
              fontSize: '12px',
              color: 'rgba(100,116,139,0.65)',
              maxWidth: '200px',
              lineHeight: 1.6,
            }}>
              Real-time virtual queues for local businesses.
            </p>
          </div>

          {/* Nav links — center */}
          <nav style={{
            flex: '1 1 auto',
            display: 'flex',
            justifyContent: 'center',
            gap: '24px',
            flexWrap: 'wrap',
          }}>
            {[
              { label: 'Contact', href: 'mailto:wavitapp@gmail.com', external: true },
              { label: 'Privacy', to: '/privacy' },
              { label: 'Terms', to: '/terms' },
              { label: 'How It Works', to: '/how-to-use' },
            ].map((item, i) =>
              item.external ? (
                <a
                  key={i}
                  href={item.href}
                  style={{
                    fontSize: '14px',
                    color: 'rgba(148,163,184,0.65)',
                    textDecoration: 'none',
                    transition: 'color 0.15s ease',
                    fontWeight: 500,
                  }}
                  onMouseEnter={e => ((e.target as HTMLElement).style.color = '#fff')}
                  onMouseLeave={e => ((e.target as HTMLElement).style.color = 'rgba(148,163,184,0.65)')}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={i}
                  to={item.to!}
                  style={{
                    fontSize: '14px',
                    color: 'rgba(148,163,184,0.65)',
                    textDecoration: 'none',
                    transition: 'color 0.15s ease',
                    fontWeight: 500,
                  }}
                  onMouseEnter={e => ((e.target as HTMLElement).style.color = '#fff')}
                  onMouseLeave={e => ((e.target as HTMLElement).style.color = 'rgba(148,163,184,0.65)')}
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>

          {/* Social — right */}
          <div style={{ flex: '1 1 auto', display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{
              width: '40px', height: '40px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(148,163,184,0.5)',
              cursor: 'default',
              transition: 'all 0.2s ease',
            }}>
              <Instagram size={18} />
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.05)',
          paddingTop: '20px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '12px', color: 'rgba(100,116,139,0.65)', margin: 0 }}>
            © {new Date().getFullYear()} Wavit. All rights reserved.
          </p>
          <p style={{ fontSize: '11px', color: 'rgba(100,116,139,0.45)', marginTop: '6px' }}>
            SMS notifications are sent to customers who join a queue. Reply{' '}
            <strong style={{ color: 'rgba(148,163,184,0.55)' }}>STOP</strong> to any text to opt out.
          </p>
        </div>
      </div>
    </footer>
  );
}
