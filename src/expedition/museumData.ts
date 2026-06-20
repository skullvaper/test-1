/**
 * Museum System Data - Extended for Endgame
 * 
 * Contains:
 * - Museum Collections (5 base + 3 legendary)
 * - Museum Upgrades
 * - Reputation Levels (10 tiers)
 * - Museum Rankings (global leaderboard)
 * - Exhibition Events (themed time-limited)
 * - Museum Achievements
 * - Legendary Exhibitions
 */

// ═══════════════════════════════════════════════════════════════════════
// COLLECTIONS
import { MUSEUM_INCOME_MULTIPLIER } from './balanceConfig';
// ═══════════════════════════════════════════════════════════════════════

export interface Collection {
  id: string;
  nameKey: string;        // i18n key
  era: string;            // Matching era from artifacts
  artifacts: string[];     // Required artifact IDs or patterns
  requiredCount: number;  // Number needed to complete
  bonus: MuseumBonus;     // Permanent bonus on completion
  icon: string;           // Emoji icon
  tier: 1 | 2 | 3;        // Difficulty tier
}

export interface MuseumBonus {
  reputationBonus: number;     // Flat reputation bonus
  visitorBonus: number;       // Percentage visitor bonus
  incomeBonus: number;         // Percentage income bonus
  karbovanetsBonus: number;   // Flat karbovanets bonus on completion
  uniqueBonus?: string;        // Special unique bonus
}

export const museumCollections: Collection[] = [
  // Tier 1 - Basic (Era-based)
  {
    id: 'collection_trypillia',
    nameKey: 'museum.collection_trypillia',
    era: 'Трипілля',
    artifacts: ['bull', 'idol', 'vessel', 'ceramic', 'figurine'],
    requiredCount: 5,
    bonus: {
      reputationBonus: 500,
      visitorBonus: 10,
      incomeBonus: 5,
      karbovanetsBonus: 1000,
    },
    icon: '🏺',
    tier: 1,
  },
  {
    id: 'collection_scythia',
    nameKey: 'museum.collection_scythia',
    era: 'Скіфія',
    artifacts: ['gold', 'arrow', 'sword', 'armor', 'crown'],
    requiredCount: 5,
    bonus: {
      reputationBonus: 800,
      visitorBonus: 15,
      incomeBonus: 8,
      karbovanetsBonus: 2000,
    },
    icon: '⚔️',
    tier: 1,
  },
  {
    id: 'collection_kyiv_rus',
    nameKey: 'museum.collection_kyiv_rus',
    era: 'Київська Русь',
    artifacts: ['icon', 'cross', 'seal', 'manuscript', 'chalice'],
    requiredCount: 5,
    bonus: {
      reputationBonus: 1200,
      visitorBonus: 20,
      incomeBonus: 12,
      karbovanetsBonus: 3500,
    },
    icon: '⛪',
    tier: 1,
  },
  {
    id: 'collection_cossack',
    nameKey: 'museum.collection_cossack',
    era: 'Козаччина',
    artifacts: ['sword', 'pistol', 'seal', 'flag', 'mace'],
    requiredCount: 5,
    bonus: {
      reputationBonus: 1500,
      visitorBonus: 25,
      incomeBonus: 15,
      karbovanetsBonus: 5000,
    },
    icon: '🗡️',
    tier: 1,
  },
  {
    id: 'collection_independence',
    nameKey: 'museum.collection_independence',
    era: 'Незалежність',
    artifacts: ['flag', 'trident', 'constitution', 'coat', 'stamp'],
    requiredCount: 5,
    bonus: {
      reputationBonus: 2000,
      visitorBonus: 30,
      incomeBonus: 20,
      karbovanetsBonus: 10000,
    },
    icon: '🏴',
    tier: 1,
  },
  // Tier 2 - Cross-Era Collections
  {
    id: 'collection_golden_age',
    nameKey: 'museum.collection_golden_age',
    era: 'Золота доба',
    artifacts: ['gold', 'treasure', 'crown', 'chalice', 'idol'],
    requiredCount: 8,
    bonus: {
      reputationBonus: 5000,
      visitorBonus: 50,
      incomeBonus: 30,
      karbovanetsBonus: 25000,
      uniqueBonus: 'golden_exhibits',
    },
    icon: '👑',
    tier: 2,
  },
  {
    id: 'collection_warriors',
    nameKey: 'museum.collection_warriors',
    era: 'Воїни',
    artifacts: ['sword', 'armor', 'arrow', 'shield', 'spear', 'axe'],
    requiredCount: 10,
    bonus: {
      reputationBonus: 4000,
      visitorBonus: 40,
      incomeBonus: 25,
      karbovanetsBonus: 20000,
      uniqueBonus: 'expedition_speed',
    },
    icon: '⚔️',
    tier: 2,
  },
  // Tier 3 - Legendary (Requires all Tier 1 + high reputation)
  {
    id: 'collection_ukrainian_heritage',
    nameKey: 'museum.collection_ukrainian_heritage',
    era: 'Спадщина',
    artifacts: ['trypillia', 'scythia', 'rus', 'cossack', 'modern'],
    requiredCount: 25,
    bonus: {
      reputationBonus: 20000,
      visitorBonus: 100,
      incomeBonus: 75,
      karbovanetsBonus: 100000,
      uniqueBonus: 'legendary_status',
    },
    icon: '🌟',
    tier: 3,
  },
];

