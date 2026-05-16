import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiShop } from '../store/queueStore';
import InterstitialAd, { hasSeenInterstitial } from './InterstitialAd';
import { isNative } from '../lib/platform';

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

const categoryGradient: Record<string, string> = {
  Barbershop: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
  Salon: 'linear-gradient(135deg, #2563eb, #60a5fa)',
  'Nail Salon': 'linear-gradient(135deg, #7c3aed, #a78bfa)',
  Spa: 'linear-gradient(135deg, #0d9488, #2dd4bf)',
  Clinic: 'linear-gradient(135deg, #1e40af, #60a5fa)',
  Tattoo: 'linear-gradient(135deg, #374151, #6b7280)',
};

function isPastClosingTime(closingTime: string): boolean {
  const [h, m] = closingTime.split(':').map(Number);
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes() >= h * 60 + m;
}

function getElapsedMinutes(ts: number | null): number {
  if (!ts) return 0;
  return Math.max(0, (Date.now() - ts) / 60000);
}

export default function ShopCard({ shop, showJoinLink = false }: ShopCardProps) {
  const navigate = useNavigate();
  const native = isNative();
  const [showAd, setShowAd] = useState(false);
  const numStaff = Math.max(1, shop.numStaff || 1);
  const avgServiceMinutes = Math.max(1, shop.avgServiceMinutes || 15);
  const waitRange = shop.waitRange || 'No wait';
  const activeQueue = shop.queue.filter(t => !t.exitedAt);
  const servingPeople = activeQueue.reduce((s, t) => {
    const wave = Math.ceil((t.partySize || 1) / numStaff);
    const elapsedMinutes = getElapsedMinutes(t.servedAt);
    const isStillServing = t.servedAt && elapsedMinutes < avgServiceMinutes * wave;
    return s + (isStillServing ? Math.min(t.partySize || 1, numStaff) : 0);
  }, 0);
  const waitingPeople = activeQueue.reduce((s, t) => {
    if (!t.servedAt) return s + (t.partySize || 1);
    const wave = Math.ceil((t.partySize || 1) / numStaff);
    const elapsedMinutes = getElapsedMinutes(t.servedAt);
    const isStillServing = elapsedMinutes < avgServiceMinutes * wave;
    return s + (isStillServing ? Math.max(0, (t.partySize || 1) - numStaff) : 0);
  }, 0);
  const totalActive = servingPeople + waitingPeople;
  const hasWait = waitingPeople > 0;
  const queueLen = totalActive;
  const isOpen = shop.queueOpen !== false;
  const likelyClosed = isOpen && isPastClosingTime(shop.closingTime || '17:00');

  const handleClick = () => {
    if (!showJoinLink) return;
    if (hasSeenInterstitial()) {
      navigate(`/join/${shop.id}`);
    } else {
      setShowAd(true);
    }
  };

  if (native) {
    const statusLabel = !isOpen ? 'Closed' : likelyClosed ? 'Likely closed' : waitRange;
    const statusColor = !isOpen
      ? { dot: '#6b7280', text: 'rgba(107,114,128,0.9)', bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.2)' }
      : likelyClosed
        ? { dot: '#f97316', text: 'rgba(251,146,60,0.9)', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.22)' }
        : !hasWait
          ? { dot: '#10b981', text: 'rgba(52,211,153,0.9)', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.22)' }
          : queueLen <= 3
            ? { dot: '#f59e0b', text: 'rgba(251,191,36,0.9)', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.22)' }
            : { dot: '#ef4444', text: 'rgba(248,113,113,0.9)', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.22)' };

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
          style={{
            background: 'rgba(255,255,255,0.055)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: '18px',
            padding: '16px',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            cursor: showJoinLink ? 'pointer' : 'default',
            transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
            WebkitTapHighlightColor: 'transparent',
          }}
          onTouchStart={e => {
            if (showJoinLink) (e.currentTarget as HTMLDivElement).style.transform = 'scale(0.975)';
          }}
          onTouchEnd={e => {
            (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            {shop.logoUrl ? (
              <img
                src={shop.logoUrl}
                alt={shop.name}
                style={{ width: '44px', height: '44px', borderRadius: '14px', objectFit: 'cover', flexShrink: 0 }}
              />
            ) : (
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '14px',
                  background: categoryGradient[shop.category] || 'linear-gradient(135deg, #374151, #6b7280)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
                  {shop.name.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || shop.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3
                    style={{
                      fontSize: '15px',
                      fontWeight: 700,
                      color: '#f0f4ff',
                      letterSpacing: '-0.3px',
                      marginBottom: '3px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {shop.name}
                  </h3>
                  <p style={{ fontSize: '12px', color: 'rgba(148,163,184,0.6)', fontWeight: 500 }}>
                    {shop.category}
                    {shop.zipCode && ` · ZIP ${shop.zipCode}`}
                    {` · ~${shop.avgServiceMinutes} min`}
                  </p>
                </div>

                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    background: statusColor.bg,
                    border: `1px solid ${statusColor.border}`,
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: statusColor.dot,
                      boxShadow: `0 0 6px ${statusColor.dot}`,
                      display: 'inline-block',
                      animation: isOpen && !hasWait ? 'pulse 2s infinite' : 'none',
                    }}
                  />
                  <span style={{ fontSize: '11px', fontWeight: 700, color: statusColor.text }}>
                    {statusLabel}
                  </span>
                </div>
              </div>

              {isOpen && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'rgba(148,163,184,0.5)',
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                    {servingPeople} serving
                  </span>
                  <span style={{ opacity: 0.4 }}>·</span>
                  <span>{shop.numStaff} staff</span>
                  <span style={{ opacity: 0.4 }}>·</span>
                  <span>{waitingPeople === 0 ? 'No one waiting' : `${waitingPeople} in line`}</span>
                </div>
              )}
            </div>
          </div>

          {showJoinLink && isOpen && !likelyClosed && (
            <div
              style={{
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: '1px solid rgba(255,255,255,0.07)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '12px', color: 'rgba(148,163,184,0.5)', fontWeight: 500 }}>
                Tap to join queue
              </span>
              <span style={{ fontSize: '13px', color: '#60a5fa', fontWeight: 700 }}>
                Join →
              </span>
            </div>
          )}
        </div>
      </>
    );
  }

  const statusColor = !isOpen
    ? 'text-gray-500 bg-gray-100 border-gray-200'
    : likelyClosed
      ? 'text-orange-600 bg-orange-50 border-orange-200'
      : !hasWait
        ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
        : queueLen <= 3
          ? 'text-amber-600 bg-amber-50 border-amber-200'
          : 'text-red-600 bg-red-50 border-red-200';

  const dotColor = !isOpen ? 'bg-gray-400' : likelyClosed ? 'bg-orange-400' : !hasWait ? 'bg-emerald-500' : queueLen <= 3 ? 'bg-amber-500' : 'bg-red-500';

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
            {shop.logoUrl ? (
              <img
                src={shop.logoUrl}
                alt={shop.name}
                className="w-10 h-10 rounded-xl object-cover shrink-0 border border-gray-100"
              />
            ) : (
              <div className={`w-10 h-10 ${categoryColor[shop.category] || 'bg-gray-500'} rounded-xl flex items-center justify-center shrink-0`}>
                <span className="text-xs font-black text-white tracking-tight">
                  {shop.name.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || shop.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
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
              {!isOpen ? 'Closed' : likelyClosed ? 'Likely closed' : waitRange}
            </div>
          </div>
        </div>

        {isOpen && (
          <div className="mt-3 flex items-center gap-3 text-[11px] font-semibold text-gray-500 flex-wrap">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {servingPeople} being served
            </span>
            <span className="text-gray-300">·</span>
            <span>{shop.numStaff} staff</span>
            <span className="text-gray-300">·</span>
            <span>{waitingPeople === 0 ? 'No one waiting' : `${waitingPeople} in line`}</span>
            <span className="text-gray-300">·</span>
            <span>{waitRange} wait</span>
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
