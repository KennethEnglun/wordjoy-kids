import { mountShell } from '../lib/shell.js'
import { getActiveProfile } from '../lib/storage.js'
import { BAND_IDS, BAND_META, resolveBand } from '../lib/vocab.js'
import * as audio from '../lib/audio.js'

const ROUTES = [
  { id: 'pic_match', zh: '對對碰之路', en: 'Pic Match', blurb: '圖同字配對', emoji: '🖼️' },
  { id: 'speed_star', zh: '閃電谷', en: 'Speed Star', blurb: '又快又準', emoji: '⚡' },
  { id: 'treasure_tap', zh: '寶箱森林', en: 'Treasure Tap', blurb: '答啱開寶箱', emoji: '💎' },
  { id: 'word_race', zh: '詞語賽道', en: 'Word Race', blurb: '答啱向前跑', emoji: '🏁' },
  { id: 'fish_words', zh: '釣魚湖', en: 'Fish Words', blurb: '釣起英文魚', emoji: '🎣' },
  { id: 'cafe_order', zh: '小食店', en: 'Café Order', blurb: '答題攞材料砌餐 · 闖關解鎖新菜式', emoji: '🍽️' },
]

export function renderAdventure(root, state, nav) {
  const p = getActiveProfile()
  const band = resolveBand(state.band || p?.band)
  const body = `
    <div class="screen tab-screen adventure-screen">
      <header class="page-head">
        <h1>冒險地圖</h1>
        <p class="hint">揀一條英文路線出發 · 程度 ${BAND_META[band]?.zh || band}</p>
      </header>
      <div class="band-chips" id="bands"></div>
      <button type="button" class="link-card" data-themes>
        <div>
          <strong>詞彙主題關卡</strong>
          <span>先揀主題，再入路線</span>
        </div>
        <span class="chev">›</span>
      </button>
      <div class="mission-list" id="routes"></div>
    </div>
  `
  const shellBody = mountShell(root, { screen: 'adventure', nav, bodyHtml: body })
  const chips = shellBody.querySelector('#bands')
  BAND_IDS.forEach((code) => {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = `chip${code === band ? ' on' : ''}`
    b.textContent = BAND_META[code].zh
    b.onclick = () => {
      audio.tap()
      nav({ screen: 'adventure', band: code })
    }
    chips.appendChild(b)
  })
  shellBody.querySelector('[data-themes]').onclick = () => {
    audio.tap()
    nav({ screen: 'themes', band })
  }
  const list = shellBody.querySelector('#routes')
  ROUTES.forEach((r) => {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'mission-card'
    b.innerHTML = `
      <span class="mission-emoji">${r.emoji}</span>
      <span class="mission-copy">
        <strong>${r.zh}</strong>
        <span>${r.en} · ${r.blurb}</span>
      </span>
      <span class="chev">›</span>
    `
    b.onclick = () => {
      audio.tap()
      nav({ screen: 'themes', band, pendingGame: r.id })
    }
    list.appendChild(b)
  })
}
