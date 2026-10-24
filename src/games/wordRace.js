import { distractors, shuffle } from '../lib/vocab.js'
import * as audio from '../lib/audio.js'

const ART = {
  playerRun: [1, 2, 3, 4].map((i) => `/art/games/anim/zxm_run_0${i}.webp`),
  rivals: {
    bunny: [1, 2, 3, 4].map((i) => `/art/games/anim/rival_bunny_run_0${i}.webp`),
    shiba: [1, 2, 3, 4].map((i) => `/art/games/anim/rival_shiba_run_0${i}.webp`),
    chick: [1, 2, 3, 4].map((i) => `/art/games/anim/rival_chick_run_0${i}.webp`),
  },
  hud: {
    coin: '/art/games/shared/hud_coin_icon.webp',
    star: '/art/games/shared/hud_star_icon.webp',
    crown: '/art/games/shared/hud_crown_icon.webp',
  },
  fx: { sparkle: '/art/games/shared/fx_sparkle_gold.webp' },
}

const RUNNERS = [
  { id: 'player', name: '字學貓', frames: ART.playerRun },
  { id: 'bunny', name: '小兔', frames: ART.rivals.bunny },
  { id: 'shiba', name: '柴犬', frames: ART.rivals.shiba },
  { id: 'chick', name: '小雞', frames: ART.rivals.chick },
]

const BOT_TEMPO = {
  bunny: [3400, 4800],
  shiba: [3900, 5300],
  chick: [4400, 5800],
}

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
  return String(path).startsWith('/') ? String(path) : `/${path}`
}

