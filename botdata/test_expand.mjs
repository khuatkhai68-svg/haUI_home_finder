import { chromium } from './playwright-mcp/node_modules/playwright/index.mjs';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  locale: 'vi-VN'
});

await page.goto('https://www.facebook.com/groups/611511566512116/?locale=vi_VN', { waitUntil: 'domcontentloaded', timeout: 25000 });
await page.waitForTimeout(3000);

// Close dialogs
await page.evaluate(() => {
  document.querySelectorAll('[aria-label="Đóng"], [aria-label="Close"]').forEach(el => {
    try { el.click(); } catch {}
  });
  document.querySelectorAll('[role="dialog"]').forEach(el => el.remove());
});

// Click all "Xem thêm"
await page.evaluate(() => {
  document.querySelectorAll('div[role="button"], span[role="button"]').forEach(b => {
    const t = (b.innerText || '').trim();
    if (t === 'Xem thêm' || t === 'See more') {
      try { b.click(); } catch {}
    }
  });
});

await page.waitForTimeout(1000);

const articles = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('[role="article"]')).map(art => {
    const text = (art.innerText || '').trim();
    const links = Array.from(art.querySelectorAll('a')).map(a => a.href).filter(h => h.includes('/posts/') && !h.includes('comment_id'));
    return { text: text.substring(0, 300).replace(/\n/g, ' '), link: links[0] || '' };
  });
});

articles.forEach((a, i) => {
  console.log(`[${i}] link=${a.link}`);
  console.log(`    Text: ${a.text}`);
});

await browser.close();
