import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';

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
  avg_service_minutes: number;
  waitRange: string;
  current_service_started_at: number | null;
  analytics_enabled: boolean;
  analytics_email: string | null;
  last_analytics_sent: number | null;
}

interface AdminData {
  shop: Shop;
  queue: Ticket[];
  recentlyServed: Ticket[];
}

interface Analytics {
  total: number;
  served: number;
  leftBeforeServed: number;
  noShowRate: number;
  avgWaitMin: number;
  days: number;
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
  const [now, setNow] = useState(Date.now());
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [tab, setTab] = useState<'queue' | 'recent' | 'analytics'>('queue');
  const [analyticsEmail, setAnalyticsEmail] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const fetchData = useCallback(async () => {
    if (!shopId || !secret) return;
    try {
      const res = await fetch(`/api/admin/${shopId}/${secret}`);
      if (res.status === 403) { setError('Invalid admin link'); setData(null); return; }
      if (res.status === 404) { setError('Shop not found'); setData(null); return; }
      const json = await res.json();
      setData(json);
      if (!analyticsEmail && json.shop?.analytics_email) {
        setAnalyticsEmail(json.shop.analytics_email);
      }
    } catch {
      setError('Could not connect to server');
      setData(null);
    }
  }, [shopId, secret, analyticsEmail]);

  const fetchAnalytics = useCallback(async () => {
    if (!shopId || !secret) return;
    try {
      const res = await fetch(`/api/admin/${shopId}/${secret}/analytics`);
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

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const markServed = async (ticketId: string) => {
    setActionLoading(ticketId + '-served');
    await fetch(`/api/admin/${shopId}/${secret}/serve/${ticketId}`, { method: 'POST' });
    await fetchData();
    setActionLoading(null);
  };

  const removeTicket = async (ticketId: string) => {
    setActionLoading(ticketId + '-remove');
    await fetch(`/api/admin/${shopId}/${secret}/tickets/${ticketId}`, { method: 'DELETE' });
    await fetchData();
    setActionLoading(null);
  };

  const toggleAnalytics = async (enabled: boolean) => {
    await fetch(`/api/admin/${shopId}/${secret}/analytics/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled, email: analyticsEmail || undefined }),
    });
    await fetchData();
  };

  const saveEmail = async () => {
    setEmailSaving(true);
    await fetch(`/api/admin/${shopId}/${secret}/analytics/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: data?.shop.analytics_enabled ?? true, email: analyticsEmail }),
    });
    await fetchData();
    setEmailSaving(false);
  };

  const sendNow = async () => {
    setActionLoading('send-email');
    const res = await fetch(`/api/admin/${shopId}/${secret}/analytics/send`, { method: 'POST' });
    if (res.ok) setEmailSent(true);
    setActionLoading(null);
    setTimeout(() => setEmailSent(false), 4000);
  };

