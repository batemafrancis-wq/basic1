import { motion } from 'framer-motion';
import React from 'react';
import CountUp from 'react-countup';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  change: number;
  changeLabel: string;
  icon: React.ElementType;
  iconBg: string;
  sparkline?: number[];
  isDarkMode: boolean;
  index: number;
  highlight?: boolean;
}

export default function KPICard({
  title, value, prefix, suffix, decimals = 0, change, changeLabel,
  icon: Icon, iconBg, sparkline, isDarkMode, index, highlight
}: KPICardProps) {
  const isPositive = change >= 0;
  const maxVal = sparkline ? Math.max(...sparkline) : 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: 'easeOut' }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`relative rounded-2xl p-5 border cursor-pointer group overflow-hidden ${
        highlight
          ? isDarkMode
            ? 'bg-gradient-to-br from-[#1e3a5f] to-[#0f2d1a] border-blue-500/30'
            : 'bg-gradient-to-br from-blue-50 to-green-50 border-blue-200/60'
          : isDarkMode
          ? 'bg-[#1E293B] border-slate-700/60'
          : 'bg-white border-slate-200/60'
      } shadow-sm hover:shadow-xl transition-all duration-300`}
    >
      {/* Background Glow */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl bg-gradient-to-br ${iconBg} opacity-[0.03]`} />

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br ${iconBg} shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold cursor-pointer ${
            isPositive
              ? isDarkMode ? 'bg-green-900/40 text-green-400' : 'bg-green-50 text-green-600'
              : isDarkMode ? 'bg-red-900/40 text-red-400' : 'bg-red-50 text-red-500'
          }`}
          title={`Compared to ${changeLabel}`}
        >
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {isPositive ? '+' : ''}{change}%
        </motion.div>
      </div>

      {/* Value */}
      <div className="mb-1">
        <div className={`text-2xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          {prefix}
          <CountUp
            end={value}
            duration={1.5}
            separator=","
            decimals={decimals}
            delay={index * 0.1}
          />
          {suffix}
        </div>
        <div className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{title}</div>
      </div>

      {/* Change Badge */}
      <div className={`text-[11px] font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
        vs {changeLabel}
      </div>

      {/* Sparkline */}
      {sparkline && (
        <div className="mt-4 flex items-end gap-0.5 h-10">
          {sparkline.map((val, i) => (
            <motion.div
              key={i}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: index * 0.1 + i * 0.05, duration: 0.4, ease: 'easeOut' }}
              style={{
                height: `${(val / maxVal) * 100}%`,
                originY: 1,
                flex: 1,
              }}
              className={`rounded-sm ${
                i === sparkline.length - 1
                  ? 'bg-gradient-to-t from-[#2563EB] to-[#10B981]'
                  : isDarkMode ? 'bg-slate-700' : 'bg-slate-100'
              }`}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
