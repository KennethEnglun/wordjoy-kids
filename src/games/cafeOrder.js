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

const INGREDIENTS = [
  { id: 'bread', zh: '麵包', en: 'bread', emoji: '🍞', color: 'wheat' },
  { id: 'vegetable', zh: '蔬菜', en: 'vegetable', emoji: '🥬', color: 'leaf' },
  { id: 'tomato', zh: '番茄', en: 'tomato', emoji: '🍅', color: 'tomato' },
  { id: 'cheese', zh: '芝士', en: 'cheese', emoji: '🧀', color: 'cheese' },
  { id: 'patty', zh: '漢堡肉', en: 'patty', emoji: '🥩', color: 'patty' },
  { id: 'cup', zh: '杯子', en: 'cup', emoji: '🥤', color: 'cup' },
  { id: 'beans', zh: '咖啡豆', en: 'coffee beans', emoji: '🫘', color: 'beans' },
  { id: 'milk', zh: '牛奶', en: 'milk', emoji: '🥛', color: 'milk' },
]

// Recipe table: Sandwich 三文治 = bread 麵包, vegetable 蔬菜, tomato 番茄, cheese 芝士;
// Burger 漢堡 = bread 麵包, burger patty 漢堡肉, cheese 芝士 (shared with sandwich);
// Coffee 咖啡 = cup 杯子, coffee beans 咖啡豆, milk 牛奶.
const DISHES = [
  { id: 'sandwich', zh: '三文治', en: 'Sandwich', emoji: '🥪', ingredients: ['bread', 'vegetable', 'tomato', 'cheese'] },
  { id: 'burger', zh: '漢堡', en: 'Burger', emoji: '🍔', ingredients: ['bread', 'patty', 'cheese'] },
  { id: 'coffee', zh: '咖啡', en: 'Coffee', emoji: '☕', ingredients: ['cup', 'beans', 'milk'] },
]

const INGREDIENT_BY_ID = Object.fromEntries(INGREDIENTS.map((ingredient) => [ingredient.id, ingredient]))
const DISH_BY_ID = Object.fromEntries(DISHES.map((dish) => [dish.id, dish]))
const MAX_QUEUE = 3
const PATIENCE_MS = 36000
const PATIENCE_TICK_MS = 150
const WRONG_PATIENCE_LOSS = 22

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
  return uniqueWords([...food, ...base.filter((word) => word.theme !== 'food'), ...fullPool])
}

function makeRounds(source, requestedRounds) {
  if (!source.length || requestedRounds <= 0) return []
  const food = source.filter((word) => word.theme === 'food')
  const fallback = source.filter((word) => word.theme !== 'food')
  const ordered = food.length && food.length < requestedRounds
    ? [...shuffle(food), ...shuffle(fallback)]
    : shuffle(source)
  return ordered.slice(0, requestedRounds)
}

