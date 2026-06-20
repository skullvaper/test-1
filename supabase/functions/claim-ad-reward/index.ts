import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

/**
 * Claim Ad Reward Edge Function
 *
 * Server-authoritative ad reward system.
 * Handles all ad reward types with daily limits.
 *
 * Reward types:
 * - energy_restore: Restore 100 energy (max 5/day)
 * - chest_bonus: Extra artifact fragment from chest (max 3/day)
 * - offline_x2: Double offline income (max 3/day)
 * - session_ad: XP boost x2 for 5 minutes (max 5/day)
 *
 * Daily limits stored in daily_ad_views column
 */

interface ClaimAdRewardRequest {
  telegram_id: number;
  reward_type: "energy_restore" | "chest_bonus" | "offline_x2" | "session_ad";
}

interface DailyAdViews {
  energy_ads?: number;
  chest_ads?: number;
  offline_ads?: number;
  session_ads?: number;
  last_reset?: string;
}

interface ClaimAdRewardResponse {
  success: boolean;
  error?: string;
  reward_applied?: boolean;
  new_value?: number;
  remaining_today?: number;
  boost_end?: string;
}

// Daily limits per reward type
const DAILY_LIMITS: Record<string, number> = {
  energy_restore: 5,
  chest_bonus: 3,
  offline_x2: 3,
  session_ad: 5,
};

// Session ad boost duration: 5 minutes
const SESSION_BOOST_DURATION_MS = 5 * 60 * 1000;

function jsonResponse(data: ClaimAdRewardResponse | { error: string }, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Get today's date in YYYY-MM-DD format (UTC)
 */
function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Reset daily ad views if new day
 */
function resetIfNewDay(adViews: DailyAdViews): DailyAdViews {
  const today = getTodayDate();
  if (adViews.last_reset !== today) {
    return {
      energy_ads: 0,
      chest_ads: 0,
      offline_ads: 0,
      session_ads: 0,
      last_reset: today,
    };
  }
  return adViews;
}

/**
 * Get ad count key for reward type
 */
function getAdCountKey(rewardType: string): keyof DailyAdViews {
  switch (rewardType) {
    case "energy_restore":
      return "energy_ads";
    case "chest_bonus":
      return "chest_ads";
    case "offline_x2":
      return "offline_ads";
    case "session_ad":
      return "session_ads";
    default:
      return "energy_ads";
  }
}

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const body: ClaimAdRewardRequest = await req.json();
    const { telegram_id, reward_type } = body;

    if (!telegram_id || typeof telegram_id !== "number" || telegram_id <= 0) {
      return jsonResponse({ error: "Invalid telegram_id" }, 400);
    }

    if (!reward_type || !DAILY_LIMITS[reward_type]) {
      return jsonResponse({ error: "Invalid reward_type" }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Fetch player state
    const { data: player, error: fetchError } = await supabase
      .from("game_progress")
      .select("energy, max_energy, daily_ad_views, active_boosters")
      .eq("telegram_id", telegram_id)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching player:", fetchError);
      return jsonResponse({ error: "Database error" }, 500);
    }

    if (!player) {
      return jsonResponse({ error: "Player not found" }, 404);
    }

    // Check and reset daily limits
    const dailyAdViews = resetIfNewDay((player.daily_ad_views as DailyAdViews) || {});
    const adCountKey = getAdCountKey(reward_type);
    const currentCount = dailyAdViews[adCountKey] || 0;
    const dailyLimit = DAILY_LIMITS[reward_type];

    if (currentCount >= dailyLimit) {
      return jsonResponse({
        success: false,
        error: `Daily limit reached for ${reward_type}`,
        remaining_today: 0,
      }, 429);
    }

    // Apply reward based on type
    let updateData: Record<string, unknown> = {};
    let rewardApplied = false;
    let newValue = 0;

    switch (reward_type) {
      case "energy_restore": {
        // Restore 100 energy (up to max_energy = 1000)
        const currentEnergy = (player.energy as number) || 0;
        const maxEnergy = (player.max_energy as number) || 1000;
        newValue = Math.min(currentEnergy + 100, maxEnergy);
        updateData.energy = newValue;
        rewardApplied = true;
        break;
      }

      case "chest_bonus": {
        // Chest bonus is handled in open-chest, this just tracks limit
        rewardApplied = true;
        break;
      }

      case "offline_x2": {
        // Offline x2 is handled client-side after verification
        // Mark boost in active_boosters for validation
        const activeBoosters = (player.active_boosters as Record<string, unknown>) || {};
        updateData.active_boosters = {
          ...activeBoosters,
          offline_boost_end: Date.now() + 30 * 60 * 1000, // 30 minutes validity
        };
        rewardApplied = true;
        break;
      }

      case "session_ad": {
        // Apply x2 XP boost for 5 minutes (write to xp_boost_end so client reads it)
        const activeBoosters = (player.active_boosters as Record<string, unknown>) || {};
        const now = Date.now();
        const currentXpBoostEnd = (activeBoosters.xp_boost_end as number) || 0;
        const newBoostEnd = now + SESSION_BOOST_DURATION_MS;
        // Don't shorten an existing longer boost
        updateData.active_boosters = {
          ...activeBoosters,
          xp_boost_end: Math.max(currentXpBoostEnd, newBoostEnd),
          xp_boost_mult: Math.max(activeBoosters.xp_boost_mult as number || 2, 2),
        };
        rewardApplied = true;
        newValue = Math.max(currentXpBoostEnd, newBoostEnd);
        break;
      }
    }

    // Increment ad count for today
    dailyAdViews[adCountKey] = currentCount + 1;
    dailyAdViews.last_reset = getTodayDate();
    updateData.daily_ad_views = dailyAdViews;

    // Update database
    const { error: updateError } = await supabase
      .from("game_progress")
      .update(updateData)
      .eq("telegram_id", telegram_id);

    if (updateError) {
      console.error("Error updating ad reward:", updateError);
      return jsonResponse({ error: "Failed to apply reward" }, 500);
    }

    // Log ad view for statistics
    await supabase.from("ad_views").insert({
      telegram_id,
      ad_type: "rewarded",
      reward_type,
      reward_granted: rewardApplied,
    });

    const remainingToday = dailyLimit - (currentCount + 1);

    console.log(`Ad reward claimed: user=${telegram_id}, type=${reward_type}, remaining=${remainingToday}`);

    return jsonResponse({
      success: true,
      reward_applied: rewardApplied,
      new_value: newValue || undefined,
      remaining_today: remainingToday,
      boost_end: reward_type === "session_ad" ? new Date(newValue).toISOString() : undefined,
    });
  } catch (err) {
    console.error("Claim ad reward error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
