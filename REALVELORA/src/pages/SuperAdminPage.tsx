import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE } from '../lib/api';

interface Registration {
  id: string;
  business_name: string;
  owner_name: string;
  email: string;
  phone: string;
  category: string;
  zip_code: string | null;
  num_staff: number;
  avg_service_minutes: number;
  message: string | null;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: number;
  reviewed_at: number | null;
  admin_note: string | null;
}

interface Shop {
  id: string;
  name: string;
  category: string;
  zip_code: string | null;
  num_staff: number;
  avg_service_minutes: number;
  queue_open: boolean;
  allow_remote_join: boolean;
  opening_time: string;
  closing_time: string;
  created_at: number;
  email: string | null;
  analytics_email: string | null;
}

interface ShopEdit {
  name: string;
  email: string;
  category: string;
  numStaff: string;
  avgServiceMinutes: string;
  queueOpen: boolean;
  allowRemoteJoin: boolean;
  openingTime: string;
  closingTime: string;
  adminPin: string;
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
};

const CATEGORIES = ['Barbershop', 'Salon', 'Nail Salon', 'Spa', 'Clinic', 'Tattoo', 'Other'];

interface HistoryTicket {
  id: string;
  name: string;
  phone: string;
  joined_at: number | string;
  exited_at: number | string | null;
  served_at: number | string | null;
  party_size: number | null;
  shop_id: string;
  shop_name: string;
}

