import { distractors, shuffle } from '../lib/vocab.js'
import * as audio from '../lib/audio.js'

const ART = {
  chefIdle: '/art/games/cafe/cafe_mascot_chef.webp',
  chefCook: [1, 2, 3, 4].map((frame) => `/art/games/anim/zxm_chef_0${frame}.webp`),
  customers: {
    rabbit: {
      name: '兔仔',
      frames: [1, 2, 3, 4].map((frame) => `/art/games/anim/customer_rabbit_idle_0${frame}.webp`),
    },
    corgi: {
      name: '柯基',
      frames: [1, 2, 3, 4].map((frame) => `/art/games/anim/customer_corgi_idle_0${frame}.webp`),
    },
  },
  coin: '/art/games/shared/hud_coin_icon.webp',
  sparkle: '/art/games/shared/fx_sparkle_gold.webp',
}

const MAX_QUEUE = 3
const PATIENCE_MS = 14000
const PATIENCE_TICK_MS = 120
const WRONG_PATIENCE_LOSS = 34
const UPGRADES = [
  { id: 'oven', title: '小焗爐', detail: '耐性慢 15%', cost: 6, icon: '♨️', reduction: 0.15 },
  { id: 'tray', title: '加大烤盤', detail: '耐性慢 20%', cost: 12, icon: '🍪', reduction: 0.2 },
]

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char])
}

function imagePath(path) {
  if (!path) return ''
  const value = String(path)
  return value.startsWith('/') ? value : `/${value}`
}

function uniqueWords(list) {
  const seen = new Set()
  return list.filter((word) => {
    if (!word || word.id == null || seen.has(String(word.id))) return false
    seen.add(String(word.id))
    return true
  })
}

/** Prefer food words, then use the rest of the selected pool when needed. */
function pickCafeWords(words, pool, roundSize = 8) {
  const selected = Array.isArray(words) && words.length ? words : []
  const fullPool = Array.isArray(pool) && pool.length ? pool : selected
  const base = uniqueWords(selected.length ? selected : fullPool)
  const food = base.filter((word) => word.theme === 'food')
  if (!food.length) return base
  if (food.length >= roundSize) return food

  // A food lesson can still use its other words to fill a short cafe round.
  // Include broader pool entries only when the selected food set is too small.
  return uniqueWords([...food, ...base.filter((word) => word.theme !== 'food'), ...fullPool])
}

function makeRounds(source, requestedRounds) {
  if (!source.length || requestedRounds <= 0) return []
  const food = source.filter((word) => word.theme === 'food')
  const fallback = source.filter((word) => word.theme !== 'food')
  const ordered = food.length && food.length < requestedRounds
    ? [...shuffle(food), ...shuffle(fallback)]
    : shuffle(source)
  const rounds = ordered.slice(0, requestedRounds)

  return rounds
}

