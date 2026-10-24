import {
  getActiveProfile,
  hasParentPin,
  verifyParentPin,
  setParentPin,
} from '../lib/storage.js'
import { THEME_META, BAND_META } from '../lib/vocab.js'
import * as audio from '../lib/audio.js'

function esc(s) {
  return String(s || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[c])
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

  function drawGate() {
    root.innerHTML = `
      <div class="screen pin-screen">
        <div class="topbar">
          <button type="button" class="back" data-back>← 返去</button>
          <div class="stats">🔒 家長專區</div>
        </div>
        <h1>家長 PIN</h1>
        <p class="hint">輸入 4 位數字，睇小朋友嘅學習摘要。</p>
        <div class="pin-dots" aria-label="已輸入 ${pin.length} 位">${'●'
          .repeat(pin.length)
          .padEnd(0)}${'○'.repeat(4 - pin.length)}</div>
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
    const tmeta = last ? THEME_META[last.theme] || { zh: last.theme } : null
    const bmeta = last ? BAND_META[last.band] || { zh: last.band } : null
    root.innerHTML = `
      <div class="screen">
        <div class="topbar">
          <button type="button" class="back" data-back>← 返去</button>
          <div class="stats">家長專區</div>
        </div>
        <h1>${esc(p?.avatar || '🐻')} ${esc(p?.name || '小朋友')}</h1>
        <div class="streak-pill">🔥 連續 ${streak.count || 0} 日${
          streak.lastDate ? ` · 最後 ${esc(streak.lastDate)}` : ''
        }</div>
        <div class="parent-card">
          <h3>最近一局</h3>
          ${
            last
              ? `<div>${fmtDate(last.at)} · ${esc(bmeta?.zh)} · ${esc(tmeta?.zh)}</div>
                 <div>正確率：${last.total ? Math.round((last.correct / last.total) * 100) : 0}%（${last.correct}/${last.total}）</div>
                 <div>獎勵：⭐${last.stars || 0} · 🪙${last.coins || 0}</div>`
              : '<div>仲未開始玩，快啲揀個程度試吓。</div>'
          }
        </div>
        <div class="parent-card">
          <h3>複習袋</h3>
          <div>${reviewCount ? `有 ${reviewCount} 個字等緊複習。` : '暫時係空嘅，好棒！'}</div>
          <div>累積：⭐${p?.stars || 0} · 🪙${p?.coins || 0}</div>
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
    root.querySelector('[data-save-pin]').onclick = () => {
      audio.tap()
      const input = root.querySelector('#pin-input')
      const value = (input.value || '').trim()
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
