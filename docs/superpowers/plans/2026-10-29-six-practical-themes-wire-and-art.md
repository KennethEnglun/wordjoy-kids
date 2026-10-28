# Six Practical Themes — Wire + Art Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the approved 432-word six practical-life packs into the WordJoy runtime vocab bank (1152 → **1584**) and run the established ChatGPT 9-up → crop → OneDrive art pipeline.
**Architecture:** Merge PR #2 (1152 runtime) then PR #3 (432 design draft) onto `feat/phaser-fishing-v2`. Concatenate both drafts through an extended `scripts/build-theme-pack-vocab.mjs` into `public/data/vocab.json` and `data/vocab.json`, adding `image` via the shared English slug rule. Extend `THEME_IDS` / `THEME_META` / picker emoji so the six new keys appear after the original 16 in life-timeline order. Emit **54** ChatGPT nine-up batches (6 themes × 3 bands × 3 grids). Crop 402² webp q90 into `public/art/words/{slug}.webp` and overwrite OneDrive; do not invent a new art pipeline.
**Tech Stack:** Vite + vanilla JS (`src/lib/vocab.js`), Playwright (`tests/vocab-bank.spec.js`, `tests/smoke.spec.js`), Node ESM build/batch scripts, Python Pillow (or ImageMagick) crop, ChatGPT web image generation (not Gemini; not Codex for vocab word art), OneDrive `WordJoy/ui/vocab/words/` + `WordJoy/ui/vocab/grids/`.
## Global Constraints
- Runtime entry schema after the wire: `{ id, en, zhHant, example, pos, band, theme, image }` with `image` = `art/words/{slug}.webp`.
- Slug rule (verbatim from PR #2 / DESIGN.md): English lowercased; spaces and hyphens → underscores. Shared English across themes reuses one webp path by design.
- `id` shape from the 432 spec: `{band}-{theme}-{slug}` (already present in the draft JSON; do not rewrite ids).
- Bands: `junior` | `middle` | `senior` with progressive unlock `junior < middle < senior` (unchanged from PR #2).
- Six new theme ids only (no old→new alias map): `time_calendar`, `daily_routines`, `shopping_money`, `jobs_work`, `health_hygiene`, `safety_rules`.
- Totals that every task must preserve: 6 × 3 × 24 = **432** new rows; 1152 + 432 = **1584** runtime rows; 16 + 6 = **22** themes; **54** nine-up batches; expected **400** new unique slugs (431 unique in the 432, minus 31 overlaps with the 964 unique 1152 slugs, plus 1 internal 432 share `online`).
- Unique `id` across 1584. Unique `en` within each of the 22 themes (case-insensitive). Shared `en` across themes is allowed.
- Vocab word art: ChatGPT 圖片生成 teammate via ChatGPT web. Not Gemini. Not Codex. In-game UI/mascot art stays Codex+ASF and is out of scope.
- Crop math (established): source ~1254² → 418 cell → inset 8 → 402 webp quality 90. Write `public/art/words/{slug}.webp`. Upload words (overwrite) to OneDrive `WordJoy/ui/vocab/words/` and grids to `WordJoy/ui/vocab/grids/`.
- Homonym flags from the spec (do not drop the spiral words): `stop` (safety verb vs transport 站) and `change` (money 找贖 vs clothes 換衣服). `online` is shared twice inside the 432 (shopping adverb / safety adjective) — one slug.
- Do not redesign games. Cafe's only theme special-case remains `food_drink`.
- Do not commit ~400 new webps in the wire PR; match the 964-webp handling (local `public/art/words/` + OneDrive; JSON paths land in git).
- British classroom spelling already in the draft (`prioritise`, `sanitiser`, `kerb`, `trolley`) — do not Americanise.
- This plan PR is documentation only. Implementation happens on a later branch after Task 0 merge.

---

## File map (what the implementer will create or modify)

| Path | Role |
|------|------|
| `docs/art/theme-packs-vocab-draft-2026-10-25.json` | Existing 1152 draft (from PR #2). Read-only. |
| `docs/art/theme-packs-six-practical-2026-10-29.json` | Existing 432 draft (from PR #3). Read-only. |
| `scripts/build-theme-pack-vocab.mjs` | Extend to concat both drafts, add `image`, write both runtime JSON copies. |
| `public/data/vocab.json` | Runtime bank served by Vite. **1584** entries. |
| `data/vocab.json` | Byte-identical mirror of `public/data/vocab.json`. |
| `src/lib/vocab.js` | Append 6 ids to `THEME_IDS` + 6 rows to `THEME_META`. No new aliases. |
| `src/screens/themes.js` | Append 6 emoji to the `EMOJI` map. |
| `DESIGN.md` | 16 → 22 themes, 1152 → 1584, list the six packs. |
| `README.md` | MVP count 1152/16 → 1584/22. |
| `tests/vocab-bank.spec.js` | TDD: 1584 rows, 22 theme keys, 528/band, picker count 22. |
| `docs/art/2026-10-29-six-practical-vocab-9up-batches.json` | **54** ChatGPT nine-up batches. |
| `scripts/build-six-practical-9up-batches.mjs` | Generator for the batch JSON (run once, commit output). |
| `scripts/crop-vocab-9up.py` | Task 5 crop runbook script (created during art execution, not the wire PR). |
| `public/art/words/{slug}.webp` | Crop outputs. Local + OneDrive; usually untracked in git. |

`docs/art/2026-10-25-vocab-9up-batches.json` is **not** in this repo on `feat/phaser-fishing-v2`, PR #2, or PR #3. Task 3 therefore uses the schema documented below (one full example object plus a generator).

Hard-coded 16-theme surfaces after PR #2 (must all become 22):

- `src/lib/vocab.js` `THEME_IDS` / `THEME_META`
- `src/screens/themes.js` `EMOJI`
- `tests/vocab-bank.spec.js` `THEMES` + `toHaveCount(16)` + length 1152
- `DESIGN.md` theme list
- `README.md` MVP line
- Parent weekly-theme grid is `Object.entries(THEME_META)` — it updates automatically once `THEME_META` grows. No extra alias map.

---

### Task 0: Merge PR #2 then PR #3 onto the working branch

**Files:** none created. Working tree must contain the 1152 runtime **and** the 432 draft before Task 1.

**Interfaces:**
- Consumes: open PRs `#2` (`cursor/theme-pack-vocab-bank-5f40`) and `#3` (`cursor/six-practical-themes-spec-9c56`), both based on `feat/phaser-fishing-v2`.
- Produces: a working branch that has `public/data/vocab.json` length 1152, `scripts/build-theme-pack-vocab.mjs`, `tests/vocab-bank.spec.js`, `docs/art/theme-packs-six-practical-2026-10-29.json` (432), and `docs/superpowers/specs/2026-10-29-wordjoy-six-practical-themes-design.md`.

- [ ] **Step 1: Confirm both PRs are still open and based on `feat/phaser-fishing-v2`**

```bash
gh pr view 2 --json number,state,baseRefName,headRefName,mergeable,title
gh pr view 3 --json number,state,baseRefName,headRefName,mergeable,title
```

Expected: both `state=OPEN`, both `baseRefName=feat/phaser-fishing-v2`.
- PR #2 head: `cursor/theme-pack-vocab-bank-5f40` — 1152 runtime + `src/lib/vocab.js` junior/middle/senior + 16 themes.
- PR #3 head: `cursor/six-practical-themes-spec-9c56` — spec + 432 draft only.

If either PR already merged, skip that merge and `git pull origin feat/phaser-fishing-v2` instead.

- [ ] **Step 2: Fetch and create the implementation branch**

```bash
git fetch origin feat/phaser-fishing-v2 cursor/theme-pack-vocab-bank-5f40 cursor/six-practical-themes-spec-9c56
git checkout feat/phaser-fishing-v2
git pull origin feat/phaser-fishing-v2
git checkout -b cursor/six-practical-themes-wire-art-<suffix>
```

Use the repo's required branch prefix (`cursor/…`) for the implementation branch. Do not implement on this plan-only branch.

- [ ] **Step 3: Merge PR #2 first (1152 runtime)**

Preferred (when the GitHub merge button is allowed):

```bash
gh pr merge 2 --merge --subject "Merge PR #2: wire 1152-word theme-pack bank"
git checkout feat/phaser-fishing-v2
git pull origin feat/phaser-fishing-v2
git checkout cursor/six-practical-themes-wire-art-<suffix>
git merge origin/feat/phaser-fishing-v2
```

Fallback if `gh pr merge` is blocked (no write, required reviews). Merge the PR branch locally into the implementation branch — do not wait:

```bash
git merge --no-ff origin/cursor/theme-pack-vocab-bank-5f40 -m "merge: PR #2 1152-word theme-pack runtime"
```

Expected: merge succeeds. File overlap with current `feat/phaser-fishing-v2` is the vocab/UI set listed in PR #2 (`public/data/vocab.json`, `data/vocab.json`, `src/lib/vocab.js`, screens, tests). Those files currently still have the 102-word demo bank on `feat/phaser-fishing-v2`, so the merge is "theirs" (PR #2) and should not be a content conflict.

- [ ] **Step 4: Merge PR #3 second (spec + 432 draft)**

Preferred:

```bash
gh pr merge 3 --merge --subject "Merge PR #3: six practical themes design draft"
git checkout feat/phaser-fishing-v2
git pull origin feat/phaser-fishing-v2
git checkout cursor/six-practical-themes-wire-art-<suffix>
git merge origin/feat/phaser-fishing-v2
```

Fallback:

```bash
git merge --no-ff origin/cursor/six-practical-themes-spec-9c56 -m "merge: PR #3 six practical themes 432-headword draft"
```

PR #3 adds only two new files:

- `docs/art/theme-packs-six-practical-2026-10-29.json`
- `docs/superpowers/specs/2026-10-29-wordjoy-six-practical-themes-design.md`

Those paths are not in PR #2. Expected: clean merge.

- [ ] **Step 5: If a docs-only conflict appears, resolve it this way**

Same-path conflicts are not expected. If `feat/phaser-fishing-v2` moved and Git reports conflicts:

| Path | Keep |
|------|------|
| `docs/art/theme-packs-six-practical-2026-10-29.json` | PR #3 (`theirs` if merging #3 onto the working branch) |
| `docs/superpowers/specs/2026-10-29-wordjoy-six-practical-themes-design.md` | PR #3 |
| `docs/art/theme-packs-vocab-draft-2026-10-25.json` | PR #2 |
| `DESIGN.md` | PR #2 vocab section (16 themes / 1152 / `image` slug). Re-apply any fishing-v2 notes from the base if they sat in the same hunk. |
| `public/data/vocab.json`, `data/vocab.json`, `src/lib/vocab.js`, `tests/vocab-bank.spec.js` | PR #2 (never the 102-word demo) |

```bash
# example: conflict only in DESIGN.md
git checkout --ours DESIGN.md    # if "ours" is the 1152 branch during merge of #3
# then re-read the file; #3 does not edit DESIGN.md, so this should be a no-op
git add DESIGN.md
git merge --continue
```

Do not hand-edit the 432 JSON during conflict resolution.

- [ ] **Step 6: Sanity-check the merged tree**

```bash
python3 - <<'PY'
import json
from pathlib import Path
bank = json.loads(Path('public/data/vocab.json').read_text())
mirror = json.loads(Path('data/vocab.json').read_text())
draft = json.loads(Path('docs/art/theme-packs-vocab-draft-2026-10-25.json').read_text())
six = json.loads(Path('docs/art/theme-packs-six-practical-2026-10-29.json').read_text())
assert bank == mirror
assert len(bank) == 1152
assert len(draft) == 1152
assert len(six) == 432
assert set(w['theme'] for w in bank).__len__() == 16
assert sorted({w['theme'] for w in six}) == [
    'daily_routines','health_hygiene','jobs_work',
    'safety_rules','shopping_money','time_calendar']
print('ok: 1152 runtime + 432 draft present')
PY
test -f src/lib/vocab.js && test -f tests/vocab-bank.spec.js && test -f scripts/build-theme-pack-vocab.mjs
npx playwright test tests/vocab-bank.spec.js --reporter=list
```

Expected: Python prints `ok: 1152 runtime + 432 draft present`. Playwright: 2 passed (1152 schema + 16-theme picker). If the 1152 tests fail, stop — do not start Task 1.

- [ ] **Step 7: Commit the merge (only if the local-merge fallback was used)**

```bash
git status
# if merge commits already exist from Steps 3–4, skip
git log --oneline -5
```

No extra commit if `git merge` already created merge commits.

---

### Task 1: Append 432 into vocab.json (TDD)

**Files:**
- Modify: `tests/vocab-bank.spec.js`
- Modify: `scripts/build-theme-pack-vocab.mjs`
- Modify: `public/data/vocab.json` (regenerated)
- Modify: `data/vocab.json` (regenerated)
- Test: `tests/vocab-bank.spec.js`

**Interfaces:**
- Consumes: `docs/art/theme-packs-vocab-draft-2026-10-25.json` (1152, no `image`) and `docs/art/theme-packs-six-practical-2026-10-29.json` (432, no `image`).
- Produces: `public/data/vocab.json` and `data/vocab.json` as a JSON array of 1584 objects `{ id, en, zhHant, example, pos, band, theme, image }`. `image` = `art/words/${slug}.webp` where `slug = en.toLowerCase().replace(/[ -]/g, '_')`.

- [ ] **Step 1: Write the failing schema test (keep the picker at original-16 labels)**

Edit `tests/vocab-bank.spec.js` as follows. Expand `THEMES` to 22 and change the schema test to 1584. Keep the picker test’s original-16 label assertions. Change only `toHaveCount(16)` → `toHaveCount(22)` — after JSON concat, `themesForBand` appends unknown ids as extras, so the count becomes 22 even before Task 2 adds `THEME_META`. Do **not** assert 時間日曆 / Time & Calendar yet (those labels land in Task 2).

```js
import { test, expect } from '@playwright/test'

const BANDS = ['junior', 'middle', 'senior']
const THEMES = [
  'me_family',
  'colours_shapes_numbers',
  'animals_pets',
  'food_drink',
  'school',
  'clothes',
  'body_senses',
  'toys_games',
  'home',
  'weather_seasons',
  'transport',
  'places_community',
  'sports_hobbies',
  'friends_feelings',
  'festivals',
  'nature_environment',
  'time_calendar',
  'daily_routines',
  'shopping_money',
  'jobs_work',
  'health_hygiene',
  'safety_rules',
]
const NEW_THEMES = THEMES.slice(16)
const OLD_BANDS = ['prek', 'p1', 'p2', 'p3']
const OLD_THEMES = ['family', 'colours', 'numbers', 'animals', 'food', 'body']

function imageSlug(en) {
  return String(en).toLowerCase().replace(/[ -]/g, '_')
}

test('runtime vocab.json is the 1584-word theme-pack bank', async ({ request }) => {
  const res = await request.get('/data/vocab.json')
  expect(res.ok()).toBeTruthy()
  const words = await res.json()
  expect(Array.isArray(words)).toBeTruthy()
  expect(words).toHaveLength(1584)

  const ids = new Set()
  const bands = {}
  const themes = new Set()
  const enByTheme = new Map()
  for (const word of words) {
    expect(word).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        en: expect.any(String),
        zhHant: expect.any(String),
        example: expect.any(String),
        pos: expect.any(String),
        band: expect.any(String),
        theme: expect.any(String),
        image: expect.any(String),
      }),
    )
    expect(Object.keys(word).sort()).toEqual(
      ['band', 'en', 'example', 'id', 'image', 'pos', 'theme', 'zhHant'].sort(),
    )
    expect(word.id.trim()).toBeTruthy()
    expect(word.en.trim()).toBeTruthy()
    expect(word.zhHant.trim()).toBeTruthy()
    expect(word.example.trim()).toBeTruthy()
    expect(word.pos.trim()).toBeTruthy()
    expect(word.image).toBe(`art/words/${imageSlug(word.en)}.webp`)
    expect(BANDS).toContain(word.band)
    expect(THEMES).toContain(word.theme)
    expect(ids.has(word.id)).toBeFalsy()
    ids.add(word.id)
    bands[word.band] = (bands[word.band] || 0) + 1
    themes.add(word.theme)
    const key = word.en.toLowerCase()
    if (!enByTheme.has(word.theme)) enByTheme.set(word.theme, new Set())
    expect(enByTheme.get(word.theme).has(key)).toBeFalsy()
    enByTheme.get(word.theme).add(key)
  }

  expect(bands).toEqual({ junior: 528, middle: 528, senior: 528 })
  expect([...themes].sort()).toEqual([...THEMES].sort())
  expect(NEW_THEMES.every((t) => themes.has(t))).toBeTruthy()
  expect(words.filter((w) => NEW_THEMES.includes(w.theme))).toHaveLength(432)
  expect(words.some((w) => OLD_BANDS.includes(w.band))).toBeFalsy()
  expect(words.some((w) => OLD_THEMES.includes(w.theme))).toBeFalsy()
})

test('adventure chips and theme picker use junior/middle/senior packs', async ({ page }) => {
  await page.goto('/#/adventure/junior')
  await expect(page.getByRole('heading', { name: /冒險地圖/ })).toBeVisible()
  await expect(page.getByRole('button', { name: '初小', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '中小', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '高小', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '學前', exact: true })).toHaveCount(0)

  await page.goto('/#/themes/junior')
  await expect(page.getByText(/揀主題/)).toBeVisible()
  await expect(page.locator('button.card-btn')).toHaveCount(22)
  await expect(page.getByRole('button', { name: /我同家人|Me & Family/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /節日|Festivals/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /大自然|Nature/i })).toBeVisible()
})
```

- [ ] **Step 2: Run the test and confirm it fails on count**

```bash
npx playwright test tests/vocab-bank.spec.js --reporter=list
```

Expected: FAIL. Schema test still sees 1152 (`Expected 1584, received 1152`). Picker `toHaveCount(22)` still sees 16 cards. Do not implement until this failure is observed.

- [ ] **Step 3: Extend the build script to concat both drafts**

Replace `scripts/build-theme-pack-vocab.mjs` with:

```js
/**
 * Build public/data/vocab.json (and data/vocab.json) from the theme-pack drafts.
 * Usage: node scripts/build-theme-pack-vocab.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const drafts = [
  { path: join(root, 'docs/art/theme-packs-vocab-draft-2026-10-25.json'), expected: 1152 },
  { path: join(root, 'docs/art/theme-packs-six-practical-2026-10-29.json'), expected: 432 },
]
const outputs = [join(root, 'public/data/vocab.json'), join(root, 'data/vocab.json')]
const TOTAL = 1584

function imageSlug(en) {
  return String(en).toLowerCase().replace(/[ -]/g, '_')
}

const combined = []
for (const draft of drafts) {
  const rows = JSON.parse(readFileSync(draft.path, 'utf8'))
  if (!Array.isArray(rows) || rows.length !== draft.expected) {
    throw new Error(
      `Expected ${draft.expected} entries in ${draft.path}, got ${Array.isArray(rows) ? rows.length : typeof rows}`,
    )
  }
  combined.push(...rows)
}
if (combined.length !== TOTAL) {
  throw new Error(`Expected ${TOTAL} combined entries, got ${combined.length}`)
}

const ids = new Set()
const enByTheme = new Map()
const words = combined.map((word) => {
  if (ids.has(word.id)) throw new Error(`Duplicate id: ${word.id}`)
  ids.add(word.id)
  const key = String(word.en).toLowerCase()
  if (!enByTheme.has(word.theme)) enByTheme.set(word.theme, new Set())
  if (enByTheme.get(word.theme).has(key)) {
    throw new Error(`Duplicate en "${word.en}" in theme ${word.theme}`)
  }
  enByTheme.get(word.theme).add(key)
  return {
    id: word.id,
    en: word.en,
    zhHant: word.zhHant,
    example: word.example,
    pos: word.pos,
    band: word.band,
    theme: word.theme,
    image: `art/words/${imageSlug(word.en)}.webp`,
  }
})

const json = `${JSON.stringify(words, null, 2)}\n`
for (const out of outputs) writeFileSync(out, json)
console.log(`Wrote ${words.length} entries to ${outputs.join(' and ')}`)
```

- [ ] **Step 4: Run the builder**

```bash
node scripts/build-theme-pack-vocab.mjs
python3 - <<'PY'
import json, pathlib
a=json.loads(pathlib.Path('public/data/vocab.json').read_text())
b=json.loads(pathlib.Path('data/vocab.json').read_text())
assert a==b and len(a)==1584
print(a[0]['image'], a[-1]['id'], a[-1]['image'])
print('themes', sorted({w['theme'] for w in a}))
PY
```

Expected stdout:

```
Wrote 1584 entries to .../public/data/vocab.json and .../data/vocab.json
art/words/mom.webp senior-safety_rules-keep_clear art/words/keep_clear.webp
themes [..., 'safety_rules', 'shopping_money', 'time_calendar', ...]
```

First 1152 rows stay in original 16-theme order. The 432 append in spec order: `time_calendar` → `daily_routines` → `shopping_money` → `jobs_work` → `health_hygiene` → `safety_rules`, each junior/middle/senior. Last id is `senior-safety_rules-keep_clear`.

- [ ] **Step 5: Re-run vocab-bank tests — both must pass before the commit**

```bash
npx playwright test tests/vocab-bank.spec.js --reporter=list
```

Expected: both tests **PASS**. Schema is 1584. Picker count is 22 because `themesForBand` concatenates theme ids that are in the JSON but not yet in `THEME_IDS`; those six cards render with fallback `{ zh: id, en: id }` and emoji `⭐`. Chinese labels are Task 2.

- [ ] **Step 6: Commit the wire JSON**

```bash
git add tests/vocab-bank.spec.js scripts/build-theme-pack-vocab.mjs public/data/vocab.json data/vocab.json
git commit -m "feat(vocab): append 432 practical-life words (1152 → 1584)"
```

---

### Task 2: Update vocab.js + UI meta

**Files:**
- Modify: `src/lib/vocab.js` (`THEME_IDS` after line 40, `THEME_META` after `nature_environment`)
- Modify: `src/screens/themes.js` (`EMOJI` map)
- Modify: `DESIGN.md` (theme modules section)
- Modify: `README.md` (MVP count line)
- Test: `tests/vocab-bank.spec.js` (picker labels + new-theme play route)

**Interfaces:**
- Consumes: `THEME_IDS` / `THEME_META` as left by PR #2 (16 keys). `themesForBand(words, band)` returns `THEME_IDS.filter(t => set.has(t))` then any extras.
- Produces: 22 keys. Picker order = original 16, then life-timeline six: `time_calendar`, `daily_routines`, `shopping_money`, `jobs_work`, `health_hygiene`, `safety_rules`. Labels match the design spec §4. `resolveTheme` needs no new aliases (these keys never existed).

- [ ] **Step 1: Write the failing picker-label + play-route tests**

In `tests/vocab-bank.spec.js`, append these assertions to the existing picker test (after the Nature button assertion) and add the play-route test at the bottom of the file. Do not rewrite the schema test.

```js
  await expect(page.getByRole('button', { name: /時間日曆|Time & Calendar/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /日常作息|Daily Routines/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /購物金錢|Shopping & Money/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /職業工作|Jobs & Work/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /健康衛生|Health & Hygiene/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /安全規則|Safety & Rules/i })).toBeVisible()
  await expect(page.locator('button.card-btn').filter({ hasText: 'time_calendar' })).toHaveCount(0)
```

```js
test('junior time_calendar pic match loads a round', async ({ page }) => {
  await page.goto('/#/play/junior/time_calendar/pic_match')
  await expect(page.getByRole('button', { name: '記憶卡，未翻開' }).first()).toBeVisible({
    timeout: 10000,
  })
})
```

Run:

```bash
npx playwright test tests/vocab-bank.spec.js --reporter=list
```

Expected: FAIL. Cards still show raw ids (`time_calendar`) and ⭐, so `/時間日曆|Time & Calendar/` is missing. The play-route test should already pass from Task 1 JSON (Pic Match only needs words, not `THEME_META`); if it fails with “呢個主題暫時未有字”, stop and inspect `filterByBandTheme`. Do not add `THEME_META` until the label failure is observed.

- [ ] **Step 2: Confirm the leftover 16-theme hardcodes**

```bash
rg -n "THEME_IDS|THEME_META|toHaveCount|1152|16 packs|16 主題" src tests DESIGN.md README.md scripts
```

Expected hits to change: `src/lib/vocab.js`, `src/screens/themes.js`, `DESIGN.md`, `README.md`. `cafeOrder.js` `food_drink` stays. `LEGACY_THEME` stays as the old-nine remap from PR #2 — do not add six-theme aliases.

- [ ] **Step 3: Append the six ids and meta in `src/lib/vocab.js`**

In `THEME_IDS`, after `'nature_environment',` add:

```js
  'time_calendar',
  'daily_routines',
  'shopping_money',
  'jobs_work',
  'health_hygiene',
  'safety_rules',
```

In `THEME_META`, after the `nature_environment` row, add (labels copied from spec §4):

```js
  time_calendar: { zh: '時間日曆', en: 'Time & Calendar', hint: '貼近香港小學常見單元' },
  daily_routines: { zh: '日常作息', en: 'Daily Routines', hint: '貼近香港小學常見單元' },
  shopping_money: { zh: '購物金錢', en: 'Shopping & Money', hint: '貼近香港小學常見單元' },
  jobs_work: { zh: '職業工作', en: 'Jobs & Work', hint: '貼近香港小學常見單元' },
  health_hygiene: { zh: '健康衛生', en: 'Health & Hygiene', hint: '貼近香港小學常見單元' },
  safety_rules: { zh: '安全規則', en: 'Safety & Rules', hint: '貼近香港小學常見單元' },
```

Do not touch `LEGACY_BAND`, `LEGACY_THEME`, `BAND_META`, or `filterByBandTheme`. Parent weekly-theme buttons iterate `Object.entries(THEME_META)`, so they pick up the six keys in this same order.

- [ ] **Step 4: Append emoji in `src/screens/themes.js`**

After `nature_environment: '🌳',` add:

```js
  time_calendar: '📅',
  daily_routines: '⏰',
  shopping_money: '🛒',
  jobs_work: '💼',
  health_hygiene: '🧼',
  safety_rules: '🚦',
```

Missing keys would render `⭐` (existing fallback). Do not leave them on the fallback.

- [ ] **Step 5: Update DESIGN.md theme-modules section**

Replace the 16-pack intro sentence and list so it reads:

```markdown
## Theme modules (KS1-aligned, original lists)
Runtime ids (22 packs × 24 words × 3 bands = **1584** entries):

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
17. `time_calendar` — Time & Calendar（時間日曆）
18. `daily_routines` — Daily Routines（日常作息）
19. `shopping_money` — Shopping & Money（購物金錢）
20. `jobs_work` — Jobs & Work（職業工作）
21. `health_hygiene` — Health & Hygiene（健康衛生）
22. `safety_rules` — Safety & Rules（安全規則）
```

Also change the earlier sentence `the same 16 themes appear in every band` to `the same 22 themes appear in every band`.

Keep the `image` slug paragraph. Add under source drafts:

```markdown
Source drafts: `docs/art/theme-packs-vocab-draft-2026-10-25.json` (1152) and `docs/art/theme-packs-six-practical-2026-10-29.json` (432). Runtime copies: `public/data/vocab.json` and `data/vocab.json`. WebP art files are synced separately; JSON paths are wired even when a crop is not in git yet.
```

- [ ] **Step 6: Update README.md MVP line**

Replace:

```markdown
- 1152 原創詞（16 主題 × 初小／中小／高小）；Joy 吉祥物；複習袋；多小朋友檔 + 家長 PIN；連續日數
```

with:

```markdown
- 1584 原創詞（22 主題 × 初小／中小／高小）；Joy 吉祥物；複習袋；多小朋友檔 + 家長 PIN；連續日數
```

- [ ] **Step 7: Run Playwright — vocab-bank (now 3 tests) and smoke must pass**

```bash
npx playwright test tests/vocab-bank.spec.js tests/smoke.spec.js --reporter=list
```

Expected: vocab-bank 3 passed (1584 schema, 22 labelled picker cards, junior `time_calendar` Pic Match round); smoke suite passed (PR #2 already rewrote smoke to `junior` / `me_family` / `animals_pets` / `food_drink`). Missing webps show broken images until Task 5; that is acceptable for the wire PR.

- [ ] **Step 8: Commit UI meta**

```bash
git add src/lib/vocab.js src/screens/themes.js DESIGN.md README.md tests/vocab-bank.spec.js
git commit -m "feat(vocab): add six practical-life themes to picker meta"
```

---

### Task 3: Art batch file (54 nine-ups)

**Files:**
- Create: `scripts/build-six-practical-9up-batches.mjs`
- Create: `docs/art/2026-10-29-six-practical-vocab-9up-batches.json`

**Interfaces:**
- Consumes: `docs/art/theme-packs-six-practical-2026-10-29.json` in file order (already grouped theme → band → 24 words).
- Produces: one JSON document with `pipeline` + `batches` length **54**. Each theme-band yields 3 batches: slots 1–9, 10–18, 19–24 + 3 blanks on the third grid.

Historical `docs/art/2026-10-25-vocab-9up-batches.json` is **missing** from every current branch. Use this schema (locked here so ChatGPT 圖片生成 and the crop script share names).

#### Schema

```json
{
  "pipeline": {
    "date": "2026-10-29",
    "grid": "3x3",
    "expectedSourcePx": 1254,
    "cellPx": 418,
    "insetPx": 8,
    "outputPx": 402,
    "format": "webp",
    "quality": 90,
    "slugRule": "en lowercased; spaces and hyphens → underscores",
    "wordsDir": "public/art/words",
    "onedriveWords": "WordJoy/ui/vocab/words/",
    "onedriveGrids": "WordJoy/ui/vocab/grids/",
    "generator": "ChatGPT web (圖片生成 teammate). Not Gemini. Not Codex."
  },
  "batches": [ /* 54 objects */ ]
}
```

Full example — first junior `time_calendar` batch (words 1–9) and the third batch (words 19–24 + blanks). Slot numbering is 1-based row-major: slot 1 = r0c0, slot 9 = r2c2.

```json
{
  "id": "time_calendar-junior-01",
  "theme": "time_calendar",
  "band": "junior",
  "batch": 1,
  "batchCount": 3,
  "title": "time_calendar / junior / batch 1 of 3",
  "onedriveGrid": "WordJoy/ui/vocab/grids/2026-10-29-time_calendar-junior-01.png",
  "slots": [
    { "slot": 1, "row": 0, "col": 0, "blank": false, "en": "Monday", "slug": "monday", "id": "junior-time_calendar-monday", "zhHant": "星期一" },
    { "slot": 2, "row": 0, "col": 1, "blank": false, "en": "Tuesday", "slug": "tuesday", "id": "junior-time_calendar-tuesday", "zhHant": "星期二" },
    { "slot": 3, "row": 0, "col": 2, "blank": false, "en": "Wednesday", "slug": "wednesday", "id": "junior-time_calendar-wednesday", "zhHant": "星期三" },
    { "slot": 4, "row": 1, "col": 0, "blank": false, "en": "Thursday", "slug": "thursday", "id": "junior-time_calendar-thursday", "zhHant": "星期四" },
    { "slot": 5, "row": 1, "col": 1, "blank": false, "en": "Friday", "slug": "friday", "id": "junior-time_calendar-friday", "zhHant": "星期五" },
    { "slot": 6, "row": 1, "col": 2, "blank": false, "en": "Saturday", "slug": "saturday", "id": "junior-time_calendar-saturday", "zhHant": "星期六" },
    { "slot": 7, "row": 2, "col": 0, "blank": false, "en": "Sunday", "slug": "sunday", "id": "junior-time_calendar-sunday", "zhHant": "星期日" },
    { "slot": 8, "row": 2, "col": 1, "blank": false, "en": "morning", "slug": "morning", "id": "junior-time_calendar-morning", "zhHant": "早上" },
    { "slot": 9, "row": 2, "col": 2, "blank": false, "en": "afternoon", "slug": "afternoon", "id": "junior-time_calendar-afternoon", "zhHant": "下午" }
  ]
}
```

Batch 3 of the same theme-band (slots 7–9 blank):

```json
{
  "id": "time_calendar-junior-03",
  "theme": "time_calendar",
  "band": "junior",
  "batch": 3,
  "batchCount": 3,
  "title": "time_calendar / junior / batch 3 of 3",
  "onedriveGrid": "WordJoy/ui/vocab/grids/2026-10-29-time_calendar-junior-03.png",
  "slots": [
    { "slot": 1, "row": 0, "col": 0, "blank": false, "en": "first", "slug": "first", "id": "junior-time_calendar-first", "zhHant": "第一" },
    { "slot": 2, "row": 0, "col": 1, "blank": false, "en": "last", "slug": "last", "id": "junior-time_calendar-last", "zhHant": "最後" },
    { "slot": 3, "row": 0, "col": 2, "blank": false, "en": "next", "slug": "next", "id": "junior-time_calendar-next", "zhHant": "下一個" },
    { "slot": 4, "row": 1, "col": 0, "blank": false, "en": "daily", "slug": "daily", "id": "junior-time_calendar-daily", "zhHant": "每日" },
    { "slot": 5, "row": 1, "col": 1, "blank": false, "en": "free", "slug": "free", "id": "junior-time_calendar-free", "zhHant": "空閒" },
    { "slot": 6, "row": 1, "col": 2, "blank": false, "en": "today", "slug": "today", "id": "junior-time_calendar-today", "zhHant": "今天" },
    { "slot": 7, "row": 2, "col": 0, "blank": true, "en": null, "slug": null, "id": null, "zhHant": null },
    { "slot": 8, "row": 2, "col": 1, "blank": true, "en": null, "slug": null, "id": null, "zhHant": null },
    { "slot": 9, "row": 2, "col": 2, "blank": true, "en": null, "slug": null, "id": null, "zhHant": null }
  ]
}
```

- [ ] **Step 1: Write the generator**

Create `scripts/build-six-practical-9up-batches.mjs`:

```js
/**
 * Build docs/art/2026-10-29-six-practical-vocab-9up-batches.json
 * Usage: node scripts/build-six-practical-9up-batches.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = join(root, 'docs/art/theme-packs-six-practical-2026-10-29.json')
const out = join(root, 'docs/art/2026-10-29-six-practical-vocab-9up-batches.json')
const THEME_ORDER = [
  'time_calendar',
  'daily_routines',
  'shopping_money',
  'jobs_work',
  'health_hygiene',
  'safety_rules',
]
const BAND_ORDER = ['junior', 'middle', 'senior']

function imageSlug(en) {
  return String(en).toLowerCase().replace(/[ -]/g, '_')
}

const words = JSON.parse(readFileSync(src, 'utf8'))
if (!Array.isArray(words) || words.length !== 432) {
  throw new Error(`Expected 432 draft entries, got ${Array.isArray(words) ? words.length : typeof words}`)
}

const groups = new Map()
for (const word of words) {
  const key = `${word.theme}:${word.band}`
  if (!groups.has(key)) groups.set(key, [])
  groups.get(key).push(word)
}

const batches = []
for (const theme of THEME_ORDER) {
  for (const band of BAND_ORDER) {
    const group = groups.get(`${theme}:${band}`) || []
    if (group.length !== 24) {
      throw new Error(`${theme}/${band} has ${group.length} words, expected 24`)
    }
    for (let batch = 1; batch <= 3; batch += 1) {
      const start = (batch - 1) * 9
      const slice = group.slice(start, start + 9)
      const id = `${theme}-${band}-${String(batch).padStart(2, '0')}`
      const slots = []
      for (let i = 0; i < 9; i += 1) {
        const row = Math.floor(i / 3)
        const col = i % 3
        const word = slice[i]
        if (!word) {
          slots.push({
            slot: i + 1, row, col, blank: true,
            en: null, slug: null, id: null, zhHant: null,
          })
        } else {
          slots.push({
            slot: i + 1, row, col, blank: false,
            en: word.en, slug: imageSlug(word.en),
            id: word.id, zhHant: word.zhHant,
          })
        }
      }
      const blankCount = slots.filter((s) => s.blank).length
      if (batch < 3 && blankCount !== 0) throw new Error(`${id} unexpectedly has blanks`)
      if (batch === 3 && blankCount !== 3) throw new Error(`${id} expected 3 blanks, got ${blankCount}`)
      batches.push({
        id,
        theme,
        band,
        batch,
        batchCount: 3,
        title: `${theme} / ${band} / batch ${batch} of 3`,
        onedriveGrid: `WordJoy/ui/vocab/grids/2026-10-29-${id}.png`,
        slots,
      })
    }
  }
}

if (batches.length !== 54) throw new Error(`Expected 54 batches, got ${batches.length}`)

const doc = {
  pipeline: {
    date: '2026-10-29',
    grid: '3x3',
    expectedSourcePx: 1254,
    cellPx: 418,
    insetPx: 8,
    outputPx: 402,
    format: 'webp',
    quality: 90,
    slugRule: 'en lowercased; spaces and hyphens → underscores',
    wordsDir: 'public/art/words',
    onedriveWords: 'WordJoy/ui/vocab/words/',
    onedriveGrids: 'WordJoy/ui/vocab/grids/',
    generator: 'ChatGPT web (圖片生成 teammate). Not Gemini. Not Codex.',
  },
  batches,
}

writeFileSync(out, `${JSON.stringify(doc, null, 2)}\n`)
console.log(`Wrote ${batches.length} batches to ${out}`)
```

- [ ] **Step 2: Run the generator and verify 54 / blanks / first-last**

```bash
node scripts/build-six-practical-9up-batches.mjs
python3 - <<'PY'
import json
from pathlib import Path
doc = json.loads(Path('docs/art/2026-10-29-six-practical-vocab-9up-batches.json').read_text())
assert len(doc['batches']) == 54
assert doc['pipeline']['cellPx'] == 418
assert doc['pipeline']['insetPx'] == 8
assert doc['pipeline']['outputPx'] == 402
b0 = doc['batches'][0]
assert b0['id'] == 'time_calendar-junior-01'
assert [s['slug'] for s in b0['slots']] == [
    'monday','tuesday','wednesday','thursday','friday','saturday','sunday','morning','afternoon']
b2 = doc['batches'][2]
assert b2['id'] == 'time_calendar-junior-03'
assert [s['blank'] for s in b2['slots']] == [False]*6 + [True]*3
assert doc['batches'][-1]['id'] == 'safety_rules-senior-03'
filled = sum(1 for b in doc['batches'] for s in b['slots'] if not s['blank'])
blanks = sum(1 for b in doc['batches'] for s in b['slots'] if s['blank'])
assert filled == 432 and blanks == 54  # 18 third-grids × 3 blanks
print('ok: 54 batches, 432 filled slots, 54 blanks')
PY
```

Expected: `Wrote 54 batches to ...` and `ok: 54 batches, 432 filled slots, 54 blanks`.

- [ ] **Step 3: Commit the batch file**

```bash
git add scripts/build-six-practical-9up-batches.mjs docs/art/2026-10-29-six-practical-vocab-9up-batches.json
git commit -m "docs(art): add 54 nine-up batches for six practical themes"
```

This commit is part of the **wire** PR. ChatGPT generation itself is Task 4 (operational, no code).

---

### Task 4: ChatGPT 圖片生成 handoff checklist (operational — no code)

**Files:** none. Game Developer sends this brief via SendToAgent to teammate **ChatGPT 圖片生成**. Do not send it to Gemini. Do not ask Codex to draw vocab word art.

**Interfaces:**
- Consumes: `docs/art/2026-10-29-six-practical-vocab-9up-batches.json` (54 batches) and this checklist.
- Produces: 54 grid PNGs at OneDrive `WordJoy/ui/vocab/grids/2026-10-29-{theme}-{band}-{nn}.png`. Game Developer crops (Task 5) and acks before the next theme.

#### Start order (pick and keep)

**Junior six themes first, life-timeline order, then middle, then senior.**

1. `junior/time_calendar` (batches 01–03)
2. `junior/daily_routines`
3. `junior/shopping_money`
4. `junior/jobs_work`
5. `junior/health_hygiene`
6. `junior/safety_rules`
7. Repeat 1–6 for `middle`
8. Repeat 1–6 for `senior`

Justification: junior is picture-first and noun-heavy, so grids are easier to QC; finishing all six junior packs unblocks P1–P2 play across the new themes before the abstract senior adjectives/phrases (`punctual`, `prevention`, `hazard`, `well-being`) are drawn; life-timeline order matches approved Approach A.

Do **not** run a theme through all three bands before starting the next theme — that delays a complete junior set.

- [ ] **Step 1: SendToAgent brief (copy verbatim)**

Send all of the following bullets in one message to **ChatGPT 圖片生成**:

- You generate **vocab word art only**. Tool: ChatGPT web image generation. Not Gemini. Not Codex.
- Style: WordJoy existing vocab watercolour — kid-safe, picture-first, cream/paper background, no text, no letters, no watermarks, no brand logos, no mascot 字學貓 (mascot is Codex+ASF and out of scope). One clear object or action per cell. Hong Kong primary classroom vibe (British spellings in the word list are for the Game Developer, not for painting letters).
- Layout: **exactly 3×3**. Nine equal cells. Target source ~**1254×1254** px so each cell is 418. Thin even gutters OK; no big margins; no labels inside cells.
- One **theme-band** at a time (3 grids). Wait for Game Developer crop ack before the next theme.
- Read slots from `docs/art/2026-10-29-six-practical-vocab-9up-batches.json`. Slot 1 = top-left, slot 9 = bottom-right, row-major. `blank: true` cells stay empty cream paper (no doodle, no “blank” text).
- Start: `time_calendar / junior / batch 1 of 3` — Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday, morning, afternoon.
- Deliver each finished grid to OneDrive path in `onedriveGrid`, e.g. `WordJoy/ui/vocab/grids/2026-10-29-time_calendar-junior-01.png`. Overwrite if re-rolling.
- After each theme’s 3 junior grids, ping Game Developer and **stop**. Do not batch all 54 in one go.
- Homonym / shared-slug flags (paint the **new pack** sense; Game Developer decides overwrite in Task 5):
  - `stop` (`safety_rules` junior): red light / halt hand. **Not** a bus stop.
  - `change` (`shopping_money` middle): coins and notes 找贖. **Not** changing clothes.
  - `online` (shopping senior adverb + safety middle adjective): one computer/phone picture serves both.
  - Same-sense overlaps with the 1152 bank (`buy`, `shop`, `teacher`, `driver`, `breakfast`, `homework`, `wash`, `helmet`, …) may reuse the existing picture idea; still draw the cell so the nine-up is complete.
- Kid-safe: no gore, no scare-copy strangers, no brand names (no Octopus card), no real-school logos.

- [ ] **Step 2: First ack gate**

Game Developer does not start `daily_routines` junior until `time_calendar-junior-01/02/03` exist on OneDrive and Task 5 has cropped+verified those 24 slugs (21 unique; none of the first junior time_calendar words overlap the 1152 bank except none in Monday–today — `free` is new). If a grid is not ~square or cells are uneven, reject and re-roll that batch only.

- [ ] **Step 3: Theme-complete gate**

After each theme’s junior trio, run the Task 5 verify one-liner filtered to that theme. Only then send the next theme’s three batch ids.

---

### Task 5: Crop + upload runbook

**Files:**
- Create during art execution (not required in the wire PR): `scripts/crop-vocab-9up.py`
- Write: `public/art/words/{slug}.webp` (local, usually untracked)
- Upload: OneDrive `WordJoy/ui/vocab/words/{slug}.webp` (overwrite) and keep grids in `WordJoy/ui/vocab/grids/`

**Interfaces:**
- Consumes: a nine-up PNG whose `id` matches a batch in `docs/art/2026-10-29-six-practical-vocab-9up-batches.json`.
- Produces: one 402×402 webp q90 per non-blank slot at `public/art/words/{slug}.webp`.

#### Git policy (match the 964)

PR #2 wired 1152 JSON paths and left ~964 webps **out of git** (“many still local-only”; DESIGN.md: “WebP art files are synced separately”). Keep that split:

- **Wire PR:** JSON + `vocab.js` + tests + 54-batch file. No bulk webp commit.
- **Art execution:** local `public/art/words/` + OneDrive overwrite. A later tiny PR may add a coverage manifest if needed; do not dump 400 binaries onto the wire PR.

Existing committed files under `public/art/words/` are the old 102-word demo mix (svg/webp). New crops use **webp only**. Do not delete the old svgs in this work.

#### Homonym overwrite rule

| slug | 1152 sense already on disk | New-pack cell | Default |
|------|----------------------------|---------------|---------|
| `stop` | transport noun 站 (bus stop) | safety verb, red light | **Do not overwrite** until 彭sir confirms. Save the new cell aside as `/tmp/wordjoy-homonyms/stop.webp` and log it. |
| `change` | clothes verb 換衣服 | money 找贖 | Same: park aside, do not silently replace. |
| other 29 overlap slugs | same sense | same sense | Skip overwrite if `public/art/words/{slug}.webp` already exists. |
| `online` | new (not in 1152) | shared twice in 432 | Write once; second batch skips. |

- [ ] **Step 1: Install Pillow if needed**

```bash
python3 -c "from PIL import Image; print('pillow ok')" || pip install pillow
```

Expected: `pillow ok` or a successful pip install.

- [ ] **Step 2: Add `scripts/crop-vocab-9up.py`**

```python
#!/usr/bin/env python3
"""Crop a WordJoy ChatGPT 3x3 nine-up into 402 webp q90 cells.

Usage:
  python3 scripts/crop-vocab-9up.py \\
    --grid /path/to/2026-10-29-time_calendar-junior-01.png \\
    --batch-id time_calendar-junior-01

Reads docs/art/2026-10-29-six-practical-vocab-9up-batches.json.
Writes public/art/words/{slug}.webp unless --skip-existing and the file is present.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
BATCHES = ROOT / "docs/art/2026-10-29-six-practical-vocab-9up-batches.json"
OUT_DIR = ROOT / "public/art/words"
EXPECTED = 1254
CELL = 418
INSET = 8
OUTPUT = 402
QUALITY = 90
HOMONYMS = {"stop", "change"}


def load_batch(batch_id: str) -> dict:
    doc = json.loads(BATCHES.read_text())
    for batch in doc["batches"]:
        if batch["id"] == batch_id:
            return batch
    raise SystemExit(f"Unknown batch id: {batch_id}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--grid", required=True, type=Path)
    parser.add_argument("--batch-id", required=True)
    parser.add_argument("--skip-existing", action="store_true", default=True)
    parser.add_argument("--overwrite", action="store_true")
    args = parser.parse_args()
    skip_existing = False if args.overwrite else args.skip_existing

    batch = load_batch(args.batch_id)
    im = Image.open(args.grid).convert("RGBA")
    if im.size != (EXPECTED, EXPECTED):
        im = im.resize((EXPECTED, EXPECTED), Image.Resampling.LANCZOS)
        print(f"resized {args.grid} {im.size} -> {EXPECTED}x{EXPECTED}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    parked = ROOT / "tmp" / "wordjoy-homonyms"
    wrote = 0
    skipped = 0
    for slot in batch["slots"]:
        if slot["blank"]:
            continue
        slug = slot["slug"]
        dest = OUT_DIR / f"{slug}.webp"
        col, row = slot["col"], slot["row"]
        x0 = col * CELL + INSET
        y0 = row * CELL + INSET
        cell = im.crop((x0, y0, x0 + OUTPUT, y0 + OUTPUT))
        if slug in HOMONYMS and dest.exists() and not args.overwrite:
            parked.mkdir(parents=True, exist_ok=True)
            alt = parked / f"{slug}.webp"
            cell.save(alt, "WEBP", quality=QUALITY, method=6)
            print(f"PARK homonym {slug} -> {alt} (left {dest} in place)")
            skipped += 1
            continue
        if skip_existing and dest.exists():
            print(f"skip existing {dest.name}")
            skipped += 1
            continue
        cell.save(dest, "WEBP", quality=QUALITY, method=6)
        print(f"wrote {dest.name}")
        wrote += 1
    print(f"done {args.batch_id}: wrote={wrote} skipped={skipped}")


if __name__ == "__main__":
    main()
```

ImageMagick equivalent if Pillow is unavailable (same math; skip-existing is manual):

```bash
# scale to 1254 if needed, then for slot row R col C:
# magick GRID.png -resize 1254x1254! \
#   -crop 402x402+$((C*418+8))+$((R*418+8)) \
#   -quality 90 public/art/words/SLUG.webp
```

Prefer the Python script so blanks and homonyms are handled.

- [ ] **Step 3: Crop one batch (example)**

```bash
python3 scripts/crop-vocab-9up.py \
  --grid "$HOME/OneDrive/WordJoy/ui/vocab/grids/2026-10-29-time_calendar-junior-01.png" \
  --batch-id time_calendar-junior-01
ls public/art/words/monday.webp public/art/words/tuesday.webp
```

Expected: nine webps for monday…afternoon. Then upload:

```bash
# OneDrive desktop sync folder; adjust the local mount
cp -f public/art/words/{monday,tuesday,wednesday,thursday,friday,saturday,sunday,morning,afternoon}.webp \
  "$HOME/OneDrive/WordJoy/ui/vocab/words/"
```

Overwrite on OneDrive is required (`cp -f`).

- [ ] **Step 4: After each theme, verify unique slugs for that theme-band exist**

```bash
python3 - <<'PY'
import json
from pathlib import Path
theme, band = "time_calendar", "junior"  # edit per theme
words = json.loads(Path("public/data/vocab.json").read_text())
need = sorted({ Path(w["image"]).name for w in words if w["theme"]==theme and w["band"]==band })
missing = [n for n in need if not (Path("public/art/words")/n).exists()]
print("need", len(need), "missing", missing)
PY
```

Expected after junior `time_calendar` crop: `need 24 missing []`.

- [ ] **Step 5: Do not `git add` the webps in the wire PR**

```bash
git status -- public/art/words | head
# leave untracked; continue ChatGPT handoff
```

If a later art PR is wanted, it should be a **separate** branch after QC, not mixed into the 1584 JSON commit.

---

### Task 6: Verification / iOS readiness

**Files:** none new. This task is the gate before calling the wire PR iOS-ready (JSON + meta). Art coverage can lag; JSON paths are valid either way (same as PR #2).

**Interfaces:**
- Consumes: runtime 1584 JSON, `THEME_META` with 22 keys, Playwright, local `public/art/words/`.
- Produces: a pass/fail checklist. Missing new webps block **art-complete**, not the wire merge.

- [ ] **Step 1: Counts**

```bash
python3 - <<'PY'
import json
from pathlib import Path
from collections import Counter
words = json.loads(Path('public/data/vocab.json').read_text())
mirror = json.loads(Path('data/vocab.json').read_text())
assert words == mirror
assert len(words) == 1584
print('bands', Counter(w['band'] for w in words))
print('themes', len({w['theme'] for w in words}))
print('new', Counter(w['theme'] for w in words if w['theme'] in {
    'time_calendar','daily_routines','shopping_money','jobs_work','health_hygiene','safety_rules'}))
PY
```

Expected: bands `junior=528, middle=528, senior=528`; themes `22`; each of the six keys `72`.

- [ ] **Step 2: THEME_META has all six**

```bash
rg -n "time_calendar|daily_routines|shopping_money|jobs_work|health_hygiene|safety_rules" src/lib/vocab.js src/screens/themes.js
```

Expected: each key appears in `THEME_IDS`, `THEME_META`, and `EMOJI`.

- [ ] **Step 3: Playwright**

```bash
npx playwright test --reporter=list
```

Expected: all tests green, including 1584 schema + 22 picker cards + existing smoke journeys.

- [ ] **Step 4: Missing-art one-liner (400 new unique slugs)**

After the JSON wire, compute which slugs still need a webp. Overlaps with the 1152 bank (31 slugs, including homonyms `stop`/`change`) already have — or will have — 964-pack art.

```bash
python3 - <<'PY'
import json
from pathlib import Path

def slug(en):
    return str(en).lower().replace(' ', '_').replace('-', '_')

old = json.loads(Path('docs/art/theme-packs-vocab-draft-2026-10-25.json').read_text())
new = json.loads(Path('docs/art/theme-packs-six-practical-2026-10-29.json').read_text())
old_slugs = {slug(w['en']) for w in old}
new_slugs = {slug(w['en']) for w in new}
overlap = sorted(new_slugs & old_slugs)
fresh = sorted(new_slugs - old_slugs)
art = Path('public/art/words')
missing = [s for s in fresh if not (art / f'{s}.webp').exists()]
print('old unique', len(old_slugs))          # 964
print('new unique', len(new_slugs))          # 431 (online shared)
print('overlap', len(overlap))               # 31
print('new unique slugs to draw', len(fresh))  # 400
print('missing webp among those 400', len(missing))
Path('/tmp/wordjoy-missing-art.txt').write_text('\n'.join(missing) + ('\n' if missing else ''))
print('wrote /tmp/wordjoy-missing-art.txt')
print('homonym overlap', [s for s in overlap if s in ('stop', 'change')])
PY
```

Expected after JSON wire and **before** any new crops: `old unique 964`, `new unique 431`, `overlap 31`, `new unique slugs to draw 400`, `missing webp among those 400` ≈ 400 (minus any slug that already existed in the 102-word demo set, e.g. none of Monday/calendar typically). After art execution: `missing webp among those 400` = 0.

Art-complete definition: every slug in `/tmp/wordjoy-missing-art.txt` has a 402×402 webp under `public/art/words/` **and** on OneDrive `WordJoy/ui/vocab/words/`. Homonyms `stop.webp` / `change.webp` are either confirmed overwritten or parked with a written 彭sir decision.

- [ ] **Step 5: iOS / Capacitor readiness (JSON side)**

- `npm run build` succeeds. `dist/data/vocab.json` is 1584 rows (Vite copies `public/`).
- Image URLs stay relative `art/words/{slug}.webp` (games prefix `/` via `imagePath`) — offline-first, no CDN.
- Deep links `#/play/junior/time_calendar/pic_match` and `#/play/senior/safety_rules/cafe_order` resolve via `resolveBand` / `resolveTheme` (new keys pass through unchanged).
- Parent weekly-theme grid shows 22 buttons (still max 2 selected).
- Broken images on device until Task 5 uploads land in the app bundle / OneDrive sync used by the Capacitor copy — same situation as PR #2’s 1152 paths. Call the **wire** iOS-ready when Steps 1–3 pass; call **art** iOS-ready when Step 4 missing=0.

- [ ] **Step 6: Commit any leftover verify helpers**

If `scripts/crop-vocab-9up.py` was added during art execution on this branch and is useful, commit the **script only**:

```bash
git add scripts/crop-vocab-9up.py
git commit -m "chore(art): add nine-up crop script for six practical themes"
```

Do not commit webps here.

---

## Out of scope

- Redesigning games or adding new game modes
- Codex / ASF mascot and UI art
- Splitting homonym slugs into per-theme filenames (`stop__safety.webp`) — needs a product decision, not this wire
- Running ChatGPT or cropping inside **this plan PR** — plan document only
- Rewriting the original 16-theme 1152 bank
- Americanising British classroom forms

## Self-review (author)

| Spec / request item | Task |
|---------------------|------|
| Merge PR #2 then PR #3, exact `gh pr merge` / conflict rule | Task 0 |
| Concat 432, add `image` slug, mirror `data/vocab.json`, unique ids, 1584 | Task 1 |
| Failing Playwright test first (TDD) | Task 1 Steps 1–2 |
| `THEME_META` + `themesForBand` order + emoji + grep leftovers | Task 2 |
| No old→new alias for these 6 | Task 2 Step 2 |
| 54 batches, blanks on batch 3, schema + example | Task 3 |
| ChatGPT handoff bullets, not Gemini/Codex, start order + justification | Task 4 |
| Crop 1254→418→inset 8→402 q90, OneDrive paths, skip bulk webp commit | Task 5 |
| Verify 1584 / 22 / Playwright / missing-art one-liner (~400) | Task 6 |
| Homonyms `stop` / `change`; shared `online` | Tasks 4–5 |
| Totals 1584 and 54 used consistently | header, Task 1, Task 3, Task 6 |
