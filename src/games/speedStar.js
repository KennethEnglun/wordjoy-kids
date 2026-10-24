import { distractors, shuffle } from '../lib/vocab.js'
import * as audio from '../lib/audio.js'

const ROUND_MS = 8000
const ART = {
  flashcard: '/art/games/speed/speed_flashcard_frame.webp',
  tile: '/art/games/speed/speed_letter_tile.webp',
  combo: {
    2: '/art/games/speed/speed_combo_star_x2.webp',
    3: '/art/games/speed/speed_combo_star_x3.webp',
  },
  timer: '/art/games/speed/speed_timer_ring.webp',
  rankPanel: '/art/games/speed/speed_rank_panel.webp',
  avatars: {
    player: '/art/games/speed/speed_rank_avatar_cat.webp',
    rabbit: '/art/games/speed/speed_rank_avatar_rabbit.webp',
    chick: '/art/games/speed/speed_rank_avatar_chick.webp',
  },
  medals: {
    1: '/art/games/speed/speed_medal_gold.webp',
    2: '/art/games/speed/speed_medal_silver.webp',
    3: '/art/games/speed/speed_medal_bronze.webp',
  },
  mascot: '/art/games/speed/speed_mascot_cheer.webp',
  cheer: [1, 2, 3, 4].map((frame) => `/art/games/anim/zxm_cheer_0${frame}.webp`),
  star: '/art/games/shared/hud_star_icon.webp',
  coin: '/art/games/shared/hud_coin_icon.webp',
  sparkle: '/art/games/shared/fx_sparkle_gold.webp',
}

const PLAYERS = [
  { id: 'player', name: '字學貓', avatar: ART.avatars.player },
  { id: 'rabbit', name: '小兔', avatar: ART.avatars.rabbit },
  { id: 'chick', name: '小雞', avatar: ART.avatars.chick },
]

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char])
}

function imagePath(path) {
  if (!path) return ''
  const value = String(path)
  return value.startsWith('/') ? value : `/${value}`
}

function uniqueWords(list) {
  const seen = new Set()
  return (Array.isArray(list) ? list : []).filter((word) => {
    if (!word || word.id == null || seen.has(String(word.id))) return false
    seen.add(String(word.id))
    return true
  })
}

