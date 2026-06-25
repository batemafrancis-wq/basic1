import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ArrowRight, ArrowLeft, Sparkles, MousePointer2, Play, Pause } from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';

// ── Step definitions ──────────────────────────────────────────────────────────
// Each step can:
//   • spotlight a real DOM element via data-tutorial="..."
//   • navigate to a page before spotlighting
//   • fire a real .click() on the target (simulateClick)
//   • show a page-action label displayed next to the animated cursor

const STEPS = [
  {
    selector: 'nav-dashboard',
    page: 'dashboard' as const,
    title: '🗺️ Navigation Sidebar',
    description: 'Every section of EgoSMS lives here. Watch the cursor click the Dashboard link — the active item highlights with a blue-green gradient and the page transitions smoothly.',
    clickLabel: 'Clicking Dashboard…',
    simulateClick: true,
    autoAdvance: 2200,
  },
  {
    selector: 'ai-copilot-banner',
    page: null,
    title: '⚡ AI Copilot — Always On',
    description: 'The AI Copilot monitors every campaign 24/7. It surfaces anomalies, optimal send-time windows and growth opportunities automatically — no setup needed.',
    clickLabel: 'Hovering AI Copilot banner…',
    simulateClick: false,
    autoAdvance: 3000,
  },
  {
    selector: 'period-selector',
    page: null,
    title: '📅 Date Engine',
    description: 'Clicking MTD / YTD / 90D instantly pivots every chart and KPI on the page simultaneously. Watch the cursor click "YTD" now.',
    clickLabel: 'Clicking YTD period…',
    simulateClick: true,
    autoAdvance: 2500,
  },
  {
    selector: 'nav-send-sms',
    page: 'send-sms' as const,
    title: '📤 Send SMS',
    description: 'Compose single, bulk, custom or scheduled messages. Preview in the live phone mockup, estimate cost, and let AI suggest better copy.',
    clickLabel: 'Navigating to Send SMS…',
    simulateClick: true,
    autoAdvance: 2500,
  },
  {
    selector: 'nav-contacts',
    page: 'contacts' as const,
    title: '👥 Contacts',
    description: 'Your full contact database. Add individually, import CSV, run AI engagement scoring, and send targeted campaigns by group or network.',
    clickLabel: 'Opening Contacts…',
    simulateClick: true,
    autoAdvance: 2500,
  },
  {
    selector: 'nav-analytics',
    page: 'analytics' as const,
    title: '📊 Analytics & Insights',
    description: 'Drill into delivery rates by network, spot anomalies the moment they happen, and read AI summaries of what changed and why.',
    clickLabel: 'Opening Analytics…',
    simulateClick: true,
    autoAdvance: 2500,
  },
  {
    selector: 'nav-billing',
    page: 'billing' as const,
    title: '💳 Billing & Credits',
    description: 'Live balance, full transaction history, auto-recharge rules and one-tap top-up via MTN Money, Airtel Money, card or bank transfer.',
    clickLabel: 'Opening Billing…',
    simulateClick: true,
    autoAdvance: 2500,
  },
  {
    selector: null,
    page: 'dashboard' as const,
    title: '💬 EgoBot AI Assistant',
    description: 'The chat bubble in the bottom-right opens EgoBot — your context-aware AI assistant. It reads live account data and connects you to human support in one tap.',
    clickLabel: null,
    simulateClick: false,
    autoAdvance: null,
  },
] as const;

type StepIndex = number;

const PAD = 8; // spotlight padding px

function getRect(selector: string | null): DOMRect | null {
  if (!selector) return null;
  const el = document.querySelector(`[data-tutorial="${selector}"]`);
  return el ? el.getBoundingClientRect() : null;
}

function clickElement(selector: string | null) {
  if (!selector) return;
  const el = document.querySelector<HTMLElement>(`[data-tutorial="${selector}"]`);
  if (el) el.click();
}

