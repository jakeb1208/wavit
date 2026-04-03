export interface Ticket {
  id: string;
  name: string;
  phone: string;
  joinedAt: number;
  servedAt: number | null;
  exitRequestedAt: number | null;
  exitedAt: number | null;
  reminderSentAt: number | null;
}

export interface Shop {
  id: string;
  name: string;
  phone: string;
  avgServiceMinutes: number;
  category: string;
  queue: Ticket[];
  currentServiceStartedAt: number | null;
}

export interface SMSNotification {
  id: string;
  message: string;
  timestamp: number;
  ticketId: string;
  type: 'approaching' | 'your_turn' | 'reminder' | 'auto_removed';
}