/** 閃電谷 — answer fast, build a streak, and multiply the stars you earn. */
export function createSpeedStar({ words, pool, onDone, onCorrect, roundSize = 8 }) {
  const source = uniqueWords(words)
  const requestedRounds = Number.isFinite(Number(roundSize))
    ? Math.max(0, Math.floor(Number(roundSize)))
    : 8
  const rounds = shuffle(source).slice(0, Math.min(requestedRounds, source.length))
  const answerPool = uniqueWords(Array.isArray(pool) && pool.length ? pool : source)
  const scores = { player: 0, rabbit: 0, chick: 0 }
  const missed = []
  const correctIds = []
  const timers = new Set()
  let rootEl = null
  let roundIndex = 0
  let correct = 0
  let stars = 0
  let coins = 0
  let combo = 0
  let comboMax = 0
  let locked = false
  let finished = false
  let destroyed = false
  let questionStarted = 0
  let questionTimer = null
  let clockInterval = null
  let mascotInterval = null
  let mascotStopTimer = null

  function schedule(callback, delay) {
    const timer = setTimeout(() => {
      timers.delete(timer)
      if (!destroyed) callback()
    }, delay)
    timers.add(timer)
    return timer
  }

  function clearTracked(timer) {
    if (!timer) return
    clearTimeout(timer)
    timers.delete(timer)
  }

  function clearQuestionClock() {
    clearTracked(questionTimer)
    questionTimer = null
    if (clockInterval) clearInterval(clockInterval)
    clockInterval = null
  }

  function clearMascotAnimation() {
    if (mascotInterval) clearInterval(mascotInterval)
    mascotInterval = null
    clearTracked(mascotStopTimer)
    mascotStopTimer = null
  }

  function animateMascot() {
    clearMascotAnimation()
    const mascot = rootEl?.querySelector('[data-mascot]')
    if (!mascot) return
    let frame = 0
    mascot.src = ART.cheer[frame]
    mascotInterval = setInterval(() => {
      if (destroyed || !mascot.isConnected) return
      frame = (frame + 1) % ART.cheer.length
      mascot.src = ART.cheer[frame]
    }, 105)
    mascotStopTimer = schedule(() => {
      clearMascotAnimation()
      if (mascot.isConnected) mascot.src = ART.mascot
    }, 780)
  }

  function standings() {
    return PLAYERS.map((player) => ({ ...player, stars: scores[player.id] }))
      .sort((a, b) => b.stars - a.stars || PLAYERS.findIndex((player) => player.id === a.id) - PLAYERS.findIndex((player) => player.id === b.id))
  }

  function renderRankPanel(final = false) {
    const panel = rootEl?.querySelector('[data-rank-list]')
    if (!panel) return
    panel.innerHTML = standings().map((player, index) => {
      const medal = final ? ART.medals[index + 1] : ''
      return `<div class="speed-rank-row${player.id === 'player' ? ' is-player' : ''}">
        <span class="speed-rank-place">${medal ? `<img src="${medal}" alt="第 ${index + 1} 名" />` : index + 1}</span>
        <img class="speed-rank-avatar" src="${player.avatar}" alt="" />
        <b>${escapeHtml(player.name)}</b><strong>${player.stars}</strong><img class="speed-rank-star" src="${ART.star}" alt="星星" />
      </div>`
    }).join('')
  }

  function updateHud() {
    if (!rootEl) return
    const starCount = rootEl.querySelector('[data-stars]')
    const coinCount = rootEl.querySelector('[data-coins]')
    const comboCount = rootEl.querySelector('[data-combo]')
    const comboIcon = rootEl.querySelector('[data-combo-icon]')
    if (starCount) starCount.textContent = String(stars)
    if (coinCount) coinCount.textContent = String(coins)
    if (comboCount) comboCount.textContent = `連擊 ${combo}`
    if (comboIcon) {
      const multiplier = combo >= 4 ? 3 : combo >= 2 ? 2 : 0
      comboIcon.hidden = !multiplier
      if (multiplier) comboIcon.src = ART.combo[multiplier]
    }
  }

  function shell(content, subtitle = '') {
    return `
      <main class="speed-game">
        <header class="speed-topline">
          <div class="speed-title"><span aria-hidden="true">✦</span><div><strong>閃電谷</strong><small>${escapeHtml(subtitle || `第 ${Math.min(roundIndex + 1, rounds.length)} / ${rounds.length} 題`)}</small></div></div>
          <div class="speed-hud">
            <div><img src="${ART.star}" alt="" /><span>星星</span><b data-stars>${stars}</b></div>
            <div><img src="${ART.coin}" alt="" /><span>金幣</span><b data-coins>${coins}</b></div>
          </div>
        </header>
        <div class="speed-combo-strip"><span data-combo>連擊 ${combo}</span><img data-combo-icon alt="連擊倍率" hidden /><span class="speed-combo-note">答啱連擊，星星倍率更高</span></div>
        ${content}
      </main>`
  }

  function rankPanel() {
    return `<section class="speed-rank-panel" style="--speed-rank-bg: url('${ART.rankPanel}')" aria-label="星星排行">
      <div class="speed-rank-heading"><strong>星星排行</strong><small>你同小伙伴</small></div>
      <div class="speed-rank-list" data-rank-list></div>
    </section>`
  }

  function renderQuestion() {
    clearQuestionClock()
    clearMascotAnimation()
    if (destroyed || finished || !rootEl) return
    locked = false
    if (roundIndex >= rounds.length) {
      finish()
      return
    }
    const word = rounds[roundIndex]
    const options = shuffle([word, ...distractors(answerPool, word, 3)])
    rootEl.innerHTML = shell(`
      <div class="speed-play-area">
        <section class="speed-question-column">
          <div class="speed-timer-row">
            <div class="speed-timer-clock" role="timer" aria-label="剩餘時間">
              <img src="${ART.timer}" alt="" /><strong data-seconds>8</strong>
            </div>
            <div class="speed-timer-track"><i data-timer-bar></i></div>
          </div>
          <section class="speed-flashcard" style="--speed-flashcard: url('${ART.flashcard}')">
            <div class="speed-round-label">快啲睇圖揀英文 <span>${roundIndex + 1} / ${rounds.length}</span></div>
            <img class="speed-prompt-img" src="${escapeHtml(imagePath(word.image))}" alt="詞語圖片提示" />
            <button type="button" class="speak-btn speed-speak" data-speak>🔊 聽英文</button>
          </section>
          <div class="speed-choices" data-choices></div>
          <p class="speed-feedback" data-feedback aria-live="polite"></p>
        </section>
        <aside class="speed-side-column">
          <div class="speed-mascot-card"><img data-mascot src="${ART.mascot}" alt="字學貓為你打氣" /><span>加油答題！</span></div>
          ${rankPanel()}
        </aside>
      </div>`, '8 秒極速答題')
    renderRankPanel()
    updateHud()
    const choices = rootEl.querySelector('[data-choices]')
    options.forEach((option) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'speed-choice'
      button.dataset.choice = String(option.id)
      button.textContent = option.en
      button.addEventListener('click', () => answer(option, button, word))
      choices.appendChild(button)
    })
    rootEl.querySelector('[data-speak]').addEventListener('click', () => {
      audio.tap()
      audio.speak(word.en)
    })
    startClock()
  }

  function startClock() {
    questionStarted = Date.now()
    const bar = rootEl.querySelector('[data-timer-bar]')
    const seconds = rootEl.querySelector('[data-seconds]')
    const tick = () => {
      if (destroyed || locked || finished) return
      const remaining = Math.max(0, ROUND_MS - (Date.now() - questionStarted))
      if (bar) bar.style.width = `${(remaining / ROUND_MS) * 100}%`
      if (seconds) seconds.textContent = String(Math.ceil(remaining / 1000))
    }
    tick()
    clockInterval = setInterval(tick, 100)
    questionTimer = schedule(() => answer(null, null, rounds[roundIndex]), ROUND_MS)
  }

  function tickBots() {
    scores.rabbit += Math.random() < 0.42 ? 2 : 1
    scores.chick += Math.random() < 0.2 ? 2 : (Math.random() < 0.8 ? 1 : 0)
  }

  function answer(option, button, word) {
    if (locked || destroyed || finished) return
    locked = true
    clearQuestionClock()
    const choices = [...rootEl.querySelectorAll('.speed-choice')]
    choices.forEach((choice) => { choice.disabled = true })
    const feedback = rootEl.querySelector('[data-feedback]')
    const elapsed = Date.now() - questionStarted
    if (option && String(option.id) === String(word.id)) {
      button?.classList.add('is-correct')
      combo += 1
      comboMax = Math.max(comboMax, combo)
      const multiplier = combo >= 4 ? 3 : combo >= 2 ? 2 : 1
      const earned = multiplier + (elapsed <= 2500 && multiplier === 1 ? 1 : 0)
      correct += 1
      correctIds.push(word.id)
      stars += earned
      coins += earned
      scores.player = stars
      onCorrect?.(word)
      audio.speakOnCorrect(word.en)
      animateMascot()
      feedback.className = 'speed-feedback is-good'
      feedback.innerHTML = `<img src="${ART.sparkle}" alt="" /><span>${elapsed <= 2500 ? '閃電答啱！' : '答啱啦！'} +${earned} 星星${multiplier > 1 ? `（×${multiplier}）` : ''}</span>`
    } else {
      button?.classList.add('is-wrong')
      const right = choices.find((choice) => choice.dataset.choice === String(word.id))
      right?.classList.add('is-correct')
      audio.wrong()
      missed.push(word.id)
      combo = 0
      feedback.className = 'speed-feedback is-missed'
      feedback.textContent = option ? `連擊中斷，答案係 ${word.en}` : `時間到！答案係 ${word.en}`
    }
    tickBots()
    updateHud()
    renderRankPanel()
    schedule(() => {
      roundIndex += 1
      if (roundIndex >= rounds.length) finish()
      else renderQuestion()
    }, 850)
  }

  function finish() {
    if (finished || destroyed) return
    finished = true
    clearQuestionClock()
    clearMascotAnimation()
    scores.player = stars
    const rank = standings()
    const place = rank.findIndex((player) => player.id === 'player') + 1
    const title = place === 1 ? '閃電谷冠軍！' : place === 2 ? '好快手，獲得銀牌！' : '完成極速挑戰！'
    rootEl.innerHTML = shell(`
      <section class="speed-finish-card">
        <img class="speed-finish-sparkle" src="${ART.sparkle}" alt="" />
        <img class="speed-finish-mascot" src="${ART.mascot}" alt="字學貓為你慶祝" />
        <h2>${title}</h2>
        <p>你得到 <strong>${stars}</strong> 顆星 · 連擊最高 <strong>${comboMax}</strong></p>
        <div class="speed-finish-ranks">${rank.map((player, index) => `<div class="${player.id === 'player' ? 'is-player' : ''}"><img src="${ART.medals[index + 1]}" alt="第 ${index + 1} 名" /><img class="speed-finish-avatar" src="${player.avatar}" alt="" /><b>${escapeHtml(player.name)}</b><strong>${player.stars} 星</strong></div>`).join('')}</div>
      </section>`, '極速結算')
    updateHud()
    schedule(() => onDone?.({
      correct,
      total: rounds.length,
      coins,
      missed,
      correctIds,
      meta: { comboMax, stars, bots: rank.filter((player) => player.id !== 'player').map(({ id, name, stars: score }) => ({ id, name, stars: score })), place },
    }), 1450)
  }

  function clearAll() {
    clearQuestionClock()
    timers.forEach((timer) => clearTimeout(timer))
    timers.clear()
    clearMascotAnimation()
  }

  function mount(root) {
    rootEl = root
    if (!rounds.length) {
      rootEl.innerHTML = '<div class="speed-empty">呢個主題暫時冇詞語可以挑戰。</div>'
      finished = true
      onDone?.({ correct: 0, total: 0, coins: 0, missed, correctIds, meta: { comboMax: 0, stars: 0, bots: [], place: 1 } })
      return
    }
    renderQuestion()
  }

  function destroy() {
    destroyed = true
    clearAll()
    rootEl = null
  }

  return { mount, destroy }
}
