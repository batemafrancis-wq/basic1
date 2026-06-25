import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, X, Send, Sparkles, Bot, User, Zap,
  RefreshCw, Minimize2, ChevronDown, Phone, Mail, Clock,
  LifeBuoy, CheckCircle2, ExternalLink, MessageCircle,
} from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';

// ── Support contact ───────────────────────────────────────────────────────────
const SUPPORT_PHONE = '+25678564017';
const SUPPORT_PHONE_DISPLAY = '+256 785 640 17';
const WHATSAPP_URL = `https://wa.me/25678564017`;
const SUPPORT_EMAIL = 'support@pahappa.com';
const SUPPORT_HOURS = 'Mon–Fri · 8AM–6PM EAT';

// ── Message types ─────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  card?: 'support' | 'contact-added' | 'contact-deleted' | 'campaign-added' |
  'topup' | 'navigate' | 'dark-mode' | 'sms-sent';
  cardData?: Record<string, string | number>;
}

// ── Quick-action chips ────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: '💳 Balance', cmd: 'check balance' },
  { label: '👥 Add Contact', cmd: 'add contact' },
  { label: '📤 Send SMS', cmd: 'send sms' },
  { label: '📢 New Campaign', cmd: 'create campaign' },
  { label: '📊 My Stats', cmd: 'show my stats' },
  { label: '🌙 Dark Mode', cmd: 'toggle dark mode' },
  { label: '📄 Reports', cmd: 'go to reports' },
  { label: '🎧 Support', cmd: 'talk to support' },
];

function fmt(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-black/10 dark:bg-white/10 px-1 rounded text-[11px]">$1</code>')
    .replace(/\n/g, '<br />');
}

