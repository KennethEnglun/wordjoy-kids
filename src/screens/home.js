import { getActiveProfile } from '../lib/storage.js'
import { BAND_META } from '../lib/vocab.js'
import { joyImg } from '../lib/mascot.js'
import * as audio from '../lib/audio.js'

export function renderHome(root, nav) {
  const p = getActiveProfile()
  const streak = p?.streak?.count || 0
  const bag = p?.reviewBag?.length || 0
  root.innerHTML = `
    <div class="screen home-screen">
      <div class="topbar">
        <button type="button" class="profile-chip" data-profiles>
          <span class="avatar">${p?.avatar || '🐻'}</span>
          <span>${p?.name || '小朋友'}</span>
        </button>
        <div class="stats">
          ${streak > 0 ? `<span class="streak-pill">🔥 ${streak}</span>` : ''}
          <span><img src="/art/ui/star.svg" alt="" /> ${p?.stars || 0}</span>
          <span><img src="/art/ui/coin.svg" alt="" /> ${p?.coins || 0}</span>
        </div>
      </div>
      <div class="hero">
        ${joyImg('front', 'Joy', 'joy-mascot joy-hero')}
        <div>
          <h1>英樂寶</h1>
          <p class="subtitle">WordJoy</p>
        </div>
      </div>
      <p class="subtitle">用遊戲學英文 · 貼近香港小學主題</p>
      <p class="hint">揀程度開始（唔使註冊）</p>
      <div class="band-grid" id="bands"></div>
      <div class="home-actions">
        <button type="button" class="secondary" data-review ${bag ? '' : 'disabled'}>
          🧺 複習袋 ${bag ? `(${bag})` : '(空)'}
        </button>
        <button type="button" class="secondary" data-profiles2>切換小朋友</button>
        <button type="button" class="secondary" data-parent>家長</button>
      </div>
      <p class="hint trust-line">家長放心：無廣告 · 資料只存你部手機 · 之後可上 App Store</p>
    </div>
  `
  audio.unlockAudio()
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
      audio.unlockAudio()
      nav({ screen: 'themes', band: code })
    })
    grid.appendChild(b)
  })
  const goProfiles = () => {
    audio.tap()
    nav({ screen: 'profiles' })
  }
  root.querySelector('[data-profiles]').onclick = goProfiles
  root.querySelector('[data-profiles2]').onclick = goProfiles
  root.querySelector('[data-parent]').onclick = () => {
    audio.tap()
    nav({ screen: 'parent' })
  }
  root.querySelector('[data-review]').onclick = () => {
    if (!bag) return
    audio.tap()
    nav({ screen: 'play', band: 'review', theme: '__review__', game: 'review' })
  }
}
