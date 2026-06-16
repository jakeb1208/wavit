import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE, storeAdminToken } from '../lib/api';
import { isNative } from '../lib/platform';

const PAGE_BG = '#f4f6fa';
const BORDER = '#e2e8f0';
const TEXT = '#0f172a';
const TEXTSUB = '#64748b';
const BLUE = '#3b82f6';
const BLUE_BG = '#eff6ff';

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
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: value }),
      });
      const data = await res.json();
      if (!res.ok) {
        const wait = data.retryAfterSeconds ? ` Try again in ${Math.ceil(data.retryAfterSeconds / 60)} minutes.` : '';
        throw new Error((data.error || 'Login failed.') + wait);
      }
      if (data.token) storeAdminToken(data.token);
      navigate(`/admin/${data.shopId}`);
    } catch (err: any) {
      setError(err.message || 'Login failed.');
      setStatus('error');
    }
  };

  const Logo = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', marginBottom: '28px' }}>
      <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ color: '#fff', fontWeight: 900, fontSize: '20px', fontFamily: "'Inter', sans-serif" }}>W</span>
      </div>
      <div>
        <p style={{ fontSize: '18px', fontWeight: 800, color: TEXT, letterSpacing: '-0.5px', lineHeight: 1, fontFamily: "'Inter', sans-serif" }}>wavit</p>
        <p style={{ fontSize: '11px', fontWeight: 600, color: TEXTSUB, letterSpacing: '0.04em', textTransform: 'uppercase' as const, fontFamily: "'Inter', sans-serif" }}>Business</p>
      </div>
    </div>
  );

  if (native) {
    return (
      <div style={{ minHeight: '100vh', background: PAGE_BG, fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column', padding: '24px 20px 40px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ alignSelf: 'flex-start', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '8px 14px', color: TEXTSUB, fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '32px', fontFamily: "'Inter', sans-serif" }}
        >
          <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: '380px', width: '100%', margin: '0 auto' }}>
          <Logo />
          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '20px', padding: '28px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: TEXT, marginBottom: '6px', letterSpacing: '-0.4px', textAlign: 'center' }}>Admin Login</h2>
            <p style={{ fontSize: '13px', color: TEXTSUB, textAlign: 'center', marginBottom: '24px' }}>Enter your 6-digit PIN to access your dashboard.</p>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: TEXTSUB, textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: '8px' }}>
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
                    width: '100%', padding: '16px', borderRadius: '12px',
                    background: BLUE_BG, border: `1.5px solid ${BORDER}`,
                    color: TEXT, fontSize: '28px', textAlign: 'center' as const,
                    letterSpacing: '0.4em', fontWeight: 900, outline: 'none', boxSizing: 'border-box' as const,
                    fontFamily: "'Inter', sans-serif",
                  }}
                />
                <p style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '8px', textAlign: 'center' }}>
                  10 attempts per IP every 20 minutes
                </p>
              </div>
              {status === 'error' && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 14px', fontSize: '13px', color: '#ef4444', fontWeight: 600, marginBottom: '16px' }}>
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={status === 'loading'}
                style={{
                  width: '100%', padding: '14px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                  background: BLUE, color: '#fff', fontSize: '15px', fontWeight: 700,
                  letterSpacing: '-0.2px', opacity: status === 'loading' ? 0.6 : 1,
                  boxSizing: 'border-box' as const, fontFamily: "'Inter', sans-serif",
                }}
              >
                {status === 'loading' ? 'Checking…' : 'Open Admin Panel'}
              </button>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                <Link to="/forgot-pin" style={{ fontSize: '12px', color: BLUE, fontWeight: 700, textDecoration: 'none' }}>
                  Forgot your PIN?
                </Link>
                <Link to="/superadmin-login" style={{ fontSize: '12px', color: '#cbd5e1', textDecoration: 'none' }}>
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
    <div style={{ minHeight: '100vh', background: PAGE_BG, fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '88px 24px 24px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <Link
          to="/"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: TEXTSUB, textDecoration: 'none', marginBottom: '28px', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '8px 14px' }}
        >
          <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>

        <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
          <div style={{ padding: '36px 32px 0' }}>
            <Logo />
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: TEXT, marginBottom: '6px', letterSpacing: '-0.4px', textAlign: 'center' }}>Admin Login</h1>
            <p style={{ fontSize: '13px', color: TEXTSUB, textAlign: 'center', lineHeight: 1.6, marginBottom: '0' }}>Enter your 6-digit PIN to access your dashboard.</p>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '24px 32px 32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: TEXTSUB, textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: '8px' }}>6-Digit PIN</label>
              <input
                type="password"
                inputMode="numeric"
                autoComplete="current-password"
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••••"
                style={{
                  width: '100%', padding: '16px', borderRadius: '12px',
                  background: BLUE_BG, border: `1.5px solid ${BORDER}`,
                  color: TEXT, fontSize: '28px', textAlign: 'center' as const,
                  letterSpacing: '0.4em', fontWeight: 900, outline: 'none',
                  boxSizing: 'border-box' as const, fontFamily: "'Inter', sans-serif",
                  transition: 'border-color 0.15s',
                }}
              />
              <p style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '8px', textAlign: 'center' }}>10 attempts per IP every 20 minutes</p>
            </div>

            {status === 'error' && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 14px', fontSize: '13px', color: '#ef4444', fontWeight: 600 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                background: BLUE, color: '#fff', fontSize: '15px', fontWeight: 700,
                letterSpacing: '-0.2px', opacity: status === 'loading' ? 0.6 : 1,
                boxSizing: 'border-box' as const, fontFamily: "'Inter', sans-serif",
              }}
            >
              {status === 'loading' ? 'Checking…' : 'Open Admin Panel'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Link to="/forgot-pin" style={{ fontSize: '12px', color: BLUE, fontWeight: 700, textDecoration: 'none' }}>Forgot your PIN?</Link>
              <Link to="/superadmin-login" style={{ fontSize: '12px', color: '#cbd5e1', textDecoration: 'none' }}>Super admin →</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
