import { chromium } from '../botdata/playwright-mcp/node_modules/playwright/index.mjs';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 }
  });

  const query = 'site:facebook.com/groups "phong tro" "ha nam" OR "phu ly"';
  console.log(`Searching Google for: ${query}`);
  await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}&num=20`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(3000);

  const results = await page.evaluate(() => {
    const items = [];
    document.querySelectorAll('div.g, div[data-hveid]').forEach(el => {
      const a = el.querySelector('a');
      const h3 = el.querySelector('h3');
      const snippet = el.innerText;
      if (a && h3 && a.href.includes('facebook.com')) {
        items.push({
          title: h3.innerText,
          url: a.href,
          snippet: snippet.slice(0, 200).replace(/\n+/g, ' ')
        });
      }
    });
    return items;
  });

  console.log(`Found ${results.length} results:`);
  console.log(JSON.stringify(results.slice(0, 10), null, 2));

  await browser.close();
}

main().catch(console.error);
