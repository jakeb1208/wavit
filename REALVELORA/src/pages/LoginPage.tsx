import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE } from '../lib/api';
import { isNative } from '../lib/platform';

const GLASS = 'rgba(255,255,255,0.055)';
const BORDER = 'rgba(255,255,255,0.09)';

export default function LoginPage() {
  const navigate = useNavigate();
  const native = isNative();
  const [pin, setPin] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setError('');
    const value = pin.trim();
    if (!value) { setError('Please enter your 6-digit PIN.'); setStatus('error'); return; }
    if (!/^\d{6}$/.test(value)) { setError('Business PINs are exactly 6 digits.'); setStatus('error'); return; }
    try {
      const res = await fetch(`${API_BASE}/business-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: value }),
      });
      const data = await res.json();
      if (!res.ok) {
        const wait = data.retryAfterSeconds ? ` Try again in ${Math.ceil(data.retryAfterSeconds / 60)} minutes.` : '';
        throw new Error((data.error || 'Login failed.') + wait);
      }
      navigate(`/admin/${data.shopId}`);
    } catch (err: any) {
      setError(err.message || 'Login failed.');
      setStatus('error');
    }
  };

  if (native) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(30,58,138,0.35) 0%, #070b14 60%)',
        color: '#f0f4ff',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 20px',
        paddingBottom: '40px',
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{ alignSelf: 'flex-start', background: GLASS, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '8px 14px', color: '#93c5fd', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '32px' }}
        >
          <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: '380px', width: '100%', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 className="font-pacifico" style={{ fontSize: '40px', color: '#60a5fa', marginBottom: '8px' }}>wavit</h1>
            <p style={{ fontSize: '20px', fontWeight: 800, color: '#f0f4ff', marginBottom: '6px', letterSpacing: '-0.4px' }}>Admin Login</p>
            <p style={{ fontSize: '13px', color: 'rgba(148,163,184,0.65)', fontWeight: 500 }}>Enter your 6-digit PIN to access your dashboard.</p>
          </div>

          {/* Form card */}
          <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: '24px', padding: '24px', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' }}>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(148,163,184,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                  6-Digit PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="current-password"
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••••"
                  style={{
                    width: '100%', padding: '16px', borderRadius: '16px',
                    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                    color: '#f0f4ff', fontSize: '28px', textAlign: 'center',
                    letterSpacing: '0.4em', fontWeight: 900, outline: 'none', boxSizing: 'border-box',
                  }}
                />
                <p style={{ fontSize: '11px', color: 'rgba(148,163,184,0.45)', marginTop: '8px', textAlign: 'center' }}>
                  10 attempts per IP every 20 minutes
                </p>
              </div>

              {status === 'error' && (
                <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '12px', padding: '12px 14px', fontSize: '13px', color: 'rgba(248,113,113,0.9)', fontWeight: 600, marginBottom: '16px' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                style={{
                  width: '100%', padding: '15px', borderRadius: '16px', border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                  color: '#fff', fontSize: '15px', fontWeight: 800, letterSpacing: '-0.2px',
                  boxShadow: '0 4px 20px rgba(59,130,246,0.4)', opacity: status === 'loading' ? 0.6 : 1,
                  boxSizing: 'border-box',
                }}
              >
                {status === 'loading' ? 'Checking…' : 'Open Admin Panel'}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                <Link to="/forgot-pin" style={{ fontSize: '12px', color: '#60a5fa', fontWeight: 700, textDecoration: 'none' }}>
                  Forgot your PIN?
                </Link>
                <Link to="/superadmin-login" style={{ fontSize: '12px', color: 'rgba(148,163,184,0.4)', textDecoration: 'none' }}>
                  Super admin →
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-300 pb-24 sm:pb-8">
      <div className="max-w-md mx-auto px-4 sm:px-6 pt-8 sm:pt-14">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-700 hover:text-gray-900 transition-colors mb-6">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
        <div className="bg-white rounded-3xl border-2 border-gray-200 shadow-md overflow-hidden">
          <div className="bg-gradient-to-br from-[#1a0845] via-[#1d3a8a] to-blue-700 px-6 py-8 text-center">
            <span className="font-pacifico text-4xl text-blue-300">wavit</span>
            <h1 className="text-2xl font-black text-white mt-4">Admin Login</h1>
            <p className="text-sm text-blue-100 mt-2 leading-relaxed">Enter your 6-digit PIN to access your dashboard.</p>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">6-Digit PIN</label>
              <input
                type="password" inputMode="numeric" autoComplete="current-password"
                value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••••"
                className="w-full px-4 py-4 rounded-2xl border-2 border-gray-200 text-center text-2xl tracking-[0.4em] font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
              />
              <p className="text-xs text-gray-500 font-medium mt-2">For safety, each user can only try 10 times every 20 minutes.</p>
            </div>
            {status === 'error' && (
              <div className="bg-red-50 border-2 border-red-300 text-red-700 text-sm rounded-xl px-4 py-3 font-medium">{error}</div>
            )}
            <button type="submit" disabled={status === 'loading'} className="w-full py-4 bg-blue-600 border-2 border-blue-700 text-white font-black text-sm hover:bg-blue-700 transition-colors shadow-md rounded-2xl disabled:opacity-60 disabled:cursor-not-allowed">
              {status === 'loading' ? 'Checking…' : 'Open Admin Panel'}
            </button>
            <div className="flex items-center justify-between pt-1">
              <Link to="/forgot-pin" className="text-xs text-blue-600 font-semibold hover:underline">Forgot your PIN?</Link>
              <Link to="/superadmin-login" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Super admin →</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
