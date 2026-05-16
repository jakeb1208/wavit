import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE } from '../lib/api';
import WavitLogo from '../components/WavitLogo';

const BG    = '#070b14';
const GLASS = 'rgba(255,255,255,0.05)';
const BORDER= 'rgba(255,255,255,0.1)';
const TEXT  = '#f0f4ff';
const TEXTSUB='rgba(148,163,184,0.65)';

export default function SuperAdminLoginPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) { setError('Please enter your PIN'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/superadmin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin.trim() }),
      });
      if (res.ok) {
        navigate('/superadmin');
      } else if (res.status === 503) {
        setError('Super admin is not configured on this server.');
      } else if (res.status === 403) {
        setError('Incorrect PIN. Please try again.');
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error || 'Incorrect PIN. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: BG,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'Inter', system-ui, sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes sal-spin { to { transform: rotate(360deg); } }
        @keyframes sal-float-a {
          0%   { transform: translate(0,0) scale(1); }
          50%  { transform: translate(30px,-40px) scale(1.1); }
          100% { transform: translate(-20px,15px) scale(0.92); }
        }
        @keyframes sal-float-b {
          0%   { transform: translate(0,0) scale(1); }
          50%  { transform: translate(-35px,30px) scale(1.08); }
          100% { transform: translate(25px,-20px) scale(0.9); }
        }
        @keyframes sal-float-c {
          0%   { transform: translate(0,0) scale(1); }
          50%  { transform: translate(20px,35px) scale(0.94); }
          100% { transform: translate(-15px,-30px) scale(1.06); }
        }
        @keyframes sal-rise {
          0%   { transform: translateY(0) scale(0.6); opacity: 0; }
          10%  { opacity: 0.9; }
          85%  { opacity: 0.3; }
          100% { transform: translateY(-90px) scale(1); opacity: 0; }
        }
        @keyframes sal-fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes sal-input-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
          50%       { box-shadow: 0 0 0 4px rgba(59,130,246,0.12); }
        }
        .sal-input:focus {
          outline: none;
          border-color: rgba(99,130,255,0.55) !important;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.15) !important;
          background: rgba(255,255,255,0.07) !important;
        }
        .sal-fade-up { animation: sal-fade-up 0.45s ease-out both; }
        .sal-submit:hover:not(:disabled) {
          transform: scale(1.02);
          box-shadow: 0 0 32px rgba(99,130,255,0.6) !important;
        }
        .sal-submit:active:not(:disabled) { transform: scale(0.98); }
        .sal-submit { transition: all 0.2s ease; }
      `}} />

      {/* Ambient blobs */}
      <div style={{ position: 'fixed', top: '-12%', left: '-15%', width: '60vw', height: '60vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.24) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none', animation: 'sal-float-a 18s ease-in-out infinite alternate' }} />
      <div style={{ position: 'fixed', bottom: '-15%', right: '-15%', width: '55vw', height: '55vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)', filter: 'blur(90px)', pointerEvents: 'none', animation: 'sal-float-b 22s ease-in-out infinite alternate' }} />
      <div style={{ position: 'fixed', top: '40%', left: '40%', width: '35vw', height: '35vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none', animation: 'sal-float-c 16s ease-in-out infinite alternate' }} />

      {/* Floating particles */}
      {[
        { left:'12%', top:'60%', size:2.5, color:'rgba(59,130,246,0.7)',  delay:'0s',    dur:'9s'  },
        { left:'78%', top:'25%', size:2,   color:'rgba(139,92,246,0.65)', delay:'-3.5s', dur:'11s' },
        { left:'35%', top:'80%', size:1.5, color:'rgba(6,182,212,0.6)',   delay:'-7s',   dur:'8s'  },
        { left:'65%', top:'70%', size:2,   color:'rgba(96,165,250,0.6)',  delay:'-2s',   dur:'12s' },
        { left:'20%', top:'30%', size:1.5, color:'rgba(167,139,250,0.6)',delay:'-5s',   dur:'10s' },
        { left:'88%', top:'55%', size:2.5, color:'rgba(59,130,246,0.55)',delay:'-8s',   dur:'9s'  },
      ].map((p, i) => (
        <div key={i} style={{
          position: 'fixed', borderRadius: '50%', pointerEvents: 'none',
          left: p.left, top: p.top,
          width: `${p.size}px`, height: `${p.size}px`,
          background: p.color,
          boxShadow: `0 0 ${p.size * 5}px ${p.size * 2}px ${p.color}`,
          animation: `sal-rise ${p.dur} linear ${p.delay} infinite`,
        }} />
      ))}

      {/* Card */}
      <div
        className="sal-fade-up"
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '400px',
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${BORDER}`,
          borderRadius: '28px',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          overflow: 'hidden',
          boxShadow: '0 0 80px rgba(59,130,246,0.1), 0 0 0 1px rgba(255,255,255,0.05)',
        }}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(15,23,60,0.9) 0%, rgba(35,18,75,0.9) 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          padding: '32px 32px 28px',
          textAlign: 'center',
          position: 'relative',
        }}>
          {/* Subtle top glow line */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(99,130,255,0.5), transparent)' }} />

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <WavitLogo size="lg" asDiv />
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 14px',
            background: 'rgba(139,92,246,0.15)',
            border: '1px solid rgba(139,92,246,0.25)',
            borderRadius: '20px',
          }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#a78bfa', boxShadow: '0 0 6px rgba(167,139,250,0.8)' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(167,139,250,0.9)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Super Admin</span>
          </div>
        </div>

        {/* Form */}
        <div style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: TEXT, textAlign: 'center', marginBottom: '6px', letterSpacing: '-0.02em' }}>
            Enter your PIN
          </h2>
          <p style={{ fontSize: '13px', color: TEXTSUB, textAlign: 'center', marginBottom: '28px', lineHeight: 1.5 }}>
            Access is restricted to authorized admins only.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label htmlFor="sal-pin" style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(148,163,184,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                Admin PIN
              </label>
              <input
                id="sal-pin"
                className="sal-input"
                type="password"
                value={pin}
                onChange={e => setPin(e.target.value)}
                placeholder="Enter your PIN"
                autoFocus
                autoComplete="current-password"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: GLASS,
                  border: `1px solid ${BORDER}`,
                  borderRadius: '14px',
                  color: TEXT,
                  fontSize: '15px',
                  fontFamily: "'Inter', system-ui, sans-serif",
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease',
                  caretColor: '#60a5fa',
                }}
              />
            </div>

            {error && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '12px',
              }}>
                <svg width="16" height="16" fill="#f87171" viewBox="0 0 20 20" style={{ flexShrink: 0 }}>
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p style={{ fontSize: '13px', color: '#f87171', margin: 0, fontWeight: 500 }}>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="sal-submit"
              style={{
                width: '100%',
                padding: '15px',
                background: loading ? 'rgba(59,130,246,0.4)' : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                border: 'none',
                borderRadius: '14px',
                color: '#fff',
                fontSize: '15px',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: "'Inter', system-ui, sans-serif",
                boxShadow: loading ? 'none' : '0 0 24px rgba(59,130,246,0.45)',
                opacity: loading ? 0.75 : 1,
                letterSpacing: '-0.01em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {loading ? (
                <>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'sal-spin 0.8s linear infinite' }} />
                  Verifying…
                </>
              ) : (
                'Access Admin Panel'
              )}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: TEXTSUB }}>
            <Link to="/" style={{ color: 'rgba(96,165,250,0.75)', textDecoration: 'none', fontWeight: 500 }}>← Back to site</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
