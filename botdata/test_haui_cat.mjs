import path from 'path';
import { pathToFileURL } from 'url';

const pwPath = path.resolve('botdata/playwright-mcp/node_modules/playwright/index.mjs');
const pw = await import(pathToFileURL(pwPath).href);
const browser = await pw.chromium.launch({ headless: true });
const page = await browser.newPage({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' });

console.log('Visiting phongtro123 haui category...');
try {
  await page.goto('https://phongtro123.com/cho-thue-phong-tro-dai-hoc-cong-nghiep-ha-noi', { timeout: 30000 });
  const title = await page.title();
  console.log('Page title:', title);

  const links = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a[href*="-pr"]'));
    return anchors.map(a => ({ title: a.innerText.trim(), href: a.href })).filter(x => x.title.length > 15);
  });
  console.log('Found listings count:', links.length);
  console.log('Sample listings:', links.slice(0, 5));
} catch (err) {
  console.error('Error:', err.message);
} finally {
  await browser.close();
}
