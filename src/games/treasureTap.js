import { distractors, shuffle } from '../lib/vocab.js'
import * as audio from '../lib/audio.js'

const ART = {
  chests: {
    wood: {
      closed: '/art/games/treasure/treasure_chest_wood_closed.webp',
      open: '/art/games/treasure/treasure_chest_wood_open.webp',
    },
    moon: {
      closed: '/art/games/treasure/treasure_chest_moon_closed.webp',
      open: '/art/games/treasure/treasure_chest_moon_open.webp',
    },
    royal: {
      closed: '/art/games/treasure/treasure_chest_royal_closed.webp',
      open: '/art/games/treasure/treasure_chest_royal_open.webp',
    },
  },
  plinth: '/art/games/treasure/treasure_plinth_stone.webp',
  banner: '/art/games/treasure/treasure_pick_banner.webp',
  mascot: '/art/games/treasure/treasure_mascot_wand.webp',
  cast: [1, 2, 3, 4].map((frame) => `/art/games/anim/zxm_cast_0${frame}.webp`),
  coin: '/art/games/shared/hud_coin_icon.webp',
  crown: '/art/games/shared/hud_crown_icon.webp',
  sparkle: '/art/games/shared/fx_sparkle_gold.webp',
  icons: {
    dragon: '/art/games/treasure/treasure_icon_dragon.webp',
    steal: '/art/games/treasure/treasure_icon_steal.webp',
    mult: '/art/games/treasure/treasure_icon_mult.webp',
  },
}

