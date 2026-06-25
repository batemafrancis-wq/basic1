import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';

const steps = [
  {
    id: 'period-selector',
    title: '📅 The Date Engine',
    description: 'Use these buttons to filter ALL charts simultaneously. Click "YTD" to see your full year performance — watch every chart update instantly with smooth animations!',
    position: { top: '80px', left: '50%', transform: 'translateX(-50%)' },
    highlight: 'date-period-selector',
    arrowDir: 'up',
  },
  {
    id: 'kpi-cards',
    title: '📊 Live KPI Sparklines',
    description: 'Hover over any KPI card to reveal a 6-month sparkline trend. Green arrows = growth, red = decline. Click the % badge to see the full breakdown of what drove the change.',
    position: { top: '220px', left: '60px' },
    arrowDir: 'none',
  },
  {
    id: 'ai-insights',
    title: '🤖 AI Copilot Insights',
    description: 'Your AI Copilot monitors campaigns 24/7 and surfaces intelligent recommendations here — anomaly detection, optimal send times, and growth opportunities.',
    position: { top: '220px', right: '60px' },
    arrowDir: 'none',
  },
  {
    id: 'chatbot',
    title: '💬 EgoBot AI Assistant',
    description: 'Click the chat bubble in the bottom-right to open EgoBot — your context-aware AI assistant. It can check balances, send test messages, analyze your campaigns, and more!',
    position: { bottom: '100px', right: '80px' },
    arrowDir: 'down',
  },
];

export default function TutorialOverlay() {
  const { isTutorialActive, setTutorialActive, tutorialStep, setTutorialStep, isDarkMode } = useDashboardStore();
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [showCursor, setShowCursor] = useState(false);

  const step = steps[tutorialStep];

  useEffect(() => {
    if (!isTutorialActive) return;

    // Animate cursor to target location
    setShowCursor(true);
    const targets: Record<number, { x: number; y: number }> = {
      0: { x: window.innerWidth / 2, y: 88 },
      1: { x: 280, y: 280 },
      2: { x: window.innerWidth - 200, y: 280 },
      3: { x: window.innerWidth - 80, y: window.innerHeight - 100 },
    };

    const target = targets[tutorialStep];
    if (target) {
      setCursorPos(target);
    }
  }, [tutorialStep, isTutorialActive]);

  if (!isTutorialActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] pointer-events-none"
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

        {/* Animated Cursor */}
        {showCursor && (
          <motion.div
            animate={{ x: cursorPos.x, y: cursorPos.y }}
            transition={{ duration: 1, ease: 'easeInOut' }}
            className="absolute z-[110] pointer-events-none"
            style={{ left: 0, top: 0 }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="drop-shadow-2xl">
              <path d="M4 2L4 18L8 14L11 20L13.5 19L10.5 13L16 13L4 2Z" fill="white" stroke="#2563EB" strokeWidth="1.5" />
            </svg>
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute -inset-2 rounded-full bg-[#2563EB]/20"
            />
          </motion.div>
        )}

        {/* Step Tooltip */}
        <motion.div
          key={tutorialStep}
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="absolute pointer-events-auto z-[105]"
          style={step.position as React.CSSProperties}
        >
          <div className={`w-80 rounded-2xl border shadow-2xl overflow-hidden ${
            isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
          }`}>
            {/* Header */}
            <div className="bg-gradient-to-r from-[#2563EB] to-[#10B981] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-white" />
                  <span className="text-white text-xs font-bold uppercase tracking-wider">Interactive Tour</span>
                </div>
                <button
                  onClick={() => setTutorialActive(false)}
                  className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className={`text-sm font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {step.title}
              </div>
              <div className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {step.description}
              </div>

              {/* Progress */}
              <div className="mt-4 flex items-center gap-1.5">
                {steps.map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ width: i === tutorialStep ? 20 : 6 }}
                    className={`h-1.5 rounded-full transition-all ${
                      i === tutorialStep
                        ? 'bg-gradient-to-r from-[#2563EB] to-[#10B981]'
                        : i < tutorialStep
                        ? 'bg-[#10B981]'
                        : isDarkMode ? 'bg-slate-700' : 'bg-slate-200'
                    }`}
                  />
                ))}
                <span className={`ml-1 text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  {tutorialStep + 1}/{steps.length}
                </span>
              </div>

              {/* Navigation */}
              <div className="mt-3 flex gap-2">
                {tutorialStep > 0 && (
                  <button
                    onClick={() => setTutorialStep(tutorialStep - 1)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                      isDarkMode
                        ? 'border-slate-700 text-slate-400 hover:text-white'
                        : 'border-slate-200 text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <ArrowLeft className="w-3 h-3" />
                    Back
                  </button>
                )}
                <button
                  onClick={() => {
                    if (tutorialStep < steps.length - 1) {
                      setTutorialStep(tutorialStep + 1);
                    } else {
                      setTutorialActive(false);
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white transition-all hover:opacity-90"
                >
                  {tutorialStep < steps.length - 1 ? (
                    <>Next <ArrowRight className="w-3 h-3" /></>
                  ) : (
                    <>🎉 Finish Tour!</>
                  )}
                </button>
              </div>

              <button
                onClick={() => setTutorialActive(false)}
                className={`w-full mt-2 text-[10px] text-center ${isDarkMode ? 'text-slate-600 hover:text-slate-400' : 'text-slate-400 hover:text-slate-500'} transition-colors`}
              >
                Skip tutorial
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
