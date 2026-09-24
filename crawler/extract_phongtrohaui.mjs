import { chromium } from '../botdata/playwright-mcp/node_modules/playwright/index.mjs';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 }
  });
  const page = await context.newPage();

  console.log('Inspecting https://www.facebook.com/phongtrohaui ...');
  await page.goto('https://www.facebook.com/phongtrohaui', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(4000);

  const posts = await page.evaluate(() => {
    const articles = Array.from(document.querySelectorAll('[role="article"], div[data-pagelet*="FeedUnit"]'));
    return articles.map(a => ({
      text: a.innerText,
      links: Array.from(a.querySelectorAll('a')).map(l => l.href)
    }));
  });

  console.log(`Extracted ${posts.length} posts:`);
  posts.forEach((p, i) => {
    console.log(`\n--- POST ${i + 1} ---`);
    console.log(p.text.slice(0, 300));
  });

  await browser.close();
}

main().catch(console.error);
