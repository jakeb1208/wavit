import { useState } from 'react';

export default function BannerAd() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-blue-700 text-white px-4 py-2.5 flex items-center justify-between gap-3 shadow-lg border-t-2 border-blue-800">
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          <p className="text-xs font-black leading-tight">Get your business on Wavit</p>
          <p className="text-[10px] text-blue-200 leading-tight truncate font-medium">Join 8+ local shops managing queues smarter</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="px-3 py-1.5 bg-white border-2 border-gray-200 text-black font-bold text-xs hover:bg-gray-100 transition-colors"
        >
          Apply Now
        </button>
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
