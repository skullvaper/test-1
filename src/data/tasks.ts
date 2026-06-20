// Daily tasks and streak system
import type { DailyCounters, DailyTasksState } from '../types/game';
import { getTodayDateStr } from '../lib/utils';

// Re-export for convenience
export { getTodayDateStr };

// Task pool - tasks that can appear in daily rotation
export interface TaskDef {
  id: string;
  titleKey: string;
  descriptionKey: string;
  icon: string;
  type: keyof DailyCounters;
  target: number;
  reward: { type: 'xp' | 'currency'; amount: number };
}

export const TASK_POOL: TaskDef[] = [
  {
    id: 'tap_100',
    titleKey: 'tasks.tap_100_title',
    descriptionKey: 'tasks.tap_100_desc',
    icon: '👆',
    type: 'tap',
    target: 100,
    reward: { type: 'xp', amount: 500 },
  },
  {
    id: 'tap_500',
    titleKey: 'tasks.tap_500_title',
    descriptionKey: 'tasks.tap_500_desc',
    icon: '👆',
    type: 'tap',
    target: 500,
    reward: { type: 'xp', amount: 2500 },
  },
  {
    id: 'tap_1000',
    titleKey: 'tasks.tap_1000_title',
    descriptionKey: 'tasks.tap_1000_desc',
    icon: '👆',
    type: 'tap',
    target: 1000,
    reward: { type: 'xp', amount: 5000 },
  },
  {
    id: 'buy_generator',
    titleKey: 'tasks.buy_generator_title',
    descriptionKey: 'tasks.buy_generator_desc',
    icon: '🏭',
    type: 'buy_generator',
    target: 1,
    reward: { type: 'currency', amount: 100 },
  },
  {
    id: 'upgrade_tap',
    titleKey: 'tasks.upgrade_tap_title',
    descriptionKey: 'tasks.upgrade_tap_desc',
    icon: '⬆️',
    type: 'upgrade_tap',
    target: 1,
    reward: { type: 'xp', amount: 300 },
  },
  {
    id: 'open_gacha',
    titleKey: 'tasks.open_gacha_title',
    descriptionKey: 'tasks.open_gacha_desc',
    icon: '🎁',
    type: 'open_gacha',
    target: 1,
    reward: { type: 'currency', amount: 200 },
  },
  {
    id: 'earn_xp_1000',
    titleKey: 'tasks.earn_xp_1000_title',
    descriptionKey: 'tasks.earn_xp_1000_desc',
    icon: '⭐',
    type: 'earn_xp',
    target: 1000,
    reward: { type: 'xp', amount: 1000 },
  },
  {
    id: 'earn_xp_5000',
    titleKey: 'tasks.earn_xp_5000_title',
    descriptionKey: 'tasks.earn_xp_5000_desc',
    icon: '⭐',
    type: 'earn_xp',
    target: 5000,
    reward: { type: 'xp', amount: 4000 },
  },
];

// Streak rewards
export interface StreakReward {
  day: number;
  xp: number;
  currency: number;
  special?: string;
}

export const STREAK_REWARDS: StreakReward[] = [
  { day: 1, xp: 100, currency: 50 },
  { day: 2, xp: 200, currency: 100 },
  { day: 3, xp: 400, currency: 200 },
  { day: 4, xp: 600, currency: 300 },
  { day: 5, xp: 1000, currency: 500 },
  { day: 6, xp: 1500, currency: 750 },
  { day: 7, xp: 3000, currency: 1500, special: 'legendary_chest' },
];

// Daily check-in rewards (30-day cycle)
export const CHECK_IN_REWARDS: Array<{ xp: number; currency: number; item?: string }> = [
  { xp: 100, currency: 50 },
  { xp: 150, currency: 75 },
  { xp: 200, currency: 100 },
  { xp: 300, currency: 150 },
  { xp: 400, currency: 200 },
  { xp: 500, currency: 250 },
  { xp: 1000, currency: 500, item: 'common_chest' },
  { xp: 600, currency: 300 },
  { xp: 700, currency: 350 },
  { xp: 800, currency: 400 },
  { xp: 1000, currency: 500 },
  { xp: 1200, currency: 600 },
  { xp: 1500, currency: 750 },
  { xp: 3000, currency: 1500, item: 'rare_chest' },
  // Continue cycle...
  { xp: 1000, currency: 500 },
  { xp: 1100, currency: 550 },
  { xp: 1200, currency: 600 },
  { xp: 1400, currency: 700 },
  { xp: 1600, currency: 800 },
  { xp: 2000, currency: 1000 },
  { xp: 4000, currency: 2000, item: 'epic_chest' },
  { xp: 2000, currency: 1000 },
  { xp: 2200, currency: 1100 },
  { xp: 2500, currency: 1250 },
  { xp: 3000, currency: 1500 },
  { xp: 3500, currency: 1750 },
  { xp: 4000, currency: 2000 },
  { xp: 8000, currency: 4000, item: 'legendary_chest' },
  { xp: 4000, currency: 2000 },
  { xp: 4500, currency: 2250 },
  { xp: 5000, currency: 2500 },
  { xp: 6000, currency: 3000 },
];

/**
 * Check if a task is complete based on counters
 */
export function isTaskComplete(task: TaskDef, counters: DailyCounters): boolean {
  return counters[task.type] >= task.target;
}

/**
 * Get task progress as percentage
 */
export function getTaskProgress(task: TaskDef, counters: DailyCounters): number {
  const current = counters[task.type] || 0;
  return Math.min(100, (current / task.target) * 100);
}

/**
 * Pick random tasks for the day
 */
export function pickDailyTasks(count = 3): TaskDef[] {
  const shuffled = [...TASK_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Create initial daily tasks state
 */
export function createDailyTasksState(): DailyTasksState {
  const today = getTodayDateStr();
  const tasks = pickDailyTasks(3);
  
  return {
    date: today,
    taskIds: tasks.map(t => t.id),
    counters: {
      tap: 0,
      buy_generator: 0,
      open_gacha: 0,
      upgrade_tap: 0,
      earn_xp: 0,
    },
    claimed: [],
  };
}

/**
 * Check if daily tasks need to be refreshed
 */
export function shouldRefreshDailyTasks(state: DailyTasksState | null): boolean {
  if (!state) return true;
  return state.date !== getTodayDateStr();
}

/**
 * Get streak reward for a given day
 */
export function getStreakReward(day: number): StreakReward | null {
  // Cycle rewards every 7 days
  const cycleDay = ((day - 1) % 7) + 1;
  return STREAK_REWARDS[cycleDay - 1] || null;
}

/**
 * Check if streak should continue (login within 48 hours)
 */
export function shouldContinueStreak(
  lastLoginDate: string | null,
  currentDate: string
): boolean {
  if (!lastLoginDate) return true;
  
  const last = new Date(lastLoginDate);
  const current = new Date(currentDate);
  const diffDays = Math.floor((current.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
  
  // Streak continues if logged in within 1 day (allows for timezone issues)
  return diffDays <= 1;
}

/**
 * Get check-in reward for a given day in cycle
 */
export function getCheckInReward(dayInCycle: number): { xp: number; currency: number; item?: string } {
  const index = ((dayInCycle - 1) % CHECK_IN_REWARDS.length);
  return CHECK_IN_REWARDS[index];
}
