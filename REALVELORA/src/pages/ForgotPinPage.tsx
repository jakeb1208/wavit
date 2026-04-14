import { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE } from '../lib/api';

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      if (res.status === 503) {
        setNoEmail(true);
        setStatus('error');
        setError('Email service is not configured on this server. Please contact the Wavit admin directly.');
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
      <div className="min-h-screen bg-gray-300 pb-24 sm:pb-8">
        <div className="max-w-md mx-auto px-4 sm:px-6 pt-8 sm:pt-14">
          <div className="bg-white rounded-3xl border-2 border-gray-200 shadow-md overflow-hidden">
            <div className="bg-gradient-to-br from-[#1a0845] via-[#1d3a8a] to-blue-700 px-6 py-8 text-center">
              <span className="font-pacifico text-4xl text-blue-300">wavit</span>
            </div>
            <div className="p-8 text-center">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-lg font-black text-gray-900 mb-2">Check your inbox</h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-2">
                If <span className="font-semibold text-gray-700">{email}</span> matches a registered business, you'll receive a reset link shortly.
              </p>
              <p className="text-xs text-gray-400 mb-6">The link expires in 30 minutes. Check your spam folder if you don't see it.</p>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
              >
                ← Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-300 pb-24 sm:pb-8">
      <div className="max-w-md mx-auto px-4 sm:px-6 pt-8 sm:pt-14">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-700 hover:text-gray-900 transition-colors mb-6">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to login
        </Link>

        <div className="bg-white rounded-3xl border-2 border-gray-200 shadow-md overflow-hidden">
          <div className="bg-gradient-to-br from-[#1a0845] via-[#1d3a8a] to-blue-700 px-6 py-8 text-center">
            <span className="font-pacifico text-4xl text-blue-300">wavit</span>
            <h1 className="text-2xl font-black text-white mt-4">Forgot your PIN?</h1>
            <p className="text-sm text-blue-100 mt-2 leading-relaxed">
              Enter your registered business email and we'll send you a reset link.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Business Email</label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="owner@yourbusiness.com"
                className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all placeholder:text-gray-400"
              />
              <p className="text-xs text-gray-400 mt-2">
                This must match the email address you registered with. For the analytics email, that also works.
              </p>
            </div>

            {status === 'error' && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 font-medium">
                {error}
                {noEmail && (
                  <p className="mt-2 text-xs text-red-500">
                    Contact <span className="font-mono">support@wavit.app</span> to reset your PIN manually.
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-4 bg-blue-600 border-2 border-blue-700 text-white font-black text-sm hover:bg-blue-700 transition-colors shadow-md rounded-2xl disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? 'Sending…' : 'Send Reset Link'}
            </button>

            <p className="text-xs text-gray-400 text-center">
              Remembered it?{' '}
              <Link to="/login" className="text-blue-600 font-semibold hover:underline">Log in instead</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
