# SUPABASE AUDIT

**Project:** Jolt-Time - Ukrainian Historical Tapper Game  
**Audit Date:** 2026-06-19

---

## 1. QUERY ANALYSIS

### 1.1 RPC Functions Used
| Function | Purpose | Security |
|---------|---------|----------|
| `game-action` | Tap upgrades, epoch switch | ✅ HMAC validated |
| `open-chest` | Gacha rewards | ✅ Server RNG |
| `track-session` | Analytics | ✅ Simple insert |
| `validate-init-data` | Telegram validation | ✅ HMAC validated |
| `adsgram-reward` | Ad rewards | ✅ Server validated |
| `claim-offline-income` | Offline earnings | ✅ Server calculated |
| `telegram-payments` | Stars purchases | ✅ Telegram API |
| `perform-prestige` | Prestige reset | ✅ Server validated |

### 1.2 Direct Supabase Queries
```typescript
// In expeditionSync.ts
supabase.from('expedition_state').upsert(...)
supabase.from('story_progress').upsert(...)
supabase.from('game_progress').select(...)
supabase.from('player_sessions').insert(...)
```

---

## 2. HYDRATION & SYNC

### 2.1 Hydration Flow
```
App Load
  ↓
Check localStorage
  ↓
Fetch from Supabase
  ↓
Merge: localStorage + Supabase
  ↓
Use merged state
```

### 2.2 Sync Issues

#### Issue 1: Race Condition on Load
```typescript
// expeditionSync.ts
const serverState = await fetchServerState();
const localState = loadLocalState();

// Conflict: Which wins?
// Current: No deterministic winner
```

**Severity:** MEDIUM

#### Issue 2: No Offline Queue
```typescript
// Changes made offline are lost on sync
// No queue of pending changes
```

**Severity:** MEDIUM

### 2.3 Stale Cache
```typescript
// expeditionSync.ts line 45
if (!needsSync) return cached; // Uses cached state for 60 seconds
```

**Severity:** LOW

---

## 3. DATA LOSS RISKS

### 3.1 Critical Paths
| Path | Risk | Status |
|------|------|--------|
| Expedition state | localStorage + Supabase | ⚠️ 2 sources |
| Story progress | Supabase only | ✅ OK |
| Game progress | Supabase only | ✅ OK |
| Ad rewards | Supabase only | ✅ OK |

### 3.2 Data Loss Scenarios
| Scenario | Risk | Mitigation |
|----------|------|------------|
| Supabase fails | State reverts | localStorage backup |
| localStorage clears | Recent changes lost | Server is source of truth |
| Concurrent edits | Last write wins | No merge strategy |
| Offline + online | Sync conflict | No resolution |

---

## 4. SYNC FAILURES

### 4.1 Failure Modes
| Mode | Detection | Recovery |
|------|-----------|----------|
| Network timeout | ✅ 10s timeout | Retry on next load |
| Supabase error | ✅ Error logged | User notification |
| Invalid data | ✅ Schema validation | Skip invalid |
| Auth failure | ✅ Handled | Re-auth prompt |

### 4.2 Retry Logic
```typescript
// expeditionSync.ts
const maxRetries = 3;
const retryDelay = 1000;

for (let i = 0; i < maxRetries; i++) {
  try {
    await syncWithServer(state);
    break;
  } catch (e) {
    await sleep(retryDelay * Math.pow(2, i));
  }
}
```

**Status:** ✅ IMPLEMENTED

---

## 5. DUPLICATE WRITES

### 5.1 Ad Rewards
```typescript
// adsgram-reward edge function
INSERT INTO ads_rewards_log (...)
VALUES (...);

// Plus client-side tracking
```

**Status:** ⚠️ DUPLICATE TRACKING - Acceptable for analytics

### 5.2 Session Tracking
```typescript
// track-session called every 60 seconds
// Plus visibility change handlers
// Plus beforeunload
```

**Status:** ⚠️ OVER-TRACKING - Could be optimized

---

## 6. EDGE CASES

### 6.1 Concurrent Tab
```typescript
// DuplicateTabWarning.tsx
// Detects multiple tabs via BroadcastChannel
// Warns user but doesn't prevent
```

**Status:** ⚠️ DETECTED but not prevented

### 6.2 Offline Mode
```typescript
// Offline earnings calculated on re-connect
// Uses last_online_at timestamp
// Could be exploited if clock manipulated
```

**Status:** ⚠️ CLOCK DEPENDENT

### 6.3 Time Zone Changes
```typescript
// All timestamps use UTC
// Daily rewards based on UTC day
// Users in different timezones may see issues
```

**Status:** ⚠️ UX ISSUE - Daily reset at midnight UTC

---

## 7. CACHE STRATEGY

### 7.1 Current Strategy
| Data | Cache | TTL | Refresh |
|------|-------|-----|---------|
| Game progress | In-memory | 60s | On action |
| Expedition state | localStorage | None | On change |
| Story progress | localStorage | None | On change |

### 7.2 Cache Invalidation
```typescript
// On push from server
invalidateCache('expedition_state');

// On local change
await syncWithServer(state);
```

**Status:** ✅ OK

---

## 8. FINDINGS SUMMARY

| Category | Issues | Severity |
|----------|--------|----------|
| Race Conditions | 1 | MEDIUM |
| Offline Queue | 1 | MEDIUM |
| Duplicate Writes | 2 | LOW |
| Cache Strategy | OK | - |

---

## 9. CONCLUSIONS

### 9.1 Strengths
- ✅ HMAC validation for critical actions
- ✅ Server-side RNG for rewards
- ✅ Retry logic with backoff
- ✅ localStorage backup

### 9.2 Weaknesses
- ⚠️ No conflict resolution strategy
- ⚠️ No offline action queue
- ⚠️ Concurrent tab not prevented
- ⚠️ Daily reset at UTC midnight

### 9.3 Recommendations
1. Add timestamp-based merge (last write wins with warning)
2. Queue offline actions for replay
3. Block concurrent tabs or merge state
4. Consider timezone-aware daily reset

---

## 10. SUPABASE SCORE: **70/100**

**Reason:** Race conditions, no offline queue, concurrent tabs not prevented

---

*End of Supabase Audit*
