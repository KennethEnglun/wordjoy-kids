/** 字學貓 — same grey kawaii cat IP as Chinese sister app (local webp). */
const BASE = '/art/mascot'

export const MASCOT_NAME_ZH = '字學貓'
/** Display name is Chinese-first; keep EN as same brand for alt text. */
export const MASCOT_NAME_EN = '字學貓'

export const Momo = {
  front: `${BASE}/cat_front.webp`,
  happy: `${BASE}/cat_happy.webp`,
  think: `${BASE}/cat_think.webp`,
  celebrate: `${BASE}/cat_celebrate.webp`,
}

/** @deprecated alias — bird Joy retired; maps to 字學貓 assets */
export const Joy = Momo

/** Code alias kept as momoImg; UI alt/text uses MASCOT_NAME_ZH. */
export function momoImg(pose = 'front', alt = MASCOT_NAME_ZH, cls = 'momo-mascot') {
  const src = Momo[pose] || Momo.front
  return `<img class="${cls}" src="${src}" alt="${alt}" width="180" height="180" decoding="async" />`
}

/** @deprecated alias for momoImg */
export function joyImg(pose = 'front', alt = MASCOT_NAME_ZH, cls = 'momo-mascot') {
  return momoImg(pose, alt, cls)
}