// ═══════════════════════════════════════════════════════════════════════
// MUSEUM RANKINGS (Global Leaderboard)
// ═══════════════════════════════════════════════════════════════════════

export interface MuseumRanking {
  userId: string;
  username: string;
  score: number;          // Total reputation
  visitors: number;      // All-time visitors
  artifacts: number;      // Unique artifacts
  collections: number;   // Completed collections
  rank: number;           // Position
  updatedAt: number;
}

export const RANKING_TIERS = [
  { name: 'Новачок', minScore: 0, icon: '🔰', color: '#8B949E' },
  { name: 'Дослідник', minScore: 500, icon: '🔍', color: '#00E5FF' },
  { name: 'Збирач', minScore: 1500, icon: '📦', color: '#00E5FF' },
  { name: 'Куратор', minScore: 3500, icon: '🏛️', color: '#9747FF' },
  { name: 'Історик', minScore: 7000, icon: '📜', color: '#9747FF' },
  { name: 'Академік', minScore: 12000, icon: '🎓', color: '#FFC72C' },
  { name: 'Легенда', minScore: 20000, icon: '⭐', color: '#FFC72C' },
  { name: 'Вершитель', minScore: 35000, icon: '👑', color: '#FF2A5F' },
  { name: 'Вартовий Часу', minScore: 60000, icon: '⏳', color: '#FF2A5F' },
  { name: 'Безсмертний', minScore: 100000, icon: '🌟', color: '#FF2A5F' },
];

export function getRankingTier(score: number) {
  let tier = RANKING_TIERS[0];
  for (const t of RANKING_TIERS) {
    if (score >= t.minScore) tier = t;
  }
  return tier;
}

// ═══════════════════════════════════════════════════════════════════════
// EXHIBITION EVENTS (Time-Limited)
// ═══════════════════════════════════════════════════════════════════════

export interface ExhibitionEvent {
  id: string;
  nameKey: string;
  descriptionKey: string;
  theme: string;              // Visual theme
  requiredReputation: number; // Min reputation to participate
  duration: number;           // Duration in ms (7 days default)
  bonuses: EventBonus[];
  artifacts: string[];        // Featured artifact patterns
  rewards: EventReward[];
  startDate: number;
  endDate: number;
}

export interface EventBonus {
  type: 'visitors' | 'income' | 'xp' | 'reputation';
  value: number;
  condition?: string;         // Optional condition
}

export interface EventReward {
  type: 'karbovanets' | 'artifact' | 'reputation' | 'unique_item';
  amount: number;
  itemId?: string;
  threshold: number;          // Points needed to unlock
}

