import { create } from 'zustand';
import {
  mtdData, ytdData, rolling90Data,
  recentCampaigns as seedCampaigns,
  contacts as seedContacts,
} from '../data/mockData';

export type TimePeriod = 'mtd' | 'ytd' | 'rolling90';
export type ActivePage =
  | 'dashboard' | 'send-sms' | 'contacts' | 'campaigns'
  | 'analytics' | 'reports' | 'api' | 'settings' | 'billing';

// ── Domain types ──────────────────────────────────────────────────────────────

export interface Contact {
  id: number;
  name: string;
  phone: string;
  group: string;
  added: string;
  network: string;
}

export interface Campaign {
  id: number;
  name: string;
  sent: number;
  delivered: number;
  rate: number;
  status: 'completed' | 'running' | 'scheduled' | 'paused';
  date: string;
  sender: string;
}

export interface Transaction {
  id: string;
  type: 'topup' | 'usage' | 'failed';
  method: string;
  amount: number;   // positive = credit, negative = debit (UGX)
  credits: number;  // positive = gained, negative = used
  date: string;
  status: 'success' | 'failed' | 'pending';
}

export interface SmsStats {
  sent: number;
  delivered: number;
  failed: number;
  deliveryRate: number;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  action?: { label: string; onClick: () => void };
}

// ── AI Notification (rich — bell panel) ───────────────────────────────────────
export interface AppNotification {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success' | 'prediction';
  category: 'balance' | 'delivery' | 'campaign' | 'contacts' | 'api' | 'system' | 'billing';
  title: string;
  summary: string;       // one-liner shown in panel list
  cause: string;         // why this happened
  prediction: string;    // what will happen if ignored
  solution: string;      // recommended action
  read: boolean;
  timestamp: Date;
  actionLabel?: string;
  actionPage?: ActivePage;
}

// ── Store interface ───────────────────────────────────────────────────────────

interface DashboardState {
  // UI
  timePeriod: TimePeriod;
  setTimePeriod: (p: TimePeriod) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  activePage: ActivePage;
  setActivePage: (p: ActivePage) => void;
  hoveredMonth: string | null;
  setHoveredMonth: (m: string | null) => void;
  isChatOpen: boolean;
  setChatOpen: (o: boolean) => void;
  isTutorialActive: boolean;
  setTutorialActive: (a: boolean) => void;
  tutorialStep: number;
  setTutorialStep: (s: number) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (c: boolean) => void;

