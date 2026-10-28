# WordJoy — Six Practical Life Themes (Approach A)

**Date:** 2026-10-29 (Asia/Hong_Kong)
**Status:** DESIGN DRAFT — **not** wired into `public/data/vocab.json` or `src/lib/vocab.js`; **art deferred**
**Repo:** KennethEnglun/wordjoy-kids
**Approved:** 彭sir chose **Approach A — life timeline + gaps** (6 new packs × 3 bands × 24 = **432** headwords)
**Companion JSON:** `docs/art/theme-packs-six-practical-2026-10-29.json`
**Existing 16-theme bank:** `docs/art/theme-packs-vocab-draft-2026-10-25.json` (1152); original design tone from `DESIGN.md` (the 2026-10-25 theme-pack spec was not in this branch)

---

## 0. Non-negotiables

| Rule | Detail |
|------|--------|
| Mascot / UI | Unchanged — this pack is vocab design only |
| Schema | `{ id, en, zhHant, example, pos, band, theme }` — same as the 1152 bank |
| `id` | `{band}-{theme}-{slug}` where slug = `en` lowercased, spaces and hyphens → underscores |
| `pos` | `noun` \| `verb` \| `adjective` \| `adverb` \| `phrase` |
| `zhHant` | 書面語 gloss (Traditional Chinese); not Cantonese particles |
| `example` | Short English sentence only (HK primary voice; British spelling where it matters: *prioritise*, *sanitiser*, *kerb*, *trolley*) |
| Within one theme | **No duplicate `en` across bands** |
| Across themes | Shared `en` is OK (shared art slug by design) |
| Versus the 1152 | Prefer a **new** headword when the useful word is already in the bank, unless reuse is the same sense and natural (e.g. `buy`) |
| Art | **Deferred.** Do not add webp or batches in this PR |
| Runtime | **Do not** edit `public/data/vocab.json` or `src/lib/vocab.js` yet |

---

## 1. Goals

1. Close the biggest **practical-life gaps** after the 16 spiral packs (time, routines, money, jobs, health, safety) so P1–P6 can practise classroom English that maps onto daily Hong Kong life.
2. Keep the **same structure** as the existing 16 themes (方案 A spiral): every new theme appears in `junior` / `middle` / `senior` with 24 words each.
3. Stay **picture-first and kid-safe**: concrete junior nouns; middle classroom/community language; senior school-style verbs, adjectives and phrases.
4. Remain **original WordJoy lists** — theme *shape* is inspired by common HK primary / EDB KS1–KS2 modules, not a copy of any official or publisher wordlist.

---

## 2. Legal / education framing

These 432 headwords are **original WordJoy content**.

- Theme choice is **inspired by** familiar Hong Kong primary English topic areas (daily life, time, shopping, occupations, health, community safety) and by the general outline of EDB Key Stage 1 / Key Stage 2 modules.
- They are **not** the EDB English Language Curriculum wordlist, **not** a Longman Express / Leap list, **not** EPH Step Up, and **not** a reconstruction of any textbook page or exam paper.
- Gloss is 書面語 so the same card can sit next to school English; examples are short present-tense (junior) or simple school sentences (middle/senior).
- Age-appropriate only: no brand names (no Octopus card), no ads, no stranger-danger scare copy beyond calm classroom safety language.

---

## 3. Bands (unchanged)

| Band | Code | Years | Focus in this pack |
|------|------|--------|--------------------|
| 初小 | `junior` | P1–P2 | Picture-first core words; short present-tense examples; noun-heavy |
| 中小 | `middle` | P3–P4 | Wider topic words; simple phrases and classroom/community language |
| 高小 | `senior` | P5–P6 | Richer verbs/adjectives; school-style sentences; habits, systems, judgement |

Runtime filter (when these packs are wired later) should keep the existing progressive unlock: `junior < middle < senior`.

---

## 4. The six themes

| # | id | EN | ZH | Spiral (approved) |
|---|----|----|----|-------------------|
| 17 | `time_calendar` | Time & Calendar | 時間日曆 | weekdays / day-night / clock → months / date / half past → schedule / deadline / punctual |
| 18 | `daily_routines` | Daily Routines | 日常作息 | get up / brush / breakfast → pack bag / homework / chores → manage time / priority / habit |
| 19 | `shopping_money` | Shopping & Money | 購物金錢 | shop / buy / dollar / cheap → price / change / receipt / queue → budget / discount / afford |
| 20 | `jobs_work` | Jobs & Work | 職業工作 | teacher / doctor / driver → nurse / chef / firefighter + work verbs → career / interview / responsibility |
| 21 | `health_hygiene` | Health & Hygiene | 健康衛生 | wash / soap / sick / rest → clinic / medicine / healthy → symptom / prevention / hygiene |
| 22 | `safety_rules` | Safety & Rules | 安全規則 | stop / look / helmet / careful → crossing / emergency / stranger → hazard / evacuate / first aid |

6 × 3 × 24 = **432**. After a future wire-up the full bank would be 16 + 6 = 22 themes (1584 words). That wire-up is **out of scope**.

---

## 5. Schema (per entry)

Same as the 1152 draft:

```json
{
  "id": "junior-time_calendar-monday",
  "en": "Monday",
  "zhHant": "星期一",
  "example": "Monday is a school day.",
  "pos": "noun",
  "band": "junior",
  "theme": "time_calendar"
}
```

Proper names (weekdays, months) keep English capitalisation in `en`; the slug is still lowercased (`monday`, `january`).

---

## 6. Boundary notes versus the existing 16 themes

| New theme | Stays in this pack | Stays in the 16 |
|-----------|--------------------|-----------------|
| `time_calendar` | weekdays, months, clock, date, schedule language | Seasons and weather in `weather_seasons`. School `timetable` / `punctual` may be reused only where the spiral names them. |
| `daily_routines` | get-up / hygiene tools / packing / chores / habits | Dish names in `food_drink`; furniture in `home`; stationery in `school`. `breakfast`, `homework`, `chore`, `sleep` are same-sense reuses because the spiral names those beats. |
| `shopping_money` | money, shops, price, consumer judgement | Food/dish nouns in `food_drink`; place names like `market` already in `places_community` — prefer `stall` / `supermarket` / `mall` here. |
| `jobs_work` | job titles, workplaces, career language | `teacher` (school) and `driver` (transport) reused as the **same sense**. Vehicle types stay in `transport`. |
| `health_hygiene` | soap, germs, clinic, medicine, prevention | Body-part nouns and senses in `body_senses`. `wash` / `healthy` / `hygiene` / `clean` reused as the same sense. |
| `safety_rules` | stop/look, helmet, crossing, stranger, hazard, first aid | Vehicle types in `transport`. `crossing` (places), `helmet` (transport), `evacuate` (weather) reused as the same safety sense. |

