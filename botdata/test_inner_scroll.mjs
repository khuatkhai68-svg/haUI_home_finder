import { chromium } from './playwright-mcp/node_modules/playwright/index.mjs';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  locale: 'vi-VN',
  viewport: { width: 1366, height: 900 }
});

await page.goto('https://www.facebook.com/groups/1896518147417522/?locale=vi_VN', { waitUntil: 'domcontentloaded', timeout: 25000 });
await page.waitForTimeout(3000);

// Close dialogs
await page.evaluate(() => {
  document.querySelectorAll('[aria-label="Đóng"], [aria-label="Close"]').forEach(el => {
    try { el.click(); } catch {}
  });
  document.querySelectorAll('[role="dialog"]').forEach(el => el.remove());
});

for (let i = 1; i <= 8; i++) {
  const res = await page.evaluate(() => {
    const sc = Array.from(document.querySelectorAll('*')).find(el => el.scrollHeight > el.clientHeight + 100 && window.getComputedStyle(el).overflowY === 'auto') || document.documentElement;
    sc.scrollTop += 2000;
    return {
      scrollTop: sc.scrollTop,
      scrollHeight: sc.scrollHeight,
      articles: document.querySelectorAll('[role="article"]').length
    };
  });
  console.log(`Scroll ${i}: articles = ${res.articles}, scrollTop = ${res.scrollTop}, scrollHeight = ${res.scrollHeight}`);
  await page.waitForTimeout(1500);
}

await browser.close();
