// Epochs data - 12 Epochs of Ukrainian History
import type { EpochId, Epoch, Generator, Artifact } from '../types/game';

// Helper to get epoch by ID
export function getEpochById(id: EpochId): Epoch | undefined {
  return EPOCHS.find(e => e.id === id);
}

// All 12 epochs
export const EPOCHS: Epoch[] = [
  {
    id: 'trypillia',
    name: { ua: 'Трипільська культура', en: 'Trypillia Culture' },
    description: {
      ua: 'Колиска європейської цивілізації',
      en: 'Cradle of European civilization',
    },
    period: { ua: '5500–2750 до н.е.', en: '5500–2750 BCE' },
    levelRange: { min: 1, max: 50 },
    unlockLevel: 1,
    currency: 'Зерно',
    currencyIcon: '🌾',
    color: '#8B4513',
    bgGradient: 'linear-gradient(135deg, #D2691E 0%, #8B4513 100%)',
    generators: TRYPILLIA_GENERATORS,
  },
  {
    id: 'scythia',
    name: { ua: 'Скіфія', en: 'Scythia' },
    description: {
      ua: 'Володарі степів Північного Причорномор\'я',
      en: 'Lords of the Northern Black Sea Steppes',
    },
    period: { ua: '700–300 до н.е.', en: '700–300 BCE' },
    levelRange: { min: 51, max: 100 },
    unlockLevel: 51,
    currency: 'Золото',
    currencyIcon: '🪙',
    color: '#FFD700',
    bgGradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    generators: SCYTHIA_GENERATORS,
  },
  {
    id: 'antiquity',
    name: { ua: 'Античність', en: 'Antiquity' },
    description: {
      ua: 'Еллінські колонії на українських землях',
      en: 'Hellenic colonies on Ukrainian lands',
    },
    period: { ua: '600 до н.е. – 400 н.е.', en: '600 BCE – 400 CE' },
    levelRange: { min: 101, max: 150 },
    unlockLevel: 101,
    currency: 'Срібло',
    currencyIcon: '🪙',
    color: '#C0C0C0',
    bgGradient: 'linear-gradient(135deg, #C0C0C0 0%, #808080 100%)',
    generators: ANTIQUITY_GENERATORS,
  },
  {
    id: 'kyiv_rus',
    name: { ua: 'Київська Русь', en: 'Kyiv Rus' },
    description: {
      ua: 'Перша держава східних слов\'ян',
      en: 'First state of Eastern Slavs',
    },
    period: { ua: '882–1240', en: '882–1240' },
    levelRange: { min: 151, max: 250 },
    unlockLevel: 151,
    currency: 'Гривні',
    currencyIcon: '💰',
    color: '#4169E1',
    bgGradient: 'linear-gradient(135deg, #4169E1 0%, #000080 100%)',
    generators: KYIV_RUS_GENERATORS,
  },
  {
    id: 'halych_volhynia',
    name: { ua: 'Галицько-Волинське князівство', en: 'Galicia-Volhynia' },
    description: {
      ua: 'Спадкоємець традицій Київської Русі',
      en: 'Heir to Kyiv Rus traditions',
    },
    period: { ua: '1199–1340', en: '1199–1340' },
    levelRange: { min: 251, max: 320 },
    unlockLevel: 251,
    currency: 'Копани',
    currencyIcon: '💎',
    color: '#9932CC',
    bgGradient: 'linear-gradient(135deg, #9932CC 0%, #4B0082 100%)',
    generators: HALYCH_GENERATORS,
  },
  {
    id: 'polish_lithuanian',
    name: { ua: 'Руське воєводство', en: 'Polish-Lithuanian Commonwealth' },
    description: {
      ua: 'Період українсько-польсько-литовських відносин',
      en: 'Ukrainian-Polish-Lithuanian relations period',
    },
    period: { ua: '1340–1648', en: '1340–1648' },
    levelRange: { min: 321, max: 420 },
    unlockLevel: 321,
    currency: 'Злота',
    currencyIcon: '🪙',
    color: '#DC143C',
    bgGradient: 'linear-gradient(135deg, #DC143C 0%, #8B0000 100%)',
    generators: POLISH_LITHUANIAN_GENERATORS,
  },
  {
    id: 'cossack',
    name: { ua: 'Козацька доба', en: 'Cossack Era' },
    description: {
      ua: 'Вільний народ українських степів',
      en: 'Free people of Ukrainian steppes',
    },
    period: { ua: '1648–1734', en: '1648–1734' },
    levelRange: { min: 421, max: 550 },
    unlockLevel: 421,
    currency: 'Карбованці',
    currencyIcon: '💰',
    color: '#228B22',
    bgGradient: 'linear-gradient(135deg, #228B22 0%, #006400 100%)',
    generators: COSSACK_GENERATORS,
  },
  {
    id: 'hetmanate',
    name: { ua: 'Гетьманщина', en: 'Hetmanate' },
    description: {
      ua: 'Автономна козацька держава',
      en: 'Autonomous Cossack state',
    },
    period: { ua: '1649–1782', en: '1649–1782' },
    levelRange: { min: 551, max: 650 },
    unlockLevel: 551,
    currency: 'Карбованці',
    currencyIcon: '💰',
    color: '#FFD700',
    bgGradient: 'linear-gradient(135deg, #FFD700 0%, #B8860B 100%)',
    generators: HETMANATE_GENERATORS,
  },
  {
    id: 'empire',
    name: { ua: 'Російська імперія', en: 'Russian Empire' },
    description: {
      ua: 'Уніатська церква та національний рух',
      en: 'Uniate church and national movement',
    },
    period: { ua: '1782–1917', en: '1782–1917' },
    levelRange: { min: 651, max: 780 },
    unlockLevel: 651,
    currency: 'Рублі',
    currencyIcon: '🪙',
    color: '#696969',
    bgGradient: 'linear-gradient(135deg, #696969 0%, #2F4F4F 100%)',
    generators: EMPIRE_GENERATORS,
  },
  {
    id: 'revolution',
    name: { ua: 'Визвольні змагання', en: 'Ukrainian Revolution' },
    description: {
      ua: 'Боротьба за українську державність',
      en: 'Struggle for Ukrainian statehood',
    },
    period: { ua: '1917–1920', en: '1917–1920' },
    levelRange: { min: 781, max: 850 },
    unlockLevel: 781,
    currency: 'Гривні',
    currencyIcon: '💰',
    color: '#FFA500',
    bgGradient: 'linear-gradient(135deg, #FFA500 0%, #FF8C00 100%)',
    generators: REVOLUTION_GENERATORS,
  },
  {
    id: 'soviet',
    name: { ua: 'Радянська Україна', en: 'Soviet Ukraine' },
    description: {
      ua: 'Період СРСР та боротьба за незалежність',
      en: 'USSR period and struggle for independence',
    },
    period: { ua: '1922–1991', en: '1922–1991' },
    levelRange: { min: 851, max: 950 },
    unlockLevel: 851,
    currency: 'Карбованці',
    currencyIcon: '💰',
    color: '#DC143C',
    bgGradient: 'linear-gradient(135deg, #DC143C 0%, #8B0000 100%)',
    generators: SOVIET_GENERATORS,
  },
  {
    id: 'independence',
    name: { ua: 'Незалежна Україна', en: 'Independent Ukraine' },
    description: {
      ua: 'Сучасна держава та її історія',
      en: 'Modern state and its history',
    },
    period: { ua: '1991–донині', en: '1991–present' },
    levelRange: { min: 951, max: 9999 },
    unlockLevel: 951,
    currency: 'Гривні',
    currencyIcon: '💰',
    color: '#005BBB',
    bgGradient: 'linear-gradient(135deg, #005BBB 0%, #FFD500 100%)',
    generators: INDEPENDENCE_GENERATORS,
  },
];