Shared `en` across themes **shares one art slug**. Same-sense reuse is welcome (`buy`, `teacher`). Different-sense clash is called out in §11.

---

## 7. POS mix (directional, matching the 1152 design)

Targets copied from the original 16-theme shape: junior noun-heavy; middle/senior add verbs, adjectives, adverbs and phrases.

| Band | noun | verb | adjective | adverb | phrase |
|------|------|------|-----------|--------|--------|
| junior | 77 | 30 | 30 | 6 | 1 |
| middle | 72 | 24 | 36 | 6 | 6 |
| senior | 60 | 24 | 36 | 12 | 12 |
| **total** | 209 | 78 | 102 | 24 | 19 |

Per-theme junior template is **13 nouns / 5 verbs / 5 adjectives / 1 adverb / 0 phrases**, except `daily_routines` junior which spends one slot on the spiral phrase `get up` (12 / 5 / 5 / 1 / 1). Middle is **12 / 4 / 6 / 1 / 1**. Senior is **10 / 4 / 6 / 2 / 2**.

---

## 8. Coverage notes (quality bar)

- **Months:** all 12 appear in `time_calendar` — `January` in junior; `February`–`September` in middle; `October`–`December` in senior.
- **Weekdays:** all 7 appear in **junior** `time_calendar`.
- **No seasons** in `time_calendar` (not even in examples: July/August are “holiday month” / “hot”, not *summer*).
- **Clock:** junior `clock` / `start` / `finish` / `show`; middle `minute` + phrase `half past`. (`hour` / `o'clock` / `evening` omitted — see §12.)
- British classroom forms: *prioritise*, *sanitiser*, *kerb*, *trolley*, *plaster*, *queue*, *maths* is not required here; examples follow the 1152 voice (`Mom`, short present tense).

---

## 9. Wordlists

Each table is 24 rows. Machine-readable twin: `docs/art/theme-packs-six-practical-2026-10-29.json`.


### 9.1 `time_calendar` — Time & Calendar（時間日曆）

**Spiral:** junior weekdays / day-night / clock basics → middle months / date / half past → senior schedule / deadline / punctual

**Boundary:** Months, weekdays, clock and date language only. Seasons (`spring`, `summer`, `autumn`, `winter`) stay in `weather_seasons`.


#### Junior (P1–P2) — `time_calendar` (noun 13 · verb 5 · adjective 5 · adverb 1 · phrase 0)

| en | pos | zhHant | example |
|----|-----|--------|---------|
| Monday | noun | 星期一 | Monday is a school day. |
| Tuesday | noun | 星期二 | Art is on Tuesday. |
| Wednesday | noun | 星期三 | We swim on Wednesday. |
| Thursday | noun | 星期四 | PE is on Thursday. |
| Friday | noun | 星期五 | I like Friday. |
| Saturday | noun | 星期六 | We play on Saturday. |
| Sunday | noun | 星期日 | Sunday is a rest day. |
| morning | noun | 早上 | I read in the morning. |
| afternoon | noun | 下午 | We walk in the afternoon. |
| night | noun | 夜晚 | The moon comes out at night. |
| clock | noun | 時鐘 | Look at the clock. |
| calendar | noun | 日曆 | See the date on the calendar. |
| January | noun | 一月 | January is the first month. |
| start | verb | 開始 | School starts at eight. |
| finish | verb | 結束 | We finish at three. |
| ring | verb | 響起 | The bell rings at noon. |
| check | verb | 查看 | Check the calendar. |
| show | verb | 顯示 | The clock shows nine. |
| first | adjective | 第一 | Monday is the first weekday. |
| last | adjective | 最後 | Sunday is the last day. |
| next | adjective | 下一個 | Tuesday is next. |
| daily | adjective | 每日 | We have a daily class. |
| free | adjective | 空閒 | I am free on Sunday. |
| today | adverb | 今天 | We have music today. |


#### Middle (P3–P4) — `time_calendar` (noun 12 · verb 4 · adjective 6 · adverb 1 · phrase 1)

| en | pos | zhHant | example |
|----|-----|--------|---------|
| February | noun | 二月 | February is a short month. |
| March | noun | 三月 | We have a picnic in March. |
| April | noun | 四月 | We plant trees in April. |
| May | noun | 五月 | The weather is warm in May. |
| June | noun | 六月 | The term ends in June. |
| July | noun | 七月 | July is a holiday month. |
| August | noun | 八月 | It is hot in August. |
| September | noun | 九月 | School starts in September. |
| date | noun | 日期 | What is the date today? |
| week | noun | 一星期 | A week has seven days. |
| year | noun | 年 | A year has twelve months. |
| minute | noun | 分鐘 | Wait one minute. |
| pass | verb | 過去 | Time passes quickly. |
| mark | verb | 標記 | Mark the date. |
| plan | verb | 計劃 | Plan your week. |
| tick | verb | 勾選 | Tick the date. |
| monthly | adjective | 每月 | We have a monthly test. |
| weekly | adjective | 每週 | We have a weekly quiz. |
| upcoming | adjective | 即將到來 | Check the upcoming dates. |
| previous | adjective | 先前 | Look at the previous week. |
| whole | adjective | 整個 | I was busy the whole day. |
| exact | adjective | 確實 | What is the exact date? |
| yesterday | adverb | 昨天 | It rained yesterday. |
| half past | phrase | 半點 | It is half past three. |


#### Senior (P5–P6) — `time_calendar` (noun 10 · verb 4 · adjective 6 · adverb 2 · phrase 2)

