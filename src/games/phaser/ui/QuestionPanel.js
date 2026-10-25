import { COLORS, FONT_FAMILY } from '../theme.js'

const BUTTON_TEXTURES = {
  normal: 'choiceNormal',
  correct: 'choiceCorrect',
  wrong: 'choiceWrong',
}

function colorNumber(color) {
  return Number.parseInt(color.slice(1), 16)
}

function addText(scene, parent, x, y, value, size, color, options = {}) {
  const text = scene.add.text(x, y, value, {
    fontFamily: FONT_FAMILY,
    fontSize: `${size}px`,
    fontStyle: options.bold ? 'bold' : 'normal',
    color,
    align: options.align || 'center',
    wordWrap: options.wordWrapWidth ? { width: options.wordWrapWidth, useAdvancedWrap: true } : undefined,
    lineSpacing: options.lineSpacing ?? 0,
    padding: { x: 2, y: 2 },
  }).setOrigin(options.originX ?? 0.5, options.originY ?? 0.5)
  parent.add(text)
  return text
}

export default class QuestionPanel {
  constructor(scene, { onAnswer, onSpeak, announce }) {
    this.scene = scene
    this.onAnswer = onAnswer
    this.onSpeak = onSpeak
    this.announce = announce
    this.container = null
    this.choices = []
    this.feedback = null
    this.resolved = false
  }

  show(word, options, imageKey) {
    this.destroy()
    const scene = this.scene
    const panel = scene.add.container(195, 628).setDepth(30)
    this.container = panel
    panel.setAlpha(0)
    panel.y += 16

    const card = scene.add.image(0, 0, 'panel').setDisplaySize(370, 398)
    panel.add(card)

    const imagePlate = scene.add.graphics()
    imagePlate.fillStyle(colorNumber(COLORS.creamLight), 1)
    imagePlate.fillRoundedRect(-164, -180, 96, 96, 18)
    imagePlate.lineStyle(1, colorNumber(COLORS.sage), 0.25)
    imagePlate.strokeRoundedRect(-164, -180, 96, 96, 18)
    panel.add(imagePlate)
    const promptKey = imageKey && scene.textures.exists(imageKey) ? imageKey : 'fishIcon'
    const prompt = scene.add.image(-116, -132, promptKey).setDisplaySize(82, 82)
    panel.add(prompt)

    addText(scene, panel, 23, -168, '睇圖揀英文', 21, COLORS.sageDark, { bold: true })
    addText(scene, panel, 23, -144, '揀出正確嘅英文生字', 12, COLORS.muted)

    const speaker = scene.add.container(24, -103)
    const speakBg = scene.add.graphics()
    speakBg.fillStyle(colorNumber(COLORS.sage), 1)
    speakBg.fillRoundedRect(-65, -24, 130, 48, 17)
    speaker.add(speakBg)
    const speakerIcon = scene.add.image(-35, 0, 'speak').setDisplaySize(23, 23)
    speaker.add(speakerIcon)
    addText(scene, speaker, 13, 0, '聽英文', 14, COLORS.white, { bold: true })
    speaker.setSize(130, 48)
    speaker.setInteractive()
    speaker.on('pointerdown', () => {
      if (this.resolved) return
      scene.tweens.add({ targets: speaker, scale: 0.96, duration: 70, yoyo: true })
    })
    speaker.on('pointerup', () => {
      if (!this.resolved) this.onSpeak?.(word)
    })
    panel.add(speaker)

    this.choices = []
    const positions = [
      { x: -88, y: -15 },
      { x: 88, y: -15 },
      { x: -88, y: 56 },
      { x: 88, y: 56 },
    ]
    options.forEach((option, index) => {
      const position = positions[index] || { x: 0, y: 56 + index * 68 }
      const button = scene.add.container(position.x, position.y)
      const background = scene.add.image(0, 0, BUTTON_TEXTURES.normal).setDisplaySize(166, 65)
      button.add(background)

      const englishSize = 22
      const gloss = option.zhHant == null ? '' : String(option.zhHant)
      addText(scene, button, 0, gloss ? -8 : 0, String(option.en ?? ''), englishSize, COLORS.ink, {
        bold: true,
        wordWrapWidth: 140,
      })
      if (gloss) addText(scene, button, 0, 16, gloss, 12, COLORS.muted, { bold: true })

      const mark = addText(scene, button, 64, -18, '', 21, COLORS.sageDark, { bold: true })
      button.setSize(166, 65)
      button.setInteractive()
      const entry = { button, background, mark, option, answered: false }
      this.choices.push(entry)

      button.on('pointerdown', () => {
        if (this.resolved) return
        background.setTexture('choicePressed')
        scene.tweens.add({ targets: button, scaleX: 0.97, scaleY: 0.97, duration: 65 })
      })
      button.on('pointerout', () => {
        if (this.resolved) return
        background.setTexture('choiceNormal')
        scene.tweens.add({ targets: button, scaleX: 1, scaleY: 1, duration: 80 })
      })
      button.on('pointerup', () => {
        if (this.resolved) return
        background.setTexture('choiceNormal')
        scene.tweens.add({ targets: button, scaleX: 1, scaleY: 1, duration: 80 })
        this.onAnswer?.(option)
      })
      panel.add(button)
    })

    this.feedback = addText(scene, panel, 0, 127, '', 14, COLORS.ink, { bold: true, wordWrapWidth: 320 })
    scene.tweens.add({ targets: panel, alpha: 1, y: 628, duration: 220, ease: 'Sine.Out' })
    this.announce?.(`有魚咬鉤。${word.zhHant ? `圖片提示：${word.zhHant}。` : ''}請揀英文。`)
  }

  resolve({ selectedId, correctId, isCorrect, message }) {
    if (this.resolved) return
    this.resolved = true
    for (const entry of this.choices) {
      const isAnswer = String(entry.option.id) === String(correctId)
      const isSelection = String(entry.option.id) === String(selectedId)
      const type = isAnswer ? 'correct' : isSelection ? 'wrong' : 'normal'
      entry.background.setTexture(BUTTON_TEXTURES[type])
      entry.mark.setText(isAnswer ? '✓' : isSelection ? '✕' : '')
      if (isAnswer || isSelection) {
        entry.mark.setColor(isAnswer ? COLORS.sageDark : '#A85E4B')
        this.scene.tweens.add({ targets: entry.button, scale: 1.025, duration: 100, yoyo: true })
      }
      entry.button.disableInteractive()
    }
    this.feedback.setText(message)
    this.feedback.setColor(isCorrect ? COLORS.sageDark : '#A85E4B')
    this.announce?.(message)
  }

  destroy() {
    if (this.container) this.container.destroy(true)
    this.container = null
    this.choices = []
    this.feedback = null
    this.resolved = false
  }
}