  // Toasts
  notifications: Notification[];
  addNotification: (n: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;

  // ── AI Notifications (bell panel) ───────────────────────────────────────
  appNotifications: AppNotification[];
  addAppNotification: (n: Omit<AppNotification, 'id' | 'read' | 'timestamp'>) => void;
  markAppNotificationRead: (id: string) => void;
  markAllAppNotificationsRead: () => void;
  dismissAppNotification: (id: string) => void;
  clearAllAppNotifications: () => void;
  isNotificationPanelOpen: boolean;
  setNotificationPanelOpen: (open: boolean) => void;

  // ── LIVE DATA ────────────────────────────────────────────────

  // Balance & credits
  balanceUGX: number;
  smsCredits: number;
  addCredits: (ugx: number, credits: number) => void;
  deductCredits: (credits: number) => void;

  // Contacts
  contacts: Contact[];
  addContact: (c: Omit<Contact, 'id'>) => void;
  deleteContact: (id: number) => void;
  updateContact: (id: number, patch: Partial<Contact>) => void;

  // Campaigns
  campaigns: Campaign[];
  addCampaign: (c: Omit<Campaign, 'id'>) => void;
  updateCampaign: (id: number, patch: Partial<Campaign>) => void;

  // Transactions
  transactions: Transaction[];
  addTransaction: (t: Omit<Transaction, 'id'>) => void;

  // SMS stats (derived from chart data, but kept reactive)
  smsStats: SmsStats;
  updateSmsStats: (patch: Partial<SmsStats>) => void;

  // Chart data slices (driven by timePeriod)
  chartData: typeof mtdData;

  // Feedback / rating
  pendingRating: { activityLabel: string; onRate: (stars: number, comment: string) => void } | null;
  requestRating: (activityLabel: string, onRate: (stars: number, comment: string) => void) => void;
  clearRating: () => void;

  // User profile (persisted in store so Settings + Sidebar stay in sync)
  userProfile: {
    name: string; email: string; phone: string;
    company: string; website: string; timezone: string;
  };
  updateUserProfile: (patch: Partial<DashboardState['userProfile']>) => void;
}

// ── Seed transactions ─────────────────────────────────────────────────────────
const seedTransactions: Transaction[] = [
  { id: 'TXN-8821', type: 'topup', method: 'MTN Mobile Money', amount: 100000, credits: 2000, date: 'Oct 20, 2024', status: 'success' },
  { id: 'TXN-8820', type: 'usage', method: 'Campaign: Q4 Promo', amount: -108400, credits: -5420, date: 'Oct 28, 2024', status: 'success' },
  { id: 'TXN-8819', type: 'topup', method: 'Visa Card ····4242', amount: 200000, credits: 4000, date: 'Oct 15, 2024', status: 'success' },
  { id: 'TXN-8818', type: 'usage', method: 'Campaign: Newsletter', amount: -64000, credits: -3200, date: 'Oct 25, 2024', status: 'success' },
  { id: 'TXN-8817', type: 'topup', method: 'Airtel Money', amount: 50000, credits: 1000, date: 'Oct 10, 2024', status: 'success' },
  { id: 'TXN-8816', type: 'usage', method: 'API Usage', amount: -12000, credits: -600, date: 'Oct 8, 2024', status: 'success' },
  { id: 'TXN-8815', type: 'topup', method: 'Bank Transfer', amount: 500000, credits: 10000, date: 'Sep 30, 2024', status: 'success' },
  { id: 'TXN-8814', type: 'failed', method: 'Visa Card ····1234', amount: 100000, credits: 0, date: 'Sep 25, 2024', status: 'failed' },
];

// ── Store ─────────────────────────────────────────────────────────────────────

export const useDashboardStore = create<DashboardState>((set, get) => ({
  // UI defaults
  timePeriod: 'mtd',
  setTimePeriod: (timePeriod) => set({ timePeriod, chartData: timePeriod === 'mtd' ? mtdData : timePeriod === 'ytd' ? ytdData : rolling90Data }),
  isDarkMode: false,
  toggleDarkMode: () => set((s) => ({ isDarkMode: !s.isDarkMode })),
  activePage: 'dashboard',
  setActivePage: (activePage) => set({ activePage }),
  hoveredMonth: null,
  setHoveredMonth: (hoveredMonth) => set({ hoveredMonth }),
  isChatOpen: false,
  setChatOpen: (isChatOpen) => set({ isChatOpen }),
  isTutorialActive: false,
  setTutorialActive: (isTutorialActive) => set({ isTutorialActive }),
  tutorialStep: 0,
  setTutorialStep: (tutorialStep) => set({ tutorialStep }),
  sidebarCollapsed: false,
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),

  // Toasts
  notifications: [],
  addNotification: (n) =>
    set((s) => ({
      notifications: [
        ...s.notifications,
        { ...n, id: Math.random().toString(36).slice(2) },
      ],
    })),
  removeNotification: (id) =>
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),

  // AI Notifications
  appNotifications: [],
  addAppNotification: (n) =>
    set((s) => ({
      appNotifications: [
        {
          ...n,
          id: Math.random().toString(36).slice(2),
          read: false,
          timestamp: new Date(),
        },
        ...s.appNotifications,
      ].slice(0, 50), // keep latest 50
    })),
  markAppNotificationRead: (id) =>
    set((s) => ({
      appNotifications: s.appNotifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),
  markAllAppNotificationsRead: () =>
    set((s) => ({
      appNotifications: s.appNotifications.map((n) => ({ ...n, read: true })),
    })),
  dismissAppNotification: (id) =>
    set((s) => ({
      appNotifications: s.appNotifications.filter((n) => n.id !== id),
    })),
  clearAllAppNotifications: () => set({ appNotifications: [] }),
  isNotificationPanelOpen: false,
  setNotificationPanelOpen: (open) => set({ isNotificationPanelOpen: open }),

  // Balance
  balanceUGX: 245000,
  smsCredits: 4900,
  addCredits: (ugx, credits) =>
    set((s) => ({ balanceUGX: s.balanceUGX + ugx, smsCredits: s.smsCredits + credits })),
  deductCredits: (credits) =>
    set((s) => ({
      smsCredits: Math.max(0, s.smsCredits - credits),
      balanceUGX: Math.max(0, s.balanceUGX - credits * 20),
    })),

  // Contacts
  contacts: seedContacts,
  addContact: (c) =>
    set((s) => {
      const id = s.contacts.length > 0 ? Math.max(...s.contacts.map((x) => x.id)) + 1 : 1;
      return { contacts: [...s.contacts, { ...c, id }] };
    }),
  deleteContact: (id) =>
    set((s) => ({ contacts: s.contacts.filter((c) => c.id !== id) })),
  updateContact: (id, patch) =>
    set((s) => ({ contacts: s.contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),

  // Campaigns
  campaigns: seedCampaigns,
  addCampaign: (c) =>
    set((s) => {
      const id = s.campaigns.length > 0 ? Math.max(...s.campaigns.map((x) => x.id)) + 1 : 1;
      return { campaigns: [...s.campaigns, { ...c, id }] };
    }),
  updateCampaign: (id, patch) =>
    set((s) => ({ campaigns: s.campaigns.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),

  // Transactions
  transactions: seedTransactions,
  addTransaction: (t) =>
    set((s) => ({
      transactions: [{ ...t, id: `TXN-${8822 + s.transactions.length}` }, ...s.transactions],
    })),

  // SMS stats
  smsStats: { sent: 15700, delivered: 14920, failed: 780, deliveryRate: 95.05 },
  updateSmsStats: (patch) =>
    set((s) => ({ smsStats: { ...s.smsStats, ...patch } })),

  // Chart data
  chartData: mtdData,

  // Rating / feedback
  pendingRating: null,
  requestRating: (activityLabel, onRate) => set({ pendingRating: { activityLabel, onRate } }),
  clearRating: () => set({ pendingRating: null }),

  // User profile
  userProfile: {
    name: 'John Mukasa',
    email: 'john.mukasa@pahappa.com',
    phone: '+256 701 234 567',
    company: 'Pahappa Limited',
    website: 'https://pahappa.com',
    timezone: 'Africa/Kampala',
  },
  updateUserProfile: (patch) =>
    set((s) => ({ userProfile: { ...s.userProfile, ...patch } })),
}));
