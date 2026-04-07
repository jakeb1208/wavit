import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function BannerAd() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="fixed bottom-[64px] sm:bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-violet-700 to-purple-700 text-white px-4 py-2.5 flex items-center justify-between gap-3 shadow-lg">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold leading-tight">Get your business on Wavit</p>
          <p className="text-[10px] text-violet-200 leading-tight truncate">Join 8+ local shops managing queues smarter</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          to="/about"
          className="px-3 py-1.5 bg-white text-violet-700 font-bold text-xs rounded-lg hover:bg-violet-50 transition-colors"
        >
          Learn More
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="w-6 h-6 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
