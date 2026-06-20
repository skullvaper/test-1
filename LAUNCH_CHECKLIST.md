# 🚀 UKRAINE TAP - PRODUCTION LAUNCH CHECKLIST

## ⚠️ BEFORE LAUNCH - MUST COMPLETE

### 1. Supabase Database Setup

```sql
-- Run in Supabase Dashboard > SQL Editor (in order)
-- 1. Apply 001_game_progress_full.sql (creates tables)
-- 2. Apply all numbered migrations in order
-- 3. Apply 026_secure_rls_policies.sql (CRITICAL SECURITY FIX)
-- 4. Apply 027_cleanup_duplicate_policies.sql
-- 5. Apply 028_missing_rpc_functions.sql
```

### 2. Environment Variables (Supabase Secrets)

| Secret Name | Where to Get | Example |
|-------------|--------------|---------|
| `SUPABASE_URL` | Project Settings | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Project API Settings | `eyJhbGc...` |
| `TELEGRAM_BOT_TOKEN` | @BotFather | `123456:ABC-xxx` |
| `ADSGRAM_SECRET` | adsgram.ai dashboard | `your_secret` |
| `RETENTION_BOT_USERNAME` | Your bot username | `YourBotName` |

### 3. Edge Functions Deployment

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref <your-project-ref>

# Deploy all functions
supabase functions deploy

# Or deploy individually:
supabase functions deploy expedition-sync
supabase functions deploy expedition-rewards
supabase functions deploy daily-rewards
supabase functions deploy story-quests
supabase functions deploy perform-prestige
supabase functions deploy telegram-payments
supabase functions deploy claim-ad-reward
supabase functions deploy adsgram-reward
supabase functions deploy open-chest
supabase functions deploy claim-offline-income
supabase functions deploy game-action
supabase functions deploy track-session
```

### 4. Telegram Bot Configuration

#### 4.1 Set Bot Token
1. Open @BotFather
2. `/mybots` → Select your bot
3. Copy the token
4. Add to Supabase: `TELEGRAM_BOT_TOKEN` secret

#### 4.2 Enable Stars Payments
1. @BotFather → Select bot → Payments
2. Choose **Telegram Stars (XTR)** - no provider token needed
3. This enables in-app purchases

#### 4.3 Set Webhook (Required for payments)
Visit in browser:
```
https://YOUR_SUPABASE/functions/v1/telegram-payments?action=set_webhook
```

Should return: ✅ Webhook встановлено!

#### 4.4 Configure Mini App
1. @BotFather → Select bot → Mini App
2. Set URL to your deployed app

### 5. AdsGram Setup

1. Create account at https://adsgram.ai/
2. Create new app for your bot
3. Configure reward callback:
   ```
   URL: https://YOUR_SUPABASE/functions/v1/adsgram-reward
   Secret: (copy to Supabase as ADSGRAM_SECRET)
   ```
4. Test with their debug panel

### 6. Client Environment (.env)

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_TELEGRAM_BOT_USERNAME=YourBotName
```

## 📊 VERIFICATION STEPS

### Database Verification
```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Expected: All tables should have rowsecurity = true

-- Check policies exist
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'game_progress';

-- Expected: secure_select, secure_update, no_direct_insert
```

### Edge Function Verification
```bash
# Test each function (replace URL with your project)
curl -X POST https://xxxx.supabase.co/functions/v1/validate-init-data \
  -H "Content-Type: application/json" \
  -d '{"init_data": "user={\"id\":123}&hash=test"}'

# Should return: {"valid": false, "error": "..."} (not 500 error)
```

### Telegram Verification
1. Open your bot in Telegram
2. Click "Start" or open Mini App
3. Verify game loads without errors
4. Check browser console for errors

## 🔒 SECURITY CHECKLIST

- [ ] RLS enabled on ALL tables
- [ ] No anon INSERT/UPDATE on game_progress (only through edge functions)
- [ ] HMAC validation in place for expedition functions
- [ ] TELEGRAM_BOT_TOKEN set in secrets
- [ ] No hardcoded secrets in code

## 📈 MONITORING SETUP

### Supabase Dashboard
1. Enable all available logs
2. Set up alerts for:
   - Error rate > 1%
   - Edge function latency > 3s
   - Database size approaching limit

### Recommended Alerts
```sql
-- Enable pg_cron for retention (in migrations)
-- Check retention_notifications table for sends
SELECT * FROM retention_notifications ORDER BY created_at DESC LIMIT 10;
```

## 🚦 TRAFFIC CAPACITY

### Free Tier Limits
- 500MB Database
- 1GB Transfer/month
- 50K Edge Function invocations/month
- 2GB Bandwidth

### Upgrade Recommended When:
- DAU > 100
- Edge function calls > 40K/month
- Database > 200MB

## 🎯 LAUNCH PHASES

### Phase 1: Internal Testing (1-2 weeks)
- [ ] Deploy to staging
- [ ] Test all user flows manually
- [ ] Fix any bugs found
- [ ] Get 5-10 internal testers

### Phase 2: Soft Launch (1 week)
- [ ] 10% of normal traffic
- [ ] Monitor errors closely
- [ ] Collect feedback
- [ ] Fix critical issues

### Phase 3: Full Launch
- [ ] Enable all traffic
- [ ] Monitor dashboards 24/7 for first week
- [ ] Have on-call ready for issues

## 🆘 EMERGENCY CONTACTS

- Supabase Support: https://supabase.com/dashboard/support
- Telegram Dev Support: @BotSupport (via @BotFather)

## 📞 COMMON ISSUES

### "Edge Function not found"
```bash
supabase functions deploy <function-name>
```

### "RLS policy denied"
Check migration 026 applied correctly:
```sql
SELECT * FROM pg_policies WHERE tablename = 'game_progress';
```

### "Telegram auth failed"
1. Verify TELEGRAM_BOT_TOKEN is correct
2. Check init_data is being sent properly
3. Verify HMAC validation in validate-init-data

### "Database connection error"
1. Check SUPABASE_URL is correct
2. Verify network connectivity
3. Check Supabase status page

---

**Last Updated**: 2024-06-20
**Version**: 1.8.0
