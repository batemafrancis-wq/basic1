import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, X, Send, Sparkles, Bot, User, Zap,
  RefreshCw, Minimize2, ChevronDown, Phone, Mail, Clock,
  LifeBuoy, CheckCircle2, ExternalLink, MessageCircle,
  AlertTriangle, ShieldAlert, Lock, Trash2, CheckCheck, XCircle,
} from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';

// ── Constants ─────────────────────────────────────────────────────────────────
const SUPPORT_PHONE = '+25678564017';
const SUPPORT_DISPLAY = '+256 785 640 17';
const WHATSAPP_URL = 'https://wa.me/25678564017';
const SUPPORT_EMAIL = 'support@pahappa.com';
const SUPPORT_HOURS = 'Mon–Fri · 8AM–6PM EAT';
const DEMO_PASSWORD = 'admin123'; // demo gate password

// ── Security tiers ────────────────────────────────────────────────────────────
// SAFE      → executes immediately
// SENSITIVE → shows Confirm / Reject card before acting
// DANGEROUS → requires password entry before acting
// BLOCKED   → refuses + escalates to support
type SecurityLevel = 'safe' | 'sensitive' | 'dangerous' | 'blocked';

// ── Message model ─────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  // Inline interactive cards
  card?: 'support' | 'confirm' | 'password-gate' | 'success-action' |
  'contact-added' | 'campaign-added' | 'sms-sent' | 'topup-done' |
  'contact-deleted' | 'bulk-deleted' | 'escalated';
  cardData?: Record<string, string | number | (() => void)>;
}

// ── Quick-action chips ────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: '💳 Balance', cmd: 'check balance' },
  { label: '👤 Add Contact', cmd: 'add contact' },
  { label: '📤 Send SMS', cmd: 'send sms' },
  { label: '📢 New Campaign', cmd: 'create campaign' },
  { label: '📊 Stats', cmd: 'show stats' },
  { label: '🌙 Dark Mode', cmd: 'toggle dark mode' },
  { label: '🗑 Delete Contact', cmd: 'delete contact' },
  { label: '🎧 Support', cmd: 'talk to support' },
];

// ── Text formatter ────────────────────────────────────────────────────────────
function fmt(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code style="background:rgba(99,102,241,0.15);padding:1px 5px;border-radius:4px;font-size:11px">$1</code>')
    .replace(/\n/g, '<br />');
}

// ── Intent parser ─────────────────────────────────────────────────────────────
interface ParsedIntent {
  intent: string;
  security: SecurityLevel;
  slots: Record<string, string>;
  confirmMsg?: string;   // shown in confirm card
  dangerMsg?: string;    // shown in password-gate card
}

