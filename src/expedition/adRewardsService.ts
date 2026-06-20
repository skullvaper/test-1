/**
 * Ad Rewards Service
 * 
 * Manages tiered ad rewards based on player prestige.
 * P0-P1: XP Boost, Currency Boost, Offline Income
 * P2+: Academy Currency, Expedition Speed, Museum Bonuses, Artifact Chance
 */

import { ADSGRAM_BLOCK_ID, initAdsgram, showRewardAd, AdShowResult } from '../services/adsgram';

export type AdRewardType = 
  // P0-P1 Rewards
  | 'xp_boost'
  | 'currency_boost'
  | 'offline_income'
  | 'artifact_chance_p0'
  // P2+ Rewards
  | 'academy_currency'
  | 'expedition_speed'
  | 'museum_bonus'
  | 'artifact_chance_p2';

export interface AdReward {
  type: AdRewardType;
  titleKey: string;
  descriptionKey: string;
  duration: number; // milliseconds, 0 for instant
  value: number;
  icon: string;
}

// P0-P1 Reward Pool (Prestige 0-1)
export const P0_P1_REWARDS: AdReward[] = [
  {
    type: 'xp_boost',
    titleKey: 'ad_reward.xp_boost_title',
    descriptionKey: 'ad_reward.xp_boost_description',
    duration: 30 * 60 * 1000, // 30 minutes
    value: 2, // x2 multiplier
    icon: '⚡',
  },
  {
    type: 'currency_boost',
    titleKey: 'ad_reward.currency_boost_title',
    descriptionKey: 'ad_reward.currency_boost_description',
    duration: 30 * 60 * 1000, // 30 minutes
    value: 1.5, // x1.5 multiplier
    icon: '💰',
  },
  {
    type: 'offline_income',
    titleKey: 'ad_reward.offline_income_title',
    descriptionKey: 'ad_reward.offline_income_description',
    duration: 0, // Instant effect
    value: 2, // 2x multiplier
    icon: '⏰',
  },
  {
    type: 'artifact_chance_p0',
    titleKey: 'ad_reward.artifact_chance_title',
    descriptionKey: 'ad_reward.artifact_chance_description',
    duration: 30 * 60 * 1000, // 30 minutes
    value: 10, // +10%
    icon: '🏺',
  },
];

// P2+ Reward Pool (Prestige 2+)
export const P2_PLUS_REWARDS: AdReward[] = [
  {
    type: 'academy_currency',
    titleKey: 'ad_reward.academy_currency_title',
    descriptionKey: 'ad_reward.academy_currency_description',
    duration: 0, // Instant
    value: 50, // 50 AC
    icon: '🏛️',
  },
  {
    type: 'expedition_speed',
    titleKey: 'ad_reward.expedition_speed_title',
    descriptionKey: 'ad_reward.expedition_speed_description',
    duration: 30 * 60 * 1000, // 30 minutes
    value: 1.5, // x1.5 speed
    icon: '🚀',
  },
  {
    type: 'museum_bonus',
    titleKey: 'ad_reward.museum_bonus_title',
    descriptionKey: 'ad_reward.museum_bonus_description',
    duration: 60 * 60 * 1000, // 1 hour
    value: 2, // x2 income
    icon: '🏛️',
  },
  {
    type: 'artifact_chance_p2',
    titleKey: 'ad_reward.artifact_chance_title',
    descriptionKey: 'ad_reward.artifact_chance_p2_description',
    duration: 30 * 60 * 1000, // 30 minutes
    value: 15, // +15%
    icon: '✨',
  },
];

export interface AdRewardState {
  activeBoosters: {
    xp_boost_end?: number;
    xp_boost_mult?: number;
    currency_boost_end?: number;
    currency_boost_mult?: number;
    artifact_boost_end?: number;
    artifact_boost_mult?: number;
    museum_boost_end?: number;
    museum_boost_mult?: number;
    speed_boost_end?: number;
    speed_boost_mult?: number;
  };
  academyCurrency: number;
}

/**
 * Get rewards pool based on player prestige
 */
export function getRewardsPool(prestigeLevel: number): AdReward[] {
  return prestigeLevel >= 2 ? P2_PLUS_REWARDS : P0_P1_REWARDS;
}

/**
 * Get available rewards (not currently active)
 */
