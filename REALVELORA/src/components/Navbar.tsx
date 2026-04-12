import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

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

  return (
    <header className="sticky top-0 z-50 bg-gray-200 border-b-2 border-gray-400 shadow-md">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex flex-col items-start group" style={{ textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>
            <span className="font-pacifico text-3xl text-blue-600 leading-none tracking-tight">wavit</span>
            <svg viewBox="0 0 90 10" width="90" height="10" style={{ display: 'block', marginTop: '2px' }} fill="none">
              <path
                d="M2,6 C8,1 16,10 24,6 C32,2 40,10 48,6 C56,2 64,10 72,6 C80,2 86,5 88,4"
                stroke="#2563eb"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-2">
            {tabs.map(tab => (
              <Link
                key={tab.to}
                to={tab.to}
                className={`px-4 py-2 border-2 text-sm font-bold transition-all duration-150 rounded-2xl shadow-sm hover:shadow-md ${
                  isActive(tab.to)
                    ? 'bg-blue-700 border-blue-800 text-black ring-2 ring-blue-300/60'
                    : 'bg-blue-600 border-blue-700 text-black hover:bg-blue-700 hover:border-blue-800'
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>

          {/* Mobile hamburger button */}
          <button
            className="sm:hidden flex flex-col items-center justify-center w-10 h-10 rounded-xl bg-blue-600 border-2 border-blue-700 shadow-sm"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="sm:hidden bg-gray-200 border-t-2 border-gray-400 px-4 pb-4 pt-2 space-y-1.5">
          {tabs.map(tab => (
            <Link
              key={tab.to}
              to={tab.to}
              onClick={() => setMenuOpen(false)}
              className={`block w-full px-4 py-3 border-2 text-sm font-bold transition-all duration-150 rounded-2xl text-center shadow-sm ${
                isActive(tab.to)
                  ? 'bg-blue-700 border-blue-800 text-black ring-2 ring-blue-300/60'
                  : 'bg-blue-600 border-blue-700 text-black hover:bg-blue-700 hover:border-blue-800'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
