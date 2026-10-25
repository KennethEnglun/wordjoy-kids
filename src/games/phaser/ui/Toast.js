import { COLORS, FONT_FAMILY } from '../theme.js'

function colorNumber(color) {
  return Number.parseInt(color.slice(1), 16)
}

export default class Toast {
  constructor(scene) {
    this.scene = scene
    this.container = null
    this.hideEvent = null
  }

  show(message, { y = 190, duration = 950, color = COLORS.sageDark } = {}) {
    this.clear()
    const text = this.scene.add.text(0, 0, message, {
      fontFamily: FONT_FAMILY,
      fontSize: '15px',
      fontStyle: 'bold',
      color,
      align: 'center',
      padding: { x: 2, y: 2 },
    }).setOrigin(0.5)
    const width = Math.min(350, Math.max(156, text.width + 36))
    const height = Math.max(44, text.height + 18)
    const background = this.scene.add.graphics()
    background.fillStyle(colorNumber(COLORS.creamLight), 0.96)
    background.fillRoundedRect(-width / 2, -height / 2, width, height, height / 2)
    background.lineStyle(1, colorNumber(COLORS.sage), 0.22)
    background.strokeRoundedRect(-width / 2, -height / 2, width, height, height / 2)
    this.container = this.scene.add.container(195, y, [background, text]).setDepth(25).setAlpha(0)
    this.scene.tweens.add({ targets: this.container, alpha: 1, y: y - 3, duration: 130, ease: 'Sine.Out' })
    if (duration > 0) {
      this.hideEvent = this.scene.time.delayedCall(duration, () => {
        this.hideEvent = null
        if (!this.container) return
        this.scene.tweens.add({
          targets: this.container,
          alpha: 0,
          duration: 180,
          onComplete: () => this.clear(),
        })
      })
    }
    return this.container
  }

  clear() {
    this.hideEvent?.remove(false)
    this.hideEvent = null
    if (!this.container) return
    this.scene.tweens.killTweensOf(this.container)
    this.container.destroy(true)
    this.container = null
  }

  destroy() {
    this.clear()
  }
}
