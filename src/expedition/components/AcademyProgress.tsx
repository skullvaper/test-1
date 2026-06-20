/**
 * Academy Progress Component
 * 
 * Shows prestige progress with milestones, teasers, and countdown.
 * Designed to motivate players before Academy unlock.
 */

import { motion } from 'motion/react';
import { Lock, Star, Zap, Clock, TrendingUp, Gift, Award } from 'lucide-react';
import { Card, Badge } from '../ui';
import { useTranslation } from '../../i18n';

interface AcademyProgressProps {
  currentPrestige: number;
  targetPrestige: number;
  isUnlocked: boolean;
}

// Milestone definitions
const MILESTONES = [
  { prestige: 500, title: 'milestone_discovery', icon: Star, color: '#00E5FF' },
  { prestige: 1000, title: 'milestone_expansion', icon: TrendingUp, color: '#FFC72C' },
  { prestige: 1500, title: 'milestone_advancement', icon: Zap, color: '#9747FF' },
  { prestige: 2500, title: 'milestone_mastery', icon: Award, color: '#FF2A5F' },
  { prestige: 3000, title: 'milestone_academy', icon: Gift, color: '#10B981' },
];

// Locked feature teasers
const LOCKED_FEATURES = [
  { prestige: 500, titleKey: 'feature_hero_speed', descKey: 'feature_hero_speed_desc', icon: Zap },
  { prestige: 1000, titleKey: 'feature_extra_slot', descKey: 'feature_extra_slot_desc', icon: TrendingUp },
  { prestige: 1500, titleKey: 'feature_legend_chance', descKey: 'feature_legend_chance_desc', icon: Star },
  { prestige: 2500, titleKey: 'feature_museum_curator', descKey: 'feature_museum_curator_desc', icon: Award },
];

