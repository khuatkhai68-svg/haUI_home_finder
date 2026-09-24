import { chromium, devices } from './playwright-mcp/node_modules/playwright/index.mjs';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const pixel = devices['Pixel 5'];
  const context = await browser.newContext({ ...pixel, locale: 'vi-VN' });
  const page = await context.newPage();

  const url = 'https://m.facebook.com/groups/1896518147417522/';
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Dismiss any banner
  await page.evaluate(() => {
    document.querySelectorAll('[aria-label="Đóng"], [aria-label="Close"], button[value="OK"]').forEach(el => {
      try { el.click(); } catch{}
    });
  });

  const postsMap = new Map();

  for (let s = 0; s < 15; s++) {
    // Collect articles
    const batch = await page.evaluate(() => {
      const items = [];
      const articles = document.querySelectorAll('article, [role="article"], div[data-tracking-duration-id]');
      articles.forEach(art => {
        const text = (art.innerText || '').trim();
        if (text.length < 35) return;
        const link = art.querySelector('a[href*="/posts/"], a[href*="story_fbid="], a[href*="/permalink/"]');
        const href = link ? link.href : '';
        const imgs = Array.from(art.querySelectorAll('img'))
          .map(i => i.src)
          .filter(s => s && s.includes('scontent') && !s.includes('s60x60') && !s.includes('p50x50'));
        items.push({ text, href, imgs });
      });
      return items;
    });

    for (const b of batch) {
      const k = b.text.slice(0, 60).replace(/\s+/g, '');
      if (!postsMap.has(k)) {
        postsMap.set(k, b);
      }
    }

    // Scroll down or click see more
    await page.evaluate(() => {
      window.scrollBy(0, 1500);
      const moreBtn = Array.from(document.querySelectorAll('a, button, span')).find(el => el.innerText && el.innerText.includes('Xem thêm bài viết'));
      if (moreBtn) moreBtn.click();
    });
    await page.waitForTimeout(1500);
  }

  console.log('Total posts collected from mobile:', postsMap.size);
  Array.from(postsMap.values()).slice(0, 5).forEach((p, idx) => {
    console.log(`\n[Post ${idx}]:`);
    console.log(p.text.slice(0, 150).replace(/\n+/g, ' '));
  });

  await browser.close();
}

main().catch(console.error);
