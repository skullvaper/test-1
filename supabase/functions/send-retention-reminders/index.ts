import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/*
 * send-retention-reminders
 * ------------------------
 * Enhanced retention push system with personalized messages based on player progress.
 *
 * Features:
 * - Different message pools for early game (prestige < 2) vs late game (prestige >= 2)
 * - Personalized messages based on player's current epoch and achievements
 * - Multiple notification types for variety
 * - Duplicate protection within notification type + 24h window
 *
 * Designed to be invoked hourly by pg_cron.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

const NOTIFICATION_TYPE = "retention";
const DUPLICATE_WINDOW_HOURS = 24;

// ============================================================
// MESSAGE POOLS BY PLAYER PROGRESSION
// ============================================================

// Early game messages (prestige < 2) - Focus on core gameplay
const EARLY_GAME_MESSAGES = [
  {
    type: "energy",
    text: `⚡ Енергія відновилась! Час продовжити розкопки!

Твоя команда археологів чекає на тебе 👷‍♂️`,
    emoji: "⛏️"
  },
  {
    type: "progress",
    text: `📈 Ти вже {level} рівня — непогано!

Уявляєш, які таємниці чекають попереду? 🔮`,
    emoji: "🎯"
  },
  {
    type: "artifact",
    text: `🏺 Знайдено артефакт з нової епохи!

Поспіши зібрати колекцію до повного набору!`,
    emoji: "💎"
  },
  {
    type: "motivation",
    text: `🚀 Князь Данило вже збирає войнів!

Повертайся до своєї фортеці — час здобувати славу!`,
    emoji: "⚔️"
  },
  {
    type: "chest",
    text: `🎁 Твоя скриня очікує!

Відкрий її зараз та отримай унікальні фрагменти!`,
    emoji: "📦"
  },
  {
    type: "epoch",
    text: `🗺️ Нові землі відкрилися!

Досліди нову епоху та відкрий історичні таємниці!`,
    emoji: "🌍"
  },
  {
    type: "friend",
    text: `👥 Твої друзі вже грають!

Перевір, хто з них найкращий археолог!`,
    emoji: "🏆"
  },
  {
    type: "collection",
    text: `🖼️ Твоя колекція артефактів зростає!

Повертайся, щоб завершити унікальний комплект!`,
    emoji: "🎨"
  },
  {
    type: "quest",
    text: `📜 Нова місія чекає!

Допоможи козакам знайти скарби Запорізької Січі!`,
    emoji: "🗡️"
  },
  {
    type: "generator",
    text: `🏭 Твоя майстерня працювала без тебе!

Збери зароблені монети та інвестуй у розвиток!`,
    emoji: "💰"
  }
];

// Late game messages (prestige >= 2) - Focus on Academy, Expeditions, Museum
const LATE_GAME_MESSAGES = [
  {
    type: "academy",
    text: `🎓 Академія чекає на тебе!

Нові дослідження доступні для вивчення — стань справжнім професором історії!`,
    emoji: "📚"
  },
  {
    type: "expedition",
    text: `🏛️ Твоя експедиція повернулась!

Перевіряй здобич та відправляй нових героїв у подорож!`,
    emoji: "⚔️"
  },
  {
    type: "museum",
    text: `🏛️ Відвідувачі музею сумують!

Поповни експозицію новими артефактами та підніми репутацію!`,
    emoji: "👑"
  },
  {
    type: "prestige",
    text: `⭐ Престиж чекає!

Ти вже близько до наступного переродження — збери достатньо монет та почни новий етап!`,
    emoji: "🌟"
  },
  {
    type: "collection",
    text: `💎 Рідкісні артефакти чекають!

Твоя колекція унікальних артефактів може бути доповнена!`,
    emoji: "🔮"
  },
  {
    type: "reputation",
    text: `📊 Репутація музею зростає!

Продовжуй розвивати експозицію — відвідувачі в захваті!`,
    emoji: "📈"
  },
  {
    type: "legendary",
    text: `🌟 Легендарний артефакт близько!

Збери останні фрагменти та отримай унікальний бонус!`,
    emoji: "⚡"
  },
  {
    type: "achievement",
    text: `🏅 Нове досягнення розблоковано!

Перевір свій прогрес та отримай заслужену нагороду!`,
    emoji: "🎖️"
  },
  {
    type: "energy",
    text: `⚡ Повна енергія відновилась!

Час для нових археологічних відкриттів!`,
    emoji: "🔋"
  },
  {
    type: "offline",
    text: `💰 Офлайн дохід накопичився!

Твій музей працював без тебе — забери прибуток!`,
    emoji: "🏦"
  },
  {
    type: "secret",
    text: `🔐 Секретний артефакт виявлено!

Тільки справжні археологи можуть його знайти!`,
    emoji: "🗝️"
  },
  {
    type: "research",
    text: `🔬 Нові дослідження в Академії!

Покращуй свої навички та ефективність!`,
    emoji: "🧪"
  }
];

// URGENT messages for players who haven't returned in 24h+
const URGENT_MESSAGES = [
  {
    type: "comeback",
    text: `😟 Ми сумуємо за тобою!

Вже 24 години ти не відвідував музей. Твоя команда чекає!`,
    emoji: "👋"
  },
  {
    type: "miss",
    text: `🎁 Ти пропустив щоденну нагороду!

Повертайся швидше, щоб не втратити прогрес!`,
    emoji: "⏰"
  },
  {
    type: "progress",
    text: `📉 Твої друзі обганяють тебе!

Перевір таблицю лідерів та поверни собі першість!`,
    emoji: "🏃"
  }
];

// LEVEL MILESTONE messages - sent when player reaches levels 5, 10, 15 etc. during offline
// These are personalized based on player's current level
const LEVEL_MILESTONE_MESSAGES = [
  {
    type: "level_5",
    text: `🎉 Ти досяг рівня {level}!

Перші кроки зроблено! Уявляєш, які таємниці чекають попереду?`,
    milestoneLevel: 5,
    emoji: "🌟"
  },
  {
    type: "level_10",
    text: `🏆 Рівень {level}!

Ти справжній археолог! Продовжуй досліджувати нові епохи!`,
    milestoneLevel: 10,
    emoji: "⚔️"
  },
  {
    type: "level_15",
    text: `📈 Ти на рівні {level}!

До Академії залишилось зовсім трохи! Збери більше артефактів!`,
    milestoneLevel: 15,
    emoji: "💎"
  },
  {
    type: "level_20",
    text: `🚀 Рівень {level}!

Ти ледь не відкрив Академію! Повертайся та продовж збирати артефакти!`,
    milestoneLevel: 20,
    emoji: "👑"
  },
  {
    type: "level_25",
    text: `⭐ Ти досяг рівня {level}!

Академія чекає на тебе! Повертайся, щоб відкрити справжню магію!`,
    milestoneLevel: 25,
    emoji: "🎓"
  },
  {
    type: "level_30",
    text: `🔥 Рівень {level}!

Ти готовий до величі! Академія відкриє тобі нові горизонти!`,
    milestoneLevel: 30,
    emoji: "🌟"
  }
];

interface CandidatePlayer {
  telegram_id: number;
  last_active_at: string | null;
  prestige_level?: number;
  level?: number;
  epoch_id?: string;
  currency?: number;
}

interface PlayerProgress {
  prestige_level: number;
  level: number;
  epoch_id: string;
  currency: number;
}

// Epoch names for personalization
const EPOCH_NAMES: Record<string, { ua: string; en: string }> = {
  trypillia: { ua: "Трипілля", en: "Trypillia" },
  scythia: { ua: "Скіфія", en: "Scythia" },
  antiquity: { ua: "Античність", en: "Antiquity" },
  kyiv_rus: { ua: "Київська Русь", en: "Kyiv Rus" },
  halych_volhynia: { ua: "Галицько-Волинське", en: "Halych-Volhynia" },
  polish_lithuanian: { ua: "Річ Посполита", en: "Polish-Lithuanian" },
  cossack: { ua: "Козаччина", en: "Cossack Era" },
  hetmanate: { ua: "Гетьманщина", en: "Hetmanate" },
  empire: { ua: "Російська Імперія", en: "Russian Empire" },
  revolution: { ua: "Революція", en: "Revolution" },
  soviet: { ua: "Радянський Союз", en: "Soviet Union" },
  independence: { ua: "Незалежність", en: "Independence" },
};

/**
 * Select appropriate message based on player's prestige level
 * Early game (prestige < 2): use early game messages
 * Late game (prestige >= 2): use late game messages
 */
