import Phaser from 'phaser'
import { distractors, shuffle } from '../../lib/vocab.js'
import * as audio from '../../lib/audio.js'
import { FISH_ASSETS, IMAGE_ASSETS, SPRITESHEETS } from './assets.js'
import { COLORS, DESIGN_HEIGHT, DESIGN_WIDTH, FONT_FAMILY } from './theme.js'
import HudBar from './ui/HudBar.js'
import QuestionPanel from './ui/QuestionPanel.js'
import Toast from './ui/Toast.js'

const RARITIES = [
  { id: 'common', name: '普通魚', weight: 43, pounds: 8 },
  { id: 'striped', name: '條紋魚', weight: 23, pounds: 12 },
  { id: 'blue', name: '藍魚', weight: 15, pounds: 16 },
  { id: 'spotted', name: '斑點魚', weight: 12, pounds: 20 },
  { id: 'rare_big', name: '稀有大魚', weight: 7, pounds: 40 },
]

const TRANSITIONS = {
  Boot: ['Ready'],
  Ready: ['Casting'],
  Casting: ['WaitingBite'],
  WaitingBite: ['Question'],
  Question: ['ResolveCorrect', 'ResolveWrong'],
  ResolveCorrect: ['Ready', 'Results'],
  ResolveWrong: ['Ready', 'Results'],
  Results: [],
}

function colorNumber(color) {
  return Number.parseInt(color.slice(1), 16)
}

function imagePath(path) {
  if (!path) return ''
  const value = String(path)
  return value.startsWith('/') ? value : `/${value}`
}

function fishForLure(level) {
  const adjusted = RARITIES.map((fish) => ({
    ...fish,
    weight: fish.id === 'rare_big'
      ? fish.weight + (level - 1) * 4
      : fish.id === 'common'
        ? Math.max(20, fish.weight - (level - 1) * 3)
        : fish.weight,
  }))
  let target = Math.random() * adjusted.reduce((sum, fish) => sum + fish.weight, 0)
  for (const fish of adjusted) {
    target -= fish.weight
    if (target < 0) return fish
  }
  return adjusted[0]
}

function addText(scene, parent, x, y, value, size, color, options = {}) {
  const text = scene.add.text(x, y, value, {
    fontFamily: FONT_FAMILY,
    fontSize: `${size}px`,
    fontStyle: options.bold ? 'bold' : 'normal',
    color,
    align: options.align || 'center',
    wordWrap: options.wordWrapWidth ? { width: options.wordWrapWidth } : undefined,
    padding: { x: 2, y: 2 },
  }).setOrigin(options.originX ?? 0.5, options.originY ?? 0.5)
  parent.add(text)
  return text
}

function drawRounded(scene, parent, x, y, width, height, fill, radius = 17, alpha = 1, line = null) {
  const graphics = scene.add.graphics()
  graphics.fillStyle(colorNumber(fill), alpha)
  graphics.fillRoundedRect(x - width / 2, y - height / 2, width, height, radius)
  if (line) {
    graphics.lineStyle(1.2, colorNumber(line), 0.5)
    graphics.strokeRoundedRect(x - width / 2, y - height / 2, width, height, radius)
  }
  parent.add(graphics)
  return graphics
}

export default class FishScene extends Phaser.Scene {
  constructor(fishingData) {
    super({ key: 'FishScene' })
    this.fishingData = fishingData
    this.rounds = fishingData.rounds
    this.pool = fishingData.pool
    this.onDone = fishingData.onDone
    this.onCorrect = fishingData.onCorrect
    this.announce = fishingData.announce
    this.bots = [
      { id: 'rabbit', name: '小兔', pounds: 0 },
      { id: 'chick', name: '小雞', pounds: 0 },
    ]
    this.missed = []
    this.correctIds = []
    this.roundIndex = 0
    this.correct = 0
    this.coins = 0
    this.poundsTenths = 0
    this.lureLevel = 1
    this.baitUsed = false
    this.finished = false
    this.state = 'Boot'
    this.promptKeys = []
  }