export default function TutorialOverlay() {
  const {
    isTutorialActive, setTutorialActive,
    tutorialStep, setTutorialStep,
    isDarkMode, setActivePage,
  } = useDashboardStore();

  const step = STEPS[tutorialStep];

  // ── geometry ──────────────────────────────────────────────────────────────
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [winSize, setWinSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  // ── cursor ────────────────────────────────────────────────────────────────
  // We track TWO positions: departure (where cursor starts each step) and
  // arrival (centre of target). The motion.div animates from departure → arrival.
  const [cursorDep, setCursorDep] = useState({ x: -200, y: -200 });
  const [cursorArr, setCursorArr] = useState({ x: -200, y: -200 });
  const [phase, setPhase] = useState<'travel' | 'press' | 'release' | 'idle'>('idle');

  // ── autoplay ──────────────────────────────────────────────────────────────
  const [autoplay, setAutoplay] = useState(true);
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── helpers ───────────────────────────────────────────────────────────────
  const clearAuto = () => { if (autoTimer.current) clearTimeout(autoTimer.current); };

  const calcRect = useCallback(() => {
    const r = getRect(step.selector);
    setRect(r);
    setWinSize({ w: window.innerWidth, h: window.innerHeight });
    return r;
  }, [step]);

  // ── main effect: runs on step change ─────────────────────────────────────
  useEffect(() => {
    if (!isTutorialActive) return;
    clearAuto();
    setPhase('idle');

    // 1. If step requires a page change, do it immediately so DOM is ready
    if (step.page) setActivePage(step.page);

    // 2. Give React + DOM time to paint, then measure
    const t1 = setTimeout(() => {
      const r = calcRect();

      if (!r) {
        // No target element — park cursor off-screen, skip animation
        setCursorDep({ x: -200, y: -200 });
        setCursorArr({ x: -200, y: -200 });
        setPhase('idle');
        scheduleAutoAdvance();
        return;
      }

      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;

      // Cursor starts from bottom-right (feels like user's hand moving in)
      const depX = Math.min(winSize.w - 40, cx + 160);
      const depY = Math.min(winSize.h - 40, cy + 120);
      setCursorDep({ x: depX, y: depY });
      setCursorArr({ x: cx, y: cy });
      setPhase('travel');

      // After travel duration (650ms), simulate press
      const t2 = setTimeout(() => {
        setPhase('press');

        if (step.simulateClick) {
          clickElement(step.selector);
        }

        const t3 = setTimeout(() => {
          setPhase('release');
          const t4 = setTimeout(() => {
            setPhase('idle');
            scheduleAutoAdvance();
          }, 400);
          return () => clearTimeout(t4);
        }, 180);
        return () => clearTimeout(t3);
      }, 700);
      return () => clearTimeout(t2);
    }, step.page ? 350 : 150); // longer wait when page just changed

    return () => clearTimeout(t1);
  }, [tutorialStep, isTutorialActive]); // eslint-disable-line

  function scheduleAutoAdvance() {
    if (!autoplay || !step.autoAdvance) return;
    autoTimer.current = setTimeout(() => {
      goNext();
    }, step.autoAdvance);
  }

  // Resize / scroll: recalc rect only
  useEffect(() => {
    if (!isTutorialActive) return;
    const h = () => { calcRect(); setWinSize({ w: window.innerWidth, h: window.innerHeight }); };
    window.addEventListener('resize', h);
    window.addEventListener('scroll', h, true);
    return () => { window.removeEventListener('resize', h); window.removeEventListener('scroll', h, true); };
  }, [isTutorialActive, calcRect]);

  // Clean up timer when unmounted
  useEffect(() => () => clearAuto(), []);

  const goNext = () => {
    clearAuto();
    if (tutorialStep < STEPS.length - 1) setTutorialStep(tutorialStep + 1);
    else setTutorialActive(false);
  };
  const goBack = () => { clearAuto(); if (tutorialStep > 0) setTutorialStep(tutorialStep - 1); };
  const finish = () => { clearAuto(); setTutorialActive(false); };

  if (!isTutorialActive) return null;

  // ── spotlight geometry ────────────────────────────────────────────────────
  const W = winSize.w, H = winSize.h;
  const spotX = rect ? rect.left - PAD : W / 2 - 1;
  const spotY = rect ? rect.top - PAD : H / 2 - 1;
  const spotW = rect ? rect.width + PAD * 2 : 2;
  const spotH = rect ? rect.height + PAD * 2 : 2;

  // ── tooltip position (prefer below target, fall back above) ───────────────
  const TW = 318;
  const rawLeft = rect ? rect.left + rect.width / 2 - TW / 2 : W / 2 - TW / 2;
  const tooltipLeft = Math.max(12, Math.min(rawLeft, W - TW - 12));
  const belowY = rect ? rect.bottom + PAD + 14 : H / 2 - 120;
  const aboveY = rect ? rect.top - PAD - 14 - 248 : H / 2 - 120;
  const tooltipTop = belowY + 248 < H - 12 ? belowY : aboveY;
  const arrowDown = tooltipTop === aboveY;

  // ── cursor scale: press = small, release = bounce back ───────────────────
  const cursorScale = phase === 'press' ? 0.72 : phase === 'release' ? 1.18 : 1;

  return (
    <AnimatePresence>
      <motion.div
        key="tutorial-root"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] pointer-events-none"
      >
        {/* ── Overlay mask with spotlight cutout ─────────────────────────── */}
        <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
          <defs>
            <mask id="tut-mask">
              <rect width={W} height={H} fill="white" />
              <motion.rect
                animate={{ x: spotX, y: spotY, width: spotW, height: spotH }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
                rx={10} fill="black"
              />
            </mask>
          </defs>
          <rect width={W} height={H} fill="rgba(2,6,23,0.68)" mask="url(#tut-mask)" />
        </svg>

        {/* ── Spotlight border ring ───────────────────────────────────────── */}
        {rect && (
          <motion.div
            animate={{ left: spotX, top: spotY, width: spotW, height: spotH }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="absolute rounded-xl pointer-events-none"
            style={{ boxShadow: '0 0 0 2px #2563EB, 0 0 28px 6px rgba(37,99,235,0.3)' }}
          >
            {/* Scanning line */}
            <motion.div
              animate={{ top: ['0%', '100%', '0%'] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-[#2563EB] to-transparent opacity-60"
            />
            {/* Corner ticks */}
            {[
              'top-0 left-0 border-t-2 border-l-2 rounded-tl-xl',
              'top-0 right-0 border-t-2 border-r-2 rounded-tr-xl',
              'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-xl',
              'bottom-0 right-0 border-b-2 border-r-2 rounded-br-xl',
            ].map((cls, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 + i * 0.05, type: 'spring', stiffness: 400 }}
                className={`absolute w-3.5 h-3.5 border-[#2563EB] ${cls}`}
              />
            ))}
          </motion.div>
        )}

        {/* ── Animated cursor ─────────────────────────────────────────────── */}
        <motion.div
          className="absolute z-[115] pointer-events-none origin-top-left"
          initial={{ left: cursorDep.x, top: cursorDep.y, scale: 1 }}
          animate={{
            left: cursorArr.x - 3,
            top: cursorArr.y - 2,
            scale: cursorScale,
          }}
          transition={
            phase === 'travel'
              ? { duration: 0.65, ease: [0.22, 1, 0.36, 1] }
              : { duration: 0.15, ease: 'easeOut' }
          }
          style={{ willChange: 'left,top,scale' }}
        >
          <MousePointer2
            className="w-7 h-7 drop-shadow-[0_3px_12px_rgba(0,0,0,0.6)]"
            fill={phase === 'press' ? '#1d4ed8' : 'white'}
            stroke="#1d4ed8"
            strokeWidth={1.4}
          />

          {/* Click ripples on press */}
          <AnimatePresence>
            {phase === 'press' && (
              <>
                {[0, 1, 2].map(i => (
                  <motion.div key={i}
                    initial={{ scale: 0.2, opacity: 0.9 - i * 0.2 }}
                    animate={{ scale: 3.5 + i, opacity: 0 }}
                    transition={{ duration: 0.55 + i * 0.1, ease: 'easeOut', delay: i * 0.08 }}
                    className="absolute rounded-full bg-[#2563EB]/40 pointer-events-none"
                    style={{ width: 28, height: 28, left: '50%', top: '50%', x: '-50%', y: '-50%' }}
                  />
                ))}
              </>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Tooltip card ────────────────────────────────────────────────── */}
        <motion.div
          key={`tip-${tutorialStep}`}
          initial={{ opacity: 0, scale: 0.9, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="absolute pointer-events-auto z-[120]"
          style={{ left: tooltipLeft, top: tooltipTop, width: TW }}
        >
          {/* Arrow */}
          {rect && (
            <div className="absolute left-1/2 -translate-x-1/2 w-0 h-0"
              style={arrowDown
                ? { bottom: -8, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: `8px solid ${isDarkMode ? '#0f172a' : '#fff'}` }
                : { top: -8, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderBottom: '8px solid #2563EB' }
              }
            />
          )}

          <div className={`rounded-2xl border shadow-2xl shadow-black/40 overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
            {/* Header */}
            <div className="bg-gradient-to-r from-[#2563EB] to-[#10B981] px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-white" />
                <span className="text-white text-[11px] font-bold uppercase tracking-wider">Interactive Tour</span>
                <span className="text-white/60 text-[10px]">{tutorialStep + 1}/{STEPS.length}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {/* Autoplay toggle */}
                <button
                  onClick={() => { setAutoplay(v => !v); clearAuto(); }}
                  className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/35 flex items-center justify-center transition-colors"
                  title={autoplay ? 'Pause autoplay' : 'Resume autoplay'}
                >
                  {autoplay ? <Pause className="w-2.5 h-2.5 text-white" /> : <Play className="w-2.5 h-2.5 text-white" />}
                </button>
                <button onClick={finish} className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/35 flex items-center justify-center transition-colors">
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            </div>

            <div className="p-4">
              <p className={`text-sm font-bold mb-1.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{step.title}</p>
              <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{step.description}</p>

              {/* Cursor action label */}
              {step.clickLabel && (
                <motion.div
                  animate={{ x: phase === 'press' ? [0, -3, 3, 0] : 0 }}
                  transition={{ duration: 0.25 }}
                  className="mt-2.5 flex items-center gap-1.5"
                >
                  <motion.div animate={{ x: [0, 5, 0] }} transition={{ duration: 1, repeat: Infinity }}>
                    <MousePointer2 className="w-3.5 h-3.5 text-[#2563EB]" fill="#2563EB" />
                  </motion.div>
                  <span className={`text-[10px] font-semibold ${phase === 'press' ? 'text-[#10B981]' : 'text-[#2563EB]'}`}>
                    {phase === 'press' ? '✓ Clicked!' : step.clickLabel}
                  </span>
                </motion.div>
              )}

              {/* Autoplay progress bar */}
              {autoplay && step.autoAdvance && phase === 'idle' && (
                <motion.div
                  key={`prog-${tutorialStep}`}
                  className="mt-3 h-0.5 rounded-full bg-gradient-to-r from-[#2563EB] to-[#10B981]"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: step.autoAdvance / 1000, ease: 'linear' }}
                />
              )}

              {/* Step dots */}
              <div className="mt-3 flex items-center gap-1.5">
                {STEPS.map((_, i) => (
                  <motion.button
                    key={i}
                    onClick={() => { clearAuto(); setTutorialStep(i); }}
                    animate={{ width: i === tutorialStep ? 18 : 5 }}
                    className={`h-1.5 rounded-full transition-colors ${i === tutorialStep ? 'bg-gradient-to-r from-[#2563EB] to-[#10B981]'
                        : i < tutorialStep ? 'bg-[#10B981]'
                          : isDarkMode ? 'bg-slate-700' : 'bg-slate-200'
                      }`}
                  />
                ))}
              </div>

              {/* Nav buttons */}
              <div className="mt-3 flex gap-2">
                {tutorialStep > 0 && (
                  <button onClick={goBack}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${isDarkMode ? 'border-slate-700 text-slate-400 hover:text-white' : 'border-slate-200 text-slate-500 hover:text-slate-700'}`}>
                    <ArrowLeft className="w-3 h-3" /> Back
                  </button>
                )}
                <button onClick={goNext}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white hover:opacity-90 transition-opacity">
                  {tutorialStep < STEPS.length - 1 ? <><span>Next</span><ArrowRight className="w-3 h-3" /></> : '🎉 Finish Tour!'}
                </button>
              </div>
              <button onClick={finish}
                className={`w-full mt-2 text-[10px] text-center transition-colors ${isDarkMode ? 'text-slate-600 hover:text-slate-400' : 'text-slate-400 hover:text-slate-500'}`}>
                Skip tutorial
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
