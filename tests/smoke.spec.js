import { test, expect } from '@playwright/test'

test('home to pic match play', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '英樂寶' })).toBeVisible()
  await expect(page.locator('img.momo-mascot, img.joy-mascot').first()).toBeVisible()
  await page.getByRole('button', { name: /學前/ }).click()
  await expect(page.getByText(/揀主題/)).toBeVisible()
  await page.getByRole('button', { name: /我同家人|Family/i }).first().click()
  await expect(page.getByText(/揀遊戲/)).toBeVisible()
  await page.getByRole('button', { name: /對對碰|Pic Match/i }).click()
  const choice = page.locator('button.choice').first()
  await expect(choice).toBeVisible({ timeout: 10000 })
  await choice.click()
  await expect(page.locator('#app')).toContainText(/題|星|金幣|再玩|正確|好叻|再睇|英樂寶|WordJoy|⭐/)
})

test('band buttons and theme hint visible', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: /小一/ })).toBeVisible()
  await page.getByRole('button', { name: /小一/ }).click()
  await expect(page.getByText(/貼近香港小學/)).toBeVisible()
})

test('profile switch screen', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /切換小朋友/ }).click()
  await expect(page.getByRole('heading', { name: /揀小朋友/ })).toBeVisible()
  await expect(page.getByText(/新增小朋友|已達/)).toBeVisible()
})

test('review bag play from seeded storage', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'wordjoy-progress',
      JSON.stringify({
        activeProfileId: 'kid1',
        parentPin: null,
        dailyGoalStars: 15,
        sessionCapMinutes: 0,
        profiles: {
          kid1: {
            id: 'kid1',
            name: '測試仔',
            avatar: '🐱',
            band: 'prek',
            coins: 5,
            stars: 2,
            best: {},
            reviewBag: ['mom', 'dad', 'cat'],
            sessions: [],
            streak: { count: 2, lastDate: new Date().toISOString().slice(0, 10) },
            todayKey: new Date().toISOString().slice(0, 10),
            todayStars: 3,
          },
        },
      }),
    )
  })
  await page.goto('/')
  await expect(page.getByText(/今日目標/)).toBeVisible()
  await page.getByRole('button', { name: /複習袋/ }).click()
  const choice = page.locator('button.choice').first()
  await expect(choice).toBeVisible({ timeout: 10000 })
})

test('word race game starts', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /學前/ }).click()
  await page.getByRole('button', { name: /動物|Animals/i }).first().click()
  await page.getByRole('button', { name: /詞語賽跑|Word Race/i }).click()
  await expect(page.locator('button.choice').first()).toBeVisible({ timeout: 10000 })
  await expect(page.locator('#app')).toContainText(/賽跑|向前|題/)
})

test('parent weekly digest behind optional PIN', async ({ page }) => {
  await page.addInitScript(() => {
    const day = new Date().toISOString().slice(0, 10)
    localStorage.setItem(
      'wordjoy-progress',
      JSON.stringify({
        activeProfileId: 'kid1',
        parentPin: null,
        dailyGoalStars: 15,
        sessionCapMinutes: 20,
        profiles: {
          kid1: {
            id: 'kid1',
            name: '樂樂',
            avatar: '🐱',
            band: 'p1',
            coins: 10,
            stars: 8,
            best: {},
            reviewBag: [],
            sessions: [
              { at: Date.now(), band: 'p1', theme: 'animals', game: 'word_race', correct: 7, total: 8, stars: 2, coins: 8, missed: [] },
              { at: Date.now() - 86400000, band: 'p1', theme: 'food', game: 'fish_words', correct: 5, total: 8, stars: 1, coins: 5, missed: ['milk'] },
            ],
            streak: { count: 4, lastDate: day },
            todayKey: day,
            todayStars: 4,
          },
        },
      }),
    )
  })
  await page.goto('/')
  await page.getByRole('button', { name: /^家長$/ }).click()
  await expect(page.getByText(/本週摘要/)).toBeVisible()
  await expect(page.getByText(/每日目標同時間上限/)).toBeVisible()
  await expect(page.getByLabel(/每日星星目標|goal/i).or(page.locator('#goal-stars'))).toBeVisible()
})
