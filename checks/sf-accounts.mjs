import { chromium } from 'playwright'
import fs from 'fs'
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222')
const page = browser.contexts().flatMap((c) => c.pages()).find((p) => p.url().includes('sendflow.pro/whats'))
if (!page) process.exit(1)
await page.goto('https://sendflow.pro/whats/accounts', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(1200)
const cdp = await page.context().newCDPSession(page)
const shot = await Promise.race([
  cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true }),
  new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 15000)),
])
fs.writeFileSync('C:/Users/ccpru/sendflow-rebuild/checks/live/accounts.png', Buffer.from(shot.data, 'base64'))
const text = await page.evaluate(() => (document.body.innerText || '').replace(/\n{2,}/g, '\n').slice(0, 2200))
fs.writeFileSync('C:/Users/ccpru/sendflow-rebuild/checks/live/accounts.txt', text)
console.log(text.slice(0, 1500))
await page.goto('https://sendflow.pro/whats/overview', { waitUntil: 'domcontentloaded' })
await browser.close()
