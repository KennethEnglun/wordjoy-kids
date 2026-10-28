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
]
const OLD_BANDS = ['prek', 'p1', 'p2', 'p3']
const OLD_THEMES = ['family', 'colours', 'numbers', 'animals', 'food', 'body']

function imageSlug(en) {
  return String(en).toLowerCase().replace(/[ -]/g, '_')
}

test('runtime vocab.json is the 1152-word theme-pack bank', async ({ request }) => {
  const res = await request.get('/data/vocab.json')
  expect(res.ok()).toBeTruthy()
  const words = await res.json()
  expect(Array.isArray(words)).toBeTruthy()
  expect(words).toHaveLength(1152)

  const ids = new Set()
  const bands = {}
  const themes = new Set()
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
  }

  expect(bands).toEqual({ junior: 384, middle: 384, senior: 384 })
  expect([...themes].sort()).toEqual([...THEMES].sort())
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
  await expect(page.locator('button.card-btn')).toHaveCount(16)
  await expect(page.getByRole('button', { name: /我同家人|Me & Family/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /節日|Festivals/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /大自然|Nature/i })).toBeVisible()
})
