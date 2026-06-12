import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { API_BASE } from '../lib/api';
import ShopCard from '../components/ShopCard';
import { ApiShop } from '../store/queueStore';
import { isNative } from '../lib/platform';
import { MapPin, Phone, Clock, ChevronLeft, Calendar, Globe } from 'lucide-react';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getOpenDays(closedDays: string | null | undefined): string[] {
  if (!closedDays) return DAY_NAMES;
  const closed = closedDays.split(',').map(Number).filter(n => !isNaN(n));
  return DAY_NAMES.filter((_, i) => !closed.includes(i));
}

function fmt12(time: string) {
  const [h, m] = time.split(':').map(Number);
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function ShopProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const native = isNative();
  const [shop, setShop] = useState<(ApiShop & { closed_days?: string }) | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchShop = useCallback(async () => {
    if (!slug) return;
    try {
      const res = await fetch(`${API_BASE}/shops/by-slug/${slug}`);
      if (res.status === 404) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      const mapped: ApiShop & { closed_days?: string } = {
        id: data.id,
        name: data.name,
        phone: data.phone,
        avgServiceMinutes: data.avg_service_minutes,
        numStaff: (data.num_staff as number) || 1,
        category: data.category,
        zipCode: (data.zip_code as string) || null,
        address: (data.address as string) || null,
        currentServiceStartedAt: data.current_service_started_at ? Number(data.current_service_started_at) : null,
        queue: ((data.queue as Record<string, unknown>[]) || []).map((t: Record<string, unknown>) => ({
          id: t.id as string,
          name: (t.name as string) || '',
          phone: (t.phone as string) || '',
          joinedAt: Number(t.joined_at),
          servedAt: t.served_at ? Number(t.served_at) : null,
          exitRequestedAt: t.exit_requested_at ? Number(t.exit_requested_at) : null,
          exitedAt: t.exited_at ? Number(t.exited_at) : null,
          reminderSentAt: t.reminder_sent_at ? Number(t.reminder_sent_at) : null,
          partySize: Number(t.party_size) || 1,
        })),
        waitRange: (data.waitRange as string) || (data.wait_range as string) || 'No wait',
        queueOpen: data.queue_open !== false,
        openingTime: (data.opening_time as string) || '09:00',
        closingTime: (data.closing_time as string) || '18:00',
        allowRemoteJoin: data.allow_remote_join !== false,
        logoUrl: (data.logo_url as string) || null,
        closed_days: (data.closed_days as string) || '',
        website: (data.website as string) || null,
      };
      setShop(mapped);
      setLoading(false);
    } catch {
    }
  }, [slug]);

  useEffect(() => {
    fetchShop();
    const interval = setInterval(fetchShop, 5000);
    return () => clearInterval(interval);
  }, [fetchShop]);

  const BG = '#070b14';
  const GLASS = 'rgba(255,255,255,0.055)';
  const BORDER = 'rgba(255,255,255,0.09)';

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'rgba(148,163,184,0.6)', fontSize: '14px', fontFamily: "'Inter', system-ui, sans-serif" }}>Loading…</div>
      </div>
    );
  }

  if (notFound || !shop) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', color: '#f0f4ff', fontFamily: "'Inter', system-ui, sans-serif", padding: '24px' }}>
        <div style={{ fontSize: '48px' }}>🔍</div>
        <p style={{ fontWeight: 700, fontSize: '18px', textAlign: 'center' }}>Shop not found</p>
        <p style={{ color: 'rgba(148,163,184,0.65)', fontSize: '14px', textAlign: 'center' }}>This shop may not be on Wavit yet.</p>
        <Link to="/" style={{ color: '#60a5fa', fontWeight: 600, textDecoration: 'none', marginTop: '8px' }}>← Back to home</Link>
      </div>
    );
  }

  const isClinic = shop.category === 'Clinic';
  const openDays = getOpenDays(shop.closed_days);
  const topPad = native ? '20px' : '84px';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: `radial-gradient(ellipse 80% 40% at 50% 0%, rgba(30,58,138,0.3) 0%, ${BG} 60%)`,
        color: '#f0f4ff',
        fontFamily: "'Inter', system-ui, sans-serif",
        paddingBottom: '60px',
      }}
    >
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: `${topPad} 20px 0` }}>

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            background: 'none', border: 'none', color: '#60a5fa',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            padding: '0 0 20px 0',
          }}
        >
          <ChevronLeft size={15} /> Back
        </button>

        {/* Header: logo + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
          {shop.logoUrl ? (
            <img
              src={shop.logoUrl}
              alt={shop.name}
              style={{ width: '68px', height: '68px', borderRadius: '22px', objectFit: 'cover', flexShrink: 0, boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
            />
          ) : (
            <div
              style={{
                width: '68px', height: '68px', borderRadius: '22px', flexShrink: 0,
                background: isClinic
                  ? 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)'
                  : 'linear-gradient(135deg, #1d4ed8 0%, #6366f1 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(59,130,246,0.3)',
              }}
            >
              <span style={{ fontSize: '24px', fontWeight: 900, color: '#fff', letterSpacing: '-1px' }}>
                {shop.name.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || shop.name.slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.5px', marginBottom: '6px', lineHeight: 1.1 }}>
              {shop.name}
            </h1>
            <span
              style={{
                fontSize: '11px', fontWeight: 700, color: 'rgba(148,163,184,0.7)',
                padding: '3px 10px', borderRadius: '8px',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)',
                textTransform: 'uppercase', letterSpacing: '0.07em',
              }}
            >
              {shop.category}
            </span>
          </div>
        </div>

        {/* Info cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>

          {/* Hours */}
          <div
            style={{
              background: GLASS, border: `1px solid ${BORDER}`,
              borderRadius: '16px', padding: '16px 18px',
              display: 'flex', alignItems: 'flex-start', gap: '14px',
            }}
          >
            <Clock size={16} style={{ color: '#60a5fa', flexShrink: 0, marginTop: '1px' }} />
            <div>
              <p style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(148,163,184,0.5)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '5px' }}>Hours</p>
              <p style={{ fontSize: '15px', fontWeight: 700 }}>{fmt12(shop.openingTime)} – {fmt12(shop.closingTime)}</p>
            </div>
          </div>

          {/* Open days */}
          <div
            style={{
              background: GLASS, border: `1px solid ${BORDER}`,
              borderRadius: '16px', padding: '16px 18px',
              display: 'flex', alignItems: 'flex-start', gap: '14px',
            }}
          >
            <Calendar size={16} style={{ color: '#a78bfa', flexShrink: 0, marginTop: '1px' }} />
            <div>
              <p style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(148,163,184,0.5)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '5px' }}>Open Days</p>
              <p style={{ fontSize: '14px', fontWeight: 600 }}>{openDays.join(', ')}</p>
            </div>
          </div>

          {/* ZIP code */}
          {shop.zipCode && (
            <div
              style={{
                background: GLASS, border: `1px solid ${BORDER}`,
                borderRadius: '16px', padding: '16px 18px',
                display: 'flex', alignItems: 'center', gap: '14px',
              }}
            >
              <MapPin size={16} style={{ color: '#34d399', flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(148,163,184,0.5)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '5px' }}>ZIP Code</p>
                <p style={{ fontSize: '14px', fontWeight: 700 }}>{shop.zipCode}</p>
              </div>
            </div>
          )}

          {/* Clinic: address */}
          {isClinic && shop.address && (
            <div
              style={{
                background: GLASS, border: `1px solid ${BORDER}`,
                borderRadius: '16px', padding: '16px 18px',
                display: 'flex', alignItems: 'flex-start', gap: '14px',
              }}
            >
              <MapPin size={16} style={{ color: '#34d399', flexShrink: 0, marginTop: '1px' }} />
              <div>
                <p style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(148,163,184,0.5)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '5px' }}>Address</p>
                <p style={{ fontSize: '14px', fontWeight: 600 }}>{shop.address}</p>
              </div>
            </div>
          )}

          {/* Clinic: phone (tappable) */}
          {isClinic && shop.phone && (
            <a
              href={`tel:${shop.phone}`}
              style={{
                background: GLASS, border: `1px solid ${BORDER}`,
                borderRadius: '16px', padding: '16px 18px',
                display: 'flex', alignItems: 'center', gap: '14px',
                textDecoration: 'none', color: 'inherit',
              }}
            >
              <Phone size={16} style={{ color: '#60a5fa', flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(148,163,184,0.5)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '5px' }}>Phone</p>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#93c5fd' }}>{shop.phone}</p>
              </div>
            </a>
          )}

          {/* Website (all shops) */}
          {shop.website && (
            <a
              href={shop.website.startsWith('http') ? shop.website : `https://${shop.website}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: GLASS, border: `1px solid ${BORDER}`,
                borderRadius: '16px', padding: '16px 18px',
                display: 'flex', alignItems: 'center', gap: '14px',
                textDecoration: 'none', color: 'inherit',
              }}
            >
              <Globe size={16} style={{ color: '#34d399', flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(148,163,184,0.5)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '5px' }}>Website</p>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#6ee7b7' }}>{shop.website.replace(/^https?:\/\//, '')}</p>
              </div>
            </a>
          )}
        </div>

        {/* Live status */}
        <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(148,163,184,0.45)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>
          Live Status
        </p>
        <ShopCard shop={shop} showJoinLink />
      </div>
    </div>
  );
}
