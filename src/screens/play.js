import { loadVocab, filterByBandTheme } from '../lib/vocab.js'
import { createPicMatch } from '../games/picMatch.js'
import { createSpeedStar } from '../games/speedStar.js'
import { createTreasureTap } from '../games/treasureTap.js'

export async function renderPlay(root, state, nav) {
  const all = await loadVocab()
  const words = filterByBandTheme(all, state.band, state.theme)
  const pool = filterByBandTheme(all, state.band, state.theme)
  if (!words.length) {
    root.innerHTML = `<div class="screen"><p>呢個主題暫時未有字。</p>
      <button type="button" class="back" id="b">返去</button></div>`
    root.querySelector('#b').onclick = () => nav({ screen: 'games', band: state.band, theme: state.theme })
    return
  }

  root.innerHTML = `<div class="screen" id="game-root"></div>`
  const mount = root.querySelector('#game-root')

  const onDone = (result) => {
    nav({
      screen: 'results',
      band: state.band,
      theme: state.theme,
      game: state.game,
      result,
    })
  }

  const opts = { words, pool, onDone, roundSize: 8 }
  let game
  if (state.game === 'speed_star') game = createSpeedStar(opts)
  else if (state.game === 'treasure_tap') game = createTreasureTap(opts)
  else game = createPicMatch(opts)

  game.mount(mount)
  return () => game.destroy && game.destroy()
}
