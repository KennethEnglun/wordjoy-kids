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

const BAND_ORDER = { prek: 0, p1: 1, p2: 2, p3: 3 }

export function filterByBandTheme(words, band, theme) {
  const max = BAND_ORDER[band] ?? 0
  return words.filter(
    (w) => w.theme === theme && (BAND_ORDER[w.band] ?? 0) <= max,
  )
}

export function themesForBand(words, band) {
  const max = BAND_ORDER[band] ?? 0
  const set = new Set(
    words.filter((w) => (BAND_ORDER[w.band] ?? 0) <= max).map((w) => w.theme),
  )
  const order = ['family','colours','numbers','animals','food','school','clothes','body','home']
  return order.filter((t) => set.has(t)).concat([...set].filter((t) => !order.includes(t)))
}

export function pickRound(words, n = 8) {
  if (words.length <= n) return shuffle(words)
  return shuffle(words).slice(0, n)
}

export function distractors(all, correct, count = 3) {
  const pool = shuffle(all.filter((w) => w.id !== correct.id))
  return pool.slice(0, count)
}

export const THEME_META = {
  family: { zh: '我同家人', en: 'Family', hint: '貼近香港小學常見單元' },
  colours: { zh: '顏色', en: 'Colours', hint: '貼近香港小學常見單元' },
  numbers: { zh: '數字', en: 'Numbers', hint: '貼近香港小學常見單元' },
  animals: { zh: '動物', en: 'Animals', hint: '貼近香港小學常見單元' },
  food: { zh: '食物', en: 'Food', hint: '貼近香港小學常見單元' },
  school: { zh: '學校', en: 'School', hint: '貼近香港小學常見單元' },
  clothes: { zh: '衣服', en: 'Clothes', hint: '貼近香港小學常見單元' },
  body: { zh: '身體', en: 'Body', hint: '貼近香港小學常見單元' },
  home: { zh: '家', en: 'Home', hint: '貼近香港小學常見單元' },
}

export const BAND_META = {
  prek: { zh: '學前', en: 'Pre-K' },
  p1: { zh: '小一', en: 'P1' },
  p2: { zh: '小二', en: 'P2' },
  p3: { zh: '小三', en: 'P3' },
}
