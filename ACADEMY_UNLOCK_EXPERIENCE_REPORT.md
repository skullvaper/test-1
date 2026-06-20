# ACADEMY UNLOCK EXPERIENCE REPORT

**Project:** Jolt-Time - Ukrainian Historical Tapper Game  
**Audit Date:** 2026-06-19  
**Branch:** fix/typescript-errors

---

## EXECUTIVE SUMMARY

The Academy Timeline unlock is the **primary long-term goal** for players, but currently provides **zero motivation** during the grind. This report designs a compelling unlock experience that builds anticipation and rewards players for their journey.

| Component | Current State | Target State |
|-----------|---------------|--------------|
| Progress Display | 0/5000 bar | Milestone markers + previews |
| Teaser Content | None | Locked feature cards |
| NPC Hints | Generic dialogues | Academy-focused hints |
| Story Events | Minimal | Pre-unlock narrative |
| Unlock Celebration | Nothing | Full cinematic |

---

## 1. CURRENT ACADEMY EXPERIENCE

### 1.1 Current Academy Screen

```
┌─────────────────────────────────────┐
│           АКАДЕМІЯ                  │
│  ┌─────────────────────────────┐   │
│  │ Historical Prestige: 0/5000  │   │
│  │ [░░░░░░░░░░░░░░░░░░░░░░░░] │   │
│  │         0%                  │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Expedition System]  [Buildings]   │
│  [NPCs walking]                    │
└─────────────────────────────────────┘
```

### 1.2 Problems

1. **No milestones** - Bar shows nothing until 5000
2. **No previews** - Can't see what you're working toward
3. **No hints** - NPCs don't mention Academy
4. **No story** - No narrative leading to unlock
5. **No motivation** - Pure grind with no reward preview

---

## 2. ACADEMY UNLOCK EXPERIENCE DESIGN

### 2.1 Milestone System

Add visual milestones on the prestige progress bar:

```
Prestige Progress: 0 / 3000
[◆────◆─────────────────◆───⬢]
        500     1500     3000
```

| Milestone | Prestige | Reward Preview |
|-----------|----------|---------------|
| ◆ 500 | "Відкриття" | First Building Upgrade |
| ◆ 1000 | "Розширення" | 2nd Expedition Slot |
| ◆ 1500 | "Просування" | Special Hero Skin |
| ◆ 2500 | "Майстерність" | Academy Currency |
| ◆ 3000 | "АКАДЕМІЯ!" | **UNLOCK** |

### 2.2 Teaser Cards

Add "Locked Preview" cards that show Academy features:

```
┌─────────────────────────────────────┐
│  🔒 НАУКОВИЙ ІНСТИТУТ              │
│  ┌─────────────────────────────┐   │
│  │     [Mystery Icon]         │   │
│  │                             │   │
│  │  "Відкриється при 1500      │
│  │   Престижу"                │   │
│  └─────────────────────────────┘   │
│  Progress: ████░░░░░░ 45%          │
└─────────────────────────────────────┘
```

**Locked Features Preview:**

| Feature | Unlock At | Preview Description |
|---------|-----------|-------------------|
| Expedition Speed Boost | 500 | "Герої повертаються швидше" |
| Extra Expedition Slot | 1000 | "Одночасно 3 експедиції" |
| Rare Artifact Finder | 1500 | "Шанс легендарних знахідок" |
| Museum Curator Mode | 2000 | "Керуйте виставками" |
| Academy Timeline | 3000 | "Повна академія відкрита!" |

### 2.3 NPC Academy Hints

Add Academy-focused dialogues at relationship thresholds:

**At Relationship Level 1:**
```
Оксана: "Чула легенди про Історичну Академію...
        там зберігаються найбільші скарби!"
```

**At Relationship Level 3:**
```
Професор Ковальський: "Колись я працював у Академії.
        Накопичуй Престиж — і ти там опинишся."
```

**At Relationship Level 5:**
```
Тарас: "Бачиш ту вежу на пагорбі? Це Академія!
        Щоб туди потрапити, треба стати справжнім
        істориком. Збирай Престиж!"
```

### 2.4 Story Events

Add story triggers before Academy unlock:

