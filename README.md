# 英樂寶 WordJoy

香港中文家庭小朋友學英文詞彙嘅手機優先網頁遊戲（Pre-K → 小三）。圖畫先行、繁中家長層、貼近香港小學 KS1 主題（原創詞表，不抄出版社）。

Mobile-first English vocab mini-games for Chinese-family kids in Hong Kong. Picture-first, Traditional Chinese parent layer, KS1-aligned original word lists.

## 快速開始 / Quick start

```bash
npm install
npm run dev
```

開瀏覽器：http://127.0.0.1:5173 （建議用手機闊度或 DevTools 390×844）

```bash
npm test          # Playwright 手機 viewport
npm run build     # 產出 dist/（可給 Capacitor 包 iOS）
```

## MVP 內容

- 60 個原創詞（family / colours / numbers / animals / food / school）
- 3 款遊戲：對對碰、閃電答題、開寶箱
- localStorage 進度（星、金幣、複習袋、家長摘要）
- Web Speech 英文發音（裝置支援時）
- Hash router + safe-area CSS，方便之後 Capacitor → App Store

## iOS 路線

而家係 web app；之後可用 Capacitor 包成原生 iOS。請保持資產喺 `public/art/`、唔靠 CDN、唔用 hover-only 操作。

## 授權注意

詞表為原創，主題對齊香港常見 KS1／朗文·牛津類單元方向，**並非**抄錄任何出版社字表。