| en | pos | zhHant | example |
|----|-----|--------|---------|
| October | noun | 十月 | Sports Day is in October. |
| November | noun | 十一月 | The weather turns cool in November. |
| December | noun | 十二月 | December has Christmas. |
| weekend | noun | 週末 | I rest at the weekend. |
| term | noun | 學期 | The first term starts in September. |
| appointment | noun | 預約 | I have a dentist appointment. |
| diary | noun | 日程日記 | Write plans in your diary. |
| planner | noun | 計劃冊 | Tick tasks in your planner. |
| deadline | noun | 限期 | Meet the project deadline. |
| schedule | noun | 時間表 | Follow the exam schedule. |
| postpone | verb | 延期 | Postpone the picnic if it rains. |
| reschedule | verb | 改期 | Reschedule the meeting please. |
| arrange | verb | 安排 | Arrange a time to meet. |
| remind | verb | 提醒 | Remind me of the date. |
| punctual | adjective | 準時 | Be punctual for the test. |
| overdue | adjective | 過期未還 | This library book is overdue. |
| available | adjective | 有空 | I am available after three. |
| annual | adjective | 一年一度 | Sports Day is an annual event. |
| prompt | adjective | 迅速 | Please give a prompt reply. |
| occasional | adjective | 偶爾 | We have occasional holidays. |
| tomorrow | adverb | 明天 | The trip is tomorrow. |
| ahead | adverb | 提前 | Plan your week ahead. |
| in advance | phrase | 預先 | Book the hall in advance. |
| on time | phrase | 準時 | Please arrive on time. |


### 9.2 `daily_routines` — Daily Routines（日常作息）

**Spiral:** junior get up / brush / breakfast → middle pack bag / homework / chores → senior manage time / priority / habit

**Boundary:** Day sequence, self-care tools and chores. Meal **events** (breakfast) are allowed; dish/food names stay in `food_drink`. Body-part nouns stay in `body_senses` (examples may mention teeth/face).


#### Junior (P1–P2) — `daily_routines` (noun 12 · verb 5 · adjective 5 · adverb 1 · phrase 1)

| en | pos | zhHant | example |
|----|-----|--------|---------|
| toothbrush | noun | 牙刷 | I use a toothbrush. |
| toothpaste | noun | 牙膏 | Put toothpaste on it. |
| towel | noun | 毛巾 | Use a towel after the shower. |
| breakfast | noun | 早餐 | I eat breakfast at seven. |
| shower | noun | 淋浴 | Take a shower in the morning. |
| bath | noun | 沐浴 | I take a bath at night. |
| bedtime | noun | 就寢時間 | Bedtime is at nine. |
| alarm | noun | 鬧鐘 | The alarm rings at seven. |
| nap | noun | 小睡 | I take a nap after lunch. |
| comb | noun | 梳子 | Use a comb after the shower. |
| sink | noun | 洗手盆 | Wash your face at the sink. |
| lunchbox | noun | 午餐盒 | I pack my lunchbox. |
| brush | verb | 刷 | Brush your teeth. |
| rinse | verb | 漱洗 | Rinse your mouth. |
| hurry | verb | 趕忙 | Hurry or you will be late. |
| yawn | verb | 打哈欠 | I yawn at bedtime. |
| sleep | verb | 睡覺 | I sleep at nine. |
| sleepy | adjective | 睏倦 | I feel sleepy at night. |
| awake | adjective | 清醒 | I am awake at seven. |
| ready | adjective | 準備好 | I am ready for school. |
| lazy | adjective | 懶惰 | Do not be lazy this morning. |
| quick | adjective | 快捷 | Be quick, please. |
| now | adverb | 現在 | Get up now. |
| get up | phrase | 起床 | I get up at seven. |


#### Middle (P3–P4) — `daily_routines` (noun 12 · verb 4 · adjective 6 · adverb 1 · phrase 1)

| en | pos | zhHant | example |
|----|-----|--------|---------|
| homework | noun | 功課 | I finish my homework. |
| chore | noun | 家務 | Sweeping is a chore. |
| checklist | noun | 核對清單 | Tick the checklist. |
| worksheet | noun | 工作紙 | Finish the worksheet. |
| reminder | noun | 提示 | Set a reminder. |
| mop | noun | 拖把 | The mop is wet. |
| broom | noun | 掃帚 | Sweep with a broom. |
| dustpan | noun | 簸箕 | Hold the dustpan. |
| sponge | noun | 海綿 | Clean with a sponge. |
| water bottle | noun | 水瓶 | Fill your water bottle. |
| revision | noun | 溫習 | Do revision after dinner. |
| roster | noun | 值日表 | I am on the roster today. |
| pack | verb | 裝進 | Pack your bag at night. |
| unpack | verb | 取出 | Unpack your bag at home. |
| scrub | verb | 用力擦洗 | Scrub the sink. |
| dust | verb | 撣塵 | Dust the shelf. |
| prepared | adjective | 已準備 | I am prepared for school. |
| complete | adjective | 完成 | My checklist is complete. |
| unfinished | adjective | 未完成 | My homework is unfinished. |
| after-school | adjective | 課後 | I have an after-school class. |
| extra | adjective | 額外 | I have extra homework. |
| due | adjective | 到期應交 | The worksheet is due. |
| afterwards | adverb | 之後 | Do homework afterwards. |
| take out | phrase | 拿出 | Take out your homework. |


#### Senior (P5–P6) — `daily_routines` (noun 10 · verb 4 · adjective 6 · adverb 2 · phrase 2)

