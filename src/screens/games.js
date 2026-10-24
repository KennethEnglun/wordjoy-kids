import { THEME_META, BAND_META } from '../lib/vocab.js'
import { getActiveProfile } from '../lib/storage.js'
import * as audio from '../lib/audio.js'

const GAMES = [
  { id: 'pic_match', zh: '對對碰', en: 'Pic Match', emoji: '🖼️', desc: '圖同字配對' },
  { id: 'speed_star', zh: '閃電答題', en: 'Speed Star', emoji: '⚡', desc: '又快又準' },
  { id: 'treasure_tap', zh: '開寶箱', en: 'Treasure Tap', emoji: '💎', desc: '答啱開寶箱' },
]

export function renderGames(root, state, nav) {
  const theme = THEME_META[state.theme] || { zh: state.theme }
  const band = BAND_META[state.band]
  const bag = getActiveProfile()?.reviewBag?.length || 0
  root.innerHTML = `
    <div class="screen">
      <div class="topbar">
        <button type="button" class="back" data-back>← 返去</button>
        <div class="stats">${band.zh} · ${theme.zh}</div>
      </div>
      <h1>揀遊戲</h1>
      <p class="hint">一局大約 5 分鐘</p>
      <div class="game-grid" id="games" style="grid-template-columns:1fr"></div>
      ${
        bag
          ? `<button type="button" class="secondary" data-review>🧺 先玩複習袋（${bag}）</button>`
          : ''
      }
    </div>
  `
  root.querySelector('[data-back]').onclick = () => {
    audio.tap()
    nav({ screen: 'themes', band: state.band })
  }
  const rev = root.querySelector('[data-review]')
  if (rev) {
    rev.onclick = () => {
      audio.tap()
      nav({ screen: 'play', band: 'review', theme: '__review__', game: 'review' })
    }
  }
  const grid = root.querySelector('#games')
  GAMES.forEach((g) => {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'card-btn'
    b.dataset.game = g.id
    b.innerHTML = `
      <span class="emoji">${g.emoji}</span>
      <span>${g.zh}</span>
      <span class="meta">${g.en} · ${g.desc}</span>
    `
    b.addEventListener('click', () => {
      audio.tap()
      nav({ screen: 'play', band: state.band, theme: state.theme, game: g.id })
    })
    grid.appendChild(b)
  })
}
