import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiShop } from '../store/queueStore';
import InterstitialAd, { hasSeenInterstitial } from './InterstitialAd';

interface ShopCardProps {
  shop: ApiShop;
  showJoinLink?: boolean;
}

const categoryColor: Record<string, string> = {
  Barbershop: 'bg-blue-700',
  Salon: 'bg-blue-500',
  'Nail Salon': 'bg-blue-400',
  Spa: 'bg-teal-500',
  Clinic: 'bg-blue-600',
  Tattoo: 'bg-gray-700',
};

export default function ShopCard({ shop, showJoinLink = false }: ShopCardProps) {
  const navigate = useNavigate();
  const [showAd, setShowAd] = useState(false);
  const servingNow = shop.queue.filter(t => t.servedAt && !t.exitedAt);
  const waitingQueue = shop.queue.filter(t => !t.servedAt && !t.exitedAt);
  const waitRange = shop.waitRange || 'No wait';
  const totalActive = servingNow.length + waitingQueue.length;
  const hasWait = waitingQueue.length > 0;
  const queueLen = totalActive;
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
        className={`group bg-white rounded-2xl border-2 border-gray-200 p-5 transition-all duration-200 ${
          showJoinLink
            ? 'cursor-pointer hover:border-blue-400 hover:shadow-lg hover:shadow-blue-100/60 active:scale-[0.98]'
            : ''
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`w-10 h-10 ${categoryColor[shop.category] || 'bg-gray-500'} rounded-xl flex items-center justify-center shrink-0`}>
              <span className="text-xs font-black text-white tracking-tight">
                {shop.name.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || shop.name.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-bold text-gray-900 truncate leading-snug group-hover:text-blue-700 transition-colors">
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
          </div>
        </div>

        {isOpen && (
          <div className="mt-3 flex items-center gap-3 text-[11px] font-semibold text-gray-500 flex-wrap">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {servingNow.length} being served
            </span>
            <span className="text-gray-300">·</span>
            <span>{shop.numStaff} staff</span>
            <span className="text-gray-300">·</span>
            <span>{waitingQueue.length === 0 ? 'No one waiting' : `${waitingQueue.length} in line`}</span>
          </div>
        )}

        {showJoinLink && shop.phone && (
          <div className="mt-2">
            <p className="text-xs text-gray-400">{shop.phone}</p>
          </div>
        )}
      </div>
    </>
  );
}
