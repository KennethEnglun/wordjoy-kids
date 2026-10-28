import { test, expect } from '@playwright/test'

test('home shell and start journey to pic match', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '英樂寶' })).toBeVisible()
  await expect(page.getByRole('button', { name: /開始英文之旅/ })).toBeVisible()
  await expect(page.getByRole('button', { name: '首頁' })).toBeVisible()
  await page.getByRole('button', { name: /開始英文之旅/ }).click()
  await expect(page.getByRole('heading', { name: /冒險地圖/ })).toBeVisible()
  await page.getByRole('button', { name: /對對碰之路|Pic Match/i }).click()
  await expect(page.getByText(/揀主題/)).toBeVisible()
  await page.getByRole('button', { name: /我同家人|Family/i }).first().click()
  const card = page.getByRole('button', { name: '記憶卡，未翻開' }).first()
  await expect(card).toBeVisible({ timeout: 10000 })
  await card.click()
  await expect(page.locator('#app')).toContainText(/題|星|金幣|好叻|再睇|WordJoy|英樂寶|⭐/)
})

test('bottom tabs navigate', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '冒險', exact: true }).click()
  await expect(page.getByRole('heading', { name: /冒險地圖/ })).toBeVisible()
  await page.getByRole('button', { name: '任務', exact: true }).click()
  await expect(page.getByRole('heading', { name: /今日任務/ })).toBeVisible()
  await page.getByRole('button', { name: '商店', exact: true }).click()
  await expect(page.getByRole('heading', { name: /星星小店/ })).toBeVisible()
  await page.getByRole('button', { name: '角色', exact: true }).click()
  await expect(page.getByRole('heading', { name: /我的字學貓/ })).toBeVisible()
  await page.getByRole('button', { name: '首頁', exact: true }).click()
  await expect(page.getByRole('heading', { name: '英樂寶' })).toBeVisible()
})

test('band theme hint via vault', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /詞彙寶庫/ }).click()
  await expect(page.getByText(/貼近香港小學/)).toBeVisible()
})

test('profile switch screen', async ({ page }) => {
  await page.goto('/#/character')
  await page.getByRole('button', { name: /切換小朋友/ }).click()
  await expect(page.getByRole('heading', { name: /揀小朋友/ })).toBeVisible()
})

test('review bag from tasks', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'wordjoy-progress',
      JSON.stringify({
        activeProfileId: 'kid1',
        parentPin: null,
        dailyGoalStars: 15,
        sessionCapMinutes: 0,
        weeklyThemes: [],
        profiles: {
          kid1: {
            id: 'kid1',
            name: '測試仔',
            avatar: '🐱',
            band: 'junior',
            coins: 5,
            stars: 2,
            best: {},
            reviewBag: ['mom', 'junior-me_family-dad', 'junior-animals_pets-cat'],
            sessions: [],
            streak: { count: 2, lastDate: new Date().toISOString().slice(0, 10) },
            todayKey: new Date().toISOString().slice(0, 10),
            todayStars: 3,
          },
        },
      }),
    )
  })
  await page.goto('/#/tasks')
  await page.getByRole('button', { name: /複習袋/ }).click()
  await expect(page.getByRole('button', { name: '記憶卡，未翻開' }).first()).toBeVisible({
    timeout: 10000,
  })
})

test('word race from adventure', async ({ page }) => {
  await page.goto('/#/adventure/junior')
  await page.getByRole('button', { name: /詞語賽道|Word Race/i }).click()
  await page.getByRole('button', { name: /動物|Animals/i }).first().click()
  await expect(page.locator('button.race-choice').first()).toBeVisible({ timeout: 10000 })
})

test('cafe order still works', async ({ page }) => {
  await page.goto('/#/play/junior/food_drink/cafe_order')
  await expect(page.locator('.cafe-game, .cafe-question').first()).toBeVisible({ timeout: 10000 })
  await expect(page.locator('button.cafe-choice').first()).toBeVisible()
})

test('parent school themes', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /進入家長端/ }).click()
  await expect(page.getByText('本週學校主題')).toBeVisible()
})
