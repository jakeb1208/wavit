import { create } from 'zustand';
import { Shop, Ticket, SMSNotification } from '../types';
import { apiFetch } from '../lib/api';

export interface ApiShop extends Shop {
  waitRange: string;
}

interface QueueStore {
  shops: ApiShop[];
  notifications: SMSNotification[];
  lastTick: number;
  loading: boolean;

  fetchShops: () => Promise<void>;
  joinQueue: (shopId: string, name: string, phone: string) => Promise<Ticket | null>;
  signOut: (shopId: string, ticketId: string) => Promise<void>;
  replyExit: (shopId: string, ticketId: string) => Promise<void>;
  getShop: (shopId: string) => ApiShop | undefined;
  getTicketFromApi: (shopId: string, ticketId: string) => Promise<{ ticket: Ticket; position: number; shop: ApiShop } | null>;
  calcWaitRange: (shop: ApiShop) => string;
  tick: () => Promise<void>;
  clearNotifications: (ticketId?: string) => void;
  addNotification: (notif: Omit<SMSNotification, 'id' | 'timestamp'>) => void;
  resetData: () => void;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function mapShopRow(row: Record<string, unknown>): ApiShop {
  return {
    id: row.id as string,
    name: row.name as string,
    phone: row.phone as string,
    avgServiceMinutes: row.avg_service_minutes as number,
    numStaff: (row.num_staff as number) || 1,
    category: row.category as string,
    zipCode: (row.zip_code as string) || null,
    currentServiceStartedAt: row.current_service_started_at ? Number(row.current_service_started_at) : null,
    queue: ((row.queue as Record<string, unknown>[]) || []).map(mapTicketRow),
    waitRange: (row.waitRange as string) || (row.wait_range as string) || 'No wait',
    queueOpen: row.queue_open !== false,
    openingTime: (row.opening_time as string) || '09:00',
    closingTime: (row.closing_time as string) || '18:00',
  };
}

function mapTicketRow(row: Record<string, unknown>): Ticket {
  return {
    id: row.id as string,
    name: row.name as string,
    phone: row.phone as string,
    joinedAt: Number(row.joined_at),
    servedAt: row.served_at ? Number(row.served_at) : null,
    exitRequestedAt: row.exit_requested_at ? Number(row.exit_requested_at) : null,
    exitedAt: row.exited_at ? Number(row.exited_at) : null,
    reminderSentAt: row.reminder_sent_at ? Number(row.reminder_sent_at) : null,
  };
}

export const useQueueStore = create<QueueStore>((set, get) => ({
  shops: [],
  notifications: [],
  lastTick: Date.now(),
  loading: false,

  fetchShops: async () => {
    try {
      const data = await apiFetch('/shops');
      const shops = data.map(mapShopRow);
      set({ shops, lastTick: Date.now() });
    } catch (err) {
      console.error('Failed to fetch shops:', err);
    }
  },

  tick: async () => {
    await get().fetchShops();
  },

  joinQueue: async (shopId, name, phone) => {
    try {
      const ticket = await apiFetch('/tickets', {
        method: 'POST',
        body: JSON.stringify({ shopId, name, phone }),
      });
      await get().fetchShops();
      return mapTicketRow(ticket);
    } catch (err) {
      console.error('Join queue error:', err);
      return null;
    }
  },

  signOut: async (shopId, ticketId) => {
    try {
      await apiFetch(`/tickets/${shopId}/${ticketId}`, { method: 'DELETE' });
      await get().fetchShops();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  },

  replyExit: async (shopId, ticketId) => {
    await get().signOut(shopId, ticketId);
    get().addNotification({
      ticketId,
      message: `You've been removed from the queue.`,
      type: 'auto_removed',
    });
  },

  getShop: (shopId) => {
    return get().shops.find(s => s.id === shopId);
  },

  getTicketFromApi: async (shopId, ticketId) => {
    try {
      const data = await apiFetch(`/tickets/${shopId}/${ticketId}`);
      if (!data.ticket) return null;
      return {
        ticket: mapTicketRow(data.ticket),
        position: data.position,
        shop: mapShopRow(data.shop),
      };
    } catch {
      return null;
    }
  },

  calcWaitRange: (shop) => {
    return shop.waitRange || 'No wait';
  },

  addNotification: (notif) => {
    const newNotif: SMSNotification = {
      ...notif,
      id: generateId(),
      timestamp: Date.now(),
    };
    const notifications = [newNotif, ...get().notifications].slice(0, 50);
    set({ notifications });
  },

  clearNotifications: (ticketId) => {
    const notifications = ticketId
      ? get().notifications.filter(n => n.ticketId !== ticketId)
      : [];
    set({ notifications });
  },

  resetData: () => {
    set({ notifications: [] });
  },
}));
