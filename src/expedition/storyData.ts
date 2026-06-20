import { Rarity } from './data';

// NPC Roles for Story System
export type StoryNpcRole = 'knyaz' | 'hetman' | 'researcher' | 'archaeologist' | 'historian' | 'guard';

// NPC Relationship Level
export type RelationshipLevel = 1 | 2 | 3 | 4 | 5;

// NPC Relationship Interface
export interface NpcRelationship {
  npcId: string;
  relationshipLevel: RelationshipLevel;
  trustPoints: number;
  completedQuests: string[];
  lastInteraction: number;
}

// Quest Type
export type QuestType = 'story' | 'daily' | 'expedition' | 'museum' | 'research';

// Quest Status
export type QuestStatus = 'available' | 'in_progress' | 'completed' | 'rewarded';

// Quest Reward
export interface QuestReward {
  type: 'karbovanets' | 'xp' | 'reputation' | 'hero_fragment' | 'artifact' | 'academy_xp';
  amount: number;
  itemId?: string;
}

// Quest Objective
export interface QuestObjective {
  type: 'expedition' | 'visit' | 'prestige' | 'speak' | 'build' | 'collect';
  target: string;
  count: number;
  current: number;
}

// Story Quest
export interface StoryQuest {
  id: string;
  npcId: string;
  titleKey: string;
  descriptionKey: string;
  objectives: QuestObjective[];
  rewards: QuestReward[];
  status: QuestStatus;
  dialogue: {
    start: string;
    progress: string;
    complete: string;
  };
  requiredRelationshipLevel: RelationshipLevel;
}

// Story NPC with full data
export interface StoryNpc {
  id: string;
  nameKey: string;
  role: StoryNpcRole;
  roleKey: string;
  portrait: string;
  backgroundColor: string;
  rarity: Rarity;
  biographyKey: string;
  dialogues: {
    greeting: string[];
    relationship: Record<RelationshipLevel, string[]>;
  };
  questIds: string[];
  unlocksAtRelationship: Record<RelationshipLevel, string | null>;
}

// Quest progress tracking
export interface QuestProgress {
  questId: string;
  objectives: Record<string, number>; // objective type -> current progress
  startedAt: number;
  updatedAt: number;
}

// Story Progress
export interface StoryProgress {
  currentChapter: number;
  completedChapters: number[];
  activeQuests: QuestProgress[]; // Track progress for each active quest
  completedQuests: string[];
  npcRelationships: Record<string, NpcRelationship>;
}