/** Vocab answers earn ingredients; players assemble each customer's dish before serving it. */
export function createCafeOrder({ words, pool, onDone, onCorrect, roundSize = 8 }) {
  const requestedRounds = Number.isFinite(Number(roundSize))
    ? Math.max(0, Math.floor(Number(roundSize)))
    : 8
  const answerPool = uniqueWords(Array.isArray(pool) && pool.length ? pool : (Array.isArray(words) ? words : []))
  const source = pickCafeWords(words, answerPool, requestedRounds)
  const rounds = makeRounds(source, requestedRounds)
  const customerLimit = rounds.length ? Math.min(MAX_QUEUE, Math.max(1, Math.ceil(rounds.length / 4))) : 0

  let rootEl = null
  let queue = []
  let nextOrderIndex = 0
  let nextCustomerId = 1
  let questionIndex = 0
  let vocabCorrect = 0
  let served = 0
  let left = 0
  let coins = 0
  let answerLocked = false
  let finished = false
  let destroyed = false
  let customerFrame = 0
  let patienceInterval = null
  let customerAnimationInterval = null
  let chefAnimationInterval = null
  let arrivalTimer = null
  let departureTimer = null
  let chefStopTimer = null
  let questionAdvanceTimer = null
  let lastCustomerType = null
  const timers = new Set()
  const inventory = Object.fromEntries(INGREDIENTS.map((ingredient) => [ingredient.id, 0]))
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
    questionAdvanceTimer = null
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

  function recipeFor(customer) {
    return customer ? DISH_BY_ID[customer.dishId] : null
  }

  function isRecipeComplete(customer) {
    const recipe = recipeFor(customer)
    return Boolean(recipe && recipe.ingredients.every((id) => customer.slots.includes(id)))
  }

  function imageFor(customer) {
    return ART.customers[customer.type].frames[0]
  }

  function updateHud() {
    if (!rootEl) return
    const servedCount = rootEl.querySelector('[data-served]')
    const coinCount = rootEl.querySelector('[data-coins]')
    const queueCount = rootEl.querySelector('[data-queue-count]')
    if (servedCount) servedCount.textContent = `${served}/${customerLimit}`
    if (coinCount) coinCount.textContent = String(coins)
    if (queueCount) queueCount.textContent = `${queue.filter((customer) => !customer.leaving).length}/${MAX_QUEUE}`
  }

  function renderQueue() {
    if (!rootEl) return
    const queueEl = rootEl.querySelector('[data-queue]')
    if (!queueEl) return
    queueEl.innerHTML = Array.from({ length: MAX_QUEUE }, (_, index) => {
      const customer = queue[index]
      if (!customer) {
        return '<div class="cafe-customer cafe-customer-empty" aria-hidden="true"><span>等候位</span><i>✿</i></div>'
      }
      const type = ART.customers[customer.type]
      const dish = recipeFor(customer)
      const isActive = index === 0 && !customer.leaving
      const patience = Math.max(0, Math.min(100, customer.patience))
      const checklist = dish.ingredients.map((id) => {
        const ingredient = INGREDIENT_BY_ID[id]
        const filled = customer.slots.includes(id)
        return `<span class="cafe-thought-item${filled ? ' is-filled' : ''}" title="${escapeHtml(ingredient.zh)}"><i>${filled ? '✓' : '○'}</i>${escapeHtml(ingredient.zh)}</span>`
      }).join('')
      const status = customer.leaving
        ? (customer.wasServed ? '開心出餐' : '離開了')
        : customer.crafted ? '等候出餐' : isActive ? '前枱' : '排隊'
      return `
        <article class="cafe-customer${isActive ? ' is-active' : ''}${customer.leaving ? ' is-leaving' : ''}" data-customer-id="${escapeHtml(customer.id)}" role="listitem" aria-label="${escapeHtml(type.name)}訂了${escapeHtml(dish.zh)}">
          <div class="cafe-thought">
            <div class="cafe-thought-dish"><span aria-hidden="true">${dish.emoji}</span><strong>${escapeHtml(dish.zh)}</strong></div>
            <div class="cafe-thought-checklist">${checklist}</div>
          </div>
          <img class="cafe-customer-sprite" data-customer-type="${escapeHtml(customer.type)}" src="${escapeHtml(imageFor(customer))}" alt="${escapeHtml(type.name)}" draggable="false" />
          <div class="cafe-patience" aria-label="耐性 ${Math.round(patience)}%"><span class="cafe-patience-fill" style="width:${patience}%"></span></div>
          <span class="cafe-customer-label">${status}</span>
        </article>
      `
    }).join('')
    updateHud()
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

  function announce(message, kind = '') {
    const feedback = rootEl?.querySelector('[data-feedback]')
    if (!feedback) return
    feedback.className = `cafe-feedback${kind ? ` is-${kind}` : ''}`
    feedback.innerHTML = message
  }

  function missingIngredients(customer) {
    const recipe = recipeFor(customer)
    if (!recipe) return []
    return recipe.ingredients.filter((id) => !customer.slots.includes(id))
  }

  function chooseIngredient() {
    const activeDemand = Object.fromEntries(INGREDIENTS.map((ingredient) => [ingredient.id, 0]))
    const waitingDemand = Object.fromEntries(INGREDIENTS.map((ingredient) => [ingredient.id, 0]))
    queue.filter((customer) => !customer.leaving).forEach((customer, index) => {
      missingIngredients(customer).forEach((id) => {
        if (index === 0) activeDemand[id]++
        else waitingDemand[id]++
      })
    })

    const weighted = []
    INGREDIENTS.forEach((ingredient) => {
      const activeGap = Math.max(0, activeDemand[ingredient.id] - inventory[ingredient.id])
      const inventoryForWaiting = Math.max(0, inventory[ingredient.id] - activeDemand[ingredient.id])
      const waitingGap = Math.max(0, waitingDemand[ingredient.id] - inventoryForWaiting)
      const weight = activeGap * 4 + waitingGap
      for (let index = 0; index < weight; index++) weighted.push(ingredient)
    })
    const choices = weighted.length ? weighted : INGREDIENTS
    return choices[Math.floor(Math.random() * choices.length)]
  }

  function renderQuestion() {
    if (!rootEl || finished || destroyed) return
    const section = rootEl.querySelector('[data-question]')
    if (!section) return
    if (questionIndex >= rounds.length) {
      section.innerHTML = `
        <div class="cafe-question-done">
          <span class="cafe-question-done-icon" aria-hidden="true">📚</span>
          <div><strong>詞語答完啦！</strong><span>繼續完成手上的餐單，就可以出餐賺金幣。</span></div>
        </div>
        <div class="cafe-feedback" data-feedback aria-live="polite">食材已放入櫃檯，記得放進餐單。</div>
      `
      updateHud()
      return
    }

    const word = rounds[questionIndex]
    const options = shuffle([word, ...distractors(answerPool, word, 3)])
    const promptImage = word.image
      ? `<img class="cafe-prompt-img" src="${escapeHtml(imagePath(word.image))}" alt="${escapeHtml(word.zhHant)}" />`
      : '<span class="cafe-prompt-img cafe-prompt-emoji" aria-hidden="true">🧠</span>'
    section.innerHTML = `
      <div class="cafe-question-head">
        <div class="cafe-order-prompt">
          ${promptImage}
          <div class="cafe-prompt-copy">
            <span class="cafe-prompt-eyebrow">詞語獎勵 · 第 ${questionIndex + 1}/${rounds.length} 題</span>
            <strong>${escapeHtml(word.zhHant)}</strong>
            <span class="cafe-prompt-caption">答啱獲得一款食材</span>
          </div>
        </div>
        <button type="button" class="cafe-speak" data-speak aria-label="聽英文發音">🔊</button>
      </div>
      <div class="cafe-choices" data-choices></div>
      <div class="cafe-feedback" data-feedback aria-live="polite">揀出正確英文，字學貓就會準備食材！</div>
    `

    const choices = section.querySelector('[data-choices]')
    options.forEach((option) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'cafe-choice'
      button.dataset.choice = String(option.id)
      button.textContent = option.en
      button.disabled = answerLocked
      button.addEventListener('click', () => answer(option, button))
      choices.appendChild(button)
    })
    section.querySelector('[data-speak]').addEventListener('click', () => {
      if (finished || destroyed) return
      audio.tap()
      audio.speak(word.en)
    })
    updateHud()
  }

  function renderWorkbench() {
    if (!rootEl) return
    const workbench = rootEl.querySelector('[data-workbench]')
    if (!workbench) return
    const customer = activeCustomer()
    if (!customer) {
      workbench.innerHTML = `
        <div class="cafe-workbench-head"><div><strong>食材櫃檯</strong><span>等下一位客人到埗</span></div><span class="cafe-stock-total">${Object.values(inventory).reduce((sum, amount) => sum + amount, 0)} 件食材</span></div>
        <div class="cafe-inventory" aria-label="食材庫">${INGREDIENTS.map((ingredient) => `<span class="cafe-ingredient is-empty cafe-${ingredient.color}" aria-label="${escapeHtml(ingredient.zh)}，${inventory[ingredient.id]} 件"><span class="cafe-ingredient-emoji">${ingredient.emoji}</span><span class="cafe-ingredient-copy"><b>${escapeHtml(ingredient.zh)}</b><small>${escapeHtml(ingredient.en)}</small></span><i>${inventory[ingredient.id]}</i></span>`).join('')}</div>
        <div class="cafe-feedback cafe-workbench-note">有食材就會保留在櫃檯，下一位客人來了再用。</div>
      `
      updateHud()
      return
    }

    const dish = recipeFor(customer)
    const complete = isRecipeComplete(customer)
    const slots = dish.ingredients.map((id) => {
      const ingredient = INGREDIENT_BY_ID[id]
      const filled = customer.slots.includes(id)
      return `
        <button type="button" class="cafe-recipe-slot${filled ? ' is-filled' : ''}" data-slot="${escapeHtml(id)}" ${!filled || customer.crafted ? 'disabled' : ''} aria-label="${filled ? `取回${ingredient.zh}` : `需要${ingredient.zh}`}；${filled ? '已完成' : '待加入'}">
          <i>${filled ? '✓' : '○'}</i><span>${ingredient.emoji}</span><b>${escapeHtml(ingredient.zh)}</b>
        </button>
      `
    }).join('')
    const inventoryChips = INGREDIENTS.map((ingredient) => {
      const needed = missingIngredients(customer).includes(ingredient.id)
      const amount = inventory[ingredient.id]
      const disabled = amount <= 0 || !needed || customer.crafted
      return `
        <button type="button" class="cafe-ingredient cafe-${ingredient.color}${amount ? '' : ' is-empty'}${needed && amount ? ' is-needed' : ''}" data-ingredient="${escapeHtml(ingredient.id)}" ${disabled ? 'disabled' : ''} aria-label="${escapeHtml(ingredient.zh)}，${amount} 件${needed ? '，客人需要' : ''}">
          <span class="cafe-ingredient-emoji">${ingredient.emoji}</span>
          <span class="cafe-ingredient-copy"><b>${escapeHtml(ingredient.zh)}</b><small>${escapeHtml(ingredient.en)}</small></span>
          <i>${amount}</i>
        </button>
      `
    }).join('')
    const craftDisabled = !complete || customer.crafted
    const serveDisabled = !customer.crafted
    const craftLabel = customer.crafted ? '已製作 ✓' : '製作'
    const serveLabel = customer.crafted ? '出餐 +3 🪙' : '出餐'
    const stateText = customer.crafted
      ? '餐點做好了，按「出餐」收取金幣。'
      : complete ? '食材齊全，可以開始製作！' : '點擊食材，放入上方餐單。'

    workbench.innerHTML = `
      <div class="cafe-workbench-head">
        <div><strong>${dish.emoji} ${escapeHtml(dish.zh)}餐單</strong><span>${escapeHtml(ART.customers[customer.type].name)} · 訂單 ${customer.orderNo}/${customerLimit}</span></div>
        <span class="cafe-stock-total">櫃檯 ${Object.values(inventory).reduce((sum, amount) => sum + amount, 0)} 件</span>
      </div>
      <div class="cafe-recipe-slots" aria-label="${escapeHtml(dish.zh)}食譜">${slots}</div>
      <div class="cafe-inventory-label"><strong>食材庫</strong><span>點擊需要的食材加入餐單</span></div>
      <div class="cafe-inventory" aria-label="食材庫">${inventoryChips}</div>
      <div class="cafe-workbench-actions">
        <span class="cafe-workbench-note" data-workbench-note>${stateText}</span>
        <div><button type="button" class="cafe-craft" data-craft ${craftDisabled ? 'disabled' : ''}>${craftLabel}</button><button type="button" class="cafe-serve" data-serve ${serveDisabled ? 'disabled' : ''}>${serveLabel}</button></div>
      </div>
    `
    workbench.querySelectorAll('[data-ingredient]').forEach((button) => {
      button.addEventListener('click', () => addIngredient(customer, button.dataset.ingredient))
    })
    workbench.querySelectorAll('[data-slot]').forEach((button) => {
      button.addEventListener('click', () => removeIngredient(customer, button.dataset.slot))
    })
    workbench.querySelector('[data-craft]')?.addEventListener('click', () => craft(customer))
    workbench.querySelector('[data-serve]')?.addEventListener('click', () => serveCustomer(customer))
    updateHud()
  }

  function renderAll() {
    renderQueue()
    renderWorkbench()
    updateHud()
  }

  function addIngredient(customer, id) {
    if (destroyed || finished || activeCustomer()?.id !== customer.id || inventory[id] <= 0) return
    if (!missingIngredients(customer).includes(id) || customer.crafted) return
    audio.tap()
    inventory[id]--
    customer.slots.push(id)
    renderAll()
    if (isRecipeComplete(customer)) announce('食材齊全！按「製作」準備餐點。', 'good')
  }

  function removeIngredient(customer, id) {
    if (destroyed || finished || activeCustomer()?.id !== customer.id || customer.crafted) return
    const slotIndex = customer.slots.indexOf(id)
    if (slotIndex < 0) return
    audio.tap()
    customer.slots.splice(slotIndex, 1)
    inventory[id]++
    renderAll()
  }

  function sparkle() {
    const image = rootEl?.querySelector('[data-sparkle]')
    if (!image) return
    image.classList.remove('is-pop')
    void image.offsetWidth
    image.classList.add('is-pop')
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
    }, 1100)
    sparkle()
  }

  function craft(customer) {
    if (destroyed || finished || activeCustomer()?.id !== customer.id || customer.crafted || !isRecipeComplete(customer)) return
    audio.tap()
    customer.crafted = true
    animateChef()
    renderAll()
    announce(`${escapeHtml(recipeFor(customer).en)}做好了！請按「出餐」交給客人。`, 'good')
  }

  function serveCustomer(customer) {
    if (destroyed || finished || activeCustomer()?.id !== customer.id || !customer.crafted) return
    audio.tap()
    served++
    coins += 3
    customer.leaving = true
    customer.wasServed = true
    const card = rootEl?.querySelector(`[data-customer-id="${customer.id}"]`)
    card?.classList.add('is-leaving')
    const label = card?.querySelector('.cafe-customer-label')
    if (label) label.textContent = '開心出餐'
    updateHud()
    renderWorkbench()
    announce(`<img src="${ART.sparkle}" alt="" /> ${escapeHtml(recipeFor(customer).zh)}出餐成功！ +3 金幣`, 'good')
    animateChef()
    scheduleDeparture()
  }

  function markMissed(word) {
    if (word?.id != null) missedIds.add(word.id)
  }

  function answer(option, chosenButton) {
    if (finished || destroyed || answerLocked || questionIndex >= rounds.length) return
    const word = rounds[questionIndex]
    const isCorrect = String(option.id) === String(word.id)
    const section = rootEl?.querySelector('[data-question]')
    const buttons = [...(section?.querySelectorAll('.cafe-choice') || [])]
    const right = buttons.find((button) => button.dataset.choice === String(word.id))
    answerLocked = true
    buttons.forEach((button) => { button.disabled = true })
    questionIndex++

    if (isCorrect) {
      vocabCorrect++
      if (!correctIds.some((id) => String(id) === String(word.id))) correctIds.push(word.id)
      chosenButton.classList.add('is-correct')
      audio.speakOnCorrect(word.en)
      const ingredient = chooseIngredient()
      inventory[ingredient.id]++
      onCorrect?.(word)
      announce(`<img src="${ART.sparkle}" alt="" /> 答啱！獲得 ${ingredient.emoji} ${escapeHtml(ingredient.zh)}。`, 'good')
      renderAll()
    } else {
      if (chosenButton) chosenButton.classList.add('is-wrong')
      if (right) right.classList.add('is-correct')
      audio.wrong()
      markMissed(word)
      const customer = activeCustomer()
      if (customer) customer.patience = Math.max(0, customer.patience - WRONG_PATIENCE_LOSS)
      updatePatienceBars()
      announce(`差少少！沒有食材獎勵，英文是 ${escapeHtml(word.en)}。`, 'missed')
    }

    updateHud()
    clearTracked(questionAdvanceTimer)
    questionAdvanceTimer = schedule(() => {
      questionAdvanceTimer = null
      answerLocked = false
      renderQuestion()
      renderWorkbench()
      if (questionIndex >= rounds.length) finishIfDone()
    }, isCorrect ? 720 : 950)
  }

  function createCustomer() {
    if (nextOrderIndex >= customerLimit) return null
    const typeChoices = Object.keys(ART.customers).filter((type) => type !== lastCustomerType)
    const type = typeChoices[Math.floor(Math.random() * typeChoices.length)] || 'rabbit'
    lastCustomerType = type
    const dish = DISHES[Math.floor(Math.random() * DISHES.length)]
    const customer = {
      id: nextCustomerId++,
      type,
      dishId: dish.id,
      orderNo: nextOrderIndex + 1,
      slots: [],
      patience: 100,
      leaving: false,
      wasServed: false,
      crafted: false,
    }
    nextOrderIndex++
    return customer
  }

  function scheduleArrival(delay) {
    if (arrivalTimer || destroyed || finished || queue.length >= MAX_QUEUE || nextOrderIndex >= customerLimit) return
    arrivalTimer = schedule(() => {
      arrivalTimer = null
      if (destroyed || finished || queue.length >= MAX_QUEUE || nextOrderIndex >= customerLimit) return
      const customer = createCustomer()
      if (customer) queue.push(customer)
      renderAll()
      scheduleArrival(1800)
    }, delay)
  }

  function ensureArrival(delay = 450) {
    if (queue.length < MAX_QUEUE && nextOrderIndex < customerLimit) scheduleArrival(delay)
  }

  function releaseCustomerIngredients(customer) {
    customer.slots.forEach((id) => { inventory[id]++ })
    customer.slots = []
  }

  function removeDepartures() {
    departureTimer = null
    if (destroyed || finished) return
    queue = queue.filter((customer) => !customer.leaving)
    renderAll()
    ensureArrival()
    finishIfDone()
  }

  function scheduleDeparture() {
    if (departureTimer || destroyed || finished) return
    departureTimer = schedule(removeDepartures, 520)
  }

  function patienceTick() {
    if (destroyed || finished) return
    const expired = []
    queue.forEach((customer, index) => {
      if (customer.leaving) return
      const waitFactor = index === 0 ? 1 : 0.32
      customer.patience = Math.max(0, customer.patience - (PATIENCE_TICK_MS / PATIENCE_MS) * 100 * waitFactor)
      if (customer.patience <= 0) expired.push(customer)
    })
    expired.forEach((customer) => {
      customer.leaving = true
      customer.wasServed = false
      left++
      releaseCustomerIngredients(customer)
      const card = rootEl?.querySelector(`[data-customer-id="${customer.id}"]`)
      card?.classList.add('is-leaving')
      const label = card?.querySelector('.cafe-customer-label')
      if (label) label.textContent = '離開了'
    })
    if (expired.length) {
      if (expired.some((customer) => customer.id === queue[0]?.id)) {
        renderWorkbench()
        announce('客人等得太久，先離開了。', 'missed')
      }
      updateHud()
      scheduleDeparture()
    } else {
      updatePatienceBars()
    }
  }

  function finishIfDone() {
    if (finished || destroyed) return
    const questionsDone = questionIndex >= rounds.length && !answerLocked
    const customersDone = queue.length === 0 && nextOrderIndex >= customerLimit
    if (!questionsDone || !customersDone) return
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
            <div><strong>收工啦！</strong><span>字學貓完成了 ${served} 張餐單</span></div>
            <b>+${coins} 金幣</b>
          </div>
        `
      }
      const workbench = rootEl.querySelector('[data-workbench]')
      if (workbench) workbench.innerHTML = `<div class="cafe-finish-note">今日已完成 · 答啱 ${vocabCorrect}/${rounds.length} 題 · 出餐 ${served} 份</div>`
    }
    onDone?.({
      correct: vocabCorrect,
      served,
      total: rounds.length,
      coins,
      missed: [...missedIds],
      correctIds,
      meta: { served, left, orders: customerLimit, vocabCorrect },
    })
  }

  function mount(root) {
    if (destroyed) return
    rootEl = root
    rootEl.innerHTML = `
      <div class="cafe-game">
        <header class="cafe-topline">
          <div class="cafe-title"><span class="cafe-title-icon" aria-hidden="true">☕</span><div><strong>小食店</strong><small>字學貓廚房</small></div></div>
          <div class="cafe-stats">
            <span class="cafe-stat cafe-progress"><b data-served>0/${customerLimit}</b><small>已出餐</small></span>
            <span class="cafe-stat cafe-coin"><img src="${ART.coin}" alt="" /><b data-coins>0</b><small>金幣</small></span>
          </div>
        </header>

        <section class="cafe-counter" aria-label="字學貓小食店櫃檯">
          <div class="cafe-wall-window" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
          <div class="cafe-shelf" aria-hidden="true"><i>✿</i><i>🍃</i><i>✿</i></div>
          <div class="cafe-queue-label">等候客人 <b data-queue-count>0/${MAX_QUEUE}</b></div>
          <div class="cafe-queue" data-queue role="list" aria-label="顧客隊伍"></div>
          <img class="cafe-sparkle" data-sparkle src="${ART.sparkle}" alt="" />
          <img class="cafe-chef" data-chef src="${ART.chefIdle}" alt="字學貓廚師" draggable="false" />
          <div class="cafe-counter-front" aria-hidden="true"><span>小食店 · 新鮮出爐</span><i>✿</i></div>
        </section>

        <section class="cafe-question" data-question aria-label="英文詞語問題"></section>
        <section class="cafe-workbench" data-workbench aria-label="食材和餐單"></section>
      </div>
    `

    renderQueue()
    renderQuestion()
    renderWorkbench()
    if (!rounds.length) {
      questionIndex = 0
      finishIfDone()
      return
    }

    const firstCustomer = createCustomer()
    if (firstCustomer) queue.push(firstCustomer)
    renderAll()
    scheduleArrival(2200)
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
