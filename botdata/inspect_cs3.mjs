import { chromium } from './playwright-mcp/node_modules/playwright/index.mjs';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  locale: 'vi-VN'
});

await page.goto('https://www.facebook.com/groups/611511566512116/?locale=vi_VN', { waitUntil: 'domcontentloaded', timeout: 25000 });
await page.waitForTimeout(3000);

await page.evaluate(() => {
  document.querySelectorAll('[aria-label="Đóng"], [aria-label="Close"]').forEach(el => {
    try { el.click(); } catch {}
  });
  document.querySelectorAll('[role="dialog"]').forEach(el => el.remove());
});

for (let s = 1; s <= 6; s++) {
  await page.evaluate(() => {
    const sc = Array.from(document.querySelectorAll('*')).find(el => el.scrollHeight > el.clientHeight + 100 && window.getComputedStyle(el).overflowY === 'auto') || document.documentElement;
    sc.scrollTop += 2000;
  });
  await page.waitForTimeout(1400);
}

const articles = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('[role="article"]')).map(art => {
    const text = (art.innerText || '').trim();
    const links = Array.from(art.querySelectorAll('a')).map(a => a.href).filter(h => h.includes('/posts/') && !h.includes('comment_id'));
    return { text: text.substring(0, 150).replace(/\n/g, ' '), link: links[0] || '' };
  });
});

console.log(`Found ${articles.length} articles in group 611511566512116:`);
articles.forEach((a, i) => console.log(`[${i}] link=${a.link}\n    ${a.text}`));

await browser.close();