| en | pos | zhHant | example |
|----|-----|--------|---------|
| habit | noun | 習慣 | Sleep is a good habit. |
| priority | noun | 優先事項 | Homework is my priority. |
| goal | noun | 目標 | My goal is to read more. |
| lifestyle | noun | 生活方式 | A balanced lifestyle helps you. |
| self-care | noun | 自我照顧 | Self-care includes rest. |
| screen time | noun | 屏幕時間 | Limit your screen time. |
| commitment | noun | 承諾 | Keep your commitment. |
| routine | noun | 常規 | A morning routine saves time. |
| distraction | noun | 分心事物 | Games can be a distraction. |
| well-being | noun | 身心健康 | Rest helps your well-being. |
| manage | verb | 管理 | Manage your screen time. |
| prioritise | verb | 分出優先次序 | Prioritise your homework. |
| develop | verb | 培養 | Develop a reading habit. |
| skip | verb | 略過 | Do not skip breakfast. |
| productive | adjective | 有效率 | Mornings can be productive. |
| consistent | adjective | 持之以恆 | Be consistent with bedtime. |
| exhausted | adjective | 筋疲力盡 | I feel exhausted at night. |
| overwhelming | adjective | 難以應付 | Too much work is overwhelming. |
| essential | adjective | 必要 | Sleep is essential. |
| optional | adjective | 可選 | Extra games are optional. |
| wisely | adverb | 明智地 | Use screen time wisely. |
| steadily | adverb | 穩步地 | Build the habit steadily. |
| stick to | phrase | 堅持 | Stick to your plan. |
| stay up | phrase | 熬夜 | Do not stay up late. |


### 9.3 `shopping_money` — Shopping & Money（購物金錢）

**Spiral:** junior shop / buy / dollar / cheap → middle price / change / receipt / queue → senior budget / discount / afford

**Boundary:** Shops, money, price and consumer language. No dish/food names as headwords (`apple`, `rice`, `noodles`, … stay in `food_drink`).


#### Junior (P1–P2) — `shopping_money` (noun 13 · verb 5 · adjective 5 · adverb 1 · phrase 0)

| en | pos | zhHant | example |
|----|-----|--------|---------|
| shop | noun | 商店 | The shop is near school. |
| dollar | noun | 元 | This rubber is five dollars. |
| coin | noun | 硬幣 | I have a coin. |
| money | noun | 金錢 | Keep your money safe. |
| wallet | noun | 錢包 | My wallet is small. |
| purse | noun | 手袋 | Mom has a purse. |
| basket | noun | 購物籃 | Put it in the basket. |
| trolley | noun | 手推車 | Push the trolley. |
| supermarket | noun | 超級市場 | We go to the supermarket. |
| mall | noun | 商場 | The mall is busy. |
| stall | noun | 攤檔 | Buy a pencil at the stall. |
| counter | noun | 櫃檯 | Pay at the counter. |
| bookstore | noun | 書店 | The bookstore sells stories. |
| buy | verb | 買 | I buy a pencil. |
| sell | verb | 賣 | They sell erasers. |
| pay | verb | 付款 | I pay with coins. |
| spend | verb | 花費 | Do not spend all your money. |
| choose | verb | 選擇 | Choose a cheap one. |
| cheap | adjective | 便宜 | This rubber is cheap. |
| expensive | adjective | 昂貴 | That bag is expensive. |
| heavy | adjective | 重 | The trolley is heavy. |
| empty | adjective | 空 | The basket is empty. |
| closed | adjective | 關閉 | The shop is closed. |
| too | adverb | 太 | It is too expensive. |


#### Middle (P3–P4) — `shopping_money` (noun 12 · verb 4 · adjective 6 · adverb 1 · phrase 1)

| en | pos | zhHant | example |
|----|-----|--------|---------|
| price | noun | 價錢 | Check the price. |
| change | noun | 找贖 | Here is your change. |
| receipt | noun | 收據 | Keep the receipt. |
| queue | noun | 隊伍 | The queue is long. |
| checkout | noun | 收銀處 | Go to the checkout. |
| price tag | noun | 價錢牌 | Read the price tag. |
| barcode | noun | 條碼 | Scan the barcode. |
| customer | noun | 顧客 | The customer waits. |
| aisle | noun | 通道 | Toys are in that aisle. |
| shopping list | noun | 購物清單 | Tick the shopping list. |
| carrier bag | noun | 購物袋 | Use a carrier bag. |
| coupon | noun | 優惠券 | This coupon is for two dollars. |
| cost | verb | 值 | This pen costs ten dollars. |
| scan | verb | 掃描 | Scan the barcode. |
| return | verb | 退回 | Return the broken toy. |
| wrap | verb | 包裝 | Wrap the gift. |
| reasonable | adjective | 合理 | The price is reasonable. |
| pricey | adjective | 價錢偏高 | That toy is pricey. |
| reduced | adjective | 減價 | The book is reduced. |
| necessary | adjective | 必要 | A pencil is necessary. |
| original | adjective | 原價 | The original price was higher. |
| long | adjective | 長 | The queue is long. |
| separately | adverb | 分開地 | Please pay separately. |
| pick out | phrase | 挑選 | Pick out a gift. |


#### Senior (P5–P6) — `shopping_money` (noun 10 · verb 4 · adjective 6 · adverb 2 · phrase 2)

| en | pos | zhHant | example |
|----|-----|--------|---------|
| budget | noun | 預算 | Make a weekly budget. |
| discount | noun | 折扣 | There is a discount today. |
| tax | noun | 稅 | The tax is included. |
| savings | noun | 儲蓄 | Put coins in your savings. |
| account | noun | 帳戶 | Mom has a bank account. |
| pocket money | noun | 零用錢 | I count my pocket money. |
| value | noun | 價值 | This book has good value. |
| refund | noun | 退款 | Ask for a refund. |
| warranty | noun | 保用期 | The lamp has a warranty. |
| advertisement | noun | 廣告 | Do not believe every advertisement. |
| afford | verb | 負擔得起 | I cannot afford that toy. |
| waste | verb | 浪費 | Do not waste money. |
| overspend | verb | 花費過多 | Do not overspend on toys. |
| bargain | verb | 講價 | We bargain at the stall. |
| affordable | adjective | 負擔得起 | This book is affordable. |
| costly | adjective | 花費大 | The trip is costly. |
| valuable | adjective | 有價值 | Time is valuable. |
| thrifty | adjective | 節儉 | Be thrifty with pocket money. |
| financial | adjective | 財務 | Keep simple financial notes. |
| economical | adjective | 經濟 | An economical choice helps. |
| cheaply | adverb | 便宜地 | Buy cheaply at the sale. |
| online | adverb | 在網上 | We shop online now. |
| set aside | phrase | 預留 | Set aside money for books. |
| shop around | phrase | 貨比三家 | Shop around before you buy. |


### 9.4 `jobs_work` — Jobs & Work（職業工作）

