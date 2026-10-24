import {
  listProfiles,
  getActiveProfile,
  setActiveProfile,
  createProfile,
  MAX_PROFILES,
  AVATARS,
} from '../lib/storage.js'
import { BAND_META } from '../lib/vocab.js'
import * as audio from '../lib/audio.js'
import { momoImg, MASCOT_NAME_ZH } from '../lib/mascot.js'

function esc(s) {
  return String(s || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[c])
}

export function renderProfiles(root, state, nav) {
  let pickedAvatar = AVATARS[0]
  let notice = ''

  function draw() {
    const profiles = listProfiles()
    const active = getActiveProfile()
    const canAdd = profiles.length < MAX_PROFILES
    const nextName = `小朋友${profiles.length + 1}`
    root.innerHTML = `
      <div class="screen">
        <div class="topbar">
          <button type="button" class="back" data-back>← 返去</button>
          <div class="stats">👨‍👩‍👧‍👦 ${profiles.length}/${MAX_PROFILES}</div>
        </div>
        <div style="text-align:center">${momoImg('happy', MASCOT_NAME_ZH, 'momo-mascot momo-small')}</div>
        <h1>揀小朋友</h1>
        <p class="hint">一個手機，每人有自己嘅星、金幣同複習袋。</p>
        ${notice ? `<p class="notice">${esc(notice)}</p>` : ''}
        <div class="profile-grid" id="profiles"></div>
        ${
          canAdd
            ? `<div class="create-card">
                <h3>新增小朋友</h3>
                <label class="field-label" for="profile-name">名字</label>
                <input id="profile-name" class="name-input" maxlength="16" value="${esc(nextName)}" autocomplete="off" />
                <p class="field-label">揀頭像</p>
                <div class="avatar-grid" id="avatars"></div>
                <button type="button" class="primary" data-create>新增檔案</button>
              </div>`
            : `<p class="hint">已達 ${MAX_PROFILES} 個檔案上限。</p>`
        }
      </div>
    `
    root.querySelector('[data-back]').onclick = () => {
      audio.tap()
      nav({ screen: 'home' })
    }

    const grid = root.querySelector('#profiles')
    profiles.forEach((p) => {
      const b = document.createElement('button')
      b.type = 'button'
      b.className = `profile-card${p.id === active?.id ? ' active' : ''}`
      b.dataset.profile = p.id
      b.innerHTML = `
        <span class="profile-avatar">${esc(p.avatar)}</span>
        <span class="profile-name">${esc(p.name)}</span>
        <span class="meta">${BAND_META[p.band]?.zh || p.band} · 🔥${p.streak?.count || 0}</span>
        ${p.id === active?.id ? '<span class="badge-current">現在</span>' : ''}
      `
      b.onclick = () => {
        audio.tap()
        setActiveProfile(p.id)
        nav({ screen: 'home' })
      }
      grid.appendChild(b)
    })

    for (let i = profiles.length; i < MAX_PROFILES; i++) {
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'profile-card empty'
      b.innerHTML = `<span class="profile-avatar">＋</span><span class="profile-name">空位</span>`
      b.onclick = () => {
        audio.tap()
        root.querySelector('#profile-name')?.focus()
      }
      grid.appendChild(b)
    }

    const avatars = root.querySelector('#avatars')
    if (avatars) {
      AVATARS.forEach((a) => {
        const b = document.createElement('button')
        b.type = 'button'
        b.className = `avatar-btn${a === pickedAvatar ? ' selected' : ''}`
        b.textContent = a
        b.setAttribute('aria-label', `頭像 ${a}`)
        b.onclick = () => {
          audio.tap()
          pickedAvatar = a
          draw()
        }
        avatars.appendChild(b)
      })
      root.querySelector('[data-create]').onclick = () => {
        audio.tap()
        const input = root.querySelector('#profile-name')
        const name = (input.value || '').trim() || nextName
        const currentBand = getActiveProfile()?.band || 'p1'
        const created = createProfile(name, pickedAvatar, currentBand)
        if (!created) {
          notice = `最多只可以開 ${MAX_PROFILES} 個檔案。`
          draw()
          return
        }
        nav({ screen: 'home' })
      }
    }
  }

  draw()
}
