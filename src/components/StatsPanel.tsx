import { formatNumber } from '../lib/utils';
import { useTranslation } from '../i18n';

interface TapUpgradeProps {
  tapPower: number;
  effectiveTapPower: number;
  passiveXpPerSecond: number;
  cost: number;
  currency: number;
  epochIndex: number;
  onUpgrade: () => boolean;
}

export function TapUpgrade({ tapPower, effectiveTapPower, passiveXpPerSecond, cost, currency, onUpgrade }: TapUpgradeProps) {
  const { t } = useTranslation();
  const canAfford = currency >= cost;
  const isMaxed = cost === Number.MAX_SAFE_INTEGER;

  // Calculate what the effective power will be after upgrade
  // Effective = max(basePower * multipliers, passiveFloor)
  // When upgrading: basePower +1, and passive floor might also change
  const nextBasePower = tapPower + 1;
  // Rough estimate of next effective power (without knowing exact multipliers)
  const estimatedNextEffective = Math.max(
    effectiveTapPower + 1, // simplistic: each base power adds roughly 1 effective
    passiveXpPerSecond * 0.015 // passive floor stays same
  );

  return (
    <div
      className={`p-3 flex items-center gap-3 transition-colors border-b border-gray-700 ${
        canAfford && !isMaxed
          ? 'bg-gradient-to-r from-purple-900/80 to-pink-900/80 hover:from-purple-800/80 hover:to-pink-800/80 cursor-pointer'
          : 'bg-gray-900 opacity-60 cursor-not-allowed'
      }`}
      onClick={() => canAfford && !isMaxed && onUpgrade()}
    >
      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl">
        👆
      </div>

      <div className="flex-1">
        <div className="font-semibold text-white">{t('stats.upgrade_tap')}</div>
        <div className="text-xs text-gray-300">
          {isMaxed ? t('stats.max_level') : t('stats.power', { from: formatNumber(effectiveTapPower), to: formatNumber(estimatedNextEffective) })}
        </div>
        {passiveXpPerSecond > 0 && (
          <div className="text-xs text-blue-400 mt-0.5">
            {t('stats.base_passive', { base: nextBasePower, passive: formatNumber(Math.round(passiveXpPerSecond * 0.015)) })}
          </div>
        )}
      </div>

      <div className="text-right">
        {isMaxed ? (
          <div className="font-bold text-gray-500">MAX</div>
        ) : (
          <>
            <div className="font-bold text-yellow-400">{formatNumber(cost)}</div>
            <div className="text-xs text-gray-400">{t('stats.cost')}</div>
          </>
        )}
      </div>
    </div>
  );
}
