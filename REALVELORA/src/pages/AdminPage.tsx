import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { API_BASE, adminFetch, clearAdminToken } from '../lib/api';
import WavitLogo from '../components/WavitLogo';

interface Ticket {
  id: string;
  shop_id: string;
  name: string;
  phone: string;
  joined_at: number;
  served_at: number | null;
  exited_at: number | null;
  reminder_sent_at: number | null;
  party_size?: number;
  additional_info?: string;
}
interface Shop {
  id: string;
  name: string;
  category: string;
  zip_code: string | null;
  avg_service_minutes: number;
  num_staff: number;
  waitRange: string;
  current_service_started_at: number | null;
  analytics_enabled: boolean;
  analytics_email: string | null;
  last_analytics_sent: number | null;
  queue_open: boolean;
  opening_time: string;
  closing_time: string;
  logo_url: string | null;
  closed_days: string;
}
interface AdminData { shop: Shop; queue: Ticket[]; recentlyServed: Ticket[]; }
interface CompetitorAnalytics { count: number; zipCode: string; category: string; avgTotal: number; avgServed: number; avgNoShowRate: number; avgWaitMin: number; avgLeftEarly: number; }
interface Analytics { total: number; served: number; leftBeforeServed: number; noShowRate: number; avgWaitMin: number; days: number; competitors: CompetitorAnalytics | null; }

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ${Math.floor((diff % 3600000) / 60000)}m ago`;
}
function waitTime(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

/* ── Design tokens ── */
const BG    = '#070b14';
const GLASS = 'rgba(255,255,255,0.04)';
const GLASSH= 'rgba(255,255,255,0.07)';
const BORDER= 'rgba(255,255,255,0.08)';
const BORDERL='rgba(255,255,255,0.12)';
const TEXT  = '#f0f4ff';
const TEXTSUB='rgba(148,163,184,0.7)';
const TEXTMID='rgba(203,213,225,0.85)';

function DarkCard({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: '20px', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', ...style }}>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: '11px', fontWeight: 700, color: TEXTSUB, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>{children}</p>;
}

function DarkInput({ style = {}, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        width: '100%', padding: '11px 14px',
        background: 'rgba(255,255,255,0.06)', border: `1px solid ${BORDERL}`,
        borderRadius: '12px', color: TEXT, fontSize: '14px',
        outline: 'none', fontFamily: "'Inter', sans-serif",
        boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s',
        ...style,
      }}
      onFocus={e => { e.target.style.borderColor = 'rgba(59,130,246,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)'; }}
      onBlur={e => { e.target.style.borderColor = BORDERL; e.target.style.boxShadow = 'none'; }}
    />
  );
}

function PrimaryBtn({ children, disabled, onClick, style = {}, type = 'button' }: { children: React.ReactNode; disabled?: boolean; onClick?: () => void; style?: React.CSSProperties; type?: 'button'|'submit' }) {
  return (
    <button
      type={type} disabled={disabled} onClick={onClick}
      style={{ width: '100%', padding: '12px', background: disabled ? 'rgba(59,130,246,0.3)' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: "'Inter', sans-serif", transition: 'all 0.2s', boxShadow: disabled ? 'none' : '0 0 20px rgba(59,130,246,0.35)', opacity: disabled ? 0.6 : 1, ...style }}
    >{children}</button>
  );
}

function SavedBtn({ children, saved, saving, disabled, onClick }: { children: React.ReactNode; saved?: boolean; saving?: boolean; disabled?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick} disabled={disabled || saving}
      style={{ width: '100%', padding: '12px', borderRadius: '12px', border: saved ? '1px solid rgba(16,185,129,0.35)' : 'none', background: saved ? 'rgba(16,185,129,0.15)' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: saved ? '#34d399' : '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif", transition: 'all 0.2s', boxShadow: saved ? '0 0 12px rgba(16,185,129,0.2)' : '0 0 20px rgba(59,130,246,0.3)', opacity: (disabled || saving) ? 0.6 : 1 }}
    >{saving ? 'Saving…' : children}</button>
  );
}

function Toggle({ on, onChange, disabled }: { on: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onChange} disabled={disabled}
      style={{ position: 'relative', width: '44px', height: '24px', borderRadius: '12px', border: 'none', background: on ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'rgba(255,255,255,0.12)', cursor: disabled ? 'not-allowed' : 'pointer', transition: 'background 0.2s', padding: 0, flexShrink: 0, boxShadow: on ? '0 0 12px rgba(59,130,246,0.35)' : 'none' }}
    >
      <span style={{ position: 'absolute', top: '3px', left: on ? '23px' : '3px', width: '18px', height: '18px', borderRadius: '9px', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
    </button>
  );
}

function Blobs() {
  return (
    <>
      <div style={{ position: 'fixed', top: '-8%', left: '-8%', width: '55vw', height: '55vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.22) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', top: '25%', right: '-18%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.16) 0%, transparent 70%)', filter: 'blur(90px)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-12%', left: '20%', width: '45vw', height: '45vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)', filter: 'blur(85px)', pointerEvents: 'none', zIndex: 0 }} />
    </>
  );
}

export default function AdminPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<AdminData | null | undefined>(undefined);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [tab, setTab] = useState<'queue' | 'recent'>('queue');
  const [numStaff, setNumStaff] = useState(1);
  const [avgServiceMin, setAvgServiceMin] = useState(15);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [queueOpen, setQueueOpen] = useState(true);
  const [openingTime, setOpeningTime] = useState('09:00');
  const [closingTime, setClosingTime] = useState('18:00');
  const [toggleLoading, setToggleLoading] = useState(false);
  const [hoursSaving, setHoursSaving] = useState(false);
  const [hoursSaved, setHoursSaved] = useState(false);
  const [allowRemoteJoin, setAllowRemoteJoin] = useState(true);
  const [remoteJoinSaving, setRemoteJoinSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoSaved, setLogoSaved] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [adminPinConfirm, setAdminPinConfirm] = useState('');
  const [pinSaving, setPinSaving] = useState(false);
  const [pinSaved, setPinSaved] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [closedDays, setClosedDays] = useState<number[]>([]);
  const [daysSaving, setDaysSaving] = useState(false);
  const [daysSaved, setDaysSaved] = useState(false);
  const settingsInitialized = useRef(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addInfo, setAddInfo] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  const fetchData = useCallback(async () => {
    if (!shopId) return;
    try {
      const res = await adminFetch(`${API_BASE}/admin/${shopId}`);
      if (res.status === 401 || res.status === 403) { navigate('/login'); return; }
      if (res.status === 404) { setError('Shop not found'); setData(null); return; }
      if (!res.ok) { setError('Server error — please refresh'); setData(null); return; }
      const json = await res.json();
      if (!json || !Array.isArray(json.queue)) { setError('Unexpected server response'); setData(null); return; }
      setData(json);
      if (!settingsInitialized.current && json.shop) {
        setNumStaff(json.shop.num_staff || 1);
        setAvgServiceMin(json.shop.avg_service_minutes || 15);
        setQueueOpen(json.shop.queue_open !== false);
        setOpeningTime(json.shop.opening_time || '09:00');
        setClosingTime(json.shop.closing_time || '18:00');
        setAllowRemoteJoin(json.shop.allow_remote_join !== false);
        setLogoUrl(json.shop.logo_url || null);
        const days = json.shop.closed_days ? json.shop.closed_days.split(',').map(Number).filter((n: number) => !isNaN(n)) : [];
        setClosedDays(days);
        settingsInitialized.current = true;
      }
    } catch { setError('Could not connect to server'); setData(null); }
  }, [shopId, navigate]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const logout = async () => {
    await adminFetch(`${API_BASE}/admin/logout`, { method: 'POST' });
    clearAdminToken();
    navigate('/login');
  };
  const markServed = async (ticketId: string) => {
    setActionLoading(ticketId + '-served');
    await adminFetch(`${API_BASE}/admin/${shopId}/serve/${ticketId}`, { method: 'POST' });
    await fetchData(); setActionLoading(null);
  };
  const removeTicket = async (ticketId: string) => {
    setActionLoading(ticketId + '-remove');
    await adminFetch(`${API_BASE}/admin/${shopId}/tickets/${ticketId}`, { method: 'DELETE' });
    await fetchData(); setActionLoading(null);
  };
  const sendToDoctor = async (ticketId: string) => {
    setActionLoading(ticketId + '-doctor');
    await adminFetch(`${API_BASE}/admin/${shopId}/serve/${ticketId}`, { method: 'POST' });
    await fetchData(); setActionLoading(null);
  };
  const addPatient = async () => {
    setAddError('');
    const trimmedName = addName.trim();
    const trimmedPhone = addPhone.trim();
    if (!trimmedName || trimmedName.length < 2) { setAddError('Please enter a valid name'); return; }
    if (!/^\d{10}$/.test(trimmedPhone)) { setAddError('Please enter a 10-digit US phone number'); return; }
    setAddLoading(true);
    try {
      const res = await adminFetch(`${API_BASE}/admin/${shopId}/add-patient`, {
        method: 'POST',
        body: JSON.stringify({ name: trimmedName, phone: trimmedPhone, additionalInfo: addInfo.trim() }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setAddError((d as any).error || 'Could not add patient'); setAddLoading(false); return; }
      setAddName(''); setAddPhone(''); setAddInfo('');
      setShowAddModal(false);
      await fetchData();
    } catch { setAddError('Could not add patient'); }
    setAddLoading(false);
  };
  const saveSettings = async () => {
    setSettingsSaving(true);
    await adminFetch(`${API_BASE}/admin/${shopId}/settings`, { method: 'PATCH', body: JSON.stringify({ numStaff, avgServiceMinutes: avgServiceMin }) });
    await fetchData(); setSettingsSaving(false); setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  };
  const toggleQueue = async () => {
    setToggleLoading(true); const next = !queueOpen; setQueueOpen(next);
    await adminFetch(`${API_BASE}/admin/${shopId}/settings`, { method: 'PATCH', body: JSON.stringify({ queueOpen: next }) });
    await fetchData(); setToggleLoading(false);
  };
  const saveHours = async () => {
    setHoursSaving(true);
    await adminFetch(`${API_BASE}/admin/${shopId}/settings`, { method: 'PATCH', body: JSON.stringify({ openingTime, closingTime }) });
    await fetchData(); setHoursSaving(false); setHoursSaved(true);
    setTimeout(() => setHoursSaved(false), 2500);
  };
  const toggleRemoteJoin = async () => {
    setRemoteJoinSaving(true); const next = !allowRemoteJoin; setAllowRemoteJoin(next);
    await adminFetch(`${API_BASE}/admin/${shopId}/settings`, { method: 'PATCH', body: JSON.stringify({ allowRemoteJoin: next }) });
    await fetchData(); setRemoteJoinSaving(false);
  };
  const saveAdminPin = async () => {
    if (!/^\d{6}$/.test(adminPin)) { alert('Admin PIN must be exactly 6 digits.'); return; }
    if (adminPin !== adminPinConfirm) { alert('Admin PINs do not match.'); return; }
    setPinSaving(true);
    const res = await adminFetch(`${API_BASE}/admin/${shopId}/settings`, { method: 'PATCH', body: JSON.stringify({ adminPin }) });
    setPinSaving(false);
    if (!res.ok) { const d = await res.json().catch(() => ({ error: 'Could not save PIN' })); alert(d.error || 'Could not save PIN'); return; }
    setAdminPin(''); setAdminPinConfirm(''); setPinSaved(true);
    setTimeout(() => setPinSaved(false), 2500);
  };
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Image must be under 2 MB'); return; }
    setLogoUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setLogoUrl(dataUrl);
      await adminFetch(`${API_BASE}/admin/${shopId}/logo`, { method: 'PATCH', body: JSON.stringify({ logoUrl: dataUrl }) });
      setLogoUploading(false); setLogoSaved(true);
      setTimeout(() => setLogoSaved(false), 2500);
    };
    reader.readAsDataURL(file);
  };
  const saveClosedDays = async () => {
    setDaysSaving(true);
    await adminFetch(`${API_BASE}/admin/${shopId}/settings`, { method: 'PATCH', body: JSON.stringify({ closedDays }) });
    await fetchData(); setDaysSaving(false); setDaysSaved(true);
    setTimeout(() => setDaysSaved(false), 2500);
  };
  const removeLogo = async () => {
    setLogoUrl(null);
    await adminFetch(`${API_BASE}/admin/${shopId}/logo`, { method: 'PATCH', body: JSON.stringify({ logoUrl: null }) });
  };

  /* ── Loading / error states ── */
  if (data === undefined) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Blobs />
        <div style={{ position: 'relative', width: '40px', height: '40px' }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(59,130,246,0.2)' }} />
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid transparent', borderTopColor: '#3b82f6', borderRightColor: '#8b5cf6', animation: 'spin 0.9s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative' }}>
        <Blobs />
        <div style={{ textAlign: 'center', background: GLASS, border: `1px solid ${BORDER}`, borderRadius: '24px', padding: '40px', maxWidth: '340px', width: '100%', backdropFilter: 'blur(20px)', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '56px', height: '56px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="22" height="22" fill="none" stroke="#f87171" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: TEXT, marginBottom: '8px' }}>Access Denied</h2>
          <p style={{ fontSize: '14px', color: TEXTSUB, marginBottom: '24px' }}>{error || 'This admin link is not valid.'}</p>
          <Link to="/" style={{ color: '#60a5fa', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>← Back to Home</Link>
        </div>
      </div>
    );
  }

  const { shop, queue, recentlyServed } = data;
  const isClinic = shop.category === 'Clinic';
  const servingAll = queue.filter(t => t.served_at && !t.exited_at);
  const waiting = queue.filter(t => !t.served_at && !t.exited_at);
  const staffCount = shop.num_staff || 1;
  const servingPeople = servingAll.reduce((s, t) => s + Math.min(t.party_size || 1, staffCount), 0);
  const subMembersWaiting = servingAll.reduce((s, t) => s + Math.max(0, (t.party_size || 1) - staffCount), 0);
  const waitingPeople = waiting.reduce((s, t) => s + (t.party_size || 1), 0) + subMembersWaiting;
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
  const totalToday = [...queue, ...recentlyServed].filter(t => t.joined_at >= startOfToday.getTime()).reduce((s, t) => s + (t.party_size || 1), 0);

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: "'Inter', system-ui, sans-serif", position: 'relative' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes adm-live{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      <Blobs />

      {/* ── Header ── */}
      <div style={{ position: 'relative', zIndex: 2, background: 'linear-gradient(135deg, rgba(15,23,60,0.95) 0%, rgba(30,20,80,0.92) 100%)', borderBottom: `1px solid ${BORDERL}`, backdropFilter: 'blur(20px)' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '20px 20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <WavitLogo size="sm" asDiv />
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(167,139,250,0.7)', letterSpacing: '0.05em' }}>· admin</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {isClinic && (
                <button
                  onClick={() => setShowAddModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', color: '#34d399', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add to Line
                </button>
              )}
              <button
                onClick={() => setShowQR(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'rgba(255,255,255,0.08)', border: `1px solid ${BORDERL}`, borderRadius: '10px', color: '#a78bfa', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                QR
              </button>
              <button
                onClick={logout}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'rgba(255,255,255,0.06)', border: `1px solid ${BORDER}`, borderRadius: '10px', color: TEXTSUB, fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                Logout
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 900, color: TEXT, marginBottom: '4px', letterSpacing: '-0.02em' }}>{shop.name}</h1>
            <p style={{ fontSize: '13px', color: 'rgba(167,139,250,0.7)', fontWeight: 500 }}>
              {shop.category}{isClinic ? '' : ` · ${shop.avg_service_minutes} min avg`}{shop.zip_code ? ` · ZIP ${shop.zip_code}` : ''}
            </p>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: isClinic ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
            {[
              { label: 'Waiting', value: waitingPeople, color: '#60a5fa', glow: 'rgba(59,130,246,0.25)' },
              ...(!isClinic ? [{ label: 'Serving', value: servingPeople, color: '#34d399', glow: 'rgba(16,185,129,0.25)' }] : []),
              { label: 'Today',   value: totalToday,    color: '#a78bfa', glow: 'rgba(139,92,246,0.2)'  },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.07)', border: `1px solid ${BORDERL}`, borderRadius: '14px', padding: '14px', textAlign: 'center', backdropFilter: 'blur(10px)', boxShadow: `0 0 20px ${s.glow}` }}>
                <p style={{ fontSize: '26px', fontWeight: 900, color: s.color, lineHeight: 1, textShadow: `0 0 20px ${s.glow}` }}>{s.value}</p>
                <p style={{ fontSize: '11px', color: TEXTSUB, marginTop: '4px', fontWeight: 600, letterSpacing: '0.04em' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Queue open/close — hidden for clinics */}
          {!isClinic && (
          <div style={{ background: queueOpen ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)', border: `1px solid ${queueOpen ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.25)'}`, borderRadius: '16px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 800, color: queueOpen ? '#34d399' : '#f87171', marginBottom: '2px' }}>
                {queueOpen ? 'Queue is Open' : 'Queue is Closed'}
              </p>
              <p style={{ fontSize: '12px', color: TEXTSUB }}>{queueOpen ? 'Customers can join right now' : 'No new customers can join'}</p>
            </div>
            <button
              onClick={toggleQueue} disabled={toggleLoading}
              style={{ padding: '10px 18px', background: queueOpen ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', border: `1px solid ${queueOpen ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`, borderRadius: '12px', color: queueOpen ? '#f87171' : '#34d399', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif", flexShrink: 0, transition: 'all 0.2s', opacity: toggleLoading ? 0.6 : 1 }}
            >
              {toggleLoading ? '…' : queueOpen ? 'Close Queue' : 'Open Queue'}
            </button>
          </div>
          )}
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '16px 16px 40px', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* Currently serving — hidden for clinics */}
        {!isClinic && servingAll.map(serving => (
          <DarkCard key={serving.id} style={{ padding: '18px', border: '1px solid rgba(16,185,129,0.25)', boxShadow: '0 0 30px rgba(16,185,129,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px rgba(16,185,129,0.8)', animation: 'adm-live 1.6s ease-in-out infinite', display: 'inline-block' }} />
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Now Serving</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <p style={{ fontSize: '18px', fontWeight: 800, color: TEXT }}>{serving.name}</p>
                  {(serving.party_size || 1) > 1 && (
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#a78bfa', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)', padding: '2px 8px', borderRadius: '20px' }}>👥 Party of {serving.party_size}</span>
                  )}
                </div>
                <p style={{ fontSize: '13px', color: TEXTSUB, marginBottom: '4px' }}>{serving.phone}</p>
                <p style={{ fontSize: '12px', color: '#34d399', fontWeight: 600 }}>{serving.served_at ? `Serving for ${waitTime(serving.served_at)}` : ''}</p>
              </div>
              <button
                onClick={() => markServed(serving.id)} disabled={actionLoading === serving.id + '-served'}
                style={{ padding: '10px 20px', background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.35)', borderRadius: '12px', color: '#34d399', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: "'Inter', sans-serif", flexShrink: 0, transition: 'all 0.2s', boxShadow: '0 0 16px rgba(16,185,129,0.2)' }}
              >
                {actionLoading === serving.id + '-served' ? '…' : 'Done ✓'}
              </button>
            </div>
          </DarkCard>
        ))}

        {/* Tabs */}
        <DarkCard style={{ padding: '6px' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[
              { key: 'queue',  label: 'Queue',   count: waitingPeople },
              { key: 'recent', label: 'History', count: recentlyServed.length },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key as typeof tab)}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 8px', borderRadius: '14px', border: 'none', background: tab === t.key ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'transparent', color: tab === t.key ? '#fff' : TEXTSUB, fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif", transition: 'all 0.2s', boxShadow: tab === t.key ? '0 0 16px rgba(59,130,246,0.35)' : 'none' }}
              >
                {t.label}
                {t.count !== null && (
                  <span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '8px', background: tab === t.key ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)', fontWeight: 800 }}>{t.count}</span>
                )}
              </button>
            ))}
          </div>
        </DarkCard>

        {/* Queue list */}
        {tab === 'queue' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {waiting.length === 0 ? (
              <DarkCard style={{ padding: '48px 20px', textAlign: 'center' }}>
                <p style={{ fontSize: '15px', fontWeight: 700, color: TEXTMID, marginBottom: '6px' }}>Queue is empty</p>
                <p style={{ fontSize: '13px', color: TEXTSUB }}>No one waiting right now</p>
              </DarkCard>
            ) : (
              waiting.map((ticket, i) => (
                <DarkCard key={ticket.id} style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', transition: 'border-color 0.2s' }}>
                  <div style={{ width: '36px', height: '36px', background: i === 0 ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'rgba(255,255,255,0.08)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 900, color: i === 0 ? '#fff' : TEXTSUB, flexShrink: 0, boxShadow: i === 0 ? '0 0 14px rgba(59,130,246,0.4)' : 'none' }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                      <p style={{ fontSize: '15px', fontWeight: 700, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ticket.name}</p>
                      {(ticket.party_size || 1) > 1 && <span style={{ fontSize: '11px', fontWeight: 700, color: '#a78bfa', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)', padding: '1px 7px', borderRadius: '20px', flexShrink: 0 }}>👥 {ticket.party_size}</span>}
                    </div>
                    <p style={{ fontSize: '12px', color: TEXTSUB }}>{ticket.phone} · {isClinic ? `Waiting for ${waitTime(ticket.joined_at)}` : timeAgo(ticket.joined_at)}</p>
                    {isClinic && ticket.additional_info && (
                      <p style={{ fontSize: '12px', color: 'rgba(167,139,250,0.8)', marginTop: '3px', fontWeight: 500 }}>📋 {ticket.additional_info}</p>
                    )}
                    {!isClinic && ticket.reminder_sent_at && <span style={{ fontSize: '11px', color: '#fbbf24', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', padding: '2px 8px', borderRadius: '20px', fontWeight: 600, display: 'inline-block', marginTop: '4px' }}>⚠ Check-in sent</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    {isClinic ? (
                      <>
                        <button
                          onClick={() => sendToDoctor(ticket.id)} disabled={!!actionLoading}
                          style={{ padding: '8px 14px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', color: '#34d399', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif", transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                        >
                          {actionLoading === ticket.id + '-doctor' ? '…' : 'Send to Doctor ✓'}
                        </button>
                        <button
                          onClick={() => removeTicket(ticket.id)} disabled={!!actionLoading}
                          style={{ padding: '8px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', color: '#f87171', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif", transition: 'all 0.2s' }}
                        >
                          {actionLoading === ticket.id + '-remove' ? '…' : 'Remove'}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => markServed(ticket.id)} disabled={!!actionLoading}
                          style={{ padding: '8px 14px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', color: '#34d399', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif", transition: 'all 0.2s' }}
                        >
                          {actionLoading === ticket.id + '-served' ? '…' : 'Serve'}
                        </button>
                        <button
                          onClick={() => removeTicket(ticket.id)} disabled={!!actionLoading}
                          style={{ padding: '8px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', color: '#f87171', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif", transition: 'all 0.2s' }}
                        >
                          {actionLoading === ticket.id + '-remove' ? '…' : 'Remove'}
                        </button>
                      </>
                    )}
                  </div>
                </DarkCard>
              ))
            )}
          </div>
        )}

        {/* Settings accordion */}
        {tab === 'queue' && (
          <DarkCard style={{ overflow: 'hidden' }}>
            <button
              onClick={() => setSettingsOpen(o => !o)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', background: 'transparent', border: 'none', color: TEXT, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '34px', height: '34px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <span style={{ fontSize: '14px', fontWeight: 700, color: TEXT }}>Settings</span>
              </div>
              <svg width="16" height="16" fill="none" stroke={TEXTSUB} strokeWidth="2" viewBox="0 0 24 24" style={{ transform: settingsOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>

            {settingsOpen && (
              <div style={{ borderTop: `1px solid ${BORDER}` }}>
                {/* Queue settings */}
                <div style={{ padding: '20px', borderBottom: `1px solid ${BORDER}` }}>
                  <SectionLabel>Queue Settings</SectionLabel>
                  <div style={{ display: 'grid', gridTemplateColumns: isClinic ? '1fr' : '1fr 1fr', gap: '20px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: TEXTSUB, marginBottom: '10px' }}>{isClinic ? 'Doctors on duty' : 'Staff on duty'}</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button onClick={() => setNumStaff(n => Math.max(1, n - 1))} style={{ width: '36px', height: '36px', borderRadius: '10px', background: GLASSH, border: `1px solid ${BORDERL}`, color: TEXT, fontSize: '18px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                        <span style={{ fontSize: '22px', fontWeight: 900, color: '#a78bfa', width: '32px', textAlign: 'center' }}>{numStaff}</span>
                        <button onClick={() => setNumStaff(n => Math.min(20, n + 1))} style={{ width: '36px', height: '36px', borderRadius: '10px', background: GLASSH, border: `1px solid ${BORDERL}`, color: TEXT, fontSize: '18px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                      </div>
                    </div>
                    {!isClinic && (
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: TEXTSUB, marginBottom: '10px' }}>Avg service time</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button onClick={() => setAvgServiceMin(m => Math.max(1, m - 5))} style={{ width: '36px', height: '36px', borderRadius: '10px', background: GLASSH, border: `1px solid ${BORDERL}`, color: TEXT, fontSize: '18px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                        <span style={{ fontSize: '18px', fontWeight: 900, color: '#a78bfa', width: '42px', textAlign: 'center' }}>{avgServiceMin}m</span>
                        <button onClick={() => setAvgServiceMin(m => Math.min(120, m + 5))} style={{ width: '36px', height: '36px', borderRadius: '10px', background: GLASSH, border: `1px solid ${BORDERL}`, color: TEXT, fontSize: '18px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                      </div>
                    </div>
                    )}
                  </div>
                  {!isClinic && (
                  <p style={{ fontSize: '12px', color: 'rgba(167,139,250,0.7)', fontWeight: 600, marginBottom: '14px' }}>
                    {numStaff} staff × {avgServiceMin} min: serving {numStaff} customers every {avgServiceMin} min
                  </p>
                  )}
                  <SavedBtn saved={settingsSaved} saving={settingsSaving} onClick={saveSettings}>Save Settings</SavedBtn>
                  {!isClinic && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: TEXTMID, marginBottom: '3px' }}>Allow Remote Join</p>
                      <p style={{ fontSize: '11px', color: TEXTSUB }}>Let customers join from anywhere. <span style={{ color: '#fbbf24' }}>Not recommended</span></p>
                    </div>
                    <Toggle on={allowRemoteJoin} onChange={toggleRemoteJoin} disabled={remoteJoinSaving} />
                  </div>
                  )}
                </div>

                {/* Operating hours */}
                <div style={{ padding: '20px', borderBottom: `1px solid ${BORDER}` }}>
                  <SectionLabel>Operating Hours</SectionLabel>
                  <p style={{ fontSize: '11px', color: TEXTSUB, marginBottom: '14px' }}>24-hour format · queue auto-opens at opening time and closes 15 min after the last join past closing</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: TEXTSUB, marginBottom: '8px' }}>Opening time</label>
                      <DarkInput type="text" value={openingTime} onChange={e => setOpeningTime(e.target.value)} placeholder="09:00" maxLength={5} style={{ fontFamily: 'monospace' }} />
                      <p style={{ fontSize: '10px', color: TEXTSUB, marginTop: '5px' }}>HH:MM · e.g. 09:00</p>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: TEXTSUB, marginBottom: '8px' }}>Closing time</label>
                      <DarkInput type="text" value={closingTime} onChange={e => setClosingTime(e.target.value)} placeholder="18:00" maxLength={5} style={{ fontFamily: 'monospace' }} />
                      <p style={{ fontSize: '10px', color: TEXTSUB, marginTop: '5px' }}>HH:MM · e.g. 18:00</p>
                    </div>
                  </div>
                  <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px', padding: '12px 14px', marginBottom: '14px' }}>
                    <p style={{ fontSize: '11px', color: 'rgba(251,191,36,0.8)', lineHeight: 1.5 }}>Force closing the queue prevents auto-reopen until opening time.</p>
                  </div>
                  <SavedBtn saved={hoursSaved} saving={hoursSaving} onClick={saveHours}>Save Hours</SavedBtn>
                </div>

                {/* Business days */}
                <div style={{ padding: '20px', borderBottom: `1px solid ${BORDER}` }}>
                  <SectionLabel>Business Days</SectionLabel>
                  <p style={{ fontSize: '11px', color: TEXTSUB, marginBottom: '14px' }}>Tap a day to mark it closed. The queue will stay closed automatically on those days.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginBottom: '14px' }}>
                    {[{l:'Sun',v:0},{l:'Mon',v:1},{l:'Tue',v:2},{l:'Wed',v:3},{l:'Thu',v:4},{l:'Fri',v:5},{l:'Sat',v:6}].map(day => {
                      const isClosed = closedDays.includes(day.v);
                      return (
                        <button key={day.v} onClick={() => setClosedDays(p => isClosed ? p.filter(d => d !== day.v) : [...p, day.v])}
                          style={{ padding: '10px 0', borderRadius: '10px', border: `1px solid ${isClosed ? 'rgba(239,68,68,0.3)' : 'rgba(139,92,246,0.25)'}`, background: isClosed ? 'rgba(239,68,68,0.12)' : 'rgba(139,92,246,0.12)', color: isClosed ? '#f87171' : '#a78bfa', fontSize: '11px', fontWeight: 700, cursor: 'pointer', textDecoration: isClosed ? 'line-through' : 'none', opacity: isClosed ? 0.7 : 1, fontFamily: "'Inter', sans-serif", transition: 'all 0.2s' }}
                        >{day.l}</button>
                      );
                    })}
                  </div>
                  {closedDays.length > 0 && <p style={{ fontSize: '12px', color: '#f87171', fontWeight: 600, marginBottom: '10px' }}>Closed: {closedDays.sort((a,b)=>a-b).map(d=>['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ')}</p>}
                  <SavedBtn saved={daysSaved} saving={daysSaving} onClick={saveClosedDays}>Save Business Days</SavedBtn>
                </div>

                {/* PIN */}
                <div style={{ padding: '20px', borderBottom: `1px solid ${BORDER}` }}>
                  <SectionLabel>Business Login PIN</SectionLabel>
                  <p style={{ fontSize: '11px', color: TEXTSUB, marginBottom: '14px' }}>Set the 6-digit PIN used from the public Login tab.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <DarkInput type="password" inputMode="numeric" value={adminPin} onChange={e => setAdminPin(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="Enter new 6-digit PIN" maxLength={6} style={{ textAlign: 'center', letterSpacing: '0.35em', fontWeight: 900, fontSize: '16px' }} />
                    <DarkInput type="password" inputMode="numeric" value={adminPinConfirm} onChange={e => setAdminPinConfirm(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="Confirm new 6-digit PIN" maxLength={6} style={{ textAlign: 'center', letterSpacing: '0.35em', fontWeight: 900, fontSize: '16px' }} />
                    {adminPinConfirm.length === 6 && adminPin !== adminPinConfirm && <p style={{ fontSize: '12px', color: '#f87171', fontWeight: 700 }}>PINs do not match.</p>}
                    <SavedBtn saved={pinSaved} saving={pinSaving} disabled={adminPin.length !== 6 || adminPin !== adminPinConfirm} onClick={saveAdminPin}>Confirm & Save Login PIN</SavedBtn>
                  </div>
                </div>

                {/* Logo */}
                <div style={{ padding: '20px' }}>
                  <SectionLabel>Shop Logo</SectionLabel>
                  <p style={{ fontSize: '11px', color: TEXTSUB, marginBottom: '14px' }}>Shown on your shop card. JPG, PNG or WebP, max 2 MB.</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '16px', border: `2px dashed ${BORDERL}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: GLASS, flexShrink: 0 }}>
                      {logoUrl ? <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <svg width="22" height="22" fill="none" stroke={TEXTSUB} strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ padding: '8px 16px', borderRadius: '10px', border: logoSaved ? '1px solid rgba(16,185,129,0.35)' : 'none', background: logoSaved ? 'rgba(16,185,129,0.15)' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: logoSaved ? '#34d399' : '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                        {logoUploading ? 'Uploading…' : logoSaved ? '✓ Logo saved' : logoUrl ? 'Change Logo' : 'Upload Logo'}
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} disabled={logoUploading} />
                      </label>
                      {logoUrl && <button onClick={removeLogo} style={{ padding: '6px 12px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Remove</button>}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DarkCard>
        )}

        {/* History */}
        {tab === 'recent' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentlyServed.length === 0 ? (
              <DarkCard style={{ padding: '48px 20px', textAlign: 'center' }}>
                <p style={{ fontSize: '14px', color: TEXTSUB }}>No history yet</p>
              </DarkCard>
            ) : (
              [...recentlyServed].reverse().map(ticket => (
                <DarkCard key={ticket.id} style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                      <p style={{ fontSize: '14px', fontWeight: 700, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ticket.name}</p>
                      {(ticket.party_size || 1) > 1 && <span style={{ fontSize: '11px', fontWeight: 700, color: '#a78bfa', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)', padding: '1px 7px', borderRadius: '20px', flexShrink: 0 }}>👥 {ticket.party_size}</span>}
                    </div>
                    <p style={{ fontSize: '12px', color: TEXTSUB }}>{ticket.phone}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: '12px', color: TEXTSUB, marginBottom: '2px' }}>{ticket.exited_at ? timeAgo(ticket.exited_at) : '—'}</p>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: ticket.served_at ? '#34d399' : TEXTSUB }}>{ticket.served_at ? '✓ Served' : 'Left early'}</span>
                  </div>
                </DarkCard>
              ))
            )}
          </div>
        )}

        <DarkCard style={{ padding: '16px' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#a78bfa', marginBottom: '4px' }}>📌 Bookmark this page</p>
          <p style={{ fontSize: '12px', color: TEXTSUB, marginBottom: '10px' }}>This is your private admin link. Share only with your staff.</p>
          <a href={window.location.href} style={{ fontSize: '11px', fontFamily: 'monospace', color: '#60a5fa', wordBreak: 'break-all', textDecoration: 'underline', textUnderlineOffset: '2px' }}>{window.location.href}</a>
        </DarkCard>
      </div>

      {/* QR Page Modal */}
      {showQR && (() => {
        const joinUrl = `${window.location.origin}/join/${shopId}`;
        const downloadQR = () => {
          const qrCanvas = document.getElementById('qr-canvas') as HTMLCanvasElement;
          if (!qrCanvas) return;

          const W = 1275; // 8.5in × 150dpi
          const H = 1650; // 11in × 150dpi
          const c = document.createElement('canvas');
          c.width = W;
          c.height = H;
          const ctx = c.getContext('2d');
          if (!ctx) return;

          function rr(x: number, y: number, w: number, h: number, r: number) {
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.arcTo(x + w, y, x + w, y + h, r);
            ctx.arcTo(x + w, y + h, x, y + h, r);
            ctx.arcTo(x, y + h, x, y, r);
            ctx.arcTo(x, y, x + w, y, r);
            ctx.closePath();
          }

          // White background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, W, H);

          const dark = '#111827';
          const indigo = '#4f46e5';
          const gray = '#4b5563';

          ctx.textAlign = 'center';
          ctx.textBaseline = 'alphabetic';

          // Margins: 0.25in (38px) left/right, 0.5in (75px) top/bottom at 150dpi
          // Content lives within x=[38, 1237], y=[75, 1575]
          const marginX = 38;
          const marginTop = 75;
          const contentW = W - marginX * 2; // 1199px ≈ 8.0in

          let y = marginTop;

          // helper: stretch text to fill content width, capped at margins, thick stroke+fill
          const drawWide = (text: string, desiredScale: number) => {
            ctx.save();
            (ctx as any).letterSpacing = '-5px';
            const natural = ctx.measureText(text).width;
            const scaleX = Math.min(desiredScale, contentW / natural);
            ctx.scale(scaleX, 1);
            const cx = W / (2 * scaleX);
            ctx.lineJoin = 'round';
            ctx.lineWidth = 8;
            ctx.strokeStyle = ctx.fillStyle as string;
            ctx.strokeText(text, cx, y);
            ctx.fillText(text, cx, y);
            (ctx as any).letterSpacing = '0px';
            ctx.restore();
          };

          // ── TOP: JOIN [SHOP NAME'S] WAITLIST HERE ──

          // "JOIN"
          ctx.fillStyle = dark;
          ctx.font = 'bold 140px Arial, sans-serif';
          y += 140;
          drawWide('JOIN', 1.18);
          y += 12;

          // "[SHOP NAME]'S" — auto-size to stay within content width
          const shopLabel = (shop.name.toUpperCase() + "'S");
          let nameSz = 118;
          (ctx as any).letterSpacing = '-5px';
          ctx.font = `bold ${nameSz}px Arial, sans-serif`;
          while (ctx.measureText(shopLabel).width > contentW && nameSz > 48) {
            nameSz -= 4;
            ctx.font = `bold ${nameSz}px Arial, sans-serif`;
          }
          (ctx as any).letterSpacing = '0px';
          ctx.fillStyle = indigo;
          y += nameSz;
          drawWide(shopLabel, 1.18);
          y += 12;

          // "WAITLIST HERE"
          ctx.fillStyle = dark;
          ctx.font = 'bold 140px Arial, sans-serif';
          y += 140;
          drawWide('WAITLIST HERE', 1.18);
          y += 20;

          // ── Big downward arrow ──
          const ax = W / 2;
          const aShaftW = 220, aHeadW = 420, aShaftH = 75, aHeadH = 92;
          ctx.fillStyle = dark;
          ctx.beginPath();
          ctx.moveTo(ax - aShaftW / 2, y);
          ctx.lineTo(ax + aShaftW / 2, y);
          ctx.lineTo(ax + aShaftW / 2, y + aShaftH);
          ctx.lineTo(ax + aHeadW / 2, y + aShaftH);
          ctx.lineTo(ax, y + aShaftH + aHeadH);
          ctx.lineTo(ax - aHeadW / 2, y + aShaftH);
          ctx.lineTo(ax - aShaftW / 2, y + aShaftH);
          ctx.closePath();
          ctx.fill();
          y += aShaftH + aHeadH + 16;

          // ── QR code ──
          const qrSize = 620;
          const pad = 22;
          const boxW = qrSize + pad * 2;
          const boxX = (W - boxW) / 2;

          ctx.fillStyle = '#ffffff';
          rr(boxX, y, boxW, boxW, 26);
          ctx.fill();
          ctx.strokeStyle = '#c7d2fe';
          ctx.lineWidth = 6;
          rr(boxX, y, boxW, boxW, 26);
          ctx.stroke();
          ctx.drawImage(qrCanvas, boxX + pad, y + pad, qrSize, qrSize);
          y += boxW + 18;

          // ── BOTTOM TEXT ──

          // "Track your live position and est wait time for"
          ctx.fillStyle = gray;
          ctx.font = '40px Arial, sans-serif';
          y += 40;
          ctx.fillText('Track your live position and est wait time for', W / 2, y);
          y += 8;

          // Shop name
          ctx.fillStyle = indigo;
          ctx.font = 'bold 46px Arial, sans-serif';
          y += 46;
          ctx.fillText(shop.name, W / 2, y);
          y += 10;

          // Bold tagline — wrapped within content width
          const bottomLine = `Use www.wavit.cc or the Wavit app to see ${shop.name}'s live wait times at any moment from your phone.`;
          ctx.fillStyle = dark;
          ctx.font = 'bold 36px Arial, sans-serif';
          const maxLineW = contentW - 60;
          const words = bottomLine.split(' ');
          let curLine = '';
          const bLines: string[] = [];
          for (const w of words) {
            const test = curLine ? curLine + ' ' + w : w;
            if (ctx.measureText(test).width > maxLineW && curLine) {
              bLines.push(curLine);
              curLine = w;
            } else {
              curLine = test;
            }
          }
          if (curLine) bLines.push(curLine);
          for (const bl of bLines) {
            y += 38;
            ctx.fillText(bl, W / 2, y);
          }

          // ── Footer bar — sits at the bottom margin line ──
          ctx.fillStyle = indigo;
          ctx.fillRect(marginX, H - marginTop, contentW, 8);

          const url = c.toDataURL('image/png');
          const a = document.createElement('a');
          a.href = url;
          a.download = `${shop.name.replace(/\s+/g, '-').toLowerCase()}-qr-flyer.png`;
          a.click();
        };
        const copyLink = async () => {
          await navigator.clipboard.writeText(joinUrl);
          setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2500);
        };
        return (
          <div onClick={() => setShowQR(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(12px)' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '380px', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }}>

              {/* Close button (outside the flyer card) */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '14px 14px 0' }}>
                <button onClick={() => setShowQR(false)} style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0,0,0,0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* ── Flyer body ── */}
              <div style={{ padding: '8px 32px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0' }}>

                {/* Top: Wavit branding */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '22px' }}>
                  <WavitLogo size="md" asDiv />
                </div>

                {/* QR code */}
                <div style={{ background: '#fff', border: '3px solid #e8e3ff', borderRadius: '18px', padding: '16px', marginBottom: '48px', boxShadow: '0 4px 20px rgba(99,102,241,0.12)' }}>
                  <QRCodeCanvas id="qr-canvas" value={joinUrl} size={210} level="H" includeMargin={false} />
                </div>

                {/* Scan tagline */}
                <p style={{ fontSize: '28px', fontWeight: 900, color: '#111827', textAlign: 'center', margin: '0 0 10px', lineHeight: 1.2, fontFamily: "'Inter', sans-serif" }}>
                  {isClinic ? `Scan to Check in to ${shop.name}` : 'Scan to join the line'}
                </p>
                <p style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center', margin: '0 0 6px', lineHeight: 1.5, fontFamily: "'Inter', sans-serif" }}>
                  Track your position and estimated wait time.
                </p>
                <p style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center', margin: '0 0 6px', lineHeight: 1.6, fontFamily: "'Inter', sans-serif" }}>
                  Use Wavit to see live wait times for <strong style={{ color: '#6366f1' }}>{shop.name}</strong> anytime, anywhere.
                </p>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827', textAlign: 'center', margin: '0 0 20px', fontFamily: "'Inter', sans-serif" }}>
                  www.wavit.cc
                </p>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                  <button onClick={copyLink} style={{ flex: 1, padding: '11px', background: '#f5f3ff', border: '1px solid #e0d9ff', borderRadius: '12px', color: '#6366f1', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                    {linkCopied ? '✓ Copied!' : 'Copy Link'}
                  </button>
                  <button onClick={downloadQR} style={{ flex: 1, padding: '11px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif", boxShadow: '0 4px 14px rgba(99,102,241,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Add to Line modal (clinic only) ── */}
      {showAddModal && (
        <div onClick={() => setShowAddModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(12px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', width: '100%', maxWidth: '400px', padding: '28px', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: TEXT, margin: 0 }}>Add Patient to Line</h2>
              <button onClick={() => setShowAddModal(false)} style={{ width: '32px', height: '32px', borderRadius: '50%', background: GLASSH, border: `1px solid ${BORDER}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXTSUB }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: TEXTSUB, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>Full Name</label>
                <DarkInput value={addName} onChange={e => setAddName(e.target.value)} placeholder="Patient name" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: TEXTSUB, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>Phone Number (10-digit)</label>
                <DarkInput value={addPhone} onChange={e => setAddPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="2025551234" type="tel" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: TEXTSUB, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>Additional Info (Optional)</label>
                <textarea
                  value={addInfo} onChange={e => setAddInfo(e.target.value)} placeholder="Reason for visit, symptoms, etc." rows={3} maxLength={500}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '14px', background: 'rgba(255,255,255,0.06)', border: `1px solid ${BORDERL}`, color: TEXT, fontSize: '14px', fontWeight: 500, outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: "'Inter', sans-serif" }}
                />
              </div>
              {addError && (
                <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: 'rgba(248,113,113,0.9)', fontWeight: 600 }}>{addError}</div>
              )}
              <button
                onClick={addPatient} disabled={addLoading}
                style={{ width: '100%', padding: '14px', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff', fontSize: '14px', fontWeight: 800, cursor: addLoading ? 'not-allowed' : 'pointer', opacity: addLoading ? 0.6 : 1, fontFamily: "'Inter', sans-serif" }}
              >
                {addLoading ? 'Adding…' : 'Add to Queue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
