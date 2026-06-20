import { useState, useEffect, useCallback } from 'react';
import { useExpeditionStore } from '../store';
import { museumCollections, museumUpgrades, getReputationLevel, MUSEUM_ACHIEVEMENTS, LEGENDARY_EXHIBITIONS, getRankingTier, EXHIBITION_EVENTS, type MuseumState, type MuseumAchievement, type MuseumExhibition } from '../museumData';
import { leaderboardService, LeaderboardType, RankingMetric, LeaderboardEntry } from '../leaderboardService';
import { motion } from 'motion/react';
import { 
  Landmark, TrendingUp, Award, Sparkles, Eye, 
  Plus, Minus, Star, Gift, 
  X, Settings, Trophy, Calendar, Crown, RefreshCw
} from 'lucide-react';
import { Card, Badge, Progress } from '../ui';
import type { Artifact, Rarity } from '../data';
import { useTranslation } from '../../i18n';

type TabType = 'exhibitions' | 'collections' | 'upgrades' | 'stats' | 'achievements' | 'events' | 'rankings';

const rarityConfig: Record<Rarity, { color: string; labelKey: string }> = {
  common: { color: '#8B949E', labelKey: 'artifacts.rarity_common' },
  rare: { color: '#00E5FF', labelKey: 'artifacts.rarity_rare' },
  epic: { color: '#9747FF', labelKey: 'artifacts.rarity_epic' },
  legendary: { color: '#FF2A5F', labelKey: 'artifacts.rarity_legendary' },
};