// Generator definitions for each epoch
const TRYPILLIA_GENERATORS: Generator[] = [
  { id: 'try-1', name: { ua: 'Глиняний горщик', en: 'Clay Pot' }, description: { ua: 'Перший посуд для зерна', en: 'First grain container' }, baseCost: 15, baseProduction: 1, costMultiplier: 1.15, icon: '🏺' },
  { id: 'try-2', name: { ua: 'Кам\'яна мотика', en: 'Stone Hoe' }, description: { ua: 'Для обробки землі', en: 'For land cultivation' }, baseCost: 100, baseProduction: 5, costMultiplier: 1.15, icon: '⛏️' },
  { id: 'try-3', name: { ua: 'Реміснича майстерня', en: 'Workshop' }, description: { ua: 'Виробництво знарядь', en: 'Tool production' }, baseCost: 500, baseProduction: 20, costMultiplier: 1.15, icon: '🔨' },
];

const SCYTHIA_GENERATORS: Generator[] = [
  { id: 'scy-1', name: { ua: 'Кінська упряж', en: 'Horse Harness' }, description: { ua: 'Для швидких переміщень', en: 'For fast travel' }, baseCost: 2000, baseProduction: 50, costMultiplier: 1.15, icon: '🐴' },
  { id: 'scy-2', name: { ua: 'Золотарий', en: 'Goldsmith' }, description: { ua: 'Виготовляє прикраси', en: 'Makes jewelry' }, baseCost: 10000, baseProduction: 200, costMultiplier: 1.15, icon: '👑' },
  { id: 'scy-3', name: { ua: 'Кінний табун', en: 'Horse Herd' }, description: { ua: 'Великий табун коней', en: 'Large horse herd' }, baseCost: 50000, baseProduction: 800, costMultiplier: 1.15, icon: '🏇' },
];

