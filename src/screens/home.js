import {
  getActiveProfile,
  getParentSettings,
  getTodayStars,
  checkSessionAllowed,
} from '../lib/storage.js'
import { BAND_META } from '../lib/vocab.js'
import { momoImg, MASCOT_NAME_ZH } from '../lib/mascot.js'
import * as audio from '../lib/audio.js'

export function renderHome(root, nav) {
  const p = getActiveProfile()
  const streak = p?.streak?.count || 0
  const bag = p?.reviewBag?.length || 0
  const { dailyGoalStars } = getParentSettings()
  const today = getTodayStars()
  const goalPct = Math.min(100, Math.round((today / dailyGoalStars) * 100))
  const gate = checkSessionAllowed()

  root.innerHTML = `
    <div class="screen home-screen">
      <div class="topbar">
        <button type="button" class="profile-chip" data-profiles>
          <span class="avatar">${p?.avatar || '🐱'}</span>
          <span>${p?.name || '小朋友'}</span>
        </button>
        <div class="stats">
          ${streak > 0 ? `<span class="streak-pill">🔥 ${streak}</span>` : ''}
          <span><img src="/art/ui/star.svg" alt="" /> ${p?.stars || 0}</span>
          <span><img src="/art/ui/coin.svg" alt="" /> ${p?.coins || 0}</span>
        </div>
      </div>
      <div class="hero">
        ${momoImg('front', MASCOT_NAME_ZH, 'momo-mascot joy-hero')}
        <div>
          <h1>英樂寶</h1>
          <p class="subtitle">WordJoy · ${MASCOT_NAME_ZH}</p>
        </div>
      </div>
      <div class="goal-card">
        <div class="goal-label">今日目標 ⭐ ${today}/${dailyGoalStars}</div>
        <div class="goal-bar"><i style="width:${goalPct}%"></i></div>
        ${
          today >= dailyGoalStars
            ? '<p class="hint ok-hint">今日目標達成！好棒！</p>'
            : '<p class="hint">再攞多啲星星啦～</p>'
        }
      </div>
      ${
        !gate.allowed
          ? `<p class="notice">${gate.reason}</p>`
          : gate.remainingSec != null
            ? `<p class="hint">今日剩餘遊戲約 ${Math.ceil(gate.remainingSec / 60)} 分鐘</p>`
            : ''
      }
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
      <p class="hint trust-line">家長放心：無廣告 · 資料只存你部手機</p>
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
    b.disabled = !gate.allowed
    b.innerHTML = `<span>${m.zh}</span><span class="en">${m.en}</span>`
    b.addEventListener('click', () => {
      if (!gate.allowed) return
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
    if (!bag || !gate.allowed) return
    audio.tap()
    nav({ screen: 'play', band: 'review', theme: '__review__', game: 'review' })
  }
}
