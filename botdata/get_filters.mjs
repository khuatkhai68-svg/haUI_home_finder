import { chromium } from './playwright-mcp/node_modules/playwright/index.mjs';

async function getPriceFilters() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://phongtro123.com/tinh-thanh/ha-noi/quan-bac-tu-liem', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const priceLinks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a'))
      .filter(a => a.innerText.includes('Từ 2 - 3 triệu') || a.innerText.includes('2 - 3 triệu') || a.href.includes('tu-2-den-3-trieu'))
      .map(a => ({ text: a.innerText.trim(), href: a.href }));
  });

  console.log('Price filter links:', priceLinks);
  await browser.close();
}

getPriceFilters();
