import path from 'path';
import { pathToFileURL } from 'url';

const pwPath = path.resolve('botdata/playwright-mcp/node_modules/playwright/index.mjs');
const pw = await import(pathToFileURL(pwPath).href);

async function testDeepScroll() {
  const browser = await pw.chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 900 },
    locale: 'vi-VN'
  });
  const page = await context.newPage();

  const url = 'https://www.facebook.com/groups/1896518147417522/?locale=vi_VN';
  console.log(`Opening ${url}...`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 35000 });
  await page.waitForTimeout(3000);

  // Dismiss overlays
  await page.evaluate(() => {
    document.querySelectorAll('[aria-label="Đóng"], [aria-label="Close"]').forEach(el => {
      try { el.click(); } catch {}
    });
    document.querySelectorAll('[role="dialog"]').forEach(el => el.remove());
    document.body.style.overflow = 'auto';
  });

  const capturedPosts = new Map();

  for (let step = 1; step <= 20; step++) {
    const articles = await page.evaluate(() => {
      const items = [];
      document.querySelectorAll('[role="article"], div[data-pagelet*="FeedUnit"]').forEach(art => {
        const text = (art.innerText || '').trim();
        if (text.length < 35) return;
        const link = art.querySelector('a[href*="/posts/"], a[href*="/permalink/"]');
        let postUrl = link ? link.href.split('?')[0] : '';
        items.push({ text, url: postUrl });
      });
      return items;
    });

    articles.forEach(a => {
      const key = a.text.substring(0, 60).replace(/\s+/g, '');
      if (!capturedPosts.has(key)) {
        capturedPosts.set(key, a);
      }
    });

    // Gradual scroll with mouse wheel and scrollBy
    await page.mouse.wheel(0, 1000);
    await page.waitForTimeout(1000);
  }

  console.log(`Deep scroll finished! Captured ${capturedPosts.size} unique posts:`);
  let i = 0;
  for (const [k, p] of capturedPosts) {
    i++;
    console.log(`[${i}] ${p.url || 'NO_URL'} | ${p.text.substring(0, 70).replace(/\n+/g, ' ')}...`);
  }

  await browser.close();
}

testDeepScroll();
