import { Link, useLocation } from 'react-router-dom';
import { isIOS, isAndroid } from '../lib/platform';

const tabs = [
  {
    to: '/',
    label: 'Home',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.6} className="w-[22px] h-[22px]">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: '/search',
    label: 'Search',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6} className="w-[22px] h-[22px]">
        <circle cx="11" cy="11" r="7.5" />
        <path strokeLinecap="round" d="M20.5 20.5l-4-4" />
      </svg>
    ),
  },
  {
    to: '/login',
    label: 'Login',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.6} className="w-[22px] h-[22px]">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    to: '/register',
    label: 'Register',
    icon: (_active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-[22px] h-[22px]">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
];

export default function BottomTabBar() {
  const location = useLocation();
  const ios = isIOS();
  const android = isAndroid();

  if (!ios && !android) return null;

  const isHidden =
    location.pathname.startsWith('/queue/') ||
    location.pathname.startsWith('/admin/') ||
    location.pathname.startsWith('/join/');

  if (isHidden) return null;

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  if (ios) {
    return (
      <>
        <div className="h-[100px]" />
        <nav
          className="fixed z-50"
          style={{
            bottom: 'calc(env(safe-area-inset-bottom, 16px) + 8px)',
            left: '16px',
            right: '16px',
          }}
        >
          <div
            style={{
              background: 'rgba(8, 12, 28, 0.82)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              borderRadius: '24px',
              border: '1px solid rgba(120, 160, 255, 0.18)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.55), 0 0 0 0.5px rgba(120,160,255,0.12), inset 0 1px 0 rgba(255,255,255,0.07)',
              display: 'flex',
              padding: '8px 8px',
              gap: '4px',
            }}
          >
            {tabs.map(tab => {
              const active = isActive(tab.to);
              return (
                <Link
                  key={tab.to}
                  to={tab.to}
                  className="flex-1 flex flex-col items-center justify-center select-none"
                  style={{
                    WebkitTapHighlightColor: 'transparent',
                    padding: '8px 4px',
                    borderRadius: '16px',
                    background: active
                      ? 'linear-gradient(135deg, rgba(59,130,246,0.35) 0%, rgba(99,102,241,0.25) 100%)'
                      : 'transparent',
                    border: active ? '1px solid rgba(99,140,255,0.28)' : '1px solid transparent',
                    boxShadow: active ? '0 0 16px rgba(59,130,246,0.25), inset 0 1px 0 rgba(255,255,255,0.08)' : 'none',
                    transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                    transform: active ? 'scale(1.04)' : 'scale(1)',
                    gap: '4px',
                  }}
                >
                  <span style={{ color: active ? '#93c5fd' : 'rgba(148,163,184,0.7)' }}>
                    {tab.icon(active)}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: active ? 700 : 500,
                      letterSpacing: '-0.01em',
                      color: active ? '#93c5fd' : 'rgba(148,163,184,0.6)',
                    }}
                  >
                    {tab.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </>
    );
  }

  return (
    <>
      <div className="h-[72px]" />
      <nav
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: 'rgba(6, 10, 24, 0.96)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(99,140,255,0.15)',
          boxShadow: '0 -1px 0 rgba(99,140,255,0.08), 0 -8px 32px rgba(0,0,0,0.4)',
          display: 'flex',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {tabs.map(tab => {
          const active = isActive(tab.to);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className="flex-1 flex flex-col items-center justify-center select-none"
              style={{
                WebkitTapHighlightColor: 'transparent',
                padding: '12px 8px 10px',
                gap: '4px',
                position: 'relative',
              }}
            >
              {active && (
                <span
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '40px',
                    height: '3px',
                    borderRadius: '0 0 4px 4px',
                    background: 'linear-gradient(90deg, #3b82f6, #818cf8)',
                    boxShadow: '0 0 8px rgba(59,130,246,0.6)',
                  }}
                />
              )}
              <span
                style={{
                  color: active ? '#60a5fa' : 'rgba(148,163,184,0.6)',
                  transition: 'color 0.15s',
                  transform: active ? 'scale(1.1)' : 'scale(1)',
                  transition: 'all 0.15s',
                }}
              >
                {tab.icon(active)}
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: active ? 700 : 500,
                  color: active ? '#60a5fa' : 'rgba(148,163,184,0.55)',
                  transition: 'color 0.15s',
                  letterSpacing: '-0.01em',
                }}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
