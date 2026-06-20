// Supabase client
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;
  
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    return supabaseInstance;
  } catch (error) {
    console.error('Failed to initialize Supabase:', error);
    return null;
  }
}

// For backwards compatibility - returns null if not configured
export const supabase = typeof window !== 'undefined' ? getSupabase() : null;

// Database types for game_progress table
export interface GameProgressRow {
  telegram_id: number;
  state: Record<string, unknown>;
  updated_at: string;
  created_at: string;
}

export interface ReferralRow {
  id: number;
  telegram_id: number;
  referrer_id: number;
  created_at: string;
  bonus_claimed: boolean;
}

export interface AdsRewardRow {
  id: number;
  telegram_id: number;
  reward_type: string;
  amount: number;
  created_at: string;
}

export interface LeaderboardRow {
  telegram_id: number;
  first_name: string | null;
  username: string | null;
  level: number;
  total_xp: number;
  prestige_level: number;
  referrals_count: number;
}

// Helper to check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  return !!(
    import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_ANON_KEY &&
    !import.meta.env.VITE_SUPABASE_URL.includes('placeholder')
  );
}
