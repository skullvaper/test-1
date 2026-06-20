import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Epoch, Artifact, EpochId } from '../types/game';
import { ARTIFACTS, getArtifactsForEpoch, EPOCHS } from '../data/epochs';
import { ARTIFACT_PARTS_PER_LEVEL } from '../types/game';
import { hapticImpact, hapticNotification } from '../lib/telegram';
import { rpcOpenChest } from '../lib/rpc';
import { getTelegramUserId } from '../lib/telegram';
import { X, Sparkles, Zap, Loader2 } from 'lucide-react';

interface GachaReward {
  id: string;
  epoch: string;
  rarity: string;
  parts_granted: number;
  icon: string;
  name: { ua: string; en: string };
}

interface GachaModalProps {
  epoch: Epoch;
  currency: number;
  unlockedEpochs: string[];
  artifactParts: Record<string, number>;
  completedArtifacts: string[];
  artifactDupes: Record<string, number>;
  artifactLevels: Record<string, number>;
  prestigeLevel: number;
  onClose: () => void;
  onRoll: (cost: number) => boolean;
  onServerReward: (rewards: GachaReward[]) => void;
}

function getGachaCost(epochId: EpochId): number {
  const idx = EPOCHS.findIndex(e => e.id === epochId);
  return 100 * Math.max(1, idx + 1);
}

const ROLL_STEPS = 18;
const ROLL_INTERVAL_MS = 60;

const ROLL_ICONS = ['🎁', '✨', '💎', '🏺', '👑', '⚔️', '☦️', '📜', '🪙', '🎭'];