**Spiral:** junior teacher / doctor / driver → middle nurse / chef / firefighter + work verbs → senior career / interview / responsibility

**Boundary:** People, workplaces and work verbs. Vehicle **types** are not the focus (those stay in `transport`); `driver` / `drive` are the job sense.


#### Junior (P1–P2) — `jobs_work` (noun 13 · verb 5 · adjective 5 · adverb 1 · phrase 0)

| en | pos | zhHant | example |
|----|-----|--------|---------|
| teacher | noun | 老師 | My teacher is kind. |
| doctor | noun | 醫生 | The doctor helps me. |
| driver | noun | 司機 | The driver waits. |
| farmer | noun | 農夫 | The farmer works in the field. |
| cook | noun | 廚師 | The cook makes soup. |
| baker | noun | 麵包師傅 | The baker makes bread. |
| waiter | noun | 侍應 | The waiter brings water. |
| postman | noun | 郵差 | The postman brings letters. |
| cleaner | noun | 清潔工 | The cleaner sweeps the floor. |
| worker | noun | 工人 | The worker wears a hat. |
| job | noun | 工作 | Teaching is a job. |
| office | noun | 辦公室 | Dad works in an office. |
| factory | noun | 工廠 | The factory is noisy. |
| work | verb | 工作 | They work in the day. |
| teach | verb | 教導 | Teachers teach us English. |
| drive | verb | 駕駛 | Drivers drive carefully. |
| serve | verb | 招待 | Waiters serve drinks. |
| deliver | verb | 派送 | The postman delivers letters. |
| clever | adjective | 聰明 | The doctor is clever. |
| hard | adjective | 辛苦 | Farm work is hard. |
| outdoor | adjective | 戶外 | Farmers do outdoor work. |
| indoor | adjective | 室內 | Office work is indoor. |
| able | adjective | 有能力 | She is able to help. |
| kindly | adverb | 親切地 | Doctors speak kindly. |


#### Middle (P3–P4) — `jobs_work` (noun 12 · verb 4 · adjective 6 · adverb 1 · phrase 1)

| en | pos | zhHant | example |
|----|-----|--------|---------|
| nurse | noun | 護士 | The nurse is gentle. |
| chef | noun | 主廚 | The chef cooks in the kitchen. |
| firefighter | noun | 消防員 | Firefighters put out fires. |
| dentist | noun | 牙醫 | The dentist checks my teeth. |
| mechanic | noun | 技工 | The mechanic fixes bikes. |
| librarian | noun | 圖書館主任 | The librarian finds a book. |
| builder | noun | 建築工人 | Builders make houses. |
| plumber | noun | 水管工人 | The plumber fixes the tap. |
| electrician | noun | 電工 | The electrician fixes lights. |
| reporter | noun | 記者 | The reporter asks questions. |
| artist | noun | 藝術家 | The artist paints a cat. |
| workplace | noun | 工作場所 | Keep the workplace tidy. |
| fix | verb | 修理 | Mechanics fix engines. |
| treat | verb | 醫治 | Nurses treat sick people. |
| operate | verb | 操作 | They operate machines. |
| earn | verb | 賺取 | They earn money by working. |
| courageous | adjective | 勇敢 | Firefighters are courageous. |
| skilled | adjective | 熟練 | The chef is skilled. |
| trained | adjective | 受過訓練 | The nurse is trained. |
| dangerous | adjective | 危險 | Firefighting is dangerous. |
| tiring | adjective | 令人疲倦 | The job is tiring. |
| medical | adjective | 醫療 | Nurses do medical work. |
| bravely | adverb | 勇敢地 | Firefighters act bravely. |
| put out | phrase | 撲滅 | Firefighters put out fires. |


#### Senior (P5–P6) — `jobs_work` (noun 10 · verb 4 · adjective 6 · adverb 2 · phrase 2)

| en | pos | zhHant | example |
|----|-----|--------|---------|
| career | noun | 事業 | Teaching can be a career. |
| interview | noun | 面試 | I have a job interview. |
| responsibility | noun | 責任 | Safety is a responsibility. |
| application | noun | 申請 | Fill in the application. |
| salary | noun | 薪金 | A salary is paid monthly. |
| colleague | noun | 同事 | My colleague is helpful. |
| employer | noun | 僱主 | The employer is fair. |
| skill | noun | 技能 | Cooking is a useful skill. |
| experience | noun | 經驗 | Experience helps in interviews. |
| occupation | noun | 職業 | What occupation do you want? |
| apply | verb | 申請 | I apply for the post. |
| employ | verb | 僱用 | Shops employ extra staff. |
| qualify | verb | 取得資格 | Study to qualify as a nurse. |
| lead | verb | 領導 | Team leaders lead the group. |
| ambitious | adjective | 有志向 | She is ambitious about art. |
| experienced | adjective | 有經驗 | The chef is experienced. |
| qualified | adjective | 具備資格 | A qualified dentist is careful. |
| official | adjective | 正式 | This is an official letter. |
| part-time | adjective | 兼職 | She has a part-time job. |
| full-time | adjective | 全職 | Dad has a full-time job. |
| professionally | adverb | 專業地 | Nurses work professionally. |
| independently | adverb | 獨立地 | Designers work independently. |
| fill in | phrase | 填寫 | Fill in the form. |
| turn up | phrase | 出席 | Turn up on time for the interview. |


### 9.5 `health_hygiene` — Health & Hygiene（健康衛生）

**Spiral:** junior wash / soap / sick / rest → middle clinic / medicine / healthy → senior symptom / prevention / hygiene

**Boundary:** Illness, hygiene and care. No body-part nouns (`arm`, `tooth`, `stomach`, … stay in `body_senses`). `ambulance` is an emergency service, not a transport pack vehicle list.


#### Junior (P1–P2) — `health_hygiene` (noun 13 · verb 5 · adjective 5 · adverb 1 · phrase 0)

