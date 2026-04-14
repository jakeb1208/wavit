import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE } from '../lib/api';

export default function ResetPinPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('No reset token found. Please use the link from your email.');
      setStatus('error');
    }
  }, [token]);

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
      setStatus('success');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  if (status === 'success') {
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-black text-gray-900 mb-2">PIN updated!</h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                Your new 6-digit PIN is set. You can now log in to your dashboard.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-4 bg-blue-600 text-white font-black text-sm rounded-2xl hover:bg-blue-700 transition-colors shadow-md"
              >
                Go to Login
              </button>
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
            <h1 className="text-2xl font-black text-white mt-4">Set a new PIN</h1>
            <p className="text-sm text-blue-100 mt-2 leading-relaxed">
              Choose a 6-digit PIN you'll use to log in.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">New PIN</label>
              <input
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6 digits"
                className="w-full px-4 py-4 rounded-2xl border-2 border-gray-200 text-center text-2xl tracking-widest font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Confirm new PIN</label>
              <input
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                value={pinConfirm}
                onChange={e => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6 digits"
                className="w-full px-4 py-4 rounded-2xl border-2 border-gray-200 text-center text-2xl tracking-widest font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
              />
            </div>

            {(status === 'error') && error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 font-medium">
                {error}
                {(error.includes('expired') || error.includes('invalid')) && (
                  <span className="block mt-1.5">
                    <Link to="/forgot-pin" className="text-red-700 font-bold underline">Request a new reset link</Link>
                  </span>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading' || !token}
              className="w-full py-4 bg-blue-600 border-2 border-blue-700 text-white font-black text-sm hover:bg-blue-700 transition-colors shadow-md rounded-2xl disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? 'Saving…' : 'Set New PIN'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
