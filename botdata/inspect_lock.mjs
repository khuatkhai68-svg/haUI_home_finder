import { chromium } from './playwright-mcp/node_modules/playwright/index.mjs';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  locale: 'vi-VN'
});

await page.goto('https://www.facebook.com/groups/1896518147417522/?locale=vi_VN', { waitUntil: 'domcontentloaded', timeout: 25000 });
await page.waitForTimeout(3000);

const lockInfo = await page.evaluate(() => {
  const htmlStyle = window.getComputedStyle(document.documentElement);
  const bodyStyle = window.getComputedStyle(document.body);
  
  const fixedElements = Array.from(document.querySelectorAll('*')).filter(el => {
    const s = window.getComputedStyle(el);
    return s.position === 'fixed' || s.overflow === 'hidden';
  }).map(el => ({
    tag: el.tagName,
    className: el.className,
    role: el.getAttribute('role'),
    ariaLabel: el.getAttribute('aria-label'),
    style: el.getAttribute('style')
  })).slice(0, 10);

  return {
    htmlOverflow: htmlStyle.overflow,
    htmlPosition: htmlStyle.position,
    bodyOverflow: bodyStyle.overflow,
    bodyPosition: bodyStyle.position,
    fixedCount: fixedElements.length,
    samples: fixedElements
  };
});

console.log('Lock Info:', JSON.stringify(lockInfo, null, 2));
await browser.close();
