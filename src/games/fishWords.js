import { distractors, shuffle } from '../lib/vocab.js'

function uniqueWords(list) {
  const seen = new Set()
  return (Array.isArray(list) ? list : []).filter((word) => {
    if (!word || word.id == null || seen.has(String(word.id))) return false
    seen.add(String(word.id))
    return true
  })
}

function createLiveRegion(host) {
  const live = document.createElement('div')
  live.className = 'fish-phaser-live'
  live.setAttribute('aria-live', 'polite')
  live.setAttribute('aria-atomic', 'true')
  Object.assign(live.style, {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: '0',
  })
  host.appendChild(live)
  return live
}

/**
 * Phaser fishing game. Phaser itself and its scene are loaded only when this
 * game is mounted, so the other WordJoy games do not pay the engine startup
 * cost.
 */
export function createFishWords({ words, pool, onDone, onCorrect, roundSize = 8 }) {
  const source = uniqueWords(words)
  const requestedRounds = Number.isFinite(Number(roundSize))
    ? Math.max(0, Math.floor(Number(roundSize)))
    : 8
  const rounds = shuffle(source).slice(0, Math.min(requestedRounds, source.length))
  const answerPool = uniqueWords(Array.isArray(pool) && pool.length ? pool : source)

  let rootEl = null
  let hostEl = null
  let liveRegion = null
  let game = null
  let disposeGame = null
  let destroyed = false
  let mounted = false

  function announce(message) {
    if (liveRegion) liveRegion.textContent = String(message ?? '')
  }

  function mount(root) {
    if (destroyed || mounted || !root) return
    mounted = true
    rootEl = root

    if (!rounds.length) {
      rootEl.innerHTML = '<div class="fish-empty">呢個主題暫時冇詞語可以釣魚。</div>'
      onDone?.({
        correct: 0,
        total: 0,
        coins: 0,
        missed: [],
        correctIds: [],
        meta: {
          pounds: 0,
          lure: 1,
          bots: [
            { id: 'rabbit', name: '小兔', pounds: 0 },
            { id: 'chick', name: '小雞', pounds: 0 },
          ],
          place: 1,
        },
      })
      return
    }

    rootEl.replaceChildren()
    Object.assign(rootEl.style, {
      display: 'block',
      position: 'relative',
      width: '100%',
      height: '100%',
      minHeight: '0',
      padding: '0',
      overflow: 'hidden',
      touchAction: 'none',
    })

    hostEl = document.createElement('div')
    hostEl.className = 'fish-phaser-host'
    hostEl.setAttribute('aria-label', '釣魚湖遊戲')
    Object.assign(hostEl.style, {
      position: 'relative',
      width: '100%',
      height: '100%',
      minHeight: '0',
      overflow: 'hidden',
      touchAction: 'none',
      background: '#E8F0E4',
    })
    rootEl.appendChild(hostEl)
    liveRegion = createLiveRegion(hostEl)

    // Keep this dynamic: play.js imports this factory with the DOM games, but
    // Phaser should only enter the page when the fishing game is mounted.
    import('./phaser/boot.js')
      .then(({ createGame, destroyGame }) => {
        if (destroyed || !hostEl) return
        disposeGame = destroyGame
        game = createGame(hostEl, {
          rounds,
          pool: answerPool,
          onDone,
          onCorrect,
          announce,
        })
      })
      .catch((error) => {
        if (destroyed || !hostEl) return
        console.error('Unable to load the Phaser fishing game.', error)
        hostEl.replaceChildren()
        hostEl.textContent = '釣魚湖暫時未能載入，請重新入場。'
        Object.assign(hostEl.style, {
          display: 'grid',
          placeItems: 'center',
          color: '#5C4A3A',
          fontWeight: '700',
        })
      })
  }

  function destroy() {
    if (destroyed) return
    destroyed = true
    if (game) {
      if (disposeGame) disposeGame(game)
      else game.destroy(true)
      game = null
    }
    hostEl?.remove()
    hostEl = null
    liveRegion = null
    rootEl = null
  }

  return { mount, destroy }
}
