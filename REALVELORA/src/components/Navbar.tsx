import { Link, useLocation } from 'react-router-dom';

const links = [
  {
    to: '/',
    label: 'Home',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: '/search',
    label: 'Find',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    to: '/about',
    label: 'About',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export default function Navbar() {
  const location = useLocation();

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const isQueuePage = location.pathname.startsWith('/queue/') || location.pathname.startsWith('/admin/') || location.pathname.startsWith('/join/');

  if (isQueuePage) return null;

  return (
    <>
      <header className="sticky top-0 z-50 glass border-b border-violet-100/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl flex items-center justify-center shadow-md shadow-violet-300/40 group-hover:shadow-violet-400/50 transition-shadow">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 3L4 14h7v7l9-11h-7V3z" />
                </svg>
              </div>
              <span className="text-[17px] font-bold tracking-tight text-gray-900">
                wav<span className="text-violet-600">it</span>
              </span>
            </Link>

            <nav className="hidden sm:flex items-center gap-0.5">
              {links.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive(link.to)
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/80'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

          </div>
        </div>
      </header>

      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-gray-100/80 bottom-nav-height pb-safe">
        <div className="grid grid-cols-3 h-16">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex flex-col items-center justify-center gap-1 transition-all duration-150 ${
                isActive(link.to) ? 'text-violet-700' : 'text-gray-400'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-colors ${isActive(link.to) ? 'bg-violet-100' : ''}`}>
                {link.icon}
              </div>
              <span className={`text-[10px] font-semibold leading-none ${isActive(link.to) ? 'text-violet-700' : 'text-gray-400'}`}>
                {link.label}
              </span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
