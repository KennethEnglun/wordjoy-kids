import { shuffle } from '../lib/vocab.js'
import * as audio from '../lib/audio.js'

const CLEAR_BONUS = 5
const PAIR_REWARD = 2
const ART = {
  board: '/art/games/memory/memory_board_frame.webp',
  back: '/art/games/memory/memory_tile_back.webp',
  face: '/art/games/memory/memory_tile_face_frame.webp',
  tree: '/art/games/memory/memory_tile_icon_tree.webp',
  stump: '/art/games/memory/memory_prop_stump_books.webp',
  lantern: '/art/games/memory/memory_prop_lantern.webp',
  sparkle: '/art/games/memory/memory_fx_match_sparkle.webp',
  paw: '/art/games/memory/memory_icon_paw.webp',
  alarm: '/art/games/memory/memory_icon_alarm.webp',
  bubble: '/art/games/memory/memory_think_bubble.webp',
  mascot: '/art/games/memory/memory_mascot_think.webp',
  think: [1, 2, 3, 4].map((frame) => `/art/games/anim/zxm_think_0${frame}.webp`),
  coin: '/art/games/shared/hud_coin_icon.webp',
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

/** 對對碰 — flip picture/English pairs from the same word set and clear the board. */
export function createPicMatch({ words, pool, onDone, onCorrect, roundSize = 8 }) {
  const source = uniqueWords(words)
  const requested = Number.isFinite(Number(roundSize))
    ? Math.max(1, Math.floor(Number(roundSize)))
    : 8
  const requestedPairs = requested > 6 ? Math.round(requested / 2) : requested
  const pairCount = Math.min(source.length, Math.max(1, Math.min(6, requestedPairs)))
  const pairs = shuffle(source).slice(0, pairCount)
  const cards = shuffle(pairs.flatMap((word, index) => [
    { key: `${String(word.id)}:picture`, word, kind: 'picture', pairKey: String(word.id), index },
    { key: `${String(word.id)}:word`, word, kind: 'word', pairKey: String(word.id), index },
  ]))
  const matched = new Set()
  const missedIds = new Map()
  const correctIds = []
  const timers = new Set()
  let rootEl = null
  let openCards = []
  let moves = 0
  let coins = 0
  let seconds = 0
  let startedAt = 0
  let elapsedInterval = null
  let locked = false
  let audioOn = false
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

  function animateMascot(duration = 1000) {
    clearMascotAnimation()
    const mascot = rootEl?.querySelector('[data-mascot]')
    if (!mascot) return
    let frame = 0
    mascot.src = ART.think[frame]
    mascotInterval = setInterval(() => {
      if (destroyed || !mascot.isConnected) return
      frame = (frame + 1) % ART.think.length
      mascot.src = ART.think[frame]
    }, 125)
    mascotStopTimer = schedule(() => {
      clearMascotAnimation()
      if (mascot.isConnected) mascot.src = ART.mascot
    }, duration)
  }

  function updateHud() {
    if (!rootEl) return
    const movesEl = rootEl.querySelector('[data-moves]')
    const pairsEl = rootEl.querySelector('[data-pairs]')
    const timeEl = rootEl.querySelector('[data-time]')
    const coinEl = rootEl.querySelector('[data-coins]')
    const audioButton = rootEl.querySelector('[data-audio-toggle]')
    if (movesEl) movesEl.textContent = String(moves)
    if (pairsEl) pairsEl.textContent = `${matched.size} / ${pairCount}`
    if (timeEl) timeEl.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
    if (coinEl) coinEl.textContent = String(coins)
    if (audioButton) {
      audioButton.textContent = audioOn ? '🔊 讀字：開' : '🔈 讀字：關'
      audioButton.setAttribute('aria-pressed', String(audioOn))
    }
  }

  function shell(content, subtitle = '') {
    return `
      <main class="memory-game">
        <header class="memory-topline">
          <div class="memory-title"><span aria-hidden="true">✿</span><div><strong>對對碰</strong><small>${escapeHtml(subtitle || '翻開圖卡，搵出英文配對')}</small></div></div>
          <div class="memory-stats">
            <div><img src="${ART.paw}" alt="" /><small>步數</small><b data-moves>${moves}</b></div>
            <div><img src="${ART.alarm}" alt="" /><small>時間</small><b data-time>${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}</b></div>
          </div>
        </header>
        <div class="memory-progress-line"><span>配對</span><b data-pairs>${matched.size} / ${pairCount}</b><span class="memory-coin-count"><img src="${ART.coin}" alt="" /><span>金幣</span><b data-coins>${coins}</b></span></div>
        ${content}
      </main>`
  }

  function makeCard(card) {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'memory-card is-down'
    button.dataset.cardKey = card.key
    button.dataset.pairKey = card.pairKey
    button.dataset.kind = card.kind
    button.dataset.wordId = String(card.word.id)
    button.setAttribute('aria-label', '記憶卡，未翻開')
    button.innerHTML = `
      <span class="memory-card-inner">
        <span class="memory-card-side memory-card-back" style="--memory-back: url('${ART.back}')">
          <img class="memory-card-tree" src="${ART.tree}" alt="" />
        </span>
        <span class="memory-card-side memory-card-front" style="--memory-face: url('${ART.face}')">
          ${card.kind === 'picture'
            ? `<img class="memory-card-picture" src="${escapeHtml(imagePath(card.word.image))}" alt="${escapeHtml(card.word.en)}" />`
            : `<strong class="memory-card-word">${escapeHtml(card.word.en)}</strong>`}
          <img class="memory-match-sparkle" src="${ART.sparkle}" alt="" />
        </span>
      </span>`
    button.addEventListener('click', () => flip(card, button))
    return button
  }

  function renderBoard() {
    if (destroyed || finished || !rootEl) return
    rootEl.innerHTML = shell(`
      <div class="memory-mascot-row">
        <div class="memory-mascot-bubble" style="--memory-bubble: url('${ART.bubble}')"><span>記住圖同英文嘅位置呀！</span></div>
        <img class="memory-mascot" data-mascot src="${ART.mascot}" alt="字學貓諗緊配對" />
      </div>
      <section class="memory-board" style="--memory-board: url('${ART.board}')" aria-label="配對記憶卡">
        <div class="memory-grid" data-grid></div>
      </section>
      <div class="memory-tool-row"><button class="memory-audio-toggle" type="button" data-audio-toggle aria-pressed="false">🔈 讀字：關</button><p data-feedback aria-live="polite">翻開兩張卡，配對圖片同英文。</p></div>
      <div class="memory-props"><img src="${ART.stump}" alt="書本樹樁裝飾" /><img src="${ART.lantern}" alt="森林燈籠裝飾" /></div>`, '記憶配對')
    const grid = rootEl.querySelector('[data-grid]')
    cards.forEach((card) => grid.appendChild(makeCard(card)))
    rootEl.querySelector('[data-audio-toggle]').addEventListener('click', () => {
      audio.tap()
      audioOn = !audioOn
      updateHud()
    })
    if (!startedAt) {
      startedAt = Date.now()
      elapsedInterval = setInterval(() => {
        if (destroyed || finished) return
        seconds = Math.floor((Date.now() - startedAt) / 1000)
        updateHud()
      }, 500)
    }
    updateHud()
  }

  function flip(card, button) {
    if (locked || destroyed || finished || matched.has(card.pairKey) || button.classList.contains('is-up')) return
    audio.tap()
    button.classList.remove('is-down')
    button.classList.add('is-up')
    button.setAttribute('aria-label', card.kind === 'picture' ? `圖片卡：${card.word.en}` : `英文卡：${card.word.en}`)
    if (audioOn) audio.speak(card.word.en)
    openCards.push({ card, button })
    const feedback = rootEl.querySelector('[data-feedback]')
    if (openCards.length < 2) {
      if (feedback) feedback.textContent = '再翻一張卡，試吓配對！'
      return
    }
    moves += 1
    updateHud()
    locked = true
    const [first, second] = openCards
    const isMatch = first.card.pairKey === second.card.pairKey && first.card.kind !== second.card.kind
    if (isMatch) {
      matched.add(first.card.pairKey)
      correctIds.push(first.card.word.id)
      coins += PAIR_REWARD
      first.button.classList.add('is-matched')
      second.button.classList.add('is-matched')
      first.button.setAttribute('aria-label', `已配對：${first.card.word.en}`)
      second.button.setAttribute('aria-label', `已配對：${second.card.word.en}`)
      if (feedback) feedback.textContent = `配對成功！+${PAIR_REWARD} 金幣`
      onCorrect?.(first.card.word)
      audio.speakOnCorrect(first.card.word.en)
      animateMascot(1100)
      updateHud()
      schedule(() => {
        openCards = []
        locked = false
        if (matched.size === pairCount) finish()
      }, 720)
      return
    }
    missedIds.set(first.card.pairKey, first.card.word.id)
    missedIds.set(second.card.pairKey, second.card.word.id)
    if (feedback) feedback.textContent = '未係呢一對，記住位置再試！'
    audio.wrong()
    animateMascot(1000)
    schedule(() => {
      first.button.classList.remove('is-up')
      first.button.classList.add('is-down')
      second.button.classList.remove('is-up')
      second.button.classList.add('is-down')
      first.button.setAttribute('aria-label', '記憶卡，未翻開')
      second.button.setAttribute('aria-label', '記憶卡，未翻開')
      openCards = []
      locked = false
      if (feedback) feedback.textContent = '再試一次，你記得位置！'
    }, 900)
  }

  function finish() {
    if (finished || destroyed) return
    finished = true
    if (elapsedInterval) clearInterval(elapsedInterval)
    elapsedInterval = null
    clearMascotAnimation()
    seconds = Math.floor((Date.now() - startedAt) / 1000)
    const clearBonus = CLEAR_BONUS
    coins += clearBonus
    rootEl.innerHTML = shell(`
      <section class="memory-finish-card">
        <div class="memory-finish-top"><img src="${ART.sparkle}" alt="" /><img class="memory-finish-mascot" src="${ART.mascot}" alt="字學貓為你慶祝" /><img src="${ART.sparkle}" alt="" /></div>
        <h2>全部配對成功！</h2>
        <p>完成 ${pairCount} 對，用咗 <strong>${moves}</strong> 步 · 時間 ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}</p>
        <div class="memory-finish-reward"><img src="${ART.coin}" alt="" /><b>${coins} 金幣</b><span>配對 ${pairCount * PAIR_REWARD} + 清板獎勵 ${clearBonus}</span></div>
      </section>`, '記憶大成功')
    updateHud()
    schedule(() => onDone?.({
      correct: matched.size,
      total: pairCount,
      coins,
      missed: [...missedIds.values()],
      correctIds,
      meta: { moves, pairs: pairCount, clearBonus, seconds },
    }), 1350)
  }

  function clearAll() {
    if (elapsedInterval) clearInterval(elapsedInterval)
    elapsedInterval = null
    timers.forEach((timer) => clearTimeout(timer))
    timers.clear()
    clearMascotAnimation()
  }

  function mount(root) {
    rootEl = root
    if (!pairs.length) {
      rootEl.innerHTML = '<div class="memory-empty">呢個主題暫時冇詞語可以配對。</div>'
      finished = true
      onDone?.({ correct: 0, total: 0, coins: 0, missed: [], correctIds, meta: { moves: 0, pairs: 0, clearBonus: 0, seconds: 0 } })
      return
    }
    renderBoard()
  }

  function destroy() {
    destroyed = true
    clearAll()
    rootEl = null
  }

  return { mount, destroy }
}
