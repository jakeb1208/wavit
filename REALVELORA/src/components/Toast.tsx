import { useEffect, useState, useCallback } from 'react';
import { useQueueStore } from '../store/queueStore';

export default function ToastContainer({ ticketId }: { ticketId?: string }) {
  const notifications = useQueueStore(s => s.notifications);
  const clearNotifications = useQueueStore(s => s.clearNotifications);
  const [visible, setVisible] = useState<string[]>([]);

  const filtered = ticketId
    ? notifications.filter(n => n.ticketId === ticketId)
    : notifications;

  const dismiss = useCallback((id: string) => {
    setVisible(prev => prev.filter(v => v !== id));
    clearNotifications(id);
  }, [clearNotifications]);

  useEffect(() => {
    const newNotifs = filtered.filter(n => !visible.includes(n.id));
    if (newNotifs.length > 0) {
      setVisible(prev => [...newNotifs.map(n => n.id), ...prev]);
    }
  }, [filtered, visible]);

  useEffect(() => {
    const timers = visible.map(id =>
      setTimeout(() => dismiss(id), 8000)
    );
    return () => timers.forEach(clearTimeout);
  }, [visible, dismiss]);

  if (visible.length === 0) return null;

  const styles: Record<string, string> = {
    approaching: 'bg-violet-700 border-violet-500',
    your_turn: 'bg-emerald-600 border-emerald-400',
    reminder: 'bg-amber-600 border-amber-400',
    auto_removed: 'bg-gray-700 border-gray-500',
  };

  const icons: Record<string, JSX.Element> = {
    approaching: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    your_turn: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    reminder: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    auto_removed: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div className="fixed top-16 sm:top-20 right-3 sm:right-4 z-[100] flex flex-col gap-2 w-[calc(100vw-24px)] sm:max-w-sm">
      {filtered
        .filter(n => visible.includes(n.id))
        .map(n => (
          <div
            key={n.id}
            className={`${styles[n.type] || 'bg-gray-700 border-gray-500'} border text-white px-4 py-3 rounded-2xl shadow-lg text-sm animate-slide-in flex items-start gap-3`}
          >
            <div className="w-7 h-7 bg-white/15 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
              {icons[n.type]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-0.5">Wavit Alert</p>
              <p className="text-sm leading-snug">{n.message}</p>
            </div>
            <button
              onClick={() => dismiss(n.id)}
              className="text-white/50 hover:text-white shrink-0 mt-0.5 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
    </div>
  );
}
