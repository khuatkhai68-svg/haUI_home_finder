import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pwPath = path.resolve(__dirname, '..', 'botdata', 'playwright-mcp', 'node_modules', 'playwright', 'index.mjs');

async function countHaNamLinks() {
  const pw = await import(pathToFileURL(pwPath).href);
  const browser = await pw.chromium.launch({ headless: true });
  const page = await browser.newPage({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  });

  const allLinks = new Map();

  for (let p = 1; p <= 10; p++) {
    const url = p === 1 ? 'https://phongtro123.com/tinh-thanh/ha-nam' : `https://phongtro123.com/tinh-thanh/ha-nam?page=${p}`;
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(1000);
      const links = await page.$$eval('a[href*="-pr"]', els => {
        return els.map(a => ({
          href: a.href,
          text: a.innerText?.trim()
        })).filter(i => i.text.length > 8);
      });

      let addedThisPage = 0;
      for (const item of links) {
        if (!allLinks.has(item.href)) {
          allLinks.set(item.href, item.text);
          addedThisPage++;
        }
      }
      console.log(`Page ${p}: added ${addedThisPage} new links. Total unique: ${allLinks.size}`);
      if (addedThisPage === 0) break;
    } catch (e) {
      console.log(`Page ${p} error:`, e.message);
      break;
    }
  }

  console.log(`\n=> Total unique Ha Nam listings on phongtro123: ${allLinks.size}`);
  await browser.close();
}

countHaNamLinks();
