import { test, expect } from '@playwright/test'

test('home to pic match play', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '英樂寶' })).toBeVisible()
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
          },
        },
      }),
    )
  })
  await page.goto('/')
  await expect(page.getByRole('button', { name: /複習袋/ })).toBeVisible()
  await page.getByRole('button', { name: /複習袋/ }).click()
  const choice = page.locator('button.choice').first()
  await expect(choice).toBeVisible({ timeout: 10000 })
  await expect(page.locator('#app')).toContainText(/題|揀啱|mom|dad|cat|聽英文/i)
})
