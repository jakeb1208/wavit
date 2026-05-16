import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueueStore } from '../store/queueStore';
import ShopCard from '../components/ShopCard';
import { isNative } from '../lib/platform';

const steps = [
  {
    n: '1',
    icon: (
      <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6.364 1.636l-.707.707M20 12h-1M17.657 17.657l-.707-.707M12 19v1M6.343 17.657l-.707-.707M4 12H3M6.343 6.343l.707.707" />
        <circle cx="12" cy="12" r="4" strokeWidth={2} />
      </svg>
    ),
    title: 'Scan or Search',
    desc: 'Scan the QR code at the shop door or search by name to check in to the queue.',
  },
  {
    n: '2',
    icon: (
      <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Watch Your Wait Time',
    desc: 'See your live wait time and position right on your phone — updated every few seconds.',
  },
  {
    n: '3',
    icon: (
      <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
    title: "Get Texted When It's Your Turn",
    desc: "You'll get an SMS the moment your turn is approaching. No guessing, no staring at a screen.",
  },
];

function NativeHomePage() {
  const shops = useQueueStore(s => s.shops);
  const fetchShops = useQueueStore(s => s.fetchShops);
  const navigate = useNavigate();

  useEffect(() => {
    fetchShops();
    const interval = setInterval(fetchShops, 10000);
    return () => clearInterval(interval);
  }, [fetchShops]);

  const openShops = shops.filter(s => s.queueOpen);
  const noWait = openShops.filter(s => s.queue.filter((t: any) => !t.exitedAt).length === 0).length;
  const featured = shops.slice(0, 6);

  const BG = '#070b14';
  const GLASS = 'rgba(255,255,255,0.055)';
  const BORDER = 'rgba(255,255,255,0.09)';
  const GLOW_BLUE = 'rgba(59,130,246,0.18)';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: `radial-gradient(ellipse 80% 50% at 50% 0%, rgba(30,58,138,0.35) 0%, ${BG} 60%)`,
        color: '#f0f4ff',
        paddingBottom: '24px',
      }}
    >
      {/* App header */}
      <div
        style={{
          padding: '20px 20px 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h1
            className="font-pacifico"
            style={{ fontSize: '32px', color: '#60a5fa', lineHeight: 1.1, letterSpacing: '-0.5px' }}
          >
            wavit
          </h1>
          <p style={{ fontSize: '12px', color: 'rgba(148,163,184,0.7)', fontWeight: 500, marginTop: '2px' }}>
            Skip the wait, not the appointment
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(16,185,129,0.12)',
            border: '1px solid rgba(16,185,129,0.22)',
            borderRadius: '20px',
            padding: '6px 12px',
          }}
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 8px rgba(16,185,129,0.7)',
              display: 'inline-block',
              animation: 'pulse 2s infinite',
            }}
          />
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#34d399' }}>
            {openShops.length} Live
          </span>
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {/* Stats row */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', marginTop: '12px' }}>
          {[
            { value: openShops.length || '—', label: 'Shops live', color: '#3b82f6', glow: 'rgba(59,130,246,0.3)' },
            { value: noWait || '—', label: 'No wait', color: '#10b981', glow: 'rgba(16,185,129,0.3)' },
            { value: '< 30s', label: 'To join', color: '#a78bfa', glow: 'rgba(167,139,250,0.3)' },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                background: GLASS,
                border: `1px solid ${BORDER}`,
                borderRadius: '18px',
                padding: '14px 10px',
                textAlign: 'center',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                boxShadow: `0 0 20px ${s.glow}, inset 0 1px 0 rgba(255,255,255,0.06)`,
              }}
            >
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 900,
                  color: s.color,
                  lineHeight: 1,
                  marginBottom: '4px',
                  textShadow: `0 0 20px ${s.glow}`,
                }}
              >
                {String(s.value)}
              </div>
              <div style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(148,163,184,0.65)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Search shortcut */}
        <button
          onClick={() => navigate('/search')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: GLASS,
            border: `1px solid ${BORDER}`,
            borderRadius: '16px',
            padding: '14px 16px',
            color: 'rgba(148,163,184,0.5)',
            fontSize: '14px',
            fontWeight: 500,
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            marginBottom: '24px',
            cursor: 'pointer',
            textAlign: 'left',
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.05)`,
          }}
        >
          <svg style={{ width: '18px', height: '18px', opacity: 0.5 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Search shops by name or category…
        </button>

        {/* Nearby shops */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.3px' }}>
              Nearby Shops
            </h2>
            <Link
              to="/search"
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#60a5fa',
                textDecoration: 'none',
                padding: '5px 12px',
                borderRadius: '20px',
                background: 'rgba(59,130,246,0.12)',
                border: '1px solid rgba(59,130,246,0.22)',
              }}
            >
              See all
            </Link>
          </div>

          {featured.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    background: GLASS,
                    border: `1px solid ${BORDER}`,
                    borderRadius: '18px',
                    padding: '18px',
                    height: '72px',
                  }}
                >
                  <div className="skeleton" style={{ height: '14px', width: '60%', borderRadius: '8px', marginBottom: '8px' }} />
                  <div className="skeleton" style={{ height: '11px', width: '35%', borderRadius: '6px' }} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {featured.map(shop => (
                <ShopCard key={shop.id} shop={shop} showJoinLink />
              ))}
            </div>
          )}
        </div>

        {/* Business CTA */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(37,99,235,0.25) 0%, rgba(99,102,241,0.2) 100%)',
            border: '1px solid rgba(99,140,255,0.22)',
            borderRadius: '20px',
            padding: '20px',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: `0 0 30px ${GLOW_BLUE}, inset 0 1px 0 rgba(255,255,255,0.07)`,
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#f0f4ff', marginBottom: '6px', letterSpacing: '-0.3px' }}>
            Own a shop?
          </h3>
          <p style={{ fontSize: '13px', color: 'rgba(148,163,184,0.75)', lineHeight: 1.5, marginBottom: '16px' }}>
            Manage your queue, reduce no-shows, and send auto SMS alerts with Wavit.
          </p>
          <button
            onClick={() => navigate('/register')}
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 20px',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(59,130,246,0.4)',
              letterSpacing: '-0.1px',
            }}
          >
            Apply Now →
          </button>
        </div>

        {/* Legal links */}
        <div
          style={{
            marginTop: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            paddingBottom: '8px',
          }}
        >
          <Link
            to="/terms"
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'rgba(148,163,184,0.45)',
              textDecoration: 'none',
              padding: '6px 12px',
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.07)',
              background: 'rgba(255,255,255,0.03)',
              transition: 'color 0.15s',
            }}
          >
            Terms of Service
          </Link>
          <span style={{ fontSize: '12px', color: 'rgba(148,163,184,0.2)' }}>·</span>
          <Link
            to="/privacy"
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'rgba(148,163,184,0.45)',
              textDecoration: 'none',
              padding: '6px 12px',
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.07)',
              background: 'rgba(255,255,255,0.03)',
              transition: 'color 0.15s',
            }}
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const shops = useQueueStore(s => s.shops);
  const fetchShops = useQueueStore(s => s.fetchShops);
  const navigate = useNavigate();
  const native = isNative();
  const featured = shops.slice(0, 4);

  useEffect(() => {
    if (!native) {
      fetchShops();
      const interval = setInterval(fetchShops, 10000);
      return () => clearInterval(interval);
    }
  }, [fetchShops, native]);

  if (native) return <NativeHomePage />;

  const openShops = shops.filter(s => s.queueOpen);
  const noWait = openShops.filter(s => s.queue.filter((t: any) => !t.exitedAt).length === 0).length;

  return (
    <div style={{ minHeight: '100vh', background: '#070b14', color: '#f0f4ff', paddingBottom: '40px' }}>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#1a0845] via-[#1d3a8a] to-[#1e40af]">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -left-24 w-[500px] h-[500px] bg-blue-500/15 rounded-full blur-3xl" />
          <div className="absolute top-16 right-0 w-[400px] h-[400px] bg-blue-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-40 bg-blue-500/10 blur-3xl" />
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-24 sm:pb-32 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 border border-white/15 rounded-full text-xs font-semibold text-blue-200 mb-8 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            See your wait time live from your phone — no app needed
          </div>

          <h1 className="font-pacifico text-7xl sm:text-9xl mb-2 leading-none text-blue-400">
            wavit
          </h1>
          <div className="flex justify-center mb-6">
            <svg viewBox="0 0 200 16" width="200" height="16" style={{ display: 'block' }} fill="none">
              <path
                d="M4,10 C18,2 36,16 54,10 C72,4 90,16 108,10 C126,4 144,16 162,10 C178,4 192,8 196,7"
                stroke="#60a5fa"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <p className="text-blue-200 text-lg sm:text-xl font-bold mb-3 tracking-wide">
            Waive the Wait
          </p>

          <p className="text-sm sm:text-base max-w-lg mx-auto leading-relaxed text-white/70 mb-10 font-medium">
            Check in at any local shop, then watch your exact wait time right
            from your phone — and get a text the moment it's your turn.
          </p>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-12" style={{ background: 'linear-gradient(to top, #070b14, transparent)' }} />
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 -mt-8 mb-10 relative z-10">
          {[
            { value: String(openShops.length || '—'), label: 'Shops live' },
            { value: String(noWait || '—'), label: 'No wait now' },
            { value: '< 30s', label: 'To join queue' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.055)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '20px', padding: '20px 12px', textAlign: 'center', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(30,58,138,0.6)', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 0 14px rgba(59,130,246,0.25)' }}>
                <span style={{ fontSize: '13px', fontWeight: 900, color: '#93c5fd', lineHeight: 1 }}>{s.value}</span>
              </div>
              <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(148,163,184,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <section className="mb-10">
          <div className="text-center mb-7">
            <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#f0f4ff', marginBottom: '4px', letterSpacing: '-0.5px' }}>How It Works</h2>
            <p style={{ fontSize: '13px', color: 'rgba(148,163,184,0.6)' }}>Three simple steps to skip the wait</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative">
            {steps.map((step, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.055)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '20px', padding: '28px 20px 20px', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', textAlign: 'center', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', width: '28px', height: '28px', borderRadius: '50%', background: '#1e3a8a', border: '1px solid rgba(96,165,250,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px rgba(59,130,246,0.3)' }}>
                  <span style={{ fontSize: '11px', fontWeight: 900, color: '#60a5fa' }}>{step.n}</span>
                </div>
                <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  {step.icon}
                </div>
                <h3 style={{ fontWeight: 800, color: '#f0f4ff', marginBottom: '8px', fontSize: '15px' }}>{step.title}</h3>
                <p style={{ fontSize: '13px', color: 'rgba(148,163,184,0.65)', lineHeight: 1.65 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Featured shops */}
        <section className="mb-10">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#f0f4ff', letterSpacing: '-0.4px' }}>Nearby Shops</h2>
            <Link to="/search" style={{ padding: '9px 18px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', borderRadius: '12px', color: '#fff', fontWeight: 700, fontSize: '13px', textDecoration: 'none', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
              View all
            </Link>
          </div>

          {featured.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.055)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '18px', padding: '18px' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div className="skeleton" style={{ height: '14px', borderRadius: '8px', width: '60%', marginBottom: '8px' }} />
                      <div className="skeleton" style={{ height: '11px', borderRadius: '8px', width: '35%' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {featured.map(shop => (
                <ShopCard key={shop.id} shop={shop} showJoinLink />
              ))}
            </div>
          )}
        </section>

        {/* CTA banner */}
        <section className="mb-10">
          <div style={{ background: 'rgba(255,255,255,0.055)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '24px', padding: '28px 28px', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#f0f4ff', marginBottom: '6px', letterSpacing: '-0.4px' }}>Own a shop?</h3>
              <p style={{ fontSize: '14px', color: 'rgba(148,163,184,0.65)', lineHeight: 1.65 }}>
                Get Wavit for your business. Manage your queue, reduce no-shows, send auto SMS alerts.
              </p>
            </div>
            <button
              onClick={() => navigate('/register')}
              style={{ padding: '13px 28px', borderRadius: '14px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff', fontSize: '14px', fontWeight: 800, boxShadow: '0 4px 20px rgba(59,130,246,0.4)', letterSpacing: '-0.2px', whiteSpace: 'nowrap' }}
            >
              Apply Now
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
