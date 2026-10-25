export const DESIGN_WIDTH = 390
export const DESIGN_HEIGHT = 844

export const COLORS = Object.freeze({
  cream: '#F7F1E8',
  creamLight: '#FFFDF7',
  sage: '#7A9A7E',
  sageDark: '#58785C',
  sageSoft: '#E5EFE3',
  ink: '#5C4A3A',
  muted: '#8A7564',
  coral: '#E8A090',
  coralSoft: '#F7E4DE',
  gold: '#E6B35A',
  water: '#E8F0E4',
  waterDark: '#78AEB0',
  white: '#FFFFFF',
})

export const FONT_FAMILY = 'PingFang TC, Noto Sans TC, Helvetica Neue, Arial, sans-serif'

export const TEXT = Object.freeze({
  title: { fontFamily: FONT_FAMILY, fontSize: '24px', fontStyle: 'bold', color: COLORS.ink },
  heading: { fontFamily: FONT_FAMILY, fontSize: '20px', fontStyle: 'bold', color: COLORS.sageDark },
  body: { fontFamily: FONT_FAMILY, fontSize: '14px', color: COLORS.ink },
  small: { fontFamily: FONT_FAMILY, fontSize: '12px', color: COLORS.muted },
  choice: { fontFamily: FONT_FAMILY, fontSize: '22px', fontStyle: 'bold', color: COLORS.ink },
})

export function textStyle(overrides = {}) {
  return { ...TEXT.body, ...overrides }
}
