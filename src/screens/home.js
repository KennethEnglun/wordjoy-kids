import { getProgress } from '../lib/storage.js'
import { BAND_META } from '../lib/vocab.js'
import * as audio from '../lib/audio.js'

export function renderHome(root, nav) {
  const p = getProgress()
  root.innerHTML = `
    <div class="screen">
      <div class="topbar">
        <div class="logo-row">
          <img src="/art/ui/logo.svg" alt="WordJoy" />
          <div>
            <h1>英樂寶</h1>
            <p class="subtitle">WordJoy</p>
          </div>
        </div>
        <div class="stats">
          <span><img src="/art/ui/star.svg" alt="" /> ${p.stars || 0}</span>
          <span><img src="/art/ui/coin.svg" alt="" /> ${p.coins || 0}</span>
        </div>
      </div>
      <p class="subtitle">用遊戲學英文 · 貼近香港小學主題</p>
      <p class="hint">揀程度開始（唔使註冊）</p>
      <div class="band-grid" id="bands"></div>
      <p class="hint">家長放心：無廣告 · 資料只存你部手機</p>
    </div>
  `
  const grid = root.querySelector('#bands')
  ;['prek', 'p1', 'p2', 'p3'].forEach((code) => {
    const m = BAND_META[code]
    const b = document.createElement('button')
    b.type = 'button'
    b.className = `big-btn ${code}`
    b.dataset.band = code
    b.innerHTML = `<span>${m.zh}</span><span class="en">${m.en}</span>`
    b.addEventListener('click', () => {
      audio.tap()
      nav({ screen: 'themes', band: code })
    })
    grid.appendChild(b)
  })
}
