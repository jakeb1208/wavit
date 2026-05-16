import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE } from '../lib/api';
import { isNative } from '../lib/platform';

const CATEGORIES = ['Barbershop', 'Salon', 'Nail Salon', 'Spa', 'Clinic', 'Tattoo', 'Other'];
const GLASS = 'rgba(255,255,255,0.055)';
const BORDER = 'rgba(255,255,255,0.09)';

const inputStyle = {
  width: '100%', padding: '13px 14px', borderRadius: '14px',
  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
  color: '#f0f4ff', fontSize: '14px', fontWeight: 500, outline: 'none', boxSizing: 'border-box' as const,
};
const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(148,163,184,0.6)', textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: '7px' };
const sectionStyle = { background: GLASS, border: `1px solid ${BORDER}`, borderRadius: '20px', padding: '18px', marginBottom: '12px', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' };
const sectionTitleStyle = { fontSize: '11px', fontWeight: 800, color: 'rgba(148,163,184,0.5)', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '14px' };

export default function RegisterPage() {
  const native = isNative();
  const navigate = useNavigate();
  const [form, setForm] = useState({ businessName: '', ownerName: '', email: '', phone: '', category: '', zipCode: '', numStaff: '1', avgServiceMinutes: '15', adminPin: '', adminPinConfirm: '', message: '' });
  const [allowRemoteJoin, setAllowRemoteJoin] = useState(true);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [field]: e.target.value }));
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => { const digits = e.target.value.replace(/\D/g, '').slice(0, 10); setForm(f => ({ ...f, phone: digits })); };
  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => { const digits = e.target.value.replace(/\D/g, '').slice(0, 6); setForm(f => ({ ...f, adminPin: digits })); };
  const handlePinConfirmChange = (e: React.ChangeEvent<HTMLInputElement>) => { const digits = e.target.value.replace(/\D/g, '').slice(0, 6); setForm(f => ({ ...f, adminPinConfirm: digits })); };
  const formatPhoneDisplay = (digits: string) => { if (!digits) return ''; if (digits.length <= 3) return `(${digits}`; if (digits.length <= 6) return `(${digits.slice(0,3)}) ${digits.slice(3)}`; return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`; };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setStatus('loading'); setErrorMsg('');
    const digits = form.phone.replace(/\D/g, '');
    if (digits.length !== 10) { setErrorMsg('Please enter a valid 10-digit US phone number.'); setStatus('error'); return; }
    if (form.adminPin.length !== 6) { setErrorMsg('Please choose a 6-digit admin login PIN.'); setStatus('error'); return; }
    if (form.adminPin !== form.adminPinConfirm) { setErrorMsg('Admin PINs do not match. Please enter the same 6 digits twice.'); setStatus('error'); return; }
    try {
      const { adminPinConfirm, ...submission } = form;
      const res = await fetch(`${API_BASE}/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...submission, phone: `+1${digits}`, allowRemoteJoin }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      setStatus('success');
    } catch (err: any) { setErrorMsg(err.message); setStatus('error'); }
  };

  if (status === 'success') {
    return native ? (
      <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(30,58,138,0.28) 0%, #070b14 55%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ textAlign: 'center', background: GLASS, border: `1px solid ${BORDER}`, borderRadius: '24px', padding: '32px', maxWidth: '340px', width: '100%' }}>
          <div style={{ width: '64px', height: '64px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 0 20px rgba(16,185,129,0.2)' }}>
            <svg style={{ width: '28px', height: '28px', color: '#34d399' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#f0f4ff', marginBottom: '10px', letterSpacing: '-0.4px' }}>Application Submitted!</h2>
          <p style={{ fontSize: '13px', color: 'rgba(148,163,184,0.65)', lineHeight: 1.6, marginBottom: '24px' }}>
            Thanks for registering <strong style={{ color: '#f0f4ff' }}>{form.businessName}</strong>. We'll review your application and be in touch via <strong style={{ color: '#f0f4ff' }}>{form.email}</strong>.
          </p>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 24px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', borderRadius: '14px', color: '#fff', fontWeight: 700, fontSize: '14px', textDecoration: 'none', boxShadow: '0 4px 16px rgba(59,130,246,0.35)' }}>
            Back to Home
          </Link>
        </div>
      </div>
    ) : (
      <div className="min-h-screen bg-gray-300 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 border-2 border-emerald-300 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">Application Submitted!</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-6 font-medium">Thanks for registering <strong>{form.businessName}</strong>. We'll review your application and be in touch via <strong>{form.email}</strong>.</p>
          <Link to="/" className="inline-flex items-center justify-center px-5 py-3 bg-blue-600 border-2 border-blue-700 text-black font-bold text-sm hover:bg-blue-700 transition-colors">Back to Home</Link>
        </div>
      </div>
    );
  }

  if (native) {
    const selectStyle = { ...inputStyle, appearance: 'none' as const, WebkitAppearance: 'none' as const };
    const textareaStyle = { ...inputStyle, resize: 'none' as const, minHeight: '80px' };
    return (
      <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse 80% 30% at 50% 0%, rgba(30,58,138,0.28) 0%, #070b14 50%)', color: '#f0f4ff', padding: '20px 16px 40px' }}>
        <button onClick={() => navigate(-1)} style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '8px 14px', color: '#93c5fd', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
          <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>

        <div style={{ marginBottom: '24px' }}>
          <h1 className="font-pacifico" style={{ fontSize: '28px', color: '#60a5fa', marginBottom: '6px' }}>wavit</h1>
          <h2 style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.5px', marginBottom: '6px' }}>Register Your Business</h2>
          <p style={{ fontSize: '13px', color: 'rgba(148,163,184,0.65)' }}>We'll review your application and reach out within 1–2 days.</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Business Info */}
          <div style={sectionStyle}>
            <p style={sectionTitleStyle}>Business Info</p>
            <div style={{ marginBottom: '12px' }}><label style={labelStyle}>Business Name *</label><input type="text" value={form.businessName} onChange={set('businessName')} placeholder="e.g. Mario's Barbershop" required style={inputStyle} /></div>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Category *</label>
              <select value={form.category} onChange={set('category')} required style={selectStyle}>
                <option value="" style={{ background: '#0f1629' }}>Select a category…</option>
                {CATEGORIES.map(c => <option key={c} value={c} style={{ background: '#0f1629' }}>{c}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div><label style={labelStyle}>Staff Count</label><input type="number" min="1" max="20" value={form.numStaff} onChange={set('numStaff')} style={inputStyle} /></div>
              <div><label style={labelStyle}>Avg Service (min)</label><input type="number" min="1" max="120" value={form.avgServiceMinutes} onChange={set('avgServiceMinutes')} style={inputStyle} /></div>
            </div>
            <div><label style={labelStyle}>ZIP Code</label><input type="text" value={form.zipCode} onChange={set('zipCode')} placeholder="e.g. 90210" style={inputStyle} /></div>
          </div>

          {/* Contact Info */}
          <div style={sectionStyle}>
            <p style={sectionTitleStyle}>Contact Info</p>
            <div style={{ marginBottom: '12px' }}><label style={labelStyle}>Your Name *</label><input type="text" value={form.ownerName} onChange={set('ownerName')} placeholder="Owner / manager name" required style={inputStyle} /></div>
            <div style={{ marginBottom: '12px' }}><label style={labelStyle}>Email *</label><input type="email" value={form.email} onChange={set('email')} placeholder="you@yourbusiness.com" required style={inputStyle} /></div>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Phone Number *</label>
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '14px' }}>
                <span style={{ padding: '13px 4px 13px 14px', fontSize: '14px', fontWeight: 700, color: 'rgba(148,163,184,0.6)', flexShrink: 0 }}>+1</span>
                <input type="tel" value={formatPhoneDisplay(form.phone)} onChange={handlePhoneChange} placeholder="(555) 000-0000" required style={{ flex: 1, padding: '13px 14px', background: 'transparent', border: 'none', color: '#f0f4ff', fontSize: '14px', fontWeight: 500, outline: 'none' }} />
              </div>
            </div>
            <div><label style={labelStyle}>Anything else? <span style={{ textTransform: 'none', fontWeight: 400, opacity: 0.5 }}>(optional)</span></label><textarea value={form.message} onChange={set('message')} placeholder="Tell us about your business, peak hours, etc." rows={3} style={textareaStyle} /></div>
          </div>

          {/* Queue Preferences */}
          <div style={sectionStyle}>
            <p style={sectionTitleStyle}>Queue Preferences</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#f0f4ff', marginBottom: '4px' }}>Allow Remote Join</p>
                <p style={{ fontSize: '12px', color: 'rgba(148,163,184,0.55)', lineHeight: 1.5 }}>Let customers join from anywhere, without being at the shop. <span style={{ color: '#fbbf24', fontWeight: 700 }}>Not recommended</span></p>
              </div>
              <button type="button" onClick={() => setAllowRemoteJoin(v => !v)} style={{ width: '44px', height: '26px', borderRadius: '13px', border: 'none', background: allowRemoteJoin ? '#3b82f6' : 'rgba(255,255,255,0.15)', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 0.2s', boxShadow: allowRemoteJoin ? '0 0 10px rgba(59,130,246,0.4)' : 'none' }}>
                <span style={{ position: 'absolute', top: '3px', left: allowRemoteJoin ? '21px' : '3px', width: '20px', height: '20px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
              </button>
            </div>
          </div>

          {/* Business Login */}
          <div style={sectionStyle}>
            <p style={sectionTitleStyle}>Business Login</p>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Create 6-digit Admin PIN *</label>
              <input type="password" inputMode="numeric" autoComplete="new-password" value={form.adminPin} onChange={handlePinChange} placeholder="Enter 6 digits" required maxLength={6} style={{ ...inputStyle, textAlign: 'center', letterSpacing: '0.35em', fontSize: '20px', fontWeight: 900 }} />
            </div>
            <div>
              <label style={labelStyle}>Confirm 6-digit Admin PIN *</label>
              <input type="password" inputMode="numeric" autoComplete="new-password" value={form.adminPinConfirm} onChange={handlePinConfirmChange} placeholder="Re-enter 6 digits" required maxLength={6} style={{ ...inputStyle, textAlign: 'center', letterSpacing: '0.35em', fontSize: '20px', fontWeight: 900 }} />
              {form.adminPinConfirm.length === 6 && form.adminPin !== form.adminPinConfirm && (
                <p style={{ fontSize: '12px', color: '#f87171', fontWeight: 700, marginTop: '6px' }}>PINs do not match.</p>
              )}
              <p style={{ fontSize: '11px', color: 'rgba(148,163,184,0.45)', marginTop: '8px', lineHeight: 1.5 }}>This PIN lets your business open the admin panel from the Login tab after approval.</p>
            </div>
          </div>

          {status === 'error' && (
            <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '14px', padding: '13px 16px', fontSize: '13px', color: 'rgba(248,113,113,0.9)', fontWeight: 600, marginBottom: '14px' }}>{errorMsg}</div>
          )}

          <button type="submit" disabled={status === 'loading'} style={{ width: '100%', padding: '15px', borderRadius: '16px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)', color: '#fff', fontSize: '15px', fontWeight: 800, letterSpacing: '-0.2px', boxShadow: '0 4px 20px rgba(59,130,246,0.4)', opacity: status === 'loading' ? 0.6 : 1, boxSizing: 'border-box', marginBottom: '12px' }}>
            {status === 'loading' ? 'Submitting…' : 'Submit Application'}
          </button>
          <p style={{ fontSize: '11px', color: 'rgba(148,163,184,0.4)', textAlign: 'center', lineHeight: 1.6 }}>
            By submitting you agree to our{' '}
            <Link to="/terms" style={{ color: '#60a5fa', fontWeight: 700, textDecoration: 'none' }}>Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy" style={{ color: '#60a5fa', fontWeight: 700, textDecoration: 'none' }}>Privacy Policy</Link>.
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-300 pb-24 sm:pb-8">
      <div className="max-w-xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10">
        <div className="mb-7">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-700 hover:text-gray-900 transition-colors mb-5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back
          </Link>
          <div className="flex items-center gap-3 mb-2"><span className="font-pacifico text-3xl text-blue-600">wavit</span></div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1">Register Your Business</h1>
          <p className="text-sm text-gray-600 font-medium">Get Wavit for your shop — we'll review your application and reach out within 1–2 days.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md p-5 space-y-4">
            <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest">Business Info</h2>
            <div><label className="block text-sm font-bold text-gray-700 mb-1.5">Business Name *</label><input type="text" value={form.businessName} onChange={set('businessName')} placeholder="e.g. Mario's Barbershop" required className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all" /></div>
            <div><label className="block text-sm font-bold text-gray-700 mb-1.5">Category *</label><select value={form.category} onChange={set('category')} required className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"><option value="">Select a category…</option>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-bold text-gray-700 mb-1.5">Staff Count</label><input type="number" min="1" max="20" value={form.numStaff} onChange={set('numStaff')} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all" /></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-1.5">Avg Service (min)</label><input type="number" min="1" max="120" value={form.avgServiceMinutes} onChange={set('avgServiceMinutes')} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all" /></div>
            </div>
            <div><label className="block text-sm font-bold text-gray-700 mb-1.5">ZIP Code</label><input type="text" value={form.zipCode} onChange={set('zipCode')} placeholder="e.g. 90210" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all" /></div>
          </div>
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md p-5 space-y-4">
            <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest">Contact Info</h2>
            <div><label className="block text-sm font-bold text-gray-700 mb-1.5">Your Name *</label><input type="text" value={form.ownerName} onChange={set('ownerName')} placeholder="Owner / manager name" required className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all" /></div>
            <div><label className="block text-sm font-bold text-gray-700 mb-1.5">Email *</label><input type="email" value={form.email} onChange={set('email')} placeholder="you@yourbusiness.com" required className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all" /></div>
            <div><label className="block text-sm font-bold text-gray-700 mb-1.5">Phone Number *</label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500 select-none">+1</span><input type="tel" value={formatPhoneDisplay(form.phone)} onChange={handlePhoneChange} placeholder="(555) 000-0000" required className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all" /></div></div>
            <div><label className="block text-sm font-bold text-gray-700 mb-1.5">Anything else? <span className="text-gray-400 font-normal">(optional)</span></label><textarea value={form.message} onChange={set('message')} placeholder="Tell us about your business, peak hours, etc." rows={3} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all resize-none" /></div>
          </div>
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md p-5">
            <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Queue Preferences</h2>
            <div className="flex items-center justify-between gap-3">
              <div><p className="text-sm font-bold text-gray-700">Allow Remote Join</p><p className="text-xs text-gray-500 mt-0.5 leading-relaxed">Let customers join your queue from anywhere, without being at the shop. <span className="text-amber-600 font-semibold">Not recommended</span></p></div>
              <button type="button" onClick={() => setAllowRemoteJoin(v => !v)} className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${allowRemoteJoin ? 'bg-blue-600' : 'bg-gray-200'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${allowRemoteJoin ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md p-5 space-y-3">
            <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest">Business Login</h2>
            <div><label className="block text-sm font-bold text-gray-700 mb-1.5">Create 6-digit Admin PIN *</label><input type="password" inputMode="numeric" autoComplete="new-password" value={form.adminPin} onChange={handlePinChange} placeholder="Enter 6 digits" required maxLength={6} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm font-black tracking-[0.35em] text-center focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all" /></div>
            <div><label className="block text-sm font-bold text-gray-700 mb-1.5">Confirm 6-digit Admin PIN *</label><input type="password" inputMode="numeric" autoComplete="new-password" value={form.adminPinConfirm} onChange={handlePinConfirmChange} placeholder="Re-enter 6 digits" required maxLength={6} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm font-black tracking-[0.35em] text-center focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all" />{form.adminPinConfirm.length === 6 && form.adminPin !== form.adminPinConfirm && (<p className="text-xs text-red-600 font-bold mt-2">PINs do not match.</p>)}<p className="text-xs text-gray-500 font-medium mt-2 leading-relaxed">This PIN lets your business open the admin panel from the Login tab after approval. You can change it later in your admin settings.</p></div>
          </div>
          {status === 'error' && (<div className="bg-red-50 border-2 border-red-300 text-red-700 text-sm rounded-xl px-4 py-3 font-medium">{errorMsg}</div>)}
          <button type="submit" disabled={status === 'loading'} className="w-full py-4 bg-blue-600 border-2 border-blue-700 text-black font-black text-sm hover:bg-blue-700 transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed">{status === 'loading' ? 'Submitting…' : 'Submit Application'}</button>
          <p className="text-xs text-gray-500 font-medium text-center pb-1">We review all applications manually. You'll hear from us within 1–2 business days.</p>
          <p className="text-[11px] text-gray-400 text-center leading-relaxed pb-2">By submitting you agree to our{' '}<Link to="/terms" className="text-violet-500 hover:underline font-semibold">Terms of Service</Link>{' '}and{' '}<Link to="/privacy" className="text-violet-500 hover:underline font-semibold">Privacy Policy</Link>.</p>
        </form>
      </div>
    </div>
  );
}
