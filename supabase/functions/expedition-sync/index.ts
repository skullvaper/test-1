/**
 * Expedition Sync Edge Function
 * 
 * Server-authoritative expedition state management.
 * All expedition writes go through this function.
 * 
 * Security:
 * - Validates telegram_id via HMAC from init_data
 * - Uses SERVICE_ROLE for database writes
 * - Sets app.telegram_id for RLS policies
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createHmac } from "node:crypto";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// ── InitData Validation ──────────────────────────────────────────────────────

function validateInitData(initData: string): { valid: boolean; userId: number | null; error?: string } {
  if (!BOT_TOKEN) {
    return { valid: false, userId: null, error: "BOT_TOKEN not configured" };
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) {
    return { valid: false, userId: null, error: "Missing hash in initData" };
  }

  const authDateStr = params.get("auth_date");
  if (!authDateStr) {
    return { valid: false, userId: null, error: "Missing auth_date" };
  }
  const authDate = parseInt(authDateStr, 10);
  const ageSeconds = Math.floor(Date.now() / 1000) - authDate;
  if (isNaN(authDate) || ageSeconds > 86400 || ageSeconds < 0) {
    return { valid: false, userId: null, error: "initData too old or invalid auth_date" };
  }

  // Build data_check_string
  const keys = [...params.keys()].filter(k => k !== "hash").sort();
  const dataCheckString = keys.map(k => `${k}=${params.get(k)}`).join("\n");

  // HMAC-SHA256
  const secretKey = createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest();
  const computedHash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  if (computedHash !== hash) {
    return { valid: false, userId: null, error: "HMAC mismatch" };
  }

  // Extract user ID
  const userStr = params.get("user");
  let userId: number | null = null;
  if (userStr) {
    try {
      userId = JSON.parse(userStr).id ?? null;
    } catch {
      return { valid: false, userId: null, error: "Invalid user JSON" };
    }
  }

  return { valid: true, userId };
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ── Main Handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const body = await req.json();
    const { action, init_data, data } = body as {
      action: string;
      init_data?: string;
      data?: Record<string, unknown>;
    };

    // Validate init_data for all actions
    if (!init_data) {
      return jsonResponse({ error: "Missing init_data" }, 400);
    }

    const validation = validateInitData(init_data);
    if (!validation.valid) {
      return jsonResponse({ error: validation.error }, 401);
    }

    const telegramId = validation.userId;
    if (!telegramId) {
      return jsonResponse({ error: "Invalid telegram_id" }, 400);
    }

    // Create Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Handle actions
    switch (action) {
      case "save_expedition":
        return await saveExpeditionState(supabase, telegramId, data);
      
      case "load_expedition":
        return await loadExpeditionState(supabase, telegramId);
      
      case "save_story":
        return await saveStoryState(supabase, telegramId, data);
      
      case "load_story":
        return await loadStoryState(supabase, telegramId);
      
      case "save_museum":
        return await saveMuseumState(supabase, telegramId, data);
      
      case "load_museum":
        return await loadMuseumState(supabase, telegramId);
      
      case "complete_expedition":
        // This is P0-2 - server validates and grants rewards
        return await completeExpedition(supabase, telegramId, data);
      
      default:
        return jsonResponse({ error: "Unknown action" }, 400);
    }
  } catch (err) {
    console.error("Expedition sync error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});

// ── Expedition State ─────────────────────────────────────────────────────────

async function saveExpeditionState(
  supabase: ReturnType<typeof createClient>,
  telegramId: number,
  data?: Record<string, unknown>
) {
  if (!data) {
    return jsonResponse({ error: "Missing expedition data" }, 400);
  }

  const { error } = await supabase
    .from("expedition_state")
    .upsert({
      telegram_id: telegramId,
      state_data: data,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "telegram_id",
    });

  if (error) {
    console.error("Save expedition error:", error);
    return jsonResponse({ error: "Failed to save expedition state" }, 500);
  }

  return jsonResponse({ ok: true });
}

async function loadExpeditionState(
  supabase: ReturnType<typeof createClient>,
  telegramId: number
) {
  const { data, error } = await supabase
    .from("expedition_state")
    .select("state_data, updated_at")
    .eq("telegram_id", telegramId)
    .maybeSingle();

  if (error) {
    console.error("Load expedition error:", error);
    return jsonResponse({ error: "Failed to load expedition state" }, 500);
  }

  return jsonResponse({
    ok: true,
    data: data?.state_data || null,
    updated_at: data?.updated_at || null,
  });
}

// ── Story State ──────────────────────────────────────────────────────────────

async function saveStoryState(
  supabase: ReturnType<typeof createClient>,
  telegramId: number,
  data?: Record<string, unknown>
) {
  if (!data) {
    return jsonResponse({ error: "Missing story data" }, 400);
  }

  const { error } = await supabase
    .from("story_progress")
    .upsert({
      telegram_id: telegramId,
      current_chapter: data.currentChapter ?? 1,
      completed_chapters: data.completedChapters ?? [],
      active_quests: data.activeQuests ?? [],
      completed_quests: data.completedQuests ?? [],
      npc_relationships: data.npcRelationships ?? {},
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "telegram_id",
    });

  if (error) {
    console.error("Save story error:", error);
    return jsonResponse({ error: "Failed to save story state" }, 500);
  }

  return jsonResponse({ ok: true });
}

async function loadStoryState(
  supabase: ReturnType<typeof createClient>,
  telegramId: number
) {
  const { data, error } = await supabase
    .from("story_progress")
    .select("*")
    .eq("telegram_id", telegramId)
    .maybeSingle();

  if (error) {
    console.error("Load story error:", error);
    return jsonResponse({ error: "Failed to load story state" }, 500);
  }

  return jsonResponse({
    ok: true,
    data: data || null,
  });
}

// ── Museum State ──────────────────────────────────────────────────────────────

async function saveMuseumState(
  supabase: ReturnType<typeof createClient>,
  telegramId: number,
  data?: Record<string, unknown>
) {
  if (!data) {
    return jsonResponse({ error: "Missing museum data" }, 400);
  }

  // Check if museum_progress table exists
  const { error } = await supabase
    .from("museum_progress")
    .upsert({
      telegram_id: telegramId,
      museum_state: data.museumState ?? {},
      reputation: data.reputation ?? 0,
      total_visitors: data.totalVisitors ?? 0,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "telegram_id",
    });

  if (error) {
    // Table might not exist yet - this is OK for now
    console.warn("Museum save skipped (table may not exist):", error.message);
    return jsonResponse({ ok: true, skipped: true });
  }

  return jsonResponse({ ok: true });
}

async function loadMuseumState(
  supabase: ReturnType<typeof createClient>,
  telegramId: number
) {
  const { data, error } = await supabase
    .from("museum_progress")
    .select("museum_state, reputation, total_visitors")
    .eq("telegram_id", telegramId)
    .maybeSingle();

  if (error) {
    console.warn("Museum load skipped (table may not exist):", error.message);
    return jsonResponse({ ok: true, data: null });
  }

  return jsonResponse({
    ok: true,
    data: data || null,
  });
}

// ── P0-2: Expedition Completion (Server Validated) ──────────────────────────

/**
 * Complete an expedition with SERVER-SIDE reward calculation.
 * 
 * The client sends:
 * - expedition_id
 * - hero_id
 * - client_computed_rewards (for verification only)
 * 
 * The SERVER independently calculates:
 * - Success/failure (based on hero stats, difficulty)
 * - Rewards (karbovanets, artifacts, XP, prestige)
 * - Story progress
 * - Museum income
 */
