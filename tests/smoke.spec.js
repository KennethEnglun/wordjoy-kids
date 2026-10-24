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
