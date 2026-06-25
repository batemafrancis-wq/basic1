import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, X, Send, Sparkles, Bot, User,
  Zap, RefreshCw, Minimize2, ChevronDown
} from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';
import { chatFAQs } from '../data/mockData';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

const QUICK_ACTIONS = [
  '💳 Check Balance',
  '📊 Delivery Rate',
  '📤 How to Send',
  '👥 Add Contacts',
  '⏰ Schedule SMS',
  '💰 Top Up',
];

function formatMessage(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br />');
}

export default function AIChatbot() {
  const { isChatOpen, setChatOpen, isDarkMode, activePage } = useDashboardStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `👋 Hi there! I'm **EgoBot**, your AI co-pilot for the EgoSMS platform.\n\nI can help you:\n- 💳 Check your SMS balance\n- 📤 Send or schedule messages\n- 📊 Analyze your delivery rates\n- 👥 Manage contacts & campaigns\n- 🔧 Troubleshoot any issues\n\nWhat can I help you with today?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isChatOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isChatOpen, isMinimized]);

  // Context-aware proactive message
  useEffect(() => {
    if (isChatOpen && activePage === 'analytics') {
      setTimeout(() => {
        addAssistantMessage(
          `📈 I notice you're on the Analytics page. Here's a quick insight:\n\n**Delivery rate is at 95.05%** — up from last month. Your best-performing network is **MTN Uganda** (45% of traffic).\n\nShould I run a deeper analysis or compare with last quarter?`
        );
      }, 2000);
    }
  }, [activePage]);

  const addAssistantMessage = (content: string) => {
    const id = Math.random().toString(36).slice(2);
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id,
        role: 'assistant',
        content,
        timestamp: new Date(),
      }]);
    }, 1000 + Math.random() * 800);
  };

  const getAIResponse = (userMsg: string): string => {
    const lower = userMsg.toLowerCase();

    // Check FAQ matches
    for (const faq of chatFAQs) {
      if (lower.includes(faq.q) || faq.q.split(' ').some(word => lower.includes(word))) {
        return faq.a;
      }
    }

    // Context-specific responses
    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
      return `Hello! 👋 Great to see you! I'm here to help you get the most out of EgoSMS. What would you like to do today?`;
    }
    if (lower.includes('human') || lower.includes('agent') || lower.includes('support')) {
      return `🎧 I'll connect you with our support team right away!\n\nI've prepared a **support ticket** with:\n- Your last 5 messages\n- Current dashboard state\n- Account details\n\nExpected response time: **< 2 hours** (Mon–Fri, 8AM–6PM EAT)\n\n[📧 Open Support Ticket →] or call **+256 XXX XXX XXX**`;
    }
    if (lower.includes('campaign') || lower.includes('bulk')) {
      return `📢 **Campaign Management Tips:**\n\n1. **Segment your contacts** by network for better delivery\n2. **Best send times**: 10AM–12PM & 5PM–7PM EAT\n3. **Message length**: Keep under 160 chars for 1 credit\n4. **Sender ID**: Use a recognizable name (max 11 chars)\n\nWant me to help you set up a campaign now?`;
    }
    if (lower.includes('api') || lower.includes('integrate')) {
      return `🔗 **EgoSMS API Integration:**\n\nBase URL: \`https://comms.egosms.co/api/\`\n\nKey endpoints:\n- **POST /send** — Send single/bulk SMS\n- **GET /balance** — Check credits\n- **GET /reports** — Delivery reports\n\nFull docs: **developers.pahappa.com**\n\nShall I generate a sample API request for you?`;
    }
    if (lower.includes('price') || lower.includes('cost') || lower.includes('credit')) {
      return `💰 **EgoSMS Pricing (Uganda):**\n\n| Package | Credits | Price |\n|---------|---------|-------|\n| Starter | 500 | UGX 25,000 |\n| Growth | 2,000 | UGX 80,000 |\n| Pro | 10,000 | UGX 350,000 |\n| Enterprise | Custom | Contact us |\n\n*Prices include all network surcharges*\n[View All Packages →]`;
    }
    if (lower.includes('thank')) {
      return `You're very welcome! 😊 Is there anything else I can help you with? I'm always here to make your EgoSMS experience smoother! 🚀`;
    }
    if (lower.includes('analyze') || lower.includes('insight')) {
      return `🧠 **AI Analysis of Your Account:**\n\n📊 **This Month:**\n- Sent: 15,700 SMS\n- Delivered: 14,920 (95.05%)\n- Failed: 780 (network issues)\n\n🔍 **Key Finding:** Your failure rate spikes on Airtel on Fridays 6–8PM. Consider avoiding that window.\n\n💡 **Recommendation:** Switch Friday campaigns to Thursday evening for +3% delivery improvement.\n\nWant a detailed report emailed to you?`;
    }

    // Default intelligent response
    return `🤔 That's a great question about "${userMsg}".\n\nI'm analyzing your dashboard context to give you the best answer...\n\n💡 **Here's what I suggest:**\n- Check the **Analytics** section for detailed metrics\n- Use the **Help Center** at help.pahappa.com for guides\n- Or I can connect you with a **human support agent**\n\nCan you give me more details so I can help more specifically?`;
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput('');

    setMessages(prev => [...prev, {
      id: Math.random().toString(36).slice(2),
      role: 'user',
      content: userMsg,
      timestamp: new Date(),
    }]);

    const response = getAIResponse(userMsg);
    addAssistantMessage(response);
  };

  const handleQuickAction = (action: string) => {
    const cleanAction = action.replace(/^[^\s]+\s/, '');
    setInput(cleanAction);
    setTimeout(() => handleSend(), 0);
  };

  if (!isChatOpen) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#10B981] flex items-center justify-center shadow-2xl shadow-blue-500/40 z-50"
      >
        <MessageSquare className="w-6 h-6 text-white" />
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">1</span>
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 30, scale: 0.95 }}
      className={`fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl border shadow-2xl overflow-hidden backdrop-blur-xl ${
        isMinimized ? 'h-14' : 'h-[580px]'
      } w-[360px] transition-all duration-300 ${
        isDarkMode
          ? 'bg-[#0F172A]/95 border-slate-700'
          : 'bg-white/95 border-slate-200'
      }`}
    >
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
              Context-aware • Always learning
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setMessages([messages[0]])}
            className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
            title="Clear chat"
          >
            <RefreshCw className="w-3.5 h-3.5 text-white" />
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
          >
            {isMinimized ? <ChevronDown className="w-3.5 h-3.5 text-white" /> : <Minimize2 className="w-3.5 h-3.5 text-white" />}
          </button>
          <button
            onClick={() => setChatOpen(false)}
            className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
          >
            <X className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'assistant'
                      ? 'bg-gradient-to-br from-[#2563EB] to-[#10B981]'
                      : isDarkMode ? 'bg-slate-700' : 'bg-slate-200'
                  }`}>
                    {msg.role === 'assistant'
                      ? <Bot className="w-3.5 h-3.5 text-white" />
                      : <User className="w-3.5 h-3.5 text-slate-600" />
                    }
                  </div>
                  <div className={`max-w-[78%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-br from-[#2563EB] to-[#10B981] text-white rounded-tr-sm'
                          : isDarkMode
                          ? 'bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700'
                          : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                      }`}
                      dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                    />
                    <span className={`text-[10px] mt-1 ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2.5"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#2563EB] to-[#10B981] flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className={`px-4 py-3 rounded-2xl rounded-tl-sm ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                        className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <div className={`px-3 py-2 border-t flex gap-1.5 flex-wrap ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action}
                onClick={() => handleQuickAction(action)}
                className={`text-[10px] font-medium px-2 py-1 rounded-lg border transition-all hover:scale-105 ${
                  isDarkMode
                    ? 'border-slate-700 text-slate-400 hover:border-blue-500 hover:text-blue-400'
                    : 'border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                {action}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className={`p-3 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
            <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${
              isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <Zap className="w-4 h-4 text-[#2563EB] flex-shrink-0" />
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask EgoBot anything..."
                className={`flex-1 text-xs bg-transparent outline-none ${
                  isDarkMode ? 'text-white placeholder-slate-600' : 'text-slate-900 placeholder-slate-400'
                }`}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#10B981] flex items-center justify-center disabled:opacity-40 transition-all hover:scale-105"
              >
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
            <div className={`text-center text-[9px] mt-1.5 ${isDarkMode ? 'text-slate-700' : 'text-slate-300'}`}>
              Powered by EgoSMS AI • Context-aware responses
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
