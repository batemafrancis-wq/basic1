import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Shield, Bell, MessageSquare, Key, Camera, Save,
  Plus, Trash2, CheckCircle2, Eye, EyeOff, Copy, RefreshCw,
  Smartphone, Mail, Globe, Lock, AlertTriangle, X, LogOut,
} from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';

const TABS = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'senderids', label: 'Sender IDs', icon: MessageSquare },
  { key: 'notifs', label: 'Notifications', icon: Bell },
  { key: 'security', label: 'Security', icon: Shield },
] as const;

type Tab = typeof TABS[number]['key'];

interface SenderID {
  id: string;
  name: string;
  status: 'approved' | 'pending' | 'rejected';
  type: 'alphanumeric' | 'numeric';
  added: string;
}

const initialSenderIDs: SenderID[] = [
  { id: '1', name: 'EGOSMS', status: 'approved', type: 'alphanumeric', added: 'Jan 5, 2024' },
  { id: '2', name: 'FLASH', status: 'approved', type: 'alphanumeric', added: 'Mar 12, 2024' },
  { id: '3', name: 'CLINIC', status: 'approved', type: 'alphanumeric', added: 'Jun 20, 2024' },
  { id: '4', name: 'DEALS', status: 'pending', type: 'alphanumeric', added: 'Oct 29, 2024' },
  { id: '5', name: '256SHOP', status: 'rejected', type: 'alphanumeric', added: 'Oct 15, 2024' },
];

const NOTIF_SETTINGS = [
  { key: 'delivery', label: 'Delivery Reports', desc: 'Get notified when SMS delivery status changes', email: true, sms: false, push: true },
  { key: 'campaign', label: 'Campaign Completion', desc: 'Alert when a campaign finishes sending', email: true, sms: true, push: true },
  { key: 'balance_low', label: 'Low Balance Warning', desc: 'Alert when credits fall below your threshold', email: true, sms: true, push: true },
  { key: 'topup', label: 'Top-Up Confirmations', desc: 'Confirm successful credit purchases', email: true, sms: false, push: false },
  { key: 'anomaly', label: 'AI Anomaly Alerts', desc: 'AI-detected unusual delivery patterns', email: false, sms: false, push: true },
  { key: 'api_error', label: 'API Error Alerts', desc: 'Notify when API error rate exceeds 5%', email: true, sms: false, push: false },
];

const statusStyle: Record<string, string> = {
  approved: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  rejected: 'bg-red-100 text-red-600',
};

