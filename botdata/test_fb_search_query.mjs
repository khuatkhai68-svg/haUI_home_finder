import path from 'path';
import { pathToFileURL } from 'url';

const pwPath = path.resolve('botdata/playwright-mcp/node_modules/playwright/index.mjs');
const pw = await import(pathToFileURL(pwPath).href);
const browser = await pw.chromium.launch({ headless: true });
const context = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  viewport: { width: 1366, height: 900 },
  locale: 'vi-VN'
});
const page = await context.newPage();

const testUrl = 'https://www.facebook.com/groups/1896518147417522/search/posts/?q=cho%20thu%C3%AA%20ph%C3%B2ng';
console.log('Visiting group search:', testUrl);
try {
  await page.goto(testUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3500);

  // Dismiss overlays
  await page.evaluate(() => {
    document.querySelectorAll('[aria-label="Đóng"], [aria-label="Close"]').forEach(el => {
      try { el.click(); } catch {}
    });
    document.querySelectorAll('[role="dialog"]').forEach(el => el.remove());
  });

  const count = await page.evaluate(() => {
    const articles = document.querySelectorAll('[role="article"], div[data-pagelet*="FeedUnit"]');
    return articles.length;
  });
  console.log('Articles found in search:', count);

  const sample = await page.evaluate(() => {
    const arts = document.querySelectorAll('[role="article"], div[data-pagelet*="FeedUnit"]');
    return Array.from(arts).slice(0, 5).map(a => {
      const text = (a.innerText || '').substring(0, 100).replace(/\n+/g, ' | ');
      const link = a.querySelector('a[href*="/posts/"], a[href*="/permalink/"]');
      return { text, url: link ? link.href.split('?')[0] : '' };
    });
  });
  console.log('Sample search results:', sample);
} catch (e) {
  console.error('Error:', e.message);
} finally {
  await browser.close();
}
