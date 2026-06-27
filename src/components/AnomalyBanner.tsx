import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';

export default function AnomalyBanner() {
  const {
    isDarkMode, activePage,
    appNotifications, setNotificationPanelOpen,
  } = useDashboardStore();

  const [visible, setVisible] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  // Pick the most urgent unread notification to show
  const urgent = appNotifications.find(
    n => (n.type === 'critical' || n.type === 'warning') &&
      !n.read &&
      !dismissedIds.includes(n.id)
  );

  useEffect(() => {
    if (activePage === 'dashboard' && urgent) {
      const t = setTimeout(() => setVisible(true), 2500);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [activePage, urgent?.id]); // eslint-disable-line

  const dismiss = () => {
    setVisible(false);
    if (urgent) setDismissedIds(prev => [...prev, urgent.id]);
  };

  const investigate = () => {
    setVisible(false);
    setNotificationPanelOpen(true);
    if (urgent) setDismissedIds(prev => [...prev, urgent.id]);
  };

  // Nothing to show
  if (!urgent) return null;

  const isCritical = urgent.type === 'critical';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: 'spring', bounce: 0.28 }}
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[150] flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-xl max-w-[540px] w-[calc(100%-2rem)] ${isCritical
              ? isDarkMode
                ? 'bg-red-900/80 border-red-700/50 text-red-100'
                : 'bg-red-50/95 border-red-200 text-red-900'
              : isDarkMode
                ? 'bg-amber-900/80 border-amber-700/50 text-amber-100'
                : 'bg-amber-50/95 border-amber-200 text-amber-900'
            }`}
        >
          {/* Icon */}
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isCritical ? 'bg-red-500/20' : 'bg-amber-500/20'
            }`}>
            <AlertTriangle className={`w-4 h-4 ${isCritical ? 'text-red-500' : 'text-amber-500'}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold leading-tight">{urgent.title}</div>
            <div className={`text-[11px] truncate mt-0.5 ${isCritical
                ? isDarkMode ? 'text-red-300' : 'text-red-700'
                : isDarkMode ? 'text-amber-300' : 'text-amber-700'
              }`}>
              {urgent.summary}
            </div>
          </div>

          {/* Investigate */}
          <button
            onClick={investigate}
            className={`flex items-center gap-1 text-[11px] font-bold whitespace-nowrap hover:underline flex-shrink-0 ${isCritical
                ? isDarkMode ? 'text-red-300' : 'text-red-700'
                : isDarkMode ? 'text-amber-300' : 'text-amber-700'
              }`}
          >
            View Details <ChevronRight className="w-3 h-3" />
          </button>

          {/* Dismiss */}
          <button
            onClick={dismiss}
            className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${isCritical
                ? isDarkMode ? 'text-red-400 hover:bg-red-800' : 'text-red-400 hover:bg-red-100'
                : isDarkMode ? 'text-amber-400 hover:bg-amber-800' : 'text-amber-500 hover:bg-amber-100'
              }`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
