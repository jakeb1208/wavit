import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../lib/api';

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
        setError('SUPERADMIN_SECRET is not configured on this server. Set it in your environment variables.');
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
    <div className="min-h-screen bg-gradient-to-b from-[#1a0845] via-[#1d3a8a] to-[#1e40af] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#1a0845] to-[#3b1fa3] px-8 py-7 text-center">
          <span className="font-pacifico text-3xl text-blue-300">wavit</span>
          <p className="text-violet-300 text-xs mt-1 font-semibold uppercase tracking-widest">Super Admin</p>
        </div>
        <div className="p-8">
          <h2 className="text-xl font-black text-gray-900 mb-1 text-center">Enter your PIN</h2>
          <p className="text-sm text-gray-500 text-center mb-6 font-medium">Access is restricted to authorized admins only.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="pin" className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Admin PIN
              </label>
              <input
                id="pin"
                type="password"
                value={pin}
                onChange={e => setPin(e.target.value)}
                placeholder="Enter your PIN"
                className="w-full px-4 py-3.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 focus:bg-white transition-all font-medium placeholder:font-normal placeholder:text-gray-400"
                autoFocus
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2.5 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl border border-red-100">
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-violet-400/25 active:scale-[0.98]"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2 justify-center">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verifying...
                </span>
              ) : (
                'Access Admin Panel'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
