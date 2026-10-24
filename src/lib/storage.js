const KEY = 'wordjoy-progress'
export const MAX_PROFILES = 3
export const AVATARS = ['🐻', '🐱', '🐰', '🦊', '🐼', '🦁', '🐸', '🐵', '🦄', '🐯']
const BANDS = ['prek', 'p1', 'p2', 'p3']

function dateStr(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function yesterdayStr() {
  const n = new Date()
  return dateStr(new Date(n.getFullYear(), n.getMonth(), n.getDate() - 1))
}

function blankProfile(id, name = '小朋友1', avatar = '🐻', band = 'p1') {
  return {
    id,
    name,
    avatar,
    band: BANDS.includes(band) ? band : 'p1',
    coins: 0,
    stars: 0,
    best: {},
    reviewBag: [],
    sessions: [],
    streak: { count: 0, lastDate: null },
    todayKey: null,
    todayStars: 0,
    sessionStartedAt: null,
  }
}

function uniqueIds(list) {
  return [...new Set(Array.isArray(list) ? list.filter((x) => typeof x === 'string') : [])]
}

function normalizeProfile(raw, fallbackId) {
  const p = raw && typeof raw === 'object' ? raw : {}
  const id = typeof p.id === 'string' && p.id ? p.id : fallbackId
  return {
    id,
    name: typeof p.name === 'string' && p.name.trim() ? p.name.trim().slice(0, 16) : '小朋友',
    avatar: typeof p.avatar === 'string' && p.avatar ? p.avatar : '🐻',
    band: BANDS.includes(p.band) ? p.band : 'p1',
    coins: Math.max(0, Number(p.coins) || 0),
    stars: Math.max(0, Number(p.stars) || 0),
    best: p.best && typeof p.best === 'object' ? { ...p.best } : {},
    reviewBag: uniqueIds(p.reviewBag).slice(0, 40),
    sessions: Array.isArray(p.sessions) ? p.sessions.slice(0, 20) : [],
    streak: {
      count: Math.max(0, Number(p.streak?.count) || 0),
      lastDate: typeof p.streak?.lastDate === 'string' ? p.streak.lastDate : null,
    },
    todayKey: typeof p.todayKey === 'string' ? p.todayKey : null,
    todayStars: Math.max(0, Number(p.todayStars) || 0),
    sessionStartedAt: typeof p.sessionStartedAt === 'number' ? p.sessionStartedAt : null,
  }
}

function migrate(raw) {
  const old = raw && typeof raw === 'object' ? raw : {}
  const prof = blankProfile('kid1', '小朋友1', '🐻', 'p1')
  prof.coins = Math.max(0, Number(old.coins) || 0)
  prof.stars = Math.max(0, Number(old.stars) || 0)
  prof.best = old.best && typeof old.best === 'object' ? { ...old.best } : {}
  prof.reviewBag = uniqueIds(old.reviewBag).slice(0, 40)
  prof.sessions = Array.isArray(old.sessions) ? old.sessions.slice(0, 20) : []
  return {
    activeProfileId: 'kid1',
    parentPin: null,
    dailyGoalStars: 15,
    sessionCapMinutes: 0,
    profiles: { kid1: prof },
  }
}

function normalize(raw) {
  const hasProfiles =
    raw &&
    raw.profiles &&
    typeof raw.profiles === 'object' &&
    Object.keys(raw.profiles).length > 0
  if (!hasProfiles) return { state: migrate(raw), migrated: true }

  const profiles = {}
  Object.entries(raw.profiles).forEach(([id, p]) => {
    profiles[id] = normalizeProfile(p, id)
  })
  let activeProfileId = raw.activeProfileId
  if (!profiles[activeProfileId]) activeProfileId = Object.keys(profiles)[0]
  const parentPin =
    typeof raw.parentPin === 'string' && /^\d{4}$/.test(raw.parentPin)
      ? raw.parentPin
      : null
  const dailyGoalStars = Math.max(1, Number(raw.dailyGoalStars) || 15)
  const sessionCapMinutes = Math.max(0, Number(raw.sessionCapMinutes) || 0)
  return { state: { activeProfileId, parentPin, dailyGoalStars, sessionCapMinutes, profiles }, migrated: false }
}

export function getState() {
  let raw = null
  try {
    const stored = localStorage.getItem(KEY)
    if (stored) raw = JSON.parse(stored)
  } catch {
    raw = null
  }
  const { state, migrated } = normalize(raw)
  if (migrated) saveState(state)
  return state
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* storage may be unavailable — keep app playable */
  }
  return state
}

