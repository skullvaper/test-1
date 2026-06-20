/**
 * Academy Teaser Component
 * 
 * Shows locked Academy preview to create anticipation.
 * Displays features, screenshots, and unlock requirements.
 * Enhanced with emojis and exciting visuals for new players.
 */

import { motion } from 'motion/react';
import { Lock, Users, Map, Building, BookOpen, Star } from 'lucide-react';
import { Card, Badge } from '../ui';
import { useTranslation } from '../../i18n';
import { useExpeditionStore } from '../store';

interface AcademyFeature {
  id: string;
  icon: React.ElementType;
  emoji: string;
  titleKey: string;
  descKey: string;
  color: string;
}

const ACADEMY_FEATURES: AcademyFeature[] = [
  { 
    id: 'heroes', 
    icon: Users, 
    emoji: '⚔️',
    titleKey: 'heroes', 
    descKey: 'heroes_desc', 
    color: '#9747FF' 
  },
  { 
    id: 'expeditions', 
    icon: Map, 
    emoji: '🗺️',
    titleKey: 'expeditions', 
    descKey: 'expeditions_desc', 
    color: '#00E5FF' 
  },
  { 
    id: 'buildings', 
    icon: Building, 
    emoji: '🏛️',
    titleKey: 'buildings', 
    descKey: 'buildings_desc', 
    color: '#FFC72C' 
  },
  { 
    id: 'story', 
    icon: BookOpen, 
    emoji: '📜',
    titleKey: 'story', 
    descKey: 'story_desc', 
    color: '#10B981' 
  },
];

// Milestones to show progress
const MILESTONES = [
  { threshold: 500, emoji: '🎯', labelKey: 'teaser.milestones.first_journey' },
  { threshold: 1000, emoji: '🏆', labelKey: 'teaser.milestones.treasure_seeker' },
  { threshold: 2000, emoji: '💎', labelKey: 'teaser.milestones.collector' },
  { threshold: 3000, emoji: '👑', labelKey: 'teaser.milestones.academy_master' },
];

export function AcademyTeaser() {
  const { t } = useTranslation();
  const historicalPrestige = useExpeditionStore((s) => s.historicalPrestige);
  
  const ACADEMY_THRESHOLD = 3000;
  const progressPercent = Math.min(100, (historicalPrestige / ACADEMY_THRESHOLD) * 100);
  const isUnlocked = historicalPrestige >= ACADEMY_THRESHOLD;
  
  // Calculate prestige points needed
  const pointsNeeded = Math.max(0, ACADEMY_THRESHOLD - historicalPrestige);
  
  if (isUnlocked) {
    return null;
  }
  
  // Find current and next milestone
  const currentMilestone = MILESTONES.filter(m => historicalPrestige >= m.threshold).pop();
  const nextMilestone = MILESTONES.find(m => m.threshold > historicalPrestige);
  
  return (
    <Card className="border-2 border-purple-500/30 p-4 bg-gradient-to-br from-purple-900/20 via-gray-900 to-pink-900/20 overflow-hidden relative">
      {/* Animated background effects */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-500/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl" />
      
      <div className="relative z-10">
        {/* Header with excitement */}
        <div className="flex items-center justify-between mb-4">
          <motion.div 
            className="flex items-center gap-2"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                🔒 {t('teaser.locked_academy')}
              </span>
            </div>
          </motion.div>
          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 shadow-lg">
            ⚡ {t('teaser.unlock_at')} {ACADEMY_THRESHOLD.toLocaleString()}
          </Badge>
        </div>
        
        {/* Exciting title */}
        <div className="text-center mb-4">
          <motion.h3 
            className="text-xl font-black text-white mb-2 flex items-center justify-center gap-2"
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-2xl">🎓</span>
            <span style={{ fontFamily: "'Exo 2', sans-serif" }}>{t('teaser.academy_title')}</span>
            <span className="text-2xl">✨</span>
          </motion.h3>
          <p className="text-sm text-gray-400">
            {t('teaser.academy_subtitle')}
          </p>
          <p className="text-xs text-purple-400 mt-1 font-medium">
            💡 Збери артефакти, щоб відкрити Академію!
          </p>
        </div>
        
        {/* Feature preview with emojis */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {ACADEMY_FEATURES.map((feature, index) => {
            const FeatureIcon = feature.icon;
            return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, scale: 0.8, rotateY: -20 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={{ delay: index * 0.15, type: 'spring' }}
                className="bg-white/5 rounded-xl p-3 border border-white/10 hover:border-purple-500/50 transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{feature.emoji}</span>
                  <FeatureIcon className="w-5 h-5" style={{ color: feature.color }} />
                  <span className="text-sm font-bold text-white/90">
                    {t(`teaser.${feature.titleKey}`)}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  {t(`teaser.${feature.descKey}`)}
                </p>
              </motion.div>
            );
          })}
        </div>
        
        {/* Progress section with milestones */}
        <div className="bg-black/30 rounded-xl p-4 border border-purple-500/20">
          {/* Current milestone */}
          {currentMilestone && (
            <div className="flex items-center gap-2 mb-3 text-center justify-center">
              <span className="text-2xl">{currentMilestone.emoji}</span>
              <span className="text-sm font-bold text-purple-400">{t(currentMilestone.labelKey)}</span>
              <span className="text-2xl">{currentMilestone.emoji}</span>
            </div>
          )}
          
          {/* Progress bar */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">{t('teaser.progress')}</span>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-sm font-bold text-yellow-400">
                {Math.round(progressPercent)}%
              </span>
            </div>
          </div>
          <div className="h-3 rounded-full bg-gray-800 overflow-hidden border border-gray-700">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-400"
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          
          {/* Numbers */}
          <div className="flex justify-between mt-2 text-xs">
            <span className="text-gray-400">
              {historicalPrestige.toLocaleString()} 💎
            </span>
            <span className="text-gray-500">
              / {ACADEMY_THRESHOLD.toLocaleString()} 💎
            </span>
          </div>
          
          {/* Next milestone */}
          {nextMilestone && (
            <div className="mt-3 pt-3 border-t border-gray-700 flex items-center justify-between">
              <span className="text-xs text-gray-500">Наступний:</span>
              <div className="flex items-center gap-1">
                <span className="text-lg">{nextMilestone.emoji}</span>
                <span className="text-xs font-bold text-white/70">
                  {t(nextMilestone.labelKey)}
                </span>
                <span className="text-xs text-gray-500">
                  ({nextMilestone.threshold.toLocaleString()})
                </span>
              </div>
            </div>
          )}
        </div>
        
        {/* Motivational message */}
        <motion.div
          className="mt-4 text-center p-3 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-yellow-500/10 rounded-xl border border-purple-500/20"
          animate={{ opacity: [0.8, 1, 0.8], scale: [1, 1.02, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <p className="text-sm font-bold text-white mb-1">
            🚀 {t('teaser.collect_artifacts')}
          </p>
          <p className="text-xs text-gray-400">
            Залишилось: <span className="text-yellow-400 font-bold">{pointsNeeded.toLocaleString()}</span> 💎
          </p>
        </motion.div>
      </div>
    </Card>
  );
}
