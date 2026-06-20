/**
 * Expedition Rewards Edge Function
 * 
 * Server-authoritative expedition completion with SECURE reward calculation.
 * 
 * Security:
 * - HMAC-validated telegram_id
 * - Server calculates ALL rewards
 * - Client sends only IDs, never values
 * - Idempotency checks prevent replay
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

// Balance multipliers (must match client)
const EXPEDITION_REWARD_MULTIPLIER = 1.75;
const ARTIFACT_PRESTIGE_MULTIPLIER = 1.5;

// Expedition base rewards per region
const BASE_EXPEDITION_REWARDS: Record<string, { karbovanets: number; reputation: number; artifactChance: number }> = {
  trybillia: { karbovanets: 500, reputation: 50, artifactChance: 0.15 },
  scythia: { karbovanets: 700, reputation: 70, artifactChance: 0.18 },
  antiquity: { karbovanets: 900, reputation: 90, artifactChance: 0.20 },
  kyiv_rus: { karbovanets: 1100, reputation: 110, artifactChance: 0.22 },
  halych: { karbovanets: 1300, reputation: 130, artifactChance: 0.25 },
};

// Rarity definitions
const RARITY_PRESTIGE: Record<string, number> = {
  common: 15,
  rare: 35,
  epic: 75,
  legendary: 150,
};

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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json();
    const { action, init_data, data } = body as {
      action: string;
      init_data?: string;
      data?: Record<string, unknown>;
    };

    if (!init_data) return jsonResponse({ error: "Missing init_data" }, 400);
    const validation = validateInitData(init_data);
    if (!validation.valid) return jsonResponse({ error: validation.error }, 401);
    if (!validation.userId) return jsonResponse({ error: "Invalid telegram_id" }, 400);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    switch (action) {
      case "collect_expedition":
        return await collectExpedition(supabase, validation.userId, data);
      case "complete_artifact":
        return await completeArtifact(supabase, validation.userId, data);
      case "claim_prestige":
        return await claimPrestige(supabase, validation.userId, data);
      default:
        return jsonResponse({ error: "Unknown action" }, 400);
    }
  } catch (err) {
    console.error("expedition-rewards error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});

async function collectExpedition(
  supabase: ReturnType<typeof createClient>,
  telegramId: number,
  data?: Record<string, unknown>
) {
  if (!data) return jsonResponse({ error: "Missing data" }, 400);
  const { expedition_id } = data as { expedition_id?: string };
  if (!expedition_id) return jsonResponse({ error: "Missing expedition_id" }, 400);

  const { data: stateData, error: loadError } = await supabase
    .from("expedition_state")
    .select("state_data")
    .eq("telegram_id", telegramId)
    .maybeSingle();

  if (loadError) return jsonResponse({ error: "Failed to load state" }, 500);

  const state = (stateData?.state_data as Record<string, unknown>) || {};
  const expeditions = (state.expeditions as Array<Record<string, unknown>>) || [];

  const expedition = expeditions.find(e => e.id === expedition_id);
  if (!expedition) return jsonResponse({ error: "Expedition not found" }, 404);

  if (expedition.collected) return jsonResponse({ error: "Already collected", code: "ALREADY_COLLECTED" }, 409);

  const endsAt = expedition.endsAt as number;
  if (Date.now() < endsAt) return jsonResponse({ error: "Expedition not complete yet" }, 400);

  const lastAction = state.lastExpeditionCollect as { id: string; timestamp: number } | undefined;
  if (lastAction && lastAction.id === expedition_id && Date.now() - lastAction.timestamp < 60000) {
    return jsonResponse({ error: "Already claimed", code: "ALREADY_CLAIMED" }, 409);
  }

  const regionId = expedition.regionId as string;
  const successChance = expedition.successChance as number;
  const success = Math.random() * 100 <= successChance;

  const baseReward = BASE_EXPEDITION_REWARDS[regionId] || BASE_EXPEDITION_REWARDS.trybillia;
  const karbovanets = success
    ? Math.floor(baseReward.karbovanets * EXPEDITION_REWARD_MULTIPLIER)
    : Math.floor(baseReward.karbovanets * EXPEDITION_REWARD_MULTIPLIER * 0.2);
  const reputation = success ? Math.floor(baseReward.reputation * EXPEDITION_REWARD_MULTIPLIER) : 0;

  let artifactId: string | null = null;
  let artifactRarity: string | null = null;
  let prestigeGain = 0;

  if (success) {
    const roll = Math.random();
    if (roll < baseReward.artifactChance) {
      const rarityRoll = Math.random();
      if (rarityRoll < 0.6) artifactRarity = "common";
      else if (rarityRoll < 0.85) artifactRarity = "rare";
      else if (rarityRoll < 0.97) artifactRarity = "epic";
      else artifactRarity = "legendary";

      artifactId = `artifact_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      prestigeGain = Math.floor(RARITY_PRESTIGE[artifactRarity] * ARTIFACT_PRESTIGE_MULTIPLIER);
    }
  }

  const currentKarbovanets = (state.karbovanets as number) || 0;
  const currentReputation = (state.reputation as number) || 0;
  const currentPrestige = (state.historicalPrestige as number) || 0;
  const currentArtifacts = (state.artifacts as Array<Record<string, unknown>>) || [];

  const updatedExpeditions = expeditions.map(e =>
    e.id === expedition_id ? { ...e, collected: true, status: "available" } : e
  );

  const newArtifacts = artifactId
    ? [...currentArtifacts, {
        id: artifactId,
        name: expedition.artifactName,
        era: regionId,
        rarity: artifactRarity,
        status: "damaged",
        prestigeBonus: RARITY_PRESTIGE[artifactRarity],
      }]
    : currentArtifacts;

  const { error: saveError } = await supabase
    .from("expedition_state")
    .update({
      state_data: {
        ...state,
        expeditions: updatedExpeditions,
        karbovanets: currentKarbovanets + karbovanets,
        reputation: currentReputation + reputation,
        historicalPrestige: currentPrestige + prestigeGain,
        artifacts: newArtifacts,
        lastExpeditionCollect: { id: expedition_id, timestamp: Date.now() },
      },
      updated_at: new Date().toISOString(),
    })
    .eq("telegram_id", telegramId);

  if (saveError) return jsonResponse({ error: "Failed to save" }, 500);

  return jsonResponse({
    ok: true,
    success,
    rewards: { karbovanets, reputation, prestigeGain, artifactId, artifactRarity },
  });
}

async function completeArtifact(
  supabase: ReturnType<typeof createClient>,
  telegramId: number,
  data?: Record<string, unknown>
) {
  if (!data) return jsonResponse({ error: "Missing data" }, 400);
  const { artifact_id } = data as { artifact_id?: string };
  if (!artifact_id) return jsonResponse({ error: "Missing artifact_id" }, 400);

  const { data: stateData, error: loadError } = await supabase
    .from("expedition_state")
    .select("state_data")
    .eq("telegram_id", telegramId)
    .maybeSingle();

  if (loadError) return jsonResponse({ error: "Failed to load state" }, 500);

  const state = (stateData?.state_data as Record<string, unknown>) || {};
  const artifacts = (state.artifacts as Array<Record<string, unknown>>) || [];

  const artifact = artifacts.find(a => a.id === artifact_id);
  if (!artifact) return jsonResponse({ error: "Artifact not found" }, 404);
  if (artifact.status !== "damaged") return jsonResponse({ error: "Artifact not in correct state" }, 400);

  const prestigeBonus = artifact.prestigeBonus as number || 15;
  const prestigeGain = Math.floor(prestigeBonus * ARTIFACT_PRESTIGE_MULTIPLIER);
  const reputationGain = Math.round(prestigeGain / 2);

  const currentPrestige = (state.historicalPrestige as number) || 0;
  const currentReputation = (state.reputation as number) || 0;

  const updatedArtifacts = artifacts.map(a =>
    a.id === artifact_id ? { ...a, status: "completed" } : a
  );

  const { error: saveError } = await supabase
    .from("expedition_state")
    .update({
      state_data: {
        ...state,
        artifacts: updatedArtifacts,
        historicalPrestige: currentPrestige + prestigeGain,
        reputation: currentReputation + reputationGain,
        lastArtifactComplete: { id: artifact_id, timestamp: Date.now() },
      },
      updated_at: new Date().toISOString(),
    })
    .eq("telegram_id", telegramId);

  if (saveError) return jsonResponse({ error: "Failed to save" }, 500);

  return jsonResponse({
    ok: true,
    prestigeGain,
    reputationGain,
    newTotalPrestige: currentPrestige + prestigeGain,
  });
}

async function claimPrestige(
  supabase: ReturnType<typeof createClient>,
  telegramId: number,
  _data?: Record<string, unknown>
) {
  const { data: stateData, error: loadError } = await supabase
    .from("expedition_state")
    .select("state_data")
    .eq("telegram_id", telegramId)
    .maybeSingle();

  if (loadError) return jsonResponse({ error: "Failed to load state" }, 500);

  const state = (stateData?.state_data as Record<string, unknown>) || {};
  const historicalPrestige = (state.historicalPrestige as number) || 0;

  if (historicalPrestige < 3000) {
    return jsonResponse({ error: "Not enough prestige", current: historicalPrestige, required: 3000 }, 400);
  }

  const prestigeLevel = (state.prestigeLevel as number) || 0;
  const newPrestigeLevel = prestigeLevel + 1;

  const bonuses = {
    passiveXPMultiplier: 1 + (newPrestigeLevel * 0.1),
    startingCurrency: 100 + (newPrestigeLevel * 50),
    expeditionSpeedBonus: 1 + (newPrestigeLevel * 0.05),
  };

  const { error: saveError } = await supabase
    .from("expedition_state")
    .update({
      state_data: {
        ...state,
        expeditionLevel: 1,
        currentPrestige: 0,
        historicalPrestige: 0,
        prestigeLevel: newPrestigeLevel,
        prestigeBonuses: bonuses,
        lastPrestige: { timestamp: Date.now(), level: newPrestigeLevel },
      },
      updated_at: new Date().toISOString(),
    })
    .eq("telegram_id", telegramId);

  if (saveError) return jsonResponse({ error: "Failed to save prestige" }, 500);

  return jsonResponse({
    ok: true,
    newPrestigeLevel,
    bonuses,
  });
}
