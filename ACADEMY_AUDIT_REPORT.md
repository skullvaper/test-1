# 🔍 АУДИТ АКАДЕМІЇ — ФАЗА 7

**Дата:** 2026-06-20
**Проєкт:** Jolt Time 2.0
**Статус:** Аудит завершено

---

## 📋 ЗМІСТ

1. [Працює](#працює)
2. [Частково реалізовано](#частково-реалізовано)
3. [Відсутнє](#відсутнє)
4. [Потенційні ризики](#потенційні-ризики)
5. [Ізоляція від Етапу 1](#ізоляція-від-етапу-1)
6. [Сюжетні проблеми](#сюжетні-проблеми)
7. [Античіт перевірка](#античіт-перевірка)
8. [Масштабованість](#масштабованість)

---

## ПРАЦЮЄ

### ✅ Store (store.ts)
| Функція | Стан | Опис |
|---------|------|------|
| `interactWithNpc()` | ✅ Працює | Оновлює relationships |
| `startQuest()` | ✅ Працює | Додає квест до active |
| `completeQuest()` | ✅ Працює | Видає rewards |
| `updateQuestObjective()` | ✅ Працює | Збільшує прогрес |
| `claimNpcReward()` | ✅ Працює | Розблоковує rewards |
| `museumState` | ✅ Працює | Зберігається |
| `storyState` | ✅ Працює | NPC relationships |
| `persist()` | ✅ Працює | localStorage |

### ✅ Компоненти
| Компонент | Стан | Опис |
|-----------|------|------|
| `Academy.tsx` | ✅ Працює | Головний екран |
| `StorySystem.tsx` | ✅ Працює | NPC та квести |
| `NPCSystem.tsx` | ✅ Працює | NPC в Академії |
| `AcademyProgress.tsx` | ✅ Працює | Прогрес до unlock |
| `PrestigeMilestones.tsx` | ✅ Працює | Престиж milestone |
| `AcademyTeaser.tsx` | ✅ Працює | Teaser до unlock |

### ✅ Дані
| Дані | Стан | Опис |
|------|------|------|
| `storyNpcs` | ✅ 5 NPCs | Князь, Монах, Гетьман, Археолог, Куратор |
| `storyQuests` | ✅ 30+ квестів | 5 арок + daily |
| `initialStoryProgress` | ✅ Працює | Початковий стан |
| `Achievement Logic` | ✅ Інтегровано | checkAndUnlockAchievements() |
| `Events Logic` | ✅ Інтегровано | joinEvent() |

---

## ЧАСТКОВО РЕАЛІЗОВАНО

### ⚠️ Story Chapters
| Проблема | Опис |
|----------|------|
| Немає структури chapter | Квести є, але немає явного поділу на глави |
| `currentChapter` не використовується | Поле існує, але не впливає на геймплей |
| `completedChapters` порожній | Ніколи не заповнюється |

**Рекомендація:** Додати структуру глав або прибрати зайві поля.

### ⚠️ Quest Progress Tracking
| Проблема | Опис |
|----------|------|
| Objectives зберігаються | `QuestProgress.objectives` працює |
| Але UI показує current:0 | `StoryQuest.objectives[].current` завжди 0 |

**Рекомендація:** UI повинен читати з `activeQuests`, а не з `storyQuests`.

### ⚠️ Daily Quests
| Проблема | Опис |
|----------|------|
| Daily quests не генеруються | Статичні quests, не ротуються |
| Немає reset щодня | `lastReset` не перевіряється |

**Рекомендація:** Додати генерацію daily quests або видалити daily з назви.

---

## ВІДСУТНЄ

### ❌ Guild System
- Немає соціальних функцій
- Немає кооперативних квестів

### ❌ Season Events
- Немає системи сезонних подій
- Немає сезонного контенту

### ❌ Multiple Save Slots
- Один save на гравця
- Немає cloud save

### ❌ Supabase Sync для Story
- StoryState зберігається тільки локально
- Прогрес не синхронізується

### ❌ Quest Chain Dependencies
- Немає перевірки залежностей квестів
- Можна почати квест без виконання попереднього

---

## ПОТЕНЦІЙНІ РИЗИКИ

### 🔴 ВИСОКИЙ РИЗИК

#### 1. Quest Prerequisites Not Checked
**Проблема:** Можна почати квест без виконання попереднього.
```typescript
// startQuest() не перевіряє:
// - Чи виконано попередні квести
// - Чи досягнуто мінімального relationship level
```

#### 2. Duplicate Quest Start Possible
**Проблема:** Можна додати той самий квест до activeQuests декілька разів.
```typescript
// startQuest() не перевіряє:
// - Чи квест вже active
```

### 🟠 СЕРЕДНІЙ РИЗИК

#### 3. StoryState Reset on Prestige
```typescript
// resetExpeditionOnPrestige() НЕ скидає:
// - storyState
// - npcRelationships
```
**Проблема:** Прогрес історії зберігається між prestige. Може бути бажаною поведінкою, але не документовано.

### 🟠 СЕРЕДНІЙ РИЗИК

#### 3. Duplicate Quest Start
**Проблема:** Можна почати той самий квест двічі?
```typescript
// startQuest перевіряє тільки:
// - Квест існує
// - NPC relationship достатній
// НЕ перевіряє: чи квест вже active
```

#### 4. Offline Progress Not Calculated
**Проблема:** NPC income, museum income НЕ нараховуються офлайн.

### 🟢 НИЗЬКИЙ РИЗИК

#### 5. Quest Rewards Not Applied
**Проблема:** `completeQuest` викликає `claimNpcReward`, але rewards можуть бути неробочими.

---

## ІЗОЛЯЦІЯ ВІД ЕТАПУ 1

### Поточний стан

| Компонент | Етап 1 | Етап 2 (Академія) |
|-----------|---------|---------------------|
| GameState (клікер) | ✅ | ❌ Не використовується |
| ExpeditionStore | ❌ | ✅ |
| karbovanets | Спільний | Спільний |
| historicalPrestige | Спільний | Спільний |

### ✅ Винесено в ExpeditionStore
- `academyLevel`
- `reputation`
- `karbovanets` (спільний!)
- `museumVisitors`
- `historicalPrestige` (спільний!)
- `heroes`, `artifacts`, `regions`, `expeditions`
- `buildingLevels`
- `museumState`
- `storyState`

### ⚠️ Потенційна проблема
```typescript
// karbovanets використовується в:
// - Клікер (App.tsx)
// - Академія (ExpeditionStore)

// Якщо гравець престижиться:
// - Клікер reset
// - Академія НЕ reset karbovanets
```

### ✅ resetExpeditionOnPrestige() існує
```typescript
export function resetExpeditionOnPrestige() {
  // Скидає museum, expeditions, buildings
  // ЗБЕРІГАЄ: karbovanets, reputation, academyLevel, heroes
}
```

**Рекомендація:** Документувати що саме зберігається при prestige.

---

## СЮЖЕТНІ ПРОБЛЕМИ

### 🔍 Знайдено

#### 1. Hardcoded NPC IDs
```typescript
// storyQuests NPC IDs:
'story-knyaz-vladimir'   // є в storyNpcs ✅
'story-monk-pereyaslav'  // є в storyNpcs ✅
'story-hetman-khmelnytsky' // є в storyNpcs ✅
'story-archaeologist-academy' // є в storyNpcs ✅
'story-museum-curator'  // ❌ НЕМАЄ в storyNpcs!
```

**Вплив:** Квести з `npcId: 'story-museum-curator'` не працюватимуть.

#### 2. Missing Quest Dependencies
```
arc1-quest-1 (relationship level 1)
arc1-quest-2 (relationship level 2) - залежить від arc1-quest-1?
arc1-quest-3 (relationship level 2) - залежить від arc1-quest-2?
```

**Рекомендація:** Додати перевірку prerequisites.

#### 3. No Quest Chain Visualization
**Проблема:** UI не показує послідовність квестів.

#### 4. Hardcoded Objectives
```typescript
// objectives.type може бути:
// 'expedition', 'visit', 'prestige', 'speak', 'build', 'collect'

// Але updateQuestObjective очікує ключ:
// `${obj.type}_${obj.target}`
// напр. 'expedition_region-1'
```

**Проблема:** Може бути mismatch між типами.

---

## АНТИЧІТ ПЕРЕВІРКА

### ✅ Перевірено

| Механіка | Захист | Опис |
|----------|--------|------|
| Quest rewards | ✅ | Видаються через store, не client-side |
| NPC income | ✅ | Розраховується на сервері (якщо є) |
| Museum income | ✅ | Розраховується за формулою |
| Building upgrades | ✅ | Час зберігається в store |
| Exhibition slots | ✅ | Ліміт 12 слотів |

### ⚠️ Вразливості

| Вразливість | Ризик | Опис |
|-------------|-------|------|
| localStorage manipulation | 🔴 ВИСОКИЙ | Можна змінити storyState |
| Duplicate quest rewards | 🟠 СЕРЕДНІЙ | Можна отримати rewards повторно? |
| Time manipulation | 🟡 НИЗЬКИЙ | Museum income залежить від часу |
| Duplicate collection completion | 🟡 НИЗЬКИЙ | Можна змінити completedCollections |

### Рекомендації

1. **Серверна валідація:** Критичні дії (quest complete, collection unlock) повинні валідуватись на сервері.

2. **HMAC підпис:** Додати підпис стану для перевірки цілісності.

3. **Rate limiting:** Обмежити frequency дій (квести, rewards).

---

## МАСШТАБОВАНІСТЬ

### ✅ Легко додавати

| Елемент | Як додати |
|---------|-----------|
| Нові NPC | Додати до `storyNpcs[]` |
| Нові квести | Додати до `storyQuests[]` |
| Нові rewards | Розширити `QuestReward.type` |
| Нові buildings | Додати до `buildings[]` в data |
| Нові регіони | Додати до `regions[]` |

### ⚠️ Обмеження

| Елемент | Ліміт | Коментар |
|---------|-------|----------|
| Exhibition slots | 12 | Жорстко закодовано |
| Museum upgrades | 4 типи | marketing, security, exhibition_hall, restoration_wing |
| Achievement types | 6 | visitors, artifacts, collections, reputation, exhibitions, events |

### ❌ Складно додавати

| Елемент | Проблема |
|---------|----------|
| Нові глави | Немає структури chapter |
| Сезонні події | Немає системи сезонів |
| Нові NPC roles | Жорстко закодовано в типах |
| Соціальні функції | Немає infrastructure |

---

## 📊 ПІДСУМОК

| Категорія | Працює | Частково | Відсутнє |
|-----------|--------|----------|----------|
| Store | 12 | 2 | 0 |
| Компоненти | 6 | 0 | 0 |
| Дані | 4 | 2 | 3 |
| Безпека | 5 | 4 | 1 |
| Масштабованість | 5 | 3 | 2 |

### Найважливіші знахідки:

1. **КРИТИЧНЕ:** `story-museum-curator` не існує в `storyNpcs`
2. **ВИСОКИЙ:** Quest chain dependencies не перевіряються
3. **СЕРЕДНІЙ:** Daily quests не ротуються
4. **НИЗЬКИЙ:** Story chapters не використовуються

---

## 🛠️ РЕКОМЕНДАЦІЇ

### Негайні (для релізу)

1. Виправити `story-museum-curator` → додати NPC або змінити NPC IDs в квестах
2. Додати перевірку prerequisites для квестів

### Короткострокові

1. Реалізувати генерацію daily quests
2. Додати використання `currentChapter`
3. Виправити UI для показу прогресу квестів

### Довгострокові

1. Система сезонних подій
2. Guild/social features
3. Cloud save з Supabase

---

**Аудит підготовлено:** 2026-06-20
**Аудитор:** OpenHands Agent