  preload() {
    for (const asset of IMAGE_ASSETS) this.load.image(asset.key, asset.url)
    for (const asset of FISH_ASSETS) this.load.image(asset.key, asset.url)
    for (const asset of SPRITESHEETS) {
      this.load.spritesheet(asset.key, asset.url, { frameWidth: 256, frameHeight: 320 })
    }
    this.rounds.forEach((word, index) => {
      if (!word.image) return
      const key = `prompt-${index}`
      this.promptKeys[index] = key
      this.load.image(key, imagePath(word.image))
    })
  }

  create() {
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdownScene, this)
    this.cameras.main.setBackgroundColor(COLORS.water)
    this.createAnimations()
    this.createWorld()
    this.hud = new HudBar(this, this.rounds.length)
    this.toast = new Toast(this)
    this.questionPanel = new QuestionPanel(this, {
      onAnswer: (option) => this.answer(option),
      onSpeak: (word) => {
        audio.tap()
        audio.speak(word.en)
      },
      announce: this.announce,
    })
    this.refreshHud()
    this.enterReady()
  }

  createAnimations() {
    const definitions = [
      { key: 'cat-idle', texture: 'cat-idle', frameRate: 3, repeat: -1 },
      { key: 'cat-cast', texture: 'cat-cast', frameRate: 6, repeat: 0 },
      { key: 'cat-fish', texture: 'cat-fish', frameRate: 6, repeat: 0 },
      { key: 'cat-cheer', texture: 'cat-cheer', frameRate: 5, repeat: -1 },
    ]
    for (const definition of definitions) {
      this.anims.create({
        key: definition.key,
        frames: this.anims.generateFrameNumbers(definition.texture, { start: 0, end: 3 }),
        frameRate: definition.frameRate,
        repeat: definition.repeat,
      })
    }
  }

  createWorld() {
    this.lake = this.add.image(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2, 'lake')
      .setDisplaySize(DESIGN_WIDTH, DESIGN_HEIGHT)
      .setDepth(0)

    this.distantFish = this.add.image(102, 440, 'fish-common')
      .setDisplaySize(70, 45)
      .setAlpha(0.48)
      .setDepth(1)
    this.tweens.add({
      targets: this.distantFish,
      x: 160,
      y: 430,
      duration: 4200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    })

    const waterLine = this.add.graphics().setDepth(2)
    waterLine.lineStyle(3, colorNumber('#F7F4E5'), 0.48)
    waterLine.beginPath()
    waterLine.moveTo(0, 472)
    waterLine.lineTo(390, 472)
    waterLine.strokePath()
    waterLine.lineStyle(1, colorNumber(COLORS.waterDark), 0.16)
    waterLine.beginPath()
    waterLine.moveTo(0, 480)
    waterLine.lineTo(390, 480)
    waterLine.strokePath()

    this.pier = this.add.image(198, 636, 'pier')
      .setDisplaySize(420, 184)
      .setDepth(4)
    this.bucket = this.add.image(61, 624, 'bucket')
      .setDisplaySize(69, 75)
      .setDepth(7)
    this.cat = this.add.sprite(281, 532, 'cat-idle', 0)
      .setDisplaySize(144, 180)
      .setDepth(6)
    this.cat.play('cat-idle')

    this.fishingLine = this.add.graphics().setDepth(8).setVisible(false)
    this.bobber = this.add.image(287, 477, 'bobber')
      .setDisplaySize(31, 35)
      .setDepth(9)
      .setVisible(false)
    this.ripple = this.add.image(287, 480, 'ripple')
      .setDisplaySize(108, 58)
      .setDepth(10)
      .setAlpha(0)
      .setVisible(false)
    this.splash = this.add.image(287, 475, 'splash')
      .setDisplaySize(112, 88)
      .setDepth(13)
      .setAlpha(0)
      .setVisible(false)
    this.peek = this.add.image(324, 418, 'cat-peek')
      .setDisplaySize(83, 104)
      .setDepth(31)
      .setVisible(false)
    this.fishLayer = this.add.container(0, 0).setDepth(32)
  }

  transition(next) {
    if (!TRANSITIONS[this.state]?.includes(next)) {
      console.warn(`Ignoring invalid fishing transition ${this.state} → ${next}`)
      return false
    }
    this.state = next
    return true
  }

  refreshHud() {
    if (!this.hud) return
    this.hud.refresh({
      coins: this.coins,
      bait: this.rounds.length - this.roundIndex - (this.baitUsed ? 1 : 0),
      pounds: this.poundsTenths / 10,
      lureLevel: this.lureLevel,
      roundIndex: this.roundIndex,
      totalRounds: this.rounds.length,
      bots: this.bots,
    })
  }

  enterReady() {
    if (!this.transition('Ready')) return
    this.questionPanel?.destroy()
    this.toast?.clear()
    this.peek.setVisible(false)
    this.bobber.setVisible(false)
    this.ripple.setVisible(false).setAlpha(0)
    this.splash.setVisible(false).setAlpha(0)
    this.fishingLine.clear().setVisible(false)
    this.cat.play('cat-idle')
    this.refreshHud()
    this.showReadyControls()
  }

  showReadyControls() {
    this.readyUi?.destroy(true)
    const ui = this.add.container(0, 0).setDepth(30)
    this.readyUi = ui
    const card = this.add.image(195, 703, 'panel').setDisplaySize(374, 132)
    ui.add(card)
    addText(this, ui, 195, 654, '準備好未？', 20, COLORS.sageDark, { bold: true })
    addText(this, ui, 195, 678, '拋竿等魚咬鉤，再答啱英文釣起魚。', 11, COLORS.muted)

    const cast = this.add.container(195, 729)
    cast.add(this.add.image(0, 0, 'cta').setDisplaySize(326, 58))
    cast.add(this.add.image(-112, 0, 'rod').setDisplaySize(28, 28))
    addText(this, cast, 18, 0, '拋竿釣魚', 18, COLORS.white, { bold: true })
    cast.setSize(326, 58)
    cast.setInteractive()
    cast.on('pointerdown', () => this.tweens.add({ targets: cast, scale: 0.97, duration: 70, yoyo: true }))
    cast.on('pointerup', () => this.cast())
    ui.add(cast)

    const upgradeBg = this.add.graphics()
    upgradeBg.fillStyle(colorNumber('#F8F1E3'), 0.96)
    upgradeBg.fillRoundedRect(12, 774, 366, 58, 17)
    upgradeBg.lineStyle(1, colorNumber(COLORS.sage), 0.3)
    upgradeBg.strokeRoundedRect(12, 774, 366, 58, 17)
    ui.add(upgradeBg)
    ui.add(this.add.image(43, 803, 'bait').setDisplaySize(37, 37))
    addText(this, ui, 74, 791, '魚餌升級', 12, COLORS.sageDark, { bold: true, originX: 0 })
    const cost = this.lureLevel === 1 ? 8 : 15
    const maxed = this.lureLevel >= 3
    addText(this, ui, 74, 813, maxed ? '稀有魚機會已提升' : `提高稀有魚機會 · 需要 ${cost} 金幣`, 10, COLORS.muted, {
      originX: 0,
    })

    const canUpgrade = !maxed && this.coins >= cost
    const upgrade = this.add.container(322, 803)
    drawRounded(this, upgrade, 0, 0, 104, 48, canUpgrade ? '#F2DFAF' : '#E9E3D7', 14, 1, '#D3BC89')
    addText(this, upgrade, 0, 0, maxed ? '滿級' : `升級 ${cost}`, 12, canUpgrade ? '#765533' : '#958879', { bold: true })
    upgrade.setSize(104, 48)
    if (canUpgrade) {
      upgrade.setInteractive()
      upgrade.on('pointerdown', () => this.tweens.add({ targets: upgrade, scale: 0.96, duration: 70, yoyo: true }))
      upgrade.on('pointerup', () => this.upgradeLure())
    }
    ui.add(upgrade)
  }

  upgradeLure() {
    if (this.state !== 'Ready' || this.lureLevel >= 3) return
    const cost = this.lureLevel === 1 ? 8 : 15
    if (this.coins < cost) return
    audio.tap()
    this.coins -= cost
    this.lureLevel += 1
    this.refreshHud()
    this.showReadyControls()
  }

  cast() {
    if (this.state !== 'Ready' || this.roundIndex >= this.rounds.length) return
    if (!this.transition('Casting')) return
    this.baitUsed = true
    audio.tap()
    this.refreshHud()
    this.readyUi?.destroy(true)
    this.readyUi = null
    this.toast.show('魚餌落水中…', { duration: 1050 })
    this.cat.play('cat-cast')
    this.bobber.setPosition(210, 418).setVisible(true).setAlpha(0)
    this.tweens.add({
      targets: this.bobber,
      x: 287,
      y: 477,
      alpha: 1,
      duration: 760,
      ease: 'Quad.Out',
      onStart: () => this.drawFishingLine(),
      onUpdate: () => this.drawFishingLine(),
      onComplete: () => {
        this.drawFishingLine()
        this.time.delayedCall(120, () => this.waitForBite())
      },
    })
  }

  drawFishingLine() {
    this.fishingLine.clear()
    this.fishingLine.setVisible(true)
    this.fishingLine.lineStyle(2, colorNumber('#6E5948'), 0.84)
    this.fishingLine.beginPath()
    this.fishingLine.moveTo(238, 489)
    this.fishingLine.lineTo(this.bobber.x, this.bobber.y + 3)
    this.fishingLine.strokePath()
  }

  waitForBite() {
    if (this.state !== 'Casting' || this.scene.isActive() === false) return
    if (!this.transition('WaitingBite')) return
    audio.tap()
    this.cat.play('cat-idle')
    this.toast.show('有魚咬鉤啦！', { duration: 800 })
    this.ripple.setVisible(true).setAlpha(0.82).setScale(0.45)
    this.tweens.add({
      targets: this.ripple,
      scale: 1.2,
      alpha: 0.18,
      duration: 650,
      yoyo: true,
      repeat: 1,
      ease: 'Sine.Out',
    })
    this.tweens.add({
      targets: this.bobber,
      y: this.bobber.y - 5,
      duration: 350,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.InOut',
    })
    this.time.delayedCall(620, () => this.askQuestion())
  }

  askQuestion() {
    if (this.state !== 'WaitingBite') return
    if (this.roundIndex >= this.rounds.length) {
      this.showResults()
      return
    }
    if (!this.transition('Question')) return
    const word = this.rounds[this.roundIndex]
    const options = shuffle([word, ...distractors(this.pool, word, 3)])
    this.currentQuestion = { word, options }
    this.peek.setVisible(true)
    this.questionPanel.show(word, options, this.promptKeys[this.roundIndex])
  }

  answer(option) {
    if (this.state !== 'Question' || !this.currentQuestion) return
    const { word } = this.currentQuestion
    const isCorrect = String(option.id) === String(word.id)
    const nextState = isCorrect ? 'ResolveCorrect' : 'ResolveWrong'
    if (!this.transition(nextState)) return

    if (isCorrect) this.resolveCorrect(word)
    else this.resolveWrong(option, word)
  }

  resolveCorrect(word) {
    const fish = fishForLure(this.lureLevel)
    const gainedTenths = fish.pounds + (this.lureLevel - 1) * 2
    const coinGain = Math.max(1, Math.ceil((gainedTenths / 10) * 2))
    this.correct += 1
    this.correctIds.push(word.id)
    this.poundsTenths += gainedTenths
    this.coins += coinGain
    this.onCorrect?.(word)
    audio.speakOnCorrect(word.en)
    this.refreshHud()

    const message = `釣到${fish.name}！+${(gainedTenths / 10).toFixed(1)} 磅 · +${coinGain} 金幣`
    this.questionPanel.resolve({
      selectedId: word.id,
      correctId: word.id,
      isCorrect: true,
      message,
    })
    this.announce?.(`${message}。`)
    this.cat.play('cat-fish')

    this.splash.setVisible(true).setAlpha(0).setScale(0.6)
    this.tweens.add({ targets: this.splash, alpha: 0.92, scale: 1.12, duration: 170, yoyo: true })
    this.createFishLeap(fish)
    this.createCoinPop(coinGain)
    if (fish.id === 'rare_big') {
      this.cameras.main.shake(100, 0.004)
      const sparkle = this.add.image(250, 432, 'sparkle').setDisplaySize(66, 66).setDepth(34)
      this.tweens.add({
        targets: sparkle,
        scale: 1.35,
        alpha: 0,
        rotation: Math.PI / 5,
        duration: 640,
        onComplete: () => sparkle.destroy(),
      })
    } else {
      this.cameras.main.shake(75, 0.001)
    }
    this.catResetEvent?.remove(false)
    this.catResetEvent = this.time.delayedCall(1040, () => this.cat.play('cat-idle'))
    this.scheduleFinishBeat()
  }

  createFishLeap(fish) {
    const rare = fish.id === 'rare_big'
    const startX = this.bobber.x
    const startY = this.bobber.y - 17
    const endX = 62
    const endY = 600
    const controlX = 176
    const controlY = 323
    const fishImage = this.add.image(startX, startY, `fish-${fish.id}`)
      .setDisplaySize(rare ? 148 : 112, rare ? 91 : 72)
      .setDepth(33)
      .setAlpha(0)
    this.fishLayer.add(fishImage)
    fishImage.setAlpha(1)
    const route = { progress: 0 }
    const tween = this.tweens.add({
      targets: route,
      progress: 1,
      duration: rare ? 1000 : 870,
      ease: 'Sine.InOut',
      onUpdate: () => {
        const t = route.progress
        const inverse = 1 - t
        fishImage.setPosition(
          inverse * inverse * startX + 2 * inverse * t * controlX + t * t * endX,
          inverse * inverse * startY + 2 * inverse * t * controlY + t * t * endY,
        )
        fishImage.setRotation(Math.sin(t * Math.PI) * 0.35)
        fishImage.setScale(rare ? 0.53 + Math.sin(t * Math.PI) * 0.04 : 0.43 + Math.sin(t * Math.PI) * 0.04)
      },
      onComplete: () => {
        fishImage.destroy()
      },
    })
    return tween
  }

  createCoinPop(amount) {
    const coin = this.add.image(80, 61, 'coin').setDisplaySize(27, 27).setDepth(40)
    const label = this.add.text(111, 60, `+${amount}`, {
      fontFamily: FONT_FAMILY,
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#956D31',
      padding: { x: 2, y: 2 },
    }).setOrigin(0, 0.5).setDepth(40)
    this.tweens.add({
      targets: [coin, label],
      y: '-=22',
      alpha: 0,
      duration: 750,
      delay: 220,
      onComplete: () => {
        coin.destroy()
        label.destroy()
      },
    })
  }

  resolveWrong(option, word) {
    this.missed.push(word.id)
    const message = `魚兒游走咗～答案係 ${word.en}`
    this.questionPanel.resolve({
      selectedId: option.id,
      correctId: word.id,
      isCorrect: false,
      message,
    })
    audio.wrong()
    this.announce?.(message)
    const escapingFish = this.add.image(this.bobber.x, this.bobber.y - 10, 'fish-common')
      .setDisplaySize(106, 67)
      .setDepth(33)
    this.tweens.add({
      targets: escapingFish,
      x: this.bobber.x + 132,
      y: this.bobber.y - 22,
      alpha: 0,
      duration: 560,
      ease: 'Sine.In',
      onComplete: () => escapingFish.destroy(),
    })
    this.cameras.main.shake(90, 0.0012)
    this.cat.play('cat-idle')
    this.scheduleFinishBeat()
  }

  scheduleFinishBeat() {
    this.time.delayedCall(1250, () => this.finishBeat())
  }

  finishBeat() {
    if (!['ResolveCorrect', 'ResolveWrong'].includes(this.state)) return
    this.bots.forEach((bot, index) => {
      bot.pounds += (index === 0 ? 8 : 7) + Math.floor(Math.random() * 10)
    })
    this.roundIndex += 1
    this.baitUsed = false
    this.currentQuestion = null
    this.refreshHud()
    if (this.roundIndex >= this.rounds.length) this.showResults()
    else this.enterReady()
  }

  standings() {
    return [
      { id: 'player', name: '字學貓', pounds: this.poundsTenths },
      ...this.bots,
    ].sort((a, b) => b.pounds - a.pounds)
  }

  showResults() {
    if (this.finished || this.state === 'Results') return
    if (!this.transition('Results')) return
    this.finished = true
    this.questionPanel?.destroy()
    this.readyUi?.destroy(true)
    this.readyUi = null
    this.peek.setVisible(false)
    this.toast?.clear()
    this.bobber.setVisible(false)
    this.ripple.setVisible(false)
    this.fishingLine.setVisible(false)
    this.refreshHud()

    const rank = this.standings()
    const place = rank.findIndex((entry) => entry.id === 'player') + 1
    const winner = rank[0]
    const title = winner.id === 'player' ? '你釣到最多磅數！' : `${winner.name}今次釣得最重，再試一次！`

    const shade = this.add.graphics().setDepth(27)
    shade.fillStyle(colorNumber('#6A9189'), 0.14)
    shade.fillRect(0, 172, DESIGN_WIDTH, DESIGN_HEIGHT - 172)

    this.cat.setPosition(196, 404).setDisplaySize(112, 140).setDepth(29).play('cat-cheer')
    const card = this.add.container(195, 622).setDepth(30)
    card.add(this.add.image(0, 0, 'panel').setDisplaySize(368, 398))
    addText(this, card, 0, -164, '釣魚比賽', 24, COLORS.sageDark, { bold: true })
    addText(this, card, 0, -132, title, 17, COLORS.ink, { bold: true, wordWrapWidth: 322 })
    addText(this, card, 0, -104, `你釣到 ${(this.poundsTenths / 10).toFixed(1)} 磅 · 第 ${place} 名`, 14, COLORS.muted, { bold: true })

    rank.forEach((entry, index) => {
      const rowY = -48 + index * 57
      drawRounded(this, card, 0, rowY, 318, 49, index === 0 ? '#E2EDE1' : '#F6F1E6', 14, 0.98, '#D7DCCB')
      drawRounded(this, card, -132, rowY, 29, 29, index === 0 ? COLORS.sage : '#B7AA95', 15, 1)
      addText(this, card, -132, rowY, String(index + 1), 13, COLORS.white, { bold: true })
      const avatarKey = entry.id === 'rabbit' ? 'rabbit' : entry.id === 'chick' ? 'chick' : 'fishIcon'
      card.add(this.add.image(-98, rowY, avatarKey).setDisplaySize(32, 32))
      addText(this, card, -73, rowY, entry.name, 15, COLORS.ink, { bold: true, originX: 0 })
      addText(this, card, 116, rowY, `${(entry.pounds / 10).toFixed(1)} 磅`, 14, COLORS.sageDark, { bold: true })
    })

    drawRounded(this, card, 0, 144, 310, 43, '#F5E7C5', 16, 0.98)
    card.add(this.add.image(-88, 144, 'coin').setDisplaySize(28, 28))
    addText(this, card, -12, 144, `金幣 ${this.coins}`, 16, '#795E3D', { bold: true })
    addText(this, card, 95, 144, `魚餌 Lv.${this.lureLevel}`, 12, COLORS.sageDark, { bold: true })
    this.add.image(250, 374, 'sparkle').setDisplaySize(62, 62).setDepth(32).setAlpha(0.85)

    this.announce?.(`${title} 你釣到 ${(this.poundsTenths / 10).toFixed(1)} 磅，第 ${place} 名，獲得 ${this.coins} 金幣。`)
    const result = {
      correct: this.correct,
      total: this.rounds.length,
      coins: this.coins,
      missed: this.missed,
      correctIds: this.correctIds,
      meta: {
        pounds: this.poundsTenths / 10,
        lure: this.lureLevel,
        bots: this.bots.map(({ id, name, pounds }) => ({ id, name, pounds: pounds / 10 })),
        place,
      },
    }
    this.time.delayedCall(1450, () => {
      if (!this.finished || !this.scene.isActive()) return
      this.onDone?.(result)
    })
  }

  shutdownScene() {
    this.finished = true
    this.time.removeAllEvents()
    this.tweens.killAll()
    this.catResetEvent?.remove(false)
    this.toast?.destroy()
    this.questionPanel?.destroy()
    this.hud?.destroy()
    this.sound.stopAll()
  }
}
