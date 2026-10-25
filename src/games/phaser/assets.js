const ROOT = '/art/games/fishing-v2/'

export const ASSETS = Object.freeze({
  lake: `${ROOT}fishing_v2_bg_lake.webp`,
  pier: `${ROOT}fishing_v2_pier.webp`,
  bucket: `${ROOT}fishing_v2_bucket.webp`,
  bobber: `${ROOT}fishing_v2_bobber.webp`,
  bait: `${ROOT}fishing_v2_bait_bag.webp`,
  rod: `${ROOT}fishing_v2_rod_icon.webp`,
  fishIcon: `${ROOT}fishing_v2_fish_icon_small.webp`,
  coin: `${ROOT}ui_coin_icon.webp`,
  panel: `${ROOT}ui_cream_panel.webp`,
  choiceNormal: `${ROOT}ui_choice_btn_normal.webp`,
  choicePressed: `${ROOT}ui_choice_btn_pressed.webp`,
  choiceCorrect: `${ROOT}ui_choice_btn_correct.webp`,
  choiceWrong: `${ROOT}ui_choice_btn_wrong.webp`,
  hudPill: `${ROOT}ui_hud_pill_empty.webp`,
  cta: `${ROOT}ui_cta_sage.webp`,
  speak: `${ROOT}ui_speak_icon.webp`,
  ripple: `${ROOT}fishing_v2_fx_ripple.webp`,
  splash: `${ROOT}fishing_v2_fx_splash.webp`,
  sparkle: `${ROOT}fishing_v2_fx_sparkle.webp`,
  glow: `${ROOT}fishing_v2_fx_soft_glow.webp`,
  rabbit: `${ROOT}bot_bunny_avatar.webp`,
  chick: `${ROOT}bot_chick_avatar.webp`,
  fish: {
    common: `${ROOT}fishing_v2_fish_common.webp`,
    striped: `${ROOT}fishing_v2_fish_striped.webp`,
    blue: `${ROOT}fishing_v2_fish_blue.webp`,
    spotted: `${ROOT}fishing_v2_fish_spotted.webp`,
    rare_big: `${ROOT}fishing_v2_fish_rare_big.webp`,
  },
  cat: {
    idle: `${ROOT}sheets/zxm_idle_sheet.webp`,
    cast: `${ROOT}sheets/zxm_cast_sheet.webp`,
    fish: `${ROOT}sheets/zxm_fish_sheet.webp`,
    cheer: `${ROOT}sheets/zxm_cheer_sheet.webp`,
  },
})

export const IMAGE_ASSETS = Object.entries(ASSETS)
  .filter(([, value]) => typeof value === 'string')
  .map(([key, url]) => ({ key, url }))

export const FISH_ASSETS = Object.entries(ASSETS.fish)
  .map(([key, url]) => ({ key: `fish-${key}`, url }))

export const SPRITESHEETS = Object.entries(ASSETS.cat)
  .map(([key, url]) => ({ key: `cat-${key}`, url }))
