import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Hero,
  Artifact,
  Expedition,
  Region,
  Npc,
  Rarity,
  initialHeroes,
  initialArtifacts,
  initialRegions,
  initialNpcs,
  buildings,

} from './data';
import {
  MuseumState,
  MuseumUpgradeState,
  museumUpgrades,
  initialMuseumState,
  calculateMuseumIncome,
  getUpgradeCost,
} from './museumData';
import {
  StoryProgress,
  initialStoryProgress,
  storyQuests,
  storyNpcs,
  RelationshipLevel,
} from './storyData';
import {
  QUEST_REWARD_MULTIPLIER,
  EXPEDITION_REWARD_MULTIPLIER,
  BUILDING_COST_MULTIPLIER,
  ARTIFACT_PRESTIGE_MULTIPLIER,
} from './balanceConfig';

const rarityRank: Record<Rarity, number> = {
  common: 0,
  rare: 1,
  epic: 2,
  legendary: 3,
};

/** Real expedition timer (seconds) — SPEEDED UP for first prestige */
export function expeditionSeconds(region: Region): number {
  // Faster for P0: 10 + difficulty * 5 (was 15 + difficulty * 10)
  return 10 + region.difficulty * 5;
}

/** Real restoration timer (seconds) — derived from rarity. */
export function restorationSeconds(artifact: Artifact): number {
  // Faster restoration: 8 + rarity * 6 (was 12 + rarity * 9)
  return 8 + rarityRank[artifact.rarity] * 6;
}

