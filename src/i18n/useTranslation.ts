// Translation hook and utilities
import { useState, useCallback, useEffect } from 'react';

export type Locale = 'uk' | 'en';

const LOCALE_KEY = 'game_locale';

interface TranslationMap {
  [key: string]: string | TranslationMap;
}

const translations: Record<Locale, TranslationMap> = {
  uk: {},
  en: {},
};

// Fallback translations for critical UI
const fallbackTranslations: Record<string, Record<Locale, string>> = {
  // Common
  'common.level': { uk: 'Рівень', en: 'Level' },
  'common.tap': { uk: 'Тап', en: 'Tap' },
  'common.active': { uk: 'Активно', en: 'Active' },
  'common.close': { uk: 'Закрити', en: 'Close' },
  'common.buy': { uk: 'Купити', en: 'Buy' },
  'common.upgrade': { uk: 'Покращити', en: 'Upgrade' },
  'common.claim': { uk: 'Отримати', en: 'Claim' },
  'common.wait': { uk: 'Чекайте', en: 'Wait' },
  'common.done': { uk: 'Готово', en: 'Done' },
  'common.loading': { uk: 'Завантаження...', en: 'Loading...' },
  'common.error': { uk: 'Помилка', en: 'Error' },
  'common.success': { uk: 'Успіх', en: 'Success' },
  'common.currency': { uk: 'Валюта', en: 'Currency' },
  'common.xp': { uk: 'Досвід', en: 'XP' },
  'common.per_minute': { uk: '/хв', en: '/min' },
  
  // App
  'app.title': { uk: 'Україна Крізь Час', en: 'Ukraine Through Time' },
  'app.active': { uk: 'Активний', en: 'Active' },
  'app.locked': { uk: 'Заблоковано', en: 'Locked' },
  'app.tap_power': { uk: 'Сила тапу', en: 'Tap Power' },
  'app.passive_xp': { uk: 'Пасивний XP', en: 'Passive XP' },
  'app.energy': { uk: 'Енергія', en: 'Energy' },
  
  // Epochs
  'epochs.current': { uk: 'Поточна епоха', en: 'Current Epoch' },
  'epochs.unlock_at': { uk: 'Відкривається на рівні', en: 'Unlocks at level' },
  'epochs.currency': { uk: 'Валюта', en: 'Currency' },
  
  // Shop
  'shop.title': { uk: 'Магазин', en: 'Shop' },
  'shop.generators': { uk: 'Генератори', en: 'Generators' },
  'shop.upgrades': { uk: 'Покращення', en: 'Upgrades' },
  
  // Gacha
  'gacha.open_chest': { uk: 'Відкрити скриню', en: 'Open Chest' },
  'gacha.cost': { uk: 'Вартість', en: 'Cost' },
  'gacha.rewards': { uk: 'Нагороди', en: 'Rewards' },
  
  // Prestige
  'prestige.title': { uk: 'Переродження', en: 'Prestige' },
  'prestige.available': { uk: 'Доступно', en: 'Available' },
  'prestige.points': { uk: 'Очок престижу', en: 'Prestige Points' },
  'prestige.bonus': { uk: 'Бонус', en: 'Bonus' },
  
  // Tutorial
  'tutorial.welcome': { uk: 'Ласкаво просимо!', en: 'Welcome!' },
  'tutorial.tap_intro': { uk: 'Торкайтесь, щоб заробляти досвід!', en: 'Tap to earn experience!' },
  'tutorial.tap_to_start': { uk: 'Торкніться, щоб почати', en: 'Tap to start' },
  
  // Errors
  'error.telegram_stars_app_only': { uk: 'Покупки доступні тільки в Telegram', en: 'Purchases available only in Telegram' },
  'error.login_telegram': { uk: 'Увійдіть через Telegram', en: 'Please login via Telegram' },
  'error.no_connection': { uk: 'Немає з\'єднання', en: 'No connection' },
  'error.not_enough_currency': { uk: 'Недостатньо валюти', en: 'Not enough currency' },
  
  // Expedition Academy
  'expedition.academy_title': { uk: 'Академія', en: 'Academy' },
  'expedition.academy_subtitle': { uk: 'Досліджуйте історію', en: 'Explore history' },
  'expedition.reputation': { uk: 'Репутація', en: 'Reputation' },
  'expedition.karbovanets': { uk: 'Карбованці', en: 'Karbovanets' },
  'expedition.visitors': { uk: 'Відвідувачі', en: 'Visitors' },
  'expedition.expeditions': { uk: 'Експедиції', en: 'Expeditions' },
  'expedition.npc_title': { uk: 'Мешканці Академії', en: 'Academy Residents' },
  'expedition.npc_work': { uk: 'Працює', en: 'Working' },
  'expedition.npc_free': { uk: 'Вільний', en: 'Free' },
  'expedition.npc_talk': { uk: 'Говорити', en: 'Talk' },
  'expedition.npc_assign': { uk: 'Призначити', en: 'Assign' },
  'expedition.npc_stop': { uk: 'Зупинити', en: 'Stop' },
  'expedition.npc_collect': { uk: 'Зібрати', en: 'Collect' },
  'expedition.buildings_title': { uk: 'Будівлі', en: 'Buildings' },
  'expedition.story_system': { uk: 'Система оповідання', en: 'Story System' },
  
  // Museum
  'museum.title': { uk: 'Музей', en: 'Museum' },
  'museum.subtitle': { uk: 'Виставка артефактів', en: 'Artifact Exhibition' },
  'museum.exhibits': { uk: 'Експонати', en: 'Exhibits' },
  'museum.reputation_level': { uk: 'Рівень репутації', en: 'Reputation Level' },
  'museum.collections': { uk: 'Колекції', en: 'Collections' },
  'museum.total_collection_value': { uk: 'Загальна вартість колекції', en: 'Total Collection Value' },
  'museum.open_system': { uk: 'Система', en: 'System' },
  'museum.open_museum_system': { uk: 'Відкрити систему музею', en: 'Open Museum System' },
  'museum.visitors_today': { uk: 'Відвідувачів сьогодні', en: 'Visitors Today' },
  'museum.museum_reputation': { uk: 'Репутація музею', en: 'Museum Reputation' },
  'museum.your_rank': { uk: 'Ваш ранг', en: 'Your Rank' },
  'museum.tab_exhibitions': { uk: 'Виставки', en: 'Exhibitions' },
  'museum.tab_collections': { uk: 'Колекції', en: 'Collections' },
  'museum.tab_upgrades': { uk: 'Покращення', en: 'Upgrades' },
  'museum.tab_stats': { uk: 'Статистика', en: 'Stats' },
  
  // NPC
  'npc.courtyard': { uk: 'Подвір\'я Академії', en: 'Academy Courtyard' },
  'npc.instruction': { uk: 'Натисніть на NPC щоб поговорити', en: 'Click on NPC to talk' },
  'npc.dialogue': { uk: 'Діалог', en: 'Dialogue' },
  'npc.income': { uk: 'Дохід', en: 'Income' },
  'npc.reputation': { uk: 'Репутація', en: 'Reputation' },
  'npc.resting': { uk: 'Відпочиває', en: 'Resting' },
  'npc.story_npcs': { uk: 'Персонажі', en: 'Characters' },
  
  // Quest
  'quest.quests': { uk: 'Квести', en: 'Quests' },
  'quest.available': { uk: 'Доступні', en: 'Available' },
  'quest.in_progress': { uk: 'В процесі', en: 'In Progress' },
  'quest.completed': { uk: 'Завершено', en: 'Completed' },
  'quest.start': { uk: 'Почати', en: 'Start' },
  'quest.objective_expedition': { uk: 'Експедиція', en: 'Expedition' },
  'quest.objective_speak': { uk: 'Поговорити', en: 'Speak' },
  'quest.objective_visit': { uk: 'Відвідати', en: 'Visit' },
  'quest.objective_prestige': { uk: 'Переродження', en: 'Prestige' },
  'quest.objective_build': { uk: 'Побудувати', en: 'Build' },
  'quest.objective_collect': { uk: 'Зібрати', en: 'Collect' },
  'quest.no_quests': { uk: 'Немає доступних квестів', en: 'No quests available' },
  'quest.reward_xp': { uk: 'XP', en: 'XP' },
  'quest.reward_currency': { uk: 'Карбованці', en: 'Karbovanets' },
  'quest.reward_reputation': { uk: 'Репутація', en: 'Reputation' },
  
  // Story
  'story.story_system': { uk: 'Система оповідання', en: 'Story System' },
  'story.npcs_quests': { uk: 'NPC та Квести', en: 'NPCs & Quests' },
  
  // Heroes
  'heroes.title': { uk: 'Герої', en: 'Heroes' },
  'heroes.unlock_prestige_1': { uk: 'Переродження 1', en: 'Prestige 1' },
  'heroes.unlock_prestige_2': { uk: 'Переродження 2', en: 'Prestige 2' },
  'heroes.unlock_prestige_3': { uk: 'Переродження 3', en: 'Prestige 3' },
  
  // Daily
  'daily.title': { uk: 'Щоденні нагороди', en: 'Daily Rewards' },
  'daily.check_in': { uk: 'Вхід', en: 'Check In' },
  'daily.streak': { uk: 'Серія', en: 'Streak' },
  
  // Treasury
  'treasury.title': { uk: 'Скарбниця', en: 'Treasury' },
  'treasury.subtitle': { uk: 'Управління ресурсами', en: 'Resource Management' },
  'treasury.karbovanets_reserves': { uk: 'Резерви карбованців', en: 'Karbovanets Reserves' },
  'treasury.museum_income_active': { uk: 'Дохід від музею активний', en: 'Museum income active' },
  'treasury.prestige': { uk: 'Престиж', en: 'Prestige' },
  'treasury.reputation': { uk: 'Репутація', en: 'Reputation' },
  'treasury.historical_bonds': { uk: 'Історичні облігації', en: 'Historical Bonds' },
  'treasury.heritage_fund': { uk: 'Фонд спадщини', en: 'Heritage Fund' },
  'treasury.investment_opportunity': { uk: 'Інвестиційна можливість', en: 'Investment Opportunity' },
  'treasury.bond_denomination': { uk: 'Номінал облігації', en: 'Bond Denomination' },
  'treasury.karb': { uk: 'карб', en: 'karb' },
  'treasury.redemption_info': { uk: 'Погашення через 4 секунди з +12%', en: 'Redeem after 4 seconds with +12%' },
  'treasury.buy_bond': { uk: 'Купити облігацію', en: 'Buy Bond' },
  'treasury.not_enough_karbovanets': { uk: 'Недостатньо карбованців', en: 'Not enough karbovanets' },
  'treasury.bond_purchased': { uk: 'Облігацію придбано!', en: 'Bond purchased!' },
  'treasury.bond_redeemed': { uk: 'Облігацію погашено! +${amount}', en: 'Bond redeemed! +${amount}' },
  'treasury.premium_account': { uk: 'Преміум акаунт', en: 'Premium Account' },
  'treasury.upgrade_to_premium': { uk: 'Покращити до преміум', en: 'Upgrade to Premium' },
  'treasury.premium_active': { uk: 'Преміум активний', en: 'Premium Active' },
  'treasury.activate_premium': { uk: 'Активувати', en: 'Activate' },
  'treasury.premium_bonus_income': { uk: '+10% дохід від музею', en: '+10% museum income' },
  'treasury.premium_bonus_success': { uk: '+5% шанс успіху експедиції', en: '+5% expedition success chance' },
  'treasury.premium_bonus_restoration': { uk: '-10% час реставрації', en: '-10% restoration time' },
  'treasury.premium_bonus_legendary': { uk: '+5% легендарний шанс', en: '+5% legendary chance' },
  'treasury.need_karbovanets': { uk: 'Потрібно більше карбованців', en: 'Need more karbovanets' },
  'treasury.reward_exchange': { uk: 'Обмін нагород', en: 'Reward Exchange' },
  'treasury.vouchers_available': { uk: 'ваучерів доступно', en: 'vouchers available' },
  'treasury.description': { uk: 'Обмінюйте надлишки нагород на додаткові бонуси', en: 'Exchange excess rewards for additional bonuses' },
  
  // Artifacts
  'artifacts.rarity_common': { uk: 'Звичайний', en: 'Common' },
  'artifacts.rarity_rare': { uk: 'Рідкісний', en: 'Rare' },
  'artifacts.rarity_epic': { uk: 'Епічний', en: 'Epic' },
  'artifacts.rarity_legendary': { uk: 'Легендарний', en: 'Legendary' },
};

