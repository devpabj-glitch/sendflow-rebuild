import { chromium } from 'playwright'
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1920, height: 991 }, deviceScaleFactor: 1 })
await page.goto('http://127.0.0.1:5173/whats/accounts', { waitUntil: 'networkidle' })
await page.evaluate(() => {
  const raw = localStorage.getItem('orbit-data-v1')
  if (!raw) return
  const data = JSON.parse(raw)
  data.accounts = []
  localStorage.setItem('orbit-data-v1', JSON.stringify(data))
})
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(300)
await page.screenshot({ path: 'C:/Users/ccpru/sendflow-rebuild/checks/live/grupos-accounts.png' })
console.log('accounts shot')
await browser.close()
