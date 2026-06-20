# DATABASE AUDIT

**Project:** Jolt-Time - Ukrainian Historical Tapper Game  
**Audit Date:** 2026-06-19

---

## 1. TABLES OVERVIEW

### 1.1 Core Tables
| Table | Rows | Purpose | Status |
|-------|------|---------|--------|
| game_progress | User data | Main game state | ✅ OK |
| player_sessions | Session tracking | Analytics | ✅ OK |
| ads_rewards_log | Ad rewards | Anti-abuse | ✅ OK |
| ad_views | Ad tracking | Analytics | ✅ OK |
| daily_check_ins | Daily rewards | Retention | ✅ OK |
| expedition_state | Expeditions | Academy Timeline | ✅ OK |
| story_progress | Story/NPC | Progression | ✅ OK |
| purchase_audit_log | Purchases | Anti-abuse | ✅ OK |

### 1.2 Retention Tables (pg_cron)
| Table | Purpose | Status |
|-------|---------|--------|
| retention_notifications | Push notifications | ✅ OK |
| retention_vault | Offline rewards | ✅ OK |

---

## 2. MIGRATION ANALYSIS

### 2.1 Migration Chain
```
001: game_progress (CORE)
002: add_referrals
003: add_device_id
005: add_boosters
006: add_epoch_id
007: fix_rls_and_level_cap
008: daily_check_in
009: artifact_dupes
010: ads_rewards_log
011: ad_views
012: phase2_prestige_energy
013: fix_energy_system
014: session_tracking_rls_fix
016: player_sessions_select
017-018: swap_last_online_at
019-022: retention_system
023: expedition_state
024: anti_abuse_purchase_limits
025: museum_system
```

### 2.2 Orphaned Migrations
**NONE** - All migrations properly applied

### 2.3 Migration Issues
| Migration | Issue | Severity |
|-----------|-------|----------|
| 010 | `ads_rewards_log` double .sql extension | LOW |
| 011 | `ad_views` double .sql extension | LOW |
| 012 | `phase2_prestige_energy` double .sql extension | LOW |
| 013 | `fix_energy_system` double .sql extension | LOW |
| 019-022 | `retention_*` double .sql extension | LOW |

---

## 3. RLS POLICIES

### 3.1 Game Progress
```sql
-- ANON can read/write (Telegram Mini App)
CREATE POLICY "anon_read_progress" ON game_progress FOR SELECT TO anon;
CREATE POLICY "anon_insert_progress" ON game_progress FOR INSERT TO anon;
CREATE POLICY "anon_update_progress" ON game_progress FOR UPDATE TO anon;
```

**ISSUE:** ⚠️ SECURITY RISK - Anonymous access allows any client to modify any user's game progress with just telegram_id

### 3.2 Expedition State
```sql
-- Uses app.telegram_id setting
USING (telegram_id = (current_setting('app.telegram_id', true)::BIGINT))
```

**Status:** ✅ SECURE - Server sets telegram_id

### 3.3 Story Progress
```sql
-- Uses app.telegram_id setting
USING (telegram_id = (current_setting('app.telegram_id', true)::BIGINT))
```

**Status:** ✅ SECURE - Server sets telegram_id

### 3.4 Purchase Audit Log
```sql
-- SERVICE ROLE ONLY
USING (auth.role() = 'service_role');
```

**Status:** ✅ SECURE - No direct user access

---

## 4. DATA STORAGE ISSUES

### 4.1 Duplicated Storage
| Data | Stored In | Risk |
|------|----------|------|
| expedition_state | Supabase + localStorage | Sync issues |
| story_progress | Supabase | ✅ OK |

### 4.2 Synchronization
```typescript
// expeditionSync.ts - syncWithServer function
// Issue: Not called on every state change
// Risk: LOCAL_STORAGE wins over server on conflict
```

**Status:** ⚠️ MEDIUM RISK - Need server reconciliation

---

## 5. UNUSED COLUMNS

