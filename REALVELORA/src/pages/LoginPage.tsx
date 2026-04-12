import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE } from '../lib/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState('');

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPin(e.target.value.replace(/\D/g, '').slice(0, 6));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setError('');

    if (pin.length !== 6) {
      setError('Enter your 6-digit business PIN.');
      setStatus('error');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/business-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        const wait = data.retryAfterSeconds ? ` Try again in ${Math.ceil(data.retryAfterSeconds / 60)} minutes.` : '';
        throw new Error((data.error || 'Login failed.') + wait);
      }
      navigate(`/admin/${data.shopId}/${data.adminSecret}`);
    } catch (err: any) {
      setError(err.message || 'Login failed.');
      setStatus('error');
    }
  };

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
            <h1 className="text-2xl font-black text-white mt-4">Business Login</h1>
            <p className="text-sm text-blue-100 mt-2 leading-relaxed">
              Enter your 6-digit PIN to open your admin dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">6-digit business PIN</label>
              <input
                type="password"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={pin}
                onChange={handlePinChange}
                placeholder="••••••"
                maxLength={6}
                className="w-full px-4 py-4 rounded-2xl border-2 border-gray-200 text-center text-3xl tracking-[0.45em] font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
              />
              <p className="text-xs text-gray-500 font-medium mt-2">
                For safety, each user can only try 10 times every 20 minutes.
              </p>
            </div>

            {status === 'error' && (
              <div className="bg-red-50 border-2 border-red-300 text-red-700 text-sm rounded-xl px-4 py-3 font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-4 bg-blue-600 border-2 border-blue-700 text-black font-black text-sm hover:bg-blue-700 transition-colors shadow-md rounded-2xl disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? 'Checking…' : 'Open Admin Panel'}
            </button>

            <p className="text-xs text-gray-500 text-center leading-relaxed">
              Need a PIN? Register your business first, or ask the super admin to update your shop PIN.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}