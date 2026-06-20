import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from '../i18n';

interface DuplicateTabWarningProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DuplicateTabWarning({ isOpen, onClose }: DuplicateTabWarningProps) {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative w-full max-w-sm mx-4 bg-gradient-to-b from-[#2a1a1a] to-[#1a0a0a] border border-red-500/50 rounded-3xl p-6 shadow-2xl shadow-red-500/20"
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-3xl blur-xl" />

            {/* Content */}
            <div className="relative z-10 text-center">
              {/* Icon */}
              <motion.div
                className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/50 animate-pulse"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <AlertTriangle className="w-10 h-10 text-white" />
              </motion.div>

              {/* Title */}
              <motion.h1
                className="text-2xl font-bold mb-3 text-white"
                style={{ fontFamily: "'Exo 2', sans-serif" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {t('duplicate_tab.title')}
              </motion.h1>

              {/* Description */}
              <motion.p
                className="text-sm text-gray-300 leading-relaxed mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {t('duplicate_tab.description')}
              </motion.p>

              {/* Warning box */}
              <motion.div
                className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <p className="text-xs text-red-300">
                  ⚠️ Відкриття гри в кількох вкладках може призвести до:
                </p>
                <ul className="text-xs text-red-200 mt-2 text-left space-y-1">
                  <li>• Втрати прогресу експедицій</li>
                  <li>• Подвоєння нагород</li>
                  <li>• Неправильного збереження</li>
                  <li>• Втрати даних</li>
                </ul>
              </motion.div>

              {/* Button */}
              <motion.button
                onClick={onClose}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold text-lg shadow-lg hover:shadow-red-500/50 active:scale-95 transition-all"
                style={{ fontFamily: "'Exo 2', sans-serif" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileTap={{ scale: 0.98 }}
                transition={{ delay: 0.6 }}
              >
                {t('duplicate_tab.close_tab')}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
