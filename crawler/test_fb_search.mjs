import { chromium } from '../botdata/playwright-mcp/node_modules/playwright/index.mjs';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 }
  });

  const searchUrls = [
    'https://www.facebook.com/search/posts/?q=ph%C3%B2ng%20tr%E1%BB%8D%20ph%E1%BB%A7%20l%C3%BD%20h%C3%A0%20nam',
    'https://www.facebook.com/search/groups/?q=ph%C3%B2ng%20tr%E1%BB%8D%20h%C3%A0%20nam'
  ];

  for (const url of searchUrls) {
    try {
      console.log(`Navigating to: ${url}`);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(3000);
      const title = await page.title();
      const finalUrl = page.url();
      const bodySnippet = await page.evaluate(() => document.body.innerText.slice(0, 300).replace(/\n+/g, ' '));
      console.log(`Result:
  Title: ${title}
  Final URL: ${finalUrl}
  Body: ${bodySnippet}
----------------------------------------`);
    } catch (e) {
      console.log(`Error: ${e.message}`);
    }
  }

  await browser.close();
}

main().catch(console.error);
