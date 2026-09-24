import path from 'path';
import { pathToFileURL } from 'url';

const pwPath = path.resolve('botdata/playwright-mcp/node_modules/playwright/index.mjs');
const pw = await import(pathToFileURL(pwPath).href);
const browser = await pw.chromium.launch({ headless: true });
const page = await browser.newPage({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' });

const urls = [
  'https://phongtro123.com/tinh-thanh/ha-noi/quan-bac-tu-liem/phuong-minh-khai',
  'https://phongtro123.com/tinh-thanh/ha-noi/quan-bac-tu-liem/phuong-phuc-dien',
  'https://phongtro123.com/tinh-thanh/ha-noi/quan-nam-tu-liem/phuong-phuong-canh',
  'https://phongtro123.com/tinh-thanh/ha-noi/quan-nam-tu-liem/phuong-xuan-phuong'
];

for (const u of urls) {
  try {
    await page.goto(u, { timeout: 25000 });
    const title = await page.title();
    const links = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('a[href*="-pr"]'));
      return items.map(a => a.href).filter(h => h.endsWith('.html'));
    });
    console.log(`[URL]: ${u}`);
    console.log(`Title: ${title} | Found links: ${links.length}`);
  } catch (err) {
    console.error(`Error ${u}:`, err.message);
  }
}

await browser.close();