function selectMessageByPrestige(prestigeLevel: number, level: number): { type: string; text: string } {
  const messages = prestigeLevel >= 2 ? LATE_GAME_MESSAGES : EARLY_GAME_MESSAGES;
  
  // Pick random message
  const selected = messages[Math.floor(Math.random() * messages.length)];
  
  // Personalize with player's level if placeholder exists
  let personalizedText = selected.text;
  if (personalizedText.includes('{level}')) {
    personalizedText = personalizedText.replace('{level}', level.toString());
  }
  
  return { type: selected.type, text: personalizedText };
}

/**
 * Select urgent message for players inactive for 24h+
 */
function selectUrgentMessage(): { type: string; text: string } {
  const selected = URGENT_MESSAGES[Math.floor(Math.random() * URGENT_MESSAGES.length)];
  return { type: selected.type, text: selected.text };
}

/**
 * Check if player just reached a milestone level (5, 10, 15, 20, 25, 30)
 * Returns the milestone message if applicable
 */
function checkLevelMilestone(level: number): { type: string; text: string } | null {
  // Check if level is a milestone (every 5 levels from 5 to 30)
  const milestoneLevels = [5, 10, 15, 20, 25, 30];
  
  // Find the closest milestone at or below the player's level
  const closestMilestone = milestoneLevels
    .filter(m => m <= level)
    .sort((a, b) => b - a)[0];
  
  if (!closestMilestone) return null;
  
  // Find the message for this milestone
  const milestoneMessage = LEVEL_MILESTONE_MESSAGES.find(
    m => m.milestoneLevel === closestMilestone
  );
  
  if (!milestoneMessage) return null;
  
  // Replace {level} placeholder with actual level
  const personalizedText = milestoneMessage.text.replace('{level}', level.toString());
  
  return { type: milestoneMessage.type, text: personalizedText };
}

