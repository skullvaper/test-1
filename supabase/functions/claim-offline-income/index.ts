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
 * Claim Offline Income Edge Function
 *
 * Server-authoritative offline income calculation.
 * Uses server timestamps to prevent device clock manipulation.
 *
 * Race condition protection: Atomically swaps last_online_at to NOW
 * using an RPC call, then calculates rewards from the old value.
 * Concurrent requests will see the already-updated timestamp and get 0 rewards.
 */

interface ClaimOfflineRequest {
  telegram_id: number;
  x2_boost?: boolean;
}

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const body: ClaimOfflineRequest = await req.json();
    const { telegram_id, x2_boost = false } = body;

    if (!telegram_id || typeof telegram_id !== "number" || telegram_id <= 0) {
      return jsonResponse({ error: "Invalid telegram_id" }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const now = new Date();

    // Race condition protection: atomically swap last_online_at to NOW
    // and get the previous value. Uses PostgreSQL UPDATE ... RETURNING
    // which is atomic — only one request will get the old timestamp.
    const { data: swapData, error: swapError } = await supabase.rpc(
      "swap_last_online_at",
      { p_telegram_id: telegram_id, p_new_time: now.toISOString() }
    );

    if (swapError || !swapData) {
      // Fallback: if RPC doesn't exist yet, use regular fetch+update
      const { data: player, error: fetchError } = await supabase
        .from("game_progress")
        .select("level, xp, total_xp, currency, total_currency_earned, passive_xp_per_second, prestige_level, last_online_at, active_boosters")
        .eq("telegram_id", telegram_id)
        .maybeSingle();

      if (fetchError) {
        console.error("Error fetching player:", fetchError);
        return jsonResponse({ error: "Database error" }, 500);
      }

      if (!player) {
        return jsonResponse({ error: "Player not found" }, 404);
      }

      return await processClaim(supabase, telegram_id, player, now, x2_boost);
    }

    // Got the old last_online_at atomically — now fetch current state
    const { data: player, error: fetchError } = await supabase
      .from("game_progress")
      .select("level, xp, total_xp, currency, total_currency_earned, passive_xp_per_second, prestige_level, active_boosters")
      .eq("telegram_id", telegram_id)
      .maybeSingle();

    if (fetchError || !player) {
      return jsonResponse({ error: "Player not found" }, 404);
    }

    // Build a player-like object with the old last_online_at
    const playerWithOldTime = { ...player, last_online_at: swapData };
    return await processClaim(supabase, telegram_id, playerWithOldTime, now, x2_boost, true);
  } catch (err) {
    console.error("Claim offline error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});

async function processClaim(
  supabase: ReturnType<typeof createClient>,
  telegram_id: number,
  player: Record<string, unknown>,
  now: Date,
  x2_boost: boolean,
  lastOnlineAlreadyUpdated: boolean = false,
) {
  const lastOnlineAt = new Date(player.last_online_at as string);
  const elapsedMs = Math.max(0, now.getTime() - lastOnlineAt.getTime());

  // Skip if less than 1 minute offline
  if (elapsedMs < 60_000) {
    return jsonResponse({
      success: true,
      xp: 0,
      currency: 0,
      offline_seconds: 0,
      message: "Too short offline period",
    });
  }

  // Calculate offline cap based on prestige
  const prestigeLevel = (player.prestige_level as number) || 0;

  // Check if player has Great Patron offline cap boost
  const boosters = (player.active_boosters as Record<string, unknown>) || {};
  const offlineCapHours = boosters.offline_cap_hours
    ? (boosters.offline_cap_hours as number)
    : (prestigeLevel > 0 ? 6 : 8);

  const offlineCap = offlineCapHours * 3600;
  const offlineSec = Math.min(elapsedMs / 1000, offlineCap);

  // Calculate rewards
  const passiveXpPerSec = (player.passive_xp_per_second as number) || 0;
  const level = (player.level as number) || 1;

  let offlineXp = passiveXpPerSec * offlineSec;
  let offlineCurrency = level * 50 * (offlineSec / 60);

  // Apply x2 boost if requested and valid
  if (x2_boost) {
    const offlineBoostEnd = boosters.offline_boost_end as number | undefined;
    if (offlineBoostEnd && offlineBoostEnd > now.getTime()) {
      offlineXp *= 2;
      offlineCurrency *= 2;
    }
  }

  // Update player balance
  const currentXp = (player.xp as number) || 0;
  const currentCurrency = (player.currency as number) || 0;
  const currentTotalCurrency = (player.total_currency_earned as number) || 0;
  const currentTotalXp = (player.total_xp as number) || 0;

  const updatePayload: Record<string, unknown> = {
    xp: currentXp + offlineXp,
    total_xp: currentTotalXp + offlineXp,
    currency: currentCurrency + offlineCurrency,
    total_currency_earned: currentTotalCurrency + offlineCurrency,
  };

  // Only update last_online_at if we didn't already swap it atomically
  if (!lastOnlineAlreadyUpdated) {
    updatePayload.last_online_at = now.toISOString();
  }

  const { error: updateError } = await supabase
    .from("game_progress")
    .update(updatePayload)
    .eq("telegram_id", telegram_id);

  if (updateError) {
    console.error("Error updating offline income:", updateError);
    return jsonResponse({ error: "Failed to update balance" }, 500);
  }

  // Log the offline claim for analytics
  await supabase.from("offline_claims").insert({
    telegram_id,
    xp_granted: offlineXp,
    currency_granted: offlineCurrency,
  });

  console.log(`Offline income: user=${telegram_id}, xp=${offlineXp.toFixed(0)}, currency=${offlineCurrency.toFixed(0)}, offline_sec=${offlineSec.toFixed(0)}`);

  return jsonResponse({
    success: true,
    xp: Math.floor(offlineXp),
    currency: Math.floor(offlineCurrency),
    offline_seconds: Math.floor(offlineSec),
  });
}