export const EXHIBITION_EVENTS: ExhibitionEvent[] = [
  {
    id: 'event_golden_week',
    nameKey: 'museum.event_golden_week',
    descriptionKey: 'museum.event_golden_week_desc',
    theme: 'gold',
    requiredReputation: 1000,
    duration: 7 * 24 * 60 * 60 * 1000,
    bonuses: [
      { type: 'visitors', value: 50 },
      { type: 'income', value: 25 },
    ],
    artifacts: ['gold', 'treasure', 'crown'],
    rewards: [
      { type: 'karbovanets', amount: 5000, threshold: 500 },
      { type: 'reputation', amount: 500, threshold: 1000 },
      { type: 'unique_item', amount: 1, itemId: 'golden_exhibit_token', threshold: 2000 },
    ],
    startDate: 0, // Dynamic
    endDate: 0,
  },
  {
    id: 'event_ancient_week',
    nameKey: 'museum.event_ancient_week',
    descriptionKey: 'museum.event_ancient_week_desc',
    theme: 'ancient',
    requiredReputation: 500,
    duration: 7 * 24 * 60 * 60 * 1000,
    bonuses: [
      { type: 'xp', value: 50 },
      { type: 'reputation', value: 25 },
    ],
    artifacts: ['idol', 'figurine', 'ancient'],
    rewards: [
      { type: 'karbovanets', amount: 3000, threshold: 400 },
      { type: 'reputation', amount: 300, threshold: 800 },
    ],
    startDate: 0,
    endDate: 0,
  },
  {
    id: 'event_warrior_month',
    nameKey: 'museum.event_warrior_month',
    descriptionKey: 'museum.event_warrior_month_desc',
    theme: 'warrior',
    requiredReputation: 2000,
    duration: 30 * 24 * 60 * 60 * 1000,
    bonuses: [
      { type: 'income', value: 40 },
      { type: 'reputation', value: 30 },
    ],
    artifacts: ['sword', 'armor', 'shield', 'weapon'],
    rewards: [
      { type: 'karbovanets', amount: 15000, threshold: 1500 },
      { type: 'reputation', amount: 1500, threshold: 3000 },
    ],
    startDate: 0,
    endDate: 0,
  },
];

// ═══════════════════════════════════════════════════════════════════════
// MUSEUM ACHIEVEMENTS
// ═══════════════════════════════════════════════════════════════════════

export interface MuseumAchievement {
  id: string;
  nameKey: string;
  descriptionKey: string;
  icon: string;
  requirement: AchievementRequirement;
  reward: { type: string; amount: number };
  secret: boolean;           // Hidden until unlocked
}

export interface AchievementRequirement {
  type: 'visitors' | 'artifacts' | 'collections' | 'reputation' | 'exhibitions' | 'events';
  value: number;
  comparison: '>=' | '==' | '>';
}

