import { motion } from 'framer-motion';
import { Plus, Play, BarChart3, Calendar, Users, CheckCircle2, Clock, Zap } from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';
import { recentCampaigns } from '../data/mockData';

const statusConfig = {
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle2, dot: 'bg-green-500' },
  running: { label: 'Running', color: 'bg-blue-100 text-blue-700', icon: Play, dot: 'bg-blue-500' },
  scheduled: { label: 'Scheduled', color: 'bg-amber-100 text-amber-700', icon: Clock, dot: 'bg-amber-500' },
};

export default function CampaignsPage() {
  const { isDarkMode, addNotification } = useDashboardStore();

  return (
    <div className="space-y-5">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Campaign Manager</h2>
          <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Manage, schedule and analyze your SMS campaigns</p>
        </div>
        <div className="flex items-center gap-2">
          <button className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold ${isDarkMode ? 'border-blue-500/30 text-blue-400' : 'border-blue-200 text-blue-600'}`}>
            <Zap className="w-3.5 h-3.5" />
            AI Optimize
          </button>
          <button
            onClick={() => addNotification({ type: 'success', title: '🚀 Campaign Created!', message: 'Your new campaign is ready to configure.' })}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white text-xs font-bold shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            New Campaign
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Campaigns', value: '94', icon: BarChart3, color: 'from-blue-500 to-blue-600' },
          { label: 'Running Now', value: '3', icon: Play, color: 'from-green-500 to-green-600' },
          { label: 'Scheduled', value: '7', icon: Calendar, color: 'from-amber-500 to-orange-500' },
          { label: 'Avg. Open Rate', value: '94.8%', icon: Users, color: 'from-violet-500 to-purple-600' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`rounded-xl border p-4 ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}
          >
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center mb-2`}>
              <s.icon className="w-4 h-4 text-white" />
            </div>
            <div className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{s.value}</div>
            <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Campaign Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {recentCampaigns.map((c, i) => {
          const config = statusConfig[c.status as keyof typeof statusConfig];
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -3 }}
              className={`rounded-2xl border p-5 cursor-pointer group transition-all ${
                isDarkMode
                  ? 'bg-[#1E293B] border-slate-700 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-900/20'
                  : 'bg-white border-slate-200 hover:border-blue-200 hover:shadow-lg'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0 pr-2">
                  <h4 className={`text-sm font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{c.name}</h4>
                  <div className={`text-xs mt-0.5 font-mono ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{c.sender}</div>
                </div>
                <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${config.color}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${config.dot} ${c.status === 'running' ? 'animate-pulse' : ''}`} />
                  {config.label}
                </span>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className={`text-center p-2 rounded-xl ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <div className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{c.sent.toLocaleString()}</div>
                  <div className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Sent</div>
                </div>
                <div className={`text-center p-2 rounded-xl ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <div className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{c.delivered > 0 ? c.delivered.toLocaleString() : '—'}</div>
                  <div className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Delivered</div>
                </div>
                <div className={`text-center p-2 rounded-xl ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <div className={`text-sm font-bold ${c.rate >= 95 ? 'text-[#10B981]' : c.rate > 0 ? 'text-amber-500' : isDarkMode ? 'text-slate-500' : 'text-slate-300'}`}>
                    {c.rate > 0 ? `${c.rate}%` : '—'}
                  </div>
                  <div className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Rate</div>
                </div>
              </div>

              {/* Progress Bar (if running or completed) */}
              {c.rate > 0 && (
                <div className="mb-4">
                  <div className={`h-1.5 rounded-full ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${c.rate}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1 }}
                      className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#10B981]"
                    />
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className={`flex items-center justify-between text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                <span>{c.date}</span>
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="text-[#2563EB] font-semibold hover:underline">View Report</button>
                  {c.status === 'running' && (
                    <button className="text-amber-500 font-semibold hover:underline">Pause</button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