/** Word Race — a four-lane vocabulary race for 字學貓 and three rivals. */
export function createWordRace({ words, pool, onDone, onCorrect, roundSize = 8 }) {
  const sourceWords = Array.isArray(words) ? words : []
  const requestedRounds = Number.isFinite(Number(roundSize))
    ? Math.max(0, Math.floor(Number(roundSize)))
    : 8
  const rounds = shuffle(sourceWords).slice(0, Math.min(requestedRounds, sourceWords.length))
  const segments = Math.max(1, rounds.length)
  const answerPool = Array.isArray(pool) && pool.length ? pool : sourceWords
  const progress = Object.fromEntries(RUNNERS.map((runner) => [runner.id, 0]))
  const finishTimes = Object.fromEntries(RUNNERS.map((runner) => [runner.id, null]))
  let questionIndex = 0
  let correct = 0
  let coins = 0
  let attempted = 0
  let boostUsed = false
  let boostArmed = false
  let questionAnswered = false
  let raceFinished = false
  let destroyed = false
  let rootEl = null
  let hopTimer = null
  const missed = []
  const correctIds = []
  const runnerImages = new Map()
  const runIntervals = new Map()
  const runStopTimers = new Map()
  const botTimers = new Map()
  const timers = new Set()

  function schedule(callback, delay) {
    const timer = setTimeout(() => {
      timers.delete(timer)
      callback()
    }, delay)
    timers.add(timer)
    return timer
  }

  function clearTracked(timer) {
    if (!timer) return
    clearTimeout(timer)
    timers.delete(timer)
  }

  function clearTimers() {
    timers.forEach((timer) => clearTimeout(timer))
    timers.clear()
    botTimers.clear()
    if (hopTimer) hopTimer = null
    runIntervals.forEach((interval) => clearInterval(interval))
    runIntervals.clear()
    runStopTimers.clear()
    RUNNERS.forEach((runner) => {
      const img = runnerImages.get(runner.id)
      if (img) {
        img.classList.remove('is-hopping')
        img.src = runner.frames[0]
      }
    })
  }

  function currentStandings() {
    return [...RUNNERS].sort((a, b) => {
      const distance = progress[b.id] - progress[a.id]
      if (distance) return distance
      const aFinish = finishTimes[a.id]
      const bFinish = finishTimes[b.id]
      if (aFinish !== null && bFinish !== null) return aFinish - bFinish
      if (aFinish !== null) return -1
      if (bFinish !== null) return 1
      return RUNNERS.indexOf(a) - RUNNERS.indexOf(b)
    })
  }

  function animateRunner(id) {
    const runner = RUNNERS.find((item) => item.id === id)
    const img = runnerImages.get(id)
    if (!runner || !img || destroyed || raceFinished) return
    const oldInterval = runIntervals.get(id)
    if (oldInterval) clearInterval(oldInterval)
    clearTracked(runStopTimers.get(id))
    let frame = 0
    runIntervals.set(id, setInterval(() => {
      frame = (frame + 1) % runner.frames.length
      img.src = runner.frames[frame]
    }, 110))
    const stopTimer = schedule(() => {
      const interval = runIntervals.get(id)
      if (interval) clearInterval(interval)
      runIntervals.delete(id)
      runStopTimers.delete(id)
      if (img.isConnected) img.src = runner.frames[0]
    }, 520)
    runStopTimers.set(id, stopTimer)
  }

  function updateTrack() {
    if (!rootEl) return
    const standings = currentStandings()
    const leaderId = standings[0]?.id
    RUNNERS.forEach((runner) => {
      const lane = rootEl.querySelector(`[data-lane="${runner.id}"]`)
      if (!lane) return
      const runnerImg = lane.querySelector('.race-runner')
      const amount = progress[runner.id]
      const pct = 6 + (amount / segments) * 78
      runnerImg.style.left = `${pct}%`
      lane.querySelector('.race-distance').textContent = `${amount}/${segments}`
      lane.classList.toggle('is-leader', runner.id === leaderId)
      lane.classList.toggle('is-finished', amount >= segments)
      lane.querySelector('.race-crown').hidden = runner.id !== leaderId
      lane.setAttribute('aria-label', `${runner.name}，${amount}/${segments} 段`)
    })
    const playerProgress = rootEl.querySelector('[data-player-progress]')
    const coinCount = rootEl.querySelector('[data-coins]')
    const starCount = rootEl.querySelector('[data-stars]')
    if (playerProgress) playerProgress.textContent = `${progress.player}/${segments}`
    if (coinCount) coinCount.textContent = String(coins)
    if (starCount) starCount.textContent = String(correct)
  }

  function animateHop() {
    const player = runnerImages.get('player')
    const button = rootEl?.querySelector('[data-jump]')
    if (!player || raceFinished || destroyed) return
    if (hopTimer) clearTracked(hopTimer)
    player.classList.remove('is-hopping')
    void player.offsetWidth
    player.classList.add('is-hopping')
    button?.classList.add('is-active')
    hopTimer = schedule(() => {
      player.classList.remove('is-hopping')
      button?.classList.remove('is-active')
      hopTimer = null
    }, 650)
  }

  function advanceRunner(id, amount = 1) {
    if (raceFinished || destroyed || progress[id] >= segments) return
    progress[id] = Math.min(segments, progress[id] + amount)
    if (progress[id] >= segments && finishTimes[id] === null) finishTimes[id] = Date.now()
    updateTrack()
    animateRunner(id)
    if (progress[id] >= segments) finishRace(id, 'finish')
  }

  function scheduleBotTick(id) {
    if (raceFinished || destroyed) return
    const [min, max] = BOT_TEMPO[id]
    const delay = min + Math.random() * (max - min)
    const timer = schedule(() => {
      botTimers.delete(id)
      if (raceFinished || destroyed) return
      advanceRunner(id)
      if (!raceFinished) scheduleBotTick(id)
    }, delay)
    botTimers.set(id, timer)
  }

  function setBoostButton() {
    const button = rootEl?.querySelector('[data-boost]')
    const title = rootEl?.querySelector('[data-boost-title]')
    const detail = rootEl?.querySelector('[data-boost-detail]')
    if (!button || !title || !detail) return
    button.disabled = boostUsed || raceFinished
    button.classList.toggle('is-armed', boostArmed)
    title.textContent = boostArmed ? '加速準備好' : boostUsed ? '已用加速' : 'Boost 加速'
    detail.textContent = boostArmed ? '下次答啱多跑一段' : boostUsed ? '已發動' : '下次答啱多跑一段'
    button.setAttribute('aria-pressed', String(boostArmed))
  }

  function renderQuestion() {
    if (raceFinished || destroyed || !rootEl) return
    const word = rounds[questionIndex]
    const question = rootEl.querySelector('.race-question')
    question.innerHTML = `
      <div class="race-question-top">
        <div class="race-prompt-row">
          <img class="race-prompt-img" src="${escapeHtml(imagePath(word.image))}" alt="詞語圖片提示" />
          <div class="race-prompt-copy">
            <p class="race-prompt-label">睇圖揀英文</p>
            <p class="race-prompt-count">第 ${questionIndex + 1} / ${rounds.length} 題</p>
            <button type="button" class="speak-btn race-speak" data-speak>🔊 聽英文</button>
          </div>
        </div>
        <div class="race-player-position"><span>字學貓進度</span><strong data-player-progress>0/${segments}</strong></div>
      </div>
      <div class="race-choices" data-choices></div>
      <div class="race-feedback" data-feedback aria-live="polite"></div>
    `
    const choices = question.querySelector('[data-choices]')
    const options = shuffle([word, ...distractors(answerPool, word, 3)])
    options.forEach((option) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'race-choice'
      button.dataset.choice = String(option.id)
      button.textContent = option.en
      button.addEventListener('click', () => answer(option, button))
      choices.appendChild(button)
    })
    question.querySelector('[data-speak]').addEventListener('click', () => {
      audio.tap()
      audio.speak(word.en)
    })
    updateTrack()
  }

  function answer(option, chosenButton) {
    if (raceFinished || destroyed || questionAnswered) return
    questionAnswered = true
    attempted++
    const word = rounds[questionIndex]
    const question = rootEl.querySelector('.race-question')
    const buttons = [...question.querySelectorAll('.race-choice')]
    const feedback = question.querySelector('[data-feedback]')
    buttons.forEach((button) => { button.disabled = true })
    const wasCorrect = option && String(option.id) === String(word.id)
    if (wasCorrect) {
      chosenButton.classList.add('is-correct')
      audio.speakOnCorrect(word.en)
      correct++
      correctIds.push(word.id)
      coins += 2
      onCorrect?.(word)
      feedback.className = 'race-feedback is-good'
      feedback.innerHTML = `<img src="${ART.fx.sparkle}" alt="" /> 答啱！${escapeHtml(word.en)} · +2 金幣`
      updateTrack()
      const boost = boostArmed
      if (boost) {
        boostArmed = false
        boostUsed = true
        setBoostButton()
      }
      advanceRunner('player', boost ? 2 : 1)
    } else {
      if (chosenButton) chosenButton.classList.add('is-wrong')
      audio.wrong()
      missed.push(word.id)
      const right = buttons.find((button) => button.dataset.choice === String(word.id))
      if (right) right.classList.add('is-correct')
      feedback.className = 'race-feedback is-missed'
      feedback.textContent = option ? `再試一次～係 ${word.en}` : `時間到～係 ${word.en}`
    }
    if (raceFinished) return
    const transition = schedule(() => {
      questionIndex++
      if (questionIndex >= rounds.length) {
        finishRace(null, 'cap')
        return
      }
      questionAnswered = false
      renderQuestion()
    }, 720)
    void transition
  }

  function finishRace(finisherId, reason) {
    if (raceFinished || destroyed) return
    raceFinished = true
    clearTimers()
    const standings = currentStandings()
    const leader = finisherId || standings[0]?.id || 'player'
    const place = standings.findIndex((runner) => runner.id === 'player') + 1
    const winnerName = RUNNERS.find((runner) => runner.id === leader)?.name || '字學貓'
    const message = reason === 'cap'
      ? `賽程完成！字學貓第 ${place} 名`
      : leader === 'player'
        ? '字學貓率先衝線！第 1 名！'
        : `${winnerName}率先衝線！字學貓第 ${place} 名`
    rootEl?.querySelectorAll('.race-choice, [data-jump], [data-boost]').forEach((button) => {
      button.disabled = true
    })
    setBoostButton()
    updateTrack()
    const feedback = rootEl?.querySelector('[data-feedback]')
    if (feedback) {
      feedback.className = leader === 'player' ? 'race-feedback is-good race-final' : 'race-feedback is-missed race-final'
      feedback.textContent = message
    }
    if (leader === 'player' && reason === 'finish') {
      coins += 3
      updateTrack()
    }
    const finalProgress = { ...progress }
    schedule(() => {
      if (destroyed) return
      onDone?.({
        correct,
        total: rounds.length,
        coins,
        missed,
        correctIds,
        meta: { place, progress: finalProgress },
      })
    }, 850)
  }

  function mount(root) {
    if (destroyed) return
    rootEl = root
    if (!rounds.length) {
      rootEl.innerHTML = '<div class="race-empty">今次沒有詞語可以比賽。</div>'
      raceFinished = true
      onDone?.({ correct: 0, total: 0, coins: 0, missed, correctIds, meta: { place: 1, progress: { ...progress } } })
      return
    }
    rootEl.innerHTML = `
      <div class="race-game">
        <div class="race-topline">
          <div class="race-title"><span class="race-flag">🏁</span><span>詞語賽道</span></div>
          <div class="race-stats">
            <span class="race-stat"><img src="${ART.hud.star}" alt="" /><b data-stars>0</b></span>
            <span class="race-stat"><img src="${ART.hud.coin}" alt="" /><b data-coins>0</b></span>
          </div>
        </div>
        <section class="race-track" aria-label="四條賽道">
          ${RUNNERS.map((runner) => `
            <div class="race-lane" data-lane="${runner.id}" aria-label="${runner.name}，0/${segments} 段">
              <div class="race-lane-head">
                <span class="race-runner-name">${runner.name}</span>
                <img class="race-crown" src="${ART.hud.crown}" alt="目前領先" hidden />
                <span class="race-distance">0/${segments}</span>
              </div>
              <div class="race-course">
                <span class="race-start-mark" aria-hidden="true">●</span>
                <span class="race-finish-mark" aria-hidden="true">🏁</span>
                <img class="race-runner" src="${runner.frames[0]}" alt="${runner.name}" draggable="false" />
              </div>
            </div>
          `).join('')}
        </section>
        <div class="race-tools" aria-label="比賽道具">
          <button type="button" class="race-power" data-jump>
            <span class="race-power-icon" aria-hidden="true">⬆️</span>
            <span><b>跳一跳</b><small>幫字學貓打氣</small></span>
          </button>
          <button type="button" class="race-power" data-boost aria-pressed="false">
            <span class="race-power-icon" aria-hidden="true">⚡</span>
            <span><b data-boost-title>Boost 加速</b><small data-boost-detail>下次答啱多跑一段</small></span>
          </button>
        </div>
        <section class="race-question" aria-label="詞語問題"></section>
      </div>
    `
    RUNNERS.forEach((runner) => {
      runnerImages.set(runner.id, rootEl.querySelector(`[data-lane="${runner.id}"] .race-runner`))
    })
    rootEl.querySelector('[data-jump]').addEventListener('click', () => {
      if (raceFinished || destroyed) return
      audio.tap()
      animateHop()
    })
    rootEl.querySelector('[data-boost]').addEventListener('click', () => {
      if (raceFinished || destroyed || boostUsed || boostArmed) return
      audio.tap()
      boostUsed = true
      boostArmed = true
      setBoostButton()
    })
    renderQuestion()
    RUNNERS.slice(1).forEach((runner) => scheduleBotTick(runner.id))
  }

  function destroy() {
    if (destroyed) return
    destroyed = true
    clearTimers()
    rootEl = null
    runnerImages.clear()
  }

  return { mount, destroy }
}