export const MUSEUM_ACHIEVEMENTS: MuseumAchievement[] = [
  // Visitor Milestones
  { id: 'first_visitor', nameKey: 'museum.achievement_first_visitor', descriptionKey: 'museum.achievement_first_visitor_desc', icon: '👤', requirement: { type: 'visitors', value: 1, comparison: '>=' }, reward: { type: 'karbovanets', amount: 100 }, secret: false },
  { id: 'hundred_visitors', nameKey: 'museum.achievement_hundred_visitors', descriptionKey: 'museum.achievement_hundred_visitors_desc', icon: '👥', requirement: { type: 'visitors', value: 100, comparison: '>=' }, reward: { type: 'karbovanets', amount: 500 }, secret: false },
  { id: 'thousand_visitors', nameKey: 'museum.achievement_thousand_visitors', descriptionKey: 'museum.achievement_thousand_visitors_desc', icon: '👥👥', requirement: { type: 'visitors', value: 1000, comparison: '>=' }, reward: { type: 'karbovanets', amount: 2000 }, secret: false },
  { id: 'ten_thousand_visitors', nameKey: 'museum.achievement_10k_visitors', descriptionKey: 'museum.achievement_10k_visitors_desc', icon: '🏟️', requirement: { type: 'visitors', value: 10000, comparison: '>=' }, reward: { type: 'karbovanets', amount: 10000 }, secret: false },
  { id: 'hundred_thousand_visitors', nameKey: 'museum.achievement_100k_visitors', descriptionKey: 'museum.achievement_100k_visitors_desc', icon: '🏟️🏟️', requirement: { type: 'visitors', value: 100000, comparison: '>=' }, reward: { type: 'karbovanets', amount: 50000 }, secret: true },
  { id: 'million_visitors', nameKey: 'museum.achievement_million_visitors', descriptionKey: 'museum.achievement_million_visitors_desc', icon: '🌍', requirement: { type: 'visitors', value: 1000000, comparison: '>=' }, reward: { type: 'karbovanets', amount: 250000 }, secret: true },
  
  // Artifact Milestones
  { id: 'first_artifact', nameKey: 'museum.achievement_first_artifact', descriptionKey: 'museum.achievement_first_artifact_desc', icon: '🏺', requirement: { type: 'artifacts', value: 1, comparison: '>=' }, reward: { type: 'karbovanets', amount: 100 }, secret: false },
  { id: 'ten_artifacts', nameKey: 'museum.achievement_ten_artifacts', descriptionKey: 'museum.achievement_ten_artifacts_desc', icon: '📦', requirement: { type: 'artifacts', value: 10, comparison: '>=' }, reward: { type: 'karbovanets', amount: 500 }, secret: false },
  { id: 'fifty_artifacts', nameKey: 'museum.achievement_fifty_artifacts', descriptionKey: 'museum.achievement_fifty_artifacts_desc', icon: '🏛️', requirement: { type: 'artifacts', value: 50, comparison: '>=' }, reward: { type: 'karbovanets', amount: 3000 }, secret: false },
  { id: 'hundred_artifacts', nameKey: 'museum.achievement_hundred_artifacts', descriptionKey: 'museum.achievement_hundred_artifacts_desc', icon: '🏛️🏛️', requirement: { type: 'artifacts', value: 100, comparison: '>=' }, reward: { type: 'karbovanets', amount: 10000 }, secret: true },
  
  // Collection Milestones
  { id: 'first_collection', nameKey: 'museum.achievement_first_collection', descriptionKey: 'museum.achievement_first_collection_desc', icon: '🎁', requirement: { type: 'collections', value: 1, comparison: '>=' }, reward: { type: 'karbovanets', amount: 2000 }, secret: false },
  { id: 'three_collections', nameKey: 'museum.achievement_three_collections', descriptionKey: 'museum.achievement_three_collections_desc', icon: '🎁🎁', requirement: { type: 'collections', value: 3, comparison: '>=' }, reward: { type: 'karbovanets', amount: 5000 }, secret: false },
  { id: 'all_collections', nameKey: 'museum.achievement_all_collections', descriptionKey: 'museum.achievement_all_collections_desc', icon: '🎁🎁🎁', requirement: { type: 'collections', value: 5, comparison: '==' }, reward: { type: 'karbovanets', amount: 25000 }, secret: false },
  
  // Reputation Milestones
  { id: 'local_fame', nameKey: 'museum.achievement_local_fame', descriptionKey: 'museum.achievement_local_fame_desc', icon: '📍', requirement: { type: 'reputation', value: 500, comparison: '>=' }, reward: { type: 'karbovanets', amount: 1000 }, secret: false },
  { id: 'city_fame', nameKey: 'museum.achievement_city_fame', descriptionKey: 'museum.achievement_city_fame_desc', icon: '🏙️', requirement: { type: 'reputation', value: 1500, comparison: '>=' }, reward: { type: 'karbovanets', amount: 3000 }, secret: false },
  { id: 'national_fame', nameKey: 'museum.achievement_national_fame', descriptionKey: 'museum.achievement_national_fame_desc', icon: '🇺🇦', requirement: { type: 'reputation', value: 7000, comparison: '>=' }, reward: { type: 'karbovanets', amount: 10000 }, secret: false },
  { id: 'world_fame', nameKey: 'museum.achievement_world_fame', descriptionKey: 'museum.achievement_world_fame_desc', icon: '🌍', requirement: { type: 'reputation', value: 60000, comparison: '>=' }, reward: { type: 'karbovanets', amount: 50000 }, secret: false },
  
  // Exhibition Milestones
  { id: 'first_exhibition', nameKey: 'museum.achievement_first_exhibition', descriptionKey: 'museum.achievement_first_exhibition_desc', icon: '🖼️', requirement: { type: 'exhibitions', value: 1, comparison: '>=' }, reward: { type: 'karbovanets', amount: 200 }, secret: false },
  { id: 'full_exhibition', nameKey: 'museum.achievement_full_exhibition', descriptionKey: 'museum.achievement_full_exhibition_desc', icon: '🖼️🖼️', requirement: { type: 'exhibitions', value: 6, comparison: '==' }, reward: { type: 'karbovanets', amount: 2000 }, secret: false },
  
  // Event Milestones
  { id: 'first_event', nameKey: 'museum.achievement_first_event', descriptionKey: 'museum.achievement_first_event_desc', icon: '🎉', requirement: { type: 'events', value: 1, comparison: '>=' }, reward: { type: 'karbovanets', amount: 1000 }, secret: false },
  { id: 'event_master', nameKey: 'museum.achievement_event_master', descriptionKey: 'museum.achievement_event_master_desc', icon: '🎊', requirement: { type: 'events', value: 5, comparison: '>=' }, reward: { type: 'karbovanets', amount: 5000 }, secret: false },
];