**Event 1: The First Discovery (500 prestige)**
```
📜 НОВА ІСТОРІЯ РОЗПОЧАТО

Оксана: "Ти знайшов щось надзвичайне!
        Таких артефактів не бачили століттями.
        
        Чують про тебе в Академії...
        Може, скоро й туди потрапиш."
```

**Event 2: Rising Fame (1500 prestige)**
```
📜 СЛАВА РОЗРОСЛАСЬ

Професор Ковальський: "Про твої знахідки говорять
        у найвищих колах. Академія стежить за тобою!
        
        Ще трохи — і вони запросять тебе самі."
```

**Event 3: The Invitation (2800 prestige)**
```
📜 ЗАПРОШЕННЯ

"УВАГА! Історична Академія надіслала листа:

    'Шановний Досліднику,
    
    Ваші досягнення не пройшли непоміченими.
    Ми раді запросити вас до лав Академії.
    
    Залишилось: 200 Престижу
    до офіційного прийняття.'
    
    — Професор Ковальський"
```

### 2.5 Countdown Progress

Add a countdown element showing what's close:

```
┌─────────────────────────────────────┐
│        🎯 ДО АКАДЕМІЇ               │
│                                     │
│   ████████████░░░░░░░░░░ 2800/3000  │
│                                     │
│   💎 Наступний етап: Майстерність   │
│   📍 Залишилось: 200 Престижу       │
│                                     │
│   🔓 ВІДКРИВАЄТЬСЯ:                 │
│   • Academy Timeline повністю       │
│   • Особливий герой                  │
│   • Рідкісні дослідження             │
└─────────────────────────────────────┘
```

---

## 3. IMPLEMENTATION SPECIFICATION

### 3.1 Component Structure

```
src/expedition/
├── components/
│   ├── AcademyProgress.tsx       # NEW: Milestone progress bar
│   ├── AcademyTeaserCard.tsx     # NEW: Locked feature preview
│   ├── AcademyCountdown.tsx       # NEW: Countdown element
│   └── AcademyUnlockCelebration.tsx  # NEW: Unlock animation
├── screens/
│   └── Academy.tsx               # MODIFY: Add teaser section
└── story/
    └── academyEvents.ts           # NEW: Pre-unlock story triggers
```

### 3.2 New Components

#### AcademyProgress.tsx
```typescript
interface Milestone {
  prestige: number;
  title: string;
  description: string;
  icon: ReactNode;
  reward?: string;
}

const MILESTONES: Milestone[] = [
  { prestige: 500, title: 'Відкриття', ... },
  { prestige: 1000, title: 'Розширення', ... },
  { prestige: 1500, title: 'Просування', ... },
  { prestige: 2500, title: 'Майстерність', ... },
  { prestige: 3000, title: 'АКАДЕМІЯ!', ... },
];
```

#### AcademyTeaserCard.tsx
```typescript
interface TeaserProps {
  title: string;
  description: string;
  unlockPrestige: number;
  currentPrestige: number;
  icon: ReactNode;
}
```

### 3.3 Store Updates

Add Academy-related state:

```typescript
interface AcademyState {
  // Progress
  hasSeenAcademyTeaser: boolean;
  lastAcademyHintNpc: string | null;
  
  // Events
  triggeredStoryEvents: string[];
  
  // Unlock
  isAcademyUnlocked: boolean;
  academyUnlockDate: number | null;
}
```

### 3.4 Translation Keys

```json
{
  "academy": {
    "progress_title": "До Академії",
    "milestone_reached": "Етап досягнуто!",
    "teaser_locked": "Відкриється при {prestige} Престижу",
    "countdown_remaining": "Залишилось: {amount} Престижу",
    "unlock_preview": "ВІДКРИВАЄТЬСЯ:",
    "invitation_title": "ЗАПРОШЕННЯ",
    "invitation_body": "Історична Академія надіслала листа..."
  },
  "story_events": {
    "academy_first_discovery": "Перше відкриття",
    "academy_rising_fame": "Слава зростає",
    "academy_invitation": "Запрошення"
  },
  "npc_hints": {
    "academy_hint_1": "Чула легенди про Історичну Академію...",
    "academy_hint_3": "Накопичуй Престиж — і ти там опинишся.",
    "academy_hint_5": "Щоб туди потрапити, треба стати справжнім істориком."
  }
}
```