const ANTIQUITY_GENERATORS: Generator[] = [
  { id: 'ant-1', name: { ua: 'Грецька амфора', en: 'Greek Amphora' }, description: { ua: 'Для вина та олії', en: 'For wine and oil' }, baseCost: 100000, baseProduction: 1500, costMultiplier: 1.15, icon: '🏺' },
  { id: 'ant-2', name: { ua: 'Ремісничий квартал', en: 'Artisan Quarter' }, description: { ua: 'Різноманітні ремесла', en: 'Various crafts' }, baseCost: 500000, baseProduction: 5000, costMultiplier: 1.15, icon: '🏘️' },
  { id: 'ant-3', name: { ua: 'Торговий порт', en: 'Trading Port' }, description: { ua: 'Морська торгівля', en: 'Sea trade' }, baseCost: 2000000, baseProduction: 15000, costMultiplier: 1.15, icon: '⚓' },
];

const KYIV_RUS_GENERATORS: Generator[] = [
  { id: 'krv-1', name: { ua: 'Дружина', en: 'Warrior Band' }, description: { ua: 'Захист та походи', en: 'Defense and campaigns' }, baseCost: 10000000, baseProduction: 50000, costMultiplier: 1.15, icon: '⚔️' },
  { id: 'krv-2', name: { ua: 'Князівський двір', en: 'Prince Court' }, description: { ua: 'Центр влади', en: 'Center of power' }, baseCost: 50000000, baseProduction: 150000, costMultiplier: 1.15, icon: '🏰' },
  { id: 'krv-3', name: { ua: 'Софійський собор', en: 'St. Sophia Cathedral' }, description: { ua: 'Духовний центр', en: 'Spiritual center' }, baseCost: 200000000, baseProduction: 400000, costMultiplier: 1.15, icon: '⛪' },
];

const HALYCH_GENERATORS: Generator[] = [
  { id: 'hal-1', name: { ua: 'Солеварня', en: 'Salt Works' }, description: { ua: 'Видобуток солі', en: 'Salt mining' }, baseCost: 1000000000, baseProduction: 1000000, costMultiplier: 1.15, icon: '🧂' },
  { id: 'hal-2', name: { ua: 'Лицарський замок', en: 'Knight Castle' }, description: { ua: 'Володіння лицарів', en: 'Knight domain' }, baseCost: 5000000000, baseProduction: 3000000, costMultiplier: 1.15, icon: '🏯' },
  { id: 'hal-3', name: { ua: 'Караван-сарай', en: 'Caravanserai' }, description: { ua: 'Торговий шлях', en: 'Trade route' }, baseCost: 20000000000, baseProduction: 8000000, costMultiplier: 1.15, icon: '🐫' },
];

