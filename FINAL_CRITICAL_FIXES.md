# FINAL CRITICAL FIXES

**Project:** Jolt-Time - Ukrainian Historical Tapper Game  
**Generated:** 2026-06-19  
**Priority:** P0 = MUST FIX | P1 = SHOULD FIX | P2 = POST-LAUNCH

---

## P0 — MUST FIX BEFORE ANY LAUNCH

### P0-1: RLS Bypass - Game Progress
| Property | Value |
|----------|-------|
| **File** | `supabase/migrations/20260613144854_001_game_progress.sql` |
| **Lines** | ~30-40 |
| **Severity** | CRITICAL |
| **Impact** | Anyone can modify any user's currency, XP, prestige |
| **Estimated Fix Time** | 4 hours |

**Current Problem:**
```sql
-- Anonymous policy allows anyone to insert/update/delete game_progress
CREATE POLICY "anon_insert_progress" ON game_progress FOR INSERT
  TO anon, authenticated WITH CHECK (true);
```

**Required Fix:**
```sql
-- Remove direct anon access
DROP POLICY IF EXISTS "anon_insert_progress" ON game_progress;
DROP POLICY IF EXISTS "anon_update_progress" ON game_progress;

-- Create edge function for all writes
-- Use app.telegram_id setting for authorization
```

**Files to Modify:**
- `supabase/migrations/20260613144854_001_game_progress.sql`
- Create new edge function: `game-progress-write`
- Update `src/lib/rpc.ts` to use new function

---

### P0-2: Expedition Validation Missing
| Property | Value |
|----------|-------|
| **File** | `src/expedition/store.ts` |
| **Lines** | ~700-900 |
| **Severity** | CRITICAL |
| **Impact** | Infinite artifacts and prestige possible |
| **Estimated Fix Time** | 8 hours |

**Current Problem:**
```typescript
// No server-side validation for expedition completion
// Rewards credited client-side
completeQuest: (expeditionId) => {
  // Direct local state update - NO SERVER CHECK
  set((st) => {
    const exp = st.expeditions.find(e => e.id === expeditionId);
    // Credits rewards locally
    historicalPrestige: st.historicalPrestige + exp.reward,
  });
}
```

**Required Fix:**
```typescript
// Create edge function: validate-expedition-completion
// Server must:
// 1. Track expedition timers
// 2. Validate completion time
// 3. Prevent duplicate claims
// 4. Credit rewards server-side
```

**Files to Modify:**
- `src/expedition/store.ts`
- `src/lib/rpc.ts` (add new RPC)
- `supabase/migrations/` (add expedition_timers table)
- `supabase/functions/expedition-validation/index.ts` (NEW)

---

### P0-3: Charge ID Replay Protection
| Property | Value |
|----------|-------|
| **File** | `supabase/functions/telegram-payments/index.ts` |
| **Lines** | ~320 |
| **Severity** | HIGH |
| **Impact** | Potential refund exploitation |
| **Estimated Fix Time** | 4 hours |

**Current Problem:**
```typescript
// Idempotency check exists but:
// 1. Not enforced on webhook retry
// 2. No stored procedure validation
// 3. Refund webhook not handled
```

**Required Fix:**
```typescript
// 1. Store charge_id in separate table with UNIQUE constraint
// 2. Handle Telegram refund webhook updates
// 3. Add retry protection
```

**Files to Modify:**
- `supabase/functions/telegram-payments/index.ts`
- Add refund handling logic

---

## P1 — SHOULD FIX BEFORE PRODUCTION LAUNCH

### P1-1: Rate Limiting on RPC
| Property | Value |
|----------|-------|
| **File** | `src/lib/rpc.ts`, `supabase/` |
| **Severity** | HIGH |
| **Impact** | Spam/DoS possible |
| **Estimated Fix Time** | 2 hours |

**Required Fix:**
```typescript
// Add rate limiting middleware
const RATE_LIMITS = {
  upgrade_tap: { max: 10, window: 1000 }, // 10 per second
  buy_generator: { max: 5, window: 1000 },
};
```

---

### P1-2: Concurrent Tab Prevention
| Property | Value |
|----------|-------|
| **File** | `src/components/DuplicateTabWarning.tsx` |
| **Severity** | MEDIUM |
| **Impact** | Data loss on multiple tabs |
| **Estimated Fix Time** | 2 hours |

**Current Problem:**
```typescript
// Detects but doesn't prevent
// User can ignore warning and continue
```

**Required Fix:**
```typescript
// Either:
// 1. Block second tab completely
// 2. Implement proper state merge
// 3. Use BroadcastChannel for sync
```

---

