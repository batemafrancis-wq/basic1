import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2, Copy, CheckCircle2, Key, Webhook, Book, Download,
  Play, Plus, Trash2, Eye, EyeOff, RefreshCw, Zap, Globe,
  Terminal, Shield, AlertTriangle, ChevronDown, ChevronRight,
} from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';

const SDK_LIBS = [
  { name: 'PHP SDK', lang: 'PHP', version: 'v2.1.0', icon: '🐘', color: 'from-indigo-500 to-indigo-600' },
  { name: 'Node.js SDK', lang: 'JavaScript', version: 'v2.3.1', icon: '🟩', color: 'from-green-500 to-green-600' },
  { name: 'Python SDK', lang: 'Python', version: 'v2.0.4', icon: '🐍', color: 'from-blue-500 to-blue-600' },
  { name: 'Java SDK', lang: 'Java', version: 'v1.8.2', icon: '☕', color: 'from-orange-500 to-orange-600' },
];

const ENDPOINTS = [
  { method: 'POST', path: '/api/v2/sms/send', desc: 'Send a single or bulk SMS', tag: 'SMS' },
  { method: 'GET', path: '/api/v2/sms/status/{id}', desc: 'Get delivery status by message ID', tag: 'SMS' },
  { method: 'GET', path: '/api/v2/contacts', desc: 'List all contacts', tag: 'Contacts' },
  { method: 'POST', path: '/api/v2/contacts', desc: 'Create a new contact', tag: 'Contacts' },
  { method: 'GET', path: '/api/v2/balance', desc: 'Check current SMS credit balance', tag: 'Account' },
  { method: 'GET', path: '/api/v2/campaigns', desc: 'List all campaigns', tag: 'Campaigns' },
  { method: 'POST', path: '/api/v2/campaigns', desc: 'Create and schedule a campaign', tag: 'Campaigns' },
];

const methodColors: Record<string, string> = {
  GET: 'bg-emerald-100 text-emerald-700',
  POST: 'bg-blue-100 text-blue-700',
  PUT: 'bg-amber-100 text-amber-700',
  DELETE: 'bg-red-100 text-red-700',
};

const CODE_SAMPLES: Record<string, string> = {
  curl: `curl -X POST https://api.egosms.co/v2/sms/send \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "sender": "EGOSMS",
    "recipients": ["+256701234567"],
    "message": "Hello from EgoSMS API!"
  }'`,
  node: `const axios = require('axios');

const response = await axios.post(
  'https://api.egosms.co/v2/sms/send',
  {
    sender: 'EGOSMS',
    recipients: ['+256701234567'],
    message: 'Hello from EgoSMS API!',
  },
  { headers: { Authorization: 'Bearer YOUR_API_KEY' } }
);
console.log(response.data);`,
  python: `import requests

resp = requests.post(
    'https://api.egosms.co/v2/sms/send',
    headers={'Authorization': 'Bearer YOUR_API_KEY'},
    json={
        'sender': 'EGOSMS',
        'recipients': ['+256701234567'],
        'message': 'Hello from EgoSMS API!',
    }
)
print(resp.json())`,
  php: `<?php
$client = new \\GuzzleHttp\\Client();
$response = $client->post('https://api.egosms.co/v2/sms/send', [
    'headers' => ['Authorization' => 'Bearer YOUR_API_KEY'],
    'json' => [
        'sender'     => 'EGOSMS',
        'recipients' => ['+256701234567'],
        'message'    => 'Hello from EgoSMS API!',
    ],
]);
echo $response->getBody();`,
};

interface ApiKey {
  id: string;
  name: string;
  key: string;
  created: string;
  lastUsed: string;
  permissions: string[];
}

const initialKeys: ApiKey[] = [
  { id: '1', name: 'Production Key', key: 'ego_live_sk_4xT9mK2pQr8vLn', created: 'Oct 1, 2024', lastUsed: '2 hours ago', permissions: ['send_sms', 'read_contacts', 'read_reports'] },
  { id: '2', name: 'Test Key', key: 'ego_test_sk_7yW3jH5sAb1cMd', created: 'Sep 15, 2024', lastUsed: '3 days ago', permissions: ['send_sms'] },
];

const WEBHOOK_EVENTS = [
  { event: 'sms.delivered', desc: 'Fires when an SMS is confirmed delivered', enabled: true },
  { event: 'sms.failed', desc: 'Fires when an SMS delivery fails', enabled: true },
  { event: 'sms.queued', desc: 'Fires when an SMS enters the send queue', enabled: false },
  { event: 'campaign.done', desc: 'Fires when a campaign finishes sending', enabled: true },
  { event: 'balance.low', desc: 'Fires when credit balance falls below 500', enabled: true },
];

