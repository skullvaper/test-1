import { useState } from 'react';
import { useTranslation } from '../i18n';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, Star, AlertTriangle, FlaskConical, Globe, BookOpen } from 'lucide-react';
import { hapticImpact } from '../lib/telegram';

interface PrestigeButtonProps {
  level: number;
  epochId: string;
  prestigeLevel: number;
  prestigePoints: number;
  canPrestige: boolean;
  onPrestige: () => Promise<boolean>;
}

export function PrestigeButton({
  level,
  epochId,
  prestigeLevel,
  prestigePoints,
  canPrestige,
  onPrestige,
}: PrestigeButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const { t } = useTranslation();

  const handlePrestige = () => {
    if (!canPrestige) return;

    hapticImpact('heavy');
    setShowConfirm(true);
  };

  const confirmPrestige = async () => {
    const success = await onPrestige();
    if (success) {
      setShowConfirm(false);
    }
  };

  // Show prestige badge
  const prestigeBadge = prestigeLevel > 0 ? (
    <div className="flex items-center gap-1 text-yellow-400">
      {[...Array(Math.min(prestigeLevel, 5))].map((_, i) => (
        <Star key={i} className="w-4 h-4 fill-yellow-400" />
      ))}
      {prestigeLevel > 5 && <span className="text-sm ml-1">x{prestigeLevel}</span>}
    </div>
  ) : null;

  // Can't prestige yet - show requirement
  if (!canPrestige) {
    const missingLevel = Math.max(0, 960 - level);
    const wrongEpoch = epochId !== 'independence';

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700"
      >
        <div className="flex items-center gap-3 mb-3">
          <motion.div 
            className="p-2.5 bg-gray-700/50 rounded-xl"
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ repeat: Infinity, duration: 4 }}
          >
            <RotateCcw className="w-6 h-6 text-gray-500" />
          </motion.div>
          <div className="flex-1">
            <h3 className="text-white font-bold text-lg">{t('prestige.title')}</h3>
            <p className="text-gray-400 text-sm">{t('prestige.description')}</p>
          </div>
          {prestigeBadge}
        </div>

        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-3 mb-3">
          <div className="flex items-center gap-2 text-red-400 text-sm mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-medium">{t('prestige.requirements_not_met')}</span>
          </div>
          <ul className="text-xs text-gray-400 space-y-1">
            {missingLevel > 0 && (
              <motion.li 
                className={level >= 960 ? 'text-green-400' : 'text-gray-400'}
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                • Рівень {level}/960 (потрібно ще {missingLevel})
              </motion.li>
            )}
            {wrongEpoch && (
              <li className="text-gray-400">
                • Епоха: Незалежність (поточна: {epochId === 'independence' ? 'Незалежна Україна' : epochId})
              </li>
            )}
            {!wrongEpoch && (
              <li className="text-green-400">
                ✓ Епоха: Незалежність
              </li>
            )}
          </ul>
        </div>

        {prestigeLevel > 0 && (
          <motion.div 
            className="text-center text-sm text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Поточне переродження: <span className="text-yellow-400 font-bold">{prestigeLevel}</span> |
            Очки: <span className="text-purple-400 font-bold">{prestigePoints}</span>
          </motion.div>
        )}
      </motion.div>
    );
  }

  // Can prestige - show button
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-yellow-900/30 to-purple-900/30 rounded-2xl p-4 border border-yellow-500/30"
    >
      <div className="flex items-center gap-3 mb-4">
        <motion.div 
          className="p-3 bg-yellow-500/20 rounded-xl"
          animate={{ rotate: [0, 360] }}
          transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
        >
          <Star className="w-8 h-8 text-yellow-400" />
        </motion.div>
        <div className="flex-1">
          <h3 className="text-white font-bold text-lg">{t('prestige.ready_title')}</h3>
          <p className="text-yellow-400 text-sm">+{prestigePoints} {t('prestige.points')}</p>
        </div>
        {prestigeBadge}
      </div>

      <AnimatePresence mode="wait">
        {showConfirm ? (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <p className="text-center text-white text-sm">
              {t('prestige.confirm_text')}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-gray-700 text-white font-medium"
              >
                {t('prestige.cancel')}
              </button>
              <motion.button
                onClick={confirmPrestige}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold"
              >
                {t('prestige.confirm')}
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePrestige}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold text-lg"
          >
            {t('prestige.button')}
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Museum Laboratory Component
interface MuseumLaboratoryProps {
  prestigeLevel: number;
  prestigePoints: number;
  prestigeResearch: {
    rare_artifact_chance?: number;
    passive_income?: number;
    xp_gain?: number;
  };
  onBuyUpgrade: (upgradeId: string, cost: number, maxLevel: number) => boolean;
}

const UPGRADES = [
  {
    id: 'rare_artifact_chance',
    name: 'Чорна Археологія',
    description: '+5% шанс рідкісного артефакту',
    icon: FlaskConical,
    cost: 2,
    maxLevel: 10,
    effect: (level: number) => `+${level * 5}% рідкісні артефакти`,
  },
  {
    id: 'passive_income',
    name: 'Всесвітня Експедиція',
    description: '+10% пасивний дохід',
    icon: Globe,
    cost: 3,
    maxLevel: 10,
    effect: (level: number) => `+${level * 10}% пасивний дохід`,
  },
  {
    id: 'xp_gain',
    name: 'Головний Історик',
    description: '+5% XP',
    icon: BookOpen,
    cost: 1,
    maxLevel: 20,
    effect: (level: number) => `+${level * 5}% XP`,
  },
];

export function MuseumLaboratory({
  prestigeLevel,
  prestigePoints,
  prestigeResearch,
  onBuyUpgrade,
}: MuseumLaboratoryProps) {
  const { t } = useTranslation();
  if (prestigeLevel < 1) {
    return (
      <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 bg-gray-700/50 rounded-xl">
            <FlaskConical className="w-6 h-6 text-gray-500" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">{t('prestige.museum_lab_title')}</h3>
            <p className="text-gray-500 text-sm">{t('prestige.museum_lab_locked')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 rounded-2xl p-4 border border-purple-500/30">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/20 rounded-xl">
            <FlaskConical className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">{t('prestige.museum_lab_title')}</h3>
            <p className="text-purple-400/80 text-sm">{t('prestige.museum_lab_permanent')}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-purple-400 font-bold">{prestigePoints}</div>
          <div className="text-xs text-gray-400">{t('prestige.points')}</div>
        </div>
      </div>

      <div className="space-y-3">
        {UPGRADES.map(upgrade => {
          const currentLevel = prestigeResearch[upgrade.id as keyof typeof prestigeResearch] || 0;
          const canBuy = prestigePoints >= upgrade.cost && currentLevel < upgrade.maxLevel;
          const Icon = upgrade.icon;

          return (
            <div
              key={upgrade.id}
              className="bg-gray-800/50 rounded-xl p-3 flex items-center gap-3"
            >
              <div className={`p-2 rounded-lg ${canBuy ? 'bg-purple-500/20' : 'bg-gray-700/50'}`}>
                <Icon className={`w-5 h-5 ${canBuy ? 'text-purple-400' : 'text-gray-500'}`} />
              </div>
              <div className="flex-1">
                <div className="text-white font-medium text-sm">{upgrade.name}</div>
                <div className="text-xs text-gray-400">{upgrade.description}</div>
                <div className="text-xs text-purple-400 mt-1">
                  {upgrade.effect(currentLevel)} {currentLevel >= upgrade.maxLevel ? t('prestige.max') : `(${currentLevel}/${upgrade.maxLevel})`}
                </div>
              </div>
              <button
                onClick={() => onBuyUpgrade(upgrade.id, upgrade.cost, upgrade.maxLevel)}
                disabled={!canBuy}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  canBuy
                    ? 'bg-purple-500 hover:bg-purple-400 text-white'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                {currentLevel >= upgrade.maxLevel ? 'МАКС' : `${upgrade.cost} ОЧ`}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-gray-500 mt-3">
        Всі покращення зберігаються після переродження
      </p>
    </div>
  );
}