// NPC Story Data for MVP (5 NPCs)
export const storyNpcs: StoryNpc[] = [
  {
    id: 'story-knyaz-vladimir',
    nameKey: 'npc.knyaz_vladimir.name',
    role: 'knyaz',
    roleKey: 'npc.knyaz_vladimir.role',
    portrait: '👑',
    backgroundColor: '#FFC72C',
    rarity: 'legendary',
    biographyKey: 'npc.knyaz_vladimir.biography',
    dialogues: {
      greeting: [
        'Слава Русі!',
        'Вітаю володарю часу!',
        'Хай буде слава Києву!',
      ],
      relationship: {
        1: ['Ти цікавий мандрівник. Чув про Академію? Там зберігаються найбільші скарби!'],
        2: ['Твоя старанність не пройде непоміченою. Академія стежить за тобою!'],
        3: ['Я радий бачити друга в моїх палатах. Продовжуй збирати артефакти!'],
        4: ['Ти показав себе гідним довіри! Академія може запросити тебе скоро.'],
        5: ['Разом ми відкриємо таємниці Русі! Академія пишатиметься тобою!'],
      },
    },
    questIds: ['quest-vladimir-1', 'quest-vladimir-2'],
    unlocksAtRelationship: {
      1: null,
      2: 'dialogue_extra_1',
      3: 'quest-vladimir-1',
      4: 'hero-olga-unlock',
      5: 'artifact-rus-weapon',
    },
  },
  {
    id: 'story-monk-pereyaslav',
    nameKey: 'npc.monk_pereyaslav.name',
    role: 'historian',
    roleKey: 'npc.monk_pereyaslav.role',
    portrait: '📜',
    backgroundColor: '#9747FF',
    rarity: 'epic',
    biographyKey: 'npc.monk_pereyaslav.biography',
    dialogues: {
      greeting: [
        'Бог благословить твої починання...',
        'Вітаю в монастирі.',
        'Хай Господь веде тебе, мандрівнику.',
      ],
      relationship: {
        1: ['Розкажи, що привело тебе сюди? Знайдені артефакти вражають!'],
        2: ['Твоя цікавість до історії радує. Так тримай — до Академії недалеко!'],
        3: ['Я задоволений твоєю працею. Монастир пишається тобою!'],
        4: ['Монастирські таємниці відкриються тобі. Академія зацікавлена в тобі!'],
        5: ['Ти став частиною нашої спільноти! Академія скоро відкриє тобі двері!'],
      },
    },
    questIds: ['quest-monk-1', 'quest-monk-2'],
    unlocksAtRelationship: {
      1: null,
      2: 'dialogue_extra_2',
      3: 'quest-monk-1',
      4: 'region-kyiv-hills-unlock',
      5: 'artifact-byzantine-icon',
    },
  },
  {
    id: 'story-hetman-khmelnytsky',
    nameKey: 'npc.hetman_khmelnytsky.name',
    role: 'hetman',
    roleKey: 'npc.hetman_khmelnytsky.role',
    portrait: '⚔️',
    backgroundColor: '#FF2A5F',
    rarity: 'legendary',
    biographyKey: 'npc.hetman_khmelnytsky.biography',
    dialogues: {
      greeting: [
        'Слава козакам!',
        'Гей, побратиме!',
        'Вітаю воїна!',
      ],
      relationship: {
        1: ['Що привело тебе на Січ?'],
        2: ['Ти маєш козацьку вдачу!'],
        3: ['Рахую тебе серед побратимів!'],
        4: ['Січ відкрита для тебе!'],
        5: ['Разом ми будемо вільними!'],
      },
    },
    questIds: ['quest-khmelnytsky-1', 'quest-khmelnytsky-2'],
    unlocksAtRelationship: {
      1: null,
      2: 'dialogue_extra_3',
      3: 'quest-khmelnytsky-1',
      4: 'region-zaporizhia-unlock',
      5: 'hero-cossack-scout',
    },
  },
  {
    id: 'story-archaeologist-academy',
    nameKey: 'npc.archaeologist_academy.name',
    role: 'archaeologist',
    roleKey: 'npc.archaeologist_academy.role',
    portrait: '🔍',
    backgroundColor: '#00E5FF',
    rarity: 'rare',
    biographyKey: 'npc.archaeologist_academy.biography',
    dialogues: {
      greeting: [
        'Що нового в розкопках?',
        'Привіт колего!',
        'Маєш знахідки для каталогізації?',
      ],
      relationship: {
        1: ['Розкажи про свої дослідження.'],
        2: ['Твоя методика вражає.'],
        3: ['Разом ми зробимо відкриття!'],
        4: ['Академія пишається тобою!'],
        5: ['Найкращі артефакти чекають на тебе!'],
      },
    },
    questIds: ['quest-archaeologist-1'],
    unlocksAtRelationship: {
      1: null,
      2: 'dialogue_extra_4',
      3: 'quest-archaeologist-1',
      4: 'expedition-speed-bonus',
      5: 'artifact-trypillia-ceramics',
    },
  },
  {
    id: 'story-museum-curator',
    nameKey: 'npc.museum_curator.name',
    role: 'researcher',
    roleKey: 'npc.museum_curator.role',
    portrait: '🏛️',
    backgroundColor: '#8B949E',
    rarity: 'rare',
    biographyKey: 'npc.museum_curator.biography',
    dialogues: {
      greeting: [
        'Ласкаво просимо до музею!',
        'Привіт шанувальнику історії!',
        'Розкажи, що тебе цікавить?',
      ],
      relationship: {
        1: ['Яка епоха тебе цікавить найбільше?'],
        2: ['Твоя колекція вражає!'],
        3: ['Музей процвітає завдяки тобі!'],
        4: ['Відвідувачі в захваті від експонатів!'],
        5: ['Разом ми створимо найкращий музей!'],
      },
    },
    questIds: ['quest-curator-1', 'quest-curator-2'],
    unlocksAtRelationship: {
      1: null,
      2: 'dialogue_extra_5',
      3: 'quest-curator-1',
      4: 'museum-visitor-bonus',
      5: 'artifact-premium-display',
    },
  },
];

