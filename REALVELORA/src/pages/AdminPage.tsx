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
      if (!analyticsEmail && json.shop?.analytics_email) setAnalyticsEmail(json.shop.analytics_email);
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
          <div className="text-4xl mb-4">🔒</div>
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

          <h1 className="text-2xl font-black mb-1">{shop.name}</h1>
          <p className="text-violet-400 text-sm font-medium">{shop.category} · {shop.avg_service_minutes} min avg service</p>

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
                <div className="text-4xl mb-3">✨</div>
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
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Last {analytics.days} Days</p>
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
                {analytics.noShowRate > 30 && (
                  <div className="mt-4 p-3.5 bg-red-50 rounded-xl border border-red-100">
                    <p className="text-xs text-red-700 font-medium leading-relaxed">
                      ⚠ High no-show rate — many customers leave before being served. Consider reducing queue size or sending earlier reminders.
                    </p>
                  </div>
                )}
              </div>
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
    </div>
  );
}