export function getAvailableRewards(prestigeLevel: number, currentState: AdRewardState): AdReward[] {
  const pool = getRewardsPool(prestigeLevel);
  const now = Date.now();
  
  return pool.filter(reward => {
    switch (reward.type) {
      case 'xp_boost':
        return !currentState.activeBoosters.xp_boost_end || currentState.activeBoosters.xp_boost_end < now;
      case 'currency_boost':
        return !currentState.activeBoosters.currency_boost_end || currentState.activeBoosters.currency_boost_end < now;
      case 'offline_income':
        return true; // Always available
      case 'artifact_chance_p0':
      case 'artifact_chance_p2':
        return !currentState.activeBoosters.artifact_boost_end || currentState.activeBoosters.artifact_boost_end < now;
      case 'academy_currency':
        return true; // Always available
      case 'expedition_speed':
        return !currentState.activeBoosters.speed_boost_end || currentState.activeBoosters.speed_boost_end < now;
      case 'museum_bonus':
        return !currentState.activeBoosters.museum_boost_end || currentState.activeBoosters.museum_boost_end < now;
      default:
        return true;
    }
  });
}

/**
 * Apply reward to player state
 */
export function applyReward(state: AdRewardState, reward: AdReward): AdRewardState {
  const now = Date.now();
  const newState = { ...state, activeBoosters: { ...state.activeBoosters } };
  
  switch (reward.type) {
    case 'xp_boost':
      newState.activeBoosters.xp_boost_end = now + reward.duration;
      newState.activeBoosters.xp_boost_mult = reward.value;
      break;
    case 'currency_boost':
      newState.activeBoosters.currency_boost_end = now + reward.duration;
      newState.activeBoosters.currency_boost_mult = reward.value;
      break;
    case 'offline_income':
      // Trigger offline income calculation
      break;
    case 'artifact_chance_p0':
    case 'artifact_chance_p2':
      newState.activeBoosters.artifact_boost_end = now + reward.duration;
      newState.activeBoosters.artifact_boost_mult = reward.value;
      break;
    case 'academy_currency':
      newState.academyCurrency += reward.value;
      break;
    case 'expedition_speed':
      newState.activeBoosters.speed_boost_end = now + reward.duration;
      newState.activeBoosters.speed_boost_mult = reward.value;
      break;
    case 'museum_bonus':
      newState.activeBoosters.museum_boost_end = now + reward.duration;
      newState.activeBoosters.museum_boost_mult = reward.value;
      break;
  }
  
  return newState;
}

/**
 * Check if a boost is active
 */
export function isBoostActive(
  state: AdRewardState, 
  boostType: 'xp' | 'currency' | 'artifact' | 'museum' | 'speed'
): boolean {
  const now = Date.now();
  
  switch (boostType) {
    case 'xp':
      return !!state.activeBoosters.xp_boost_end && 
             state.activeBoosters.xp_boost_end > now &&
             !!state.activeBoosters.xp_boost_mult;
    case 'currency':
      return !!state.activeBoosters.currency_boost_end && 
             state.activeBoosters.currency_boost_end > now &&
             !!state.activeBoosters.currency_boost_mult;
    case 'artifact':
      return !!state.activeBoosters.artifact_boost_end && 
             state.activeBoosters.artifact_boost_end > now &&
             !!state.activeBoosters.artifact_boost_mult;
    case 'museum':
      return !!state.activeBoosters.museum_boost_end && 
             state.activeBoosters.museum_boost_end > now &&
             !!state.activeBoosters.museum_boost_mult;
    case 'speed':
      return !!state.activeBoosters.speed_boost_end && 
             state.activeBoosters.speed_boost_end > now &&
             !!state.activeBoosters.speed_boost_mult;
    default:
      return false;
  }
}

/**
 * Get remaining time for boost in milliseconds
 */
