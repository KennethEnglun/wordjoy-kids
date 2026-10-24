import { distractors, shuffle } from '../lib/vocab.js'
import * as audio from '../lib/audio.js'

export function createSpeedStar({ words, pool, onDone, roundSize = 8 }) {
  const rounds = shuffle(words).slice(0, Math.min(roundSize, words.length))
  let i = 0
  let correct = 0
  let coins = 0
  const missed = []
  let timer = null
  let started = 0

  function clearT() {
    if (timer) clearTimeout(timer)
    timer = null
  }

  function render(root) {
    clearT()
    if (i >= rounds.length) {
      onDone({ correct, total: rounds.length, coins, missed })
      return
    }
    const w = rounds[i]
    const opts = shuffle([w, ...distractors(pool.length ? pool : words, w, 3)])
    started = Date.now()
    root.innerHTML = `
      <div class="play-hud"><span>第 ${i + 1} / ${rounds.length} 題</span><span>⚡ Speed</span></div>
      <div class="timer-bar"><i id="bar"></i></div>
      <img class="prompt-img" src="/${w.image}" alt="" />
      <p class="hint">呢個係咩？</p>
      <button type="button" class="speak-btn" data-speak>🔊 聽英文提示</button>
      <div class="choices list"></div>
      <div class="feedback" id="fb"></div>
    `
    requestAnimationFrame(() => {
      const bar = root.querySelector('#bar')
      if (bar) {
        bar.style.transition = 'none'
        bar.style.transform = 'scaleX(1)'
        requestAnimationFrame(() => {
          bar.style.transition = 'transform 8s linear'
          bar.style.transform = 'scaleX(0)'
        })
      }
    })
    timer = setTimeout(() => answer(null, root), 8000)
    const box = root.querySelector('.choices')
    opts.forEach((o) => {
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'choice'
      b.dataset.choice = o.id
      b.textContent = o.en
      b.addEventListener('click', () => answer(o, root, b))
      box.appendChild(b)
    })
    root.querySelector('[data-speak]').onclick = () => {
      audio.tap()
      audio.speak(w.en)
    }
  }

  function answer(o, root, btn) {
    clearT()
    const w = rounds[i]
    const buttons = [...root.querySelectorAll('.choice')]
    buttons.forEach((b) => (b.disabled = true))
    const fb = root.querySelector('#fb')
    const elapsed = Date.now() - started
    if (o && o.id === w.id) {
      if (btn) btn.classList.add('correct')
      audio.correct()
      correct++
      let gain = 2
      if (elapsed < 3000) gain += 2
      coins += gain
      fb.className = 'feedback ok'
      fb.textContent = elapsed < 3000 ? `超快！+${gain} 金幣` : '正確！'
    } else {
      if (btn) btn.classList.add('wrong')
      audio.wrong()
      missed.push(w.id)
      const right = buttons.find((b) => b.dataset.choice === w.id)
      if (right) right.classList.add('correct')
      fb.className = 'feedback bad'
      fb.textContent = o ? `係 ${w.en}` : `時間到！係 ${w.en}`
    }
    setTimeout(() => {
      i++
      render(root)
    }, 900)
  }

  return {
    mount(root) { render(root) },
    destroy() { clearT() },
  }
}