| en | pos | zhHant | example |
|----|-----|--------|---------|
| soap | noun | 肥皂 | Wash with soap. |
| rest | noun | 休息 | I need a rest. |
| germ | noun | 病菌 | Soap kills germs. |
| tissue | noun | 紙巾 | Use a tissue. |
| plaster | noun | 膠布 | Put a plaster on it. |
| mask | noun | 口罩 | Wear a mask when sick. |
| bandage | noun | 繃帶 | The bandage is clean. |
| flu | noun | 流感 | Flu makes you tired. |
| fever | noun | 發燒 | Rest if you have a fever. |
| health | noun | 健康 | Sleep is good for health. |
| toilet | noun | 廁所 | Wash after the toilet. |
| sanitiser | noun | 消毒潔手液 | Use sanitiser after play. |
| cough | noun | 咳嗽 | Cover a cough. |
| wash | verb | 洗 | Wash before you eat. |
| cover | verb | 掩住 | Cover your cough. |
| sneeze | verb | 打噴嚏 | Sneeze into a tissue. |
| wipe | verb | 擦 | Wipe the table clean. |
| stay | verb | 留在 | Stay at home if sick. |
| sick | adjective | 生病 | I am sick today. |
| well | adjective | 安好 | I am well again. |
| clean | adjective | 清潔 | Keep your desk clean. |
| better | adjective | 較好 | I feel better now. |
| weak | adjective | 虛弱 | I feel weak with flu. |
| away | adverb | 掉 | Wash the germs away. |


#### Middle (P3–P4) — `health_hygiene` (noun 12 · verb 4 · adjective 6 · adverb 1 · phrase 1)

| en | pos | zhHant | example |
|----|-----|--------|---------|
| clinic | noun | 診所 | Go to the clinic. |
| medicine | noun | 藥物 | Take your medicine. |
| pharmacy | noun | 藥房 | Get medicine at the pharmacy. |
| injection | noun | 注射 | The injection is quick. |
| tablet | noun | 藥片 | Swallow the tablet. |
| syrup | noun | 藥糖漿 | The syrup tastes sweet. |
| prescription | noun | 處方 | The doctor writes a prescription. |
| check-up | noun | 健康檢查 | I have a check-up today. |
| ambulance | noun | 救護車 | The ambulance is fast. |
| vitamin | noun | 維他命 | Vitamins help your health. |
| wound | noun | 傷口 | Clean the wound. |
| allergy | noun | 過敏 | She has a dust allergy. |
| swallow | verb | 吞下 | Swallow the tablet with water. |
| heal | verb | 癒合 | The wound will heal. |
| prescribe | verb | 開處方 | Doctors prescribe medicine. |
| visit | verb | 到訪 | Visit the clinic today. |
| healthy | adjective | 健康 | Fruit is healthy. |
| unwell | adjective | 不適 | I feel unwell. |
| painful | adjective | 疼痛 | The wound is painful. |
| contagious | adjective | 傳染 | Flu can be contagious. |
| serious | adjective | 嚴重 | A high fever can be serious. |
| allergic | adjective | 過敏 | He is allergic to nuts. |
| properly | adverb | 正確地 | Wash your hands properly. |
| get better | phrase | 好轉 | I will get better soon. |


#### Senior (P5–P6) — `health_hygiene` (noun 10 · verb 4 · adjective 6 · adverb 2 · phrase 2)

| en | pos | zhHant | example |
|----|-----|--------|---------|
| symptom | noun | 症狀 | Fever is a symptom. |
| prevention | noun | 預防 | Handwashing is prevention. |
| hygiene | noun | 衞生 | Good hygiene stops germs. |
| vaccine | noun | 疫苗 | The vaccine protects us. |
| immunity | noun | 免疫力 | Sleep helps immunity. |
| infection | noun | 感染 | Clean cuts to stop infection. |
| treatment | noun | 治療 | The treatment is rest. |
| recovery | noun | 康復 | Recovery takes time. |
| bacteria | noun | 細菌 | Bacteria can cause illness. |
| virus | noun | 病毒 | A virus can spread. |
| prevent | verb | 預防 | Masks prevent the spread. |
| vaccinate | verb | 接種疫苗 | Clinics vaccinate children. |
| spread | verb | 傳播 | Germs spread quickly. |
| diagnose | verb | 診斷 | Doctors diagnose the illness. |
| preventive | adjective | 預防性 | Handwashing is preventive. |
| infectious | adjective | 傳染性 | The flu is infectious. |
| immune | adjective | 有免疫力 | Vaccines help you stay immune. |
| hygienic | adjective | 合乎衞生 | Keep the kitchen hygienic. |
| physical | adjective | 身體上 | Physical health needs rest. |
| mental | adjective | 心理 | Mental health matters too. |
| thoroughly | adverb | 徹底地 | Wash thoroughly after play. |
| promptly | adverb | 及時地 | See a doctor promptly. |
| build up | phrase | 增強 | Build up your immunity. |
| stay healthy | phrase | 保持健康 | Exercise to stay healthy. |


### 9.6 `safety_rules` — Safety & Rules（安全規則）

**Spiral:** junior stop / look / helmet / careful → middle crossing / emergency / stranger → senior hazard / evacuate / first aid

**Boundary:** Rules, road sense, fire/online safety and first aid. No vehicle types as headwords (`bus`, `car`, `MTR`, `taxi`, … stay in `transport`). `helmet` / `seat belt` are safety gear.


#### Junior (P1–P2) — `safety_rules` (noun 13 · verb 5 · adjective 5 · adverb 1 · phrase 0)

| en | pos | zhHant | example |
|----|-----|--------|---------|
| helmet | noun | 頭盔 | Wear a helmet. |
| traffic light | noun | 交通燈 | Wait at the traffic light. |
| pavement | noun | 行人路 | Walk on the pavement. |
| kerb | noun | 路緣石 | Stop at the kerb. |
| rule | noun | 規則 | Follow the safety rule. |
| adult | noun | 成人 | Hold an adult's hand. |
| fire | noun | 火 | Never play with fire. |
| smoke | noun | 煙 | Leave if you see smoke. |
| exit | noun | 出口 | Know the exit. |
| seat belt | noun | 安全帶 | Click the seat belt. |
| whistle | noun | 哨子 | Blow the whistle for help. |
| fence | noun | 圍欄 | Do not climb the fence. |
| gate | noun | 大門 | Close the gate. |
| stop | verb | 停下 | Stop at the red light. |
| look | verb | 看 | Look both ways. |
| wait | verb | 等候 | Wait for the green light. |
| hold | verb | 握住 | Hold an adult's hand. |
| follow | verb | 遵守 | Follow the rules. |
| careful | adjective | 小心 | Be careful near the road. |
| safe | adjective | 安全 | The pavement is safe. |
| slippery | adjective | 滑 | Wet floors are slippery. |
| sharp | adjective | 鋒利 | Knives are sharp. |
| unsafe | adjective | 不安全 | Playing with fire is unsafe. |
| never | adverb | 絕不 | Never play with fire. |


