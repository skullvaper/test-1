/**
 * Leaderboard Service
 * 
 * Provides real Supabase leaderboard queries:
 * - Global leaderboard (all players)
 * - Weekly leaderboard (reset every Monday)
 * - Friends leaderboard (if friend system exists)
 */

import { supabase } from '../lib/supabase';
import { getTelegramUserId } from '../lib/telegram';

export type LeaderboardType = 'global' | 'weekly' | 'friends';
export type RankingMetric = 'prestige' | 'reputation' | 'artifacts' | 'hero_power';

export interface LeaderboardEntry {
  rank: number;
  telegram_id: number;
  username: string;
  avatar_url?: string;
  prestige: number;
  reputation: number;
  artifacts: number;
  hero_power: number;
  updated_at: string;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  userRank?: LeaderboardEntry;
  totalPlayers: number;
  weekStart?: number;
}

const LEADERBOARD_CACHE_KEY = 'leaderboard_cache';
const LEADERBOARD_CACHE_TTL = 60000; // 1 minute cache

class LeaderboardService {
  /**
   * Get leaderboard entries
   */
  async getLeaderboard(
    type: LeaderboardType,
    metric: RankingMetric = 'prestige',
    limit: number = 100,
    offset: number = 0
  ): Promise<LeaderboardResponse> {
    const telegramId = getTelegramUserId();
    
    if (!supabase) {
      return { entries: [], totalPlayers: 0 };
    }
    
    const metricColumn: Record<RankingMetric, string> = {
      prestige: 'historical_prestige',
      reputation: 'reputation',
      artifacts: 'artifacts_count',
      hero_power: 'hero_power_score',
    };

    try {
      const selectColumn = metricColumn[metric];
      
      let query = supabase
        .from('game_progress')
        .select(`
          telegram_id,
          historical_prestige,
          reputation,
          artifacts_count,
          hero_power_score,
          username,
          avatar_url,
          updated_at
        `)
        .order(selectColumn, { ascending: false })
        .range(offset, offset + limit - 1);

      if (type === 'weekly') {
        const weekStart = this.getWeekStart();
        query = query.gte('updated_at', new Date(weekStart).toISOString());
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Leaderboard query error:', error);
        return { entries: [], totalPlayers: 0 };
      }

      const entries: LeaderboardEntry[] = (data || []).map((row, index) => ({
        rank: offset + index + 1,
        telegram_id: row.telegram_id as number,
        username: (row as Record<string, unknown>).username as string || `Player${row.telegram_id}`,
        avatar_url: (row as Record<string, unknown>).avatar_url as string | undefined,
        prestige: (row.historical_prestige as number) || 0,
        reputation: (row.reputation as number) || 0,
        artifacts: (row.artifacts_count as number) || 0,
        hero_power: (row.hero_power_score as number) || 0,
        updated_at: (row.updated_at as string) || '',
      }));

      let userRank: LeaderboardEntry | undefined;
      if (telegramId) {
        userRank = entries.find(e => e.telegram_id === telegramId);
        if (!userRank) {
          const userEntry = await this.getUserRank(telegramId, metric);
          userRank = userEntry;
        }
      }

      return {
        entries,
        userRank,
        totalPlayers: count || entries.length,
        weekStart: type === 'weekly' ? this.getWeekStart() : undefined,
      };
    } catch (e) {
      console.error('Leaderboard fetch error:', e);
      return { entries: [], totalPlayers: 0 };
    }
  }

  /**
   * Get a specific user's rank
   */
  async getUserRank(telegramId: number, metric: RankingMetric = 'prestige'): Promise<LeaderboardEntry | undefined> {
    if (!supabase) return undefined;
    
    const metricColumn: Record<RankingMetric, string> = {
      prestige: 'historical_prestige',
      reputation: 'reputation',
      artifacts: 'artifacts_count',
      hero_power: 'hero_power_score',
    };

    try {
      const { data: userData } = await supabase
        .from('game_progress')
        .select(metricColumn[metric])
        .eq('telegram_id', telegramId)
        .maybeSingle();

      if (!userData) return undefined;

      const userScore = (userData as unknown as Record<string, unknown>)[metricColumn[metric]] as number;

      const { count } = await supabase
        .from('game_progress')
        .select('telegram_id', { count: 'exact', head: true })
        .gte(metricColumn[metric], userScore + 1);

      const rank = (count || 0) + 1;

      const { data: fullData } = await supabase
        .from('game_progress')
        .select(`
          telegram_id,
          historical_prestige,
          reputation,
          artifacts_count,
          hero_power_score,
          username,
          avatar_url,
          updated_at
        `)
        .eq('telegram_id', telegramId)
        .maybeSingle();

      if (!fullData) return undefined;

      return {
        rank,
        telegram_id: fullData.telegram_id as number,
        username: (fullData as unknown as Record<string, unknown>).username as string || `Player${fullData.telegram_id}`,
        avatar_url: (fullData as unknown as Record<string, unknown>).avatar_url as string | undefined,
        prestige: (fullData.historical_prestige as number) || 0,
        reputation: (fullData.reputation as number) || 0,
        artifacts: (fullData.artifacts_count as number) || 0,
        hero_power: (fullData.hero_power_score as number) || 0,
        updated_at: (fullData.updated_at as string) || '',
      };
    } catch (e) {
      console.error('Get user rank error:', e);
      return undefined;
    }
  }

  /**
   * Update player's leaderboard scores
   */
  async updatePlayerScore(
    telegramId: number,
    scores: {
      historicalPrestige?: number;
      reputation?: number;
      artifactsCount?: number;
      heroPowerScore?: number;
    }
  ): Promise<boolean> {
    if (!supabase) return false;
    
    try {
      const updates: Record<string, unknown> = {};
      
      if (scores.historicalPrestige !== undefined) {
        updates.historical_prestige = scores.historicalPrestige;
      }
      if (scores.reputation !== undefined) {
        updates.reputation = scores.reputation;
      }
      if (scores.artifactsCount !== undefined) {
        updates.artifacts_count = scores.artifactsCount;
      }
      if (scores.heroPowerScore !== undefined) {
        updates.hero_power_score = scores.heroPowerScore;
      }

      updates.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('game_progress')
        .update(updates)
        .eq('telegram_id', telegramId);

      if (error) {
        console.error('Update player score error:', error);
        return false;
      }

      return true;
    } catch (e) {
      console.error('Update player score error:', e);
      return false;
    }
  }

  /**
   * Get week start timestamp
   */
  private getWeekStart(): number {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday.getTime();
  }

  /**
   * Cache helper
   */
  getCached(key: string): LeaderboardResponse | null {
    try {
      const cached = localStorage.getItem(`${LEADERBOARD_CACHE_KEY}_${key}`);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp > LEADERBOARD_CACHE_TTL) {
        localStorage.removeItem(`${LEADERBOARD_CACHE_KEY}_${key}`);
        return null;
      }

      return data;
    } catch {
      return null;
    }
  }

  setCached(key: string, data: LeaderboardResponse): void {
    try {
      localStorage.setItem(`${LEADERBOARD_CACHE_KEY}_${key}`, JSON.stringify({
        data,
        timestamp: Date.now(),
      }));
    } catch {
      // Ignore cache errors
    }
  }
}

export const leaderboardService = new LeaderboardService();
