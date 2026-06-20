import { useState, useMemo, useEffect, useCallback } from 'react';
import { useGame } from './hooks/useGame';
import { useTranslation } from './i18n';
import { TapArea } from './components/TapArea';
import { GeneratorShop } from './components/GeneratorShop';
import { TapUpgrade } from './components/StatsPanel';
import { GachaModal } from './components/GachaModal';
import { ReferralsTab } from './components/ReferralsTab';
import { TutorialModal } from './components/TutorialModal';
import { DailyStreakModal } from './components/DailyStreakModal';
import { DailyRewards } from './components/DailyRewards';
import { DailyTasksPanel } from './components/DailyTasksPanel';
import { AdsGramButton } from './components/AdsGramButton';
import { PrestigeButton, MuseumLaboratory } from './components/PrestigeSystem';
import { SessionAdModal, ChestAdModal, EnergyRestoreAdButton, useSessionAdTrigger, useChestAdTrigger } from './components/AdSystem';
import { OfflineRewardModal } from './components/OfflineRewardModal';
import { ExpeditionApp } from './expedition/ExpeditionApp';
import { AcademyUnlockModal } from './components/AcademyUnlockModal';
import { EPOCHS, ARTIFACTS, getEpochById } from './data/epochs';
import { initTelegramMiniApp, hapticImpact, hapticNotification, getTelegramWebApp, getTelegramUserId } from './lib/telegram';
import { rpcTrackSession } from './lib/rpc';
import { supabase } from './lib/supabase';
import { Crown, ShoppingBag, Trophy, Gift, Loader2, Users, X, Shield, Zap, Star, ChevronRight, Wifi, RefreshCw, Timer, AlertTriangle, Battery, BatteryLow, Globe } from 'lucide-react';
import type { EpochId } from './types/game';
import { formatNumber } from './lib/utils';
import { getTodayDateStr } from './data/tasks';

type Tab = 'shop' | 'epochs' | 'artifacts' | 'referrals' | 'stats' | 'boosters';