interface MuseumSystemProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MuseumSystem({ isOpen, onClose }: MuseumSystemProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('exhibitions');

  // Store state
  const museumState = useExpeditionStore((s) => s.museumState);
  const artifacts = useExpeditionStore((s) => s.artifacts);
  const karbovanets = useExpeditionStore((s) => s.karbovanets);
  const placeArtifactInExhibition = useExpeditionStore((s) => s.placeArtifactInExhibition);
  const removeArtifactFromExhibition = useExpeditionStore((s) => s.removeArtifactFromExhibition);
  const collectMuseumIncome = useExpeditionStore((s) => s.collectMuseumIncome);
  const purchaseMuseumUpgrade = useExpeditionStore((s) => s.purchaseMuseumUpgrade);
  const expandExhibitionSlots = useExpeditionStore((s) => s.expandExhibitionSlots);

  // Get displayed artifacts
  const museumArtifacts = artifacts.filter((a) => a.status === 'museum');
  const exhibitedArtifactIds = museumState.exhibitions
    .filter((ex) => ex.artifactId)
    .map((ex) => ex.artifactId);
  const exhibitedArtifacts = museumArtifacts.filter((a) => exhibitedArtifactIds.includes(a.id));
  const totalExhibitedValue = exhibitedArtifacts.reduce((sum, a) => sum + a.value, 0);

  // Calculate daily visitors
  const collectionBonus = museumState.completedCollections.length * 10;
  const dailyVisitors = museumState.exhibitions.filter((ex) => ex.artifactId).length * 25;
  const repLevel = getReputationLevel(museumState.reputation);
  const marketingBonus = 1 + (museumState.upgrades.marketing * 0.15);
  const finalDailyVisitors = Math.floor(dailyVisitors * repLevel.visitorMultiplier * marketingBonus * (1 + collectionBonus / 100));

  // Calculate hourly income
  const restorationBonus = 1 + (museumState.upgrades.restoration_wing * 0.05);
  const hourlyIncome = Math.floor((totalExhibitedValue / 100) * repLevel.incomeMultiplier * restorationBonus * (1 + museumState.completedCollections.length * 0.05));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-screen p-4 pb-20" style={{ maxWidth: '430px', margin: '0 auto' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#9747FF20', border: '1px solid #9747FF' }}
            >
              <Landmark className="w-6 h-6" style={{ color: '#9747FF' }} />
            </div>
            <div>
              <h1 className="text-xl" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                {t('museum.title')}
              </h1>
              <p className="text-xs text-muted-foreground">{t('museum.subtitle')}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Card className="border-white/10 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-4 h-4" style={{ color: '#FFC72C' }} />
              <span className="text-xs text-muted-foreground">{t('museum.reputation_level')}</span>
            </div>
            <div className="text-xl" style={{ fontFamily: "'Exo 2', sans-serif", color: '#FFC72C' }}>
              {repLevel.level} - {t(repLevel.nameKey)}
            </div>
          </Card>
          <Card className="border-white/10 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="w-4 h-4" style={{ color: '#00E5FF' }} />
              <span className="text-xs text-muted-foreground">{t('museum.visitors_today')}</span>
            </div>
            <div className="text-xl" style={{ fontFamily: "'Exo 2', sans-serif", color: '#00E5FF' }}>
              {finalDailyVisitors.toLocaleString()}
            </div>
          </Card>
        </div>

        {/* Reputation Progress */}
        <Card className="border-white/10 p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm">{t('museum.museum_reputation')}</span>
            <span className="text-sm" style={{ fontFamily: "'Exo 2', sans-serif", color: '#FFC72C' }}>
              {Math.round(museumState.reputation).toLocaleString()} / {repLevel.requiredReputation.toLocaleString()}
            </span>
          </div>
          <Progress value={(museumState.reputation / Math.max(1, repLevel.requiredReputation)) * 100} className="h-2" />
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {[
            { id: 'exhibitions' as TabType, icon: Sparkles, label: t('museum.tab_exhibitions') },
            { id: 'collections' as TabType, icon: Gift, label: t('museum.tab_collections') },
            { id: 'upgrades' as TabType, icon: Settings, label: t('museum.tab_upgrades') },
            { id: 'stats' as TabType, icon: TrendingUp, label: t('museum.tab_stats') },
            { id: 'achievements' as TabType, icon: Trophy, label: '🏆' },
            { id: 'events' as TabType, icon: Calendar, label: '📅' },
            { id: 'rankings' as TabType, icon: Crown, label: '👑' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl whitespace-nowrap transition-all text-sm ${
                activeTab === tab.id
                  ? 'bg-[#9747FF] text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'exhibitions' && (
          <ExhibitionsTab
            museumState={museumState}
            artifacts={artifacts}
            hourlyIncome={hourlyIncome}
            placeArtifactInExhibition={placeArtifactInExhibition}
            removeArtifactFromExhibition={removeArtifactFromExhibition}
            expandExhibitionSlots={expandExhibitionSlots}
            karbovanets={karbovanets}
          />
        )}

        {activeTab === 'collections' && (
          <CollectionsTab
            museumState={museumState}
            museumArtifacts={museumArtifacts}
          />
        )}

        {activeTab === 'upgrades' && (
          <UpgradesTab
            museumState={museumState}
            karbovanets={karbovanets}
            purchaseMuseumUpgrade={purchaseMuseumUpgrade}
          />
        )}

        {activeTab === 'stats' && (
          <StatsTab
            museumState={museumState}
            hourlyIncome={hourlyIncome}
            exhibitedArtifacts={exhibitedArtifacts}
          />
        )}

        {activeTab === 'achievements' && (
          <AchievementsTab
            museumState={museumState}
            museumArtifacts={museumArtifacts}
          />
        )}

        {activeTab === 'events' && (
          <EventsTab
            museumState={museumState}
          />
        )}

        {activeTab === 'rankings' && (
          <RankingsTab
            museumState={museumState}
          />
        )}

        {/* Collect Income Button */}
        {hourlyIncome > 0 && (
          <motion.button
            onClick={collectMuseumIncome}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl font-bold text-lg shadow-lg"
            style={{ 
              backgroundColor: '#FFC72C', 
              color: '#0D1117',
              maxWidth: '400px',
              width: 'calc(100% - 32px)'
            }}
            whileTap={{ scale: 0.98 }}
          >
            💰 {t('museum.collect_income')}: +{hourlyIncome.toLocaleString()}/год
          </motion.button>
        )}
      </div>
    </div>
  );
}

// Exhibitions Tab Component
function ExhibitionsTab({
  museumState,
  artifacts,
  hourlyIncome,
  placeArtifactInExhibition,
  removeArtifactFromExhibition,
  expandExhibitionSlots,
  karbovanets,
}: {
  museumState: MuseumState;
  artifacts: Artifact[];
  hourlyIncome: number;
  placeArtifactInExhibition: (artifactId: string, slotIndex: number) => boolean;
  removeArtifactFromExhibition: (slotIndex: number) => void;
  expandExhibitionSlots: () => boolean;
  karbovanets: number;
}) {
  const { t } = useTranslation();
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  const museumArtifacts = artifacts.filter((a) => a.status === 'museum');
  const exhibitedIds = museumState.exhibitions.map((ex: MuseumExhibition) => ex.artifactId).filter(Boolean);
  const availableArtifacts = museumArtifacts.filter((a) => !exhibitedIds.includes(a.id));

  const expansionsCount = museumState.exhibitions.length - 3;
  const expansionCost = expansionsCount >= 9 ? Infinity : 5000 * Math.pow(2, expansionsCount);

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <Card className="border-white/10 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" style={{ color: '#9747FF' }} />
            <span className="text-sm">{t('museum.exhibition_slots')}</span>
          </div>
          <div className="text-sm" style={{ fontFamily: "'Exo 2', sans-serif", color: '#9747FF' }}>
            {museumState.exhibitions.filter((ex: MuseumExhibition) => ex.artifactId).length} / {museumState.exhibitions.length}
          </div>
        </div>
        <div className="flex gap-1 mt-2">
          {museumState.exhibitions.map((exhibition: MuseumExhibition, index: number) => (
            <div
              key={index}
              className={`flex-1 h-2 rounded ${
                exhibition.artifactId ? 'bg-[#9747FF]' : 'bg-white/10'
              }`}
            />
          ))}
        </div>
      </Card>

      {/* Exhibition Slots */}
      <div className="grid grid-cols-3 gap-3">
        {museumState.exhibitions.map((exhibition: MuseumExhibition, index: number) => {
          const artifact = artifacts.find((a) => a.id === exhibition.artifactId);
          const isEmpty = !exhibition.artifactId;
          const isSelected = selectedSlot === index;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`relative aspect-square rounded-xl border-2 p-2 cursor-pointer transition-all ${
                isSelected
                  ? 'border-[#FFC72C] bg-[#FFC72C]/10'
                  : isEmpty
                  ? 'border-dashed border-white/20 hover:border-white/40'
                  : 'border-[#9747FF]/50 bg-[#9747FF]/10'
              }`}
              onClick={() => {
                if (isEmpty) {
                  setSelectedSlot(index);
                } else {
                  removeArtifactFromExhibition(index);
                }
              }}
            >
              {artifact ? (
                <>
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-lg mb-1"
                      style={{ backgroundColor: `${rarityConfig[artifact.rarity].color}30` }}
                    >
                      ✨
                    </div>
                    <span className="text-[10px] text-center line-clamp-2" style={{ color: rarityConfig[artifact.rarity].color }}>
                      {artifact.name.substring(0, 20)}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeArtifactFromExhibition(index);
                    }}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Plus className="w-6 h-6 text-white/30" />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Expand Slots Button */}
      {museumState.exhibitions.length < 12 && (
        <button
          onClick={() => expandExhibitionSlots()}
          disabled={karbovanets < expansionCost}
          className={`w-full py-3 rounded-xl font-medium transition-all ${
            karbovanets >= expansionCost
              ? 'bg-[#9747FF]/20 text-[#9747FF] hover:bg-[#9747FF]/30'
              : 'bg-white/5 text-gray-500'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" />
            {t('museum.expand_slots')}: {expansionCost.toLocaleString()} 💰
          </div>
        </button>
      )}

      {/* Artifact Picker */}
      {selectedSlot !== null && availableArtifacts.length > 0 && (
        <Card className="border-white/10 p-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">{t('museum.select_artifact')}</span>
            <button
              onClick={() => setSelectedSlot(null)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {availableArtifacts.map((artifact) => (
              <button
                key={artifact.id}
                onClick={() => {
                  placeArtifactInExhibition(artifact.id, selectedSlot);
                  setSelectedSlot(null);
                }}
                className="w-full flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${rarityConfig[artifact.rarity].color}30` }}
                >
                  ✨
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm">{artifact.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {t('museum.value')}: {artifact.value.toLocaleString()}
                  </div>
                </div>
                <Badge style={{ backgroundColor: rarityConfig[artifact.rarity].color, color: '#0D1117', fontSize: '9px' }}>
                  {t(rarityConfig[artifact.rarity].labelKey)}
                </Badge>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Income Preview */}
      {hourlyIncome > 0 && (
        <Card className="border-[#FFC72C]/30 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">{t('museum.hourly_income')}</span>
            <span className="text-lg" style={{ fontFamily: "'Exo 2', sans-serif", color: '#FFC72C' }}>
              +{hourlyIncome.toLocaleString()}
            </span>
          </div>
        </Card>
      )}
    </div>
  );
}

// Collections Tab Component
function CollectionsTab({
  museumState,
  museumArtifacts,
}: {
  museumState: MuseumState;
  museumArtifacts: Artifact[];
}) {
  const { t } = useTranslation();

  // Calculate collection progress
  const collectionsWithProgress = museumCollections.map((collection) => {
    const matchingArtifacts = museumArtifacts.filter((a) => {
      const eraMatch = a.era === collection.era;
      const nameMatch = collection.artifacts.some((keyword) =>
        a.name.toLowerCase().includes(keyword.toLowerCase())
      );
      return eraMatch && nameMatch;
    }).length;

    const isComplete = museumState.completedCollections.includes(collection.id);

    return {
      ...collection,
      progress: matchingArtifacts,
      isComplete,
    };
  });

  const completedCount = collectionsWithProgress.filter((c) => c.isComplete).length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card className="border-white/10 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4" style={{ color: '#FFC72C' }} />
            <span className="text-sm">{t('museum.collections_completed')}</span>
          </div>
          <span className="text-lg" style={{ fontFamily: "'Exo 2', sans-serif", color: '#FFC72C' }}>
            {completedCount} / {museumCollections.length}
          </span>
        </div>
        <Progress value={(completedCount / museumCollections.length) * 100} className="h-2 mt-2" />
      </Card>

      {/* Collection Cards */}
      {collectionsWithProgress.map((collection) => (
        <Card
          key={collection.id}
          className={`border-white/10 p-4 ${collection.isComplete ? 'border-[#FFC72C]/50 bg-[#FFC72C]/5' : ''}`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: collection.isComplete ? '#FFC72C30' : '#ffffff10' }}>
                {collection.isComplete ? <Star className="w-6 h-6 text-[#FFC72C]" /> : collection.icon}
              </div>
              <div>
                <h3 className="text-sm font-medium" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                  {t(collection.nameKey)}
                </h3>
                <p className="text-xs text-muted-foreground">{collection.era}</p>
              </div>
            </div>
            {collection.isComplete && (
              <Badge style={{ backgroundColor: '#FFC72C', color: '#0D1117' }}>
                ✓ {t('museum.complete')}
              </Badge>
            )}
          </div>

          {/* Progress */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">{t('museum.progress')}</span>
              <span style={{ fontFamily: "'Exo 2', sans-serif", color: '#FFC72C' }}>
                {collection.progress} / {collection.requiredCount}
              </span>
            </div>
            <Progress 
              value={(collection.progress / collection.requiredCount) * 100} 
              className="h-2"
            />
          </div>

          {/* Bonuses */}
          {collection.isComplete && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white/5 rounded-lg p-2">
                <span className="text-muted-foreground">+{collection.bonus.reputationBonus} {t('museum.rep')}</span>
              </div>
              <div className="bg-white/5 rounded-lg p-2">
                <span className="text-muted-foreground">+{collection.bonus.visitorBonus}% {t('museum.visitors')}</span>
              </div>
              <div className="bg-white/5 rounded-lg p-2">
                <span className="text-muted-foreground">+{collection.bonus.incomeBonus}% {t('museum.income')}</span>
              </div>
              <div className="bg-white/5 rounded-lg p-2">
                <span className="text-muted-foreground">+{collection.bonus.karbovanetsBonus} 💰</span>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

// Upgrades Tab Component
function UpgradesTab({
  museumState,
  karbovanets,
  purchaseMuseumUpgrade,
}: {
  museumState: MuseumState;
  karbovanets: number;
  purchaseMuseumUpgrade: (upgradeId: string) => boolean;
}) {
  const { t } = useTranslation();

  const upgradesWithInfo = museumUpgrades.map((upgrade) => {
    const currentLevel = museumState.upgrades[upgrade.id] || 0;
    const cost = currentLevel >= upgrade.maxLevel 
      ? Infinity 
      : Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));
    const isMaxed = currentLevel >= upgrade.maxLevel;
    const canAfford = karbovanets >= cost;

    return {
      ...upgrade,
      currentLevel,
      cost,
      isMaxed,
      canAfford,
    };
  });

  return (
    <div className="space-y-4">
      {upgradesWithInfo.map((upgrade) => (
        <Card
          key={upgrade.id}
          className={`border-white/10 p-4 ${upgrade.isMaxed ? 'border-[#FFC72C]/30 bg-[#FFC72C]/5' : ''}`}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-white/10">
              {upgrade.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-medium" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                  {t(upgrade.nameKey)}
                </h3>
                <Badge variant="outline" style={{ borderColor: '#FFC72C', color: '#FFC72C' }}>
                  {upgrade.currentLevel} / {upgrade.maxLevel}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{t(upgrade.descriptionKey)}</p>

              {/* Effect */}
              <div className="text-xs mb-3">
                {upgrade.effects.map((effect, i) => (
                  <div key={i} className="text-[#00E5FF]">
                    +{effect.value * (upgrade.currentLevel + 1)} {effect.type === 'visitors' ? '%' : ''} {t(`museum.effect_${effect.type}`)}
                  </div>
                ))}
              </div>

              {/* Upgrade Button */}
              {upgrade.isMaxed ? (
                <div className="text-center py-2 text-sm text-[#FFC72C]">
                  ✓ {t('museum.max_level')}
                </div>
              ) : (
                <button
                  onClick={() => purchaseMuseumUpgrade(upgrade.id)}
                  disabled={!upgrade.canAfford}
                  className={`w-full py-2 rounded-lg font-medium transition-all ${
                    upgrade.canAfford
                      ? 'bg-[#FFC72C] text-[#0D1117] hover:bg-[#FFC72C]/90'
                      : 'bg-white/10 text-gray-500'
                  }`}
                >
                  {upgrade.cost.toLocaleString()} 💰
                </button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// Stats Tab Component
function StatsTab({
  museumState,
  hourlyIncome,
  exhibitedArtifacts,
}: {
  museumState: MuseumState;
  hourlyIncome: number;
  exhibitedArtifacts: Artifact[];
}) {
  const { t } = useTranslation();
  const repLevel = getReputationLevel(museumState.reputation);

  const totalArtifactValue = exhibitedArtifacts.reduce((sum, a) => sum + a.value, 0);

  return (
    <div className="space-y-4">
      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-white/10 p-3">
          <div className="text-xs text-muted-foreground mb-1">{t('museum.total_visitors')}</div>
          <div className="text-xl" style={{ fontFamily: "'Exo 2', sans-serif", color: '#00E5FF' }}>
            {museumState.totalVisitorsAllTime.toLocaleString()}
          </div>
        </Card>
        <Card className="border-white/10 p-3">
          <div className="text-xs text-muted-foreground mb-1">{t('museum.total_income')}</div>
          <div className="text-xl" style={{ fontFamily: "'Exo 2', sans-serif", color: '#FFC72C' }}>
            {museumState.totalIncomeAllTime.toLocaleString()}
          </div>
        </Card>
      </div>

      {/* Current Status */}
      <Card className="border-white/10 p-4">
        <h3 className="text-sm font-medium mb-3" style={{ fontFamily: "'Exo 2', sans-serif" }}>
          {t('museum.current_status')}
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('museum.reputation_level')}</span>
            <span style={{ color: '#FFC72C' }}>{repLevel.level} ({t(repLevel.nameKey)})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('museum.exhibits_count')}</span>
            <span style={{ color: '#9747FF' }}>{exhibitedArtifacts.length} / {museumState.exhibitions.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('museum.collections')}</span>
            <span style={{ color: '#FFC72C' }}>{museumState.completedCollections.length} / 5</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('museum.hourly_income')}</span>
            <span style={{ color: '#FFC72C' }}>+{hourlyIncome.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('museum.total_value')}</span>
            <span style={{ color: '#FFC72C' }}>{totalArtifactValue.toLocaleString()}</span>
          </div>
        </div>
      </Card>

      {/* Upgrade Levels */}
      <Card className="border-white/10 p-4">
        <h3 className="text-sm font-medium mb-3" style={{ fontFamily: "'Exo 2', sans-serif" }}>
          {t('museum.upgrade_levels')}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {museumUpgrades.map((upgrade) => {
            const level = museumState.upgrades[upgrade.id] || 0;
            return (
              <div key={upgrade.id} className="flex items-center gap-2 text-sm">
                <span>{upgrade.icon}</span>
                <span className="text-muted-foreground">{t(upgrade.nameKey)}:</span>
                <span style={{ color: '#FFC72C' }}>{level}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Achievements Section */}
      <Card className="border-white/10 p-4">
        <h3 className="text-sm font-medium mb-3" style={{ fontFamily: "'Exo 2', sans-serif" }}>
          🏆 {t('museum.achievements') || 'Achievements'}
        </h3>
        <div className="text-sm text-muted-foreground">
          {museumState.achievements?.length || 0} / {MUSEUM_ACHIEVEMENTS.length} unlocked
        </div>
        <Progress value={(museumState.achievements?.length || 0) / MUSEUM_ACHIEVEMENTS.length * 100} className="h-2 mt-2" />
      </Card>
    </div>
  );
}

// Achievements Tab Component
function AchievementsTab({ museumState, museumArtifacts }: { museumState: MuseumState; museumArtifacts: Artifact[] }) {
  const { t } = useTranslation();
  const unlockedIds = museumState.achievements || [];
  
  const getProgress = (achievement: MuseumAchievement) => {
    switch (achievement.requirement.type) {
      case 'visitors': return museumState.totalVisitorsAllTime || 0;
      case 'artifacts': return museumArtifacts.length;
      case 'collections': return museumState.completedCollections?.length || 0;
      case 'reputation': return museumState.reputation;
      case 'exhibitions': return museumState.exhibitions?.filter((e) => e.artifactId).length || 0;
      case 'events': return museumState.eventParticipation?.length || 0;
      default: return 0;
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card className="border-white/10 p-3 text-center">
          <div className="text-2xl font-bold" style={{ color: '#FFC72C' }}>
            {unlockedIds.length}
          </div>
          <div className="text-xs text-muted-foreground">{t('museum.unlocked')}</div>
        </Card>
        <Card className="border-white/10 p-3 text-center">
          <div className="text-2xl font-bold" style={{ color: '#9747FF' }}>
            {MUSEUM_ACHIEVEMENTS.length - unlockedIds.length}
          </div>
          <div className="text-xs text-muted-foreground">{t('museum.locked')}</div>
        </Card>
      </div>

      {MUSEUM_ACHIEVEMENTS.map((achievement) => {
        const isUnlocked = unlockedIds.includes(achievement.id);
        const current = getProgress(achievement);
        const progress = Math.min(100, (current / achievement.requirement.value) * 100);
        
        return (
          <Card
            key={achievement.id}
            className={`border-white/10 p-4 ${isUnlocked ? 'border-[#FFC72C]/30 bg-[#FFC72C]/5' : ''}`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                isUnlocked ? 'bg-[#FFC72C]/20' : 'bg-white/10 opacity-50'
              }`}>
                {achievement.icon}
              </div>
              <div className="flex-1">
                <h3 className={`text-sm font-medium ${!isUnlocked && achievement.secret ? 'text-gray-500' : ''}`}>
                  {isUnlocked || !achievement.secret ? t(achievement.nameKey) : '???'}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {isUnlocked || !achievement.secret ? t(achievement.descriptionKey) : t('museum.secret_achievement')}
                </p>
                {!isUnlocked && !achievement.secret && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{current} / {achievement.requirement.value}</span>
                      <span style={{ color: '#FFC72C' }}>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>
                )}
                {isUnlocked && (
                  <div className="mt-2 text-xs" style={{ color: '#10B981' }}>
                    ✓ Completed • +{achievement.reward.amount} {achievement.reward.type}
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// Events Tab Component
function EventsTab({ museumState }: { museumState: MuseumState }) {
  const { t } = useTranslation();
  const now = Date.now();
  const activeEvents = EXHIBITION_EVENTS.filter(e => 
    museumState.reputation >= e.requiredReputation &&
    (e.endDate === 0 || e.endDate > now)
  );
  const participated = museumState.eventParticipation || [];

  return (
    <div className="space-y-4">
      {/* Event Info */}
      <Card className="border-[#FFC72C]/30 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-5 h-5" style={{ color: '#FFC72C' }} />
          <span className="font-medium" style={{ fontFamily: "'Exo 2', sans-serif" }}>{t('museum.exhibition_events')}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {t('museum.exhibition_events_desc')}
        </p>
      </Card>

      {/* Active Events */}
      {activeEvents.length === 0 ? (
        <Card className="border-white/10 p-6 text-center">
          <div className="text-4xl mb-2">🎭</div>
          <p className="text-sm text-muted-foreground">
            Increase your reputation to unlock events
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Next event unlocks at 500 reputation
          </p>
        </Card>
      ) : (
        activeEvents.map((event) => {
          const isActive = participated.includes(event.id);
          
          return (
            <Card
              key={event.id}
              className={`border-white/10 p-4 ${isActive ? 'border-[#9747FF]/30 bg-[#9747FF]/5' : ''}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{event.theme === 'gold' ? '👑' : event.theme === 'warrior' ? '⚔️' : '🏺'}</span>
                  <div>
                    <h3 className="text-sm font-medium">
                      {t(event.nameKey)}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {t(event.nameKey)} {t('museum.event_suffix')}
                    </p>
                  </div>
                </div>
                {isActive && (
                  <Badge style={{ backgroundColor: '#9747FF', color: '#fff' }}>
                    {t('museum.active')}
                  </Badge>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground mb-3">
                {event.descriptionKey.split('.').pop()}
              </p>

              {/* Bonuses */}
              <div className="flex flex-wrap gap-2 mb-3">
                {event.bonuses.map((bonus, i) => (
                  <span key={i} className="text-xs px-2 py-1 rounded-full bg-[#FFC72C]/20" style={{ color: '#FFC72C' }}>
                    +{bonus.value}% {bonus.type}
                  </span>
                ))}
              </div>

              {/* Rewards */}
              <div className="text-xs text-muted-foreground mb-3">
                Rewards: {event.rewards.map(r => `+${r.amount} ${r.type}`).join(', ')}
              </div>

              <button
                className={`w-full py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white/10 text-gray-500 cursor-not-allowed'
                    : 'bg-[#9747FF] text-white hover:bg-[#9747FF]/90'
                }`}
                disabled={isActive}
              >
                {isActive ? 'Participating' : 'Join Event'}
              </button>
            </Card>
          );
        })
      )}

      {/* Legendary Exhibitions */}
      <h3 className="text-sm font-medium mt-6 mb-3" style={{ fontFamily: "'Exo 2', sans-serif" }}>
        🌟 Legendary Exhibitions
      </h3>
      {LEGENDARY_EXHIBITIONS.map((exhibition) => {
        const isUnlocked = museumState.reputation >= exhibition.requiredReputation &&
          (museumState.completedCollections?.length || 0) >= exhibition.requiredCollections;
        const isCompleted = museumState.legendaryExhibitions?.includes(exhibition.id);

        return (
          <Card
            key={exhibition.id}
            className={`border-white/10 p-4 ${isCompleted ? 'border-[#FFC72C]/30' : !isUnlocked ? 'opacity-50' : 'border-[#FF2A5F]/30'}`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                isCompleted ? 'bg-[#FFC72C]/20' : 'bg-[#FF2A5F]/20'
              }`}>
                {exhibition.id.includes('trypillia') ? '🏺' : 
                 exhibition.id.includes('scythia') ? '⚔️' :
                 exhibition.id.includes('rus') ? '⛪' :
                 exhibition.id.includes('cossack') ? '🗡️' : '🌟'}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium">
                  {t(exhibition.nameKey)}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {t(exhibition.descriptionKey)}
                </p>
                
                {/* Requirements */}
                <div className="flex gap-3 mt-2 text-xs">
                  <span style={{ color: museumState.reputation >= exhibition.requiredReputation ? '#10B981' : '#FF2A5F' }}>
                    Rep: {museumState.reputation >= exhibition.requiredReputation ? '✓' : ''}{exhibition.requiredReputation}
                  </span>
                  <span style={{ color: (museumState.completedCollections?.length || 0) >= exhibition.requiredCollections ? '#10B981' : '#FF2A5F' }}>
                    Collections: {(museumState.completedCollections?.length || 0) >= exhibition.requiredCollections ? '✓' : ''}{exhibition.requiredCollections}
                  </span>
                </div>

                {/* Bonuses */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {exhibition.bonuses.map((bonus, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded-full bg-white/10" style={{ color: '#00E5FF' }}>
                      +{bonus.value}% {bonus.type}
                    </span>
                  ))}
                </div>

                {isCompleted && (
                  <div className="mt-2 text-xs" style={{ color: '#FFC72C' }}>
                    ✓ Completed • One-time reward: +{exhibition.oneTimeReward.amount}
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// Rankings Tab Component
function RankingsTab({ museumState }: { museumState: MuseumState }) {
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>('global');
  const [metric, setMetric] = useState<RankingMetric>('reputation');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await leaderboardService.getLeaderboard(leaderboardType, metric, 50);
    if (result.entries.length === 0) {
      setError('No data available');
    } else {
      setEntries(result.entries);
      setUserRank(result.userRank);
    }
    setLoading(false);
  }, [leaderboardType, metric]);

  useEffect(() => { loadLeaderboard(); }, [loadLeaderboard]);

  const currentTier = getRankingTier(museumState.reputation);

  const getScore = (entry: LeaderboardEntry): number => {
    switch (metric) {
      case 'prestige': return entry.prestige;
      case 'reputation': return entry.reputation;
      case 'artifacts': return entry.artifacts;
      case 'hero_power': return entry.hero_power;
      default: return entry.reputation;
    }
  };

  const { t } = useTranslation();

  const getMetricLabelMap = (): Record<RankingMetric, string> => ({
    prestige: t('expedition.leaderboard_metric_prestige'),
    reputation: t('expedition.leaderboard_metric_reputation'),
    artifacts: t('expedition.leaderboard_metric_artifacts'),
    hero_power: t('expedition.leaderboard_metric_hero_power'),
  });

  const getMetricLabel = (metric: RankingMetric): string => {
    return getMetricLabelMap()[metric] || metric;
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['global', 'weekly'] as LeaderboardType[]).map((type) => (
          <button key={type} onClick={() => setLeaderboardType(type)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${leaderboardType === type ? 'bg-[#FFC72C] text-[#0D1117]' : 'bg-white/10 text-gray-300'}`}>
            {type === 'global' ? t('expedition.leaderboard_global') : t('expedition.leaderboard_weekly')}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(getMetricLabelMap()) as RankingMetric[]).map((m) => (
          <button key={m} onClick={() => setMetric(m)}
            className={`py-1 px-2 rounded text-xs transition-all ${metric === m ? 'bg-[#9747FF] text-white' : 'bg-white/5 text-gray-400'}`}>
            {getMetricLabel(m)}
          </button>
        ))}
      </div>
      {userRank ? (
        <Card className="border-[#FFC72C]/30 p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: currentTier.color + '30' }}>
              {currentTier.icon}
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{t('museum.your_rank')}</div>
              <div className="text-xl font-bold" style={{ color: currentTier.color }}>#{userRank.rank}</div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-xs text-muted-foreground">{getMetricLabel(metric)}</div>
              <div className="text-lg font-bold" style={{ fontFamily: "'Exo 2', sans-serif" }}>{getScore(userRank).toLocaleString()}</div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="border-white/10 p-4 text-center">
          <p className="text-sm text-muted-foreground">{t('expedition.leaderboard_play_more')}</p>
        </Card>
      )}
      <button onClick={loadLeaderboard} disabled={loading}
        className="w-full py-2 rounded-lg bg-white/10 text-sm flex items-center justify-center gap-2 disabled:opacity-50">
        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        {t('expedition.leaderboard_refresh')}
      </button>
      {error && (
        <Card className="border-red-500/30 p-4 text-center">
          <p className="text-sm text-red-400">{error}</p>
        </Card>
      )}
      {!error && entries.length > 0 && (
        <Card className="border-white/10 p-4">
          <h3 className="text-sm font-medium mb-3">{t('expedition.leaderboard_top_players')}</h3>
          <div className="space-y-2">
            {entries.map((entry) => {
              const playerTier = getRankingTier(getScore(entry));
              return (
                <div key={entry.telegram_id}
                  className={`flex items-center gap-3 p-2 rounded-lg ${entry.rank <= 3 ? 'bg-[#FFC72C]/5' : ''} ${userRank?.telegram_id === entry.telegram_id ? 'bg-[#9747FF]/10 border border-[#9747FF]/30' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    entry.rank === 1 ? 'bg-[#FFD700]/20 text-[#FFD700]' :
                    entry.rank === 2 ? 'bg-[#C0C0C0]/20 text-[#C0C0C0]' :
                    entry.rank === 3 ? 'bg-[#CD7F32]/20 text-[#CD7F32]' : 'bg-white/10'}`}>
                    {entry.rank}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{entry.username}</span>
                      <span className="text-xs">{playerTier.icon}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{entry.artifacts} artifacts - {entry.prestige} prestige</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium" style={{ color: playerTier.color }}>{getScore(entry).toLocaleString()}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

