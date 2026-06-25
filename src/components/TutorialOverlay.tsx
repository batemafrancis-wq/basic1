import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ArrowRight, ArrowLeft, Sparkles, MousePointer2 } from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';

// ── Step definitions ──────────────────────────────────────────────────────────
// selector: data-tutorial="..." attribute value of the target element
// If null, the tooltip is centred (no spotlight / cursor travel).
const STEPS = [
  {
    selector: 'nav-dashboard',
    title: '🗺️ Navigation Sidebar',
    description: 'Every section of EgoSMS is one click away here. The active page is highlighted with a blue-green gradient. Try clicking any item to jump straight there.',
    clickLabel: 'Navigate to Dashboard',
  },
  {
    selector: 'ai-copilot-banner',
    title: '⚡ AI Copilot — Always On',
    description: "Your AI Copilot monitors every campaign in real-time, 24/7. It surfaces anomalies, optimal send-time windows, and growth opportunities before you even notice them.",
    clickLabel: 'Highlight Copilot',
  },
  {
    selector: 'period-selector',
    title: '📅 The Date Engine',
    description: 'Clicking MTD, YTD, or 90D instantly refreshes every chart and KPI on screen simultaneously. Watch the numbers animate as the data pivots.',
    clickLabel: 'Click Period Selector',
  },
  {
    selector: 'nav-send-sms',
    title: '📤 Send SMS',
    description: 'Compose single, bulk, custom or scheduled messages. Preview them in the live phone mockup, estimate costs before sending, and let AI suggest better copy.',
    clickLabel: 'Go to Send SMS',
  },
  {
    selector: 'nav-analytics',
    title: '📊 Analytics & Insights',
    description: 'Drill into delivery rates by network, spot anomalies, and let the AI summarise what changed and why — all from one screen.',
    clickLabel: 'Open Analytics',
  },
  {
    selector: 'nav-reports',
    title: '📄 Reports',
    description: 'Export delivery, campaign, billing, and network reports as PDF, CSV, or XLSX. Set up automatic email schedules so you never miss a review.',
    clickLabel: 'Open Reports',
  },
  {
    selector: null,
    title: '💬 EgoBot AI Assistant',
    description: 'The chat bubble in the bottom-right corner opens EgoBot — your context-aware assistant. It reads your live data and can connect you to human support in one tap.',
    clickLabel: null,
  },
] as const;

type Step = typeof STEPS[number];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getTargetRect(selector: string | null): DOMRect | null {
  if (!selector) return null;
  const el = document.querySelector(`[data-tutorial="${selector}"]`);
  return el ? el.getBoundingClientRect() : null;
}

const PAD = 10; // spotlight padding

