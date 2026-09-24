import { chromium } from './playwright-mcp/node_modules/playwright/index.mjs';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  locale: 'vi-VN',
  viewport: { width: 1366, height: 900 }
});
const page = await context.newPage();

await page.goto('https://www.facebook.com/groups/1896518147417522/?locale=vi_VN', { waitUntil: 'domcontentloaded', timeout: 25000 });
await page.waitForTimeout(3000);

for (let i = 1; i <= 6; i++) {
  await page.evaluate(() => {
    document.querySelectorAll('[aria-label="Đóng"], [aria-label="Close"]').forEach(el => {
      try { el.click(); } catch {}
    });
    document.querySelectorAll('[role="dialog"]').forEach(el => el.remove());
    document.body.style.overflow = 'auto';
  });

  await page.mouse.wheel(0, 1500);
  await page.waitForTimeout(1500);

  const count = await page.$$eval('[role="article"]', els => els.length);
  const links = await page.$$eval('a[href*="/posts/"], a[href*="/permalink/"]', els => new Set(els.map(a => a.href.split('?')[0])).size);
  console.log(`Scroll ${i}: articles = ${count}, unique post links = ${links}`);
}

await browser.close();