const CHEST_SKINS = Object.keys(ART.chests)
const OUTCOMES = [
  { id: 'gold', label: '金幣到手！', icon: ART.coin, weight: 30, change: 3 },
  { id: 'double', label: '金幣 ×2！', icon: ART.icons.mult, weight: 16, change: 6 },
  { id: 'triple', label: '金幣 ×3！', icon: ART.icons.mult, weight: 10, change: 9 },
  { id: 'steal', label: '偷走對手金幣！', icon: ART.icons.steal, weight: 12 },
  { id: 'swap', label: '同對手交換金幣！', icon: ART.icons.steal, weight: 8 },
  { id: 'dragon', label: '龍龍噴火，掉咗金幣！', icon: ART.icons.dragon, weight: 14 },
  { id: 'treasure', label: '龍龍送嚟大寶藏！', icon: ART.icons.dragon, weight: 10, change: 10 },
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

function weightedOutcome() {
  const pick = Math.random() * OUTCOMES.reduce((sum, outcome) => sum + outcome.weight, 0)
  let cursor = 0
  return OUTCOMES.find((outcome) => {
    cursor += outcome.weight
    return pick < cursor
  }) || OUTCOMES[0]
}

/** 寶箱森林 — clear a picture-to-English gate, then pick one of three chests. */
export function createTreasureTap({ words, pool, onDone, onCorrect, roundSize = 8 }) {
  const source = uniqueWords(words)
  const requestedRounds = Number.isFinite(Number(roundSize))
    ? Math.max(0, Math.floor(Number(roundSize)))
    : 8
  const rounds = shuffle(source).slice(0, Math.min(requestedRounds, source.length))
  const answerPool = uniqueWords(Array.isArray(pool) && pool.length ? pool : source)
  const bots = [
    { id: 'bunny', name: '小兔', gold: 0 },
    { id: 'chick', name: '小雞', gold: 0 },
  ]
  const missed = []
  const correctIds = []
  const timers = new Set()
  let rootEl = null
  let roundIndex = 0
  let correct = 0
  let playerGold = 0
  let locked = false
  let finished = false
  let destroyed = false
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
    mascot.src = ART.cast[frame]
    mascotInterval = setInterval(() => {
      if (destroyed || !mascot.isConnected) return
      frame = (frame + 1) % ART.cast.length
      mascot.src = ART.cast[frame]
    }, 115)
    mascotStopTimer = schedule(() => {
      clearMascotAnimation()
      if (mascot.isConnected) mascot.src = ART.mascot
    }, 850)
  }

  function botStrip() {
    return bots.map((bot) => `
      <div class="treasure-bot" data-bot="${bot.id}">
        <img src="${ART.crown}" alt="" />
        <span>${escapeHtml(bot.name)}</span>
        <b data-bot-gold>${bot.gold}</b>
      </div>`).join('')
  }

  function updateHud() {
    if (!rootEl) return
    const gold = rootEl.querySelector('[data-player-gold]')
    if (gold) gold.textContent = String(playerGold)
    bots.forEach((bot) => {
      const score = rootEl.querySelector(`[data-bot="${bot.id}"] [data-bot-gold]`)
      if (score) score.textContent = String(bot.gold)
    })
    const progress = rootEl.querySelector('[data-round-progress]')
    if (progress) progress.textContent = `${Math.min(roundIndex + 1, rounds.length)} / ${rounds.length}`
  }

  function shell(content, subtitle = '') {
    return `
      <main class="treasure-game">
        <header class="treasure-topline">
          <div class="treasure-title"><span aria-hidden="true">✦</span><div><strong>寶箱森林</strong><small>${escapeHtml(subtitle || '第 ' + Math.min(roundIndex + 1, rounds.length) + ' / ' + rounds.length + ' 回合')}</small></div></div>
          <div class="treasure-gold-pill"><img src="${ART.coin}" alt="" /><span>金幣</span><b data-player-gold>${playerGold}</b></div>
        </header>
        <div class="treasure-bot-strip" aria-label="對手金幣">${botStrip()}</div>
        ${content}
      </main>`
  }

  function renderQuestion() {
    if (destroyed || finished || !rootEl) return
    clearMascotAnimation()
    locked = false
    if (roundIndex >= rounds.length) {
      finish()
      return
    }
    const word = rounds[roundIndex]
    const choices = shuffle([word, ...distractors(answerPool, word, 2)])
    rootEl.innerHTML = shell(`
      <section class="treasure-scene">
        <img class="treasure-mascot" data-mascot src="${ART.mascot}" alt="字學貓拿住星星魔杖" />
        <div class="treasure-question-card">
          <div class="treasure-progress"><span>答啱先可以揀寶箱</span><b data-round-progress>${roundIndex + 1} / ${rounds.length}</b></div>
          <div class="treasure-prompt-row">
            <img class="treasure-prompt-img" src="${escapeHtml(imagePath(word.image))}" alt="詞語圖片提示" />
            <div><strong>睇圖揀英文</strong><small>答啱就可以開寶箱！</small><button type="button" class="speak-btn treasure-speak" data-speak>🔊 聽英文</button></div>
          </div>
          <div class="treasure-choices" data-choices></div>
          <p class="treasure-feedback" data-feedback aria-live="polite"></p>
        </div>
      </section>`, '答題開寶箱')

    const choiceBox = rootEl.querySelector('[data-choices]')
    choices.forEach((option) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'treasure-choice'
      button.dataset.choice = String(option.id)
      button.textContent = option.en
      button.addEventListener('click', () => answerGate(option, button, word))
      choiceBox.appendChild(button)
    })
    rootEl.querySelector('[data-speak]').addEventListener('click', () => {
      audio.tap()
      audio.speak(word.en)
    })
  }

  function answerGate(option, button, word) {
    if (locked || destroyed || finished) return
    locked = true
    const buttons = [...rootEl.querySelectorAll('.treasure-choice')]
    buttons.forEach((choice) => { choice.disabled = true })
    const feedback = rootEl.querySelector('[data-feedback]')
    if (String(option.id) === String(word.id)) {
      button.classList.add('is-correct')
      feedback.className = 'treasure-feedback is-good'
      feedback.textContent = '答啱啦！揀一個寶箱。'
      audio.speakOnCorrect(word.en)
      correct += 1
      correctIds.push(word.id)
      onCorrect?.(word)
      schedule(renderChests, 500)
    } else {
      button.classList.add('is-wrong')
      const right = buttons.find((choice) => choice.dataset.choice === String(word.id))
      right?.classList.add('is-correct')
      feedback.className = 'treasure-feedback is-missed'
      feedback.textContent = `呢回合未開到，答案係 ${word.en}`
      audio.wrong()
      missed.push(word.id)
      finishBeatLater(1050)
    }
  }

  function renderChests() {
    if (destroyed || finished || !rootEl) return
    locked = false
    const skins = shuffle(CHEST_SKINS)
    const chestPicks = skins.map((skin) => ({ skin, outcome: weightedOutcome() }))
    rootEl.innerHTML = shell(`
      <section class="treasure-scene treasure-scene-pick">
        <div class="treasure-stage-mascot"><img class="treasure-mascot" data-mascot src="${ART.mascot}" alt="字學貓準備施展魔法" /><p>揀一個寶箱，睇吓有咩驚喜！</p></div>
        <div class="treasure-chest-board">
          <div class="treasure-chest-row" data-chest-row></div>
          <div class="treasure-pick-banner" style="--treasure-banner: url('${ART.banner}')"><span>揀一個！</span></div>
        </div>
        <p class="treasure-feedback" data-feedback aria-live="polite">三款寶箱，三個唔同驚喜。</p>
      </section>`, '寶箱時間！')
    const row = rootEl.querySelector('[data-chest-row]')
    chestPicks.forEach((pick, index) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'treasure-chest-choice'
      button.dataset.chest = String(index)
      button.setAttribute('aria-label', `揀第 ${index + 1} 個寶箱`)
      button.innerHTML = `
        <span class="treasure-chest-art-wrap"><img class="treasure-chest-art" src="${ART.chests[pick.skin].closed}" alt="${pick.skin === 'wood' ? '木星寶箱' : pick.skin === 'moon' ? '月夜寶箱' : '寶石寶箱'}" /></span>
        <img class="treasure-plinth" src="${ART.plinth}" alt="" />
        <span class="treasure-chest-label">${index + 1}</span>`
      button.addEventListener('click', () => openChest(pick, button))
      row.appendChild(button)
    })
  }

  function openChest(pick, selectedButton) {
    if (locked || destroyed || finished) return
    locked = true
    const choices = [...rootEl.querySelectorAll('.treasure-chest-choice')]
    choices.forEach((button) => { button.disabled = true })
    selectedButton.classList.add('is-selected')
    const chest = selectedButton.querySelector('.treasure-chest-art')
    chest.src = ART.chests[pick.skin].open
    const outcome = pick.outcome
    const feedback = rootEl.querySelector('[data-feedback]')
    const resultText = applyOutcome(outcome)
    feedback.className = 'treasure-feedback is-good treasure-outcome'
    feedback.innerHTML = `<img src="${outcome.icon}" alt="" /><span>${escapeHtml(resultText)}</span>`
    const stageMascot = rootEl.querySelector('[data-mascot]')
    if (stageMascot) animateMascot()
    rootEl.querySelector('.treasure-scene')?.classList.add('is-revealing')
    audio.tap()
    schedule(finishBeat, 1450)
  }

  function applyOutcome(outcome) {
    if (outcome.id === 'steal') {
      const target = [...bots].sort((a, b) => b.gold - a.gold)[0]
      const amount = Math.min(3, target.gold)
      target.gold -= amount
      playerGold += amount + 2
      updateHud()
      return amount ? `偷到 ${amount + 2} 金幣！` : '對手冇金幣，搵到 2 金幣！'
    }
    if (outcome.id === 'swap') {
      const target = [...bots].sort((a, b) => b.gold - a.gold)[0]
      const previous = playerGold
      playerGold = target.gold
      target.gold = previous
      updateHud()
      return `同${target.name}交換金幣！`
    }
    if (outcome.id === 'dragon') {
      const lost = Math.min(playerGold, Math.max(2, Math.ceil(playerGold * 0.25)))
      playerGold -= lost
      updateHud()
      return lost ? `噴火吹走 ${lost} 金幣！` : '冇金幣可以吹走，安全過關！'
    }
    playerGold += outcome.change
    updateHud()
    if (outcome.id === 'double') return '金幣 ×2，得到 6 金幣！'
    if (outcome.id === 'triple') return '金幣 ×3，得到 9 金幣！'
    if (outcome.id === 'treasure') return '龍龍送你 10 金幣大寶藏！'
    return '得到 3 金幣！'
  }

  function finishBeatLater(delay) {
    locked = true
    schedule(finishBeat, delay)
  }

  function finishBeat() {
    if (destroyed || finished) return
    bots.forEach((bot) => { bot.gold += 1 + Math.floor(Math.random() * 3) })
    roundIndex += 1
    if (roundIndex >= rounds.length) finish()
    else renderQuestion()
  }

  function standings() {
    return [{ id: 'player', name: '字學貓', gold: playerGold }, ...bots]
      .sort((a, b) => b.gold - a.gold)
  }

  function finish() {
    if (finished || destroyed) return
    finished = true
    clearMascotAnimation()
    const rank = standings()
    const place = rank.findIndex((entry) => entry.id === 'player') + 1
    const winner = rank[0]
    const label = winner.id === 'player' ? '你係寶箱森林金幣王！' : `${winner.name}今次金幣最多，下次再挑戰！`
    rootEl.innerHTML = shell(`
      <section class="treasure-finish-card">
        <img class="treasure-finish-mascot" src="${ART.mascot}" alt="字學貓同你慶祝" />
        <img class="treasure-finish-sparkle" src="${ART.sparkle}" alt="" />
        <h2>${escapeHtml(label)}</h2>
        <p>你攞到 <strong>${playerGold}</strong> 金幣 · 第 ${place} 名</p>
        <div class="treasure-finish-ranks">${rank.map((entry, index) => `<div><span>${index + 1}</span><b>${escapeHtml(entry.name)}</b><strong>${entry.gold} 金幣</strong></div>`).join('')}</div>
      </section>`, '森林結算')
    updateHud()
    schedule(() => onDone?.({
      correct,
      total: rounds.length,
      coins: Math.max(0, playerGold),
      missed,
      correctIds,
      meta: { gold: playerGold, bots: bots.map(({ id, name, gold }) => ({ id, name, gold })), place },
    }), 1400)
  }

  function clearAll() {
    timers.forEach((timer) => clearTimeout(timer))
    timers.clear()
    clearMascotAnimation()
  }

  function mount(root) {
    rootEl = root
    if (!rounds.length) {
      rootEl.innerHTML = '<div class="treasure-empty">呢個主題暫時冇詞語可以尋寶。</div>'
      finished = true
      onDone?.({ correct: 0, total: 0, coins: 0, missed, correctIds, meta: { gold: 0, bots, place: 1 } })
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
