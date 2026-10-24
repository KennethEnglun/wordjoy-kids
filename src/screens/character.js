import { mountShell } from '../lib/shell.js'
import { getActiveProfile, getTodayStars, getParentSettings } from '../lib/storage.js'
import { momoImg, MASCOT_NAME_ZH, MASCOT_NAME_EN } from '../lib/mascot.js'
import { BAND_META } from '../lib/vocab.js'
import * as audio from '../lib/audio.js'

function levelFromStars(stars) {
  return Math.max(1, Math.floor((stars || 0) / 10) + 1)
}

export function renderCharacter(root, state, nav) {
  const p = getActiveProfile()
  const stars = p?.stars || 0
  const lv = levelFromStars(stars)
  const streak = p?.streak?.count || 0
  const { dailyGoalStars } = getParentSettings()
  const today = getTodayStars()
  const body = `
    <div class="screen tab-screen character-screen">
      <header class="page-head">
        <h1>我的${MASCOT_NAME_ZH}</h1>
        <p class="hint">${MASCOT_NAME_EN} · WordJoy 樂園夥伴</p>
      </header>
      <div class="cream-card center char-hero">
        ${momoImg('front', MASCOT_NAME_ZH, 'momo-mascot char-momo')}
        <h2>${p?.name || '小朋友'} 嘅 ${MASCOT_NAME_ZH}</h2>
        <p class="level-pill">Lv. ${lv} 英文旅者</p>
        <p class="stats-inline">⭐ ${stars} · 🪙 ${p?.coins || 0} · 🔥 ${streak} 日</p>
        <p class="hint">程度：${BAND_META[p?.band]?.zh || '小一'} · 今日目標 ${today}/${dailyGoalStars}</p>
      </div>
      <button type="button" class="link-card" data-profiles>
        <div><strong>切換小朋友</strong><span>一機多個檔案</span></div>
        <span class="chev">›</span>
      </button>
      <button type="button" class="link-card" data-shop>
        <div><strong>換裝（即將開放）</strong><span>同字學貓樂園一樣用星星換</span></div>
        <span class="chev">›</span>
      </button>
    </div>
  `
  const shellBody = mountShell(root, { screen: 'character', nav, bodyHtml: body })
  shellBody.querySelector('[data-profiles]').onclick = () => {
    audio.tap()
    nav({ screen: 'profiles' })
  }
  shellBody.querySelector('[data-shop]').onclick = () => {
    audio.tap()
    nav({ screen: 'shop' })
  }
}
