import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';
import {
  LayoutDashboard, Send, Users, Megaphone, BarChart3, FileText,
  Code2, Settings, CreditCard, ChevronLeft, ChevronRight, Zap,
  MessageSquare, LogOut, Bell, HelpCircle
} from 'lucide-react';
import { useDashboardStore, ActivePage } from '../store/dashboardStore';

const navItems: { icon: React.ElementType; label: string; page: ActivePage; badge?: string }[] = [
  { icon: LayoutDashboard, label: 'Dashboard', page: 'dashboard' },
  { icon: Send, label: 'Send SMS', page: 'send-sms', badge: 'NEW' },
  { icon: Users, label: 'Contacts', page: 'contacts' },
  { icon: Megaphone, label: 'Campaigns', page: 'campaigns' },
  { icon: BarChart3, label: 'Analytics', page: 'analytics' },
  { icon: FileText, label: 'Reports', page: 'reports' },
  { icon: Code2, label: 'API', page: 'api' },
  { icon: CreditCard, label: 'Billing', page: 'billing' },
  { icon: Settings, label: 'Settings', page: 'settings' },
];

export default function Sidebar() {
  const {
    activePage, setActivePage, sidebarCollapsed, setSidebarCollapsed,
    isDarkMode, setTutorialActive, setTutorialStep,
    appNotifications, setNotificationPanelOpen, isNotificationPanelOpen,
    userProfile,
  } = useDashboardStore();

  const unread = appNotifications.filter(n => !n.read).length;

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={`relative flex flex-col h-screen z-30 flex-shrink-0 ${isDarkMode
        ? 'bg-[#0F172A] border-r border-slate-800'
        : 'bg-white border-r border-slate-100'
        } shadow-xl`}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#10B981] flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-200/50">
          <MessageSquare className="w-5 h-5 text-white" />
        </div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <span className={`font-bold text-lg tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Ego<span className="text-[#2563EB]">SMS</span>
              </span>
              <div className="text-[10px] font-semibold text-[#10B981] tracking-widest uppercase">Pro Dashboard</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className={`absolute -right-3 top-20 w-6 h-6 rounded-full border flex items-center justify-center z-50 shadow-md transition-all ${isDarkMode
          ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
          : 'bg-white border-slate-200 text-slate-400 hover:text-slate-700'
          }`}
      >
        {sidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* AI Banner */}
      <AnimatePresence>
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            data-tutorial="ai-copilot-banner"
            className="mx-3 mt-4 p-3 rounded-xl bg-gradient-to-r from-[#2563EB]/10 to-[#10B981]/10 border border-[#2563EB]/20"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#10B981] flex items-center justify-center flex-shrink-0">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <div className={`text-[11px] font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>AI Copilot Active</div>
                <div className="text-[10px] text-[#10B981] font-medium">Monitoring your campaigns</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav Items */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto scrollbar-hide">
        {navItems.map((item, index) => {
          const isActive = activePage === item.page;
          return (
            <motion.button
              key={item.page}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setActivePage(item.page)}
              data-tutorial={`nav-${item.page}`}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${isActive
                ? 'bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white shadow-lg shadow-blue-500/25'
                : isDarkMode
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
            >
              <item.icon className={`w-4.5 h-4.5 flex-shrink-0 ${isActive ? 'text-white' : ''}`} style={{ width: '18px', height: '18px' }} />
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 text-left"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {!sidebarCollapsed && item.badge && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#10B981] text-white">
                  {item.badge}
                </span>
              )}
              {sidebarCollapsed && (
                <div className={`absolute left-full ml-2 px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 ${isDarkMode ? 'bg-slate-700 text-white' : 'bg-slate-900 text-white'
                  }`}>
                  {item.label}
                </div>
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className={`p-3 border-t space-y-1 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
        <button
          onClick={() => { setTutorialActive(true); setTutorialStep(0); }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
        >
          <HelpCircle style={{ width: '18px', height: '18px' }} className="flex-shrink-0" />
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Interactive Tour
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        <button
          onClick={() => setNotificationPanelOpen(!isNotificationPanelOpen)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isNotificationPanelOpen
            ? 'bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white shadow-md'
            : isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
        >
          <Bell style={{ width: '18px', height: '18px' }} className="flex-shrink-0" />
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 text-left">
                Notifications
              </motion.span>
            )}
          </AnimatePresence>
          {!sidebarCollapsed && unread > 0 && (
            <motion.span
              key={unread}
              initial={{ scale: 0.4 }}
              animate={{ scale: 1 }}
              className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${isNotificationPanelOpen ? 'bg-white/30 text-white' : 'bg-red-500 text-white'
                }`}
            >
              {unread > 9 ? '9+' : unread}
            </motion.span>
          )}
          {!sidebarCollapsed && unread === 0 && (
            <span className={`ml-auto text-[10px] font-semibold ${isNotificationPanelOpen ? 'text-white/60' : isDarkMode ? 'text-slate-600' : 'text-slate-300'
              }`}>✓</span>
          )}
        </button>

        {/* User Profile */}
        <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mt-2 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#2563EB] to-[#10B981] flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
            {userProfile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 min-w-0">
                <div className={`text-xs font-semibold truncate ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{userProfile.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{userProfile.email}</div>
              </motion.div>
            )}
          </AnimatePresence>
          {!sidebarCollapsed && (
            <LogOut className="w-3.5 h-3.5 text-slate-400 hover:text-red-400 cursor-pointer transition-colors flex-shrink-0" />
          )}
        </div>
      </div>
    </motion.aside>
  );
}