export function GachaModal({
  epoch,
  currency,
  unlockedEpochs: _unlockedEpochs,
  artifactParts,
  completedArtifacts,
  artifactDupes,
  artifactLevels,
  prestigeLevel,
  onClose,
  onRoll,
  onServerReward,
}: GachaModalProps) {
  const [phase, setPhase] = useState<'ready' | 'rolling' | 'result' | 'error'>('ready');
  const [currentIcon, setCurrentIcon] = useState('🎁');
  const [rollStep, setRollStep] = useState(0);
  const [rewards, setRewards] = useState<GachaReward[]>([]);
  const [primaryReward, setPrimaryReward] = useState<GachaReward | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const pendingRewardsRef = useRef<GachaReward[] | null>(null);
  const onServerRewardRef = useRef(onServerReward);
  useEffect(() => { onServerRewardRef.current = onServerReward; });

  const availableArtifacts = useMemo(() => {
    return getArtifactsForEpoch(epoch.id, prestigeLevel);
  }, [epoch.id, prestigeLevel]);

  const hasArtifacts = availableArtifacts.length > 0;
  const gachaCost = getGachaCost(epoch.id);
  const canAfford = currency >= gachaCost;

  const handleRoll = useCallback(async () => {
    if (phase !== 'ready') return;
    if (!canAfford) return;
    if (!hasArtifacts) return;

    // Deduct currency optimistically
    if (!onRoll(gachaCost)) return;

    hapticImpact('medium');
    setRollStep(0);
    setRewards([]);
    setPrimaryReward(null);
    setErrorMessage('');
    setPhase('rolling');

    // Call server for the actual reward
    const telegramId = getTelegramUserId();
    if (!telegramId) {
      setErrorMessage('Помилка: немає Telegram ID');
      setPhase('error');
      return;
    }

    const epochIndex = EPOCHS.findIndex(e => e.id === epoch.id);
    const result = await rpcOpenChest(telegramId, epoch.id, 'daily', epochIndex);

    if (!result.ok || !result.rewards || result.rewards.length === 0) {
      setErrorMessage(result.error || 'Не вдалося відкрити скриню');
      setPhase('error');
      return;
    }

    pendingRewardsRef.current = result.rewards;
    setRewards(result.rewards);
    setPrimaryReward(result.rewards[0]);
  }, [phase, canAfford, hasArtifacts, onRoll, gachaCost, epoch.id]);

  // Animation effect — shows rolling then reveals server result
  useEffect(() => {
    if (phase !== 'rolling') return;

    let step = 0;

    const interval = setInterval(() => {
      step++;
      setCurrentIcon(ROLL_ICONS[Math.floor(Math.random() * ROLL_ICONS.length)]);
      setRollStep(step);
      hapticImpact('light');

      if (step >= ROLL_STEPS) {
        clearInterval(interval);

        const resultRewards = pendingRewardsRef.current;
        if (resultRewards && resultRewards.length > 0) {
          const primary = resultRewards[0];
          setCurrentIcon(primary.icon);
          onServerRewardRef.current(resultRewards);
        }

        setPhase('result');
        hapticNotification('success');
      }
    }, ROLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const getRarityStyle = (rarity: string) => {
    switch (rarity) {
      case 'secret':
        return { color: 'text-pink-400', glow: 'drop-shadow-[0_0_25px_rgba(236,72,153,0.6)]' };
      case 'legendary':
        return { color: 'text-yellow-400', glow: 'drop-shadow-[0_0_20px_rgba(234,179,8,0.5)]' };
      case 'epic':
        return { color: 'text-purple-400', glow: 'drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]' };
      case 'rare':
        return { color: 'text-blue-400', glow: 'drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]' };
      default:
        return { color: 'text-gray-300', glow: '' };
    }
  };

  const rarityLabels: Record<string, string> = {
    secret: 'Секретний',
    legendary: 'Легендарний',
    epic: 'Епічний',
    rare: 'Рідкісний',
    common: 'Звичайний',
  };

  const rarityBg: Record<string, string> = {
    secret: 'from-pink-900/60 to-purple-900/60 border-pink-500/60',
    legendary: 'from-yellow-900/60 to-amber-900/60 border-yellow-500/60',
    epic: 'from-purple-900/60 to-pink-900/60 border-purple-500/60',
    rare: 'from-blue-900/60 to-cyan-900/60 border-blue-500/60',
    common: 'from-gray-800/60 to-gray-700/60 border-gray-500/40',
  };

  const getArtifactProgress = (artifactId: string) => {
    const currentLevel = artifactLevels?.[artifactId] || 0;
    const currentParts = artifactParts?.[artifactId] || 0;

    if (currentLevel >= 4) {
      return { level: 4, parts: 0, max: 0, complete: true };
    }

    const partsForNextLevel = ARTIFACT_PARTS_PER_LEVEL[currentLevel + 1] || 20;
    return { level: currentLevel, parts: currentParts, max: partsForNextLevel, complete: false };
  };

  // Find the Artifact object from ARTIFACTS for a given reward
  const getArtifactById = (id: string): Artifact | undefined => {
    return ARTIFACTS.find(a => a.id === id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm">
      <div className="relative w-full max-w-sm mx-4 bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-700">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white z-10 transition-colors"
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div
          className={`text-center py-5 px-4 transition-all duration-500 ${
            phase === 'result' && primaryReward
              ? `bg-gradient-to-b ${rarityBg[primaryReward.rarity]}`
              : 'bg-gradient-to-b from-purple-900/50 to-gray-900'
          }`}
        >
          <h2 className="text-xl font-bold mb-1 text-white">
            {phase === 'result' ? 'Вітаю!' : phase === 'error' ? 'Помилка' : `Скриня: ${epoch.name.ua}`}
          </h2>
          <p className="text-gray-400 text-sm">
            {phase === 'ready' && `Вартість: ${gachaCost} ${epoch.currencyIcon}`}
            {phase === 'rolling' && 'Відкриваємо скриню...'}
            {phase === 'result' && (rewards.length > 1 ? `Знайдено ${rewards.length} артефактів!` : (primaryReward?.parts_granted ?? 0) > 1 ? 'Знайдено фрагменти!' : 'Знайдено фрагмент!')}
            {phase === 'error' && errorMessage}
          </p>
        </div>

        {/* Main content */}
        <div className="flex flex-col items-center justify-center py-8 px-4 min-h-[220px]">
          <div
            className={`text-8xl transition-all duration-300 select-none ${
              phase === 'rolling' ? 'animate-bounce' : ''
            } ${phase === 'result' && primaryReward ? getRarityStyle(primaryReward.rarity).glow + ' scale-125' : ''}`}
          >
            {phase === 'error' ? '❌' : currentIcon}
          </div>

          {phase === 'rolling' && (
            <div className="flex gap-2 mt-5">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all duration-100 ${
                    rollStep % 3 === i ? 'bg-yellow-400 w-6' : 'bg-yellow-400/30 w-2'
                  }`}
                />
              ))}
            </div>
          )}

          {phase === 'rolling' && (
            <div className="w-full mt-4 bg-gray-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-75"
                style={{ width: `${Math.min(100, (rollStep / ROLL_STEPS) * 100)}%` }}
              />
            </div>
          )}

          {phase === 'rolling' && (
            <div className="mt-3 flex items-center gap-2 text-gray-400 text-sm">
              <Loader2 size={14} className="animate-spin" />
              Сервер визначає нагороду...
            </div>
          )}

          {phase === 'result' && primaryReward && (
            <div className="mt-5 text-center w-full">
              <div className={`${getRarityStyle(primaryReward.rarity).color} text-xl font-bold mb-1`}>
                {primaryReward.name.ua}
              </div>
              <div className={`text-sm mb-3 font-medium ${getRarityStyle(primaryReward.rarity).color} opacity-70`}>
                {rarityLabels[primaryReward.rarity]}
              </div>

              <div className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium ${
                completedArtifacts.includes(primaryReward.id)
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-green-500/20 text-green-400'
              }`}>
                {completedArtifacts.includes(primaryReward.id) ? (
                  <><Zap size={14} /> Дублікат! +{primaryReward.parts_granted} фрагмент{primaryReward.parts_granted > 1 ? 'ів' : ''}</>
                ) : (
                  (() => {
                    const progress = getArtifactProgress(primaryReward.id);
                    const totalParts = progress.parts + primaryReward.parts_granted;
                    return <>{totalParts}/{progress.max} фрагмент{progress.max > 1 ? 'ів' : ''}</>;
                  })()
                )}
              </div>

              {/* Show bonus info for artifact */}
              {(() => {
                const art = getArtifactById(primaryReward.id);
                if (!art) return null;
                const baseBonus = art.bonus.value - 1;
                const dupeCount = completedArtifacts.includes(primaryReward.id)
                  ? (artifactDupes[primaryReward.id] || 0) + 1
                  : 0;
                const effectiveBonus = baseBonus + baseBonus * 0.1 * dupeCount;
                const label = art.bonus.type === 'xp_multiplier'
                  ? 'до XP' : art.bonus.type === 'currency_multiplier'
                  ? 'до валюти' : 'до пасивного';
                const basePct = (baseBonus * 100).toFixed(0);
                const totalPct = (effectiveBonus * 100).toFixed(0);
                return (
                  <div className="mt-3 text-sm font-semibold text-green-400">
                    {dupeCount > 0
                      ? `+${basePct}% → +${totalPct}% ${label}`
                      : `+${basePct}% ${label}`}
                  </div>
                );
              })()}

              {/* Additional rewards if multiple */}
              {rewards.length > 1 && (
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {rewards.slice(1).map((r, i) => (
                    <div key={i} className={`px-3 py-1.5 rounded-full text-xs font-medium ${getRarityStyle(r.rarity).color} bg-gray-800`}>
                      {r.icon} {r.name.ua} +{r.parts_granted}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* No artifacts message */}
          {phase === 'ready' && !hasArtifacts && (
            <div className="text-center text-yellow-400 text-sm mt-4">
              Для цієї епохи немає доступних артефактів
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 bg-gray-800/50 border-t border-gray-700">
          {phase === 'ready' && (
            <>
              <button
                onClick={handleRoll}
                disabled={!canAfford || !hasArtifacts}
                className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                  canAfford && hasArtifacts
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white active:scale-95 shadow-lg shadow-purple-900/40'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Sparkles size={20} />
                Відкрити скриню
              </button>
              {!canAfford && hasArtifacts && (
                <p className="text-center text-red-400 text-sm mt-2 font-medium">
                  Потрібно ще {gachaCost - Math.floor(currency)} {epoch.currencyIcon}
                </p>
              )}
              <div className="mt-3 text-center text-xs text-gray-500">
                Шанси: Звичайний 60% | Рідкісний 25% | Епічний 10% | Легендарний 4%{prestigeLevel >= 1 ? ' | Секретний 1%' : ''}
              </div>
            </>
          )}

          {phase === 'rolling' && (
            <div className="text-center text-gray-500 text-sm py-2">
              Зачекайте...
            </div>
          )}

          {phase === 'error' && (
            <button
              onClick={() => setPhase('ready')}
              className="w-full py-3 rounded-xl bg-gray-700 text-white font-medium hover:bg-gray-600 transition-all active:scale-95"
            >
              Спробувати знову
            </button>
          )}

          {phase === 'result' && (
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-gray-700 text-white font-medium hover:bg-gray-600 transition-all active:scale-95"
              >
                Закрити
              </button>
              <button
                onClick={() => {
                  setPhase('ready');
                  setRewards([]);
                  setPrimaryReward(null);
                  setCurrentIcon('🎁');
                }}
                disabled={currency < gachaCost || !hasArtifacts}
                className={`flex-1 py-3 rounded-xl font-medium transition-all active:scale-95 ${
                  currency >= gachaCost && hasArtifacts
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                Ще раз {currency >= gachaCost && hasArtifacts ? `(${gachaCost} ${epoch.currencyIcon})` : ''}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
