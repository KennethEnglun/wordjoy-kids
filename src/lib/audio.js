let ctx

function ac() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function tone(freq, dur = 0.12, type = 'sine', gain = 0.08) {
  try {
    const c = ac()
    const o = c.createOscillator()
    const g = c.createGain()
    o.type = type
    o.frequency.value = freq
    g.gain.value = gain
    o.connect(g)
    g.connect(c.destination)
    o.start()
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur)
    o.stop(c.currentTime + dur)
  } catch {
    /* ignore */
  }
}

export function tap() {
  tone(520, 0.06, 'triangle', 0.05)
}

export function correct() {
  tone(660, 0.08)
  setTimeout(() => tone(880, 0.12), 80)
}

export function wrong() {
  tone(220, 0.18, 'square', 0.05)
}

/** Speak English word via Web Speech if available */
export function speak(en) {
  try {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(en)
    u.lang = 'en-GB'
    u.rate = 0.9
    window.speechSynthesis.speak(u)
  } catch {
    /* ignore */
  }
}
