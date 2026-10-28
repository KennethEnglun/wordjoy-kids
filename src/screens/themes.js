import { loadVocab, themesForBand, THEME_META, BAND_META, resolveBand } from '../lib/vocab.js'
import * as audio from '../lib/audio.js'

const EMOJI = {
  me_family: '👨‍👩‍👧',
  colours_shapes_numbers: '🎨',
  animals_pets: '🐾',
  food_drink: '🍎',
  school: '🎒',
  clothes: '👕',
  body_senses: '🧍',
  toys_games: '🧸',
  home: '🏠',
  weather_seasons: '☔',
  transport: '🚌',
  places_community: '🏘️',
  sports_hobbies: '⚽',
  friends_feelings: '😊',
  festivals: '🧧',
  nature_environment: '🌳',
}

export async function renderThemes(root, state, nav) {
  const words = await loadVocab()
  const bandId = resolveBand(state.band)
  const themes = themesForBand(words, bandId)
  const band = BAND_META[bandId]
  root.innerHTML = `
    <div class="screen">
      <div class="topbar">
        <button type="button" class="back" data-back>← 返去</button>
        <div class="stats">${band.zh}</div>
      </div>
      <h1>揀主題</h1>
      <p class="badge-ks1">✓ 貼近香港小學 KS1／朗文·牛津類常見單元（原創詞表）</p>
      <div class="theme-grid" id="themes"></div>
    </div>
  `
  root.querySelector('[data-back]').onclick = () => {
    audio.tap()
    nav({ screen: 'adventure', band: bandId })
  }
  const grid = root.querySelector('#themes')
  themes.forEach((t) => {
    const meta = THEME_META[t] || { zh: t, en: t, hint: '' }
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'card-btn'
    b.dataset.theme = t
    b.innerHTML = `
      <span class="emoji">${EMOJI[t] || '⭐'}</span>
      <span>${meta.zh}</span>
      <span class="meta">${meta.en}</span>
      <span class="badge-ks1 mini">KS1</span>
    `
    b.addEventListener('click', () => {
      audio.tap()
      {
      if (state.pendingGame) {
        nav({ screen: 'play', band: bandId, theme: t, game: state.pendingGame })
      } else {
        nav({ screen: 'games', band: bandId, theme: t })
      }
    }
    })
    grid.appendChild(b)
  })
}
