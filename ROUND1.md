# Round 1 — MVP acceptance

Date: 2026-10-24 HKT

## Built
- Vite + vanilla JS SPA at `/workspace/wordjoy-kids`
- 60 original words × 6 themes; emoji SVG placeholders
- Games: pic_match, speed_star, treasure_tap
- Screens: home → themes → games → play → results (+ parent card)
- localStorage: coins, stars, best, reviewBag, sessions
- Hash router + safe-area CSS (Capacitor-ready)
- Playwright 390×844: 2 passed
- GitHub: https://github.com/KennethEnglun/wordjoy-kids

## Competitive scores (/10)
| Axis | Score | Notes |
|------|-------|-------|
| Engagement | 5.5 | 3 modes + stars/coins; thin vs Lingokids songs/characters & Blooket variety |
| HK-curriculum fit | 6.5 | Theme labels + KS1 hint; only 60 words; no unit mapping |
| Parent peace-of-mind | 6.0 | No ads, on-device storage, end-session parent card; no PIN/multi-kid yet |
| Completeness | 5.0 | Playable MVP; TTS via Web Speech only; art is emoji placeholders |

## Top gaps (next fixes)
1. Real kid illustrations (ChatGPT art) — replace emoji SVGs
2. Reliable per-word audio (pre-recorded en-GB) + follow-along
3. Review bag play mode (use missed words next session)
4. Multi-child profiles + parent PIN
5. Expand vocab to 150–200 + clothes/body/home themes

## Pain point amplified this round
**HK school-theme vocab + 繁中 parent layer + picture-first + 5-min sessions + zero-conflict UX** (wrong answers show correct gently, review bag, parent summary).

## iOS readiness
Safe-area insets, touch-only UI, local `public/art/` assets, hash deep links, storage/audio helpers — ready for later Capacitor wrap. No kid-screen ads.
