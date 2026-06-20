export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type HeroSpecialization = 'archaeologist' | 'diplomat' | 'warrior' | 'scholar';
export type HeroRank = 'novice' | 'adept' | 'expert' | 'master' | 'legend';

export interface HeroUnlockCondition {
  type: 'prestige' | 'epoch' | 'level';
  value: number | string; // number for prestige/level, string for epoch ID
  descriptionKey: string; // Translation key for unlock description
}

export interface Hero {
  id: string;
  name: string;
  title: string;
  rarity: Rarity;
  specialization: HeroSpecialization;
  rank: HeroRank;
  level: number;
  experience: number;
  leadership: number;
  knowledge: number;
  exploration: number;
  diplomacy: number;
  biography: string;
  assigned: boolean;
  assignedTo?: string;
  // Expedition bonuses
  artifactBonus: number; // % chance to find better artifacts
  speedBonus: number; // % faster expeditions
  successBonus: number; // % better success chance
  // Unlock conditions
  unlocked: boolean;
  unlockCondition?: HeroUnlockCondition; // If undefined, hero is always unlocked
}

export const HERO_SPECIALIZATION_BONUS: Record<HeroSpecialization, { primary: keyof Hero; secondary: keyof Hero; expeditionBonus: { type: 'artifact' | 'speed' | 'success'; value: number } }> = {
  archaeologist: { primary: 'exploration', secondary: 'knowledge', expeditionBonus: { type: 'artifact', value: 15 } },
  diplomat: { primary: 'diplomacy', secondary: 'leadership', expeditionBonus: { type: 'success', value: 12 } },
  warrior: { primary: 'leadership', secondary: 'exploration', expeditionBonus: { type: 'speed', value: 10 } },
  scholar: { primary: 'knowledge', secondary: 'diplomacy', expeditionBonus: { type: 'artifact', value: 8 } },
};

export const HERO_RANK_THRESHOLDS: Record<HeroRank, number> = {
  novice: 0,
  adept: 500,
  expert: 1500,
  master: 4000,
  legend: 10000,
};

export function checkHeroUnlocked(hero: Hero, prestigeLevel: number, epochId: string, playerLevel: number): boolean {
  if (hero.unlocked) return true;
  if (!hero.unlockCondition) return true;
  
  switch (hero.unlockCondition.type) {
    case 'prestige':
      return prestigeLevel >= (hero.unlockCondition.value as number);
    case 'epoch':
      return epochId === (hero.unlockCondition.value as string);
    case 'level':
      return playerLevel >= (hero.unlockCondition.value as number);
    default:
      return false;
  }
}

export function getHeroUnlockProgress(hero: Hero, prestigeLevel: number, _epochId: string, playerLevel: number): { current: number; required: number; percentage: number } {
  if (hero.unlocked) return { current: 100, required: 100, percentage: 100 };
  if (!hero.unlockCondition) return { current: 0, required: 1, percentage: 0 };
  
  let current = 0;
  let required = 1;
  
  switch (hero.unlockCondition.type) {
    case 'prestige':
      current = prestigeLevel;
      required = hero.unlockCondition.value as number;
      break;
    case 'level':
      current = playerLevel;
      required = hero.unlockCondition.value as number;
      break;
    default:
      current = 0;
      required = 1;
  }
  
  return {
    current,
    required,
    percentage: Math.min(100, (current / required) * 100)
  };
}


export const STAT_GROWTH_PER_LEVEL: Record<Rarity, { base: number; perLevel: number }> = {
  common: { base: 5, perLevel: 2 },
  rare: { base: 7, perLevel: 3 },
  epic: { base: 10, perLevel: 4 },
  legendary: { base: 15, perLevel: 6 },
};

export interface Region {
  id: string;
  name: string;
  era: string;
  difficulty: number;
  description: string;
  duration: number; // in hours (flavour) — real timer is derived in store
  recommendedLevel: number;
  successChance: number;
  unlocked: boolean;
  artifacts: string[];
}