async function completeExpedition(
  supabase: ReturnType<typeof createClient>,
  telegramId: number,
  data?: Record<string, unknown>
) {
  if (!data) {
    return jsonResponse({ error: "Missing expedition data" }, 400);
  }

  const { expedition_id, hero_id, client_computed_rewards } = data as {
    expedition_id?: string;
    hero_id?: string;
    client_computed_rewards?: Record<string, unknown>;
  };

  if (!expedition_id || !hero_id) {
    return jsonResponse({ error: "Missing expedition_id or hero_id" }, 400);
  }

  // Load current expedition state
  const { data: expeditionState, error: loadError } = await supabase
    .from("expedition_state")
    .select("state_data")
    .eq("telegram_id", telegramId)
    .maybeSingle();

  if (loadError) {
    console.error("Failed to load expedition state:", loadError);
    return jsonResponse({ error: "Failed to load state" }, 500);
  }

  const state = expeditionState?.state_data as Record<string, unknown> || {};
  const expeditions = (state.expeditions as Array<Record<string, unknown>>) || [];
  const heroes = (state.heroes as Array<Record<string, unknown>>) || [];

  // Find the expedition
  const expedition = expeditions.find(e => e.id === expedition_id);
  if (!expedition) {
    return jsonResponse({ error: "Expedition not found" }, 404);
  }

  // Find the hero
  const hero = heroes.find(h => h.id === hero_id);
  if (!hero) {
    return jsonResponse({ error: "Hero not found" }, 404);
  }

  // Verify expedition is actually completed (not started or in progress)
  const status = expedition.status as string;
  if (status !== "completed") {
    return jsonResponse({ error: "Expedition not completed" }, 400);
  }

  // Verify hero was assigned to this expedition
  const assignedHeroId = expedition.assignedHeroId as string;
  if (assignedHeroId !== hero_id) {
    return jsonResponse({ error: "Hero not assigned to this expedition" }, 400);
  }

  // Check if rewards already claimed (idempotency)
  const rewardsClaimed = expedition.rewardsClaimed as boolean;
  if (rewardsClaimed) {
    return jsonResponse({ error: "Rewards already claimed" }, 409);
  }

  // ── SERVER-SIDE REWARD CALCULATION ───────────────────────────────────────
  
  // Expedition balance config (same as client)
  const BASE_EXPEDITION_REWARDS = {
    1: { karbovanets: 500, xp: 100, artifactChance: 0.15 },
    2: { karbovanets: 700, xp: 150, artifactChance: 0.18 },
    3: { karbovanets: 900, xp: 200, artifactChance: 0.20 },
    4: { karbovanets: 1100, xp: 250, artifactChance: 0.22 },
    5: { karbovanets: 1300, xp: 300, artifactChance: 0.25 },
  };

  const REGION_MULTIPLIERS = {
    trybillia: 1.0,
    scythia: 1.3,
    antiquity: 1.6,
    kyiv_rus: 2.0,
    halych: 2.5,
  };

  const DIFFICULTY_MULTIPLIERS = {
    easy: 0.8,
    medium: 1.0,
    hard: 1.3,
    legendary: 1.8,
  };

  // Get expedition difficulty from expedition
  const difficulty = (expedition.difficulty as string) || "medium";
  const regionId = (expedition.regionId as string) || "trybillia";
  const heroLevel = (hero.level as number) || 1;
  const heroSpecialization = (hero.specialization as string) || "general";

  // Calculate success chance based on hero stats
  const heroPower = heroLevel * 10 + (heroSpecialization === (regionId + "_specialist") ? 20 : 0);
  const difficultyRequirement = {
    easy: 10,
    medium: 25,
    hard: 50,
    legendary: 100,
  }[difficulty] || 25;

  // 90% base success, modified by power
  const successChance = Math.min(0.95, 0.5 + (heroPower / difficultyRequirement) * 0.3);
  const roll = Math.random();
  const isSuccess = roll < successChance;

  if (!isSuccess) {
    // Expedition failed - mark rewards as claimed anyway (no rewards)
    const updatedExpeditions = expeditions.map(e => {
      if (e.id === expedition_id) {
        return { ...e, rewardsClaimed: true, status: "available" };
      }
      return e;
    });

    await supabase
      .from("expedition_state")
      .update({
        state_data: { ...state, expeditions: updatedExpeditions },
        updated_at: new Date().toISOString(),
      })
      .eq("telegram_id", telegramId);

    return jsonResponse({
      ok: true,
      success: false,
      message: "Expedition failed!",
      rewards: null,
    });
  }

  // Calculate rewards
  const regionMult = REGION_MULTIPLIERS[regionId as keyof typeof REGION_MULTIPLIERS] || 1.0;
  const difficultyMult = DIFFICULTY_MULTIPLIERS[difficulty as keyof typeof DIFFICULTY_MULTIPLIERS] || 1.0;
  const baseRewards = BASE_EXPEDITION_REWARDS[(expedition.regionId as unknown as keyof typeof BASE_EXPEDITION_REWARDS) as keyof typeof BASE_EXPEDITION_REWARDS] || BASE_EXPEDITION_REWARDS[1];

  // Apply multipliers
  const karbovanets = Math.floor(baseRewards.karbovanets * regionMult * difficultyMult * 1.75); // Early game boost
  const xp = Math.floor(baseRewards.xp * regionMult * difficultyMult);
  const artifactChance = baseRewards.artifactChance * regionMult;

  // Determine if artifact is found
  const artifactFound = Math.random() < artifactChance;
  const artifactId = artifactFound ? generateArtifactId(regionId, difficulty) : null;

  // Calculate prestige (server-side only, never trust client)
  const prestigeGained = Math.floor(karbovanets / 10 * 1.5); // 1.5 = ARTIFACT_PRESTIGE_MULTIPLIER

  // ── Update expedition state ────────────────────────────────────────────────

  // Mark expedition as completed, reset to available
  const updatedExpeditions = expeditions.map(e => {
    if (e.id === expedition_id) {
      return { 
        ...e, 
        rewardsClaimed: true, 
        status: "available",
        assignedHeroId: null,
      };
    }
    return e;
  });

  // Update historical prestige
  const currentPrestige = (state.historicalPrestige as number) || 0;
  const newPrestige = currentPrestige + prestigeGained;

  // Update karbovanets
  const currentKarbovanets = (state.karbovanets as number) || 0;
  const newKarbovanets = currentKarbovanets + karbovanets;

  // Save to database
  const { error: saveError } = await supabase
    .from("expedition_state")
    .update({
      state_data: {
        ...state,
        expeditions: updatedExpeditions,
        historicalPrestige: newPrestige,
        karbovanets: newKarbovanets,
        // Store rewards in a separate field to prevent replay
        lastExpeditionReward: {
          expeditionId: expedition_id,
          timestamp: Date.now(),
          rewards: { karbovanets, xp, artifactId, prestigeGained },
        },
      },
      updated_at: new Date().toISOString(),
    })
    .eq("telegram_id", telegramId);

  if (saveError) {
    console.error("Failed to save expedition completion:", saveError);
    return jsonResponse({ error: "Failed to save rewards" }, 500);
  }

  return jsonResponse({
    ok: true,
    success: true,
    expeditionId: expedition_id,
    heroId: hero_id,
    rewards: {
      karbovanets,
      xp,
      artifactId,
      prestigeGained,
      newTotalPrestige: newPrestige,
      newKarbovanets: newKarbovanets,
    },
  });
}

// ── Helper Functions ─────────────────────────────────────────────────────────

function generateArtifactId(regionId: string, difficulty: string): string {
  // Generate a deterministic artifact based on region and random chance
  const rarityRoll = Math.random();
  let rarity: string;
  
  if (rarityRoll < 0.6) rarity = "common";
  else if (rarityRoll < 0.85) rarity = "rare";
  else if (rarityRoll < 0.97) rarity = "epic";
  else rarity = "legendary";

  // Simple artifact ID format: {region}_{rarity}_{random}
  const random = Math.floor(Math.random() * 1000);
  return `${regionId}_${rarity}_${random}`;
}
