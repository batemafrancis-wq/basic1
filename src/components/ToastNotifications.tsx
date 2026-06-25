import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';
import { useEffect, useState } from 'react';

const DURATION = 5000; // ms before auto-dismiss

const CONFIG = {
  success: { icon: CheckCircle, bar: '#10B981', badge: 'bg-green-100 dark:bg-green-900/30', border: 'border-l-[#10B981]', iconCls: 'text-[#10B981]' },
  error: { icon: XCircle, bar: '#EF4444', badge: 'bg-red-50 dark:bg-red-900/20', border: 'border-l-red-500', iconCls: 'text-red-500' },
  warning: { icon: AlertTriangle, bar: '#F59E0B', badge: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-l-amber-500', iconCls: 'text-amber-500' },
  info: { icon: Info, bar: '#2563EB', badge: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-l-[#2563EB]', iconCls: 'text-[#2563EB]' },
} as const;

export default function ToastNotifications() {
  const { notifications, removeNotification, isDarkMode } = useDashboardStore();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] flex flex-col-reverse gap-2.5 items-center pointer-events-none">
      <AnimatePresence initial={false}>
        {notifications.slice(-4).map((n) => (
          <ToastItem
            key={n.id}
            notification={n}
            onRemove={removeNotification}
            isDarkMode={isDarkMode}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({
  notification,
  onRemove,
  isDarkMode,
}: {
  notification: ReturnType<typeof useDashboardStore.getState>['notifications'][number];
  onRemove: (id: string) => void;
  isDarkMode: boolean;
}) {
  const cfg = CONFIG[notification.type];
  const Icon = cfg.icon;
  const [progress, setProgress] = useState(100);
  const [paused, setPaused] = useState(false);

  // Countdown progress bar
  useEffect(() => {
    if (paused) return;
    const step = 100 / (DURATION / 50);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p <= 0) {
          clearInterval(interval);
          onRemove(notification.id);
          return 0;
        }
        return p - step;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [paused, notification.id, onRemove]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 32, scale: 0.88 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={`
        pointer-events-auto relative overflow-hidden
        flex items-start gap-3 pl-4 pr-3 pt-3 pb-2.5
        rounded-2xl border-l-4 shadow-2xl shadow-black/20
        min-w-[300px] max-w-[400px]
        ${cfg.border}
        ${isDarkMode ? 'bg-slate-900 border border-slate-700/80' : 'bg-white border border-slate-200/80'}
      `}
    >
      {/* Icon */}
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.badge}`}>
        <Icon className={`w-4 h-4 ${cfg.iconCls}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-1">
        <p className={`text-xs font-bold leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          {notification.title}
        </p>
        <p className={`text-[11px] mt-0.5 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          {notification.message}
        </p>

        {/* Optional action button */}
        {notification.action && (
          <button
            onClick={() => { notification.action!.onClick(); onRemove(notification.id); }}
            className={`mt-2 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all ${isDarkMode
                ? 'bg-slate-800 text-blue-400 hover:bg-slate-700'
                : 'bg-slate-100 text-[#2563EB] hover:bg-slate-200'
              }`}
          >
            {notification.action.label}
          </button>
        )}
      </div>

      {/* Dismiss */}
      <button
        onClick={() => onRemove(notification.id)}
        className={`w-5 h-5 mt-0.5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${isDarkMode ? 'text-slate-600 hover:text-slate-300' : 'text-slate-300 hover:text-slate-600'
          }`}
      >
        <X className="w-3 h-3" />
      </button>

      {/* Progress bar */}
      <div className={`absolute bottom-0 left-0 h-[3px] w-full ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: cfg.bar, width: `${progress}%` }}
          transition={{ duration: 0 }}
        />
      </div>
    </motion.div>
  );
}
