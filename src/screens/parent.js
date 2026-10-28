import {
  getActiveProfile,
  hasParentPin,
  verifyParentPin,
  setParentPin,
  getParentSettings,
  setParentSettings,
  getWeeklyDigest,
  getTodayStars,
  getWeeklyThemes,
  setWeeklyThemes,
} from '../lib/storage.js'
import { THEME_META, BAND_META, resolveBand, resolveTheme } from '../lib/vocab.js'
import { momoImg, MASCOT_NAME_ZH } from '../lib/mascot.js'
import * as audio from '../lib/audio.js'

function esc(s) {
  return String(s || '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  )
}

function fmtDate(ts) {
  try {
    return new Date(ts).toLocaleString('zh-HK', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

export function renderParent(root, state, nav) {
  let locked = hasParentPin()
  let pin = ''
  let error = ''
  let notice = ''
  let themeNotice = ''
  let selectedThemes = getWeeklyThemes()

  function drawGate() {
    root.innerHTML = `
      <div class="screen pin-screen">
        <div class="topbar">
          <button type="button" class="back" data-back>← 返去</button>
          <div class="stats">🔒 家長專區</div>
        </div>
        ${momoImg('front', MASCOT_NAME_ZH, 'momo-mascot momo-small')}
        <h1>家長 PIN</h1>
        <p class="hint">輸入 4 位數字，睇學習摘要同設定。</p>
        <div class="pin-dots">${'●'.repeat(pin.length)}${'○'.repeat(4 - pin.length)}</div>
        ${error ? `<p class="pin-error">${esc(error)}</p>` : ''}
        <div class="pin-pad" id="pin-pad"></div>
      </div>
    `
    root.querySelector('[data-back]').onclick = () => {
      audio.tap()
      nav({ screen: 'home' })
    }
    const pad = root.querySelector('#pin-pad')
    ;['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].forEach((d) => {
      if (d === '') {
        pad.appendChild(document.createElement('span'))
        return
      }
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'pin-key'
      b.textContent = d
      b.setAttribute('aria-label', d)
      b.onclick = () => {
        audio.tap()
        if (d === '⌫') {
          pin = pin.slice(0, -1)
          error = ''
          updateDots()
          return
        }
        if (pin.length >= 4) return
        pin += d
        updateDots()
        if (pin.length === 4) {
          setTimeout(() => {
            if (verifyParentPin(pin)) {
              locked = false
              error = ''
              pin = ''
              drawPanel()
            } else {
              error = 'PIN 唔啱，再試一次。'
              pin = ''
              drawGate()
            }
          }, 140)
        }
      }
      pad.appendChild(b)
    })
  }

  function updateDots() {
    const el = root.querySelector('.pin-dots')
    if (el) el.textContent = '●'.repeat(pin.length) + '○'.repeat(4 - pin.length)
  }

  function drawPanel() {
    const p = getActiveProfile()
    const last = p?.sessions?.[0]
    const reviewCount = p?.reviewBag?.length || 0
    const streak = p?.streak || { count: 0, lastDate: null }
    const settings = getParentSettings()
    const weekly = getWeeklyDigest()
    const today = getTodayStars()
    const tmeta = last ? THEME_META[resolveTheme(last.theme)] || { zh: last.theme } : null
    const bmeta = last ? BAND_META[resolveBand(last.band)] || { zh: last.band } : null
    const themeNames = weekly.themes
      .map((t) => THEME_META[resolveTheme(t)]?.zh || t)
      .filter(Boolean)
      .join('、') || '—'

    root.innerHTML = `
      <div class="screen">
        <div class="topbar">
          <button type="button" class="back" data-back>← 返去</button>
          <div class="stats">家長專區</div>
        </div>
        <h1>${esc(p?.avatar || '🐱')} ${esc(p?.name || '小朋友')}</h1>
        <div class="streak-pill">🔥 連續 ${streak.count || 0} 日</div>

        <div class="parent-card">
          <h3>本週摘要（7 日）</h3>
          <div>玩咗 ${weekly.sessions} 局 · 正確率 ${weekly.accuracy}%</div>
          <div>練習題數：${weekly.correct}/${weekly.total || 0}</div>
          <div>本週星星：⭐${weekly.stars} · 連續日數 🔥${weekly.streak}</div>
          <div>主題：${esc(themeNames)}</div>
          <div>複習袋：${weekly.reviewBag} 個字</div>
        </div>

        <div class="parent-card">
          <h3>今日</h3>
          <div>目標進度：⭐ ${today}/${settings.dailyGoalStars}</div>
          ${
            last
              ? `<div>最近一局：${fmtDate(last.at)} · ${esc(bmeta?.zh)} · ${esc(tmeta?.zh)}（${
                  last.total ? Math.round((last.correct / last.total) * 100) : 0
                }%）</div>`
              : '<div>仲未開始玩。</div>'
          }
          <div>複習袋：${reviewCount} · 累積 ⭐${p?.stars || 0} · 🪙${p?.coins || 0}</div>
        </div>

        <div class="parent-card">
          <h3>每日目標同時間上限</h3>
          <p class="hint">對準香港家庭螢幕時間焦慮：短局、可見目標。</p>
          <label class="field-label" for="goal-stars">每日星星目標</label>
          <input id="goal-stars" class="name-input" type="number" min="1" max="100" value="${settings.dailyGoalStars}" />
          <label class="field-label" for="cap-min">每次／今日遊戲上限（分鐘，0＝唔限制）</label>
          <input id="cap-min" class="name-input" type="number" min="0" max="120" value="${settings.sessionCapMinutes}" />
          <button type="button" class="primary" data-save-settings>儲存設定</button>
        </div>

        <div class="parent-card">
          <h3>本週學校主題</h3>
          <p class="hint">揀最多 2 個主題，玩遊戲時會優先出相關字詞。</p>
          <div class="theme-pick-grid">
            ${Object.entries(THEME_META)
              .map(
                ([t, m]) => `<button type="button" class="theme-pick${
                  selectedThemes.includes(t) ? ' selected' : ''
                }" data-theme-pick="${t}"><span>${m.zh}</span><span class="en">${m.en}</span></button>`,
              )
              .join('')}
          </div>
          <p class="hint theme-limit"></p>
          ${themeNotice ? `<p class="notice">${esc(themeNotice)}</p>` : ''}
          <button type="button" class="primary" data-save-themes>儲存本週主題</button>
        </div>

        <div class="parent-card">
          <h3>${hasParentPin() ? '更改家長 PIN' : '設定家長 PIN'}</h3>
          <p class="hint">用 4 位數字保護家長摘要（只存喺呢部手機）。</p>
          <div class="pin-set-row">
            <input id="pin-input" class="name-input pin-input" inputmode="numeric" maxlength="4" pattern="[0-9]*" placeholder="••••" autocomplete="off" />
            <button type="button" class="primary" data-save-pin>儲存</button>
          </div>
          ${notice ? `<p class="notice">${esc(notice)}</p>` : ''}
        </div>
        <div class="actions">
          <button type="button" class="secondary" data-home>返主頁</button>
        </div>
      </div>
    `
    root.querySelector('[data-back]').onclick = () => {
      audio.tap()
      nav({ screen: 'home' })
    }
    root.querySelector('[data-home]').onclick = () => {
      audio.tap()
      nav({ screen: 'home' })
    }
    root.querySelector('[data-save-settings]').onclick = () => {
      audio.tap()
      const g = Number(root.querySelector('#goal-stars').value)
      const c = Number(root.querySelector('#cap-min').value)
      setParentSettings({ dailyGoalStars: g, sessionCapMinutes: c })
      notice = '已儲存每日目標同時間上限。'
      drawPanel()
    }
    root.querySelectorAll('[data-theme-pick]').forEach((btn) => {
      btn.onclick = () => {
        audio.tap()
        const t = btn.dataset.themePick
        const idx = selectedThemes.indexOf(t)
        if (idx >= 0) {
          selectedThemes.splice(idx, 1)
        } else if (selectedThemes.length < 2) {
          selectedThemes.push(t)
        } else {
          const lim = root.querySelector('.theme-limit')
          if (lim) lim.textContent = '最多揀 2 個主題。'
          return
        }
        themeNotice = ''
        root.querySelectorAll('[data-theme-pick]').forEach((b) => {
          b.classList.toggle('selected', selectedThemes.includes(b.dataset.themePick))
        })
        const lim = root.querySelector('.theme-limit')
        if (lim) lim.textContent = ''
      }
    })
    root.querySelector('[data-save-themes]').onclick = () => {
      audio.tap()
      setWeeklyThemes(selectedThemes)
      themeNotice = '已儲存本週學校主題。'
      drawPanel()
    }
    root.querySelector('[data-save-pin]').onclick = () => {
      audio.tap()
      const value = (root.querySelector('#pin-input').value || '').trim()
      if (!/^\d{4}$/.test(value)) {
        notice = '請輸入 4 位數字。'
        drawPanel()
        return
      }
      setParentPin(value)
      notice = '已儲存。下次入家長專區要輸入呢個 PIN。'
      drawPanel()
    }
  }

  if (locked) drawGate()
  else drawPanel()
}
