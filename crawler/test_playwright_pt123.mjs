import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pwPath = path.resolve(__dirname, '..', 'botdata', 'playwright-mcp', 'node_modules', 'playwright', 'index.mjs');

async function test() {
  const pw = await import(pathToFileURL(pwPath).href);
  const browser = await pw.chromium.launch({ headless: true });
  const page = await browser.newPage({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  });

  console.log('Navigating to phongtro123 Hà Nam...');
  await page.goto('https://phongtro123.com/tinh-thanh/ha-nam', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  const title = await page.title();
  console.log('Page Title:', title);

  const postCards = await page.$$eval('.post-item, .item, article, li.post-item, .post-listing li', items => {
    return items.map(el => {
      const a = el.querySelector('h3 a, .post-title a, a.post-link, a');
      const price = el.querySelector('.post-price, .price, .item-price')?.textContent?.trim();
      const addr = el.querySelector('.post-address, .address, .item-address, .location')?.textContent?.trim();
      return {
        title: a?.textContent?.trim(),
        href: a?.getAttribute('href'),
        price,
        addr
      };
    }).filter(i => i.href && i.href.includes('-pr'));
  });

  console.log(`Found ${postCards.length} post cards with selector:`);
  console.log(postCards.slice(0, 5));

  // If specific selector didn't match, let's extract all links ending with -pr*.html
  const allLinks = await page.$$eval('a[href*="-pr"]', links => {
    return [...new Set(links.map(a => ({
      href: a.href,
      text: a.innerText?.trim()
    })))].filter(l => l.text.length > 10);
  });

  console.log(`Found ${allLinks.length} distinct -pr links on page 1:`);
  console.log(allLinks.slice(0, 5));

  await browser.close();
}

test();