// ═══════════════════════════════════════════════════════════════════════
// LEGENDARY EXHIBITIONS
// ═══════════════════════════════════════════════════════════════════════

export interface LegendaryExhibition {
  id: string;
  nameKey: string;
  descriptionKey: string;
  requiredReputation: number;
  requiredCollections: number;
  theme: string;
  bonuses: EventBonus[];
  oneTimeReward: { type: string; amount: number };
  displayArtifact: string;  // Featured artifact pattern
}

export const LEGENDARY_EXHIBITIONS: LegendaryExhibition[] = [
  {
    id: 'legendary_trypillia',
    nameKey: 'museum.legendary_trypillia',
    descriptionKey: 'museum.legendary_trypillia_desc',
    requiredReputation: 5000,
    requiredCollections: 3,
    theme: 'ancient',
    bonuses: [
      { type: 'visitors', value: 25 },
      { type: 'income', value: 15 },
    ],
    oneTimeReward: { type: 'karbovanets', amount: 15000 },
    displayArtifact: 'trypillia',
  },
  {
    id: 'legendary_scythia',
    nameKey: 'museum.legendary_scythia',
    descriptionKey: 'museum.legendary_scythia_desc',
    requiredReputation: 8000,
    requiredCollections: 4,
    theme: 'warrior',
    bonuses: [
      { type: 'visitors', value: 30 },
      { type: 'income', value: 20 },
    ],
    oneTimeReward: { type: 'karbovanets', amount: 20000 },
    displayArtifact: 'scythia',
  },
  {
    id: 'legendary_rus',
    nameKey: 'museum.legendary_rus',
    descriptionKey: 'museum.legendary_rus_desc',
    requiredReputation: 12000,
    requiredCollections: 5,
    theme: 'royal',
    bonuses: [
      { type: 'visitors', value: 40 },
      { type: 'income', value: 30 },
      { type: 'reputation', value: 20 },
    ],
    oneTimeReward: { type: 'karbovanets', amount: 35000 },
    displayArtifact: 'kyiv_rus',
  },
  {
    id: 'legendary_cossack',
    nameKey: 'museum.legendary_cossack',
    descriptionKey: 'museum.legendary_cossack_desc',
    requiredReputation: 15000,
    requiredCollections: 5,
    theme: 'warrior',
    bonuses: [
      { type: 'visitors', value: 50 },
      { type: 'income', value: 35 },
    ],
    oneTimeReward: { type: 'karbovanets', amount: 40000 },
    displayArtifact: 'cossack',
  },
  {
    id: 'legendary_masterpiece',
    nameKey: 'museum.legendary_masterpiece',
    descriptionKey: 'museum.legendary_masterpiece_desc',
    requiredReputation: 25000,
    requiredCollections: 6,
    theme: 'legendary',
    bonuses: [
      { type: 'visitors', value: 75 },
      { type: 'income', value: 50 },
      { type: 'reputation', value: 50 },
      { type: 'xp', value: 100 },
    ],
    oneTimeReward: { type: 'karbovanets', amount: 100000 },
    displayArtifact: 'heritage',
  },
];

// ═══════════════════════════════════════════════════════════════════════
// REPUTATION LEVELS
// ═══════════════════════════════════════════════════════════════════════

export interface ReputationLevel {
  level: number;
  nameKey: string;           // i18n key
  requiredReputation: number; // Total reputation needed
  visitorMultiplier: number; // Visitor generation multiplier
  incomeMultiplier: number;    // Income generation multiplier
  unlocks: string[];         // Feature unlocks
  dailyReward?: number;       // Daily reward bonus
}

