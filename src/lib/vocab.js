let cache = null

export async function loadVocab() {
  if (cache) return cache
  const res = await fetch('/data/vocab.json')
  cache = await res.json()
  return cache
}

export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** junior < middle < senior — spiral packs unlock lower bands with the selected max. */
export const BAND_IDS = ['junior', 'middle', 'senior']
const BAND_ORDER = { junior: 0, middle: 1, senior: 2 }
const LEGACY_BAND = { prek: 'junior', p1: 'junior', p2: 'middle', p3: 'senior' }

export const THEME_IDS = [
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

const LEGACY_THEME = {
  family: 'me_family',
  colours: 'colours_shapes_numbers',
  numbers: 'colours_shapes_numbers',
  animals: 'animals_pets',
  food: 'food_drink',
  body: 'body_senses',
}

export function resolveBand(band) {
  if (BAND_ORDER[band] != null) return band
  return LEGACY_BAND[band] || 'junior'
}

export function resolveTheme(theme) {
  if (THEME_IDS.includes(theme)) return theme
  return LEGACY_THEME[theme] || theme
}

export function filterByBandTheme(words, band, theme) {
  const max = BAND_ORDER[resolveBand(band)] ?? 0
  const pack = resolveTheme(theme)
  return words.filter(
    (w) => w.theme === pack && (BAND_ORDER[w.band] ?? 0) <= max,
  )
}

export function themesForBand(words, band) {
  const max = BAND_ORDER[resolveBand(band)] ?? 0
  const set = new Set(
    words.filter((w) => (BAND_ORDER[w.band] ?? 0) <= max).map((w) => w.theme),
  )
  return THEME_IDS.filter((t) => set.has(t)).concat([...set].filter((t) => !THEME_IDS.includes(t)))
}

export function pickRound(words, n = 8) {
  if (words.length <= n) return shuffle(words)
  return shuffle(words).slice(0, n)
}

/** Put words from this week's school themes first, shuffled within each group. */
export function prioritizeWords(words, weeklyThemes = []) {
  const themes = new Set(
    (Array.isArray(weeklyThemes) ? weeklyThemes : []).map((t) => resolveTheme(t)),
  )
  if (!themes.size) return shuffle(words)
  const priority = words.filter((w) => themes.has(w.theme))
  const rest = words.filter((w) => !themes.has(w.theme))
  return [...shuffle(priority), ...shuffle(rest)]
}

export function distractors(all, correct, count = 3) {
  const pool = shuffle(all.filter((w) => w.id !== correct.id))
  return pool.slice(0, count)
}

export const THEME_META = {
  me_family: { zh: '我同家人', en: 'Me & Family', hint: '貼近香港小學常見單元' },
  colours_shapes_numbers: { zh: '顏色形狀數字', en: 'Colours, Shapes & Numbers', hint: '貼近香港小學常見單元' },
  animals_pets: { zh: '動物同寵物', en: 'Animals & Pets', hint: '貼近香港小學常見單元' },
  food_drink: { zh: '食物同飲品', en: 'Food & Drink', hint: '貼近香港小學常見單元' },
  school: { zh: '學校', en: 'School', hint: '貼近香港小學常見單元' },
  clothes: { zh: '衣服', en: 'Clothes', hint: '貼近香港小學常見單元' },
  body_senses: { zh: '身體同感官', en: 'Body & Senses', hint: '貼近香港小學常見單元' },
  toys_games: { zh: '玩具同遊戲', en: 'Toys & Games', hint: '貼近香港小學常見單元' },
  home: { zh: '家', en: 'Home', hint: '貼近香港小學常見單元' },
  weather_seasons: { zh: '天氣同季節', en: 'Weather & Seasons', hint: '貼近香港小學常見單元' },
  transport: { zh: '交通', en: 'Transport', hint: '貼近香港小學常見單元' },
  places_community: { zh: '社區同地方', en: 'Places & Community', hint: '貼近香港小學常見單元' },
  sports_hobbies: { zh: '運動同興趣', en: 'Sports & Hobbies', hint: '貼近香港小學常見單元' },
  friends_feelings: { zh: '朋友同感受', en: 'Friends & Feelings', hint: '貼近香港小學常見單元' },
  festivals: { zh: '節日', en: 'Festivals', hint: '貼近香港小學常見單元' },
  nature_environment: { zh: '大自然', en: 'Nature & Environment', hint: '貼近香港小學常見單元' },
}

export const BAND_META = {
  junior: { zh: '初小', en: 'Junior' },
  middle: { zh: '中小', en: 'Middle' },
  senior: { zh: '高小', en: 'Senior' },
}
