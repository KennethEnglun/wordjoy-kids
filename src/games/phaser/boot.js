import Phaser from 'phaser'
import FishScene from './FishScene.js'
import { COLORS, DESIGN_HEIGHT, DESIGN_WIDTH } from './theme.js'

export function createGame(parent, fishingData) {
  const scene = new FishScene(fishingData)
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: DESIGN_WIDTH,
    height: DESIGN_HEIGHT,
    backgroundColor: COLORS.water,
    scene: [scene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: DESIGN_WIDTH,
      height: DESIGN_HEIGHT,
      expandParent: false,
    },
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: false,
      transparent: false,
      clearBeforeRender: true,
      premultipliedAlpha: true,
      powerPreference: 'high-performance',
    },
    input: {
      activePointers: 2,
      smoothFactor: 0,
      touch: { capture: true },
    },
    audio: { noAudio: true },
    dom: { createContainer: false },
    disableContextMenu: true,
    callbacks: {
      postBoot: (bootedGame) => {
        if (!bootedGame.canvas) return
        bootedGame.canvas.setAttribute('aria-label', '釣魚湖：用圖片提示揀出正確英文生字')
        bootedGame.canvas.setAttribute('role', 'img')
        bootedGame.canvas.style.display = 'block'
        bootedGame.canvas.style.touchAction = 'none'
      },
    },
  })

  return game
}

export function destroyGame(game) {
  if (!game) return
  try {
    const scene = game.scene?.getScene('FishScene')
    if (scene?.scene?.isActive()) scene.scene.stop()
  } catch {
    // A game may be destroyed while Phaser is still booting.
  }
  game.destroy(true)
}
