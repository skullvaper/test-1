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
 * Track Session Edge Function
 *
 * Records player sessions: start, activity pings, and end events.
 * Calculates total session duration and updates last_activity_at.
 *
 * Events:
 * - start: Creates a new session row
 * - activity: Updates last_activity_at and increments total_session_seconds
 * - end: Closes session, calculates final duration
 */

interface TrackSessionRequest {
  telegram_id: number;
  event: "start" | "activity" | "end";
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
    const body: TrackSessionRequest = await req.json();
    const { telegram_id, event } = body;

    if (!telegram_id || typeof telegram_id !== "number" || telegram_id <= 0) {
      return jsonResponse({ error: "Invalid telegram_id" }, 400);
    }

    if (!event || !["start", "activity", "end"].includes(event)) {
      return jsonResponse({ error: "Invalid event type" }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const now = new Date();

    switch (event) {
      case "start": {
        // Close any existing open sessions for this user
        const { data: openSessions } = await supabase
          .from("player_sessions")
          .select("id, session_started_at, last_activity_at, total_session_seconds")
          .eq("telegram_id", telegram_id)
          .order("last_activity_at", { ascending: false })
          .limit(1);

        if (openSessions && openSessions.length > 0) {
          const session = openSessions[0];
          const elapsedSec = Math.floor(
            (now.getTime() - new Date(session.session_started_at as string).getTime()) / 1000
          );
          // Close the old session with final duration
          await supabase
            .from("player_sessions")
            .update({
              total_session_seconds: elapsedSec,
              last_activity_at: now.toISOString(),
            })
            .eq("id", session.id);
        }

        // Create new session
        const { error: insertError } = await supabase
          .from("player_sessions")
          .insert({
            telegram_id,
            session_started_at: now.toISOString(),
            last_activity_at: now.toISOString(),
            total_session_seconds: 0,
          });

        if (insertError) {
          console.error("Error creating session:", insertError);
          return jsonResponse({ error: "Failed to create session" }, 500);
        }

        // Also update player's last_online_at
        await supabase
          .from("game_progress")
          .update({ last_online_at: now.toISOString() })
          .eq("telegram_id", telegram_id);

        console.log(`Session started: user=${telegram_id}`);
        return jsonResponse({ success: true, event: "start" });
      }

      case "activity": {
        // Find the latest open session
        const { data: sessions } = await supabase
          .from("player_sessions")
          .select("id, session_started_at, last_activity_at")
          .eq("telegram_id", telegram_id)
          .order("session_started_at", { ascending: false })
          .limit(1);

        if (!sessions || sessions.length === 0) {
          // No session exists, create one
          await supabase.from("player_sessions").insert({
            telegram_id,
            session_started_at: now.toISOString(),
            last_activity_at: now.toISOString(),
            total_session_seconds: 0,
          });
        } else {
          const session = sessions[0];
          const totalSec = Math.floor(
            (now.getTime() - new Date(session.session_started_at as string).getTime()) / 1000
          );
          await supabase
            .from("player_sessions")
            .update({
              last_activity_at: now.toISOString(),
              total_session_seconds: totalSec,
            })
            .eq("id", session.id);
        }

        // Update player's last_online_at
        await supabase
          .from("game_progress")
          .update({ last_online_at: now.toISOString() })
          .eq("telegram_id", telegram_id);

        return jsonResponse({ success: true, event: "activity" });
      }

      case "end": {
        // Close the latest session
        const { data: sessions } = await supabase
          .from("player_sessions")
          .select("id, session_started_at, last_activity_at")
          .eq("telegram_id", telegram_id)
          .order("session_started_at", { ascending: false })
          .limit(1);

        if (sessions && sessions.length > 0) {
          const session = sessions[0];
          const totalSec = Math.floor(
            (now.getTime() - new Date(session.session_started_at as string).getTime()) / 1000
          );
          await supabase
            .from("player_sessions")
            .update({
              last_activity_at: now.toISOString(),
              total_session_seconds: totalSec,
            })
            .eq("id", session.id);
        }

        // Update player's last_online_at
        await supabase
          .from("game_progress")
          .update({ last_online_at: now.toISOString() })
          .eq("telegram_id", telegram_id);

        console.log(`Session ended: user=${telegram_id}`);
        return jsonResponse({ success: true, event: "end" });
      }
    }

    return jsonResponse({ error: "Unknown event" }, 400);
  } catch (err) {
    console.error("Track session error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
