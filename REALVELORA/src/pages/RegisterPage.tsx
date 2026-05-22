import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE } from '../lib/api';
import { isNative } from '../lib/platform';
import WavitLogo from '../components/WavitLogo';

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
      const res = await fetch(`${API_BASE}/register`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...submission, phone: `+1${digits}`, allowRemoteJoin }) });
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
      <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(30,58,138,0.28) 0%, #070b14 55%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: '24px', padding: '40px 32px', maxWidth: '380px', width: '100%', textAlign: 'center', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
          <div style={{ width: '64px', height: '64px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 0 20px rgba(16,185,129,0.2)' }}>
            <svg style={{ width: '28px', height: '28px', color: '#34d399' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#f0f4ff', marginBottom: '10px', letterSpacing: '-0.4px' }}>Application Submitted!</h2>
          <p style={{ fontSize: '14px', color: 'rgba(148,163,184,0.7)', lineHeight: 1.65, marginBottom: '24px' }}>Thanks for registering <strong style={{ color: '#f0f4ff' }}>{form.businessName}</strong>. We'll review your application and be in touch via <strong style={{ color: '#f0f4ff' }}>{form.email}</strong>.</p>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 24px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', borderRadius: '14px', color: '#fff', fontWeight: 700, fontSize: '14px', textDecoration: 'none', boxShadow: '0 4px 16px rgba(59,130,246,0.35)' }}>Back to Home</Link>
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
          <WavitLogo size="md" asDiv />
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

  const selectStyle = { ...inputStyle, appearance: 'none' as const, WebkitAppearance: 'none' as const };
  const textareaStyle = { ...inputStyle, resize: 'none' as const, minHeight: '80px' };

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse 80% 30% at 50% 0%, rgba(30,58,138,0.28) 0%, #070b14 50%)', color: '#f0f4ff', paddingBottom: '40px' }}>
      <div className="max-w-xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10">
        <div style={{ marginBottom: '24px' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#93c5fd', textDecoration: 'none', marginBottom: '20px', background: GLASS, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '8px 14px' }}>
            <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            Back
          </Link>
          <h1 style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-0.5px', marginBottom: '6px' }}>Register Your Business</h1>
          <p style={{ fontSize: '13px', color: 'rgba(148,163,184,0.65)' }}>Get Wavit for your shop — we'll review your application and reach out within 1–2 days.</p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={sectionStyle}>
            <p style={sectionTitleStyle}>Business Info</p>
            <div style={{ marginBottom: '12px' }}><label style={labelStyle}>Business Name *</label><input type="text" value={form.businessName} onChange={set('businessName')} placeholder="e.g. Mario's Barbershop" required style={inputStyle} /></div>
            <div style={{ marginBottom: '12px' }}><label style={labelStyle}>Category *</label><select value={form.category} onChange={set('category')} required style={selectStyle}><option value="" style={{ background: '#0f1629' }}>Select a category…</option>{CATEGORIES.map(c => <option key={c} value={c} style={{ background: '#0f1629' }}>{c}</option>)}</select></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div><label style={labelStyle}>Staff Count</label><input type="number" min="1" max="20" value={form.numStaff} onChange={set('numStaff')} style={inputStyle} /></div>
              <div><label style={labelStyle}>Avg Service (min)</label><input type="number" min="1" max="120" value={form.avgServiceMinutes} onChange={set('avgServiceMinutes')} style={inputStyle} /></div>
            </div>
            <div><label style={labelStyle}>ZIP Code</label><input type="text" value={form.zipCode} onChange={set('zipCode')} placeholder="e.g. 90210" style={inputStyle} /></div>
          </div>
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
          <div style={sectionStyle}>
            <p style={sectionTitleStyle}>Queue Preferences</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#f0f4ff', marginBottom: '4px' }}>Allow Remote Join</p>
                <p style={{ fontSize: '12px', color: 'rgba(148,163,184,0.55)', lineHeight: 1.5 }}>Let customers join your queue from anywhere. <span style={{ color: '#fbbf24', fontWeight: 700 }}>Not recommended</span></p>
              </div>
              <button type="button" onClick={() => setAllowRemoteJoin(v => !v)} style={{ width: '44px', height: '26px', borderRadius: '13px', border: 'none', background: allowRemoteJoin ? '#3b82f6' : 'rgba(255,255,255,0.15)', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 0.2s', boxShadow: allowRemoteJoin ? '0 0 10px rgba(59,130,246,0.4)' : 'none' }}>
                <span style={{ position: 'absolute', top: '3px', left: allowRemoteJoin ? '21px' : '3px', width: '20px', height: '20px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
              </button>
            </div>
          </div>
          <div style={sectionStyle}>
            <p style={sectionTitleStyle}>Business Login</p>
            <div style={{ marginBottom: '12px' }}><label style={labelStyle}>Create 6-digit Admin PIN *</label><input type="password" inputMode="numeric" autoComplete="new-password" value={form.adminPin} onChange={handlePinChange} placeholder="Enter 6 digits" required maxLength={6} style={{ ...inputStyle, textAlign: 'center', letterSpacing: '0.35em', fontSize: '20px', fontWeight: 900 }} /></div>
            <div>
              <label style={labelStyle}>Confirm 6-digit Admin PIN *</label>
              <input type="password" inputMode="numeric" autoComplete="new-password" value={form.adminPinConfirm} onChange={handlePinConfirmChange} placeholder="Re-enter 6 digits" required maxLength={6} style={{ ...inputStyle, textAlign: 'center', letterSpacing: '0.35em', fontSize: '20px', fontWeight: 900 }} />
              {form.adminPinConfirm.length === 6 && form.adminPin !== form.adminPinConfirm && (<p style={{ fontSize: '12px', color: '#f87171', fontWeight: 700, marginTop: '6px' }}>PINs do not match.</p>)}
              <p style={{ fontSize: '11px', color: 'rgba(148,163,184,0.45)', marginTop: '8px', lineHeight: 1.5 }}>This PIN lets your business open the admin panel from the Login tab after approval.</p>
            </div>
          </div>
          {status === 'error' && (<div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '14px', padding: '13px 16px', fontSize: '13px', color: 'rgba(248,113,113,0.9)', fontWeight: 600 }}>{errorMsg}</div>)}
          <button type="submit" disabled={status === 'loading'} style={{ width: '100%', padding: '15px', borderRadius: '16px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)', color: '#fff', fontSize: '15px', fontWeight: 800, letterSpacing: '-0.2px', boxShadow: '0 4px 20px rgba(59,130,246,0.4)', opacity: status === 'loading' ? 0.6 : 1, boxSizing: 'border-box' as const }}>{status === 'loading' ? 'Submitting…' : 'Submit Application'}</button>
          <p style={{ fontSize: '11px', color: 'rgba(148,163,184,0.4)', textAlign: 'center', lineHeight: 1.6 }}>We review all applications manually. You'll hear from us within 1–2 business days.</p>
          <p style={{ fontSize: '11px', color: 'rgba(148,163,184,0.35)', textAlign: 'center', lineHeight: 1.6, paddingBottom: '8px' }}>By submitting you agree to our{' '}<Link to="/terms" style={{ color: '#60a5fa', fontWeight: 700, textDecoration: 'none' }}>Terms of Service</Link>{' '}and{' '}<Link to="/privacy" style={{ color: '#60a5fa', fontWeight: 700, textDecoration: 'none' }}>Privacy Policy</Link>.</p>
        </form>
      </div>
    </div>
  );
}
