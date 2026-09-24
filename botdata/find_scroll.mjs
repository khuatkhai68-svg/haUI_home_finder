import { chromium } from './playwright-mcp/node_modules/playwright/index.mjs';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  locale: 'vi-VN'
});

await page.goto('https://www.facebook.com/groups/1896518147417522/?locale=vi_VN', { waitUntil: 'domcontentloaded', timeout: 25000 });
await page.waitForTimeout(3000);

const scrollContainers = await page.evaluate(() => {
  const result = [];
  document.querySelectorAll('*').forEach(el => {
    if (el.scrollHeight > el.clientHeight + 50 && el.clientHeight > 200) {
      const s = window.getComputedStyle(el);
      if (s.overflowY === 'scroll' || s.overflowY === 'auto' || el.tagName === 'BODY' || el.tagName === 'HTML') {
        result.push({
          tag: el.tagName,
          id: el.id,
          class: el.className.substring(0, 40),
          clientHeight: el.clientHeight,
          scrollHeight: el.scrollHeight,
          overflowY: s.overflowY
        });
      }
    }
  });
  return result;
});

console.log('Scroll Containers:', JSON.stringify(scrollContainers, null, 2));
await browser.close();
