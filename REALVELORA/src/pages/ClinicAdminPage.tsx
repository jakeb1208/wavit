import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import {
  LayoutDashboard, Users, Code2, Settings, BarChart2, User,
  Plus, QrCode, LogOut, Clock, UserCheck, Stethoscope, Activity,
  X, Download, ChevronDown, ChevronUp, Info
} from 'lucide-react';
import { API_BASE, adminFetch, clearAdminToken } from '../lib/api';

// ── Design tokens (light theme) ───────────────────────────────────────────────
const BLUE     = '#2563eb';
const BLUE_BG  = '#eff6ff';
const BLUE_TXT = '#1d4ed8';
const SIDEBAR  = '#ffffff';
const PAGE_BG  = '#f1f5f9';
const CARD     = '#ffffff';
const BORDER   = '#e2e8f0';
const TEXT     = '#0f172a';
const TEXTSUB  = '#64748b';
const GREEN    = '#16a34a';
const RED_C    = '#dc2626';

// ── Types ─────────────────────────────────────────────────────────────────────
type Tab = 'dashboard' | 'queue' | 'widget' | 'settings' | 'analytics' | 'profile';

interface ClinicShop {
  id: string; name: string; zip_code: string; address: string; phone: string;
  website: string; email: string; analytics_email: string;
  num_staff: number; avg_service_minutes: number; logo_url: string | null;
  queue_open: boolean; force_closed: boolean;
  opening_time: string; closing_time: string; closed_days: string; allow_remote_join: boolean;
}
interface ClinicTicket {
  id: string; name: string; joined_at: number;
  served_at: number | null; exited_at: number | null; additional_info?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}
