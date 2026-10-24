# Round 2 — acceptance

Date: 2026-10-24 HKT

## Delivered
- Review bag play mode (`#/play/review/__review__/review`)
- Multi-child profiles (max 3) + parent PIN gate
- Stronger TTS (en-GB prefer) + speak-on-correct + unlockAudio
- Vocab **102** words; themes +clothes/+body/+home
- Streak 🔥, celebrate results, KS1 badges
- Joy mascot webp on Home/Results (`public/art/mascot/`)
- Playwright: 4 passed

## Competitive scores (/10)
| Axis | Score | Δ |
|------|-------|---|
| Engagement | **6.5** | +1 streak, celebrate, Joy, review mode |
| HK-curriculum fit | **7.0** | +1 themes clothes/body/home, KS1 badge |
| Parent peace-of-mind | **7.0** | +1 PIN + multi-kid + summary |
| Completeness | **6.0** | +1 audio/profiles/vocab; art still placeholder words |

## Top gaps (next)
1. Real word illustrations (ChatGPT) replace emoji SVGs
2. Pre-recorded en-GB audio pack (TTS quality varies by device)
3. +3 game modes (word_race / fish_words / cafe_order)
4. Daily goal + session time cap (螢幕時間)
5. Parent weekly digest / 「本週學校主題」picker

## Pain point amplified
**兄弟姊妹多檔 + 複習袋 + 家長 PIN**：一機多仔女、錯字可重練、家長睇摘要唔驚被改設定。

## iOS readiness
Joy/mascot local webp; audio unlock for WebView; profiles in localStorage (later Capacitor Preferences); still no CDN; safe-area retained.
