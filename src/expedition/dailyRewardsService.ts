/**
 * Daily Rewards Service
 * 
 * Provides:
 * - 30-day reward cycle
 * - Streak tracking
 * - Supabase persistence
 */

import { supabase } from '../lib/supabase';
import { getTelegramUserId } from '../lib/telegram';

export interface DailyReward {
  day: number;
  type: 'karbovanets' | 'xp' | 'artifact' | 'boost';
  amount: number;
  itemId?: string;
  label: string;
}

export interface DailyRewardState {
  lastClaimDate: number;
  currentStreak: number;
  longestStreak: number;
  totalClaims: number;
  lastRewardDay: number;
}

const DAILY_REWARDS: DailyReward[] = [
  { day: 1, type: 'karbovanets', amount: 100, label: '100 💰' },
  { day: 2, type: 'karbovanets', amount: 150, label: '150 💰' },
  { day: 3, type: 'xp', amount: 50, label: '50 досвіду' },
  { day: 4, type: 'karbovanets', amount: 200, label: '200 💰' },
  { day: 5, type: 'artifact', amount: 1, itemId: 'common_fragment', label: 'Артефакт 🔮' },
  { day: 6, type: 'karbovanets', amount: 250, label: '250 💰' },
  { day: 7, type: 'boost', amount: 1, itemId: 'xp_boost_1h', label: 'Досвід x2 🌟' },
  { day: 8, type: 'karbovanets', amount: 300, label: '300 💰' },
  { day: 9, type: 'xp', amount: 100, label: '100 досвіду' },
  { day: 10, type: 'artifact', amount: 1, itemId: 'rare_fragment', label: 'Рідкісний 🔮' },
  { day: 11, type: 'karbovanets', amount: 350, label: '350 💰' },
  { day: 12, type: 'karbovanets', amount: 400, label: '400 💰' },
  { day: 13, type: 'xp', amount: 150, label: '150 досвіду' },
  { day: 14, type: 'boost', amount: 1, itemId: 'super_boost_30m', label: 'x3 30хв 🌟' },
  { day: 15, type: 'artifact', amount: 1, itemId: 'epic_fragment', label: 'Епічний 🔮' },
  { day: 16, type: 'karbovanets', amount: 500, label: '500 💰' },
  { day: 17, type: 'xp', amount: 200, label: '200 досвіду' },
  { day: 18, type: 'karbovanets', amount: 550, label: '550 💰' },
  { day: 19, type: 'karbovanets', amount: 600, label: '600 💰' },
  { day: 20, type: 'artifact', amount: 1, itemId: 'rare_fragment_x3', label: '3x Рідкісні 🔮' },
  { day: 21, type: 'boost', amount: 1, itemId: 'currency_boost_1h', label: 'Валюта x2 💎' },
  { day: 22, type: 'karbovanets', amount: 700, label: '700 💰' },
  { day: 23, type: 'xp', amount: 300, label: '300 досвіду' },
  { day: 24, type: 'karbovanets', amount: 800, label: '800 💰' },
  { day: 25, type: 'artifact', amount: 1, itemId: 'epic_fragment_x2', label: '2x Епічні 🔮' },
  { day: 26, type: 'karbovanets', amount: 900, label: '900 💰' },
  { day: 27, type: 'xp', amount: 400, label: '400 досвіду' },
  { day: 28, type: 'karbovanets', amount: 1000, label: '1000 💰' },
  { day: 29, type: 'boost', amount: 1, itemId: 'super_boost_30m', label: 'x3 30хв 🌟' },
  { day: 30, type: 'artifact', amount: 1, itemId: 'legendary_fragment', label: 'Легендарний 🔮' },
];

class DailyRewardService {
  /**
   * Load daily reward state from Supabase
   */
  async loadState(): Promise<DailyRewardState | null> {
    if (!supabase) return null;
    
    const telegramId = getTelegramUserId();
    if (!telegramId) return null;

    try {
      const { data, error } = await supabase
        .from('game_progress')
        .select('daily_reward_state')
        .eq('telegram_id', telegramId)
        .maybeSingle();

      if (error || !data) return null;
      return data.daily_reward_state as DailyRewardState;
    } catch {
      return null;
    }
  }

  /**
   * Save daily reward state to Supabase
   */
  async saveState(state: DailyRewardState): Promise<boolean> {
    if (!supabase) return false;
    
    const telegramId = getTelegramUserId();
    if (!telegramId) return false;

    try {
      const { error } = await supabase
        .from('game_progress')
        .update({ daily_reward_state: state })
        .eq('telegram_id', telegramId);

      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Check if reward can be claimed today
   */
  canClaimToday(state: DailyRewardState | null): boolean {
    if (!state) return true;
    
    const now = Date.now();
    const lastClaim = state.lastClaimDate;
    
    // Check if last claim was more than 24 hours ago
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    // If same day, can't claim
    if (this.isSameDay(now, lastClaim)) return false;
    
    // If more than 2 days passed, streak resets
    if (now - lastClaim > 2 * oneDayMs) return true; // Can claim but streak resets
    
    return true;
  }

  /**
   * Check if streak is broken
   */
  isStreakBroken(state: DailyRewardState | null): boolean {
    if (!state) return false;
    
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const twoDaysMs = 2 * oneDayMs;
    
    return now - state.lastClaimDate > twoDaysMs;
  }

  /**
   * Get current reward day (cycles every 30 days)
   */
  getCurrentRewardDay(state: DailyRewardState | null): number {
    if (!state) return 1;
    return (state.lastRewardDay % 30) + 1;
  }

  /**
   * Get reward for current day
   */
  getRewardForDay(day: number): DailyReward {
    const cycleDay = ((day - 1) % 30) + 1;
    return DAILY_REWARDS.find(r => r.day === cycleDay) || DAILY_REWARDS[0];
  }

  /**
   * Claim daily reward
   */
  async claimReward(
    currentState: DailyRewardState | null
  ): Promise<{ reward: DailyReward; newState: DailyRewardState } | null> {
    const now = Date.now();
    
    let newState: DailyRewardState;
    
    if (!currentState || this.isStreakBroken(currentState)) {
      // Fresh start or streak broken
      newState = {
        lastClaimDate: now,
        currentStreak: 1,
        longestStreak: Math.max(1, currentState?.longestStreak || 0),
        totalClaims: 1,
        lastRewardDay: 1,
      };
    } else if (this.isSameDay(now, currentState.lastClaimDate)) {
      // Already claimed today
      return null;
    } else {
      // Continue streak
      newState = {
        lastClaimDate: now,
        currentStreak: currentState.currentStreak + 1,
        longestStreak: Math.max(currentState.longestStreak, currentState.currentStreak + 1),
        totalClaims: currentState.totalClaims + 1,
        lastRewardDay: (currentState.lastRewardDay % 30) + 1,
      };
    }

    const reward = this.getRewardForDay(newState.lastRewardDay);
    
    // Save state
    await this.saveState(newState);
    
    return { reward, newState };
  }

  /**
   * Check if two timestamps are on the same day
   */
  private isSameDay(ts1: number, ts2: number): boolean {
    const d1 = new Date(ts1);
    const d2 = new Date(ts2);
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  /**
   * Get time until next reward available
   */
  getTimeUntilNextReward(state: DailyRewardState | null): number {
    if (!state) return 0;
    
    const now = Date.now();
    const nextMidnight = new Date(state.lastClaimDate);
    nextMidnight.setHours(24, 0, 0, 0);
    
    return Math.max(0, nextMidnight.getTime() - now);
  }
}

export const dailyRewardService = new DailyRewardService();
