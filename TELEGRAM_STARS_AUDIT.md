# TELEGRAM STARS AUDIT

**Project:** Jolt-Time - Ukrainian Historical Tapper Game  
**Audit Date:** 2026-06-19

---

## 1. PAYMENT FLOW

### 1.1 Flow Diagram
```
Client → create_invoice
  ↓
Server → Telegram API (createInvoiceLink)
  ↓
Client → Opens payment modal
  ↓
User → Pays with Stars
  ↓
Telegram → Webhook (successful_payment)
  ↓
Server → Applies booster
```

### 1.2 Booster Products
| ID | Name | Price | Effect |
|----|------|-------|--------|
| xp_boost_1h | XP Бустер x2 | 50 | 2x XP, 1 hour |
| currency_boost_1h | Валютний Бустер x2 | 50 | 2x currency, 1 hour |
| super_boost_30m | Супер Бустер x3 | 100 | 3x XP+currency, 30 min |
| legendary_gacha | Гарантований Легендарний | 200 | Next gacha is legendary |
| great_patron | Великий Меценат | 25 | Offline 6→9 hours |
| professor | Професор Археології | 39 | +30% XP forever |
| secret_expedition | Секретна Експедиція | 45 | 3 secret artifact sets |
| support_dev | Підтримка розробників | 500 | +5000 XP |

---

## 2. ANTI-ABUSE MEASURES

### 2.1 Cooldown System
```typescript
const PURCHASE_COOLDOWNS: Record<string, number> = {
  xp_boost_1h: 60 * 60 * 1000,     // 1 hour
  currency_boost_1h: 60 * 60 * 1000, // 1 hour
  super_boost_30m: 30 * 60 * 1000, // 30 min
  legendary_gacha: 5 * 60 * 1000,    // 5 min
  great_patron: 0,                   // No cooldown (one-time)
  professor: 0,                      // No cooldown (one-time)
  secret_expedition: 60 * 60 * 1000, // 1 hour
  support_dev: 0,                     // No cooldown
};
```

**Status:** ✅ IMPLEMENTED

### 2.2 One-Time Purchases
```typescript
if (boosterId === 'great_patron' || boosterId === 'professor') {
  // Check if already purchased
  if (boosterId === 'great_patron' && boosters.offline_cap_hours === 9) {
    return { allowed: false, error: "Already purchased" };
  }
  if (boosterId === 'professor' && research.stars_xp_bonus) {
    return { allowed: false, error: "Already purchased" };
  }
}
```

**Status:** ✅ IMPLEMENTED

### 2.3 Idempotency Check
```typescript
const purchaseLog = boosters.purchase_log ?? [];
if (purchaseLog.some((entry) => entry.charge_id === chargeId)) {
  console.log("Duplicate payment webhook ignored");
  return; // Already processed
}
```

**Status:** ✅ IMPLEMENTED

---

## 3. EXPLOIT RISKS

### 3.1 Duplicate Purchase
| Risk | Mitigation | Status |
|------|------------|--------|
| Replay same webhook | charge_id check | ✅ Fixed |

### 3.2 Charge ID Manipulation
| Risk | Mitigation | Status |
|------|------------|--------|
| Fake charge_id | Server-side from Telegram | ✅ OK |

### 3.3 Price Manipulation
| Risk | Mitigation | Status |
|------|------------|--------|
| Change price client-side | Server calculates price | ⚠️ PARTIAL - Price in booster map |

### 3.4 Missing Validation
| Check | Status |
|-------|--------|
| Validate telegram_id matches | ⚠️ NOT CHECKED |
| Rate limit per user | ✅ Cooldown check |
| Max daily purchases | ❌ MISSING |

---

## 4. WEBHOOK SECURITY

### 4.1 Webhook Verification
- Telegram sends webhook to configured URL
- No signature verification (Telegram secures this)
- Only accepts from Telegram servers

**Status:** ✅ SECURE (Telegram-managed)

### 4.2 Webhook URL
```
${SUPABASE_URL}/functions/v1/telegram-payments
```

**Status:** ✅ OK

---

## 5. RACE CONDITIONS

### 5.1 Concurrent Purchases
```typescript
// User clicks buy twice quickly
// Could create 2 invoices
// Telegram webhook processes both
// BUT: Idempotency check prevents double apply
```

**Status:** ⚠️ RISK MITIGATED - Duplicates ignored

### 5.2 Offline + Online
```typescript
// If webhook arrives while user offline
// Next login won't see booster immediately
// But webhook already applied to DB
```

**Status:** ✅ OK - DB is source of truth

---

## 6. REFUND HANDLING

### 6.1 Refund Flow
1. User requests refund via Telegram
2. Telegram processes refund
3. **NO REFUND WEBHOOK HANDLING**

**Status:** ⚠️ MISSING - No refund handling

---

## 7. AUDIT LOG

### 7.1 Purchase Log Entry
```typescript
boosters.purchase_log.push({
  id: boosterId,
  booster_id: boosterId,
  charge_id: chargeId,
  timestamp: Date.now(),
  purchased_at: new Date().toISOString(),
});
```

**Status:** ✅ IMPLEMENTED

### 7.2 Missing Fields
- No admin refund capability
- No manual adjustment tool
- No refund reason tracking

---

## 8. FINDINGS SUMMARY

| Category | Issues | Severity |
|----------|--------|----------|
| Cooldown System | ✅ OK | - |
| Idempotency | ✅ OK | - |
| One-Time Purchases | ✅ OK | - |
| Charge ID Security | ✅ OK | - |
| Race Conditions | ⚠️ Mitigated | LOW |
| Refund Handling | ❌ MISSING | HIGH |
| Max Daily Limit | ❌ MISSING | MEDIUM |

---

## 9. CONCLUSIONS

### 9.1 Strengths
- ✅ Charge ID duplicate prevention
- ✅ Cooldown system
- ✅ One-time purchase validation
- ✅ Audit log for purchases

### 9.2 Weaknesses
- ⚠️ No refund webhook handling
- ⚠️ No max daily purchase limit
- ⚠️ No telegram_id validation against invoice

### 9.3 Recommendations

#### P0 (MUST FIX)
1. **Handle refund webhooks** - Telegram sends refund updates
2. **Validate telegram_id** - Ensure invoice payload matches

#### P1 (SHOULD FIX)
1. **Max daily purchases** - Prevent abuse
2. **Admin refund tool** - Manual refund capability
3. **Alert on suspicious patterns** - Block repeat refunders

---

## 10. STARS SCORE: **70/100**

**Reason:** No refund handling, no max daily limit

---

*End of Telegram Stars Audit*
