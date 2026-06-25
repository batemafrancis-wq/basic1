import { motion } from 'framer-motion';
import { Sun, Moon, Search, Bell, Calendar, ChevronDown, Wifi } from 'lucide-react';
import { useDashboardStore, TimePeriod } from '../store/dashboardStore';

const periods: { key: TimePeriod; label: string; desc: string }[] = [
  { key: 'mtd', label: 'MTD', desc: 'Month to Date' },
  { key: 'ytd', label: 'YTD', desc: 'Year to Date' },
  { key: 'rolling90', label: '90D', desc: 'Rolling 90 Days' },
];

const pageLabels: Record<string, string> = {
  dashboard: 'Dashboard Overview',
  'send-sms': 'Send SMS',
  contacts: 'Contact Management',
  campaigns: 'Campaign Manager',
  analytics: 'Analytics & Insights',
  reports: 'Reports',
  api: 'API Integration',
  billing: 'Billing & Credits',
  settings: 'Account Settings',
};

export default function TopBar() {
  const { isDarkMode, toggleDarkMode, timePeriod, setTimePeriod, activePage } = useDashboardStore();

  return (
    <header className={`sticky top-0 z-20 h-16 flex items-center justify-between px-6 border-b backdrop-blur-xl ${isDarkMode
        ? 'bg-[#0F172A]/90 border-slate-800 text-white'
        : 'bg-white/90 border-slate-100 text-slate-900'
      }`}>
      {/* Left: Page Title */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            {pageLabels[activePage] || 'Dashboard'}
          </h1>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-xs text-[#10B981] font-medium">All systems operational</span>
          </div>
        </div>
      </div>

      {/* Center: Period Selector */}
      <div
        className={`flex items-center gap-1 p-1 rounded-xl backdrop-blur-xl border ${isDarkMode
            ? 'bg-slate-800/60 border-slate-700'
            : 'bg-slate-100/80 border-slate-200/60'
          }`}
        id="date-period-selector"
        data-tutorial="period-selector"
      >
        <Calendar className="w-4 h-4 text-slate-400 ml-1.5 flex-shrink-0" />
        {periods.map((p) => (
          <motion.button
            key={p.key}
            onClick={() => setTimePeriod(p.key)}
            className={`relative px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${timePeriod === p.key
                ? 'text-white'
                : isDarkMode
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            title={p.desc}
          >
            {timePeriod === p.key && (
              <motion.div
                layoutId="period-pill"
                className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#2563EB] to-[#10B981]"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
              />
            )}
            <span className="relative z-10">{p.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <button className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all ${isDarkMode
            ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-700'
          }`}>
          <Search className="w-4 h-4" />
          <span className="text-xs hidden md:block">Search...</span>
          <kbd className={`hidden md:block text-[10px] px-1.5 py-0.5 rounded border font-mono ${isDarkMode ? 'border-slate-600 text-slate-500' : 'border-slate-200 text-slate-400'
            }`}>⌘K</kbd>
        </button>

        {/* Network Status */}
        <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium ${isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-600'
          }`}>
          <Wifi className="w-3.5 h-3.5" />
          <span className="hidden md:block">Live</span>
        </div>

        {/* Notifications */}
        <button className={`relative w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${isDarkMode
            ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-700'
          }`}>
          <Bell className="w-4 h-4" />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">3</span>
        </button>

        {/* Dark Mode */}
        <button
          onClick={toggleDarkMode}
          className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${isDarkMode
              ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700'
              : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
            }`}
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Profile */}
        <button className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#10B981] flex items-center justify-center text-white text-xs font-bold">
            JM
          </div>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>
      </div>
    </header>
  );
}