export const reputationLevels: ReputationLevel[] = [
  { level: 1, nameKey: 'museum.rep_local', requiredReputation: 0, visitorMultiplier: 1.0, incomeMultiplier: 1.0, unlocks: ['basic_exhibitions'], dailyReward: 50 },
  { level: 2, nameKey: 'museum.rep_district', requiredReputation: 500, visitorMultiplier: 1.1, incomeMultiplier: 1.05, unlocks: ['collections'], dailyReward: 100 },
  { level: 3, nameKey: 'museum.rep_city', requiredReputation: 1500, visitorMultiplier: 1.2, incomeMultiplier: 1.1, unlocks: ['upgrades'], dailyReward: 200 },
  { level: 4, nameKey: 'museum.rep_regional', requiredReputation: 3500, visitorMultiplier: 1.35, incomeMultiplier: 1.2, unlocks: ['special_exhibitions'], dailyReward: 400 },
  { level: 5, nameKey: 'museum.rep_national', requiredReputation: 7000, visitorMultiplier: 1.5, incomeMultiplier: 1.35, unlocks: ['legendary_exhibits', 'cross_era'], dailyReward: 800 },
  { level: 6, nameKey: 'museum.rep_international', requiredReputation: 12000, visitorMultiplier: 1.7, incomeMultiplier: 1.5, unlocks: ['international_visitors'], dailyReward: 1500 },
  { level: 7, nameKey: 'museum.rep_famous', requiredReputation: 20000, visitorMultiplier: 1.9, incomeMultiplier: 1.7, unlocks: ['famous_exhibits'], dailyReward: 2500 },
  { level: 8, nameKey: 'museum.rep_federal', requiredReputation: 35000, visitorMultiplier: 2.1, incomeMultiplier: 1.9, unlocks: ['federal_recognition'], dailyReward: 4000 },
  { level: 9, nameKey: 'museum.rep_world', requiredReputation: 60000, visitorMultiplier: 2.4, incomeMultiplier: 2.2, unlocks: ['world_heritage'], dailyReward: 7000 },
  { level: 10, nameKey: 'museum.rep_legendary', requiredReputation: 100000, visitorMultiplier: 2.8, incomeMultiplier: 2.5, unlocks: ['legendary_status', 'max_upgrades'], dailyReward: 15000 },
];

// ═══════════════════════════════════════════════════════════════════════
// MUSEUM UPGRADES
// ═══════════════════════════════════════════════════════════════════════

export type UpgradeId = 'marketing' | 'security' | 'exhibition_hall' | 'restoration_wing';

export interface MuseumUpgrade {
  id: UpgradeId;
  nameKey: string;
  descriptionKey: string;
  maxLevel: number;
  baseCost: number;
  costMultiplier: number;
  effects: UpgradeEffect[];
  icon: string;
}

export interface UpgradeEffect {
  type: 'visitors' | 'income' | 'slots' | 'repairs' | 'reputation';
  value: number;
}

export const museumUpgrades: MuseumUpgrade[] = [
  { id: 'marketing', nameKey: 'museum.upgrade_marketing', descriptionKey: 'museum.upgrade_marketing_desc', maxLevel: 10, baseCost: 5000, costMultiplier: 1.8, effects: [{ type: 'visitors', value: 15 }], icon: '📢' },
  { id: 'security', nameKey: 'museum.upgrade_security', descriptionKey: 'museum.upgrade_security_desc', maxLevel: 10, baseCost: 8000, costMultiplier: 2.0, effects: [{ type: 'reputation', value: 50 }], icon: '🔒' },
  { id: 'exhibition_hall', nameKey: 'museum.upgrade_exhibition', descriptionKey: 'museum.upgrade_exhibition_desc', maxLevel: 9, baseCost: 12000, costMultiplier: 2.5, effects: [{ type: 'slots', value: 1 }], icon: '🏛️' },
  { id: 'restoration_wing', nameKey: 'museum.upgrade_restoration', descriptionKey: 'museum.upgrade_restoration_desc', maxLevel: 10, baseCost: 15000, costMultiplier: 2.2, effects: [{ type: 'repairs', value: 10 }, { type: 'income', value: 5 }], icon: '🔧' },
];

// ═══════════════════════════════════════════════════════════════════════
// MUSEUM STATE TYPES
// ═══════════════════════════════════════════════════════════════════════

export interface MuseumExhibition {
  slotIndex: number;
  artifactId: string | null;
  placedAt: number;
}

export interface MuseumUpgradeState {
  marketing: number;
  security: number;
  exhibition_hall: number;
  restoration_wing: number;
}