function App() {
  const {
    state,
    epoch,
    tapEvents,
    tap,
    buyGenerator,
    upgradeTapPower,
    switchEpoch,
    tapPowerCost,
    processServerRewards,
    upgradeArtifactLevel,
    deductGachaCost,
    recordGachaOpen,
    claimDailyTask,
    isLoading,
    telegramId,
    leaderboard,
    userRank,
    leaderboardLoading,
    loadLeaderboard,
    artifactMultipliers,
    boosterMultipliers,
    refreshBoosters,
    offlineGains,
    dismissOfflineGains,
    duplicateTab,
    streakModal,
    dismissStreakModal,
    syncStatus,
    connectionError,
    dismissConnectionError,
    showDailyRewards,
    claimDailyReward,
    skipDailyRewards,
    // Prestige System
    canPrestige,
    performPrestige,
    buyPrestigeUpgrade,
    // Energy System
    getEnergyMultiplier,
  } = useGame();

  const [activeTab, setActiveTab] = useState<Tab>('shop');
  const [showGacha, setShowGacha] = useState(false);
  const [showEpochModal, setShowEpochModal] = useState(false);
  const [showError, setShowError] = useState<string | null>(null);
  const [purchasingBooster, setPurchasingBooster] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);

  // Academy Unlock Modal - show once when prestigeLevel === 2
  const isAcademyUnlocked = (state.prestigeLevel || 0) >= 2;
  const hasSeenAcademyUnlock = localStorage.getItem('academy_unlock_seen') === 'true';
  const [showAcademyUnlock, setShowAcademyUnlock] = useState(false);
  const [academyModalShown, setAcademyModalShown] = useState(false);

  // Show unlock modal on first visit after prestigeLevel >= 2
  useEffect(() => {
    if (isAcademyUnlocked && !academyModalShown && !hasSeenAcademyUnlock) {
      setShowAcademyUnlock(true);
      setAcademyModalShown(true);
    }
  }, [isAcademyUnlocked, academyModalShown, hasSeenAcademyUnlock]);

  const handleAcademyUnlockClose = () => {
    setShowAcademyUnlock(false);
    localStorage.setItem('academy_unlock_seen', 'true');
  };

  // i18n
  const { locale, toggleLocale, t } = useTranslation();
  
  // Translation helper for static strings
  const tr = (key: string, params?: Record<string, string | number>) => t(key as never, params as never);

  // Session Ad hook - triggers after 20 min of play
  const { shouldShowSessionAd, dismissSessionAd } = useSessionAdTrigger(
    state.level,
    state.sessionStartAt || Date.now(),
    state.lastOnlineAt
  );

  // Chest Ad hook - triggers every 10th chest
  const {
    shouldShowChestAd,
    totalChestsOpened,
    recordChestOpened,
    dismissChestAd
  } = useChestAdTrigger();

  // Daily energy ads tracking
  const today = getTodayDateStr();
  const dailyAdViews = state.dailyAdViews || {};
  const energyAdsUsed = (dailyAdViews.last_reset === today) ? (dailyAdViews.energy_ads || 0) : 0;
  const offlineAdsUsed = (dailyAdViews.last_reset === today) ? (dailyAdViews.offline_ads || 0) : 0;
  const offlineAdsRemaining = 3 - offlineAdsUsed;

  useEffect(() => {
    const tg = initTelegramMiniApp();
    if (tg) {
      console.log('Telegram WebApp initialized', tg.version, 'User:', tg.initDataUnsafe?.user?.id);
    }

    // Show tutorial for new players
    const tutorialSeen = localStorage.getItem('tutorial_seen');
    if (!tutorialSeen) {
      setShowTutorial(true);
    }

    // Session tracking
    const userId = getTelegramUserId();
    if (userId) {
      rpcTrackSession(userId, 'start');

      // Activity ping every 60 seconds
      const activityInterval = setInterval(() => {
        rpcTrackSession(userId, 'activity');
      }, 60_000);

      // Track visibility changes (app open/close in Telegram)
      const handleVisibilityChange = () => {
        if (document.hidden) {
          rpcTrackSession(userId, 'end');
        } else {
          rpcTrackSession(userId, 'start');
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      // End session on unload
      const handleUnload = () => {
        navigator.sendBeacon?.(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-session`,
          JSON.stringify({ telegram_id: userId, event: 'end' })
        );
      };
      window.addEventListener('beforeunload', handleUnload);

      return () => {
        clearInterval(activityInterval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('beforeunload', handleUnload);
        rpcTrackSession(userId, 'end');
      };
    }
  }, []);

  const ownedLevels = useMemo(() => {
    const map = new Map<string, number>();
    state.ownedGenerators.forEach(og => {
      map.set(og.generatorId, og.level);
    });
    return map;
  }, [state.ownedGenerators]);

  const handleBuy = (generatorId: string): boolean => {
    const ok = buyGenerator(generatorId);
    if (ok) hapticNotification('success');
    return ok;
  };

  const handleUpgradeTap = (): boolean => {
    const ok = upgradeTapPower();
    if (ok) hapticNotification('success');
    return ok;
  };

  const completedArtifacts = state.completedArtifacts?.length || 0;
  // Energy multiplier (x5 if energy > 0 and prestige >= 1)
  const energyMultiplier = getEnergyMultiplier ? getEnergyMultiplier() : 1;

  // Prestige research XP bonus
  const prestigeXpBonus = 1 + ((state.prestigeResearch?.xp_gain || 0) * 0.05);

  const effectiveTapPower = Math.max(
    1,
    Math.round(state.tapPower * artifactMultipliers.xp * boosterMultipliers.xp * energyMultiplier * prestigeXpBonus),
    Math.round(state.passiveXpPerSecond * 0.015),
  );

  // Telegram Stars purchase — real implementation
  const handleBuyBooster = useCallback(async (booster: { id: string; name: string; price: number }) => {
    const tg = getTelegramWebApp();
    if (!tg) {
      setShowError(tr('error.telegram_stars_app_only'));
      return;
    }
    if (!telegramId) {
      setShowError(tr('error.login_telegram'));
      return;
    }
    if (!supabase) {
      setShowError(tr('error.no_connection'));
      return;
    }

    setPurchasingBooster(booster.id);
    hapticImpact('medium');

    try {
      if (!supabase) {
        setShowError(tr('error.supabase_not_connected'));
        setPurchasingBooster(null);
        return;
      }

      const { data, error } = await supabase.functions.invoke('telegram-payments', {
        body: { action: 'create_invoice', booster_id: booster.id, telegram_id: telegramId },
      });

      if (error || !data?.invoice_url) {
        const msg = data?.error ?? error?.message ?? tr('error.create_bill_failed');
        setShowError(msg);
        setPurchasingBooster(null);
        return;
      }

      // Open Telegram native invoice UI
      tg.openInvoice(data.invoice_url, async (status) => {
        setPurchasingBooster(null);
        if (status === 'paid') {
          hapticNotification('success');
          // Wait briefly for webhook to deliver, then refresh boosters
          setTimeout(() => refreshBoosters(), 2000);
        } else if (status === 'failed') {
          hapticNotification('error');
          setShowError(tr('error.payment_failed'));
        }
      });
    } catch (e) {
      console.error('handleBuyBooster error:', e);
      setShowError(tr('error.open_bill_failed'));
      setPurchasingBooster(null);
    }
  }, [telegramId, refreshBoosters]);

  const handleEpochSwitch = (epochId: EpochId) => {
    if (state.unlockedEpochs.includes(epochId)) {
      switchEpoch(epochId);
      hapticNotification('success');
      setShowEpochModal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-950 text-white">
        <Loader2 className="w-12 h-12 animate-spin text-yellow-400 mb-4" />
        <p className="text-lg">{tr('common.loading')}</p>
        {telegramId && (
          <p className="text-xs text-gray-500 mt-2">{tr('app.telegram_id', { id: telegramId })}</p>
        )}
      </div>
    );
  }

  // After the 2nd rebirth (prestige), show Academy Unlock modal first time
  if ((state.prestigeLevel || 0) >= 2) {
    // Show unlock modal on first visit (modal overlays ExpeditionApp)
    if (showAcademyUnlock) {
      return (
        <>
          <ExpeditionApp />
          <AcademyUnlockModal isOpen={showAcademyUnlock} onClose={handleAcademyUnlockClose} />
        </>
      );
    }
    // After modal dismissed, show ExpeditionApp
    return <ExpeditionApp />;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white overflow-hidden">
      {/* Error Toast */}
      {showError && (
        <div className="fixed top-2 left-2 right-2 z-50 bg-red-900/90 border border-red-500 rounded-xl p-3 flex items-center gap-3 shadow-lg">
          <Shield className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-sm flex-1">{showError}</p>
          <button onClick={() => setShowError(null)} className="p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Connection Error Toast — auto-dismisses when connection recovers */}
      {connectionError && !showError && (
        <div className="fixed top-2 left-2 right-2 z-50 bg-amber-900/90 border border-amber-500 rounded-xl p-3 flex items-center gap-3 shadow-lg">
          <Wifi className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-sm flex-1">{connectionError}</p>
          <button onClick={dismissConnectionError} className="p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Offline gains modal with x2 ad option */}
      {offlineGains && !showError && !duplicateTab && (
        <OfflineRewardModal
          offlineGains={offlineGains}
          currencyIcon={epoch.currencyIcon}
          onClaim={async (watchAd) => {
            if (watchAd) {
              // Call claim-ad-reward Edge Function for x2
              try {
                const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/claim-ad-reward`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    telegram_id: telegramId,
                    reward_type: 'offline_x2',
                  }),
                });
                const data = await response.json();
                if (data.success) {
                  // Double the gains (client-side update)
                  // The server handles the daily limit enforcement
                }
              } catch (err) {
                console.error('Failed to claim offline x2:', err);
              }
            }
            dismissOfflineGains();
          }}
          onDismiss={dismissOfflineGains}
          canWatchAd={(state.prestigeLevel || 0) >= 1 && offlineAdsRemaining > 0}
          adsRemaining={offlineAdsRemaining}
        />
      )}

      {/* Duplicate tab warning */}
      {duplicateTab && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full text-center border border-yellow-500/40">
            <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">{t('duplicate_tab.title')}</h3>
            <p className="text-sm text-gray-400 mb-4">
              {t('duplicate_tab.description')}
            </p>
            <div className="space-y-2">
              <button
                onClick={() => window.close()}
                className="w-full py-3 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition-colors"
              >
                {t('duplicate_tab.close_tab')}
              </button>
              <button
                onClick={() => {
                  localStorage.setItem('game_active_tab', `tab_${Date.now()}_takeover`);
                }}
                className="w-full py-2.5 bg-gray-700 text-gray-200 rounded-xl hover:bg-gray-600 transition-colors text-sm"
              >
                {t('duplicate_tab.play_anyway')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header with epoch selector */}
      <div
        className="px-3 py-2 flex items-center justify-between border-b border-white/10"
        style={{ background: epoch.bgGradient }}
      >
        <button
          onClick={() => setShowEpochModal(true)}
          className="flex items-center gap-2 py-1.5 px-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
        >
          <span className="text-xl">{epoch.currencyIcon}</span>
          <div className="text-left">
            <div className="text-xs font-medium">{locale === 'uk' ? epoch.name.ua : epoch.name.en}</div>
            <div className="text-[10px] opacity-70">{t('common.level')} {state.level}</div>
          </div>
          <ChevronRight className="w-4 h-4 opacity-50" />
        </button>

        <div className="flex items-center gap-2">
          {/* Energy display (only for Prestige 1+) */}
          {(state.prestigeLevel || 0) >= 1 && (
            <div className={`bg-white/10 rounded-xl px-2 py-1.5 flex items-center gap-1 ${
              (state.energy || 0) > 0 ? 'text-green-400' : 'text-gray-400'
            }`}>
              {(state.energy || 0) > 0 ? (
                <Battery className="w-4 h-4" />
              ) : (
                <BatteryLow className="w-4 h-4" />
              )}
              <span className="text-xs font-bold">{state.energy || 0}/{state.maxEnergy || 100}</span>
            </div>
          )}
          {/* Currency display */}
          <div className="bg-white/10 rounded-xl px-3 py-1.5">
            <span className="text-sm font-bold">{epoch.currencyIcon} {formatNumber(state.currency)}</span>
          </div>
          {/* Prestige badge */}
          {(state.prestigeLevel || 0) > 0 && (
            <div className="bg-yellow-500/20 rounded-xl px-2 py-1.5 flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-bold text-yellow-400">{state.prestigeLevel}</span>
            </div>
          )}
          {/* Sync status */}
          <div className="flex items-center gap-1 text-xs opacity-60">
            {syncStatus === 'synced' && <Wifi className="w-3 h-3 text-green-400" />}
            {syncStatus === 'syncing' && <RefreshCw className="w-3 h-3 text-yellow-400 animate-spin" />}
            {syncStatus === 'offline' && <Wifi className="w-3 h-3 text-gray-500" />}
            {syncStatus === 'error' && <Wifi className="w-3 h-3 text-red-400" />}
          </div>
          {/* Language toggle */}
          <button
            onClick={toggleLocale}
            className="flex items-center gap-1 text-xs px-2 py-1 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            title={locale === 'uk' ? 'Switch to English' : 'Перейти на українську'}
          >
            <Globe className="w-4 h-4" />
            <span className="font-medium">{locale.toUpperCase()}</span>
          </button>
        </div>
      </div>

      <TapArea
        epoch={epoch}
        onTap={(x, y) => { tap(x, y); hapticImpact('light'); }}
        tapEvents={tapEvents}
        tapPower={effectiveTapPower}
        level={state.level}
        xp={state.xp}
        xpToNextLevel={state.xpToNextLevel}
        passiveXp={state.passiveXpPerSecond}
        currency={state.currency}
        currencyIcon={epoch.currencyIcon}
        topOffset={0}
      />

      <div className="bg-gray-900 border-t border-gray-700 flex flex-col flex-1 min-h-0">
        {/* Tab Bar */}
        <div className="flex border-b border-gray-700 shrink-0 overflow-x-auto">
          <TabButton active={activeTab === 'shop'} onClick={() => setActiveTab('shop')} icon={<ShoppingBag size={18} />} label={t('app.shop')} />
          <TabButton active={activeTab === 'epochs'} onClick={() => setActiveTab('epochs')} icon={<Crown size={18} />} label={t('app.epochs')} badge={state.unlockedEpochs.length} />
          <TabButton active={activeTab === 'artifacts'} onClick={() => setActiveTab('artifacts')} icon={<Gift size={18} />} label={t('app.artifacts')} badge={completedArtifacts} />
          <TabButton active={activeTab === 'boosters'} onClick={() => setActiveTab('boosters')} icon={<Zap size={18} />} label={t('app.boosters')} />
          <TabButton active={activeTab === 'referrals'} onClick={() => setActiveTab('referrals')} icon={<Users size={18} />} label={t('app.referrals')} badge={state.referralsCount || undefined} />
          <TabButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} icon={<Trophy size={18} />} label={t('app.stats')} />
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {activeTab === 'shop' && (
            <div>
              <DailyTasksPanel
                dailyStreak={state.dailyStreak}
                bestStreak={state.bestStreak}
                dailyTasksState={state.dailyTasksState}
                currencyIcon={epoch.currencyIcon}
                checkInStreak={state.checkInStreak}
                lastCheckIn={state.lastCheckIn}
                onClaimTask={claimDailyTask}
              />
              <TapUpgrade
                tapPower={state.tapPower}
                effectiveTapPower={effectiveTapPower}
                passiveXpPerSecond={state.passiveXpPerSecond}
                cost={tapPowerCost}
                currency={state.currency}
                epochIndex={EPOCHS.findIndex(e => e.id === state.epochId)}
                onUpgrade={handleUpgradeTap}
              />
              <GeneratorShop
                epoch={epoch}
                currency={state.currency}
                ownedLevels={ownedLevels}
                onBuy={handleBuy}
              />
            </div>
          )}

          {activeTab === 'epochs' && (
            <div className="p-3">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-lg">{tr('app.epochs_title')}</h3>
                <span className="text-xs text-gray-400">{state.unlockedEpochs.length}/12</span>
              </div>

              {/* Current epoch card */}
              <div
                className="p-4 rounded-2xl mb-4 border-2"
                style={{
                  background: epoch.bgGradient,
                  borderColor: 'rgba(255,255,255,0.3)'
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{epoch.currencyIcon}</span>
                  <div className="flex-1">
                    <div className="font-bold text-lg">{epoch.name.ua}</div>
                    <div className="text-xs opacity-80">{epoch.period.ua}</div>
                    <div className="mt-1 text-sm">
                      {tr('app.level')} {state.level} / {epoch.levelRange.max}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs opacity-70">{tr('app.progress')}</div>
                    <div className="text-lg font-bold">
                      {Math.round(((state.level - epoch.levelRange.min + 1) / (epoch.levelRange.max - epoch.levelRange.min + 1)) * 100)}%
                    </div>
                  </div>
                </div>
                <div className="w-full bg-black/30 rounded-full h-2 overflow-hidden mt-3">
                  <div
                    className="h-full bg-white/80 transition-all"
                    style={{ width: `${Math.min(100, ((state.level - epoch.levelRange.min + 1) / (epoch.levelRange.max - epoch.levelRange.min + 1)) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Unlocked epochs - clickable to switch */}
              <h4 className="text-sm font-medium text-gray-400 mb-2">{tr('app.unlocked_epochs')}</h4>
              <div className="space-y-2">
                {state.unlockedEpochs.map(epochId => {
                  const e = getEpochById(epochId);
                  const isCurrent = e.id === epoch.id;
                  return (
                    <button
                      key={e.id}
                      onClick={() => handleEpochSwitch(e.id)}
                      className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${
                        isCurrent
                          ? 'bg-yellow-500/20 border border-yellow-500'
                          : 'bg-gray-800 hover:bg-gray-700'
                      }`}
                    >
                      <span className="text-2xl">{e.currencyIcon}</span>
                      <div className="flex-1 text-left">
                        <div className="font-medium">{e.name.ua}</div>
                        <div className="text-xs text-gray-400">{e.period.ua}</div>
                      </div>
                      {isCurrent && (
                        <span className="text-xs bg-yellow-500 text-black px-2 py-0.5 rounded-full font-medium">
                          {tr('app.active')}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Locked epochs */}
              <h4 className="text-sm font-medium text-gray-400 mb-2 mt-4">{tr('app.locked_epochs')}</h4>
              <div className="space-y-2">
                {EPOCHS.filter(e => !state.unlockedEpochs.includes(e.id)).map(e => {
                  const progress = state.level >= e.unlockLevel - 10
                    ? ((state.level - (e.unlockLevel - 10)) / 10) * 100
                    : 0;
                  return (
                    <div
                      key={e.id}
                      className="p-3 rounded-xl bg-gray-800/50 opacity-70 flex items-center gap-3"
                    >
                      <span className="text-2xl grayscale">{e.currencyIcon}</span>
                      <div className="flex-1">
                        <div className="font-medium">{e.name.ua}</div>
                        <div className="text-xs text-gray-500">
                          {state.level >= e.unlockLevel - 10
                            ? tr('app.levels_remaining', { count: e.unlockLevel - state.level })
                            : tr('app.unlocks_at_level', { level: e.unlockLevel })
                          }
                        </div>
                        {progress > 0 && (
                          <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden mt-1">
                            <div
                              className="h-full bg-gray-500 transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'artifacts' && (
            <div className="p-3">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-lg">{tr('app.artifacts')}</h3>
                <button
                  onClick={() => setShowGacha(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:from-purple-500 hover:to-pink-500 transition-all active:scale-95"
                >
                  {tr('app.open_chest')}
                </button>
              </div>

              {/* Active artifact bonuses */}
              {completedArtifacts > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 mb-3 flex flex-wrap gap-3">
                  {artifactMultipliers.xp > 1 && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-yellow-400 font-semibold">XP x{artifactMultipliers.xp.toFixed(2)}</span>
                    </div>
                  )}
                  {artifactMultipliers.currency > 1 && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-green-400 font-semibold">{tr('app.currency_multiplier', { multiplier: artifactMultipliers.currency.toFixed(2) })}</span>
                    </div>
                  )}
                  {artifactMultipliers.passive > 1 && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-blue-400 font-semibold">{tr('app.passive_multiplier', { multiplier: artifactMultipliers.passive.toFixed(2) })}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Gacha info */}
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3 mb-4">
                <div className="flex items-center gap-2 text-purple-400 text-sm font-medium mb-2">
                  <Gift className="w-4 h-4" />
                  {tr('app.artifact_chest')}
                </div>
                <p className="text-xs text-gray-400">
                  {tr('app.chest_open_cost', { cost: 100 * (EPOCHS.findIndex(e => e.id === epoch.id) + 1), icon: epoch.currencyIcon })}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {tr('app.chest_odds')}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {ARTIFACTS.filter(artifact => {
                  // Check epoch visibility
                  const isCurrentEpoch = artifact.epoch === state.epochId;
                  const isUnlockedEpoch = state.unlockedEpochs.includes(artifact.epoch);

                  // Non-secret artifacts: show for unlocked epochs
                  if (!artifact.requiredPrestige || artifact.requiredPrestige === 0) {
                    return isUnlockedEpoch || isCurrentEpoch;
                  }

                  // Secret artifacts: ONLY show for CURRENT epoch, with required prestige
                  if (!isCurrentEpoch) return false;

                  const hasRequiredPrestige = (state.prestigeLevel || 0) >= artifact.requiredPrestige;
                  if (!hasRequiredPrestige) return false;

                  // Must have discovered it (has parts or completed)
                  const hasParts = (state.artifactParts?.[artifact.id] || 0) > 0;
                  const isComplete = state.completedArtifacts?.includes(artifact.id);

                  return hasParts || isComplete;
                }).map(artifact => {
                  const isUnlocked = state.unlockedEpochs.includes(artifact.epoch) ||
                    artifact.epoch === state.epochId;
                  const parts = state.artifactParts?.[artifact.id] || 0;
                  const isComplete = state.completedArtifacts?.includes(artifact.id);
                  const artifactEpoch = EPOCHS.find(e => e.id === artifact.epoch);
                  const artifactLevel = state.artifactLevels?.[artifact.id] || 1;

                  // Calculate parts required for next level using ARTIFACT_PARTS_PER_LEVEL
                  const partsForNextLevel = artifactLevel < 4
                    ? (artifactLevel === 1 ? 10 : artifactLevel === 2 ? 10 : artifactLevel === 3 ? 15 : 20)
                    : 0;

                  return (
                    <div
                      key={artifact.id}
                      className={`p-3 rounded-xl transition-all ${
                        isComplete
                          ? 'bg-gradient-to-br from-yellow-600/30 to-amber-600/30 border border-yellow-500'
                          : isUnlocked
                          ? 'bg-gray-800 hover:bg-gray-700'
                          : 'bg-gray-900 opacity-40'
                      }`}
                    >
                      <div className="text-2xl sm:text-3xl mb-1">{isUnlocked ? artifact.icon : '?'}</div>
                      <div className="text-xs font-medium truncate">
                        {isUnlocked ? artifact.name.ua : '???'}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {isUnlocked && artifactEpoch ? artifactEpoch.name.ua : '???'}
                      </div>
                      <div className={`text-xs ${
                        artifact.rarity === 'secret' ? 'text-rose-400' :
                        artifact.rarity === 'legendary' ? 'text-yellow-400' :
                        artifact.rarity === 'epic' ? 'text-purple-400' :
                        artifact.rarity === 'rare' ? 'text-blue-400' : 'text-gray-400'
                      }`}>
                        {artifact.rarity === 'secret' ? tr('artifact.secret') :
                         artifact.rarity === 'legendary' ? tr('artifact.legendary') :
                         artifact.rarity === 'epic' ? tr('artifact.epic') :
                         artifact.rarity === 'rare' ? tr('artifact.rare') : tr('artifact.common')}
                        {isComplete && (
                          <span className="text-amber-400 ml-1">{tr('app.level', { level: artifactLevel })}</span>
                        )}
                      </div>
                      {!isComplete && isUnlocked && (
                        <div className="mt-1">
                          <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                            <div className="h-full bg-green-500" style={{ width: `${Math.min(100, (parts / artifact.parts) * 100)}%` }} />
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">{parts}/{artifact.parts}</div>
                        </div>
                      )}
                      {isComplete && (
                        <div className="text-xs text-green-400 mt-1">
                          +{((artifact.bonus.value - 1) * 100).toFixed(0)}%{' '}
                          {artifact.bonus.type === 'xp_multiplier' ? 'XP' :
                           artifact.bonus.type === 'currency_multiplier' ? tr('booster_type.currency') : tr('booster_type.passive')}
                        </div>
                      )}
                      {/* Artifact upgrade UI - show for completed artifacts level 1-3 */}
                      {isComplete && artifactLevel >= 1 && artifactLevel < 4 && (
                        <div className="mt-2">
                          <button
                            onClick={() => {
                              if (parts >= partsForNextLevel) {
                                upgradeArtifactLevel(artifact.id);
                                hapticNotification('success');
                              }
                            }}
                            disabled={parts < partsForNextLevel}
                            className={`w-full text-xs py-1.5 px-2 rounded font-medium ${
                              parts >= partsForNextLevel
                                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white'
                                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            {parts >= partsForNextLevel
                              ? tr('app.upgrade_to_level', { level: artifactLevel + 1 })
                              : tr('app.fragments', { current: parts, total: partsForNextLevel })
                            }
                          </button>
                        </div>
                      )}
                      {/* Max level indicator */}
                      {isComplete && artifactLevel >= 4 && (
                        <div className="mt-1 text-xs text-amber-400 font-medium">
                          {tr('app.max_level')}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'boosters' && (
            <div className="p-3">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-yellow-400" />
                <h3 className="font-bold text-lg">{tr('app.boosters')}</h3>
              </div>

              {/* Free AdsGram XP Boost */}
              <div className="mb-4">
                <AdsGramButton
                  activeBoosters={state.activeBoosters || {}}
                  onBoostActivated={refreshBoosters}
                />
              </div>

              {/* Energy Restore Ad (Prestige 1+ only) */}
              {(state.prestigeLevel || 0) >= 1 && (
                <div className="mb-4">
                  <EnergyRestoreAdButton
                    currentEnergy={state.energy || 0}
                    maxEnergy={state.maxEnergy || 100}
                    prestigeLevel={state.prestigeLevel || 0}
                    dailyEnergyAdsUsed={energyAdsUsed}
                    onEnergyRestored={() => {
                      hapticNotification('success');
                      // Energy is handled by state update
                    }}
                    onAdUsed={() => {
                      // Track daily ad usage
                    }}
                  />
                </div>
              )}

              {/* Active boosters status */}
              {(boosterMultipliers.xp > 1 || boosterMultipliers.currency > 1) && (
                <div className="bg-green-500/10 border border-green-500/40 rounded-xl p-3 mb-4">
                  <div className="flex items-center gap-2 text-green-400 text-sm font-semibold mb-2">
                    <Zap className="w-4 h-4" />
                    {tr('app.active_boosters')}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {boosterMultipliers.xp > 1 && (
                      <ActiveBoosterBadge
                        label={`XP x${boosterMultipliers.xp}`}
                        endTime={state.activeBoosters?.super_boost_end ?? state.activeBoosters?.xp_boost_end ?? null}
                        color="text-yellow-400"
                      />
                    )}
                    {boosterMultipliers.currency > 1 && (
                      <ActiveBoosterBadge
                        label={t('app.currency_multiplier', { multiplier: boosterMultipliers.currency })}
                        endTime={state.activeBoosters?.super_boost_end ?? state.activeBoosters?.currency_boost_end ?? null}
                        color="text-green-400"
                      />
                    )}
                  </div>
                </div>
              )}

              {state.activeBoosters?.legendary_next_gacha && (
                <div className="bg-yellow-500/10 border border-yellow-500/40 rounded-xl p-3 mb-4 flex items-center gap-2">
                  <span className="text-xl">🎁</span>
                  <div>
                    <div className="text-sm font-semibold text-yellow-400">{tr('app.legendary_guaranteed')}</div>
                    <div className="text-xs text-gray-400">{tr('app.legendary_guaranteed_desc')}</div>
                  </div>
                </div>
              )}

              {/* Prestige System - Museum Laboratory */}
              <div className="mb-4">
                <MuseumLaboratory
                  prestigeLevel={state.prestigeLevel || 0}
                  prestigePoints={state.prestigePoints || 0}
                  prestigeResearch={state.prestigeResearch || {}}
                  onBuyUpgrade={buyPrestigeUpgrade}
                />
              </div>

              {/* Prestige Button */}
              <div className="mb-4">
                <PrestigeButton
                  level={state.level}
                  epochId={state.epochId}
                  prestigeLevel={state.prestigeLevel || 0}
                  prestigePoints={state.prestigePoints || 0}
                  canPrestige={canPrestige || false}
                  onPrestige={performPrestige}
                />
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 mb-4">
                <div className="flex items-center gap-2 text-yellow-400 text-sm font-medium mb-1">
                  <Star className="w-4 h-4" />
                  {tr('boosters_shop.telegram_stars_real_payment')}
                </div>
                <p className="text-xs text-gray-400">
                  {tr('boosters_shop.telegram_stars_desc')}
                </p>
              </div>

              <div className="space-y-3">
                <BoosterCard
                  icon="⚡"
                  name={tr('boosters_shop.xp_booster_x2.name')}
                  description={tr('boosters_shop.xp_booster_x2.description')}
                  price={50}
                  loading={purchasingBooster === 'xp_boost_1h'}
                  onBuy={() => handleBuyBooster({ id: 'xp_boost_1h', name: tr('boosters_shop.xp_booster_x2.name'), price: 50 })}
                />
                <BoosterCard
                  icon="💰"
                  name={tr('boosters_shop.currency_booster_x2.name')}
                  description={tr('boosters_shop.currency_booster_x2.description')}
                  price={50}
                  loading={purchasingBooster === 'currency_boost_1h'}
                  onBuy={() => handleBuyBooster({ id: 'currency_boost_1h', name: tr('boosters_shop.currency_booster_x2.name'), price: 50 })}
                />
                <BoosterCard
                  icon="🔥"
                  name={tr('boosters_shop.super_booster_x3.name')}
                  description={tr('boosters_shop.super_booster_x3.description')}
                  price={100}
                  loading={purchasingBooster === 'super_boost_30m'}
                  onBuy={() => handleBuyBooster({ id: 'super_boost_30m', name: tr('boosters_shop.super_booster_x3.name'), price: 100 })}
                />
                <BoosterCard
                  icon="🎁"
                  name={tr('boosters_shop.guaranteed_legendary.name')}
                  description={tr('boosters_shop.guaranteed_legendary.description')}
                  price={200}
                  loading={purchasingBooster === 'legendary_gacha'}
                  onBuy={() => handleBuyBooster({ id: 'legendary_gacha', name: tr('boosters_shop.guaranteed_legendary.name'), price: 200 })}
                />

                {/* Phase 2: New Prestige-related products */}
                <div className="border-t border-gray-700 pt-3 mt-3">
                  <div className="text-xs text-purple-400 font-medium mb-2">{tr('app.premium_upgrades')}</div>
                </div>

                <BoosterCard
                  icon="🏛️"
                  name={tr('boosters_shop.big_patron.name')}
                  description={tr('boosters_shop.big_patron.description')}
                  price={25}
                  loading={purchasingBooster === 'great_patron'}
                  onBuy={() => handleBuyBooster({ id: 'great_patron', name: tr('boosters_shop.big_patron.name'), price: 25 })}
                />
                <BoosterCard
                  icon="📚"
                  name={tr('boosters_shop.professor_archaeology.name')}
                  description={tr('boosters_shop.professor_archaeology.description')}
                  price={39}
                  loading={purchasingBooster === 'professor'}
                  onBuy={() => handleBuyBooster({ id: 'professor', name: tr('boosters_shop.professor_archaeology.name'), price: 39 })}
                />
                <BoosterCard
                  icon="🗺️"
                  name={tr('boosters_shop.secret_expedition.name')}
                  description={tr('boosters_shop.secret_expedition.description')}
                  price={45}
                  loading={purchasingBooster === 'secret_expedition'}
                  onBuy={() => handleBuyBooster({ id: 'secret_expedition', name: tr('boosters_shop.secret_expedition.name'), price: 45 })}
                />
                <BoosterCard
                  icon="🏆"
                  name={tr('boosters_shop.support_developers.name')}
                  description={tr('boosters_shop.support_developers.description')}
                  price={500}
                  loading={purchasingBooster === 'support_dev'}
                  onBuy={() => handleBuyBooster({ id: 'support_dev', name: tr('boosters_shop.support_developers.name'), price: 500 })}
                />
              </div>

              <div className="mt-4 p-3 bg-gray-800/60 rounded-xl">
                <p className="text-xs text-gray-500 text-center">
                  {tr('boosters_shop.payment_note')}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'referrals' && (
            <ReferralsTab
              telegramId={telegramId}
              referralsCount={state.referralsCount}
              referralEarnings={state.referralEarnings}
              currencyIcon={epoch.currencyIcon}
              leaderboard={leaderboard}
              userRank={userRank}
              leaderboardLoading={leaderboardLoading}
              onLoadLeaderboard={loadLeaderboard}
            />
          )}

          {activeTab === 'stats' && (
            <div className="p-3 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <StatCard label={tr('app.total_xp')} value={formatNumber(state.totalXp)} />
                <StatCard label={tr('prestige.level')} value={state.level.toString()} />
                <StatCard label={tr('app.passive_xp_sec')} value={formatNumber(state.passiveXpPerSecond)} />
                <StatCard label={tr('app.tap_power')} value={`${effectiveTapPower} XP`} />
                <StatCard label={tr('app.currency')} value={`${formatNumber(state.currency)} ${epoch.currencyIcon}`} />
                <StatCard label={tr('prestige.generators')} value={state.ownedGenerators.length.toString()} />
                <StatCard label={tr('app.streak')} value={`${state.dailyStreak} ${t('app.days', { count: state.dailyStreak })}`} />
                <StatCard label={tr('app.record_streak')} value={`${state.bestStreak} ${t('app.days', { count: state.bestStreak })}`} />
              </div>

              {/* Artifact multipliers summary */}
              {completedArtifacts > 0 && (
                <div className="bg-gray-800 rounded-xl p-3">
                  <h4 className="font-semibold mb-2 text-sm text-yellow-400">{tr('app.artifact_bonuses')}</h4>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-gray-700 rounded-lg p-2">
                      <div className="text-yellow-400 font-bold">x{artifactMultipliers.xp.toFixed(2)}</div>
                      <div className="text-xs text-gray-400">XP</div>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-2">
                      <div className="text-green-400 font-bold">x{artifactMultipliers.currency.toFixed(2)}</div>
                      <div className="text-xs text-gray-400">{tr('app.currency')}</div>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-2">
                      <div className="text-blue-400 font-bold">x{artifactMultipliers.passive.toFixed(2)}</div>
                      <div className="text-xs text-gray-400">{tr('app.passive')}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gray-800 rounded-xl p-3">
                <h4 className="font-semibold mb-2 text-sm">{tr('app.progress')}</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">{tr('app.epoch_current', { name: epoch.name.ua })}</span>
                      <span>{state.level}/{epoch.levelRange.max}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${Math.min(100, ((state.level - epoch.levelRange.min + 1) / (epoch.levelRange.max - epoch.levelRange.min + 1)) * 100)}%`,
                          background: epoch.bgGradient,
                        }}
                      />
                    </div>
                  </div>

                  {(() => {
                    const nextEpoch = EPOCHS.find(e => e.unlockLevel > state.level);
                    if (!nextEpoch) return null;
                    return (
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">{tr('app.epoch_next', { name: nextEpoch.name.ua })}</span>
                          <span>{nextEpoch.unlockLevel - state.level} рівнів</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
                            style={{ width: `${(state.level / nextEpoch.unlockLevel) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Info section */}
              <div className="bg-gray-800 rounded-xl p-3">
                <h4 className="font-semibold mb-2 text-sm">{tr('app.about_game')}</h4>
                <div className="text-xs text-gray-400 space-y-1">
                  <p>{tr('app.game_description')}</p>
                  <p>{tr('app.game_full_desc')}</p>
                  <p className="text-gray-500 mt-2">{tr('app.version')}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Gacha Modal */}
      {showGacha && (
        <GachaModal
          epoch={epoch}
          currency={state.currency}
          unlockedEpochs={state.unlockedEpochs}
          artifactParts={state.artifactParts || {}}
          completedArtifacts={state.completedArtifacts || []}
          artifactDupes={state.artifactDupes || {}}
          artifactLevels={state.artifactLevels || {}}
          prestigeLevel={state.prestigeLevel || 0}
          onClose={() => setShowGacha(false)}
          onRoll={(cost) => {
            // Only validate affordability — server deducts currency
            if (state.currency < cost) return false;
            recordGachaOpen();
            recordChestOpened();
            return true;
          }}
          onServerReward={(rewards) => {
            processServerRewards(rewards);
            // Deduct currency client-side to match server deduction
            deductGachaCost(100 * (EPOCHS.findIndex(e => e.id === epoch.id) + 1));
          }}
        />
      )}

      {/* Epoch Switcher Modal */}
      {showEpochModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowEpochModal(false)}>
          <div
            className="w-full max-w-md bg-gray-900 rounded-t-3xl p-4 border-t border-gray-700"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{tr('app.select_epoch')}</h3>
              <button onClick={() => setShowEpochModal(false)} className="p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {state.unlockedEpochs.map(epochId => {
                const e = getEpochById(epochId);
                const isCurrent = e.id === epoch.id;
                return (
                  <button
                    key={e.id}
                    onClick={() => handleEpochSwitch(e.id)}
                    className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${
                      isCurrent
                        ? 'bg-yellow-500/20 border border-yellow-500'
                        : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    <span className="text-2xl">{e.currencyIcon}</span>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{e.name.ua}</div>
                      <div className="text-xs text-gray-400">{e.period.ua}</div>
                    </div>
                    {isCurrent && (
                      <span className="text-xs bg-yellow-500 text-black px-2 py-0.5 rounded-full font-medium">
                        {tr('app.active')}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tutorial Modal */}
      {showTutorial && (
        <TutorialModal
          onClose={() => {
            localStorage.setItem('tutorial_seen', 'true');
            setShowTutorial(false);
          }}
        />
      )}

      {/* Daily Streak Modal — shown once per day on login */}
      {streakModal && !showTutorial && !showDailyRewards && (
        <DailyStreakModal
          streak={streakModal.streak}
          reward={streakModal.reward}
          onClose={dismissStreakModal}
        />
      )}

      {/* Daily Check-in Rewards — shown after streak modal */}
      {showDailyRewards && !showTutorial && (
        <DailyRewards
          checkInStreak={state.checkInStreak}
          lastCheckIn={state.lastCheckIn}
          onClaim={claimDailyReward}
          onSkip={skipDailyRewards}
        />
      )}

      {/* Session Ad Modal — shown after 20 min of gameplay */}
      {shouldShowSessionAd && !showGacha && !showTutorial && (
        <SessionAdModal
          prestigeLevel={state.prestigeLevel || 0}
          onReward={async (type) => {
            // Claim reward via server Edge Function
            try {
              const rewardType = type === 'energy' ? 'energy_restore' : 'session_ad';
              const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/claim-ad-reward`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ telegram_id: telegramId, reward_type: rewardType }),
              });
              const data = await response.json();
              if (data.success) {
                hapticNotification('success');
                // Refresh boosters/energy from server
                refreshBoosters();
              } else {
                hapticNotification('warning');
              }
            } catch (err) {
              console.error('Session ad reward failed:', err);
              hapticNotification('warning');
            }
          }}
          onClose={dismissSessionAd}
        />
      )}

      {/* Chest Ad Modal — shown after every 10th chest */}
      {shouldShowChestAd && !showGacha && !showTutorial && (
        <ChestAdModal
          prestigeLevel={state.prestigeLevel || 0}
          chestsOpened={totalChestsOpened}
          onReward={async (type) => {
            try {
              const rewardType = type === 'energy' ? 'energy_restore' : 'chest_bonus';
              const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/claim-ad-reward`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ telegram_id: telegramId, reward_type: rewardType }),
              });
              const data = await response.json();
              if (data.success) {
                hapticNotification('success');
                if (type === 'energy' && data.new_value) {
                  // Energy updated on server, refresh local state
                }
              } else {
                hapticNotification('warning');
              }
            } catch (err) {
              console.error('Chest ad reward failed:', err);
              hapticNotification('warning');
            }
          }}
          onClose={dismissChestAd}
        />
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon, label, badge }: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <button
      className={`flex-1 min-w-[60px] py-2 flex flex-col items-center gap-0.5 relative transition-colors touch-manipulation ${
        active ? 'text-yellow-400 bg-gray-800/50' : 'text-gray-400'
      }`}
      onClick={onClick}
    >
      <div className="relative">
        {icon}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-2 bg-red-500 text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </div>
      <span className="text-[10px] truncate max-w-full">{label}</span>
      {active && <div className="absolute bottom-0 left-1 right-1 h-0.5 bg-yellow-400 rounded-full" />}
    </button>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-800 rounded-xl p-3">
      <div className="text-xs text-gray-400">{label}</div>
      <div className="text-lg font-bold text-white">{value}</div>
    </div>
  );
}

function BoosterCard({ icon, name, description, price, loading, onBuy }: {
  icon: string;
  name: string;
  description: string;
  price: number;
  loading?: boolean;
  onBuy: () => void;
}) {
  return (
    <button
      onClick={onBuy}
      disabled={loading}
      className="w-full p-4 bg-gray-800 hover:bg-gray-700 disabled:opacity-60 rounded-xl transition-all active:scale-[0.98] text-left"
    >
      <div className="flex items-center gap-3">
        <div className="text-3xl">{icon}</div>
        <div className="flex-1">
          <div className="font-semibold">{name}</div>
          <div className="text-xs text-gray-400">{description}</div>
        </div>
        <div className="flex items-center gap-1 text-yellow-400">
          {loading
            ? <RefreshCw className="w-4 h-4 animate-spin" />
            : <><Star className="w-4 h-4" /><span className="font-bold">{price}</span></>
          }
        </div>
      </div>
    </button>
  );
}

function ActiveBoosterBadge({ label, endTime, color }: {
  label: string;
  endTime: number | null | undefined;
  color: string;
}) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    if (!endTime) return;
    const tick = () => {
      const ms = endTime - Date.now();
      if (ms <= 0) { setRemaining('0:00'); return; }
      const m = Math.floor(ms / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setRemaining(`${m}:${s.toString().padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  return (
    <div className={`flex items-center gap-1 bg-black/30 rounded-lg px-2 py-1 text-xs font-semibold ${color}`}>
      <Timer className="w-3 h-3" />
      <span>{label}</span>
      {remaining && <span className="opacity-70">{remaining}</span>}
    </div>
  );
}

export default App;
