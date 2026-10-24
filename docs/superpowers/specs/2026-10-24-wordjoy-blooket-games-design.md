# WordJoy R6 — Distinct Game Mechanics Spec

**Date:** 2026-10-24 (Asia/Hong_Kong)  
**Status:** DESIGN ONLY — waiting for ChatGPT 圖片生成 mockups in OneDrive `WordJoy/ui` before UI implementation  
**Repo:** KennethEnglun/wordjoy-kids  
**Approved:** user chose **A + solo_bots + approve** (vocab as GATE into real action; solo vs AI bots)

---

## 0. Non-negotiables

| Rule | Detail |
|------|--------|
| Mascot | **字學貓** only — never 毛毛 / Momo in UI copy |
| Visual language | Cream cards, sage green primary, warm brown ink, watercolor forest (sister app 字學貓樂園) |
| Art source | **ChatGPT 圖片生成 → OneDrive WordJoy/ui** first; do not invent final game art/UI in code |
| IP | Blooket-**inspired** mechanics only — original WordJoy names, no Blooket assets/names |
| Platform | Capacitor-ready: local assets, safe-area, ≥48px taps, no hover-only |
| API keep | `createX({ words, pool, onDone, onCorrect, roundSize })` → `{ mount(root), destroy? }` |
| Result shape | `onDone({ correct, total, coins, missed, correctIds, meta? })` |

---

## 1. Core design principle

**Answering vocabulary is a GATE, not the whole game.**

1. Player triggers an action (cast, pick chest, serve customer, advance race, flip cards, start combo).  
2. A short **question gate** (MCQ: pic or EN) unlocks the reward / board action.  
3. Wrong answer → soft fail for that beat (miss fish / miss chest / lose combo / customer leaves) — no shame Game Over.  
4. Session ends after N beats or a timer; stars/coins from performance; AI bots score in parallel.

---

## 2. Shared scaffolding (logic only — UI placeholder until mockups)

Planned modules (implement after mockups land):

### 2.1 `src/lib/game/questionGate.js`
- Overlay MCQ using existing vocab helpers (`distractors`, `shuffle`) + TTS (`audio.speak`).
- Modes: `pic` (EN prompt → image choices) | `en` (image prompt → EN choices).
- DOM: `button.choice` + `data-choice` (keeps Playwright patterns where still MCQ-gated).
- Returns Promise `{ correct, word }`.

### 2.2 `src/lib/game/aiBots.js`
- 2–3 bots: `{ id, name, emoji, score }` — TC names e.g. 小星星 / 小雲 / 小龍.
- `tickBots(bots, opts)` — timed random score ticks while player plays.
- Used by treasureTap, fishWords, wordRace, speedStar (cafe may use customer spawn instead of scorebots).

### 2.3 Temporary placeholders until ChatGPT art
- Emoji / existing cream-card CSS only.
- Do **not** commission final board art, chest sprites, fish, diner layout, track, memory card backs in code.

---

## 3. Per-game mechanics

### 3.1 treasureTap — 寶箱森林 (Gold Quest style)

| Beat | Flow |
|------|------|
| Gate | Answer vocab correctly |
| Action | Choose **1 of 3 chests** |
| Chest table | gold · ×2/×3 · steal AI · swap scores · dragon (lose gold) · dragon treasure (big gold) |
| Win | Most gold after N rounds vs AI bots |
| HUD | Player gold + bot golds |

**ChatGPT mockup needs:** 3-chest board, chest open/close, dragon/gold/steal icons, bot score strip.

### 3.2 fishWords — 釣魚湖

| Beat | Flow |
|------|------|
| Cast | Tap to cast; wait for bite (short delay + ripple) |
| Gate | On bite → answer vocab |
| Success | Land fish → add **pounds** (weight by rarity) |
| Fail | Fish escapes |
| Meta | Lure upgrades (spend coins → better bite/weight) |
| Win | Highest pounds vs AI |

