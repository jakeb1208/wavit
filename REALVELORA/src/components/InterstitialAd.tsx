import { useEffect, useState } from 'react';

interface InterstitialAdProps {
  onContinue: () => void;
}

const AD_SESSION_KEY = 'wavit_interstitial_seen';

export function hasSeenInterstitial() {
  return sessionStorage.getItem(AD_SESSION_KEY) === 'true';
}

export function markInterstitialSeen() {
  sessionStorage.setItem(AD_SESSION_KEY, 'true');
}

export default function InterstitialAd({ onContinue }: InterstitialAdProps) {
  const [countdown, setCountdown] = useState(4);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleContinue = () => {
    markInterstitialSeen();
    onContinue();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl overflow-hidden w-full max-w-sm shadow-2xl animate-fade-up">
        {/* Ad content */}
        <div className="bg-gradient-to-br from-violet-800 to-indigo-900 p-8 text-white text-center">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-black mb-2">Own a local business?</h2>
          <p className="text-violet-200 text-sm leading-relaxed">
            List on Wavit and let customers join your queue from anywhere. No app download needed.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 text-left">
            {[
              { text: 'Live queue management' },
              { text: 'SMS alerts to customers' },
              { text: 'Analytics reports' },
              { text: 'Setup in minutes' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 bg-white/10 rounded-xl p-2.5">
                <span className="text-xs font-medium text-violet-100">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 space-y-2.5">
          <a
            href="mailto:hello@wavit.app?subject=List my business on Wavit"
            className="block w-full py-3 bg-violet-600 text-white font-bold text-sm rounded-2xl text-center hover:bg-violet-700 transition-colors"
          >
            Get Listed on Wavit →
          </a>
          <button
            onClick={handleContinue}
            className="w-full py-3 bg-gray-50 text-gray-600 font-semibold text-sm rounded-2xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
          >
            {countdown > 0 ? (
              <>
                <span>Continue to shop</span>
                <span className="w-5 h-5 bg-gray-200 rounded-full text-xs font-bold flex items-center justify-center text-gray-500">
                  {countdown}
                </span>
              </>
            ) : (
              'Continue to shop →'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