export interface MuseumState {
  // Core stats
  reputation: number;
  dailyVisitors: number;
  lastVisitorReset: number;
  
  // Exhibitions
  exhibitions: MuseumExhibition[];
  maxExhibitionSlots: number;
  
  // Collections
  completedCollections: string[];
  collectionProgress: Record<string, number>;
  
  // Upgrades
  upgrades: MuseumUpgradeState;
  
  // Statistics
  totalVisitorsAllTime: number;
  totalIncomeAllTime: number;
  lastIncomeCollected: number;
  
  // Endgame
  achievements: string[];           // Unlocked achievement IDs
  legendaryExhibitions: string[];   // Completed legendary exhibition IDs
  eventParticipation: string[];       // Event IDs participated in
  lastDailyReward: number;            // Timestamp of last daily reward
}

// ═══════════════════════════════════════════════════════════════════════
// CALCULATION HELPERS
// ═══════════════════════════════════════════════════════════════════════

export function getReputationLevel(reputation: number): ReputationLevel {
  let currentLevel = reputationLevels[0];
  for (const level of reputationLevels) {
    if (reputation >= level.requiredReputation) {
      currentLevel = level;
    } else break;
  }
  return currentLevel;
}

export function calculateDailyVisitors(museumState: MuseumState, exhibitedArtifactCount: number, collectionBonus: number): number {
  const baseVisitors = exhibitedArtifactCount * 25;
  const repLevel = getReputationLevel(museumState.reputation);
  const marketingBonus = 1 + (museumState.upgrades.marketing * museumUpgrades[0].effects[0].value / 100);
  const collectionMultiplier = 1 + (collectionBonus / 100);
  const visitors = Math.floor(baseVisitors * repLevel.visitorMultiplier * marketingBonus * collectionMultiplier);
  return Math.max(50, visitors);
}

export function calculateMuseumIncome(museumState: MuseumState, exhibitedArtifactValue: number): number {
  const baseIncome = Math.floor(exhibitedArtifactValue / 100);
  const repLevel = getReputationLevel(museumState.reputation);
  const restorationBonus = 1 + (museumState.upgrades.restoration_wing * museumUpgrades[3].effects.find(e => e.type === 'income')!.value / 100);
  const collectionBonus = 1 + (museumState.completedCollections.length * 5 / 100);
  const income = Math.floor(baseIncome * repLevel.incomeMultiplier * restorationBonus * collectionBonus * MUSEUM_INCOME_MULTIPLIER);
  return Math.max(10, income);
}

export function getUpgradeCost(upgrade: MuseumUpgrade, currentLevel: number): number {
  if (currentLevel >= upgrade.maxLevel) return Infinity;
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));
}

export function getUpgradeEffectValue(upgrade: MuseumUpgrade, currentLevel: number, effectType: 'visitors' | 'income' | 'slots' | 'repairs' | 'reputation'): number {
  const effect = upgrade.effects.find(e => e.type === effectType);
  if (!effect) return 0;
  return effect.value * currentLevel;
}

export function calculateCollectionProgress(collection: Collection, museumArtifacts: Array<{ era: string; name: string }>): number {
  return museumArtifacts.filter(artifact => {
    if (artifact.era !== collection.era) return false;
    const artifactLower = artifact.name.toLowerCase();
    return collection.artifacts.some(keyword => artifactLower.includes(keyword.toLowerCase()));
  }).length;
}

export function isCollectionComplete(collection: Collection, progress: number): boolean {
  return progress >= collection.requiredCount;
}

// ═══════════════════════════════════════════════════════════════════════
// INITIAL STATE
// ═══════════════════════════════════════════════════════════════════════

export const initialMuseumState: MuseumState = {
  reputation: 0,
  dailyVisitors: 50,
  lastVisitorReset: Date.now(),
  exhibitions: Array.from({ length: 3 }, (_, i) => ({ slotIndex: i, artifactId: null, placedAt: 0 })),
  maxExhibitionSlots: 3,
  completedCollections: [],
  collectionProgress: {},
  upgrades: { marketing: 0, security: 0, exhibition_hall: 0, restoration_wing: 0 },
  totalVisitorsAllTime: 0,
  totalIncomeAllTime: 0,
  lastIncomeCollected: Date.now(),
  achievements: [],
  legendaryExhibitions: [],
  eventParticipation: [],
  lastDailyReward: 0,
};
