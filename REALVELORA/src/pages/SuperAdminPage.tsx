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

export default function SuperAdminPage() {
  const { secret } = useParams<{ secret: string }>();
  const [registrations, setRegistrations] = useState<Registration[] | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [approvedResults, setApprovedResults] = useState<Record<string, ApproveResult>>({});

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

  useEffect(() => {
    fetchRegistrations();
    const interval = setInterval(fetchRegistrations, 15000);
    return () => clearInterval(interval);
  }, [fetchRegistrations]);

  const handleApprove = async (id: string) => {
    setActionId(id);
    try {
      const res = await fetch(`${API_BASE}/superadmin/${secret}/registrations/${id}/approve`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setApprovedResults(r => ({ ...r, [id]: data }));
      await fetchRegistrations();
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
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a0845] to-[#3b1fa3] text-white px-4 sm:px-6 py-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 3L4 14h7v7l9-11h-7V3z" />
                </svg>
              </div>
              <span className="font-bold text-base">wav<span className="text-violet-300">it</span></span>
            </div>
            <h1 className="text-xl font-black">Business Approvals</h1>
            <p className="text-violet-300 text-xs mt-0.5">{counts.pending} pending review</p>
          </div>
          <Link to="/" className="text-xs text-violet-300 hover:text-white transition-colors">← Public site</Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">
        {/* Filter tabs */}
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

                  {/* Approved: show admin link */}
                  {reg.status === 'approved' && approvedResults[reg.id] && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-3">
                      <p className="text-xs font-semibold text-emerald-700 mb-2">Shop created — send this admin link to the owner:</p>
                      <p className="text-xs font-mono text-gray-700 break-all">
                        {window.location.origin}/admin/{approvedResults[reg.id].shopId}/{approvedResults[reg.id].adminSecret}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
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
      </div>
    </div>
  );
}