// ── Component ─────────────────────────────────────────────────────────────────
export default function TutorialOverlay() {
  const {
    isTutorialActive, setTutorialActive,
    tutorialStep, setTutorialStep,
    isDarkMode, setActivePage,
  } = useDashboardStore();

  const step: Step = STEPS[tutorialStep];

  // Target rect state — recalculated on step change & resize
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Cursor animation state
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [showRipple, setShowRipple] = useState(false);
  const cursorReady = useRef(false);

  const calcRect = useCallback(() => {
    const r = getTargetRect(step.selector);
    setRect(r);
    return r;
  }, [step]);

  // On step change: compute rect then animate cursor to centre of target
  useEffect(() => {
    if (!isTutorialActive) return;
    cursorReady.current = false;
    setShowRipple(false);

    // Small delay to let React paint the new tooltip position first
    const t1 = setTimeout(() => {
      const r = calcRect();
      if (r) {
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;

        // Start cursor off to the side so the travel is visible
        setCursorPos({ x: cx - 120, y: cy + 80 });

        const t2 = setTimeout(() => {
          setCursorPos({ x: cx, y: cy });
          const t3 = setTimeout(() => {
            setShowRipple(true);
            cursorReady.current = true;
          }, 700);
          return () => clearTimeout(t3);
        }, 50);
        return () => clearTimeout(t2);
      } else {
        // No target — park cursor off-screen
        setCursorPos({ x: -200, y: -200 });
      }
    }, 200);

    return () => clearTimeout(t1);
  }, [tutorialStep, isTutorialActive, calcRect]);

  // Resize / scroll recalc
  useEffect(() => {
    if (!isTutorialActive) return;
    const handler = () => calcRect();
    window.addEventListener('resize', handler);
    window.addEventListener('scroll', handler, true);
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('scroll', handler, true);
    };
  }, [isTutorialActive, calcRect]);

  const goNext = () => {
    if (tutorialStep < STEPS.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      setTutorialActive(false);
    }
  };

  const goBack = () => setTutorialStep(tutorialStep - 1);

  if (!isTutorialActive) return null;

  // Spotlight geometry
  const W = window.innerWidth;
  const H = window.innerHeight;
  const spotX = rect ? rect.left - PAD : W / 2 - 1;
  const spotY = rect ? rect.top - PAD : H / 2 - 1;
  const spotW = rect ? rect.width + PAD * 2 : 2;
  const spotH = rect ? rect.height + PAD * 2 : 2;

  // Tooltip positioning: prefer below, fallback above
  const tooltipW = 320;
  let tooltipLeft = rect ? Math.min(rect.left + rect.width / 2 - tooltipW / 2, W - tooltipW - 16) : W / 2 - tooltipW / 2;
  tooltipLeft = Math.max(16, tooltipLeft);
  const belowY = rect ? rect.bottom + PAD + 12 : H / 2 - 100;
  const aboveY = rect ? rect.top - PAD - 12 - 260 : H / 2 - 100;
  const tooltipTop = (belowY + 260 < H - 20) ? belowY : aboveY;
  // Arrow direction
  const arrowDown = tooltipTop === aboveY;

  return (
    <AnimatePresence>
      <motion.div
        key="tutorial-root"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] pointer-events-none"
      >
        {/* ── SVG spotlight mask ─────────────────────────────────────────── */}
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ pointerEvents: 'none' }}
        >
          <defs>
            <mask id="spotlight-mask">
              <rect width={W} height={H} fill="white" />
              <motion.rect
                animate={{ x: spotX, y: spotY, width: spotW, height: spotH }}
                transition={{ duration: 0.45, ease: 'easeInOut' }}
                rx={12}
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width={W}
            height={H}
            fill="rgba(0,0,0,0.62)"
            mask="url(#spotlight-mask)"
          />
        </svg>

        {/* ── Spotlight border ring ──────────────────────────────────────── */}
        {rect && (
          <motion.div
            animate={{
              left: spotX,
              top: spotY,
              width: spotW,
              height: spotH,
            }}
            transition={{ duration: 0.45, ease: 'easeInOut' }}
            className="absolute rounded-xl pointer-events-none"
            style={{
              boxShadow: '0 0 0 2px rgba(37,99,235,0.9), 0 0 24px 4px rgba(37,99,235,0.35)',
            }}
          >
            {/* Animated corner ticks */}
            {[
              'top-0 left-0 border-t-2 border-l-2 rounded-tl-xl',
              'top-0 right-0 border-t-2 border-r-2 rounded-tr-xl',
              'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-xl',
              'bottom-0 right-0 border-b-2 border-r-2 rounded-br-xl',
            ].map((cls, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.06 }}
                className={`absolute w-4 h-4 border-[#2563EB] ${cls}`}
              />
            ))}
          </motion.div>
        )}

        {/* ── Animated cursor ────────────────────────────────────────────── */}
        <motion.div
          animate={{ left: cursorPos.x - 4, top: cursorPos.y - 2 }}
          transition={{ duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute z-[115] pointer-events-none"
          style={{ willChange: 'left, top' }}
        >
          <MousePointer2
            className="w-6 h-6 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
            fill="white"
            stroke="#1d4ed8"
            strokeWidth={1.5}
          />
          {/* Click ripple */}
          <AnimatePresence>
            {showRipple && (
              <>
                <motion.div
                  key="r1"
                  initial={{ scale: 0.3, opacity: 0.8 }}
                  animate={{ scale: 2.8, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="absolute inset-0 rounded-full bg-[#2563EB]/50 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: '50%', top: '50%', width: 24, height: 24 }}
                />
                <motion.div
                  key="r2"
                  initial={{ scale: 0.3, opacity: 0.6 }}
                  animate={{ scale: 2, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45, ease: 'easeOut', delay: 0.1 }}
                  className="absolute inset-0 rounded-full bg-[#10B981]/50 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: '50%', top: '50%', width: 24, height: 24 }}
                />
              </>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Tooltip card ───────────────────────────────────────────────── */}
        <motion.div
          key={tutorialStep}
          initial={{ opacity: 0, scale: 0.92, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ duration: 0.25 }}
          className="absolute pointer-events-auto z-[120]"
          style={{ left: tooltipLeft, top: tooltipTop, width: tooltipW }}
        >
          {/* Arrow toward the target */}
          {rect && (
            <div
              className="absolute left-1/2 -translate-x-1/2 w-0 h-0"
              style={
                arrowDown
                  ? {
                    bottom: -8,
                    borderLeft: '8px solid transparent',
                    borderRight: '8px solid transparent',
                    borderTop: `8px solid ${isDarkMode ? '#1e293b' : '#ffffff'}`,
                  }
                  : {
                    top: -8,
                    borderLeft: '8px solid transparent',
                    borderRight: '8px solid transparent',
                    borderBottom: `8px solid #2563EB`,
                  }
              }
            />
          )}

          <div className={`rounded-2xl border shadow-2xl shadow-black/30 overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
            {/* Gradient header */}
            <div className="bg-gradient-to-r from-[#2563EB] to-[#10B981] px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-white" />
                  <span className="text-white text-xs font-bold uppercase tracking-wider">Interactive Tour</span>
                  <span className="text-white/60 text-[10px]">{tutorialStep + 1} / {STEPS.length}</span>
                </div>
                <button
                  onClick={() => setTutorialActive(false)}
                  className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/35 transition-colors"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-4">
              <div className={`text-sm font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {step.title}
              </div>
              <div className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {step.description}
              </div>

              {/* Click simulation label */}
              {step.clickLabel && (
                <div className="mt-3 flex items-center gap-1.5">
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <MousePointer2 className="w-3.5 h-3.5 text-[#2563EB]" fill="#2563EB" />
                  </motion.div>
                  <span className="text-[10px] font-semibold text-[#2563EB]">{step.clickLabel}</span>
                </div>
              )}

              {/* Progress dots */}
              <div className="mt-4 flex items-center gap-1.5">
                {STEPS.map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ width: i === tutorialStep ? 20 : 6 }}
                    className={`h-1.5 rounded-full ${i === tutorialStep
                        ? 'bg-gradient-to-r from-[#2563EB] to-[#10B981]'
                        : i < tutorialStep
                          ? 'bg-[#10B981]'
                          : isDarkMode ? 'bg-slate-700' : 'bg-slate-200'
                      }`}
                  />
                ))}
              </div>

              {/* Nav buttons */}
              <div className="mt-3 flex gap-2">
                {tutorialStep > 0 && (
                  <button
                    onClick={goBack}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${isDarkMode ? 'border-slate-700 text-slate-400 hover:text-white' : 'border-slate-200 text-slate-500 hover:text-slate-700'
                      }`}
                  >
                    <ArrowLeft className="w-3 h-3" /> Back
                  </button>
                )}
                <button
                  onClick={goNext}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white hover:opacity-90 transition-opacity"
                >
                  {tutorialStep < STEPS.length - 1 ? (
                    <>Next <ArrowRight className="w-3 h-3" /></>
                  ) : (
                    <>🎉 Finish Tour!</>
                  )}
                </button>
              </div>

              <button
                onClick={() => setTutorialActive(false)}
                className={`w-full mt-2 text-[10px] text-center transition-colors ${isDarkMode ? 'text-slate-600 hover:text-slate-400' : 'text-slate-400 hover:text-slate-500'}`}
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
