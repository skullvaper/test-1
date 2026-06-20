import { useState } from 'react';
import { useExpeditionStore } from '../store';
import { buildings } from '../data';
import { motion } from 'motion/react';
import { TrendingUp, Coins, Eye, Send, BookOpen, MessageCircle } from 'lucide-react';
import { Card, Badge } from '../ui';
import { NPCSystem } from '../components/NPCSystem';
import { UkrainianPattern } from '../components/UkrainianPattern';
import { StorySystem } from '../components/StorySystem';
import { AcademyProgress } from '../components/AcademyProgress';
import { PrestigeMilestones } from '../components/PrestigeMilestones';
import { AcademyTeaser } from '../components/AcademyTeaser';
import { useTranslation } from '../../i18n';

// Academy unlock threshold - reduced from 5000 to 3000 for better retention
const ACADEMY_PRESTIGE_THRESHOLD = 3000;

export function Academy() {
  const { t } = useTranslation();
  const [showStory, setShowStory] = useState(false);

  // Story state from store
  const storyState = useExpeditionStore((s) => s.storyState);
  const interactWithNpc = useExpeditionStore((s) => s.interactWithNpc);
  const startQuest = useExpeditionStore((s) => s.startQuest);
  const completeQuest = useExpeditionStore((s) => s.completeQuest);
  
  // Other store state
  const academyLevel = useExpeditionStore((s) => s.academyLevel);
  const reputation = useExpeditionStore((s) => s.reputation);
  const karbovanets = useExpeditionStore((s) => s.karbovanets);
  const museumVisitors = useExpeditionStore((s) => s.museumVisitors);
  const historicalPrestige = useExpeditionStore((s) => s.historicalPrestige);
  const expeditions = useExpeditionStore((s) => s.expeditions);

  const activeExpeditions = expeditions.filter((e) => !e.collected).length;
  
  // Check if Academy is unlocked (prestige >= threshold)
  const isAcademyUnlocked = historicalPrestige >= ACADEMY_PRESTIGE_THRESHOLD;

  // Handle NPC interaction - delegate to store
  const handleInteractWithNpc = (npcId: string) => {
    interactWithNpc(npcId);
  };

  // Handle quest start - delegate to store
  const handleStartQuest = (questId: string) => {
    startQuest(questId);
  };

  // Handle quest complete - delegate to store
  const handleCompleteQuest = (questId: string) => {
    completeQuest(questId);
  };

  return (
    <div className="min-h-full bg-[#0D1117] p-4 pb-20 relative overflow-hidden">
      <UkrainianPattern />

      <div className="relative z-10 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl" style={{ fontFamily: "'Exo 2', sans-serif", color: '#FFC72C' }}>
              {t('expedition.academy_title')}
            </h1>
            <p className="text-sm text-muted-foreground">{t('expedition.academy_subtitle')}</p>
          </div>
          <Badge
            className="px-3 py-1"
            style={{ backgroundColor: '#FFC72C', color: '#0D1117', fontFamily: "'Exo 2', sans-serif" }}
          >
            {t('common.level')} {academyLevel}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <Card className="border-white/10 p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4" style={{ color: '#FFC72C' }} />
              <span className="text-xs text-muted-foreground">{t('expedition.reputation')}</span>
            </div>
            <div className="text-xl" style={{ fontFamily: "'Exo 2', sans-serif", color: '#FFC72C' }}>
              {Math.round(reputation).toLocaleString()}
            </div>
          </Card>

          <Card className="border-white/10 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Coins className="w-4 h-4" style={{ color: '#FFC72C' }} />
              <span className="text-xs text-muted-foreground">{t('expedition.karbovanets')}</span>
            </div>
            <div className="text-xl" style={{ fontFamily: "'Exo 2', sans-serif", color: '#FFC72C' }}>
              {Math.round(karbovanets).toLocaleString()}
            </div>
          </Card>

          <Card className="border-white/10 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="w-4 h-4" style={{ color: '#00E5FF' }} />
              <span className="text-xs text-muted-foreground">{t('expedition.visitors')}</span>
            </div>
            <div className="text-xl" style={{ fontFamily: "'Exo 2', sans-serif", color: '#00E5FF' }}>
              {museumVisitors}
            </div>
          </Card>

          <Card className="border-white/10 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Send className="w-4 h-4" style={{ color: '#9747FF' }} />
              <span className="text-xs text-muted-foreground">{t('expedition.expeditions')}</span>
            </div>
            <div className="text-xl" style={{ fontFamily: "'Exo 2', sans-serif", color: '#9747FF' }}>
              {activeExpeditions}
            </div>
          </Card>
        </div>

        {/* Academy Progress with Milestones */}
        <AcademyProgress
          currentPrestige={historicalPrestige}
          targetPrestige={ACADEMY_PRESTIGE_THRESHOLD}
          isUnlocked={isAcademyUnlocked}
        />
        
        {/* Prestige Milestones System */}
        {!isAcademyUnlocked && <PrestigeMilestones />}
        
        {/* Academy Teaser */}
        {!isAcademyUnlocked && <AcademyTeaser />}

        {/* Story System Button */}
        <Card 
          className="border-[#FFC72C]/30 p-3 mt-3 cursor-pointer hover:border-[#FFC72C]/50 transition-colors"
          onClick={() => setShowStory(true)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: '#FFC72C20', border: '1px solid #FFC72C' }}
              >
                <BookOpen className="w-5 h-5" style={{ color: '#FFC72C' }} />
              </div>
              <div>
                <h3 className="text-sm font-medium" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                  {t('story.story_system') || 'Story System'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t('story.npcs_quests') || 'NPCs & Quests'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {storyState.activeQuests.length > 0 && (
                <Badge style={{ backgroundColor: '#FFC72C', color: '#0D1117', fontSize: '10px' }}>
                  {storyState.activeQuests.length} {t('quest.in_progress')}
                </Badge>
              )}
              <MessageCircle className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </Card>
      </div>

      {/* Story System Modal */}
      <StorySystem
        isOpen={showStory}
        onClose={() => setShowStory(false)}
        storyState={storyState}
        onInteractWithNpc={handleInteractWithNpc}
        onStartQuest={handleStartQuest}
        onCompleteQuest={handleCompleteQuest}
      />

      <div className="relative z-10">
        <h2 className="text-lg mb-3" style={{ fontFamily: "'Exo 2', sans-serif" }}>
          {t('expedition.buildings_title')}
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {buildings.map((building, index) => (
            <motion.div
              key={building.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <Card className="border-white/10 p-3 hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm flex-1" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                    {building.name}
                  </h3>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0" style={{ borderColor: '#FFC72C', color: '#FFC72C' }}>
                    {t('common.level')} {building.level}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{building.description}</p>
                <div className="text-xs px-2 py-1 rounded bg-primary/10" style={{ color: '#FFC72C' }}>
                  {building.bonus}
                </div>
                {(building.id === 'building-2' && activeExpeditions > 0) || building.id === 'building-3' ? (
                  <div className="mt-2 flex items-center gap-1">
                    <motion.div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: '#00E5FF' }}
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                    <span className="text-[10px]" style={{ color: '#00E5FF' }}>{t('common.active')}</span>
                  </div>
                ) : null}
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <NPCSystem />
    </div>
  );
}
