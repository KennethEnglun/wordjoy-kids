import {
  getActiveProfile,
  getParentSettings,
  getTodayStars,
  checkSessionAllowed,
  getWeeklyDigest,
} from '../lib/storage.js'
import { momoImg, MASCOT_NAME_ZH } from '../lib/mascot.js'
import { mountShell } from '../lib/shell.js'
import * as audio from '../lib/audio.js'

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function nudgeDismissed() {
  try {
    return sessionStorage.getItem(`wordjoy-nudge-dismissed-${todayKey()}`) === '1'
  } catch {
    return false
  }
}

export function renderHome(root, nav) {
  const p = getActiveProfile()
  const streak = p?.streak?.count || 0
  const { dailyGoalStars } = getParentSettings()
  const today = getTodayStars()
  const gate = checkSessionAllowed()
  const showNudge = today < dailyGoalStars && !nudgeDismissed()
  const weekly = getWeeklyDigest()
  const lv = Math.max(1, Math.floor((p?.stars || 0) / 10) + 1)

  const body = `
    <div class="screen tab-screen home-screen">
      <div class="home-top">
        <button type="button" class="parent-pill" data-parent>🔒 進入家長端</button>
        <div class="stats soft">
          <span>⭐ ${p?.stars || 0}</span>
          <span>🪙 ${p?.coins || 0}</span>
        </div>
      </div>

      <div class="scroll-banner">
        ${momoImg('wave', MASCOT_NAME_ZH, 'momo-mascot banner-momo')}
        <div class="scroll-titles">
          <p class="brand-en">WordJoy</p>
          <h1 class="brand-zh">英樂寶</h1>
          <p class="hint">同 ${MASCOT_NAME_ZH} 一齊學英文</p>
        </div>
      </div>

      <div class="cream-card profile-strip">
        <span class="avatar-lg">${p?.avatar || '🐱'}</span>
        <div>
          <strong>${p?.name || '小朋友'}</strong>
          <span>Lv. ${lv} 英文旅者 · 🔥 連續 ${streak} 日</span>
        </div>
        <button type="button" class="text-btn" data-profiles>切換</button>
      </div>

      ${
        showNudge
          ? `<div class="nudge-banner" role="status">
              <div class="nudge-copy">
                <strong>字學貓話：今日目標未完成，玩一局再嚟？</strong>
                <span>一局大約 5 分鐘</span>
              </div>
              <button type="button" class="nudge-dismiss" data-nudge-dismiss>知道啦</button>
            </div>`
          : ''
      }

      <button type="button" class="cta-journey" data-start ${gate.allowed ? '' : 'disabled'}>
        <span>開始英文之旅</span>
      </button>
      ${!gate.allowed ? `<p class="notice">${gate.reason}</p>` : ''}

      <h2 class="section-title">今天的任務</h2>
      <div class="task-grid">
        <button type="button" class="cream-card mini task-tap" data-tasks>
          <div class="mini-ico">⭐</div>
          <strong>${today}/${dailyGoalStars}</strong>
          <span>今日星星</span>
        </button>
        <button type="button" class="cream-card mini task-tap" data-tasks>
          <div class="mini-ico">📅</div>
          <strong>${weekly.sessions}/7</strong>
          <span>本週學習</span>
        </button>
      </div>

      <button type="button" class="link-card" data-report>
        <div>
          <strong>我的學習報告</strong>
          <span>睇進度、本週摘要（家長）</span>
        </div>
        <span class="chev">›</span>
      </button>
      <button type="button" class="link-card" data-vault>
        <div>
          <strong>詞彙寶庫</strong>
          <span>按主題學香港小學常見單元詞</span>
        </div>
        <span class="chev">›</span>
      </button>
    </div>
  `

  const shellBody = mountShell(root, { screen: 'home', nav, bodyHtml: body })
  audio.unlockAudio()

  const go = (fn) => (e) => {
    e?.preventDefault?.()
    audio.tap()
    audio.unlockAudio()
    fn()
  }
  shellBody.querySelector('[data-parent]').onclick = go(() => nav({ screen: 'parent' }))
  shellBody.querySelector('[data-profiles]').onclick = go(() => nav({ screen: 'profiles' }))
  shellBody.querySelector('[data-start]').onclick = go(() => {
    if (!gate.allowed) return
    nav({ screen: 'adventure', band: p?.band || 'p1' })
  })
  shellBody.querySelectorAll('[data-tasks]').forEach((el) => {
    el.onclick = go(() => nav({ screen: 'tasks' }))
  })
  shellBody.querySelector('[data-report]').onclick = go(() => nav({ screen: 'parent' }))
  shellBody.querySelector('[data-vault]').onclick = go(() =>
    nav({ screen: 'themes', band: p?.band || 'p1' }),
  )
  const dismiss = shellBody.querySelector('[data-nudge-dismiss]')
  if (dismiss) {
    dismiss.onclick = () => {
      audio.tap()
      try {
        sessionStorage.setItem(`wordjoy-nudge-dismissed-${todayKey()}`, '1')
      } catch {
        /* ignore */
      }
      shellBody.querySelector('.nudge-banner')?.remove()
    }
  }
}
