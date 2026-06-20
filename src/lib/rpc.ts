// RPC functions for server communication
import { getSupabase } from './supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';

/**
 * Track session events (start, activity, end)
 */
export async function rpcTrackSession(
  telegramId: number,
  event: 'start' | 'activity' | 'end'
): Promise<boolean> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/track-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        telegram_id: telegramId,
        event,
        timestamp: Date.now(),
      }),
    });
    
    return response.ok;
  } catch (error) {
    console.error('rpcTrackSession error:', error);
    return false;
  }
}

/**
 * Claim ad reward
 */
export async function rpcClaimAdReward(
  telegramId: number,
  rewardType: 'energy_restore' | 'session_ad' | 'chest_bonus' | 'offline_boost'
): Promise<{ success: boolean; new_value?: number; message?: string }> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/claim-ad-reward`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        telegram_id: telegramId,
        reward_type: rewardType,
      }),
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('rpcClaimAdReward error:', error);
    return { success: false, message: 'Network error' };
  }
}

/**
 * Open a chest (gacha)
 */
export async function rpcOpenChest(
  telegramId: number,
  epochId: string,
  cost: number
): Promise<{ success: boolean; artifact?: unknown; error?: string }> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/open-chest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        telegram_id: telegramId,
        epoch_id: epochId,
        cost,
      }),
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('rpcOpenChest error:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Process server rewards (for things that should be validated server-side)
 */
export async function rpcProcessRewards(
  telegramId: number,
  action: string,
  params: Record<string, unknown>
): Promise<{ success: boolean; rewards?: unknown; error?: string }> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/process-rewards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        telegram_id: telegramId,
        action,
        params,
        timestamp: Date.now(),
      }),
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('rpcProcessRewards error:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Get leaderboard data
 */
export async function rpcGetLeaderboard(
  type: 'global' | 'weekly' = 'global',
  metric: 'level' | 'prestige' | 'referrals' = 'level',
  limit = 50
): Promise<{ entries: unknown[]; user_rank?: unknown }> {
  try {
    const supabase = getSupabase();
    if (!supabase) return { entries: [] };
    
    // Use Supabase RPC or direct query
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .order(metric === 'level' ? 'total_xp' : metric === 'prestige' ? 'prestige_level' : 'referrals_count', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('rpcGetLeaderboard error:', error);
      return { entries: [] };
    }
    
    return { entries: data || [] };
  } catch (error) {
    console.error('rpcGetLeaderboard error:', error);
    return { entries: [] };
  }
}

/**
 * Sync game state to server
 */
export async function rpcSyncGameState(
  telegramId: number,
  state: Record<string, unknown>
): Promise<{ success: boolean; serverTime?: number }> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/sync-state`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        telegram_id: telegramId,
        state,
        timestamp: Date.now(),
      }),
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('rpcSyncGameState error:', error);
    return { success: false };
  }
}

/**
 * Record referral
 */
export async function rpcRecordReferral(
  telegramId: number,
  referrerId: number
): Promise<{ success: boolean; bonus?: number }> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/record-referral`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        telegram_id: telegramId,
        referrer_id: referrerId,
      }),
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('rpcRecordReferral error:', error);
    return { success: false };
  }
}

/**
 * Claim referral bonus
 */
export async function rpcClaimReferralBonus(
  telegramId: number
): Promise<{ success: boolean; bonus?: number }> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/claim-referral-bonus`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        telegram_id: telegramId,
      }),
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('rpcClaimReferralBonus error:', error);
    return { success: false };
  }
}

/**
 * Record daily task completion
 */
export async function rpcRecordDailyTask(
  telegramId: number,
  taskId: string
): Promise<{ success: boolean; reward?: unknown }> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/record-daily-task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        telegram_id: telegramId,
        task_id: taskId,
      }),
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('rpcRecordDailyTask error:', error);
    return { success: false };
  }
}
