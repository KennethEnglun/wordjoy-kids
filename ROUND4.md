# Round 4 — acceptance

Date: 2026-10-24 HKT

## Delivered
- **Café Order** — new `cafe_order` game mode (listen, pick, serve)
- **Weekly school theme picker** — parents mark up to **2** themes as 「本週學校主題」
- **Habit nudge** — gentle home prompt to keep the daily streak going
- **`prioritizeWords`** — school-theme words surface first in play/review
- Playwright: **8 passed**
- No visual style rebrand this round (focus on mechanics)

## Competitive scores (/10)
| Axis | Score | Δ |
|------|-------|---|
| Engagement | **7.5** | +0.5 Café Order, habit nudge |
| HK-curriculum fit | **7.5** | +0.5 weekly school-theme picker + prioritizeWords |
| Parent peace-of-mind | **8.0** | +0.5 theme picker maps home practice to school |
| Completeness | **7.0** | +0.5 one game + theme picker; art/audio still placeholder |

## Top gaps (next)
1. Momo UI redesign (visual identity refresh) still pending
2. Real word illustrations (ChatGPT) replace emoji SVGs
3. Pre-recorded en-GB audio pack (TTS quality varies by device)
4. Daily push reminders
5. Phonics layer (letter sounds / blending)

## Pain point amplified
**本週學校主題**：家長揀最多兩個學校單元，屋企練習即刻對齊學校進度，唔使估今個禮拜學咩。

## iOS readiness
All art/audio local under `public/`; no CDN; themes + `prioritizeWords` in localStorage (later Capacitor Preferences); safe-area and audio-unlock retained.