const POLISH_LITHUANIAN_GENERATORS: Generator[] = [
  { id: 'pol-1', name: { ua: 'Шляхетський маєток', en: 'Noble Estate' }, description: { ua: 'Панський двір', en: 'Manor house' }, baseCost: 100000000000, baseProduction: 20000000, costMultiplier: 1.15, icon: '🏛️' },
  { id: 'pol-2', name: { ua: 'Церква', en: 'Church' }, description: { ua: 'Релігійний центр', en: 'Religious center' }, baseCost: 500000000000, baseProduction: 50000000, costMultiplier: 1.15, icon: '⛪' },
  { id: 'pol-3', name: { ua: 'Місто', en: 'City' }, description: { ua: 'Розвиток міст', en: 'Urban development' }, baseCost: 2000000000000, baseProduction: 120000000, costMultiplier: 1.15, icon: '🏙️' },
];

const COSSACK_GENERATORS: Generator[] = [
  { id: 'cos-1', name: { ua: 'Січова паланка', en: 'Sich Palanka' }, description: { ua: 'Козацька фортеця', en: 'Cossack fortress' }, baseCost: 10000000000000, baseProduction: 300000000, costMultiplier: 1.15, icon: '🏰' },
  { id: 'cos-2', name: { ua: 'Козацький курінь', en: 'Cossack Regiment' }, description: { ua: 'Військові формування', en: 'Military formations' }, baseCost: 50000000000000, baseProduction: 700000000, costMultiplier: 1.15, icon: '⚔️' },
  { id: 'cos-3', name: { ua: 'Запорозька Січ', en: 'Zaporizhian Sich' }, description: { ua: 'Центр козацтва', en: 'Cossack center' }, baseCost: 200000000000000, baseProduction: 1500000000, costMultiplier: 1.15, icon: '🛡️' },
];

const HETMANATE_GENERATORS: Generator[] = [
  { id: 'het-1', name: { ua: 'Гетьманська резиденція', en: 'Hetman Residence' }, description: { ua: 'Оселя гетьмана', en: 'Hetman residence' }, baseCost: 1000000000000000, baseProduction: 3000000000, costMultiplier: 1.15, icon: '🏛️' },
  { id: 'het-2', name: { ua: 'Військова канцелярія', en: 'Military Chancellery' }, description: { ua: 'Державне управління', en: 'State governance' }, baseCost: 5000000000000000, baseProduction: 7000000000, costMultiplier: 1.15, icon: '📜' },
  { id: 'het-3', name: { ua: 'Козацька держава', en: 'Cossack State' }, description: { ua: 'Гетьманщина', en: 'Hetmanate' }, baseCost: 20000000000000000, baseProduction: 15000000000, costMultiplier: 1.15, icon: '🌟' },
];

const EMPIRE_GENERATORS: Generator[] = [
  { id: 'emp-1', name: { ua: 'Панський маєток', en: 'Manor Estate' }, description: { ua: 'Кріпосне право', en: 'Serfdom era' }, baseCost: 100000000000000000, baseProduction: 30000000000, costMultiplier: 1.15, icon: '🏘️' },
  { id: 'emp-2', name: { ua: 'Фабрика', en: 'Factory' }, description: { ua: 'Промислова революція', en: 'Industrial revolution' }, baseCost: 500000000000000000, baseProduction: 70000000000, costMultiplier: 1.15, icon: '🏭' },
  { id: 'emp-3', name: { ua: 'Залізниця', en: 'Railway' }, description: { ua: 'Транспортна мережа', en: 'Transport network' }, baseCost: 2000000000000000000, baseProduction: 150000000000, costMultiplier: 1.15, icon: '🚂' },
];

