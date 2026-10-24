import { distractors, shuffle } from '../lib/vocab.js'
import * as audio from '../lib/audio.js'

/** Word Race — correct answers move Momo along a track. */
export function createWordRace({ words, pool, onDone, onCorrect, roundSize = 8 }) {
  const rounds = shuffle(words).slice(0, Math.min(roundSize, words.length))
  let i = 0
  let correct = 0
  let coins = 0
  const missed = []
  const correctIds = []

  function trackPct() {
    return Math.round((correct / Math.max(1, rounds.length)) * 100)
  }

  function render(root) {
    if (i >= rounds.length) {
      onDone({ correct, total: rounds.length, coins, missed, correctIds })
      return
    }
    const w = rounds[i]
    const opts = shuffle([w, ...distractors(pool.length ? pool : words, w, 3)])
    const pct = trackPct()
    root.innerHTML = `
      <div class="play-hud"><span>第 ${i + 1} / ${rounds.length} 題</span><span>🏁 詞語賽跑</span></div>
      <div class="race-track" aria-hidden="true">
        <div class="race-lane">
          <img class="race-runner" src="/art/mascot/cat_front.webp" alt="" style="left:${pct}%" />
          <div class="race-finish">🏁</div>
        </div>
        <div class="race-progress">${correct}/${rounds.length}</div>
      </div>
      <img class="prompt-img" src="/${w.image}" alt="" />
      <p class="hint">答啱就向前跑！</p>
      <button type="button" class="speak-btn" data-speak>🔊 聽英文</button>
      <div class="choices list"></div>
      <div class="feedback" id="fb"></div>
    `
    const box = root.querySelector('.choices')
    opts.forEach((o) => {
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'choice'
      b.dataset.choice = o.id
      b.textContent = o.en
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
    if (o.id === w.id) {
      btn.classList.add('correct')
      audio.speakOnCorrect(w.en)
      correct++
      correctIds.push(w.id)
      coins += 2
      onCorrect?.(w)
      fb.className = 'feedback ok'
      fb.textContent = '衝呀！'
      const runner = root.querySelector('.race-runner')
      if (runner) runner.style.left = `${trackPct()}%`
    } else {
      btn.classList.add('wrong')
      audio.wrong()
      missed.push(w.id)
      const right = buttons.find((b) => b.dataset.choice === w.id)
      if (right) right.classList.add('correct')
      fb.className = 'feedback bad'
      fb.textContent = `慢咗一步～係 ${w.en}`
    }
    setTimeout(() => {
      i++
      render(root)
    }, 900)
  }

  return { mount(root) { render(root) } }
}