  if (data === undefined) {
    return (
      <div className="min-h-screen bg-violet-50/50 flex items-center justify-center">
        <svg className="animate-spin w-8 h-8 text-violet-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-violet-50/50 flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white rounded-3xl border border-violet-100 max-w-sm w-full">
          <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
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
    <div className="min-h-screen bg-violet-50/50 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-900 to-purple-800 text-white px-4 sm:px-6 pt-8 pb-10 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
        </div>
        <div className="relative max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-white/15 rounded-lg flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-sm font-bold text-violet-300">wavit admin</span>
          </div>
          <h1 className="text-2xl font-black mb-0.5">{shop.name}</h1>
          <p className="text-violet-300 text-sm">{shop.category} · {shop.avg_service_minutes} min avg</p>

          <div className="grid grid-cols-3 gap-3 mt-5">
            {[
              { label: 'Waiting', value: waiting.length, color: 'text-white' },
              { label: 'Serving', value: serving ? 1 : 0, color: serving ? 'text-emerald-300' : 'text-white' },
              { label: 'Today', value: totalToday, color: 'text-violet-200' },
            ].map(stat => (
              <div key={stat.label} className="bg-white/10 rounded-2xl p-3 text-center backdrop-blur-sm">
                <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-violet-300 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 32L720 16L1440 32V32H0V32Z" fill="rgb(245 243 255 / 0.5)"/>
          </svg>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 space-y-4">

        {/* Currently serving */}
        {serving && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Now Serving</p>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-gray-900 text-lg">{serving.name}</p>
                <p className="text-sm text-gray-500">{serving.phone}</p>
                <p className="text-xs text-emerald-600 mt-1">
                  Serving for {serving.served_at ? waitTime(serving.served_at) : '—'}
                </p>
              </div>
              <button
                onClick={() => markServed(serving.id)}
                disabled={actionLoading === serving.id + '-served'}
                className="shrink-0 px-4 py-2.5 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {actionLoading === serving.id + '-served' ? '...' : 'Done ✓'}
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { key: 'queue', label: `Queue (${waiting.length})` },
            { key: 'recent', label: `History (${recentlyServed.length})` },
            { key: 'analytics', label: 'Analytics' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                tab === t.key
                  ? 'bg-violet-600 text-white'
                  : 'bg-white text-gray-600 border border-violet-100 hover:border-violet-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Queue list */}
        {tab === 'queue' && (
          <div className="space-y-3">
            {waiting.length === 0 ? (
              <div className="bg-white rounded-2xl border border-violet-100/60 p-10 text-center">
                <p className="text-3xl mb-2">✨</p>
                <p className="font-semibold text-gray-700">Queue is empty</p>
                <p className="text-sm text-gray-400 mt-1">No one waiting right now</p>
              </div>
            ) : (
              waiting.map((ticket, i) => (
                <div key={ticket.id} className="bg-white rounded-2xl border border-violet-100/60 p-4 flex items-center gap-4">
                  <div className="w-9 h-9 bg-violet-100 text-violet-700 rounded-xl flex items-center justify-center font-black text-sm shrink-0">
                    #{i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">{ticket.name}</p>
                    <p className="text-xs text-gray-400">{ticket.phone} · Waited {timeAgo(ticket.joined_at)}</p>
                    {ticket.reminder_sent_at && (
                      <span className="inline-flex items-center mt-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        ⚠ Check-in sent
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => markServed(ticket.id)}
                      disabled={!!actionLoading}
                      className="px-3 py-2 bg-emerald-50 text-emerald-700 font-semibold text-xs rounded-xl hover:bg-emerald-100 transition-colors disabled:opacity-50 border border-emerald-200"
                    >
                      {actionLoading === ticket.id + '-served' ? '...' : 'Serve'}
                    </button>
                    <button
                      onClick={() => removeTicket(ticket.id)}
                      disabled={!!actionLoading}
                      className="px-3 py-2 bg-red-50 text-red-600 font-semibold text-xs rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50 border border-red-100"
                    >
                      {actionLoading === ticket.id + '-remove' ? '...' : 'Remove'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* History */}
        {tab === 'recent' && (
          <div className="space-y-2">
            {recentlyServed.length === 0 ? (
              <div className="bg-white rounded-2xl border border-violet-100/60 p-10 text-center">
                <p className="text-sm text-gray-400">No history yet</p>
              </div>
            ) : (
              [...recentlyServed].reverse().map(ticket => (
                <div key={ticket.id} className="bg-white rounded-2xl border border-violet-100/60 px-4 py-3 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{ticket.name}</p>
                    <p className="text-xs text-gray-400">{ticket.phone}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs text-gray-400">
                      {ticket.exited_at ? timeAgo(ticket.exited_at) : '—'}
                    </span>
                    <p className={`text-xs font-medium mt-0.5 ${ticket.served_at ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {ticket.served_at ? 'Served' : 'Left queue'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Analytics */}
        {tab === 'analytics' && (
          <div className="space-y-4">
            {/* Stats */}
            {analytics ? (
              <div className="bg-white rounded-2xl border border-violet-100/60 p-5">
                <p className="text-sm font-bold text-gray-900 mb-4">Last {analytics.days} Days</p>
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
                    <div key={stat.label} className="bg-violet-50/50 rounded-xl p-3 text-center">
                      <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>
                {analytics.noShowRate > 30 && (
                  <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-100">
                    <p className="text-xs text-red-700 font-medium">⚠ High no-show rate — many customers are leaving before being served. Consider reducing queue size or sending earlier reminders.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-violet-100/60 p-8 text-center">
                <svg className="animate-spin w-6 h-6 text-violet-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-sm text-gray-400">Loading analytics...</p>
              </div>
            )}

            {/* Email reports */}
            <div className="bg-white rounded-2xl border border-violet-100/60 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-bold text-gray-900">Biweekly Email Reports</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {shop.last_analytics_sent
                      ? `Last sent ${timeAgo(shop.last_analytics_sent)}`
                      : 'Never sent'}
                  </p>
                </div>
                <button
                  onClick={() => toggleAnalytics(!shop.analytics_enabled)}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                    shop.analytics_enabled ? 'bg-violet-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                    shop.analytics_enabled ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Report email address</label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={analyticsEmail}
                      onChange={e => setAnalyticsEmail(e.target.value)}
                      placeholder="owner@example.com"
                      className="flex-1 px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-all"
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
                This is your private admin link. Share it only with your staff.
              </p>
            </div>
          </div>
        )}

        {tab !== 'analytics' && (
          <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4">
            <p className="text-xs font-bold text-violet-700 mb-1">📌 Bookmark this page</p>
            <p className="text-xs text-violet-600 leading-relaxed break-all">
              This is your private admin link. Share it only with your staff.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
