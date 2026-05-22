import { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE } from '../lib/api';

const GLASS = 'rgba(255,255,255,0.055)';
const BORDER = 'rgba(255,255,255,0.09)';
const inputStyle = { width: '100%', padding: '14px 16px', borderRadius: '14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#f0f4ff', fontSize: '14px', fontWeight: 500, outline: 'none', boxSizing: 'border-box' as const };

export default function ForgotPinPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');
  const [noEmail, setNoEmail] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) { setError('Please enter your email address.'); setStatus('error'); return; }
    setStatus('loading');
    setError('');
    try {
      const res = await fetch(`${API_BASE}/auth/request-pin-reset`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      if (res.status === 503) {
        setNoEmail(true);
        setStatus('error');
        setError('Email service is not configured on this server. Please contact support.');
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Something went wrong.');
      }
      setStatus('sent');
    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'Something went wrong. Please try again.');
    }
  };

  if (status === 'sent') {
    return (
      <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(30,58,138,0.35) 0%, #070b14 60%)', color: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: '28px', overflow: 'hidden', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
            <div style={{ background: 'linear-gradient(135deg, #1a0845, #1d3a8a, #1e40af)', padding: '28px 24px', textAlign: 'center' }}>
              <span className="font-pacifico" style={{ fontSize: '40px', color: '#93c5fd' }}>wavit</span>
            </div>
            <div style={{ padding: '32px 24px', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 0 20px rgba(16,185,129,0.2)' }}>
                <svg style={{ width: '28px', height: '28px', color: '#34d399' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#f0f4ff', marginBottom: '10px', letterSpacing: '-0.3px' }}>Check your inbox</h2>
              <p style={{ fontSize: '13px', color: 'rgba(148,163,184,0.7)', lineHeight: 1.6, marginBottom: '8px' }}>
                If <span style={{ fontWeight: 700, color: '#f0f4ff' }}>{email}</span> matches a registered business, you'll receive a reset link shortly.
              </p>
              <p style={{ fontSize: '12px', color: 'rgba(148,163,184,0.45)', marginBottom: '24px' }}>The link expires in 30 minutes. Check your spam folder if you don't see it.</p>
              <Link to="/login" style={{ fontSize: '13px', fontWeight: 700, color: '#60a5fa', textDecoration: 'none' }}>← Back to login</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(30,58,138,0.35) 0%, #070b14 60%)', color: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
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
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', marginTop: '10px', marginBottom: '6px', letterSpacing: '-0.4px' }}>Forgot your PIN?</h1>
            <p style={{ fontSize: '13px', color: 'rgba(219,234,254,0.8)', lineHeight: 1.6 }}>Enter your registered business email and we'll send you a reset link.</p>
          </div>
          <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(148,163,184,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Business Email</label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="owner@yourbusiness.com"
                style={inputStyle}
              />
              <p style={{ fontSize: '11px', color: 'rgba(148,163,184,0.4)', marginTop: '8px' }}>This must match the email address you registered with.</p>
            </div>
            {status === 'error' && (
              <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '12px', padding: '12px 14px', fontSize: '13px', color: 'rgba(248,113,113,0.9)', fontWeight: 600 }}>
                {error}
                {noEmail && <p style={{ marginTop: '8px', fontSize: '12px', color: 'rgba(248,113,113,0.7)' }}>Contact support to reset your PIN manually.</p>}
              </div>
            )}
            <button type="submit" disabled={status === 'loading'} style={{ width: '100%', padding: '15px', borderRadius: '16px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff', fontSize: '15px', fontWeight: 800, letterSpacing: '-0.2px', boxShadow: '0 4px 20px rgba(59,130,246,0.4)', opacity: status === 'loading' ? 0.6 : 1, boxSizing: 'border-box' as const }}>
              {status === 'loading' ? 'Sending…' : 'Send Reset Link'}
            </button>
            <p style={{ fontSize: '12px', color: 'rgba(148,163,184,0.45)', textAlign: 'center' }}>
              Remembered it?{' '}
              <Link to="/login" style={{ color: '#60a5fa', fontWeight: 700, textDecoration: 'none' }}>Log in instead</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