---

## 4. UNLOCK CELEBRATION

### 4.1 Animation Sequence

When player reaches 3000 prestige:

```
┌─────────────────────────────────────────┐
│                                         │
│          ✨ АКАДЕМІЯ ВІДКРИТА! ✨       │
│                                         │
│     ┌─────────────────────────┐        │
│     │                         │        │
│     │    [Academy Building]   │        │
│     │       ILLUSTRATION      │        │
│     │                         │        │
│     └─────────────────────────┘        │
│                                         │
│     🎊 Вітаємо у Історичній Академії!  │
│                                         │
│     ┌─────────────────────────┐        │
│     │ • Academy Timeline      ✓ │       │
│     │ • Building Upgrades     ✓ │       │
│     │ • Special Research      ✓ │       │
│     └─────────────────────────┘        │
│                                         │
│         [ ВІДКРИТИ АКАДЕМІЮ ]          │
│                                         │
└─────────────────────────────────────────┘
```

### 4.2 Celebration Rewards

| Reward | Amount | Description |
|--------|--------|-------------|
| Academy Currency | 100 | Welcome bonus |
| XP Boost | x2, 1 hour | Double XP for heroes |
| Artifact Finder | +20%, 1 hour | Better drops |
| Title | "Академік" | Profile badge |

### 4.3 Post-Unlock Flow

1. **Celebration Modal** - Show unlock animation
2. **Welcome Tutorial** - Quick guide to Academy features
3. **First Mission** - Starter quest in Academy Timeline
4. **Feature Unlock** - Show new buildings/upgrades

---

## 5. BEFORE SECOND PRESTIGE

### 5.1 Motivation Layer

After first prestige, before second:

| Element | Purpose |
|---------|---------|
| **Teaser messages** | "Academy has new research..." |
| **Story events** | NPC hints about future content |
| **Locked previews** | Show what P2 unlocks |
| **Countdown** | Progress to next milestone |
| **NPC reactions** | Acknowledge player progress |

### 5.2 Pre-Prestige 2 Content

**Locked P2 Rewards Preview:**
```
┌─────────────────────────────────────┐
│  🔒 ДОСЯГНЕННЯ ПРЕСТИЖУ 2           │
│                                     │
│  📜 "Збирайте історії світу..."     │
│                                     │
│  🔓 ВІДКРИВАЄТЬСЯ ПРИ ПРЕСТИЖІ 2:  │
│                                     │
│  ⭐ Особлива подія                  │
│  🏆 Звання "Легенда Академії"       │
│  🎨 Унікальні скіни героїв         │
│  📚 Рідкісні дослідження            │
└─────────────────────────────────────┘
```

---

## 6. IMPLEMENTATION PRIORITY

### Phase 1: Quick (Day 1)
1. Add milestone markers to progress bar
2. Add teaser cards to Academy screen
3. Add basic NPC Academy hints

### Phase 2: Story (Day 2-3)
1. Implement story event triggers
2. Add unlock celebration modal
3. Add countdown component

### Phase 3: Polish (Day 4-5)
1. Add celebration animations
2. Add sound effects
3. Tune timing and triggers

---

## 7. METRICS

| Metric | Target | Measurement |
|--------|--------|-------------|
| Academy unlock rate | >50% | % players reaching 3000 |
| Avg time to unlock | 30-60 min | Mean prestige time |
| Pre-unlock retention | >70% | Players at 1500 who reach 3000 |
| Unlock celebration engagement | >80% | Click-through rate |

---

## 8. CONCLUSION

The Academy should feel like a **reward destination**, not a **distant wall**. By adding:

1. **Milestones** - Show progress every 500 prestige
2. **Previews** - Tease locked Academy features  
3. **Hints** - NPCs guide players toward goal
4. **Events** - Story builds anticipation
5. **Celebration** - Grand unlock experience

Players will feel **motivated** instead of **overwhelmed**.

---

*End of Academy Unlock Experience Report*
