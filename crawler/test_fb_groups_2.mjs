import { chromium } from '../botdata/playwright-mcp/node_modules/playwright/index.mjs';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const groups = [
    'https://www.facebook.com/groups/phongtrophulyhanam',
    'https://www.facebook.com/groups/phongtrokcndongvanhanam',
    'https://www.facebook.com/groups/2625290924409395', // let's see IDs
    'https://www.facebook.com/groups/378297619208077',
    'https://www.facebook.com/groups/phongtrohaui'
  ];

  for (const g of groups) {
    try {
      console.log(`Checking: ${g}`);
      await page.goto(g, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(3000);
      const title = await page.title();
      const content = await page.evaluate(() => {
        // look for posts, text, aria-labels
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, div[role="feed"], div[role="article"]')).map(el => el.innerText.trim()).filter(Boolean);
        return {
          headings: headings.slice(0, 5),
          fullSnippet: document.body.innerText.slice(0, 400).replace(/\n+/g, ' ')
        };
      });
      console.log(`Title: ${title}\nContent:`, JSON.stringify(content, null, 2));
    } catch (e) {
      console.log(`Error: ${e.message}`);
    }
  }

  await browser.close();
}

main().catch(console.error);
