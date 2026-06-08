import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiShop } from '../store/queueStore';
import InterstitialAd, { hasSeenInterstitial } from './InterstitialAd';
import { isNative } from '../lib/platform';
import { computeNextJoinerWaitMinutes, formatWaitRange } from '../lib/waitTime';

interface ShopCardProps {
  shop: ApiShop;
  showJoinLink?: boolean;
}

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
  const isClinic = shop.category === 'Clinic';
  const [showAd, setShowAd] = useState(false);
  const numStaff = Math.max(1, shop.numStaff || 1);
  const avgServiceMinutes = Math.max(1, shop.avgServiceMinutes || 15);
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

  const waitBaseMinutes = computeNextJoinerWaitMinutes(shop);
  const waitRange = formatWaitRange(waitBaseMinutes);

  const handleClick = () => {
    if (!showJoinLink) return;
    if (isClinic) return;
    if (hasSeenInterstitial()) {
      navigate(`/join/${shop.id}`);
    } else {
      setShowAd(true);
    }
  };

  if (native) {
    const statusLabel = !isOpen ? 'Closed' : likelyClosed ? 'Likely closed' : isClinic ? (waitingPeople > 0 ? `${waitingPeople} waiting` : 'Open') : waitRange;
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
            cursor: showJoinLink && !isClinic ? 'pointer' : 'default',
            transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
            WebkitTapHighlightColor: 'transparent',
          }}
          onTouchStart={e => {
            if (showJoinLink && !isClinic) (e.currentTarget as HTMLDivElement).style.transform = 'scale(0.975)';
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
                    {isClinic ? 'Clinic' : shop.category}
                    {shop.zipCode && ` · ZIP ${shop.zipCode}`}
                    {!isClinic && ` · ~${shop.avgServiceMinutes} min`}
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
                <div style={{ display: 'flex', gap: '5px', marginTop: '9px', flexWrap: 'wrap' }}>
                  {!isClinic && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '3px',
                      padding: '3px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 700,
                      background: waitBaseMinutes === 0 ? 'rgba(16,185,129,0.13)' : 'rgba(59,130,246,0.12)',
                      border: waitBaseMinutes === 0 ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(59,130,246,0.2)',
                      color: waitBaseMinutes === 0 ? '#34d399' : '#93c5fd',
                    }}>
                      <svg style={{ width: '9px', height: '9px', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" strokeWidth="2"/><path strokeLinecap="round" strokeWidth="2" d="M12 6v6l4 2"/>
                      </svg>
                      {waitRange}
                    </span>
                  )}
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '3px',
                    padding: '3px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 700,
                    background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: '#a78bfa',
                  }}>
                    <svg style={{ width: '9px', height: '9px', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeWidth="2" d="M17 20H7m10-8a3 3 0 11-6 0 3 3 0 016 0zM3 20a9 9 0 0118 0"/>
                    </svg>
                    {numStaff} {isClinic ? 'doctors' : 'staff'}
                  </span>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '3px',
                    padding: '3px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 700,
                    background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#fbbf24',
                  }}>
                    <svg style={{ width: '9px', height: '9px', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h10"/>
                    </svg>
                    {waitingPeople} waiting
                  </span>
                  {!isClinic && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '3px',
                      padding: '3px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 700,
                      background: servingPeople > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(107,114,128,0.08)',
                      border: servingPeople > 0 ? '1px solid rgba(16,185,129,0.22)' : '1px solid rgba(107,114,128,0.15)',
                      color: servingPeople > 0 ? '#34d399' : 'rgba(148,163,184,0.4)',
                    }}>
                      <svg style={{ width: '9px', height: '9px', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/>
                      </svg>
                      {servingPeople} serving
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {isClinic && isOpen && (shop.address || shop.phone) && (
            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {shop.address && (
                <span style={{ fontSize: '11px', color: 'rgba(148,163,184,0.55)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <svg style={{ width: '10px', height: '10px', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  {shop.address}
                </span>
              )}
              {shop.phone && (
                <span style={{ fontSize: '11px', color: 'rgba(148,163,184,0.55)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <svg style={{ width: '10px', height: '10px', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                  {shop.phone}
                </span>
              )}
            </div>
          )}

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
              {isClinic ? (
                <span style={{ fontSize: '12px', color: 'rgba(251,146,60,0.8)', fontWeight: 600 }}>
                  🏥 Requires check in at clinic to join
                </span>
              ) : (
                <>
                  <span style={{ fontSize: '12px', color: 'rgba(148,163,184,0.5)', fontWeight: 500 }}>
                    {shop.allowRemoteJoin === false ? 'Requires QR code at store' : 'Tap to join queue'}
                  </span>
                  <span style={{ fontSize: '13px', color: '#60a5fa', fontWeight: 700 }}>
                    {shop.allowRemoteJoin === false ? 'Join with QR →' : 'Join →'}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </>
    );
  }

  const webStatus = !isOpen
    ? { dot: '#6b7280', text: 'rgba(148,163,184,0.7)', bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.2)', label: 'Closed' }
    : likelyClosed
      ? { dot: '#f97316', text: 'rgba(251,146,60,0.9)', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.22)', label: 'Likely closed' }
      : !hasWait
        ? { dot: '#10b981', text: 'rgba(52,211,153,0.9)', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.22)', label: isClinic ? 'Open' : waitRange }
        : queueLen <= 3
          ? { dot: '#f59e0b', text: 'rgba(251,191,36,0.9)', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.22)', label: isClinic ? `${waitingPeople} waiting` : waitRange }
          : { dot: '#ef4444', text: 'rgba(248,113,113,0.9)', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.22)', label: isClinic ? `${waitingPeople} waiting` : waitRange };

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
          padding: '20px',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          cursor: showJoinLink && !isClinic ? 'pointer' : 'default',
          transition: 'all 0.2s',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
        onMouseEnter={e => {
          if (showJoinLink && !isClinic) {
            (e.currentTarget as HTMLElement).style.border = '1px solid rgba(96,165,250,0.4)';
            (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
            (e.currentTarget as HTMLElement).style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 24px rgba(59,130,246,0.15)';
          }
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.border = '1px solid rgba(255,255,255,0.09)';
          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
          (e.currentTarget as HTMLElement).style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.06)';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, minWidth: 0 }}>
            {shop.logoUrl ? (
              <img src={shop.logoUrl} alt={shop.name} style={{ width: '44px', height: '44px', borderRadius: '14px', objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: categoryGradient[shop.category] || 'linear-gradient(135deg, #374151, #6b7280)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                <span style={{ fontSize: '13px', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
                  {shop.name.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || shop.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f0f4ff', letterSpacing: '-0.3px', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {shop.name}
              </h3>
              <p style={{ fontSize: '12px', color: 'rgba(148,163,184,0.6)', fontWeight: 500 }}>
                {isClinic ? 'Clinic' : shop.category}{shop.zipCode && ` · ZIP ${shop.zipCode}`}{!isClinic && ` · ~${shop.avgServiceMinutes} min`}
              </p>
            </div>
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', background: webStatus.bg, border: `1px solid ${webStatus.border}`, flexShrink: 0 }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: webStatus.dot, boxShadow: `0 0 6px ${webStatus.dot}`, display: 'inline-block' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: webStatus.text }}>{webStatus.label}</span>
          </div>
        </div>

        {isOpen && (
          <div style={{ display: 'flex', gap: '5px', marginTop: '10px', flexWrap: 'wrap' as const }}>
            {!isClinic && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '3px',
                padding: '3px 9px', borderRadius: '8px', fontSize: '10px', fontWeight: 700,
                background: waitBaseMinutes === 0 ? 'rgba(16,185,129,0.13)' : 'rgba(59,130,246,0.12)',
                border: waitBaseMinutes === 0 ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(59,130,246,0.2)',
                color: waitBaseMinutes === 0 ? '#34d399' : '#93c5fd',
              }}>
                <svg style={{ width: '9px', height: '9px', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth="2"/><path strokeLinecap="round" strokeWidth="2" d="M12 6v6l4 2"/>
                </svg>
                {waitRange}
              </span>
            )}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '3px',
              padding: '3px 9px', borderRadius: '8px', fontSize: '10px', fontWeight: 700,
              background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: '#a78bfa',
            }}>
              <svg style={{ width: '9px', height: '9px', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeWidth="2" d="M17 20H7m10-8a3 3 0 11-6 0 3 3 0 016 0zM3 20a9 9 0 0118 0"/>
              </svg>
              {numStaff} {isClinic ? 'doctors' : 'staff'}
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '3px',
              padding: '3px 9px', borderRadius: '8px', fontSize: '10px', fontWeight: 700,
              background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#fbbf24',
            }}>
              <svg style={{ width: '9px', height: '9px', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h10"/>
              </svg>
              {waitingPeople} waiting
            </span>
            {!isClinic && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '3px',
                padding: '3px 9px', borderRadius: '8px', fontSize: '10px', fontWeight: 700,
                background: servingPeople > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(107,114,128,0.08)',
                border: servingPeople > 0 ? '1px solid rgba(16,185,129,0.22)' : '1px solid rgba(107,114,128,0.15)',
                color: servingPeople > 0 ? '#34d399' : 'rgba(148,163,184,0.4)',
              }}>
                <svg style={{ width: '9px', height: '9px', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/>
                </svg>
                {servingPeople} serving
              </span>
            )}
          </div>
        )}

        {isClinic && isOpen && (shop.address || shop.phone) && (
          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {shop.address && (
              <span style={{ fontSize: '11px', color: 'rgba(148,163,184,0.5)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg style={{ width: '10px', height: '10px', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                {shop.address}
              </span>
            )}
            {shop.phone && (
              <span style={{ fontSize: '11px', color: 'rgba(148,163,184,0.5)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg style={{ width: '10px', height: '10px', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                {shop.phone}
              </span>
            )}
          </div>
        )}

        {showJoinLink && isOpen && !likelyClosed && (
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {isClinic ? (
              <span style={{ fontSize: '12px', color: 'rgba(251,146,60,0.8)', fontWeight: 600 }}>
                🏥 Requires check in at clinic to join
              </span>
            ) : (
              <>
                <span style={{ fontSize: '12px', color: 'rgba(148,163,184,0.45)', fontWeight: 500 }}>
                  {shop.allowRemoteJoin === false ? 'Requires QR code at store' : 'Click to join queue'}
                </span>
                <span style={{ fontSize: '13px', color: '#60a5fa', fontWeight: 700 }}>
                  {shop.allowRemoteJoin === false ? 'Join with QR →' : 'Join →'}
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
