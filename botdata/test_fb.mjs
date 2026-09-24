import { chromium } from './playwright-mcp/node_modules/playwright/index.mjs';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  locale: 'vi-VN'
});
const page = await context.newPage();

const urls = [
  'https://www.facebook.com/hashtag/phongtronhon',
  'https://www.facebook.com/hashtag/nhatrohaui',
  'https://www.facebook.com/hashtag/phongtrophuvan',
  'https://www.facebook.com/groups/1896518147417522/',
  'https://www.facebook.com/groups/447547838952346/'
];

for (const u of urls) {
  try {
    await page.goto(u, { timeout: 20000, waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const title = await page.title();
    const articles = await page.$$eval('[role="article"]', els => els.length);
    const links = await page.$$eval('a[href*="/posts/"], a[href*="/permalink/"]', els => els.map(a => a.href));
    console.log(u, '=> Title:', title, '| Articles:', articles, '| Unique Post links:', new Set(links).size);
    if (links.length > 0) {
      console.log('   Sample link:', links[0]);
    }
  } catch (e) {
    console.log(u, '=> Error:', e.message);
  }
}

await browser.close();