function mutate(fn) {
  const state = getState()
  const p = state.profiles[state.activeProfileId]
  if (!p) return state
  fn(p, state)
  saveState(state)
  return state
}

export function listProfiles() {
  return Object.values(getState().profiles)
}

export function getActiveProfile() {
  const state = getState()
  return state.profiles[state.activeProfileId] || null
}

/** Backward-compatible alias: old screens expected flat progress object. */
export function getProgress() {
  return getActiveProfile() || blankProfile('kid1')
}

export function getActiveProgress() {
  return getActiveProfile()
}

export function setActiveProfile(id) {
  const state = getState()
  if (!state.profiles[id]) return null
  state.activeProfileId = id
  saveState(state)
  return state.profiles[id]
}

export function createProfile(name, avatar = '🐻', band = 'p1') {
  const state = getState()
  if (Object.keys(state.profiles).length >= MAX_PROFILES) return null
  let n = 1
  let id = `kid${n}`
  while (state.profiles[id]) {
    n += 1
    id = `kid${n}`
  }
  const cleanName = typeof name === 'string' && name.trim() ? name.trim().slice(0, 16) : `小朋友${n}`
  const prof = blankProfile(id, cleanName, avatar || '🐻', band)
  state.profiles[id] = prof
  state.activeProfileId = id
  saveState(state)
  return prof
}

export function updateProfile(patch, id = null) {
  const state = getState()
  const target = id || state.activeProfileId
  if (!state.profiles[target]) return null
  const p = state.profiles[target]
  if (typeof patch.name === 'string' && patch.name.trim()) p.name = patch.name.trim().slice(0, 16)
  if (typeof patch.avatar === 'string' && patch.avatar) p.avatar = patch.avatar
  if (BANDS.includes(patch.band)) p.band = patch.band
  if (patch.coins != null) p.coins = Math.max(0, Number(patch.coins) || 0)
  if (patch.stars != null) p.stars = Math.max(0, Number(patch.stars) || 0)
  if (patch.best && typeof patch.best === 'object') p.best = { ...p.best, ...patch.best }
  if (patch.reviewBag) p.reviewBag = uniqueIds(patch.reviewBag).slice(0, 40)
  if (patch.sessions) p.sessions = patch.sessions.slice(0, 20)
  if (patch.streak) p.streak = normalizeProfile({ streak: patch.streak }, target).streak
  saveState(state)
  return p
}

export function addCoins(n) {
  mutate((p) => {
    p.coins = Math.max(0, (p.coins || 0) + (Number(n) || 0))
  })
  return getActiveProfile()
}

export function addStars(n) {
  mutate((p) => {
    p.stars = Math.max(0, (p.stars || 0) + (Number(n) || 0))
  })
  return getActiveProfile()
}

export function recordBest(key, score) {
  mutate((p) => {
    p.best = p.best || {}
    const v = Number(score) || 0
    if (p.best[key] == null || v > p.best[key]) p.best[key] = v
  })
  return getActiveProfile()
}

export function pushReview(wordIds) {
  mutate((p) => {
    const set = new Set(p.reviewBag || [])
    ;(wordIds || []).forEach((id) => set.add(id))
    p.reviewBag = [...set].slice(0, 40)
  })
  return getActiveProfile()
}

export function clearReviewed(wordIds) {
  mutate((p) => {
    const drop = new Set(wordIds || [])
    p.reviewBag = (p.reviewBag || []).filter((id) => !drop.has(id))
  })
  return getActiveProfile()
}

export function saveSession(summary) {
  mutate((p) => {
    p.sessions = [summary, ...(p.sessions || [])].slice(0, 20)
  })
  return getActiveProfile()
}

