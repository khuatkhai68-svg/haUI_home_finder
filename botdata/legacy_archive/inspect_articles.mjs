import { chromium } from './playwright-mcp/node_modules/playwright/index.mjs';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  locale: 'vi-VN',
  viewport: { width: 1366, height: 900 }
});

await page.goto('https://www.facebook.com/groups/1896518147417522/?locale=vi_VN', { waitUntil: 'domcontentloaded', timeout: 25000 });
await page.waitForTimeout(3000);

await page.evaluate(() => {
  document.querySelectorAll('[aria-label="Đóng"], [aria-label="Close"]').forEach(el => {
    try { el.click(); } catch {}
  });
  document.querySelectorAll('[role="dialog"]').forEach(el => el.remove());
});

for (let i = 1; i <= 6; i++) {
  await page.evaluate(() => {
    const sc = Array.from(document.querySelectorAll('*')).find(el => el.scrollHeight > el.clientHeight + 100 && window.getComputedStyle(el).overflowY === 'auto') || document.documentElement;
    sc.scrollTop += 2000;
  });
  await page.waitForTimeout(1500);
}

const posts = await page.evaluate(() => {
  const articles = document.querySelectorAll('[role="article"]');
  return Array.from(articles).map((art, idx) => {
    const text = (art.innerText || '').trim();
    const links = Array.from(art.querySelectorAll('a')).map(a => a.href).filter(h => h.includes('/posts/') || h.includes('/permalink/') || h.includes('story_fbid=') || h.includes('/user/'));
    return {
      idx,
      textLength: text.length,
      sampleText: text.substring(0, 100).replace(/\n/g, ' '),
      links
    };
  });
});

console.log('Total articles found:', posts.length);
posts.forEach(p => {
  console.log(`[${p.idx}] len=${p.textLength} | links=${p.links.length}`);
  console.log(`   Text: ${p.sampleText}`);
  if (p.links.length > 0) console.log(`   Link: ${p.links[0]}`);
});

await browser.close();
