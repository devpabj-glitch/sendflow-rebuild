import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const out = 'C:/Users/ccpru/sendflow-rebuild/checks/live'
fs.mkdirSync(out, { recursive: true })

const browser = await chromium.connectOverCDP('http://127.0.0.1:9222')
const pages = browser.contexts().flatMap((c) => c.pages())
const page = pages.find((p) => p.url().includes('/whats/overview') && p.url().includes('sendflow.pro'))
if (!page) {
  console.log('PAGES', pages.map((p) => p.url()).join('\n'))
  process.exit(1)
}
const vp = page.viewportSize()
const dims = await page.evaluate(() => ({
  iw: window.innerWidth,
  ih: window.innerHeight,
  dpr: window.devicePixelRatio,
  url: location.href,
}))
console.log('DIMS', JSON.stringify({ vp, dims }))

const cdp = await page.context().newCDPSession(page)
const shot = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true })
fs.writeFileSync(path.join(out, 'overview.png'), Buffer.from(shot.data, 'base64'))
console.log('shot bytes', Buffer.from(shot.data, 'base64').length)

const spec = await page.evaluate(() => {
  const pick = (el) => {
    if (!el) return null
    const cs = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    const text = (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 140)
    return {
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      cls: typeof el.className === 'string' ? el.className.slice(0, 220) : '',
      text,
      box: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
      bg: cs.backgroundColor,
      color: cs.color,
      font: cs.fontFamily,
      fs: cs.fontSize,
      fw: cs.fontWeight,
      lh: cs.lineHeight,
      pad: cs.padding,
      margin: cs.margin,
      br: cs.borderRadius,
      border: `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`,
      shadow: cs.boxShadow === 'none' ? '' : cs.boxShadow.slice(0, 140),
      display: cs.display,
      gap: cs.gap,
    }
  }
  const walk = (el, depth, acc) => {
    if (!el || depth > 5 || acc.length > 180) return
    const r = el.getBoundingClientRect()
    if (r.width < 8 || r.height < 8) return
    const cs = getComputedStyle(el)
    if (cs.display === 'none' || cs.visibility === 'hidden') return
    if (depth >= 1) acc.push({ depth, ...pick(el) })
    const kids = [...el.children]
    for (const k of kids) walk(k, depth + 1, acc)
  }
  const acc = []
  walk(document.body, 0, acc)
  const fonts = [...document.fonts].slice(0, 12).map((f) => f.family + ' ' + f.weight)
  return {
    title: document.title,
    body: pick(document.body),
    fonts,
    nodes: acc,
  }
})
fs.writeFileSync(path.join(out, 'overview-spec.json'), JSON.stringify(spec, null, 2))
console.log('nodes', spec.nodes.length)
console.log('body', JSON.stringify(spec.body))
await browser.close()
