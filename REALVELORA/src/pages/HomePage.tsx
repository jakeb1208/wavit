import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Clock, Users, QrCode, Smartphone, MessageCircle, Instagram, Scissors, Sparkles, Building2 } from 'lucide-react';
import { useQueueStore } from '../store/queueStore';
import ShopCard from '../components/ShopCard';
import WavitLogo from '../components/WavitLogo';
import { isNative } from '../lib/platform';
import { API_BASE } from '../lib/api';

interface HomeContent {
  hero_badge: string;
  hero_headline: string;
  hero_subtext: string;
  hero_btn1: string;
  hero_btn2: string;
  hero_btn3: string;
  live_title: string;
  live_subtitle: string;
  live_cta: string;
  how_title: string;
  how_subtitle: string;
  how_steps: { title: string; desc: string }[];
  biz_badge: string;
  biz_headline: string;
  biz_body: string;
  biz_btn: string;
  biz_features: { title: string; desc: string }[];
}

const DEFAULT_HOME: HomeContent = {
  hero_badge: 'Live Queue Updates Active',
  hero_headline: 'Never Wait\nBlindly.',
  hero_subtext: "Real-time queues for the places you love. See your spot, track your wait, and show up exactly when you're needed.",
  hero_btn1: 'View Live Shops',
  hero_btn2: 'Join a Queue',
  hero_btn3: 'For Businesses',
  live_title: 'Live Right Now',
  live_subtitle: "See what's happening at shops near you",
  live_cta: 'View All Shops',
  how_title: 'How It Works',
  how_subtitle: "Skip the physical wait. Claim your spot from anywhere and show up exactly when you're up.",
  how_steps: [
    { title: 'Scan or Search', desc: 'Find your shop via QR code or search by name in our directory.' },
    { title: 'Watch Your Wait', desc: 'See your live position and estimated wait time updated in real-time.' },
    { title: 'Get Texted', desc: 'Receive an SMS the moment your turn is approaching. No app required.' },
  ],
  biz_badge: 'For Businesses',
  biz_headline: 'Built for Modern Businesses',
  biz_body: 'Transform your waiting area. Give your customers their time back while keeping your chairs full and your staff efficient.',
  biz_btn: 'Apply to Join Wavit',
  biz_features: [
    { title: 'Live Queue Management', desc: "Easily manage who's next and see incoming customers in real-time from your dashboard." },
    { title: 'Auto SMS Notifications', desc: 'Customers get automated text updates as their turn approaches — no app needed.' },
    { title: 'Real-time Analytics', desc: 'Track wait times, customer flow, and staff efficiency with detailed reporting.' },
  ],
};

