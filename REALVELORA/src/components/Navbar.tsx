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
          <Link to="/" className="flex flex-col items-start group" style={{ textDecoration: 'none' }}>
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

          <nav className="flex items-center gap-2">
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
        </div>
      </div>
    </header>
  );
}
