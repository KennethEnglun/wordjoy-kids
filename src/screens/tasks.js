import { mountShell } from '../lib/shell.js'
import {
  getActiveProfile,
  getParentSettings,
  getTodayStars,
  getWeeklyDigest,
} from '../lib/storage.js'
import * as audio from '../lib/audio.js'

export function renderTasks(root, state, nav) {
  const p = getActiveProfile()
  const { dailyGoalStars } = getParentSettings()
  const today = getTodayStars()
  const bag = p?.reviewBag?.length || 0
  const weekly = getWeeklyDigest()
  const pct = Math.min(100, Math.round((today / dailyGoalStars) * 100))
  const body = `
    <div class="screen tab-screen">
      <header class="page-head">
        <h1>今日任務</h1>
        <p class="hint">完成目標、清走複習袋</p>
      </header>
      <div class="cream-card">
        <div class="goal-label">每日星星目標 ⭐ ${today}/${dailyGoalStars}</div>
        <div class="goal-bar"><i style="width:${pct}%"></i></div>
        <p class="hint">${today >= dailyGoalStars ? '今日目標達成！' : '再玩一局攞星星～'}</p>
        <button type="button" class="primary sage" data-play>開始一局</button>
      </div>
      <div class="task-grid">
        <div class="cream-card mini">
          <div class="mini-ico">✅</div>
          <strong>${today} 今日星星</strong>
        </div>
        <div class="cream-card mini">
          <div class="mini-ico">📅</div>
          <strong>${weekly.sessions}/7 本週局數</strong>
        </div>
      </div>
      <button type="button" class="mission-card" data-review ${bag ? '' : 'disabled'}>
        <span class="mission-emoji">🧺</span>
        <span class="mission-copy">
          <strong>複習袋任務</strong>
          <span>${bag ? `${bag} 個字等你複習` : '暫時冇嘢要複習'}</span>
        </span>
        <span class="chev">›</span>
      </button>
    </div>
  `
  const shellBody = mountShell(root, { screen: 'tasks', nav, bodyHtml: body })
  shellBody.querySelector('[data-play]').onclick = () => {
    audio.tap()
    nav({ screen: 'adventure', band: p?.band || 'junior' })
  }
  const rev = shellBody.querySelector('[data-review]')
  if (rev && bag) {
    rev.onclick = () => {
      audio.tap()
      nav({ screen: 'play', band: 'review', theme: '__review__', game: 'review' })
    }
  }
}
