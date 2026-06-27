import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Play, BarChart3, Calendar, Users, CheckCircle2,
  Clock, Zap, Pause, Trash2, X, Send,
} from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';

// ── Status display config (includes 'paused' to prevent runtime crash) ───────
const STATUS_CFG = {
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700', dot: 'bg-green-500', icon: CheckCircle2 },
  running: { label: 'Running', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500', icon: Play },
  scheduled: { label: 'Scheduled', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', icon: Clock },
  paused: { label: 'Paused', color: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400', icon: Pause },
} as const;

type CampaignStatus = keyof typeof STATUS_CFG;

const SENDERS = ['EGOSMS', 'FLASH', 'CLINIC', 'DEALS', '256SHOP'];

export default function CampaignsPage() {
  const {
    isDarkMode, addNotification,
    campaigns, addCampaign, updateCampaign,
    requestRating,
  } = useDashboardStore();

  // New Campaign modal state
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [sender, setSender] = useState('EGOSMS');
  const [schedDate, setSchedDate] = useState('');
  const [schedTime, setSchedTime] = useState('10:00');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  // ── Derived live stats ──────────────────────────────────────────────────
  const total = campaigns.length;
  const running = campaigns.filter(c => c.status === 'running').length;
  const scheduled = campaigns.filter(c => c.status === 'scheduled').length;
  const avgRate = campaigns.filter(c => c.rate > 0).length > 0
    ? (campaigns.filter(c => c.rate > 0).reduce((s, c) => s + c.rate, 0) /
      campaigns.filter(c => c.rate > 0).length).toFixed(1)
    : '—';

  const isDark = isDarkMode;
  const card = `rounded-2xl border p-5 ${isDark ? 'bg-[#1E293B] border-slate-700/60' : 'bg-white border-slate-200/60'} shadow-sm`;
  const muted = `text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`;

  // ── Actions ─────────────────────────────────────────────────────────────
  const openModal = () => {
    setName(''); setSender('EGOSMS'); setSchedDate('');
    setSchedTime('10:00'); setMessage(''); setShowModal(true);
  };

  const handleCreate = () => {
    if (!name.trim()) {
      addNotification({ type: 'error', title: 'Required', message: 'Campaign name cannot be empty.' });
      return;
    }
    setSaving(true);
    setTimeout(() => {
      const isScheduled = !!schedDate;
      const dateStr = isScheduled
        ? new Date(`${schedDate}T${schedTime}`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

      addCampaign({
        name: name.trim(),
        sender,
        sent: 0,
        delivered: 0,
        rate: 0,
        status: isScheduled ? 'scheduled' : 'running',
        date: dateStr,
      });

      setSaving(false);
      setShowModal(false);
      addNotification({
        type: 'success',
        title: '🚀 Campaign Created!',
        message: `"${name.trim()}" is now ${isScheduled ? 'scheduled' : 'running'}.`,
      });
      // Ask for a rating
      setTimeout(() => requestRating('Creating a Campaign', (stars, _) => {
        console.info('campaign create rating:', stars);
      }), 500);
    }, 900);
  };

  const handlePause = (id: number, campaignName: string) => {
    updateCampaign(id, { status: 'paused' });
    addNotification({ type: 'warning', title: 'Campaign Paused', message: `"${campaignName}" has been paused.` });
  };

  const handleResume = (id: number, campaignName: string) => {
    updateCampaign(id, { status: 'running' });
    addNotification({ type: 'success', title: '▶ Campaign Resumed', message: `"${campaignName}" is now running.` });
  };

  const handleDelete = (id: number, campaignName: string) => {
    // Mark paused instead of removing (soft-delete preserves history)
    updateCampaign(id, { status: 'paused' });
    addNotification({ type: 'warning', title: 'Campaign Archived', message: `"${campaignName}" archived. Delete permanently via Reports.` });
  };

  const handleAIOptimize = () => {
    addNotification({
      type: 'info',
      title: '🤖 AI Optimizing…',
      message: 'Analysing delivery windows. Best time: Thu 10–11AM EAT.',
    });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Campaign Manager</h2>
          <p className={muted}>Manage, schedule and analyse your SMS campaigns</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAIOptimize}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${isDark ? 'border-blue-500/30 text-blue-400 hover:bg-blue-900/20' : 'border-blue-200 text-blue-600 hover:bg-blue-50'}`}
          >
            <Zap className="w-3.5 h-3.5" /> AI Optimize
          </button>
          <button
            onClick={openModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white text-xs font-bold shadow-md hover:opacity-90 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> New Campaign
          </button>
        </div>
      </div>

      {/* Live stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Campaigns', value: String(total), icon: BarChart3, color: 'from-blue-500 to-blue-600' },
          { label: 'Running Now', value: String(running), icon: Play, color: 'from-green-500 to-green-600' },
          { label: 'Scheduled', value: String(scheduled), icon: Calendar, color: 'from-amber-500 to-orange-500' },
          { label: 'Avg Delivery', value: avgRate === '—' ? '—' : `${avgRate}%`, icon: Users, color: 'from-violet-500 to-purple-600' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className={`rounded-xl border p-4 ${isDark ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}>
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center mb-2`}>
              <s.icon className="w-4 h-4 text-white" />
            </div>
            <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{s.value}</div>
            <div className={muted}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Campaign grid */}
      {campaigns.length === 0 ? (
        <div className={`${card} flex flex-col items-center justify-center py-16 gap-4`}>
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <BarChart3 className={`w-7 h-7 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
          </div>
          <div className="text-center">
            <p className={`text-sm font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No campaigns yet</p>
            <p className={`text-xs mt-1 ${muted}`}>Click "New Campaign" to create your first one.</p>
          </div>
          <button onClick={openModal} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white text-xs font-bold shadow-md">
            <Plus className="w-3.5 h-3.5" /> Create First Campaign
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence initial={false}>
            {campaigns.map((c, i) => {
              const cfg = STATUS_CFG[c.status as CampaignStatus] ?? STATUS_CFG.paused;
              return (
                <motion.div key={c.id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.06 }}
                  whileHover={{ y: -3 }}
                  className={`rounded-2xl border p-5 cursor-pointer group transition-all ${isDark
                      ? 'bg-[#1E293B] border-slate-700 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-900/20'
                      : 'bg-white border-slate-200 hover:border-blue-200 hover:shadow-lg'
                    }`}
                >
                  {/* Card header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0 pr-2">
                      <h4 className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{c.name}</h4>
                      <div className={`text-xs mt-0.5 font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{c.sender}</div>
                    </div>
                    <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${cfg.color}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${c.status === 'running' ? 'animate-pulse' : ''}`} />
                      {cfg.label}
                    </span>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { label: 'Sent', val: c.sent > 0 ? c.sent.toLocaleString() : '—' },
                      { label: 'Delivered', val: c.delivered > 0 ? c.delivered.toLocaleString() : '—' },
                      { label: 'Rate', val: c.rate > 0 ? `${c.rate}%` : '—', color: c.rate >= 95 ? 'text-[#10B981]' : c.rate > 0 ? 'text-amber-500' : '' },
                    ].map(m => (
                      <div key={m.label} className={`text-center p-2 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                        <div className={`text-sm font-bold ${m.color ?? (isDark ? 'text-white' : 'text-slate-900')}`}>{m.val}</div>
                        <div className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{m.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Progress bar */}
                  {c.rate > 0 && (
                    <div className="mb-4">
                      <div className={`h-1.5 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${c.rate}%` }}
                          transition={{ duration: 0.8, delay: i * 0.06 }}
                          className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#10B981]" />
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className={`flex items-center justify-between text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    <span>{c.date}</span>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-[#2563EB] font-semibold hover:underline flex items-center gap-0.5">
                        <Send className="w-2.5 h-2.5" /> View
                      </button>
                      {c.status === 'running' && (
                        <button onClick={() => handlePause(c.id, c.name)}
                          className="text-amber-500 font-semibold hover:underline flex items-center gap-0.5">
                          <Pause className="w-2.5 h-2.5" /> Pause
                        </button>
                      )}
                      {c.status === 'paused' && (
                        <button onClick={() => handleResume(c.id, c.name)}
                          className="text-green-500 font-semibold hover:underline flex items-center gap-0.5">
                          <Play className="w-2.5 h-2.5" /> Resume
                        </button>
                      )}
                      <button onClick={() => handleDelete(c.id, c.name)}
                        className="text-red-400 font-semibold hover:underline flex items-center gap-0.5">
                        <Trash2 className="w-2.5 h-2.5" /> Archive
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* New Campaign Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
              className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden ${isDark ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200'}`}>

              {/* Modal header */}
              <div className="bg-gradient-to-r from-[#2563EB] to-[#10B981] px-5 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">New Campaign</h3>
                  <p className="text-[10px] text-white/70 mt-0.5">Fill in the details to launch or schedule</p>
                </div>
                <button onClick={() => setShowModal(false)} className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/35 flex items-center justify-center transition-colors">
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Campaign name */}
                <div>
                  <label className={`text-xs font-semibold block mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Campaign Name <span className="text-red-400">*</span></label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Black Friday Sale"
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600 focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-400'}`} />
                </div>

                {/* Sender ID */}
                <div>
                  <label className={`text-xs font-semibold block mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Sender ID</label>
                  <select value={sender} onChange={e => setSender(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
                    {SENDERS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className={`text-xs font-semibold block mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Message <span className={`font-normal ${muted}`}>(optional preview)</span>
                  </label>
                  <textarea value={message} onChange={e => setMessage(e.target.value.slice(0, 160))} rows={3}
                    placeholder="Type your SMS message…"
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm resize-none outline-none transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600 focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-400'}`} />
                  <p className={`text-right text-[10px] mt-0.5 ${muted}`}>{message.length}/160</p>
                </div>

                {/* Schedule (optional) */}
                <div>
                  <label className={`text-xs font-semibold block mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Schedule <span className={`font-normal ${muted}`}>(leave empty to start immediately)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)}
                      className={`px-3 py-2.5 rounded-xl border text-sm outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`} />
                    <input type="time" value={schedTime} onChange={e => setSchedTime(e.target.value)}
                      disabled={!schedDate}
                      className={`px-3 py-2.5 rounded-xl border text-sm outline-none disabled:opacity-40 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`} />
                  </div>
                </div>

                {/* Status preview */}
                <div className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <div className={`w-2 h-2 rounded-full ${schedDate ? 'bg-amber-400' : 'bg-green-400 animate-pulse'}`} />
                  <div>
                    <p className={`text-[11px] font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      Status: <span className={schedDate ? 'text-amber-500' : 'text-[#10B981]'}>{schedDate ? 'Scheduled' : 'Will start immediately'}</span>
                    </p>
                    <p className={`text-[10px] mt-0.5 ${muted}`}>Sender: {sender}</p>
                  </div>
                </div>

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={handleCreate} disabled={!name.trim() || saving}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white text-sm font-bold shadow-lg disabled:opacity-50 transition-all">
                  {saving
                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating…</>
                    : <><Plus className="w-4 h-4" /> {schedDate ? 'Schedule Campaign' : 'Launch Campaign'}</>}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