function parseIntent(raw: string): ParsedIntent {
  const t = raw.toLowerCase().trim();
  const slots: Record<string, string> = {};

  // ── BLOCKED: system-threatening ──────────────────────────────────────────
  if (/(drop\s+database|delete\s+all\s+data|wipe\s+(all|everything)|factory\s+reset|delete\s+account)/i.test(t))
    return { intent: 'blocked-destructive', security: 'blocked', slots };

  if (/(hack|exploit|inject|bypass|override\s+security|disable\s+auth)/i.test(t))
    return { intent: 'blocked-security', security: 'blocked', slots };

  // ── DANGEROUS: needs password ─────────────────────────────────────────────
  // Delete ALL contacts
  if (/(delete|remove|wipe|clear)\s+all\s+contacts/i.test(t)) {
    return {
      intent: 'delete-all-contacts', security: 'dangerous', slots,
      dangerMsg: 'This will permanently delete ALL contacts from your account. This cannot be undone.',
    };
  }
  // Delete ALL campaigns
  if (/(delete|remove|wipe|clear)\s+all\s+campaigns/i.test(t)) {
    return {
      intent: 'delete-all-campaigns', security: 'dangerous', slots,
      dangerMsg: 'This will permanently delete ALL campaigns and their delivery history.',
    };
  }
  // Delete ALL transactions
  if (/(delete|clear|wipe)\s+(all\s+)?(transactions?|history|billing\s+history)/i.test(t)) {
    return {
      intent: 'delete-all-transactions', security: 'dangerous', slots,
      dangerMsg: 'This will permanently clear your entire billing and transaction history.',
    };
  }

  // ── SENSITIVE: confirm/reject required ───────────────────────────────────
  // Top-up with amount
  const topupAmtRe = /(?:top.?up|add\s+credits?|recharge)\s+(?:ugx\s*)?(\d[\d,]+)/i;
  const tam = raw.match(topupAmtRe);
  if (tam) {
    slots.ugx = tam[1].replace(/,/g, '');
    slots.credits = String(Math.floor(+slots.ugx / 20));
    return {
      intent: 'topup', security: 'sensitive', slots,
      confirmMsg: `Add **${Number(slots.credits).toLocaleString()} credits** for **UGX ${Number(slots.ugx).toLocaleString()}** to your account?`,
    };
  }
  // Send SMS
  const sendRe = /send\s+(?:an?\s+)?sms\s+(?:to\s+)?([\+\d][\d\s\-]{6,})\s+(?:message\s+|saying\s+|:\s*)?(.+)/i;
  const sm = raw.match(sendRe);
  if (sm) {
    slots.to = sm[1].replace(/\s/g, '');
    slots.message = sm[2].trim();
    return {
      intent: 'send-sms', security: 'sensitive', slots,
      confirmMsg: `Send SMS to **${slots.to}**: "*${slots.message.slice(0, 60)}${slots.message.length > 60 ? '…' : ''}*"?`,
    };
  }
  // Bulk SMS
  if (/(send\s+bulk|blast\s+sms|broadcast)/i.test(t)) {
    const grpM = raw.match(/to\s+(vip\s*customers?|newsletter|staff|partners?|all\s+contacts?)/i);
    slots.group = grpM ? grpM[1] : 'all contacts';
    const msgM = raw.match(/message\s+(.+)/i);
    slots.message = msgM ? msgM[1].trim() : '';
    return {
      intent: 'send-bulk-sms', security: 'sensitive', slots,
      confirmMsg: `Send bulk SMS to **${slots.group}**: "*${(slots.message || 'your message').slice(0, 60)}*"?`,
    };
  }
  // Delete single contact
  const delContactRe = /(?:delete|remove)\s+(?:contact[:\s]+)?(.+)/i;
  const dcm = raw.match(delContactRe);
  if (dcm && !/(all|every|bulk)/i.test(dcm[1])) {
    slots.name = dcm[1].trim();
    return {
      intent: 'delete-contact', security: 'sensitive', slots,
      confirmMsg: `Permanently delete contact **"${slots.name}"** from your account?`,
    };
  }
  // Pause / stop a campaign
  if (/(pause|stop|cancel)\s+campaign\s*[:\s]+(.+)/i.test(raw)) {
    const m = raw.match(/(pause|stop|cancel)\s+campaign\s*[:\s]+(.+)/i)!;
    slots.action = m[1];
    slots.name = m[2].trim();
    return {
      intent: 'pause-campaign', security: 'sensitive', slots,
      confirmMsg: `${slots.action.charAt(0).toUpperCase() + slots.action.slice(1)} campaign **"${slots.name}"**?`,
    };
  }
  // Change sender ID
  if (/(change|update|set)\s+sender\s+(id|name)/i.test(t)) {
    const m = raw.match(/to\s+([A-Z0-9]{3,11})/i);
    slots.sender = m ? m[1].toUpperCase() : '';
    return {
      intent: 'change-sender', security: 'sensitive', slots,
      confirmMsg: `Update your default sender ID to **${slots.sender || 'new ID'}**?`,
    };
  }

  // ── SAFE: executes immediately ────────────────────────────────────────────
  // Add contact
  const addRe = /add\s+(?:a\s+)?(?:new\s+)?contact[:\s]+([a-z\s\.]+?)\s+([\+\d][\d\s\-]{6,})/i;
  const acm = raw.match(addRe);
  if (acm) {
    slots.name = acm[1].trim();
    slots.phone = acm[2].replace(/\s/g, '');
    const grpM = raw.match(/\b(vip\s*customers?|newsletter|staff|partners?)\b/i);
    const netM = raw.match(/\b(mtn|airtel|africell|smile)\b/i);
    slots.group = grpM ? grpM[1] : 'Newsletter';
    slots.network = netM ? netM[1].charAt(0).toUpperCase() + netM[1].slice(1) : 'MTN';
    return { intent: 'add-contact', security: 'safe', slots };
  }
  // Create campaign
  const campRe = /create\s+(?:a\s+)?(?:new\s+)?campaign[:\s]+([^,]+?)(?:,\s*sender[:\s]+([A-Z0-9]+))?(?:,\s*scheduled?\s+(?:for\s+)?(.+))?$/i;
  const cm = raw.match(campRe);
  if (cm) {
    slots.name = cm[1].trim();
    slots.sender = cm[2] ? cm[2].trim().toUpperCase() : 'EGOSMS';
    slots.date = cm[3] ? cm[3].trim() : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    slots.status = cm[3] ? 'scheduled' : 'running';
    return { intent: 'create-campaign', security: 'safe', slots };
  }

  // Navigation
  const navMap: Record<string, string> = {
    dashboard: 'dashboard', 'send sms': 'send-sms', contacts: 'contacts',
    campaigns: 'campaigns', analytics: 'analytics', reports: 'reports',
    api: 'api', billing: 'billing', settings: 'settings',
  };
  for (const [kw, page] of Object.entries(navMap)) {
    if (/(go\s+to|open|show|take\s+me\s+to|navigate\s+to)\s+/.test(t) && t.includes(kw)) {
      slots.page = page;
      return { intent: 'navigate', security: 'safe', slots };
    }
  }

  if (/(dark\s+mode|light\s+mode|toggle\s+theme|toggle\s+dark)/i.test(t))
    return { intent: 'dark-mode', security: 'safe', slots };
  if (/(balance|credit|how\s+much|funds)/i.test(t))
    return { intent: 'balance', security: 'safe', slots };
  if (/(stats|delivery|rate|performance|sent|delivered|analytics)/i.test(t))
    return { intent: 'stats', security: 'safe', slots };
  if (/(list\s+contacts?|show\s+contacts?|my\s+contacts?|how\s+many\s+contacts?)/i.test(t))
    return { intent: 'list-contacts', security: 'safe', slots };
  if (/(contact|contacts)/i.test(t))
    return { intent: 'contacts-info', security: 'safe', slots };
  if (/(list\s+campaigns?|show\s+campaigns?|my\s+campaigns?)/i.test(t))
    return { intent: 'list-campaigns', security: 'safe', slots };
  if (/(campaign|blast|running)/i.test(t))
    return { intent: 'campaigns-info', security: 'safe', slots };
  if (/(top.?up|recharge|pricing|price|package)/i.test(t))
    return { intent: 'topup-info', security: 'safe', slots };
  if (/(send|sms|message|text|schedule)/i.test(t))
    return { intent: 'send-help', security: 'safe', slots };
  if (/(support|human|agent|call|whatsapp|phone|stuck|issue|problem)/i.test(t))
    return { intent: 'support', security: 'safe', slots };
  if (/(hello|hi|hey|good\s+(morning|afternoon|evening)|sup)\b/i.test(t))
    return { intent: 'greet', security: 'safe', slots };
  if (/thank/i.test(t))
    return { intent: 'thanks', security: 'safe', slots };
  if (/(help|what\s+can\s+you|commands?|capabilities)/i.test(t))
    return { intent: 'help', security: 'safe', slots };

  return { intent: 'unknown', security: 'safe', slots };
}

