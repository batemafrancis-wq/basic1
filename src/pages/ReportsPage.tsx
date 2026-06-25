import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Download, Filter, Calendar, ChevronDown,
  TrendingUp, TrendingDown, CheckCircle2,
  BarChart3, Clock, Sparkles, X, RefreshCw,
  MessageSquare, Users, Zap, Globe,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { useDashboardStore } from '../store/dashboardStore';
import { ytdData, recentCampaigns } from '../data/mockData';
import CountUp from 'react-countup';

// ── Static data ──────────────────────────────────────────────────────────────

const REPORT_TYPES = [
  { key: 'delivery', label: 'Delivery Report', icon: CheckCircle2, color: 'from-emerald-500 to-green-600', desc: 'Per-message delivery status and timestamps' },
  { key: 'campaign', label: 'Campaign Report', icon: BarChart3, color: 'from-[#2563EB] to-blue-600', desc: 'Campaign reach, delivery rates and cost breakdown' },
  { key: 'network', label: 'Network Report', icon: Globe, color: 'from-violet-500 to-purple-600', desc: 'Performance split by telecom network' },
  { key: 'contacts', label: 'Contacts Report', icon: Users, color: 'from-amber-500 to-orange-500', desc: 'Contact growth, opt-outs and activity' },
  { key: 'billing', label: 'Billing Report', icon: Zap, color: 'from-pink-500 to-rose-600', desc: 'Credit usage, spend and top-up history' },
  { key: 'api', label: 'API Usage Report', icon: MessageSquare, color: 'from-cyan-500 to-teal-600', desc: 'API call volume, latency and error rates' },
] as const;

type ReportKey = typeof REPORT_TYPES[number]['key'];

const FORMATS = ['PDF', 'CSV', 'XLSX'] as const;
type Format = typeof FORMATS[number];

const RANGES = ['This Month', 'Last Month', 'Last 3 Months', 'Last 6 Months', 'Year to Date', 'Custom'] as const;
type Range = typeof RANGES[number];

const SCHEDULED = [
  { name: 'Monthly Delivery Summary', freq: 'Monthly · 1st', next: 'Nov 1, 2024', format: 'PDF', active: true },
  { name: 'Weekly Campaign Overview', freq: 'Weekly · Monday', next: 'Nov 4, 2024', format: 'CSV', active: true },
  { name: 'Network Performance Recap', freq: 'Monthly · 5th', next: 'Nov 5, 2024', format: 'XLSX', active: false },
];

// Mini sparkline dataset per report card
const sparklines: Record<ReportKey, { v: number }[]> = {
  delivery: [65, 70, 68, 75, 80, 78, 85, 82, 88, 92, 90, 95].map(v => ({ v })),
  campaign: [3, 5, 4, 6, 8, 7, 9, 11, 10, 12, 11, 13].map(v => ({ v })),
  network: [45, 44, 46, 45, 47, 46, 48, 45, 46, 47, 45, 45].map(v => ({ v })),
  contacts: [200, 220, 210, 250, 280, 260, 300, 320, 310, 350, 340, 380].map(v => ({ v })),
  billing: [50, 80, 60, 100, 90, 120, 110, 130, 100, 150, 140, 170].map(v => ({ v })),
  api: [300, 450, 400, 500, 480, 520, 600, 580, 640, 700, 680, 720].map(v => ({ v })),
};

const summaryStats = [
  { label: 'Total SMS Sent (YTD)', value: 212700, suffix: '', decimals: 0, trend: +12.4, color: 'from-[#2563EB] to-blue-600', icon: MessageSquare },
  { label: 'Avg Delivery Rate', value: 95.05, suffix: '%', decimals: 2, trend: +0.3, color: 'from-emerald-500 to-green-600', icon: CheckCircle2 },
  { label: 'Total Spend (YTD)', value: 4254, suffix: 'K', decimals: 0, trend: +8.1, color: 'from-pink-500 to-rose-600', icon: Zap },
  { label: 'Active Campaigns', value: 14, suffix: '', decimals: 0, trend: +2, color: 'from-violet-500 to-purple-600', icon: BarChart3 },
];

