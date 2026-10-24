import { distractors, shuffle } from '../lib/vocab.js'
import * as audio from '../lib/audio.js'

const ART = {
  pier: '/art/games/fishing/fishing_pier.webp',
  bucket: '/art/games/fishing/fishing_bucket.webp',
  mascot: '/art/games/fishing/fishing_mascot_cast.webp',
  cast: [1, 2, 3, 4].map((frame) => `/art/games/anim/zxm_cast_0${frame}.webp`),
  fish: [1, 2, 3, 4].map((frame) => `/art/games/anim/zxm_fish_0${frame}.webp`),
  bait: '/art/games/fishing/fishing_bait_bag_icon.webp',
  fishIcon: '/art/games/fishing/fishing_fish_icon_small.webp',
  coin: '/art/games/shared/hud_coin_icon.webp',
  sparkle: '/art/games/shared/fx_sparkle_gold.webp',
  ripple: '/art/games/fishing/fishing_fx_ripple.webp',
  splash: '/art/games/fishing/fishing_fx_splash.webp',
  fishByRarity: {
    common: '/art/games/fishing/fishing_fish_common.webp',
    striped: '/art/games/fishing/fishing_fish_striped.webp',
    blue: '/art/games/fishing/fishing_fish_blue.webp',
    spotted: '/art/games/fishing/fishing_fish_spotted.webp',
    rare_big: '/art/games/fishing/fishing_fish_rare_big.webp',
  },
}