function fmtTime(ts: number | string) {
  return new Date(Number(ts)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(ts: number | string) {
  return new Date(Number(ts)).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function SuperAdminPage() {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState<Registration[] | null>(null);
  const [shops, setShops] = useState<Shop[] | null>(null);
  const [history, setHistory] = useState<HistoryTicket[] | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [mainTab, setMainTab] = useState<'registrations' | 'shops' | 'history'>('registrations');
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [editingShop, setEditingShop] = useState<string | null>(null);
  const [shopEdit, setShopEdit] = useState<ShopEdit | null>(null);
  const [shopSaving, setShopSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [tutorialSending, setTutorialSending] = useState<Record<string, 'sending' | 'sent' | 'error'>>({});

  const fetchRegistrations = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/superadmin/registrations`);
      if (res.status === 401 || res.status === 403) { navigate('/superadmin-login'); return; }
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to load'); return; }
      setRegistrations(data);
    } catch {
      setError('Network error');
    }
  }, [navigate]);

  const fetchShops = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/superadmin/shops`);
      if (!res.ok) return;
      setShops(await res.json());
    } catch { /* silent */ }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/superadmin/history`);
      if (!res.ok) return;
      setHistory(await res.json());
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchRegistrations();
    fetchShops();
    const interval = setInterval(() => {
      fetchRegistrations();
      fetchShops();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchRegistrations, fetchShops]);

  useEffect(() => {
    if (mainTab === 'history') fetchHistory();
  }, [mainTab, fetchHistory]);

  const logout = async () => {
    await fetch(`${API_BASE}/superadmin/logout`, { method: 'POST' });
    navigate('/superadmin-login');
  };

  const handleApprove = async (id: string) => {
    setActionId(id);
    try {
      const res = await fetch(`${API_BASE}/superadmin/registrations/${id}/approve`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await fetchRegistrations();
      await fetchShops();
    } catch (err: any) {
      alert('Approve failed: ' + err.message);
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionId(id);
    try {
      const res = await fetch(`${API_BASE}/superadmin/registrations/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: rejectNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRejectTarget(null);
      setRejectNote('');
      await fetchRegistrations();
    } catch (err: any) {
      alert('Reject failed: ' + err.message);
    } finally {
      setActionId(null);
    }
  };

  const startEditShop = (shop: Shop) => {
    setEditingShop(shop.id);
    setShopEdit({
      name: shop.name,
      email: shop.email || '',
      category: shop.category,
      numStaff: String(shop.num_staff),
      avgServiceMinutes: String(shop.avg_service_minutes),
      queueOpen: shop.queue_open,
      allowRemoteJoin: shop.allow_remote_join,
      openingTime: shop.opening_time || '09:00',
      closingTime: shop.closing_time || '18:00',
      adminPin: '',
    });
  };

  const saveShop = async (shopId: string) => {
    if (!shopEdit) return;
    setShopSaving(true);
    try {
      const res = await fetch(`${API_BASE}/superadmin/shops/${shopId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: shopEdit.name,
          email: shopEdit.email,
          category: shopEdit.category,
          numStaff: shopEdit.numStaff,
          avgServiceMinutes: shopEdit.avgServiceMinutes,
          queueOpen: shopEdit.queueOpen,
          allowRemoteJoin: shopEdit.allowRemoteJoin,
          openingTime: shopEdit.openingTime,
          closingTime: shopEdit.closingTime,
          ...(shopEdit.adminPin ? { adminPin: shopEdit.adminPin } : {}),
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      setEditingShop(null);
      setShopEdit(null);
      await fetchShops();
    } catch (err: any) {
      alert('Save failed: ' + err.message);
    } finally {
      setShopSaving(false);
    }
  };

  const deleteShop = async (shopId: string) => {
    setActionId(shopId + '-delete');
    try {
      const res = await fetch(`${API_BASE}/superadmin/shops/${shopId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setDeleteConfirm(null);
      await fetchShops();
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    } finally {
      setActionId(null);
    }
  };

  const sendTutorial = async (shopId: string) => {
    setTutorialSending(s => ({ ...s, [shopId]: 'sending' }));
    try {
      const res = await fetch(`${API_BASE}/superadmin/shops/${shopId}/send-tutorial`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setTutorialSending(s => ({ ...s, [shopId]: 'sent' }));
      setTimeout(() => setTutorialSending(s => { const n = { ...s }; delete n[shopId]; return n; }), 3000);
    } catch (err: any) {
      alert('Could not send tutorial: ' + err.message);
      setTutorialSending(s => { const n = { ...s }; delete n[shopId]; return n; });
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8f7ff] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-red-200 p-8 max-w-sm w-full text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-sm text-red-600">{error}</p>
          <Link to="/" className="mt-6 inline-flex items-center text-sm text-violet-600 font-semibold">← Back to home</Link>
        </div>
      </div>
    );
  }

  if (!registrations) {
    return (
      <div className="min-h-screen bg-[#f8f7ff] flex items-center justify-center">
        <svg className="animate-spin w-7 h-7 text-violet-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  const filtered = registrations.filter(r => filter === 'all' || r.status === filter);
  const counts = {
    all: registrations.length,
    pending: registrations.filter(r => r.status === 'pending').length,
    approved: registrations.filter(r => r.status === 'approved').length,
    rejected: registrations.filter(r => r.status === 'rejected').length,
  };

  return (
    <div className="min-h-screen bg-[#f8f7ff]">
      <div className="bg-gradient-to-r from-[#1a0845] to-[#3b1fa3] text-white px-4 sm:px-6 py-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-pacifico text-xl text-blue-300">wavit</span>
            </div>
            <h1 className="text-xl font-black">Super Admin</h1>
            <p className="text-violet-300 text-xs mt-0.5">{counts.pending} pending · {shops?.length ?? 0} live shops</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-xs text-violet-300 hover:text-white transition-colors">← Public site</Link>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white/70 hover:text-white text-xs font-bold rounded-xl transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">
        {/* Main tab toggle */}
        <div className="flex gap-2 mb-5 flex-wrap">
          <button
            onClick={() => setMainTab('registrations')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              mainTab === 'registrations' ? 'bg-violet-600 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:border-violet-300'
            }`}
          >
            Registrations
            {counts.pending > 0 && (
              <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-bold bg-amber-400 text-black">{counts.pending}</span>
            )}
          </button>
          <button
            onClick={() => setMainTab('shops')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              mainTab === 'shops' ? 'bg-violet-600 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:border-violet-300'
            }`}
          >
            Live Shops
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-bold ${mainTab === 'shops' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {shops?.length ?? '…'}
            </span>
          </button>
          <button
            onClick={() => setMainTab('history')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              mainTab === 'history' ? 'bg-violet-600 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:border-violet-300'
            }`}
          >
            History
          </button>
        </div>

        {/* ── Registrations Tab ── */}
        {mainTab === 'registrations' && (
          <>
            <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
              {(['pending', 'all', 'approved', 'rejected'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                    filter === tab
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'bg-white text-gray-500 border border-gray-200 hover:border-violet-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${filter === tab ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {counts[tab]}
                  </span>
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-gray-500 text-sm">No {filter === 'all' ? '' : filter} registrations</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(reg => (
                  <div key={reg.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-gray-900 text-base">{reg.business_name}</h3>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${STATUS_COLORS[reg.status]}`}>
                              {reg.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">{reg.category}{reg.zip_code ? ` · ZIP ${reg.zip_code}` : ''} · Submitted {timeAgo(reg.submitted_at)}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                        {[
                          { label: 'Owner', value: reg.owner_name },
                          { label: 'Email', value: reg.email },
                          { label: 'Phone', value: reg.phone },
                          { label: 'Staff', value: `${reg.num_staff} staff` },
                          { label: 'Avg Service', value: `${reg.avg_service_minutes} min` },
                        ].map(row => (
                          <div key={row.label} className="bg-gray-50 rounded-xl px-3 py-2">
                            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">{row.label}</p>
                            <p className="text-sm font-semibold text-gray-800 truncate">{row.value}</p>
                          </div>
                        ))}
                      </div>

                      {reg.message && (
                        <div className="bg-violet-50 border border-violet-100 rounded-xl px-4 py-3 mb-3">
                          <p className="text-xs font-semibold text-violet-700 mb-1">Their message</p>
                          <p className="text-sm text-gray-700 leading-relaxed">{reg.message}</p>
                        </div>
                      )}

                      {reg.status === 'rejected' && reg.admin_note && (
                        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-3">
                          <p className="text-xs font-semibold text-red-600 mb-1">Rejection note</p>
                          <p className="text-sm text-gray-700">{reg.admin_note}</p>
                        </div>
                      )}

                      {reg.status === 'approved' && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-3">
                          <p className="text-xs font-semibold text-emerald-700">Shop approved — owner can log in at <span className="font-mono">/login</span> using their PIN.</p>
                        </div>
                      )}

                      {reg.status === 'pending' && (
                        <div className="flex gap-2 mt-3">
                          {rejectTarget === reg.id ? (
                            <div className="flex-1 space-y-2">
                              <textarea
                                value={rejectNote}
                                onChange={e => setRejectNote(e.target.value)}
                                placeholder="Optional rejection note for your records…"
                                rows={2}
                                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => { setRejectTarget(null); setRejectNote(''); }}
                                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-semibold text-sm rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleReject(reg.id)}
                                  disabled={actionId === reg.id}
                                  className="flex-1 py-2.5 bg-red-600 text-white font-bold text-sm rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60"
                                >
                                  {actionId === reg.id ? 'Rejecting…' : 'Confirm Reject'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => setRejectTarget(reg.id)}
                                className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-semibold text-sm rounded-xl hover:bg-gray-200 transition-colors"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => handleApprove(reg.id)}
                                disabled={actionId === reg.id}
                                className="flex-1 py-2.5 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-60"
                              >
                                {actionId === reg.id ? 'Approving…' : 'Approve'}
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Shops Tab ── */}
        {mainTab === 'shops' && (
          <>
            {!shops || shops.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                <div className="text-4xl mb-3">🏪</div>
                <p className="text-gray-500 text-sm">No approved shops yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {shops.map(shop => (
                  <div key={shop.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <h3 className="font-bold text-gray-900 text-base">{shop.name}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {shop.category}{shop.zip_code ? ` · ZIP ${shop.zip_code}` : ''} · Created {timeAgo(shop.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${shop.queue_open ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                            {shop.queue_open ? 'Open' : 'Closed'}
                          </span>
                        </div>
                      </div>

                      {editingShop === shop.id && shopEdit ? (
                        <div className="space-y-3 border-t border-gray-100 pt-3">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Contact Email</label>
                            <input
                              type="email"
                              value={shopEdit.email}
                              onChange={e => setShopEdit(s => s ? { ...s, email: e.target.value } : s)}
                              placeholder="owner@example.com"
                              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Name</label>
                              <input
                                type="text"
                                value={shopEdit.name}
                                onChange={e => setShopEdit(s => s ? { ...s, name: e.target.value } : s)}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Category</label>
                              <select
                                value={shopEdit.category}
                                onChange={e => setShopEdit(s => s ? { ...s, category: e.target.value } : s)}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white"
                              >
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Staff Count</label>
                              <input
                                type="number" min="1" max="20"
                                value={shopEdit.numStaff}
                                onChange={e => setShopEdit(s => s ? { ...s, numStaff: e.target.value } : s)}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Avg Service (min)</label>
                              <input
                                type="number" min="1" max="120"
                                value={shopEdit.avgServiceMinutes}
                                onChange={e => setShopEdit(s => s ? { ...s, avgServiceMinutes: e.target.value } : s)}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Opening Time (24h)</label>
                              <input
                                type="text"
                                value={shopEdit.openingTime}
                                onChange={e => setShopEdit(s => s ? { ...s, openingTime: e.target.value } : s)}
                                placeholder="09:00"
                                maxLength={5}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-300"
                              />
                              <p className="text-[10px] text-gray-400 mt-0.5">HH:MM</p>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Closing Time (24h)</label>
                              <input
                                type="text"
                                value={shopEdit.closingTime}
                                onChange={e => setShopEdit(s => s ? { ...s, closingTime: e.target.value } : s)}
                                placeholder="18:00"
                                maxLength={5}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-300"
                              />
                              <p className="text-[10px] text-gray-400 mt-0.5">HH:MM</p>
                            </div>
                            <div className="col-span-2">
                              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">New Login PIN</label>
                              <input
                                type="password"
                                inputMode="numeric"
                                value={shopEdit.adminPin}
                                onChange={e => setShopEdit(s => s ? { ...s, adminPin: e.target.value.replace(/\D/g, '').slice(0, 6) } : s)}
                                placeholder="Leave blank to keep current PIN"
                                maxLength={6}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-black tracking-[0.3em] text-center focus:outline-none focus:ring-2 focus:ring-violet-300"
                              />
                              <p className="text-[10px] text-gray-400 mt-0.5">Enter exactly 6 digits only when changing the business login PIN.</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between py-2">
                            <div>
                              <p className="text-sm font-semibold text-gray-700">Queue Open</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShopEdit(s => s ? { ...s, queueOpen: !s.queueOpen } : s)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${shopEdit.queueOpen ? 'bg-emerald-500' : 'bg-gray-200'}`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${shopEdit.queueOpen ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                          </div>

                          <div className="flex items-center justify-between py-2 border-t border-gray-100">
                            <div>
                              <p className="text-sm font-semibold text-gray-700">Allow Remote Join</p>
                              <p className="text-[11px] text-amber-600 font-semibold mt-0.5">Not recommended</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShopEdit(s => s ? { ...s, allowRemoteJoin: !s.allowRemoteJoin } : s)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${shopEdit.allowRemoteJoin ? 'bg-violet-600' : 'bg-gray-200'}`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${shopEdit.allowRemoteJoin ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                          </div>

                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => { setEditingShop(null); setShopEdit(null); }}
                              className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-semibold text-sm rounded-xl hover:bg-gray-200 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => saveShop(shop.id)}
                              disabled={shopSaving}
                              className="flex-1 py-2.5 bg-violet-600 text-white font-bold text-sm rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-60"
                            >
                              {shopSaving ? 'Saving…' : 'Save Changes'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                            {[
                              { label: 'Staff', value: `${shop.num_staff}` },
                              { label: 'Avg Service', value: `${shop.avg_service_minutes} min` },
                              { label: 'Remote Join', value: shop.allow_remote_join ? 'Yes' : 'No' },
                              { label: 'Hours', value: `${shop.opening_time || '—'} – ${shop.closing_time || '—'}` },
                            ].map(row => (
                              <div key={row.label} className="bg-gray-50 rounded-xl px-3 py-2">
                                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">{row.label}</p>
                                <p className="text-sm font-semibold text-gray-800">{row.value}</p>
                              </div>
                            ))}
                          </div>

                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => startEditShop(shop)}
                              className="flex-1 py-2.5 bg-violet-50 text-violet-700 font-semibold text-sm rounded-xl hover:bg-violet-100 border border-violet-200 transition-colors"
                            >
                              Edit Settings
                            </button>
                            <button
                              onClick={() => sendTutorial(shop.id)}
                              disabled={!!tutorialSending[shop.id]}
                              className={`flex-1 py-2.5 font-semibold text-sm rounded-xl border transition-colors disabled:opacity-60 ${
                                tutorialSending[shop.id] === 'sent'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                              }`}
                            >
                              {tutorialSending[shop.id] === 'sending' ? 'Sending…' : tutorialSending[shop.id] === 'sent' ? '✓ Sent!' : 'Send Tutorial'}
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(shop.id)}
                              className="py-2.5 px-4 bg-red-50 text-red-600 font-semibold text-sm rounded-xl hover:bg-red-100 border border-red-200 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        {/* ── History Tab ── */}
        {mainTab === 'history' && (
          <>
            {!history ? (
              <div className="text-center py-10 text-sm text-gray-400">Loading…</div>
            ) : history.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-400">No queue history in the last 7 days.</div>
            ) : (() => {
              // Group by shop → day
              const grouped: Record<string, Record<string, HistoryTicket[]>> = {};
              for (const t of history) {
                if (!grouped[t.shop_name]) grouped[t.shop_name] = {};
                const day = fmtDate(t.joined_at);
                if (!grouped[t.shop_name][day]) grouped[t.shop_name][day] = [];
                grouped[t.shop_name][day].push(t);
              }
              return (
                <div className="space-y-3">
                  {Object.entries(grouped).map(([shopName, days]) => (
                    <div key={shopName} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                      <div className="bg-gray-50 border-b border-gray-100 px-4 py-2 flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-800">{shopName}</span>
                        <span className="text-xs text-gray-400">{Object.values(days).flat().length} total</span>
                      </div>
                      {Object.entries(days).map(([day, tickets]) => (
                        <div key={day} className="border-b border-gray-50 last:border-0">
                          <div className="px-4 py-1.5 bg-gray-50/50 flex items-center justify-between">
                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">{day}</span>
                            <span className="text-[11px] text-gray-400">{tickets.length} joined</span>
                          </div>
                          <div className="divide-y divide-gray-50">
                            {tickets.map(t => (
                              <div key={t.id} className="px-4 py-1.5 flex items-center gap-2 text-xs font-mono">
                                <span className="text-gray-400 shrink-0 w-10">{fmtTime(t.joined_at)}</span>
                                <span className="text-gray-800 font-sans font-semibold truncate flex-1">
                                  {t.name}{(t.party_size ?? 1) > 1 ? ` ×${t.party_size}` : ''}
                                </span>
                                <span className="text-gray-400 shrink-0">
                                  {t.served_at
                                    ? <span className="text-emerald-600">✓ {fmtTime(t.served_at)}</span>
                                    : t.exited_at
                                    ? <span className="text-red-400">✕ {fmtTime(t.exited_at)}</span>
                                    : <span className="text-amber-500">active</span>
                                  }
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              );
            })()}
          </>
        )}
      </div>

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-1.5">Delete this shop?</h3>
            <p className="text-sm text-gray-500 mb-6">
              This will permanently remove the shop and all its queue history. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteShop(deleteConfirm)}
                disabled={actionId === deleteConfirm + '-delete'}
                className="flex-1 py-3 bg-red-600 text-white font-bold text-sm rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {actionId === deleteConfirm + '-delete' ? 'Deleting…' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
