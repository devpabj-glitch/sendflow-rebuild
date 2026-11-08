import { chromium } from 'playwright'
import fs from 'fs'
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222')
const page = browser.contexts().flatMap((c) => c.pages()).find((p) => p.url().includes('sendflow.pro/whats'))
const data = await page.evaluate(() => {
  const cs = (el) => {
    const s = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    return {
      box: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
      bg: s.backgroundColor, color: s.color, fs: s.fontSize, fw: s.fontWeight, br: s.borderRadius,
      pad: s.padding, border: s.borderTopWidth + ' ' + s.borderTopColor, gap: s.gap, display: s.display,
    }
  }
  const q = (sel) => document.querySelector(sel)
  const navItems = [...document.querySelectorAll('.fuse-list-item')].map((el) => {
    const r = el.getBoundingClientRect()
    const label = el.querySelector('.fuse-list-item-text, .MuiListItemText-root')
    return {
      text: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 60),
      box: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
      color: getComputedStyle(el).color,
      labelW: label ? Math.round(label.getBoundingClientRect().width) : 0,
    }
  })
  const buttons = [...document.querySelectorAll('button')].filter((b) => {
    const r = b.getBoundingClientRect()
    return r.width > 40 && r.height > 20 && r.x > 200 && r.y < 700
  }).slice(0, 12).map((b) => ({
    text: (b.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 40),
    ...cs(b),
  }))
  const papers = [...document.querySelectorAll('.MuiPaper-root')].map((el) => {
    const r = el.getBoundingClientRect()
    if (r.width < 80 || r.x < 0 || r.y > 1200) return null
    return { text: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 70), ...cs(el) }
  }).filter(Boolean).slice(0, 15)
  const root = q('#root') || document.body
  const appBg = getComputedStyle(document.body).backgroundColor
  const content = document.querySelector('.FusePageSimple-content, main, [class*="FusePage"]')
  return {
    iw: innerWidth, ih: innerHeight,
    appBg,
    htmlBg: getComputedStyle(document.documentElement).backgroundColor,
    navCount: navItems.length,
    navItems,
    buttons,
    papers,
    content: content ? { cls: String(content.className).slice(0, 140), ...cs(content) } : null,
  }
})
fs.writeFileSync('C:/Users/ccpru/sendflow-rebuild/checks/live/measure.json', JSON.stringify(data, null, 2))
console.log('iw', data.iw, 'nav', data.navCount)
console.log(data.navItems.map((n) => n.text + ' ' + n.box.join(',')).join('\n'))
console.log('PAPERS')
console.log(data.papers.map((p) => p.text + ' | ' + p.box.join(',') + ' bg ' + p.bg + ' br ' + p.br).join('\n'))
console.log('BUTTONS')
console.log(data.buttons.map((b) => b.text + ' | ' + b.box.join(',') + ' bg ' + b.bg + ' br ' + b.br + ' c ' + b.color).join('\n'))
await browser.close()