const REVOLUTION_GENERATORS: Generator[] = [
  { id: 'rev-1', name: { ua: 'Революційна сотня', en: 'Revolutionary Company' }, description: { ua: 'Боротьба за свободу', en: 'Fight for freedom' }, baseCost: 10000000000000000000, baseProduction: 300000000000, costMultiplier: 1.15, icon: '🎖️' },
  { id: 'rev-2', name: { ua: 'Народний комісаріат', en: 'People\'s Commissariat' }, description: { ua: 'Управління нової доби', en: 'New era governance' }, baseCost: 50000000000000000000, baseProduction: 700000000000, costMultiplier: 1.15, icon: '⭐' },
  { id: 'rev-3', name: { ua: 'Дипломатична місія', en: 'Diplomatic Mission' }, description: { ua: 'Міжнародне визнання', en: 'International recognition' }, baseCost: 200000000000000000000, baseProduction: 1500000000000, costMultiplier: 1.15, icon: '🎯' },
];

const SOVIET_GENERATORS: Generator[] = [
  { id: 'sov-1', name: { ua: 'Колгосп', en: 'Collective Farm' }, description: { ua: 'Сільськогосподарська кооперація', en: 'Agricultural cooperation' }, baseCost: 1000000000000000000000, baseProduction: 3000000000000, costMultiplier: 1.15, icon: '🌾' },
  { id: 'sov-2', name: { ua: 'Завод', en: 'Factory' }, description: { ua: 'Важка промисловість', en: 'Heavy industry' }, baseCost: 5000000000000000000000, baseProduction: 7000000000000, costMultiplier: 1.15, icon: '🏭' },
  { id: 'sov-3', name: { ua: 'Космічна програма', en: 'Space Program' }, description: { ua: 'Науковий прогрес', en: 'Scientific progress' }, baseCost: 20000000000000000000000, baseProduction: 15000000000000, costMultiplier: 1.15, icon: '🚀' },
];

const INDEPENDENCE_GENERATORS: Generator[] = [
  { id: 'ind-1', name: { ua: 'Приватне підприємство', en: 'Private Enterprise' }, description: { ua: 'Підприємницька ініціатива', en: 'Entrepreneurial initiative' }, baseCost: 100000000000000000000000, baseProduction: 30000000000000, costMultiplier: 1.15, icon: '🏢' },
  { id: 'ind-2', name: { ua: 'IT-компанія', en: 'IT Company' }, description: { ua: 'Технологічний сектор', en: 'Tech sector' }, baseCost: 500000000000000000000000, baseProduction: 70000000000000, costMultiplier: 1.15, icon: '💻' },
  { id: 'ind-3', name: { ua: 'Євроінтеграція', en: 'European Integration' }, description: { ua: 'Входження до ЄС', en: 'Joining the EU' }, baseCost: 2000000000000000000000000, baseProduction: 150000000000000, costMultiplier: 1.15, icon: '🇪🇺' },
];

