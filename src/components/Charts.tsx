import { motion } from 'framer-motion';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell, Area, AreaChart,
  ReferenceLine
} from 'recharts';
import { useDashboardStore } from '../store/dashboardStore';
import { deliveryRateData, networkBreakdown } from '../data/mockData';

const CustomTooltip = ({ active, payload, label, isDark }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className={`p-3 rounded-xl border shadow-xl backdrop-blur-xl ${isDark ? 'bg-slate-900/95 border-slate-700 text-white' : 'bg-white/95 border-slate-200 text-slate-900'
        }`}>
        <p className={`text-xs font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{label}</p>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{p.name}:</span>
            <span className="font-bold">{p.value?.toLocaleString()}{p.name === 'Rate' ? '%' : ''}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function SMSVolumeChart() {
  const { timePeriod, isDarkMode, setHoveredMonth, hoveredMonth, chartData } = useDashboardStore();
  const data = chartData;

  return (
    <motion.div
      key={timePeriod}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={`rounded-2xl border p-5 ${isDarkMode ? 'bg-[#1E293B] border-slate-700/60' : 'bg-white border-slate-200/60'
        } shadow-sm`}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>SMS Volume</h3>
          <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Sent vs Delivered</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-[#2563EB]" />
            <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Sent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-[#10B981]" />
            <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Delivered</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} onMouseMove={(e) => e.activeLabel && setHoveredMonth(String(e.activeLabel))} onMouseLeave={() => setHoveredMonth(null)}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} vertical={false} />
          <XAxis dataKey="month" tick={{ fill: isDarkMode ? '#64748b' : '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: isDarkMode ? '#64748b' : '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} width={45} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
          <Tooltip content={<CustomTooltip isDark={isDarkMode} />} />
          <Bar dataKey="sent" name="Sent" fill="#2563EB" radius={[4, 4, 0, 0]} opacity={0.85} />
          <Bar dataKey="delivered" name="Delivered" fill="#10B981" radius={[4, 4, 0, 0]} />
          {hoveredMonth && <ReferenceLine x={hoveredMonth} stroke={isDarkMode ? '#334155' : '#e2e8f0'} strokeWidth={2} />}
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

export function DeliveryRateChart() {
  const { timePeriod, isDarkMode, hoveredMonth } = useDashboardStore();

  return (
    <motion.div
      key={`rate-${timePeriod}`}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className={`rounded-2xl border p-5 ${isDarkMode ? 'bg-[#1E293B] border-slate-700/60' : 'bg-white border-slate-200/60'
        } shadow-sm`}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Delivery Rate Trend</h3>
          <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Monthly delivery success %</p>
        </div>
        <div className={`text-xs font-bold px-2.5 py-1 rounded-full ${isDarkMode ? 'bg-green-900/40 text-green-400' : 'bg-green-50 text-green-600'}`}>
          Avg 95.01%
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={deliveryRateData}>
          <defs>
            <linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} vertical={false} />
          <XAxis dataKey="month" tick={{ fill: isDarkMode ? '#64748b' : '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fill: isDarkMode ? '#64748b' : '#94a3b8', fontSize: 10 }}
            axisLine={false} tickLine={false} width={40}
            domain={[93, 97]}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip content={<CustomTooltip isDark={isDarkMode} />} />
          <Area type="monotone" dataKey="rate" name="Rate" stroke="#10B981" strokeWidth={2.5} fill="url(#rateGrad)" dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }} activeDot={{ r: 5, fill: '#10B981' }} />
          {hoveredMonth && <ReferenceLine x={hoveredMonth} stroke={isDarkMode ? '#334155' : '#e2e8f0'} strokeWidth={2} />}
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

export function NetworkPieChart() {
  const { isDarkMode } = useDashboardStore();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className={`rounded-2xl border p-5 ${isDarkMode ? 'bg-[#1E293B] border-slate-700/60' : 'bg-white border-slate-200/60'
        } shadow-sm`}
    >
      <div className="mb-5">
        <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Network Distribution</h3>
        <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>By telecom network</p>
      </div>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width="55%" height={160}>
          <PieChart>
            <Pie
              data={networkBreakdown}
              cx="50%" cy="50%"
              innerRadius={45} outerRadius={70}
              dataKey="value"
              paddingAngle={3}
            >
              {networkBreakdown.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <div className={`p-2 rounded-lg border text-xs ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'}`}>
                    <span className="font-bold">{payload[0].name}: {payload[0].value}%</span>
                  </div>
                ) : null
              }
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-2">
          {networkBreakdown.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
              <div className="flex-1 min-w-0">
                <div className={`text-[11px] font-medium truncate ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{item.name}</div>
                <div className={`w-full h-1.5 rounded-full mt-0.5 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }}
                    className="h-full rounded-full"
                    style={{ background: item.color }}
                  />
                </div>
              </div>
              <span className={`text-[11px] font-bold flex-shrink-0 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function CostTrendChart() {
  const { timePeriod, isDarkMode, chartData } = useDashboardStore();
  const data = chartData;

  return (
    <motion.div
      key={`cost-${timePeriod}`}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className={`rounded-2xl border p-5 ${isDarkMode ? 'bg-[#1E293B] border-slate-700/60' : 'bg-white border-slate-200/60'
        } shadow-sm`}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Spend Trend</h3>
          <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>UGX (thousands)</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data}>
          <defs>
            <linearGradient id="costGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} vertical={false} />
          <XAxis dataKey="month" tick={{ fill: isDarkMode ? '#64748b' : '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: isDarkMode ? '#64748b' : '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
          <Tooltip content={<CustomTooltip isDark={isDarkMode} />} />
          <Line type="monotone" dataKey="cost" name="Cost (UGX k)" stroke="url(#costGrad)" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: '#2563EB' }} />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