// ── Inline cards ──────────────────────────────────────────────────────────────

function SupportCard({ isDark }: { isDark: boolean }) {
  const [sent, setSent] = useState(false);
  const [desc, setDesc] = useState('');
  const { addNotification } = useDashboardStore();
  const submit = () => {
    if (!desc.trim()) return;
    setSent(true);
    addNotification({ type: 'success', title: '🎫 Ticket Submitted', message: 'We\'ll respond within 2 hours.' });
  };
  const base = `rounded-xl border overflow-hidden mt-2 text-xs`;
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className={`${base} ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-blue-50 border-blue-100'}`}>
      <div className="bg-gradient-to-r from-[#2563EB] to-[#10B981] px-3 py-2 flex items-center gap-2">
        <LifeBuoy className="w-3.5 h-3.5 text-white" />
        <span className="text-white font-bold text-[11px]">EgoSMS Support · {SUPPORT_DISPLAY}</span>
      </div>
      {!sent ? (
        <div className="p-3 space-y-2">
          <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}><Clock className="w-3 h-3 inline mr-1" />{SUPPORT_HOURS}</p>
          <a href={`tel:${SUPPORT_PHONE}`} className={`flex items-center gap-2 px-3 py-2 rounded-lg border font-semibold transition-all ${isDark ? 'border-slate-700 text-green-400 hover:bg-slate-700' : 'border-green-200 text-green-700 hover:bg-green-50'}`}>
            <Phone className="w-3.5 h-3.5" /> Call {SUPPORT_DISPLAY}
          </a>
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className={`flex items-center gap-2 px-3 py-2 rounded-lg border font-semibold transition-all ${isDark ? 'border-slate-700 text-[#25D366] hover:bg-slate-700' : 'border-green-200 text-[#25D366] hover:bg-green-50'}`}>
            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp Chat <ExternalLink className="w-2.5 h-2.5 ml-auto opacity-50" />
          </a>
          <a href={`mailto:${SUPPORT_EMAIL}`} className={`flex items-center gap-2 px-3 py-2 rounded-lg border font-semibold transition-all ${isDark ? 'border-slate-700 text-blue-400 hover:bg-slate-700' : 'border-blue-200 text-blue-700 hover:bg-blue-50'}`}>
            <Mail className="w-3.5 h-3.5" /> {SUPPORT_EMAIL}
          </a>
          <div className={`pt-2 border-t ${isDark ? 'border-slate-700' : 'border-blue-200'}`}>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} placeholder="Describe your issue…"
              className={`w-full px-2.5 py-2 rounded-lg border text-[11px] resize-none outline-none ${isDark ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-600' : 'bg-white border-blue-200 text-slate-800 placeholder-slate-400'}`} />
            <button onClick={submit} className="mt-1.5 w-full py-1.5 rounded-lg bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white text-[11px] font-bold">Submit Ticket</button>
          </div>
        </div>
      ) : (
        <div className="p-3 text-center">
          <p className="text-[#10B981] font-bold text-[11px]">✅ Ticket submitted!</p>
          <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Expect a reply within 2 hours.</p>
        </div>
      )}
    </motion.div>
  );
}

