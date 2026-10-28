# WordJoy 英樂寶 — Design Spec (v1)

Working name: **WordJoy（英樂寶）**  
Audience: Chinese-family children in HK, junior / middle / senior primary (初小／中小／高小)  
Platform: Mobile-first web app (PWA), portrait, thumb-friendly
Mascot: **字學貓** (same cat IP as 字學貓樂園; never 毛毛/Momo in UI).
  
Tone: Bright, playful, high-contrast, big type; Traditional Chinese UI + English learning content

## Goals
1. Learn English vocabulary through short Blooket-like mini-games (original IP — no Blooket names/art).
2. Vocab themed to **Hong Kong primary English** practice (Longman Express / Leap, EPH Step Up style units + EDB KS1 modules), **not** a verbatim textbook dump (copyright).
3. Picture-first: every word has a clear kid-friendly illustration.
4. Parent-friendly: no account required for guest play; progress saved locally; optional parent PIN later.

## Age bands
Spiral theme packs: the same 16 themes appear in every band; `filterByBandTheme` treats `junior < middle < senior` as a progressive unlock (selecting middle also includes junior words for that theme).

| Band | Code | Focus |
|------|------|--------|
| 初小 | `junior` | Picture-first core words; short present-tense examples |
| 中小 | `middle` | Wider topic words; simple phrases and classroom language |
| 高小 | `senior` | Richer verbs/adjectives; longer examples and school-style sentences |

## Theme modules (KS1-aligned, original lists)
Runtime ids (16 packs × 24 words × 3 bands = **1152** entries):

1. `me_family` — Me & Family（我同家人）
2. `colours_shapes_numbers` — Colours, Shapes & Numbers（顏色形狀數字）
3. `animals_pets` — Animals & Pets（動物同寵物）
4. `food_drink` — Food & Drink（食物同飲品）
5. `school` — School（學校）
6. `clothes` — Clothes（衣服）
7. `body_senses` — Body & Senses（身體同感官）
8. `toys_games` — Toys & Games（玩具同遊戲）
9. `home` — Home（家）
10. `weather_seasons` — Weather & Seasons（天氣同季節）
11. `transport` — Transport（交通）
12. `places_community` — Places & Community（社區同地方）
13. `sports_hobbies` — Sports & Hobbies（運動同興趣）
14. `friends_feelings` — Friends & Feelings（朋友同感受）
15. `festivals` — Festivals（節日）
16. `nature_environment` — Nature & Environment（大自然）

Each entry: `{ id, en, zhHant, example, pos, band, theme, image }`

- `pos`: `noun` | `verb` | `adjective` | `adverb` | `phrase`
- `example`: a short English sentence using the word
- `image`: `art/words/{slug}.webp` where slug is the English lowercased with spaces and hyphens turned into underscores. Shared English across themes reuse one webp path.

Source draft: `docs/art/theme-packs-vocab-draft-2026-10-25.json`. Runtime copies: `public/data/vocab.json` and `data/vocab.json`. WebP art files are synced separately; JSON paths are wired even when a crop is not in git yet.

## Game modes (original; Blooket-inspired)
| ID | Name (EN / ZH) | Mechanic | Best for |
|----|----------------|----------|----------|
| `speed_star` | Speed Star / 閃電答題 | Same question, speed + accuracy points | All bands |
| `treasure_tap` | Treasure Tap / 開寶箱 | Correct → open chest (coins / power-ups) | K–P2 |
| `word_race` | Word Race / 詞語賽跑 | Correct answers move avatar along track | P1–P3 |
| `pic_match` | Pic Match / 對對碰 | Match picture↔word (memory / drag) | K–P1 |
| `fish_words` | Fish Words / 釣單字 | Cast, answer, reel fish = word | K–P2 |
| `cafe_order` | Café Order / 小食店 | Read/listen order, tap correct food pic | P1–P3 |

MVP ships: **Pic Match**, **Speed Star**, **Treasure Tap**. Others in later rounds.

## UX (mobile)
- Safe areas, min tap 48px, font ≥ 22px body / ≥ 32px keywords
- High contrast: dark text on pastel cards OR white on saturated buttons
- One primary action per screen; big Next / Replay
- Optional Traditional Chinese gloss under English
- Sound: tap SFX + optional TTS (Web Speech / pre-recorded later)
- Offline-capable static assets for MVP

## Tech
- Vite + vanilla JS or lightweight React; single-page
- `data/vocab.json` + `public/art/`
- LocalStorage progress (stars, coins, unlocked themes)
- Playwright mobile viewport tests (390×844)
- GitHub: KennethEnglun/wordjoy-kids
- Deploy later (Railway / static) when user asks — Railway login currently paused

## Coding workflow
- opencode CLI: `opencode-go/deepseek-v4.1-flash`, stdin closed (`< /dev/null`)
- Art: ChatGPT 圖片生成 teammate → OneDrive / `/workspace/wordjoy-kids/art/`
- Continuous: build → Playwright → fix → polish rounds until 彭sir says stop

## Legal / education notes
- Do **not** copy publisher wordlists or book pages.
- Align **themes & difficulty** with common HK KS1 practice and EDB module ideas.
- Age-appropriate only; no ads in MVP; no chat with strangers.

## iOS App Store path (from day one)
Later: wrap / rewrite as native iOS for App Store. During web MVP:

1. **Capacitor-ready**: no hard desktop assumptions; all UI in `#app` mobile shell; safe-area CSS (`env(safe-area-inset-*)`); touch events not hover-only.
2. **No browser-only APIs as sole path**: prefer abstractions for storage (localStorage → later Keychain/UserDefaults), audio (Web Audio / HTMLAudio → AVFoundation), haptics optional stub.
3. **Asset pipeline**: PNG/WebP in `public/art/`; avoid CDN-only assets; keep offline-first so Capacitor offline works.
4. **Navigation**: history API / in-app router, not multi full-page reloads; deep-link friendly routes (`#/play/junior/animals_pets/pic_match`).
5. **IAP / privacy later**: no Account required for core play; prepare Privacy Nutrition Labels (kids, no tracking); COPPA-style: no third-party ads in kid screens.
6. **Screen sizes**: test 390×844 and 430×932; respect Dynamic Type later via relative rem.
7. **Store listing prep**: separate `store/` notes for screenshots, age 4+, HK Traditional Chinese + English metadata.
