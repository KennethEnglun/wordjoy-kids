import { distractors, shuffle } from '../lib/vocab.js'
import * as audio from '../lib/audio.js'

/** Café Order — 字學貓 orders a snack; pick the matching picture. */
export function createCafeOrder({ words, pool, onDone, onCorrect, roundSize = 8 }) {
  const source = pickCafeWords(words, pool)
  const rounds = shuffle(source).slice(0, Math.min(roundSize, source.length))
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
    const opts = shuffle([w, ...distractors(source, w, 3)])
    root.innerHTML = `
      <div class="play-hud"><span>第 ${i + 1} / ${rounds.length} 題</span><span>🍽️ 小食店</span></div>
      <div class="cafe-scene">
        <div class="cafe-order">
          <div class="cafe-momo">🐱</div>
          <div class="cafe-bubble">
            <p class="order-line">我想要 <span class="order-word">${w.zhHant}</span></p>
            <img class="order-img" src="/${w.image}" alt="${w.zhHant}" />
          </div>
        </div>
      </div>
      <p class="hint">字學貓想食邊樣？揀啱張圖！</p>
      <div class="choices cafe-choices"></div>
      <div class="feedback" id="fb"></div>
    `
    const box = root.querySelector('.choices')
    opts.forEach((o) => {
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'choice'
      b.dataset.choice = o.id
      b.innerHTML = `<img src="/${o.image}" alt="${o.en}" /><span>${o.en}</span>`
      b.addEventListener('click', () => pick(o, b, root))
      box.appendChild(b)
    })
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
      coins += 4
      onCorrect?.(w)
      const orderWord = root.querySelector('.order-word')
      if (orderWord) orderWord.textContent = w.en
      fb.className = 'feedback ok'
      fb.textContent = `啱晒！我想要 ${w.en} 🍽️`
    } else {
      btn.classList.add('wrong')
      audio.wrong()
      missed.push(w.id)
      const right = buttons.find((b) => b.dataset.choice === w.id)
      if (right) right.classList.add('correct')
      fb.className = 'feedback bad'
      fb.textContent = `唔係呢樣～我想要 ${w.en}`
    }
    setTimeout(() => {
      i++
      render(root)
    }, 1000)
  }

  return { mount(root) { render(root) } }
}

function pickCafeWords(words, pool) {
  const source = Array.isArray(pool) && pool.length ? pool : words
  const food = source.filter((w) => w.theme === 'food')
  if (food.length) return food
  return source
}