export interface Artifact {
  id: string;
  name: string;
  era: string;
  rarity: Rarity;
  status: 'damaged' | 'restoring' | 'restored' | 'museum';
  description: string;
  restoreTime: number; // minutes (flavour)
  restoredBy?: string;
  value: number;
  prestigeBonus: number;
  restoreEndsAt?: number; // epoch ms — set while restoring
  restoreStartedAt?: number;
}

export interface Expedition {
  id: string;
  regionId: string;
  region: string;
  heroes: string[];
  startTime: number;
  endsAt: number;
  duration: number; // seconds (real)
  successChance: number;
  status: 'traveling' | 'excavating' | 'returning' | 'completed';
  rewardKarbovanets: number;
  rewardReputation: number;
  artifactName: string;
  artifactRarity: Rarity;
  collected: boolean;
}

export interface Building {
  id: string;
  name: string;
  level: number;
  description: string;
  upgradeTime: number;
  upgradeCost: number;
  bonus: string;
}

export type NpcRole =
  | 'researcher'
  | 'guard'
  | 'archivist'
  | 'restorer'
  | 'visitor'
  | 'cossack';

export interface Npc {
  id: string;
  name: string;
  role: NpcRole;
  roleLabel: string;
  x: number;
  y: number;
  direction: number;
  /** karbovanets produced per minute while working */
  ratePerMin: number;
  /** reputation produced per minute while working */
  repPerMin: number;
  working: boolean;
  /** epoch ms of last collection / work start */
  lastCollectedAt: number;
  dialogues: string[];
}

export const initialHeroes: Hero[] = [
  {
    id: 'hero-1',
    name: 'Дмитро Вишневецький',
    title: 'Козацький гетьман',
    rarity: 'legendary',
    specialization: 'warrior',
    rank: 'expert',
    level: 15,
    experience: 2850,
    leadership: 95,
    knowledge: 65,
    exploration: 88,
    diplomacy: 72,
    biography:
      'Засновник Запорозької Січі та легендарний воєначальник. Очолював походи проти османів та досліджував Дике Поле.',
    assigned: false,
    artifactBonus: 12,
    speedBonus: 10,
    successBonus: 8,
    // Unlocked by default - first hero is always available
    unlocked: true,
  },
  {
    id: 'hero-2',
    name: 'Княгиня Ольга',
    title: 'Київська регентка',
    rarity: 'legendary',
    specialization: 'diplomat',
    rank: 'master',
    level: 18,
    experience: 3420,
    leadership: 92,
    knowledge: 88,
    exploration: 70,
    diplomacy: 96,
    biography:
      'Перша християнська правителька Київської Русі. Відома дипломатичною мудрістю та стратегічним хистом.',
    assigned: false,
    artifactBonus: 10,
    speedBonus: 8,
    successBonus: 12,
    // Unlock conditions
    unlocked: false,
    unlockCondition: { type: 'prestige', value: 1, descriptionKey: 'heroes.unlock_prestige_1' },
  },
  {
    id: 'hero-3',
    name: 'Нестор Літописець',
    title: 'Історик-науковець',
    rarity: 'epic',
    specialization: 'scholar',
    rank: 'adept',
    level: 12,
    experience: 1680,
    leadership: 58,
    knowledge: 98,
    exploration: 62,
    diplomacy: 75,
    biography:
      'Автор «Повісті временних літ». Майстер історичного документування та збереження давніх рукописів.',
    assigned: false,
    artifactBonus: 8,
    speedBonus: 5,
    successBonus: 6,
    // Unlock conditions
    unlocked: false,
    unlockCondition: { type: 'prestige', value: 2, descriptionKey: 'heroes.unlock_prestige_2' },
  },
  {
    id: 'hero-4',
    name: 'Богдан Хмельницький',
    title: 'Гетьман-командувач',
    rarity: 'legendary',
    specialization: 'warrior',
    rank: 'expert',
    level: 16,
    experience: 3100,
    leadership: 94,
    knowledge: 78,
    exploration: 84,
    diplomacy: 82,
    biography:
      'Очільник козацького повстання. Експерт військової стратегії та територіальних експедицій Гетьманщини.',
    assigned: false,
    artifactBonus: 10,
    speedBonus: 12,
    successBonus: 10,
    // Unlock conditions
    unlocked: false,
    unlockCondition: { type: 'prestige', value: 3, descriptionKey: 'heroes.unlock_prestige_3' },
  },
  {
    id: 'hero-5',
    name: 'Агатангел Кримський',
    title: 'Сходознавець',
    rarity: 'rare',
    specialization: 'scholar',
    rank: 'adept',
    level: 10,
    experience: 980,
    leadership: 64,
    knowledge: 92,
    exploration: 68,
    diplomacy: 80,
    biography:
      'Видатний мовознавець та орієнталіст. Спеціалізувався на розшифруванні давніх текстів та культурних артефактів.',
    assigned: false,
    artifactBonus: 15,
    speedBonus: 5,
    successBonus: 4,
    // Unlock conditions
    unlocked: false,
    unlockCondition: { type: 'prestige', value: 4, descriptionKey: 'heroes.unlock_prestige_4' },
  },
  {
    id: 'hero-6',
    name: 'Козак-розвідник',
    title: 'Польовий дослідник',
    rarity: 'common',
    specialization: 'archaeologist',
    rank: 'novice',
    level: 6,
    experience: 420,
    leadership: 55,
    knowledge: 48,
    exploration: 78,
    diplomacy: 52,
    biography:
      'Досвідчений провідник Дикого Поля. Знавець навігації та пошуку артефактів.',
    assigned: false,
    artifactBonus: 15,
    speedBonus: 8,
    successBonus: 5,
    // Unlock conditions
    unlocked: false,
    unlockCondition: { type: 'prestige', value: 5, descriptionKey: 'heroes.unlock_prestige_5' },
  },
];

