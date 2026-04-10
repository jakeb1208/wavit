import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
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

interface ApproveResult {
  shopId: string;
  adminSecret: string;
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
  admin_secret: string;
}

interface ShopEdit {
  name: string;
  category: string;
  numStaff: string;
  avgServiceMinutes: string;
  queueOpen: boolean;
  allowRemoteJoin: boolean;
  openingTime: string;
  closingTime: string;
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

export default function SuperAdminPage() {
  const { secret } = useParams<{ secret: string }>();
  const [registrations, setRegistrations] = useState<Registration[] | null>(null);
  const [shops, setShops] = useState<Shop[] | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [mainTab, setMainTab] = useState<'registrations' | 'shops'>('registrations');
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [approvedResults, setApprovedResults] = useState<Record<string, ApproveResult>>({});
  const [editingShop, setEditingShop] = useState<string | null>(null);
  const [shopEdit, setShopEdit] = useState<ShopEdit | null>(null);
  const [shopSaving, setShopSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchRegistrations = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/superadmin/${secret}/registrations`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to load'); return; }
      setRegistrations(data);
    } catch {
      setError('Network error');
    }
  }, [secret]);

  const fetchShops = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/superadmin/${secret}/shops`);
      const data = await res.json();
      if (!res.ok) return;
      setShops(data);
    } catch { /* silent */ }
  }, [secret]);

  useEffect(() => {
    fetchRegistrations();
    fetchShops();
    const interval = setInterval(() => {
      fetchRegistrations();
      fetchShops();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchRegistrations, fetchShops]);

  const handleApprove = async (id: string) => {
    setActionId(id);
    try {
      const res = await fetch(`${API_BASE}/superadmin/${secret}/registrations/${id}/approve`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setApprovedResults(r => ({ ...r, [id]: data }));
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
      const res = await fetch(`${API_BASE}/superadmin/${secret}/registrations/${id}/reject`, {
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
      category: shop.category,
      numStaff: String(shop.num_staff),
      avgServiceMinutes: String(shop.avg_service_minutes),
      queueOpen: shop.queue_open,
      allowRemoteJoin: shop.allow_remote_join,
      openingTime: shop.opening_time || '09:00',
      closingTime: shop.closing_time || '18:00',
    });
  };

  const saveShop = async (shopId: string) => {
    if (!shopEdit) return;
    setShopSaving(true);
    try {
      const res = await fetch(`${API_BASE}/superadmin/${secret}/shops/${shopId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: shopEdit.name,
          category: shopEdit.category,
          numStaff: shopEdit.numStaff,
          avgServiceMinutes: shopEdit.avgServiceMinutes,
          queueOpen: shopEdit.queueOpen,
          allowRemoteJoin: shopEdit.allowRemoteJoin,
          openingTime: shopEdit.openingTime,
          closingTime: shopEdit.closingTime,
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
      const res = await fetch(`${API_BASE}/superadmin/${secret}/shops/${shopId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setDeleteConfirm(null);
      await fetchShops();
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    } finally {
      setActionId(null);
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
          <Link to="/" className="text-xs text-violet-300 hover:text-white transition-colors">← Public site</Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">
        {/* Main tab toggle */}
        <div className="flex gap-2 mb-5">
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

                      {reg.status === 'approved' && approvedResults[reg.id] && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-3">
                          <p className="text-xs font-semibold text-emerald-700 mb-2">Shop created — send this admin link to the owner:</p>
                          <p className="text-xs font-mono text-gray-700 break-all">
                            {window.location.origin}/admin/{approvedResults[reg.id].shopId}/{approvedResults[reg.id].adminSecret}
                          </p>
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
                              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Opening Time</label>
                              <input
                                type="time"
                                value={shopEdit.openingTime}
                                onChange={e => setShopEdit(s => s ? { ...s, openingTime: e.target.value } : s)}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Closing Time</label>
                              <input
                                type="time"
                                value={shopEdit.closingTime}
                                onChange={e => setShopEdit(s => s ? { ...s, closingTime: e.target.value } : s)}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                              />
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

                          <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 mb-3">
                            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1">Admin Link</p>
                            <a
                              href={`/admin/${shop.id}/${shop.admin_secret}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-mono text-violet-700 hover:text-violet-900 break-all underline underline-offset-2"
                            >
                              {window.location.origin}/admin/{shop.id}/{shop.admin_secret}
                            </a>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => startEditShop(shop)}
                              className="flex-1 py-2.5 bg-violet-50 text-violet-700 font-semibold text-sm rounded-xl hover:bg-violet-100 border border-violet-200 transition-colors"
                            >
                              Edit Settings
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
