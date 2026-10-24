# WordJoy UI Redesign — 字學貓主題（待美術）

Updated: 2026-10-24 HKT  
Trigger: 彭sir — UI 太簡陋，以小灰貓字學貓做賣點主題  
Art owner: ChatGPT 圖片生成 → OneDrive `WordJoy/ui`

## 目標
- 一打開就知「呢個 app 係字學貓嘅世界」
- 對齊 Lingokids / Blooket 級鮮艷，但完全 original IP
- Capacitor-ready：safe area、大掣、無 hover-only

## ChatGPT 交付清單（WordJoy/ui）
1. home_mockup
2. themes_mockup
3. games_mockup
4. play_ok / play_try
5. results_mockup
6. app_bg_pattern（可平鋪）
7. button_set
8. icon_pack（家庭／顏色／動物／食物／學校）

## 落 code 時改動（美術到齊後）
- `styles.css`：背景用 pattern；卡片圓角加大、軟陰影、字學貓色系（灰＋粉心＋奶油白）
- Home：字學貓 ≥40% 畫面高度、歡迎語「字學貓同你學英文！」
- Themes／Games：卡頂貼字學貓小 sticker；icon_pack 換 emoji
- Play HUD：字學貓表情隨答對／答錯切換
- Results：慶祝全屏字學貓 + confetti 色
- 刪除／停用 joy_* 雀鳥資產引用

## 暫不阻 R4
Café Order、學校主題、習慣提示照常；本輪係獨立 UI polish round。