export const initialRegions: Region[] = [
  {
    id: 'region-1',
    name: 'Трипільська культура',
    era: '5400 – 2750 до н.е.',
    difficulty: 1,
    description:
      'Дослідіть стародавні поселення найдавнішої цивілізації Європи. Знайдіть кераміку та протоміські структури.',
    duration: 4,
    recommendedLevel: 1,
    successChance: 85,
    unlocked: true,
    artifacts: ['Трипільська кераміка', 'Глиняні фігурки', 'Давні знаряддя'],
  },
  {
    id: 'region-2',
    name: 'Ольвія та Пантікапей',
    era: 'VII ст. до н.е. – IV ст. н.е.',
    difficulty: 2,
    description:
      'Дослідіть грецькі колоніальні міста на узбережжі Чорного моря. Знайдіть амфори, монети та мармур.',
    duration: 6,
    recommendedLevel: 5,
    successChance: 75,
    unlocked: true,
    artifacts: ['Грецька амфора', 'Бронзові монети', 'Уламок мармуру'],
  },
  {
    id: 'region-3',
    name: 'Київські пагорби',
    era: 'IX – XIII ст.',
    difficulty: 3,
    description:
      'Розкопайте колиску Київської Русі. Шукайте княжі печатки, ікони та середньовічну зброю.',
    duration: 8,
    recommendedLevel: 8,
    successChance: 68,
    unlocked: true,
    artifacts: ['Печатка Київської Русі', 'Візантійська ікона', 'Середньовічний меч'],
  },
  {
    id: 'region-4',
    name: 'Дике Поле',
    era: 'XV – XVII ст.',
    difficulty: 4,
    description:
      'Вирушайте в неосвоєні степи. Знайдіть козацькі табори, татарські рештки та скарби.',
    duration: 10,
    recommendedLevel: 12,
    successChance: 62,
    unlocked: false,
    artifacts: ['Козацька шабля', 'Татарський лук', 'Прихований скарб'],
  },
  {
    id: 'region-5',
    name: 'Запорозька Січ',
    era: 'XVI – XVIII ст.',
    difficulty: 5,
    description:
      'Вивчайте фортецю вільних козаків. Здобудьте військове спорядження та історичні документи.',
    duration: 12,
    recommendedLevel: 15,
    successChance: 58,
    unlocked: false,
    artifacts: ['Козацька булава', 'Січова грамота', 'Бойовий прапор'],
  },
  {
    id: 'region-6',
    name: 'Гетьманщина',
    era: 'XVII – XVIII ст.',
    difficulty: 6,
    description:
      'Досліджуйте державні інституції козацтва. Знайдіть печатки, дипломатичне листування та скарбницю.',
    duration: 14,
    recommendedLevel: 18,
    successChance: 52,
    unlocked: false,
    artifacts: ['Гетьманська печатка', 'Рукопис договору', 'Золота гривня'],
  },
  {
    id: 'region-7',
    name: 'Карпатські схрони',
    era: 'XVIII – XX ст.',
    difficulty: 7,
    description:
      'Шукайте гірські твердині борців за волю. Знайдіть зброю, шифровані послання та символи.',
    duration: 16,
    recommendedLevel: 20,
    successChance: 48,
    unlocked: false,
    artifacts: ['Гірська рушниця', 'Таємні документи', 'Партизанська медаль'],
  },
];

