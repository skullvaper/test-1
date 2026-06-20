/**
 * Daily Rewards Edge Function
 * 
 * Server-authoritative daily check-in system.
 * Prevents date manipulation and duplicate claims.
 * 
 * Security:
 * - HMAC-validated telegram_id
 * - Server checks last_check_in
 * - Server calculates streak
 * - Idempotency prevents replay
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createHmac } from "node:crypto";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// Daily reward tiers (day 1-7, then cycles)
const DAILY_REWARDS = [
  { day: 1, currency: 500, xp: 0 },
  { day: 2, currency: 1000, xp: 200 },
  { day: 3, currency: 1500, xp: 400 },
  { day: 4, currency: 2000, xp: 600 },
  { day: 5, currency: 3000, xp: 800 },
  { day: 6, currency: 4000, xp: 1000 },
  { day: 7, currency: 5000, xp: 1500 }, // Day 7 also grants bonus
];

function validateInitData(initData: string): { valid: boolean; userId: number | null; error?: string } {
  if (!BOT_TOKEN) return { valid: false, userId: null, error: "BOT_TOKEN not configured" };

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return { valid: false, userId: null, error: "Missing hash" };

  const authDateStr = params.get("auth_date");
  if (!authDateStr) return { valid: false, userId: null, error: "Missing auth_date" };
  const authDate = parseInt(authDateStr, 10);
  const ageSeconds = Math.floor(Date.now() / 1000) - authDate;
  if (isNaN(authDate) || ageSeconds > 86400 || ageSeconds < 0) {
    return { valid: false, userId: null, error: "initData too old or invalid" };
  }

  const keys = [...params.keys()].filter(k => k !== "hash").sort();
  const dataCheckString = keys.map(k => `${k}=${params.get(k)}`).join("\n");
  const secretKey = createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest();
  const computedHash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  if (computedHash !== hash) return { valid: false, userId: null, error: "HMAC mismatch" };

  const userStr = params.get("user");
  let userId: number | null = null;
  if (userStr) {
    try { userId = JSON.parse(userStr).id ?? null; } catch { return { valid: false, userId: null, error: "Invalid user JSON" }; }
  }

  return { valid: true, userId };
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getTodayUTC(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

function getYesterdayUTC(): string {
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json();
    const { action, init_data } = body as { action: string; init_data?: string };

    if (!init_data) return jsonResponse({ error: "Missing init_data" }, 400);
    const validation = validateInitData(init_data);
    if (!validation.valid) return jsonResponse({ error: validation.error }, 401);
    if (!validation.userId) return jsonResponse({ error: "Invalid telegram_id" }, 400);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    switch (action) {
      case "check_status":
        return await checkStatus(supabase, validation.userId);
      case "claim":
        return await claimDailyReward(supabase, validation.userId);
      default:
        return jsonResponse({ error: "Unknown action" }, 400);
    }
  } catch (err) {
    console.error("daily-rewards error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});

async function checkStatus(supabase: ReturnType<typeof createClient>, telegramId: number) {
  const { data: player, error } = await supabase
    .from("game_progress")
    .select("last_check_in, current_streak")
    .eq("telegram_id", telegramId)
    .maybeSingle();

  if (error || !player) {
    return jsonResponse({ error: "Player not found" }, 404);
  }

  const today = getTodayUTC();
  const lastCheckIn = player.last_check_in as string | null;
  const alreadyClaimed = lastCheckIn === today;

  // Calculate current streak
  let currentStreak = player.current_streak as number || 0;
  const yesterday = getYesterdayUTC();

  // If last check-in was yesterday, streak continues
  // If last check-in was today, already claimed
  // If last check-in was >1 day ago, streak breaks

  if (lastCheckIn !== today && lastCheckIn !== yesterday && lastCheckIn !== null) {
    // Missed a day - reset streak
    currentStreak = 0;
  }

  const dayInCycle = ((currentStreak - 1) % 7) + 1;
  const nextReward = DAILY_REWARDS[dayInCycle - 1] || DAILY_REWARDS[0];

  return jsonResponse({
    ok: true,
    alreadyClaimed,
    currentStreak,
    nextReward: {
      day: dayInCycle,
      currency: nextReward.currency,
      xp: nextReward.xp,
      isBonusDay: dayInCycle === 7,
    },
  });
}

async function claimDailyReward(supabase: ReturnType<typeof createClient>, telegramId: number) {
  const today = getTodayUTC();
  const yesterday = getYesterdayUTC();

  // Get current player state
  const { data: player, error } = await supabase
    .from("game_progress")
    .select("last_check_in, current_streak, currency, total_currency_earned, xp, total_xp")
    .eq("telegram_id", telegramId)
    .maybeSingle();

  if (error || !player) {
    return jsonResponse({ error: "Player not found" }, 404);
  }

  const lastCheckIn = player.last_check_in as string | null;

  // IDEMPOTENCY: Already claimed today
  if (lastCheckIn === today) {
    return jsonResponse({ error: "Already claimed today", code: "ALREADY_CLAIMED" }, 409);
  }

  // Calculate new streak
  let newStreak: number;
  if (!lastCheckIn) {
    newStreak = 1;
  } else if (lastCheckIn === yesterday) {
    newStreak = (player.current_streak as number || 0) + 1;
  } else {
    newStreak = 1; // Missed days - reset
  }

  // Get reward for day in cycle
  const dayInCycle = ((newStreak - 1) % 7) + 1;
  const reward = DAILY_REWARDS[dayInCycle - 1] || DAILY_REWARDS[0];

  // Calculate final rewards
  let bonusCurrency = reward.currency;
  if (dayInCycle === 7) {
    bonusCurrency += 100; // Day 7 bonus
  }

  const xpGained = reward.xp;
  const currencyGained = bonusCurrency;

  // Update player
  const { error: updateError } = await supabase
    .from("game_progress")
    .update({
      last_check_in: today,
      current_streak: newStreak,
      currency: (player.currency as number || 0) + currencyGained,
      total_currency_earned: (player.total_currency_earned as number || 0) + currencyGained,
      xp: (player.xp as number || 0) + xpGained,
      total_xp: (player.total_xp as number || 0) + xpGained,
    })
    .eq("telegram_id", telegramId);

  if (updateError) {
    console.error("Failed to update daily reward:", updateError);
    return jsonResponse({ error: "Failed to claim reward" }, 500);
  }

  return jsonResponse({
    ok: true,
    claimed: true,
    newStreak,
    reward: {
      currency: currencyGained,
      xp: xpGained,
      day: dayInCycle,
      isBonusDay: dayInCycle === 7,
    },
  });
}