/** Diner dash cafe — answer the order to serve the customer. */
export function createCafeOrder({ words, pool, onDone, onCorrect, roundSize = 8 }) {
  const requestedRounds = Number.isFinite(Number(roundSize))
    ? Math.max(0, Math.floor(Number(roundSize)))
    : 8
  const answerPool = uniqueWords(Array.isArray(pool) && pool.length ? pool : (Array.isArray(words) ? words : []))
  const source = pickCafeWords(words, answerPool, requestedRounds)
  const rounds = makeRounds(source, requestedRounds)

  let rootEl = null
  let queue = []
  let nextOrderIndex = 0
  let nextCustomerId = 1
  let served = 0
  let left = 0
  let coins = 0
  let restockUsed = false
  let restockArmed = false
  let gateLocked = false
  let answerLocked = false
  let finished = false
  let destroyed = false
  let customerFrame = 0
  let questionVersion = 0
  let patienceInterval = null
  let customerAnimationInterval = null
  let chefAnimationInterval = null
  let arrivalTimer = null
  let departureTimer = null
  let chefStopTimer = null
  const timers = new Set()
  const boughtUpgrades = new Set()
  const missedIds = new Set()
  const correctIds = []

  function schedule(callback, delay) {
    const timer = setTimeout(() => {
      timers.delete(timer)
      callback()
    }, delay)
    timers.add(timer)
    return timer
  }

  function clearTracked(timer) {
    if (!timer) return
    clearTimeout(timer)
    timers.delete(timer)
  }

  function clearTimers() {
    timers.forEach((timer) => clearTimeout(timer))
    timers.clear()
    arrivalTimer = null
    departureTimer = null
    chefStopTimer = null
    if (patienceInterval) clearInterval(patienceInterval)
    if (customerAnimationInterval) clearInterval(customerAnimationInterval)
    if (chefAnimationInterval) clearInterval(chefAnimationInterval)
    patienceInterval = null
    customerAnimationInterval = null
    chefAnimationInterval = null
  }

  function activeCustomer() {
    return queue[0] && !queue[0].leaving ? queue[0] : null
  }

  function customerImage(customer) {
    return ART.customers[customer.type].frames[0]
  }

  function updateHud() {
    if (!rootEl) return
    const coinCount = rootEl.querySelector('[data-coins]')
    const servedCount = rootEl.querySelector('[data-served]')
    const queueCount = rootEl.querySelector('[data-queue-count]')
    if (coinCount) coinCount.textContent = String(coins)
    if (servedCount) servedCount.textContent = `${served}/${rounds.length}`
    if (queueCount) queueCount.textContent = `${queue.filter((customer) => !customer.leaving).length}/${MAX_QUEUE}`
    rootEl.querySelectorAll('[data-upgrade]').forEach((button) => {
      const upgrade = UPGRADES.find((item) => item.id === button.dataset.upgrade)
      if (!upgrade) return
      const purchased = boughtUpgrades.has(upgrade.id)
      button.disabled = finished || purchased || coins < upgrade.cost
      button.classList.toggle('is-bought', purchased)
      const state = button.querySelector('[data-upgrade-state]')
      if (state) state.textContent = purchased ? '已升級' : `${upgrade.cost} 金幣`
    })
    const restock = rootEl.querySelector('[data-restock]')
    if (restock) {
      restock.disabled = finished || restockUsed
      restock.classList.toggle('is-armed', restockArmed)
      const status = restock.querySelector('[data-restock-status]')
      if (status) status.textContent = restockArmed ? '下次出餐 +1 金幣' : restockUsed ? '已使用' : '免費一次 · 下次出餐 +1 金幣'
      restock.setAttribute('aria-pressed', String(restockArmed))
    }
  }

  function renderQueue() {
    if (!rootEl) return
    const queueEl = rootEl.querySelector('[data-queue]')
    if (!queueEl) return
    queueEl.innerHTML = Array.from({ length: MAX_QUEUE }, (_, index) => {
      const customer = queue[index]
      if (!customer) {
        return `<div class="cafe-customer cafe-customer-empty" aria-hidden="true"><span>等候位</span><i>✿</i></div>`
      }
      const type = ART.customers[customer.type]
      const isActive = index === 0 && !customer.leaving
      const patience = Math.max(0, Math.min(100, customer.patience))
      return `
        <article class="cafe-customer${isActive ? ' is-active' : ''}${customer.leaving ? ' is-leaving' : ''}" data-customer-id="${escapeHtml(customer.id)}" role="listitem" aria-label="${escapeHtml(type.name)}的點餐">
          <div class="cafe-thought">
            <img src="${escapeHtml(imagePath(customer.word.image))}" alt="${escapeHtml(customer.word.zhHant)}" />
            <span>${escapeHtml(customer.word.zhHant)}</span>
          </div>
          <img class="cafe-customer-sprite" data-customer-type="${escapeHtml(customer.type)}" src="${escapeHtml(customerImage(customer))}" alt="${escapeHtml(type.name)}" draggable="false" />
          <div class="cafe-patience" aria-label="耐性 ${Math.round(patience)}%"><span class="cafe-patience-fill" style="width:${patience}%"></span></div>
          <span class="cafe-customer-label">${customer.leaving ? (customer.wasServed ? '開心出餐' : '離開了') : isActive ? '前枱' : '排隊'}</span>
        </article>
      `
    }).join('')
    updateHud()
  }

  function renderQuestion() {
    if (!rootEl || finished || destroyed) return
    const section = rootEl.querySelector('[data-question]')
    if (!section) return
    questionVersion++
    const customer = activeCustomer()
    if (!customer) {
      section.innerHTML = `
        <div class="cafe-waiting">
          <span class="cafe-waiting-icon" aria-hidden="true">☕</span>
          <div><strong>${nextOrderIndex < rounds.length ? '新顧客快到啦' : '今日餐單完成'}</strong><span>${nextOrderIndex < rounds.length ? '整理一下櫃檯，下一位客人就到。' : '看看今天賺到幾多金幣！'}</span></div>
        </div>
        <div class="cafe-feedback" data-feedback aria-live="polite"></div>
      `
      return
    }
    const options = shuffle([customer.word, ...distractors(answerPool, customer.word, 3)])
    section.innerHTML = `
      <div class="cafe-question-head">
        <div class="cafe-order-prompt">
          <img class="cafe-prompt-img" src="${escapeHtml(imagePath(customer.word.image))}" alt="${escapeHtml(customer.word.zhHant)}" />
          <div class="cafe-prompt-copy">
            <span class="cafe-prompt-eyebrow">${escapeHtml(ART.customers[customer.type].name)} · 訂單 ${customer.orderNo}/${rounds.length}</span>
            <strong>${escapeHtml(customer.word.zhHant)}</strong>
            <span class="cafe-prompt-caption">答啱即出餐</span>
          </div>
        </div>
        <button type="button" class="cafe-speak" data-speak aria-label="聽英文發音">🔊</button>
      </div>
      <div class="cafe-choices" data-choices></div>
      <div class="cafe-feedback" data-feedback aria-live="polite">揀英文，幫客人出餐！</div>
    `
    const choices = section.querySelector('[data-choices]')
    options.forEach((option) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'cafe-choice'
      button.dataset.choice = String(option.id)
      button.textContent = option.en
      button.disabled = gateLocked || answerLocked || customer.leaving
      button.addEventListener('click', () => answer(customer, option, button))
      choices.appendChild(button)
    })
    section.querySelector('[data-speak]').addEventListener('click', () => {
      if (finished || destroyed) return
      audio.tap()
      audio.speak(customer.word.en)
    })
  }

  function updatePatienceBars() {
    if (!rootEl) return
    queue.forEach((customer) => {
      const card = rootEl.querySelector(`[data-customer-id="${customer.id}"]`)
      if (!card) return
      const fill = card.querySelector('.cafe-patience-fill')
      const bar = card.querySelector('.cafe-patience')
      const patience = Math.max(0, Math.min(100, customer.patience))
      if (fill) fill.style.width = `${patience}%`
      if (bar) bar.setAttribute('aria-label', `耐性 ${Math.round(patience)}%`)
    })
  }

  function markMissed(word) {
    if (word?.id != null) missedIds.add(word.id)
  }

  function currentDrainRate() {
    let reduction = 0
    UPGRADES.forEach((upgrade) => {
      if (boughtUpgrades.has(upgrade.id)) reduction += upgrade.reduction
    })
    return Math.max(0.5, 1 - reduction)
  }

  function announce(message, kind = '') {
    const feedback = rootEl?.querySelector('[data-feedback]')
    if (!feedback) return
    feedback.className = `cafe-feedback${kind ? ` is-${kind}` : ''}`
    feedback.innerHTML = message
  }

  function finishIfDone() {
    if (finished || destroyed) return
    const allOrdersUsed = nextOrderIndex >= rounds.length
    const noCustomers = queue.length === 0
    if (served < rounds.length && !(allOrdersUsed && noCustomers)) return
    finished = true
    clearTimers()
    updateHud()
    if (rootEl) {
      rootEl.querySelectorAll('button').forEach((button) => { button.disabled = true })
      const question = rootEl.querySelector('[data-question]')
      if (question) {
        question.innerHTML = `
          <div class="cafe-finish-card">
            <img src="${ART.sparkle}" alt="" />
            <div><strong>收工啦！</strong><span>字學貓招呼了 ${served} 位客人</span></div>
            <b>+${coins} 金幣</b>
          </div>
        `
      }
    }
    onDone?.({
      correct: served,
      total: rounds.length,
      coins,
      missed: [...missedIds],
      correctIds,
      meta: { served, left },
    })
  }

  function removeDepartures() {
    departureTimer = null
    if (destroyed || finished) return
    queue = queue.filter((customer) => !customer.leaving)
    gateLocked = false
    answerLocked = false
    renderQueue()
    renderQuestion()
    ensureArrival(420)
    finishIfDone()
  }

  function scheduleDeparture() {
    if (departureTimer || destroyed || finished) return
    departureTimer = schedule(removeDepartures, 540)
  }

  function patienceTick() {
    if (destroyed || finished) return
    const drain = (PATIENCE_TICK_MS / PATIENCE_MS) * 100 * currentDrainRate()
    let hasChange = false
    const expired = []
    queue.forEach((customer) => {
      if (customer.leaving) return
      customer.patience = Math.max(0, customer.patience - drain)
      hasChange = true
      if (customer.patience <= 0) expired.push(customer)
    })
    expired.forEach((customer) => {
      customer.leaving = true
      customer.wasServed = false
      left++
      markMissed(customer.word)
      const card = rootEl?.querySelector(`[data-customer-id="${customer.id}"]`)
      card?.classList.add('is-leaving')
      const label = card?.querySelector('.cafe-customer-label')
      if (label) label.textContent = '離開了'
    })
    if (expired.length) {
      const activeExpired = expired.some((customer) => customer.id === queue[0]?.id)
      if (activeExpired) {
        gateLocked = true
      }
      updateHud()
      if (activeExpired) renderQuestion()
      if (activeExpired) announce('耐性用完了，客人先離開了。', 'missed')
      scheduleDeparture()
    } else if (hasChange) {
      updatePatienceBars()
    }
  }

  function createCustomer() {
    if (nextOrderIndex >= rounds.length) return null
    const previous = queue[queue.length - 1]?.type
    const availableTypes = Object.keys(ART.customers).filter((type) => type !== previous)
    const type = availableTypes[Math.floor(Math.random() * availableTypes.length)] || 'rabbit'
    const customer = {
      id: nextCustomerId++,
      type,
      word: rounds[nextOrderIndex],
      orderNo: nextOrderIndex + 1,
      patience: 100,
      leaving: false,
      wasServed: false,
    }
    nextOrderIndex++
    return customer
  }

  function scheduleArrival(delay) {
    if (arrivalTimer || destroyed || finished || queue.length >= MAX_QUEUE || nextOrderIndex >= rounds.length) return
    arrivalTimer = schedule(() => {
      arrivalTimer = null
      if (destroyed || finished || queue.length >= MAX_QUEUE || nextOrderIndex >= rounds.length) return
      queue.push(createCustomer())
      renderQueue()
      if (queue.length === 1) renderQuestion()
      scheduleArrival(queue.length < MAX_QUEUE ? 850 : 0)
    }, delay)
  }

  function ensureArrival(delay = 700) {
    if (queue.length < MAX_QUEUE && nextOrderIndex < rounds.length) scheduleArrival(delay)
  }

  function animateChef() {
    const image = rootEl?.querySelector('[data-chef]')
    if (!image || destroyed || finished) return
    if (chefAnimationInterval) clearInterval(chefAnimationInterval)
    clearTracked(chefStopTimer)
    image.classList.add('is-working')
    let frame = 0
    image.src = ART.chefCook[frame]
    chefAnimationInterval = setInterval(() => {
      frame = (frame + 1) % ART.chefCook.length
      if (image.isConnected) image.src = ART.chefCook[frame]
    }, 135)
    chefStopTimer = schedule(() => {
      if (chefAnimationInterval) clearInterval(chefAnimationInterval)
      chefAnimationInterval = null
      chefStopTimer = null
      if (image.isConnected) {
        image.src = ART.chefIdle
        image.classList.remove('is-working')
      }
    }, 1050)
    const sparkle = rootEl.querySelector('[data-sparkle]')
    if (sparkle) {
      sparkle.classList.remove('is-pop')
      void sparkle.offsetWidth
      sparkle.classList.add('is-pop')
    }
  }

  function answer(customer, option, chosenButton) {
    if (finished || destroyed || gateLocked || answerLocked || customer.leaving || activeCustomer()?.id !== customer.id) return
    const isCorrect = String(option.id) === String(customer.word.id)
    const section = rootEl?.querySelector('[data-question]')
    const buttons = [...(section?.querySelectorAll('.cafe-choice') || [])]
    const right = buttons.find((button) => button.dataset.choice === String(customer.word.id))
    if (isCorrect) {
      gateLocked = true
      buttons.forEach((button) => { button.disabled = true })
      chosenButton.classList.add('is-correct')
      audio.speakOnCorrect(customer.word.en)
      served++
      correctIds.push(customer.word.id)
      const tip = restockArmed ? 3 : 2
      coins += tip
      restockArmed = false
      customer.leaving = true
      customer.wasServed = true
      onCorrect?.(customer.word)
      const card = rootEl.querySelector(`[data-customer-id="${customer.id}"]`)
      card?.classList.add('is-leaving')
      const label = card?.querySelector('.cafe-customer-label')
      if (label) label.textContent = '開心出餐'
      updateHud()
      announce(`<img src="${ART.sparkle}" alt="" /> ${escapeHtml(customer.word.en)} 出餐成功！ +${tip} 金幣`, 'good')
      animateChef()
      scheduleDeparture()
      return
    }

    answerLocked = true
    buttons.forEach((button) => { button.disabled = true })
    if (chosenButton) chosenButton.classList.add('is-wrong')
    if (right) right.classList.add('is-correct')
    audio.wrong()
    markMissed(customer.word)
    customer.patience = Math.max(0, customer.patience - WRONG_PATIENCE_LOSS)
    updatePatienceBars()
    announce(`差少少！耐性減少了，${escapeHtml(customer.word.en)}。`, 'missed')
    if (customer.patience <= 0) {
      patienceTick()
      return
    }
    const version = questionVersion
    schedule(() => {
      if (destroyed || finished || version !== questionVersion || activeCustomer()?.id !== customer.id || customer.leaving) return
      buttons.forEach((button) => {
        button.disabled = false
        button.classList.remove('is-wrong', 'is-correct')
      })
      answerLocked = false
    }, 650)
  }

  function buyUpgrade(id) {
    if (finished || destroyed || boughtUpgrades.has(id)) return
    const upgrade = UPGRADES.find((item) => item.id === id)
    if (!upgrade || coins < upgrade.cost) return
    audio.tap()
    coins -= upgrade.cost
    boughtUpgrades.add(id)
    updateHud()
    const button = rootEl?.querySelector(`[data-upgrade="${id}"]`)
    button?.classList.add('is-purchase-pop')
    schedule(() => button?.classList.remove('is-purchase-pop'), 450)
  }

  function mount(root) {
    if (destroyed) return
    rootEl = root
    rootEl.innerHTML = `
      <div class="cafe-game">
        <header class="cafe-topline">
          <div class="cafe-title"><span class="cafe-title-icon" aria-hidden="true">☕</span><div><strong>小食店</strong><small>字學貓廚房</small></div></div>
          <div class="cafe-stats">
            <span class="cafe-stat cafe-progress"><b data-served>0/${rounds.length}</b><small>已出餐</small></span>
            <span class="cafe-stat cafe-coin"><img src="${ART.coin}" alt="" /><b data-coins>0</b></span>
          </div>
        </header>

        <section class="cafe-counter" aria-label="小食店櫃檯">
          <div class="cafe-wall-window" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
          <div class="cafe-shelf" aria-hidden="true"><i>✿</i><i>🍃</i><i>✿</i></div>
          <div class="cafe-queue-label">等候客人 <b data-queue-count>0/${MAX_QUEUE}</b></div>
          <div class="cafe-queue" data-queue role="list" aria-label="顧客隊伍"></div>
          <img class="cafe-sparkle" data-sparkle src="${ART.sparkle}" alt="" />
          <img class="cafe-chef" data-chef src="${ART.chefIdle}" alt="字學貓廚師" draggable="false" />
          <div class="cafe-counter-front" aria-hidden="true"><span>小食店 · 新鮮出爐</span><i>✿</i></div>
        </section>

        <div class="cafe-tools" aria-label="小食店工具">
          <button type="button" class="cafe-restock" data-restock aria-pressed="false">
            <span class="cafe-tool-icon" aria-hidden="true">🧺</span>
            <span><b>補貨</b><small data-restock-status>免費一次 · 下次出餐 +1 金幣</small></span>
          </button>
          <span class="cafe-serve-note"><i>✦</i> 答啱即出餐</span>
        </div>

        <section class="cafe-question" data-question aria-label="出餐詞語問題"></section>

        <section class="cafe-upgrades" aria-label="升級櫃檯">
          <div class="cafe-upgrade-title"><span>✿</span> 升級 <span>✿</span></div>
          <div class="cafe-upgrade-grid">
            ${UPGRADES.map((upgrade) => `
              <button type="button" class="cafe-upgrade" data-upgrade="${escapeHtml(upgrade.id)}" aria-label="${escapeHtml(upgrade.title)}，${upgrade.cost} 金幣">
                <span class="cafe-upgrade-icon" aria-hidden="true">${upgrade.icon}</span>
                <span class="cafe-upgrade-copy"><b>${escapeHtml(upgrade.title)}</b><small>${escapeHtml(upgrade.detail)}</small></span>
                <span class="cafe-upgrade-cost" data-upgrade-state>${upgrade.cost} 金幣</span>
              </button>
            `).join('')}
          </div>
        </section>
      </div>
    `

    rootEl.querySelector('[data-restock]').addEventListener('click', () => {
      if (finished || destroyed || restockUsed) return
      audio.tap()
      restockUsed = true
      restockArmed = true
      updateHud()
    })
    rootEl.querySelectorAll('[data-upgrade]').forEach((button) => {
      button.addEventListener('click', () => buyUpgrade(button.dataset.upgrade))
    })

    renderQueue()
    renderQuestion()
    if (!rounds.length) {
      rootEl.querySelector('[data-question]').innerHTML = '<div class="cafe-empty">今次沒有詞語可以出餐。</div>'
      finishIfDone()
      return
    }
    queue.push(createCustomer())
    renderQueue()
    renderQuestion()
    scheduleArrival(820)
    patienceInterval = setInterval(patienceTick, PATIENCE_TICK_MS)
    customerAnimationInterval = setInterval(() => {
      if (!rootEl || destroyed) return
      customerFrame = (customerFrame + 1) % 4
      rootEl.querySelectorAll('[data-customer-type]').forEach((image) => {
        const frames = ART.customers[image.dataset.customerType]?.frames
        if (frames && image.isConnected) image.src = frames[customerFrame]
      })
    }, 210)
  }

  function destroy() {
    if (destroyed) return
    destroyed = true
    clearTimers()
    rootEl = null
  }

  return { mount, destroy }
}
