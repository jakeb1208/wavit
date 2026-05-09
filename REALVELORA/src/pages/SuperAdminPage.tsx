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

interface AboutContent {
  mission_body: string;
  mission_quote: string;
  cta_tagline: string;
  features: { title: string; desc: string }[];
}
interface HowToUseContent {
  customer_steps: { title: string; desc: string }[];
  customer_faqs: { q: string; a: string }[];
  business_steps: { title: string; desc: string }[];
  business_faqs: { q: string; a: string }[];
}
interface TermsContent {
  last_updated: string;
  sections: { heading: string; body: string }[];
}

const DEFAULT_ABOUT: AboutContent = {
  mission_body: "Waiting rooms are outdated. Barbershops, salons, and local businesses lose customers to frustration every day. We built Wavit so you can see your exact wait time right from your phone — no guessing, no crowding the waiting area. Businesses get a smoother flow with fewer no-shows and happier clients.",
  mission_quote: "Eliminate unnecessary waiting — for customers who value their time and businesses who want happier clients.",
  cta_tagline: "Find a shop near you and join their queue in under 30 seconds.",
  features: [
    { title: "See Your Wait Time From Your Phone", desc: "Check your live position and exact wait time right on your phone — updated every few seconds, no app needed." },
    { title: "SMS Notifications", desc: "Get a text when you're almost up. No app download, no account needed — ever." },
    { title: "Live & Shared", desc: "The queue is live for everyone. Real data, real time — powered by a real database." },
    { title: "Smart Auto-Remove", desc: "If you don't respond after being called, we check in by text and auto-remove you to keep things moving." },
  ],
};
const DEFAULT_HOW_TO_USE: HowToUseContent = {
  customer_steps: [
    { title: "Find Your Shop", desc: "Scan the QR code posted at the shop entrance, or go to the Wavit website and search for the business by name." },
    { title: "Check In to the Queue", desc: "Enter your name and phone number to join the queue. You'll receive a link to your live queue status." },
    { title: "See Your Wait Time From Your Phone", desc: "Your queue page shows your live position and exact estimated wait time — updated every few seconds, right on your phone screen." },
    { title: "Get Texted When It's Your Turn", desc: "When your turn is approaching, Wavit sends you an SMS alert. Reply YES to confirm you're ready, or the system will check in with you automatically." },
  ],
  customer_faqs: [
    { q: "Do I need to download an app?", a: "No. Everything works in your phone's web browser. Just scan the QR code or visit the site." },
    { q: "How do I check my wait time?", a: "After checking in, you'll get a link to your personal queue page. Open it on your phone to see your live wait time updated in real time." },
    { q: "What if I miss my turn?", a: "Wavit will text you when your turn is near. If you don't respond, the system will check in and may remove you from the queue to keep things moving for others." },
    { q: "How do I stop receiving texts?", a: "Reply STOP to any text message from Wavit and you'll be opted out immediately." },
  ],
  business_steps: [
    { title: "Apply to Join Wavit", desc: "Go to the Register page and fill out your business details. Once approved, you'll receive your unique admin link." },
    { title: "Log In With Your PIN", desc: "Use the Login page and enter your 6-digit business PIN to access your admin dashboard. Keep this PIN safe — it's how you manage your queue." },
    { title: "Open Your Queue", desc: "In the admin panel, toggle your queue open. Customers can now check in via your QR code or by searching your business on the site." },
    { title: "Serve Customers", desc: "When you're ready for the next person, tap \"Serve Next\" in your admin panel. Wavit automatically texts the next customer that their turn is coming up." },
  ],
  business_faqs: [
    { q: "How do I log in to my admin panel?", a: "Go to the Login page and enter your 6-digit business PIN. You'll be redirected straight to your dashboard." },
    { q: "What if I forget my PIN?", a: "Contact us at wavitapp@gmail.com and we can reset it for you." },
    { q: "Can I change my settings after setup?", a: "Yes. Inside the admin panel you can update your hours, staff count, service time, PIN, and more at any time." },
    { q: "How do customers get notified?", a: "Wavit sends SMS texts automatically. When you tap \"Serve Next,\" the customer receives a text that their turn is approaching." },
  ],
};
const DEFAULT_TERMS: TermsContent = {
  last_updated: "April 2025",
  sections: [
    { heading: "1. Acceptance of Terms", body: "By accessing or using Wavit (\"the Service,\" \"we,\" \"us\"), you agree to be bound by these Terms of Service. If you do not agree, please do not use Wavit. These terms apply to all visitors, customers, and registered businesses." },
    { heading: "2. Description of Service", body: "Wavit is a digital queue management platform that lets local businesses manage wait lines and allows their customers to join virtual queues and receive status updates via SMS." },
    { heading: "3. SMS Notifications & Consent", body: "By joining a queue, you consent to receive SMS text messages from Wavit regarding your queue position and status at the business you joined. Message frequency varies. Message and data rates may apply.\n\nTo stop receiving messages at any time, reply STOP to any text message from us. After opting out, you will receive one final confirmation message and no further messages will be sent. You may re-opt-in at any time by joining a queue again.\n\nFor help, reply HELP to any message or contact us at wavitapp@gmail.com." },
    { heading: "4. Business Accounts", body: "Businesses that apply to use Wavit must provide accurate information. Wavit reserves the right to approve, reject, or suspend any business account at our sole discretion. Business owners are responsible for keeping their account information current and for all activity on their account." },
    { heading: "5. Acceptable Use", body: "You agree not to misuse the Service — including but not limited to: joining queues with false information, attempting to disrupt or overload the platform, or using the Service for any unlawful purpose." },
    { heading: "6. Limitation of Liability", body: "Wavit is provided \"as is.\" We do not guarantee uninterrupted service, the accuracy of wait times, or that businesses will be available. To the maximum extent permitted by law, Wavit shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service." },
    { heading: "7. Privacy", body: "Your use of the Service is also governed by our Privacy Policy, which is incorporated into these Terms by reference." },
    { heading: "8. Changes to Terms", body: "We may update these Terms from time to time. Continued use of the Service after changes are posted constitutes acceptance of the revised Terms." },
    { heading: "9. Contact", body: "Questions about these Terms? Email us at wavitapp@gmail.com." },
  ],
};

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
  const [mainTab, setMainTab] = useState<'registrations' | 'shops' | 'history' | 'edit'>('registrations');
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [editingShop, setEditingShop] = useState<string | null>(null);
  const [shopEdit, setShopEdit] = useState<ShopEdit | null>(null);
  const [shopSaving, setShopSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [tutorialSending, setTutorialSending] = useState<Record<string, 'sending' | 'sent' | 'error'>>({});

  const [editPage, setEditPage] = useState<'about' | 'how_to_use' | 'terms'>('about');
  const [aboutDraft, setAboutDraft] = useState<AboutContent>(DEFAULT_ABOUT);
  const [howToUseDraft, setHowToUseDraft] = useState<HowToUseContent>(DEFAULT_HOW_TO_USE);
  const [termsDraft, setTermsDraft] = useState<TermsContent>(DEFAULT_TERMS);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentSaving, setContentSaving] = useState(false);
  const [contentSaved, setContentSaved] = useState<string | null>(null);

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

  useEffect(() => {
    if (mainTab !== 'edit') return;
    setContentLoading(true);
    Promise.all([
      fetch(`${API_BASE}/content/about`).then(r => r.ok ? r.json() : null),
      fetch(`${API_BASE}/content/how_to_use`).then(r => r.ok ? r.json() : null),
      fetch(`${API_BASE}/content/terms`).then(r => r.ok ? r.json() : null),
    ]).then(([about, htu, terms]) => {
      if (about) setAboutDraft(about);
      if (htu) setHowToUseDraft(htu);
      if (terms) setTermsDraft(terms);
    }).catch(() => {}).finally(() => setContentLoading(false));
  }, [mainTab]);

  const saveContent = async (page: string, data: unknown) => {
    setContentSaving(true);
    try {
      const res = await fetch(`${API_BASE}/superadmin/content/${page}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Save failed');
      setContentSaved(page);
      setTimeout(() => setContentSaved(null), 2500);
    } catch (err: any) {
      alert('Save failed: ' + err.message);
    } finally {
      setContentSaving(false);
    }
  };

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
          <button
            onClick={() => setMainTab('edit')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              mainTab === 'edit' ? 'bg-violet-600 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:border-violet-300'
            }`}
          >
            Edit
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
        {/* ── Edit Tab ── */}
        {mainTab === 'edit' && (
          <>
            {contentLoading ? (
              <div className="text-center py-10 text-sm text-gray-400">Loading content…</div>
            ) : (
              <>
                {/* Sub-page picker */}
                <div className="flex gap-2 mb-5 flex-wrap">
                  {(['about', 'how_to_use', 'terms'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setEditPage(p)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                        editPage === p ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      {p === 'about' ? 'About' : p === 'how_to_use' ? 'How to Use' : 'Terms of Service'}
                    </button>
                  ))}
                </div>

                {/* ── About Editor ── */}
                {editPage === 'about' && (
                  <div className="space-y-4">
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
                      <h3 className="text-sm font-black text-gray-800 border-b border-gray-100 pb-2">Mission Section</h3>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Mission Body (the "Why We Built This" paragraph)</label>
                        <textarea
                          rows={4}
                          value={aboutDraft.mission_body}
                          onChange={e => setAboutDraft(d => ({ ...d, mission_body: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Mission Quote (the highlighted "Our Mission" box)</label>
                        <textarea
                          rows={3}
                          value={aboutDraft.mission_quote}
                          onChange={e => setAboutDraft(d => ({ ...d, mission_quote: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">CTA Tagline (below "Ready to skip the line?")</label>
                        <input
                          type="text"
                          value={aboutDraft.cta_tagline}
                          onChange={e => setAboutDraft(d => ({ ...d, cta_tagline: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
                      <h3 className="text-sm font-black text-gray-800 border-b border-gray-100 pb-2">Feature Cards</h3>
                      {aboutDraft.features.map((f, i) => (
                        <div key={i} className="space-y-2 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide">Card {i + 1}</p>
                          <input
                            type="text"
                            value={f.title}
                            onChange={e => setAboutDraft(d => ({ ...d, features: d.features.map((x, j) => j === i ? { ...x, title: e.target.value } : x) }))}
                            placeholder="Title"
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                          />
                          <textarea
                            rows={2}
                            value={f.desc}
                            onChange={e => setAboutDraft(d => ({ ...d, features: d.features.map((x, j) => j === i ? { ...x, desc: e.target.value } : x) }))}
                            placeholder="Description"
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                          />
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => saveContent('about', aboutDraft)}
                      disabled={contentSaving}
                      className={`w-full py-3 rounded-xl font-bold text-sm transition-colors ${contentSaved === 'about' ? 'bg-emerald-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'} disabled:opacity-60`}
                    >
                      {contentSaving ? 'Saving…' : contentSaved === 'about' ? '✓ Saved!' : 'Save About Page'}
                    </button>
                  </div>
                )}

                {/* ── How to Use Editor ── */}
                {editPage === 'how_to_use' && (
                  <div className="space-y-4">
                    {/* Customer Steps */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
                      <h3 className="text-sm font-black text-gray-800 border-b border-gray-100 pb-2">Customer Steps</h3>
                      {howToUseDraft.customer_steps.map((step, i) => (
                        <div key={i} className="space-y-2 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide">Step {i + 1}</p>
                          <input
                            type="text"
                            value={step.title}
                            onChange={e => setHowToUseDraft(d => ({ ...d, customer_steps: d.customer_steps.map((x, j) => j === i ? { ...x, title: e.target.value } : x) }))}
                            placeholder="Title"
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                          />
                          <textarea
                            rows={2}
                            value={step.desc}
                            onChange={e => setHowToUseDraft(d => ({ ...d, customer_steps: d.customer_steps.map((x, j) => j === i ? { ...x, desc: e.target.value } : x) }))}
                            placeholder="Description"
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Customer FAQs */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
                      <h3 className="text-sm font-black text-gray-800 border-b border-gray-100 pb-2">Customer FAQs</h3>
                      {howToUseDraft.customer_faqs.map((faq, i) => (
                        <div key={i} className="space-y-2 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide">FAQ {i + 1}</p>
                          <input
                            type="text"
                            value={faq.q}
                            onChange={e => setHowToUseDraft(d => ({ ...d, customer_faqs: d.customer_faqs.map((x, j) => j === i ? { ...x, q: e.target.value } : x) }))}
                            placeholder="Question"
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                          />
                          <textarea
                            rows={2}
                            value={faq.a}
                            onChange={e => setHowToUseDraft(d => ({ ...d, customer_faqs: d.customer_faqs.map((x, j) => j === i ? { ...x, a: e.target.value } : x) }))}
                            placeholder="Answer"
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Business Steps */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
                      <h3 className="text-sm font-black text-gray-800 border-b border-gray-100 pb-2">Business Steps (Getting Started)</h3>
                      {howToUseDraft.business_steps.map((step, i) => (
                        <div key={i} className="space-y-2 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide">Step {i + 1}</p>
                          <input
                            type="text"
                            value={step.title}
                            onChange={e => setHowToUseDraft(d => ({ ...d, business_steps: d.business_steps.map((x, j) => j === i ? { ...x, title: e.target.value } : x) }))}
                            placeholder="Title"
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                          />
                          <textarea
                            rows={2}
                            value={step.desc}
                            onChange={e => setHowToUseDraft(d => ({ ...d, business_steps: d.business_steps.map((x, j) => j === i ? { ...x, desc: e.target.value } : x) }))}
                            placeholder="Description"
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Business FAQs */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
                      <h3 className="text-sm font-black text-gray-800 border-b border-gray-100 pb-2">Business FAQs</h3>
                      {howToUseDraft.business_faqs.map((faq, i) => (
                        <div key={i} className="space-y-2 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide">FAQ {i + 1}</p>
                          <input
                            type="text"
                            value={faq.q}
                            onChange={e => setHowToUseDraft(d => ({ ...d, business_faqs: d.business_faqs.map((x, j) => j === i ? { ...x, q: e.target.value } : x) }))}
                            placeholder="Question"
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                          />
                          <textarea
                            rows={2}
                            value={faq.a}
                            onChange={e => setHowToUseDraft(d => ({ ...d, business_faqs: d.business_faqs.map((x, j) => j === i ? { ...x, a: e.target.value } : x) }))}
                            placeholder="Answer"
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                          />
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => saveContent('how_to_use', howToUseDraft)}
                      disabled={contentSaving}
                      className={`w-full py-3 rounded-xl font-bold text-sm transition-colors ${contentSaved === 'how_to_use' ? 'bg-emerald-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'} disabled:opacity-60`}
                    >
                      {contentSaving ? 'Saving…' : contentSaved === 'how_to_use' ? '✓ Saved!' : 'Save How to Use Page'}
                    </button>
                  </div>
                )}

                {/* ── Terms Editor ── */}
                {editPage === 'terms' && (
                  <div className="space-y-4">
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
                      <h3 className="text-sm font-black text-gray-800 border-b border-gray-100 pb-2">Header</h3>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Last Updated Text</label>
                        <input
                          type="text"
                          value={termsDraft.last_updated}
                          onChange={e => setTermsDraft(d => ({ ...d, last_updated: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-5">
                      <h3 className="text-sm font-black text-gray-800 border-b border-gray-100 pb-2">Sections</h3>
                      {termsDraft.sections.map((section, i) => (
                        <div key={i} className="space-y-2 pb-5 border-b border-gray-50 last:border-0 last:pb-0">
                          <input
                            type="text"
                            value={section.heading}
                            onChange={e => setTermsDraft(d => ({ ...d, sections: d.sections.map((x, j) => j === i ? { ...x, heading: e.target.value } : x) }))}
                            placeholder="Heading"
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-300"
                          />
                          <textarea
                            rows={4}
                            value={section.body}
                            onChange={e => setTermsDraft(d => ({ ...d, sections: d.sections.map((x, j) => j === i ? { ...x, body: e.target.value } : x) }))}
                            placeholder="Body text. Use two blank lines to create separate paragraphs."
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                          />
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => saveContent('terms', termsDraft)}
                      disabled={contentSaving}
                      className={`w-full py-3 rounded-xl font-bold text-sm transition-colors ${contentSaved === 'terms' ? 'bg-emerald-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'} disabled:opacity-60`}
                    >
                      {contentSaving ? 'Saving…' : contentSaved === 'terms' ? '✓ Saved!' : 'Save Terms of Service'}
                    </button>
                  </div>
                )}
              </>
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
