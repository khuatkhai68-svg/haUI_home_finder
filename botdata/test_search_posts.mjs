import { chromium } from './playwright-mcp/node_modules/playwright/index.mjs';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  locale: 'vi-VN'
});

const queries = [
  'site:facebook.com/groups "nhà trọ" "nhổn"',
  'site:facebook.com/groups "phòng trọ" "đại học công nghiệp"',
  'site:facebook.com/groups "phòng trọ" "phù vân"',
  'site:facebook.com/groups "phòng trọ" "tây tựu"'
];

for (const q of queries) {
  const url = 'https://www.google.com/search?q=' + encodeURIComponent(q) + '&hl=vi';
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const links = await page.$$eval('a[href*="facebook.com/groups/"]', els => els.map(a => a.href));
  console.log(`Google: ${q} => Found ${links.length} group links`);
  new Set(links).forEach(l => console.log('  ->', l));
}

await browser.close();
