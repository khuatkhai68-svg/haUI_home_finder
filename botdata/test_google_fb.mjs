import path from 'path';
import { pathToFileURL } from 'url';

const pwPath = path.resolve('botdata/playwright-mcp/node_modules/playwright/index.mjs');
const pw = await import(pathToFileURL(pwPath).href);

async function testGoogleFbSearch() {
  const browser = await pw.chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 900 },
    locale: 'vi-VN'
  });
  const page = await context.newPage();

  const query = 'site:facebook.com/groups/1896518147417522 "phòng"';
  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=30&hl=vi`;
  console.log(`Searching Google: ${url}...`);

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
  await page.waitForTimeout(2000);

  const results = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a[href*="facebook.com/groups/"]'));
    return anchors.map(a => {
      const href = a.href || '';
      const title = a.innerText?.trim() || '';
      const snippet = a.closest('div')?.parentElement?.innerText?.substring(0, 150) || '';
      return { href, title, snippet };
    }).filter(x => x.href.includes('/posts/') || x.href.includes('/permalink/'));
  });

  console.log(`Found ${results.length} real Facebook post links in Google!`);
  results.slice(0, 5).forEach((r, idx) => {
    console.log(`[${idx+1}] URL: ${r.href}`);
    console.log(`    Title: ${r.title.substring(0, 60)}`);
  });

  await browser.close();
}

testGoogleFbSearch();
