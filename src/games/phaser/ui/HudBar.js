import { COLORS, FONT_FAMILY } from '../theme.js'

function addPanel(scene, container, x, y, width, height, fill = COLORS.cream, alpha = 0.94) {
  const graphics = scene.add.graphics()
  graphics.fillStyle(PhaserColor(fill), alpha)
  graphics.fillRoundedRect(x - width / 2, y - height / 2, width, height, height / 2)
  graphics.lineStyle(1, PhaserColor(COLORS.ink), 0.08)
  graphics.strokeRoundedRect(x - width / 2, y - height / 2, width, height, height / 2)
  container.add(graphics)
  return graphics
}

function PhaserColor(value) {
  return Number.parseInt(String(value).replace('#', ''), 16)
}

function addText(scene, container, x, y, text, fontSize, color, align = 'center', bold = false) {
  const object = scene.add.text(x, y, text, {
    fontFamily: FONT_FAMILY,
    fontSize: `${fontSize}px`,
    color,
    fontStyle: bold ? 'bold' : 'normal',
    align,
    lineSpacing: 0,
    padding: { x: 2, y: 2 },
  }).setOrigin(0.5)
  container.add(object)
  return object
}

function addIcon(scene, container, key, x, y, size) {
  const image = scene.add.image(x, y, key).setDisplaySize(size, size)
  container.add(image)
  return image
}

export default class HudBar {
  constructor(scene, totalRounds) {
    this.scene = scene
    this.container = scene.add.container(0, 0).setDepth(20)
    const group = this.container

    addIcon(scene, group, 'rod', 32, 29, 31)
    this.title = addText(scene, group, 53, 28, '釣魚湖', 23, COLORS.ink, 'left', true).setOrigin(0, 0.5)
    addPanel(scene, group, 322, 28, 112, 36, COLORS.creamLight)
    this.round = addText(scene, group, 322, 28, `第 1 / ${totalRounds} 竿`, 13, COLORS.sageDark, 'center', true)

    this.stats = {}
    const statConfigs = [
      { id: 'coins', x: 69, icon: 'coin', label: '金幣' },
      { id: 'bait', x: 195, icon: 'bait', label: '魚餌' },
      { id: 'pounds', x: 321, icon: 'fishIcon', label: '磅數' },
    ]
    for (const stat of statConfigs) {
      addPanel(scene, group, stat.x, 91, 116, 53)
      addIcon(scene, group, stat.icon, stat.x - 34, 91, 27)
      addText(scene, group, stat.x + 7, 79, stat.label, 10, COLORS.muted, 'center', true)
      this.stats[stat.id] = addText(scene, group, stat.x + 7, 98, '0', 16, COLORS.sageDark, 'center', true)
    }

    addPanel(scene, group, 66, 146, 102, 34, '#F3EBD9', 0.94)
    addIcon(scene, group, 'bait', 34, 146, 21)
    this.lure = addText(scene, group, 75, 146, '魚餌 Lv.1', 11, COLORS.sageDark, 'center', true)

    this.botViews = {}
    this.addBot('rabbit', '兔', 'rabbit', 197)
    this.addBot('chick', '雞', 'chick', 323)
  }

  addBot(id, shortName, texture, x) {
    const group = this.container
    addPanel(this.scene, group, x, 146, 116, 34, '#F9F3E8', 0.89)
    addIcon(this.scene, group, texture, x - 39, 146, 26)
    addText(this.scene, group, x - 14, 138, shortName, 9, COLORS.muted, 'center', true)
    this.botViews[id] = addText(this.scene, group, x + 15, 150, '0.0磅', 10, COLORS.ink, 'center', true)
  }

  refresh({ coins, bait, pounds, lureLevel, roundIndex, totalRounds, bots }) {
    this.stats.coins.setText(String(coins))
    this.stats.bait.setText(String(Math.max(0, bait)))
    this.stats.pounds.setText(Number(pounds).toFixed(1))
    this.lure.setText(`魚餌 Lv.${lureLevel}`)
    this.round.setText(`第 ${Math.min(roundIndex + 1, totalRounds)} / ${totalRounds} 竿`)
    for (const bot of bots) this.botViews[bot.id]?.setText(`${(bot.pounds / 10).toFixed(1)}磅`)
  }

  destroy() {
    this.container?.destroy(true)
    this.container = null
  }
}
