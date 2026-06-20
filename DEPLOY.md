# 🚀 Jolt Time - Production Deployment Guide

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase CLI (`npm install -g supabase`)
- Vercel CLI (optional: `npm install -g vercel`)

---

## Environment Variables

Create `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 1. Frontend Deployment (Vercel)

### Option A: Vercel Dashboard

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel Dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy!

### Option B: Vercel CLI

```bash
# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

---

## 2. Supabase Backend

### Deploy Edge Functions

```bash
# Login to Supabase
supabase login

# Link to project
supabase link --project-ref your-project-ref

# Deploy all functions
supabase functions deploy

# Or deploy specific function
supabase functions deploy telegram-payments
supabase functions deploy adsgram-reward
supabase functions deploy validate-init-data
```

### Set Secret Environment Variables

```bash
# Telegram Bot Token
supabase secrets set TELEGRAM_BOT_TOKEN=your-bot-token

# Supabase Service Role Key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

---

## 3. Database Migrations

```bash
# Apply migrations
supabase db push

# Or reset database
supabase db reset
```

---

## 4. Telegram Bot Setup

1. Create bot via @BotFather
2. Enable Mini App in Bot Settings
3. Set Mini App URL to your Vercel deployment
4. Add bot commands:
   ```
   /start - Launch game
   /stats - View statistics
   /help - Help
   ```

---

## 5. Telegram Payment Setup

1. Open @BotFather → Bot Settings → Payments
2. Connect Telegram Stars
3. Set provider token (Stars payment provider)

---

## 6. Ads Integration

### AdsGram Setup

1. Register at adsgram.app
2. Get Block ID
3. Update `src/services/adsgram.ts`:
   ```typescript
   export const ADSGRAM_BLOCK_ID = 'your-block-id';
   ```

### Telegram Built-in Ads

- Configure in BotFather → Mini App Settings
- Set ad frequency limits

---

## 7. Verification Checklist

- [ ] Frontend builds without errors
- [ ] All Edge Functions deployed
- [ ] Environment variables set
- [ ] Telegram bot configured
- [ ] Database migrations applied
- [ ] Ads integrated
- [ ] Test in Telegram with test users

---

## 8. Monitoring

### Supabase Dashboard

- Monitor Edge Function logs
- Check database performance
- Review auth events

### Vercel Analytics

- Monitor deployment status
- Check build logs
- View performance metrics

---

## Troubleshooting

### Build Errors

```bash
# Clear cache
npm run build -- --force

# Check TypeScript
npx tsc --noEmit
```

### Edge Function Errors

```bash
# View logs
supabase functions serve --env-file .env.local

# Debug locally
supabase functions serve telegram-payments
```

### Database Connection

```bash
# Test connection
supabase db ping

# Check migrations status
supabase migration list
```

---

## Security Checklist

- [ ] `initData` validated server-side
- [ ] Rate limiting on purchases
- [ ] No sensitive data in client-side code
- [ ] Supabase RLS policies configured
- [ ] Telegram WebApp signature verification

---

## Post-Deployment

1. Test user flow:
   - User opens mini app
   - Plays game
   - Earns resources
   - Watches ads
   - Makes purchase (if applicable)

2. Monitor error rates

3. Set up alerts for:
   - Edge function errors
   - Database connection issues
   - Unusual user activity