export const buildings: Building[] = [
  {
    id: 'building-1',
    name: 'Інститут археології',
    level: 3,
    description: 'Дослідницький центр історичних експедицій',
    upgradeTime: 120,
    upgradeCost: 5000,
    bonus: '+10% шанс успіху експедиції',
  },
  {
    id: 'building-2',
    name: 'Експедиційний корпус',
    level: 2,
    description: 'Штаб експедиційних команд',
    upgradeTime: 90,
    upgradeCost: 3500,
    bonus: '+1 слот для експедицій',
  },
  {
    id: 'building-3',
    name: 'Реставраційна лабораторія',
    level: 4,
    description: 'Сучасний осередок відновлення артефактів',
    upgradeTime: 150,
    upgradeCost: 7000,
    bonus: '-20% час реставрації',
  },
  {
    id: 'building-4',
    name: 'Національний музей',
    level: 5,
    description: 'Головний виставковий центр',
    upgradeTime: 180,
    upgradeCost: 10000,
    bonus: '+50 карбованців на годину',
  },
  {
    id: 'building-5',
    name: 'Історичний архів',
    level: 2,
    description: 'Сховище давніх знань',
    upgradeTime: 100,
    upgradeCost: 4000,
    bonus: '+15% досвіду героїв',
  },
  {
    id: 'building-6',
    name: 'Скарбниця',
    level: 3,
    description: 'Захищене сховище цінностей',
    upgradeTime: 120,
    upgradeCost: 6000,
    bonus: '+1000 до ліміту карбованців',
  },
];

export const initialArtifacts: Artifact[] = [
  {
    id: 'artifact-1',
    name: 'Трипільська кераміка',
    era: 'Трипільська культура',
    rarity: 'rare',
    status: 'museum',
    description: 'Майстерно оздоблений посуд однієї з найдавніших цивілізацій Європи.',
    restoreTime: 45,
    value: 1200,
    prestigeBonus: 15,
  },
  {
    id: 'artifact-2',
    name: 'Грецька амфора',
    era: 'Грецькі колонії',
    rarity: 'epic',
    status: 'damaged',
    description: 'Винна посудина з Ольвії з купецькими позначками та орнаментом.',
    restoreTime: 120,
    value: 3500,
    prestigeBonus: 35,
  },
  {
    id: 'artifact-3',
    name: 'Печатка Київської Русі',
    era: 'Київська Русь',
    rarity: 'legendary',
    status: 'museum',
    description: 'Княжа печатка Ярослава Мудрого. Надзвичайно рідкісний артефакт.',
    restoreTime: 240,
    value: 8500,
    prestigeBonus: 75,
  },
  {
    id: 'artifact-4',
    name: 'Козацька булава',
    era: 'Запорозька Січ',
    rarity: 'epic',
    status: 'damaged',
    description: 'Церемоніальна зброя січового старшини, оздоблена українським орнаментом.',
    restoreTime: 180,
    value: 4200,
    prestigeBonus: 45,
  },
];

