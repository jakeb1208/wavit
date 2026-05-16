import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { isNative } from '../lib/platform';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const isQueuePage =
    location.pathname.startsWith('/queue/') ||
    location.pathname.startsWith('/admin/') ||
    location.pathname.startsWith('/join/');

  if (isQueuePage) return null;
  if (isNative()) return null;

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const handleForBusinesses = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname === '/') {
      document.getElementById('for-businesses')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/how-to-use');
    }
    setMenuOpen(false);
  };

  const tabs = [
    { to: '/', label: 'Home' },
    { to: '/search', label: 'Search' },
    { to: '/about', label: 'About' },
    { label: 'For Businesses', onClick: handleForBusinesses },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .wavit-nav-link {
          position: relative;
          padding: 6px 14px;
          border-radius: 9999px;
          font-size: 14px;
          font-weight: 500;
          color: rgba(203,213,225,0.85);
          text-decoration: none;
          transition: color 0.15s ease, background 0.15s ease;
          font-family: 'Inter', system-ui, sans-serif;
        }
        .wavit-nav-link:hover {
          color: #fff;
          background: rgba(255,255,255,0.06);
        }
        .wavit-nav-link.active {
          color: #fff;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .wavit-login-btn {
          padding: 8px 20px;
          border-radius: 9999px;
          font-size: 14px;
          font-weight: 500;
          color: #fff;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.12);
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          font-family: 'Inter', system-ui, sans-serif;
          backdrop-filter: blur(10px);
        }
        .wavit-login-btn:hover {
          background: rgba(59,130,246,0.15);
          border-color: rgba(59,130,246,0.4);
          box-shadow: 0 0 16px rgba(59,130,246,0.2);
        }
      `}} />
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: isScrolled
            ? 'rgba(7,11,20,0.85)'
            : 'transparent',
          backdropFilter: isScrolled ? 'blur(20px)' : 'none',
          WebkitBackdropFilter: isScrolled ? 'blur(20px)' : 'none',
          borderBottom: isScrolled ? '1px solid rgba(255,255,255,0.05)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-6" style={{ height: isScrolled ? '64px' : '72px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'height 0.3s ease' }}>
          <Link
            to="/"
            style={{ textDecoration: 'none', flexShrink: 0 }}
            onClick={() => setMenuOpen(false)}
          >
            <span
              className="font-pacifico text-3xl"
              style={{
                background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                lineHeight: 1,
              }}
            >
              wavit
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {tabs.map((tab, i) =>
              tab.to ? (
                <Link
                  key={i}
                  to={tab.to}
                  className={`wavit-nav-link ${isActive(tab.to) ? 'active' : ''}`}
                >
                  {tab.label}
                </Link>
              ) : (
                <a
                  key={i}
                  href="#"
                  className="wavit-nav-link"
                  onClick={tab.onClick}
                >
                  {tab.label}
                </a>
              )
            )}
          </nav>

          <div className="hidden md:flex items-center">
            <Link to="/login" className="wavit-login-btn">
              Log In
            </Link>
          </div>

          <button
            className="md:hidden text-white p-2 rounded-xl transition-colors"
            style={{ background: menuOpen ? 'rgba(255,255,255,0.1)' : 'transparent' }}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {menuOpen && (
          <div
            className="md:hidden"
            style={{
              background: 'rgba(7,11,20,0.97)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              padding: '16px 24px 24px',
            }}
          >
            <div className="flex flex-col gap-2">
              {tabs.map((tab, i) =>
                tab.to ? (
                  <Link
                    key={i}
                    to={tab.to}
                    onClick={() => setMenuOpen(false)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: 500,
                      color: isActive(tab.to) ? '#fff' : 'rgba(203,213,225,0.8)',
                      background: isActive(tab.to) ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                      textDecoration: 'none',
                      fontFamily: "'Inter', system-ui, sans-serif",
                    }}
                  >
                    {tab.label}
                  </Link>
                ) : (
                  <a
                    key={i}
                    href="#"
                    onClick={tab.onClick}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: 500,
                      color: 'rgba(203,213,225,0.8)',
                      background: 'rgba(255,255,255,0.03)',
                      textDecoration: 'none',
                      fontFamily: "'Inter', system-ui, sans-serif",
                    }}
                  >
                    {tab.label}
                  </a>
                )
              )}
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                style={{
                  marginTop: '8px',
                  padding: '12px 16px',
                  borderRadius: '9999px',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#fff',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  textAlign: 'center',
                  textDecoration: 'none',
                  fontFamily: "'Inter', system-ui, sans-serif",
                  boxShadow: '0 0 20px rgba(59,130,246,0.35)',
                }}
              >
                Log In
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
