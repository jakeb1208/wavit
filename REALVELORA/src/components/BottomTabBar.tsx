import { Link, useLocation } from 'react-router-dom';
import { isIOS, isAndroid } from '../lib/platform';

const tabs = [
  {
    to: '/',
    label: 'Home',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.8} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: '/search',
    label: 'Search',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} className="w-6 h-6">
        <circle cx="11" cy="11" r="8" />
        <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
      </svg>
    ),
  },
  {
    to: '/login',
    label: 'Login',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.8} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    to: '/register',
    label: 'Register',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} className="w-6 h-6">
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

  return (
    <>
      {ios && <div className="h-[83px]" />}
      {android && <div className="h-[68px]" />}

      <nav
        className={`fixed bottom-0 left-0 right-0 z-50 flex items-stretch ${
          ios
            ? 'pb-[env(safe-area-inset-bottom,20px)]'
            : 'pb-1'
        }`}
        style={{
          background: ios
            ? 'rgba(15, 23, 80, 0.92)'
            : 'rgba(10, 18, 70, 0.97)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: ios
            ? '0.5px solid rgba(99, 140, 255, 0.25)'
            : '1px solid rgba(99, 140, 255, 0.3)',
          boxShadow: '0 -4px 30px rgba(37, 99, 235, 0.18)',
        }}
      >
        {tabs.map(tab => {
          const active = isActive(tab.to);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-all duration-150 active:scale-95 select-none"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <span
                className={`transition-all duration-150 ${
                  active ? 'text-blue-300' : 'text-slate-400'
                }`}
              >
                {tab.icon(active)}
              </span>

              {ios && (
                <span
                  className={`text-[10px] font-medium tracking-tight transition-all duration-150 ${
                    active ? 'text-blue-300' : 'text-slate-500'
                  }`}
                >
                  {tab.label}
                </span>
              )}

              {android && (
                <>
                  <span
                    className={`text-[11px] font-medium transition-all duration-150 ${
                      active ? 'text-blue-300' : 'text-slate-400'
                    }`}
                  >
                    {tab.label}
                  </span>
                  {active && (
                    <span className="absolute top-1 w-12 h-0.5 rounded-full bg-blue-400 opacity-90" />
                  )}
                </>
              )}

              {ios && active && (
                <span className="absolute bottom-[calc(env(safe-area-inset-bottom,20px)+4px)] w-1 h-1 rounded-full bg-blue-400" />
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
