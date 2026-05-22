import { useState, useEffect, useRef } from 'react';
import { useQueueStore } from '../store/queueStore';

export default function LiveRefreshBadge() {
  const lastTick = useQueueStore(s => s.lastTick);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [justRefreshed, setJustRefreshed] = useState(false);
  const prevTickRef = useRef(lastTick);

  useEffect(() => {
    setSecondsAgo(Math.floor((Date.now() - lastTick) / 1000));
    const iv = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastTick) / 1000));
    }, 1000);
    return () => clearInterval(iv);
  }, [lastTick]);

  useEffect(() => {
    if (lastTick !== prevTickRef.current) {
      prevTickRef.current = lastTick;
      setJustRefreshed(true);
      const t = setTimeout(() => setJustRefreshed(false), 2000);
      return () => clearTimeout(t);
    }
  }, [lastTick]);

  const label = secondsAgo < 5 ? 'just now' : `${secondsAgo}s ago`;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        fontSize: '11px',
        fontWeight: 600,
        color: justRefreshed ? 'rgba(52,211,153,0.9)' : 'rgba(148,163,184,0.45)',
        transition: 'color 0.5s ease',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: justRefreshed ? '#34d399' : 'rgba(148,163,184,0.3)',
          boxShadow: justRefreshed ? '0 0 8px #34d399' : 'none',
          display: 'inline-block',
          flexShrink: 0,
          transition: 'background 0.3s ease, box-shadow 0.3s ease',
        }}
      />
      Updated {label}
    </span>
  );
}
