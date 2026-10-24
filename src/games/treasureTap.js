import { distractors, shuffle } from '../lib/vocab.js'
import * as audio from '../lib/audio.js'

export function createTreasureTap({ words, pool, onDone, onCorrect, roundSize = 8 }) {
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
    const opts = shuffle([w, ...distractors(pool.length ? pool : words, w, 2)])
    root.innerHTML = `
      <div class="play-hud"><span>第 ${i + 1} / ${rounds.length} 題</span><span>🧺 開寶箱</span></div>
      <div class="chest-wrap" id="chest"><img src="/art/ui/chest_closed.svg" alt="chest" /></div>
      <img class="prompt-img" src="/${w.image}" alt="" />
      <p class="hint">答啱就開寶箱！</p>
      <div class="zh-gloss">${w.zhHant}</div>
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
    const chest = root.querySelector('#chest')
    if (o.id === w.id) {
      btn.classList.add('correct')
      audio.speakOnCorrect(w.en)
      correct++
      correctIds.push(w.id)
      const gain = 3
      onCorrect?.(w)
      coins += gain
      chest.classList.add('open')
      chest.innerHTML = `<img src="/art/ui/chest_open.svg" alt="open" /><div class="coin-pop">+${gain} 金幣</div>`
      fb.className = 'feedback ok'
      fb.textContent = '開咗啦！'
    } else {
      btn.classList.add('wrong')
      audio.wrong()
      missed.push(w.id)
      const right = buttons.find((b) => b.dataset.choice === w.id)
      if (right) right.classList.add('correct')
      fb.className = 'feedback bad'
      fb.textContent = `未開到～係 ${w.en}`
    }
    setTimeout(() => {
      i++
      render(root)
    }, 1100)
  }

  return { mount(root) { render(root) } }
}
