import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, Smartphone, Building2, Download, Plus, CheckCircle2,
  TrendingUp, Zap, AlertTriangle, X, Shield, ArrowUpRight,
  ArrowDownLeft, Receipt,
} from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';
import CountUp from 'react-countup';

const TOPUP_AMOUNTS = [
  { ugx: 10000, credits: 200, label: 'Starter' },
  { ugx: 50000, credits: 1000, label: 'Basic' },
  { ugx: 100000, credits: 2000, label: 'Pro', popular: true },
  { ugx: 250000, credits: 5000, label: 'Growth' },
  { ugx: 500000, credits: 10000, label: 'Scale' },
  { ugx: 1000000, credits: 22000, label: 'Enterprise', bonus: '+2000 bonus' },
] as const;

const PAYMENT_METHODS = [
  { key: 'mtn', label: 'MTN Mobile Money', icon: Smartphone, color: 'from-yellow-400 to-yellow-500', placeholder: '0701 234 567' },
  { key: 'airtel', label: 'Airtel Money', icon: Smartphone, color: 'from-red-400 to-red-500', placeholder: '0701 234 567' },
  { key: 'card', label: 'Credit / Debit Card', icon: CreditCard, color: 'from-blue-500 to-blue-600', placeholder: '4242 4242 4242 4242' },
  { key: 'bank', label: 'Bank Transfer', icon: Building2, color: 'from-slate-500 to-slate-600', placeholder: '' },
] as const;

