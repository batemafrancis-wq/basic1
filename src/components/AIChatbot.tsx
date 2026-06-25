import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, X, Send, Sparkles, Bot, User,
  Zap, RefreshCw, Minimize2, ChevronDown,
  Phone, Mail, Clock, LifeBuoy,
} from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  showSupport?: boolean;  // renders the contact-support card inline
}

const QUICK_ACTIONS = [
  '💳 Check Balance',
  '📊 Delivery Rate',
  '📤 How to Send',
  '👥 Add Contacts',
  '⏰ Schedule SMS',
  '💰 Top Up',
  '🎧 Talk to Support',
];

function fmt(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br />');
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline support card rendered below a message
// ─────────────────────────────────────────────────────────────────────────────
function SupportCard({ isDarkMode }: { isDarkMode: boolean }) {
  const { addNotification, setActivePage } = useDashboardStore();
  const [ticketSent, setTicketSent] = useState(false);
  const [desc, setDesc] = useState('');

  const submitTicket = () => {
    if (!desc.trim()) return;
    setTicketSent(true);
    addNotification({
      type: 'success',
      title: '🎫 Ticket Submitted!',
      message: 'Support will respond within 2 hours (Mon–Fri, 8AM–6PM EAT).',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mt-2 rounded-xl border overflow-hidden text-xs ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-blue-50 border-blue-100'
        }`}
    >
      <div className="bg-gradient-to-r from-[#2563EB] to-[#10B981] px-3 py-2 flex items-center gap-2">
        <LifeBuoy className="w-3.5 h-3.5 text-white" />
        <span className="text-white font-bold text-[11px]">Contact Support</span>
      </div>

      {!ticketSent ? (
        <div className="p-3 space-y-2.5">
          {/* Quick contact options */}
          <div className="grid grid-cols-2 gap-2">
            <a href="tel:+256393217100"
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-[11px] font-semibold transition-all ${isDarkMode ? 'border-slate-700 text-slate-300 hover:border-blue-500 hover:text-blue-400' : 'border-blue-200 text-blue-700 hover:bg-blue-100'
                }`}>
              <Phone className="w-3 h-3" /> +256 393 217 100
            </a>
            <a href="mailto:support@pahappa.com"
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-[11px] font-semibold transition-all ${isDarkMode ? 'border-slate-700 text-slate-300 hover:border-blue-500 hover:text-blue-400' : 'border-blue-200 text-blue-700 hover:bg-blue-100'
                }`}>
              <Mail className="w-3 h-3" /> Email Support
            </a>
          </div>

          <div className={`flex items-center gap-1.5 text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            <Clock className="w-3 h-3 flex-shrink-0" />
            Mon–Fri · 8AM–6PM East Africa Time
          </div>

          {/* Quick ticket form */}
          <div className={`pt-2 border-t ${isDarkMode ? 'border-slate-700' : 'border-blue-200'}`}>
            <p className={`text-[10px] font-semibold mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Or open a support ticket:
            </p>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              rows={2}
              placeholder="Describe your issue..."
              className={`w-full px-2.5 py-2 rounded-lg border text-[11px] resize-none outline-none ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-600' : 'bg-white border-blue-200 text-slate-800 placeholder-slate-400'
                }`}
            />
            <button onClick={submitTicket}
              className="mt-1.5 w-full py-1.5 rounded-lg bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white text-[11px] font-bold">
              Submit Ticket
            </button>
          </div>

          {/* Billing shortcut */}
          <button onClick={() => { setActivePage('billing'); }}
            className={`w-full text-center text-[10px] font-semibold ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-[#2563EB] hover:underline'}`}>
            Go to Billing page →
          </button>
        </div>
      ) : (
        <div className="p-3 text-center">
          <p className="text-[#10B981] font-bold text-[11px]">✅ Ticket submitted!</p>
          <p className={`text-[10px] mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Expect a reply within 2 hours.
          </p>
        </div>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main chatbot
// ─────────────────────────────────────────────────────────────────────────────
export default function AIChatbot() {
  const store = useDashboardStore();
  const { isChatOpen, setChatOpen, isDarkMode, activePage } = store;

  const [messages, setMessages] = useState<Message[]>([{
    id: '0',
    role: 'assistant',
    content: `👋 Hi there! I'm **EgoBot**, your AI co-pilot for EgoSMS.\n\nI have live access to your account data — just ask me anything:\n- 💳 Balance & credits\n- 📊 Delivery stats\n- 📤 How to send / schedule SMS\n- 👥 Contact management\n- 🎧 Connect to human support`,
    timestamp: new Date(),
  }]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [minimized, setMinimized] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);
  useEffect(() => { if (isChatOpen && !minimized) setTimeout(() => inputRef.current?.focus(), 300); }, [isChatOpen, minimized]);

  // Context-aware proactive tip when switching pages
  const lastPage = useRef(activePage);
  useEffect(() => {
    if (!isChatOpen || activePage === lastPage.current) return;
    lastPage.current = activePage;
    const tips: Partial<Record<typeof activePage, string>> = {
      analytics: `📈 You're on Analytics. Your live delivery rate is **${store.smsStats.deliveryRate}%** — ${store.smsStats.deliveryRate >= 95 ? 'above' : 'below'} the 95% industry benchmark.\n\nWant a deeper breakdown by network?`,
      billing: `💳 Your current balance is **UGX ${store.balanceUGX.toLocaleString()}** (${store.smsCredits.toLocaleString()} credits). Need to top up?`,
      contacts: `👥 You have **${store.contacts.length} contacts** across your lists. Want tips on growing your audience?`,
      campaigns: `📢 You have **${store.campaigns.length} campaigns** on record. ${store.campaigns.filter(c => c.status === 'running').length} are currently running.`,
    };
    const tip = tips[activePage];
    if (tip) setTimeout(() => pushBot(tip), 1500);
  }, [activePage]);

  const pushBot = (content: string, showSupport = false) => {
    const id = Math.random().toString(36).slice(2);
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { id, role: 'assistant', content, timestamp: new Date(), showSupport }]);
    }, 800 + Math.random() * 600);
  };

  // ── AI response engine reading live store ─────────────────────────────────
  const getResponse = (msg: string): [string, boolean] => {
    const s = store;  // live snapshot
    const lower = msg.toLowerCase();

    // Balance / credits
    if (/(balance|credit|how much|money)/.test(lower))
      return [`💳 **Your live account balance:**\n\n- Balance: **UGX ${s.balanceUGX.toLocaleString()}**\n- SMS Credits: **${s.smsCredits.toLocaleString()} credits**\n- Cost per SMS: UGX 20\n\nAt current usage you have enough for roughly **${Math.floor(s.smsCredits)} more sends**.\n\n[Go to Billing →]`, false];

    // Delivery / stats
    if (/(delivery|rate|sent|delivered|failed|stats|performance)/.test(lower))
      return [`📊 **Live SMS Performance:**\n\n- Sent this month: **${s.smsStats.sent.toLocaleString()}**\n- Delivered: **${s.smsStats.delivered.toLocaleString()}** (${s.smsStats.deliveryRate}%)\n- Failed: **${s.smsStats.failed.toLocaleString()}**\n\nYour delivery rate is **${s.smsStats.deliveryRate >= 95 ? '✅ above' : '⚠️ below'} the 95% benchmark**.`, false];

    // Contacts
    if (/(contact|contacts|list|audience)/.test(lower))
      return [`👥 **Your contact database:**\n\n- Total contacts: **${s.contacts.length.toLocaleString()}**\n- Latest addition: **${s.contacts[s.contacts.length - 1]?.name || '—'}**\n\nTip: Import a CSV to add hundreds at once — go to Contacts → Import CSV.`, false];

    // Campaigns
    if (/(campaign|blast|bulk|running)/.test(lower))
      return [`📢 **Your campaigns (live):**\n\n- Total: **${s.campaigns.length}**\n- Running: **${s.campaigns.filter(c => c.status === 'running').length}**\n- Completed: **${s.campaigns.filter(c => c.status === 'completed').length}**\n- Scheduled: **${s.campaigns.filter(c => c.status === 'scheduled').length}**\n\nOpen the Campaigns page for full details.`, false];

    // Support / human
    if (/(support|human|agent|help|problem|issue|stuck|contact us|call)/.test(lower))
      return [`🎧 No problem — let me connect you with our support team.\n\nHere are your options:`, true];

    // Top up
    if (/(top.?up|topup|recharge|pay|purchase|buy)/.test(lower))
      return [`💰 **Top-up options for EgoSMS (Uganda):**\n\n| Package | Credits | Price |\n|---------|---------|-------|\n| Starter | 200 SMS | UGX 10,000 |\n| Pro | 2,000 SMS | UGX 100,000 |\n| Scale | 10,000 SMS | UGX 500,000 |\n| Enterprise | 22,000+ SMS | UGX 1,000,000 |\n\nVisit **Billing → Top Up Credits** to pay via MTN/Airtel Money, card, or bank transfer.`, false];

    // How to send
    if (/(send|sms|message|text|schedule|bulk)/.test(lower))
      return [`📤 **How to Send SMS:**\n\n1. Go to **Send SMS** in the sidebar\n2. Choose type: Single / Bulk / Custom / Scheduled\n3. Select or upload recipients\n4. Compose your message (160 chars = 1 credit)\n5. Hit **Send Now** or set a schedule\n\n💡 Best engagement window: **10AM–12PM EAT**`, false];

    // Greetings
    if (/(hello|hi|hey|good morning|good evening)/.test(lower))
      return [`Hello! 👋 Great to see you. I have live access to your EgoSMS data — your balance is **UGX ${s.balanceUGX.toLocaleString()}** and delivery rate is **${s.smsStats.deliveryRate}%**.\n\nWhat can I help with today?`, false];

    // Thanks
    if (/thank/.test(lower))
      return [`You're very welcome! 😊 Your account looks healthy — ${s.smsCredits.toLocaleString()} credits ready to go. Anything else?`, false];

    // Default — offer support option
    return [`🤔 I'm not sure about "${msg.slice(0, 60)}".\n\nHere's what I can help with right now:\n- 💳 Balance (UGX ${s.balanceUGX.toLocaleString()})\n- 📊 Delivery stats (${s.smsStats.deliveryRate}%)\n- 👥 Contacts (${s.contacts.length} total)\n- 📢 Campaigns (${s.campaigns.length} total)\n\nOr would you like to **talk to a human agent**?`, true];
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    setMessages(prev => [...prev, { id: Math.random().toString(36).slice(2), role: 'user', content: text, timestamp: new Date() }]);
    const [response, showSupport] = getResponse(text);
    pushBot(response, showSupport);
  };

  const handleQuick = (action: string) => {
    const clean = action.replace(/^[^\s]+\s/, '');
    setMessages(prev => [...prev, { id: Math.random().toString(36).slice(2), role: 'user', content: clean, timestamp: new Date() }]);
    const [response, showSupport] = getResponse(clean);
    pushBot(response, showSupport);
  };

  // ── Floating bubble ──────────────────────────────────────────────────────
  if (!isChatOpen) {
    return (
      <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#10B981] flex items-center justify-center shadow-2xl shadow-blue-500/40 z-50">
        <MessageSquare className="w-6 h-6 text-white" />
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">1</span>
      </motion.button>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl border shadow-2xl overflow-hidden backdrop-blur-xl transition-all duration-300 w-[370px] ${minimized ? 'h-[52px]' : 'h-[590px]'} ${isDarkMode ? 'bg-[#0F172A]/95 border-slate-700' : 'bg-white/95 border-slate-200'}`}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#2563EB] to-[#10B981] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">EgoBot AI</div>
            <div className="flex items-center gap-1 text-[10px] text-white/80">
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Live data • Always on
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setMessages([messages[0]])} title="Clear chat"
            className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors">
            <RefreshCw className="w-3.5 h-3.5 text-white" />
          </button>
          <button onClick={() => setMinimized(!minimized)}
            className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors">
            {minimized ? <ChevronDown className="w-3.5 h-3.5 text-white" /> : <Minimize2 className="w-3.5 h-3.5 text-white" />}
          </button>
          <button onClick={() => setChatOpen(false)}
            className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors">
            <X className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <AnimatePresence initial={false}>
              {messages.map(msg => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'assistant' ? 'bg-gradient-to-br from-[#2563EB] to-[#10B981]' : isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                    {msg.role === 'assistant' ? <Bot className="w-3.5 h-3.5 text-white" /> : <User className="w-3.5 h-3.5 text-slate-600" />}
                  </div>
                  <div className={`max-w-[80%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${msg.role === 'user'
                        ? 'bg-gradient-to-br from-[#2563EB] to-[#10B981] text-white rounded-tr-sm'
                        : isDarkMode ? 'bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700' : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                      }`} dangerouslySetInnerHTML={{ __html: fmt(msg.content) }} />
                    {msg.showSupport && <SupportCard isDarkMode={isDarkMode} />}
                    <span className={`text-[10px] mt-1 ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing dots */}
            {isTyping && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#2563EB] to-[#10B981] flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className={`px-4 py-3 rounded-2xl rounded-tl-sm ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.div key={i} animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                        className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick actions */}
          <div className={`px-3 py-2 border-t flex gap-1.5 flex-wrap ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
            {QUICK_ACTIONS.map(a => (
              <button key={a} onClick={() => handleQuick(a)}
                className={`text-[10px] font-medium px-2 py-1 rounded-lg border transition-all hover:scale-105 ${isDarkMode ? 'border-slate-700 text-slate-400 hover:border-blue-500 hover:text-blue-400' : 'border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600'}`}>
                {a}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className={`p-3 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
            <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <Zap className="w-4 h-4 text-[#2563EB] flex-shrink-0" />
              <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask EgoBot anything..."
                className={`flex-1 text-xs bg-transparent outline-none ${isDarkMode ? 'text-white placeholder-slate-600' : 'text-slate-900 placeholder-slate-400'}`} />
              <button onClick={handleSend} disabled={!input.trim()}
                className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#10B981] flex items-center justify-center disabled:opacity-40 hover:scale-105 transition-all">
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
            <p className={`text-center text-[9px] mt-1.5 ${isDarkMode ? 'text-slate-700' : 'text-slate-300'}`}>
              EgoBot reads live account data • Not financial advice
            </p>
          </div>
        </>
      )}
    </motion.div>
  );
}