function computeWaitMinutes(shop: any): number {
  const active = (shop.queue || []).filter((t: any) => !t.exitedAt && !t.servedAt);
  return Math.round((active.length * (shop.avgServiceMinutes || 15)) / Math.max(1, shop.numStaff || 1));
}

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
      <div
        style={{
          padding: '20px 20px 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <WavitLogo size="md" asDiv />
          <p style={{ fontSize: '12px', color: 'rgba(148,163,184,0.7)', fontWeight: 500, marginTop: '4px', fontFamily: "'Inter', system-ui, sans-serif" }}>
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
          <Link to="/terms" style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(148,163,184,0.45)', textDecoration: 'none', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }}>
            Terms of Service
          </Link>
          <span style={{ fontSize: '12px', color: 'rgba(148,163,184,0.2)' }}>·</span>
          <Link to="/privacy" style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(148,163,184,0.45)', textDecoration: 'none', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }}>
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}

const CATEGORY_ICONS: Record<string, any> = {
  Barber: Scissors,
  Salon: Sparkles,
  Beauty: Sparkles,
};

export default function HomePage() {
  const shops = useQueueStore(s => s.shops);
  const fetchShops = useQueueStore(s => s.fetchShops);
  const navigate = useNavigate();
  const location = useLocation();
  const native = isNative();
  const liveShopsRef = useRef<HTMLElement>(null);
  const [content, setContent] = useState<HomeContent>(DEFAULT_HOME);

  useEffect(() => {
    fetch(`${API_BASE}/content/home`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setContent({ ...DEFAULT_HOME, ...data }); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!native) {
      fetchShops();
      const interval = setInterval(fetchShops, 10000);
      return () => clearInterval(interval);
    }
  }, [fetchShops, native]);

  useEffect(() => {
    const state = location.state as { scrollTo?: string } | null;
    if (state?.scrollTo) {
      const el = document.getElementById(state.scrollTo);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
      }
      window.history.replaceState({}, '', location.pathname);
    }
  }, [location.state]);

  if (native) return <NativeHomePage />;

  const openShops = shops.filter(s => s.queueOpen);
  const featuredShops = openShops.slice(0, 3);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#070b14',
        color: '#fff',
        fontFamily: "'Inter', system-ui, sans-serif",
        overflowX: 'hidden',
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        .wv-blob {
          position: fixed;
          filter: blur(80px);
          z-index: 0;
          opacity: 0.4;
          animation: wv-float 10s infinite ease-in-out alternate;
          pointer-events: none;
        }
        @keyframes wv-float {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -50px) scale(1.1); }
          100% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .wv-blob-1 { top: -10%; left: -10%; width: 50vw; height: 50vw; background: radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%); }
        .wv-blob-2 { top: 20%; right: -20%; width: 60vw; height: 60vw; background: radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%); animation-delay: -5s; }
        .wv-blob-3 { bottom: -20%; left: 20%; width: 50vw; height: 50vw; background: radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%); animation-delay: -2s; }

        .wv-glass {
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.06);
        }
        .wv-glass:hover {
          border-color: rgba(255,255,255,0.1);
          box-shadow: 0 8px 32px rgba(59,130,246,0.12);
        }

        .wv-btn { border-radius: 9999px; transition: all 0.2s ease; cursor: pointer; font-family: 'Inter', system-ui, sans-serif; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: none; }
        .wv-btn:hover { transform: scale(1.03); }
        .wv-btn:active { transform: scale(0.98); }

        .wv-btn-primary { background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: #fff; box-shadow: 0 0 20px rgba(59,130,246,0.4); }
        .wv-btn-primary:hover { box-shadow: 0 0 30px rgba(139,92,246,0.55); }

        .wv-btn-secondary { background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.12) !important; color: #fff; }
        .wv-btn-secondary:hover { border-color: rgba(59,130,246,0.45) !important; box-shadow: 0 0 15px rgba(59,130,246,0.18); background: rgba(255,255,255,0.08); }

        .wv-btn-outline { background: transparent; border: 1px solid rgba(255,255,255,0.12) !important; color: rgba(255,255,255,0.85); }
        .wv-btn-outline:hover { border-color: rgba(255,255,255,0.22) !important; background: rgba(255,255,255,0.04); }

        .wv-shop-card { transition: transform 0.25s ease, box-shadow 0.25s ease; }
        .wv-shop-card:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(59,130,246,0.18); }

        .wv-join-btn { transition: all 0.2s ease; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; border-radius: 12px; font-family: 'Inter', system-ui, sans-serif; font-weight: 500; cursor: pointer; }
        .wv-join-btn:hover { background: #3b82f6; border-color: #3b82f6; box-shadow: 0 0 16px rgba(59,130,246,0.4); }

        .wv-step-card:hover .wv-step-glow { opacity: 1; }

        @keyframes wv-pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.7); }
          70% { box-shadow: 0 0 0 10px rgba(34,197,94,0); }
          100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
        }
        .wv-status-dot { animation: wv-pulse-ring 2s infinite; }

        .wv-feature-card { transition: transform 0.25s ease; }
        .wv-feature-card:hover { transform: translateY(-4px); }
      `}} />

      {/* Spacer for fixed navbar */}
      <div style={{ height: '72px' }} />

      <main style={{ position: 'relative', zIndex: 1 }}>
        {/* ── HERO ── */}
        <section
          style={{
            minHeight: 'calc(100dvh - 72px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 24px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: "url(\"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNCkiLz48L3N2Zz4=\")",
              maskImage: 'linear-gradient(to bottom, white, transparent)',
              WebkitMaskImage: 'linear-gradient(to bottom, white, transparent)',
              pointerEvents: 'none',
            }}
          />

          <div style={{ maxWidth: '900px', width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px' }}>
            <div
              className="wv-glass"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '9999px', fontSize: '13px', fontWeight: 500, color: 'rgba(203,213,225,0.85)' }}
            >
              <span className="wv-status-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
              {content.hero_badge}
            </div>

            <h1
              style={{
                fontSize: 'clamp(52px, 9vw, 96px)',
                fontWeight: 800,
                letterSpacing: '-0.04em',
                lineHeight: 1.05,
                background: 'linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.55) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                margin: 0,
                whiteSpace: 'pre-line',
              }}
            >
              {content.hero_headline}
            </h1>

            <p style={{ fontSize: 'clamp(16px, 2.5vw, 22px)', color: 'rgba(148,163,184,0.9)', fontWeight: 400, lineHeight: 1.65, maxWidth: '600px', margin: 0 }}>
              {content.hero_subtext}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', width: '100%' }}>
              <button
                className="wv-btn wv-btn-primary"
                style={{ padding: '16px 32px', fontSize: '16px' }}
                onClick={() => scrollTo('live-shops')}
              >
                {content.hero_btn1}
                <ArrowRight size={18} />
              </button>
              <button
                className="wv-btn wv-btn-secondary"
                style={{ padding: '16px 32px', fontSize: '16px' }}
                onClick={() => navigate('/search')}
              >
                {content.hero_btn2}
              </button>
              <button
                className="wv-btn wv-btn-outline"
                style={{ padding: '16px 32px', fontSize: '16px' }}
                onClick={() => scrollTo('for-businesses')}
              >
                {content.hero_btn3}
              </button>
            </div>
          </div>
        </section>

        {/* ── LIVE RIGHT NOW ── */}
        <section id="live-shops" ref={liveShopsRef as any} style={{ padding: '96px 24px', position: 'relative' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div style={{ marginBottom: '56px' }}>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, marginBottom: '12px', letterSpacing: '-0.02em' }}>
                {content.live_title}
              </h2>
              <p style={{ color: 'rgba(148,163,184,0.75)', fontSize: '17px', fontWeight: 400 }}>
                {content.live_subtitle}
              </p>
            </div>

            {featuredShops.length === 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="wv-glass" style={{ borderRadius: '24px', padding: '24px', height: '220px' }}>
                    <div className="skeleton" style={{ height: '16px', width: '55%', borderRadius: '8px', marginBottom: '12px', background: 'rgba(255,255,255,0.08)' }} />
                    <div className="skeleton" style={{ height: '12px', width: '35%', borderRadius: '6px', background: 'rgba(255,255,255,0.06)' }} />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                {featuredShops.map(shop => {
                  const activeQueue = (shop.queue || []).filter((t: any) => !t.exitedAt && !t.servedAt);
                  const waitMin = computeWaitMinutes(shop);
                  const Icon = CATEGORY_ICONS[shop.category] || Building2;
                  return (
                    <div key={shop.id} className="wv-glass wv-shop-card" style={{ borderRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', flexShrink: 0 }}>
                            <Icon size={22} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>{shop.name}</div>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(148,163,184,0.7)', padding: '3px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{shop.category || 'Shop'}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 500, padding: '5px 10px', borderRadius: '9999px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
                          <span className="wv-status-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: activeQueue.length > 5 ? '#eab308' : '#22c55e' }} />
                          {activeQueue.length > 5 ? 'Busy' : 'Open'}
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                        {[
                          { icon: <Clock size={13} />, label: 'Wait Time', value: waitMin > 0 ? `~${waitMin} min` : 'No wait' },
                          { icon: <Users size={13} />, label: 'In Queue', value: String(activeQueue.length) },
                        ].map((stat, i) => (
                          <div key={i} style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '14px', padding: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(148,163,184,0.65)', fontSize: '12px', marginBottom: '6px' }}>
                              {stat.icon} {stat.label}
                            </div>
                            <div style={{ fontSize: '22px', fontWeight: 700 }}>{stat.value}</div>
                          </div>
                        ))}
                      </div>

                      <div style={{ marginTop: 'auto' }}>
                        <button
                          className="wv-join-btn"
                          style={{ width: '100%', padding: '12px', fontSize: '14px' }}
                          onClick={() => navigate(`/join/${shop.id}`)}
                        >
                          {shop.allow_remote_join === false ? 'Join Queue at Business' : 'Join Queue'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: '40px' }}>
              <button
                className="wv-btn wv-btn-secondary"
                style={{ padding: '14px 32px', fontSize: '15px' }}
                onClick={() => navigate('/search')}
              >
                {content.live_cta}
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section
          style={{
            padding: '96px 24px',
            position: 'relative',
            background: 'rgba(0,0,0,0.2)',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '64px' }}>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, marginBottom: '12px', letterSpacing: '-0.02em' }}>
                {content.how_title}
              </h2>
              <p style={{ color: 'rgba(148,163,184,0.75)', fontSize: '17px', maxWidth: '540px', margin: '0 auto', lineHeight: 1.65 }}>
                {content.how_subtitle}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '32px', position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  top: '40px',
                  left: '15%',
                  right: '15%',
                  height: '1px',
                  background: 'linear-gradient(to right, transparent, rgba(59,130,246,0.2), transparent)',
                  display: 'none',
                }}
                className="wv-step-line"
              />

              {[
                { ...content.how_steps[0], icon: QrCode },
                { ...content.how_steps[1], icon: Smartphone },
                { ...content.how_steps[2], icon: MessageCircle },
              ].map((step, i) => (
                <div key={i} className="wv-step-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0' }}>
                  <div style={{ position: 'relative', width: '80px', height: '80px', marginBottom: '24px' }}>
                    <div
                      className="wv-glass wv-step-glow"
                      style={{ width: '80px', height: '80px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', transition: 'all 0.3s ease' }}
                    >
                      <step.icon size={32} />
                    </div>
                    <div
                      style={{
                        position: 'absolute',
                        top: '-10px',
                        right: '-10px',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: '#3b82f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 800,
                        color: '#fff',
                        boxShadow: '0 0 14px rgba(59,130,246,0.6)',
                      }}
                    >
                      {i + 1}
                    </div>
                  </div>
                  <h3 style={{ fontWeight: 700, fontSize: '18px', marginBottom: '10px', letterSpacing: '-0.01em' }}>{step.title}</h3>
                  <p style={{ color: 'rgba(148,163,184,0.7)', lineHeight: 1.65, fontSize: '15px', maxWidth: '260px' }}>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FOR BUSINESSES ── */}
        <section
          id="for-businesses"
          style={{
            padding: '96px 24px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, rgba(59,130,246,0.06))', pointerEvents: 'none' }} />

          <div style={{ maxWidth: '1280px', margin: '0 auto', position: 'relative' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '64px', alignItems: 'center' }}>
              <div style={{ flex: '1 1 280px', maxWidth: '400px' }}>
                <div
                  style={{
                    display: 'inline-block',
                    padding: '6px 14px',
                    borderRadius: '9999px',
                    background: 'rgba(139,92,246,0.1)',
                    border: '1px solid rgba(139,92,246,0.22)',
                    color: '#a78bfa',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: '20px',
                  }}
                >
                  {content.biz_badge}
                </div>
                <h2
                  style={{
                    fontSize: 'clamp(32px, 4vw, 48px)',
                    fontWeight: 800,
                    lineHeight: 1.15,
                    letterSpacing: '-0.03em',
                    marginBottom: '20px',
                  }}
                >
                  {content.biz_headline}
                </h2>
                <p style={{ color: 'rgba(148,163,184,0.75)', fontSize: '16px', lineHeight: 1.7, marginBottom: '32px' }}>
                  {content.biz_body}
                </p>
                <button
                  className="wv-btn wv-btn-primary"
                  style={{ padding: '16px 32px', fontSize: '16px' }}
                  onClick={() => navigate('/register')}
                >
                  {content.biz_btn}
                </button>
              </div>

              <div style={{ flex: '2 1 400px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {[
                  { ...content.biz_features[0], icon: Users },
                  { ...content.biz_features[1], icon: MessageCircle },
                  { ...content.biz_features[2], icon: Building2 },
                ].map((feature, i) => (
                  <div key={i} className="wv-glass wv-feature-card" style={{ borderRadius: '24px', padding: '24px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa', marginBottom: '16px' }}>
                      <feature.icon size={22} />
                    </div>
                    <h3 style={{ fontWeight: 700, fontSize: '15px', marginBottom: '8px', letterSpacing: '-0.01em' }}>{feature.title}</h3>
                    <p style={{ color: 'rgba(148,163,184,0.65)', fontSize: '13px', lineHeight: 1.65 }}>{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