export default function BillingPage() {
  const {
    isDarkMode, addNotification,
    balanceUGX, smsCredits, addCredits, addTransaction, transactions,
  } = useDashboardStore();

  const [showTopup, setShowTopup] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(TOPUP_AMOUNTS[2]);
  const [selectedMethod, setSelectedMethod] = useState(PAYMENT_METHODS[0]);
  const [phoneInput, setPhoneInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [autoRecharge, setAutoRecharge] = useState(true);
  const [autoThreshold, setAutoThreshold] = useState('500');
  const [autoAmount, setAutoAmount] = useState('100000');
  const [filterType, setFilterType] = useState<'all' | 'topup' | 'usage'>('all');

  const card = `rounded-2xl border p-5 ${isDarkMode ? 'bg-[#1E293B] border-slate-700/60' : 'bg-white border-slate-200/60'} shadow-sm`;
  const muted = `text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`;

  const filtered = transactions.filter(t =>
    filterType === 'all' ? true : filterType === 'topup' ? t.type === 'topup' : t.type === 'usage'
  );

  /* Derived spend stats from live transactions */
  const monthSpend = transactions.filter(t => t.type === 'usage').reduce((s, t) => s + Math.abs(t.amount), 0);
  const ytdTopups = transactions.filter(t => t.type === 'topup' && t.status === 'success').reduce((s, t) => s + t.amount, 0);
  const monthSms = transactions.filter(t => t.type === 'usage').reduce((s, t) => s + Math.abs(t.credits), 0);
  const topupCount = transactions.filter(t => t.type === 'topup' && t.status === 'success').length;

  const handleTopup = () => {
    if (!phoneInput && selectedMethod.key !== 'bank') {
      addNotification({ type: 'error', title: 'Required', message: 'Please enter your payment details.' });
      return;
    }
    setProcessing(true);
    setTimeout(() => {
      const amt = selectedAmount.ugx;
      const credits = selectedAmount.credits + (selectedAmount.bonus ? 2000 : 0);
      /* Update live balance */
      addCredits(amt, credits);
      /* Append to transaction history */
      addTransaction({
        type: 'topup',
        method: selectedMethod.key === 'mtn' ? 'MTN Mobile Money' :
          selectedMethod.key === 'airtel' ? 'Airtel Money' :
            selectedMethod.key === 'card' ? `Visa Card ····${phoneInput.slice(-4) || '0000'}` :
              'Bank Transfer',
        amount: amt,
        credits,
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        status: 'success',
      });
      setProcessing(false);
      setShowTopup(false);
      setPhoneInput('');
      addNotification({
        type: 'success',
        title: '💳 Top-Up Successful!',
        message: `UGX ${amt.toLocaleString()} · ${credits.toLocaleString()} credits added to your account.`,
        action: { label: 'View Balance', onClick: () => { } },
      });
    }, 2000);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Billing & Credits</h2>
          <p className={muted}>Manage your SMS credits, top-ups and invoices</p>
        </div>
        <button onClick={() => setShowTopup(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white text-xs font-bold shadow-md hover:opacity-90 transition-all">
          <Plus className="w-3.5 h-3.5" /> Top Up Credits
        </button>
      </div>

      {/* Balance + Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Live balance card */}
        <motion.div key={balanceUGX} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className={`md:col-span-2 rounded-2xl border p-6 relative overflow-hidden ${isDarkMode ? 'bg-gradient-to-br from-[#1e3a5f] to-[#0f2d1a] border-blue-500/20' : 'bg-gradient-to-br from-blue-600 to-emerald-500 border-transparent'}`}>
          <div className="absolute right-4 top-4 w-28 h-28 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-white/70" />
              <span className="text-xs font-bold text-white/70 uppercase tracking-wider">Current Balance</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/20 text-white">LIVE</span>
            </div>
            <div className="text-4xl font-bold text-white mt-2">
              UGX <CountUp key={balanceUGX} end={balanceUGX} separator="," duration={0.8} />
            </div>
            <div className="text-white/70 text-sm mt-1">
              ≈ <CountUp key={smsCredits} end={smsCredits} separator="," duration={0.8} /> SMS credits remaining
            </div>
            <button onClick={() => setShowTopup(true)}
              className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all backdrop-blur-sm border border-white/20">
              <Plus className="w-3.5 h-3.5" /> Add Credits
            </button>
          </div>
        </motion.div>

        {[
          { label: 'This Month Spend', value: `UGX ${monthSpend.toLocaleString()}`, sub: `${monthSms.toLocaleString()} SMS sent`, icon: ArrowUpRight, color: 'from-pink-500 to-rose-600' },
          { label: 'Total Top-Ups (YTD)', value: `UGX ${ytdTopups.toLocaleString()}`, sub: `${topupCount} transactions`, icon: ArrowDownLeft, color: 'from-emerald-500 to-green-600' },
          { label: 'Cost Per SMS', value: 'UGX 20', sub: 'Standard rate', icon: Receipt, color: 'from-violet-500 to-purple-600' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (i + 1) * 0.08 }}
            className={`rounded-xl border p-4 ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}>
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
              <s.icon className="w-4 h-4 text-white" />
            </div>
            <div className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{s.value}</div>
            <div className={muted}>{s.label}</div>
            <div className="text-[10px] text-[#10B981] font-medium mt-0.5">{s.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Auto-recharge + Credit usage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={card}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Auto-Recharge</h3>
              <p className={`text-xs mt-0.5 ${muted}`}>Auto top-up when balance falls low</p>
            </div>
            <button onClick={() => setAutoRecharge(v => !v)} style={{ width: 40, height: 22 }}
              className={`rounded-full relative transition-all duration-300 flex-shrink-0 ${autoRecharge ? 'bg-gradient-to-r from-[#2563EB] to-[#10B981]' : isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
              <motion.div animate={{ x: autoRecharge ? 20 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-1 w-3.5 h-3.5 bg-white rounded-full shadow-sm" />
            </button>
          </div>
          <AnimatePresence>
            {autoRecharge && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-3 overflow-hidden">
                {[
                  { label: 'Trigger below (UGX)', val: autoThreshold, set: setAutoThreshold, hint: `~${Math.floor(+autoThreshold / 20)} credits` },
                  { label: 'Recharge amount (UGX)', val: autoAmount, set: setAutoAmount, hint: `~${Math.floor(+autoAmount / 20)} credits` },
                ].map(f => (
                  <div key={f.label}>
                    <label className={`text-xs font-semibold block mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{f.label}</label>
                    <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                      <span className={`text-xs ${muted}`}>UGX</span>
                      <input value={f.val} onChange={e => f.set(e.target.value)}
                        className={`flex-1 text-sm font-mono bg-transparent outline-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`} />
                      <span className={`text-[10px] ${muted}`}>{f.hint}</span>
                    </div>
                  </div>
                ))}
                <button onClick={() => addNotification({ type: 'success', title: '✅ Auto-Recharge Saved', message: `Top-up UGX ${(+autoAmount).toLocaleString()} when balance < UGX ${(+autoThreshold).toLocaleString()}.` })}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white text-xs font-bold">Save Rules</button>
                <div className={`flex items-center gap-2 p-2.5 rounded-xl ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <Shield className="w-3.5 h-3.5 text-[#10B981] flex-shrink-0" />
                  <span className="text-[11px] text-[#10B981] font-medium">Payment: MTN Mobile Money ····567</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {!autoRecharge && (
            <div className={`flex items-center gap-2 p-3 rounded-xl ${isDarkMode ? 'bg-amber-900/20 border border-amber-800/30' : 'bg-amber-50 border border-amber-100'}`}>
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <p className="text-[11px] text-amber-600 dark:text-amber-400">Auto-recharge is off — campaigns may stop mid-send if credits run out.</p>
            </div>
          )}
        </div>

        <div className={card}>
          <h3 className={`text-sm font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Credit Usage — Live</h3>
          <div className="space-y-3.5">
            {[
              { label: 'Bulk Campaigns', credits: Math.round(monthSms * 0.71), color: '#2563EB' },
              { label: 'Scheduled SMS', credits: Math.round(monthSms * 0.21), color: '#10B981' },
              { label: 'API Calls', credits: Math.round(monthSms * 0.07), color: '#8B5CF6' },
              { label: 'Single SMS', credits: Math.round(monthSms * 0.01), color: '#F59E0B' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between mb-1">
                  <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{item.label}</span>
                  <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{item.credits.toLocaleString()} credits</span>
                </div>
                <div className={`h-2 rounded-full ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${monthSms > 0 ? (item.credits / monthSms) * 100 : 0}%` }}
                    transition={{ duration: 0.8 }} className="h-full rounded-full" style={{ background: item.color }} />
                </div>
              </div>
            ))}
          </div>
          <div className={`mt-4 pt-3 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Total Used</span>
              <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{monthSms.toLocaleString()} credits</span>
            </div>
            <div className={`h-2 rounded-full mt-2 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((monthSms / (monthSms + smsCredits)) * 100, 100)}%` }} transition={{ duration: 1 }}
                className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#10B981]" />
            </div>
            <p className={`text-[10px] mt-1.5 ${muted}`}>{monthSms + smsCredits > 0 ? ((monthSms / (monthSms + smsCredits)) * 100).toFixed(1) : 0}% of total credits used</p>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className={`rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-[#1E293B] border-slate-700/60' : 'bg-white border-slate-200/60'} shadow-sm`}>
        <div className={`flex items-center justify-between px-5 py-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
          <div className="flex items-center gap-2">
            <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Transaction History</h3>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white">LIVE</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex gap-1 p-1 rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
              {(['all', 'topup', 'usage'] as const).map(f => (
                <button key={f} onClick={() => setFilterType(f)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold capitalize transition-all ${filterType === f ? 'bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white' : isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {f}
                </button>
              ))}
            </div>
            <button onClick={() => addNotification({ type: 'info', title: '📄 Export Started', message: 'Your transaction CSV is being prepared.' })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${isDarkMode ? 'border-slate-600 text-slate-300' : 'border-slate-200 text-slate-600'}`}>
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`text-xs font-semibold border-b ${isDarkMode ? 'border-slate-700 text-slate-500' : 'border-slate-100 text-slate-400'}`}>
                {['Transaction ID', 'Description', 'Credits', 'Amount (UGX)', 'Date', 'Status', 'Invoice'].map(h => (
                  <th key={h} className="text-left px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {filtered.map((tx, i) => (
                  <motion.tr key={tx.id}
                    initial={{ opacity: 0, backgroundColor: 'rgba(37,99,235,0.15)' }}
                    animate={{ opacity: 1, backgroundColor: 'rgba(0,0,0,0)' }}
                    transition={{ delay: i * 0.03, backgroundColor: { duration: 1.2 } }}
                    className={`border-b group ${isDarkMode ? 'border-slate-800 hover:bg-slate-800/50' : 'border-slate-50 hover:bg-slate-50'} transition-colors`}>
                    <td className={`px-5 py-3.5 text-xs font-mono font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{tx.id}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${tx.type === 'topup' ? 'bg-emerald-100' : 'bg-blue-100'}`}>
                          {tx.type === 'topup' ? <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" /> : <ArrowUpRight className="w-3.5 h-3.5 text-blue-600" />}
                        </div>
                        <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{tx.method}</span>
                      </div>
                    </td>
                    <td className={`px-5 py-3.5 text-xs font-bold font-mono ${tx.credits > 0 ? 'text-[#10B981]' : isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      {tx.credits > 0 ? `+${tx.credits.toLocaleString()}` : tx.credits !== 0 ? tx.credits.toLocaleString() : '—'}
                    </td>
                    <td className={`px-5 py-3.5 text-xs font-bold ${tx.amount > 0 ? 'text-[#10B981]' : isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      {tx.amount > 0 ? `+${tx.amount.toLocaleString()}` : tx.amount.toLocaleString()}
                    </td>
                    <td className={`px-5 py-3.5 text-xs ${muted}`}>{tx.date}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${tx.status === 'success' ? isDarkMode ? 'bg-green-900/40 text-green-400' : 'bg-green-100 text-green-700'
                        : tx.status === 'failed' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'
                        }`}>{tx.status}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      {tx.status === 'success' && tx.type === 'topup' ? (
                        <button onClick={() => addNotification({ type: 'info', title: '📄 Invoice', message: `Invoice for ${tx.id} downloading.` })}
                          className="flex items-center gap-1 text-[11px] font-semibold text-[#2563EB] hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
                          <Download className="w-3 h-3" /> PDF
                        </button>
                      ) : <span className={`text-[10px] ${muted}`}>—</span>}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        <div className={`px-5 py-3 border-t text-xs flex items-center justify-between ${isDarkMode ? 'border-slate-700 text-slate-500' : 'border-slate-100 text-slate-400'}`}>
          <span>Showing {filtered.length} of {transactions.length} transactions</span>
          <div className="flex items-center gap-1.5 text-[#10B981] font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Balance: UGX {balanceUGX.toLocaleString()} · {smsCredits.toLocaleString()} credits</span>
          </div>
        </div>
      </div>

      {/* Top-Up Modal */}
      <AnimatePresence>
        {showTopup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={e => e.target === e.currentTarget && setShowTopup(false)}>
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
              className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className={`flex items-center justify-between px-5 py-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                <div>
                  <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Top Up Credits</h3>
                  <p className={`text-xs mt-0.5 ${muted}`}>Select amount and payment method</p>
                </div>
                <button onClick={() => setShowTopup(false)} className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-400'}`}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-5">
                {/* Amounts */}
                <div>
                  <label className={`text-xs font-semibold block mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Select Amount</label>
                  <div className="grid grid-cols-3 gap-2">
                    {TOPUP_AMOUNTS.map(a => (
                      <button key={a.ugx} onClick={() => setSelectedAmount(a)}
                        className={`relative p-3 rounded-xl border text-left transition-all ${selectedAmount.ugx === a.ugx ? 'bg-gradient-to-br from-[#2563EB]/10 to-[#10B981]/10 border-[#2563EB]/50 shadow-md' : isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                        {a.popular && <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white whitespace-nowrap">POPULAR</span>}
                        <div className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{a.label}</div>
                        <div className={`text-[11px] font-bold mt-0.5 ${selectedAmount.ugx === a.ugx ? 'text-[#2563EB]' : muted}`}>UGX {a.ugx.toLocaleString()}</div>
                        <div className="text-[10px] text-[#10B981] font-medium">{a.credits.toLocaleString()} SMS</div>
                        {a.bonus && <div className="text-[9px] font-bold text-amber-500 mt-0.5">{a.bonus}</div>}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Methods */}
                <div>
                  <label className={`text-xs font-semibold block mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Payment Method</label>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {PAYMENT_METHODS.map(pm => (
                      <button key={pm.key} onClick={() => setSelectedMethod(pm)}
                        className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${selectedMethod.key === pm.key ? 'border-[#2563EB]/50 bg-gradient-to-br from-[#2563EB]/10 to-[#10B981]/10' : isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${pm.color} flex items-center justify-center flex-shrink-0`}>
                          <pm.icon className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className={`text-[11px] font-semibold leading-tight ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{pm.label}</span>
                      </button>
                    ))}
                  </div>
                  {selectedMethod.key !== 'bank' && (
                    <input value={phoneInput} onChange={e => setPhoneInput(e.target.value)}
                      placeholder={selectedMethod.placeholder}
                      className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'}`} />
                  )}
                  {selectedMethod.key === 'bank' && (
                    <div className={`p-3 rounded-xl text-[11px] leading-relaxed ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
                      Transfer to: <strong>Pahappa Limited</strong><br />
                      Bank: Stanbic Bank Uganda · A/C: 9030005678901<br />
                      Reference: <strong>EGO-{Math.random().toString(36).slice(2, 8).toUpperCase()}</strong>
                    </div>
                  )}
                </div>
                {/* Summary */}
                <div className={`p-3 rounded-xl space-y-1.5 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  {[['Amount', `UGX ${selectedAmount.ugx.toLocaleString()}`], ['Credits', `${selectedAmount.credits.toLocaleString()} SMS`], ['Method', selectedMethod.label]].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className={`text-xs ${muted}`}>{k}</span>
                      <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{v}</span>
                    </div>
                  ))}
                  <div className={`pt-1.5 mt-1.5 border-t flex justify-between ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                    <span className={`text-xs font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>New Balance After</span>
                    <span className="text-xs font-bold text-[#10B981]">UGX {(balanceUGX + selectedAmount.ugx).toLocaleString()}</span>
                  </div>
                </div>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleTopup} disabled={processing}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white font-bold text-sm shadow-lg disabled:opacity-60">
                  {processing ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</>
                    : <><CheckCircle2 className="w-4 h-4" /> Confirm — UGX {selectedAmount.ugx.toLocaleString()}</>}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