// All artifacts
export const ARTIFACTS: Artifact[] = [
  // Trypillia
  { id: 'tryp-ceramic', name: { ua: 'Трипільська кераміка', en: 'Trypillian Ceramic' }, epoch: 'trypillia', rarity: 'common', parts: 10, bonus: { type: 'xp_multiplier', value: 0.1 }, icon: '🏺', requiredPrestige: 0 },
  { id: 'tryp-idol', name: { ua: 'Жіноча статуетка', en: 'Female Figurine' }, epoch: 'trypillia', rarity: 'rare', parts: 15, bonus: { type: 'xp_multiplier', value: 0.25 }, icon: '🕊️', requiredPrestige: 0 },
  { id: 'tryp-village', name: { ua: 'Модель поселення', en: 'Settlement Model' }, epoch: 'trypillia', rarity: 'epic', parts: 20, bonus: { type: 'currency_multiplier', value: 0.3 }, icon: '🏘️', requiredPrestige: 0 },
  
  // Scythia
  { id: 'scy-gold', name: { ua: 'Скіфське золото', en: 'Scythian Gold' }, epoch: 'scythia', rarity: 'common', parts: 10, bonus: { type: 'xp_multiplier', value: 0.1 }, icon: '🏅', requiredPrestige: 0 },
  { id: 'scy-weapon', name: { ua: 'Акінак', en: 'Akinakes' }, epoch: 'scythia', rarity: 'rare', parts: 15, bonus: { type: 'passive_boost', value: 0.2 }, icon: '⚔️', requiredPrestige: 0 },
  { id: 'scy-armor', name: { ua: 'Панцир', en: 'Armor' }, epoch: 'scythia', rarity: 'epic', parts: 20, bonus: { type: 'currency_multiplier', value: 0.3 }, icon: '🛡️', requiredPrestige: 0 },
  
  // Kyiv Rus
  { id: 'krv-seal', name: { ua: 'Печатка Володимира', en: 'Vladimir\'s Seal' }, epoch: 'kyiv_rus', rarity: 'common', parts: 10, bonus: { type: 'xp_multiplier', value: 0.1 }, icon: '📜', requiredPrestige: 0 },
  { id: 'krv-cross', name: { ua: 'Хрест Володимира', en: 'Vladimir Cross' }, epoch: 'kyiv_rus', rarity: 'rare', parts: 15, bonus: { type: 'xp_multiplier', value: 0.25 }, icon: '✝️', requiredPrestige: 0 },
  { id: 'krv-crown', name: { ua: 'Вінець Ярослава', en: 'Yaroslav\'s Crown' }, epoch: 'kyiv_rus', rarity: 'epic', parts: 20, bonus: { type: 'passive_boost', value: 0.3 }, icon: '👑', requiredPrestige: 0 },
  
  // Cossack
  { id: 'cos-sword', name: { ua: 'Козацька шабля', en: 'Cossack Sword' }, epoch: 'cossack', rarity: 'common', parts: 10, bonus: { type: 'xp_multiplier', value: 0.1 }, icon: '🗡️', requiredPrestige: 1 },
  { id: 'cos-flag', name: { ua: 'Січовий прапор', en: 'Sich Flag' }, epoch: 'cossack', rarity: 'rare', parts: 15, bonus: { type: 'currency_multiplier', value: 0.25 }, icon: '🚩', requiredPrestige: 1 },
  { id: 'cos-bulava', name: { ua: 'Гетьманська булава', en: 'Hetman Bulava' }, epoch: 'cossack', rarity: 'legendary', parts: 25, bonus: { type: 'xp_multiplier', value: 0.5 }, icon: '🔨', requiredPrestige: 1 },
  
  // Independence
  { id: 'ind-flag', name: { ua: 'Прапор Незалежності', en: 'Independence Flag' }, epoch: 'independence', rarity: 'legendary', parts: 25, bonus: { type: 'xp_multiplier', value: 0.5 }, icon: '🇺🇦', requiredPrestige: 2 },
  { id: 'ind-constitution', name: { ua: 'Конституція', en: 'Constitution' }, epoch: 'independence', rarity: 'legendary', parts: 25, bonus: { type: 'passive_boost', value: 0.5 }, icon: '📖', requiredPrestige: 2 },
];

// Helper to get artifacts for an epoch
export function getArtifactsForEpoch(epochId: EpochId): Artifact[] {
  return ARTIFACTS.filter(a => a.epoch === epochId);
}

// Helper to get generators for an epoch
export function getGeneratorsForEpoch(epochId: EpochId): Generator[] {
  const epoch = getEpochById(epochId);
  return epoch?.generators ?? [];
}

// Calculate generator cost
export function getGeneratorCost(generator: Generator, ownedLevel: number): number {
  return Math.floor(generator.baseCost * Math.pow(generator.costMultiplier, ownedLevel));
}

// Calculate generator production
export function getGeneratorProduction(generator: Generator, ownedLevel: number): number {
  return Math.floor(generator.baseProduction * ownedLevel);
}