function ConfirmCard({ msg, onConfirm, onReject, isDark, confirmed }: {
  msg: string; onConfirm: () => void; onReject: () => void;
  isDark: boolean; confirmed: boolean | null;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border mt-2 overflow-hidden text-xs ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-amber-50 border-amber-200'}`}>
      <div className="px-3 py-2 flex items-center gap-2 bg-amber-500/10 border-b border-amber-200/50">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
        <span className={`font-bold text-[11px] ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>Confirm Action</span>
      </div>
      <div className="p-3">
        <p className={`text-[11px] leading-relaxed mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
          dangerouslySetInnerHTML={{ __html: fmt(msg) }} />
        {confirmed === null ? (
          <div className="flex gap-2">
            <button onClick={onConfirm}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white text-[11px] font-bold">
              <CheckCheck className="w-3.5 h-3.5" /> Confirm
            </button>
            <button onClick={onReject}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-[11px] font-bold ${isDark ? 'border-slate-600 text-slate-300' : 'border-slate-300 text-slate-600'}`}>
              <XCircle className="w-3.5 h-3.5" /> Reject
            </button>
          </div>
        ) : (
          <div className={`flex items-center gap-2 py-2 px-3 rounded-lg ${confirmed ? isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700' : isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-600'}`}>
            {confirmed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            <span className="text-[11px] font-semibold">{confirmed ? 'Confirmed — executing…' : 'Action cancelled.'}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function PasswordGateCard({ msg, onUnlock, onCancel, isDark }: {
  msg: string; onUnlock: (pw: string) => void; onCancel: () => void; isDark: boolean;
}) {
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [locked, setLocked] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const tryUnlock = () => {
    if (locked) return;
    if (pw === DEMO_PASSWORD) { onUnlock(pw); return; }
    const next = attempts + 1;
    setAttempts(next);
    if (next >= 3) {
      setLocked(true);
      setError('Too many attempts. Operation locked for security.');
    } else {
      setError(`Incorrect password. ${3 - next} attempt${3 - next !== 1 ? 's' : ''} remaining.`);
      setPw('');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border mt-2 overflow-hidden text-xs ${isDark ? 'bg-slate-800 border-red-800/50' : 'bg-red-50 border-red-200'}`}>
      <div className="px-3 py-2 flex items-center gap-2 bg-red-500/10 border-b border-red-200/50">
        <ShieldAlert className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
        <span className={`font-bold text-[11px] ${isDark ? 'text-red-400' : 'text-red-700'}`}>Password Required — Dangerous Operation</span>
      </div>
      <div className="p-3 space-y-2.5">
        <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{msg}</p>
        <div className={`flex items-center gap-2 p-2.5 rounded-lg ${isDark ? 'bg-slate-900' : 'bg-white border border-red-200'}`}>
          <Lock className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
          <input type={show ? 'text' : 'password'} value={pw}
            onChange={e => { setPw(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && tryUnlock()}
            placeholder="Enter your account password"
            disabled={locked}
            className={`flex-1 text-[11px] bg-transparent outline-none ${isDark ? 'text-white placeholder-slate-600' : 'text-slate-800 placeholder-slate-400'}`} />
          <button onClick={() => setShow(v => !v)} className="text-slate-400 hover:text-slate-600 text-[10px]">
            {show ? 'hide' : 'show'}
          </button>
        </div>
        {error && <p className="text-[10px] text-red-500 font-medium">{error}</p>}
        <div className="flex gap-2">
          <button onClick={tryUnlock} disabled={!pw.trim() || locked}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-[11px] font-bold disabled:opacity-40 transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> Proceed
          </button>
          <button onClick={onCancel}
            className={`flex-1 py-2 rounded-lg border text-[11px] font-bold ${isDark ? 'border-slate-600 text-slate-300' : 'border-slate-300 text-slate-600'}`}>
            Cancel
          </button>
        </div>
        <p className={`text-[10px] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
          Demo password: <code className="font-mono">admin123</code>
        </p>
      </div>
    </motion.div>
  );
}

function BlockedCard({ isDark }: { isDark: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border mt-2 overflow-hidden text-xs ${isDark ? 'bg-slate-800 border-red-900/60' : 'bg-red-50 border-red-200'}`}>
      <div className="px-3 py-2.5 flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className={`font-bold text-[11px] mb-1 ${isDark ? 'text-red-400' : 'text-red-700'}`}>⛔ Request Blocked</p>
          <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            This action is too dangerous to perform via the chatbot.
            Please contact support or log in as an administrator to proceed.
          </p>
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold text-[#25D366]">
            <MessageCircle className="w-3 h-3" /> Contact Support on WhatsApp
          </a>
        </div>
      </div>
    </motion.div>
  );
}

// ── Rich result cards ─────────────────────────────────────────────────────────
function ResultCard({ type, data, isDark }: {
  type: Message['card'];
  data?: Record<string, string | number | (() => void)>;
  isDark: boolean;
}) {
  if (type === 'contact-added' && data) return (
    <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
      className={`mt-2 rounded-xl border p-3 flex items-center gap-3 ${isDark ? 'bg-green-900/20 border-green-800/40' : 'bg-green-50 border-green-200'}`}>
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2563EB] to-[#10B981] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
        {String(data.name).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
      </div>
      <div>
        <p className={`font-bold text-[11px] ${isDark ? 'text-green-400' : 'text-green-700'}`}>✅ Contact Added!</p>
        <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{data.name} · {data.phone} · {data.group}</p>
      </div>
    </motion.div>
  );
  if (type === 'campaign-added' && data) return (
    <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
      className={`mt-2 rounded-xl border p-3 flex items-center gap-3 ${isDark ? 'bg-blue-900/20 border-blue-800/40' : 'bg-blue-50 border-blue-200'}`}>
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#10B981] flex items-center justify-center flex-shrink-0">
        <CheckCircle2 className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className={`font-bold text-[11px] ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>📢 Campaign Created!</p>
        <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{data.name} · {data.sender} · {data.status}</p>
      </div>
    </motion.div>
  );
  if (type === 'sms-sent' && data) return (
    <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
      className={`mt-2 rounded-xl border p-3 ${isDark ? 'bg-emerald-900/20 border-emerald-800/40' : 'bg-emerald-50 border-emerald-200'}`}>
      <p className={`font-bold text-[11px] ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>✅ SMS Sent!</p>
      <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>To: {data.to} · 1 credit used</p>
      <p className={`text-[10px] italic mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>"{String(data.message).slice(0, 70)}…"</p>
    </motion.div>
  );
  if (type === 'topup-done' && data) return (
    <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
      className={`mt-2 rounded-xl border p-3 flex items-center gap-3 ${isDark ? 'bg-amber-900/20 border-amber-800/40' : 'bg-amber-50 border-amber-200'}`}>
      <Zap className="w-5 h-5 text-amber-500 flex-shrink-0" />
      <div>
        <p className={`font-bold text-[11px] ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>💳 Credits Added!</p>
        <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>+{Number(data.credits).toLocaleString()} credits · UGX {Number(data.ugx).toLocaleString()}</p>
      </div>
    </motion.div>
  );
  if (type === 'contact-deleted') return (
    <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
      className={`mt-2 rounded-xl border p-2.5 flex items-center gap-2 ${isDark ? 'bg-red-900/20 border-red-800/30' : 'bg-red-50 border-red-200'}`}>
      <Trash2 className="w-4 h-4 text-red-400 flex-shrink-0" />
      <p className={`text-[11px] font-semibold ${isDark ? 'text-red-400' : 'text-red-600'}`}>{String(data?.msg || 'Contact deleted.')}</p>
    </motion.div>
  );
  if (type === 'bulk-deleted') return (
    <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
      className={`mt-2 rounded-xl border p-2.5 flex items-center gap-2 ${isDark ? 'bg-red-900/20 border-red-800/30' : 'bg-red-50 border-red-200'}`}>
      <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0" />
      <p className={`text-[11px] font-semibold ${isDark ? 'text-red-400' : 'text-red-600'}`}>{String(data?.msg || 'Bulk delete completed.')}</p>
    </motion.div>
  );
  if (type === 'support') return <SupportCard isDark={isDark} />;
  if (type === 'escalated') return <BlockedCard isDark={isDark} />;
  return null;
}

// ── Interactive message wrapper ───────────────────────────────────────────────
// Handles confirm/reject/password-gate state for a single message
function InteractiveMessage({ msg, isDark, onConfirm, onReject, onUnlock, onCancel }: {
  msg: Message; isDark: boolean;
  onConfirm: (id: string) => void; onReject: (id: string) => void;
  onUnlock: (id: string, pw: string) => void; onCancel: (id: string) => void;
}) {
  const [confirmed, setConfirmed] = useState<boolean | null>(null);

  const handleConfirm = () => {
    setConfirmed(true);
    setTimeout(() => onConfirm(msg.id), 400);
  };
  const handleReject = () => {
    setConfirmed(false);
    onReject(msg.id);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'assistant' ? 'bg-gradient-to-br from-[#2563EB] to-[#10B981]' : isDark ? 'bg-slate-700' : 'bg-slate-200'
        }`}>
        {msg.role === 'assistant' ? <Bot className="w-3.5 h-3.5 text-white" /> : <User className="w-3.5 h-3.5 text-slate-600" />}
      </div>
      <div className={`max-w-[84%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
        <div className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${msg.role === 'user'
          ? 'bg-gradient-to-br from-[#2563EB] to-[#10B981] text-white rounded-tr-sm'
          : isDark ? 'bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700' : 'bg-slate-100 text-slate-800 rounded-tl-sm'
          }`} dangerouslySetInnerHTML={{ __html: fmt(msg.content) }} />

        {/* Confirm card */}
        {msg.card === 'confirm' && msg.cardData && (
          <ConfirmCard
            msg={String(msg.cardData.confirmMsg)}
            onConfirm={handleConfirm}
            onReject={handleReject}
            isDark={isDark}
            confirmed={confirmed}
          />
        )}
        {/* Password gate card */}
        {msg.card === 'password-gate' && msg.cardData && (
          <PasswordGateCard
            msg={String(msg.cardData.dangerMsg)}
            onUnlock={pw => onUnlock(msg.id, pw)}
            onCancel={() => onCancel(msg.id)}
            isDark={isDark}
          />
        )}
        {/* Result cards */}
        {msg.card && !['confirm', 'password-gate'].includes(msg.card) && (
          <ResultCard type={msg.card} data={msg.cardData} isDark={isDark} />
        )}

        <span className={`text-[10px] mt-1 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AIChatbot() {
  const store = useDashboardStore();
  const { isChatOpen, setChatOpen, isDarkMode: isDark, activePage } = store;

  // WELCOME is stable — defined outside render to avoid stale timestamp
  const welcomeRef = useRef<Message>({
    id: 'w0', role: 'assistant', timestamp: new Date(),
    content: `👋 Hi! I'm **EgoBot** — your fully autonomous AI assistant.\n\nI can act on your behalf:\n- 👤 **Add / delete contacts**\n- 📢 **Create / pause campaigns**\n- 📤 **Send SMS** to any number\n- 💳 **Top up credits** instantly\n- 🌙 **Toggle dark mode**, navigate pages\n- 🗑 **Bulk deletes** (password required)\n- 🎧 **Call / WhatsApp support** directly\n\nSensitive actions show a **Confirm/Reject** card. Dangerous actions need your password.\n\nTry: *"Add contact Sarah +256782345678"*`,
  });

  const [messages, setMessages] = useState<Message[]>([welcomeRef.current]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [minimized, setMinimized] = useState(false);
  // Pending intents waiting for confirm/password
  const pendingRef = useRef<Map<string, ParsedIntent>>(new Map());
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
      analytics: `📈 Analytics: **${store.smsStats.deliveryRate}%** delivery · ${store.smsStats.sent.toLocaleString()} sent this month.`,
      billing: `💳 Balance: **UGX ${store.balanceUGX.toLocaleString()}** · ${store.smsCredits.toLocaleString()} credits. Say *"top up 100000"* to top up instantly.`,
      contacts: `👥 **${store.contacts.length} contacts** loaded. Say *"add contact Name +256XXXXXXXXX"* to add one right now.`,
      campaigns: `📢 **${store.campaigns.length} campaigns** · ${store.campaigns.filter(c => c.status === 'running').length} running. Say *"create campaign Name"* to launch one.`,
    };
    const tip = tips[activePage];
    if (tip) setTimeout(() => pushBot(tip), 1400);
  }, [activePage]); // eslint-disable-line

  const pushBot = useCallback((content: string, card?: Message['card'], cardData?: Message['cardData']) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: Math.random().toString(36).slice(2),
        role: 'assistant', content, timestamp: new Date(), card, cardData,
      }]);
    }, 600 + Math.random() * 500);
  }, []);

  // ── Execute a parsed intent that has already been approved ───────────────
  const executeApproved = useCallback((parsed: ParsedIntent, msgId: string) => {
    const { intent, slots } = parsed;
    const s = store;

    if (intent === 'topup') {
      const ugx = +slots.ugx, credits = Math.floor(ugx / 20);
      s.addCredits(ugx, credits);
      s.addTransaction({
        type: 'topup', method: 'EgoBot', amount: ugx, credits,
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), status: 'success'
      });
      s.addNotification({ type: 'success', title: '💳 Top-Up Done!', message: `+${credits.toLocaleString()} credits added.` });
      pushBot(`✅ Done! **${credits.toLocaleString()} credits** added.\nNew balance: **UGX ${(s.balanceUGX + ugx).toLocaleString()}** · **${(s.smsCredits + credits).toLocaleString()} credits**.`,
        'topup-done', { ugx, credits });
    }

    else if (intent === 'send-sms') {
      if (s.smsCredits < 1) { pushBot(`⚠️ No credits. Say *"top up 50000"* to add credits first.`); return; }
      s.deductCredits(1);
      s.updateSmsStats({ sent: s.smsStats.sent + 1, delivered: s.smsStats.delivered + 1 });
      s.addTransaction({
        type: 'usage', method: `EgoBot SMS to ${slots.to}`, amount: -20, credits: -1,
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), status: 'success'
      });
      s.addNotification({ type: 'success', title: '📤 SMS Sent!', message: `To: ${slots.to} · 1 credit used.` });
      pushBot(`✅ SMS delivered to **${slots.to}**. ${s.smsCredits - 1} credits remaining.`, 'sms-sent', { to: slots.to, message: slots.message });
    }

    else if (intent === 'send-bulk-sms') {
      const targets = s.contacts.filter(c => slots.group === 'all contacts' || c.group.toLowerCase() === slots.group.toLowerCase());
      const count = targets.length || 1;
      if (s.smsCredits < count) { pushBot(`⚠️ Not enough credits (need ${count}, have ${s.smsCredits}). Top up first.`); return; }
      s.deductCredits(count);
      s.updateSmsStats({ sent: s.smsStats.sent + count, delivered: s.smsStats.delivered + count });
      s.addNotification({ type: 'success', title: '📤 Bulk SMS Sent!', message: `${count} messages sent to ${slots.group}.` });
      pushBot(`✅ Bulk SMS sent to **${count} recipients** in *${slots.group}*.\n${s.smsCredits - count} credits remaining.`);
    }

    else if (intent === 'delete-contact') {
      const found = s.contacts.find(c => c.name.toLowerCase().includes(slots.name.toLowerCase()));
      if (!found) { pushBot(`🔍 No contact named **"${slots.name}"** found.`); return; }
      s.deleteContact(found.id);
      s.addNotification({ type: 'warning', title: 'Contact Deleted', message: `${found.name} removed.` });
      pushBot(`🗑️ **${found.name}** deleted. ${s.contacts.length - 1} contacts remain.`,
        'contact-deleted', { msg: `${found.name} (${found.phone}) permanently deleted.` });
    }

    else if (intent === 'pause-campaign') {
      const camp = s.campaigns.find(c => c.name.toLowerCase().includes(slots.name.toLowerCase()));
      if (!camp) { pushBot(`🔍 No campaign named **"${slots.name}"** found.`); return; }
      s.updateCampaign(camp.id, { status: 'paused' });
      s.addNotification({ type: 'warning', title: 'Campaign Paused', message: `"${camp.name}" is now paused.` });
      pushBot(`⏸ Campaign **"${camp.name}"** has been paused. Say *"resume campaign ${camp.name}"* to restart it.`);
    }

    else if (intent === 'change-sender') {
      s.addNotification({ type: 'info', title: 'Sender ID Updated', message: `Default sender set to ${slots.sender}.` });
      pushBot(`✅ Default sender ID updated to **${slots.sender}**. New campaigns will use this ID.`);
    }

    else if (intent === 'delete-all-contacts') {
      const count = s.contacts.length;
      s.contacts.forEach(c => s.deleteContact(c.id));
      s.addNotification({ type: 'error', title: '⚠️ All Contacts Deleted', message: `${count} contacts permanently removed.` });
      pushBot(`🗑️ All **${count} contacts** have been permanently deleted.`,
        'bulk-deleted', { msg: `${count} contacts permanently deleted.` });
    }

    else if (intent === 'delete-all-campaigns') {
      const count = s.campaigns.length;
      s.campaigns.forEach(c => s.updateCampaign(c.id, { status: 'paused' }));
      s.addNotification({ type: 'error', title: '⚠️ All Campaigns Cleared', message: `${count} campaigns removed.` });
      pushBot(`🗑️ All **${count} campaigns** have been cleared.`, 'bulk-deleted', { msg: `${count} campaigns deleted.` });
    }

    else if (intent === 'delete-all-transactions') {
      s.addNotification({ type: 'error', title: '⚠️ History Cleared', message: 'All billing history removed.' });
      pushBot(`🗑️ Billing history cleared. Note: balance and credits are unchanged.`, 'bulk-deleted', { msg: 'Transaction history cleared.' });
    }
  }, [store, pushBot]); // eslint-disable-line

  // ── Handle incoming message ───────────────────────────────────────────────
  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    setInput('');

    const userMsgId = Math.random().toString(36).slice(2);
    setMessages(prev => [...prev, { id: userMsgId, role: 'user', content: text, timestamp: new Date() }]);

    const parsed = parseIntent(text);
    const s = store;

    // BLOCKED
    if (parsed.security === 'blocked') {
      pushBot(`⛔ This request has been **blocked** for system safety.\n\nI cannot perform this action via chat. Please contact support if you need assistance.`, 'escalated');
      return;
    }

    // DANGEROUS — show password gate
    if (parsed.security === 'dangerous') {
      const gateId = Math.random().toString(36).slice(2);
      pendingRef.current.set(gateId, parsed);
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          id: gateId, role: 'assistant', timestamp: new Date(),
          content: `⚠️ **Dangerous operation requested.**\nThis action is irreversible and requires your account password to proceed.`,
          card: 'password-gate',
          cardData: { dangerMsg: parsed.dangerMsg || 'This is a destructive operation.' },
        }]);
      }, 600);
      return;
    }

    // SENSITIVE — show confirm card
    if (parsed.security === 'sensitive') {
      const confirmId = Math.random().toString(36).slice(2);
      pendingRef.current.set(confirmId, parsed);
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          id: confirmId, role: 'assistant', timestamp: new Date(),
          content: `I'm ready to do this for you. Please confirm:`,
          card: 'confirm',
          cardData: { confirmMsg: parsed.confirmMsg || 'Proceed with this action?' },
        }]);
      }, 500);
      return;
    }

    // SAFE — execute immediately
    const { intent, slots } = parsed;

    if (intent === 'greet')
      return pushBot(`Hello! 👋 Balance: **UGX ${s.balanceUGX.toLocaleString()}** · **${s.smsCredits.toLocaleString()} credits**.\nWhat would you like me to do?`);
    if (intent === 'thanks')
      return pushBot(`You're welcome! 😊 ${s.smsCredits.toLocaleString()} credits ready. Anything else?`);
    if (intent === 'help')
      return pushBot(`🤖 **Full command list:**\n\n**Safe (instant):**\n- *"Add contact Name +256XXXXXXXXX"*\n- *"Create campaign Name, sender ID"*\n- *"Go to billing / analytics / reports…"*\n- *"Toggle dark mode"*, *"Check balance"*, *"Show stats"*\n\n**Sensitive (confirm required):**\n- *"Send sms to +256XXXXXXXXX message Hello"*\n- *"Top up 100000"*\n- *"Delete contact John"*\n- *"Pause campaign Name"*\n- *"Send bulk sms to VIP Customers"*\n\n**Dangerous (password required):**\n- *"Delete all contacts"*\n- *"Delete all campaigns"*\n- *"Clear transaction history"*\n\n**Blocked (support only):**\n- Drop database, delete account, security bypass`);
    if (intent === 'balance')
      return pushBot(`💳 **Live Balance:**\n\n- UGX **${s.balanceUGX.toLocaleString()}**\n- Credits: **${s.smsCredits.toLocaleString()} SMS**\n- Cost/SMS: UGX 20\n- Enough for ~${s.smsCredits.toLocaleString()} more sends`);
    if (intent === 'stats')
      return pushBot(`📊 **Live Stats:**\n\n- Sent: **${s.smsStats.sent.toLocaleString()}**\n- Delivered: **${s.smsStats.delivered.toLocaleString()}** (${s.smsStats.deliveryRate}%)\n- Failed: **${s.smsStats.failed.toLocaleString()}**\n- Contacts: **${s.contacts.length}** · Campaigns: **${s.campaigns.length}**`);
    if (intent === 'list-contacts') {
      const rows = s.contacts.slice(-5).reverse().map(c => `• **${c.name}** · ${c.phone} · ${c.network}`).join('\n');
      return pushBot(`👥 **${s.contacts.length} contacts** (latest 5):\n\n${rows}`);
    }
    if (intent === 'contacts-info')
      return pushBot(`👥 **${s.contacts.length} total contacts**. Latest: **${s.contacts[s.contacts.length - 1]?.name || '—'}**.\n\nSay *"add contact Name +256XXXXXXXXX"* to add one.`);
    if (intent === 'list-campaigns') {
      const rows = s.campaigns.slice(0, 5).map(c => `• **${c.name}** · ${c.status} · ${c.rate > 0 ? c.rate + '%' : '—'}`).join('\n');
      return pushBot(`📢 **${s.campaigns.length} campaigns**:\n\n${rows}`);
    }
    if (intent === 'campaigns-info')
      return pushBot(`📢 Total: **${s.campaigns.length}** · Running: **${s.campaigns.filter(c => c.status === 'running').length}** · Completed: **${s.campaigns.filter(c => c.status === 'completed').length}**\n\nSay *"create campaign Name"* to launch one.`);
    if (intent === 'topup-info')
      return pushBot(`💰 **Top-Up Packages:**\n\n| Package | Credits | Price |\n|---------|---------|-------|\n| Starter | 200 | UGX 10,000 |\n| Pro ⭐ | 2,000 | UGX 100,000 |\n| Scale | 10,000 | UGX 500,000 |\n| Enterprise | 22,000+ | UGX 1,000,000 |\n\nSay *"top up 100000"* to add credits instantly.`);
    if (intent === 'add-contact') {
      const groupMap: Record<string, string> = { vip: 'VIP Customers', newsletter: 'Newsletter', staff: 'Staff', partners: 'Partners' };
      const group = groupMap[slots.group.toLowerCase()] || slots.group;
      const netMap: Record<string, string> = { mtn: 'MTN', airtel: 'Airtel', africell: 'Africell', smile: 'Smile' };
      const network = netMap[slots.network.toLowerCase()] || 'MTN';
      s.addContact({ name: slots.name, phone: slots.phone, group, added: 'Today', network });
      s.addNotification({ type: 'success', title: '👤 Contact Added!', message: `${slots.name} added to ${group}.` });
      return pushBot(`✅ **${slots.name}** added! ${s.contacts.length + 1} contacts total.`, 'contact-added', { name: slots.name, phone: slots.phone, group });
    }
    if (intent === 'create-campaign') {
      s.addCampaign({ name: slots.name, sent: 0, delivered: 0, rate: 0, status: slots.status as 'scheduled' | 'running', date: slots.date, sender: slots.sender });
      s.addNotification({ type: 'success', title: '📢 Campaign Created!', message: `"${slots.name}" is now ${slots.status}.` });
      return pushBot(`✅ Campaign **"${slots.name}"** created!\n- Sender: **${slots.sender}** · Status: **${slots.status}**`, 'campaign-added', { name: slots.name, sender: slots.sender, status: slots.status });
    }
    if (intent === 'navigate') {
      s.setActivePage(slots.page as Parameters<typeof s.setActivePage>[0]);
      return pushBot(`🚀 Navigated to **${slots.page.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}**.`);
    }
    if (intent === 'dark-mode') {
      s.toggleDarkMode();
      return pushBot(`${s.isDarkMode ? '☀️ Switched to Light Mode.' : '🌙 Switched to Dark Mode.'}`);
    }
    if (intent === 'send-help')
      return pushBot(`📤 **Send SMS format:**\n*"Send sms to +256701234567 message Your text here"*\n\nFor bulk:\n*"Send bulk sms to Newsletter message Sale ends tonight!"*`);
    if (intent === 'support')
      return pushBot(`🎧 Here's how to reach the EgoSMS team:`, 'support');

    // Unknown
    pushBot(`🤔 Not sure about that. Here's what I can do:\n- *"Add contact"*, *"Delete contact"*, *"Send sms"*\n- *"Create campaign"*, *"Top up 50000"*\n- *"Check balance"*, *"Show stats"*\n- *"Go to billing"*, *"Toggle dark mode"*\n\nSay **help** for the full list, or **talk to support**.`, 'support');
  }, [input, store, pushBot]); // eslint-disable-line

  // Confirm approved
  const handleConfirm = useCallback((msgId: string) => {
    const parsed = pendingRef.current.get(msgId);
    if (parsed) { pendingRef.current.delete(msgId); executeApproved(parsed, msgId); }
  }, [executeApproved]);

  // Confirm rejected
  const handleReject = useCallback((msgId: string) => {
    pendingRef.current.delete(msgId);
    pushBot(`❌ Action cancelled. No changes were made.`);
  }, [pushBot]);

  // Password unlocked — pw already validated by PasswordGateCard, not needed here
  const handleUnlock = useCallback((msgId: string, _pw: string) => { // eslint-disable-line @typescript-eslint/no-unused-vars
    const parsed = pendingRef.current.get(msgId);
    if (parsed) { pendingRef.current.delete(msgId); executeApproved(parsed, msgId); }
  }, [executeApproved]);

  // Password cancelled
  const handleCancel = useCallback((msgId: string) => {
    pendingRef.current.delete(msgId);
    pushBot(`🔒 Operation cancelled. No data was changed.`);
  }, [pushBot]);

  // ── Floating bubble ───────────────────────────────────────────────────────
  if (!isChatOpen) return (
    <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
      onClick={() => setChatOpen(true)}
      className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#10B981] flex items-center justify-center shadow-2xl shadow-blue-500/40 z-50">
      <MessageSquare className="w-6 h-6 text-white" />
      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">AI</span>
    </motion.button>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl border shadow-2xl overflow-hidden backdrop-blur-xl transition-all duration-300 w-[390px] ${minimized ? 'h-[54px]' : 'h-[610px]'
        } ${isDark ? 'bg-[#0F172A]/96 border-slate-700' : 'bg-white/96 border-slate-200'}`}>

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
              Autonomous · Live data · Secured
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setMessages([welcomeRef.current])} title="Clear chat"
            className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/30 flex items-center justify-center">
            <RefreshCw className="w-3.5 h-3.5 text-white" />
          </button>
          <button onClick={() => setMinimized(v => !v)}
            className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/30 flex items-center justify-center">
            {minimized ? <ChevronDown className="w-3.5 h-3.5 text-white" /> : <Minimize2 className="w-3.5 h-3.5 text-white" />}
          </button>
          <button onClick={() => setChatOpen(false)}
            className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/30 flex items-center justify-center">
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
                <InteractiveMessage
                  key={msg.id}
                  msg={msg}
                  isDark={isDark}
                  onConfirm={handleConfirm}
                  onReject={handleReject}
                  onUnlock={handleUnlock}
                  onCancel={handleCancel}
                />
              ))}
            </AnimatePresence>
            {isTyping && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#2563EB] to-[#10B981] flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className={`px-4 py-3 rounded-2xl rounded-tl-sm ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
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

          {/* Quick actions */}
          <div className={`px-3 py-2 border-t flex gap-1.5 flex-wrap ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            {QUICK_ACTIONS.map(a => (
              <button key={a.label} onClick={() => { setInput(a.cmd); setTimeout(() => inputRef.current?.focus(), 50); }}
                className={`text-[10px] font-medium px-2 py-1 rounded-lg border transition-all hover:scale-105 ${isDark ? 'border-slate-700 text-slate-400 hover:border-blue-500 hover:text-blue-400 bg-slate-800/60'
                  : 'border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 bg-white'
                  }`}>
                {a.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className={`p-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <div className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-colors ${isDark ? 'bg-slate-800 border-slate-700 focus-within:border-blue-500' : 'bg-slate-50 border-slate-200 focus-within:border-blue-400'
              }`}>
              <Zap className="w-4 h-4 text-[#2563EB] flex-shrink-0" />
              <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder='e.g. "Add contact John +256701234567"'
                className={`flex-1 text-xs bg-transparent outline-none ${isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'}`} />
              <button onClick={handleSend} disabled={!input.trim()}
                className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#10B981] flex items-center justify-center disabled:opacity-35 hover:scale-105 transition-all">
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
            <p className={`text-center text-[9px] mt-1.5 ${isDark ? 'text-slate-700' : 'text-slate-300'}`}>
              Sensitive actions require confirmation · Dangerous actions need password
            </p>
          </div>
        </>
      )}
    </motion.div>
  );
}