export default function APIPage() {
  const { isDarkMode, addNotification } = useDashboardStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'keys' | 'webhooks' | 'docs'>('overview');
  const [codeLang, setCodeLang] = useState('curl');
  const [copied, setCopied] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(initialKeys);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [webhooks, setWebhooks] = useState(WEBHOOK_EVENTS);
  const [webhookUrl, setWebhookUrl] = useState('https://yoursite.com/webhooks/egosms');
  const [testingEndpoint, setTestingEndpoint] = useState<string | null>(null);
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, string>>({});

  const card = `rounded-2xl border p-5 ${isDarkMode ? 'bg-[#1E293B] border-slate-700/60' : 'bg-white border-slate-200/60'} shadow-sm`;
  const muted = `text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`;

  const copyCode = () => {
    navigator.clipboard.writeText(CODE_SAMPLES[codeLang]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    addNotification({ type: 'success', title: 'Copied!', message: 'API key copied to clipboard.' });
  };

  const revokeKey = (id: string) => {
    setApiKeys(prev => prev.filter(k => k.id !== id));
    addNotification({ type: 'warning', title: 'Key Revoked', message: 'The API key has been permanently revoked.' });
  };

  const createKey = () => {
    const newKey: ApiKey = {
      id: String(Date.now()),
      name: 'New Key',
      key: 'ego_live_sk_' + Math.random().toString(36).slice(2, 14),
      created: 'Today',
      lastUsed: 'Never',
      permissions: ['send_sms'],
    };
    setApiKeys(prev => [...prev, newKey]);
    addNotification({ type: 'success', title: '🔑 Key Created', message: 'New API key generated. Store it securely.' });
  };

  const toggleReveal = (id: string) => {
    setRevealedKeys(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleWebhook = (index: number) => {
    setWebhooks(prev => prev.map((w, i) => i === index ? { ...w, enabled: !w.enabled } : w));
  };

  const testEndpoint = (path: string) => {
    setTestingEndpoint(path);
    setTimeout(() => {
      setTestingEndpoint(null);
      setTestResult(prev => ({
        ...prev,
        [path]: JSON.stringify({ status: 'success', message_id: 'msg_' + Math.random().toString(36).slice(2, 10), credits_used: 1 }, null, 2),
      }));
    }, 1200);
  };

  const TABS = [
    { key: 'overview', label: 'Overview', icon: Globe },
    { key: 'keys', label: 'API Keys', icon: Key },
    { key: 'webhooks', label: 'Webhooks', icon: Webhook },
    { key: 'docs', label: 'Docs', icon: Book },
  ] as const;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>API Integration</h2>
          <p className={muted}>Integrate EgoSMS into your applications via REST API v2.0</p>
        </div>
        <a
          href="https://developers.pahappa.com"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white text-xs font-bold shadow-md"
        >
          <Book className="w-3.5 h-3.5" />
          Full Docs
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'API Version', value: 'v2.0', icon: Code2, color: 'from-blue-500 to-blue-600' },
          { label: 'Requests Today', value: '1,284', icon: Terminal, color: 'from-violet-500 to-purple-600' },
          { label: 'Uptime (30d)', value: '99.98%', icon: Shield, color: 'from-emerald-500 to-green-600' },
          { label: 'Avg Latency', value: '142ms', icon: Zap, color: 'from-amber-500 to-orange-500' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className={`rounded-xl border p-4 ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}>
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center mb-2`}>
              <s.icon className="w-4 h-4 text-white" />
            </div>
            <div className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{s.value}</div>
            <div className={muted}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className={`flex gap-1 p-1 rounded-xl border w-fit ${isDarkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
        {TABS.map(t => (
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

      {/* ── OVERVIEW TAB ── */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Base URL */}
            <div className={card}>
              <h3 className={`text-sm font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Base URL</h3>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl font-mono text-sm ${isDarkMode ? 'bg-slate-900 border border-slate-700' : 'bg-slate-50 border border-slate-200'}`}>
                <Globe className="w-4 h-4 text-[#2563EB] flex-shrink-0" />
                <span className={isDarkMode ? 'text-green-400' : 'text-green-700'}>https://api.egosms.co/v2</span>
                <button onClick={() => { navigator.clipboard.writeText('https://api.egosms.co/v2'); addNotification({ type: 'success', title: 'Copied!', message: 'Base URL copied.' }); }}
                  className="ml-auto text-slate-400 hover:text-[#2563EB] transition-colors">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Code Samples */}
            <div className={card}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Quick Start — Send SMS</h3>
                <div className="flex gap-1">
                  {Object.keys(CODE_SAMPLES).map(lang => (
                    <button key={lang} onClick={() => setCodeLang(lang)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${codeLang === lang ? 'bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white' : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
                        }`}>
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
              <div className={`relative rounded-xl overflow-hidden ${isDarkMode ? 'bg-slate-900 border border-slate-700' : 'bg-slate-900'}`}>
                <pre className="p-4 text-[12px] text-green-300 font-mono overflow-x-auto leading-relaxed">{CODE_SAMPLES[codeLang]}</pre>
                <button onClick={copyCode}
                  className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-700/80 text-slate-300 hover:text-white text-[11px] font-semibold transition-all">
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* SDK Downloads */}
            <div className={card}>
              <h3 className={`text-sm font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>SDK Libraries</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {SDK_LIBS.map((sdk, i) => (
                  <motion.button key={sdk.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                    whileHover={{ y: -2 }}
                    onClick={() => addNotification({ type: 'info', title: `📦 ${sdk.name}`, message: `Download started for ${sdk.name} ${sdk.version}` })}
                    className={`p-4 rounded-xl border text-left transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:border-blue-500/40' : 'bg-slate-50 border-slate-200 hover:border-blue-300'}`}>
                    <div className="text-2xl mb-2">{sdk.icon}</div>
                    <div className={`text-xs font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{sdk.name}</div>
                    <div className={`text-[10px] mt-0.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{sdk.version}</div>
                    <div className="flex items-center gap-1 mt-2 text-[#2563EB]">
                      <Download className="w-3 h-3" />
                      <span className="text-[10px] font-semibold">Download</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── KEYS TAB ── */}
        {activeTab === 'keys' && (
          <motion.div key="keys" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className={card}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>API Keys</h3>
                  <p className={`text-xs mt-0.5 ${muted}`}>Keep your keys secret — treat them like passwords</p>
                </div>
                <button onClick={createKey}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white text-xs font-bold shadow-md">
                  <Plus className="w-3.5 h-3.5" /> New Key
                </button>
              </div>

              <div className="space-y-3">
                {apiKeys.map((k, i) => (
                  <motion.div key={k.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                    className={`rounded-xl border p-4 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{k.name}</div>
                        <div className={`text-[10px] mt-0.5 ${muted}`}>Created {k.created} · Last used {k.lastUsed}</div>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button onClick={() => toggleReveal(k.id)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all ${isDarkMode ? 'border-slate-600 text-slate-400 hover:text-white' : 'border-slate-200 text-slate-500 hover:text-slate-800'}`}>
                          {revealedKeys.has(k.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => copyKey(k.key)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all ${isDarkMode ? 'border-slate-600 text-slate-400 hover:text-white' : 'border-slate-200 text-slate-500 hover:text-slate-800'}`}>
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => revokeKey(k.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center border border-red-200 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className={`font-mono text-[12px] px-3 py-2 rounded-lg ${isDarkMode ? 'bg-slate-900 text-green-400' : 'bg-white text-green-700 border border-slate-200'}`}>
                      {revealedKeys.has(k.id) ? k.key : k.key.slice(0, 12) + '••••••••••••••••'}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {k.permissions.map(p => (
                        <span key={p} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>{p}</span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className={`mt-4 p-3 rounded-xl flex items-start gap-3 ${isDarkMode ? 'bg-amber-900/20 border border-amber-800/30' : 'bg-amber-50 border border-amber-100'}`}>
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-600 dark:text-amber-400">Never expose API keys in client-side code or public repositories. Use environment variables in production.</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── WEBHOOKS TAB ── */}
        {activeTab === 'webhooks' && (
          <motion.div key="webhooks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className={card}>
              <h3 className={`text-sm font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Webhook Endpoint</h3>
              <div className="flex gap-2">
                <input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)}
                  className={`flex-1 px-3 py-2.5 rounded-xl border text-sm outline-none font-mono ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                <button onClick={() => addNotification({ type: 'success', title: '✅ Webhook Saved', message: 'Endpoint URL updated successfully.' })}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white text-xs font-bold">
                  Save
                </button>
                <button onClick={() => addNotification({ type: 'info', title: '🔔 Test Sent', message: 'A test payload was sent to your webhook endpoint.' })}
                  className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-semibold ${isDarkMode ? 'border-slate-600 text-slate-300' : 'border-slate-200 text-slate-700'}`}>
                  <Play className="w-3.5 h-3.5" /> Test
                </button>
              </div>
            </div>

            <div className={card}>
              <h3 className={`text-sm font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Event Subscriptions</h3>
              <div className="space-y-2.5">
                {webhooks.map((w, i) => (
                  <div key={w.event} className={`flex items-center justify-between px-4 py-3 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex-1 min-w-0 pr-4">
                      <div className={`text-xs font-bold font-mono ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{w.event}</div>
                      <div className={`text-[11px] mt-0.5 ${muted}`}>{w.desc}</div>
                    </div>
                    <button onClick={() => toggleWebhook(i)}
                      className={`w-10 h-5.5 rounded-full relative transition-all duration-300 flex-shrink-0 ${w.enabled ? 'bg-gradient-to-r from-[#2563EB] to-[#10B981]' : isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}
                      style={{ height: '22px', minWidth: '40px' }}>
                      <motion.div animate={{ x: w.enabled ? 20 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="absolute top-1 w-3.5 h-3.5 bg-white rounded-full shadow-sm" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className={card}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Recent Webhook Deliveries</h3>
                <button className={`text-xs font-semibold text-[#2563EB] flex items-center gap-1`}><RefreshCw className="w-3 h-3" /> Refresh</button>
              </div>
              {[
                { event: 'sms.delivered', ts: '2 min ago', status: 'success', code: 200 },
                { event: 'sms.delivered', ts: '8 min ago', status: 'success', code: 200 },
                { event: 'balance.low', ts: '1 hr ago', status: 'failed', code: 503 },
                { event: 'campaign.done', ts: '3 hrs ago', status: 'success', code: 200 },
              ].map((d, i) => (
                <div key={i} className={`flex items-center gap-4 py-2.5 border-b last:border-0 ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${d.status === 'success' ? 'bg-[#10B981]' : 'bg-red-400'}`} />
                  <span className={`text-[11px] font-mono flex-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{d.event}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${d.status === 'success' ? isDarkMode ? 'bg-green-900/40 text-green-400' : 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{d.code}</span>
                  <span className={`text-[10px] ${muted}`}>{d.ts}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── DOCS TAB ── */}
        {activeTab === 'docs' && (
          <motion.div key="docs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className={card}>
              <h3 className={`text-sm font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Endpoint Reference</h3>
              <div className="space-y-2">
                {ENDPOINTS.map((ep) => (
                  <div key={ep.path}>
                    <button
                      onClick={() => setExpandedEndpoint(expandedEndpoint === ep.path ? null : ep.path)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:border-slate-600' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg flex-shrink-0 ${methodColors[ep.method] || 'bg-slate-100 text-slate-600'}`}>{ep.method}</span>
                      <span className={`font-mono text-xs flex-1 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{ep.path}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'}`}>{ep.tag}</span>
                      {expandedEndpoint === ep.path ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                    </button>
                    <AnimatePresence>
                      {expandedEndpoint === ep.path && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden">
                          <div className={`mx-1 p-4 rounded-b-xl border border-t-0 ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                            <p className={`text-xs mb-3 ${muted}`}>{ep.desc}</p>
                            <div className="flex items-center gap-2">
                              <button onClick={() => testEndpoint(ep.path)}
                                disabled={testingEndpoint === ep.path}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white text-[11px] font-bold disabled:opacity-60">
                                {testingEndpoint === ep.path
                                  ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Testing...</>
                                  : <><Play className="w-3 h-3" /> Try It</>}
                              </button>
                            </div>
                            {testResult[ep.path] && (
                              <pre className={`mt-3 p-3 rounded-lg text-[11px] font-mono leading-relaxed ${isDarkMode ? 'bg-slate-900 text-green-400' : 'bg-slate-900 text-green-300'}`}>
                                {testResult[ep.path]}
                              </pre>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>

            {/* Rate Limits */}
            <div className={card}>
              <h3 className={`text-sm font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Rate Limits</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { plan: 'Free', limit: '100 req / hr', color: 'from-slate-400 to-slate-500' },
                  { plan: 'Pro', limit: '5,000 req / hr', color: 'from-[#2563EB] to-[#10B981]' },
                  { plan: 'Enterprise', limit: 'Unlimited', color: 'from-violet-500 to-purple-600' },
                ].map(r => (
                  <div key={r.plan} className={`p-3 rounded-xl ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                    <div className={`text-xs font-bold bg-gradient-to-r ${r.color} bg-clip-text text-transparent`}>{r.plan}</div>
                    <div className={`text-sm font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{r.limit}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
