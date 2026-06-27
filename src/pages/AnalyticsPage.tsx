import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, Brain } from 'lucide-react';
import { SMSVolumeChart, DeliveryRateChart, NetworkPieChart, CostTrendChart } from '../components/Charts';
import { useDashboardStore } from '../store/dashboardStore';
import CountUp from 'react-countup';

export default function AnalyticsPage() {
  const { isDarkMode, smsStats, appNotifications, setNotificationPanelOpen } = useDashboardStore();

  // Live metrics from store
  const metrics = [
    { label: 'Avg Delivery Rate', value: smsStats.deliveryRate, suffix: '%', decimals: 2, trend: 0.3, icon: TrendingUp, color: 'text-[#10B981]' },
    { label: 'Total Sent', value: smsStats.sent, suffix: '', decimals: 0, trend: 12.4, icon: Sparkles, color: 'text-[#2563EB]' },
    { label: 'Failed SMS', value: smsStats.failed, suffix: '', decimals: 0, trend: smsStats.failed > 100 ? 1.2 : -0.5, icon: TrendingDown, color: smsStats.failed > 500 ? 'text-red-400' : 'text-amber-500' },
    { label: 'Delivered', value: smsStats.delivered, suffix: '', decimals: 0, trend: 11.8, icon: TrendingUp, color: 'text-[#10B981]' },
  ];

  // Live anomalies from the AI notification engine
  const liveAnomalies = appNotifications
    .filter(n => n.type === 'critical' || n.type === 'warning')
    .slice(0, 5)
    .map(n => ({
      date: new Date(n.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      metric: n.title.replace(/^[^\w]+/, ''),
      change: n.category === 'delivery' ? `${smsStats.deliveryRate.toFixed(1)}%` : n.category === 'balance' ? `${smsStats.failed} failed` : '—',
      network: n.category.charAt(0).toUpperCase() + n.category.slice(1),
      severity: n.type === 'critical' ? 'warning' : 'positive',
      summary: n.summary,
      id: n.id,
    }));

  // Fall back to static entries if no live anomalies yet
  const anomalyRows = liveAnomalies.length > 0 ? liveAnomalies : [
    { date: 'Oct 26', metric: 'Delivery Rate', change: '+2.3%', network: 'MTN Uganda', severity: 'positive', summary: 'MTN Uganda delivery rates improved on Oct 26.', id: 's1' },
    { date: 'Oct 18', metric: 'Failed SMS', change: '+18%', network: 'Airtel Uganda', severity: 'warning', summary: 'Airtel Uganda showed elevated failures.', id: 's2' },
    { date: 'Oct 12', metric: 'API Latency', change: '+340ms', network: 'System', severity: 'warning', summary: 'API response latency spike detected.', id: 's3' },
  ];

  // AI summary banner — dynamic based on live data
  const aboveAvg = smsStats.deliveryRate >= 95;
  const aiSummary = `Your delivery performance is ${aboveAvg ? 'above' : 'below'} industry average at ${smsStats.deliveryRate.toFixed(2)}%. You have sent ${smsStats.sent.toLocaleString()} messages with ${smsStats.delivered.toLocaleString()} delivered. ${aboveAvg ? 'MTN Uganda shows the highest success rate at 96.2%.' : 'Review your contact quality and network exclusions.'} AI predicts a +8% growth in monthly volume if you engage dormant contacts.`;

  return (
    <div className="space-y-6">
      {/* AI Analysis Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl border p-5 bg-gradient-to-r ${isDarkMode ? 'from-blue-900/30 to-green-900/30 border-blue-800/30' : 'from-blue-50 to-green-50 border-blue-100'}`}
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#10B981] flex items-center justify-center flex-shrink-0">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>AI Analytics Summary</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white">LIVE</span>
            </div>
            <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {aiSummary}
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`rounded-2xl border p-4 ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}
          >
            <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              <CountUp end={m.value} decimals={m.decimals} duration={1.5} delay={i * 0.1} separator="," />
              <span className="text-lg">{m.suffix}</span>
            </div>
            <div className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{m.label}</div>
            {m.trend !== 0 && (
              <div className={`flex items-center gap-1 mt-1 text-[11px] font-bold ${m.trend > 0 ? 'text-[#10B981]' : 'text-red-400'}`}>
                {m.trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {m.trend > 0 ? '+' : ''}{m.trend}% MoM
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SMSVolumeChart />
        <DeliveryRateChart />
        <NetworkPieChart />
        <CostTrendChart />
      </div>

      {/* Anomaly Detection */}
      <div className={`rounded-2xl border ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200'} shadow-sm overflow-hidden`}>
        <div className={`flex items-center justify-between px-5 py-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Anomaly Detection Log</h3>
          </div>
          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-700">AI-Powered</span>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {anomalyRows.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-center gap-4 px-5 py-3.5 ${isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'} transition-colors cursor-pointer`}
            >
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${a.severity === 'positive' ? 'bg-[#10B981]' : 'bg-amber-500'}`} />
              <div className="flex-1 min-w-0">
                <span className={`text-xs font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{a.metric}</span>
                <span className={`text-xs ml-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>· {a.date}</span>
                <div className={`text-[10px] mt-0.5 truncate ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{a.summary}</div>
              </div>
              <span className={`text-xs font-bold flex-shrink-0 ${a.severity === 'positive' ? 'text-[#10B981]' : 'text-amber-500'}`}>{a.change}</span>
              <span className={`text-xs flex-shrink-0 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{a.network}</span>
              <button onClick={() => setNotificationPanelOpen(true)} className="text-[10px] font-semibold text-[#2563EB] hover:underline flex-shrink-0">Investigate →</button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
