import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE } from '../lib/api';

const GLASS = 'rgba(255,255,255,0.055)';
const BORDER = 'rgba(255,255,255,0.09)';
const inputStyle = { width: '100%', padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#f0f4ff', fontSize: '28px', textAlign: 'center' as const, letterSpacing: '0.4em', fontWeight: 900, outline: 'none', boxSizing: 'border-box' as const };

export default function ResetPinPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [tokenConsumed, setTokenConsumed] = useState(false);

  useEffect(() => {
    if (!token) {
      setError(tokenConsumed ? 'This reset link has already been used.' : 'No reset token found. Please use the link from your email.');
      setStatus('error');
    }
  }, [token, tokenConsumed]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pin)) {
      setError('PIN must be exactly 6 digits.');
      setStatus('error');
      return;
    }
    if (pin !== pinConfirm) {
      setError('PINs do not match. Please enter the same digits twice.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    setError('');
    try {
      const res = await fetch(`${API_BASE}/auth/reset-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, pin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed.');
      window.history.replaceState({}, document.title, '/reset-pin');
      setTokenConsumed(true);
      setStatus('success');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  const pageStyle = { minHeight: '100vh', background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(30,58,138,0.35) 0%, #070b14 60%)', color: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' };

  if (status === 'success') {
    return (
      <div style={pageStyle}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: '28px', overflow: 'hidden', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
            <div style={{ background: 'linear-gradient(135deg, #1a0845, #1d3a8a, #1e40af)', padding: '28px 24px', textAlign: 'center' }}>
              <span className="font-pacifico" style={{ fontSize: '40px', color: '#93c5fd' }}>wavit</span>
            </div>
            <div style={{ padding: '32px 24px', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 0 20px rgba(16,185,129,0.2)' }}>
                <svg style={{ width: '28px', height: '28px', color: '#34d399' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#f0f4ff', marginBottom: '10px', letterSpacing: '-0.3px' }}>PIN updated!</h2>
              <p style={{ fontSize: '13px', color: 'rgba(148,163,184,0.7)', lineHeight: 1.6, marginBottom: '24px' }}>Your new 6-digit PIN is set. You can now log in to your dashboard.</p>
              <button onClick={() => navigate('/login')} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff', fontSize: '15px', fontWeight: 800, boxShadow: '0 4px 20px rgba(59,130,246,0.4)', boxSizing: 'border-box' as const }}>
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#93c5fd', textDecoration: 'none', marginBottom: '28px', background: GLASS, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '8px 14px' }}>
          <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back to login
        </Link>
        <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: '28px', overflow: 'hidden', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07)' }}>
          <div style={{ background: 'linear-gradient(135deg, #1a0845, #1d3a8a, #1e40af)', padding: '32px 24px', textAlign: 'center' }}>
            <span className="font-pacifico" style={{ fontSize: '42px', color: '#93c5fd' }}>wavit</span>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', marginTop: '10px', marginBottom: '6px', letterSpacing: '-0.4px' }}>Set a new PIN</h1>
            <p style={{ fontSize: '13px', color: 'rgba(219,234,254,0.8)', lineHeight: 1.6 }}>Choose a 6-digit PIN you'll use to log in.</p>
          </div>
          <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(148,163,184,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>New PIN</label>
              <input type="password" inputMode="numeric" autoComplete="new-password" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="••••••" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(148,163,184,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Confirm new PIN</label>
              <input type="password" inputMode="numeric" autoComplete="new-password" value={pinConfirm} onChange={e => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="••••••" style={inputStyle} />
            </div>
            {status === 'error' && error && (
              <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '12px', padding: '12px 14px', fontSize: '13px', color: 'rgba(248,113,113,0.9)', fontWeight: 600 }}>
                {error}
                {(error.includes('expired') || error.includes('invalid') || error.includes('used')) && (
                  <span style={{ display: 'block', marginTop: '6px', fontSize: '12px' }}>
                    <Link to="/forgot-pin" style={{ color: 'rgba(248,113,113,0.9)', fontWeight: 700, textDecoration: 'underline' }}>Request a new reset link</Link>
                  </span>
                )}
              </div>
            )}
            <button type="submit" disabled={status === 'loading' || !token} style={{ width: '100%', padding: '15px', borderRadius: '16px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff', fontSize: '15px', fontWeight: 800, letterSpacing: '-0.2px', boxShadow: '0 4px 20px rgba(59,130,246,0.4)', opacity: (status === 'loading' || !token) ? 0.6 : 1, boxSizing: 'border-box' as const }}>
              {status === 'loading' ? 'Saving…' : 'Set New PIN'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
