import { useEffect, useState } from 'react';

interface PostJoinAdProps {
  onDone: () => void;
}

export default function PostJoinAd({ onDone }: PostJoinAdProps) {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (countdown <= 0) {
      onDone();
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, onDone]);

  return (
    <div className="fixed inset-0 z-[200] bg-violet-950 flex flex-col items-center justify-center p-6 text-white">
      <div className="text-center max-w-xs animate-fade-up">
        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-black mb-2">You're in the queue!</h2>
        <p className="text-violet-300 text-sm mb-8">
          While you wait, did you know Wavit helps businesses of all sizes?
        </p>

        <div className="bg-white/10 rounded-2xl p-5 text-left mb-6">
          <p className="font-bold text-sm mb-3">Wavit for businesses</p>
          <ul className="space-y-2">
            {[
              'Real-time queue management',
              'Automatic SMS notifications',
              'No-show tracking & analytics',
              'Free to list your business',
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-violet-200">
                <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={onDone}
          className="w-full py-3.5 bg-white text-violet-800 font-bold text-sm rounded-2xl hover:bg-violet-50 transition-colors flex items-center justify-center gap-2"
        >
          <span>View my queue spot</span>
          {countdown > 0 && (
            <span className="w-5 h-5 bg-violet-100 rounded-full text-xs font-bold flex items-center justify-center text-violet-600">
              {countdown}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
