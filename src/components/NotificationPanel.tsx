import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  X, Bell, CheckCheck, Trash2, ChevronRight, AlertTriangle,
  TrendingDown, Cpu, Users, CreditCard, Megaphone, Wifi,
  CheckCircle2, Info, Sparkles, Clock,
} from 'lucide-react';
import { useDashboardStore, AppNotification } from '../store/dashboardStore';

// ── Visual config per notification type ──────────────────────────────────────
const TYPE_CFG = {
  critical: { border: 'border-l-red-500', icon: AlertTriangle, iconCls: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', badge: 'bg-red-500 text-white', dot: 'bg-red-500' },
  warning: { border: 'border-l-amber-500', icon: AlertTriangle, iconCls: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', badge: 'bg-amber-500 text-white', dot: 'bg-amber-500' },
  info: { border: 'border-l-[#2563EB]', icon: Info, iconCls: 'text-[#2563EB]', bg: 'bg-blue-50 dark:bg-blue-900/20', badge: 'bg-blue-500 text-white', dot: 'bg-blue-500' },
  success: { border: 'border-l-[#10B981]', icon: CheckCircle2, iconCls: 'text-[#10B981]', bg: 'bg-green-50 dark:bg-green-900/20', badge: 'bg-emerald-500 text-white', dot: 'bg-emerald-500' },
  prediction: { border: 'border-l-violet-500', icon: Sparkles, iconCls: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20', badge: 'bg-violet-500 text-white', dot: 'bg-violet-500' },
} as const;

const CATEGORY_ICON = {
  balance: CreditCard,
  delivery: TrendingDown,
  campaign: Megaphone,
  contacts: Users,
  api: Wifi,
  system: Cpu,
  billing: CreditCard,
} as const;

function timeAgo(date: Date): string {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ── Single expanded card ──────────────────────────────────────────────────────
function NotifCard({ n, isDark, expanded, onToggle }: {
  n: AppNotification;
  isDark: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const cfg = TYPE_CFG[n.type];
  const CatIcon = CATEGORY_ICON[n.category] ?? Info;

  const { markAppNotificationRead, dismissAppNotification, setActivePage, setNotificationPanelOpen } = useDashboardStore();

  const handleAction = () => {
    if (n.actionPage) {
      setActivePage(n.actionPage);
      setNotificationPanelOpen(false);
    }
    markAppNotificationRead(n.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24, height: 0, marginBottom: 0 }}
      transition={{ type: 'spring', stiffness: 340, damping: 28 }}
      className={`border-l-4 rounded-xl overflow-hidden ${cfg.border} ${n.read
        ? isDark ? 'bg-slate-800/40 border border-slate-700/40' : 'bg-slate-50/80 border border-slate-100'
        : isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200 shadow-sm'
        }`}
    >
      {/* ── Header row ── */}
      <button
        onClick={() => { onToggle(); if (!n.read) markAppNotificationRead(n.id); }}
        className="w-full text-left px-4 py-3 flex items-start gap-3"
      >
        {/* Category icon */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.bg}`}>
          <CatIcon className={`w-4 h-4 ${cfg.iconCls}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {!n.read && <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot} animate-pulse`} />}
            <span className={`text-xs font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {n.title}
            </span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${cfg.badge}`}>
              {n.type}
            </span>
          </div>
          <p className={`text-[11px] mt-0.5 leading-relaxed line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {n.summary}
          </p>
          <div className={`flex items-center gap-1.5 mt-1 text-[10px] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
            <Clock className="w-3 h-3" />
            {timeAgo(n.timestamp)}
          </div>
        </div>

        {/* Chevron */}
        <ChevronRight className={`w-4 h-4 flex-shrink-0 mt-1 transition-transform ${expanded ? 'rotate-90' : ''} ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
      </button>

      {/* ── Expanded detail ── */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className={`px-4 pb-4 space-y-3 border-t ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>

              {/* Cause */}
              <div className="pt-3">
                <div className={`flex items-center gap-1.5 mb-1 text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  <span className="w-4 h-px bg-current" />
                  Why this happened
                </div>
                <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{n.cause}</p>
              </div>

              {/* Prediction */}
              <div className={`rounded-lg p-3 ${isDark ? 'bg-violet-900/20 border border-violet-800/30' : 'bg-violet-50 border border-violet-100'}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3 h-3 text-violet-500" />
                  <span className="text-[10px] font-bold text-violet-500 uppercase tracking-wide">AI Prediction</span>
                </div>
                <p className={`text-[11px] leading-relaxed ${isDark ? 'text-violet-300' : 'text-violet-800'}`}>{n.prediction}</p>
              </div>

              {/* Solution */}
              <div className={`rounded-lg p-3 ${isDark ? 'bg-emerald-900/20 border border-emerald-800/30' : 'bg-emerald-50 border border-emerald-100'}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                  <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-wide">Recommended Action</span>
                </div>
                <p className={`text-[11px] leading-relaxed ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>{n.solution}</p>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2 pt-1">
                {n.actionLabel && n.actionPage && (
                  <button
                    onClick={handleAction}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white text-[11px] font-bold shadow-md hover:opacity-90 transition-opacity"
                  >
                    {n.actionLabel} →
                  </button>
                )}
                <button
                  onClick={() => dismissAppNotification(n.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[11px] font-semibold transition-all ${isDark ? 'border-slate-700 text-slate-400 hover:border-red-800 hover:text-red-400' : 'border-slate-200 text-slate-500 hover:border-red-300 hover:text-red-500'}`}
                >
                  <Trash2 className="w-3 h-3" /> Dismiss
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Filter tab labels ─────────────────────────────────────────────────────────
const FILTERS = ['All', 'Critical', 'Warnings', 'Predictions', 'Info'] as const;
type Filter = typeof FILTERS[number];

function matchFilter(n: AppNotification, f: Filter): boolean {
  if (f === 'All') return true;
  if (f === 'Critical') return n.type === 'critical';
  if (f === 'Warnings') return n.type === 'warning';
  if (f === 'Predictions') return n.type === 'prediction';
  if (f === 'Info') return n.type === 'info' || n.type === 'success';
  return true;
}

// ── Main panel ────────────────────────────────────────────────────────────────
export default function NotificationPanel() {
  const {
    isDarkMode: isDark,
    appNotifications,
    markAllAppNotificationsRead,
    clearAllAppNotifications,
    isNotificationPanelOpen: open,
    setNotificationPanelOpen,
  } = useDashboardStore();

  const unread = appNotifications.filter(n => !n.read).length;
  const [activeFilter, setActiveFilter] = useState<Filter>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const visible = appNotifications.filter(n => matchFilter(n, activeFilter));

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black/30 backdrop-blur-[2px]"
            onClick={() => setNotificationPanelOpen(false)}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className={`fixed top-0 right-0 h-full w-[420px] z-[160] flex flex-col shadow-2xl ${isDark ? 'bg-[#0F172A] border-l border-slate-800' : 'bg-white border-l border-slate-200'
              }`}
          >
            {/* ── Panel header ── */}
            <div className={`flex items-center justify-between px-5 py-4 border-b flex-shrink-0 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#10B981] flex items-center justify-center">
                    <Bell className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
                  </div>
                  {unread > 0 && (
                    <motion.span
                      key={unread}
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center"
                    >
                      {unread > 9 ? '9+' : unread}
                    </motion.span>
                  )}
                </div>
                <div>
                  <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    AI Notifications
                  </p>
                  <p className={`text-[10px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {unread > 0 ? `${unread} unread · ` : ''}{appNotifications.length} total
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {unread > 0 && (
                  <button
                    onClick={markAllAppNotificationsRead}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${isDark ? 'text-blue-400 hover:bg-slate-800' : 'text-[#2563EB] hover:bg-blue-50'}`}
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                  </button>
                )}
                {appNotifications.length > 0 && (
                  <button
                    onClick={clearAllAppNotifications}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${isDark ? 'text-red-400 hover:bg-slate-800' : 'text-red-500 hover:bg-red-50'}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear all
                  </button>
                )}
                <button
                  onClick={() => setNotificationPanelOpen(false)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${isDark ? 'text-slate-500 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ── AI status banner ── */}
            <div className={`px-5 py-3 border-b flex items-center gap-3 flex-shrink-0 ${isDark ? 'bg-gradient-to-r from-blue-900/20 to-green-900/20 border-slate-800' : 'bg-gradient-to-r from-blue-50 to-emerald-50 border-slate-100'}`}>
              <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse flex-shrink-0" />
              <p className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                AI engine monitoring · balance · delivery · campaigns · contacts
              </p>
              <Sparkles className="w-3.5 h-3.5 text-violet-500 flex-shrink-0 ml-auto" />
            </div>

            {/* ── Filter tabs ── */}
            <div className={`flex gap-1 px-4 py-2.5 border-b overflow-x-auto scrollbar-hide flex-shrink-0 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              {FILTERS.map(f => {
                const count = f === 'All' ? appNotifications.length : appNotifications.filter(n => matchFilter(n, f)).length;
                return (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${activeFilter === f
                      ? 'bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white shadow-sm'
                      : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                      }`}
                  >
                    {f}
                    {count > 0 && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${activeFilter === f ? 'bg-white/20 text-white' : isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-600'}`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* ── Notification list ── */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <AnimatePresence initial={false}>
                {visible.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-16 gap-4"
                  >
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                      <Bell className={`w-7 h-7 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                    </div>
                    <div className="text-center">
                      <p className={`text-sm font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {activeFilter === 'All' ? 'No notifications yet' : `No ${activeFilter.toLowerCase()} notifications`}
                      </p>
                      <p className={`text-xs mt-1 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                        The AI engine will alert you here when something needs attention.
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  visible.map(n => (
                    <NotifCard
                      key={n.id}
                      n={n}
                      isDark={isDark}
                      expanded={expandedId === n.id}
                      onToggle={() => setExpandedId(expandedId === n.id ? null : n.id)}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* ── Footer ── */}
            <div className={`px-5 py-3 border-t flex-shrink-0 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <p className={`text-[10px] text-center ${isDark ? 'text-slate-700' : 'text-slate-300'}`}>
                Predictions powered by EgoSMS AI · Updates every 30 seconds
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
