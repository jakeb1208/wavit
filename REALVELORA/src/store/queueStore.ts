import { create } from 'zustand';
import { Shop, Ticket, SMSNotification } from '../types';
import { initialShops } from '../data/shops';

const STORAGE_KEY = 'velora_shops';
const NOTIFICATIONS_KEY = 'velora_notifications';

function loadShops(): Shop[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return initialShops;
}

function saveShops(shops: Shop[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shops));
}

function loadNotifications(): SMSNotification[] {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function saveNotifications(notifs: SMSNotification[]) {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifs));
}

interface QueueStore {
  shops: Shop[];
  notifications: SMSNotification[];
  lastTick: number;

  // Actions
  joinQueue: (shopId: string, name: string, phone: string) => Ticket | null;
  signOut: (shopId: string, ticketId: string) => void;
  replyExit: (shopId: string, ticketId: string) => void;
  getShop: (shopId: string) => Shop | undefined;
  getTicket: (shopId: string, ticketId: string) => { ticket: Ticket; position: number; shop: Shop } | null;
  calcWaitRange: (shop: Shop) => string;
  tick: () => void;
  clearNotifications: (ticketId?: string) => void;
  addNotification: (notif: Omit<SMSNotification, 'id' | 'timestamp'>) => void;
  resetData: () => void;
}