export function bumpStreak() {
  mutate((p) => {
    const st = p.streak || { count: 0, lastDate: null }
    const today = dateStr()
    if (!st.lastDate) st.count = 1
    else if (st.lastDate === today) st.count = Math.max(1, st.count || 0)
    else if (st.lastDate === yesterdayStr()) st.count = (st.count || 0) + 1
    else st.count = 1
    st.lastDate = today
    p.streak = st
  })
  return getActiveProfile()?.streak || { count: 0, lastDate: null }
}

export function setParentPin(pin) {
  const state = getState()
  if (!/^\d{4}$/.test(String(pin || ''))) return false
  state.parentPin = String(pin)
  saveState(state)
  return true
}

export function verifyParentPin(pin) {
  const state = getState()
  return !!state.parentPin && state.parentPin === String(pin || '')
}

export function hasParentPin() {
  return !!getState().parentPin
}

export function clearParentPin() {
  const state = getState()
  state.parentPin = null
  saveState(state)
  return state
}


export function getParentSettings() {
  const state = getState()
  return {
    dailyGoalStars: Math.max(1, Number(state.dailyGoalStars) || 15),
    sessionCapMinutes: Math.max(0, Number(state.sessionCapMinutes) || 0),
  }
}

export function setParentSettings({ dailyGoalStars, sessionCapMinutes }) {
  const state = getState()
  if (dailyGoalStars != null) state.dailyGoalStars = Math.max(1, Math.min(100, Number(dailyGoalStars) || 15))
  if (sessionCapMinutes != null) {
    const n = Number(sessionCapMinutes)
    state.sessionCapMinutes = Number.isFinite(n) ? Math.max(0, Math.min(120, n)) : 0
  }
  saveState(state)
  return getParentSettings()
}

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export function getTodayStars() {
  const p = getActiveProfile()
  if (!p) return 0
  if (p.todayKey !== todayKey()) return 0
  return Math.max(0, Number(p.todayStars) || 0)
}

export function addTodayStars(n) {
  mutate((p) => {
    const key = todayKey()
    if (p.todayKey !== key) {
      p.todayKey = key
      p.todayStars = 0
    }
    p.todayStars = Math.max(0, (p.todayStars || 0) + (Number(n) || 0))
  })
  return getTodayStars()
}

export function startPlaySession() {
  mutate((p) => {
    if (!p.sessionStartedAt) p.sessionStartedAt = Date.now()
  })
  return getActiveProfile()?.sessionStartedAt
}

export function clearPlaySession() {
  mutate((p) => {
    p.sessionStartedAt = null
  })
}

/** Returns { allowed, reason, remainingSec } */
export function checkSessionAllowed() {
  const { sessionCapMinutes } = getParentSettings()
  if (!sessionCapMinutes) return { allowed: true, reason: '', remainingSec: null }
  const p = getActiveProfile()
  const started = p?.sessionStartedAt
  if (!started) return { allowed: true, reason: '', remainingSec: sessionCapMinutes * 60 }
  const elapsed = (Date.now() - started) / 1000
  const limit = sessionCapMinutes * 60
  if (elapsed >= limit) {
    return { allowed: false, reason: `今日遊戲時間已到（${sessionCapMinutes} 分鐘）。休息一下啦！`, remainingSec: 0 }
  }
  return { allowed: true, reason: '', remainingSec: Math.max(0, Math.floor(limit - elapsed)) }
}

export function getWeeklyDigest() {
  const p = getActiveProfile()
  const sessions = p?.sessions || []
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const recent = sessions.filter((s) => (s.at || 0) >= weekAgo)
  let correct = 0
  let total = 0
  let stars = 0
  const themes = new Set()
  recent.forEach((s) => {
    correct += Number(s.correct) || 0
    total += Number(s.total) || 0
    stars += Number(s.stars) || 0
    if (s.theme) themes.add(s.theme)
  })
  return {
    sessions: recent.length,
    correct,
    total,
    accuracy: total ? Math.round((correct / total) * 100) : 0,
    stars,
    themes: [...themes],
    streak: p?.streak?.count || 0,
    reviewBag: p?.reviewBag?.length || 0,
  }
}
