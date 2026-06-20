/**
 * Prestige Milestones Component
 * 
 * Shows milestone progress with rewards celebration.
 * Each milestone gives rewards and creates anticipation for Academy.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Gift, Zap, Award, Lock, Check } from 'lucide-react';
import { Card, Badge } from '../ui';
import { useTranslation } from '../../i18n';
import { useExpeditionStore } from '../store';
import { PRESTIGE_MILESTONES } from '../balanceConfig';

export function PrestigeMilestones() {
  const { t } = useTranslation();
  const historicalPrestige = useExpeditionStore((s) => s.historicalPrestige);
  const addKarbovanets = useExpeditionStore((s) => s.addKarbovanets);
  
  const [celebratingMilestone, setCelebratingMilestone] = useState<number | null>(null);
  const [claimedMilestones, setClaimedMilestones] = useState<Set<number>>(new Set());
  
  // Check for milestone achievements
  useEffect(() => {
    const lastClaimed = Math.max(0, ...claimedMilestones);
    const nextMilestone = PRESTIGE_MILESTONES.find(m => m.prestige > lastClaimed && historicalPrestige >= m.prestige);
    
    if (nextMilestone && !claimedMilestones.has(nextMilestone.prestige)) {
      setCelebratingMilestone(nextMilestone.prestige);
      
      setTimeout(() => {
        if (nextMilestone.reward.karbovanets) {
          addKarbovanets(nextMilestone.reward.karbovanets);
        }
        setClaimedMilestones(prev => new Set([...prev, nextMilestone.prestige]));
        setTimeout(() => setCelebratingMilestone(null), 3000);
      }, 2000);
    }
  }, [historicalPrestige, claimedMilestones, addKarbovanets]);
  
  const nextMilestone = PRESTIGE_MILESTONES.find(m => m.prestige > historicalPrestige);
  const progressToNext = nextMilestone 
    ? Math.min(100, (historicalPrestige / nextMilestone.prestige) * 100)
    : 100;
  
  return (
    <div className="space-y-3">
      {/* Milestone Progress Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-[#FFC72C]" />
          <span className="text-sm font-medium" style={{ fontFamily: "'Exo 2', sans-serif" }}>
            {t('milestone.prestige_milestones')}
          </span>
        </div>
        <Badge style={{ backgroundColor: '#FFC72C', color: '#0D1117', fontSize: '10px' }}>
          {t('milestone.next_in')} {nextMilestone?.prestige || 3000} {t('academy.prestige')}
        </Badge>
      </div>
      
      {/* Progress Bar */}
      <div className="relative">
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #FFC72C, #FF2A5F)' }}
            animate={{ width: `${progressToNext}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        
        {/* Milestone Dots */}
        <div className="absolute top-0 left-0 right-0 h-2 pointer-events-none">
          {PRESTIGE_MILESTONES.map((milestone) => {
            const position = Math.min(100, (milestone.prestige / 3000) * 100);
            const isReached = historicalPrestige >= milestone.prestige;
            const isClaimed = claimedMilestones.has(milestone.prestige);
            
            return (
              <motion.div
                key={milestone.prestige}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                style={{ left: `${position}%` }}
                initial={{ scale: 0 }}
                animate={{ scale: isReached ? 1.1 : 1 }}
              >
                <div
                  className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                    isReached 
                      ? isClaimed 
                        ? 'bg-[#10B981] border-[#10B981]' 
                        : 'bg-[#FFC72C] border-[#FFC72C] animate-pulse'
                      : 'bg-[#1a1a2e] border-white/30'
                  }`}
                >
                  {isReached && isClaimed && <Check className="w-2 h-2 text-white" />}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
      
      {/* Milestone Cards */}
      <div className="grid grid-cols-3 gap-2">
        {PRESTIGE_MILESTONES.map((milestone, index) => {
          const isReached = historicalPrestige >= milestone.prestige;
          const isClaimed = claimedMilestones.has(milestone.prestige);
          const isNext = nextMilestone?.prestige === milestone.prestige;
          
          return (
            <motion.div
              key={milestone.prestige}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className={`p-2 text-center transition-all ${
                  isReached 
                    ? isClaimed 
                      ? 'border-[#10B981]/30 bg-[#10B981]/5' 
                      : 'border-[#FFC72C]/50 bg-[#FFC72C]/5'
                    : 'border-white/5 opacity-50'
                } ${isNext ? 'ring-1 ring-[#FFC72C]/50' : ''}`}
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  {isReached ? (
                    isClaimed ? (
                      <Check className="w-3 h-3 text-[#10B981]" />
                    ) : (
                      <Star className="w-3 h-3 text-[#FFC72C]" />
                    )
                  ) : (
                    <Lock className="w-3 h-3 text-white/30" />
                  )}
                </div>
                <p className={`text-xs font-bold ${isReached ? 'text-[#FFC72C]' : 'text-white/50'}`}>
                  {milestone.prestige}
                </p>
                <p className="text-[10px] text-white/40">
                  {t(`milestone.${milestone.title}`)}
                </p>
                {milestone.reward.karbovanets && (
                  <div className="flex items-center justify-center gap-0.5 mt-1">
                    <Zap className="w-2.5 h-2.5 text-[#FFC72C]" />
                    <span className="text-[10px] text-[#FFC72C]">+{milestone.reward.karbovanets}</span>
                  </div>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>
      
      {/* Celebration Modal */}
      <AnimatePresence>
        {celebratingMilestone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setCelebratingMilestone(null)}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="bg-[#0D1117] border border-[#FFC72C] rounded-2xl p-6 max-w-sm mx-4 text-center"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5 }}
              >
                <Gift className="w-16 h-16 text-[#FFC72C] mx-auto mb-4" />
              </motion.div>
              
              <h2 className="text-xl font-bold text-[#FFC72C] mb-2" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                {t('milestone.reached')}
              </h2>
              
              <p className="text-white/70 mb-4">
                {t(`milestone.${PRESTIGE_MILESTONES.find(m => m.prestige === celebratingMilestone)?.title}`)} - {celebratingMilestone} {t('milestone.achieved')}
              </p>
              
              <div className="bg-white/5 rounded-lg p-3 mb-4">
                <p className="text-xs text-white/50 mb-2">{t('milestone.rewards')}</p>
                <div className="flex items-center justify-center gap-4">
                  {PRESTIGE_MILESTONES.find(m => m.prestige === celebratingMilestone)?.reward.karbovanets && (
                    <div className="flex items-center gap-1">
                      <Zap className="w-5 h-5 text-[#FFC72C]" />
                      <span className="text-lg font-bold text-[#FFC72C]">
                        +{PRESTIGE_MILESTONES.find(m => m.prestige === celebratingMilestone)?.reward.karbovanets}
                      </span>
                    </div>
                  )}
                  {PRESTIGE_MILESTONES.find(m => m.prestige === celebratingMilestone)?.reward.xp && (
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-[#9747FF]" />
                      <span className="text-lg font-bold text-[#9747FF]">
                        +{PRESTIGE_MILESTONES.find(m => m.prestige === celebratingMilestone)?.reward.xp} XP
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {celebratingMilestone === 3000 && (
                <div className="bg-[#10B981]/20 border border-[#10B981]/30 rounded-lg p-3 mb-4">
                  <p className="text-sm text-[#10B981] font-medium">
                    🏛️ {t('milestone.academy_unlocked')}
                  </p>
                </div>
              )}
              
              <button
                onClick={() => setCelebratingMilestone(null)}
                className="px-6 py-2 rounded-lg bg-[#FFC72C] text-[#0D1117] font-bold text-sm"
              >
                {t('common.continue')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
