// OfflineRewardModal - shows rewards earned while away
import { useMemo } from 'react';
import { motion } from 'motion/react';
import { Coins, Clock, X, Sparkles } from 'lucide-react';
import { formatNumber } from '../lib/utils';
import { hapticImpact } from '../lib/telegram';

interface OfflineRewardModalProps {
  isOpen: boolean;
  offlineTime: number; // milliseconds
  xpEarned: number;
  currencyEarned: number;
  onClaim: () => void;
  onDismiss: () => void;
  hasDoubleReward: boolean; // from premium/ad boost
}

export function OfflineRewardModal({
  isOpen,
  offlineTime,
  xpEarned,
  currencyEarned,
  onClaim,
  onDismiss,
  hasDoubleReward,
}: OfflineRewardModalProps) {
  const timeAway = useMemo(() => {
    const seconds = Math.floor(offlineTime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours} год ${minutes % 60} хв`;
    }
    if (minutes > 0) {
      return `${minutes} хв`;
    }
    return `${seconds} сек`;
  }, [offlineTime]);

  if (!isOpen) return null;

  const handleClaim = () => {
    hapticImpact('medium');
    onClaim();
  };

  // Apply double reward if boost active
  const displayXp = hasDoubleReward ? xpEarned * 2 : xpEarned;
  const displayCurrency = hasDoubleReward ? currencyEarned * 2 : currencyEarned;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-[#1a1a2e] rounded-2xl border border-white/10 p-6 w-full max-w-sm"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-bold text-white">Вітаємо!</h2>
          </div>
          <button
            onClick={onDismiss}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Time Away */}
        <div className="flex items-center justify-center gap-2 mb-4 text-gray-400">
          <Clock className="w-4 h-4" />
          <span className="text-sm">Ви були відсутні {timeAway}</span>
        </div>

        {/* Rewards */}
        <div className="space-y-3 mb-6">
          {/* XP */}
          <div className="flex items-center justify-between bg-white/5 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              <span className="text-sm text-gray-300">Досвід</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-white">
                +{formatNumber(displayXp)}
              </span>
              {hasDoubleReward && (
                <span className="ml-2 text-xs text-yellow-400">x2</span>
              )}
            </div>
          </div>

          {/* Currency */}
          <div className="flex items-center justify-between bg-white/5 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-500" />
              <span className="text-sm text-gray-300">Валюта</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-white">
                +{formatNumber(displayCurrency)}
              </span>
              {hasDoubleReward && (
                <span className="ml-2 text-xs text-yellow-400">x2</span>
              )}
            </div>
          </div>
        </div>

        {/* Double reward info */}
        {hasDoubleReward && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 mb-4">
            <p className="text-sm text-yellow-400 text-center">
              ✨ Подвійна нагорода активна!
            </p>
          </div>
        )}

        {/* Claim Button */}
        <button
          onClick={handleClaim}
          className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl transition-colors active:scale-[0.98]"
        >
          Отримати
        </button>
      </motion.div>
    </motion.div>
  );
}
