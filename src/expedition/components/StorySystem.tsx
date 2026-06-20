import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageCircle, Star, Users, Map, Gift, ChevronRight } from 'lucide-react';
import { Card, Badge, Button } from '../ui';
import { useTranslation } from '../../i18n';
import { 
  storyNpcs, 
  storyQuests, 
  type StoryNpc, 
  type StoryQuest,
  type NpcRelationship,
  type RelationshipLevel,
  type StoryProgress 
} from '../storyData';

interface StorySystemProps {
  isOpen: boolean;
  onClose: () => void;
  storyState: StoryProgress;
  onInteractWithNpc: (npcId: string) => void;
  onStartQuest: (questId: string) => void;
  onClaimReward?: (npcId: string, rewardKey: string) => void;
}

type Tab = 'npcs' | 'quests';

export function StorySystem({
  isOpen,
  onClose,
  storyState,
  onInteractWithNpc,
  onStartQuest,
  onCompleteQuest,
  onClaimReward,
}: StorySystemProps & { onCompleteQuest?: (questId: string) => void }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('npcs');
  const [selectedNpc, setSelectedNpc] = useState<StoryNpc | null>(null);
  const [npcDialogue, setNpcDialogue] = useState<string>('');

  const getRelationship = (npcId: string): NpcRelationship => {
    return storyState.npcRelationships[npcId] || {
      npcId,
      relationshipLevel: 1,
      trustPoints: 0,
      completedQuests: [],
      lastInteraction: 0,
    };
  };

  const getNpcDialogue = (npc: StoryNpc): string => {
    const relationship = getRelationship(npc.id);
    const level = relationship.relationshipLevel;
    const dialogues = level >= 2 
      ? [...npc.dialogues.greeting, ...npc.dialogues.relationship[level as RelationshipLevel] || []]
      : npc.dialogues.greeting;
    return dialogues[Math.floor(Math.random() * dialogues.length)];
  };

  const handleNpcClick = (npc: StoryNpc) => {
    setSelectedNpc(npc);
    setNpcDialogue(getNpcDialogue(npc));
    onInteractWithNpc(npc.id);
  };

  const handleTalk = () => {
    if (selectedNpc) {
      setNpcDialogue(getNpcDialogue(selectedNpc));
      onInteractWithNpc(selectedNpc.id);
    }
  };

  const availableQuests = storyQuests.filter(q => {
    const relationship = getRelationship(q.npcId);
    const activeIds = storyState.activeQuests.map(qp => qp.questId);
    return relationship.relationshipLevel >= q.requiredRelationshipLevel && 
           !activeIds.includes(q.id) && 
           !storyState.completedQuests.includes(q.id);
  });

  const activeQuestsList = storyQuests.filter(q => 
    storyState.activeQuests.some(qp => qp.questId === q.id)
  );
  const completedQuests = storyQuests.filter(q => 
    storyState.completedQuests.includes(q.id)
  );

  const getQuestProgress = (quest: StoryQuest) => {
    const questProgress = storyState.activeQuests.find(qp => qp.questId === quest.id);
    if (!questProgress) return 0;
    
    const total = quest.objectives.reduce((sum, obj) => sum + obj.count, 0);
    const current = quest.objectives.reduce((sum, obj) => {
      const progress = questProgress.objectives[`${obj.type}_${obj.target}`] || 0;
      return sum + Math.min(progress, obj.count);
    }, 0);
    return Math.round((current / total) * 100);
  };

  const getObjectiveProgress = (quest: StoryQuest) => {
    const questProgress = storyState.activeQuests.find(qp => qp.questId === quest.id);
    if (!questProgress) return [];
    
    return quest.objectives.map(obj => {
      const key = `${obj.type}_${obj.target}`;
      const current = questProgress.objectives[key] || 0;
      const completed = current >= obj.count;
      
      // Translate objective type
      let label = '';
      switch (obj.type) {
        case 'expedition':
          label = t('quest.objective_expedition');
          break;
        case 'speak':
          label = t('quest.objective_speak');
          break;
        case 'visit':
          label = t('quest.objective_visit');
          break;
        case 'prestige':
          label = t('quest.objective_prestige');
          break;
        case 'build':
          label = t('quest.objective_build');
          break;
        case 'collect':
          label = t('quest.objective_collect');
          break;
        default:
          label = obj.type;
      }
      
      return {
        ...obj,
        current,
        completed,
        label: `${label}: ${current}/${obj.count}`,
      };
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-lg h-[85vh] bg-[#161B22] rounded-t-3xl border-t border-white/10 flex flex-col"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-lg" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                {t('expedition.story_system') || 'Story System'}
              </h2>
              <button onClick={onClose} className="p-2 text-muted-foreground hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10">
              <button
                onClick={() => setActiveTab('npcs')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'npcs' 
                    ? 'text-[#FFC72C] border-b-2 border-[#FFC72C]' 
                    : 'text-muted-foreground'
                }`}
              >
                <Users className="w-4 h-4 mx-auto mb-1" />
                {t('npc.story_npcs') || 'NPCs'}
              </button>
              <button
                onClick={() => setActiveTab('quests')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'quests' 
                    ? 'text-[#FFC72C] border-b-2 border-[#FFC72C]' 
                    : 'text-muted-foreground'
                }`}
              >
                <Map className="w-4 h-4 mx-auto mb-1" />
                {t('quest.quests') || 'Quests'}
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'npcs' && (
                <div className="space-y-3">
                  {selectedNpc ? (
                    // NPC Detail View
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <Card className="border-white/10 p-4">
                        <div className="flex items-start gap-4 mb-4">
                          <div
                            className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
                            style={{ 
                              backgroundColor: `${selectedNpc.backgroundColor}30`,
                              border: `2px solid ${selectedNpc.backgroundColor}`
                            }}
                          >
                            {selectedNpc.portrait}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-base font-bold" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                              {t(selectedNpc.nameKey)}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {t(selectedNpc.roleKey)}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge 
                                style={{ 
                                  backgroundColor: selectedNpc.rarity === 'legendary' ? '#FF2A5F' : 
                                                  selectedNpc.rarity === 'epic' ? '#9747FF' :
                                                  selectedNpc.rarity === 'rare' ? '#00E5FF' : '#8B949E',
                                  color: '#0D1117',
                                  fontSize: '9px'
                                }}
                              >
                                {t(`artifacts.rarity_${selectedNpc.rarity}`)}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {t('npc.relationship')}: {getRelationship(selectedNpc.id).relationshipLevel}
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground mb-4">
                          {t(selectedNpc.biographyKey)}
                        </p>

                        {/* Dialogue */}
                        <div className="bg-[#0D1117] rounded-xl p-3 mb-4 border border-white/5">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageCircle className="w-4 h-4 text-[#00E5FF]" />
                            <span className="text-xs text-muted-foreground">{t('npc.dialogue')}</span>
                          </div>
                          <p className="text-sm italic">"{npcDialogue}"</p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button 
                            onClick={handleTalk}
                            variant="outline"
                            className="flex-1"
                            style={{ borderColor: '#00E5FF', color: '#00E5FF' }}
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            {t('expedition.npc_talk')}
                          </Button>
                          <Button
                            onClick={() => setSelectedNpc(null)}
                            variant="outline"
                            className="px-3"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>

                      {/* NPC Quests */}
                      <h4 className="text-sm font-medium mt-4 mb-2">{t('quest.quests')}:</h4>
                      <div className="space-y-2">
                        {storyQuests
                          .filter(q => q.npcId === selectedNpc.id)
                          .filter(q => getRelationship(selectedNpc.id).relationshipLevel >= q.requiredRelationshipLevel)
                          .map(quest => {
                            const isActive = storyState.activeQuests.some(qp => qp.questId === quest.id);
                            const objectives = getObjectiveProgress(quest);
                            const allComplete = objectives.every(o => o.completed);
                            
                            return (
                              <Card key={quest.id} className="border-white/10 p-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <h5 className="text-sm font-medium">{t(quest.titleKey)}</h5>
                                    <p className="text-xs text-muted-foreground">{t(quest.descriptionKey)}</p>
                                    {/* Show objectives if active */}
                                    {isActive && objectives.length > 0 && (
                                      <div className="mt-2 space-y-1">
                                        {objectives.map((obj, i) => (
                                          <div key={i} className="flex items-center gap-2 text-xs">
                                            <span style={{ color: obj.completed ? '#10B981' : '#8B949E' }}>
                                              {obj.completed ? '✓' : '○'}
                                            </span>
                                            <span className={obj.completed ? 'text-green-400' : 'text-muted-foreground'}>
                                              {obj.label}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  {isActive ? (
                                    allComplete ? (
                                      <Button
                                        onClick={() => onCompleteQuest ? onCompleteQuest(quest.id) : onStartQuest(quest.id)}
                                        style={{ backgroundColor: '#10B981', color: '#0D1117', padding: '4px 12px', fontSize: '12px' }}
                                      >
                                        {t('quest.completed')}
                                      </Button>
                                    ) : (
                                      <Badge style={{ backgroundColor: '#FFC72C', color: '#0D1117' }}>
                                        {getQuestProgress(quest)}%
                                      </Badge>
                                    )
                                  ) : getRelationship(selectedNpc.id).completedQuests.includes(quest.id) ? (
                                    <Badge style={{ backgroundColor: '#10B981', color: '#0D1117' }}>
                                      ✓
                                    </Badge>
                                  ) : (
                                    <Button 
                                      onClick={() => onStartQuest(quest.id)}
                                      style={{ backgroundColor: '#00E5FF', color: '#0D1117', padding: '4px 12px', fontSize: '12px' }}
                                    >
                                      {t('quest.start')}
                                    </Button>
                                  )}
                                </div>
                              </Card>
                            );
                          })}
                      </div>

                      {/* NPC Relationship Rewards */}
                      {selectedNpc && (() => {
                        const relationship = getRelationship(selectedNpc.id);
                        const currentLevel = relationship.relationshipLevel as RelationshipLevel;
                        const nextReward = selectedNpc.unlocksAtRelationship[currentLevel];
                        
                        if (!nextReward) return null;
                        
                        return (
                          <Card className="border-[#FFC72C]/30 p-4 mt-4">
                            <div className="flex items-center gap-3">
                              <Gift className="w-6 h-6 text-[#FFC72C]" />
                              <div className="flex-1">
                                <div className="text-sm font-medium text-[#FFC72C]">
                                  {t('npc.reward_available')}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {nextReward.startsWith('dialogue_') && t('npc.reward_dialogue')}
                                  {nextReward.startsWith('quest-') && t('npc.reward_quest')}
                                  {nextReward.startsWith('hero-') && t('npc.reward_hero')}
                                  {nextReward.startsWith('artifact-') && t('npc.reward_artifact')}
                                  {nextReward.startsWith('region-') && t('npc.reward_region')}
                                </div>
                              </div>
                              <Button
                                onClick={() => onClaimReward?.(selectedNpc.id, nextReward)}
                                style={{ backgroundColor: '#FFC72C', color: '#0D1117', padding: '4px 12px', fontSize: '12px' }}
                              >
                                {t('npc.claim')}
                              </Button>
                            </div>
                          </Card>
                        );
                      })()}
                    </motion.div>
                  ) : (
                    // NPC List
                    storyNpcs.map(npc => {
                      const relationship = getRelationship(npc.id);
                      return (
                        <motion.div
                          key={npc.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <Card 
                            className="border-white/10 p-3 cursor-pointer hover:border-white/20 transition-colors"
                            onClick={() => handleNpcClick(npc)}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                                style={{ 
                                  backgroundColor: `${npc.backgroundColor}30`,
                                  border: `1px solid ${npc.backgroundColor}`
                                }}
                              >
                                {npc.portrait}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-medium">{t(npc.nameKey)}</h4>
                                  <Badge 
                                    className="text-[8px] px-1"
                                    style={{ 
                                      backgroundColor: npc.backgroundColor,
                                      color: '#0D1117'
                                    }}
                                  >
                                    {relationship.relationshipLevel}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">{t(npc.roleKey)}</p>
                              </div>
                              <ChevronRight className="w-5 h-5 text-muted-foreground" />
                            </div>
                          </Card>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              )}

              {activeTab === 'quests' && (
                <div className="space-y-4">
                  {/* Available Quests */}
                  {availableQuests.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-[#FFC72C]">
                        {t('quest.available')} ({availableQuests.length})
                      </h4>
                      <div className="space-y-2">
                        {availableQuests.map(quest => (
                          <Card key={quest.id} className="border-white/10 p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h5 className="text-sm font-medium">{t(quest.titleKey)}</h5>
                                <p className="text-xs text-muted-foreground">{t(quest.descriptionKey)}</p>
                              </div>
                              <Button 
                                onClick={() => onStartQuest(quest.id)}
                                style={{ backgroundColor: '#00E5FF', color: '#0D1117', padding: '4px 12px', fontSize: '12px' }}
                              >
                                {t('quest.start')}
                              </Button>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <Gift className="w-3 h-3 text-[#FFC72C]" />
                              <span className="text-muted-foreground">
                                {quest.rewards.map(r => `${r.amount} ${t(`quest.reward_${r.type}`)}`).join(', ')}
                              </span>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Active Quests */}
                  {activeQuestsList.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-[#00E5FF]">
                        {t('quest.in_progress')} ({activeQuestsList.length})
                      </h4>
                      <div className="space-y-2">
                        {activeQuestsList.map(quest => {
                          const npc = storyNpcs.find(n => n.id === quest.npcId);
                          const progress = getQuestProgress(quest);
                          return (
                            <Card key={quest.id} className="border-[#FFC72C]/30 p-3">
                              <div className="flex items-start gap-2 mb-2">
                                <span className="text-xl">{npc?.portrait}</span>
                                <div className="flex-1">
                                  <h5 className="text-sm font-medium">{t(quest.titleKey)}</h5>
                                  <p className="text-xs text-muted-foreground">{t(quest.descriptionKey)}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex-1 h-2 bg-[#0D1117] rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-[#FFC72C] rounded-full transition-all"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                                <span className="text-xs text-[#FFC72C]">{progress}%</span>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Completed Quests */}
                  {completedQuests.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-[#10B981]">
                        {t('quest.completed')} ({completedQuests.length})
                      </h4>
                      <div className="space-y-2">
                        {completedQuests.slice(0, 5).map(quest => {
                          const npc = storyNpcs.find(n => n.id === quest.npcId);
                          return (
                            <Card key={quest.id} className="border-[#10B981]/30 p-3 opacity-70">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">{npc?.portrait}</span>
                                <div>
                                  <h5 className="text-sm font-medium line-through">{t(quest.titleKey)}</h5>
                                </div>
                                <Star className="w-4 h-4 text-[#10B981] ml-auto" />
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {availableQuests.length === 0 && activeQuestsList.length === 0 && completedQuests.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>{t('quest.no_quests') || 'No quests available'}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
