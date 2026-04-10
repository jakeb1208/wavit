import { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE } from '../lib/api';

const CATEGORIES = ['Barbershop', 'Salon', 'Nail Salon', 'Spa', 'Clinic', 'Tattoo', 'Other'];

export default function RegisterPage() {
  const [form, setForm] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    category: '',
    zipCode: '',
    numStaff: '1',
    avgServiceMinutes: '15',
    message: '',
  });
  const [allowRemoteJoin, setAllowRemoteJoin] = useState(true);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    setForm(f => ({ ...f, phone: digits }));
  };

  const formatPhoneDisplay = (digits: string) => {
    if (!digits) return '';
    if (digits.length <= 3) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    const digits = form.phone.replace(/\D/g, '');
    if (digits.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit US phone number.');
      setStatus('error');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, phone: `+1${digits}`, allowRemoteJoin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      setStatus('success');
    } catch (err: any) {
      setErrorMsg(err.message);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-300 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 border-2 border-emerald-300 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">Application Submitted!</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-6 font-medium">
            Thanks for registering <strong>{form.businessName}</strong>. We'll review your application and be in touch via <strong>{form.email}</strong>.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-5 py-3 bg-blue-600 border-2 border-blue-700 text-black font-bold text-sm hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-300 pb-24 sm:pb-8">
      <div className="max-w-xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10">
        <div className="mb-7">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-700 hover:text-gray-900 transition-colors mb-5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <span className="font-pacifico text-3xl text-blue-600">wavit</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1">Register Your Business</h1>
          <p className="text-sm text-gray-600 font-medium">
            Get Wavit for your shop — we'll review your application and reach out within 1–2 days.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md p-5 space-y-4">
            <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest">Business Info</h2>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Business Name *</label>
              <input
                type="text"
                value={form.businessName}
                onChange={set('businessName')}
                placeholder="e.g. Mario's Barbershop"
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Category *</label>
              <select
                value={form.category}
                onChange={set('category')}
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
              >
                <option value="">Select a category…</option>
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Staff Count</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={form.numStaff}
                  onChange={set('numStaff')}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Avg Service (min)</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={form.avgServiceMinutes}
                  onChange={set('avgServiceMinutes')}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">ZIP Code</label>
              <input
                type="text"
                value={form.zipCode}
                onChange={set('zipCode')}
                placeholder="e.g. 90210"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md p-5 space-y-4">
            <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest">Contact Info</h2>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Your Name *</label>
              <input
                type="text"
                value={form.ownerName}
                onChange={set('ownerName')}
                placeholder="Owner / manager name"
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="you@yourbusiness.com"
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Phone Number *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500 select-none">+1</span>
                <input
                  type="tel"
                  value={formatPhoneDisplay(form.phone)}
                  onChange={handlePhoneChange}
                  placeholder="(555) 000-0000"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Anything else? <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={form.message}
                onChange={set('message')}
                placeholder="Tell us about your business, peak hours, etc."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all resize-none"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md p-5">
            <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Queue Preferences</h2>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-gray-700">Allow Remote Join</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  Let customers join your queue from anywhere, without being at the shop.{' '}
                  <span className="text-amber-600 font-semibold">Not recommended</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAllowRemoteJoin(v => !v)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${
                  allowRemoteJoin ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                    allowRemoteJoin ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {status === 'error' && (
            <div className="bg-red-50 border-2 border-red-300 text-red-700 text-sm rounded-xl px-4 py-3 font-medium">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full py-4 bg-blue-600 border-2 border-blue-700 text-black font-black text-sm hover:bg-blue-700 transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? 'Submitting…' : 'Submit Application'}
          </button>

          <p className="text-xs text-gray-500 font-medium text-center pb-2">
            We review all applications manually. You'll hear from us within 1–2 business days.
          </p>
        </form>
      </div>
    </div>
  );
}
