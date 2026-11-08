import { chromium } from 'playwright'
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222')
const page = browser.contexts().flatMap((c) => c.pages()).find((p) => p.url().includes('sendflow.pro/whats/overview'))
const data = await page.evaluate(() => {
  const rows = []
  const all = [...document.querySelectorAll('body *')]
  for (const el of all) {
    const r = el.getBoundingClientRect()
    if (r.top > 70 || r.bottom < 0 || r.width < 8 || r.height < 8) continue
    if (r.top > 8 && r.height > 70) continue
    const s = getComputedStyle(el)
    if (s.visibility === 'hidden' || s.display === 'none') continue
    const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).filter(Boolean).join(' ')
    if (el.children.length > 3 && !own) continue
    rows.push({
      t: el.tagName.toLowerCase(),
      own: own.slice(0, 40),
      cls: String(el.className || '').replace(/\s+/g, ' ').slice(0, 80),
      box: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
      color: s.color,
      fs: s.fontSize,
      fw: s.fontWeight,
      bg: s.backgroundColor,
      br: s.borderRadius,
      bw: s.borderTopWidth + ' ' + s.borderTopColor,
    })
  }
  const bgAt = (x, y) => {
    const el = document.elementFromPoint(x, y)
    let n = el
    const chain = []
    while (n && chain.length < 5) {
      const s = getComputedStyle(n)
      chain.push(n.tagName + ' ' + s.backgroundColor + ' ' + String(n.className || '').slice(0, 40))
      if (s.backgroundColor !== 'rgba(0, 0, 0, 0)') break
      n = n.parentElement
    }
    return chain
  }
  return {
    rows: rows.slice(0, 40),
    bg500: bgAt(700, 180),
    bgCard: bgAt(500, 450),
    rail: bgAt(30, 200),
  }
})
console.log(JSON.stringify(data, null, 2).slice(0, 6000))
await browser.close()