// ── Tooltip component ─────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label, isDarkMode }: {
  active?: boolean; payload?: { value: number; name: string; color: string }[];
  label?: string; isDarkMode: boolean;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={`px-3 py-2 rounded-xl shadow-lg text-xs border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
      {label && <div className="font-semibold mb-1 text-[10px] text-slate-500">{label}</div>}
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="capitalize">{p.name}:</span>
          <span className="font-bold">{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const { isDarkMode, addNotification } = useDashboardStore();

  const [selectedRange, setSelectedRange] = useState<Range>('Year to Date');
  const [selectedFormat, setSelectedFormat] = useState<Format>('PDF');
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [modalReport, setModalReport] = useState<ReportKey>('delivery');
  const [downloading, setDownloading] = useState(false);
  const [showRangeDD, setShowRangeDD] = useState(false);
  const [showFmtDD, setShowFmtDD] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'table' | 'scheduled'>('overview');
  const [tableFilter, setTableFilter] = useState('all');
  const [scheduled, setScheduled] = useState(SCHEDULED.map(s => ({ ...s })));

  // shared style helpers
  const card = `rounded-2xl border ${isDarkMode ? 'bg-[#1E293B] border-slate-700/60' : 'bg-white border-slate-200/60'} shadow-sm`;
  const muted = `text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`;
  const labelC = `text-xs font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`;

  const openDownload = (key: ReportKey) => {
    setModalReport(key);
    setShowDownloadModal(true);
  };

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      setShowDownloadModal(false);
      const rpt = REPORT_TYPES.find(r => r.key === modalReport)!;
      addNotification({
        type: 'success',
        title: `📄 ${rpt.label} Ready`,
        message: `${selectedFormat} export for "${selectedRange}" is downloading.`,
      });
    }, 1800);
  };

  const toggleScheduled = (i: number) => setScheduled(prev =>
    prev.map((s, idx) => idx === i ? { ...s, active: !s.active } : s)
  );

  const filteredCampaigns = recentCampaigns.filter(c =>
    tableFilter === 'all' ? true : c.status === tableFilter
  );

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Reports</h2>
          <p className={muted}>Generate, export and schedule reports for your SMS activity</p>
        </div>

        {/* Global filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Date range dropdown */}
          <div className="relative">
            <button onClick={() => { setShowRangeDD(v => !v); setShowFmtDD(false); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-700'}`}>
              <Calendar className="w-3.5 h-3.5 text-[#2563EB]" />
              {selectedRange}
              <ChevronDown className={`w-3 h-3 transition-transform ${showRangeDD ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {showRangeDD && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  className={`absolute right-0 top-full mt-1.5 w-44 rounded-xl border shadow-xl z-50 overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                  {RANGES.map(r => (
                    <button key={r} onClick={() => { setSelectedRange(r); setShowRangeDD(false); }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-colors ${selectedRange === r ? 'text-[#2563EB] font-bold' : isDarkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'
                        }`}>
                      {r}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Format selector */}
          <div className="relative">
            <button onClick={() => { setShowFmtDD(v => !v); setShowRangeDD(false); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-700'}`}>
              <FileText className="w-3.5 h-3.5 text-[#10B981]" />
              {selectedFormat}
              <ChevronDown className={`w-3 h-3 transition-transform ${showFmtDD ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {showFmtDD && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  className={`absolute right-0 top-full mt-1.5 w-28 rounded-xl border shadow-xl z-50 overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                  {FORMATS.map(f => (
                    <button key={f} onClick={() => { setSelectedFormat(f); setShowFmtDD(false); }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-colors ${selectedFormat === f ? 'text-[#2563EB] font-bold' : isDarkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'
                        }`}>
                      {f}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button onClick={() => addNotification({ type: 'info', title: '🔄 Refreshing', message: 'Report data is being refreshed.' })}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white' : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'}`}>
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* ── Summary KPI row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {summaryStats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className={`${card} p-4`}>
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
              <s.icon className="w-4 h-4 text-white" />
            </div>
            <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              <CountUp end={s.value} decimals={s.decimals} duration={1.4} delay={i * 0.08} separator="," />
              {s.suffix && <span className="text-base ml-0.5">{s.suffix}</span>}
            </div>
            <div className={`text-xs mt-1 ${muted}`}>{s.label}</div>
            <div className={`flex items-center gap-1 mt-1 text-[11px] font-bold ${s.trend > 0 ? 'text-[#10B981]' : 'text-red-400'}`}>
              {s.trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {s.trend > 0 ? '+' : ''}{s.trend}% vs last period
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Tab bar ── */}
      <div className={`flex gap-1 p-1 rounded-xl border w-fit ${isDarkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
        {([
          { key: 'overview', label: 'Overview', icon: BarChart3 },
          { key: 'table', label: 'Campaign Detail', icon: FileText },
          { key: 'scheduled', label: 'Scheduled Reports', icon: Clock },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === t.key
              ? 'bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white shadow-sm'
              : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
              }`}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">

            {/* AI Insight banner */}
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              className={`rounded-2xl border p-4 flex items-start gap-3 ${isDarkMode ? 'bg-gradient-to-r from-blue-900/30 to-green-900/20 border-blue-800/30' : 'bg-gradient-to-r from-blue-50 to-green-50 border-blue-100'}`}>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#10B981] flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>AI Report Insight</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white">NEW</span>
                </div>
                <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Your YTD delivery rate of <strong className="text-[#10B981]">95.05%</strong> is{' '}
                  <strong>4.05% above the regional average</strong>. October campaigns drove the strongest month-on-month growth (+12.4%).
                  Airtel Uganda showed an 18% spike in failures on Oct 18 — consider excluding that network for time-sensitive sends.
                </p>
              </div>
            </motion.div>

            {/* Report type cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {REPORT_TYPES.map((rpt, i) => (
                <motion.div key={rpt.key} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  whileHover={{ y: -2 }}
                  className={`${card} p-5 group cursor-pointer`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${rpt.color} flex items-center justify-center shadow-md`}>
                      <rpt.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                      {selectedRange}
                    </span>
                  </div>

                  {/* Sparkline */}
                  <div className="h-10 mb-3 opacity-70">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={sparklines[rpt.key]} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id={`spark-${rpt.key}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="v" stroke="#2563EB" strokeWidth={1.5}
                          fill={`url(#spark-${rpt.key})`} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className={`text-sm font-bold mb-0.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{rpt.label}</div>
                  <div className={`text-[11px] mb-4 ${muted}`}>{rpt.desc}</div>

                  <button onClick={() => openDownload(rpt.key)}
                    className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-bold transition-all
                      ${isDarkMode
                        ? 'border-slate-600 text-slate-300 group-hover:border-blue-500/50 group-hover:text-blue-400'
                        : 'border-slate-200 text-slate-600 group-hover:border-blue-300 group-hover:text-[#2563EB]'}`}>
                    <Download className="w-3.5 h-3.5" />
                    Export {selectedFormat}
                  </button>
                </motion.div>
              ))}
            </div>

            {/* YTD Volume chart */}
            <div className={`${card} p-5`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Monthly SMS Volume — Year to Date</h3>
                  <p className={`text-xs mt-0.5 ${muted}`}>Sent vs Delivered breakdown</p>
                </div>
                <button onClick={() => openDownload('delivery')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold text-[#2563EB] border-blue-200 dark:border-blue-800/40 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
                  <Download className="w-3.5 h-3.5" /> Export
                </button>
              </div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ytdData} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#f1f5f9'} vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<ChartTooltip isDarkMode={isDarkMode} />} />
                    <Bar dataKey="sent" name="Sent" fill="#2563EB" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="delivered" name="Delivered" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="failed" name="Failed" fill="#F43F5E" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div className="flex items-center justify-center gap-5 mt-3">
                {[['#2563EB', 'Sent'], ['#10B981', 'Delivered'], ['#F43F5E', 'Failed']].map(([c, l]) => (
                  <div key={l} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} />
                    <span className={`text-[11px] font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{l}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Network performance chart */}
            <div className={`${card} p-5`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Network Performance Breakdown</h3>
                  <p className={`text-xs mt-0.5 ${muted}`}>SMS share and delivery rates per operator</p>
                </div>
                <button onClick={() => openDownload('network')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold text-[#2563EB] border-blue-200 dark:border-blue-800/40 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
                  <Download className="w-3.5 h-3.5" /> Export
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { name: 'MTN Uganda', share: 45, rate: 96.2, sent: 95715, color: '#FBBF24' },
                  { name: 'Airtel Uganda', share: 35, rate: 93.8, sent: 74445, color: '#EF4444' },
                  { name: 'Africell', share: 12, rate: 95.1, sent: 25524, color: '#8B5CF6' },
                  { name: 'Smile Telecom', share: 8, rate: 94.5, sent: 17016, color: '#06B6D4' },
                ].map((n, i) => (
                  <motion.div key={n.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: n.color }} />
                        <span className={`text-xs font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{n.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] ${muted}`}>{n.sent.toLocaleString()} SMS</span>
                        <span className={`text-xs font-bold ${n.rate >= 95 ? 'text-[#10B981]' : 'text-amber-500'}`}>{n.rate}%</span>
                        <span className={`text-[10px] font-semibold ${muted}`}>{n.share}%</span>
                      </div>
                    </div>
                    <div className={`h-2 rounded-full ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${n.share}%` }} transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.08 }}
                        className="h-full rounded-full" style={{ background: n.color }} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Cost trend line */}
            <div className={`${card} p-5`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Cost Trend (UGX '000)</h3>
                  <p className={`text-xs mt-0.5 ${muted}`}>Monthly spend over the year</p>
                </div>
                <button onClick={() => openDownload('billing')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold text-[#2563EB] border-blue-200 dark:border-blue-800/40 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
                  <Download className="w-3.5 h-3.5" /> Export
                </button>
              </div>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ytdData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#f1f5f9'} vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}
                      tickFormatter={v => `${v}K`} />
                    <Tooltip content={<ChartTooltip isDarkMode={isDarkMode} />} />
                    <Line type="monotone" dataKey="cost" name="Cost (K UGX)" stroke="#10B981"
                      strokeWidth={2.5} dot={{ fill: '#10B981', r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── CAMPAIGN DETAIL TABLE TAB ── */}
        {activeTab === 'table' && (
          <motion.div key="table" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className={`rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-[#1E293B] border-slate-700/60' : 'bg-white border-slate-200/60'} shadow-sm`}>
              {/* Table header */}
              <div className={`flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Campaign Performance Detail</h3>
                <div className="flex items-center gap-2">
                  {/* Status filter */}
                  <div className={`flex gap-1 p-1 rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                    {['all', 'completed', 'running', 'scheduled'].map(f => (
                      <button key={f} onClick={() => setTableFilter(f)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold capitalize transition-all ${tableFilter === f ? 'bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white' : isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {f}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => openDownload('campaign')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${isDarkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                    <Download className="w-3.5 h-3.5" /> Export
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`text-[11px] font-semibold border-b ${isDarkMode ? 'border-slate-700 text-slate-500' : 'border-slate-100 text-slate-400'}`}>
                      {['Campaign', 'Sender ID', 'Sent', 'Delivered', 'Failed', 'Rate', 'Cost (UGX)', 'Date', 'Status'].map(h => (
                        <th key={h} className="text-left px-5 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCampaigns.map((c, i) => {
                      const failed = c.sent - c.delivered;
                      const cost = c.sent * 20;
                      return (
                        <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                          className={`border-b group transition-colors ${isDarkMode ? 'border-slate-800 hover:bg-slate-800/50' : 'border-slate-50 hover:bg-slate-50'}`}>
                          <td className="px-5 py-3.5">
                            <span className={`text-xs font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{c.name}</span>
                          </td>
                          <td className={`px-5 py-3.5 text-xs font-mono font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{c.sender}</td>
                          <td className={`px-5 py-3.5 text-xs font-mono ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{c.sent.toLocaleString()}</td>
                          <td className="px-5 py-3.5 text-xs font-mono text-[#10B981] font-bold">{c.delivered > 0 ? c.delivered.toLocaleString() : '—'}</td>
                          <td className={`px-5 py-3.5 text-xs font-mono ${failed > 0 ? 'text-red-400 font-bold' : muted}`}>{failed > 0 ? failed.toLocaleString() : '—'}</td>
                          <td className="px-5 py-3.5">
                            {c.rate > 0 ? (
                              <div className="flex items-center gap-2">
                                <div className={`h-1.5 w-12 rounded-full ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                                  <div className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#10B981]" style={{ width: `${c.rate}%` }} />
                                </div>
                                <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{c.rate.toFixed(1)}%</span>
                              </div>
                            ) : <span className={muted}>—</span>}
                          </td>
                          <td className={`px-5 py-3.5 text-xs font-mono ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                            {c.status !== 'scheduled' ? `UGX ${cost.toLocaleString()}` : '—'}
                          </td>
                          <td className={`px-5 py-3.5 text-xs ${muted}`}>{c.date}</td>
                          <td className="px-5 py-3.5">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full capitalize ${c.status === 'completed' ? isDarkMode ? 'bg-green-900/40 text-green-400' : 'bg-green-100 text-green-700'
                              : c.status === 'running' ? isDarkMode ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-100 text-blue-700'
                                : isDarkMode ? 'bg-amber-900/40 text-amber-400' : 'bg-amber-100 text-amber-700'
                              }`}>{c.status}</span>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table footer */}
              <div className={`px-5 py-3 border-t flex items-center justify-between text-xs ${isDarkMode ? 'border-slate-700 text-slate-500' : 'border-slate-100 text-slate-400'}`}>
                <span>Showing {filteredCampaigns.length} campaigns</span>
                <div className="flex items-center gap-1.5 text-[#10B981] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {filteredCampaigns.filter(c => c.status === 'completed').length} completed · Total sent: {filteredCampaigns.reduce((a, c) => a + c.sent, 0).toLocaleString()}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── SCHEDULED REPORTS TAB ── */}
        {activeTab === 'scheduled' && (
          <motion.div key="scheduled" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className={`rounded-2xl border p-5 ${isDarkMode ? 'bg-[#1E293B] border-slate-700/60' : 'bg-white border-slate-200/60'} shadow-sm`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Scheduled Reports</h3>
                  <p className={`text-xs mt-0.5 ${muted}`}>Automatically generated and emailed on a schedule</p>
                </div>
                <button onClick={() => addNotification({ type: 'info', title: '📅 Schedule Report', message: 'Report scheduling wizard coming soon.' })}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white text-xs font-bold shadow-md">
                  <Clock className="w-3.5 h-3.5" /> New Schedule
                </button>
              </div>

              <div className="space-y-3">
                {scheduled.map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                    className={`flex items-center gap-4 px-4 py-4 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.active ? 'bg-gradient-to-br from-[#2563EB] to-[#10B981]' : isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                      <FileText className={`w-5 h-5 ${s.active ? 'text-white' : isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{s.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] ${muted}`}>{s.freq}</span>
                        <span className="text-[10px] text-slate-300">·</span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-600'}`}>{s.format}</span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className={`text-[10px] ${muted}`}>Next delivery</div>
                      <div className={`text-xs font-semibold mt-0.5 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{s.next}</div>
                    </div>

                    {/* Toggle */}
                    <button onClick={() => toggleScheduled(i)}
                      className={`rounded-full relative transition-all duration-300 flex-shrink-0 ${s.active ? 'bg-gradient-to-r from-[#2563EB] to-[#10B981]' : isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}
                      style={{ width: 40, height: 22 }}>
                      <motion.div animate={{ x: s.active ? 20 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="absolute top-1 w-3.5 h-3.5 bg-white rounded-full shadow-sm" />
                    </button>

                    <button onClick={() => addNotification({ type: 'success', title: '📧 Sent Now', message: `"${s.name}" has been sent to your inbox.` })}
                      className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border transition-all flex-shrink-0 ${isDarkMode ? 'border-slate-600 text-slate-300 hover:text-white' : 'border-slate-200 text-slate-600 hover:text-slate-900'}`}>
                      <Download className="w-3 h-3" /> Send Now
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Email recipients */}
            <div className={`rounded-2xl border p-5 ${isDarkMode ? 'bg-[#1E293B] border-slate-700/60' : 'bg-white border-slate-200/60'} shadow-sm`}>
              <h3 className={`text-sm font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Report Recipients</h3>
              <p className={`text-xs mb-4 ${muted}`}>Scheduled reports will be emailed to these addresses</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {['john.mukasa@pahappa.com', 'cto@pahappa.com'].map(email => (
                  <div key={email} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
                    {email}
                    <button onClick={() => addNotification({ type: 'warning', title: 'Removed', message: `${email} removed from report recipients.` })}
                      className="text-slate-400 hover:text-red-400 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input placeholder="Add email address..."
                  className={`flex-1 px-3 py-2.5 rounded-xl border text-sm outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'}`} />
                <button onClick={() => addNotification({ type: 'success', title: '✅ Added', message: 'New recipient added to scheduled reports.' })}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white text-xs font-bold">
                  Add
                </button>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* ── Download Modal ── */}
      <AnimatePresence>
        {showDownloadModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={e => e.target === e.currentTarget && setShowDownloadModal(false)}>
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
              className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200'}`}>
              {/* Modal header */}
              <div className={`flex items-center justify-between px-5 py-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${REPORT_TYPES.find(r => r.key === modalReport)?.color} flex items-center justify-center`}>
                    {(() => {
                      const Ic = REPORT_TYPES.find(r => r.key === modalReport)?.icon ?? FileText;
                      return <Ic className="w-4 h-4 text-white" />;
                    })()}
                  </div>
                  <div>
                    <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      Export {REPORT_TYPES.find(r => r.key === modalReport)?.label}
                    </h3>
                    <p className={`text-[10px] mt-0.5 ${muted}`}>{REPORT_TYPES.find(r => r.key === modalReport)?.desc}</p>
                  </div>
                </div>
                <button onClick={() => setShowDownloadModal(false)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Format */}
                <div>
                  <label className={labelC + ' block mb-2'}>Format</label>
                  <div className="flex gap-2">
                    {FORMATS.map(f => (
                      <button key={f} onClick={() => setSelectedFormat(f)}
                        className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${selectedFormat === f ? 'bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white border-transparent shadow-md' : isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date range */}
                <div>
                  <label className={labelC + ' block mb-2'}>Date Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    {RANGES.filter(r => r !== 'Custom').map(r => (
                      <button key={r} onClick={() => setSelectedRange(r)}
                        className={`py-2 px-3 rounded-xl border text-[11px] font-semibold text-left transition-all ${selectedRange === r ? 'bg-gradient-to-br from-[#2563EB]/10 to-[#10B981]/10 border-[#2563EB]/40 text-[#2563EB]' : isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className={`p-3 rounded-xl flex items-center gap-3 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <Filter className="w-4 h-4 text-[#2563EB] flex-shrink-0" />
                  <span className={`text-[11px] ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Exporting <strong>{REPORT_TYPES.find(r => r.key === modalReport)?.label}</strong> as <strong>{selectedFormat}</strong> for <strong>{selectedRange}</strong>
                  </span>
                </div>

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleDownload} disabled={downloading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white font-bold text-sm shadow-lg shadow-blue-500/20 disabled:opacity-60">
                  {downloading
                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating Report...</>
                    : <><Download className="w-4 h-4" /> Download {selectedFormat}</>}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
