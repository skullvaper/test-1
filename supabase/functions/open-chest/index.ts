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
 * Open Chest Edge Function
 *
 * Server-authoritative chest/skychest opening.
 * Generates artifact fragment rewards with proper rarity chances.
 *
 * Rarity chances:
 * - Common: 60%
 * - Rare: 25%
 * - Epic: 10%
 * - Legendary: 4%
 * - Secret: 1% (only if prestige_level >= requiredPrestige)
 *
 * Secret artifact chance scales with prestige research:
 * - Base: 1%
 * - +5% per "rare_artifact_chance" research level (max 10 levels = +50% = 1.5% total)
 *
 * Rewards: 1-3 artifact fragments for a random artifact from current epoch
 */

interface OpenChestRequest {
  telegram_id: number;
  epoch_id: string;
  chest_type?: "skychest" | "daily"; // skychest = premium, daily = free
  epoch_index?: number; // For cost calculation: 0-based epoch order
}

interface ArtifactDrop {
  id: string;
  epoch: string;
  rarity: string;
  parts_granted: number;
  icon: string;
  name: { ua: string; en: string };
}

interface OpenChestResponse {
  success: boolean;
  error?: string;
  rewards?: ArtifactDrop[];
  chest_type?: string;
}

// Artifact definitions (must match epochs.ts)
const ARTIFACTS: Array<{
  id: string;
  epoch: string;
  rarity: "common" | "rare" | "epic" | "legendary" | "secret";
  parts: number;
  bonus: { type: string; value: number };
  icon: string;
  name: { ua: string; en: string };
  requiredPrestige?: number;
}> = [
  // Trypillia
  { id: "trypillia_bull", epoch: "trypillia", rarity: "common", parts: 10, bonus: { type: "passive_boost", value: 1.05 }, icon: "🐂", name: { ua: "Бик-бикален", en: "Bull Idol" } },
  { id: "trypillia_pot", epoch: "trypillia", rarity: "rare", parts: 10, bonus: { type: "passive_boost", value: 1.10 }, icon: "🏺", name: { ua: "Трипільська піала", en: "Trypillian Bowl" } },
  { id: "trypillia_goddess", epoch: "trypillia", rarity: "legendary", parts: 10, bonus: { type: "passive_boost", value: 1.20 }, icon: "👸", name: { ua: "Богиня-Мати", en: "Mother Goddess" } },
  // Scythia
  { id: "scythia_arrow", epoch: "scythia", rarity: "common", parts: 10, bonus: { type: "xp_multiplier", value: 1.05 }, icon: "🏹", name: { ua: "Скіфська стріла", en: "Scythian Arrow" } },
  { id: "scythia_rhyton", epoch: "scythia", rarity: "rare", parts: 10, bonus: { type: "xp_multiplier", value: 1.10 }, icon: "🎺", name: { ua: "Золотий ритон", en: "Golden Rhyton" } },
  { id: "scythia_gold", epoch: "scythia", rarity: "legendary", parts: 10, bonus: { type: "xp_multiplier", value: 1.20 }, icon: "👑", name: { ua: "Золота пектораль", en: "Golden Pectoral" } },
  // Antiquity
  { id: "antiquity_amphora", epoch: "antiquity", rarity: "common", parts: 10, bonus: { type: "currency_multiplier", value: 1.05 }, icon: "🏺", name: { ua: "Грецька амфора", en: "Greek Amphora" } },
  { id: "antiquity_coin", epoch: "antiquity", rarity: "rare", parts: 10, bonus: { type: "currency_multiplier", value: 1.10 }, icon: "🪙", name: { ua: "Ольвійська монета", en: "Olbian Coin" } },
  { id: "antiquity_statue", epoch: "antiquity", rarity: "legendary", parts: 10, bonus: { type: "currency_multiplier", value: 1.20 }, icon: "🏛", name: { ua: "Статуя Аполлона", en: "Apollo Statue" } },
  // Kyiv Rus
  { id: "kyiv_icon", epoch: "kyiv_rus", rarity: "common", parts: 10, bonus: { type: "xp_multiplier", value: 1.06 }, icon: "🖼", name: { ua: "Ікона", en: "Icon" } },
  { id: "kyiv_reliquary", epoch: "kyiv_rus", rarity: "epic", parts: 10, bonus: { type: "passive_boost", value: 1.12 }, icon: "☦️", name: { ua: "Мощі Святих", en: "Saints Relics" } },
  { id: "kyiv_gospels", epoch: "kyiv_rus", rarity: "legendary", parts: 10, bonus: { type: "currency_multiplier", value: 1.20 }, icon: "📖", name: { ua: "Остромирове Євангеліє", en: "Ostromir Gospels" } },
  // Halych-Volhynia
  { id: "halych_seal", epoch: "halych_volhynia", rarity: "rare", parts: 10, bonus: { type: "currency_multiplier", value: 1.10 }, icon: "🔖", name: { ua: "Печать князя", en: "Prince's Seal" } },
  { id: "halych_crown", epoch: "halych_volhynia", rarity: "legendary", parts: 10, bonus: { type: "currency_multiplier", value: 1.20 }, icon: "👑", name: { ua: "Корона Данила", en: "Danylo's Crown" } },
  // Polish-Lithuanian
  { id: "polish_sword", epoch: "polish_lithuanian", rarity: "rare", parts: 10, bonus: { type: "xp_multiplier", value: 1.10 }, icon: "⚔️", name: { ua: "Рицарський меч", en: "Knight Sword" } },
  { id: "polish_crown", epoch: "polish_lithuanian", rarity: "legendary", parts: 10, bonus: { type: "passive_boost", value: 1.18 }, icon: "👑", name: { ua: "Корона короля", en: "King's Crown" } },
  // Cossack
  { id: "cossack_pistol", epoch: "cossack", rarity: "common", parts: 10, bonus: { type: "xp_multiplier", value: 1.06 }, icon: "🔫", name: { ua: "Козацький пістоль", en: "Cossack Pistol" } },
  { id: "cossack_flag", epoch: "cossack", rarity: "rare", parts: 10, bonus: { type: "xp_multiplier", value: 1.12 }, icon: "🚩", name: { ua: "Козацький прапор", en: "Cossack Banner" } },
  { id: "cossack_mace", epoch: "cossack", rarity: "legendary", parts: 10, bonus: { type: "xp_multiplier", value: 1.20 }, icon: "🏏", name: { ua: "Булава Богдана", en: "Bohdan's Mace" } },
  // Hetmanate
  { id: "hetman_seal", epoch: "hetmanate", rarity: "rare", parts: 10, bonus: { type: "currency_multiplier", value: 1.12 }, icon: "🔏", name: { ua: "Печать гетьмана", en: "Hetman's Seal" } },
  { id: "hetman_charter", epoch: "hetmanate", rarity: "legendary", parts: 10, bonus: { type: "currency_multiplier", value: 1.20 }, icon: "📜", name: { ua: "Гетьманська грамота", en: "Hetman Charter" } },
  // Empire
  { id: "empire_medal", epoch: "empire", rarity: "common", parts: 10, bonus: { type: "passive_boost", value: 1.06 }, icon: "🏅", name: { ua: "Імперська медаль", en: "Imperial Medal" } },
  { id: "empire_factory", epoch: "empire", rarity: "rare", parts: 10, bonus: { type: "passive_boost", value: 1.12 }, icon: "🏭", name: { ua: "Заводський знак", en: "Factory Badge" } },
  // Revolution
  { id: "revolution_poster", epoch: "revolution", rarity: "common", parts: 10, bonus: { type: "xp_multiplier", value: 1.08 }, icon: "📰", name: { ua: "Агітаційний плакат", en: "Propaganda Poster" } },
  { id: "revolution_flag", epoch: "revolution", rarity: "legendary", parts: 10, bonus: { type: "xp_multiplier", value: 1.20 }, icon: "🇺🇦", name: { ua: "Прапор УНР", en: "UNR Flag" } },
  // Soviet
  { id: "soviet_badge", epoch: "soviet", rarity: "common", parts: 10, bonus: { type: "passive_boost", value: 1.06 }, icon: "⭐", name: { ua: "Радянський значок", en: "Soviet Badge" } },
  { id: "soviet_anthem", epoch: "soviet", rarity: "rare", parts: 10, bonus: { type: "currency_multiplier", value: 1.10 }, icon: "🎵", name: { ua: "Ноти гімну УРСР", en: "USSR Anthem Notes" } },
  { id: "soviet_rocket", epoch: "soviet", rarity: "epic", parts: 10, bonus: { type: "passive_boost", value: 1.15 }, icon: "🚀", name: { ua: "Модель ракети", en: "Rocket Model" } },
  // Independence
  { id: "ind_flag", epoch: "independence", rarity: "common", parts: 10, bonus: { type: "xp_multiplier", value: 1.08 }, icon: "🇺🇦", name: { ua: "Національний прапор", en: "National Flag" } },
  { id: "ind_passport", epoch: "independence", rarity: "rare", parts: 10, bonus: { type: "currency_multiplier", value: 1.12 }, icon: "🎫", name: { ua: "Перший паспорт", en: "First Passport" } },
  { id: "ind_constitution", epoch: "independence", rarity: "legendary", parts: 10, bonus: { type: "passive_boost", value: 1.20 }, icon: "📜", name: { ua: "Конституція", en: "Constitution" } },
  // Secret artifacts (Prestige 1+)
  { id: "secret_trypillia_altar", epoch: "trypillia", rarity: "secret", parts: 15, bonus: { type: "passive_boost", value: 1.15 }, icon: "🔥", name: { ua: "Трипільський жертовник", en: "Trypillian Altar" }, requiredPrestige: 1 },
  { id: "secret_scythia_treasure", epoch: "scythia", rarity: "secret", parts: 15, bonus: { type: "xp_multiplier", value: 1.15 }, icon: "💎", name: { ua: "Скарб Скіфії", en: "Scythian Treasure" }, requiredPrestige: 1 },
  { id: "secret_antiquity_oracle", epoch: "antiquity", rarity: "secret", parts: 15, bonus: { type: "currency_multiplier", value: 1.15 }, icon: "🔮", name: { ua: "Оракул Аполлона", en: "Apollo Oracle" }, requiredPrestige: 1 },
  { id: "secret_kyiv_relic", epoch: "kyiv_rus", rarity: "secret", parts: 15, bonus: { type: "xp_multiplier", value: 1.16 }, icon: "✝️", name: { ua: "Мощі Володимира", en: "Vladimir Relics" }, requiredPrestige: 1 },
  { id: "secret_halych_throne", epoch: "halych_volhynia", rarity: "secret", parts: 15, bonus: { type: "currency_multiplier", value: 1.17 }, icon: "🪑", name: { ua: "Трон Данила", en: "Danylo's Throne" }, requiredPrestige: 1 },
  { id: "secret_cossack_hetman_mace", epoch: "cossack", rarity: "secret", parts: 15, bonus: { type: "xp_multiplier", value: 1.18 }, icon: "⚔️", name: { ua: "Булава Хмельницького", en: "Khmelnytsky's Mace" }, requiredPrestige: 1 },
  { id: "secret_hetman_oriflamma", epoch: "hetmanate", rarity: "secret", parts: 15, bonus: { type: "passive_boost", value: 1.17 }, icon: "🚩", name: { ua: "Оріфлама Гетьманщини", en: "Hetmanate Oriflamme" }, requiredPrestige: 1 },
  { id: "secret_empire_factory_secret", epoch: "empire", rarity: "secret", parts: 15, bonus: { type: "passive_boost", value: 1.16 }, icon: "⚙️", name: { ua: "Секрет заводу", en: "Factory Secret" }, requiredPrestige: 1 },
  { id: "secret_revolution_manifest", epoch: "revolution", rarity: "secret", parts: 15, bonus: { type: "xp_multiplier", value: 1.18 }, icon: "📜", name: { ua: "Маніфест УНР", en: "UNR Manifest" }, requiredPrestige: 1 },
  { id: "secret_soviet_space_secret", epoch: "soviet", rarity: "secret", parts: 15, bonus: { type: "passive_boost", value: 1.18 }, icon: "🌌", name: { ua: "Таємниця космосу", en: "Space Secret" }, requiredPrestige: 1 },
  { id: "secret_independence_charter", epoch: "independence", rarity: "secret", parts: 15, bonus: { type: "currency_multiplier", value: 1.20 }, icon: "🇺🇦", name: { ua: "Акт Незалежності", en: "Independence Act" }, requiredPrestige: 1 },
  // Prestige 2+ secrets
  { id: "secret_golden_fleece", epoch: "scythia", rarity: "secret", parts: 20, bonus: { type: "xp_multiplier", value: 1.19 }, icon: "🌟", name: { ua: "Золоте руно", en: "Golden Fleece" }, requiredPrestige: 2 },
  { id: "secret_kyiv_sophia_secret", epoch: "kyiv_rus", rarity: "secret", parts: 20, bonus: { type: "passive_boost", value: 1.19 }, icon: "⛪", name: { ua: "Таємниця Софії", en: "Sophia Secret" }, requiredPrestige: 2 },
  { id: "secret_cossack_constitution", epoch: "cossack", rarity: "secret", parts: 20, bonus: { type: "currency_multiplier", value: 1.19 }, icon: "📖", name: { ua: "Конституція Пилипа", en: "Pylyp's Constitution" }, requiredPrestige: 2 },
  // Prestige 3+ secrets
  { id: "secret_modern_constitution_1996", epoch: "independence", rarity: "secret", parts: 20, bonus: { type: "xp_multiplier", value: 1.20 }, icon: "⚖️", name: { ua: "Конституція 1996", en: "1996 Constitution" }, requiredPrestige: 3 },
];

