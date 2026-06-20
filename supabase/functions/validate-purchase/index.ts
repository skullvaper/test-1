/**
 * Purchase Validation Edge Function
 * 
 * Provides server-side validation for Telegram Stars purchases.
 * Prevents abuse through:
 * - Rate limiting
 * - Daily purchase limits
 * - Cooldown protection
 * - Duplicate purchase detection
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Anti-abuse limits per item
const PURCHASE_LIMITS = {
  // Per day limits
  daily: {
    heroes: 3,
    speedups: 10,
    slots: 2,
    vip: 1,
  },
  // Cooldown in milliseconds (minimum time between same purchases)
  cooldowns: {
    xp_boost_1h: 60 * 60 * 1000, // 1 hour
    currency_boost_1h: 60 * 60 * 1000,
    super_boost_30m: 30 * 60 * 1000,
    legendary_gacha: 5 * 60 * 1000,
    great_patron: 0, // One-time purchase
    professor: 0, // One-time purchase
    secret_expedition: 60 * 60 * 1000,
    support_dev: 0, // Donation - no limit
  },
};

interface PurchaseRecord {
  id: string;
  booster_id: string;
  timestamp: number;
}

interface AntiAbuseResult {
  allowed: boolean;
  error?: string;
  retry_after?: number;
}

async function getDailyPurchaseCount(
  supabase: ReturnType<typeof createClient>,
  telegramId: number,
): Promise<number> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const startOfDay = today.getTime();

  const { data } = await supabase
    .from("game_progress")
    .select("active_boosters")
    .eq("telegram_id", telegramId)
    .maybeSingle();

  if (!data) return 0;

  const boosters = (data.active_boosters as Record<string, unknown>) ?? {};
  const purchaseLog = (boosters.purchase_log as PurchaseRecord[]) ?? [];

  return purchaseLog.filter(p => p.timestamp >= startOfDay).length;
}

async function getLastPurchaseTime(
  supabase: ReturnType<typeof createClient>,
  telegramId: number,
  boosterId: string,
): Promise<number | null> {
  const { data } = await supabase
    .from("game_progress")
    .select("active_boosters")
    .eq("telegram_id", telegramId)
    .maybeSingle();

  if (!data) return null;

  const boosters = (data.active_boosters as Record<string, unknown>) ?? {};
  const purchaseLog = (boosters.purchase_log as PurchaseRecord[]) ?? [];
  const purchases = purchaseLog.filter(p => p.booster_id === boosterId);
  if (purchases.length === 0) return null;

  return Math.max(...purchases.map(p => p.timestamp));
}

async function getPurchaseCategory(boosterId: string): Promise<string> {
  const categoryMap: Record<string, string> = {
    xp_boost_1h: 'speedups',
    currency_boost_1h: 'speedups',
    super_boost_30m: 'speedups',
    legendary_gacha: 'heroes',
    great_patron: 'vip',
    professor: 'vip',
    secret_expedition: 'heroes',
    support_dev: 'vip',
  };
  return categoryMap[boosterId] || 'vip';
}

async function validatePurchase(
  supabase: ReturnType<typeof createClient>,
  telegramId: number,
  boosterId: string,
): Promise<AntiAbuseResult> {
  const allowedBoosters = [
    'xp_boost_1h', 'currency_boost_1h', 'super_boost_30m',
    'legendary_gacha', 'great_patron', 'professor',
    'secret_expedition', 'support_dev'
  ];
  
  if (!allowedBoosters.includes(boosterId)) {
    return { allowed: false, error: "Unknown booster" };
  }

  // Check cooldown
  const cooldown = PURCHASE_LIMITS.cooldowns[boosterId as keyof typeof PURCHASE_LIMITS.cooldowns];
  if (cooldown && cooldown > 0) {
    const lastPurchase = await getLastPurchaseTime(supabase, telegramId, boosterId);
    if (lastPurchase) {
      const elapsed = Date.now() - lastPurchase;
      if (elapsed < cooldown) {
        const retryAfter = Math.ceil((cooldown - elapsed) / 1000);
        return {
          allowed: false,
          error: "Please wait before purchasing this item again",
          retry_after: retryAfter
        };
      }
    }
  }

  // Check daily limits
  const category = await getPurchaseCategory(boosterId);
  const dailyLimit = PURCHASE_LIMITS.daily[category as keyof typeof PURCHASE_LIMITS.daily];
  
  if (dailyLimit && dailyLimit > 0) {
    const dailyCount = await getDailyPurchaseCount(supabase, telegramId);
    if (dailyCount >= dailyLimit) {
      return {
        allowed: false,
        error: `Daily limit reached. Please try again tomorrow.`
      };
    }
  }

  // One-time purchase checks
  if (boosterId === 'great_patron' || boosterId === 'professor') {
    const { data } = await supabase
      .from("game_progress")
      .select("prestige_research, active_boosters")
      .eq("telegram_id", telegramId)
      .maybeSingle();

    if (!data) {
      return { allowed: false, error: "User not found" };
    }

    const research = (data.prestige_research as Record<string, unknown>) ?? {};
    const boosters = (data.active_boosters as Record<string, unknown>) ?? {};

    if (boosterId === 'great_patron' && boosters.offline_cap_hours === 9) {
      return { allowed: false, error: "Already purchased" };
    }
    if (boosterId === 'professor' && research.stars_xp_bonus) {
      return { allowed: false, error: "Already purchased" };
    }
  }

  return { allowed: true };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return json({ error: "Server configuration error" }, 500);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const url = new URL(req.url);
    const telegramId = url.searchParams.get("telegram_id");
    const boosterId = url.searchParams.get("booster_id");

    if (!telegramId || !boosterId) {
      return json({ error: "Missing telegram_id or booster_id" }, 400);
    }

    const result = await validatePurchase(
      supabase,
      parseInt(telegramId, 10),
      boosterId
    );

    if (result.allowed) {
      return json({ allowed: true });
    } else {
      return json({
        allowed: false,
        error: result.error,
        retry_after: result.retry_after
      }, 429);
    }

  } catch (err) {
    console.error("validate-purchase error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