function flattenObject(obj: TranslationMap, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  
  for (const key in obj) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    
    if (typeof value === 'string') {
      result[newKey] = value;
    } else if (typeof value === 'object' && value !== null) {
      Object.assign(result, flattenObject(value as TranslationMap, newKey));
    }
  }
  
  return result;
}

function loadTranslations(locale: Locale): Record<string, string> {
  try {
    const stored = localStorage.getItem(`i18n_${locale}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load translations from storage:', e);
  }
  
  return {};
}

function saveTranslations(locale: Locale, translations: Record<string, string>) {
  try {
    localStorage.setItem(`i18n_${locale}`, JSON.stringify(translations));
  } catch (e) {
    console.warn('Failed to save translations to storage:', e);
  }
}

export function initTranslations(locale: Locale) {
  const stored = loadTranslations(locale);
  // Merge with fallback - stored translations override fallbacks
  translations[locale] = { ...fallbackTranslations, ...stored };
}

export function useTranslation() {
  const [locale, setLocale] = useState<Locale>(() => {
    // Try to get from localStorage first
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LOCALE_KEY);
      if (stored === 'uk' || stored === 'en') {
        return stored;
      }
    }
    return 'uk';
  });
  
  // Initialize translations
  useEffect(() => {
    initTranslations(locale);
  }, [locale]);
  
  const toggleLocale = useCallback(() => {
    setLocale(prev => {
      const next = prev === 'uk' ? 'en' : 'uk';
      localStorage.setItem(LOCALE_KEY, next);
      return next;
    });
  }, []);
  
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    // First check fallback translations
    if (fallbackTranslations[key]) {
      let text = fallbackTranslations[key][locale] || key;
      
      // Replace parameters
      if (params) {
        Object.entries(params).forEach(([paramKey, value]) => {
          text = text.replace(`{${paramKey}}`, String(value));
        });
      }
      
      return text;
    }
    
    // Then check loaded translations
    const flatTranslations = flattenObject(translations[locale]);
    let text = flatTranslations[key] || key;
    
    // Replace parameters
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        text = text.replace(`{${paramKey}}`, String(value));
      });
    }
    
    return text;
  }, [locale]);
  
  return {
    locale,
    setLocale,
    toggleLocale,
    t,
  };
}

export type { TranslationMap };
