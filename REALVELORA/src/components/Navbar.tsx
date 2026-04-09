import { Link, useLocation } from 'react-router-dom';

const tabs = [
  { to: '/', label: 'Home' },
  { to: '/search', label: 'Search' },
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
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-12">
          <Link to="/" className="text-[17px] font-black tracking-tight text-gray-900">
            wav<span className="text-violet-600">it</span>
          </Link>

          <nav className="flex items-center gap-1">
            {tabs.map(tab => (
              <Link
                key={tab.to}
                to={tab.to}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
                  isActive(tab.to)
                    ? 'bg-violet-600 text-white'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
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
