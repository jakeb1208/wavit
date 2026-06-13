import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { API_BASE } from '../lib/api';

interface RawTicket {
  exited_at: number | null;
  served_at: number | null;
  party_size?: number;
}

interface RawShop {
  id: string;
  name: string;
  category: string;
  num_staff: number;
  avg_service_minutes: number;
  queue_open: boolean;
  queue: RawTicket[];
  current_service_started_at: number | null;
}

function computeStats(shop: RawShop) {
  const isClinic = shop.category === 'Clinic';
  const numStaff = Math.max(1, shop.num_staff || 1);
  const avgSvc = Math.max(1, shop.avg_service_minutes || 15);
  const active = (shop.queue || []).filter(t => !t.exited_at);

  const waiting = active.reduce((s, t) => {
    if (!t.served_at) return s + (t.party_size || 1);
    if (isClinic) return s;
    const elapsed = (Date.now() - t.served_at) / 60000;
    const wave = Math.ceil((t.party_size || 1) / numStaff);
    return elapsed < avgSvc * wave ? s + Math.max(0, (t.party_size || 1) - numStaff) : s;
  }, 0);

  const queueLen = active.filter(t => !t.served_at).length;
  const waitMin = isClinic ? 0 : Math.ceil(queueLen / numStaff) * avgSvc;

  const isOpen = shop.queue_open !== false;
  const isClinicWithPeople = !isOpen && isClinic && active.length > 0;

  return { isClinic, numStaff, waiting, waitMin, isOpen, isClinicWithPeople };
}

function fmtWait(min: number) {
  if (min <= 0) return 'No wait';
  if (min < 60) return `~${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `~${h}h ${m}m` : `~${h}h`;
}

export default function WidgetPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const [shop, setShop] = useState<RawShop | null>(null);
  const [error, setError] = useState(false);

  const fetch_ = useCallback(async () => {
    if (!shopId) return;
    try {
      const res = await fetch(`${API_BASE}/shops/${shopId}`);
      if (!res.ok) { setError(true); return; }
      const data = await res.json();
      setShop(data);
    } catch {
      setError(true);
    }
  }, [shopId]);

  useEffect(() => {
    fetch_();
    const iv = setInterval(fetch_, 5000);
    return () => clearInterval(iv);
  }, [fetch_]);

  if (error) {
    return (
      <div style={containerStyle}>
        <p style={{ fontSize: '12px', color: 'rgba(148,163,184,0.5)', textAlign: 'center', margin: 0 }}>Shop not found</p>
      </div>
    );
  }

  if (!shop) {
    return (
      <div style={containerStyle}>
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(148,163,184,0.3)', animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
        </div>
      </div>
    );
  }

  const { isClinic, numStaff, waiting, waitMin, isOpen, isClinicWithPeople } = computeStats(shop);
  const showLive = isOpen || isClinicWithPeople;

  const statusDot = isOpen ? '#22c55e' : isClinicWithPeople ? '#f59e0b' : '#6b7280';
  const statusLabel = isOpen ? 'Open' : isClinicWithPeople ? 'Likely closed' : 'Closed';
  const statusColor = isOpen ? '#4ade80' : isClinicWithPeople ? '#fbbf24' : 'rgba(148,163,184,0.5)';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: transparent; font-family: 'Inter', system-ui, sans-serif; }
        @keyframes pulse { 0%,100%{opacity:.3} 50%{opacity:1} }
      `}</style>
      <div style={containerStyle}>

        {/* Top row: status + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '2px 8px', borderRadius: '20px',
            background: isOpen ? 'rgba(34,197,94,0.1)' : isClinicWithPeople ? 'rgba(245,158,11,0.1)' : 'rgba(107,114,128,0.1)',
            border: `1px solid ${isOpen ? 'rgba(34,197,94,0.25)' : isClinicWithPeople ? 'rgba(245,158,11,0.25)' : 'rgba(107,114,128,0.2)'}`,
            flexShrink: 0,
          }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: statusDot, boxShadow: isOpen ? `0 0 5px ${statusDot}` : 'none', display: 'inline-block' }} />
            <span style={{ fontSize: '10px', fontWeight: 700, color: statusColor }}>{statusLabel}</span>
          </span>
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {shop.name}
          </span>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
          {/* Staff / doctors */}
          <StatChip
            icon={isClinic ? (
              <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth="2" d="M17 20H7m10-8a3 3 0 11-6 0 3 3 0 016 0zM3 20a9 9 0 0118 0"/></svg>
            ) : (
              <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth="2" d="M17 20H7m10-8a3 3 0 11-6 0 3 3 0 016 0zM3 20a9 9 0 0118 0"/></svg>
            )}
            label={`${numStaff} ${isClinic ? 'doctor' + (numStaff !== 1 ? 's' : '') : 'staff'}`}
            color="#a78bfa"
            bg="rgba(139,92,246,0.1)"
            border="rgba(139,92,246,0.2)"
          />

          {/* Waiting */}
          <StatChip
            icon={<svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h10"/></svg>}
            label={showLive ? `${waiting} waiting` : '—'}
            color="#fbbf24"
            bg="rgba(245,158,11,0.1)"
            border="rgba(245,158,11,0.2)"
          />

          {/* Wait time — shops only */}
          {!isClinic && (
            <StatChip
              icon={<svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2"/><path strokeLinecap="round" strokeWidth="2" d="M12 6v6l4 2"/></svg>}
              label={showLive ? fmtWait(waitMin) : 'Closed'}
              color={waitMin === 0 && isOpen ? '#34d399' : '#93c5fd'}
              bg={waitMin === 0 && isOpen ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)'}
              border={waitMin === 0 && isOpen ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.18)'}
            />
          )}
        </div>

        {/* Branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(148,163,184,0.3)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Live queue by</span>
          <span style={{ fontSize: '10px', fontWeight: 900, color: 'rgba(96,165,250,0.45)', letterSpacing: '-0.5px' }}>wavit</span>
        </div>
      </div>
    </>
  );
}

function StatChip({ icon, label, color, bg, border }: {
  icon: React.ReactNode;
  label: string;
  color: string;
  bg: string;
  border: string;
}) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '3px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 700,
      background: bg, border: `1px solid ${border}`, color,
      whiteSpace: 'nowrap',
    }}>
      {icon}
      {label}
    </span>
  );
}

const containerStyle: React.CSSProperties = {
  padding: '12px 14px',
  background: 'linear-gradient(135deg, rgba(15,22,41,0.97) 0%, rgba(10,16,32,0.97) 100%)',
  borderRadius: '14px',
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  minHeight: '100px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  fontFamily: "'Inter', system-ui, sans-serif",
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
};
