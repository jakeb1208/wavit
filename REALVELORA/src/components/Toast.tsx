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

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    const timers = visible.map(id =>
      setTimeout(() => dismiss(id), 8000)
    );
    return () => timers.forEach(clearTimeout);
  }, [visible, dismiss]);

  if (visible.length === 0) return null;

  const bgMap = {
    approaching: 'bg-blue-600',
    your_turn: 'bg-emerald-600',
    reminder: 'bg-amber-600',
    auto_removed: 'bg-gray-700',
  };

  return (
    <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {filtered
        .filter(n => visible.includes(n.id))
        .map(n => (
          <div
            key={n.id}
            className={`${bgMap[n.type]} text-white px-4 py-3 rounded-xl shadow-lg text-sm animate-slide-in flex items-start gap-3`}
          >
            <div className="flex-1">
              <p className="text-xs font-medium opacity-75 mb-0.5">SMS Notification</p>
              <p>{n.message}</p>
            </div>
            <button
              onClick={() => dismiss(n.id)}
              className="text-white/70 hover:text-white shrink-0 mt-0.5"
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
