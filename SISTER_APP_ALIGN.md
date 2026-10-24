# WordJoy ↔ 字學貓樂園 對齊規格

Updated: 2026-10-24 HKT  
Sister app: [字學貓樂園](https://apps.apple.com/hk/app/id6768067443) (Ying Lun Pang)  
References: `art/reference/zijimao/{home,adventure,character}.png`

## 品牌宇宙
- **同一隻貓**：灰貓、額頭愛心、白尿布／bloomers；兩款 app 同一角色名「字學貓」（唔再叫毛毛／Momo）
- WordJoy = 英樂寶，同樂園世界，唔係另一套鮮艷 Blooket 品牌

## 視覺語言（跟字學貓）
| Token | Value |
|-------|--------|
| Background | Soft watercolor hills / forest / sky（暫用柔和漸變＋pattern） |
| Cards | Cream `#F7F1E6`，大圓角 ~24px |
| Primary | Sage green `#7BA17D` / `#8FB08F` |
| Text | Warm brown `#5C4033` |
| Accents | Soft blue CTA、金星、紫碎片 |
| Feel | Cozy、繪本、Animal Crossing — **唔用**螢光粉／電光藍 |

## IA／底部五 Tab（對齊）
| Tab | 字學貓 | WordJoy |
|-----|--------|---------|
| 1 | 首頁 | 首頁：捲軸橫幅＋字學貓、開始英文之旅、今日任務、學習報告／詞庫 |
| 2 | 冒險 | 冒險地圖：主題／遊戲當「路線」（對對碰、閃電、小食店…） |
| 3 | 任務 | 每日／複習任務（對齊 daily goal + review bag） |
| 4 | 商店 | 星星小店（可先 stub：裝扮／貼紙） |
| 5 | 角色 | 我的字學貓：等級、星星、裝扮（可先只有基礎造型） |

## 功能對照（產品）
| 字學貓 | WordJoy |
|--------|---------|
| 六大冒險樓／湖／塔 | 主題詞彙遊戲關卡 |
| 家長端派任務／自訂練習包 | 家長 PIN＋本週學校主題 |
| 學習報告 | Parent digest |
| 星星／碎片／抽卡／裝扮 | 星星／金幣；裝扮後加 |
| 粵語朗讀 | en-GB TTS → 預錄 |

## 實作階段
1. **R5 UI shell**：CSS token 換色、底部 tab、首頁／冒險／任務／角色骨架（美術未到用柔和 placeholder）
2. **美術到齊**：接 WordJoy/ui watercolor mockups
3. **商店／裝扮**：後續 round

原則：小朋友由中文 app 轉英文 app 感覺「同一個樂園學另一科」。
