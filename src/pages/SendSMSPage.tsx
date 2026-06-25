import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Users, User, Calendar, Sparkles, ChevronDown, Clock, CheckCircle2 } from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';

const SMS_TYPES = [
  { key: 'single', label: 'Single SMS', icon: User, desc: 'Send to one number' },
  { key: 'bulk', label: 'Bulk SMS', icon: Users, desc: 'Send to many at once' },
  { key: 'custom', label: 'Custom SMS', icon: Sparkles, desc: 'Personalized messages' },
  { key: 'scheduled', label: 'Scheduled SMS', icon: Calendar, desc: 'Send at a specific time' },
];

export default function SendSMSPage() {
  const { isDarkMode, addNotification } = useDashboardStore();
  const [smsType, setSmsType] = useState('bulk');
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] = useState('');
  const [sender, setSender] = useState('EGOSMS');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [sending, setSending] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [showAISuggest, setShowAISuggest] = useState(false);

  const charCount = message.length;
  const smsCount = Math.ceil(charCount / 160) || 1;
  const remaining = smsCount * 160 - charCount;

  const handleAISuggest = () => {
    setShowAISuggest(true);
    setTimeout(() => {
      setAiSuggestions([
        '🎉 Hi {name}! Exclusive offer just for you — 20% off your next purchase at EgoShop. Valid till Nov 30. Reply STOP to opt out.',
        '⚠️ Dear {name}, your account needs attention. Please login at egosms.co within 24hrs to avoid interruption. Call 0800-EGO for help.',
        '📅 Reminder: Your appointment with {business} is tomorrow at {time}. Reply YES to confirm or call us to reschedule. Thank you!',
        '🚀 {name}, your order #{order_id} has been dispatched! Track it at track.egosms.co. Delivery: 2-3 business days. Questions? Reply here.',
      ]);
    }, 800);
  };

  const handleSend = () => {
    if (!message.trim()) {
      addNotification({ type: 'error', title: 'Message Required', message: 'Please enter a message before sending.' });
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      addNotification({
        type: 'success',
        title: isScheduled ? '📅 Campaign Scheduled!' : '✅ SMS Sent Successfully!',
        message: isScheduled
          ? `Scheduled for ${scheduleDate} · ${smsCount} credit(s) per recipient`
          : `Queued to ${smsType === 'single' ? '1 recipient' : '2,450 recipients'} · ${smsCount * (smsType === 'single' ? 1 : 2450)} credits used`,
      });
      setMessage('');
    }, 1500);
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* SMS Type Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {SMS_TYPES.map((type) => (
          <motion.button
            key={type.key}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setSmsType(type.key)}
            className={`p-4 rounded-2xl border text-left transition-all ${
              smsType === type.key
                ? 'bg-gradient-to-br from-[#2563EB]/10 to-[#10B981]/10 border-[#2563EB]/40 shadow-md'
                : isDarkMode
                ? 'bg-[#1E293B] border-slate-700 hover:border-slate-600'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 ${
              smsType === type.key
                ? 'bg-gradient-to-br from-[#2563EB] to-[#10B981]'
                : isDarkMode ? 'bg-slate-700' : 'bg-slate-100'
            }`}>
              <type.icon className={`w-4 h-4 ${smsType === type.key ? 'text-white' : isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
            </div>
            <div className={`text-xs font-bold ${smsType === type.key ? 'text-[#2563EB]' : isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
              {type.label}
            </div>
            <div className={`text-[10px] mt-0.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{type.desc}</div>
          </motion.button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Compose Form */}
        <div className={`md:col-span-2 rounded-2xl border p-6 ${isDarkMode ? 'bg-[#1E293B] border-slate-700/60' : 'bg-white border-slate-200/60'} shadow-sm`}>
          <h3 className={`text-sm font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Compose Message</h3>

          <div className="space-y-4">
            {/* Sender ID */}
            <div>
              <label className={`text-xs font-semibold mb-1.5 block ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Sender ID</label>
              <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <input
                  value={sender}
                  onChange={(e) => setSender(e.target.value.slice(0, 11))}
                  className={`flex-1 text-sm bg-transparent outline-none font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                  placeholder="EGOSMS"
                />
                <span className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{sender.length}/11</span>
              </div>
            </div>

            {/* Recipients */}
            <div>
              <label className={`text-xs font-semibold mb-1.5 block ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                {smsType === 'single' ? 'Phone Number' : 'Recipients'}
              </label>
              {smsType === 'single' ? (
                <input
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="+256 7XX XXX XXX"
                  className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                    isDarkMode
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600 focus:border-blue-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-400'
                  }`}
                />
              ) : (
                <div className={`flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer ${
                  isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div>
                    <div className={`text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>All Contacts (8,420)</div>
                    <div className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>or select a group</div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>
              )}
            </div>

            {/* Message */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={`text-xs font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Message</label>
                <button
                  onClick={handleAISuggest}
                  className="flex items-center gap-1 text-[10px] font-semibold text-[#2563EB] hover:text-[#10B981] transition-colors"
                >
                  <Sparkles className="w-3 h-3" />
                  AI Suggest
                </button>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                placeholder="Type your message here... Use {name} for personalization"
                className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none transition-all ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600 focus:border-blue-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-400'
                }`}
              />
              <div className={`flex items-center justify-between mt-1.5 text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                <span>{charCount} characters · {smsCount} SMS</span>
                <span>{remaining} remaining in current SMS</span>
              </div>
            </div>

            {/* AI Suggestions */}
            <AnimatePresence>
              {showAISuggest && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>AI-Generated Templates</span>
                  </div>
                  {aiSuggestions.length === 0 ? (
                    <div className="flex items-center gap-2 text-xs text-[#2563EB]">
                      <div className="w-3 h-3 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
                      Generating smart templates...
                    </div>
                  ) : (
                    aiSuggestions.map((s, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        onClick={() => { setMessage(s); setShowAISuggest(false); }}
                        className={`w-full text-left text-xs p-3 rounded-xl border transition-all hover:border-[#2563EB]/40 ${
                          isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        {s}
                      </motion.button>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Schedule Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsScheduled(!isScheduled)}
                  className={`w-10 h-5.5 rounded-full transition-all duration-300 relative ${isScheduled ? 'bg-gradient-to-r from-[#2563EB] to-[#10B981]' : isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}
                  style={{ height: '22px' }}
                >
                  <motion.div
                    animate={{ x: isScheduled ? 20 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute top-1 w-3.5 h-3.5 bg-white rounded-full shadow-sm"
                  />
                </button>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Schedule for later</span>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {isScheduled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <input
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none ${
                      isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Send Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSend}
              disabled={sending}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white font-bold text-sm shadow-lg shadow-blue-500/25 disabled:opacity-60 transition-all"
            >
              {sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {isScheduled ? 'Schedule Campaign' : 'Send Now'}
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* Preview & Credits Panel */}
        <div className="space-y-4">
          {/* SMS Preview */}
          <div className={`rounded-2xl border p-5 ${isDarkMode ? 'bg-[#1E293B] border-slate-700/60' : 'bg-white border-slate-200/60'} shadow-sm`}>
            <h3 className={`text-sm font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Preview</h3>
            <div className="relative mx-auto w-40">
              <div className={`rounded-2xl border-2 overflow-hidden ${isDarkMode ? 'border-slate-600' : 'border-slate-300'}`} style={{ aspectRatio: '9/16' }}>
                <div className="bg-slate-900 h-8 flex items-center justify-center">
                  <div className="w-12 h-1 bg-slate-600 rounded-full" />
                </div>
                <div className="bg-slate-800 flex-1 p-3">
                  <div className="bg-[#25D366] rounded-2xl rounded-tl-sm p-2.5 max-w-[90%]">
                    <div className="text-[8px] text-white font-medium leading-relaxed">
                      {message || 'Your message will appear here...'}
                    </div>
                  </div>
                  <div className="text-[6px] text-slate-500 mt-1">From: {sender}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Cost Estimator */}
          <div className={`rounded-2xl border p-5 ${isDarkMode ? 'bg-[#1E293B] border-slate-700/60' : 'bg-white border-slate-200/60'} shadow-sm`}>
            <h3 className={`text-sm font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Cost Estimate</h3>
            <div className="space-y-2.5">
              {[
                { label: 'Recipients', value: smsType === 'single' ? '1' : '8,420' },
                { label: 'SMS per recipient', value: smsCount.toString() },
                { label: 'Total SMS', value: smsType === 'single' ? smsCount.toString() : (smsCount * 8420).toLocaleString() },
                { label: 'Cost per SMS', value: 'UGX 20' },
                { label: 'Total Cost', value: `UGX ${(smsCount * (smsType === 'single' ? 1 : 8420) * 20).toLocaleString()}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{label}</span>
                  <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{value}</span>
                </div>
              ))}
            </div>
            <div className={`mt-3 pt-3 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                <span className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Balance: <strong className={isDarkMode ? 'text-green-400' : 'text-green-600'}>UGX 245,000</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className={`rounded-2xl border p-4 bg-gradient-to-br ${isDarkMode ? 'from-blue-900/20 to-green-900/20 border-blue-800/30' : 'from-blue-50 to-green-50 border-blue-100'}`}>
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
              <span className={`text-[11px] font-bold ${isDarkMode ? 'text-blue-300' : 'text-[#2563EB]'}`}>AI Tip</span>
            </div>
            <p className={`text-[11px] leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Best open rates occur between <strong>10AM–12PM EAT</strong> on weekdays. Schedule your campaign for Thursday morning for optimal engagement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
