import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const out = 'C:/Users/ccpru/sendflow-rebuild/checks/live'
fs.mkdirSync(out, { recursive: true })
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222')
const page = browser.contexts().flatMap((c) => c.pages()).find((p) => p.url().includes('sendflow.pro/whats/overview'))
if (!page) {
  console.log('no page')
  process.exit(1)
}
page.setDefaultTimeout(12000)

const spec = await page.evaluate(() => {
  const vis = (el) => {
    const cs = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 20 && r.height > 12
  }
  const info = (el) => {
    const cs = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).filter(Boolean).join(' ')
    return {
      t: el.tagName.toLowerCase(),
      c: typeof el.className === 'string' ? el.className.replace(/\s+/g, ' ').slice(0, 160) : '',
      own: own.slice(0, 90),
      box: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
      bg: cs.backgroundColor,
      color: cs.color,
      fs: cs.fontSize,
      fw: cs.fontWeight,
      ff: cs.fontFamily.split(',')[0].replace(/"/g, ''),
      pad: cs.padding,
      br: cs.borderRadius,
      bw: cs.borderTopWidth,
      bc: cs.borderTopColor,
      sh: cs.boxShadow === 'none' ? '' : 'y',
      d: cs.display,
      g: cs.gap,
    }
  }
  const roots = []
  const consider = [...document.querySelectorAll('body *')].filter(vis)
  // keep elements that are structural: large or direct containers
  const kept = consider.filter((el) => {
    const r = el.getBoundingClientRect()
    const kids = [...el.children].filter(vis).length
    return (r.width > 180 && r.height > 36) || kids >= 2
  }).slice(0, 220)
  for (const el of kept) roots.push(info(el))
  return {
    n: kept.length,
    bodyBg: getComputedStyle(document.body).backgroundColor,
    bodyFont: getComputedStyle(document.body).fontFamily,
    bodyFs: getComputedStyle(document.body).fontSize,
    nodes: roots,
  }
})
fs.writeFileSync(path.join(out, 'overview-spec.json'), JSON.stringify(spec, null, 2))
console.log('nodes', spec.n, 'bg', spec.bodyBg, 'font', spec.bodyFont)
await browser.close()
console.log('done')
