import { chromium } from '../botdata/playwright-mcp/node_modules/playwright/index.mjs';

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  const testUrls = [
    'https://www.facebook.com/groups/phongtrodhcnhanam/',
    'https://www.facebook.com/groups/phongtrophulyhanam/',
    'https://www.facebook.com/groups/phongtrokcndongvanhanam/'
  ];

  for (const url of testUrls) {
    console.log(`Checking ${url}...`);
    try {
      const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(3000);
      const title = await page.title();
      const currentUrl = page.url();
      const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 300));
      console.log(`Result:
  Status: ${resp ? resp.status() : 'null'}
  Title: ${title}
  Final URL: ${currentUrl}
  Body preview: ${bodyText.replace(/\n+/g, ' ')}
---------------------------------------------`);
    } catch (e) {
      console.log(`Failed ${url}: ${e.message}`);
    }
  }

  await browser.close();
}

main().catch(console.error);
