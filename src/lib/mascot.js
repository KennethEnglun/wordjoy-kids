/** 毛毛 / Momo — grey kawaii cat (local webp for Capacitor/offline). */
const BASE = '/art/mascot'

export const MASCOT_NAME_ZH = '毛毛'
export const MASCOT_NAME_EN = 'Momo'

export const Momo = {
  front: `${BASE}/cat_front.webp`,
  happy: `${BASE}/cat_happy.webp`,
  think: `${BASE}/cat_think.webp`,
  celebrate: `${BASE}/cat_celebrate.webp`,
}

/** @deprecated alias — bird Joy retired; maps to Momo */
export const Joy = Momo

export function momoImg(pose = 'front', alt = MASCOT_NAME_ZH, cls = 'momo-mascot') {
  const src = Momo[pose] || Momo.front
  return `<img class="${cls}" src="${src}" alt="${alt}" width="180" height="180" decoding="async" />`
}

/** @deprecated alias for momoImg */
export function joyImg(pose = 'front', alt = MASCOT_NAME_ZH, cls = 'momo-mascot') {
  return momoImg(pose, alt, cls)
}
