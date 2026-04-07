import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiShop } from '../store/queueStore';
import InterstitialAd, { hasSeenInterstitial } from './InterstitialAd';

interface ShopCardProps {
  shop: ApiShop;
  showJoinLink?: boolean;
}

export default function ShopCard({ shop, showJoinLink = false }: ShopCardProps) {
  const navigate = useNavigate();
  const [showAd, setShowAd] = useState(false);
  const activeQueue = shop.queue.filter(t => !t.exitedAt);
  const waitRange = shop.waitRange || 'No wait';
  const hasWait = activeQueue.length > 0;

  const badgeStyle = !hasWait
    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
    : activeQueue.length <= 3
      ? 'text-amber-700 bg-amber-50 border-amber-200'
      : 'text-red-700 bg-red-50 border-red-200';

  const dotColor = !hasWait
    ? 'bg-emerald-500'
    : activeQueue.length <= 3
      ? 'bg-amber-500'
      : 'bg-red-500';

  const handleClick = () => {
    if (!showJoinLink) return;
    if (hasSeenInterstitial()) {
      navigate(`/join/${shop.id}`);
    } else {
      setShowAd(true);
    }
  };

  return (
    <>
      {showAd && (
        <InterstitialAd onContinue={() => {
          setShowAd(false);
          navigate(`/join/${shop.id}`);
        }} />
      )}

      <div
        onClick={handleClick}
        className={`group bg-white rounded-2xl border border-violet-100/60 p-5 transition-all duration-300 ${
          showJoinLink ? 'cursor-pointer hover:shadow-md hover:border-violet-200' : ''
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-bold text-gray-900 truncate group-hover:text-violet-700 transition-colors">
                {shop.name}
              </h3>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-600">
                {shop.category}
              </span>
              <span className="text-xs text-gray-400">{shop.phone}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">~{shop.avgServiceMinutes} min per visit</p>
          </div>

          <div className="text-right shrink-0">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold border ${badgeStyle}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${!hasWait ? 'animate-pulse' : ''}`} />
              {waitRange}
            </div>
            <p className="text-xs text-gray-400 mt-1.5 text-right">
              {activeQueue.length === 0 ? 'No queue' : `${activeQueue.length} waiting`}
            </p>
          </div>
        </div>

        {showJoinLink && (
          <div className="mt-3 pt-3 border-t border-violet-50 flex items-center justify-between">
            <p className="text-xs text-gray-400">Tap to join queue</p>
            <svg className="w-4 h-4 text-violet-400 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        )}
      </div>
    </>
  );
}
