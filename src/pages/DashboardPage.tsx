import { motion } from 'framer-motion';
import {
  Send, Users, CheckCircle2, DollarSign, TrendingUp,
  Clock, Zap, BarChart3
} from 'lucide-react';
import KPICard from '../components/KPICard';
import { SMSVolumeChart, DeliveryRateChart, NetworkPieChart, CostTrendChart } from '../components/Charts';
import AIInsightsPanel from '../components/AIInsightsPanel';
import { useDashboardStore } from '../store/dashboardStore';

export default function DashboardPage() {
  const { isDarkMode, timePeriod, addNotification, smsStats, contacts, campaigns, balanceUGX, smsCredits } = useDashboardStore();

  /* Build KPIs dynamically from live store values */
  const isYTD = timePeriod !== 'mtd';
  const sentVal = isYTD ? 212700 : smsStats.sent;
  const deliveredVal = isYTD ? 202065 : smsStats.delivered;
  const contactsVal = contacts.length;
  const rateVal = smsStats.deliveryRate;
  const spendVal = isYTD ? balanceUGX * 17 : Math.round(smsStats.sent * 20);
  const campVal = campaigns.length;

  const kpis = [
    { title: 'SMS Sent', value: sentVal, change: 12.3, changeLabel: isYTD ? 'last year' : 'last month', icon: Send, iconBg: 'from-blue-500 to-blue-600', sparkline: [8000, 10000, 12000, 11000, 14000, 13000, sentVal], highlight: true },
    { title: 'Delivered', value: deliveredVal, change: 11.8, changeLabel: isYTD ? 'last year' : 'last month', icon: CheckCircle2, iconBg: 'from-emerald-500 to-green-600', sparkline: [7600, 9500, 11400, 10450, 13300, 12350, deliveredVal] },
    { title: 'Contacts', value: contactsVal, change: 5.2, changeLabel: 'last month', icon: Users, iconBg: 'from-violet-500 to-purple-600', sparkline: [7200, 7500, 7800, 7900, 8100, 8200, contactsVal] },
    { title: 'Delivery Rate', value: rateVal, suffix: '%', decimals: 1, change: 0.3, changeLabel: 'last month', icon: TrendingUp, iconBg: 'from-amber-500 to-orange-500', sparkline: [94.5, 94.8, 95.1, 94.9, 95.0, 94.9, rateVal] },
    { title: 'Spend (UGX)', value: spendVal, change: 8.9, changeLabel: 'last month', icon: DollarSign, iconBg: 'from-pink-500 to-rose-600', sparkline: [160000, 200000, 240000, 220000, 280000, 260000, spendVal] },
    { title: 'Campaigns', value: campVal, change: -1, changeLabel: 'last month', icon: BarChart3, iconBg: 'from-cyan-500 to-teal-600', sparkline: [8, 10, 14, 11, 13, 12, campVal] },
  ];

  const handleSendSMS = () => {
    addNotification({ type: 'success', title: 'Campaign Queued!', message: 'Your bulk SMS is being processed — 2,450 recipients.' });
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-2xl p-5 border ${isDarkMode
          ? 'bg-gradient-to-r from-[#1e3a5f] to-[#0f2d1a] border-blue-500/20'
          : 'bg-gradient-to-r from-blue-50 via-white to-green-50 border-blue-100'
          }`}
      >
        {/* Background decoration */}
        <div className="absolute right-0 top-0 w-64 h-full opacity-10">
          <div className="absolute right-8 top-4 w-32 h-32 rounded-full bg-gradient-to-br from-[#2563EB] to-[#10B981] blur-2xl" />
          <div className="absolute right-24 bottom-2 w-20 h-20 rounded-full bg-[#10B981] blur-xl" />
        </div>
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-[#2563EB]" />
              <span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-blue-400' : 'text-[#2563EB]'}`}>
                Good morning, John 👋
              </span>
            </div>
            <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Your campaigns are performing <span className="text-[#10B981]">excellently</span>
            </h2>
            <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {smsStats.deliveryRate}% delivery rate · {smsStats.delivered.toLocaleString()} messages delivered this month · {smsCredits.toLocaleString()} credits remaining
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={handleSendSMS}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white text-sm font-semibold shadow-lg shadow-blue-500/25 hover:opacity-90 transition-all hover:scale-105"
            >
              <Send className="w-4 h-4" />
              Quick Send
            </button>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((kpi, i) => (
          <KPICard
            key={kpi.title}
            {...kpi}
            isDarkMode={isDarkMode}
            index={i}
          />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Charts — left 2/3 */}
        <div className="lg:col-span-2 space-y-4">
          <SMSVolumeChart />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DeliveryRateChart />
            <NetworkPieChart />
          </div>
          <CostTrendChart />
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* AI Insights */}
          <div className={`rounded-2xl border p-5 ${isDarkMode ? 'bg-[#1E293B] border-slate-700/60' : 'bg-white border-slate-200/60'} shadow-sm`}>
            <AIInsightsPanel />
          </div>

          {/* Quick Stats */}
          <div className={`rounded-2xl border p-5 ${isDarkMode ? 'bg-[#1E293B] border-slate-700/60' : 'bg-white border-slate-200/60'} shadow-sm`}>
            <h3 className={`text-sm font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Platform Health</h3>
            <div className="space-y-3">
              {[
                { label: 'MTN Uganda', rate: 96.2, color: '#FBBF24' },
                { label: 'Airtel Uganda', rate: 94.1, color: '#EF4444' },
                { label: 'Africell', rate: 95.8, color: '#8B5CF6' },
                { label: 'Smile Telecom', rate: 93.5, color: '#06B6D4' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={`text-xs w-28 flex-shrink-0 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{item.label}</div>
                  <div className={`flex-1 h-2 rounded-full ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.rate}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: item.color }}
                    />
                  </div>
                  <span className={`text-xs font-bold w-10 text-right ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    {item.rate}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* System Status */}
          <div className={`rounded-2xl border p-5 ${isDarkMode ? 'bg-[#1E293B] border-slate-700/60' : 'bg-white border-slate-200/60'} shadow-sm`}>
            <h3 className={`text-sm font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>System Status</h3>
            <div className="space-y-2.5">
              {[
                { name: 'SMS Gateway', status: 'operational', icon: CheckCircle2 },
                { name: 'API Endpoints', status: 'operational', icon: CheckCircle2 },
                { name: 'Analytics Engine', status: 'operational', icon: CheckCircle2 },
                { name: 'Scheduled Jobs', status: 'warning', icon: Clock },
              ].map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{item.name}</div>
                  <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full ${item.status === 'operational'
                    ? isDarkMode ? 'bg-green-900/40 text-green-400' : 'bg-green-50 text-green-600'
                    : isDarkMode ? 'bg-amber-900/40 text-amber-400' : 'bg-amber-50 text-amber-600'
                    }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'operational' ? 'bg-green-400' : 'bg-amber-400'} animate-pulse`} />
                    {item.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Campaigns — live from store */}
      <div className={`rounded-2xl border ${isDarkMode ? 'bg-[#1E293B] border-slate-700/60' : 'bg-white border-slate-200/60'} shadow-sm overflow-hidden`}>
        <div className={`flex items-center justify-between px-5 py-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
          <div className="flex items-center gap-2">
            <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Recent Campaigns</h3>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white">LIVE</span>
          </div>
          <button className="text-xs font-semibold text-[#2563EB] hover:text-[#10B981] transition-colors">View All →</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`text-xs font-semibold border-b ${isDarkMode ? 'border-slate-700 text-slate-500' : 'border-slate-100 text-slate-400'}`}>
                {['Campaign Name', 'Sender ID', 'Sent', 'Delivered', 'Rate', 'Status', 'Date'].map(h => (
                  <th key={h} className="text-left px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {campaigns.slice(0, 5).map((c, i) => {
                const statusColors: Record<string, string> = {
                  completed: isDarkMode ? 'bg-green-900/40 text-green-400' : 'bg-green-100 text-green-700',
                  running: isDarkMode ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-100 text-blue-700',
                  scheduled: isDarkMode ? 'bg-amber-900/40 text-amber-400' : 'bg-amber-100 text-amber-700',
                  paused: isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-600',
                };
                return (
                  <motion.tr key={c.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                    className={`hover:${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'} transition-colors group cursor-pointer`}>
                    <td className={`px-5 py-3.5 text-xs font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{c.name}</td>
                    <td className={`px-5 py-3.5 text-xs font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{c.sender}</td>
                    <td className={`px-5 py-3.5 text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{c.sent.toLocaleString()}</td>
                    <td className={`px-5 py-3.5 text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{c.delivered.toLocaleString()}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-bold ${c.rate >= 95 ? 'text-[#10B981]' : c.rate > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                        {c.rate > 0 ? `${c.rate}%` : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full capitalize ${statusColors[c.status] || ''}`}>{c.status}</span>
                    </td>
                    <td className={`px-5 py-3.5 text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{c.date}</td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
