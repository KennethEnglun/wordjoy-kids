import { chromium } from 'playwright'
import { mkdir } from 'fs/promises'

await mkdir('screenshots', { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
await page.goto('http://127.0.0.1:4173/#/play/prek/school/pic_match')
await page.waitForTimeout(800)
await page.locator('img.prompt-img, button.choice img').first().waitFor({ timeout: 10000 })
await page.screenshot({ path: 'screenshots/shot_wj_r5g_school_play.png' })
const srcs = await page.locator('img[src*="art/words/"]').evaluateAll((els) =>
  [...new Set(els.map((e) => e.getAttribute('src')))],
)
console.log('word_imgs', srcs)
console.log('all_webp', srcs.every((s) => s.endsWith('.webp')))
await browser.close()
console.log('shots ok')
