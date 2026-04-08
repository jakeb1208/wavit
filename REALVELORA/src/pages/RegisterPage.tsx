import { useState } from 'react';
import { Link } from 'react-router-dom';

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
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
      <div className="min-h-screen bg-[#f8f7ff] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            Thanks for registering <strong>{form.businessName}</strong>. We'll review your application and be in touch via <strong>{form.email}</strong>.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-5 py-3 bg-violet-600 text-white font-bold text-sm rounded-xl hover:bg-violet-700 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f7ff] pb-24 sm:pb-8">
      <div className="max-w-xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10">
        <div className="mb-7">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl flex items-center justify-center shadow-md shadow-violet-300/40">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 3L4 14h7v7l9-11h-7V3z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">wav<span className="text-violet-600">it</span></span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1">Register Your Business</h1>
          <p className="text-sm text-gray-500">
            Get Wavit for your shop — we'll review your application and reach out within 1–2 days.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Business Info</h2>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Business Name *</label>
              <input
                type="text"
                value={form.businessName}
                onChange={set('businessName')}
                placeholder="e.g. Mario's Barbershop"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category *</label>
              <select
                value={form.category}
                onChange={set('category')}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all"
              >
                <option value="">Select a category…</option>
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Staff Count</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={form.numStaff}
                  onChange={set('numStaff')}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Avg Service (min)</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={form.avgServiceMinutes}
                  onChange={set('avgServiceMinutes')}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">ZIP Code</label>
              <input
                type="text"
                value={form.zipCode}
                onChange={set('zipCode')}
                placeholder="e.g. 90210"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Contact Info</h2>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Your Name *</label>
              <input
                type="text"
                value={form.ownerName}
                onChange={set('ownerName')}
                placeholder="Owner / manager name"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="you@yourbusiness.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number *</label>
              <input
                type="tel"
                value={form.phone}
                onChange={set('phone')}
                placeholder="+1 (555) 000-0000"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Anything else? <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea
                value={form.message}
                onChange={set('message')}
                placeholder="Tell us about your business, peak hours, etc."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all resize-none"
              />
            </div>
          </div>

          {status === 'error' && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full py-4 bg-violet-600 text-white font-bold text-sm rounded-xl hover:bg-violet-700 transition-colors shadow-sm shadow-violet-300/40 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? 'Submitting…' : 'Submit Application'}
          </button>

          <p className="text-xs text-gray-400 text-center pb-2">
            We review all applications manually. You'll hear from us within 1–2 business days.
          </p>
        </form>
      </div>
    </div>
  );
}
