import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';
import { useEffect } from 'react';

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors = {
  success: 'border-l-[#10B981] bg-green-50 dark:bg-green-900/20',
  error: 'border-l-red-500 bg-red-50 dark:bg-red-900/20',
  warning: 'border-l-amber-500 bg-amber-50 dark:bg-amber-900/20',
  info: 'border-l-[#2563EB] bg-blue-50 dark:bg-blue-900/20',
};

const iconColors = {
  success: 'text-[#10B981]',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-[#2563EB]',
};

export default function ToastNotifications() {
  const { notifications, removeNotification, isDarkMode } = useDashboardStore();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 items-center pointer-events-none">
      <AnimatePresence>
        {notifications.map((n) => {
          const Icon = icons[n.type];
          return (
            <ToastItem
              key={n.id}
              notification={n}
              Icon={Icon}
              onRemove={removeNotification}
              isDarkMode={isDarkMode}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ notification, Icon, onRemove, isDarkMode }: any) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(notification.id), 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.9 }}
      transition={{ type: 'spring', bounce: 0.3, duration: 0.5 }}
      className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border-l-4 shadow-xl min-w-[300px] max-w-[380px] ${
        colors[notification.type as keyof typeof colors]
      } ${isDarkMode ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-slate-200'}`}
    >
      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${iconColors[notification.type as keyof typeof iconColors]}`} />
      <div className="flex-1 min-w-0">
        <div className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{notification.title}</div>
        <div className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{notification.message}</div>
      </div>
      <button
        onClick={() => onRemove(notification.id)}
        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'text-slate-600 hover:text-slate-400' : 'text-slate-300 hover:text-slate-500'}`}
      >
        <X className="w-3 h-3" />
      </button>
    </motion.div>
  );
}
