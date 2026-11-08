import { chromium } from 'playwright'
import fs from 'fs'
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222')
const page = browser.contexts().flatMap((c) => c.pages()).find((p) => p.url().includes('sendflow.pro/whats'))
await page.goto('https://sendflow.pro/whats/campaigns', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(1400)
const cdp = await page.context().newCDPSession(page)
const shot = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true })
fs.writeFileSync('C:/Users/ccpru/sendflow-rebuild/checks/live/campaigns.png', Buffer.from(shot.data, 'base64'))
const text = await page.evaluate(() => (document.body.innerText || '').replace(/\n{2,}/g, '\n').slice(0, 1800))
fs.writeFileSync('C:/Users/ccpru/sendflow-rebuild/checks/live/campaigns.txt', text)
console.log(text.slice(0, 1200))
await page.goto('https://sendflow.pro/whats/overview', { waitUntil: 'domcontentloaded' })
await browser.close()