#### Middle (P3–P4) — `safety_rules` (noun 12 · verb 4 · adjective 6 · adverb 1 · phrase 1)

| en | pos | zhHant | example |
|----|-----|--------|---------|
| crossing | noun | 行人過路線 | Use the crossing. |
| emergency | noun | 緊急情況 | Call in an emergency. |
| stranger | noun | 陌生人 | Do not follow a stranger. |
| password | noun | 密碼 | Keep your password secret. |
| fire exit | noun | 火警出口 | Run to the fire exit. |
| assembly point | noun | 集合點 | Wait at the assembly point. |
| siren | noun | 警號 | A siren means danger. |
| lock | noun | 鎖 | Use the lock at night. |
| smoke detector | noun | 煙霧警報器 | Test the smoke detector. |
| fire drill | noun | 火警演習 | We have a fire drill. |
| emergency number | noun | 緊急電話 | 999 is the emergency number. |
| lifeguard | noun | 救生員 | Listen to the lifeguard. |
| cross | verb | 橫過 | Cross at the green light. |
| knock | verb | 敲 | Knock before you enter. |
| warn | verb | 警告 | Signs warn us of danger. |
| escape | verb | 逃生 | Escape through the exit. |
| unknown | adjective | 不明 | Do not click unknown links. |
| personal | adjective | 個人 | Keep personal information private. |
| online | adjective | 網上 | Be careful with online friends. |
| locked | adjective | 已鎖上 | Keep the door locked. |
| risky | adjective | 有風險 | Shortcuts can be risky. |
| suspicious | adjective | 可疑 | Tell an adult about suspicious people. |
| immediately | adverb | 立刻 | Leave immediately if there is fire. |
| stay away | phrase | 遠離 | Stay away from strangers. |


#### Senior (P5–P6) — `safety_rules` (noun 10 · verb 4 · adjective 6 · adverb 2 · phrase 2)

| en | pos | zhHant | example |
|----|-----|--------|---------|
| hazard | noun | 危險物 | Water on the floor is a hazard. |
| first aid | noun | 急救 | Learn first aid at school. |
| evacuation | noun | 疏散 | Evacuation must be quick. |
| procedure | noun | 程序 | Follow the safety procedure. |
| equipment | noun | 裝備 | Wear safety equipment. |
| risk | noun | 風險 | Running in corridors is a risk. |
| precaution | noun | 預防措施 | A lock is a precaution. |
| instruction | noun | 指示 | Read the safety instruction. |
| extinguisher | noun | 滅火筒 | Know where the extinguisher is. |
| incident | noun | 事故 | Report the incident. |
| evacuate | verb | 疏散 | We evacuate during the drill. |
| obey | verb | 遵守 | Obey the safety rules. |
| assess | verb | 評估 | Assess the risk first. |
| respond | verb | 回應 | Respond quickly to alarms. |
| hazardous | adjective | 有危害 | Spilled oil is hazardous. |
| mandatory | adjective | 強制 | Helmets are mandatory here. |
| illegal | adjective | 非法 | It is illegal to run a red light. |
| cautious | adjective | 謹慎 | Be cautious near water. |
| potential | adjective | 潛在 | Wet floors are a potential hazard. |
| blocked | adjective | 堵塞 | The exit is blocked. |
| calmly | adverb | 冷靜地 | Walk calmly to the exit. |
| cautiously | adverb | 謹慎地 | Cross the road cautiously. |
| stay calm | phrase | 保持冷靜 | Stay calm in an emergency. |
| keep clear | phrase | 保持暢通 | Keep clear of the exit. |


---

## 10. Totals

| Item | Count |
|------|-------|
| Themes | 6 |
| Bands | 3 |
| Words per theme per band | 24 |
| **Headwords** | **432** |
| Unique `id` | 432 |
| Unique `en` within each theme | 72 × 6 |
| Art files | 0 (deferred) |
| Runtime vocab.json edits | 0 |

When art is commissioned later, the slug is `en` lowercased with spaces/hyphens → underscores (same rule as the 1152 bank). Shared English across themes (old or new) reuses one webp path.

---

## 11. Intentional shared-`en` reuses with the 1152 bank

Prefer-new was the default. The spiral still names some words that already exist; those are **same-sense** reuses so one picture can serve both packs.


