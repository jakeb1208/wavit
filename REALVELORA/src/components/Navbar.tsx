import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { isNative } from '../lib/platform';

const tabs = [
  { to: '/', label: 'Home' },
  { to: '/search', label: 'Search' },
  { to: '/how-to-use', label: 'How to Use' },
  { to: '/login', label: 'Login' },
  { to: '/register', label: 'Register' },
  { to: '/about', label: 'About' },
];

export default function Navbar() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const isQueuePage =
    location.pathname.startsWith('/queue/') ||
    location.pathname.startsWith('/admin/') ||
    location.pathname.startsWith('/join/');

  if (isQueuePage) return null;
  if (isNative()) return null;

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: 'linear-gradient(135deg, #1a2bcc 0%, #2044e8 40%, #1e3bd4 70%, #172dbf 100%)',
        boxShadow: '0 2px 24px rgba(37,99,235,0.45), 0 1px 0 rgba(255,255,255,0.12) inset',
      }}
    >
      {/* Gloss sheen layer */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.03) 50%, transparent 100%)',
        }}
      />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-[60px]">

          {/* Logo */}
          <Link
            to="/"
            className="flex flex-col items-start group select-none"
            style={{ textDecoration: 'none' }}
            onClick={() => setMenuOpen(false)}
          >
            <span
              className="font-pacifico text-3xl leading-none tracking-tight drop-shadow"
              style={{
                color: '#fff',
                textShadow: '0 1px 8px rgba(100,160,255,0.55), 0 0px 2px rgba(255,255,255,0.4)',
              }}
            >
              wavit
            </span>
            <svg viewBox="0 0 90 10" width="90" height="10" style={{ display: 'block', marginTop: '2px' }} fill="none">
              <path
                d="M2,6 C8,1 16,10 24,6 C32,2 40,10 48,6 C56,2 64,10 72,6 C80,2 86,5 88,4"
                stroke="rgba(147,197,253,0.85)"
                strokeWidth="2.2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1.5">
            {tabs.map(tab => {
              const active = isActive(tab.to);
              return (
                <Link
                  key={tab.to}
                  to={tab.to}
                  className="relative px-4 py-1.5 text-sm font-semibold rounded-xl transition-all duration-150 select-none"
                  style={{
                    color: active ? '#fff' : 'rgba(219,234,254,0.88)',
                    background: active
                      ? 'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 100%)'
                      : 'transparent',
                    boxShadow: active
                      ? '0 1px 0 rgba(255,255,255,0.18) inset, 0 2px 8px rgba(37,99,235,0.25)'
                      : 'none',
                    border: active
                      ? '1px solid rgba(255,255,255,0.22)'
                      : '1px solid transparent',
                    textShadow: '0 1px 3px rgba(0,0,30,0.25)',
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.10)';
                      (e.currentTarget as HTMLElement).style.border = '1px solid rgba(255,255,255,0.14)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                      (e.currentTarget as HTMLElement).style.border = '1px solid transparent';
                    }
                  }}
                >
                  {tab.label}
                  {active && (
                    <span
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
                      style={{ background: 'rgba(147,197,253,0.85)' }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden flex flex-col items-center justify-center w-9 h-9 rounded-xl transition-all duration-150 active:scale-95"
            style={{
              background: menuOpen
                ? 'rgba(255,255,255,0.20)'
                : 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.20)',
              boxShadow: '0 1px 4px rgba(0,0,30,0.15)',
            }}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          className="sm:hidden relative px-4 pb-3 pt-1 flex flex-col gap-1"
          style={{
            background: 'linear-gradient(180deg, rgba(26,43,204,0.98) 0%, rgba(23,45,191,0.99) 100%)',
            borderTop: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '0 8px 24px rgba(37,99,235,0.35)',
          }}
        >
          {tabs.map(tab => {
            const active = isActive(tab.to);
            return (
              <Link
                key={tab.to}
                to={tab.to}
                onClick={() => setMenuOpen(false)}
                className="w-full px-4 py-2.5 text-sm font-semibold rounded-xl text-center transition-all duration-150 active:scale-[0.98]"
                style={{
                  color: active ? '#fff' : 'rgba(219,234,254,0.85)',
                  background: active
                    ? 'linear-gradient(180deg, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0.07) 100%)'
                    : 'rgba(255,255,255,0.06)',
                  border: active
                    ? '1px solid rgba(255,255,255,0.22)'
                    : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: active ? '0 1px 0 rgba(255,255,255,0.14) inset' : 'none',
                  textShadow: '0 1px 3px rgba(0,0,30,0.25)',
                }}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
