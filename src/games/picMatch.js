import { distractors, shuffle } from '../lib/vocab.js'
import * as audio from '../lib/audio.js'

export function createPicMatch({ words, pool, onDone, roundSize = 8 }) {
  const rounds = shuffle(words).slice(0, Math.min(roundSize, words.length))
  let i = 0
  let correct = 0
  let coins = 0
  const missed = []

  function render(root) {
    if (i >= rounds.length) {
      onDone({ correct, total: rounds.length, coins, missed })
      return
    }
    const w = rounds[i]
    const opts = shuffle([w, ...distractors(pool.length ? pool : words, w, 3)])
    root.innerHTML = `
      <div class="play-hud"><span>第 ${i + 1} / ${rounds.length} 題</span><span>⭐ ${correct}</span></div>
      <p class="hint">揀啱嘅圖</p>
      <div class="en-word">${w.en}</div>
      <div class="zh-gloss">${w.zhHant}</div>
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
      b.innerHTML = `<img src="/${o.image}" alt="${o.en}" /><span>${o.en}</span>`
      b.addEventListener('click', () => pick(o, b, root, opts))
      box.appendChild(b)
    })
    root.querySelector('[data-speak]').onclick = () => {
      audio.tap()
      audio.speak(w.en)
    }
  }

  function pick(o, btn, root, opts) {
    const w = rounds[i]
    const buttons = [...root.querySelectorAll('.choice')]
    buttons.forEach((b) => (b.disabled = true))
    const fb = root.querySelector('#fb')
    if (o.id === w.id) {
      btn.classList.add('correct')
      audio.correct()
      correct++
      coins += 2
      fb.className = 'feedback ok'
      fb.textContent = '好叻！'
    } else {
      btn.classList.add('wrong')
      audio.wrong()
      missed.push(w.id)
      const right = buttons.find((b) => b.dataset.choice === w.id)
      if (right) right.classList.add('correct')
      fb.className = 'feedback bad'
      fb.textContent = `再睇吓～係 ${w.en}`
    }
    setTimeout(() => {
      i++
      render(root)
    }, 900)
  }

  return { mount(root) { render(root) } }
}
