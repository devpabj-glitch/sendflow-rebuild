import { chromium } from 'playwright'
import fs from 'fs'
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222')
const page = browser.contexts().flatMap((c) => c.pages()).find((p) => p.url().includes('sendflow.pro/whats/overview'))
const data = await page.evaluate(() => {
  const desc = (el) => {
    const s = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    return {
      tag: el.tagName.toLowerCase(),
      cls: String(el.className || '').replace(/\s+/g, ' ').slice(0, 140),
      box: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
      bg: s.backgroundColor,
      color: s.color,
      fs: s.fontSize,
      fw: s.fontWeight,
      br: s.borderRadius,
      pad: s.padding,
      bw: s.borderTopWidth,
      bc: s.borderTopColor,
      shadow: s.boxShadow === 'none' ? '' : s.boxShadow.slice(0, 100),
    }
  }
  const find = (txt) => [...document.querySelectorAll('body *')].find((el) => {
    const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('')
    return own.includes(txt)
  })
  const keys = ['Mapa Contas', 'Todas as associações', 'Ver dashboard', 'Nenhum registro', 'Contas', 'Campanhas', 'Webhooks', 'CONFIGURAÇÕES', 'Visão geral', 'Buscar']
  const hits = {}
  for (const k of keys) {
    const el = find(k)
    if (!el) { hits[k] = null; continue }
    const chain = []
    let n = el
    for (let i = 0; i < 6 && n; i++) {
      const r = n.getBoundingClientRect()
      if (r.width > 40 && r.height > 16) chain.push(desc(n))
      n = n.parentElement
    }
    hits[k] = chain
  }
  const toolbar = document.querySelector('[class*="toolbar"], header, .MuiToolbar-root')
  const logos = [...document.querySelectorAll('img, svg')].slice(0, 8).map((el) => {
    const r = el.getBoundingClientRect()
    return { tag: el.tagName, alt: el.getAttribute('alt') || '', src: (el.getAttribute('src') || '').slice(0, 80), box: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] }
  })
  return { hits, toolbar: toolbar ? desc(toolbar) : null, logos, bg: getComputedStyle(document.body).backgroundColor }
})
fs.writeFileSync('C:/Users/ccpru/sendflow-rebuild/checks/live/cards.json', JSON.stringify(data, null, 2))
for (const [k, chain] of Object.entries(data.hits)) {
  console.log('\n==', k)
  if (!chain) { console.log('missing'); continue }
  for (const c of chain.slice(0, 4)) console.log(c.tag, c.box.join('x'), c.bg, 'br', c.br, 'fs', c.fs, 'fw', c.fw, 'pad', c.pad, c.cls.slice(0, 70))
}
await browser.close()
