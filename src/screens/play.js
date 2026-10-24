import { loadVocab, filterByBandTheme, prioritizeWords } from '../lib/vocab.js'
import { createPicMatch } from '../games/picMatch.js'
import { createSpeedStar } from '../games/speedStar.js'
import { createTreasureTap } from '../games/treasureTap.js'
import { createWordRace } from '../games/wordRace.js'
import { createFishWords } from '../games/fishWords.js'
import { createCafeOrder } from '../games/cafeOrder.js'
import {
  getActiveProfile,
  clearReviewed,
  checkSessionAllowed,
  startPlaySession,
  getWeeklyThemes,
} from '../lib/storage.js'
import { momoImg } from '../lib/mascot.js'

function isReviewState(state) {
  return (
    state.game === 'review' ||
    state.theme === '__review__' ||
    state.theme === 'review' ||
    state.band === 'review'
  )
}

export async function renderPlay(root, state, nav) {
  const gate = checkSessionAllowed()
  if (!gate.allowed) {
    root.innerHTML = `
      <div class="screen empty-state">
        ${momoImg('think', '字學貓', 'momo-mascot joy-results')}
        <h1>時間到啦</h1>
        <p class="hint">${gate.reason}</p>
        <div class="actions">
          <button type="button" class="primary" data-home>返主頁</button>
        </div>
      </div>`
    root.querySelector('[data-home]').onclick = () => nav({ screen: 'home' })
    return
  }
  startPlaySession()

  const all = await loadVocab()
  const review = isReviewState(state)
  let words
  let pool

  if (review) {
    const bag = getActiveProfile()?.reviewBag || []
    const byId = new Map(all.map((w) => [w.id, w]))
    words = bag.map((id) => byId.get(id)).filter(Boolean)
    pool = all
    if (!words.length) {
      root.innerHTML = `
        <div class="screen empty-state">
          <div class="empty-emoji">🧺</div>
          <h1>複習袋空咗</h1>
          <p class="hint">玩多幾局，答錯嘅字會自動放入嚟。</p>
          <div class="actions">
            <button type="button" class="primary" data-home>返主頁</button>
          </div>
        </div>`
      root.querySelector('[data-home]').onclick = () => nav({ screen: 'home' })
      return
    }
  } else {
    words = filterByBandTheme(all, state.band, state.theme)
    pool = filterByBandTheme(all, state.band, state.theme)
    if (!words.length) {
      root.innerHTML = `<div class="screen"><p>呢個主題暫時未有字。</p>
        <button type="button" class="back" id="b">返去</button></div>`
      root.querySelector('#b').onclick = () =>
        nav({ screen: 'games', band: state.band, theme: state.theme })
      return
    }
  }

  words = prioritizeWords(words, getWeeklyThemes())

  root.innerHTML = `<div class="screen" id="game-root"></div>`
  const mount = root.querySelector('#game-root')

  const onDone = (result) => {
    nav({
      screen: 'results',
      band: review ? 'review' : state.band,
      theme: review ? 'review' : state.theme,
      game: state.game,
      result,
    })
  }

  const onCorrect = (w) => clearReviewed([w.id])
  const opts = { words, pool, onDone, onCorrect, roundSize: 8 }
  let game
  const g = review ? 'pic_match' : state.game
  if (g === 'speed_star') game = createSpeedStar(opts)
  else if (g === 'treasure_tap') game = createTreasureTap(opts)
  else if (g === 'word_race') game = createWordRace(opts)
  else if (g === 'fish_words') game = createFishWords(opts)
  else if (g === 'cafe_order') game = createCafeOrder(opts)
  else game = createPicMatch(opts)

  game.mount(mount)
  return () => game.destroy && game.destroy()
}
