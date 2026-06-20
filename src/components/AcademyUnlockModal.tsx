import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Clock, Star } from 'lucide-react';
import { useTranslation } from '../i18n';

interface AcademyUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AcademyUnlockModal({ isOpen, onClose }: AcademyUnlockModalProps) {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Background effects */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Animated particles */}
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  backgroundColor: ['#FFC72C', '#00E5FF', '#9747FF', '#FF2A5F'][i % 4],
                  left: `${Math.random() * 100}%`,
                  top: '100%',
                }}
                animate={{
                  y: [-100, -window.innerHeight - 100],
                  opacity: [0, 1, 1, 0],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                  ease: 'linear',
                }}
              />
            ))}
          </div>

          {/* Modal content */}
          <motion.div
            className="relative w-full max-w-sm mx-4 bg-gradient-to-b from-[#1a1f2e] to-[#0d1117] border border-[#FFC72C]/30 rounded-3xl p-6 shadow-2xl shadow-[#FFC72C]/20"
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300, delay: 0.2 }}
          >
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#FFC72C]/20 via-[#00E5FF]/20 to-[#9747FF]/20 rounded-3xl blur-xl" />

            {/* Content */}
            <div className="relative z-10 text-center">
              {/* Icon */}
              <motion.div
                className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#FFC72C] to-[#FF8C00] flex items-center justify-center shadow-lg shadow-[#FFC72C]/50"
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.4 }}
              >
                <Sparkles className="w-10 h-10 text-[#0d1117]" />
              </motion.div>

              {/* Prestige badge */}
              <motion.div
                className="inline-flex items-center gap-1.5 px-3 py-1 mb-4 rounded-full bg-[#FFC72C]/20 border border-[#FFC72C]/50"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Star className="w-4 h-4 text-[#FFC72C] fill-[#FFC72C]" />
                <span className="text-sm font-semibold text-[#FFC72C]">
                  {t('expedition.second_prestige_reached')}
                </span>
              </motion.div>

              {/* Title */}
              <motion.h1
                className="text-2xl font-bold mb-3 bg-gradient-to-r from-[#FFC72C] via-[#00E5FF] to-[#9747FF] bg-clip-text text-transparent"
                style={{ fontFamily: "'Exo 2', sans-serif" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                {t('expedition.academy_unlock_title')}
              </motion.h1>

              {/* Description */}
              <motion.p
                className="text-sm text-[#8B949E] leading-relaxed mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                {t('expedition.academy_unlock_description')}
              </motion.p>

              {/* Features list */}
              <motion.div
                className="grid grid-cols-2 gap-2 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                {[
                  { icon: Clock, text: 'expedition.feature_expeditions' },
                  { icon: Star, text: 'expedition.feature_museum' },
                  { icon: Sparkles, text: 'expedition.feature_heroes' },
                  { icon: Sparkles, text: 'expedition.feature_story' },
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#161B22] border border-white/5"
                  >
                    <feature.icon className="w-4 h-4 text-[#00E5FF]" />
                    <span className="text-xs text-[#E6EDF3]">{t(feature.text)}</span>
                  </div>
                ))}
              </motion.div>

              {/* Button */}
              <motion.button
                onClick={onClose}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#FFC72C] to-[#FF8C00] text-[#0d1117] font-bold text-lg shadow-lg shadow-[#FFC72C]/30 hover:shadow-[#FFC72C]/50 active:scale-95 transition-all"
                style={{ fontFamily: "'Exo 2', sans-serif" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileTap={{ scale: 0.98 }}
                transition={{ delay: 0.9 }}
              >
                {t('expedition.start_research')}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
