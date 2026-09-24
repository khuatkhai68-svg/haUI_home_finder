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

// Close dialogs
await page.evaluate(() => {
  document.querySelectorAll('[aria-label="Đóng"], [aria-label="Close"]').forEach(el => {
    try { el.click(); } catch {}
  });
  document.querySelectorAll('[role="dialog"]').forEach(el => el.remove());
  document.body.style.overflow = 'auto';
  document.documentElement.style.overflow = 'auto';
});

console.log('Initial articles:', await page.$$eval('[role="article"]', els => els.length));

// Try scrolling with keyboard PageDown
for (let i = 1; i <= 5; i++) {
  await page.keyboard.press('PageDown');
  await page.waitForTimeout(1500);
  const count = await page.$$eval('[role="article"]', els => els.length);
  const scrollY = await page.evaluate(() => window.scrollY);
  console.log(`PageDown ${i}: articles = ${count}, scrollY = ${scrollY}`);
}

// Try window.scrollBy
for (let i = 1; i <= 5; i++) {
  await page.evaluate(() => window.scrollBy(0, 2000));
  await page.waitForTimeout(1500);
  const count = await page.$$eval('[role="article"]', els => els.length);
  const scrollY = await page.evaluate(() => window.scrollY);
  console.log(`scrollBy ${i}: articles = ${count}, scrollY = ${scrollY}`);
}

await browser.close();