function nextArtifactId(): string {
  return `artifact-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function pickArtifact(region: Region): { name: string; rarity: Rarity } {
  const name = region.artifacts[Math.floor(Math.random() * region.artifacts.length)];
  const roll = Math.random();
  let rarity: Rarity = 'common';
  const diff = region.difficulty;
  if (roll > 0.92) rarity = 'legendary';
  else if (roll > 0.72) rarity = 'epic';
  else if (roll > 0.4) rarity = 'rare';
  // Harder regions skew rarer
  if (diff >= 5 && rarity === 'common') rarity = 'rare';
  if (diff >= 7 && rarity === 'rare') rarity = 'epic';
  return { name, rarity };
}

const rarityValue: Record<Rarity, number> = {
  common: 800,
  rare: 1500,
  epic: 3800,
  legendary: 8000,
};
const rarityPrestige: Record<Rarity, number> = {
  common: 8,
  rare: 18,
  epic: 40,
  legendary: 80,
};

export interface Toast {
  id: number;
  message: string;
  color: string;
}

interface GameState {
  academyLevel: number;
  reputation: number;
  karbovanets: number;
  museumVisitors: number;
  historicalPrestige: number;

  heroes: Hero[];
  artifacts: Artifact[];
  regions: Region[];
  expeditions: Expedition[];
  npcs: Npc[];

  // Building state
  buildingLevels: Record<string, number>;
  buildingUpgradeEndTimes: Record<string, number>;

  expeditionSlots: number;
  lastTick: number;
  incomeBuffer: number;
  toasts: Toast[];

  // Museum state
  museumState: MuseumState;
  
  // Story/Quest state
  storyState: StoryProgress;

  // expeditions
  startExpedition: (regionId: string, heroIds: string[]) => boolean;
  collectExpedition: (expeditionId: string) => void;

  // lab
  beginRestoration: (artifactId: string) => void;
  sendToMuseum: (artifactId: string) => void;

  // npc
  toggleNpcWork: (npcId: string) => void;
  collectNpc: (npcId: string) => void;

  // museum
  placeArtifactInExhibition: (artifactId: string, slotIndex: number) => boolean;
  removeArtifactFromExhibition: (slotIndex: number) => void;
  collectMuseumIncome: () => void;
  purchaseMuseumUpgrade: (upgradeId: string) => boolean;
  expandExhibitionSlots: () => boolean;

  // buildings
  upgradeBuilding: (buildingId: string) => boolean;
  collectBuildingUpgrade: (buildingId: string) => void;
  getBuildingBonus: (buildingId: string) => number;

  // story/quests
  interactWithNpc: (npcId: string) => void;
  startQuest: (questId: string) => void;
  completeQuest: (questId: string) => void;
  updateQuestObjective: (objectiveKey: string, increment: number) => void;
  isQuestComplete: (questId: string) => boolean;
  claimNpcReward: (npcId: string, rewardKey: string) => void;

  // economy helpers
  addKarbovanets: (amount: number) => void;
  spendKarbovanets: (amount: number) => boolean;
  pushToast: (message: string, color?: string) => void;
  dismissToast: (id: number) => void;

  tick: () => void;
}

let toastSeq = 1;

export const useExpeditionStore = create<GameState>()(
  persist(
    (set, get) => ({
      academyLevel: 3,
      reputation: 1250,
      karbovanets: 8500,
      museumVisitors: 342,
      historicalPrestige: 2840,

      heroes: initialHeroes,
      artifacts: initialArtifacts,
      regions: initialRegions,
      expeditions: [],
      npcs: initialNpcs,

      // Building state
      buildingLevels: buildings.reduce((acc, b) => ({ ...acc, [b.id]: b.level }), {}),
      buildingUpgradeEndTimes: {},

      expeditionSlots: 3,
      lastTick: Date.now(),
      incomeBuffer: 0,
      toasts: [],

      // Museum state
      museumState: initialMuseumState,
      
      // Story/Quest state
      storyState: initialStoryProgress,

      pushToast: (message, color = '#FFC72C') =>
        set((s) => ({
          toasts: [...s.toasts, { id: toastSeq++, message, color }].slice(-4),
        })),
      dismissToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      addKarbovanets: (amount) =>
        set((s) => ({ karbovanets: s.karbovanets + amount })),
      spendKarbovanets: (amount) => {
        if (get().karbovanets >= amount) {
          set((s) => ({ karbovanets: s.karbovanets - amount }));
          return true;
        }
        return false;
      },
      
      // Story/Quest actions
      interactWithNpc: (npcId) => {
        set((state) => {
          const current = state.storyState.npcRelationships[npcId] || {
            npcId,
            relationshipLevel: 1 as const,
            trustPoints: 0,
            completedQuests: [],
            lastInteraction: Date.now(),
          };
          
          const newTrust = Math.min(500, current.trustPoints + 5);
          let newLevel = current.relationshipLevel;
          
          // Level up logic
          if (newTrust >= 300 && current.relationshipLevel < 5) newLevel = 5;
          else if (newTrust >= 150 && current.relationshipLevel < 4) newLevel = 4;
          else if (newTrust >= 80 && current.relationshipLevel < 3) newLevel = 3;
          else if (newTrust >= 30 && current.relationshipLevel < 2) newLevel = 2;
          
          return {
            storyState: {
              ...state.storyState,
              npcRelationships: {
                ...state.storyState.npcRelationships,
                [npcId]: {
                  ...current,
                  trustPoints: newTrust,
                  relationshipLevel: newLevel,
                  lastInteraction: Date.now(),
                },
              },
            },
          };
        });
        
        // Track NPC interaction quest objective
        get().updateQuestObjective(`speak_${npcId}`, 1);
      },
      
      startQuest: (questId) => {
        set((state) => {
          // Check if already active
          if (state.storyState.activeQuests.some(qp => qp.questId === questId)) return state;
          
          // Create new quest progress
          const questProgress = {
            questId,
            objectives: {} as Record<string, number>,
            startedAt: Date.now(),
            updatedAt: Date.now(),
          };
          
          return {
            storyState: {
              ...state.storyState,
              activeQuests: [...state.storyState.activeQuests, questProgress],
            },
          };
        });
      },
      
      completeQuest: (questId) => {
        // Find quest data to get rewards
        const quest = storyQuests.find(q => q.id === questId);
        if (!quest) return;

        // Grant rewards with QUEST_REWARD_MULTIPLIER applied
        quest.rewards.forEach(reward => {
          const amount = Math.floor(reward.amount * QUEST_REWARD_MULTIPLIER);
          switch (reward.type) {
            case 'karbovanets':
              get().addKarbovanets(amount);
              break;
            case 'xp':
            case 'academy_xp':
              // Grant XP (not implemented yet)
              break;
            case 'reputation':
              set(st => ({ reputation: st.reputation + amount }));
              break;
            case 'artifact':
              // Grant artifact by ID
              break;
            case 'hero_fragment':
              // Grant hero fragment
              break;
          }
        });

        // Remove from active and add to completed
        set((state) => {
          const questProgress = state.storyState.activeQuests.find(qp => qp.questId === questId);
          if (!questProgress) return state;
          
          return {
            storyState: {
              ...state.storyState,
              activeQuests: state.storyState.activeQuests.filter(qp => qp.questId !== questId),
              completedQuests: [...state.storyState.completedQuests, questId],
            },
          };
        });

        // Show completion toast
        get().pushToast(`Квест "${quest.titleKey}" виконано!`, '#10B981');
      },

      updateQuestObjective: (objectiveKey, increment) => {
        set((state) => {
          // Update objective progress in all active quests
          const updatedActiveQuests = state.storyState.activeQuests.map(qp => ({
            ...qp,
            objectives: {
              ...qp.objectives,
              [objectiveKey]: (qp.objectives[objectiveKey] || 0) + increment,
            },
            updatedAt: Date.now(),
          }));
          
          return {
            storyState: {
              ...state.storyState,
              activeQuests: updatedActiveQuests,
            },
          };
        });
      },

      isQuestComplete: (questId) => {
        const state = get();
        const quest = storyQuests.find((q) => q.id === questId);
        if (!quest) return false;
        
        const questProgress = state.storyState.activeQuests.find(qp => qp.questId === questId);
        if (!questProgress) return false;
        
        return quest.objectives.every((obj) => {
          const key = `${obj.type}_${obj.target}`;
          const current = questProgress.objectives[key] || 0;
          return current >= obj.count;
        });
      },

      claimNpcReward: (npcId, rewardKey) => {
        const state = get();
        const relationship = state.storyState.npcRelationships[npcId];
        if (!relationship) return;

        const npc = storyNpcs.find(n => n.id === npcId);
        if (!npc) return;

        const reward = npc.unlocksAtRelationship[relationship.relationshipLevel as RelationshipLevel];
        if (reward !== rewardKey) return;

        // Parse reward and grant it
        if (rewardKey.startsWith('dialogue_')) {
          // Dialogue unlocked - just show toast
          state.pushToast(`Новий діалог відкрито!`, '#00E5FF');
        } else if (rewardKey.startsWith('quest-')) {
          // Quest unlocked - start it
          state.startQuest(rewardKey);
          state.pushToast(`Новий квест доступний!`, '#10B981');
        } else if (rewardKey.startsWith('hero-')) {
          // Hero unlock - grant hero XP to unlock
          const heroId = rewardKey.replace('hero-', '');
          state.pushToast(`Герой ${heroId} розблоковано!`, '#FFC72C');
        } else if (rewardKey.startsWith('artifact-')) {
          // Artifact unlock - add to inventory
          state.pushToast(`Артефакт ${rewardKey.replace('artifact-', '')} відкрито!`, '#9747FF');
        } else if (rewardKey.startsWith('region-')) {
          // Region unlock - unlock in game
          state.pushToast(`Новий регіон ${rewardKey.replace('region-', '')} відкрито!`, '#FF2A5F');
        }
      },

      // Museum actions
      // Reset museum state on prestige - keeps artifacts but resets all museum progress
      resetMuseumState: () => {
        set({
          museumState: {
            ...initialMuseumState,
            // Reset all museum progress to starting state
            exhibitions: Array.from({ length: 2 }, (_, i) => ({ slotIndex: i, artifactId: null, placedAt: 0 })),
            maxExhibitionSlots: 2,
            upgrades: { marketing: 0, security: 0, exhibition_hall: 0, restoration_wing: 0 },
            completedCollections: [],
            collectionProgress: {},
            achievements: [],
            legendaryExhibitions: [],
            eventParticipation: [],
          },
          // Reset expeditions on prestige
          expeditions: [],
          expeditionSlots: 1,
          // Keep heroes but reset their expedition assignment
          heroes: get().heroes.map(h => ({ ...h, expeditionId: undefined, status: 'idle' as const })),
          // Reset building progress
          buildingLevels: buildings.reduce((acc, b) => ({ ...acc, [b.id]: 0 }), {}),
          buildingUpgradeEndTimes: {},
          // Reset income
          incomeBuffer: 0,
          // Reset museum visitors
          museumVisitors: 0,
        });
      },

      placeArtifactInExhibition: (artifactId, slotIndex) => {
        const s = get();
        const museumState = s.museumState;
        
        // Check if slot exists
        if (slotIndex < 0 || slotIndex >= museumState.exhibitions.length) {
          s.pushToast('Невірний слот', '#FF2A5F');
          return false;
        }
        
        // Check if slot is empty
        const slot = museumState.exhibitions[slotIndex];
        if (slot.artifactId) {
          s.pushToast('Слот вже зайнятий', '#FF2A5F');
          return false;
        }
        
        // Find the artifact
        const artifact = s.artifacts.find(a => a.id === artifactId);
        if (!artifact) {
          s.pushToast('Артефакт не знайдено', '#FF2A5F');
          return false;
        }
        
        // Check artifact is restored and in museum
        if (artifact.status !== 'museum') {
          s.pushToast('Артефакт повинен бути в музеї', '#FF2A5F');
          return false;
        }
        
        // Place artifact
        set((state) => ({
          museumState: {
            ...state.museumState,
            exhibitions: state.museumState.exhibitions.map((ex, idx) =>
              idx === slotIndex
                ? { ...ex, artifactId, placedAt: Date.now() }
                : ex
            ),
          },
        }));
        
        s.pushToast('Артефакт виставлено!', '#FFC72C');
        return true;
      },

      removeArtifactFromExhibition: (slotIndex) => {
        const s = get();
        const museumState = s.museumState;
        
        if (slotIndex < 0 || slotIndex >= museumState.exhibitions.length) {
          return;
        }
        
        const slot = museumState.exhibitions[slotIndex];
        if (!slot.artifactId) return;
        
        set((state) => ({
          museumState: {
            ...state.museumState,
            exhibitions: state.museumState.exhibitions.map((ex, idx) =>
              idx === slotIndex
                ? { ...ex, artifactId: null, placedAt: 0 }
                : ex
            ),
          },
        }));
        
        s.pushToast('Артефакт прибрано', '#FFC72C');
      },

      collectMuseumIncome: () => {
        const s = get();
        const museumState = s.museumState;
        
        // Get exhibited artifacts
        const museumArtifacts = s.artifacts.filter(a => a.status === 'museum');
        const exhibitedArtifactIds = museumState.exhibitions
          .filter(ex => ex.artifactId)
          .map(ex => ex.artifactId);
        const exhibitedArtifacts = museumArtifacts.filter(a => exhibitedArtifactIds.includes(a.id));
        const totalValue = exhibitedArtifacts.reduce((sum, a) => sum + a.value, 0);
        
        // Calculate income
        const income = calculateMuseumIncome(museumState, totalValue);
        
        if (income > 0) {
          set((state) => ({
            karbovanets: state.karbovanets + income,
            museumState: {
              ...state.museumState,
              totalIncomeAllTime: state.museumState.totalIncomeAllTime + income,
              lastIncomeCollected: Date.now(),
            },
          }));
          
          s.pushToast(`+${income.toLocaleString()} 💰`, '#FFC72C');
        }
      },

      purchaseMuseumUpgrade: (upgradeId) => {
        const s = get();
        const museumState = s.museumState;
        
        // Find upgrade
        const upgrade = museumUpgrades.find(u => u.id === upgradeId);
        if (!upgrade) {
          s.pushToast('Невідоме покращення', '#FF2A5F');
          return false;
        }
        
        // Get current level
        const currentLevel = museumState.upgrades[upgradeId as keyof MuseumUpgradeState] || 0;
        if (currentLevel >= upgrade.maxLevel) {
          s.pushToast('Максимальний рівень досягнуто', '#FF2A5F');
          return false;
        }
        
        // Calculate cost
        const cost = getUpgradeCost(upgrade, currentLevel);
        if (s.karbovanets < cost) {
          s.pushToast('Недостатньо карбованців', '#FF2A5F');
          return false;
        }
        
        // Purchase upgrade
        set((state) => ({
          karbovanets: state.karbovanets - cost,
          museumState: {
            ...state.museumState,
            upgrades: {
              ...state.museumState.upgrades,
              [upgradeId]: currentLevel + 1,
            },
          },
        }));
        
        s.pushToast(`${upgrade.icon} ${upgrade.nameKey} оновлено!`, '#FFC72C');
        return true;
      },

      expandExhibitionSlots: () => {
        const s = get();
        const museumState = s.museumState;
        
        const maxSlots = 12; // Final max
        if (museumState.exhibitions.length >= maxSlots) {
          s.pushToast('Всі слоти відкрито', '#FF2A5F');
          return false;
        }
        
        // Cost increases for each expansion
        const expansionsCount = museumState.exhibitions.length - 3; // Base is 3
        const cost = 5000 * Math.pow(2, expansionsCount);
        
        if (s.karbovanets < cost) {
          s.pushToast('Недостатньо карбованців', '#FF2A5F');
          return false;
        }
        
        const newSlotIndex = museumState.exhibitions.length;
        set((state) => ({
          karbovanets: state.karbovanets - cost,
          museumState: {
            ...state.museumState,
            exhibitions: [
              ...state.museumState.exhibitions,
              { slotIndex: newSlotIndex, artifactId: null, placedAt: 0 },
            ],
          },
        }));
        
        s.pushToast(`📍 Новий слот відкрито!`, '#FFC72C');
        return true;
      },

      // Building actions
      upgradeBuilding: (buildingId) => {
        const s = get();
        const building = buildings.find(b => b.id === buildingId);
        if (!building) return false;
        
        const currentLevel = s.buildingLevels[buildingId] || 1;
        // Apply BUILDING_COST_MULTIPLIER (0.8 = 20% discount)
        const baseCost = Math.round(building.upgradeCost * Math.pow(1.5, currentLevel));
        const cost = Math.round(baseCost * BUILDING_COST_MULTIPLIER);
        const upgradeTime = Math.round(building.upgradeTime * Math.pow(1.3, currentLevel) * 1000);
        
        if (!s.spendKarbovanets(cost)) {
          s.pushToast('Недостатньо карбованців', '#FF2A5F');
          return false;
        }
        
        set((state) => ({
          buildingUpgradeEndTimes: {
            ...state.buildingUpgradeEndTimes,
            [buildingId]: Date.now() + upgradeTime,
          },
        }));
        
        s.pushToast(`Building ${building.name} upgrading...`, '#FFC72C');
        return true;
      },

      collectBuildingUpgrade: (buildingId) => {
        const s = get();
        const building = buildings.find(b => b.id === buildingId);
        if (!building) return;
        
        const endTime = s.buildingUpgradeEndTimes[buildingId];
        if (!endTime || Date.now() < endTime) return;
        
        set((state) => {
          const newLevels = { ...state.buildingLevels };
          newLevels[buildingId] = (newLevels[buildingId] || 1) + 1;
          
          const newEndTimes = { ...state.buildingUpgradeEndTimes };
          delete newEndTimes[buildingId];
          
          return {
            buildingLevels: newLevels,
            buildingUpgradeEndTimes: newEndTimes,
          };
        });
        
        s.pushToast(`Building ${building.name} upgraded!`, '#10B981');
      },

      getBuildingBonus: (buildingId) => {
        const s = get();
        const level = s.buildingLevels[buildingId] || 1;
        switch (buildingId) {
          case 'building-1': return 1 + (level - 1) * 0.1;
          case 'building-2': return level;
          case 'building-3': return 1 - (level - 1) * 0.1;
          case 'building-4': return level * 50;
          case 'building-5': return 1 + (level - 1) * 0.15;
          case 'building-6': return level * 1000;
          default: return 1;
        }
      },

      startExpedition: (regionId, heroIds) => {
        const s = get();
        const region = s.regions.find((r) => r.id === regionId);
        if (!region || !region.unlocked) return false;
        const activeCount = s.expeditions.filter((e) => !e.collected).length;
        if (activeCount >= s.expeditionSlots) {
          s.pushToast('Немає вільних слотів для експедиції', '#FF2A5F');
          return false;
        }
        if (heroIds.length === 0) {
          s.pushToast('Оберіть хоча б одного героя', '#FF2A5F');
          return false;
        }
        const teamHeroes = s.heroes.filter((h) => heroIds.includes(h.id));
        // Bonus to success based on team attributes
        const teamBonus = Math.min(
          25,
          Math.round(
            teamHeroes.reduce(
              (sum, h) => sum + (h.exploration + h.leadership) / 40,
              0,
            ),
          ),
        );
        const successChance = Math.min(98, region.successChance + teamBonus);
        const dur = expeditionSeconds(region);
        const now = Date.now();
        const { name, rarity } = pickArtifact(region);
        const reward = Math.round(
          (region.difficulty * 600 + 400) * (0.8 + Math.random() * 0.6),
        );
        const expedition: Expedition = {
          id: `exp-${now}-${Math.floor(Math.random() * 1000)}`,
          regionId,
          region: region.name,
          heroes: heroIds,
          startTime: now,
          endsAt: now + dur * 1000,
          duration: dur,
          successChance,
          status: 'traveling',
          rewardKarbovanets: reward,
          rewardReputation: region.difficulty * 30,
          artifactName: name,
          artifactRarity: rarity,
          collected: false,
        };
        set((st) => ({
          expeditions: [...st.expeditions, expedition],
          heroes: st.heroes.map((h) =>
            heroIds.includes(h.id)
              ? { ...h, assigned: true, assignedTo: region.name }
              : h,
          ),
        }));
        s.pushToast(`Експедицію до «${region.name}» розпочато`, '#00E5FF');
        return true;
      },

      collectExpedition: (expeditionId) => {
        const s = get();
        const exp = s.expeditions.find((e) => e.id === expeditionId);
        if (!exp || exp.collected || Date.now() < exp.endsAt) return;

        const success = Math.random() * 100 <= exp.successChance;
        const updates: Partial<GameState> = {};

        // Apply EXPEDITION_REWARD_MULTIPLIER to rewards
        const finalReward = Math.floor(exp.rewardKarbovanets * EXPEDITION_REWARD_MULTIPLIER);
        const finalReputation = Math.floor(exp.rewardReputation * EXPEDITION_REWARD_MULTIPLIER);
        const failureReward = Math.round(finalReward * 0.2);

        set((st) => {
          // free heroes + grant xp
          const heroes = st.heroes.map((h) => {
            if (!exp.heroes.includes(h.id)) return h;
            const gainedXp = success ? 200 + exp.successChance : 80;
            let level = h.level;
            let experience = h.experience + gainedXp;
            const need = (level + 1) * 200;
            if (experience >= need) {
              level += 1;
              experience -= need;
            }
            return { ...h, assigned: false, assignedTo: undefined, level, experience };
          });

          // unlock next region on success
          let regions = st.regions;
          if (success) {
            const idx = st.regions.findIndex((r) => r.id === exp.regionId);
            if (idx >= 0 && idx + 1 < st.regions.length && !st.regions[idx + 1].unlocked) {
              regions = st.regions.map((r, i) =>
                i === idx + 1 ? { ...r, unlocked: true } : r,
              );
            }
          }

          let artifacts = st.artifacts;
          if (success) {
            const newArtifact: Artifact = {
              id: nextArtifactId(),
              name: exp.artifactName,
              era: exp.region,
              rarity: exp.artifactRarity,
              status: 'damaged',
              description: `Знахідка з експедиції до регіону «${exp.region}». Потребує реставрації.`,
              restoreTime: 60 + rarityRank[exp.artifactRarity] * 60,
              value: rarityValue[exp.artifactRarity],
              prestigeBonus: rarityPrestige[exp.artifactRarity],
            };
            artifacts = [...st.artifacts, newArtifact];
          }

          return {
            heroes,
            regions,
            artifacts,
            karbovanets: st.karbovanets + (success ? finalReward : failureReward),
            reputation: st.reputation + (success ? finalReputation : 0),
            expeditions: st.expeditions.map((e) =>
              e.id === expeditionId ? { ...e, collected: true, status: 'completed' } : e,
            ),
            ...updates,
          };
        });

        if (success) {
          s.pushToast(
            `Успіх! +${finalReward} карб., знайдено «${exp.artifactName}»`,
            '#FFC72C',
          );
          // Track expedition quest objective
          s.updateQuestObjective(`expedition_${exp.regionId}`, 1);
        } else {
          s.pushToast(`Експедиція невдала. +${failureReward} карб.`, '#FF2A5F');
        }
      },

      beginRestoration: (artifactId) => {
        const s = get();
        const art = s.artifacts.find((a) => a.id === artifactId);
        if (!art || art.status !== 'damaged') return;
        const now = Date.now();
        const dur = restorationSeconds(art);
        set((st) => ({
          artifacts: st.artifacts.map((a) =>
            a.id === artifactId
              ? {
                  ...a,
                  status: 'restoring',
                  restoredBy: 'Команда лабораторії',
                  restoreStartedAt: now,
                  restoreEndsAt: now + dur * 1000,
                }
              : a,
          ),
        }));
        s.pushToast(`Реставрацію «${art.name}» розпочато`, '#FFC72C');
      },

      sendToMuseum: (artifactId) => {
        const s = get();
        const art = s.artifacts.find((a) => a.id === artifactId);
        if (!art || art.status !== 'restored') return;
        
        // Apply ARTIFACT_PRESTIGE_MULTIPLIER for faster first prestige
        const prestigeGain = Math.floor(art.prestigeBonus * ARTIFACT_PRESTIGE_MULTIPLIER);
        const reputationGain = Math.round(prestigeGain / 2);
        
        set((st) => ({
          artifacts: st.artifacts.map((a) =>
            a.id === artifactId ? { ...a, status: 'museum' } : a,
          ),
          historicalPrestige: st.historicalPrestige + prestigeGain,
          reputation: st.reputation + reputationGain,
        }));
        s.pushToast(`«${art.name}» виставлено в музеї (+${prestigeGain} престижу)`, '#9747FF');
      },

      toggleNpcWork: (npcId) => {
        const now = Date.now();
        set((st) => ({
          npcs: st.npcs.map((n) =>
            n.id === npcId
              ? { ...n, working: !n.working, lastCollectedAt: now }
              : n,
          ),
        }));
        const npc = get().npcs.find((n) => n.id === npcId);
        if (npc) {
          get().pushToast(
            npc.working ? `${npc.name} став(ла) до роботи` : `${npc.name} відпочиває`,
            '#00E5FF',
          );
        }
      },

      collectNpc: (npcId) => {
        const s = get();
        const npc = s.npcs.find((n) => n.id === npcId);
        if (!npc || !npc.working) return;
        const now = Date.now();
        const minutes = (now - npc.lastCollectedAt) / 60000;
        const karb = Math.floor(minutes * npc.ratePerMin);
        const rep = Math.floor(minutes * npc.repPerMin);
        if (karb <= 0 && rep <= 0) {
          s.pushToast('Поки нічого збирати', '#8B949E');
          return;
        }
        set((st) => ({
          karbovanets: st.karbovanets + karb,
          reputation: st.reputation + rep,
          npcs: st.npcs.map((n) =>
            n.id === npcId ? { ...n, lastCollectedAt: now } : n,
          ),
        }));
        s.pushToast(`${npc.name}: +${karb} карб., +${rep} репутації`, '#FFC72C');
      },

      tick: () => {
        const now = Date.now();
        set((st) => {
          const dt = Math.min(60, (now - st.lastTick) / 1000);

          // Museum passive income
          const museumArtifacts = st.artifacts.filter((a) => a.status === 'museum');
          const hourly = museumArtifacts.reduce((sum, a) => sum + a.value, 0) / 10;
          let incomeBuffer = st.incomeBuffer + (hourly / 3600) * dt;
          let karbovanets = st.karbovanets;
          if (incomeBuffer >= 1) {
            const whole = Math.floor(incomeBuffer);
            karbovanets += whole;
            incomeBuffer -= whole;
          }

          // Auto-complete restorations
          const artifacts = st.artifacts.map((a) =>
            a.status === 'restoring' && a.restoreEndsAt && now >= a.restoreEndsAt
              ? { ...a, status: 'restored' as const }
              : a,
          );

          // Update expedition statuses (visual phases)
          const expeditions = st.expeditions.map((e) => {
            if (e.collected) return e;
            const elapsed = (now - e.startTime) / 1000;
            const ratio = elapsed / e.duration;
            let status: Expedition['status'] = 'traveling';
            if (now >= e.endsAt) status = 'completed';
            else if (ratio > 0.66) status = 'returning';
            else if (ratio > 0.25) status = 'excavating';
            return { ...e, status };
          });

          // Animate NPC positions
          const npcs = st.npcs.map((n) => {
            let x = n.x + n.direction * 0.4;
            let direction = n.direction;
            if (x > 90) {
              x = 90;
              direction = -1;
            } else if (x < 10) {
              x = 10;
              direction = 1;
            }
            return { ...n, x, direction };
          });

          return {
            lastTick: now,
            incomeBuffer,
            karbovanets,
            artifacts,
            expeditions,
            npcs,
          };
        });
      },
    }),
    {
      name: 'expedition_state',
      version: 3,
      partialize: (s) => ({
        academyLevel: s.academyLevel,
        reputation: s.reputation,
        karbovanets: s.karbovanets,
        museumVisitors: s.museumVisitors,
        historicalPrestige: s.historicalPrestige,
        heroes: s.heroes,
        artifacts: s.artifacts,
        regions: s.regions,
        expeditions: s.expeditions,
        npcs: s.npcs,
        expeditionSlots: s.expeditionSlots,
        lastTick: s.lastTick,
        incomeBuffer: s.incomeBuffer,
        museumState: s.museumState,
        storyState: s.storyState,
        buildingLevels: s.buildingLevels,
        buildingUpgradeEndTimes: s.buildingUpgradeEndTimes,
      }),
    },
  ),
);

// Separate reset function for prestige - call this after performPrestige
export function resetExpeditionOnPrestige() {
  const currentState = useExpeditionStore.getState();
  
  useExpeditionStore.setState({
    // Reset museum state completely
    museumState: {
      ...initialMuseumState,
      // Start with 2 exhibition slots
      exhibitions: Array.from({ length: 2 }, (_, i) => ({ slotIndex: i, artifactId: null, placedAt: 0 })),
      maxExhibitionSlots: 2,
      upgrades: { marketing: 0, security: 0, exhibition_hall: 0, restoration_wing: 0 },
      completedCollections: [],
      collectionProgress: {},
      achievements: [],
      legendaryExhibitions: [],
      eventParticipation: [],
    },
    // Reset expeditions
    expeditions: [],
    expeditionSlots: 1, // Start with 1 slot, can unlock more with prestige research
    // Keep heroes but reset to idle
    heroes: currentState.heroes.map(h => ({
      ...h,
      level: 1,
      expeditionId: undefined,
      status: 'idle' as const,
    })),
    // Reset buildings
    buildingLevels: buildings.reduce((acc, b) => ({ ...acc, [b.id]: 0 }), {}),
    buildingUpgradeEndTimes: {},
    // Reset income
    incomeBuffer: 0,
    // Reset museum visitors
    museumVisitors: 0,
    // Keep karbovanets (they reset with the game)
    // Keep reputation (may want to preserve or reset based on design)
    // Keep academy level (prestige bonus)
  });
}