| en | new theme (pos) | existing pack(s) | why kept |
|----|-----------------|------------------|----------|
| `deadline` | `time_calendar` (noun) | `school` noun | Spiral senior time; same sense as school. |
| `schedule` | `time_calendar` (noun) | `transport` noun | Spiral senior time; same sense as transport. |
| `punctual` | `time_calendar` (adjective) | `school` adjective, `transport` adjective | Spiral senior time; same sense as school / transport. |
| `breakfast` | `daily_routines` (noun) | `food_drink` noun | Spiral junior routines; meal *event*, not a dish list. |
| `sleep` | `daily_routines` (verb) | `home` verb | Natural junior bedtime pair with get up; same sense as home. |
| `homework` | `daily_routines` (noun) | `school` noun | Spiral middle routines; same sense as school. |
| `chore` | `daily_routines` (noun) | `me_family` noun, `home` noun | Spiral middle routines; same sense as home / me_family. |
| `shop` | `shopping_money` (noun) | `places_community` noun | Spiral junior shopping; same sense as places_community. |
| `buy` | `shopping_money` (verb) | `places_community` verb | Spiral junior shopping; same sense as places_community. |
| `change` | `shopping_money` (noun) | `clothes` verb | Spiral middle shopping (money). Different sense from clothes `change` — see homonym table. |
| `queue` | `shopping_money` (noun) | `places_community` verb | Spiral middle shopping; places_community has the verb; here it is the noun (same 排隊 picture). |
| `affordable` | `shopping_money` (adjective) | `home` adjective | Spiral senior shopping (afford / affordable pair); same sense as home. |
| `teacher` | `jobs_work` (noun) | `school` noun | Spiral junior jobs; same sense as school. |
| `driver` | `jobs_work` (noun) | `transport` noun | Spiral junior jobs; same sense as transport (the person). |
| `cook` | `jobs_work` (noun) | `food_drink` verb | Junior job title; food_drink has the verb. Related kitchen picture can serve both. |
| `drive` | `jobs_work` (verb) | `transport` verb | Paired with driver; same sense as transport. |
| `outdoor` | `jobs_work` (adjective) | `toys_games` adjective, `sports_hobbies` adjective | Farmer / outdoor work; same sense as toys / sports. |
| `responsibility` | `jobs_work` (noun) | `me_family` noun | Spiral senior jobs; same sense as me_family. |
| `wash` | `health_hygiene` (verb) | `food_drink` verb, `clothes` verb | Spiral junior health; same sense as clothes / food_drink. |
| `clean` | `health_hygiene` (adjective) | `school` adjective, `clothes` adjective, `home` verb, `places_community` adjective, `nature_environment` adjective | Natural hygiene adjective; already adj in several 1152 packs. |
| `visit` | `health_hygiene` (verb) | `me_family` verb, `places_community` verb | Clinic visit; same sense as family / places. |
| `healthy` | `health_hygiene` (adjective) | `body_senses` adjective, `food_drink` adjective, `sports_hobbies` adjective, `nature_environment` adjective | Spiral middle health; same sense as body / food / sports / nature. |
| `hygiene` | `health_hygiene` (noun) | `body_senses` noun | Spiral senior health; same sense as body_senses. |
| `helmet` | `safety_rules` (noun) | `transport` noun | Spiral junior safety; same sense as transport. |
| `rule` | `safety_rules` (noun) | `toys_games` noun | Safety rule; same sense as toys_games (follow the rules). |
| `stop` | `safety_rules` (verb) | `transport` noun | Spiral junior safety (halt). Different sense from transport noun 站 — see homonym table. |
| `wait` | `safety_rules` (verb) | `transport` verb | Wait at the light; same sense as transport. |
| `careful` | `safety_rules` (adjective) | `nature_environment` adjective | Spiral junior safety; same sense as nature_environment. |
| `safe` | `safety_rules` (adjective) | `transport` adjective, `places_community` adjective | Core safety adjective; same sense as transport / places. |
| `crossing` | `safety_rules` (noun) | `places_community` noun | Spiral middle safety; same sense as places_community. |
| `evacuate` | `safety_rules` (verb) | `weather_seasons` verb | Spiral senior safety; same sense as weather_seasons. |

### Homonym / art-slug tradeoffs (kept on purpose)

| en | This pack | 1152 sense | Decision |
|----|-----------|------------|----------|
| `stop` | `safety_rules` **verb** “Stop at the red light.” | `transport` **noun** 站 “Wait at the bus stop.” | Spiral names *stop*. Shared slug will need a **safety-hand / red-light** crop, not a bus stop. Flag for art. |
| `change` | `shopping_money` **noun** 找贖 | `clothes` **verb** 換衣服 | Spiral names *change* (money). Shared slug is a real picture clash. Flag for art; do not silently drop the spiral word. |

`free` (not busy) lives only in `time_calendar`. Shopping does **not** reuse `free` (= no cost), so one slug is not forced to mean two things.

`online` is used twice **inside this 432** (`shopping_money` adverb, `safety_rules` adjective) — same computer/phone picture, two grammar skins. Allowed.

---

## 12. Hard tradeoffs

1. **`hour` / `o'clock` / `evening` omitted** from `time_calendar` so junior can hold all 7 weekdays + morning/afternoon/night + clock/calendar + January, and middle can hold eight months + date/week/year/minute. Clock basics are carried by `clock`, `start`, `finish`, `show`, `minute`, `half past`.
2. **`schoolbag` / `bag` not added** to routines even though the spiral says “pack bag”: `bag` is already school junior 書包. The **verb** `pack` carries the beat; examples say “Pack your bag.”
3. **No vehicle types in safety**, so road sense uses `traffic light`, `pavement`, `kerb`, `crossing`, `helmet`, `seat belt` rather than *bus/car/MTR*.
4. **No body-part nouns in health**, so “Brush your teeth / Wash your hands” stay in **examples**, not as headwords. Brushing tools live in `daily_routines` (`toothbrush`, `toothpaste`).
5. **`ambulance` is in health, not safety** — emergency *service* vs vehicle pack. Safety keeps `emergency number` / `siren` instead.
6. **`first aid` is in safety senior**, not health, matching the approved spiral.
7. **Junior shopping avoids food shops as food**: `bookstore`, `stall`, `supermarket`, `mall` — no *bakery bread* headwords.
8. **`mental` (P5–P6)** is included as a gentle well-being adjective (`Mental health matters too.`), matching current HK primary well-being language. It is not a body-part noun.
9. **`tick` not `circle`** for marking a date, so the slug does not collide with the shape noun `circle` in `colours_shapes_numbers`.

---

## 13. Out of scope (this PR)

- Do **not** edit `public/data/vocab.json` or `src/lib/vocab.js`
- Do **not** add webp art or generation batches
- Do **not** rewrite the original 16-theme bank
- Do **not** add the 6 theme ids to the picker / parent grid yet

Next implementation (separate plan): merge JSON → rebuild runtime vocab → theme picker chips → art slugs.

---

## 14. Validation (run on the JSON)

The draft JSON was checked programmatically before this spec was committed:

- count **432**
- unique `id`
- unique `en` within each theme
- every `pos` ∈ noun | verb | adjective | adverb | phrase
- every field non-empty
- `id` matches `{band}-{theme}-{slug}`
- all 12 months present in `time_calendar`
- all 7 weekdays present in junior `time_calendar`
- no `spring` / `summer` / `autumn` / `winter` headwords in `time_calendar`
- no body-part nouns in `health_hygiene`
- no vehicle-type headwords in `safety_rules`
- no dish/food headwords in `shopping_money`