**ChatGPT mockup needs:** pond scene, rod/line, bite cue, fish sizes, lure shop strip.

### 3.3 cafeOrder — 小食店 (diner-dash — NOT static MCQ card UI)

| Beat | Flow |
|------|------|
| Queue | Customers arrive with dish order + patience bar |
| Gate | Answer vocab to **restock** or **serve** matching dish |
| Fail | Patience empty → customer leaves (no coins) |
| Meta | Coins unlock menu items / serve speed |
| Win | Coins / served count in time window |

**ChatGPT mockup needs:** counter + queue slots, customer bubble with dish art, patience bar, upgrade tray — **not** a full-screen 4-choice quiz layout.

### 3.4 wordRace — 詞語賽道

| Beat | Flow |
|------|------|
| Setup | You + **3 AI** runners on a track |
| Gate | Correct answer → your runner advances one segment |
| AI | Bots advance on timer / soft ticks |
| Win | First to finish (or farthest at round cap) |
| Primary feel | **Visual race**, quiz secondary |

**ChatGPT mockup needs:** 4-lane track, 字學貓 runner + 3 bot runners, finish line, progress markers.

### 3.5 speedStar — 閃電谷

| Beat | Flow |
|------|------|
| Loop | Rapid-fire gates under a round timer |
| Combo | Streak builds **star multiplier** |
| Wrong | Breaks combo (multiplier → 1) |
| AI | Parallel star tally |
| Win | Most stars |

**ChatGPT mockup needs:** timer bar, combo meter, star burst, vs-AI star row.

### 3.6 picMatch — 對對碰 (TRUE memory flip)

| Beat | Flow |
|------|------|
| Board | Grid of face-down cards: half **picture**, half **English word** |
| Play | Flip 2; match pic↔word of same vocab id |
| Mismatch | Flip back after brief reveal |
| Gate | Optional audio on flip; **main loop is memory**, not 4-choice MCQ |
| Win | Clear board (moves / time → stars) |

**ChatGPT mockup needs:** card backs (cream/sage), face layouts for pic vs word, match sparkle, grid for 8–12 cards (mobile 390×844).

---

## 4. Session / scoring mapping

| Game | `correct` | `coins` | `meta` ideas |
|------|-----------|---------|--------------|
| treasureTap | gates cleared | gold earned | `{ gold, bots }` |
| fishWords | fish landed | pounds→coins | `{ pounds, lure }` |
| cafeOrder | served | tip coins | `{ served, left }` |
| wordRace | correct advances | finish bonus | `{ place, progress }` |
| speedStar | correct answers | stars→coins | `{ comboMax, stars }` |
| picMatch | pairs matched | clear bonus | `{ moves, pairs }` |

Missed word ids still go to review bag via existing storage hooks.

---

## 5. UI mockup deliverables (for ChatGPT → OneDrive `WordJoy/ui`)

Request one phone mockup (390×844, cream/sage/warm brown, 字學貓 cameo OK) per game:

1. `game_treasure_tap.webp` — 3 chests + bot gold strip  
2. `game_fish_words.webp` — pond + cast/bite  
3. `game_cafe_order.webp` — diner queue (not MCQ card wall)  
4. `game_word_race.webp` — 4-lane race  
5. `game_speed_star.webp` — timer + combo  
6. `game_pic_match.webp` — memory grid mid-flip  

Optional shared: `game_question_gate.webp` (overlay style).

---

## 6. Implementation gate

| Phase | When |
|-------|------|
| ✅ This spec | now |
| ⏸ Game UI + CSS polish | after mockups in OneDrive `WordJoy/ui` |
| ⏸ Wire mechanics to mockups | after parent confirms art landed |
| Tests | update Playwright for memory cards / cafe queue when implementing |

**Do not** invent final screens in opencode/CSS before ChatGPT art arrives.

---

## 7. Out of scope (R6)

- Full dress-up / gacha shop  
- New vocab themes  
- Railway / deploy changes  
- Renaming mascot away from 字學貓  
