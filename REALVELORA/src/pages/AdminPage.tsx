import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { API_BASE } from '../lib/api';

interface Ticket {
  id: string;
  shop_id: string;
  name: string;
  phone: string;
  joined_at: number;
  served_at: number | null;
  exited_at: number | null;
  reminder_sent_at: number | null;
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
}

interface AdminData {
  shop: Shop;
  queue: Ticket[];
  recentlyServed: Ticket[];
}

interface CompetitorAnalytics {
  count: number;
  zipCode: string;
  category: string;
  avgTotal: number;
  avgServed: number;
  avgNoShowRate: number;
  avgWaitMin: number;
  avgLeftEarly: number;
}

interface Analytics {
  total: number;
  served: number;
  leftBeforeServed: number;
  noShowRate: number;
  avgWaitMin: number;
  days: number;
  competitors: CompetitorAnalytics | null;
}

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

export default function AdminPage() {
  const { shopId, secret } = useParams<{ shopId: string; secret: string }>();
  const [data, setData] = useState<AdminData | null | undefined>(undefined);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [tab, setTab] = useState<'queue' | 'recent' | 'analytics'>('queue');
  const [analyticsEmail, setAnalyticsEmail] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
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

  const settingsInitialized = useRef(false);

  const fetchData = useCallback(async () => {
    if (!shopId || !secret) return;
    try {
      const res = await fetch(`${API_BASE}/admin/${shopId}/${secret}`);
      if (res.status === 403) { setError('Invalid admin link'); setData(null); return; }
      if (res.status === 404) { setError('Shop not found'); setData(null); return; }
      const json = await res.json();
      setData(json);
      if (!analyticsEmail && json.shop?.analytics_email) setAnalyticsEmail(json.shop.analytics_email);
      if (!settingsInitialized.current && json.shop) {
        setNumStaff(json.shop.num_staff || 1);
        setAvgServiceMin(json.shop.avg_service_minutes || 15);
        setQueueOpen(json.shop.queue_open !== false);
        setOpeningTime(json.shop.opening_time || '09:00');
        setClosingTime(json.shop.closing_time || '18:00');
        settingsInitialized.current = true;
      }
    } catch {
      setError('Could not connect to server');
      setData(null);
    }
  }, [shopId, secret, analyticsEmail]);

  const fetchAnalytics = useCallback(async () => {
    if (!shopId || !secret) return;
    try {
      const res = await fetch(`${API_BASE}/admin/${shopId}/${secret}/analytics`);
      if (res.ok) setAnalytics(await res.json());
    } catch { /* silent */ }
  }, [shopId, secret]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    if (tab === 'analytics') fetchAnalytics();
  }, [tab, fetchAnalytics]);

  const markServed = async (ticketId: string) => {
    setActionLoading(ticketId + '-served');
    await fetch(`${API_BASE}/admin/${shopId}/${secret}/serve/${ticketId}`, { method: 'POST' });
    await fetchData();
    setActionLoading(null);
  };

  const removeTicket = async (ticketId: string) => {
    setActionLoading(ticketId + '-remove');
    await fetch(`${API_BASE}/admin/${shopId}/${secret}/tickets/${ticketId}`, { method: 'DELETE' });
    await fetchData();
    setActionLoading(null);
  };

  const saveSettings = async () => {
    setSettingsSaving(true);
    await fetch(`${API_BASE}/admin/${shopId}/${secret}/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numStaff, avgServiceMinutes: avgServiceMin }),
    });
    await fetchData();
    setSettingsSaving(false);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  const toggleQueue = async () => {
    setToggleLoading(true);
    const next = !queueOpen;
    setQueueOpen(next);
    await fetch(`${API_BASE}/admin/${shopId}/${secret}/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queueOpen: next }),
    });
    await fetchData();
    setToggleLoading(false);
  };

  const saveHours = async () => {
    setHoursSaving(true);
    await fetch(`${API_BASE}/admin/${shopId}/${secret}/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ openingTime, closingTime }),
    });
    await fetchData();
    setHoursSaving(false);
    setHoursSaved(true);
    setTimeout(() => setHoursSaved(false), 2500);
  };

  const toggleAnalytics = async (enabled: boolean) => {
    await fetch(`${API_BASE}/admin/${shopId}/${secret}/analytics/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled, email: analyticsEmail || undefined }),
    });
    await fetchData();
  };

  const saveEmail = async () => {
    setEmailSaving(true);
    await fetch(`${API_BASE}/admin/${shopId}/${secret}/analytics/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: data?.shop.analytics_enabled ?? true, email: analyticsEmail }),
    });
    await fetchData();
    setEmailSaving(false);
  };

  const sendNow = async () => {
    setActionLoading('send-email');
    const res = await fetch(`${API_BASE}/admin/${shopId}/${secret}/analytics/send`, { method: 'POST' });
    if (res.ok) setEmailSent(true);
    setActionLoading(null);
    setTimeout(() => setEmailSent(false), 4000);
  };

  if (data === undefined) {
    return (
      <div className="min-h-screen bg-[#f8f7ff] flex items-center justify-center">
        <svg className="animate-spin w-7 h-7 text-violet-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#f8f7ff] flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white rounded-2xl border border-gray-100 max-w-sm w-full">
          <div class="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><svg width="24" height="24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg></div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-sm text-gray-500 mb-5">{error || 'This admin link is not valid.'}</p>
          <Link to="/" className="text-sm font-semibold text-violet-600">← Back to Home</Link>
        </div>
      </div>
    );
  }

  const { shop, queue, recentlyServed } = data;
  const serving = queue.find(t => t.served_at && !t.exited_at);
  const waiting = queue.filter(t => !t.served_at && !t.exited_at);
  const totalToday = queue.length + recentlyServed.length;

  return (
    <div className="min-h-screen bg-[#f8f7ff] pb-10">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1a0845] to-[#3b1fa3] text-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 pb-8">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 bg-white/15 rounded-lg flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 3L4 14h7v7l9-11h-7V3z" />
              </svg>
            </div>
            <span className="text-sm font-bold text-violet-300 tracking-wide">wavit · admin</span>
          </div>

          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black mb-1">{shop.name}</h1>
              <p className="text-violet-400 text-sm font-medium">
                {shop.category} · {shop.avg_service_minutes} min avg
                {shop.zip_code && <span> · ZIP {shop.zip_code}</span>}
              </p>
            </div>
            <button
              onClick={() => setShowQR(true)}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold rounded-xl transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              QR Code
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-5">
            {[
              { label: 'Waiting', value: waiting.length, highlight: waiting.length > 0 },
              { label: 'Serving', value: serving ? 1 : 0, highlight: !!serving, color: 'text-emerald-300' },
              { label: 'Today', value: totalToday, highlight: false },
            ].map(stat => (
              <div key={stat.label} className="bg-white/10 rounded-xl p-3 text-center border border-white/10">
                <p className={`text-2xl font-black ${stat.color || 'text-white'}`}>{stat.value}</p>
                <p className="text-[11px] text-violet-400 mt-0.5 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Queue open/close toggle */}
          <div className={`mt-4 rounded-2xl border p-4 flex items-center justify-between gap-3 ${
            queueOpen ? 'bg-emerald-500/20 border-emerald-400/30' : 'bg-red-500/20 border-red-400/30'
          }`}>
            <div>
              <p className={`text-sm font-bold ${queueOpen ? 'text-emerald-200' : 'text-red-200'}`}>
                {queueOpen ? 'Queue is Open' : 'Queue is Closed'}
              </p>
              <p className="text-[11px] text-white/50 mt-0.5">
                {queueOpen ? 'Customers can join right now' : 'No new customers can join'}
              </p>
            </div>
            <button
              onClick={toggleQueue}
              disabled={toggleLoading}
              className={`shrink-0 px-4 py-2.5 font-bold text-sm rounded-xl transition-all disabled:opacity-60 ${
                queueOpen
                  ? 'bg-red-500/80 hover:bg-red-500 text-white'
                  : 'bg-emerald-500/80 hover:bg-emerald-500 text-white'
              }`}
            >
              {toggleLoading ? '...' : queueOpen ? 'Close Queue' : 'Open Queue'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 -mt-3 space-y-3">

        {/* Currently serving */}
        {serving && (
          <div className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-sm shadow-emerald-100/60">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Now Serving</p>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-gray-900 text-lg">{serving.name}</p>
                <p className="text-sm text-gray-400">{serving.phone}</p>
                <p className="text-xs text-emerald-600 mt-1 font-semibold">
                  {serving.served_at ? `Serving for ${waitTime(serving.served_at)}` : ''}
                </p>
              </div>
              <button
                onClick={() => markServed(serving.id)}
                disabled={actionLoading === serving.id + '-served'}
                className="shrink-0 px-5 py-2.5 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm"
              >
                {actionLoading === serving.id + '-served' ? '...' : 'Done ✓'}
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-gray-100 p-1.5 flex gap-1">
          {[
            { key: 'queue', label: `Queue`, count: waiting.length },
            { key: 'recent', label: `History`, count: recentlyServed.length },
            { key: 'analytics', label: 'Analytics', count: null },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                tab === t.key
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {t.label}
              {t.count !== null && (
                <span className={`text-xs px-1.5 py-0.5 rounded-md font-bold ${tab === t.key ? 'bg-white/20' : 'bg-gray-100'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Queue list */}
        {tab === 'queue' && (
          <div className="space-y-2">
            {waiting.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                
                <p className="font-bold text-gray-800">Queue is empty</p>
                <p className="text-sm text-gray-400 mt-1">No one waiting right now</p>
              </div>
            ) : (
              waiting.map((ticket, i) => (
                <div key={ticket.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
                  <div className="w-9 h-9 bg-violet-600 text-white rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-[15px] truncate">{ticket.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{ticket.phone} · {timeAgo(ticket.joined_at)}</p>
                    {ticket.reminder_sent_at && (
                      <span className="inline-flex items-center mt-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                        ⚠ Check-in sent
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => markServed(ticket.id)}
                      disabled={!!actionLoading}
                      className="px-3 py-2 bg-emerald-600 text-white font-semibold text-xs rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === ticket.id + '-served' ? '...' : 'Serve'}
                    </button>
                    <button
                      onClick={() => removeTicket(ticket.id)}
                      disabled={!!actionLoading}
                      className="px-3 py-2 bg-gray-100 text-gray-600 font-semibold text-xs rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === ticket.id + '-remove' ? '...' : 'Remove'}
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* Queue settings card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 mt-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Queue Settings</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    Staff on duty
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setNumStaff(n => Math.max(1, n - 1))}
                      className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-lg transition-colors flex items-center justify-center"
                    >−</button>
                    <span className="text-xl font-black text-violet-700 w-8 text-center">{numStaff}</span>
                    <button
                      onClick={() => setNumStaff(n => Math.min(20, n + 1))}
                      className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-lg transition-colors flex items-center justify-center"
                    >+</button>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1.5 leading-snug">
                    {numStaff === 1 ? 'Solo service' : `${numStaff} barbers working — wait times divided accordingly`}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    Avg service time
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAvgServiceMin(m => Math.max(1, m - 5))}
                      className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-lg transition-colors flex items-center justify-center"
                    >−</button>
                    <span className="text-xl font-black text-violet-700 w-10 text-center">{avgServiceMin}m</span>
                    <button
                      onClick={() => setAvgServiceMin(m => Math.min(120, m + 5))}
                      className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-lg transition-colors flex items-center justify-center"
                    >+</button>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1.5 leading-snug">Per customer</p>
                </div>
              </div>

              <p className="text-[11px] text-violet-700 font-medium mt-3 mb-3">
                With {numStaff} staff × {avgServiceMin} min: serving {numStaff} customers every {avgServiceMin} min
              </p>

              <button
                onClick={saveSettings}
                disabled={settingsSaving}
                className={`w-full py-2.5 font-semibold text-sm rounded-xl transition-colors ${
                  settingsSaved
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-violet-600 text-white hover:bg-violet-700'
                } disabled:opacity-50`}
              >
                {settingsSaved ? '✓ Settings saved' : settingsSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>

            {/* Operating hours */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50">
                <h3 className="text-sm font-bold text-gray-900">Operating Hours</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Shown to customers on your shop listing</p>
              </div>
              <div className="px-5 py-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Opening time</label>
                    <input
                      type="time"
                      value={openingTime}
                      onChange={e => setOpeningTime(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Closing time</label>
                    <input
                      type="time"
                      value={closingTime}
                      onChange={e => setClosingTime(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400"
                    />
                  </div>
                </div>
                <button
                  onClick={saveHours}
                  disabled={hoursSaving}
                  className={`w-full py-2.5 font-semibold text-sm rounded-xl transition-colors ${
                    hoursSaved
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-violet-600 text-white hover:bg-violet-700'
                  } disabled:opacity-50`}
                >
                  {hoursSaved ? '✓ Hours saved' : hoursSaving ? 'Saving...' : 'Save Hours'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* History */}
        {tab === 'recent' && (
          <div className="space-y-2">
            {recentlyServed.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                <p className="text-sm text-gray-400">No history yet</p>
              </div>
            ) : (
              [...recentlyServed].reverse().map(ticket => (
                <div key={ticket.id} className="bg-white rounded-2xl border border-gray-100 px-4 py-3.5 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-[15px] truncate">{ticket.name}</p>
                    <p className="text-xs text-gray-400">{ticket.phone}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400">{ticket.exited_at ? timeAgo(ticket.exited_at) : '—'}</p>
                    <span className={`text-[11px] font-bold mt-0.5 block ${ticket.served_at ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {ticket.served_at ? '✓ Served' : 'Left early'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Analytics */}
        {tab === 'analytics' && (
          <div className="space-y-3">
            {analytics ? (
              <>
                {/* Your performance */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Your Performance — Last {analytics.days} Days</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { label: 'Total Joins', value: analytics.total, color: 'text-violet-700' },
                      { label: 'Served', value: analytics.served, color: 'text-emerald-600' },
                      { label: 'Left Early', value: analytics.leftBeforeServed, color: 'text-gray-600' },
                      {
                        label: 'No-Show Rate',
                        value: `${analytics.noShowRate}%`,
                        color: analytics.noShowRate > 30 ? 'text-red-600' : analytics.noShowRate > 15 ? 'text-amber-600' : 'text-emerald-600',
                      },
                      { label: 'Avg Wait', value: `${analytics.avgWaitMin}m`, color: 'text-violet-700' },
                    ].map(stat => (
                      <div key={stat.label} className="bg-gray-50 rounded-xl p-4 text-center">
                        <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                        <p className="text-[11px] text-gray-500 mt-1 font-medium">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                  {analytics.noShowRate > 30 && !analytics.competitors && (
                    <div className="mt-4 p-3.5 bg-red-50 rounded-xl border border-red-100">
                      <p className="text-xs text-red-700 font-medium leading-relaxed">
                        ⚠ High no-show rate — many customers leave before being served. Consider reducing queue size or sending earlier reminders.
                      </p>
                    </div>
                  )}
                </div>

                {/* Competitor comparison */}
                {analytics.competitors ? (
                  <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Local Competition</p>
                        <p className="text-sm text-gray-700 font-semibold mt-0.5">
                          {analytics.competitors.count} other {analytics.competitors.category} shop{analytics.competitors.count > 1 ? 's' : ''} in ZIP {analytics.competitors.zipCode}
                        </p>
                      </div>
                      <span className="text-xs bg-violet-50 text-violet-700 font-semibold px-2.5 py-1 rounded-lg border border-violet-100">
                        Area avg
                      </span>
                    </div>

                    <div className="space-y-2">
                      {[
                        {
                          label: 'Total Joins',
                          mine: analytics.total,
                          avg: analytics.competitors.avgTotal,
                          lowerBetter: false,
                          unit: '',
                        },
                        {
                          label: 'Customers Served',
                          mine: analytics.served,
                          avg: analytics.competitors.avgServed,
                          lowerBetter: false,
                          unit: '',
                        },
                        {
                          label: 'No-Show Rate',
                          mine: analytics.noShowRate,
                          avg: analytics.competitors.avgNoShowRate,
                          lowerBetter: true,
                          unit: '%',
                        },
                        {
                          label: 'Avg Wait Time',
                          mine: analytics.avgWaitMin,
                          avg: analytics.competitors.avgWaitMin,
                          lowerBetter: true,
                          unit: 'm',
                        },
                      ].map(row => {
                        const diff = row.mine - row.avg;
                        const better = row.lowerBetter ? diff < 0 : diff > 0;
                        const worse = row.lowerBetter ? diff > 0 : diff < 0;
                        const vsColor = diff === 0 ? 'text-gray-500' : better ? 'text-emerald-600' : 'text-red-600';
                        const vsLabel = diff === 0
                          ? '= avg'
                          : `${better ? '▲' : '▼'} ${Math.abs(diff)}${row.unit}`;
                        return (
                          <div key={row.label} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                            <span className="text-sm text-gray-600 font-medium">{row.label}</span>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <span className="text-[11px] text-gray-400 font-medium">Area avg </span>
                                <span className="text-sm font-bold text-gray-500">{row.avg}{row.unit}</span>
                              </div>
                              <div className="text-right min-w-[64px]">
                                <span className="text-sm font-black text-gray-900">{row.mine}{row.unit}</span>
                                <p className={`text-[11px] font-bold ${vsColor}`}>{vsLabel}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Insights */}
                    <div className="mt-4 space-y-2">
                      {analytics.noShowRate > analytics.competitors.avgNoShowRate && (
                        <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                          <p className="text-xs text-red-700 font-medium leading-relaxed">⚠ Your no-show rate is above the local average. Nearby {analytics.competitors.category}s are retaining more customers — consider earlier reminders or smaller queue limits.</p>
                        </div>
                      )}
                      {analytics.noShowRate < analytics.competitors.avgNoShowRate && (
                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                          <p className="text-xs text-emerald-700 font-medium leading-relaxed">✅ Your no-show rate beats the local average. Your customers are more engaged than nearby competitors.</p>
                        </div>
                      )}
                      {analytics.total < analytics.competitors.avgTotal && (
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                          <p className="text-xs text-amber-700 font-medium leading-relaxed">💡 Nearby {analytics.competitors.category}s attract more customers on average. Try improving QR code placement or promoting your Wavit link on social media.</p>
                        </div>
                      )}
                      {analytics.total > analytics.competitors.avgTotal && (
                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                          <p className="text-xs text-emerald-700 font-medium leading-relaxed">✅ You're attracting more customers than the local average. Strong demand in your area.</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : shop.zip_code ? (
                  <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
                    <p className="text-2xl mb-2">🏆</p>
                    <p className="text-sm font-bold text-gray-800">No competitors yet in ZIP {shop.zip_code}</p>
                    <p className="text-xs text-gray-400 mt-1">You're the only {shop.category} on Wavit in your area.</p>
                  </div>
                ) : (
                  <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4">
                    <p className="text-xs font-bold text-violet-700 mb-1">💡 Add your ZIP code to unlock competitor insights</p>
                    <p className="text-xs text-violet-600 leading-relaxed">Once your ZIP code is set, your biweekly email will include a comparison against similar shops in your area.</p>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                <svg className="animate-spin w-6 h-6 text-violet-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-sm text-gray-400">Loading analytics...</p>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-bold text-gray-900">Email Reports</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {shop.last_analytics_sent ? `Last sent ${timeAgo(shop.last_analytics_sent)}` : 'Never sent'}
                  </p>
                </div>
                <button
                  onClick={() => toggleAnalytics(!shop.analytics_enabled)}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${shop.analytics_enabled ? 'bg-violet-600' : 'bg-gray-200'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${shop.analytics_enabled ? 'translate-x-6' : ''}`} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Report email</label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={analyticsEmail}
                      onChange={e => setAnalyticsEmail(e.target.value)}
                      placeholder="owner@example.com"
                      className="flex-1 px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-all"
                    />
                    <button
                      onClick={saveEmail}
                      disabled={emailSaving || !analyticsEmail}
                      className="px-4 py-2.5 bg-violet-600 text-white font-semibold text-sm rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-50"
                    >
                      {emailSaving ? '...' : 'Save'}
                    </button>
                  </div>
                </div>

                {shop.analytics_email && (
                  <button
                    onClick={sendNow}
                    disabled={actionLoading === 'send-email'}
                    className="w-full py-2.5 bg-gray-50 text-gray-700 font-semibold text-sm rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    {emailSent ? '✓ Report sent!' : actionLoading === 'send-email' ? 'Sending...' : 'Send Report Now'}
                  </button>
                )}
              </div>
            </div>

            <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4">
              <p className="text-xs font-bold text-violet-700 mb-1">📌 Bookmark this page</p>
              <p className="text-xs text-violet-600 leading-relaxed">
                This is your private admin link. Share only with your staff.
              </p>
            </div>
          </div>
        )}

        {tab !== 'analytics' && (
          <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4">
            <p className="text-xs font-bold text-violet-700 mb-0.5">📌 Bookmark this page</p>
            <p className="text-xs text-violet-600 leading-relaxed">This is your private admin link. Share only with your staff.</p>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {showQR && (() => {
        const joinUrl = `${window.location.origin}/join/${shopId}`;
        const downloadQR = () => {
          const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement;
          if (!canvas) return;
          const url = canvas.toDataURL('image/png');
          const a = document.createElement('a');
          a.href = url;
          a.download = `${shop.name.replace(/\s+/g, '-').toLowerCase()}-qr.png`;
          a.click();
        };
        const copyLink = async () => {
          await navigator.clipboard.writeText(joinUrl);
          setLinkCopied(true);
          setTimeout(() => setLinkCopied(false), 2500);
        };
        return (
          <div
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setShowQR(false)}
          >
            <div
              className="bg-white rounded-3xl shadow-2xl w-full max-w-xs overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="bg-gradient-to-br from-[#1a0845] to-[#3b1fa3] px-5 pt-5 pb-6 text-white text-center">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-violet-300 uppercase tracking-widest">Queue QR Code</span>
                  <button
                    onClick={() => setShowQR(false)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <h2 className="text-lg font-black">{shop.name}</h2>
                <p className="text-violet-300 text-xs mt-1">Customers scan this to join your queue</p>
              </div>

              {/* QR code */}
              <div className="flex items-center justify-center py-6 px-5 bg-white">
                <div className="p-3 rounded-2xl border-2 border-violet-100 bg-white shadow-inner">
                  <QRCodeCanvas
                    id="qr-canvas"
                    value={joinUrl}
                    size={200}
                    level="H"
                    includeMargin={false}
                  />
                </div>
              </div>

              {/* URL display */}
              <div className="px-5 pb-2">
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 flex items-center gap-2">
                  <p className="text-xs font-mono text-gray-600 truncate flex-1">{joinUrl}</p>
                  <button
                    onClick={copyLink}
                    className="shrink-0 text-xs font-bold text-violet-600 hover:text-violet-700 transition-colors"
                  >
                    {linkCopied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="px-5 pb-5 pt-3 flex gap-2">
                <button
                  onClick={copyLink}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-200 transition-colors"
                >
                  {linkCopied ? '✓ Copied!' : 'Copy Link'}
                </button>
                <button
                  onClick={downloadQR}
                  className="flex-1 py-3 bg-violet-600 text-white font-bold text-sm rounded-xl hover:bg-violet-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </button>
              </div>

              <div className="px-5 pb-5">
                <p className="text-xs text-gray-400 text-center leading-relaxed">
                  Print this and display it at your front door or counter so customers can easily scan in.
                </p>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
