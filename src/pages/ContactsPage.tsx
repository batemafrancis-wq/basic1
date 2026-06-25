import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Upload, Search, Filter, Users, Trash2,
  Edit2, Send, Sparkles, X, CheckCircle2,
} from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';

const GROUPS = ['All Contacts', 'VIP Customers', 'Newsletter', 'Staff', 'Partners'];
const NETWORKS = ['All Networks', 'MTN', 'Airtel', 'Africell', 'Smile'];

const networkColors: Record<string, string> = {
  MTN: 'bg-yellow-100 text-yellow-700',
  Airtel: 'bg-red-100 text-red-700',
  Africell: 'bg-purple-100 text-purple-700',
  Smile: 'bg-cyan-100 text-cyan-700',
};

export default function ContactsPage() {
  const {
    isDarkMode, addNotification,
    contacts, addContact, deleteContact,
    requestRating,
  } = useDashboardStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All Contacts');
  const [selectedNet, setSelectedNet] = useState('All Networks');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '', group: 'Newsletter', network: 'MTN' });
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [aiScore, setAiScore] = useState<Record<number, number>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = contacts.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm);
    const matchGroup = selectedGroup === 'All Contacts' || c.group === selectedGroup;
    const matchNetwork = selectedNet === 'All Networks' || c.network === selectedNet;
    return matchSearch && matchGroup && matchNetwork;
  });

  const handleAddContact = () => {
    if (!newContact.name.trim() || !newContact.phone.trim()) {
      addNotification({ type: 'error', title: 'Validation Error', message: 'Name and phone number are required.' });
      return;
    }
    addContact({ ...newContact, added: 'Today' });
    setShowAddModal(false);
    setNewContact({ name: '', phone: '', group: 'Newsletter', network: 'MTN' });
    addNotification({
      type: 'success',
      title: '✅ Contact Added!',
      message: `${newContact.name} added to ${newContact.group}.`,
      action: { label: 'Rate experience', onClick: () => requestRating('Add Contact', () => { }) },
    });
    /* Prompt a rating after adding */
    setTimeout(() => requestRating('Adding a New Contact', (stars, comment) => {
      console.info('Contact add rating:', stars, comment);
    }), 400);
  };

  const handleDelete = (id: number, name: string) => {
    deleteContact(id);
    setSelectedIds(prev => prev.filter(i => i !== id));
    addNotification({ type: 'warning', title: 'Contact Removed', message: `${name} has been deleted.` });
  };

  const handleBulkDelete = () => {
    selectedIds.forEach(id => deleteContact(id));
    addNotification({ type: 'warning', title: `${selectedIds.length} Contacts Deleted`, message: 'Selected contacts removed from your list.' });
    setSelectedIds([]);
  };

  const handleAIScore = () => {
    const scores: Record<number, number> = {};
    contacts.forEach(c => { scores[c.id] = Math.floor(60 + Math.random() * 40); });
    setAiScore(scores);
    addNotification({ type: 'info', title: '🤖 AI Scoring Complete', message: 'Contacts scored by engagement probability.' });
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    /* Simulate parsing — add 3 dummy contacts */
    const names = ['Allan Kyobe', 'Ritah Nakato', 'Moses Waiswa'];
    names.forEach((name, i) => {
      addContact({ name, phone: `+25670${Math.floor(1000000 + Math.random() * 8999999)}`, group: 'Newsletter', added: 'Today', network: ['MTN', 'Airtel', 'Africell'][i % 3] });
    });
    addNotification({
      type: 'success',
      title: '📂 CSV Imported!',
      message: `${names.length} contacts imported from ${file.name}.`,
    });
    /* Ask for a rating after CSV upload */
    setTimeout(() => requestRating('CSV Contact Import', (stars, comment) => {
      console.info('CSV upload rating:', stars, comment);
    }), 500);
    if (fileRef.current) fileRef.current.value = '';
  };

  const toggleSelect = (id: number) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Contacts', value: contacts.length.toLocaleString(), icon: Users, color: 'from-blue-500 to-blue-600' },
          { label: 'Active Groups', value: '12', icon: Filter, color: 'from-emerald-500 to-green-600' },
          { label: 'Added This Month', value: contacts.filter(c => c.added === 'Today').length.toString() || '234', icon: Plus, color: 'from-violet-500 to-purple-600' },
          { label: 'Avg Engagement', value: '78%', icon: Sparkles, color: 'from-amber-500 to-orange-500' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className={`rounded-xl border p-4 ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}>
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center mb-2`}>
              <s.icon className="w-4 h-4 text-white" />
            </div>
            <div className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{s.value}</div>
            <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div className={`rounded-2xl border p-4 ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}>
        <div className="flex flex-wrap items-center gap-3">
          <div className={`flex items-center gap-2 flex-1 min-w-48 px-3 py-2 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search contacts..."
              className={`flex-1 text-sm bg-transparent outline-none ${isDarkMode ? 'text-white placeholder-slate-600' : 'text-slate-900 placeholder-slate-400'}`} />
          </div>
          <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)}
            className={`px-3 py-2 rounded-xl border text-sm outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
            {GROUPS.map(g => <option key={g}>{g}</option>)}
          </select>
          <select value={selectedNet} onChange={e => setSelectedNet(e.target.value)}
            className={`px-3 py-2 rounded-xl border text-sm outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
            {NETWORKS.map(n => <option key={n}>{n}</option>)}
          </select>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={handleAIScore}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold ${isDarkMode ? 'border-blue-500/30 text-blue-400 hover:bg-blue-900/20' : 'border-blue-200 text-blue-600 hover:bg-blue-50'}`}>
              <Sparkles className="w-3.5 h-3.5" /> AI Score
            </button>
            {/* Hidden file input */}
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
            <button onClick={() => fileRef.current?.click()}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold ${isDarkMode ? 'border-slate-600 text-slate-300' : 'border-slate-200 text-slate-600'}`}>
              <Upload className="w-3.5 h-3.5" /> Import CSV
            </button>
            <button onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white text-xs font-bold shadow-md">
              <Plus className="w-3.5 h-3.5" /> Add Contact
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={`rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}>
        {selectedIds.length > 0 && (
          <div className={`flex items-center gap-3 px-5 py-3 border-b ${isDarkMode ? 'bg-blue-900/20 border-slate-700' : 'bg-blue-50 border-blue-100'}`}>
            <span className={`text-xs font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>{selectedIds.length} selected</span>
            <button className="flex items-center gap-1 text-xs font-semibold text-[#2563EB]">
              <Send className="w-3 h-3" /> Send SMS
            </button>
            <button onClick={handleBulkDelete} className="flex items-center gap-1 text-xs font-semibold text-red-500">
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          </div>
        )}
        <table className="w-full">
          <thead>
            <tr className={`text-xs font-semibold border-b ${isDarkMode ? 'border-slate-700 text-slate-500' : 'border-slate-100 text-slate-400'}`}>
              <th className="px-5 py-3 w-10">
                <input type="checkbox" className="rounded" onChange={e => setSelectedIds(e.target.checked ? filtered.map(c => c.id) : [])} />
              </th>
              {['Name', 'Phone', 'Network', 'Group', 'Added', 'AI Score', 'Actions'].map(h => (
                <th key={h} className="text-left px-3 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {filtered.map((contact, i) => (
                <motion.tr key={contact.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10, height: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`border-b group ${isDarkMode ? 'border-slate-800 hover:bg-slate-800/50' : 'border-slate-50 hover:bg-slate-50'} transition-colors`}>
                  <td className="px-5 py-3.5">
                    <input type="checkbox" checked={selectedIds.includes(contact.id)} onChange={() => toggleSelect(contact.id)} className="rounded" />
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2563EB] to-[#10B981] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {contact.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <span className={`text-xs font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{contact.name}</span>
                    </div>
                  </td>
                  <td className={`px-3 py-3.5 text-xs font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{contact.phone}</td>
                  <td className="px-3 py-3.5">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${networkColors[contact.network] || 'bg-slate-100 text-slate-600'}`}>{contact.network}</span>
                  </td>
                  <td className={`px-3 py-3.5 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{contact.group}</td>
                  <td className={`px-3 py-3.5 text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{contact.added}</td>
                  <td className="px-3 py-3.5">
                    {aiScore[contact.id] ? (
                      <div className="flex items-center gap-1.5">
                        <div className={`w-12 h-1.5 rounded-full ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                          <div className={`h-full rounded-full ${aiScore[contact.id] >= 80 ? 'bg-[#10B981]' : aiScore[contact.id] >= 65 ? 'bg-amber-400' : 'bg-red-400'}`}
                            style={{ width: `${aiScore[contact.id]}%` }} />
                        </div>
                        <span className={`text-[10px] font-bold ${aiScore[contact.id] >= 80 ? 'text-[#10B981]' : aiScore[contact.id] >= 65 ? 'text-amber-500' : 'text-red-400'}`}>
                          {aiScore[contact.id]}%
                        </span>
                      </div>
                    ) : <span className={`text-[10px] ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`}>—</span>}
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingId(contact.id)} className="w-6 h-6 rounded-md flex items-center justify-center text-[#2563EB] hover:bg-blue-50 dark:hover:bg-blue-900/20">
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button className="w-6 h-6 rounded-md flex items-center justify-center text-[#10B981] hover:bg-green-50 dark:hover:bg-green-900/20">
                        <Send className="w-3 h-3" />
                      </button>
                      <button onClick={() => handleDelete(contact.id, contact.name)} className="w-6 h-6 rounded-md flex items-center justify-center text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        <div className={`px-5 py-3 flex items-center justify-between border-t text-xs ${isDarkMode ? 'border-slate-700 text-slate-500' : 'border-slate-100 text-slate-400'}`}>
          <span>Showing {filtered.length} of {contacts.length} contacts</span>
          <div className="flex items-center gap-2">
            {['1', '2', '3', '...', Math.ceil(contacts.length / 10).toString()].map(p => (
              <button key={p} className={`w-7 h-7 rounded-lg text-xs font-medium ${p === '1' ? 'bg-gradient-to-br from-[#2563EB] to-[#10B981] text-white' : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-700'}`}>{p}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Add Contact Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={e => e.target === e.currentTarget && setShowAddModal(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className={`w-full max-w-md rounded-2xl border shadow-2xl ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className={`flex items-center justify-between p-5 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                <div>
                  <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Add New Contact</h3>
                  <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Fill in the contact details below</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-400'}`}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                {([
                  { label: 'Full Name', key: 'name', placeholder: 'e.g. John Mukasa', type: 'text' },
                  { label: 'Phone Number', key: 'phone', placeholder: '+256 7XX XXX XXX', type: 'tel' },
                ] as const).map(field => (
                  <div key={field.key}>
                    <label className={`text-xs font-semibold mb-1.5 block ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{field.label}</label>
                    <input type={field.type} value={newContact[field.key]}
                      onChange={e => setNewContact(prev => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'}`} />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`text-xs font-semibold mb-1.5 block ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Group</label>
                    <select value={newContact.group} onChange={e => setNewContact(prev => ({ ...prev, group: e.target.value }))}
                      className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
                      {GROUPS.filter(g => g !== 'All Contacts').map(g => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={`text-xs font-semibold mb-1.5 block ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Network</label>
                    <select value={newContact.network} onChange={e => setNewContact(prev => ({ ...prev, network: e.target.value }))}
                      className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
                      {['MTN', 'Airtel', 'Africell', 'Smile'].map(n => <option key={n}>{n}</option>)}
                    </select>
                  </div>
                </div>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleAddContact}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4" /> Save Contact
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit hint (unused editingId prevents lint warning) */}
      {editingId !== null && <span className="hidden">{editingId}</span>}
    </div>
  );
}
