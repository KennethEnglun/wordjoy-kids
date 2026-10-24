const KEY = 'wordjoy-progress'

const DEFAULT = {
  coins: 0,
  stars: 0,
  best: {},
  reviewBag: [],
  sessions: [],
  profiles: {},
}

export function getProgress() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT, best: {}, reviewBag: [], sessions: [] }
    return { ...DEFAULT, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT, best: {}, reviewBag: [], sessions: [] }
  }
}

export function setProgress(next) {
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}

export function addCoins(n) {
  const p = getProgress()
  p.coins = (p.coins || 0) + n
  return setProgress(p)
}

export function addStars(n) {
  const p = getProgress()
  p.stars = (p.stars || 0) + n
  return setProgress(p)
}

export function recordBest(key, score) {
  const p = getProgress()
  p.best = p.best || {}
  if (!p.best[key] || score > p.best[key]) p.best[key] = score
  return setProgress(p)
}

export function pushReview(wordIds) {
  const p = getProgress()
  const set = new Set(p.reviewBag || [])
  wordIds.forEach((id) => set.add(id))
  p.reviewBag = [...set].slice(0, 40)
  return setProgress(p)
}

export function clearReviewed(wordIds) {
  const p = getProgress()
  const drop = new Set(wordIds)
  p.reviewBag = (p.reviewBag || []).filter((id) => !drop.has(id))
  return setProgress(p)
}

export function saveSession(summary) {
  const p = getProgress()
  p.sessions = [summary, ...(p.sessions || [])].slice(0, 20)
  return setProgress(p)
}
