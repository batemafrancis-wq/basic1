import { create } from 'zustand';

export type TimePeriod = 'mtd' | 'ytd' | 'rolling90';
export type ActivePage = 'dashboard' | 'send-sms' | 'contacts' | 'campaigns' | 'analytics' | 'reports' | 'api' | 'settings' | 'billing';

interface DashboardState {
  timePeriod: TimePeriod;
  setTimePeriod: (period: TimePeriod) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
  hoveredMonth: string | null;
  setHoveredMonth: (month: string | null) => void;
  isChatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  isTutorialActive: boolean;
  setTutorialActive: (active: boolean) => void;
  tutorialStep: number;
  setTutorialStep: (step: number) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  notifications: Notification[];
  addNotification: (n: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  timePeriod: 'mtd',
  setTimePeriod: (period) => set({ timePeriod: period }),
  isDarkMode: false,
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  activePage: 'dashboard',
  setActivePage: (page) => set({ activePage: page }),
  hoveredMonth: null,
  setHoveredMonth: (month) => set({ hoveredMonth: month }),
  isChatOpen: false,
  setChatOpen: (open) => set({ isChatOpen: open }),
  isTutorialActive: false,
  setTutorialActive: (active) => set({ isTutorialActive: active }),
  tutorialStep: 0,
  setTutorialStep: (step) => set({ tutorialStep: step }),
  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  notifications: [],
  addNotification: (n) =>
    set((state) => ({
      notifications: [...state.notifications, { ...n, id: Math.random().toString(36).slice(2) }],
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}));
