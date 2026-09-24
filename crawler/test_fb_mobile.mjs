import { chromium } from '../botdata/playwright-mcp/node_modules/playwright/index.mjs';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    userAgent: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
  });

  const urls = [
    'https://m.facebook.com/groups/phongtrodhcnhanam/',
    'https://mbasic.facebook.com/groups/phongtrodhcnhanam/',
    'https://www.facebook.com/phongtrohaui/',
    'https://www.facebook.com/DaiHocCongNghiepHaNoiCoSo3/'
  ];

  for (const u of urls) {
    try {
      console.log(`Testing: ${u}`);
      const resp = await page.goto(u, { waitUntil: 'domcontentloaded', timeout: 12000 });
      await page.waitForTimeout(2000);
      const text = await page.evaluate(() => document.body.innerText.slice(0, 300));
      console.log(`URL: ${page.url()}\nText: ${text.replace(/\n+/g, ' ')}\n---`);
    } catch (e) {
      console.log(`Error ${u}: ${e.message}`);
    }
  }

  await browser.close();
}

main().catch(console.error);