export default function SettingsPage() {
  const { isDarkMode, addNotification } = useDashboardStore();

  const [activeTab, setActiveTab] = useState<Tab>('profile');

  // Profile state
  const [profile, setProfile] = useState({
    name: 'John Mukasa', email: 'john.mukasa@pahappa.com',
    phone: '+256 701 234 567', company: 'Pahappa Limited',
    website: 'https://pahappa.com', timezone: 'Africa/Kampala',
    language: 'English',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Sender IDs state
  const [senderIDs, setSenderIDs] = useState<SenderID[]>(initialSenderIDs);
  const [newSenderID, setNewSenderID] = useState('');
  const [showSenderForm, setShowSenderForm] = useState(false);

  // Notifications state
  const [notifs, setNotifs] = useState(NOTIF_SETTINGS.map(n => ({ ...n })));

  // Security state
  const [twoFA, setTwoFA] = useState(false);
  const [showTwoFASetup, setShowTwoFASetup] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState<Record<string, boolean>>({});
  const [sessions] = useState([
    { device: 'Chrome · Windows 11', location: 'Kampala, UG', time: 'Active now', current: true },
    { device: 'Mobile · Android 14', location: 'Kampala, UG', time: '2 hrs ago', current: false },
    { device: 'Firefox · macOS', location: 'Nairobi, KE', time: '3 days ago', current: false },
  ]);

  const card = `rounded-2xl border p-5 ${isDarkMode ? 'bg-[#1E293B] border-slate-700/60' : 'bg-white border-slate-200/60'} shadow-sm`;
  const inputCls = `w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600 focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-400'}`;
  const labelCls = `text-xs font-semibold block mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`;
  const muted = `text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`;

  const saveProfile = () => {
    setSavingProfile(true);
    setTimeout(() => {
      setSavingProfile(false);
      addNotification({ type: 'success', title: '✅ Profile Saved', message: 'Your account details have been updated.' });
    }, 1200);
  };

  const addSenderID = () => {
    const val = newSenderID.trim().toUpperCase();
    if (!val || val.length < 3 || val.length > 11) {
      addNotification({ type: 'error', title: 'Invalid Sender ID', message: 'Must be 3–11 characters, letters and numbers only.' });
      return;
    }
    setSenderIDs(prev => [...prev, {
      id: String(Date.now()), name: val, status: 'pending',
      type: 'alphanumeric', added: 'Today',
    }]);
    setNewSenderID('');
    setShowSenderForm(false);
    addNotification({ type: 'info', title: '📋 Sender ID Submitted', message: `"${val}" is under review. Approval takes 1-2 business days.` });
  };

  const deleteSenderID = (id: string) => {
    setSenderIDs(prev => prev.filter(s => s.id !== id));
    addNotification({ type: 'warning', title: 'Sender ID Removed', message: 'The sender ID has been deleted from your account.' });
  };

  const toggleNotif = (index: number, channel: 'email' | 'sms' | 'push') => {
    setNotifs(prev => prev.map((n, i) => i === index ? { ...n, [channel]: !n[channel] } : n));
  };

  const savePassword = () => {
    if (!currentPw) { addNotification({ type: 'error', title: 'Required', message: 'Enter your current password.' }); return; }
    if (newPw.length < 8) { addNotification({ type: 'error', title: 'Too Short', message: 'New password must be at least 8 characters.' }); return; }
    if (newPw !== confirmPw) { addNotification({ type: 'error', title: 'Mismatch', message: 'New passwords do not match.' }); return; }
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
    addNotification({ type: 'success', title: '🔒 Password Updated', message: 'Your password has been changed successfully.' });
  };

  const toggleRevealPw = (key: string) => setShowPw(prev => ({ ...prev, [key]: !prev[key] }));

  const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <button onClick={onToggle}
      className={`rounded-full relative transition-all duration-300 flex-shrink-0 ${on ? 'bg-gradient-to-r from-[#2563EB] to-[#10B981]' : isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}
      style={{ width: 40, height: 22 }}>
      <motion.div animate={{ x: on ? 20 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-1 w-3.5 h-3.5 bg-white rounded-full shadow-sm" />
    </button>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Account Settings</h2>
        <p className={muted}>Manage your profile, sender IDs, notifications and security</p>
      </div>

      {/* Tab bar */}
      <div className={`flex gap-1 p-1 rounded-xl border w-fit flex-wrap ${isDarkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
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

      <AnimatePresence mode="wait">

        {/* ── PROFILE TAB ── */}
        {activeTab === 'profile' && (
          <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className={card}>
              {/* Avatar */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#10B981] flex items-center justify-center text-white text-xl font-bold shadow-lg">
                    JM
                  </div>
                  <button className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 flex items-center justify-center ${isDarkMode ? 'bg-slate-700 border-slate-900' : 'bg-white border-white'} shadow-md`}
                    onClick={() => addNotification({ type: 'info', title: 'Upload Photo', message: 'Photo upload is available in the full version.' })}>
                    <Camera className="w-3 h-3 text-[#2563EB]" />
                  </button>
                </div>
                <div>
                  <div className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{profile.name}</div>
                  <div className={muted}>{profile.email}</div>
                  <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white">Pro Account</span>
                </div>
              </div>

              {/* Form grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {([
                  { key: 'name', label: 'Full Name', icon: User, type: 'text' },
                  { key: 'email', label: 'Email Address', icon: Mail, type: 'email' },
                  { key: 'phone', label: 'Phone Number', icon: Smartphone, type: 'tel' },
                  { key: 'company', label: 'Company', icon: Globe, type: 'text' },
                  { key: 'website', label: 'Website', icon: Globe, type: 'url' },
                ] as const).map(f => (
                  <div key={f.key}>
                    <label className={labelCls}>{f.label}</label>
                    <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                      <f.icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <input
                        type={f.type}
                        value={profile[f.key]}
                        onChange={e => setProfile(p => ({ ...p, [f.key]: e.target.value }))}
                        className={`flex-1 text-sm bg-transparent outline-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                      />
                    </div>
                  </div>
                ))}

                <div>
                  <label className={labelCls}>Timezone</label>
                  <select value={profile.timezone} onChange={e => setProfile(p => ({ ...p, timezone: e.target.value }))}
                    className={inputCls}>
                    {['Africa/Kampala', 'Africa/Nairobi', 'Africa/Lagos', 'Europe/London', 'America/New_York'].map(tz => (
                      <option key={tz}>{tz}</option>
                    ))}
                  </select>
                </div>
              </div>

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={saveProfile} disabled={savingProfile}
                className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white text-sm font-bold shadow-md disabled:opacity-60">
                {savingProfile
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                  : <><Save className="w-4 h-4" /> Save Changes</>}
              </motion.button>
            </div>

            {/* Danger zone */}
            <div className={`rounded-2xl border p-5 ${isDarkMode ? 'bg-red-900/10 border-red-800/30' : 'bg-red-50 border-red-200'}`}>
              <h3 className="text-sm font-bold text-red-500 mb-3">Danger Zone</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Delete Account</p>
                  <p className={`text-[11px] mt-0.5 ${muted}`}>Permanently delete your account and all data. This cannot be undone.</p>
                </div>
                <button onClick={() => addNotification({ type: 'error', title: 'Action Required', message: 'Please contact support to delete your account.' })}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-300 text-red-500 text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-900/20 transition-all ml-4 flex-shrink-0">
                  <LogOut className="w-3.5 h-3.5" /> Delete Account
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── SENDER IDs TAB ── */}
        {activeTab === 'senderids' && (
          <motion.div key="senderids" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className={card}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Registered Sender IDs</h3>
                  <p className={`text-xs mt-0.5 ${muted}`}>Alphanumeric sender IDs must be 3–11 characters and pre-approved by telecom operators</p>
                </div>
                <button onClick={() => setShowSenderForm(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white text-xs font-bold shadow-md">
                  <Plus className="w-3.5 h-3.5" /> Register New
                </button>
              </div>

              {/* Add form */}
              <AnimatePresence>
                {showSenderForm && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mb-4">
                    <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                      <label className={labelCls}>Sender ID (3–11 characters)</label>
                      <div className="flex gap-2">
                        <input value={newSenderID} onChange={e => setNewSenderID(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11))}
                          placeholder="e.g. MYSHOP"
                          className={`flex-1 px-3 py-2.5 rounded-xl border text-sm font-mono outline-none ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-600' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'}`} />
                        <button onClick={addSenderID}
                          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white text-xs font-bold">Submit</button>
                        <button onClick={() => setShowSenderForm(false)}
                          className={`px-3 py-2.5 rounded-xl border text-xs ${isDarkMode ? 'border-slate-600 text-slate-400' : 'border-slate-200 text-slate-500'}`}><X className="w-4 h-4" /></button>
                      </div>
                      <p className={`text-[11px] mt-2 ${muted}`}>Approval typically takes 1–2 business days. You'll be notified via email once approved.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2.5">
                {senderIDs.map((s, i) => (
                  <motion.div key={s.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#10B981] flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-bold font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{s.name}</div>
                      <div className={`text-[10px] ${muted}`}>{s.type} · Added {s.added}</div>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${statusStyle[s.status]}`}>{s.status}</span>
                    {s.status === 'pending' && <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
                    <button onClick={() => deleteSenderID(s.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Info box */}
            <div className={`rounded-2xl border p-5 ${isDarkMode ? 'bg-blue-900/10 border-blue-800/30' : 'bg-blue-50 border-blue-100'}`}>
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-[#2563EB] flex-shrink-0 mt-0.5" />
                <div>
                  <p className={`text-xs font-semibold mb-1 ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>Sender ID Guidelines</p>
                  <ul className="space-y-1">
                    {[
                      'Must be 3–11 alphanumeric characters, no spaces or special characters.',
                      'Cannot resemble a phone number or generic term (e.g. "FREE", "WIN").',
                      'Must represent your registered business or brand name.',
                      'Each sender ID requires a separate approval per telecom network.',
                    ].map((t, i) => (
                      <li key={i} className={`flex items-start gap-2 text-[11px] ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                        <div className="w-1 h-1 rounded-full bg-current mt-1.5 flex-shrink-0" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── NOTIFICATIONS TAB ── */}
        {activeTab === 'notifs' && (
          <motion.div key="notifs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className={card}>
              <div className="flex items-center justify-between mb-5">
                <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Notification Preferences</h3>
                <button onClick={() => { setNotifs(NOTIF_SETTINGS.map(n => ({ ...n }))); addNotification({ type: 'info', title: 'Reset', message: 'Notification settings reset to defaults.' }); }}
                  className={`flex items-center gap-1.5 text-xs font-semibold ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}>
                  <RefreshCw className="w-3.5 h-3.5" /> Reset to defaults
                </button>
              </div>

              {/* Channel headers */}
              <div className={`grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 pb-2 text-[10px] font-bold uppercase tracking-wider ${muted}`}>
                <span>Event</span>
                <span className="w-10 text-center">Email</span>
                <span className="w-10 text-center">SMS</span>
                <span className="w-10 text-center">Push</span>
              </div>

              <div className="space-y-2">
                {notifs.map((n, i) => (
                  <motion.div key={n.key} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                    className={`grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-4 py-3.5 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <div>
                      <div className={`text-xs font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{n.label}</div>
                      <div className={`text-[11px] mt-0.5 ${muted}`}>{n.desc}</div>
                    </div>
                    {(['email', 'sms', 'push'] as const).map(ch => (
                      <div key={ch} className="w-10 flex justify-center">
                        <Toggle on={n[ch]} onToggle={() => toggleNotif(i, ch)} />
                      </div>
                    ))}
                  </motion.div>
                ))}
              </div>

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => addNotification({ type: 'success', title: '🔔 Preferences Saved', message: 'Your notification settings have been updated.' })}
                className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white text-sm font-bold shadow-md">
                <Save className="w-4 h-4" /> Save Preferences
              </motion.button>
            </div>

            {/* Contact info for notifications */}
            <div className={card}>
              <h3 className={`text-sm font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Notification Contacts</h3>
              <div className="space-y-3">
                {[
                  { icon: Mail, label: 'Email', value: 'john.mukasa@pahappa.com', verified: true },
                  { icon: Smartphone, label: 'SMS Number', value: '+256 701 234 567', verified: true },
                  { icon: Globe, label: 'Push (Web)', value: 'Chrome on Windows 11', verified: false },
                ].map(item => (
                  <div key={item.label} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <item.icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className={`text-[10px] font-semibold ${muted}`}>{item.label}</div>
                      <div className={`text-xs font-medium truncate ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{item.value}</div>
                    </div>
                    {item.verified
                      ? <span className="text-[10px] font-bold text-[#10B981] flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Verified</span>
                      : <button onClick={() => addNotification({ type: 'info', title: 'Verification Sent', message: 'Check your browser for a permission prompt.' })}
                        className="text-[10px] font-bold text-[#2563EB] hover:underline">Verify →</button>}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── SECURITY TAB ── */}
        {activeTab === 'security' && (
          <motion.div key="security" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

            {/* 2FA */}
            <div className={card}>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Two-Factor Authentication</h3>
                  <p className={`text-xs mt-0.5 ${muted}`}>Add an extra layer of security to your account</p>
                </div>
                <Toggle on={twoFA} onToggle={() => { setTwoFA(v => !v); setShowTwoFASetup(!twoFA); }} />
              </div>

              <AnimatePresence>
                {showTwoFASetup && twoFA && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-4">
                    <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'} space-y-3`}>
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-xl bg-white p-2 flex-shrink-0 border border-slate-200">
                          {/* QR code placeholder */}
                          <div className="w-full h-full grid grid-cols-4 gap-0.5">
                            {Array.from({ length: 16 }).map((_, i) => (
                              <div key={i} className={`rounded-[1px] ${Math.random() > 0.4 ? 'bg-slate-900' : 'bg-white'}`} />
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className={`text-xs font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Scan with your authenticator app</p>
                          <p className={`text-[11px] mt-1 ${muted}`}>Use Google Authenticator, Authy, or any TOTP app</p>
                          <div className={`mt-2 px-2 py-1 rounded-lg font-mono text-[11px] ${isDarkMode ? 'bg-slate-900 text-green-400' : 'bg-white border border-slate-200 text-slate-800'}`}>
                            JBSWY3DPEHPK3PXP
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <input placeholder="Enter 6-digit code to confirm"
                          className={`flex-1 px-3 py-2.5 rounded-xl border text-sm font-mono outline-none ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-600' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'}`} />
                        <button onClick={() => { setShowTwoFASetup(false); addNotification({ type: 'success', title: '🔐 2FA Enabled', message: 'Two-factor authentication is now active on your account.' }); }}
                          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white text-xs font-bold">
                          Verify & Enable
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!twoFA && (
                <div className={`mt-3 flex items-center gap-2 p-3 rounded-xl ${isDarkMode ? 'bg-amber-900/20 border border-amber-800/30' : 'bg-amber-50 border border-amber-100'}`}>
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <p className="text-[11px] text-amber-600 dark:text-amber-400">Your account is not protected by 2FA. We strongly recommend enabling it.</p>
                </div>
              )}
            </div>

            {/* Change Password */}
            <div className={card}>
              <h3 className={`text-sm font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Change Password</h3>
              <div className="space-y-3">
                {([
                  { key: 'current', label: 'Current Password', value: currentPw, setter: setCurrentPw },
                  { key: 'new', label: 'New Password', value: newPw, setter: setNewPw },
                  { key: 'confirm', label: 'Confirm New Password', value: confirmPw, setter: setConfirmPw },
                ] as const).map(f => (
                  <div key={f.key}>
                    <label className={labelCls}>{f.label}</label>
                    <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                      <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <input
                        type={showPw[f.key] ? 'text' : 'password'}
                        value={f.value}
                        onChange={e => f.setter(e.target.value)}
                        placeholder="••••••••"
                        className={`flex-1 text-sm bg-transparent outline-none ${isDarkMode ? 'text-white placeholder-slate-600' : 'text-slate-900 placeholder-slate-400'}`}
                      />
                      <button onClick={() => toggleRevealPw(f.key)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        {showPw[f.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}

                {/* Strength indicator */}
                {newPw.length > 0 && (
                  <div>
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map(s => (
                        <div key={s} className={`flex-1 h-1.5 rounded-full transition-all ${newPw.length >= s * 3
                            ? s <= 1 ? 'bg-red-400' : s <= 2 ? 'bg-amber-400' : s <= 3 ? 'bg-blue-400' : 'bg-[#10B981]'
                            : isDarkMode ? 'bg-slate-700' : 'bg-slate-200'
                          }`} />
                      ))}
                    </div>
                    <p className={`text-[10px] ${muted}`}>
                      {newPw.length < 4 ? 'Weak' : newPw.length < 7 ? 'Fair' : newPw.length < 10 ? 'Good' : 'Strong'} password
                    </p>
                  </div>
                )}

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={savePassword}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white text-sm font-bold shadow-md">
                  <Key className="w-4 h-4" /> Update Password
                </motion.button>
              </div>
            </div>

            {/* Active Sessions */}
            <div className={card}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Active Sessions</h3>
                <button onClick={() => addNotification({ type: 'warning', title: '🔒 Sessions Terminated', message: 'All other sessions have been logged out.' })}
                  className="text-xs font-semibold text-red-500 hover:underline">Revoke All Others</button>
              </div>
              <div className="space-y-2.5">
                {sessions.map((s, i) => (
                  <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${s.current ? 'bg-gradient-to-br from-[#2563EB] to-[#10B981]' : isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                      <Shield className={`w-4 h-4 ${s.current ? 'text-white' : isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{s.device}</div>
                      <div className={`text-[10px] ${muted}`}>{s.location} · {s.time}</div>
                    </div>
                    {s.current
                      ? <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-green-100 text-green-700">Current</span>
                      : <button onClick={() => addNotification({ type: 'warning', title: 'Session Revoked', message: `${s.device} has been logged out.` })}
                        className="text-[10px] font-semibold text-red-400 hover:underline">Revoke</button>}
                  </div>
                ))}
              </div>
            </div>

            {/* Login History */}
            <div className={card}>
              <h3 className={`text-sm font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Recent Login Activity</h3>
              <div className="space-y-2">
                {[
                  { event: 'Successful login', device: 'Chrome · Windows 11', location: 'Kampala, UG', time: 'Today, 08:14 AM', ok: true },
                  { event: 'Successful login', device: 'Mobile · Android 14', location: 'Kampala, UG', time: 'Yesterday, 09:30 PM', ok: true },
                  { event: 'Failed login attempt', device: 'Unknown Browser', location: 'Lagos, NG', time: 'Oct 27, 11:02 PM', ok: false },
                  { event: 'Password changed', device: 'Chrome · Windows 11', location: 'Kampala, UG', time: 'Oct 20, 3:45 PM', ok: true },
                ].map((ev, i) => (
                  <div key={i} className={`flex items-center gap-3 py-2.5 border-b last:border-0 ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${ev.ok ? 'bg-[#10B981]' : 'bg-red-400'}`} />
                    <div className="flex-1 min-w-0">
                      <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{ev.event}</span>
                      <span className={`text-[10px] ml-1.5 ${muted}`}>{ev.device}</span>
                    </div>
                    <span className={`text-[10px] ${muted} flex-shrink-0`}>{ev.location}</span>
                    <span className={`text-[10px] ${muted} flex-shrink-0`}>{ev.time}</span>
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
