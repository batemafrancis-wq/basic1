import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, Send, ThumbsUp } from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';

/**
 * Floating star-rating modal driven by store.pendingRating.
 * Any part of the app can trigger it via:
 *   store.requestRating('Upload Contacts CSV', (stars, comment) => { ... })
 */
export default function RatingModal() {
  const { pendingRating, clearRating, isDarkMode, addNotification } = useDashboardStore();
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!pendingRating) return null;

  const labels = ['Terrible', 'Poor', 'OK', 'Good', 'Excellent'];

  const handleSubmit = () => {
    if (!selected) return;
    pendingRating.onRate(selected, comment);
    setSubmitted(true);
    setTimeout(() => {
      clearRating();
      setSelected(0);
      setComment('');
      setSubmitted(false);
      setHovered(0);
    }, 1800);
    addNotification({
      type: 'success',
      title: '⭐ Thanks for the rating!',
      message: `You rated "${pendingRating.activityLabel}" ${selected}/5 stars.`,
    });
  };

  const handleSkip = () => {
    clearRating();
    setSelected(0);
    setComment('');
    setHovered(0);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && handleSkip()}
      >
        <motion.div
          initial={{ scale: 0.88, y: 24 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.88, y: 24 }}
          transition={{ type: 'spring', stiffness: 340, damping: 26 }}
          className={`w-full max-w-sm rounded-2xl border shadow-2xl overflow-hidden ${
            isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#2563EB] to-[#10B981] px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-white" />
              <span className="text-sm font-bold text-white">Rate this activity</span>
            </div>
            <button
              onClick={handleSkip}
              className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/35 flex items-center justify-center transition-colors"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>

          <div className="p-5">
            {!submitted ? (
              <>
                <p className={`text-xs mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  How was your experience with
                </p>
                <p className={`text-sm font-bold mb-5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {pendingRating.activityLabel}
                </p>

                {/* Stars */}
                <div className="flex items-center justify-center gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <motion.button
                      key={s}
                      whileHover={{ scale: 1.25 }}
                      whileTap={{ scale: 0.9 }}
                      onMouseEnter={() => setHovered(s)}
                      onMouseLeave={() => setHovered(0)}
                      onClick={() => setSelected(s)}
                      className="transition-all"
                    >
                      <Star
                        className="w-9 h-9 transition-all duration-100"
                        fill={(hovered || selected) >= s ? '#FBBF24' : 'none'}
                        stroke={(hovered || selected) >= s ? '#FBBF24' : isDarkMode ? '#475569' : '#CBD5E1'}
                        strokeWidth={1.5}
                      />
                    </motion.button>
                  ))}
                </div>

                {/* Label under stars */}
                <div className="h-5 text-center mb-4">
                  <AnimatePresence mode="wait">
                    {(hovered || selected) > 0 && (
                      <motion.p
                        key={hovered || selected}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="text-xs font-bold text-amber-500"
                      >
                        {labels[(hovered || selected) - 1]}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Comment */}
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us more (optional)..."
                  rows={3}
                  className={`w-full px-3 py-2.5 rounded-xl border text-xs resize-none outline-none transition-all ${
                    isDarkMode
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600 focus:border-blue-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-400'
                  }`}
                />

                {/* Actions */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleSkip}
                    className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      isDarkMode
                        ? 'border-slate-700 text-slate-400 hover:text-white'
                        : 'border-slate-200 text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Skip
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSubmit}
                    disabled={!selected}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white text-xs font-bold shadow-md disabled:opacity-40 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Submit Rating
                  </motion.button>
                </div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-6 flex flex-col items-center gap-3"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
                  className="w-14 h-14 rounded-full bg-gradient-to-br from-[#2563EB] to-[#10B981] flex items-center justify-center shadow-lg"
                >
                  <ThumbsUp className="w-7 h-7 text-white" />
                </motion.div>
                <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Thank you! 🎉
                </p>
                <p className={`text-xs text-center ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Your feedback helps us improve EgoSMS for everyone.
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
