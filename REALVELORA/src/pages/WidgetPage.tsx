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
  if (min < 60) return `~${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `~${h}h${m}m` : `~${h}h`;
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

  const shell = (children: React.ReactNode) => (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:transparent;font-family:'Inter',system-ui,sans-serif;width:fit-content;height:fit-content;}
        @keyframes pulse{0%,100%{opacity:.3}50%{opacity:1}}
      `}</style>
      <div style={card}>{children}</div>
    </>
  );

  if (error) return shell(
    <span style={{ fontSize: '11px', color: 'rgba(148,163,184,0.4)' }}>Shop not found</span>
  );

  if (!shop) return shell(
    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
      {[0,1,2].map(i => (
        <div key={i} style={{ width:'5px', height:'5px', borderRadius:'50%', background:'rgba(148,163,184,0.3)', animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />
      ))}
    </div>
  );

  const { isClinic, numStaff, waiting, waitMin, isOpen, isClinicWithPeople } = computeStats(shop);
  const showLive = isOpen || isClinicWithPeople;

  const dotColor = isOpen ? '#22c55e' : isClinicWithPeople ? '#f59e0b' : '#6b7280';
  const statusLabel = isOpen ? 'Open' : isClinicWithPeople ? 'Likely closed' : 'Closed';
  const statusBg = isOpen ? 'rgba(34,197,94,0.12)' : isClinicWithPeople ? 'rgba(245,158,11,0.12)' : 'rgba(107,114,128,0.1)';
  const statusBorder = isOpen ? 'rgba(34,197,94,0.28)' : isClinicWithPeople ? 'rgba(245,158,11,0.28)' : 'rgba(107,114,128,0.2)';
  const statusColor = isOpen ? '#4ade80' : isClinicWithPeople ? '#fbbf24' : 'rgba(148,163,184,0.45)';

  return shell(
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap' }}>

      {/* Status badge */}
      <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', padding:'3px 8px', borderRadius:'20px', background:statusBg, border:`1px solid ${statusBorder}`, flexShrink:0 }}>
        <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:dotColor, boxShadow:isOpen?`0 0 5px ${dotColor}`:'none', display:'inline-block', flexShrink:0 }} />
        <span style={{ fontSize:'10px', fontWeight:700, color:statusColor, whiteSpace:'nowrap' }}>{statusLabel}</span>
      </span>

      {/* Divider */}
      <span style={{ width:'1px', height:'16px', background:'rgba(255,255,255,0.08)', flexShrink:0 }} />

      {/* Shop name */}
      <span style={{ fontSize:'12px', fontWeight:800, color:'#f0f4ff', letterSpacing:'-0.2px', whiteSpace:'nowrap', maxWidth:'140px', overflow:'hidden', textOverflow:'ellipsis' }}>
        {shop.name}
      </span>

      {/* Divider */}
      <span style={{ width:'1px', height:'16px', background:'rgba(255,255,255,0.08)', flexShrink:0 }} />

      {/* Staff */}
      <Chip label={`${numStaff} ${isClinic ? (numStaff===1?'doctor':'doctors') : 'staff'}`} color="#a78bfa" bg="rgba(139,92,246,0.12)" border="rgba(139,92,246,0.22)" />

      {/* Waiting */}
      <Chip label={showLive ? `${waiting} waiting` : '—'} color="#fbbf24" bg="rgba(245,158,11,0.1)" border="rgba(245,158,11,0.2)" />

      {/* Wait time — shops only */}
      {!isClinic && (
        <Chip
          label={showLive ? fmtWait(waitMin) : 'Closed'}
          color={waitMin===0 && isOpen ? '#34d399' : '#93c5fd'}
          bg={waitMin===0 && isOpen ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)'}
          border={waitMin===0 && isOpen ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.18)'}
        />
      )}

      {/* Divider */}
      <span style={{ width:'1px', height:'16px', background:'rgba(255,255,255,0.08)', flexShrink:0 }} />

      {/* Branding */}
      <span style={{ fontSize:'9px', fontWeight:900, color:'rgba(96,165,250,0.35)', letterSpacing:'-0.3px', whiteSpace:'nowrap', flexShrink:0 }}>wavit</span>
    </div>
  );
}

function Chip({ label, color, bg, border }: { label: string; color: string; bg: string; border: string }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 8px', borderRadius:'8px', fontSize:'10px', fontWeight:700, background:bg, border:`1px solid ${border}`, color, whiteSpace:'nowrap', flexShrink:0 }}>
      {label}
    </span>
  );
}

const card: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '8px 12px',
  background: 'linear-gradient(135deg, rgba(15,22,41,0.97) 0%, rgba(10,16,32,0.97) 100%)',
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  fontFamily: "'Inter', system-ui, sans-serif",
  boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
  width: 'fit-content',
};
