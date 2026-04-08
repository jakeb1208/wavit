import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiShop } from '../store/queueStore';
import InterstitialAd, { hasSeenInterstitial } from './InterstitialAd';

interface ShopCardProps {
  shop: ApiShop;
  showJoinLink?: boolean;
}

const categoryIcon: Record<string, string> = {
  Barbershop: '✂️',
  Salon: '💇',
  'Nail Salon': '💅',
  Spa: '🧖',
  Clinic: '🏥',
};

export default function ShopCard({ shop, showJoinLink = false }: ShopCardProps) {
  const navigate = useNavigate();
  const [showAd, setShowAd] = useState(false);
  const activeQueue = shop.queue.filter(t => !t.exitedAt);
  const waitRange = shop.waitRange || 'No wait';
  const hasWait = activeQueue.length > 0;
  const queueLen = activeQueue.length;
  const isOpen = shop.queueOpen !== false;

  const statusColor = !isOpen
    ? 'text-gray-500 bg-gray-100 border-gray-200'
    : !hasWait
      ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
      : queueLen <= 3
        ? 'text-amber-600 bg-amber-50 border-amber-200'
        : 'text-red-600 bg-red-50 border-red-200';

  const dotColor = !isOpen ? 'bg-gray-400' : !hasWait ? 'bg-emerald-500' : queueLen <= 3 ? 'bg-amber-500' : 'bg-red-500';

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
        className={`group bg-white rounded-2xl border border-gray-100 p-5 transition-all duration-200 ${
          showJoinLink
            ? 'cursor-pointer hover:border-violet-200 hover:shadow-lg hover:shadow-violet-100/60 active:scale-[0.98]'
            : ''
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center text-xl shrink-0">
              {categoryIcon[shop.category] || '🏪'}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-bold text-gray-900 truncate leading-snug group-hover:text-violet-700 transition-colors">
                {shop.name}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {shop.category}
                {shop.zipCode && <span> · ZIP {shop.zipCode}</span>}
                {' '}· ~{shop.avgServiceMinutes} min/visit
              </p>
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-end gap-1">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${statusColor}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${isOpen && !hasWait ? 'animate-pulse' : ''}`} />
              {!isOpen ? 'Closed' : waitRange}
            </div>
            <p className="text-[11px] text-gray-400">
              {!isOpen ? `Opens ${shop.openingTime || '9:00'}` : queueLen === 0 ? 'No queue' : `${queueLen} in line`}
            </p>
          </div>
        </div>

        {showJoinLink && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-gray-400">{shop.phone}</p>
            <span className="text-xs font-semibold text-violet-600 flex items-center gap-1 group-hover:gap-1.5 transition-all">
              Join queue
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        )}
      </div>
    </>
  );
}
