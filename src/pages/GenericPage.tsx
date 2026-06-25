import { motion } from 'framer-motion';
import { Construction, ArrowRight } from 'lucide-react';
import { useDashboardStore, ActivePage } from '../store/dashboardStore';

const pageInfo: Record<string, { title: string; desc: string; features: string[] }> = {
  reports: {
    title: 'Advanced Reports',
    desc: 'Download and schedule detailed delivery reports, campaign summaries, and cost analyses.',
    features: ['PDF & CSV Export', 'Scheduled Email Reports', 'Custom Date Ranges', 'Network Breakdown Reports'],
  },
  api: {
    title: 'API Integration',
    desc: 'Integrate EgoSMS into your applications with our powerful REST API.',
    features: ['REST API v2.0', 'Webhook Support', 'SDK Libraries (PHP, Python, Node.js)', 'Full Documentation at developers.pahappa.com'],
  },
  billing: {
    title: 'Billing & Credits',
    desc: 'Manage your SMS credits, view transaction history, and top up your account.',
    features: ['Mobile Money Top-up', 'Credit Card Payments', 'Auto-recharge Rules', 'Invoice Download'],
  },
  settings: {
    title: 'Account Settings',
    desc: 'Configure your profile, sender IDs, API keys, and notification preferences.',
    features: ['Profile Management', 'Sender ID Registration', 'API Key Management', 'Two-Factor Authentication'],
  },
};

export default function GenericPage({ page }: { page: ActivePage }) {
  const { isDarkMode, setActivePage } = useDashboardStore();
  const info = pageInfo[page] || { title: 'Page', desc: 'Coming soon.', features: [] };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`max-w-lg w-full rounded-2xl border p-8 text-center ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200'} shadow-lg`}
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#10B981] flex items-center justify-center mx-auto mb-5 shadow-xl shadow-blue-500/25">
          <Construction className="w-8 h-8 text-white" />
        </div>
        <h2 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{info.title}</h2>
        <p className={`text-sm mb-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{info.desc}</p>

        <div className="space-y-2 mb-6">
          {info.features.map((f, i) => (
            <motion.div
              key={f}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-left ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-[#2563EB] to-[#10B981]" />
              <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{f}</span>
            </motion.div>
          ))}
        </div>

        <button
          onClick={() => setActivePage('dashboard')}
          className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white text-sm font-semibold"
        >
          Back to Dashboard
          <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
}