export function getBoostRemainingTime(
  state: AdRewardState, 
  boostType: 'xp' | 'currency' | 'artifact' | 'museum' | 'speed'
): number {
  const now = Date.now();
  
  switch (boostType) {
    case 'xp':
      if (!state.activeBoosters.xp_boost_end) return 0;
      return Math.max(0, state.activeBoosters.xp_boost_end - now);
    case 'currency':
      if (!state.activeBoosters.currency_boost_end) return 0;
      return Math.max(0, state.activeBoosters.currency_boost_end - now);
    case 'artifact':
      if (!state.activeBoosters.artifact_boost_end) return 0;
      return Math.max(0, state.activeBoosters.artifact_boost_end - now);
    case 'museum':
      if (!state.activeBoosters.museum_boost_end) return 0;
      return Math.max(0, state.activeBoosters.museum_boost_end - now);
    case 'speed':
      if (!state.activeBoosters.speed_boost_end) return 0;
      return Math.max(0, state.activeBoosters.speed_boost_end - now);
    default:
      return 0;
  }
}

/**
 * Get boost multiplier value
 */
export function getBoostMultiplier(
  state: AdRewardState, 
  boostType: 'xp' | 'currency' | 'artifact' | 'museum' | 'speed'
): number {
  switch (boostType) {
    case 'xp':
      return state.activeBoosters.xp_boost_mult || 1;
    case 'currency':
      return state.activeBoosters.currency_boost_mult || 1;
    case 'artifact':
      return state.activeBoosters.artifact_boost_mult || 1;
    case 'museum':
      return state.activeBoosters.museum_boost_mult || 1;
    case 'speed':
      return state.activeBoosters.speed_boost_mult || 1;
    default:
      return 1;
  }
}

// AdsGram Controller (lazy initialization)
let adsgramController: ReturnType<typeof initAdsgram> | null = null;

/**
 * Initialize AdsGram SDK
 */
export function initializeAdSystem(): void {
  if (!adsgramController) {
    adsgramController = initAdsgram(ADSGRAM_BLOCK_ID, false);
  }
}

/**
 * Watch an ad and get the selected reward
 */
export async function watchAdAndClaimReward(
  _reward: AdReward, // Reward type determines which boosters to activate
  telegramId: number
): Promise<{ success: boolean; error?: string }> {
  if (!adsgramController) {
    initializeAdSystem();
  }
  
  if (!adsgramController) {
    return { success: false, error: 'Ad system not available' };
  }
  
  // Show the ad
  const result: AdShowResult = await showRewardAd(adsgramController, telegramId);
  
  if (!result.success) {
    return { success: false, error: result.error };
  }
  
  return { success: true };
}

/**
 * Get active boosts for display
 */
export interface ActiveBoostInfo {
  type: 'xp' | 'currency' | 'artifact' | 'museum' | 'speed';
  remainingTime: number;
  multiplier: number;
  icon: string;
}

export function getActiveBoosts(state: AdRewardState): ActiveBoostInfo[] {
  const activeBoosts: ActiveBoostInfo[] = [];
  const now = Date.now();
  
  if (isBoostActive(state, 'xp') && state.activeBoosters.xp_boost_end) {
    activeBoosts.push({
      type: 'xp',
      remainingTime: state.activeBoosters.xp_boost_end - now,
      multiplier: state.activeBoosters.xp_boost_mult || 2,
      icon: '⚡',
    });
  }
  
  if (isBoostActive(state, 'currency') && state.activeBoosters.currency_boost_end) {
    activeBoosts.push({
      type: 'currency',
      remainingTime: state.activeBoosters.currency_boost_end - now,
      multiplier: state.activeBoosters.currency_boost_mult || 1.5,
      icon: '💰',
    });
  }
  
  if (isBoostActive(state, 'artifact') && state.activeBoosters.artifact_boost_end) {
    activeBoosts.push({
      type: 'artifact',
      remainingTime: state.activeBoosters.artifact_boost_end - now,
      multiplier: state.activeBoosters.artifact_boost_mult || 1,
      icon: '🏺',
    });
  }
  
  if (isBoostActive(state, 'museum') && state.activeBoosters.museum_boost_end) {
    activeBoosts.push({
      type: 'museum',
      remainingTime: state.activeBoosters.museum_boost_end - now,
      multiplier: state.activeBoosters.museum_boost_mult || 1,
      icon: '🏛️',
    });
  }
  
  if (isBoostActive(state, 'speed') && state.activeBoosters.speed_boost_end) {
    activeBoosts.push({
      type: 'speed',
      remainingTime: state.activeBoosters.speed_boost_end - now,
      multiplier: state.activeBoosters.speed_boost_mult || 1,
      icon: '🚀',
    });
  }
  
  return activeBoosts;
}
