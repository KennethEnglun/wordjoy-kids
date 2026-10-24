/** Joy mascot paths — local webp for Capacitor/offline. */
const BASE = '/art/mascot'

export const Joy = {
  front: `${BASE}/joy_front.webp`,
  happy: `${BASE}/joy_happy.webp`,
  think: `${BASE}/joy_think.webp`,
  celebrate: `${BASE}/joy_celebrate.webp`,
}

export function joyImg(pose = 'front', alt = 'Joy', cls = 'joy-mascot') {
  const src = Joy[pose] || Joy.front
  return `<img class="${cls}" src="${src}" alt="${alt}" width="160" height="160" decoding="async" />`
}
