import { motion, AnimatePresence } from 'framer-motion';
import { Zap, AlertTriangle, CheckCircle, TrendingUp, X, ChevronRight } from 'lucide-react';
import { aiInsights } from '../data/mockData';
import { useDashboardStore } from '../store/dashboardStore';
import { useState } from 'react';

export default function AIInsightsPanel() {
  const { isDarkMode } = useDashboardStore();
  const [dismissed, setDismissed] = useState<number[]>([]);

  const visible = aiInsights.filter((_, i) => !dismissed.includes(i));

  const icons = {
    anomaly: AlertTriangle,
    recommendation: Zap,
    growth: TrendingUp,
  };

  const colors = {
    info: { bg: 'from-blue-500/10 to-blue-600/5', border: 'border-blue-400/30', icon: 'text-blue-400', badge: 'bg-blue-500' },
    warning: { bg: 'from-amber-500/10 to-amber-600/5', border: 'border-amber-400/30', icon: 'text-amber-400', badge: 'bg-amber-500' },
    success: { bg: 'from-green-500/10 to-green-600/5', border: 'border-green-400/30', icon: 'text-green-400', badge: 'bg-green-500' },
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#10B981] flex items-center justify-center">
          <Zap className="w-3.5 h-3.5 text-white" />
        </div>
        <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>AI Insights</h3>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white">
          {visible.length} Active
        </span>
      </div>

      <AnimatePresence mode="popLayout">
        {visible.map((insight, i) => {
          const originalIndex = aiInsights.indexOf(insight);
          const Icon = icons[insight.type as keyof typeof icons] || Zap;
          const color = colors[insight.severity as keyof typeof colors];

          return (
            <motion.div
              key={originalIndex}
              layout
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20, height: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative p-4 rounded-xl border bg-gradient-to-br ${color.bg} ${color.border} group`}
            >
              <button
                onClick={() => setDismissed(prev => [...prev, originalIndex])}
                className={`absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${
                  isDarkMode ? 'bg-slate-700 text-slate-400 hover:text-white' : 'bg-slate-200 text-slate-400 hover:text-slate-700'
                }`}
              >
                <X className="w-3 h-3" />
              </button>

              <div className="flex items-start gap-3 pr-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isDarkMode ? 'bg-slate-800' : 'bg-white'
                } shadow-sm`}>
                  <Icon className={`w-4 h-4 ${color.icon}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                    {insight.title}
                  </div>
                  <div className={`text-[11px] leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    {insight.message}
                  </div>
                  <button className={`mt-2 flex items-center gap-1 text-[11px] font-semibold ${color.icon} hover:underline`}>
                    {insight.action}
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {visible.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`p-6 rounded-xl border text-center ${isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50'}`}
        >
          <CheckCircle className="w-8 h-8 text-[#10B981] mx-auto mb-2" />
          <div className={`text-sm font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>All clear!</div>
          <div className={`text-xs mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>No anomalies detected</div>
        </motion.div>
      )}
    </div>
  );
}
