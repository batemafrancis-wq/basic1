import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Smile, Meh, Frown, ChevronDown } from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';

const CATEGORIES = [
  'General Feedback',
  'Bug Report',
  'Feature Request',
  'Billing Issue',
  'Performance Issue',
  'Other',
];

type Mood = 'happy' | 'neutral' | 'unhappy';

export default function FeedbackWidget() {
  const { isDarkMode, addNotification } = useDashboardStore();
  const [open, setOpen] = useState(false);
  const [mood, setMood] = useState<Mood | null>(null);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = () => {
    if (!message.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setDone(true);
      addNotification({
        type: 'success',
        title: '💬 Feedback Received!',
        message: 'Our team will review it and get back to you within 24 hrs.',
      });
      setTimeout(() => {
        setOpen(false);
        setDone(false);
        setMood(null);
        setMessage('');
        setEmail('');
        setCategory(CATEGORIES[0]);
      }, 2000);
    }, 1200);
  };

  const MOODS: { key: Mood; icon: typeof Smile; label: string; color: string }[] = [
    { key: 'happy',   icon: Smile,  label: 'Happy',   color: 'text-green-500  border-green-400  bg-green-50  dark:bg-green-900/20'  },
    { key: 'neutral', icon: Meh,    label: 'Neutral',  color: 'text-amber-500  border-amber-400  bg-amber-50  dark:bg-amber-900/20'  },
    { key: 'unhappy', icon: Frown,  label: 'Unhappy',  color: 'text-red-500    border-red-400    bg-red-50    dark:bg-red-900/20'    },
  ];

  return (
    <>
      {/* Trigger tab — left edge */}
      <motion.button
        onClick={() => setOpen(true)}
        initial={{ x: 0 }}
        whileHover={{ x: 4 }}
        className={`fixed left-0 top-1/2 -translate-y-1/2 z-[90] flex items-center gap-2 pl-2.5 pr-3.5 py-2.5
          rounded-r-xl shadow-lg border border-l-0 text-xs font-bold transition-all
          ${isDarkMode
            ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
          }`}
        style={{ writingMode: 'initial' }}
      >
        <MessageCircle className="w-4 h-4 text-[#2563EB]" />
        <span
          className="text-[11px] font-bold"
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}
        >
          Feedback
        </span>
      </motion.button>

      {/* Slide-out panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-black/30 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ x: -420 }}
              animate={{ x: 0 }}
              exit={{ x: -420 }}
              transition={{ type: 'spring', stiffness: 340, damping: 30 }}
              className={`fixed left-0 top-0 h-full w-[380px] z-[210] shadow-2xl flex flex-col ${
                isDarkMode ? 'bg-[#0F172A] border-r border-slate-800' : 'bg-white border-r border-slate-200'
              }`}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-[#2563EB] to-[#10B981] px-5 py-4 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-white" />
                  <div>
                    <p className="text-sm font-bold text-white">Share Your Feedback</p>
                    <p className="text-[10px] text-white/70">Help us make EgoSMS better</p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/35 flex items-center justify-center transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {!done ? (
                  <>
                    {/* Mood selector */}
                    <div>
                      <p className={`text-xs font-semibold mb-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        How are you feeling about EgoSMS?
                      </p>
                      <div className="flex gap-3">
                        {MOODS.map((m) => (
                          <button
                            key={m.key}
                            onClick={() => setMood(m.key)}
                            className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all ${
                              mood === m.key
                                ? m.color + ' border-current'
                                : isDarkMode
                                  ? 'border-slate-700 text-slate-500 hover:border-slate-600'
                                  : 'border-slate-200 text-slate-400 hover:border-slate-300'
                            }`}
                          >
                            <m.icon className={`w-6 h-6 ${mood === m.key ? '' : ''}`} />
                            <span className="text-[10px] font-semibold">{m.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Category */}
                    <div>
                      <label className={`text-xs font-semibold block mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        Category
                      </label>
                      <div className={`relative flex items-center border rounded-xl px-3 py-2.5 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className={`flex-1 text-sm bg-transparent outline-none appearance-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                        >
                          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 pointer-events-none" />
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <label className={`text-xs font-semibold block mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        Your message <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={5}
                        placeholder="Describe your experience, issue or suggestion..."
                        className={`w-full px-3 py-2.5 rounded-xl border text-sm resize-none outline-none transition-all ${
                          isDarkMode
                            ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600 focus:border-blue-500'
                            : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-400'
                        }`}
                      />
                      <p className={`text-[10px] mt-1 text-right ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                        {message.length}/500
                      </p>
                    </div>

                    {/* Email (optional) */}
                    <div>
                      <label className={`text-xs font-semibold block mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        Email for follow-up <span className={`font-normal ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>(optional)</span>
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                          isDarkMode
                            ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600 focus:border-blue-500'
                            : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-400'
                        }`}
                      />
                    </div>

                    {/* Info box */}
                    <div className={`p-3 rounded-xl text-[11px] leading-relaxed ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-blue-50 text-blue-700'}`}>
                      💡 For urgent issues, use the chat bot or call <strong>+256 393 217 100</strong> (Mon–Fri, 8AM–6PM EAT)
                    </div>
                  </>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="h-full flex flex-col items-center justify-center gap-4 py-16"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, delay: 0.1 }}
                      className="w-16 h-16 rounded-full bg-gradient-to-br from-[#2563EB] to-[#10B981] flex items-center justify-center shadow-xl"
                    >
                      <Send className="w-7 h-7 text-white" />
                    </motion.div>
                    <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Sent! 🎉</p>
                    <p className={`text-sm text-center ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Thank you for helping us improve.<br />Our team will review your feedback shortly.
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              {!done && (
                <div className={`p-5 border-t flex-shrink-0 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={submit}
                    disabled={!message.trim() || submitting}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white text-sm font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all"
                  >
                    {submitting ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending...</>
                    ) : (
                      <><Send className="w-4 h-4" /> Send Feedback</>
                    )}
                  </motion.button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