export const initialNpcs: Npc[] = [
  {
    id: 'npc-1',
    name: 'Оксана',
    role: 'researcher',
    roleLabel: 'Дослідниця',
    x: 20,
    y: 58,
    direction: 1,
    ratePerMin: 4,    // 4 karb/min = 240 karb/hour = ~5760/day
    repPerMin: 6,
    working: false,
    lastCollectedAt: 0,
    dialogues: [
      'Я щойно знайшла нові записи про трипільські поселення!',
      'Дайте мені трохи часу — і я опишу кожен артефакт.',
      'Знання — найцінніший скарб академії.',
    ],
  },
  {
    id: 'npc-2',
    name: 'Тарас',
    role: 'cossack',
    roleLabel: 'Козак-вартовий',
    x: 78,
    y: 42,
    direction: -1,
    ratePerMin: 2,    // 2 karb/min = 120 karb/hour
    repPerMin: 10,
    working: false,
    lastCollectedAt: 0,
    dialogues: [
      'Слава Україні! Територія академії під надійною охороною.',
      'Жоден чорний археолог сюди не пройде.',
      'Готовий супроводжувати будь-яку експедицію.',
    ],
  },
  {
    id: 'npc-3',
    name: 'Мирослава',
    role: 'archivist',
    roleLabel: 'Архіваріус',
    x: 48,
    y: 68,
    direction: 1,
    ratePerMin: 3,    // 3 karb/min = 180 karb/hour
    repPerMin: 8,
    working: false,
    lastCollectedAt: 0,
    dialogues: [
      'Кожен документ має своє місце в архіві.',
      'Я каталогізую знахідки експедицій.',
      'Історію треба зберігати для нащадків.',
    ],
  },
  {
    id: 'npc-4',
    name: 'Богдан',
    role: 'restorer',
    roleLabel: 'Реставратор',
    x: 32,
    y: 50,
    direction: 1,
    ratePerMin: 5,    // 5 karb/min = 300 karb/hour
    repPerMin: 5,
    working: false,
    lastCollectedAt: 0,
    dialogues: [
      'Цей артефакт майже відновлено!',
      'Реставрація потребує терпіння та точності.',
      'Скоро ця знахідка прикрасить музей.',
    ],
  },
  {
    id: 'npc-5',
    name: 'Леся',
    role: 'visitor',
    roleLabel: 'Відвідувачка',
    x: 65,
    y: 62,
    direction: -1,
    ratePerMin: 2,    // 2 karb/min = 120 karb/hour
    repPerMin: 4,
    working: false,
    lastCollectedAt: 0,
    dialogues: [
      'Який чудовий музей! Я приведу сюди друзів.',
      'Експозиція козацької доби вражає.',
      'Залюбки придбаю квиток ще раз.',
    ],
  },
  {
    id: 'npc-6',
    name: 'Професор Ковальський',
    role: 'guard',
    roleLabel: 'Куратор',
    x: 42,
    y: 46,
    direction: 1,
    ratePerMin: 4,    // 4 karb/min = 240 karb/hour
    repPerMin: 9,
    working: false,
    lastCollectedAt: 0,
    dialogues: [
      'Молоде покоління має знати свою історію.',
      'Я керую науковою програмою академії.',
      'Призначайте героїв на експедиції з розумом.',
    ],
  },
];

export const npcColors: Record<NpcRole, string> = {
  researcher: '#00E5FF',
  guard: '#FFC72C',
  archivist: '#9747FF',
  restorer: '#FF2A5F',
  visitor: '#8B949E',
  cossack: '#FFC72C',
};