// ── Inline action cards ───────────────────────────────────────────────────────
function ActionCard({ type, data, isDarkMode }: {
  type: Message['card'];
  data?: Record<string, string | number>;
  isDarkMode: boolean;
}) {
  const base = `mt-2 rounded-xl border overflow-hidden text-xs`;
  const dk = isDarkMode;

  if (type === 'support') {
    return (
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        className={`${base} ${dk ? 'bg-slate-800 border-slate-700' : 'bg-blue-50 border-blue-100'}`}>
        <div className="bg-gradient-to-r from-[#2563EB] to-[#10B981] px-3 py-2 flex items-center gap-2">
          <LifeBuoy className="w-3.5 h-3.5 text-white" />
          <span className="text-white font-bold text-[11px]">EgoSMS Support</span>
        </div>
        <div className="p-3 space-y-2">
          <p className={`text-[10px] font-medium ${dk ? 'text-slate-400' : 'text-slate-600'}`}>
            <Clock className="w-3 h-3 inline mr-1" />{SUPPORT_HOURS}
          </p>
          {/* Call */}
          <a href={`tel:${SUPPORT_PHONE}`}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border font-semibold transition-all
              ${dk ? 'border-slate-700 text-green-400 hover:bg-slate-700' : 'border-green-200 text-green-700 hover:bg-green-50'}`}>
            <Phone className="w-3.5 h-3.5" />
            <span>Call {SUPPORT_PHONE_DISPLAY}</span>
          </a>
          {/* WhatsApp */}
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border font-semibold transition-all
              ${dk ? 'border-slate-700 text-[#25D366] hover:bg-slate-700' : 'border-green-200 text-[#25D366] hover:bg-green-50'}`}>
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Chat on WhatsApp</span>
            <ExternalLink className="w-2.5 h-2.5 ml-auto opacity-50" />
          </a>
          {/* Email */}
          <a href={`mailto:${SUPPORT_EMAIL}`}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border font-semibold transition-all
              ${dk ? 'border-slate-700 text-blue-400 hover:bg-slate-700' : 'border-blue-200 text-blue-700 hover:bg-blue-50'}`}>
            <Mail className="w-3.5 h-3.5" />
            <span>{SUPPORT_EMAIL}</span>
          </a>
        </div>
      </motion.div>
    );
  }

  if (type === 'contact-added' && data) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className={`${base} ${dk ? 'bg-green-900/20 border-green-800/40' : 'bg-green-50 border-green-200'}`}>
        <div className="p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2563EB] to-[#10B981] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {String(data.name).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className={`font-bold text-[11px] ${dk ? 'text-green-400' : 'text-green-700'}`}>✅ Contact Added!</p>
            <p className={`text-[10px] ${dk ? 'text-slate-400' : 'text-slate-600'}`}>{data.name} · {data.phone} · {data.group}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (type === 'campaign-added' && data) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className={`${base} ${dk ? 'bg-blue-900/20 border-blue-800/40' : 'bg-blue-50 border-blue-200'}`}>
        <div className="p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#10B981] flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className={`font-bold text-[11px] ${dk ? 'text-blue-400' : 'text-blue-700'}`}>📢 Campaign Created!</p>
            <p className={`text-[10px] ${dk ? 'text-slate-400' : 'text-slate-600'}`}>{data.name} · {data.sender} · {data.status}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (type === 'sms-sent' && data) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className={`${base} ${dk ? 'bg-emerald-900/20 border-emerald-800/40' : 'bg-emerald-50 border-emerald-200'}`}>
        <div className="p-3 space-y-1.5">
          <p className={`font-bold text-[11px] ${dk ? 'text-emerald-400' : 'text-emerald-700'}`}>✅ SMS Sent!</p>
          <p className={`text-[10px] ${dk ? 'text-slate-400' : 'text-slate-600'}`}>To: {data.to} · Sender: {data.sender}</p>
          <p className={`text-[10px] italic ${dk ? 'text-slate-500' : 'text-slate-500'}`}>"{String(data.message).slice(0, 80)}{String(data.message).length > 80 ? '…' : ''}"</p>
        </div>
      </motion.div>
    );
  }

  if (type === 'topup' && data) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className={`${base} ${dk ? 'bg-amber-900/20 border-amber-800/40' : 'bg-amber-50 border-amber-200'}`}>
        <div className="p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className={`font-bold text-[11px] ${dk ? 'text-amber-400' : 'text-amber-700'}`}>💳 Credits Added!</p>
            <p className={`text-[10px] ${dk ? 'text-slate-400' : 'text-slate-600'}`}>+{Number(data.credits).toLocaleString()} credits · UGX {Number(data.ugx).toLocaleString()}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return null;
}

// ── Intent parser ─────────────────────────────────────────────────────────────
// Returns { intent, slots } so the main handler can act without regex repetition
type Intent =
  | 'balance' | 'stats' | 'contacts' | 'campaigns' | 'topup-info'
  | 'add-contact' | 'delete-contact' | 'list-contacts'
  | 'create-campaign' | 'pause-campaign' | 'list-campaigns'
  | 'send-sms' | 'schedule-sms'
  | 'navigate' | 'dark-mode' | 'help' | 'support'
  | 'greet' | 'thanks' | 'unknown';

interface ParsedIntent {
  intent: Intent;
  slots: Record<string, string>;
}

function parseIntent(raw: string): ParsedIntent {
  const t = raw.toLowerCase().trim();
  const slots: Record<string, string> = {};

  // ── add contact: "add contact John Mukasa +256701234567 VIP Customers MTN"
  const addContactRe = /add\s+(?:a\s+)?(?:new\s+)?contact[:\s]+([a-z\s]+?)\s+([\+\d][\d\s\-]{6,})/i;
  const acm = raw.match(addContactRe);
  if (acm) {
    slots.name = acm[1].trim();
    slots.phone = acm[2].replace(/\s/g, '');
    const groupMatch = raw.match(/\b(vip\s*customers?|newsletter|staff|partners?)\b/i);
    const netMatch = raw.match(/\b(mtn|airtel|africell|smile)\b/i);
    slots.group = groupMatch ? groupMatch[1] : 'Newsletter';
    slots.network = netMatch ? netMatch[1].charAt(0).toUpperCase() + netMatch[1].slice(1) : 'MTN';
    return { intent: 'add-contact', slots };
  }

  // ── delete contact
  if (/delete|remove\s+contact/i.test(t)) {
    const nameMatch = raw.match(/(?:delete|remove)\s+contact[:\s]+(.+)/i);
    if (nameMatch) slots.name = nameMatch[1].trim();
    return { intent: 'delete-contact', slots };
  }

  // ── send sms: "send sms to +256701234567 message Hello world"
  const sendRe = /send\s+(?:an?\s+)?sms\s+(?:to\s+)?([\+\d][\d\s\-]{6,})\s+(?:message\s+|saying\s+|:\s*)?(.+)/i;
  const sm = raw.match(sendRe);
  if (sm) {
    slots.to = sm[1].replace(/\s/g, '');
    slots.message = sm[2].trim();
    slots.sender = 'EGOSMS';
    return { intent: 'send-sms', slots };
  }

  // ── create campaign
  const campRe = /create\s+(?:a\s+)?(?:new\s+)?campaign[:\s]+([^,]+?)(?:,\s*sender[:\s]+([A-Z0-9]+))?(?:,\s*scheduled?\s+(?:for\s+)?(.+))?$/i;
  const cm = raw.match(campRe);
  if (cm) {
    slots.name = cm[1].trim();
    slots.sender = cm[2] ? cm[2].trim() : 'EGOSMS';
    slots.date = cm[3] ? cm[3].trim() : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    slots.status = cm[3] ? 'scheduled' : 'running';
    return { intent: 'create-campaign', slots };
  }

  // ── topup via chat: "top up 100000" or "add 2000 credits"
  const topupAmtRe = /(?:top.?up|add credits?|recharge)\s+(?:ugx\s*)?(\d[\d,]*)/i;
  const tam = raw.match(topupAmtRe);
  if (tam) {
    slots.ugx = tam[1].replace(/,/g, '');
    slots.credits = String(Math.floor(+slots.ugx / 20));
    return { intent: 'topup-info', slots };
  }

  // ── navigate
  const navPages: Record<string, string> = {
    dashboard: 'dashboard', 'send sms': 'send-sms', contacts: 'contacts',
    campaigns: 'campaigns', analytics: 'analytics', reports: 'reports',
    api: 'api', billing: 'billing', settings: 'settings',
  };
  for (const [kw, page] of Object.entries(navPages)) {
    if (t.includes(`go to ${kw}`) || t.includes(`open ${kw}`) || t.includes(`show ${kw}`) || t.includes(`take me to ${kw}`)) {
      slots.page = page;
      return { intent: 'navigate', slots };
    }
  }

  // ── dark mode
  if (/(dark mode|light mode|toggle theme|switch theme|dark|light)/i.test(t))
    return { intent: 'dark-mode', slots };

  // ── support / contact us
  if (/(support|human|agent|call|whatsapp|contact us|phone|help me|stuck|issue|problem)/i.test(t))
    return { intent: 'support', slots };

  // ── balance / credits
  if (/(balance|credit|how much|money|funds)/i.test(t))
    return { intent: 'balance', slots };

  // ── stats / delivery
  if (/(stats|delivery|rate|performance|sent|delivered|failed|analytics|insight)/i.test(t))
    return { intent: 'stats', slots };

  // ── contacts list
  if (/(list contacts|show contacts|my contacts|contact list|how many contacts)/i.test(t))
    return { intent: 'list-contacts', slots };

  // ── contacts general
  if (/(contact|contacts|audience)/i.test(t))
    return { intent: 'contacts', slots };

  // ── campaigns list
  if (/(list campaigns|show campaigns|my campaigns|campaign list)/i.test(t))
    return { intent: 'list-campaigns', slots };

  // ── campaigns general
  if (/(campaign|blast|bulk|running)/i.test(t))
    return { intent: 'campaigns', slots };

  // ── topup info (no amount)
  if (/(top.?up|topup|recharge|pay|purchase|buy|pricing|price|cost|package)/i.test(t))
    return { intent: 'topup-info', slots };

  // ── send sms general
  if (/(send|sms|message|text|schedule)/i.test(t))
    return { intent: 'send-sms', slots };

  // ── greet
  if (/(hello|hi|hey|good morning|good afternoon|good evening|sup|yo)\b/i.test(t))
    return { intent: 'greet', slots };

  if (/thank/i.test(t)) return { intent: 'thanks', slots };
  if (/(help|what can you|what do you|capabilities|commands|instructions)/i.test(t))
    return { intent: 'help', slots };

  return { intent: 'unknown', slots };
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AIChatbot() {
  const store = useDashboardStore();
  const { isChatOpen, setChatOpen, isDarkMode, activePage } = store;

  const WELCOME: Message = {
    id: 'welcome',
    role: 'assistant',
    timestamp: new Date(),
    content: `👋 Hi! I'm **EgoBot** — your autonomous AI assistant for EgoSMS.\n\nI can **act on your behalf** without you leaving this chat:\n\n- 👤 **Add / delete contacts** — just say the name & phone\n- 📢 **Create campaigns** — name, sender ID & I'll set it up\n- 📤 **Send an SMS** — give me number + message\n- 💳 **Top up credits** — I'll process it instantly\n- 🌙 **Toggle dark mode**, navigate pages & more\n- 🎧 **Reach support** via call, WhatsApp or email\n\nTry: *"Add contact John Doe +256701234567"*`,
  };

  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);
  useEffect(() => { if (isChatOpen && !minimized) setTimeout(() => inputRef.current?.focus(), 300); }, [isChatOpen, minimized]);

  // Proactive page tips
  const lastPage = useRef(activePage);
  useEffect(() => {
    if (!isChatOpen || activePage === lastPage.current) return;
    lastPage.current = activePage;
    const tips: Partial<Record<typeof activePage, string>> = {
      analytics: `📈 Analytics loaded. Delivery rate: **${store.smsStats.deliveryRate}%** · ${store.smsStats.sent.toLocaleString()} sent this month.\nWant a full breakdown? Just ask!`,
      billing: `💳 Balance: **UGX ${store.balanceUGX.toLocaleString()}** · ${store.smsCredits.toLocaleString()} credits.\nSay *"top up 100000"* to add credits instantly.`,
      contacts: `👥 **${store.contacts.length} contacts** in your database.\nSay *"add contact Name +256XXXXXXXXX"* to add one right now.`,
      campaigns: `📢 **${store.campaigns.length} total campaigns** · ${store.campaigns.filter(c => c.status === 'running').length} running.\nSay *"create campaign Summer Sale"* to launch a new one.`,
    };
    const tip = tips[activePage];
    if (tip) setTimeout(() => pushBot(tip), 1400);
  }, [activePage]); // eslint-disable-line

  // ── Push a bot reply ──────────────────────────────────────────────────────
  function pushBot(content: string, card?: Message['card'], cardData?: Record<string, string | number>) {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: Math.random().toString(36).slice(2),
        role: 'assistant', content, timestamp: new Date(), card, cardData,
      }]);
    }, 600 + Math.random() * 500);
  }

  // ── Execute intent ────────────────────────────────────────────────────────
  function execute(parsed: ParsedIntent) {
    const { intent, slots } = parsed;
    const s = store;

    switch (intent) {

      case 'greet':
        pushBot(`Hello! 👋 Balance: **UGX ${s.balanceUGX.toLocaleString()}** · **${s.smsCredits.toLocaleString()} credits**.\nWhat would you like me to do today?`);
        break;

      case 'thanks':
        pushBot(`You're very welcome! 😊 ${s.smsCredits.toLocaleString()} credits still ready to go. Anything else?`);
        break;

      case 'help':
        pushBot(`🤖 **Here's everything I can do for you:**\n\n**Actions (I execute these instantly):**\n- *"Add contact Sarah Nakato +256782345678 VIP"*\n- *"Delete contact John"*\n- *"Create campaign Flash Sale, sender DEALS"*\n- *"Send sms to +256701234567 message Hello!"*\n- *"Top up 50000"* — adds 1,000 credits\n- *"Toggle dark mode"*\n- *"Go to analytics"* / *"Open billing"*\n\n**Information:**\n- *"Check balance"*, *"Show my stats"*, *"List campaigns"*\n\n**Support:**\n- *"Talk to support"* — call, WhatsApp or email`);
        break;

      case 'balance':
        pushBot(`💳 **Live Account Balance:**\n\n- Balance: **UGX ${s.balanceUGX.toLocaleString()}**\n- Credits: **${s.smsCredits.toLocaleString()} SMS**\n- Cost per SMS: UGX 20\n- Enough for: **~${s.smsCredits.toLocaleString()} more messages**\n\nSay *"top up 100000"* to add 2,000 credits instantly.`);
        break;

      case 'stats':
        pushBot(`📊 **Live SMS Stats:**\n\n- Sent this month: **${s.smsStats.sent.toLocaleString()}**\n- Delivered: **${s.smsStats.delivered.toLocaleString()}** (${s.smsStats.deliveryRate}%)\n- Failed: **${s.smsStats.failed.toLocaleString()}**\n- Contacts: **${s.contacts.length.toLocaleString()}**\n- Campaigns: **${s.campaigns.length}**\n\nDelivery rate is ${s.smsStats.deliveryRate >= 95 ? '✅ **above**' : '⚠️ **below**'} the 95% industry benchmark.`);
        break;

      case 'list-contacts': {
        const recent = s.contacts.slice(-5).reverse();
        const rows = recent.map(c => `• **${c.name}** · ${c.phone} · ${c.network}`).join('\n');
        pushBot(`👥 **Your contacts (${s.contacts.length} total):**\n\n${rows}\n\nSay *"add contact Name +256XXXXXXXXX"* to add one.`);
        break;
      }

      case 'contacts':
        pushBot(`👥 **Contact Database:**\n\n- Total: **${s.contacts.length}**\n- Latest: **${s.contacts[s.contacts.length - 1]?.name || '—'}**\n\nTo add one say:\n*"add contact John Doe +256701234567 Newsletter MTN"*`);
        break;

      case 'list-campaigns': {
        const rows = s.campaigns.slice(0, 5).map(c =>
          `• **${c.name}** · ${c.status} · ${c.rate > 0 ? c.rate + '%' : '—'}`
        ).join('\n');
        pushBot(`📢 **Recent Campaigns (${s.campaigns.length} total):**\n\n${rows}`);
        break;
      }

      case 'campaigns':
        pushBot(`📢 **Campaign Overview:**\n\n- Total: **${s.campaigns.length}**\n- Running: **${s.campaigns.filter(c => c.status === 'running').length}**\n- Completed: **${s.campaigns.filter(c => c.status === 'completed').length}**\n- Scheduled: **${s.campaigns.filter(c => c.status === 'scheduled').length}**\n\nSay *"create campaign Name, sender MYSID"* to launch one.`);
        break;

      case 'topup-info':
        if (slots.ugx) {
          // Execute actual top-up
          const ugx = +slots.ugx;
          const credits = Math.floor(ugx / 20);
          s.addCredits(ugx, credits);
          s.addTransaction({ type: 'topup', method: 'EgoBot Auto Top-Up', amount: ugx, credits, date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), status: 'success' });
          s.addNotification({ type: 'success', title: '💳 Top-Up via EgoBot!', message: `UGX ${ugx.toLocaleString()} · ${credits.toLocaleString()} credits added.` });
          pushBot(`✅ Done! I've added **${credits.toLocaleString()} credits** (UGX ${ugx.toLocaleString()}) to your account.\n\nNew balance: **UGX ${(s.balanceUGX + ugx).toLocaleString()}** · **${(s.smsCredits + credits).toLocaleString()} credits**`, 'topup', { ugx, credits });
        } else {
          pushBot(`💰 **Top-Up Packages:**\n\n| Package | Credits | Price |\n|---------|---------|-------|\n| Starter | 200 SMS | UGX 10,000 |\n| Basic | 1,000 SMS | UGX 50,000 |\n| Pro ⭐ | 2,000 SMS | UGX 100,000 |\n| Growth | 5,000 SMS | UGX 250,000 |\n| Scale | 10,000 SMS | UGX 500,000 |\n\nSay *"top up 100000"* and I'll add it instantly.\nOr visit **Billing** for full payment options.`);
        }
        break;

      case 'add-contact': {
        if (!slots.name || !slots.phone) {
          pushBot(`👤 To add a contact I need a name and phone number.\n\nExample:\n*"Add contact Sarah Nakato +256782345678 VIP MTN"*\n\nFormat: **add contact [Name] [+256XXXXXXXXX] [Group] [Network]**`);
          break;
        }
        // Normalise group capitalisation
        const groupMap: Record<string, string> = { 'vip': 'VIP Customers', 'vip customers': 'VIP Customers', 'newsletter': 'Newsletter', 'staff': 'Staff', 'partners': 'Partners', 'partner': 'Partners' };
        const groupKey = (slots.group || '').toLowerCase();
        const group = groupMap[groupKey] || 'Newsletter';
        const netMap: Record<string, string> = { mtn: 'MTN', airtel: 'Airtel', africell: 'Africell', smile: 'Smile' };
        const network = netMap[(slots.network || '').toLowerCase()] || 'MTN';
        s.addContact({ name: slots.name, phone: slots.phone, group, added: 'Today', network });
        s.addNotification({ type: 'success', title: '👤 Contact Added!', message: `${slots.name} added to ${group}.` });
        pushBot(`✅ I've added **${slots.name}** to your contacts!\n\n- Phone: ${slots.phone}\n- Group: ${group}\n- Network: ${network}\n\nYou now have **${s.contacts.length + 1} contacts** total.`, 'contact-added', { name: slots.name, phone: slots.phone, group });
        break;
      }

      case 'delete-contact': {
        if (!slots.name) {
          pushBot(`❓ Which contact should I delete? Say:\n*"Delete contact John Mukasa"*`);
          break;
        }
        const found = s.contacts.find(c => c.name.toLowerCase().includes(slots.name.toLowerCase()));
        if (!found) {
          pushBot(`🔍 I couldn't find a contact named **"${slots.name}"**.\n\nCurrent contacts: ${s.contacts.map(c => c.name).join(', ')}`);
          break;
        }
        s.deleteContact(found.id);
        s.addNotification({ type: 'warning', title: 'Contact Removed', message: `${found.name} deleted from contacts.` });
        pushBot(`🗑️ Done — **${found.name}** (${found.phone}) has been removed.\n\nYou now have **${s.contacts.length - 1} contacts**.`);
        break;
      }

      case 'create-campaign': {
        if (!slots.name) {
          pushBot(`📢 To create a campaign I need at minimum a name.\n\nExample:\n*"Create campaign Black Friday Sale, sender DEALS, scheduled Nov 29"*`);
          break;
        }
        const newCamp = {
          name: slots.name,
          sent: 0, delivered: 0, rate: 0,
          status: (slots.status || 'scheduled') as 'scheduled' | 'running',
          date: slots.date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          sender: (slots.sender || 'EGOSMS').toUpperCase(),
        };
        s.addCampaign(newCamp);
        s.addNotification({ type: 'success', title: '📢 Campaign Created!', message: `"${slots.name}" is now ${newCamp.status}.` });
        pushBot(`✅ Campaign **"${slots.name}"** has been created!\n\n- Sender ID: **${newCamp.sender}**\n- Status: **${newCamp.status}**\n- Date: ${newCamp.date}\n\nYou now have **${s.campaigns.length + 1} campaigns** total.`, 'campaign-added', { name: slots.name, sender: newCamp.sender, status: newCamp.status });
        break;
      }

      case 'send-sms': {
        if (!slots.to || !slots.message) {
          pushBot(`📤 To send an SMS I need a recipient and a message.\n\nExample:\n*"Send sms to +256701234567 message Hello from EgoSMS!"*\n\nFormat: **send sms to [number] message [your text]**`);
          break;
        }
        if (s.smsCredits < 1) {
          pushBot(`⚠️ You don't have enough credits to send. Current balance: **${s.smsCredits} credits**.\n\nSay *"top up 50000"* to add 1,000 credits.`);
          break;
        }
        // Deduct 1 credit and update stats
        s.deductCredits(1);
        s.updateSmsStats({ sent: s.smsStats.sent + 1, delivered: s.smsStats.delivered + 1 });
        s.addTransaction({ type: 'usage', method: `EgoBot SMS to ${slots.to}`, amount: -20, credits: -1, date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), status: 'success' });
        s.addNotification({ type: 'success', title: '📤 SMS Sent!', message: `To: ${slots.to} · 1 credit used.` });
        pushBot(`✅ SMS sent to **${slots.to}**!\n\n- Message: *"${slots.message.slice(0, 60)}${slots.message.length > 60 ? '…' : ''}"*\n- Credits remaining: **${s.smsCredits - 1}**`, 'sms-sent', { to: slots.to, message: slots.message, sender: slots.sender || 'EGOSMS' });
        break;
      }

      case 'navigate': {
        const page = slots.page as Parameters<typeof s.setActivePage>[0];
        if (page) {
          s.setActivePage(page);
          pushBot(`🚀 Navigated to **${page.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}** for you!`);
        }
        break;
      }

      case 'dark-mode':
        s.toggleDarkMode();
        pushBot(`${s.isDarkMode ? '☀️ Switched to **Light Mode**.' : '🌙 Switched to **Dark Mode**.'}`);
        break;

      case 'support':
        pushBot(`🎧 Here's how to reach the EgoSMS support team:`, 'support');
        break;

      default:
        pushBot(`🤔 I didn't quite catch that.\n\nHere are some things I can do:\n- *"Add contact Name +256XXXXXXXXX"*\n- *"Send sms to +256XXXXXXXXX message Hello"*\n- *"Create campaign Sale, sender DEALS"*\n- *"Top up 100000"*\n- *"Check balance"*, *"Show my stats"*\n- *"Go to reports"*, *"Toggle dark mode"*\n- *"Talk to support"*\n\nSay **help** for the full command list.`, 'support');
    }
  }

  // ── Handle send ───────────────────────────────────────────────────────────
  function handleSend() {
    const text = input.trim();
    if (!text) return;
    setInput('');
    setMessages(prev => [...prev, { id: Math.random().toString(36).slice(2), role: 'user', content: text, timestamp: new Date() }]);
    execute(parseIntent(text));
  }

  function handleQuick(cmd: string) {
    setMessages(prev => [...prev, { id: Math.random().toString(36).slice(2), role: 'user', content: cmd, timestamp: new Date() }]);
    execute(parseIntent(cmd));
  }

  // ── Floating bubble ───────────────────────────────────────────────────────
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
      className={`fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl border shadow-2xl overflow-hidden backdrop-blur-xl transition-all duration-300 w-[380px] ${minimized ? 'h-[54px]' : 'h-[600px]'} ${isDarkMode ? 'bg-[#0F172A]/96 border-slate-700' : 'bg-white/96 border-slate-200'}`}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#2563EB] to-[#10B981] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">EgoBot AI</div>
            <div className="flex items-center gap-1.5 text-[10px] text-white/80">
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Autonomous · Live data
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setMessages([WELCOME])} title="Clear chat"
            className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/30 flex items-center justify-center transition-colors">
            <RefreshCw className="w-3.5 h-3.5 text-white" />
          </button>
          <button onClick={() => setMinimized(v => !v)}
            className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/30 flex items-center justify-center transition-colors">
            {minimized ? <ChevronDown className="w-3.5 h-3.5 text-white" /> : <Minimize2 className="w-3.5 h-3.5 text-white" />}
          </button>
          <button onClick={() => setChatOpen(false)}
            className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/30 flex items-center justify-center transition-colors">
            <X className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
            <AnimatePresence initial={false}>
              {messages.map(msg => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'assistant' ? 'bg-gradient-to-br from-[#2563EB] to-[#10B981]' : isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                    {msg.role === 'assistant' ? <Bot className="w-3.5 h-3.5 text-white" /> : <User className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />}
                  </div>
                  <div className={`max-w-[82%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${msg.role === 'user'
                        ? 'bg-gradient-to-br from-[#2563EB] to-[#10B981] text-white rounded-tr-sm'
                        : isDarkMode ? 'bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700' : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                      }`} dangerouslySetInnerHTML={{ __html: fmt(msg.content) }} />
                    {msg.card && <ActionCard type={msg.card} data={msg.cardData} isDarkMode={isDarkMode} />}
                    <span className={`text-[10px] mt-1 ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            {isTyping && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#2563EB] to-[#10B981] flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className={`px-4 py-3 rounded-2xl rounded-tl-sm ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.div key={i} animate={{ y: [0, -4, 0] }} transition={{ duration: 0.55, repeat: Infinity, delay: i * 0.15 }}
                        className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick action chips */}
          <div className={`px-3 py-2 border-t flex gap-1.5 flex-wrap ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
            {QUICK_ACTIONS.map(a => (
              <button key={a.label} onClick={() => handleQuick(a.cmd)}
                className={`text-[10px] font-medium px-2 py-1 rounded-lg border transition-all hover:scale-105 ${isDarkMode ? 'border-slate-700 text-slate-400 hover:border-blue-500 hover:text-blue-400 bg-slate-800/60' : 'border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 bg-white'}`}>
                {a.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className={`p-3 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
            <div className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 ${isDarkMode ? 'bg-slate-800 border-slate-700 focus-within:border-blue-500' : 'bg-slate-50 border-slate-200 focus-within:border-blue-400'} transition-colors`}>
              <Zap className="w-4 h-4 text-[#2563EB] flex-shrink-0" />
              <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder='Try "Add contact John +256701234567"'
                className={`flex-1 text-xs bg-transparent outline-none ${isDarkMode ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'}`} />
              <button onClick={handleSend} disabled={!input.trim()}
                className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#10B981] flex items-center justify-center disabled:opacity-35 hover:scale-105 transition-all">
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
            <p className={`text-center text-[9px] mt-1.5 ${isDarkMode ? 'text-slate-700' : 'text-slate-300'}`}>
              EgoBot acts autonomously · Powered by live account data
            </p>
          </div>
        </>
      )}
    </motion.div>
  );
}