interface TelegramResponse {
  ok: boolean;
  description?: string;
  error_code?: number;
}

async function tgCall(method: string, body: Record<string, unknown>): Promise<TelegramResponse> {
  const res = await fetch(`${TG_API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await res.json()) as TelegramResponse;
}

async function resolveBotUsername(): Promise<string | null> {
  const configured = Deno.env.get("RETENTION_BOT_USERNAME");
  if (configured && configured.trim().length > 0) return configured.trim();

  const info = await tgCall("getMe", {});
  if (info.ok) {
    const me = (info as unknown as { result?: { username?: string } }).result;
    return me?.username ?? null;
  }
  return null;
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

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return json({ error: "Supabase env vars not configured" }, 500);
  }
  if (!BOT_TOKEN) {
    return json({ error: "TELEGRAM_BOT_TOKEN not configured" }, 500);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const deepLinkOverride = Deno.env.get("RETENTION_DEEP_LINK");
  let inlineUrl: string;
  if (deepLinkOverride && deepLinkOverride.trim().length > 0) {
    inlineUrl = deepLinkOverride.trim();
  } else {
    const botUsername = await resolveBotUsername();
    if (!botUsername) {
      return json({ error: "Could not resolve bot username" }, 500);
    }
    inlineUrl = `https://t.me/${botUsername}?start=retention`;
  }

  const sent: number[] = [];
  const skippedDuplicate: number[] = [];
  const failed: Array<{ telegram_id: number; error: string }> = [];

  console.log(`[retention] run started at ${new Date().toISOString()}`);
  console.log(`[retention] deep_link=${inlineUrl}`);

  try {
    // 2-hour retention notification window: players inactive for 6-8 hours
    // "6 to 8 hours ago" = last_active_at <= (now - 6h) AND last_active_at > (now - 8h).
    const now = Date.now();
    const sixHoursAgoIso = new Date(now - 6 * 60 * 60 * 1000).toISOString();
    const eightHoursAgoIso = new Date(now - 8 * 60 * 60 * 1000).toISOString();

    console.log(`[retention] window: last_active_at in (${eightHoursAgoIso}, ${sixHoursAgoIso}]`);

    // Fetch player progress for personalized messages
    const { data: candidates, error } = await supabase
      .from("game_progress")
      .select("telegram_id, last_active_at, prestige_level, level, epoch_id, currency")
      .not("telegram_id", "is", null)
      .not("last_active_at", "is", null)
      .lte("last_active_at", sixHoursAgoIso)
      .gt("last_active_at", eightHoursAgoIso);

    if (error) {
      console.error("[retention] query candidates error:", error);
      return json({ error: error.message }, 500);
    }

    if (!candidates || candidates.length === 0) {
      console.log("[retention] no candidates in window, exiting");
      return json({
        ok: true,
        candidates: 0,
        sent: 0,
        skipped_duplicate: 0,
        failed: 0,
      });
    }

    console.log(`[retention] found ${candidates.length} candidate(s)`);

    for (const candidate of candidates as CandidatePlayer[]) {
      const telegramId = candidate.telegram_id;
      const lastActive = candidate.last_active_at;
      if (!telegramId || !Number.isFinite(telegramId) || telegramId <= 0) continue;

      // Get player's progress for personalized messages
      const prestigeLevel = candidate.prestige_level ?? 0;
      const playerLevel = candidate.level ?? 1;
      const epochId = candidate.epoch_id ?? "trypillia";
      const currency = candidate.currency ?? 0;

      console.log(`[retention] processing telegram_id=${telegramId} prestige=${prestigeLevel} level=${playerLevel}`);

      // Duplicate protection: check if any notification was sent in last 24h
      // Use notification_type = 'retention' for all retention messages
      const { data: existing, error: dedupErr } = await supabase
        .from("retention_notifications")
        .select("id")
        .eq("telegram_id", telegramId)
        .eq("notification_type", NOTIFICATION_TYPE)
        .gte(
          "sent_at",
          new Date(Date.now() - DUPLICATE_WINDOW_HOURS * 60 * 60 * 1000).toISOString()
        )
        .limit(1);

      if (dedupErr) {
        console.error(`[retention] dedup query error for ${telegramId}:`, dedupErr);
        failed.push({ telegram_id: telegramId, error: "dedup check failed" });
        continue;
      }

      if (existing && existing.length > 0) {
        console.log(`[retention] skipping telegram_id=${telegramId} (already sent in last 24h)`);
        skippedDuplicate.push(telegramId);
        continue;
      }

      // Select message based on prestige level AND level milestones
      // First check for level milestones (levels 5, 10, 15, 20, 25, 30)
      // These are high-priority messages for early game players
      let message;
      if (prestigeLevel < 2 && playerLevel >= 5) {
        const milestoneMessage = checkLevelMilestone(playerLevel);
        if (milestoneMessage) {
          message = milestoneMessage;
          console.log(`[retention] sending level milestone message to ${telegramId}: level=${playerLevel}`);
        } else {
          message = selectMessageByPrestige(prestigeLevel, playerLevel);
        }
      } else {
        message = selectMessageByPrestige(prestigeLevel, playerLevel);
      }

      // Build inline keyboard based on player's progress
      const inlineKeyboard: Array<Array<{ text: string; url?: string }>> = [
        [{ text: "🚀 Запустити гру", url: inlineUrl }]
      ];

      // Add channel link
      inlineKeyboard.push([{ text: "📢 Наш Telegram канал", url: "https://t.me/SITNIK_BLOG" }]);

      console.log(`[retention] sending to ${telegramId}: type=${message.type} prestige=${prestigeLevel}`);
      const tgResult = await tgCall("sendMessage", {
        chat_id: telegramId,
        text: message.text,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: inlineKeyboard,
        },
      });

      if (!tgResult.ok) {
        const errDesc = tgResult.description ?? `Telegram error ${tgResult.error_code ?? ""}`;
        console.error(`[retention] sendMessage failed for ${telegramId}: ${errDesc}`);
        failed.push({ telegram_id: telegramId, error: errDesc });
        continue;
      }

      console.log(`[retention] sendMessage ok for ${telegramId}, logging to retention_notifications`);
      const { error: insertErr } = await supabase
        .from("retention_notifications")
        .insert({
          telegram_id: telegramId,
          notification_type: NOTIFICATION_TYPE,
          payload: {
            message: message.text,
            message_type: message.type,
            url: inlineUrl,
            prestige_level: prestigeLevel,
            level: playerLevel,
            epoch_id: epochId,
          },
        });

      if (insertErr) {
        console.error(`[retention] insert notification log error for ${telegramId}:`, insertErr);
      }

      sent.push(telegramId);
    }

    console.log(`[retention] run complete: sent=${sent.length} skipped=${skippedDuplicate.length} failed=${failed.length}`);

    return json({
      ok: true,
      field_used: "last_active_at",
      window: { after: sevenHoursAgoIso, before: sixHoursAgoIso },
      candidates: candidates.length,
      sent: sent.length,
      skipped_duplicate: skippedDuplicate.length,
      failed: failed.length,
      sent_ids: sent,
      failed_details: failed,
      message_pools: {
        early_game: EARLY_GAME_MESSAGES.length,
        late_game: LATE_GAME_MESSAGES.length,
        urgent: URGENT_MESSAGES.length,
        level_milestones: LEVEL_MILESTONE_MESSAGES.length,
      },
    });
  } catch (err) {
    console.error("[retention] fatal error:", err);
    return json({ error: String(err) }, 500);
  }
});
