# 🚀 Ukraine Tap - Production Launch Checklist

## Pre-Launch Verification

### ✅ Code Status
- [x] TypeScript: PASS (0 errors)
- [x] Build: PASS
- [x] All edge functions created and verified
- [x] Migrations ready (026, 027, 028)

### 📋 Environment Variables Required

#### Supabase Edge Functions (Secrets)
| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_URL` | Supabase project URL | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for admin operations | `eyJ...` |
| `TELEGRAM_BOT_TOKEN` | Bot token from @BotFather | `123456:ABC-...` |
| `ADSGRAM_SECRET` | Secret for AdsGram callback verification | `your_secret_key` |
| `RETENTION_BOT_USERNAME` | Bot username for deep links | `YourBotName` |
| `RETENTION_DEEP_LINK` | Deep link prefix | `https://t.me/YourBotName` |

#### Client (.env)
```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_TELEGRAM_BOT_USERNAME=YourBotName
```

## Database Migrations (Run in Order)

```bash
# 1. Apply all migrations
supabase db push

# Or manually in Supabase Dashboard > SQL Editor:
```

### Migration 026: Secure RLS Policies (CRITICAL)
File: `supabase/migrations/20260620000000_026_secure_rls_policies.sql`

### Migration 027: Cleanup Verification
File: `supabase/migrations/20260620120000_027_cleanup_duplicate_policies.sql`

### Migration 028: Missing RPC Functions
File: `supabase/migrations/20260620120001_028_missing_rpc_functions.sql`

## Edge Functions Deployment

### Deploy All Functions
```bash
supabase functions deploy
```

### Individual Function URLs
| Function | URL Pattern |
|----------|-------------|
| expedition-sync | `/functions/v1/expedition-sync` |
| expedition-rewards | `/functions/v1/expedition-rewards` |
| daily-rewards | `/functions/v1/daily-rewards` |
| story-quests | `/functions/v1/story-quests` |
| perform-prestige | `/functions/v1/perform-prestige` |
| telegram-payments | `/functions/v1/telegram-payments` |
| claim-ad-reward | `/functions/v1/claim-ad-reward` |
| adsgram-reward | `/functions/v1/adsgram-reward` |
| open-chest | `/functions/v1/open-chest` |
| claim-offline-income | `/functions/v1/claim-offline-income` |
| game-action | `/functions/v1/game-action` |
| track-session | `/functions/v1/track-session` |

## Telegram Bot Setup

### 1. Configure Bot Token
1. Open @BotFather
2. Send `/mybots`
3. Select your bot
4. Copy token → Add to Supabase Secrets as `TELEGRAM_BOT_TOKEN`

### 2. Set Webhook
```bash
# Visit in browser:
https://your-supabase-url/functions/v1/telegram-payments?action=set_webhook
```

### 3. Enable Stars Payments
1. @BotFather → /mybots → Payments
2. Select provider: **Telegram Stars (XTR)**
3. No provider token needed for Stars

### 4. Configure Deep Links
1. @BotFather → /setdomain
2. Set to your Mini App domain

## AdsGram Setup

### 1. Create App
1. https://adsgram.ai/
2. Create new app for your bot

### 2. Configure Reward
1. Set callback URL: `https://your-supabase/functions/v1/adsgram-reward`
2. Set secret → Add to Supabase Secrets as `ADSGRAM_SECRET`

### 3. Integrate SDK
The SDK is already integrated in `src/services/adsgram.ts`

## Security Checklist

### RLS Policies Verified
- [x] game_progress: no_direct_insert, secure_select, secure_update
- [x] player_sessions: proper policies
- [x] expedition_state: HMAC validation
- [x] daily_rewards: server-authoritative
- [x] story_quests: server-authoritative

### Anti-Abuse Measures
- [x] HMAC validation on expedition functions
- [x] charge_id tracking for Telegram Stars
- [x] duplicate ad_id checks
- [x] server-side rarity rolls for chests
- [x] atomic currency operations
- [x] cooldown tracking for purchases

## Post-Launch Monitoring

### Key Metrics to Track
1. **Error Rate**: Supabase Dashboard → Logs
2. **Edge Function Latency**: Supabase Dashboard → Functions
3. **Active Users**: player_sessions table
4. **Revenue**: successful_payment webhooks

### Alerts to Set Up
- Edge function errors > 1%
- Response time > 3s
- RLS policy violations

## Traffic Capacity

### Current Limits (Free Tier)
- Supabase Free: 500MB database, 1GB transfer/month
- Edge Functions: 50K invocations/month

### Recommended Before Launch
- [ ] Upgrade to Pro tier if expecting >100 DAU
- [ ] Set up database connection pooling
- [ ] Enable auto-scaling for edge functions

## Launch Sequence

1. [ ] Apply all migrations to production
2. [ ] Deploy all edge functions
3. [ ] Set environment variables
4. [ ] Configure Telegram webhook
5. [ ] Test with internal users (1-2 weeks)
6. [ ] Soft launch (10% traffic)
7. [ ] Full launch

## Emergency Rollback

If issues detected:
1. Disable edge functions via Supabase CLI
2. Revert to client-side only mode
3. Database rollback via migrations folder

---

**Last Updated**: 2024-06-20
**Version**: 1.8.0
