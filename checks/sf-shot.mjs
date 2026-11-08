import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const out = 'C:/Users/ccpru/sendflow-rebuild/checks/live'
fs.mkdirSync(out, { recursive: true })
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222')
const page = browser.contexts().flatMap((c) => c.pages()).find((p) => p.url().includes('sendflow.pro/whats/overview'))
if (!page) process.exit(1)
const cdp = await page.context().newCDPSession(page)
const { windowId } = await cdp.send('Browser.getWindowForTarget')
await cdp.send('Browser.setWindowBounds', {
  windowId,
  bounds: { windowState: 'normal', left: 40, top: 40, width: 1440, height: 900 },
})
await page.waitForTimeout(800)
const shot = await Promise.race([
  cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true }),
  new Promise((_, rej) => setTimeout(() => rej(new Error('shot-timeout')), 12000)),
])
const buf = Buffer.from(shot.data, 'base64')
fs.writeFileSync(path.join(out, 'overview.png'), buf)
console.log('shot', buf.length)

const text = await page.evaluate(() => {
  const main = document.querySelector('main') || document.querySelector('[class*="FusePageSimple-content"]') || document.body
  const nav = document.querySelector('ul.navigation')
  const header = document.querySelector('header') || document.querySelector('[class*="toolbar"]')
  const cards = [...document.querySelectorAll('[class*="MuiPaper"], [class*="MuiCard"]')].slice(0, 30).map((el) => {
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    return {
      c: String(el.className).slice(0, 120),
      t: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 180),
      box: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
      bg: cs.backgroundColor,
      br: cs.borderRadius,
      pad: cs.padding,
    }
  })
  return {
    nav: nav ? nav.innerText.replace(/\s+/g, ' | ').slice(0, 1800) : '',
    header: header ? header.innerText.replace(/\s+/g, ' ').slice(0, 400) : '',
    main: (main.innerText || '').replace(/\n{2,}/g, '\n').slice(0, 2500),
    cards,
  }
})
fs.writeFileSync(path.join(out, 'overview-text.json'), JSON.stringify(text, null, 2))
console.log('NAV', text.nav.slice(0, 500))
console.log('MAIN', text.main.slice(0, 800))
await browser.close()
