# WordJoy 英樂寶 — Design Spec (v1)

Working name: **WordJoy（英樂寶）**  
Audience: Chinese-family children in HK, Pre-K / K1–K3 → Primary 3  
Platform: Mobile-first web app (PWA), portrait, thumb-friendly  
Tone: Bright, playful, high-contrast, big type; Traditional Chinese UI + English learning content

## Goals
1. Learn English vocabulary through short Blooket-like mini-games (original IP — no Blooket names/art).
2. Vocab themed to **Hong Kong primary English** practice (Longman Express / Leap, EPH Step Up style units + EDB KS1 modules), **not** a verbatim textbook dump (copyright).
3. Picture-first: every word has a clear kid-friendly illustration.
4. Parent-friendly: no account required for guest play; progress saved locally; optional parent PIN later.

## Age bands
| Band | Code | Focus |
|------|------|--------|
| 學前 / K | `prek` | Picture→word, colours, numbers 1–10, family, animals, greetings |
| 小一 | `p1` | School, body, toys, food, clothes; simple "What is this?" |
| 小二 | `p2` | Home, weather, transport, daily routines; plurals, a/an |
| 小三 | `p3` | Sports, places, feelings, time; short phrases / matching sentences |

## Theme modules (KS1-aligned, original lists)
1. Me & Family（我同家人）
2. Colours & Numbers（顏色同數字）
3. Animals（動物）
4. Food & Drink（食物）
5. School Things（學校用品）
6. Clothes（衣服）
7. Body（身體）
8. Toys & Games（玩具）
9. Home（家）
10. Weather & Seasons（天氣）
11. Transport（交通）
12. Places in HK / Community（社區）
13. Sports & Fun（運動）
14. Feelings & Manners（感受同禮貌）

Each entry: `{ id, en, zhHant, band, theme, image, audio? }`

Starter pack (MVP): Themes 1–5 × ~12 words each ≈ 60 words with images.

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
4. **Navigation**: history API / in-app router, not multi full-page reloads; deep-link friendly routes (`#/band/p1/theme/animals/game/pic_match`).
5. **IAP / privacy later**: no Account required for core play; prepare Privacy Nutrition Labels (kids, no tracking); COPPA-style: no third-party ads in kid screens.
6. **Screen sizes**: test 390×844 and 430×932; respect Dynamic Type later via relative rem.
7. **Store listing prep**: separate `store/` notes for screenshots, age 4+, HK Traditional Chinese + English metadata.
