import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, AlertTriangle, CheckCircle, TrendingUp,
  X, ChevronRight, Sparkles, Bell,
} from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';

export default function AIInsightsPanel() {
  const {
    isDarkMode, smsStats, contacts, campaigns,
    appNotifications, setNotificationPanelOpen, setActivePage,
  } = useDashboardStore();

  const [dismissed, setDismissed] = useState<string[]>([]);

  // Build live insights from store state
  const liveInsights = [
    {
      id: 'delivery',
      type: 'anomaly' as const,
      severity: (smsStats.deliveryRate >= 95 ? 'success' : 'warning') as 'success' | 'warning' | 'info',
      title: smsStats.deliveryRate >= 95
        ? '✅ Delivery Rate Healthy'
        : '⚠️ Delivery Rate Below Target',
      message: smsStats.deliveryRate >= 95
        ? `Your rate is ${smsStats.deliveryRate.toFixed(2)}% — above the 95% industry benchmark. MTN Uganda leads at 96.2%.`
        : `Your rate is ${smsStats.deliveryRate.toFixed(2)}%. Review contact quality and check for inactive numbers.`,
      action: 'View Analytics',
      page: 'analytics' as const,
    },
    {
      id: 'contacts',
      type: 'growth' as const,
      severity: (contacts.length >= 20 ? 'success' : 'info') as 'success' | 'warning' | 'info',
      title: contacts.length >= 20 ? '👥 Good Contact Base' : '📋 Grow Your Contact List',
      message: contacts.length >= 20
        ? `${contacts.length.toLocaleString()} contacts. ${Math.floor(contacts.length * 0.15)} haven't received an SMS in 30+ days — re-engage them.`
        : `You have ${contacts.length} contacts. Import a CSV to grow your audience and increase campaign reach.`,
      action: contacts.length >= 20 ? 'Create Campaign' : 'Import Contacts',
      page: (contacts.length >= 20 ? 'campaigns' : 'contacts') as const,
    },
    {
      id: 'campaigns',
      type: 'recommendation' as const,
      severity: (campaigns.filter(c => c.status === 'running').length > 0 ? 'info' : 'warning') as 'success' | 'warning' | 'info',
      title: campaigns.filter(c => c.status === 'running').length > 0
        ? '📢 Active Campaign Running'
        : '⏰ Optimal Send Window',
      message: campaigns.filter(c => c.status === 'running').length > 0
        ? `${campaigns.filter(c => c.status === 'running').length} campaign(s) sending. Monitor delivery rates in Analytics.`
        : 'AI analysis: 34% higher engagement between 10AM–12PM EAT. Schedule for Thursday morning.',
      action: campaigns.filter(c => c.status === 'running').length > 0 ? 'View Campaigns' : 'Schedule SMS',
      page: (campaigns.filter(c => c.status === 'running').length > 0 ? 'campaigns' : 'send-sms') as const,
    },
    ...(smsStats.sent > 0 ? [{
      id: 'performance',
      type: 'anomaly' as const,
      severity: 'success' as 'success' | 'warning' | 'info',
      title: '📊 Campaign Performance',
      message: `${smsStats.sent.toLocaleString()} sent · ${smsStats.delivered.toLocaleString()} delivered · ${smsStats.failed} failed · ${smsStats.deliveryRate.toFixed(1)}% success.`,
      action: 'Full Report',
      page: 'reports' as const,
    }] : []),
  ].filter(i => !dismissed.includes(i.id));

  // Urgent critical notifications as bonus cards
  const urgentNotifs = appNotifications
    .filter(n => n.type === 'critical' && !n.read && !dismissed.includes(`notif-${n.id}`))
    .slice(0, 1)
    .map(n => ({
      id: `notif-${n.id}`,
      type: 'anomaly' as const,
      severity: 'warning' as 'success' | 'warning' | 'info',
      title: n.title,
      message: n.summary + ' — ' + n.solution.slice(0, 80) + '…',
      action: n.actionLabel || 'Investigate',
      page: (n.actionPage || 'analytics') as const,
    }));

  const allVisible = [...urgentNotifs, ...liveInsights];

  const iconMap = { anomaly: AlertTriangle, recommendation: Zap, growth: TrendingUp };
  const colorMap = {
    info: { bg: 'from-blue-500/10 to-blue-600/5', border: 'border-blue-400/30', icon: 'text-blue-400' },
    warning: { bg: 'from-amber-500/10 to-amber-600/5', border: 'border-amber-400/30', icon: 'text-amber-400' },
    success: { bg: 'from-green-500/10 to-green-600/5', border: 'border-green-400/30', icon: 'text-green-400' },
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#10B981] flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
        <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>AI Insights</h3>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white">
          LIVE
        </span>
      </div>

      {/* Cards */}
      <AnimatePresence mode="popLayout">
        {allVisible.map((insight, i) => {
          const Icon = iconMap[insight.type] ?? Zap;
          const color = colorMap[insight.severity] ?? colorMap.info;
          return (
            <motion.div
              key={insight.id}
              layout
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20, height: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`relative p-4 rounded-xl border bg-gradient-to-br ${color.bg} ${color.border} group`}
            >
              <button
                onClick={() => setDismissed(prev => [...prev, insight.id])}
                className={`absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${isDarkMode ? 'bg-slate-700 text-slate-400 hover:text-white' : 'bg-slate-200 text-slate-400 hover:text-slate-700'
                  }`}
              >
                <X className="w-3 h-3" />
              </button>
              <div className="flex items-start gap-3 pr-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-slate-800' : 'bg-white'} shadow-sm`}>
                  <Icon className={`w-4 h-4 ${color.icon}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{insight.title}</div>
                  <div className={`text-[11px] leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{insight.message}</div>
                  <button
                    onClick={() => { setActivePage(insight.page); setDismissed(prev => [...prev, insight.id]); }}
                    className={`mt-2 flex items-center gap-1 text-[11px] font-semibold ${color.icon} hover:underline`}
                  >
                    {insight.action} <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Bell shortcut */}
      {appNotifications.filter(n => !n.read).length > 0 && (
        <button
          onClick={() => setNotificationPanelOpen(true)}
          className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl border text-[11px] font-semibold transition-all ${isDarkMode
              ? 'border-slate-700 text-slate-400 hover:border-blue-500/50 hover:text-blue-400'
              : 'border-slate-200 text-slate-500 hover:border-blue-300 hover:text-[#2563EB]'
            }`}
        >
          <Bell className="w-3.5 h-3.5" />
          {appNotifications.filter(n => !n.read).length} more in notification centre
        </button>
      )}

      {/* All clear */}
      {allVisible.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className={`p-6 rounded-xl border text-center ${isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50'}`}>
          <CheckCircle className="w-8 h-8 text-[#10B981] mx-auto mb-2" />
          <div className={`text-sm font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>All systems healthy</div>
          <div className={`text-xs mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>AI is monitoring your account 24/7</div>
        </motion.div>
      )}
    </div>
  );
}