function jsonResponse(data: OpenChestResponse | { error: string }, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Roll for rarity based on chances
 * Returns: common | rare | epic | legendary | secret
 */
function rollRarity(prestigeLevel: number, rareArtifactChanceBonus: number): string {
  const roll = Math.random() * 100;

  // Secret chance: base 1% + bonus from research
  const secretChance = 1 + rareArtifactChanceBonus;
  if (prestigeLevel >= 1 && roll < secretChance) {
    return "secret";
  }

  // Legendary: 4%
  if (roll < secretChance + 4) {
    return "legendary";
  }

  // Epic: 10%
  if (roll < secretChance + 4 + 10) {
    return "epic";
  }

  // Rare: 25%
  if (roll < secretChance + 4 + 10 + 25) {
    return "rare";
  }

  // Common: remaining ~60%
  return "common";
}

/**
 * Get random artifact from epoch with matching rarity
 */
function getRandomArtifact(epochId: string, rarity: string, prestigeLevel: number): typeof ARTIFACTS[0] | null {
  const eligible = ARTIFACTS.filter((a) => {
    if (a.epoch !== epochId) return false;
    if (a.rarity !== rarity) return false;
    if (a.requiredPrestige && a.requiredPrestige > prestigeLevel) return false;
    return true;
  });

  if (eligible.length === 0) {
    // Fallback to common if no artifacts found for rarity
    return getRandomArtifact(epochId, "common", prestigeLevel);
  }

  return eligible[Math.floor(Math.random() * eligible.length)];
}

/**
 * Generate rewards for chest opening
 */
function generateRewards(
  epochId: string,
  prestigeLevel: number,
  rareArtifactChanceBonus: number,
  chestType: "skychest" | "daily"
): ArtifactDrop[] {
  const rewards: ArtifactDrop[] = [];

  // Skychest: 2-3 artifacts, Daily: 1 artifact
  const numArtifacts = chestType === "skychest" ? Math.floor(Math.random() * 2) + 2 : 1;

  for (let i = 0; i < numArtifacts; i++) {
    const rarity = rollRarity(prestigeLevel, rareArtifactChanceBonus);
    const artifact = getRandomArtifact(epochId, rarity, prestigeLevel);

    if (artifact) {
      // Fragments: 1-3 for common, 1-2 for rare+, 1 for legendary/secret
      let partsGranted = 1;
      if (rarity === "common") {
        partsGranted = Math.floor(Math.random() * 3) + 1;
      } else if (rarity === "rare" || rarity === "epic") {
        partsGranted = Math.floor(Math.random() * 2) + 1;
      }

      rewards.push({
        id: artifact.id,
        epoch: artifact.epoch,
        rarity: artifact.rarity,
        parts_granted: partsGranted,
        icon: artifact.icon,
        name: artifact.name,
      });
    }
  }

  return rewards;
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
    const body: OpenChestRequest = await req.json();
    const { telegram_id, epoch_id, chest_type = "daily", epoch_index = 0 } = body;

    if (!telegram_id || typeof telegram_id !== "number" || telegram_id <= 0) {
      return jsonResponse({ error: "Invalid telegram_id" }, 400);
    }

    if (!epoch_id) {
      return jsonResponse({ error: "Missing epoch_id" }, 400);
    }

    // Calculate chest cost: 100 * (epoch_index + 1)
    const chestCost = chest_type === "skychest" ? 0 : 100 * Math.max(1, (epoch_index || 0) + 1);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Fetch player state
    const { data: player, error: fetchError } = await supabase
      .from("game_progress")
      .select("currency, prestige_level, prestige_research, artifact_parts, artifact_levels, completed_artifacts")
      .eq("telegram_id", telegram_id)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching player:", fetchError);
      return jsonResponse({ error: "Database error" }, 500);
    }

    if (!player) {
      return jsonResponse({ error: "Player not found" }, 404);
    }

    // Check and deduct currency for daily chests
    const playerCurrency = (player.currency as number) || 0;
    if (chestCost > 0 && playerCurrency < chestCost) {
      return jsonResponse({ error: "Not enough currency" }, 400);
    }

    const prestigeLevel = (player.prestige_level as number) || 0;
    const prestigeResearch = (player.prestige_research as Record<string, number>) || {};

    // Calculate rare artifact chance bonus from research
    // +5% per level (relative bonus, so 10 levels = +50% of base 1% = 1.5% total)
    const rareArtifactChanceBonus = (prestigeResearch.rare_artifact_chance || 0) * 0.05;

    // Generate rewards
    const rewards = generateRewards(epoch_id, prestigeLevel, rareArtifactChanceBonus, chest_type);

    // Update player's artifact parts
    const artifactParts = (player.artifact_parts as Record<string, number>) || {};
    const artifactLevels = (player.artifact_levels as Record<string, number>) || {};
    const completedArtifacts = (player.completed_artifacts as string[]) || [];

    for (const reward of rewards) {
      // Add parts
      artifactParts[reward.id] = (artifactParts[reward.id] || 0) + reward.parts_granted;

      // Check if artifact is completed (parts >= required)
      const artifact = ARTIFACTS.find((a) => a.id === reward.id);
      if (artifact) {
        const partsRequired = artifact.parts;
        if (artifactParts[reward.id] >= partsRequired && !completedArtifacts.includes(reward.id)) {
          // Complete the artifact — leftover parts remain for upgrades
          completedArtifacts.push(reward.id);
          artifactLevels[reward.id] = 1;
        }
      }
    }

    // Update database (deduct currency + save artifacts)
    const updateData: Record<string, unknown> = {
      artifact_parts: artifactParts,
      artifact_levels: artifactLevels,
      completed_artifacts: completedArtifacts,
    };

    if (chestCost > 0) {
      updateData.currency = playerCurrency - chestCost;
    }

    const { error: updateError } = await supabase
      .from("game_progress")
      .update(updateData)
      .eq("telegram_id", telegram_id);

    if (updateError) {
      console.error("Error updating artifacts:", updateError);
      return jsonResponse({ error: "Failed to save rewards" }, 500);
    }

    console.log(`Chest opened: user=${telegram_id}, epoch=${epoch_id}, type=${chest_type}, rewards=${rewards.length}`);

    return jsonResponse({
      success: true,
      rewards,
      chest_type: chest_type,
    });
  } catch (err) {
    console.error("Open chest error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