// Story Quests - 30+ quests across 5 story arcs
export const storyQuests: StoryQuest[] = [
  // ========== ARC 1: TRYPILLIA ==========
  {
    id: 'arc1-quest-1',
    npcId: 'story-archaeologist-academy',
    titleKey: 'quest.arc1_1.title',
    descriptionKey: 'quest.arc1_1.description',
    objectives: [
      { type: 'expedition', target: 'region-1', count: 2, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 200 },
      { type: 'xp', amount: 50 },
    ],
    status: 'available',
    dialogue: {
      start: 'Трипільська культура — найдавніша цивілізація Європи! Почни дослідження!',
      progress: 'Розкопки просуваються...',
      complete: 'Перші знахідки надихають!',
    },
    requiredRelationshipLevel: 1,
  },
  {
    id: 'arc1-quest-2',
    npcId: 'story-archaeologist-academy',
    titleKey: 'quest.arc1_2.title',
    descriptionKey: 'quest.arc1_2.description',
    objectives: [
      { type: 'expedition', target: 'region-1', count: 5, current: 0 },
      { type: 'collect', target: 'artifact', count: 2, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 400 },
      { type: 'xp', amount: 100 },
    ],
    status: 'available',
    dialogue: {
      start: 'Знайди перші артефакти трипільської культури!',
      progress: 'Кераміка та статуетки розкривають таємниці...',
      complete: 'Чудово! Ти відкрив перші секрети!',
    },
    requiredRelationshipLevel: 2,
  },
  {
    id: 'arc1-quest-3',
    npcId: 'story-museum-curator',
    titleKey: 'quest.arc1_3.title',
    descriptionKey: 'quest.arc1_3.description',
    objectives: [
      { type: 'collect', target: 'artifact', count: 3, current: 0 },
      { type: 'visit', target: 'museum', count: 3, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 500 },
      { type: 'reputation', amount: 50 },
    ],
    status: 'available',
    dialogue: {
      start: 'Принеси трипільські артефакти до музею!',
      progress: 'Колекція зростає...',
      complete: 'Музей поповнився чудовими експонатами!',
    },
    requiredRelationshipLevel: 2,
  },
  {
    id: 'arc1-quest-4',
    npcId: 'story-archaeologist-academy',
    titleKey: 'quest.arc1_4.title',
    descriptionKey: 'quest.arc1_4.description',
    objectives: [
      { type: 'expedition', target: 'region-1', count: 8, current: 0 },
      { type: 'collect', target: 'artifact', count: 5, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 800 },
      { type: 'xp', amount: 200 },
      { type: 'academy_xp', amount: 30 },
    ],
    status: 'available',
    dialogue: {
      start: 'Продовжи дослідження трипільських поселень!',
      progress: 'Глибші шари історії розкриваються...',
      complete: 'Ти став справжнім дослідником Трипілля!',
    },
    requiredRelationshipLevel: 3,
  },

  // ========== ARC 2: SCYTHIA ==========
  {
    id: 'arc2-quest-1',
    npcId: 'story-hetman-khmelnytsky',
    titleKey: 'quest.arc2_1.title',
    descriptionKey: 'quest.arc2_1.description',
    objectives: [
      { type: 'expedition', target: 'region-2', count: 3, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 350 },
      { type: 'xp', amount: 80 },
    ],
    status: 'available',
    dialogue: {
      start: 'Скіфи залишили скарби в степах! Шукай!',
      progress: 'Золото скіфів чекає на тебе...',
      complete: 'Чудова знахідка!',
    },
    requiredRelationshipLevel: 1,
  },
  {
    id: 'arc2-quest-2',
    npcId: 'story-knyaz-vladimir',
    titleKey: 'quest.arc2_2.title',
    descriptionKey: 'quest.arc2_2.description',
    objectives: [
      { type: 'expedition', target: 'region-2', count: 5, current: 0 },
      { type: 'collect', target: 'artifact', count: 2, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 600 },
      { type: 'reputation', amount: 80 },
    ],
    status: 'available',
    dialogue: {
      start: 'Скіфське золото — ключ до розуміння минулого!',
      progress: 'Акінак та золоті прикраси...',
      complete: 'Скіфська спадщина розкрита!',
    },
    requiredRelationshipLevel: 2,
  },
  {
    id: 'arc2-quest-3',
    npcId: 'story-monk-pereyaslav',
    titleKey: 'quest.arc2_3.title',
    descriptionKey: 'quest.arc2_3.description',
    objectives: [
      { type: 'collect', target: 'artifact', count: 4, current: 0 },
      { type: 'visit', target: 'museum', count: 5, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 700 },
      { type: 'xp', amount: 150 },
    ],
    status: 'available',
    dialogue: {
      start: 'Документуй скіфські знахідки для нащадків!',
      progress: 'Літописи поповнюються...',
      complete: 'Історія збережена!',
    },
    requiredRelationshipLevel: 3,
  },
  {
    id: 'arc2-quest-4',
    npcId: 'story-hetman-khmelnytsky',
    titleKey: 'quest.arc2_4.title',
    descriptionKey: 'quest.arc2_4.description',
    objectives: [
      { type: 'expedition', target: 'region-2', count: 8, current: 0 },
      { type: 'collect', target: 'artifact', count: 6, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 1000 },
      { type: 'reputation', amount: 150 },
      { type: 'hero_fragment', amount: 5, itemId: 'hero-cossack-scout' },
    ],
    status: 'available',
    dialogue: {
      start: 'Збери унікальну колекцію скіфських артефактів!',
      progress: 'Кургани розкривають свої таємниці...',
      complete: 'Ти відкрив скарбницю скіфів!',
    },
    requiredRelationshipLevel: 3,
  },

  // ========== ARC 3: KYIV RUS ==========
  {
    id: 'arc3-quest-1',
    npcId: 'story-knyaz-vladimir',
    titleKey: 'quest.arc3_1.title',
    descriptionKey: 'quest.arc3_1.description',
    objectives: [
      { type: 'expedition', target: 'region-3', count: 3, current: 0 },
      { type: 'speak', target: 'story-knyaz-vladimir', count: 3, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 500 },
      { type: 'xp', amount: 120 },
    ],
    status: 'available',
    dialogue: {
      start: 'Слава Русі! Час дослідити князівські землі!',
      progress: 'Київські пагорби приховують багато таємниць...',
      complete: 'Ти гідний син Русі!',
    },
    requiredRelationshipLevel: 2,
  },
  {
    id: 'arc3-quest-2',
    npcId: 'story-monk-pereyaslav',
    titleKey: 'quest.arc3_2.title',
    descriptionKey: 'quest.arc3_2.description',
    objectives: [
      { type: 'expedition', target: 'region-3', count: 5, current: 0 },
      { type: 'collect', target: 'artifact', count: 3, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 800 },
      { type: 'reputation', amount: 120 },
    ],
    status: 'available',
    dialogue: {
      start: 'Печерські монахи чекають на твою допомогу!',
      progress: 'Стародавні рукописи розкриваються...',
      complete: 'Печерська таємниця відкрита!',
    },
    requiredRelationshipLevel: 3,
  },
  {
    id: 'arc3-quest-3',
    npcId: 'story-knyaz-vladimir',
    titleKey: 'quest.arc3_3.title',
    descriptionKey: 'quest.arc3_3.description',
    objectives: [
      { type: 'expedition', target: 'region-3', count: 7, current: 0 },
      { type: 'collect', target: 'artifact', count: 5, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 1200 },
      { type: 'reputation', amount: 200 },
      { type: 'xp', amount: 300 },
    ],
    status: 'available',
    dialogue: {
      start: 'Київ — серце Русі! Збери його скарби!',
      progress: 'Кожен артефакт — це сторінка історії...',
      complete: 'Великі князі пишалися б тобою!',
    },
    requiredRelationshipLevel: 4,
  },
  {
    id: 'arc3-quest-4',
    npcId: 'story-monk-pereyaslav',
    titleKey: 'quest.arc3_4.title',
    descriptionKey: 'quest.arc3_4.description',
    objectives: [
      { type: 'collect', target: 'artifact', count: 8, current: 0 },
      { type: 'visit', target: 'museum', count: 10, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 1500 },
      { type: 'academy_xp', amount: 100 },
      { type: 'hero_fragment', amount: 10, itemId: 'hero-olga' },
    ],
    status: 'available',
    dialogue: {
      start: 'Створи експозицію Київської Русі!',
      progress: 'Музей перетворюється на скарбницю...',
      complete: 'Історія Русі ожила в музеї!',
    },
    requiredRelationshipLevel: 4,
  },
  {
    id: 'arc3-quest-5',
    npcId: 'story-knyaz-vladimir',
    titleKey: 'quest.arc3_5.title',
    descriptionKey: 'quest.arc3_5.description',
    objectives: [
      { type: 'expedition', target: 'region-3', count: 10, current: 0 },
      { type: 'collect', target: 'artifact', count: 10, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 2000 },
      { type: 'reputation', amount: 500 },
      { type: 'artifact', amount: 1, itemId: 'artifact-rus-weapon' },
    ],
    status: 'available',
    dialogue: {
      start: 'Останнє завдання арки Русі!',
      progress: 'Великі часи Русі настають...',
      complete: 'Ти зберіг спадщину Київської Русі!',
    },
    requiredRelationshipLevel: 5,
  },

  // ========== ARC 4: COSSACKS ==========
  {
    id: 'arc4-quest-1',
    npcId: 'story-hetman-khmelnytsky',
    titleKey: 'quest.arc4_1.title',
    descriptionKey: 'quest.arc4_1.description',
    objectives: [
      { type: 'expedition', target: 'region-4', count: 3, current: 0 },
      { type: 'speak', target: 'story-hetman-khmelnytsky', count: 3, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 600 },
      { type: 'xp', amount: 150 },
    ],
    status: 'available',
    dialogue: {
      start: 'Слава козакам! Дике Поле кличе героїв!',
      progress: 'Січ готується до походу...',
      complete: 'Ти справжній козак!',
    },
    requiredRelationshipLevel: 2,
  },
  {
    id: 'arc4-quest-2',
    npcId: 'story-hetman-khmelnytsky',
    titleKey: 'quest.arc4_2.title',
    descriptionKey: 'quest.arc4_2.description',
    objectives: [
      { type: 'expedition', target: 'region-4', count: 5, current: 0 },
      { type: 'expedition', target: 'region-5', count: 2, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 900 },
      { type: 'reputation', amount: 150 },
    ],
    status: 'available',
    dialogue: {
      start: 'Розшир козацькі дослідження на Запоріжжя!',
      progress: 'Запорозька Січ відкриває ворота...',
      complete: 'Козацька слава зростає!',
    },
    requiredRelationshipLevel: 3,
  },
  {
    id: 'arc4-quest-3',
    npcId: 'story-museum-curator',
    titleKey: 'quest.arc4_3.title',
    descriptionKey: 'quest.arc4_3.description',
    objectives: [
      { type: 'collect', target: 'artifact', count: 6, current: 0 },
      { type: 'visit', target: 'museum', count: 8, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 1000 },
      { type: 'xp', amount: 200 },
    ],
    status: 'available',
    dialogue: {
      start: 'Створи козацьку колекцію в музеї!',
      progress: 'Козацькі артефакти займають почесне місце...',
      complete: 'Козацька спадщина врятована!',
    },
    requiredRelationshipLevel: 3,
  },
  {
    id: 'arc4-quest-4',
    npcId: 'story-hetman-khmelnytsky',
    titleKey: 'quest.arc4_4.title',
    descriptionKey: 'quest.arc4_4.description',
    objectives: [
      { type: 'expedition', target: 'region-4', count: 6, current: 0 },
      { type: 'expedition', target: 'region-5', count: 4, current: 0 },
      { type: 'collect', target: 'artifact', count: 5, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 1500 },
      { type: 'reputation', amount: 300 },
      { type: 'hero_fragment', amount: 15, itemId: 'hero-cossack-scout' },
    ],
    status: 'available',
    dialogue: {
      start: 'Час великих походів!',
      progress: 'Козаки здобувають перемоги...',
      complete: 'Січ пишається тобою, побратиме!',
    },
    requiredRelationshipLevel: 4,
  },
  {
    id: 'arc4-quest-5',
    npcId: 'story-hetman-khmelnytsky',
    titleKey: 'quest.arc4_5.title',
    descriptionKey: 'quest.arc4_5.description',
    objectives: [
      { type: 'expedition', target: 'region-5', count: 8, current: 0 },
      { type: 'collect', target: 'artifact', count: 8, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 2000 },
      { type: 'reputation', amount: 400 },
      { type: 'xp', amount: 500 },
    ],
    status: 'available',
    dialogue: {
      start: 'Останній похід козацької епохи!',
      progress: 'Дике Поле підкоряється тобі...',
      complete: 'Козацька доба увічнена!',
    },
    requiredRelationshipLevel: 5,
  },

  // ========== ARC 5: INDEPENDENCE ==========
  {
    id: 'arc5-quest-1',
    npcId: 'story-knyaz-vladimir',
    titleKey: 'quest.arc5_1.title',
    descriptionKey: 'quest.arc5_1.description',
    objectives: [
      { type: 'expedition', target: 'region-5', count: 5, current: 0 },
      { type: 'speak', target: 'story-knyaz-vladimir', count: 5, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 1000 },
      { type: 'xp', amount: 300 },
    ],
    status: 'available',
    dialogue: {
      start: 'Час об\'єднати всі знання про українські землі!',
      progress: 'Кожна епоха — це частина нашої історії...',
      complete: 'Ти об\'єднав історію України!',
    },
    requiredRelationshipLevel: 3,
  },
  {
    id: 'arc5-quest-2',
    npcId: 'story-monk-pereyaslav',
    titleKey: 'quest.arc5_2.title',
    descriptionKey: 'quest.arc5_2.description',
    objectives: [
      { type: 'collect', target: 'artifact', count: 10, current: 0 },
      { type: 'visit', target: 'museum', count: 15, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 1500 },
      { type: 'academy_xp', amount: 150 },
    ],
    status: 'available',
    dialogue: {
      start: 'Створи найбільшу колекцію української історії!',
      progress: 'Музей стає унікальним...',
      complete: 'Скарбниця України створена!',
    },
    requiredRelationshipLevel: 4,
  },
  {
    id: 'arc5-quest-3',
    npcId: 'story-hetman-khmelnytsky',
    titleKey: 'quest.arc5_3.title',
    descriptionKey: 'quest.arc5_3.description',
    objectives: [
      { type: 'expedition', target: 'region-1', count: 5, current: 0 },
      { type: 'expedition', target: 'region-2', count: 5, current: 0 },
      { type: 'expedition', target: 'region-3', count: 5, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 2000 },
      { type: 'reputation', amount: 400 },
    ],
    status: 'available',
    dialogue: {
      start: 'Експедиція через всі епохи української історії!',
      progress: 'Ти подорожуєш через тисячоліття...',
      complete: 'Кожна епоха розкрита!',
    },
    requiredRelationshipLevel: 4,
  },
  {
    id: 'arc5-quest-4',
    npcId: 'story-museum-curator',
    titleKey: 'quest.arc5_4.title',
    descriptionKey: 'quest.arc5_4.description',
    objectives: [
      { type: 'collect', target: 'artifact', count: 15, current: 0 },
      { type: 'visit', target: 'museum', count: 20, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 2500 },
      { type: 'xp', amount: 600 },
      { type: 'hero_fragment', amount: 20, itemId: 'hero-olga' },
    ],
    status: 'available',
    dialogue: {
      start: 'Фінальне завдання: створи музей історії України!',
      progress: 'Експонати з усіх епох збираються...',
      complete: 'Музей історії України — гордість нації!',
    },
    requiredRelationshipLevel: 5,
  },
  {
    id: 'arc5-finale',
    npcId: 'story-knyaz-vladimir',
    titleKey: 'quest.arc5_finale.title',
    descriptionKey: 'quest.arc5_finale.description',
    objectives: [
      { type: 'expedition', target: 'region-1', count: 10, current: 0 },
      { type: 'expedition', target: 'region-2', count: 10, current: 0 },
      { type: 'expedition', target: 'region-3', count: 10, current: 0 },
      { type: 'expedition', target: 'region-4', count: 10, current: 0 },
      { type: 'expedition', target: 'region-5', count: 10, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 5000 },
      { type: 'reputation', amount: 1000 },
      { type: 'xp', amount: 1000 },
      { type: 'academy_xp', amount: 500 },
    ],
    status: 'available',
    dialogue: {
      start: 'Ти пройшов весь шлях через історію України! Фінальне випробування!',
      progress: 'Кожен регіон розкриває свої таємниці...',
      complete: 'Ти став справжнім Вартовим Часу!',
    },
    requiredRelationshipLevel: 5,
  },

  // ========== DAILY QUESTS ==========
  {
    id: 'daily-expedition-1',
    npcId: 'story-archaeologist-academy',
    titleKey: 'quest.daily_expedition.title',
    descriptionKey: 'quest.daily_expedition.description',
    objectives: [
      { type: 'expedition', target: 'region-1', count: 2, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 100 },
      { type: 'xp', amount: 30 },
    ],
    status: 'available',
    dialogue: {
      start: 'Щоденна експедиція чекає!',
      progress: 'Розкопки тривають...',
      complete: 'Добрий результат!',
    },
    requiredRelationshipLevel: 1,
  },
  {
    id: 'daily-museum-1',
    npcId: 'story-museum-curator',
    titleKey: 'quest.daily_museum.title',
    descriptionKey: 'quest.daily_museum.description',
    objectives: [
      { type: 'visit', target: 'museum', count: 3, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 50 },
      { type: 'reputation', amount: 10 },
    ],
    status: 'available',
    dialogue: {
      start: 'Відвідай музей сьогодні!',
      progress: 'Відвідувачі задоволені...',
      complete: 'Дякуємо за підтримку!',
    },
    requiredRelationshipLevel: 1,
  },
  {
    id: 'daily-artifact-1',
    npcId: 'story-monk-pereyaslav',
    titleKey: 'quest.daily_artifact.title',
    descriptionKey: 'quest.daily_artifact.description',
    objectives: [
      { type: 'collect', target: 'artifact', count: 1, current: 0 },
    ],
    rewards: [
      { type: 'karbovanets', amount: 150 },
      { type: 'xp', amount: 50 },
    ],
    status: 'available',
    dialogue: {
      start: 'Знайди артефакт сьогодні!',
      progress: 'Пошук триває...',
      complete: 'Чудова знахідка!',
    },
    requiredRelationshipLevel: 1,
  },
];

// Initial story progress
export const initialStoryProgress: StoryProgress = {
  currentChapter: 1,
  completedChapters: [],
  activeQuests: [],
  completedQuests: [],
  npcRelationships: {},
};

// Role colors for Story NPCs
export const storyNpcColors: Record<StoryNpcRole, string> = {
  knyaz: '#FFC72C',
  hetman: '#FF2A5F',
  researcher: '#00E5FF',
  archaeologist: '#00E5FF',
  historian: '#9747FF',
  guard: '#8B949E',
};