### P1-3: Refund Webhook Handling
| Property | Value |
|----------|-------|
| **File** | `supabase/functions/telegram-payments/index.ts` |
| **Severity** | HIGH |
| **Impact** | No refund support |
| **Estimated Fix Time** | 4 hours |

**Required Fix:**
```typescript
// Handle refund updates from Telegram
if (body.refund?) {
  const chargeId = body.refund.charge_id;
  // Reverse the purchase
  // Update audit log
}
```

---

### P1-4: Offline Queue
| Property | Value |
|----------|-------|
| **File** | `src/expedition/expeditionSync.ts` |
| **Severity** | MEDIUM |
| **Impact** | Actions lost when offline |
| **Estimated Fix Time** | 8 hours |

**Required Fix:**
```typescript
// Queue offline actions
const offlineQueue = [];
// On action: offlineQueue.push(action);
// On reconnect: replay queue
```

---

## P2 — POST-LAUNCH IMPROVEMENTS

### P2-1: Bundle Size Optimization
| Property | Value |
|----------|-------|
| **Current Size** | 633 KB JS, 182 KB gzipped |
| **Target** | < 400 KB gzipped |
| **Estimated Fix Time** | 4 hours |

**Required Fix:**
```typescript
// 1. Tree-shake lucide-react
import { Star } from 'lucide-react'; // Not: import * as Lucide from 'lucide-react'

// 2. Code split screens
const Museum = lazy(() => import('./screens/Museum'));
const Academy = lazy(() => import('./screens/Academy'));

// 3. Dynamic imports for heavy components
```

---

### P2-2: App.tsx Split
| Property | Value |
|----------|-------|
| **Current Lines** | ~1800 |
| **Target** | < 500 per module |
| **Estimated Fix Time** | 8+ hours |

**Required Fix:**
```typescript
// Split into modules:
// src/features/
//   ├── tap/
//   │   ├── TapArea.tsx
//   │   ├── TapPower.tsx
//   │   └── index.ts
//   ├── generators/
//   ├── prestige/
//   ├── energy/
//   └── modals/
```

---

### P2-3: Server-Side Achievements
| Property | Value |
|----------|-------|
| **Severity** | MEDIUM |
| **Impact** | Achievement exploits |
| **Estimated Fix Time** | 6 hours |

**Required Fix:**
```typescript
// Create achievements validation edge function
// Server tracks:
// - Total taps
// - Total expeditions
// - Quest completions
// - Artifact collections
```

---

## SUMMARY TABLE

| ID | Priority | Issue | File | Impact | Fix Time |
|----|----------|-------|------|--------|----------|
| P0-1 | P0 | RLS Bypass | migrations/*.sql | CRITICAL | 4h |
| P0-2 | P0 | Expedition No Validation | store.ts | CRITICAL | 8h |
| P0-3 | P0 | Charge ID Replay | telegram-payments | HIGH | 4h |
| P1-1 | P1 | Rate Limiting | rpc.ts | HIGH | 2h |
| P1-2 | P1 | Concurrent Tabs | DuplicateTabWarning.tsx | MEDIUM | 2h |
| P1-3 | P1 | Refund Handling | telegram-payments | HIGH | 4h |
| P1-4 | P1 | Offline Queue | expeditionSync.ts | MEDIUM | 8h |
| P2-1 | P2 | Bundle Size | multiple | LOW | 4h |
| P2-2 | P2 | App.tsx Split | App.tsx | MEDIUM | 8h |
| P2-3 | P2 | Achievements | store.ts | MEDIUM | 6h |

---

## TOTAL FIX TIME

| Priority | Hours |
|----------|-------|
| P0 Total | 16 hours |
| P1 Total | 16 hours |
| P2 Total | 18 hours |
| **Grand Total** | **50 hours** |

---

## RECOMMENDED APPROACH

### Phase 1: Security Fixes (16 hours)
1. Day 1-2: Fix RLS bypass
2. Day 2-3: Add expedition validation
3. Day 3: Add charge ID protection

### Phase 2: Stability (16 hours)
4. Day 4: Rate limiting
5. Day 4-5: Concurrent tab handling
6. Day 5: Refund handling
7. Day 5-6: Offline queue

### Phase 3: Polish (18 hours)
8. Day 7: Bundle optimization
9. Day 7-8: App.tsx split
10. Day 8-9: Server achievements

---

## QUICK WINS (< 30 min each)

1. **Remove unused lucide imports** - ESLint will catch
2. **Add safe-area CSS** - One CSS file
3. **Tree-shake lucide** - Change imports
4. **Add error boundaries** - React error boundaries

---

*End of Critical Fixes List*
