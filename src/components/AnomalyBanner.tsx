import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, ChevronRight } from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';

export default function AnomalyBanner() {
  const { isDarkMode, activePage } = useDashboardStore();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (activePage === 'dashboard' && !dismissed) {
      const timer = setTimeout(() => setVisible(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [activePage, dismissed]);

  return (
    <AnimatePresence>
      {visible && !dismissed && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: 'spring', bounce: 0.3 }}
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[150] flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-xl max-w-[500px] w-[calc(100%-2rem)] ${
            isDarkMode
              ? 'bg-amber-900/80 border-amber-700/50 text-amber-100'
              : 'bg-amber-50/95 border-amber-200 text-amber-900'
          }`}
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold">⚡ Unusual Drop Detected</div>
            <div className={`text-[11px] truncate ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}>
              Airtel Uganda delivery rate dropped 18% on Oct 18th. Click to investigate.
            </div>
          </div>
          <button className={`flex items-center gap-1 text-[11px] font-bold whitespace-nowrap ${isDarkMode ? 'text-amber-400' : 'text-amber-700'} hover:underline`}>
            Investigate <ChevronRight className="w-3 h-3" />
          </button>
          <button
            onClick={() => { setDismissed(true); setVisible(false); }}
            className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'text-amber-500 hover:bg-amber-800' : 'text-amber-500 hover:bg-amber-100'} transition-colors`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
