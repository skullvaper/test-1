import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FragmentData {
  telegram_id: number;
  hero_id: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  amount: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { telegram_id, hero_id, rarity, amount } = await req.json()

    if (!telegram_id) {
      return new Response(
        JSON.stringify({ ok: false, error: 'telegram_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user exists
    const { data: user, error: userError } = await supabaseAdmin
      .from('game_progress')
      .select('hero_fragments, artifact_fragments')
      .eq('telegram_id', telegram_id)
      .single()

    if (userError || !user) {
      // User doesn't exist, create with fragments
      const initialHeroFragments = hero_id ? { [hero_id]: amount } : {}
      const initialArtifactFragments = { common: 0, rare: 0, epic: 0, legendary: 0 }

      await supabaseAdmin.from('game_progress').insert({
        telegram_id,
        hero_fragments: initialHeroFragments,
        artifact_fragments: initialArtifactFragments,
      })

      return new Response(
        JSON.stringify({ ok: true, message: 'User created with fragments', fragments: initialHeroFragments }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // User exists, update fragments
    let heroFragments = user.hero_fragments || {}
    let artifactFragments = user.artifact_fragments || { common: 0, rare: 0, epic: 0, legendary: 0 }

    if (hero_id && amount > 0) {
      heroFragments[hero_id] = (heroFragments[hero_id] || 0) + amount
    }

    if (rarity && amount > 0) {
      if (['common', 'rare', 'epic', 'legendary'].includes(rarity)) {
        artifactFragments[rarity] = (artifactFragments[rarity] || 0) + amount
      }
    }

    await supabaseAdmin
      .from('game_progress')
      .update({
        hero_fragments: heroFragments,
        artifact_fragments: artifactFragments,
        updated_at: new Date().toISOString(),
      })
      .eq('telegram_id', telegram_id)

    return new Response(
      JSON.stringify({
        ok: true,
        hero_fragments: heroFragments,
        artifact_fragments: artifactFragments,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ ok: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