function generateTicketId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export const useQueueStore = create<QueueStore>((set, get) => ({
  shops: loadShops(),
  notifications: loadNotifications(),
  lastTick: Date.now(),

  joinQueue: (shopId, name, phone) => {
    const shops = [...get().shops];
    const shop = shops.find(s => s.id === shopId);
    if (!shop) return null;

    const ticket: Ticket = {
      id: generateTicketId(),
      name: name.trim(),
      phone: phone.trim(),
      joinedAt: Date.now(),
      servedAt: null,
      exitRequestedAt: null,
      exitedAt: null,
      reminderSentAt: null,
    };

    shop.queue.push(ticket);
    set({ shops });
    saveShops(shops);

    return ticket;
  },

  signOut: (shopId, ticketId) => {
    const shops = [...get().shops];
    const shop = shops.find(s => s.id === shopId);
    if (!shop) return;

    const ticket = shop.queue.find(t => t.id === ticketId);
    if (!ticket || ticket.exitedAt) return;

    ticket.exitedAt = Date.now();
    set({ shops });
    saveShops(shops);
  },

  replyExit: (shopId, ticketId) => {
    get().signOut(shopId, ticketId);
    get().addNotification({
      ticketId,
      message: `You replied EXIT. You've been removed from the queue.`,
      type: 'auto_removed',
    });
  },

  getShop: (shopId) => {
    return get().shops.find(s => s.id === shopId);
  },

  getTicket: (shopId, ticketId) => {
    const shop = get().shops.find(s => s.id === shopId);
    if (!shop) return null;

    const activeQueue = shop.queue.filter(t => !t.exitedAt);
    const ticket = shop.queue.find(t => t.id === ticketId);
    if (!ticket) return null;

    const position = activeQueue.findIndex(t => t.id === ticketId) + 1;
    if (position === 0) return null; // not in active queue

    return { ticket, position, shop };
  },

  calcWaitRange: (shop) => {
    const activeQueue = shop.queue.filter(t => !t.exitedAt && !t.servedAt);
    const queueLen = activeQueue.length;

    if (queueLen === 0 && shop.currentServiceStartedAt) {
      // Someone being served, wait until they're done
      const elapsed = Date.now() - shop.currentServiceStartedAt;
      const remaining = Math.max(0, (shop.avgServiceMinutes * 60 * 1000) - elapsed);
      return `~${Math.ceil(remaining / 60000)} min`;
    }
    if (queueLen === 0) return 'No wait';

    const avg = shop.avgServiceMinutes * 60 * 1000; // in ms
    let totalWait = 0;

    if (shop.currentServiceStartedAt) {
      const elapsed = Date.now() - shop.currentServiceStartedAt;
      totalWait = Math.max(0, avg - elapsed);
      totalWait += avg * (queueLen - 1);
    } else {
      totalWait = avg * queueLen;
    }

    const est = totalWait / 60000;
    const min = Math.max(0, Math.round(est * 0.8));
    const max = Math.round(est * 1.2);
    return `${min}–${max} min`;
  },

  tick: () => {
    const now = Date.now();
    const shops = get().shops.map(shop => {
      const updated = { ...shop, queue: [...shop.queue] };

      // Filter out exited tickets (fully clean them after auto-remove timeout)
      // We keep them for a bit for display purposes

      const activeQueue = updated.queue.filter(t => !t.exitedAt);
      const servingQueue = updated.queue.filter(t => t.servedAt && !t.exitedAt);

      // Start serving the next person if nobody is being served and queue has people
      if (activeQueue.length > 0 && servingQueue.length === 0) {
        const next = activeQueue[0];
        if (!next.servedAt) {
          next.servedAt = now;
          updated.currentServiceStartedAt = now;

          // Send "your turn" SMS notification
          get().addNotification({
            ticketId: next.id,
            message: `🎉 ${next.name}, it's your turn at ${updated.name}! Please head to the storefront now.`,
            type: 'your_turn',
          });
        }
      }

      // Check if the current person being served is done
      if (updated.currentServiceStartedAt) {
        const serviceTime = updated.avgServiceMinutes * 60 * 1000;
        const elapsed = now - updated.currentServiceStartedAt;

        if (elapsed >= serviceTime) {
          // Person is done being served
          const serving = updated.queue.find(
            t => t.servedAt && !t.exitedAt && t.id === servingQueue[0]?.id
          );
          if (serving) {
            // They haven't signed out yet
            // Check if we need to send reminder (7 min after service ended)
            const servedFor = elapsed - serviceTime;
            if (servedFor >= 7 * 60 * 1000 && !serving.reminderSentAt) {
              serving.reminderSentAt = now;
              get().addNotification({
                ticketId: serving.id,
                message: `⏰ ${serving.name}, have you finished at ${updated.name}? Reply EXIT to leave the queue, or you'll be automatically removed in 10 minutes.`,
                type: 'reminder',
              });
            }

            // Auto-remove after 17 minutes past service end (7 + 10)
            if (servedFor >= 17 * 60 * 1000) {
              serving.exitedAt = now;
              get().addNotification({
                ticketId: serving.id,
                message: `${serving.name}, you've been automatically removed from the queue at ${updated.name}. Thank you for visiting!`,
                type: 'auto_removed',
              });
            }
          }

          // Start serving next person if done person is exited
          const nextActive = updated.queue.filter(
            t => !t.exitedAt && !t.servedAt
          );
          if (nextActive.length > 0 && serving?.exitedAt) {
            updated.currentServiceStartedAt = null;
          }
        } else {
          // Still being served — check if we should send approaching notification
          // Send to the NEXT person in line (position 2) when current service is 80% done
          const progress = elapsed / serviceTime;
          const nextUp = updated.queue.filter(t => !t.exitedAt && !t.servedAt);
          if (nextUp.length > 0 && progress >= 0.8) {
            const nextPerson = nextUp[0];
            // Only send once (check if approaching notification already sent)
            const notifs = get().notifications;
            const alreadySent = notifs.some(
              n => n.ticketId === nextPerson.id && n.type === 'approaching'
            );
            if (!alreadySent) {
              get().addNotification({
                ticketId: nextPerson.id,
                message: `📍 ${nextPerson.name}, you're next at ${updated.name}! Get ready to head over.`,
                type: 'approaching',
              });
            }
          }
        }
      }

      return updated;
    });

    set({ shops, lastTick: now });
    saveShops(shops);
  },

  addNotification: (notif) => {
    const newNotif: SMSNotification = {
      ...notif,
      id: generateTicketId(),
      timestamp: Date.now(),
    };
    const notifications = [newNotif, ...get().notifications].slice(0, 50);
    set({ notifications });
    saveNotifications(notifications);
  },

  clearNotifications: (ticketId) => {
    const notifications = ticketId
      ? get().notifications.filter(n => n.ticketId !== ticketId)
      : [];
    set({ notifications });
    saveNotifications(notifications);
  },

  resetData: () => {
    set({ shops: initialShops, notifications: [] });
    saveShops(initialShops);
    saveNotifications([]);
  },
}));