### 5.1 game_progress Unused Columns
| Column | Status | Notes |
|--------|--------|-------|
| unlocked_epochs | ⚠️ PARTIAL | Epoch system incomplete |
| artifact_parts | ✅ OK | Used in gacha |
| completed_artifacts | ✅ OK | Used in museum |

### 5.2 Missing Columns
**NONE** - All columns actively used

---

## 6. MISSING INDEXES

### 6.1 Performance Concerns
| Table | Query | Missing Index |
|-------|-------|---------------|
| player_sessions | telegram_id lookup | ✅ EXISTS |
| ads_rewards_log | daily aggregation | ✅ EXISTS |
| expedition_state | telegram_id lookup | ✅ EXISTS |

**Status:** ✅ ALL INDEXES PRESENT

---

## 7. SECURITY RISKS

### 7.1 CRITICAL: RLS Bypass
**File:** `supabase/migrations/20260613144854_001_game_progress.sql`

```sql
CREATE POLICY "anon_insert_progress" ON game_progress FOR INSERT
  TO anon, authenticated WITH CHECK (true);
```

**Risk:** Anyone can insert/update any user's game_progress using just telegram_id

**Impact:** 
- Currency exploit
- XP exploit  
- Level exploit
- Artifact exploit

**Fix Required:** Move to server-side validation via edge functions

### 7.2 MEDIUM: No Charge ID Validation
**File:** `supabase/functions/telegram-payments/index.ts`

- Charge IDs validated client-side
- Server only checks amount
- Could replay old charge_ids

**Fix:** Store charge_ids in DB, reject duplicates

### 7.3 LOW: No Rate Limiting
- No DB-level rate limiting
- Could spam inserts
- Could flood ads_rewards_log

---

## 8. DATA CORRUPTION RISKS

### 8.1 Race Conditions
| Location | Risk | Status |
|----------|------|--------|
| Game progress update | Concurrent writes | ⚠️ MEDIUM |
| Ad rewards claim | Double claim | ✅ Fixed via server |
| Purchase validation | Double spend | ⚠️ MEDIUM |

### 8.2 Offline Recovery
**File:** `supabase/functions/claim-offline-income/index.ts`

- Calculates offline earnings from `last_online_at`
- No corruption if time sync broken
- **Status:** ✅ OK

---

## 9. EDGE FUNCTION SECURITY

### 9.1 validate-init-data
```typescript
// Verifies Telegram init data signature
// Protects against spoofed telegram IDs
```
**Status:** ✅ SECURE

### 9.2 telegram-payments
```typescript
// Validates purchase with Telegram API
// BUT: Doesn't store charge_ids for replay protection
```
**Status:** ⚠️ MEDIUM RISK

### 9.3 adsgram-reward
```typescript
// Server-side boost validation
// Prevents client-side boost forgery
```
**Status:** ✅ SECURE

---

## 10. FINDINGS SUMMARY

| Category | Issues | Severity |
|----------|--------|----------|
| RLS Policies | 1 CRITICAL | HIGH |
| Data Sync | 1 MEDIUM | MEDIUM |
| Race Conditions | 2 MEDIUM | MEDIUM |
| Missing Indexes | 0 | - |
| Unused Columns | 1 PARTIAL | LOW |
| Migration Issues | 5 naming | LOW |

---

## 11. CONCLUSIONS

### 11.1 CRITICAL Issues
1. **game_progress RLS bypass** - Anonymous can write any user's data
2. **No charge_id replay protection** - Telegram payments vulnerable

### 11.2 Recommendations

#### P0 (MUST FIX)
1. Move ALL game_progress writes to edge functions
2. Add charge_id uniqueness check in purchases
3. Add server-side validation for all state changes

#### P1 (SHOULD FIX)
1. Add rate limiting at DB level
2. Add last_updated_at check for conflict resolution
3. Implement proper sync reconciliation

#### P2 (NICE TO HAVE)
1. Add DB-level audit logging
2. Add transactional writes
3. Add data validation constraints

---

## 12. DATABASE SCORE: **60/100**

**Reason:** Critical RLS bypass issue, no charge replay protection

---

*End of Database Audit*