function fmtHour(h: number | null) {
  if (h === null) return '—';
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:00 ${ampm}`;
}
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ── Small UI pieces ───────────────────────────────────────────────────────────
function LInput({ label, value, onChange, type = 'text', placeholder, autoFocus }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; autoFocus?: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '13px', fontWeight: 600, color: TEXTSUB }}>{label}</label>
      <input
        type={type} value={value} placeholder={placeholder} autoFocus={autoFocus}
        onChange={e => onChange(e.target.value)}
        style={{
          padding: '10px 14px', border: `1px solid ${BORDER}`, borderRadius: '10px',
          fontSize: '14px', color: TEXT, background: '#fff', outline: 'none',
          fontFamily: "'Inter', sans-serif", width: '100%', boxSizing: 'border-box' as const,
        }}
        onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = `0 0 0 3px ${BLUE_BG}`; }}
        onBlur={e => { e.target.style.borderColor = BORDER; e.target.style.boxShadow = 'none'; }}
      />
    </div>
  );
}

function SaveBtn({ saving, saved, onClick, label = 'Save Changes' }: {
  saving: boolean; saved: boolean; onClick: () => void; label?: string;
}) {
  return (
    <button
      onClick={onClick} disabled={saving}
      style={{
        padding: '11px 28px', borderRadius: '10px', border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
        background: saved ? '#dcfce7' : BLUE, color: saved ? GREEN : '#fff',
        fontSize: '14px', fontWeight: 700, fontFamily: "'Inter', sans-serif", transition: 'all 0.2s',
        opacity: saving ? 0.7 : 1,
      }}
    >{saving ? 'Saving…' : saved ? '✓ Saved' : label}</button>
  );
}

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: CARD, borderRadius: '16px', border: `1px solid ${BORDER}`,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)', ...style
    }}>{children}</div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function ClinicAdminPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();

  const [shop, setShop] = useState<ClinicShop | null>(null);
  const [queue, setQueue] = useState<ClinicTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('dashboard');

  const [queueOpen, setQueueOpen] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [servedToday, setServedToday] = useState(0);
  const [avgWaitToday, setAvgWaitToday] = useState(0);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState('');
  const [addInfo, setAddInfo] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [showOpenQueuePrompt, setShowOpenQueuePrompt] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const [showQR, setShowQR] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Settings
  const [numStaff, setNumStaff] = useState(1);
  const [openingTime, setOpeningTime] = useState('09:00');
  const [closingTime, setClosingTime] = useState('17:00');
  const [closedDays, setClosedDays] = useState<number[]>([]);
  const [allowRemoteJoin, setAllowRemoteJoin] = useState(true);
  const [adminPin, setAdminPin] = useState('');
  const [adminPinConfirm, setAdminPinConfirm] = useState('');
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [pinSaving, setPinSaving] = useState(false);
  const [pinSaved, setPinSaved] = useState(false);

  // Profile
  const [pName, setPName] = useState('');
  const [pZip, setPZip] = useState('');
  const [pAddress, setPAddress] = useState('');
  const [pPhone, setPPhone] = useState('');
  const [pWebsite, setPWebsite] = useState('');
  const [pEmail, setPEmail] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Analytics
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const settingsInit = useRef(false);

  const fetchData = useCallback(async () => {
    if (!shopId) return;
    try {
      const res = await adminFetch(`${API_BASE}/admin/${shopId}`);
      if (res.status === 401 || res.status === 403) { navigate('/login'); return; }
      if (!res.ok) { setError('Server error — please refresh'); return; }
      const json = await res.json();
      setShop(json.shop);
      setQueue(json.queue || []);
      setQueueOpen(json.shop.queue_open !== false);
      setServedToday(json.servedTodayCount || 0);
      setAvgWaitToday(json.avgWaitTodayMin || 0);
      if (!settingsInit.current && json.shop) {
        setNumStaff(json.shop.num_staff || 1);
        setOpeningTime(json.shop.opening_time || '09:00');
        setClosingTime(json.shop.closing_time || '17:00');
        setAllowRemoteJoin(json.shop.allow_remote_join !== false);
        const days = json.shop.closed_days ? json.shop.closed_days.split(',').map(Number).filter((n: number) => !isNaN(n)) : [];
        setClosedDays(days);
        setPName(json.shop.name || '');
        setPZip(json.shop.zip_code || '');
        setPAddress(json.shop.address || '');
        setPPhone(json.shop.phone || '');
        setPWebsite(json.shop.website || '');
        setPEmail(json.shop.email || json.shop.analytics_email || '');
        settingsInit.current = true;
      }
      setLoading(false);
    } catch { setError('Could not connect to server'); setLoading(false); }
  }, [shopId, navigate]);

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 15000);
    return () => clearInterval(iv);
  }, [fetchData]);

  const fetchAnalytics = useCallback(async () => {
    if (!shopId) return;
    setAnalyticsLoading(true);
    try {
      const res = await adminFetch(`${API_BASE}/admin/${shopId}/analytics?allTime=true`);
      const json = await res.json();
      setAnalytics(json);
    } catch {}
    setAnalyticsLoading(false);
  }, [shopId]);

  useEffect(() => { if (tab === 'analytics') fetchAnalytics(); }, [tab, fetchAnalytics]);

  // Actions
  const toggleQueue = async () => {
    setToggleLoading(true);
    const next = !queueOpen; setQueueOpen(next);
    await adminFetch(`${API_BASE}/admin/${shopId}/settings`, {
      method: 'PATCH', body: JSON.stringify({ queueOpen: next, forceClose: !next })
    });
    await fetchData(); setToggleLoading(false);
  };

  const servePatient = async (ticketId: string) => {
    setActionLoading(ticketId);
    await adminFetch(`${API_BASE}/admin/${shopId}/serve/${ticketId}`, { method: 'POST' });
    await fetchData(); setActionLoading(null);
  };

  const removePatient = async (ticketId: string) => {
    setActionLoading(`rm-${ticketId}`);
    await adminFetch(`${API_BASE}/admin/${shopId}/tickets/${ticketId}`, { method: 'DELETE' });
    await fetchData(); setActionLoading(null);
  };

  const addPatient = async () => {
    if (!addName.trim()) { setAddError('Name is required'); return; }
    setAddLoading(true); setAddError('');
    const res = await adminFetch(`${API_BASE}/admin/${shopId}/add-patient`, {
      method: 'POST', body: JSON.stringify({ name: addName.trim(), additionalInfo: '' })
    });
    if (res.ok) {
      setAddName(''); setShowAddModal(false); await fetchData();
      if (!queueOpen) setShowOpenQueuePrompt(true);
    } else {
      const err = await res.json().catch(() => ({}));
      setAddError(err.error || 'Failed to add patient');
    }
    setAddLoading(false);
  };

  const saveSettings = async () => {
    setSettingsSaving(true);
    await adminFetch(`${API_BASE}/admin/${shopId}/settings`, {
      method: 'PATCH', body: JSON.stringify({ numStaff, openingTime, closingTime, allowRemoteJoin, closedDays })
    });
    await fetchData(); setSettingsSaving(false); setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  const savePin = async () => {
    if (!/^\d{6}$/.test(adminPin)) { alert('Admin PIN must be exactly 6 digits.'); return; }
    if (adminPin !== adminPinConfirm) { alert('PINs do not match.'); return; }
    setPinSaving(true);
    const res = await adminFetch(`${API_BASE}/admin/${shopId}/settings`, {
      method: 'PATCH', body: JSON.stringify({ adminPin })
    });
    if (!res.ok) { const j = await res.json().catch(() => ({})); alert(j.error || 'Error saving PIN'); }
    else { setAdminPin(''); setAdminPinConfirm(''); setPinSaved(true); setTimeout(() => setPinSaved(false), 2500); }
    setPinSaving(false);
  };

  const saveProfile = async () => {
    setProfileSaving(true);
    await adminFetch(`${API_BASE}/admin/${shopId}/settings`, {
      method: 'PATCH', body: JSON.stringify({ name: pName, zipCode: pZip, address: pAddress, phone: pPhone, website: pWebsite, email: pEmail })
    });
    await fetchData(); setProfileSaving(false); setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const logout = async () => {
    await adminFetch(`${API_BASE}/admin/logout`, { method: 'POST' }).catch(() => {});
    clearAdminToken(); navigate('/login');
  };

  const downloadQR = () => {
    const canvas = document.getElementById('clinic-qr') as HTMLCanvasElement;
    if (!canvas) return;
    const a = document.createElement('a');
    a.download = `${shop?.name || 'clinic'}-qr.png`;
    a.href = canvas.toDataURL(); a.click();
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: PAGE_BG }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: `3px solid ${BORDER}`, borderTopColor: BLUE, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: TEXTSUB, fontSize: '14px' }}>Loading clinic dashboard…</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: PAGE_BG }}>
      <Card style={{ padding: '40px', textAlign: 'center', maxWidth: '360px' }}>
        <p style={{ color: RED_C, fontWeight: 700, marginBottom: '8px' }}>Error</p>
        <p style={{ color: TEXTSUB, fontSize: '14px', marginBottom: '20px' }}>{error}</p>
        <button onClick={() => window.location.reload()}
          style={{ padding: '10px 24px', background: BLUE, color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 700 }}>
          Retry
        </button>
      </Card>
    </div>
  );

  const activeQueue = queue.filter(t => !t.exited_at && !t.served_at);
  const joinUrl = `${window.location.origin}/join/${shopId}`;
  const widgetUrl = `${window.location.origin}/widget/${shopId}`;
  const embedSnippet = `<iframe src="${widgetUrl}" height="56" frameborder="0" scrolling="no" style="border-radius:12px;overflow:hidden;border:none;"></iframe>`;

  const publicStatus = (() => {
    const isOpen = shop?.queue_open !== false;
    const forceClosed = shop?.force_closed === true;
    const isWithinHrs = (() => {
      if (!shop) return false;
      const [oh, om] = (shop.opening_time || '09:00').split(':').map(Number);
      const [ch, cm] = (shop.closing_time || '17:00').split(':').map(Number);
      const now = new Date(); const mins = now.getHours() * 60 + now.getMinutes();
      return mins >= oh * 60 + om && mins < ch * 60 + cm;
    })();
    const waiting = activeQueue.length;
    if (forceClosed && isWithinHrs) return { label: 'Not accepting walk-ins', dot: RED_C, bg: '#fef2f2', border: '#fecaca', text: RED_C };
    if (!isOpen) return { label: 'Closed', dot: '#94a3b8', bg: '#f8fafc', border: BORDER, text: TEXTSUB };
    if (waiting > 0) return { label: `${waiting} waiting`, dot: '#eab308', bg: '#fefce8', border: '#fde68a', text: '#ca8a04' };
    return { label: 'Open', dot: GREEN, bg: '#f0fdf4', border: '#bbf7d0', text: GREEN };
  })();

  // ── Nav items ─────────────────────────────────────────────────────────────
  const navItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'queue',     label: 'Queue',     icon: <Users size={18} /> },
    { id: 'widget',    label: 'Widget',    icon: <Code2 size={18} /> },
    { id: 'settings',  label: 'Settings',  icon: <Settings size={18} /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart2 size={18} /> },
    { id: 'profile',   label: 'Profile',   icon: <User size={18} /> },
  ];

  // ── Queue table (shared between Dashboard + Queue tabs) ───────────────────
  const QueueTable = () => (
    <Card>
      <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: '16px', fontWeight: 700, color: TEXT }}>Patient Queue</span>
          <span style={{ marginLeft: '8px', fontSize: '13px', color: TEXTSUB }}>({activeQueue.length})</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#22c55e', fontWeight: 600 }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
          Auto-refresh: On
        </div>
      </div>
      {activeQueue.length === 0 ? (
        <div style={{ padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: BLUE_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Users size={24} color={BLUE} />
          </div>
          <p style={{ fontWeight: 600, color: TEXT, marginBottom: '6px' }}>No patients currently waiting.</p>
          <p style={{ color: TEXTSUB, fontSize: '13px' }}>New walk-ins will appear here automatically.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Patient Name', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 20px', textAlign: 'left' as const, fontSize: '12px', fontWeight: 700, color: TEXTSUB, textTransform: 'uppercase' as const, letterSpacing: '0.05em', borderBottom: `1px solid ${BORDER}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeQueue.map((t, i) => (
                <tr key={t.id} style={{ borderBottom: i < activeQueue.length - 1 ? `1px solid ${BORDER}` : 'none', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: BLUE_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: BLUE_TXT, flexShrink: 0 }}>
                        {(t.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: TEXT }}>{(t.name || 'Patient').split(' ')[0]}</div>
                        {t.additional_info && <div style={{ fontSize: '12px', color: TEXTSUB, marginTop: '2px' }}>{t.additional_info}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => servePatient(t.id)}
                        disabled={actionLoading === t.id}
                        style={{ padding: '7px 14px', borderRadius: '8px', border: `1px solid ${GREEN}`, background: actionLoading === t.id ? '#f0fdf4' : '#f0fdf4', color: GREEN, fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                      >
                        <Stethoscope size={13} />{actionLoading === t.id ? '…' : 'Send to Doctor'}
                      </button>
                      <button
                        onClick={() => removePatient(t.id)}
                        disabled={actionLoading === `rm-${t.id}`}
                        style={{ padding: '7px 14px', borderRadius: '8px', border: `1px solid #fca5a5`, background: '#fef2f2', color: RED_C, fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                      >
                        <X size={13} />{actionLoading === `rm-${t.id}` ? '…' : 'Remove'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );

  // ── Walk-in availability card (shared) ────────────────────────────────────
  const WalkInCard = () => (
    <Card style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' as const }}>
      <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: queueOpen ? '#f0fdf4' : '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {queueOpen
          ? <UserCheck size={24} color={GREEN} />
          : <X size={24} color={RED_C} />}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '16px', fontWeight: 700, color: TEXT, marginBottom: '4px' }}>{queueOpen ? 'Queue Open' : 'Queue Closed'}</p>
        <p style={{ fontSize: '14px', color: TEXTSUB }}>
          {queueOpen
            ? 'Patients can join and check in right now.'
            : 'Queue is closed. It will automatically reopen at your set opening time.'}
        </p>
      </div>
      <button
        onClick={() => queueOpen ? setShowCloseConfirm(true) : toggleQueue()} disabled={toggleLoading}
        style={{
          padding: '11px 22px', borderRadius: '10px', border: 'none', cursor: toggleLoading ? 'not-allowed' : 'pointer',
          background: queueOpen ? RED_C : GREEN, color: '#fff',
          fontSize: '14px', fontWeight: 700, fontFamily: "'Inter', sans-serif",
          opacity: toggleLoading ? 0.7 : 1, flexShrink: 0, display: 'flex', alignItems: 'center', gap: '7px',
        }}
      >
        {queueOpen ? <X size={15} /> : <UserCheck size={15} />}
        {toggleLoading ? '…' : queueOpen ? 'Close Queue' : 'Open Queue'}
      </button>
    </Card>
  );

  // ── QR Modal ──────────────────────────────────────────────────────────────
  const QRModal = () => (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <Card style={{ padding: '32px', textAlign: 'center', maxWidth: '320px', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 700, color: TEXT }}>Check-In QR Code</h3>
          <button onClick={() => setShowQR(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: TEXTSUB }}><X size={20} /></button>
        </div>
        <p style={{ fontSize: '13px', color: TEXTSUB, marginBottom: '20px' }}>Patients scan this to join the queue</p>
        <div style={{ display: 'inline-block', padding: '16px', background: '#fff', borderRadius: '12px', border: `1px solid ${BORDER}`, marginBottom: '20px' }}>
          <QRCodeCanvas id="clinic-qr" value={joinUrl} size={200} level="H" includeMargin={false} />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={downloadQR}
            style={{ flex: 1, padding: '10px', borderRadius: '9px', border: `1px solid ${BORDER}`, background: '#fff', color: TEXT, fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Download size={14} /> Download
          </button>
          <button onClick={() => { navigator.clipboard.writeText(joinUrl); }}
            style={{ flex: 1, padding: '10px', borderRadius: '9px', border: 'none', background: BLUE, color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            Copy Link
          </button>
        </div>
      </Card>
    </div>
  );

  // ── Tab: Dashboard ────────────────────────────────────────────────────────
  const DashboardTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
        {[
          { icon: <Users size={22} color={BLUE} />, iconBg: BLUE_BG, title: 'Patients Waiting', value: String(activeQueue.length), sub: activeQueue.length === 0 ? 'No one waiting right now' : `${activeQueue.length} in queue` },
          { icon: <Clock size={22} color='#f59e0b' />, iconBg: '#fffbeb', title: 'Average Wait Time', value: avgWaitToday > 0 ? `${avgWaitToday} min` : '0 min', sub: "Today's average" },
          { icon: <UserCheck size={22} color={GREEN} />, iconBg: '#f0fdf4', title: 'Patients Served Today', value: String(servedToday), sub: 'Total checked in' },
          { icon: <Stethoscope size={22} color='#8b5cf6' />, iconBg: '#f5f3ff', title: 'Doctors on Duty', value: String(shop?.num_staff || 1), sub: `${shop?.num_staff === 1 ? '1 doctor' : `${shop?.num_staff || 1} doctors`} on shift` },
        ].map((s, i) => (
          <Card key={i} style={{ padding: '20px' }}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: s.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</div>
            </div>
            <p style={{ fontSize: '13px', color: TEXTSUB, marginBottom: '6px' }}>{s.title}</p>
            <p style={{ fontSize: '28px', fontWeight: 800, color: TEXT, letterSpacing: '-1px', marginBottom: '4px' }}>{s.value}</p>
            <p style={{ fontSize: '12px', color: TEXTSUB }}>{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* Walk-in status */}
      {WalkInCard()}

      {/* Queue status badge */}
      <Card style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Info size={16} color={TEXTSUB} />
        <span style={{ fontSize: '14px', color: TEXTSUB }}>Public-facing status: </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, padding: '4px 12px', borderRadius: '999px', background: publicStatus.bg, border: `1px solid ${publicStatus.border}`, color: publicStatus.text }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: publicStatus.dot, display: 'inline-block' }} />
          {publicStatus.label}
        </span>
      </Card>

      {/* Queue table */}
      {QueueTable()}
    </div>
  );

  // ── Tab: Queue ────────────────────────────────────────────────────────────
  const QueueTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' as const }}>
        <button
          onClick={() => setShowAddModal(true)}
          style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: BLUE, color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px' }}>
          <Plus size={16} /> Add to Line
        </button>
        <button
          onClick={() => setShowQR(true)}
          style={{ padding: '10px 18px', borderRadius: '10px', border: `1px solid ${BORDER}`, background: '#fff', color: TEXT, fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px' }}>
          <QrCode size={16} /> QR Code
        </button>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', color: TEXTSUB }}>Walk-ins:</span>
          <button
            onClick={() => queueOpen ? setShowCloseConfirm(true) : toggleQueue()} disabled={toggleLoading}
            style={{ padding: '8px 16px', borderRadius: '9px', border: 'none', cursor: toggleLoading ? 'not-allowed' : 'pointer', background: queueOpen ? RED_C : GREEN, color: '#fff', fontSize: '13px', fontWeight: 700, opacity: toggleLoading ? 0.7 : 1 }}>
            {toggleLoading ? '…' : queueOpen ? 'Close Queue' : 'Open Queue'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, padding: '6px 12px', borderRadius: '999px', background: publicStatus.bg, border: `1px solid ${publicStatus.border}`, color: publicStatus.text }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: publicStatus.dot, display: 'inline-block' }} />
            {publicStatus.label}
          </div>
        </div>
      </div>
      {QueueTable()}
    </div>
  );

  // ── Tab: Widget ───────────────────────────────────────────────────────────
  const WidgetTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Card style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: TEXT, marginBottom: '6px' }}>Live Queue Widget</h3>
        <p style={{ fontSize: '14px', color: TEXTSUB, marginBottom: '20px' }}>Embed this on your clinic's website so patients can see real-time queue status.</p>
        <p style={{ fontSize: '13px', fontWeight: 600, color: TEXTSUB, marginBottom: '8px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Live Preview</p>
        <div style={{ borderRadius: '12px', border: `1px solid ${BORDER}`, overflow: 'hidden', marginBottom: '24px', maxWidth: '480px' }}>
          <iframe src={widgetUrl} height="56" frameBorder={0} scrolling="no" style={{ display: 'block', width: '100%', border: 'none' }} />
        </div>
        <p style={{ fontSize: '13px', fontWeight: 600, color: TEXTSUB, marginBottom: '8px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Embed Code</p>
        <div style={{ background: '#f8fafc', border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '14px', fontFamily: 'monospace', fontSize: '13px', color: '#374151', wordBreak: 'break-all' as const, marginBottom: '12px' }}>
          {embedSnippet}
        </div>
        <button
          onClick={() => { navigator.clipboard.writeText(embedSnippet); setEmbedCopied(true); setTimeout(() => setEmbedCopied(false), 2000); }}
          style={{ padding: '10px 20px', borderRadius: '9px', border: 'none', background: embedCopied ? '#dcfce7' : BLUE, color: embedCopied ? GREEN : '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
          {embedCopied ? '✓ Copied!' : 'Copy Embed Code'}
        </button>
      </Card>
        <Card style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: TEXT, marginBottom: '16px' }}>How to Add to Your Website</h3>
          {[
            { step: '1', title: 'Copy the embed code above', desc: 'Click "Copy Embed Code" to copy the snippet.' },
            { step: '2', title: 'Paste it into your website', desc: 'Add it to any page where you want the queue widget to appear — header, footer, or sidebar all work well.' },
            { step: '3', title: 'That\'s it!', desc: 'The widget auto-refreshes every 5 seconds and always shows the live status of your clinic.' },
          ].map(s => (
            <div key={s.step} style={{ display: 'flex', gap: '14px', marginBottom: '16px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: BLUE_BG, color: BLUE_TXT, fontSize: '13px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.step}</div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: TEXT, marginBottom: '3px' }}>{s.title}</p>
                <p style={{ fontSize: '13px', color: TEXTSUB }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </Card>
      </div>
  );

  // ── Tab: Settings ─────────────────────────────────────────────────────────
  const SettingsTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px' }}>
      <Card style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: TEXT, marginBottom: '20px' }}>Clinic Hours & Staff</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: TEXTSUB, display: 'block', marginBottom: '6px' }}>Opening Time</label>
              <input type="time" value={openingTime} onChange={e => setOpeningTime(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: `1px solid ${BORDER}`, borderRadius: '10px', fontSize: '14px', color: TEXT, background: '#fff', boxSizing: 'border-box' as const }} />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: TEXTSUB, display: 'block', marginBottom: '6px' }}>Closing Time</label>
              <input type="time" value={closingTime} onChange={e => setClosingTime(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: `1px solid ${BORDER}`, borderRadius: '10px', fontSize: '14px', color: TEXT, background: '#fff', boxSizing: 'border-box' as const }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: TEXTSUB, display: 'block', marginBottom: '8px' }}>Closed Days</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
              {DAY_NAMES.map((d, i) => (
                <button key={i} onClick={() => setClosedDays(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])}
                  style={{ padding: '6px 14px', borderRadius: '8px', border: `1px solid ${closedDays.includes(i) ? BLUE : BORDER}`, background: closedDays.includes(i) ? BLUE_BG : '#fff', color: closedDays.includes(i) ? BLUE_TXT : TEXT, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: TEXTSUB, display: 'block', marginBottom: '6px' }}>Doctors on Duty</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button onClick={() => setNumStaff(Math.max(1, numStaff - 1))} style={{ width: '36px', height: '36px', borderRadius: '8px', border: `1px solid ${BORDER}`, background: '#fff', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
              <span style={{ fontSize: '20px', fontWeight: 700, color: TEXT, minWidth: '32px', textAlign: 'center' as const }}>{numStaff}</span>
              <button onClick={() => setNumStaff(Math.min(20, numStaff + 1))} style={{ width: '36px', height: '36px', borderRadius: '8px', border: `1px solid ${BORDER}`, background: '#fff', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: TEXT }}>Allow Remote Check-In</p>
              <p style={{ fontSize: '12px', color: TEXTSUB }}>Patients can join from their phone</p>
            </div>
            <button onClick={() => setAllowRemoteJoin(!allowRemoteJoin)}
              style={{ position: 'relative', width: '44px', height: '24px', borderRadius: '12px', border: 'none', background: allowRemoteJoin ? BLUE : BORDER, cursor: 'pointer', padding: 0, transition: 'background 0.2s' }}>
              <span style={{ position: 'absolute', top: '3px', left: allowRemoteJoin ? '23px' : '3px', width: '18px', height: '18px', borderRadius: '9px', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <SaveBtn saving={settingsSaving} saved={settingsSaved} onClick={saveSettings} />
          </div>
        </div>
      </Card>

      <Card style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: TEXT, marginBottom: '20px' }}>Change Admin PIN</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <LInput label="New 6-Digit PIN" value={adminPin} onChange={setAdminPin} type="password" placeholder="••••••" />
          <LInput label="Confirm PIN" value={adminPinConfirm} onChange={setAdminPinConfirm} type="password" placeholder="••••••" />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <SaveBtn saving={pinSaving} saved={pinSaved} onClick={savePin} label="Update PIN" />
          </div>
        </div>
      </Card>
    </div>
  );

  // ── Tab: Analytics ────────────────────────────────────────────────────────
  const AnalyticsTab = () => (
    <div style={{ maxWidth: '700px' }}>
      {analyticsLoading ? (
        <Card style={{ padding: '60px', textAlign: 'center' }}>
          <div style={{ width: '36px', height: '36px', border: `3px solid ${BORDER}`, borderTopColor: BLUE, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: TEXTSUB }}>Loading analytics…</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </Card>
      ) : analytics ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {[
              { icon: <Clock size={22} color='#f59e0b' />, iconBg: '#fffbeb', title: 'Avg Wait Time (All Time)', value: analytics.avgWaitMin > 0 ? `${analytics.avgWaitMin} min` : '—', sub: `Based on ${analytics.served} served patients` },
              { icon: <Activity size={22} color={BLUE} />, iconBg: BLUE_BG, title: 'Avg Patients / Day', value: analytics.avgPerDay !== null ? String(analytics.avgPerDay) : '—', sub: 'All-time daily average' },
              { icon: <BarChart2 size={22} color='#8b5cf6' />, iconBg: '#f5f3ff', title: '#1 Peak Hour', value: fmtHour(analytics.peakHour), sub: 'Busiest hour all time' },
            ].map((s, i) => (
              <Card key={i} style={{ padding: '20px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: s.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>{s.icon}</div>
                <p style={{ fontSize: '13px', color: TEXTSUB, marginBottom: '6px' }}>{s.title}</p>
                <p style={{ fontSize: '28px', fontWeight: 800, color: TEXT, letterSpacing: '-1px', marginBottom: '4px' }}>{s.value}</p>
                <p style={{ fontSize: '12px', color: TEXTSUB }}>{s.sub}</p>
              </Card>
            ))}
          </div>
          <Card style={{ padding: '20px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' as const }}>
            <Info size={16} color={TEXTSUB} style={{ flexShrink: 0 }} />
            <p style={{ fontSize: '13px', color: TEXTSUB }}>Analytics are computed from all patient visits recorded in your clinic's history. Patient identifiers are cleared nightly.</p>
          </Card>
        </div>
      ) : (
        <Card style={{ padding: '60px', textAlign: 'center' }}>
          <BarChart2 size={40} color={TEXTSUB} style={{ margin: '0 auto 12px' }} />
          <p style={{ color: TEXTSUB }}>No analytics data yet</p>
        </Card>
      )}
    </div>
  );

  // ── Tab: Profile ──────────────────────────────────────────────────────────
  const ProfileTab = () => (
    <Card style={{ padding: '24px', maxWidth: '600px' }}>
      <h3 style={{ fontSize: '15px', fontWeight: 700, color: TEXT, marginBottom: '20px' }}>Clinic Information</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <LInput label="Clinic Name" value={pName} onChange={setPName} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <LInput label="ZIP Code" value={pZip} onChange={setPZip} placeholder="e.g. 70471" />
          <LInput label="Phone Number" value={pPhone} onChange={setPPhone} placeholder="e.g. (504) 555-0100" />
        </div>
        <LInput label="Address" value={pAddress} onChange={setPAddress} placeholder="123 Main St, City, State" />
        <LInput label="Website" value={pWebsite} onChange={setPWebsite} placeholder="https://yourclinic.com" />
        <LInput label="Contact Email" value={pEmail} onChange={setPEmail} type="email" placeholder="admin@yourclinic.com" />
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
          <SaveBtn saving={profileSaving} saved={profileSaved} onClick={saveProfile} label="Save Profile" />
        </div>
      </div>
    </Card>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: '100vh', background: PAGE_BG, fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>

      {/* Sidebar */}
      <div style={{ width: '220px', background: SIDEBAR, borderRight: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: '16px' }}>W</span>
            </div>
            <span style={{ fontSize: '18px', fontWeight: 800, color: TEXT, letterSpacing: '-0.5px' }}>wavit</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '12px 10px', flex: 1 }}>
          {navItems.map(item => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                  padding: '10px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                  background: active ? BLUE_BG : 'transparent',
                  color: active ? BLUE_TXT : TEXTSUB,
                  fontWeight: active ? 700 : 500, fontSize: '14px',
                  textAlign: 'left' as const, transition: 'all 0.15s', marginBottom: '2px',
                  fontFamily: "'Inter', sans-serif",
                  borderLeft: active ? `3px solid ${BLUE}` : '3px solid transparent',
                }}
              >
                {item.icon}{item.label}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: '12px 10px', borderTop: `1px solid ${BORDER}` }}>
          <div style={{ padding: '10px 12px', borderRadius: '10px', background: '#fafafa', fontSize: '12px', color: TEXTSUB }}>
            <p style={{ fontWeight: 600, color: TEXT, fontSize: '13px', marginBottom: '2px' }}>{shop?.name}</p>
            <p>ZIP {shop?.zip_code || '—'}</p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ background: '#fff', borderBottom: `1px solid ${BORDER}`, padding: '18px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: TEXT, letterSpacing: '-0.5px', marginBottom: '2px' }}>{shop?.name}</h1>
            <p style={{ fontSize: '13px', color: TEXTSUB }}>ZIP {shop?.zip_code || '—'}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => { setTab('queue'); setShowAddModal(true); }}
              style={{ padding: '10px 18px', borderRadius: '10px', border: 'none', background: BLUE, color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px' }}>
              <Plus size={15} /> Add Patient
            </button>
            <button
              onClick={() => setShowQR(true)}
              style={{ padding: '9px 16px', borderRadius: '10px', border: `1px solid ${BORDER}`, background: '#fff', color: TEXT, fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px' }}>
              <QrCode size={15} /> QR Code
            </button>
            <button
              onClick={logout}
              style={{ padding: '9px 16px', borderRadius: '10px', border: `1px solid ${BORDER}`, background: '#fff', color: TEXTSUB, fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px' }}>
              <LogOut size={15} /> Logout
            </button>
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          {tab === 'dashboard'  && DashboardTab()}
          {tab === 'queue'      && QueueTab()}
          {tab === 'widget'     && WidgetTab()}
          {tab === 'settings'   && SettingsTab()}
          {tab === 'analytics'  && AnalyticsTab()}
          {tab === 'profile'    && ProfileTab()}

          <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '12px', color: '#cbd5e1' }}>
            © {new Date().getFullYear()} Wavit. All rights reserved.
          </div>
        </div>
      </div>

      {/* Add Patient Modal — inlined to prevent input focus loss on re-render */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <Card style={{ width: '100%', maxWidth: '400px', padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: TEXT }}>Add Patient to Queue</h3>
              <button onClick={() => setShowAddModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: TEXTSUB }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <LInput label="Patient First Name *" value={addName} onChange={setAddName} placeholder="e.g. Sarah" autoFocus />
              {addError && <p style={{ color: RED_C, fontSize: '13px' }}>{addError}</p>}
              <button
                onClick={addPatient} disabled={addLoading}
                style={{ padding: '12px', borderRadius: '10px', border: 'none', background: BLUE, color: '#fff', fontSize: '14px', fontWeight: 700, cursor: addLoading ? 'not-allowed' : 'pointer', opacity: addLoading ? 0.7 : 1 }}
              >{addLoading ? 'Adding…' : 'Add to Queue'}</button>
            </div>
          </Card>
        </div>
      )}
      {/* Open Queue prompt — shown after adding a patient when queue is closed */}
      {showOpenQueuePrompt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <Card style={{ width: '100%', maxWidth: '360px', padding: '28px', textAlign: 'center' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <UserCheck size={24} color={GREEN} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: TEXT, marginBottom: '8px' }}>Patient added</h3>
            <p style={{ fontSize: '14px', color: TEXTSUB, marginBottom: '24px', lineHeight: 1.6 }}>
              The queue is currently <strong style={{ color: RED_C }}>closed</strong>. Would you like to open it so patients can see their position?
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowOpenQueuePrompt(false)}
                style={{ flex: 1, padding: '12px', borderRadius: '10px', border: `1px solid ${BORDER}`, background: '#fff', color: TEXTSUB, fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
              >
                Keep Closed
              </button>
              <button
                onClick={async () => { setShowOpenQueuePrompt(false); await toggleQueue(); }}
                style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: GREEN, color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
              >
                Open Queue
              </button>
            </div>
          </Card>
        </div>
      )}

      {showCloseConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <Card style={{ maxWidth: '340px', width: '100%', textAlign: 'center', padding: '28px 24px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <X size={24} color={RED_C} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: TEXT, marginBottom: '8px' }}>Close the queue?</h3>
            <p style={{ fontSize: '14px', color: TEXTSUB, marginBottom: '24px', lineHeight: 1.6 }}>
              No new patients will be able to join. The queue will reopen automatically at your set opening time.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowCloseConfirm(false)}
                style={{ flex: 1, padding: '12px', borderRadius: '10px', border: `1px solid ${BORDER}`, background: '#fff', color: TEXTSUB, fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
              >
                Keep Open
              </button>
              <button
                onClick={async () => { setShowCloseConfirm(false); await toggleQueue(); }}
                style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: RED_C, color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
              >
                Close Queue
              </button>
            </div>
          </Card>
        </div>
      )}

      {showQR && <QRModal />}
    </div>
  );
}