const RARITIES = [
  { id: 'common', name: '普通魚', weight: 43, pounds: 8 },
  { id: 'striped', name: '條紋魚', weight: 23, pounds: 12 },
  { id: 'blue', name: '藍魚', weight: 15, pounds: 16 },
  { id: 'spotted', name: '斑點魚', weight: 12, pounds: 20 },
  { id: 'rare_big', name: '稀有大魚', weight: 7, pounds: 40 },
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

function fishForLure(level) {
  const adjusted = RARITIES.map((fish) => ({
    ...fish,
    weight: fish.id === 'rare_big'
      ? fish.weight + (level - 1) * 4
      : fish.id === 'common'
        ? Math.max(20, fish.weight - (level - 1) * 3)
        : fish.weight,
  }))
  let target = Math.random() * adjusted.reduce((sum, fish) => sum + fish.weight, 0)
  for (const fish of adjusted) {
    target -= fish.weight
    if (target < 0) return fish
  }
  return adjusted[0]
}

/** 釣魚湖 — cast, wait for a bite, then land a fish with a vocabulary answer. */
export function createFishWords({ words, pool, onDone, onCorrect, roundSize = 8 }) {
  const source = uniqueWords(words)
  const requestedRounds = Number.isFinite(Number(roundSize))
    ? Math.max(0, Math.floor(Number(roundSize)))
    : 8
  const rounds = shuffle(source).slice(0, Math.min(requestedRounds, source.length))
  const answerPool = uniqueWords(Array.isArray(pool) && pool.length ? pool : source)
  const bots = [
    { id: 'rabbit', name: '小兔', pounds: 0 },
    { id: 'chick', name: '小雞', pounds: 0 },
  ]
  const missed = []
  const correctIds = []
  const timers = new Set()
  let rootEl = null
  let roundIndex = 0
  let correct = 0
  let coins = 0
  let poundsTenths = 0
  let lureLevel = 1
  let baitUsed = false
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

  function animateMascot(frames, duration = 800) {
    clearMascotAnimation()
    const mascot = rootEl?.querySelector('[data-mascot]')
    if (!mascot) return
    let frame = 0
    mascot.src = frames[frame]
    mascotInterval = setInterval(() => {
      if (destroyed || !mascot.isConnected) return
      frame = (frame + 1) % frames.length
      mascot.src = frames[frame]
    }, 115)
    mascotStopTimer = schedule(() => {
      clearMascotAnimation()
      if (mascot.isConnected) mascot.src = ART.mascot
    }, duration)
  }

  function botLabel() {
    return bots.map((bot) => `
      <span class="fish-bot" data-fish-bot="${bot.id}">
        <img src="${ART.fishIcon}" alt="" /><b>${escapeHtml(bot.name)}</b><span data-bot-pounds>${(bot.pounds / 10).toFixed(1)} 磅</span>
      </span>`).join('')
  }

  function updateHud() {
    if (!rootEl) return
    const coinsEl = rootEl.querySelector('[data-coins]')
    const baitEl = rootEl.querySelector('[data-bait]')
    const poundsEl = rootEl.querySelector('[data-pounds]')
    const lureEl = rootEl.querySelector('[data-lure]')
    if (coinsEl) coinsEl.textContent = String(coins)
    if (baitEl) baitEl.textContent = String(Math.max(0, rounds.length - roundIndex - (baitUsed ? 1 : 0)))
    if (poundsEl) poundsEl.textContent = `${(poundsTenths / 10).toFixed(1)}`
    if (lureEl) lureEl.textContent = `Lv.${lureLevel}`
    bots.forEach((bot) => {
      const score = rootEl.querySelector(`[data-fish-bot="${bot.id}"] [data-bot-pounds]`)
      if (score) score.textContent = `${(bot.pounds / 10).toFixed(1)} 磅`
    })
  }

  function shell(content, footer = '') {
    const remainingBait = Math.max(0, rounds.length - roundIndex - (baitUsed ? 1 : 0))
    return `
      <main class="fish-game">
        <header class="fish-topline">
          <div class="fish-title"><span aria-hidden="true">🎣</span><div><strong>釣魚湖</strong><small>第 ${Math.min(roundIndex + 1, rounds.length)} / ${rounds.length} 竿</small></div></div>
          <div class="fish-hud">
            <div class="fish-stat"><img src="${ART.coin}" alt="" /><small>金幣</small><b data-coins>${coins}</b></div>
            <div class="fish-stat"><img src="${ART.bait}" alt="" /><small>魚餌</small><b data-bait>${remainingBait}</b></div>
            <div class="fish-stat"><img src="${ART.fishIcon}" alt="" /><small>磅數</small><b data-pounds>${(poundsTenths / 10).toFixed(1)}</b></div>
          </div>
        </header>
        <div class="fish-lure-line"><span>魚餌等級 <b data-lure>Lv.${lureLevel}</b></span><span class="fish-bots">${botLabel()}</span></div>
        ${content}
        ${footer}
      </main>`
  }

  function lakeMarkup(status, mode = '') {
    return `
      <section class="fish-lake ${mode}" aria-label="釣魚湖景色">
        <div class="fish-waterline" aria-hidden="true"></div>
        <img class="fish-lake-fish" src="${ART.fishByRarity.common}" alt="" />
        <img class="fish-ripple" data-ripple src="${ART.ripple}" alt="" />
        <img class="fish-splash" data-splash src="${ART.splash}" alt="" />
        <img class="fish-pier-art" src="${ART.pier}" alt="木碼頭" />
        <img class="fish-mascot" data-mascot src="${ART.mascot}" alt="字學貓坐在碼頭上釣魚" />
        <img class="fish-bucket" src="${ART.bucket}" alt="魚桶" />
        <p class="fish-scene-status" data-status aria-live="polite">${escapeHtml(status)}</p>
      </section>`
  }

  function renderReady() {
    if (destroyed || finished || !rootEl) return
    locked = false
    clearMascotAnimation()
    const cost = lureLevel === 1 ? 8 : 15
    const canUpgrade = lureLevel < 3 && coins >= cost
    rootEl.innerHTML = shell(`
      ${lakeMarkup('魚兒喺湖入面游緊。')}
      <section class="fish-ready-card">
        <div class="fish-ready-copy"><strong>準備好未？</strong><span>拋竿等魚咬鉤，再答啱英文釣起魚。</span></div>
        <button type="button" class="fish-cast-button" data-cast><span aria-hidden="true">🎣</span> 拋竿釣魚</button>
      </section>`, `
      <div class="fish-upgrade-strip">
        <img src="${ART.bait}" alt="" />
        <span><b>魚餌升級</b><small>提高稀有魚機會 · ${lureLevel >= 3 ? '已滿級' : `需要 ${cost} 金幣`}</small></span>
        <button type="button" data-upgrade ${canUpgrade ? '' : 'disabled'}>${lureLevel >= 3 ? '滿級' : `升級 ${cost}`}</button>
      </div>`)
    rootEl.querySelector('[data-cast]').addEventListener('click', cast)
    rootEl.querySelector('[data-upgrade]').addEventListener('click', upgradeLure)
  }

  function upgradeLure() {
    if (lureLevel >= 3 || locked || finished) return
    const cost = lureLevel === 1 ? 8 : 15
    if (coins < cost) return
    audio.tap()
    coins -= cost
    lureLevel += 1
    renderReady()
  }

  function cast() {
    if (locked || destroyed || finished || roundIndex >= rounds.length) return
    locked = true
    baitUsed = true
    audio.tap()
    const status = rootEl.querySelector('[data-status]')
    const lake = rootEl.querySelector('.fish-lake')
    const castButton = rootEl.querySelector('[data-cast]')
    if (castButton) castButton.disabled = true
    updateHud()
    if (status) status.textContent = '魚餌落水中…'
    lake?.classList.add('is-casting')
    animateMascot(ART.cast, 1150)
    schedule(() => {
      lake?.classList.add('has-bite')
      const ripple = rootEl?.querySelector('[data-ripple]')
      ripple?.classList.add('is-visible')
      const currentStatus = rootEl?.querySelector('[data-status]')
      if (currentStatus) currentStatus.textContent = '有魚咬鉤啦！'
      audio.tap()
      schedule(renderQuestion, 500)
    }, 760)
  }

  function renderQuestion() {
    if (destroyed || finished || !rootEl) return
    locked = false
    clearMascotAnimation()
    if (roundIndex >= rounds.length) {
      finish()
      return
    }
    const word = rounds[roundIndex]
    const options = shuffle([word, ...distractors(answerPool, word, 3)])
    rootEl.innerHTML = shell(`
      ${lakeMarkup('有魚咬鉤啦！快揀啱英文！', 'has-bite')}
      <section class="fish-question-card">
        <div class="fish-question-head">
          <img class="fish-prompt-img" src="${escapeHtml(imagePath(word.image))}" alt="詞語圖片提示" />
          <div><strong>睇圖揀英文</strong><small>咬緊鉤，要快啲回答！</small><button type="button" class="speak-btn fish-speak" data-speak>🔊 聽英文</button></div>
        </div>
        <div class="fish-choices" data-choices></div>
        <p class="fish-feedback" data-feedback aria-live="polite"></p>
      </section>`)
    const choiceBox = rootEl.querySelector('[data-choices]')
    options.forEach((option) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'fish-choice'
      button.dataset.choice = String(option.id)
      button.textContent = option.en
      button.addEventListener('click', () => answer(option, button, word))
      choiceBox.appendChild(button)
    })
    rootEl.querySelector('[data-speak]').addEventListener('click', () => {
      audio.tap()
      audio.speak(word.en)
    })
  }

  function answer(option, button, word) {
    if (locked || destroyed || finished) return
    locked = true
    const choices = [...rootEl.querySelectorAll('.fish-choice')]
    choices.forEach((choice) => { choice.disabled = true })
    const feedback = rootEl.querySelector('[data-feedback]')
    const lake = rootEl.querySelector('.fish-lake')
    const splash = rootEl.querySelector('[data-splash]')
    if (String(option.id) === String(word.id)) {
      button.classList.add('is-correct')
      const fish = fishForLure(lureLevel)
      const gainedTenths = fish.pounds + (lureLevel - 1) * 2
      const coinGain = Math.max(1, Math.ceil((gainedTenths / 10) * 2))
      correct += 1
      correctIds.push(word.id)
      poundsTenths += gainedTenths
      coins += coinGain
      onCorrect?.(word)
      audio.speakOnCorrect(word.en)
      lake?.classList.add('is-caught')
      splash?.classList.add('is-visible')
      animateMascot(ART.fish, 1000)
      feedback.className = 'fish-feedback is-good'
      feedback.innerHTML = `<img src="${ART.fishByRarity[fish.id]}" alt="" /><span>釣到${fish.name}！+${(gainedTenths / 10).toFixed(1)} 磅 · +${coinGain} 金幣</span>`
    } else {
      button.classList.add('is-wrong')
      const right = choices.find((choice) => choice.dataset.choice === String(word.id))
      right?.classList.add('is-correct')
      feedback.className = 'fish-feedback is-missed'
      feedback.textContent = `魚兒游走咗～答案係 ${word.en}`
      audio.wrong()
      missed.push(word.id)
    }
    schedule(finishBeat, 1250)
  }

  function finishBeat() {
    if (destroyed || finished) return
    bots.forEach((bot, index) => {
      bot.pounds += (index === 0 ? 8 : 7) + Math.floor(Math.random() * 10)
    })
    roundIndex += 1
    baitUsed = false
    if (roundIndex >= rounds.length) finish()
    else renderReady()
  }

  function standings() {
    return [{ id: 'player', name: '字學貓', pounds: poundsTenths }, ...bots]
      .sort((a, b) => b.pounds - a.pounds)
  }

  function finish() {
    if (finished || destroyed) return
    finished = true
    clearMascotAnimation()
    const rank = standings()
    const place = rank.findIndex((entry) => entry.id === 'player') + 1
    const winner = rank[0]
    const label = winner.id === 'player' ? '你釣到最多磅數！' : `${winner.name}今次釣得最重，再試一次！`
    rootEl.innerHTML = shell(`
      <section class="fish-finish-card">
        <img class="fish-finish-mascot" src="${ART.mascot}" alt="字學貓同你慶祝" />
        <img class="fish-finish-sparkle" src="${ART.sparkle}" alt="" />
        <h2>${escapeHtml(label)}</h2>
        <p>你釣到 <strong>${(poundsTenths / 10).toFixed(1)} 磅</strong> · 第 ${place} 名</p>
        <div class="fish-finish-ranks">${rank.map((entry, index) => `<div><span>${index + 1}</span><b>${escapeHtml(entry.name)}</b><strong>${(entry.pounds / 10).toFixed(1)} 磅</strong></div>`).join('')}</div>
      </section>`, `<div class="fish-finish-coins"><img src="${ART.coin}" alt="" /><b>金幣 ${coins}</b><span>魚餌等級 Lv.${lureLevel}</span></div>`)
    updateHud()
    schedule(() => onDone?.({
      correct,
      total: rounds.length,
      coins,
      missed,
      correctIds,
      meta: { pounds: poundsTenths / 10, lure: lureLevel, bots: bots.map(({ id, name, pounds: score }) => ({ id, name, pounds: score / 10 })), place },
    }), 1450)
  }

  function clearAll() {
    timers.forEach((timer) => clearTimeout(timer))
    timers.clear()
    clearMascotAnimation()
  }

  function mount(root) {
    rootEl = root
    if (!rounds.length) {
      rootEl.innerHTML = '<div class="fish-empty">呢個主題暫時冇詞語可以釣魚。</div>'
      finished = true
      onDone?.({ correct: 0, total: 0, coins: 0, missed, correctIds, meta: { pounds: 0, lure: lureLevel, bots, place: 1 } })
      return
    }
    renderReady()
  }

  function destroy() {
    destroyed = true
    clearAll()
    rootEl = null
  }

  return { mount, destroy }
}
