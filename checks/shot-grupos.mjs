import { chromium } from 'playwright'
import path from 'path'
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1920, height: 991 }, deviceScaleFactor: 1 })
await page.goto('http://127.0.0.1:5173/whats/overview', { waitUntil: 'networkidle' })
await page.waitForTimeout(400)
const file = 'C:/Users/ccpru/sendflow-rebuild/checks/live/grupos-overview.png'
await page.screenshot({ path: file })
console.log('saved', file)
await browser.close()
