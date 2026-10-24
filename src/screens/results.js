import {
  addCoins,
  addStars,
  recordBest,
  pushReview,
  saveSession,
  getProgress,
} from '../lib/storage.js'
import { THEME_META, BAND_META } from '../lib/vocab.js'
import * as audio from '../lib/audio.js'

function starCount(correct, total) {
  const r = total ? correct / total : 0
  if (r >= 0.9) return 3
  if (r >= 0.7) return 2
  if (r >= 0.4) return 1
  return 0
}

export function renderResults(root, state, nav) {
  const { result, band, theme, game } = state
  const stars = starCount(result.correct, result.total)
  const coins = result.coins || 0
  addCoins(coins)
  addStars(stars)
  const key = `${band}:${theme}:${game}`
  recordBest(key, result.correct)
  if (result.missed?.length) pushReview(result.missed)
  const pct = Math.round((result.correct / result.total) * 100)
  saveSession({
    at: Date.now(),
    band,
    theme,
    game,
    correct: result.correct,
    total: result.total,
    stars,
    coins,
    missed: result.missed || [],
  })
  const p = getProgress()
  const starStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars)
  const tmeta = THEME_META[theme] || { zh: theme }
  const bmeta = BAND_META[band]

  root.innerHTML = `
    <div class="screen results">
      <h1>做得好！</h1>
      <div class="stars-row">${starStr}</div>
      <p class="coins">+${coins} 金幣 · 正確 ${result.correct}/${result.total}</p>
      <div class="parent-card">
        <h3>家長摘要</h3>
        <div>今日練咗：${bmeta.zh} · ${tmeta.zh}</div>
        <div>正確率：${pct}%</div>
        <div>新獎勵：⭐${stars} · 🪙${coins}</div>
        <div>累積：⭐${p.stars} · 🪙${p.coins}</div>
        ${
          result.missed?.length
            ? `<div>建議複習：${result.missed.length} 個字（已放入複習袋）</div>`
            : `<div>今局全對，好棒！</div>`
        }
      </div>
      <div class="actions">
        <button type="button" class="primary" data-replay>再玩一次</button>
        <button type="button" class="secondary" data-home>返主頁</button>
      </div>
    </div>
  `
  audio.correct()
  root.querySelector('[data-replay]').onclick = () => {
    audio.tap()
    nav({ screen: 'play', band, theme, game })
  }
  root.querySelector('[data-home]').onclick = () => {
    audio.tap()
    nav({ screen: 'home' })
  }
}
