import { distractors, shuffle } from '../lib/vocab.js'
import * as audio from '../lib/audio.js'

/** Fish Words — cast, answer, reel the word-fish. */
export function createFishWords({ words, pool, onDone, onCorrect, roundSize = 8 }) {
  const rounds = shuffle(words).slice(0, Math.min(roundSize, words.length))
  let i = 0
  let correct = 0
  let coins = 0
  const missed = []
  const correctIds = []

  function render(root) {
    if (i >= rounds.length) {
      onDone({ correct, total: rounds.length, coins, missed, correctIds })
      return
    }
    const w = rounds[i]
    const opts = shuffle([w, ...distractors(pool.length ? pool : words, w, 3)])
    root.innerHTML = `
      <div class="play-hud"><span>第 ${i + 1} / ${rounds.length} 題</span><span>🎣 釣單字</span></div>
      <div class="fish-pond">
        <div class="fish-bob">🎣</div>
        <img class="prompt-img fish-target" src="/${w.image}" alt="" />
        <p class="en-word">${w.en}</p>
        <p class="zh-gloss">${w.zhHant}</p>
      </div>
      <p class="hint">揀啱英文，釣起條魚！</p>
      <button type="button" class="speak-btn" data-speak>🔊 聽英文</button>
      <div class="choices"></div>
      <div class="feedback" id="fb"></div>
    `
    const box = root.querySelector('.choices')
    opts.forEach((o) => {
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'choice'
      b.dataset.choice = o.id
      b.innerHTML = `<span>${o.en}</span>`
      b.addEventListener('click', () => pick(o, b, root))
      box.appendChild(b)
    })
    root.querySelector('[data-speak]').onclick = () => {
      audio.tap()
      audio.speak(w.en)
    }
  }

  function pick(o, btn, root) {
    const w = rounds[i]
    const buttons = [...root.querySelectorAll('.choice')]
    buttons.forEach((b) => (b.disabled = true))
    const fb = root.querySelector('#fb')
    const pond = root.querySelector('.fish-pond')
    if (o.id === w.id) {
      btn.classList.add('correct')
      audio.speakOnCorrect(w.en)
      correct++
      correctIds.push(w.id)
      coins += 3
      onCorrect?.(w)
      pond?.classList.add('caught')
      fb.className = 'feedback ok'
      fb.textContent = '釣到啦！🐟'
    } else {
      btn.classList.add('wrong')
      audio.wrong()
      missed.push(w.id)
      const right = buttons.find((b) => b.dataset.choice === w.id)
      if (right) right.classList.add('correct')
      fb.className = 'feedback bad'
      fb.textContent = `走咗魚～係 ${w.en}`
    }
    setTimeout(() => {
      i++
      render(root)
    }, 1000)
  }

  return { mount(root) { render(root) } }
}