export function AcademyProgress({ currentPrestige, targetPrestige, isUnlocked }: AcademyProgressProps) {
  const { t } = useTranslation();
  
  const progressPercent = Math.min(100, (currentPrestige / targetPrestige) * 100);
  
  // Find next milestone
  const nextMilestone = MILESTONES.find(m => m.prestige > currentPrestige);
  const reachedMilestones = MILESTONES.filter(m => m.prestige <= currentPrestige);
  
  // Countdown to next milestone
  const countdownToNext = nextMilestone ? nextMilestone.prestige - currentPrestige : 0;
  
  if (isUnlocked) {
    return (
      <Card className="border-[#10B981]/30 p-4 bg-gradient-to-r from-[#10B981]/10 to-transparent">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Award className="w-6 h-6 text-[#10B981]" />
            <span className="text-lg font-bold text-[#10B981]" style={{ fontFamily: "'Exo 2', sans-serif" }}>
              {t('academy.unlocked')}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('academy.unlocked_description')}
          </p>
        </motion.div>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Main Progress Card */}
      <Card className="border-white/10 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#FF2A5F]" />
            <span className="text-sm font-medium" style={{ fontFamily: "'Exo 2', sans-serif" }}>
              {t('academy.progress_title')}
            </span>
          </div>
          <Badge style={{ backgroundColor: '#FF2A5F', color: '#fff', fontFamily: "'Exo 2', sans-serif" }}>
            {Math.round(progressPercent)}%
          </Badge>
        </div>
        
        {/* Progress Bar with Milestones */}
        <div className="relative mb-4">
          <div className="h-3 rounded-full bg-[#1a1a2e] overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ 
                width: `${progressPercent}%`,
                background: 'linear-gradient(90deg, #FF2A5F, #FFC72C)'
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
            />
          </div>
          
          {/* Milestone Markers */}
          <div className="absolute top-0 left-0 right-0 h-3 pointer-events-none">
            {MILESTONES.map((milestone) => {
              const position = (milestone.prestige / targetPrestige) * 100;
              const isReached = currentPrestige >= milestone.prestige;
              const MilestoneIcon = milestone.icon;
              
              return (
                <motion.div
                  key={milestone.prestige}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                  style={{ left: `${position}%` }}
                  initial={{ scale: 0 }}
                  animate={{ scale: isReached ? 1.2 : 1 }}
                  title={t(`academy.${milestone.title}`)}
                >
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      isReached ? 'bg-[#10B981] border-[#10B981]' : 'bg-[#1a1a2e] border-white/30'
                    }`}
                  >
                    {isReached ? (
                      <MilestoneIcon className="w-2.5 h-2.5 text-white" />
                    ) : (
                      <span className="w-1.5 h-1.5 bg-white/50 rounded-full" />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
        
        {/* Current Progress */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {currentPrestige.toLocaleString()} / {targetPrestige.toLocaleString()}
          </span>
          {nextMilestone && (
            <span className="text-xs" style={{ color: nextMilestone.color }}>
              {t('academy.next_milestone')} {t(`academy.${nextMilestone.title}`)}
            </span>
          )}
        </div>
        
        {/* Countdown to Next Milestone */}
        {nextMilestone && countdownToNext > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-2 rounded-lg bg-white/5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#FFC72C]" />
                <span className="text-xs text-muted-foreground">
                  {t('academy.remaining')}
                </span>
              </div>
              <span className="text-sm font-bold" style={{ fontFamily: "'Exo 2', sans-serif", color: '#FFC72C' }}>
                {countdownToNext.toLocaleString()} {t('academy.prestige_short')}
              </span>
            </div>
          </motion.div>
        )}
        
        {/* Reached Milestones List */}
        {reachedMilestones.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-xs text-muted-foreground mb-2">
              {t('academy.milestones_reached')}
            </p>
            <div className="flex flex-wrap gap-2">
              {reachedMilestones.map((milestone) => {
                const MilestoneIcon = milestone.icon;
                return (
                  <motion.div
                    key={milestone.prestige}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                    style={{ backgroundColor: `${milestone.color}20`, color: milestone.color }}
                  >
                    <MilestoneIcon className="w-3 h-3" />
                    <span>{t(`academy.${milestone.title}`)}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </Card>
      
      {/* Locked Features Preview */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Lock className="w-4 h-4" />
          {t('academy.locked_preview')}
        </h3>
        
        <div className="grid grid-cols-2 gap-2">
          {LOCKED_FEATURES.filter(f => f.prestige > currentPrestige)
            .slice(0, 2) // Show max 2 locked features
            .map((feature) => {
              const FeatureIcon = feature.icon;
              const progress = (currentPrestige / feature.prestige) * 100;
              
              return (
                <Card key={feature.prestige} className="border-white/5 p-3 opacity-70">
                  <div className="flex items-center gap-2 mb-2">
                    <FeatureIcon className="w-4 h-4 text-white/50" />
                    <span className="text-xs font-medium text-white/70">{t(`academy.${feature.titleKey}`)}</span>
                  </div>
                  <p className="text-[10px] text-white/40 mb-2">{t(`academy.${feature.descKey}`)}</p>
                  <div className="h-1 rounded-full bg-[#1a1a2e] overflow-hidden">
                    <div className="h-full rounded-full bg-white/30" style={{ width: `${Math.min(100, progress)}%` }} />
                  </div>
                  <p className="text-[10px] text-white/30 mt-1">
                    {feature.prestige} {t('academy.prestige_short')}
                  </p>
                </Card>
              );
            })}
          
          {/* Already Unlocked Features */}
          {LOCKED_FEATURES.filter(f => f.prestige <= currentPrestige)
            .slice(0, 2 - LOCKED_FEATURES.filter(f => f.prestige > currentPrestige).length)
            .map((feature) => {
              const FeatureIcon = feature.icon;
              
              return (
                <Card
                  key={feature.prestige}
                  className="border-[#10B981]/30 p-3 bg-[#10B981]/5"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <FeatureIcon className="w-4 h-4 text-[#10B981]" />
                    <span className="text-xs font-medium text-[#10B981]">{t(`academy.${feature.titleKey}`)}</span>
                  </div>
                  <p className="text-[10px] text-[#10B981]/70">{t(`academy.${feature.descKey}`)}</p>
                  <Badge className="mt-2 text-[10px]" style={{ backgroundColor: '#10B981', color: '#fff' }}>
                    ✓ {t('academy.unlocked')}
                  </Badge>
                </Card>
              );
            })}
        </div>
      </div>
    </div>
  );
}
