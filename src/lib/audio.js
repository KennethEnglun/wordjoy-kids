let ctx
let preferredVoice = null
let voicesHooked = false
let warmed = false

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}

function tone(freq, dur = 0.12, type = 'sine', gain = 0.08) {
  try {
    const c = ac()
    if (!c) return
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

function synth() {
  return typeof window !== 'undefined' ? window.speechSynthesis : null
}

function pickVoice() {
  const s = synth()
  if (!s || typeof s.getVoices !== 'function') return null
  const voices = s.getVoices() || []
  preferredVoice =
    voices.find((v) => v.lang === 'en-GB') ||
    voices.find((v) => /^en[-_]GB/i.test(v.lang || '')) ||
    voices.find((v) => /^en[-_]GB/i.test(v.name || '')) ||
    voices.find((v) => /^en/i.test(v.lang || '')) ||
    null
  return preferredVoice
}

function hookVoices() {
  const s = synth()
  if (!s || voicesHooked) return
  voicesHooked = true
  pickVoice()
  if (typeof s.addEventListener === 'function') {
    s.addEventListener('voiceschanged', pickVoice)
  } else {
    s.onvoiceschanged = pickVoice
  }
}

/**
 * Call from the first user gesture (home tap). Warms Web Audio and the
 * speech engine so iOS/Capacitor can speak later without a fresh gesture.
 */
export function unlockAudio() {
  try {
    ac()
    hookVoices()
    const s = synth()
    if (!s || warmed) return
    warmed = true
    pickVoice()
    const u = new SpeechSynthesisUtterance(' ')
    u.volume = 0
    u.lang = 'en-GB'
    if (preferredVoice) u.voice = preferredVoice
    s.speak(u)
  } catch {
    /* ignore */
  }
}

/** Speak an English word via Web Speech, preferring an en-GB voice. */
export function speak(en) {
  try {
    const s = synth()
    if (!s || !en) return
    hookVoices()
    if (!preferredVoice) pickVoice()
    s.cancel()
    const u = new SpeechSynthesisUtterance(String(en))
    u.lang = 'en-GB'
    u.rate = 0.86
    u.pitch = 1.04
    if (preferredVoice) u.voice = preferredVoice
    s.speak(u)
  } catch {
    /* ignore */
  }
}

/** Correct-answer chime followed by the word read aloud. */
export function speakOnCorrect(en) {
  correct()
  if (!en) return
  setTimeout(() => speak(en), 180)
}
